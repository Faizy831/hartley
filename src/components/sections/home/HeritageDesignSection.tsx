"use client";
import { useRef } from "react";
import { SectionHead, Notes } from "../SectionHead";
import { useScrub } from "@/hooks/useScrub";
import { FAMILIES } from "@/data/watches";

/** Heritage: the seven-millimetre profile, then the clean dial. */
export function HeritageDesignSection() {
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  useScrub(a, "heritage-design", 0.9, 1.3, { opacity: 1, y: 0 }, { opacity: 0, y: -40 });
  useScrub(b, "heritage-design", 1.25, 1.7, { opacity: 0, y: 24 }, { opacity: 1, y: 0 });
  const f = FAMILIES.heritage;
  return (
    <section id="s-heritage-design" className="section" style={{ height: "240vh" }} aria-labelledby="h-heritage-design">
      <div className="sticky-view grid-12">
        <div ref={a} className="col-right">
          <SectionHead id="h-heritage-design" index="10" label="Heritage · Design" headline={f.chapters.case.headline} body={f.chapters.case.body} />
          <Notes items={[{ k: "Diameter", v: "40 mm" }, { k: "Thickness", v: "7 mm" }, { k: "Lug width", v: "20 mm" }, { k: "Weight", v: "40 g" }]} />
        </div>
        <div ref={b} className="col-left" style={{ opacity: 0, position: "absolute", left: "var(--gutter)", right: "var(--gutter)", maxWidth: 520 }}>
          <SectionHead id="h-heritage-dial" index="10" label="Heritage · Dial" headline={f.chapters.dial.headline} body={f.chapters.dial.body} />
        </div>
      </div>
    </section>
  );
}
