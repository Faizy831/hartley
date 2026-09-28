"use client";
import { useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { detectQuality } from "@/lib/quality";
import { SmoothScroll } from "@/components/animation/SmoothScroll";
import { ScrollChoreography, isMobileLayout } from "@/components/animation/ScrollChoreography";
import { Intro } from "@/components/animation/Intro";
import { FamilyTriggers } from "@/components/animation/FamilyTriggers";
import { CoverTriggers } from "@/components/animation/CoverTriggers";
import { Nav } from "@/components/ui/Nav";
import { Menu } from "@/components/ui/Menu";
import { Cursor } from "@/components/ui/Cursor";
import { Grain } from "@/components/ui/Grain";
import { SectionIndicator } from "@/components/ui/SectionIndicator";
import { Preloader } from "@/components/ui/Preloader";
import { BehindLayer } from "@/components/sections/BehindLayer";

const Scene = dynamic(() => import("@/components/3d/Scene").then((m) => m.Scene), { ssr: false });

/**
 * Persistent client shell. Lives in the root layout so the WebGL world,
 * the object on stage and the chrome survive navigation between the
 * collection and product pages.
 */
export function Experience({ children }: { children: ReactNode }) {
  const setQuality = useStore((s) => s.setQuality);
  const setEnv = useStore((s) => s.setEnv);
  const setThumbMode = useStore((s) => s.setThumbMode);

  useEffect(() => {
    setQuality(detectQuality());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touch = window.matchMedia("(pointer: coarse)");
    const apply = () => setEnv({ reducedMotion: mq.matches, isTouch: touch.matches, mobileLayout: isMobileLayout() });
    apply();
    mq.addEventListener("change", apply);
    touch.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (new URLSearchParams(window.location.search).has("thumb")) {
      document.documentElement.classList.add("thumb-mode");
      setThumbMode(true);
    }
    return () => {
      mq.removeEventListener("change", apply);
      touch.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, [setQuality, setEnv, setThumbMode]);

  return (
    <>
      <Grain />
      <BehindLayer />
      <Scene />
      <SmoothScroll />
      <ScrollChoreography />
      <FamilyTriggers />
      <CoverTriggers />
      <Intro />
      <Nav />
      <Menu />
      <SectionIndicator />
      <main id="main" className="main">
        {children}
      </main>
      <Cursor />
      <Preloader />
    </>
  );
}
