"use client";
import { Reveal } from "@/components/animation/Reveal";
import { useStore } from "@/lib/store";
import { useActiveWatch } from "@/hooks/useActiveWatch";
import { familyOptions, resolveSibling, getWatch, watchesOf, FAMILIES, type FamilyId } from "@/data/watches";
import { STRAPS, type CaseFinishId } from "@/data/finishes";
import { OptionGroup } from "../MaterialsSection";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { formatPrice } from "@/lib/specs";
import { useGo } from "@/components/ui/Nav";

/**
 * The cinematic collection stage. One object on stage; the controls
 * transform it into the next real configuration. No grid, no cards.
 */
export function StageSection({ family, index }: { family: FamilyId; index: string }) {
  const w = useActiveWatch();
  const setActiveWatch = useStore((s) => s.setActiveWatch);
  const last = useStore((s) => s.lastByFamily[family]);
  const go = useGo();
  // the stage always shows this family's current pick, even while another family is on stage
  const current = w.def.family === family ? w.def : getWatch(last);
  const opts = familyOptions(family);
  // only straps that exist as real products with the current case colour
  const strapChoices = uniqueBy(
    watchesOf(family)
      .filter((x) => x.caseFinish === current.caseFinish)
      .map((x) => STRAPS[x.strap])
      .filter(Boolean),
    (s) => s.id,
  );
  const choose = (want: { caseFinish?: CaseFinishId; strap?: string; dial?: string }) => {
    const sib = resolveSibling(family, want, current);
    if (sib) setActiveWatch(sib.id);
  };
  const f = FAMILIES[family];
  const price = formatPrice(current.price);

  return (
    <section id={`s-${family}-stage`} className="section" style={{ height: "240vh" }} aria-labelledby={`h-${family}-stage`}>
      <div className="sticky-view grid-12">
        <div className="col-left stage">
          <Reveal as="p" mode="fade" className="section-head__label t-micro">
            <span className="t-num">{index}</span>
            <span className="section-head__rule" aria-hidden="true" />
            <span>{f.name} collection</span>
          </Reveal>
          <Reveal as="h2" mode="lines" id={`h-${family}-stage`} className="t-editorial section-head__title" text={family === "legacy" ? "Four cases.\nFive *straps.*" : "Four cases.\nLeather *or mesh.*"} delay={0.1} />

          <Reveal as="div" mode="fade" className="stage__product" delay={0.3}>
            <p className="t-label stage__name" aria-live="polite">{current.name}</p>
            <p className="t-micro stage__meta">
              {price && <span>{price}</span>}
              {current.limitedEdition && <span>Limited edition · {current.limitedEdition}</span>}
              <span>{current.type === "quartz" ? "Miyota quartz" : "Miyota automatic · 21 jewels"}</span>
            </p>
          </Reveal>

          <Reveal as="div" mode="fade" className="lab__groups interactive" delay={0.4}>
            <OptionGroup label="Case" options={opts.cases} value={current.caseFinish} onChange={(v) => choose({ caseFinish: v })} />
            {opts.dials.length > 1 && <OptionGroup label="Dial" options={opts.dials} value={current.dial} onChange={(v) => choose({ dial: v })} />}
            <OptionGroup label="Strap" options={strapChoices} value={current.strap} onChange={(v) => choose({ strap: v })} />
          </Reveal>

          <Reveal as="div" mode="fade" className="stage__actions interactive" delay={0.5}>
            <MagneticButton as="a" href={`/watch/${current.slug}`} variant="ghost" strength={0.14} radius={0.55} onNavigate={(e) => go(e, `/watch/${current.slug}`)}>
              Explore this watch
            </MagneticButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function uniqueBy<T>(arr: T[], key: (t: T) => string) {
  const seen = new Set<string>();
  return arr.filter((x) => {
    const k = key(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
