/**
 * Voice-engine behaviour under a mocked browser: the realtime queue must stay
 * single-voiced (no overlapping TTS), survive interruptions, and keep every
 * speaker's own voice. Runs in node with `--experimental-strip-types`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

type Spoken = { text: string; pitch: number; rate: number };

const spoken: Spoken[] = [];
const states: boolean[] = [];
let active = 0;
let maxActive = 0;
let utteranceDelay = 5;

class MockUtterance {
  text: string;
  lang = "";
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

const synthesis = {
  speaking: false,
  getVoices: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  cancel() {
    this.speaking = false;
  },
  resume() {},
  speak(utterance: MockUtterance) {
    active += 1;
    maxActive = Math.max(maxActive, active);
    this.speaking = true;
    spoken.push({ text: utterance.text, pitch: utterance.pitch, rate: utterance.rate });
    setTimeout(() => {
      active -= 1;
      this.speaking = active > 0;
      utterance.onend?.();
    }, utteranceDelay);
  },
};

const store = new Map<string, string>();
(globalThis as Record<string, unknown>).window = {
  speechSynthesis: synthesis,
  SpeechSynthesisUtterance: MockUtterance,
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
  },
};
(globalThis as Record<string, unknown>).SpeechSynthesisUtterance = MockUtterance;

const voice = await import("./voice.ts");
voice.updateVoiceSettings({ enabled: true, source: "device" });
voice.subscribeVoiceState((state) => states.push(state.speaking));

async function waitIdle(timeoutMs = 4000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (!voice.isVoiceSpeaking() && voice.queuedVoiceChunks() === 0) return true;
    await new Promise((resolve) => setTimeout(resolve, 8));
  }
  return false;
}

function reset() {
  voice.stopVoice();
  spoken.length = 0;
  maxActive = 0;
  active = 0;
  utteranceDelay = 5;
}

test("streamed chunks are spoken in order and never overlap", async () => {
  reset();
  voice.speakRealtime("ประโยคแรกที่ยาวพอให้ระบบตัดเป็นชิ้นได้ค่ะ. ");
  voice.speakRealtime("ประโยคที่สองก็ยาวพอและต้องพูดต่อทันทีค่ะ. ");
  voice.speakRealtime("ประโยคสุดท้ายจบการทดสอบคิวเสียงค่ะ.");
  voice.finishVoice();
  assert.equal(await waitIdle(), true);
  assert.equal(maxActive, 1, "two TTS playbacks overlapped");
  assert.deepEqual(spoken.map((item) => item.text), [
    "ประโยคแรกที่ยาวพอให้ระบบตัดเป็นชิ้นได้ค่ะ.",
    "ประโยคที่สองก็ยาวพอและต้องพูดต่อทันทีค่ะ.",
    "ประโยคสุดท้ายจบการทดสอบคิวเสียงค่ะ.",
  ]);
});

test("token-sized streaming is merged into speakable sentences", async () => {
  reset();
  for (const token of ["วันนี้", "เรา", "ปรับโหมดโทร", "ให้เสถียร", "แล้วนะคะ", ". ฟัง", "สบายขึ้น", "เยอะเลย", "ค่ะ"]) {
    voice.speakRealtime(token);
  }
  voice.finishVoice();
  assert.equal(await waitIdle(), true);
  assert.ok(spoken.length >= 1 && spoken.length <= 3, `expected 1-3 chunks, got ${spoken.length}`);
  assert.equal(spoken.map((item) => item.text).join("").replace(/\s+/g, "").includes("ปรับโหมดโทร"), true);
});

test("barge-in stops playback and the next answer is still spoken", async () => {
  reset();
  utteranceDelay = 60;
  voice.speakRealtime("ข้อความยาวที่กำลังพูดอยู่แล้วถูกขัดจังหวะค่ะ. ");
  await new Promise((resolve) => setTimeout(resolve, 12));
  assert.equal(voice.isVoiceSpeaking(), true);

  voice.stopVoice();
  utteranceDelay = 5;
  const next = voice.speakNow("คำตอบใหม่ที่ต้องพูดต่อทันทีค่ะ.");
  const outcome = await Promise.race([
    next.then(() => "resolved"),
    new Promise<string>((resolve) => setTimeout(() => resolve("timeout"), 2500)),
  ]);
  assert.equal(outcome, "resolved", "the queue was stranded after an interruption");
  assert.equal(spoken.some((item) => item.text.includes("คำตอบใหม่")), true);
  assert.equal(maxActive, 1);
});

test("each speaker keeps their own voice in multi-voice mode", async () => {
  reset();
  voice.speakRealtime("สลี่พูดด้วยความอบอุ่นนุ่มนวลหนึ่งประโยคค่ะ. ", {
    speaker: { id: "sali", name: "สลี่", mode: "warm" },
  });
  voice.speakRealtime("บอสพูดด้วยโทนต่ำหนักแน่นคนละเสียงกันครับ. ", {
    speaker: { id: "boss", name: "บอส", mode: "deep" },
  });
  voice.finishVoice();
  assert.equal(await waitIdle(), true);
  assert.equal(spoken.length, 2);
  assert.notEqual(spoken[0].pitch, spoken[1].pitch);
  assert.notEqual(spoken[0].rate, spoken[1].rate);
  assert.equal(maxActive, 1);
});

test("turning voice off clears the queue instead of speaking later", async () => {
  reset();
  voice.updateVoiceSettings({ enabled: false });
  voice.speakRealtime("ข้อความนี้ต้องไม่ถูกพูดออกมาค่ะ.");
  voice.finishVoice();
  assert.equal(voice.isVoiceSpeaking(), false);
  assert.equal(voice.queuedVoiceChunks(), 0);
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(spoken.length, 0);
  voice.updateVoiceSettings({ enabled: true });
});

test("a code fence streamed in pieces is never spoken", async () => {
  reset();
  for (const piece of ["สรุปว่าต้องรันคำสั่งนี้ค่ะ ", "```bash\nrm -rf ", "/tmp/x\n``` ", "แล้วตรวจผลอีกครั้งนะคะ."]) {
    voice.speakRealtime(piece);
  }
  voice.finishVoice();
  assert.equal(await waitIdle(), true);
  const text = spoken.map((item) => item.text).join(" ");
  assert.ok(!text.includes("rm -rf"), text);
  assert.ok(!text.includes("```"), text);
  assert.match(text, /สรุปว่าต้องรันคำสั่งนี้ค่ะ/);
  assert.match(text, /แล้วตรวจผลอีกครั้งนะคะ/);
});

test("voice state subscribers see speaking start and end", async () => {
  reset();
  states.length = 0;
  voice.speakRealtime("ทดสอบการแจ้งสถานะการพูดหนึ่งประโยคค่ะ.");
  voice.finishVoice();
  assert.equal(await waitIdle(), true);
  assert.ok(states.includes(true), "never reported speaking");
  assert.equal(states.at(-1), false);
});

test("markdown and code never reach the speaker", async () => {
  reset();
  voice.speakRealtime("เรียบร้อยค่ะ ```bash\nrm -rf /tmp/x\n``` ตรวจสอบ **ผล** ได้เลยนะคะ.");
  voice.finishVoice();
  assert.equal(await waitIdle(), true);
  const text = spoken.map((item) => item.text).join(" ");
  assert.ok(!text.includes("```"));
  assert.ok(!text.includes("rm -rf"));
  assert.ok(!text.includes("**"));
});
