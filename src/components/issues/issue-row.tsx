"use client";

import { MessageSquare, Paperclip, Calendar } from "lucide-react";
import type { FieldDef, IssueView, Priority } from "@/lib/types";
import { StatusIcon } from "./status-icon";
import { PriorityIcon } from "./priority-icon";
import { Avatar, AvatarEmpty } from "@/components/ui/avatar";
import { LabelChip } from "./badges";
import { StatusPicker, PriorityPicker, AssigneePicker } from "./pickers";
import { FieldEditor, FieldValueDisplay } from "@/components/fields/field-controls";
import { fieldColWidth } from "@/lib/fields";
import { useStore } from "@/lib/store/store";
import { usePermissions } from "@/lib/auth/use-permissions";
import { shortDate, isOverdue } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function IssueRow({
  view,
  active,
  selected,
  onOpen,
  onToggleSelect,
  showStatus = true,
  fields = [],
}: {
  view: IssueView;
  active?: boolean;
  selected?: boolean;
  onOpen: () => void;
  onToggleSelect?: (additive: boolean) => void;
  showStatus?: boolean;
  fields?: FieldDef[];
}) {
  const updateIssue = useStore((s) => s.updateIssue);
  const setIssueFieldValue = useStore((s) => s.setIssueFieldValue);
  const editable = usePermissions().canEdit(view);
  const overdue = isOverdue(view.dueDate, view.closedAt);
  const done = view.status.category === "completed" || view.status.category === "canceled";

  return (
    <div
      data-active={active}
      onClick={onOpen}
      className={cn(
        "group flex h-[38px] cursor-pointer select-none items-center gap-2.5 border-b border-border/70 pl-2.5 pr-3 transition-colors",
        "hover:bg-surface-hover data-[active=true]:bg-primary-soft/60",
        selected && "bg-primary-soft/40",
      )}
    >
      {/* leading controls (fixed cell so columns align with the header) */}
      <div className="flex w-[130px] shrink-0 items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(e.shiftKey); }}
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
            selected
              ? "border-primary bg-primary text-primary-fg"
              : "border-border-strong opacity-0 hover:border-text-subtle group-hover:opacity-100",
          )}
          aria-label={selected ? "Deselect" : "Select"}
        >
          {selected && (
            <svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2.5 6.5l2.2 2.2L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <PriorityPicker value={view.priority} onChange={(p: Priority) => updateIssue(view.id, { priority: p })} disabled={!editable}>
          <button onClick={(e) => e.stopPropagation()} className="shrink-0 rounded p-0.5 hover:bg-surface-active" aria-label="Priority">
            <PriorityIcon priority={view.priority} />
          </button>
        </PriorityPicker>

        {showStatus && (
          <StatusPicker value={view.statusId} onChange={(id) => updateIssue(view.id, { statusId: id })} disabled={!editable}>
            <button onClick={(e) => e.stopPropagation()} className="shrink-0 rounded p-0.5 hover:bg-surface-active" aria-label="Status">
              <StatusIcon status={view.status} />
            </button>
          </StatusPicker>
        )}

        <span className="shrink-0 font-mono text-[11.5px] text-text-subtle">{view.issueKey}</span>
      </div>

      {/* title + labels (fixed-width name column, wide enough to avoid ellipsis) */}
      <span className="flex w-[300px] shrink-0 items-center gap-2 overflow-hidden lg:w-[400px]">
        <span className={cn("min-w-0 flex-1 truncate text-[13.5px] font-medium text-text", done && "font-normal text-text-muted")}>
          {view.title}
        </span>
        {view.labels.length > 0 && (
          <span className="hidden shrink-0 items-center gap-1 overflow-hidden lg:flex">
            {view.labels.slice(0, 3).map((l) => (
              <LabelChip key={l.id} label={l} />
            ))}
            {view.labels.length > 3 && <span className="text-[11px] text-text-subtle">+{view.labels.length - 3}</span>}
          </span>
        )}
      </span>

      {/* dynamic field cells */}
      {fields.map((f) => (
        <div
          key={f.id}
          className="hidden shrink-0 md:flex"
          style={{ width: fieldColWidth(f) }}
          onClick={(e) => e.stopPropagation()}
        >
          <FieldEditor field={f} value={view.fields?.[f.id] ?? null} onChange={(v) => setIssueFieldValue(view.id, f.id, v)} disabled={!editable}>
            <button className="flex w-full min-w-0 items-center rounded px-1 py-0.5 text-left hover:bg-surface-active">
              <FieldValueDisplay field={f} value={view.fields?.[f.id] ?? null} muted />
            </button>
          </FieldEditor>
        </div>
      ))}

      {/* flexible spacer — pins trailing meta right, collapses to allow scroll */}
      <span className="min-w-0 flex-1" />

      {/* due */}
      <span className="hidden w-[64px] shrink-0 justify-end sm:flex">
        {view.dueDate && (
          <span className={cn("flex items-center gap-1 font-mono text-[11px]", overdue ? "text-danger" : "text-text-subtle")}>
            <Calendar size={12} /> {shortDate(view.dueDate)}
          </span>
        )}
      </span>

      {/* comments + attachments */}
      <span className="hidden w-[52px] shrink-0 items-center justify-end gap-2 text-text-subtle sm:flex">
        {view.attachmentCount > 0 && (
          <span className="flex items-center gap-0.5 text-[11px]"><Paperclip size={11} />{view.attachmentCount}</span>
        )}
        {view.commentCount > 0 && (
          <span className="flex items-center gap-0.5 text-[11px]"><MessageSquare size={11} />{view.commentCount}</span>
        )}
      </span>

      {/* assignee */}
      <AssigneePicker value={view.assigneeId} onChange={(id) => updateIssue(view.id, { assigneeId: id })} placement="bottom-end" disabled={!editable}>
        <button onClick={(e) => e.stopPropagation()} className="shrink-0 rounded-full" aria-label="Assignee">
          {view.assignee ? <Avatar user={view.assignee} size="md" /> : <AvatarEmpty size="md" />}
        </button>
      </AssigneePicker>
    </div>
  );
}
