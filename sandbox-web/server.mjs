/**
 * Sandbox Web — a standalone, dependency-free sandbox execution service.
 *
 * One process, no npm install, no framework:
 *
 *   GET  /                     → "สนามหลวง" console (public/)
 *   GET  /health               → version, runtimes, sessions, auth state (public)
 *   POST /execute              → run a command, JSON result      (bearer token)
 *   POST /execute/stream       → run a command, SSE live output  (bearer token)
 *   GET  /preview/<session>/…  → proxy to a `npm run dev` session
 *
 * The wire contract matches Sandbox Runner v6, so an app that already talks to
 * a runner (`SANDBOX_RUNNER_URL` + `SANDBOX_RUNNER_TOKEN`) can point at this
 * service unchanged.
 *
 * Security posture — this is an internet-facing code execution endpoint:
 *  - `RUNNER_TOKEN` is mandatory; the server refuses to boot without it unless
 *    `ALLOW_NO_AUTH=true` is set explicitly (local experiments only).
 *  - `/health` and the static UI stay public; execution never does.
 *  - Per-IP rate limiting, a global concurrency cap, request/output/timeout
 *    bounds, and workspace ids validated against a strict pattern.
 *  - Workspaces are NOT a tenant boundary: every command runs as the same OS
 *    user. Run one container/VM per tenant before exposing this publicly to
 *    strangers, and never mount host paths, secrets or the Docker socket.
 */
import http from "node:http";
import { spawn } from "node:child_process";
import { createHash, timingSafeEqual } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, utimes, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { reconcileSeed, snapshotWorkspace, SNAPSHOT_VERSION } from "./lib/workspace.mjs";

const HERE = fileURLToPath(new URL(".", import.meta.url));

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT || 8788);
const HOST = process.env.HOST || "0.0.0.0";
const SERVICE_NAME = process.env.SERVICE_NAME || "sandbox-web";
const VERSION = Number(process.env.SERVICE_VERSION || 6);
const RUNNER_TOKEN = (process.env.RUNNER_TOKEN || "").trim();
const ALLOW_NO_AUTH = process.env.ALLOW_NO_AUTH === "true";
const ALLOW_ORIGIN = (process.env.ALLOW_ORIGIN || "").trim();
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 16 * 1024 * 1024);
const MAX_COMMAND_CHARS = Number(process.env.MAX_COMMAND_CHARS || 32_000);
const MAX_OUTPUT = Number(process.env.MAX_OUTPUT_BYTES || 64 * 1024);
const MAX_ACTIVE_RUNS = Math.max(1, Number(process.env.MAX_ACTIVE_RUNS || 2));
const RATE_LIMIT_WINDOW_MS = Math.max(1000, Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000));
const RATE_LIMIT_MAX = Math.max(1, Number(process.env.RATE_LIMIT_MAX || 30));
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || join(tmpdir(), "sandbox-web-workspaces");
const WORKSPACE_TTL_MS = Number(process.env.WORKSPACE_TTL_MS || 86_400_000);
const WORKSPACE_REPO = process.env.WORKSPACE_REPO || "";
const DEV_SESSION_TTL_MS = Number(process.env.DEV_SESSION_TTL_MS || 30 * 60 * 1000);
const GUARDED_PYTHON = process.env.GUARDED_PYTHON || join(HERE, "lib", "guarded", "run_guarded.py");
const PUBLIC_DIR = join(HERE, "public");

const bound = (value, low, high) => Math.min(high, Math.max(low, value));
const TIMEOUT_MS = bound(Number(process.env.COMMAND_TIMEOUT_MS || 120_000), 1000, 300_000);
const DEV_TIMEOUT_MS = bound(Number(process.env.DEV_TIMEOUT_MS || 180_000), 1000, 300_000);

if (!RUNNER_TOKEN && !ALLOW_NO_AUTH) {
  const suggestion = createHash("sha256").update(`${Date.now()}:${Math.random()}`).digest("hex").slice(0, 32);
  console.error(
    `[${SERVICE_NAME}] RUNNER_TOKEN is required — this service executes arbitrary code.\n` +
      `[${SERVICE_NAME}] Start it with e.g. RUNNER_TOKEN=${suggestion} node server.mjs\n` +
      `[${SERVICE_NAME}] (or ALLOW_NO_AUTH=true for a throwaway local instance).`,
  );
  process.exit(1);
}

