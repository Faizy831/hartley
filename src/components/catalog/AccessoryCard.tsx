"use client";
import type { Accessory } from "@/data/accessories";
import { formatPrice } from "@/lib/specs";

/** Strap / accessory card. No 3D or photography in the project: a material swatch stands in, and the card links to the client's page. */
export function AccessoryCard({ item }: { item: Accessory }) {
  const strap = item.category !== "Collector box";
  return (
    <article className="card card--accessory">
      <a className="card__link" href={item.url} target="_blank" rel="noreferrer" data-cursor="view" aria-label={`${item.name} — view on hartleywatches.com`}>
        <div className="card__media card__media--swatch">
          <span className={strap ? "swatch-strap" : "swatch-box"} style={{ ["--swatch" as string]: item.swatch }} aria-hidden="true" />
        </div>
        <p className="t-micro card__label">{item.category}</p>
        <h3 className="card__name card__name--small">{item.name}</h3>
        {item.detail && <p className="t-micro card__info">{item.detail}</p>}
        <div className="card__foot">
          <span className="card__price t-num">{formatPrice(item.price)}</span>
          <span className="t-label card__cta">Shop now</span>
        </div>
      </a>
    </article>
  );
}
