import { test } from "node:test";
import assert from "node:assert/strict";
import { claimsCompletion, evaluateEvidence } from "./verification.ts";
import { runAgentLoop, type AgentWorkspace } from "./agent-loop.ts";
import type { ToolResult } from "./sandbox-tool.ts";

const block = '<run lang="bash">\necho hi\n</run>\n';
const synced = { verified: true, complete: true, added: 1, modified: 0, deleted: 0, missing: [], mismatched: [], unexpected: [], expectedCount: 1, manifestHash: "manifest-test" };
const ok: ToolResult = { status: "success", exitCode: 0, stdout: "ok", workspaceSync: synced, workspaceFiles: [{ path: "project/index.html", size: 12, sha256: "file-hash" }] };
const failing: ToolResult = { status: "error", exitCode: 1, stderr: "TypeError: boom", workspaceSync: synced };

function memoryWorkspace() {
  const log: string[] = [];
  const files = new Map<string, string>();
  const ws: AgentWorkspace = {
    context: async () => { log.push("context"); return "ctx"; },
    startTask: async () => { log.push("start"); },
    updateTask: async (_id, status) => { log.push(`task:${status}`); },
    remember: async (key) => { log.push(`remember:${key}`); },
    writeFile: async (path, content) => { files.set(path, content); log.push(`write:${path}`); },
  };
  return { ws, log, files };
}

test("evidence: success + verified complete sync passes", () => {
  assert.deepEqual(evaluateEvidence(ok, { requireWorkspace: true }), { passed: true, reasons: [] });
});

test("evidence: non-zero exit, error status and missing sync fail with reasons", () => {
  const v = evaluateEvidence({ status: "error", exitCode: 2 }, { requireWorkspace: true });
  assert.equal(v.passed, false);
  assert.ok(v.reasons.some(r => r.includes("exit code = 2")));
  assert.ok(v.reasons.some(r => r.includes("Neon Sync")));
});

test("evidence: API success is not enough — read-back mismatch fails", () => {
  const v = evaluateEvidence({ status: "success", exitCode: 0, workspaceSync: { verified: false, complete: true, mismatched: ["project/a.js"] } }, { requireWorkspace: true });
  assert.equal(v.passed, false);
  assert.match(v.reasons.join("\n"), /project\/a\.js/);
});

test("evidence: incomplete snapshot fails the gate", () => {
  const v = evaluateEvidence({ status: "success", exitCode: 0, workspaceSync: { verified: true, complete: false } }, { requireWorkspace: true });
  assert.equal(v.passed, false);
});

test("evidence: workspace not required ignores sync", () => {
  assert.equal(evaluateEvidence({ status: "success", exitCode: 0 }, { requireWorkspace: false }).passed, true);
});

test("completion claims are detected, negations are not", () => {
  for (const s of ["เสร็จแล้วค่ะ", "แก้ไขเรียบร้อยแล้ว", "All done!", "It works now", "สำเร็จแล้ว"]) assert.equal(claimsCompletion(s), true, s);
  for (const s of ["ยังไม่เสร็จ ต้องแก้ต่อ", "ยังไม่สำเร็จค่ะ", "not done yet", "กำลังตรวจสอบ log"]) assert.equal(claimsCompletion(s), false, s);
});

test("gate: failing run + 'done' answer is rejected, loop fixes, runs again and verifies", async () => {
  let turn = 0, runs = 0, output = "";
  const seen: string[] = [];
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "สร้างแอป" }], signal: new AbortController().signal, tools: true, requireWorkspaceSync: true,
    model: async (messages, emit) => {
      turn++;
      seen.push(messages.at(-1)!.content);
      if (turn === 1) emit(block);             // Run → fails
      else if (turn === 2) emit("เสร็จแล้วค่ะ"); // premature claim → gate
      else if (turn === 3) emit("แก้แล้ว รันใหม่\n" + block); // Fix → Run → passes
      else emit("ตรวจแล้ว ผ่านจริง เสร็จแล้วค่ะ");
    },
    execute: async () => (++runs === 1 ? failing : ok),
    onText: s => { output += s; },
  });
  assert.equal(summary.status, "verified");
  assert.equal(runs, 2);
  assert.equal(summary.rejections, 1);
  assert.match(seen[2], /REPAIR LOOP — VERIFICATION GATE/);
  assert.match(seen[2], /inspect the failing file\/error/);
  assert.match(seen[2], /Do not merely explain the error/);
  assert.match(seen[2], /REPAIR ACTION REQUIRED/);
  assert.match(seen[2], /workspace/);
  // The premature "done" never reached the user; the verified one did.
  assert.equal(output.split("เสร็จแล้วค่ะ").length - 1, 1);
  assert.ok(output.trimEnd().endsWith("เสร็จแล้วค่ะ"));
  assert.match(output, /แก้แล้ว รันใหม่/);
});

test("gate: model that keeps claiming done gets an honest unverified answer", async () => {
  let output = "";
  const { ws, log } = memoryWorkspace();
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "fix" }], signal: new AbortController().signal, tools: true, requireWorkspaceSync: true, workspace: ws,
    model: async (messages, emit) => { emit(messages.some(m => m.content.includes("UNTRUSTED")) ? "เสร็จแล้วค่ะ ✅" : block); },
    execute: async () => failing,
    onText: s => { output += s; },
  });
  assert.equal(summary.status, "unverified");
  assert.equal(summary.rejections, 2);
  assert.ok(!output.includes("เสร็จแล้วค่ะ"));
  assert.match(output, /ยังตรวจสอบไม่ผ่าน — ยังไม่ถือว่าเสร็จ/);
  assert.match(output, /exit code = 1/);
  assert.ok(log.includes("task:failed"));
});

