import { Check, Plus } from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { CommandList, type CommandItem } from "@/components/ui/command-list";
import { StatusIcon } from "./status-icon";
import { PriorityIcon } from "./priority-icon";
import { Avatar, AvatarEmpty } from "@/components/ui/avatar";
import { LabelDot } from "./badges";
import { useStore } from "@/lib/store/store";
import { PRIORITIES, PRIORITY_META } from "@/lib/constants";
import type { Priority } from "@/lib/types";

const CheckMark = ({ on }: { on: boolean }) =>
  on ? <Check size={14} className="text-primary" /> : <span className="w-3.5" />;

/* ── Status ──────────────────────────────────────────────────────── */
export function StatusPicker({
  value,
  onChange,
  children,
  placement,
  disabled,
}: {
  value: string;
  onChange: (statusId: string) => void;
  children: React.ReactElement;
  placement?: "bottom-start" | "right-start" | "bottom-end";
  disabled?: boolean;
}) {
  const statuses = useStore((s) => s.statuses);
  if (disabled) return children;
  return (
    <Popover
      placement={placement ?? "bottom-start"}
      className="w-60"
      render={({ close }) => (
        <CommandList
          placeholder="Change status…"
          items={statuses.map<CommandItem>((st) => ({
            id: st.id,
            label: st.name,
            keywords: st.category,
            icon: <StatusIcon status={st} />,
            right: <CheckMark on={st.id === value} />,
            onSelect: () => {
              onChange(st.id);
              close();
            },
          }))}
        />
      )}
    >
      {children}
    </Popover>
  );
}

/* ── Priority ────────────────────────────────────────────────────── */
export function PriorityPicker({
  value,
  onChange,
  children,
  placement,
  disabled,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
  children: React.ReactElement;
  placement?: "bottom-start" | "right-start" | "bottom-end";
  disabled?: boolean;
}) {
  if (disabled) return children;
  return (
    <Popover
      placement={placement ?? "bottom-start"}
      className="w-56"
      render={({ close }) => (
        <CommandList
          placeholder="Set priority…"
          items={PRIORITIES.map<CommandItem>((p) => ({
            id: p,
            label: PRIORITY_META[p].label,
            hint: PRIORITY_META[p].short,
            icon: <PriorityIcon priority={p} />,
            right: <CheckMark on={p === value} />,
            onSelect: () => {
              onChange(p);
              close();
            },
          }))}
        />
      )}
    >
      {children}
    </Popover>
  );
}

/* ── Assignee ────────────────────────────────────────────────────── */
export function AssigneePicker({
  value,
  onChange,
  children,
  placement,
  disabled,
}: {
  value: string | null;
  onChange: (userId: string | null) => void;
  children: React.ReactElement;
  placement?: "bottom-start" | "right-start" | "bottom-end";
  disabled?: boolean;
}) {
  const users = useStore((s) => s.users);
  if (disabled) return children;
  const items: CommandItem[] = [
    {
      id: "unassigned",
      label: "Unassigned",
      icon: <AvatarEmpty size="sm" />,
      right: <CheckMark on={value === null} />,
      onSelect: () => onChange(null),
    },
    ...users.map<CommandItem>((u) => ({
      id: u.id,
      label: u.name,
      keywords: u.email,
      icon: <Avatar user={u} size="sm" />,
      right: <CheckMark on={u.id === value} />,
      onSelect: () => onChange(u.id),
    })),
  ];
  return (
    <Popover
      placement={placement ?? "bottom-start"}
      className="w-64"
      render={({ close }) => (
        <CommandList
          placeholder="Assign to…"
          items={items.map((it) => ({ ...it, onSelect: () => { it.onSelect(); close(); } }))}
        />
      )}
    >
      {children}
    </Popover>
  );
}

/* ── Labels (multi-select) ───────────────────────────────────────── */
export function LabelPicker({
  value,
  onToggle,
  children,
  placement,
  disabled,
}: {
  value: string[];
  onToggle: (labelId: string) => void;
  children: React.ReactElement;
  placement?: "bottom-start" | "right-start" | "bottom-end";
  disabled?: boolean;
}) {
  const labels = useStore((s) => s.labels);
  const createLabel = useStore((s) => s.createLabel);
  if (disabled) return children;
  const palette = ["#c02219", "#c6551a", "#a37c13", "#0d774c", "#0f6b5f", "#1f57a6", "#2749c4", "#6a2f9e", "#9a2f6e"];

  return (
    <Popover
      placement={placement ?? "bottom-start"}
      className="w-64"
      render={() => (
        <CommandList
          placeholder="Add label…"
          items={labels.map<CommandItem>((l) => ({
            id: l.id,
            label: l.name,
            icon: <LabelDot color={l.color} />,
            right: <CheckMark on={value.includes(l.id)} />,
            onSelect: () => onToggle(l.id),
          }))}
          onQueryEnter={(q) => {
            const color = palette[Math.floor(Math.random() * palette.length)];
            const label = createLabel(q, color);
            onToggle(label.id);
          }}
          footer={
            <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-text-subtle">
              <Plus size={12} /> Type a new name and press Enter to create
            </div>
          }
        />
      )}
    >
      {children}
    </Popover>
  );
}
