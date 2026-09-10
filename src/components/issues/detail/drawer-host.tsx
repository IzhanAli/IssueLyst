import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { FloatingPortal } from "@floating-ui/react";
import { IssueDetail } from "./issue-detail";
import { useIssueDrawer } from "@/lib/hooks/use-drawer";
import { useStore } from "@/lib/store/store";
import { useHydrated } from "@/lib/store/hooks";
import { DEFAULT_PROJECT_KEY } from "@/lib/constants";

/** Renders the issue drawer as an overlay driven by the `?issue=` param. */
export function DrawerHost() {
  const { openKey, close } = useIssueDrawer();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const issues = useStore((s) => s.issues);

  const number = openKey ? Number(openKey.split("-").pop()) : null;
  const issue = number != null ? issues.find((i) => i.number === number) : undefined;
  const isOpen = hydrated && !!openKey && !!issue;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isOpen, close]);

  return (
    <FloatingPortal>
      <AnimatePresence>
        {isOpen && issue && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={close}
              className="fixed inset-0 z-[120] bg-[rgb(10_12_20_/_0.38)] backdrop-blur-[1px]"
            />
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 460, damping: 42, mass: 0.9 }}
              className="fixed inset-y-0 right-0 z-[121] w-full max-w-[860px] border-l border-border shadow-[var(--shadow-lg)]"
              role="dialog"
              aria-modal="true"
              aria-label={`Issue ${issue.number}`}
            >
              <IssueDetail
                issueId={issue.id}
                variant="drawer"
                onClose={close}
                onNavigateFull={() =>
                  navigate({
                    to: "/app/project/$key/issue/$issueKey",
                    params: { key: DEFAULT_PROJECT_KEY, issueKey: String(issue.number) },
                    search: {},
                  })
                }
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
}