/**
 * Advertise only what this container can actually run: probing the binaries at
 * boot beats a hard-coded list that lies when the image changes.
 */
const RUNTIME_PROBES = [
  { runtime: "bash", command: "bash", args: ["--version"] },
  { runtime: "node", command: "node", args: ["-v"], aliases: ["javascript"] },
  { runtime: "python", command: "python3", args: ["-V"] },
  { runtime: "go", command: "go", args: ["version"] },
  { runtime: "rust", command: "rustc", args: ["-V"] },
  { runtime: "java", command: "java", args: ["-version"] },
  { runtime: "cpp", command: "g++", args: ["--version"] },
];

async function detectRuntimes() {
  const found = [];
  for (const probe of RUNTIME_PROBES) {
    const result = await spawnProcess(probe.command, probe.args, tmpdir(), 5000).catch(() => null);
    if (result && result.exitCode === 0) {
      found.push(probe.runtime, ...(probe.aliases || []));
      if (probe.runtime === "python" && existsSync(GUARDED_PYTHON)) found.push("python-safe");
    }
  }
  return found.length ? [...new Set(found)] : ["bash"];
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const corsHeaders = () => ({
  ...(ALLOW_ORIGIN ? { "access-control-allow-origin": ALLOW_ORIGIN } : {}),
  "access-control-allow-methods": "POST,GET,OPTIONS",
  "access-control-allow-headers": "content-type,authorization",
});

function send(res, status, body, extraHeaders = {}) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", ...corsHeaders(), ...extraHeaders });
  res.end(JSON.stringify(body));
}

function authorized(req) {
  if (!RUNNER_TOKEN) return ALLOW_NO_AUTH;
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice("Bearer ".length).trim());
  const expected = Buffer.from(RUNNER_TOKEN);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Fixed-window per-IP limiter; enough to blunt abuse, cheap enough to keep. */
const hits = new Map();
function rateLimited(req) {
  const key = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    hits.set(key, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) if (now - entry.start > RATE_LIMIT_WINDOW_MS) hits.delete(key);
}, RATE_LIMIT_WINDOW_MS).unref();

let activeRuns = 0;
function acquireRunSlot() {
  if (activeRuns >= MAX_ACTIVE_RUNS) throw new Error("runner_busy");
  activeRuns += 1;
  return () => { activeRuns = Math.max(0, activeRuns - 1); };
}

