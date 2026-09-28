# Legacy GLB build (client Blender asset → web)

Source: `Legacy_Animation_export.blend` (read-only, Blender 4.01, 1.04 GB). Built with Blender 4.2.9 headless via `scripts/blender/legacy/build.py`, then `pipeline.sh` (gltf-transform). **Not integrated into the site yet — awaiting approval.**

## Outputs

| file | size | triangles | meshes | materials | textures | animations |
|---|---|---|---|---|---|---|
| `public/models/legacy/legacy-head.glb` | 8.94 MB | 280,998 | 116 | 9 | 10 | 7 |
| `public/models/legacy/straps/steel-bracelet.glb` | 1.17 MB | 78,353 | 13 | 3 | 4 | 0 |

Units: root node `LegacyWatch` carries scale 1.3442 and the centring offset so the case measures 2.098 units (site convention 1 unit = 20.5 mm); Y-up, dial faces +Z, crown at +X.

## Hierarchy (head)

```
LegacyWatch
  Bezel
    Bezel001 (+2)
  Case
    Case_Lugs *
    Case_Middle (+3)
  Caseback
    Caseback_Glass (+2)
  Crown
    Crown_Head (+2)
    Crown_Part_Cylinder_051 *
    Keyless_002 (+2)
    Keyless_003 (+2)
  Crystal
    Crystal001 *
  Dial
    Dial_Detail_Cylinder_049 (+3)
    Dial_Plate *
    Indices (+12)
    Logo *
  Hands
    Hand_Hour (+2)
    Hand_Minute (+2)
    Hand_Seconds *
    Hands_Cap *
  Movement
    Balance (+9)
    Barrel (+2)
    Bridges (+7)
    Escapement (+2)
    GearTrain (+2)
    Hairspring (+1)
    Other (+18)
    Rotor (+2)
    Screws (+12)
```

## Animations kept

| clip | target | duration | notes |
|---|---|---|---|
| HandSeconds | Hand_Seconds | 59.967 s | rotation in place (mesh re-centred on its axis) |
| Balance | Balance_Wheel | 1.433 s | rotation in place (mesh re-centred on its axis) |
| EscapeWheel | Escape_Wheel | 2.667 s | rotation in place (mesh re-centred on its axis) |
| PalletFork | Pallet_Fork | 2.667 s | rotation in place (mesh re-centred on its axis) |
| FourthWheel | Fourth_Wheel | 60 s | rotation in place (mesh re-centred on its axis) |
| ThirdWheel | Third_Wheel | 60 s | rotation in place (mesh re-centred on its axis) |
| Hairspring | Hairspring001 | 1.433 s | shape key |

Removed: 1.  metal band parent (1.  metal band parentAction.002), 1. gold (1. goldAction), master parent.001 (master parent.001Action.001) — camera, variant parking and beauty-turn staging. Rotor is not animated in the client file.

## Needs client confirmation

- Hand_Minute / Hand_Hour: assigned by length (Object019.014 longer than Object019.017); confirm
- Hands_Cap (Object019.016) and Dial_Detail_Cylinder_049: small parts in front of the dial, function unknown
- Dial_Plate colour: source 'Material' is a mix graph; exported as near-black satin

## Unidentified parts (kept under Movement/Other, original names preserved)

BezierCurve.019, BezierCurve.021, BezierCurve.022, BezierCurve.023, BezierCurve.024, BezierCurve.025, BezierCurve.026, Circle.010, Circle.013, Circle.014, Circle.016, Cube.009, Cylinder.048, Cylinder.050, Cylinder.053, Cylinder.054, Cylinder.055, Cylinder.057

## Notes

