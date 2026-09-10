import { Suspense } from "react";
import { BoardScreen } from "@/components/project/board-screen";
import { BoardSkeleton } from "@/components/issues/skeletons";

export default function BoardPage() {
  return (
    <Suspense fallback={<BoardSkeleton />}>
      <BoardScreen />
    </Suspense>
  );
}
