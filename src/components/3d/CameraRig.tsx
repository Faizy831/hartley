"use client";
import { useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { sceneCurrent, stepSceneState } from "@/lib/sceneState";
import { useStore } from "@/lib/store";

/**
 * Drives the camera from the damped scene state.
 *
 * Distance is derived from `fit` (how much of the screen the 41 mm case
 * should occupy) and the field of view, so "dolly" and "focal length" are
 * art-directed as one intent. The object's screen anchor is applied as a
 * projection offset, which keeps perspective identical wherever the watch
 * sits on the page.
 */
/** dim: transition darkening multiplier; spin: extra yaw during product transitions */
export const rigState = { dampingScale: 1, drift: 1, dim: 1, spin: 0, exposureMul: 1 };
if (typeof window !== "undefined") {
  (window as unknown as { __veloris?: Record<string, unknown> }).__veloris = { ...((window as unknown as { __veloris?: Record<string, unknown> }).__veloris ?? {}), rig: rigState };
}

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const reduced = useStore((s) => s.reducedMotion);

  useEffect(() => {
    rigState.drift = reduced ? 0 : 1;
  }, [reduced]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    stepSceneState(dt * rigState.dampingScale);

    const { fov, ax, exposure, recede } = sceneCurrent;
    // receding: a touch smaller and higher, as if moving behind the arriving surface
    const fit = sceneCurrent.fit * (1 - 0.14 * recede);
    const ay = sceneCurrent.ay + 0.08 * recede;
    const aspect = size.width / size.height;
    const tanHalf = Math.tan(THREE.MathUtils.DEG2RAD * fov * 0.5);
    const dist = 1 / (Math.max(0.05, fit) * tanHalf * Math.min(1, aspect));

    // slow handheld drift — sells "camera" rather than "turntable"
    const t = state.clock.elapsedTime;
    const dx = Math.sin(t * 0.21) * 0.06 * rigState.drift;
    const dy = Math.cos(t * 0.17) * 0.04 * rigState.drift;

    camera.fov = fov;
    camera.position.set(dx, dy, dist);
    camera.lookAt(dx * 0.35, dy * 0.35, 0);
    camera.setViewOffset(size.width, size.height, -ax * size.width * 0.5, ay * size.height * 0.5, size.width, size.height);
    camera.updateProjectionMatrix();

    gl.toneMappingExposure = exposure * rigState.dim * rigState.exposureMul * (1 - 0.55 * recede);
  }, -10);

  return null;
}
