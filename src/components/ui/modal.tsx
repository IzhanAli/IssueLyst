import {
  useFloating,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingOverlay,
  FloatingFocusManager,
} from "@floating-ui/react";
import { cn } from "@/lib/utils/cn";

export function Modal({
  open,
  onClose,
  children,
  className,
  align = "center",
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  align?: "center" | "top";
  labelledBy?: string;
}) {
  const { refs, context } = useFloating({ open, onOpenChange: (v) => !v && onClose() });
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const role = useRole(context);
  const { getFloatingProps } = useInteractions([dismiss, role]);

  if (!open) return null;

  return (
    <FloatingPortal>
      <FloatingOverlay
        lockScroll
        className={cn(
          "z-[170] bg-[rgb(10_12_20_/_0.40)] backdrop-blur-[1.5px]",
          "flex justify-center px-4",
          align === "center" ? "items-center py-4" : "items-start pt-[12vh] pb-4",
        )}
        style={{ animation: "fade-in 140ms ease-out" }}
      >
        <FloatingFocusManager context={context} modal returnFocus>
          <div
            ref={refs.setFloating}
            aria-labelledby={labelledBy}
            {...getFloatingProps()}
            className={cn(
              "anim-scale-in w-full overflow-hidden rounded-xl border border-border-strong bg-surface shadow-[var(--shadow-lg)]",
              className,
            )}
          >
            {children}
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
}
