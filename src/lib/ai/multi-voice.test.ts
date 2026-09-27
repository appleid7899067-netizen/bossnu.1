import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_VOICE_CAST,
  MultiVoiceParser,
  VOICE_PERSONAS,
  activePersonas,
  buildMultiVoicePrompt,
  castLabel,
  getVoiceCast,
  setPersonaVoice,
  splitSpokenSentences,
  toSpeakerVoice,
  toggleCastParticipant,
  updateVoiceCast,
  type VoiceSegment,
} from "./multi-voice.ts";

function parseAll(text: string, participants: string[], chunkSize = text.length, roundRobin?: boolean): VoiceSegment[] {
  const parser = new MultiVoiceParser({ participants, roundRobin });
  const out: VoiceSegment[] = [];
  for (let index = 0; index < text.length; index += chunkSize) out.push(...parser.push(text.slice(index, index + chunkSize)));
  out.push(...parser.finish());
  return out.filter((segment) => segment.text.trim());
}

test("single speaker streams immediately and loses nothing", () => {
  const text = "สวัสดีค่ะ สลี่พร้อมช่วยแล้วนะคะ พูดมาได้เลย";
  for (const size of [1, 3, 7, text.length]) {
    const segments = parseAll(text, ["sali"], size);
    assert.equal(segments.every((segment) => segment.speakerId === "sali"), true);
    assert.equal(segments.map((segment) => segment.text).join("").replace(/\s+/g, ""), text.replace(/\s+/g, ""));
  }
});

test("say tags survive every possible chunk size", () => {
  const text = '<say who="sali">สวัสดีค่ะ</say>\n<say who="boss">รับทราบครับ ผมดูเรื่องโค้ดให้</say>\n<say who="mini">สนุกจังเลยค่ะ</say>';
  for (const size of [1, 2, 5, 11, text.length]) {
    const segments = parseAll(text, ["sali", "boss", "mini"], size);
    assert.deepEqual(
      segments.map((segment) => [segment.speakerId, segment.text.trim()]),
      [
        ["sali", "สวัสดีค่ะ"],
        ["boss", "รับทราบครับ ผมดูเรื่องโค้ดให้"],
        ["mini", "สนุกจังเลยค่ะ"],
      ],
    );
  }
});

test("an unfinished tag is held back, never spoken as text", () => {
  const parser = new MultiVoiceParser({ participants: ["sali", "boss"] });
  assert.deepEqual(parser.push("ตอบแล้วค่ะ. <say wh"), [{ speakerId: "sali", text: "ตอบแล้วค่ะ." }]);
  for (const piece of ['o="bo', 'ss">สวัส']) assert.deepEqual(parser.push(piece), []);
  assert.deepEqual(parser.push("ดีครับ</say>"), [{ speakerId: "boss", text: "สวัสดีครับ" }]);
  assert.deepEqual(parser.finish(), []);
});

test("unknown speakers fall back to the leading participant", () => {
  const segments = parseAll('<say who="ghost">ไม่รู้ใคร</say>', ["sali", "boss"]);
  assert.deepEqual(segments, [{ speakerId: "sali", text: "ไม่รู้ใคร" }]);
});

test("line markers with persona names are recognized", () => {
  const segments = parseAll("[สลี่] สวัสดีค่ะ\nบอส: ผมตรวจโค้ดให้แล้ว\n[มินิ] เย้", ["sali", "boss", "mini"]);
  assert.deepEqual(segments.map((segment) => segment.speakerId), ["sali", "boss", "mini"]);
  assert.match(segments[1].text, /ผมตรวจโค้ดให้แล้ว/);
});

test("plain prose is distributed round-robin between speakers", () => {
  const text = "ประโยคแรกนะคะ. ประโยคสองค่ะ. ประโยคสามค่ะ.";
  const segments = parseAll(text, ["sali", "boss", "mini"]);
  assert.equal(segments.length, 3);
  assert.deepEqual(segments.map((segment) => segment.speakerId), ["sali", "boss", "mini"]);
});

test("round robin can be disabled so the lead speaker keeps every line", () => {
  const segments = parseAll("ประโยคแรกนะคะ. ประโยคสองค่ะ.", ["sali", "boss"], 100, false);
  assert.equal(segments.every((segment) => segment.speakerId === "sali"), true);
});

test("long Thai prose without full stops is still flushed", () => {
  const text = "บ".repeat(420);
  const segments = parseAll(text, ["sali", "boss"], 17);
  assert.ok(segments.length >= 2);
  assert.equal(segments.map((segment) => segment.text).join("").length, text.length);
});

test("prompt lists every speaker id and the required tag format", () => {
  const prompt = buildMultiVoicePrompt(VOICE_PERSONAS.slice(0, 3));
  for (const persona of VOICE_PERSONAS.slice(0, 3)) {
    assert.match(prompt, new RegExp(`who="${persona.id}"`));
    assert.match(prompt, new RegExp(persona.name));
  }
  assert.match(prompt, /<say who=/);
  assert.match(prompt, /MULTI-VOICE ROUND TABLE/);
});

test("solo prompt keeps the reply short and spoken", () => {
  const prompt = buildMultiVoicePrompt([VOICE_PERSONAS[0]]);
  assert.match(prompt, /spoken style/);
  assert.ok(!prompt.includes("ROUND TABLE"));
});

test("spoken sentence splitting handles Thai and English enders", () => {
  assert.deepEqual(splitSpokenSentences("หนึ่งค่ะ สองค่ะ"), ["หนึ่งค่ะ สองค่ะ"]);
  assert.deepEqual(splitSpokenSentences("One. Two! Three?"), ["One.", "Two!", "Three?"]);
  assert.deepEqual(splitSpokenSentences("  "), []);
});

test("cast config ignores unknown personas and always keeps a lead speaker", () => {
  const cast = updateVoiceCast({ enabled: true, participants: ["sali", "nobody", "boss"] });
  assert.deepEqual(cast.participants, ["sali", "boss"]);
  assert.equal(cast.enabled, true);

  const emptied = updateVoiceCast({ participants: ["nobody"] });
  assert.deepEqual(emptied.participants, ["sali"]);

  updateVoiceCast({ ...DEFAULT_VOICE_CAST, modes: {} });
});

test("persona voice overrides are stored and applied", () => {
  updateVoiceCast({ participants: ["sali", "boss"] });
  const cast = setPersonaVoice("boss", "energetic");
  assert.equal(cast.modes.boss, "energetic");
  const boss = activePersonas(cast).find((persona) => persona.id === "boss");
  assert.equal(boss?.mode, "energetic");
  assert.equal(toSpeakerVoice(boss!).mode, "energetic");
  updateVoiceCast({ ...DEFAULT_VOICE_CAST, modes: {} });
});

test("cast size is capped and the label lists the speakers", () => {
  let cast = updateVoiceCast({ enabled: true, participants: [] });
  for (const persona of VOICE_PERSONAS) cast = toggleCastParticipant(persona.id);
  assert.ok(cast.participants.length <= 4);
  assert.ok(castLabel(cast).length > 0);
  updateVoiceCast({ ...DEFAULT_VOICE_CAST, modes: {} });
  assert.deepEqual(getVoiceCast().participants, ["sali"]);
});
