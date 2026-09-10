import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  Plus,
  Columns3,
  List as ListIcon,
  UserRound,
  Inbox,
  MoonStar,
  Download,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Kbd } from "@/components/ui/kbd";
import { StatusIcon } from "@/components/issues/status-icon";
import { Avatar } from "@/components/ui/avatar";
import { useStore } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { allIssueViews } from "@/lib/store/selectors";
import { issuesToCsv, downloadCsv } from "@/lib/utils/csv";
import { toast } from "@/components/ui/toast";
import { useTheme } from "@/components/theme/use-theme";
import { cn } from "@/lib/utils/cn";
import { DEFAULT_PROJECT_KEY } from "@/lib/constants";

interface Row {
  id: string;
  section: string;
  label: string;
  sub?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export function CommandPalette() {
  const open = useUI((s) => s.commandOpen);
  const setOpen = useUI((s) => s.setCommandOpen);
  const openCreate = useUI((s) => s.openCreate);
  const navigate = useNavigate();
  const { toggle } = useTheme();

  const store = useStore();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const goIssue = (key: string) => {
    navigate({
      to: "/app/project/$key/list",
      params: { key: DEFAULT_PROJECT_KEY },
      search: { issue: key },
    });
    setOpen(false);
  };

  const rows = useMemo<Row[]>(() => {
    const query = q.trim().toLowerCase();
    const views = allIssueViews(store);

    if (!query) {
      const recent = [...views].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
      return [
        { id: "a-new", section: "Actions", label: "Create new issue", icon: <Plus size={15} />, onSelect: () => { setOpen(false); openCreate(); } },
        { id: "a-list", section: "Actions", label: "Go to List", icon: <ListIcon size={15} />, onSelect: () => { navigate({ to: "/app/project/$key/list", params: { key: DEFAULT_PROJECT_KEY }, search: {} }); setOpen(false); } },
        { id: "a-board", section: "Actions", label: "Go to Board", icon: <Columns3 size={15} />, onSelect: () => { navigate({ to: "/app/project/$key/board", params: { key: DEFAULT_PROJECT_KEY }, search: {} }); setOpen(false); } },
        { id: "a-mine", section: "Actions", label: "My Issues", icon: <UserRound size={15} />, onSelect: () => { navigate({ to: "/app/my-issues", search: {} }); setOpen(false); } },
        { id: "a-inbox", section: "Actions", label: "Inbox", icon: <Inbox size={15} />, onSelect: () => { navigate({ to: "/app/inbox", search: {} }); setOpen(false); } },
        { id: "a-theme", section: "Actions", label: "Toggle theme", icon: <MoonStar size={15} />, onSelect: () => toggle() },
        {
          id: "a-csv",
          section: "Actions",
          label: "Export all issues to CSV",
          icon: <Download size={15} />,
          onSelect: () => {
            const all = allIssueViews(store);
            downloadCsv(`issuelyst-issues-${new Date().toISOString().slice(0, 10)}.csv`, issuesToCsv(all, store.users));
            toast.success(`Exported ${all.length} issues to CSV`);
            setOpen(false);
          },
        },
        ...recent.map<Row>((v) => ({
          id: v.id,
          section: "Recent",
          label: v.title,
          sub: v.issueKey,
          icon: <StatusIcon status={v.status} />,
          onSelect: () => goIssue(v.issueKey),
        })),
      ];
    }

    const commentHits = new Set(
      store.comments.filter((c) => c.body.toLowerCase().includes(query)).map((c) => c.issueId),
    );
    const issues = views
      .filter((v) => {
        const hay = `${v.issueKey} ${v.title} ${v.description} ${v.assignee?.name ?? ""} ${v.labels.map((l) => l.name).join(" ")}`.toLowerCase();
        return hay.includes(query) || commentHits.has(v.id);
      })
      .slice(0, 8);

    const people = store.users
      .filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(query))
      .slice(0, 4);

    const labels = store.labels.filter((l) => l.name.toLowerCase().includes(query)).slice(0, 4);

    return [
      ...issues.map<Row>((v) => ({
        id: v.id,
        section: "Issues",
        label: v.title,
        sub: v.issueKey,
        icon: <StatusIcon status={v.status} />,
        onSelect: () => goIssue(v.issueKey),
      })),
      ...people.map<Row>((u) => ({
        id: u.id,
        section: "People",
        label: u.name,
        sub: u.email,
        icon: <Avatar user={u} size="sm" />,
        onSelect: () => { navigate({ to: "/app/project/$key/list", params: { key: DEFAULT_PROJECT_KEY }, search: { assignee: u.id } }); setOpen(false); },
      })),
      ...labels.map<Row>((l) => ({
        id: l.id,
        section: "Labels",
        label: l.name,
        icon: <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />,
        onSelect: () => { navigate({ to: "/app/project/$key/list", params: { key: DEFAULT_PROJECT_KEY }, search: { label: l.id } }); setOpen(false); },
      })),
    ];
  }, [q, store]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, rows.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); rows[active]?.onSelect(); }
  };

  // group into sections preserving order
  let lastSection = "";

  return (
    <Modal open={open} onClose={() => setOpen(false)} align="top" className="max-w-[560px]">
      <div onKeyDown={onKeyDown}>
        <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-3">
          <Search size={16} className="text-text-subtle" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search issues, people, labels — or jump to…"
            className="w-full bg-transparent text-[14px] text-text placeholder:text-text-subtle focus:outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5">
          {rows.length === 0 ? (
            <div className="px-2 py-8 text-center text-[13px] text-text-subtle">No results for “{q}”</div>
          ) : (
            rows.map((row, i) => {
              const showSection = row.section !== lastSection;
              lastSection = row.section;
              return (
                <div key={row.id + i}>
                  {showSection && (
                    <div className="px-2 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wide text-text-subtle">{row.section}</div>
                  )}
                  <button
                    data-i={i}
                    onMouseMove={() => setActive(i)}
                    onClick={() => row.onSelect()}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left",
                      i === active && "bg-surface-hover",
                    )}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">{row.icon}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-text">{row.label}</span>
                    {row.sub && <span className="shrink-0 font-mono text-[10.5px] text-text-subtle">{row.sub}</span>}
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center gap-3 border-t border-border bg-surface-2 px-3 py-2 text-[11px] text-text-subtle">
          <span className="flex items-center gap-1"><Kbd><ArrowUp size={9} /></Kbd><Kbd><ArrowDown size={9} /></Kbd> navigate</span>
          <span className="flex items-center gap-1"><Kbd><CornerDownLeft size={9} /></Kbd> open</span>
        </div>
      </div>
    </Modal>
  );
}