test("gate: honest non-claiming explanation is kept in the unverified answer", async () => {
  let output = "";
  await runAgentLoop({
    messages: [{ role: "user", content: "x" }], signal: new AbortController().signal, tools: true, requireWorkspaceSync: true,
    model: async (messages, emit) => { emit(messages.some(m => m.content.includes("UNTRUSTED")) ? "ยังไม่สำเร็จ เพราะ npm ติดตั้งไม่ได้" : block); },
    execute: async () => failing,
    onText: s => { output += s; },
  });
  assert.match(output, /npm ติดตั้งไม่ได้/);
});

test("gate: sync not verified blocks completion even if the command succeeded", async () => {
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "x" }], signal: new AbortController().signal, tools: true, requireWorkspaceSync: true, maxRuns: 1,
    model: async (messages, emit) => { emit(messages.some(m => m.content.includes("UNTRUSTED")) ? "done" : block); },
    execute: async () => ({ status: "success", exitCode: 0, workspaceSync: { verified: false, complete: true, missing: ["project/x"] } }),
    onText: () => {},
  });
  assert.equal(summary.status, "unverified");
});

test("gate: a failing prior auto-run must be fixed before answering", async () => {
  let runs = 0;
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "x" }], signal: new AbortController().signal, tools: true, requireWorkspaceSync: true, priorResult: failing,
    model: async (messages, emit) => { emit(messages.at(-1)!.content.includes("VERIFICATION GATE") ? block : messages.at(-1)!.content.includes("UNTRUSTED") ? "ok" : "เสร็จแล้ว"); },
    execute: async () => { runs++; return ok; },
    onText: () => {},
  });
  assert.equal(runs, 1);
  assert.equal(summary.status, "verified");
});

test("loop: conversation without runs is 'answered'; workspace adapter errors never break it", async () => {
  const broken: AgentWorkspace = {
    context: async () => { throw new Error("db down"); }, startTask: async () => { throw new Error("x"); },
    updateTask: async () => { throw new Error("x"); }, remember: async () => { throw new Error("x"); },
    writeFile: async () => { throw new Error("x"); },
  };
  let output = "";
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "สวัสดี" }], signal: new AbortController().signal, tools: true, workspace: broken, requireWorkspaceSync: true,
    model: async (_m, emit) => emit("สวัสดีค่ะ"), execute: async () => ok, onText: s => { output += s; },
  });
  assert.equal(summary.status, "answered");
  assert.ok(output.endsWith("สวัสดีค่ะ"));
});

test("loop: verified project runs persist a reusable skill in Agent Workspace", async () => {
  const { ws, log, files } = memoryWorkspace();
  let context = "";
  await runAgentLoop({
    messages: [{ role: "user", content: "go" }], signal: new AbortController().signal, tools: true, workspace: ws, requireWorkspaceSync: true,
    model: async (messages, emit) => { context = messages[0].content; emit(messages.some(m => m.content.includes("UNTRUSTED")) ? "ผ่าน" : block); },
    execute: async () => ok, onText: () => {},
  });
  assert.match(context, /ctx/);
  const skillPath = [...files.keys()][0];
  assert.ok(skillPath);
  assert.match(skillPath, /^skills\/verified\/.*\/SKILL\.md$/);
  const skill = files.get(skillPath)!;
  assert.match(skill, /Previously verified command/);
  assert.match(skill, /echo hi/);
  assert.match(skill, /Neon sync: verified=true, complete=true/);
  assert.match(skill, /Manifest: manifest-test/);
  assert.match(skill, /project\/index\.html/);
  assert.deepEqual(log.filter(l => !l.startsWith("remember:latest")), [
    "context", "start", "remember:run-1", `write:${skillPath}`, `remember:verified skill ${skillPath}`, "task:done",
  ]);
});

test("loop: unverified sync never becomes a reusable skill", async () => {
  const { ws, files } = memoryWorkspace();
  let turn = 0;
  const summary = await runAgentLoop({
    messages: [{ role: "user", content: "สร้างหน้าเว็บ" }],
    signal: new AbortController().signal,
    tools: true,
    requireWorkspaceSync: true,
    maxRuns: 1,
    workspace: ws,
    model: async (_messages, emit) => {
      turn++;
      emit(turn === 1 ? block : "ยังตรวจสอบไม่ผ่านค่ะ");
    },
    execute: async () => ({
      status: "success",
      exitCode: 0,
      workspaceSync: { verified: false, complete: true, mismatched: ["project/index.html"] },
    }),
    onText: () => {},
  });
  assert.equal(summary.status, "unverified");
  assert.equal(files.size, 0);
});

test("loop: maxRuns is clamped to 8", async () => {
  let runs = 0;
  const summary = await runAgentLoop({
    messages: [], signal: new AbortController().signal, tools: true, maxRuns: 99,
    model: async (_m, emit) => emit(block), execute: async () => { runs++; return { status: "success", exitCode: 0 }; }, onText: () => {},
  });
  assert.equal(runs, 8);
  assert.equal(summary.status, "limit");
});
