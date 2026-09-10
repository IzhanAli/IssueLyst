import { MessageSquare, Paperclip, Calendar } from "lucide-react";
import type { IssueView, Priority } from "@/lib/types";
import { PriorityIcon } from "./priority-icon";
import { Avatar, AvatarEmpty } from "@/components/ui/avatar";
import { LabelChip } from "./badges";
import { PriorityPicker, AssigneePicker } from "./pickers";
import { useStore } from "@/lib/store/store";
import { usePermissions } from "@/lib/auth/use-permissions";
import { shortDate, isOverdue } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function IssueCard({
  view,
  onOpen,
  dragging,
}: {
  view: IssueView;
  onOpen?: () => void;
  dragging?: boolean;
}) {
  const updateIssue = useStore((s) => s.updateIssue);
  const editable = usePermissions().canEdit(view);
  const overdue = isOverdue(view.dueDate, view.closedAt);

  return (
    <div
      onClick={onOpen}
      className={cn(
        "group cursor-pointer select-none rounded-lg border border-border bg-surface p-2.5 shadow-[var(--shadow-sm)] transition-shadow",
        dragging ? "shadow-[var(--shadow-lg)] rotate-[1.2deg]" : "hover:border-border-strong hover:shadow-[var(--shadow-md)]",
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <PriorityPicker value={view.priority} onChange={(p: Priority) => updateIssue(view.id, { priority: p })} disabled={!editable}>
          <button onClick={(e) => e.stopPropagation()} className="rounded p-0.5 hover:bg-surface-hover" aria-label="Priority">
            <PriorityIcon priority={view.priority} />
          </button>
        </PriorityPicker>
        <span className="font-mono text-[10.5px] text-text-subtle">{view.issueKey}</span>
        {view.dueDate && (
          <span className={cn("ml-auto flex items-center gap-0.5 font-mono text-[10px]", overdue ? "text-danger" : "text-text-subtle")}>
            <Calendar size={10} /> {shortDate(view.dueDate)}
          </span>
        )}
      </div>

      <p className="mb-2 line-clamp-3 text-[13px] leading-snug text-text">{view.title}</p>

      {view.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {view.labels.slice(0, 3).map((l) => (
            <LabelChip key={l.id} label={l} />
          ))}
          {view.labels.length > 3 && <span className="text-[10px] text-text-subtle">+{view.labels.length - 3}</span>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-text-subtle">
          {view.commentCount > 0 && <span className="flex items-center gap-0.5 text-[10.5px]"><MessageSquare size={11} />{view.commentCount}</span>}
          {view.attachmentCount > 0 && <span className="flex items-center gap-0.5 text-[10.5px]"><Paperclip size={11} />{view.attachmentCount}</span>}
        </div>
        <div className="ml-auto">
          <AssigneePicker value={view.assigneeId} onChange={(id) => updateIssue(view.id, { assigneeId: id })} placement="bottom-end" disabled={!editable}>
            <button onClick={(e) => e.stopPropagation()} className="rounded-full" aria-label="Assignee">
              {view.assignee ? <Avatar user={view.assignee} size="sm" /> : <AvatarEmpty size="sm" />}
            </button>
          </AssigneePicker>
        </div>
      </div>
    </div>
  );
}
