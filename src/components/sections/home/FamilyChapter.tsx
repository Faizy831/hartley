"use client";
import { SectionHead } from "../SectionHead";
import { Reveal } from "@/components/animation/Reveal";
import { FAMILIES, type FamilyId } from "@/data/watches";

/** Chapter opener for a family: name, verified story, figures. */
export function FamilyChapter({ family, index }: { family: FamilyId; index: string }) {
  const f = FAMILIES[family];
  const headline = family === "legacy" ? "Mechanical.\nOne of *one hundred\nand twenty-five.*" : "Minimal.\nSeven millimetres\n*slim.*";
  return (
    <section id={`s-${family}`} className="section" style={{ height: family === "legacy" ? "160vh" : "180vh" }} aria-labelledby={`h-${family}`}>
      <div className="sticky-view grid-12">
        <div className="col-left">
          <SectionHead id={`h-${family}`} index={index} label={f.name} headline={headline} body={f.intro} />
        </div>
        <Reveal as="ul" mode="fade" className="strip col-full" delay={0.5}>
          {f.strip.map((s) => (
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
