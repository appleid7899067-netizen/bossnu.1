/**
 * Multi-voice ("เสียงหลายคน") round-table support.
 *
 * Two jobs:
 * 1. Tell the model how to hand turns between speakers (`buildMultiVoicePrompt`).
 * 2. Turn the streamed answer back into speaker-tagged segments, incrementally,
 *    so each persona can be spoken with its own voice as the text arrives
 *    (`MultiVoiceParser`).
 *
 * Pure module: no DOM, no imports with side effects → unit-testable in node.
 */

import { VOICE_MODES, type SpeakerVoice, type VoiceMode } from "./voice.ts";

export type VoicePersona = {
  id: string;
  name: string;
  emoji: string;
  role: string;
  /** Voice profile used when this persona speaks. */
  mode: VoiceMode;
  color: string;
  personality: string;
};

export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: "sali",
    name: "สลี่",
    emoji: "💜",
    role: "ผู้ช่วยหลัก",
    mode: "warm",
    color: "#a855f7",
    personality: "อ่อนโยน เป็นกันเอง สรุปให้เข้าใจง่าย และใส่ใจความรู้สึกผู้ฟัง",
  },
  {
    id: "boss",
    name: "บอส",
    emoji: "🌙",
    role: "สายเทคนิค",
    mode: "deep",
    color: "#38bdf8",
    personality: "หนักแน่น ตรงประเด็น พูดเรื่องโค้ด ระบบ และการตัดสินใจเชิงเทคนิค",
  },
  {
    id: "mini",
    name: "มินิ",
    emoji: "✨",
    role: "สายสดใส",
    mode: "cute",
    color: "#f472b6",
    personality: "ร่าเริง ชวนคุย ตั้งคำถามสนุกๆ และคอยกระตุ้นบรรยากาศ",
  },
  {
    id: "coach",
    name: "โค้ชโปร",
    emoji: "🎙️",
    role: "สายสรุป",
    mode: "professional",
    color: "#34d399",
    personality: "สรุปเป็นขั้นตอน ชัดเจน บอกสิ่งที่ต้องทำต่อแบบมืออาชีพ",
  },
  {
    id: "teacher",
    name: "ครูไอซ์",
    emoji: "📖",
    role: "สายอธิบาย",
    mode: "story",
    color: "#fbbf24",
    personality: "อธิบายเรื่องยากให้เป็นเรื่องง่าย เล่ามีจังหวะ และยกตัวอย่างใกล้ตัว",
  },
];

export const MAX_CAST_SIZE = 4;

export type VoiceCastConfig = {
  /** Round-table mode on/off. Off = one voice (สลี่). */
  enabled: boolean;
  participants: string[];
  /** Per-persona voice override (persona id → voice profile). */
  modes: Partial<Record<string, VoiceMode>>;
  /** Alternate speakers sentence-by-sentence when the model sends no tags. */
  roundRobin: boolean;
  /** Let the user interrupt Sali while she is speaking. */
  bargeIn: boolean;
  /** Restart the microphone automatically when the browser drops it. */
  autoRestart: boolean;
};

export const DEFAULT_VOICE_CAST: VoiceCastConfig = {
  enabled: false,
  participants: ["sali"],
  modes: {},
  roundRobin: true,
  bargeIn: true,
  autoRestart: true,
};

const CAST_KEY = "bossnu-voice-cast";
const castListeners = new Set<(config: VoiceCastConfig) => void>();
let cast: VoiceCastConfig = { ...DEFAULT_VOICE_CAST };

function sanitize(next: Partial<VoiceCastConfig>): VoiceCastConfig {
  const merged = { ...cast, ...next, modes: next.modes ? { ...next.modes } : { ...cast.modes } };
  const participants = [...new Set(merged.participants.filter((id) => personaById(id)))].slice(0, MAX_CAST_SIZE);
  const knownModes = new Set(VOICE_MODES.map((mode) => mode.id));
  const modes: Partial<Record<string, VoiceMode>> = {};
  for (const [id, mode] of Object.entries(merged.modes ?? {})) {
    if (personaById(id) && mode && knownModes.has(mode)) modes[id] = mode;
  }
  return {
    ...merged,
    modes,
    participants: participants.length ? participants : ["sali"],
    enabled: merged.enabled && participants.length > 0,
  };
}

