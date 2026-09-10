import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { nanoid } from "nanoid";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Box,
  ListChecks,
  SlidersHorizontal,
  Tag,
  Rocket,
  Lock,
} from "lucide-react";
import { useStore } from "@/lib/store/store";
import { usePermissions } from "@/lib/auth/use-permissions";
import { Popover } from "@/components/ui/popover";
import { LogoMark } from "@/components/brand/logo";
import { StatusIcon } from "@/components/issues/status-icon";
import { OptionPill } from "@/components/fields/field-controls";
import { toast } from "@/components/ui/toast";
import type { FieldDef, FieldType, Label, Status } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { DEFAULT_PROJECT_KEY } from "@/lib/constants";

const PALETTE = ["#c02219", "#c6551a", "#a37c13", "#0d774c", "#0f6b5f", "#1f57a6", "#2749c4", "#6a2f9e", "#9a2f6e", "#5b6270"];
const STATUS_ICONS: Status["icon"][] = ["backlog", "open", "progress", "review", "done", "closed"];
const CATEGORIES: Status["category"][] = ["backlog", "unstarted", "started", "completed", "canceled"];
const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "select", label: "Select" },
  { value: "multi_select", label: "Multi-select" },
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "checkbox", label: "Checkbox" },
];

const STEPS = [
  { id: "project", title: "Project", icon: <Box size={16} />, blurb: "Name your project and give it an identity." },
  { id: "statuses", title: "Workflow", icon: <ListChecks size={16} />, blurb: "Define the statuses issues move through." },
  { id: "fields", title: "Fields", icon: <SlidersHorizontal size={16} />, blurb: "Add custom fields and their dropdown values." },
  { id: "labels", title: "Labels", icon: <Tag size={16} />, blurb: "Create labels for quick classification." },
  { id: "review", title: "Review", icon: <Rocket size={16} />, blurb: "Confirm and launch your project." },
] as const;

