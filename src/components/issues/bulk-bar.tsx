"use client";

import { AnimatePresence, motion } from "motion/react";
import { X, Trash2, CircleDot, UserRound } from "lucide-react";
import { StatusPicker, AssigneePicker } from "./pickers";
import { useStore } from "@/lib/store/store";
import { usePermissions } from "@/lib/auth/use-permissions";
import { toast } from "@/components/ui/toast";

export function BulkBar({ count, ids, onClear }: { count: number; ids: string[]; onClear: () => void }) {
  const updateIssue = useStore((s) => s.updateIssue);
  const deleteIssue = useStore((s) => s.deleteIssue);
  const canDelete = usePermissions().can("issue.delete");

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="pointer-events-auto fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-border-strong bg-surface px-1.5 py-1.5 shadow-[var(--shadow-lg)]"
        >
          <span className="flex items-center gap-2 px-2 text-[12.5px] font-medium text-text">
            <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-primary px-1 font-mono text-[11px] text-primary-fg">{count}</span>
            selected
          </span>
          <div className="mx-0.5 h-5 w-px bg-border" />

          <StatusPicker value="" onChange={(id) => { ids.forEach((i) => updateIssue(i, { statusId: id })); }} placement="bottom-start">
            <button className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-text-muted hover:bg-surface-hover hover:text-text">
              <CircleDot size={14} /> Status
            </button>
          </StatusPicker>

          <AssigneePicker value={null} onChange={(id) => { ids.forEach((i) => updateIssue(i, { assigneeId: id })); }} placement="bottom-start">
            <button className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-text-muted hover:bg-surface-hover hover:text-text">
              <UserRound size={14} /> Assign
            </button>
          </AssigneePicker>

          {canDelete && (
            <button
              onClick={() => {
                ids.forEach((i) => deleteIssue(i));
                toast.success(`${ids.length} issue${ids.length > 1 ? "s" : ""} deleted`);
                onClear();
              }}
              className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-danger hover:bg-danger-soft"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}

          <div className="mx-0.5 h-5 w-px bg-border" />
          <button onClick={onClear} className="rounded-md p-1.5 text-text-subtle hover:bg-surface-hover hover:text-text" aria-label="Clear selection">
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
