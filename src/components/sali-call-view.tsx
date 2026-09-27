import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { streamChat } from "@/lib/ai/stream";
import { finishVoice, speakRealtime, stopVoice } from "@/lib/ai/voice";
import type { ChatMessage } from "@/lib/types";

type CallMessage = { id: string; text: string; role: "user" | "assistant" };

export function SaliCallView({
  history,
  onClose,
  onSaveMessage,
}: {
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

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      stopVoice();
    };
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
    if (!SR) {
      setStatus("เบราว์เซอร์นี้ไม่รองรับการฟังเสียงภาษาไทย");
      return;
    }
    const rec = new SR();
    rec.lang = "th-TH";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onresult = (event: any) => {
      const finalText = Array.from(event.results as any[])
        .slice(event.resultIndex)
        .map((result: any) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (finalText && !processingRef.current) void handleUserSpeech(finalText);
    };
    rec.onerror = () => {
      setListening(false);
      if (activeRef.current && !muted) window.setTimeout(startRecognition, 500);
    };
    rec.onend = () => {
      setListening(false);
      if (activeRef.current && !muted) window.setTimeout(startRecognition, 250);
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
        messages: prior,
        mode: "instant",
        onEvent: (event) => {
          if (event.type === "text") {
            reply += event.text;
            speakRealtime(event.text);
          }
          if (event.type === "done") {
            finishVoice();
          }
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
      setActive(false);
      activeRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      stopVoice();
      setListening(false);
      setSpeaking(false);
      setStatus("จบการสนทนาแล้ว");
      return;
    }

    setActive(true);
    activeRef.current = true;
    setSeconds(0);
    setStatus("กำลังเชื่อมต่อ…");
    const greeting = "สวัสดีค่ะ สลี่พร้อมคุยแล้วนะคะ พูดกับสลี่ได้เลย";
    addMessage("assistant", greeting);
    await new Promise((resolve) => setTimeout(resolve, 250));
    setSpeaking(true);
    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(greeting);
      utterance.lang = "th-TH";
      utterance.rate = 1;
      utterance.pitch = 1.3;
      utterance.volume = 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
    setSpeaking(false);
    setStatus("สลี่ฟังอยู่ค่ะ พูดได้เลย");
    startRecognition();
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[#100d24] text-white">
      <header className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10" aria-label="ปิดโหมดโทร">×</Button>
        <div className="flex items-center gap-3">
          <div className={`grid size-10 place-items-center rounded-full bg-violet-600 ${speaking ? "shadow-[0_0_0_12px_rgba(168,85,247,.18)]" : ""}`}>💜</div>
          <div>
            <div className="font-semibold">สลี่ ออลา</div>
            <div className="text-xs text-violet-200">{active ? "เชื่อมต่อแล้ว" : "พร้อมโทร"}</div>
          </div>
        </div>
        <div className="w-9 text-right text-xs text-violet-200">{mm}:{ss}</div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-y-auto px-4 py-5">
          {messages.length === 0 ? (
            <div className="m-auto max-w-sm text-center text-violet-200/70">
              <div className="mx-auto mb-4 grid size-20 place-items-center rounded-full bg-violet-600/20 text-4xl">💜</div>
              <p>คุยกับสลี่แบบเสียงสดได้เลย</p>
              <p className="mt-1 text-xs">พูดภาษาไทย แล้วสลี่จะฟัง คิด และตอบกลับด้วยเสียง</p>
            </div>
          ) : messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm ${message.role === "user" ? "rounded-br-sm bg-indigo-600" : "rounded-bl-sm bg-white/10"}`}>
                {message.text}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
          <div className="mx-auto mb-4 flex max-w-md items-center justify-center gap-2 text-sm text-violet-200">
            <span className={`size-2 rounded-full ${active ? "bg-emerald-400" : "bg-amber-400"}`} />
            {status}
          </div>
          <div className="mx-auto flex max-w-md items-center justify-center gap-5">
            <button type="button" onClick={() => setMuted((value) => !value)} disabled={!active} className="grid size-12 place-items-center rounded-full bg-white/10 disabled:opacity-30" aria-label="ปิดหรือเปิดไมค์">
              {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </button>
            <button type="button" onClick={() => void toggleCall()} className={`grid size-20 place-items-center rounded-full shadow-lg transition-transform active:scale-95 ${active ? "bg-red-500" : "bg-violet-600"}`} aria-label={active ? "วางสาย" : "โทรหาสลี่"}>
              {active ? <PhoneOff className="size-7" /> : <Phone className="size-7" />}
            </button>
            <button type="button" onClick={() => { if (speaking) stopVoice(); }} disabled={!active} className="grid size-12 place-items-center rounded-full bg-white/10 disabled:opacity-30" aria-label="หยุดเสียงสลี่">
              <Volume2 className="size-5" />
            </button>
          </div>
          <div className="mt-3 text-center text-[11px] text-white/40">
            {listening ? "🎤 กำลังฟัง" : speaking ? "🔊 สลี่กำลังพูด" : active ? "พร้อมรับเสียง" : "กดปุ่มโทรเพื่อเริ่ม"}
          </div>
        </div>
      </div>
    </div>
  );
}
