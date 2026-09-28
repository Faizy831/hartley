"use client";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { resolveWatch, type ResolvedWatch } from "@/lib/resolveWatch";

/** The fully resolved product currently on stage (definition + overrides). */
export function useActiveWatch(): ResolvedWatch {
  const id = useStore((s) => s.activeWatchId);
  const ov = useStore((s) => s.overrides);
  const quality = useStore((s) => s.quality);
  const glbDegraded = useStore((s) => s.glbDegraded);
  const thumbMode = useStore((s) => s.thumbMode);
  return useMemo(() => resolveWatch(id, ov, { quality, glbDegraded, thumbMode }), [id, ov, quality, glbDegraded, thumbMode]);
}
