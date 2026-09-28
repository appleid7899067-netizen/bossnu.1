import { test } from "node:test";
import assert from "node:assert/strict";
import { detectSandboxInput, shouldExecuteSandboxInput } from "./detect.ts";

test("normal conversation never opens sandbox", () => {
  for (const text of ["สวัสดีสลี่", "วันนี้เป็นไงบ้าง", "ช่วยอธิบาย React ให้หน่อย", "สร้างภาพแมวให้หน่อย"]) {
    const detection = detectSandboxInput(text);
    assert.equal(shouldExecuteSandboxInput(text, detection), false, text);
  }
});

test("explicit execution opens the agent runtime", () => {
  for (const text of ["รัน npm test", "ช่วย debug โค้ดนี้", "ทดสอบระบบจริง", "deploy โปรเจกต์"]) {
    const detection = detectSandboxInput(text);
    assert.equal(shouldExecuteSandboxInput(text, detection), true, text);
  }
});

test("plain Python and JavaScript code are execution payloads", () => {
  for (const text of ["print(42)", "def hello():\n    return 42", "console.log(42)", "const answer = 42;"]) {
    const detection = detectSandboxInput(text);
    assert.equal(shouldExecuteSandboxInput(text, detection), true, text);
    assert.ok(detection.code || detection.command);
  }
});

test("fenced code is execution intent", () => {
  const detection = detectSandboxInput("```python\nprint(42)\n```");
  assert.equal(shouldExecuteSandboxInput("```python\nprint(42)\n```", detection), true);
});
