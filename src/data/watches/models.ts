import type { FamilyId } from "./types";
import type { CaseFinishId, StrapKind } from "../finishes";
import type { Quality } from "@/lib/store";

/**
 * Real 3D assets per family. A family listed here renders its client GLB
 * (`modelType: "glb"`) and keeps the procedural watch as the fallback for
 * low tiers, load failures and configurations that have no real asset yet.
 *
 * Conventions of the exported assets: Y-up, dial faces +Z, crown at +X,
 * root node already scaled so 1 unit = 20.5 mm and centred on the case.
 */
export interface FamilyModel {
  head: string;
  /** Real strap assets by construction. Kinds without one use the procedural strap on the real head. */
  straps: Partial<Record<StrapKind, string>>;
  /** Case finishes the GLB materials were authored for. */
  nativeFinishes: CaseFinishId[];
  /**
   * How other finishes are shown: "tint" keeps the real geometry and tints its
   * steel material families from the finish library; "procedural" falls back
   * to the procedural watch for that configuration.
   */
  unsupportedFinish: "tint" | "procedural";
  /** Lowest quality tier that renders the GLB; below it the procedural watch is used. */
  minQuality: Quality;
  /** Local fit against the procedural footprint (1 = as exported). */
  scale: number;
  offset: [number, number, number];
  /** Where the procedural strap fallback meets the real lugs (shift from the procedural strap origin). */
  strapInset: { y: number; z: number };
  /**
   * Finish colours authored in the client file (linear RGB), applied to the asset's steel families
   * when a configuration is not natively textured. Taken from the Mix-node "B" colour of the
   * client's `_4K_shiny_<finish>` / `_4k_<finish>` materials; silver is the authored asset itself.
   */
  finishTints: Partial<Record<CaseFinishId, [number, number, number]>>;
  /**
   * Which parts change with the finish, from the client's product photography:
   * case (case, crown), bracelet, furniture (hands, indices, accents). The movement never changes.
   * A value names the tint to use; null keeps the authored silver.
   */
  finishRules: Record<CaseFinishId, { case: CaseFinishId | null; bracelet: CaseFinishId | null; furniture: CaseFinishId | null }>;
  /**
   * How the asset's glass renders. "transmission" keeps the authored refractive sapphire (costs a
   * full-scene transmission pass per frame); "thin" is a transparent clearcoat surface.
   */
  glass: { crystal: "transmission" | "thin"; caseback: "transmission" | "thin" };
  /** Named animation clips inside the head asset. */
  clips: {
    /** Loop continuously while the watch is on stage. */
    idle: string[];
    /** Seconds hand clip: only its first frame is used as the reference pose; the hand is turned directly to the viewer's seconds. */
    seconds: string;
    /** Wheels of the seconds train (reference pose from their clips), turned with the seconds hand: [name, turns per minute]. */
    train: [string, number][];
  };
  /** Name of the asset's root node (scale + centring). Defaults to the scene's first child. */
  rootNode?: string;
  /**
   * Top-level node → exploded-view part (crystal, rehaut, bezel, hands, dial, case, movement, rotor, caseback).
   * Defaults to the Legacy group names (Crystal, Bezel, Hands, Dial, Case, Crown, Movement, Caseback).
   */
  parts?: Record<string, string>;
  /** Node names of the hour and minute hands (re-pivoted on the hands axis at runtime). Defaults to Hand_Hour / Hand_Minute. */
  hands?: { hour: string; minute: string };
  /**
   * Dial colour variants baked into the same asset: dial id → the nodes shown for it. Every node listed under any
   * variant is hidden unless it belongs to the active one. Families without variants leave this undefined.
   */
  dialVariants?: Record<string, string[]>;
}

