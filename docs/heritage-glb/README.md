# Heritage GLB build (client Blender asset → web) — 2026-09-28

Source: `Heritage_Animation_export.blend` (read-only, Blender 4.1.23, 2.78 GB; inspection in `inspection.md`).
Built with Blender 4.2.9 headless via `scripts/blender/heritage/build.py`, then `scripts/blender/heritage/pipeline.sh`
(gltf-transform). **Standalone asset — not integrated into the site.** The procedural Heritage remains the site's renderer
and the fallback.

## Outputs

| file | size | triangles | primitives (draw calls) | materials | textures | animations |
|---|---|---|---|---|---|---|
| `public/models/heritage/heritage-head.glb` | 1.48 MB | 14,840 | 16 | 12 | 11 | 1 (`HeritageSeconds`, 60 s) |
| `public/models/heritage/straps/leather-black.glb` | 1.34 MB | 88,632 | 8 | 7 | 10 | 0 |
| `public/models/heritage/straps/mesh-silver.glb` | 1.27 MB | 251,051 | 8 | 3 | 5 | 0 |

Khronos validator: 0 errors on all three (warnings only for runtime-generated tangent space, which three.js provides).
No cameras, lights, presentation choreography, hidden objects or excluded collections are exported.

## Hierarchy (head)

```
HeritageWatch                       root: scale 1.4954 + centring only (rotation identity); every child frame has the dial normal on +Z, 12 o'clock +Y, crown +X (the Legacy convention)
  Case            web_Case_Polished         6,628 tris  case + lugs + bezel (one connected surface in the source, slot 0)
  Crown           web_Crown_Polished        1,682       crown body (slot 3, +X)
  Crown_Tip       web_Case_Brushed          1,156       brushed crown face (slot 2, +X)
  Caseback        web_Caseback              1,430       solid steel, radial brushing + engraved text (slot 1), baked
  Caseback_Ring   web_Case_Brushed            282       caseback side wall (slot 2) + the 12-face notch of slot 1
  Crystal         web_Crystal / _Edge         752       flat top & underside discs (IOR 1.008 slot) + bevelled rim (IOR 1.1 slot)
  Dial            web_Dial_White              376       white dial, baked (colour, metallic+roughness, normal)
  Dial_Black      web_Dial_Black              376       black dial twin (same geometry; show one per dial colour)
  Rehaut          web_Rehaut_White            504       chapter-ring wall (white)
  Rehaut_Black    web_Rehaut_Black            504       black twin
  Indices         web_Indices                 624       12 applied markers + 5 small pieces (slot 3 loose parts)
  Hands
    Hands_Post    web_Indices                 142       centre post
    Hour          web_Hands                    54       pivot on the axis, rotation 0 = 12 o'clock
    Minute        web_Hands                    54
    SecondsPivot                                        animated (HeritageSeconds)
      Second      web_Hands                   276       Solidify applied
```

Finish roles (unchanged from Legacy, see `roleOf` in `GLBWatch.tsx`): `Case_*`/`Crown_*` → case, `Bracelet_*` → bracelet,
`Indices`/`Hands` → furniture; dial, rehaut, caseback text and glass are never tinted. The five client variants map to:
silver+white → none; gold+white → gold tint; rose gold + white/black → rosegold tint; black+black → black case/bracelet,
silver indices and hands (as in the client file). Dial colour = `Dial`/`Rehaut` vs `Dial_Black`/`Rehaut_Black` visibility.
Tints are the client's own Mix constants (gold 0.558/0.426/0.168, rose gold 0.694/0.413/0.323, black 0.081) — identical
to the Legacy values in `MODELS.legacy.finishTints`.

## Glass classification (geometric, not by name)

Mesh-local Z is the dial normal. Hands top at z = 0.0145, dial face at z = −0.0214, case z range −0.2151 … 0.0416.
- `x Glass: Clear IOR1.008` — 128 faces, z 0.0275 … 0.0416 (above the hands): the flat underside disc (127 faces, normal −Z) and
  the single top face (normal +Z). → **front crystal**.
