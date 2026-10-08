import { Link, useLocation, type LinkProps } from "@tanstack/react-router";
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
  Presentation,
  Plus,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { LogoMark } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/kbd";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { useCurrentUser, useUnreadCount } from "@/lib/store/hooks";
import { useStore } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { useVisibleBoards } from "@/lib/store/whiteboards";
import { useTheme } from "@/components/theme/use-theme";
import { signOut } from "@/lib/auth/session";
import { isMac } from "@/lib/utils/platform";
import { UserMenu } from "./user-menu";
import { DEFAULT_PROJECT_KEY } from "@/lib/constants";

const PROJECT_BASE = `/app/project/${DEFAULT_PROJECT_KEY}`;
const projectParams = { key: DEFAULT_PROJECT_KEY };

/* ══════════════════════════════════════════════════════════════════
   Rail — the black strip on the far left. It carries the brand, the
   one primary action and identity. While the panel is collapsed it also
   takes over navigation, so every destination stays one click away.
   ══════════════════════════════════════════════════════════════════ */

export function Rail() {
  const pathname = useLocation({ select: (l) => l.pathname });
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const toggleSidebar = useUI((s) => s.toggleSidebar);
  const openCreate = useUI((s) => s.openCreate);
  const setCommandOpen = useUI((s) => s.setCommandOpen);
  const unread = useUnreadCount();
  const { theme, toggle } = useTheme();

  return (
    <nav className="flex h-full w-[64px] shrink-0 flex-col bg-rail items-center gap-1.5 py-3.5" aria-label="App">
      <Link to="/app/home" className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-[12px] transition-transform hover:scale-105" aria-label="Home">
        <LogoMark size={30} />
      </Link>

      <Tooltip content="New issue" shortcut="C" placement="right">
        <button
          onClick={() => openCreate()}
          className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-rail-fg text-rail transition-transform duration-150 hover:scale-105 active:scale-95"
          aria-label="New issue"
        >
          <Plus size={20} strokeWidth={2.6} />
        </button>
      </Tooltip>

      {collapsed && (
        <>
          <RailButton label="Search" shortcut="⌘K" onClick={() => setCommandOpen(true)} icon={<Search size={19} strokeWidth={2.1} />} />
          <div className="my-1.5 h-px w-7 bg-rail-hover" />
          <RailLink to="/app/home" label="Home" active={pathname === "/app/home"} icon={<Home size={19} strokeWidth={2.1} />} />
          <RailLink to="/app/inbox" label="Inbox" active={pathname.startsWith("/app/inbox")} icon={<Inbox size={19} strokeWidth={2.1} />} badge={unread} />
          <RailLink to="/app/my-issues" label="My Issues" active={pathname.startsWith("/app/my-issues")} icon={<UserRound size={19} strokeWidth={2.1} />} />
          <RailLink to="/app/whiteboards" label="Whiteboards" active={pathname.startsWith("/app/whiteboards")} icon={<Presentation size={19} strokeWidth={2.1} />} />
          <RailLink to="/app/project/$key/list" params={projectParams} label="Engineering" active={pathname.startsWith(PROJECT_BASE)} icon={<Box size={19} strokeWidth={2.1} />} />
        </>
      )}

      <div className="flex-1" />

      <RailButton
        label={theme === "dark" ? "Light mode" : "Dark mode"}
        onClick={toggle}
        icon={theme === "dark" ? <Sun size={19} strokeWidth={2.1} /> : <Moon size={19} strokeWidth={2.1} />}
      />
      <RailLink to="/app/settings" label="Settings" active={pathname.startsWith("/app/settings")} icon={<Settings size={19} strokeWidth={2.1} />} />
      <RailButton
        label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        shortcut="["
        onClick={toggleSidebar}
        icon={collapsed ? <PanelLeft size={19} strokeWidth={2.1} /> : <PanelLeftClose size={19} strokeWidth={2.1} />}
      />
      <RailUser />
    </nav>
  );
}

const railItem =
  "relative flex h-10 w-10 items-center justify-center rounded-[12px] text-rail-muted transition-colors duration-150 hover:bg-rail-hover hover:text-rail-fg";

function RailButton({ label, shortcut, icon, onClick }: { label: string; shortcut?: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <Tooltip content={label} shortcut={shortcut} placement="right">
      <button onClick={onClick} className={railItem} aria-label={label}>
        {icon}
      </button>
    </Tooltip>
  );
}

function RailLink({
  label,
  icon,
  active,
  badge,
  ...link
}: { label: string; icon: React.ReactNode; active: boolean; badge?: number } & LinkProps) {
  return (
    <Tooltip content={label} placement="right">
      <Link {...link} className={cn(railItem, active && "bg-rail-active text-rail-fg")} aria-label={label}>
        {icon}
        {!!badge && (
          <span className="anim-pop absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-signal px-1 font-display text-[10.5px] font-bold text-signal-fg ring-2 ring-rail">
            {badge}
          </span>
        )}
      </Link>
    </Tooltip>
  );
}

