"use client";
import { createContext, useContext } from "react";
import type { WatchMaterials } from "./materials";
import type { ResolvedWatch } from "@/lib/resolveWatch";
import type { buildProfiles } from "./architecture";

export interface WatchContextValue {
  materials: WatchMaterials;
  watch: ResolvedWatch;
  profiles: ReturnType<typeof buildProfiles>;
  detail: number;
  seg: number;
}

export const WatchContext = createContext<WatchContextValue | null>(null);

export function useWatch() {
  const c = useContext(WatchContext);
  if (!c) throw new Error("WatchContext missing");
  return c;
}

/** Smoothstep used for the exploded view so parts ease apart. */
export function easeExplode(e: number) {
  const x = Math.min(1, Math.max(0, e));
  return x * x * (3 - 2 * x);
}
