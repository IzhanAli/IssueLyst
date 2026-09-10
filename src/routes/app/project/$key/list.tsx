import { createFileRoute } from "@tanstack/react-router";
import { ListScreen } from "@/components/project/list-screen";

export const Route = createFileRoute("/app/project/$key/list")({
  component: ListScreen,
});
