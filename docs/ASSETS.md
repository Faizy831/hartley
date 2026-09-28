# Assets

All external assets are free to use under their stated licences. Apart from
the client's own product photography (catalog cards) and the client's own
Blender watch models (Legacy and Heritage GLBs), everything else on the site
is generated procedurally at runtime.

## External assets

| Asset | Path | Source | Licence |
| --- | --- | --- | --- |
| Studio HDRI "Studio Small 09" (1K, `.hdr`) | `public/assets/hdr/studio_small_09_1k.hdr` | [Poly Haven](https://polyhaven.com/a/studio_small_09) — download URL `https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr` | CC0 1.0 |
| Leather normal map (1K, OpenGL convention) | `public/assets/textures/leather_normal_1k.jpg` | [Poly Haven — Brown Leather](https://polyhaven.com/a/brown_leather) by Rob Tuytel — `…/brown_leather_nor_gl_1k.jpg` | CC0 1.0 |
| Leather roughness map (1K) | `public/assets/textures/leather_rough_1k.jpg` | Poly Haven — Brown Leather — `…/brown_leather_rough_1k.jpg` | CC0 1.0 |

Fonts are loaded through `next/font/google` (self-hosted at build time):

| Font | Use | Licence |
| --- | --- | --- |
| Instrument Serif (400 + italic — its only cuts) | Editorial voice: display headlines, chapter titles, leads, numerals, wordmark | SIL Open Font License 1.1 |
| Manrope (variable, 400–700 used) | Commerce voice: navigation, product names, prices, metadata, labels, buttons, specifications | SIL Open Font License 1.1 |

## Generated assets

| Asset | Where | Notes |
| --- | --- | --- |
| **Every watch** | `src/components/3d/watch/architecture.ts`, `geometry.ts` and the `watch/*.tsx` parts | Fully procedural Three.js geometry driven by each family's architecture: lathe profiles for case, bezel, rehaut, crystal and caseback (domed or flat, exhibition or solid); faceted or stick hands; gears, bridges, rotor, hairspring, front works; leather / croc / rubber / mesh straps swept along a wrist curve and an instanced three-link bracelet. No GLB is required. |
| Crocodile embossing and Milanese mesh | `watch/textures.ts → makeCrocNormal / makeMeshNormal` | Canvas height maps converted to normal maps at runtime. |
| Dial texture (sunburst, minute track, brand marks) | `watch/textures.ts → makeDialTexture` | Canvas, regenerated per dial variant. |
| Côtes de Genève and perlage | `watch/textures.ts` | Canvas. |
| Caseback engraving ring | `watch/textures.ts → makeCasebackTexture` | Canvas, text set on a circle. |
| Dust motes | `src/shaders/dust.ts` | No texture: each mote is an analytic disc with a one-pixel anti-aliased edge drawn from `gl_PointCoord`, so it stays crisp at any pixel ratio. |
| Film grain tile | `src/components/ui/Grain.tsx` | Canvas noise, 192 px, repositioned at 8 fps. |
| Open Graph image | `public/assets/images/og.jpg` | Captured from the live hero (1200 × 630). Re-capture after visual changes. |
| VELORIS X1 catalog card | `public/assets/images/products/veloris-x1.webp`, `veloris-x1@480.webp` | The only remaining render of the procedural model (`scripts/render-thumbnails.mjs`, which skips every photographed product). |

## Client product photography (catalog cards)

The 40 Hartley product cards (`public/assets/images/products/<slug>.webp` 1080 × 1350 and `<slug>@480.webp`
480 × 600, WebP with alpha, quality 0.85) are the client's own FRONT product photographs from
int.hartleywatches.com — transparent cut-outs, one per configuration, never shared and never a lifestyle
shot — composed by `scripts/fetch-product-photos.mjs` (watch contained at up to 88 % of the width / 92 % of the
height, centred, nothing baked into the background; the card CSS supplies ivory or taupe). Provenance
(source file name, CDN URL and version stamp, fetch date, composition) is in `scripts/product-photos.json`;
sources are cached in `scripts/.cache/product-photos/`. `ProductCard.tsx` keeps its slug-based paths.

## Client product data

Product names, prices, collection URLs and specifications come from
`int.hartleywatches.com` (collection and product pages, September 2026) and
live in `src/data/watches/legacy.ts` and `heritage.ts`. Anything the client
site does not state (most dial colours, case finishing, hand and index finish)
is flagged in `needsClientConfirmation` and rendered with a dagger in the UI.
The procedural models are visually representative, not measured from the
client's products.

## Dropping in a real GLB later

The scene is designed so a production model can replace the procedural watch
without touching the choreography:

1. Export the model with the same local frame: dial normal = **+Z**, 12 o'clock
   = **+Y**, crown = **+X**, case radius ≈ **1.0 world unit** (41 mm).
2. Compress it (`gltf-transform optimize model.glb model.glb --compress draco`
   or meshopt) and place it in `public/assets/models/`.
3. Load it in `src/components/3d/watch/Watch.tsx` (drei `useGLTF` with the
   Draco/Meshopt decoders) and map its nodes onto the same exploded-view
   groups (`crystal`, `bezel`, `dial`, `hands`, `case`, `movement`, `rotor`,
   `caseback`, `strapTop`, `strapBottom`) and materials from
   `watch/materials.ts` so the material lab keeps working.

## Not used on purpose

- No stock photography or video: the "editorial photograph" moment is the
  live 3D object composed inside a DOM frame (see `WatchSection`); the only
  photographs are the client's own product cut-outs on the catalog cards.
- No imagery of any other watchmaker.

## Legacy GLB (client Blender asset, not yet integrated)

`public/models/legacy/legacy-head.glb` and `public/models/legacy/straps/steel-bracelet.glb` are built from the client's `Legacy_Animation_export.blend` by `scripts/blender/legacy/build.py` (Blender 4.2 headless, works on a derived copy, never writes to the original) followed by `scripts/blender/legacy/pipeline.sh` (gltf-transform: 2K WebP textures, normal-map amplification, Draco). Build report, mapping, open questions and QA renders live in `docs/legacy-glb/`. The site still renders the procedural Legacy; integration is pending approval of the asset.
