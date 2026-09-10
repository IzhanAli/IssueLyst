import type {
  Issue,
  IssueView,
  Label,
  Priority,
  Status,
  User,
} from "@/lib/types";
import type { EntityState } from "./store";
import { PRIORITY_ORDER } from "@/lib/constants";

/** date preset window in days; "" = any time */
export type DateWindow = "" | "1" | "7" | "30";

export interface Filters {
  statusIds: string[];
  priorities: Priority[];
  assigneeIds: string[]; // may include "unassigned"
  labelIds: string[];
  createdWithin: DateWindow;
  updatedWithin: DateWindow;
  /** dynamic field filters: fieldId → selected option ids ("true"/"false" for checkbox) */
  fields: Record<string, string[]>;
  q: string; // quick text filter
}

export const EMPTY_FILTERS: Filters = {
  statusIds: [],
  priorities: [],
  assigneeIds: [],
  labelIds: [],
  createdWithin: "",
  updatedWithin: "",
  fields: {},
  q: "",
};

export type SortField =
  | "number"
  | "title"
  | "status"
  | "priority"
  | "assignee"
  | "created"
  | "updated"
  | "due";

export interface Sort {
  field: SortField;
  dir: "asc" | "desc";
}

export type GroupBy = "status" | "priority" | "assignee" | "none" | `field:${string}`;

export function activeFilterCount(f: Filters): number {
  const fieldCount = Object.values(f.fields).reduce((n, arr) => n + arr.length, 0);
  return (
    f.statusIds.length +
    f.priorities.length +
    f.assigneeIds.length +
    f.labelIds.length +
    fieldCount +
    (f.createdWithin ? 1 : 0) +
    (f.updatedWithin ? 1 : 0) +
    (f.q ? 1 : 0)
  );
}

/* ── view-model builders ─────────────────────────────────────────── */
export function toIssueView(issue: Issue, s: EntityState): IssueView {
  const status = s.statuses.find((st) => st.id === issue.statusId)!;
  const assignee = issue.assigneeId ? s.users.find((u) => u.id === issue.assigneeId) ?? null : null;
  const labels = issue.labelIds
    .map((id) => s.labels.find((l) => l.id === id))
    .filter((l): l is Label => !!l);
  const commentCount = s.comments.filter((c) => c.issueId === issue.id).length;
  const attachmentCount = s.attachments.filter((a) => a.issueId === issue.id).length;
  return {
    ...issue,
    status,
    assignee,
    labels,
    commentCount,
    attachmentCount,
    issueKey: String(issue.number),
  };
}

export function allIssueViews(s: EntityState): IssueView[] {
  return s.issues.map((i) => toIssueView(i, s));
}

