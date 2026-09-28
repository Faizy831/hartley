"use client";
import { EffectComposer, Bloom, SMAA } from "@react-three/postprocessing";
import { useStore } from "@/lib/store";

/**
 * Restrained post: a soft bloom for the specular highlights and SMAA.
 * Grain and vignette live in the DOM so they also touch the typography.
 */
export function Effects() {
  const quality = useStore((s) => s.quality);
  if (quality === "low") return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={false} resolutionScale={quality === "high" ? 1 : 0.85}>
      <Bloom mipmapBlur intensity={0.22} luminanceThreshold={1.0} luminanceSmoothing={0.3} radius={0.6} />
      <SMAA />
    </EffectComposer>
  );
}
