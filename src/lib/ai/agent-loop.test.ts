import { test } from "node:test";
import assert from "node:assert/strict";
import { redactSensitiveCommand, runAgentLoop } from "./agent-loop.ts";
import type { RunCall, ToolResult } from "./sandbox-tool.ts";

const initialCall: RunCall = { language: "bash", command: "npm test" };
const passed: ToolResult = { status: "success", exitCode: 0, stdout: "all tests passed" };

test("saved skill commands redact common credential arguments", () => {
  assert.equal(
    redactSensitiveCommand('curl --api-key=abc --password "super secret" -H "Authorization: Bearer xyz"'),
    'curl --api-key=[REDACTED] --password [REDACTED] -H "Authorization: Bearer [REDACTED]"',
  );
});

test("initial call waits for Goal and Plan, then executes with its approval", async () => {
  const phases: string[] = [];
  let approved: boolean | undefined;
  let executionCount = 0;
  let modelMessages: { role: "user" | "assistant"; content: string }[] = [];

  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "Run the tests" }],
    signal: new AbortController().signal,
    tools: true,
    initialCall,
    initialCallApproved: true,
    onPhase: phase => phases.push(phase),
    model: async (messages, emit) => {
      modelMessages = messages;
      emit("Tests passed; the run output confirms success.");
    },
    execute: async (_call, isApproved) => {
      executionCount++;
      approved = isApproved;
      assert.ok(phases.includes("goal"));
      assert.ok(phases.includes("plan"));
      assert.equal(phases.at(-1), "run");
      return passed;
    },
    onText: () => {},
  });

  assert.equal(summary.status, "verified");
  assert.equal(executionCount, 1);
  assert.equal(approved, true);
  assert.ok(!modelMessages.some(message => message.role === "assistant" && message.content === ""));
});

test("a forced initial call cannot bypass an intent route that selected no Sandbox", async () => {
  let executions = 0;
  let output = "";
  const phaseDetails: string[] = [];
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "Please explain Python variables" }],
    signal: new AbortController().signal,
    tools: true,
    initialCall: { language: "bash", command: "echo unauthorized" },
    initialCallApproved: true,
    model: async (_messages, emit) => emit("Python variables store values under names."),
    execute: async () => { executions++; return passed; },
    onText: text => { output += text; },
    onPhase: (_phase, detail) => { if (detail) phaseDetails.push(detail); },
  });
  assert.equal(executions, 0);
  assert.equal(summary.status, "answered");
  assert.ok(phaseDetails.some(detail => detail.includes("บล็อกคำขอ")));
  assert.doesNotMatch(output, /unauthorized/);
});

test("initial call approval defaults to undefined when not explicitly supplied", async () => {
  let approved: boolean | undefined = false;
  await runAgentLoop({
    messages: [{ role: "user", content: "Run it" }],
    signal: new AbortController().signal,
    tools: true,
    initialCall,
    model: async (_messages, emit) => emit("Done."),
    execute: async (_call, isApproved) => {
      approved = isApproved;
      return passed;
    },
    onText: () => {},
  });
  assert.equal(approved, undefined);
});

test("agent loop auto-installs a missing dependency, verifies it, then reruns the requested command", async () => {
  const commands: string[] = [];
  const phases: string[] = [];
  const evidence: Array<{ status: string; stage: string }> = [];
  let modelTurn = 0;
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "รันทดสอบ Playwright ในโปรเจกต์" }],
    signal: new AbortController().signal,
    tools: true,
    maxRuns: 5,
    model: async (messages, emit) => {
      if (modelTurn++ === 0) emit('<run lang="bash">\ncd project && npm test\n</run>\n');
      else {
        assert.ok(messages.some(message => message.content.includes("AUTO-INSTALL RESULT")));
        assert.ok(messages.some(message => message.content.includes("AUTO-INSTALL RETRY RESULT")));
        emit("ทดสอบผ่านแล้วค่ะ");
      }
    },
    execute: async call => {
      commands.push(call.command);
      if (commands.length === 1) return { status: "error", exitCode: 1, stderr: "Error: Cannot find module 'playwright'" };
      if (commands.length === 2) return { status: "success", exitCode: 0, stdout: "Added playwright; dependency available" };
      return { status: "success", exitCode: 0, stdout: "All tests passed" };
    },
    onText: () => {},
    onPhase: phase => phases.push(phase),
    onEvidence: record => evidence.push({ status: record.status, stage: record.stage }),
  });

  assert.equal(summary.status, "verified");
  assert.equal(summary.runs, 3);
  assert.equal(summary.autoInstallAttempts, 1);
  assert.equal(commands[0], "cd project && npm test");
  assert.match(commands[1], /npm install --no-save --package-lock=false --ignore-scripts playwright/);
  assert.equal(commands[2], commands[0]);
  assert.deepEqual(evidence.map(item => item.status), ["failed", "verified", "verified"]);
  assert.equal(evidence[1].stage, "auto-install");
  assert.ok(phases.includes("analyze"));
  assert.ok(phases.includes("select-tool"));
  assert.equal(summary.evidence.length, 3);
});

