import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronsLeft, Plus } from "lucide-react";
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
        className="absolute left-0 top-4 z-[5] flex items-center gap-1.5 rounded-r-lg border border-l-0 border-border bg-surface px-1.5 py-2.5 shadow-[var(--shadow-md)] transition-colors [writing-mode:vertical-rl] hover:bg-surface-2"
      >
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-muted">Boards</span>
        <span className="font-mono text-[10px] text-text-subtle">{boards.length}</span>
      </button>
    );
  }

  return (
    <div className="anim-scale-in w-[200px] shrink-0 overflow-hidden border-r border-border bg-surface-2">
      <div className="flex h-full w-[200px] flex-col">
        <div className="flex h-[34px] shrink-0 items-center gap-1.5 border-b border-border px-2.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-subtle">Boards</span>
          <Tooltip content="New board">
            <button
              onClick={addBoard}
              aria-label="New board"
              className="ml-auto flex h-[22px] w-[22px] items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              <Plus size={14} />
            </button>
          </Tooltip>
          <Tooltip content="Hide board list">
            <button
              onClick={() => setOpen(false)}
              aria-label="Hide board list"
              className="flex h-[22px] w-[22px] items-center justify-center rounded text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              <ChevronsLeft size={14} />
            </button>
          </Tooltip>
        </div>

        <nav aria-label="Boards" className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-2">
          {boards.map((b, i) => {
            const active = b.id === activeId;
            return (
              <Link
                key={b.id}
                to="/app/whiteboards"
                search={{ board: b.id }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col gap-[5px] rounded-lg border p-1.5 text-left transition-colors",
                  active ? "border-primary/25 bg-primary-soft" : "border-transparent hover:bg-surface-hover",
                )}
              >
                <span className="flex w-full items-center gap-1.5">
                  <span className="font-mono text-[10px] text-text-subtle">{String(i + 1).padStart(2, "0")}</span>
                  <span
                    className={cn("flex-1 truncate text-[12px] font-medium", active ? "text-primary" : "text-text-muted")}
                  >
                    {b.name}
                  </span>
                </span>
                <span className="relative block h-16 w-full overflow-hidden rounded-[5px] bg-surface shadow-[inset_0_0_0_1px_var(--border)]">
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
