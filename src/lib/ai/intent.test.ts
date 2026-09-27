import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyIntent, intentSummary, shouldRunCode } from "./intent.ts";

test("an explicit shell command is recognized and pre-loaded as the first run", () => {
  for (const command of ["npm test", "git status", 'python3 -c "print(1 + 1)"', "ls -la project"]) {
    const plan = classifyIntent(command);
    assert.equal(plan.intent, "run-command", command);
    assert.equal(plan.runCode, true);
    assert.equal(plan.tools, true);
    assert.equal(plan.initialCall?.command, command);
    assert.ok(plan.maxRuns >= 2);
  }
});

test("an ordinary Thai sentence is never mistaken for a shell command", () => {
  for (const text of ["ช่วยสรุปเอกสารนี้ให้หน่อยค่ะ", "วันนี้ฝนจะตกไหม", "สวัสดีค่ะ สบายดีไหม"]) {
    const plan = classifyIntent(text);
    assert.notEqual(plan.intent, "run-command", text);
    assert.equal(plan.initialCall, undefined, text);
    assert.equal(plan.runCode, false, text);
  }
});

test("a broken build gets the biggest repair budget and the fix contract", () => {
  const plan = classifyIntent("โค้ดมันพังอะ error ขึ้น TypeError: x is not a function ช่วยแก้ให้ที");
  assert.equal(plan.intent, "fix-code");
  assert.equal(plan.tools, true);
  assert.equal(plan.maxRuns, 8);
  assert.equal(plan.maxGateRejections, 3);
  assert.equal(plan.mode, "think");
  assert.match(plan.directive, /FIXED/);
  assert.match(plan.directive, /Fix → Run → Verify/);
});

test("Thai repair asks stay repair asks even when they are short", () => {
  const plan = classifyIntent("แก้บั๊กให้ที");
  assert.equal(plan.intent, "fix-code");
  assert.equal(plan.runCode, true);
});

test("run/test requests execute code, explanations do not", () => {
  const run = classifyIntent("รันโค้ดนี้ให้หน่อยครับ ```js\nconsole.log(1)\n```");
  assert.equal(run.intent, "run-code");
  assert.equal(run.tools, true);

  const explain = classifyIntent("อธิบายหน่อยว่า closure ใน JavaScript คืออะไร");
  assert.equal(explain.intent, "explain");
  assert.equal(explain.tools, false);
  assert.equal(explain.maxRuns, 0);
  assert.equal(shouldRunCode("", explain), false);
  assert.equal(shouldRunCode("", run), true);
});

test("app building, data analysis, search and media route to their own budgets", () => {
  assert.equal(classifyIntent("สร้างแอป todo ให้หน่อย").intent, "build-app");
  const data = classifyIntent("วิเคราะห์ยอดขายจากไฟล์ csv นี้ให้หน่อย");
  assert.equal(data.intent, "analyze-data");
  assert.equal(data.tools, true);
  assert.equal(data.maxRuns, 4);
  const search = classifyIntent("ข่าวหุ้นวันนี้เป็นไงบ้าง");
  assert.equal(search.intent, "search-web");
  assert.equal(search.tools, false);
  const media = classifyIntent("สร้างรูปแมวให้หน่อย");
  assert.equal(media.intent, "media");
  assert.equal(media.tools, false);
});

test("small talk gets no sandbox budget at all", () => {
  for (const text of ["สวัสดี", "ขอบคุณนะคะ", "5555", "how are you today?"]) {
    const plan = classifyIntent(text);
    assert.equal(plan.intent, "chat", text);
    assert.equal(plan.tools, false, text);
    assert.equal(plan.maxRuns, 0, text);
    assert.match(plan.directive, /casual conversation/i);
  }
});

test("pasted code with no verb still runs when auto-sandbox is on", () => {
  const code = "const total = [1, 2, 3].reduce((a, b) => a + b, 0);\nconsole.log(total);";
  assert.equal(classifyIntent(code, { autoSandbox: true }).intent, "run-code");
  assert.equal(classifyIntent(code, { autoSandbox: false }).intent, "explain");
});

test("every intent carries a directive and a Thai summary", () => {
  for (const text of ["npm test", "แก้ error หน่อย", "สวัสดีค่ะ", "อธิบาย React hooks", "วิเคราะห์ csv", "ข่าววันนี้", "สร้างรูปแมว", "สร้างแอป todo"]) {
    const plan = classifyIntent(text);
    assert.ok(plan.directive.length > 20, text);
    assert.ok(plan.label.length > 0, text);
    assert.match(intentSummary(plan), /→/);
    assert.ok(plan.signals.length <= 8);
  }
});

test("in a voice call, real code work is handed off to the chat agent", () => {
  const spoken = classifyIntent("แก้บั๊กในแอปให้ทีแล้วรันจนผ่านนะ", { voiceCall: true });
  assert.equal(spoken.handoff, true);
  assert.equal(spoken.tools, false);
  assert.equal(spoken.initialCall, undefined);
  assert.match(spoken.directive, /voice call/);

  const dictated = classifyIntent("npm test", { voiceCall: true });
  assert.equal(dictated.intent, "run-command");
  assert.equal(dictated.handoff, undefined);
  assert.equal(dictated.tools, true);

  const chat = classifyIntent("สวัสดีค่ะ วันนี้เป็นยังไงบ้าง", { voiceCall: true });
  assert.equal(chat.handoff, undefined);
  assert.equal(chat.tools, false);
});
