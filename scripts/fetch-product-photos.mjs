/**
 * Catalog product photography — Hartley's own FRONT product photographs composed into the card asset contract.
 *
 *   node scripts/fetch-product-photos.mjs            [ONLY=slug] [REFRESH=1]
 *
 * For every Hartley product slug (scripts/slugs.mjs, minus the products without client photography) the script
 *   1. reads the public storefront record  https://int.hartleywatches.com/products/<slug>.json  (cached),
 *   2. picks that product's own FRONT image (never a lifestyle shot, never another product's image),
 *   3. downloads the 1200×1200 transparent cut-out (cached in scripts/.cache/product-photos/),
 *   4. composes it into the card contract with Chrome (Playwright): the watch's opaque bounding box is scaled to
 *      88 % of the canvas width (or 92 % of the height when taller), centred on a fully transparent 1080×1350 canvas,
 *      and encoded as WebP with alpha at quality 0.85; the 480×600 variant is the same composition scaled down,
 *   5. writes public/assets/images/products/<slug>.webp and <slug>@480.webp and the provenance manifest
 *      scripts/product-photos.json.
 *
 * Deterministic and safe to rerun: sources are cached with their first fetch date, outputs are overwritten in place,
 * and only the manifest's generation date changes on an identical rerun. The card CSS supplies the background
 * (ivory / taupe); nothing is baked into the image.
 */
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { slugs } from "./slugs.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../public/assets/images/products");
const CACHE = resolve(here, ".cache/product-photos");
const MANIFEST = resolve(here, "product-photos.json");
const STORE = "https://int.hartleywatches.com";
/** Products with no client photography (they keep the procedural render from render-thumbnails.mjs). */
const NO_PHOTO = new Set(["veloris-x1"]);
const ONLY = process.env.ONLY;
const REFRESH = process.env.REFRESH === "1";
const CANVAS = { w: 1080, h: 1350 };
const SMALL = { w: 480, h: 600 };
const FIT = { width: 0.88, height: 0.92 };
const QUALITY = 0.85;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36";