function loadCast() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(CAST_KEY);
    if (raw) cast = sanitize(JSON.parse(raw) as Partial<VoiceCastConfig>);
  } catch {
    cast = { ...DEFAULT_VOICE_CAST };
  }
}

function saveCast() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CAST_KEY, JSON.stringify(cast));
  } catch {
    /* ignore */
  }
}

loadCast();

export function personaById(id: string): VoicePersona | undefined {
  const wanted = id.trim().toLowerCase();
  return VOICE_PERSONAS.find((persona) => persona.id === wanted || persona.name === id.trim());
}

export function getVoiceCast(): VoiceCastConfig {
  return { ...cast, participants: [...cast.participants], modes: { ...cast.modes } };
}

export function updateVoiceCast(patch: Partial<VoiceCastConfig>): VoiceCastConfig {
  cast = sanitize(patch);
  saveCast();
  for (const listener of [...castListeners]) {
    try {
      listener(getVoiceCast());
    } catch {
      /* ignore */
    }
  }
  return getVoiceCast();
}

export function toggleCastParticipant(id: string): VoiceCastConfig {
  if (!personaById(id)) return getVoiceCast();
  const has = cast.participants.includes(id);
  const participants = has ? cast.participants.filter((item) => item !== id) : [...cast.participants, id];
  return updateVoiceCast({ participants: participants.length ? participants : ["sali"] });
}

export function subscribeVoiceCast(listener: (config: VoiceCastConfig) => void) {
  castListeners.add(listener);
  listener(getVoiceCast());
  return () => {
    castListeners.delete(listener);
  };
}

export function activePersonas(config: VoiceCastConfig = getVoiceCast()): VoicePersona[] {
  const picked = (config.participants.map((id) => personaById(id)).filter(Boolean) as VoicePersona[]).map((persona) => {
    const mode = config.modes?.[persona.id];
    return mode && mode !== persona.mode ? { ...persona, mode } : persona;
  });
  return picked.length ? picked : [VOICE_PERSONAS[0]];
}

/** Assign a different voice profile to one persona. */
export function setPersonaVoice(id: string, mode: VoiceMode): VoiceCastConfig {
  if (!personaById(id)) return getVoiceCast();
  return updateVoiceCast({ modes: { ...cast.modes, [id]: mode } });
}

/** Bridge a persona into the voice engine. */
export function toSpeakerVoice(persona: VoicePersona): SpeakerVoice {
  return { id: persona.id, name: persona.name, mode: persona.mode };
}

export function castLabel(config: VoiceCastConfig = getVoiceCast()): string {
  const personas = activePersonas(config);
  if (!config.enabled || personas.length <= 1) return personas[0]?.name ?? "สลี่";
  return personas.map((persona) => persona.name).join(" · ");
}

export function buildMultiVoicePrompt(personas: VoicePersona[] = activePersonas()): string {
  if (personas.length <= 1) {
    return `Voice call mode: the answer is spoken aloud by ${personas[0]?.name ?? "สลี่"}. Reply in Thai, spoken style, 1-3 short sentences. No markdown, no code blocks, no bullet symbols, no emoji.`;
  }
  const roster = personas
    .map((persona) => `- who="${persona.id}" → ${persona.name} (${persona.role}): ${persona.personality}`)
    .join("\n");
  return [
    "MULTI-VOICE ROUND TABLE: this answer is spoken aloud by several people at once.",
    "Speakers you may use:",
    roster,
    "Hard output format — every spoken turn must be wrapped in exactly one tag:",
    `<say who="${personas[0].id}">ข้อความภาษาไทยของturnนั้น</say>`,
    "Rules:",
    "- Answer in Thai, spoken style, 3-6 turns total, each turn 1-2 short sentences.",
    "- Use only the who values listed above; never invent a speaker.",
    "- No markdown, no code blocks, no bullet symbols, no emoji, no stage directions in brackets.",
    "- Each speaker stays in character and adds something new (no repeating the same line).",
    "- The final turn must give the user the real answer or the next concrete step.",
    "- Output only the tags, one per line, with nothing outside them.",
  ].join("\n");
}

