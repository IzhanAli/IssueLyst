import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/landing-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IssueLyst — Every issue. One clear flow." },
      {
        name: "description",
        content:
          "A focused workspace for engineering teams to capture, prioritize, discuss, and ship issues — without the noise of everything else.",
      },
    ],
  }),
  component: LandingPage,
});
