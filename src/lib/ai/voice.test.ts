import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanSpeechText, nextSpeechChunk, splitForSpeech, SPEECH_HARD_MAX } from "./voice.ts";

test("english sentences are cut at their ender", () => {
  const { chunk, rest } = nextSpeechChunk("Hello there, this is Sali speaking. How are you today?", false);
  assert.equal(chunk, "Hello there, this is Sali speaking.");
  assert.equal(rest, " How are you today?");
});

test("a very short clause waits for a little more text", () => {
  const { chunk } = nextSpeechChunk("Hi there.", false);
  assert.equal(chunk, "");
});

test("short fragments wait for more text instead of speaking too early", () => {
  const { chunk, rest } = nextSpeechChunk("สวัสดีค่ะ", false);
  assert.equal(chunk, "");
  assert.equal(rest, "สวัสดีค่ะ");
});

test("Thai without full stops still flushes at the hard limit", () => {
  const text = "ก".repeat(SPEECH_HARD_MAX + 50);
  const { chunk, rest } = nextSpeechChunk(text, false);
  assert.ok(chunk.length > 0);
  assert.ok(chunk.length <= SPEECH_HARD_MAX);
  assert.equal(chunk.length + rest.length, text.length);
});

test("Thai clause spaces are preferred cut points", () => {
  const text = `${"ข".repeat(120)} แล้วก็ ${"ค".repeat(200)}`;
  const { chunk } = nextSpeechChunk(text, true);
  assert.ok(chunk.length <= SPEECH_HARD_MAX);
});

test("final flush returns the remaining tail", () => {
  const { chunk, rest } = nextSpeechChunk("จบแล้วค่ะ", true);
  assert.equal(chunk, "จบแล้วค่ะ");
  assert.equal(rest, "");
});

test("streaming chunk-by-chunk never loses or duplicates characters", () => {
  const source = "สวัสดีค่ะ วันนี้เรามาทำโหมดโทรให้เสถียรกันนะคะ. เริ่มจากคิวเสียงก่อน แล้วค่อยต่อไมค์อัตโนมัติ จะได้ไม่ขาดหายอีกต่อไป ขอบคุณค่ะ";
  let buffer = "";
  const spoken: string[] = [];
  for (let index = 0; index < source.length; index += 3) {
    buffer += source.slice(index, index + 3);
    for (;;) {
      const next = nextSpeechChunk(buffer, false);
      if (!next.chunk) break;
      spoken.push(next.chunk);
      buffer = next.rest;
    }
  }
  spoken.push(...splitForSpeech(buffer));
  assert.equal(spoken.join("").replace(/\s+/g, ""), source.replace(/\s+/g, ""));
});

test("splitForSpeech produces bounded, non-empty pieces", () => {
  const pieces = splitForSpeech("ประโยคแรกค่ะ ประโยคสองนะคะ. " + "ย".repeat(900));
  assert.ok(pieces.length >= 3);
  for (const piece of pieces) {
    assert.ok(piece.trim().length > 0);
    assert.ok(piece.length <= SPEECH_HARD_MAX);
  }
});

test("markdown, code fences, urls and say-tags are never read aloud", () => {
  const cleaned = cleanSpeechText(
    'เรียบร้อยค่ะ ```bash\nrm -rf /tmp/x\n``` ดู `<run>` ที่ https://example.com/a **สำคัญ** <say who="boss">สวัสดี</say>',
  );
  assert.ok(!cleaned.includes("```"));
  assert.ok(!cleaned.includes("https://"));
  assert.ok(!cleaned.includes("<say"));
  assert.ok(!cleaned.includes("*"));
  assert.match(cleaned, /เรียบร้อยค่ะ/);
  assert.match(cleaned, /สวัสดี/);
});
