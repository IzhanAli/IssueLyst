import type {
  Activity,
  Attachment,
  Comment,
  Issue,
  Label,
  Notification,
  Project,
  Status,
  User,
  Workspace,
} from "@/lib/types";
import { assignIssueFields } from "./fields-seed";

export { fieldDefs } from "./fields-seed";

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();
const DAY = 1440;

/* ── Workspace / Project ─────────────────────────────────────────── */
export const workspace: Workspace = {
  id: "ws_meridian",
  name: "Meridian",
  createdAt: ago(400 * DAY),
};

export const project: Project = {
  id: "prj_eng",
  workspaceId: workspace.id,
  name: "Engineering",
  key: "ENG",
  icon: "cube",
  description: "Product engineering — bugs, defects and platform work.",
  createdAt: ago(320 * DAY),
};

/* ── Team ────────────────────────────────────────────────────────── */
export const users: User[] = [
  { id: "u_izhan", name: "Izhan Ali", email: "izhan.ali@win.com", avatarUrl: null, color: "#34597f", role: "admin", createdAt: ago(300 * DAY) },
  { id: "u_ahmed", name: "Ahmed Raza", email: "ahmed@meridian.dev", avatarUrl: null, color: "#2f7d55", role: "admin", createdAt: ago(300 * DAY) },
  { id: "u_sara", name: "Sara Whitfield", email: "sara@meridian.dev", avatarUrl: null, color: "#b23b32", role: "member", createdAt: ago(280 * DAY) },
  { id: "u_lena", name: "Lena Vogel", email: "lena@meridian.dev", avatarUrl: null, color: "#7a52a3", role: "member", createdAt: ago(260 * DAY) },
  { id: "u_marc", name: "Marcus Cole", email: "marcus@meridian.dev", avatarUrl: null, color: "#cc6a1f", role: "member", createdAt: ago(240 * DAY) },
  { id: "u_priya", name: "Priya Nair", email: "priya@meridian.dev", avatarUrl: null, color: "#2f6ba8", role: "member", createdAt: ago(220 * DAY) },
  { id: "u_diego", name: "Diego Santos", email: "diego@meridian.dev", avatarUrl: null, color: "#b5791b", role: "member", createdAt: ago(200 * DAY) },
  { id: "u_yuki", name: "Yuki Tanaka", email: "yuki@meridian.dev", avatarUrl: null, color: "#0f766e", role: "member", createdAt: ago(190 * DAY) },
];

export const DEFAULT_USER_ID = "u_izhan";

/* ── Statuses (data-driven) ──────────────────────────────────────── */
export const statuses: Status[] = [
  { id: "st_backlog", projectId: project.id, name: "Backlog", color: "var(--status-backlog)", icon: "backlog", category: "backlog", position: 0 },
  { id: "st_open", projectId: project.id, name: "Open", color: "var(--status-open)", icon: "open", category: "unstarted", position: 1 },
  { id: "st_progress", projectId: project.id, name: "In Progress", color: "var(--status-progress)", icon: "progress", category: "started", position: 2 },
  { id: "st_review", projectId: project.id, name: "In Review", color: "var(--status-review)", icon: "review", category: "started", position: 3 },
  { id: "st_done", projectId: project.id, name: "Done", color: "var(--status-done)", icon: "done", category: "completed", position: 4 },
  { id: "st_closed", projectId: project.id, name: "Closed", color: "var(--status-closed)", icon: "closed", category: "canceled", position: 5 },
];

/* ── Labels ──────────────────────────────────────────────────────── */
export const labels: Label[] = [
  { id: "lb_bug", projectId: project.id, name: "Bug", color: "#c02219" },
  { id: "lb_feature", projectId: project.id, name: "Feature", color: "#0d774c" },
  { id: "lb_ui", projectId: project.id, name: "UI", color: "#6a2f9e" },
  { id: "lb_backend", projectId: project.id, name: "Backend", color: "#2749c4" },
  { id: "lb_mobile", projectId: project.id, name: "Mobile", color: "#0f6b5f" },
  { id: "lb_android", projectId: project.id, name: "Android", color: "#157a45" },
  { id: "lb_ios", projectId: project.id, name: "iOS", color: "#5b6270" },
  { id: "lb_qa", projectId: project.id, name: "QA", color: "#c6551a" },
  { id: "lb_regression", projectId: project.id, name: "Regression", color: "#a81b13" },
  { id: "lb_auth", projectId: project.id, name: "Auth", color: "#a37c13" },
  { id: "lb_perf", projectId: project.id, name: "Performance", color: "#1f57a6" },
];

