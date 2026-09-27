/**
 * Resilient realtime speech-to-text controller for call mode.
 *
 * The browser Web Speech API drops the microphone constantly (silence timeout,
 * network hiccups, `onend` after every utterance, tab throttling). This class
 * owns that lifecycle so the UI never has to: auto-restart with exponential
 * backoff, a silence watchdog, pause/resume around TTS playback (barge-in),
 * fatal-error detection, filler/repeat transcript filtering.
 *
 * Timers and the recognition factory are injectable → unit-tested in node.
 */

export type RecognitionAlternative = { transcript?: string; confidence?: number };
export type RecognitionResult = { isFinal?: boolean; 0?: RecognitionAlternative };
export type RecognitionResultEvent = { resultIndex?: number; results: ArrayLike<RecognitionResult> };
export type RecognitionErrorEvent = { error?: string; message?: string };

export type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onstart?: (() => void) | null;
  onend?: (() => void) | null;
  onresult?: ((event: RecognitionResultEvent) => void) | null;
  onerror?: ((event: RecognitionErrorEvent) => void) | null;
};

export type ListenerState = "idle" | "starting" | "listening" | "restarting" | "paused" | "blocked" | "stopped";

export type ListenerError = { code: string; message: string; fatal: boolean };

export type TimerHandle = number;

export type SpeechListenerDeps = {
  createRecognition: () => RecognitionLike | null;
  schedule?: (fn: () => void, ms: number) => TimerHandle;
  cancel?: (handle: TimerHandle) => void;
  now?: () => number;
};

export type SpeechListenerOptions = {
  lang?: string;
  interim?: boolean;
  /** Consecutive failed sessions before we stop retrying and report a problem. */
  maxRestarts?: number;
  restartBaseMs?: number;
  restartCapMs?: number;
  /** Restart the recognizer when nothing has been heard for this long (0 = off). */
  watchdogMs?: number;
  /** Ignore an identical transcript repeated within this window (echo guard). */
  repeatWindowMs?: number;
  onFinal?: (text: string) => void;
  onInterim?: (text: string) => void;
  onState?: (state: ListenerState, detail?: string) => void;
  onError?: (error: ListenerError) => void;
};

const FATAL_ERRORS: Record<string, string> = {
  "not-allowed": "ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน กดไอคอนไมค์ในเบราว์เซอร์แล้วลองใหม่",
  "service-not-allowed": "เบราว์เซอร์หรือระบบปิดการรู้จำเสียงไว้",
  "audio-capture": "ไม่พบไมโครโฟน เช็กไมค์แล้วกดโทรใหม่",
  "language-not-supported": "เบราว์เซอร์นี้ไม่รองรับการฟังภาษาไทย",
};

const TRANSIENT_ERRORS: Record<string, string> = {
  "no-speech": "ไม่ได้ยินเสียงพูด ฟังใหม่แล้ว",
  network: "เครือข่ายรู้จำเสียงหลุด กำลังเชื่อมต่อใหม่",
  aborted: "หยุดฟังชั่วคราว",
};

export function classifyRecognitionError(code: string): ListenerError {
  const key = (code || "unknown").toLowerCase();
  if (FATAL_ERRORS[key]) return { code: key, message: FATAL_ERRORS[key], fatal: true };
  return { code: key, message: TRANSIENT_ERRORS[key] ?? "การฟังเสียงสะดุด กำลังเริ่มใหม่", fatal: false };
}

/** Exponential backoff: 350, 700, 1400, 2800, 4000, 4000… */
export function restartDelayMs(failures: number, base = 350, cap = 4000): number {
  const attempt = Math.max(0, Math.min(8, failures));
  return Math.min(cap, base * 2 ** attempt);
}

