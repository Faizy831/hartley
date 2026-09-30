"use client";
import { useStore } from "./store";
import { getWatch } from "@/data/watches";
import { STRAPS } from "@/data/finishes";
import { MODELS, decideModelType } from "@/data/watches/models";
import { glbStatus } from "@/components/3d/glb/loader";

/** Files of the real asset the product on stage renders with, or none when it renders procedurally. */
export function stageAssetUrls(): string[] {
  const st = useStore.getState();
  const def = getWatch(st.activeWatchId);
  const model = MODELS[def.family];
  if (!model || decideModelType(def.family, { quality: st.quality, glbDegraded: st.glbDegraded, thumbMode: st.thumbMode }) !== "glb") return [];
  const strapUrl = model.straps[STRAPS[def.strap]?.kind];
  return [model.head, ...(strapUrl ? [strapUrl] : [])];
}

/** True while the object on stage still waits for its real asset (not yet requested, downloading or parsing). */
export function stageAssetPending(): boolean {
  return stageAssetUrls().some((u) => {
    const s = glbStatus(u);
    return s === "loading" || s === "idle";
  });
}
