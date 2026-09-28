"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "@/lib/gsap";
import { useStore } from "@/lib/store";

/**
 * Catalog sections are solid document content over the scene. While one of
 * them covers the viewport the renderer pauses; it resumes as soon as the
 * scene is visible again. This only reads scroll — it never sets it.
 */
export function CoverTriggers() {
  const pathname = usePathname();
  const introDone = useStore((s) => s.introDone);
  const setCovered = useStore((s) => s.setSceneCovered);
  useEffect(() => {
    if (!introDone) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-covers-scene]"));
    if (els.length === 0) {
      setCovered(false);
      return;
    }
    const active = new Set<HTMLElement>();
    const triggers = els.map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top top+=2",
        end: "bottom bottom-=2",
        onToggle: (self) => {
          if (self.isActive) active.add(el);
          else active.delete(el);
          setCovered(active.size > 0);
          document.documentElement.toggleAttribute("data-covered", active.size > 0);
        },
      }),
    );
    return () => {
      triggers.forEach((t) => t.kill());
      setCovered(false);
      document.documentElement.toggleAttribute("data-covered", false);
    };
  }, [pathname, introDone, setCovered]);
  return null;
}
