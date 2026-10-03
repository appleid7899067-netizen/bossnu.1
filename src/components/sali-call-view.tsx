import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { streamChat } from "@/lib/ai/stream";
import { finishVoice, speakNow, speakRealtime, stopVoice } from "@/lib/ai/voice";
import type { ChatMessage } from "@/lib/types";

type CallMessage = { id: string; text: string; role: "user" | "assistant" };

export function SaliCallView({ history, onClose, onSaveMessage }: {
  history: ChatMessage[];
  onClose: () => void;
  onSaveMessage?: (role: "user" | "assistant", content: string) => void;
}) {
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState("กดโทรเพื่อเริ่มคุยกับสลี่");
  const [seconds, setSeconds] = useState(0);
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const recognitionRef = useRef<any>(null);
  const activeRef = useRef(false);
  const processingRef = useRef(false);
  const recognitionTimerRef = useRef<number | null>(null);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  useEffect(() => () => {
    activeRef.current = false;
    try { recognitionRef.current?.stop(); } catch { /* Speech recognition may already be stopped or unavailable. */ }
    if (recognitionTimerRef.current) window.clearTimeout(recognitionTimerRef.current);
    stopVoice();
  }, []);

  function addMessage(role: "user" | "assistant", text: string) {
    const clean = text.trim();
    if (!clean) return;
    setMessages((items) => [...items, { id: crypto.randomUUID(), role, text: clean }]);
    onSaveMessage?.(role, clean);
  }

  function startRecognition() {
    if (!activeRef.current || muted) return;
    const speechWindow = window as any;
    const SR = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SR) { setStatus("เบราว์เซอร์นี้ไม่รองรับการฟังเสียงภาษาไทย"); return; }
    const rec = new SR();
    rec.lang = "th-TH";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onresult = (event: any) => {
      const finalText = Array.from(event.results as any[]).slice(event.resultIndex)
        .map((result: any) => result[0]?.transcript ?? "").join(" ").trim();
      if (window.speechSynthesis?.speaking || processingRef.current) return;
      if (finalText) void handleUserSpeech(finalText);
    };
    rec.onerror = () => {
      setListening(false);
      if (activeRef.current && !muted && !processingRef.current) recognitionTimerRef.current = window.setTimeout(startRecognition, 700);
    };
    rec.onend = () => {
      setListening(false);
      if (activeRef.current && !muted && !processingRef.current) recognitionTimerRef.current = window.setTimeout(startRecognition, 700);
    };
    recognitionRef.current = rec;
    try { rec.start(); } catch { /* Speech recognition may already be stopped or unavailable. */ }
  }

  async function handleUserSpeech(text: string) {
    if (!activeRef.current || processingRef.current) return;
    processingRef.current = true;
    try { recognitionRef.current?.stop(); } catch { /* Speech recognition may already be stopped or unavailable. */ }
    addMessage("user", text);
    setStatus("สลี่กำลังคิดคำตอบ…");
    setSpeaking(true);
    let reply = "";
    try {
      const prior = [
        ...history.filter((m) => m.content).map((m) => ({ role: m.role, content: m.content })),
        ...messages.map((m) => ({ role: m.role, content: m.text })),
        { role: "user" as const, content: text },
      ];
      await streamChat({
        tools: false,
        messages: prior,
        mode: "instant",
        onEvent: (event) => {
          if (event.type === "text") {
            reply += event.text;
            // Keep streaming voice for responsive playback.
            speakRealtime(event.text);
          }
          if (event.type === "done") finishVoice();
        },
      });
      if (reply.trim()) {
        addMessage("assistant", reply);
        // Mobile speech engines can drop tiny streamed chunks. Flush the
        // complete final answer as a reliable fallback if synthesis is idle.
        await speakNow(reply);
      }
      setStatus("สลี่ฟังอยู่ค่ะ พูดได้เลย");
    } catch {
      stopVoice();
      setStatus("เชื่อมต่อ AI ไม่สำเร็จ ลองพูดใหม่อีกครั้ง");
    } finally {
      setSpeaking(false);
      processingRef.current = false;
      if (activeRef.current && !muted) startRecognition();
    }
  }

  async function toggleCall() {
    if (active) {
      setActive(false); activeRef.current = false;
      try { recognitionRef.current?.stop(); } catch { /* Speech recognition may already be stopped or unavailable. */ }
      stopVoice(); setListening(false); setSpeaking(false); setStatus("จบการสนทนาแล้ว");
      return;
    }
    setActive(true); activeRef.current = true; setSeconds(0); setStatus("กำลังเชื่อมต่อ…"); stopVoice();
    try { recognitionRef.current?.stop(); } catch { /* Speech recognition may already be stopped or unavailable. */ }
    const greeting = "สวัสดีค่ะ สลี่พร้อมคุยแล้วนะคะ พูดกับสลี่ได้เลย";
    addMessage("assistant", greeting);
    await new Promise((resolve) => setTimeout(resolve, 250));
    setSpeaking(true);
    await speakNow(greeting);
    setSpeaking(false); setStatus("สลี่ฟังอยู่ค่ะ พูดได้เลย"); startRecognition();
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[120] flex flex-col overflow-hidden bg-bg text-fg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,color-mix(in_srgb,var(--color-primary)_12%,transparent),transparent_60%)]" />
      

      <header className="m3-topbar relative shrink-0 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-muted hover:bg-[var(--state-hover)] hover:text-fg" aria-label="ปิดโหมดโทร">×</Button>
        <div className="text-center">
          <div className="m3-label-lg tracking-[.18em]">SALI • VOICE MODE</div>
          <div className="m3-label-sm mt-0.5 tracking-[.2em] text-primary">{active ? "VOICE LINK ACTIVE" : "VOICE CONSOLE STANDBY"}</div>
        </div>
        <div className="w-9 text-right font-mono text-xs text-muted">{mm}:{ss}</div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-8">
        <div className="mb-8 text-center">
          <div className="m3-title-lg">สลี่ ออลา</div>
          <div className="mt-1 text-xs text-subtle">{status}</div>
        </div>

        <div className="relative grid size-[min(62vw,290px)] place-items-center">
          <div className={"absolute inset-0 rounded-full border border-primary/15 " + (active ? "animate-[pulse_2.4s_ease-in-out_infinite]" : "")} />
          <div className={"absolute inset-[9%] rounded-full border border-primary/20 " + (active ? "animate-[pulse_2s_ease-in-out_infinite]" : "")} />
          <div className={"absolute inset-[18%] rounded-full border border-primary/25 " + (active ? "animate-[pulse_1.6s_ease-in-out_infinite]" : "")} />
          <div className={"absolute inset-[29%] rounded-full bg-primary/20 blur-2xl transition-all duration-500 " + (speaking ? "scale-125 opacity-100" : listening ? "scale-110 opacity-80" : "scale-100 opacity-50")} />
          <div className={"relative grid size-[38%] place-items-center rounded-full bg-primary-container text-on-primary-container shadow-[var(--shadow-e2)] transition-transform duration-300 " + (speaking ? "scale-110" : listening ? "scale-105" : "scale-100")}>
            <div className="m3-headline-md">S</div>
          </div>
          <div className={"absolute inset-[34%] rounded-full border border-primary/30 " + (speaking ? "animate-ping" : "")} />
        </div>

        <div className="mt-8 flex min-h-10 items-center justify-center gap-1.5" aria-label="สถานะเสียง">
          {Array.from({ length: 20 }).map((_, index) => (
            <span key={index} className={"w-[2px] rounded-full bg-primary transition-all duration-200 " + (active ? "h-3" : "h-1.5") + " " + (speaking ? "animate-pulse" : listening ? "h-5" : "")} style={{ animationDelay: index * 35 + "ms" }} />
          ))}
        </div>

        <div className="mt-5 text-center text-[11px] tracking-[.18em] text-subtle">
          {listening ? "LISTENING" : speaking ? "SALI SPEAKING" : active ? "READY" : "PRESS CALL TO START"}
        </div>

        {messages.length > 0 && (
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 mx-auto max-w-xl text-center">
            <div className="mx-auto max-w-[90%] truncate text-[11px] text-subtle">{messages[messages.length - 1]?.text}</div>
          </div>
        )}
      </main>

      <footer className="relative shrink-0 border-t border-border bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
        <div className="mx-auto flex max-w-sm items-center justify-center gap-6">
          <button type="button" onClick={() => setMuted((value) => !value)} disabled={!active} className="grid size-12 place-items-center rounded-full bg-elevated text-muted transition hover:bg-hover hover:text-fg disabled:opacity-30" aria-label="ปิดหรือเปิดไมค์">
            {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </button>
          <button type="button" onClick={() => void toggleCall()} className={"grid size-[72px] place-items-center rounded-full shadow-[var(--shadow-e2)] transition-transform active:scale-95 " + (active ? "bg-danger-container text-on-danger-container hover:brightness-110" : "bg-primary-container text-on-primary-container hover:brightness-110")} aria-label={active ? "วางสาย" : "โทรหาสลี่"}>
            {active ? <PhoneOff className="size-6" /> : <Phone className="size-6" />}
          </button>
          <button type="button" onClick={() => { if (speaking) { stopVoice(); setSpeaking(false); setStatus("สลี่ฟังอยู่ค่ะ พูดได้เลย"); } }} disabled={!active || !speaking} className="grid size-12 place-items-center rounded-full bg-elevated text-muted transition hover:bg-hover hover:text-fg disabled:opacity-30" aria-label="หยุดเสียงสลี่">
            <Volume2 className="size-5" />
          </button>
        </div>
        <div className="mt-3 text-center text-[10px] tracking-wider text-subtle">PRIVATE VOICE CONSOLE • SALI</div>
      </footer>
    </div>
  );
}