/* ── Issues ──────────────────────────────────────────────────────── */
type Seed = Omit<Issue, "id" | "projectId" | "fields" | "createdAt" | "updatedAt" | "closedAt"> & {
  createdMinsAgo: number;
  updatedMinsAgo: number;
  closed?: boolean;
};

const seeds: Seed[] = [
  { number: 142, title: "Authentication redirect loops after session expiry", description: "Users are redirected incorrectly after their session expires. Instead of landing on `/login`, they bounce between `/login` and `/app` until the tab is closed.\n\n**Steps to reproduce**\n1. Sign in\n2. Wait for the access token to expire (~30m)\n3. Click any navigation item\n\n**Expected:** a single redirect to the login screen with a `?next=` param.\n**Actual:** an infinite redirect loop.", statusId: "st_progress", priority: "urgent", assigneeId: "u_izhan", createdById: "u_ahmed", labelIds: ["lb_bug", "lb_auth", "lb_regression"], dueDate: ago(-2 * DAY), createdMinsAgo: 3 * DAY, updatedMinsAgo: 40 },
  { number: 141, title: "Token refresh silently fails on mobile web", description: "On mobile Safari the refresh token request fails without surfacing an error, leaving the app in a half-authenticated state.", statusId: "st_open", priority: "high", assigneeId: "u_izhan", createdById: "u_sara", labelIds: ["lb_bug", "lb_auth", "lb_mobile"], dueDate: null, createdMinsAgo: 2 * DAY + 120, updatedMinsAgo: 200 },
  { number: 140, title: "Board columns lose scroll position on drag", description: "Dragging a card to a long column resets the column's scroll position to the top, which is disorienting for large boards.", statusId: "st_review", priority: "medium", assigneeId: "u_lena", createdById: "u_izhan", labelIds: ["lb_bug", "lb_ui"], dueDate: null, createdMinsAgo: 2 * DAY, updatedMinsAgo: 90 },
  { number: 139, title: "Inline status editor closes when clicking a nested menu", description: "Opening the status picker and then hovering a submenu dismisses the whole popover on some browsers due to focus loss.", statusId: "st_open", priority: "medium", assigneeId: "u_marc", createdById: "u_priya", labelIds: ["lb_bug", "lb_ui"], dueDate: null, createdMinsAgo: 3 * DAY, updatedMinsAgo: 3 * DAY },
  { number: 138, title: "Search returns stale results after issue is renamed", description: "The command palette keeps a cached index; renamed issues still match their old title for ~60s.", statusId: "st_progress", priority: "high", assigneeId: "u_priya", createdById: "u_izhan", labelIds: ["lb_bug", "lb_backend", "lb_perf"], dueDate: ago(-1 * DAY), createdMinsAgo: 4 * DAY, updatedMinsAgo: 30 },
  { number: 137, title: "Add keyboard shortcut to cycle priority on a selected row", description: "Power users want to bump priority without opening a menu. Proposal: `1`–`4` sets priority when a row is focused.", statusId: "st_backlog", priority: "low", assigneeId: null, createdById: "u_ahmed", labelIds: ["lb_feature", "lb_ui"], dueDate: null, createdMinsAgo: 5 * DAY, updatedMinsAgo: 5 * DAY },
  { number: 136, title: "Attachments over 5 MB fail without a message", description: "Large uploads are rejected at the edge but the UI shows an indefinite spinner instead of an error toast.", statusId: "st_open", priority: "high", assigneeId: "u_diego", createdById: "u_yuki", labelIds: ["lb_bug", "lb_backend"], dueDate: null, createdMinsAgo: 5 * DAY + 60, updatedMinsAgo: 300 },
  { number: 135, title: "Comment mentions don't notify offline users", description: "When a mentioned user is offline, the notification is dropped rather than persisted for their next session.", statusId: "st_progress", priority: "urgent", assigneeId: "u_ahmed", createdById: "u_izhan", labelIds: ["lb_bug", "lb_backend"], dueDate: ago(-3 * DAY), createdMinsAgo: 6 * DAY, updatedMinsAgo: 20 },
  { number: 134, title: "Android app crashes when opening an issue with no assignee", description: "A null assignee dereferences in the detail view on Android, causing an immediate crash.", statusId: "st_review", priority: "urgent", assigneeId: "u_yuki", createdById: "u_marc", labelIds: ["lb_bug", "lb_mobile", "lb_android"], dueDate: ago(-1 * DAY), createdMinsAgo: 6 * DAY + 200, updatedMinsAgo: 120 },
  { number: 133, title: "Filter chips overflow the header on narrow viewports", description: "With four or more active filters the chip row wraps awkwardly behind the sort control.", statusId: "st_open", priority: "low", assigneeId: "u_lena", createdById: "u_sara", labelIds: ["lb_bug", "lb_ui"], dueDate: null, createdMinsAgo: 7 * DAY, updatedMinsAgo: 7 * DAY },
  { number: 132, title: "Optimistic status change doesn't roll back on 500", description: "If the server rejects a status change the card stays in its new column. We need to roll back and surface a subtle error.", statusId: "st_progress", priority: "high", assigneeId: "u_izhan", createdById: "u_priya", labelIds: ["lb_bug", "lb_ui"], dueDate: ago(0), createdMinsAgo: 8 * DAY, updatedMinsAgo: 15 },
  { number: 131, title: "Due-date picker allows dates in the past without warning", description: "Selecting a past due date should still be allowed but visually flagged as overdue immediately.", statusId: "st_backlog", priority: "low", assigneeId: null, createdById: "u_diego", labelIds: ["lb_feature"], dueDate: null, createdMinsAgo: 9 * DAY, updatedMinsAgo: 9 * DAY },
  { number: 130, title: "Activity feed duplicates label-added events", description: "Adding two labels in quick succession emits three activity rows instead of two.", statusId: "st_done", priority: "medium", assigneeId: "u_ahmed", createdById: "u_izhan", labelIds: ["lb_bug", "lb_backend"], dueDate: null, createdMinsAgo: 10 * DAY, updatedMinsAgo: 2 * DAY, closed: false },
  { number: 129, title: "Slow initial list render with 500+ issues", description: "First paint of the list view degrades noticeably past ~500 rows. Consider virtualization.", statusId: "st_progress", priority: "high", assigneeId: "u_priya", createdById: "u_ahmed", labelIds: ["lb_perf", "lb_ui"], dueDate: ago(-4 * DAY), createdMinsAgo: 11 * DAY, updatedMinsAgo: 60 },
  { number: 128, title: "iOS keyboard covers the comment composer", description: "On smaller iPhones the on-screen keyboard overlaps the composer, hiding the send button.", statusId: "st_open", priority: "medium", assigneeId: "u_yuki", createdById: "u_lena", labelIds: ["lb_bug", "lb_mobile", "lb_ios"], dueDate: null, createdMinsAgo: 12 * DAY, updatedMinsAgo: 4 * DAY },
  { number: 127, title: "Dark mode: status chips fail contrast on selected rows", description: "Selected-row background plus chip color drops below AA in dark mode for the 'In Progress' status.", statusId: "st_backlog", priority: "medium", assigneeId: "u_lena", createdById: "u_izhan", labelIds: ["lb_ui", "lb_qa"], dueDate: null, createdMinsAgo: 13 * DAY, updatedMinsAgo: 13 * DAY },
  { number: 126, title: "Bulk-assign from the list selection", description: "Allow selecting multiple rows and assigning them all at once from a toolbar action.", statusId: "st_backlog", priority: "low", assigneeId: null, createdById: "u_marc", labelIds: ["lb_feature"], dueDate: null, createdMinsAgo: 14 * DAY, updatedMinsAgo: 14 * DAY },
  { number: 125, title: "Regression: sort by priority ignores 'none'", description: "Issues with no priority sort to the top instead of the bottom after the last refactor.", statusId: "st_done", priority: "medium", assigneeId: "u_diego", createdById: "u_priya", labelIds: ["lb_bug", "lb_regression"], dueDate: null, createdMinsAgo: 16 * DAY, updatedMinsAgo: 5 * DAY },
  { number: 124, title: "Export issue list to CSV", description: "Add a menu action to export the currently filtered list as CSV, respecting the visible columns.", statusId: "st_closed", priority: "low", assigneeId: "u_ahmed", createdById: "u_sara", labelIds: ["lb_feature"], dueDate: null, createdMinsAgo: 20 * DAY, updatedMinsAgo: 8 * DAY, closed: true },
  { number: 123, title: "Notification inbox marks all read on open", description: "Opening the inbox shouldn't clear unread state until the user actually views each item.", statusId: "st_done", priority: "high", assigneeId: "u_izhan", createdById: "u_yuki", labelIds: ["lb_bug"], dueDate: null, createdMinsAgo: 22 * DAY, updatedMinsAgo: 6 * DAY },
  { number: 122, title: "Drag handle appears on hover only — hard to discover", description: "Consider a subtle persistent affordance so users know rows are reorderable.", statusId: "st_review", priority: "low", assigneeId: "u_lena", createdById: "u_marc", labelIds: ["lb_ui"], dueDate: null, createdMinsAgo: 24 * DAY, updatedMinsAgo: 3 * DAY },
  { number: 121, title: "Deep link to an issue opens the wrong project", description: "Sharing an issue URL from Engineering opens it in the last-viewed project context.", statusId: "st_open", priority: "high", assigneeId: "u_priya", createdById: "u_izhan", labelIds: ["lb_bug", "lb_backend"], dueDate: null, createdMinsAgo: 26 * DAY, updatedMinsAgo: 26 * DAY },
  { number: 120, title: "Add 'My Issues' empty state with a create CTA", description: "New teammates land on an empty My Issues with no guidance.", statusId: "st_closed", priority: "low", assigneeId: "u_sara", createdById: "u_ahmed", labelIds: ["lb_ui"], dueDate: null, createdMinsAgo: 30 * DAY, updatedMinsAgo: 12 * DAY, closed: true },
];

