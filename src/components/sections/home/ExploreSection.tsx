"use client";
import { Reveal } from "@/components/animation/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useStore } from "@/lib/store";
import { getWatch, FAMILIES } from "@/data/watches";
import { useGo } from "@/components/ui/Nav";
import { formatPrice } from "@/lib/specs";

/** The close: two doors into the two collections, each holding the visitor's last pick. */
export function ExploreSection() {
  const last = useStore((s) => s.lastByFamily);
  const go = useGo();
  return (
    <section id="s-explore" className="section" style={{ height: "150vh" }} aria-labelledby="h-explore">
      <div className="sticky-view cta">
        <div className="cta__body">
          <Reveal as="p" mode="fade" className="t-micro cta__eyebrow">
            Explore the collection
          </Reveal>
          <Reveal as="h2" mode="lines" id="h-explore" className="t-display cta__title" text={"Choose your time."} delay={0.1} />
          <Reveal as="div" mode="fade" className="doors interactive" delay={0.4}>
            {(["legacy", "heritage"] as const).map((id) => {
              const w = getWatch(last[id]);
              return (
                <a key={id} href={`/watch/${w.slug}`} className="door" onClick={(e) => go(e, `/watch/${w.slug}`)} data-cursor="explore">
                  <span className="t-micro door__kicker">{FAMILIES[id].name} · {FAMILIES[id].tagline}</span>
                  <span className="door__name t-lead">{w.name}</span>
                  <span className="t-micro door__price">{formatPrice(w.price)}</span>
                </a>
              );
            })}
          </Reveal>
          <Reveal as="div" mode="fade" className="cta__actions interactive" delay={0.6}>
            <MagneticButton variant="solid" as="a" href="https://int.hartleywatches.com">
              hartleywatches.com
            </MagneticButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
