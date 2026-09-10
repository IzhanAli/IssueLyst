import { cn } from "@/lib/utils/cn";

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-border-strong bg-surface px-1 font-mono text-[10.5px] font-medium leading-none text-text-muted shadow-[0_1px_0_var(--border-strong)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
