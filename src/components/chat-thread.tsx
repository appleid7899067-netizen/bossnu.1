import { useEffect, useRef, useState } from "react";
import { ArrowDown, Check, Copy, Download, FileText, Maximize2, Minimize2, Pencil, RefreshCw, Trash2, Volume2 } from "lucide-react";
import { formatBytes } from "@/lib/attachments";
import { Markdown } from "@/components/markdown";
import { ProjectFilesView } from "@/components/project-files-view";
import type { ChatActivity, ChatMessage } from "@/lib/types";
import { speakNow, stopVoice } from "@/lib/ai/voice";

export type SandboxRunView = {
  runtime: string;
  label: string;
  command?: string;
  status: string;
  output?: string;
  previewUrl?: string | null;
  previewHtml?: string;
  previewPath?: string;
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
  workspaceId,
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
  workspaceId?: string;
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
      <div className="flex w-full min-w-0 flex-col gap-4 px-0 py-4 sm:gap-5 sm:py-5">
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
        {sandboxRun?.previewHtml ? <SandboxHtmlPreview html={sandboxRun.previewHtml} path={sandboxRun.previewPath} /> : null}
        {sandboxRun?.previewHtml && workspaceId ? <InlineCodeWorkspace workspaceId={workspaceId} path={sandboxRun.previewPath} /> : null}
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
            <div className="rounded-[20px] rounded-br-md bg-primary/[0.08] px-3.5 py-2.5 text-[12px] leading-[1.5] shadow-[var(--shadow-border)] ring-1 ring-primary/10 max-md:bg-primary max-md:text-primary-fg max-md:ring-primary/40">
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
    <div className="lumina-rise group w-full">
      <div className="min-w-0 w-full break-words text-[13px] pl-0 sm:pl-0 leading-[1.6] [overflow-wrap:anywhere] sm:text-[12.5px] sm:leading-[1.55]">
        {(live || message.activities?.length) ? <ActivityFeed activities={message.activities ?? []} live={live} liveText={live ? message.content : ""} /> : null}
        {empty && !live && !message.activities?.length ? (
          <p className="text-sm font-medium text-muted">กำลังดำเนินการ...</p>
        ) : null}
        {!live && message.content ? (
          <section className="sali-summary" aria-label="สรุปคำตอบของสลี่">
            <div className="sali-summary-head">
              <span className="sali-summary-mark">✓</span>
              <span>SUMMARY / สรุป</span>
            </div>
            <div className="sali-summary-body break-words [overflow-wrap:anywhere]">
              <Markdown text={message.content} live={false} />
            </div>
          </section>
        ) : null}
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


function InlineCodeWorkspace({ workspaceId, path }: { workspaceId: string; path?: string }) {
  return (
    <section className="sali-devlog mb-3 overflow-hidden" aria-label="Code workspace">
      <div className="sali-devlog-head">
        <span className="sali-devlog-mark">{"</>"}</span>
        <span>CODE / WORKSPACE</span>
        {path ? <span className="ml-auto truncate text-[10px] text-subtle">{path}</span> : null}
      </div>
      <div className="h-[620px] min-h-0 border-t border-border bg-bg">
        <ProjectFilesView workspaceId={workspaceId} initialPath={path} />
      </div>
    </section>
  );
}

function SandboxHtmlPreview({ html, path }: { html: string; path?: string }) {
  return (
    <section className="sali-devlog mb-3" aria-label="Sandbox live preview">
      <div className="sali-devlog-head">
        <span className="sali-devlog-mark">›_</span>
        <span>SANDBOX / PREVIEW</span>
        {path ? <span className="ml-auto truncate text-[10px] text-subtle">{path}</span> : null}
        <span className="sali-summary-mark">✓</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-primary/20 bg-white">
        <iframe
          title="Sandbox HTML preview"
          srcDoc={html}
          sandbox="allow-scripts allow-forms"
          className="h-[420px] w-full border-0 bg-white"
        />
      </div>
    </section>
  );
}


function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be unavailable in embedded or non-secure contexts.
    }
  }
  return <button type="button" onClick={() => void copy()} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-subtle transition-colors hover:bg-hover hover:text-fg" aria-label={copied ? "คัดลอกแล้ว" : "คัดลอกคำตอบ"} title={copied ? "คัดลอกแล้ว" : "คัดลอกคำตอบ"}>
    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    {copied ? "คัดลอกแล้ว" : "คัดลอก"}
  </button>;
}

