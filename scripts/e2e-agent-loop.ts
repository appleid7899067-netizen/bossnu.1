/**
 * E2E: the real agent loop + verification gate against live app routes.
 *
 *   BASE_URL=http://localhost:8080 node --experimental-strip-types scripts/e2e-agent-loop.ts
 *
 * A scripted model writes a buggy app, then tries to say "เสร็จแล้ว" while the
 * run is failing. The gate must reject that, the loop must Fix → Run → Verify,
 * and only a run with exit 0 + verified Neon read-back may end as "verified".
 */
import { randomBytes } from "node:crypto";
import { runAgentLoop, type AgentPhase } from "../src/lib/ai/agent-loop.ts";
import { createHttpWorkspace } from "../src/lib/workspace/http-workspace.ts";
import type { RunCall, ToolResult } from "../src/lib/ai/sandbox-tool.ts";

const BASE = (process.env.BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
const WS = `e2e_agent_${randomBytes(3).toString("hex")}`;
const fetcher: typeof fetch = (input, init) => fetch(typeof input === "string" && input.startsWith("/") ? BASE + input : input, init);

async function execute(call: RunCall): Promise<ToolResult> {
  const r = await fetch(BASE + "/api/sandbox.stream", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ cmd: call.command, type: call.language, workspace: WS }),
  });
  const events = (await r.text()).split("\n").filter(l => l.startsWith("data:")).map(l => JSON.parse(l.slice(5)));
  return events.findLast(e => e.type === "complete")?.result ?? { status: "error", error: "no complete event" };
}

const run = (cmd: string) => `<run lang="bash">\n${cmd}\n</run>\n`;
const script = [
  "Plan: สร้าง project/app.js แล้วรันทดสอบ\n" + run("mkdir -p project && printf 'const x = require(\"./missing\");\\nconsole.log(\"ok\")\\n' > project/app.js && node project/app.js"),
  "เสร็จแล้วค่ะ ✅ แอปพร้อมใช้งาน",                                   // premature claim → must be gated
  "พบว่า require ไฟล์ที่ไม่มี กำลังแก้แล้วรันใหม่\n" + run("printf 'console.log(\"ok\")\\n' > project/app.js && node project/app.js"),
  "ตรวจแล้ว: รันผ่าน exit 0 และ Neon อ่านกลับตรงกัน เสร็จแล้วค่ะ",
];

let turn = 0, output = "";
const phases: string[] = [];
const seen: string[] = [];
const summary = await runAgentLoop({
  messages: [{ role: "user", content: "สร้างแอป node ที่พิมพ์ ok" }],
  signal: new AbortController().signal,
  tools: true,
  requireWorkspaceSync: true,
  workspace: createHttpWorkspace(WS, fetcher),
  execute,
  onText: t => { output += t; },
  onPhase: (p: AgentPhase, d?: string) => { phases.push(p); if (d) console.log(`  [${p}] ${d}`); },
  model: async (messages, emit) => { seen.push(messages.at(-1)!.content); emit(script[Math.min(turn++, script.length - 1)]); },
});

const status = await (await fetcher("/api/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "sync-status", workspaceId: WS }) })).json();
const neon = await (await fetcher(`/api/workspace?workspace=${WS}`)).json();
const app = neon.files.find((f: { path: string }) => f.path === "project/app.js")?.content;

const checks: [boolean, string][] = [
  [summary.status === "verified", `final status verified (got ${summary.status})`],
  [summary.runs === 2 && summary.rejections === 1, `2 runs, 1 gate rejection (got ${summary.runs}/${summary.rejections})`],
  [seen.some(s => s.includes("VERIFICATION GATE")), "gate message was sent to the model"],
  [!output.includes("แอปพร้อมใช้งาน"), "premature 'done' never reached the user"],
  [output.trimEnd().endsWith("เสร็จแล้วค่ะ"), "verified answer delivered"],
  [["plan", "act", "run", "observe", "verify", "fix", "answer"].every(p => phases.includes(p as AgentPhase)), "all loop phases observed"],
  [app === 'console.log("ok")\n', "Neon holds the fixed project/app.js"],
  [status.sync.neon.matchesBase && status.sync.events.length === 2, "Neon matches last verified manifest; 2 sync events"],
];
console.log("");
for (const [ok, label] of checks) console.log(`${ok ? "✅" : "❌"} ${label}`);
process.exit(checks.every(([ok]) => ok) ? 0 : 1);