export type VoiceSegment = { speakerId: string; text: string };

/** Split spoken text into sentence-ish pieces (Thai rarely uses full stops). */
export function splitSpokenSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;。！？\n])\s*/u)
    .map((piece) => piece.trim())
    .filter(Boolean);
}

const PLAIN_FLUSH_LEN = 200;

/** Complete sentences plus the unfinished tail. */
function splitComplete(text: string): { emitted: string[]; rest: string } {
  const enders = [...text.matchAll(/[.!?;。！？\n]+/g)];
  if (enders.length) {
    const last = enders[enders.length - 1];
    const cut = (last.index ?? 0) + last[0].length;
    return { emitted: splitSpokenSentences(text.slice(0, cut)), rest: text.slice(cut) };
  }
  if (text.length >= PLAIN_FLUSH_LEN) {
    const head = text.slice(0, PLAIN_FLUSH_LEN);
    const space = head.lastIndexOf(" ");
    const cut = space >= 60 ? space : PLAIN_FLUSH_LEN;
    return { emitted: [text.slice(0, cut).trim()].filter(Boolean), rest: text.slice(cut) };
  }
  return { emitted: [], rest: text };
}

const OPEN_TAG = /<\s*say\s+who\s*=\s*["']?\s*([\p{L}\p{N}_\- ]{1,40}?)\s*["']?\s*>/iu;
const CLOSE_TAG = /<\/\s*say\s*>/i;
/** An incomplete `<say …` tail (including a bare `<`) must never be spoken. */
const PARTIAL_TAG = /<(?:\s*(?:s(?:a(?:y(?:\s*[^>]*)?)?)?)?)?$/i;
/** `[ชื่อ] …` or `ชื่อ: …` at a line start, only when it names a participant. */
const LINE_MARKER = /(^|\n)[ \t]*(?:\[([^\]\n]{1,28})\]|([\p{L}\p{N}_\- ]{1,24})[:：])[ \t]*/gu;

/**
 * Streaming parser: text in, speaker-tagged segments out.
 * Accepts `<say who="id">…</say>`, `[ชื่อ] …` / `id: …` line markers, and falls
 * back to round-robin sentence splitting when the model sends plain prose.
 */
export class MultiVoiceParser {
  private buffer = "";
  private plain = "";
  private tagSpeaker: string | null = null;
  private turn = 0;
  private readonly participants: string[];
  private readonly roundRobin: boolean;
  private readonly fallback: string;

  constructor(opts?: { participants?: string[]; roundRobin?: boolean }) {
    const requested = (opts?.participants ?? []).filter((id) => personaById(id));
    this.participants = requested.length ? requested : ["sali"];
    this.roundRobin = opts?.roundRobin ?? this.participants.length > 1;
    this.fallback = this.participants[0];
  }

  push(chunk: string): VoiceSegment[] {
    if (!chunk) return [];
    this.buffer += chunk;
    return this.drain(false);
  }

  finish(): VoiceSegment[] {
    const out = this.drain(true);
    if (this.plain.trim()) out.push({ speakerId: this.nextSpeaker(), text: this.plain.trim() });
    this.plain = "";
    this.buffer = "";
    this.tagSpeaker = null;
    return out.filter((segment) => segment.text.trim());
  }

  private resolve(token: string): string {
    const wanted = token.trim().toLowerCase();
    const match = this.participants.find((id) => id === wanted);
    if (match) return match;
    const byName = this.participants.find((id) => personaById(id)?.name === token.trim());
    return byName ?? this.fallback;
  }