- BezierCircle.002: shape keys kept, Solidify left unapplied (flat hairspring ribbon)
- watch band left.018 is hidden in the client file (object flag or excluded/hidden collection) — boolean helper, modifiers already applied; excluded from export
- Cube.018 is hidden in the client file (object flag or excluded/hidden collection) — boolean helper, modifiers already applied; excluded from export
- watch band left.013 is hidden in the client file (object flag or excluded/hidden collection) — boolean helper, modifiers already applied; excluded from export
- Cube.010 had no material (helper / boolean cutter, modifiers already applied) — excluded from export
- Cylinder.056 had no material (helper / boolean cutter, modifiers already applied) — excluded from export
- Cube.011 had no material (helper / boolean cutter, modifiers already applied) — excluded from export
- Dial_Plate: source material 'Material' uses a Mix graph; exported as near-black satin (needs client confirmation of dial colour)
- Cylinder.052 had no material (helper / boolean cutter, modifiers already applied) — excluded from export
- Cube.008 had no material (helper / boolean cutter, modifiers already applied) — excluded from export
- root node LegacyWatch carries scale 1.3442 and the centring offset so the case measures 2.098 units (site convention 1 unit = 20.5 mm); children keep client world-space transforms (baked keyframes stay valid)

## QA renders

three.js (GLTFLoader + DRACOLoader + AnimationMixer): `qa-*.png`. Blender Workbench reference of the client's gold tree at frame 1: `reference-blender-*.png`.

## Integration notes (2026-09-27)

- Integrated behind `MODELS.legacy` (`src/data/watches/models.ts`); the procedural Legacy remains the fallback (low tier, failed load, measured degradation, thumbnails, `?model=procedural`).
- The 60 s clips (HandSeconds, ThirdWheel, FourthWheel) are two-key Bezier actions in the client file, so their baked keys ease in and out: clip time is not linear in angle. The site therefore only uses their first frame as a reference pose and turns the nodes directly. A linear re-bake (set the source fcurves to LINEAR before baking) would fix the asset itself.
- Train ratio used on the site: fourth wheel 1 turn/min with the seconds hand, third wheel −1/8 turn/min (standard, not client data).
- Case finishes other than silver are tints of the steel material families (`unsupportedFinish: "tint"`); switch to `"procedural"` to fall back instead, or add per-finish assets.
- Only the steel bracelet has a real asset; croc, mesh and rubber use the procedural strap on the real head.

## Finish fidelity (validation 2026-09-27)

How the client file colours the four variants (`1. gold`, `2. silver`, `3. rose gold`, `4. black`): every variant shares the same steel texture set (`MetalStainlessSteelBrushed002` COL / ROUGHNESS / NRM / METALNESS, plus Worn and Radial for the barrel). The finish is a colour applied on top:

| finish | polished parts (`_4K_shiny_<finish>`) | brushed parts (`_4k_<finish>`) | crown knurl (`_4K_corogate_<finish>`) |
|---|---|---|---|
| silver | untextured `metalstainlesssteel shiny_silver`: 0.8 grey, metallic, roughness 0.039 | `_4k_silver` (one part; its mix colour is the gold constant, an authoring slip) | flat 0.556, 0.449, 0.111 |
| gold | flat 0.558, 0.426, 0.168 (Mix, factor 1), roughness 0.01, normal off | texture tinted with Color blend 0.556, 0.424, 0.167 | flat 0.556, 0.449, 0.111 |
| rose gold | flat 0.694, 0.413, 0.323 | Color blend 0.694, 0.413, 0.323 | flat |
| black | flat 0.081, 0.081, 0.081 | Color blend black, then an RGB curve capping the value at 0.07 (bezel variant: 0.4) | flat |

(Values are linear RGB from the Blender Mix nodes.)

Parts that change with the finish: case middle, lugs, bezel, crown, bracelet links and clasp. Parts that do not change: the whole movement (`Brushed002_2K`, `2K_dark`, `2K_shiny_anisotropic`, Worn, Radial), jewels, dial plate, glass.

Parts that are **gold in every variant** (accents, `_4K_shiny_gold` in the silver, rose gold and black trees): balance cock, balance wheel, hairspring, the two main hands (one material slot of each), one bridge (`top plate_2`), and one slot of the crown head (the "H" emblem).

What the exported GLB contains: only the silver families (`web_Steel_Polished` untextured, `web_Steel_Brushed`, `web_Steel_Knurled`, `web_Steel_Worn`, `web_Steel_Radial`, `web_Steel_RotorText`). The export was taken from the gold tree with gold materials renamed to silver, so:

