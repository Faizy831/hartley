"use client";
import Link from "next/link";
import { Reveal } from "@/components/animation/Reveal";
import { AccessoryCard } from "./AccessoryCard";
import { STRAP_ACCESSORIES, BOX_ACCESSORIES, ACCESSORY_COLLECTIONS } from "@/data/accessories";
import { useGo } from "@/components/ui/Nav";

/** Straps & accessories. `compact` shows one item per category (home); the full list lives on /watches. */
export function AccessoriesSection({ index, compact = false, id = "accessories" }: { index: string; compact?: boolean; id?: string }) {
  const go = useGo();
  const straps = compact ? ["strap-black-leather", "strap-black-croc", "strap-silver-mesh", "bracelet-silver", "strap-black-silicone"].map((id) => STRAP_ACCESSORIES.find((s) => s.id === id)!) : STRAP_ACCESSORIES;
  const boxes = compact ? [BOX_ACCESSORIES[0]] : BOX_ACCESSORIES;
  return (
    <section id={`s-${id}`} className="section catalog catalog--accessories interactive" data-covers-scene {...(compact ? {} : { "data-paper": true })} aria-labelledby={`h-${id}`}>
      <div className="catalog__inner gutter">
        <header className="catalog__head">
          <div>
            <Reveal as="p" mode="fade" className="section-head__label t-micro">
              <span className="t-num">{index}</span>
              <span className="section-head__rule" aria-hidden="true" />
              <span>Straps &amp; accessories</span>
            </Reveal>
            <Reveal as="h2" mode="lines" id={`h-${id}`} className="t-editorial catalog__title" text={"Interchangeable\n*by design.*"} delay={0.1} />
          </div>
          <Reveal as="div" mode="fade" className="catalog__meta" delay={0.3}>
            <p className="t-body">Twenty-millimetre interchangeable straps and bracelets for both collections, and boxes to keep them in.</p>
            {compact ? (
              <Link href="/watches#straps" className="t-label link-line" onClick={(e) => go(e, "/watches#straps")} data-cursor="hover">
                All straps &amp; accessories
              </Link>
            ) : (
              <nav className="catalog__ext" aria-label="Accessory collections on hartleywatches.com">
                {ACCESSORY_COLLECTIONS.map((c) => (
                  <a key={c.url} href={c.url} target="_blank" rel="noreferrer" className="t-micro link-line" data-cursor="hover">
                    {c.label}
                  </a>
                ))}
              </nav>
            )}
          </Reveal>
        </header>
        <div className="pgrid pgrid--accessories" role="list">
          {[...straps, ...boxes].map((item) => (
            <div role="listitem" key={item.id}>
              <AccessoryCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
