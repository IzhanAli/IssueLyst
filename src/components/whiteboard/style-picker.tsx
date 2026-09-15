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
  onPick,
}: {
  fill: string;
  label: string;
  pressed: boolean;
  onPick: () => void;
}) {
  return (
    <button
      onClick={() => !pressed && onPick()}
      aria-label={`Color ${label}`}
      aria-pressed={pressed}
      className={cn(
        "h-5 w-5 shrink-0 rounded-full border border-border-strong transition-shadow",
        pressed && "shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--primary)]",
      )}
      style={{ background: fill }}
    />
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
      <div className="mx-1 h-4 w-px shrink-0 bg-border" />
      <div role="group" aria-label={sizeName} className="flex items-center gap-0.5">
        {SIZES.map((s) => (
          <button
            key={s.size}
            onClick={() => s.size !== value.size && onChange({ size: s.size })}
            aria-label={`${sizeName} ${s.name}`}
            aria-pressed={value.size === s.size}
            className={cn(
              "flex h-6 min-w-6 items-center justify-center rounded-[5px] px-1 font-mono text-[11px] font-medium transition-colors",
              value.size === s.size ? "bg-surface-active text-text" : "text-text-muted hover:bg-surface-2 hover:text-text",
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
            "flex h-6 w-6 items-center justify-center rounded-[5px] transition-colors",
            value === s.shape ? "bg-surface-active text-text" : "text-text-muted hover:bg-surface-2 hover:text-text",
          )}
        >
          <s.icon size={14} />
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
        className="anim-scale-in z-[180] flex items-center gap-1 rounded-lg border border-border bg-surface p-1 shadow-[var(--shadow-lg)]"
      >
        {children}
      </div>
    </FloatingPortal>
  );
}
