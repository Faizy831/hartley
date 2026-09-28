import type { SceneState } from "./sceneState";
import { LIGHT } from "./lighting";

/**
 * A beat: "the scene must reach `state` when the page has scrolled to
 * `at` viewport-heights past the point where `section`'s top meets the
 * top of the viewport". `at: -1` means "as the section starts entering".
 * `state: "frame"` is resolved from the editorial frame's DOM rectangle.
 * Yaw accumulates (TWO = one full turn) so the object never spins back.
 */
export interface Beat {
  section: string;
  at: number;
  state: Partial<SceneState> | "frame";
  ease?: string;
}
export type PageKind = "home" | "product" | "catalog";

const PI = Math.PI;
const TWO = Math.PI * 2;

export const HERO_STATE: Partial<SceneState> = {
  yaw: 0.42, pitch: 0.12, roll: -0.18, fit: 0.57, fov: 30, ax: 0.28, ay: 0.03, explode: 0, light: LIGHT.hero, sweep: 0, flat: 0, exposure: 1, spark: 0,
};
export const HERO_STATE_MOBILE: Partial<SceneState> = { ...HERO_STATE, yaw: 0.35, roll: -0.12, fit: 0.66, ax: 0, ay: 0.0 };

export function getChoreography(page: PageKind, isMobile: boolean): Beat[] {
  if (page === "catalog") return [];
  return page === "home" ? home(isMobile) : product(isMobile);
}

/* ------------------------------------------------------------------
   PRODUCT DETAIL — the original single-object film
   ------------------------------------------------------------------ */