async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("request_too_large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

const append = (target, chunk) => (target + chunk.toString("utf8")).slice(-MAX_OUTPUT);

function executionEnv(cwd) {
  return {
    PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
    HOME: cwd,
    LANG: "C.UTF-8",
    HOST: "0.0.0.0",
    CI: "1",
    PYTHONNOUSERSITE: "1",
    PYTHONDONTWRITEBYTECODE: "1",
    PYTHONUNBUFFERED: "1",
    npm_config_yes: "true",
    npm_config_audit: "false",
    npm_config_fund: "false",
    npm_config_update_notifier: "false",
    npm_config_progress: "false",
    npm_config_loglevel: "error",
  };
}

// ---------------------------------------------------------------------------
// Workspaces
// ---------------------------------------------------------------------------

const busyWorkspaces = new Set();

async function cloneWorkspace(dir) {
  if (!WORKSPACE_REPO) return;
  const result = await spawnProcess("git", ["clone", "--depth", "1", WORKSPACE_REPO, dir], tmpdir(), 60_000);
  if (result.exitCode !== 0) throw new Error(result.stderr || "workspace_clone_failed");
}

async function acquireWorkspace(id) {
  if (id === undefined) {
    const dir = await mkdtemp(join(tmpdir(), "sandbox-web-"));
    await cloneWorkspace(dir);
    return { dir, fresh: true };
  }
  if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error("invalid_workspace");
  if (busyWorkspaces.has(id)) throw new Error("workspace_busy");
  busyWorkspaces.add(id);
  const dir = join(WORKSPACE_ROOT, id);
  try {
    await mkdir(WORKSPACE_ROOT, { recursive: true });
    let fresh = false;
    try { await stat(dir); } catch {
      await mkdir(dir);
      fresh = true;
      try { await cloneWorkspace(dir); } catch (error) { await rm(dir, { recursive: true, force: true }); throw error; }
    }
    await utimes(dir, new Date(), new Date());
    return { dir, fresh };
  } catch (error) {
    busyWorkspaces.delete(id);
    throw error;
  }
}

async function releaseWorkspace(dir, id, keep) {
  try {
    if (id !== undefined) await utimes(dir, new Date(), new Date());
    else if (!keep) await rm(dir, { recursive: true, force: true });
  } finally {
    busyWorkspaces.delete(id);
  }
}

setInterval(async () => {
  for (const id of await readdir(WORKSPACE_ROOT).catch(() => [])) {
    if (busyWorkspaces.has(id) || [...sessions.values()].some((s) => s.cwd === join(WORKSPACE_ROOT, id) && !s.exited)) continue;
    const dir = join(WORKSPACE_ROOT, id);
    const info = await stat(dir).catch(() => null);
    if (info && Date.now() - info.mtimeMs > WORKSPACE_TTL_MS) {
      busyWorkspaces.add(id);
      try { await rm(dir, { recursive: true, force: true }); } finally { busyWorkspaces.delete(id); }
    }
  }
}, 60_000).unref();

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

/** Writing to a child that never spawned (missing binary) raises EPIPE; ignore it. */
function endStream(stream, text) {
  if (!stream) return;
  stream.on("error", () => { /* spawn failed; the close handler reports it */ });
  stream.end(text, "utf8");
}

function spawnProcess(command, args, cwd, timeoutMs, signal, stdin = "", extraStdin) {
  return new Promise((resolvePromise) => {
    const stdio = extraStdin === undefined ? ["pipe", "pipe", "pipe"] : ["pipe", "pipe", "pipe", "pipe"];
    const child = spawn(command, args, { cwd, env: executionEnv(cwd), detached: true, stdio });
    endStream(child.stdin, stdin);
    if (extraStdin !== undefined) endStream(child.stdio[3], extraStdin);
    const cancel = () => { try { process.kill(-child.pid, "SIGKILL"); } catch { /* already gone */ } };
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    signal?.addEventListener("abort", cancel, { once: true });
    if (signal?.aborted) cancel();
    const timer = setTimeout(() => { timedOut = true; cancel(); }, timeoutMs);
    child.stdout.on("data", (c) => { stdout = append(stdout, c); });
    child.stderr.on("data", (c) => { stderr = append(stderr, c); });
    child.on("error", (e) => { stderr = append(stderr, e); });
    child.on("close", (code, exitSignal) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      cancel();
      resolvePromise({ stdout, stderr, exitCode: code, signal: exitSignal, timedOut });
    });
  });
}

const RUNTIME_SPECS = {
  node: { file: "main.mjs", command: "node", args: ["main.mjs"] },
  javascript: { file: "main.mjs", command: "node", args: ["main.mjs"] },
  python: { file: "main.py", command: "python3", args: ["main.py"] },
  go: { file: "main.go", command: "go", args: ["run", "main.go"] },
  rust: { file: "main.rs", command: "sh", args: ["-c", "rustc main.rs -o main_bin && ./main_bin"] },
  java: { file: "Main.java", command: "java", args: ["Main.java"] },
  cpp: { file: "main.cpp", command: "sh", args: ["-c", "g++ -std=c++20 main.cpp -O2 -o main_bin && ./main_bin"] },
};

