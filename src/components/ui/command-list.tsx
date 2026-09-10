"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface CommandItem {
  id: string;
  label: string;
  keywords?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  hint?: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function CommandList({
  items,
  placeholder = "Search…",
  searchable = true,
  emptyLabel = "No results",
  footer,
  autoFocus = true,
  onQueryEnter,
}: {
  items: CommandItem[];
  placeholder?: string;
  searchable?: boolean;
  emptyLabel?: string;
  footer?: React.ReactNode;
  autoFocus?: boolean;
  /** called with the raw query if Enter is pressed with no active item */
  onQueryEnter?: (q: string) => void;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((i) =>
      `${i.label} ${i.keywords ?? ""}`.toLowerCase().includes(query),
    );
  }, [items, q]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[active];
      if (item && !item.disabled) item.onSelect();
      else if (onQueryEnter && q.trim()) onQueryEnter(q.trim());
    }
  };

  return (
    <div className="flex max-h-[min(60vh,380px)] w-full flex-col" onKeyDown={onKeyDown}>
      {searchable && (
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search size={14} className="shrink-0 text-text-subtle" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-[13px] text-text placeholder:text-text-subtle focus:outline-none"
          />
        </div>
      )}
      <div ref={listRef} className="flex-1 overflow-y-auto p-1">
        {filtered.length === 0 ? (
          <div className="px-2 py-6 text-center text-[12px] text-text-subtle">{emptyLabel}</div>
        ) : (
          filtered.map((item, idx) => (
            <button
              key={item.id}
              data-idx={idx}
              disabled={item.disabled}
              onMouseMove={() => setActive(idx)}
              onClick={() => item.onSelect()}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] text-text disabled:opacity-40",
                idx === active && "bg-surface-hover",
              )}
            >
              {item.icon && <span className="flex h-4 w-4 shrink-0 items-center justify-center">{item.icon}</span>}
              <span className="flex-1 truncate">{item.label}</span>
              {item.hint && <span className="font-mono text-[10.5px] text-text-subtle">{item.hint}</span>}
              {item.right}
            </button>
          ))
        )}
      </div>
      {footer && <div className="border-t border-border p-1">{footer}</div>}
    </div>
  );
}
