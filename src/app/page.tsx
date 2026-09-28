import { HomeHero } from "@/components/sections/home/HomeHero";
import { DiscoverSection } from "@/components/sections/home/DiscoverSection";
import { FamilyChapter } from "@/components/sections/home/FamilyChapter";
import { StageSection } from "@/components/sections/home/StageSection";
import { LegacyCraftSection } from "@/components/sections/home/LegacyCraftSection";
import { HeritageDesignSection } from "@/components/sections/home/HeritageDesignSection";
import { ExploreSection } from "@/components/sections/home/ExploreSection";
import { WatchSection } from "@/components/sections/WatchSection";
import { Footer } from "@/components/sections/Footer";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { AccessoriesSection } from "@/components/catalog/AccessoriesSection";
import { StageWatch } from "@/components/StageWatch";
import { DEFAULT_WATCH } from "@/data/watches";
import { SITE } from "@/data/site";

const jsonLd = { "@context": "https://schema.org", "@type": "Organization", name: "Hartley Watches", url: SITE.url };

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <StageWatch id={DEFAULT_WATCH.id} />
      <HomeHero />
      <DiscoverSection />
      <FamilyChapter family="legacy" index="03" />
      <StageSection family="legacy" index="04" />
      <CatalogSection family="legacy" index="05" />
      <LegacyCraftSection />
      <FamilyChapter family="heritage" index="07" />
      <StageSection family="heritage" index="08" />
      <CatalogSection family="heritage" index="09" />
      <HeritageDesignSection />
      <AccessoriesSection index="11" compact />
      <WatchSection index="12" />
      <ExploreSection />
      <Footer />
    </>
  );
}