async function spawnExecution(language, command, stdin, cwd) {
  if (language === "python-safe") {
    const child = spawn("python3", ["-I", "-S", "-u", GUARDED_PYTHON], {
      cwd, env: executionEnv(cwd), detached: true, stdio: ["pipe", "pipe", "pipe", "pipe"],
    });
    endStream(child.stdin, command);
    endStream(child.stdio[3], stdin);
    return child;
  }
  const spec = RUNTIME_SPECS[language];
  if (spec) {
    await writeFile(join(cwd, spec.file), command, "utf8");
    const child = spawn(spec.command, spec.args, { cwd, env: executionEnv(cwd), detached: true, stdio: ["pipe", "pipe", "pipe"] });
    endStream(child.stdin, stdin);
    return child;
  }
  const child = spawn("bash", ["-c", command], { cwd, env: executionEnv(cwd), detached: true, stdio: ["pipe", "pipe", "pipe"] });
  endStream(child.stdin, stdin);
  return child;
}

/**
 * Run `command` for `language` and collect its output.
 *
 * The streaming path needs the live child process, so it spawns directly; this
 * is the buffered twin used by the JSON endpoint.
 */
async function runWithTimeout(language, command, stdin, cwd, timeoutMs, signal) {
  if (language === "python-safe") {
    return spawnProcess("python3", ["-I", "-S", "-u", GUARDED_PYTHON], cwd, timeoutMs, signal, command, stdin);
  }
  const spec = RUNTIME_SPECS[language];
  if (!spec) return spawnProcess("bash", ["-c", command], cwd, timeoutMs, signal);
  await writeFile(join(cwd, spec.file), command, "utf8");
  return spawnProcess(spec.command, spec.args, cwd, timeoutMs, signal);
}

function commandText(body, language) {
  const raw = typeof body.command === "string" ? body.command : "";
  return language === "python-safe" ? raw : raw.trim();
}

function programInput(body, language) {
  const value = language === "python-safe" && typeof body.stdin === "string" ? body.stdin : "";
  if (value.length > MAX_COMMAND_CHARS) throw new Error("stdin_too_large");
  return value;
}

async function seedWorkspace(workspace, body) {
  if (!Array.isArray(body.workspaceFiles) && !body.workspaceBase) {
    return { mode: "none", written: [], deleted: [], conflicts: [], rejected: [] };
  }
  return reconcileSeed({ dir: workspace.dir, fresh: workspace.fresh, files: body.workspaceFiles, base: body.workspaceBase });
}

async function workspaceResult(dir, seed, body = {}) {
  const snapshot = await snapshotWorkspace(dir).catch((error) => ({
    version: SNAPSHOT_VERSION, root: "project/", files: [], paths: [], skipped: [], complete: false,
    manifestHash: "", fileCount: 0, totalBytes: 0, takenAt: new Date().toISOString(),
    error: String(error?.message || error),
  }));
  if (Number(body.snapshot) >= SNAPSHOT_VERSION) return { workspaceSnapshot: snapshot, workspaceSeed: seed };
  return {
    workspaceSnapshot: snapshot,
    workspaceSeed: seed,
    workspaceFiles: snapshot.files.map(({ path, content }) => ({ path, content })),
    workspaceSyncComplete: snapshot.complete,
  };
}

// ---------------------------------------------------------------------------
// Dev-server sessions (long-running `npm run dev`)
// ---------------------------------------------------------------------------

const sessions = new Map();

function startPersistent(command, args, cwd) {
  const child = spawn(command, args, { cwd, env: executionEnv(cwd), detached: true, stdio: ["pipe", "pipe", "pipe"] });
  child.stdin.end();
  let stdout = "";
  let stderr = "";
  child.on("error", (e) => { stderr = append(stderr, e); });
  const lifetime = setTimeout(() => { try { process.kill(-child.pid, "SIGKILL"); } catch { /* already gone */ } }, DEV_SESSION_TTL_MS);
  lifetime.unref();
  child.stdout.on("data", (c) => { stdout = append(stdout, c); });
  child.stderr.on("data", (c) => { stderr = append(stderr, c); });
  const id = "sb_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  const session = { id, child, cwd, stdout: () => stdout, stderr: () => stderr, createdAt: Date.now(), exited: false };
  sessions.set(id, session);
  child.on("exit", () => {
    clearTimeout(lifetime);
    session.exited = true;
    setTimeout(() => sessions.delete(id), 10 * 60 * 1000).unref();
  });
  return session;
}

