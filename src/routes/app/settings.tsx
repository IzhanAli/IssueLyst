import { createFileRoute } from "@tanstack/react-router";
import { SettingsScreen } from "@/components/settings/settings-screen";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — IssueLyst" }] }),
  component: SettingsScreen,
});
