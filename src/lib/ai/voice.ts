const hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

let enabled = true;
let pending = "";
let speaking = false;

function pickThaiVoice() {
  if (!hasSpeech) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => /^th(-|_)/i.test(v.lang)) ?? voices.find((v) => /thai/i.test(v.name)) ?? null;
}

function speakNext() {
  if (!hasSpeech || !enabled || speaking || !pending.trim()) return;
  const match = pending.match(/^(.{40,220}?[.!?。！？\n])(?:\s+|$)/);
  if (!match) return;
  const text = match[1].trim();
  pending = pending.slice(match[0].length);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "th-TH";
  utterance.rate = 1.02;
  utterance.pitch = 1.08;
  utterance.volume = 1;
  const voice = pickThaiVoice();
  if (voice) utterance.voice = voice;
  speaking = true;
  utterance.onend = () => {
    speaking = false;
    speakNext();
  };
  utterance.onerror = () => {
    speaking = false;
    speakNext();
  };
  window.speechSynthesis.speak(utterance);
}

export function isVoiceSupported() {
  return hasSpeech;
}

export function setVoiceEnabled(value: boolean) {
  enabled = value;
  if (!value && hasSpeech) {
    window.speechSynthesis.cancel();
    pending = "";
    speaking = false;
  } else {
    speakNext();
  }
}

export function isVoiceEnabled() {
  return enabled;
}

export function speakRealtime(text: string) {
  if (!hasSpeech || !enabled) return;
  pending += text;
  // Speak sentence-sized chunks while the model is still streaming.
  speakNext();
}

export function finishVoice() {
  if (!hasSpeech || !enabled) return;
  const tail = pending.trim();
  pending = "";
  if (!tail) return;
  const utterance = new SpeechSynthesisUtterance(tail);
  utterance.lang = "th-TH";
  utterance.rate = 1.02;
  utterance.pitch = 1.08;
  utterance.volume = 1;
  const voice = pickThaiVoice();
  if (voice) utterance.voice = voice;
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
