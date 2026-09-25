import { forwardRef, useEffect, useRef, useState } from "react";
import {
  X,
  Link2,
  MoreHorizontal,
  Trash2,
  Calendar,
  Plus,
  ArrowUpRight,
  Pencil,
} from "lucide-react";
import { useStore } from "@/lib/store/store";
import { toIssueView } from "@/lib/store/selectors";
import { StatusIcon } from "../status-icon";
import { PriorityIcon } from "../priority-icon";
import { Avatar, AvatarEmpty } from "@/components/ui/avatar";
import { LabelChip } from "../badges";
import { StatusPicker, PriorityPicker, AssigneePicker, LabelPicker } from "../pickers";
import { FieldEditor, FieldValueDisplay } from "@/components/fields/field-controls";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { DescriptionEditor } from "./description-editor";
import { ActivityFeed } from "./activity-feed";
import { CommentComposer } from "./comment-composer";
import { Attachments } from "./attachments";
import { SendToClaude } from "./send-to-claude";
import { PRIORITY_META } from "@/lib/constants";
import { relativeTime, shortDate, fullDateTime, isOverdue } from "@/lib/utils/format";
import { toast } from "@/components/ui/toast";
import { usePermissions } from "@/lib/auth/use-permissions";
import { cn } from "@/lib/utils/cn";
import type { Priority } from "@/lib/types";

