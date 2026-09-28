import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import "./globals.css";
import { SITE } from "@/data/site";
import { Experience } from "@/components/Experience";

// Editorial voice: Instrument Serif (regular + italic only — it has no other cuts).
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-display", display: "swap" });
// Commerce / UI voice: Manrope, variable — only the 400–700 range is used.
const ui = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-ui", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Hartley Watches — Legacy & Heritage", template: "%s — Hartley Watches" },
  description: SITE.description,
  keywords: ["Hartley Watches", "Legacy automatic", "Heritage quartz", "minimalist watch", "mechanical watch", "sapphire crystal"],
  openGraph: { type: "website", url: SITE.url, siteName: "Hartley Watches", title: "Hartley Watches — Legacy & Heritage", description: SITE.description, images: [{ url: "/assets/images/og.jpg", width: 1200, height: 630, alt: "Hartley Legacy automatic watch" }] },
  twitter: { card: "summary_large_image", title: "Hartley Watches — Legacy & Heritage", description: SITE.description, images: ["/assets/images/og.jpg"] },
  alternates: { canonical: SITE.url },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#11100e", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable}`}>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject attributes on <body> before hydration */}
      <body suppressHydrationWarning>
        <Experience>{children}</Experience>
      </body>
    </html>
  );
}
