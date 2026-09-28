"use client";
import * as THREE from "three";

const TEXTURE_KEYS = ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap", "anisotropyMap", "clearcoatMap", "clearcoatNormalMap"] as const;

/**
 * Compile a subtree's shader programs and upload its textures a few meshes per frame instead of in
 * one synchronous burst. `renderer.compile` assembles and links every program of the object it is
 * given; done per mesh, each step is a handful of milliseconds and fits inside a frame, whereas a
 * whole watch (50 programs, a dozen 2K textures) blocks the main thread for over a second.
 */
export function* compileSteps(root: THREE.Object3D, camera: THREE.Camera, scene: THREE.Scene, gl: THREE.WebGLRenderer): Generator<void, void, void> {
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });
  const seen = new Set<THREE.Material>();
  for (const mesh of meshes) {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (mats.every((m) => seen.has(m))) continue;
    for (const m of mats) seen.add(m);
    // renderer.compile only visits visible objects; hidden parts (e.g. an inactive dial variant) are compiled too so
    // that showing them later costs no shader build
    const hidden = !mesh.visible;
    if (hidden) mesh.visible = true;
    try {
      gl.compile(mesh, camera, scene);
      for (const m of mats) for (const k of TEXTURE_KEYS) {
        const t = (m as unknown as Record<string, THREE.Texture | null>)[k];
        if (t && t.isTexture) gl.initTexture(t);
      }
    } catch {
      /* a material that cannot compile is left to the renderer's own error path */
    }
    if (hidden) mesh.visible = false;
    yield;
  }
}

/** Advance a step iterator up to `n` times; true when finished. */
export function advance(it: Generator<void, void, void>, n: number): boolean {
  for (let i = 0; i < n; i++) if (it.next().done) return true;
  return false;
}
