"use client";
import { ScrollHint } from "@/components/ui/ScrollHint";
import { useActiveWatch } from "@/hooks/useActiveWatch";

export function HomeHero() {
  const w = useActiveWatch();
  return (
    <section id="s-hero" className="section" style={{ height: "160vh" }} aria-label="Introduction">
      <div className="sticky-view">
        <p className="hero__eyebrow t-micro" data-intro="fade" style={{ opacity: 0 }}>
          Hartley Watches · Legacy &amp; Heritage
        </p>
        <div className="hero__foot gutter">
          <div className="hero__lead" data-intro="fade" style={{ opacity: 0, transform: "translateY(18px)" }}>
            <p className="t-lead">Two collections. One idea of what a watch should be: a physical object, made to last.</p>
            <p className="t-label hero__model">
              <span>{w.def.name}</span>
              <span className="hero__dot" aria-hidden="true" />
              <span>{w.def.type === "quartz" ? "Quartz" : "Automatic"}</span>
            </p>
          </div>
          <ScrollHint />
        </div>
        <span className="sr-only">Hartley Watches. Explore the Legacy automatic and the Heritage minimalist quartz collections in 3D.</span>
      </div>
    </section>
  );
}
