/**
 * Zustand `persist` storage backed by Neon, with localStorage as the fallback.
 *
 * The store keeps its synchronous, optimistic actions exactly as they were —
 * only where the state lands changes. On boot we ask the server for a
 * snapshot; if DATABASE_URL is unset (or the call fails) we stay on
 * localStorage and the app behaves as it always has.
 *
 * Writes are debounced and diffed. immer hands every action a fresh reference
 * for the slices it touched and the identical reference for the ones it
 * didn't, so a reference comparison per slice is an exact "what changed"
 * signal — editing one title sends the issues slice, not the whole dataset.
 *
 * Caveat worth stating: this is last-write-wins for a single session. Two
 * browsers editing at once will clobber each other. Per-action mutations are
 * the fix, and they want auth first.
 */

import { createJSONStorage } from "zustand/middleware";
import type { PersistStorage, StorageValue } from "zustand/middleware";
import type { Snapshot } from "@/lib/db/repository";
import { fetchSnapshot, pushSlices } from "@/lib/db/server";

/** Bump together with the `version` passed to persist(). */
export const PERSIST_VERSION = 4;

/** The partialized store: the database snapshot plus session-only state. */
export type Persisted = Snapshot & { currentUserId: string };

/** Slices that map to tables. `nextIssueNumber` is derived on read, not stored. */
const DB_SLICES = [
  "workspace", "project", "users", "statuses", "labels", "fieldDefs",
  "issues", "comments", "attachments", "activities", "notifications",
] as const satisfies readonly (keyof Snapshot)[];

const DEBOUNCE_MS = 700;

type Mode = "unknown" | "db" | "local";
let mode: Mode = "unknown";

/** Last state successfully written, per slice — the diff baseline. */
const lastSent: Partial<Snapshot> = {};
let pending: Partial<Snapshot> = {};
let timer: ReturnType<typeof setTimeout> | null = null;

/* ── localStorage fallback ───────────────────────────────────────── */

function readLocal(name: string): StorageValue<Persisted> | null {
  try {
    const raw = localStorage.getItem(name);
    return raw ? (JSON.parse(raw) as StorageValue<Persisted>) : null;
  } catch {
    return null;
  }
}

function writeLocal(name: string, value: StorageValue<Persisted>): void {
  try {
    localStorage.setItem(name, JSON.stringify(value));
  } catch {
    /* quota or private mode — the app still works, it just won't persist */
  }
}

/**
 * Who is signed in stays on the device even in database mode: it is session
 * state, not data, and the prototype has no server session to read it from.
 */
const sessionKey = (name: string) => `${name}.session`;

function readSessionUser(name: string): string | null {
  try {
    return localStorage.getItem(sessionKey(name));
  } catch {
    return null;
  }
}

function writeSessionUser(name: string, userId: string): void {
  try {
    localStorage.setItem(sessionKey(name), userId);
  } catch {
    /* ignore */
  }
}

/* ── Write-through ───────────────────────────────────────────────── */

async function flush(): Promise<void> {
  timer = null;
  const payload = pending;
  pending = {};
  if (!Object.keys(payload).length) return;

  try {
    await pushSlices({ data: payload });
    Object.assign(lastSent, payload);
  } catch (e) {
    // Put the work back in front of anything queued since, so the next
    // change retries it rather than silently dropping the edit.
    pending = { ...payload, ...pending };
    console.error("[neon] save failed, will retry on next change", e);
  }
}

function schedule(): void {
  if (timer !== null) clearTimeout(timer);
  timer = setTimeout(() => void flush(), DEBOUNCE_MS);
}

/**
 * Registered only once the adapter knows it is talking to a database: a
 * debounced write must not die with the tab, but there is nothing to flush
 * when persistence is local and synchronous.
 */
let flushOnExitBound = false;
function bindFlushOnExit(): void {
  if (flushOnExitBound || typeof window === "undefined") return;
  flushOnExitBound = true;
  window.addEventListener("pagehide", () => void flush());
}

/* ── The adapter ─────────────────────────────────────────────────── */

const neonStorage: PersistStorage<Persisted> = {
  async getItem(name) {
    if (typeof window === "undefined") return null;

    let result;
    try {
      result = await fetchSnapshot();
    } catch (e) {
      console.warn("[neon] snapshot unavailable, using localStorage", e);
      mode = "local";
      return readLocal(name);
    }

    if (!result.configured) {
      mode = "local";
      return readLocal(name);
    }

    mode = "db";
    bindFlushOnExit();
    // An empty database is not an error: the app runs on its seed until the
    // first edit, which writes every slice through.
    if (!result.snapshot) return null;

    for (const key of DB_SLICES) lastSent[key] = result.snapshot[key] as never;

    const currentUserId = readSessionUser(name);
    const state = { ...result.snapshot, currentUserId: currentUserId ?? "" } as Persisted;
    if (!currentUserId) delete (state as Partial<Persisted>).currentUserId;

    return { state, version: PERSIST_VERSION };
  },

  setItem(name, value) {
    if (typeof window === "undefined") return;
    if (mode !== "db") {
      writeLocal(name, value);
      return;
    }

    writeSessionUser(name, value.state.currentUserId);
    for (const key of DB_SLICES) {
      if (value.state[key] !== lastSent[key]) pending[key] = value.state[key] as never;
    }
    if (Object.keys(pending).length) schedule();
  },

  removeItem(name) {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(name);
      // Deliberately does not drop the database. Clearing local state should
      // not be a data-destroying act; `npm run db:seed` resets the server.
      localStorage.removeItem(sessionKey(name));
    } catch {
      /* ignore */
    }
  },
};

/**
 * What the store actually persists through.
 *
 * With no database configured this is plain synchronous localStorage — the
 * behaviour the app has always had, with no server round-trip on boot. The
 * async Neon adapter is only reached when there is something to reach.
 */
export const persistStorage: PersistStorage<Persisted> = __DB_CONFIGURED__
  ? neonStorage
  : (createJSONStorage(() => localStorage) as PersistStorage<Persisted>);
