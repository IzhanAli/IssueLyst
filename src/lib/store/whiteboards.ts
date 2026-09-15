import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Whiteboard, WhiteboardObject } from "@/lib/types";
import { seedWhiteboards } from "@/lib/data/whiteboards-seed";
import { useStore } from "./store";

const nowIso = () => new Date().toISOString();

/** Undo depth per board. History lasts for the session; it is not persisted. */
const HISTORY_LIMIT = 50;

interface WhiteboardState {
  boards: Whiteboard[];
  /** board id → earlier object lists, oldest first */
  history: Record<string, WhiteboardObject[][]>;

  createBoard: () => Whiteboard;
  renameBoard: (id: string, name: string) => void;
  deleteBoard: (id: string) => void;
  /** puts a deleted board back where it was (the delete toast's Undo) */
  restoreBoard: (board: Whiteboard, index: number) => void;

  /**
   * Applies one edit to a board's objects and records it as a single undo
   * step. `amend` folds the edit into the previous step instead, so typing
   * into a note that was just placed undoes together with placing it.
   */
  editObjects: (
    boardId: string,
    edit: (objects: WhiteboardObject[]) => WhiteboardObject[],
    options?: { amend?: boolean },
  ) => void;
  undo: (boardId: string) => void;

  resetSeed: () => void;
}

export const useWhiteboards = create<WhiteboardState>()(
  persist(
    (set) => ({
      boards: seedWhiteboards(),
      history: {},

      createBoard: () => {
        const { workspace, currentUserId } = useStore.getState();
        const at = nowIso();
        const board: Whiteboard = {
          id: `wb_${nanoid(8)}`,
          workspaceId: workspace.id,
          name: "Untitled board",
          objects: [],
          createdById: currentUserId,
          createdAt: at,
          updatedAt: at,
        };
        set((s) => ({ boards: [...s.boards, board] }));
        return board;
      },

      renameBoard: (id, name) =>
        set((s) => ({
          boards: s.boards.map((b) => (b.id === id ? { ...b, name, updatedAt: nowIso() } : b)),
        })),

      deleteBoard: (id) =>
        set((s) => {
          const history = { ...s.history };
          delete history[id];
          return { boards: s.boards.filter((b) => b.id !== id), history };
        }),

      restoreBoard: (board, index) =>
        set((s) => {
          if (s.boards.some((b) => b.id === board.id)) return s;
          const boards = [...s.boards];
          boards.splice(index, 0, board);
          return { boards };
        }),

      editObjects: (boardId, edit, options) =>
        set((s) => {
          const board = s.boards.find((b) => b.id === boardId);
          if (!board) return s;
          const objects = edit(board.objects);
          if (objects === board.objects) return s;
          const past = s.history[boardId] ?? [];
          return {
            boards: s.boards.map((b) => (b.id === boardId ? { ...b, objects, updatedAt: nowIso() } : b)),
            history:
              options?.amend && past.length
                ? s.history
                : { ...s.history, [boardId]: [...past, board.objects].slice(-HISTORY_LIMIT) },
          };
        }),

      undo: (boardId) =>
        set((s) => {
          const past = s.history[boardId];
          if (!past?.length) return s;
          const objects = past[past.length - 1];
          return {
            boards: s.boards.map((b) => (b.id === boardId ? { ...b, objects, updatedAt: nowIso() } : b)),
            history: { ...s.history, [boardId]: past.slice(0, -1) },
          };
        }),

      resetSeed: () => set({ boards: seedWhiteboards(), history: {} }),
    }),
    {
      name: "issuelyst.whiteboards.v1",
      version: 5,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ boards: s.boards }),
      migrate: migrateBoards,
    },
  ),
);

/* ── storage upgrades ────────────────────────────────────────────── */

/** An object as an older storage version wrote it; only the fields the upgrades touch are typed. */
interface StoredObject {
  kind: string;
  x: number;
  y: number;
  w: number;
  h?: number;
  size?: number | string;
  tone?: string;
  d?: string;
  [field: string]: unknown;
}

/**
 * v2 draws content 25% larger against the same sheet, so it reads well with
 * the whole sheet fitted to the window. Positions scale too, so layouts survive.
 */
function upgradeToV2(o: StoredObject): StoredObject {
  const r = (n: number) => Math.round(n * 1.25);
  return {
    ...o,
    x: r(o.x),
    y: r(o.y),
    w: r(o.w),
    ...(o.h === undefined ? {} : { h: r(o.h) }),
    ...(typeof o.size === "number" ? { size: r(o.size) } : {}),
    // every number in a stroke we write (M/L/C/S only) is a coordinate
    ...(o.d === undefined ? {} : { d: o.d.replace(/-?\d+(\.\d+)?/g, (n) => String(r(Number(n)))) }),
  };
}

/**
 * v3 gives text and pen strokes a colour and an S/M/L size. Text was sized in
 * pixels with a `tone`; strokes were always medium and red.
 */
function upgradeToV3(o: StoredObject): StoredObject {
  if (o.kind === "text") {
    const { tone, ...rest } = o;
    const px = typeof o.size === "number" ? o.size : 22;
    return { ...rest, size: px < 18 ? "s" : px < 28 ? "m" : "l", color: tone === "muted" ? "gray" : "default" };
  }
  if (o.kind === "ink") return { ...o, size: "m", color: "red" };
  return o;
}

/** v4 lets the Shape tool draw more than rectangles: a rectangle becomes a shape of kind "rect". */
function upgradeToV4(o: StoredObject): StoredObject {
  return o.kind === "rect" ? { ...o, kind: "shape", shape: "rect" } : o;
}

/** v5 drops triangles, which the Shape tool drew only briefly: a saved one becomes a rectangle. */
function upgradeToV5(o: StoredObject): StoredObject {
  return o.kind === "shape" && o.shape === "triangle" ? { ...o, shape: "rect" } : o;
}

function migrateBoards(persisted: unknown, version: number): { boards: Whiteboard[] } {
  const state = persisted as { boards?: Array<{ objects: StoredObject[] }> };
  if (!Array.isArray(state?.boards)) return state as unknown as { boards: Whiteboard[] };
  let boards = state.boards;
  const upgrade = (step: (o: StoredObject) => StoredObject) => {
    boards = boards.map((b) => ({ ...b, objects: b.objects.map(step) }));
  };
  if (version < 2) upgrade(upgradeToV2);
  if (version < 3) upgrade(upgradeToV3);
  if (version < 4) upgrade(upgradeToV4);
  if (version < 5) upgrade(upgradeToV5);
  return { boards: boards as unknown as Whiteboard[] };
}
