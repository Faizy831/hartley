"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { dustVertex, dustFragment } from "@/shaders/dust";
import { sceneCurrent } from "@/lib/sceneState";
import { useStore } from "@/lib/store";

/**
 * A handful of slow, small dust motes around the object — crisp discs, drawn in the
 * shader. They are there to give the air depth; at full opacity they are barely
 * visible by design.
 */
export function Atmosphere({ count = 120 }: { count?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const thumbMode = useStore((s) => s.thumbMode);

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = -3 + Math.random() * 4.5;
      scales[i] = 0.4 + Math.random() * 1.2;
      speeds[i] = 0.3 + Math.random() * 0.7;
      phases[i] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uSize: { value: 8 },
        uOpacity: { value: 0 },
      },
    });
    return { geometry: g, material: m };
  }, [count]);

  useFrame((state) => {
    const m = mat.current;
    if (!m) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uPixelRatio.value = state.viewport.dpr;
    m.uniforms.uOpacity.value = (thumbMode ? 0 : 0.14) * sceneCurrent.exposure * (1 - sceneCurrent.flat) * (1 - sceneCurrent.explode * 0.5) * (1 - sceneCurrent.recede);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} ref={(p) => { if (p) mat.current = p.material as THREE.ShaderMaterial; }} />;
}
