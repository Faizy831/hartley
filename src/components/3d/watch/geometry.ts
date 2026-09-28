import * as THREE from "three";

/**
 * All watch geometry is procedural. The local frame is:
 *   +Z = dial normal (faces the camera at rest)
 *   +Y = 12 o'clock
 *   +X = 3 o'clock (crown side)
 * 1 world unit ≈ 20.5 mm (case radius = 1.0 → 41 mm).
 */

type Profile = [number, number][];

/** Revolve an (r, height) profile around the Z axis. */
export function lathe(profile: Profile, segments = 160): THREE.BufferGeometry {
  const pts = profile.map(([r, h]) => new THREE.Vector2(r, h));
  const g = new THREE.LatheGeometry(pts, segments);
  g.rotateX(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

// ---- Case body (ring with an inner bore for the movement) --------------
export const CASE_PROFILE: Profile = [
  [0.8, -0.26],
  [0.9, -0.26],
  [0.97, -0.235],
  [1.02, -0.17],
  [1.045, -0.06],
  [1.045, 0.06],
  [1.02, 0.125],
  [0.92, 0.145],
  [0.84, 0.145],
  [0.84, 0.05],
  [0.8, -0.05],
  [0.8, -0.26],
];

// ---- Bezel (polished, sits on the case) ---------------------------------
export const BEZEL_PROFILE: Profile = [
  [0.86, 0.145],
  [1.02, 0.145],
  [1.035, 0.19],
  [1.0, 0.265],
  [0.9, 0.3],
  [0.845, 0.3],
  [0.845, 0.22],
  [0.86, 0.145],
];

// ---- Rehaut / chapter ring (angled inner flange under the crystal) ------
export const REHAUT_PROFILE: Profile = [
  [0.75, 0.19],
  [0.845, 0.19],
  [0.845, 0.29],
  [0.78, 0.245],
  [0.75, 0.19],
];

// ---- Sapphire crystal (solid, domed) ------------------------------------
export const CRYSTAL_PROFILE: Profile = [
  [0.0, 0.212],
  [0.8, 0.212],
  [0.842, 0.23],
  [0.842, 0.29],
  [0.83, 0.325],
  [0.72, 0.36],
  [0.52, 0.388],
  [0.27, 0.402],
  [0.0, 0.406],
];

// ---- Caseback steel ring --------------------------------------------------
export const CASEBACK_PROFILE: Profile = [
  [0.7, -0.29],
  [0.72, -0.26],
  [0.8, -0.26],
  [0.965, -0.26],
  [0.965, -0.3],
  [0.9, -0.335],
  [0.74, -0.335],
  [0.7, -0.31],
  [0.7, -0.29],
];

// ---- Crown tube -----------------------------------------------------------
export const CROWN_TUBE_PROFILE: Profile = [
  [0.0, 0.0],
  [0.075, 0.0],
  [0.075, 0.08],
  [0.0, 0.08],
];

/**
 * Faceted (dauphine-style) hand. A raised centre ridge splits the hand into
 * two facets so the light catches each side differently as the watch turns.
 */
export function handGeometry(length: number, width: number, ridge = 0.014, tail = 0.16): THREE.BufferGeometry {
  const positions: number[] = [];
  const tri = (a: number[], b: number[], c: number[]) => positions.push(...a, ...b, ...c);

  const hw = width / 2;
  const tipY = length;
  const baseY = -tail;
  const shoulderY = tail * 0.4; // widest point just above the pivot
  const tailW = hw * 0.55;

  // ridge points (top)
  const R0 = [0, baseY, ridge];
  const R1 = [0, shoulderY, ridge];
  const R2 = [0, tipY, 0.002];
  // edges (bottom plane z = 0)
  const L0 = [-tailW, baseY, 0];
  const L1 = [-hw, shoulderY, 0];
  const L2 = [0, tipY, 0];
  const Q0 = [tailW, baseY, 0];
  const Q1 = [hw, shoulderY, 0];

  // left facets
  tri(L0, L1, R1);
  tri(L0, R1, R0);
  tri(L1, L2, R2);
  tri(L1, R2, R1);
  // right facets
  tri(Q1, Q0, R0);
  tri(Q1, R0, R1);
  tri(L2, Q1, R1);
  tri(L2, R1, R2);
  // underside
  tri(L1, L0, Q0);
  tri(L1, Q0, Q1);
  tri(L2, L1, Q1);
  // tail cap
  tri(L0, R0, Q0);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return g;
}

/** Slim seconds hand with a counterweight. */
export function secondsHandGeometry(length: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const w = 0.012;
  shape.moveTo(-w, -0.28);
  shape.lineTo(w, -0.28);
  shape.lineTo(w * 0.6, length);
  shape.lineTo(-w * 0.6, length);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: false });
  // counterweight lozenge
  const cw = new THREE.Shape();
  cw.moveTo(0, -0.1);
  cw.lineTo(0.03, -0.19);
  cw.lineTo(0, -0.28);
  cw.lineTo(-0.03, -0.19);
  cw.closePath();
  const cwg = new THREE.ExtrudeGeometry(cw, { depth: 0.014, bevelEnabled: false });
  const merged = mergeGeometries([g, cwg]);
  return merged;
}

