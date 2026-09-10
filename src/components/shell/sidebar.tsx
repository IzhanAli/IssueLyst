"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Inbox,
  UserRound,
  Star,
  Settings,
  Box,
  ChevronDown,
  Check,
  PanelLeftClose,
  PanelLeft,
  List as ListIcon,
  Columns3,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { LogoMark } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { useCurrentUser, useUnreadCount } from "@/lib/store/hooks";
import { useStore } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { useTheme } from "@/components/theme/use-theme";
import { signOut } from "@/lib/auth/session";
import { UserMenu } from "./user-menu";

const PROJECT_BASE = `/app/project/engineering`;

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const toggleSidebar = useUI((s) => s.toggleSidebar);
  const favorites = useUI((s) => s.favorites);
  const unread = useUnreadCount();
  const workspace = useStore((s) => s.workspace);
  const project = useStore((s) => s.project);
  const openIssues = useStore((s) =>
    s.issues.filter((i) => {
      const st = s.statuses.find((x) => x.id === i.statusId);
      return st && st.category !== "completed" && st.category !== "canceled";
    }).length,
  );

  const isFav = favorites.includes(project.id);

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-surface-2 transition-[width] duration-200",
        collapsed ? "w-[54px]" : "w-[236px]",
      )}
    >
      {/* Workspace header */}
      <div className={cn("flex h-12 items-center gap-2 border-b border-border px-2.5", collapsed && "justify-center px-0")}>
        {collapsed ? (
          <LogoMark size={22} />
        ) : (
          <Popover
            placement="bottom-start"
            className="w-56"
            render={() => (
              <div className="p-1">
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[12px] font-semibold text-primary-fg">
                    {workspace.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">{workspace.name}</div>
                    <div className="truncate font-mono text-[10.5px] text-text-subtle">Free · 1 project</div>
                  </div>
                  <Check size={15} className="ml-auto text-primary" />
                </div>
                <div className="my-1 h-px bg-border" />
                <MenuLink href="/app/settings">Workspace settings</MenuLink>
                <div className="px-2 py-1.5 text-[12px] text-text-subtle">Adding workspaces arrives with multi-tenant.</div>
              </div>
            )}
          >
            <button className="flex flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-surface-hover">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-fg">
                {workspace.name[0]}
              </div>
              <span className="truncate text-[13.5px] font-medium">{workspace.name}</span>
              <ChevronDown size={14} className="ml-auto text-text-subtle" />
            </button>
          </Popover>
        )}
        {!collapsed && (
          <Tooltip content="Collapse sidebar" shortcut="[">
            <button onClick={toggleSidebar} className="rounded-md p-1 text-text-subtle hover:bg-surface-hover hover:text-text" aria-label="Collapse sidebar">
              <PanelLeftClose size={16} />
            </button>
          </Tooltip>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2.5">
        {collapsed && (
          <Tooltip content="Expand sidebar" placement="right">
            <button onClick={toggleSidebar} className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-md text-text-subtle hover:bg-surface-hover hover:text-text" aria-label="Expand sidebar">
              <PanelLeft size={16} />
            </button>
          </Tooltip>
        )}

        <NavItem href="/app/home" icon={<Home size={16} />} label="Home" collapsed={collapsed} active={pathname === "/app/home"} />
        <NavItem href="/app/inbox" icon={<Inbox size={16} />} label="Inbox" collapsed={collapsed} active={pathname.startsWith("/app/inbox")} badge={unread || undefined} />
        <NavItem href="/app/my-issues" icon={<UserRound size={16} />} label="My Issues" collapsed={collapsed} active={pathname.startsWith("/app/my-issues")} />

        {isFav && (
          <Section label="Favorites" collapsed={collapsed}>
            <NavItem
              href={`${PROJECT_BASE}/list`}
              icon={<Star size={15} className="fill-warning text-warning" />}
              label={project.name}
              collapsed={collapsed}
              active={false}
              small
            />
          </Section>
        )}

        <Section label="Project" collapsed={collapsed}>
          <ProjectTree collapsed={collapsed} pathname={pathname} openIssues={openIssues} />
        </Section>
      </nav>

      {/* Footer: settings + user */}
      <div className="border-t border-border p-2">
        <NavItem href="/app/settings" icon={<Settings size={16} />} label="Settings" collapsed={collapsed} active={pathname.startsWith("/app/settings")} />
        <UserFooter collapsed={collapsed} />
      </div>
    </aside>
  );
}

function ProjectTree({ collapsed, pathname, openIssues }: { collapsed: boolean; pathname: string; openIssues: number }) {
  const [open, setOpen] = useState(true);
  const project = useStore((s) => s.project);
  const active = pathname.startsWith(PROJECT_BASE);

  if (collapsed) {
    return (
      <Tooltip content={project.name} placement="right">
        <Link
          href={`${PROJECT_BASE}/list`}
          className={cn(
            "mx-auto flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text",
            active && "bg-surface-active text-text",
          )}
        >
          <Box size={16} />
        </Link>
      </Tooltip>
    );
  }

  return (
    <div>
      <div className={cn("group flex items-center gap-1 rounded-md px-1.5 py-1.5 hover:bg-surface-hover", active && "text-text")}>
        <button onClick={() => setOpen((v) => !v)} className="rounded p-0.5 text-text-subtle hover:text-text" aria-label="Toggle project">
          <ChevronDown size={13} className={cn("transition-transform", !open && "-rotate-90")} />
        </button>
        <Link href={`${PROJECT_BASE}/list`} className="flex min-w-0 flex-1 items-center gap-2">
          <Box size={15} className="text-text-muted" />
          <span className="truncate text-[13px] font-medium">{project.name}</span>
        </Link>
        <span className="font-mono text-[10.5px] text-text-subtle">{openIssues}</span>
      </div>
      {open && (
        <div className="ml-[18px] mt-0.5 space-y-0.5 border-l border-border pl-2">
          <SubLink href={`${PROJECT_BASE}/list`} icon={<ListIcon size={14} />} label="List" active={pathname.startsWith(`${PROJECT_BASE}/list`)} />
          <SubLink href={`${PROJECT_BASE}/board`} icon={<Columns3 size={14} />} label="Board" active={pathname.startsWith(`${PROJECT_BASE}/board`)} />
        </div>
      )}
    </div>
  );
}

function SubLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1 text-[12.5px] text-text-muted transition-colors hover:bg-surface-hover hover:text-text",
        active && "bg-primary-soft font-medium text-primary",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function Section({ label, collapsed, children }: { label: string; collapsed: boolean; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      {!collapsed && (
        <div className="mb-1 px-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-subtle">{label}</div>
      )}
      {children}
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  collapsed,
  active,
  badge,
  small,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active: boolean;
  badge?: number;
  small?: boolean;
}) {
  const inner = (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md text-text-muted transition-colors hover:bg-surface-hover hover:text-text",
        collapsed ? "mx-auto h-8 w-8 justify-center" : "px-2 py-1.5",
        small ? "text-[12.5px]" : "text-[13px]",
        active && "bg-primary-soft font-medium text-primary",
      )}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && badge != null && (
        <span className="ml-auto flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-medium text-primary-fg">
          {badge}
        </span>
      )}
      {collapsed && badge != null && (
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
      )}
    </Link>
  );
  if (collapsed) {
    return (
      <Tooltip content={label} placement="right">
        {inner}
      </Tooltip>
    );
  }
  return inner;
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block rounded-md px-2 py-1.5 text-[13px] text-text hover:bg-surface-hover">
      {children}
    </Link>
  );
}

function UserFooter({ collapsed }: { collapsed: boolean }) {
  const user = useCurrentUser();
  const { theme, toggle } = useTheme();
  if (!user) return null;

  return (
    <Popover
      placement="top-start"
      className="w-60"
      render={({ close }) => <UserMenu onNavigate={close} theme={theme} onToggleTheme={toggle} onSignOut={signOut} />}
    >
      <button
        className={cn(
          "mt-1 flex w-full items-center gap-2 rounded-md py-1.5 text-left transition-colors hover:bg-surface-hover",
          collapsed ? "justify-center px-0" : "px-1.5",
        )}
      >
        <Avatar user={user} size="md" />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium text-text">{user.name}</span>
            </span>
            <ChevronDown size={13} className="text-text-subtle" />
          </>
        )}
      </button>
    </Popover>
  );
}
