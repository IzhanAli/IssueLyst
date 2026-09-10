import {
  SEEDED_ISSUE_COUNT,
  USERS,
  createModal,
  expect,
  gotoList,
  readIssues,
  row,
  rows,
  test,
  toast,
} from "./helpers";
import { ROUTES } from "./helpers";

async function openTab(page: import("@playwright/test").Page, name: string) {
  await page.getByRole("button", { name, exact: true }).click();
}

test.describe("settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.settings);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("shows the workspace context and the profile card", async ({ page }) => {
    await expect(page.getByText("Meridian workspace · Engineering")).toBeVisible();
    const main = page.getByRole("main");
    await expect(main.getByText(USERS.admin.name)).toBeVisible();
    await expect(main.getByText(USERS.admin.email)).toBeVisible();
    await expect(main.getByText("admin", { exact: true })).toBeVisible();
  });

  test("switches between every tab", async ({ page }) => {
    await openTab(page, "Team");
    await expect(page.getByText("Members · 8")).toBeVisible();
    await expect(page.getByText(USERS.member2.email)).toBeVisible();

    await openTab(page, "Fields");
    await expect(page.getByText("Custom fields · 9")).toBeVisible();

    await openTab(page, "Labels");
    await expect(page.getByText("Labels · 11")).toBeVisible();

    await openTab(page, "Statuses");
    await expect(page.getByText("Workflow statuses")).toBeVisible();
    await expect(page.getByText("In Progress")).toBeVisible();
    await expect(page.getByText("canceled")).toBeVisible();

    await openTab(page, "Profile");
    await expect(page.getByText("Appearance")).toBeVisible();
  });

  test("switches the theme and remembers it across a reload", async ({ page }) => {
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.getByRole("button", { name: "dark", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.getByRole("button", { name: "light", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("creates and deletes a label", async ({ page }) => {
    await openTab(page, "Labels");

    await page.getByPlaceholder("New label name…").fill("Flaky");
    await page.getByRole("button", { name: /^Add$/ }).click();

    await expect(toast(page, "Label created")).toBeVisible();
    await expect(page.getByText("Labels · 12")).toBeVisible();

    const chip = page.locator("span").filter({ hasText: /^Flaky$/ }).first();
    await chip.hover();
    await page.getByRole("button", { name: "Delete label" }).last().click();
    await expect(page.getByText("Labels · 11")).toBeVisible();
  });

  test("a label created here is offered on an issue", async ({ page }) => {
    await openTab(page, "Labels");
    await page.getByPlaceholder("New label name…").fill("Telemetry");
    await page.getByRole("button", { name: /^Add$/ }).click();
    await expect(page.getByText("Labels · 12")).toBeVisible();

    await gotoList(page);
    await page.keyboard.press("c");
    await createModal(page).getByRole("button", { name: /Labels$/ }).click();
    await expect(page.getByPlaceholder("Add label…")).toBeVisible();
    await page.getByPlaceholder("Add label…").fill("Telemetry");
    await expect(page.getByRole("menu").getByText("Telemetry")).toBeVisible();
  });

  test("creates a field with options, then deletes it", async ({ page }) => {
    await openTab(page, "Fields");

    await page.getByPlaceholder("New field name…").fill("QA Owner");
    await page.getByRole("button", { name: /^Add$/ }).click();
    await expect(toast(page, "Field created")).toBeVisible();
    await expect(page.getByText("Custom fields · 10")).toBeVisible();

    const fieldRow = page.locator("div.rounded-lg").filter({ has: page.locator('input[value="QA Owner"]') }).first();
    await expect(fieldRow.getByText("No options yet — add one below.")).toBeVisible();
    await fieldRow.getByPlaceholder("New option…").fill("Priya");
    await fieldRow.getByRole("button", { name: /Add option/ }).click();
    await expect(fieldRow.locator('input[value="Priya"]')).toBeVisible();

    await fieldRow.getByRole("button", { name: "Delete option" }).click();
    await expect(fieldRow.getByText("No options yet — add one below.")).toBeVisible();

    await fieldRow.getByRole("button", { name: "Delete field" }).click();
    await expect(toast(page, "Field deleted")).toBeVisible();
    await expect(page.getByText("Custom fields · 9")).toBeVisible();
  });

  test("renaming a field renames its list column", async ({ page }) => {
    await openTab(page, "Fields");
    const squad = page.locator('input[value="Squad"]');
    await squad.fill("Team pod");

    await gotoList(page);
    await expect(page.getByText("Team pod", { exact: true })).toBeVisible();
    await expect(page.getByText("Squad", { exact: true })).toHaveCount(0);
  });

  test("toggling a field's Column checkbox changes the list", async ({ page }) => {
    await openTab(page, "Fields");
    const sprintRow = page
      .locator("div.rounded-lg")
      .filter({ has: page.locator('input[value="Sprint"]') })
      .first();
    await sprintRow.getByRole("checkbox").check();

    await gotoList(page);
    await expect(page.getByText("Sprint", { exact: true })).toBeVisible();
  });

  test("resets the prototype data back to the seed", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("c");
    await createModal(page).getByPlaceholder("Issue title").fill("Scratch issue");
    await createModal(page).getByRole("button", { name: /^Create issue/ }).click();
    await expect(row(page, "Scratch issue")).toBeVisible();

    await page.goto(ROUTES.settings);
    await page.getByRole("button", { name: /^Reset$/ }).click();
    await expect(toast(page, "Demo data reset")).toBeVisible();

    await gotoList(page);
    await expect(row(page, "Scratch issue")).toHaveCount(0);
    await expect(rows(page)).toHaveCount(SEEDED_ISSUE_COUNT);
    expect(await readIssues(page)).toHaveLength(SEEDED_ISSUE_COUNT);
  });

  test("admins can reach the project setup wizard", async ({ page }) => {
    await page.getByRole("button", { name: "Set up project" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByText("Step 1 of 5")).toBeVisible();
    await expect(page.getByText("Name your project and give it an identity.")).toBeVisible();
  });
});
