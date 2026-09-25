import { Download, FileDown, Table2 } from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { useStore } from "@/lib/store/store";
import { useIssueQuery } from "@/lib/store/query";
import { allIssueViews, filterIssues, sortIssues, activeFilterCount } from "@/lib/store/selectors";
import { issuesToCsv, downloadCsv } from "@/lib/utils/csv";
import { toast } from "@/components/ui/toast";

/** Exports the issue list to CSV — current filtered view or everything. */
export function ExportMenu({ scopeLabel = "issues", baseViews }: { scopeLabel?: string; baseViews?: () => ReturnType<typeof allIssueViews> }) {
  const store = useStore();
  const { filters, sort } = useIssueQuery();
  const filtered = activeFilterCount(filters) > 0;

  const base = () => (baseViews ? baseViews() : allIssueViews(store));

  const exportCsv = (onlyFiltered: boolean) => {
    const views = onlyFiltered ? sortIssues(filterIssues(base(), filters), sort) : sortIssues(base(), sort);
    const csv = issuesToCsv(views, store.users);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`issuelyst-${scopeLabel}-${stamp}.csv`, csv);
    toast.success(`Exported ${views.length} issue${views.length === 1 ? "" : "s"} to CSV`);
  };

  return (
    <Popover
      placement="bottom-end"
      className="w-56 p-1"
      render={({ close }) => (
        <div>
          <button
            onClick={() => { exportCsv(true); close(); }}
            className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-[7px] text-left font-display text-[13px] font-medium transition-colors hover:bg-surface-2"
          >
            <FileDown size={15} strokeWidth={2.2} className="text-text-muted" />
            <span className="flex-1">Export current view</span>
            {filtered && <span className="rounded-[5px] bg-accent-soft px-1.5 py-0.5 text-[10.5px] font-bold text-accent">filtered</span>}
          </button>
          <button
            onClick={() => { exportCsv(false); close(); }}
            className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-[7px] text-left font-display text-[13px] font-medium transition-colors hover:bg-surface-2"
          >
            <Table2 size={15} strokeWidth={2.2} className="text-text-muted" />
            <span className="flex-1">Export all issues</span>
          </button>
          <div className="px-2.5 pb-1 pt-1.5 text-[12px] text-text-subtle">Downloads a .csv file</div>
        </div>
      )}
    >
      <button
        title="Export to CSV"
        className="flex h-8 w-8 items-center justify-center rounded-[10px] text-text-muted transition-[background-color,color,transform] duration-150 hover:bg-surface-2 hover:text-text active:scale-[0.95] data-[state=open]:bg-surface-2 data-[state=open]:text-text"
        aria-label="Export to CSV"
      >
        <Download size={16} strokeWidth={2.2} />
      </button>
    </Popover>
  );
}
