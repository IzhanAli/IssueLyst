import { cn } from "@/lib/utils/cn";

/** Geometric mark — three offset planes suggesting stacked issues/lanes. */
export function LogoMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" className={cn("shrink-0", className)} aria-hidden>
      <rect x="3" y="3" width="22" height="22" rx="6.5" fill="var(--primary)" />
      <rect x="7" y="8" width="14" height="2.6" rx="1.3" fill="white" opacity="0.95" />
      <rect x="7" y="12.7" width="10" height="2.6" rx="1.3" fill="white" opacity="0.7" />
      <rect x="7" y="17.4" width="6.5" height="2.6" rx="1.3" fill="white" opacity="0.5" />
    </svg>
  );
}

export function Wordmark({ className, markSize = 22 }: { className?: string; markSize?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={markSize} />
      <span className="font-serif text-[17px] font-semibold tracking-[-0.01em] text-text">IssueLyst</span>
    </span>
  );
}
