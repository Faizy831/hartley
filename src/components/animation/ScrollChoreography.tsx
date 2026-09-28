"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { sceneTarget, type SceneState } from "@/lib/sceneState";
import { getChoreography, resolveFrame, type PageKind } from "@/lib/choreography";
import { HOME_SECTIONS, PRODUCT_SECTIONS } from "@/data/copy";
import { useStore } from "@/lib/store";
import { useScrollFn } from "@/hooks/useScrub";
import { lenisRef } from "./SmoothScroll";
import { ARCHITECTURES } from "@/data/watches";

export function isMobileLayout() {
  return window.innerWidth < 900 || (window.innerWidth < 1100 && window.innerHeight > window.innerWidth);
}
export function pageKind(pathname: string): PageKind {
  if (pathname.startsWith("/watch/")) return "product";
  if (pathname.startsWith("/watches")) return "catalog";
  return "home";
}

/** Pending anchor to scroll to once the next page's timeline is built. */
export const navIntent: { hash: string | null } = { hash: null };

/**
 * Builds ONE master timeline for the current page, scrubbed by scroll.
 * Every beat becomes a tween on `sceneTarget`; the renderer damps toward it.
 * Rebuilt on navigation, so the canvas (and the object) persist across pages.
 */
export function ScrollChoreography() {
  const introDone = useStore((s) => s.introDone);
  const setSection = useStore((s) => s.setSection);
  const pathname = usePathname();
  const page = pageKind(pathname);

  useScrollFn((y, vh) => {
    const root = document.documentElement;
    const papers = document.querySelectorAll<HTMLElement>("[data-paper]");
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const smooth = (v: number) => {
      const x = clamp(v);
      return x * x * (3 - 2 * x);
    };
    const write = (selector: string, name: string, value: string) =>
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        if (el.style.getPropertyValue(name) !== value) el.style.setProperty(name, value);
      });
    // paperP: how far the paper room's ink has taken over the header band (same edge the sheet uses)
    // coverIn / coverOut: the sheet's edge travelling up the viewport on entry / exit (0..1)
    let paperP = 0;
    let coverIn = 0;
    let coverOut = 0;
    const probe = y + 38; // the header's midline
    // the catalog page is paper from its first pixel
    if (root.hasAttribute("data-catalog")) paperP = 1;
    papers.forEach((el) => {
      const top = el.offsetTop;
      const bottom = top + el.offsetHeight;
      const edgeIn = (top - y) / vh; // 1 = edge at viewport bottom, 0 = edge at top
      const edgeOut = (bottom - y) / vh;
      // the header's world flips as the sheet's straight edge passes its midline (a 16 px window, no crossfade)
      paperP = Math.max(paperP, smooth((probe - top) / 16 + 0.5) * smooth((bottom - probe) / 16 + 0.5));
      if (edgeIn > -0.2 && edgeIn < 1.2) coverIn = Math.max(coverIn, clamp(1 - edgeIn));
      if (edgeOut > -0.2 && edgeOut < 1.2) coverOut = Math.max(coverOut, clamp(1 - edgeOut));
      // this sheet's own arrival (stays 1 once it owns the viewport): its heading is revealed into the ivory
      const head = el.querySelector<HTMLElement>(".catalog__head");
      if (head) {
        const v = clamp(1 - edgeIn).toFixed(3);
        if (head.style.getPropertyValue("--sheet-in") !== v) head.style.setProperty("--sheet-in", v);
      }
    });
    // Each value is written on the elements that read it, never on the root: a root custom property changing
    // every scrolled frame restyled ~300 elements per frame (12 ms) while a sheet was arriving.
    write(".nav", "--paper-p", paperP.toFixed(3));
    write(".indicator, .vignette", "--cover-p", Math.max(coverIn, coverOut > 0 ? 1 - coverOut : 0).toFixed(3));
    // the sheet's approach only (0 = edge at the viewport bottom, 1 = at the top): the stage under it steps back
    write(".stage", "--cover-in", coverIn.toFixed(3));
    const theme = paperP > 0.5 ? "paper" : "dark";
    if (root.dataset.theme !== theme) root.dataset.theme = theme;
    const footer = document.getElementById("specifications");
    const ending = !!footer && y > footer.offsetTop - vh * 0.6;
    document.documentElement.toggleAttribute("data-ending", ending);
  });

  // Route change: land on the requested chapter, or the top — once. After
  // this the scroll position belongs to the user; nothing else moves it.
  const landedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!introDone || landedFor.current === pathname) return;
    landedFor.current = pathname;
    const hash = navIntent.hash;
    navIntent.hash = null;
    const target = hash ? document.querySelector<HTMLElement>(hash) : null;
    if (target) lenisRef.current?.scrollTo(target, { offset: 0, duration: 1.6 });
    else if (window.scrollY > 0) lenisRef.current?.scrollTo(0, { immediate: true });
  }, [introDone, pathname]);

  const thumbMode = useStore((s) => s.thumbMode);
  useEffect(() => {
    if (!introDone || thumbMode || page === "catalog") return;
    const main = document.getElementById("main");
    if (!main) return;

    let tl: gsap.core.Timeline | null = null;
    let master: ScrollTrigger | null = null;
    let sectionTriggers: ScrollTrigger[] = [];
    const sections = page === "home" ? HOME_SECTIONS : PRODUCT_SECTIONS;
    document.documentElement.toggleAttribute("data-catalog", false);

    const build = () => {
      tl?.kill();
      master?.kill();
      sectionTriggers.forEach((t) => t.kill());
      sectionTriggers = [];

      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const beats = getChoreography(page, isMobileLayout());
      const yawBase = beats.filter((b) => b.section === "watch" && b.state !== "frame").length ? (page === "home" ? Math.PI * 4 : Math.PI * 2) : 0;

      const frame = document.getElementById("editorial-frame");
      const sticky = frame?.closest<HTMLElement>(".sticky-view");
      let frameState: Partial<SceneState> | null = null;
      if (frame && sticky) {
        const fr = frame.getBoundingClientRect();
        const sr = sticky.getBoundingClientRect();
        const rect = new DOMRect(fr.left, fr.top - sr.top, fr.width, fr.height);
        const radius = ARCHITECTURES[useStore.getState().activeWatchId.startsWith("heritage") ? "heritage" : useStore.getState().activeWatchId.startsWith("legacy") ? "legacy" : "veloris"].radius;
        frameState = resolveFrame(rect, vw, vh, yawBase, radius);
      }

      const keys = beats
        .map((b) => {
          const el = document.getElementById(`s-${b.section}`);
          if (!el) return null;
          const pos = Math.max(0, el.offsetTop + b.at * vh);
          const state = b.state === "frame" ? (frameState ?? {}) : b.state;
          return { pos, state, ease: b.ease ?? "power2.inOut" };
        })
        .filter((k): k is { pos: number; state: Partial<SceneState>; ease: string } => !!k)
        .sort((a, b) => a.pos - b.pos);

      const maxScroll = Math.max(1, main.scrollHeight - vh);
      tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      let prev = 0;
      for (const k of keys) {
        const dur = k.pos - prev;
        if (dur <= 0.5) tl.set(sceneTarget, { ...k.state }, k.pos);
        else tl.to(sceneTarget, { ...k.state, duration: dur, ease: k.ease }, prev);
        prev = k.pos;
      }
      tl.set({}, {}, maxScroll);

      master = ScrollTrigger.create({ trigger: main, start: "top top", end: "bottom bottom", scrub: true, animation: tl, invalidateOnRefresh: false });

      for (const s of sections) {
        const el = document.getElementById(`s-${s.id}`);
        if (!el) continue;
        sectionTriggers.push(
          ScrollTrigger.create({
            trigger: el,
            start: "top 50%",
            end: "bottom 50%",
            onToggle: (self) => {
              if (self.isActive) setSection(s.id);
            },
          }),
        );
      }
      ScrollTrigger.refresh();
    };

    build();

    let raf = 0;
    let lastW = window.innerWidth;
    const onResize = () => {
      if (Math.abs(window.innerWidth - lastW) < 2) return;
      lastW = window.innerWidth;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(build);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      tl?.kill();
      master?.kill();
      sectionTriggers.forEach((t) => t.kill());
    };
    // rebuilt on route change and on resize; family changes re-resolve the frame without a rebuild
  }, [introDone, setSection, page, pathname, thumbMode]);

  return null;
}
