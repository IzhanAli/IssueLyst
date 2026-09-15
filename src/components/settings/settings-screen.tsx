import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { User, Users, Tag, CircleDot, Sun, Moon, Trash2, Plus, RotateCcw, SlidersHorizontal, GripVertical, Lock, Wand2, SquareTerminal, Code2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
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
    { id: "profile", label: "Profile", icon: <User size={15} /> },
    { id: "team", label: "Team", icon: <Users size={15} /> },
    { id: "fields", label: "Fields", icon: <SlidersHorizontal size={15} /> },
    { id: "labels", label: "Labels", icon: <Tag size={15} /> },
    { id: "statuses", label: "Statuses", icon: <CircleDot size={15} /> },
    { id: "claude", label: "Claude Code", icon: <SquareTerminal size={15} /> },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[860px] px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[22px] font-semibold tracking-[-0.01em]">Settings</h1>
            <p className="mt-1 text-[13px] text-text-muted">{workspace.name} workspace · {project.name}</p>
          </div>
          {isAdmin && (
            <button onClick={() => navigate({ to: "/onboarding" })} className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[12.5px] font-medium transition-colors hover:bg-surface-hover">
              <Wand2 size={14} /> Set up project
            </button>
          )}
        </div>

        <div className="mt-6 flex gap-8">
          <nav className="w-40 shrink-0 space-y-0.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
                  tab === t.id ? "bg-surface-active font-medium text-text" : "text-text-muted hover:bg-surface-hover hover:text-text",
                )}
              >
                {t.icon} {t.label}
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
    <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-[12px] text-text-muted">
      <Lock size={13} className="text-text-subtle" />
      Only admins can manage {what}. You have read-only access.
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-2.5 text-[13px] font-semibold">{title}</div>
      <div className="p-4">{children}</div>
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
            <div className="text-[14px] font-medium">{me.name}</div>
            <div className="font-mono text-[11.5px] text-text-subtle">{me.email}</div>
          </div>
          <span className="ml-auto rounded-md border border-border px-2 py-0.5 text-[11px] font-medium uppercase text-text-muted">{me.role}</span>
        </div>
      </Card>
      <Card title="Appearance">
        <div className="flex items-center gap-2">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md border px-3 text-[12.5px] capitalize transition-colors",
                theme === t ? "border-primary bg-primary-soft text-primary" : "border-border text-text-muted hover:bg-surface-hover",
              )}
            >
              {t === "light" ? <Sun size={14} /> : <Moon size={14} />} {t}
            </button>
          ))}
        </div>
      </Card>
      <Card title="Prototype data">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[12.5px] text-text-muted">Reset all issues, comments, activity and whiteboards back to the seeded demo data.</p>
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
    { id: "terminal" as const, label: "Terminal", hint: "claude-cli://", icon: <SquareTerminal size={14} /> },
    { id: "vscode" as const, label: "VS Code tab", hint: "vscode://", icon: <Code2 size={14} /> },
  ];

  return (
    <>
      <Card title="Send to Claude Code">
        <p className="text-[12.5px] leading-relaxed text-text-muted">
          Every issue header has a <span className="font-medium text-text">Claude Code</span> button that opens a local
          session with the issue and all of its fields pre-filled as the prompt. Claude Code registers the link handler
          the first time you send a prompt in an interactive session — nothing is sent to the model until you press
          Enter in that session.
        </p>

        <div className="mt-4 text-[12px] font-medium text-text">Open in</div>
        <div className="mt-1.5 flex gap-2">
          {surfaces.map((s) => (
            <button
              key={s.id}
              onClick={() => setSurface(s.id)}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left text-[12.5px] transition-colors",
                surface === s.id
                  ? "border-primary bg-primary-soft text-text"
                  : "border-border bg-surface text-text-muted hover:bg-surface-hover",
              )}
            >
              {s.icon}
              <span className="flex-1 font-medium">{s.label}</span>
              <span className="font-mono text-[10.5px] text-text-subtle">{s.hint}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Labeled label="Repository" hint="GitHub owner/name — resolved to a clone you have opened before">
            <input
              value={target.repo}
              onChange={(e) => setTarget({ repo: e.target.value })}
              placeholder="acme/payments"
              className="h-8 w-full rounded-md border border-border bg-surface px-2.5 font-mono text-[12px] focus:border-ring focus:outline-none"
            />
          </Labeled>
          <Labeled label="Working directory" hint="Absolute path. Wins over the repository when both are set.">
            <input
              value={target.cwd}
              onChange={(e) => setTarget({ cwd: e.target.value })}
              placeholder="/Users/you/code/payments"
              className="h-8 w-full rounded-md border border-border bg-surface px-2.5 font-mono text-[12px] focus:border-ring focus:outline-none"
            />
          </Labeled>
        </div>

        <p className="mt-3 text-[11.5px] text-text-subtle">
          Leave both empty and the session opens in your home directory. Only the terminal handler uses these; a VS Code
          tab opens in whatever window is focused.
        </p>
      </Card>
    </>
  );
}

