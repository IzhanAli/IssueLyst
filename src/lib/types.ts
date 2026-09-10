/**
 * Domain types.  These mirror the intended relational schema (users →
 * workspaces → projects → issues …) so the seeded prototype and a future
 * Neon/Drizzle backend speak the same shape.  IDs are opaque strings.
 */

export type ID = string;

export type Role = "admin" | "member";

export interface User {
  id: ID;
  name: string;
  email: string;
  avatarUrl: string | null;
  /** deterministic accent for the generated avatar */
  color: string;
  role: Role;
  createdAt: string;
}

export interface Workspace {
  id: ID;
  name: string;
  createdAt: string;
}

export interface Project {
  id: ID;
  workspaceId: ID;
  name: string;
  /** issue key prefix, e.g. "ENG" → ENG-142 */
  key: string;
  icon: string;
  description: string;
  createdAt: string;
}

/** Data-driven status — customizable per project in a future SaaS tier. */
export interface Status {
  id: ID;
  projectId: ID;
  name: string;
  /** semantic token color, e.g. var(--status-open) */
  color: string;
  /** lucide icon name or our own key */
  icon: StatusIcon;
  /** column category for board grouping / done detection */
  category: "backlog" | "unstarted" | "started" | "completed" | "canceled";
  position: number;
}

export type StatusIcon =
  | "backlog"
  | "open"
  | "progress"
  | "review"
  | "done"
  | "closed";

export type Priority = "urgent" | "high" | "medium" | "low" | "none";

/* ── Custom / dynamic fields ─────────────────────────────────────── */
export type FieldType =
  | "select"
  | "multi_select"
  | "text"
  | "number"
  | "date"
  | "checkbox";

export interface FieldOption {
  id: ID;
  label: string;
  color: string;
}

export interface FieldDef {
  id: ID;
  projectId: ID;
  name: string;
  type: FieldType;
  /** for select / multi_select */
  options: FieldOption[];
  position: number;
  /** default column visibility in the list view */
  showInList: boolean;
}

/** select → optionId · multi_select → optionId[] · text → string · number → number · date → ISO · checkbox → boolean */
export type FieldValue = string | string[] | number | boolean | null;

export interface Label {
  id: ID;
  projectId: ID;
  name: string;
  color: string;
}

export interface Issue {
  id: ID;
  projectId: ID;
  /** monotonic per project; renders as {project.key}-{number} */
  number: number;
  title: string;
  description: string;
  statusId: ID;
  priority: Priority;
  assigneeId: ID | null;
  createdById: ID;
  labelIds: ID[];
  dueDate: string | null;
  /** dynamic field values keyed by FieldDef id */
  fields: Record<ID, FieldValue>;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface Comment {
  id: ID;
  issueId: ID;
  userId: ID;
  body: string;
  /** user ids mentioned in the body */
  mentions: ID[];
  createdAt: string;
  updatedAt: string | null;
}

export type AttachmentSource = "local" | "drive";

export interface Attachment {
  id: ID;
  issueId: ID;
  filename: string;
  mimeType: string;
  size: number;
  /** object URL (local) or a shareable link (drive) */
  url: string;
  /** where the file lives; drives the icon and open behavior */
  source: AttachmentSource;
  /** provider file id (e.g. Google Drive fileId), when source !== "local" */
  externalId?: string;
  /** small provider icon url, when available */
  iconUrl?: string;
  createdById: ID;
  createdAt: string;
}

export type ActivityEvent =
  | "created"
  | "status_changed"
  | "priority_changed"
  | "assignee_changed"
  | "label_added"
  | "label_removed"
  | "title_changed"
  | "description_changed"
  | "due_changed"
  | "field_changed"
  | "comment_added"
  | "attachment_added";

export interface Activity {
  id: ID;
  issueId: ID;
  userId: ID;
  event: ActivityEvent;
  /** event-specific payload, e.g. { from, to } */
  meta: Record<string, unknown>;
  createdAt: string;
}

export type NotificationType =
  | "assigned"
  | "mentioned"
  | "status_changed"
  | "commented"
  | "followed_changed";

export interface Notification {
  id: ID;
  userId: ID;
  issueId: ID;
  actorId: ID;
  type: NotificationType;
  /** short rendered summary */
  summary: string;
  readAt: string | null;
  createdAt: string;
}

/* ── Denormalized view models (built by selectors for the UI) ────── */

export interface IssueView extends Issue {
  status: Status;
  assignee: User | null;
  labels: Label[];
  commentCount: number;
  attachmentCount: number;
  issueKey: string; // ENG-142
}
