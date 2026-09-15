import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Ellipsis, Pencil, Presentation, Share2, Star, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { useOnlineUsers } from "@/lib/store/hooks";
import { useUI } from "@/lib/store/ui";
import { useWhiteboards } from "@/lib/store/whiteboards";
import type { Whiteboard } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { relativeTime } from "@/lib/utils/format";

/**
 * The board's title bar. It stands in for the app's top bar on this screen
 * (see AppLayout), so it keeps the top bar's height and lines up with the
 * sidebar header. The board list opens from its own tab on the canvas edge.
 */
export function WhiteboardHeader({ board, index, total }: { board: Whiteboard; index: number; total: number }) {
  const navigate = useNavigate();
  const online = useOnlineUsers();
  const boards = useWhiteboards((s) => s.boards);
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
    deleteBoard(board.id);
    openBoard(neighbor.id);
    toast.success(`Deleted “${board.name}”`, {
      label: "Undo",
      onClick: () => {
        restoreBoard(board, index);
        openBoard(board.id);
      },
    });
  };

  return (
    <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-border bg-surface px-4">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
        <Presentation size={15} />
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
          className="min-w-0 truncate font-serif text-[16px] font-semibold tracking-[-0.01em] text-text"
        >
          {board.name}
        </h1>
      )}
      <span className="hidden shrink-0 font-mono text-[10.5px] text-text-subtle sm:inline">
        edited {relativeTime(board.updatedAt)}
      </span>
      <Tooltip content={isFav ? "Remove from favorites" : "Add to favorites"}>
        <button
          onClick={() => toggleFavorite(board.id)}
          aria-label="Favorite"
          aria-pressed={isFav}
          className={cn(
            "shrink-0 rounded-md p-1 transition-colors",
            isFav ? "text-warning" : "text-text-subtle hover:bg-surface-hover hover:text-text",
          )}
        >
          <Star size={15} className={cn(isFav && "fill-warning")} />
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
        <button
          onClick={share}
          className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-[12.5px] font-medium text-text transition-colors hover:bg-surface-hover"
        >
          <Share2 size={14} /> Share
        </button>
        <Popover
          placement="bottom-end"
          className="w-52 p-1"
          render={({ close }) => (
            <div>
              <MenuItem
                icon={<Pencil size={14} />}
                onClick={() => {
                  close();
                  setRenaming(true);
                }}
              >
                Rename board
              </MenuItem>
              <MenuItem
                icon={showGrid ? <Check size={14} /> : null}
                pressed={showGrid}
                onClick={() => {
                  setGrid(!showGrid);
                  close();
                }}
              >
                Show dot grid
              </MenuItem>
              <div className="my-1 h-px bg-border" />
              <MenuItem
                icon={<Trash2 size={14} />}
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
                <div className="px-2 pb-1 pt-0.5 text-[10.5px] text-text-subtle">The last board can't be deleted.</div>
              )}
            </div>
          )}
        >
          <button
            aria-label="More"
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-hover hover:text-text data-[state=open]:bg-surface-hover"
          >
            <Ellipsis size={15} />
          </button>
        </Popover>
      </div>
    </div>
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
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-50",
        danger ? "text-danger" : "text-text",
      )}
    >
      <span className={cn("flex w-3.5 justify-center", !danger && "text-text-muted")}>{icon}</span>
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
      className="h-7 min-w-0 max-w-[360px] flex-1 rounded-md border border-ring bg-surface px-1.5 font-serif text-[16px] font-semibold tracking-[-0.01em] text-text"
    />
  );
}
