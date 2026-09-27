import { useEffect, useRef, useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import { Markdown } from "@/components/markdown";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LuminaMark } from "@/components/lumina-mark";

export type SandboxRunView = {
  runtime: string;
  label: string;
  command?: string;
  status: string;
  output?: string;
  previewUrl?: string | null;
  previewHtml?: string;
};

export function ChatThread({
  messages,
  streamingId,
  onDeleteMessage,
  workStatus,
  workSteps = [],
  sandboxRun,
}: {
  messages: ChatMessage[];
  streamingId?: string | null;
  onDeleteMessage?: (id: string) => void;
  workStatus?: string;
  workSteps?: string[];
  sandboxRun?: SandboxRunView | null;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!autoScroll) return;
    const el = scroller.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [messages, streamingId, autoScroll, sandboxRun, workStatus]);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      className="chat-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
      style={{ overflowAnchor: "auto" }}
    >
      <div className="mx-auto flex w-full min-w-0 max-w-[1180px] flex-col gap-5 px-3 py-5 sm:px-5 sm:py-7 lg:px-7">
        {messages.length === 0 ? (
          <div className="flex min-h-[45vh] items-center justify-center text-center">
            <p className="text-sm text-muted">เริ่มคุยกับสลี่ได้เลยค่ะ</p>
          </div>
        ) : null}

        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            live={m.id === streamingId}
            onDelete={() => onDeleteMessage?.(m.id)}
          />
        ))}

        {streamingId && workStatus ? (
          <WorkStatus status={workStatus} steps={workSteps} sandboxRun={sandboxRun} />
        ) : null}

        {sandboxRun?.previewHtml ? <SandboxHtmlPreview html={sandboxRun.previewHtml} /> : null}
        <div ref={bottomRef} aria-hidden="true" className="h-px w-full shrink-0" />
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  live,
  onDelete,
}: {
  message: ChatMessage;
  live: boolean;
  onDelete: () => void;
}) {
  if (message.role === "user") {
    return (
      <div className="lumina-rise group flex justify-end">
        <div className="flex max-w-[min(88%,48rem)] items-end gap-1.5">
          <button
            type="button"
            onClick={onDelete}
            className="grid size-7 shrink-0 place-items-center rounded-lg text-subtle opacity-0 transition hover:bg-hover hover:text-danger group-hover:opacity-100 focus:opacity-100"
            aria-label="ลบข้อความ"
            title="ลบข้อความ"
          >
            <Trash2 className="size-3.5" />
          </button>
          <div className="rounded-[20px] rounded-br-md bg-elevated px-3.5 py-2.5 text-[13px] leading-[1.5] shadow-[var(--shadow-border)]">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  const empty = !message.content && !message.thinking;

  return (
    <div className="lumina-rise group flex gap-3 sm:gap-4">
      <LuminaMark className="mt-0.5 size-7 shrink-0 text-primary" />
      <div className="min-w-0 max-w-[1080px] flex-1 break-words text-[14px] leading-[1.65] [overflow-wrap:anywhere] sm:text-[13px] sm:leading-[1.55]">
        {message.thinking ? <ThinkingBlock text={message.thinking} live={live && !message.content} /> : null}
        {empty ? (
          <p className="lumina-shimmer text-sm font-medium">กำลังคิด…</p>
        ) : message.content ? (
          <Markdown text={message.content} live={live} />
        ) : null}
        {live && message.content ? <span className="lumina-caret" /> : null}
        {!live && message.content ? (
          <div className="flex items-center gap-1">
            <CopyLine text={message.content} />
            <button
              type="button"
              onClick={onDelete}
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-subtle transition-colors hover:bg-hover hover:text-danger"
              aria-label="ลบข้อความ"
              title="ลบข้อความ"
            >
              <Trash2 className="size-3.5" />
              ลบ
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ThinkingBlock({ text, live }: { text: string; live: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] font-medium text-muted transition-colors hover:text-fg"
      >
        {live ? "กำลังคิด…" : open ? "ซ่อนการคิด" : "แสดงการคิด"}
      </button>
      {open ? (
        <p className="mt-1.5 border-l border-border pl-2.5 text-[11px] leading-[1.5] text-muted">
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
      className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-subtle transition-colors hover:bg-hover hover:text-fg"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "คัดลอกแล้ว" : "คัดลอก"}
    </button>
  );
}

function WorkStatus({
  status,
  steps,
  sandboxRun,
}: {
  status: string;
  steps: string[];
  sandboxRun?: SandboxRunView | null;
}) {
  return (
    <div className="lumina-rise flex gap-3 sm:gap-4 transition-all duration-150">
      <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-xs text-emerald-400">
        <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
      </div>
      <div className="min-w-0 w-full max-w-[900px] rounded-2xl border border-border/80 bg-elevated/70 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="text-xs font-semibold text-fg">{status}</span>
          </div>
          {sandboxRun ? (
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
              {sandboxRun.label} • {sandboxRun.runtime}
            </span>
          ) : (
            <span className="rounded-md bg-elevated px-2 py-0.5 text-[10px] text-muted">
              Repo Mode
            </span>
          )}
        </div>

        {steps.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {steps.map((step, index) => (
              <span
                key={step + index}
                className="inline-flex items-center gap-1 rounded-lg bg-clay/80 px-2 py-1 text-[10px] text-muted"
              >
                <Check className="size-3 text-emerald-400 stroke-[2.5]" />
                <span>{step}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SandboxHtmlPreview({ html }: { html: string }) {
  return (
    <section className="ml-10 w-full max-w-[720px] overflow-hidden rounded-2xl border border-border bg-white shadow-sm sm:ml-11">
      <div className="flex h-9 items-center justify-between border-b border-border bg-elevated px-3 text-xs font-medium text-muted">
        <span>🌐 Sandbox • Live Preview</span>
        <span className="text-success">แยกกรอบปลอดภัย</span>
      </div>
      <iframe title="Sandbox HTML preview" sandbox="allow-scripts" srcDoc={html} className="h-[min(55vh,520px)] w-full bg-white" />
    </section>
  );
}
