/**
 * "Send to Claude Code" — turns an issue and every one of its fields into a
 * prompt and hands it to a local Claude Code session through the deep-link
 * handlers Claude Code registers with the OS:
 *
 *   desktop  → claude://code/new?folder=…&q=<prompt>        (Claude app, Code tab)
 *   terminal → claude-cli://open?repo=…|cwd=…&q=<prompt>   (q caps at 5,000 chars)
 *   VS Code  → vscode://anthropic.claude-code/open?prompt=<prompt>
 *
 * The link only pre-fills the prompt box; nothing is sent until the user hits
 * Enter.  Everything here is pure string building except `openDeepLink`.
 */

import type { EntityState } from "@/lib/store/store";
import type { Activity, Comment, FieldDef, FieldValue, Issue } from "@/lib/types";
import { PRIORITY_META } from "@/lib/constants";
import { formatBytes, isOverdue } from "@/lib/utils/format";

/** Hard limit on the deep link's `q` parameter (decoded characters). */
export const MAX_PROMPT_CHARS = 5000;

export type ClaudeSurface = "desktop" | "terminal" | "vscode";

/** Where the local session should start.  Empty = Claude Code's home directory. */
export interface ClaudeTarget {
  /** GitHub `owner/name`; resolved to a clone Claude Code has seen before */
  repo: string;
  /** absolute path; wins over `repo` when both are set */
  cwd: string;
}

export const EMPTY_TARGET: ClaudeTarget = { repo: "", cwd: "" };

const DEFAULT_TASK =
  "Pick this issue up: read the repo for the relevant code, tell me what you plan to change, then implement it. Ask me about anything above that is ambiguous before you start.";

/* ── prompt ───────────────────────────────────────────────────────── */

export interface PromptOptions {
  /** e.g. http://localhost:3000 — used to build a back-link to the issue */
  origin?: string;
  /** trailing ask; defaults to a generic "work this issue" instruction */
  task?: string;
  maxChars?: number;
}

/**
 * Markdown prompt carrying the whole issue: core fields, every custom field,
 * description, comments, attachments and recent activity.  Sections are added
 * in priority order and the first one that does not fit is truncated, so the
 * result always stays inside `maxChars`.
 */
export function buildIssuePrompt(
  issue: Issue,
  store: EntityState,
  { origin, task = DEFAULT_TASK, maxChars = MAX_PROMPT_CHARS }: PromptOptions = {},
): string {
  const head = header(issue, store, origin);
  const foot = `\n---\n${task}`;
  const budget = maxChars - head.length - foot.length;

  const sections = [
    fieldsSection(issue, store),
    descriptionSection(issue),
    commentsSection(issue, store),
    attachmentsSection(issue, store),
    activitySection(issue, store),
  ].filter((s): s is string => !!s);

  const prompt = head + fit(sections, budget) + foot;
  // the header alone can exceed a very small budget — never hand the handler more than it takes
  return prompt.length <= maxChars ? prompt : prompt.slice(0, maxChars);
}

function header(issue: Issue, store: EntityState, origin?: string): string {
  const key = `${store.project.key}-${issue.number}`;
  const link = origin ? `${origin}/app/project/engineering/issue/${issue.number}` : null;
  return [
    `Here is issue ${key} from IssueLyst (${store.project.name} project in the ${store.workspace.name} workspace), with all of its fields.`,
    "",
    `# ${key} · ${issue.title}`,
    link ? `Tracker link: ${link}` : null,
    "",
  ]
    .filter((l) => l !== null)
    .join("\n");
}

