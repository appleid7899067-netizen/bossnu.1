import http from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const PORT = Number(process.env.PORT || 8787);
const MAX_BODY = 128 * 1024;
const MAX_OUTPUT = 64 * 1024;
const TIMEOUT_MS = Number(process.env.SANDBOX_TIMEOUT_MS || 120000);
const DEV_TIMEOUT_MS = Number(process.env.SANDBOX_DEV_TIMEOUT_MS || 180000);
const WORKSPACE_REPO = process.env.WORKSPACE_REPO || "";
const PATH_VALUE = process.env.PATH || "/usr/local/bin:/usr/bin:/bin";
const sessions = new Map();

function headers(contentType = "application/json; charset=utf-8") {
  return {
    "content-type": contentType,
    "access-control-allow-origin": process.env.ALLOW_ORIGIN || "*",
    "access-control-allow-methods": "POST,GET,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
    "cache-control": "no-cache, no-transform",
  };
}
function send(res, status, body) {
  res.writeHead(status, headers());
  res.end(JSON.stringify(body));
}
async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("Request too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}
function env(cwd) {
  return { ...process.env, PATH: PATH_VALUE, HOME: cwd, LANG: "C.UTF-8", HOST: "0.0.0.0" };
}
function append(target, chunk) {
  return (target + chunk.toString("utf8")).slice(-MAX_OUTPUT);
}
function spawnProcess(command, args, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env: env(cwd), detached: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "", timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { process.kill(-child.pid, "SIGKILL"); } catch {}
    }, timeoutMs);
    child.stdout.on("data", c => { stdout = append(stdout, c); });
    child.stderr.on("data", c => { stderr = append(stderr, c); });
    child.on("error", e => { stderr = append(stderr, e); });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code, signal, timedOut });
    });
  });
}
async function cloneWorkspace(dir) {
  if (!WORKSPACE_REPO) return;
  const r = await spawnProcess("git", ["clone", "--depth", "1", WORKSPACE_REPO, dir], tmpdir(), 60000);
  if (r.exitCode !== 0) throw new Error(r.stderr || "workspace_clone_failed");
}
function startPersistent(command, args, cwd) {
  const child = spawn(command, args, { cwd, env: env(cwd), detached: true, stdio: ["pipe", "pipe", "pipe"] });
  let stdout = "", stderr = "";
  const sessionId = "sb_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  const session = { id: sessionId, child, cwd, stdout: () => stdout, stderr: () => stderr, createdAt: Date.now(), exited: false };
  sessions.set(sessionId, session);
  child.stdout.on("data", c => { stdout = append(stdout, c); });
  child.stderr.on("data", c => { stderr = append(stderr, c); });
  child.on("exit", () => {
    session.exited = true;
    setTimeout(() => sessions.delete(sessionId), 10 * 60 * 1000);
  });
  return session;
}
async function prepareNode(dir) {
  return spawnProcess("npm", ["install", "--no-audit", "--no-fund"], dir, DEV_TIMEOUT_MS);
}
function detectPort(session) {
  const text = session.stdout() + " " + session.stderr();
  const m = text.match(/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)[:\s]+(\d{2,5})/i) || text.match(/port\s+(\d{2,5})/i);
  return Number((m && m[1]) || 5173);
}
function sseHeaders(res) {
  res.writeHead(200, {
    ...headers("text/event-stream; charset=utf-8"),
    connection: "keep-alive",
  });
}
function sse(res, value) {
  res.write("data: " + JSON.stringify(value) + "\n\n");
}
async function executeStream(body, res) {
  const command = typeof body.command === "string" ? body.command.trim() : "";
  const language = String(body.language || "bash").toLowerCase();
  if (!command) throw new Error("command_required");
  const dir = await mkdtemp(join(tmpdir(), "bossnu-work-"));
  let keep = false;
  const started = Date.now();
  try {
    sseHeaders(res);
    sse(res, { type: "status", status: "queued", message: "รับคำสั่งจากสลี่" });
    await cloneWorkspace(dir);
    sse(res, { type: "status", status: "running", message: "กำลังรันคำสั่งจริงบน Sandbox Runner" });

    if ((language === "node" || language === "javascript") && /^npm\s+run\s+dev\b/i.test(command)) {
      const install = await prepareNode(dir);
      if (install.exitCode !== 0) {
        sse(res, { type: "output", stream: "stderr", text: install.stderr || install.stdout });
        sse(res, { type: "complete", result: { success: false, status: "error", type: language, runtime: language, command, stdout: install.stdout, stderr: install.stderr, exitCode: install.exitCode, durationMs: Date.now() - started } });
        return res.end();
      }
      const session = startPersistent("npm", ["run", "dev", "--", "--host", "0.0.0.0"], dir);
      keep = true;
      await new Promise(r => setTimeout(r, 2200));
      const out = session.stdout(), err = session.stderr();
      if (out) sse(res, { type: "output", stream: "stdout", text: out });
      if (err) sse(res, { type: "output", stream: "stderr", text: err });
      const port = detectPort(session);
      sse(res, { type: "complete", result: { success: !session.exited, status: session.exited ? "error" : "running", type: session.exited ? language : "dev-server", runtime: language, command, stdout: out, stderr: err, output: [out, err].filter(Boolean).join("\n").slice(-MAX_OUTPUT), sessionId: session.id, port, previewPath: "/preview/" + session.id + "/", durationMs: Date.now() - started } });
      return res.end();
    }

    // Every supported runtime ultimately runs through the shell so arbitrary
    // commands such as npx, pip, cargo, go, java, git, curl, etc. can execute
    // without requiring a separate hard-coded executor.
    const child = spawn("bash", ["-lc", command], { cwd: dir, env: env(dir), detached: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "", timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { process.kill(-child.pid, "SIGKILL"); } catch {}
    }, TIMEOUT_MS);
    child.stdout.on("data", c => {
      const text = c.toString("utf8");
      stdout = append(stdout, c);
      sse(res, { type: "output", stream: "stdout", text });
    });
    child.stderr.on("data", c => {
      const text = c.toString("utf8");
      stderr = append(stderr, c);
      sse(res, { type: "output", stream: "stderr", text });
    });
    await new Promise(resolve => {
      child.on("error", e => { stderr = append(stderr, e); resolve(); });
      child.on("close", code => {
        clearTimeout(timer);
        const status = timedOut ? "timeout" : code === 0 ? "success" : "error";
        sse(res, { type: "complete", result: { success: status === "success", status, type: language, runtime: language, command, stdout, stderr, output: [stdout, stderr].filter(Boolean).join("\n").trim(), exitCode: code, durationMs: Date.now() - started } });
        resolve();
      });
    });
    return res.end();
  } finally {
    if (!keep) await rm(dir, { recursive: true, force: true });
  }
}
async function execute(body) {
  const command = typeof body.command === "string" ? body.command.trim() : "";
  const language = String(body.language || "bash").toLowerCase();
  if (!command) throw new Error("command_required");
  const dir = await mkdtemp(join(tmpdir(), "bossnu-work-"));
  let keep = false;
  try {
    await cloneWorkspace(dir);
    if ((language === "node" || language === "javascript") && /^npm\s+run\s+dev\b/i.test(command)) {
      const install = await prepareNode(dir);
      if (install.exitCode !== 0) return { status: "error", stdout: install.stdout, stderr: install.stderr, exitCode: install.exitCode };
      const session = startPersistent("npm", ["run", "dev", "--", "--host", "0.0.0.0"], dir);
      keep = true;
      await new Promise(r => setTimeout(r, 2200));
      return { status: session.exited ? "error" : "running", stdout: session.stdout(), stderr: session.stderr(), sessionId: session.id, port: detectPort(session), previewPath: "/preview/" + session.id + "/" };
    }
    const r = await spawnProcess("bash", ["-lc", command], dir, TIMEOUT_MS);
    return { status: r.timedOut ? "timeout" : r.exitCode === 0 ? "success" : "error", stdout: r.stdout, stderr: r.stderr, exitCode: r.exitCode, signal: r.signal };
  } finally {
    if (!keep) await rm(dir, { recursive: true, force: true });
  }
}
async function proxyPreview(req, res, sessionId, rest) {
  const session = sessions.get(sessionId);
  if (!session || session.exited) return send(res, 410, { error: "preview_session_ended" });
  const port = detectPort(session);
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  try {
    const upstream = await fetch("http://127.0.0.1:" + port + "/" + (rest || "") + query);
    const body = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, { ...headers(upstream.headers.get("content-type") || "text/html; charset=utf-8") });
    res.end(body);
  } catch {
    send(res, 502, { error: "preview_not_ready", stdout: session.stdout(), stderr: session.stderr() });
  }
}
const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method === "GET" && req.url === "/health") return send(res, 200, { ok: true, runner: "universal-shell", version: 3, sessions: sessions.size });
  if (req.method === "GET" && req.url && req.url.startsWith("/preview/")) {
    const parts = req.url.split("/").filter(Boolean);
    return proxyPreview(req, res, parts[1], parts.slice(2).join("/"));
  }
  if (req.method === "POST" && req.url === "/execute/stream") {
    try { return await executeStream(await readBody(req), res); }
    catch (error) {
      if (!res.headersSent) send(res, 400, { error: error instanceof Error ? error.message : "bad_request" });
      else res.end();
      return;
    }
  }
  if (req.method !== "POST" || req.url !== "/execute") return send(res, 404, { error: "not_found" });
  try {
    const result = await execute(await readBody(req));
    return send(res, 200, result);
  } catch (error) {
    return send(res, 400, { error: error instanceof Error ? error.message : "bad_request" });
  }
});
server.listen(PORT, "0.0.0.0", () => console.log("bossnu universal shell runner listening on :" + PORT));
