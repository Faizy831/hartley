"use client";
import { create } from "zustand";
import type { CaseFinishId } from "@/data/finishes";
import { DEFAULT_WATCH, DEFAULT_HERITAGE, getWatch, type FamilyId } from "@/data/watches";
import type { Overrides } from "./resolveWatch";

export type Quality = "high" | "medium" | "low";
export type CursorState = "default" | "hover" | "drag" | "rotate" | "explore" | "view" | "menu" | "hidden";

interface AppState {
  quality: Quality;
  setQuality: (q: Quality) => void;
  /** Measured frame times stayed poor with a real GLB on stage: prefer the procedural model for the rest of the session. */
  glbDegraded: boolean;
  setGlbDegraded: (v: boolean) => void;
  /** A real client asset is the active object on stage: lighting uses the client's studio profile. */
  glbOnStage: boolean;
  setGlbOnStage: (v: boolean) => void;
  reducedMotion: boolean;
  isTouch: boolean;
  mobileLayout: boolean;
  setEnv: (v: { reducedMotion: boolean; isTouch: boolean; mobileLayout: boolean }) => void;

  loaded: boolean;
  setLoaded: (v: boolean) => void;
  /** Shaders compiled and textures uploaded for the object on stage: the preloader may leave and the intro may start. */
  sceneWarm: boolean;
  setSceneWarm: (v: boolean) => void;
  introDone: boolean;
  setIntroDone: (v: boolean) => void;

  section: string;
  setSection: (s: string) => void;

  cursor: CursorState;
  setCursor: (c: CursorState) => void;

  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  /** Thumbnail render mode (?thumb=1): fixed pose, no chrome, no motion. */
  thumbMode: boolean;
  setThumbMode: (v: boolean) => void;
  /** True while a solid catalog section covers the viewport — rendering pauses. */
  sceneCovered: boolean;
  setSceneCovered: (v: boolean) => void;

  /** The product on stage. */
  activeWatchId: string;
  /** Last chosen product per family, so the story can return to it. */
  lastByFamily: Record<FamilyId, string>;
  setActiveWatch: (id: string) => void;
  /** Visual overrides used by the material lab (X1 only; Hartley products map to real siblings). */
  overrides: Overrides;
  setOverride: (o: Overrides) => void;

  hoveringWatch: boolean;
  setHoveringWatch: (v: boolean) => void;
  dragging: boolean;
  setDragging: (v: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  quality: "medium",
  setQuality: (quality) => set({ quality }),
  glbDegraded: false,
  setGlbDegraded: (glbDegraded) => set({ glbDegraded }),
  glbOnStage: false,
  setGlbOnStage: (glbOnStage) => set({ glbOnStage }),
  reducedMotion: false,
  isTouch: false,
  mobileLayout: false,
  setEnv: (v) => set(v),

  loaded: false,
  setLoaded: (loaded) => set({ loaded }),
  sceneWarm: false,
  setSceneWarm: (sceneWarm) => set({ sceneWarm }),
  introDone: false,
  setIntroDone: (introDone) => set({ introDone }),

  section: "hero",
  setSection: (section) => set({ section }),

  cursor: "default",
  setCursor: (cursor) => set({ cursor }),

  menuOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  thumbMode: false,
  setThumbMode: (thumbMode) => set({ thumbMode }),
  sceneCovered: false,
  setSceneCovered: (sceneCovered) => set({ sceneCovered }),

  activeWatchId: DEFAULT_WATCH.id,
  lastByFamily: { legacy: DEFAULT_WATCH.id, heritage: DEFAULT_HERITAGE.id, veloris: "veloris-x1" },
  setActiveWatch: (id) =>
    set((s) => {
      const def = getWatch(id);
      return { activeWatchId: def.id, overrides: {}, lastByFamily: { ...s.lastByFamily, [def.family]: def.id } };
    }),
  overrides: {},
  setOverride: (o) => set((s) => ({ overrides: { ...s.overrides, ...o } })),

  hoveringWatch: false,
  setHoveringWatch: (hoveringWatch) => set({ hoveringWatch }),
  dragging: false,
  setDragging: (dragging) => set({ dragging }),
}));

export type { CaseFinishId };
