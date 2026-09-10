import { useEffect } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getSession, useSession } from "@/lib/auth/session";
import { useHydrated } from "@/lib/store/hooks";
import { useStore } from "@/lib/store/store";
import { LogoMark } from "@/components/brand/logo";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Set up your project — IssueLyst" }] }),
  beforeLoad: () => {
    // The prototype session is client-held, so this can only run in the
    // browser — it covers client-side navigation. The component below still
    // guards a cold load, where there is no session to read during SSR.
    if (typeof window !== "undefined" && !getSession()) {
      throw redirect({ to: "/login" });
    }
  },
  component: OnboardingRoute,
});

function OnboardingRoute() {
  const navigate = useNavigate();
  const { userId, loading, isAuthed } = useSession();
  const hydrated = useHydrated();
  const setCurrentUser = useStore((s) => s.setCurrentUser);

  useEffect(() => {
    if (!loading && !isAuthed) navigate({ to: "/login", replace: true });
  }, [loading, isAuthed, navigate]);

  useEffect(() => {
    if (userId) setCurrentUser(userId);
  }, [userId, setCurrentUser]);

  if (loading || !hydrated || !isAuthed) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <LogoMark size={30} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-screen">
      <OnboardingWizard />
    </div>
  );
}
