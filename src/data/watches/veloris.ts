import type { WatchDefinition } from "./types";

/** The original design study, kept as its own definition and family. */
export const VELORIS_X1: WatchDefinition = {
  id: "veloris-x1",
  slug: "veloris-x1",
  family: "veloris",
  name: "Veloris X1",
  shortName: "Veloris X1",
  type: "automatic",
  caseFinish: "brushed",
  dial: "obsidian",
  strap: "leather-black",
  price: { amount: 12800, currency: "USD" },
  specifications: [
    { k: "Reference", v: "X1-41-VX", verified: true },
    { k: "Case", v: "41 mm · 316L steel", verified: true },
    { k: "Thickness", v: "10.9 mm", verified: true },
    { k: "Crystal", v: "Sapphire · AR coated", verified: true },
    { k: "Movement", v: "Calibre VX-01 · Automatic", verified: true },
    { k: "Frequency", v: "28,800 vph · 4 Hz", verified: true },
    { k: "Power reserve", v: "72 hours", verified: true },
    { k: "Water resistance", v: "100 m", verified: true },
    { k: "Strap", v: "Calfskin · 20 mm", verified: true },
  ],
  needsClientConfirmation: [],
};
