import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/home/home-screen";

export const Route = createFileRoute("/app/home")({
  head: () => ({ meta: [{ title: "Home — IssueLyst" }] }),
  component: HomeScreen,
});
