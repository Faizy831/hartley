"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import { useEnvironment } from "@react-three/drei";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { LIGHT_PRESETS } from "@/lib/lighting";
import { rigState } from "./CameraRig";

RectAreaLightUniformsLib.init();

/**
 * Studio profile, used while a real client asset is on stage. Derived from the client's Blender
 * file (Legacy_Animation_export.blend): metals reflect the "Abstract 01" studio environment (a ring
 * of vertical soft-box strips) at strength 1 on glossy rays, camera/diffuse rays see a near-black
 * world (0.032), two 2.54×0.25 m strip area lights add the direct highlights, and the image is
 * viewed through AgX rather than ACES, which is what keeps polished steel from clipping to white.
 * Values here are multipliers on the story presets so the chapters keep their mood.
 */
export const STUDIO = {
  env: 1.9, // LDR studio image (mean 0.41) vs the HDR default
  key: 0.22,
  rim: 0.35,
  fill: 0.45,
  // strip lights: 5.2 × 1.6 units at 1.0 nits (front) / 0.5 (back). Larger, dimmer panels than the first pass
  // (3.4 × 0.34 at 5.5) carry about the same flux but spread the highlight into long gradients across the
  // curved case instead of a narrow clipped band (near-white pixels on the side views 2.6% → 0.7%).
  strip: 1.0,
  exposure: 1.15,
};
import { sceneCurrent } from "@/lib/sceneState";
import { useStore } from "@/lib/store";

const tmpA = new THREE.Color();
const tmpB = new THREE.Color();

function lerpPreset(idx: number) {
  const i0 = Math.max(0, Math.min(LIGHT_PRESETS.length - 1, Math.floor(idx)));
  const i1 = Math.min(LIGHT_PRESETS.length - 1, i0 + 1);
  const f = THREE.MathUtils.clamp(idx - i0, 0, 1);
  const a = LIGHT_PRESETS[i0];
  const b = LIGHT_PRESETS[i1];
  const L = (x: number, y: number) => x + (y - x) * f;
  const C = (x: string, y: string, out: THREE.Color) => out.copy(tmpA.set(x)).lerp(tmpB.set(y), f);
  return { a, b, f, L, C };
}

/**
 * Hero lighting: HDRI environment for reflections + a large soft key,
 * a rim from behind, a fill, a narrow "spark" for the intro and a
 * travelling sweep light. All parameters blend between presets as
 * `sceneCurrent.light` moves through the story.
 */
