# IssueLyst — TanStack Start

This is the TanStack Start port of `projex-app` (Next 16 App Router). Same
product, same components, same store; different router and build.

Nothing here is Next. There is no `app/` directory, no server components, no
`"use client"`, no `next/*` imports. If you find one, it's a leftover.

## Stack

- **TanStack Start v1** + **TanStack Router** (file-based routes), Vite 8
- React 19, Tailwind v4 via `@tailwindcss/vite`
- Zustand (+immer, persist) — all app data lives in `localStorage`
- `@dnd-kit`, `@floating-ui/react`, `motion`, `lucide-react`
- Fonts self-hosted through `@fontsource` (Roboto + IBM Plex Mono)

## Layout

```
src/routes/          file-based routes; routeTree.gen.ts is generated, never edit it
src/components/      unchanged from projex-app
src/lib/             unchanged, except store/query.ts, store/search.ts, hooks/use-drawer.ts
src/lib/db/          drizzle schema, repository, server functions (Neon)
drizzle/             generated migrations — commit them, never hand-edit
src/styles/          globals.css (design tokens) + fonts.css
scripts/             optimize-images.mjs — pre-generates AVIF/WebP for the landing shots
e2e/                 Playwright suite, self-contained; delete the folder to remove it
mcp-server/          separate package, untouched by the migration
```

## Two things to know before editing routes

**1. The whole app's search schema lives on one route.** `/app`
(`src/routes/app.tsx`) declares `validateSearch: validateAppSearch`, and every
screen below it inherits the result. That's deliberate: the detail drawer's
`?issue=` deep link has to work from My Issues, the Inbox and Home, not just
the project views. Read params with `useSearch({ from: "/app" })`.

**2. Search params are raw strings, by configuration.** `src/router.tsx`
installs an identity `parseSearch`/`stringifySearch`. Router's default codec
JSON-parses anything that looks like JSON — and its test matches any value
starting with a digit — which would turn `?issue=142` into the number `142` on
read and write it back as `?issue=%22142%22`. Independently, Router's `qss`
decoder coerces numeric strings to numbers and `true`/`false` to booleans
*before* any parser runs, so `validateAppSearch` normalises primitives back to
strings. Between them, the URL format is byte-identical to the Next app's.
Don't "simplify" either piece without re-reading `src/lib/store/search.ts`.

## The data layer has two modes

`DATABASE_URL` unset — everything lives in `localStorage`, same as it always
did. This is the default and how the e2e suite runs. Set it, and the same
store persists to Neon Postgres instead.

Which mode you get is decided at **build time**: `vite.config.ts` folds
`Boolean(env.DATABASE_URL)` into `__DB_CONFIGURED__`, so with no database the
Neon adapter is dead-code-eliminated and the client ships exactly what it
always shipped — synchronous localStorage, no boot round-trip. The cost of
that trade is that a `DATABASE_URL` appearing only at runtime is not noticed;
it has to be present when the build runs.

What makes that work is that **only the `persist` storage changed**. The
store's actions are still synchronous and optimistic; no component or selector
knows which mode is active. If you find yourself making an action `async` to
talk to the database, stop — that is not where the seam is.

`src/lib/store/neon-storage.ts` diffs writes by slice using reference equality,
which is only sound because immer guarantees a new reference for exactly the
slices an action touched. Don't replace immer's producer with manual spreads in
the store without re-reading that file.

`src/lib/db/client.ts` must never reach the browser. `server.ts` imports the
repository with `await import` inside each handler to keep it that way; after
changing anything in `src/lib/db/`, run `npm run build` and confirm
`.output/public` has no `neondatabase` or `DATABASE_URL` in it.

## Commands

```bash
npm run dev         # Vite dev server on :3100 (strictPort — projex-app owns :3000)
npm run build       # production build
npm run typecheck   # tsc --noEmit; catches bad route paths and params
npm run lint
npm run images      # regenerate AVIF/WebP after re-capturing screenshots
npm run test:e2e    # Playwright, 244 tests, uses the machine's Chrome

npm run db:generate # regenerate drizzle/ after editing src/lib/db/schema.ts
npm run db:migrate  # apply migrations
npm run db:seed     # replace all rows with the demo dataset (destructive)
```

`npm run typecheck` is the load-bearing check: route paths, params and search
params are all statically typed, so a wrong `to=` or a missing `params` fails
there rather than at runtime.

## Auth

The prototype session is a user id in `localStorage` (plus a cookie that
nothing reads yet). `beforeLoad` on `/app` and `/onboarding` redirects
signed-out visitors, but only in the browser — there is no session to read
during SSR — so the layout component keeps its own client-side guard for cold
loads. When auth moves server-side, the component guard is what to delete.

## Gotcha when verifying by hand

Animations are driven by `requestAnimationFrame`. In a hidden or backgrounded
browser tab, rAF never fires and every `motion` element sits frozen at its
`initial` value — a blank-looking landing page and an invisible drawer. That is
the tab, not the app. Verify animation in a real visible window, or via the
Playwright suite.
