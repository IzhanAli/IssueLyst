import type { InkColor, WhiteboardColor, WhiteboardSize } from "@/lib/types";

/**
 * The drawable sheet, in sheet pixels (the units objects are stored in). On
 * screen it is scaled to fit the canvas at 100%, up or down.
 */
export const SHEET = { width: 1600, height: 1100 } as const;

/** Zoom bounds in percent of the fitted size; the − / + buttons move in `step`s. */
export const ZOOM = { min: 25, max: 400, step: 10 } as const;

/** Fills resolve to theme tokens, so boards follow light and dark mode. */
export const FILL: Record<WhiteboardColor, string> = {
  neutral: "color-mix(in srgb, var(--surface-2) 55%, transparent)",
  amber: "var(--warning-soft)",
  blue: "var(--info-soft)",
  green: "var(--success-soft)",
  red: "var(--danger-soft)",
  indigo: "var(--primary-soft)",
};

/** Sticky note colours, in picker order. */
export const STICKY_SWATCHES: { color: WhiteboardColor; label: string }[] = [
  { color: "amber", label: "Amber" },
  { color: "blue", label: "Blue" },
  { color: "green", label: "Green" },
  { color: "red", label: "Red" },
  { color: "indigo", label: "Indigo" },
];

/** Shape fills: the soft gray shapes start with, then the note colours. */
export const SHAPE_SWATCHES: { color: WhiteboardColor; label: string }[] = [
  { color: "neutral", label: "Gray" },
  ...STICKY_SWATCHES,
];

/** Text and pen colours, also theme tokens. */
export const INK: Record<InkColor, string> = {
  default: "var(--text)",
  gray: "var(--text-muted)",
  red: "var(--danger)",
  orange: "var(--prio-high)",
  green: "var(--success)",
  blue: "var(--primary)",
};

/** Text and pen colour choices, in picker order. */
export const INK_SWATCHES: { color: InkColor; label: string }[] = [
  { color: "default", label: "Default" },
  { color: "gray", label: "Gray" },
  { color: "red", label: "Red" },
  { color: "orange", label: "Orange" },
  { color: "green", label: "Green" },
  { color: "blue", label: "Blue" },
];

/** S / M / L, in picker order. */
export const SIZES: { size: WhiteboardSize; label: string; name: string }[] = [
  { size: "s", label: "S", name: "Small" },
  { size: "m", label: "M", name: "Medium" },
  { size: "l", label: "L", name: "Large" },
];

/** A text object's font size, in sheet pixels. */
export const TEXT_SIZE: Record<WhiteboardSize, number> = { s: 16, m: 22, l: 34 };

/** A pen stroke's width, in sheet pixels. */
export const INK_WIDTH: Record<WhiteboardSize, number> = { s: 3, m: 5, l: 9 };

export const SELECTION_RING =
  "0 0 0 3px var(--primary), 0 0 0 7px color-mix(in srgb, var(--primary) 18%, transparent)";

export const STICKY_SHADOW =
  "0 2px 3px 0 rgb(18 24 38 / 0.18), 0 8px 18px -10px rgb(18 24 38 / 0.3)";

/** Shared SVG attributes for pen strokes. */
export const INK_LINE = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
