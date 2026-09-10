import { test as base, expect, type Locator, type Page } from "@playwright/test";

/* ── App constants mirrored from the seed data ───────────────────── */

export const SESSION_KEY = "projex.session.v1";
export const DATA_KEY = "projex.data.v4";
export const UI_KEY = "projex.ui.v1";
export const THEME_KEY = "projex.theme";

export const USERS = {
  admin: { id: "u_izhan", name: "Izhan Ali", first: "Izhan", email: "izhan.ali@wavemaker.com", role: "admin" },
  admin2: { id: "u_ahmed", name: "Ahmed Raza", first: "Ahmed", email: "ahmed@meridian.dev", role: "admin" },
  member: { id: "u_sara", name: "Sara Whitfield", first: "Sara", email: "sara@meridian.dev", role: "member" },
  member2: { id: "u_lena", name: "Lena Vogel", first: "Lena", email: "lena@meridian.dev", role: "member" },
} as const;

export const ROUTES = {
  login: "/login",
  list: "/app/project/engineering/list",
  board: "/app/project/engineering/board",
  myIssues: "/app/my-issues",
  inbox: "/app/inbox",
  home: "/app/home",
  settings: "/app/settings",
  onboarding: "/onboarding",
  issue: (key: string | number) => `/app/project/engineering/issue/${key}`,
};

export const STATUSES = ["Backlog", "Open", "In Progress", "In Review", "Done", "Closed"] as const;

/** Seeded issues used as anchors by the specs. */
export const ISSUES = {
  /** urgent · In Progress · assigned to the admin */
  auth: { key: "142", title: "Authentication redirect loops after session expiry" },
  /** high · Open · assigned to the admin */
  token: { key: "141", title: "Token refresh silently fails on mobile web" },
  /** medium · In Review · assigned to Lena */
  board: { key: "140", title: "Board columns lose scroll position on drag" },
  /** low · Backlog · unassigned */
  shortcut: { key: "137", title: "Add keyboard shortcut to cycle priority on a selected row" },
  /** low · Closed · assigned to Sara */
  emptyState: { key: "120", title: "Add 'My Issues' empty state with a create CTA" },
} as const;

export const SEEDED_ISSUE_COUNT = 23;

/* ── Fixtures ────────────────────────────────────────────────────── */

interface Options {
  /** Seeded user id put into the client session before the first navigation. */
  userId: string | null;
}

/**
 * The default test is signed in as the seeded admin. Override per file or per
 * test with `test.use({ userId: USERS.member.id })`, or `null` for signed out.
 * Each test gets a fresh browser context, so localStorage (session, issue data,
 * UI prefs) always starts clean and the app re-seeds itself.
 */
