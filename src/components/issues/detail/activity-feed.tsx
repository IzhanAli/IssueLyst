"use client";

import { useMemo, useState } from "react";
import { GitCommitHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { MentionText } from "./mention-text";
import { StatusIcon } from "../status-icon";
import { PriorityIcon } from "../priority-icon";
import { LabelDot } from "../badges";
import { useStore } from "@/lib/store/store";
import { useCurrentUser } from "@/lib/store/hooks";
import { relativeTime, fullDateTime } from "@/lib/utils/format";
import { PRIORITY_META } from "@/lib/constants";
import type { Activity, Comment, Priority } from "@/lib/types";
import type { EntityState } from "@/lib/store/store";
import { cn } from "@/lib/utils/cn";

type FeedItem =
  | { kind: "comment"; at: string; comment: Comment }
  | { kind: "activity"; at: string; activity: Activity };

export function ActivityFeed({ issueId }: { issueId: string }) {
  const store = useStore();
  const comments = store.comments.filter((c) => c.issueId === issueId);
  const activities = store.activities.filter((a) => a.issueId === issueId && a.event !== "comment_added");

  const items = useMemo<FeedItem[]>(() => {
    const merged: FeedItem[] = [
      ...comments.map((c) => ({ kind: "comment" as const, at: c.createdAt, comment: c })),
      ...activities.map((a) => ({ kind: "activity" as const, at: a.createdAt, activity: a })),
    ];
    merged.sort((a, b) => a.at.localeCompare(b.at));
    return merged;
  }, [comments, activities]);

  if (items.length === 0) {
    return <div className="py-6 text-center text-[12.5px] text-text-subtle">No activity yet.</div>;
  }

  return (
    <div className="relative space-y-0.5">
      {items.map((item, i) =>
        item.kind === "comment" ? (
          <CommentCard key={item.comment.id} comment={item.comment} />
        ) : (
          <ActivityRow key={item.activity.id} activity={item.activity} last={i === items.length - 1} />
        ),
      )}
    </div>
  );
}

function actor(store: EntityState, id: string) {
  return store.users.find((u) => u.id === id);
}

function describe(activity: Activity, store: EntityState): { icon: React.ReactNode; text: React.ReactNode } {
  const m = activity.meta;
  const statusName = (id: unknown) => store.statuses.find((s) => s.id === id);
  const labelOf = (id: unknown) => store.labels.find((l) => l.id === id);
  const userName = (id: unknown) => store.users.find((u) => u.id === id)?.name;

  switch (activity.event) {
    case "created":
      return { icon: <GitCommitHorizontal size={13} />, text: <>created this issue</> };
    case "status_changed": {
      const to = statusName(m.toId);
      return {
        icon: to ? <StatusIcon status={to} size={13} /> : <GitCommitHorizontal size={13} />,
        text: <>changed status to <b className="font-medium text-text" style={{ color: to?.color }}>{to?.name}</b></>,
      };
    }
    case "priority_changed": {
      const to = m.to as Priority;
      return { icon: <PriorityIcon priority={to} size={13} />, text: <>set priority to <b className="font-medium text-text">{PRIORITY_META[to]?.label}</b></> };
    }
    case "assignee_changed": {
      const name = userName(m.toId);
      return { icon: <GitCommitHorizontal size={13} />, text: name ? <>assigned <b className="font-medium text-text">{name}</b></> : <>unassigned this issue</> };
    }
    case "label_added": {
      const l = labelOf(m.labelId);
      return { icon: l ? <LabelDot color={l.color} /> : <GitCommitHorizontal size={13} />, text: <>added label <b className="font-medium text-text">{l?.name}</b></> };
    }
    case "label_removed": {
      const l = labelOf(m.labelId);
      return { icon: <GitCommitHorizontal size={13} />, text: <>removed label <b className="font-medium text-text">{l?.name}</b></> };
    }
    case "title_changed":
      return { icon: <Pencil size={13} />, text: <>edited the title</> };
    case "description_changed":
      return { icon: <Pencil size={13} />, text: <>updated the description</> };
    case "due_changed":
      return { icon: <GitCommitHorizontal size={13} />, text: m.to ? <>set a due date</> : <>cleared the due date</> };
    case "field_changed": {
      const field = store.fieldDefs.find((f) => f.id === m.fieldId);
      return { icon: <GitCommitHorizontal size={13} />, text: <>updated <b className="font-medium text-text">{field?.name ?? "a field"}</b></> };
    }
    case "attachment_added":
      return { icon: <GitCommitHorizontal size={13} />, text: <>attached <b className="font-medium text-text">{String(m.filename)}</b></> };
    default:
      return { icon: <GitCommitHorizontal size={13} />, text: <>updated this issue</> };
  }
}

function ActivityRow({ activity, last }: { activity: Activity; last: boolean }) {
  const store = useStore();
  const user = actor(store, activity.userId);
  const { icon, text } = describe(activity, store);
  if (!user) return null;
  return (
    <div className="relative flex items-center gap-2.5 py-1.5 pl-1">
      {!last && <span className="absolute left-[15px] top-6 h-[calc(100%-6px)] w-px bg-border" />}
      <span className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text-subtle ring-4 ring-surface">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 items-baseline gap-1.5 text-[12.5px] text-text-muted">
        <span className="font-medium text-text">{user.name}</span>
        <span className="truncate">{text}</span>
        <time className="ml-auto shrink-0 font-mono text-[10.5px] text-text-subtle" title={fullDateTime(activity.createdAt)}>
          {relativeTime(activity.createdAt)}
        </time>
      </div>
    </div>
  );
}

function CommentCard({ comment }: { comment: Comment }) {
  const store = useStore();
  const me = useCurrentUser();
  const user = actor(store, comment.userId);
  const editComment = useStore((s) => s.editComment);
  const deleteComment = useStore((s) => s.deleteComment);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  if (!user) return null;
  const mine = user.id === me?.id;

  return (
    <div className="group relative rounded-lg py-2 pl-1 pr-1">
      <div className="flex gap-2.5">
        <Avatar user={user} size="md" className="mt-0.5 ring-4 ring-surface" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-medium text-text">{user.name}</span>
            <time className="font-mono text-[10.5px] text-text-subtle" title={fullDateTime(comment.createdAt)}>
              {relativeTime(comment.createdAt)}
            </time>
            {comment.updatedAt && <span className="text-[10.5px] text-text-subtle">(edited)</span>}
            {mine && !editing && (
              <span className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => { setDraft(comment.body); setEditing(true); }} className="rounded p-1 text-text-subtle hover:bg-surface-hover hover:text-text" aria-label="Edit">
                  <Pencil size={12} />
                </button>
                <button onClick={() => deleteComment(comment.id)} className="rounded p-1 text-text-subtle hover:bg-danger-soft hover:text-danger" aria-label="Delete">
                  <Trash2 size={12} />
                </button>
              </span>
            )}
          </div>
          {editing ? (
            <div className="mt-1">
              <textarea
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-md border border-ring bg-surface p-2 text-[13px] focus:outline-none"
              />
              <div className="mt-1 flex gap-1.5">
                <button onClick={() => { editComment(comment.id, draft); setEditing(false); }} className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[12px] font-medium text-primary-fg hover:bg-primary-hover">
                  <Check size={12} /> Save
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-text-muted hover:bg-surface-hover">
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={cn("mt-0.5 text-[13.5px] leading-relaxed text-text")}>
              <MentionText body={comment.body} users={store.users} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
