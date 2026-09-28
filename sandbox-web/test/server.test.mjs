import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SERVER = fileURLToPath(new URL("../server.mjs", import.meta.url));
const TOKEN = "test-token-abc123";

/** Boot the real server on an ephemeral port and wait for its startup line. */
async function startServerProcess(t, extraEnv = {}) {
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
  t.after(async () => {
    // SIGTERM is the path a supervisor actually uses; escalate only if ignored.
    child.kill("SIGTERM");
    const exited = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 5000);
      child.once("exit", () => { clearTimeout(timer); resolve(true); });
    });
    if (!exited) child.kill("SIGKILL");
    await rm(root, { recursive: true, force: true });
  });
  return { base: `http://127.0.0.1:${port}`, child, root };
}

async function startServer(t, extraEnv = {}) {
  return (await startServerProcess(t, extraEnv)).base;
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

// ---------------------------------------------------------------------------
// The console (สนามหลวง) is a pure client on top of this API — these cover the
// server behaviours it depends on.
// ---------------------------------------------------------------------------

const runStream = async (base, body) => {
  const response = await fetch(`${base}/execute/stream`, {
    method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });
  const events = [];
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() || "";
    for (const frame of frames) {
      const line = frame.split("\n").find((l) => l.startsWith("data:"));
      if (line) events.push(JSON.parse(line.slice(5)));
    }
  }
  return events.at(-1).result;
};

const snapshotFile = (result, path) => result.workspaceSnapshot.files.find((f) => f.path === path);

test("the console shell and its assets are served", async (t) => {
  const base = await startServer(t);
  for (const [path, type] of [["/", "text/html"], ["/styles.css", "text/css"], ["/js/app.js", "text/javascript"]]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, `${path} must be served`);
    assert.match(response.headers.get("content-type"), new RegExp(type.replace("/", "\\/")));
  }
  // Every element the script looks up must exist, or the console dies on boot.
  const html = await (await fetch(base + "/")).text();
  const js = await (await fetch(base + "/js/app.js")).text();
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  for (const id of [...js.matchAll(/\$\("([^"]+)"\)/g)].map((m) => m[1])) {
    assert.ok(ids.has(id), `index.html is missing #${id}, which app.js requires`);
  }
});

test("the snapshot carries file content and hashes so the editor can open and save", async (t) => {
  const base = await startServer(t);
  const workspace = `console-${Date.now().toString(36)}`;
  const created = await runStream(base, {
    language: "bash", workspace, snapshot: 1,
    command: 'mkdir -p project/src && printf \'export const name = "x";\\n\' > project/src/app.mjs',
  });
  const file = snapshotFile(created, "project/src/app.mjs");
  assert.equal(file.content, 'export const name = "x";\n');
  assert.match(file.sha256, /^[0-9a-f]{64}$/);

  // Saving sends the edited content plus the hash it was opened at, which makes
  // the seed a three-way merge rather than a fill-missing no-op.
  const saved = await runStream(base, {
    language: "bash", command: "true", workspace, snapshot: 1,
    workspaceFiles: [{ path: "project/src/app.mjs", content: 'export const name = "y";\n' }],
    workspaceBase: { "project/src/app.mjs": file.sha256 },
  });
  assert.deepEqual(saved.workspaceSeed.written, ["project/src/app.mjs"]);
  assert.equal(snapshotFile(saved, "project/src/app.mjs").content, 'export const name = "y";\n');
});

test("a stale save is reported as a conflict instead of clobbering the workspace", async (t) => {
  const base = await startServer(t);
  const workspace = `console-race-${Date.now().toString(36)}`;
  const created = await runStream(base, {
    language: "bash", workspace, snapshot: 1, command: 'mkdir -p project && printf "one\\n" > project/a.txt',
  });
  const stale = snapshotFile(created, "project/a.txt").sha256;
  await runStream(base, { language: "bash", workspace, snapshot: 1, command: 'printf "two\\n" > project/a.txt' });

  const raced = await runStream(base, {
    language: "bash", command: "true", workspace, snapshot: 1,
    workspaceFiles: [{ path: "project/a.txt", content: "console wins\n" }],
    workspaceBase: { "project/a.txt": stale },
  });
  assert.deepEqual(raced.workspaceSeed.conflicts, ["project/a.txt"]);
  assert.deepEqual(raced.workspaceSeed.written, []);
  assert.equal(snapshotFile(raced, "project/a.txt").content, "two\n");
});

