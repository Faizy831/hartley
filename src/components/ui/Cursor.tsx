"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useStore, type CursorState } from "@/lib/store";

const LABELS: Partial<Record<CursorState, string>> = {
  rotate: "Rotate",
  explore: "Explore",
  view: "View",
  menu: "Close",
  drag: "",
};

/**
 * A quiet custom cursor: a 5px dot that tracks the pointer and a ring that
 * lags behind it. It grows and takes on a label for interactive states.
 * Desktop only — never rendered on coarse pointers.
 */
export function Cursor() {
  const isTouch = useStore((s) => s.isTouch);
  const state = useStore((s) => s.cursor);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isTouch || !dot.current || !ring.current) return;
    document.body.classList.add("cursor-custom");
    // The dot is effectively on the pointer (a frame of smoothing); the ring follows a beat behind, no more.
    const dx = gsap.quickTo(dot.current, "x", { duration: 0.05, ease: "power3.out" });
    const dy = gsap.quickTo(dot.current, "y", { duration: 0.05, ease: "power3.out" });
    const rx = gsap.quickTo(ring.current, "x", { duration: 0.16, ease: "power3.out" });
    const ry = gsap.quickTo(ring.current, "y", { duration: 0.16, ease: "power3.out" });
    let shown = false;
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY });
        gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.6 });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };
    const onLeave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.4 });
    const onEnter = () => shown && gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.4 });

    // interactive DOM targets
    const onOver = (e: PointerEvent) => {
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]");
      const st = useStore.getState();
      if (t) st.setCursor((t.dataset.cursor as CursorState) || "hover");
      else if (st.cursor !== "rotate" && st.cursor !== "drag") st.setCursor("default");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    return () => {
      document.body.classList.remove("cursor-custom");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, [isTouch]);

  useEffect(() => {
    if (label.current) label.current.textContent = LABELS[state] ?? "";
  }, [state]);

  if (isTouch) return null;
  return (
    <div className="cursor" data-state={state} aria-hidden="true">
      <div ref={dot} className="cursor__dot">
        <i aria-hidden="true" />
      </div>
      <div ref={ring} className="cursor__ring">
        <span ref={label} className="cursor__label t-micro" />
      </div>
    </div>
  );
}
