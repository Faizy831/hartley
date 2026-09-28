"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useLoader } from "@react-three/fiber";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "@/lib/gsap";
import { useGLB, glbOnStage } from "./loader";
import { ExplodedLabel } from "../watch/ExplodedLabel";
import { WatchContext, easeExplode } from "../watch/context";
import { Strap } from "../watch/Straps";
import { buildProfiles } from "../watch/architecture";
import { getMaterialLibrary, applyStrap, applyCaseFinish, type WatchMaterials } from "../watch/materials";
import { makeGenevaTexture, makePerlageTexture, sharedTexture } from "../watch/textures";
import { rotorState, stepRotor } from "../watch/Movement";
import { sceneCurrent } from "@/lib/sceneState";
import { useStore } from "@/lib/store";
import type { CaseFinishId } from "@/data/finishes";
import type { ResolvedWatch } from "@/lib/resolveWatch";
import type { FamilyModel } from "@/data/watches/models";
import { QA } from "@/lib/qaflags";

/**
 * GLBWatch — the client's real watch inside the existing rig.
 *
 *  - the head asset's semantic groups (Crystal, Bezel, Hands, Dial, Case,
 *    Crown, Movement, Caseback) are moved by the same exploded-view table
 *    as the procedural watch, so the choreography and plates read the same
 *  - the rotor is re-pivoted on the watch axis and shares the procedural
 *    rotor's pendulum state (drag kicks it)
 *  - hour / minute hands are re-pivoted and show the viewer's local time;
 *    the seconds hand and its wheel train scrub the client's 60 s clip
 *  - balance, escapement, pallet fork and hairspring loop as a quiet idle
 *  - the real steel bracelet asset is used when the product wears one;
 *    other straps use the procedural strap on the real head
 *  - families describe their asset in `FamilyModel` (root node, part map,
 *    hand nodes, dial variants); the Legacy names are the defaults, so a
 *    second asset (Heritage: quartz, no movement, two dial colours, real
 *    leather and mesh straps) runs through the same rig
 */

/** Exploded offsets in watch units — the procedural table, so the view matches. */
const EXPLODE: Record<string, number> = { crystal: 1.55, rehaut: 1.2, bezel: 1.0, hands: 0.72, dial: 0.42, case: 0, movement: -0.62, rotor: -0.62 - 0.7, caseback: -1.65 };
const STRAP_EXPLODE = { y: 0.45, z: -0.12 };
/** Legacy defaults for `FamilyModel.parts` / `.hands` (the asset's top-level groups and hand nodes). */
const GROUP_PART: Record<string, string> = { Crystal: "crystal", Bezel: "bezel", Hands: "hands", Dial: "dial", Case: "case", Crown: "case", Movement: "movement", Caseback: "caseback" };
const HAND_NODES = { hour: "Hand_Hour", minute: "Hand_Minute" };

interface Part {
  node: THREE.Object3D;
  base: THREE.Vector3;
  part: string;
}
interface HandPivot {
  pivot: THREE.Object3D;
  /** Direction the hand points at rest (radians, dial plane). */
  base: number;
}
interface HeadRig {
  wrapper: THREE.Group;
  scene: THREE.Group;
  scale: number;
  parts: Part[];
  rotorPivot: THREE.Object3D | null;
  hour: HandPivot | null;
  minute: HandPivot | null;
  /** Direct-driven rotations about the dial normal from a reference pose (the clip's first frame). */
  seconds: { node: THREE.Object3D; baseQ: THREE.Quaternion; a0: number } | null;
  train: { node: THREE.Object3D; baseQ: THREE.Quaternion; turnsPerMinute: number }[];
  idle: THREE.AnimationAction[];
  mixer: THREE.AnimationMixer;
  steel: THREE.MeshStandardMaterial[];
  /** Dial-colour variants baked into the asset: dial id → nodes (all hidden except the active variant's). */
  dialVariants: Record<string, THREE.Object3D[]>;
}
interface StrapRig {
  wrapper: THREE.Group;
  scene: THREE.Group;
  scale: number;
  parts: { node: THREE.Object3D; base: THREE.Vector3; sign: 1 | -1 }[];
  steel: THREE.MeshStandardMaterial[];
  /** Leather families whose colour follows the product's strap (constant base colour under baked roughness / normal). */
  leather: THREE.MeshStandardMaterial[];
}

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const box = new THREE.Box3();
const qz = new THREE.Quaternion();
const Z_AXIS = new THREE.Vector3(0, 0, 1);

