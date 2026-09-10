import {
  ISSUES,
  USERS,
  createModal,
  drawer,
  expect,
  gotoList,
  palette,
  test,
} from "./helpers";

test.describe("command palette", () => {
  test("opens with the mod+K shortcut and closes with Escape", async ({ page }) => {
    await gotoList(page);

    await page.keyboard.press("ControlOrMeta+k");
    await expect(palette(page)).toBeVisible();
    await expect(palette(page).getByText("Actions")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(palette(page)).toHaveCount(0);
  });

  test("opens with / and from the top bar search box", async ({ page }) => {
    await gotoList(page);

    await page.keyboard.press("/");
    await expect(palette(page)).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: /^Search issues, people, labels/ }).click();
    await expect(palette(page)).toBeVisible();
  });

  test("lists quick actions and recently updated issues when empty", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("ControlOrMeta+k");

    for (const action of ["Create new issue", "Go to List", "Go to Board", "My Issues", "Inbox", "Toggle theme"]) {
      await expect(palette(page).getByRole("button", { name: action })).toBeVisible();
    }
    await expect(palette(page).getByText("Recent")).toBeVisible();
  });

  test("searches issues by title and opens the result", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("ControlOrMeta+k");
    await palette(page).getByPlaceholder(/Search issues/).fill("redirect loops");

    await expect(palette(page).getByText("Issues")).toBeVisible();
    await palette(page).getByRole("button", { name: new RegExp(ISSUES.auth.title) }).click();

    await expect(page).toHaveURL(new RegExp(`issue=${ISSUES.auth.key}`));
    await expect(drawer(page).getByRole("heading", { name: ISSUES.auth.title })).toBeVisible();
  });

  test("searches by issue key and opens with Enter", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("ControlOrMeta+k");
    await palette(page).getByPlaceholder(/Search issues/).fill(ISSUES.board.key);
    await page.keyboard.press("Enter");

    await expect(drawer(page).getByRole("heading", { name: ISSUES.board.title })).toBeVisible();
  });

  test("arrow keys move the selection", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("ControlOrMeta+k");
    await palette(page).getByPlaceholder(/Search issues/).fill("mobile");

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/issue=\d+/);
    await expect(drawer(page)).toBeVisible();
  });

  test("finds people and filters the list by assignee", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("ControlOrMeta+k");
    await palette(page).getByPlaceholder(/Search issues/).fill(USERS.member2.first);

    await expect(palette(page).getByText("People")).toBeVisible();
    await palette(page).getByRole("button", { name: new RegExp(USERS.member2.email) }).click();

    await expect(page).toHaveURL(new RegExp(`assignee=${USERS.member2.id}`));
  });

  test("finds labels and filters the list by label", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("ControlOrMeta+k");
    await palette(page).getByPlaceholder(/Search issues/).fill("Regression");

    await expect(palette(page).getByText("Labels")).toBeVisible();
    await palette(page).getByRole("button", { name: "Regression", exact: true }).click();

    await expect(page).toHaveURL(/label=lb_regression/);
  });

  test("searches comment bodies too", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("ControlOrMeta+k");
    await palette(page).getByPlaceholder(/Search issues/).fill("zzzznotarealtoken");
    await expect(palette(page).getByText(/No results for/)).toBeVisible();

    await palette(page).getByPlaceholder(/Search issues/).fill("auth");
    await expect(palette(page).getByText("Issues")).toBeVisible();
  });

  test("navigates to the board and to My Issues", async ({ page }) => {
    await gotoList(page);

    await page.keyboard.press("ControlOrMeta+k");
    await palette(page).getByRole("button", { name: "Go to Board" }).click();
    await expect(page).toHaveURL(/\/board$/);

    await page.keyboard.press("ControlOrMeta+k");
    await palette(page).getByRole("button", { name: "My Issues" }).click();
    await expect(page).toHaveURL(/\/my-issues$/);
  });

  test("creates an issue from the palette", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("ControlOrMeta+k");
    await palette(page).getByRole("button", { name: "Create new issue" }).click();

    await expect(palette(page)).toHaveCount(0);
    await expect(createModal(page)).toBeVisible();
  });

  test("toggles the theme from the palette", async ({ page }) => {
    await gotoList(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.keyboard.press("ControlOrMeta+k");
    await palette(page).getByRole("button", { name: "Toggle theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await palette(page).getByRole("button", { name: "Toggle theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});
