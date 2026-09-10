import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex max-w-sm flex-col items-center px-6 py-16 text-center", className)}>
      {icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-2 text-text-subtle">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-[16px] font-semibold text-text">{title}</h3>
      {description && <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
