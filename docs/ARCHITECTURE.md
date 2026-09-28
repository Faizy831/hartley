# Architecture

A cinematic, scroll-driven 3D world for Hartley Watches, built with Next.js 16
(App Router), React 19, React Three Fiber 9, Three.js, GSAP + ScrollTrigger,
Lenis and Tailwind 4. Framer Motion is used only for the full-screen menu.

```
src/
  app/
    layout.tsx           fonts, metadata, and the PERSISTENT <Experience> shell
    page.tsx             home: the collection story (Legacy → Heritage)
    watch/[slug]/        product detail: the deep single-object film, one route per configuration
  data/
    finishes.ts          material vocabulary: case finishes, dial specs, strap specs (kind + colour)
    watches/
      types.ts           WatchDefinition, WatchArchitecture, FamilyStory, Spec
      families.ts        the two Hartley architectures + the X1, and each family's editorial copy
      legacy.ts          20 Legacy configurations (real names, prices, verified specs)
      heritage.ts        20 Heritage configurations
      veloris.ts         the original X1 study as its own definition
      index.ts           registry, selector options, sibling resolution
  lib/
    resolveWatch.ts      definition + overrides → ResolvedWatch (what the renderer needs)
    choreography.ts      beats per PAGE (home / product) and per layout (desktop / mobile)
    sceneState.ts        sceneTarget (written by GSAP) → sceneCurrent (damped, read by the renderer)
    lighting.ts, quality.ts, store.ts, specs.ts
  components/
    3d/
      Scene.tsx          the one Canvas; DPR / quality tiers; visibility-aware frameloop
      WatchRig.tsx       interaction + PRODUCT TRANSITIONS
      watch/
        architecture.ts  lathe profiles from a WatchArchitecture (radius / height / crystal / bezel)
        materials.ts     material library, applyCaseFinish / applyStrap (tweened, never reloaded)
        textures.ts      canvas textures: dial, Geneva stripes, perlage, caseback engraving, croc, mesh
        Watch.tsx        ProceduralWatch — assembly driven by the resolved definition
        Dial.tsx         sunburst / skeleton / minimal dials + applied markers
        Hands.tsx        dauphine or stick hands; 8-beat sweep or 1 Hz quartz tick
        Movement.tsx     automatic calibre, rotor, front works for skeleton dials
        Straps.tsx       leather / croc / rubber / mesh (swept section) → Bracelet.tsx (instanced links)
    animation/           SmoothScroll, ScrollChoreography (rebuilt per route), Intro, Reveal, FamilyTriggers
    sections/            product-detail sections (data-driven) and sections/home/* (collection story)
    ui/                  Nav (route-aware), Menu, Cursor, MagneticButton, SectionIndicator, Grain, Preloader
```

## One world, many products

The WebGL canvas lives in the root layout and is never re-created; routes only
swap the DOM story around it. The object on stage is `activeWatchId` in the
store, resolved by `useActiveWatch()` into definition + architecture + finish +
dial + strap.

`WatchRig` keeps a small pool (three entries) of mounted `ProceduralWatch`
instances keyed by `geometryKey` (`family:strapKind`) and toggles visibility:

- **Same key** — the change is a finish, dial or strap colour. Materials are
  tweened in place (`applyCaseFinish`, `applyStrap`) and the dial crossfades a
  second face. The camera never moves, the object never reloads.
- **Different key** — the family or the strap construction changed. `WatchRig`
  runs a short dip (0.35 s in, 0.85 s out): exposure falls, the object turns,
  and at the darkest point the pool switches which entry is visible. The
  transition timeline owns its own lifetime; it is never killed by the state
  change it triggers.
- **Warm-up** — after the intro the other family's default is added to the
  pool and drawn for four frames at sub-pixel scale, so its buffers, textures
  and programs are already on the GPU when it is first shown. Material
  libraries, dial faces, shared textures and geometry sets are cached per
  family and never disposed while the app lives.

`FamilyTriggers` drives this on the home page: entering the Heritage chapter
brings the visitor's Heritage pick on stage; scrolling back brings the Legacy
pick back. `lastByFamily` remembers each family's selection.

## Watch = data + configuration

A `WatchArchitecture` describes a family's geometry (radius, height scale,
domed or flat crystal, bezel, dial style, indices, hands, crown, exhibition
back, movement type). `buildProfiles()` turns it into lathe profiles; the
same builders produce the 43 × 11 mm Legacy, the 40 × 7 mm Heritage and the
41 mm X1. A `WatchDefinition` is a real product: family + case finish + dial +
strap + verified specifications. Adding a configuration is a data entry; adding
a family is an architecture entry plus, where needed, a new part style.

