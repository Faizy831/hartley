"use client";
import { Reveal } from "@/components/animation/Reveal";

export function SectionHead({ index, label, headline, body, id }: { index: string; label: string; headline: string; body?: string; id: string }) {
  return (
    <div className="section-head">
      <Reveal as="p" mode="fade" className="section-head__label t-micro">
        <span className="t-num">{index}</span>
        <span className="section-head__rule" aria-hidden="true" />
        <span>{label}</span>
      </Reveal>
      <Reveal as="h2" mode="lines" text={headline} className="t-editorial section-head__title" id={id} delay={0.1} />
      {body && <Reveal as="p" mode="fade" className="t-body section-head__body" delay={0.35}>{body}</Reveal>}
    </div>
  );
}

export function Notes({ items, delay = 0.45 }: { items: { k: string; v: string }[]; delay?: number }) {
  return (
    <Reveal as="dl" mode="fade" className="notes" delay={delay}>
      {items.map((n) => (
        <div className="notes__row" key={n.k}>
          <dt className="t-micro">{n.k}</dt>
          <dd className="t-body">{n.v}</dd>
        </div>
      ))}
    </Reveal>
  );
}
