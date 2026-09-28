"use client";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, Preload } from "@react-three/drei";
import { CameraRig } from "./CameraRig";
import { Lighting } from "./Lighting";
import { WatchRig } from "./WatchRig";
import { Effects } from "./Effects";
import { Atmosphere } from "./Atmosphere";
import { useStore } from "@/lib/store";
import { QUALITY_SETTINGS, dprForViewport } from "@/lib/quality";
import { PerfProbe } from "@/lib/perf";
import { Warmup } from "./Warmup";
import { QA } from "@/lib/qaflags";

/**
 * One persistent WebGL world for the whole page. The canvas is fixed and
 * transparent; the DOM story moves around it.
 */
export function Scene() {
  const quality = useStore((s) => s.quality);
  const settings = QUALITY_SETTINGS[quality];
  const [dprSteps, setDprSteps] = useState(0);
  const [visible, setVisible] = useState(true);
  const covered = useStore((s) => s.sceneCovered);
  const [viewport, setViewport] = useState<[number, number]>([1440, 900]);
  useEffect(() => {
    const read = () => setViewport([window.innerWidth, window.innerHeight]);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  const dprCap = Math.max(1, dprForViewport(viewport[0], viewport[1], settings.dpr[1], settings.pixelBudget) - dprSteps * 0.25);

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div className="scene-root" aria-hidden="true">
      <Canvas
        dpr={[settings.dpr[0], dprCap]}
        frameloop={visible && !covered ? "always" : "never"}
        gl={{
          alpha: true,
          antialias: !settings.post,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
          premultipliedAlpha: true,
        }}
        camera={{ fov: 30, near: 0.4, far: 40, position: [0, 0, 8] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.setClearColor(0x000000, 0);
        }}
        style={{ position: "absolute", inset: 0 }}
      >
        <PerformanceMonitor
          flipflops={2}
          onDecline={() => setDprSteps((d) => Math.min(4, d + 1))}
          onIncline={() => setDprSteps((d) => Math.max(0, d - 1))}
        />
        <CameraRig />
        <PerfProbe />
        <Warmup />
        <Suspense fallback={null}>
          <Lighting />
          <WatchRig />
          {settings.particles > 0 && <Atmosphere count={settings.particles} />}
          {settings.post && QA.post && <Effects />}
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
