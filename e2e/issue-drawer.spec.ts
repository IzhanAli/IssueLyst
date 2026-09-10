import {
  ISSUES,
  ROUTES,
  USERS,
  chooseInMenu,
  drawer,
  expect,
  gotoList,
  issueByNumber,
  menu,
  openIssueFromList,
  row,
  test,
  toast,
} from "./helpers";

const N = Number(ISSUES.shortcut.key);

test.describe("issue detail drawer", () => {
  test("opens from a row and deep-links through the URL", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);

    await expect(page).toHaveURL(new RegExp(`\\?issue=${ISSUES.auth.key}$`));
    await expect(drawer(page).getByRole("heading", { name: ISSUES.auth.title })).toBeVisible();
    await expect(drawer(page).getByText(ISSUES.auth.key, { exact: true })).toBeVisible();
    await expect(drawer(page).getByText("Steps to reproduce")).toBeVisible();
    await expect(drawer(page).getByText("Activity")).toBeVisible();
  });

  test("a shared drawer link opens the drawer on load", async ({ page }) => {
    await page.goto(`${ROUTES.list}?issue=${ISSUES.board.key}`);
    await expect(drawer(page).getByRole("heading", { name: ISSUES.board.title })).toBeVisible();
  });

  test("closes with Escape, the close button and the backdrop", async ({ page }) => {
    await gotoList(page);

    await openIssueFromList(page, ISSUES.auth.title);
    await page.keyboard.press("Escape");
    await expect(drawer(page)).toHaveCount(0);
    await expect(page).toHaveURL(/list$/);

    await openIssueFromList(page, ISSUES.auth.title);
    await drawer(page).getByRole("button", { name: "Close", exact: true }).click();
    await expect(drawer(page)).toHaveCount(0);

    await openIssueFromList(page, ISSUES.auth.title);
    await page.mouse.click(120, 400);
    await expect(drawer(page)).toHaveCount(0);
  });

  test("browser back and forward move through the drawer", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);

    await page.goBack();
    await expect(drawer(page)).toHaveCount(0);
    await expect(page).toHaveURL(/list$/);

    await page.goForward();
    await expect(drawer(page)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`issue=${ISSUES.auth.key}`));
  });

  test("edits the title inline and the list picks it up", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    await drawer(page).getByRole("heading", { name: ISSUES.shortcut.title }).click();
    const titleBox = drawer(page).locator("textarea:not([placeholder])");
    await titleBox.fill("Cycle priority with number keys");
    await titleBox.press("Enter");

    await expect(drawer(page).getByRole("heading", { name: "Cycle priority with number keys" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(row(page, "Cycle priority with number keys")).toBeVisible();
    await expect.poll(async () => (await issueByNumber(page, N))?.title).toBe("Cycle priority with number keys");
  });

  test("edits the description", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    await drawer(page).getByText("Power users want to bump priority").click();
    const body = drawer(page).getByPlaceholder("Add a description…");
    await body.fill("Rewritten by the e2e suite.\n\n**Bold** works.");
    await body.press("ControlOrMeta+Enter");

    await expect(drawer(page).getByText("Rewritten by the e2e suite.")).toBeVisible();
    await expect(drawer(page).locator("strong", { hasText: "Bold" })).toBeVisible();
    await expect.poll(async () => (await issueByNumber(page, N))?.description).toContain("Rewritten by the e2e suite.");
  });

  test("posts a comment and it lands in the activity feed", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    const composer = drawer(page).getByPlaceholder(/Add a comment/);
    await composer.fill("Verified on staging — ready for review.");
    await drawer(page).getByRole("button", { name: /^Comment/ }).click();

    await expect(drawer(page).getByText("Verified on staging — ready for review.")).toBeVisible();
    await expect(composer).toHaveValue("");
  });

  test("sends a comment with Enter and autocompletes an @mention", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    const composer = drawer(page).getByPlaceholder(/Add a comment/);
    await composer.click();
    await composer.type("Handing over to @Lena");
    await expect(page.getByRole("button", { name: new RegExp(USERS.member2.name) }).last()).toBeVisible();
    await composer.press("Enter"); // accepts the mention
    await expect(composer).toHaveValue(`Handing over to @${USERS.member2.name} `);

    await composer.press("Enter"); // sends
    await expect(drawer(page).getByText(`Handing over to @${USERS.member2.name}`)).toBeVisible();
  });

  test("edits status, priority, assignee, labels and due date from the rail", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);
    const rail = drawer(page).getByRole("complementary");

    await rail.getByRole("button", { name: "Backlog", exact: true }).click();
    await chooseInMenu(page, "In Review");
    await expect(rail.getByRole("button", { name: "In Review", exact: true })).toBeVisible();

    await rail.getByRole("button", { name: "Low", exact: true }).click();
    await chooseInMenu(page, "Urgent");
    await expect(rail.getByRole("button", { name: "Urgent", exact: true })).toBeVisible();

    await rail.getByRole("button", { name: /^Unassigned/ }).click();
    await chooseInMenu(page, USERS.member2.name);
    await expect(rail.getByRole("button", { name: new RegExp(USERS.member2.name) })).toBeVisible();

    await rail.getByRole("button", { name: /Feature/ }).first().click();
    await chooseInMenu(page, "Bug");
    // Clicking the rail heading dismisses the popover without closing the drawer
    // (Escape here would be caught by the drawer's own handler).
    await rail.getByText("Details", { exact: true }).click();
    await expect(menu(page)).toHaveCount(0);
    await expect(rail.getByText("Bug", { exact: true })).toBeVisible();

    await rail.getByRole("button", { name: "No due date" }).click();
    await menu(page).locator('input[type="date"]').fill("2030-01-15");
    await rail.getByText("Details", { exact: true }).click();
    await expect(menu(page)).toHaveCount(0);

    await expect
      .poll(async () => {
        const issue = await issueByNumber(page, N);
        return [issue?.statusId, issue?.priority, issue?.assigneeId, issue?.dueDate];
      })
      .toEqual(["st_review", "urgent", USERS.member2.id, "2030-01-15"]);
    await expect.poll(async () => (await issueByNumber(page, N))?.labelIds).toContain("lb_bug");
  });

  test("removes a label from the title area", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);

    await drawer(page).getByRole("button", { name: "Remove Auth" }).click();
    await expect(drawer(page).getByRole("button", { name: "Remove Auth" })).toHaveCount(0);
    await expect.poll(async () => (await issueByNumber(page, 142))?.labelIds).not.toContain("lb_auth");
  });

  test("copies a link to the issue", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);

    await drawer(page).getByRole("button", { name: "Copy link" }).click();
    await expect(toast(page, "Link copied to clipboard")).toBeVisible();
  });

  test("expands the drawer into the full page view", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);

    await drawer(page).getByRole("button", { name: "Open full page" }).click();
    await expect(page).toHaveURL(new RegExp(`/issue/${ISSUES.auth.key}$`));
    await expect(drawer(page)).toHaveCount(0);
    await expect(page.getByRole("main").getByRole("heading", { name: ISSUES.auth.title })).toBeVisible();
    await expect(page.getByRole("button", { name: "Issues", exact: true })).toBeVisible();
  });

  test("deletes an issue from the overflow menu", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    await drawer(page).getByRole("button", { name: "More" }).click();
    await menu(page).getByRole("button", { name: "Delete issue" }).click();

    await expect(toast(page, `${ISSUES.shortcut.key} deleted`)).toBeVisible();
    await expect(drawer(page)).toHaveCount(0);
    await expect(row(page, ISSUES.shortcut.title)).toHaveCount(0);
    await expect.poll(async () => await issueByNumber(page, N)).toBeUndefined();
  });

  test("shows reporter and timestamps", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);
    const rail = drawer(page).getByRole("complementary");

    await expect(rail.getByText("Reporter")).toBeVisible();
    await expect(rail.getByText(USERS.admin2.name)).toBeVisible();
    await expect(rail.getByText("Created")).toBeVisible();
    await expect(rail.getByText("Updated")).toBeVisible();
  });

  test("lists attachments for an issue that has them", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);

    const rail = drawer(page).getByRole("complementary");
    await expect(rail.getByText("Attachments")).toBeVisible();
    await expect(rail.getByText("redirect-loop.har")).toBeVisible();
  });
});
