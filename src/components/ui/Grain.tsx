"use client";
import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

/**
 * Film grain + vignette + the soft glow that sits behind the watch.
 * The grain is a tiled 192px noise canvas re-positioned at 8 fps, which is
 * effectively free compared to an SVG turbulence filter.
 */
export function Grain() {
  const el = useRef<HTMLDivElement>(null);
  const reduced = useStore((s) => s.reducedMotion);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const size = 192;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + Math.random() * 90;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    node.style.backgroundImage = `url(${c.toDataURL()})`;
    if (reduced) return;
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 125) return;
      last = t;
      node.style.backgroundPosition = `${Math.floor(Math.random() * size)}px ${Math.floor(Math.random() * size)}px`;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <>
      <div className="bg-live" aria-hidden="true" />
      <div className="bg-glow" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div ref={el} className="grain" aria-hidden="true" />
    </>
  );
}
