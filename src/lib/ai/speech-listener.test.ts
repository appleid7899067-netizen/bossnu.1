import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SpeechListener,
  classifyRecognitionError,
  isFillerTranscript,
  isRepeatTranscript,
  readTranscripts,
  restartDelayMs,
  type ListenerError,
  type ListenerState,
  type RecognitionLike,
} from "./speech-listener.ts";

function createClock() {
  let now = 0;
  let nextId = 1;
  const timers = new Map<number, { at: number; fn: () => void }>();
  return {
    now: () => now,
    schedule(fn: () => void, ms: number) {
      const id = nextId++;
      timers.set(id, { at: now + ms, fn });
      return id;
    },
    cancel(id: number) {
      timers.delete(id);
    },
    pending: () => timers.size,
    tick(ms: number) {
      const target = now + ms;
      for (;;) {
        const due = [...timers.entries()]
          .filter(([, timer]) => timer.at <= target)
          .sort((a, b) => a[1].at - b[1].at || a[0] - b[0]);
        if (!due.length) break;
        const [id, timer] = due[0];
        timers.delete(id);
        now = Math.max(now, timer.at);
        timer.fn();
      }
      now = target;
    },
  };
}

type FakeMic = RecognitionLike & {
  started: boolean;
  say: (text: string, isFinal?: boolean) => void;
  fail: (code: string) => void;
  end: () => void;
};

function createMicHub(available = true) {
  const mics: FakeMic[] = [];
  return {
    mics,
    createRecognition: (): RecognitionLike | null => {
      if (!available) return null;
      const mic: FakeMic = {
        lang: "",
        continuous: false,
        interimResults: false,
        started: false,
        onstart: null,
        onend: null,
        onresult: null,
        onerror: null,
        start() {
          this.started = true;
          this.onstart?.();
        },
        stop() {
          this.started = false;
          this.onend?.();
        },
        abort() {
          this.started = false;
        },
        say(text, isFinal = true) {
          this.onresult?.({ resultIndex: 0, results: [{ isFinal, 0: { transcript: text } }] });
        },
        fail(code) {
          this.onerror?.({ error: code });
        },
        end() {
          this.onend?.();
        },
      };
      mics.push(mic);
      return mic;
    },
    live: () => mics[mics.length - 1],
  };
}

function createRig(opts: { available?: boolean; watchdogMs?: number; maxRestarts?: number } = {}) {
  const clock = createClock();
  const hub = createMicHub(opts.available ?? true);
  const finals: string[] = [];
  const interims: string[] = [];
  const states: ListenerState[] = [];
  const errors: ListenerError[] = [];
  const listener = new SpeechListener(
    { createRecognition: hub.createRecognition, schedule: clock.schedule, cancel: clock.cancel, now: clock.now },
    {
      watchdogMs: opts.watchdogMs ?? 12_000,
      maxRestarts: opts.maxRestarts ?? 8,
      onFinal: (text) => finals.push(text),
      onInterim: (text) => interims.push(text),
      onState: (state) => states.push(state),
      onError: (error) => errors.push(error),
    },
  );
  return { clock, hub, listener, finals, interims, states, errors };
}

test("final transcripts pass, filler noise and instant echoes are dropped", () => {
  const { clock, hub, listener, finals, interims } = createRig();
  listener.start();
  assert.equal(listener.state, "listening");
  const mic = hub.live()!;
  mic.say("กำลังพูดอยู่", false);
  mic.say("ปรับโหมดโทรให้เสถียรหน่อย");
  mic.say("อืม");
  mic.say("ปรับโหมดโทรให้เสถียรหน่อย");
  assert.deepEqual(finals, ["ปรับโหมดโทรให้เสถียรหน่อย"]);
  assert.deepEqual(interims, ["กำลังพูดอยู่"]);
  clock.tick(3_000);
  mic.say("ปรับโหมดโทรให้เสถียรหน่อย");
  assert.equal(finals.length, 2);
});

test("a dropped mic session restarts on the backoff schedule", () => {
  const { clock, hub, listener } = createRig();
  listener.start();
  const before = hub.mics.length;
  hub.live()!.end();
  assert.equal(listener.state, "restarting");
  assert.equal(listener.failures, 1);
  assert.equal(clock.pending(), 1);
  clock.tick(restartDelayMs(1));
  assert.equal(listener.state, "listening");
  assert.equal(hub.mics.length, before + 1);
  assert.notEqual(hub.live(), hub.mics[before - 1]);
});

test("backoff grows and is capped", () => {
  assert.equal(restartDelayMs(0), 350);
  assert.equal(restartDelayMs(1), 700);
  assert.equal(restartDelayMs(2), 1400);
  assert.equal(restartDelayMs(9), 4000);
});

