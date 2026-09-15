import type { DateWindow, GroupBy, SortField } from "./selectors";

/**
 * The validated shape of the app's URL search params.
 *
 * This is the wire format, kept byte-identical to the strings the previous
 * hand-rolled parser produced, so existing links, bookmarks and the e2e
 * suite's URL assertions all keep working:
 *
 *   ?status=s_open,s_triaged&priority=p1&assignee=u_lena&label=l_bug
 *   &cw=7&uw=1&q=timeout&sort=updated:desc&group=priority
 *   &f.<fieldId>=<optionId>,<optionId>&issue=142
 *
 * `undefined` means "absent from the URL" — Router omits those keys entirely,
 * which is what keeps clean URLs clean.
 */
export type WindowValue = Exclude<DateWindow, "">;

export interface AppSearch {
  /** comma-joined status ids */
  status?: string;
  /** comma-joined priorities */
  priority?: string;
  /** comma-joined user ids; may include the literal "unassigned" */
  assignee?: string;
  /** comma-joined label ids */
  label?: string;
  /** created-within window, in days */
  cw?: WindowValue;
  /** updated-within window, in days */
  uw?: WindowValue;
  /** quick text filter */
  q?: string;
  /** `${SortField}:${"asc" | "desc"}` */
  sort?: string;
  group?: GroupBy;
  /** issue key for the detail drawer */
  issue?: string;
  /** whiteboard id on /app/whiteboards; absent means the first board */
  board?: string;
  /** dynamic custom-field filters, comma-joined option ids */
  [key: `f.${string}`]: string | undefined;
}

const SORT_FIELDS: readonly SortField[] = [
  "number",
  "title",
  "status",
  "priority",
  "assignee",
  "created",
  "updated",
  "due",
];

const WINDOWS: readonly WindowValue[] = ["1", "7", "30"];

const STATIC_GROUPS: readonly GroupBy[] = ["status", "priority", "assignee", "none"];

/**
 * A non-empty trimmed string, or undefined — "absent" vs "" as before.
 *
 * Router decodes query values through `qss`, which coerces anything that
 * round-trips as a number into a number and `true`/`false` into booleans. So
 * `?issue=142` arrives as `142` and a checkbox filter's `?f.x=true` arrives as
 * `true`. Normalising them back to strings here is the validator's job; every
 * consumer downstream expects the string form.
 */
function text(value: unknown): string | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : undefined;
  if (typeof value === "boolean") return String(value);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

/** Drops empty members so `?status=,,` can't produce phantom filter entries. */
function idList(value: unknown): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  const parts = raw.split(",").filter(Boolean);
  return parts.length ? parts.join(",") : undefined;
}

function window(value: unknown): WindowValue | undefined {
  const raw = text(value);
  return raw && (WINDOWS as readonly string[]).includes(raw)
    ? (raw as WindowValue)
    : undefined;
}

/**
 * Accepts `field:dir`. Anything unrecognised is dropped rather than passed
 * through, so `useIssueQuery` can fall back to the default sort — which is
 * what the old `"manual:asc"` sentinel resolved to.
 */
function sortParam(value: unknown): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  const [field, dir] = raw.split(":");
  if (!(SORT_FIELDS as readonly string[]).includes(field)) return undefined;
  return `${field}:${dir === "desc" ? "desc" : "asc"}`;
}

function group(value: unknown): GroupBy | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  if ((STATIC_GROUPS as readonly string[]).includes(raw)) return raw as GroupBy;
  if (raw.startsWith("field:") && raw.length > "field:".length) return raw as GroupBy;
  return undefined;
}

/**
 * `validateSearch` for the `/app` layout route. Every route below it inherits
 * this schema, which is what lets the drawer's `?issue=` deep link work from
 * My Issues, the Inbox and Home as well as the project views.
 */
export function validateAppSearch(input: Record<string, unknown>): AppSearch {
  const out: AppSearch = {};

  const status = idList(input.status);
  if (status) out.status = status;

  const priority = idList(input.priority);
  if (priority) out.priority = priority;

  const assignee = idList(input.assignee);
  if (assignee) out.assignee = assignee;

  const label = idList(input.label);
  if (label) out.label = label;

  const cw = window(input.cw);
  if (cw) out.cw = cw;

  const uw = window(input.uw);
  if (uw) out.uw = uw;

  const q = text(input.q);
  if (q) out.q = q;

  const sort = sortParam(input.sort);
  if (sort) out.sort = sort;

  const groupBy = group(input.group);
  // "status" is the default, so it is never written to the URL.
  if (groupBy && groupBy !== "status") out.group = groupBy;

  const issue = text(input.issue);
  if (issue) out.issue = issue;

  const board = text(input.board);
  if (board) out.board = board;

  for (const key of Object.keys(input)) {
    if (!key.startsWith("f.") || key.length <= 2) continue;
    const value = idList(input[key]);
    if (value) out[key as `f.${string}`] = value;
  }

  return out;
}
