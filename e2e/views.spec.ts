import {
  ISSUES,
  ROUTES,
  USERS,
  drawer,
  expect,
  gotoMyIssues,
  row,
  rows,
  sidebar,
  test,
} from "./helpers";

test.describe("My Issues", () => {
  test("shows only the issues assigned to me", async ({ page }) => {
    await gotoMyIssues(page);

    await expect(rows(page)).toHaveCount(4);
    await expect(row(page, ISSUES.auth.title)).toBeVisible();
    await expect(row(page, ISSUES.token.title)).toBeVisible();
    await expect(row(page, ISSUES.shortcut.title)).toHaveCount(0);
    await expect(row(page, ISSUES.board.title)).toHaveCount(0);
  });

  test("keeps the grouping, sorting and filtering controls", async ({ page }) => {
    await gotoMyIssues(page, "?group=priority&status=st_progress");

    await expect(page).toHaveURL(/group=priority/);
    await expect(rows(page)).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Remove filter" })).toHaveCount(1);
  });

  test("opens the issue drawer in place", async ({ page }) => {
    await gotoMyIssues(page);
    await row(page, ISSUES.auth.title).getByText(ISSUES.auth.title).click();

    await expect(page).toHaveURL(new RegExp(`my-issues\\?issue=${ISSUES.auth.key}`));
    await expect(drawer(page).getByRole("heading", { name: ISSUES.auth.title })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(drawer(page)).toHaveCount(0);
    await expect(page).toHaveURL(/my-issues$/);
  });

  test("a shared My Issues drawer link opens on load", async ({ page }) => {
    await gotoMyIssues(page, `?issue=${ISSUES.token.key}`);
    await expect(drawer(page).getByRole("heading", { name: ISSUES.token.title })).toBeVisible();
  });

  test("shows the empty state when nothing is assigned", async ({ page }) => {
    await gotoMyIssues(page);
    // unassign everything that is mine, then reload
    await page.evaluate(() => {
      const key = "issuelyst.data.v4";
      const raw = JSON.parse(localStorage.getItem(key)!);
      raw.state.issues = raw.state.issues.map((i: Record<string, unknown>) => ({ ...i, assigneeId: null }));
      localStorage.setItem(key, JSON.stringify(raw));
    });
    await page.reload();

    await expect(page.getByText("You're all clear")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create issue" })).toBeVisible();
  });
});

test.describe("Inbox", () => {
  test("lists unread and earlier notifications", async ({ page }) => {
    await page.goto(ROUTES.inbox);

    await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();
    await expect(page.getByText("Unread")).toBeVisible();
    await expect(page.getByText("Earlier")).toBeVisible();
    await expect(page.getByText("mentioned you")).toBeVisible();
    await expect(page.getByText("replied on your issue")).toBeVisible();
  });

  test("the sidebar badge matches the unread count and clears", async ({ page }) => {
    await page.goto(ROUTES.inbox);
    await expect(sidebar(page).getByRole("link", { name: "Inbox 3" })).toBeVisible();

    await page.getByRole("button", { name: "Mark all read" }).click();

    await expect(sidebar(page).getByRole("link", { name: "Inbox", exact: true })).toBeVisible();
    await expect(page.getByText("Unread")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Mark all read" })).toHaveCount(0);
  });

  test("opening a notification marks it read and jumps to the issue", async ({ page }) => {
    await page.goto(ROUTES.inbox);
    await page.getByText("mentioned you").click();

    await expect(page).toHaveURL(new RegExp(`list\\?issue=${ISSUES.auth.key}`));
    await expect(drawer(page).getByRole("heading", { name: ISSUES.auth.title })).toBeVisible();

    await page.goto(ROUTES.inbox);
    await expect(sidebar(page).getByRole("link", { name: "Inbox 2" })).toBeVisible();
  });
});

test.describe("Home", () => {
  test("greets the user and summarises the project", async ({ page }) => {
    await page.goto(ROUTES.home);

    await expect(page.getByRole("heading", { name: new RegExp(`, ${USERS.admin.first}$`) })).toBeVisible();
    await expect(page.getByText("Here’s what needs your attention in Engineering")).toBeVisible();

    await expect(page.getByRole("link", { name: /Assigned to you/ })).toContainText("4");
    await expect(page.getByRole("link", { name: /^Open/ })).toContainText("18");
    await expect(page.getByRole("link", { name: /In progress/ })).toContainText("8");
    await expect(page.getByText("Overdue")).toBeVisible();
  });

  test("stat tiles link into the matching views", async ({ page }) => {
    await page.goto(ROUTES.home);
    await page.getByRole("link", { name: /In progress/ }).click();
    await expect(page).toHaveURL(/\/board$/);

    await page.goto(ROUTES.home);
    await page.getByRole("link", { name: /Assigned to you/ }).first().click();
    await expect(page).toHaveURL(/\/my-issues$/);
  });

  test("panels list my issues and recent activity, and open the drawer", async ({ page }) => {
    await page.goto(ROUTES.home);

    await expect(page.getByRole("heading", { name: "Assigned to you" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recently updated" })).toBeVisible();

    await page.getByRole("button", { name: new RegExp(ISSUES.auth.title) }).first().click();
    await expect(page).toHaveURL(new RegExp(`list\\?issue=${ISSUES.auth.key}`));
    await expect(drawer(page).getByRole("heading", { name: ISSUES.auth.title })).toBeVisible();
  });

  test("View all leads to My Issues", async ({ page }) => {
    await page.goto(ROUTES.home);
    await page.getByRole("link", { name: /View all/ }).click();
    await expect(page).toHaveURL(/\/my-issues$/);
  });
});
