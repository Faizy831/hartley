"use client";
import { useEffect, useRef, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/** Run `fn(scrollY, viewportHeight)` on every scroll update (and once on mount). */
export function useScrollFn(fn: (y: number, vh: number) => void) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => {
    const run = () => ref.current(window.scrollY, window.innerHeight);
    const st = ScrollTrigger.create({ onUpdate: run, onRefresh: run });
    run();
    return () => st.kill();
  }, []);
}

/**
 * Scrub a tween over a scroll window expressed in viewport heights relative
 * to the moment `sectionId`'s top reaches the top of the viewport.
 */
export function useScrub(
  ref: RefObject<HTMLElement | null>,
  sectionId: string,
  fromVh: number,
  toVh: number,
  from: gsap.TweenVars,
  to: gsap.TweenVars,
  deps: unknown[] = [],
) {
  useEffect(() => {
    const el = ref.current;
    const section = document.getElementById(`s-${sectionId}`);
    if (!el || !section) return;
    const tween = gsap.fromTo(el, from, {
      ...to,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: () => `top+=${fromVh * window.innerHeight} top`,
        end: () => `top+=${toVh * window.innerHeight} top`,
        scrub: true,
      },
    });
    return () => {
      (tween.scrollTrigger as ScrollTrigger | undefined)?.kill();
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
