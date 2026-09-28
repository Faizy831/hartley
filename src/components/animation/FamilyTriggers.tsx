"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "@/lib/gsap";
import { useStore } from "@/lib/store";

/**
 * Home only: the object on stage follows the story. Entering the Heritage
 * chapter brings the visitor's Heritage pick on stage; scrolling back up
 * into Legacy brings their Legacy pick back.
 */
export function FamilyTriggers() {
  const pathname = usePathname();
  const introDone = useStore((s) => s.introDone);
  useEffect(() => {
    if (pathname !== "/" || !introDone) return;
    const el = document.getElementById("s-heritage");
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      // fires once the Legacy movement chapter has scrolled out and the Heritage chapter has landed
      start: "top 12%",
      onEnter: () => {
        const s = useStore.getState();
        s.setActiveWatch(s.lastByFamily.heritage);
      },
      onLeaveBack: () => {
        const s = useStore.getState();
        s.setActiveWatch(s.lastByFamily.legacy);
      },
    });
    return () => st.kill();
  }, [pathname, introDone]);
  return null;
}
