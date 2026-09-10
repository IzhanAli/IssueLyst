"use client";

import { Search, Inbox } from "lucide-react";
import { ProjectHeader } from "./project-header";
import { IssueList } from "@/components/issues/issue-list";
import { ListSkeleton } from "@/components/issues/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store/store";
import { useHydrated } from "@/lib/store/hooks";
import { useUI } from "@/lib/store/ui";
import { allIssueViews } from "@/lib/store/selectors";

export function ListScreen() {
  const hydrated = useHydrated();
  const store = useStore();
  const openCreate = useUI((s) => s.openCreate);

  return (
    <div className="flex h-full flex-col">
      <ProjectHeader />
      <div className="min-h-0 flex-1">
        {!hydrated ? (
          <ListSkeleton />
        ) : store.issues.length === 0 ? (
          <EmptyState
            icon={<Inbox size={20} />}
            title="No issues yet"
            description="Create your first issue to start tracking work."
            action={<Button variant="primary" size="sm" onClick={() => openCreate()}>Create issue</Button>}
          />
        ) : (
          <IssueList
            views={allIssueViews(store)}
            empty={
              <EmptyState
                icon={<Search size={20} />}
                title="No matching issues"
                description="No issues match the current filters. Try clearing some filters."
              />
            }
          />
        )}
      </div>
    </div>
  );
}
