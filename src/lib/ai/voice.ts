const hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

export type VoiceMode = "cute" | "warm" | "calm" | "bright" | "special" | "deep" | "energetic" | "gentle" | "professional" | "story";

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
  { id: "cute", label: "😊 น่ารักใสๆ", description: "สดใส เป็นกันเอง", voice: "device", rate: 1.05, pitch: 1.1, instructions: "Speak Thai warmly and playfully, bright and cute but natural. Do not sound childish or exaggerated." },
  { id: "warm", label: "🥰 อ่อนโยนอบอุ่น", description: "นุ่ม ฟังสบาย", voice: "device", rate: 0.98, pitch: 1, instructions: "Speak Thai with a warm, calm, friendly adult voice. Natural pacing, reassuring and clear." },
  { id: "calm", label: "😌 สงบผ่อนคลาย", description: "ช้า ชัด ฟังง่าย", voice: "device", rate: 0.88, pitch: 0.98, instructions: "Speak Thai slowly and clearly with a peaceful, composed adult voice. Keep pauses natural." },
  { id: "bright", label: "✨ ร่าเริงสดใส", description: "มีพลังแต่ไม่แหลม", voice: "device", rate: 1.08, pitch: 1.02, instructions: "Speak Thai with upbeat energy and friendly confidence. Keep the delivery natural, crisp, and not rushed." },
  { id: "special", label: "💜 ที่รักพิเศษ", description: "นุ่มลึก เป็นส่วนตัว", voice: "device", rate: 0.94, pitch: 0.96, instructions: "Speak Thai softly and personally, warm and sincere, like talking to one person. Avoid theatrical delivery." },
  { id: "deep", label: "🌙 ลึกหนักแน่น", description: "ต่ำ มั่นคง ชัดเจน", voice: "device", rate: 0.9, pitch: 0.86, instructions: "Speak Thai with a grounded, confident adult voice. Calm, low, precise, and authoritative without sounding harsh." },
  { id: "energetic", label: "⚡ พลังงานสูง", description: "คึกคัก กระฉับกระเฉง", voice: "device", rate: 1.1, pitch: 1.0, instructions: "Speak Thai with energetic confidence and momentum. Sound lively and capable, never rushed or shouty." },
  { id: "gentle", label: "🌸 ละมุนใจ", description: "อ่อนโยน นุ่มนวล", voice: "device", rate: 0.93, pitch: 1.04, instructions: "Speak Thai gently with a soft, caring adult voice. Smooth phrasing, natural warmth, and delicate expression." },
  { id: "professional", label: "🎙️ มืออาชีพ", description: "ชัด สุขุม น่าเชื่อถือ", voice: "device", rate: 0.96, pitch: 0.92, instructions: "Speak Thai clearly and professionally with calm confidence. Precise diction, balanced pacing, and natural authority." },
  { id: "story", label: "📖 เล่าเรื่อง", description: "มีมิติ น่าฟัง", voice: "device", rate: 0.97, pitch: 0.98, instructions: "Speak Thai as an engaging storyteller. Use natural rhythm, expressive emphasis, and varied pacing without overacting." },
];

export type VoiceSettings = {
  enabled: boolean;
  mode: VoiceMode;
  source: "device" | "puter";
  rate: number;
  pitch: number;
  volume: number;
  voiceName: string;
  puterProvider: string;
  puterVoice: string;
  puterModel: string;
};

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  mode: "warm",
  // Browser/device speech synthesis is the single playback path.
  // Keep "source" for backwards-compatible saved settings.
  source: "puter",
  rate: 1,
  pitch: 1,
  volume: 1,
  voiceName: "",
  puterProvider: "xai",
  puterVoice: "eve",
  puterModel: "",
};

let settings: VoiceSettings = DEFAULT_VOICE_SETTINGS;
let pending = "";
let speaking = false;
let generation = 0;
let activeAudio: HTMLAudioElement | null = null;

function loadSettings() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem("bossnu-voice-settings");
    if (raw) settings = { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw), source: "puter", puterProvider: "xai", puterVoice: ["eve", "ara"].includes(JSON.parse(raw).puterVoice) ? JSON.parse(raw).puterVoice : "eve" };
  } catch {
    settings = DEFAULT_VOICE_SETTINGS;
  }
}

loadSettings();

function saveSettings() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("bossnu-voice-settings", JSON.stringify(settings));
  } catch {
    // Voice preferences are optional; ignore unavailable local storage.
  }
}

function pickThaiVoice() {
  if (!hasSpeech) return null;
  const voices = window.speechSynthesis.getVoices();
  if (settings.voiceName) {
    const selected = voices.find((v) => v.name === settings.voiceName);
    if (selected) return selected;
  }
  return voices.find((v) => /^th(-|_)/i.test(v.lang)) ?? voices.find((v) => /thai/i.test(v.name)) ?? null;
}

