"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Drives the issue detail drawer through the `?issue=ENG-123` URL param. */
export function useIssueDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const openKey = sp.get("issue");

  const open = useCallback(
    (key: string) => {
      const p = new URLSearchParams(sp.toString());
      p.set("issue", key);
      router.push(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [router, pathname, sp],
  );

  const close = useCallback(() => {
    const p = new URLSearchParams(sp.toString());
    p.delete("issue");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, sp]);

  return { openKey, open, close };
}
