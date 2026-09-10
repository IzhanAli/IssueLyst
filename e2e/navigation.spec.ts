import { ISSUES, ROUTES, USERS, expect, gotoList, sidebar, test } from "./helpers";

test.describe("shell navigation", () => {
  test("the root URL lands on the project list", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/app\/project\/engineering\/list$/);
    await expect(page.getByRole("heading", { name: "Engineering" })).toBeVisible();
  });

  test("sidebar reaches every top-level destination", async ({ page }) => {
    await gotoList(page);
    const nav = sidebar(page);

    await nav.getByRole("link", { name: "Home" }).click();
    await expect(page).toHaveURL(/\/app\/home$/);
    await expect(page.getByRole("heading", { name: new RegExp(`, ${USERS.admin.first}$`) })).toBeVisible();

    await nav.getByRole("link", { name: /^Inbox/ }).click();
    await expect(page).toHaveURL(/\/app\/inbox$/);
    await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();

    await nav.getByRole("link", { name: "My Issues" }).click();
    await expect(page).toHaveURL(/\/app\/my-issues$/);
    await expect(page.getByRole("heading", { name: "My Issues" })).toBeVisible();

    await nav.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/app\/settings$/);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("project tree switches between the list and board views", async ({ page }) => {
    await gotoList(page);
    await sidebar(page).getByRole("link", { name: "Board" }).click();
    await expect(page).toHaveURL(/\/board$/);
    await expect(page.getByRole("button", { name: "Add issue" }).first()).toBeVisible();

    await sidebar(page).getByRole("link", { name: "List" }).click();
    await expect(page).toHaveURL(/\/list$/);
    await expect(page.getByText("Task", { exact: true })).toBeVisible();
  });

  test("view tabs in the project header switch views", async ({ page }) => {
    await gotoList(page);
    await page.getByRole("link", { name: "Board" }).last().click();
    await expect(page).toHaveURL(/\/board$/);
    await page.getByRole("link", { name: "List" }).last().click();
    await expect(page).toHaveURL(/\/list$/);
  });

  test("the sidebar collapses and expands by button and by shortcut", async ({ page }) => {
    await gotoList(page);
    await expect(sidebar(page)).toHaveClass(/w-\[236px\]/);

    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(sidebar(page)).toHaveClass(/w-\[54px\]/);
    await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();

    await page.getByRole("button", { name: "Expand sidebar" }).click();
    await expect(sidebar(page)).toHaveClass(/w-\[236px\]/);

    await page.keyboard.press("[");
    await expect(sidebar(page)).toHaveClass(/w-\[54px\]/);
    await page.keyboard.press("[");
    await expect(sidebar(page)).toHaveClass(/w-\[236px\]/);
  });

  test("the project favourite toggles the sidebar Favorites section", async ({ page }) => {
    await gotoList(page);
    await expect(sidebar(page).getByText("Favorites")).toBeVisible();

    await page.getByRole("button", { name: "Favorite" }).click();
    await expect(sidebar(page).getByText("Favorites")).toHaveCount(0);

    await page.getByRole("button", { name: "Favorite" }).click();
    await expect(sidebar(page).getByText("Favorites")).toBeVisible();
  });

  test("the workspace menu links to settings", async ({ page }) => {
    await gotoList(page);
    await sidebar(page).getByRole("button", { name: /Meridian/ }).click();
    await page.getByRole("link", { name: "Workspace settings" }).click();
    await expect(page).toHaveURL(/\/app\/settings$/);
  });

  test("the top bar bell opens the inbox", async ({ page }) => {
    await gotoList(page);
    await page.getByRole("link", { name: "Inbox", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/inbox$/);
  });

  test("an issue full page has a route of its own and links back", async ({ page }) => {
    await page.goto(ROUTES.issue(ISSUES.auth.key));
    await expect(page.getByRole("heading", { name: ISSUES.auth.title })).toBeVisible();

    await page.getByRole("button", { name: "Issues", exact: true }).click();
    await expect(page).toHaveURL(/\/list$/);
  });

  test("an unknown issue key shows a not-found state", async ({ page }) => {
    await page.goto(ROUTES.issue(99999));
    await expect(page.getByText("Issue not found")).toBeVisible();
    await page.getByRole("button", { name: "Back to issues" }).click();
    await expect(page).toHaveURL(/\/list$/);
  });
});
