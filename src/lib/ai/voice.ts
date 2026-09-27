/**
 * Realtime voice engine (Sali).
 *
 * Stability rules this module enforces:
 * - ONE playback worker: streamed chunks are queued and spoken strictly in
 *   order, so two TTS requests can never overlap (the old code started a new
 *   drain loop per token chunk, which produced double/echoing audio).
 * - Per-speaker buffers: multi-voice ("หลายคน") mode keeps each persona's text
 *   separate, so a speaker switch never mixes two voices inside one chunk.
 * - Every playback path has a watchdog: a stalled <audio> element or a hung
 *   speechSynthesis utterance can no longer block the queue forever.
 * - Puter TTS failure falls back to device speechSynthesis automatically.
 *
 * Pure helpers (`nextSpeechChunk`, `splitForSpeech`, `cleanSpeechText`) are
 * exported and unit-tested in `voice.test.ts` — they must stay browser-free.
 */

type PuterTTS = {
  ai: {
    txt2speech: (
      text: string,
      options?: {
        provider?: string;
        model?: string;
        voice?: string;
        instructions?: string;
        language?: string;
        response_format?: string;
      },
    ) => Promise<HTMLAudioElement>;
  };
};

const hasSpeech =
  typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

/**
 * `@heyputer/puter.js` declares `window.puter` globally, but the TTS option
 * shape we send (provider/model/instructions) is not in its public types, so we
 * reach it through a narrow local contract and feature-detect at runtime.
 */
function puterTts(): PuterTTS | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as unknown as { puter?: unknown }).puter as PuterTTS | undefined;
  return typeof candidate?.ai?.txt2speech === "function" ? candidate : null;
}

const hasPuter = () => puterTts() !== null;

export type VoiceMode =
  | "cute"
  | "warm"
  | "calm"
  | "bright"
  | "special"
  | "deep"
  | "energetic"
  | "gentle"
  | "professional"
  | "story";

type VoiceProfile = {
  id: VoiceMode;
  label: string;
  description: string;
  voice: string;
  rate: number;
  pitch: number;
  instructions: string;
};

export const VOICE_MODES: VoiceProfile[] = [
  { id: "cute", label: "😊 น่ารักใสๆ", description: "สดใส เป็นกันเอง", voice: "Leda", rate: 1.05, pitch: 1.1, instructions: "Speak Thai warmly and playfully, bright and cute but natural. Do not sound childish or exaggerated." },
  { id: "warm", label: "🥰 อ่อนโยนอบอุ่น", description: "นุ่ม ฟังสบาย", voice: "Kore", rate: 0.98, pitch: 1, instructions: "Speak Thai with a warm, calm, friendly adult voice. Natural pacing, reassuring and clear." },
  { id: "calm", label: "😌 สงบผ่อนคลาย", description: "ช้า ชัด ฟังง่าย", voice: "Aoede", rate: 0.88, pitch: 0.98, instructions: "Speak Thai slowly and clearly with a peaceful, composed adult voice. Keep pauses natural." },
  { id: "bright", label: "✨ ร่าเริงสดใส", description: "มีพลังแต่ไม่แหลม", voice: "Puck", rate: 1.08, pitch: 1.02, instructions: "Speak Thai with upbeat energy and friendly confidence. Keep the delivery natural, crisp, and not rushed." },
  { id: "special", label: "💜 ที่รักพิเศษ", description: "นุ่มลึก เป็นส่วนตัว", voice: "Callirrhoe", rate: 0.94, pitch: 0.96, instructions: "Speak Thai softly and personally, warm and sincere, like talking to one person. Avoid theatrical delivery." },
  { id: "deep", label: "🌙 ลึกหนักแน่น", description: "ต่ำ มั่นคง ชัดเจน", voice: "Charon", rate: 0.9, pitch: 0.86, instructions: "Speak Thai with a grounded, confident adult voice. Calm, low, precise, and authoritative without sounding harsh." },
  { id: "energetic", label: "⚡ พลังงานสูง", description: "คึกคัก กระฉับกระเฉง", voice: "Fenrir", rate: 1.1, pitch: 1.0, instructions: "Speak Thai with energetic confidence and momentum. Sound lively and capable, never rushed or shouty." },
  { id: "gentle", label: "🌸 ละมุนใจ", description: "อ่อนโยน นุ่มนวล", voice: "Autonoe", rate: 0.93, pitch: 1.04, instructions: "Speak Thai gently with a soft, caring adult voice. Smooth phrasing, natural warmth, and delicate expression." },
  { id: "professional", label: "🎙️ มืออาชีพ", description: "ชัด สุขุม น่าเชื่อถือ", voice: "Orus", rate: 0.96, pitch: 0.92, instructions: "Speak Thai clearly and professionally with calm confidence. Precise diction, balanced pacing, and natural authority." },
  { id: "story", label: "📖 เล่าเรื่อง", description: "มีมิติ น่าฟัง", voice: "Enceladus", rate: 0.97, pitch: 0.98, instructions: "Speak Thai as an engaging storyteller. Use natural rhythm, expressive emphasis, and varied pacing without overacting." },
];

