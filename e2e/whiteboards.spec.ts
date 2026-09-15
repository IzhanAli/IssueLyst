import type { Page } from "@playwright/test";
import { ROUTES, WHITEBOARDS_KEY, expect, menu, sidebar, test, toast } from "./helpers";

/** Seeded boards (src/lib/data/whiteboards-seed.ts). */
const BOARDS = {
  q3: { id: "wb_q3", name: "Q3 Platform Planning" },
  retro: { id: "wb_retro", name: "Auth rewrite — retro" },
  roadmap: { id: "wb_roadmap", name: "Roadmap themes" },
  blank: { id: "wb_blank", name: "Untitled board" },
} as const;

const sheet = (page: Page) => page.locator("[data-wb-sheet]");
const object = (page: Page, text: string) => page.locator("[data-wb-object]").filter({ hasText: text });
const tools = (page: Page) => page.getByRole("toolbar", { name: "Tools" });
const tool = (page: Page, name: string) => tools(page).getByRole("button", { name, exact: true });
const editor = (page: Page) => page.getByRole("textbox", { name: "Edit text" });
const heading = (page: Page, name: string) => page.getByRole("heading", { name, exact: true });
const boardList = (page: Page) => page.getByRole("navigation", { name: "Boards" });
const zoomLabel = (page: Page) => page.getByRole("button", { name: /^\d+%$/ });

/** Whether the whole sheet is on screen inside the canvas (half a pixel of rounding allowed). */
async function sheetFitsCanvas(page: Page) {
  const [canvas, box] = await Promise.all([sheet(page).locator("xpath=..").boundingBox(), sheet(page).boundingBox()]);
  if (!canvas || !box) return false;
  return (
    box.x >= canvas.x - 0.5 &&
    box.y >= canvas.y - 0.5 &&
    box.x + box.width <= canvas.x + canvas.width + 0.5 &&
    box.y + box.height <= canvas.y + canvas.height + 0.5
  );
}

/** The sheet's CSS transform as [a, b, c, d, e, f]: zoom in a/d, pan in e/f. */
async function sheetMatrix(page: Page): Promise<number[]> {
  const transform = await sheet(page).evaluate((el) => getComputedStyle(el).transform);
  return (transform.match(/-?\d+(\.\d+)?(e-?\d+)?/g) ?? []).map(Number);
}

async function openBoard(page: Page, id?: string) {
  await page.goto(id ? `${ROUTES.whiteboards}?board=${id}` : ROUTES.whiteboards);
  await expect(sheet(page)).toBeVisible();
}

interface StoredObject {
  id: string;
  kind: string;
  x: number;
  y: number;
  text?: string;
  color?: string;
  shape?: string;
}

/** A board's objects straight out of localStorage (written on the first edit). */
async function storedObjects(page: Page, boardId: string): Promise<StoredObject[]> {
  return page.evaluate(
    ([key, id]) => {
      const raw = window.localStorage.getItem(key);
      const boards: Array<{ id: string; objects: StoredObject[] }> = raw ? JSON.parse(raw).state?.boards ?? [] : [];
      return boards.find((b) => b.id === id)?.objects ?? [];
    },
    [WHITEBOARDS_KEY, boardId] as const,
  );
}

