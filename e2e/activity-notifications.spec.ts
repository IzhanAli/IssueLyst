import {
  ISSUES,
  ROUTES,
  USERS,
  chooseInMenu,
  drawer,
  expect,
  gotoList,
  openIssueFromList,
  openRowPicker,
  rail,
  readData,
  sidebar,
  switchUserTo,
  test,
} from "./helpers";

test.describe("activity feed", () => {
  test("records status, priority, assignee and title changes", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    await rail(page).getByRole("button", { name: "Backlog", exact: true }).click();
    await chooseInMenu(page, "In Progress");
    await rail(page).getByRole("button", { name: "Low", exact: true }).click();
    await chooseInMenu(page, "Urgent");
    await rail(page).getByRole("button", { name: /^Unassigned/ }).click();
    await chooseInMenu(page, USERS.member2.name);

    await expect(drawer(page).getByText("changed status to")).toBeVisible();
    await expect(drawer(page).getByText("In Progress", { exact: true }).last()).toBeVisible();
    await expect(drawer(page).getByText("set priority to")).toBeVisible();
    await expect(drawer(page).getByText(`assigned`)).toBeVisible();
    await expect(drawer(page).getByText(USERS.member2.name).first()).toBeVisible();
    await expect(drawer(page).getByText(USERS.admin.name).first()).toBeVisible();
  });

  test("records label changes and comments", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    await rail(page).getByRole("button", { name: /Feature/ }).first().click();
    await chooseInMenu(page, "Bug");
    await rail(page).getByText("Details", { exact: true }).click();

    await drawer(page).getByPlaceholder(/Add a comment/).fill("Reproduced on staging.");
    await drawer(page).getByRole("button", { name: /^Comment/ }).click();

    await expect(drawer(page).getByText("Reproduced on staging.")).toBeVisible();
    await expect(drawer(page).getByText("added label")).toBeVisible();
    await expect(drawer(page).getByText("Bug", { exact: true }).first()).toBeVisible();
  });

  test("the feed keeps the seeded history in order", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);

    await expect(drawer(page).getByText("created this issue")).toBeVisible();
    await expect(drawer(page).getByText("assigned").first()).toBeVisible();
    await expect(drawer(page).getByText("changed status to").first()).toBeVisible();
  });
});

test.describe("notifications", () => {
  test("assigning someone notifies them, and not the actor", async ({ page }) => {
    await gotoList(page);
    await openRowPicker(page, ISSUES.shortcut.title, "Assignee");
    await chooseInMenu(page, USERS.member.name);

    // the acting admin gets nothing new
    await expect(sidebar(page).getByRole("link", { name: "Inbox 3" })).toBeVisible();

    await switchUserTo(page, USERS.admin.name, USERS.member.name);
    await page.goto(ROUTES.inbox);
    await expect(page.getByText("assigned you")).toBeVisible();
    await expect(page.getByText(ISSUES.shortcut.title)).toBeVisible();
  });

  test("an @mention notifies the mentioned user", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.shortcut.title);

    const composer = drawer(page).getByPlaceholder(/Add a comment/);
    await composer.fill(`Could you take a look @${USERS.member.name}?`);
    await drawer(page).getByRole("button", { name: /^Comment/ }).click();
    await expect(drawer(page).getByText(/Could you take a look/)).toBeVisible();
    await page.keyboard.press("Escape");

    await switchUserTo(page, USERS.admin.name, USERS.member.name);
    await page.goto(ROUTES.inbox);
    await expect(page.getByText("mentioned you")).toBeVisible();
  });

  test("a status change notifies the issue's followers", async ({ page }) => {
    // 142 was created by Ahmed, so he follows it
    await gotoList(page, "?group=priority");
    await openRowPicker(page, ISSUES.auth.title, "Status");
    await chooseInMenu(page, "Done");

    await switchUserTo(page, USERS.admin.name, USERS.admin2.name);
    await page.goto(ROUTES.inbox);
    await expect(page.getByText("moved to Done")).toBeVisible();
  });

  test("the unread badge counts only my own notifications", async ({ page }) => {
    await gotoList(page);
    await expect(sidebar(page).getByRole("link", { name: "Inbox 3" })).toBeVisible();

    await switchUserTo(page, USERS.admin.name, USERS.member2.name);
    await expect(sidebar(page).getByRole("link", { name: "Inbox", exact: true })).toBeVisible();
    await page.goto(ROUTES.inbox);
    await expect(page.getByText("Inbox zero")).toBeVisible();
  });

  test("marking one notification read leaves the others alone", async ({ page }) => {
    await page.goto(ROUTES.inbox);
    const before = (await readData(page)).notifications.filter((n) => !n.readAt).length;

    await page.getByText("mentioned you").click();
    await expect(drawer(page)).toBeVisible();
    await page.goto(ROUTES.inbox);

    const after = (await readData(page)).notifications.filter((n) => !n.readAt).length;
    expect(after).toBe(before - 1);
    await expect(page.getByText("Unread")).toBeVisible();
  });
});
