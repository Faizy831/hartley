"use client";
import { useEffect, useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";
import { sceneTarget, resetSceneState } from "@/lib/sceneState";
import { rigState } from "@/components/3d/CameraRig";
import { HERO_STATE, HERO_STATE_MOBILE } from "@/lib/choreography";
import { useStore } from "@/lib/store";
import { isMobileLayout, pageKind } from "./ScrollChoreography";
import { usePathname } from "next/navigation";

/** Fixed pose used to render product thumbnails. */
export const THUMB_POSE = { yaw: 0.38, pitch: 0.1, roll: -0.1, fit: 0.66, fov: 28, ax: 0, ay: 0.02, explode: 0, light: 3, sweep: 0, flat: 0.35, exposure: 1, spark: 0 };

/** Pose the opening starts from: the hero anchor, turned away, further back, dark. */
function introStart(hero: Partial<typeof HERO_STATE>) {
  return { yaw: -1.15, pitch: 0.42, roll: -0.28, fit: 0.36, fov: 36, ax: hero.ax ?? 0, ay: (hero.ay ?? 0) - 0.05, exposure: 0, spark: 0, sweep: 0, light: 0, flat: 0, explode: 0 };
}

/**
 * The opening: darkness → a single highlight on the bezel → light travels
 * across the case while the camera approaches → the type settles in.
 */
export function Intro() {
  const loaded = useStore((s) => s.loaded);
  const reduced = useStore((s) => s.reducedMotion);
  const setIntroDone = useStore((s) => s.setIntroDone);
  const thumbMode = useStore((s) => s.thumbMode);
  const pathname = usePathname();

  // The scene renders (behind the preloader, then through its fade) long before `loaded`, so the state it
  // renders must already be the opening's first frame: set it before the first paint, once per route, and
  // leave it alone once the sequence has started. Without this the module defaults (centred, small, turned)
  // were visible while the preloader faded and the opening then snapped to its anchor.
  useLayoutEffect(() => {
    if (useStore.getState().loaded) return;
    const kind = pageKind(pathname);
    if (thumbMode) resetSceneState(THUMB_POSE);
    else if (kind === "catalog") resetSceneState({ exposure: 1 });
    else {
      const hero = isMobileLayout() ? HERO_STATE_MOBILE : HERO_STATE;
      resetSceneState(reduced ? { ...hero, exposure: 0 } : introStart(hero));
    }
  }, [pathname, thumbMode, reduced]);

  useEffect(() => {
    if (!loaded) return;
    // thumbnail render or catalog page: no opening sequence
    if (thumbMode || pageKind(pathname) === "catalog") {
      resetSceneState(thumbMode ? THUMB_POSE : { exposure: 1 });
      rigState.drift = 0;
      const t = setTimeout(() => {
        setIntroDone(true);
        if (thumbMode) document.documentElement.classList.add("thumb-ready");
      }, thumbMode ? 900 : 0);
      return () => clearTimeout(t);
    }
    const hero = isMobileLayout() ? HERO_STATE_MOBILE : HERO_STATE;
    const lines = document.querySelectorAll<HTMLElement>('[data-intro="line"] > span');
    const fades = document.querySelectorAll<HTMLElement>('[data-intro="fade"]');
    const brand = document.querySelectorAll<HTMLElement>('[data-intro="brand"]');

    gsap.set(lines, { yPercent: 110, opacity: 1 });

    if (reduced) {
      resetSceneState({ ...hero, exposure: 0 });
      const tl = gsap.timeline({ onComplete: () => setIntroDone(true) });
      tl.to(sceneTarget, { exposure: 1, duration: 1.4, ease: "power2.out" }, 0)
        .to(lines, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, 0.4)
        .to([fades, brand], { opacity: 1, duration: 0.8 }, 0.8);
      return () => {
        tl.kill();
      };
    }

    resetSceneState(introStart(hero)); // same pose as the pre-paint initialisation (re-applied in case the layout changed while loading)
    rigState.dampingScale = 2.4;

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        rigState.dampingScale = 1;
        setIntroDone(true);
      },
    });

    tl.to(brand, { opacity: 1, duration: 1.6, ease: "power1.out" }, 0.2)
      // a tiny highlight, nothing else
      .to(sceneTarget, { spark: 1, exposure: 0.42, duration: 1.4, ease: "power2.out" }, 0.5)
      // the silhouette emerges; light travels across the metal
      .to(sceneTarget, { exposure: 1, duration: 2.6, ease: "power1.inOut" }, 1.6)
      .to(sceneTarget, { sweep: 1, duration: 2.4, ease: "power1.inOut" }, 1.7)
      .to(sceneTarget, { spark: 0, duration: 1.2 }, 2.4)
      // camera approaches, the watch turns to its pose
      .to(
        sceneTarget,
        { yaw: hero.yaw, pitch: hero.pitch, roll: hero.roll, fit: hero.fit, fov: hero.fov, ay: hero.ay, duration: 3.4, ease: "power2.inOut" },
        1.4,
      )
      // typography
      .to(lines, { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.12, ease: "power4.out" }, 3.1)
      .to(fades, { opacity: 1, y: 0, duration: 1.2, stagger: 0.12, ease: "power3.out" }, 3.9)
      .set(sceneTarget, { sweep: 0 }, 4.6);

    // any intent to scroll / tap fast-forwards the opening
    const hurry = () => {
      if (tl.progress() < 0.95) tl.timeScale(3.5);
    };
    window.addEventListener("wheel", hurry, { passive: true });
    window.addEventListener("touchstart", hurry, { passive: true });
    window.addEventListener("keydown", hurry);
    window.addEventListener("pointerdown", hurry);
    return () => {
      tl.kill();
      window.removeEventListener("wheel", hurry);
      window.removeEventListener("touchstart", hurry);
      window.removeEventListener("keydown", hurry);
      window.removeEventListener("pointerdown", hurry);
    };
  }, [loaded, reduced, setIntroDone, thumbMode, pathname]);

  return null;
}