function RailUser() {
  const user = useCurrentUser();
  const { theme, toggle } = useTheme();
  if (!user) return null;

  return (
    <Popover
      placement="right-end"
      className="w-64"
      render={({ close }) => <UserMenu onNavigate={close} theme={theme} onToggleTheme={toggle} onSignOut={signOut} />}
    >
      <button
        className="mt-1.5 flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105"
        aria-label={`Account: ${user.name}`}
      >
        <Avatar user={user} size="lg" className="ring-2 ring-rail-active" />
      </button>
    </Popover>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Panel — the grey sidebar. Big, heavy navigation rows: the current
   destination is set in bold ink on a grey plate, the rest recede to
   medium grey. Magenta is reserved for the unread count.
   ══════════════════════════════════════════════════════════════════ */

export function Sidebar() {
  const pathname = useLocation({ select: (l) => l.pathname });
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const favorites = useUI((s) => s.favorites);
  const unread = useUnreadCount();
  const project = useStore((s) => s.project);
  const openIssues = useStore((s) =>
    s.issues.filter((i) => {
      const st = s.statuses.find((x) => x.id === i.statusId);
      return st && st.category !== "completed" && st.category !== "canceled";
    }).length,
  );

  const isFav = favorites.includes(project.id);
  const boards = useVisibleBoards();
  const favBoards = boards.filter((b) => favorites.includes(b.id));

  return (
    <aside
      className={cn(
        "h-full shrink-0 overflow-hidden border-r border-border bg-surface-2 transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-0 border-r-0" : "w-[256px]",
      )}
      aria-hidden={collapsed || undefined}
      inert={collapsed || undefined}
    >
      {/* Fixed inner width, so rows don't reflow while the panel animates */}
      <div className="flex h-full w-[256px] flex-col">
        <WorkspaceHeader />
        <SearchField />

        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
          <NavItem to="/app/home" icon={Home} label="Home" active={pathname === "/app/home"} />
          <NavItem to="/app/inbox" icon={Inbox} label="Inbox" active={pathname.startsWith("/app/inbox")} badge={unread || undefined} />
          <NavItem to="/app/my-issues" icon={UserRound} label="My Issues" active={pathname.startsWith("/app/my-issues")} />
          <NavItem to="/app/whiteboards" icon={Presentation} label="Whiteboards" active={pathname.startsWith("/app/whiteboards")} count={boards.length} />

          <div className="mx-2 my-3.5 h-px bg-border-strong/70" />

          {(isFav || favBoards.length > 0) && (
            <Section label="Favorites">
              {isFav && (
                <NavItem
                  to="/app/project/$key/list"
                  params={projectParams}
                  icon={Star}
                  iconClassName="fill-warning text-warning"
                  label={project.name}
                  active={false}
                  small
                />
              )}
              {favBoards.map((b) => (
                <NavItem
                  key={b.id}
                  to="/app/whiteboards"
                  search={{ board: b.id }}
                  icon={Star}
                  iconClassName="fill-warning text-warning"
                  label={b.name}
                  active={false}
                  small
                />
              ))}
            </Section>
          )}

          <Section label="Project">
            <ProjectTree pathname={pathname} openIssues={openIssues} />
          </Section>
        </nav>
      </div>
    </aside>
  );
}

function WorkspaceHeader() {
  const workspace = useStore((s) => s.workspace);
  return (
    <div className="flex h-[60px] shrink-0 items-center px-3">
      <Popover
        placement="bottom-start"
        className="w-60"
        render={() => (
          <div className="p-1.5">
            <div className="flex items-center gap-2.5 rounded-[10px] px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-primary font-display text-[14px] font-extrabold text-primary-fg">
                {workspace.name[0]}
              </div>
              <div className="min-w-0">
                <div className="truncate font-display text-[14px] font-bold">{workspace.name}</div>
                <div className="truncate text-[12px] text-text-subtle">Free · 1 project</div>
              </div>
              <Check size={16} strokeWidth={2.5} className="ml-auto text-accent" />
            </div>
            <div className="mx-2 my-1 h-px bg-border" />
            <MenuLink to="/app/settings">Workspace settings</MenuLink>
            <div className="px-2.5 py-1.5 text-[12px] leading-snug text-text-subtle">Adding workspaces arrives with multi-tenant.</div>
          </div>
        )}
      >
        <button className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[10px] px-1.5 py-1.5 text-left transition-colors hover:bg-surface-hover">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-primary font-display text-[13px] font-extrabold text-primary-fg">
            {workspace.name[0]}
          </div>
          <span className="truncate font-display text-[17px] font-extrabold tracking-[-0.025em]">{workspace.name}</span>
          <ChevronDown size={15} strokeWidth={2.4} className="ml-auto shrink-0 text-text-subtle" />
        </button>
      </Popover>
    </div>
  );
}

function SearchField() {
  const setCommandOpen = useUI((s) => s.setCommandOpen);
  const mod = isMac() ? "⌘" : "Ctrl";
  return (
    <div className="shrink-0 px-3 pb-1">
      <button
        onClick={() => setCommandOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-[10px] bg-surface px-2.5 text-left text-text-subtle shadow-[inset_0_0_0_1px_var(--border)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--border-strong)]"
        aria-label="Search issues, people, labels…"
      >
        <Search size={15} strokeWidth={2.3} />
        <span className="flex-1 truncate text-[13.5px]">Search</span>
        <span className="flex items-center gap-0.5">
          <Kbd>{mod}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
    </div>
  );
}

function ProjectTree({ pathname, openIssues }: { pathname: string; openIssues: number }) {
  const [open, setOpen] = useState(true);
  const project = useStore((s) => s.project);
  const active = pathname.startsWith(PROJECT_BASE);

  return (
    <div>
      <div className="group flex h-10 items-center gap-1 rounded-[10px] pl-1 pr-3 transition-colors hover:bg-surface-hover/70">
        <button onClick={() => setOpen((v) => !v)} className="rounded-[6px] p-1 text-text-subtle hover:text-text" aria-label="Toggle project">
          <ChevronDown size={14} strokeWidth={2.5} className={cn("transition-transform duration-200", !open && "-rotate-90")} />
        </button>
        <Link to="/app/project/$key/list" params={projectParams} className="flex min-w-0 flex-1 items-center gap-2.5">
          <Box size={18} strokeWidth={active ? 2.4 : 2} className={active ? "text-text" : "text-text-muted"} />
          <span className={cn("truncate font-display text-[15px] tracking-[-0.01em]", active ? "font-bold text-text" : "font-medium text-text-muted")}>
            {project.name}
          </span>
        </Link>
        <span className="font-display text-[12.5px] font-semibold text-text-subtle">{openIssues}</span>
      </div>
      {open && (
        <div className="ml-[21px] mt-0.5 space-y-0.5 border-l-2 border-border-strong/60 pl-2.5">
          <SubLink to="/app/project/$key/list" params={projectParams} icon={<ListIcon size={15} strokeWidth={2.2} />} label="List" active={pathname.startsWith(`${PROJECT_BASE}/list`)} />
          <SubLink to="/app/project/$key/board" params={projectParams} icon={<Columns3 size={15} strokeWidth={2.2} />} label="Board" active={pathname.startsWith(`${PROJECT_BASE}/board`)} />
        </div>
      )}
    </div>
  );
}

function SubLink({
  icon,
  label,
  active,
  ...link
}: { icon: React.ReactNode; label: string; active: boolean } & LinkProps) {
  return (
    <Link
      {...link}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-[8px] px-2.5 font-display text-[14px] font-medium text-text-muted transition-colors hover:bg-surface-hover/70 hover:text-text",
        active && "bg-primary-soft font-bold text-text",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="mb-1 px-3 font-display text-[13.5px] font-semibold text-text-subtle">{label}</div>
      {children}
    </div>
  );
}

function NavItem({
  icon: Icon,
  iconClassName,
  label,
  active,
  badge,
  count,
  small,
  ...link
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  iconClassName?: string;
  label: string;
  active: boolean;
  /** an attention count — the only magenta in the panel */
  badge?: number;
  /** a quiet total */
  count?: number;
  small?: boolean;
} & LinkProps) {
  return (
    <Link
      {...link}
      className={cn(
        "group relative flex items-center gap-3 rounded-[10px] px-3 font-display tracking-[-0.012em] transition-colors duration-150",
        small ? "h-9 text-[14px]" : "h-10 text-[15.5px]",
        active ? "bg-primary-soft font-bold text-text" : "font-medium text-text-muted hover:bg-surface-hover/70 hover:text-text",
      )}
    >
      <Icon size={small ? 16 : 19} strokeWidth={active ? 2.5 : 2} className={cn("shrink-0", iconClassName)} />
      <span className="truncate">{label}</span>
      {badge != null && (
        <span className="anim-pop ml-auto flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-signal px-1.5 text-[12px] font-bold text-signal-fg">
          {badge}
        </span>
      )}
      {count != null && badge == null && (
        <span className="ml-auto text-[12.5px] font-semibold text-text-subtle">{count}</span>
      )}
    </Link>
  );
}

function MenuLink({ children, ...link }: { children: React.ReactNode } & LinkProps) {
  return (
    <Link {...link} className="block rounded-[8px] px-2.5 py-1.5 font-display text-[13.5px] font-medium text-text hover:bg-surface-2">
      {children}
    </Link>
  );
}