/** Which finish role a web material family belongs to (see FamilyModel.finishRules). */
type Role = "case" | "bracelet" | "furniture";
function roleOf(materialName: string): Role | null {
  const fam = materialName.replace(/^web_/, "");
  if (/^(Case_|Crown_)/.test(fam)) return "case";
  if (/^Bracelet_/.test(fam)) return "bracelet";
  if (/^(Indices|Hands|Accent)$/.test(fam)) return "furniture";
  return null; // movement, rotor, jewels, dial, glass: never tinted
}
function collectSteel(root: THREE.Object3D) {
  const out = new Set<THREE.MeshStandardMaterial>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) if (roleOf(m.name)) out.add(m as THREE.MeshStandardMaterial);
  });
  return [...out];
}

/** Angle (dial plane) from an axis point to the centre of an object's geometry, in the wrapper's frame. */
function pointing(node: THREE.Object3D, axisWorld: THREE.Vector3) {
  box.setFromObject(node);
  box.getCenter(v1);
  return Math.atan2(v1.y - axisWorld.y, v1.x - axisWorld.x);
}

function buildHead(gltf: GLTF, model: FamilyModel): HeadRig {
  const scene = gltf.scene.clone(true);
  const wrapper = new THREE.Group();
  wrapper.name = "glb-head";
  wrapper.add(scene);
  const root = (model.rootNode ? (scene.getObjectByName(model.rootNode) as THREE.Object3D | undefined) : undefined) ?? scene.children[0] ?? scene;
  const scale = root.scale.x || 1;
  wrapper.updateMatrixWorld(true);

  // the hands' axis in the root's frame: the node the seconds clip drives (the seconds hand, or its pivot) sits on it
  const secondsClip = gltf.animations.find((a) => a.name === model.clips.seconds);
  const secondsTarget = secondsClip?.tracks[0]?.name.split(".")[0];
  const secondsNode = secondsTarget ? scene.getObjectByName(secondsTarget) : undefined;
  const axis = secondsNode ? secondsNode.position.clone() : new THREE.Vector3();

  const partOf = model.parts ?? GROUP_PART;
  const parts: Part[] = [];
  for (const child of root.children) {
    const part = partOf[child.name];
    if (part) parts.push({ node: child, base: child.position.clone(), part });
  }

  // rotor: pivot on the axis so it swings with the shared pendulum state
  let rotorPivot: THREE.Object3D | null = null;
  const rotor = scene.getObjectByName("Rotor");
  if (rotor) {
    rotorPivot = new THREE.Object3D();
    rotorPivot.name = "rotor-pivot";
    rotorPivot.position.set(axis.x, axis.y, 0);
    root.add(rotorPivot);
    wrapper.updateMatrixWorld(true);
    rotorPivot.attach(rotor);
  }

  // hour / minute: static meshes with arbitrary origins → pivot on the axis inside the Hands group
  const hands = scene.getObjectByName("Hands");
  const rePivot = (name: string): HandPivot | null => {
    const n = scene.getObjectByName(name);
    if (!n || !hands) return null;
    const pivot = new THREE.Object3D();
    pivot.name = `${name}-pivot`;
    pivot.position.set(axis.x, axis.y, 0);
    hands.add(pivot);
    wrapper.updateMatrixWorld(true);
    pivot.attach(n);
    wrapper.updateMatrixWorld(true);
    return { pivot, base: pointing(n, pivot.getWorldPosition(v2)) };
  };
  const handNodes = model.hands ?? HAND_NODES;
  const hour = rePivot(handNodes.hour);
  const minute = rePivot(handNodes.minute);

  // animation
  const mixer = new THREE.AnimationMixer(scene);
  const clip = (n: string) => gltf.animations.find((a) => a.name === n);
  const idle: THREE.AnimationAction[] = [];
  for (const n of model.clips.idle) {
    const c = clip(n);
    if (!c) continue;
    const a = mixer.clipAction(c);
    a.setLoop(THREE.LoopRepeat, Infinity);
    a.play();
    idle.push(a);
  }
  // reference pose of a clip-driven node: apply the clip's first frame once, then drop the clip.
  // (The client's 60 s clips are Bezier-eased two-key actions, so clip time is not linear in angle.)
  const referencePose = (clipName: string) => {
    const c = clip(clipName);
    if (!c) return null;
    const nodeName = c.tracks[0]?.name.split(".")[0];
    const node = nodeName ? scene.getObjectByName(nodeName) : null;
    if (!node) return null;
    const a = mixer.clipAction(c);
    a.play();
    a.time = 0;
    mixer.update(0);
    const baseQ = node.quaternion.clone();
    a.stop();
    mixer.uncacheAction(c);
    node.quaternion.copy(baseQ);
    return { node, baseQ };
  };
  let seconds: HeadRig["seconds"] = null;
  const secRef = referencePose(model.clips.seconds);
  if (secRef) {
    wrapper.updateMatrixWorld(true);
    seconds = { ...secRef, a0: pointing(secRef.node, secRef.node.getWorldPosition(v2)) };
  }
  const train: HeadRig["train"] = [];
  for (const [name, turnsPerMinute] of model.clips.train) {
    const ref = referencePose(name);
    if (ref) train.push({ ...ref, turnsPerMinute });
  }

  // anisotropy needs a real tangent frame: without exported tangents three.js derives it from UV
  // derivatives and produces NaN pixels on degenerate faces, which post-processing smears into black
  const anisoFallback = new Map<THREE.Material, THREE.Material>();
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || mesh.geometry.attributes.tangent) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const fixed = mats.map((m) => {
      const p = m as THREE.MeshPhysicalMaterial;
      if (!(p.anisotropy > 0)) return m;
      let f = anisoFallback.get(m);
      if (!f) {
        f = p.clone();
        (f as THREE.MeshPhysicalMaterial).anisotropy = 0;
        f.name = m.name;
        anisoFallback.set(m, f);
      }
      return f;
    });
    mesh.material = Array.isArray(mesh.material) ? fixed : fixed[0];
  });
  // material handling: the sapphire keeps its authored transmission (with the procedural crystal's volume);
  // QA flags can swap the crystal / caseback glass for a thin transparent material or hide them for profiling.
  const glassOf = new Map<THREE.Material, THREE.Material>();
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const isCrystal = /^Crystal/.test(mesh.name) || /^Crystal/.test(mesh.parent?.name ?? "");
    const isCaseback = /Caseback/.test(mesh.name) || /Caseback/.test(mesh.parent?.name ?? "");
    const mode = isCrystal ? (QA.crystal ?? model.glass.crystal) : isCaseback ? (QA.caseback ?? model.glass.caseback) : "transmission";
    const replaced = mats.map((m) => {
      const p = m as THREE.MeshPhysicalMaterial;
      if (!(p.transmission > 0)) return m;
      if (/Jewel/.test(m.name) && !QA.jewelsTransmission) {
        // the client's jewel material is an opaque metallic lacquer (no transmission); the export added
        // transmission, which alone forces the full-scene transmission pass every frame
        p.transmission = 0;
        p.metalness = 0.38;
        p.roughness = 0.05;
        p.clearcoat = 1;
        p.clearcoatRoughness = 0.05;
        p.needsUpdate = true;
        return m;
      }
      if (mode === "off") {
        mesh.visible = false;
        return m;
      }
      if (mode === "thin") {
        let t = glassOf.get(m);
        if (!t) {
          t = new THREE.MeshPhysicalMaterial({ name: m.name + "_thin", color: "#dfe7ff", metalness: 0, roughness: 0.03, transparent: true, opacity: 0.12, envMapIntensity: 1.2, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false });
          glassOf.set(m, t);
        }
        mesh.renderOrder = 10;
        return t;
      }
      p.thickness = p.thickness || 0.3;
      p.attenuationColor = new THREE.Color("#dfe9ff");
      p.attenuationDistance = 3;
      mesh.renderOrder = 10;
      return m;
    });
    mesh.material = Array.isArray(mesh.material) ? replaced : replaced[0];
  });

  const dialVariants: HeadRig["dialVariants"] = {};
  for (const [dialId, names] of Object.entries(model.dialVariants ?? {})) {
    dialVariants[dialId] = names.map((n) => scene.getObjectByName(n)).filter((n): n is THREE.Object3D => !!n);
  }

  return { wrapper, scene, scale, parts, rotorPivot, hour, minute, seconds, train, idle, mixer, steel: collectSteel(scene), dialVariants };
}

