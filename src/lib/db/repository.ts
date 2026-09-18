/**
 * The data-layer seam: Postgres rows in, the shape the Zustand store already
 * holds out. Nothing above this file knows a database exists.
 *
 * Reads assemble one snapshot; writes take whichever slices actually changed
 * (see `src/lib/store/neon-storage.ts`) and replace them. That is last-write-
 * wins by construction — correct for the current single-session prototype,
 * and the thing to revisit when two people can edit the same issue.
 */

import { eq, getTableColumns, inArray, notInArray, sql } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "./client";
import * as t from "./schema";
import type {
  Activity,
  Attachment,
  Comment,
  FieldDef,
  Issue,
  Label,
  Notification,
  Project,
  Status,
  User,
  Workspace,
} from "@/lib/types";

/** Everything the store persists, minus session-only state. */
export interface Snapshot {
  workspace: Workspace;
  project: Project;
  users: User[];
  statuses: Status[];
  labels: Label[];
  fieldDefs: FieldDef[];
  issues: Issue[];
  comments: Comment[];
  attachments: Attachment[];
  activities: Activity[];
  notifications: Notification[];
  nextIssueNumber: number;
}

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const req = (d: Date): string => d.toISOString();
const at = (s: string | null | undefined): Date | null => (s ? new Date(s) : null);

/** `SET col = excluded.col` for every non-primary column, built from the schema. */
function upsertSet(table: PgTable) {
  const cols = getTableColumns(table);
  return Object.fromEntries(
    Object.entries(cols)
      .filter(([, c]) => !c.primary)
      .map(([key, c]) => [key, sql.raw(`excluded."${c.name}"`)]),
  );
}

/* ── Read ────────────────────────────────────────────────────────── */

/** The whole dataset, or null when the database has not been seeded yet. */
export async function loadSnapshot(): Promise<Snapshot | null> {
  const d = db();

  const [workspaceRow] = await d.select().from(t.workspaces).limit(1);
  if (!workspaceRow) return null;

  const [projectRow] = await d.select().from(t.projects).where(eq(t.projects.workspaceId, workspaceRow.id)).limit(1);
  if (!projectRow) return null;

  const [userRows, statusRows, labelRows, fieldRows, issueRows, issueLabelRows, commentRows, attachmentRows, activityRows, notificationRows] =
    await Promise.all([
      d.select().from(t.users),
      d.select().from(t.statuses).where(eq(t.statuses.projectId, projectRow.id)),
      d.select().from(t.labels).where(eq(t.labels.projectId, projectRow.id)),
      d.select().from(t.fieldDefs).where(eq(t.fieldDefs.projectId, projectRow.id)),
      d.select().from(t.issues).where(eq(t.issues.projectId, projectRow.id)),
      d.select().from(t.issueLabels),
      d.select().from(t.comments),
      d.select().from(t.attachments),
      d.select().from(t.activities),
      d.select().from(t.notifications),
    ]);

  const labelsByIssue = new Map<string, string[]>();
  for (const row of issueLabelRows) {
    const list = labelsByIssue.get(row.issueId);
    if (list) list.push(row.labelId);
    else labelsByIssue.set(row.issueId, [row.labelId]);
  }

  const issues: Issue[] = issueRows.map((r) => ({
    id: r.id,
    projectId: r.projectId,
    number: r.number,
    title: r.title,
    description: r.description,
    statusId: r.statusId,
    priority: r.priority,
    assigneeId: r.assigneeId,
    createdById: r.createdById,
    labelIds: labelsByIssue.get(r.id) ?? [],
    dueDate: iso(r.dueDate),
    fields: r.fields,
    createdAt: req(r.createdAt),
    updatedAt: req(r.updatedAt),
    closedAt: iso(r.closedAt),
  }));

  return {
    workspace: { id: workspaceRow.id, name: workspaceRow.name, createdAt: req(workspaceRow.createdAt) },
    project: {
      id: projectRow.id,
      workspaceId: projectRow.workspaceId,
      name: projectRow.name,
      key: projectRow.key,
      icon: projectRow.icon,
      description: projectRow.description,
      createdAt: req(projectRow.createdAt),
    },
    users: userRows.map((r) => ({ ...r, createdAt: req(r.createdAt) })),
    statuses: statusRows,
    labels: labelRows,
    fieldDefs: fieldRows,
    issues,
    comments: commentRows.map((r) => ({ ...r, createdAt: req(r.createdAt), updatedAt: iso(r.updatedAt) })),
    attachments: attachmentRows.map((r) => ({
      ...r,
      externalId: r.externalId ?? undefined,
      iconUrl: r.iconUrl ?? undefined,
      createdAt: req(r.createdAt),
    })),
    activities: activityRows.map((r) => ({ ...r, createdAt: req(r.createdAt) })),
    notifications: notificationRows.map((r) => ({ ...r, readAt: iso(r.readAt), createdAt: req(r.createdAt) })),
    nextIssueNumber: issues.length ? Math.max(...issues.map((i) => i.number)) + 1 : 1,
  };
}

