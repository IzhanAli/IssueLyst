import type { Dataset } from "./types.js";

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();
const DAY = 1440;

/** Mirrors the Projex web app's seed so the MCP server speaks the same data. */
export function seedDataset(): Dataset {
  const issues = [
    { number: 142, title: "Authentication redirect loops after session expiry", description: "Users are redirected incorrectly after their session expires, bouncing between /login and /app.", statusId: "st_progress", priority: "urgent", assigneeId: "u_izhan", createdById: "u_ahmed", labelIds: ["lb_bug", "lb_auth", "lb_regression"], dueDate: ago(-2 * DAY), c: 3 * DAY, u: 40 },
    { number: 141, title: "Token refresh silently fails on mobile web", description: "On mobile Safari the refresh token request fails without surfacing an error.", statusId: "st_open", priority: "high", assigneeId: "u_izhan", createdById: "u_sara", labelIds: ["lb_bug", "lb_auth", "lb_mobile"], dueDate: null, c: 2 * DAY + 120, u: 200 },
    { number: 140, title: "Board columns lose scroll position on drag", description: "Dragging a card to a long column resets the column's scroll to the top.", statusId: "st_review", priority: "medium", assigneeId: "u_lena", createdById: "u_izhan", labelIds: ["lb_bug", "lb_ui"], dueDate: null, c: 2 * DAY, u: 90 },
    { number: 139, title: "Inline status editor closes when clicking a nested menu", description: "Opening the status picker then hovering a submenu dismisses the popover.", statusId: "st_open", priority: "medium", assigneeId: "u_marc", createdById: "u_priya", labelIds: ["lb_bug", "lb_ui"], dueDate: null, c: 3 * DAY, u: 3 * DAY },
    { number: 138, title: "Search returns stale results after issue is renamed", description: "The command palette keeps a cached index; renamed issues still match old titles.", statusId: "st_progress", priority: "high", assigneeId: "u_priya", createdById: "u_izhan", labelIds: ["lb_bug", "lb_backend", "lb_perf"], dueDate: ago(-1 * DAY), c: 4 * DAY, u: 30 },
    { number: 137, title: "Add keyboard shortcut to cycle priority on a selected row", description: "Proposal: 1-4 sets priority when a row is focused.", statusId: "st_backlog", priority: "low", assigneeId: null, createdById: "u_ahmed", labelIds: ["lb_feature", "lb_ui"], dueDate: null, c: 5 * DAY, u: 5 * DAY },
    { number: 136, title: "Attachments over 5 MB fail without a message", description: "Large uploads are rejected at the edge but the UI shows an indefinite spinner.", statusId: "st_open", priority: "high", assigneeId: "u_diego", createdById: "u_yuki", labelIds: ["lb_bug", "lb_backend"], dueDate: null, c: 5 * DAY + 60, u: 300 },
    { number: 135, title: "Comment mentions don't notify offline users", description: "When a mentioned user is offline, the notification is dropped rather than persisted.", statusId: "st_progress", priority: "urgent", assigneeId: "u_ahmed", createdById: "u_izhan", labelIds: ["lb_bug", "lb_backend"], dueDate: ago(-3 * DAY), c: 6 * DAY, u: 20 },
    { number: 134, title: "Android app crashes when opening an issue with no assignee", description: "A null assignee dereferences in the detail view on Android.", statusId: "st_review", priority: "urgent", assigneeId: "u_yuki", createdById: "u_marc", labelIds: ["lb_bug", "lb_mobile", "lb_android"], dueDate: ago(-1 * DAY), c: 6 * DAY + 200, u: 120 },
    { number: 133, title: "Filter chips overflow the header on narrow viewports", description: "With four or more active filters the chip row wraps awkwardly.", statusId: "st_open", priority: "low", assigneeId: "u_lena", createdById: "u_sara", labelIds: ["lb_bug", "lb_ui"], dueDate: null, c: 7 * DAY, u: 7 * DAY },
    { number: 132, title: "Optimistic status change doesn't roll back on 500", description: "If the server rejects a status change the card stays in its new column.", statusId: "st_progress", priority: "high", assigneeId: "u_izhan", createdById: "u_priya", labelIds: ["lb_bug", "lb_ui"], dueDate: ago(0), c: 8 * DAY, u: 15 },
    { number: 130, title: "Activity feed duplicates label-added events", description: "Adding two labels in quick succession emits three activity rows instead of two.", statusId: "st_done", priority: "medium", assigneeId: "u_ahmed", createdById: "u_izhan", labelIds: ["lb_bug", "lb_backend"], dueDate: null, c: 10 * DAY, u: 2 * DAY },
    { number: 129, title: "Slow initial list render with 500+ issues", description: "First paint of the list view degrades noticeably past ~500 rows.", statusId: "st_progress", priority: "high", assigneeId: "u_priya", createdById: "u_ahmed", labelIds: ["lb_perf", "lb_ui"], dueDate: ago(-4 * DAY), c: 11 * DAY, u: 60 },
    { number: 124, title: "Export issue list to CSV", description: "Add a menu action to export the currently filtered list as CSV.", statusId: "st_closed", priority: "low", assigneeId: "u_ahmed", createdById: "u_sara", labelIds: ["lb_feature"], dueDate: null, c: 20 * DAY, u: 8 * DAY, closed: true },
  ] as const;

  return {
    project: { id: "prj_eng", key: "ENG", name: "Engineering" },
    users: [
      { id: "u_izhan", name: "Izhan Ali", email: "izhan.ali@wavemaker.com", role: "admin" },
      { id: "u_ahmed", name: "Ahmed Raza", email: "ahmed@meridian.dev", role: "admin" },
      { id: "u_sara", name: "Sara Whitfield", email: "sara@meridian.dev", role: "member" },
      { id: "u_lena", name: "Lena Vogel", email: "lena@meridian.dev", role: "member" },
      { id: "u_marc", name: "Marcus Cole", email: "marcus@meridian.dev", role: "member" },
      { id: "u_priya", name: "Priya Nair", email: "priya@meridian.dev", role: "member" },
      { id: "u_diego", name: "Diego Santos", email: "diego@meridian.dev", role: "member" },
      { id: "u_yuki", name: "Yuki Tanaka", email: "yuki@meridian.dev", role: "member" },
    ],
    statuses: [
      { id: "st_backlog", name: "Backlog", category: "backlog", position: 0 },
      { id: "st_open", name: "Open", category: "unstarted", position: 1 },
      { id: "st_progress", name: "In Progress", category: "started", position: 2 },
      { id: "st_review", name: "In Review", category: "started", position: 3 },
      { id: "st_done", name: "Done", category: "completed", position: 4 },
      { id: "st_closed", name: "Closed", category: "canceled", position: 5 },
    ],
    labels: [
      { id: "lb_bug", name: "Bug", color: "#b23b32" },
      { id: "lb_feature", name: "Feature", color: "#2f7d55" },
      { id: "lb_ui", name: "UI", color: "#7a52a3" },
      { id: "lb_backend", name: "Backend", color: "#34597f" },
      { id: "lb_mobile", name: "Mobile", color: "#0f766e" },
      { id: "lb_android", name: "Android", color: "#2f7d55" },
      { id: "lb_ios", name: "iOS", color: "#6a655c" },
      { id: "lb_qa", name: "QA", color: "#cc6a1f" },
      { id: "lb_regression", name: "Regression", color: "#c23b30" },
      { id: "lb_auth", name: "Auth", color: "#b5791b" },
      { id: "lb_perf", name: "Performance", color: "#2f6ba8" },
    ],
    issues: issues.map((s) => ({
      id: `iss_${s.number}`,
      number: s.number,
      title: s.title,
      description: s.description,
      statusId: s.statusId,
      priority: s.priority,
      assigneeId: s.assigneeId,
      createdById: s.createdById,
      labelIds: [...s.labelIds],
      dueDate: s.dueDate,
      createdAt: ago(s.c),
      updatedAt: ago(s.u),
      closedAt: "closed" in s && s.closed ? ago(s.u) : null,
    })),
    comments: [
      { id: "cm_1", issueId: "iss_142", userId: "u_ahmed", body: "Reproduced on staging. The refresh interceptor re-enters the guard before the token is cleared.", createdAt: ago(2 * DAY) },
      { id: "cm_2", issueId: "iss_142", userId: "u_izhan", body: "I'll add a one-shot lock around the refresh and a ?next= param.", createdAt: ago(90) },
      { id: "cm_3", issueId: "iss_134", userId: "u_yuki", body: "Fix is a simple null guard in the detail view. PR up.", createdAt: ago(130) },
    ],
    activities: [
      { id: "ac_1", issueId: "iss_142", userId: "u_ahmed", event: "created", meta: {}, createdAt: ago(3 * DAY) },
      { id: "ac_2", issueId: "iss_142", userId: "u_izhan", event: "status_changed", meta: { toId: "st_progress" }, createdAt: ago(2 * DAY) },
    ],
    nextIssueNumber: 143,
  };
}
