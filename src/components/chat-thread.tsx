import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Markdown } from "@/components/markdown";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LuminaMark } from "@/components/lumina-mark";

export function ChatThread({ messages, streamingId }: { messages: ChatMessage[]; streamingId?: string | null }) {
  const end = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  useEffect(() => {\n    if (!autoScroll) return;\n    const el = scroller.current;\n    if (!el) return;\n    // Streaming updates happen many times per second. Instant bottom-locking\n    // prevents scrollIntoView({behavior:"smooth"}) from fighting the user and\n    // making the whole viewport appear to jump up/down.\n    el.scrollTop = el.scrollHeight;\n  }, [messages, streamingId, autoScroll]);\n  function onScroll() {\n    const el = scroller.current;\n    if (!el) return;\n    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;\n    setAutoScroll(distance < 80);\n  }
  return <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto scroll-smooth">
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-7 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      {messages.length === 0 ? <div className="flex min-h-[45vh] items-center justify-center text-center"><p className="text-sm text-muted">Start a conversation. Your workspace stays right here.</p></div> : null}
      {messages.map((m) => <MessageBubble key={m.id} message={m} live={m.id === streamingId} />)}
      <div ref={end} />
    </div>
  </div>;
}
function MessageBubble({ message, live }: { message: ChatMessage; live: boolean }) {
  if (message.role === "user") return <div className="lumina-rise flex justify-end"><div className="max-w-[min(88%,48rem)] rounded-[24px] rounded-br-md bg-elevated px-4 py-3 text-[15px] leading-relaxed shadow-[var(--shadow-border)]">{message.content}</div></div>;
  const empty=!message.content&&!message.thinking;
  return <div className="lumina-rise flex gap-3 sm:gap-4"><LuminaMark className="mt-0.5 size-7 shrink-0 text-primary" /><div className="min-w-0 max-w-[1000px] flex-1">
    {message.thinking ? <ThinkingBlock text={message.thinking} live={live&&!message.content} /> : null}
    {empty ? <p className="lumina-shimmer text-sm font-medium">Thinking</p> : message.content ? <Markdown text={message.content} /> : null}
    {live&&message.content ? <span className="lumina-caret" /> : null}
    {!live&&message.content ? <CopyLine text={message.content} /> : null}
  </div></div>;
}
function ThinkingBlock({ text, live }: { text: string; live: boolean }) {
  const [open,setOpen]=useState(live); useEffect(()=>setOpen(live),[live]);
  return <div className="mb-3"><button type="button" onClick={()=>setOpen(v=>!v)} className="text-sm font-medium text-muted transition-colors hover:text-fg">{live?"Thinking":open?"Hide thinking":"Show thinking"}</button>
    {open ? <p className="mt-2 border-l border-border pl-3 text-sm leading-relaxed text-muted">{text}</p> : null}</div>;
}
function CopyLine({ text }: { text: string }) {
  const [copied,setCopied]=useState(false);
  return <button type="button" className={cn("mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-subtle transition-colors hover:bg-hover hover:text-fg")} onClick={async()=>{await navigator.clipboard.writeText(text);setCopied(true);window.setTimeout(()=>setCopied(false),1400);}}>
    {copied?<Check className="size-3.5" />:<Copy className="size-3.5" />}{copied?"Copied":"Copy"}
  </button>;
}