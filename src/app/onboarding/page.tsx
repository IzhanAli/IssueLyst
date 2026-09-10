"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { useSession } from "@/lib/auth/session";
import { useHydrated } from "@/lib/store/hooks";
import { useStore } from "@/lib/store/store";
import { LogoMark } from "@/components/brand/logo";

export default function OnboardingPage() {
  const router = useRouter();
  const { userId, loading, isAuthed } = useSession();
  const hydrated = useHydrated();
  const setCurrentUser = useStore((s) => s.setCurrentUser);

  useEffect(() => {
    if (!loading && !isAuthed) router.replace("/login");
  }, [loading, isAuthed, router]);

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
