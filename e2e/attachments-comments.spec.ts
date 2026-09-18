import { writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  ISSUES,
  USERS,
  drawer,
  expect,
  gotoList,
  openIssueFromList,
  test,
} from "./helpers";

test.describe("attachments", () => {
  test("lists the seeded local and hosted attachments", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);
    const rail = drawer(page).getByRole("complementary");

    await expect(rail.getByText("redirect-loop.har")).toBeVisible();
    await expect(rail.getByText("180.0 KB")).toBeVisible();
    await expect(rail.getByText("auth-flow-sequence.png")).toBeVisible();
    await expect(rail.getByText(/418\.8 KB · Hosted/)).toBeVisible();
  });

  test("uploads a local file and removes it again", async ({ page }) => {
    const file = path.join(os.tmpdir(), `issuelyst-e2e-${Date.now()}.txt`);
    await writeFile(file, "stack trace goes here\n");

    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);
    const rail = drawer(page).getByRole("complementary");

    await rail.locator('input[type="file"]').setInputFiles(file);
    await expect(rail.getByText(path.basename(file))).toBeVisible();

    await rail.getByRole("button", { name: "Remove" }).click();
    await expect(rail.getByText(path.basename(file))).toHaveCount(0);
  });

  test("says uploads are tab-only while Cloudinary is unconfigured", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);
    const rail = drawer(page).getByRole("complementary");

    // The suite runs without credentials, so the fallback notice is the
    // honest state — and no upload leaves the browser during the run.
    await expect(rail.getByText(/Files stay in this tab until/)).toBeVisible();
  });
});

test.describe("comments", () => {
  test("shows the seeded discussion with authors and mentions", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);

    await expect(drawer(page).getByText("created this issue")).toBeVisible();
    await expect(drawer(page).getByText(USERS.admin2.name).first()).toBeVisible();
  });

  test("edits and deletes my own comment", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    const composer = drawer(page).getByPlaceholder(/Add a comment/);
    await composer.fill("First pass looks fine.");
    await drawer(page).getByRole("button", { name: /^Comment/ }).click();

    const card = drawer(page).locator("div.group").filter({ hasText: "First pass looks fine." }).first();
    await card.hover();
    await card.getByRole("button", { name: "Edit" }).click();

    const editor = drawer(page).locator("textarea").filter({ hasText: "" }).first();
    await editor.fill("Second pass looks fine.");
    await drawer(page).getByRole("button", { name: /^Save/ }).click();

    await expect(drawer(page).getByText("Second pass looks fine.")).toBeVisible();
    await expect(drawer(page).getByText("(edited)")).toBeVisible();

    const edited = drawer(page).locator("div.group").filter({ hasText: "Second pass looks fine." }).first();
    await edited.hover();
    await edited.getByRole("button", { name: "Delete" }).click();
    await expect(drawer(page).getByText("Second pass looks fine.")).toHaveCount(0);
  });

  test("cannot edit someone else's comment", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);

    const others = drawer(page).locator("div.group").filter({ hasText: USERS.admin2.name }).first();
    await others.hover();
    await expect(others.getByRole("button", { name: "Edit" })).toHaveCount(0);
  });

  test("a comment bumps the count shown on the row", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    await drawer(page).getByPlaceholder(/Add a comment/).fill("Bumping the counter.");
    await drawer(page).getByRole("button", { name: /^Comment/ }).click();
    await expect(drawer(page).getByText("Bumping the counter.")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator("div[data-idx]").filter({ hasText: ISSUES.shortcut.title })).toContainText("1");
  });
});
