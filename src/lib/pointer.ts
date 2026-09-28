"use client";
import { gsap } from "@/lib/gsap";

/**
 * One authoritative pointer. A single passive listener stores the latest position; consumers run
 * once per frame on GSAP's ticker, and only on frames where the pointer actually moved. Nothing
 * here touches React: continuously changing coordinates never become state.
 */
export const pointer = { x: -1, y: -1, moved: false, inside: false };

type Consumer = (x: number, y: number) => void;
const consumers = new Set<Consumer>();
let bound = false;

function onMove(e: PointerEvent) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.moved = true;
  pointer.inside = true;
}
function onLeave() {
  pointer.inside = false;
  pointer.moved = true;
}
function tick() {
  if (!pointer.moved) return;
  pointer.moved = false;
  consumers.forEach((c) => c(pointer.x, pointer.y));
}

/** Run `fn` once per frame while the pointer is moving. Returns the unsubscribe. */
export function onPointerFrame(fn: Consumer) {
  consumers.add(fn);
  if (!bound && typeof window !== "undefined") {
    bound = true;
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    gsap.ticker.add(tick);
  }
  return () => {
    consumers.delete(fn);
  };
}
