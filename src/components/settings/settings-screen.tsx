import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { User, Users, Tag, CircleDot, Sun, Moon, Trash2, Plus, RotateCcw, SlidersHorizontal, GripVertical, Lock, Wand2, SquareTerminal, Code2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ClaudeLogo, ClaudeMark } from "@/components/brand/claude-mark";
import { StatusIcon } from "@/components/issues/status-icon";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { useStore } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { useWhiteboards } from "@/lib/store/whiteboards";
import { useHydrated, useCurrentUser } from "@/lib/store/hooks";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useTheme } from "@/components/theme/use-theme";
import { toast } from "@/components/ui/toast";
import type { FieldDef, FieldType } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type Tab = "profile" | "team" | "fields" | "labels" | "statuses" | "claude";

export function SettingsScreen() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const workspace = useStore((s) => s.workspace);
  const project = useStore((s) => s.project);
  const isAdmin = usePermissions().isAdmin;
  const [tab, setTab] = useState<Tab>("profile");
  if (!hydrated) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User size={15} strokeWidth={2.4} /> },
    { id: "team", label: "Team", icon: <Users size={15} strokeWidth={2.4} /> },
    { id: "fields", label: "Fields", icon: <SlidersHorizontal size={15} strokeWidth={2.4} /> },
    { id: "labels", label: "Labels", icon: <Tag size={15} strokeWidth={2.4} /> },
    { id: "statuses", label: "Statuses", icon: <CircleDot size={15} strokeWidth={2.4} /> },
    { id: "claude", label: "Claude Code", icon: <ClaudeMark size={15} /> },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[920px] px-8 py-9">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[30px] font-extrabold leading-tight tracking-[-0.03em]">Settings</h1>
            <p className="mt-1 text-[14px] text-text-muted">{workspace.name} workspace · {project.name}</p>
          </div>
          {isAdmin && (
            <button onClick={() => navigate({ to: "/onboarding" })} className="flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] border border-border-strong bg-surface px-3 font-display text-[13px] font-semibold transition-[background-color,transform] duration-150 hover:bg-surface-2 active:scale-[0.97]">
              <Wand2 size={15} strokeWidth={2.25} /> Set up project
            </button>
          )}
        </div>

        <div className="mt-8 flex gap-10">
          <nav className="w-48 shrink-0 space-y-0.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex h-10 w-full items-center gap-3 rounded-[10px] px-2 text-left font-display text-[14.5px] tracking-[-0.01em] transition-colors duration-150",
                  tab === t.id ? "bg-primary-soft font-bold text-text" : "font-medium text-text-muted hover:bg-surface-2 hover:text-text",
                )}
              >
                <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] bg-primary text-primary-fg">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="min-w-0 flex-1">
            {tab === "profile" && <ProfilePanel />}
            {tab === "team" && <TeamPanel />}
            {tab === "fields" && <FieldsPanel />}
            {tab === "labels" && <LabelsPanel />}
            {tab === "statuses" && <StatusesPanel />}
            {tab === "claude" && <ClaudePanel />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadOnlyBanner({ what }: { what: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5 rounded-[10px] bg-surface-2 px-3 py-2.5 text-[12.5px] text-text-muted">
      <Lock size={14} strokeWidth={2.25} className="shrink-0 text-text" />
      Only admins can manage {what}. You have read-only access.
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="mb-2 px-1 font-display text-[13.5px] font-semibold text-text-subtle">{title}</h2>
      <div className="rounded-[14px] bg-surface p-4 shadow-[inset_0_0_0_1px_var(--border)]">{children}</div>
    </section>
  );
}

function ProfilePanel() {
  const me = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const resetSeed = useStore((s) => s.resetSeed);
  const resetWhiteboards = useWhiteboards((s) => s.resetSeed);
  const isAdmin = usePermissions().isAdmin;
  if (!me) return null;
  return (
    <>
      <Card title="Profile">
        <div className="flex items-center gap-3">
          <Avatar user={me} size="xl" />
          <div>
            <div className="font-display text-[17px] font-bold tracking-[-0.02em]">{me.name}</div>
            <div className="text-[13px] text-text-subtle">{me.email}</div>
          </div>
          <span className="ml-auto rounded-[6px] bg-primary px-2 py-0.5 font-display text-[11.5px] font-bold capitalize text-primary-fg">{me.role}</span>
        </div>
      </Card>
      <Card title="Appearance">
        <div className="inline-flex items-center gap-0.5 rounded-[10px] bg-surface-2 p-[3px]">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-[8px] px-3.5 font-display text-[13px] capitalize transition-[background-color,color,box-shadow] duration-150",
                theme === t ? "bg-surface font-bold text-text shadow-[var(--shadow-sm)]" : "font-semibold text-text-muted hover:text-text",
              )}
            >
              {t === "light" ? <Sun size={14} strokeWidth={2.4} /> : <Moon size={14} strokeWidth={2.4} />} {t}
            </button>
          ))}
        </div>
      </Card>
      <Card title="Prototype data">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[13px] text-text-muted">Reset all issues, comments, activity and whiteboards back to the seeded demo data.</p>
          <Button
            size="sm"
            disabled={!isAdmin}
            title={isAdmin ? undefined : "Admins only"}
            onClick={() => { resetSeed(); resetWhiteboards(); toast.success("Demo data reset"); }}
          >
            <RotateCcw size={13} /> Reset
          </Button>
        </div>
      </Card>
    </>
  );
}

