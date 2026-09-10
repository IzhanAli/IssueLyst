import { ProjectHeader } from "./project-header";
import { Board } from "./board";
import { BoardSkeleton } from "@/components/issues/skeletons";
import { useHydrated } from "@/lib/store/hooks";

export function BoardScreen() {
  const hydrated = useHydrated();
  return (
    <div className="flex h-full flex-col">
      <ProjectHeader />
      <div className="min-h-0 flex-1">{hydrated ? <Board /> : <BoardSkeleton />}</div>
    </div>
  );
}
