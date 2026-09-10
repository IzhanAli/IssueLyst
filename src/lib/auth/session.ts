import { useEffect, useState } from "react";
import { useStore } from "@/lib/store/store";

const SESSION_KEY = "issuelyst.session.v1";

/**
 * Prototype auth: a client-held session pointing at a seeded user id.
 * The shape (a single subject id + gate) is intentionally close to a real
 * cookie-backed session so it can be swapped for Neon-backed auth later.
 */
export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function signIn(userId: string) {
  try {
    localStorage.setItem(SESSION_KEY, userId);
    document.cookie = `${SESSION_KEY}=${userId}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  } catch {}
  useStore.getState().setCurrentUser(userId);
}

export function signOut() {
  try {
    localStorage.removeItem(SESSION_KEY);
    document.cookie = `${SESSION_KEY}=; path=/; max-age=0`;
  } catch {}
}

/** Reactive session state. `loading` is true until read on the client. */
export function useSession() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUserId(getSession());
    setLoading(false);
    const onStorage = () => setUserId(getSession());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { userId, loading, isAuthed: !!userId };
}
