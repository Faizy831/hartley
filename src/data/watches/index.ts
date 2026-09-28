import { LEGACY_WATCHES } from "./legacy";
import { HERITAGE_WATCHES } from "./heritage";
import { VELORIS_X1 } from "./veloris";
import { ARCHITECTURES, FAMILIES } from "./families";
import type { WatchDefinition, FamilyId } from "./types";
import { CASE_FINISHES, DIALS, STRAPS } from "../finishes";

export { ARCHITECTURES, FAMILIES };
export type { WatchDefinition, FamilyId, WatchArchitecture, FamilyStory, Spec } from "./types";

export const WATCHES: WatchDefinition[] = [...LEGACY_WATCHES, ...HERITAGE_WATCHES, VELORIS_X1];
const byId = new Map(WATCHES.map((w) => [w.id, w]));

export function getWatch(id: string): WatchDefinition {
  return byId.get(id) ?? DEFAULT_WATCH;
}
export function findWatch(id: string): WatchDefinition | undefined {
  return byId.get(id);
}
export function watchesOf(family: FamilyId) {
  return WATCHES.filter((w) => w.family === family);
}

/** The hero watch: the object the brand is introduced with. */
export const DEFAULT_WATCH = LEGACY_WATCHES.find((w) => w.id === "legacy-silver-with-steel-bracelet") ?? LEGACY_WATCHES[0];
export const DEFAULT_HERITAGE = HERITAGE_WATCHES.find((w) => w.id === "heritage-silver-with-black-leather") ?? HERITAGE_WATCHES[0];

/** Curated selector options per family (real configurations only). */
export function familyOptions(family: FamilyId) {
  const list = watchesOf(family);
  const cases = Array.from(new Set(list.map((w) => w.caseFinish))).map((id) => CASE_FINISHES[id]);
  const straps = Array.from(new Set(list.map((w) => w.strap))).map((id) => STRAPS[id]);
  const dials = Array.from(new Set(list.map((w) => w.dial))).map((id) => DIALS[id]);
  return { cases, straps, dials };
}

/** Find the real product closest to a requested (case, strap, dial) combination. */
export function resolveSibling(family: FamilyId, want: { caseFinish?: string; strap?: string; dial?: string }, current: WatchDefinition): WatchDefinition | undefined {
  const list = watchesOf(family);
  const caseFinish = want.caseFinish ?? current.caseFinish;
  const dial = want.dial ?? current.dial;
  const strap = want.strap ?? current.strap;
  const strapKind = STRAPS[strap]?.kind;
  const score = (w: WatchDefinition) => {
    let s = 0;
    if (w.caseFinish === caseFinish) s += 4;
    if (w.strap === strap) s += 3;
    else if (STRAPS[w.strap]?.kind === strapKind) s += 2;
    if (w.dial === dial) s += 1;
    return s;
  };
  return [...list].sort((a, b) => score(b) - score(a))[0];
}
