import {
  ISSUES,
  ROUTES,
  USERS,
  bulkBar,
  chooseInMenu,
  drawer,
  expect,
  gotoList,
  issueByNumber,
  menu,
  openIssueFromList,
  openRowPicker,
  row,
  test,
} from "./helpers";

test.describe("member (non-admin) permissions", () => {
  test.use({ userId: USERS.member.id });

  test("signs in as a member", async ({ page }) => {
    await page.goto(ROUTES.settings);
    await expect(page.getByRole("main").getByText(USERS.member.name)).toBeVisible();
    await expect(page.getByRole("main").getByText("member", { exact: true })).toBeVisible();
  });

  test("cannot delete an issue from the drawer", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);

    await drawer(page).getByRole("button", { name: "More" }).click();
    await expect(menu(page).getByRole("button", { name: "Copy link" })).toBeVisible();
    await expect(menu(page).getByRole("button", { name: "Delete issue" })).toHaveCount(0);
  });

  test("has no bulk delete action", async ({ page }) => {
    await gotoList(page);
    await row(page, ISSUES.auth.title).getByRole("button", { name: "Select" }).click();

    await expect(bulkBar(page)).toContainText("selected");
    await expect(bulkBar(page).getByRole("button", { name: /^Status$/ })).toBeVisible();
    await expect(bulkBar(page).getByRole("button", { name: /^Delete$/ })).toHaveCount(0);
  });

  test("can still create and edit issues", async ({ page }) => {
    await gotoList(page);
    await openRowPicker(page, ISSUES.shortcut.title, "Priority");
    await chooseInMenu(page, "Urgent");

    await expect
      .poll(async () => (await issueByNumber(page, Number(ISSUES.shortcut.key)))?.priority)
      .toBe("urgent");
  });

  test("sees read-only banners on schema settings", async ({ page }) => {
    await page.goto(ROUTES.settings);

    await page.getByRole("button", { name: "Fields", exact: true }).click();
    await expect(page.getByText("Only admins can manage fields.")).toBeVisible();
    await expect(page.getByPlaceholder("New field name…")).toBeDisabled();

    await page.getByRole("button", { name: "Labels", exact: true }).click();
    await expect(page.getByText("Only admins can manage labels.")).toBeVisible();
    await expect(page.getByPlaceholder("New label name…")).toBeDisabled();
  });

  test("cannot reset the demo data or open project setup", async ({ page }) => {
    await page.goto(ROUTES.settings);

    await expect(page.getByRole("button", { name: /^Reset$/ })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Set up project" })).toHaveCount(0);
  });

  test("is turned away from the onboarding route", async ({ page }) => {
    await page.goto(ROUTES.onboarding);

    await expect(page.getByRole("heading", { name: "Admins only" })).toBeVisible();
    await page.getByRole("button", { name: "Back to app" }).click();
    await expect(page).toHaveURL(/\/list$/);
  });
});

test.describe("admin permissions", () => {
  test("admins keep delete, schema management and project setup", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);
    await drawer(page).getByRole("button", { name: "More" }).click();
    await expect(menu(page).getByRole("button", { name: "Delete issue" })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.goto(ROUTES.settings);
    await expect(page.getByRole("button", { name: "Set up project" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Reset$/ })).toBeEnabled();

    await page.getByRole("button", { name: "Fields", exact: true }).click();
    await expect(page.getByText("Only admins can manage")).toHaveCount(0);
    await expect(page.getByPlaceholder("New field name…")).toBeEnabled();
  });
});
