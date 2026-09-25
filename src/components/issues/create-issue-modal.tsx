import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Kbd } from "@/components/ui/kbd";
import { Popover } from "@/components/ui/popover";
import { StatusIcon } from "./status-icon";
import { PriorityIcon } from "./priority-icon";
import { Avatar, AvatarEmpty } from "@/components/ui/avatar";
import { LabelChip } from "./badges";
import { StatusPicker, PriorityPicker, AssigneePicker, LabelPicker } from "./pickers";
import { FieldEditor, FieldValueDisplay } from "@/components/fields/field-controls";
import { useStore } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { DEFAULT_PROJECT_KEY, PRIORITY_META } from "@/lib/constants";
import { shortDate } from "@/lib/utils/format";
import { toast } from "@/components/ui/toast";
import type { FieldValue, Priority } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

// Rounded-rect property buttons, never pills.
const chip =
  "inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-surface-2 px-2.5 font-display text-[12.5px] font-semibold text-text-muted transition-[background-color,color,transform] duration-150 hover:bg-surface-hover hover:text-text active:scale-[0.97] data-[state=open]:bg-surface-active data-[state=open]:text-text";

export function CreateIssueModal() {
  const open = useUI((s) => s.createOpen);
  const defaults = useUI((s) => s.createDefaults);
  const close = useUI((s) => s.closeCreate);
  const navigate = useNavigate();

  const statuses = useStore((s) => s.statuses);
  const users = useStore((s) => s.users);
  const labels = useStore((s) => s.labels);
  const fieldDefs = [...useStore((s) => s.fieldDefs)].sort((a, b) => a.position - b.position);
  const projectName = useStore((s) => s.project.name);
  const createIssue = useStore((s) => s.createIssue);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState("");
  const [priority, setPriority] = useState<Priority>("none");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>({});
  const [createMore, setCreateMore] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority(defaults?.priority ?? "none");
    setAssigneeId(defaults?.assigneeId ?? null);
    setLabelIds(defaults?.labelIds ?? []);
    setDueDate(null);
    setFieldValues(defaults?.fields ?? {});
    setStatusId(defaults?.statusId ?? statuses[1]?.id ?? statuses[0]?.id);
  };

  useEffect(() => {
    if (open) {
      reset();
      setTimeout(() => titleRef.current?.focus(), 20);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const status = statuses.find((s) => s.id === statusId);
  const assignee = users.find((u) => u.id === assigneeId) ?? null;
  const chosenLabels = labelIds.map((id) => labels.find((l) => l.id === id)!).filter(Boolean);

  const submit = () => {
    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }
    const issue = createIssue({ title, description, statusId, priority, assigneeId, labelIds, dueDate, fields: fieldValues });
    const key = String(issue.number);
    toast.success(`${key} created`, {
      label: "View",
      onClick: () =>
        navigate({
          to: "/app/project/$key/list",
          params: { key: DEFAULT_PROJECT_KEY },
          search: { issue: key },
        }),
    });
    if (createMore) {
      reset();
      setTimeout(() => titleRef.current?.focus(), 10);
    } else {
      close();
    }
  };

  return (
    <Modal open={open} onClose={close} align="top" className="max-w-[620px]" labelledBy="create-issue-title">
      <div className="flex items-center justify-between px-5 pb-1 pt-4">
        <div className="flex items-center gap-2 font-display text-[12.5px]">
          <span className="rounded-[6px] bg-primary px-1.5 py-0.5 text-[11.5px] font-bold text-primary-fg">{projectName}</span>
          <span className="font-semibold text-text-subtle">New issue</span>
        </div>
        <button onClick={close} className="rounded-[8px] p-1 text-text-subtle transition-colors hover:bg-surface-hover hover:text-text" aria-label="Close">
          <X size={17} strokeWidth={2.25} />
        </button>
      </div>

      <div className="px-5 pt-3">
        <textarea
          ref={titleRef}
          id="create-issue-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !(e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              (e.currentTarget.form ?? document.getElementById("ci-desc"))?.focus?.();
              document.getElementById("ci-desc")?.focus();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
          }}
          rows={1}
          placeholder="Issue title"
          className="w-full resize-none bg-transparent font-display text-[24px] font-extrabold leading-[1.2] tracking-[-0.03em] text-text placeholder:text-text-subtle/70 focus:outline-none"
        />
        <textarea
          id="ci-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(); }}
          rows={3}
          placeholder="Add a description…  Steps to reproduce, expected vs actual, environment."
          className="mt-2 w-full resize-none bg-transparent text-[14px] leading-relaxed text-text placeholder:text-text-subtle focus:outline-none"
        />
      </div>

      {/* Attribute chips */}
      <div className="flex flex-wrap items-center gap-1.5 px-5 pb-4 pt-1.5">
        {status && (
          <StatusPicker value={statusId} onChange={setStatusId}>
            <button className={chip}><StatusIcon status={status} /> {status.name}</button>
          </StatusPicker>
        )}
        <PriorityPicker value={priority} onChange={setPriority}>
          <button className={chip}>
            <PriorityIcon priority={priority} /> {priority === "none" ? "Priority" : PRIORITY_META[priority].label}
          </button>
        </PriorityPicker>
        <AssigneePicker value={assigneeId} onChange={setAssigneeId}>
          <button className={chip}>
            {assignee ? <Avatar user={assignee} size="sm" /> : <AvatarEmpty size="sm" />}
            {assignee ? assignee.name.split(" ")[0] : "Assignee"}
          </button>
        </AssigneePicker>
        <LabelPicker value={labelIds} onToggle={(id) => setLabelIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}>
          <button className={chip}>
            <span className="text-text-subtle">＃</span>
            {chosenLabels.length ? `${chosenLabels.length} label${chosenLabels.length > 1 ? "s" : ""}` : "Labels"}
          </button>
        </LabelPicker>
        <DuePicker value={dueDate} onChange={setDueDate} />

        {fieldDefs.map((f) => {
          const v = fieldValues[f.id] ?? null;
          const setV = (val: FieldValue) => setFieldValues((p) => ({ ...p, [f.id]: val }));
          if (f.type === "checkbox") {
            return (
              <button key={f.id} onClick={() => setV(v === true ? false : true)} className={cn(chip, v === true && "bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent")}>
                <FieldValueDisplay field={f} value={v} /> {f.name}
              </button>
            );
          }
          const has = Array.isArray(v) ? v.length > 0 : v != null;
          return (
            <FieldEditor key={f.id} field={f} value={v} onChange={setV}>
              <button className={chip}>
                {has ? <FieldValueDisplay field={f} value={v} /> : <span className="text-text-subtle">{f.name}</span>}
              </button>
            </FieldEditor>
          );
        })}
      </div>

      {chosenLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-4">
          {chosenLabels.map((l) => (
            <LabelChip key={l.id} label={l} onRemove={() => setLabelIds((p) => p.filter((x) => x !== l.id))} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border bg-surface-2 px-5 py-3">
        <label className="flex cursor-pointer items-center gap-2 font-display text-[13px] font-semibold text-text-muted">
          <input
            type="checkbox"
            checked={createMore}
            onChange={(e) => setCreateMore(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Create more
        </label>
        <div className="flex items-center gap-2">
          <button onClick={close} className="h-8 rounded-[10px] px-3 font-display text-[13px] font-semibold text-text-muted transition-colors hover:bg-surface-hover hover:text-text">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!title.trim()}
            className="flex h-8 items-center gap-2 rounded-[10px] bg-primary px-3.5 font-display text-[13px] font-semibold text-primary-fg transition-[background-color,transform] hover:bg-primary-hover active:scale-[0.97] disabled:opacity-45"
          >
            Create issue
            <span className="flex items-center gap-0.5 opacity-80">
              <Kbd className="border-transparent bg-primary-fg/15 text-primary-fg shadow-none">⌘</Kbd>
              <Kbd className="border-transparent bg-primary-fg/15 text-primary-fg shadow-none">↵</Kbd>
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DuePicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <Popover
      placement="bottom-start"
      className="p-2"
      render={({ close }) => (
        <div className="flex flex-col gap-2">
          <input
            type="date"
            value={value ?? ""}
            onChange={(e) => { onChange(e.target.value || null); }}
            className="text-field"
          />
          <button
            onClick={() => { onChange(null); close(); }}
            className="rounded-[8px] px-2.5 py-1.5 text-left font-display text-[12.5px] font-semibold text-text-muted hover:bg-surface-2 hover:text-text"
          >
            Clear due date
          </button>
        </div>
      )}
    >
      <button className={cn(chip)}>
        <CalendarDays size={15} strokeWidth={2.25} />
        {value ? shortDate(value) : "Due"}
      </button>
    </Popover>
  );
}
