import {
  ISSUES,
  ROUTES,
  expect,
  gotoList,
  menu,
  openIssueFromList,
  drawer,
  test,
  toast,
} from "./helpers";
import type { Page } from "@playwright/test";

/**
 * The "Claude Code" button hands a `claude-cli://` (or `vscode://`) URL to the
 * OS by clicking a synthesized anchor.  Every test stubs that click so the run
 * records the URL instead of launching a real Claude Code session.
 */
async function captureDeepLinks(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __deepLinks: string[] }).__deepLinks = [];
    HTMLAnchorElement.prototype.click = function () {
      (window as unknown as { __deepLinks: string[] }).__deepLinks.push(this.getAttribute("href") ?? "");
    };
  });
}

function deepLinks(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __deepLinks: string[] }).__deepLinks);
}

/** Decoded `q` (terminal) or `prompt` (VS Code) payload of the last link. */
async function lastPrompt(page: Page): Promise<string> {
  const links = await deepLinks(page);
  const url = new URL(links[links.length - 1].replace(/^[a-z-]+:\/\//, "https://"));
  return url.searchParams.get("q") ?? url.searchParams.get("prompt") ?? "";
}

test.describe("send to Claude Code", () => {
  test.beforeEach(async ({ page }) => {
    await captureDeepLinks(page);
  });

  test("opens a terminal session carrying the issue and all of its fields", async ({ page }) => {
    await gotoList(page);
    await openIssueFromList(page, ISSUES.auth.title);

    await drawer(page).getByRole("button", { name: "Claude Code", exact: true }).click();

    expect(await deepLinks(page)).toHaveLength(1);
    expect((await deepLinks(page))[0]).toMatch(/^claude-cli:\/\/open\?q=/);

    const prompt = await lastPrompt(page);
    expect(prompt).toContain(`ENG-${ISSUES.auth.key}`);
    expect(prompt).toContain(ISSUES.auth.title);
    // core fields
    expect(prompt).toContain("- Status: In Progress (started)");
    expect(prompt).toContain("- Priority: Urgent");
    expect(prompt).toContain("- Assignee: Izhan Ali");
    expect(prompt).toContain("- Reporter: Ahmed Raza");
    expect(prompt).toContain("- Labels: Bug, Auth, Regression");
    // custom fields, description, comments and activity
    expect(prompt).toContain("- Squad: Squad 2");
    expect(prompt).toContain("- Points: 3");
    expect(prompt).toContain("- Confirmed?: yes");
    expect(prompt).toContain("## Description");
    expect(prompt).toContain("## Comments (3)");
    expect(prompt).toContain("## Attachments (2)");
    expect(prompt).toContain("## Recent activity");
    expect(prompt).toContain(`${ROUTES.issue(ISSUES.auth.key)}`);
    // the handler caps `q` at 5,000 characters
    expect(prompt.length).toBeLessThanOrEqual(5000);

    await expect(toast(page, `Sent ENG-${ISSUES.auth.key} to Claude Code`)).toBeVisible();
  });

  test("offers VS Code from the split menu", async ({ page }) => {
    await page.goto(ROUTES.issue(ISSUES.token.key));

    await page.getByRole("button", { name: "Claude Code options" }).click();
    await menu(page).getByRole("button", { name: "Open in VS Code" }).click();

    expect((await deepLinks(page))[0]).toMatch(/^vscode:\/\/anthropic\.claude-code\/open\?prompt=/);
    expect(await lastPrompt(page)).toContain(ISSUES.token.title);
    await expect(toast(page, "to VS Code")).toBeVisible();
  });

  test("copies the prompt instead of opening anything", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(ROUTES.issue(ISSUES.token.key));

    await page.getByRole("button", { name: "Claude Code options" }).click();
    await menu(page).getByRole("button", { name: "Copy prompt" }).click();

    await expect(toast(page, "Prompt copied to clipboard")).toBeVisible();
    expect(await deepLinks(page)).toHaveLength(0);
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain(`ENG-${ISSUES.token.key}`);
    expect(clipboard).toContain("## Fields");
  });

  test("starts the session in the folder configured in settings", async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.getByRole("button", { name: "Claude Code", exact: true }).click();
    await page.getByPlaceholder("acme/payments").fill("meridian/web");

    await page.goto(ROUTES.issue(ISSUES.token.key));
    await page.getByRole("button", { name: "Claude Code", exact: true }).click();

    expect((await deepLinks(page))[0]).toContain("open?repo=meridian/web&q=");
    await expect(toast(page, "Claude Code · meridian/web")).toBeVisible();
  });
});