export const MODELS: Partial<Record<FamilyId, FamilyModel>> = {
  legacy: {
    head: "/models/legacy/legacy-head.glb",
    straps: { bracelet: "/models/legacy/straps/steel-bracelet.glb" },
    nativeFinishes: ["silver"],
    unsupportedFinish: "tint",
    minQuality: "medium",
    scale: 1,
    offset: [0, 0, 0],
    strapInset: { y: -0.14, z: 0.02 },
    // validation 2026-09-27: refraction blurred the skeleton dial and the movement behind the caseback; thin
    // clearcoat surfaces read crisper (the product is an anti-reflective flat sapphire) and skip the transmission pass
    glass: { crystal: "thin", caseback: "thin" },
    finishTints: {
      gold: [0.558, 0.426, 0.168], // MetalStainlessSteelBrushed002_4K_shiny_gold
      rosegold: [0.694, 0.413, 0.323], // MetalStainlessSteelBrushed002_4K_shiny_rosegold
      black: [0.081, 0.081, 0.081], // MetalStainlessSteelBrushed002_4K_shiny_black
    },
    finishRules: {
      silver: { case: null, bracelet: null, furniture: null },
      gold: { case: "gold", bracelet: "gold", furniture: "gold" },
      rosegold: { case: "rosegold", bracelet: "rosegold", furniture: "rosegold" },
      black: { case: "black", bracelet: "black", furniture: null }, // photos: black case and bracelet, silver hands and numerals
      polished: { case: null, bracelet: null, furniture: null },
      brushed: { case: null, bracelet: null, furniture: null },
      titanium: { case: "black", bracelet: "black", furniture: null },
    },
    clips: {
      idle: ["Balance", "EscapeWheel", "PalletFork", "Hairspring"],
      seconds: "HandSeconds",
      // fourth wheel carries the seconds hand; the third wheel meshes with it (8:1, counter-rotating) — standard train ratio, not client data
      train: [["FourthWheel", 1], ["ThirdWheel", -1 / 8]],
    },
  },
  // Heritage (2026-09-28): quartz, no movement; the asset carries the approved ×1.4954 scale (case body 40 mm = 1.9512 units)
  // and the same node convention as Legacy (root = scale + centring, dial normal +Z, crown +X). See docs/heritage-glb/README.md.
  heritage: {
    head: "/models/heritage/heritage-head.glb",
    straps: { leather: "/models/heritage/straps/leather-black.glb", mesh: "/models/heritage/straps/mesh-silver.glb" },
    nativeFinishes: ["silver"],
    unsupportedFinish: "tint",
    minQuality: "medium",
    scale: 1,
    offset: [0, 0, 0],
    strapInset: { y: -0.14, z: 0.02 },
    glass: { crystal: "thin", caseback: "thin" }, // the Heritage back is solid steel; the crystal is a flat sapphire
    finishTints: {
      gold: [0.558, 0.426, 0.168],
      rosegold: [0.694, 0.413, 0.323],
      black: [0.081, 0.081, 0.081],
    },
    finishRules: {
      silver: { case: null, bracelet: null, furniture: null },
      gold: { case: "gold", bracelet: "gold", furniture: "gold" },
      rosegold: { case: "rosegold", bracelet: "rosegold", furniture: "rosegold" },
      black: { case: "black", bracelet: "black", furniture: null }, // client black variant: silver indices and hands
      polished: { case: null, bracelet: null, furniture: null },
      brushed: { case: null, bracelet: null, furniture: null },
      titanium: { case: "black", bracelet: "black", furniture: null },
    },
    clips: { idle: [], seconds: "HeritageSeconds", train: [] },
    rootNode: "HeritageWatch",
    parts: {
      Case: "case", Crown: "case", Crown_Tip: "case",
      Caseback: "caseback", Caseback_Ring: "caseback",
      Crystal: "crystal",
      Dial: "dial", Dial_Black: "dial", Indices: "dial",
      Rehaut: "rehaut", Rehaut_Black: "rehaut",
      Hands: "hands",
    },
    hands: { hour: "Hour", minute: "Minute" },
    dialVariants: { white: ["Dial", "Rehaut"], "black-matte": ["Dial_Black", "Rehaut_Black"] },
  },
};

export const QUALITY_RANK: Record<Quality, number> = { low: 0, medium: 1, high: 2 };

export interface ModelContext {
  quality: Quality;
  /** Set once measured frame times stay poor with a GLB on stage (sticky for the session). */
  glbDegraded: boolean;
  /** Thumbnail renders stay on the procedural renderer until GLB product renders exist. */
  thumbMode: boolean;
  /** Resolve the procedural renderer regardless of tier (the rig pre-builds a family's procedural sibling before its asset). */
  forceProcedural?: boolean;
}

/** QA override, read once: ?model=procedural|glb forces the renderer regardless of tier. */
const FORCED: "glb" | "procedural" | null = (() => {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("model");
  return v === "glb" || v === "procedural" ? v : null;
})();

/** Which renderer a family uses under the current conditions. Load failures are handled by the rig itself. */
export function decideModelType(family: FamilyId, ctx: ModelContext): "glb" | "procedural" {
  const m = MODELS[family];
  if (!m || ctx.thumbMode || ctx.forceProcedural) return "procedural";
  if (FORCED) return FORCED;
  if (ctx.glbDegraded) return "procedural";
  return QUALITY_RANK[ctx.quality] >= QUALITY_RANK[m.minQuality] ? "glb" : "procedural";
}
