import {
  USERS,
  boardColumn,
  chooseInMenu,
  chooseInModalPicker,
  createModal,
  drawer,
  expect,
  gotoBoard,
  gotoList,
  gotoMyIssues,
  issueByNumber,
  row,
  rows,
  test,
  toast,
} from "./helpers";

/** The seed ends at 142, so the first issue created in a test is 143. */
const NEW = 143;

async function openCreateModal(page: import("@playwright/test").Page) {
  await page.getByRole("banner").getByRole("button", { name: "New issue" }).first().click();
  await expect(createModal(page)).toBeVisible();
}

test.describe("creating issues", () => {
  test("opens from the top bar, the project header and the C shortcut", async ({ page }) => {
    await gotoList(page);

    await openCreateModal(page);
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(createModal(page)).toHaveCount(0);

    await page.getByRole("button", { name: "New issue" }).last().click();
    await expect(createModal(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(createModal(page)).toHaveCount(0);

    await page.keyboard.press("c");
    await expect(createModal(page)).toBeVisible();
    await expect(createModal(page).getByText("New issue")).toBeVisible();
  });

  test("requires a title before it can submit", async ({ page }) => {
    await gotoList(page);
    await openCreateModal(page);

    await expect(createModal(page).getByRole("button", { name: /^Create issue/ })).toBeDisabled();
    await createModal(page).getByPlaceholder("Issue title").fill("Something to fix");
    await expect(createModal(page).getByRole("button", { name: /^Create issue/ })).toBeEnabled();
  });

  test("creates a fully specified issue and shows it in the list", async ({ page }) => {
    await gotoList(page);
    await openCreateModal(page);
    const modal = createModal(page);

    await modal.getByPlaceholder("Issue title").fill("Sign-up form drops the last character");
    await modal.getByPlaceholder(/Add a description/).fill("Typing quickly loses the final keystroke.");

    await modal.getByRole("button", { name: /^Open$/ }).click();
    await chooseInMenu(page, "In Progress");
    await expect(modal.getByRole("button", { name: /^In Progress$/ })).toBeVisible();

    await modal.getByRole("button", { name: /Priority$/ }).click();
    await chooseInMenu(page, "High");

    await modal.getByRole("button", { name: /Assignee$/ }).click();
    await chooseInMenu(page, USERS.member2.name);

    await modal.getByRole("button", { name: /Labels$/ }).click();
    await chooseInMenu(page, "Bug");
    await page.keyboard.press("Escape");

    await modal.getByRole("button", { name: /^Create issue/ }).click();

    await expect(toast(page, `${NEW} created`)).toBeVisible();
    await expect(createModal(page)).toHaveCount(0);
    await expect(row(page, "Sign-up form drops the last character")).toBeVisible();

    await expect
      .poll(async () => {
        const issue = await issueByNumber(page, NEW);
        return [issue?.statusId, issue?.priority, issue?.assigneeId, issue?.labelIds];
      })
      .toEqual(["st_progress", "high", USERS.member2.id, ["lb_bug"]]);
  });

  test("submits with the keyboard shortcut and defaults to the Open status", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("c");
    await createModal(page).getByPlaceholder("Issue title").fill("Created with the keyboard");
    await createModal(page).getByPlaceholder("Issue title").press("ControlOrMeta+Enter");

    await expect(createModal(page)).toHaveCount(0);
    await expect.poll(async () => (await issueByNumber(page, NEW))?.statusId).toBe("st_open");
  });

  test("'Create more' keeps the modal open for the next one", async ({ page }) => {
    await gotoList(page);
    await openCreateModal(page);
    const modal = createModal(page);

    await modal.getByRole("checkbox").check();
    await modal.getByPlaceholder("Issue title").fill("First of two");
    await modal.getByRole("button", { name: /^Create issue/ }).click();

    await expect(modal).toBeVisible();
    await expect(modal.getByPlaceholder("Issue title")).toHaveValue("");

    await modal.getByPlaceholder("Issue title").fill("Second of two");
    await modal.getByRole("button", { name: /^Create issue/ }).click();
    await expect(modal).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(row(page, "First of two")).toBeVisible();
    await expect(row(page, "Second of two")).toBeVisible();
  });

  test("the toast's View action opens the new issue", async ({ page }) => {
    await gotoList(page);
    await openCreateModal(page);
    await createModal(page).getByPlaceholder("Issue title").fill("Take me there");
    await createModal(page).getByRole("button", { name: /^Create issue/ }).click();

    await toast(page).getByRole("button", { name: "View" }).click();
    await expect(page).toHaveURL(new RegExp(`issue=${NEW}`));
    await expect(drawer(page).getByRole("heading", { name: "Take me there" })).toBeVisible();
  });

  test("a board column pre-selects its status", async ({ page }) => {
    await gotoBoard(page);
    await boardColumn(page, "Done").getByRole("button", { name: "Add issue" }).first().click();

    await expect(createModal(page).getByRole("button", { name: /^Done$/ })).toBeVisible();
    await createModal(page).getByPlaceholder("Issue title").fill("Filed straight into Done");
    await createModal(page).getByRole("button", { name: /^Create issue/ }).click();

    await expect.poll(async () => (await issueByNumber(page, NEW))?.statusId).toBe("st_done");
  });

  test("My Issues pre-assigns new issues to me", async ({ page }) => {
    await gotoMyIssues(page);
    await page.getByRole("button", { name: "New issue" }).last().click();

    await expect(createModal(page).getByRole("button", { name: new RegExp(USERS.admin.first) })).toBeVisible();
    await createModal(page).getByPlaceholder("Issue title").fill("Mine by default");
    await createModal(page).getByRole("button", { name: /^Create issue/ }).click();

    await expect(row(page, "Mine by default")).toBeVisible();
    await expect.poll(async () => (await issueByNumber(page, NEW))?.assigneeId).toBe(USERS.admin.id);
  });

  test("a created issue increases the list count", async ({ page }) => {
    await gotoList(page);
    const before = await rows(page).count();

    await page.keyboard.press("c");
    await createModal(page).getByPlaceholder("Issue title").fill("One more row");
    await createModal(page).getByRole("button", { name: /^Create issue/ }).click();

    await expect(rows(page)).toHaveCount(before + 1);
  });

  test("labels chosen in the modal render as removable chips", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("c");
    const modal = createModal(page);

    await modal.getByRole("button", { name: /Labels$/ }).click();
    await chooseInModalPicker(page, "Add label…", "Bug");
    await chooseInModalPicker(page, "Add label…", "Backend");
    await page.keyboard.press("Escape");

    await expect(modal.getByRole("button", { name: /2 labels$/ })).toBeVisible();
    await modal.getByRole("button", { name: "Remove Bug" }).click();
    await expect(modal.getByRole("button", { name: /1 label$/ })).toBeVisible();
  });

  /**
   * Regression guard: picker popovers open from inside the modal, so they have
   * to paint above its overlay. When they did not, a click landed on the
   * overlay and dismissed the whole modal instead of picking a value.
   */
  test("picker options in the create modal are clickable", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("c");
    const modal = createModal(page);
    await modal.getByPlaceholder("Issue title").fill("Clickable pickers");

    await modal.getByRole("button", { name: /^Open$/ }).click();
    await chooseInMenu(page, "In Review");

    await expect(modal).toBeVisible();
    await expect(modal.getByRole("button", { name: /^In Review$/ })).toBeVisible();

    await modal.getByRole("button", { name: /Priority$/ }).click();
    await chooseInMenu(page, "Urgent");
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("button", { name: /^Urgent$/ })).toBeVisible();
  });

  test("modal pickers can also be driven entirely from the keyboard", async ({ page }) => {
    await gotoList(page);
    await page.keyboard.press("c");
    const modal = createModal(page);
    await modal.getByPlaceholder("Issue title").fill("Keyboard only");

    await modal.getByRole("button", { name: /^Open$/ }).click();
    await chooseInModalPicker(page, "Change status…", "In Progress");
    await expect(modal.getByRole("button", { name: /^In Progress$/ })).toBeVisible();

    await modal.getByRole("button", { name: /Assignee$/ }).click();
    await chooseInModalPicker(page, "Assign to…", USERS.member2.first);
    await expect(modal.getByRole("button", { name: new RegExp(USERS.member2.first) })).toBeVisible();
  });
});
