"use client";
import type { WatchDefinition } from "@/data/watches";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ watches, eager = 0 }: { watches: WatchDefinition[]; eager?: number }) {
  return (
    <div className="pgrid" role="list">
      {watches.map((w, i) => (
        <div role="listitem" key={w.id}>
          <ProductCard watch={w} priority={i < eager} />
        </div>
      ))}
    </div>
  );
}
