/**
 * สนามหลวง — Sandbox Web Console
 *
 * A multi-session console for one sandbox-web service. Everything here is
 * browser-side and talks only to this origin with the same v6 contract the
 * server already speaks (`/health`, `/execute/stream`) — the console adds no
 * server endpoints of its own.
 *
 * The token lives in localStorage and is sent as a bearer header; it is never
 * rendered into the document.
 */

const $ = (id) => document.getElementById(id);

const els = {
  healthDot: $("health-dot"),
  healthText: $("health-text"),
  token: $("token"),
  tabs: $("tabs"),
  tabNew: $("tab-new"),
  language: $("language"),
  workspace: $("workspace"),
  stdinField: $("stdin-field"),
  stdin: $("stdin"),
  run: $("run"),
  stop: $("stop"),
  saveFile: $("save-file"),
  runDev: $("run-dev"),
  copyCurl: $("copy-curl"),
  clear: $("clear"),
  filesRefresh: $("files-refresh"),
  filesHint: $("files-hint"),
  tree: $("tree"),
  editorTitle: $("editor-title"),
  editorMeta: $("editor-meta"),
  gutter: $("gutter"),
  command: $("command"),
  status: $("status-pill"),
  meta: $("meta"),
  output: $("output"),
  promptForm: $("prompt-form"),
  promptLabel: $("prompt-label"),
  prompt: $("prompt"),
  previewBox: $("preview-box"),
  previewMeta: $("preview-meta"),
  previewReload: $("preview-reload"),
  previewOpen: $("preview-open"),
  previewClose: $("preview-close"),
  previewFrame: $("preview-frame"),
  statusLeft: $("status-left"),
  limits: $("limits"),
};

const STORE = { token: "sandbox-web.token", sessions: "sandbox-web.sessions.v1" };

const RUNTIME = {
  bash: { label: "Bash / Shell", file: null, ext: "sh", hint: "คำสั่ง shell", dev: false },
  node: { label: "JavaScript (node)", file: "main.mjs", hint: "โค้ด JavaScript — รันด้วย node main.mjs", dev: true },
  javascript: { label: "JavaScript (node)", file: "main.mjs", hint: "โค้ด JavaScript — รันด้วย node main.mjs", dev: true },
  python: { label: "Python", file: "main.py", hint: "โค้ด Python — รันด้วย python3 main.py", dev: false },
  "python-safe": { label: "Python (Safe)", file: "main.py", hint: "Python แบบมี Aether AST guard + stdin", dev: false, stdin: true },
  go: { label: "Go", file: "main.go", hint: "โค้ด Go — go run main.go", dev: false },
  rust: { label: "Rust", file: "main.rs", hint: "โค้ด Rust — rustc main.rs", dev: false },
  java: { label: "Java", file: "Main.java", hint: "โค้ด Java — java Main.java", dev: false },
  cpp: { label: "C++", file: "main.cpp", hint: "โค้ด C++ — g++ -std=c++20 main.cpp", dev: false },
};

const TEMPLATES = {
  bash: "#!/usr/bin/env bash\nset -euo pipefail\n\necho \"สวัสดีจากสนามหลวง\"\nuname -a\n",
  node: 'const total = [2, 3, 5].reduce((a, b) => a + b, 0);\nconsole.log("ผลรวม:", total);\n',
  python: 'values = [2, 3, 5]\nprint("ผลรวม:", sum(values))\n',
  "python-safe": 'values = [2, 3, 5]\nprint("ผลรวม:", sum(values))\nprint("stdin:", input())\n',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("สวัสดีจาก Go")\n}\n',
  rust: 'fn main() {\n    println!("สวัสดีจาก Rust");\n}\n',
  java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("สวัสดีจาก Java");\n  }\n}\n',
  cpp: '#include <iostream>\nint main() { std::cout << "สวัสดีจาก C++\\n"; }\n',
};

// ---------------------------------------------------------------------------
// Session state — one tab = one workspace + editor + terminal scrollback
// ---------------------------------------------------------------------------

let sessions = [];
let activeId = null;
let controller = null;
let runtimes = Object.keys(RUNTIME);

