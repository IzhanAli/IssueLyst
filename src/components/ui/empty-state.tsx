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
        <div className="anim-pop mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary text-primary-fg">
          {icon}
        </div>
      )}
      <h3 className="font-display text-[19px] font-bold tracking-[-0.02em] text-text">{title}</h3>
      {description && <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