/* ── filtering ───────────────────────────────────────────────────── */
export function matchesFilters(v: IssueView, f: Filters): boolean {
  if (f.statusIds.length && !f.statusIds.includes(v.statusId)) return false;
  if (f.priorities.length && !f.priorities.includes(v.priority)) return false;
  if (f.assigneeIds.length) {
    const key = v.assigneeId ?? "unassigned";
    if (!f.assigneeIds.includes(key)) return false;
  }
  if (f.labelIds.length && !f.labelIds.some((l) => v.labelIds.includes(l))) return false;
  if (f.createdWithin) {
    const cutoff = Date.now() - Number(f.createdWithin) * 86400_000;
    if (new Date(v.createdAt).getTime() < cutoff) return false;
  }
  if (f.updatedWithin) {
    const cutoff = Date.now() - Number(f.updatedWithin) * 86400_000;
    if (new Date(v.updatedAt).getTime() < cutoff) return false;
  }
  for (const [fieldId, wanted] of Object.entries(f.fields)) {
    if (!wanted.length) continue;
    const val = v.fields?.[fieldId];
    const keys = Array.isArray(val) ? val.map(String) : [val == null ? "__none__" : String(val)];
    if (!wanted.some((w) => keys.includes(w))) return false;
  }
  if (f.q.trim()) {
    const q = f.q.toLowerCase();
    const hay = `${v.issueKey} ${v.title} ${v.description} ${v.assignee?.name ?? ""} ${v.labels
      .map((l) => l.name)
      .join(" ")}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function filterIssues(views: IssueView[], f: Filters): IssueView[] {
  return views.filter((v) => matchesFilters(v, f));
}

/* ── sorting ─────────────────────────────────────────────────────── */
export function sortIssues(views: IssueView[], sort: Sort): IssueView[] {
  const dir = sort.dir === "asc" ? 1 : -1;
  const arr = [...views];
  arr.sort((a, b) => {
    let cmp = 0;
    switch (sort.field) {
      case "number": cmp = a.number - b.number; break;
      case "title": cmp = a.title.localeCompare(b.title); break;
      case "status": cmp = a.status.position - b.status.position; break;
      case "priority": cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]; break;
      case "assignee": cmp = (a.assignee?.name ?? "~").localeCompare(b.assignee?.name ?? "~"); break;
      case "created": cmp = a.createdAt.localeCompare(b.createdAt); break;
      case "updated": cmp = a.updatedAt.localeCompare(b.updatedAt); break;
      case "due":
        cmp = (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"); break;
    }
    if (cmp === 0) cmp = a.number - b.number;
    return cmp * dir;
  });
  return arr;
}

/* ── grouping ────────────────────────────────────────────────────── */
export interface Group {
  key: string;
  label: string;
  color?: string;
  status?: Status;
  count: number;
  issues: IssueView[];
}

export function groupIssues(
  views: IssueView[],
  groupBy: GroupBy,
  s: EntityState,
): Group[] {
  if (groupBy === "none") {
    return [{ key: "all", label: "All issues", count: views.length, issues: views }];
  }
  if (groupBy === "status") {
    return [...s.statuses]
      .sort((a, b) => a.position - b.position)
      .map((st) => {
        const issues = views.filter((v) => v.statusId === st.id);
        return { key: st.id, label: st.name, color: st.color, status: st, count: issues.length, issues };
      });
  }
  if (groupBy === "priority") {
    const order: Priority[] = ["urgent", "high", "medium", "low", "none"];
    return order.map((p) => {
      const issues = views.filter((v) => v.priority === p);
      return { key: p, label: p === "none" ? "No priority" : p[0].toUpperCase() + p.slice(1), count: issues.length, issues };
    });
  }
  if (groupBy.startsWith("field:")) {
    const fieldId = groupBy.slice(6);
    const field = s.fieldDefs.find((f) => f.id === fieldId);
    if (!field) return [{ key: "all", label: "All issues", count: views.length, issues: views }];
    if (field.type === "checkbox") {
      const yes = views.filter((v) => v.fields?.[fieldId] === true);
      const no = views.filter((v) => v.fields?.[fieldId] !== true);
      return [
        { key: "true", label: `${field.name}: Yes`, count: yes.length, issues: yes },
        { key: "false", label: `${field.name}: No`, count: no.length, issues: no },
      ];
    }
    const groups: Group[] = field.options.map((o) => {
      const issues = views.filter((v) => v.fields?.[fieldId] === o.id);
      return { key: o.id, label: o.label, color: o.color, count: issues.length, issues };
    });
    const none = views.filter((v) => v.fields?.[fieldId] == null);
    if (none.length) groups.push({ key: "none", label: `No ${field.name}`, count: none.length, issues: none });
    return groups;
  }
  // assignee
  const groups: Group[] = [];
  const byUser = new Map<string, IssueView[]>();
  for (const v of views) {
    const k = v.assigneeId ?? "unassigned";
    if (!byUser.has(k)) byUser.set(k, []);
    byUser.get(k)!.push(v);
  }
  for (const u of s.users as User[]) {
    const issues = byUser.get(u.id);
    if (issues?.length) groups.push({ key: u.id, label: u.name, color: u.color, count: issues.length, issues });
  }
  const un = byUser.get("unassigned");
  if (un?.length) groups.push({ key: "unassigned", label: "Unassigned", count: un.length, issues: un });
  return groups;
}
