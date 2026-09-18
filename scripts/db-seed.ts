/**
 * Pushes the demo dataset into Neon, replacing whatever is there.
 *
 *   npm run db:seed
 *
 * Destructive by design: this is how you get a fresh database into the state
 * the prototype has always started from, and how you reset a messy one.
 */

import { loadEnvLocal } from "./env.mjs";

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local (see .env.local.example).");
  process.exit(1);
}

const { db } = await import("../src/lib/db/client");
const { saveSlices } = await import("../src/lib/db/repository");
const t = await import("../src/lib/db/schema");
const seed = await import("../src/lib/data/seed");
const { seedWhiteboards } = await import("../src/lib/data/whiteboards-seed");

const d = db();

// Children before parents: the foreign keys cascade, but being explicit keeps
// the order obvious to the next person reading this.
console.log("clearing…");
await d.delete(t.issueLabels);
await d.delete(t.notifications);
await d.delete(t.activities);
await d.delete(t.attachments);
await d.delete(t.comments);
await d.delete(t.issues);
await d.delete(t.fieldDefs);
await d.delete(t.labels);
await d.delete(t.statuses);
await d.delete(t.whiteboards);
await d.delete(t.projects);
await d.delete(t.workspaces);
await d.delete(t.users);

console.log("writing…");
await saveSlices({
  workspace: seed.workspace,
  project: seed.project,
  users: seed.users,
  statuses: seed.statuses,
  labels: seed.labels,
  fieldDefs: seed.fieldDefs,
  issues: seed.issues,
  comments: seed.comments,
  attachments: seed.attachments,
  activities: seed.activities,
  notifications: seed.notifications,
});

const boards = seedWhiteboards();
if (boards.length) {
  await d.insert(t.whiteboards).values(
    boards.map((b) => ({
      id: b.id,
      workspaceId: b.workspaceId,
      name: b.name,
      objects: b.objects,
      createdById: b.createdById,
      createdAt: new Date(b.createdAt),
      updatedAt: new Date(b.updatedAt),
    })),
  );
}

console.log(
  `seeded: ${seed.users.length} users · ${seed.issues.length} issues · ` +
  `${seed.comments.length} comments · ${boards.length} whiteboards`,
);
