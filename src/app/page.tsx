import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Projex — Every issue. One clear flow.",
  description:
    "A focused workspace for engineering teams to capture, prioritize, discuss, and ship issues — without the noise of everything else.",
};

export default function RootPage() {
  return <LandingPage />;
}
