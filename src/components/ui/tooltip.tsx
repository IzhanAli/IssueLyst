"use client";

import { cloneElement, isValidElement, useState } from "react";
import {
  useFloating,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  useMergeRefs,
  safePolygon,
} from "@floating-ui/react";
import { Kbd } from "./kbd";

export function Tooltip({
  content,
  shortcut,
  children,
  placement = "top",
  delay = 350,
}: {
  content: React.ReactNode;
  shortcut?: string;
  children: React.ReactElement;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
}) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
  });

  const hover = useHover(context, { delay: { open: delay, close: 0 }, handleClose: safePolygon() });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  const ref = useMergeRefs([refs.setReference, (children as { ref?: React.Ref<unknown> }).ref]);

  if (!isValidElement(children)) return children;

  return (
    <>
      {cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        ref,
        ...getReferenceProps(),
      })}
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="anim-in z-[190] flex items-center gap-1.5 rounded-md border border-border-strong bg-text px-2 py-1 text-[11.5px] font-medium text-text-invert shadow-[var(--shadow-md)]"
          >
            {content}
            {shortcut && (
              <span className="ml-0.5 opacity-80">
                <Kbd className="border-transparent bg-white/15 text-text-invert shadow-none">{shortcut}</Kbd>
              </span>
            )}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
