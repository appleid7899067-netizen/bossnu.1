/**
 * Loads the actual สนามหลวง console (the served HTML + the served js/app.js)
 * into a DOM and drives it with clicks, against a real sandbox-web server.
 *
 * This executes the shipping browser code — no re-implementation of its logic.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";

const SERVER = fileURLToPath(new URL("../sandbox-web/server.mjs", import.meta.url));
const TOKEN = "ui-test-token";

async function startServer(t) {
  const root = await mkdtemp(join(tmpdir(), "console-ui-"));
  const child = spawn(process.execPath, [SERVER], {
    env: { ...process.env, PORT: "0", HOST: "127.0.0.1", WORKSPACE_ROOT: root, RUNNER_TOKEN: TOKEN, COMMAND_TIMEOUT_MS: "20000" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("server did not start")), 15000);
    child.once("error", reject);
    child.stdout.on("data", (chunk) => {
      const match = chunk.toString().match(/listening on :(\d+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  t.after(async () => { child.kill("SIGKILL"); await rm(root, { recursive: true, force: true }); });
  return `http://127.0.0.1:${port}`;
}

/** Boot the console in a DOM wired to a live server. */
async function loadConsole(t, base) {
  const html = await (await fetch(`${base}/`)).text();
  const virtualConsole = new VirtualConsole();
  const errors = [];
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));
  virtualConsole.on("error", (...args) => errors.push(args.join(" ")));

  const dom = new JSDOM(html, {
    url: `${base}/`,
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    virtualConsole,
  });
  const { window } = dom;

  // jsdom has no fetch/SSE; hand it the real ones so the console talks HTTP for real.
  // The shim runs in Node's realm, where a relative URL will not parse, so it
  // has to be resolved against the server. Absolute URLs (the console builds
  // some from location.origin) are passed through untouched.
  window.fetch = (input, init) => {
    const url = typeof input === "string" && !/^[a-z][a-z0-9+.-]*:/i.test(input) ? `${base}${input}` : input;
    return fetch(url, init);
  };
  window.AbortController = AbortController;
  window.TextDecoder = TextDecoder;
  // jsdom exposes these as getter-only, so they have to be redefined, not assigned.
  Object.defineProperty(window, "performance", { value: performance, configurable: true });
  window.confirm = () => true;
  Object.defineProperty(window.navigator, "clipboard", {
    value: { writeText: async () => {} }, configurable: true,
  });

  t.after(() => window.close());
  await new Promise((resolve) => {
    if (window.document.readyState === "complete") return resolve();
    window.addEventListener("load", resolve);
  });

  // jsdom does not execute <script type="module">, so the very file the browser
  // loads is fetched from the server and evaluated in the window here. The code
  // under test is byte-identical; only the loader differs.
  const source = await (await fetch(`${base}/js/app.js`)).text();
  window.eval(source);

  // The boot script polls /health and renders runtimes; wait for that.
  await waitFor(() => window.document.getElementById("language").options.length > 0, "runtimes rendered");
  return { window, errors };
}

async function waitFor(predicate, label, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`timed out waiting for ${label}`);
}

const text = (window) => window.document.getElementById("output").textContent;

test("clicking รัน runs the editor code and fills the terminal", async (t) => {
  const base = await startServer(t);
  const { window, errors } = await loadConsole(t, base);
  const doc = window.document;

  doc.getElementById("token").value = TOKEN;
  doc.getElementById("language").value = "bash";
  doc.getElementById("language").dispatchEvent(new window.Event("change"));
  doc.getElementById("workspace").value = "ui-run";
  doc.getElementById("command").value = 'mkdir -p project && echo สวัสดีจากคอนโซล > project/a.txt && cat project/a.txt';
  doc.getElementById("run").click();

  await waitFor(() => doc.getElementById("status-pill").textContent === "success", "the run to finish");
  assert.match(text(window), /รับคำสั่งแล้ว/);
  assert.match(text(window), /สวัสดีจากคอนโซล/);
  assert.match(doc.getElementById("meta").textContent, /exit 0/);

  // The file tree must show what the run produced.
  await waitFor(() => doc.querySelectorAll("#tree .tree-row").length > 0, "file tree");
  assert.match(doc.getElementById("tree").textContent, /a\.txt/);
  assert.deepEqual(errors, [], `console errors: ${errors.join("; ")}`);
});

