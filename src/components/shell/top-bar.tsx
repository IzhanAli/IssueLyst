"use client";

import { Search, Plus, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import { useUI } from "@/lib/store/ui";
import { useUnreadCount } from "@/lib/store/hooks";
import { isMac } from "@/lib/utils/platform";

export function TopBar() {
  const setCommandOpen = useUI((s) => s.setCommandOpen);
  const openCreate = useUI((s) => s.openCreate);
  const unread = useUnreadCount();
  const pathname = usePathname();
  const mod = isMac() ? "⌘" : "Ctrl";

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-surface px-3">
      <button
        onClick={() => setCommandOpen(true)}
        className="group flex h-8 w-full max-w-[440px] items-center gap-2 rounded-lg border border-transparent bg-surface-2 px-2.5 text-left text-text-subtle transition-colors hover:bg-surface-hover"
      >
        <Search size={15} />
        <span className="flex-1 text-[13px]">Search issues, people, labels…</span>
        <span className="flex items-center gap-0.5">
          <Kbd>{mod}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Tooltip content="Inbox">
          <Link
            href="/app/inbox"
            className="relative flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            aria-label="Inbox"
            data-active={pathname.startsWith("/app/inbox")}
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-danger px-1 font-mono text-[9px] font-medium text-white">
                {unread}
              </span>
            )}
          </Link>
        </Tooltip>

        <Tooltip content="New issue" shortcut="C">
          <button
            onClick={() => openCreate()}
            className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[13px] font-medium text-primary-fg shadow-[var(--shadow-sm)] transition-colors hover:bg-primary-hover"
          >
            <Plus size={15} />
            New issue
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
