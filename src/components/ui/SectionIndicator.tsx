"use client";
import { useEffect, useRef, useState } from "react";
import { HOME_SECTIONS, PRODUCT_SECTIONS } from "@/data/copy";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { gsap } from "@/lib/gsap";

/** Vertical scroll progress with the current chapter number and name. */
export function SectionIndicator() {
  const section = useStore((s) => s.section);
  const introDone = useStore((s) => s.introDone);
  const pathname = usePathname();
  const SECTIONS = pathname.startsWith("/watch/") ? PRODUCT_SECTIONS : HOME_SECTIONS;
  const bar = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(HOME_SECTIONS[0]);
  const numRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const next = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
    if (next.id === display.id) return;
    const els = [numRef.current, nameRef.current];
    gsap.to(els, {
      yPercent: -110,
      opacity: 0,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        setDisplay(next);
        gsap.fromTo(els, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out" });
      },
    });
  }, [section, display.id, SECTIONS]);

  return (
    <div className={`indicator ${introDone ? "indicator--ready" : ""}`} aria-hidden="true">
      <div className="indicator__track">
        <div ref={bar} className="indicator__bar" />
      </div>
      <div className="indicator__meta">
        <span className="reveal-line">
          <span ref={numRef} className="t-num indicator__num">
            {display.index}
          </span>
        </span>
        <span className="reveal-line">
          <span ref={nameRef} className="t-micro indicator__name">
            {display.label}
          </span>
        </span>
      </div>
    </div>
  );
}
