import type { Label, Priority, Status } from "@/lib/types";
import { PRIORITY_META } from "@/lib/constants";
import { StatusIcon } from "./status-icon";
import { PriorityIcon } from "./priority-icon";
import { cn } from "@/lib/utils/cn";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap font-display text-[12.5px] font-semibold", className)}
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
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap font-display text-[12.5px] font-semibold", className)} style={{ color: priority === "none" ? "var(--text-subtle)" : meta.color }}>
      <PriorityIcon priority={priority} />
      {meta.label}
    </span>
  );
}

/** A neutral chip: the label's own color lives in the swatch, never the plate. */
export function LabelChip({ label, className, onRemove }: { label: Label; className?: string; onRemove?: () => void }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[6px] bg-surface-2 px-1.5 py-[1px] font-display text-[11.5px] font-semibold leading-[17px] text-text shadow-[inset_0_0_0_1px_var(--border)]",
        className,
      )}
    >
      <span className="h-2 w-2 shrink-0 rounded-[2.5px]" style={{ backgroundColor: label.color }} />
      {label.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-0.5 rounded-[4px] text-text-subtle hover:text-text"
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
  return <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: color }} />;
}
