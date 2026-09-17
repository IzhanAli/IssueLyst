import { cn } from "@/lib/utils/cn";

/** Brand mark — team, upward trend and issue list. Raster, so pick the source by rendered size. */
export function LogoMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <img
      src={size > 32 ? "/brand/logo-128.png" : "/brand/logo-64.png"}
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
      <span className="font-serif text-[17px] font-semibold tracking-[-0.01em] text-text">IssueLyst</span>
    </span>
  );
}
