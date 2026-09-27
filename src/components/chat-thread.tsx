import { useEffect, useRef, useState } from "react";
import { ArrowDown, Check, Copy, FileText, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { formatBytes } from "@/lib/attachments";
import { Markdown } from "@/components/markdown";
import type { ChatMessage } from "@/lib/types";
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
  onEditMessage,
  onRegenerate,
  busy = false,
  workStatus,
  workSteps = [],
  sandboxRun,
}: {
  messages: ChatMessage[];
  streamingId?: string | null;
  onDeleteMessage?: (id: string) => void;
  /** Replace a user message (and everything after it) and resend. */
  onEditMessage?: (id: string, content: string) => void;
  /** Re-ask the last user message. */
  onRegenerate?: () => void;
  busy?: boolean;
  workStatus?: string;
  workSteps?: string[];
  sandboxRun?: SandboxRunView | null;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoScroll) return;
    const el = scroller.current;
    if (!el) return;
    // Keep the viewport anchored to the bottom without smooth-scroll feedback loops.
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
  }, [messages, streamingId, autoScroll, sandboxRun]);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }

  return (
    <div ref={scroller} onScroll={onScroll} className="chat-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full min-w-0 max-w-[1400px] flex-col gap-5 px-3 py-5 sm:px-5 sm:py-7 lg:px-7">
        {messages.length === 0 ? (
          <div className="flex min-h-[45vh] items-center justify-center text-center">
            <p className="text-sm text-muted">เริ่มคุยกับสลี่ได้เลยค่ะ</p>
          </div>
        ) : null}

        {streamingId && workStatus ? (
          <WorkStatus status={workStatus} steps={workSteps} sandboxRun={sandboxRun} />
        ) : null}

        {messages.map((m, index) => (
          <MessageBubble
            key={m.id}
            message={m}
            live={m.id === streamingId}
            busy={busy}
            isLast={index === messages.length - 1}
            onDelete={() => onDeleteMessage?.(m.id)}
            onEdit={onEditMessage ? (content) => onEditMessage(m.id, content) : undefined}
            onRegenerate={onRegenerate}
          />
        ))}
        {sandboxRun?.previewHtml ? <SandboxHtmlPreview html={sandboxRun.previewHtml} /> : null}
        <div ref={bottomRef} aria-hidden="true" className="h-px w-full shrink-0" />
      </div>
      {!autoScroll && messages.length ? (
        <button
          type="button"
          onClick={() => { setAutoScroll(true); bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }}
          className="sticky bottom-3 z-20 mx-auto -mt-11 flex size-10 items-center justify-center rounded-full border border-border bg-elevated text-muted shadow-lg transition hover:text-fg"
          aria-label="เลื่อนไปข้อความล่าสุด"
          title="เลื่อนไปข้อความล่าสุด"
        >
          <ArrowDown className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

function MessageBubble({
  message,
  live,
  busy,
  isLast,
  onDelete,
  onEdit,
  onRegenerate,
}: {
  message: ChatMessage;
  live: boolean;
  busy: boolean;
  isLast: boolean;
  onDelete: () => void;
  onEdit?: (content: string) => void;
  onRegenerate?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  if (message.role === "user") {
    if (editing) {
      const save = () => {
        const next = draft.trim();
        if (!next && !message.attachments?.length) return;
        setEditing(false);
        onEdit?.(next);
      };
      return (
        <div className="lumina-rise flex justify-end">
          <div className="w-full max-w-[min(92%,48rem)] rounded-[20px] bg-elevated p-2.5 shadow-[var(--shadow-border)]">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); save(); }
                if (e.key === "Escape") { setEditing(false); setDraft(message.content); }
              }}
              rows={Math.min(8, Math.max(2, draft.split("\n").length))}
              aria-label="แก้ไขข้อความ"
              className="block w-full resize-y rounded-xl bg-bg px-3 py-2 text-[13px] leading-[1.5] text-fg outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <span className="mr-auto px-1 text-[11px] text-subtle">คำตอบหลังข้อความนี้จะถูกสร้างใหม่</span>
              <button type="button" onClick={() => { setEditing(false); setDraft(message.content); }} className="rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-hover hover:text-fg">ยกเลิก</button>
              <button type="button" onClick={save} disabled={busy} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-50">ส่งใหม่</button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="lumina-rise group flex justify-end">
        <div className="flex max-w-[min(88%,48rem)] items-end gap-1">
          <div className="flex shrink-0 flex-col gap-0.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
            {onEdit ? (
              <button
                type="button"
                onClick={() => { setDraft(message.content); setEditing(true); }}
                disabled={busy}
                className="grid size-7 place-items-center rounded-lg text-subtle transition hover:bg-hover hover:text-fg disabled:opacity-40"
                aria-label="แก้ไขข้อความ"
                title="แก้ไขแล้วส่งใหม่"
              >
                <Pencil className="size-3.5" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onDelete}
              className="grid size-7 place-items-center rounded-lg text-subtle transition hover:bg-hover hover:text-danger"
              aria-label="ลบข้อความ"
              title="ลบข้อความ"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
          <div className="min-w-0 rounded-[20px] rounded-br-md bg-elevated px-3.5 py-2.5 text-[13px] leading-[1.5] shadow-[var(--shadow-border)]">
            {message.attachments?.length ? (
              <ul className="mb-2 flex flex-wrap gap-1.5">
                {message.attachments.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex max-w-full items-center gap-1.5 rounded-lg bg-bg/60 px-2 py-1 text-[11px]">
                    <FileText className="size-3 shrink-0 text-primary" aria-hidden="true" />
                    <span className="truncate font-medium">{file.name}</span>
                    <span className="text-subtle">{formatBytes(file.size)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {message.content ? <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.content}</p> : null}
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
            {isLast && onRegenerate ? (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={busy}
                className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-subtle transition-colors hover:bg-hover hover:text-fg disabled:opacity-40"
                aria-label="สร้างคำตอบใหม่"
                title="สร้างคำตอบใหม่"
              >
                <RefreshCw className="size-3.5" />
                ตอบใหม่
              </button>
            ) : null}
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
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="lumina-rise flex gap-3 sm:gap-4">
      <div className="work-live mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs text-primary">✦</div>
      <div className="min-w-0 w-full max-w-[1100px] rounded-2xl bg-clay/70 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            <span className="truncate text-xs font-semibold text-fg">{status}<span className="work-dots" aria-hidden="true"><i /><i /><i /></span></span>
          </div>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="shrink-0 rounded-lg px-2 py-1 text-[11px] text-muted transition hover:bg-hover hover:text-fg">{expanded ? "ซ่อนสรุป" : "Summary"}</button>
        </div>
        {expanded ? <div className="mb-3 rounded-xl border border-border/60 bg-bg/20 p-3"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">สรุปการทำงาน</p><div className="relative flex flex-col gap-2 pl-5">{steps.map((step, index) => <div key={`${step}-${index}`} className="relative text-xs text-muted"><span className="absolute -left-5 top-1.5 size-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />{index < steps.length - 1 ? <span className="absolute -left-[13px] top-3 h-[calc(100%+8px)] w-px bg-border" /> : null}<span className="font-mono">{step}</span></div>)}</div></div> : null}
          {sandboxRun ? <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{sandboxRun.label}</span> : null}

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
                    {sandboxRun.output}{sandboxRun.status === "running" ? <span className="animate-pulse"> ▌</span> : null}
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
