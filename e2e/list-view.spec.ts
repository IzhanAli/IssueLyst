import {
  ISSUES,
  SEEDED_ISSUE_COUNT,
  STATUSES,
  USERS,
  chooseInMenu,
  closeMenu,
  drawer,
  expect,
  gotoList,
  groupHeader,
  issueByNumber,
  menu,
  openControl,
  openRowPicker,
  row,
  rows,
  test,
} from "./helpers";

test.describe("list view", () => {
  test("renders the seeded issues with their columns", async ({ page }) => {
    await gotoList(page);

    await expect(page.getByText("Task", { exact: true })).toBeVisible();
    await expect(page.getByText("Name", { exact: true })).toBeVisible();
    for (const column of ["Squad", "Environment", "Product Feature", "Severity"]) {
      await expect(page.getByText(column, { exact: true })).toBeVisible();
    }
    await expect(rows(page)).toHaveCount(SEEDED_ISSUE_COUNT);
    await expect(row(page, ISSUES.auth.title)).toBeVisible();
    await expect(row(page, ISSUES.auth.title).getByText(ISSUES.auth.key)).toBeVisible();
  });

  test("groups by status by default and collapses a group", async ({ page }) => {
    await gotoList(page);
    for (const status of STATUSES) {
      await expect(groupHeader(page, status)).toBeVisible();
    }

    const before = await rows(page).count();
    const backlog = groupHeader(page, "Backlog");
    await backlog.getByRole("button", { name: "Toggle group" }).click();

    await expect(row(page, ISSUES.shortcut.title)).toHaveCount(0);
    expect(await rows(page).count()).toBeLessThan(before);

    await backlog.getByRole("button", { name: "Toggle group" }).click();
    await expect(rows(page)).toHaveCount(before);
  });

  test("regroups by priority and by assignee", async ({ page }) => {
    await gotoList(page);

    await openControl(page, /^Group:/);
    await chooseInMenu(page, "Priority");
    await expect(page).toHaveURL(/group=priority/);
    for (const label of ["Urgent", "High", "Medium", "Low"]) {
      await expect(groupHeader(page, label)).toBeVisible();
    }

    await openControl(page, /^Group:/);
    await chooseInMenu(page, "Assignee");
    await expect(page).toHaveURL(/group=assignee/);
    await expect(groupHeader(page, USERS.admin.name)).toBeVisible();
    await expect(groupHeader(page, "Unassigned")).toBeVisible();

    await openControl(page, /^Group:/);
    await chooseInMenu(page, "None");
    await expect(page).toHaveURL(/group=none/);
    await expect(rows(page)).toHaveCount(SEEDED_ISSUE_COUNT);
  });

  test("groups by a custom field", async ({ page }) => {
    await gotoList(page);
    await openControl(page, /^Group:/);
    await chooseInMenu(page, "Severity");
    await expect(page).toHaveURL(/group=field%3Afd_severity/);
    await expect(groupHeader(page, "S1")).toBeVisible();
    await expect(rows(page)).toHaveCount(SEEDED_ISSUE_COUNT);
  });

  test("sorting writes the URL and reorders rows", async ({ page }) => {
    await gotoList(page, "?group=none");

    // The sort menu stays open on select so a direction can be flipped.
    await openControl(page, /^Sort$/);

    await chooseInMenu(page, "Priority");
    await expect(page).toHaveURL(/sort=priority%3Aasc/);
    await expect(rows(page).first()).toContainText(
      /Authentication redirect|Comment mentions|Android app crashes/,
    );

    await chooseInMenu(page, "Priority");
    await expect(page).toHaveURL(/sort=priority%3Adesc/);
    await expect(rows(page).first()).not.toContainText(ISSUES.auth.title);

    await chooseInMenu(page, "Issue ID");
    await expect(page).toHaveURL(/sort=number%3Aasc/);
    await expect(rows(page).first()).toContainText(ISSUES.emptyState.title);
  });

  test("filters by status and priority, and combines them", async ({ page }) => {
    await gotoList(page);

    await openControl(page, /^Filter/);
    await chooseInMenu(page, "In Progress");
    await expect(page).toHaveURL(/status=st_progress/);
    await closeMenu(page);
    await expect(rows(page)).toHaveCount(5);
    await expect(page.getByText("Clear all")).toHaveCount(0);

    await openControl(page, /^Filter/);
    await chooseInMenu(page, "Urgent");
    await expect(page).toHaveURL(/priority=urgent/);
    await closeMenu(page);
    await expect(rows(page)).toHaveCount(2);
    await expect(row(page, ISSUES.auth.title)).toBeVisible();
  });

  test("shows removable filter chips and a clear-all", async ({ page }) => {
    await gotoList(page, "?status=st_progress&priority=urgent");
    await expect(rows(page)).toHaveCount(2);

    const chips = page.getByRole("button", { name: "Remove filter" });
    await expect(chips).toHaveCount(2);

    await chips.first().click();
    await expect(chips).toHaveCount(1);
    await expect(page).not.toHaveURL(/status=/);

    await page.goto("/app/project/engineering/list?status=st_progress&priority=urgent");
    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(page).toHaveURL(/list$/);
    await expect(rows(page)).toHaveCount(SEEDED_ISSUE_COUNT);
  });

  test("filters by assignee, label, custom field and date window", async ({ page }) => {
    await gotoList(page);

    await openControl(page, /^Filter/);
    await chooseInMenu(page, USERS.member2.name);
    await expect(page).toHaveURL(new RegExp(`assignee=${USERS.member2.id}`));

    await chooseInMenu(page, "Bug");
    await expect(page).toHaveURL(/label=lb_bug/);

    await chooseInMenu(page, "Squad 1");
    await expect(page).toHaveURL(/f\.fd_squad=sq_1/);

    await menu(page).getByRole("button", { name: "7 days", exact: true }).first().click();
    await expect(page).toHaveURL(/cw=7/);

    await closeMenu(page);
    await expect(page.getByRole("button", { name: "Remove filter" })).toHaveCount(4);
  });

  test("filters shared through the URL are applied on load", async ({ page }) => {
    await gotoList(page, "?status=st_progress");
    await expect(rows(page)).toHaveCount(5);
    await expect(page.getByText("In Progress").first()).toBeVisible();
  });

  test("shows an empty state when nothing matches", async ({ page }) => {
    await page.goto("/app/project/engineering/list?status=st_closed&priority=urgent");
    await expect(page.getByText("No matching issues")).toBeVisible();
    await expect(rows(page)).toHaveCount(0);
  });

  test("toggles field columns", async ({ page }) => {
    await gotoList(page);
    await expect(page.getByText("Squad", { exact: true })).toBeVisible();

    await openControl(page, /^Columns/);
    await menu(page).getByRole("button", { name: /^Squad/ }).click();
    await closeMenu(page);
    await expect(page.getByText("Squad", { exact: true })).toHaveCount(0);

    await openControl(page, /^Columns/);
    await menu(page).getByRole("button", { name: /^Sprint/ }).click();
    await closeMenu(page);
    await expect(page.getByText("Sprint", { exact: true })).toBeVisible();
  });

  test("the group header reveals its add button on hover", async ({ page }) => {
    await gotoList(page);
    const add = page.getByRole("button", { name: "Add issue to group" }).first();
    const header = page.locator("section > div").filter({ has: add }).first();

    expect(await add.evaluate((el) => getComputedStyle(el).opacity)).toBe("0");

    await header.hover();
    await expect.poll(async () => add.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  });

  test("the group header add button creates an issue in that group", async ({ page }) => {
    await gotoList(page);
    const backlog = groupHeader(page, "Backlog");
    await backlog.hover();
    await backlog.getByRole("button", { name: "Add issue to group" }).click();

    await expect(page.getByRole("dialog").getByRole("button", { name: /^Backlog$/ })).toBeVisible();
  });

  test("keyboard navigation moves the active row and opens it", async ({ page }) => {
    await gotoList(page);

    await page.keyboard.press("j");
    await expect(page.locator('div[data-active="true"]')).toHaveCount(1);
    const firstTitle = (await rows(page).first().textContent()) ?? "";

    await page.keyboard.press("j");
    await page.keyboard.press("k");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\?issue=\d+/);
    await expect(drawer(page)).toBeVisible();
    const heading = await drawer(page).getByRole("heading").first().textContent();
    expect(firstTitle).toContain(heading ?? "");
  });

  test("edits priority inline from a row", async ({ page }) => {
    await gotoList(page);
    await openRowPicker(page, ISSUES.shortcut.title, "Priority");
    await chooseInMenu(page, "Urgent");

    await expect
      .poll(async () => (await issueByNumber(page, Number(ISSUES.shortcut.key)))?.priority)
      .toBe("urgent");
  });

  test("edits assignee inline from a row", async ({ page }) => {
    await gotoList(page);
    await openRowPicker(page, ISSUES.shortcut.title, "Assignee");
    await chooseInMenu(page, USERS.member2.name);

    await expect
      .poll(async () => (await issueByNumber(page, Number(ISSUES.shortcut.key)))?.assigneeId)
      .toBe(USERS.member2.id);
    await expect(row(page, ISSUES.shortcut.title).getByTitle(USERS.member2.name)).toBeVisible();
  });

  test("edits status inline and the row moves group", async ({ page }) => {
    await gotoList(page, "?group=priority");
    await openRowPicker(page, ISSUES.shortcut.title, "Status");
    await chooseInMenu(page, "Done");

    await expect
      .poll(async () => (await issueByNumber(page, Number(ISSUES.shortcut.key)))?.statusId)
      .toBe("st_done");

    await page.goto("/app/project/engineering/list");
    await groupHeader(page, "Backlog").getByRole("button", { name: "Toggle group" }).click();
    await expect(row(page, ISSUES.shortcut.title)).toBeVisible();
  });

  test("edits a custom field value inline", async ({ page }) => {
    await gotoList(page);
    // issue 137 is seeded into Squad 3 (deterministic from its number)
    await row(page, ISSUES.shortcut.title).getByRole("button", { name: /^Squad/ }).click();
    await expect(menu(page)).toBeVisible();
    await chooseInMenu(page, "Squad 2");

    await expect
      .poll(async () => {
        const issue = await issueByNumber(page, Number(ISSUES.shortcut.key));
        return (issue?.fields as Record<string, string>)?.fd_squad;
      })
      .toBe("sq_2");
  });
});