/** Show the nodes of one dial variant and hide the others'. Unknown ids fall back to the first variant. */
function applyDialVariant(head: HeadRig, dialId: string) {
  const ids = Object.keys(head.dialVariants);
  if (ids.length === 0) return;
  const active = ids.includes(dialId) ? dialId : ids[0];
  for (const id of ids) for (const node of head.dialVariants[id]) node.visible = id === active;
}

const tmpColor = new THREE.Color();

function buildStrap(gltf: GLTF): StrapRig {
  const scene = gltf.scene.clone(true);
  const wrapper = new THREE.Group();
  wrapper.name = "glb-strap";
  wrapper.add(scene);
  const root = scene.children[0] ?? scene;
  const scale = root.scale.x || 1;
  wrapper.updateMatrixWorld(true);
  const parts: StrapRig["parts"] = root.children.map((node) => {
    box.setFromObject(node);
    box.getCenter(v1);
    return { node, base: node.position.clone(), sign: v1.y >= 0 ? 1 : -1 };
  });
  const leather: THREE.MeshStandardMaterial[] = [];
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) if (/^web_Leather_Strap/.test(m.name) && !leather.includes(m as THREE.MeshStandardMaterial)) leather.push(m as THREE.MeshStandardMaterial);
  });
  return { wrapper, scene, scale, parts, steel: collectSteel(scene), leather };
}

