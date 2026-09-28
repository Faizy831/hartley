"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MENU_LINKS as NAV_LINKS } from "@/data/copy";
import { useStore } from "@/lib/store";
import { useGo } from "./Nav";

const ease = [0.77, 0, 0.175, 1] as const;

/** Full-screen editorial menu. */
export function Menu() {
  const open = useStore((s) => s.menuOpen);
  const setOpen = useStore((s) => s.setMenuOpen);
  const reduced = useStore((s) => s.reducedMotion);
  const first = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => first.current?.focus(), 500);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, setOpen]);

  const nav = useGo();
  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    setTimeout(() => nav({ preventDefault() {} } as React.MouseEvent<HTMLAnchorElement>, href), 350);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="site-menu"
          className="menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: reduced ? 0.01 : 0.9, ease }}
        >
          <div className="menu__inner gutter">
            <ul className="menu__list">
              {NAV_LINKS.map((l, i) => (
                <li key={l.href} className="menu__item">
                  <span className="reveal-line">
                    <motion.a
                      ref={i === 0 ? first : undefined}
                      href={l.href}
                      className="menu__link"
                      onClick={(e) => go(e, l.href)}
                      data-cursor="hover"
                      initial={{ y: "110%" }}
                      animate={{ y: "0%" }}
                      exit={{ y: "110%" }}
                      transition={{ duration: reduced ? 0.01 : 1.1, ease: [0.19, 1, 0.22, 1], delay: 0.35 + i * 0.07 }}
                    >
                      <span className="menu__index t-micro">{l.index}</span>
                      <span className="menu__label">{l.label}</span>
                    </motion.a>
                  </span>
                </li>
              ))}
            </ul>
            <motion.div
              className="menu__meta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <div>
                <p className="t-micro">Collections</p>
                <p className="t-body">Legacy · Heritage</p>
              </div>
              <div>
                <p className="t-micro">Enquiries</p>
                <a className="t-body link-line" href="https://int.hartleywatches.com/pages/contact" target="_blank" rel="noreferrer" data-cursor="hover">
                  hartleywatches.com
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