test("the terminal keeps scrollback and recalls history with ArrowUp", async (t) => {
  const base = await startServer(t);
  const { window } = await loadConsole(t, base);
  const doc = window.document;

  doc.getElementById("token").value = TOKEN;
  doc.getElementById("workspace").value = "ui-history";
  const prompt = doc.getElementById("prompt");

  const type = (command) => {
    prompt.value = command;
    doc.getElementById("prompt-form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  };

  const settled = () => ["success", "error", "idle"].includes(doc.getElementById("status-pill").textContent);
  type("echo หนึ่ง");
  await waitFor(() => settled() && /หนึ่ง/.test(text(window)), "first command");
  type("echo สอง");
  await waitFor(() => settled() && /สอง/.test(text(window)), "second command");

  // Both runs are still on screen — the console no longer clears per run.
  assert.match(text(window), /หนึ่ง/);
  assert.match(text(window), /สอง/);
  assert.match(text(window), /ui-history \$ echo หนึ่ง/, "the echoed prompt line is shown");

  prompt.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
  assert.equal(prompt.value, "echo สอง");
  prompt.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
  assert.equal(prompt.value, "echo หนึ่ง");
  prompt.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  assert.equal(prompt.value, "echo สอง");
});

test("opening a file from the tree loads it, and บันทึกไฟล์ writes it back", async (t) => {
  const base = await startServer(t);
  const { window } = await loadConsole(t, base);
  const doc = window.document;

  doc.getElementById("token").value = TOKEN;
  doc.getElementById("workspace").value = "ui-edit";
  doc.getElementById("command").value = 'mkdir -p project && printf \'export const n = 1;\\n\' > project/app.mjs';
  doc.getElementById("run").click();
  await waitFor(() => doc.querySelectorAll("#tree .tree-row").length > 0, "file tree");
  assert.equal(doc.getElementById("status-pill").textContent, "success");

  // Click the file in the tree → its content lands in the editor.
  const row = [...doc.querySelectorAll("#tree .tree-row")].find((el) => /app\.mjs/.test(el.textContent));
  assert.ok(row, "app.mjs must be listed");
  row.click();
  assert.equal(doc.getElementById("command").value, "export const n = 1;\n");
  assert.equal(doc.getElementById("editor-title").textContent, "app.mjs");

  // Edit and save; the run seeds the file, so the disk must change.
  doc.getElementById("command").value = "export const n = 2;\n";
  doc.getElementById("command").dispatchEvent(new window.Event("input"));
  assert.match(doc.getElementById("editor-meta").textContent, /ยังไม่บันทึก/);
  doc.getElementById("save-file").click();

  await waitFor(() => /บันทึก project\/app\.mjs|✓ บันทึก/.test(text(window)), "save confirmation");
  assert.equal(doc.getElementById("status-pill").textContent, "success");

  // Read it back straight from the server, not through the UI.
  const check = await fetch(`${base}/execute`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ language: "bash", command: "cat project/app.mjs", workspace: "ui-edit", snapshot: 1 }),
  });
  const result = await check.json();
  assert.equal(result.stdout, "export const n = 2;\n");
});

test("a new tab is an isolated session with its own workspace", async (t) => {
  const base = await startServer(t);
  const { window } = await loadConsole(t, base);
  const doc = window.document;

  doc.getElementById("token").value = TOKEN;
  doc.getElementById("workspace").value = "ui-tab-a";
  doc.getElementById("command").value = "echo แท็บแรก";
  doc.getElementById("run").click();
  await waitFor(() => doc.getElementById("status-pill").textContent === "success", "first tab run");
  assert.match(text(window), /แท็บแรก/);

  doc.getElementById("tab-new").click();
  assert.equal(doc.querySelectorAll("#tabs .tab").length, 2, "a second tab exists");
  assert.equal(text(window), "", "the new tab starts with an empty terminal");
  assert.notEqual(doc.getElementById("workspace").value, "ui-tab-a");

  // Switching back restores the first tab's scrollback.
  doc.querySelectorAll("#tabs .tab")[0].click();
  assert.match(text(window), /แท็บแรก/);
  assert.equal(doc.getElementById("workspace").value, "ui-tab-a");
});

test("running without a token is refused in the UI before any request", async (t) => {
  const base = await startServer(t);
  const { window } = await loadConsole(t, base);
  const doc = window.document;

  doc.getElementById("token").value = "";
  doc.getElementById("command").value = "echo should-not-run";
  doc.getElementById("run").click();

  await waitFor(() => /ยังไม่ได้ใส่ Bearer token/.test(text(window)), "token warning");
  assert.equal(doc.getElementById("status-pill").textContent, "error");
  assert.doesNotMatch(text(window), /should-not-run/);
});