function ListenLine({ text }: { text: string }) {
  const [listening, setListening] = useState(false);
  async function listen() {
    if (listening) { stopVoice(); setListening(false); return; }
    setListening(true);
    try { await speakNow(text); } finally { setListening(false); }
  }
  return <button type="button" onClick={() => void listen()} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-subtle transition-colors hover:bg-hover hover:text-fg" aria-label={listening ? "หยุดอ่าน" : "ฟังคำตอบ"} title={listening ? "หยุดอ่าน" : "ฟังคำตอบ"}>
    <Volume2 className="size-3.5" />{listening ? "หยุด" : "ฟัง"}
  </button>;
}

function ContextualReplyActions({ onAction }: { text: string; onAction: (action: string) => void }) {
  const actions = [{ id: "shorter", label: "สั้นลง" }, { id: "expand", label: "ขยาย" }, { id: "simplify", label: "อธิบายง่ายๆ" }];
  return <div className="mt-3 flex items-center gap-1">
    {actions.map((action) => <button key={action.id} type="button" onClick={() => onAction(action.id)} className="inline-flex h-8 items-center rounded-lg px-2 text-xs font-medium text-subtle transition-colors hover:bg-hover hover:text-fg" aria-label={action.label} title={action.label}>{action.label}</button>)}
  </div>;
}


