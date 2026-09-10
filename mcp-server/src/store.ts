import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Dataset, Issue, Priority } from "./types.js";
import { seedDataset } from "./seed.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = process.env.PROJEX_DATA_FILE || join(__dirname, "..", "data", "store.json");

const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low", "none"];

export class Store {
  private data: Dataset;

  constructor() {
    if (existsSync(DATA_FILE)) {
      try {
        this.data = JSON.parse(readFileSync(DATA_FILE, "utf8"));
      } catch {
        this.data = seedDataset();
        this.persist();
      }
    } else {
      this.data = seedDataset();
      this.persist();
    }
  }

  private persist() {
    mkdirSync(dirname(DATA_FILE), { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
  }

  reset() {
    this.data = seedDataset();
    this.persist();
  }

  /* ── resolvers (accept id, name, or email) ─────────────────────── */
  resolveStatus(v?: string | null) {
    if (!v) return undefined;
    const t = v.toLowerCase();
    return this.data.statuses.find((s) => s.id === v || s.name.toLowerCase() === t);
  }
  resolvePriority(v?: string | null): Priority | undefined {
    if (!v) return undefined;
    const t = v.toLowerCase() as Priority;
    return PRIORITIES.includes(t) ? t : undefined;
  }
  resolveUser(v?: string | null) {
    if (!v) return undefined;
    const t = v.toLowerCase();
    return this.data.users.find(
      (u) => u.id === v || u.email.toLowerCase() === t || u.name.toLowerCase() === t || u.name.toLowerCase().startsWith(t),
    );
  }
  resolveLabel(v: string) {
    const t = v.toLowerCase();
    return this.data.labels.find((l) => l.id === v || l.name.toLowerCase() === t);
  }

  /* ── reads ─────────────────────────────────────────────────────── */
  get project() { return this.data.project; }
  get users() { return this.data.users; }
  get statuses() { return [...this.data.statuses].sort((a, b) => a.position - b.position); }
  get labels() { return this.data.labels; }

  getByKey(key: string): Issue | undefined {
    const num = Number(key.split("-").pop());
    return this.data.issues.find((i) => i.number === num);
  }

  view(issue: Issue) {
    const status = this.data.statuses.find((s) => s.id === issue.statusId);
    const assignee = issue.assigneeId ? this.data.users.find((u) => u.id === issue.assigneeId) : null;
    const labels = issue.labelIds.map((id) => this.data.labels.find((l) => l.id === id)).filter(Boolean);
    const reporter = this.data.users.find((u) => u.id === issue.createdById);
    return {
      key: `${this.data.project.key}-${issue.number}`,
      title: issue.title,
      description: issue.description,
      status: status?.name ?? "Unknown",
      priority: issue.priority,
      assignee: assignee?.name ?? null,
      labels: labels.map((l) => l!.name),
      dueDate: issue.dueDate,
      reporter: reporter?.name ?? null,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      closedAt: issue.closedAt,
      commentCount: this.data.comments.filter((c) => c.issueId === issue.id).length,
    };
  }

  listIssues(filter: {
    status?: string; priority?: string; assignee?: string; label?: string; query?: string; limit?: number;
  }) {
    let issues = [...this.data.issues];
    const st = this.resolveStatus(filter.status);
    if (filter.status && st) issues = issues.filter((i) => i.statusId === st.id);
    const pr = this.resolvePriority(filter.priority);
    if (filter.priority && pr) issues = issues.filter((i) => i.priority === pr);
    if (filter.assignee) {
      if (filter.assignee.toLowerCase() === "unassigned") issues = issues.filter((i) => !i.assigneeId);
      else {
        const u = this.resolveUser(filter.assignee);
        if (u) issues = issues.filter((i) => i.assigneeId === u.id);
      }
    }
    if (filter.label) {
      const l = this.resolveLabel(filter.label);
      if (l) issues = issues.filter((i) => i.labelIds.includes(l.id));
    }
    if (filter.query) {
      const q = filter.query.toLowerCase();
      issues = issues.filter((i) => `${i.title} ${i.description} ENG-${i.number}`.toLowerCase().includes(q));
    }
    issues.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (filter.limit) issues = issues.slice(0, filter.limit);
    return issues.map((i) => this.view(i));
  }

  getIssueDetail(key: string) {
    const issue = this.getByKey(key);
    if (!issue) return undefined;
    const comments = this.data.comments
      .filter((c) => c.issueId === issue.id)
      .map((c) => ({ author: this.data.users.find((u) => u.id === c.userId)?.name ?? "Unknown", body: c.body, createdAt: c.createdAt }));
    const activity = this.data.activities
      .filter((a) => a.issueId === issue.id)
      .map((a) => ({ user: this.data.users.find((u) => u.id === a.userId)?.name ?? "Unknown", event: a.event, createdAt: a.createdAt }));
    return { ...this.view(issue), comments, activity };
  }

  /* ── mutations ─────────────────────────────────────────────────── */
  private actorId(actor?: string) {
    return this.resolveUser(actor)?.id ?? this.data.users[0].id;
  }

  createIssue(input: {
    title: string; description?: string; status?: string; priority?: string; assignee?: string; labels?: string[]; actor?: string;
  }) {
    const number = this.data.nextIssueNumber++;
    const status = this.resolveStatus(input.status) ?? this.data.statuses[1];
    const priority = this.resolvePriority(input.priority) ?? "none";
    const assignee = input.assignee ? this.resolveUser(input.assignee) : undefined;
    const labelIds = (input.labels ?? []).map((l) => this.resolveLabel(l)?.id).filter((x): x is string => !!x);
    const iso = new Date().toISOString();
    const issue: Issue = {
      id: `iss_${number}`,
      number,
      title: input.title,
      description: input.description ?? "",
      statusId: status.id,
      priority,
      assigneeId: assignee?.id ?? null,
      createdById: this.actorId(input.actor),
      labelIds,
      dueDate: null,
      createdAt: iso,
      updatedAt: iso,
      closedAt: null,
    };
    this.data.issues.unshift(issue);
    this.data.activities.push({ id: `ac_${number}_c`, issueId: issue.id, userId: issue.createdById, event: "created", meta: {}, createdAt: iso });
    this.persist();
    return this.view(issue);
  }

  updateIssue(key: string, patch: {
    status?: string; priority?: string; assignee?: string | null; title?: string; description?: string; dueDate?: string | null; actor?: string;
  }) {
    const issue = this.getByKey(key);
    if (!issue) return undefined;
    const iso = new Date().toISOString();
    const actor = this.actorId(patch.actor);
    const log = (event: string, meta: Record<string, unknown> = {}) =>
      this.data.activities.push({ id: `ac_${Math.random().toString(36).slice(2)}`, issueId: issue.id, userId: actor, event, meta, createdAt: iso });

    if (patch.status !== undefined) {
      const st = this.resolveStatus(patch.status);
      if (st && st.id !== issue.statusId) {
        log("status_changed", { toId: st.id });
        issue.statusId = st.id;
        issue.closedAt = st.category === "completed" || st.category === "canceled" ? iso : null;
      }
    }
    if (patch.priority !== undefined) {
      const pr = this.resolvePriority(patch.priority);
      if (pr && pr !== issue.priority) { log("priority_changed", { to: pr }); issue.priority = pr; }
    }
    if (patch.assignee !== undefined) {
      const u = patch.assignee ? this.resolveUser(patch.assignee) : null;
      const newId = u?.id ?? null;
      if (newId !== issue.assigneeId) { log("assignee_changed", { toId: newId }); issue.assigneeId = newId; }
    }
    if (patch.title !== undefined && patch.title !== issue.title) { log("title_changed"); issue.title = patch.title; }
    if (patch.description !== undefined) { log("description_changed"); issue.description = patch.description; }
    if (patch.dueDate !== undefined) { log("due_changed", { to: patch.dueDate }); issue.dueDate = patch.dueDate; }

    issue.updatedAt = iso;
    this.persist();
    return this.view(issue);
  }

  addComment(key: string, body: string, author?: string) {
    const issue = this.getByKey(key);
    if (!issue) return undefined;
    const iso = new Date().toISOString();
    const userId = this.actorId(author);
    this.data.comments.push({ id: `cm_${Math.random().toString(36).slice(2)}`, issueId: issue.id, userId, body, createdAt: iso });
    this.data.activities.push({ id: `ac_${Math.random().toString(36).slice(2)}`, issueId: issue.id, userId, event: "comment_added", meta: {}, createdAt: iso });
    issue.updatedAt = iso;
    this.persist();
    return { key: `${this.data.project.key}-${issue.number}`, author: this.data.users.find((u) => u.id === userId)?.name, body, createdAt: iso };
  }

  toCsv(views: ReturnType<Store["view"]>[]): string {
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const cols = ["Key", "Title", "Status", "Priority", "Assignee", "Labels", "Due date", "Reporter", "Created", "Updated", "Comments"];
    const rows = views.map((v) =>
      [v.key, v.title, v.status, v.priority, v.assignee ?? "", v.labels.join("; "), v.dueDate ?? "", v.reporter ?? "", v.createdAt, v.updatedAt, v.commentCount].map(esc).join(","),
    );
    return [cols.join(","), ...rows].join("\r\n");
  }
}
