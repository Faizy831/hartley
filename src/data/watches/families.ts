import type { WatchArchitecture, FamilyStory, FamilyId } from "./types";

/* ------------------------------------------------------------------
   Geometry architectures
   ------------------------------------------------------------------ */
export const ARCHITECTURES: Record<FamilyId, WatchArchitecture> = {
  // The original study — 41 mm, domed crystal, sunburst dial, in-house calibre
  veloris: {
    id: "veloris",
    radius: 1.0,
    heightScale: 1.0,
    crystal: "domed",
    bezel: "rounded",
    dialStyle: "sunburst",
    indices: "applied-lume",
    hands: "dauphine",
    handsFinish: "rhodium",
    crown: "fluted",
    lugLength: 0.5,
    strapWidth: 0.94,
    exhibitionBack: true,
    movement: "automatic",
    dialBrand: "VELORIS",
    dialSubline: "MANUFACTURE",
    dialFootline: "AUTOMATIC",
    casebackText: "VELORIS  ·  CALIBRE VX-01  ·  41 MM  ·  100 M / 330 FT  ·  SAPPHIRE  ·  316L  ·  ",
  },
  // Hartley Legacy — 43 mm × 11 mm, flat sapphire, skeletonized automatic, exhibition back
  legacy: {
    id: "legacy",
    radius: 43 / 41,
    heightScale: 1.0,
    crystal: "flat",
    bezel: "rounded",
    dialStyle: "skeleton",
    indices: "applied-thin",
    hands: "dauphine",
    handsFinish: "case",
    crown: "fluted",
    lugLength: 0.52,
    strapWidth: 0.98, // 20 mm lugs
    exhibitionBack: true,
    movement: "automatic",
    dialBrand: "HARTLEY",
    dialSubline: "LEGACY",
    dialFootline: "AUTOMATIC",
    casebackText: "HARTLEY  ·  LEGACY  ·  AUTOMATIC  ·  21 JEWELS  ·  1 OF 125  ·  316L  ·  5 ATM  ·  ",
  },
  // Hartley Heritage — 40 mm × 7 mm slim quartz, flat sapphire, clean dial, solid back
  heritage: {
    id: "heritage",
    radius: 40 / 41,
    heightScale: 0.58,
    crystal: "flat",
    bezel: "thin",
    dialStyle: "minimal",
    indices: "applied-thin",
    hands: "stick",
    handsFinish: "case",
    crown: "plain",
    lugLength: 0.42,
    strapWidth: 0.98,
    exhibitionBack: false,
    movement: "quartz",
    dialBrand: "HARTLEY",
    dialSubline: undefined,
    dialFootline: undefined,
    casebackText: "HARTLEY  ·  HERITAGE  ·  QUARTZ  ·  316L  ·  SAPPHIRE  ·  5 ATM  ·  ",
  },
};

/* ------------------------------------------------------------------
   Editorial copy per family. Specifications inside copy are limited to
   what the client's website states; everything else is brand voice.
   ------------------------------------------------------------------ */