function detectPort(session) {
  const text = `${session.stdout()} ${session.stderr()}`;
  const match = text.match(/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)[:\s]+(\d{2,5})/i) || text.match(/port\s+(\d{2,5})/i);
  return Number((match && match[1]) || 5173);
}

async function proxyPreview(req, res, sessionId, rest) {
  const session = sessions.get(sessionId);
  if (!session || session.exited) return send(res, 410, { error: "preview_session_ended" });
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  try {
    const upstream = await fetch(`http://127.0.0.1:${detectPort(session)}/${rest || ""}${query}`, {
      signal: AbortSignal.timeout(15_000),
    });
    const body = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      "content-type": upstream.headers.get("content-type") || "text/html; charset=utf-8",
      ...corsHeaders(),
    });
    res.end(body);
  } catch {
    send(res, 502, { error: "preview_not_ready", stdout: session.stdout(), stderr: session.stderr() });
  }
}

// ---------------------------------------------------------------------------
// /execute (JSON) and /execute/stream (SSE)
// ---------------------------------------------------------------------------

/**
 * Recognises a dev-server command and resolves the directory it should run in.
 *
 * The runner executes with the workspace root as cwd while the synced tree
 * lives in `project/`, so `cd project && npm run dev` is the normal way to
 * start an app here — a bare `^npm run dev` test would miss every one of them.
 * The subdirectory is validated strictly because it becomes a spawn cwd.
 */
function devRunPlan(command, dir) {
  const match = /^\s*(?:cd\s+("([^"]+)"|'([^']+)'|([^\s&;|]+))\s*(?:&&|;)\s*)?npm\s+run\s+dev\b/i.exec(String(command || ""));
  if (!match) return null;
  const sub = (match[2] || match[3] || match[4] || "").trim();
  if (!sub || sub === ".") return dir;
  if (sub.startsWith("/") || sub.includes("..") || !/^[A-Za-z0-9._/-]+$/.test(sub) || sub.length > 200) return null;
  return join(dir, sub);
}

async function execute(body, signal) {
  const language = String(body.language || "bash").toLowerCase();
  const command = commandText(body, language);
  const stdin = programInput(body, language);
  if (!command.trim()) throw new Error("command_required");
  if (command.length > MAX_COMMAND_CHARS) throw new Error("command_too_large");

  const workspace = await acquireWorkspace(body.workspace);
  const dir = workspace.dir;
  let keep = false;
  try {
    const seed = await seedWorkspace(workspace, body);
    const devDir = (language === "node" || language === "javascript") ? devRunPlan(command, dir) : null;
    if (devDir) {
      const install = await spawnProcess("npm", ["install", "--no-audit", "--no-fund"], devDir, DEV_TIMEOUT_MS, signal);
      if (install.exitCode !== 0) {
        return { status: "error", stdout: install.stdout, stderr: install.stderr, exitCode: install.exitCode, ...(await workspaceResult(dir, seed, body)) };
      }
      const session = startPersistent("npm", ["run", "dev", "--", "--host", "0.0.0.0"], devDir);
      keep = true;
      await new Promise((r) => setTimeout(r, 2200));
      return {
        status: session.exited ? "error" : "running",
        stdout: session.stdout(), stderr: session.stderr(),
        sessionId: session.id, port: detectPort(session), previewPath: `/preview/${session.id}/`,
        ...(await workspaceResult(dir, seed, body)),
      };
    }
    // Same runtime dispatch as /execute/stream: /health advertises these
    // runtimes, so honoring `language` here too keeps the two transports from
    // disagreeing about what "node" means.
    const result = await runWithTimeout(language, command, stdin, dir, TIMEOUT_MS, signal);
    return {
      status: result.timedOut ? "timeout" : result.exitCode === 0 ? "success" : "error",
      stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode, signal: result.signal,
      ...(await workspaceResult(dir, seed, body)),
    };
  } finally {
    await releaseWorkspace(dir, body.workspace, keep);
  }
}

function sseHeaders(res) {
  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    ...corsHeaders(),
  });
}

