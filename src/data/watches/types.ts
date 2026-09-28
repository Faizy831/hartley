import type { CaseFinishId, DialStyle } from "../finishes";

export type FamilyId = "legacy" | "heritage" | "veloris";

/**
 * A verifiable specification line. `verified: false` means the value could
 * not be confirmed on the client's website and needs client confirmation
 * before it is presented as fact.
 */
export interface Spec {
  k: string;
  v: string;
  verified: boolean;
}

/**
 * Geometry architecture of a watch family. Everything is procedural: the
 * same lathe profiles, hand and strap builders are driven by these numbers.
 * 1 world unit ≈ 20.5 mm (the X1's 41 mm case → radius 1.0).
 */
export interface WatchArchitecture {
  id: FamilyId;
  /** Case radius in world units. */
  radius: number;
  /** Vertical scale applied to the case / bezel / crystal profiles. */
  heightScale: number;
  crystal: "domed" | "flat";
  bezel: "rounded" | "thin";
  dialStyle: DialStyle;
  indices: "applied-lume" | "applied-thin" | "printed";
  hands: "dauphine" | "stick";
  handsFinish: "rhodium" | "case";
  crown: "fluted" | "plain";
  lugLength: number;
  strapWidth: number;
  /** Visible mechanical movement (exhibition caseback + skeleton / back view). */
  exhibitionBack: boolean;
  movement: "automatic" | "quartz";
  /** Brand mark printed on the dial. */
  dialBrand: string;
  dialSubline?: string;
  dialFootline?: string;
  casebackText: string;
}

export interface WatchDefinition {
  id: string;
  slug: string;
  family: FamilyId;
  /** Full product name as listed by the client. */
  name: string;
  /** Short display name (e.g. "Legacy Gold"). */
  shortName: string;
  type: "automatic" | "quartz";
  caseFinish: CaseFinishId;
  dial: string;
  strap: string;
  price?: { amount: number; currency: "USD" };
  /** Client product URL the data was taken from. */
  sourceUrl?: string;
  limitedEdition?: string;
  specifications: Spec[];
  /** Fields whose values are not stated on the client site. */
  needsClientConfirmation: string[];
}

export interface FamilyStory {
  id: FamilyId;
  name: string;
  tagline: string;
  /** Hero lines (behind the object). */
  heroLines: [string, string];
  intro: string;
  /** Chapter copy reused by the product-detail template. */
  chapters: {
    object: { headline: string; body: string };
    case: { headline: string; body: string };
    dial: { headline: string; body: string };
    movement: { headline: string; body: string };
    craft: { headline: string; body: string };
    editorial: { headline: string; body: string; quote: string };
  };
  /** Exploded-view plates: part → title / detail. */
  exploded: { part: string; title: string; detail: string }[];
  /** Section header strip figures. */
  strip: { v: string; u: string; k: string }[];
}
