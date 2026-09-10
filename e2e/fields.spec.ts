import {
  ISSUES,
  ROUTES,
  chooseInMenu,
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
  test,
} from "./helpers";

const N = Number(ISSUES.shortcut.key);

/** Adds a custom field of the given type through Settings → Fields. */
async function createField(page: import("@playwright/test").Page, name: string, type: string) {
  await page.goto(ROUTES.settings);
  await page.getByRole("button", { name: "Fields", exact: true }).click();
  await page.getByPlaceholder("New field name…").fill(name);
  await page.getByRole("combobox").selectOption({ label: type });
  await page.getByRole("button", { name: /^Add$/ }).first().click();
  await expect(page.locator(`input[value="${name}"]`)).toBeVisible();
}

test.describe("custom field types", () => {
  test("select: changes and clears a value from the drawer", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    await rail(page).getByRole("button", { name: /^Squad 3$/ }).click();
    await chooseInMenu(page, "Squad 1");
    await expect(rail(page).getByRole("button", { name: /^Squad 1$/ })).toBeVisible();

    // Clearing drops the key entirely rather than storing an empty value.
    await rail(page).getByRole("button", { name: /^Squad 1$/ }).click();
    await menu(page).getByRole("button", { name: "Clear" }).click();
    await expect
      .poll(async () => "fd_squad" in ((await issueByNumber(page, N))?.fields as Record<string, unknown>))
      .toBe(false);
    await expect(rail(page).getByText("Squad")).toBeVisible();
  });

  test("checkbox: toggles straight from the rail and the list", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    await rail(page).getByRole("button", { name: "Confirmed?" }).click();
    await expect
      .poll(async () => (await issueByNumber(page, N))?.fields as Record<string, unknown>)
      .toMatchObject({ fd_confirmed: true });

    await rail(page).getByRole("button", { name: "Confirmed?" }).click();
    await expect
      .poll(async () => (await issueByNumber(page, N))?.fields as Record<string, unknown>)
      .toMatchObject({ fd_confirmed: false });
  });

  test("number: edits Points in place", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    await rail(page).getByRole("button", { name: /^3$/ }).click();
    const input = rail(page).locator('input[type="number"]');
    await input.fill("8");
    await input.press("Enter");

    await expect(rail(page).getByRole("button", { name: /^8$/ })).toBeVisible();
    await expect
      .poll(async () => (await issueByNumber(page, N))?.fields as Record<string, unknown>)
      .toMatchObject({ fd_points: 8 });
  });

  test("text: a new text field is editable on an issue", async ({ page }) => {
    await createField(page, "Root cause", "Text");

    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);
    await rail(page).getByRole("button", { name: /Add root cause/i }).click();
    const input = rail(page).locator('input[type="text"]');
    await input.fill("Race in the keydown handler");
    await input.press("Enter");

    await expect(rail(page).getByText("Race in the keydown handler")).toBeVisible();
    await expect
      .poll(async () => {
        const fields = (await issueByNumber(page, N))?.fields as Record<string, unknown>;
        return Object.values(fields).includes("Race in the keydown handler");
      })
      .toBe(true);
  });

  test("date: a new date field is editable on an issue", async ({ page }) => {
    await createField(page, "Target date", "Date");

    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);
    await rail(page).getByRole("button", { name: /Add target date/i }).click();
    const input = rail(page).locator('input[type="date"]').first();
    await input.fill("2031-03-09");
    await input.press("Enter");

    await expect
      .poll(async () => {
        const fields = (await issueByNumber(page, N))?.fields as Record<string, unknown>;
        return Object.values(fields).includes("2031-03-09");
      })
      .toBe(true);
  });

  test("multi-select: holds several values at once", async ({ page }) => {
    await createField(page, "Platforms", "Multi-select");
    const fieldRow = page.locator("div.rounded-lg").filter({ has: page.locator('input[value="Platforms"]') }).first();
    for (const option of ["Web", "Android"]) {
      await fieldRow.getByPlaceholder("New option…").fill(option);
      await fieldRow.getByRole("button", { name: /Add option/ }).click();
      await expect(fieldRow.locator(`input[value="${option}"]`)).toBeVisible();
    }

    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);
    await rail(page).getByRole("button", { name: /^—$|^Add platforms/i }).first().click();
    await chooseInMenu(page, "Web");
    await chooseInMenu(page, "Android");
    await rail(page).getByText("Details", { exact: true }).click();

    await expect(rail(page).getByText("Web", { exact: true })).toBeVisible();
    await expect(rail(page).getByText("Android", { exact: true })).toBeVisible();
    await expect
      .poll(async () => {
        const fields = (await issueByNumber(page, N))?.fields as Record<string, unknown>;
        return Object.values(fields).find((v) => Array.isArray(v))?.length;
      })
      .toBe(2);
  });

  test("filters the list by a checkbox field", async ({ page }) => {
    await gotoList(page);

    await page.getByRole("button", { name: /^Filter/ }).first().click();
    await chooseInMenu(page, "Yes");
    await expect(page).toHaveURL(/f\.fd_confirmed=true/);
    await page.keyboard.press("Escape");

    const shown = await rows(page).count();
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(23);
  });

  test("groups the list and the board by a checkbox field", async ({ page }) => {
    await gotoList(page, "?group=field%3Afd_confirmed");
    await expect(groupHeader(page, "Confirmed?: Yes")).toBeVisible();
    await expect(groupHeader(page, "Confirmed?: No")).toBeVisible();

    await gotoBoard(page, "?group=field%3Afd_confirmed");
    await expect(page.getByText("Confirmed?: Yes")).toBeVisible();
  });

  test("a value set in the create modal lands on the new issue", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("c");
    const modal = createModal(page);
    await modal.getByPlaceholder("Issue title").fill("Field defaults from the modal");

    await modal.getByRole("button", { name: /^Severity$/ }).click();
    await chooseInMenu(page, "S1");
    await modal.getByRole("button", { name: /^Confirmed\?$/ }).click();

    await modal.getByRole("button", { name: /^Create issue/ }).click();
    await expect(row(page, "Field defaults from the modal")).toBeVisible();

    await expect
      .poll(async () => (await issueByNumber(page, 143))?.fields as Record<string, unknown>)
      .toMatchObject({ fd_severity: "sv_1", fd_confirmed: true });
  });

  test("renaming an option updates it everywhere", async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.getByRole("button", { name: "Fields", exact: true }).click();
    const squadRow = page.locator("div.rounded-lg").filter({ has: page.locator('input[value="Squad"]') }).first();
    await squadRow.locator('input[value="Squad 3"]').fill("Platform squad");

    await gotoList(page);
    await expect(row(page, ISSUES.shortcut.title).getByText("Platform squad")).toBeVisible();

    await page.getByRole("button", { name: /^Filter/ }).first().click();
    await expect(menu(page).getByRole("button", { name: /Platform squad/ })).toBeVisible();
  });

  test("deleting a field removes its column and its values from the UI", async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.getByRole("button", { name: "Fields", exact: true }).click();
    const squadRow = page.locator("div.rounded-lg").filter({ has: page.locator('input[value="Squad"]') }).first();
    await squadRow.getByRole("button", { name: "Delete field" }).click();

    await gotoList(page);
    await expect(page.getByText("Squad", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Squad 1")).toHaveCount(0);

    await openIssueFromList(page, ISSUES.shortcut.title);
    await expect(drawer(page).getByText("Squad")).toHaveCount(0);
  });
});
