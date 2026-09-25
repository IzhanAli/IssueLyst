/**
 * Puts the *scaffolding* into Neon without the demo content.
 *
 *   npm run db:bootstrap
 *
 * This writes only what the app needs to stop falling back to its in-memory
 * demo seed — a workspace, a project, at least one user to sign in as, and the
 * workflow/field/label structure — and leaves every content table empty, so
 * the first issue you file is genuinely the first. It replaced `db:seed`,
 * which loaded 23 invented issues along with their comments and activity.
 *
 * Edit the block below to make the workspace yours. Re-running is safe: it
 * upserts the structure and re-clears the content tables.
 */

import { loadEnvLocal } from "./env.mjs";

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local (see .env.local.example).");
  process.exit(1);
}

/* ── Yours to edit ───────────────────────────────────────────────── */

const WORKSPACE = { id: "ws_main", name: "Meridian" };

const PROJECT = {
  id: "prj_eng",
  name: "Engineering",
  key: "ENG",
  icon: "cube",
  description: "Product engineering — bugs, defects and platform work.",
};

/** Whoever you sign in as. The login screen lists these, so keep at least one. */
const PEOPLE = [
  { id: "u_izhan", name: "Izhan Ali", email: "izhan.ali@wavemaker.com", color: "#34597f", role: "admin" as const },
];

/** Structure to carry over from the seed module. Flip any to false to start bare. */
const KEEP = { statuses: true, fieldDefs: true, labels: false };

/* ── Write ───────────────────────────────────────────────────────── */

const { db } = await import("../src/lib/db/client");
const { saveSlices } = await import("../src/lib/db/repository");
const t = await import("../src/lib/db/schema");
const seed = await import("../src/lib/data/seed");

const d = db();

// Content tables only — the structure below is upserted rather than wiped, so
// an existing workspace keeps its identity across runs.
console.log("clearing content…");
await d.delete(t.issueLabels);
await d.delete(t.notifications);
await d.delete(t.activities);
await d.delete(t.attachments);
await d.delete(t.comments);
await d.delete(t.issues);
await d.delete(t.whiteboards);

const now = new Date().toISOString();
const retarget = <T extends { projectId: string }>(rows: T[]) =>
  rows.map((r) => ({ ...r, projectId: PROJECT.id }));

console.log("writing structure…");
await saveSlices({
  workspace: { ...WORKSPACE, createdAt: now },
  // setupCompletedAt stays null on purpose: it is what sends the first admin
  // to the setup wizard instead of an empty app shell.
  project: { ...PROJECT, workspaceId: WORKSPACE.id, createdAt: now, setupCompletedAt: null },
  users: PEOPLE.map((p) => ({ ...p, avatarUrl: null, createdAt: now })),
  ...(KEEP.statuses ? { statuses: retarget(seed.statuses) } : {}),
  ...(KEEP.fieldDefs ? { fieldDefs: retarget(seed.fieldDefs) } : {}),
  ...(KEEP.labels ? { labels: retarget(seed.labels) } : {}),
});

console.log(
  `bootstrapped: ${PROJECT.name} (${PROJECT.key}) · ${PEOPLE.length} user(s) · ` +
  `${KEEP.statuses ? seed.statuses.length : 0} statuses · ` +
  `${KEEP.fieldDefs ? seed.fieldDefs.length : 0} fields · ` +
  `${KEEP.labels ? seed.labels.length : 0} labels · 0 issues`,
);
