import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CreateIssueInput } from "./store";
import type { ClaudeSurface, ClaudeTarget } from "@/lib/integrations/claude-code";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebar: (v: boolean) => void;

  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;

  createOpen: boolean;
  createDefaults: Partial<CreateIssueInput> | null;
  openCreate: (defaults?: Partial<CreateIssueInput>) => void;
  closeCreate: () => void;

  favorites: string[];
  toggleFavorite: (id: string) => void;

  /** per-field list-column visibility override (fieldId → visible) */
  columns: Record<string, boolean>;
  toggleColumn: (fieldId: string, visible: boolean) => void;

  /** per-user column display order (field ids); empty = use field positions */
  columnOrder: string[];
  setColumnOrder: (ids: string[]) => void;

  /** "Send to Claude Code": which handler to open and where the session starts */
  claudeSurface: ClaudeSurface;
  setClaudeSurface: (s: ClaudeSurface) => void;
  claudeTarget: ClaudeTarget;
  setClaudeTarget: (patch: Partial<ClaudeTarget>) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebar: (v) => set({ sidebarCollapsed: v }),

      commandOpen: false,
      setCommandOpen: (v) => set({ commandOpen: v }),

      createOpen: false,
      createDefaults: null,
      openCreate: (defaults) => set({ createOpen: true, createDefaults: defaults ?? null }),
      closeCreate: () => set({ createOpen: false, createDefaults: null }),

      favorites: ["prj_eng"],
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((x) => x !== id)
            : [...s.favorites, id],
        })),

      columns: {},
      toggleColumn: (fieldId, visible) => set((s) => ({ columns: { ...s.columns, [fieldId]: visible } })),

      columnOrder: [],
      setColumnOrder: (ids) => set({ columnOrder: ids }),

      claudeSurface: "terminal",
      setClaudeSurface: (claudeSurface) => set({ claudeSurface }),
      claudeTarget: { repo: "", cwd: "" },
      setClaudeTarget: (patch) => set((s) => ({ claudeTarget: { ...s.claudeTarget, ...patch } })),
    }),
    {
      name: "issuelyst.ui.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        favorites: s.favorites,
        columns: s.columns,
        columnOrder: s.columnOrder,
        claudeSurface: s.claudeSurface,
        claudeTarget: s.claudeTarget,
      }),
    },
  ),
);
