import { test } from "node:test";
import assert from "node:assert/strict";
import { RunScanner, modelResult, sandboxRequestedByUser, terminalTranscript } from "./sandbox-tool.ts";
import { runAgentLoop } from "./agent-loop.ts";
const call = { language: "bash" as const, command: "echo hello" };
const block = '<run lang="bash">\necho hello\n</run>\n';
function scan(text: string, size = text.length) {
  const scanner = new RunScanner();
  const events = [];
  for (let i = 0; i < text.length; i += size) events.push(...scanner.push(text.slice(i, i + size)));
  return [...events, ...scanner.finish()];
}
test("scanner recognizes a real run", () => assert.deepEqual(scan(block), [{ type: "run", call }]));
test("every possible chunk size preserves protocol", () => {
  for (let size = 1; size <= block.length; size++) assert.deepEqual(scan(block, size), [{ type: "run", call }]);
});
test("prose survives streaming", () => assert.equal(scan("hello\nworld", 1).map(e => e.type === "text" ? e.text : "").join(""), "hello\nworld"));
test("fenced examples never execute", () => assert.equal(scan('```xml\n' + block + '```\n', 1).some(e => e.type === "run"), false));
test("tilde fences never execute", () => assert.equal(scan('~~~~\n' + block + '~~~~\n').some(e => e.type === "run"), false));
test("incomplete blocks never execute", () => assert.equal(scan('<run lang="bash">\necho hello').some(e => e.type === "run"), false));
test("CRLF and missing final newline are supported", () => assert.deepEqual(scan(block.trimEnd().replaceAll('\n', '\r\n'), 1), [{ type: "run", call }]));
test("empty and oversized commands are rejected", () => {
  for (const body of ['', 'x'.repeat(32001)]) assert.equal(scan(`<run lang="bash">\n${body}\n</run>`).some(e => e.type === "run"), false);
});
test("transcripts cannot break out of their fence", () => {
  const text = terminalTranscript(call, { status: "timeout", output: '```html\n<script>bad</script>', durationMs: 1200 });
  assert.equal(text.match(/```/g)?.length, 2); assert.match(text, /⏱ timeout/); assert.match(text, /1.2s/);
});
test("model results preserve errors and identify untrusted data", () => {
  const text = modelResult(call, { status: "error", stderr: "failure", exitCode: 1 });
  assert.match(text, /UNTRUSTED/); assert.match(text, /failure/); assert.match(text, /"exitCode":1/);
});
test("loop returns actual output to model before final answer", async () => {
  let turns = 0, runs = 0, output = "";
  await runAgentLoop({ messages: [{ role: "user", content: "test" }], signal: new AbortController().signal, tools: true,
    model: async (messages, emit) => { if (!turns++) emit(block); else { assert.match(messages.at(-1)!.content, /actual result/); emit("done"); } },
    execute: async () => { runs++; return { status: "success", stdout: "actual result", exitCode: 0 }; }, onText: s => output += s });
  assert.equal(runs, 1); assert.match(output, /actual result/); assert.ok(output.endsWith("done")); assert.ok(!output.includes("<run"));
});
test("loop caps executions at six", async () => {
  let runs = 0;
  await runAgentLoop({ messages: [], signal: new AbortController().signal, tools: true, model: async (_, emit) => emit(block), execute: async () => { runs++; return { status: "success" }; }, onText: () => {} });
  assert.equal(runs, 6);
});
test("disabled tools and abort never execute", async () => {
  for (const tools of [false, true]) {
    const ac = new AbortController(); let runs = 0;
    await runAgentLoop({ messages: [], signal: ac.signal, tools, model: async (_, emit) => { emit(block); if (tools) ac.abort(); }, execute: async () => { runs++; return { status: "success" }; }, onText: () => {} }).catch(error => { assert.equal(error.name, "AbortError"); });
    assert.equal(runs, 0);
  }
});
test("execution errors are surfaced and model can explain them", async () => {
  let turns = 0;
  await runAgentLoop({ messages: [], signal: new AbortController().signal, tools: true,
    model: async (messages, emit) => { if (!turns++) emit(block); else assert.match(messages.at(-1)!.content, /runner unavailable/); },
    execute: async () => { throw new Error("runner unavailable"); }, onText: () => {} });
});
test("stop interrupts a model that never finishes", async () => {
  const ac = new AbortController();
  const work = runAgentLoop({ messages: [], signal: ac.signal, tools: true,
    model: async () => new Promise(() => {}), execute: async () => ({ status: "success" }), onText: () => {} });
  ac.abort(); await assert.rejects(work, { name: "AbortError" });
});

test("an explicit English or Thai Sandbox request enables the chat terminal", () => {
  assert.equal(sandboxRequestedByUser("Use Sandbox Terminal to install dayjs"), true);
  assert.equal(sandboxRequestedByUser("ใช้แซนด์บ็อกซ์ติดตั้ง dayjs"), true);
  assert.equal(sandboxRequestedByUser("ช่วยสรุปเอกสารนี้"), false);
});
