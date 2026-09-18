/**
 * Minimal .env.local reader for the CLI tools.
 *
 * Vite loads .env.local for the app, but drizzle-kit and the seed script run
 * outside Vite. Rather than add a dotenv dependency for ten lines, parse the
 * file directly. Values already present in the environment win, so CI can
 * override without editing the file.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadEnvLocal(file = ".env.local") {
  let raw;
  try {
    raw = readFileSync(resolve(process.cwd(), file), "utf8");
  } catch {
    return; // no .env.local is fine — the env may be set another way
  }
  for (const line of raw.split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i.exec(line);
    if (!m) continue;
    const [, key, value] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = value.replace(/^["']|["']$/g, "");
  }
}
