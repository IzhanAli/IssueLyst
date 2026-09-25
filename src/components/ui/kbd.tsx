import { cn } from "@/lib/utils/cn";

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[19px] min-w-[19px] items-center justify-center rounded-[5px] border border-border bg-surface px-1 font-display text-[11px] font-semibold leading-none text-text-muted shadow-[0_1px_0_var(--border-strong)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
