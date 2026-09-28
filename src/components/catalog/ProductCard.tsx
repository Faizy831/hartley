"use client";
import Link from "next/link";
import type { WatchDefinition } from "@/data/watches";
import { FAMILIES } from "@/data/watches";
import { STRAPS } from "@/data/finishes";
import { formatPrice } from "@/lib/specs";
import { useGo } from "@/components/ui/Nav";

/**
 * Editorial product card. The image is the product's own Hartley photograph
 * (transparent cut-out composed by scripts/fetch-product-photos.mjs; the X1
 * study keeps a render of its procedural model), so every card shows its own
 * configuration. The whole card opens the 3D product experience; a small
 * secondary link goes to the client's shop page.
 */
export function ProductCard({ watch, priority = false }: { watch: WatchDefinition; priority?: boolean }) {
  const go = useGo();
  const fam = FAMILIES[watch.family];
  const strap = STRAPS[watch.strap];
  const info = [strap?.label, watch.limitedEdition ? `${watch.limitedEdition}` : watch.type === "quartz" ? "7 mm slim" : "Automatic"].filter(Boolean).join(" · ");
  const href = `/watch/${watch.slug}`;
  return (
    <article className="card">
      <Link href={href} className="card__link" onClick={(e) => go(e, href)} data-cursor="explore" aria-label={`${watch.name} — explore in 3D`}>
        <div className="card__media">
          {/* WebP with alpha at two sizes (photography pipeline, or the render pipeline for the X1); the card supplies the background. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/assets/images/products/${watch.slug}@480.webp`}
            srcSet={`/assets/images/products/${watch.slug}@480.webp 480w, /assets/images/products/${watch.slug}.webp 1080w`}
            sizes="(max-width: 600px) 92vw, (max-width: 1100px) 46vw, 23vw"
            alt={`${watch.name}${watch.family === "veloris" ? ", rendered from the 3D model" : " — product photograph"}`}
            width={720}
            height={900}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="card__img"
          />
        </div>
        <p className="t-micro card__label">
          {fam.name} · {watch.type === "quartz" ? "Quartz" : "Automatic"}
        </p>
        <h3 className="card__name">{watch.name}</h3>
        <p className="t-micro card__info">{info}</p>
        <div className="card__foot">
          <span className="card__price t-num">{formatPrice(watch.price)}</span>
          <span className="t-label card__cta">Explore in 3D</span>
        </div>
      </Link>
      {watch.sourceUrl && (
        <a className="t-micro card__shop link-line" href={watch.sourceUrl} target="_blank" rel="noreferrer" data-cursor="hover">
          Shop now on hartleywatches.com
        </a>
      )}
    </article>
  );
}
