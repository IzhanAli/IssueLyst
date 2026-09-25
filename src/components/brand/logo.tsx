import { cn } from "@/lib/utils/cn";

/** Brand mark — an "I" beside a shrinking issue list. Source of every favicon too: `npm run icons`. */
export function LogoMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/brand/logo.svg"
      width={size}
      height={size}
      alt=""
      aria-hidden
      draggable={false}
      className={cn("shrink-0 select-none", className)}
    />
  );
}

export function Wordmark({ className, markSize = 22 }: { className?: string; markSize?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={markSize} />
      <span className="font-display text-[17px] font-semibold tracking-[-0.01em] text-text">IssueLyst</span>
    </span>
  );
}