test("a dev server started from a subdirectory gets a working preview", async (t) => {
  const base = await startServer(t, { DEV_TIMEOUT_MS: "60000" });
  const workspace = `console-dev-${Date.now().toString(36)}`;
  const port = 5400 + (Date.now() % 1000);
  const setup = await runStream(base, {
    language: "bash", workspace, snapshot: 1,
    command: `mkdir -p project/site && printf '%s' '{ "name": "site", "private": true, "type": "module", "scripts": { "dev": "node server.mjs" } }' > project/site/package.json && printf '%s' 'import http from "node:http"; http.createServer((q, s) => { s.writeHead(200, { "content-type": "text/html; charset=utf-8" }); s.end("<h1>preview-ok</h1>"); }).listen(${port}, "0.0.0.0", () => console.log("Local: http://localhost:${port}/"));' > project/site/server.mjs`,
  });
  assert.equal(setup.status, "success", setup.stderr);

  const dev = await runStream(base, { language: "node", command: "cd project/site && npm run dev", workspace, snapshot: 1 });
  assert.equal(dev.status, "running", `${dev.stderr || dev.stdout}`);
  assert.equal(dev.port, port);
  assert.match(dev.previewPath, /^\/preview\/[^/]+\/$/);

  const preview = await fetch(base + dev.previewPath);
  assert.equal(preview.status, 200);
  assert.match(await preview.text(), /preview-ok/);

  // The `npm install` this path runs must not litter the workspace: the console
  // renders the snapshot as a file tree, so npm's own cache/logs would show up
  // as project files. The lockfile it writes is legitimate project state.
  assert.deepEqual(dev.workspaceSnapshot.paths.sort(), [
    "project/site/package-lock.json",
    "project/site/package.json",
    "project/site/server.mjs",
  ]);
});

test("CONSOLE_DEMO_TOKEN pre-fills the console token, and only when it matches", async (t) => {
  // Off by default: a plain boot must not leak the token into the served page.
  const plain = await startServer(t);
  assert.doesNotMatch(await (await fetch(`${plain}/`)).text(), /__SANDBOX_DEMO_TOKEN__/);

  // Set to a token /execute* would reject → still no shim (it would be useless
  // and would only train visitors to trust a wrong credential).
  const wrong = await startServer(t, { CONSOLE_DEMO_TOKEN: "not-the-runner-token" });
  assert.doesNotMatch(await (await fetch(`${wrong}/`)).text(), /__SANDBOX_DEMO_TOKEN__/);

  // Set to the real token → the console page carries it for the boot shim.
  const demo = await startServer(t, { CONSOLE_DEMO_TOKEN: TOKEN });
  const html = await (await fetch(`${demo}/`)).text();
  assert.match(html, /window\.__SANDBOX_DEMO_TOKEN__ = "test-token-abc123";/);
  // The shim must land before the module that reads it.
  assert.ok(
    html.indexOf("__SANDBOX_DEMO_TOKEN__") < html.indexOf('<script type="module"'),
    "the shim must run before js/app.js",
  );
  // Only the shell carries the value — the served app.js stays byte-identical
  // to the file on disk, so the token cannot leak through any other asset.
  const servedJs = await (await fetch(`${demo}/js/app.js`)).text();
  assert.doesNotMatch(servedJs, /test-token-abc123/);
  assert.equal(servedJs, await readFile(fileURLToPath(new URL("../public/js/app.js", import.meta.url)), "utf8"));

  // And the injected value actually authenticates.
  const ran = await fetch(`${demo}/execute`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ language: "bash", command: "echo demo-ok", workspace: `demo-${Date.now().toString(36)}` }),
  });
  assert.equal((await ran.json()).stdout, "demo-ok\n");
});

test("killing the service also kills the dev servers it started", async (t) => {
  const { base, child } = await startServerProcess(t, { DEV_TIMEOUT_MS: "60000" });
  const workspace = `console-shutdown-${Date.now().toString(36)}`;
  const port = 5800 + (Date.now() % 200);
  const setup = await runStream(base, {
    language: "bash", workspace, snapshot: 1,
    command: `mkdir -p project/site && printf '%s' '{ "name": "site", "private": true, "type": "module", "scripts": { "dev": "node server.mjs" } }' > project/site/package.json && printf '%s' 'import http from "node:http"; http.createServer((q, s) => { s.writeHead(200); s.end("up"); }).listen(${port}, "0.0.0.0", () => console.log("Local: http://localhost:${port}/"));' > project/site/server.mjs`,
  });
  assert.equal(setup.status, "success", setup.stderr);

  const dev = await runStream(base, { language: "node", command: "cd project/site && npm run dev", workspace, snapshot: 1 });
  assert.equal(dev.status, "running", `${dev.stderr || dev.stdout}`);
  assert.equal(dev.port, port);
  assert.equal((await fetch(base + dev.previewPath)).status, 200, "the preview must work before shutdown");

  // A supervisor stops the service with SIGTERM. The dev server was spawned
  // detached, so it never sees that signal — the service has to reap it, or it
  // keeps the port and the next server to choose it dies with EADDRINUSE.
  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("exit", resolve));

  const deadline = Date.now() + 15000;
  for (;;) {
    let released = false;
    try { await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(300) }); }
    catch { released = true; }
    if (released) break;
    assert.ok(Date.now() < deadline, `the dev server still owns port ${port} after the service exited`);
    await new Promise((r) => setTimeout(r, 100));
  }
});
