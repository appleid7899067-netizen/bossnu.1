const hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

export type VoiceSettings = {
  enabled: boolean;
  rate: number;
  pitch: number;
  volume: number;
  voiceName: string;
};

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  rate: 0.9,
  pitch: 1.08,
  volume: 0.95,
  voiceName: "",
};

let settings: VoiceSettings = DEFAULT_VOICE_SETTINGS;
let pending = "";
let speaking = false;

function loadSettings() {
  if (!hasSpeech) return;
  try {
    const raw = window.localStorage.getItem("bossnu-voice-settings");
    if (raw) settings = { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    settings = DEFAULT_VOICE_SETTINGS;
  }
}

loadSettings();

function saveSettings() {
  if (!hasSpeech) return;
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

function speakNext() {
  if (!hasSpeech || !settings.enabled || speaking || !pending.trim()) return;
  const match = pending.match(/^(.{40,220}?[.!?。！？\n])(?:\s+|$)/);
  if (!match) return;
  const text = cleanSpeechText(match[1]);
  pending = pending.slice(match[0].length);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "th-TH";
  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;
  utterance.volume = settings.volume;
  const voice = pickThaiVoice();
  if (voice) utterance.voice = voice;
  speaking = true;
  utterance.onend = () => { speaking = false; speakNext(); };
  utterance.onerror = () => { speaking = false; speakNext(); };
  window.speechSynthesis.resume();
  window.speechSynthesis.speak(utterance);
}

function createUtterance(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "th-TH";
  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;
  utterance.volume = settings.volume;
  const voice = pickThaiVoice();
  if (voice) utterance.voice = voice;
  return utterance;
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

export function updateVoiceSettings(patch: Partial<VoiceSettings>) {
  settings = { ...settings, ...patch };
  saveSettings();
  if (!settings.enabled && hasSpeech) {
    window.speechSynthesis.cancel();
    pending = "";
    speaking = false;
  }
}

export function setVoiceEnabled(value: boolean) {
  updateVoiceSettings({ enabled: value });
  if (value) speakNext();
}

export function isVoiceEnabled() {
  return settings.enabled;
}

export function speakRealtime(text: string) {
  if (!hasSpeech || !settings.enabled) return;
  pending += text;
  speakNext();
}

export function finishVoice() {
  if (!hasSpeech || !settings.enabled) return;
  const tail = pending.trim();
  pending = "";
  if (!tail) return;
  const utterance = createUtterance(tail);
  speaking = true;
  utterance.onend = () => { speaking = false; };
  utterance.onerror = () => { speaking = false; };
  window.speechSynthesis.speak(utterance);
}

export function stopVoice() {
  if (!hasSpeech) return;
  window.speechSynthesis.cancel();
  pending = "";
  speaking = false;
}
