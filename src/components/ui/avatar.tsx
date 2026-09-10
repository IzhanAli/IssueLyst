import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/format";
import type { User } from "@/lib/types";

const sizes = {
  xs: "h-4 w-4 text-[8px]",
  sm: "h-5 w-5 text-[9px]",
  md: "h-6 w-6 text-[10px]",
  lg: "h-8 w-8 text-[12px]",
  xl: "h-10 w-10 text-[14px]",
} as const;

export function Avatar({
  user,
  size = "md",
  className,
  ring,
}: {
  user: Pick<User, "name" | "color" | "avatarUrl">;
  size?: keyof typeof sizes;
  className?: string;
  ring?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-mono font-medium uppercase leading-none text-white",
        sizes[size],
        ring && "ring-2 ring-surface",
        className,
      )}
      style={{ backgroundColor: user.color }}
      title={user.name}
      aria-label={user.name}
    >
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover" />
      ) : (
        initials(user.name)
      )}
    </span>
  );
}

/** Faint dashed placeholder for an unassigned slot. */
export function AvatarEmpty({ size = "md", className }: { size?: keyof typeof sizes; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-border-strong text-text-subtle",
        sizes[size],
        className,
      )}
      aria-label="Unassigned"
    >
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