function LiveExecutionLog({ command, output, fallback }: { command?: string; output?: string; fallback?: string }) {
  const logRef = useRef<HTMLPreElement>(null);
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const text = output?.trimEnd() || fallback?.trimEnd() || "กำลังรอข้อมูลจาก Sandbox…";
  const visibleText = tab === "code" && command ? command : text;

  useEffect(() => {
    const element = logRef.current;
    if (element && tab === "preview") element.scrollTop = element.scrollHeight;
  }, [text, tab]);

  async function copyLog() {
    try {
      await navigator.clipboard.writeText(visibleText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard can be unavailable inside embedded previews.
    }
  }

  function downloadLog() {
    const blob = new Blob([visibleText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = tab === "code" ? "sali-command.sh" : "sali-live-output.log";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`sali-stream-output${expanded ? " sali-stream-expanded" : ""}`} aria-label="บันทึกการทำงานสด" aria-live="polite">
      <div className="sali-stream-output-head">
        <div className="sali-stream-tabs">
          <button type="button" data-active={tab === "preview"} onClick={() => setTab("preview")}>ตัวอย่าง</button>
          <button type="button" data-active={tab === "code"} onClick={() => setTab("code")}>โค้ด</button>
        </div>
        <div className="sali-stream-actions">
          <button type="button" onClick={() => void copyLog()} aria-label="คัดลอก">{copied ? <Check /> : <Copy />}</button>
          <button type="button" onClick={downloadLog} aria-label="ดาวน์โหลด"><Download /></button>
          <button type="button" onClick={() => setExpanded(value => !value)} aria-label={expanded ? "ย่อ" : "ขยาย"}>{expanded ? <Minimize2 /> : <Maximize2 />}</button>
        </div>
      </div>
      {tab === "preview" && command ? <div className="sali-stream-command"><span>$</span>{command}</div> : null}
      <pre ref={logRef} className="sali-stream-log"><code>{visibleText}</code>{tab === "preview" ? <span className="sali-terminal-caret" /> : null}</pre>
    </div>
  );
}

function SaliWaterGraph({ phaseCount, live }: { phaseCount: number; live: boolean }) {
  const level = Math.max(8, Math.min(92, phaseCount * 13 + (live ? 6 : 0)));
  const points = Array.from({ length: 12 }, (_, index) => {
    const wave = Math.sin(index * 0.9 + phaseCount * 0.7) * 7;
    const trend = index * (level / 16);
    return `${index * 10},${Math.max(8, 92 - trend + wave)}`;
  }).join(" ");
  return (
    <div className={`sali-water-graph${live ? " sali-water-graph-live" : ""}`} aria-label="กราฟการทำงานของสลี่">
      <div className="sali-water-graph-head"><span>LIVE / WORK LEVEL</span><span>{live ? "กำลังไหล" : "เสร็จแล้ว"} · {level}%</span></div>
      <svg viewBox="0 0 110 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon points={`0,100 ${points} 110,100`} fill="currentColor" opacity=".08" />
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="sali-water-scale"><span>สูง</span><span>ระดับการทำงาน</span><span>ต่ำ</span></div>
    </div>
  );
}

function ActivityFeed({ activities, live, liveText = "" }: { activities: ChatActivity[]; live: boolean; liveText?: string }) {
  const phaseOrder = ["goal", "plan", "act", "run", "observe", "verify", "fix", "answer"];
  const phaseMap = new Map<string, Extract<ChatActivity, { kind: "phase" }>>();
  for (const activity of activities) {
    if (activity.kind === "phase") phaseMap.set(activity.phase, activity);
  }
  const phases = phaseOrder
    .map(phase => phaseMap.get(phase))
    .filter((activity): activity is Extract<ChatActivity, { kind: "phase" }> => Boolean(activity))
    .slice(-7);
  const latestCommand = [...activities].reverse().find((activity): activity is Extract<ChatActivity, { kind: "command" }> => activity.kind === "command");
  const fileActivity = [...activities].reverse().find(activity => activity.kind === "files");
  const skillActivity = [...activities].reverse().find(activity => activity.kind === "skill");
  const filteredOutput = (latestCommand?.output || liveText)
    .split("\n")
    .filter(line => line.trim())
    .filter(line => !/^\s*(npm notice|npm warn|warning|deprecated|up to date|found \d+ vulnerabilities|exitCode|workspace sync|workspaceSync|process exited)/i.test(line))
    .slice(-12)
    .join("\n");

  const tokenForPhase = (phase: string) => phase.toUpperCase();
  const statusToken = latestCommand
    ? latestCommand.status === "success" ? "✓ RUN" : latestCommand.status === "running" ? "RUN" : "✕ RUN"
    : fileActivity
      ? "✓ EDIT"
      : skillActivity
        ? skillActivity.status === "saved" ? "✓ SKILL" : "✕ SKILL"
        : live ? "RUN" : "✓ DONE";

  return (
    <section aria-label="SALI live stream" className={`sali-devlog mb-3${live ? " sali-devlog-live" : " sali-devlog-done"}`}>
      <div className="sali-devlog-head">
        <span className="sali-devlog-title">{live ? "สลี่กำลังทำงาน" : "สลี่ทำงานเสร็จแล้ว"}</span>
        <span className="sali-devlog-headline" aria-hidden="true" />
        {live ? <span className="sali-live-cursor" aria-label="กำลังทำงาน" /> : <span className="sali-summary-mark" aria-label="เสร็จแล้ว">✓</span>}
      </div>
      <div className="sali-devlog-body">
        <SaliWaterGraph phaseCount={phases.length} live={live} />
        <div className="sali-devlog-flow" aria-live={live ? "polite" : "off"}>
          {phases.map((activity, index) => (
            <span key={activity.id} className="sali-flow-item">
              {index > 0 ? <span className="sali-flow-arrow" aria-hidden="true">→</span> : null}
              <span className="sali-flow-token sali-flow-phase" title={activity.label}>{tokenForPhase(activity.phase)}</span>
            </span>
          ))}
          <span className="sali-flow-item sali-flow-current">
            {phases.length ? <span className="sali-flow-arrow" aria-hidden="true">→</span> : null}
            <span className={`sali-flow-token ${live ? "sali-flow-live" : "sali-flow-ok"}`}>{statusToken}{live ? <span className="sali-terminal-caret" /> : null}</span>
          </span>
        </div>
        {live && (latestCommand || filteredOutput) ? (
          <LiveExecutionLog command={latestCommand?.command} output={filteredOutput} fallback="" />
        ) : null}
      </div>
    </section>
  );
}