const newId = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function makeSession(index = sessions.length + 1) {
  const language = runtimes.includes("bash") ? "bash" : runtimes[0] || "bash";
  return {
    id: newId(),
    name: `เซสชัน ${index}`,
    language,
    workspace: `sanamluang-${index}`,
    code: TEMPLATES[language] || "",
    stdin: "",
    openFile: null,
    openFileHash: null,
    dirty: false,
    files: [],
    history: [],
    status: "idle",
    preview: null,
  };
}

const active = () => sessions.find((s) => s.id === activeId) || sessions[0];

function persist() {
  // Only the small, user-owned parts are stored; scrollback and file contents
  // are rebuilt from the server so localStorage stays tiny.
  const slim = sessions.map(({ id, name, language, workspace, code, stdin, history }) => ({
    id, name, language, workspace, code, stdin, history: history.slice(-40),
  }));
  try { localStorage.setItem(STORE.sessions, JSON.stringify({ activeId, sessions: slim })); } catch { /* quota */ }
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE.sessions) || "null");
    if (!saved?.sessions?.length) return false;
    sessions = saved.sessions.map((s) => ({
      ...makeSession(), ...s,
      openFile: null, openFileHash: null, dirty: false, files: [], status: "idle", preview: null,
    }));
    activeId = sessions.some((s) => s.id === saved.activeId) ? saved.activeId : sessions[0].id;
    return true;
  } catch { return false; }
}

// ---------------------------------------------------------------------------
// Terminal
// ---------------------------------------------------------------------------

const MAX_LINES = 4000;

function write(text, className = "") {
  if (!text) return;
  const span = document.createElement("span");
  if (className) span.className = className;
  span.textContent = text;
  els.output.appendChild(span);
  while (els.output.childNodes.length > MAX_LINES) els.output.removeChild(els.output.firstChild);
  els.output.scrollTop = els.output.scrollHeight;
}

function echo(command) {
  write(`${els.promptLabel.textContent} ${command}\n`, "echo");
}

function note(message, className = "system") {
  write(`${message}\n`, className);
}

function setStatus(status) {
  const session = active();
  if (session) session.status = status;
  els.status.textContent = status;
  els.status.className = `pill ${["success", "error", "running"].includes(status) ? status : ""}`;
  renderTabs();
}

function leftMessage(message, tone = "") {
  els.statusLeft.textContent = message;
  els.statusLeft.className = tone;
}

// ---------------------------------------------------------------------------
// File tree — built from workspaceSnapshot, which already carries content
// ---------------------------------------------------------------------------

function treeFromPaths(paths) {
  const root = { name: "", dirs: new Map(), files: [] };
  for (const path of paths) {
    const parts = String(path).replace(/^project\//, "").split("/").filter(Boolean);
    let node = root;
    for (const part of parts.slice(0, -1)) {
      if (!node.dirs.has(part)) node.dirs.set(part, { name: part, dirs: new Map(), files: [] });
      node = node.dirs.get(part);
    }
    node.files.push({ name: parts.at(-1) || path, path });
  }
  return root;
}

function renderTree() {
  const session = active();
  const files = session?.files || [];
  els.filesHint.hidden = files.length > 0;
  els.tree.replaceChildren();
  if (!files.length) return;

  const byPath = new Map(files.map((f) => [f.path, f]));

  const renderNode = (node, container) => {
    for (const dir of [...node.dirs.values()].sort((a, b) => a.name.localeCompare(b.name))) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tree-group";
      button.textContent = `▸ ${dir.name}/`;
      const children = document.createElement("div");
      children.className = "tree-children";
      children.hidden = true;
      button.addEventListener("click", () => {
        children.hidden = !children.hidden;
        button.textContent = `${children.hidden ? "▸" : "▾"} ${dir.name}/`;
      });
      container.append(button, children);
      renderNode(dir, children);
    }
    for (const file of node.files.sort((a, b) => a.name.localeCompare(b.name))) {
      const info = byPath.get(file.path) || {};
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tree-row";
      button.setAttribute("role", "treeitem");
      if (session.openFile === file.path) button.setAttribute("aria-current", "true");
      const name = document.createElement("span");
      name.textContent = file.name;
      const size = document.createElement("span");
      size.className = "size";
      size.textContent = `${info.size ?? 0} B`;
      button.append(name, size);
      button.title = file.path;
      button.addEventListener("click", () => openFile(file.path));
      container.appendChild(button);
    }
  };

  renderNode(treeFromPaths(files.map((f) => f.path)), els.tree);
}

