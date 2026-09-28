import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { streamChat } from "@/lib/ai/stream";
import { finishVoice, speakRealtime, stopVoice } from "@/lib/ai/voice";
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
    try { recognitionRef.current?.stop(); } catch {}
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
    try { rec.start(); } catch {}
  }

  async function handleUserSpeech(text: string) {
    if (!activeRef.current || processingRef.current) return;
    processingRef.current = true;
    try { recognitionRef.current?.stop(); } catch {}
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
          if (event.type === "text") { reply += event.text; speakRealtime(event.text); }
          if (event.type === "done") finishVoice();
        },
      });
      if (reply.trim()) addMessage("assistant", reply);
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
      try { recognitionRef.current?.stop(); } catch {}
      stopVoice(); setListening(false); setSpeaking(false); setStatus("จบการสนทนาแล้ว");
      return;
    }
    setActive(true); activeRef.current = true; setSeconds(0); setStatus("กำลังเชื่อมต่อ…"); stopVoice();
    try { recognitionRef.current?.stop(); } catch {}
    const greeting = "สวัสดีค่ะ สลี่พร้อมคุยแล้วนะคะ พูดกับสลี่ได้เลย";
    addMessage("assistant", greeting);
    await new Promise((resolve) => setTimeout(resolve, 250));
    setSpeaking(true);
    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(greeting);
      utterance.lang = "th-TH"; utterance.rate = 1; utterance.pitch = 1.3; utterance.volume = 1;
      utterance.onend = () => resolve(); utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
    setSpeaking(false); setStatus("สลี่ฟังอยู่ค่ะ พูดได้เลย"); startRecognition();
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[120] flex flex-col overflow-hidden bg-[#090714] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_43%,rgba(139,92,246,.22),transparent_28%),radial-gradient(circle_at_50%_65%,rgba(99,102,241,.12),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:42px_42px]" />

      <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-white/[0.07] px-4 sm:px-6">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 hover:bg-white/10 hover:text-white" aria-label="ปิดโหมดโทร">×</Button>
        <div className="text-center">
          <div className="text-sm font-semibold tracking-[0.18em] text-white/90">SALI • JARVIS MODE</div>
          <div className="mt-0.5 text-[10px] tracking-[0.2em] text-violet-300/60">{active ? "VOICE LINK ACTIVE" : "VOICE CONSOLE STANDBY"}</div>
        </div>
        <div className="w-9 text-right font-mono text-xs text-violet-200/70">{mm}:{ss}</div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-8">
        <div className="mb-8 text-center">
          <div className="text-lg font-medium tracking-wide">สลี่ ออลา</div>
          <div className="mt-1 text-xs text-white/40">{status}</div>
        </div>

        <div className="relative grid size-[min(62vw,290px)] place-items-center">
          <div className={"absolute inset-0 rounded-full border border-violet-400/10 " + (active ? "animate-[pulse_2.4s_ease-in-out_infinite]" : "")} />
          <div className={"absolute inset-[9%] rounded-full border border-violet-400/15 " + (active ? "animate-[pulse_2s_ease-in-out_infinite]" : "")} />
          <div className={"absolute inset-[18%] rounded-full border border-violet-400/20 " + (active ? "animate-[pulse_1.6s_ease-in-out_infinite]" : "")} />
          <div className={"absolute inset-[29%] rounded-full bg-violet-500/10 blur-2xl transition-all duration-500 " + (speaking ? "scale-125 opacity-100" : listening ? "scale-110 opacity-80" : "scale-100 opacity-50")} />
          <div className={"relative grid size-[38%] place-items-center rounded-full border border-violet-200/30 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,.55),rgba(168,85,247,.5)_24%,rgba(76,29,149,.82)_62%,rgba(9,7,20,.98))] shadow-[0_0_70px_rgba(139,92,246,.38)] transition-transform duration-300 " + (speaking ? "scale-110" : listening ? "scale-105" : "scale-100")}>
            <div className="text-2xl font-light text-white/90">S</div>
          </div>
          <div className={"absolute inset-[34%] rounded-full border border-white/10 " + (speaking ? "animate-ping" : "")} />
        </div>

        <div className="mt-8 flex min-h-10 items-center justify-center gap-1.5" aria-label="สถานะเสียง">
          {Array.from({ length: 20 }).map((_, index) => (
            <span key={index} className={"w-[2px] rounded-full bg-violet-300/60 transition-all duration-200 " + (active ? "h-3" : "h-1.5") + " " + (speaking ? "animate-pulse" : listening ? "h-5" : "")} style={{ animationDelay: index * 35 + "ms" }} />
          ))}
        </div>

        <div className="mt-5 text-center text-[11px] tracking-[0.18em] text-white/30">
          {listening ? "LISTENING" : speaking ? "SALI SPEAKING" : active ? "READY" : "PRESS CALL TO START"}
        </div>

        {messages.length > 0 && (
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 mx-auto max-w-xl text-center">
            <div className="mx-auto max-w-[90%] truncate text-[11px] text-white/20">{messages[messages.length - 1]?.text}</div>
          </div>
        )}
      </main>

      <footer className="relative shrink-0 border-t border-white/[0.07] bg-black/20 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-sm items-center justify-center gap-6">
          <button type="button" onClick={() => setMuted((value) => !value)} disabled={!active} className="grid size-12 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 transition hover:bg-white/10 disabled:opacity-30" aria-label="ปิดหรือเปิดไมค์">
            {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </button>
          <button type="button" onClick={() => void toggleCall()} className={"grid size-[72px] place-items-center rounded-full border border-white/10 shadow-[0_0_40px_rgba(139,92,246,.25)] transition-transform active:scale-95 " + (active ? "bg-red-500/90 hover:bg-red-500" : "bg-violet-600 hover:bg-violet-500")} aria-label={active ? "วางสาย" : "โทรหาสลี่"}>
            {active ? <PhoneOff className="size-6" /> : <Phone className="size-6" />}
          </button>
          <button type="button" onClick={() => { if (speaking) { stopVoice(); setSpeaking(false); setStatus("สลี่ฟังอยู่ค่ะ พูดได้เลย"); } }} disabled={!active || !speaking} className="grid size-12 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 transition hover:bg-white/10 disabled:opacity-30" aria-label="หยุดเสียงสลี่">
            <Volume2 className="size-5" />
          </button>
        </div>
        <div className="mt-3 text-center text-[10px] tracking-wider text-white/25">PRIVATE VOICE CONSOLE • SALI</div>
      </footer>
    </div>
  );
}