/* ── Materialize with ids/dates ──────────────────────────────────── */
export const issues: Issue[] = seeds.map((s) => {
  const closedAt = s.closed ? ago(s.updatedMinsAgo) : null;
  const issue: Issue = {
    id: `iss_${s.number}`,
    projectId: project.id,
    number: s.number,
    title: s.title,
    description: s.description,
    statusId: s.statusId,
    priority: s.priority,
    assigneeId: s.assigneeId,
    createdById: s.createdById,
    labelIds: s.labelIds,
    dueDate: s.dueDate,
    fields: {},
    createdAt: ago(s.createdMinsAgo),
    updatedAt: ago(s.updatedMinsAgo),
    closedAt,
  };
  issue.fields = assignIssueFields(issue);
  return issue;
});

/* ── Comments ────────────────────────────────────────────────────── */
export const comments: Comment[] = [
  { id: "cm_1", issueId: "iss_142", userId: "u_ahmed", body: "Reproduced on staging. Looks like the refresh interceptor re-enters the guard before the token is cleared.", mentions: [], createdAt: ago(2 * DAY), updatedAt: null },
  { id: "cm_2", issueId: "iss_142", userId: "u_izhan", body: "Good catch — I'll add a one-shot lock around the refresh and a `?next=` param. @Ahmed Raza can you check the mobile path once I push?", mentions: ["u_ahmed"], createdAt: ago(90), updatedAt: null },
  { id: "cm_3", issueId: "iss_135", userId: "u_izhan", body: "We should persist the notification server-side and reconcile on next connect. @Sara Whitfield thoughts on the schema?", mentions: ["u_sara"], createdAt: ago(60), updatedAt: null },
  { id: "cm_4", issueId: "iss_134", userId: "u_yuki", body: "Fix is a simple null guard in the detail view. PR up.", mentions: [], createdAt: ago(130), updatedAt: null },
  { id: "cm_5", issueId: "iss_129", userId: "u_priya", body: "Prototyping row virtualization — early numbers show first paint down from 1.2s to ~180ms at 1k rows.", mentions: [], createdAt: ago(75), updatedAt: null },
  { id: "cm_6", issueId: "iss_142", userId: "u_izhan", body: "Pushed the lock fix. Please retest @Sara Whitfield.", mentions: ["u_sara"], createdAt: ago(38), updatedAt: null },
];

