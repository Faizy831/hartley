"use client";
import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";

/** Wrapper for pages that are pure catalog: the scene stays paused and the chapter indicator is hidden. */
export function CatalogPage({ children }: { children: ReactNode }) {
  const setCovered = useStore((s) => s.setSceneCovered);
  useEffect(() => {
    document.documentElement.toggleAttribute("data-catalog", true);
    setCovered(true);
    return () => {
      document.documentElement.toggleAttribute("data-catalog", false);
      setCovered(false);
    };
  }, [setCovered]);
  return <div className="catalog-page">{children}</div>;
}
