import { ROUTES, expect, gotoList, sidebar, test, toast } from "./helpers";

test.describe("project setup wizard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.onboarding);
    await expect(page.getByText("Step 1 of 5")).toBeVisible();
  });

  test("walks forward and back through all five steps", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Project", exact: true })).toBeVisible();

    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Step 2 of 5")).toBeVisible();
    await expect(page.getByText("Define the statuses issues move through.")).toBeVisible();

    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Step 3 of 5")).toBeVisible();

    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Step 4 of 5")).toBeVisible();

    await page.getByRole("button", { name: /Continue/ }).click();
    await expect(page.getByText("Step 5 of 5")).toBeVisible();
    await expect(page.getByRole("button", { name: /Launch project/ })).toBeVisible();

    await page.getByRole("button", { name: /^Back/ }).click();
    await expect(page.getByText("Step 4 of 5")).toBeVisible();
  });

  test("Continue is blocked until the project has a name", async ({ page }) => {
    const name = page.getByPlaceholder("e.g. Engineering");
    await expect(name).toHaveValue("Engineering");

    await name.fill("");
    await expect(page.getByRole("button", { name: /Continue/ })).toBeDisabled();

    await name.fill("Platform");
    await expect(page.getByRole("button", { name: /Continue/ })).toBeEnabled();
  });

  test("Cancel on the first step returns to the app", async ({ page }) => {
    await page.getByRole("button", { name: /Cancel/ }).click();
    await expect(page).toHaveURL(/\/list$/);
  });

  test("the review step summarises the drafted project", async ({ page }) => {
    await page.getByPlaceholder("e.g. Engineering").fill("Platform");
    await page.getByPlaceholder("What does this project track?").fill("Runtime and infra work.");
    await page.getByRole("button", { name: /Continue/ }).click();

    await page.getByRole("button", { name: /Add status/ }).click();
    await expect(page.locator('input[value="New status"]')).toBeVisible();
    await page.getByRole("button", { name: /Continue/ }).click();

    await page.getByPlaceholder("New field name…").fill("Owning team");
    await page.getByRole("button", { name: /^Add$/ }).first().click();
    await page.getByRole("button", { name: /Continue/ }).click();

    await page.getByPlaceholder("New label…").fill("Infra");
    await page.getByRole("button", { name: /^Add$/ }).first().click();
    await page.getByRole("button", { name: /Continue/ }).click();

    await expect(page.getByText("Platform", { exact: true })).toBeVisible();
    await expect(page.getByText("Runtime and infra work.")).toBeVisible();
    await expect(page.getByText("7 statuses")).toBeVisible();
    await expect(page.getByText("10 custom fields")).toBeVisible();
    await expect(page.getByText("12 labels")).toBeVisible();
  });

  test("launching applies the draft to the whole app", async ({ page }) => {
    await page.getByPlaceholder("e.g. Engineering").fill("Platform");
    await page.getByPlaceholder("ENG", { exact: true }).fill("plt");

    for (let i = 0; i < 4; i++) await page.getByRole("button", { name: /Continue/ }).click();
    await page.getByRole("button", { name: /Launch project/ }).click();

    await expect(toast(page, "Platform is ready")).toBeVisible();
    await expect(page).toHaveURL(/\/list$/);
    await expect(page.getByRole("heading", { name: "Platform" })).toBeVisible();
    await expect(sidebar(page).getByRole("link", { name: "Platform" }).first()).toBeVisible();
  });

  test("statuses removed in the wizard disappear from the list view", async ({ page }) => {
    await page.getByRole("button", { name: /Continue/ }).click();

    const closedRow = page.locator("div.rounded-lg").filter({ has: page.locator('input[value="Closed"]') }).first();
    await closedRow.getByRole("button").last().click();
    await expect(page.locator('input[value="Closed"]')).toHaveCount(0);

    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /Continue/ }).click();
    await page.getByRole("button", { name: /Launch project/ }).click();

    await gotoList(page);
    await expect(page.getByText("Closed", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Backlog", { exact: true })).toBeVisible();
  });
});
