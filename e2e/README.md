# IssueLyst end-to-end tests

Playwright coverage for the IssueLyst prototype — 220 tests across auth, shell
navigation, list and board views, the issue drawer, issue creation, the command
palette, bulk actions, custom fields, columns, settings, RBAC, onboarding, CSV
export, attachments, comments, notifications, persistence, data integrity,
responsive layout and runtime health.

## Run

```bash
npm run test:e2e            # headless, starts `npm run dev` if nothing is on :3100
npm run test:e2e:ui         # Playwright UI mode
npx playwright test -c e2e/playwright.config.ts list-view      # one file
npx playwright test -c e2e/playwright.config.ts --headed -g "drag"
```

The suite drives the **Google Chrome already installed on the machine**
(`channel: "chrome"`), so there is no Playwright browser download to manage. If
Chrome is missing, install it — or switch the project in
`e2e/playwright.config.ts` back to bundled Chromium by dropping the `channel`
option and running `npx playwright install chromium`.

Point the suite at a server you manage yourself with `PW_BASE_URL`:

```bash
PW_BASE_URL=http://localhost:3001 npm run test:e2e
```

Reports and traces land in `e2e/.artifacts/` (git-ignored).

## Files

| Spec | Covers |
| --- | --- |
| `auth.spec.ts` | route guard, form sign-in, demo accounts, sign-out, user switching |
| `navigation.spec.ts` | redirects, sidebar, view tabs, collapse, favourites, issue full page |
| `list-view.spec.ts` | rows, grouping, sorting, every filter, chips, columns, keyboard nav, inline edits |
| `issue-drawer.spec.ts` | deep links, close paths, history, title/description editing, comments, property rail, delete |
| `create-issue.spec.ts` | entry points, validation, all attributes, ⌘↵, Create more, prefills |
| `command-palette.spec.ts` | shortcuts, actions, issue/people/label/comment search, theme toggle |
| `board.spec.ts` | columns, cards, drag-and-drop across status/priority/assignee, filters |
| `bulk-actions.spec.ts` | selection, `x`, bulk status/assign/delete |
| `inline-editing.spec.ts` | row and card pickers edit without hijacking the row click |
| `fields.spec.ts` | select, multi-select, number, text, date, checkbox; filter/group by field; option renames |
| `columns.spec.ts` | drag-to-reorder columns, visibility, persistence, per-user scope |
| `views.spec.ts` | My Issues, Inbox, Home |
| `whiteboards.spec.ts` | sidebar entry, board list and deep links, stickies/text/pen, pen and text colours and S/M/L sizes, edit in place, select-recolor-delete-undo, drag, fit-to-window zoom and pan, board CRUD, favourites, upgrades of saved boards |
| `settings.spec.ts` | tabs, theme, label and field CRUD, seed reset |
| `permissions.spec.ts` | member vs admin capabilities |
| `onboarding.spec.ts` | the five-step wizard and what launching applies |
| `export-csv.spec.ts` | real downloads: filenames, scope, quoting |
| `attachments-comments.spec.ts` | uploads, Drive demo picker, comment edit/delete/ownership |
| `activity-notifications.spec.ts` | activity feed entries, who gets notified, unread counts |
| `persistence.spec.ts` | reloads, issue numbering, UI preferences, storage keys |
| `data-integrity.spec.ts` | cascading deletes, closedAt, counts that must agree |
| `responsive.spec.ts` | 1440 / 1100 / 900 / 700 px layouts, no sideways page scroll |
| `health.spec.ts` | zero console errors, page errors, failed requests or 4xx/5xx; one h1 per screen |

## How it works

* **Session** — `e2e/helpers.ts` exports a `test` fixture that writes the
  prototype's session key (`issuelyst.session.v1`) into `localStorage` before the
  first navigation. The session is seeded once per browser
  context, so a test that signs out stays signed out. Override the acting user
  with `test.use({ userId: USERS.member.id })`, or `null` for signed out.
* **Data isolation** — the app persists issues in `localStorage`
  (`issuelyst.data.v4`) and whiteboards alongside them
  (`issuelyst.whiteboards.v1`). Every test gets a fresh browser context, so every test
  starts from the untouched seed; no cleanup needed. `readData()`, `readIssues()`
  and `readUI()` read the stores back when an assertion is about persisted state
  rather than pixels.
* **Route warm-up** — `e2e/global-setup.ts` requests each route once so the
  first navigation of a spec is not waiting on the dev-server compile.
* **Hydration** — the login screen renders its demo accounts only after the
  store rehydrates, so `gotoLogin()` waits for them before typing; filling a
  controlled input earlier loses the value on React's first render.
* **Drag and drop** — dnd-kit needs a real pointer gesture, so `dragTo()`
  scrolls both ends into view, presses, nudges past the 5px activation
  distance, moves in steps and releases. Board drops target left-hand columns:
  dnd-kit auto-scrolls the horizontal container near its edge, which would
  otherwise slide a right-hand column out from under the cursor.
* **Locators** — the app ships no `data-testid` attributes, so the suite uses
  roles, accessible names, placeholders and text. Playwright's `name` option is
  a *substring* match unless `exact: true`; helpers such as `chooseInMenu`,
  `bulkBar`, `boardColumn`, `rail` and `toast` exist to keep that from biting.

## Bugs this suite found (all fixed)

| Fix | Defect | Guarded by |
| --- | --- | --- |
| `ui/popover.tsx` z-`160`→`180`, `ui/tooltip.tsx` `150`→`190` | Picker popovers inside the New Issue modal painted *under* the modal overlay (`z-[170]`), so clicking an option hit the overlay and dismissed the whole modal. Layer order is now drawer 120 · modal 170 · popover 180 · tooltip 190 · toast 200. | `create-issue.spec.ts` → *picker options in the create modal are clickable* |
| `DrawerHost` moved to `app/app/layout.tsx` | The drawer was mounted only under the project route, so clicking a row on `/app/my-issues` wrote `?issue=142` to the URL and nothing opened. | `views.spec.ts` → *opens the issue drawer in place* |
| `group` class added to the list group header | The per-group "+" button used `opacity-0 group-hover:opacity-100` while its parent never set Tailwind's `group` class, leaving it invisible at every hover state. | `list-view.spec.ts` → *the group header reveals its add button on hover* |
| `ui/popover.tsx` stops click/mouse/pointer propagation out of the portal | React portals bubble events through the component tree, not the DOM: choosing a status, priority or assignee from a list row or board card also fired that row's own `onClick`, yanking the issue drawer open on top of the edit (and offering the pointerdown to the card's drag sensor). | `inline-editing.spec.ts` (whole file) |

## Removing the suite

The suite is self-contained:

1. `rm -rf e2e`
2. drop the `test:e2e` and `test:e2e:ui` scripts from `package.json`
3. `npm uninstall -D @playwright/test`
4. remove the `/e2e/.artifacts/` line from `.gitignore`

The four fixes above live in `src/` and stay — they are app fixes, not test
scaffolding. Nothing else under `src/` was changed for the tests.
