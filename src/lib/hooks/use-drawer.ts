import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

/** Drives the issue detail drawer through the `?issue=142` search param. */
export function useIssueDrawer() {
  const search = useSearch({ from: "/app" });
  const navigate = useNavigate();
  const openKey = search.issue ?? null;

  // Opening pushes, so Back closes the drawer and returns to the list.
  const open = useCallback(
    (key: string) => {
      navigate({
        to: ".",
        search: { ...search, issue: key },
        resetScroll: false,
      });
    },
    [navigate, search],
  );

  // Closing replaces, so it doesn't stack a second entry on top of the open.
  const close = useCallback(() => {
    navigate({
      to: ".",
      search: { ...search, issue: undefined },
      replace: true,
      resetScroll: false,
    });
  }, [navigate, search]);

  return { openKey, open, close };
}
