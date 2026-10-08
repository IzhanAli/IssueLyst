import type { WhiteboardObject } from "@/lib/types";
import { HANDLE_SIZE, MIN_OBJECT_SIZE } from "./constants";

/** What a resize handle drags: a corner, or for text a side. */
export type Handle = "nw" | "ne" | "sw" | "se" | "w" | "e";

/** An object's box, in sheet pixels. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const CORNERS: Handle[] = ["nw", "ne", "sw", "se"];
const SIDES: Handle[] = ["w", "e"];

const CURSOR: Record<Handle, string> = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  w: "ew-resize",
  e: "ew-resize",
};

/** Text only changes width, so it gets side handles. Pen strokes don't resize. */
export function handlesOf(o: WhiteboardObject): Handle[] {
  if (o.kind === "ink") return [];
  return o.kind === "text" ? SIDES : CORNERS;
}

/**
 * The box after dragging `handle` by (dx, dy) sheet pixels. The opposite
 * edges stay put, and neither side shrinks below the minimum.
 */
export function resizeBox(start: Box, handle: Handle, dx: number, dy: number): Box {
  let { x, y, w, h } = start;
  if (handle.includes("e")) w = Math.max(MIN_OBJECT_SIZE, Math.round(start.w + dx));
  if (handle.includes("w")) {
    w = Math.max(MIN_OBJECT_SIZE, Math.round(start.w - dx));
    x = start.x + start.w - w;
  }
  if (handle.includes("s")) h = Math.max(MIN_OBJECT_SIZE, Math.round(start.h + dy));
  if (handle.includes("n")) {
    h = Math.max(MIN_OBJECT_SIZE, Math.round(start.h - dy));
    y = start.y + start.h - h;
  }
  return { x, y, w, h };
}

/** The object with a resized box. Text keeps its height, which follows its content. */
export function withBox(o: WhiteboardObject, { x, y, w, h }: Box): WhiteboardObject {
  switch (o.kind) {
    case "ink":
      return o;
    case "text":
      return { ...o, x, w };
    default:
      return { ...o, x, y, w, h };
  }
}

/**
 * The selected object's handles, drawn over every object so none hides them.
 * Lives on the sheet, so `k` keeps the squares one screen size at any zoom.
 */
export function ResizeHandles({
  box,
  handles,
  k,
  onStart,
}: {
  box: Box;
  handles: Handle[];
  /** the sheet's on-screen scale */
  k: number;
  onStart: (e: React.PointerEvent, handle: Handle) => void;
}) {
  const size = HANDLE_SIZE / k;
  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
    >
      {handles.map((handle) => (
        <div
          key={handle}
          data-wb-handle={handle}
          onPointerDown={(e) => onStart(e, handle)}
          // twice the visible square, so the handle is easy to catch
          className="pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          style={{
            left: handle.includes("w") ? 0 : "100%",
            top: handle.includes("n") ? 0 : handle.includes("s") ? "100%" : "50%",
            width: size * 2,
            height: size * 2,
            cursor: CURSOR[handle],
          }}
        >
          <span
            className="box-border block bg-surface"
            style={{
              width: size,
              height: size,
              border: `${2 / k}px solid var(--accent)`,
              borderRadius: 3 / k,
            }}
          />
        </div>
      ))}
    </div>
  );
}
