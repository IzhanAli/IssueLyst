import type { Status, StatusIcon as StatusIconKind } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

/** Circular progress-style status glyph, colored by the status token. */
export function StatusIcon({
  status,
  size = 15,
  className,
}: {
  status: Pick<Status, "color" | "icon" | "category">;
  size?: number;
  className?: string;
}) {
  const c = status.color;
  const kind = status.icon as StatusIconKind;
  const r = 6.5;
  const circ = 2 * Math.PI * r;

  // fraction of the ring filled for "started" states
  const fraction = kind === "progress" ? 0.45 : kind === "review" ? 0.75 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {kind === "backlog" && (
        <circle cx="8" cy="8" r={r} fill="none" stroke={c} strokeWidth="1.6" strokeDasharray="1.6 2.2" />
      )}
      {kind === "open" && (
        <circle cx="8" cy="8" r={r} fill="none" stroke={c} strokeWidth="1.6" />
      )}
      {(kind === "progress" || kind === "review") && (
        <>
          <circle cx="8" cy="8" r={r} fill="none" stroke={c} strokeWidth="1.6" opacity="0.35" />
          <circle
            cx="8"
            cy="8"
            r={r}
            fill="none"
            stroke={c}
            strokeWidth="3.2"
            strokeDasharray={`${circ * fraction} ${circ}`}
            strokeLinecap="butt"
            transform="rotate(-90 8 8)"
            style={{ transitionProperty: "stroke-dasharray", transitionDuration: "180ms" }}
          />
        </>
      )}
      {kind === "done" && (
        <>
          <circle cx="8" cy="8" r={r + 0.5} fill={c} />
          <path d="M5.2 8.2l1.9 1.9 3.6-3.9" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {kind === "closed" && (
        <>
          <circle cx="8" cy="8" r={r + 0.5} fill={c} />
          <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
