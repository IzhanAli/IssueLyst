"use client";

import {
  cloneElement,
  isValidElement,
  useMemo,
  useState,
} from "react";
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
  useMergeRefs,
  type Placement,
} from "@floating-ui/react";
import { cn } from "@/lib/utils/cn";

export function Popover({
  children,
  render,
  placement = "bottom-start",
  open: controlledOpen,
  onOpenChange,
  className,
  matchWidth,
}: {
  children: React.ReactElement;
  render: (args: { close: () => void }) => React.ReactNode;
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  className?: string;
  matchWidth?: boolean;
}) {
  const [uncontrolled, setUncontrolled] = useState(false);
  const open = controlledOpen ?? uncontrolled;
  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    if (controlledOpen === undefined) setUncontrolled(v);
  };

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({ padding: 10 }),
      shift({ padding: 10 }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const role = useRole(context, { role: "menu" });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  const ref = useMergeRefs([refs.setReference, (children as { ref?: React.Ref<unknown> }).ref]);
  const close = useMemo(() => () => setOpen(false), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isValidElement(children)) return children;

  const childProps = (children as React.ReactElement<Record<string, unknown>>).props;

  return (
    <>
      {cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        ref,
        "data-state": open ? "open" : "closed",
        // pass the child's own props (onClick etc.) so Floating UI merges
        // them with its handlers instead of clobbering them
        ...getReferenceProps(childProps),
      })}
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} initialFocus={-1}>
            <div
              ref={refs.setFloating}
              style={{
                ...floatingStyles,
                ...(matchWidth
                  ? { minWidth: (refs.reference.current as HTMLElement)?.offsetWidth }
                  : {}),
              }}
              // React portals bubble events through the component tree, not the
              // DOM: without this, clicking a picker option inside a row or a
              // board card also fired that row's onClick (opening the drawer)
              // and could hand a pointerdown to the card's drag sensor.
              {...getFloatingProps({
                onClick: (e) => e.stopPropagation(),
                onMouseDown: (e) => e.stopPropagation(),
                onPointerDown: (e) => e.stopPropagation(),
              })}
              className={cn(
                // Layer order: drawer 120 · modal 170 · popover 180 · tooltip 190 · toast 200.
                // Popovers must sit above a modal: pickers inside the create-issue
                // modal are opened from it, and anything below its overlay would
                // swallow the click and dismiss the modal instead.
                "anim-scale-in z-[180] overflow-hidden rounded-lg border border-border-strong bg-surface shadow-[var(--shadow-lg)]",
                className,
              )}
            >
              {render({ close })}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