test.describe("whiteboards", () => {
  test("the sidebar opens the first board", async ({ page }) => {
    await page.goto(ROUTES.home);
    const link = sidebar(page).getByRole("link", { name: /^Whiteboards/ });
    await expect(link).toContainText("5");
    await link.click();

    await expect(page).toHaveURL(/\/app\/whiteboards$/);
    await expect(heading(page, BOARDS.q3.name)).toBeVisible();
    await expect(page.getByRole("button", { name: "Show board list" })).toContainText("5");
    await expect(object(page, "Saved views + share links")).toBeVisible();
    // the board's title bar takes the app top bar's place
    await expect(page.getByRole("button", { name: /Search issues/ })).toHaveCount(0);
  });

  test("the board list switches boards, deep-links them and stays open", async ({ page }) => {
    await openBoard(page);
    await expect(boardList(page)).toHaveCount(0);

    await page.getByRole("button", { name: "Show board list" }).click();
    await boardList(page).getByRole("link", { name: /Auth rewrite — retro/ }).click();

    await expect(page).toHaveURL(new RegExp(`\\?board=${BOARDS.retro.id}$`));
    await expect(heading(page, BOARDS.retro.name)).toBeVisible();
    await expect(boardList(page).getByRole("link", { name: /Auth rewrite — retro/ })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.reload();
    await expect(heading(page, BOARDS.retro.name)).toBeVisible();
    await expect(boardList(page)).toBeVisible();

    await page.getByRole("button", { name: "Hide board list" }).click();
    await expect(boardList(page)).toHaveCount(0);
  });

  test("a placed sticky takes typing and survives a reload", async ({ page }) => {
    await openBoard(page, BOARDS.blank.id);
    await expect(page.getByText("Blank board")).toBeVisible();

    await tool(page, "Sticky note").click();
    await expect(tool(page, "Sticky note")).toHaveAttribute("aria-pressed", "true");
    await sheet(page).click({ position: { x: 420, y: 320 } });

    await expect(editor(page)).toBeFocused();
    await editor(page).fill("Ship the whiteboard");
    await editor(page).press("Escape");
    await expect(editor(page)).toHaveCount(0);
    await expect(object(page, "Ship the whiteboard")).toBeVisible();
    await expect(page.getByText("Blank board")).toHaveCount(0);
    // placing the note is back on the select tool
    await expect(tool(page, "Select")).toHaveAttribute("aria-pressed", "true");

    await page.reload();
    await expect(object(page, "Ship the whiteboard")).toBeVisible();
    expect((await storedObjects(page, BOARDS.blank.id)).map((o) => o.kind)).toEqual(["sticky"]);
  });

  test("a text placed and left empty leaves nothing behind, not even an undo step", async ({ page }) => {
    await openBoard(page, BOARDS.blank.id);
    await tool(page, "Text").click();
    await sheet(page).click({ position: { x: 400, y: 300 } });
    await expect(editor(page)).toBeFocused();
    await editor(page).press("Escape");

    await expect(page.locator("[data-wb-object]")).toHaveCount(0);
    await expect(page.getByText("Blank board")).toBeVisible();
    await expect(tool(page, "Undo")).toBeDisabled();
  });

  test("double-click edits an existing note; clicking away saves it", async ({ page }) => {
    await openBoard(page, BOARDS.retro.id);
    await object(page, "Rotate doc owner each sprint").dblclick();
    await expect(editor(page)).toHaveValue("Rotate doc owner each sprint");

    await editor(page).fill("Rotate the doc owner every sprint");
    // Empty sheet, right of and below the notes. The board opens zoomed to fit,
    // so aim by proportion rather than by fixed sheet pixels.
    const box = await sheet(page).boundingBox();
    if (!box) throw new Error("sheet is not visible");
    await page.mouse.click(box.x + box.width * 0.85, box.y + box.height * 0.8);

    await expect(editor(page)).toHaveCount(0);
    await expect(object(page, "Rotate the doc owner every sprint")).toBeVisible();
    const stored = await storedObjects(page, BOARDS.retro.id);
    expect(stored.some((o) => o.text === "Rotate the doc owner every sprint")).toBe(true);
  });

  test("a right-clicked note recolours and a selected one deletes; undo steps back through both", async ({ page }) => {
    await openBoard(page);
    const note = object(page, "Saved views + share links");
    await note.click();

    const bar = page.getByRole("toolbar", { name: "Selection" });
    await expect(bar).toBeVisible();
    await expect(bar.getByRole("button", { name: /^Color / })).toHaveCount(0);

    await note.click({ button: "right" });
    const menu = page.getByRole("toolbar", { name: "Sticky note style" });
    await expect(menu.getByRole("button", { name: "Color Green" })).toHaveAttribute("aria-pressed", "true");
    await menu.getByRole("button", { name: "Color Red" }).click();
    await expect(menu.getByRole("button", { name: "Color Red" })).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);

    await page.keyboard.press("Delete");
    await expect(note).toHaveCount(0);
    await expect(bar).toHaveCount(0);

    await tool(page, "Undo").click();
    await expect(note).toBeVisible();
    const colorOf = async () =>
      (await storedObjects(page, BOARDS.q3.id)).find((o) => o.text === "Saved views + share links")?.color;
    expect(await colorOf()).toBe("red");

    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(colorOf).toBe("green");
  });

  test("pen style opens on right-click or press and hold; a stroke restyles from its own right-click menu", async ({
    page,
  }) => {
    await openBoard(page, BOARDS.blank.id);
    const penMenu = page.getByRole("toolbar", { name: "Pen style" });

    // a plain click only picks the tool
    await tool(page, "Pen").click();
    await expect(tool(page, "Pen")).toHaveAttribute("aria-pressed", "true");
    await expect(penMenu).toHaveCount(0);

    await tool(page, "Pen").click({ button: "right" });
    await penMenu.getByRole("button", { name: "Color Blue" }).click();
    await penMenu.getByRole("button", { name: "Stroke Large" }).click();
    await expect(penMenu.getByRole("button", { name: "Stroke Large" })).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(penMenu).toHaveCount(0);
    await expect(tool(page, "Pen")).toHaveAttribute("aria-pressed", "true");

    const box = await sheet(page).boundingBox();
    if (!box) throw new Error("sheet is not visible");
    await page.mouse.move(box.x + 300, box.y + 300);
    await page.mouse.down();
    await page.mouse.move(box.x + 420, box.y + 300, { steps: 12 });
    await page.mouse.up();
    await expect
      .poll(() => storedObjects(page, BOARDS.blank.id))
      .toEqual([expect.objectContaining({ kind: "ink", color: "blue", size: "l" })]);

    // press and hold opens the same menu, still on the last style
    await tool(page, "Select").click();
    const pen = await tool(page, "Pen").boundingBox();
    if (!pen) throw new Error("pen button is not visible");
    await page.mouse.move(pen.x + pen.width / 2, pen.y + pen.height / 2);
    await page.mouse.down();
    await expect(penMenu).toBeVisible();
    await page.mouse.up();
    await expect(penMenu.getByRole("button", { name: "Color Blue" })).toHaveAttribute("aria-pressed", "true");
    await expect(tool(page, "Pen")).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(penMenu).toHaveCount(0);

    // selecting a stroke shows no style controls; right-clicking it does
    await tool(page, "Select").click();
    await page.mouse.click(box.x + 360, box.y + 300);
    const bar = page.getByRole("toolbar", { name: "Selection" });
    await expect(bar).toBeVisible();
    await expect(bar.getByRole("button", { name: /^Color / })).toHaveCount(0);

    await page.mouse.click(box.x + 360, box.y + 300, { button: "right" });
    const strokeMenu = page.getByRole("toolbar", { name: "Stroke style" });
    await strokeMenu.getByRole("button", { name: "Stroke Small" }).click();
    await strokeMenu.getByRole("button", { name: "Color Green" }).click();
    await expect
      .poll(() => storedObjects(page, BOARDS.blank.id))
      .toEqual([expect.objectContaining({ kind: "ink", color: "green", size: "s" })]);
  });

  test("text style opens on right-click of the text tool; a text restyles from its own right-click menu", async ({
    page,
  }) => {
    await openBoard(page, BOARDS.blank.id);
    const textMenu = page.getByRole("toolbar", { name: "Text style" });

    await tool(page, "Text").click();
    await expect(textMenu).toHaveCount(0);

    await tool(page, "Text").click({ button: "right" });
    await textMenu.getByRole("button", { name: "Color Red" }).click();
    await textMenu.getByRole("button", { name: "Font size Large" }).click();
    await page.keyboard.press("Escape");
    await expect(textMenu).toHaveCount(0);

    await sheet(page).click({ position: { x: 300, y: 300 } });
    await editor(page).fill("Launch notes");
    await editor(page).press("Escape");
    const text = object(page, "Launch notes");
    await expect(text).toHaveCSS("font-size", "34px");
    await expect
      .poll(() => storedObjects(page, BOARDS.blank.id))
      .toEqual([expect.objectContaining({ kind: "text", color: "red", size: "l" })]);
    await expect(page.getByRole("toolbar", { name: "Selection" }).getByRole("button", { name: /^Color / })).toHaveCount(0);

    await text.click({ button: "right" });
    await textMenu.getByRole("button", { name: "Font size Small" }).click();
    await expect(text).toHaveCSS("font-size", "16px");
    await textMenu.getByRole("button", { name: "Color Blue" }).click();
    await expect
      .poll(() => storedObjects(page, BOARDS.blank.id))
      .toEqual([expect.objectContaining({ kind: "text", color: "blue", size: "s" })]);
  });

  test("sticky note and shape colours open on right-click or press and hold, for new and placed ones", async ({
    page,
  }) => {
    await openBoard(page, BOARDS.blank.id);
    const stickyMenu = page.getByRole("toolbar", { name: "Sticky note style" });
    const shapeMenu = page.getByRole("toolbar", { name: "Shape style" });

    // a plain click only picks the tool
    await tool(page, "Sticky note").click();
    await expect(stickyMenu).toHaveCount(0);

    await tool(page, "Sticky note").click({ button: "right" });
    await expect(stickyMenu.getByRole("button", { name: "Color Amber" })).toHaveAttribute("aria-pressed", "true");
    await stickyMenu.getByRole("button", { name: "Color Blue" }).click();
    await page.keyboard.press("Escape");
    await expect(stickyMenu).toHaveCount(0);
    await sheet(page).click({ position: { x: 250, y: 250 } });
    await editor(page).fill("Blue note");
    await editor(page).press("Escape");

    const shapeButton = await tool(page, "Shape").boundingBox();
    if (!shapeButton) throw new Error("shape button is not visible");
    await page.mouse.move(shapeButton.x + shapeButton.width / 2, shapeButton.y + shapeButton.height / 2);
    await page.mouse.down();
    await expect(shapeMenu).toBeVisible();
    await page.mouse.up();
    await expect(tool(page, "Shape")).toHaveAttribute("aria-pressed", "true");
    await expect(shapeMenu.getByRole("button", { name: "Color Gray" })).toHaveAttribute("aria-pressed", "true");
    await shapeMenu.getByRole("button", { name: "Color Green" }).click();
    await page.keyboard.press("Escape");
    await sheet(page).click({ position: { x: 650, y: 250 } });

    await expect
      .poll(() => storedObjects(page, BOARDS.blank.id))
      .toEqual([
        expect.objectContaining({ kind: "sticky", color: "blue", text: "Blue note" }),
        expect.objectContaining({ kind: "shape", shape: "rect", color: "green" }),
      ]);

    // the placed shape recolours from its own right-click menu
    await expect(page.getByRole("toolbar", { name: "Selection" }).getByRole("button", { name: /^Color / })).toHaveCount(0);
    await sheet(page).click({ position: { x: 650, y: 250 }, button: "right" });
    await shapeMenu.getByRole("button", { name: "Color Red" }).click();
    await expect
      .poll(async () => (await storedObjects(page, BOARDS.blank.id)).find((o) => o.kind === "shape")?.color)
      .toBe("red");
  });

  test("the shape menu draws rectangles or ellipses, and switches a placed shape between them", async ({ page }) => {
    await openBoard(page, BOARDS.blank.id);
    const shapeMenu = page.getByRole("toolbar", { name: "Shape style" });

    await tool(page, "Shape").click({ button: "right" });
    await expect(shapeMenu.getByRole("button", { name: /^Shape / })).toHaveCount(2);
    await expect(shapeMenu.getByRole("button", { name: "Shape Rectangle" })).toHaveAttribute("aria-pressed", "true");
    await shapeMenu.getByRole("button", { name: "Shape Ellipse" }).click();
    await expect(shapeMenu.getByRole("button", { name: "Shape Ellipse" })).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await sheet(page).click({ position: { x: 300, y: 250 } });

    await expect
      .poll(async () => (await storedObjects(page, BOARDS.blank.id)).map((o) => [o.kind, o.shape]))
      .toEqual([["shape", "ellipse"]]);

    // the placed ellipse becomes a rectangle from its own right-click menu
    await sheet(page).click({ position: { x: 300, y: 250 }, button: "right" });
    await shapeMenu.getByRole("button", { name: "Shape Rectangle" }).click();
    await expect
      .poll(async () => (await storedObjects(page, BOARDS.blank.id)).map((o) => o.shape))
      .toEqual(["rect"]);
  });

  test("a triangle saved before triangles were removed loads as a rectangle", async ({ page }) => {
    await page.addInitScript((key) => {
      const at = "2026-09-15T00:00:00.000Z";
      const board = {
        id: "wb_saved",
        workspaceId: "ws_meridian",
        name: "Saved board",
        createdById: "u_izhan",
        createdAt: at,
        updatedAt: at,
        objects: [{ id: "wo_s", kind: "shape", shape: "triangle", x: 100, y: 100, w: 250, h: 175, color: "amber" }],
      };
      window.localStorage.setItem(key, JSON.stringify({ state: { boards: [board] }, version: 4 }));
    }, WHITEBOARDS_KEY);

    await openBoard(page, "wb_saved");
    await expect
      .poll(() => storedObjects(page, "wb_saved"))
      .toEqual([expect.objectContaining({ kind: "shape", shape: "rect", x: 100, y: 100, color: "amber" })]);
  });

  test("dragging a note moves it by the pointer distance, in sheet pixels", async ({ page }) => {
    await openBoard(page);
    const [k] = await sheetMatrix(page);
    const note = object(page, "Bulk edit needs an undo window");
    const box = await note.boundingBox();
    if (!box) throw new Error("note is not visible");

    await page.mouse.move(box.x + 40, box.y + 24);
    await page.mouse.down();
    await page.mouse.move(box.x + 140, box.y + 84, { steps: 8 });
    await page.mouse.up();

    // Seeded at (450, 365). The pointer moved 100×60 screen pixels over a sheet drawn at scale k.
    const stored = async () =>
      (await storedObjects(page, BOARDS.q3.id)).find((o) => o.text === "Bulk edit needs an undo window");
    await expect.poll(async () => (await stored())?.x).toBeGreaterThan(460);
    const { x, y } = (await stored())!;
    expect(Math.abs(x - 450 - 100 / k)).toBeLessThanOrEqual(1);
    expect(Math.abs(y - 365 - 60 / k)).toBeLessThanOrEqual(1);
  });

  test("boards saved before the content size bump load scaled up, layout intact", async ({ page }) => {
    await page.addInitScript((key) => {
      const at = "2026-09-01T00:00:00.000Z";
      const board = {
        id: "wb_saved",
        workspaceId: "ws_meridian",
        name: "Saved board",
        createdById: "u_izhan",
        createdAt: at,
        updatedAt: at,
        objects: [
          { id: "wo_t", kind: "text", x: 100, y: 40, w: 400, size: 20, weight: 700, tone: "default", text: "Saved title" },
          { id: "wo_i", kind: "ink", x: 200, y: 200, w: 40, h: 20, d: "M0 0 L40 20" },
          { id: "wo_r", kind: "rect", x: 10, y: 10, w: 100, h: 80, color: "blue" },
        ],
      };
      window.localStorage.setItem(key, JSON.stringify({ state: { boards: [board] }, version: 1 }));
    }, WHITEBOARDS_KEY);

    await openBoard(page, "wb_saved");
    await expect(heading(page, "Saved board")).toBeVisible();
    await expect(object(page, "Saved title")).toBeVisible();
    await expect
      .poll(() => storedObjects(page, "wb_saved"))
      .toEqual([
        // v2 scaled 20px text to 25px; v3 files that under medium and turns the tone into a colour
        expect.objectContaining({ kind: "text", x: 125, y: 50, w: 500, size: "m", color: "default" }),
        expect.objectContaining({ kind: "ink", x: 250, y: 250, w: 50, h: 25, d: "M0 0 L50 25", size: "m", color: "red" }),
        // and v4 turns a rectangle into a shape
        expect.objectContaining({ kind: "shape", shape: "rect", x: 13, y: 13, w: 125, h: 100, color: "blue" }),
      ]);
  });

  test("the pen draws a stroke onto the board", async ({ page }) => {
    await openBoard(page, BOARDS.blank.id);
    await tool(page, "Pen").click();
    const box = await sheet(page).boundingBox();
    if (!box) throw new Error("sheet is not visible");

    await page.mouse.move(box.x + 500, box.y + 400);
    await page.mouse.down();
    await page.mouse.move(box.x + 600, box.y + 460, { steps: 10 });
    await page.mouse.move(box.x + 700, box.y + 400, { steps: 10 });
    await page.mouse.up();

    await expect.poll(async () => (await storedObjects(page, BOARDS.blank.id)).map((o) => o.kind)).toEqual(["ink"]);
    await expect(page.getByText("Blank board")).toHaveCount(0);
  });

  test("100% fits the whole board to the window and rescales with it", async ({ page }) => {
    await openBoard(page);
    await expect(zoomLabel(page)).toHaveText("100%");
    await expect.poll(() => sheetFitsCanvas(page)).toBe(true);

    // a big window scales the board, content and all, past its sheet size
    await page.setViewportSize({ width: 2400, height: 1500 });
    await expect.poll(async () => (await sheet(page).boundingBox())?.width ?? 0).toBeGreaterThan(1600);
    await expect.poll(() => sheetFitsCanvas(page)).toBe(true);

    await page.setViewportSize({ width: 1000, height: 700 });
    await expect.poll(async () => (await sheet(page).boundingBox())?.width ?? Infinity).toBeLessThan(800);
    await expect.poll(() => sheetFitsCanvas(page)).toBe(true);
    await expect(zoomLabel(page)).toHaveText("100%");
  });

  test("zoom steps from the fitted 100% and resets; the pan tool moves the sheet", async ({ page }) => {
    await openBoard(page);
    const fitted = await sheetMatrix(page);

    await page.getByRole("button", { name: "Zoom in" }).click();
    await expect(zoomLabel(page)).toHaveText("110%");
    await expect.poll(async () => (await sheetMatrix(page))[0]).toBeCloseTo(fitted[0] * 1.1, 3);
    await page.getByRole("button", { name: "Zoom out" }).click();
    await page.getByRole("button", { name: "Zoom out" }).click();
    await expect(zoomLabel(page)).toHaveText("90%");

    await tool(page, "Pan").click();
    const [, , , , x0, y0] = await sheetMatrix(page);
    const box = await sheet(page).boundingBox();
    if (!box) throw new Error("sheet is not visible");
    await page.mouse.move(box.x + 400, box.y + 300);
    await page.mouse.down();
    await page.mouse.move(box.x + 320, box.y + 260, { steps: 6 });
    await page.mouse.up();
    await expect.poll(async () => (await sheetMatrix(page)).slice(4)).toEqual([x0 - 80, y0 - 40]);

    await page.keyboard.press("Shift+Digit0");
    await expect(zoomLabel(page)).toHaveText("100%");
    await expect.poll(() => sheetMatrix(page)).toEqual(fitted);
  });

  test("boards can be created, renamed, deleted and restored", async ({ page }) => {
    await openBoard(page);
    await page.getByRole("button", { name: "Show board list" }).click();
    await page.getByRole("button", { name: "New board" }).click();
    await expect(boardList(page).getByRole("link")).toHaveCount(6);
    await expect(heading(page, "Untitled board")).toBeVisible();

    const more = page.getByRole("main").getByRole("button", { name: "More" });
    await more.click();
    await menu(page).getByRole("button", { name: "Rename board" }).click();
    const name = page.getByRole("textbox", { name: "Board name" });
    await expect(name).toBeFocused();
    await name.fill("Design crit");
    await name.press("Enter");
    await expect(heading(page, "Design crit")).toBeVisible();
    await expect(boardList(page).getByRole("link", { name: /Design crit/ })).toBeVisible();

    await more.click();
    await menu(page).getByRole("button", { name: "Delete board" }).click();
    await expect(boardList(page).getByRole("link")).toHaveCount(5);
    await expect(heading(page, "Design crit")).toHaveCount(0);

    await toast(page, /Deleted/).getByRole("button", { name: "Undo" }).click();
    await expect(heading(page, "Design crit")).toBeVisible();
    await expect(boardList(page).getByRole("link")).toHaveCount(6);
  });

  test("a favourite board is listed under Favorites in the sidebar", async ({ page }) => {
    await openBoard(page, BOARDS.roadmap.id);
    await expect(sidebar(page).getByRole("link", { name: BOARDS.roadmap.name })).toHaveCount(0);

    await page.getByRole("main").getByRole("button", { name: "Favorite" }).click();
    await sidebar(page).getByRole("link", { name: BOARDS.roadmap.name }).click();
    await expect(heading(page, BOARDS.roadmap.name)).toBeVisible();
  });
});
