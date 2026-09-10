import type { ConsoleMessage, Page } from "@playwright/test";
import {
  ISSUES,
  ROUTES,
  createModal,
  drawer,
  expect,
  gotoList,
  palette,
  test,
} from "./helpers";

/** Collects everything that would show up as a problem in the browser. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(`console.${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => problems.push(`requestfailed: ${r.url()} — ${r.failure()?.errorText}`));
  return problems;
}

/** Loads a route and lets it settle without relying on `networkidle`, which a
 *  dev server with HMR never reliably reaches. */
async function visit(page: Page, route: string) {
  await page.goto(route);
  await expect(page.locator("main, h1, form").first()).toBeVisible();
  await page.waitForTimeout(300);
}

const ROUTE_LIST = [
  ROUTES.list,
  ROUTES.board,
  ROUTES.myIssues,
  ROUTES.inbox,
  ROUTES.home,
  ROUTES.settings,
  ROUTES.onboarding,
  ROUTES.issue(ISSUES.auth.key),
  ROUTES.login,
];

test.describe("runtime health", () => {
  test.slow(); // these walk every route in the app

  test("every route loads without console errors, page errors or failed requests", async ({ page }) => {
    const problems = watch(page);

    for (const route of ROUTE_LIST) {
      await visit(page, route);
    }

    expect(problems).toEqual([]);
  });

  test("the core flows stay quiet in the console", async ({ page }) => {
    const problems = watch(page);
    await gotoList(page);

    // open and close the drawer
    await page.getByText(ISSUES.auth.title).click();
    await expect(drawer(page)).toBeVisible();
    await page.keyboard.press("Escape");

    // create modal
    await page.keyboard.press("c");
    await createModal(page).getByPlaceholder("Issue title").fill("Health check");
    await createModal(page).getByRole("button", { name: /^Create issue/ }).click();

    // palette
    await page.keyboard.press("ControlOrMeta+k");
    await palette(page).getByPlaceholder(/Search issues/).fill("health");
    await page.keyboard.press("Escape");

    // grouping, filtering, board
    await visit(page, `${ROUTES.list}?group=assignee&priority=urgent`);
    await visit(page, `${ROUTES.board}?group=priority`);

    expect(problems).toEqual([]);
  });

  test("hydration is clean on a deep-linked drawer", async ({ page }) => {
    const problems = watch(page);
    await page.goto(`${ROUTES.list}?issue=${ISSUES.auth.key}&group=priority&status=st_progress`);
    await expect(drawer(page)).toBeVisible();
    await page.waitForTimeout(300);

    expect(problems.filter((p) => /hydrat|did not match|Warning/i.test(p))).toEqual([]);
    expect(problems).toEqual([]);
  });

  test("each screen exposes exactly one h1", async ({ page }) => {
    for (const [route, heading] of [
      [ROUTES.list, "Engineering"],
      [ROUTES.board, "Engineering"],
      [ROUTES.myIssues, "My Issues"],
      [ROUTES.inbox, "Inbox"],
      [ROUTES.settings, "Settings"],
      [ROUTES.home, "Good"],
    ] as const) {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toContainText(heading);
    }
  });

  test("the login screen has its own h1", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(ROUTES.login);
    await page.evaluate(() => window.localStorage.removeItem("projex.session.v1"));
    await page.goto(ROUTES.login);

    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Sign in");
  });

  test("the document title identifies the app", async ({ page }) => {
    await gotoList(page);
    await expect(page).toHaveTitle(/Projex/);
  });

  test("no request 404s or 500s while walking the app", async ({ page }) => {
    const bad: string[] = [];
    page.on("response", (r) => {
      if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
    });

    for (const route of ROUTE_LIST) {
      await visit(page, route);
    }

    expect(bad).toEqual([]);
  });
});
