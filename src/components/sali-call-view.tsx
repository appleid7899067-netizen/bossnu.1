import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Users, Volume2, VolumeX, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { streamChat } from "@/lib/ai/stream";
import { classifyIntent, intentSummary, type IntentPlan } from "@/lib/ai/intent";
import {
  finishVoice,
  getVoiceState,
  isVoiceSpeaking,
  speakNow,
  speakRealtime,
  stopVoice,
  subscribeVoiceState,
  type SpeakerVoice,
  type VoiceState,
} from "@/lib/ai/voice";
import {
  activePersonas,
  buildMultiVoicePrompt,
  castLabel,
  getVoiceCast,
  MultiVoiceParser,
  personaById,
  subscribeVoiceCast,
  toSpeakerVoice,
  toggleCastParticipant,
  updateVoiceCast,
  VOICE_PERSONAS,
  type VoiceCastConfig,
  type VoicePersona,
} from "@/lib/ai/multi-voice";
import { SpeechListener, type ListenerState, type RecognitionLike } from "@/lib/ai/speech-listener";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

type CallMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  speaker?: { id: string; name: string; emoji: string; color: string };
};

const MAX_STREAM_ATTEMPTS = 3;
const RETRY_DELAYS = [500, 1400];
const HISTORY_LIMIT = 14;

const LISTENER_STATUS: Record<ListenerState, string> = {
  idle: "พร้อมรับเสียง",
  starting: "กำลังเปิดไมค์…",
  listening: "สลี่ฟังอยู่ค่ะ พูดได้เลย",
  restarting: "ไมค์หลุด กำลังเชื่อมต่อใหม่…",
  paused: "พักไมค์ชั่วขณะ",
  blocked: "ใช้งานไมค์ไม่ได้",
  stopped: "จบการสนทนาแล้ว",
};

function recognitionFactory(): RecognitionLike | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  const Ctor = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onCancel);
      resolve();
    }, ms);
    function onCancel() {
      clearTimeout(timer);
      resolve();
    }
    signal?.addEventListener("abort", onCancel, { once: true });
  });
}

