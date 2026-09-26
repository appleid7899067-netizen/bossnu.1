import http from "node:http";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const PORT = Number(process.env.PORT || 8787);
const MAX_BODY = 64 * 1024;
const MAX_OUTPUT = 64 * 1024;
const TIMEOUT_MS = 5000;

function send(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": process.env.ALLOW_ORIGIN || "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
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

async function runBash(code, stdin) {
  const dir = await mkdtemp(join(tmpdir(), "bossnu-"));
  const file = join(dir, "main.sh");
  await writeFile(file, code, { mode: 0o700 });

  try {
    return await new Promise((resolve) => {
      const child = spawn("/bin/bash", ["--noprofile", "--norc", file], {
        cwd: dir,
        env: { PATH: "/usr/local/bin:/usr/bin:/bin", HOME: dir, LANG: "C.UTF-8" },
        detached: true,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let settled = false;

      const append = (target, chunk) => (target + chunk.toString("utf8")).slice(-MAX_OUTPUT);
      const timer = setTimeout(() => {
        timedOut = true;
        try { process.kill(-child.pid, "SIGKILL"); } catch {}
      }, TIMEOUT_MS);

      child.stdout.on("data", (c) => { stdout = append(stdout, c); });
      child.stderr.on("data", (c) => { stderr = append(stderr, c); });
      child.on("error", (e) => { stderr = append(stderr, e); });
      child.on("close", (code, signal) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          exitCode: code,
          signal,
          status: timedOut ? "timeout" : code === 0 ? "success" : "error",
        });
      });

      if (stdin) child.stdin.write(String(stdin).slice(0, 16 * 1024));
      child.stdin.end();
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method === "GET" && req.url === "/health") return send(res, 200, { ok: true, runner: "bash", version: 1 });
  if (req.method !== "POST" || req.url !== "/execute") return send(res, 404, { error: "not_found" });

  try {
    const body = await readBody(req);
    if (body.language !== "bash") return send(res, 400, { error: "only_bash_supported" });
    if (typeof body.code !== "string" || body.code.length > 32 * 1024) return send(res, 400, { error: "invalid_code" });
    const started = Date.now();
    const result = await runBash(body.code, body.stdin);
    return send(res, 200, { ...result, durationMs: Date.now() - started });
  } catch (error) {
    return send(res, 400, { error: error instanceof Error ? error.message : "bad_request" });
  }
});

server.listen(PORT, "0.0.0.0", () => console.log(`bossnu bash sandbox listening on :${PORT}`));
