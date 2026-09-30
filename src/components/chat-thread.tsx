import { useEffect, useRef, useState } from "react";
import { ArrowDown, Check, Copy, FileText, Pencil, RefreshCw, Trash2, Volume2 } from "lucide-react";
import { formatBytes } from "@/lib/attachments";
import { Markdown } from "@/components/markdown";
import type { ChatActivity, ChatMessage } from "@/lib/types";
import { LuminaMark } from "@/components/lumina-mark";
import { speakNow, stopVoice } from "@/lib/ai/voice";

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
  onContextAction,
  busy = false,
  sandboxRun,
}: {
  messages: ChatMessage[];
  streamingId?: string | null;
  onDeleteMessage?: (id: string) => void;
  /** Replace a user message (and everything after it) and resend. */
  onEditMessage?: (id: string, content: string) => void;
  /** Re-ask the last user message. */
  onRegenerate?: () => void;
  onContextAction?: (action: string) => void;
  busy?: boolean;
  sandboxRun?: SandboxRunView | null;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastScrollHeight = useRef(0);

  // Anchor the viewport only while the user is already following the live reply.
  // Do not call scrollIntoView on every token update: that causes mobile jitter and layout feedback.
  useEffect(() => {
    const el = scroller.current;
    if (!el || !autoScroll) return;
    const heightDelta = el.scrollHeight - lastScrollHeight.current;
    if (heightDelta <= 0) {
      lastScrollHeight.current = el.scrollHeight;
      return;
    }
    el.scrollTop = el.scrollHeight - el.clientHeight;
    lastScrollHeight.current = el.scrollHeight;
  }, [messages, streamingId, autoScroll]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    lastScrollHeight.current = el.scrollHeight;
  }, []);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAutoScroll(distance < 64);
    lastScrollHeight.current = el.scrollHeight;
  }

  return (
    <div ref={scroller} onScroll={onScroll} className="chat-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full min-w-0 max-w-[1400px] flex-col gap-5 px-3 py-5 sm:px-5 sm:py-7 lg:px-7">
        {messages.length === 0 ? (
          <div className="flex min-h-[45vh] items-center justify-center text-center">
            <p className="text-sm text-muted">เริ่มคุยกับสลี่ได้เลยค่ะ</p>
          </div>
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
            onContextAction={onContextAction}
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
  onContextAction,
}: {
  message: ChatMessage;
  live: boolean;
  busy: boolean;
  isLast: boolean;
  onDelete: () => void;
  onEdit?: (content: string) => void;
  onRegenerate?: () => void;
  onContextAction?: (action: string) => void;
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
          <div className="min-w-0">
            <div className="rounded-[20px] rounded-br-md bg-primary/[0.08] px-3.5 py-2.5 text-[12px] leading-[1.5] shadow-[var(--shadow-border)] ring-1 ring-primary/10">
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
            <time className="mt-1 block text-right text-[10px] tabular-nums text-subtle opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-60">{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
          </div>
        </div>
      </div>
    );
  }

  const empty = !message.content && !message.thinking;

  return (
    <div className="lumina-rise group flex gap-3 sm:gap-4">
      <LuminaMark className="mt-0.5 size-7 shrink-0 text-primary" />
      <div className="min-w-0 max-w-[1080px] flex-1 break-words text-[13px] leading-[1.6] [overflow-wrap:anywhere] sm:text-[12.5px] sm:leading-[1.55]">
        {message.activities?.length ? <ActivityFeed activities={message.activities} live={live} /> : null}
        {message.thinking && !message.content ? <ThinkingBlock text={message.thinking} live={live} /> : null}
        {empty ? (
          <p className="lumina-shimmer text-sm font-medium">กำลังคิด…</p>
        ) : message.content ? (
          live ? (
            <p className="assistant-stream-text whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <Markdown text={message.content} live={false} />
          )
        ) : null}
        {live && message.content ? <span className="lumina-caret" /> : null}
        {!live && message.content ? (
          <div className="mt-2 flex items-center gap-1">
            <time className="mr-1 inline-flex h-8 items-center rounded-lg px-1 text-[10px] tabular-nums text-subtle opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100">{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
            <CopyLine text={message.content} />
            <ListenLine text={message.content} />
            {isLast && onContextAction ? <ContextualReplyActions text={message.content} onAction={onContextAction} /> : null}
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


const PHASE_TITLES: Record<string, string> = {
  goal: "Goal • เป้าหมาย",
  plan: "Plan • วางแผน",
  act: "Act • ลงมือทำ",
  run: "Run • รัน Sandbox",
  observe: "Observe • อ่านผล",
  verify: "Verify • ตรวจสอบ",
  fix: "Fix • แก้แล้วลองใหม่",
  answer: "Answer • ตอบในแชต",
};

function ActivityFeed({ activities, live }: { activities: ChatActivity[]; live: boolean }) {
  const visible = activities.slice(-80);

  function timeOf(activity: ChatActivity) {
    return new Date(activity.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function phaseLabel(activity: Extract<ChatActivity, { kind: "phase" }>) {
    const labels: Record<string, string> = {
      goal: "กำหนดเป้าหมาย",
      plan: "วางแผนการทำงาน",
      act: "ลงมือทำ",
      run: "รัน Sandbox",
      observe: "อ่านผลจริง",
      verify: "ตรวจสอบหลักฐาน",
      fix: "แก้ไขและรันใหม่",
      answer: "เตรียมคำตอบ",
    };
    return activity.label.replace(/^[^•]+•\\s*/, "") || labels[activity.phase] || activity.phase;
  }

  function statusText(activity: Extract<ChatActivity, { kind: "command" }>) {
    if (activity.status === "running") return "กำลังรัน";
    if (activity.status === "success") return "สำเร็จ";
    if (activity.status === "blocked") return "รออนุญาต";
    if (activity.status === "aborted") return "หยุด";
    return "ผิดพลาด";
  }

  return (
    <section aria-label="Developer log ของสลี่" className="sali-devlog mb-4">
      <div className="sali-devlog-head">
        <span className="sali-devlog-mark">›_</span>
        <span>{live ? "SALI / WORKING" : "SALI / ACTIVITY LOG"}</span>
        {live ? <span className="sali-live-cursor" aria-label="กำลังทำงาน" /> : null}
      </div>

      <ol className="sali-devlog-list">
        {visible.map((activity) => (
          <li key={activity.id} className="sali-log-line">
            <time className="sali-log-time">{timeOf(activity)}</time>

            {activity.kind === "phase" ? (
              <>
                <span className="sali-log-status sali-log-working">RUN</span>
                <span className="sali-log-text">{phaseLabel(activity)}</span>
              </>
            ) : activity.kind === "command" ? (
              <>
                <span className={
                  activity.status === "success"
                    ? "sali-log-status sali-log-ok"
                    : activity.status === "running"
                      ? "sali-log-status sali-log-working"
                      : "sali-log-status sali-log-error"
                }>
                  {activity.status === "success" ? "OK" : activity.status === "running" ? "RUN" : "ERR"}
                </span>
                <span className="sali-log-text">
                  <span>{statusText(activity)} </span>
                  <code className="sali-log-runtime">{activity.runtime}</code>
                  <code className="sali-log-command">$ {activity.command}</code>
                </span>
              </>
            ) : activity.kind === "stream" ? (
              <>
                <span className={
                  activity.status === "done"
                    ? "sali-log-status sali-log-ok"
                    : activity.status === "error"
                      ? "sali-log-status sali-log-error"
                      : "sali-log-status sali-log-working"
                }>
                  {activity.status === "done" ? "OK" : activity.status === "error" ? "ERR" : "LIVE"}
                </span>
                <span className="sali-log-text">
                  <span className="sali-stream-source">{activity.source.toUpperCase()}</span>
                  {" "}{activity.text || "กำลังรับข้อมูล…"}
                  {typeof activity.chars === "number" ? <span className="sali-log-runtime">{activity.chars.toLocaleString()} chars</span> : null}
                  {activity.status === "running" ? <span className="sali-terminal-caret" /> : null}
                </span>
              </>
            ) : activity.kind === "files" ? (
              <>
                <span className="sali-log-status sali-log-ok">EDIT</span>
                <span className="sali-log-text">
                  แก้ไขไฟล์ {activity.files.length} รายการ
                  <span className="sali-log-detail">{activity.files.slice(0, 6).map(file => file.path).join(" • ")}</span>
                </span>
              </>
            ) : (
              <>
                <span className={
                  activity.status === "saved"
                    ? "sali-log-status sali-log-ok"
                    : "sali-log-status sali-log-error"
                }>
                  {activity.status === "saved" ? "OK" : "ERR"}
                </span>
                <span className="sali-log-text">
                  {activity.status === "saved" ? "บันทึกทักษะที่ทดสอบผ่าน" : "ไม่บันทึกทักษะ"}
                  <span className="sali-log-detail">{activity.path}</span>
                </span>
              </>
            )}
          </li>
        ))}
        {live ? (
          <li className="sali-log-line sali-log-current" aria-live="polite">
            <time className="sali-log-time">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
            <span className="sali-log-status sali-log-working">RUN</span>
            <span className="sali-log-text">กำลังประมวลผล <span className="sali-terminal-caret" /></span>
          </li>
        ) : null}
      </ol>
    </section>
  );
}

function ThinkingBlock({ text, live }: { text: string; live: boolean }) {
  if (!text) return null;
  return (
    <div className="mb-2">
      <div className="text-[11px] font-medium text-muted">กำลังคิด<span className="thinking-dots">...</span></div>
      <p className="mt-1.5 border-l border-border pl-2.5 text-[11px] leading-[1.5] text-muted">{text}</p>
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

function ListenLine({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  return (
    <button type="button"
      className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-subtle transition-colors hover:bg-hover hover:text-fg disabled:opacity-40"
      onClick={async () => {
        if (speaking) { stopVoice(); setSpeaking(false); return; }
        setSpeaking(true);
        try { await speakNow(text); } finally { setSpeaking(false); }
      }}
      aria-label={speaking ? "หยุดเสียง" : "ฟังคำตอบ"} title={speaking ? "หยุดเสียง" : "ฟังคำตอบ"}
    >
      <Volume2 className="size-3.5" />
      {speaking ? "กำลังอ่าน" : "ฟัง"}
    </button>
  );
}

function getContextualReplyActions(text: string): string[] {
  const q = text.toLowerCase();
  const actions: string[] = [];
  const add = (label: string) => { if (!actions.includes(label)) actions.push(label); };
  if (/html|css|javascript|typescript|react|next\.js|โค้ด|code|component|function|api|json/.test(q)) {
    add("ดูโค้ดส่วนนี้"); add("แก้ต่อจากคำตอบ"); add("ทดสอบโค้ด");
  }
  if (/error|bug|บั๊ก|ผิดพลาด|exception|ล้มเหลว|แก้ไข/.test(q)) {
    add("วิเคราะห์ Error ต่อ"); add("แก้แล้วตรวจสอบ"); add("ดู Log");
  }
  if (/สูตร|อาหาร|เมนู|ทำกิน|วัตถุดิบ|recipe|food|calorie|แคลอรี/.test(q)) {
    add("ขอสูตรแบบละเอียด"); add("คำนวณปริมาณให้"); add("แนะนำเมนูอื่น");
  }
  if (/งาน|ประชุม|โปรเจกต์|project|task|แผนงาน|เอกสาร|report|รายงาน|อีเมล/.test(q)) {
    add("สรุปให้เป็นรายการ"); add("จัดลำดับงานต่อ"); add("ลงมือทำต่อ");
  }
  if (/github|repo|commit|branch|pull request|\bpr\b|render|deploy|deployment/.test(q)) {
    add("ตรวจ Repo ต่อ"); add("แก้ไฟล์ต่อ"); add("ตรวจ Deploy");
  }
  if (/วิเคราะห์|ข้อมูล|ตาราง|csv|excel|กราฟ|สถิติ|data|analysis/.test(q)) {
    add("สรุปข้อมูลให้"); add("ทำเป็นตาราง"); add("วิเคราะห์ต่อ");
  }
  if (/สรุป|อธิบาย|หมายถึง|คืออะไร|รายละเอียด|เปรียบเทียบ|ข้อดี|ข้อเสีย|compare|explain/.test(q)) {
    add("ขยายรายละเอียด"); add("สรุปสั้นๆ");
  }
  if (!actions.length && text.trim()) {
    add("ขยายรายละเอียด"); add("สรุปคำตอบ"); add("ลงมือทำต่อ");
  }
  return actions.slice(0, 4);
}

function ContextualReplyActions({ text, onAction }: { text: string; onAction: (action: string) => void }) {
  const actions = getContextualReplyActions(text);
  if (!actions.length) return null;
  return (
    <div className="mt-2 flex w-full flex-wrap gap-1.5">
      {actions.map((action) => (
        <button key={action} type="button" onClick={() => onAction(action)}
          className="inline-flex h-8 items-center rounded-full border border-border/70 bg-elevated/60 px-3 text-[11px] font-medium text-muted transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-fg">
          {action}
        </button>
      ))}
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
