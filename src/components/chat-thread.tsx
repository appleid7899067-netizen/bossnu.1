import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Markdown } from "@/components/markdown";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LuminaMark } from "@/components/lumina-mark";

export function ChatThread({
  messages,
  streamingId,
}: {
  messages: ChatMessage[];
  streamingId?: string | null;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingId]);

  return (
    <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:py-8">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            live={m.id === streamingId}
          />
        ))}
        <div ref={end} />
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  live,
}: {
  message: ChatMessage;
  live: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[min(100%,36rem)] rounded-2xl rounded-br-md bg-clay px-4 py-3 text-[0.975rem] leading-relaxed text-clay-fg">
          {message.content}
        </div>
      </div>
    );
  }

  const empty = !message.content && !message.thinking;
  return (
    <div className="flex gap-3">
      <LuminaMark className="mt-0.5 size-7 text-primary" />
      <div className="min-w-0 flex-1">
        {message.thinking ? (
          <ThinkingBlock text={message.thinking} live={live && !message.content} />
        ) : null}
        {empty ? (
          <p className="lumina-shimmer text-sm font-medium">Thinking</p>
        ) : message.content ? (
          <Markdown text={message.content} />
        ) : null}
        {live && message.content ? <span className="lumina-caret" /> : null}
        {!live && message.content ? <CopyLine text={message.content} /> : null}
      </div>
    </div>
  );
}

function ThinkingBlock({ text, live }: { text: string; live: boolean }) {
  const [open, setOpen] = useState(live);
  useEffect(() => {
    setOpen(live);
  }, [live]);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-muted transition-[color] duration-150 hover:text-fg"
      >
        {live ? "Thinking" : open ? "Hide thinking" : "Show thinking"}
      </button>
      {open ? (
        <p className="mt-2 border-l border-border pl-3 text-sm leading-relaxed text-muted">
          {text}
        </p>
      ) : null}
    </div>
  );
}

function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={cn(
        "mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-subtle",
        "transition-[background-color,color] duration-150 hover:bg-fg/5 hover:text-fg",
      )}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