export function Lighting() {
  const scene = useThree((s) => s.scene);
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const spark = useRef<THREE.SpotLight>(null);
  const sweep = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const sparkTarget = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0.9, 0.35, 0.2);
    return o;
  }, []);

  const lastBg = useRef("");
  const gl = useThree((s) => s.gl);
  const studio = useStore((s) => s.glbOnStage);
  // both environments load once during the preloader; swapping scene.environment later never suspends
  const envDefault = useEnvironment({ files: "/assets/hdr/studio_small_09_1k.hdr" });
  // the client's LDR studio image goes through the plain TextureLoader (drei's .jpg path expects a gain-map HDR)
  const envStudio = useLoader(THREE.TextureLoader, "/assets/hdr/legacy-studio-1k.jpg");
  useEffect(() => {
    envStudio.mapping = THREE.EquirectangularReflectionMapping;
    envStudio.colorSpace = THREE.SRGBColorSpace;
    envStudio.needsUpdate = true;
  }, [envStudio]);
  const stripFront = useRef<THREE.RectAreaLight>(null);
  const stripBack = useRef<THREE.RectAreaLight>(null);

  // AgX for the client asset (Blender's view transform), ACES for the procedural story look
  useEffect(() => {
    gl.toneMapping = studio ? THREE.AgXToneMapping : THREE.ACESFilmicToneMapping;
    rigState.exposureMul = studio ? STUDIO.exposure : 1;
  }, [gl, studio]);

  useEffect(() => {
    scene.add(target, sparkTarget);
    return () => {
      scene.remove(target, sparkTarget);
    };
  }, [scene, target, sparkTarget]);

  useFrame(() => {
    const { light, exposure, sweep: sw, spark: sp } = sceneCurrent;
    // a receding object loses contrast the way it would behind a lit surface
    const flat = Math.max(sceneCurrent.flat, sceneCurrent.recede * 0.85);
    const { a, b, L, C } = lerpPreset(light);
    const hover = useStore.getState().hoveringWatch ? 1.18 : 1;
    const S = studio ? STUDIO : null;
    const env = S ? envStudio : envDefault;
    if (scene.environment !== env) scene.environment = env;

    scene.environmentIntensity = L(a.env, b.env) * (1 - flat * 0.25) * (S ? S.env : 1);
    scene.environmentRotation.set(0, L(a.envRotation, b.envRotation) + sw * Math.PI * 0.85, 0);

    if (key.current) {
      key.current.intensity = L(a.key, b.key) * (1 - flat * 0.55) * hover * 3.2 * (S ? S.key : 1);
      C(a.keyColor, b.keyColor, key.current.color);
      key.current.position.set(2.6, 3.6, 4.2);
    }
    if (rim.current) {
      rim.current.intensity = L(a.rim, b.rim) * (1 - flat * 0.7) * 0.9 * (S ? S.rim : 1);
      C(a.rimColor, b.rimColor, rim.current.color);
    }
    if (fill.current) {
      fill.current.intensity = L(a.fill, b.fill) * (1 + flat * 1.2) * 0.8 * (S ? S.fill : 1);
      C(a.fillColor, b.fillColor, fill.current.color);
    }
    if (stripFront.current && stripBack.current) {
      const on = S ? (1 - flat * 0.6) * hover : 0;
      stripFront.current.intensity = STUDIO.strip * on;
      stripBack.current.intensity = STUDIO.strip * 0.5 * on;
      stripFront.current.lookAt(0, 0, 0);
      stripBack.current.lookAt(0, 0, 0);
    }
    if (spark.current) {
      spark.current.intensity = sp * 160;
    }
    if (sweep.current) {
      const s = Math.sin(Math.PI * THREE.MathUtils.clamp(sw, 0, 1));
      sweep.current.intensity = s * 45;
      sweep.current.position.set(-5 + sw * 10, 2.2, 3.8);
    }

    // Background + theme live on the DOM side of the transparent canvas.
    const bg = C(a.bg, b.bg, tmpA).getStyle();
    if (bg !== lastBg.current) {
      lastBg.current = bg;
      document.documentElement.style.setProperty("--bg-live", bg);
      document.documentElement.style.setProperty("--glow-live", C(a.glowColor, b.glowColor, tmpB).getStyle());
      document.documentElement.style.setProperty("--glow-alpha", String(L(a.glow, b.glow) * exposure));
    }
  });

  return (
    <>
      {/* client strip lights: 2.54 × 0.25 m soft boxes, scaled to watch units */}
      <rectAreaLight ref={stripFront} args={["#fff6ea", 0, 5.2, 1.6]} position={[0.8, 4.2, 2.8]} />
      <rectAreaLight ref={stripBack} args={["#e9eeff", 0, 5.2, 1.6]} position={[-0.6, -2.6, -3.4]} />
      <spotLight ref={key} position={[2.6, 3.6, 4.2]} angle={0.7} penumbra={1} decay={2} distance={30} target={target} />
      <directionalLight ref={rim} position={[-3, 2.5, -4]} />
      <directionalLight ref={fill} position={[-4, -1, 3]} />
      <spotLight ref={spark} position={[3.4, 1.4, 1.6]} angle={0.09} penumbra={0.9} decay={2} distance={20} target={sparkTarget} color="#fff2dd" />
      <spotLight ref={sweep} position={[-5, 2.2, 3.8]} angle={0.55} penumbra={1} decay={2} distance={30} target={target} color="#ffffff" />
    </>
  );
}
