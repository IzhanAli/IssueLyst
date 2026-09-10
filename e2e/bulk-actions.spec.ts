import {
  ISSUES,
  bulkBar,
  SEEDED_ISSUE_COUNT,
  USERS,
  chooseInMenu,
  expect,
  gotoList,
  issueByNumber,
  readIssues,
  row,
  rows,
  test,
  toast,
} from "./helpers";

async function select(page: import("@playwright/test").Page, title: string) {
  await row(page, title).getByRole("button", { name: "Select" }).click();
}

test.describe("bulk actions", () => {
  test("selecting rows reveals the bulk bar with a live count", async ({ page }) => {
    await gotoList(page);

    await select(page, ISSUES.auth.title);
    await expect(bulkBar(page)).toContainText("selected");
    await expect(bulkBar(page)).toContainText("1");

    await select(page, ISSUES.token.title);
    await expect(bulkBar(page)).toContainText("2");

    await row(page, ISSUES.auth.title).getByRole("button", { name: "Deselect" }).click();
    await expect(bulkBar(page)).toContainText("1");

    await bulkBar(page).getByRole("button", { name: "Clear selection" }).click();
    await expect(bulkBar(page)).toHaveCount(0);
  });

  test("the x shortcut selects the active row", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("j");
    await page.keyboard.press("x");

    await expect(bulkBar(page)).toContainText("selected");
    await expect(page.getByRole("button", { name: "Deselect" })).toHaveCount(1);
  });

  test("bulk status change moves every selected issue", async ({ page }) => {
    await gotoList(page, "?group=none");

    await select(page, ISSUES.auth.title);
    await select(page, ISSUES.token.title);

    await bulkBar(page).getByRole("button", { name: /^Status$/ }).click();
    await chooseInMenu(page, "Closed");

    await expect
      .poll(async () => {
        const a = await issueByNumber(page, Number(ISSUES.auth.key));
        const b = await issueByNumber(page, Number(ISSUES.token.key));
        return [a?.statusId, b?.statusId];
      })
      .toEqual(["st_closed", "st_closed"]);
  });

  test("bulk assign sets the assignee on every selected issue", async ({ page }) => {
    await gotoList(page, "?group=none");

    await select(page, ISSUES.shortcut.title);
    await select(page, ISSUES.board.title);

    await bulkBar(page).getByRole("button", { name: /^Assign$/ }).click();
    await chooseInMenu(page, USERS.member.name);

    await expect
      .poll(async () => {
        const a = await issueByNumber(page, Number(ISSUES.shortcut.key));
        const b = await issueByNumber(page, Number(ISSUES.board.key));
        return [a?.assigneeId, b?.assigneeId];
      })
      .toEqual([USERS.member.id, USERS.member.id]);
  });

  test("bulk delete removes the selected issues", async ({ page }) => {
    await gotoList(page);

    await select(page, ISSUES.shortcut.title);
    await select(page, ISSUES.board.title);
    await bulkBar(page).getByRole("button", { name: /^Delete$/ }).click();

    await expect(toast(page, "2 issues deleted")).toBeVisible();
    await expect(row(page, ISSUES.shortcut.title)).toHaveCount(0);
    await expect(row(page, ISSUES.board.title)).toHaveCount(0);
    await expect(rows(page)).toHaveCount(SEEDED_ISSUE_COUNT - 2);
    expect(await readIssues(page)).toHaveLength(SEEDED_ISSUE_COUNT - 2);
  });
});
