"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import { can, canEditIssue, canDeleteIssue } from "@/lib/auth/permissions";
import type {
  Activity,
  ActivityEvent,
  Attachment,
  Comment,
  FieldDef,
  FieldOption,
  FieldType,
  FieldValue,
  Issue,
  Label,
  Notification,
  Priority,
  Project,
  Status,
  User,
  Workspace,
} from "@/lib/types";
import * as seed from "@/lib/data/seed";

const nowIso = () => new Date().toISOString();

export interface CreateIssueInput {
  title: string;
  description?: string;
  statusId?: string;
  priority?: Priority;
  assigneeId?: string | null;
  labelIds?: string[];
  dueDate?: string | null;
  fields?: Record<string, FieldValue>;
}

export interface EntityState {
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
  currentUserId: string;
  nextIssueNumber: number;

  /* actions */
  setCurrentUser: (id: string) => void;

  /* project setup (onboarding) */
  setProject: (patch: Partial<Pick<Project, "name" | "key" | "icon" | "description">>) => void;
  replaceStatuses: (statuses: Status[]) => void;
  replaceFields: (fields: FieldDef[]) => void;
  replaceLabels: (labels: Label[]) => void;

  /* dynamic fields */
  setIssueFieldValue: (issueId: string, fieldId: string, value: FieldValue) => void;
  createField: (name: string, type: FieldType) => FieldDef;
  updateField: (fieldId: string, patch: Partial<Pick<FieldDef, "name" | "showInList">>) => void;
  deleteField: (fieldId: string) => void;
  addFieldOption: (fieldId: string, label: string, color: string) => FieldOption | undefined;
  updateFieldOption: (fieldId: string, optionId: string, patch: Partial<Pick<FieldOption, "label" | "color">>) => void;
  deleteFieldOption: (fieldId: string, optionId: string) => void;

  createIssue: (input: CreateIssueInput) => Issue;
  updateIssue: (id: string, patch: Partial<Issue>) => void;
  toggleLabel: (issueId: string, labelId: string) => void;
  deleteIssue: (id: string) => void;

  createLabel: (name: string, color: string) => Label;
  deleteLabel: (labelId: string) => void;

  addComment: (issueId: string, body: string) => Comment;
  editComment: (commentId: string, body: string) => void;
  deleteComment: (commentId: string) => void;

