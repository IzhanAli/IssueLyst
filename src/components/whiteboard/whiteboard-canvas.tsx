import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import {
  Hand,
  Image,
  Minus,
  MousePointer2,
  Pencil,
  Plus,
  Square,
  StickyNote,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/lib/store/hooks";
import { useStore } from "@/lib/store/store";
import { useUI } from "@/lib/store/ui";
import { useWhiteboards } from "@/lib/store/whiteboards";
import type { InkObject, InkStyle, ShapeKind, Whiteboard, WhiteboardColor, WhiteboardObject } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { isMac, isTypingTarget } from "@/lib/utils/platform";
import { BoardObject, type ObjectHandlers } from "./board-object";
import { INK, INK_LINE, INK_WIDTH, SHAPE_SWATCHES, SHEET, STICKY_SWATCHES, ZOOM } from "./constants";
import { FillPicker, InkStylePicker, SHAPES, ShapePicker, StyleMenu } from "./style-picker";

type Tool = "select" | "hand" | "text" | "sticky" | "pen" | "shape" | "image";

const TOOLS: { id: Tool; label: string; key: string; icon: typeof Hand }[] = [
  { id: "select", label: "Select", key: "v", icon: MousePointer2 },
  { id: "hand", label: "Pan", key: "h", icon: Hand },
  { id: "text", label: "Text", key: "t", icon: Type },
  { id: "sticky", label: "Sticky note", key: "s", icon: StickyNote },
  { id: "pen", label: "Pen", key: "p", icon: Pencil },
  { id: "shape", label: "Shape", key: "r", icon: Square },
  { id: "image", label: "Image", key: "i", icon: Image },
];

const CURSOR: Record<Tool, string> = {
  select: "default",
  hand: "grab",
  text: "crosshair",
  sticky: "crosshair",
  pen: "crosshair",
  shape: "crosshair",
  image: "crosshair",
};

/** Tools with a style menu, opened by right-clicking or pressing and holding their button. */
const TOOL_MENU_LABEL = {
  pen: "Pen style",
  text: "Text style",
  sticky: "Sticky note style",
  shape: "Shape style",
} as const;

type StyledTool = keyof typeof TOOL_MENU_LABEL;

const isStyledTool = (t: Tool): t is StyledTool => t in TOOL_MENU_LABEL;

/** The right-click menu's name for each styleable kind of object. */
const OBJECT_MENU_LABEL: Partial<Record<WhiteboardObject["kind"], string>> = {
  ink: "Stroke style",
  text: "Text style",
  sticky: "Sticky note style",
  shape: "Shape style",
};

/** What S / M / L controls for pen strokes and text. */
const SIZE_NAME = { pen: "Stroke", text: "Font size" } as const;

/** How long a press on a styled tool's button lasts before its menu opens. */
const HOLD_MS = 450;

/**
 * How the sheet sits in the canvas. At 100% the whole sheet fits the canvas,
 * centred, and scales up or down with it; zoom multiplies that fitted size,
 * and the pan offset moves the sheet away from centre.
 */
interface View {
  /** percent of the fitted size */
  zoom: number;
  /** pan offset from centre, in canvas pixels */
  x: number;
  y: number;
}

interface Size {
  w: number;
  h: number;
}

type Point = [number, number];

/** An open style menu, hung from a point in client coordinates. */
type StyleMenuState =
  | { kind: "tool"; tool: StyledTool; at: { x: number; y: number } }
  | { kind: "object"; id: string; at: { x: number; y: number } };

const HOME: View = { zoom: 100, x: 0, y: 0 };

/** Canvas pixels kept clear around the sheet at 100%. */
const FIT_MARGIN = 24;

const newId = () => `wo_${nanoid(8)}`;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const sizeOf = (el: HTMLElement): Size => ({ w: el.clientWidth, h: el.clientHeight });
const isEditable = (o: WhiteboardObject) => o.kind === "sticky" || o.kind === "text" || o.kind === "image";
const inkStyleOf = (o: WhiteboardObject): InkStyle | null =>
  o.kind === "text" || o.kind === "ink" ? { color: o.color, size: o.size } : null;

/** The scale at which the whole sheet, plus margins, exactly fits a canvas of this size. */
function fitScale({ w, h }: Size) {
  return Math.max(0.05, Math.min((w - 2 * FIT_MARGIN) / SHEET.width, (h - 2 * FIT_MARGIN) / SHEET.height));
}

/** The sheet's on-screen scale and its top-left corner, in canvas pixels. */
function sheetLayout(v: View, size: Size) {
  const k = fitScale(size) * (v.zoom / 100);
  return { k, left: (size.w - SHEET.width * k) / 2 + v.x, top: (size.h - SHEET.height * k) / 2 + v.y };
}

/** Zooms while keeping the sheet point under (ax, ay) — canvas pixels — in place. */
function zoomAround(v: View, zoom: number, ax: number, ay: number, size: Size): View {
  const next = Math.round(clamp(zoom, ZOOM.min, ZOOM.max) * 100) / 100;
  if (next === v.zoom) return v;
  const from = sheetLayout(v, size);
  const sx = (ax - from.left) / from.k;
  const sy = (ay - from.top) / from.k;
  const k = fitScale(size) * (next / 100);
  return {
    zoom: next,
    x: ax - sx * k - (size.w - SHEET.width * k) / 2,
    y: ay - sy * k - (size.h - SHEET.height * k) / 2,
  };
}

function pathOf(points: Point[], ox = 0, oy = 0) {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${x - ox} ${y - oy}`).join(" ");
}

/** Stores a stroke relative to its bounding box, so it moves like any other object. */
function inkFrom(points: Point[], style: InkStyle): InkObject {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return {
    id: newId(),
    kind: "ink",
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
    d: pathOf(points, minX, minY),
    ...style,
  };
}

export function WhiteboardCanvas({
  board,
  suspended,
}: {
  board: Whiteboard;
  /** true while something else owns the keyboard, e.g. the issue drawer */
  suspended: boolean;
}) {
  const me = useCurrentUser();
  const users = useStore((s) => s.users);
  const workspaceName = useStore((s) => s.workspace.name);
  const showGrid = useUI((s) => s.whiteboardGrid);
  const penStyle = useUI((s) => s.whiteboardPen);
  const textStyle = useUI((s) => s.whiteboardText);
  const stickyColor = useUI((s) => s.whiteboardSticky);
  const shapeColor = useUI((s) => s.whiteboardShape);
  const savedShapeKind = useUI((s) => s.whiteboardShapeKind);
  // a preference saved while triangles existed falls back to rectangles
  const shapeKind = SHAPES.some((s) => s.shape === savedShapeKind) ? savedShapeKind : "rect";
  const setToolStyle = useUI((s) => s.setWhiteboardStyle);
  const setToolFill = useUI((s) => s.setWhiteboardFill);
  const setShapeKind = useUI((s) => s.setWhiteboardShapeKind);
  const editObjects = useWhiteboards((s) => s.editObjects);
  const undo = useWhiteboards((s) => s.undo);
  const canUndo = useWhiteboards((s) => (s.history[board.id]?.length ?? 0) > 0);

  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [styleMenu, setStyleMenu] = useState<StyleMenuState | null>(null);
  const [view, setView] = useState<View>(HOME);
  // The real canvas size is measured before the first paint (see below).
  const [size, setSize] = useState<Size>({ w: SHEET.width + 2 * FIT_MARGIN, h: SHEET.height + 2 * FIT_MARGIN });
  /** live offset of the object being dragged; written to the store on release */
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  /** the stroke being drawn, in sheet pixels */
  const [stroke, setStroke] = useState<Point[] | null>(null);
  const [panning, setPanning] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  /** detaches the pointer gesture in progress */
  const stopGesture = useRef<(() => void) | null>(null);
  /** a note or text placed a moment ago: its first edits undo together with placing it */
  const freshId = useRef<string | null>(null);
  /** a press and hold on a styled tool's button; `fired` swallows the click that ends it */
  const hold = useRef<{ timer: number | null; fired: boolean }>({ timer: null, fired: false });

  const { k, left, top } = sheetLayout(view, size);
  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const selected = board.objects.find((o) => o.id === selectedId) ?? null;
  const moved = (o: WhiteboardObject): WhiteboardObject =>
    drag?.id === o.id ? { ...o, x: o.x + drag.dx, y: o.y + drag.dy } : o;

  useEffect(() => {
    const gesture = stopGesture;
    const press = hold;
    return () => {
      gesture.current?.();
      if (press.current.timer !== null) window.clearTimeout(press.current.timer);
    };
  }, []);

  /* ── gestures ──────────────────────────────────────────────────── */

  const track = (onMove: (e: PointerEvent) => void, onEnd: () => void) => {
    stopGesture.current?.();
    const end = () => {
      detach();
      onEnd();
    };
    const detach = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      stopGesture.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    stopGesture.current = detach;
  };

  /**
   * Canvas pointerdowns call preventDefault (no text selection, no focus
   * theft from a just-opened editor), so they never move focus on their own.
   * Blurring by hand is what commits an open text editor or rename field.
   */
  const releaseFocus = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) active.blur();
  };

  /** Maps client coordinates to sheet pixels for the gesture about to start. */
  const sheetPoint = () => {
    const r = sheetRef.current!.getBoundingClientRect();
    return (clientX: number, clientY: number): Point => [
      Math.round((clientX - r.left) / k),
      Math.round((clientY - r.top) / k),
    ];
  };

  const startPan = (e: React.PointerEvent) => {
    const origin = { px: e.clientX, py: e.clientY, x: view.x, y: view.y };
    setPanning(true);
    track(
      (ev) => setView((v) => ({ ...v, x: origin.x + ev.clientX - origin.px, y: origin.y + ev.clientY - origin.py })),
      () => setPanning(false),
    );
  };

  const startStroke = (e: React.PointerEvent) => {
    const at = sheetPoint();
    const style = penStyle;
    let points: Point[] = [at(e.clientX, e.clientY)];
    setStroke(points);
    track(
      (ev) => {
        const p = at(ev.clientX, ev.clientY);
        const last = points[points.length - 1];
        if (Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) < 3) return;
        points = [...points, p];
        setStroke(points);
      },
      () => {
        setStroke(null);
        if (points.length > 1) editObjects(board.id, (os) => [...os, inkFrom(points, style)]);
      },
    );
  };

  const startDrag = (e: React.PointerEvent, id: string) => {
    const origin = { px: e.clientX, py: e.clientY };
    let delta = { dx: 0, dy: 0 };
    let started = false;
    track(
      (ev) => {
        // a few pixels of slack, so a plain click never nudges the object
        if (!started && Math.abs(ev.clientX - origin.px) + Math.abs(ev.clientY - origin.py) < 3) return;
        started = true;
        delta = { dx: Math.round((ev.clientX - origin.px) / k), dy: Math.round((ev.clientY - origin.py) / k) };
        setDrag({ id, ...delta });
      },
      () => {
        setDrag(null);
        const { dx, dy } = delta;
        if (dx || dy) {
          editObjects(board.id, (os) => os.map((o) => (o.id === id ? { ...o, x: o.x + dx, y: o.y + dy } : o)));
        }
      },
    );
  };

  /* ── edits ─────────────────────────────────────────────────────── */

  const place = (clientX: number, clientY: number) => {
    const [x, y] = sheetPoint()(clientX, clientY);
    const obj = ((): WhiteboardObject | null => {
      switch (tool) {
        case "sticky":
          return {
            id: newId(),
            kind: "sticky",
            x: x - 145,
            y: y - 65,
            w: 290,
            h: 130,
            color: stickyColor,
            text: "",
            authorId: me.id,
            createdAt: new Date().toISOString(),
            rotation: Math.round((Math.random() * 2 - 1) * 10) / 10,
          };
        case "text":
          return { id: newId(), kind: "text", x: x - 5, y: y - 15, w: 400, weight: 400, text: "", ...textStyle };
        case "shape":
          return {
            id: newId(),
            kind: "shape",
            shape: shapeKind,
            x: x - 125,
            y: y - 88,
            w: 250,
            h: 175,
            color: shapeColor,
          };
        case "image":
          return { id: newId(), kind: "image", x: x - 150, y: y - 98, w: 300, h: 195, caption: "image placeholder" };
        default:
          return null;
      }
    })();
    if (!obj) return;

    editObjects(board.id, (os) => [...os, obj]);
    setSelectedId(obj.id);
    setTool("select");
    if (obj.kind === "sticky" || obj.kind === "text") {
      freshId.current = obj.id;
      setEditingId(obj.id);
    }
  };

  const commitText = (id: string, value: string) => {
    const fresh = freshId.current === id;
    if (fresh) freshId.current = null;
    setEditingId((cur) => (cur === id ? null : cur));

    const obj = useWhiteboards
      .getState()
      .boards.find((b) => b.id === board.id)
      ?.objects.find((o) => o.id === id);
    if (!obj) return;

    // An empty text object is nothing; a text placed and left empty never happened.
    if (obj.kind === "text" && !value.trim()) {
      if (fresh) undo(board.id);
      else editObjects(board.id, (os) => os.filter((o) => o.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
      return;
    }

    const current = obj.kind === "image" ? obj.caption : obj.kind === "sticky" || obj.kind === "text" ? obj.text : null;
    if (current === null || current === value) return;
    editObjects(
      board.id,
      (os) =>
        os.map((o) => {
          if (o.id !== id) return o;
          if (o.kind === "image") return { ...o, caption: value };
          if (o.kind === "sticky" || o.kind === "text") return { ...o, text: value };
          return o;
        }),
      { amend: fresh },
    );
  };

  const remove = (id: string) => {
    editObjects(board.id, (os) => os.filter((o) => o.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
    setEditingId((cur) => (cur === id ? null : cur));
    setStyleMenu((m) => (m?.kind === "object" && m.id === id ? null : m));
  };

  // Styling a note or text that is still being placed is part of placing it,
  // so undo takes them away together (and an empty text leaves nothing behind).
  const recolor = (id: string, color: WhiteboardColor) =>
    editObjects(
      board.id,
      (os) => os.map((o) => (o.id === id && (o.kind === "sticky" || o.kind === "shape") ? { ...o, color } : o)),
      { amend: freshId.current === id },
    );

  const reshape = (id: string, shape: ShapeKind) =>
    editObjects(board.id, (os) => os.map((o) => (o.id === id && o.kind === "shape" ? { ...o, shape } : o)));

  const restyle = (id: string, patch: Partial<InkStyle>) =>
    editObjects(
      board.id,
      (os) => os.map((o) => (o.id === id && (o.kind === "text" || o.kind === "ink") ? { ...o, ...patch } : o)),
      { amend: freshId.current === id },
    );

  const pickTool = (next: Tool) => {
    setTool(next);
    setSelectedId(null);
    setStyleMenu(null);
  };

  /** Picks a styled tool and opens its style menu above its toolbar button. */
  const openToolMenu = (next: StyledTool, button: HTMLElement) => {
    const r = button.getBoundingClientRect();
    pickTool(next);
    setStyleMenu({ kind: "tool", tool: next, at: { x: r.left + r.width / 2, y: r.top } });
  };

  const cancelHold = () => {
    if (hold.current.timer === null) return;
    window.clearTimeout(hold.current.timer);
    hold.current.timer = null;
  };

  const startHold = (e: React.PointerEvent<HTMLButtonElement>, next: StyledTool) => {
    if (e.button !== 0) return;
    const button = e.currentTarget;
    cancelHold();
    hold.current.fired = false;
    hold.current.timer = window.setTimeout(() => {
      hold.current = { timer: null, fired: true };
      openToolMenu(next, button);
    }, HOLD_MS);
  };

  const zoomStep = (dir: 1 | -1) => {
    const el = viewportRef.current;
    if (!el) return;
    const s = sizeOf(el);
    setView((v) => {
      const target =
        dir > 0
          ? Math.floor(v.zoom / ZOOM.step) * ZOOM.step + ZOOM.step
          : Math.ceil(v.zoom / ZOOM.step) * ZOOM.step - ZOOM.step;
      return zoomAround(v, target, s.w / 2, s.h / 2, s);
    });
  };

  const resetView = () => setView(HOME);

  /* ── input wiring ──────────────────────────────────────────────── */

  const onCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const pan = e.button === 1 || (e.button === 0 && tool === "hand");
    if (!pan && e.button !== 0) return;
    e.preventDefault();
    releaseFocus();
    if (pan) startPan(e);
    else if (tool === "pen") startStroke(e);
    else if (tool === "select") setSelectedId(null);
    else place(e.clientX, e.clientY);
  };

  const handlers: ObjectHandlers = {
    onPointerDown: (e, obj) => {
      // Every other tool acts on the sheet underneath: pan, draw or place.
      if (tool !== "select" || e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      releaseFocus();
      setSelectedId(obj.id);
      startDrag(e, obj.id);
    },
    onDoubleClick: (obj) => {
      if (tool !== "select" || !isEditable(obj)) return;
      setSelectedId(obj.id);
      setEditingId(obj.id);
    },
    // Right-clicking a note, shape, text or stroke selects it and opens its style menu at the pointer.
    onContextMenu: (e, obj) => {
      if (!OBJECT_MENU_LABEL[obj.kind]) return;
      e.preventDefault();
      releaseFocus();
      setTool("select");
      setSelectedId(obj.id);
      setStyleMenu({ kind: "object", id: obj.id, at: { x: e.clientX, y: e.clientY } });
    },
    onCommitText: commitText,
  };

  // 100% means "the sheet fits the canvas", so track the canvas size: the
  // board rescales with the window, the sidebar and the board list. Measured
  // before paint, so a board never flashes at the wrong size.
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () =>
      setSize((s) => {
        const next = sizeOf(el);
        return next.w === s.w && next.h === s.h ? s : next;
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Wheel pans; ⌘/Ctrl + wheel (and trackpad pinch) zooms around the pointer.
  // Attached by hand because React's wheel listener is passive.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      let dx = e.deltaX * unit;
      let dy = e.deltaY * unit;
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        const s = sizeOf(el);
        setView((v) => zoomAround(v, v.zoom * Math.exp(-dy * 0.01), e.clientX - r.left, e.clientY - r.top, s));
        return;
      }
      if (e.shiftKey && !dx) [dx, dy] = [dy, 0];
      setView((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onKey = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    onKey.current = (e) => {
      if (suspended || e.altKey || isTypingTarget(e.target)) return;
      const { commandOpen, createOpen } = useUI.getState();
      if (commandOpen || createOpen) return;
      // an open style menu closes itself on Escape, and that's all Escape does then
      if (styleMenu && e.key === "Escape") return;
      const key = e.key.toLowerCase();

      if (e.metaKey || e.ctrlKey) {
        if (key === "z" && !e.shiftKey && !drag && !stroke) {
          e.preventDefault();
          undo(board.id);
        }
        return;
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setTool("select");
        return;
      }
      if (selected && (e.key === "Backspace" || e.key === "Delete")) {
        e.preventDefault();
        remove(selected.id);
        return;
      }
      const onControl = e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement;
      if (selected && e.key === "Enter" && !onControl && isEditable(selected)) {
        e.preventDefault();
        setEditingId(selected.id);
        return;
      }
      // ⇧1 (fit) or ⇧0 (100%): the same view here. Matched on `code`, since
      // Shift turns the key into "!" / ")".
      if (e.shiftKey && (e.code === "Digit1" || e.code === "Digit0")) {
        e.preventDefault();
        resetView();
        return;
      }
      const next = !e.shiftKey && TOOLS.find((t) => t.key === key);
      if (next) {
        e.preventDefault();
        pickTool(next.id);
      }
    };
  });
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey.current(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  /* ── render ────────────────────────────────────────────────────── */

  const toolPicker = (t: StyledTool) =>
    t === "pen" || t === "text" ? (
      <InkStylePicker
        value={t === "pen" ? penStyle : textStyle}
        sizeName={SIZE_NAME[t]}
        onChange={(patch) => setToolStyle(t, patch)}
      />
    ) : t === "sticky" ? (
      <FillPicker value={stickyColor} options={STICKY_SWATCHES} onChange={(color) => setToolFill("sticky", color)} />
    ) : (
      <>
        <ShapePicker value={shapeKind} onChange={setShapeKind} />
        <div className="mx-1 h-4 w-px shrink-0 bg-border" />
        <FillPicker value={shapeColor} options={SHAPE_SWATCHES} onChange={(color) => setToolFill("shape", color)} />
      </>
    );

  const objectPicker = (o: WhiteboardObject) => {
    const ink = inkStyleOf(o);
    if (ink) {
      return (
        <InkStylePicker
          value={ink}
          sizeName={SIZE_NAME[o.kind === "ink" ? "pen" : "text"]}
          onChange={(patch) => restyle(o.id, patch)}
        />
      );
    }
    if (o.kind === "sticky") {
      return <FillPicker value={o.color} options={STICKY_SWATCHES} onChange={(color) => recolor(o.id, color)} />;
    }
    if (o.kind !== "shape") return null;
    return (
      <>
        <ShapePicker value={o.shape} onChange={(shape) => reshape(o.id, shape)} />
        <div className="mx-1 h-4 w-px shrink-0 bg-border" />
        <FillPicker value={o.color} options={SHAPE_SWATCHES} onChange={(color) => recolor(o.id, color)} />
      </>
    );
  };

  const barTarget = selected ? moved(selected) : null;
  const menuObject =
    styleMenu?.kind === "object" ? (board.objects.find((o) => o.id === styleMenu.id) ?? null) : null;

  return (
    <div ref={viewportRef} className="@container relative min-w-0 flex-1 overflow-hidden bg-surface-2">
      <div
        onPointerDown={onCanvasPointerDown}
        // the board has its own menus; the browser's would only get in the way
        onContextMenu={(e) => e.preventDefault()}
        className="absolute inset-0 touch-none select-none"
        style={{ cursor: panning ? "grabbing" : CURSOR[tool] }}
      >
        <div
          ref={sheetRef}
          data-wb-sheet=""
          className="absolute left-0 top-0 rounded-xl bg-surface shadow-[var(--shadow-lg)]"
          style={{
            width: SHEET.width,
            height: SHEET.height,
            transformOrigin: "0 0",
            transform: `translate(${Math.round(left)}px, ${Math.round(top)}px) scale(${k})`,
            backgroundImage: showGrid ? "radial-gradient(var(--surface-active) 1px, transparent 1px)" : undefined,
            backgroundSize: "22px 22px",
          }}
        >
          {board.objects.map((o) => (
            <BoardObject
              key={o.id}
              obj={moved(o)}
              selected={o.id === selectedId}
              editing={o.id === editingId}
              grabbable={tool === "select"}
              author={o.kind === "sticky" ? usersById.get(o.authorId) : undefined}
              handlers={handlers}
            />
          ))}

          {stroke && (
            <svg
              className="pointer-events-none absolute left-0 top-0 overflow-visible"
              width={SHEET.width}
              height={SHEET.height}
            >
              <path
                d={pathOf(stroke)}
                {...INK_LINE}
                stroke={INK[penStyle.color]}
                strokeWidth={INK_WIDTH[penStyle.size]}
              />
            </svg>
          )}

          {board.objects.length === 0 && !stroke && (
            <div className="pointer-events-none absolute left-0 top-[150px] flex w-[950px] flex-col gap-2 px-[60px]">
              <div className="text-[32px] font-semibold tracking-[-0.01em] text-text">Blank board</div>
              <div className="max-w-[480px] text-[19px] text-text-muted [text-wrap:pretty]">
                Pick the sticky or text tool below, then click anywhere. Everyone in {workspaceName} sees this
                board live.
              </div>
            </div>
          )}
        </div>
      </div>

      {barTarget && (
        <div
          role="toolbar"
          aria-label="Selection"
          className="anim-scale-in absolute z-[6] flex items-center rounded-lg border border-border bg-surface p-1 shadow-[var(--shadow-md)]"
          style={{
            left: Math.round(left + barTarget.x * k) + 4,
            top: Math.max(8, Math.round(top + barTarget.y * k) - 44),
          }}
        >
          <Tooltip content="Delete" shortcut="⌫">
            <button
              onClick={() => remove(barTarget.id)}
              aria-label="Delete"
              className="flex h-6 w-6 items-center justify-center rounded-[5px] text-danger transition-colors hover:bg-danger-soft"
            >
              <Trash2 size={14} />
            </button>
          </Tooltip>
        </div>
      )}

      {styleMenu?.kind === "tool" && (
        <StyleMenu
          at={styleMenu.at}
          placement="top"
          label={TOOL_MENU_LABEL[styleMenu.tool]}
          onClose={() => setStyleMenu(null)}
        >
          {toolPicker(styleMenu.tool)}
        </StyleMenu>
      )}

      {styleMenu?.kind === "object" && menuObject && (
        <StyleMenu
          at={styleMenu.at}
          placement="bottom-start"
          label={OBJECT_MENU_LABEL[menuObject.kind] ?? "Style"}
          onClose={() => setStyleMenu(null)}
        >
          {objectPicker(menuObject)}
        </StyleMenu>
      )}

      <div
        role="toolbar"
        aria-label="Tools"
        className="absolute bottom-[18px] left-1/2 z-[7] flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-[10px] border border-border bg-surface p-[5px] shadow-[var(--shadow-lg)]"
      >
        {TOOLS.map((t) => {
          const id = t.id;
          const styled = isStyledTool(id) ? id : null;
          // the Shape button shows the shape it will draw
          const Icon = id === "shape" ? (SHAPES.find((s) => s.shape === shapeKind)?.icon ?? t.icon) : t.icon;
          return (
            <Tooltip
              key={id}
              content={
                styled ? (
                  <span>
                    {t.label} <span className="font-normal opacity-70">· right-click or hold for style</span>
                  </span>
                ) : (
                  t.label
                )
              }
              shortcut={t.key.toUpperCase()}
            >
              <button
                onClick={(e) => {
                  // the release that ends a press and hold already opened the menu
                  if (hold.current.fired && e.detail > 0) {
                    hold.current.fired = false;
                    return;
                  }
                  pickTool(id);
                }}
                onPointerDown={styled ? (e) => startHold(e, styled) : undefined}
                onPointerUp={styled ? cancelHold : undefined}
                onPointerLeave={styled ? cancelHold : undefined}
                onPointerCancel={styled ? cancelHold : undefined}
                onContextMenu={
                  styled
                    ? (e) => {
                        e.preventDefault();
                        cancelHold();
                        openToolMenu(styled, e.currentTarget);
                      }
                    : undefined
                }
                aria-label={t.label}
                aria-pressed={tool === id}
                aria-haspopup={styled ? "true" : undefined}
                className={cn(
                  "relative flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-[7px] transition-colors [-webkit-touch-callout:none]",
                  tool === id ? "bg-primary text-primary-fg" : "text-text-muted hover:bg-surface-2 hover:text-text",
                )}
              >
                <Icon size={17} />
                {styled && (
                  // corner mark: this tool has more options
                  <span
                    aria-hidden
                    className="absolute bottom-[3px] right-[3px] border-b-[4px] border-l-[4px] border-b-current border-l-transparent opacity-60"
                  />
                )}
              </button>
            </Tooltip>
          );
        })}
        <div className="mx-1 h-[18px] w-px shrink-0 bg-border" />
        <Tooltip content="Undo" shortcut={isMac() ? "⌘Z" : "Ctrl+Z"}>
          <button
            onClick={() => undo(board.id)}
            disabled={!canUndo}
            aria-label="Undo"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-40"
          >
            <Undo2 size={16} />
          </button>
        </Tooltip>
      </div>

      <div className="absolute bottom-[18px] right-4 z-[7] flex items-center gap-0.5 rounded-lg border border-border bg-surface p-[3px] shadow-[var(--shadow-md)] @max-xl:bottom-auto @max-xl:top-3">
        <button
          onClick={() => zoomStep(-1)}
          aria-label="Zoom out"
          className="flex h-6 w-6 items-center justify-center rounded-[5px] text-text-muted transition-colors hover:bg-surface-2"
        >
          <Minus size={14} />
        </button>
        <Tooltip content="Fit to window" shortcut="⇧1">
          <button
            onClick={resetView}
            className="h-6 rounded-[5px] px-1.5 font-mono text-[11px] text-text-muted transition-colors hover:bg-surface-2"
          >
            {Math.round(view.zoom)}%
          </button>
        </Tooltip>
        <button
          onClick={() => zoomStep(1)}
          aria-label="Zoom in"
          className="flex h-6 w-6 items-center justify-center rounded-[5px] text-text-muted transition-colors hover:bg-surface-2"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
