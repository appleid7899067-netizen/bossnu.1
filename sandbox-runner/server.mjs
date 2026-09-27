import http from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const PORT = Number(process.env.PORT || 8787);
const MAX_BODY = 128 * 1024;
const MAX_OUTPUT = 64 * 1024;
const TIMEOUT_MS = 15000;
const DEV_TIMEOUT_MS = 120000;
const WORKSPACE_REPO = process.env.WORKSPACE_REPO || "";
const sessions = new Map();

function send(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": process.env.ALLOW_ORIGIN || "*",
    "access-control-allow-methods": "POST,GET,OPTIONS",
    "access-control-allow-headers": "content-type",
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
function spawnProcess(command, args, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: { PATH: "/usr/local/bin:/usr/bin:/bin", HOME: cwd, LANG: "C.UTF-8", HOST: "0.0.0.0" },
      detached: true, stdio: ["pipe", "pipe", "pipe"],
    });
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
  const child = spawn(command, args, {
    cwd, env: { PATH: "/usr/local/bin:/usr/bin:/bin", HOME: cwd, LANG: "C.UTF-8", HOST: "0.0.0.0" },
    detached: true, stdio: ["pipe", "pipe", "pipe"],
  });
  let stdout = "", stderr = "";
  child.stdout.on("data", c => { stdout = append(stdout, c); });
  child.stderr.on("data", c => { stderr = append(stderr, c); });
  const sessionId = "sb_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  const session = { id: sessionId, child, cwd, stdout: () => stdout, stderr: () => stderr, createdAt: Date.now(), exited: false };
  sessions.set(sessionId, session);
  child.on("exit", () => {
    session.exited = true;
    setTimeout(() => sessions.delete(sessionId), 10 * 60 * 1000);
  });
  return session;
}
async function prepareNode(dir) {
  const r = await spawnProcess("npm", ["install", "--no-audit", "--no-fund"], dir, DEV_TIMEOUT_MS);
  if (r.exitCode !== 0) throw new Error(r.stderr || r.stdout || "npm_install_failed");
  return r;
}
function detectPort(session) {
  const text = session.stdout() + " " + session.stderr();
  const m = text.match(/(?:localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0)[:\\s]+(\\d{2,5})/i) || text.match(/port\\s+(\\d{2,5})/i);
  return Number(m && m[1] || 5173);
}
async function execute(body) {
  const language = String(body.language || "").toLowerCase();
  const command = typeof body.command === "string" ? body.command.trim() : "";
  if (!command) throw new Error("command_required");
  if (!["node","bash","python","go","rust","java","cpp"].includes(language)) throw new Error("unsupported_runtime");

  const dir = await mkdtemp(join(tmpdir(), "bossnu-work-"));
  let keep = false;
  try {
    await cloneWorkspace(dir);
    if (language === "node" && /^npm\\s+run\\s+dev\\b/i.test(command)) {
      await prepareNode(dir);
      const session = startPersistent("npm", ["run", "dev", "--", "--host", "0.0.0.0"], dir);
      keep = true;
      await new Promise(r => setTimeout(r, 2200));
      const port = detectPort(session);
      return {
        status: session.exited ? "error" : "running",
        stdout: session.stdout(), stderr: session.stderr(),
        sessionId: session.id, port, previewPath: "/preview/" + session.id + "/",
      };
    }
    const r = await spawnProcess("bash", ["-lc", command], dir, TIMEOUT_MS);
    return {
      status: r.timedOut ? "timeout" : r.exitCode === 0 ? "success" : "error",
      stdout: r.stdout, stderr: r.stderr, exitCode: r.exitCode, signal: r.signal,
    };
  } finally {
    if (!keep) await rm(dir, { recursive: true, force: true });
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
  if (req.method === "GET" && req.url === "/health") return send(res, 200, { ok: true, runner: "multi-runtime", version: 2, sessions: sessions.size });
  if (req.method === "GET" && req.url && req.url.startsWith("/preview/")) {
    const parts = req.url.split("/").filter(Boolean);
    return proxyPreview(req, res, parts[1], parts.slice(2).join("/"));
  }
  if (req.method !== "POST" || req.url !== "/execute") return send(res, 404, { error: "not_found" });
  try {
    const body = await readBody(req);
    const started = Date.now();
    const result = await execute(body);
    return send(res, 200, Object.assign({}, result, { durationMs: Date.now() - started }));
  } catch (error) {
    return send(res, 400, { error: error instanceof Error ? error.message : "bad_request" });
  }
});
server.listen(PORT, "0.0.0.0", () => console.log("bossnu multi-runtime sandbox listening on :" + PORT));
