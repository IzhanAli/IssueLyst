import { readFile } from "node:fs/promises";
import {
  SEEDED_ISSUE_COUNT,
  expect,
  gotoList,
  gotoMyIssues,
  menu,
  palette,
  test,
  toast,
} from "./helpers";

const TODAY = new Date().toISOString().slice(0, 10);

async function csvFrom(download: import("@playwright/test").Download) {
  const path = await download.path();
  return readFile(path!, "utf8");
}

test.describe("CSV export", () => {
  test("exports the current view from the project header", async ({ page }) => {
    await gotoList(page);

    await page.getByRole("button", { name: "Export to CSV" }).click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      menu(page).getByRole("button", { name: /Export current view/ }).click(),
    ]);

    expect(download.suggestedFilename()).toBe(`projex-engineering-${TODAY}.csv`);
    const csv = await csvFrom(download);
    const lines = csv.trim().split("\r\n");
    expect(lines[0]).toBe(
      "Key,Title,Status,Priority,Assignee,Labels,Due date,Reporter,Created,Updated,Comments,Attachments",
    );
    expect(lines).toHaveLength(SEEDED_ISSUE_COUNT + 1);
    expect(csv).toContain("Authentication redirect loops after session expiry");
    await expect(toast(page, `Exported ${SEEDED_ISSUE_COUNT} issues to CSV`)).toBeVisible();
  });

  test("honours the active filters and flags the view as filtered", async ({ page }) => {
    await gotoList(page, "?status=st_progress");

    await page.getByRole("button", { name: "Export to CSV" }).click();
    await expect(menu(page).getByText("filtered")).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      menu(page).getByRole("button", { name: /Export current view/ }).click(),
    ]);

    const lines = (await csvFrom(download)).trim().split("\r\n");
    expect(lines).toHaveLength(6);
    expect(lines.slice(1).every((l) => l.includes("In Progress"))).toBe(true);
  });

  test("exports everything regardless of filters", async ({ page }) => {
    await gotoList(page, "?status=st_progress");

    await page.getByRole("button", { name: "Export to CSV" }).click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      menu(page).getByRole("button", { name: /Export all issues/ }).click(),
    ]);

    const lines = (await csvFrom(download)).trim().split("\r\n");
    expect(lines).toHaveLength(SEEDED_ISSUE_COUNT + 1);
  });

  test("exports the My Issues scope", async ({ page }) => {
    await gotoMyIssues(page);

    await page.getByRole("button", { name: "Export to CSV" }).click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      menu(page).getByRole("button", { name: /Export current view/ }).click(),
    ]);

    expect(download.suggestedFilename()).toBe(`projex-my-issues-${TODAY}.csv`);
    const lines = (await csvFrom(download)).trim().split("\r\n");
    expect(lines).toHaveLength(5);
  });

  test("exports from the command palette", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("ControlOrMeta+k");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      palette(page).getByRole("button", { name: "Export all issues to CSV" }).click(),
    ]);

    expect(download.suggestedFilename()).toBe(`projex-issues-${TODAY}.csv`);
    expect((await csvFrom(download)).trim().split("\r\n")).toHaveLength(SEEDED_ISSUE_COUNT + 1);
  });

  test("quotes titles that contain commas or quotes", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("c");
    await page.getByPlaceholder("Issue title").fill('Crash when "Save, then exit" is used');
    await page.getByRole("button", { name: /^Create issue/ }).click();

    await page.getByRole("button", { name: "Export to CSV" }).click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      menu(page).getByRole("button", { name: /Export all issues/ }).click(),
    ]);

    expect(await csvFrom(download)).toContain('"Crash when ""Save, then exit"" is used"');
  });
});
