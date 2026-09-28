"use client";
import { SectionHead, Notes } from "./SectionHead";
import { useActiveWatch } from "@/hooks/useActiveWatch";
import { specNotes } from "@/lib/specs";

export function CaseSection() {
  const w = useActiveWatch();
  const c = w.family.chapters.case;
  return (
    <section id="s-case" className="section" style={{ height: "190vh" }} aria-labelledby="h-case">
      <div className="sticky-view grid-12">
        <div className="col-left">
          <SectionHead id="h-case" index="03" label="The Case" headline={c.headline} body={c.body} />
          <Notes items={specNotes(w, ["Case", "Diameter", "Thickness", "Lug width", "Height", "Finish"])} />
        </div>
      </div>
    </section>
  );
}
