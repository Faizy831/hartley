import type { WatchDefinition, Spec } from "./types";
import type { CaseFinishId } from "../finishes";

/**
 * Hartley Heritage — data taken from int.hartleywatches.com (collection and
 * product pages, September 2026). Only the rose-gold models state a dial
 * colour in their name; the other dials were confirmed against the client's
 * product photography on 2026-09-28 (black → black dial, silver → white dial,
 * gold → black dial with gold hands and indices).
 */
const BASE = "https://int.hartleywatches.com";

interface Row {
  name: string;
  slug: string;
  collection: string;
  finish: CaseFinishId;
  dial: "white" | "black-matte";
  dialVerified: boolean;
  strap: string;
  strapLabel: string;
}

const rows: Row[] = [
  // Mesh
  { name: "Heritage Black with Black Mesh", slug: "heritage-black-with-black-mesh", collection: "heritage-mesh-strap", finish: "black", dial: "black-matte", dialVerified: true, strap: "mesh-black", strapLabel: "Black mesh" },
  { name: "Heritage Silver with Silver Mesh", slug: "heritage-silver-with-silver-mesh", collection: "heritage-mesh-strap", finish: "silver", dial: "white", dialVerified: true, strap: "mesh-silver", strapLabel: "Silver mesh" },
  { name: "Heritage Gold with Gold Mesh", slug: "heritage-gold-with-gold-mesh", collection: "heritage-mesh-strap", finish: "gold", dial: "black-matte", dialVerified: true, strap: "mesh-gold", strapLabel: "Gold mesh" },
  { name: "Heritage Rose Gold White Dial with Rose Gold Mesh", slug: "heritage-rose-gold-white-dial-with-rose-gold-mesh", collection: "heritage-mesh-strap", finish: "rosegold", dial: "white", dialVerified: true, strap: "mesh-rosegold", strapLabel: "Rose gold mesh" },
  { name: "Heritage Rose Gold Black Dial with Rose Gold Mesh", slug: "heritage-rose-gold-black-dial-with-rose-gold-mesh", collection: "heritage-mesh-strap", finish: "rosegold", dial: "black-matte", dialVerified: true, strap: "mesh-rosegold", strapLabel: "Rose gold mesh" },
  // Black leather
  { name: "Heritage Black with Black Leather", slug: "heritage-black-with-black-leather", collection: "heritage-black-leather-straps", finish: "black", dial: "black-matte", dialVerified: true, strap: "leather-black", strapLabel: "Black Italian leather" },
  { name: "Heritage Silver with Black Leather", slug: "heritage-silver-with-black-leather", collection: "heritage-black-leather-straps", finish: "silver", dial: "white", dialVerified: true, strap: "leather-black", strapLabel: "Black Italian leather" },
  { name: "Heritage Gold with Black Leather", slug: "heritage-gold-with-black-leather", collection: "heritage-black-leather-straps", finish: "gold", dial: "black-matte", dialVerified: true, strap: "leather-black", strapLabel: "Black Italian leather" },
  { name: "Heritage Rose Gold White Dial with Black Leather", slug: "heritage-rose-gold-white-dial-with-black-leather", collection: "heritage-black-leather-straps", finish: "rosegold", dial: "white", dialVerified: true, strap: "leather-black", strapLabel: "Black Italian leather" },
  { name: "Heritage Rose Gold Black Dial with Black Leather", slug: "heritage-rose-gold-black-dial-with-black-leather", collection: "heritage-black-leather-straps", finish: "rosegold", dial: "black-matte", dialVerified: true, strap: "leather-black", strapLabel: "Black Italian leather" },
  // Coloured leather
  { name: "Heritage Black with Dark Brown Leather", slug: "heritage-black-with-dark-brown-leather", collection: "heritage-coloured-leather-strap", finish: "black", dial: "black-matte", dialVerified: true, strap: "leather-darkbrown", strapLabel: "Dark brown leather" },
  { name: "Heritage Silver with White Leather", slug: "heritage-silver-with-white-leather", collection: "heritage-coloured-leather-strap", finish: "silver", dial: "white", dialVerified: true, strap: "leather-white", strapLabel: "White leather" },
  { name: "Heritage Gold with Brown Leather", slug: "heritage-gold-with-brown-leather", collection: "heritage-coloured-leather-strap", finish: "gold", dial: "black-matte", dialVerified: true, strap: "leather-brown", strapLabel: "Brown leather" },
  { name: "Heritage Rose Gold White Dial with Pink Leather", slug: "heritage-rose-gold-white-dial-with-pink-leather", collection: "heritage-coloured-leather-strap", finish: "rosegold", dial: "white", dialVerified: true, strap: "leather-pink", strapLabel: "Pink leather" },
  { name: "Heritage Rose Gold Black Dial with Beige Leather", slug: "heritage-rose-gold-black-dial-with-beige-leather", collection: "heritage-coloured-leather-strap", finish: "rosegold", dial: "black-matte", dialVerified: true, strap: "leather-beige", strapLabel: "Beige leather" },
  // Popular combinations
  { name: "Heritage Black with White Leather", slug: "heritage-black-with-white-leather", collection: "heritage-popular-strap-combinations", finish: "black", dial: "black-matte", dialVerified: true, strap: "leather-white", strapLabel: "White leather" },
  { name: "Heritage Silver with Grey Leather", slug: "heritage-silver-with-grey-leather", collection: "heritage-popular-strap-combinations", finish: "silver", dial: "white", dialVerified: true, strap: "leather-grey", strapLabel: "Grey leather" },
  { name: "Heritage Gold with Black Mesh", slug: "heritage-gold-with-black-mesh", collection: "heritage-popular-strap-combinations", finish: "gold", dial: "black-matte", dialVerified: true, strap: "mesh-black", strapLabel: "Black mesh" },
  { name: "Heritage Rose Gold White Dial with Beige Leather", slug: "heritage-rose-gold-white-dial-with-beige-leather", collection: "heritage-popular-strap-combinations", finish: "rosegold", dial: "white", dialVerified: true, strap: "leather-beige", strapLabel: "Beige leather" },
  { name: "Heritage Rose Gold Black Dial with Black Mesh", slug: "heritage-rose-gold-black-dial-with-black-mesh", collection: "heritage-popular-strap-combinations", finish: "rosegold", dial: "black-matte", dialVerified: true, strap: "mesh-black", strapLabel: "Black mesh" },
];

