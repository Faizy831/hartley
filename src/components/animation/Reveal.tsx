"use client";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useStore } from "@/lib/store";

type Mode = "lines" | "words" | "fade";

interface RevealProps {
  as?: "div" | "p" | "h1" | "h2" | "h3" | "ul" | "dl" | "span";
  className?: string;
  mode?: Mode;
  /** For lines/words: the text. Use "\n" for line breaks and *asterisks* for italics. */
  text?: string;
  children?: ReactNode;
  delay?: number;
  start?: string;
  id?: string;
}

function renderInline(s: string) {
  const parts = s.split(/(\*[^*]+\*)/g).filter(Boolean);
  return parts.map((p, i) => (p.startsWith("*") ? <em key={i}>{p.slice(1, -1)}</em> : <span key={i}>{p}</span>));
}

/**
 * Scroll-triggered reveal. Lines and words are masked and slide up with a
 * long, decelerating ease; nothing bounces. Plays once.
 */
export function Reveal({ as = "div", className, mode = "lines", text = "", children, delay = 0, start = "top 86%", id }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useStore((s) => s.reducedMotion);

  const content = useMemo(() => {
    if (mode === "fade") return children;
    if (mode === "lines") {
      return text.split("\n").map((line, i) => (
        <span className="reveal-line" key={i}>
          <span>{renderInline(line)}</span>
        </span>
      ));
    }
    return text.split("\n").map((line, li) => (
      <span key={li} className="reveal-words">
        {line.split(" ").map((w, wi) => (
          <span className="reveal-word" key={wi}>
            <span>{renderInline(w)}</span>
            {wi < line.split(" ").length - 1 ? " " : ""}
          </span>
        ))}
        {li < text.split("\n").length - 1 && <br />}
      </span>
    ));
  }, [mode, text, children]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = mode === "fade" ? [el] : Array.from(el.querySelectorAll<HTMLElement>(mode === "lines" ? ".reveal-line > span" : ".reveal-word > span"));
    if (reduced) {
      gsap.set(targets, { opacity: 0 });
      const st = ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => gsap.to(targets, { opacity: 1, duration: 0.9, stagger: 0.03, delay }) });
      return () => st.kill();
    }
    gsap.set(targets, mode === "fade" ? { opacity: 0, y: 26 } : { yPercent: 110, opacity: 1 });
    const st = ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: () =>
        gsap.to(targets, {
          yPercent: 0,
          y: 0,
          opacity: 1,
          duration: mode === "fade" ? 1.3 : 1.5,
          ease: "power4.out",
          stagger: mode === "words" ? 0.028 : 0.11,
          delay,
        }),
    });
    return () => st.kill();
  }, [mode, reduced, start, delay, text]);

  const Tag = as as "div";
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={className} id={id}>
      {content}
    </Tag>
  );
}
