import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "default" | "ghost" | "subtle" | "danger";
type Size = "xs" | "sm" | "md";

// Rounded rectangles, never pills: the radius tops out at 10px.
const base =
  "inline-flex items-center justify-center gap-1.5 font-display font-semibold tracking-[-0.005em] whitespace-nowrap transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 focus-ring select-none";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  default: "border border-border-strong bg-surface text-text hover:bg-surface-2",
  ghost: "text-text-muted hover:bg-surface-hover hover:text-text",
  subtle: "bg-surface-2 text-text hover:bg-surface-hover",
  danger: "bg-signal text-signal-fg hover:bg-signal-hover",
};

const sizes: Record<Size, string> = {
  xs: "h-6 rounded-[7px] px-2 text-[12px]",
  sm: "h-7 rounded-[8px] px-2.5 text-[12.5px]",
  md: "h-8 rounded-[10px] px-3 text-[13px]",
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
  const dims = { xs: "h-6 w-6 rounded-[7px]", sm: "h-7 w-7 rounded-[8px]", md: "h-8 w-8 rounded-[10px]" }[size];
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], dims, "px-0", className)}
      {...props}
    />
  );
});
IconButton.displayName = "IconButton";
