import type { InkColor, WhiteboardColor, WhiteboardSize } from "@/lib/types";

/**
 * The drawable sheet, in sheet pixels (the units objects are stored in). On
 * screen it is scaled to fit the canvas at 100%, up or down.
 */
export const SHEET = { width: 1600, height: 1100 } as const;

/** Zoom bounds in percent of the fitted size; the − / + buttons move in `step`s. */
export const ZOOM = { min: 25, max: 400, step: 10 } as const;

/**
 * Fills are board content, not UI chrome, so they keep their own hues rather
 * than the app's four-colour palette (whose semantic tokens now collapse into
 * two accents). Each hue is mixed into the surface, so boards still follow
 * light and dark mode.
 */
export const FILL: Record<WhiteboardColor, string> = {
  // transparent rather than SVG's "none", so an ellipse's inside still takes clicks
  none: "transparent",
  amber: "color-mix(in srgb, #ffcc00 42%, var(--surface))",
  blue: "color-mix(in srgb, var(--accent) 20%, var(--surface))",
  green: "color-mix(in srgb, #34c759 26%, var(--surface))",
  red: "color-mix(in srgb, #ff3b30 22%, var(--surface))",
  indigo: "color-mix(in srgb, #5856d6 22%, var(--surface))",
};

/** Sticky note colours, in picker order. */
export const STICKY_SWATCHES: { color: WhiteboardColor; label: string }[] = [
  { color: "amber", label: "Amber" },
  { color: "blue", label: "Blue" },
  { color: "green", label: "Green" },
  { color: "red", label: "Red" },
  { color: "indigo", label: "Indigo" },
];

/** Shape fills: none, the outline-only shapes start with, then the note colours. */
export const SHAPE_SWATCHES: { color: WhiteboardColor; label: string }[] = [
  { color: "none", label: "None" },
  ...STICKY_SWATCHES,
];

/** Text and pen colours. Content hues too, mixed toward the text colour so they hold contrast in both themes. */
export const INK: Record<InkColor, string> = {
  default: "var(--text)",
  gray: "var(--text-muted)",
  red: "color-mix(in srgb, #ff3b30 88%, var(--text))",
  orange: "color-mix(in srgb, #ff9500 84%, var(--text))",
  green: "color-mix(in srgb, #34c759 80%, var(--text))",
  blue: "var(--accent)",
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

/** The smallest width or height a resize leaves an object, in sheet pixels. */
export const MIN_OBJECT_SIZE = 40;

/** A resize handle's visible square, in screen pixels at any zoom. */
export const HANDLE_SIZE = 10;

/** Selection is azure, like every other selection in the app. */
export const SELECTION_RING =
  "0 0 0 3px var(--accent), 0 0 0 7px color-mix(in srgb, var(--accent) 20%, transparent)";

export const STICKY_SHADOW =
  "0 2px 3px 0 rgb(0 0 0 / 0.16), 0 10px 20px -10px rgb(0 0 0 / 0.3)";

/** Shared SVG attributes for pen strokes. */
export const INK_LINE = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
