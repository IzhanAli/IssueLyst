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
      {/* Title row */}
      <div className="flex h-[46px] items-center gap-2.5 px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-soft text-primary">
          <Box size={15} />
        </div>
        <h1 className="font-serif text-[16px] font-semibold tracking-[-0.01em] text-text">{project.name}</h1>
        <Tooltip content={isFav ? "Remove from favorites" : "Add to favorites"}>
          <button
            onClick={() => toggleFavorite(project.id)}
            className={cn("rounded-md p-1 transition-colors", isFav ? "text-warning" : "text-text-subtle hover:bg-surface-hover hover:text-text")}
            aria-label="Favorite"
          >
            <Star size={15} className={cn(isFav && "fill-warning")} />
          </button>
        </Tooltip>

        <div className="ml-auto flex items-center">
          <div className="flex items-center -space-x-1.5">
            {online.slice(0, 6).map((u) => (
              <span key={u.id} className="relative">
                <Avatar user={u} size="md" ring />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-surface" />
              </span>
            ))}
          </div>
          <span className="ml-2 flex items-center gap-1 font-mono text-[11px] text-text-subtle">
      
          </span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex h-[42px] items-center gap-1 border-t border-border px-3">
        {/* view tabs */}
        <div className="flex items-center gap-0.5">
          <ViewTab to="/app/project/$key/list" params={projectParams} active={!isBoard} icon={<ListIcon size={14} />}>List</ViewTab>
          <ViewTab to="/app/project/$key/board" params={projectParams} active={isBoard} icon={<Columns3 size={14} />}>Board</ViewTab>
        </div>

        {showControls && (
          <>
            <div className="mx-1.5 h-4 w-px bg-border" />
            <GroupMenu />
            <SortMenu />
            <FilterMenu />
            {!isBoard && <ColumnsMenu />}
            <div className="ml-auto flex items-center gap-1">
              <ExportMenu scopeLabel="engineering" />
              <button
                onClick={() => openCreate()}
                className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-[12.5px] font-medium text-text transition-colors hover:bg-surface-hover"
              >
                <Plus size={14} /> New issue
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
    <div className="px-3 [&:has(>*)]:border-t [&:has(>*)]:border-border [&:has(>*)]:py-2">
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
        "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors",
        active ? "bg-surface-active text-text" : "text-text-muted hover:bg-surface-hover hover:text-text",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
