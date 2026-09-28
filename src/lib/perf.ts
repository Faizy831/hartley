"use client";
import type * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useStore } from "./store";
import { glbOnStage } from "@/components/3d/glb/loader";
import { QA } from "./qaflags";

/**
 * Lightweight render instrumentation, readable from QA scripts as
 * `window.__veloris.perf`. One object is mutated in place every frame.
 */
export interface PerfSnapshot {
  fps: number;
  frameMs: number;
  p95Ms: number;
  calls: number;
  triangles: number;
  textures: number;
  geometries: number;
  programs: number;
  /** performance.now() of the first rendered frame. */
  firstFrameAt: number;
  heapMB: number | null;
  frames: number;
}

export const perf: PerfSnapshot = { fps: 0, frameMs: 0, p95Ms: 0, calls: 0, triangles: 0, textures: 0, geometries: 0, programs: 0, firstFrameAt: 0, heapMB: null, frames: 0 };
if (typeof window !== "undefined") {
  const w = window as unknown as { __veloris?: Record<string, unknown> };
  w.__veloris = { ...(w.__veloris ?? {}), perf };
}

const WINDOW = 180;
const FORCED_GLB = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("model") === "glb";
const samples: number[] = [];
let sorted: number[] = [];
/** Degrade to the procedural model when a GLB is on stage and the average frame stays above this for `DEGRADE_WINDOWS` windows. */
const DEGRADE_MS = 40;
const DEGRADE_WINDOWS = 3;

function recordFrame(delta: number, gl: THREE.WebGLRenderer) {
  // count every pass of the previous frame (post-processing renders the scene into its own targets)
  gl.info.autoReset = false;
  if (QA.transmissionScale !== null) gl.transmissionResolutionScale = QA.transmissionScale;
  samples.push(delta * 1000);
  if (samples.length > WINDOW) samples.shift();
  perf.frames++;
  if (!perf.firstFrameAt) perf.firstFrameAt = Math.round(performance.now());
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i];
  perf.frameMs = +(sum / samples.length).toFixed(2);
  perf.fps = +(1000 / Math.max(0.01, perf.frameMs)).toFixed(1);
  // p95 is recomputed every 30 frames
  if (perf.frames % 30 === 0) {
    sorted = [...samples].sort((a, b) => a - b);
    perf.p95Ms = +(sorted[Math.floor(sorted.length * 0.95)] ?? 0).toFixed(2);
    updateHud();
  }
  // measured fallback: sustained slow frames with the real asset on stage (after the intro has settled)
  // (production only: development frame times are not representative, and a forced ?model=glb is never degraded)
  if (process.env.NODE_ENV === "production" && !FORCED_GLB && perf.frames % WINDOW === 0 && perf.frames > WINDOW * 3 && glbOnStage.count > 0) {
    const st = useStore.getState();
    if (!st.glbDegraded && st.introDone && !st.dragging) {
      slowWindows = perf.frameMs > DEGRADE_MS ? slowWindows + 1 : 0;
      if (slowWindows >= DEGRADE_WINDOWS) {
        st.setGlbDegraded(true);
        if (process.env.NODE_ENV !== "production") console.warn(`[glb] average frame ${perf.frameMs} ms over ${DEGRADE_WINDOWS} windows; switching to the procedural model`);
      }
    }
  }
  const info = gl.info;
  perf.calls = info.render.calls;
  perf.triangles = info.render.triangles;
  perf.textures = info.memory.textures;
  perf.geometries = info.memory.geometries;
  perf.programs = info.programs?.length ?? 0;
  const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  perf.heapMB = mem ? +(mem.usedJSHeapSize / 1048576).toFixed(1) : null;
  info.reset();
}
let slowWindows = 0;
let hud: HTMLElement | null = null;
const wantHud = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("perfhud");
function updateHud() {
  if (!wantHud) return;
  if (!hud) {
    hud = document.createElement("pre");
    hud.setAttribute("style", "position:fixed;left:8px;bottom:8px;z-index:9999;margin:0;padding:6px 8px;background:rgba(0,0,0,.7);color:#0f0;font:11px/1.4 monospace;pointer-events:none");
    document.body.appendChild(hud);
  }
  const glb = (window as unknown as { __veloris?: { glb?: Record<string, { status: string; fetchMs: number; parseMs: number }> } }).__veloris?.glb ?? {};
  const loads = Object.entries(glb).map(([u, m]) => `${u.split("/").pop()} ${m.status} f${m.fetchMs} p${m.parseMs}`).join("\n");
  hud.textContent = `${perf.fps} fps  ${perf.frameMs} ms  p95 ${perf.p95Ms}\ncalls ${perf.calls}  tris ${perf.triangles}  tex ${perf.textures}\n${navigator.userAgent.slice(0, 60)}\n${loads}`;
}

export function PerfProbe() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") Object.assign((window as unknown as { __veloris: Record<string, unknown> }).__veloris, { scene, store: useStore, gl, camera });
  useFrame((_, delta) => recordFrame(delta, gl), -1000);
  return null;
}
