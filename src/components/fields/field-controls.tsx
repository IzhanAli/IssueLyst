import { useState } from "react";
import { Check, Minus, Hash, Calendar } from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { CommandList, type CommandItem } from "@/components/ui/command-list";
import type { FieldDef, FieldOption, FieldValue } from "@/lib/types";
import { shortDate } from "@/lib/utils/format";
import { readableTextOn } from "@/lib/utils/color";
import { cn } from "@/lib/utils/cn";

export function OptionPill({ option, className }: { option: FieldOption; className?: string }) {
  return (
    <span
      className={cn("inline-flex max-w-full items-center truncate rounded-md px-1.5 py-[1px] text-[11px] font-semibold leading-[16px]", className)}
      style={{ color: readableTextOn(option.color), backgroundColor: `color-mix(in srgb, ${option.color} 84%, var(--surface))` }}
    >
      {option.label}
    </span>
  );
}

function optionsOf(field: FieldDef, value: FieldValue): FieldOption[] {
  if (field.type === "select" && typeof value === "string") {
    const o = field.options.find((x) => x.id === value);
    return o ? [o] : [];
  }
  if (field.type === "multi_select" && Array.isArray(value)) {
    return value.map((id) => field.options.find((o) => o.id === id)).filter((o): o is FieldOption => !!o);
  }
  return [];
}

/** Read-only rendering of a field value. */
export function FieldValueDisplay({ field, value, muted }: { field: FieldDef; value: FieldValue; muted?: boolean }) {
  const empty = <span className="text-text-subtle">—</span>;

  if (field.type === "select" || field.type === "multi_select") {
    const opts = optionsOf(field, value);
    if (!opts.length) return empty;
    return (
      <span className="flex flex-wrap items-center gap-1">
        {opts.map((o) => <OptionPill key={o.id} option={o} />)}
      </span>
    );
  }
  if (field.type === "checkbox") {
    return value === true ? (
      <span className="flex h-4 w-4 items-center justify-center rounded border border-success bg-success text-white"><Check size={11} /></span>
    ) : (
      <span className="flex h-4 w-4 items-center justify-center rounded border border-border-strong text-text-subtle"><Minus size={10} /></span>
    );
  }
  if (field.type === "number") {
    return value == null || value === "" ? empty : <span className={cn("font-mono text-[12px]", muted && "text-text-muted")}>{String(value)}</span>;
  }
  if (field.type === "date") {
    return value ? <span className="font-mono text-[11.5px] text-text-muted">{shortDate(String(value))}</span> : empty;
  }
  return value ? <span className="truncate text-[12.5px]">{String(value)}</span> : empty;
}

