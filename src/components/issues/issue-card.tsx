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
        "group cursor-pointer select-none rounded-[14px] bg-surface p-3 shadow-[inset_0_0_0_1px_var(--border),var(--shadow-sm)] transition-[box-shadow,transform] duration-150",
        dragging
          ? "rotate-[1.5deg] scale-[1.02] shadow-[inset_0_0_0_1px_var(--border-strong),var(--shadow-lg)]"
          : "hover:-translate-y-px hover:shadow-[inset_0_0_0_1px_var(--border-strong),var(--shadow-md)]",
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <PriorityPicker value={view.priority} onChange={(p: Priority) => updateIssue(view.id, { priority: p })} disabled={!editable}>
          <button onClick={(e) => e.stopPropagation()} className="rounded-[6px] p-0.5 transition-colors hover:bg-surface-hover" aria-label="Priority">
            <PriorityIcon priority={view.priority} />
          </button>
        </PriorityPicker>
        <span className="font-display text-[12px] font-semibold text-text-subtle">{view.issueKey}</span>
        {view.dueDate && (
          <span className={cn("ml-auto flex items-center gap-1 font-display text-[11.5px] font-semibold", overdue ? "text-danger" : "text-text-subtle")}>
            <Calendar size={11} strokeWidth={2.3} /> {shortDate(view.dueDate)}
          </span>
        )}
      </div>

      <p className="mb-2.5 line-clamp-3 text-[13.5px] font-medium leading-snug text-text">{view.title}</p>

      {view.labels.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1">
          {view.labels.slice(0, 3).map((l) => (
            <LabelChip key={l.id} label={l} />
          ))}
          {view.labels.length > 3 && <span className="self-center font-display text-[11.5px] font-semibold text-text-subtle">+{view.labels.length - 3}</span>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-text-subtle">
          {view.commentCount > 0 && <span className="flex items-center gap-0.5 font-display text-[11.5px] font-semibold"><MessageSquare size={12} strokeWidth={2.3} />{view.commentCount}</span>}
          {view.attachmentCount > 0 && <span className="flex items-center gap-0.5 font-display text-[11.5px] font-semibold"><Paperclip size={12} strokeWidth={2.3} />{view.attachmentCount}</span>}
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
