import { useCallback, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { Priority } from "@/lib/types";
import {
  EMPTY_FILTERS,
  type Filters,
  type GroupBy,
  type Sort,
  type SortField,
} from "./selectors";
import type { AppSearch } from "./search";

type ArrayFilterKey = "statusIds" | "priorities" | "assigneeIds" | "labelIds";

export interface IssueQuery {
  filters: Filters;
  sort: Sort;
  groupBy: GroupBy;
  setFilters: (next: Partial<Filters>) => void;
  toggleFilter: (key: ArrayFilterKey, value: string) => void;
  toggleFieldFilter: (fieldId: string, optionId: string) => void;
  clearFilters: () => void;
  setQ: (q: string) => void;
  setSort: (sort: Sort) => void;
  setGroupBy: (g: GroupBy) => void;
}

/** Absent params default to the number sort, ascending. */
const DEFAULT_SORT: Sort = { field: "number", dir: "asc" };

const split = (value: string | undefined): string[] =>
  value ? value.split(",").filter(Boolean) : [];

const join = (values: string[]): string | undefined =>
  values.length ? values.join(",") : undefined;

/** Reads the validated search object into the `Filters` shape the selectors want. */
function toFilters(search: AppSearch): Filters {
  const fields: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(search)) {
    if (!key.startsWith("f.") || typeof value !== "string") continue;
    const ids = split(value);
    if (ids.length) fields[key.slice(2)] = ids;
  }
  return {
    statusIds: split(search.status),
    priorities: split(search.priority) as Priority[],
    assigneeIds: split(search.assignee),
    labelIds: split(search.label),
    createdWithin: search.cw ?? "",
    updatedWithin: search.uw ?? "",
    fields,
    q: search.q ?? "",
  };
}

/**
 * Projects `Filters` back onto the search object, preserving every param the
 * filters don't own (`sort`, `group`, `issue`).
 */
function withFilters(prev: AppSearch, filters: Filters): AppSearch {
  const next: AppSearch = { ...prev };

  for (const key of Object.keys(next)) {
    if (key.startsWith("f.")) delete next[key as `f.${string}`];
  }

  next.status = join(filters.statusIds);
  next.priority = join(filters.priorities);
  next.assignee = join(filters.assigneeIds);
  next.label = join(filters.labelIds);
  next.cw = filters.createdWithin || undefined;
  next.uw = filters.updatedWithin || undefined;
  next.q = filters.q || undefined;

  for (const [fieldId, optionIds] of Object.entries(filters.fields)) {
    const value = join(optionIds);
    if (value) next[`f.${fieldId}`] = value;
  }

  return next;
}

export function useIssueQuery(): IssueQuery {
  // Validated at the `/app` layout route, so every screen below it — the
  // project views, My Issues, the Inbox, Home — reads the same schema.
  const search = useSearch({ from: "/app" });
  const navigate = useNavigate();

  const filters = useMemo(() => toFilters(search), [search]);

  const sort = useMemo<Sort>(() => {
    if (!search.sort) return DEFAULT_SORT;
    const [field, dir] = search.sort.split(":");
    return { field: field as SortField, dir: dir === "desc" ? "desc" : "asc" };
  }, [search.sort]);

  const groupBy: GroupBy = search.group ?? "status";

  const commit = useCallback(
    (next: AppSearch) => {
      navigate({ to: ".", search: next, replace: true, resetScroll: false });
    },
    [navigate],
  );

  const writeFilters = useCallback(
    (next: Filters) => commit(withFilters(search, next)),
    [search, commit],
  );

  const setFilters = useCallback(
    (partial: Partial<Filters>) => writeFilters({ ...filters, ...partial }),
    [filters, writeFilters],
  );

  const toggleFilter = useCallback(
    (key: ArrayFilterKey, value: string) => {
      const current = filters[key] as string[];
      const next = current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value];
      writeFilters({ ...filters, [key]: next });
    },
    [filters, writeFilters],
  );

  const toggleFieldFilter = useCallback(
    (fieldId: string, optionId: string) => {
      const current = filters.fields[fieldId] ?? [];
      const next = current.includes(optionId)
        ? current.filter((x) => x !== optionId)
        : [...current, optionId];
      const fields = { ...filters.fields, [fieldId]: next };
      if (!next.length) delete fields[fieldId];
      writeFilters({ ...filters, fields });
    },
    [filters, writeFilters],
  );

  const clearFilters = useCallback(
    () => writeFilters(EMPTY_FILTERS),
    [writeFilters],
  );

  const setQ = useCallback((q: string) => setFilters({ q }), [setFilters]);

  const setSort = useCallback(
    (next: Sort) => commit({ ...search, sort: `${next.field}:${next.dir}` }),
    [search, commit],
  );

  const setGroupBy = useCallback(
    (next: GroupBy) =>
      commit({ ...search, group: next === "status" ? undefined : next }),
    [search, commit],
  );

  return {
    filters,
    sort,
    groupBy,
    setFilters,
    toggleFilter,
    toggleFieldFilter,
    clearFilters,
    setQ,
    setSort,
    setGroupBy,
  };
}
