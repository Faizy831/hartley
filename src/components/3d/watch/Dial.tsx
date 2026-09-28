"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { gsap } from "@/lib/gsap";
import { makeDialTexture } from "./textures";
import { useWatch } from "./context";
import { useFontsReady } from "@/hooks/useFontsReady";

/** Dial faces are cached per family + variant (~1 MB each); regenerated once fonts load. */
const dialCache = new Map<string, THREE.CanvasTexture>();
const dialMaterials = new Map<string, { matA: THREE.MeshPhysicalMaterial; matB: THREE.MeshPhysicalMaterial }>();

/**
 * Dial face driven by the family's dial style:
 *   sunburst – lacquered brass with printed track (X1)
 *   skeleton – an annular dial around an open centre (Legacy)
 *   minimal  – clean satin dial with fine markers (Heritage)
 * Variant changes crossfade a second face on top, so the swap never pops.
 */
export function Dial() {
  const { materials, watch, profiles, seg } = useWatch();
  const { arch, dial } = watch;
  const fontsReady = useFontsReady();
  const r = profiles.r;
  const R = 0.8 * r;
  const z = profiles.dialZ;
  const skeleton = arch.dialStyle === "skeleton";
  const innerR = skeleton ? 0.46 * r : 0;

  // Face materials are cached per family so their shader programs stay
  // linked across product switches (a disposed material releases its program).
  const { matA, matB } = useMemo(() => {
    const key = arch.id;
    let pair = dialMaterials.get(key);
    if (!pair) {
      const a = new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        metalness: arch.dialStyle === "minimal" ? 0.1 : 0.35,
        roughness: arch.dialStyle === "minimal" ? 0.5 : 0.4,
        clearcoat: arch.dialStyle === "minimal" ? 0.3 : 1,
        clearcoatRoughness: 0.1,
        envMapIntensity: 0.85,
      });
      const b = a.clone();
      b.transparent = true;
      b.opacity = 0;
      b.depthWrite = false;
      pair = { matA: a, matB: b };
      dialMaterials.set(key, pair);
    }
    return pair;
  }, [arch.id, arch.dialStyle]);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const key = `${arch.id}:${dial.id}:${fontsReady ? 1 : 0}`;
    let tex = dialCache.get(key);
    if (!tex) {
      tex = makeDialTexture(dial, {
        brand: arch.dialBrand,
        subline: arch.dialSubline,
        footline: arch.dialFootline,
        footline2: arch.id === "veloris" ? "CALIBRE VX-01 · 100 M" : undefined,
        track: arch.dialStyle === "minimal" ? "fine" : "full",
        innerClear: skeleton ? 0.58 : undefined,
      });
      dialCache.set(key, tex);
    }
    if (matA.map === tex) return;
    if (!matA.map) {
      matA.map = tex;
      matA.needsUpdate = true;
      return;
    }
    tweenRef.current?.kill();
    matB.map = tex;
    matB.opacity = 0;
    matB.needsUpdate = true;
    tweenRef.current = gsap.to(matB, {
      opacity: 1,
      duration: 0.9,
      ease: "power2.inOut",
      onComplete: () => {
        matA.map = tex;
        matA.needsUpdate = true;
        matB.opacity = 0;
      },
    });
  }, [dial, fontsReady, matA, matB, arch, skeleton]);


  const geo = useMemo(() => (skeleton ? new THREE.RingGeometry(innerR, R, seg) : new THREE.CircleGeometry(R, seg)), [skeleton, innerR, R, seg]);
  const edge = useMemo(() => new THREE.CylinderGeometry(R, R, 0.02, seg, 1, true).rotateX(Math.PI / 2), [R, seg]);
  const innerEdge = useMemo(() => (skeleton ? new THREE.CylinderGeometry(innerR, innerR, 0.02, 64, 1, true).rotateX(Math.PI / 2) : null), [skeleton, innerR]);
  useEffect(() => () => {
    geo.dispose();
    edge.dispose();
    innerEdge?.dispose();
  }, [geo, edge, innerEdge]);

  return (
    <group>
      <mesh geometry={geo} material={matA} position={[0, 0, z]} />
      <mesh geometry={geo} material={matB} position={[0, 0, z + 0.0006]} renderOrder={1} />
      <mesh geometry={edge} material={materials.darkSteel} position={[0, 0, z - 0.01]} />
      {innerEdge && <mesh geometry={innerEdge} material={materials.polished} position={[0, 0, z - 0.01]} />}
      <Indices />
    </group>
  );
}

/** Applied hour markers. */
function Indices() {
  const { materials, watch, profiles } = useWatch();
  const { arch } = watch;
  const r = profiles.r;
  const z = profiles.dialZ;
  const lume = arch.indices === "applied-lume";
  const thin = arch.indices === "applied-thin";
  const metal = arch.handsFinish === "case" ? materials.polished : materials.polished;

  const baton = useMemo(() => new THREE.BoxGeometry(thin ? 0.028 : 0.042, thin ? 0.13 : 0.15, thin ? 0.02 : 0.028), [thin]);
  const lumeStripe = useMemo(() => new THREE.BoxGeometry(0.014, 0.12, 0.004), []);
  const items = useMemo(() => {
    const out: { pos: [number, number, number]; rot: number }[] = [];
    const rad = 0.665 * r;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = Math.sin(a) * rad;
      const y = Math.cos(a) * rad;
      if (i === 0 && !thin) {
        out.push({ pos: [-0.032, y, z + 0.014], rot: 0 });
        out.push({ pos: [0.032, y, z + 0.014], rot: 0 });
      } else {
        out.push({ pos: [x, y, z + (thin ? 0.01 : 0.014)], rot: -a });
      }
    }
    return out;
  }, [r, z, thin]);
  useEffect(() => () => {
    baton.dispose();
    lumeStripe.dispose();
  }, [baton, lumeStripe]);

  return (
    <group>
      {items.map((it, i) => (
        <group key={i} position={it.pos} rotation={[0, 0, it.rot]}>
          <mesh geometry={baton} material={metal} />
          {lume && <mesh geometry={lumeStripe} material={materials.lume} position={[0, 0, 0.016]} />}
        </group>
      ))}
    </group>
  );
}
