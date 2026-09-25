import { Link, useLocation, type LinkProps } from "@tanstack/react-router";
import { Box, Star, List as ListIcon, Columns3, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { FilterMenu, SortMenu, GroupMenu, ActiveFilterChips } from "./controls";
import { ColumnsMenu } from "./columns-menu";
import { ExportMenu } from "./export-menu";
import { useStore } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { useOnlineUsers } from "@/lib/store/hooks";
import { cn } from "@/lib/utils/cn";

import { DEFAULT_PROJECT_KEY } from "@/lib/constants";

const projectParams = { key: DEFAULT_PROJECT_KEY };

export function ProjectHeader({ showControls = true }: { showControls?: boolean }) {
  const pathname = useLocation({ select: (l) => l.pathname });
  const online = useOnlineUsers();
  const project = useStore((s) => s.project);
  const favorites = useUI((s) => s.favorites);
  const toggleFavorite = useUI((s) => s.toggleFavorite);
  const openCreate = useUI((s) => s.openCreate);
  const isFav = favorites.includes(project.id);
  const isBoard = pathname.includes("/board");

  return (
    <div className="shrink-0 border-b border-border bg-surface">
      {/* Title row — the top of the canvas now the top bar is gone */}
      <div className="flex h-[60px] items-center gap-3 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-primary text-primary-fg">
          <Box size={17} strokeWidth={2.3} />
        </div>
        <h1 className="font-display text-[21px] font-extrabold tracking-[-0.025em] text-text">{project.name}</h1>
        <Tooltip content={isFav ? "Remove from favorites" : "Add to favorites"}>
          <button
            onClick={() => toggleFavorite(project.id)}
            className={cn(
              "rounded-[8px] p-1.5 transition-[background-color,color,transform] duration-150 active:scale-90",
              isFav ? "text-warning hover:bg-warning-soft" : "text-text-subtle hover:bg-surface-2 hover:text-text",
            )}
            aria-label="Favorite"
          >
            <Star size={17} strokeWidth={2.2} className={cn(isFav && "anim-pop fill-warning")} />
          </button>
        </Tooltip>

        <div className="ml-auto flex items-center">
          <div className="flex items-center -space-x-1.5">
            {online.slice(0, 6).map((u) => (
              <span key={u.id} className="relative">
                <Avatar user={u} size="lg" ring />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-surface" />
              </span>
            ))}
          </div>
          <span className="ml-2 flex items-center gap-1 font-display text-[12px] font-semibold text-text-subtle">
      
          </span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex h-[48px] items-center gap-1 px-4 pb-1">
        {/* view tabs — a segmented control */}
        <div className="flex items-center gap-0.5 rounded-[10px] bg-surface-2 p-[3px]">
          <ViewTab to="/app/project/$key/list" params={projectParams} active={!isBoard} icon={<ListIcon size={15} strokeWidth={2.3} />}>List</ViewTab>
          <ViewTab to="/app/project/$key/board" params={projectParams} active={isBoard} icon={<Columns3 size={15} strokeWidth={2.3} />}>Board</ViewTab>
        </div>

        {showControls && (
          <>
            <div className="mx-2 h-5 w-px bg-border" />
            <GroupMenu />
            <SortMenu />
            <FilterMenu />
            {!isBoard && <ColumnsMenu />}
            <div className="ml-auto flex items-center gap-1">
              <ExportMenu scopeLabel="engineering" />
              <button
                onClick={() => openCreate()}
                className="ml-1 flex h-8 items-center gap-1.5 rounded-[10px] bg-primary px-3 font-display text-[13px] font-semibold text-primary-fg transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.97]"
              >
                <Plus size={15} strokeWidth={2.6} /> New issue
              </button>
            </div>
          </>
        )}
      </div>

      {/* Active filters */}
      <FilterChipsBar />
    </div>
  );
}

function FilterChipsBar() {
  return (
    <div className="empty:hidden">
      <ActiveFilterChipsWrapper />
    </div>
  );
}

function ActiveFilterChipsWrapper() {
  return (
    <div className="px-4 [&:has(>*)]:border-t [&:has(>*)]:border-border [&:has(>*)]:py-2">
      <ActiveFilterChips />
    </div>
  );
}

function ViewTab({
  active,
  icon,
  children,
  ...link
}: { active: boolean; icon: React.ReactNode; children: React.ReactNode } & LinkProps) {
  return (
    <Link
      {...link}
      className={cn(
        "flex h-[26px] items-center gap-1.5 rounded-[8px] px-3 font-display text-[13px] transition-all duration-150",
        active
          ? "bg-surface font-bold text-text shadow-[var(--shadow-sm)] dark:bg-surface-active"
          : "font-semibold text-text-muted hover:text-text",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
