"use client";
import { SectionHead, Notes } from "./SectionHead";
import { useActiveWatch } from "@/hooks/useActiveWatch";
import { specNotes } from "@/lib/specs";

export function DialSection() {
  const w = useActiveWatch();
  const c = w.family.chapters.dial;
  return (
    <section id="s-dial" className="section" style={{ height: "190vh" }} aria-labelledby="h-dial">
      <div className="sticky-view grid-12">
        <div className="col-left">
          <SectionHead id="h-dial" index="04" label="The Dial" headline={c.headline} body={c.body} />
          <Notes items={specNotes(w, ["Dial", "Crystal", "Hands", "Indices"])} />
        </div>
      </div>
    </section>
  );
}
