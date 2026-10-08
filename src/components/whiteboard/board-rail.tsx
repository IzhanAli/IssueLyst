import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronsLeft, Lock, Plus } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { useUI } from "@/lib/store/ui";
import { useWhiteboards } from "@/lib/store/whiteboards";
import type { Whiteboard, WhiteboardObject } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { FILL, SHEET } from "./constants";

const pct = (n: number, of: number, min: number) => `${Math.max(min, Math.round((n / of) * 100))}%`;

/** A block per object, scaled from the sheet into the thumbnail. */
function thumbStyle(o: WhiteboardObject): React.CSSProperties {
  return {
    left: pct(o.x, SHEET.width, 2),
    top: pct(o.y, SHEET.height, 2),
    width: pct(o.w, SHEET.width, 6),
    height: pct("h" in o ? o.h : 22, SHEET.height, 4),
    background: o.kind === "sticky" ? FILL[o.color] : o.kind === "text" ? "var(--surface-active)" : "var(--surface-2)",
  };
}

/** The collapsible list of boards beside the canvas, or its tab when closed. */
export function BoardRail({ boards, activeId }: { boards: Whiteboard[]; activeId: string }) {
  const navigate = useNavigate();
  const open = useUI((s) => s.whiteboardRail);
  const setOpen = useUI((s) => s.setWhiteboardRail);
  const createBoard = useWhiteboards((s) => s.createBoard);

  const addBoard = () => {
    const board = createBoard();
    setOpen(true);
    navigate({ to: "/app/whiteboards", search: { board: board.id } });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Show board list"
        className="absolute left-0 top-4 z-[5] flex items-center gap-2 rounded-r-[12px] border border-l-0 border-border bg-surface px-2 py-3 shadow-[var(--shadow-md)] transition-colors [writing-mode:vertical-rl] hover:bg-surface-2"
      >
        <span className="font-display text-[13px] font-bold tracking-[-0.01em] text-text">Boards</span>
        <span className="font-display text-[12px] font-semibold text-text-subtle">{boards.length}</span>
      </button>
    );
  }

  return (
    <div className="anim-scale-in w-[212px] shrink-0 overflow-hidden border-r border-border bg-surface-2">
      <div className="flex h-full w-[212px] flex-col">
        <div className="flex h-12 shrink-0 items-center gap-1 px-3">
          <span className="font-display text-[15px] font-bold tracking-[-0.015em] text-text">Boards</span>
          <span className="ml-1.5 font-display text-[12.5px] font-semibold text-text-subtle">{boards.length}</span>
          <Tooltip content="New board">
            <button
              onClick={addBoard}
              aria-label="New board"
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-[8px] text-text-muted transition-[background-color,color,transform] hover:bg-surface-hover hover:text-text active:scale-90"
            >
              <Plus size={16} strokeWidth={2.4} />
            </button>
          </Tooltip>
          <Tooltip content="Hide board list">
            <button
              onClick={() => setOpen(false)}
              aria-label="Hide board list"
              className="flex h-7 w-7 items-center justify-center rounded-[8px] text-text-muted transition-[background-color,color,transform] hover:bg-surface-hover hover:text-text active:scale-90"
            >
              <ChevronsLeft size={16} strokeWidth={2.4} />
            </button>
          </Tooltip>
        </div>

        <nav aria-label="Boards" className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-3">
          {boards.map((b) => {
            const active = b.id === activeId;
            return (
              <Link
                key={b.id}
                to="/app/whiteboards"
                search={{ board: b.id }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col gap-1.5 rounded-[10px] p-2 text-left transition-colors duration-150",
                  active ? "bg-primary-soft" : "hover:bg-surface-hover/70",
                )}
              >
                <span className="flex w-full items-center gap-1.5 px-0.5">
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate font-display text-[14px] tracking-[-0.012em]",
                      active ? "font-bold text-text" : "font-medium text-text-muted",
                    )}
                  >
                    {b.name}
                  </span>
                  {b.visibility === "private" && (
                    <span role="img" aria-label="Private" className="shrink-0 text-text-subtle">
                      <Lock size={13} strokeWidth={2.5} />
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "relative block h-16 w-full overflow-hidden rounded-[7px] bg-surface transition-shadow",
                    active ? "shadow-[inset_0_0_0_1.5px_var(--text)]" : "shadow-[inset_0_0_0_1px_var(--border)]",
                  )}
                >
                  {b.objects
                    .filter((o) => o.kind !== "ink")
                    .slice(0, 7)
                    .map((o) => (
                      <span key={o.id} className="absolute rounded-[2px]" style={thumbStyle(o)} />
                    ))}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
