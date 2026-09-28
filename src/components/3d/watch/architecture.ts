import type { WatchArchitecture } from "@/data/watches/types";

type Profile = [number, number][];

/**
 * Lathe profiles for a family. `r` scales radii, `h` scales heights, so
 * the same profiles produce a 43 mm × 11 mm Legacy and a 40 mm × 7 mm
 * Heritage from one geometry system.
 */
export function buildProfiles(a: WatchArchitecture) {
  const r = a.radius;
  const h = a.heightScale;
  const P = (pts: Profile): Profile => pts.map(([x, y]) => [x * r, y * h]);

  const caseMain = P([
    [0.9, -0.26],
    [0.97, -0.235],
    [1.02, -0.17],
    [1.045, -0.06],
    [1.045, 0.062],
    [1.0, 0.09],
    [0.86, 0.12],
    [0.84, 0.145],
  ]);
  const caseChamfer = P([
    [1.045, 0.062],
    [1.02, 0.125],
    [0.93, 0.145],
    [0.86, 0.145],
  ]);
  const caseBore = P([
    [0.84, 0.15],
    [0.84, 0.05],
    [0.8, -0.05],
    [0.8, -0.26],
    [0.9, -0.262],
  ]);

  const bezel: Profile =
    a.bezel === "rounded"
      ? P([
          [0.86, 0.145],
          [1.02, 0.145],
          [1.035, 0.19],
          [1.0, 0.265],
          [0.9, 0.3],
          [0.845, 0.3],
          [0.845, 0.22],
          [0.86, 0.145],
        ])
      : P([
          [0.86, 0.145],
          [1.02, 0.145],
          [1.03, 0.19],
          [1.0, 0.25],
          [0.9, 0.275],
          [0.845, 0.275],
          [0.845, 0.22],
          [0.86, 0.145],
        ]);

  const rehaut = P([
    [0.75, 0.19],
    [0.845, 0.19],
    [0.845, 0.29],
    [0.78, 0.245],
    [0.75, 0.19],
  ]);

  // The crystal keeps its own vertical scale: a flat sapphire is a plate, not a dome
  const crystal: Profile =
    a.crystal === "domed"
      ? P([
          [0.0, 0.212],
          [0.8, 0.212],
          [0.842, 0.23],
          [0.842, 0.29],
          [0.83, 0.325],
          [0.72, 0.36],
          [0.52, 0.388],
          [0.27, 0.402],
          [0.0, 0.406],
        ])
      : [
          [0.0, 0.212 * h],
          [0.8 * r, 0.212 * h],
          [0.842 * r, 0.23 * h],
          [0.842 * r, 0.29 * h],
          [0.835 * r, 0.29 * h + 0.03],
          [0.0, 0.29 * h + 0.034],
        ];

  const casebackRing = P([
    [0.7, -0.29],
    [0.72, -0.26],
    [0.8, -0.26],
    [0.965, -0.26],
    [0.965, -0.3],
    [0.9, -0.335],
    [0.74, -0.335],
    [0.7, -0.31],
    [0.7, -0.29],
  ]);
  // Solid steel back for families without an exhibition window
  const casebackSolid = P([
    [0.0, -0.26],
    [0.8, -0.26],
    [0.965, -0.26],
    [0.965, -0.3],
    [0.9, -0.335],
    [0.0, -0.335],
  ]);

  const crownTube: Profile = [
    [0.0, 0.0],
    [0.075, 0.0],
    [0.075, 0.08],
    [0.0, 0.08],
  ];

  return {
    r,
    h,
    caseMain,
    caseChamfer,
    caseBore,
    bezel,
    rehaut,
    crystal,
    casebackRing,
    casebackSolid,
    crownTube,
    // key z levels
    dialZ: 0.2 * h,
    crystalTop: a.crystal === "domed" ? 0.406 : 0.29 * h + 0.034,
    casebackZ: -0.312 * h,
    lugZ: -0.07 * h,
    lugThickness: 0.25 * Math.max(0.65, h),
    crownX: 1.04 * r,
  };
}
