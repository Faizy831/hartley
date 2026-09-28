"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useLoader } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { lathe, gearGeometry } from "./geometry";
import { buildProfiles } from "./architecture";
import { getMaterialLibrary, applyCaseFinish, applyStrap, type WatchMaterials } from "./materials";
import { makeGenevaTexture, makePerlageTexture, sharedTexture, casebackTextureFor } from "./textures";
import { WatchContext, easeExplode } from "./context";
import { Dial } from "./Dial";
import { Hands } from "./Hands";
import { Movement } from "./Movement";
import { Strap } from "./Straps";
import { ExplodedLabel } from "./ExplodedLabel";
import { useStore } from "@/lib/store";
import { sceneCurrent } from "@/lib/sceneState";
import type { ResolvedWatch } from "@/lib/resolveWatch";

/** Exploded-view offsets in the watch's local frame (scaled by height). */
const EXPLODE: Record<string, [number, number, number]> = {
  crystal: [0, 0, 1.55],
  rehaut: [0, 0, 1.2],
  bezel: [0, 0, 1.0],
  hands: [0, 0, 0.72],
  dial: [0, 0, 0.42],
  case: [0, 0, 0],
  movement: [0, 0, -0.62],
  caseback: [0, 0, -1.65],
  strapTop: [0, 0.45, -0.12],
  strapBottom: [0, -0.45, -0.12],
};

/**
 * ProceduralWatch — one geometry system, many products.
 * Everything is derived from the resolved definition: the family's
 * architecture drives the profiles, the finish / dial / strap drive the
 * materials. Mount it with a key of `watch.geometryKey` so that changes
 * within a family morph in place while geometry-level changes remount.
 */
const engraveMats = new Map<string, THREE.MeshStandardMaterial>();
function getEngraveMaterial(key: string, map: THREE.Texture) {
  let m = engraveMats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ map, transparent: true, metalness: 0.9, roughness: 0.5, depthWrite: false });
    engraveMats.set(key, m);
  }
  return m;
}

/** Geometry sets are cached per family + segment count; they are small and shared. */
const geometryCache = new Map<string, Record<string, THREE.BufferGeometry>>();

