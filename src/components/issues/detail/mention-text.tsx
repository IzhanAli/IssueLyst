import type { User } from "@/lib/types";
import { Fragment } from "react";

/** Renders comment text with @Name mentions highlighted. */
export function MentionText({ body, users }: { body: string; users: User[] }) {
  const names = users.map((u) => u.name).sort((a, b) => b.length - a.length);
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`@(${escaped.join("|")})`, "g");
  const parts = body.split(re);

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        const isMention = names.includes(part);
        if (isMention) {
          return (
            <span key={i} className="rounded bg-primary-soft px-0.5 font-medium text-primary">
              @{part}
            </span>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </span>
  );
}