  addAttachment: (
    issueId: string,
    file: { name: string; type: string; size: number; url: string; source?: "local" | "drive"; externalId?: string; iconUrl?: string },
  ) => void;
  removeAttachment: (attachmentId: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  resetSeed: () => void;
}

/* ── mention parsing ─────────────────────────────────────────────── */
function parseMentions(body: string, users: User[]): string[] {
  const ids = new Set<string>();
  for (const u of users) {
    if (body.includes(`@${u.name}`)) ids.add(u.id);
  }
  return [...ids];
}

function actorOf(s: EntityState) {
  return s.users.find((u) => u.id === s.currentUserId);
}

/** followers = creator + assignee + everyone who has commented */
function followersOf(issueId: string, s: EntityState): string[] {
  const issue = s.issues.find((i) => i.id === issueId);
  if (!issue) return [];
  const set = new Set<string>([issue.createdById]);
  if (issue.assigneeId) set.add(issue.assigneeId);
  for (const c of s.comments) if (c.issueId === issueId) set.add(c.userId);
  return [...set];
}

function seedState() {
  return {
    workspace: seed.workspace,
    project: seed.project,
    users: seed.users,
    statuses: seed.statuses,
    labels: seed.labels,
    fieldDefs: seed.fieldDefs,
    issues: seed.issues,
    comments: seed.comments,
    attachments: seed.attachments,
    activities: seed.activities,
    notifications: seed.notifications,
    currentUserId: seed.DEFAULT_USER_ID,
    nextIssueNumber: Math.max(...seed.issues.map((i) => i.number)) + 1,
  };
}

export const useStore = create<EntityState>()(
  persist(
    immer((set, get) => {
      /* helpers operating on the immer draft */
      const pushActivity = (
        draft: EntityState,
        issueId: string,
        event: ActivityEvent,
        meta: Record<string, unknown> = {},
      ) => {
        draft.activities.push({
          id: `ac_${nanoid(8)}`,
          issueId,
          userId: draft.currentUserId,
          event,
          meta,
          createdAt: nowIso(),
        });
      };

      const notify = (
        draft: EntityState,
        userIds: string[],
        issueId: string,
        type: Notification["type"],
        summary: string,
      ) => {
        const actor = draft.currentUserId;
        for (const uid of new Set(userIds)) {
          if (uid === actor) continue;
          draft.notifications.unshift({
            id: `nt_${nanoid(8)}`,
            userId: uid,
            issueId,
            actorId: actor,
            type,
            summary,
            readAt: null,
            createdAt: nowIso(),
          });
        }
      };

      return {
        ...seedState(),

        setCurrentUser: (id) => set((s) => { s.currentUserId = id; }),

        /* ── project setup ──────────────────────────────────────── */
        setProject: (patch) => set((s) => {
          if (!can(actorOf(s), "workspace.manage")) return;
          if (patch.name !== undefined) s.project.name = patch.name;
          if (patch.key !== undefined) s.project.key = patch.key;
          if (patch.icon !== undefined) s.project.icon = patch.icon;
          if (patch.description !== undefined) s.project.description = patch.description;
        }),
        replaceStatuses: (statuses) => set((s) => {
          if (!can(actorOf(s), "status.manage")) return;
          s.statuses = statuses.map((st, i) => ({ ...st, position: i }));
        }),
        replaceFields: (fields) => set((s) => {
          if (!can(actorOf(s), "field.manage")) return;
          s.fieldDefs = fields.map((f, i) => ({ ...f, position: i }));
        }),
        replaceLabels: (labels) => set((s) => {
          if (!can(actorOf(s), "label.manage")) return;
          s.labels = labels;
        }),

        /* ── dynamic fields ─────────────────────────────────────── */
        setIssueFieldValue: (issueId, fieldId, value) => {
          set((s) => {
            const issue = s.issues.find((i) => i.id === issueId);
            if (!issue || !canEditIssue(actorOf(s), issue)) return;
            if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
              delete issue.fields[fieldId];
            } else {
              issue.fields[fieldId] = value;
            }
            issue.updatedAt = nowIso();
            pushActivity(s, issueId, "field_changed", { fieldId });
          });
        },

        createField: (name, type) => {
          const field: FieldDef = {
            id: `fd_${nanoid(6)}`,
            projectId: seed.project.id,
            name: name.trim(),
            type,
            options: [],
            position: get().fieldDefs.length,
            showInList: true,
          };
          set((s) => { if (can(actorOf(s), "field.manage")) s.fieldDefs.push(field); });
          return field;
        },

        updateField: (fieldId, patch) => {
          set((s) => {
            if (!can(actorOf(s), "field.manage")) return;
            const f = s.fieldDefs.find((x) => x.id === fieldId);
            if (!f) return;
            if (patch.name !== undefined) f.name = patch.name;
            if (patch.showInList !== undefined) f.showInList = patch.showInList;
          });
        },

        deleteField: (fieldId) => {
          set((s) => {
            if (!can(actorOf(s), "field.manage")) return;
            s.fieldDefs = s.fieldDefs.filter((f) => f.id !== fieldId);
            for (const issue of s.issues) delete issue.fields[fieldId];
          });
        },

        addFieldOption: (fieldId, label, color) => {
          const option: FieldOption = { id: `fo_${nanoid(6)}`, label: label.trim(), color };
          let created: FieldOption | undefined;
          set((s) => {
            if (!can(actorOf(s), "field.manage")) return;
            const f = s.fieldDefs.find((x) => x.id === fieldId);
            if (!f) return;
            f.options.push(option);
            created = option;
          });
          return created;
        },

        updateFieldOption: (fieldId, optionId, patch) => {
          set((s) => {
            if (!can(actorOf(s), "field.manage")) return;
            const f = s.fieldDefs.find((x) => x.id === fieldId);
            const o = f?.options.find((x) => x.id === optionId);
            if (!o) return;
            if (patch.label !== undefined) o.label = patch.label;
            if (patch.color !== undefined) o.color = patch.color;
          });
        },

        deleteFieldOption: (fieldId, optionId) => {
          set((s) => {
            if (!can(actorOf(s), "field.manage")) return;
            const f = s.fieldDefs.find((x) => x.id === fieldId);
            if (!f) return;
            f.options = f.options.filter((o) => o.id !== optionId);
            for (const issue of s.issues) {
              const v = issue.fields[fieldId];
              if (v === optionId) delete issue.fields[fieldId];
              else if (Array.isArray(v)) issue.fields[fieldId] = v.filter((x) => x !== optionId);
            }
          });
        },

        createIssue: (input) => {
          const id = `iss_${nanoid(8)}`;
          const state = get();
          const number = state.nextIssueNumber;
          const issue: Issue = {
            id,
            projectId: seed.project.id,
            number,
            title: input.title.trim(),
            description: input.description ?? "",
            statusId: input.statusId ?? state.statuses[1].id,
            priority: input.priority ?? "none",
            assigneeId: input.assigneeId ?? null,
            createdById: state.currentUserId,
            labelIds: input.labelIds ?? [],
            dueDate: input.dueDate ?? null,
            fields: input.fields ?? {},
            createdAt: nowIso(),
            updatedAt: nowIso(),
            closedAt: null,
          };
          set((s) => {
            s.issues.unshift(issue);
            s.nextIssueNumber = number + 1;
            pushActivity(s, id, "created");
            if (issue.assigneeId) {
              notify(s, [issue.assigneeId], id, "assigned", "assigned you");
            }
          });
          return issue;
        },

        updateIssue: (id, patch) => {
          set((s) => {
            const issue = s.issues.find((i) => i.id === id);
            if (!issue || !canEditIssue(actorOf(s), issue)) return;
            const before = { ...issue };

            if (patch.statusId !== undefined && patch.statusId !== issue.statusId) {
              pushActivity(s, id, "status_changed", { fromId: issue.statusId, toId: patch.statusId });
              const target = s.statuses.find((st) => st.id === patch.statusId);
              const completed = target?.category === "completed" || target?.category === "canceled";
              issue.closedAt = completed ? nowIso() : null;
              issue.statusId = patch.statusId;
              notify(s, followersOf(id, s), id, "status_changed", `moved to ${target?.name ?? "a new status"}`);
            }
            if (patch.priority !== undefined && patch.priority !== issue.priority) {
              pushActivity(s, id, "priority_changed", { from: issue.priority, to: patch.priority });
              issue.priority = patch.priority;
            }
            if (patch.assigneeId !== undefined && patch.assigneeId !== issue.assigneeId) {
              pushActivity(s, id, "assignee_changed", { fromId: issue.assigneeId, toId: patch.assigneeId });
              issue.assigneeId = patch.assigneeId;
              if (patch.assigneeId) notify(s, [patch.assigneeId], id, "assigned", "assigned you");
            }
            if (patch.title !== undefined && patch.title !== issue.title) {
              pushActivity(s, id, "title_changed", { from: issue.title, to: patch.title });
              issue.title = patch.title;
            }
            if (patch.description !== undefined && patch.description !== issue.description) {
              pushActivity(s, id, "description_changed");
              issue.description = patch.description;
            }
            if (patch.dueDate !== undefined && patch.dueDate !== issue.dueDate) {
              pushActivity(s, id, "due_changed", { from: before.dueDate, to: patch.dueDate });
              issue.dueDate = patch.dueDate;
            }
            issue.updatedAt = nowIso();
          });
        },

        toggleLabel: (issueId, labelId) => {
          set((s) => {
            const issue = s.issues.find((i) => i.id === issueId);
            if (!issue || !canEditIssue(actorOf(s), issue)) return;
            const has = issue.labelIds.includes(labelId);
            if (has) {
              issue.labelIds = issue.labelIds.filter((l) => l !== labelId);
              pushActivity(s, issueId, "label_removed", { labelId });
            } else {
              issue.labelIds.push(labelId);
              pushActivity(s, issueId, "label_added", { labelId });
            }
            issue.updatedAt = nowIso();
          });
        },

        deleteIssue: (id) => {
          set((s) => {
            const issue = s.issues.find((i) => i.id === id);
            if (!issue || !canDeleteIssue(actorOf(s), issue)) return;
            s.issues = s.issues.filter((i) => i.id !== id);
            s.comments = s.comments.filter((c) => c.issueId !== id);
            s.activities = s.activities.filter((a) => a.issueId !== id);
            s.attachments = s.attachments.filter((a) => a.issueId !== id);
            s.notifications = s.notifications.filter((n) => n.issueId !== id);
          });
        },

        createLabel: (name, color) => {
          const label: Label = { id: `lb_${nanoid(6)}`, projectId: seed.project.id, name: name.trim(), color };
          set((s) => { if (can(actorOf(s), "label.manage")) s.labels.push(label); });
          return label;
        },

        deleteLabel: (labelId) => {
          set((s) => {
            if (!can(actorOf(s), "label.manage")) return;
            s.labels = s.labels.filter((l) => l.id !== labelId);
            for (const issue of s.issues) {
              if (issue.labelIds.includes(labelId)) issue.labelIds = issue.labelIds.filter((l) => l !== labelId);
            }
          });
        },

        addComment: (issueId, body) => {
          const mentions = parseMentions(body, get().users);
          const comment: Comment = {
            id: `cm_${nanoid(8)}`,
            issueId,
            userId: get().currentUserId,
            body: body.trim(),
            mentions,
            createdAt: nowIso(),
            updatedAt: null,
          };
          set((s) => {
            s.comments.push(comment);
            pushActivity(s, issueId, "comment_added");
            const issue = s.issues.find((i) => i.id === issueId);
            if (issue) issue.updatedAt = nowIso();
            if (mentions.length) notify(s, mentions, issueId, "mentioned", "mentioned you");
            const others = followersOf(issueId, s).filter((u) => !mentions.includes(u));
            notify(s, others, issueId, "commented", "commented");
          });
          return comment;
        },

        editComment: (commentId, body) => {
          set((s) => {
            const c = s.comments.find((x) => x.id === commentId);
            if (!c) return;
            if (c.userId !== s.currentUserId && !can(actorOf(s), "comment.moderate")) return;
            c.body = body.trim();
            c.mentions = parseMentions(body, s.users);
            c.updatedAt = nowIso();
          });
        },

        deleteComment: (commentId) => {
          set((s) => {
            const c = s.comments.find((x) => x.id === commentId);
            if (!c) return;
            if (c.userId !== s.currentUserId && !can(actorOf(s), "comment.moderate")) return;
            s.comments = s.comments.filter((x) => x.id !== commentId);
          });
        },

        addAttachment: (issueId, file) => {
          set((s) => {
            s.attachments.push({
              id: `at_${nanoid(8)}`,
              issueId,
              filename: file.name,
              mimeType: file.type,
              size: file.size,
              url: file.url,
              source: file.source ?? "local",
              externalId: file.externalId,
              iconUrl: file.iconUrl,
              createdById: s.currentUserId,
              createdAt: nowIso(),
            });
            pushActivity(s, issueId, "attachment_added", { filename: file.name });
          });
        },

        removeAttachment: (attachmentId) => {
          set((s) => { s.attachments = s.attachments.filter((a) => a.id !== attachmentId); });
        },

        markNotificationRead: (id) => {
          set((s) => {
            const n = s.notifications.find((x) => x.id === id);
            if (n && !n.readAt) n.readAt = nowIso();
          });
        },

        markAllNotificationsRead: () => {
          set((s) => {
            const uid = s.currentUserId;
            for (const n of s.notifications) if (n.userId === uid && !n.readAt) n.readAt = nowIso();
          });
        },

        resetSeed: () => set(() => seedState() as EntityState),
      };
    }),
    {
      name: "projex.data.v4",
      version: 4,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        workspace: s.workspace,
        project: s.project,
        users: s.users,
        statuses: s.statuses,
        labels: s.labels,
        fieldDefs: s.fieldDefs,
        issues: s.issues,
        comments: s.comments,
        attachments: s.attachments,
        activities: s.activities,
        notifications: s.notifications,
        currentUserId: s.currentUserId,
        nextIssueNumber: s.nextIssueNumber,
      }),
    },
  ),
);

export type Attachments = Attachment[];
