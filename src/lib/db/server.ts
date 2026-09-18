/**
 * Server functions in front of the repository — the only way the browser
 * reaches Postgres.
 *
 * The repository is pulled in with `await import` inside each handler rather
 * than at the top of the file. Start already strips handler bodies from the
 * client build, but a dynamic import makes it structurally impossible for the
 * Neon driver or a connection string to follow them there.
 */

import { createServerFn } from "@tanstack/react-start";
import type { Snapshot } from "./repository";

export interface SnapshotResult {
  /** False when DATABASE_URL is unset — the client then stays on localStorage. */
  configured: boolean;
  /** Null when the database is reachable but empty (not yet seeded). */
  snapshot: Snapshot | null;
}

export const fetchSnapshot = createServerFn({ method: "GET" }).handler(async (): Promise<SnapshotResult> => {
  const { isDatabaseConfigured } = await import("./client");
  if (!isDatabaseConfigured()) return { configured: false, snapshot: null };

  const { loadSnapshot } = await import("./repository");
  return { configured: true, snapshot: await loadSnapshot() };
});

export const pushSlices = createServerFn({ method: "POST" })
  .validator((slices: Partial<Snapshot>) => slices)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { isDatabaseConfigured } = await import("./client");
    if (!isDatabaseConfigured()) return { ok: false };

    const { saveSlices } = await import("./repository");
    await saveSlices(data);
    return { ok: true };
  });
