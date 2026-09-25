import { useNavigate } from "@tanstack/react-router";
import { CheckCheck, AtSign, UserPlus, CircleDot, MessageSquare, Inbox as InboxIcon } from "lucide-react";
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
  assigned: <UserPlus size={11} strokeWidth={2.5} />,
  mentioned: <AtSign size={11} strokeWidth={2.5} />,
  status_changed: <CircleDot size={11} strokeWidth={2.5} />,
  commented: <MessageSquare size={11} strokeWidth={2.5} />,
  followed_changed: <CircleDot size={11} strokeWidth={2.5} />,
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
      <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-border bg-surface px-6">
        <h1 className="font-display text-[22px] font-extrabold tracking-[-0.025em]">Inbox</h1>
        {unread.length > 0 && (
          <span className="anim-pop flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-signal px-1.5 font-display text-[12px] font-bold text-signal-fg">
            {unread.length}
          </span>
        )}
        {unread.length > 0 && (
          <button
            onClick={markAll}
            className="ml-auto flex h-8 items-center gap-1.5 rounded-[10px] border border-border-strong bg-surface px-3 font-display text-[13px] font-semibold text-text transition-[background-color,transform] duration-150 hover:bg-surface-2 active:scale-[0.97]"
          >
            <CheckCheck size={15} strokeWidth={2.25} /> Mark all read
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!hydrated ? null : list.length === 0 ? (
          <EmptyState icon={<InboxIcon size={20} strokeWidth={2.25} />} title="Inbox zero" description="You're all caught up. New mentions, assignments and updates will appear here." />
        ) : (
          <div className="mx-auto max-w-[760px] px-4 py-5">
            {unread.length > 0 && <SectionTitle>Unread</SectionTitle>}
            {unread.map((n) => <Row key={n.id} n={n} store={store} onOpen={() => openNotification(n)} />)}
            {earlier.length > 0 && <SectionTitle className="mt-6">Earlier</SectionTitle>}
            {earlier.map((n) => <Row key={n.id} n={n} store={store} onOpen={() => openNotification(n)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-1.5 px-3 font-display text-[13.5px] font-semibold text-text-subtle", className)}>{children}</div>;
}

function Row({ n, store, onOpen }: { n: Notification; store: EntityState; onOpen: () => void }) {
  const actor = store.users.find((u) => u.id === n.actorId);
  const issue = store.issues.find((i) => i.id === n.issueId);
  if (!actor || !issue) return null;
  const unread = !n.readAt;

  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3.5 rounded-[12px] px-3 py-3 text-left transition-colors duration-150 hover:bg-surface-2"
    >
      <span className="relative shrink-0">
        <Avatar user={actor} size="xl" />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-primary-fg ring-2 ring-surface">
          {typeIcon[n.type]}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] leading-snug">
          <span className={cn("font-display tracking-[-0.01em]", unread ? "font-bold text-text" : "font-semibold text-text-muted")}>{actor.name}</span>{" "}
          <span className={unread ? "text-text" : "text-text-muted"}>{n.summary}</span>
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] text-text-subtle">
          <span className="font-display font-semibold">{issue.number}</span> · {issue.title}
        </span>
      </span>
      <time className="shrink-0 font-display text-[12px] font-semibold text-text-subtle">{relativeTime(n.createdAt)}</time>
      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", unread ? "bg-signal" : "bg-transparent")} aria-hidden />
    </button>
  );
}