function product(isMobile: boolean): Beat[] {
  const hero = isMobile ? HERO_STATE_MOBILE : HERO_STATE;
  if (!isMobile) {
    return [
      { section: "hero", at: 0, state: hero },
      { section: "hero", at: 0.5, state: { yaw: 0.3, pitch: 0.08, roll: -0.14, fit: 0.55, ax: 0.3 }, ease: "none" },
      { section: "object", at: 0, state: { yaw: -0.62, pitch: 0.46, roll: 0.12, fit: 0.62, fov: 28, ax: -0.32, ay: 0.04, light: 0.5 }, ease: "power2.inOut" },
      { section: "object", at: 0.55, state: { yaw: -0.4, pitch: 0.36, light: LIGHT.technical }, ease: "power1.inOut" },
      { section: "case", at: 0, state: { yaw: -1.25, pitch: 0.12, roll: 0.1, fit: 1.05, fov: 24, ax: 0.3, ay: -0.04, light: LIGHT.technical }, ease: "power2.inOut" },
      { section: "case", at: 0.9, state: { yaw: -0.95, pitch: -0.28, roll: 0.04, fit: 1.15, ax: 0.34, ay: 0.08 }, ease: "power1.inOut" },
      { section: "dial", at: 0, state: { yaw: 0.08, pitch: 0.05, roll: 0, fit: 0.9, fov: 22, ax: 0.33, ay: 0.02, sweep: 0 }, ease: "power2.inOut" },
      { section: "dial", at: 0.55, state: { sweep: 1 }, ease: "power1.inOut" },
      { section: "dial", at: 0.9, state: { yaw: -0.26, pitch: 0.22, roll: -0.06, fit: 0.86 }, ease: "power1.inOut" },
      { section: "movement", at: 0, state: { yaw: PI, pitch: 0.05, roll: 0, fit: 0.72, fov: 26, ax: -0.32, ay: 0.02, explode: 0, sweep: 0, light: LIGHT.technical }, ease: "power2.inOut" },
      { section: "movement", at: 0.5, state: { yaw: PI + 0.35, pitch: -0.15 }, ease: "power1.inOut" },
      { section: "movement", at: 1.0, state: { yaw: TWO + 0.55, pitch: 0.42, roll: -0.08, fit: 0.4, fov: 30, ax: 0.02, ay: 0.02 }, ease: "power2.inOut" },
      { section: "movement", at: 1.7, state: { explode: 1, yaw: TWO + 0.7, pitch: 0.36 }, ease: "power2.inOut" },
      { section: "movement", at: 2.15, state: { yaw: TWO + 0.9, pitch: 0.3 }, ease: "none" },
      { section: "movement", at: 2.5, state: { explode: 0, yaw: TWO + 0.35, pitch: 0.16, fit: 0.62 }, ease: "power2.inOut" },
      { section: "materials", at: 0, state: { yaw: TWO + 0.4, pitch: 0.14, roll: -0.05, fit: 0.7, fov: 28, ax: 0.3, ay: 0.0, light: 1.5, explode: 0 }, ease: "power2.inOut" },
      { section: "materials", at: 1.0, state: { yaw: TWO + 0.22, pitch: 0.1 }, ease: "none" },
      { section: "craft", at: 0, state: { yaw: TWO - 0.95, pitch: -0.3, roll: 0.35, fit: 1.5, fov: 20, ax: -0.9, ay: 0.0, light: LIGHT.craft }, ease: "power2.inOut" },
      { section: "craft", at: 0.85, state: { yaw: TWO - 0.6, pitch: 0.1, roll: 0.25, fit: 1.4, ax: -0.85, ay: -0.1 }, ease: "power1.inOut" },
      { section: "craft", at: 1.7, state: { yaw: TWO + 0.15, pitch: 0.08, roll: -0.12, fit: 0.5, fov: 30, ax: 0.4, ay: 0.02 }, ease: "power2.inOut" },
      { section: "craft", at: 2.6, state: { yaw: TWO + 0.35, pitch: 0.12, ax: 0.44 }, ease: "none" },
      { section: "watch", at: -0.05, state: { light: LIGHT.craft }, ease: "none" },
      { section: "watch", at: 0.18, state: "frame", ease: "power2.inOut" },
      { section: "watch", at: 1.3, state: "frame", ease: "none" },
      { section: "watch", at: 1.6, state: { light: LIGHT.final, flat: 0.4 }, ease: "power1.inOut" },
      { section: "watch", at: 2.3, state: { flat: 0, yaw: TWO - 0.3, pitch: 0.12, roll: 0.06, fit: 0.42, fov: 30, ax: 0, ay: 0.42 }, ease: "power2.inOut" },
      { section: "collection", at: 0, state: { yaw: TWO - 0.22, pitch: 0.14, roll: 0.08, fit: 0.42, fov: 30, ax: 0, ay: 0.42, light: LIGHT.final }, ease: "power2.inOut" },
      { section: "collection", at: 0.5, state: { yaw: TWO + 0.18, pitch: 0.1 }, ease: "none" },
      { section: "collection", at: 0.95, state: { exposure: 0, ay: 0.6 }, ease: "power1.in" },
    ];
  }
  const up = 0.56;
  return [
    { section: "hero", at: 0, state: hero },
    { section: "hero", at: 0.5, state: { yaw: 0.25, pitch: 0.08, roll: -0.1, fit: 0.62, ay: 0.02 }, ease: "none" },
    { section: "object", at: 0, state: { yaw: -0.6, pitch: 0.46, roll: 0.12, fit: 0.6, fov: 30, ax: 0, ay: up, light: 0.5 }, ease: "power2.inOut" },
    { section: "object", at: 0.55, state: { yaw: -0.4, pitch: 0.36, light: LIGHT.technical }, ease: "power1.inOut" },
    { section: "case", at: 0, state: { yaw: -1.25, pitch: 0.12, roll: 0.1, fit: 0.85, fov: 26, ax: 0.05, ay: up + 0.06, light: LIGHT.technical }, ease: "power2.inOut" },
    { section: "case", at: 0.9, state: { yaw: -0.95, pitch: -0.28, roll: 0.04, fit: 0.9, ay: up + 0.1 }, ease: "power1.inOut" },
    { section: "dial", at: 0, state: { yaw: 0.06, pitch: 0.05, roll: 0, fit: 0.82, fov: 24, ax: 0, ay: up + 0.06, sweep: 0 }, ease: "power2.inOut" },
    { section: "dial", at: 0.55, state: { sweep: 1 }, ease: "power1.inOut" },
    { section: "dial", at: 0.9, state: { yaw: -0.26, pitch: 0.22, roll: -0.06 }, ease: "power1.inOut" },
    { section: "movement", at: 0, state: { yaw: PI, pitch: 0.05, roll: 0, fit: 0.7, fov: 28, ax: 0, ay: up, explode: 0, sweep: 0, light: LIGHT.technical }, ease: "power2.inOut" },
    { section: "movement", at: 0.5, state: { yaw: PI + 0.35, pitch: -0.15 }, ease: "power1.inOut" },
    { section: "movement", at: 1.0, state: { yaw: TWO + 0.55, pitch: 0.42, roll: -0.08, fit: 0.46, fov: 32, ax: 0, ay: 0.08 }, ease: "power2.inOut" },
    { section: "movement", at: 1.7, state: { explode: 1, yaw: TWO + 0.7, pitch: 0.36 }, ease: "power2.inOut" },
    { section: "movement", at: 2.15, state: { yaw: TWO + 0.9, pitch: 0.3 }, ease: "none" },
    { section: "movement", at: 2.5, state: { explode: 0, yaw: TWO + 0.35, pitch: 0.16, fit: 0.6 }, ease: "power2.inOut" },
    { section: "materials", at: 0, state: { yaw: TWO + 0.4, pitch: 0.14, roll: -0.05, fit: 0.58, fov: 30, ax: 0, ay: up - 0.04, light: 1.5, explode: 0 }, ease: "power2.inOut" },
    { section: "materials", at: 1.0, state: { yaw: TWO + 0.22, pitch: 0.1 }, ease: "none" },
    { section: "craft", at: 0, state: { yaw: TWO - 0.95, pitch: -0.3, roll: 0.35, fit: 1.1, fov: 22, ax: -0.5, ay: up + 0.06, light: LIGHT.craft }, ease: "power2.inOut" },
    { section: "craft", at: 0.85, state: { yaw: TWO - 0.6, pitch: 0.1, roll: 0.25, fit: 1.05, ax: -0.45, ay: up + 0.06 }, ease: "power1.inOut" },
    { section: "craft", at: 1.7, state: { yaw: TWO + 0.15, pitch: 0.08, roll: -0.12, fit: 0.6, fov: 30, ax: 0, ay: 0.05 }, ease: "power2.inOut" },
    { section: "craft", at: 2.6, state: { yaw: TWO + 0.35, pitch: 0.12 }, ease: "none" },
    { section: "watch", at: -0.05, state: { light: LIGHT.craft }, ease: "none" },
    { section: "watch", at: 0.18, state: "frame", ease: "power2.inOut" },
    { section: "watch", at: 1.3, state: "frame", ease: "none" },
    { section: "watch", at: 1.6, state: { light: LIGHT.final, flat: 0.4 }, ease: "power1.inOut" },
    { section: "watch", at: 2.3, state: { flat: 0, yaw: TWO - 0.3, pitch: 0.12, roll: 0.06, fit: 0.46, fov: 30, ax: 0, ay: 0.46 }, ease: "power2.inOut" },
    { section: "collection", at: 0, state: { yaw: TWO - 0.22, pitch: 0.14, roll: 0.08, fit: 0.46, fov: 30, ax: 0, ay: 0.46, light: LIGHT.final }, ease: "power2.inOut" },
    { section: "collection", at: 0.5, state: { yaw: TWO + 0.18, pitch: 0.1 }, ease: "none" },
    { section: "collection", at: 0.95, state: { exposure: 0, ay: 0.7 }, ease: "power1.in" },
  ];
}

