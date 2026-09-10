import { createFileRoute } from "@tanstack/react-router";
import { InboxScreen } from "@/components/inbox/inbox-screen";

export const Route = createFileRoute("/app/inbox")({
  head: () => ({ meta: [{ title: "Inbox — IssueLyst" }] }),
  component: InboxScreen,
});
