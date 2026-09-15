import { useNavigate, useSearch } from "@tanstack/react-router";
import { Plus, Presentation } from "lucide-react";
import { useWhiteboards } from "@/lib/store/whiteboards";
import { BoardRail } from "./board-rail";
import { WhiteboardCanvas } from "./whiteboard-canvas";
import { WhiteboardHeader } from "./whiteboard-header";

export function WhiteboardScreen() {
  const search = useSearch({ from: "/app" });
  const boards = useWhiteboards((s) => s.boards);
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

/** Only reachable if storage was edited by hand: the last board can't be deleted. */
function NoBoards() {
  const navigate = useNavigate();
  const createBoard = useWhiteboards((s) => s.createBoard);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Presentation size={20} />
      </div>
      <h1 className="font-serif text-[16px] font-semibold">No whiteboards yet</h1>
      <button
        onClick={() => navigate({ to: "/app/whiteboards", search: { board: createBoard().id } })}
        className="btn-primary px-3"
      >
        <Plus size={15} /> New board
      </button>
    </div>
  );
}
