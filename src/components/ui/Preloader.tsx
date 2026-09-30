"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { gsap } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { useFontsReady } from "@/hooks/useFontsReady";
import { stageAssetPending } from "@/lib/stageAsset";

/**
 * Safety exit: the loader leaves on its own after this long, unless the object on stage's real asset is still
 * arriving, in which case it holds on until the asset is in (a cold start spends its time on the 10 MB download,
 * the Draco decode and the first compile; leaving mid-way opened the story on the procedural stand-in and swapped
 * the real watch in later, which read as "a different watch") — but never longer than the hard limit.
 */
const SAFETY_MS = 9000;
const SAFETY_MAX_MS = 30000;

/** power2.inOut, as the fade was tuned. */
const FADE_EASE = "cubic-bezier(0.45, 0, 0.55, 1)";

/** Minimal loader: the wordmark and a hairline that fills. */
export function Preloader() {
  const { progress, active } = useProgress();
  const fonts = useFontsReady();
  const setLoaded = useStore((s) => s.setLoaded);
  const warm = useStore((s) => s.sceneWarm);
  const [gone, setGone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const leaving = useRef(false);

  useEffect(() => {
    if (bar.current) gsap.to(bar.current, { scaleX: progress / 100, duration: 0.6, ease: "power2.out" });
  }, [progress]);

  /**
   * The exit is a compositor animation (Web Animations API on opacity): it keeps its timing while the main
   * thread is busy with the scene's first draws, which a JS-ticked tween cannot. There is one owner — the
   * first caller wins, so the safety path can never start a second fade over the normal one — and `loaded`
   * still flips only once the fade has finished.
   */
  const leave = useCallback(
    (duration: number) => {
      const el = root.current;
      if (leaving.current || !el) return;
      leaving.current = true;
      const fade = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: FADE_EASE, fill: "forwards" });
      fade.finished.then(
        () => {
          setGone(true);
          setLoaded(true);
        },
        () => {
          /* cancelled (element removed): nothing left to reveal */
        },
      );
    },
    [setLoaded],
  );

  useEffect(() => {
    // wait for the first load cycle to actually start and finish
    if (active) started.current = true;
    if (!fonts || active || !started.current || progress < 100 || !warm) return;
    const t = setTimeout(() => leave(1000), 350);
    return () => clearTimeout(t);
  }, [progress, active, fonts, warm, leave]);

  // Safety: never trap the user behind a loader
  useEffect(() => {
    const t0 = performance.now();
    const check = () => {
      if (useStore.getState().loaded) return;
      const waited = performance.now() - t0;
      if (waited < SAFETY_MS) return;
      if (waited < SAFETY_MAX_MS && stageAssetPending()) return;
      leave(800);
    };
    const id = setInterval(check, 500);
    return () => clearInterval(id);
  }, [leave]);

  if (gone) return null;
  return (
    <div ref={root} className="preloader" role="status" aria-live="polite">
      <span className="t-brand preloader__brand">Hartley</span>
      <div className="preloader__track">
        <div ref={bar} className="preloader__bar" />
      </div>
      <span className="sr-only">Loading the experience</span>
    </div>
  );
}
