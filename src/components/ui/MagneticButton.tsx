"use client";
import { useEffect, useRef, type ReactNode, type ComponentPropsWithoutRef } from "react";
import { gsap } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { onPointerFrame, pointer } from "@/lib/pointer";

type Props = ComponentPropsWithoutRef<"button"> & {
  as?: "button" | "a";
  href?: string;
  onNavigate?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
  variant?: "solid" | "ghost" | "text";
  strength?: number;
  /** Attraction radius as a multiple of the button's larger dimension. */
  radius?: number;
};

/**
 * Magnetic button: the whole control drifts toward the pointer inside a
 * small radius, the label drifts a little less — a physical, quiet feel.
 */
export function MagneticButton({ as = "button", href, onNavigate, children, variant = "ghost", strength = 0.32, radius: radiusMul = 0.9, className = "", ...rest }: Props) {
  const root = useRef<HTMLElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const isTouch = useStore((s) => s.isTouch);
  const reduced = useStore((s) => s.reducedMotion);

  useEffect(() => {
    const el = root.current;
    const label = inner.current;
    if (!el || !label || isTouch || reduced) return;
    const x = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
    const lx = gsap.quickTo(label, "x", { duration: 0.35, ease: "power3.out" });
    const ly = gsap.quickTo(label, "y", { duration: 0.35, ease: "power3.out" });
    // The button's rectangle is read once and kept until the page scrolls or resizes, so pointer motion
    // costs no layout reads; the attraction itself runs once per frame from the shared pointer.
    let rect: DOMRect | null = null;
    const invalidate = () => {
      rect = null;
    };
    let near = false;
    const stop = onPointerFrame((px, py) => {
      if (!rect) rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = px - cx;
      const dy = py - cy;
      const radius = Math.max(rect.width, rect.height) * radiusMul;
      const inside = pointer.inside && Math.hypot(dx, dy) < radius;
      if (inside) {
        near = true;
        x(dx * strength);
        y(dy * strength);
        lx(dx * strength * 0.45);
        ly(dy * strength * 0.45);
      } else if (near) {
        near = false;
        x(0);
        y(0);
        lx(0);
        ly(0);
      }
    });
    const onLeave = () => {
      near = false;
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.5)" });
      gsap.to(label, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.5)" });
    };
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate);
    return () => {
      stop();
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
    };
  }, [isTouch, reduced, strength, radiusMul]);

  const cls = `btn btn--${variant} ${className}`;
  const content = (
    <span ref={inner} className="btn__inner">
      <span className="btn__label t-label">{children}</span>
    </span>
  );
  if (as === "a") {
    return (
      <a ref={root as React.RefObject<HTMLAnchorElement>} href={href} className={cls} data-cursor="hover" onClick={onNavigate}>
        {content}
      </a>
    );
  }
  return (
    <button ref={root as React.RefObject<HTMLButtonElement>} className={cls} data-cursor="hover" {...rest}>
      {content}
    </button>
  );
}
