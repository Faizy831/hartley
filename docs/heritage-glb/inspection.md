# Heritage source inspection (read-only) — 2026-09-28

File: `Heritage_Animation_export.blend` (project root), 2,783,152,906 bytes, MD5 `7ca7374601e47ac9512d31b1b8b7b674`.
Scripts: `scripts/blender/heritage/inspect_heritage.py` (structure), `geom_heritage.py` (per-object geometry). Logs: `inspect-full.log`, `inspect-geometry.log`.
Nothing was saved, exported or modified. Blender 4.2.9 headless opened the file (saved by 4.1.23).

## 1. Integrity
Header `BLENDER-v401`; DNA1 block present; ENDB is the final block at byte 2,783,152,882; 176,306 blocks walked = 100 % of the file, no truncation. Blender opens it with one warning: linked library `X:/03. 3D Assets/4. Details/colorbond/colorbond.blend` (node group `Poliigon_Adjustments.001`) is missing; no watch, strap or world material references it. All 287 images are packed (282 report packed data, ~1.07 GB), so nothing external is required.

## 2. Scene / colour / world
Cycles GPU, 300 samples, 1920×1080 @ 300 %, 30 fps, frames 1–660, current frame 15. View transform **Filmic**, look None, exposure 0.0, gamma 1.0 (Legacy: AgX Very High Contrast, −0.178).
World "Studio World": the ProLighting graph (Abstract 01.jpg.001 3072×1536 packed, glossy-ray mix, Mask Round, Flying Embers overlay, Background Color white) exists **but is not connected to World Output**. The output surface is `Background.002`: flat grey 0.231, strength 2.0. As saved, the world is a uniform grey environment.

## 3. Lights / cameras / backdrop
Rendering lights (view layer): `Point_Ceiling` and `Point_south`, rectangle area 2.54×0.25, 15 000 W each, in collection "2. bravo set up", with a `backdrop` plane (material "paper", 0.378 grey). 30 further lights live in excluded collections (Master.001, 1. alpha set up, retired, spare).
Cameras: 16. Active `cam 10` (65.5 mm, no DOF, clip 4.5–1000) parented to `cam 10 parent`, animated frames 1–660 (tilt −1.122 → 0.086 rad, LINEAR, 3 keys). Timeline marker frame 1 → cam 10.

## 4. Collections and hierarchy
- Heritage Wtach Bases / **Heritage_Cyber** (30 objects, active): the five finish variants, each an EMPTY root (rot X 1.396) with one fused `1. Base Mesh` + `hour hand` + `Minute hand` + `second hand parent` → `second hand` (Solidify).
- Master / **Animation** (70 objects): parked copies of the five roots at x = 100/200/300/400 (static keys at frame 360), four animated mesh-band sets (black .003, silver .001, gold .001, rose gold .002), `cam 10 parent`, `Hiding Boxes` (10.9-unit cube, Material.007), sub-collections retired / 1. alpha set up (excluded) and 2. bravo set up (lights + backdrop).
- **Collection 6** (42 objects): seven leather strap sets (black×black/gold/rose gold/silver buckle, white×silver, pink×rose gold, beige×rose gold): 2 mesh halves (Bevel+Subsurf+Curve on Bézier curves) + `metal lock`.
- Excluded: straps.004 (188 objects, 26 leather + 4 mesh-band originals), REF (19, a different "step to obj/watch base.003" build with geometry nodes), MEGACHEAP watch (26), spare/Cams & Straps (85), import (2). Ten Gscatter "System" grass/rock meshes are in no collection.

## 5. Materials (per slot, black variant / silver variant face counts)
| slot | material | faces (black) | faces (silver) | notes |
|---|---|---|---|---|
| 0 | x metal shiny <finish>_0.005 bevel | 3609 | 3674 | Brushed002 4K set (COL/METALNESS/ROUGHNESS 4K, NRM 2K), Mix B = finish tint, roughness 0.01, Bevel node |
| 1 | x MetalStainlessSteelRadial002_2K_TEXT | 792 | 792 | mix shader masked by `heritage mask.png` 3000² (dial text), Radial002 2K set |
| 2 | x MetalStainlessSteelBrushed002_2K | 130 | 1286 | 2K brushed, UV scale 0.5 rot 90°, NRM16 TIFF |
| 3 | x metal shiny <finish>_0.003 bevel | 1015 | 1327 | as slot 0 |
| 4 | x WatchFace_black and white / white base and black | 379 | 379 | mix shader: `hartley.png` + inverted `Second Hand.png` masks |
| 5 | x metal shiny silver_0.003 bevel | 65 | — | 0.8 grey, metallic, roughness 0.039 |
| 6 | x black mild reflective / x white mild reflective.001 | 252 | 252 | 0.002 / 0.806, roughness 0.136, dielectric |
| 7 | x Glass: Clear IOR1.008 | 128 | 128 | transmission 1, roughness 0, IOR 1.008 |
| 8 | MetalStainlessSteelBrushed002_4k_black (black only) | 1156 | — | RGB-curve darkened brushed |
| 9 | metalstainlesssteel shiny_silver (black only) | 312 | — | 0.8 grey polished |
| 10 / 8 | x Glass: Clear IOR1.1 | 126 | 126 | transmission 1, roughness 0.2, IOR 1.1 |
Hands: silver variants `metalstainlesssteel shiny_silver` / `x metal shiny silver_0.005 bevel`; gold/rose gold variants `..._4K_shiny_gold.001` / `..._shiny_rosegold.001`; black variant keeps silver hands.
Tints (Mix B): gold 0.558/0.426/0.168, rose gold 0.694/0.413/0.323, black 0.081 — identical to Legacy.
Leather: `Leather_texture_<colour>` (Horsehide 4K AO/BUMP16/COL/DISP16/GLOSS/NRM TIFF+JPEG), `FabricRope001_1K_*` stitching, `Metal_hartley_leatherbuckle_silver`, `felt_basic straps` (hartley.png + ITALIAN LEATHER.png), lock `<finish> metal with hartley`.
Mesh bands: `..._4K_shiny_<finish>`, `..._4k_<finish>_hartley_mesh` (leatherstrap_detail jpg/png text), `metalstainlesssteel shiny_silver`, `sfsfs` (1-triangle stub).
Anisotropy: 0.0 on all 171 Principled materials, none linked. Transmission: only the two glass slots (plus excluded REF/MEGACHEAP glass).

