import {
  ISSUES,
  createModal,
  drawer,
  expect,
  gotoBoard,
  gotoList,
  groupHeader,
  issueByNumber,
  menu,
  openIssueFromList,
  rail,
  row,
  rows,
  sidebar,
  test,
  toast,
} from "./helpers";

test.describe("interaction details", () => {
  test("tooltips explain the top-bar actions and their shortcuts", async ({ page }) => {
    await gotoList(page);

    await page.getByRole("banner").getByRole("button", { name: "New issue" }).hover();
    const tip = page.getByRole("tooltip");
    await expect(tip).toBeVisible();
    await expect(tip).toContainText("New issue");
    await expect(tip).toContainText("C");

    await page.getByRole("heading", { name: "Engineering" }).hover();
    await expect(page.getByRole("tooltip")).toHaveCount(0);
  });

  test("a collapsed sidebar labels its icons with tooltips", async ({ page }) => {
    await gotoList(page);
    await page.getByRole("button", { name: "Collapse sidebar" }).click();

    await sidebar(page).getByRole("link").first().hover();
    await expect(page.getByRole("tooltip")).toContainText("Home");
  });

  test("the project tree collapses and expands", async ({ page }) => {
    await gotoList(page);
    await expect(sidebar(page).getByRole("link", { name: "List" })).toBeVisible();

    await sidebar(page).getByRole("button", { name: "Toggle project" }).click();
    await expect(sidebar(page).getByRole("link", { name: "List" })).toHaveCount(0);
    await expect(sidebar(page).getByRole("link", { name: "Board" })).toHaveCount(0);

    await sidebar(page).getByRole("button", { name: "Toggle project" }).click();
    await expect(sidebar(page).getByRole("link", { name: "List" })).toBeVisible();
  });

  test("picker search narrows the options", async ({ page }) => {
    await gotoList(page, "?group=priority");
    await row(page, ISSUES.shortcut.title).getByRole("button", { name: "Status" }).click();

    await menu(page).getByPlaceholder("Change status…").fill("rev");
    await expect(menu(page).getByRole("button", { name: /In Review/ })).toBeVisible();
    await expect(menu(page).getByRole("button", { name: /Backlog/ })).toHaveCount(0);

    await menu(page).getByPlaceholder("Change status…").fill("zzz");
    await expect(menu(page).getByText("No results")).toBeVisible();
  });

  test("a brand-new label can be created straight from the label picker", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    await rail(page).getByRole("button", { name: /Feature/ }).first().click();
    await expect(menu(page).getByText("Type a new name and press Enter to create")).toBeVisible();
    await menu(page).getByPlaceholder("Add label…").fill("Telemetry");
    await menu(page).getByPlaceholder("Add label…").press("Enter");

    await expect(menu(page).getByRole("button", { name: /Telemetry/ })).toBeVisible();
    await rail(page).getByText("Details", { exact: true }).click();
    await expect(rail(page).getByText("Telemetry")).toBeVisible();
    await expect
      .poll(async () => ((await issueByNumber(page, 137))?.labelIds as string[]).length)
      .toBe(3);
  });

  test("an empty group offers an inline Add issue row", async ({ page }) => {
    await gotoList(page, "?label=lb_ios");
    await expect(rows(page)).toHaveCount(1);

    await expect(groupHeader(page, "Backlog")).toContainText("0");
    const addRows = page.getByRole("button", { name: "Add issue" });
    expect(await addRows.count()).toBeGreaterThan(1);

    await addRows.first().click();
    await expect(createModal(page)).toBeVisible();
  });

  test("a board column offers Add issue at the bottom of the stack", async ({ page }) => {
    await gotoBoard(page);
    const buttons = page.getByRole("button", { name: "Add issue" });
    await buttons.last().click();
    await expect(createModal(page)).toBeVisible();
    await expect(createModal(page).getByRole("button", { name: /^Closed$/ })).toBeVisible();
  });

  test("a past due date is called out in the danger colour", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    await rail(page).getByRole("button", { name: "No due date" }).click();
    await menu(page).locator('input[type="date"]').fill("2020-01-31");
    await rail(page).getByText("Details", { exact: true }).click();

    await expect(rail(page).locator("span.text-danger").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(row(page, ISSUES.shortcut.title).locator("span.text-danger").first()).toBeVisible();

    // a future due date is not flagged
    await expect(row(page, ISSUES.auth.title).locator("span.text-danger")).toHaveCount(0);
  });

  test("toasts can be dismissed by hand", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);
    await drawer(page).getByRole("button", { name: "Copy link" }).click();

    await expect(toast(page, "Link copied to clipboard")).toBeVisible();
    await toast(page).getByRole("button", { name: "Dismiss" }).click();
    await expect(toast(page)).toHaveCount(0);
  });

  test("markdown in a description renders as rich text", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    await drawer(page).getByText("Power users want to bump priority").click();
    const body = drawer(page).getByPlaceholder("Add a description…");
    await body.fill("**Bold** and `code` and\n\n- one\n- two");
    await body.press("ControlOrMeta+Enter");

    await expect(drawer(page).locator("strong", { hasText: "Bold" })).toBeVisible();
    await expect(drawer(page).locator("code", { hasText: "code" })).toBeVisible();
    await expect(drawer(page).getByText("one")).toBeVisible();
  });

  test("Escape closes a picker without closing the drawer", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    await rail(page).getByRole("button", { name: "Backlog", exact: true }).click();
    await expect(menu(page)).toBeVisible();

    await rail(page).getByText("Details", { exact: true }).click();
    await expect(menu(page)).toHaveCount(0);
    await expect(drawer(page)).toBeVisible();
  });

  test("the create modal keeps focus in the title box", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("c");
    await expect(createModal(page).getByPlaceholder("Issue title")).toBeFocused();

    await page.keyboard.type("Focus lands where it should");
    await expect(createModal(page).getByPlaceholder("Issue title")).toHaveValue("Focus lands where it should");
  });

  test("the command palette focuses its input on open", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByPlaceholder(/Search issues, people, labels/)).toBeFocused();
  });
});
