import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium select-none disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-fg hover:bg-primary-hover active:not-disabled:scale-[0.96]",
        ghost:
          "text-fg hover:bg-fg/6 active:not-disabled:scale-[0.96]",
        outline:
          "bg-elevated text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)] active:not-disabled:scale-[0.96]",
        subtle:
          "bg-clay text-clay-fg hover:bg-clay/80 active:not-disabled:scale-[0.96]",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-lg",
        md: "h-11 px-4 text-sm rounded-xl",
        lg: "h-12 px-5 text-[0.9375rem] rounded-xl",
        icon: "size-11 rounded-xl",
        "icon-sm": "size-9 rounded-lg",
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
        "transition-[scale,background-color,box-shadow,opacity] duration-150 ease-out",
        className,
      )}
      {...props}
    />
  );
}
