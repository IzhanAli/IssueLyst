import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, AtSign, UserPlus, CircleDot, MessageSquare, Inbox as InboxIcon } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { useStore } from "@/lib/store/store";
import { useHydrated, useCurrentUser } from "@/lib/store/hooks";
import { relativeTime } from "@/lib/utils/format";
import type { Notification, NotificationType } from "@/lib/types";
import type { EntityState } from "@/lib/store/store";
import { cn } from "@/lib/utils/cn";
import { DEFAULT_PROJECT_KEY } from "@/lib/constants";

const typeIcon: Record<NotificationType, React.ReactNode> = {
  assigned: <UserPlus size={12} />,
  mentioned: <AtSign size={12} />,
  status_changed: <CircleDot size={12} />,
  commented: <MessageSquare size={12} />,
  followed_changed: <CircleDot size={12} />,
};

export function InboxScreen() {
  const hydrated = useHydrated();
  const store = useStore();
  const me = useCurrentUser();
  const navigate = useNavigate();
  const markRead = useStore((s) => s.markNotificationRead);
  const markAll = useStore((s) => s.markAllNotificationsRead);

  const list = hydrated && me
    ? [...store.notifications].filter((n) => n.userId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];
  const unread = list.filter((n) => !n.readAt);
  const earlier = list.filter((n) => n.readAt);

  const openNotification = (n: Notification) => {
    markRead(n.id);
    const issue = store.issues.find((i) => i.id === n.issueId);
    if (issue) {
      navigate({
        to: "/app/project/$key/list",
        params: { key: DEFAULT_PROJECT_KEY },
        search: { issue: String(issue.number) },
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[46px] shrink-0 items-center gap-2.5 border-b border-border bg-surface px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-soft text-primary">
          <Bell size={15} />
        </div>
        <h1 className="font-serif text-[16px] font-semibold tracking-[-0.01em]">Inbox</h1>
        {unread.length > 0 && <span className="rounded-full bg-danger px-1.5 font-mono text-[10px] font-medium text-white">{unread.length}</span>}
        {unread.length > 0 && (
          <button onClick={markAll} className="ml-auto flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-text-muted hover:bg-surface-hover hover:text-text">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!hydrated ? null : list.length === 0 ? (
          <EmptyState icon={<InboxIcon size={20} />} title="Inbox zero" description="You're all caught up. New mentions, assignments and updates will appear here." />
        ) : (
          <div className="mx-auto max-w-[720px] px-3 py-3">
            {unread.length > 0 && <SectionTitle>Unread</SectionTitle>}
            {unread.map((n) => <Row key={n.id} n={n} store={store} onOpen={() => openNotification(n)} />)}
            {earlier.length > 0 && <SectionTitle className="mt-4">Earlier</SectionTitle>}
            {earlier.map((n) => <Row key={n.id} n={n} store={store} onOpen={() => openNotification(n)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-1 px-2 text-[10.5px] font-semibold uppercase tracking-wide text-text-subtle", className)}>{children}</div>;
}

function Row({ n, store, onOpen }: { n: Notification; store: EntityState; onOpen: () => void }) {
  const actor = store.users.find((u) => u.id === n.actorId);
  const issue = store.issues.find((i) => i.id === n.issueId);
  if (!actor || !issue) return null;
  const unread = !n.readAt;

  return (
    <button
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-surface-hover",
        unread && "bg-primary-soft/30",
      )}
    >
      <span className="relative shrink-0">
        <Avatar user={actor} size="lg" />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface text-text-muted ring-2 ring-surface">
          {typeIcon[n.type]}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] text-text">
          <span className="font-medium">{actor.name}</span> <span className="text-text-muted">{n.summary}</span>
        </span>
        <span className="block truncate text-[12px] text-text-subtle">
          <span className="font-mono text-[10.5px]">{issue.number}</span> · {issue.title}
        </span>
      </span>
      <time className="shrink-0 font-mono text-[10.5px] text-text-subtle">{relativeTime(n.createdAt)}</time>
      {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
    </button>
  );
}
