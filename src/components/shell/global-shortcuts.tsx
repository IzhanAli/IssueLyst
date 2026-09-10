"use client";

import { useEffect } from "react";
import { useUI } from "@/lib/store/ui";
import { isTypingTarget } from "@/lib/utils/platform";

/** App-wide keyboard shortcuts. Component-local ones (Esc, arrows) live nearer their view. */
export function GlobalShortcuts() {
  const setCommandOpen = useUI((s) => s.setCommandOpen);
  const openCreate = useUI((s) => s.openCreate);
  const toggleSidebar = useUI((s) => s.toggleSidebar);
  const commandOpen = useUI((s) => s.commandOpen);
  const createOpen = useUI((s) => s.createOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // ⌘K / Ctrl+K — command palette (works even while typing)
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
        return;
      }

      if (isTypingTarget(e.target) || createOpen) return;

      // C — new issue
      if (!mod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        openCreate();
        return;
      }
      // / — open search
      if (!mod && e.key === "/") {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }
      // [ — collapse/expand sidebar
      if (!mod && e.key === "[") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCommandOpen, openCreate, toggleSidebar, commandOpen, createOpen]);

  return null;
}