export const FAMILIES: Record<FamilyId, FamilyStory> = {
  legacy: {
    id: "legacy",
    name: "Legacy",
    tagline: "Mechanical.",
    heroLines: ["Time,", "in motion."],
    intro: "A limited-edition automatic. Twenty-one jewels, a skeletonized movement and a sapphire back that hides nothing. One of 125.",
    chapters: {
      object: { headline: "One object.\nEvery decision *made once.*", body: "The Legacy was drawn around its movement. A 43 mm case in 316L stainless steel, a flat sapphire crystal with anti-reflective coating on both sides, and a skeletonized dial that shows the mechanism working." },
      case: { headline: "Precision begins\nbefore the movement\n*ever turns.*", body: "Forty-three millimetres across and eleven high, machined from 316L stainless steel and finished in four case colours. Twenty-millimetre lugs take a steel bracelet, mesh, croc-embossed leather or silicone." },
      dial: { headline: "Designed to show\nwhat keeps *the time.*", body: "The dial is skeletonized. Through it, the balance, the bridges and the twenty-one synthetic sapphire jewels are visible under a flat sapphire crystal with dual-sided anti-reflective coating." },
      movement: { headline: "Twenty-one jewels.\nOne *continuous rhythm.*", body: "A Miyota 21-jewel automatic mechanical movement with around forty hours of power reserve, shown through a sapphire exhibition caseback. Each Legacy is one of 125 pieces." },
      craft: { headline: "Finished to be seen\nfrom *both sides.*", body: "Skeletonized from the front, exposed from the back. The Legacy is built to be looked into as much as looked at, and is covered by a five-year warranty." },
      editorial: { headline: "Built to be worn.\nDesigned to be\n*remembered.*", body: "A mechanical watch keeps time the way it was kept before time was a signal: with a spring, a wheel and a balance.", quote: "“One of 125. Every one of them running.”" },
    },
    exploded: [
      { part: "crystal", title: "Crystal", detail: "Flat sapphire · Dual AR coating" },
      { part: "bezel", title: "Bezel", detail: "316L stainless steel" },
      { part: "hands", title: "Hands", detail: "Colour-matched to the case" },
      { part: "dial", title: "Dial", detail: "Skeletonized" },
      { part: "case", title: "Case", detail: "316L stainless steel · 43 mm" },
      { part: "movement", title: "Movement", detail: "Miyota automatic · 21 jewels" },
      { part: "rotor", title: "Rotor", detail: "Automatic winding" },
      { part: "caseback", title: "Caseback", detail: "Sapphire exhibition · 50 m" },
    ],
    strip: [
      { v: "43", u: "mm", k: "Diameter" },
      { v: "11", u: "mm", k: "Thickness" },
      { v: "21", u: "", k: "Jewels" },
      { v: "50", u: "m", k: "Water resistance" },
    ],
  },
  heritage: {
    id: "heritage",
    name: "Heritage",
    tagline: "Minimal.",
    heroLines: ["Time,", "reduced."],
    intro: "A minimalist quartz watch, seven millimetres slim. Since 2014, more than ten thousand have been worn in over fifty countries.",
    chapters: {
      object: { headline: "Only the\nnecessary *elements.*", body: "The Heritage was designed with minimalism in mind. A 40 mm polished case, a clean dial with no complications, and a profile seven millimetres slim. A true unisex watch." },
      case: { headline: "Seven millimetres.\nNothing *to spare.*", body: "A 40 mm case in 316L stainless steel, seven millimetres from caseback to crystal, in silver, gold, rose gold or black. Twenty-millimetre lugs take Italian leather or a mesh strap." },
      dial: { headline: "A clean dial.\nNo *complications.*", body: "Slim applied markers and stick hands under a sapphire crystal. The dial says what time it is and nothing else." },
      movement: { headline: "Accurate.\n*Quietly.*", body: "A highly accurate Miyota quartz movement from Japan, behind a solid steel caseback. Water resistant to 50 metres." },
      craft: { headline: "Simplicity,\n*made luxurious.*", body: "Since its debut in 2014 the Heritage collection has sold more than 10,000 pieces in over 50 countries. Every one carries a five-year warranty." },
      editorial: { headline: "Built to be worn.\nDesigned to be\n*forgotten on the wrist.*", body: "At forty grams the Heritage is barely there, which is the point of a watch you wear every day.", quote: "“Simplicity can indeed be luxurious.”" },
    },
    exploded: [
      { part: "crystal", title: "Crystal", detail: "Sapphire" },
      { part: "bezel", title: "Bezel", detail: "316L · polished" },
      { part: "hands", title: "Hands", detail: "Stick · colour-matched" },
      { part: "dial", title: "Dial", detail: "Clean · no complications" },
      { part: "case", title: "Case", detail: "316L stainless steel · 40 mm" },
      { part: "caseback", title: "Caseback", detail: "Solid steel · 50 m" },
    ],
    strip: [
      { v: "40", u: "mm", k: "Diameter" },
      { v: "7", u: "mm", k: "Slim profile" },
      { v: "40", u: "g", k: "Weight" },
      { v: "50", u: "m", k: "Water resistance" },
    ],
  },
  veloris: {
    id: "veloris",
    name: "Veloris X1",
    tagline: "Engineered.",
    heroLines: ["Time,", "Engineered."],
    intro: "A study in precision, material and mechanical movement.",
    chapters: {
      object: { headline: "One object.\nEvery decision *made once.*", body: "The X1 was designed backwards: from the way a watch feels on the wrist at the end of a long day, to the mechanism that keeps it honest. Nothing on it is decorative. Everything on it is decided." },
      case: { headline: "Precision begins\nbefore the movement\n*ever turns.*", body: "Milled from a single billet of 316L, the case is brushed along its flanks and polished on a 0.4 mm chamfer that runs unbroken into the lugs. The crown is fluted by hand and signed." },
      dial: { headline: "Designed to disappear\ninto perfect\n*readability.*", body: "Twelve coats of lacquer over a sunburst-brushed brass blank. Applied indices, faceted hands, a printed minute track. It is read in a glance and studied for an hour." },
      movement: { headline: "Hundreds of components.\nOne *continuous rhythm.*", body: "Calibre VX-01 beats 28,800 times an hour behind a sapphire exhibition back. A tungsten rotor winds it in both directions. Seventy-two hours of reserve, held to chronometer tolerance." },
      craft: { headline: "Finished by hand.\nMeasured *by machine.*", body: "Sixty-two chamfered edges. Forty hours of polishing per case. Every tolerance held to a hundredth of a millimetre, then checked again by a person." },
      editorial: { headline: "Built to be worn.\nDesigned to be\n*remembered.*", body: "A watch is the only machine we wear for its silence. The X1 keeps time the way it was kept before time was a signal: with a spring, a wheel and a balance, and with someone who checked.", quote: "“The most expensive thing on this watch is what we left off it.”" },
    },
    exploded: [
      { part: "crystal", title: "Crystal", detail: "Sapphire · Double AR coating" },
      { part: "bezel", title: "Bezel", detail: "Polished 316L · 0.4 mm chamfer" },
      { part: "hands", title: "Hands", detail: "Rhodium plated · Faceted" },
      { part: "dial", title: "Dial", detail: "Sunburst lacquer · Applied indices" },
      { part: "case", title: "Case", detail: "316L stainless steel · 41 mm" },
      { part: "movement", title: "Movement", detail: "Calibre VX-01 · 28,800 vph" },
      { part: "rotor", title: "Rotor", detail: "Tungsten weight · Bidirectional" },
      { part: "caseback", title: "Caseback", detail: "Sapphire exhibition · 100 m" },
    ],
    strip: [
      { v: "41", u: "mm", k: "Diameter" },
      { v: "10.9", u: "mm", k: "Height" },
      { v: "100", u: "m", k: "Water resistance" },
      { v: "72", u: "h", k: "Power reserve" },
    ],
  },
};