export const test = base.extend<Options>({
  userId: [USERS.admin.id, { option: true }],
  page: async ({ page, userId }, use) => {
    if (userId) {
      // Hide the Next dev-overlay indicator: it floats over the bottom-left of
      // the sidebar (right on top of the user menu button) and swallows clicks.
      await page.addInitScript(() => {
        document.addEventListener("DOMContentLoaded", () => {
          const style = document.createElement("style");
          style.textContent = "nextjs-portal{display:none!important}";
          document.head.appendChild(style);
        });
      });

      // Seed the session on the FIRST document load of the context only, so a
      // test that signs out stays signed out across later navigations.
      await page.addInitScript(
        ([key, id, flag]) => {
          try {
            if (window.sessionStorage.getItem(flag)) return;
            window.sessionStorage.setItem(flag, "1");
            window.localStorage.setItem(key, id);
          } catch {}
        },
        [SESSION_KEY, userId, "pw.session.seeded"] as const,
      );
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture `use`, not a React hook
    await use(page);
  },
});

export { expect };

/* ── Navigation ──────────────────────────────────────────────────── */

export async function gotoList(page: Page, query = "") {
  await page.goto(ROUTES.list + query);
  await expectListReady(page);
}

export async function gotoMyIssues(page: Page, query = "") {
  await page.goto(ROUTES.myIssues + query);
  await expect(page.getByRole("heading", { name: "My Issues" })).toBeVisible();
}

export async function gotoBoard(page: Page, query = "") {
  await page.goto(ROUTES.board + query);
  await expect(page.getByRole("heading", { name: "Engineering" })).toBeVisible();
  await expect(page.getByText(ISSUES.auth.title)).toBeVisible();
}

export async function expectListReady(page: Page) {
  await expect(page.getByRole("heading", { name: "Engineering" })).toBeVisible();
  await expect(rows(page).first()).toBeVisible();
}

/* ── Locators ────────────────────────────────────────────────────── */

/** Every issue row in the list view (the wrapper carries `data-idx`). */
export function rows(page: Page): Locator {
  return page.locator("div[data-idx]");
}

/** A single issue row, matched on its title (or any text it renders). */
export function row(page: Page, text: string): Locator {
  return rows(page).filter({ hasText: text });
}

/** An issue card on the board, matched on its title. */
export function card(page: Page, title: string): Locator {
  return page.locator('div[class*="cursor-pointer"][class*="rounded-lg"]').filter({ hasText: title }).first();
}

/** The floating popover menu opened by pickers, filters, menus… */
export function menu(page: Page): Locator {
  return page.getByRole("menu");
}

/** The issue detail drawer. */
export function drawer(page: Page): Locator {
  return page.getByRole("dialog", { name: /^Issue \d+$/ });
}

/** The create-issue modal. */
export function createModal(page: Page): Locator {
  return page.getByRole("dialog").filter({ has: page.getByPlaceholder("Issue title") });
}

/** The ⌘K command palette. */
export function palette(page: Page): Locator {
  return page.getByRole("dialog").filter({ has: page.getByPlaceholder(/Search issues, people, labels/) });
}

/** A list group header row ("Backlog", "Urgent", a person's name…). */
export function groupHeader(page: Page, label: string): Locator {
  return page
    .locator("section > div")
    .filter({ has: page.getByRole("button", { name: "Toggle group" }) })
    .filter({ hasText: label })
    .first();
}

/** A board column, matched on its header label. */
export function boardColumn(page: Page, label: string): Locator {
  return page.locator('div[class*="w-[288px]"]').filter({ hasText: label }).first();
}

/** The scrollable drop area of a board column. */
export function boardColumnBody(page: Page, label: string): Locator {
  return boardColumn(page, label).locator('div[class*="overflow-y-auto"]').first();
}

/** The floating bulk-action bar shown while rows are selected. */
export function bulkBar(page: Page): Locator {
  return page.locator('div[class*="bottom-5"][class*="z-40"]').first();
}

/** Toasts, scoped to the toast viewport — Next's route announcer also uses
 *  role="status" and would otherwise be counted as a toast. */
export function toast(page: Page, text?: string | RegExp): Locator {
  const t = page.locator('div[class*="z-[200]"]').getByRole("status");
  return text ? t.filter({ hasText: text }) : t;
}

export function sidebar(page: Page): Locator {
  return page.locator("aside").first();
}

/* ── Actions ─────────────────────────────────────────────────────── */

/** Opens the detail drawer for an issue by clicking its row title. */
export async function openIssueFromList(page: Page, title: string) {
  await row(page, title).getByText(title).click();
  await expect(drawer(page)).toBeVisible();
}

/** Opens a picker popover from a row (Priority / Status / Assignee). */
export async function openRowPicker(page: Page, title: string, label: "Priority" | "Status" | "Assignee") {
  await row(page, title).getByRole("button", { name: label }).click();
  await expect(menu(page)).toBeVisible();
}

/**
 * Chooses an item inside the currently open popover menu. Menu rows often
 * carry extra accessible text (a keyboard hint, an avatar's name, a check
 * mark), so a string is matched as a whole-word prefix rather than exactly.
 */
export async function chooseInMenu(page: Page, name: string | RegExp) {
  const matcher =
    typeof name === "string"
      ? new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|\\s)`)
      : name;
  await menu(page).getByRole("button", { name: matcher }).first().click();
}

/**
 * Picks an option in a picker inside the create-issue modal the way a keyboard
 * user does: filter, then Enter. (Clicking works too — see
 * create-issue.spec.ts — this covers the keyboard path.)
 */
export async function chooseInModalPicker(page: Page, placeholder: string, name: string) {
  await page.getByPlaceholder(placeholder).fill(name);
  await page.getByPlaceholder(placeholder).press("Enter");
}

/** Opens one of the list/board control menus by its trigger label. */
export async function openControl(page: Page, name: RegExp) {
  await page.getByRole("button", { name }).first().click();
  await expect(menu(page)).toBeVisible();
}

export async function closeMenu(page: Page) {
  await page.keyboard.press("Escape");
  await expect(menu(page)).toHaveCount(0);
}

/** Opens the user menu in the sidebar footer. */
export async function openUserMenu(page: Page, userName: string) {
  await sidebar(page).getByRole("button", { name: new RegExp(userName) }).click();
  await expect(menu(page)).toBeVisible();
}

/**
 * Opens the login screen and waits for it to be interactive. The demo-account
 * list only renders once the store has rehydrated, so it doubles as a hydration
 * gate — typing into the form before that point loses the value to React's
 * first controlled render.
 */
export async function gotoLogin(page: Page) {
  await page.goto(ROUTES.login);
  await expect(page.getByRole("button", { name: new RegExp(USERS.admin.name) })).toBeVisible();
}

/** Signs in through the real login form. */
export async function signInWithForm(page: Page, email: string, password = "hunter2") {
  await gotoLogin(page);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

/**
 * dnd-kit needs a real pointer gesture: press, a nudge past the 5px activation
 * distance, a few intermediate moves so `pointerWithin` sees the target, then
 * release. Both ends are scrolled into view first — a board column scrolls
 * independently, so a card can easily sit outside the viewport.
 */
export async function dragTo(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("drag source or target is not visible");

  const start = { x: from.x + from.width / 2, y: from.y + 14 };
  const end = { x: to.x + to.width / 2, y: to.y + Math.min(to.height / 2, 80) };

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.waitForTimeout(60);
  await page.mouse.move(start.x + 6, start.y + 8, { steps: 3 });
  await page.waitForTimeout(60);
  await page.mouse.move((start.x + end.x) / 2, (start.y + end.y) / 2, { steps: 10 });
  await page.mouse.move(end.x, end.y, { steps: 10 });
  await page.waitForTimeout(80);
  await page.mouse.move(end.x, end.y + 4, { steps: 3 });
  await page.mouse.up();
}

/** The whole persisted entity store, straight out of localStorage. */
export async function readData(page: Page): Promise<Record<string, Array<Record<string, unknown>>>> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw).state ?? {} : {};
  }, DATA_KEY);
}

/** Reads the persisted issues straight out of localStorage. */
export async function readIssues(page: Page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [] as Array<Record<string, unknown>>;
    return (JSON.parse(raw).state?.issues ?? []) as Array<Record<string, unknown>>;
  }, DATA_KEY);
}

export async function issueByNumber(page: Page, number: number) {
  const all = await readIssues(page);
  return all.find((i) => i.number === number);
}

/** The persisted UI preferences (sidebar, favourites, column visibility/order). */
export async function readUI(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw).state ?? {} : {};
  }, UI_KEY);
}

/** Field column headers of the list, in display order. */
export async function columnOrder(page: Page): Promise<string[]> {
  const titles = await page.locator('span[title$="drag to reorder"]').evaluateAll((els) =>
    els.map((el) => el.getAttribute("title")?.split(" — ")[0] ?? ""),
  );
  return titles;
}

/** The property rail inside the issue drawer. */
export function rail(page: Page): Locator {
  return drawer(page).getByRole("complementary");
}

/** Switches the acting user through the sidebar user menu (no reload). */
export async function switchUserTo(page: Page, currentName: string, nextName: string) {
  await openUserMenu(page, currentName);
  await page.getByRole("button", { name: /Switch user/ }).click();
  await menu(page).getByRole("button", { name: new RegExp(nextName) }).click();
  await expect(sidebar(page).getByText(nextName)).toBeVisible();
}
