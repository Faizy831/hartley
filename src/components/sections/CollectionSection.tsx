"use client";
import { Reveal } from "@/components/animation/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useStore } from "@/lib/store";
import { useActiveWatch } from "@/hooks/useActiveWatch";
import { CASE_FINISHES, type CaseFinishId } from "@/data/finishes";
import { familyOptions, resolveSibling } from "@/data/watches";
import { formatPrice } from "@/lib/specs";
import Link from "next/link";
import { useGo } from "@/components/ui/Nav";

/** Product-detail close: the object above, the decision below. */
export function CollectionSection() {
  const w = useActiveWatch();
  const setActiveWatch = useStore((s) => s.setActiveWatch);
  const setOverride = useStore((s) => s.setOverride);
  const go = useGo();
  const isStudy = w.def.family === "veloris";
  const cases = isStudy ? (["brushed", "titanium", "rosegold"] as CaseFinishId[]).map((id) => CASE_FINISHES[id]) : familyOptions(w.def.family).cases;
  const pick = (id: CaseFinishId) => {
    if (isStudy) return setOverride({ caseFinish: id });
    const sib = resolveSibling(w.def.family, { caseFinish: id }, w.def);
    if (sib) setActiveWatch(sib.id);
  };
  const price = formatPrice(w.def.price);

  return (
    <section id="s-collection" className="section" style={{ height: "150vh" }} aria-labelledby="h-collection">
      <div className="sticky-view cta">
        <div className="cta__body">
          <Reveal as="p" mode="fade" className="t-micro cta__eyebrow">
            {w.family.name} · {w.def.limitedEdition ? `Limited edition ${w.def.limitedEdition}` : w.def.type === "quartz" ? "Quartz" : "Automatic"}
          </Reveal>
          <Reveal as="h2" mode="lines" id="h-collection" className="t-display cta__title" text={w.def.shortName} delay={0.1} />
          <Reveal as="p" mode="fade" className="t-lead cta__sub" delay={0.3}>
            {w.def.name}
          </Reveal>
          <Reveal as="div" mode="fade" className="cta__finishes interactive" delay={0.45}>
            {cases.map((f) => (
              <button key={f.id} type="button" className={`cta__finish t-label ${w.caseFinish.id === f.id ? "is-active" : ""}`} onClick={() => pick(f.id)} data-cursor="explore" aria-pressed={w.caseFinish.id === f.id}>
                {f.label}
              </button>
            ))}
          </Reveal>
          <Reveal as="div" mode="fade" className="cta__actions interactive" delay={0.6}>
            {w.def.sourceUrl ? (
              <MagneticButton variant="solid" as="a" href={w.def.sourceUrl}>
                View on hartleywatches.com
              </MagneticButton>
            ) : (
              <MagneticButton variant="solid" as="a" href="mailto:atelier@veloris.example?subject=Reserve%20the%20X1">
                Reserve the X1
              </MagneticButton>
            )}
            <Link href="/#s-explore" className="t-label link-line cta__secondary" data-cursor="hover" onClick={(e) => go(e, "/#s-explore")}>
              Back to the collection
            </Link>
          </Reveal>
          {price && (
            <Reveal as="p" mode="fade" className="t-micro cta__price" delay={0.7}>
              {price} · as listed by Hartley Watches
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