/* ------------------------------------------------------------------
   HOME — the collection: one object, transformed through the story
   ------------------------------------------------------------------ */
function home(isMobile: boolean): Beat[] {
  const hero = isMobile ? HERO_STATE_MOBILE : HERO_STATE;
  const up = 0.56;
  const m = isMobile;
  const R = (desktop: Partial<SceneState>, mobile: Partial<SceneState>) => (m ? { ...desktop, ...mobile } : desktop);
  return [
    { section: "hero", at: 0, state: hero },
    { section: "hero", at: 0.5, state: R({ yaw: 0.3, pitch: 0.08, roll: -0.14, fit: 0.55, ax: 0.3 }, { fit: 0.62, ax: 0, ay: 0.02 }), ease: "none" },

    // TWO EXPRESSIONS — the object turns to show its mechanical back, then returns
    { section: "discover", at: 0, state: R({ yaw: -0.55, pitch: 0.42, roll: 0.1, fit: 0.56, fov: 28, ax: -0.3, ay: 0.02, light: 0.5 }, { fit: 0.58, ax: 0, ay: up }), ease: "power2.inOut" },
    { section: "discover", at: 0.9, state: R({ yaw: PI, pitch: 0.05, roll: 0, fit: 0.62, ax: -0.3, light: LIGHT.technical }, { ax: 0, ay: up }), ease: "power2.inOut" },
    { section: "discover", at: 1.6, state: R({ yaw: TWO + 0.2, pitch: 0.1, fit: 0.56 }, {}), ease: "power2.inOut" },

    // LEGACY — chapter
    { section: "legacy", at: 0, state: R({ yaw: TWO + 0.38, pitch: 0.14, roll: -0.1, fit: 0.62, fov: 28, ax: 0.3, ay: 0.02, light: LIGHT.technical }, { fit: 0.6, ax: 0, ay: up }), ease: "power2.inOut" },
    { section: "legacy", at: 0.8, state: { yaw: TWO + 0.2 }, ease: "none" },
    // LEGACY — stage: the configurator
    { section: "legacy-stage", at: 0, state: R({ yaw: TWO + 0.32, pitch: 0.12, roll: -0.05, fit: 0.68, fov: 28, ax: 0.3, ay: 0.0, light: 1.5 }, { fit: 0.58, ax: 0, ay: up - 0.02 }), ease: "power2.inOut" },
    { section: "legacy-stage", at: 1.0, state: { yaw: TWO + 0.05, pitch: 0.08 }, ease: "none" },
    // LEGACY CATALOG (paper room): the object recedes as the sheet arrives, returns as it leaves
    // the sheet's edge enters the viewport at -1 and reaches the dial's lower edge near -0.7: the object has
    // finished stepping back before the edge touches it
    { section: "legacy-catalog", at: -1.3, state: { recede: 0 }, ease: "none" },
    { section: "legacy-catalog", at: -0.8, state: { recede: 1 }, ease: "power1.inOut" },
    { section: "legacy-craft", at: -1, state: { yaw: TWO + 0.05, pitch: 0.08, recede: 1 }, ease: "none" },
    { section: "legacy-craft", at: -0.1, state: { recede: 0 }, ease: "power1.inOut" },
    // LEGACY — movement: exhibition back, then exploded
    { section: "legacy-craft", at: 0, state: R({ yaw: TWO + PI, pitch: 0.05, roll: 0, fit: 0.72, fov: 26, ax: -0.32, ay: 0.02, explode: 0, light: LIGHT.technical }, { fit: 0.7, ax: 0, ay: up }), ease: "power2.inOut" },
    { section: "legacy-craft", at: 0.5, state: { yaw: TWO + PI + 0.35, pitch: -0.15 }, ease: "power1.inOut" },
    { section: "legacy-craft", at: 1.0, state: R({ yaw: TWO * 2 + 0.55, pitch: 0.42, roll: -0.08, fit: 0.4, fov: 30, ax: 0.02, ay: 0.02 }, { fit: 0.46, ax: 0, ay: 0.08 }), ease: "power2.inOut" },
    { section: "legacy-craft", at: 1.7, state: { explode: 1, yaw: TWO * 2 + 0.7, pitch: 0.36 }, ease: "power2.inOut" },
    { section: "legacy-craft", at: 2.15, state: { yaw: TWO * 2 + 0.9, pitch: 0.3 }, ease: "none" },
    { section: "legacy-craft", at: 2.5, state: { explode: 0, yaw: TWO * 2 + 0.35, pitch: 0.16, fit: 0.6 }, ease: "power2.inOut" },

    // HERITAGE — chapter (the family switch happens as this section arrives)
    { section: "heritage", at: 0, state: R({ yaw: TWO * 2 + 0.4, pitch: 0.12, roll: -0.12, fit: 0.62, fov: 28, ax: 0.3, ay: 0.02, light: LIGHT.craft }, { fit: 0.6, ax: 0, ay: up }), ease: "power2.inOut" },
    { section: "heritage", at: 0.9, state: { yaw: TWO * 2 + 0.2 }, ease: "none" },
    // HERITAGE — stage
    { section: "heritage-stage", at: 0, state: R({ yaw: TWO * 2 + 0.32, pitch: 0.12, roll: -0.05, fit: 0.68, fov: 28, ax: 0.3, ay: 0.0, light: 1.5 }, { fit: 0.58, ax: 0, ay: up - 0.02 }), ease: "power2.inOut" },
    { section: "heritage-stage", at: 1.0, state: { yaw: TWO * 2 + 0.05, pitch: 0.08 }, ease: "none" },
    // HERITAGE CATALOG (paper room)
    { section: "heritage-catalog", at: -1.3, state: { recede: 0 }, ease: "none" },
    { section: "heritage-catalog", at: -0.8, state: { recede: 1 }, ease: "power1.inOut" },
    { section: "heritage-design", at: -1, state: { yaw: TWO * 2 + 0.05, pitch: 0.08, recede: 1 }, ease: "none" },
    { section: "heritage-design", at: -0.1, state: { recede: 0 }, ease: "power1.inOut" },
    // HERITAGE — design: the seven-millimetre profile, then the clean dial
    { section: "heritage-design", at: 0, state: R({ yaw: TWO * 2 - 1.45, pitch: 0.02, roll: 0, fit: 1.15, fov: 24, ax: -0.28, ay: 0.0, light: LIGHT.craft }, { fit: 0.9, ax: 0.05, ay: up + 0.06 }), ease: "power2.inOut" },
    { section: "heritage-design", at: 1.2, state: R({ yaw: TWO * 2 + 0.06, pitch: 0.06, fit: 0.9, fov: 22, ax: 0.33, ay: 0.02, sweep: 0 }, { fit: 0.82, ax: 0, ay: up + 0.06 }), ease: "power2.inOut" },
    { section: "heritage-design", at: 1.9, state: { sweep: 1 }, ease: "power1.inOut" },

    // (straps & accessories sit here)
    { section: "watch", at: -1, state: { sweep: 1 }, ease: "none" },
    // THE WATCH — 3D → 2D
    { section: "watch", at: -0.05, state: { light: LIGHT.craft, sweep: 0 }, ease: "none" },
    { section: "watch", at: 0.18, state: "frame", ease: "power2.inOut" },
    { section: "watch", at: 1.3, state: "frame", ease: "none" },
    { section: "watch", at: 1.6, state: { light: LIGHT.final, flat: 0.4 }, ease: "power1.inOut" },
    { section: "watch", at: 2.3, state: R({ flat: 0, yaw: TWO * 2 - 0.3, pitch: 0.12, roll: 0.06, fit: 0.42, fov: 30, ax: 0, ay: 0.42 }, { fit: 0.46, ay: 0.46 }), ease: "power2.inOut" },
    // EXPLORE
    { section: "explore", at: 0, state: R({ yaw: TWO * 2 - 0.22, pitch: 0.14, roll: 0.08, fit: 0.42, fov: 30, ax: 0, ay: 0.42, light: LIGHT.final }, { fit: 0.46, ay: 0.46 }), ease: "power2.inOut" },
    { section: "explore", at: 0.5, state: { yaw: TWO * 2 + 0.18, pitch: 0.1 }, ease: "none" },
    { section: "explore", at: 0.95, state: { exposure: 0, ay: 0.6 }, ease: "power1.in" },
  ];
}

/** Resolve the editorial frame so the 3D watch lands exactly inside the DOM rectangle. */
export function resolveFrame(rect: DOMRect, vw: number, vh: number, yawBase: number, radius = 1): Partial<SceneState> {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const minDim = Math.min(vw, vh);
  const fit = (rect.width * 0.66) / minDim / radius;
  return { fit, ax: (cx / vw) * 2 - 1, ay: -((cy / vh) * 2 - 1), yaw: yawBase + 0.14, pitch: 0.02, roll: 0, fov: 24, flat: 1, light: LIGHT.paper, explode: 0, sweep: 0 };
}
