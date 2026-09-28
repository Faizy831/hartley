import { ARCHITECTURES, FAMILIES, getWatch, type WatchDefinition, type WatchArchitecture, type FamilyStory } from "@/data/watches";
import { CASE_FINISHES, DIALS, STRAPS, type CaseFinish, type DialSpec, type StrapSpec, type CaseFinishId } from "@/data/finishes";
import { decideModelType, type ModelContext } from "@/data/watches/models";

export interface Overrides {
  caseFinish?: CaseFinishId;
  dial?: string;
  strap?: string;
}

/** Everything the renderer needs about the watch currently on stage. */
export interface ResolvedWatch {
  def: WatchDefinition;
  arch: WatchArchitecture;
  family: FamilyStory;
  caseFinish: CaseFinish;
  dial: DialSpec;
  strap: StrapSpec;
  /** Remount key: geometry-level differences. */
  geometryKey: string;
  /** Renderer for this product under the current conditions (the rig still falls back to procedural if the asset fails). */
  modelType: "glb" | "procedural";
}

/** Default context: the family's best renderer (used where no runtime context is available). */
const DEFAULT_CONTEXT: ModelContext = { quality: "high", glbDegraded: false, thumbMode: false };

export function resolveWatch(id: string, ov: Overrides = {}, ctx: ModelContext = DEFAULT_CONTEXT): ResolvedWatch {
  const def = getWatch(id);
  const arch = ARCHITECTURES[def.family];
  const family = FAMILIES[def.family];
  const caseFinish = CASE_FINISHES[ov.caseFinish ?? def.caseFinish];
  const dial = DIALS[ov.dial ?? def.dial] ?? DIALS[def.dial];
  const strap = STRAPS[ov.strap ?? def.strap] ?? STRAPS[def.strap];
  const modelType = decideModelType(arch.id, ctx);
  return { def, arch, family, caseFinish, dial, strap, geometryKey: `${arch.id}:${strap.kind}:${modelType}`, modelType };
}
