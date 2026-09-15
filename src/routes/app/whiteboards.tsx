import { createFileRoute } from "@tanstack/react-router";
import { WhiteboardScreen } from "@/components/whiteboard/whiteboard-screen";

export const Route = createFileRoute("/app/whiteboards")({
  head: () => ({ meta: [{ title: "Whiteboards — IssueLyst" }] }),
  component: WhiteboardScreen,
});
