import type { Priority } from "./types";

export const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; color: string; short: string }
> = {
  urgent: { label: "Urgent", color: "var(--prio-urgent)", short: "P0" },
  high: { label: "High", color: "var(--prio-high)", short: "P1" },
  medium: { label: "Medium", color: "var(--prio-medium)", short: "P2" },
  low: { label: "Low", color: "var(--prio-low)", short: "P3" },
  none: { label: "No priority", color: "var(--text-subtle)", short: "—" },
};

export const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low", "none"];

/** Session storage keys */
export const CURRENT_USER_KEY = "projex.currentUser";
export const THEME_KEY = "projex.theme";
export const SIDEBAR_KEY = "projex.sidebar.collapsed";
