"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { handGeometry, secondsHandGeometry } from "./geometry";
import { useWatch } from "./context";

/**
 * Hands show the viewer's local time. Automatics sweep at 8 beats per
 * second; quartz ticks once a second.
 */
export function Hands() {
  const { materials, watch, profiles } = useWatch();
  const { arch } = watch;
  const r = profiles.r;
  const z = profiles.dialZ;
  const hour = useRef<THREE.Group>(null);
  const minute = useRef<THREE.Group>(null);
  const second = useRef<THREE.Group>(null);
  const stick = arch.hands === "stick";
  const metal = arch.handsFinish === "rhodium" ? materials.hands : materials.polished;
  const quartz = arch.movement === "quartz";

  const G = useMemo(() => {
    if (stick) {
      return {
        hour: new THREE.BoxGeometry(0.03, 0.46 * r, 0.014).translate(0, 0.16 * r, 0),
        minute: new THREE.BoxGeometry(0.024, 0.68 * r, 0.012).translate(0, 0.26 * r, 0),
        second: new THREE.BoxGeometry(0.01, 0.9 * r, 0.008).translate(0, 0.32 * r, 0),
      };
    }
    return {
      hour: orient(handGeometry(0.46 * r, 0.078, 0.016, 0.14)),
      minute: orient(handGeometry(0.68 * r, 0.062, 0.014, 0.16)),
      second: secondsHandGeometry(0.72 * r),
    };
  }, [stick, r]);
  const cannon = useMemo(() => new THREE.CylinderGeometry(0.05, 0.05, 0.02, 32).rotateX(Math.PI / 2), []);
  const cannon2 = useMemo(() => new THREE.CylinderGeometry(0.03, 0.03, 0.02, 32).rotateX(Math.PI / 2), []);
  const pin = useMemo(() => new THREE.CylinderGeometry(0.014, 0.014, 0.03, 16).rotateX(Math.PI / 2), []);
  const lumeHour = useMemo(() => new THREE.BoxGeometry(0.02, 0.24, 0.004), []);
  const lumeMin = useMemo(() => new THREE.BoxGeometry(0.016, 0.36, 0.004), []);
  useEffect(() => () => {
    Object.values(G).forEach((g) => g.dispose());
    [cannon, cannon2, pin, lumeHour, lumeMin].forEach((g) => g.dispose());
  }, [G, cannon, cannon2, pin, lumeHour, lumeMin]);

  useFrame(() => {
    const now = new Date();
    const ms = now.getMilliseconds();
    const s = now.getSeconds() + (quartz ? 0 : Math.floor(ms / 125) / 8);
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;
    if (hour.current) hour.current.rotation.z = -(h / 12) * Math.PI * 2;
    if (minute.current) minute.current.rotation.z = -(m / 60) * Math.PI * 2;
    if (second.current) second.current.rotation.z = -(s / 60) * Math.PI * 2;
  });

  const lume = arch.indices === "applied-lume";
  return (
    <group>
      <group ref={hour} position={[0, 0, z + 0.036]}>
        <mesh geometry={G.hour} material={metal} />
        {lume && !stick && <mesh geometry={lumeHour} material={materials.lume} position={[0, 0.25, 0.019]} />}
      </group>
      <mesh geometry={cannon} material={metal} position={[0, 0, z + 0.045]} />
      <group ref={minute} position={[0, 0, z + 0.058]}>
        <mesh geometry={G.minute} material={metal} />
        {lume && !stick && <mesh geometry={lumeMin} material={materials.lume} position={[0, 0.36, 0.017]} />}
      </group>
      <mesh geometry={cannon2} material={metal} position={[0, 0, z + 0.068]} />
      <group ref={second} position={[0, 0, z + 0.078]}>
        <mesh geometry={G.second} material={stick ? metal : materials.hands} />
      </group>
      <mesh geometry={pin} material={metal} position={[0, 0, z + 0.09]} />
    </group>
  );
}

/** Ensure every triangle faces away from the hand's centroid. */
function orient(g: THREE.BufferGeometry) {
  const pos = g.attributes.position as THREE.BufferAttribute;
  const arr = pos.array as Float32Array;
  const c = new THREE.Vector3();
  for (let i = 0; i < arr.length; i += 3) c.add(new THREE.Vector3(arr[i], arr[i + 1], arr[i + 2]));
  c.multiplyScalar(3 / arr.length);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const d = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < arr.length; i += 9) {
    a.set(arr[i], arr[i + 1], arr[i + 2]);
    b.set(arr[i + 3], arr[i + 4], arr[i + 5]);
    d.set(arr[i + 6], arr[i + 7], arr[i + 8]);
    n.crossVectors(b.clone().sub(a), d.clone().sub(a));
    if (n.dot(c.clone().sub(a)) > 0) {
      for (let k = 0; k < 3; k++) {
        const t = arr[i + 3 + k];
        arr[i + 3 + k] = arr[i + 6 + k];
        arr[i + 6 + k] = t;
      }
    }
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}
