"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleDot, Timer, UserRound, AlertTriangle } from "lucide-react";
import { StatusIcon } from "@/components/issues/status-icon";
import { PriorityIcon } from "@/components/issues/priority-icon";
import { Avatar, AvatarEmpty } from "@/components/ui/avatar";
import { useStore } from "@/lib/store/store";
import { useHydrated, useCurrentUser } from "@/lib/store/hooks";
import { allIssueViews } from "@/lib/store/selectors";
import { relativeTime, isOverdue } from "@/lib/utils/format";
import type { IssueView } from "@/lib/types";

export function HomeScreen() {
  const hydrated = useHydrated();
  const store = useStore();
  const me = useCurrentUser();
  const router = useRouter();

  if (!hydrated || !me) return null;

  const views = allIssueViews(store);
  const mine = views.filter((v) => v.assigneeId === me.id);
  const open = views.filter((v) => v.status.category !== "completed" && v.status.category !== "canceled");
  const inProgress = views.filter((v) => v.status.category === "started");
  const overdue = views.filter((v) => isOverdue(v.dueDate, v.closedAt));

  const recent = [...views].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const openIssue = (v: IssueView) => router.push(`/app/project/engineering/list?issue=${v.issueKey}`);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[860px] px-6 py-8">
        <div className="flex items-center gap-3">
          <Avatar user={me} size="xl" />
          <div>
            <h1 className="font-serif text-[22px] font-semibold tracking-[-0.01em]">
              {greeting}, {me.name.split(" ")[0]}
            </h1>
            <p className="text-[13px] text-text-muted">Here’s what needs your attention in {store.project.name}.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<UserRound size={15} />} label="Assigned to you" value={mine.length} href="/app/my-issues" />
          <Stat icon={<CircleDot size={15} />} label="Open" value={open.length} href="/app/project/engineering/list" />
          <Stat icon={<Timer size={15} />} label="In progress" value={inProgress.length} href="/app/project/engineering/board" />
          <Stat icon={<AlertTriangle size={15} />} label="Overdue" value={overdue.length} tone={overdue.length ? "danger" : undefined} />
        </div>

        <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel title="Assigned to you" href="/app/my-issues">
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

function Stat({ icon, label, value, href, tone }: { icon: React.ReactNode; label: string; value: number; href?: string; tone?: "danger" }) {
  const body = (
    <div className="rounded-xl border border-border bg-surface p-3.5 transition-colors hover:border-border-strong">
      <div className="flex items-center gap-1.5 text-text-subtle">
        <span className={tone === "danger" ? "text-danger" : "text-text-muted"}>{icon}</span>
        <span className="text-[11.5px] font-medium">{label}</span>
      </div>
      <div className={`mt-1.5 font-serif text-[26px] font-semibold tracking-[-0.02em] ${tone === "danger" && value > 0 ? "text-danger" : "text-text"}`}>
        {value}
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function Panel({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
        <h2 className="text-[13px] font-semibold text-text">{title}</h2>
        {href && (
          <Link href={href} className="flex items-center gap-0.5 text-[12px] text-text-muted hover:text-text">
            View all <ArrowRight size={12} />
          </Link>
        )}
      </div>
      <div className="p-1">{children}</div>
    </div>
  );
}

function IssueLine({ v, onOpen, showTime }: { v: IssueView; onOpen: () => void; showTime?: boolean }) {
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-hover">
      <PriorityIcon priority={v.priority} size={14} />
      <StatusIcon status={v.status} size={14} />
      <span className="font-mono text-[10.5px] text-text-subtle">{v.issueKey}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-text">{v.title}</span>
      {showTime && <time className="shrink-0 font-mono text-[10px] text-text-subtle">{relativeTime(v.updatedAt)}</time>}
      {v.assignee ? <Avatar user={v.assignee} size="sm" /> : <AvatarEmpty size="sm" />}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-6 text-center text-[12.5px] text-text-subtle">{children}</div>;
}
