import { defineConfig } from "drizzle-kit";
import { loadEnvLocal } from "./scripts/env.mjs";

loadEnvLocal();

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  // Neon pools connections itself; keep the generated SQL readable.
  verbose: true,
  strict: true,
});
