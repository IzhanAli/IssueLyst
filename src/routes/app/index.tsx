import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_PROJECT_KEY } from "@/lib/constants";

export const Route = createFileRoute("/app/")({
  beforeLoad: () => {
    throw redirect({
      to: "/app/project/$key/list",
      params: { key: DEFAULT_PROJECT_KEY },
      replace: true,
    });
  },
});
