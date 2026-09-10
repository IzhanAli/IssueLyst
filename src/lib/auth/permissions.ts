import type { Issue, Role, User } from "@/lib/types";

/**
 * Extensible RBAC. V1 has two roles; the capability list is the seam a future
 * SaaS tier grows into (custom roles, per-project grants, etc.).
 *
 * Rules of thumb:
 *  - Members run the tracker: create issues, edit ANY issue's fields, and
 *    comment. They cannot reshape the schema or delete issues.
 *  - Admins additionally manage the schema (fields, options, statuses,
 *    labels) and delete issues.
 */
export type Permission =
  | "issue.create"
  | "issue.edit_any"
  | "issue.delete"
  | "comment.moderate" // edit/delete others' comments
  | "field.manage"
  | "label.manage"
  | "status.manage"
  | "workspace.manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "issue.create",
    "issue.edit_any",
    "issue.delete",
    "comment.moderate",
    "field.manage",
    "label.manage",
    "status.manage",
    "workspace.manage",
  ],
  member: ["issue.create"],
};

export function can(user: Pick<User, "role"> | null | undefined, perm: Permission): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(perm) ?? false;
}

/** Any signed-in member or admin may change any issue's fields. */
export function canEditIssue(
  user: Pick<User, "id" | "role"> | null | undefined,
  _issue?: Pick<Issue, "assigneeId" | "createdById"> | null | undefined,
): boolean {
  return !!user;
}

/** Deleting issues is admin-only. */
export function canDeleteIssue(
  user: Pick<User, "id" | "role"> | null | undefined,
  _issue?: Pick<Issue, "createdById"> | null | undefined,
): boolean {
  return can(user, "issue.delete");
}
