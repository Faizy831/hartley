"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_LINKS } from "@/data/copy";
import { useStore } from "@/lib/store";
import { scrollTo } from "@/components/animation/SmoothScroll";
import { navIntent } from "@/components/animation/ScrollChoreography";
import { MagneticButton } from "./MagneticButton";

/** Navigate to `/#s-xxx` style targets: scroll if the chapter is on this page, otherwise route home and land on it. */
export function useGo() {
  const router = useRouter();
  const pathname = usePathname();
  const setMenuOpen = useStore((s) => s.setMenuOpen);
  return (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    const hash = href.includes("#") ? "#" + href.split("#")[1] : null;
    const path = href.split("#")[0] || "/";
    const onPage = path === pathname || (path === "/" && pathname === "/");
    if (hash && onPage && document.querySelector(hash)) {
      setTimeout(() => scrollTo(hash, 0), 50);
      return;
    }
    navIntent.hash = hash;
    router.push(path);
  };
}

export function Nav() {
  const menuOpen = useStore((s) => s.menuOpen);
  const setMenuOpen = useStore((s) => s.setMenuOpen);
  const introDone = useStore((s) => s.introDone);
  const [scrolled, setScrolled] = useState(false);
  const section = useStore((s) => s.section);
  const pathname = usePathname();
  const go = useGo();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // the chapter the reader is in, marked on the header: the story's families on the home page, the catalog on /watches
  const active = pathname.startsWith("/watches") ? "/watches" : pathname === "/" && (section.startsWith("legacy") || section.startsWith("heritage")) ? `/#s-${section.split("-")[0]}` : null;

  return (
    <header className={`nav ${scrolled ? "nav--scrolled" : ""} ${introDone ? "nav--ready" : ""} ${menuOpen ? "nav--menu-open" : ""}`}>
      <Link href="/#s-hero" className="nav__brand t-brand" onClick={(e) => go(e, "/#s-hero")} data-intro="brand" data-cursor="hover" aria-label="Hartley — home">
        Hartley
      </Link>
      <nav className="nav__links" aria-label="Primary">
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} className={`nav__link t-label link-line${l.href === active ? " nav__link--active" : ""}`} aria-current={l.href === active ? "location" : undefined} onClick={(e) => go(e, l.href)} data-cursor="hover">
            {l.label}
          </a>
        ))}
      </nav>
      <div className="nav__right">
        <MagneticButton as="a" href="/#s-explore" variant="ghost" className="nav__cta" strength={0.14} onNavigate={(e) => go(e, "/#s-explore")}>
          Explore
        </MagneticButton>
        <button type="button" className="nav__menu" aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen(!menuOpen)} data-cursor="hover">
          <span className="t-label">{menuOpen ? "Close" : "Menu"}</span>
          <span className="nav__burger" aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
      </div>
    </header>
  );
}
