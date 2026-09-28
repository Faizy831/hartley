"use client";
import { ScrollHint } from "@/components/ui/ScrollHint";
import { useActiveWatch } from "@/hooks/useActiveWatch";

/** Product-detail hero: one object, its name, its intro line. */
export function Hero() {
  const w = useActiveWatch();
  const diameter = w.def.specifications.find((s) => s.k === "Diameter")?.v;
  return (
    <section id="s-hero" className="section" style={{ height: "160vh" }} aria-label="Introduction">
      <div className="sticky-view">
        <p className="hero__eyebrow t-micro" data-intro="fade" style={{ opacity: 0 }}>
          {w.family.name} · {w.def.type === "quartz" ? "Quartz" : "Automatic"}
        </p>
        <div className="hero__foot gutter">
          <div className="hero__lead" data-intro="fade" style={{ opacity: 0, transform: "translateY(18px)" }}>
            <p className="t-lead">{w.family.intro}</p>
            <p className="t-label hero__model">
              <span>{w.def.name}</span>
              {diameter && (
                <>
                  <span className="hero__dot" aria-hidden="true" />
                  <span>{diameter}</span>
                </>
              )}
            </p>
          </div>
          <ScrollHint />
        </div>
        <span className="sr-only">{w.def.name}. {w.family.intro}</span>
      </div>
    </section>
  );
}
