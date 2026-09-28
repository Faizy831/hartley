import type { ResolvedWatch } from "./resolveWatch";

/** Pick specification rows by key, in the given order. Unverified values are marked with a dagger. */
export function specNotes(w: ResolvedWatch, keys: string[]) {
  const out: { k: string; v: string }[] = [];
  for (const k of keys) {
    const s = w.def.specifications.find((x) => x.k === k);
    if (s) out.push({ k: s.k, v: s.verified ? s.v : `${s.v} †` });
  }
  return out;
}

export function formatPrice(p?: { amount: number; currency: string }) {
  if (!p) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency, maximumFractionDigits: 0 }).format(p.amount);
}