function fieldsSection(issue: Issue, store: EntityState): string {
  const status = store.statuses.find((s) => s.id === issue.statusId);
  const assignee = store.users.find((u) => u.id === issue.assigneeId);
  const reporter = store.users.find((u) => u.id === issue.createdById);
  const labels = issue.labelIds
    .map((id) => store.labels.find((l) => l.id === id)?.name)
    .filter(Boolean);
  const due = issue.dueDate
    ? `${date(issue.dueDate)}${isOverdue(issue.dueDate, issue.closedAt) ? " (overdue)" : ""}`
    : null;

  const rows: [string, string | null][] = [
    ["Status", status ? `${status.name} (${status.category})` : null],
    ["Priority", PRIORITY_META[issue.priority].label],
    ["Assignee", assignee?.name ?? "Unassigned"],
    ["Reporter", reporter?.name ?? null],
    ["Labels", labels.length ? labels.join(", ") : null],
    ["Due date", due],
    ["Created", date(issue.createdAt)],
    ["Updated", date(issue.updatedAt)],
    ["Closed", issue.closedAt ? date(issue.closedAt) : null],
  ];

  for (const field of [...store.fieldDefs].sort((a, b) => a.position - b.position)) {
    rows.push([field.name, fieldValueText(field, issue.fields?.[field.id] ?? null)]);
  }

  return section("Fields", rows.map(([k, v]) => `- ${k}: ${v ?? "—"}`).join("\n"));
}

/** Human-readable value for any custom field type. */
export function fieldValueText(field: FieldDef, value: FieldValue): string | null {
  if (value == null || value === "") return null;
  if (field.type === "select" || field.type === "multi_select") {
    const ids = Array.isArray(value) ? value : [String(value)];
    const labels = ids
      .map((id) => field.options.find((o) => o.id === id)?.label)
      .filter(Boolean);
    return labels.length ? labels.join(", ") : null;
  }
  if (field.type === "checkbox") return value === true ? "yes" : "no";
  return String(value);
}

function descriptionSection(issue: Issue): string | null {
  const body = issue.description.trim();
  return body ? section("Description", body) : null;
}

function commentsSection(issue: Issue, store: EntityState): string | null {
  const comments = store.comments
    .filter((c) => c.issueId === issue.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (!comments.length) return null;
  return section(
    `Comments (${comments.length})`,
    comments.map((c) => commentText(c, store)).join("\n\n"),
  );
}

function commentText(comment: Comment, store: EntityState): string {
  const author = store.users.find((u) => u.id === comment.userId)?.name ?? "Someone";
  const body = comment.body.trim();
  return `**${author}** · ${date(comment.createdAt)}\n${body}`;
}

function attachmentsSection(issue: Issue, store: EntityState): string | null {
  const files = store.attachments.filter((a) => a.issueId === issue.id);
  if (!files.length) return null;
  return section(
    `Attachments (${files.length})`,
    files
      .map((a) => {
        const hosted = a.source === "cloudinary";
        const where = hosted ? "hosted" : "uploaded";
        const link = hosted ? ` — ${a.url}` : "";
        return `- ${a.filename} (${a.mimeType || "file"}, ${formatBytes(a.size)}, ${where})${link}`;
      })
      .join("\n"),
  );
}

function activitySection(issue: Issue, store: EntityState): string | null {
  const events = store.activities
    .filter((a) => a.issueId === issue.id && a.event !== "comment_added")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);
  if (!events.length) return null;
  return section(
    "Recent activity",
    events.map((a) => `- ${date(a.createdAt)} · ${activityText(a, store)}`).join("\n"),
  );
}

function activityText(activity: Activity, store: EntityState): string {
  const m = activity.meta;
  const who = store.users.find((u) => u.id === activity.userId)?.name ?? "Someone";
  const statusOf = (id: unknown) => store.statuses.find((s) => s.id === id)?.name;
  const labelOf = (id: unknown) => store.labels.find((l) => l.id === id)?.name;
  const userOf = (id: unknown) => store.users.find((u) => u.id === id)?.name;

  const what = (() => {
    switch (activity.event) {
      case "created": return "created this issue";
      case "status_changed": return `changed status to ${statusOf(m.toId) ?? "another status"}`;
      case "priority_changed": return `set priority to ${PRIORITY_META[m.to as keyof typeof PRIORITY_META]?.label ?? "another priority"}`;
      case "assignee_changed": return userOf(m.toId) ? `assigned ${userOf(m.toId)}` : "unassigned this issue";
      case "label_added": return `added label ${labelOf(m.labelId) ?? ""}`.trim();
      case "label_removed": return `removed label ${labelOf(m.labelId) ?? ""}`.trim();
      case "title_changed": return "edited the title";
      case "description_changed": return "updated the description";
      case "due_changed": return m.to ? `set the due date to ${String(m.to)}` : "cleared the due date";
      case "field_changed": return `updated ${store.fieldDefs.find((f) => f.id === m.fieldId)?.name ?? "a field"}`;
      case "attachment_added": return `attached ${String(m.filename)}`;
      default: return "updated this issue";
    }
  })();
  return `${who} ${what}`;
}

