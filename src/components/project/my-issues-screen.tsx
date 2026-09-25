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
        <div className="flex h-[60px] items-center gap-3 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-primary text-primary-fg">
            <UserRound size={17} strokeWidth={2.3} />
          </div>
          <h1 className="font-display text-[21px] font-extrabold tracking-[-0.025em]">My Issues</h1>
          <span className="font-display text-[15px] font-semibold text-text-subtle">{views.length}</span>
        </div>
        <div className="flex h-[48px] items-center gap-1 px-4 pb-1">
          <GroupMenu />
          <SortMenu />
          <FilterMenu />
          <ColumnsMenu />
          <div className="ml-auto flex items-center gap-1">
            <ExportMenu scopeLabel="my-issues" baseViews={() => views} />
            <button
              onClick={() => openCreate({ assigneeId: me?.id ?? null })}
              className="ml-1 flex h-8 items-center gap-1.5 rounded-[10px] bg-primary px-3 font-display text-[13px] font-semibold text-primary-fg transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.97]"
            >
              <Plus size={15} strokeWidth={2.6} /> New issue
            </button>
          </div>
        </div>
        <div className="px-4 [&:has(>*)]:border-t [&:has(>*)]:border-border [&:has(>*)]:py-2">
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
