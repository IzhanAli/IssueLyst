import type { Label, Priority, Status } from "@/lib/types";
import { PRIORITY_META } from "@/lib/constants";
import { StatusIcon } from "./status-icon";
import { PriorityIcon } from "./priority-icon";
import { readableTextOn } from "@/lib/utils/color";
import { cn } from "@/lib/utils/cn";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium", className)}
      style={{ color: status.color }}
    >
      <StatusIcon status={status} />
      {status.name}
    </span>
  );
}

export function PriorityLabel({ priority, className }: { priority: Priority; className?: string }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px]", className)} style={{ color: priority === "none" ? "var(--text-subtle)" : meta.color }}>
      <PriorityIcon priority={priority} />
      {meta.label}
    </span>
  );
}

export function LabelChip({ label, className, onRemove }: { label: Label; className?: string; onRemove?: () => void }) {
  const fg = readableTextOn(label.color);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[11px] font-semibold leading-[16px]",
        className,
      )}
      style={{ color: fg, backgroundColor: `color-mix(in srgb, ${label.color} 84%, var(--surface))` }}
    >
      {label.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-0.5 ml-0.5 rounded-full opacity-70 hover:opacity-100"
          aria-label={`Remove ${label.name}`}
        >
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  );
}

export function LabelDot({ color }: { color: string }) {
  return <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />;
}
