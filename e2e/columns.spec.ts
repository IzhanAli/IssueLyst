import {
  ISSUES,
  columnOrder,
  drawer,
  dragTo,
  expect,
  gotoList,
  menu,
  openControl,
  openIssueFromList,
  rail,
  readUI,
  test,
} from "./helpers";

const handle = (page: import("@playwright/test").Page, field: string) =>
  page.getByTitle(`${field} — drag to reorder`);

test.describe("list columns", () => {
  test("start in field order", async ({ page }) => {
    await gotoList(page);
    expect(await columnOrder(page)).toEqual(["Squad", "Environment", "Product Feature", "Severity"]);
  });

  test("reorder by dragging a column header to the right", async ({ page }) => {
    await gotoList(page);

    await dragTo(page, handle(page, "Squad"), handle(page, "Environment"));

    await expect
      .poll(async () => columnOrder(page))
      .toEqual(["Environment", "Squad", "Product Feature", "Severity"]);
  });

  test("reorder by dragging a column header to the left", async ({ page }) => {
    await gotoList(page);

    await dragTo(page, handle(page, "Severity"), handle(page, "Squad"));

    await expect
      .poll(async () => columnOrder(page))
      .toEqual(["Squad", "Severity", "Environment", "Product Feature"]);
  });

  test("the new order survives a reload", async ({ page }) => {
    await gotoList(page);
    await dragTo(page, handle(page, "Squad"), handle(page, "Environment"));
    await expect.poll(async () => (await columnOrder(page))[0]).toBe("Environment");

    await page.reload();
    await expect
      .poll(async () => columnOrder(page))
      .toEqual(["Environment", "Squad", "Product Feature", "Severity"]);
    await expect.poll(async () => (await readUI(page)).columnOrder).toBeTruthy();
  });

  test("visibility changes survive a reload", async ({ page }) => {
    await gotoList(page);

    await openControl(page, /^Columns/);
    await menu(page).getByRole("button", { name: /^Severity/ }).click();
    await menu(page).getByRole("button", { name: /^Points/ }).click();
    await page.keyboard.press("Escape");

    await expect(page.getByText("Severity", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Points", { exact: true })).toBeVisible();

    await page.reload();
    await expect
      .poll(async () => columnOrder(page))
      .toEqual(["Squad", "Environment", "Product Feature", "Points"]);
  });

  test("the Columns menu shows how many columns are on", async ({ page }) => {
    await gotoList(page);
    await expect(page.getByRole("button", { name: /^Columns 4/ })).toBeVisible();

    await openControl(page, /^Columns/);
    await menu(page).getByRole("button", { name: /^Sprint/ }).click();
    await page.keyboard.press("Escape");

    await expect(page.getByRole("button", { name: /^Columns 5/ })).toBeVisible();
  });

  test("a hidden field is still editable in the drawer", async ({ page }) => {
    await gotoList(page);
    await openControl(page, /^Columns/);
    await menu(page).getByRole("button", { name: /^Squad/ }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Squad", { exact: true })).toHaveCount(0);

    await openIssueFromList(page, ISSUES.shortcut.title);
    await expect(rail(page).getByText("Squad", { exact: true })).toBeVisible();
    await expect(rail(page).getByRole("button", { name: /^Squad 3$/ })).toBeVisible();
  });

  test("the board is unaffected by list column settings", async ({ page }) => {
    await gotoList(page);
    await openControl(page, /^Columns/);
    await menu(page).getByRole("button", { name: /^Squad/ }).click();
    await page.keyboard.press("Escape");

    await page.getByRole("link", { name: "Board" }).last().click();
    await expect(page.getByText(ISSUES.auth.title)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Columns/ })).toHaveCount(0);
  });

  test("column order is per-user, not per-view", async ({ page }) => {
    await gotoList(page);
    await dragTo(page, handle(page, "Squad"), handle(page, "Environment"));
    await expect.poll(async () => (await columnOrder(page))[0]).toBe("Environment");

    await page.goto("/app/my-issues");
    await expect(drawer(page)).toHaveCount(0);
    await expect.poll(async () => (await columnOrder(page))[0]).toBe("Environment");
  });
});
