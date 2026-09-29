import type { Quality } from "./store";

/**
 * Heuristic device-capability tiering. Runs once on the client.
 * The PerformanceMonitor in the scene can still step DPR down at runtime.
 */
export function detectQuality(): Quality {
  if (typeof window === "undefined") return "medium";

  // Manual override for QA: ?quality=high|medium|low
  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced === "high" || forced === "medium" || forced === "low") return forced;

  const nav = navigator as Navigator & { deviceMemory?: number };
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const memory = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;

  let renderer = "";
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    } else {
      return "low";
    }
  } catch {
    /* ignore */
  }
  const r = renderer.toLowerCase();
  const weakGPU = /swiftshader|llvmpipe|mali-4|mali-t|adreno 3|adreno 4|intel\(r\) hd graphics [3-5]|intel\(r\) hd graphics 6\d{2}\b/.test(r);
  // iOS never exposes deviceMemory and under-reports hardwareConcurrency, and no WebGL2-capable Apple GPU
  // needs the low tier; a phone's CSS width says nothing about its GPU either. Without this, a real iPhone
  // fell to "low" and showed the procedural fallback while desktop emulation (Mac cores/memory) showed the GLB.
  const apple = /apple/.test(r) || /\b(iPhone|iPad|iPod)\b/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (weakGPU) return "low";
  if (isTouch) {
    if (apple) return "medium";
    if (memory <= 3 || cores <= 4) return "low";
    return "medium";
  }
  if (memory <= 4 || cores <= 4) return "medium";
  if (/intel/.test(r) && !/iris|arc/.test(r)) return "medium";
  return "high";
}

export const QUALITY_SETTINGS = {
  high: { dpr: [1, 2] as [number, number], pixelBudget: 2.2e6, post: true, bloom: true, transmission: true, segments: 1, particles: 70 },
  medium: { dpr: [1, 1.5] as [number, number], pixelBudget: 1.6e6, post: true, bloom: true, transmission: true, segments: 0.75, particles: 45 },
  low: { dpr: [1, 1.25] as [number, number], pixelBudget: 1.2e6, post: false, bloom: false, transmission: false, segments: 0.5, particles: 0 },
};

/**
 * The renderer is fill-bound: shading cost scales with canvas pixels, not CSS pixels. A wide Retina
 * window at DPR 2 is 8 megapixels, six times the 1.3 MP the 60 fps target was measured at, and the
 * opening sequence (GSAP on the wall clock) visibly skips at the resulting 20–25 fps. The DPR is
 * therefore capped so the canvas stays within the tier's pixel budget; on a 1440 × 900 window at
 * DPR 1 nothing changes.
 */
export function dprForViewport(width: number, height: number, tierCap: number, pixelBudget: number) {
  const budgetCap = Math.sqrt(pixelBudget / Math.max(1, width * height));
  return Math.max(1, Math.min(tierCap, budgetCap));
}
