/**
 * Material library — the visual vocabulary shared by every watch family.
 * Only finishes that correspond to real Hartley products (plus the original
 * VELORIS X1 study) are defined here.
 */
export type CaseFinishId = "polished" | "brushed" | "titanium" | "rosegold" | "gold" | "black" | "silver";

export interface CaseFinish {
  id: CaseFinishId;
  label: string;
  color: string;
  polishedRoughness: number;
  brushedRoughness: number;
  anisotropy: number;
  swatch: string;
}

export const CASE_FINISHES: Record<CaseFinishId, CaseFinish> = {
  polished: { id: "polished", label: "Polished steel", color: "#e4e5e7", polishedRoughness: 0.06, brushedRoughness: 0.12, anisotropy: 0.0, swatch: "linear-gradient(135deg,#f4f4f5,#8f9094)" },
  brushed: { id: "brushed", label: "Brushed steel", color: "#d5d7da", polishedRoughness: 0.08, brushedRoughness: 0.42, anisotropy: 1.0, swatch: "linear-gradient(135deg,#d8d9dc,#7d7f84)" },
  titanium: { id: "titanium", label: "Black titanium", color: "#34363a", polishedRoughness: 0.18, brushedRoughness: 0.4, anisotropy: 0.7, swatch: "linear-gradient(135deg,#4a4c50,#1a1b1d)" },
  // Hartley case colours (316L stainless steel)
  silver: { id: "silver", label: "Silver", color: "#dcdee1", polishedRoughness: 0.07, brushedRoughness: 0.3, anisotropy: 0.8, swatch: "linear-gradient(135deg,#f0f0f2,#8f9094)" },
  gold: { id: "gold", label: "Gold", color: "#e3bd6a", polishedRoughness: 0.08, brushedRoughness: 0.24, anisotropy: 0.6, swatch: "linear-gradient(135deg,#f5d88d,#9a7431)" },
  rosegold: { id: "rosegold", label: "Rose Gold", color: "#e2a98f", polishedRoughness: 0.08, brushedRoughness: 0.26, anisotropy: 0.5, swatch: "linear-gradient(135deg,#f0c5ae,#9c6a55)" },
  black: { id: "black", label: "Black", color: "#2b2c30", polishedRoughness: 0.16, brushedRoughness: 0.34, anisotropy: 0.6, swatch: "linear-gradient(135deg,#4a4c50,#141517)" },
};

export type DialStyle = "sunburst" | "skeleton" | "minimal";

export interface DialSpec {
  id: string;
  label: string;
  color: string;
  ink: string;
  sunburst: number;
  swatch: string;
}

export const DIALS: Record<string, DialSpec> = {
  obsidian: { id: "obsidian", label: "Obsidian", color: "#0d0d10", ink: "#e5e1d9", sunburst: 1.0, swatch: "radial-gradient(circle at 35% 35%,#3a3a40,#050506)" },
  ivory: { id: "ivory", label: "Ivory", color: "#e6dfcf", ink: "#1b1a18", sunburst: 0.35, swatch: "radial-gradient(circle at 35% 35%,#fbf7ee,#c9c0ad)" },
  midnight: { id: "midnight", label: "Midnight blue", color: "#0f1f43", ink: "#dfe5f1", sunburst: 0.9, swatch: "radial-gradient(circle at 35% 35%,#2a4a8f,#060c1d)" },
  // Hartley
  "skeleton-black": { id: "skeleton-black", label: "Skeleton", color: "#101013", ink: "#dad5cc", sunburst: 0.4, swatch: "radial-gradient(circle at 35% 35%,#3a3a40,#050506)" },
  white: { id: "white", label: "White", color: "#efece6", ink: "#1a1918", sunburst: 0.0, swatch: "radial-gradient(circle at 35% 35%,#ffffff,#d8d4cc)" },
  "black-matte": { id: "black-matte", label: "Black", color: "#121214", ink: "#e2ddd4", sunburst: 0.0, swatch: "radial-gradient(circle at 35% 35%,#34343a,#060607)" },
};

export type StrapKind = "leather" | "croc" | "rubber" | "mesh" | "bracelet";

export interface StrapSpec {
  id: string;
  label: string;
  kind: StrapKind;
  /** Leather / rubber colour, or the metal finish for mesh & bracelet. */
  color: string;
  metal?: CaseFinishId;
  roughness: number;
  swatch: string;
}