/** Spur gear with trapezoidal teeth, optional centre hole and anglage bevel. */
export function gearGeometry(
  rOuter: number,
  teeth: number,
  depth: number,
  opts: { toothDepth?: number; hole?: number; bevel?: number; spokes?: number } = {},
): THREE.BufferGeometry {
  const toothDepth = opts.toothDepth ?? rOuter * 0.12;
  const rInner = rOuter - toothDepth;
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.22;
    const a2 = a0 + step * 0.5;
    const a3 = a0 + step * 0.72;
    const p = (r: number, a: number) => [Math.cos(a) * r, Math.sin(a) * r] as const;
    const [x0, y0] = p(rInner, a0);
    const [x1, y1] = p(rOuter, a1);
    const [x2, y2] = p(rOuter, a2);
    const [x3, y3] = p(rInner, a3);
    if (i === 0) shape.moveTo(x0, y0);
    else shape.lineTo(x0, y0);
    shape.lineTo(x1, y1);
    shape.lineTo(x2, y2);
    shape.lineTo(x3, y3);
  }
  shape.closePath();

  if (opts.hole) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, opts.hole, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  if (opts.spokes && opts.spokes > 0) {
    // cut-outs between spokes (skeletonised wheel)
    const n = opts.spokes;
    const rIn = (opts.hole ?? 0.02) + 0.03;
    const rOut = rInner - 0.045;
    const gap = 0.045 / rOut;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 + gap;
      const a1 = ((i + 1) / n) * Math.PI * 2 - gap;
      const cut = new THREE.Path();
      cut.absarc(0, 0, rOut, a0, a1, false);
      cut.absarc(0, 0, rIn, a1, a0, true);
      cut.closePath();
      shape.holes.push(cut);
    }
  }

  const bevel = opts.bevel ?? 0;
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 8,
  });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

/** Arbitrary bridge / plate shape from a polyline, extruded with anglage. */
export function plateGeometry(points: [number, number][], depth: number, opts: { holes?: [number, number, number][]; bevel?: number } = {}) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();
  for (const [x, y, r] of opts.holes ?? []) {
    const h = new THREE.Path();
    h.absarc(x, y, r, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  const bevel = opts.bevel ?? 0.008;
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 12,
  });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

/** Rounded rectangle plate with a hole — used for the buckle frame. */
export function roundedFrameGeometry(w: number, h: number, r: number, bar: number, depth: number) {
  const outer = new THREE.Shape();
  roundedRect(outer, -w / 2, -h / 2, w, h, r);
  const inner = new THREE.Path();
  roundedRect(inner, -w / 2 + bar, -h / 2 + bar, w - bar * 2, h - bar * 2, Math.max(0.01, r - bar));
  outer.holes.push(inner);
  const g = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 10 });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

function roundedRect(path: THREE.Path, x: number, y: number, w: number, h: number, r: number) {
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
}

/**
 * Rotor: a half disc with a heavy outer rim and skeletonised cut-outs.
 */
export function rotorGeometry(rOuter: number, depth: number) {
  const shape = new THREE.Shape();
  const hub = 0.1;
  shape.absarc(0, 0, rOuter, -Math.PI * 0.52, Math.PI * 0.52, false);
  shape.absarc(0, 0, hub, Math.PI * 0.52, -Math.PI * 0.52, true);
  shape.closePath();

  // two skeleton windows
  for (const [a0, a1] of [
    [-0.42, -0.08],
    [0.08, 0.42],
  ]) {
    const win = new THREE.Path();
    const rIn = rOuter * 0.42;
    const rOut = rOuter * 0.78;
    win.absarc(0, 0, rOut, a0 * Math.PI, a1 * Math.PI, false);
    win.absarc(0, 0, rIn, a1 * Math.PI, a0 * Math.PI, true);
    win.closePath();
    shape.holes.push(win);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2, curveSegments: 48 });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