/* ── Attachments ─────────────────────────────────────────────────── */
export const attachments: Attachment[] = [
  { id: "at_1", issueId: "iss_142", filename: "redirect-loop.har", mimeType: "application/json", size: 184_320, url: "#", source: "local", createdById: "u_ahmed", createdAt: ago(2 * DAY) },
  { id: "at_2", issueId: "iss_134", filename: "android-crash-stacktrace.txt", mimeType: "text/plain", size: 12_400, url: "#", source: "local", createdById: "u_yuki", createdAt: ago(140) },
  { id: "at_3", issueId: "iss_140", filename: "scroll-jump.gif", mimeType: "image/gif", size: 2_310_000, url: "#", source: "local", createdById: "u_lena", createdAt: ago(95) },
  { id: "at_4", issueId: "iss_142", filename: "auth-flow-sequence.png", mimeType: "image/png", size: 428_900, url: "https://res.cloudinary.com/demo/image/upload/v1/issuelyst/auth-flow-sequence.png", source: "cloudinary", externalId: "issuelyst/auth-flow-sequence", createdById: "u_izhan", createdAt: ago(70) },
];

/* ── Notifications for the default user ──────────────────────────── */
export const notifications: Notification[] = [
  { id: "nt_1", userId: "u_izhan", issueId: "iss_135", actorId: "u_sara", type: "commented", summary: "replied on your issue", readAt: null, createdAt: ago(18) },
  { id: "nt_2", userId: "u_izhan", issueId: "iss_142", actorId: "u_ahmed", type: "mentioned", summary: "mentioned you", readAt: null, createdAt: ago(35) },
  { id: "nt_3", userId: "u_izhan", issueId: "iss_138", actorId: "u_ahmed", type: "assigned", summary: "assigned you", readAt: null, createdAt: ago(200) },
  { id: "nt_4", userId: "u_izhan", issueId: "iss_129", actorId: "u_priya", type: "status_changed", summary: "moved to In Progress", readAt: ago(50), createdAt: ago(60) },
  { id: "nt_5", userId: "u_izhan", issueId: "iss_123", actorId: "u_yuki", type: "commented", summary: "commented", readAt: ago(300), createdAt: ago(6 * DAY) },
];

/* ── Activity (generated + a few authored) ───────────────────────── */
export const activities: Activity[] = [
  { id: "ac_1", issueId: "iss_142", userId: "u_ahmed", event: "created", meta: {}, createdAt: ago(3 * DAY) },
  { id: "ac_2", issueId: "iss_142", userId: "u_ahmed", event: "assignee_changed", meta: { toId: "u_izhan" }, createdAt: ago(3 * DAY - 5) },
  { id: "ac_3", issueId: "iss_142", userId: "u_izhan", event: "status_changed", meta: { fromId: "st_open", toId: "st_progress" }, createdAt: ago(2 * DAY) },
  { id: "ac_4", issueId: "iss_142", userId: "u_izhan", event: "priority_changed", meta: { from: "high", to: "urgent" }, createdAt: ago(2 * DAY - 10) },
  { id: "ac_5", issueId: "iss_142", userId: "u_ahmed", event: "comment_added", meta: {}, createdAt: ago(2 * DAY) },
  { id: "ac_6", issueId: "iss_142", userId: "u_izhan", event: "comment_added", meta: {}, createdAt: ago(90) },
  { id: "ac_7", issueId: "iss_142", userId: "u_izhan", event: "comment_added", meta: {}, createdAt: ago(38) },
];