## 6. Finish variants
Heads: 1 black/black dial, 2 rose gold/black dial, 3 gold/black dial, 4 silver/white dial, 5 rose gold/white dial (all five present as full objects; the five variants share one mesh topology, 7,209 verts / 7,964 faces, only slot materials differ).
Straps active: 7 leather sets + 4 mesh bands. Excluded straps.004 adds brown, peach, beige, pink variants (26).

## 7. Animations (121 actions, 29 with changing curves)
- Seconds: five `second hand parent*` actions, frames 1–1801 (60 s at 30 fps), 2 keys, **LINEAR**, rotation Z −4.833 → 1.45 rad (= −2π, one turn per minute). Hour/minute hands: static.
- Choreography (Bezier): the five base roots slide in along Z (−21.168 → 2.296) in sequence (rose gold 0–120, silver 119–240, black 239–360, rose gold white 359–480, gold 479–661); leather black/black 0–300 (8 keys), pink 419–480, white 0–360 (parked variants −2…−1); mesh bands black −11…666, silver −3…240, rose gold −3…420, gold −3…540; `gold` REF band 1807–1819.
- Camera: `cam 10 parent` 1–660, LINEAR.
- No exploded view, no movement parts (quartz), no NLA strips, no drivers. 87 actions are single-key (static) or empty FBX "Take 001" stubs.

## 8. Geometry (evaluated triangles)
Scene total 23,247,812 tris (481 objects, 292 meshes) — almost all in the 11 mesh-band copies (1.72 M each; `_pCylinder006*` link mesh 1,523,596 tris) and REF.
Exportable head: **14,464 tris** per variant (Base Mesh 14,080: 5,695 quads, 5 n-gons, custom normals, UV maps `map1`, `second hand`, `UVMap`; hour 54, minute 54, second hand 276 after Solidify). Dimensions 1.369 × 1.527 × 0.257 units (scene units metric, scale 1.0, displayed in mm; absolute scale must be confirmed — no dimension annotation in the file).
Leather strap set: **88,632 tris** after Bevel + Subsurf + Curve (halves 17,792 + 53,144, lock 17,696; mesh scale 1.981; 94 + 29 n-gons).
Mesh band set: **1,723,951 tris** — unusable as-is for the web; the link cylinder mesh needs decimation or instancing.

## 9. Crystal / caseback
Both glass slots sit on the single fused base mesh: IOR 1.008 roughness 0 (128 faces) and IOR 1.1 roughness 0.2 (126 faces). Which is crystal and which is caseback is not stated by names; it must be determined geometrically at export (face centroid Z relative to the dial), not assumed.

## 10. Anisotropy / tangents
No anisotropic materials anywhere; brushed appearance comes from the Brushed002 / Radial002 normal-roughness sets. No tangent export required. Bevel shader nodes (edge rounding) cannot be exported; either ignore or bake a normal map.

## 11. Exploded / part groups
None. The case, bezel, lugs, crown, chapter ring, dial and both glasses are one mesh separated only by material slots. Hands are separate objects with a seconds pivot EMPTY. Any exploded view or per-part labelling for Heritage must come from a material-slot split at export.

## 12. Comparison with Legacy and export plan
Legacy: AgX, ProLighting env on glossy rays, 3 area strips, ~120 separate objects with 19 material families, anisotropic bridges, 7 clips, tangents needed, 1.04 GB file.
Heritage: Filmic, world reduced to flat grey (studio graph disconnected), 2 rect strips, one fused mesh + 3 hands, no anisotropy, one linear seconds clip, 2.78 GB file dominated by strap duplicates.
Recommended plan (not executed): (1) export from `4. Silver Base with white face` as the geometry source, split `1. Base Mesh` by material slot into web_* families, classify the two glass slots geometrically, keep hands + seconds pivot, reuse Legacy tint constants; (2) leather strap: apply Bevel/Subsurf/Curve, export one black×silver set as base, tint buckle/lock per finish; (3) mesh band: decimate `_pCylinder006` (target ≤150 k tris) before export; (4) reuse the Legacy studio profile (AgX + Abstract 01) since the file's own world is flat grey; (5) confirm absolute scale (40 mm) and which glass slot is the crystal before the first build.

HERITAGE INSPECTION STATUS: COMPLETE + READY FOR EXPORT
