"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { strapCurve, sweepGeometry, roundedFrameGeometry } from "./geometry";
import { useWatch } from "./context";
import { Bracelet } from "./Bracelet";

/**
 * Strap system. One curve, several constructions:
 *   leather / croc / rubber – a swept rounded section with a pin buckle
 *   mesh                    – a thin swept metal band with a slide clasp
 *   bracelet                – three-link rows placed along the curve
 */
export function Strap({ sign }: { sign: 1 | -1 }) {
  const { materials: m, watch, profiles, detail } = useWatch();
  const kind = watch.strap.kind;
  const r = profiles.r;
  const width = watch.arch.strapWidth;
  const curve = useMemo(() => strapCurve(sign, r), [sign, r]);

  if (kind === "bracelet") return <Bracelet sign={sign} curve={curve} width={width} />;

  return <SweptStrap sign={sign} curve={curve} width={width} kind={kind} m={m} detail={detail} />;
}

function SweptStrap({ sign, curve, width, kind, m, detail }: { sign: 1 | -1; curve: THREE.CatmullRomCurve3; width: number; kind: string; m: ReturnType<typeof useWatch>["materials"]; detail: number }) {
  const mesh = kind === "mesh";
  const rubber = kind === "rubber";
  const thickness = mesh ? 0.055 : rubber ? 0.13 : 0.11;
  const corner = mesh ? 0.12 : rubber ? 0.45 : 0.3;
  const material = mesh ? m.strapMetal : m.strap;

  const geo = useMemo(() => {
    const key = `${sign}:${width}:${thickness}:${corner}:${mesh}:${detail}:${curve.getPointAt(0).y.toFixed(3)}`;
    const cached = sweepCache.get(key);
    if (cached) return cached;
    const g = sweepGeometry(curve, (t) => width - t * (mesh ? 0.04 : 0.14), thickness, detail >= 1 ? 64 : 36, corner, mesh ? 6 : 3);
    fixOrientation(g, curve);
    sweepCache.set(key, g);
    return g;
  }, [sign, curve, width, thickness, corner, mesh, detail]);

  const springBar = useMemo(() => new THREE.CylinderGeometry(0.022, 0.022, width + 0.08, 16).rotateZ(Math.PI / 2), [width]);
  const buckleFrame = useMemo(() => roundedFrameGeometry(width + 0.06, 0.44, 0.12, 0.08, 0.07), [width]);
  const tongue = useMemo(() => new THREE.BoxGeometry(0.04, 0.4, 0.03), []);
  const keeper = useMemo(() => roundedFrameGeometry(width + 0.06, 0.24, 0.06, 0.05, 0.05), [width]);
  const slideClasp = useMemo(() => new THREE.BoxGeometry(width + 0.02, 0.36, 0.09), [width]);

  useEffect(() => () => {
    springBar.dispose();
    buckleFrame.dispose();
    tongue.dispose();
    keeper.dispose();
    slideClasp.dispose();
  }, [geo, springBar, buckleFrame, tongue, keeper, slideClasp]);

  const endT = 0.97;
  const endPos = useMemo(() => curve.getPointAt(endT), [curve]);
  const endTan = useMemo(() => curve.getTangentAt(endT), [curve]);
  const quat = useMemo(() => frameQuat(endTan), [endTan]);
  const keeperT = 0.28;
  const keeperPos = useMemo(() => curve.getPointAt(keeperT), [curve]);
  const keeperQuat = useMemo(() => frameQuat(curve.getTangentAt(keeperT)), [curve]);
  const barY = curve.getPointAt(0).y;

  return (
    <group>
      <mesh geometry={geo} material={material} />
      <mesh geometry={springBar} material={m.polished} position={[0, barY + sign * 0.02, -0.12]} />
      {sign === 1 ? (
        <group position={endPos} quaternion={quat}>
          {mesh ? (
            <mesh geometry={slideClasp} material={m.strapMetal} position={[0, -0.05, 0.03]} />
          ) : (
            <>
              <mesh geometry={buckleFrame} material={m.polished} rotation={[Math.PI / 2, 0, 0]} />
              <mesh geometry={tongue} material={m.polished} position={[0, 0.2, 0.06]} rotation={[-0.15, 0, 0]} />
            </>
          )}
        </group>
      ) : (
        !mesh && (
          <group position={keeperPos} quaternion={keeperQuat}>
            <mesh geometry={keeper} material={material} rotation={[Math.PI / 2, 0, 0]} />
          </group>
        )
      )}
    </group>
  );
}

const sweepCache = new Map<string, THREE.BufferGeometry>();

export function frameQuat(tangent: THREE.Vector3) {
  const side = new THREE.Vector3(1, 0, 0);
  const up = side.clone().cross(tangent).normalize();
  const mtx = new THREE.Matrix4().makeBasis(side, tangent.clone().normalize(), up);
  return new THREE.Quaternion().setFromRotationMatrix(mtx);
}

/** Flip the whole index buffer if the normals point into the strap. */
function fixOrientation(g: THREE.BufferGeometry, curve: THREE.Curve<THREE.Vector3>) {
  const n = g.attributes.normal as THREE.BufferAttribute;
  const p = g.attributes.position as THREE.BufferAttribute;
  const centre = curve.getPointAt(0.5);
  let dot = 0;
  const ringN = 28;
  const mid = Math.floor(p.count / 2 / ringN) * ringN;
  for (let i = mid; i < mid + ringN && i < p.count; i++) {
    const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).sub(centre);
    dot += v.dot(new THREE.Vector3(n.getX(i), n.getY(i), n.getZ(i)));
  }
  if (dot < 0 && g.index) {
    const idx = g.index.array as Uint32Array | Uint16Array;
    for (let i = 0; i < idx.length; i += 3) {
      const t = idx[i + 1];
      idx[i + 1] = idx[i + 2];
      idx[i + 2] = t;
    }
    g.index.needsUpdate = true;
    g.computeVertexNormals();
  }
}