export type VoiceSettings = {
  enabled: boolean;
  mode: VoiceMode;
  source: "puter" | "device";
  rate: number;
  pitch: number;
  volume: number;
  voiceName: string;
};

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  mode: "warm",
  source: "puter",
  rate: 1,
  pitch: 1,
  volume: 1,
  voiceName: "",
};

/** A spoken participant (multi-voice / round-table mode). */
export type SpeakerVoice = {
  id: string;
  name: string;
  mode: VoiceMode;
  /** Optional per-speaker trim, multiplied onto the voice profile. */
  rate?: number;
  pitch?: number;
};

export type VoiceState = {
  enabled: boolean;
  speaking: boolean;
  queued: number;
  speaker: string | null;
};

const SETTINGS_KEY = "bossnu-voice-settings";
const PUTER_TTS_MODEL = "gemini-3.1-flash-tts-preview";
/** Puter accepts ~3k chars; we speak far smaller pieces for low latency. */
const PUTER_MAX_CHARS = 2900;
/** Longest a single chunk may block the queue before the watchdog cuts it. */
const CHUNK_WATCHDOG_MS = 45_000;
const PUTER_SYNTH_TIMEOUT_MS = 20_000;
const MAX_QUEUE = 120;

export const SPEECH_CHUNK_MIN = 24;
export const SPEECH_CHUNK_MAX = 300;
export const SPEECH_HARD_MAX = 420;

let settings: VoiceSettings = { ...DEFAULT_VOICE_SETTINGS };
const listeners = new Set<(state: VoiceState) => void>();

type Job = { token: number; text: string; speaker: SpeakerVoice | null };
let queue: Job[] = [];
/** Pending (not yet sentence-complete) text per speaker id, "" = default voice. */
const pending = new Map<string, { text: string; speaker: SpeakerVoice | null }>();
let generation = 0;
let workerRunning = false;
let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let speaking = false;
let currentSpeaker: SpeakerVoice | null = null;

function loadSettings() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) settings = { ...DEFAULT_VOICE_SETTINGS, ...(JSON.parse(raw) as Partial<VoiceSettings>) };
  } catch {
    settings = { ...DEFAULT_VOICE_SETTINGS };
  }
}

function saveSettings() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage full or blocked — voice still works with in-memory settings */
  }
}

loadSettings();

/** Chrome only fills the voice list lazily; warming it avoids a silent first reply. */
function warmUpVoices() {
  if (!hasSpeech) return;
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", () => window.speechSynthesis.getVoices(), { once: true });
  } catch {
    /* ignore */
  }
}

warmUpVoices();

export function voiceProfileFor(mode: VoiceMode): VoiceProfile {
  return VOICE_MODES.find((item) => item.id === mode) ?? VOICE_MODES[1];
}

function pickThaiVoice() {
  if (!hasSpeech) return null;
  const voices = window.speechSynthesis.getVoices();
  if (settings.voiceName) {
    const selected = voices.find((voice) => voice.name === settings.voiceName);
    if (selected) return selected;
  }
  return voices.find((voice) => /^th(-|_)/i.test(voice.lang)) ?? voices.find((voice) => /thai/i.test(voice.name)) ?? null;
}

