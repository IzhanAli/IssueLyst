"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4600);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (message: string, action?: Toast["action"]) => useToastStore.getState().push({ kind: "success", message, action }),
  error: (message: string, action?: Toast["action"]) => useToastStore.getState().push({ kind: "error", message, action }),
  info: (message: string, action?: Toast["action"]) => useToastStore.getState().push({ kind: "info", message, action }),
};

const icons = {
  success: <CheckCircle2 size={16} className="text-success" />,
  error: <AlertCircle size={16} className="text-danger" />,
  info: <Info size={16} className="text-info" />,
};

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastRow({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {}, []);
  return (
    <div
      role="status"
      className={cn(
        "anim-scale-in pointer-events-auto flex items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-2.5 shadow-[var(--shadow-lg)]",
        "min-w-[280px] max-w-[420px]",
      )}
    >
      {icons[t.kind]}
      <span className="flex-1 text-[13px] text-text">{t.message}</span>
      {t.action && (
        <button
          onClick={() => {
            t.action!.onClick();
            onDismiss();
          }}
          className="rounded px-1.5 py-0.5 text-[12px] font-medium text-primary hover:bg-primary-soft"
        >
          {t.action.label}
        </button>
      )}
      <button onClick={onDismiss} className="rounded p-0.5 text-text-subtle hover:text-text" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
