import type { Priority } from "@/lib/types";
import { PRIORITY_META } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

const BARS: Record<Priority, number> = { urgent: 3, high: 3, medium: 2, low: 1, none: 0 };

/** Signal-bar priority glyph. Urgent renders solid + accented. */
export function PriorityIcon({
  priority,
  size = 15,
  className,
}: {
  priority: Priority;
  size?: number;
  className?: string;
}) {
  const color = PRIORITY_META[priority].color;
  const filled = BARS[priority];

  if (priority === "none") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" className={cn("shrink-0", className)} aria-hidden>
        {[0, 1, 2].map((i) => (
          <rect key={i} x={2 + i * 4} y={10 - i * 0} width="2.6" height="4" rx="0.8" fill="var(--text-subtle)" opacity="0.4" />
        ))}
      </svg>
    );
  }

  if (priority === "urgent") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" className={cn("shrink-0", className)} aria-hidden>
        <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" fill={color} />
        <rect x="7" y="4" width="2" height="5" rx="1" fill="white" />
        <circle cx="8" cy="11.4" r="1.1" fill="white" />
      </svg>
    );
  }

  const heights = [4, 7, 10];
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={cn("shrink-0", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={2 + i * 4}
          y={13 - heights[i]}
          width="2.6"
          height={heights[i]}
          rx="0.8"
          fill={color}
          opacity={i < filled ? 1 : 0.22}
        />
      ))}
    </svg>
  );
}
