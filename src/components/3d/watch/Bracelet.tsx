"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useWatch } from "./context";
import { frameQuat } from "./Straps";

/**
 * Three-link steel bracelet: rows of a brushed centre link and two polished
 * outer links follow the strap curve. Instanced — two draw calls per side.
 */
export function Bracelet({ sign, curve, width }: { sign: 1 | -1; curve: THREE.CatmullRomCurve3; width: number }) {
  const { materials: m, detail } = useWatch();
  const centre = useRef<THREE.InstancedMesh>(null);
  const outer = useRef<THREE.InstancedMesh>(null);

  const rows = detail >= 1 ? 22 : 16;
  const pitch = 0.155;
  const G = useMemo(() => {
    const cw = width * 0.36;
    const ow = width * 0.3;
    return {
      centre: new RoundedBoxGeometry(cw, pitch * 0.94, 0.11, 2, 0.025),
      outer: new RoundedBoxGeometry(ow, pitch * 0.94, 0.1, 2, 0.025),
      clasp: new RoundedBoxGeometry(width + 0.02, 0.5, 0.12, 2, 0.03),
      bar: new THREE.CylinderGeometry(0.022, 0.022, width + 0.08, 16).rotateZ(Math.PI / 2),
    };
  }, [width]);
  useEffect(() => () => Object.values(G).forEach((g) => g.dispose()), [G]);

  useEffect(() => {
    const c = centre.current;
    const o = outer.current;
    if (!c || !o) return;
    const mtx = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const scl = new THREE.Vector3(1, 1, 1);
    const length = curve.getLength();
    const usable = length - 0.55; // leave room for the clasp
    const n = Math.min(rows, Math.floor(usable / pitch));
    const side = new THREE.Vector3(1, 0, 0);
    for (let i = 0; i < n; i++) {
      const t = ((i + 0.5) * pitch) / length;
      curve.getPointAt(t, pos);
      q.copy(frameQuat(curve.getTangentAt(t)));
      const taper = 1 - t * 0.14;
      scl.set(taper, 1, 1);
      mtx.compose(pos, q, scl);
      c.setMatrixAt(i, mtx);
      const off = side.clone().applyQuaternion(q).multiplyScalar((width * 0.34) * taper);
      mtx.compose(pos.clone().add(off), q, scl);
      o.setMatrixAt(i * 2, mtx);
      mtx.compose(pos.clone().sub(off), q, scl);
      o.setMatrixAt(i * 2 + 1, mtx);
    }
    c.count = n;
    o.count = n * 2;
    c.instanceMatrix.needsUpdate = true;
    o.instanceMatrix.needsUpdate = true;
  }, [curve, rows, width]);

  const endPos = useMemo(() => curve.getPointAt(0.96), [curve]);
  const endQuat = useMemo(() => frameQuat(curve.getTangentAt(0.96)), [curve]);
  const barY = curve.getPointAt(0).y;

  return (
    <group>
      <instancedMesh ref={centre} args={[G.centre, m.strapMetalBrushed, rows]} frustumCulled={false} />
      <instancedMesh ref={outer} args={[G.outer, m.strapMetal, rows * 2]} frustumCulled={false} />
      <mesh geometry={G.bar} material={m.polished} position={[0, barY + sign * 0.02, -0.12]} />
      {sign === 1 && (
        <group position={endPos} quaternion={endQuat}>
          <mesh geometry={G.clasp} material={m.strapMetalBrushed} position={[0, -0.1, 0]} />
        </group>
      )}
    </group>
  );
}
