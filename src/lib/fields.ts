import type { FieldDef } from "@/lib/types";

/** Whether a field column is shown in the list (user override wins over the default). */
export function isFieldVisible(field: FieldDef, columns: Record<string, boolean>): boolean {
  return columns[field.id] ?? field.showInList;
}

/** All fields ordered by the user's column order, falling back to field position. */
export function orderedFields(fieldDefs: FieldDef[], columnOrder: string[]): FieldDef[] {
  const byPosition = [...fieldDefs].sort((a, b) => a.position - b.position);
  if (!columnOrder.length) return byPosition;
  const rank = new Map(columnOrder.map((id, i) => [id, i]));
  return byPosition.sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id)! : Infinity;
    const rb = rank.has(b.id) ? rank.get(b.id)! : Infinity;
    if (ra !== rb) return ra - rb;
    return a.position - b.position;
  });
}

export function visibleListFields(
  fieldDefs: FieldDef[],
  columns: Record<string, boolean>,
  columnOrder: string[] = [],
): FieldDef[] {
  return orderedFields(fieldDefs, columnOrder).filter((f) => isFieldVisible(f, columns));
}

/** Fixed column width (px) for a field cell so rows align across groups. */
export function fieldColWidth(field: FieldDef): number {
  switch (field.type) {
    case "checkbox": return 64;
    case "number": return 68;
    case "date": return 92;
    case "multi_select": return 150;
    case "text": return 130;
    default: return 118; // select
  }
}
