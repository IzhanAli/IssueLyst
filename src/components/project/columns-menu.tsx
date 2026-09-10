"use client";

import { Columns2, Check } from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { useStore } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { isFieldVisible } from "@/lib/fields";
import { ctrlBtn } from "./controls";
import { cn } from "@/lib/utils/cn";

export function ColumnsMenu() {
  const fieldDefs = [...useStore((s) => s.fieldDefs)].sort((a, b) => a.position - b.position);
  const columns = useUI((s) => s.columns);
  const toggleColumn = useUI((s) => s.toggleColumn);
  const shown = fieldDefs.filter((f) => isFieldVisible(f, columns)).length;

  return (
    <Popover
      placement="bottom-start"
      className="w-56 p-1"
      render={() => (
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="px-2 pb-1 pt-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-text-subtle">Field columns</div>
          {fieldDefs.map((f) => {
            const on = isFieldVisible(f, columns);
            return (
              <button
                key={f.id}
                onClick={() => toggleColumn(f.id, !on)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-surface-hover"
              >
                <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded border", on ? "border-primary bg-primary text-primary-fg" : "border-border-strong")}>
                  {on && <Check size={10} />}
                </span>
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-[10px] capitalize text-text-subtle">{f.type.replace("_", " ")}</span>
              </button>
            );
          })}
          {fieldDefs.length === 0 && <div className="px-2 py-3 text-center text-[12px] text-text-subtle">No fields yet</div>}
        </div>
      )}
    >
      <button className={ctrlBtn}>
        <Columns2 size={14} /> Columns
        <span className="font-mono text-[10.5px] text-text-subtle">{shown}</span>
      </button>
    </Popover>
  );
}