/** Leather straps: one asset per construction; the product's leather colour is applied to the leather families. */
function applyLeatherColour(mats: THREE.MeshStandardMaterial[], hex: string, immediate: boolean) {
  tmpColor.set(hex);
  for (const m of mats) {
    if (immediate) m.color.copy(tmpColor);
    else gsap.to(m.color, { r: tmpColor.r, g: tmpColor.g, b: tmpColor.b, duration: 1.1, ease: "power2.inOut", overwrite: "auto" });
  }
}

/**
 * Apply a finish to the asset's tintable families by role. Silver (and any null rule) leaves the
 * authored materials untouched. Tints are the client's own flat constants: untextured families take
 * the colour over their 0.8 base, textured ones divide by the texture's mean albedo.
 */
function applyFinishToSteel(mats: THREE.MeshStandardMaterial[], caseFinish: CaseFinishId, braceletFinish: CaseFinishId, model: FamilyModel, immediate: boolean) {
  for (const m of mats) {
    const role = roleOf(m.name);
    if (!role) continue;
    const rules = model.finishRules[role === "bracelet" ? braceletFinish : caseFinish] ?? model.finishRules.silver;
    const tintId = rules[role];
    const tint = tintId ? model.finishTints[tintId] : null;
    // remember the authored colour (0.8 steel) so a null rule restores it instead of forcing white
    if (!m.userData.authoredColor) m.userData.authoredColor = m.color.clone();
    if (!tint) tmpColor.copy(m.userData.authoredColor as THREE.Color);
    else {
      const ref = m.map ? 0.5 : 0.8;
      tmpColor.set(Math.min(1, tint[0] / ref), Math.min(1, tint[1] / ref), Math.min(1, tint[2] / ref));
    }
    if (immediate) m.color.copy(tmpColor);
    else gsap.to(m.color, { r: tmpColor.r, g: tmpColor.g, b: tmpColor.b, duration: 1.1, ease: "power2.inOut", overwrite: "auto" });
  }
}