- **Missing for silver:** the gold accents above are silver in the asset. Fixing this needs a re-export with a separate `web_Steel_Accent` family assigned to those primitives (the slot structure survives in the GLB, so a gltf-transform pass could also do it).
- **Missing for gold / rose gold / black:** no per-finish materials. The site tints the steel families with the client's constants above. Two deviations remain: `web_Steel_Brushed` mixes movement bridges (which the client keeps silver) with the brushed case flanks, so the movement is tinted too; and the black finish's brushed curve and bezel grey variant are approximated by one constant. A faithful result needs the export to split case/bracelet steel from movement steel and to carry the four finish constants as material variants (`KHR_materials_variants`).
- Rubber, croc and mesh straps have no assets (procedural strap on the real head).

## Rendering performance (validation 2026-09-27/28)

Method: production build, headless Chrome with the Mac GPU, 1440×900 at DPR 1, high tier with post-processing, product film beats (hero, dial, movement back, exploded). `window.__veloris.perf` counts every pass. Runs repeated twice; best run shown. No shadows exist in the scene (no light casts them), and freezing the animation mixer changed nothing measurable.

| configuration | fps | frame | draw calls | triangles/frame |
|---|---|---|---|---|
| before: refractive crystal + caseback, refractive jewels (as exported) | 35–38 | 26–28 ms | 278 | 719k |
| refractive crystal only (jewels and caseback fixed) | 39–43 | 23–25 ms | 276 | 717k |
| refractive crystal at `transmissionResolutionScale` 0.5 | 43–60 | 17–23 ms | 276 | 717k |
| **after: thin crystal + caseback, opaque jewels (shipped)** | **60 (cap)** | **16.7 ms** | **149** | **359k** |
| procedural Legacy | 60 (cap) | 16.7 ms | 228 | 171k |

Findings:
- The whole cost was the transmission pass, which renders every opaque object a second time into a render target whenever any transmissive material is visible (hence draw calls and triangles doubling). It cost about 8–10 ms per frame at this resolution.
- The export had given the 21 jewels `transmission 0.5`. The client's jewel material (`purple`) is an opaque metallic lacquer, so this was an export artefact; it alone kept the pass alive even with the crystal and caseback switched off. The site now sets the jewels back to opaque (metallic 0.38, roughness 0.05, clearcoat).
- Refractive caseback glass blurred the movement behind it (rotor and jewels lost); the thin clearcoat surface shows it crisply. See `compare-caseback-*.png`.
- Refractive crystal washed out the skeleton dial; the thin surface reads the dial and hands clearly, which also matches the product's anti-reflective flat sapphire. See `compare-crystal-*.png`. The refractive path remains available per model (`MODELS.legacy.glass`) and via `?glbqa=crystal:transmission`.
- Post-processing (bloom + SMAA) costs about 19 draw calls and is unchanged.

Devices: no Intel UHD 630 machine was available in this environment; the previous QA on that GPU cannot be repeated here. Mobile: the booted iPhone 17 Pro simulator (WebKit, Mac GPU) rendered the site correctly at 53–60 fps, 149 calls (`ios-simulator-*.png`); its first head parse took 12 s (cold WebKit, wasm Draco + WebP decode) and 1.8 s once warm. That is not a GPU measurement; a real device test is still open, and the 12 s cold parse on WebKit should be checked on hardware.

QA switches (read once from the URL): `?model=glb|procedural`, `?glbqa=crystal:thin|transmission|off,caseback:…,jewels:transmission,anim:off,post:off,tr:<scale>`, `?perfhud=1` (on-screen fps/calls/loads for devices without devtools).

## Look pass: matching the client's Blender render (2026-09-28)