  private nextSpeaker(): string {
    if (this.participants.length <= 1) return this.fallback;
    const id = this.participants[this.turn % this.participants.length];
    this.turn += 1;
    return id;
  }

  private addPlain(text: string, out: VoiceSegment[], force: boolean, speaker?: string) {
    if (text) this.plain += text;
    if (!this.plain.trim()) {
      this.plain = "";
      return;
    }
    if (speaker) {
      out.push({ speakerId: speaker, text: this.plain.trim() });
      this.plain = "";
      this.turn = Math.max(this.turn, this.participants.indexOf(speaker) + 1);
      return;
    }
    if (this.participants.length <= 1 || !this.roundRobin) {
      out.push({ speakerId: this.fallback, text: this.plain });
      this.plain = "";
      return;
    }
    const { emitted, rest } = splitComplete(this.plain);
    for (const piece of emitted) out.push({ speakerId: this.nextSpeaker(), text: piece });
    if (force && rest.trim()) out.push({ speakerId: this.nextSpeaker(), text: rest.trim() });
    this.plain = force ? "" : rest;
  }

  private findMarker(text: string): { index: number; speaker: string; length: number } | null {
    LINE_MARKER.lastIndex = 0;
    for (const match of text.matchAll(LINE_MARKER)) {
      const token = (match[2] ?? match[3] ?? "").trim();
      const persona = personaById(token);
      if (persona && this.participants.includes(persona.id)) {
        const lead = match[1]?.length ?? 0;
        return { index: (match.index ?? 0) + lead, speaker: persona.id, length: match[0].length - lead };
      }
    }
    return null;
  }

  private drain(final: boolean): VoiceSegment[] {
    const out: VoiceSegment[] = [];
    for (let guard = 0; guard < 500; guard++) {
      if (this.tagSpeaker) {
        const close = this.buffer.match(CLOSE_TAG);
        if (close && close.index !== undefined) {
          const text = this.buffer.slice(0, close.index);
          this.buffer = this.buffer.slice(close.index + close[0].length);
          if (text.trim()) out.push({ speakerId: this.tagSpeaker, text: text.trim() });
          this.turn = Math.max(this.turn, this.participants.indexOf(this.tagSpeaker) + 1);
          this.tagSpeaker = null;
          continue;
        }
        if (final) {
          if (this.buffer.trim()) out.push({ speakerId: this.tagSpeaker, text: this.buffer.trim() });
          this.buffer = "";
          this.tagSpeaker = null;
        }
        break;
      }

      const open = this.buffer.match(OPEN_TAG);
      if (open && open.index !== undefined) {
        if (open.index > 0) {
          this.addPlain(this.buffer.slice(0, open.index), out, false);
          this.buffer = this.buffer.slice(open.index);
          continue;
        }
        this.addPlain("", out, true);
        this.tagSpeaker = this.resolve(open[1]);
        this.buffer = this.buffer.slice(open[0].length);
        continue;
      }

      const marker = this.findMarker(this.buffer);
      if (marker) {
        this.addPlain(this.buffer.slice(0, marker.index), out, true);
        const after = this.buffer.slice(marker.index + marker.length);
        const lineEnd = after.search(/[\r\n]/);
        const line = lineEnd >= 0 ? after.slice(0, lineEnd) : after;
        this.buffer = lineEnd >= 0 ? after.slice(lineEnd) : "";
        this.addPlain(line, out, true, marker.speaker);
        continue;
      }

      const partial = this.buffer.match(PARTIAL_TAG);
      if (partial && partial.index !== undefined && !final) {
        this.addPlain(this.buffer.slice(0, partial.index), out, false);
        this.buffer = this.buffer.slice(partial.index);
        break;
      }

      this.addPlain(this.buffer, out, final);
      this.buffer = "";
      break;
    }
    return out.filter((segment) => segment.text.trim());
  }
}