function Labeled({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-text">{label}</span>
      <div className="mt-1">{children}</div>
      <span className="mt-1 block text-[11px] leading-relaxed text-text-subtle">{hint}</span>
    </label>
  );
}

function TeamPanel() {
  const users = useStore((s) => s.users);
  return (
    <Card title={`Members · ${users.length}`}>
      <div className="divide-y divide-border">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <Avatar user={u} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{u.name}</div>
              <div className="truncate font-mono text-[11px] text-text-subtle">{u.email}</div>
            </div>
            <span className="rounded-md border border-border px-2 py-0.5 text-[10.5px] font-medium uppercase text-text-muted">{u.role}</span>
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
              className={cn("h-5 w-5 rounded-full transition-transform", color === c && "ring-2 ring-offset-1 ring-offset-surface")}
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
        <Button size="sm" variant="primary" onClick={add}><Plus size={14} /> Add</Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {labels.map((l) => (
          <span key={l.id} className="group flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[12px]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            {l.name}
            <button onClick={() => deleteLabel(l.id)} className="text-text-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100" aria-label="Delete label">
              <Trash2 size={11} />
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
      <p className="mb-3 text-[12.5px] leading-relaxed text-text-muted">
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
          className="text-field !w-auto text-[12.5px]"
        >
          {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <Button size="sm" variant="primary" onClick={add}><Plus size={14} /> Add</Button>
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
    <div className="rounded-lg border border-border bg-surface p-2.5">
      <div className="flex items-center gap-2">
        <GripVertical size={14} className="shrink-0 text-text-subtle" />
        <input
          value={field.name}
          onChange={(e) => updateField(field.id, { name: e.target.value })}
          className="h-7 min-w-0 flex-1 rounded-md bg-transparent px-1.5 text-[13px] font-medium hover:bg-surface-2 focus:bg-surface-2 focus:outline-none"
        />
        <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] capitalize text-text-subtle">{field.type.replace("_", " ")}</span>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[11.5px] text-text-muted">
          <input type="checkbox" checked={field.showInList} onChange={(e) => updateField(field.id, { showInList: e.target.checked })} className="h-3.5 w-3.5 accent-[var(--primary)]" />
          Column
        </label>
        <button onClick={() => { deleteField(field.id); toast.success("Field deleted"); }} className="shrink-0 rounded p-1 text-text-subtle hover:bg-danger-soft hover:text-danger" aria-label="Delete field">
          <Trash2 size={13} />
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
    <div className="mt-2 border-t border-border pt-2 pl-6">
      <div className="mb-2 space-y-1">
        {field.options.map((o) => <OptionRow key={o.id} fieldId={field.id} option={o} />)}
        {field.options.length === 0 && <div className="text-[11.5px] text-text-subtle">No options yet — add one below.</div>}
      </div>
      <div className="flex items-center gap-1.5">
        <ColorSwatch color={color} onChange={setColor} />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New option…"
          className="text-field !py-1 flex-1 text-[12.5px]"
        />
        <Button size="xs" onClick={add}><Plus size={13} /> Add option</Button>
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
        className="h-7 flex-1 rounded-md bg-transparent px-1.5 text-[12.5px] hover:bg-surface-2 focus:bg-surface-2 focus:outline-none"
      />
      <button onClick={() => deleteFieldOption(fieldId, option.id)} className="rounded p-1 text-text-subtle hover:bg-danger-soft hover:text-danger" aria-label="Delete option">
        <Trash2 size={12} />
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
            <button key={c} onClick={() => { onChange(c); close(); }} className="h-5 w-5 rounded-full" style={{ backgroundColor: c }} aria-label={c} />
          ))}
        </div>
      )}
    >
      <button className="h-5 w-5 shrink-0 rounded-full ring-1 ring-inset ring-black/10" style={{ backgroundColor: color }} aria-label="Pick color" />
    </Popover>
  );
}

function StatusesPanel() {
  const statuses = [...useStore((s) => s.statuses)].sort((a, b) => a.position - b.position);
  return (
    <Card title="Workflow statuses">
      <p className="mb-3 text-[12px] text-text-muted">Statuses are data-driven. Custom workflows per project arrive with multi-tenant.</p>
      <div className="divide-y divide-border">
        {statuses.map((s) => (
          <div key={s.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
            <span className="font-mono text-[10.5px] text-text-subtle">{s.position + 1}</span>
            <StatusIcon status={s} />
            <span className="text-[13px] font-medium" style={{ color: s.color }}>{s.name}</span>
            <span className="ml-auto rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] capitalize text-text-subtle">{s.category}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
