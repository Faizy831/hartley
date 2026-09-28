"use client";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useScrub, useScrollFn } from "@/hooks/useScrub";
import { useActiveWatch } from "@/hooks/useActiveWatch";

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const x = clamp(v);
  return x * x * (3 - 2 * x);
};

/**
 * Typography that lives BEHIND the 3D watch. Fixed under the transparent
 * canvas; scroll decides which composition is visible.
 */
export function BehindLayer() {
  const hero = useRef<HTMLDivElement>(null);
  const feature = useRef<HTMLDivElement>(null);
  const featureInner = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHome = !pathname.startsWith("/watch/");
  const w = useActiveWatch();
  const lines: [string, string] = isHome ? ["Time,", "well kept."] : w.family.heroLines;
  const featureLines: [string, string] = isHome ? ["Two expressions", "of *time.*"] : ["Every second", "has a *mechanism.*"];
  // the big feature line lives in the craft chapter (product) or the discover chapter (home)
  // the home story states its own headline in the DOM; the large behind-type line is a product-film device
  const featureSection = isHome ? "none" : "craft";
  const from = isHome ? 0.05 : 1.4;
  const span = isHome ? 0.9 : 1.8;
  const outSection = isHome ? "legacy" : "watch";

  useScrub(hero, "hero", 0.05, 0.75, { opacity: 1, y: 0 }, { opacity: 0, y: -80 }, [pathname]);
  useScrollFn((y, vh) => {
    const el = document.getElementById(`s-${featureSection}`);
    const out = document.getElementById(`s-${outSection}`);
    if (!el || !out || !feature.current || !featureInner.current) return;
    const top = el.offsetTop;
    const fadeIn = smooth((y - (top + from * vh)) / (0.5 * vh));
    const fadeOut = 1 - smooth((y - (out.offsetTop - 0.6 * vh)) / (0.45 * vh));
    feature.current.style.opacity = String(fadeIn * fadeOut);
    const p = clamp((y - (top + from * vh)) / (span * vh));
    featureInner.current.style.transform = `translateY(${60 - 100 * p}px) scale(${0.985 + 0.015 * p})`;
  });

  return (
    <div className="behind" aria-hidden="true">
      <div ref={hero} className="behind__hero gutter">
        <h1 className="t-display behind__title">
          <span className="reveal-line" data-intro="line">
            <span style={{ opacity: 0 }}>{lines[0]}</span>
          </span>
          <span className="reveal-line" data-intro="line">
            <span style={{ opacity: 0 }}>
              <em>{lines[1]}</em>
            </span>
          </span>
        </h1>
      </div>
      <div ref={feature} className="behind__craft gutter" style={{ opacity: 0 }}>
        <div ref={featureInner} className="t-display behind__title behind__title--center">
          <span>{featureLines[0]}</span>
          <span>{renderEm(featureLines[1])}</span>
        </div>
      </div>
    </div>
  );
}

function renderEm(s: string) {
  const parts = s.split(/(\*[^*]+\*)/g).filter(Boolean);
  return parts.map((p, i) => (p.startsWith("*") ? <em key={i}>{p.slice(1, -1)}</em> : <span key={i}>{p}</span>));
}
