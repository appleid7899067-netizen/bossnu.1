import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * MATA button set — Material 3 button roles:
 * filled (primary), tonal, outlined, text and elevated.
 * Pill shape, 40dp default height, label-large type, state-layer hover.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium tracking-[.1px] select-none disabled:pointer-events-none disabled:opacity-38 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  {
    variants: {
      variant: {
        // M3 filled button
        primary:
          "bg-primary text-primary-fg hover:bg-primary-hover active:not-disabled:scale-[.98]",
        // M3 tonal button
        tonal:
          "bg-secondary-container text-on-secondary-container hover:bg-[color-mix(in_srgb,var(--color-secondary-container)_88%,var(--color-on-secondary-container))] active:not-disabled:scale-[.98]",
        // M3 outlined button
        outline:
          "border border-outline bg-transparent text-primary hover:bg-[var(--state-hover)] active:not-disabled:scale-[.98]",
        // M3 text button
        ghost:
          "bg-transparent text-primary hover:bg-[var(--state-hover)] active:not-disabled:scale-[.98]",
        // M3 elevated button
        subtle:
          "bg-elevated text-fg shadow-[var(--shadow-e1)] hover:shadow-[var(--shadow-e2)] hover:bg-hover active:not-disabled:scale-[.98]",
      },
      size: {
        sm: "h-8 rounded-full px-3 text-[13px]",
        md: "h-10 rounded-full px-6 text-sm",
        lg: "h-12 rounded-full px-8 text-[15px]",
        icon: "size-10 rounded-full",
        "icon-sm": "size-8 rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type={type}
      className={cn(
        buttonVariants({ variant, size }),
        "transition-[background-color,box-shadow,transform,opacity] duration-200 [transition-timing-function:var(--ease-standard)]",
        className,
      )}
      {...props}
    />
  );
}
