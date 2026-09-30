"use client";
import { Component, Suspense, useEffect, useState, type ReactNode } from "react";
import { ProceduralWatch } from "./Watch";
import { GLBWatch } from "../glb/GLBWatch";
import { loadGLB, useGLBFailed, useGLBReady } from "../glb/loader";
import { rigState } from "../CameraRig";
import { MODELS } from "@/data/watches/models";
import { useStore } from "@/lib/store";
import { gsap } from "@/lib/gsap";
import type { ResolvedWatch } from "@/lib/resolveWatch";

/**
 * The object on stage for one resolved product: the family's real GLB when
 * it exists, is allowed by the quality tier and has not failed to load —
 * otherwise (and while the asset is still loading) the procedural watch.
 * Both models sit inside the same rig, so drag, choreography, exploded view
 * and labels are shared.
 */
export function WatchModel({ watch, labels = true }: { watch: ResolvedWatch; labels?: boolean }) {
  const model = MODELS[watch.arch.id];
  const strapUrl = model?.straps[watch.strap.kind];
  const urls = model ? [model.head, ...(strapUrl ? [strapUrl] : [])] : [];
  const failed = useGLBFailed(urls);
  const ready = useGLBReady(urls);

  const useGlb = !!model && watch.modelType === "glb" && !failed && (model.unsupportedFinish === "tint" || model.nativeFinishes.includes(watch.caseFinish.id));

  // start both files in parallel before the component suspends on the first one
  if (useGlb) for (const u of urls) loadGLB(u);

  // Under the preloader the asset takes the stage the moment it is in. Once the story is already running on
  // the procedural stand-in (the loader's safety exit), the real watch arrives inside the rig's short dip
  // instead of popping over the stand-in mid-frame.
  const [revealed, setRevealed] = useState(ready);
  const loaded = useStore((s) => s.loaded);
  const reduced = useStore((s) => s.reducedMotion);
  const thumbMode = useStore((s) => s.thumbMode);
  // latched during render: an asset that is in before the stage is live (or one warming off-stage) needs no dip
  if (!revealed && ready && useGlb && (!loaded || !labels)) setRevealed(true);
  useEffect(() => {
    if (revealed || !ready || !useGlb || !loaded || !labels) return;
    const dur = reduced || thumbMode ? 0.01 : 1;
    const tl = gsap.timeline();
    tl.to(rigState, { dim: 0.06, duration: 0.35 * dur, ease: "power2.in" })
      .add(() => setRevealed(true))
      .to(rigState, { dim: 1, duration: 0.85 * dur, ease: "power3.out" });
    return () => {
      if (tl.progress() < 1) {
        tl.kill();
        rigState.dim = 1;
      }
    };
  }, [ready, revealed, useGlb, loaded, labels, reduced, thumbMode]);

  if (!useGlb || !model || !revealed) return <ProceduralWatch watch={watch} labels={labels} />;
  const fallback = <ProceduralWatch watch={watch} labels={labels} />;
  return (
    <GLBBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GLBWatch model={model} watch={watch} labels={labels} strapUrl={strapUrl} />
      </Suspense>
    </GLBBoundary>
  );
}

/** A runtime error inside the GLB rig must never leave an empty stage. */
class GLBBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    if (process.env.NODE_ENV !== "production") console.warn("[glb] runtime error; using the procedural model", err);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
