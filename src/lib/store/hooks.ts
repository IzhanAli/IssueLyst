"use client";

import { useEffect, useState } from "react";
import { useStore } from "./store";

/** True once the persisted store has rehydrated on the client. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    if (useStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}

export function useCurrentUser() {
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  return users.find((u) => u.id === currentUserId) ?? users[0];
}

export function useUnreadCount(): number {
  return useStore((s) => {
    const uid = s.currentUserId;
    return s.notifications.filter((n) => n.userId === uid && !n.readAt).length;
  });
}

/** Prototype presence: the acting user plus a fixed set of "online" teammates. */
const ONLINE_TEAMMATES = new Set(["u_ahmed", "u_priya", "u_yuki", "u_lena"]);

export function useOnlineUsers() {
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  return users.filter((u) => u.id === currentUserId || ONLINE_TEAMMATES.has(u.id));
}