export function GLBWatch({ model, watch, labels: showPlates, strapUrl }: { model: FamilyModel; watch: ResolvedWatch; labels: boolean; strapUrl?: string }) {
  const { gltf } = useGLB(model.head);
  const strapGltf = useGLB(strapUrl ?? model.head).gltf;
  const hasStrapAsset = !!strapUrl && !!strapGltf;
  const reduced = useStore((s) => s.reducedMotion);
  const thumbMode = useStore((s) => s.thumbMode);
  if (!gltf) throw new Error("GLB head unavailable");

  const head = useMemo(() => buildHead(gltf, model), [gltf, model]);
  const strap = useMemo(() => (hasStrapAsset && strapGltf ? buildStrap(strapGltf) : null), [hasStrapAsset, strapGltf]);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && showPlates) {
      const w = window as unknown as { __veloris?: Record<string, unknown> };
      w.__veloris = { ...(w.__veloris ?? {}), glbHead: head, glbStrap: strap, THREE };
    }
    if (showPlates) {
      glbOnStage.count++;
      useStore.getState().setGlbOnStage(true);
    }
    // Idle clips run while mounted. Effects can re-run (StrictMode, prop changes), so the pair is
    // stop/play only: uncaching the root would leave three.js unable to re-bind the actions.
    for (const a of head.idle) a.play();
    return () => {
      if (showPlates) {
        glbOnStage.count--;
        if (glbOnStage.count <= 0) useStore.getState().setGlbOnStage(false);
      }
      for (const a of head.idle) a.stop();
    };
  }, [head, strap, showPlates]);

  // finish: authored silver, or a tint of the same steel families
  const first = useRef(true);
  useEffect(() => {
    applyFinishToSteel(head.steel, watch.caseFinish.id, watch.strap.metal ?? watch.caseFinish.id, model, first.current);
    if (strap) {
      applyFinishToSteel(strap.steel, watch.caseFinish.id, watch.strap.metal ?? watch.caseFinish.id, model, first.current);
      if (strap.leather.length && watch.strap.kind === "leather") applyLeatherColour(strap.leather, watch.strap.color, first.current);
    }
    first.current = false;
  }, [head, strap, model, watch.caseFinish.id, watch.strap.metal, watch.strap.kind, watch.strap.color]);
  // dial colour: a visibility switch between variants baked into the same asset (no remount, geometryKey unchanged)
  useEffect(() => {
    applyDialVariant(head, watch.dial.id);
  }, [head, watch.dial.id]);

  // exploded plates anchored in the wrapper's frame, moved with their parts
  const anchors = useRef<Record<string, THREE.Group | null>>({});
  const exploded = useRef(false);

  useFrame((state, delta) => {
    const e = easeExplode(sceneCurrent.explode);
    const open = e > 0.25;
    if (open !== exploded.current) {
      exploded.current = open;
      document.documentElement.toggleAttribute("data-exploded", open);
    }
    const s = head.scale;
    for (const p of head.parts) p.node.position.set(p.base.x, p.base.y, p.base.z + (e * EXPLODE[p.part]) / s);
    for (const k in anchors.current) {
      const a = anchors.current[k];
      if (a) a.position.z = e * (EXPLODE[k] ?? 0);
    }
    if (head.rotorPivot) {
      if (showPlates) stepRotor(delta);
      head.rotorPivot.position.z = (e * EXPLODE.rotor) / s;
      head.rotorPivot.rotation.z = rotorState.angle;
    }
    if (strap) {
      for (const p of strap.parts) p.node.position.set(p.base.x, p.base.y + (p.sign * STRAP_EXPLODE.y * e) / strap.scale, p.base.z + (STRAP_EXPLODE.z * e) / strap.scale);
    }

    if (!QA.anim) return;
    // time: hour / minute pivots, seconds hand + train scrubbed on the client's clip.
    // A mechanical seconds hand sweeps in eighths; quartz steps once a second (as the procedural hands do).
    const now = new Date();
    const quartz = watch.arch.movement === "quartz";
    const sec = now.getSeconds() + (quartz ? 0 : Math.floor(now.getMilliseconds() / 125) / 8);
    const min = now.getMinutes() + sec / 60;
    const hr = (now.getHours() % 12) + min / 60;
    if (head.hour) head.hour.pivot.rotation.z = Math.PI / 2 - (hr / 12) * Math.PI * 2 - head.hour.base;
    if (head.minute) head.minute.pivot.rotation.z = Math.PI / 2 - (min / 60) * Math.PI * 2 - head.minute.base;
    if (head.seconds) {
      const want = Math.PI / 2 - (sec / 60) * Math.PI * 2;
      qz.setFromAxisAngle(Z_AXIS, want - head.seconds.a0);
      head.seconds.node.quaternion.copy(head.seconds.baseQ).premultiply(qz);
    }
    for (const w of head.train) {
      qz.setFromAxisAngle(Z_AXIS, -(sec / 60) * Math.PI * 2 * w.turnsPerMinute);
      w.node.quaternion.copy(w.baseQ).premultiply(qz);
    }
    // idle mechanics: the client's pacing, paused under reduced motion / thumbnails
    const idleScale = reduced || thumbMode ? 0 : 1;
    for (const a of head.idle) a.timeScale = idleScale;
    head.mixer.update(Math.min(delta, 1 / 20));
  });

  // procedural strap fallback for constructions without a real asset (shares the family's material library)
  const quality = useStore((s) => s.quality);
  const [leatherNormal, leatherRough] = useLoader(THREE.TextureLoader, ["/assets/textures/leather_normal_1k.jpg", "/assets/textures/leather_rough_1k.jpg"]);
  const profiles = useMemo(() => buildProfiles(watch.arch), [watch.arch]);
  const materials = useMemo<WatchMaterials>(
    () =>
      getMaterialLibrary(`${watch.arch.id}:${quality}`, () => ({
        transmission: quality !== "low",
        leatherNormal,
        leatherRoughness: leatherRough,
        geneva: sharedTexture("geneva", makeGenevaTexture),
        perlage: sharedTexture("perlage", makePerlageTexture),
        finish: watch.caseFinish,
        strap: watch.strap,
        jewelColor: "#8a1c5c",
      })),
    // one library per family; live changes are tweened below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quality, leatherNormal, leatherRough, watch.arch.id],
  );
  const firstStrap = useRef(true);
  useEffect(() => {
    if (strap) return;
    applyCaseFinish(materials, watch.caseFinish.id, firstStrap.current);
    applyStrap(materials, watch.strap, firstStrap.current);
    firstStrap.current = false;
  }, [materials, strap, watch.caseFinish.id, watch.strap]);
  const strapTop = useRef<THREE.Group>(null);
  const strapBottom = useRef<THREE.Group>(null);
  useFrame(() => {
    if (strap) return;
    const e = easeExplode(sceneCurrent.explode);
    const { y: iy, z: iz } = model.strapInset;
    strapTop.current?.position.set(0, iy + STRAP_EXPLODE.y * e, iz + STRAP_EXPLODE.z * e);
    strapBottom.current?.position.set(0, -iy - STRAP_EXPLODE.y * e, iz + STRAP_EXPLODE.z * e);
  });

  const plates = useMemo(() => Object.fromEntries(watch.family.exploded.map((l) => [l.part, l])), [watch.family]);
  const showLabels = useStore((s) => !s.mobileLayout) && showPlates;
  const L = (part: string, side: 1 | -1, row: number, y = 0, delay = 0) =>
    showLabels && plates[part] ? (
      <group
        key={part}
        ref={(g) => {
          anchors.current[part] = g;
        }}
      >
        <ExplodedLabel title={plates[part].title} detail={plates[part].detail} side={side} row={row} rows={4} y={y} delay={delay} />
      </group>
    ) : null;

  const detail = quality === "high" ? 1 : quality === "medium" ? 0.75 : 0.5;
  const seg = quality === "low" ? 96 : 160;

  return (
    <group scale={model.scale} position={model.offset}>
      <primitive object={head.wrapper} />
      {strap && <primitive object={strap.wrapper} />}
      {!strap && (
        <WatchContext.Provider value={{ materials, watch, profiles, detail, seg }}>
          <group ref={strapTop}>
            <Strap sign={1} />
          </group>
          <group ref={strapBottom}>
            <Strap sign={-1} />
          </group>
        </WatchContext.Provider>
      )}
      {L("crystal", 1, 0)}
      {L("bezel", 1, 1, 0, 0.05)}
      {L("hands", 1, 2, 0, 0.1)}
      {L("dial", 1, 3, 0, 0.15)}
      {L("case", -1, 0, 0.4, 0.2)}
      {L("movement", -1, 1, 0.2, 0.25)}
      {L("rotor", -1, 2, -0.3, 0.3)}
      {L("caseback", -1, 3, -0.2, 0.35)}
    </group>
  );
}
