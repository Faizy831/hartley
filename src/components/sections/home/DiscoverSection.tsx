"use client";
import { useRef } from "react";
import { Reveal } from "@/components/animation/Reveal";
import { useScrub } from "@/hooks/useScrub";
import { FAMILIES } from "@/data/watches";
import { useGo } from "@/components/ui/Nav";

/**
 * The collection reveal. Two words, two families, one object turning
 * between them. The large "Two expressions of time" line sits behind the
 * watch in the BehindLayer.
 */
export function DiscoverSection() {
  const go = useGo();
  const a = useRef<HTMLDivElement>(null);
  useScrub(a, "discover", 1.0, 1.5, { opacity: 0, y: 30 }, { opacity: 1, y: 0 });
  return (
    <section id="s-discover" className="section" style={{ height: "220vh" }} aria-labelledby="h-discover">
      <div className="sticky-view grid-12">
        <div className="col-right">
          <Reveal as="p" mode="fade" className="section-head__label t-micro">
            <span className="t-num">02</span>
            <span className="section-head__rule" aria-hidden="true" />
            <span>The collection</span>
          </Reveal>
          <Reveal as="h2" mode="lines" id="h-discover" className="t-editorial section-head__title" text={"Two distinct\nexpressions *of time.*"} delay={0.1} />
        </div>
        <div ref={a} className="pair col-full interactive" style={{ opacity: 0 }}>
          {(["legacy", "heritage"] as const).map((id) => {
            const f = FAMILIES[id];
            return (
              <a key={id} href={`/#s-${id}`} className="pair__item" onClick={(e) => go(e, `/#s-${id}`)} data-cursor="explore">
                <span className="t-micro pair__kicker">{id === "legacy" ? "Automatic · limited edition" : "Quartz · 7 mm slim"}</span>
                <span className="pair__name t-editorial">{f.name}</span>
                <span className="pair__tag t-lead">{f.tagline}</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
