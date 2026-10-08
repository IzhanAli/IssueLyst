import { useNavigate, useSearch } from "@tanstack/react-router";
import { Plus, Presentation } from "lucide-react";
import { useVisibleBoards, useWhiteboards } from "@/lib/store/whiteboards";
import { BoardRail } from "./board-rail";
import { WhiteboardCanvas } from "./whiteboard-canvas";
import { WhiteboardHeader } from "./whiteboard-header";

export function WhiteboardScreen() {
  const search = useSearch({ from: "/app" });
  // Someone else's private board is as good as missing.
  const boards = useVisibleBoards();
  // A missing or unknown `?board=` falls back to the first board.
  const index = Math.max(0, boards.findIndex((b) => b.id === search.board));
  const board = boards[index];

  if (!board) return <NoBoards />;

  return (
    <div className="flex h-full flex-col">
      <WhiteboardHeader board={board} index={index} total={boards.length} />
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <BoardRail boards={boards} activeId={board.id} />
        {/* Keyed, so switching boards starts from a fresh selection, tool and viewport. */}
        <WhiteboardCanvas key={board.id} board={board} suspended={!!search.issue} />
      </div>
    </div>
  );
}

/**
 * The last board can't be deleted, so this is reached when every board is
 * someone else's private one (or storage was edited by hand).
 */
function NoBoards() {
  const navigate = useNavigate();
  const createBoard = useWhiteboards((s) => s.createBoard);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="anim-pop flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary text-primary-fg">
        <Presentation size={22} strokeWidth={2.25} />
      </div>
      <h1 className="font-display text-[22px] font-extrabold tracking-[-0.025em]">No whiteboards yet</h1>
      <button
        onClick={() => navigate({ to: "/app/whiteboards", search: { board: createBoard().id } })}
        className="btn-primary px-4"
      >
        <Plus size={16} strokeWidth={2.5} /> New board
      </button>
    </div>
  );
}