mkdirSync(OUT, { recursive: true });
mkdirSync(CACHE, { recursive: true });

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}
/** Cached JSON record + cached source PNG; the sidecar keeps the original fetch date across reruns. */
async function source(slug) {
  const recPath = resolve(CACHE, `${slug}.json`);
  if (REFRESH || !existsSync(recPath)) {
    const product = JSON.parse((await fetchBuffer(`${STORE}/products/${slug}.json`)).toString()).product;
    if (product.handle !== slug) throw new Error(`${slug}: storefront handle mismatch (${product.handle})`);
    const images = product.images ?? [];
    const front = images.find((i) => /FRONT/i.test(i.src.split("/").pop())) ?? images[0];
    if (!front) throw new Error(`${slug}: no images`);
    const family = slug.split("-")[0].toUpperCase();
    const file = front.src.split("/").pop().split("?")[0];
    if (!file.toUpperCase().startsWith(family)) throw new Error(`${slug}: front image ${file} does not belong to the ${family} family`);
    if (/WRIST|FLATLAY|BOX|GLOVE|SPLAYED|INFLUENCER|IN-HAND|LAYED/i.test(file)) throw new Error(`${slug}: ${file} is a lifestyle image`);
    const [base, query] = front.src.split("?");
    const url1200 = base.replace(/(\.[a-z]+)$/i, "_1200x$1") + (query ? `?${query}` : "");
    const png = await fetchBuffer(url1200);
    writeFileSync(resolve(CACHE, `${slug}.png`), png);
    const rec = { slug, title: product.title, sourceFile: file, sourceUrl: url1200, originalUrl: front.src, versionStamp: (query ?? "").replace(/^v=/, ""), originalSize: [front.width, front.height], position: front.position, alt: front.alt ?? "", fetchedAt: new Date().toISOString(), bytes: png.length };
    writeFileSync(recPath, JSON.stringify(rec, null, 2));
  }
  return { rec: JSON.parse(readFileSync(recPath, "utf8")), png: readFileSync(resolve(CACHE, `${slug}.png`)) };
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await browser.newContext()).newPage();
await page.setContent("<canvas id=big></canvas><canvas id=small></canvas>");
/** Compose in the browser: alpha bounding box → contain at 88 % width → transparent canvas → WebP with alpha. */
const compose = (pngBase64) =>
  page.evaluate(
    async ([data, CANVAS, SMALL, FIT, QUALITY]) => {
      const img = new Image();
      img.src = "data:image/png;base64," + data;
      await img.decode();
      const probe = document.createElement("canvas");
      probe.width = img.naturalWidth;
      probe.height = img.naturalHeight;
      const pc = probe.getContext("2d", { willReadFrequently: true });
      pc.drawImage(img, 0, 0);
      const px = pc.getImageData(0, 0, probe.width, probe.height).data;
      let x0 = probe.width, y0 = probe.height, x1 = -1, y1 = -1;
      for (let y = 0; y < probe.height; y++)
        for (let x = 0; x < probe.width; x++)
          if (px[(y * probe.width + x) * 4 + 3] > 8) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      const scale = Math.min((FIT.width * CANVAS.w) / bw, (FIT.height * CANVAS.h) / bh);
      const dw = bw * scale, dh = bh * scale;
      const dx = (CANVAS.w - dw) / 2, dy = (CANVAS.h - dh) / 2;
      const big = document.getElementById("big");
      big.width = CANVAS.w;
      big.height = CANVAS.h;
      const bc = big.getContext("2d");
      bc.clearRect(0, 0, CANVAS.w, CANVAS.h);
      bc.imageSmoothingQuality = "high";
      bc.drawImage(img, x0, y0, bw, bh, dx, dy, dw, dh);
      const small = document.getElementById("small");
      small.width = SMALL.w;
      small.height = SMALL.h;
      const sc = small.getContext("2d");
      sc.clearRect(0, 0, SMALL.w, SMALL.h);
      sc.imageSmoothingQuality = "high";
      sc.drawImage(big, 0, 0, SMALL.w, SMALL.h);
      return { bbox: [x0, y0, bw, bh], placed: [Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh)], big: big.toDataURL("image/webp", QUALITY).split(",")[1], small: small.toDataURL("image/webp", QUALITY).split(",")[1] };
    },
    [pngBase64, CANVAS, SMALL, FIT, QUALITY],
  );

const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : { products: [] };
const products = [];
for (const slug of slugs) {
  if (NO_PHOTO.has(slug)) continue;
  if (ONLY && slug !== ONLY) {
    const keep = previous.products.find((p) => p.slug === slug);
    if (keep) products.push(keep);
    continue;
  }
  const { rec, png } = await source(slug);
  const out = await compose(png.toString("base64"));
  const assets = [`${slug}.webp`, `${slug}@480.webp`];
  writeFileSync(resolve(OUT, assets[0]), Buffer.from(out.big, "base64"));
  writeFileSync(resolve(OUT, assets[1]), Buffer.from(out.small, "base64"));
  products.push({ ...rec, composition: { canvas: [CANVAS.w, CANVAS.h], fit: FIT, sourceBBox: out.bbox, placed: out.placed, format: "webp+alpha", quality: QUALITY }, assets });
  process.stdout.write(`${slug}  ←  ${rec.sourceFile}  bbox ${out.bbox.join("×")} → ${out.placed[2]}×${out.placed[3]}\n`);
}
await browser.close();
products.sort((a, b) => a.slug.localeCompare(b.slug));
writeFileSync(MANIFEST, JSON.stringify({ source: STORE, note: "Hartley FRONT product photographs (transparent cut-outs) composed into the card contract; see scripts/fetch-product-photos.mjs", generatedAt: new Date().toISOString(), products }, null, 2) + "\n");
console.log(`${products.length} products, manifest ${MANIFEST}`);
