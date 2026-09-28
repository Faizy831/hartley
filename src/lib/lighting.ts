/**
 * Hero lighting system.
 * Presets are lerped by `sceneCurrent.light` (a float index).
 */
export interface LightPreset {
  name: string;
  env: number;
  envRotation: number;
  key: number;
  keyColor: string;
  rim: number;
  rimColor: string;
  fill: number;
  fillColor: string;
  /** Page background behind the transparent canvas. */
  bg: string;
  /** Soft radial glow behind the watch. */
  glow: number;
  glowColor: string;
}

export const LIGHT_PRESETS: LightPreset[] = [
  {
    name: "hero",
    env: 0.55,
    envRotation: 0.3,
    key: 5,
    keyColor: "#fff4e6",
    rim: 4,
    rimColor: "#d8e2ff",
    fill: 0.35,
    fillColor: "#8fa2c8",
    bg: "#11100e",
    glow: 0.55,
    glowColor: "#2a241b",
  },
  {
    name: "technical",
    env: 0.8,
    envRotation: 1.2,
    key: 2.8,
    keyColor: "#f1ede6",
    rim: 4.5,
    rimColor: "#d6d8e2",
    fill: 0.9,
    fillColor: "#6f6a62",
    bg: "#151310",
    glow: 0.5,
    glowColor: "#2a251d",
  },
  {
    name: "craft",
    env: 0.8,
    envRotation: 2.1,
    key: 7,
    keyColor: "#ffd6ad",
    rim: 2.5,
    rimColor: "#ffc79b",
    fill: 0.6,
    fillColor: "#8a6a4d",
    bg: "#1a1815",
    glow: 0.6,
    glowColor: "#302a20",
  },
  {
    name: "paper",
    env: 1.35,
    envRotation: 0.8,
    key: 2.5,
    keyColor: "#fff8ee",
    rim: 1.2,
    rimColor: "#ffffff",
    fill: 1.4,
    fillColor: "#e9e2d6",
    bg: "#f3efe7",
    glow: 0.0,
    glowColor: "#f3efe7",
  },
  {
    name: "final",
    env: 0.42,
    envRotation: 3.4,
    key: 5.5,
    keyColor: "#ffffff",
    rim: 5,
    rimColor: "#c9d3ff",
    fill: 0.25,
    fillColor: "#6f6a62",
    bg: "#11100e",
    glow: 0.55,
    glowColor: "#2a241b",
  },
];

export const LIGHT = { hero: 0, technical: 1, craft: 2, paper: 3, final: 4 } as const;