export function ProceduralWatch({ watch, labels: showPlates = true }: { watch: ResolvedWatch; labels?: boolean }) {
  const quality = useStore((s) => s.quality);
  const detail = quality === "high" ? 1 : quality === "medium" ? 0.75 : 0.5;
  const seg = quality === "low" ? 96 : 160;
  const { arch } = watch;
  const profiles = useMemo(() => buildProfiles(arch), [arch]);

  const [leatherNormal, leatherRough] = useLoader(THREE.TextureLoader, ["/assets/textures/leather_normal_1k.jpg", "/assets/textures/leather_rough_1k.jpg"]);

  const materials = useMemo<WatchMaterials>(
    () =>
      getMaterialLibrary(`${arch.id}:${quality}`, () => ({
        transmission: quality !== "low",
        leatherNormal,
        leatherRoughness: leatherRough,
        geneva: sharedTexture("geneva", makeGenevaTexture),
        perlage: sharedTexture("perlage", makePerlageTexture),
        finish: watch.caseFinish,
        strap: watch.strap,
        jewelColor: arch.id === "legacy" ? "#8a1c5c" : undefined,
      })),
    // one library per family; live changes are tweened below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quality, leatherNormal, leatherRough, arch.id],
  );

  // live transitions within a family
  const first = useRef(true);
  useEffect(() => {
    applyCaseFinish(materials, watch.caseFinish.id, first.current);
    applyStrap(materials, watch.strap, first.current);
    first.current = false;
  }, [materials, watch.caseFinish, watch.strap]);

  const G = useMemo(() => {
    const key = `${arch.id}:${seg}`;
    const cached = geometryCache.get(key);
    if (cached) return cached as ReturnType<typeof build>;
    const built = build();
    geometryCache.set(key, built);
    return built;
    function build() {
    const P = profiles;
    return {
      caseMain: lathe(P.caseMain, seg),
      caseChamfer: lathe(P.caseChamfer, seg),
      caseBore: lathe(P.caseBore, seg),
      bezel: lathe(P.bezel, seg),
      rehaut: lathe(P.rehaut, seg),
      crystal: lathe(P.crystal, seg),
      caseback: lathe(arch.exhibitionBack ? P.casebackRing : P.casebackSolid, seg),
      casebackGlass: new THREE.CylinderGeometry(0.72 * P.r, 0.72 * P.r, 0.03, seg).rotateX(Math.PI / 2),
      casebackRing: new THREE.RingGeometry(0.72 * P.r, 0.965 * P.r, seg),
      casebackDisc: new THREE.CircleGeometry(0.965 * P.r, seg),
      crownTube: lathe(P.crownTube, 48).rotateY(Math.PI / 2),
      crownHead:
        arch.crown === "fluted"
          ? gearGeometry(0.135, 22, 0.17, { toothDepth: 0.014, bevel: 0.012 }).rotateY(Math.PI / 2)
          : new THREE.CylinderGeometry(0.1, 0.1, 0.14, 48).rotateZ(Math.PI / 2),
      crownCap: new THREE.SphereGeometry(arch.crown === "fluted" ? 0.11 : 0.085, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(-Math.PI / 2),
    };
    }
  }, [profiles, seg, arch.crown, arch.exhibitionBack, arch.id]);

  const casebackTex = useMemo(() => casebackTextureFor(arch.casebackText), [arch.casebackText]);
  const engraveMat = useMemo(() => getEngraveMaterial(arch.casebackText, casebackTex), [arch.casebackText, casebackTex]);

  // exploded parts registry
  const parts = useRef<Record<string, THREE.Group | null>>({});
  const set = (k: string) => (g: THREE.Group | null) => {
    parts.current[k] = g;
  };
  const rotorRef = useRef<THREE.Group>(null);
  const exploded = useRef(false);
  const h = profiles.h;

  useFrame(() => {
    const e = easeExplode(sceneCurrent.explode);
    const open = e > 0.25;
    if (open !== exploded.current) {
      exploded.current = open;
      document.documentElement.toggleAttribute("data-exploded", open);
    }
    for (const k in EXPLODE) {
      const g = parts.current[k];
      if (!g) continue;
      const [x, y, z] = EXPLODE[k];
      g.position.set(x * e, y * e, z * e * Math.max(0.7, h));
    }
    if (rotorRef.current) rotorRef.current.position.set(0, 0, -0.7 * e);
  });

  const labels = useMemo(() => Object.fromEntries(watch.family.exploded.map((l) => [l.part, l])), [watch.family]);
  const showLabels = useStore((s) => !s.mobileLayout) && showPlates;
  const L = (part: string, side: 1 | -1, row: number, y = 0, delay = 0) =>
    showLabels && labels[part] ? <ExplodedLabel title={labels[part].title} detail={labels[part].detail} side={side} row={row} rows={side === 1 || arch.exhibitionBack ? 4 : 2} y={y} delay={delay} /> : null;

  const P = profiles;
  const lugY = P.r * 0.98 + (arch.lugLength - 0.5) * 0.5;

  return (
    <WatchContext.Provider value={{ materials, watch, profiles, detail, seg }}>
      <group>
        <group ref={set("crystal")}>
          <mesh geometry={G.crystal} material={materials.crystal} renderOrder={10} />
          {L("crystal", 1, 0)}
        </group>
        <group ref={set("rehaut")}>
          <mesh geometry={G.rehaut} material={materials.darkSteel} />
        </group>
        <group ref={set("bezel")}>
          <mesh geometry={G.bezel} material={materials.polished} />
          {L("bezel", 1, 1, 0, 0.05)}
        </group>
        <group ref={set("hands")}>
          <Hands />
          {L("hands", 1, 2, 0, 0.1)}
        </group>
        <group ref={set("dial")}>
          <Dial />
          {L("dial", 1, 3, 0, 0.15)}
        </group>

        <group ref={set("case")}>
          <mesh geometry={G.caseMain} material={materials.brushed} />
          <mesh geometry={G.caseChamfer} material={materials.polished} />
          <mesh geometry={G.caseBore} material={materials.darkSteel} />
          {[1, -1].map((sy) =>
            [1, -1].map((sx) => (
              <RoundedBox
                key={`${sx}${sy}`}
                args={[0.2, arch.lugLength, P.lugThickness]}
                radius={0.06}
                smoothness={3}
                position={[sx * (P.r * 0.6), sy * lugY, P.lugZ]}
                rotation={[-sy * 0.32, 0, 0]}
                material={materials.brushed}
              />
            )),
          )}
          <mesh geometry={G.crownTube} material={materials.polished} position={[P.crownX, 0, -0.04 * h]} />
          <mesh geometry={G.crownHead} material={arch.crown === "fluted" ? materials.brushed : materials.polished} position={[P.crownX + 0.16, 0, -0.04 * h]} />
          <mesh geometry={G.crownCap} material={materials.polished} position={[P.crownX + (arch.crown === "fluted" ? 0.245 : 0.23), 0, -0.04 * h]} />
          {L("case", -1, 0, 0.4, 0.2)}
        </group>

        {arch.exhibitionBack && (
          <group ref={set("movement")} scale={[P.r, P.r, 1]}>
            <Movement detail={detail} rotorRef={rotorRef} />
            {L("movement", -1, 1, 0.2, 0.25)}
            {L("rotor", -1, 2, -0.3, 0.3)}
          </group>
        )}

        <group ref={set("caseback")}>
          <mesh geometry={G.caseback} material={materials.polished} />
          {arch.exhibitionBack ? (
            <>
              <mesh geometry={G.casebackGlass} material={materials.caseback} position={[0, 0, P.casebackZ]} renderOrder={9} />
              <mesh geometry={G.casebackRing} material={engraveMat} position={[0, 0, P.casebackZ - 0.0245]} rotation={[0, Math.PI, 0]} />
            </>
          ) : (
            <mesh geometry={G.casebackDisc} material={engraveMat} position={[0, 0, -0.3355 * h]} rotation={[0, Math.PI, 0]} />
          )}
          {L("caseback", -1, arch.exhibitionBack ? 3 : 1, -0.2, 0.35)}
        </group>

        <group ref={set("strapTop")}>
          <Strap sign={1} />
        </group>
        <group ref={set("strapBottom")}>
          <Strap sign={-1} />
        </group>
      </group>
    </WatchContext.Provider>
  );
}
