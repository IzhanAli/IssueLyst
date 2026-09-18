/**
 * Drizzle schema — the relational form of `src/lib/types.ts`.
 *
 * `types.ts` stays the single source of truth for the union types (Role,
 * Priority, StatusIcon …). Columns hold them as `text().$type<T>()` rather
 * than Postgres enums: a pg enum needs an `ALTER TYPE` migration to gain a
 * value, and these unions still move. Swap them for pg enums once they settle.
 *
 * Timestamps are real `timestamptz`. The app speaks ISO strings end to end,
 * so the repository converts at the boundary and nowhere else.
 */

import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import type {
  ActivityEvent,
  AttachmentSource,
  FieldOption,
  FieldType,
  FieldValue,
  JsonValue,
  NotificationType,
  Priority,
  Role,
  Status,
  StatusIcon,
  WhiteboardObject,
} from "@/lib/types";

const id = () => text("id").primaryKey();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull();

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  color: text("color").notNull(),
  role: text("role").$type<Role>().notNull(),
  createdAt: createdAt(),
});

export const workspaces = pgTable("workspaces", {
  id: id(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const projects = pgTable("projects", {
  id: id(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: text("key").notNull(),
  icon: text("icon").notNull(),
  description: text("description").notNull().default(""),
  createdAt: createdAt(),
});

export const statuses = pgTable("statuses", {
  id: id(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon").$type<StatusIcon>().notNull(),
  category: text("category").$type<Status["category"]>().notNull(),
  position: integer("position").notNull(),
}, (t) => [index("statuses_project_idx").on(t.projectId)]);

export const labels = pgTable("labels", {
  id: id(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
}, (t) => [index("labels_project_idx").on(t.projectId)]);

export const fieldDefs = pgTable("field_defs", {
  id: id(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").$type<FieldType>().notNull(),
  // Options belong to their definition and are never queried across rows.
  options: jsonb("options").$type<FieldOption[]>().notNull().default([]),
  position: integer("position").notNull(),
  showInList: boolean("show_in_list").notNull().default(true),
}, (t) => [index("field_defs_project_idx").on(t.projectId)]);

export const issues = pgTable("issues", {
  id: id(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  statusId: text("status_id").notNull().references(() => statuses.id),
  priority: text("priority").$type<Priority>().notNull(),
  assigneeId: text("assignee_id").references(() => users.id, { onDelete: "set null" }),
  createdById: text("created_by_id").notNull().references(() => users.id),
  dueDate: timestamp("due_date", { withTimezone: true }),
  // Values for user-defined fields: schemaless by design, keyed by field id.
  fields: jsonb("fields").$type<Record<string, FieldValue>>().notNull().default({}),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
}, (t) => [
  index("issues_project_idx").on(t.projectId),
  index("issues_status_idx").on(t.statusId),
  index("issues_assignee_idx").on(t.assigneeId),
]);

/** The one genuinely many-to-many relation, so it gets a real join table. */
export const issueLabels = pgTable("issue_labels", {
  issueId: text("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  labelId: text("label_id").notNull().references(() => labels.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.issueId, t.labelId] }),
  index("issue_labels_label_idx").on(t.labelId),
]);

export const comments = pgTable("comments", {
  id: id(),
  issueId: text("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  // A cache of what the body parsed to, not an independent relation.
  mentions: jsonb("mentions").$type<string[]>().notNull().default([]),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (t) => [index("comments_issue_idx").on(t.issueId)]);

export const attachments = pgTable("attachments", {
  id: id(),
  issueId: text("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  source: text("source").$type<AttachmentSource>().notNull(),
  externalId: text("external_id"),
  iconUrl: text("icon_url"),
  createdById: text("created_by_id").notNull().references(() => users.id),
  createdAt: createdAt(),
}, (t) => [index("attachments_issue_idx").on(t.issueId)]);

export const activities = pgTable("activities", {
  id: id(),
  issueId: text("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  event: text("event").$type<ActivityEvent>().notNull(),
  meta: jsonb("meta").$type<Record<string, JsonValue>>().notNull().default({}),
  createdAt: createdAt(),
}, (t) => [index("activities_issue_idx").on(t.issueId)]);

export const notifications = pgTable("notifications", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  issueId: text("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  actorId: text("actor_id").notNull().references(() => users.id),
  type: text("type").$type<NotificationType>().notNull(),
  summary: text("summary").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("notifications_user_idx").on(t.userId)]);

export const whiteboards = pgTable("whiteboards", {
  id: id(),
  workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // The object list is a document: always read and written whole.
  objects: jsonb("objects").$type<WhiteboardObject[]>().notNull().default([]),
  createdById: text("created_by_id").notNull().references(() => users.id),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
}, (t) => [index("whiteboards_workspace_idx").on(t.workspaceId)]);
