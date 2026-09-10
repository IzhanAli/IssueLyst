import { createFileRoute } from "@tanstack/react-router";
import { IssueFullScreen } from "@/components/project/issue-full-screen";

export const Route = createFileRoute("/app/project/$key/issue/$issueKey")({
  component: IssueFullScreen,
});