export function IssueDetail({
  issueId,
  variant = "drawer",
  onClose,
  onNavigateFull,
}: {
  issueId: string;
  variant?: "drawer" | "page";
  onClose?: () => void;
  onNavigateFull?: () => void;
}) {
  const store = useStore();
  const issue = store.issues.find((i) => i.id === issueId);
  const updateIssue = useStore((s) => s.updateIssue);
  const toggleLabel = useStore((s) => s.toggleLabel);
  const deleteIssue = useStore((s) => s.deleteIssue);
  const addComment = useStore((s) => s.addComment);
  const setIssueFieldValue = useStore((s) => s.setIssueFieldValue);
  const fieldDefs = [...store.fieldDefs].sort((a, b) => a.position - b.position);
  const perms = usePermissions();

  if (!issue) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-text-subtle">
        This issue no longer exists.
      </div>
    );
  }

  const view = toIssueView(issue, store);
  const reporter = store.users.find((u) => u.id === issue.createdById);
  const key = view.issueKey;
  const editable = perms.canEdit(issue);
  const deletable = perms.canDelete(issue);

  const copyLink = () => {
    const url = `${location.origin}/app/project/engineering/issue/${key}`;
    navigator.clipboard?.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <header className="flex h-[56px] shrink-0 items-center gap-2 border-b border-border px-4">
        <div className="flex items-center gap-1.5 font-display text-[13px]">
          <span className="font-semibold text-text-subtle">{store.project.name}</span>
          <span className="font-semibold text-border-strong">/</span>
          <span className="font-bold tracking-[-0.01em] text-text">{key}</span>
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          <SendToClaude issueId={issue.id} />
          {variant === "drawer" && onNavigateFull && (
            <Tooltip content="Open full page">
              <button onClick={onNavigateFull} className="rounded-[8px] p-1.5 text-text-subtle transition-colors hover:bg-surface-hover hover:text-text" aria-label="Open full page">
                <ArrowUpRight size={16} strokeWidth={2.25} />
              </button>
            </Tooltip>
          )}
          <Popover
            placement="bottom-end"
            className="w-48 p-1.5"
            render={({ close }) => (
              <div>
                <button
                  onClick={() => { copyLink(); close(); }}
                  className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-[7px] text-left font-display text-[13.5px] font-medium hover:bg-surface-2"
                >
                  <Link2 size={15} strokeWidth={2.25} className="text-text-muted" /> Copy link
                </button>
                {deletable && (
                  <button
                    onClick={() => {
                      deleteIssue(issue.id);
                      close();
                      onClose?.();
                      toast.success(`${key} deleted`);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-[7px] text-left font-display text-[13.5px] font-semibold text-danger hover:bg-danger-soft"
                  >
                    <Trash2 size={15} strokeWidth={2.25} /> Delete issue
                  </button>
                )}
              </div>
            )}
          >
            <button className="rounded-[8px] p-1.5 text-text-subtle transition-colors hover:bg-surface-hover hover:text-text data-[state=open]:bg-surface-hover data-[state=open]:text-text" aria-label="More">
              <MoreHorizontal size={16} strokeWidth={2.25} />
            </button>
          </Popover>
          {variant === "drawer" && onClose && (
            <Tooltip content="Close" shortcut="Esc">
              <button onClick={onClose} className="ml-0.5 rounded-[8px] p-1.5 text-text-subtle transition-colors hover:bg-surface-hover hover:text-text" aria-label="Close">
                <X size={17} strokeWidth={2.25} />
              </button>
            </Tooltip>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[680px] px-7 py-7">
              <EditableTitle value={issue.title} onSave={(t) => updateIssue(issue.id, { title: t })} readOnly={!editable} />

              {view.labels.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {view.labels.map((l) => (
                    <LabelChip key={l.id} label={l} onRemove={editable ? () => toggleLabel(issue.id, l.id) : undefined} />
                  ))}
                </div>
              )}

              <div className="mt-4">
                <DescriptionEditor value={issue.description} onSave={(d) => updateIssue(issue.id, { description: d })} readOnly={!editable} />
              </div>

              <div className="my-6 h-px bg-border" />

              <div className="mb-3 font-display text-[16px] font-extrabold tracking-[-0.02em] text-text">Activity</div>
              <ActivityFeed issueId={issue.id} />
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-surface px-7 py-3.5">
            <div className="mx-auto max-w-[680px]">
              <CommentComposer onSubmit={(body) => addComment(issue.id, body)} />
            </div>
          </div>
        </div>

        {/* Properties rail */}
        <aside className="hidden w-[280px] shrink-0 overflow-y-auto border-l border-border bg-surface-2 px-3 py-5 md:block">
          <div className="mb-2.5 px-1.5 font-display text-[15px] font-extrabold tracking-[-0.02em] text-text">Details</div>
          <PropRow label="Status">
            <StatusPicker value={issue.statusId} onChange={(id) => updateIssue(issue.id, { statusId: id })} placement="bottom-end" disabled={!editable}>
              <PropButton>
                <StatusIcon status={view.status} /> <span className="font-semibold" style={{ color: view.status.color }}>{view.status.name}</span>
              </PropButton>
            </StatusPicker>
          </PropRow>

          <PropRow label="Priority">
            <PriorityPicker value={issue.priority} onChange={(p: Priority) => updateIssue(issue.id, { priority: p })} placement="bottom-end" disabled={!editable}>
              <PropButton>
                <PriorityIcon priority={issue.priority} />
                <span className={cn(issue.priority === "none" && "text-text-subtle")}>{PRIORITY_META[issue.priority].label}</span>
              </PropButton>
            </PriorityPicker>
          </PropRow>

          <PropRow label="Assignee">
            <AssigneePicker value={issue.assigneeId} onChange={(id) => updateIssue(issue.id, { assigneeId: id })} placement="bottom-end" disabled={!editable}>
              <PropButton>
                {view.assignee ? <Avatar user={view.assignee} size="sm" /> : <AvatarEmpty size="sm" />}
                <span className={cn(!view.assignee && "text-text-subtle")}>{view.assignee?.name ?? "Unassigned"}</span>
              </PropButton>
            </AssigneePicker>
          </PropRow>

          <PropRow label="Labels">
            <LabelPicker value={issue.labelIds} onToggle={(id) => toggleLabel(issue.id, id)} placement="bottom-end" disabled={!editable}>
              <PropButton>
                {view.labels.length ? (
                  <span className="flex flex-wrap gap-1">{view.labels.map((l) => <LabelChip key={l.id} label={l} />)}</span>
                ) : (
                  <span className="flex items-center gap-1 text-text-subtle"><Plus size={14} strokeWidth={2.4} /> Add label</span>
                )}
              </PropButton>
            </LabelPicker>
          </PropRow>

          <PropRow label="Due date">
            <DueControl value={issue.dueDate} closed={issue.closedAt} onChange={(d) => updateIssue(issue.id, { dueDate: d })} disabled={!editable} />
          </PropRow>

          {fieldDefs.length > 0 && <div className="mx-1.5 my-3 h-px bg-border-strong/60" />}
          {fieldDefs.map((f) => (
            <PropRow key={f.id} label={f.name}>
              <FieldEditor
                field={f}
                value={issue.fields?.[f.id] ?? null}
                onChange={(v) => setIssueFieldValue(issue.id, f.id, v)}
                placement="bottom-end"
                disabled={!editable}
                inline
              >
                <PropButton>
                  <FieldValueDisplay field={f} value={issue.fields?.[f.id] ?? null} />
                </PropButton>
              </FieldEditor>
            </PropRow>
          ))}

          <div className="mx-1.5 my-3 h-px bg-border-strong/60" />

          <PropRow label="Attachments">
            <div className="pt-1"><Attachments issueId={issue.id} /></div>
          </PropRow>

          <div className="mx-1.5 my-3 h-px bg-border-strong/60" />

          <div className="space-y-2 px-1.5 font-display text-[12.5px] font-semibold text-text-subtle">
            <div className="flex items-center justify-between">
              <span>Reporter</span>
              <span className="flex items-center gap-1.5 text-text">
                {reporter && <Avatar user={reporter} size="xs" />} {reporter?.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Created</span>
              <time className="text-text" title={fullDateTime(issue.createdAt)}>{relativeTime(issue.createdAt)}</time>
            </div>
            <div className="flex items-center justify-between">
              <span>Updated</span>
              <time className="text-text" title={fullDateTime(issue.updatedAt)}>{relativeTime(issue.updatedAt)}</time>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function EditableTitle({ value, onSave, readOnly }: { value: string; onSave: (v: string) => void; readOnly?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) {
      const el = ref.current!;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const t = draft.trim();
    if (t && t !== value) onSave(t);
    else setDraft(value);
  };

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        rows={1}
        className="w-full resize-none rounded-[8px] bg-transparent font-display text-[26px] font-extrabold leading-[1.18] tracking-[-0.03em] text-text focus:outline-none"
      />
    );
  }
  if (readOnly) {
    return <h1 className="-mx-1 px-1 font-display text-[26px] font-extrabold leading-[1.18] tracking-[-0.03em] text-text">{value}</h1>;
  }
  return (
    <h1
      onClick={() => setEditing(true)}
      className="-mx-1 cursor-text rounded-[8px] px-1 font-display text-[26px] font-extrabold leading-[1.18] tracking-[-0.03em] text-text transition-colors hover:bg-surface-2"
    >
      {value}
    </h1>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-start gap-1.5 py-[3px]">
      <span className="pl-1.5 pt-[8px] font-display text-[12.5px] font-semibold leading-tight text-text-subtle">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const PropButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className, ...props }, ref) => (
    <button
      ref={ref}
      {...props}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-left font-display text-[13px] font-medium text-text transition-colors hover:bg-surface hover:shadow-[inset_0_0_0_1px_var(--border)] data-[state=open]:bg-surface data-[state=open]:shadow-[inset_0_0_0_1px_var(--border-strong)]",
        className,
      )}
    >
      {children}
      <Pencil size={12} strokeWidth={2.25} className="ml-auto shrink-0 text-text-subtle opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100" />
    </button>
  ),
);
PropButton.displayName = "PropButton";