function openFile(path) {
  const session = active();
  const file = session.files.find((f) => f.path === path);
  if (!file) return;
  if (typeof file.content !== "string") {
    note(`✗ ${path} ไม่มีเนื้อหาใน snapshot (ไบนารีหรือใหญ่เกินลิมิต) — ลอง cat ผ่านเทอร์มินัล`, "stderr");
    return;
  }
  if (session.dirty && !confirm("มีการแก้ไขที่ยังไม่บันทึก จะทิ้งการแก้ไขนั้น?")) return;
  session.openFile = path;
  session.openFileHash = file.sha256 || null;
  session.code = file.content;
  session.dirty = false;
  syncEditor();
  renderTree();
  leftMessage(`เปิด ${path} — แก้แล้วกด “บันทึกไฟล์” เพื่อเขียนกลับ`, "ok");
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

function syncEditor() {
  const session = active();
  const info = RUNTIME[session.language] || RUNTIME.bash;
  els.command.value = session.code;
  els.editorTitle.textContent = session.openFile
    ? session.openFile.replace(/^project\//, "")
    : info.file || "shell";
  els.editorMeta.textContent = [
    info.hint,
    session.dirty ? "● ยังไม่บันทึก" : "",
    `${session.code.split("\n").length} บรรทัด`,
  ].filter(Boolean).join(" • ");
  syncGutter();
}

function syncGutter() {
  const lines = els.command.value.split("\n").length;
  els.gutter.textContent = Array.from({ length: lines }, (_, i) => i + 1).join("\n");
  els.gutter.scrollTop = els.command.scrollTop;
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

function renderTabs() {
  els.tabs.replaceChildren(
    ...sessions.map((session) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "tab";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(session.id === activeId));

      const dot = document.createElement("span");
      dot.className = `tab-dot ${session.status}`;
      const name = document.createElement("span");
      name.className = "tab-name";
      name.textContent = session.name;
      const close = document.createElement("button");
      close.type = "button";
      close.className = "tab-close";
      close.textContent = "✕";
      close.title = "ปิดเซสชัน";
      close.addEventListener("click", (event) => { event.stopPropagation(); closeSession(session.id); });

      tab.append(dot, name, close);
      tab.addEventListener("click", () => switchTo(session.id));
      return tab;
    }),
  );
}

function switchTo(id) {
  const session = sessions.find((s) => s.id === id);
  if (!session || session.id === activeId) return;
  active().code = els.command.value;
  activeId = id;
  els.workspace.value = session.workspace;
  els.language.value = session.language;
  els.stdin.value = session.stdin;
  els.output.replaceChildren();
  for (const line of session.scrollback || []) write(line.text, line.className);
  setStatus(session.status || "idle");
  applyRuntime();
  syncEditor();
  renderTree();
  renderPreview();
  persist();
}

function closeSession(id) {
  if (sessions.length === 1) { note("ต้องมีอย่างน้อยหนึ่งเซสชัน", "stderr"); return; }
  const index = sessions.findIndex((s) => s.id === id);
  sessions.splice(index, 1);
  if (activeId === id) {
    activeId = sessions[Math.max(0, index - 1)].id;
    const session = active();
    els.workspace.value = session.workspace;
    els.language.value = session.language;
    els.output.replaceChildren();
    setStatus(session.status || "idle");
    applyRuntime();
    syncEditor();
    renderTree();
    renderPreview();
  }
  renderTabs();
  persist();
}

// ---------------------------------------------------------------------------
// Preview (dev-server sessions are proxied by the server at /preview/<id>/)
// ---------------------------------------------------------------------------

function renderPreview() {
  const session = active();
  const preview = session?.preview;
  els.previewBox.hidden = !preview;
  if (!preview) return;
  els.previewMeta.textContent = `${preview.sessionId} • port ${preview.port ?? "?"}`;
  els.previewOpen.href = preview.path;
  if (els.previewFrame.getAttribute("src") !== preview.path) els.previewFrame.src = preview.path;
}

// ---------------------------------------------------------------------------
// Running
// ---------------------------------------------------------------------------

function authHeaders() {
  const token = els.token.value.trim();
  return {
    "content-type": "application/json",
    accept: "text/event-stream",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

function requestBody(command, language, options = {}) {
  const body = { language, command, workspace: els.workspace.value.trim() || undefined, snapshot: 1 };
  if (language === "python-safe") body.stdin = els.stdin.value;
  // Seed = write files back into the workspace before the command runs. These
  // are the same fields the app sends, so saving needs no extra endpoint.
  if (options.seed) {
    body.workspaceFiles = options.seed.files;
    body.workspaceBase = options.seed.base;
  }
  return body;
}

/**
 * Saving sends the edited file *and* the hash it was loaded at, which is what
 * turns the seed into a three-way merge: the server writes only when the file
 * on disk still matches that hash, and reports a conflict otherwise. Sending
 * content alone would be a no-op, because a bare seed only fills missing files.
 */
function seedPayload() {
  const session = active();
  if (!session.openFile || !session.dirty || !session.openFileHash) return null;
  const path = session.openFile.startsWith("project/") ? session.openFile : `project/${session.openFile}`;
  return { files: [{ path, content: session.code }], base: { [path]: session.openFileHash } };
}

function remember(command) {
  const session = active();
  session.history = [...(session.history || []).filter((line) => line !== command), command].slice(-100);
  session.historyIndex = session.history.length;
}

async function run(command, language, options) {
  const session = active();
  if (!els.token.value.trim()) {
    setStatus("error");
    note("✗ ยังไม่ได้ใส่ Bearer token — เซิร์ฟเวอร์นี้ปฏิเสธทุกคำสั่งที่ไม่มี token", "stderr");
    leftMessage("ต้องใส่ token ก่อนรัน", "error");
    els.token.focus();
    return;
  }
  if (session.status === "running") { note("✗ เซสชันนี้กำลังรันอยู่ — กดหยุดก่อน", "stderr"); return; }

  localStorage.setItem(STORE.token, els.token.value.trim());
  const seed = options?.seed !== undefined ? options.seed : seedPayload();
  const body = requestBody(command, language, { seed });

  echo(command);
  if (seed) note(`↥ บันทึก ${seed.files.map((f) => f.path.replace(/^project\//, "")).join(", ")}`, "info");

  controller = new AbortController();
  els.run.disabled = true;
  els.stop.disabled = false;
  els.prompt.disabled = true;
  setStatus("running");
  leftMessage(`กำลังรันใน ${session.workspace}…`);
  const started = performance.now();
  session.scrollback = [];

  try {
    const response = await fetch("/execute/stream", {
      method: "POST", headers: authHeaders(), body: JSON.stringify(body), signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      const detail = await response.json().catch(() => null);
      setStatus("error");
      note(detail?.error ? `✗ เซิร์ฟเวอร์ปฏิเสธ: ${detail.error} (HTTP ${response.status})` : `✗ HTTP ${response.status}`, "stderr");
      leftMessage(detail?.error || `HTTP ${response.status}`, "error");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() || "";
      for (const frame of frames) {
        const line = frame.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        let event;
        try { event = JSON.parse(line.slice(5)); } catch { continue; }
        handle(event, started);
      }
      if (done) break;
    }
  } catch (error) {
    setStatus("error");
    note(error?.name === "AbortError" ? "■ หยุดการรันแล้ว" : `✗ ${error?.message || error}`, "stderr");
    leftMessage(error?.name === "AbortError" ? "หยุดการรันแล้ว" : String(error?.message || error), "error");
  } finally {
    controller = null;
    els.run.disabled = false;
    els.stop.disabled = true;
    els.prompt.disabled = false;
    els.prompt.focus();
    persist();
  }
}

function handle(event, started) {
  const session = active();
  if (event.type === "status") { note(`• ${event.message}`); return; }
  if (event.type === "output") {
    const className = event.stream === "stderr" ? "stderr" : "";
    write(event.text, className);
    session.scrollback.push({ text: event.text, className });
    return;
  }
  if (event.type === "error") { note(`✗ ${event.error}`, "stderr"); return; }
  if (event.type !== "complete") return;

  const result = event.result || {};
  const seedReport = result.workspaceSeed;
  if (seedReport?.conflicts?.length) {
    note(`✗ บันทึกไม่สำเร็จ — ไฟล์ถูกแก้บนเซิร์ฟเวอร์ก่อน: ${seedReport.conflicts.join(", ")}`, "stderr");
  } else if (seedReport?.written?.length) {
    const session = active();
    session.dirty = false;
    note(`✓ บันทึก ${seedReport.written.join(", ")}`, "system");
  }
  const seconds = ((result.durationMs ?? performance.now() - started) / 1000).toFixed(2);
  setStatus(result.status === "running" ? "success" : result.status || (result.success ? "success" : "error"));
  els.meta.textContent = [
    `exit ${result.exitCode ?? "—"}`,
    `${seconds}s`,
    result.workspaceSnapshot?.complete === false ? "snapshot ไม่ครบ" : "",
  ].filter(Boolean).join(" • ");
  leftMessage(
    result.status === "running"
      ? `dev server กำลังรัน — ดูตัวอย่างด้านล่าง`
      : `เสร็จใน ${seconds}s (exit ${result.exitCode ?? "—"})`,
    result.status === "error" ? "error" : "ok",
  );

  const files = result.workspaceSnapshot?.files;
  if (Array.isArray(files)) {
    session.files = files;
    renderTree();
    if (session.openFile) {
      const fresh = files.find((f) => f.path === session.openFile);
      if (fresh && typeof fresh.content === "string") {
        session.openFileHash = fresh.sha256 || null;
        if (!session.dirty) {
          session.code = fresh.content;
          syncEditor();
        }
      }
    }
  }

  if (result.previewPath) {
    session.preview = { path: result.previewPath, sessionId: result.sessionId, port: result.port };
    renderPreview();
  } else if (result.status !== "running") {
    session.preview = null;
    renderPreview();
  }
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

function applyRuntime() {
  const session = active();
  const info = RUNTIME[session.language] || RUNTIME.bash;
  els.stdinField.hidden = !info.stdin;
  els.runDev.hidden = !info.dev;
  els.command.placeholder = info.hint;
  syncEditor();
}

function currentCommand() {
  const session = active();
  const code = els.command.value;
  session.code = code;
  return session.language === "python-safe" ? code : code.trim();
}

function curlSnippet() {
  const token = els.token.value.trim() || "$RUNNER_TOKEN";
  const payload = JSON.stringify(requestBody(currentCommand(), active().language)).replace(/"/g, '\\"');
  return `curl -N -X POST ${location.origin}/execute/stream \\\n  -H 'content-type: application/json' \\\n  -H 'authorization: Bearer ${token}' \\\n  -d "${payload}"`;
}

async function refreshHealth() {
  try {
    const response = await fetch("/health", { headers: { accept: "application/json" } });
    const data = await response.json();
    els.healthDot.className = `dot ${data.ok ? "ok" : "bad"}`;
    els.healthText.textContent = data.ok
      ? `${data.service || "sandbox"} v${data.version} • ${data.runtimes.length} runtimes • ${data.authRequired ? "ต้องมี token" : "ไม่ต้อง token"}`
      : "ไม่พร้อมใช้งาน";
    els.limits.textContent = data.ok
      ? `${data.runtimes.join(" ")} • ${data.sessions ?? 0} dev sessions • python-safe ${data.pythonSafe ? "พร้อม" : "ไม่มี"}`
      : "";
    if (data.ok && Array.isArray(data.runtimes) && data.runtimes.join() !== runtimes.join()) {
      runtimes = data.runtimes;
      renderRuntimeOptions();
    }
  } catch {
    els.healthDot.className = "dot bad";
    els.healthText.textContent = "ติดต่อเซิร์ฟเวอร์ไม่ได้";
  }
}

function renderRuntimeOptions() {
  const session = active();
  els.language.replaceChildren(
    ...runtimes.map((id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = RUNTIME[id]?.label || id;
      return option;
    }),
  );
  if (!runtimes.includes(session.language)) session.language = runtimes[0];
  els.language.value = session.language;
  applyRuntime();
}

els.language.addEventListener("change", () => {
  const session = active();
  const previous = session.language;
  session.language = els.language.value;
  session.openFile = null;
  session.openFileHash = null;
  if (!session.dirty && TEMPLATES[previous] === els.command.value.trim()) {
    session.code = TEMPLATES[session.language] || "";
  }
  applyRuntime();
  persist();
});

els.workspace.addEventListener("change", () => {
  active().workspace = els.workspace.value.trim();
  els.promptLabel.textContent = `~/${active().workspace || "project"} $`;
  renderTabs();
  persist();
});

els.command.addEventListener("input", () => {
  const session = active();
  session.code = els.command.value;
  if (session.openFile) session.dirty = true;
  syncGutter();
  els.editorMeta.textContent = [
    RUNTIME[session.language]?.hint || "",
    session.dirty ? "● ยังไม่บันทึก" : "",
    `${session.code.split("\n").length} บรรทัด`,
  ].filter(Boolean).join(" • ");
  persist();
});

els.command.addEventListener("scroll", syncGutter);

els.command.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    run(currentCommand(), active().language);
    return;
  }
  if (event.key === "Tab") {
    event.preventDefault();
    const start = els.command.selectionStart;
    const end = els.command.selectionEnd;
    els.command.setRangeText("  ", start, end, "end");
    els.command.dispatchEvent(new Event("input"));
  }
});

els.promptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const command = els.prompt.value.trim();
  if (!command) return;
  els.prompt.value = "";
  remember(command);
  run(command, "bash");
});

els.prompt.addEventListener("keydown", (event) => {
  const session = active();
  const history = session.history || [];
  if (event.key === "ArrowUp") {
    event.preventDefault();
    session.historyIndex = Math.max(0, (session.historyIndex ?? history.length) - 1);
    els.prompt.value = history[session.historyIndex] ?? "";
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    session.historyIndex = Math.min(history.length, (session.historyIndex ?? history.length) + 1);
    els.prompt.value = history[session.historyIndex] ?? "";
  } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
    controller?.abort();
  }
});

