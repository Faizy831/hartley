"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useStore } from "@/lib/store";

export const lenisRef: { current: Lenis | null } = { current: null };

export function scrollTo(target: string | number, offset = 0) {
  lenisRef.current?.scrollTo(target, { offset, duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
}

/** Lenis drives the scroll; GSAP's ticker drives Lenis; ScrollTrigger listens. */
export function SmoothScroll() {
  const introDone = useStore((s) => s.introDone);
  const menuOpen = useStore((s) => s.menuOpen);
  const reduced = useStore((s) => s.reducedMotion);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: reduced ? 0.25 : 0.085,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (introDone && !menuOpen) lenis.start();
    else lenis.stop();
  }, [introDone, menuOpen]);

  return null;
}
