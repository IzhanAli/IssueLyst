import { nanoid } from "nanoid";
import type {
  EllipseObject,
  ImageObject,
  InkColor,
  InkObject,
  ShapeObject,
  StickyObject,
  TextObject,
  Whiteboard,
  WhiteboardColor,
  WhiteboardObject,
  WhiteboardSize,
} from "@/lib/types";
import { workspace } from "./seed";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/**
 * The seeded whiteboards. Board ids are stable so links and the e2e suite can
 * address them; object ids are fresh on every seed. Geometry is the design's,
 * scaled by 1.25 so it reads well with the whole sheet fitted to the window.
 */
export function seedWhiteboards(): Whiteboard[] {
  const now = Date.now();
  const ago = (ms: number) => new Date(now - ms).toISOString();
  const oid = () => `wo_${nanoid(8)}`;

  const text = (
    x: number,
    y: number,
    w: number,
    size: WhiteboardSize,
    weight: TextObject["weight"],
    value: string,
    color: InkColor = "default",
  ): TextObject => ({ id: oid(), kind: "text", x, y, w, size, weight, color, text: value });

  const sticky = (
    x: number,
    y: number,
    h: number,
    color: WhiteboardColor,
    value: string,
    authorId: string,
    age: number,
    rotation: number,
  ): StickyObject => ({
    id: oid(),
    kind: "sticky",
    x,
    y,
    w: 290,
    h,
    color,
    text: value,
    authorId,
    createdAt: ago(age),
    rotation,
  });

  const rect = (x: number, y: number, w: number, h: number): ShapeObject =>
    ({ id: oid(), kind: "shape", shape: "rect", x, y, w, h, color: "neutral" });
  const ellipse = (x: number, y: number, w: number, h: number): EllipseObject =>
    ({ id: oid(), kind: "ellipse", x, y, w, h });
  const image = (x: number, y: number, w: number, h: number, caption: string): ImageObject =>
    ({ id: oid(), kind: "image", x, y, w, h, caption });
  const ink = (x: number, y: number, w: number, h: number, d: string): InkObject =>
    ({ id: oid(), kind: "ink", x, y, w, h, d, color: "red", size: "m" });

  const board = (id: string, name: string, editedAgo: number, objects: WhiteboardObject[]): Whiteboard => ({
    id,
    workspaceId: workspace.id,
    name,
    objects,
    createdById: "u_izhan",
    createdAt: ago(editedAgo + 7 * DAY),
    updatedAt: ago(editedAgo),
  });

  return [
    board("wb_q3", "Q3 Platform Planning", 2 * HOUR, [
      text(70, 38, 700, "l", 700, "Q3 Platform Planning"),
      text(70, 85, 650, "m", 400, "What has to be true by Sept 30?", "gray"),
      rect(55, 153, 335, 383),
      text(75, 165, 250, "s", 700, "NOW", "gray"),
      text(450, 165, 250, "s", 700, "NEXT", "gray"),
      text(825, 165, 250, "s", 700, "LATER", "gray"),
      sticky(75, 203, 135, "amber", "Auth rewrite — token refresh on 401", "u_izhan", 2 * HOUR, -1.2),
      sticky(75, 365, 135, "blue", "Board DnD drops frames at 1k issues", "u_sara", 3 * HOUR, 0.8),
      sticky(450, 203, 135, "green", "Saved views + share links", "u_lena", DAY, 1.1),
      sticky(450, 365, 135, "indigo", "Bulk edit needs an undo window", "u_priya", DAY, -0.6),
      sticky(825, 203, 135, "red", "Realtime presence on list + board", "u_ahmed", 4 * HOUR, 0.6),
      sticky(825, 365, 135, "amber", "Mobile offline cache for My Issues", "u_yuki", 2 * DAY, -1),
      image(1200, 198, 335, 215, "crash-rate chart"),
      text(1200, 428, 335, "s", 400, "From the Android 14 regression sweep — Marcus to refresh weekly.", "gray"),
      ellipse(808, 185, 328, 170),
      ink(375, 525, 225, 88, "M5 65 C 43 13, 83 78, 120 30 S 188 8, 220 38"),
    ]),
    board("wb_retro", "Auth rewrite — retro", DAY, [
      text(70, 38, 700, "l", 700, "Auth rewrite — retro"),
      text(75, 120, 250, "s", 700, "WENT WELL", "gray"),
      text(450, 120, 250, "s", 700, "DIDN'T", "gray"),
      text(825, 120, 250, "s", 700, "ACTIONS", "gray"),
      sticky(75, 158, 130, "green", "Shipped behind a flag — zero rollbacks", "u_ahmed", DAY, -0.8),
      sticky(75, 315, 130, "green", "Session seam paid off immediately", "u_izhan", DAY, 0.7),
      sticky(450, 158, 130, "red", "Refresh race only showed up in staging", "u_sara", DAY, 1),
      sticky(450, 315, 130, "red", "Nobody owned the migration doc", "u_marc", DAY, -0.5),
      sticky(825, 158, 130, "blue", "Add a refresh-loop e2e spec", "u_priya", DAY, 0.5),
      sticky(825, 315, 130, "blue", "Rotate doc owner each sprint", "u_lena", DAY, -0.9),
    ]),
    board("wb_triage", "Mobile crash triage", 3 * DAY, [
      text(70, 38, 700, "l", 700, "Mobile crash triage"),
      text(70, 85, 650, "m", 400, "Android 14 · week 37", "gray"),
      sticky(75, 150, 130, "red", "ANR on cold start — WebView init", "u_yuki", 3 * DAY, -1),
      sticky(400, 150, 130, "amber", "Attachment picker leaks a cursor", "u_marc", 3 * DAY, 0.9),
      image(750, 145, 325, 205, "stack trace screenshot"),
    ]),
    board("wb_roadmap", "Roadmap themes", 7 * DAY, [
      text(70, 38, 700, "l", 700, "Roadmap themes"),
      text(
        70,
        93,
        800,
        "m",
        400,
        "Three bets for the half: make the tracker fast at scale, make views shareable, make presence real.",
        "gray",
      ),
      sticky(75, 188, 130, "indigo", "Scale", "u_izhan", 7 * DAY, -0.7),
      sticky(400, 188, 130, "indigo", "Shareability", "u_izhan", 7 * DAY, 0.6),
      sticky(725, 188, 130, "indigo", "Presence", "u_izhan", 7 * DAY, -0.4),
    ]),
    board("wb_blank", "Untitled board", 0, []),
  ];
}
