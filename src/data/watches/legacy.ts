import type { WatchDefinition, Spec } from "./types";
import type { CaseFinishId } from "../finishes";

/**
 * Hartley Legacy — data taken from int.hartleywatches.com (collection and
 * product pages, September 2026). Dial colour is not stated by the client
 * and is flagged for confirmation on every configuration.
 */
const BASE = "https://int.hartleywatches.com";

const CASES: { finish: CaseFinishId; label: string; slug: string }[] = [
  { finish: "silver", label: "Silver", slug: "silver" },
  { finish: "gold", label: "Gold", slug: "gold" },
  { finish: "rosegold", label: "Rose Gold", slug: "rose-gold" },
  { finish: "black", label: "Black", slug: "black" },
];

const STRAP_OPTIONS: { key: string; label: string; slugName: string; price: number; strapFor: (c: CaseFinishId) => string; collection: string; weight?: string; clasp?: string }[] = [
  { key: "bracelet", label: "Steel Bracelet", slugName: "steel-bracelet", price: 415, strapFor: (c) => `bracelet-${c}`, collection: "legacy-steel-bracelet", weight: "152 g" },
  { key: "croc", label: "Black Croc", slugName: "black-croc", price: 394, strapFor: () => "croc-black", collection: "legacy-black-leather-strap", weight: "85 g", clasp: "Butterfly clasp" },
  { key: "mesh", label: "Mesh Strap", slugName: "mesh-strap", price: 372, strapFor: (c) => `mesh-${c}`, collection: "legacy-mesh-strap" },
  { key: "rubber-black", label: "Black Silicone", slugName: "black-rubber", price: 372, strapFor: () => "rubber-black", collection: "legacy-black-rubber-strap" },
  { key: "rubber-white", label: "White Silicone", slugName: "white-rubber", price: 372, strapFor: () => "rubber-white", collection: "legacy-white-rubber-strap" },
];

const COMMON_SPECS: Spec[] = [
  { k: "Movement", v: "Miyota 21-jewel automatic mechanical", verified: true },
  { k: "Power reserve", v: "≈ 40 hours", verified: true },
  { k: "Case", v: "316L stainless steel", verified: true },
  { k: "Diameter", v: "43 mm", verified: true },
  { k: "Thickness", v: "11 mm", verified: true },
  { k: "Lug width", v: "20 mm", verified: true },
  { k: "Crystal", v: "Flat sapphire · anti-reflective both sides", verified: true },
  { k: "Caseback", v: "Sapphire exhibition", verified: true },
  { k: "Water resistance", v: "50 m (5 ATM)", verified: true },
  { k: "Edition", v: "1 of 125 limited edition pieces", verified: true },
  { k: "Warranty", v: "5 years", verified: true },
];

export const LEGACY_WATCHES: WatchDefinition[] = CASES.flatMap((c) =>
  STRAP_OPTIONS.map((s) => {
    const name = `Legacy ${c.label} with ${s.label}`;
    const slug = `legacy-${c.slug}-with-${s.slugName}`;
    const strapSpec: Spec =
      s.key === "croc"
        ? { k: "Strap", v: "Black Italian leather · crocodile embossing · butterfly clasp", verified: true }
        : s.key === "bracelet"
          ? { k: "Bracelet", v: `${c.label} steel bracelet`, verified: true }
          : { k: "Strap", v: s.label, verified: true };
    const specs: Spec[] = [...COMMON_SPECS, strapSpec];
    if (s.weight) specs.push({ k: "Weight", v: s.weight, verified: true });
    return {
      id: slug,
      slug,
      family: "legacy",
      name,
      shortName: `Legacy ${c.label}`,
      type: "automatic",
      caseFinish: c.finish,
      dial: "skeleton-black",
      strap: s.strapFor(c.finish),
      price: { amount: s.price, currency: "USD" },
      sourceUrl: `${BASE}/collections/${s.collection}/products/${slug}`,
      limitedEdition: "1 of 125",
      specifications: specs,
      needsClientConfirmation: ["dial colour and finish", "case finishing (polished / brushed areas)", "hands and indices finish", ...(s.weight ? [] : ["weight"])],
    };
  }),
);
