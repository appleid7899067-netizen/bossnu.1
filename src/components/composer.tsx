import { useEffect, useRef, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  placeholder,
  disabled,
  busy,
  extra,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  placeholder: string;
  disabled?: boolean;
  busy?: boolean;
  extra?: ReactNode;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [value]);

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (busy || disabled) return;
    if (!value.trim()) return;
    onSubmit();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={cn(
          "rounded-2xl bg-elevated p-2 shadow-[var(--shadow-border)]",
          "focus-within:shadow-[var(--shadow-border-hover)]",
          "transition-[box-shadow] duration-150 ease-out",
        )}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          maxLength={4000}
          className="block w-full resize-none bg-transparent px-3 pt-2.5 pb-1.5 text-[0.975rem] leading-relaxed text-fg placeholder:text-subtle outline-none disabled:opacity-60"
        />
        <div className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-1">
          <div className="min-w-0">{extra}</div>
          {busy ? (
            onStop ? (
              <Button
                type="button"
                size="icon-sm"
                variant="primary"
                aria-label="Stop"
                onClick={onStop}
              >
                <Square className="size-3.5 fill-current" />
              </Button>
            ) : (
              <Button type="button" size="icon-sm" variant="primary" disabled aria-label="Working">
                <ArrowUp className="size-4 opacity-40" strokeWidth={2.4} />
              </Button>
            )
          ) : (
            <Button
              type="submit"
              size="icon-sm"
              variant="primary"
              aria-label="Send"
              disabled={disabled || !value.trim()}
            >
              <ArrowUp className="size-4" strokeWidth={2.4} />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