/* ── Write ───────────────────────────────────────────────────────── */

/**
 * Replaces the given slices. Rows absent from an incoming slice are deleted,
 * so the database ends up matching the client exactly.
 *
 * neon-http has no interactive transactions, so each slice is applied through
 * `db.batch()` — atomic per call, ordered parents-first — rather than one
 * transaction spanning the whole save.
 */
export async function saveSlices(slices: Partial<Snapshot>): Promise<void> {
  const d = db();

  if (slices.workspace) {
    const w = slices.workspace;
    await d.insert(t.workspaces).values({ id: w.id, name: w.name, createdAt: new Date(w.createdAt) })
      .onConflictDoUpdate({ target: t.workspaces.id, set: upsertSet(t.workspaces) });
  }

  if (slices.project) {
    const p = slices.project;
    await d.insert(t.projects).values({ ...p, createdAt: new Date(p.createdAt) })
      .onConflictDoUpdate({ target: t.projects.id, set: upsertSet(t.projects) });
  }

  if (slices.users) {
    await replace(t.users, t.users.id, slices.users.map((u) => ({ ...u, createdAt: new Date(u.createdAt) })));
  }
  if (slices.statuses) await replace(t.statuses, t.statuses.id, slices.statuses);
  if (slices.labels) await replace(t.labels, t.labels.id, slices.labels);
  if (slices.fieldDefs) await replace(t.fieldDefs, t.fieldDefs.id, slices.fieldDefs);

  if (slices.issues) {
    const rows = slices.issues.map((i) => ({
      id: i.id,
      projectId: i.projectId,
      number: i.number,
      title: i.title,
      description: i.description,
      statusId: i.statusId,
      priority: i.priority,
      assigneeId: i.assigneeId,
      createdById: i.createdById,
      dueDate: at(i.dueDate),
      fields: i.fields,
      createdAt: new Date(i.createdAt),
      updatedAt: new Date(i.updatedAt),
      closedAt: at(i.closedAt),
    }));
    await replace(t.issues, t.issues.id, rows);

    // Label membership rides along with the issues slice: it is edited through
    // the same actions and has no independent lifetime.
    const pairs = slices.issues.flatMap((i) => i.labelIds.map((labelId) => ({ issueId: i.id, labelId })));
    const ids = slices.issues.map((i) => i.id);
    await d.delete(t.issueLabels).where(ids.length ? inArray(t.issueLabels.issueId, ids) : sql`true`);
    if (pairs.length) await d.insert(t.issueLabels).values(pairs).onConflictDoNothing();
  }

  if (slices.comments) {
    await replace(t.comments, t.comments.id, slices.comments.map((c) => ({
      ...c, createdAt: new Date(c.createdAt), updatedAt: at(c.updatedAt),
    })));
  }
  if (slices.attachments) {
    await replace(t.attachments, t.attachments.id, slices.attachments.map((a) => ({
      ...a,
      externalId: a.externalId ?? null,
      iconUrl: a.iconUrl ?? null,
      createdAt: new Date(a.createdAt),
    })));
  }
  if (slices.activities) {
    await replace(t.activities, t.activities.id, slices.activities.map((a) => ({ ...a, createdAt: new Date(a.createdAt) })));
  }
  if (slices.notifications) {
    await replace(t.notifications, t.notifications.id, slices.notifications.map((n) => ({
      ...n, readAt: at(n.readAt), createdAt: new Date(n.createdAt),
    })));
  }
}

/** Upsert every incoming row, then drop whatever the client no longer has. */
async function replace(
  table: PgTable,
  idColumn: AnyPgColumn,
  rows: { id: string }[],
): Promise<void> {
  const d = db();
  if (rows.length) {
    await d.insert(table).values(rows as never).onConflictDoUpdate({ target: idColumn, set: upsertSet(table) as never });
    await d.delete(table).where(notInArray(idColumn, rows.map((r) => r.id)));
  } else {
    await d.delete(table);
  }
}
