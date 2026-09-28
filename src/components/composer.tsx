import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { ArrowUp, Check, FileText, Mic, Paperclip, Square, Sparkles, Volume2, VolumeX, Wrench, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ATTACHMENT_ACCEPT, formatBytes, readAttachments } from "@/lib/attachments";
import { useDictation } from "@/lib/ai/use-dictation";
import type { ChatAttachment } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { PuterModelOption } from "@/lib/ai/models";

export type ToolAction = { id: string; label: string };

export function Composer({
  value, onChange, onSubmit, onStop, placeholder, disabled, busy, extra,
  selectedModel, modelOptions, onModelChange,
  contextualActions, onContextAction, voiceEnabled, onToggleVoice,
  toolActions, activeTool, onToolAction,
  attachments, onAttachments, inputRef, dictation = true,
}: {
  value: string;
  selectedModel?: string;
  modelOptions?: PuterModelOption[];
  onModelChange?: (model: string) => void;
  onChange: (next: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
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
}) {
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? ownRef;
  const fileRef = useRef<HTMLInputElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dictationBase = useRef("");
  const canAttach = Boolean(onAttachments);
  const files = attachments ?? [];
  const hasContent = Boolean(value.trim()) || files.length > 0;

  const speech = useDictation(
    (transcript) => onChange([dictationBase.current, transcript].filter(Boolean).join(dictationBase.current ? " " : "")),
    (message) => toast.error(message),
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
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
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-[28px] bg-surface/90 text-sm font-medium text-primary">
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
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={speech.listening ? "กำลังฟัง… พูดได้เลยค่ะ" : placeholder}
          rows={1}
          disabled={disabled}
          maxLength={12000}
          aria-label={placeholder}
          className="block min-h-12 w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed text-fg placeholder:text-subtle outline-none disabled:opacity-60"
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
        <div className="flex items-center gap-1 px-1 pb-0.5 pt-1">
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
            <div ref={toolsRef} className="relative shrink-0">
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
                <div role="menu" className="absolute bottom-12 left-0 z-30 w-72 overflow-hidden rounded-2xl border border-border bg-elevated p-1.5 shadow-2xl">
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
              <Button type="button" size="icon" variant="primary" aria-label="หยุด" title="หยุด (Esc)" onClick={onStop} className="size-11 rounded-full">
                <Square className="size-3.5 fill-current" />
              </Button>
            ) : (
              <Button type="submit" size="icon" variant="primary" aria-label="ส่ง" disabled={disabled || !hasContent} className="size-11 rounded-full">
                <ArrowUp className="size-5" strokeWidth={2.4} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
