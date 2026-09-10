"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus, GripVertical } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { IssueView } from "@/lib/types";
import { IssueRow } from "./issue-row";
import { StatusIcon } from "./status-icon";
import { PriorityIcon } from "./priority-icon";
import { BulkBar } from "./bulk-bar";
import { useStore } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { useIssueDrawer } from "@/lib/hooks/use-drawer";
import { useIssueQuery } from "@/lib/store/query";
import { filterIssues, sortIssues, groupIssues, type Group } from "@/lib/store/selectors";
import { visibleListFields, orderedFields, fieldColWidth } from "@/lib/fields";
import { isTypingTarget } from "@/lib/utils/platform";
import { cn } from "@/lib/utils/cn";
import type { FieldDef } from "@/lib/types";

export function IssueList({ views, empty }: { views: IssueView[]; empty?: React.ReactNode }) {
  const store = useStore();
  const { filters, sort, groupBy } = useIssueQuery();
  const { open, openKey } = useIssueDrawer();
  const openCreate = useUI((s) => s.openCreate);
  const commandOpen = useUI((s) => s.commandOpen);
  const createOpen = useUI((s) => s.createOpen);

  const columns = useUI((s) => s.columns);
  const columnOrder = useUI((s) => s.columnOrder);
  const setColumnOrder = useUI((s) => s.setColumnOrder);
  const visibleFields = visibleListFields(store.fieldDefs, columns, columnOrder);

  const reorderColumns = (newVisibleIds: string[]) => {
    const allOrdered = orderedFields(store.fieldDefs, columnOrder).map((f) => f.id);
    const hidden = allOrdered.filter((id) => !newVisibleIds.includes(id));
    setColumnOrder([...newVisibleIds, ...hidden]);
  };

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeIdx, setActiveIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const groups = useMemo<Group[]>(() => {
    const filtered = filterIssues(views, filters);
    const sorted = sortIssues(filtered, sort);
    return groupIssues(sorted, groupBy, store).filter((g) => g.issues.length > 0 || groupBy === "status");
  }, [views, filters, sort, groupBy, store]);

  const flat = useMemo(
    () => groups.flatMap((g) => (collapsed.has(g.key) ? [] : g.issues)),
    [groups, collapsed],
  );

  const totalFiltered = flat.length + groups.reduce((n, g) => (collapsed.has(g.key) ? n + g.issues.length : n), 0);

  // keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || commandOpen || createOpen || openKey) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && activeIdx >= 0 && flat[activeIdx]) {
        e.preventDefault();
        open(flat[activeIdx].issueKey);
      } else if (e.key === "x" && activeIdx >= 0 && flat[activeIdx]) {
        e.preventDefault();
        toggleSelect(flat[activeIdx].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flat, activeIdx, commandOpen, createOpen, openKey]);

  useEffect(() => {
    scrollRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleGroup = (key: string) =>
    setCollapsed((s) => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  if (totalFiltered === 0 && empty) {
    return <div className="flex h-full items-center justify-center">{empty}</div>;
  }

  let runningIdx = 0;

  return (
    <div ref={scrollRef} className="relative h-full overflow-auto">
      <div className="min-w-full w-max">
      <ColumnHeader fields={visibleFields} onReorder={reorderColumns} />
      {groups.map((group) => {
        const isCollapsed = collapsed.has(group.key);
        return (
          <section key={group.key} className="border-b border-border last:border-b-0">
            {/* group header */}
            <div className="group sticky top-8 z-10 flex h-9 items-center gap-2 bg-surface-2/95 px-2.5 backdrop-blur supports-[backdrop-filter]:bg-surface-2/85">
              <button onClick={() => toggleGroup(group.key)} className="rounded p-0.5 text-text-subtle hover:text-text" aria-label="Toggle group">
                <ChevronDown size={13} className={cn("transition-transform", isCollapsed && "-rotate-90")} />
              </button>
              <GroupLabel group={group} groupBy={groupBy} />
              <span className="font-mono text-[11px] text-text-subtle">{group.count}</span>
              <button
                onClick={() => openCreate(group.status ? { statusId: group.status.id } : undefined)}
                className="ml-auto rounded p-1 text-text-subtle opacity-0 transition-opacity hover:bg-surface-hover hover:text-text group-hover:opacity-100"
                aria-label="Add issue to group"
              >
                <Plus size={14} />
              </button>
            </div>

            {!isCollapsed && (
              <div>
                {group.issues.map((v) => {
                  const idx = runningIdx++;
                  return (
                    <div key={v.id} data-idx={idx}>
                      <IssueRow
                        view={v}
                        active={idx === activeIdx}
                        selected={selected.has(v.id)}
                        onOpen={() => { setActiveIdx(idx); open(v.issueKey); }}
                        onToggleSelect={() => toggleSelect(v.id)}
                        showStatus={groupBy !== "status"}
                        fields={visibleFields}
                      />
                    </div>
                  );
                })}
                {group.issues.length === 0 && (
                  <button
                    onClick={() => openCreate(group.status ? { statusId: group.status.id } : undefined)}
                    className="flex h-9 w-full items-center gap-2 px-3.5 text-[12.5px] text-text-subtle hover:bg-surface-hover"
                  >
                    <Plus size={13} /> Add issue
                  </button>
                )}
              </div>
            )}
          </section>
        );
      })}
      </div>

      <BulkBar
        count={selected.size}
        ids={[...selected]}
        onClear={() => setSelected(new Set())}
      />
    </div>
  );
}

function ColumnHeader({ fields, onReorder }: { fields: FieldDef[]; onReorder: (ids: string[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const ids = fields.map((f) => f.id);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
    }
  };

  return (
    <div className="sticky top-0 z-20 flex h-8 items-center gap-2.5 border-b border-border bg-surface pl-2.5 pr-3 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-text-subtle">
      <span className="w-[130px] shrink-0 pl-6">Task</span>
      <span className="w-[300px] shrink-0 lg:w-[400px]">Name</span>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          {fields.map((f) => <SortableColumn key={f.id} field={f} />)}
        </SortableContext>
      </DndContext>
      <span className="min-w-0 flex-1" />
      <span className="hidden w-[64px] shrink-0 text-right sm:block">Due</span>
      <span className="hidden w-[52px] shrink-0 text-right sm:block">Act.</span>
      <span className="w-6 shrink-0 text-right">@</span>
    </div>
  );
}

function SortableColumn({ field }: { field: FieldDef }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  return (
    <span
      ref={setNodeRef}
      style={{ width: fieldColWidth(field), transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="group hidden shrink-0 cursor-grab items-center gap-1 truncate active:cursor-grabbing md:flex"
      title={`${field.name} — drag to reorder`}
      {...attributes}
      {...listeners}
    >
      <GripVertical size={11} className="shrink-0 text-text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
      <span className="truncate">{field.name}</span>
    </span>
  );
}

function GroupLabel({ group, groupBy }: { group: Group; groupBy: string }) {
  if (groupBy === "status" && group.status) {
    return (
      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: group.status.color }}>
        <StatusIcon status={group.status} size={14} /> {group.label}
      </span>
    );
  }
  if (groupBy === "priority") {
    return (
      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text">
        <PriorityIcon priority={group.key as never} size={14} /> {group.label}
      </span>
    );
  }
  return <span className="text-[12.5px] font-semibold text-text">{group.label}</span>;
}
