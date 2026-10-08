import { useLayoutEffect } from "react";
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  type Placement,
} from "@floating-ui/react";
import { Circle, Square } from "lucide-react";
import type { InkStyle, ShapeKind, WhiteboardColor } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { FILL, INK, INK_SWATCHES, SIZES } from "./constants";

function Swatch({
  fill,
  label,
  pressed,
  empty = false,
  onPick,
}: {
  fill: string;
  label: string;
  pressed: boolean;
  /** no fill at all: a blank chip struck through, like a fill picker's "none" anywhere */
  empty?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      onClick={() => !pressed && onPick()}
      aria-label={`Color ${label}`}
      aria-pressed={pressed}
      className={cn(
        "relative h-[22px] w-[22px] shrink-0 overflow-hidden rounded-[7px] shadow-[inset_0_0_0_1px_var(--border-strong)] transition-[box-shadow,transform] duration-150 hover:scale-110 active:scale-95",
        pressed && "shadow-[inset_0_0_0_1px_var(--border-strong),0_0_0_2px_var(--surface),0_0_0_4px_var(--accent)]",
      )}
      style={{ background: empty ? "var(--surface)" : fill }}
    >
      {empty && (
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[2px] w-[28px] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-text-subtle"
        />
      )}
    </button>
  );
}

/**
 * Colour swatches and S / M / L for text and pen strokes. Drives both a
 * tool's defaults and the style of an object on the board.
 */
export function InkStylePicker({
  value,
  onChange,
  sizeName,
}: {
  value: InkStyle;
  onChange: (patch: Partial<InkStyle>) => void;
  /** what S / M / L means here, e.g. "Font size" or "Stroke" */
  sizeName: string;
}) {
  return (
    <>
      {INK_SWATCHES.map((s) => (
        <Swatch
          key={s.color}
          fill={INK[s.color]}
          label={s.label}
          pressed={value.color === s.color}
          onPick={() => onChange({ color: s.color })}
        />
      ))}
      <div className="mx-1 h-5 w-px shrink-0 bg-border" />
      <div role="group" aria-label={sizeName} className="flex items-center gap-0.5">
        {SIZES.map((s) => (
          <button
            key={s.size}
            onClick={() => s.size !== value.size && onChange({ size: s.size })}
            aria-label={`${sizeName} ${s.name}`}
            aria-pressed={value.size === s.size}
            className={cn(
              "flex h-7 min-w-7 items-center justify-center rounded-[8px] px-1 font-display text-[12px] font-bold transition-colors",
              value.size === s.size ? "bg-primary text-primary-fg" : "text-text-muted hover:bg-surface-2 hover:text-text",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </>
  );
}

/** Fill swatches for sticky notes and shapes. */
export function FillPicker({
  value,
  options,
  onChange,
}: {
  value: WhiteboardColor;
  options: { color: WhiteboardColor; label: string }[];
  onChange: (color: WhiteboardColor) => void;
}) {
  return (
    <>
      {options.map((s) => (
        <Swatch
          key={s.color}
          fill={FILL[s.color]}
          label={s.label}
          pressed={value === s.color}
          empty={s.color === "none"}
          onPick={() => onChange(s.color)}
        />
      ))}
    </>
  );
}

/** The Shape tool's shapes, in picker order. */
export const SHAPES: { shape: ShapeKind; label: string; icon: typeof Square }[] = [
  { shape: "rect", label: "Rectangle", icon: Square },
  { shape: "ellipse", label: "Ellipse", icon: Circle },
];

export function ShapePicker({ value, onChange }: { value: ShapeKind; onChange: (shape: ShapeKind) => void }) {
  return (
    <div role="group" aria-label="Shape" className="flex items-center gap-0.5">
      {SHAPES.map((s) => (
        <button
          key={s.shape}
          onClick={() => s.shape !== value && onChange(s.shape)}
          aria-label={`Shape ${s.label}`}
          aria-pressed={value === s.shape}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[8px] transition-colors",
            value === s.shape ? "bg-primary text-primary-fg" : "text-text-muted hover:bg-surface-2 hover:text-text",
          )}
        >
          <s.icon size={15} strokeWidth={2.25} />
        </button>
      ))}
    </div>
  );
}

/**
 * A picker as a menu hanging from a point on screen: above a toolbar button,
 * or at the pointer for a right-clicked object. Escape or a press outside
 * closes it; picking leaves it open, so colour and size can both change.
 */
export function StyleMenu({
  at,
  placement,
  label,
  onClose,
  children,
}: {
  /** client coordinates the menu hangs from */
  at: { x: number; y: number };
  placement: Placement;
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { refs, floatingStyles, context } = useFloating({
    open: true,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
    placement,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  useLayoutEffect(() => {
    const { x, y } = at;
    refs.setPositionReference({
      getBoundingClientRect: () => ({ x, y, left: x, top: y, right: x, bottom: y, width: 0, height: 0 }),
    });
  }, [refs, at]);

  const { getFloatingProps } = useInteractions([useDismiss(context)]);

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        role="toolbar"
        aria-label={label}
        style={floatingStyles}
        {...getFloatingProps({ onContextMenu: (e) => e.preventDefault() })}
        className="anim-scale-in z-[180] flex items-center gap-1.5 rounded-[14px] border border-border bg-surface p-1.5 shadow-[var(--shadow-lg)]"
      >
        {children}
      </div>
    </FloatingPortal>
  );
}
