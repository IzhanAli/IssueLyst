import {
  ISSUES,
  SEEDED_ISSUE_COUNT,
  STATUSES,
  USERS,
  boardColumn,
  boardColumnBody,
  card,
  chooseInMenu,
  drawer,
  dragTo,
  expect,
  gotoBoard,
  issueByNumber,
  test,
} from "./helpers";

test.describe("board view", () => {
  test("renders a column per status with counts", async ({ page }) => {
    await gotoBoard(page);

    for (const status of STATUSES) {
      await expect(boardColumn(page, status)).toBeVisible();
    }
    await expect(boardColumn(page, "In Progress")).toContainText("5");
    await expect(card(page, ISSUES.auth.title)).toBeVisible();
  });

  test("a card shows its key, labels and assignee, and opens the drawer", async ({ page }) => {
    await gotoBoard(page);
    const target = card(page, ISSUES.auth.title);

    await expect(target).toContainText(ISSUES.auth.key);
    await expect(target).toContainText("Bug");

    await target.click();
    await expect(page).toHaveURL(new RegExp(`issue=${ISSUES.auth.key}`));
    await expect(drawer(page).getByRole("heading", { name: ISSUES.auth.title })).toBeVisible();
  });

  // Drops always target a column on the left-hand side of the board: dnd-kit
  // auto-scrolls the horizontal container when the pointer nears its edge,
  // which would otherwise move a right-hand column out from under the cursor.
  test("dragging a card to another column changes its status", async ({ page }) => {
    await gotoBoard(page);
    await expect(boardColumn(page, "Backlog")).toContainText("4");

    await dragTo(page, card(page, ISSUES.token.title), boardColumnBody(page, "Backlog"));

    await expect
      .poll(async () => (await issueByNumber(page, Number(ISSUES.token.key)))?.statusId)
      .toBe("st_backlog");
    await expect(boardColumn(page, "Backlog")).toContainText(ISSUES.token.title);
    await expect(boardColumn(page, "Backlog")).toContainText("5");
  });

  test("dragging within the same column leaves the issue untouched", async ({ page }) => {
    await gotoBoard(page);
    await dragTo(page, card(page, ISSUES.token.title), boardColumnBody(page, "Open"));

    await expect
      .poll(async () => (await issueByNumber(page, Number(ISSUES.token.key)))?.statusId)
      .toBe("st_open");
  });

  test("grouping by priority rebuilds the columns and drops set priority", async ({ page }) => {
    await gotoBoard(page, "?group=priority");
    for (const label of ["Urgent", "High", "Medium", "Low"]) {
      await expect(boardColumn(page, label)).toBeVisible();
    }

    await dragTo(page, card(page, ISSUES.board.title), boardColumnBody(page, "Urgent"));
    await expect
      .poll(async () => (await issueByNumber(page, Number(ISSUES.board.key)))?.priority)
      .toBe("urgent");
  });

  test("grouping by assignee rebuilds the columns and drops reassign", async ({ page }) => {
    await gotoBoard(page, "?group=assignee");
    await expect(boardColumn(page, USERS.admin.name)).toBeVisible();
    await expect(boardColumn(page, "Unassigned")).toBeAttached();

    await dragTo(page, card(page, ISSUES.auth.title), boardColumnBody(page, USERS.admin2.name));
    await expect
      .poll(async () => (await issueByNumber(page, Number(ISSUES.auth.key)))?.assigneeId)
      .toBe(USERS.admin2.id);
  });

  test("filters apply to the board", async ({ page }) => {
    await gotoBoard(page, "?priority=urgent");
    await expect(card(page, ISSUES.auth.title)).toBeVisible();
    await expect(page.getByText(ISSUES.shortcut.title)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Remove filter" })).toHaveCount(1);
  });

  test("inline priority editing works from a card", async ({ page }) => {
    await gotoBoard(page);
    await card(page, ISSUES.board.title).getByRole("button", { name: "Priority" }).click();
    await chooseInMenu(page, "Urgent");

    await expect
      .poll(async () => (await issueByNumber(page, Number(ISSUES.board.key)))?.priority)
      .toBe("urgent");
  });

  test("every seeded issue is on the board exactly once", async ({ page }) => {
    await gotoBoard(page);
    const counts = await Promise.all(
      STATUSES.map(async (s) => {
        const text = await boardColumn(page, s).innerText();
        const match = text.match(/\n(\d+)\n/);
        return match ? Number(match[1]) : 0;
      }),
    );
    expect(counts.reduce((a, b) => a + b, 0)).toBe(SEEDED_ISSUE_COUNT);
  });
});
