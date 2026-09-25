import { useEffect } from "react";
import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { Rail, Sidebar } from "@/components/shell/sidebar";
import { GlobalShortcuts } from "@/components/shell/global-shortcuts";
import { CommandPalette } from "@/components/search/command-palette";
import { CreateIssueModal } from "@/components/issues/create-issue-modal";
import { DrawerHost } from "@/components/issues/detail/drawer-host";
import { getSession, useSession } from "@/lib/auth/session";
import { usePermissions } from "@/lib/auth/use-permissions";
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
  const perms = usePermissions();
  // A bootstrapped project has no setupCompletedAt until an admin finishes the
  // wizard. This can't live in `beforeLoad` with the session check: in database
  // mode the project arrives with the store's snapshot, so there is nothing to
  // read until hydration.
  const needsSetup = useStore((s) => !s.project.setupCompletedAt);

  useEffect(() => {
    if (!loading && !isAuthed) navigate({ to: "/login", replace: true });
  }, [loading, isAuthed, navigate]);

  useEffect(() => {
    if (userId) setCurrentUser(userId);
  }, [userId, setCurrentUser]);

  // Admins only: the wizard turns everyone else away, so a member on an
  // unconfigured project stays in the (empty) app rather than bouncing.
  useEffect(() => {
    if (hydrated && isAuthed && needsSetup && perms.isAdmin) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [hydrated, isAuthed, needsSetup, perms.isAdmin, navigate]);

  if (loading || !hydrated || !isAuthed) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <LogoMark size={30} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-rail text-text">
      {/* Black rail, then a rounded frame holding the grey panel and the paper
          canvas. Search, New issue and the unread count live in the chrome, so
          each screen's own header is the first thing in the canvas. */}
      <Rail />
      <div className="workspace-frame flex min-w-0 flex-1 overflow-hidden rounded-l-[20px] bg-surface">
        <Sidebar />
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
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