## Scroll choreography

Beats are declared per page. `ScrollChoreography` builds one master GSAP
timeline from the sections present on the current route, scrubbed by scroll,
and rebuilds on navigation (landing on a requested chapter via `navIntent`).
The editorial frame beat is resolved from the DOM rectangle and the active
family's radius so any product lands inside the printed frame.

## Catalog layer

The 3D exhibition is the presentation layer; the catalog is the discovery
layer. `CatalogSection` (per family, on the home page) and `/watches` (all
configurations with family tabs, plus straps and accessories) are normal
document content with a solid background. Each carries `data-covers-scene`:
`CoverTriggers` pauses the renderer while such a section covers the viewport
and resumes it as soon as the scene is visible again. Cards link to the
existing `/watch/[slug]` product film; a secondary link goes to the client's
shop page.

Card images are rendered from the same procedural model by
`scripts/render-thumbnails.mjs` (`npm run thumbnails` against a running
server): each configuration is opened in `?thumb=1` mode — fixed pose,
neutral light, no chrome, no motion — captured, and encoded to WebP at 1080
and 480 px into `public/assets/images/products/`. Re-run it after visual
changes to the model.

## Scroll ownership

The document scroll belongs to the user. Lenis smooths wheel input only
(`syncTouch: false`, keyboard and scrollbar are native) and feeds
ScrollTrigger; the 3D world only reads scroll progress. The only programmatic
scrolls are: a one-time landing per route change (top, or a requested
chapter via `navIntent`), and explicit nav / menu clicks. Timeline rebuilds
(resize, family change) never touch the scroll position, and nothing snaps.

## Quality and performance

Tiers (high / medium / low) control DPR cap, post-processing, crystal
transmission, particle count and segment counts; `PerformanceMonitor` steps
DPR down under sustained frame drops. Only the product on stage is built —
there is no preloading of other configurations. Geometries, materials and
textures are disposed when a product unmounts. Heritage skips the movement
entirely. Bracelets are two instanced draw calls per side.

## Layers (z-order)

`bg-live / bg-glow (0)` → `behind typography (1)` → `canvas (2)` → `main DOM (3, pointer-events: none except .interactive)` → `vignette (4)` → `indicator / menu / nav (18–20)` → `grain (40)` → `cursor (60)` → `preloader (70)`.

## Real client assets (GLB) beside the procedural watch

`src/data/watches/models.ts` registers a real asset per family (`MODELS`): head GLB, strap GLBs by construction, native finishes, the minimum quality tier and the clips to use. `resolveWatch` turns that plus the runtime context (quality, measured degradation, thumbnail mode, `?model=` override) into `ResolvedWatch.modelType`, and the renderer is part of `geometryKey`, so a change of renderer runs through the same dip transition as a family change.

`WatchRig` mounts `WatchModel` for every pooled product. `WatchModel` renders `ProceduralWatch` unless the product resolves to `"glb"`, and then mounts `GLBWatch` inside a `Suspense` (fallback: the procedural watch while the file loads) and an error boundary (fallback: the procedural watch if the rig throws). A failed download or Draco decode is remembered in `src/components/3d/glb/loader.ts`, which caches one parse per URL, serves the Draco decoder from `public/draco/`, and reports load metrics on `window.__veloris.glb`.

`GLBWatch` keeps the rig contract: the asset's semantic groups are offset by the same exploded-view table as the procedural parts, plates use `ExplodedLabel` with the same rows, the rotor is re-pivoted on the watch axis and shares `rotorState`, hour and minute hands are re-pivoted and show local time, the seconds hand and its train are turned directly about the dial normal from the clip's first frame, and the balance, escapement, pallet fork and hairspring clips loop as an idle. Finishes other than the authored silver tint the asset's `web_Steel_*` material families; straps without a real asset use the procedural strap on the real head (`strapInset` aligns it to the lugs).

Every asset follows one node convention: the root node carries scale and centring only (no rotation), children keep the dial normal on their local +Z, crown +X, 12 o'clock +Y, 1 unit = 20.5 mm at the root (Legacy root scale 1.3442, Heritage 1.4954 with the 40 mm case body at 1.9512 units). `FamilyModel` describes the rest of an asset with optional fields whose defaults are the Legacy names: `rootNode`, `parts` (top-level node → exploded part, now including `rehaut`), `hands` (hour / minute node names) and `dialVariants` (dial id → nodes). The hands axis is read from the node the seconds clip drives, so the seconds hand (Legacy) or its pivot (Heritage) need no naming rule.

