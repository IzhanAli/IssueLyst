import {
  ISSUES,
  USERS,
  card,
  chooseInMenu,
  drawer,
  expect,
  gotoBoard,
  gotoList,
  issueByNumber,
  openRowPicker,
  row,
  test,
} from "./helpers";

const N = Number(ISSUES.shortcut.key);

/**
 * Inline pickers live inside a clickable row/card. React portals bubble events
 * through the component tree rather than the DOM, so a picker selection used to
 * fire the row's own onClick too and yank the issue drawer open on top of the
 * edit. Every case below asserts the edit landed *and* that nothing else moved.
 */
test.describe("inline editing does not open the drawer", () => {
  test("status from a list row", async ({ page }) => {
    await gotoList(page, "?group=priority");
    await openRowPicker(page, ISSUES.shortcut.title, "Status");
    await chooseInMenu(page, "Done");

    await expect.poll(async () => (await issueByNumber(page, N))?.statusId).toBe("st_done");
    await expect(drawer(page)).toHaveCount(0);
    await expect(page).toHaveURL(/list\?group=priority$/);
  });

  test("priority from a list row", async ({ page }) => {
    await gotoList(page);
    await openRowPicker(page, ISSUES.shortcut.title, "Priority");
    await chooseInMenu(page, "Urgent");

    await expect.poll(async () => (await issueByNumber(page, N))?.priority).toBe("urgent");
    await expect(drawer(page)).toHaveCount(0);
    await expect(page).toHaveURL(/list$/);
  });

  test("assignee from a list row", async ({ page }) => {
    await gotoList(page);
    await openRowPicker(page, ISSUES.shortcut.title, "Assignee");
    await chooseInMenu(page, USERS.member2.name);

    await expect.poll(async () => (await issueByNumber(page, N))?.assigneeId).toBe(USERS.member2.id);
    await expect(drawer(page)).toHaveCount(0);
    await expect(page).toHaveURL(/list$/);
  });

  test("a custom field cell from a list row", async ({ page }) => {
    await gotoList(page);
    await row(page, ISSUES.shortcut.title).getByRole("button", { name: /^Squad/ }).click();
    await chooseInMenu(page, "Squad 2");

    await expect
      .poll(async () => ((await issueByNumber(page, N))?.fields as Record<string, string>).fd_squad)
      .toBe("sq_2");
    await expect(drawer(page)).toHaveCount(0);
  });

  test("priority from a board card", async ({ page }) => {
    await gotoBoard(page);
    await card(page, ISSUES.board.title).getByRole("button", { name: "Priority" }).click();
    await chooseInMenu(page, "Urgent");

    await expect
      .poll(async () => (await issueByNumber(page, Number(ISSUES.board.key)))?.priority)
      .toBe("urgent");
    await expect(drawer(page)).toHaveCount(0);
    await expect(page).toHaveURL(/board$/);
  });

  test("assignee from a board card, and the card stays put", async ({ page }) => {
    await gotoBoard(page);
    await card(page, ISSUES.board.title).getByRole("button", { name: "Assignee" }).click();
    await chooseInMenu(page, USERS.admin2.name);

    await expect
      .poll(async () => (await issueByNumber(page, Number(ISSUES.board.key)))?.assigneeId)
      .toBe(USERS.admin2.id);
    await expect(drawer(page)).toHaveCount(0);
    // the card was not picked up by the drag sensor
    await expect(card(page, ISSUES.board.title)).not.toHaveClass(/opacity-40/);
  });

  test("the row itself still opens the drawer when clicked", async ({ page }) => {
    await gotoList(page);
    await row(page, ISSUES.shortcut.title).getByText(ISSUES.shortcut.title).click();
    await expect(drawer(page)).toBeVisible();
  });
});
