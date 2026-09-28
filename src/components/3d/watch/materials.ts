import * as THREE from "three";
import { gsap } from "@/lib/gsap";
import { CASE_FINISHES, type CaseFinish, type StrapSpec } from "@/data/finishes";
import { makeCrocNormal, makeMeshNormal, sharedTexture } from "./textures";

/**
 * One material library per mounted watch. Finishes and straps are applied
 * by tweening the live materials — nothing is reloaded when a product
 * changes within a family.
 */
export interface WatchMaterials {
  polished: THREE.MeshPhysicalMaterial;
  brushed: THREE.MeshPhysicalMaterial;
  darkSteel: THREE.MeshStandardMaterial;
  hands: THREE.MeshPhysicalMaterial;
  lume: THREE.MeshStandardMaterial;
  crystal: THREE.MeshPhysicalMaterial;
  caseback: THREE.MeshPhysicalMaterial;
  strap: THREE.MeshPhysicalMaterial;
  strapMetal: THREE.MeshPhysicalMaterial;
  strapMetalBrushed: THREE.MeshPhysicalMaterial;
  rhodium: THREE.MeshPhysicalMaterial;
  perlage: THREE.MeshPhysicalMaterial;
  gold: THREE.MeshPhysicalMaterial;
  jewel: THREE.MeshPhysicalMaterial;
  bluedSteel: THREE.MeshPhysicalMaterial;
  tungsten: THREE.MeshPhysicalMaterial;
  all: THREE.Material[];
  textures: THREE.Texture[];
}

export interface MaterialOptions {
  transmission: boolean;
  leatherNormal: THREE.Texture | null;
  leatherRoughness: THREE.Texture | null;
  geneva: THREE.Texture;
  perlage: THREE.Texture;
  finish: CaseFinish;
  strap: StrapSpec;
  /** Legacy's movement is described as having "hints of purple" in its jewels. */
  jewelColor?: string;
}

const tmp = new THREE.Color();

/**
 * Libraries are cached per family + quality and never disposed while the
 * app lives: their shader programs stay compiled, so returning to a family
 * costs nothing on the main thread.
 */
const libraries = new Map<string, WatchMaterials>();
export function getMaterialLibrary(key: string, make: () => MaterialOptions): WatchMaterials {
  let lib = libraries.get(key);
  if (!lib) {
    lib = createWatchMaterials(make());
    libraries.set(key, lib);
  }
  return lib;
}

export function createWatchMaterials(o: MaterialOptions): WatchMaterials {
  const f = o.finish;
  const polished = new THREE.MeshPhysicalMaterial({ color: f.color, metalness: 1, roughness: f.polishedRoughness, envMapIntensity: 1 });
  const brushed = new THREE.MeshPhysicalMaterial({ color: f.color, metalness: 1, roughness: f.brushedRoughness, anisotropy: f.anisotropy, anisotropyRotation: 0, envMapIntensity: 1 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: "#1e1f22", metalness: 0.9, roughness: 0.5 });
  const hands = new THREE.MeshPhysicalMaterial({ color: "#e8eaee", metalness: 1, roughness: 0.14, envMapIntensity: 1.2 });
  const lume = new THREE.MeshStandardMaterial({ color: "#e3e9e0", emissive: "#cfe6d2", emissiveIntensity: 0.22, roughness: 0.6 });

  const crystal = o.transmission
    ? new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        metalness: 0,
        roughness: 0.02,
        transmission: 1,
        thickness: 0.35,
        ior: 1.77,
        specularIntensity: 1,
        specularColor: new THREE.Color("#c9d6ff"),
        envMapIntensity: 1,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        attenuationColor: new THREE.Color("#dfe9ff"),
        attenuationDistance: 3,
      })
    : new THREE.MeshPhysicalMaterial({ color: "#dfe7ff", metalness: 0, roughness: 0.03, transparent: true, opacity: 0.12, envMapIntensity: 1.2, clearcoat: 1, depthWrite: false });

  const caseback = new THREE.MeshPhysicalMaterial({ color: "#e6ecff", metalness: 0, roughness: 0.04, transparent: true, opacity: 0.16, envMapIntensity: 1, clearcoat: 1, depthWrite: false });

  const strap = new THREE.MeshPhysicalMaterial({
    color: o.strap.color,
    metalness: 0,
    roughness: o.strap.roughness,
    normalMap: o.leatherNormal,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughnessMap: o.leatherRoughness,
    sheen: 0.25,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color("#5a4a3a"),
    envMapIntensity: 0.6,
  });
  for (const t of [o.leatherNormal, o.leatherRoughness]) {
    if (t) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1, 3);
    }
  }
  const crocNormal = sharedTexture("croc", () => {
    const t = makeCrocNormal();
    t.repeat.set(1, 6);
    return t;
  });
  const meshNormal = sharedTexture("mesh", () => {
    const t = makeMeshNormal();
    t.repeat.set(2, 14);
    return t;
  });

  const strapMetal = new THREE.MeshPhysicalMaterial({ color: f.color, metalness: 1, roughness: 0.32, envMapIntensity: 0.9 });
  const strapMetalBrushed = new THREE.MeshPhysicalMaterial({ color: f.color, metalness: 1, roughness: 0.42, anisotropy: 0.8, envMapIntensity: 0.85 });

  const rhodium = new THREE.MeshPhysicalMaterial({ color: "#d9dce2", metalness: 1, roughness: 0.28, map: o.geneva, envMapIntensity: 0.9 });
  const perlage = new THREE.MeshPhysicalMaterial({ color: "#cfd3d9", metalness: 1, roughness: 0.34, map: o.perlage, envMapIntensity: 0.8 });
  const gold = new THREE.MeshPhysicalMaterial({ color: "#e0b872", metalness: 1, roughness: 0.22, envMapIntensity: 1 });
  const jewel = new THREE.MeshPhysicalMaterial({ color: o.jewelColor ?? "#b0142a", metalness: 0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2, emissive: o.jewelColor ?? "#4a0410", emissiveIntensity: 0.25 });
  const bluedSteel = new THREE.MeshPhysicalMaterial({ color: "#2e4a8f", metalness: 1, roughness: 0.18, envMapIntensity: 1.1 });
  const tungsten = new THREE.MeshPhysicalMaterial({ color: "#6b6e74", metalness: 1, roughness: 0.32, envMapIntensity: 0.9 });

  const lib: WatchMaterials = {
    polished, brushed, darkSteel, hands, lume, crystal, caseback, strap, strapMetal, strapMetalBrushed, rhodium, perlage, gold, jewel, bluedSteel, tungsten,
    all: [polished, brushed, darkSteel, hands, lume, crystal, caseback, strap, strapMetal, strapMetalBrushed, rhodium, perlage, gold, jewel, bluedSteel, tungsten],
    textures: [crocNormal, meshNormal],
  };
  (lib as WatchMaterials & { _croc: THREE.Texture; _mesh: THREE.Texture; _leatherN: THREE.Texture | null; _leatherR: THREE.Texture | null })._croc = crocNormal;
  (lib as WatchMaterials & { _mesh: THREE.Texture })._mesh = meshNormal;
  (lib as WatchMaterials & { _leatherN: THREE.Texture | null })._leatherN = o.leatherNormal;
  (lib as WatchMaterials & { _leatherR: THREE.Texture | null })._leatherR = o.leatherRoughness;
  applyStrap(lib, o.strap, true);
  return lib;
}

