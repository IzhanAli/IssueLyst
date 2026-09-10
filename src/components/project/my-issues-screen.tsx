import { UserRound, CheckCircle2, Plus } from "lucide-react";
import { GroupMenu, SortMenu, FilterMenu, ActiveFilterChips } from "./controls";
import { ColumnsMenu } from "./columns-menu";
import { ExportMenu } from "./export-menu";
import { IssueList } from "@/components/issues/issue-list";
import { ListSkeleton } from "@/components/issues/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store/store";
import { useHydrated, useCurrentUser } from "@/lib/store/hooks";
import { useUI } from "@/lib/store/ui";
import { allIssueViews } from "@/lib/store/selectors";

export function MyIssuesScreen() {
  const hydrated = useHydrated();
  const store = useStore();
  const me = useCurrentUser();
  const openCreate = useUI((s) => s.openCreate);

  const views = hydrated && me ? allIssueViews(store).filter((v) => v.assigneeId === me.id) : [];

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border bg-surface">
        <div className="flex h-[46px] items-center gap-2.5 px-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-soft text-primary">
            <UserRound size={15} />
          </div>
          <h1 className="font-serif text-[16px] font-semibold tracking-[-0.01em]">My Issues</h1>
          <span className="font-mono text-[11px] text-text-subtle">{views.length}</span>
        </div>
        <div className="flex h-[42px] items-center gap-1 border-t border-border px-3">
          <GroupMenu />
          <SortMenu />
          <FilterMenu />
          <ColumnsMenu />
          <div className="ml-auto flex items-center gap-1">
            <ExportMenu scopeLabel="my-issues" baseViews={() => views} />
            <button onClick={() => openCreate({ assigneeId: me?.id ?? null })} className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-[12.5px] font-medium hover:bg-surface-hover">
              <Plus size={14} /> New issue
            </button>
          </div>
        </div>
        <div className="px-3 [&:has(>*)]:border-t [&:has(>*)]:border-border [&:has(>*)]:py-2">
          <ActiveFilterChips />
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {!hydrated ? (
          <ListSkeleton />
        ) : views.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={20} />}
            title="You're all clear"
            description="Nothing is assigned to you right now. Create an issue or pick one up from the board."
            action={<Button variant="primary" size="sm" onClick={() => openCreate({ assigneeId: me?.id ?? null })}>Create issue</Button>}
          />
        ) : (
          <IssueList views={views} empty={<EmptyState title="No matching issues" description="Try clearing some filters." />} />
        )}
      </div>
    </div>
  );
}
