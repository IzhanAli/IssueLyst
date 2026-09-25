import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sun, Moon, LogOut, Repeat, Check, UserCog } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useCurrentUser } from "@/lib/store/hooks";
import { useStore } from "@/lib/store/store";
import { signIn } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

export function UserMenu({
  onNavigate,
  theme,
  onToggleTheme,
  onSignOut,
}: {
  onNavigate: () => void;
  theme: string;
  onToggleTheme: () => void;
  onSignOut: () => void;
}) {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const [switching, setSwitching] = useState(false);

  if (!user) return null;

  if (switching) {
    return (
      <div className="max-h-[340px] overflow-y-auto p-1.5">
        <div className="px-2.5 pb-1 pt-1.5 font-display text-[12.5px] font-semibold text-text-subtle">Act as</div>
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => {
              signIn(u.id);
              setCurrentUser(u.id);
              onNavigate();
            }}
            className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-left transition-colors hover:bg-surface-2"
          >
            <Avatar user={u} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[13.5px] font-semibold tracking-[-0.01em]">{u.name}</span>
              <span className="block truncate text-[12px] capitalize text-text-subtle">{u.role}</span>
            </span>
            {u.id === user.id && <Check size={16} strokeWidth={2.5} className="text-accent" />}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="p-1.5">
      <div className="flex items-center gap-3 px-2 py-2">
        <Avatar user={user} size="xl" />
        <div className="min-w-0">
          <div className="truncate font-display text-[15px] font-bold tracking-[-0.015em]">{user.name}</div>
          <div className="truncate text-[12.5px] text-text-subtle">{user.email}</div>
        </div>
      </div>
      <div className="mx-2 my-1 h-px bg-border" />

      <Row icon={<Repeat size={16} strokeWidth={2.25} />} onClick={() => setSwitching(true)}>
        Switch user
        <span className="ml-auto rounded-[5px] bg-surface-2 px-1.5 py-0.5 font-display text-[11px] font-semibold text-text-subtle">demo</span>
      </Row>
      <Row icon={theme === "dark" ? <Sun size={16} strokeWidth={2.25} /> : <Moon size={16} strokeWidth={2.25} />} onClick={onToggleTheme}>
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </Row>
      <Row icon={<UserCog size={16} strokeWidth={2.25} />} onClick={() => { onNavigate(); navigate({ to: "/app/settings" }); }}>
        Settings
      </Row>
      <div className="mx-2 my-1 h-px bg-border" />
      <Row
        icon={<LogOut size={16} strokeWidth={2.25} />}
        danger
        onClick={() => {
          onSignOut();
          onNavigate();
          navigate({ to: "/login", replace: true });
        }}
      >
        Sign out
      </Row>
    </div>
  );
}

function Row({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-[7px] text-left font-display text-[13.5px] font-medium transition-colors",
        danger ? "text-danger hover:bg-danger-soft" : "text-text hover:bg-surface-2",
      )}
    >
      <span className={cn(danger ? "text-danger" : "text-text-muted")}>{icon}</span>
      {children}
    </button>
  );
}
