import { cn } from "@/lib/utils";

/** PANUPANXBOSS — the small orbit mark used throughout the app. */
export function BossnuSileloMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("shrink-0", animated && "brand-orbit", className)} aria-label="PANUPANXBOSS" role="img">
      <defs><linearGradient id="boss-gradient" x1="4" y1="4" x2="36" y2="36"><stop stopColor="var(--color-primary-container)"/><stop offset="1" stopColor="var(--color-tertiary-container)"/></linearGradient></defs>
      <circle cx="20" cy="20" r="17" fill="url(#boss-gradient)" />
      <path d="M12 28V11h8.2a5.8 5.8 0 0 1 0 11.6H16" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <path d="m24 12 9 16M33 12l-9 16" fill="none" stroke="white" strokeWidth="2.7" strokeLinecap="round" />
      <circle cx="33" cy="8" r="2" fill="var(--color-tertiary)" className={animated ? "brand-spark" : undefined} />
    </svg>
  );
}

export function LuminaWordmark({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-2.5 text-fg"><BossnuSileloMark animated className="size-8 text-primary" />{!compact ? <span className="m3-title-md !text-[17px] font-bold tracking-tight">PANUPANX<span className="text-primary">BOSS</span></span> : null}</div>;
}

export const LuminaMark = BossnuSileloMark;