const COMMON_SPECS: Spec[] = [
  { k: "Movement", v: "Miyota quartz (Japan)", verified: true },
  { k: "Case", v: "316L stainless steel", verified: true },
  { k: "Diameter", v: "40 mm", verified: true },
  { k: "Thickness", v: "7 mm", verified: true },
  { k: "Lug width", v: "20 mm", verified: true },
  { k: "Crystal", v: "Sapphire", verified: true },
  { k: "Water resistance", v: "50 m (5 ATM)", verified: true },
  { k: "Weight", v: "40 g", verified: true },
  { k: "Warranty", v: "5 years", verified: true },
];

const finishLabel: Record<string, string> = { silver: "Silver", gold: "Gold", rosegold: "Rose Gold", black: "Black" };

export const HERITAGE_WATCHES: WatchDefinition[] = rows.map((r) => ({
  id: r.slug,
  slug: r.slug,
  family: "heritage",
  name: r.name,
  shortName: `Heritage ${finishLabel[r.finish]}`,
  type: "quartz",
  caseFinish: r.finish,
  dial: r.dial,
  strap: r.strap,
  price: { amount: 129, currency: "USD" },
  sourceUrl: `${BASE}/collections/${r.collection}/products/${r.slug}`,
  specifications: [...COMMON_SPECS, { k: "Strap", v: r.strapLabel, verified: true }, { k: "Dial", v: r.dial === "white" ? "White" : "Black", verified: r.dialVerified }],
  needsClientConfirmation: [...(r.dialVerified ? [] : ["dial colour"]), "hands and indices finish", "caseback finishing"],
}));
