/**
 * Central, non-reactive scene state.
 *
 * `sceneTarget` is what GSAP (intro + scroll choreography) writes to.
 * `sceneCurrent` is what the renderer reads: it damps towards the target
 * every frame so scroll-scrubbing never produces a hard cut.
 *
 * Keeping this outside React avoids re-rendering the tree at 60fps.
 */
export interface SceneState {
  /** Watch orientation as seen from the camera (radians). */
  yaw: number;
  pitch: number;
  roll: number;
  /** Fraction of the smaller viewport dimension the 41 mm case should fill. */
  fit: number;
  /** Camera vertical field of view (degrees) — drives "focal length". */
  fov: number;
  /** Screen anchor of the watch in NDC-like units (-1..1). */
  ax: number;
  ay: number;
  /** Exploded-view progress 0..1. */
  explode: number;
  /** Lighting preset index (float — lerps between presets). */
  light: number;
  /** Light sweep phase: 0 = off, travels over the metal as it goes 0→1. */
  sweep: number;
  /** 2D-ness: 1 flattens lighting for the editorial "print" moment. */
  flat: number;
  /** Overall exposure multiplier. Intro fades it up from black. */
  exposure: number;
  /** Highlight spotlight intensity (intro "tiny highlight"). */
  spark: number;
  /** 0..1: the object recedes behind an arriving paper room (contrast, brightness, depth). */
  recede: number;
}

export const sceneTarget: SceneState = {
  yaw: -0.9,
  pitch: 0.35,
  roll: -0.2,
  fit: 0.32,
  fov: 34,
  ax: 0,
  ay: 0,
  explode: 0,
  light: 0,
  sweep: 0,
  flat: 0,
  exposure: 0,
  spark: 0,
  recede: 0,
};

export const sceneCurrent: SceneState = { ...sceneTarget };

/** Per-property damping (higher = snappier). Tuned per parameter. */
export const DAMPING: Record<keyof SceneState, number> = {
  yaw: 4.5,
  pitch: 4.5,
  roll: 4.5,
  fit: 4,
  fov: 4,
  ax: 4,
  ay: 4,
  explode: 5,
  light: 3,
  sweep: 6,
  flat: 4,
  exposure: 3,
  spark: 6,
  recede: 4,
};

/** Frame-rate independent exponential damping. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function stepSceneState(dt: number) {
  const keys = Object.keys(sceneTarget) as (keyof SceneState)[];
  for (const k of keys) {
    sceneCurrent[k] = damp(sceneCurrent[k], sceneTarget[k], DAMPING[k], dt);
  }
}

/** QA / debugging: snap the damped state onto the target instantly. */
export function snapSceneState() {
  Object.assign(sceneCurrent, sceneTarget);
}
if (typeof window !== "undefined") {
  (window as unknown as { __veloris?: unknown }).__veloris = { snap: snapSceneState, target: sceneTarget, current: sceneCurrent };
}

/** Hard-set both target and current (used before the intro starts). */
export function resetSceneState(state: Partial<SceneState>) {
  Object.assign(sceneTarget, state);
  Object.assign(sceneCurrent, state);
}