export const STRAPS: Record<string, StrapSpec> = {
  // VELORIS X1
  "leather-black": { id: "leather-black", label: "Black leather", kind: "leather", color: "#141213", roughness: 0.62, swatch: "linear-gradient(135deg,#2b2729,#0b0a0a)" },
  "leather-brown": { id: "leather-brown", label: "Brown leather", kind: "leather", color: "#5e3d28", roughness: 0.66, swatch: "linear-gradient(135deg,#8a5a3b,#3a2416)" },
  "rubber-black": { id: "rubber-black", label: "Black silicone", kind: "rubber", color: "#111214", roughness: 0.82, swatch: "linear-gradient(135deg,#232427,#0a0a0b)" },
  // Hartley Legacy
  "bracelet-silver": { id: "bracelet-silver", label: "Steel bracelet", kind: "bracelet", color: "#dcdee1", metal: "silver", roughness: 0.3, swatch: "linear-gradient(135deg,#f0f0f2,#8f9094)" },
  "bracelet-gold": { id: "bracelet-gold", label: "Steel bracelet", kind: "bracelet", color: "#e3bd6a", metal: "gold", roughness: 0.3, swatch: "linear-gradient(135deg,#f5d88d,#9a7431)" },
  "bracelet-rosegold": { id: "bracelet-rosegold", label: "Steel bracelet", kind: "bracelet", color: "#e2a98f", metal: "rosegold", roughness: 0.3, swatch: "linear-gradient(135deg,#f0c5ae,#9c6a55)" },
  "bracelet-black": { id: "bracelet-black", label: "Steel bracelet", kind: "bracelet", color: "#2b2c30", metal: "black", roughness: 0.34, swatch: "linear-gradient(135deg,#4a4c50,#141517)" },
  "croc-black": { id: "croc-black", label: "Black croc", kind: "croc", color: "#121011", roughness: 0.4, swatch: "linear-gradient(135deg,#2a2628,#080707)" },
  "mesh-silver": { id: "mesh-silver", label: "Mesh strap", kind: "mesh", color: "#d3d5d9", metal: "silver", roughness: 0.42, swatch: "repeating-linear-gradient(45deg,#e6e6e8 0 2px,#8f9094 2px 4px)" },
  "mesh-gold": { id: "mesh-gold", label: "Mesh strap", kind: "mesh", color: "#dcb663", metal: "gold", roughness: 0.42, swatch: "repeating-linear-gradient(45deg,#f0d28a 0 2px,#9a7431 2px 4px)" },
  "mesh-rosegold": { id: "mesh-rosegold", label: "Mesh strap", kind: "mesh", color: "#dea48a", metal: "rosegold", roughness: 0.42, swatch: "repeating-linear-gradient(45deg,#f0c5ae 0 2px,#9c6a55 2px 4px)" },
  "mesh-black": { id: "mesh-black", label: "Mesh strap", kind: "mesh", color: "#26272b", metal: "black", roughness: 0.46, swatch: "repeating-linear-gradient(45deg,#44464b 0 2px,#111214 2px 4px)" },
  "rubber-white": { id: "rubber-white", label: "White silicone", kind: "rubber", color: "#e9e7e2", roughness: 0.8, swatch: "linear-gradient(135deg,#ffffff,#c9c7c2)" },
  // Hartley Heritage leathers (Italian leather)
  "leather-darkbrown": { id: "leather-darkbrown", label: "Dark brown leather", kind: "leather", color: "#3b2418", roughness: 0.6, swatch: "linear-gradient(135deg,#5c3a27,#20130c)" },
  "leather-white": { id: "leather-white", label: "White leather", kind: "leather", color: "#e8e3da", roughness: 0.62, swatch: "linear-gradient(135deg,#fbf8f2,#c9c3b8)" },
  "leather-grey": { id: "leather-grey", label: "Grey leather", kind: "leather", color: "#6d6a68", roughness: 0.62, swatch: "linear-gradient(135deg,#8c8987,#4a4846)" },
  "leather-pink": { id: "leather-pink", label: "Pink leather", kind: "leather", color: "#d9a9a6", roughness: 0.62, swatch: "linear-gradient(135deg,#efc6c3,#b98380)" },
  "leather-beige": { id: "leather-beige", label: "Beige leather", kind: "leather", color: "#c9b79b", roughness: 0.62, swatch: "linear-gradient(135deg,#e5d6bd,#a08e72)" },
};
