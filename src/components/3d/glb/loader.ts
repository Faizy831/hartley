"use client";
import { useSyncExternalStore } from "react";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

/**
 * One cached load per asset URL. Files go through Three's default loading
 * manager so the preloader waits for them; parsing (Draco decode, texture
 * upload) is timed separately. A failed load is remembered so the watch
 * system falls back to the procedural model without retrying every mount.
 */
export type GLBStatus = "loading" | "ready" | "error";

export interface GLBMetrics {
  status: GLBStatus;
  bytes: number;
  /** Network time for the file (ms). */
  fetchMs: number;
  /** GLTFLoader.parse including Draco decoding (ms). */
  parseMs: number;
  /** performance.now() when the asset became usable. */
  readyAt: number;
  error?: string;
}

interface Entry {
  status: GLBStatus;
  promise: Promise<void>;
  gltf?: GLTF;
  error?: unknown;
  metrics: GLBMetrics;
}

const cache = new Map<string, Entry>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

let loader: GLTFLoader | null = null;
function getLoader() {
  if (!loader) {
    const draco = new DRACOLoader(THREE.DefaultLoadingManager);
    // decoder served from the app itself (no CDN dependency in production)
    draco.setDecoderPath("/draco/");
    loader = new GLTFLoader(THREE.DefaultLoadingManager);
    loader.setDRACOLoader(draco);
  }
  return loader;
}

const metricsWindow = (): Record<string, GLBMetrics> | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { __veloris?: Record<string, unknown> };
  w.__veloris = w.__veloris ?? {};
  w.__veloris.glb = w.__veloris.glb ?? {};
  return w.__veloris.glb as Record<string, GLBMetrics>;
};

export function loadGLB(url: string): Entry {
  let e = cache.get(url);
  if (e) return e;
  const metrics: GLBMetrics = { status: "loading", bytes: 0, fetchMs: 0, parseMs: 0, readyAt: 0 };
  const entry: Entry = { status: "loading", metrics, promise: Promise.resolve() };
  const mw = metricsWindow();
  if (mw) mw[url] = metrics;
  entry.promise = new Promise<void>((resolve) => {
    const t0 = performance.now();
    const file = new THREE.FileLoader(THREE.DefaultLoadingManager);
    file.setResponseType("arraybuffer");
    file.load(
      url,
      (data) => {
        const buffer = data as ArrayBuffer;
        metrics.bytes = buffer.byteLength;
        metrics.fetchMs = Math.round(performance.now() - t0);
        const t1 = performance.now();
        getLoader().parse(
          buffer,
          url.slice(0, url.lastIndexOf("/") + 1),
          (gltf) => {
            metrics.parseMs = Math.round(performance.now() - t1);
            metrics.readyAt = Math.round(performance.now());
            metrics.status = "ready";
            entry.gltf = gltf;
            entry.status = "ready";
            notify();
            resolve();
          },
          (err) => fail(err),
        );
      },
      undefined,
      (err) => fail(err),
    );
    function fail(err: unknown) {
      metrics.status = "error";
      metrics.error = err instanceof Error ? err.message : String(err);
      entry.error = err;
      entry.status = "error";
      if (process.env.NODE_ENV !== "production") console.warn(`[glb] failed to load ${url}; using the procedural model`, err);
      notify();
      resolve();
    }
  });
  cache.set(url, entry);
  e = entry;
  return e;
}

/** Suspends while loading; resolves to the asset or to an error (never throws for a failed asset). */
export function useGLB(url: string): { gltf: GLTF | null; error: unknown } {
  const entry = loadGLB(url);
  const status = useSyncExternalStore(subscribe, () => entry.status, () => entry.status);
  if (status === "loading") throw entry.promise;
  return status === "ready" ? { gltf: entry.gltf!, error: null } : { gltf: null, error: entry.error };
}

/** Reactive: true once any of the URLs has failed to load. */
export function useGLBFailed(urls: string[]): boolean {
  return useSyncExternalStore(
    subscribe,
    () => urls.some((u) => cache.get(u)?.status === "error"),
    () => false,
  );
}

/** Reactive: true once every one of the URLs has loaded and parsed. */
export function useGLBReady(urls: string[]): boolean {
  return useSyncExternalStore(
    subscribe,
    () => urls.every((u) => cache.get(u)?.status === "ready"),
    () => false,
  );
}

/** How many GLB rigs are currently mounted and active (the perf probe only judges frames with a real asset on stage). */
export const glbOnStage = { count: 0 };

export function glbStatus(url: string): GLBStatus | "idle" {
  return cache.get(url)?.status ?? "idle";
}
