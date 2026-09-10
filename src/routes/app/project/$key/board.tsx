import { createFileRoute } from "@tanstack/react-router";
import { BoardScreen } from "@/components/project/board-screen";

export const Route = createFileRoute("/app/project/$key/board")({
  component: BoardScreen,
});
