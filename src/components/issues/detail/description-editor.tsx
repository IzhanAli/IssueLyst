"use client";

import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils/cn";

export function DescriptionEditor({
  value,
  onSave,
  readOnly,
}: {
  value: string;
  onSave: (v: string) => void;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setDraft(value), [value]);

  const autosize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (editing) {
      autosize();
      ref.current?.focus();
      ref.current?.setSelectionRange(draft.length, draft.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (readOnly) {
    return (
      <div className="-mx-2.5 px-2.5 py-2 text-[13.5px] text-text">
        {value ? <Markdown text={value} /> : <span className="text-text-subtle">No description</span>}
      </div>
    );
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          autosize();
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { e.preventDefault(); setDraft(value); setEditing(false); }
        }}
        placeholder="Add a description…"
        className="w-full resize-none rounded-md border border-ring bg-surface p-2.5 text-[13.5px] leading-relaxed text-text shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_22%,transparent)] focus:outline-none"
      />
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => { if (e.key === "Enter") setEditing(true); }}
      className={cn(
        "-mx-2.5 cursor-text rounded-md px-2.5 py-2 text-[13.5px] text-text transition-colors hover:bg-surface-2",
        !value && "text-text-subtle",
      )}
    >
      {value ? <Markdown text={value} /> : "Add a description…"}
    </div>
  );
}
