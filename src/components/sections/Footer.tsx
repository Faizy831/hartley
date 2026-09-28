"use client";
import { useActiveWatch } from "@/hooks/useActiveWatch";
import { SITE } from "@/data/site";
import Link from "next/link";
import { useGo } from "@/components/ui/Nav";

export function Footer() {
  const w = useActiveWatch();
  const go = useGo();
  const unverified = w.def.specifications.some((s) => !s.verified) || w.def.needsClientConfirmation.length > 0;
  return (
    <footer className="footer gutter interactive" id="specifications">
      <div className="footer__specs">
        <p className="t-micro footer__specs-title">Specifications · {w.def.name}</p>
        <dl className="footer__grid">
          {w.def.specifications.map((s) => (
            <div key={s.k} className="footer__spec">
              <dt className="t-micro">{s.k}</dt>
              <dd className="t-body">
                {s.v}
                {!s.verified && " †"}
              </dd>
            </div>
          ))}
        </dl>
        {unverified && (
          <p className="t-micro footer__note">† awaiting client confirmation{w.def.needsClientConfirmation.length ? `: ${w.def.needsClientConfirmation.join(", ")}` : ""}.</p>
        )}
      </div>
      <div className="footer__bottom">
        <span className="t-brand">Hartley</span>
        <nav className="footer__links" aria-label="Footer">
          <Link href="/#s-legacy" className="t-micro link-line" data-cursor="hover" onClick={(e) => go(e, "/#s-legacy")}>Legacy</Link>
          <Link href="/#s-heritage" className="t-micro link-line" data-cursor="hover" onClick={(e) => go(e, "/#s-heritage")}>Heritage</Link>
          <Link href="/watch/veloris-x1" className="t-micro link-line" data-cursor="hover" onClick={(e) => go(e, "/watch/veloris-x1")}>X1 study</Link>
          <a href="https://int.hartleywatches.com" className="t-micro link-line" data-cursor="hover" target="_blank" rel="noreferrer">hartleywatches.com</a>
        </nav>
        <p className="t-micro footer__legal">{SITE.legal}</p>
      </div>
    </footer>
  );
}
