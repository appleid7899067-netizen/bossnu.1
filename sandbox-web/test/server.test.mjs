import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SERVER = fileURLToPath(new URL("../server.mjs", import.meta.url));
const TOKEN = "test-token-abc123";

/** Boot the real server on an ephemeral port and wait for its startup line. */
async function startServer(t, extraEnv = {}) {
  const root = await mkdtemp(join(tmpdir(), "sandbox-web-test-"));
  const child = spawn(process.execPath, [SERVER], {
    env: { ...process.env, PORT: "0", HOST: "127.0.0.1", WORKSPACE_ROOT: root, RUNNER_TOKEN: TOKEN, COMMAND_TIMEOUT_MS: "3000", ...extraEnv },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const port = await new Promise((resolvePromise, reject) => {
    const timer = setTimeout(() => reject(new Error("server did not start")), 10000);
    child.once("error", reject);
    child.stdout.on("data", (chunk) => {
      const match = chunk.toString().match(/listening on :(\d+)/);
      if (match) { clearTimeout(timer); resolvePromise(match[1]); }
    });
  });
  t.after(async () => { child.kill("SIGKILL"); await rm(root, { recursive: true, force: true }); });
  return `http://127.0.0.1:${port}`;
}

const events = (text) =>
  text.split("\n").filter((line) => line.startsWith("data:")).map((line) => JSON.parse(line.slice(5)));

test("health is public and reports detected runtimes", async (t) => {
  const base = await startServer(t);
  const response = await fetch(`${base}/health`);
  assert.equal(response.status, 200);
  const health = await response.json();
  assert.equal(health.ok, true);
  assert.equal(health.version, 6);
  assert.equal(health.authRequired, true);
  assert.ok(health.runtimes.includes("bash"), `bash must be advertised: ${health.runtimes}`);
  assert.ok(health.runtimes.includes("node"), `node must be advertised: ${health.runtimes}`);
});

test("the web playground is served without a token", async (t) => {
  const base = await startServer(t);
  const response = await fetch(base + "/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(await response.text(), /Sandbox Web/);
});

test("static serving refuses to escape public/", async (t) => {
  const base = await startServer(t);
  const response = await fetch(`${base}/../server.mjs`, { redirect: "manual" });
  assert.notEqual(response.status, 200);
});

test("execution requires the bearer token", async (t) => {
  const base = await startServer(t);
  const anonymous = await fetch(base + "/execute", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ command: "printf secret" }),
  });
  assert.equal(anonymous.status, 401);
  assert.deepEqual(await anonymous.json(), { error: "unauthorized" });

  const wrong = await fetch(base + "/execute", {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer nope" },
    body: JSON.stringify({ command: "printf secret" }),
  });
  assert.equal(wrong.status, 401);
});

test("runs a command, keeps the workspace between calls and isolates workspaces", async (t) => {
  const base = await startServer(t);
  const run = async (command, workspace, language = "bash") =>
    (await fetch(base + "/execute", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ language, command, workspace, snapshot: 1 }),
    })).json();

  const first = await run("mkdir -p project && printf persistent > project/note.txt && cat project/note.txt", "ws_a");
  assert.equal(first.status, "success", first.stderr);
  assert.equal(first.stdout, "persistent");
  assert.deepEqual(first.workspaceSnapshot.paths, ["project/note.txt"]);

  const second = await run("cat project/note.txt", "ws_a");
  assert.equal(second.stdout, "persistent", "the same workspace id keeps its files");

  const other = await run("test ! -e project/note.txt && printf isolated", "ws_b");
  assert.equal(other.status, "success", other.stderr);
  assert.equal(other.stdout, "isolated");
});

test("rejects unsafe workspace ids and empty commands", async (t) => {
  const base = await startServer(t);
  const post = (body) =>
    fetch(base + "/execute", {
      method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(body),
    });
  assert.equal((await post({ command: "pwd", workspace: "../escape" })).status, 400);
  assert.equal((await post({ command: "   " })).status, 400);
});

test("streams live output and a complete event over SSE", async (t) => {
  const base = await startServer(t);
  const response = await fetch(base + "/execute/stream", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "text/event-stream", authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ language: "bash", command: "printf first; sleep 0.2; printf second", workspace: "stream_ws", snapshot: 1 }),
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/event-stream/);
  const frames = events(await response.text());
  assert.ok(frames.some((e) => e.type === "status" && e.status === "running"));
  assert.ok(frames.some((e) => e.type === "output" && e.text === "first"));
  const complete = frames.at(-1);
  assert.equal(complete.type, "complete");
  assert.equal(complete.result.status, "success");
  assert.equal(complete.result.stdout, "firstsecond");
});

test("one command at a time per workspace", async (t) => {
  const base = await startServer(t, { MAX_ACTIVE_RUNS: "4" });
  const headers = { "content-type": "application/json", authorization: `Bearer ${TOKEN}` };
  const lock = new AbortController();
  const running = fetch(base + "/execute/stream", {
    method: "POST", headers, body: JSON.stringify({ command: "sleep 1", workspace: "locked" }), signal: lock.signal,
  });
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 300));
  const busy = await (await fetch(base + "/execute", {
    method: "POST", headers, body: JSON.stringify({ command: "pwd", workspace: "locked" }),
  })).json();
  assert.equal(busy.error, "workspace_busy");
  lock.abort();
  await running.then((r) => r.body?.cancel()).catch(() => {});
});

test("python-safe runs the guarded interpreter when python3 is present", async (t) => {
  const base = await startServer(t);
  const health = await (await fetch(base + "/health")).json();
  if (!health.runtimes.includes("python-safe")) return; // image without python3
  const run = async (command, stdin) =>
    (await fetch(base + "/execute", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ language: "python-safe", command, stdin, workspace: "py_safe", snapshot: 1 }),
    })).json();

  const ok = await run('values = [2, 3, 5]\nprint(sum(values))\nprint(input())', "from stdin\n");
  assert.equal(ok.status, "success", ok.stderr);
  assert.equal(ok.stdout, "10\nfrom stdin\n");

  const blocked = await run("import os\nprint(1)");
  assert.equal(blocked.status, "error");
  assert.match(blocked.stderr, /Python Safe blocked: Import/);
});

test("rate limiting answers 429 past the configured budget", async (t) => {
  const base = await startServer(t, { RATE_LIMIT_MAX: "2", RATE_LIMIT_WINDOW_MS: "60000" });
  const headers = { "content-type": "application/json", authorization: `Bearer ${TOKEN}` };
  const statuses = [];
  for (let i = 0; i < 4; i += 1) {
    const response = await fetch(base + "/execute", { method: "POST", headers, body: JSON.stringify({ command: "true" }) });
    statuses.push(response.status);
    await response.json().catch(() => null);
  }
  assert.ok(statuses.includes(429), `expected a 429 among ${statuses.join(",")}`);
});

test("the server refuses to boot without a token unless explicitly allowed", async () => {
  const child = spawn(process.execPath, [SERVER], {
    env: { ...process.env, PORT: "0", RUNNER_TOKEN: "" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stderr = await new Promise((resolvePromise) => {
    let text = "";
    child.stderr.on("data", (chunk) => { text += chunk.toString(); });
    child.on("exit", () => resolvePromise(text));
    setTimeout(() => { child.kill("SIGKILL"); resolvePromise(text); }, 8000);
  });
  assert.match(stderr, /RUNNER_TOKEN is required/);
});
