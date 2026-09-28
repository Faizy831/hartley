"use client";
import { SectionHead } from "./SectionHead";
import { Reveal } from "@/components/animation/Reveal";
import { useStore } from "@/lib/store";
import { useActiveWatch } from "@/hooks/useActiveWatch";
import { CASE_FINISHES, DIALS, STRAPS, type CaseFinishId } from "@/data/finishes";
import { familyOptions, resolveSibling } from "@/data/watches";

export function OptionGroup<T extends string>({ label, options, value, onChange }: { label: string; options: { id: T; label: string; swatch: string }[]; value: T; onChange: (v: T) => void }) {
  const current = options.find((o) => o.id === value);
  return (
    <div className="lab__group" role="radiogroup" aria-label={label}>
      <div className="lab__head">
        <span className="t-micro">{label}</span>
        <span className="t-body lab__current" aria-live="polite">
          {current?.label}
        </span>
      </div>
      <div className="lab__options">
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={o.id === value} aria-label={o.label} className="swatch" style={{ ["--swatch" as string]: o.swatch }} onClick={() => onChange(o.id)} data-cursor="hover" />
        ))}
      </div>
    </div>
  );
}

/**
 * Material lab. For Hartley products every choice maps to a real sibling
 * configuration; for the X1 study the choices are visual overrides.
 */
export function MaterialsSection() {
  const w = useActiveWatch();
  const setOverride = useStore((s) => s.setOverride);
  const setActiveWatch = useStore((s) => s.setActiveWatch);
  const isStudy = w.def.family === "veloris";
  const opts = isStudy
    ? { cases: (["polished", "brushed", "titanium", "rosegold"] as CaseFinishId[]).map((id) => CASE_FINISHES[id]), dials: ["obsidian", "ivory", "midnight"].map((id) => DIALS[id]), straps: ["leather-black", "leather-brown", "rubber-black"].map((id) => STRAPS[id]) }
    : familyOptions(w.def.family);

  const choose = (want: { caseFinish?: CaseFinishId; dial?: string; strap?: string }) => {
    if (isStudy) return setOverride(want);
    const sib = resolveSibling(w.def.family, want, w.def);
    if (sib) setActiveWatch(sib.id);
  };
  const c = isStudy ? { headline: "Choose the metal.\nKeep the *mechanism.*", body: "Four case finishes, three dials, three straps. Every combination is built to the same tolerance and signed by the same hands." } : { headline: "Choose the case.\nChoose the *strap.*", body: `Every ${w.family.name} configuration shown here is a real Hartley product. Change the case colour or the strap and the object on stage becomes that watch.` };

  return (
    <section id="s-materials" className="section" style={{ height: "200vh" }} aria-labelledby="h-materials">
      <div className="sticky-view grid-12">
        <div className="col-left lab">
          <SectionHead id="h-materials" index="06" label="The Materials" headline={c.headline} body={c.body} />
          <Reveal as="div" mode="fade" className="lab__groups interactive" delay={0.4}>
            <OptionGroup label="Case" options={opts.cases} value={w.caseFinish.id} onChange={(v) => choose({ caseFinish: v })} />
            {opts.dials.length > 1 && <OptionGroup label="Dial" options={opts.dials} value={w.dial.id} onChange={(v) => choose({ dial: v })} />}
            <OptionGroup label="Strap" options={opts.straps} value={w.strap.id} onChange={(v) => choose({ strap: v })} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
