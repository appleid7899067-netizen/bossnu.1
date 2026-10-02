const hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

export type VoiceMode = "cute" | "warm" | "calm" | "bright" | "special" | "deep" | "energetic" | "gentle" | "professional" | "story" | "anime" | "bigSister" | "youngHero" | "butler" | "robot" | "villain" | "wizard" | "news";

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
  { id: "story", label: "📖 นักเล่านิทาน", description: "มีมิติ ชวนติดตาม", voice: "device", rate: 0.92, pitch: 0.96, instructions: "Speak Thai as an engaging storyteller. Use natural rhythm, expressive emphasis, and varied pacing without overacting." },
  { id: "anime", label: "🌟 สาวอนิเมะ", description: "เสียงสูง สดใส ตื่นเต้น", voice: "device", rate: 1.16, pitch: 1.3, instructions: "Speak Thai like a cheerful anime heroine, bright and expressive but still intelligible." },
  { id: "bigSister", label: "👩 พี่สาวใจดี", description: "อบอุ่น เอ็นดู ดูแลเก่ง", voice: "device", rate: 0.94, pitch: 1.08, instructions: "Speak Thai like a kind and caring older sister, warm, patient, and reassuring." },
  { id: "youngHero", label: "🦸 พระเอกวัยรุ่น", description: "มั่นใจ คล่องแคล่ว มีพลัง", voice: "device", rate: 1.08, pitch: 0.92, instructions: "Speak Thai like a confident young hero, energetic, clear, and optimistic." },
  { id: "butler", label: "🤵 พ่อบ้านสุภาพ", description: "สุขุม เนี้ยบ นอบน้อม", voice: "device", rate: 0.88, pitch: 0.82, instructions: "Speak Thai like an elegant, composed butler with precise diction and respectful warmth." },
  { id: "robot", label: "🤖 หุ่นยนต์ AI", description: "เป็นจังหวะ ชัด ล้ำสมัย", voice: "device", rate: 0.9, pitch: 0.72, instructions: "Speak Thai like a futuristic assistant robot, measured, precise, and subtly mechanical." },
  { id: "villain", label: "🦹 จอมวายร้าย", description: "ต่ำ ช้า ลึกลับ น่าเกรงขาม", voice: "device", rate: 0.78, pitch: 0.66, instructions: "Speak Thai like a theatrical but controlled villain, low, deliberate, and mysterious." },
  { id: "wizard", label: "🧙 จอมเวทชรา", description: "ขรึม ลุ่มลึก มีมนตร์ขลัง", voice: "device", rate: 0.8, pitch: 0.74, instructions: "Speak Thai like a wise old wizard, thoughtful, resonant, and gently dramatic." },
  { id: "news", label: "📰 ผู้ประกาศข่าว", description: "เป็นทางการ ชัดถ้อยชัดคำ", voice: "device", rate: 1, pitch: 0.9, instructions: "Speak Thai like a professional news anchor with crisp diction, steady rhythm, and authority." },
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
  source: "device",
  rate: 1,
  pitch: 1,
  volume: 1,
  voiceName: "",
  puterProvider: "",
  puterVoice: "",
  puterModel: "",
};

let settings: VoiceSettings = DEFAULT_VOICE_SETTINGS;
let speaking = false;

function loadSettings() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem("bossnu-voice-settings");
    if (raw) {
      const saved = JSON.parse(raw) as Partial<VoiceSettings>;
      settings = {
        ...DEFAULT_VOICE_SETTINGS,
        ...saved,
        source: "device",
        puterProvider: "",
        puterVoice: "",
        puterModel: "",
      };
    }
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
  try { synth.resume(); } catch { /* Some mobile engines throw while already resumed. */ }
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
        try { synth.resume(); } catch { /* Best-effort wake-up for mobile speech engines. */ }
      }, 40);
    } catch {
      done();
    }
  });
  return true;
}

export function isVoiceSupported() {
  return hasSpeech;
}

export function getVoiceSettings(): VoiceSettings {
  return { ...settings, source: "device", puterProvider: "", puterVoice: "", puterModel: "" };
}

export function getAvailableVoices(): { name: string; lang: string }[] {
  if (!hasSpeech) return [];
  return window.speechSynthesis.getVoices().map((voice) => ({ name: voice.name, lang: voice.lang }));
}

export function applyVoiceMode(mode: VoiceMode) {
  const preset = VOICE_MODES.find((item) => item.id === mode) ?? VOICE_MODES[1];
  updateVoiceSettings({ mode, rate: preset.rate, pitch: preset.pitch, source: "device", puterProvider: "", puterVoice: "", puterModel: "" });
}

export function updateVoiceSettings(patch: Partial<VoiceSettings>) {
  settings = {
    ...settings,
    ...patch,
    source: "device",
    puterProvider: "",
    puterVoice: "",
    puterModel: "",
  };
  saveSettings();
  if (!settings.enabled) stopVoice();
}

export function setVoiceEnabled(value: boolean) {
  updateVoiceSettings({ enabled: value });
}

export function isVoiceEnabled() {
  return settings.enabled;
}

/** Streaming text is intentionally silent. The final summary is spoken once. */
let statusSpeechQueue: string[] = [];
let statusSpeechRunning = false;

async function drainStatusSpeech() {
  if (statusSpeechRunning || !statusSpeechQueue.length || !settings.enabled) return;
  statusSpeechRunning = true;
  const next = statusSpeechQueue.shift()!;
  try {
    await speakDevice(cleanSpeechText(next));
  } finally {
    statusSpeechRunning = false;
    if (statusSpeechQueue.length) void drainStatusSpeech();
  }
}

/** Short real-time work-status voice. Queued so status announcements never overlap. */
export function speakStatus(text: string) {
  const cleaned = cleanSpeechText(text);
  if (!cleaned || !settings.enabled || !hasSpeech) return;
  const last = statusSpeechQueue[statusSpeechQueue.length - 1];
  if (last === cleaned || speaking && last === cleaned) return;
  statusSpeechQueue = [...statusSpeechQueue.slice(-2), cleaned];
  void drainStatusSpeech();
}

export function speakRealtime(_text: string) {
  // Streaming text remains silent. Work-status announcements use speakStatus().
}

export function isVoiceSpeaking() {
  return speaking;
}

export function finishVoice() {
  // Streaming speech has no buffered chunks to flush.
}

export async function speakNow(text: string) {
  const cleaned = cleanSpeechText(text);
  if (!cleaned || !settings.enabled || !hasSpeech) return false;
  window.speechSynthesis.cancel();
  return speakDevice(cleaned);
}

export function stopVoice() {
  speaking = false;
  statusSpeechQueue = [];
  statusSpeechRunning = false;
  if (hasSpeech) window.speechSynthesis.cancel();
}
