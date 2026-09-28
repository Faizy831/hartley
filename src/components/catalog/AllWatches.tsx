"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WATCHES, FAMILIES, type FamilyId } from "@/data/watches";
import { ProductGrid } from "./ProductGrid";

type Filter = "all" | FamilyId;
const TABS: { id: Filter; label: string }[] = [
  { id: "all", label: "All watches" },
  { id: "legacy", label: "Legacy" },
  { id: "heritage", label: "Heritage" },
];

export function AllWatches() {
  const params = useSearchParams();
  const initial = (params.get("family") as Filter | null) ?? "all";
  const [filter, setFilter] = useState<Filter>(TABS.some((t) => t.id === initial) ? initial : "all");
  const list = useMemo(() => WATCHES.filter((w) => w.family !== "veloris" && (filter === "all" || w.family === filter)), [filter]);
  return (
    <section id="s-all" className="section catalog interactive catalog--page" data-covers-scene data-paper aria-labelledby="h-all">
      <div className="catalog__inner gutter">
        <header className="catalog__head catalog__head--page">
          <div>
            <p className="section-head__label t-micro">
              <span className="t-num">01</span>
              <span className="section-head__rule" aria-hidden="true" />
              <span>Catalog</span>
            </p>
            <h1 id="h-all" className="t-editorial catalog__title">
              {filter === "all" ? "Every Hartley watch." : `The ${FAMILIES[filter].name} collection.`}
            </h1>
          </div>
          <div className="catalog__meta">
            <div className="tabs" role="tablist" aria-label="Filter by collection">
              {TABS.map((t) => (
                <button key={t.id} type="button" role="tab" aria-selected={filter === t.id} className={`tab t-label ${filter === t.id ? "is-active" : ""}`} onClick={() => setFilter(t.id)} data-cursor="hover">
                  {t.label}
                </button>
              ))}
            </div>
            <p className="t-body">{list.length} configurations</p>
          </div>
        </header>
        <ProductGrid watches={list} eager={4} />
      </div>
    </section>
  );
}
