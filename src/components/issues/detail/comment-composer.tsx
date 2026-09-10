"use client";

import { useMemo, useRef, useState } from "react";
import { SendHorizontal, AtSign } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/kbd";
import { useStore } from "@/lib/store/store";
import { useCurrentUser } from "@/lib/store/hooks";
import { cn } from "@/lib/utils/cn";

export function CommentComposer({ onSubmit }: { onSubmit: (body: string) => void }) {
  const users = useStore((s) => s.users);
  const me = useCurrentUser();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);

  const matches = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 5);
  }, [mention, users]);

  const detectMention = (text: string, caret: number) => {
    const before = text.slice(0, caret);
    const m = before.match(/(^|\s)@([\p{L}]*)$/u);
    if (m) setMention({ query: m[2], start: caret - m[2].length - 1 });
    else setMention(null);
    setActive(0);
  };

  const insertMention = (name: string) => {
    if (!mention) return;
    const el = ref.current!;
    const caret = el.selectionStart;
    const next = value.slice(0, mention.start) + `@${name} ` + value.slice(caret);
    setValue(next);
    setMention(null);
    requestAnimationFrame(() => {
      const pos = mention.start + name.length + 2;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const send = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
    setMention(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention && matches.length) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, matches.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(matches[active].name); return; }
      if (e.key === "Escape") { e.preventDefault(); setMention(null); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="relative flex items-start gap-2.5">
      <Avatar user={me} size="md" className="mt-1" />
      <div className="relative flex-1">
        {mention && matches.length > 0 && (
          <div className="absolute bottom-full left-0 z-20 mb-1 w-60 overflow-hidden rounded-lg border border-border-strong bg-surface p-1 shadow-[var(--shadow-lg)]">
            {matches.map((u, i) => (
              <button
                key={u.id}
                onMouseDown={(e) => { e.preventDefault(); insertMention(u.name); }}
                onMouseMove={() => setActive(i)}
                className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left", i === active && "bg-surface-hover")}
              >
                <Avatar user={u} size="sm" />
                <span className="truncate text-[13px]">{u.name}</span>
              </button>
            ))}
          </div>
        )}
        <div className="field-fill">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => { setValue(e.target.value); detectMention(e.target.value, e.target.selectionStart); }}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={focused || value ? 3 : 1}
            placeholder="Add a comment…  Use @ to mention"
            className="w-full resize-none bg-transparent px-3 py-2 text-[13.5px] leading-relaxed text-text placeholder:text-text-subtle focus:outline-none"
          />
          {(focused || value) && (
            <div className="flex items-center justify-between border-t border-border px-2 py-1.5">
              <span className="flex items-center gap-1 text-[11px] text-text-subtle"><AtSign size={12} /> mention · <Kbd>↵</Kbd> send</span>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={send}
                disabled={!value.trim()}
                className="flex h-6.5 items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-[12px] font-medium text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-40"
              >
                Comment <SendHorizontal size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
