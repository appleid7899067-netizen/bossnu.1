import { cn } from "@/lib/utils";

export function BossnuSileloMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      aria-label="Bossnu.Silelo"
    >
      <rect width="32" height="32" rx="10" fill="currentColor" />
      <path
        d="M8 21.5c3.2-1.4 5.4-4.8 8-8.6 2.6 3.8 4.8 7.2 8 8.6"
        fill="none"
        stroke="var(--color-primary-fg)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="16" cy="11.2" r="2.2" fill="var(--color-primary-fg)" />
    </svg>
  );
}

export function LuminaWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 text-fg">
      <BossnuSileloMark className="size-8 text-primary" />
      {!compact ? (
        <span className="font-display text-xl font-medium tracking-tight">
          Bossnu.Silelo
        </span>
      ) : null}
    </div>
  );
}

export const LuminaMark = BossnuSileloMark;
