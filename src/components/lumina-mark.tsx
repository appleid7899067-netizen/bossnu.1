import { cn } from "@/lib/utils";

export function BossnuSileloMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-label="DeepSeek">
      <path d="M16 2.8c7.3 0 13.2 5.9 13.2 13.2S23.3 29.2 16 29.2 2.8 23.3 2.8 16 8.7 2.8 16 2.8Z" fill="currentColor" />
      <path d="M8.1 17.6c2.1-3 4.2-4.3 6.3-4.1 2.7.2 4.1 3.6 7.2 3.6 1.3 0 2.5-.5 3.7-1.6-.5 4.5-4.2 7.8-8.8 7.8-4.3 0-7.8-2.4-8.4-5.7Z" fill="white" />
      <circle cx="20.8" cy="12" r="1.1" fill="white" />
    </svg>
  );
}

export function LuminaWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 text-fg">
      <BossnuSileloMark className="size-8 text-primary" />
      {!compact ? <span className="font-display text-[19px] font-semibold tracking-tight">DeepSeek</span> : null}
    </div>
  );
}

export const LuminaMark = BossnuSileloMark;
