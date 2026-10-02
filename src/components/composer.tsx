import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { ArrowUp, BookMarked, Check, FileText, Mic, Paperclip, Search, Square, Sparkles, Volume2, VolumeX, Wrench, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ATTACHMENT_ACCEPT, formatBytes, readAttachments } from "@/lib/attachments";
import { useDictation } from "@/lib/ai/use-dictation";
import type { ChatAttachment, QuickPrompt } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { PuterModelOption } from "@/lib/ai/models";

export type ToolAction = { id: string; label: string };

const MAX_MESSAGE_LENGTH = 30_000;

export function Composer({
  value, onChange, onSubmit, onStop, onEmergency, onSendToGpt, placeholder, disabled, busy, extra,
  selectedModel, modelOptions, onModelChange,
  contextualActions, onContextAction, voiceEnabled, onToggleVoice,
  toolActions, activeTool, onToolAction,
  attachments, onAttachments, inputRef, dictation = true, quickPrompts, onInsertPrompt,
}: {
  value: string;
  selectedModel?: string;
  modelOptions?: PuterModelOption[];
  onModelChange?: (model: string) => void;
  onChange: (next: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  /** Emergency recovery action that can interrupt a stuck run and restart the agent. */
  onEmergency?: () => void;
  /** Send the current task explicitly to the GPT worker/model. */
  onSendToGpt?: () => void;
  placeholder: string;
  disabled?: boolean;
  busy?: boolean;
  extra?: ReactNode;
  contextualActions?: string[];
  onContextAction?: (action: string) => void;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  /** Optional tool picker ("which capability should handle this?"). */
  toolActions?: ToolAction[];
  activeTool?: string | null;
  onToolAction?: (id: string) => void;
  /** Text/code files attached to the next message. Omit to hide attaching. */
  attachments?: ChatAttachment[];
  onAttachments?: (next: ChatAttachment[]) => void;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  /** Show the speech-to-text microphone button when the browser supports it. */
  dictation?: boolean;
  /** Saved prompt library entries; renders the library button when non-empty. */
  quickPrompts?: QuickPrompt[];
  /** Called with the prompt text picked from the library (appended to the draft). */
  onInsertPrompt?: (prompt: string) => void;
}) {
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? ownRef;
  const fileRef = useRef<HTMLInputElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const libraryRef = useRef<HTMLDivElement>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const dictationBase = useRef("");
  const canAttach = Boolean(onAttachments);
  const files = attachments ?? [];
  const hasContent = Boolean(value.trim()) || files.length > 0;

  const filteredPrompts = useMemo(() => {
    const q = libraryQuery.trim().toLowerCase();
    const list = quickPrompts ?? [];
    if (!q) return list;
    return list.filter((p) => p.title.toLowerCase().includes(q) || p.prompt.toLowerCase().includes(q));
  }, [quickPrompts, libraryQuery]);

  const speech = useDictation(
    (transcript) => onChange([dictationBase.current, transcript].filter(Boolean).join(dictationBase.current ? " " : "")),
    (message) => toast.error(message),
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value, ref]);

  useEffect(() => {
    if (!toolsOpen) return;
    const close = (event: MouseEvent) => {
      if (!toolsRef.current?.contains(event.target as Node)) setToolsOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setToolsOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [toolsOpen]);

  useEffect(() => {
    if (!libraryOpen) return;
    const close = (event: MouseEvent) => {
      if (!libraryRef.current?.contains(event.target as Node)) setLibraryOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") { setLibraryOpen(false); setLibraryQuery(""); } };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [libraryOpen]);

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (busy || disabled || !hasContent) return;
    if (speech.listening) speech.stop();
    onSubmit();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  }

  async function addFiles(list: FileList | File[] | null) {
    if (!list || !onAttachments) return;
    const picked = Array.from(list);
    if (!picked.length) return;
    const { added, errors } = await readAttachments(picked, files);
    if (added.length) onAttachments([...files, ...added]);
    for (const error of errors.slice(0, 3)) toast.error(error);
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    if (!canAttach || !e.clipboardData.files.length) return;
    e.preventDefault();
    void addFiles(e.clipboardData.files);
  }

  function onDrop(e: DragEvent<HTMLFormElement>) {
    if (!canAttach) return;
    e.preventDefault();
    setDragging(false);
    void addFiles(e.dataTransfer.files);
  }

  function toggleDictation() {
    if (speech.listening) {
      speech.stop();
      return;
    }
    dictationBase.current = value.trim();
    speech.start();
  }

  const activeToolLabel = toolActions?.find((tool) => tool.id === activeTool)?.label;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full"
      onDragOver={(e) => { if (canAttach && e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragging(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
      onDrop={onDrop}
    >
      <div className={cn(
        "relative rounded-[28px] bg-surface p-2.5 shadow-[var(--shadow-prompt)] transition-[box-shadow,transform] duration-200",
        "focus-within:shadow-[var(--shadow-prompt-focus)]",
        dragging && "ring-2 ring-primary",
      )}>
        {dragging ? (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-[20px] bg-surface/90 text-sm font-medium text-primary">
            วางไฟล์ข้อความหรือโค้ดที่นี่
          </div>
        ) : null}
        {files.length ? (
          <ul className="flex flex-wrap gap-1.5 px-1 pt-1" aria-label="ไฟล์แนบ">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex max-w-full items-center gap-1.5 rounded-xl bg-clay py-1.5 pr-1 pl-2.5 text-xs">
                <FileText className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="max-w-[12rem] truncate font-medium">{file.name}</span>
                <span className="text-subtle">{formatBytes(file.size)}</span>
                <button
                  type="button"
                  aria-label={`เอา ${file.name} ออก`}
                  onClick={() => onAttachments?.(files.filter((_, i) => i !== index))}
                  className="grid size-6 place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {toolActions?.length ? (
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto px-1 pb-2 sm:hidden" aria-label="เลือกประเภทรัน">
            {toolActions.map((tool) => (
              <button
                key={tool.id}
                type="button"
                aria-pressed={activeTool === tool.id}
                onClick={() => onToolAction?.(tool.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTool === tool.id ? "bg-bg text-fg shadow-[var(--shadow-border)]" : "text-muted hover:text-fg",
                )}
              >
                {tool.label.split("•")[0]?.replace(/^[^\p{L}\p{N}]+/u, "").trim()}
              </button>
            ))}
          </div>
        ) : null}
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={speech.listening ? "กำลังฟัง… พูดได้เลยค่ะ" : placeholder}
          rows={1}
          disabled={disabled}
          maxLength={MAX_MESSAGE_LENGTH}
          aria-label={placeholder}
          className="block min-h-9 w-full resize-none bg-transparent px-2.5 py-1.5 text-[14px] leading-[1.4] text-fg placeholder:text-subtle outline-none disabled:opacity-60"
        />
        {contextualActions?.length ? (
          <div className="flex items-center gap-1.5 overflow-x-auto px-1 pb-1 pt-0.5 no-scrollbar">
            <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            {contextualActions.slice(0, 4).map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onContextAction?.(action)}
                disabled={busy}
                className="shrink-0 rounded-full bg-clay px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-hover hover:text-fg disabled:opacity-50"
              >
                {action}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex items-center gap-1 px-0.5 pb-0 pt-0.5">
          {canAttach ? (
            <>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept={ATTACHMENT_ACCEPT}
                className="hidden"
                onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }}
              />
              <button
                type="button"
                aria-label="แนบไฟล์"
                title="แนบไฟล์ข้อความ/โค้ด (ลากวางหรือวางได้)"
                onClick={() => fileRef.current?.click()}
                className="grid size-10 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-fg"
              >
                <Paperclip className="size-4" />
              </button>
            </>
          ) : null}
          {toolActions?.length ? (
            <div ref={toolsRef} className="relative hidden shrink-0 sm:block">
              <button
                type="button"
                aria-label="เลือกเครื่องมือ"
                aria-haspopup="menu"
                aria-expanded={toolsOpen}
                title={activeToolLabel ?? "เลือกเครื่องมือ"}
                onClick={() => setToolsOpen((open) => !open)}
                className={cn(
                  "flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-muted transition-colors hover:bg-hover hover:text-fg",
                  activeTool && activeTool !== "auto" && "bg-primary/10 text-primary",
                )}
              >
                <Wrench className="size-4" />
                {activeTool && activeTool !== "auto" ? (
                  <span className="hidden max-w-[7rem] truncate text-xs font-medium sm:inline">{activeToolLabel?.split("•")[0]?.trim()}</span>
                ) : null}
              </button>
              {toolsOpen ? (
                <div role="menu" className="anim-pop absolute bottom-12 left-0 z-30 w-72 overflow-hidden rounded-2xl border border-border bg-elevated p-1.5 shadow-2xl">
                  <p className="px-2.5 pt-1.5 pb-1 text-[0.7rem] font-medium tracking-[0.08em] text-subtle uppercase">เครื่องมือ</p>
                  {toolActions.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={activeTool === tool.id}
                      onClick={() => { onToolAction?.(tool.id); setToolsOpen(false); }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-fg transition-colors hover:bg-hover"
                    >
                      <span className="truncate">{tool.label}</span>
                      {activeTool === tool.id ? <Check className="size-4 shrink-0 text-primary" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {quickPrompts?.length && onInsertPrompt ? (
            <div ref={libraryRef} className="relative shrink-0">
              <button
                type="button"
                aria-label="คลังพรอมป์"
                aria-haspopup="menu"
                aria-expanded={libraryOpen}
                title="คลังพรอมป์ที่บันทึกไว้"
                onClick={() => { setLibraryOpen((open) => !open); setLibraryQuery(""); }}
                className={cn(
                  "grid size-10 place-items-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-fg",
                  libraryOpen && "bg-primary/10 text-primary",
                )}
              >
                <BookMarked className="size-4" />
              </button>
              {libraryOpen ? (
                <div role="menu" aria-label="คลังพรอมป์" className="anim-pop absolute bottom-12 left-0 z-30 w-80 overflow-hidden rounded-2xl border border-border bg-elevated p-1.5 shadow-2xl">
                  <p className="px-2.5 pt-1.5 pb-1 text-[0.7rem] font-medium tracking-[0.08em] text-subtle uppercase">คลังพรอมป์ • {quickPrompts.length}</p>
                  {quickPrompts.length > 4 ? (
                    <label className="relative mx-1 mb-1 block">
                      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" aria-hidden="true" />
                      <input
                        autoFocus
                        type="search"
                        value={libraryQuery}
                        onChange={(e) => setLibraryQuery(e.target.value)}
                        placeholder="ค้นหาพรอมป์…"
                        aria-label="ค้นหาพรอมป์"
                        className="h-9 w-full rounded-xl bg-clay pr-2 pl-8 text-sm outline-none placeholder:text-subtle focus:ring-1 focus:ring-primary/40"
                      />
                    </label>
                  ) : null}
                  <div className="max-h-72 overflow-y-auto">
                    {filteredPrompts.length === 0 ? (
                      <p className="px-2.5 py-4 text-center text-xs text-subtle">ไม่พบพรอมป์ที่ตรงกับ “{libraryQuery.trim()}”</p>
                    ) : filteredPrompts.map((prompt) => (
                      <button
                        key={prompt.id}
                        type="button"
                        role="menuitem"
                        onClick={() => { onInsertPrompt(prompt.prompt); setLibraryOpen(false); setLibraryQuery(""); ref.current?.focus(); }}
                        className="w-full rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-hover"
                      >
                        <span className="block truncate text-sm font-medium text-fg">{prompt.title}</span>
                        <span className="mt-0.5 block line-clamp-1 text-xs text-muted">{prompt.prompt}</span>
                      </button>
                    ))}
                  </div>
                  <p className="border-t border-border px-2.5 py-1.5 text-[10px] text-subtle">เพิ่ม/แก้ไขพรอมป์ได้ที่ ตั้งค่า → คลังพรอมป์</p>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="min-w-0">{extra}</div>
          {modelOptions?.length && onModelChange ? (
            <label className="min-w-0 max-w-[10rem] shrink">
              <span className="sr-only">เลือกโมเดล AI</span>
              <select
                value={selectedModel ?? modelOptions[0].id}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={busy}
                title="เลือกโมเดล Puter"
                className="h-9 max-w-full rounded-xl bg-clay px-2 text-[11px] font-medium text-muted outline-none transition-colors hover:text-fg focus:ring-1 focus:ring-primary disabled:opacity-50"
              >
                {modelOptions.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label} · {model.role}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {dictation && speech.supported ? (
            <button
              type="button"
              aria-label={speech.listening ? "หยุดพิมพ์ด้วยเสียง" : "พิมพ์ด้วยเสียง"}
              aria-pressed={speech.listening}
              title={speech.listening ? "หยุดพิมพ์ด้วยเสียง" : "พิมพ์ด้วยเสียง (ภาษาไทย)"}
              onClick={toggleDictation}
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-fg",
                speech.listening && "bg-danger/15 text-danger hover:text-danger animate-pulse",
              )}
            >
              <Mic className="size-4" />
            </button>
          ) : null}
          {onSendToGpt ? (
            <button type="button" aria-label="ส่งงานให้ GPT" title="ส่งงานนี้ให้ GPT ตรวจและทำต่อ" onClick={onSendToGpt} disabled={disabled || busy} className="grid size-10 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40">
              <span className="text-[11px] font-bold tracking-tight">GPT</span>
            </button>
          ) : null}
          {onEmergency ? (
            <button type="button" aria-label="แก้ด่วนฉุกเฉิน" title={busy ? "หยุดงานที่ค้าง แล้วให้สลี่ตรวจ แก้ รัน และ Verify ใหม่" : "ปลุกสลี่: ตรวจ แก้ รัน และ Verify ใหม่"} onClick={onEmergency} className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-danger/10 hover:text-danger", busy && "bg-danger/10 text-danger animate-pulse")}>
              <span className="text-[13px] font-bold leading-none">!</span>
            </button>
          ) : null}
          {onToggleVoice ? (
            <button
              type="button"
              aria-label={voiceEnabled ? "ปิดเสียงสลี่" : "เปิดเสียงสลี่"}
              title={voiceEnabled ? "ปิดเสียงสลี่" : "เปิดเสียงสลี่"}
              onClick={onToggleVoice}
              className="grid size-10 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-fg"
            >
              {voiceEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
          ) : null}
          <div className="ml-auto shrink-0">
            {busy ? (
              <Button type="button" size="icon" variant="primary" aria-label="หยุด" title="หยุด (Esc)" onClick={onStop} className="size-9 rounded-full">
                <Square className="size-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                variant="primary"
                aria-label="ส่ง"
                disabled={disabled || !hasContent}
                className={cn(
                  "accent-gradient size-11 rounded-full border-0 text-primary-fg shadow-lg transition-all duration-200",
                  "enabled:hover:scale-105 enabled:active:scale-95",
                  hasContent && "glow-breathe",
                )}
              >
                <ArrowUp className="size-5" strokeWidth={2.4} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