/** Heavy tungsten rim of the rotor (half ring). */
export function rotorRimGeometry(rInner: number, rOuter: number, depth: number) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, rOuter, -Math.PI * 0.52, Math.PI * 0.52, false);
  shape.absarc(0, 0, rInner, Math.PI * 0.52, -Math.PI * 0.52, true);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2, curveSegments: 48 });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

/** Archimedean spiral for the hairspring. */
export function hairspringGeometry(turns = 9, rMax = 0.16, tube = 0.0035) {
  const pts: THREE.Vector3[] = [];
  const n = turns * 48;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * turns * Math.PI * 2;
    const r = 0.02 + (rMax - 0.02) * t;
    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, n, tube, 5, false);
}

/**
 * Sweep a rounded-rectangle cross-section along a curve.
 * Used for the leather strap. The curve lives in the YZ plane so the
 * side vector is constant (+X) and the frames never twist.
 */
export function sweepGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  widthAt: (t: number) => number,
  thickness: number,
  segmentsAlong = 56,
  cornerRadius = 0.035,
  uvRepeat = 3,
): THREE.BufferGeometry {
  const ring = roundedRectSection(cornerRadius, 28);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const side = new THREE.Vector3(1, 0, 0);
  const up = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const p = new THREE.Vector3();

  const ringN = ring.length;
  for (let i = 0; i <= segmentsAlong; i++) {
    const t = i / segmentsAlong;
    curve.getPointAt(t, p);
    curve.getTangentAt(t, tangent).normalize();
    up.crossVectors(tangent, side).normalize();
    const w = widthAt(t);
    for (let j = 0; j < ringN; j++) {
      const [sx, sy] = ring[j];
      const x = p.x + side.x * sx * (w / 2) + up.x * sy * (thickness / 2);
      const y = p.y + side.y * sx * (w / 2) + up.y * sy * (thickness / 2);
      const z = p.z + side.z * sx * (w / 2) + up.z * sy * (thickness / 2);
      positions.push(x, y, z);
      uvs.push(j / ringN, t * uvRepeat);
    }
  }
  for (let i = 0; i < segmentsAlong; i++) {
    for (let j = 0; j < ringN; j++) {
      const a = i * ringN + j;
      const b = i * ringN + ((j + 1) % ringN);
      const c = (i + 1) * ringN + ((j + 1) % ringN);
      const d = (i + 1) * ringN + j;
      indices.push(a, b, d, b, c, d);
    }
  }
  // end caps
  const capCenter = (i: number) => {
    const t = i / segmentsAlong;
    curve.getPointAt(t, p);
    positions.push(p.x, p.y, p.z);
    uvs.push(0.5, t * uvRepeat);
    return positions.length / 3 - 1;
  };
  const c0 = capCenter(0);
  for (let j = 0; j < ringN; j++) indices.push(c0, (j + 1) % ringN, j);
  const c1 = capCenter(segmentsAlong);
  const base = segmentsAlong * ringN;
  for (let j = 0; j < ringN; j++) indices.push(c1, base + j, base + ((j + 1) % ringN));

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Unit rounded-rect outline in (-1..1, -1..1), CCW. */
function roundedRectSection(r: number, n: number): [number, number][] {
  // r is expressed relative to the half-size of the section
  const pts: [number, number][] = [];
  const corners: [number, number, number][] = [
    [1 - r, 1 - r, 0],
    [-(1 - r), 1 - r, Math.PI / 2],
    [-(1 - r), -(1 - r), Math.PI],
    [1 - r, -(1 - r), Math.PI * 1.5],
  ];
  const per = Math.max(2, Math.floor(n / 4));
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i < per; i++) {
      const a = a0 + (i / (per - 1)) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  }
  return pts;
}

/** Cheap merge for a couple of non-indexed geometries. */
export function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  for (const g of geos) {
    const ng = g.index ? g.toNonIndexed() : g;
    ng.computeVertexNormals();
    positions.push(...Array.from(ng.attributes.position.array as Float32Array));
    normals.push(...Array.from(ng.attributes.normal.array as Float32Array));
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  return out;
}

/** Strap centre-lines (YZ plane). */
export function strapCurve(sign: 1 | -1, r = 1) {
  const s = sign;
  const o = (r - 1) * 1.1; // lug-to-lug grows with the case
  return new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, s * (1.14 + o), -0.13),
      new THREE.Vector3(0, s * (1.75 + o), -0.2),
      new THREE.Vector3(0, s * (2.45 + o), -0.5),
      new THREE.Vector3(0, s * (2.95 + o), -1.05),
      new THREE.Vector3(0, s * (3.15 + o), -1.7),
    ],
    false,
    "catmullrom",
    0.5,
  );
}
