# IssueLyst — Issue Tracker (TanStack Start)

A focused, desktop-grade issue tracker for engineering teams, inspired by the
interaction quality of ClickUp/Linear but with its own visual identity. Built
frontend-first as a polished, fully interactive prototype whose data layer is
deliberately isolated behind a clean seam, so it can be swapped for a real
Neon/Postgres backend without touching the UI.

This is the TanStack Start port of `projex-app`. Same product and components;
the router, the build and the URL-state layer are different. See `AGENTS.md`
for the two non-obvious details (where the search schema lives, and why the
search-param codec is customised).

## Stack

- **TanStack Start v1** (TanStack Router, file-based routes, Vite 8) · **React 19** · **TypeScript**
- **Tailwind CSS v4** with a semantic design-token system (light + dark)
- **Zustand** (+ immer, persist) — optimistic client store, seeded with demo data
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
- **Google Drive attachments** — see below
- **Dark mode** — architecturally complete, follows system or an explicit toggle

### Keyboard

`C` new issue · `⌘K` / `/` search · `Esc` close · `Enter` open row ·
`↑`/`↓` (`j`/`k`) move · `x` select row · `[` toggle sidebar

## Google Drive attachments

Issues can attach files from Google Drive via the Google Picker — entirely
client-side, no backend. Copy `.env.local.example` to `.env.local` and set:

```
VITE_GOOGLE_CLIENT_ID=...
VITE_GOOGLE_API_KEY=...
```

Until those are set, the **Drive** button offers a demo attachment so the flow
is fully usable. Setup steps are in `.env.local.example`.

## MCP server

`mcp-server/` is a Model Context Protocol server exposing the tracker to AI
clients (list/create/update/search issues, comments, CSV export). See
[`mcp-server/README.md`](./mcp-server/README.md).

## Architecture & SaaS readiness

The domain model (`src/lib/types.ts`) mirrors the intended relational schema:

```
User → Workspace → Project → Issue → { Comment, Attachment, Activity }
                                    ↘ Status, Label, Notification
```

Nothing is hardcoded to a single project. The store exposes async-shaped
actions behind a seam (`src/lib/store`), so replacing the seeded local store
with a Drizzle + Neon repository is a data-layer change, not a UI rewrite.

### Wiring Neon (next step)

Set `DATABASE_URL` (see `.env.local.example`), then implement the repository
against Drizzle + `@neondatabase/serverless`, run migrations, and swap the
store's persistence. The component tree and selectors stay as-is.

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
    store/             zustand store, selectors, URL query
    data/              seed data
    integrations/      google drive picker
    utils/             csv, format, platform helpers
mcp-server/            MCP server (separate package)
```