function DueControl({ value, closed, onChange, disabled }: { value: string | null; closed: string | null; onChange: (v: string | null) => void; disabled?: boolean }) {
  const overdue = isOverdue(value, closed);
  if (disabled) {
    return (
      <span className="flex items-center gap-1.5 px-2 py-1.5 font-display text-[13px] font-medium">
        <Calendar size={14} strokeWidth={2.25} className={overdue ? "text-danger" : "text-text-muted"} />
        <span className={cn(!value && "text-text-subtle", overdue && "font-bold text-danger")}>{value ? shortDate(value) : "No due date"}</span>
      </span>
    );
  }
  return (
    <Popover
      placement="bottom-end"
      className="p-2"
      render={({ close }) => (
        <div className="flex flex-col gap-2">
          <input
            type="date"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="text-field"
          />
          <button onClick={() => { onChange(null); close(); }} className="rounded-[8px] px-2.5 py-1.5 text-left font-display text-[12.5px] font-semibold text-text-muted hover:bg-surface-2 hover:text-text">
            Clear due date
          </button>
        </div>
      )}
    >
      <PropButton>
        <Calendar size={14} strokeWidth={2.25} className={overdue ? "text-danger" : "text-text-muted"} />
        <span className={cn(!value && "text-text-subtle", overdue && "font-bold text-danger")}>
          {value ? shortDate(value) : "No due date"}
        </span>
      </PropButton>
    </Popover>
  );
}