export function normalizeTranscript(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const FILLER = /^(?:[.,!?…\s-]|อืม+|เอ่อ+|อะฮะ|อ๋อ+|ครับ|ค่ะ|นะคะ|ครับผม|uh+|um+|er+|erm|mm+|hmm+|huh|okay|ok)+$/i;

/** Mic noise / echo fragments that must not wake the assistant. */
export function isFillerTranscript(text: string): boolean {
  const value = text.trim();
  if (!value) return true;
  if (value.length > 24) return false;
  return FILLER.test(value);
}

export function isRepeatTranscript(previous: string, next: string): boolean {
  if (!previous || !next) return false;
  const a = normalizeTranscript(previous);
  const b = normalizeTranscript(next);
  if (!a || !b) return false;
  return a === b || (a.length > b.length && a.includes(b));
}

export function readTranscripts(event: RecognitionResultEvent): { final: string; interim: string } {
  const results = event?.results;
  if (!results || typeof results.length !== "number") return { final: "", interim: "" };
  const start = Math.max(0, Math.min(event.resultIndex ?? 0, results.length));
  let final = "";
  let interim = "";
  for (let index = start; index < results.length; index++) {
    const result = results[index];
    const transcript = result?.[0]?.transcript ?? "";
    if (!transcript) continue;
    if (result?.isFinal) final += transcript;
    else interim += transcript;
  }
  return { final: final.replace(/\s+/g, " ").trim(), interim: interim.replace(/\s+/g, " ").trim() };
}

export class SpeechListener {
  readonly supported: boolean;
  private readonly deps: SpeechListenerDeps;
  private readonly opts: SpeechListenerOptions;
  private recognition: RecognitionLike | null = null;
  private currentState: ListenerState = "idle";
  private detail = "";
  private failureCount = 0;
  private intendedStop = false;
  private pausedByCaller = false;
  private gotResult = false;
  private restartTimer: TimerHandle | null = null;
  private watchdogTimer: TimerHandle | null = null;
  private lastFinal = "";
  private lastFinalAt = 0;
  private destroyed = false;

  constructor(deps: SpeechListenerDeps, opts: SpeechListenerOptions = {}) {
    this.deps = deps;
    this.opts = opts;
    this.supported = deps.createRecognition() !== null;
  }

  get state(): ListenerState {
    return this.currentState;
  }

  get failures(): number {
    return this.failureCount;
  }

  get isLive(): boolean {
    return this.currentState === "listening" || this.currentState === "starting";
  }

  private now(): number {
    return this.deps.now ? this.deps.now() : Date.now();
  }

  private schedule(fn: () => void, ms: number): TimerHandle {
    if (this.deps.schedule) return this.deps.schedule(fn, ms);
    return setTimeout(fn, ms) as unknown as TimerHandle;
  }

  private cancelTimer(handle: TimerHandle | null) {
    if (handle === null) return;
    if (this.deps.cancel) this.deps.cancel(handle);
    else clearTimeout(handle as unknown as number);
  }

  private clearTimers() {
    this.cancelTimer(this.restartTimer);
    this.cancelTimer(this.watchdogTimer);
    this.restartTimer = null;
    this.watchdogTimer = null;
  }

  private setState(state: ListenerState, detail = "") {
    if (this.destroyed) return;
    this.currentState = state;
    this.detail = detail;
    this.opts.onState?.(state, detail);
  }

  private emitError(error: ListenerError) {
    if (this.destroyed) return;
    this.opts.onError?.(error);
  }

  private armWatchdog() {
    const ms = this.opts.watchdogMs ?? 12_000;
    if (!ms) return;
    this.cancelTimer(this.watchdogTimer);
    this.watchdogTimer = this.schedule(() => {
      this.watchdogTimer = null;
      if (this.destroyed || this.intendedStop || this.pausedByCaller) return;
      if (this.currentState !== "listening") return;
      if (this.gotResult) return;
      // Silent recognizer: recycle it instead of waiting forever.
      this.recycle("silence-watchdog");
    }, ms);
  }

  private recycle(reason: string) {
    const rec = this.recognition;
    this.recognition = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.onstart = null;
      try {
        if (rec.abort) rec.abort();
        else rec.stop();
      } catch {
        /* already closed */
      }
    }
    if (this.destroyed || this.intendedStop || this.pausedByCaller) return;
    this.scheduleRestart(reason, 120);
  }

  private scheduleRestart(reason: string, extra = 0) {
    this.clearTimers();
    const delay = restartDelayMs(this.failureCount, this.opts.restartBaseMs, this.opts.restartCapMs) + extra;
    this.setState("restarting", reason);
    this.restartTimer = this.schedule(() => {
      this.restartTimer = null;
      if (this.destroyed || this.intendedStop || this.pausedByCaller) return;
      this.start();
    }, delay);
  }

  start() {
    if (this.destroyed) return;
    if (this.currentState === "listening" || this.currentState === "starting") return;
    this.intendedStop = false;
    this.pausedByCaller = false;
    this.clearTimers();

    const rec = this.deps.createRecognition();
    if (!rec) {
      this.failureCount = 0;
      this.setState("blocked", "เบราว์เซอร์นี้ไม่รองรับการฟังเสียงภาษาไทย");
      this.emitError({ code: "unsupported", message: "เบราว์เซอร์นี้ไม่รองรับการฟังเสียงภาษาไทย", fatal: true });
      return;
    }

    rec.lang = this.opts.lang ?? "th-TH";
    rec.continuous = true;
    rec.interimResults = this.opts.interim ?? false;
    this.recognition = rec;
    this.gotResult = false;

    rec.onstart = () => {
      if (this.destroyed || this.recognition !== rec) return;
      this.gotResult = false;
      this.setState("listening");
      this.armWatchdog();
    };

    rec.onresult = (event) => {
      if (this.destroyed || this.recognition !== rec) return;
      this.gotResult = true;
      this.failureCount = 0;
      this.armWatchdog();
      const { final, interim } = readTranscripts(event);
      if (interim) this.opts.onInterim?.(interim);
      if (!final) return;
      if (isFillerTranscript(final)) return;
      const now = this.now();
      const window = this.opts.repeatWindowMs ?? 2500;
      if (now - this.lastFinalAt < window && isRepeatTranscript(this.lastFinal, final)) return;
      this.lastFinal = final;
      this.lastFinalAt = now;
      this.opts.onFinal?.(final);
    };

    rec.onerror = (event) => {
      if (this.destroyed || this.recognition !== rec) return;
      const info = classifyRecognitionError(String(event?.error ?? ""));
      if (info.code === "aborted") return;
      this.emitError(info);
      if (info.fatal) {
        this.clearTimers();
        this.recognition = null;
        this.setState("blocked", info.message);
        return;
      }
      this.failureCount += 1;
      if (this.failureCount > (this.opts.maxRestarts ?? 6)) {
        this.clearTimers();
        this.recognition = null;
        this.setState("blocked", "ไมค์หรือเครือข่ายไม่เสถียร กดโทรใหม่เพื่อเริ่มอีกครั้ง");
        this.emitError({ code: "unstable", message: "ไมค์หรือเครือข่ายไม่เสถียร กดโทรใหม่เพื่อเริ่มอีกครั้ง", fatal: true });
        return;
      }
      this.scheduleRestart(info.code);
    };

    rec.onend = () => {
      if (this.destroyed || this.recognition !== rec) return;
      this.clearTimers();
      this.recognition = null;
      if (this.intendedStop) {
        this.setState("stopped");
        return;
      }
      if (this.pausedByCaller) {
        this.setState("paused");
        return;
      }
      if (this.currentState === "blocked") return;
      if (!this.gotResult) this.failureCount += 1;
      if (this.failureCount > (this.opts.maxRestarts ?? 6)) {
        this.setState("blocked", "ไมค์หลุดบ่อยเกินไป กดโทรใหม่เพื่อเริ่มอีกครั้ง");
        this.emitError({ code: "unstable", message: "ไมค์หลุดบ่อยเกินไป กดโทรใหม่เพื่อเริ่มอีกครั้ง", fatal: true });
        return;
      }
      this.scheduleRestart(this.gotResult ? "session-end" : "no-result");
    };

    this.setState("starting");
    try {
      rec.start();
    } catch {
      // Already started / InvalidStateError → retry on the backoff schedule.
      this.scheduleRestart("start-failed", 150);
    }
  }

  /** Temporarily release the mic (e.g. while Sali is speaking). */
  pause() {
    if (this.destroyed) return;
    this.pausedByCaller = true;
    this.clearTimers();
    const rec = this.recognition;
    this.recognition = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    if (this.currentState !== "blocked") this.setState("paused");
  }

  resume() {
    if (this.destroyed || !this.pausedByCaller) return;
    this.pausedByCaller = false;
    this.failureCount = 0;
    this.lastFinal = "";
    this.start();
  }

  /** Clear a blocked state and try again (user pressed retry). */
  retry() {
    if (this.destroyed) return;
    this.failureCount = 0;
    this.intendedStop = false;
    this.pausedByCaller = false;
    this.start();
  }

  stop() {
    this.intendedStop = true;
    this.pausedByCaller = false;
    this.clearTimers();
    const rec = this.recognition;
    this.recognition = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.onstart = null;
      try {
        if (rec.abort) rec.abort();
        else rec.stop();
      } catch {
        /* ignore */
      }
    }
    this.setState("stopped", this.detail);
  }

  destroy() {
    this.destroyed = true;
    this.stop();
    this.clearTimers();
  }
}
