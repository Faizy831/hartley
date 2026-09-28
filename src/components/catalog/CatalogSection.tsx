"use client";
import Link from "next/link";
import { Reveal } from "@/components/animation/Reveal";
import { ProductGrid } from "./ProductGrid";
import { watchesOf, FAMILIES, type FamilyId } from "@/data/watches";
import { useGo } from "@/components/ui/Nav";
import { formatPrice } from "@/lib/specs";

/**
 * A real product listing for a family: normal document content, solid
 * background, fully scrollable. The scene pauses while it covers the view.
 */
export function CatalogSection({ family, index }: { family: FamilyId; index: string }) {
  const list = watchesOf(family);
  const f = FAMILIES[family];
  const go = useGo();
  const from = Math.min(...list.map((w) => w.price?.amount ?? Infinity));
  return (
    <section id={`s-${family}-catalog`} className="section catalog catalog--paper interactive" data-covers-scene data-paper aria-labelledby={`h-${family}-catalog`}>
      <div className="catalog__inner gutter">
        <header className="catalog__head">
          <div>
            <Reveal as="p" mode="fade" className="section-head__label t-micro">
              <span className="t-num">{index}</span>
              <span className="section-head__rule" aria-hidden="true" />
              <span>{f.name} catalog</span>
            </Reveal>
            <Reveal as="h2" mode="lines" id={`h-${family}-catalog`} className="t-editorial catalog__title" text={`The ${f.name}\n*collection.*`} delay={0.1} />
          </div>
          <Reveal as="div" mode="fade" className="catalog__meta" delay={0.3}>
            <p className="t-body">
              {list.length} configurations · from {formatPrice({ amount: from, currency: "USD" })}
            </p>
            <Link href={`/watches?family=${family}`} className="t-label link-line" onClick={(e) => go(e, `/watches?family=${family}`)} data-cursor="hover">
              View all watches
            </Link>
          </Reveal>
        </header>
        <ProductGrid watches={list} />
      </div>
    </section>
  );
}
