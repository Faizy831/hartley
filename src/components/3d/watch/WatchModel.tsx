"use client";
import { Component, Suspense, type ReactNode } from "react";
import { ProceduralWatch } from "./Watch";
import { GLBWatch } from "../glb/GLBWatch";
import { loadGLB, useGLBFailed } from "../glb/loader";
import { MODELS } from "@/data/watches/models";
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

  const useGlb = !!model && watch.modelType === "glb" && !failed && (model.unsupportedFinish === "tint" || model.nativeFinishes.includes(watch.caseFinish.id));

  if (!useGlb || !model) return <ProceduralWatch watch={watch} labels={labels} />;

  // start both files in parallel before the component suspends on the first one
  for (const u of urls) loadGLB(u);
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