test("Tool Router blocks a GitHub write during a read-only PR request", async () => {
  const blockedWrite = '<github action="write_file" path="README.md" branch="main">\nNot authorized\n</github>\n';
  let turn = 0;
  let githubCalls = 0;
  let output = "";
  const phaseDetails: string[] = [];
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "ตรวจ PR #29 และอ่านไฟล์ที่เกี่ยวข้อง" }],
    signal: new AbortController().signal,
    tools: true,
    model: async (messages, emit) => {
      if (turn++ === 0) emit(blockedWrite);
      else {
        assert.ok(messages.some(message => /TOOL ROUTER BLOCKED|GITHUB TASK INCOMPLETE/.test(message.content)));
        emit("คำขอนี้เป็นการอ่านอย่างเดียว จึงไม่เขียนไฟล์ค่ะ");
      }
    },
    execute: async () => ({ status: "success", exitCode: 0 }),
    executeGithub: async () => { githubCalls++; return { status: "success", exitCode: 0, verified: true }; },
    onText: text => { output += text; },
    onPhase: (_phase, detail) => { if (detail) phaseDetails.push(detail); },
  });

  assert.equal(githubCalls, 0);
  assert.equal(summary.status, "unverified");
  assert.ok(phaseDetails.some(detail => detail.includes("บล็อกคำขอ")));
  assert.doesNotMatch(output, /Not authorized/);
});

test("GitHub mutation failure enters repair mode and only completes after read-back proof", async () => {
  const firstWrite = '<github action="write_file" path="README.md" branch="feature">\nfirst attempt\n</github>\n';
  const repairedWrite = '<github action="write_file" path="README.md" branch="feature">\nverified content\n</github>\n';
  let turn = 0;
  let githubCalls = 0;
  const evidence: Array<{ status: string; tool: string }> = [];
  let output = "";
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "Update README on GitHub" }],
    signal: new AbortController().signal,
    tools: true,
    model: async (messages, emit) => {
      turn++;
      if (turn === 1) emit(firstWrite);
      else if (turn === 2) {
        assert.match(messages[0]?.content ?? "", /GITHUB REPAIR MODE IS ACTIVE/);
        assert.ok(messages.some(message => message.content.includes("GITHUB FAILED:")));
        emit(repairedWrite);
      } else {
        assert.ok(messages.some(message => message.content.includes("GITHUB RESULT:")));
        emit("GitHub ยืนยันไฟล์ที่แก้แล้วค่ะ");
      }
    },
    execute: async () => { throw new Error("Sandbox must not be selected for a GitHub-only request"); },
    executeGithub: async call => {
      githubCalls++;
      assert.equal(call.action, "write_file");
      return githubCalls === 1
        ? { status: "success", exitCode: 0, verified: false, evidence: ["read-back mismatch"] }
        : { status: "success", exitCode: 0, verified: true, evidence: ["read-back matched"] };
    },
    onText: text => { output += text; },
    onEvidence: record => evidence.push({ status: record.status, tool: record.tool }),
  });

  assert.equal(githubCalls, 2);
  assert.equal(summary.status, "verified");
  assert.deepEqual(evidence.map(record => record.status), ["unverified", "verified"]);
  assert.ok(evidence.every(record => record.tool === "github"));
  assert.match(output, /GitHub ยืนยันไฟล์ที่แก้แล้วค่ะ/);
});

test("a GitHub read cannot verify a requested write or allow a premature success claim", async () => {
  const readFile = '<github action="read_file" path="README.md" branch="feature">\n</github>\n';
  let turn = 0;
  let githubCalls = 0;
  let output = "";
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "Update README on GitHub" }],
    signal: new AbortController().signal,
    tools: true,
    model: async (_messages, emit) => {
      turn++;
      if (turn === 1) emit(readFile);
      else emit("Updated the README successfully ✅");
    },
    execute: async () => ({ status: "success", exitCode: 0 }),
    executeGithub: async () => {
      githubCalls++;
      return { status: "success", exitCode: 0, verified: true, output: JSON.stringify({ content: "old" }) };
    },
    onText: text => { output += text; },
  });

  assert.equal(githubCalls, 1);
  assert.equal(summary.status, "unverified");
  assert.doesNotMatch(output, /Updated the README successfully/);
  assert.match(output, /write_file/);
  assert.match(output, /ยังตรวจสอบไม่ผ่าน/);
});

test("a tool-enabled action cannot be reported complete without an actual tool run", async () => {
  let output = "";
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "รันทดสอบโปรเจกต์" }],
    signal: new AbortController().signal,
    tools: true,
    model: async (_messages, emit) => emit("ทดสอบผ่านแล้วค่ะ ✅"),
    execute: async () => ({ status: "success", exitCode: 0 }),
    onText: text => { output += text; },
  });
  assert.equal(summary.status, "unverified");
  assert.equal(summary.runs, 0);
  assert.doesNotMatch(output, /ทดสอบผ่านแล้ว/);
  assert.match(output, /ยังไม่มีการเรียกใช้ tool จึงไม่มีหลักฐานยืนยันผลการทำงาน/);
});
