"use client";
import { useRef } from "react";
import { SectionHead, Notes } from "./SectionHead";
import { useScrub } from "@/hooks/useScrub";
import { useActiveWatch } from "@/hooks/useActiveWatch";
import { specNotes } from "@/lib/specs";

export function CraftSection() {
  const a = useRef<HTMLDivElement>(null);
  const w = useActiveWatch();
  const c = w.family.chapters.craft;
  useScrub(a, "craft", 1.15, 1.55, { opacity: 1, y: 0 }, { opacity: 0, y: -40 });
  const notes = w.def.family === "veloris"
    ? [{ k: "Anglage", v: "62 hand-chamfered edges" }, { k: "Polishing", v: "40 hours per case" }, { k: "Tolerance", v: "± 0.01 mm" }, { k: "Inspection", v: "100% · by eye and by machine" }]
    : specNotes(w, ["Water resistance", "Weight", "Warranty", "Edition"]);
  return (
    <section id="s-craft" className="section" style={{ height: "320vh" }} aria-labelledby="h-craft">
      <div className="sticky-view grid-12">
        <div ref={a} className="col-right">
          <SectionHead id="h-craft" index="07" label="The Craft" headline={c.headline} body={c.body} />
          <Notes items={notes} />
        </div>
      </div>
    </section>
  );
}