Heritage (2026-09-28) runs through the same components with `MODELS.heritage`: a quartz head (`HeritageSeconds`, one linear turn on `SecondsPivot`; the clock steps whole seconds when `arch.movement === "quartz"`; no idle clips, no train, no rotor), two dial colours baked into one file and switched by visibility (`Dial`/`Rehaut` vs `Dial_Black`/`Rehaut_Black`, so a dial change stays inside the mounted model and never changes `geometryKey`), and two real straps by construction: `leather-black.glb` (the leather families take the product's strap colour; buckle and keepers follow the strap metal or the case finish) and `mesh-silver.glb` (tinted by the bracelet finish rules). The warm-up compiles hidden dial variants too (`compileSteps` toggles visibility for `renderer.compile`), so the first white → black switch builds no shader. Fallbacks are unchanged: below the medium tier, in thumbnail mode, after a measured degradation, on a failed download or on a runtime error the procedural Heritage renders. Build, scale evidence and QA: `docs/heritage-glb/README.md`.

`src/lib/perf.ts` samples frame time, draw calls and memory every frame (`window.__veloris.perf`). With a GLB on stage, three consecutive 180-frame windows above 40 ms average set `glbDegraded`, which switches the session to the procedural watch.

QA switches for the real assets live in `src/lib/qaflags.ts` (`?glbqa=…`, see `docs/legacy-glb/README.md`); `?perfhud=1` draws the perf sampler on screen.

When a client GLB is the active object (`useStore.glbOnStage`), `Lighting` switches to the studio profile (`STUDIO` in `Lighting.tsx`): the client's studio environment image for reflections, AgX tone mapping with an exposure multiplier on `rigState`, two rectangular strip lights and reduced key/rim/fill. The procedural watch keeps the original presets; any real asset (Legacy or Heritage) gets the studio profile.

**First-frame warm-up.** `Warmup` (in `Scene`) waits until the object on stage is mounted and its files parsed, then runs `renderer.compileAsync` over the scene, uploads every material texture with `initTexture`, lets four frames settle and sets `sceneWarm`. The preloader only leaves once `sceneWarm` is true (its 9 s safety timeout still applies), so shader compilation, texture uploads, the environment PMREM and the tone-mapping recompile never land inside the opening sequence. Pooled watches are compiled the same way: a new pool entry sits off-screen while `compileAsync` runs, then draws tiny for four frames to upload textures, then hides.

**Paper arrival.** A catalog sheet (`.catalog--paper`, `data-paper`) is solid document content that climbs over the scene. `ScrollChoreography`'s scroll callback derives the sheet's edge position and writes it as custom properties on the elements that consume them (never on the root: a root property changing every scrolled frame restyled ~300 elements per frame): `--paper-p` on `.nav`, `--cover-p` on the indicator and vignette, `--cover-in` on the stage under the sheet (its copy and controls dissolve before the edge reaches 40 % of the viewport) and `--sheet-in` on the sheet's own `.catalog__head`, which is revealed only once the sheet owns 60–85 % of the viewport. The handoff is a material edge, not a crossfade: the sheet is opaque with a straight, hard top edge and there is no light wash over the scene. The object's `recede` beat runs `catalog at -1.3 → -0.8`, so it has dimmed and stepped back before the edge reaches the dial.

**Pointer.** `src/lib/pointer.ts` holds the one authoritative pointer position from a single passive listener; consumers (magnetic buttons) run once per frame on GSAP's ticker and only on frames where the pointer moved, with each button's rectangle cached until scroll or resize, so pointer motion costs no layout reads and never creates React state. The custom cursor's dot is written by GSAP `quickTo` (50 ms) and its ring at 160 ms; the dot's state scale lives on an inner element so it never fights GSAP's transform. The watch's pointer parallax settles in ~170 ms (`WatchRig`), the cinematic camera keeps its own damping.

**Preloader exit.** The fade is a Web Animations opacity animation on the `.preloader` element, so it runs on the compositor and keeps its timing while the main thread is busy (a JS-ticked tween stalls with it). One `leave()` owns the exit: whichever path asks first (the normal warm path, or the 9 s safety) starts the only fade, and `loaded` flips when that fade finishes.

**Pixel budget.** `QUALITY_SETTINGS.<tier>.pixelBudget` caps the canvas DPR (`dprForViewport`) so the renderer never shades more than about 2.2 MP on high, 1.6 on medium, 1.2 on low. The renderer is fill-bound: a 2000 × 1054 Retina window at DPR 2 (8 MP) ran at 23 fps and made the wall-clock intro skip; at the budget it runs at 60 fps with a 2043 × 1076 canvas. The PerformanceMonitor still steps DPR down from there on decline.
