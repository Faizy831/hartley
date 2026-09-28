"use client";
import { useEffect, useRef } from "react";
import { Reveal } from "@/components/animation/Reveal";
import { useActiveWatch } from "@/hooks/useActiveWatch";

/**
 * 3D → 2D. An ivory sheet slides over the scene; the watch settles into a
 * printed frame and reads as a photograph in an editorial spread.
 */
export function WatchSection({ index = "08" }: { index?: string }) {
  const sheet = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const w = useActiveWatch();
  const c = w.family.chapters.editorial;

  useEffect(() => {
    const s = sheet.current;
    const f = frame.current;
    if (!s || !f) return;
    const layout = () => {
      const sr = s.getBoundingClientRect();
      const fr = f.getBoundingClientRect();
      s.style.setProperty("--f-top", `${fr.top - sr.top}px`);
      s.style.setProperty("--f-left", `${fr.left - sr.left}px`);
      s.style.setProperty("--f-w", `${fr.width}px`);
      s.style.setProperty("--f-h", `${fr.height}px`);
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(s);
    ro.observe(f);
    return () => ro.disconnect();
  }, []);

  return (
    <section id="s-watch" className="section section--paper" data-paper style={{ height: "260vh" }} aria-labelledby="h-watch">
      <div ref={sheet} className="sticky-view sheet">
        <div className="sheet__panel sheet__panel--top" />
        <div className="sheet__panel sheet__panel--bottom" />
        <div className="sheet__panel sheet__panel--left" />
        <div className="sheet__panel sheet__panel--right" />
        <div className="sheet__content grid-12">
          <div className="col-left sheet__text">
            <Reveal as="p" mode="fade" className="section-head__label t-micro">
              <span className="t-num">{index}</span>
              <span className="section-head__rule" aria-hidden="true" />
              <span>The Watch</span>
            </Reveal>
            <Reveal as="h2" mode="lines" id="h-watch" className="t-editorial section-head__title" text={c.headline} delay={0.1} />
            <Reveal as="p" mode="fade" className="t-body section-head__body" delay={0.35}>
              {c.body}
            </Reveal>
            <Reveal as="p" mode="fade" className="sheet__quote t-lead" delay={0.5}>
              {c.quote}
            </Reveal>
          </div>
          <div id="editorial-frame" ref={frame} className="frame" aria-hidden="true">
            <span className="frame__corner frame__corner--tl" />
            <span className="frame__corner frame__corner--tr" />
            <span className="frame__corner frame__corner--bl" />
            <span className="frame__corner frame__corner--br" />
            <p className="frame__caption t-micro">
              <span>Fig. {index}</span>
              <span>{w.def.name}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