function ClaudePanel() {
  const surface = useUI((s) => s.claudeSurface);
  const setSurface = useUI((s) => s.setClaudeSurface);
  const target = useUI((s) => s.claudeTarget);
  const setTarget = useUI((s) => s.setClaudeTarget);

  const surfaces = [
    { id: "desktop" as const, label: "Claude app", hint: "claude://", icon: <ClaudeMark size={14} /> },
    { id: "terminal" as const, label: "Terminal", hint: "claude-cli://", icon: <SquareTerminal size={14} /> },
    { id: "vscode" as const, label: "VS Code tab", hint: "vscode://", icon: <Code2 size={14} /> },
  ];

  return (
    <>
      <Card title="Send to Claude Code">
        <ClaudeLogo height={22} className="mb-3 text-text" />
        <p className="text-[13px] leading-relaxed text-text-muted">
          Every issue header has a <span className="font-bold text-text">Claude Code</span> button that opens a local
          session with the issue and all of its fields pre-filled as the prompt. Claude Code registers the link handler
          the first time you send a prompt in an interactive session — nothing is sent to the model until you press
          Enter in that session.
        </p>

        <div className="mt-5 font-display text-[13px] font-bold text-text">Open in</div>
        <div className="mt-1.5 flex gap-2">
          {surfaces.map((s) => (
            <button
              key={s.id}
              onClick={() => setSurface(s.id)}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-[10px] border px-3 py-2.5 text-left font-display text-[13px] transition-[background-color,border-color,transform] duration-150 active:scale-[0.98]",
                surface === s.id
                  ? "border-accent bg-accent-soft font-bold text-text"
                  : "border-border bg-surface font-semibold text-text-muted hover:bg-surface-2",
              )}
            >
              {s.icon}
              <span className="flex-1">{s.label}</span>
              <span className="text-[11.5px] font-semibold text-text-subtle">{s.hint}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Labeled label="Repository" hint="GitHub owner/name — resolved to a clone you have opened before">
            <input
              value={target.repo}
              onChange={(e) => setTarget({ repo: e.target.value })}
              placeholder="acme/payments"
              className="text-field"
            />
          </Labeled>
          <Labeled label="Working directory" hint="Absolute path. Wins over the repository when both are set.">
            <input
              value={target.cwd}
              onChange={(e) => setTarget({ cwd: e.target.value })}
              placeholder="/Users/you/code/payments"
              className="text-field"
            />
          </Labeled>
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-text-subtle">
          Leave both empty and the session opens in your home directory. The Claude app only uses the working directory
          (it asks for a folder otherwise); a VS Code tab opens in whatever window is focused.
        </p>
      </Card>
    </>
  );
}

function Labeled({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-display text-[13px] font-bold text-text">{label}</span>
      <div className="mt-1.5">{children}</div>
      <span className="mt-1.5 block text-[11.5px] leading-relaxed text-text-subtle">{hint}</span>
    </label>
  );
}

function TeamPanel() {
  const users = useStore((s) => s.users);
  return (
    <Card title={`Members · ${users.length}`}>
      <div className="divide-y divide-border">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <Avatar user={u} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[14px] font-bold tracking-[-0.01em]">{u.name}</div>
              <div className="truncate text-[12.5px] text-text-subtle">{u.email}</div>
            </div>
            <span
              className={cn(
                "rounded-[6px] px-2 py-0.5 font-display text-[11.5px] font-bold capitalize",
                u.role === "admin" ? "bg-primary text-primary-fg" : "bg-surface-2 text-text-muted",
              )}
            >
              {u.role}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

const PALETTE = ["#c02219", "#c6551a", "#a37c13", "#0d774c", "#0f6b5f", "#1f57a6", "#2749c4", "#6a2f9e", "#9a2f6e", "#5b6270"];

function LabelsPanel() {
  const labels = useStore((s) => s.labels);
  const createLabel = useStore((s) => s.createLabel);
  const deleteLabel = useStore((s) => s.deleteLabel);
  const canManage = usePermissions().can("label.manage");
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  const add = () => {
    if (!name.trim()) return;
    createLabel(name.trim(), color);
    setName("");
    toast.success("Label created");
  };

  return (
    <Card title={`Labels · ${labels.length}`}>
      {!canManage && <ReadOnlyBanner what="labels" />}
      <fieldset disabled={!canManage} className="contents">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex items-center gap-1">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn("h-5 w-5 rounded-[6px] transition-transform duration-150 hover:scale-110", color === c && "ring-2 ring-offset-1 ring-offset-surface")}
              style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New label name…"
          className="text-field flex-1"
        />
        <Button size="sm" variant="primary" onClick={add}><Plus size={14} strokeWidth={2.5} /> Add</Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {labels.map((l) => (
          <span key={l.id} className="group flex items-center gap-1.5 rounded-[8px] bg-surface-2 px-2 py-1 font-display text-[12.5px] font-semibold shadow-[inset_0_0_0_1px_var(--border)]">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: l.color }} />
            {l.name}
            <button onClick={() => deleteLabel(l.id)} className="text-text-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100" aria-label="Delete label">
              <Trash2 size={12} strokeWidth={2.25} />
            </button>
          </span>
        ))}
      </div>
      </fieldset>
    </Card>
  );
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "select", label: "Select (dropdown)" },
  { value: "multi_select", label: "Multi-select" },
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "checkbox", label: "Checkbox" },
];

