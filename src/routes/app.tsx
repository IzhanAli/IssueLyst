import { useEffect } from "react";
import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { GlobalShortcuts } from "@/components/shell/global-shortcuts";
import { CommandPalette } from "@/components/search/command-palette";
import { CreateIssueModal } from "@/components/issues/create-issue-modal";
import { DrawerHost } from "@/components/issues/detail/drawer-host";
import { getSession, useSession } from "@/lib/auth/session";
import { useHydrated } from "@/lib/store/hooks";
import { useStore } from "@/lib/store/store";
import { LogoMark } from "@/components/brand/logo";
import { validateAppSearch } from "@/lib/store/search";

export const Route = createFileRoute("/app")({
  // Owns the whole app's search schema. Every screen below inherits it, which
  // is what lets `?issue=` deep links work from My Issues, the Inbox and Home
  // as well as the project views.
  validateSearch: validateAppSearch,
  beforeLoad: () => {
    // The prototype session is client-held, so this can only run in the
    // browser — it covers client-side navigation, redirecting before the
    // shell renders. The component below still guards a cold load.
    if (typeof window !== "undefined" && !getSession()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
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
    <div className="flex h-screen overflow-hidden bg-bg text-text">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      <GlobalShortcuts />
      <CommandPalette />
      <CreateIssueModal />
      {/* Mounted app-wide, not just under the project route: `?issue=` deep
          links come from My Issues, the Inbox and Home as well. */}
      <DrawerHost />
    </div>
  );
}
