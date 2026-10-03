import { test } from "node:test";
import assert from "node:assert/strict";
import { RunScanner, SANDBOX_TOOL_PROMPT, modelResult, terminalTranscript } from "./sandbox-tool.ts";
import { runAgentLoop } from "./agent-loop.ts";
import { runnerSupportsPythonSafe } from "../sandbox/runner-capabilities.ts";
const call = { language: "bash" as const, command: "echo hello" };
const block = '<run lang="bash">\necho hello\n</run>\n';
const safeCall = { language: "python-safe" as const, command: "\nprint('safe', 'quote') \n" };
const safeBlock = '<run lang="python-safe">\n\nprint(\'safe\', \'quote\') \n</run>\n';
function scan(text: string, size = text.length) {
  const scanner = new RunScanner();
  const events = [];
  for (let i = 0; i < text.length; i += size) events.push(...scanner.push(text.slice(i, i + size)));
  return [...events, ...scanner.finish()];
}
test("scanner recognizes a real run", () => assert.deepEqual(scan(block), [{ type: "run", call }]));
test("scanner recognizes Python Safe and preserves raw source whitespace", () => {
  assert.deepEqual(scan(safeBlock), [{ type: "run", call: safeCall }]);
  for (let size = 1; size <= safeBlock.length; size++) assert.deepEqual(scan(safeBlock, size), [{ type: "run", call: safeCall }]);
});
test("prompt teaches when to use Python Safe with an executable block example", () => {
  assert.match(SANDBOX_TOOL_PROMPT, /When to run code/);
  assert.match(SANDBOX_TOOL_PROMPT, /Aether AST/);
  assert.match(SANDBOX_TOOL_PROMPT, /<run lang="python-safe">[\s\S]*print\(sum\(values\)\)[\s\S]*<\/run>/);
  assert.match(SANDBOX_TOOL_PROMPT, /do not ask the user to click Run/i);
});
test("Python Safe refuses legacy runners that do not advertise the runtime", async () => {
  const legacy = await runnerSupportsPythonSafe("https://runner.test", undefined, async () =>
    new Response(JSON.stringify({ ok: true, version: 5, runtimes: ["bash", "python"] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  assert.equal(legacy, false);
  const stale = await runnerSupportsPythonSafe("https://runner.test", undefined, async () =>
    new Response(JSON.stringify({ ok: true, version: 5, runtimes: ["bash", "python-safe"] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  assert.equal(stale, false);
  const current = await runnerSupportsPythonSafe("https://runner.test", undefined, async () =>
    new Response(JSON.stringify({ ok: true, version: 6, runtimes: ["bash", "python-safe"] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  assert.equal(current, true);
});
test("every possible chunk size preserves protocol", () => {
  for (let size = 1; size <= block.length; size++) assert.deepEqual(scan(block, size), [{ type: "run", call }]);
});
test("prose survives streaming", () => assert.equal(scan("hello\nworld", 1).map(e => e.type === "text" ? e.text : "").join(""), "hello\nworld"));
test("fenced examples never execute", () => assert.equal(scan('```xml\n' + block + '```\n', 1).some(e => e.type === "run"), false));
test("legacy shell fences execute only when the fenced body is clearly shell", () => {
  const shell = "```\\ncd /home/user/project\\necho SHELL_OK\\nfind . -maxdepth 1 -type f\\n```\\n";
  assert.deepEqual(scan(shell, 1), [{ type: "run", call: { language: "bash", command: "cd /home/user/project\\necho SHELL_OK\\nfind . -maxdepth 1 -type f" } }]);
  assert.equal(scan("```\\nconst value = 1;\\nconsole.log(value);\\n```\\n", 1).some(e => e.type === "run"), false);
});
test("tilde fences never execute", () => assert.equal(scan('~~~~\n' + block + '~~~~\n').some(e => e.type === "run"), false));
test("incomplete blocks never execute", () => assert.equal(scan('<run lang="bash">\necho hello').some(e => e.type === "run"), false));
test("CRLF and missing final newline are supported", () => assert.deepEqual(scan(block.trimEnd().replaceAll('\n', '\r\n'), 1), [{ type: "run", call }]));
test("Python Safe source retains CRLF and trailing blank lines byte-for-byte", () => {
  const source = " \t\r\nprint('safe')  \r\n\r\n";
  assert.deepEqual(scan(`<run lang="python-safe">\r\n${source}</run>\r\n`), [
    { type: "run", call: { language: "python-safe", command: source } },
  ]);
});
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
test("loop returns actual output to the model while keeping tool traffic out of final prose", async () => {
  let turns = 0, runs = 0, output = "";
  await runAgentLoop({ messages: [{ role: "user", content: "test" }], signal: new AbortController().signal, tools: true,
    model: async (messages, emit) => { if (!turns++) emit(block); else { assert.match(messages.at(-1)!.content, /actual result/); emit("done"); } },
    execute: async () => { runs++; return { status: "success", stdout: "actual result", exitCode: 0 }; }, onText: s => output += s });
  assert.equal(runs, 1); assert.ok(output.endsWith("done")); assert.ok(!output.includes("<run")); assert.ok(!output.includes("actual result"));
});
test("Python Safe block auto-runs, then waits for and observes its real result", async () => {
  let turns = 0, runs = 0;
  await runAgentLoop({ messages: [{ role: "user", content: "Run this Python calculation" }], signal: new AbortController().signal, tools: true,
    model: async (messages, emit) => {
      if (!turns++) emit(safeBlock);
      else { assert.match(messages.at(-1)!.content, /python-safe result/); emit("The calculation ran successfully."); }
    },
    execute: async run => { runs++; assert.equal(run.language, "python-safe"); return { status: "success", stdout: "python-safe result", exitCode: 0 }; },
    onText: () => {},
  });
  assert.equal(runs, 1);
});
test("loop caps executions at eleven", async () => {
  let runs = 0;
  await runAgentLoop({ messages: [{ role: "user", content: "Run the command" }], signal: new AbortController().signal, tools: true, model: async (_, emit) => emit(block), execute: async () => { runs++; return { status: "success" }; }, onText: () => {} });
  assert.equal(runs, 11);
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
  await runAgentLoop({ messages: [{ role: "user", content: "Run tests" }], signal: new AbortController().signal, tools: true,
    model: async (messages, emit) => {
      if (!turns++) emit(block);
      else { assert.match(messages.at(-1)!.content, /runner unavailable/); emit("The runner failed; verification did not pass."); }
    },
    execute: async () => { throw new Error("runner unavailable"); }, onText: () => {} });
});
test("stop interrupts a model that never finishes", async () => {
  const ac = new AbortController();
  const work = runAgentLoop({ messages: [], signal: ac.signal, tools: true,
    model: async () => new Promise(() => {}), execute: async () => ({ status: "success" }), onText: () => {} });
  ac.abort(); await assert.rejects(work, { name: "AbortError" });
});