/** Inline editor: wraps `children` (or a default display) as a trigger. */
export function FieldEditor({
  field,
  value,
  onChange,
  children,
  placement = "bottom-start",
  disabled,
  inline,
}: {
  field: FieldDef;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
  children?: React.ReactElement;
  placement?: "bottom-start" | "bottom-end";
  disabled?: boolean;
  /** edit text/number/date in place (Jira-style) instead of a popover */
  inline?: boolean;
}) {
  if (disabled) {
    return (
      children ?? (
        <span className="flex items-center px-1 py-0.5">
          <FieldValueDisplay field={field} value={value} />
        </span>
      )
    );
  }
  const trigger =
    children ??
    (
      <button className="flex min-w-0 max-w-full items-center rounded px-1 py-0.5 text-left hover:bg-surface-hover" onClick={(e) => e.stopPropagation()}>
        <FieldValueDisplay field={field} value={value} />
      </button>
    );

  // checkbox toggles directly, no popover
  if (field.type === "checkbox") {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onChange(value === true ? false : true); }}
        className="rounded p-0.5 hover:bg-surface-hover"
        aria-label={field.name}
      >
        <FieldValueDisplay field={field} value={value} />
      </button>
    );
  }

  if (field.type === "select" || field.type === "multi_select") {
    const multi = field.type === "multi_select";
    const selected = new Set(Array.isArray(value) ? value : value ? [String(value)] : []);
    const items: CommandItem[] = field.options.map((o) => ({
      id: o.id,
      label: o.label,
      icon: <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: o.color }} />,
      right: selected.has(o.id) ? <Check size={14} className="text-primary" /> : <span className="w-3.5" />,
      onSelect: () => {
        if (multi) {
          const next = new Set(selected);
          if (next.has(o.id)) next.delete(o.id);
          else next.add(o.id);
          onChange([...next]);
        } else {
          onChange(selected.has(o.id) ? null : o.id);
        }
      },
    }));
    return (
      <Popover
        placement={placement}
        className="w-56"
        render={({ close }) => (
          <CommandList
            placeholder={`Set ${field.name}…`}
            items={items.map((it) => ({ ...it, onSelect: () => { it.onSelect(); if (!multi) close(); } }))}
            footer={
              selected.size ? (
                <button onClick={() => { onChange(multi ? [] : null); close(); }} className="w-full rounded-md px-2 py-1 text-left text-[12px] text-text-muted hover:bg-surface-hover">
                  Clear
                </button>
              ) : undefined
            }
          />
        )}
      >
        {trigger}
      </Popover>
    );
  }

  // text / number / date
  if (inline) return <InlineValue field={field} value={value} onCommit={onChange} />;
  return (
    <Popover placement={placement} className="w-56 p-2" render={({ close }) => (
      <ValueInput field={field} value={value} onCommit={(v) => { onChange(v); close(); }} />
    )}>
      {trigger}
    </Popover>
  );
}

/** Jira-style in-place editor: click the value, edit right there, save on blur/Enter. */
function InlineValue({ field, value, onCommit }: { field: FieldDef; value: FieldValue; onCommit: (v: FieldValue) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value == null ? "" : String(value));

  const commit = () => {
    setEditing(false);
    const next = field.type === "number" ? (draft === "" ? null : Number(draft)) : draft === "" ? null : draft;
    if (next !== value) onCommit(next);
  };

  const isEmpty = value == null || value === "";

  if (editing) {
    return (
      <input
        autoFocus
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(value == null ? "" : String(value)); setEditing(false); }
        }}
        placeholder={`Add ${field.name.toLowerCase()}…`}
        className="text-field !py-1"
      />
    );
  }
  return (
    <button
      onClick={() => { setDraft(value == null ? "" : String(value)); setEditing(true); }}
      className={cn(
        "flex w-full items-center gap-1 rounded-md border border-transparent px-2 py-1.5 text-left text-[12.5px] transition-colors hover:border-border hover:bg-surface-hover",
      )}
    >
      {isEmpty ? (
        <span className="text-text-subtle">Add {field.name.toLowerCase()}…</span>
      ) : (
        <FieldValueDisplay field={field} value={value} />
      )}
    </button>
  );
}

function ValueInput({ field, value, onCommit }: { field: FieldDef; value: FieldValue; onCommit: (v: FieldValue) => void }) {
  const [draft, setDraft] = useState(value == null ? "" : String(value));
  const commit = () => {
    if (field.type === "number") onCommit(draft === "" ? null : Number(draft));
    else onCommit(draft === "" ? null : draft);
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex items-center">
        {field.type === "number" && <Hash size={13} className="pointer-events-none absolute left-2.5 text-text-subtle" />}
        {field.type === "date" && <Calendar size={13} className="pointer-events-none absolute left-2.5 text-text-subtle" />}
        <input
          autoFocus
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
          placeholder={`Add ${field.name.toLowerCase()}…`}
          className={cn("text-field", (field.type === "number" || field.type === "date") && "pl-7")}
        />
      </div>
      <div className="flex gap-1.5">
        <button onClick={commit} className="flex-1 rounded-md bg-primary py-1.5 text-[12px] font-medium text-primary-fg transition-colors hover:bg-primary-hover">Save</button>
        {value != null && <button onClick={() => onCommit(null)} className="rounded-md px-2 py-1.5 text-[12px] text-text-muted hover:bg-surface-hover">Clear</button>}
      </div>
    </div>
  );
}
