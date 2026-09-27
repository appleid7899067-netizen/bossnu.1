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

  useEffect(() => {
    if (!autoScroll) return;
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingId, autoScroll]);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }

  return (
    <div ref={scroller} onScroll={onScroll} className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain scroll-smooth">
      <div className="mx-auto flex w-full min-w-0 max-w-[1180px] flex-col gap-5 px-3 py-5 sm:px-5 sm:py-7 lg:px-7">
        {messages.length === 0 ? (
          <div className="flex min-h-[45vh] items-center justify-center text-center">
            <p className="text-sm text-muted">เริ่มคุยกับสลี่ได้เลยค่ะ</p>
          </div>
        ) : null}

        {streamingId && workStatus ? (
          <WorkStatus status={workStatus} steps={workSteps} sandboxRun={sandboxRun} />
        ) : null}

        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            live={m.id === streamingId}
            onDelete={() => onDeleteMessage?.(m.id)}
          />
        ))}
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
  const [open, setOpen] = useState(live);

  useEffect(() => setOpen(live), [live]);

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
    <div className="lumina-rise flex gap-3 sm:gap-4">
      <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs text-primary">✦</div>
      <div className="min-w-0 w-full max-w-[900px] rounded-2xl bg-clay/70 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            <span className="text-xs font-semibold text-fg">{status}</span>
          </div>
          {sandboxRun ? (
            <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
              {sandboxRun.label}
            </span>
          ) : null}
        </div>

        {sandboxRun ? (
          <div className="overflow-hidden rounded-xl border border-border/70 bg-elevated/60">
            <div className="grid grid-cols-[92px_minmax(0,1fr)] text-[11px]">
              <div className="border-b border-border/60 px-3 py-2 text-muted">หมวด</div>
              <div className="border-b border-border/60 px-3 py-2 font-medium text-fg">Sandbox Runner</div>
              <div className="border-b border-border/60 px-3 py-2 text-muted">Runtime</div>
              <div className="border-b border-border/60 px-3 py-2 font-mono text-primary">{sandboxRun.runtime}</div>
              <div className="border-b border-border/60 px-3 py-2 text-muted">คำสั่ง</div>
              <div className="border-b border-border/60 break-all px-3 py-2 font-mono text-[10px] text-fg">
                {sandboxRun.command || "auto"}
              </div>
              <div className="border-b border-border/60 px-3 py-2 text-muted">สถานะ</div>
              <div className="border-b border-border/60 px-3 py-2 font-semibold text-fg">{sandboxRun.status}</div>
              {sandboxRun.output ? (
                <>
                  <div className="px-3 py-2 text-muted">ผลลัพธ์</div>
                  <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-words px-3 py-2 font-mono text-[10px] leading-relaxed text-muted">
                    {sandboxRun.output}
                  </pre>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        {sandboxRun?.previewUrl ? (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-primary/8 px-3 py-2 text-[11px]">
            <span>🌐 Live Preview พร้อมแล้ว</span>
            <a
              className="font-semibold text-primary hover:underline"
              href={sandboxRun.previewUrl}
              target="_blank"
              rel="noreferrer"
            >
              เปิด Preview ↗
            </a>
          </div>
        ) : null}

        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step + index} className="flex items-center gap-2 text-[11px] text-muted">
              <span className="grid size-4 place-items-center rounded-full bg-elevated text-[9px] text-primary">✓</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
