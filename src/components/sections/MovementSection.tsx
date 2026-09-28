"use client";
import { useRef } from "react";
import { SectionHead, Notes } from "./SectionHead";
import { useScrub, useScrollFn } from "@/hooks/useScrub";

const smooth = (v: number) => {
  const x = Math.min(1, Math.max(0, v));
  return x * x * (3 - 2 * x);
};
import { useActiveWatch } from "@/hooks/useActiveWatch";
import { specNotes } from "@/lib/specs";
import { FAMILIES, type FamilyId } from "@/data/watches";

/** Movement chapter + exploded view. Used by the product film and, via `id`, the home Legacy chapter. */
export function MovementSection({ id = "movement", index = "05", label = "The Movement", family: fixedFamily }: { id?: string; index?: string; label?: string; family?: FamilyId }) {
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  const active = useActiveWatch();
  // a chapter that belongs to one family keeps that family's copy even while the stage changes
  const fam = fixedFamily ? FAMILIES[fixedFamily] : active.family;
  const w = fixedFamily && active.def.family !== fixedFamily ? { ...active, family: fam, def: { ...active.def, specifications: [] } } : active;
  const c = fam.chapters.movement;
  useScrub(a, id, 0.55, 0.95, { opacity: 1, y: 0 }, { opacity: 0, y: -40 }, [id]);
  // the exhibit caption fades in with the explosion and leaves before the chapter does
  useScrollFn((y, vh) => {
    const el = document.getElementById(`s-${id}`);
    if (!el || !b.current) return;
    const p = (y - el.offsetTop) / vh;
    const o = smooth((p - 1.25) / 0.4) * (1 - smooth((p - 2.55) / 0.4));
    b.current.style.opacity = String(o);
    b.current.style.transform = `translateY(${24 * (1 - smooth((p - 1.25) / 0.4))}px)`;
  });
  const count = fam.exploded.length;

  return (
    <section id={`s-${id}`} className="section" style={{ height: "340vh" }} aria-labelledby={`h-${id}`}>
      <div className="sticky-view grid-12">
        <div ref={a} className="col-right">
          <SectionHead id={`h-${id}`} index={index} label={label} headline={c.headline} body={c.body} />
          <Notes items={specNotes(w, ["Movement", "Power reserve", "Calibre", "Frequency", "Jewels", "Reserve", "Edition"])} />
        </div>
        <div ref={b} className="exploded-caption" style={{ opacity: 0 }}>
          <p className="t-micro exploded-caption__top">
            <span className="t-num">{index}</span>
            <span className="section-head__rule" aria-hidden="true" />
            <span>{fam.name} · Exploded view</span>
          </p>
          <p className="t-lead exploded-caption__bottom">
            {count === 8 ? "Eleven assemblies." : "Eight assemblies."} One tolerance.
          </p>
          <dl className="exploded-legend" aria-label="Exploded view components">
            {fam.exploded.map((l) => (
              <div key={l.part} className="exploded-legend__row">
                <dt className="t-micro">{l.title}</dt>
                <dd className="t-micro">{l.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