export function SaliCallView({
  history,
  onClose,
  onSaveMessage,
  onHandoff,
}: {
  history: ChatMessage[];
  onClose: () => void;
  onSaveMessage?: (role: "user" | "assistant", content: string) => void;
  /** Intent needs real code work → run it in the chat agent (Fix → Run → Verify). */
  onHandoff?: (text: string) => void;
}) {
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [listenerState, setListenerState] = useState<ListenerState>("idle");
  const [listenerDetail, setListenerDetail] = useState("");
  const [interim, setInterim] = useState("");
  const [status, setStatus] = useState("กดโทรเพื่อเริ่มคุยกับสลี่");
  const [seconds, setSeconds] = useState(0);
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [intent, setIntent] = useState<IntentPlan | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>(() => getVoiceState());
  const [cast, setCast] = useState<VoiceCastConfig>(() => getVoiceCast());
  const [castOpen, setCastOpen] = useState(false);
  const [micSupported, setMicSupported] = useState(true);

  const activeRef = useRef(false);
  const mutedRef = useRef(false);
  const busyRef = useRef(false);
  const castRef = useRef(cast);
  const messagesRef = useRef<CallMessage[]>([]);
  const liveBubbleRef = useRef<{ id: string; speakerId: string } | null>(null);
  const listenerRef = useRef<SpeechListener | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef(history);

  castRef.current = cast;
  historyRef.current = history;
  messagesRef.current = messages;

  const personas = useMemo(() => activePersonas(cast), [cast]);
  const primary = personas[0] ?? VOICE_PERSONAS[0];
  const primaryRef = useRef(primary);
  primaryRef.current = primary;

  useEffect(() => subscribeVoiceState(setVoiceState), []);
  useEffect(() => subscribeVoiceCast(setCast), []);

  useEffect(() => {
    setMicSupported(recognitionFactory() !== null);
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, interim, thinking]);

  const speakerFor = useCallback((id: string): SpeakerVoice => toSpeakerVoice(personaById(id) ?? primaryRef.current), []);

  const addMessage = useCallback(
    (message: Omit<CallMessage, "id">) => {
      const text = message.text.trim();
      if (!text) return null;
      const id = crypto.randomUUID();
      setMessages((items) => [...items.slice(-59), { ...message, text, id }]);
      return id;
    },
    [],
  );

  /** Stream into the current speaker's bubble (or open a new one). */
  const appendSpeakerLine = useCallback((speaker: VoicePersona, text: string) => {
    const chunk = text.trim();
    if (!chunk) return;
    const live = liveBubbleRef.current;
    setMessages((items) => {
      if (live && live.speakerId === speaker.id) {
        const index = items.findIndex((item) => item.id === live.id);
        if (index >= 0) {
          const next = [...items];
          next[index] = { ...next[index], text: `${next[index].text} ${chunk}`.trim() };
          return next;
        }
      }
      const id = crypto.randomUUID();
      liveBubbleRef.current = { id, speakerId: speaker.id };
      return [
        ...items.slice(-59),
        {
          id,
          role: "assistant" as const,
          text: chunk,
          speaker: { id: speaker.id, name: speaker.name, emoji: speaker.emoji, color: speaker.color },
        },
      ];
    });
  }, []);

  const micPauseForSpeech = useCallback(() => {
    const listener = listenerRef.current;
    if (!listener || !activeRef.current) return;
    if (voiceState.speaking || thinking) {
      if (!castRef.current.bargeIn) listener.pause();
    } else if (listener.state === "paused" && !mutedRef.current) {
      listener.resume();
    }
  }, [thinking, voiceState.speaking]);

  useEffect(micPauseForSpeech, [micPauseForSpeech]);

  const stopCall = useCallback(() => {
    activeRef.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
    listenerRef.current?.destroy();
    listenerRef.current = null;
    stopVoice();
    setActive(false);
    setMuted(false);
    mutedRef.current = false;
    setThinking(false);
    setInterim("");
    setListenerState("stopped");
    setStatus("จบการสนทนาแล้ว");
  }, []);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      abortRef.current?.abort();
      listenerRef.current?.destroy();
      listenerRef.current = null;
      stopVoice();
    };
  }, []);

  /** One conversational turn: stream the answer, speak it, keep the bubbles. */
  const runTurn = useCallback(
    async (text: string, plan: IntentPlan) => {
      const castConfig = castRef.current;
      const speakers = activePersonas(castConfig);
      const multi = castConfig.enabled && speakers.length > 1;
      const parser = new MultiVoiceParser({
        participants: speakers.map((persona) => persona.id),
        roundRobin: castConfig.roundRobin,
      });
      // The spoken line is already in the bubble list — don't send it twice.
      const callLog = messagesRef.current
        .filter((message) => !(message.role === "user" && message.text === text))
        .slice(-HISTORY_LIMIT)
        .map((message) => ({ role: message.role, content: message.text }));
      const prior = [
        ...historyRef.current.filter((message) => message.content).slice(-HISTORY_LIMIT).map((message) => ({
          role: message.role,
          content: message.content,
        })),
        ...callLog,
        { role: "user" as const, content: text },
      ];

      let lastError = "";
      for (let attempt = 0; attempt < MAX_STREAM_ATTEMPTS; attempt++) {
        if (!activeRef.current) return "";
        const ac = new AbortController();
        abortRef.current = ac;
        let answer = "";
        let failed = false;
        try {
          await streamChat({
            tools: false,
            messages: prior,
            mode: "instant",
            signal: ac.signal,
            directives: [
              buildMultiVoicePrompt(speakers),
              plan.directive,
              multi
                ? ""
                : "Voice call mode: keep it short and spoken. One or two sentences per answer, no lists, no markdown.",
            ].filter(Boolean),
            onEvent: (event) => {
              if (ac.signal.aborted) return;
              if (event.type === "error") {
                failed = true;
                lastError = event.error;
                return;
              }
              if (event.type !== "text" || !event.text) return;
              if (multi) {
                for (const segment of parser.push(event.text)) {
                  const persona = personaById(segment.speakerId) ?? speakers[0];
                  answer += (answer ? " " : "") + segment.text;
                  appendSpeakerLine(persona, segment.text);
                  speakRealtime(segment.text, { speaker: toSpeakerVoice(persona) });
                }
                return;
              }
              answer += event.text;
              const solo = speakers[0] ?? primaryRef.current;
              appendSpeakerLine(solo, event.text);
              speakRealtime(event.text, { speaker: toSpeakerVoice(solo) });
            },
          });
          if (!ac.signal.aborted) {
            for (const segment of parser.finish()) {
              const persona = personaById(segment.speakerId) ?? speakers[0];
              answer += (answer ? " " : "") + segment.text;
              appendSpeakerLine(persona, segment.text);
              speakRealtime(segment.text, { speaker: toSpeakerVoice(persona) });
            }
          }
          finishVoice();
        } catch (error) {
          failed = true;
          lastError = error instanceof Error ? error.message : String(error);
        }

        const produced = answer.trim().length > 0;
        if (!failed && produced) return answer.trim();
        if (!activeRef.current || ac.signal.aborted) return answer.trim();
        if (attempt < MAX_STREAM_ATTEMPTS - 1) {
          stopVoice();
          setStatus(`สัญญาณ AI หลุด กำลังลองใหม่ (${attempt + 2}/${MAX_STREAM_ATTEMPTS})…`);
          await sleep(RETRY_DELAYS[attempt] ?? 1200, ac.signal);
          liveBubbleRef.current = null;
          continue;
        }
        setStatus(lastError ? `เชื่อมต่อ AI ไม่สำเร็จ: ${lastError.slice(0, 80)}` : "เชื่อมต่อ AI ไม่สำเร็จ ลองพูดใหม่อีกครั้ง");
      }
      return "";
    },
    [appendSpeakerLine],
  );

  const handleUserSpeech = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!activeRef.current || busyRef.current || !clean) return;
      busyRef.current = true;
      setThinking(true);
      setInterim("");
      setIntent(null);
      stopVoice();
      liveBubbleRef.current = null;
      addMessage({ role: "user", text: clean });
      onSaveMessage?.("user", clean);

      const plan = classifyIntent(clean, { voiceCall: true });
      setIntent(plan);
      setStatus(`🧭 ${intentSummary(plan)}`);

      try {
        if (plan.handoff && onHandoff) {
          const ack =
            "รับทราบค่ะ งานนี้ต้องรันโค้ดจริง สลี่ส่งเข้าไปทำในแชตให้นะคะ เดี๋ยวแก้แล้วรันจนผ่าน ผลจะขึ้นในหน้าแชตค่ะ";
          const persona = primaryRef.current;
          addMessage({
            role: "assistant",
            text: ack,
            speaker: { id: persona.id, name: persona.name, emoji: persona.emoji, color: persona.color },
          });
          onSaveMessage?.("assistant", ack);
          await speakNow(ack, { speaker: toSpeakerVoice(persona) });
          if (!activeRef.current) return;
          onHandoff(clean);
          setStatus("ส่งงานไปรันในแชตแล้ว • พูดเรื่องอื่นต่อได้เลย");
          return;
        }

        const answer = await runTurn(clean, plan);
        if (answer) onSaveMessage?.("assistant", answer.replace(/\s+/g, " ").trim());
        if (activeRef.current) setStatus(LISTENER_STATUS[listenerRef.current?.state ?? "listening"]);
      } catch {
        stopVoice();
        setStatus("เกิดข้อผิดพลาดระหว่างคิดคำตอบ ลองพูดใหม่อีกครั้ง");
      } finally {
        setThinking(false);
        busyRef.current = false;
        liveBubbleRef.current = null;
        const listener = listenerRef.current;
        if (activeRef.current && !mutedRef.current && listener && listener.state !== "blocked") {
          // With barge-in off the mic stays closed until playback ends; the
          // voice-state effect resumes it, so only retry when it is safe to listen.
          if (castRef.current.bargeIn || !isVoiceSpeaking()) listener.retry();
        }
      }
    },
    [addMessage, onHandoff, onSaveMessage, runTurn],
  );

  const startCall = useCallback(async () => {
    setActive(true);
    activeRef.current = true;
    setSeconds(0);
    setMessages([]);
    setIntent(null);
    setStatus("กำลังเชื่อมต่อ…");
    stopVoice();
    abortRef.current?.abort();

    const listener = new SpeechListener(
      { createRecognition: recognitionFactory },
      {
        lang: "th-TH",
        interim: true,
        watchdogMs: castRef.current.autoRestart ? 12_000 : 0,
        maxRestarts: 8,
        onFinal: (text) => void handleUserSpeech(text),
        onInterim: (text) => setInterim(text),
        onState: (state, detail) => {
          setListenerState(state);
          setListenerDetail(detail ?? "");
          if (!busyRef.current) setStatus(detail && state === "blocked" ? detail : LISTENER_STATUS[state]);
        },
        onError: (error) => {
          if (error.fatal) setStatus(error.message);
        },
      },
    );
    listenerRef.current = listener;

    const castConfig = castRef.current;
    const speakers = activePersonas(castConfig);
    const greetings =
      castConfig.enabled && speakers.length > 1
        ? speakers.map((persona, index) =>
            index === 0
              ? `${persona.name} ค่ะ โทรติดแล้ว วันนี้คุยกันหลายคนนะคะ พูดมาได้เลย`
              : `สวัสดีค่ะ ${persona.name} นะคะ พร้อมเสริมในเรื่อง${persona.role.replace("สาย", "")}ค่ะ`,
          )
        : ["สวัสดีค่ะ สลี่พร้อมคุยแล้วนะคะ พูดกับสลี่ได้เลย"];

    setStatus("สลี่กำลังพูด…");
    for (let index = 0; index < greetings.length; index++) {
      const persona = speakers[index] ?? speakers[0];
      addMessage({
        role: "assistant",
        text: greetings[index],
        speaker: { id: persona.id, name: persona.name, emoji: persona.emoji, color: persona.color },
      });
      if (!activeRef.current) break;
      await speakNow(greetings[index], { speaker: toSpeakerVoice(persona) });
    }

    if (!activeRef.current) return;
    setStatus(listener.supported ? LISTENER_STATUS.listening : "เบราว์เซอร์นี้ไม่รองรับการฟังเสียงภาษาไทย พิมพ์คุยในแชตแทนได้ค่ะ");
    if (listener.supported && !mutedRef.current) listener.start();
  }, [addMessage, handleUserSpeech]);

  async function toggleCall() {
    if (active) {
      stopCall();
      return;
    }
    await startCall();
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    const listener = listenerRef.current;
    if (!listener) return;
    if (next) listener.pause();
    else if (activeRef.current) listener.retry();
  }

  function toggleCastMember(id: string) {
    const next = toggleCastParticipant(id);
    setCast(next);
  }

  const castNames = castLabel(cast);
  const speaking = voiceState.speaking;
  const listening = listenerState === "listening";

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[#100d24] text-white">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10" aria-label="ปิดโหมดโทร">
          ×
        </Button>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex -space-x-2">
            {personas.slice(0, 4).map((persona) => (
              <div
                key={persona.id}
                className={cn(
                  "grid size-9 place-items-center rounded-full border-2 border-[#100d24] text-sm transition-transform",
                  speaking && voiceState.speaker === persona.name ? "scale-110" : "",
                )}
                style={{ background: `${persona.color}33` }}
                title={`${persona.name} • ${persona.role}`}
              >
                {persona.emoji}
              </div>
            ))}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{castNames}</div>
            <div className="truncate text-xs text-violet-200">
              {active ? (speaking ? `${voiceState.speaker ?? castNames} กำลังพูด` : listening ? "กำลังฟัง" : "เชื่อมต่อแล้ว") : "พร้อมโทร"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCastOpen((value) => !value)}
            className={cn(
              "grid size-9 place-items-center rounded-full transition-colors",
              castOpen ? "bg-violet-500" : "bg-white/10 hover:bg-white/20",
            )}
            aria-label="ตั้งค่าเสียงหลายคน"
          >
            <Users className="size-4" />
          </button>
          <div className="w-11 text-right font-mono text-xs text-violet-200">
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
          </div>
        </div>
      </header>

      {castOpen ? (
        <div className="shrink-0 border-b border-white/10 bg-white/5 px-4 py-3">
          <div className="mx-auto flex max-w-2xl flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">โหมดเสียงหลายคน</p>
                <p className="text-[11px] text-violet-200">เลือกได้สูงสุด 4 คน แต่ละคนใช้เสียงและบุคลิกของตัวเอง</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={cast.enabled}
                onClick={() => setCast(updateVoiceCast({ enabled: !cast.enabled }))}
                className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", cast.enabled ? "bg-violet-500" : "bg-white/20")}
                aria-label="เปิดโหมดหลายคน"
              >
                <span className={cn("absolute top-1 size-5 rounded-full bg-white transition-all", cast.enabled ? "left-6" : "left-1")} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {VOICE_PERSONAS.map((persona) => {
                const picked = cast.participants.includes(persona.id);
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => toggleCastMember(persona.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                      picked ? "border-transparent text-white" : "border-white/15 text-violet-200 hover:bg-white/10",
                    )}
                    style={picked ? { background: `${persona.color}55` } : undefined}
                  >
                    <span>{persona.emoji}</span>
                    <span className="font-medium">{persona.name}</span>
                    <span className="opacity-70">{persona.role}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] text-violet-200">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cast.roundRobin}
                  onChange={(event) => setCast(updateVoiceCast({ roundRobin: event.target.checked }))}
                  className="size-4 accent-violet-500"
                />
                สลับคนพูดอัตโนมัติ
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cast.bargeIn}
                  onChange={(event) => setCast(updateVoiceCast({ bargeIn: event.target.checked }))}
                  className="size-4 accent-violet-500"
                />
                พูดแทรกได้ (หยุดเสียงทันที)
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cast.autoRestart}
                  onChange={(event) => setCast(updateVoiceCast({ autoRestart: event.target.checked }))}
                  className="size-4 accent-violet-500"
                />
                ต่อไมค์ใหม่อัตโนมัติ
              </label>
              <button
                type="button"
                onClick={() => {
                  const speaker = speakerFor(primary.id);
                  void speakNow(`สวัสดีค่ะ ${primary.name} พร้อมคุยแล้วนะคะ`, { speaker });
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-medium text-white hover:bg-white/20"
              >
                <Wand2 className="size-3" /> ทดลองเสียง
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div ref={scrollerRef} className="flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-y-auto px-4 py-5">
          {messages.length === 0 ? (
            <div className="m-auto max-w-sm text-center text-violet-200/70">
              <div className="mx-auto mb-4 grid size-20 place-items-center rounded-full bg-violet-600/20 text-4xl">{primary.emoji}</div>
              <p>คุยกับ{castNames}แบบเสียงสดได้เลย</p>
              <p className="mt-1 text-xs">พูดภาษาไทย แล้วระบบจะฟัง คิด และตอบด้วยเสียง — ไมค์หลุดก็ต่อใหม่เอง</p>
              {!micSupported ? (
                <p className="mt-3 rounded-xl bg-amber-500/15 px-3 py-2 text-[11px] text-amber-200">
                  เบราว์เซอร์นี้ไม่รองรับการฟังเสียง ลอง Chrome/Edge หรือใช้พิมพ์ในแชตแทนได้ค่ะ
                </p>
              ) : null}
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                {message.role === "assistant" && message.speaker ? (
                  <div
                    className="mr-2 mt-1 grid size-8 shrink-0 place-items-center rounded-full text-sm"
                    style={{ background: `${message.speaker.color}33` }}
                    aria-hidden
                  >
                    {message.speaker.emoji}
                  </div>
                ) : null}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    message.role === "user" ? "rounded-br-sm bg-indigo-600" : "rounded-bl-sm bg-white/10",
                  )}
                >
                  {message.role === "assistant" && message.speaker ? (
                    <div className="mb-0.5 text-[10px] font-semibold" style={{ color: message.speaker.color }}>
                      {message.speaker.name}
                    </div>
                  ) : null}
                  {message.text}
                </div>
              </div>
            ))
          )}

          {thinking ? (
            <div className="flex items-center gap-2 text-xs text-violet-200">
              <span className="size-2 animate-ping rounded-full bg-violet-400" />
              กำลังคิดคำตอบ…
            </div>
          ) : null}
          {interim ? <div className="self-end max-w-[80%] rounded-2xl rounded-br-sm bg-indigo-600/40 px-4 py-2 text-sm italic text-white/80">{interim}</div> : null}
        </div>

        <div className="shrink-0 border-t border-white/10 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {intent ? (
            <p className="mx-auto mb-2 max-w-md truncate text-center text-[11px] text-violet-300/80">🧭 {intentSummary(intent)}</p>
          ) : null}
          <div className="mx-auto mb-4 flex max-w-md items-center justify-center gap-2 text-center text-sm text-violet-200">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                listenerState === "blocked" ? "bg-rose-400" : active ? "bg-emerald-400" : "bg-amber-400",
              )}
            />
            <span className="truncate">{status}</span>
          </div>
          <div className="mx-auto flex max-w-md items-center justify-center gap-5">
            <button
              type="button"
              onClick={toggleMute}
              disabled={!active}
              className={cn(
                "grid size-12 place-items-center rounded-full disabled:opacity-30",
                muted ? "bg-rose-500/80" : "bg-white/10",
              )}
              aria-label={muted ? "เปิดไมค์" : "ปิดไมค์"}
            >
              {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </button>
            <button
              type="button"
              onClick={() => void toggleCall()}
              className={cn(
                "grid size-20 place-items-center rounded-full shadow-lg transition-transform active:scale-95",
                active ? "bg-red-500" : "bg-violet-600",
              )}
              aria-label={active ? "วางสาย" : "โทรหาสลี่"}
            >
              {active ? <PhoneOff className="size-7" /> : <Phone className="size-7" />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (speaking || voiceState.queued > 0) stopVoice();
              }}
              disabled={!active}
              className="grid size-12 place-items-center rounded-full bg-white/10 disabled:opacity-30"
              aria-label="หยุดเสียง"
            >
              {speaking ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
          </div>
          <div className="mt-3 text-center text-[11px] text-white/40">
            {listenerState === "blocked"
              ? listenerDetail || "ไมค์ใช้งานไม่ได้ กดโทรใหม่หลังอนุญาตไมโครโฟน"
              : listening
                ? "🎤 กำลังฟัง"
                : speaking
                  ? `🔊 ${voiceState.speaker ?? castNames} กำลังพูด${voiceState.queued ? ` • ต่อคิว ${voiceState.queued}` : ""}`
                  : active
                    ? "พร้อมรับเสียง"
                    : "กดปุ่มโทรเพื่อเริ่ม"}
          </div>
        </div>
      </div>
    </div>
  );
}
