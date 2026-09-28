/**
 * Render a procedural product thumbnail from the live 3D model — only for products that have no client
 * photography (today: the VELORIS X1). Every product listed in scripts/product-photos.json is served by
 * Hartley's own photograph (scripts/fetch-product-photos.mjs) and is skipped here so a rerun can never
 * overwrite a photographic asset; pass RENDER_PHOTO_SLUGS=1 to override on purpose.
 *
 *   npm run build && npm start            (in another terminal, port 3000)
 *   node scripts/render-thumbnails.mjs    [BASE_URL=http://localhost:3000] [ONLY=slug]
 *
 * Each page is opened in thumbnail mode (?thumb=1): fixed pose, neutral
 * light, no chrome, no motion. The capture is encoded to WebP in-browser.
 * Requires Google Chrome (Playwright `channel: "chrome"`).
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../public/assets/images/products");
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || "http://localhost:3000";
const ONLY = process.env.ONLY;

// slugs from the data layer (read the built module list via a tiny page fetch is overkill — import the TS through tsx isn't installed; keep a generated list)
const { slugs } = await import("./slugs.mjs");
const manifest = resolve(here, "product-photos.json");
const photographed = new Set(existsSync(manifest) ? JSON.parse(readFileSync(manifest, "utf8")).products.map((p) => p.slug) : []);
const targets = slugs.filter((s) => process.env.RENDER_PHOTO_SLUGS === "1" || !photographed.has(s));
if (targets.length === 0) {
  console.log("nothing to render: every product has a photographic asset (scripts/product-photos.json)");
  process.exit(0);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 720, height: 900 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
const encoder = await ctx.newPage();
await encoder.setContent("<canvas id=c></canvas>");

for (const slug of targets) {
  if (ONLY && slug !== ONLY) continue;
  await page.goto(`${BASE}/watch/${slug}?thumb=1&quality=high`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.classList.contains("thumb-ready"), null, { timeout: 60000 });
  await page.waitForTimeout(700);
  const png = await page.screenshot({ type: "png" });
  const b64 = png.toString("base64");
  for (const [w, h, suffix] of [[1080, 1350, ""], [480, 600, "@480"]]) {
    const webp = await encoder.evaluate(
      async ([data, w, h]) => {
        const img = new Image();
        img.src = "data:image/png;base64," + data;
        await img.decode();
        const c = document.getElementById("c");
        c.width = w;
        c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        return c.toDataURL("image/webp", 0.86).split(",")[1];
      },
      [b64, w, h],
    );
    writeFileSync(resolve(OUT, `${slug}${suffix}.webp`), Buffer.from(webp, "base64"));
  }
  process.stdout.write(slug + "\n");
}
await browser.close();