els.run.addEventListener("click", () => run(currentCommand(), active().language));
els.stop.addEventListener("click", () => controller?.abort());
els.runDev.addEventListener("click", () => run("npm run dev", active().language));
els.clear.addEventListener("click", () => {
  els.output.replaceChildren();
  els.meta.textContent = "";
  active().scrollback = [];
  setStatus("idle");
});
els.saveFile.addEventListener("click", () => {
  const session = active();
  if (!session.openFile) {
    note("✗ ยังไม่ได้เปิดไฟล์จากต้นไม้ด้านซ้าย — เปิดไฟล์ก่อนแล้วค่อยบันทึก", "stderr");
    return;
  }
  if (!session.dirty) { note("ไม่มีอะไรต้องบันทึก", "system"); return; }
  if (!session.openFileHash) { note("✗ ไม่ทราบ hash ของไฟล์นี้ — รันคำสั่งหนึ่งครั้งเพื่ออ่าน snapshot ใหม่", "stderr"); return; }
  // Seed writes the file, `true` makes the run a no-op so the terminal stays quiet.
  run("true", "bash");
});
els.filesRefresh.addEventListener("click", () => run("true", "bash"));
els.copyCurl.addEventListener("click", async () => {
  const snippet = curlSnippet();
  try {
    await navigator.clipboard.writeText(snippet);
    els.copyCurl.textContent = "คัดลอกแล้ว ✓";
    setTimeout(() => { els.copyCurl.textContent = "คัดลอก curl"; }, 1600);
  } catch { note(snippet, "system"); }
});
els.tabNew.addEventListener("click", () => {
  const session = makeSession();
  sessions.push(session);
  activeId = session.id;
  els.workspace.value = session.workspace;
  els.output.replaceChildren();
  setStatus("idle");
  renderRuntimeOptions();
  renderTabs();
  renderTree();
  renderPreview();
  els.promptLabel.textContent = `~/${session.workspace} $`;
  persist();
});
els.previewReload.addEventListener("click", () => {
  const preview = active()?.preview;
  if (preview) els.previewFrame.src = `${preview.path}?t=${Date.now()}`;
});
els.previewClose.addEventListener("click", () => {
  const session = active();
  session.preview = null;
  els.previewFrame.removeAttribute("src");
  renderPreview();
});

// Boot
els.token.value = localStorage.getItem(STORE.token) || "";
if (!restore()) { sessions = [makeSession(1)]; activeId = sessions[0].id; }
renderRuntimeOptions();
renderTabs();
syncEditor();
renderTree();
renderPreview();
els.workspace.value = active().workspace;
els.stdin.value = active().stdin;
els.promptLabel.textContent = `~/${active().workspace} $`;
setStatus("idle");
refreshHealth();
setInterval(refreshHealth, 15000);