test("fatal mic errors block instead of retrying forever", () => {
  const { clock, hub, listener, errors } = createRig();
  listener.start();
  hub.live()!.fail("not-allowed");
  assert.equal(listener.state, "blocked");
  assert.equal(clock.pending(), 0);
  assert.equal(errors.at(-1)?.fatal, true);
  assert.match(errors.at(-1)!.message, /ไมโครโฟน/);
  clock.tick(60_000);
  assert.equal(listener.state, "blocked");
});

test("transient network errors retry and a good result clears the failure count", () => {
  const { clock, hub, listener, errors } = createRig();
  listener.start();
  hub.live()!.fail("network");
  assert.equal(errors.at(-1)?.fatal, false);
  clock.tick(restartDelayMs(1));
  assert.equal(listener.state, "listening");
  hub.live()!.say("สวัสดีค่ะ");
  assert.equal(listener.failures, 0);
});

test("repeatedly dead sessions eventually report a problem", () => {
  const { clock, hub, listener } = createRig({ maxRestarts: 2 });
  listener.start();
  for (let round = 0; round < 6 && listener.state !== "blocked"; round++) {
    hub.live()!.end();
    clock.tick(5_000);
  }
  assert.equal(listener.state, "blocked");
  assert.equal(clock.pending(), 0);
});

test("pause releases the mic while Sali speaks and resume picks it back up", () => {
  const { hub, listener } = createRig();
  listener.start();
  const mic = hub.live()!;
  listener.pause();
  assert.equal(listener.state, "paused");
  assert.equal(mic.started, false);
  listener.resume();
  assert.equal(listener.state, "listening");
  assert.equal(hub.live()!.started, true);
});

test("the silence watchdog recycles a recognizer that stopped delivering", () => {
  const { clock, hub, listener } = createRig();
  listener.start();
  const before = hub.mics.length;
  clock.tick(13_000);
  assert.equal(listener.state, "listening");
  assert.ok(hub.mics.length > before);
});

test("an active speaker is never recycled by the watchdog", () => {
  const { clock, hub, listener } = createRig();
  listener.start();
  hub.live()!.say("ยังคุยอยู่", false);
  const before = hub.mics.length;
  clock.tick(12_000);
  assert.equal(hub.mics.length, before);
});

test("stop is final and destroy is safe to call twice", () => {
  const { clock, hub, listener } = createRig();
  listener.start();
  listener.stop();
  assert.equal(listener.state, "stopped");
  assert.equal(clock.pending(), 0);
  clock.tick(60_000);
  assert.equal(listener.state, "stopped");
  listener.destroy();
  listener.destroy();
  hub.live()!.end();
  assert.equal(listener.state, "stopped");
});

test("browsers without the Web Speech API are reported as unsupported", () => {
  const { listener, errors } = createRig({ available: false });
  assert.equal(listener.supported, false);
  listener.start();
  assert.equal(listener.state, "blocked");
  assert.equal(errors.at(-1)?.code, "unsupported");
});

test("retry clears a blocked state after the user grants the mic", () => {
  const { clock, hub, listener } = createRig();
  listener.start();
  hub.live()!.fail("no-speech");
  hub.live()?.fail("network");
  clock.tick(4_000);
  listener.retry();
  assert.equal(listener.state, "listening");
  assert.equal(listener.failures, 0);
});

test("error classification separates fatal from transient problems", () => {
  assert.equal(classifyRecognitionError("not-allowed").fatal, true);
  assert.equal(classifyRecognitionError("audio-capture").fatal, true);
  assert.equal(classifyRecognitionError("no-speech").fatal, false);
  assert.equal(classifyRecognitionError("network").fatal, false);
  assert.equal(classifyRecognitionError("weird-new-code").fatal, false);
});

test("filler detection ignores mic noise but keeps real short answers", () => {
  for (const noise of ["", "   ", "อืม", "เอ่อ", "ครับ", "uh", "...", "hmm"]) assert.equal(isFillerTranscript(noise), true);
  for (const real of ["รันโค้ด", "เอาแบบหลายคน", "yes please run it"]) assert.equal(isFillerTranscript(real), false);
});

test("repeat detection catches echoed transcripts only", () => {
  assert.equal(isRepeatTranscript("สวัสดีค่ะ", "สวัสดีค่ะ"), true);
  assert.equal(isRepeatTranscript("สวัสดีค่ะ สลี่พร้อม", "สวัสดีค่ะ"), true);
  assert.equal(isRepeatTranscript("สวัสดีค่ะ", "ลาก่อนค่ะ"), false);
  assert.equal(isRepeatTranscript("", "สวัสดี"), false);
});

test("result events are read from the reported index only", () => {
  const event = {
    resultIndex: 1,
    results: [
      { isFinal: true, 0: { transcript: "เก่า" } },
      { isFinal: true, 0: { transcript: "ใหม่ " } },
      { isFinal: false, 0: { transcript: "กำลังพูด" } },
    ],
  };
  assert.deepEqual(readTranscripts(event), { final: "ใหม่", interim: "กำลังพูด" });
  assert.deepEqual(readTranscripts({} as never), { final: "", interim: "" });
});