export function OnboardingWizard() {
  const navigate = useNavigate();
  const perms = usePermissions();
  const setProject = useStore((s) => s.setProject);
  const replaceStatuses = useStore((s) => s.replaceStatuses);
  const replaceFields = useStore((s) => s.replaceFields);
  const replaceLabels = useStore((s) => s.replaceLabels);

  const initial = useMemo(() => {
    const s = useStore.getState();
    return {
      project: { name: s.project.name, description: s.project.description, icon: s.project.icon, key: s.project.key },
      statuses: s.statuses.map((x) => ({ ...x })),
      fields: s.fieldDefs.map((f) => ({ ...f, options: f.options.map((o) => ({ ...o })) })),
      labels: s.labels.map((l) => ({ ...l })),
    };
  }, []);

  const [step, setStep] = useState(0);
  const [project, setProjectDraft] = useState(initial.project);
  const [statuses, setStatuses] = useState<Status[]>(initial.statuses);
  const [fields, setFields] = useState<FieldDef[]>(initial.fields);
  const [labels, setLabels] = useState<Label[]>(initial.labels);

  const finish = () => {
    setProject(project);
    replaceStatuses(statuses);
    replaceFields(fields);
    replaceLabels(labels);
    toast.success(`${project.name} is ready`);
    navigate({
      to: "/app/project/$key/list",
      params: { key: DEFAULT_PROJECT_KEY },
      search: {},
    });
  };

  if (!perms.isAdmin) {
    return (
      <div className="flex h-full items-center justify-center bg-bg">
        <div className="max-w-sm rounded-xl border border-border bg-surface p-6 text-center">
          <Lock size={20} className="mx-auto mb-2 text-text-subtle" />
          <h2 className="font-serif text-[16px] font-semibold">Admins only</h2>
          <p className="mt-1 text-[13px] text-text-muted">Project setup is limited to workspace admins. Switch to an admin account to continue.</p>
          <button onClick={() => navigate({ to: "/app" })} className="mt-4 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-fg hover:bg-primary-hover">Back to app</button>
        </div>
      </div>
    );
  }

  const canNext =
    (step === 0 && project.name.trim().length > 0) ||
    (step === 1 && statuses.length > 0) ||
    step >= 2;

  return (
    <div className="flex h-full bg-bg">
      {/* Stepper rail */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-border bg-surface-2 p-6 lg:flex">
        <div className="mb-8 flex items-center gap-2.5">
          <LogoMark size={24} />
          <span className="font-serif text-[17px] font-semibold tracking-[-0.01em]">Project setup</span>
        </div>
        <ol className="space-y-1">
          {STEPS.map((s, i) => {
            const state = i === step ? "current" : i < step ? "done" : "todo";
            return (
              <li key={s.id}>
                <button
                  onClick={() => i <= step && setStep(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                    state === "current" && "bg-surface text-text shadow-[var(--shadow-sm)]",
                    state !== "current" && "text-text-muted hover:bg-surface-hover",
                    i > step && "cursor-default opacity-60 hover:bg-transparent",
                  )}
                >
                  <span className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]",
                    state === "done" ? "bg-success text-white" : state === "current" ? "bg-primary text-primary-fg" : "border border-border-strong text-text-subtle",
                  )}>
                    {state === "done" ? <Check size={13} /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium">{s.title}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-auto text-[11px] text-text-subtle">You can change all of this later in Settings.</div>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[640px] px-6 py-10">
            <div className="mb-1 flex items-center gap-2 text-[12px] font-medium text-primary">
              {STEPS[step].icon} Step {step + 1} of {STEPS.length}
            </div>
            <h1 className="font-serif text-[24px] font-semibold tracking-[-0.015em]">{STEPS[step].title}</h1>
            <p className="mt-1 text-[13.5px] text-text-muted">{STEPS[step].blurb}</p>

            <div className="mt-6">
              {step === 0 && <ProjectStep project={project} onChange={setProjectDraft} />}
              {step === 1 && <StatusesStep statuses={statuses} onChange={setStatuses} />}
              {step === 2 && <FieldsStep fields={fields} onChange={setFields} />}
              {step === 3 && <LabelsStep labels={labels} onChange={setLabels} />}
              {step === 4 && <ReviewStep project={project} statuses={statuses} fields={fields} labels={labels} />}
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-surface px-6 py-3">
          <button
            onClick={() => (step === 0 ? navigate({ to: "/app" }) : setStep((s) => s - 1))}
            className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] text-text-muted hover:bg-surface-hover hover:text-text"
          >
            <ChevronLeft size={15} /> {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => canNext && setStep((s) => s + 1)}
              disabled={!canNext}
              className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={finish} className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-fg hover:bg-primary-hover">
              <Rocket size={15} /> Launch project
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Step 1: Project ─────────────────────────────────────────────── */
function ProjectStep({ project, onChange }: { project: { name: string; description: string; icon: string; key: string }; onChange: (p: typeof project) => void }) {
  const set = (patch: Partial<typeof project>) => onChange({ ...project, ...patch });
  const EMOJI = ["📦", "🚀", "🐛", "🛠️", "⚙️", "🎯", "🔧", "📊", "💡", "🧪", "🔬", "🗂️"];
  return (
    <div className="space-y-4">
      <Field label="Project name">
        <input autoFocus value={project.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Engineering" className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Key prefix" hint="Shown on exports & integrations">
          <input value={project.key} onChange={(e) => set({ key: e.target.value.toUpperCase().slice(0, 5) })} placeholder="ENG" className={cn(inputCls, "font-mono uppercase")} />
        </Field>
        <Field label="Icon">
          <Popover
            placement="bottom-start"
            className="p-2"
            render={({ close }) => (
              <div className="grid grid-cols-6 gap-1">
                {EMOJI.map((e) => (
                  <button key={e} onClick={() => { set({ icon: e }); close(); }} className="flex h-8 w-8 items-center justify-center rounded-md text-[18px] hover:bg-surface-hover">{e}</button>
                ))}
              </div>
            )}
          >
            <button className={cn(inputCls, "flex items-center gap-2 text-left")}>
              <span className="text-[18px]">{/\p{Emoji}/u.test(project.icon) ? project.icon : "📦"}</span>
              <span className="text-text-subtle">Choose</span>
            </button>
          </Popover>
        </Field>
      </div>
      <Field label="Description" hint="Optional">
        <textarea value={project.description} onChange={(e) => set({ description: e.target.value })} rows={3} placeholder="What does this project track?" className={cn(inputCls, "h-auto resize-none py-2")} />
      </Field>
    </div>
  );
}

/* ── Step 2: Statuses ────────────────────────────────────────────── */
function StatusesStep({ statuses, onChange }: { statuses: Status[]; onChange: (s: Status[]) => void }) {
  const update = (id: string, patch: Partial<Status>) => onChange(statuses.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id: string) => onChange(statuses.filter((s) => s.id !== id));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= statuses.length) return;
    const next = [...statuses];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => onChange([...statuses, { id: `st_${nanoid(6)}`, projectId: "prj_eng", name: "New status", color: PALETTE[5], icon: "open", category: "unstarted", position: statuses.length }]);

  return (
    <div className="space-y-2">
      {statuses.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2">
          <div className="flex flex-col">
            <button onClick={() => move(i, -1)} disabled={i === 0} className="text-text-subtle hover:text-text disabled:opacity-30"><ArrowUp size={12} /></button>
            <button onClick={() => move(i, 1)} disabled={i === statuses.length - 1} className="text-text-subtle hover:text-text disabled:opacity-30"><ArrowDown size={12} /></button>
          </div>
          <IconSwatch status={s} onPick={(icon, color) => update(s.id, { icon, color })} />
          <input value={s.name} onChange={(e) => update(s.id, { name: e.target.value })} className="h-8 min-w-0 flex-1 rounded-md bg-transparent px-1.5 text-[13px] font-medium hover:bg-surface-2 focus:bg-surface-2 focus:outline-none" />
          <select value={s.category} onChange={(e) => update(s.id, { category: e.target.value as Status["category"] })} className="text-field !w-auto !py-1 text-[11.5px] capitalize">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => remove(s.id)} className="rounded p-1 text-text-subtle hover:bg-danger-soft hover:text-danger"><Trash2 size={13} /></button>
        </div>
      ))}
      <button onClick={add} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-strong py-2 text-[12.5px] text-text-muted hover:border-text-subtle hover:text-text">
        <Plus size={14} /> Add status
      </button>
    </div>
  );
}

function IconSwatch({ status, onPick }: { status: Status; onPick: (icon: Status["icon"], color: string) => void }) {
  return (
    <Popover
      placement="bottom-start"
      className="w-52 p-2"
      render={() => (
        <div className="space-y-2">
          <div className="flex gap-1">
            {STATUS_ICONS.map((ic) => (
              <button key={ic} onClick={() => onPick(ic, status.color)} className={cn("flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-hover", status.icon === ic && "bg-surface-hover")}>
                <StatusIcon status={{ ...status, icon: ic }} />
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {PALETTE.map((c) => <button key={c} onClick={() => onPick(status.icon, c)} className="h-5 w-5 rounded-full" style={{ backgroundColor: c }} />)}
          </div>
        </div>
      )}
    >
      <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-surface-hover"><StatusIcon status={status} size={16} /></button>
    </Popover>
  );
}

/* ── Step 3: Fields ──────────────────────────────────────────────── */
function FieldsStep({ fields, onChange }: { fields: FieldDef[]; onChange: (f: FieldDef[]) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<FieldType>("select");
  const update = (id: string, patch: Partial<FieldDef>) => onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const remove = (id: string) => onChange(fields.filter((f) => f.id !== id));
  const add = () => {
    if (!name.trim()) return;
    onChange([...fields, { id: `fd_${nanoid(6)}`, projectId: "prj_eng", name: name.trim(), type, options: [], position: fields.length, showInList: true }]);
    setName("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="New field name…" className={cn(inputCls, "flex-1")} />
        <select value={type} onChange={(e) => setType(e.target.value as FieldType)} className="text-field !w-auto text-[12.5px]">
          {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button onClick={add} className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[13px] font-medium text-primary-fg hover:bg-primary-hover"><Plus size={14} /> Add</button>
      </div>

      <div className="space-y-2">
        {fields.map((f) => (
          <div key={f.id} className="rounded-lg border border-border bg-surface p-2.5">
            <div className="flex items-center gap-2">
              <input value={f.name} onChange={(e) => update(f.id, { name: e.target.value })} className="h-7 min-w-0 flex-1 rounded-md bg-transparent px-1.5 text-[13px] font-medium hover:bg-surface-2 focus:bg-surface-2 focus:outline-none" />
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] capitalize text-text-subtle">{f.type.replace("_", " ")}</span>
              <label className="flex items-center gap-1 text-[11px] text-text-muted">
                <input type="checkbox" checked={f.showInList} onChange={(e) => update(f.id, { showInList: e.target.checked })} className="h-3.5 w-3.5 accent-[var(--primary)]" /> Column
              </label>
              <button onClick={() => remove(f.id)} className="rounded p-1 text-text-subtle hover:bg-danger-soft hover:text-danger"><Trash2 size={13} /></button>
            </div>
            {(f.type === "select" || f.type === "multi_select") && (
              <WizardOptions field={f} onChange={(options) => update(f.id, { options })} />
            )}
          </div>
        ))}
        {fields.length === 0 && <div className="rounded-lg border border-dashed border-border py-6 text-center text-[12.5px] text-text-subtle">No custom fields yet.</div>}
      </div>
    </div>
  );
}

function WizardOptions({ field, onChange }: { field: FieldDef; onChange: (o: FieldDef["options"]) => void }) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const add = () => {
    if (!label.trim()) return;
    onChange([...field.options, { id: `fo_${nanoid(6)}`, label: label.trim(), color }]);
    setLabel("");
  };
  return (
    <div className="mt-2 border-t border-border pt-2">
      {field.options.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {field.options.map((o) => (
            <span key={o.id} className="group inline-flex items-center gap-1">
              <OptionPill option={o} />
              <button onClick={() => onChange(field.options.filter((x) => x.id !== o.id))} className="text-text-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"><Trash2 size={10} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <Popover placement="bottom-start" className="p-2" render={({ close }) => (
          <div className="grid grid-cols-5 gap-1.5">
            {PALETTE.map((c) => <button key={c} onClick={() => { setColor(c); close(); }} className="h-5 w-5 rounded-full" style={{ backgroundColor: c }} />)}
          </div>
        )}>
          <button className="h-5 w-5 shrink-0 rounded-full ring-1 ring-inset ring-black/10" style={{ backgroundColor: color }} />
        </Popover>
        <input value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add option (emojis welcome 🎉)…" className="text-field !py-1 flex-1 text-[12px]" />
        <button onClick={add} className="rounded-md border border-border px-2 py-1 text-[12px] hover:bg-surface-hover">Add</button>
      </div>
    </div>
  );
}

/* ── Step 4: Labels ──────────────────────────────────────────────── */
function LabelsStep({ labels, onChange }: { labels: Label[]; onChange: (l: Label[]) => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const add = () => {
    if (!name.trim()) return;
    onChange([...labels, { id: `lb_${nanoid(6)}`, projectId: "prj_eng", name: name.trim(), color }]);
    setName("");
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1">
          {PALETTE.map((c) => <button key={c} onClick={() => setColor(c)} className={cn("h-5 w-5 rounded-full", color === c && "ring-2 ring-offset-1 ring-offset-surface")} style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }} />)}
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="New label…" className={cn(inputCls, "flex-1")} />
        <button onClick={add} className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[13px] font-medium text-primary-fg hover:bg-primary-hover"><Plus size={14} /> Add</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {labels.map((l) => (
          <span key={l.id} className="group flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[12px]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            {l.name}
            <button onClick={() => onChange(labels.filter((x) => x.id !== l.id))} className="text-text-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"><Trash2 size={11} /></button>
          </span>
        ))}
        {labels.length === 0 && <span className="text-[12.5px] text-text-subtle">No labels yet.</span>}
      </div>
    </div>
  );
}

/* ── Step 5: Review ──────────────────────────────────────────────── */
function ReviewStep({ project, statuses, fields, labels }: { project: { name: string; icon: string; description: string }; statuses: Status[]; fields: FieldDef[]; labels: Label[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-[22px]">{/\p{Emoji}/u.test(project.icon) ? project.icon : "📦"}</span>
        <div>
          <div className="font-serif text-[17px] font-semibold">{project.name || "Untitled project"}</div>
          {project.description && <div className="text-[12.5px] text-text-muted">{project.description}</div>}
        </div>
      </div>
      <ReviewRow title={`${statuses.length} statuses`}>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((s) => <span key={s.id} className="inline-flex items-center gap-1 text-[12px]" style={{ color: s.color }}><StatusIcon status={s} size={13} />{s.name}</span>)}
        </div>
      </ReviewRow>
      <ReviewRow title={`${fields.length} custom fields`}>
        <div className="flex flex-wrap gap-1.5">
          {fields.map((f) => <span key={f.id} className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11.5px]">{f.name} <span className="text-text-subtle">· {f.options.length ? `${f.options.length} opts` : f.type}</span></span>)}
        </div>
      </ReviewRow>
      <ReviewRow title={`${labels.length} labels`}>
        <div className="flex flex-wrap gap-1.5">
          {labels.map((l) => <span key={l.id} className="inline-flex items-center gap-1 text-[11.5px]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />{l.name}</span>)}
        </div>
      </ReviewRow>
    </div>
  );
}

function ReviewRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-text-subtle">{title}</div>
      {children}
    </div>
  );
}

/* ── shared ──────────────────────────────────────────────────────── */
const inputCls = "text-field";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-2 text-[12px] font-medium text-text-muted">
        {label} {hint && <span className="font-normal text-text-subtle">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}
