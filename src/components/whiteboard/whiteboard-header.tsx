import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, Ellipsis, Lock, Pencil, Presentation, Share2, Star, Trash2, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { useOnlineUsers } from "@/lib/store/hooks";
import { useStore } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { useVisibleBoards, useWhiteboards } from "@/lib/store/whiteboards";
import type { Whiteboard, WhiteboardVisibility } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { relativeTime } from "@/lib/utils/format";

/**
 * The board's title bar: the top of the canvas, like every screen's own
 * header, and 60px tall so it lines up with the sidebar's workspace header.
 * The board list opens from its own tab on the canvas edge.
 */
export function WhiteboardHeader({ board, index, total }: { board: Whiteboard; index: number; total: number }) {
  const navigate = useNavigate();
  const online = useOnlineUsers();
  const boards = useVisibleBoards();
  const renameBoard = useWhiteboards((s) => s.renameBoard);
  const deleteBoard = useWhiteboards((s) => s.deleteBoard);
  const restoreBoard = useWhiteboards((s) => s.restoreBoard);
  const favorites = useUI((s) => s.favorites);
  const toggleFavorite = useUI((s) => s.toggleFavorite);
  const showGrid = useUI((s) => s.whiteboardGrid);
  const setGrid = useUI((s) => s.setWhiteboardGrid);
  const [renaming, setRenaming] = useState(false);
  const isFav = favorites.includes(board.id);

  const openBoard = (id: string) => navigate({ to: "/app/whiteboards", search: { board: id } });

  const share = async () => {
    const url = `${window.location.origin}/app/whiteboards?board=${encodeURIComponent(board.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link to this board copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const remove = () => {
    const neighbor = boards[index + 1] ?? boards[index - 1];
    if (!neighbor) return;
    // `index` counts only the boards this user can see; restore where it sat among all of them
    const at = useWhiteboards.getState().boards.findIndex((b) => b.id === board.id);
    deleteBoard(board.id);
    openBoard(neighbor.id);
    toast.success(`Deleted “${board.name}”`, {
      label: "Undo",
      onClick: () => {
        restoreBoard(board, at);
        openBoard(board.id);
      },
    });
  };

  return (
    <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-border bg-surface px-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-primary text-primary-fg">
        <Presentation size={17} strokeWidth={2.25} />
      </div>
      {renaming ? (
        <RenameField
          value={board.name}
          onDone={(name) => {
            setRenaming(false);
            const next = name?.trim();
            if (next && next !== board.name) renameBoard(board.id, next);
          }}
        />
      ) : (
        <h1
          onDoubleClick={() => setRenaming(true)}
          className="min-w-0 truncate font-display text-[21px] font-extrabold tracking-[-0.025em] text-text"
        >
          {board.name}
        </h1>
      )}
      <span className="hidden shrink-0 font-display text-[12.5px] font-semibold text-text-subtle sm:inline">
        edited {relativeTime(board.updatedAt)}
      </span>
      <Tooltip content={isFav ? "Remove from favorites" : "Add to favorites"}>
        <button
          onClick={() => toggleFavorite(board.id)}
          aria-label="Favorite"
          aria-pressed={isFav}
          className={cn(
            "shrink-0 rounded-[8px] p-1.5 transition-[background-color,color,transform] active:scale-90",
            isFav ? "text-warning" : "text-text-subtle hover:bg-surface-hover hover:text-text",
          )}
        >
          <Star size={17} strokeWidth={2.25} className={cn(isFav && "anim-pop fill-warning")} />
        </button>
      </Tooltip>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <div className="mr-1.5 hidden items-center -space-x-1.5 md:flex">
          {online.slice(0, 6).map((u) => (
            <span key={u.id} className="relative">
              <Avatar user={u} size="md" ring />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-surface" />
            </span>
          ))}
        </div>
        <VisibilityControl board={board} />
        <button
          onClick={share}
          className="flex h-8 items-center gap-1.5 rounded-[10px] border border-border-strong bg-surface px-3 font-display text-[13px] font-semibold text-text transition-[background-color,transform] duration-150 hover:bg-surface-2 active:scale-[0.97]"
        >
          <Share2 size={15} strokeWidth={2.25} /> Share
        </button>
        <Popover
          placement="bottom-end"
          className="w-56 p-1.5"
          render={({ close }) => (
            <div>
              <MenuItem
                icon={<Pencil size={15} strokeWidth={2.25} />}
                onClick={() => {
                  close();
                  setRenaming(true);
                }}
              >
                Rename board
              </MenuItem>
              <MenuItem
                icon={showGrid ? <Check size={15} strokeWidth={2.5} className="text-accent" /> : null}
                pressed={showGrid}
                onClick={() => {
                  setGrid(!showGrid);
                  close();
                }}
              >
                Show dot grid
              </MenuItem>
              <div className="mx-1 my-1 h-px bg-border" />
              <MenuItem
                icon={<Trash2 size={15} strokeWidth={2.25} />}
                danger
                disabled={total < 2}
                onClick={() => {
                  close();
                  remove();
                }}
              >
                Delete board
              </MenuItem>
              {total < 2 && (
                <div className="px-2.5 pb-1 pt-0.5 text-[12px] text-text-subtle">The last board can't be deleted.</div>
              )}
            </div>
          )}
        >
          <button
            aria-label="More"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-text-muted transition-colors hover:bg-surface-hover hover:text-text data-[state=open]:bg-surface-hover data-[state=open]:text-text"
          >
            <Ellipsis size={17} strokeWidth={2.25} />
          </button>
        </Popover>
      </div>
    </div>
  );
}

const VISIBILITY: { value: WhiteboardVisibility; label: string; icon: typeof Lock; hint: (workspace: string) => string }[] = [
  { value: "team", label: "Team", icon: Users, hint: (workspace) => `Everyone in ${workspace} can open it` },
  { value: "private", label: "Private", icon: Lock, hint: () => "Only you can open it" },
];

/** Who can open the board. Everyone sees the setting; only the board's creator can change it. */
function VisibilityControl({ board }: { board: Whiteboard }) {
  const me = useStore((s) => s.currentUserId);
  const workspace = useStore((s) => s.workspace.name);
  const creator = useStore((s) => s.users.find((u) => u.id === board.createdById));
  const setVisibility = useWhiteboards((s) => s.setVisibility);
  const isCreator = board.createdById === me;
  const current = VISIBILITY.find((v) => v.value === board.visibility) ?? VISIBILITY[0];

  return (
    <Popover
      placement="bottom-end"
      className="w-72 p-1.5"
      render={({ close }) => (
        <div role="group" aria-label="Visibility">
          {VISIBILITY.map((v) => {
            const on = v.value === board.visibility;
            return (
              <button
                key={v.value}
                onClick={() => {
                  setVisibility(board.id, v.value);
                  close();
                  if (!on) toast.success(v.value === "private" ? "Only you can open this board now" : `Shared with ${workspace}`);
                }}
                disabled={!isCreator}
                aria-pressed={on}
                className="flex w-full items-start gap-2.5 rounded-[8px] px-2.5 py-2 text-left transition-colors hover:bg-surface-2 disabled:pointer-events-none"
              >
                <span className="mt-px flex w-4 justify-center text-text-muted">
                  <v.icon size={15} strokeWidth={2.25} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-display text-[13.5px] font-semibold text-text">{v.label}</span>
                  <span className="text-[12.5px] text-text-muted">{v.hint(workspace)}</span>
                </span>
                {on && <Check size={15} strokeWidth={2.5} className="mt-0.5 shrink-0 text-accent" />}
              </button>
            );
          })}
          {!isCreator && (
            <div className="mx-1 mt-1 border-t border-border px-1.5 pb-1 pt-2 text-[12px] text-text-subtle">
              Only {creator?.name ?? "the board's creator"} can change who sees this board.
            </div>
          )}
        </div>
      )}
    >
      <button
        aria-label={`Visibility: ${current.label}`}
        className="flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 font-display text-[13px] font-semibold text-text-muted transition-[background-color,color,transform] duration-150 hover:bg-surface-hover hover:text-text active:scale-[0.97] data-[state=open]:bg-surface-hover data-[state=open]:text-text"
      >
        <current.icon size={15} strokeWidth={2.25} />
        {current.label}
        <ChevronDown size={13} strokeWidth={2.5} className="-ml-0.5 opacity-60" />
      </button>
    </Popover>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  danger,
  disabled,
  pressed,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-[7px] text-left font-display text-[13.5px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-45",
        danger ? "text-danger hover:bg-danger-soft" : "text-text hover:bg-surface-2",
      )}
    >
      <span className={cn("flex w-4 justify-center", !danger && "text-text-muted")}>{icon}</span>
      <span className="flex-1">{children}</span>
    </button>
  );
}

/** Inline board rename. Enter or blur saves; Escape cancels. */
function RenameField({ value, onDone }: { value: string; onDone: (name: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);
  const done = useRef(false);
  const focused = useRef(false);

  // Opened from the menu, the popover hands focus back to its trigger on a
  // frame of its own as it closes; take focus on the frame after that.
  useEffect(() => {
    const id = requestAnimationFrame(() => ref.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  const finish = (name: string | null) => {
    if (done.current) return;
    done.current = true;
    onDone(name);
  };

  return (
    <input
      ref={ref}
      value={draft}
      aria-label="Board name"
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => {
        focused.current = true;
        e.currentTarget.select();
      }}
      onBlur={() => focused.current && finish(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") finish(null);
      }}
      className="h-9 min-w-0 max-w-[380px] flex-1 rounded-[10px] border border-ring bg-surface px-2 font-display text-[21px] font-extrabold tracking-[-0.025em] text-text shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_22%,transparent)]"
    />
  );
}
