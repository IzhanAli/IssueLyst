import {
  ISSUES,
  boardColumn,
  createModal,
  drawer,
  expect,
  gotoBoard,
  gotoList,
  openIssueFromList,
  rail,
  row,
  rows,
  sidebar,
  test,
} from "./helpers";

async function noHorizontalPageScroll(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth <= doc.clientWidth && document.body.scrollWidth <= doc.clientWidth;
  });
}

test.describe("responsive layout", () => {
  test("the page itself never scrolls sideways", async ({ page }) => {
    for (const width of [1440, 1100, 900, 700]) {
      await page.setViewportSize({ width, height: 800 });
      await gotoList(page);
      expect(await noHorizontalPageScroll(page), `list at ${width}px`).toBe(true);

      await gotoBoard(page);
      expect(await noHorizontalPageScroll(page), `board at ${width}px`).toBe(true);
    }
  });

  test("wide screens show labels and field columns", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoList(page);

    await expect(page.getByText("Squad", { exact: true })).toBeVisible();
    await expect(row(page, ISSUES.auth.title).getByText("Auth", { exact: true })).toBeVisible();
  });

  test("medium screens drop row labels but keep field columns", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await gotoList(page);

    await expect(page.getByText("Squad", { exact: true })).toBeVisible();
    await expect(row(page, ISSUES.auth.title).getByText("Auth", { exact: true })).toBeHidden();
    await expect(rows(page)).toHaveCount(23);
  });

  test("narrow screens fall back to the essentials and stay usable", async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await gotoList(page);

    await expect(page.getByText("Squad", { exact: true })).toBeHidden();
    await expect(row(page, ISSUES.auth.title)).toBeVisible();

    await openIssueFromList(page, ISSUES.auth.title);
    await expect(rail(page)).toBeHidden();
    await expect(drawer(page).getByRole("heading", { name: ISSUES.auth.title })).toBeVisible();
    await expect(drawer(page).getByPlaceholder(/Add a comment/)).toBeVisible();
  });

  test("the drawer property rail appears from the medium breakpoint up", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);
    await expect(rail(page)).toBeVisible();
    await expect(rail(page).getByText("Details")).toBeVisible();
  });

  test("the board scrolls its own columns instead of the page", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await gotoBoard(page);

    await expect(boardColumn(page, "Backlog")).toBeVisible();
    const scroller = page.locator('div[class*="overflow-x-auto"]').first();
    expect(await scroller.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    expect(await noHorizontalPageScroll(page)).toBe(true);
  });

  test("the sidebar can be collapsed to reclaim width on a small screen", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 800 });
    await gotoList(page);

    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(sidebar(page)).toHaveClass(/w-\[54px\]/);
    await expect(row(page, ISSUES.auth.title)).toBeVisible();
    expect(await noHorizontalPageScroll(page)).toBe(true);
  });

  test("the create modal fits a narrow screen", async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await gotoList(page);
    await page.keyboard.press("c");

    const box = await createModal(page).boundingBox();
    expect(box!.width).toBeLessThanOrEqual(700);
    await createModal(page).getByPlaceholder("Issue title").fill("Filed from a small screen");
    await createModal(page).getByRole("button", { name: /^Create issue/ }).click();
    await expect(row(page, "Filed from a small screen")).toBeVisible();
  });
});