/** Strip markdown/code/URLs so the TTS never reads syntax aloud. */
export function cleanSpeechText(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<say\b[^>]*>|<\/say>/gi, " ")
    .replace(/<[^>]{1,120}>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[#*_>|]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Streaming-friendly Thai/English sentence chunker.
 * Returns the next speakable piece plus the untouched remainder; an empty
 * chunk means "wait for more text" unless `final` is set.
 */
export function nextSpeechChunk(buffer: string, final = false): { chunk: string; rest: string } {
  const text = buffer.replace(/^\s+/, "");
  if (!text) return { chunk: "", rest: "" };

  const window = text.slice(0, SPEECH_CHUNK_MAX);
  const enders = /[.!?;:。！？\n]+|\s{2,}/g;
  let match: RegExpExecArray | null;
  while ((match = enders.exec(window)) !== null) {
    const end = match.index + match[0].length;
    if (end >= SPEECH_CHUNK_MIN) {
      return { chunk: text.slice(0, end).trim(), rest: text.slice(end) };
    }
  }

  if (text.length >= SPEECH_HARD_MAX) {
    const hard = text.slice(0, SPEECH_HARD_MAX);
    const space = Math.max(hard.lastIndexOf(" "), hard.lastIndexOf("​"));
    const cut = space >= SPEECH_CHUNK_MIN ? space : SPEECH_HARD_MAX;
    return { chunk: text.slice(0, cut).trim(), rest: text.slice(cut) };
  }

  if (final) {
    const trimmed = text.trim();
    if (trimmed.length <= SPEECH_HARD_MAX) return { chunk: trimmed, rest: "" };
    return { chunk: trimmed.slice(0, SPEECH_HARD_MAX), rest: trimmed.slice(SPEECH_HARD_MAX) };
  }

  return { chunk: "", rest: buffer };
}

/** Split a complete text into speakable pieces (used for one-shot replies). */
export function splitForSpeech(text: string): string[] {
  const chunks: string[] = [];
  let rest = text;
  for (let guard = 0; guard < 200; guard++) {
    const next = nextSpeechChunk(rest, true);
    if (!next.chunk) break;
    chunks.push(next.chunk);
    rest = next.rest;
    if (!rest.trim()) break;
  }
  return chunks.filter(Boolean);
}

function emitState() {
  const state: VoiceState = {
    enabled: settings.enabled,
    speaking,
    queued: queue.length,
    speaker: currentSpeaker?.name ?? null,
  };
  for (const listener of [...listeners]) {
    try {
      listener(state);
    } catch {
      /* a broken subscriber must not kill playback */
    }
  }
}

function speakerKey(speaker: SpeakerVoice | null | undefined) {
  return speaker?.id ?? "";
}

function enqueue(text: string, speaker: SpeakerVoice | null, token: number) {
  const clean = text.trim();
  if (!clean) return;
  const last = queue[queue.length - 1];
  if (queue.length >= MAX_QUEUE && last && speakerKey(last.speaker) === speakerKey(speaker)) {
    last.text = `${last.text} ${clean}`.slice(0, PUTER_MAX_CHARS);
    return;
  }
  queue.push({ token, text: clean.slice(0, PUTER_MAX_CHARS), speaker });
  emitState();
}

/**
 * Code fences must never be read aloud. Complete fences are dropped; an
 * unterminated fence holds the rest of the buffer back until the closing fence
 * streams in (or the answer ends, when the code tail is discarded).
 */
export function holdCodeFences(buffer: string, final: boolean): { speakable: string; held: string } {
  const withoutPairs = buffer.replace(/(?:```|~~~)[\s\S]*?(?:```|~~~)/g, " ");
  const index = withoutPairs.search(/```|~~~/);
  if (index < 0) return { speakable: withoutPairs, held: "" };
  if (final) return { speakable: withoutPairs.slice(0, index), held: "" };
  return { speakable: withoutPairs.slice(0, index), held: withoutPairs.slice(index) };
}

function flush(speaker: SpeakerVoice | null, final: boolean) {
  const key = speakerKey(speaker);
  const buffer = pending.get(key)?.text ?? "";
  if (!buffer) return;
  const { speakable, held } = holdCodeFences(buffer, final);
  let rest = speakable;
  for (let guard = 0; guard < 200; guard++) {
    const next = nextSpeechChunk(rest, final);
    if (!next.chunk) {
      rest = final ? "" : next.rest;
      break;
    }
    enqueue(next.chunk, speaker, generation);
    rest = next.rest;
    if (!rest) break;
  }
  const leftover = `${rest}${held}`;
  if (leftover) pending.set(key, { text: leftover, speaker });
  else pending.delete(key);
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("voice-timeout")), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function speakPuter(text: string, speaker: SpeakerVoice | null, token: number) {
  const tts = puterTts();
  if (!tts || token !== generation) return false;
  const profile = voiceProfileFor(speaker?.mode ?? settings.mode);
  try {
    const audio = await withTimeout(
      tts.ai.txt2speech(text.slice(0, PUTER_MAX_CHARS), {
        provider: "gemini",
        model: PUTER_TTS_MODEL,
        voice: profile.voice,
        language: "th-TH",
        instructions: profile.instructions,
      }),
      PUTER_SYNTH_TIMEOUT_MS,
    );
    if (token !== generation || !settings.enabled) {
      try {
        audio.pause();
      } catch {
        /* ignore */
      }
      return true;
    }
    audio.volume = settings.volume;
    activeAudio = audio;
    speaking = true;
    emitState();
    await new Promise<void>((resolve) => {
      let settled = false;
      const watchdog = setTimeout(cleanup, Math.min(CHUNK_WATCHDOG_MS, (Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration * 1000 : 12_000) + 8_000));
      function cleanup() {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        audio.removeEventListener("ended", cleanup);
        audio.removeEventListener("error", cleanup);
        audio.removeEventListener("stalled", cleanup);
        if (activeAudio === audio) activeAudio = null;
        speaking = false;
        resolve();
      }
      audio.addEventListener("ended", cleanup);
      audio.addEventListener("error", cleanup);
      audio.addEventListener("stalled", cleanup);
      void audio.play().catch(() => {
        try {
          audio.pause();
        } catch {
          /* ignore */
        }
        cleanup();
      });
    });
    return true;
  } catch {
    return false;
  }
}

async function speakDevice(text: string, speaker: SpeakerVoice | null) {
  if (!hasSpeech || !settings.enabled) return;
  const profile = voiceProfileFor(speaker?.mode ?? settings.mode);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "th-TH";
  utterance.rate = clamp(speaker ? profile.rate * (speaker.rate ?? 1) : settings.rate, 0.6, 1.6);
  utterance.pitch = clamp(speaker ? profile.pitch * (speaker.pitch ?? 1) : settings.pitch, 0.4, 1.8);
  utterance.volume = settings.volume;
  const voice = pickThaiVoice();
  if (voice) utterance.voice = voice;

  speaking = true;
  activeUtterance = utterance;
  emitState();
  await new Promise<void>((resolve) => {
    let settled = false;
    // Chrome pauses long utterances; a keep-alive resume avoids a stuck queue.
    const keepAlive = setInterval(() => {
      try {
        if (window.speechSynthesis.speaking) window.speechSynthesis.resume();
      } catch {
        /* ignore */
      }
    }, 4_000);
    const watchdog = setTimeout(cleanup, CHUNK_WATCHDOG_MS);
    function cleanup() {
      if (settled) return;
      settled = true;
      clearInterval(keepAlive);
      clearTimeout(watchdog);
      if (activeUtterance === utterance) activeUtterance = null;
      speaking = false;
      resolve();
    }
    utterance.onend = cleanup;
    utterance.onerror = cleanup;
    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch {
      cleanup();
    }
  });
}

async function speakJob(job: Job) {
  const text = cleanSpeechText(job.text);
  if (!text || job.token !== generation || !settings.enabled) return;
  if (settings.source === "puter" && (await speakPuter(text, job.speaker, job.token))) return;
  await speakDevice(text, job.speaker);
}

async function runWorker() {
  if (workerRunning) return;
  workerRunning = true;
  try {
    // Stale jobs (queued before an interruption) are skipped, not aborted mid
    // await: `stopVoice()` bumps the generation, and the current playback call
    // resolves on its own watchdog/cleanup path.
    while (queue.length && settings.enabled) {
      const job = queue.shift()!;
      if (job.token !== generation) continue;
      currentSpeaker = job.speaker;
      emitState();
      await speakJob(job);
      currentSpeaker = null;
      emitState();
    }
  } finally {
    workerRunning = false;
    currentSpeaker = null;
    speaking = false;
    emitState();
    // Anything queued while this worker was exiting must not be stranded.
    if (queue.length && settings.enabled) void runWorker();
  }
}

function ensureWorker() {
  if (!settings.enabled || !queue.length) return;
  void runWorker();
}

export function isVoiceSupported() {
  return hasSpeech || hasPuter();
}

export function getVoiceSettings(): VoiceSettings {
  return { ...settings };
}

export function getAvailableVoices(): { name: string; lang: string }[] {
  if (!hasSpeech) return [];
  return window.speechSynthesis.getVoices().map((voice) => ({ name: voice.name, lang: voice.lang }));
}

export function applyVoiceMode(mode: VoiceMode) {
  const preset = voiceProfileFor(mode);
  updateVoiceSettings({ mode, rate: preset.rate, pitch: preset.pitch });
}

export function updateVoiceSettings(patch: Partial<VoiceSettings>) {
  settings = { ...settings, ...patch };
  saveSettings();
  if (!settings.enabled) stopVoice();
}

export function setVoiceEnabled(value: boolean) {
  updateVoiceSettings({ enabled: value });
}

export function isVoiceEnabled() {
  return settings.enabled;
}

export function subscribeVoiceState(listener: (state: VoiceState) => void) {
  listeners.add(listener);
  listener(getVoiceState());
  return () => {
    listeners.delete(listener);
  };
}

export function getVoiceState(): VoiceState {
  return { enabled: settings.enabled, speaking, queued: queue.length, speaker: currentSpeaker?.name ?? null };
}

/** Queue streamed text; chunks are spoken in arrival order by a single worker. */
export function speakRealtime(text: string, opts?: { speaker?: SpeakerVoice | null }) {
  if (!settings.enabled || !text) return;
  const speaker = opts?.speaker ?? null;
  const key = speakerKey(speaker);
  pending.set(key, { text: (pending.get(key)?.text ?? "") + text, speaker });
  flush(speaker, false);
  ensureWorker();
}

/** Speak a complete sentence/answer now (greetings, one-shot prompts). */
export async function speakNow(text: string, opts?: { speaker?: SpeakerVoice | null }) {
  if (!settings.enabled) return;
  stopVoice();
  const speaker = opts?.speaker ?? null;
  for (const chunk of splitForSpeech(text)) enqueue(chunk, speaker, generation);
  const token = generation;
  ensureWorker();
  await new Promise<void>((resolve) => {
    const check = () => {
      if (token !== generation || (!workerRunning && !queue.length)) {
        resolve();
        return;
      }
      setTimeout(check, 90);
    };
    check();
  });
}

export function isVoiceSpeaking() {
  if (speaking || queue.length > 0) return true;
  return hasSpeech && window.speechSynthesis.speaking;
}

export function queuedVoiceChunks() {
  return queue.length;
}

/** Flush remaining streamed text (end of an answer) into the queue. */
export function finishVoice() {
  if (!settings.enabled) {
    pending.clear();
    return;
  }
  for (const entry of [...pending.values()]) flush(entry.speaker, true);
  pending.clear();
  ensureWorker();
}

export function stopVoice() {
  generation += 1;
  queue = [];
  pending.clear();
  const audio = activeAudio;
  activeAudio = null;
  if (audio) {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      /* ignore */
    }
  }
  activeUtterance = null;
  speaking = false;
  currentSpeaker = null;
  if (hasSpeech) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
  emitState();
}
