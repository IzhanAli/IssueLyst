import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { IssueCard } from "@/components/issues/issue-card";
import { StatusIcon } from "@/components/issues/status-icon";
import { PriorityIcon } from "@/components/issues/priority-icon";
import { Avatar, AvatarEmpty } from "@/components/ui/avatar";
import { useStore } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useIssueDrawer } from "@/lib/hooks/use-drawer";
import { useIssueQuery } from "@/lib/store/query";
import { allIssueViews, filterIssues, sortIssues, groupIssues, type Group } from "@/lib/store/selectors";
import type { IssueView, Priority } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export function Board() {
  const store = useStore();
  const { filters, sort, groupBy } = useIssueQuery();
  const { open } = useIssueDrawer();
  const updateIssue = useStore((s) => s.updateIssue);
  const setIssueFieldValue = useStore((s) => s.setIssueFieldValue);
  const openCreate = useUI((s) => s.openCreate);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const groups = useMemo<Group[]>(() => {
    const views = sortIssues(filterIssues(allIssueViews(store), filters), sort);
    return groupIssues(views, groupBy === "none" ? "status" : groupBy, store);
    // `store` is the whole state object, so the derived deps are deliberate.
  }, [store, filters, sort, groupBy]);

  const activeView = activeId ? allIssueViews(store).find((v) => v.id === activeId) ?? null : null;
  const fieldId = groupBy.startsWith("field:") ? groupBy.slice(6) : null;
  const field = fieldId ? store.fieldDefs.find((f) => f.id === fieldId) : null;

  /** Apply the group's value to a dropped issue. */
  const applyToColumn = (issueId: string, colKey: string) => {
    if (groupBy === "priority") updateIssue(issueId, { priority: colKey as Priority });
    else if (groupBy === "assignee") updateIssue(issueId, { assigneeId: colKey === "unassigned" ? null : colKey });
    else if (fieldId && field) {
      if (field.type === "checkbox") setIssueFieldValue(issueId, fieldId, colKey === "true");
      else setIssueFieldValue(issueId, fieldId, colKey === "none" ? null : colKey);
    } else updateIssue(issueId, { statusId: colKey }); // status (default)
  };

  const columnDefaults = (colKey: string) => {
    if (groupBy === "priority") return { priority: colKey as Priority };
    if (groupBy === "assignee") return { assigneeId: colKey === "unassigned" ? null : colKey };
    if (fieldId && field && field.type !== "checkbox" && colKey !== "none") return { fields: { [fieldId]: colKey } };
    if (groupBy === "status" || groupBy === "none") return { statusId: colKey };
    return {};
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const overId = e.over?.id ? String(e.over.id) : null;
    const fromKey = e.active.data.current?.colKey as string | undefined;
    if (overId && overId !== fromKey && groups.some((g) => g.key === overId)) {
      applyToColumn(String(e.active.id), overId);
    }
  };

  const columnIcon = (g: Group): React.ReactNode => {
    if (groupBy === "status" && g.status) return <StatusIcon status={g.status} size={14} />;
    if (groupBy === "priority") return <PriorityIcon priority={g.key as Priority} size={14} />;
    if (groupBy === "assignee") {
      const u = store.users.find((x) => x.id === g.key);
      return u ? <Avatar user={u} size="sm" /> : <AvatarEmpty size="sm" />;
    }
    if (g.color) return <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color }} />;
    return null;
  };

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <div className="flex h-full gap-3 overflow-x-auto overflow-y-hidden p-3">
        {groups.map((g) => (
          <Column
            key={g.key}
            colKey={g.key}
            title={g.label}
            color={g.color}
            icon={columnIcon(g)}
            issues={g.issues}
            onOpen={open}
            onAdd={() => openCreate(columnDefaults(g.key))}
            activeId={activeId}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.2,0,0,1)" }}>
        {activeView ? <div className="w-[272px]"><IssueCard view={activeView} dragging /></div> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  colKey,
  title,
  color,
  icon,
  issues,
  onOpen,
  onAdd,
  activeId,
}: {
  colKey: string;
  title: string;
  color?: string;
  icon: React.ReactNode;
  issues: IssueView[];
  onOpen: (key: string) => void;
  onAdd: () => void;
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: colKey });

  return (
    <div className="flex h-full w-[288px] shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        {icon}
        <span className="truncate text-[12.5px] font-semibold" style={color ? { color } : undefined}>{title}</span>
        <span className="font-mono text-[11px] text-text-subtle">{issues.length}</span>
        <button onClick={onAdd} className="ml-auto rounded p-1 text-text-subtle hover:bg-surface-hover hover:text-text" aria-label="Add issue">
          <Plus size={14} />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-1.5 transition-colors",
          isOver ? "bg-primary-soft/50 ring-1 ring-inset ring-ring/40" : "bg-surface-2/50",
        )}
      >
        {issues.map((v) => (
          <DraggableCard key={v.id} view={v} colKey={colKey} onOpen={() => onOpen(v.issueKey)} hidden={activeId === v.id} />
        ))}
        <button onClick={onAdd} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-text-subtle transition-colors hover:bg-surface-hover hover:text-text-muted">
          <Plus size={13} /> Add issue
        </button>
      </div>
    </div>
  );
}

function DraggableCard({ view, colKey, onOpen, hidden }: { view: IssueView; colKey: string; onOpen: () => void; hidden: boolean }) {
  const editable = usePermissions().canEdit(view);
  const { attributes, listeners, setNodeRef } = useDraggable({ id: view.id, data: { colKey }, disabled: !editable });
  return (
    <div ref={setNodeRef} {...(editable ? { ...attributes, ...listeners } : {})} className={cn(hidden && "opacity-40")}>
      <IssueCard view={view} onOpen={onOpen} />
    </div>
  );
}
