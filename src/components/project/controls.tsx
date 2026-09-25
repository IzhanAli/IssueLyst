import {
  SlidersHorizontal,
  ArrowUpDown,
  Layers,
  Check,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { StatusIcon } from "@/components/issues/status-icon";
import { PriorityIcon } from "@/components/issues/priority-icon";
import { Avatar, AvatarEmpty } from "@/components/ui/avatar";
import { LabelDot } from "@/components/issues/badges";
import { useStore } from "@/lib/store/store";
import { useIssueQuery } from "@/lib/store/query";
import { PRIORITIES, PRIORITY_META } from "@/lib/constants";
import { activeFilterCount, type GroupBy, type SortField } from "@/lib/store/selectors";
import { cn } from "@/lib/utils/cn";

const ctrlBtn =
  "flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 font-display text-[13px] font-semibold text-text-muted transition-[background-color,color,transform] duration-150 hover:bg-surface-2 hover:text-text active:scale-[0.97] data-[state=open]:bg-surface-2 data-[state=open]:text-text";

/* ── Filter ──────────────────────────────────────────────────────── */
export function FilterMenu() {
  const { filters, toggleFilter, toggleFieldFilter, setFilters } = useIssueQuery();
  const statuses = useStore((s) => s.statuses);
  const users = useStore((s) => s.users);
  const labels = useStore((s) => s.labels);
  const fieldDefs = [...useStore((s) => s.fieldDefs)].sort((a, b) => a.position - b.position);
  const count = activeFilterCount(filters);

  return (
    <Popover
      placement="bottom-start"
      className="w-72"
      render={() => (
        <div className="max-h-[70vh] overflow-y-auto p-2">
          <FilterSection title="Status">
            {statuses.map((s) => (
              <CheckRow key={s.id} on={filters.statusIds.includes(s.id)} onClick={() => toggleFilter("statusIds", s.id)} icon={<StatusIcon status={s} />}>
                {s.name}
              </CheckRow>
            ))}
          </FilterSection>
          <FilterSection title="Priority">
            {PRIORITIES.map((p) => (
              <CheckRow key={p} on={filters.priorities.includes(p)} onClick={() => toggleFilter("priorities", p)} icon={<PriorityIcon priority={p} />}>
                {PRIORITY_META[p].label}
              </CheckRow>
            ))}
          </FilterSection>
          <FilterSection title="Assignee">
            <CheckRow on={filters.assigneeIds.includes("unassigned")} onClick={() => toggleFilter("assigneeIds", "unassigned")} icon={<AvatarEmpty size="sm" />}>
              Unassigned
            </CheckRow>
            {users.map((u) => (
              <CheckRow key={u.id} on={filters.assigneeIds.includes(u.id)} onClick={() => toggleFilter("assigneeIds", u.id)} icon={<Avatar user={u} size="sm" />}>
                {u.name}
              </CheckRow>
            ))}
          </FilterSection>
          <FilterSection title="Label">
            {labels.map((l) => (
              <CheckRow key={l.id} on={filters.labelIds.includes(l.id)} onClick={() => toggleFilter("labelIds", l.id)} icon={<LabelDot color={l.color} />}>
                {l.name}
              </CheckRow>
            ))}
          </FilterSection>
          <FilterSection title="Created">
            <DateRow value={filters.createdWithin} onChange={(v) => setFilters({ createdWithin: v })} />
          </FilterSection>
          <FilterSection title="Updated">
            <DateRow value={filters.updatedWithin} onChange={(v) => setFilters({ updatedWithin: v })} />
          </FilterSection>

          {fieldDefs
            .filter((f) => f.type === "select" || f.type === "multi_select" || f.type === "checkbox")
            .map((f) => (
              <FilterSection key={f.id} title={f.name}>
                {f.type === "checkbox" ? (
                  (["true", "false"] as const).map((v) => (
                    <CheckRow key={v} on={(filters.fields[f.id] ?? []).includes(v)} onClick={() => toggleFieldFilter(f.id, v)} icon={<span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: v === "true" ? "var(--success)" : "var(--text-subtle)" }} />}>
                      {v === "true" ? "Yes" : "No"}
                    </CheckRow>
                  ))
                ) : (
                  f.options.map((o) => (
                    <CheckRow key={o.id} on={(filters.fields[f.id] ?? []).includes(o.id)} onClick={() => toggleFieldFilter(f.id, o.id)} icon={<span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: o.color }} />}>
                      {o.label}
                    </CheckRow>
                  ))
                )}
              </FilterSection>
            ))}
        </div>
      )}
    >
      <button className={cn(ctrlBtn, count > 0 && "bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent data-[state=open]:bg-accent-soft data-[state=open]:text-accent")}>
        <SlidersHorizontal size={15} strokeWidth={2.2} /> Filter
        {count > 0 && <span className="anim-pop flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 font-display text-[11px] font-bold text-accent-fg">{count}</span>}
      </button>
    </Popover>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1.5">
      <div className="px-2 pb-1 pt-1.5 font-display text-[12.5px] font-semibold text-text-subtle">{title}</div>
      {children}
    </div>
  );
}

