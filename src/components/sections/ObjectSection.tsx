"use client";
import { SectionHead } from "./SectionHead";
import { Reveal } from "@/components/animation/Reveal";
import { useActiveWatch } from "@/hooks/useActiveWatch";

export function ObjectSection() {
  const w = useActiveWatch();
  const c = w.family.chapters.object;
  return (
    <section id="s-object" className="section" style={{ height: "160vh" }} aria-labelledby="h-object">
      <div className="sticky-view grid-12">
        <div className="col-right">
          <SectionHead id="h-object" index="02" label="The Object" headline={c.headline} body={c.body} />
        </div>
        <Reveal as="ul" mode="fade" className="strip col-full" delay={0.5}>
          {w.family.strip.map((s) => (
            <li key={s.k} className="strip__item">
              <span className="strip__value t-num">
                {s.v}
                {s.u && <span className="strip__unit">{s.u}</span>}
              </span>
              <span className="t-micro strip__key">{s.k}</span>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
