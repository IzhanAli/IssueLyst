"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const [switching, setSwitching] = useState(false);

  if (!user) return null;

  if (switching) {
    return (
      <div className="max-h-[320px] overflow-y-auto p-1">
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-subtle">Act as</div>
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => {
              signIn(u.id);
              setCurrentUser(u.id);
              onNavigate();
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-surface-hover"
          >
            <Avatar user={u} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{u.name}</span>
              <span className="block truncate font-mono text-[10.5px] text-text-subtle">{u.role}</span>
            </span>
            {u.id === user.id && <Check size={15} className="text-primary" />}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="p-1">
      <div className="flex items-center gap-2.5 px-2 py-2">
        <Avatar user={user} size="lg" />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium">{user.name}</div>
          <div className="truncate font-mono text-[10.5px] text-text-subtle">{user.email}</div>
        </div>
      </div>
      <div className="my-1 h-px bg-border" />

      <Row icon={<Repeat size={15} />} onClick={() => setSwitching(true)}>
        Switch user
        <span className="ml-auto rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[9.5px] text-text-subtle">demo</span>
      </Row>
      <Row icon={theme === "dark" ? <Sun size={15} /> : <Moon size={15} />} onClick={onToggleTheme}>
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </Row>
      <Row icon={<UserCog size={15} />} onClick={() => { onNavigate(); router.push("/app/settings"); }}>
        Settings
      </Row>
      <div className="my-1 h-px bg-border" />
      <Row
        icon={<LogOut size={15} />}
        danger
        onClick={() => {
          onSignOut();
          onNavigate();
          router.replace("/login");
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
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-surface-hover",
        danger ? "text-danger hover:bg-danger-soft" : "text-text",
      )}
    >
      <span className={cn(danger ? "text-danger" : "text-text-muted")}>{icon}</span>
      {children}
    </button>
  );
}