- `x Glass: Clear IOR1.1` — 126 faces, same z range, mean normal (0, 0, 0.73), radius 0.60 … 0.62: the bevelled rim between
  the two discs. → **front crystal edge**.
- There is **no caseback glass**. The rear is slot 1 (`Radial002_2K_TEXT`, 780 faces at z = −0.2114, normal −Z): solid steel
  with radial brushing and the engraved "HARTLEY · 316L STAINLESS STEEL CASE · WATER RESISTANT 3ATM" mask. Matches the
  product data ("solid back").

Both crystal primitives carry transmission in the file (as Legacy does) so the runtime can choose; the approved runtime mode
is the thin transparent clearcoat surface (no transmission pass), which the QA renders use.

## Scale

| measure | source units | export scale | final units | mm at 20.5 mm/unit |
|---|---|---|---|---|
| case body diameter (slot 0 X extent, no crown) | 1.3048 | ×1.4954 | 1.9512 | **40.0** (spec) |
| lug to lug | 1.5266 | | 2.2829 | 46.8 |
| thickness (caseback to crystal top) | 0.2566 | | 0.3838 | 7.87 (spec: 7) |
| crystal diameter | 1.2326 | | 1.8433 | 37.8 |

The file carries no absolute size annotation (metric, unit scale 1.0). The export scale is chosen so the case body equals
the 40 mm product spec in the site convention (`families.ts`: radius = mm / 41, i.e. 1 unit = 20.5 mm; the procedural
Heritage uses radius 40/41 = 0.9756). Note for integration: the frozen Legacy asset applied its 43 mm to the *lug-to-lug*
extent (`Case_Lugs` 2.098 units), so its case body renders at about 36 mm-equivalent; the Heritage head is scaled to the
spec and will look slightly larger than the Legacy head side by side. `HERITAGE_SCALE=1.3442` rebuilds at the Legacy
factor (case body 1.754 units) if visual parity with Legacy is preferred over the spec. Strap width at this scale is
1.09 units (22.3 mm) versus the procedural 0.98 (20 mm); the strap was modelled to this head's lugs, so it fits the GLB.

## Materials

All web materials are plain Principled setups (colour, metallic/roughness, normal at most) on one UV set.
- Polished families (case, crown, indices, hands, bracelet): constant 0.8 grey (bracelet 0.9), metallic 1, roughness 0.05
  (client 0.039), same constants as the Legacy families.
- `Case_Brushed` / `Bracelet_Brushed`: the client's `MetalStainlessSteelBrushed002` 2K colour + roughness with the group's
  UV scale 0.5 / rotation 90° as `KHR_texture_transform`. The 16-bit normal map is near-flat and was not exported.
- `Dial_White` (2K): baked from `x WatchFace_white base and black` — 0.95 white, metallic 0.555 with a sunray noise
  roughness, printed HARTLEY logo + minute track (metallic 0, roughness 0.295) from the `hartley.png` / `Second Hand.png`
  masks, bump baked into the normal map. `Dial_Black` (2K): baked from `x WatchFace_black and white` (0.003 black, white print).
