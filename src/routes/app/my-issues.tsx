import { createFileRoute } from "@tanstack/react-router";
import { MyIssuesScreen } from "@/components/project/my-issues-screen";

export const Route = createFileRoute("/app/my-issues")({
  head: () => ({ meta: [{ title: "My Issues — IssueLyst" }] }),
  component: MyIssuesScreen,
});