**What the client file does** (`Legacy_Animation_export.blend`, Cycles, 200 samples):
- Colour management: AgX view transform, look "AgX – Very High Contrast", exposure −0.178. AgX compresses highlights smoothly; ACES (what the site used) clips polished steel to white.
- World "Studio World" (ProLighting add-on): the environment image `Abstract 01.jpg` (3072×1536, a ring of vertical soft-box strips over grey floor/ceiling gradients, saved here as `client-studio-environment.jpg`) is fed **only to glossy rays** at strength 1.0 (Light Path → Is Glossy Ray). Camera and diffuse rays see a 0.032 grey background. So the metal reflects a bright studio, the object sits in a dark room.
- Lights that render: three rectangular area strips, 2.54 × 0.25 m, 15 360 W (ceiling, far), 15 360 W (front-top, 7 m) and 2 150 W (below/behind, 3.9 m). A second light collection (`lights v2_preferred`) is excluded from the view layer. No emissive studio cards.
- Cameras: 10, with depth of field (f/1.5–f/3), lenses 50–95 mm.
- Materials: polished steel is untextured (0.8 grey, roughness 0.039); brushed parts use the `MetalStainlessSteelBrushed002` colour/roughness/normal set with UV scale 0.5 (rotated 90° on the movement); the movement's "shiny anisotropic" bridges use anisotropy 1.0; the case flanks are "dull" (roughness 0.389); the dial plate is 0.011 near-black, roughness 0.232; the crystal is IOR 1.1 clear glass; the caseback glass is *rough* glass (roughness 0.35).

**Why the WebGL version looked like chrome:** ACES tone mapping on a 16-intensity spot key plus a generic HDR environment. Highlights clipped to white over large areas, reflections had no structure, and the export had merged all steel into a few families so the finish tints coloured the movement.

**Three.js changes (only while a client GLB is on stage, `useStore.glbOnStage`):**
- Environment: the client's studio image (`public/assets/hdr/legacy-studio-1k.jpg`, 1024×512, 65 KB) as `scene.environment`, loaded once with `TextureLoader` (drei's `.jpg` path expects a gain-map HDR and produced an unusable texture). Preset environment intensity × 1.9.
- Tone mapping: `AgXToneMapping`, exposure × 1.15. Story presets still lerp; the profile multiplies them: key × 0.22, rim × 0.35, fill × 0.45.
- Two `RectAreaLight` strips (3.4 × 0.34 units, front-top and back-bottom, 5.5 / 2.75) stand in for the client's area strips and give the long soft highlights.
- Heritage and the procedural watch keep ACES and the original HDR environment.

**Export changes (`scripts/blender/legacy/build.py`):** geometry still comes from the gold tree (on stage, animated); each part's materials now come from the client's *silver* variant (matched by mesh signature, 77 of 101 parts; the rest keep the gold-tree material) and are split into families: Case_Polished, Case_Brushed, Case_Satin, Crown_Knurl, Bracelet_Polished, Bracelet_Brushed, Indices, Hands, Accent, Movement_Brushed, Movement_Polished, Movement_Dark, Movement_Worn, Movement_Radial, Rotor, Jewel, Dial_Plate, Crystal, Caseback_Glass. Client UV scale/rotation is carried via `KHR_texture_transform`; jewels are opaque as authored; tangents are exported.