function FieldsPanel() {
  const fields = [...useStore((s) => s.fieldDefs)].sort((a, b) => a.position - b.position);
  const createField = useStore((s) => s.createField);
  const canManage = usePermissions().can("field.manage");
  const [name, setName] = useState("");
  const [type, setType] = useState<FieldType>("select");

  const add = () => {
    if (!name.trim()) return;
    createField(name.trim(), type);
    setName("");
    toast.success("Field created");
  };

  return (
    <Card title={`Custom fields · ${fields.length}`}>
      <p className="mb-4 text-[13px] leading-relaxed text-text-muted">
        Fields, their type, and dropdown values are fully editable. Every field can be shown as a column,
        edited inline on any issue, filtered, and grouped by.
      </p>
      {!canManage && <ReadOnlyBanner what="fields" />}
      <fieldset disabled={!canManage} className="contents">
      <div className="mb-4 flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New field name…"
          className="text-field flex-1"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as FieldType)}
          className="text-field !w-auto font-display text-[13px] font-semibold"
        >
          {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <Button size="sm" variant="primary" onClick={add}><Plus size={14} strokeWidth={2.5} /> Add</Button>
      </div>
      <div className="space-y-2">
        {fields.map((f) => <FieldRow key={f.id} field={f} />)}
      </div>
      </fieldset>
    </Card>
  );
}

