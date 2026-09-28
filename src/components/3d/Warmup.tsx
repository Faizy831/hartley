"use client";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useStore } from "@/lib/store";
import { getWatch } from "@/data/watches";
import { STRAPS } from "@/data/finishes";
import { MODELS, decideModelType } from "@/data/watches/models";
import { glbStatus, glbOnStage } from "./glb/loader";
import { compileSteps, advance } from "@/lib/warm";

/**
 * First-frame warm-up. The preloader used to leave as soon as the files had downloaded, so the
 * object's first draws (50 shader programs, a dozen 2K textures, the environment PMREM and the
 * tone-mapping recompile) landed inside the opening sequence and GSAP jumped over the stalls.
 * This waits for the object on stage to be mounted, compiles the programs and uploads the textures a
 * few meshes per frame (the loading bar keeps moving), lets a few frames settle, then flags `sceneWarm`.
 */
export function Warmup() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const phase = useRef<"wait" | "compiling" | "settle" | "done">("wait");
  const settled = useRef(0);
  const steps = useRef<Generator<void, void, void> | null>(null);

  useFrame(() => {
    const st = useStore.getState();
    if (st.sceneWarm || phase.current === "done") return;
    if (phase.current === "wait") {
      const def = getWatch(st.activeWatchId);
      const model = MODELS[def.family];
      const wantGlb = !!model && decideModelType(def.family, { quality: st.quality, glbDegraded: st.glbDegraded, thumbMode: st.thumbMode }) === "glb";
      if (wantGlb && model) {
        const strapUrl = model.straps[STRAPS[def.strap]?.kind];
        const statuses = [model.head, ...(strapUrl ? [strapUrl] : [])].map(glbStatus);
        if (statuses.some((s) => s === "loading" || s === "idle")) return; // still downloading / parsing
        if (statuses.every((s) => s === "ready") && glbOnStage.count === 0) return; // rig not mounted yet
      }
      phase.current = "compiling";
      steps.current = compileSteps(scene, camera, scene, gl);
      return;
    }
    if (phase.current === "compiling") {
      if (steps.current && advance(steps.current, 3)) phase.current = "settle";
      return;
    }
    if (phase.current === "settle" && ++settled.current >= 4) {
      phase.current = "done";
      st.setSceneWarm(true);
    }
  });
  return null;
}