const sse = (res, event) => { if (!res.destroyed) res.write(`data: ${JSON.stringify(event)}\n\n`); };

async function executeStream(body, res) {
  const language = String(body.language || "bash").toLowerCase();
  const command = commandText(body, language);
  const stdin = programInput(body, language);
  if (!command.trim()) throw new Error("command_required");
  if (command.length > MAX_COMMAND_CHARS) throw new Error("command_too_large");

  const workspace = await acquireWorkspace(body.workspace);
  const dir = workspace.dir;
  let keep = false;
  const started = Date.now();
  try {
    const seed = await seedWorkspace(workspace, body);
    sseHeaders(res);
    sse(res, { type: "status", status: "queued", message: "รับคำสั่งแล้ว" });
    if (seed.written.length || seed.deleted.length || seed.conflicts.length) {
      sse(res, {
        type: "status", status: "seeded",
        message: `Seed workspace • เขียน ${seed.written.length} • ลบ ${seed.deleted.length} • ขัดแย้ง ${seed.conflicts.length}`,
      });
    }
    sse(res, { type: "status", status: "running", message: `กำลังรัน (${language})` });

    const devDir = (language === "node" || language === "javascript") ? devRunPlan(command, dir) : null;
    if (devDir) {
      const install = await spawnProcess("npm", ["install", "--no-audit", "--no-fund"], devDir, DEV_TIMEOUT_MS);
      if (install.exitCode !== 0) {
        sse(res, { type: "output", stream: "stderr", text: install.stderr || install.stdout });
        sse(res, { type: "complete", result: { success: false, status: "error", type: language, runtime: language, command, stdout: install.stdout, stderr: install.stderr, exitCode: install.exitCode, durationMs: Date.now() - started, ...(await workspaceResult(dir, seed, body)) } });
        return;
      }
      const session = startPersistent("npm", ["run", "dev", "--", "--host", "0.0.0.0"], devDir);
      keep = true;
      await new Promise((r) => setTimeout(r, 2200));
      for (const [stream, text] of [["stdout", session.stdout()], ["stderr", session.stderr()]]) {
        if (text) sse(res, { type: "output", stream, text });
      }
      sse(res, {
        type: "complete",
        result: {
          success: !session.exited, status: session.exited ? "error" : "running",
          type: session.exited ? "node" : "dev-server", runtime: language, command,
          stdout: session.stdout(), stderr: session.stderr(),
          output: [session.stdout(), session.stderr()].filter(Boolean).join("\n").trim().slice(-MAX_OUTPUT),
          sessionId: session.id, port: detectPort(session), previewPath: `/preview/${session.id}/`,
          durationMs: Date.now() - started, ...(await workspaceResult(dir, seed, body)),
        },
      });
      return;
    }

    const child = await spawnExecution(language, command, stdin, dir);
    const cancel = () => { try { process.kill(-child.pid, "SIGKILL"); } catch { /* already gone */ } };
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let sentBytes = 0;
    res.on("close", cancel);
    if (res.destroyed) cancel();
    const timer = setTimeout(() => { timedOut = true; cancel(); }, TIMEOUT_MS);
    const forward = (stream, chunk) => {
      const remaining = MAX_OUTPUT - sentBytes;
      if (remaining <= 0) return;
      const limited = chunk.subarray(0, remaining);
      sentBytes += limited.length;
      sse(res, { type: "output", stream, text: limited.toString("utf8") });
    };
    child.stdout.on("data", (c) => { stdout = append(stdout, c); forward("stdout", c); });
    child.stderr.on("data", (c) => { stderr = append(stderr, c); forward("stderr", c); });
    await new Promise((done) => {
      child.on("error", (e) => { stderr = append(stderr, e); });
      child.on("close", (code) => {
        clearTimeout(timer);
        res.off("close", cancel);
        cancel();
        const status = timedOut ? "timeout" : code === 0 ? "success" : "error";
        workspaceResult(dir, seed, body).then((workspace) => {
          sse(res, {
            type: "complete",
            result: {
              success: status === "success", status, type: language, runtime: language, command,
              stdout, stderr, output: [stdout, stderr].filter(Boolean).join("\n").trim(),
              exitCode: code, durationMs: Date.now() - started, ...workspace,
            },
          });
          done();
        });
      });
    });
  } finally {
    await releaseWorkspace(dir, body.workspace, keep);
  }
}

