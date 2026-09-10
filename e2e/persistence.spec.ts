import {
  DATA_KEY,
  ISSUES,
  ROUTES,
  SEEDED_ISSUE_COUNT,
  UI_KEY,
  USERS,
  createModal,
  drawer,
  expect,
  gotoList,
  issueByNumber,
  menu,
  openControl,
  openIssueFromList,
  readData,
  readIssues,
  readUI,
  row,
  rows,
  sidebar,
  test,
} from "./helpers";

test.describe("persistence", () => {
  test("an issue edit survives a reload", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);
    await drawer(page).getByRole("heading", { name: ISSUES.shortcut.title }).click();
    const title = drawer(page).locator("textarea:not([placeholder])");
    await title.fill("Persisted through a reload");
    await title.press("Enter");
    await page.keyboard.press("Escape");

    await page.reload();
    await expect(row(page, "Persisted through a reload")).toBeVisible();
    await expect(row(page, ISSUES.shortcut.title)).toHaveCount(0);
  });

  test("a created issue survives a reload and numbering continues", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("c");
    await createModal(page).getByPlaceholder("Issue title").fill("First new issue");
    await createModal(page).getByRole("button", { name: /^Create issue/ }).click();
    await expect(row(page, "First new issue")).toBeVisible();

    await page.reload();
    await expect(row(page, "First new issue")).toBeVisible();
    await expect(rows(page)).toHaveCount(SEEDED_ISSUE_COUNT + 1);

    await page.keyboard.press("c");
    await createModal(page).getByPlaceholder("Issue title").fill("Second new issue");
    await createModal(page).getByRole("button", { name: /^Create issue/ }).click();

    await expect.poll(async () => (await issueByNumber(page, 144))?.title).toBe("Second new issue");
  });

  test("deleted issue numbers are never reused", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("c");
    await createModal(page).getByPlaceholder("Issue title").fill("Doomed");
    await createModal(page).getByRole("button", { name: /^Create issue/ }).click();

    await openIssueFromList(page, "Doomed");
    await drawer(page).getByRole("button", { name: "More" }).click();
    await menu(page).getByRole("button", { name: "Delete issue" }).click();
    await expect(row(page, "Doomed")).toHaveCount(0);

    await page.keyboard.press("c");
    await createModal(page).getByPlaceholder("Issue title").fill("Next one along");
    await createModal(page).getByRole("button", { name: /^Create issue/ }).click();

    await expect.poll(async () => (await issueByNumber(page, 144))?.title).toBe("Next one along");
    await expect.poll(async () => await issueByNumber(page, 143)).toBeUndefined();
  });

  test("the collapsed sidebar and favourites survive a reload", async ({ page }) => {
    await gotoList(page);
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(sidebar(page)).toHaveClass(/w-\[54px\]/);

    await page.reload();
    await expect(sidebar(page)).toHaveClass(/w-\[54px\]/);
    expect(await readUI(page)).toMatchObject({ sidebarCollapsed: true });

    await page.getByRole("button", { name: "Expand sidebar" }).click();
    await page.getByRole("button", { name: "Favorite" }).click();
    await page.reload();
    await expect(sidebar(page).getByText("Favorites")).toHaveCount(0);
    expect((await readUI(page)).favorites).toEqual([]);
  });

  test("column preferences survive a reload", async ({ page }) => {
    await gotoList(page);
    await openControl(page, /^Columns/);
    await menu(page).getByRole("button", { name: /^Squad/ }).click();
    await page.keyboard.press("Escape");

    await page.reload();
    await expect(page.getByText("Squad", { exact: true })).toHaveCount(0);
    expect((await readUI(page)).columns).toMatchObject({ fd_squad: false });
  });

  test("the session survives a reload and a direct deep link", async ({ page }) => {
    await gotoList(page);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Engineering" })).toBeVisible();

    await page.goto(`${ROUTES.list}?issue=${ISSUES.auth.key}`);
    await expect(drawer(page)).toBeVisible();
    await expect(sidebar(page).getByText(USERS.admin.name)).toBeVisible();
  });

  test("schema edits survive a reload", async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.getByRole("button", { name: "Labels", exact: true }).click();
    await page.getByPlaceholder("New label name…").fill("Persisted label");
    await page.getByRole("button", { name: /^Add$/ }).click();
    await expect(page.getByText("Labels · 12")).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: "Labels", exact: true }).click();
    await expect(page.getByText("Labels · 12")).toBeVisible();
    await expect(page.getByText("Persisted label")).toBeVisible();
  });

  test("uses the documented storage keys", async ({ page }) => {
    await gotoList(page);
    // the UI store only writes once a preference actually changes
    await page.keyboard.press("[");
    await expect(sidebar(page)).toHaveClass(/w-\[54px\]/);
    const keys = await page.evaluate(() => Object.keys(window.localStorage));

    expect(keys).toContain(DATA_KEY);
    expect(keys).toContain(UI_KEY);
    expect((await readIssues(page)).length).toBe(SEEDED_ISSUE_COUNT);
    expect(Object.keys(await readData(page))).toEqual(
      expect.arrayContaining(["issues", "comments", "activities", "notifications", "users", "statuses", "labels", "fieldDefs"]),
    );
  });
});
