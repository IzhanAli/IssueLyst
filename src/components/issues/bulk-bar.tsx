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
          transition={{ type: "spring", stiffness: 520, damping: 34 }}
          className="pointer-events-auto fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-[14px] bg-primary p-1.5 text-primary-fg shadow-[var(--shadow-lg)]"
        >
          <span className="flex items-center gap-2 pl-1.5 pr-2 font-display text-[13px] font-semibold">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-[7px] bg-primary-fg px-1.5 text-[12px] font-extrabold text-primary">{count}</span>
            selected
          </span>
          <div className="mx-0.5 h-5 w-px bg-primary-fg/20" />

          <StatusPicker value="" onChange={(id) => { ids.forEach((i) => updateIssue(i, { statusId: id })); }} placement="bottom-start">
            <button className="flex h-8 items-center gap-1.5 rounded-[9px] px-2.5 font-display text-[13px] font-semibold text-primary-fg/75 transition-colors hover:bg-primary-fg/10 hover:text-primary-fg">
              <CircleDot size={15} strokeWidth={2.2} /> Status
            </button>
          </StatusPicker>

          <AssigneePicker value={null} onChange={(id) => { ids.forEach((i) => updateIssue(i, { assigneeId: id })); }} placement="bottom-start">
            <button className="flex h-8 items-center gap-1.5 rounded-[9px] px-2.5 font-display text-[13px] font-semibold text-primary-fg/75 transition-colors hover:bg-primary-fg/10 hover:text-primary-fg">
              <UserRound size={15} strokeWidth={2.2} /> Assign
            </button>
          </AssigneePicker>

          {canDelete && (
            <button
              onClick={() => {
                ids.forEach((i) => deleteIssue(i));
                toast.success(`${ids.length} issue${ids.length > 1 ? "s" : ""} deleted`);
                onClear();
              }}
              className="ml-0.5 flex h-8 items-center gap-1.5 rounded-[9px] bg-signal px-2.5 font-display text-[13px] font-bold text-signal-fg transition-[background-color,transform] duration-150 hover:bg-signal-hover active:scale-[0.97]"
            >
              <Trash2 size={15} strokeWidth={2.3} /> Delete
            </button>
          )}

          <div className="mx-0.5 h-5 w-px bg-primary-fg/20" />
          <button onClick={onClear} className="rounded-[8px] p-1.5 text-primary-fg/60 transition-colors hover:bg-primary-fg/10 hover:text-primary-fg" aria-label="Clear selection">
            <X size={16} strokeWidth={2.4} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
