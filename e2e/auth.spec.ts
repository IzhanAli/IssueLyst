import { ROUTES, USERS, expect, gotoLogin, openUserMenu, signInWithForm, test } from "./helpers";

test.describe("authentication", () => {
  test.describe("signed out", () => {
    test.use({ userId: null });

    test("protected app routes redirect to the login screen", async ({ page }) => {
      await page.goto(ROUTES.list);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    });

    test("login screen offers the seeded demo accounts", async ({ page }) => {
      await gotoLogin(page);
      await expect(page.getByText("Meridian workspace · Engineering")).toBeVisible();
      await expect(page.getByText("Or use a demo account")).toBeVisible();
      await expect(page.getByRole("button", { name: new RegExp(USERS.admin.name) })).toBeVisible();
      await expect(page.getByRole("button", { name: new RegExp(USERS.member.name) })).toBeVisible();
    });

    test("rejects an email that matches no account", async ({ page }) => {
      await signInWithForm(page, "nobody@example.com");
      await expect(page.getByText("No account matches that email.")).toBeVisible();
      await expect(page).toHaveURL(/\/login$/);
    });

    test("requires a password", async ({ page }) => {
      await gotoLogin(page);
      await page.getByLabel("Email").fill(USERS.admin.email);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page.getByText("Enter your password.")).toBeVisible();
    });

    test("signs in with the form and lands on the issue list", async ({ page }) => {
      await signInWithForm(page, USERS.admin.email);
      await expect(page).toHaveURL(/\/app\/project\/engineering\/list$/);
      await expect(page.getByRole("heading", { name: "Engineering" })).toBeVisible();
      await expect(page.locator("aside").first().getByText(USERS.admin.name)).toBeVisible();
    });

    test("signs in with a demo account", async ({ page }) => {
      await gotoLogin(page);
      await page.getByRole("button", { name: new RegExp(USERS.member.name) }).click();
      await expect(page).toHaveURL(/\/app\/project\/engineering\/list$/);
      await expect(page.locator("aside").first().getByText(USERS.member.name)).toBeVisible();
    });

    test("email matching is case-insensitive", async ({ page }) => {
      await signInWithForm(page, USERS.admin.email.toUpperCase());
      await expect(page).toHaveURL(/\/app\//);
    });
  });

  test.describe("signed in", () => {
    test("visiting the login screen bounces back into the app", async ({ page }) => {
      await page.goto(ROUTES.login);
      await expect(page).toHaveURL(/\/app\/project\/engineering\/list$/);
    });

    test("signs out from the user menu and blocks the app again", async ({ page }) => {
      await page.goto(ROUTES.list);
      await openUserMenu(page, USERS.admin.name);
      await page.getByRole("button", { name: "Sign out" }).click();

      await expect(page).toHaveURL(/\/login$/);
      await page.goto(ROUTES.myIssues);
      await expect(page).toHaveURL(/\/login$/);
    });

    test("switches the acting user from the user menu", async ({ page }) => {
      await page.goto(ROUTES.list);
      await openUserMenu(page, USERS.admin.name);
      await page.getByRole("button", { name: /Switch user/ }).click();
      await page.getByRole("button", { name: new RegExp(USERS.member.name) }).click();

      await expect(page.locator("aside").first().getByText(USERS.member.name)).toBeVisible();
    });
  });
});