function section(title: string, body: string): string {
  return `\n## ${title}\n${body}\n`;
}

function date(iso: string): string {
  return iso.slice(0, 10);
}

/** Appends sections while they fit; truncates the one that overflows. */
function fit(sections: string[], budget: number): string {
  let out = "";
  for (const s of sections) {
    const left = budget - out.length;
    if (left <= 0) break;
    if (s.length <= left) {
      out += s;
      continue;
    }
    const note = "\n… (truncated — open the issue in IssueLyst for the rest)\n";
    if (left > note.length + 200) out += s.slice(0, left - note.length).trimEnd() + note;
    break;
  }
  return out;
}

/* ── links ────────────────────────────────────────────────────────── */

/**
 * `claude-cli://open?…` — opens a Claude Code terminal session.  Parameters are
 * percent-encoded (not form-encoded): the handler decodes `%20`, not `+`.
 */
export function terminalLink(prompt: string, target: ClaudeTarget = EMPTY_TARGET): string {
  const params: string[] = [];
  if (target.cwd.trim()) params.push(`cwd=${encodePath(target.cwd.trim())}`);
  else if (target.repo.trim()) params.push(`repo=${encodePath(target.repo.trim())}`);
  params.push(`q=${encodeURIComponent(prompt)}`);
  return `claude-cli://open?${params.join("&")}`;
}

/** Paths and `owner/name` slugs keep their slashes — legal in a query, and what the docs show. */
function encodePath(value: string): string {
  return encodeURIComponent(value).replace(/%2F/g, "/");
}

/**
 * `claude://code/new?…` — opens a new Claude Code session in the Claude desktop
 * app.  The app takes a `folder` path but has no `repo` lookup, so only `cwd`
 * carries over; with no folder it asks which one to use.
 */
export function desktopLink(prompt: string, target: ClaudeTarget = EMPTY_TARGET): string {
  const params: string[] = [];
  if (target.cwd.trim()) params.push(`folder=${encodePath(target.cwd.trim())}`);
  params.push(`q=${encodeURIComponent(prompt)}`);
  return `claude://code/new?${params.join("&")}`;
}

/** `vscode://anthropic.claude-code/open?…` — opens a Claude Code tab in VS Code. */
export function vscodeLink(prompt: string): string {
  return `vscode://anthropic.claude-code/open?prompt=${encodeURIComponent(prompt)}`;
}

export function deepLink(surface: ClaudeSurface, prompt: string, target: ClaudeTarget): string {
  if (surface === "desktop") return desktopLink(prompt, target);
  return surface === "vscode" ? vscodeLink(prompt) : terminalLink(prompt, target);
}

/** Equivalent one-liner for people who would rather paste into a shell. */
export function cliCommand(prompt: string, target: ClaudeTarget = EMPTY_TARGET): string {
  const quoted = `'${prompt.replace(/'/g, `'\\''`)}'`;
  const cd = target.cwd.trim() ? `cd ${target.cwd.trim()} && ` : "";
  return `${cd}claude ${quoted}`;
}

/** Human-readable description of where the session will open. */
export function targetLabel(target: ClaudeTarget): string {
  if (target.cwd.trim()) return target.cwd.trim();
  if (target.repo.trim()) return target.repo.trim();
  return "your home directory";
}

/**
 * Hands a custom-scheme URL to the OS.  A synthesized anchor click keeps the
 * user activation the handler needs, and navigating to an external scheme
 * never unloads the page — the drawer stays exactly where it was.
 */
export function openDeepLink(url: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
