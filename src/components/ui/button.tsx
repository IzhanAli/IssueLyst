import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "default" | "ghost" | "subtle" | "danger";
type Size = "xs" | "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 focus-ring select-none";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover shadow-[var(--shadow-sm)]",
  default: "border border-border bg-surface text-text hover:bg-surface-hover",
  ghost: "text-text-muted hover:bg-surface-hover hover:text-text",
  subtle: "bg-surface-2 text-text hover:bg-surface-hover",
  danger: "bg-danger text-white hover:brightness-95",
};

const sizes: Record<Size, string> = {
  xs: "h-6 px-2 text-[12px]",
  sm: "h-7 px-2.5 text-[12.5px]",
  md: "h-8 px-3 text-[13px]",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", className, ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  ),
);
Button.displayName = "Button";

export const IconButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ variant = "ghost", size = "md", className, ...props }, ref) => {
  const dims = { xs: "h-6 w-6", sm: "h-7 w-7", md: "h-8 w-8" }[size];
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], dims, "px-0", className)}
      {...props}
    />
  );
});
IconButton.displayName = "IconButton";
