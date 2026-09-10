"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Priority } from "@/lib/types";
import {
  EMPTY_FILTERS,
  type DateWindow,
  type Filters,
  type GroupBy,
  type Sort,
  type SortField,
} from "./selectors";

const csv = (v: string | null): string[] =>
  v ? v.split(",").filter(Boolean) : [];

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

export function useIssueQuery(): IssueQuery {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const filters = useMemo<Filters>(() => {
    const fields: Record<string, string[]> = {};
    for (const [k, v] of sp.entries()) {
      if (k.startsWith("f.") && v) fields[k.slice(2)] = v.split(",").filter(Boolean);
    }
    return {
      statusIds: csv(sp.get("status")),
      priorities: csv(sp.get("priority")) as Priority[],
      assigneeIds: csv(sp.get("assignee")),
      labelIds: csv(sp.get("label")),
      createdWithin: (sp.get("cw") ?? "") as DateWindow,
      updatedWithin: (sp.get("uw") ?? "") as DateWindow,
      fields,
      q: sp.get("q") ?? "",
    };
  }, [sp]);

  const sort = useMemo<Sort>(() => {
    const raw = sp.get("sort") ?? "manual:asc";
    const [field, dir] = raw.split(":");
    const valid: SortField[] = ["number", "title", "status", "priority", "assignee", "created", "updated", "due"];
    return {
      field: (valid.includes(field as SortField) ? field : "number") as SortField,
      dir: dir === "desc" ? "desc" : "asc",
    };
  }, [sp]);

  const groupBy = (sp.get("group") as GroupBy) || "status";

  const commit = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const writeFilters = useCallback(
    (next: Filters) => {
      const p = new URLSearchParams(sp.toString());
      const set = (k: string, v: string[]) => (v.length ? p.set(k, v.join(",")) : p.delete(k));
      set("status", next.statusIds);
      set("priority", next.priorities);
      set("assignee", next.assigneeIds);
      set("label", next.labelIds);
      if (next.createdWithin) p.set("cw", next.createdWithin); else p.delete("cw");
      if (next.updatedWithin) p.set("uw", next.updatedWithin); else p.delete("uw");
      for (const k of [...p.keys()]) if (k.startsWith("f.")) p.delete(k);
      for (const [fid, opts] of Object.entries(next.fields)) if (opts.length) p.set(`f.${fid}`, opts.join(","));
      if (next.q) p.set("q", next.q); else p.delete("q");
      commit(p);
    },
    [sp, commit],
  );

  const setFilters = useCallback(
    (partial: Partial<Filters>) => writeFilters({ ...filters, ...partial }),
    [filters, writeFilters],
  );

  const toggleFilter = useCallback(
    (key: ArrayFilterKey, value: string) => {
      const cur = filters[key] as string[];
      const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
      writeFilters({ ...filters, [key]: next });
    },
    [filters, writeFilters],
  );

  const toggleFieldFilter = useCallback(
    (fieldId: string, optionId: string) => {
      const cur = filters.fields[fieldId] ?? [];
      const next = cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId];
      const fields = { ...filters.fields, [fieldId]: next };
      if (!next.length) delete fields[fieldId];
      writeFilters({ ...filters, fields });
    },
    [filters, writeFilters],
  );

  const clearFilters = useCallback(() => writeFilters(EMPTY_FILTERS), [writeFilters]);

  const setQ = useCallback((q: string) => setFilters({ q }), [setFilters]);

  const setSort = useCallback(
    (s: Sort) => {
      const p = new URLSearchParams(sp.toString());
      p.set("sort", `${s.field}:${s.dir}`);
      commit(p);
    },
    [sp, commit],
  );

  const setGroupBy = useCallback(
    (g: GroupBy) => {
      const p = new URLSearchParams(sp.toString());
      if (g === "status") p.delete("group"); else p.set("group", g);
      commit(p);
    },
    [sp, commit],
  );

  return { filters, sort, groupBy, setFilters, toggleFilter, toggleFieldFilter, clearFilters, setQ, setSort, setGroupBy };
}
