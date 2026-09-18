/**
 * Neon connection, server-side only.
 *
 * `DATABASE_URL` deliberately has no VITE_ prefix, so Vite never inlines it
 * and this module is only ever reachable from a server function handler. The
 * window check makes a bundling mistake fail loudly instead of shipping a
 * connection string to the browser.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

let cached: Database | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function db(): Database {
  if (typeof window !== "undefined") {
    throw new Error("src/lib/db/client.ts was imported into the browser bundle");
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  cached ??= drizzle(neon(url), { schema });
  return cached;
}
