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
      }
    ) => Promise<HTMLAudioElement>;
  };
};

declare global {
  interface Window {
    puter?: PuterTTS;
  }
}

const hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
const hasPuter = () => typeof window !== "undefined" && !!window.puter?.ai?.txt2speech;

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
];pe PuterTTS = {
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
      }
    ) => Promise<HTMLAudioElement>;
  };
};

declare global {
  interface Window {
    puter?: PuterTTS;
  }
}

const hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
const hasPuter = () => typeof window !== "undefined" && !!window.puter?.ai?.txt2speech;

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
  { id: "cute", label: "😊 น่ารักใสๆ", description: "สดใส เป็นกันเอง", voice: "Leda", rate: 1.05, pitch: 1.1, instructions: "Speak Thai warmly and playfully, bright and cute but natural. Do not sound childish or exaggerated." },
  { id: "warm", label: "🥰 อ่อนโยนอบอุ่น", description: "นุ่ม ฟังสบาย", voice: "Kore", rate: 0.98, pitch: 1, instructions: "Speak Thai with a warm, calm, friendly adult voice. Natural pacing, reassuring and clear." },
  { id: "calm", label: "😌 สงบผ่อนคลาย", description: "ช้า ชัด ฟังง่าย", voice: "Aoede", rate: 0.88, pitch: 0.98, instructions: "Speak Thai slowly and clearly with a peaceful, composed adult voice. Keep pauses natural." },
  { id: "bright", label: "✨ ร่าเริงสดใส", description: "มีพลังแต่ไม่แหลม", voice: "Puck", rate: 1.08, pitch: 1.02, instructions: "Speak Thai with upbeat energy and friendly confidence. Keep the delivery natural, crisp, and not rushed." },
  { id: "special", label: "💜 ที่รักพิเศษ", description: "นุ่มลึก เป็นส่วนตัว", voice: "Leda", rate: 0.94, pitch: 0.96, instructions: "Speak Thai softly and intimately, warm and sincere, like talking to one person. Avoid theatrical delivery." },
  { id: "deep", label: "🌙 ลึกหนักแน่น", description: "ต่ำ มั่นคง ชัดเจน", voice: "Charon", rate: 0.9, pitch: 0.86, instructions: "Speak Thai with a grounded, confident adult voice. Calm, low, precise, and authoritative without sounding harsh." },
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

let settings: VoiceSettings = DEFAULT_VOICE_SETTINGS;
let pending = "";
let speaking = false;
let generation = 0;
let activeAudio: HTMLAudioElement | null = null;

function loadSettings() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem("bossnu-voice-settings");
    if (raw) settings = { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    settings = DEFAULT_VOICE_SETTINGS;
  }
}

loadSettings();

function saveSettings() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("bossnu-voice-settings", JSON.stringify(settings));
  } catch {}
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

function profile() {
  return VOICE_MODES.find((item) => item.id === settings.mode) ?? VOICE_MODES[1];
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

async function speakPuter(text: string, token: number) {
  if (!hasPuter() || token !== generation) return false;
  const p = profile();
  try {
    const audio = await window.puter!.ai.txt2speech(text.slice(0, 2900), {
      provider: "gemini",
      model: "gemini-3.1-flash-tts-preview",
      voice: p.voice,
      language: "th-TH",
      instructions: p.instructions,
    });
    if (token !== generation || !settings.enabled) {
      audio.pause();
      return true;
    }
    audio.volume = settings.volume;
    activeAudio = audio;
    speaking = true;
    await new Promise<void>((resolve) => {
      const done = () => {
        audio.removeEventListener("ended", done);
        audio.removeEventListener("error", done);
        if (activeAudio === audio) activeAudio = null;
        speaking = false;
        resolve();
      };
      audio.addEventListener("ended", done);
      audio.addEventListener("error", done);
      void audio.play().catch(done);
    });
    return true;
  } catch {
    return false;
  }
}

async function speakDevice(text: string) {
  if (!hasSpeech || !settings.enabled) return;
  const utterance = createDeviceUtterance(text);
  speaking = true;
  await new Promise<void>((resolve) => {
    utterance.onend = () => { speaking = false; resolve(); };
    utterance.onerror = () => { speaking = false; resolve(); };
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  });
}

async function speakChunk(text: string, token: number) {
  const cleaned = cleanSpeechText(text);
  if (!cleaned || token !== generation || !settings.enabled) return;
  if (settings.source === "puter" && await speakPuter(cleaned, token)) return;
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
  const preset = VOICE_MODES.find((item) => item.id === mode) ?? VOICE_MODES[1];
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
