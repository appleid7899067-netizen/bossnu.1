import { cn } from "@/lib/utils";

/** Animated pill switch — the shared control used in settings and the sidebar. */
export function Switch({
  label,
  description,
  value,
  onChange,
  compact = false,
  ariaLabel,
  className,
}: {
  label?: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  compact?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  if (compact) {
    return (
      <button type="button" role="switch" aria-checked={value} aria-label={ariaLabel ?? label} onClick={() => onChange(!value)} className={cn("shrink-0", className)}>
        <span className="switch" data-on={value}><span className="knob" /></span>
      </button>
    );
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel ?? label}
      onClick={() => onChange(!value)}
      className={cn("flex w-full items-center justify-between gap-4 py-3 text-left", className)}
    >
      <span className="min-w-0">
        {label ? <span className="block text-sm font-medium">{label}</span> : null}
        {description ? <span className="mt-0.5 block text-xs leading-relaxed text-subtle">{description}</span> : null}
      </span>
      <span className="switch shrink-0" data-on={value}><span className="knob" /></span>
    </button>
  );
}
