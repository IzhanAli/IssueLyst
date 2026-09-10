import {
  ISSUES,
  ROUTES,
  SEEDED_ISSUE_COUNT,
  bulkBar,
  chooseInMenu,
  drawer,
  expect,
  gotoList,
  groupHeader,
  issueByNumber,
  menu,
  openIssueFromList,
  openRowPicker,
  rail,
  readData,
  row,
  rows,
  sidebar,
  test,
} from "./helpers";

test.describe("data integrity", () => {
  test("deleting an issue takes its comments, activity, attachments and notifications with it", async ({ page }) => {
    await gotoList(page);
    const before = await readData(page);
    const issueId = "iss_142";
    expect(before.comments.some((c) => c.issueId === issueId)).toBe(true);
    expect(before.activities.some((a) => a.issueId === issueId)).toBe(true);
    expect(before.attachments.some((a) => a.issueId === issueId)).toBe(true);
    expect(before.notifications.some((n) => n.issueId === issueId)).toBe(true);

    await openIssueFromList(page, ISSUES.auth.title);
    await drawer(page).getByRole("button", { name: "More" }).click();
    await menu(page).getByRole("button", { name: "Delete issue" }).click();
    await expect(row(page, ISSUES.auth.title)).toHaveCount(0);

    await expect
      .poll(async () => {
        const after = await readData(page);
        return [
          after.issues.some((i) => i.id === issueId),
          after.comments.some((c) => c.issueId === issueId),
          after.activities.some((a) => a.issueId === issueId),
          after.attachments.some((a) => a.issueId === issueId),
          after.notifications.some((n) => n.issueId === issueId),
        ];
      })
      .toEqual([false, false, false, false, false]);
  });

  test("the inbox drops notifications for a deleted issue", async ({ page }) => {
    await page.goto(ROUTES.inbox);
    await expect(page.getByText("mentioned you")).toBeVisible();

    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);
    await drawer(page).getByRole("button", { name: "More" }).click();
    await menu(page).getByRole("button", { name: "Delete issue" }).click();

    await page.goto(ROUTES.inbox);
    await expect(page.getByText("mentioned you")).toHaveCount(0);
    await expect(sidebar(page).getByRole("link", { name: "Inbox 2" })).toBeVisible();
  });

  test("deleting a label removes it from every issue", async ({ page }) => {
    await gotoList(page);
    await expect(row(page, ISSUES.auth.title).getByText("Auth", { exact: true })).toBeVisible();

    await page.goto(ROUTES.settings);
    await page.getByRole("button", { name: "Labels", exact: true }).click();
    const chip = page.locator("span").filter({ hasText: /^Auth$/ }).first();
    await chip.hover();
    await chip.getByRole("button", { name: "Delete label" }).click();
    await expect(page.getByText("Labels · 10")).toBeVisible();

    await gotoList(page);
    await expect(row(page, ISSUES.auth.title).getByText("Auth", { exact: true })).toHaveCount(0);
    await expect
      .poll(async () => (await issueByNumber(page, 142))?.labelIds)
      .not.toContain("lb_auth");

    await page.getByRole("button", { name: /^Filter/ }).first().click();
    await expect(menu(page).getByRole("button", { name: "Auth", exact: true })).toHaveCount(0);
  });

  test("closing an issue stamps closedAt, reopening clears it", async ({ page }) => {
    await gotoList(page, "?group=priority");

    await openRowPicker(page, ISSUES.shortcut.title, "Status");
    await chooseInMenu(page, "Done");
    await expect
      .poll(async () => typeof (await issueByNumber(page, 137))?.closedAt)
      .toBe("string");

    await openRowPicker(page, ISSUES.shortcut.title, "Status");
    await chooseInMenu(page, "Open");
    await expect.poll(async () => (await issueByNumber(page, 137))?.closedAt).toBeNull();
  });

  test("the sidebar open count follows status changes", async ({ page }) => {
    await gotoList(page, "?group=priority");
    await expect(sidebar(page).getByText("18", { exact: true })).toBeVisible();

    await openRowPicker(page, ISSUES.shortcut.title, "Status");
    await chooseInMenu(page, "Done");
    await expect(sidebar(page).getByText("17", { exact: true })).toBeVisible();

    await openRowPicker(page, ISSUES.shortcut.title, "Status");
    await chooseInMenu(page, "Backlog");
    await expect(sidebar(page).getByText("18", { exact: true })).toBeVisible();
  });

  test("group counts always add up to the rows on screen", async ({ page }) => {
    await gotoList(page);
    const total = await rows(page).count();
    expect(total).toBe(SEEDED_ISSUE_COUNT);

    await expect(groupHeader(page, "Backlog")).toContainText("4");
    await expect(groupHeader(page, "Open")).toContainText("6");
    await expect(groupHeader(page, "In Progress")).toContainText("5");
    await expect(groupHeader(page, "In Review")).toContainText("3");
    await expect(groupHeader(page, "Done")).toContainText("3");
    await expect(groupHeader(page, "Closed")).toContainText("2");
  });

  test("a bulk delete leaves the store consistent", async ({ page }) => {
    await gotoList(page);
    await row(page, ISSUES.auth.title).getByRole("button", { name: "Select" }).click();
    await row(page, ISSUES.token.title).getByRole("button", { name: "Select" }).click();
    await bulkBar(page).getByRole("button", { name: /^Delete$/ }).click();

    await expect(rows(page)).toHaveCount(SEEDED_ISSUE_COUNT - 2);
    const after = await readData(page);
    expect(after.issues).toHaveLength(SEEDED_ISSUE_COUNT - 2);
    expect(after.comments.some((c) => c.issueId === "iss_142" || c.issueId === "iss_141")).toBe(false);
    expect(after.activities.some((a) => a.issueId === "iss_142" || a.issueId === "iss_141")).toBe(false);
  });

  test("deleting a field strips its values from every issue", async ({ page }) => {
    await gotoList(page);
    expect(Object.keys((await issueByNumber(page, 137))?.fields as object)).toContain("fd_squad");

    await page.goto(ROUTES.settings);
    await page.getByRole("button", { name: "Fields", exact: true }).click();
    const squadRow = page.locator("div.rounded-lg").filter({ has: page.locator('input[value="Squad"]') }).first();
    await squadRow.getByRole("button", { name: "Delete field" }).click();

    await expect
      .poll(async () => Object.keys((await issueByNumber(page, 137))?.fields as object))
      .not.toContain("fd_squad");

    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);
    await expect(rail(page).getByText("Squad", { exact: true })).toHaveCount(0);
  });

  test("resetting the demo data restores the full seed", async ({ page }) => {
    await gotoList(page);
    await row(page, ISSUES.auth.title).getByRole("button", { name: "Select" }).click();
    await bulkBar(page).getByRole("button", { name: /^Delete$/ }).click();
    await expect(rows(page)).toHaveCount(SEEDED_ISSUE_COUNT - 1);

    await page.goto(ROUTES.settings);
    await page.getByRole("button", { name: /^Reset$/ }).click();

    await gotoList(page);
    await expect(rows(page)).toHaveCount(SEEDED_ISSUE_COUNT);
    const after = await readData(page);
    expect(after.comments.length).toBeGreaterThan(0);
    expect(after.notifications.filter((n) => !n.readAt)).toHaveLength(3);
  });
});
