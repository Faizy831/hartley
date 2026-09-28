import type { Metadata } from "next";
import { Suspense } from "react";
import { AllWatches } from "@/components/catalog/AllWatches";
import { AccessoriesSection } from "@/components/catalog/AccessoriesSection";
import { Footer } from "@/components/sections/Footer";
import { CatalogPage } from "@/components/catalog/CatalogPage";

export const metadata: Metadata = {
  title: "All watches",
  description: "Every Hartley Legacy and Heritage configuration, plus interchangeable straps, bracelets and collector boxes.",
};

export default function WatchesPage() {
  return (
    <CatalogPage>
      <Suspense fallback={null}>
        <AllWatches />
      </Suspense>
      <AccessoriesSection index="03" id="straps" />
      <Footer />
    </CatalogPage>
  );
}
