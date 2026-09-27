import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_PRECHECK_FAILURES, runAgentLoop, type AgentMessage, type AgentPhase } from "./agent-loop.ts";
import type { RunCall, ToolResult } from "./sandbox-tool.ts";

const block = (language: RunCall["language"], command: string) => `<run lang="${language}">\n${command}\n</run>\n`;
const ok: ToolResult = { status: "success", exitCode: 0, stdout: "done" };

test("a command that cannot parse is fixed before it ever burns a run", async () => {
  const executed: RunCall[] = [];
  const feedback: string[] = [];
  let turn = 0;

  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "รัน echo ให้หน่อย" }],
    signal: new AbortController().signal,
    tools: true,
    model: async (messages, emit) => {
      feedback.push(messages.at(-1)?.content ?? "");
      if (turn === 0) emit(block("bash", 'echo "unbalanced'));
      else if (turn === 1) emit(block("bash", 'echo "balanced"'));
      else emit("รันผ่านแล้วค่ะ เห็น output จริงแล้ว");
      turn++;
    },
    execute: async (call) => {
      executed.push(call);
      return ok;
    },
    onText: () => {},
  });

  assert.equal(executed.length, 1);
  assert.equal(executed[0].command, 'echo "balanced"');
  assert.match(feedback[1], /PRE-RUN CHECK FAILED/);
  assert.match(feedback[1], /เปิด\/ปิดไม่ครบ/);
  assert.equal(summary.status, "verified");
  assert.equal(summary.runs, 1);
});

test("the pre-check gives up honestly instead of looping forever", async () => {
  let executed = 0;
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "รันให้หน่อย" }],
    signal: new AbortController().signal,
    tools: true,
    model: async (_messages, emit) => emit(block("bash", 'echo "still broken')),
    execute: async () => {
      executed++;
      return ok;
    },
    onText: () => {},
  });
  assert.equal(executed, 0);
  assert.equal(summary.status, "unverified");
  assert.equal(summary.rejections, MAX_PRECHECK_FAILURES);
});

test("raw language source is wrapped into a runnable shell command", async () => {
  const executed: RunCall[] = [];
  let turn = 0;
  await runAgentLoop({
    messages: [{ role: "user", content: "รัน python ให้หน่อย" }],
    signal: new AbortController().signal,
    tools: true,
    model: async (_messages, emit) => {
      if (turn++ === 0) emit(block("python", 'import json\nprint(json.dumps({"a": 1}))'));
      else emit("รันผ่านแล้วค่ะ");
    },
    execute: async (call) => {
      executed.push(call);
      return ok;
    },
    onText: () => {},
  });
  assert.equal(executed.length, 1);
  assert.match(executed[0].command, /python3 \/tmp\/agent-run\.py$/);
  assert.match(executed[0].command, /import json/);
});

test("a failing run comes back with a real diagnosis, then the fix passes", async () => {
  const feedback: string[] = [];
  const phases: AgentPhase[] = [];
  let run = 0;
  let turn = 0;

  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "รันสคริปต์ให้หน่อย" }],
    signal: new AbortController().signal,
    tools: true,
    intent: { label: "รัน/ทดสอบโค้ดจริง", directive: "RUN THE CODE FOR REAL" },
    onPhase: (phase) => phases.push(phase),
    model: async (messages, emit) => {
      feedback.push(messages.map((message: AgentMessage) => message.content).join("\n"));
      if (turn++ < 2) emit(block("bash", "python3 main.py"));
      else emit("รันผ่านแล้วค่ะ โมดูลครบและ exit 0");
    },
    execute: async () => {
      run++;
      return run === 1
        ? { status: "error", exitCode: 1, stderr: "ModuleNotFoundError: No module named 'requests'" }
        : ok;
    },
    onText: () => {},
  });

  assert.equal(run, 2);
  assert.equal(summary.status, "verified");
  assert.match(feedback[1], /VERIFY FAILED/);
  assert.match(feedback[1], /pip install/);
  assert.match(feedback[1], /ModuleNotFoundError/);
  assert.ok(phases.includes("fix"));
  assert.ok(phases.includes("intent"));
  assert.match(feedback[0], /RUN THE CODE FOR REAL/);
});

test("re-running the identical failing command is called out", async () => {
  const feedback: string[] = [];
  await runAgentLoop({
    messages: [{ role: "user", content: "รันเทสให้หน่อย" }],
    signal: new AbortController().signal,
    tools: true,
    maxRuns: 3,
    model: async (messages, emit) => {
      feedback.push(messages.at(-1)?.content ?? "");
      emit(block("bash", "npm test"));
    },
    execute: async () => ({ status: "error", exitCode: 1, output: "bash: npm: command not found" }),
    onText: () => {},
  });
  const second = feedback.find((message) => message.includes("failed 2 time(s)"));
  assert.ok(second, feedback.join("\n---\n"));
  assert.match(second!, /Do NOT re-run this command unchanged/);
  assert.match(second!, /คำสั่งไม่มีใน runner/);
});

test("an intent that forbids code never executes and never leaks the protocol", async () => {
  let executed = 0;
  let answer = "";
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "สวัสดีค่ะ" }],
    signal: new AbortController().signal,
    tools: false,
    intent: { label: "คุยทั่วไป ตอบตรง", directive: "casual chat only" },
    model: async (messages, emit) => {
      assert.match(messages[0].content, /casual chat only/);
      emit(`สวัสดีค่ะ\n${block("bash", "rm -rf /tmp/nope")}`);
    },
    execute: async () => {
      executed++;
      return ok;
    },
    onText: (text) => {
      answer += text;
    },
  });
  assert.equal(executed, 0);
  assert.equal(summary.status, "answered");
  assert.match(answer, /สวัสดีค่ะ/);
  assert.ok(!answer.includes("<run"));
  assert.ok(!answer.includes("rm -rf"));
});

test("a larger repair budget is honoured for fix-code intents", async () => {
  let executed = 0;
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "แก้โค้ดที่พังให้ที" }],
    signal: new AbortController().signal,
    tools: true,
    maxRuns: 8,
    maxGateRejections: 3,
    model: async (_messages, emit) => emit(block("bash", "npm test")),
    execute: async () => {
      executed++;
      return { status: "error", exitCode: 1, output: "1 failing" };
    },
    onText: () => {},
  });
  assert.equal(executed, 8);
  assert.equal(summary.runs, 8);
  assert.equal(summary.status, "unverified");
});
