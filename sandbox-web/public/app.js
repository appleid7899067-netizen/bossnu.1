/**
 * Sandbox Web playground — talks only to this origin.
 *
 * The token lives in the browser (localStorage) and is sent as a bearer header
 * on every call; it is never rendered into the HTML or logged.
 */
const $ = (id) => document.getElementById(id);

const els = {
  health: $("health"),
  healthDot: $("health-dot"),
  healthText: $("health-text"),
  language: $("language"),
  workspace: $("workspace"),
  command: $("command"),
  commandLabel: $("command-label"),
  stdinField: $("stdin-field"),
  stdin: $("stdin"),
  token: $("token"),
  run: $("run"),
  stop: $("stop"),
  clear: $("clear"),
  copyCurl: $("copy-curl"),
  status: $("status-pill"),
  meta: $("meta"),
  output: $("output"),
  filesBox: $("files-box"),
  fileCount: $("file-count"),
  files: $("files"),
  limits: $("limits"),
};

const STORE_KEY = "sandbox-web.token";
let controller = null;

const LABELS = {
  bash: "คำสั่ง shell",
  node: "โค้ด JavaScript (รันด้วย node main.mjs)",
  javascript: "โค้ด JavaScript (รันด้วย node main.mjs)",
  python: "โค้ด Python (รันด้วย python3 main.py)",
  "python-safe": "โค้ด Python (Safe) — Aether AST guard",
  go: "โค้ด Go (go run main.go)",
  rust: "โค้ด Rust (rustc main.rs)",
  java: "โค้ด Java (java Main.java)",
  cpp: "โค้ด C++ (g++ -std=c++20 main.cpp)",
};

const PLACEHOLDERS = {
  bash: "echo สวัสดีจากแซนด์บ็อก && uname -a",
  node: 'const total = [2, 3, 5].reduce((a, b) => a + b, 0);\nconsole.log("ผลรวม:", total);',
  python: 'values = [2, 3, 5]\nprint("ผลรวม:", sum(values))',
  "python-safe": 'values = [2, 3, 5]\nprint("ผลรวม:", sum(values))\nprint("stdin:", input())',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("สวัสดีจาก Go")\n}',
  rust: 'fn main() {\n    println!("สวัสดีจาก Rust");\n}',
  java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("สวัสดีจาก Java");\n  }\n}',
  cpp: '#include <iostream>\nint main() { std::cout << "สวัสดีจาก C++\\n"; }',
};

function applyRuntime() {
  const language = els.language.value;
  els.commandLabel.textContent = LABELS[language] || "คำสั่ง";
  els.command.placeholder = PLACEHOLDERS[language] || "";
  els.stdinField.hidden = language !== "python-safe";
}

function print(text, className = "") {
  if (!text) return;
  const span = document.createElement("span");
  if (className) span.className = className;
  span.textContent = text;
  els.output.appendChild(span);
  els.output.scrollTop = els.output.scrollHeight;
}

function setStatus(status) {
  els.status.textContent = status;
  els.status.className = `pill ${["success", "error", "running"].includes(status) ? status : ""}`;
}

