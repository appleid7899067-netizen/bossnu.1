import { useEffect, useRef, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { ArrowUp, Paperclip, Square, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Composer({ value, onChange, onSubmit, onStop, placeholder, disabled, busy, extra }: {
  value: string; onChange: (next: string) => void; onSubmit: () => void; onStop?: () => void;
  placeholder: string; disabled?: boolean; busy?: boolean; extra?: ReactNode;\n  contextualActions?: string[]; onContextAction?: (action: string) => void; voiceEnabled?: boolean; onToggleVoice?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const el = ref.current; if (!el) return; el.style.height = "0px"; el.style.height = `${Math.min(el.scrollHeight, 180)}px`; }, [value]);
  function handleSubmit(e?: FormEvent) { e?.preventDefault(); if (busy || disabled || !value.trim()) return; onSubmit(); }
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }
  return <form onSubmit={handleSubmit} className="w-full">
    <div className={cn("rounded-[28px] bg-surface p-2.5 shadow-[var(--shadow-prompt)] transition-[box-shadow,transform] duration-200", "focus-within:shadow-[var(--shadow-prompt-focus)]")}>
      <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} rows={1} disabled={disabled} maxLength={12000}
        className="block min-h-12 w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed text-fg placeholder:text-subtle outline-none disabled:opacity-60" />
      {contextualActions?.length ? (\n        <div className="flex items-center gap-1.5 overflow-x-auto px-1 pb-1 pt-0.5 no-scrollbar">\n          <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden="true" />\n          {contextualActions.slice(0, 4).map((action) => (\n            <button key={action} type="button" onClick={() => onContextAction?.(action)} disabled={busy}\n              className="shrink-0 rounded-full bg-clay px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-hover hover:text-fg disabled:opacity-50">\n              {action}\n            </button>\n          ))}\n        </div>\n      ) : null}\n      <div className="flex items-center gap-1.5 px-1 pb-0.5 pt-1">
        <button type="button" aria-label="Attach" className="grid size-10 place-items-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-fg"><Paperclip className="size-4" /></button>
        <div className="min-w-0">{extra}</div>
        {onToggleVoice ? <button type="button" aria-label={voiceEnabled ? "ปิดเสียงสลี่" : "เปิดเสียงสลี่"} title={voiceEnabled ? "ปิดเสียงสลี่" : "เปิดเสียงสลี่"} onClick={onToggleVoice} className="grid size-10 place-items-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-fg">
          {voiceEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </button> : null}
        <div className="ml-auto">
          {busy ? <Button type="button" size="icon" variant="primary" aria-label="Stop" onClick={onStop} className="size-11 rounded-full"><Square className="size-3.5 fill-current" /></Button>
            : <Button type="submit" size="icon" variant="primary" aria-label="Send" disabled={disabled || !value.trim()} className="size-11 rounded-full"><ArrowUp className="size-5" strokeWidth={2.4} /></Button>}
        </div>
      </div>
    </div>
  </form>;
}