function cleanSpeechText(value: string) {
  return value
    .replace(/\x60\x60\x60[\s\S]*?\x60\x60\x60/g, " ")
    .replace(/\x60([^\x60]+)\x60/g, "$1")
    .replace(/[#*_>]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}



type PuterVoice = { id: string; name?: string; provider?: string; description?: string; language?: { name?: string; code?: string }; supported_models?: string[]; supported_engines?: string[] };

type PuterAI = {
  txt2speech: ((text: string, options?: Record<string, unknown>) => Promise<HTMLAudioElement>) & {
    listVoices?: (options?: Record<string, unknown>) => Promise<PuterVoice[]>;
  };
};

type PuterGlobal = { ai?: PuterAI };

function getPuter(): PuterGlobal | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { puter?: PuterGlobal }).puter ?? null;
}

export type PuterVoiceOption = { id: string; name: string; provider: string; language: string; description: string };

export async function getPuterVoices(): Promise<PuterVoiceOption[]> {
  const puter = getPuter();
  const listVoices = puter?.ai?.txt2speech?.listVoices;
  if (!listVoices) return [];
  try {
    const voices = await listVoices({ provider: "all" });
    return voices
      .filter((voice) => !voice.language?.code || /^th(-|_)/i.test(voice.language.code) || /thai/i.test(voice.language?.name ?? ""))
      .map((voice) => ({ id: voice.id, name: voice.name ?? voice.id, provider: voice.provider ?? "unknown", language: voice.language?.code ?? "auto", description: voice.description ?? "" }));
  } catch {
    return [];
  }
}

async function speakPuter(text: string) {
  const puter = getPuter();
  if (!puter?.ai?.txt2speech || !settings.enabled) return false;
  try {
    const options: Record<string, unknown> = {
      provider: settings.puterProvider,
      voice: settings.puterVoice,
      language: "th-TH",
    };
    if (settings.puterModel) options.model = settings.puterModel;
    if (settings.puterProvider === "xai") options.language = "th";
    const audio = await puter.ai.txt2speech(cleanSpeechText(text).slice(0, 2999), options);
    activeAudio = audio;
    audio.volume = settings.volume;
    await audio.play();
    await new Promise<void>((resolve) => {
      const done = () => { audio.removeEventListener("ended", done); audio.removeEventListener("error", done); resolve(); };
      audio.addEventListener("ended", done, { once: true });
      audio.addEventListener("error", done, { once: true });
    });
    if (activeAudio === audio) activeAudio = null;
    return true;
  } catch {
    if (activeAudio) activeAudio = null;
    return false;
  }
}

function createDeviceUtterance(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "th-TH";
  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;
  utterance.volume = settings.volume;
  const voice = pickThaiVoice();
  if (voice) utterance.voice = voice;
  return utterance;
}

async function speakDevice(text: string) {
  if (!hasSpeech || !settings.enabled || !text.trim()) return false;
  const synth = window.speechSynthesis;
  try { synth.resume(); } catch {}
  const utterance = createDeviceUtterance(text);
  speaking = true;
  await new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      speaking = false;
      resolve();
    };
    utterance.onend = done;
    utterance.onerror = done;
    try {
      synth.speak(utterance);
      window.setTimeout(() => {
        try { synth.resume(); } catch {}
      }, 40);
    } catch {
      done();
    }
  });
  return true;
}

async function speakChunk(text: string, token: number) {
  const cleaned = cleanSpeechText(text);
  if (!cleaned || token !== generation || !settings.enabled) return;
  if (settings.source === "puter") {
    const ok = await speakPuter(cleaned);
    if (ok) return;
  }
  await speakDevice(cleaned);
}

function takeChunk(final = false) {
  const match = pending.match(/^(.{40,260}?[.!?。！？\n])(?:\s+|$)/);
  if (match) {
    pending = pending.slice(match[0].length);
    return match[1];
  }
  if (final && pending.trim()) {
    const tail = pending.trim();
    pending = "";
    return tail;
  }
  return "";
}

async function drain(final = false) {
  const token = generation;
  while (settings.enabled && token === generation) {
    const chunk = takeChunk(final);
    if (!chunk) break;
    await speakChunk(chunk, token);
    final = false;
  }
}

export function isVoiceSupported() {
  return hasSpeech;
}

export function getVoiceSettings(): VoiceSettings {
  return { ...settings };
}

export function getAvailableVoices(): { name: string; lang: string }[] {
  if (!hasSpeech) return [];
  return window.speechSynthesis.getVoices().map((voice) => ({ name: voice.name, lang: voice.lang }));
}

export function applyVoiceMode(mode: VoiceMode) {
  const preset = VOICE_MODES.find((item) => item.id === mode) ?? VOICE_MODES[1];
  updateVoiceSettings({ mode, rate: preset.rate, pitch: preset.pitch, source: "device" });
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

export function speakRealtime(text: string) {
  if (!settings.enabled) return;
  pending += text;
  void drain(false);
}

export function isVoiceSpeaking() {
  return speaking || !!activeAudio?.paused === false || (hasSpeech && window.speechSynthesis.speaking);
}

export function finishVoice() {
  if (!settings.enabled) {
    pending = "";
    return;
  }
  void drain(true);
}

export async function speakNow(text: string) {
  const cleaned = cleanSpeechText(text);
  if (!cleaned || !settings.enabled || !hasSpeech) return false;

  // A direct browser utterance is the reliable final fallback on mobile.
  // Cancel any queued stream fragments first so the answer is never silent
  // and never spoken twice by stale browser utterances.
  generation += 1;
  pending = "";
  const synth = window.speechSynthesis;
  try { synth.cancel(); } catch {}
  await new Promise((resolve) => window.setTimeout(resolve, 30));
  if (settings.source === "puter") {
    const ok = await speakPuter(cleaned);
    if (ok) return true;
  }
  return speakDevice(cleaned);
}

export function stopVoice() {
  generation += 1;
  pending = "";
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  speaking = false;
  if (hasSpeech) window.speechSynthesis.cancel();
}