function CheckRow({ on, onClick, icon, children }: { on: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-[8px] px-2 py-[5px] text-left text-[13px] transition-colors hover:bg-surface-2">
      <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors", on ? "border-primary bg-primary text-primary-fg" : "border-border-strong")}>
        {on && <Check size={11} strokeWidth={3} />}
      </span>
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      <span className="truncate">{children}</span>
    </button>
  );
}

function DateRow({ value, onChange }: { value: string; onChange: (v: "" | "1" | "7" | "30") => void }) {
  const opts: { v: "" | "1" | "7" | "30"; label: string }[] = [
    { v: "", label: "Any time" },
    { v: "1", label: "24 hours" },
    { v: "7", label: "7 days" },
    { v: "30", label: "30 days" },
  ];
  return (
    <div className="mx-2 my-0.5 flex gap-0.5 rounded-[10px] bg-surface-2 p-[3px]">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "flex-1 rounded-[8px] px-1.5 py-1 font-display text-[12px] transition-all duration-150",
            value === o.v ? "bg-surface font-bold text-text shadow-[var(--shadow-sm)] dark:bg-surface-active" : "font-semibold text-text-muted hover:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Sort ────────────────────────────────────────────────────────── */
const SORT_FIELDS: { field: SortField; label: string }[] = [
  { field: "number", label: "Issue ID" },
  { field: "priority", label: "Priority" },
  { field: "status", label: "Status" },
  { field: "assignee", label: "Assignee" },
  { field: "title", label: "Title" },
  { field: "created", label: "Created date" },
  { field: "updated", label: "Updated date" },
  { field: "due", label: "Due date" },
];

export function SortMenu() {
  const { sort, setSort } = useIssueQuery();
  return (
    <Popover
      placement="bottom-start"
      className="w-52 p-1"
      render={() => (
        <div>
          {SORT_FIELDS.map((s) => {
            const on = sort.field === s.field;
            return (
              <button
                key={s.field}
                onClick={() => setSort({ field: s.field, dir: on && sort.dir === "asc" ? "desc" : "asc" })}
                className={cn("flex w-full items-center gap-2 rounded-[8px] px-2.5 py-[7px] text-left font-display text-[13px] transition-colors hover:bg-surface-2", on ? "font-bold text-text" : "font-medium")}
              >
                <span className="flex-1">{s.label}</span>
                {on && (sort.dir === "asc" ? <ArrowUp size={14} strokeWidth={2.5} className="text-accent" /> : <ArrowDown size={14} strokeWidth={2.5} className="text-accent" />)}
              </button>
            );
          })}
        </div>
      )}
    >
      <button className={ctrlBtn}>
        <ArrowUpDown size={15} strokeWidth={2.2} /> Sort
      </button>
    </Popover>
  );
}

/* ── Group ───────────────────────────────────────────────────────── */
const GROUPS: { g: GroupBy; label: string }[] = [
  { g: "status", label: "Status" },
  { g: "priority", label: "Priority" },
  { g: "assignee", label: "Assignee" },
  { g: "none", label: "None" },
];

export function GroupMenu() {
  const { groupBy, setGroupBy } = useIssueQuery();
  const fieldGroups = [...useStore((s) => s.fieldDefs)]
    .sort((a, b) => a.position - b.position)
    .filter((f) => f.type === "select" || f.type === "checkbox")
    .map((f) => ({ g: `field:${f.id}` as GroupBy, label: f.name }));
  const all = [...GROUPS, ...fieldGroups];
  const current = all.find((o) => o.g === groupBy)?.label ?? "Status";
  return (
    <Popover
      placement="bottom-start"
      className="w-48 max-h-[60vh] overflow-y-auto p-1"
      render={({ close }) => (
        <div>
          {all.map((o) => (
            <button
              key={o.g}
              onClick={() => { setGroupBy(o.g); close(); }}
              className={cn("flex w-full items-center gap-2 rounded-[8px] px-2.5 py-[7px] text-left font-display text-[13px] transition-colors hover:bg-surface-2", groupBy === o.g ? "font-bold text-text" : "font-medium")}
            >
              <span className="flex-1 truncate">{o.label}</span>
              {groupBy === o.g && <Check size={15} strokeWidth={2.5} className="text-accent" />}
            </button>
          ))}
        </div>
      )}
    >
      <button className={ctrlBtn}>
        <Layers size={15} strokeWidth={2.2} /> Group: <span className="font-bold text-text">{current}</span>
      </button>
    </Popover>
  );
}

/* ── Active filter chips ─────────────────────────────────────────── */
export function ActiveFilterChips() {
  const { filters, toggleFilter, toggleFieldFilter, setFilters, clearFilters } = useIssueQuery();
  const statuses = useStore((s) => s.statuses);
  const users = useStore((s) => s.users);
  const labels = useStore((s) => s.labels);
  const fieldDefs = useStore((s) => s.fieldDefs);
  const count = activeFilterCount(filters);
  if (count === 0) return null;

  const chip = (key: string, label: React.ReactNode, onRemove: () => void) => (
    <span key={key} className="anim-scale-in flex h-7 items-center gap-1.5 rounded-[8px] bg-surface-2 pl-2 pr-1 font-display text-[12px] font-semibold text-text shadow-[inset_0_0_0_1px_var(--border)]">
      {label}
      <button onClick={onRemove} className="rounded-[5px] p-0.5 text-text-subtle transition-colors hover:bg-surface-hover hover:text-text" aria-label="Remove filter"><X size={12} strokeWidth={2.5} /></button>
    </span>
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {filters.statusIds.map((id) => {
        const s = statuses.find((x) => x.id === id);
        return s && chip(`s${id}`, <span className="flex items-center gap-1.5"><StatusIcon status={s} size={13} />{s.name}</span>, () => toggleFilter("statusIds", id));
      })}
      {filters.priorities.map((p) => chip(`p${p}`, <span className="flex items-center gap-1.5"><PriorityIcon priority={p} size={13} />{PRIORITY_META[p].label}</span>, () => toggleFilter("priorities", p)))}
      {filters.assigneeIds.map((id) => {
        const u = users.find((x) => x.id === id);
        return chip(`a${id}`, <span className="flex items-center gap-1.5">{u ? <Avatar user={u} size="xs" /> : <AvatarEmpty size="xs" />}{u?.name ?? "Unassigned"}</span>, () => toggleFilter("assigneeIds", id));
      })}
      {filters.labelIds.map((id) => {
        const l = labels.find((x) => x.id === id);
        return l && chip(`l${id}`, <span className="flex items-center gap-1.5"><LabelDot color={l.color} />{l.name}</span>, () => toggleFilter("labelIds", id));
      })}
      {filters.createdWithin && chip("cw", `Created ≤ ${filters.createdWithin}d`, () => setFilters({ createdWithin: "" }))}
      {filters.updatedWithin && chip("uw", `Updated ≤ ${filters.updatedWithin}d`, () => setFilters({ updatedWithin: "" }))}
      {Object.entries(filters.fields).flatMap(([fieldId, opts]) => {
        const field = fieldDefs.find((f) => f.id === fieldId);
        if (!field) return [];
        return opts.map((optId) => {
          const label =
            field.type === "checkbox"
              ? `${field.name}: ${optId === "true" ? "Yes" : "No"}`
              : field.options.find((o) => o.id === optId)?.label ?? optId;
          const color = field.type === "checkbox" ? undefined : field.options.find((o) => o.id === optId)?.color;
          return chip(
            `${fieldId}:${optId}`,
            <span className="flex items-center gap-1.5">
              {color && <span className="h-2 w-2 rounded-[2.5px]" style={{ backgroundColor: color }} />}
              {label}
            </span>,
            () => toggleFieldFilter(fieldId, optId),
          );
        });
      })}
      {count > 1 && (
        <button onClick={clearFilters} className="flex h-7 items-center gap-1 rounded-[8px] px-2 font-display text-[12px] font-semibold text-text-subtle transition-colors hover:bg-signal-soft hover:text-signal">
          Clear all
        </button>
      )}
    </div>
  );
}

export { ctrlBtn };
