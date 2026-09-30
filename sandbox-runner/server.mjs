import http from "node:http";
import { mkdtemp, rm, mkdir, stat, readdir, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { reconcileSeed, snapshotWorkspace, SNAPSHOT_VERSION } from "./sync.mjs";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const GUARDED_PYTHON = fileURLToPath(new URL("./guarded/run_guarded.py", import.meta.url));
const MAX_PYTHON_SAFE_INPUT = 32_000;
// Seeds carry the workspace's project files from Neon, so the body limit is generous.
const MAX_BODY = Number(process.env.MAX_BODY_BYTES) || 32 * 1024 * 1024;
const RUNNER_VERSION = 6;
const RUNNER_RUNTIMES = ["node", "javascript", "python", "python-safe", "bash", "go", "rust", "java", "cpp"];
const MAX_OUTPUT = 64 * 1024;
const TIMEOUT_MS = Math.min(300000, Math.max(1000, Number(process.env.COMMAND_TIMEOUT_MS || process.env.SANDBOX_TIMEOUT_MS) || 120000));
const DEV_TIMEOUT_MS = Math.min(300000, Math.max(1000, Number(process.env.SANDBOX_DEV_TIMEOUT_MS) || 180000));
const WORKSPACE_REPO = process.env.WORKSPACE_REPO || "";
const sessions = new Map();
const RUNNER_TOKEN = process.env.RUNNER_TOKEN || "";
const MAX_ACTIVE_RUNS = Math.max(1, Number(process.env.MAX_ACTIVE_RUNS || 2));
let activeRuns = 0;
function authorized(req) {
  if (!RUNNER_TOKEN) return false;
  const header = req.headers.authorization || "";
  return header === `Bearer ${RUNNER_TOKEN}`;
}
function acquireRunSlot() {
  if (activeRuns >= MAX_ACTIVE_RUNS) throw new Error("runner_busy");
  activeRuns += 1;
  return () => { activeRuns = Math.max(0, activeRuns - 1); };
}

// Workspaces persist on this runner's disk only; they are not security boundaries.
const workspaceRoot = process.env.WORKSPACE_ROOT || join(tmpdir(), "bossnu-workspaces");
const busyWorkspaces = new Set();
const workspaceTTL = Number(process.env.WORKSPACE_TTL_MS) || 86400000;
function executionEnv(cwd) {
  return { PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin", HOME: cwd, LANG: "C.UTF-8", HOST: "0.0.0.0",
    CI: "1", PYTHONNOUSERSITE: "1", PYTHONDONTWRITEBYTECODE: "1", PYTHONUNBUFFERED: "1",
    npm_config_yes: "true", npm_config_audit: "false", npm_config_fund: "false",
    npm_config_update_notifier: "false", npm_config_progress: "false", npm_config_loglevel: "error" };
}
async function acquireWorkspace(id) {
  if (id === undefined) {
    const dir = await mkdtemp(join(tmpdir(), "bossnu-work-"));
    await cloneWorkspace(dir);
    return { dir, fresh: true };
  }
  if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error("invalid_workspace");
  if (busyWorkspaces.has(id)) throw new Error("workspace_busy");
  busyWorkspaces.add(id);
  const dir = join(workspaceRoot, id);
  try {
    await mkdir(workspaceRoot, { recursive: true });
    let fresh = false;
    try { await stat(dir); } catch {
      await mkdir(dir);
      fresh = true;
      try { await cloneWorkspace(dir); } catch (error) { await rm(dir, { recursive: true, force: true }); throw error; }
    }
    await utimes(dir, new Date(), new Date());
    return { dir, fresh };
  } catch (error) { busyWorkspaces.delete(id); throw error; }
}
async function releaseWorkspace(dir, id, keep) {
  try {
    if (id !== undefined) await utimes(dir, new Date(), new Date());
    else if (!keep) await rm(dir, { recursive: true, force: true });
  } finally { busyWorkspaces.delete(id); }
}
setInterval(async () => {
  for (const id of await readdir(workspaceRoot).catch(() => [])) {
    if (busyWorkspaces.has(id) || [...sessions.values()].some(s => s.cwd === join(workspaceRoot, id) && !s.exited)) continue;
    const dir = join(workspaceRoot, id);
    const info = await stat(dir).catch(() => null);
    if (info && !busyWorkspaces.has(id) && Date.now() - info.mtimeMs > workspaceTTL) {
      busyWorkspaces.add(id);
      try { await rm(dir, { recursive: true, force: true }); } finally { busyWorkspaces.delete(id); }
    }
  }
}, 60000).unref();

function send(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": process.env.ALLOW_ORIGIN || "*",
    "access-control-allow-methods": "POST,GET,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  });
  res.end(JSON.stringify(body));
}
async function readBody(req) {
  let size = 0; const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("Request too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}
function append(target, chunk) { return (target + chunk.toString("utf8")).slice(-MAX_OUTPUT); }
function spawnProcess(command, args, cwd, timeoutMs, signal, stdin = "", extraStdin) {
  return new Promise((resolve) => {
    const stdio = extraStdin === undefined ? ["pipe", "pipe", "pipe"] : ["pipe", "pipe", "pipe", "pipe"];
    const child = spawn(command, args, {
      cwd,
      env: executionEnv(cwd),
      detached: true, stdio,
    });
    child.stdin.end(stdin, "utf8");
    if (extraStdin !== undefined) child.stdio[3].end(extraStdin, "utf8");
    const cancel = () => { try { process.kill(-child.pid, "SIGKILL"); } catch { /* intentionally ignored */ } };
    let stdout = "", stderr = "", timedOut = false;
    signal?.addEventListener("abort", cancel, { once: true });
    if (signal?.aborted) cancel();
    const timer = setTimeout(() => {
      timedOut = true;
      try { process.kill(-child.pid, "SIGKILL"); } catch { /* intentionally ignored */ }
    }, timeoutMs);
    child.stdout.on("data", c => { stdout = append(stdout, c); });
    child.stderr.on("data", c => { stderr = append(stderr, c); });
    child.on("error", e => { stderr = append(stderr, e); });
    child.on("close", (code, exitSignal) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      cancel();
      resolve({ stdout, stderr, exitCode: code, signal: exitSignal, timedOut });
    });
  });
}
/** Runner result fields describing the workspace after a command. */
async function workspaceResult(dir, seed, body = {}) {
  const snapshot = await snapshotWorkspace(dir).catch((error) => ({
    version: SNAPSHOT_VERSION, root: "project/", files: [], paths: [], skipped: [], complete: false,
    manifestHash: "", fileCount: 0, totalBytes: 0, takenAt: new Date().toISOString(), error: String(error?.message || error),
  }));
  // v5 apps send `snapshot: 1` and only need the snapshot; older app builds
  // still get the legacy (v4) fields. Never send contents twice.
  if (Number(body.snapshot) >= SNAPSHOT_VERSION) return { workspaceSnapshot: snapshot, workspaceSeed: seed };
  return {
    workspaceSnapshot: snapshot,
    workspaceSeed: seed,
    workspaceFiles: snapshot.files.map(({ path, content }) => ({ path, content })),
    workspaceSyncComplete: snapshot.complete,
  };
}

async function seed(workspace, body) {
  if (!Array.isArray(body.workspaceFiles) && !body.workspaceBase) return { mode: "none", written: [], deleted: [], conflicts: [], rejected: [] };
  return reconcileSeed({ dir: workspace.dir, fresh: workspace.fresh, files: body.workspaceFiles, base: body.workspaceBase });
}

async function cloneWorkspace(dir) {
  if (!WORKSPACE_REPO) return;
  const r = await spawnProcess("git", ["clone", "--depth", "1", WORKSPACE_REPO, dir], tmpdir(), 60000);
  if (r.exitCode !== 0) throw new Error(r.stderr || "workspace_clone_failed");
}
function startPersistent(command, args, cwd) {
  const child = spawn(command, args, {
    cwd, env: executionEnv(cwd),
    detached: true, stdio: ["pipe", "pipe", "pipe"],
  });
  child.stdin.end();
  let stdout = "", stderr = "";
  child.on("error", e => { stderr = append(stderr, e); });
  const lifetime = setTimeout(() => { try { process.kill(-child.pid, "SIGKILL"); } catch { /* intentionally ignored */ } }, 30 * 60 * 1000);
  lifetime.unref();
  child.stdout.on("data", c => { stdout = append(stdout, c); });
  child.stderr.on("data", c => { stderr = append(stderr, c); });
  const sessionId = "sb_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  const session = { id: sessionId, child, cwd, stdout: () => stdout, stderr: () => stderr, createdAt: Date.now(), exited: false };
  sessions.set(sessionId, session);
  child.on("exit", () => {
    clearTimeout(lifetime);
    session.exited = true;
    setTimeout(() => sessions.delete(sessionId), 10 * 60 * 1000);
  });
  return session;
}
async function prepareNode(dir) {
  const r = await spawnProcess("npm", ["install", "--no-audit", "--no-fund"], dir, DEV_TIMEOUT_MS);
  return r;
}
function detectPort(session) {
  const text = session.stdout() + " " + session.stderr();
  const m = text.match(/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)[:\s]+(\d{2,5})/i) || text.match(/port\s+(\d{2,5})/i);
  return Number(m && m[1] || 5173);
}
function sseHeaders(res) {
  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "access-control-allow-origin": process.env.ALLOW_ORIGIN || "*",
    "access-control-allow-methods": "POST,GET,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  });
}
function sse(res, event) {
  if (res.destroyed) return;
  res.write("data: " + JSON.stringify(event) + "\n\n");
}
function commandText(body, language) {
  const raw = typeof body.command === "string" ? body.command : "";
  return language === "python-safe" ? raw : raw.trim();
}
function pythonProgramInput(body, language) {
  const value = language === "python-safe" && typeof body.stdin === "string" ? body.stdin : "";
  if (value.length > MAX_PYTHON_SAFE_INPUT) throw new Error("stdin_too_large");
  return value;
}
async function spawnExecution(language, command, stdin, cwd) {
  const raw = language === "javascript" ? "node" : language;
  const specs = {
    node: { file: "main.mjs", command: "node", args: ["main.mjs"] },
    python: { file: "main.py", command: "python3", args: ["main.py"] },
    go: { file: "main.go", command: "go", args: ["run", "main.go"] },
    rust: { file: "main.rs", command: "sh", args: ["-c", "rustc main.rs -o main_bin && ./main_bin"] },
    java: { file: "Main.java", command: "java", args: ["Main.java"] },
    cpp: { file: "main.cpp", command: "sh", args: ["-c", "g++ -std=c++20 main.cpp -O2 -o main_bin && ./main_bin"] },
  };
  if (raw === "python-safe") {
    const child = spawn("python3", ["-I", "-S", "-u", GUARDED_PYTHON], {
      cwd, env: executionEnv(cwd), detached: true,
      stdio: ["pipe", "pipe", "pipe", "pipe"],
    });
    child.stdin.end(command, "utf8");
    child.stdio[3].end(stdin, "utf8");
    return child;
  }
  const spec = specs[raw];
  if (spec) {
    await writeFile(join(cwd, spec.file), command, "utf8");
    const child = spawn(spec.command, spec.args, {
      cwd, env: executionEnv(cwd), detached: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    child.stdin.end(stdin, "utf8");
    return child;
  }
  const child = spawn("bash", ["-c", command], {
    cwd, env: executionEnv(cwd), detached: true,
    stdio: ["pipe", "pipe", "pipe"],
  });
  child.stdin.end(stdin, "utf8");
  return child;
}
async function executeStream(body, res) {
  const language = String(body.language || "bash").toLowerCase();
  const command = commandText(body, language);
  const stdin = pythonProgramInput(body, language);
  if (!command.trim()) throw new Error("command_required");
  if (command.length > 32000) throw new Error("command_too_large");
  const workspace = await acquireWorkspace(body.workspace);
  const dir = workspace.dir;
  let keep = false;
  const started = Date.now();
  try {
    const seedReport = await seed(workspace, body);
    sseHeaders(res);
    sse(res, { type: "status", status: "queued", message: "รับคำสั่ง Sandbox" });
    if (seedReport.written.length || seedReport.deleted.length || seedReport.conflicts.length) {
      sse(res, { type: "status", status: "seeded", message: `Seed จาก Neon • เขียน ${seedReport.written.length} • ลบ ${seedReport.deleted.length} • ขัดแย้ง ${seedReport.conflicts.length}` });
    }
    sse(res, { type: "status", status: "running", message: "กำลังรันจริงใน Sandbox Runner" });
    if ((language === "node" || language === "javascript") && /^npm\s+run\s+dev\b/i.test(command)) {
      const install = await prepareNode(dir);
      if (install.exitCode !== 0) {
        sse(res, { type: "output", stream: "stderr", text: install.stderr || install.stdout });
        sse(res, { type: "complete", result: { success: false, status: "error", type: language, runtime: language, command, stdout: install.stdout, stderr: install.stderr, exitCode: install.exitCode, durationMs: Date.now() - started, ...(await workspaceResult(dir, seedReport, body)) } });
        return; // ended by the caller after the workspace lock is released
      }
      const session = startPersistent("npm", ["run", "dev", "--", "--host", "0.0.0.0"], dir);
      keep = true;
      const sendOutput = () => {
        const out = session.stdout();
        const err = session.stderr();
        if (out) sse(res, { type: "output", stream: "stdout", text: out });
        if (err) sse(res, { type: "output", stream: "stderr", text: err });
      };
      await new Promise(r => setTimeout(r, 2200));
      sendOutput();
      const port = detectPort(session);
      const result = {
        success: !session.exited,
        status: session.exited ? "error" : "running",
        type: session.exited ? "node" : "dev-server",
        runtime: language, label: "Node.js", command,
        stdout: session.stdout(), stderr: session.stderr(),
        output: [session.stdout(), session.stderr()].filter(Boolean).join("\n").trim().slice(-MAX_OUTPUT),
        sessionId: session.id, port, previewPath: "/preview/" + session.id + "/",
        durationMs: Date.now() - started,
        ...(await workspaceResult(dir, seedReport, body)),
      };
      sse(res, { type: "complete", result });
      return; // ended by the caller after the workspace lock is released
    }
    const child = await spawnExecution(language, command, stdin, dir);
    const cancel = () => { try { process.kill(-child.pid, "SIGKILL"); } catch { /* intentionally ignored */ } };
    let stdout = "", stderr = "", timedOut = false;
    res.on("close", cancel);
    if (res.destroyed) cancel();
    const timer = setTimeout(() => { timedOut = true; try { process.kill(-child.pid, "SIGKILL"); } catch { /* intentionally ignored */ } }, TIMEOUT_MS);
    let sentBytes = 0;
    const output = (stream, chunk) => {
      const remaining = MAX_OUTPUT - sentBytes;
      if (remaining <= 0) return;
      const limited = chunk.subarray(0, remaining); sentBytes += limited.length;
      sse(res, { type: "output", stream, text: limited.toString("utf8") });
    };
    child.stdout.on("data", c => { stdout=append(stdout,c); output("stdout", c); });
    child.stderr.on("data", c => { stderr=append(stderr,c); output("stderr", c); });
    await new Promise(resolve => {
      child.on("error", e => { stderr=append(stderr,e); });
      child.on("close", code => {
        clearTimeout(timer); res.off("close", cancel); cancel();
        const status = timedOut ? "timeout" : code === 0 ? "success" : "error";
        const durationMs = Date.now() - started;
        workspaceResult(dir, seedReport, body).then(workspace => {
          sse(res, { type: "complete", result: { success: status === "success", status, type: language, runtime: language, command, stdout, stderr, output: [stdout, stderr].filter(Boolean).join("\n").trim(), exitCode: code, durationMs, ...workspace } });
          resolve();
        });
      });
    });
    return; // ended by the caller after the workspace lock is released
  } finally {
    await releaseWorkspace(dir, body.workspace, keep);
  }
}

async function execute(body, signal) {
  const language = String(body.language || "bash").toLowerCase();
  const command = commandText(body, language);
  const stdin = pythonProgramInput(body, language);
  if (!command.trim()) throw new Error("command_required");
  if (command.length > 32000) throw new Error("command_too_large");

  const workspace = await acquireWorkspace(body.workspace);
  const dir = workspace.dir;
  let keep = false;
  try {
    const seedReport = await seed(workspace, body);
    if ((language === "node" || language === "javascript") && /^npm\s+run\s+dev\b/i.test(command)) {
      const install = await prepareNode(dir);
      if (install.exitCode !== 0) return { status: "error", stdout: install.stdout, stderr: install.stderr, exitCode: install.exitCode, ...(await workspaceResult(dir, seedReport, body)) };
      const session = startPersistent("npm", ["run", "dev", "--", "--host", "0.0.0.0"], dir);
      keep = true;
      await new Promise(r => setTimeout(r, 2200));
      const port = detectPort(session);
      return {
        status: session.exited ? "error" : "running",
        stdout: session.stdout(), stderr: session.stderr(),
        sessionId: session.id, port, previewPath: "/preview/" + session.id + "/",
        ...(await workspaceResult(dir, seedReport, body)),
      };
    }
    const r = language === "python-safe"
      ? await spawnProcess("python3", ["-I", "-S", "-u", GUARDED_PYTHON], dir, TIMEOUT_MS, signal, command, stdin)
      : await spawnProcess("bash", ["-c", command], dir, TIMEOUT_MS, signal);
    return {
      status: r.timedOut ? "timeout" : r.exitCode === 0 ? "success" : "error",
      stdout: r.stdout, stderr: r.stderr, exitCode: r.exitCode, signal: r.signal,
      ...(await workspaceResult(dir, seedReport, body)),
    };
  } finally {
    await releaseWorkspace(dir, body.workspace, keep);
  }
}
async function proxyPreview(req, res, sessionId, rest) {
  const session = sessions.get(sessionId);
  if (!session || session.exited) return send(res, 410, { error: "preview_session_ended" });
  const port = detectPort(session);
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const target = "http://127.0.0.1:" + port + "/" + (rest || "") + query;
  try {
    const upstream = await fetch(target);
    const body = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      "content-type": upstream.headers.get("content-type") || "text/html; charset=utf-8",
      "access-control-allow-origin": process.env.ALLOW_ORIGIN || "*",
    });
    res.end(body);
  } catch {
    send(res, 502, { error: "preview_not_ready", stdout: session.stdout(), stderr: session.stderr() });
  }
}
const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method === "GET" && req.url === "/health") return send(res, 200, { ok: true, runner: "universal-shell", version: RUNNER_VERSION, snapshot: SNAPSHOT_VERSION, runtimes: RUNNER_RUNTIMES, sessions: sessions.size });
  if (req.method === "GET" && req.url && req.url.startsWith("/preview/")) {
    const parts = req.url.split("/").filter(Boolean);
    return proxyPreview(req, res, parts[1], parts.slice(2).join("/"));
  }
  if (req.method === "POST" && req.url === "/execute/stream") {
    if (!authorized(req)) return send(res, 401, { error: "unauthorized" });
    let releaseSlot;
    try { releaseSlot = acquireRunSlot(); } catch (error) { return send(res, 429, { error: error.message }); }
    res.on("close", () => releaseSlot());
    // executeStream releases the workspace in its own finally; the response is
    // ended only afterwards so a client can immediately run the next command.
    try { await executeStream(await readBody(req), res); if (!res.writableEnded) res.end(); return; }
    catch (error) { if (!res.headersSent) send(res, 400, { error: error instanceof Error ? error.message : "bad_request" }); else if (!res.writableEnded) res.end(); return; }
  }
  if (req.method !== "POST" || req.url !== "/execute") return send(res, 404, { error: "not_found" });
  if (!authorized(req)) return send(res, 401, { error: "unauthorized" });
  let releaseSlot;
  try { releaseSlot = acquireRunSlot(); } catch (error) { return send(res, 429, { error: error.message }); }
  try {
    const body = await readBody(req);
    const started = Date.now();
    const ac = new AbortController();
    const cancel = () => ac.abort();
    res.on("close", cancel);
    const result = await execute(body, ac.signal).finally(() => res.off("close", cancel));
    return send(res, 200, Object.assign({}, result, { durationMs: Date.now() - started }));
  } catch (error) {
    return send(res, 400, { error: error instanceof Error ? error.message : "bad_request" });
  } finally { releaseSlot(); }
});
server.listen(PORT, HOST, () => console.log("bossnu multi-runtime sandbox listening on :" + server.address().port));
