import { cn } from "@/lib/utils/cn";

/** Radiating burst — the Claude Code entry point.  Inherits currentColor. */
export function ClaudeMark({ size = 14, className }: { size?: number; className?: string }) {
  const rays = [0, 30, 62, 90, 118, 150, 180, 210, 242, 270, 298, 330];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cn("shrink-0", className)} aria-hidden>
      <g stroke="currentColor" strokeLinecap="round">
        {rays.map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const inner = 2.6;
          const outer = i % 2 === 0 ? 10 : 7.6;
          return (
            <line
              key={deg}
              x1={12 + Math.cos(rad) * inner}
              y1={12 + Math.sin(rad) * inner}
              x2={12 + Math.cos(rad) * outer}
              y2={12 + Math.sin(rad) * outer}
              strokeWidth={i % 2 === 0 ? 2.1 : 1.5}
            />
          );
        })}
      </g>
    </svg>
  );
}
