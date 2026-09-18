# IssueLyst — Issue Tracker (TanStack Start)

A focused, desktop-grade issue tracker for engineering teams, inspired by the
interaction quality of ClickUp/Linear but with its own visual identity. Built
frontend-first as a polished, fully interactive prototype whose data layer is
isolated behind a clean seam — which is how it now runs on either
`localStorage` or a real Neon/Postgres backend without the UI knowing.

This is the TanStack Start port of `projex-app`. Same product and components;
the router, the build and the URL-state layer are different. See `AGENTS.md`
for the two non-obvious details (where the search schema lives, and why the
search-param codec is customised).

## Stack

- **TanStack Start v1** (TanStack Router, file-based routes, Vite 8) · **React 19** · **TypeScript**
- **Tailwind CSS v4** with a semantic design-token system (light + dark)
- **Zustand** (+ immer, persist) — optimistic client store, seeded with demo data
- **Drizzle + Neon Postgres** — optional; unset `DATABASE_URL` keeps it local
- **Floating UI** — popovers, menus, tooltips, dialogs
- **@dnd-kit** — board drag-and-drop
- **Motion** — subtle drawer / reorder transitions
- Type: **Roboto** (UI) · **IBM Plex Mono** (ids, timestamps, shortcuts), self-hosted via `@fontsource`

## Run

```bash
npm install
npm run dev
# http://localhost:3100  → sign in with any demo account
```

Data persists in the browser (localStorage). Reset it any time from
**Settings → Prototype data → Reset**.

## What's in it

- **App shell** — collapsible sidebar, workspace switcher, top bar, command bar
- **List view** — dense grouped rows (by status / priority / assignee), inline
  editing of status, priority, assignee, labels; multi-select + bulk actions
- **Board view** — kanban with drag-and-drop between statuses (optimistic)
- **Issue drawer** — right-side detail that keeps the list underneath, is
  deep-linkable (`?issue=142`), and survives browser back/forward. Inline
  title/description editing, activity timeline, comments with `@mentions`,
  attachments. A dedicated full page lives at `/issue/142`.
- **Create issue** — instant modal, keyboard-first (`C`, `⌘↵` to submit)
- **Search** — `⌘K` command palette across issues, people, labels, comments
- **Filters** — status / priority / assignee / label / created / updated,
  persisted in the URL
- **My Issues**, **Inbox** (assignments, mentions, status, comments), **Home**
- **CSV export** — from the list/My Issues header or the command palette
- **File attachments** — drag-and-drop uploads hosted on Cloudinary — see below
- **Dark mode** — architecturally complete, follows system or an explicit toggle

### Keyboard

`C` new issue · `⌘K` / `/` search · `Esc` close · `Enter` open row ·
`↑`/`↓` (`j`/`k`) move · `x` select row · `[` toggle sidebar

## File attachments

Issues take files by drag-and-drop or the **Upload** button. Uploads go
straight from the browser to Cloudinary through an *unsigned* upload preset —
entirely client-side, no backend, no API secret in the bundle. Copy
`.env.local.example` to `.env.local` and set:

```
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

Until those are set, uploads fall back to an in-tab object URL so the flow
stays usable — but those attachments do not survive a reload. Because the
preset is public, cap its allowed formats and max file size in the Cloudinary
console. Full setup steps are in `.env.local.example`.

## MCP server

`mcp-server/` is a Model Context Protocol server exposing the tracker to AI
clients (list/create/update/search issues, comments, CSV export). See
[`mcp-server/README.md`](./mcp-server/README.md).

## Architecture & SaaS readiness

The domain model (`src/lib/types.ts`) and the Drizzle schema
(`src/lib/db/schema.ts`) are the same shape:

```
User → Workspace → Project → Issue → { Comment, Attachment, Activity }
                                    ↘ Status, Label, Notification
```

Nothing is hardcoded to a single project. The store exposes its actions behind
a seam (`src/lib/store`), which is what let the seeded local store be replaced
with a Drizzle + Neon repository as a data-layer change rather than a UI
rewrite — no component or selector was touched.

### Neon Postgres

The Drizzle/Neon data layer is wired. It is **opt-in**: with `DATABASE_URL`
unset the app runs entirely on `localStorage` exactly as before, so nothing
here is required to work on the UI.

```bash
# .env.local → DATABASE_URL=postgres://…   (see .env.local.example)
npm run db:migrate    # apply drizzle/ to the database
npm run db:seed       # load the demo dataset — destructive, replaces all rows
npm run dev
```

| Script | What it does |
| --- | --- |
| `db:generate` | regenerate SQL in `drizzle/` after editing the schema |
| `db:migrate` | apply pending migrations |
| `db:push` | shove the schema straight at the database (dev shortcut) |
| `db:studio` | Drizzle Studio against your database |
| `db:seed` | replace everything with the demo dataset |

Which mode you get is decided when the bundle is built: `vite.config.ts` folds
`Boolean(DATABASE_URL)` into a `__DB_CONFIGURED__` constant, so an unconfigured
build drops the Neon adapter entirely rather than shipping it and asking the
server at boot. Set `DATABASE_URL` before building, not only at runtime.

How it fits together:

```
src/lib/db/schema.ts      13 tables, the relational form of src/lib/types.ts
src/lib/db/repository.ts  rows ⇄ the shape the store already holds
src/lib/db/server.ts      server functions — the only route from browser to DB
src/lib/db/client.ts      Neon connection; throws if it ever reaches a bundle
src/lib/store/neon-storage.ts  the Zustand `persist` adapter
drizzle/                  generated migrations — commit them
```

The store's actions did not change. They are still synchronous and optimistic;
only the `persist` storage moved, so the component tree and selectors are
untouched — the seam the architecture was built around.

Writes are debounced (700ms) and diffed per slice. immer gives every action a
fresh reference for the slices it touched and the same reference for the rest,
so editing one issue title sends the `issues` slice and nothing else.

**Known limits.** Persistence is last-write-wins for a single session — two
browsers editing at once will clobber each other. Moving from snapshot
write-through to per-action mutations is the fix, and it wants real auth
first (today's "session" is still a user id in `localStorage`). Whiteboards
have a table and are seeded, but still load from their own local store.

## Project layout

```
src/
  app/                 routes (auth, app shell, project list/board/issue)
  components/
    ui/                primitives (button, popover, modal, toast, …)
    issues/            rows, cards, pickers, detail drawer, create modal
    project/           header, list/board screens, filters, export
    shell/ inbox/ home/ settings/
  lib/
    db/                drizzle schema, repository, server functions
    store/             zustand store, selectors, URL query
    data/              seed data
    integrations/      cloudinary uploads
    utils/             csv, format, platform helpers
mcp-server/            MCP server (separate package)
```

Create the Neon project, put DATABASE_URL in .env.local (no VITE_ prefix), then npm run db:migrate && npm run db:seed.