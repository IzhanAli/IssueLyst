import { Link, useNavigate, type LinkProps } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, CircleDot, Timer, UserRound, AlertTriangle } from "lucide-react";
import { StatusIcon } from "@/components/issues/status-icon";
import { PriorityIcon } from "@/components/issues/priority-icon";
import { Avatar, AvatarEmpty } from "@/components/ui/avatar";
import { useStore } from "@/lib/store/store";
import { useHydrated, useCurrentUser } from "@/lib/store/hooks";
import { allIssueViews } from "@/lib/store/selectors";
import { relativeTime, isOverdue } from "@/lib/utils/format";
import type { IssueView } from "@/lib/types";
import { DEFAULT_PROJECT_KEY } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export function HomeScreen() {
  const hydrated = useHydrated();
  const store = useStore();
  const me = useCurrentUser();
  const navigate = useNavigate();

  if (!hydrated || !me) return null;

  const views = allIssueViews(store);
  const mine = views.filter((v) => v.assigneeId === me.id);
  const open = views.filter((v) => v.status.category !== "completed" && v.status.category !== "canceled");
  const inProgress = views.filter((v) => v.status.category === "started");
  const overdue = views.filter((v) => isOverdue(v.dueDate, v.closedAt));

  const recent = [...views].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const openIssue = (v: IssueView) =>
    navigate({
      to: "/app/project/$key/list",
      params: { key: DEFAULT_PROJECT_KEY },
      search: { issue: v.issueKey },
    });

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[940px] px-8 py-10">
        <div className="flex items-center gap-4">
          <Avatar user={me} size="xl" className="h-14 w-14 text-[19px]" />
          <div>
            <h1 className="font-display text-[30px] font-extrabold leading-tight tracking-[-0.03em]">
              {greeting}, {me.name.split(" ")[0]}
            </h1>
            <p className="mt-0.5 text-[14.5px] text-text-muted">Here’s what needs your attention in {store.project.name}.</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<UserRound size={15} strokeWidth={2.4} />} label="Assigned to you" value={mine.length} link={{ to: "/app/my-issues" }} />
          <Stat icon={<CircleDot size={15} strokeWidth={2.4} />} label="Open" value={open.length} link={{ to: "/app/project/$key/list", params: { key: DEFAULT_PROJECT_KEY } }} />
          <Stat icon={<Timer size={15} strokeWidth={2.4} />} label="In progress" value={inProgress.length} link={{ to: "/app/project/$key/board", params: { key: DEFAULT_PROJECT_KEY } }} />
          <Stat icon={<AlertTriangle size={15} strokeWidth={2.4} />} label="Overdue" value={overdue.length} tone={overdue.length ? "danger" : undefined} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel title="Assigned to you" link={{ to: "/app/my-issues" }}>
            {mine.length === 0 ? (
              <Empty>Nothing assigned right now.</Empty>
            ) : (
              mine.slice(0, 6).map((v) => <IssueLine key={v.id} v={v} onOpen={() => openIssue(v)} />)
            )}
          </Panel>
          <Panel title="Recently updated">
            {recent.map((v) => <IssueLine key={v.id} v={v} onOpen={() => openIssue(v)} showTime />)}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, link, tone }: { icon: React.ReactNode; label: string; value: number; link?: LinkProps; tone?: "danger" }) {
  const alert = tone === "danger" && value > 0;
  const body = (
    <div
      className={cn(
        "group rounded-[16px] bg-surface-2 p-4 transition-[background-color,transform] duration-150",
        link && "hover:bg-surface-hover active:scale-[0.98]",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[8px]",
            alert ? "bg-signal text-signal-fg" : "bg-primary text-primary-fg",
          )}
        >
          {icon}
        </span>
        <span className="font-display text-[13px] font-semibold text-text-muted">{label}</span>
        {link && <ArrowUpRight size={15} strokeWidth={2.4} className="ml-auto text-text-subtle opacity-0 transition-opacity group-hover:opacity-100" />}
      </div>
      <div className={cn("mt-3 font-display text-[40px] font-extrabold leading-none tracking-[-0.04em]", alert ? "text-signal" : "text-text")}>
        {value}
      </div>
    </div>
  );
  return link ? <Link {...link} className="block rounded-[16px]">{body}</Link> : body;
}

function Panel({ title, link, children }: { title: string; link?: LinkProps; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] bg-surface shadow-[inset_0_0_0_1px_var(--border)]">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="font-display text-[17px] font-extrabold tracking-[-0.02em] text-text">{title}</h2>
        {link && (
          <Link {...link} className="flex items-center gap-0.5 font-display text-[13px] font-semibold text-accent hover:text-accent-hover">
            View all <ArrowRight size={13} strokeWidth={2.5} />
          </Link>
        )}
      </div>
      <div className="px-1.5 pb-1.5">{children}</div>
    </div>
  );
}

function IssueLine({ v, onOpen, showTime }: { v: IssueView; onOpen: () => void; showTime?: boolean }) {
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors duration-150 hover:bg-surface-2">
      <PriorityIcon priority={v.priority} size={14} />
      <StatusIcon status={v.status} size={14} />
      <span className="min-w-[28px] shrink-0 font-display text-[12px] font-semibold text-text-subtle">{v.issueKey}</span>
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-text">{v.title}</span>
      {showTime && <time className="shrink-0 font-display text-[12px] font-semibold text-text-subtle">{relativeTime(v.updatedAt)}</time>}
      {v.assignee ? <Avatar user={v.assignee} size="sm" /> : <AvatarEmpty size="sm" />}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-8 text-center font-display text-[13.5px] font-semibold text-text-subtle">{children}</div>;
}