**Finish rules (from the client's product photography, `MODELS.legacy.finishRules`):** gold and rose gold tint case, crown, bracelet, hands, numerals and accents; black tints case, crown and bracelet only (hands and numerals stay silver); the movement never changes. Tints are the client's Mix-node constants.

**Accents:** the client's silver tree assigns its gold constant to the balance cock, balance, hairspring, one hand slot, one bridge and the crown emblem, but the product photos show them silver. They are exported as their own `Accent` family and rendered silver; flip `finishRules.silver.furniture` to `"gold"` if the client confirms the gold accents.

**Crystal / caseback:** thin clearcoat surfaces kept (no transmission pass). The client's caseback glass is *frosted* in Blender (roughness 0.35), which is why the refractive version blurred the movement; the product photos show it clear.

**Anisotropy and post-processing:** three.js needs a tangent frame for anisotropic materials; without exported tangents it derives one from UV derivatives and produces NaN on degenerate faces. Bloom's mip chain then spreads a handful of NaN pixels over the whole canvas, which is what the black silhouettes during this pass were. The rig now only keeps anisotropy on primitives that carry tangents (the exporter wrote tangents for one primitive), so the anisotropic bridges render isotropic for now. A NaN probe (`scripts/blender/legacy/glbqa.mjs` family: `nanprobe.js` in the QA scratch) renders the scene to a float target and counts NaN/Inf; it is zero.

Comparison boards: `compare-before-after.png` (client photo / reviewed build / after), `rotation-after.png` (nine angles). Cycles renders of the client file from its own cameras came out black in headless mode (the lights point away from the on-stage variant and the addon world is camera-ray masked), so the client's product photography is used as the appearance reference.

**Performance after the look pass** (production build, headless Chrome, Mac GPU, 1440×900, high tier, post-processing on, product film beats; the iPhone simulator's Safari had to be closed first because it was taking the GPU):

| configuration | fps | frame | p95 | draw calls | triangles/frame |
|---|---|---|---|---|---|
| GLB, studio profile (shipped) | 60 (cap) | 16.7 ms | 17.6 ms | 149 | 359k |
| procedural Legacy, same session | 43–52 | 19–23 ms | 21–29 ms | 228 | 171k |
| mobile viewport 390×844, GLB | 55–60 | 17–18 ms | 26–29 ms | 149 | 359k |

The studio profile adds two `RectAreaLight`s and AgX; draw calls and triangles are unchanged from the transmission fix, and the frame stays at the vsync cap. Switching families recompiles shaders once (tone mapping changes); see the navigation probe in the report.

## Pipeline fixes (2026-09-28): tangents and linear clips

- **Tangents.** Blender's glTF exporter can only compute MikkTSpace tangents on triangulated meshes and silently skips the rest, which is why one primitive had them. `build.py` now adds a Triangulate modifier (custom normals kept) to every exported mesh before the modifier bake, and exports tangents. `pipeline.sh` keeps `TANGENT` only on primitives whose material carries `KHR_materials_anisotropy` (`prunetangents.mjs`) and stores them as normalised int8 (`KHR_mesh_quantization`), since Draco leaves tangents uncompressed. Result: 24 primitives, 32 mesh instances, all anisotropic ones with tangents; head 9.52 MB. The runtime guard that removes anisotropy where tangents are missing stays as a safety net and now does nothing.
- **Linear clips.** Actions whose f-curves have at most two keys (HandSeconds −570…1229, ThirdWheel and FourthWheel 1…1800) are set to LINEAR before the world-space bake, so the sampled rotation is uniform between the client's own end poses; the 43- and 80-frame balance and escapement clips are left as authored. Validation: 90.0° / 178.6° / 270° at 15 / 30 / 45 s for the seconds hand and fourth wheel, 45° steps for the third wheel. The site still drives the hands directly from the clock; the clips are now safe to scrub.
- `pipeline.sh` no longer overwrites its raw-export copy with an already processed file.
- Production (same conditions as above): 60 fps, 16.7 ms, p95 17.6 ms, 149 calls, 359k triangles; blocked-asset fallback, client-side navigation and the family switch unchanged. NaN probe: 0. `movement-closeup-anisotropic.png` shows the bridges' directional brushing.

## Strip-light refinement (2026-09-28)

Only the two studio strip lights changed. Before: 3.4 × 0.34 units, 5.5 / 2.75 nits, at (0.6, 3.4, 3.6) and (−0.4, −2.2, −3.8). After: 5.2 × 1.6 units, 1.0 / 0.5 nits, at (0.8, 4.2, 2.8) and (−0.6, −2.6, −3.4), both still aimed at the origin. Flux is roughly unchanged (mean luminance of lit pixels 119 → 122 across the nine-angle sweep) but the highlight is spread into long gradients over the curved case: near-white pixels 0.37% → 0.26% of the lit area overall, and on the side views 1.1% / 2.6% → 0.7% / 0.7%. Larger-flux variants (4.6 × 1.2 at 1.4) were rejected because they raised side clipping to 6–9%. Boards: `strips-before-after.png`, `strips-before-rotation.png`, `strips-after-rotation.png`.