- `Caseback` (1K): baked from the `Radial002_2K_TEXT` mix (radial steel / engraved text); metallic constant 1.0.
- `Rehaut_White` 0.806 / `Rehaut_Black` 0.002, dielectric, roughness 0.136 (client "mild reflective").
- `Crystal` roughness 0, `Crystal_Edge` roughness 0.2, both transmission 1, IOR 1.5.
- Leather (`Leather_Strap_Long` / `_Short`): base 0.01, roughness + normal baked at 2K from the Horsehide 4K set through the
  client's group (its render UV overlaps on the long half, harmless because the bake reads through the same UV);
  `Leather_Stitch` constant (the client's rope group reads a degenerate UV on those faces); `Leather_Lining` felt baked at
  512 px on a smart-projected UV; `Bracelet_Keeper` constant polished; `Bracelet_Buckle` 0.668 grey with the engraved
  HARTLEY roughness/normal baked at 1K on a smart-projected UV.
- Bracelet: `Bracelet_Polished` (links, end links, bars, pin), `Bracelet_Brushed` (clasp insert), `Bracelet_Clasp`
  (baked 1K: brushed plate with the engraved logo).

Bake method: Cycles emission bakes (colour / roughness / metallic evaluated unlit, mix-shader weights preserved) and
tangent-space normal bakes, 1–4 samples, 8 px margin. The client file links `Poliigon_Adjustments.001` from a missing
library; the Radial (caseback) and Horsehide (leather) groups evaluate to black through it, so the build points those
references at the file's local copy of the same group before baking.

## Animation

`HeritageSeconds`: `SecondsPivot` rotation about its local +Z (the dial normal), 0 → −360° (clockwise from the front) over exactly 60 s,
181 linear keys (10-frame sampling of the linear source curve; no resampling in the pipeline because it collapsed the
turn to four keys 180° apart). Source: `1. second hand parent.001Action`, frames 1–1801, LINEAR, −6.2832 rad.
Hour and minute hands are static in the client file (a fixed presentation time) and are exported at rotation 0 =
12 o'clock so the runtime can set the time. All camera / slide-in choreography actions were dropped.

## Straps

Both straps are modelled as a worn wrist loop under the head (like the Legacy bracelet). Exported in the head's frame
with the same root transform and the same child-frame convention, so they load next to the head without offsets.
- `leather-black.glb`: `Strap_Long` (4,372 → 53,144 tris after Bevel + Subdivision level 1 + Curve), `Strap_Short`
  (17,792), `Buckle` (17,696). Source: "leather black with silver" (black Italian leather, silver buckle), placed at the
  frame-1 on-stage pose of the identical black/black strap.
- `mesh-silver.glb`: `Mesh_Links` decimated 1,523,596 → 150,000 tris (collapse, ratio 0.098; 4,760 link islands of 162
  vertices), clasp plate 78,976 → 27,641 and the two larger clasp pieces at ratio 0.35; end links, bars and pin as
  authored. Total 251,051 tris (bracelet + head ≈ 266k per frame, below the Legacy 359k reference).

## Pipeline

`pipeline.sh`: resize (`Dial_*` 2K, everything else 1K) → WebP (colour/metal-rough q88, normals q92) → dedup
(accessors, meshes, textures; **not** materials, because identical-looking families carry different finish roles) →
prune → Draco. No tangent handling (no anisotropy in Heritage).

## Validation

`glbqa.mjs` (headless Chrome, Mac GPU) renders `glbqa.html` for every finish / dial / strap / view and writes
`glbqa-report.json` plus `qa-*.png` and the boards `qa-finishes.png`, `qa-straps.png`, `qa-details.png`.
Checks: load in three.js r186 with Draco, tint by family role for the five finishes, dial-colour twins, seconds clip
angles at 0/15/30/45/60 s, crystal in thin and transmission modes, float render-target NaN scan, draw calls / triangles,
degenerate normals, textured primitives without UVs, unnamed nodes. Results are in the final report below and in the JSON.

### Results (2026-09-28, headless Chrome on the Mac GPU, 1200×900, three.js r186)

| check | result |
|---|---|
| loads in three.js (GLTFLoader + DRACOLoader) | head, leather, mesh: no errors |
| five finishes (silver / gold / rosegold+white / rosegold+black / black) | rendered, `qa-finishes.png`; black keeps silver indices and hands |
| seconds hand | tip at 0 / 90 / 180 / 270 / 359.9° clockwise at 0 / 15 / 30 / 45 / 60 s; step deviation 0.000° over 0.5 s samples |
| crystal | thin clearcoat mode (default) and transmission mode both render; dial stays sharp underneath |
| caseback | solid steel with readable engraving front-to-back (`qa-caseback-closeup.png`) |
| dial sharpness | 2K bake: logo and minute track crisp at zoom 2.6 (`qa-silver-dial-closeup.png`, `qa-black-dial-closeup.png`) |
| z-fighting | none seen in 24 views; dial/rehaut twins are toggled, never co-visible |
| materials / normals / UVs | 0 missing materials, 0 degenerate normals, 0 textured primitives without UVs, 0 unnamed nodes |
| NaN / Inf probe (float render target, all views) | 0 / 0 |
| draw calls | head alone 14 (thin glass) · head + leather 22 · head + mesh 22 (Legacy reference ≈149 with lighting/post) |
| triangles per frame | head 13,960 · head + leather 102,592 · head + mesh 265,011 (Legacy reference 359k) |
| Khronos validator | 0 errors on all three files |

Notes for integration (not done): show `Dial`/`Rehaut` or `Dial_Black`/`Rehaut_Black` by dial colour; drive `Hour`/`Minute`
rotation from the clock (0 = 12 o'clock, clockwise negative about +Z); play `HeritageSeconds` on the pivot or set its
rotation directly from the wall clock; the leather in the client file is high-gloss black (roughness from the Horsehide
gloss map, mean ≈0.2), rendered as authored.

## Integration (2026-09-28)

`MODELS.heritage` (`src/data/watches/models.ts`) registers the asset with `rootNode: "HeritageWatch"`, a `parts` map
(Case / Crown / Crown_Tip → case, Caseback / Caseback_Ring → caseback, Crystal → crystal, Dial / Dial_Black / Indices →
dial, Rehaut / Rehaut_Black → rehaut, Hands → hands), `hands: { hour: "Hour", minute: "Minute" }`, `dialVariants`
(white → Dial + Rehaut, black-matte → Dial_Black + Rehaut_Black), `clips: { idle: [], seconds: "HeritageSeconds",
train: [] }`, leather and mesh strap files, thin glass, the Legacy finish tints and rules, `minQuality: "medium"`,
`scale: 1`. `GLBWatch` reads those fields (Legacy names are the defaults), takes the hands axis from the node the
seconds clip drives, adds `rehaut` (1.2) to the explode table, switches dial variants by visibility, steps whole
seconds for quartz families and colours the leather families from the product's strap colour. `compileSteps`
(`src/lib/warm.ts`) compiles hidden meshes too, so the inactive dial variant is warm. `WatchRig` always pre-builds the
other family's procedural sibling under the preloader and fetches its GLB 3 s after the intro, adding the GLB pool entry
only once the files are ready (mounting it earlier built a procedural fallback right after the intro).

Site QA (production build, 1440×900, Mac GPU; scripts in `scratchpad/qa`):

| check | result |
|---|---|
| Legacy beats hero / legacy / stage / back / exploded | 60 fps, 149 calls, 359,365 tris before and after (identical) |
| Legacy intro stalls (home, Legacy product), 6 s window | 0 before, 0 after (max gap 17 ms) |
| Heritage product, leather (hero / dial / movement / exploded / craft) | 60 fps, 42 draw calls, 102,611 tris (craft 92,675) |
| Heritage product, mesh | 42 draw calls, 265,030 tris; 46–60 fps (the deferred Legacy sibling parse lands in the dial beat) |
| Home family switch Legacy → Heritage → Legacy | GLB on both sides, 60 fps at every beat, 0 errors |
| hands vs wall clock (Heritage) | hour / minute / seconds error 0°; seconds step once per second (0 change within 300 ms, −6° after 1 s) |
| dial switch white ↔ black (same geometryKey) | visibility toggles, 0 new shader programs, 0 frames over 40 ms |
| finishes | rose gold / gold tint case, indices, hands and buckle; black tints case and buckle, indices and hands stay 0.8 |
| leather colour | white leather → (0.807, 0.768, 0.701) linear of `#e8e3da`; buckle keeps the case / strap metal |
| explode offsets × scale | crystal 1.55, rehaut 1.20, hands 0.72, dial 0.42, case 0, caseback −1.65; strap parts ±0.45 / −0.12 |
| fallbacks | blocked Heritage files → procedural; `?quality=low` → procedural; `?thumb=1` → procedural + `thumb-ready`; `?perfhud=1` overlay shown |
| iOS simulator (iPhone 17 Pro) | leather and mesh product pages render the GLB with the studio profile |
