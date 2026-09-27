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
