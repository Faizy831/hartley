import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WATCHES, findWatch, FAMILIES } from "@/data/watches";
import { SITE } from "@/data/site";
import { StageWatch } from "@/components/StageWatch";
import { Hero } from "@/components/sections/Hero";
import { ObjectSection } from "@/components/sections/ObjectSection";
import { CaseSection } from "@/components/sections/CaseSection";
import { DialSection } from "@/components/sections/DialSection";
import { MovementSection } from "@/components/sections/MovementSection";
import { MaterialsSection } from "@/components/sections/MaterialsSection";
import { CraftSection } from "@/components/sections/CraftSection";
import { WatchSection } from "@/components/sections/WatchSection";
import { CollectionSection } from "@/components/sections/CollectionSection";
import { Footer } from "@/components/sections/Footer";

export function generateStaticParams() {
  return WATCHES.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const w = findWatch(slug);
  if (!w) return {};
  const fam = FAMILIES[w.family];
  return { title: w.name, description: `${w.name} — ${fam.intro}`, alternates: { canonical: `${SITE.url}/watch/${w.slug}` } };
}

export default async function WatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = findWatch(slug);
  if (!w) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: w.name,
    brand: { "@type": "Brand", name: w.family === "veloris" ? "Veloris" : "Hartley Watches" },
    ...(w.price ? { offers: { "@type": "Offer", priceCurrency: w.price.currency, price: String(w.price.amount), url: w.sourceUrl ?? `${SITE.url}/watch/${w.slug}` } } : {}),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <StageWatch id={w.id} />
      <Hero />
      <ObjectSection />
      <CaseSection />
      <DialSection />
      <MovementSection />
      <MaterialsSection />
      <CraftSection />
      <WatchSection index="08" />
      <CollectionSection />
      <Footer />
    </>
  );
}
