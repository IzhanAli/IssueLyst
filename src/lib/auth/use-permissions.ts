import { useCurrentUser } from "@/lib/store/hooks";
import { can, canEditIssue, canDeleteIssue, type Permission } from "./permissions";
import type { Issue } from "@/lib/types";

/** Reactive permission helpers bound to the current acting user. */
export function usePermissions() {
  const user = useCurrentUser();
  return {
    user,
    isAdmin: user?.role === "admin",
    can: (perm: Permission) => can(user, perm),
    canEdit: (issue: Pick<Issue, "assigneeId" | "createdById"> | null | undefined) => canEditIssue(user, issue),
    canDelete: (issue: Pick<Issue, "createdById"> | null | undefined) => canDeleteIssue(user, issue),
  };
}