// ---------------------------------------------------------------------------
// Static UI
// ---------------------------------------------------------------------------

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json; charset=utf-8" };

async function serveStatic(req, res, pathname) {
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = resolve(PUBLIC_DIR, normalize(relative));
  // Never escape public/ — normalize() alone still allows ../ traversal.
  if (target !== PUBLIC_DIR && !target.startsWith(PUBLIC_DIR + "/")) return send(res, 403, { error: "forbidden" });
  if (!existsSync(target)) return send(res, 404, { error: "not_found" });
  const body = await readFile(target);
  res.writeHead(200, { "content-type": MIME[extname(target)] || "application/octet-stream", "cache-control": "no-cache", ...corsHeaders() });
  res.end(body);
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

// Probed after the helpers exist; see detectRuntimes() above.
const RUNTIMES = await detectRuntimes();
const startedAt = Date.now();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  if (req.method === "GET" && pathname === "/health") {
    return send(res, 200, {
      ok: true,
      service: SERVICE_NAME,
      runner: SERVICE_NAME,
      version: VERSION,
      snapshot: SNAPSHOT_VERSION,
      runtimes: RUNTIMES,
      sessions: sessions.size,
      activeRuns,
      authRequired: Boolean(RUNNER_TOKEN),
      pythonSafe: existsSync(GUARDED_PYTHON),
      uptimeMs: Date.now() - startedAt,
    });
  }

  if (req.method === "GET" && pathname.startsWith("/preview/")) {
    const parts = pathname.split("/").filter(Boolean);
    return proxyPreview(req, res, parts[1], parts.slice(2).join("/"));
  }

  if (req.method === "POST" && (pathname === "/execute" || pathname === "/execute/stream")) {
    if (rateLimited(req)) return send(res, 429, { error: "rate_limited" });
    if (!authorized(req)) return send(res, 401, { error: "unauthorized" });
    let releaseSlot;
    try { releaseSlot = acquireRunSlot(); } catch (error) { return send(res, 429, { error: error.message }); }

    if (pathname === "/execute/stream") {
      res.on("close", () => releaseSlot());
      try {
        await executeStream(await readBody(req), res);
        if (!res.writableEnded) res.end();
      } catch (error) {
        if (!res.headersSent) send(res, 400, { error: error instanceof Error ? error.message : "bad_request" });
        else if (!res.writableEnded) res.end();
      }
      return;
    }

    try {
      const body = await readBody(req);
      const started = Date.now();
      const controller = new AbortController();
      res.on("close", () => controller.abort());
      const result = await execute(body, controller.signal).finally(() => res.off("close", () => controller.abort()));
      return send(res, 200, { ...result, durationMs: Date.now() - started });
    } catch (error) {
      return send(res, 400, { error: error instanceof Error ? error.message : "bad_request" });
    } finally {
      releaseSlot();
    }
  }

  if (req.method === "GET") {
    try {
      return await serveStatic(req, res, pathname);
    } catch (error) {
      return send(res, 500, { error: error instanceof Error ? error.message : "static_error" });
    }
  }

  return send(res, 404, { error: "not_found" });
});

server.listen(PORT, HOST, () => {
  console.log(`[${SERVICE_NAME}] v${VERSION} listening on :${server.address().port}`);
  console.log(`[${SERVICE_NAME}] auth: ${RUNNER_TOKEN ? "bearer token required" : "DISABLED (ALLOW_NO_AUTH)"}`);
  console.log(`[${SERVICE_NAME}] workspaces: ${WORKSPACE_ROOT} (ttl ${Math.round(WORKSPACE_TTL_MS / 60000)}m) • timeout ${TIMEOUT_MS}ms • max ${MAX_ACTIVE_RUNS} runs • ${RATE_LIMIT_MAX} req/${Math.round(RATE_LIMIT_WINDOW_MS / 1000)}s per IP`);
});