function authHeaders(json = true) {
  const token = els.token.value.trim();
  return {
    ...(json ? { "content-type": "application/json" } : {}),
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

function body() {
  return {
    language: els.language.value,
    command: els.language.value === "python-safe" ? els.command.value : els.command.value.trim(),
    stdin: els.language.value === "python-safe" ? els.stdin.value : undefined,
    workspace: els.workspace.value.trim() || undefined,
    snapshot: 1,
  };
}

function renderFiles(result) {
  const snapshot = result?.workspaceSnapshot;
  const files = Array.isArray(snapshot?.files) ? snapshot.files : [];
  els.filesBox.hidden = files.length === 0;
  els.fileCount.textContent = String(files.length);
  els.files.replaceChildren(
    ...files.map((file) => {
      const li = document.createElement("li");
      const path = document.createElement("span");
      path.textContent = file.path;
      const size = document.createElement("span");
      size.textContent = `${file.size ?? file.content?.length ?? 0} B`;
      li.append(path, size);
      return li;
    }),
  );
}

async function run() {
  if (!els.token.value.trim()) {
    setStatus("error");
    els.output.replaceChildren();
    print("ยังไม่ได้ใส่ Bearer token — เซิร์ฟเวอร์นี้ปฏิเสธทุกคำสั่งที่ไม่มี token\n", "stderr");
    els.token.focus();
    return;
  }
  localStorage.setItem(STORE_KEY, els.token.value.trim());

  controller = new AbortController();
  els.run.disabled = true;
  els.stop.disabled = false;
  els.output.replaceChildren();
  els.meta.textContent = "";
  setStatus("running");

  const started = performance.now();
  try {
    const response = await fetch("/execute/stream", {
      method: "POST",
      headers: { ...authHeaders(), accept: "text/event-stream" },
      body: JSON.stringify(body()),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      const detail = await response.json().catch(() => null);
      setStatus("error");
      print(
        detail?.error
          ? `เซิร์ฟเวอร์ปฏิเสธ: ${detail.error} (HTTP ${response.status})\n`
          : `HTTP ${response.status}\n`,
        "stderr",
      );
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
        if (event.type === "status") print(`• ${event.message}\n`, "system");
        else if (event.type === "output") print(event.text, event.stream === "stderr" ? "stderr" : "");
        else if (event.type === "error") print(`✗ ${event.error}\n`, "stderr");
        else if (event.type === "complete") {
          const result = event.result || {};
          setStatus(result.status || (result.success ? "success" : "error"));
          els.meta.textContent = [
            `exit ${result.exitCode ?? "—"}`,
            `${((result.durationMs ?? performance.now() - started) / 1000).toFixed(2)}s`,
            result.workspaceSnapshot?.complete === false ? "snapshot ไม่ครบ" : "",
          ].filter(Boolean).join(" • ");
          renderFiles(result);
        }
      }
      if (done) break;
    }
  } catch (error) {
    setStatus("error");
    print(error?.name === "AbortError" ? "\nหยุดการรันแล้ว\n" : `\n${error?.message || error}\n`, "stderr");
  } finally {
    controller = null;
    els.run.disabled = false;
    els.stop.disabled = true;
  }
}

function curlSnippet() {
  const origin = location.origin;
  const token = els.token.value.trim() || "$RUNNER_TOKEN";
  const payload = JSON.stringify(body()).replace(/"/g, '\\"');
  return `curl -N -X POST ${origin}/execute/stream \\\n  -H 'content-type: application/json' \\\n  -H 'authorization: Bearer ${token}' \\\n  -d "${payload}"`;
}

async function refreshHealth() {
  try {
    const response = await fetch("/health", { headers: { accept: "application/json" } });
    const data = await response.json();
    els.healthDot.className = `dot ${data.ok ? "ok" : "bad"}`;
    els.healthText.textContent = data.ok
      ? `v${data.version} • ${data.runtimes.length} runtimes • ${data.authRequired ? "ต้องมี token" : "ไม่ต้อง token"} • uptime ${Math.round((data.uptimeMs || 0) / 1000)}s`
      : "ไม่พร้อมใช้งาน";
    els.limits.textContent = data.ok ? `Python Safe: ${data.pythonSafe ? "พร้อม" : "ไม่มี guard script"}` : "";
  } catch {
    els.healthDot.className = "dot bad";
    els.healthText.textContent = "ติดต่อเซิร์ฟเวอร์ไม่ได้";
  }
}

els.language.addEventListener("change", applyRuntime);
els.run.addEventListener("click", run);
els.stop.addEventListener("click", () => controller?.abort());
els.clear.addEventListener("click", () => { els.output.replaceChildren(); els.meta.textContent = ""; setStatus("idle"); });
els.copyCurl.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(curlSnippet());
    els.copyCurl.textContent = "คัดลอกแล้ว ✓";
    setTimeout(() => { els.copyCurl.textContent = "คัดลอก curl"; }, 1600);
  } catch {
    print(`\n${curlSnippet()}\n`, "system");
  }
});
els.command.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") run();
});

els.token.value = localStorage.getItem(STORE_KEY) || "";
applyRuntime();
setStatus("idle");
refreshHealth();
setInterval(refreshHealth, 15000);