function tweenColor(mat: THREE.Material & { color: THREE.Color }, hex: string, immediate: boolean, duration = 1.1) {
  tmp.set(hex);
  if (immediate) {
    mat.color.copy(tmp);
    return;
  }
  gsap.to(mat.color, { r: tmp.r, g: tmp.g, b: tmp.b, duration, ease: "power2.inOut", overwrite: "auto" });
}
function tweenProps(target: object, vars: Record<string, number>, immediate: boolean, duration = 1.1) {
  if (immediate) {
    Object.assign(target, vars);
    return;
  }
  gsap.to(target, { ...vars, duration, ease: "power2.inOut", overwrite: "auto" });
}

export function applyCaseFinish(m: WatchMaterials, id: keyof typeof CASE_FINISHES, immediate = false) {
  const f = CASE_FINISHES[id];
  tweenColor(m.polished, f.color, immediate);
  tweenColor(m.brushed, f.color, immediate);
  tweenProps(m.polished, { roughness: f.polishedRoughness }, immediate);
  tweenProps(m.brushed, { roughness: f.brushedRoughness, anisotropy: f.anisotropy }, immediate);
}

export function applyStrap(m: WatchMaterials, s: StrapSpec, immediate = false) {
  const ext = m as WatchMaterials & { _croc: THREE.Texture; _mesh: THREE.Texture; _leatherN: THREE.Texture | null; _leatherR: THREE.Texture | null };
  if (s.kind === "leather" || s.kind === "croc" || s.kind === "rubber") {
    const croc = s.kind === "croc";
    const rubber = s.kind === "rubber";
    const nextNormal = croc ? ext._croc : rubber ? null : ext._leatherN;
    if (m.strap.normalMap !== nextNormal) {
      m.strap.normalMap = nextNormal;
      m.strap.roughnessMap = rubber || croc ? null : ext._leatherR;
      m.strap.needsUpdate = true;
    }
    tweenColor(m.strap, s.color, immediate);
    tweenProps(m.strap, { roughness: s.roughness, sheen: rubber ? 0.05 : 0.25, envMapIntensity: rubber ? 0.35 : croc ? 0.8 : 0.6, clearcoat: croc ? 0.5 : 0, clearcoatRoughness: 0.3 }, immediate);
    tweenProps(m.strap.normalScale, { x: rubber ? 0 : croc ? 1.2 : 0.9, y: rubber ? 0 : croc ? 1.2 : 0.9 }, immediate);
  }
  if (s.kind === "mesh" || s.kind === "bracelet") {
    const finish = CASE_FINISHES[s.metal ?? "silver"];
    tweenColor(m.strapMetal, finish.color, immediate);
    tweenColor(m.strapMetalBrushed, finish.color, immediate);
    const mesh = s.kind === "mesh";
    if (mesh && m.strapMetal.normalMap !== ext._mesh) {
      m.strapMetal.normalMap = ext._mesh;
      m.strapMetal.normalScale.set(0.9, 0.9);
      m.strapMetal.needsUpdate = true;
    }
    if (!mesh && m.strapMetal.normalMap) {
      m.strapMetal.normalMap = null;
      m.strapMetal.needsUpdate = true;
    }
    tweenProps(m.strapMetal, { roughness: mesh ? 0.42 : finish.polishedRoughness + 0.06 }, immediate);
    tweenProps(m.strapMetalBrushed, { roughness: finish.brushedRoughness }, immediate);
  }
}
