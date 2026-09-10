"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { GlobalShortcuts } from "@/components/shell/global-shortcuts";
import { CommandPalette } from "@/components/search/command-palette";
import { CreateIssueModal } from "@/components/issues/create-issue-modal";
import { DrawerHost } from "@/components/issues/detail/drawer-host";
import { useSession } from "@/lib/auth/session";
import { useHydrated } from "@/lib/store/hooks";
import { useStore } from "@/lib/store/store";
import { LogoMark } from "@/components/brand/logo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
    <div className="flex h-screen overflow-hidden bg-bg text-text">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
      <GlobalShortcuts />
      <CommandPalette />
      <CreateIssueModal />
      {/* Mounted app-wide, not just under the project route: `?issue=` deep links
          come from My Issues, the Inbox and Home as well. */}
      <Suspense fallback={null}>
        <DrawerHost />
      </Suspense>
    </div>
  );
}