function FieldRow({ field }: { field: FieldDef }) {
  const updateField = useStore((s) => s.updateField);
  const deleteField = useStore((s) => s.deleteField);
  const hasOptions = field.type === "select" || field.type === "multi_select";

  return (
    <div className="rounded-[12px] bg-surface-2 p-2.5">
      <div className="flex items-center gap-2">
        <GripVertical size={15} strokeWidth={2.25} className="shrink-0 text-text-subtle" />
        <input
          value={field.name}
          onChange={(e) => updateField(field.id, { name: e.target.value })}
          className="h-7 min-w-0 flex-1 rounded-[7px] bg-transparent px-1.5 font-display text-[14px] font-bold tracking-[-0.01em] hover:bg-surface focus:bg-surface focus:outline-none"
        />
        <span className="shrink-0 rounded-[5px] bg-surface px-1.5 py-0.5 font-display text-[11px] font-semibold capitalize text-text-muted shadow-[inset_0_0_0_1px_var(--border)]">{field.type.replace("_", " ")}</span>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 font-display text-[12px] font-semibold text-text-muted">
          <input type="checkbox" checked={field.showInList} onChange={(e) => updateField(field.id, { showInList: e.target.checked })} className="h-3.5 w-3.5 accent-[var(--primary)]" />
          Column
        </label>
        <button onClick={() => { deleteField(field.id); toast.success("Field deleted"); }} className="shrink-0 rounded-[7px] p-1 text-text-subtle transition-colors hover:bg-danger-soft hover:text-danger" aria-label="Delete field">
          <Trash2 size={14} strokeWidth={2.25} />
        </button>
      </div>
      {hasOptions && <OptionsEditor field={field} />}
    </div>
  );
}

function OptionsEditor({ field }: { field: FieldDef }) {
  const addFieldOption = useStore((s) => s.addFieldOption);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  const add = () => {
    if (!label.trim()) return;
    addFieldOption(field.id, label.trim(), color);
    setLabel("");
  };

  return (
    <div className="mt-2.5 border-t border-border pt-2.5 pl-6">
      <div className="mb-2 space-y-1">
        {field.options.map((o) => <OptionRow key={o.id} fieldId={field.id} option={o} />)}
        {field.options.length === 0 && <div className="text-[12px] text-text-subtle">No options yet — add one below.</div>}
      </div>
      <div className="flex items-center gap-1.5">
        <ColorSwatch color={color} onChange={setColor} />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New option…"
          className="text-field !bg-surface !py-1 flex-1 text-[13px]"
        />
        <Button size="xs" onClick={add}><Plus size={13} strokeWidth={2.5} /> Add option</Button>
      </div>
    </div>
  );
}

function OptionRow({ fieldId, option }: { fieldId: string; option: { id: string; label: string; color: string } }) {
  const updateFieldOption = useStore((s) => s.updateFieldOption);
  const deleteFieldOption = useStore((s) => s.deleteFieldOption);
  return (
    <div className="flex items-center gap-1.5">
      <ColorSwatch color={option.color} onChange={(c) => updateFieldOption(fieldId, option.id, { color: c })} />
      <input
        value={option.label}
        onChange={(e) => updateFieldOption(fieldId, option.id, { label: e.target.value })}
        className="h-7 flex-1 rounded-[7px] bg-transparent px-1.5 text-[13px] hover:bg-surface focus:bg-surface focus:outline-none"
      />
      <button onClick={() => deleteFieldOption(fieldId, option.id)} className="rounded-[7px] p-1 text-text-subtle transition-colors hover:bg-danger-soft hover:text-danger" aria-label="Delete option">
        <Trash2 size={13} strokeWidth={2.25} />
      </button>
    </div>
  );
}

function ColorSwatch({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  return (
    <Popover
      placement="bottom-start"
      className="p-2"
      render={({ close }) => (
        <div className="grid grid-cols-5 gap-1.5">
          {PALETTE.map((c) => (
            <button key={c} onClick={() => { onChange(c); close(); }} className="h-5 w-5 rounded-[6px] transition-transform duration-150 hover:scale-110" style={{ backgroundColor: c }} aria-label={c} />
          ))}
        </div>
      )}
    >
      <button className="h-5 w-5 shrink-0 rounded-[6px] ring-1 ring-inset ring-black/10" style={{ backgroundColor: color }} aria-label="Pick color" />
    </Popover>
  );
}

function StatusesPanel() {
  const statuses = [...useStore((s) => s.statuses)].sort((a, b) => a.position - b.position);
  return (
    <Card title="Workflow statuses">
      <p className="mb-3 text-[13px] text-text-muted">Statuses are data-driven. Custom workflows per project arrive with multi-tenant.</p>
      <div className="divide-y divide-border">
        {statuses.map((s) => (
          <div key={s.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <StatusIcon status={s} size={16} />
            <span className="font-display text-[14px] font-bold tracking-[-0.01em] text-text">{s.name}</span>
            <span className="ml-auto rounded-[5px] bg-surface-2 px-1.5 py-0.5 font-display text-[11.5px] font-semibold capitalize text-text-muted">{s.category}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
