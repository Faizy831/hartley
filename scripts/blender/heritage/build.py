"""Heritage_Animation_export.blend → web-ready GLBs (Blender 4.2 headless). Never writes to the original.

Usage: blender -b --python scripts/blender/heritage/build.py   (then scripts/blender/heritage/pipeline.sh)

Geometry source: the client's "4. Silver Base with white face" head (all five heads share one topology; only slot
materials differ). The fused base mesh is split by material slot and, where a slot mixes parts, by loose parts
classified geometrically (crown vs indices, caseback wall vs crown tip, case vs hands post). Both glass slots are
classified by face height relative to the hands. Dial, caseback and the textured strap parts are baked with Cycles
(unlit emission bakes for colour / roughness / metallic, tangent-space normal bakes) so every web material is a plain
Principled setup with at most colour + metallicRoughness + normal textures on a single UV set.
The seconds hand keeps its dedicated pivot with a clean 60 s linear clip (HeritageSeconds). No camera, light or
presentation choreography is exported. Straps: black leather with silver buckle (modifiers applied) and the silver
mesh band (links decimated). Finish variants are handled by material families + the site's finish rules.
"""
import bpy, bmesh, json, math, os, re, sys
from mathutils import Vector, Matrix

REPO = os.environ.get("VELORIS_REPO", os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../..")))
ORIG = os.environ.get("HERITAGE_BLEND", os.path.join(REPO, "Heritage_Animation_export.blend"))  # never written to
OUT = os.path.join(REPO, "public/models/heritage")
DOCS = os.path.join(REPO, "docs/heritage-glb")
REPORT = os.path.join(DOCS, "build_report.json")
BAKE_DIR = os.environ.get("HERITAGE_BAKE_DIR", os.path.join(os.environ.get("TMPDIR", "/tmp"), "heritage-bake"))
WORK = os.environ.get("HERITAGE_WORK", "")  # optional: save the reduced working scene here for inspection
os.makedirs(OUT + "/straps", exist_ok=True); os.makedirs(DOCS, exist_ok=True); os.makedirs(BAKE_DIR, exist_ok=True)

SITE_MM_PER_UNIT = 20.5          # site convention (families.ts: radius = mm / 41)
CASE_MM = 40.0                   # Heritage case diameter (client spec, heritage.ts "Diameter 40 mm")
SCALE_OVERRIDE = float(os.environ["HERITAGE_SCALE"]) if os.environ.get("HERITAGE_SCALE") else None
LINK_TARGET_TRIS = 150_000

report = {"source": ORIG, "notes": [], "parts": {}, "materials": {}, "bakes": {}, "animations": {}, "straps": {}, "needsClientConfirmation": []}
def note(s): report["notes"].append(s); print("NOTE", s, flush=True)

STAGE = os.environ.get("HERITAGE_STAGE", "")   # optional: reduced scene + stash written after step 3 (fast re-runs with HERITAGE_RESUME=1)
RESUME = bool(os.environ.get("HERITAGE_RESUME")) and STAGE and os.path.exists(STAGE) and os.path.exists(STAGE + ".json")
def M2L(m): return [list(r) for r in m]
def L2M(l): return Matrix(l)
def tris_of(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)
if RESUME:
    bpy.ops.wm.open_mainfile(filepath=STAGE, load_ui=False)
    scene = bpy.context.scene; vl = bpy.context.view_layer; O = bpy.data.objects; scene.frame_set(1)
    stash = json.load(open(STAGE + ".json"))
    BASE = O[stash["BASE"]]; HOUR = O[stash["HOUR"]]; MINUTE = O[stash["MINUTE"]]; SEC_PARENT = O[stash["SEC_PARENT"]]; SECOND = O[stash["SECOND"]]; BLACK_BASE = O[stash["BLACK_BASE"]]
    HEAD_ROOT = O[stash["HEAD_ROOT"]]; STAGE_ROOT = O[stash["STAGE_ROOT"]]; LEATHER_ROOT = O[stash["LEATHER_ROOT"]]; BAND_ROOT = O[stash["BAND_ROOT"]]
    head_objs = [BASE, HOUR, MINUTE, SEC_PARENT, SECOND]; leather_objs = [O[n] for n in stash["leather_objs"]]; band_objs = [O[n] for n in stash["band_objs"]]; band_meshes = [O[n] for n in stash["band_meshes"]]
    leather_rel = {k: L2M(v) for k, v in stash["leather_rel"].items()}; band_rel = {k: L2M(v) for k, v in stash["band_rel"].items()}
    BASE_inv = L2M(stash["BASE_inv"]); H_inv = L2M(stash["H_inv"]); report.update(stash["report"]); keep = set(head_objs) | set(leather_objs) | set(band_objs) | {BLACK_BASE}
    black_dial_mats = {"dial": bpy.data.materials[stash["black_dial"]], "rehaut": bpy.data.materials[stash["black_rehaut"]]}
    def descend(o):
        yield o
        for c in o.children: yield from descend(c)
    print("RESUMED from", STAGE, flush=True)
else:
  bpy.ops.wm.open_mainfile(filepath=ORIG, load_ui=False)
  scene = bpy.context.scene; vl = bpy.context.view_layer; O = bpy.data.objects
  scene.frame_set(1)

  # ------------------------------------------------------------------ 0. source objects
  HEAD_ROOT = O["4. Silver Base with white face"]; BASE = O["1. Base Mesh.001"]
  HOUR = O["1. hour hand.001"]; MINUTE = O["1. Minute hand.001"]; SEC_PARENT = O["1. second hand parent.001"]; SECOND = O["1. second hand.001"]
  BLACK_BASE = O["1. Base Mesh"]                     # black-dial materials (slots 4 and 6)
  STAGE_ROOT = O["2. rose gold base with black face"]  # on stage at frame 1: reference pose shared by all five heads
  LEATHER_ROOT = O["leather black with silver"]; LEATHER_POSE = O["leather black with black"]  # same strap, on stage at frame 1
  BAND_ROOT = O["1. mesh band parent_silver.001"]     # on stage at frames 180–239
  BAND_STAGE_FRAME = 200

  def descend(o):
      yield o
      for c in o.children: yield from descend(c)

  # head frame: the silver base mesh as if its root stood on the stage pose (all heads share root rotation/scale)
  H = STAGE_ROOT.matrix_world @ (HEAD_ROOT.matrix_world.inverted() @ BASE.matrix_world)
  H_inv = H.inverted(); BASE_inv = BASE.matrix_world.inverted()

  # ------------------------------------------------------------------ 1. keep set, visibility, on-stage poses
  head_objs = [BASE, HOUR, MINUTE, SEC_PARENT, SECOND]
  LEATHER_ROOT.animation_data_clear()
  LEATHER_ROOT.matrix_world = LEATHER_POSE.matrix_world.copy()   # frame-1 pose of the identical black/black strap
  vl.update()
  leather_objs = [o for o in descend(LEATHER_ROOT) if o is not LEATHER_ROOT]
  band_objs = [o for o in descend(BAND_ROOT) if o is not BAND_ROOT]
  keep = set(head_objs) | set(leather_objs) | set(band_objs) | {LEATHER_ROOT, BAND_ROOT, HEAD_ROOT, STAGE_ROOT, BLACK_BASE}

  black_dial_mats = {"dial": BLACK_BASE.data.materials[4], "rehaut": BLACK_BASE.data.materials[6]}
  assert black_dial_mats["dial"].name.startswith("x WatchFace_black"), black_dial_mats["dial"].name
  assert black_dial_mats["rehaut"].name.startswith("x black mild"), black_dial_mats["rehaut"].name
  for m in black_dial_mats.values(): m.use_fake_user = True

  for lc in vl.layer_collection.children: lc.exclude = False
  for coll in bpy.data.collections: coll.hide_viewport = False; coll.hide_render = False
  for o in keep:
      if o.name not in scene.collection.objects: scene.collection.objects.link(o)
      o.hide_set(False); o.hide_viewport = False; o.hide_render = False

  # strap relative placements (computed at their on-stage frames, in the head frame)
  scene.frame_set(1); vl.update()
  leather_rel = {o.name: H_inv @ o.matrix_world for o in leather_objs}
  scene.frame_set(BAND_STAGE_FRAME); vl.update()
  report["straps"]["band_root_at_stage_frame"] = [round(v, 4) for v in BAND_ROOT.matrix_world.translation]
  band_rel = {o.name: H_inv @ o.matrix_world for o in band_objs}
  scene.frame_set(1); vl.update()

  # ------------------------------------------------------------------ 2. apply modifiers where geometry needs them (before curve objects go away)
  def freeze_modifiers(o, decimate=None):
      if decimate:
          d = o.modifiers.new("web_decimate", "DECIMATE"); d.ratio = decimate; d.use_collapse_triangulate = True
      deps = bpy.context.evaluated_depsgraph_get(); ev = o.evaluated_get(deps)
      me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=deps); me.name = o.data.name + "_web"
      old = o.data; o.modifiers.clear(); o.data = me
      if old.users == 0: bpy.data.meshes.remove(old)
  def tris_of(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)

  for o in leather_objs:
      if o.type == "MESH":
          before = tris_of(o); freeze_modifiers(o); report["straps"].setdefault("leather_modifiers", {})[o.name] = {"tris_before": before, "tris_after": tris_of(o)}
  freeze_modifiers(SECOND)  # Solidify

  # mesh band: decimate the link mesh to the target, the clasp parts moderately
  band_meshes = [o for o in band_objs if o.type == "MESH"]
  for o in list(band_meshes):
      if len(o.data.polygons) <= 1:  # the 1-triangle "sfsfs" stub
          band_meshes.remove(o); band_objs.remove(o); keep.discard(o); note(f"band: dropped {o.name} (1-face stub, material {o.data.materials[0].name if o.data.materials else None})"); bpy.data.objects.remove(o, do_unlink=True); continue
      before = tris_of(o)
      if before > 1_000_000: ratio = LINK_TARGET_TRIS / before
      elif before > 20_000: ratio = 0.35
      else: ratio = None
      freeze_modifiers(o, decimate=ratio)
      report["straps"].setdefault("band_decimation", {})[o.name] = {"tris_before": before, "ratio": ratio, "tris_after": tris_of(o)}

  # ------------------------------------------------------------------ 3. reduce the scene to the kept objects
  for o in list(bpy.data.objects):
      if o not in keep: bpy.data.objects.remove(o, do_unlink=True)
  for coll in list(bpy.data.collections):
      try:
          if not any(o in keep for o in coll.all_objects): bpy.data.collections.remove(coll)
      except Exception: pass
  for _ in range(3): bpy.data.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
  for o in keep: o.animation_data_clear()
  # free the frozen strap objects from their rigs (world matrices already captured relative to the head)
  helpers = [x for x in leather_objs + band_objs if x.type != "MESH"]
  leather_objs = [x for x in leather_objs if x.type == "MESH"]; band_objs = [x for x in band_objs if x.type == "MESH"]
  for o in leather_objs + band_objs: o.parent = None
  for o in helpers:
      keep.discard(o); bpy.data.objects.remove(o, do_unlink=True)
  for o in (HEAD_ROOT, STAGE_ROOT, LEATHER_ROOT, BAND_ROOT):
      keep.discard(o)
  for o in head_objs + [BLACK_BASE]:
      mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
  vl.update()

  if STAGE:
      stash = {"BASE": BASE.name, "HOUR": HOUR.name, "MINUTE": MINUTE.name, "SEC_PARENT": SEC_PARENT.name, "SECOND": SECOND.name, "BLACK_BASE": BLACK_BASE.name, "HEAD_ROOT": HEAD_ROOT.name, "STAGE_ROOT": STAGE_ROOT.name, "LEATHER_ROOT": LEATHER_ROOT.name, "BAND_ROOT": BAND_ROOT.name,
               "leather_objs": [o.name for o in leather_objs if o.type == "MESH"], "band_objs": [o.name for o in band_objs if o.type == "MESH"], "band_meshes": [o.name for o in band_meshes], "leather_rel": {k: M2L(v) for k, v in leather_rel.items()}, "band_rel": {k: M2L(v) for k, v in band_rel.items()},
               "BASE_inv": M2L(BASE_inv), "H_inv": M2L(H_inv), "report": report, "black_dial": black_dial_mats["dial"].name, "black_rehaut": black_dial_mats["rehaut"].name}
      json.dump(stash, open(STAGE + ".json", "w")); bpy.ops.wm.save_as_mainfile(filepath=STAGE, copy=True); print("STAGED", STAGE, flush=True)
# ------------------------------------------------------------------ helpers
def set_active(o, extra=()):
    bpy.ops.object.select_all(action="DESELECT")
    for e in extra: e.select_set(True)
    o.select_set(True); vl.objects.active = o
def separate(o, kind):
    set_active(o); bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type=kind); bpy.ops.object.mode_set(mode="OBJECT")
    return [x for x in bpy.context.selected_objects if x.type == "MESH"]
def join(target, others):
    if not others: return target
    set_active(target, others); bpy.ops.object.join(); return target
def single_material(o):
    idx = {p.material_index for p in o.data.polygons}
    mats = [o.data.materials[i] for i in sorted(idx)]
    remap = {i: k for k, i in enumerate(sorted(idx))}
    for p in o.data.polygons: p.material_index = remap[p.material_index]
    o.data.materials.clear()
    for m in mats: o.data.materials.append(m)
    return mats
def lbox(o):
    vs = [v.co for v in o.data.vertices]
    mn = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs))); mx = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
    return mn, mx
def lcentre(o): mn, mx = lbox(o); return (mn + mx) / 2
def face_stats(o):
    """area-weighted mean normal, mean z and bbox of all polygons (mesh-local)."""
    me = o.data; a = 0.0; n = Vector(); z = 0.0
    for p in me.polygons: a += p.area; n += p.normal * p.area; z += p.center.z * p.area
    mn, mx = lbox(o)
    return {"faces": len(me.polygons), "area": round(a, 4), "mean_normal": [round(v, 3) for v in (n / a if a else n)], "mean_z": round(z / a if a else 0, 4), "bbox_min": [round(v, 4) for v in mn], "bbox_max": [round(v, 4) for v in mx]}

# ------------------------------------------------------------------ 4. split the fused base mesh
BASE.name = "HeritageBase"
zmin_local, zmax_local = lbox(BASE)[0].z, lbox(BASE)[1].z
base_dims = lbox(BASE)[1] - lbox(BASE)[0]
pieces = separate(BASE, "MATERIAL")
by_mat = {}
for p in pieces:
    m = single_material(p); assert len(m) == 1, (p.name, [x.name for x in m]); by_mat.setdefault(m[0].name, []).append(p)
by_mat = {k: join(v[0], v[1:]) for k, v in by_mat.items()}
report["base_slots"] = {k: {"faces": len(v.data.polygons)} for k, v in by_mat.items()}

def take(prefix):
    ks = [k for k in by_mat if k.startswith(prefix)]
    assert len(ks) == 1, (prefix, ks); return by_mat.pop(ks[0]), ks[0]

parts = {}   # web name -> (object, family, extra)
# slot 0: case (+ the tiny hands post at the centre)
o, src = take("x metal shiny silver_0.005 bevel")
ps = separate(o, "LOOSE"); ps.sort(key=lambda x: -len(x.data.polygons))
parts["Case"] = (ps[0], "Case_Polished", src)
post = join(ps[1], ps[2:]) if len(ps) > 1 else None
if post: parts["Hands_Post"] = (post, "Indices", src); report["parts"]["Hands_Post"] = {"evidence": f"slot 0 loose part at the dial centre, {len(post.data.polygons)} faces, size {[round(v,4) for v in lbox(post)[1]-lbox(post)[0]]}"}
report["parts"]["Case"] = {"evidence": "largest loose part of slot 0 (case, lugs and bezel are one connected surface; not separable by slot)"}
# slot 1: solid caseback with engraved text (radial brushed + heritage mask)
o, src = take("x MetalStainlessSteelRadial002_2K_TEXT")
ps = separate(o, "LOOSE"); ps.sort(key=lambda x: -len(x.data.polygons))
parts["Caseback"] = (ps[0], "Caseback", src); caseback_extra = ps[1:]
report["parts"]["Caseback"] = {"evidence": f"slot 1 main loose part: {len(ps[0].data.polygons)} faces, mean normal {face_stats(ps[0])['mean_normal']} (faces −Z, the rear), radius from the axis; solid steel with the radial texture and the engraved mask"}
# slot 2: brushed 2K → caseback side wall + crown tip
o, src = take("x MetalStainlessSteelBrushed002_2K")
ps = separate(o, "LOOSE")
ring = [p for p in ps if lcentre(p).x < 0.5]; tip = [p for p in ps if lcentre(p).x >= 0.5]
assert ring and tip, [(p.name, lcentre(p)) for p in ps]
extra_faces = sum(len(p.data.polygons) for p in caseback_extra)
parts["Caseback_Ring"] = (join(ring[0], ring[1:] + caseback_extra), "Case_Brushed", src)
if caseback_extra: note(f"caseback: {extra_faces} side faces of the TEXT slot (a notch on the caseback wall) merged into Caseback_Ring")
parts["Crown_Tip"] = (join(tip[0], tip[1:]), "Case_Brushed", src)
report["parts"]["Caseback_Ring"] = {"evidence": "slot 2 loose part on the case axis (radius ≈0.42–0.43, below the caseback plane)"}
report["parts"]["Crown_Tip"] = {"evidence": "slot 2 loose part at x > 0.5 (crown side, +X)"}
# slot 3: polished 0.003 bevel → crown body + 12 indices (+ small extra markers)
o, src = take("x metal shiny silver_0.003 bevel")
ps = separate(o, "LOOSE")
crown = [p for p in ps if lcentre(p).x > 0.5 and len(p.data.polygons) > 200]; idx = [p for p in ps if p not in crown]
assert len(crown) == 1, [(p.name, len(p.data.polygons), lcentre(p)) for p in ps]
parts["Crown"] = (crown[0], "Crown_Polished", src)
parts["Indices"] = (join(idx[0], idx[1:]), "Indices", src)
report["parts"]["Crown"] = {"evidence": "slot 3 loose part at x > 0.5 with >200 faces (crown body)"}
report["parts"]["Indices"] = {"evidence": f"{len(idx)} remaining slot-3 loose parts around the dial (radius ≈0.43–0.60)"}
# slot 4: dial (white), slot 6: rehaut wall (white)
o, src = take("x WatchFace_white base and black")
ps = separate(o, "LOOSE"); ps.sort(key=lambda x: -face_stats(x)["mean_z"])
parts["Dial"] = (ps[0], "Dial_White", src)
for p in ps[1:]:
    note(f"dial: dropped hidden underside part ({len(p.data.polygons)} faces at z={face_stats(p)['mean_z']}, fully covered by the dial disc; it would overlap the planar bake)"); bpy.data.objects.remove(p, do_unlink=True)
report["parts"]["Dial"] = {"evidence": f"slot 4 loose part with the highest mean z ({face_stats(ps[0])['mean_z']}), facing +Z, {len(ps[0].data.polygons)} faces"}
o, src = take("x white mild reflective"); parts["Rehaut"] = (o, "Rehaut_White", src)
# glass slots: classify geometrically against the hands
g1, s1 = take("x Glass: Clear IOR1.008"); g2, s2 = take("x Glass: Clear IOR1.1")
hand_z = max((BASE_inv @ (HOUR.matrix_world @ v.co)).z for v in HOUR.data.vertices)
hand_z = max(hand_z, max((BASE_inv @ (SECOND.matrix_world @ v.co)).z for v in SECOND.data.vertices))
dial_z = face_stats(parts["Dial"][0])["mean_z"]
glass = {}
for g, s in ((g1, s1), (g2, s2)):
    st = face_stats(g); st["material"] = s; st["above_hands"] = st["bbox_min"][2] > hand_z; st["below_dial"] = st["bbox_max"][2] < dial_z
    glass[s] = st
report["glass_classification"] = {"hands_top_z": round(hand_z, 4), "dial_z": round(dial_z, 4), "base_z_range": [round(zmin_local, 4), round(zmax_local, 4)], "slots": glass}
assert all(v["above_hands"] for v in glass.values()) and not any(v["below_dial"] for v in glass.values()), glass
# both glass slots sit above the hands at the top of the case: flat faces (IOR 1.008) + bevelled rim (IOR 1.1). No caseback glass exists.
crystal = join(g1, [g2]); parts["Crystal"] = (crystal, ("Crystal", "Crystal_Edge"), (s1, s2))
report["parts"]["Crystal"] = {"evidence": "both glass slots lie above the hands (front): IOR 1.008 = top and underside discs, IOR 1.1 = bevelled rim; the rear is the solid engraved caseback (slot 1)"}
assert not by_mat, f"unclassified slots: {list(by_mat)}"

# black-dial twins (same geometry, client's black-variant materials), toggled by the site per dial colour
def twin(src_obj, name, mat):
    d = bpy.data.objects.new(name, src_obj.data.copy()); scene.collection.objects.link(d); d.matrix_world = src_obj.matrix_world.copy()
    d.data.materials.clear(); d.data.materials.append(mat); return d
parts["Dial_Black"] = (twin(parts["Dial"][0], "Dial_Black", black_dial_mats["dial"]), "Dial_Black", black_dial_mats["dial"].name)
parts["Rehaut_Black"] = (twin(parts["Rehaut"][0], "Rehaut_Black", black_dial_mats["rehaut"]), "Rehaut_Black", black_dial_mats["rehaut"].name)

# hands: their own objects; the second hand gets a fresh pivot
parts["Hour"] = (HOUR, "Hands", HOUR.data.materials[0].name); parts["Minute"] = (MINUTE, "Hands", MINUTE.data.materials[0].name); parts["Second"] = (SECOND, "Hands", SECOND.data.materials[0].name)
for name, (o, *_rest) in parts.items(): o.name = name

# ------------------------------------------------------------------ 5. baking (Cycles, unlit emission bakes + tangent normals)
# The client file links "Poliigon_Adjustments.001" from a missing library (colorbond.blend). The Radial002 (caseback) and
# Horsehide (leather) texture groups route through it and evaluate to black. A local copy with the same interface exists in
# the file; point every missing group reference at it before baking (this only affects the working scene).
local_groups = {g.name: g for g in bpy.data.node_groups if g.library is None}
for g in list(bpy.data.node_groups) + [m.node_tree for m in bpy.data.materials if m.use_nodes and m.node_tree]:
    for n in g.nodes:
        if n.type == "GROUP" and n.node_tree and n.node_tree.library:
            repl = local_groups.get(n.node_tree.name) or next((x for x in local_groups.values() if x.name.startswith(n.node_tree.name.split(".")[0])), None)
            assert repl, n.node_tree.name
            note(f"relinked missing library group '{n.node_tree.name}' in '{g.name}' to local '{repl.name}'"); n.node_tree = repl
scene.render.engine = "CYCLES"; scene.cycles.device = "CPU"; scene.cycles.use_denoising = False
scene.render.bake.use_selected_to_active = False; scene.render.bake.use_clear = True; scene.render.bake.margin = 8
CHANNEL = {"color": "Base Color", "rough": "Roughness", "metal": "Metallic"}
def emission_variant(mat, channel):
    m = mat.copy(); m.name = mat.name + "__bake_" + channel; nt = m.node_tree
    for n in list(nt.nodes):
        if n.type == "BSDF_PRINCIPLED":
            em = nt.nodes.new("ShaderNodeEmission"); sock = n.inputs[CHANNEL[channel]]
            if sock.is_linked: nt.links.new(sock.links[0].from_socket, em.inputs["Color"])
            else:
                v = sock.default_value
                em.inputs["Color"].default_value = (v[0], v[1], v[2], 1) if hasattr(v, "__len__") else (v, v, v, 1)
            for l in list(n.outputs["BSDF"].links): nt.links.new(em.outputs["Emission"], l.to_socket)
            nt.nodes.remove(n)
        elif n.type.startswith("BSDF_") or n.type in ("SUBSURFACE_SCATTERING", "HOLDOUT", "EMISSION", "PRINCIPLED_VOLUME", "VOLUME_ABSORPTION", "VOLUME_SCATTER"):
            em = nt.nodes.new("ShaderNodeEmission"); em.inputs["Color"].default_value = (0, 0, 0, 1)
            for out in n.outputs:
                for l in list(out.links): nt.links.new(em.outputs["Emission"], l.to_socket)
            nt.nodes.remove(n)
    return m
def uv_overlap(me, uv_name, res=256):
    """fraction of covered texels claimed by more than one face (0 = clean layout)."""
    uv = me.uv_layers[uv_name].data; grid = bytearray(res * res)
    for p in me.polygons:
        pts = [uv[l].uv for l in p.loop_indices]
        for i in range(1, len(pts) - 1):
            a, b, c = pts[0], pts[i], pts[i + 1]
            xs = [a.x, b.x, c.x]; ys = [a.y, b.y, c.y]
            x0, x1 = max(0, int(min(xs) * res)), min(res - 1, int(max(xs) * res)); y0, y1 = max(0, int(min(ys) * res)), min(res - 1, int(max(ys) * res))
            det = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)
            if abs(det) < 1e-12: continue
            for gy in range(y0, y1 + 1):
                py = (gy + 0.5) / res
                for gx in range(x0, x1 + 1):
                    px = (gx + 0.5) / res
                    l1 = ((b.x - px) * (c.y - py) - (c.x - px) * (b.y - py)) / det; l2 = ((c.x - px) * (a.y - py) - (a.x - px) * (c.y - py)) / det
                    if l1 >= -1e-6 and l2 >= -1e-6 and l1 + l2 <= 1 + 1e-6:
                        k = gy * res + gx
                        if grid[k] < 255: grid[k] += 1
    covered = sum(1 for v in grid if v); multi = sum(1 for v in grid if v > 1)
    return round(multi / covered, 4) if covered else 0.0
def planar_uv(o, name="web", axes=("x", "y"), pad=1.02):
    me = o.data; mn, mx = lbox(o); c = (mn + mx) / 2; size = max(getattr(mx - mn, axes[0]), getattr(mx - mn, axes[1])) * pad
    layer = me.uv_layers.new(name=name)
    for l in me.loops:
        v = me.vertices[l.vertex_index].co
        layer.data[l.index].uv = ((getattr(v, axes[0]) - getattr(c, axes[0])) / size + 0.5, (getattr(v, axes[1]) - getattr(c, axes[1])) / size + 0.5)
    return name
def smart_uv(o, name="web"):
    """fresh non-overlapping UV layout for baking parts whose source shaders address their own UV maps explicitly."""
    me = o.data; layer = me.uv_layers.new(name=name); me.uv_layers.active = layer
    set_active(o); bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02); bpy.ops.object.mode_set(mode="OBJECT")
    return name
def bake(o, uv_name, size, name, channels):
    """bake the object's single source material into PNGs; returns {channel: image}."""
    src = o.data.materials[0]; out = {}
    ov = uv_overlap(o.data, uv_name); report["bakes"][name] = {"uv": uv_name, "size": size, "overlap": ov, "source": src.name, "channels": channels}
    if ov > 0.05: note(f"bake {name}: UV '{uv_name}' overlaps ({ov:.1%} of texels) — baked anyway, check visually")
    for ch in channels:
        img = bpy.data.images.new(f"{name}_{ch}", size, size, alpha=False); img.colorspace_settings.name = "sRGB" if ch == "color" else "Non-Color"
        tmp = emission_variant(src, ch) if ch != "normal" else src.copy()
        node = tmp.node_tree.nodes.new("ShaderNodeTexImage"); node.image = img; tmp.node_tree.nodes.active = node
        o.data.materials[0] = tmp; set_active(o)
        scene.cycles.samples = 1 if ch != "normal" else 4
        if ch == "normal": bpy.ops.object.bake(type="NORMAL", normal_space="TANGENT", margin=8, use_clear=True, uv_layer=uv_name, target="IMAGE_TEXTURES")
        else: bpy.ops.object.bake(type="EMIT", margin=8, use_clear=True, uv_layer=uv_name, target="IMAGE_TEXTURES")
        path = os.path.join(BAKE_DIR, f"{name}_{ch}.png"); img.filepath_raw = path; img.file_format = "PNG"; img.save(); img.filepath = path; img.source = "FILE"; img.reload()
        o.data.materials[0] = src; bpy.data.materials.remove(tmp); out[ch] = img
    return out

# ------------------------------------------------------------------ 6. web materials
# family → Principled setup. Constants follow the client's silver materials (0.8 polished steel, roughness 0.039 → 0.05 as in
# the Legacy families); tinted finishes are applied at runtime through the site's finish rules (case / bracelet / furniture roles).
web_mats = {}
def find_image(*needles):
    c = [i for i in bpy.data.images if all(n in i.name for n in needles)]; c.sort(key=lambda i: i.name); return c[0] if c else None
def new_web_material(fam):
    m = bpy.data.materials.new("web_" + fam); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled"); nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m, nt, bsdf
def tex_node(nt, img, uv=None, mapping=None):
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = img
    if uv or mapping:
        u = nt.nodes.new("ShaderNodeUVMap")
        if uv: u.uv_map = uv
        if mapping:
            mp = nt.nodes.new("ShaderNodeMapping"); sc, rot = mapping; mp.inputs["Scale"].default_value = (sc, sc, 1); mp.inputs["Rotation"].default_value = (0, 0, math.radians(rot))
            nt.links.new(u.outputs["UV"], mp.inputs["Vector"]); nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
        else: nt.links.new(u.outputs["UV"], t.inputs["Vector"])
    return t
def material_constant(fam, base, metallic, rough, glass=False, ior=1.5):
    if fam in web_mats: return web_mats[fam]
    m, nt, b = new_web_material(fam)
    b.inputs["Base Color"].default_value = (*base, 1); b.inputs["Metallic"].default_value = metallic; b.inputs["Roughness"].default_value = rough
    if glass: b.inputs["Transmission Weight"].default_value = 1.0; b.inputs["IOR"].default_value = ior
    web_mats[fam] = m; report["materials"][fam] = {"base": base, "metallic": metallic, "roughness": rough, "glass": glass, "textures": {}}; return m
def material_baked(fam, imgs, uv, base=None, metallic=None, rough=None):
    m, nt, b = new_web_material(fam); used = {}
    if "color" in imgs: t = tex_node(nt, imgs["color"], uv); nt.links.new(t.outputs["Color"], b.inputs["Base Color"]); used["baseColor"] = imgs["color"].name
    else: b.inputs["Base Color"].default_value = (*base, 1)
    if "rough" in imgs: t = tex_node(nt, imgs["rough"], uv); nt.links.new(t.outputs["Color"], b.inputs["Roughness"]); used["roughness"] = imgs["rough"].name
    else: b.inputs["Roughness"].default_value = rough
    if "metal" in imgs: t = tex_node(nt, imgs["metal"], uv); nt.links.new(t.outputs["Color"], b.inputs["Metallic"]); used["metallic"] = imgs["metal"].name
    else: b.inputs["Metallic"].default_value = metallic
    if "normal" in imgs:
        t = tex_node(nt, imgs["normal"], uv); nm = nt.nodes.new("ShaderNodeNormalMap"); nm.uv_map = uv; nt.links.new(t.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], b.inputs["Normal"]); used["normal"] = imgs["normal"].name
    web_mats[fam] = m; report["materials"][fam] = {"textures": used, "base": base, "metallic": metallic, "roughness": rough}; return m
BRUSHED_COL = find_image("MetalStainlessSteelBrushed002_COL_2K_METALNESS"); BRUSHED_ROUGH = find_image("MetalStainlessSteelBrushed002_ROUGHNESS_2K_METALNESS")
assert BRUSHED_COL and BRUSHED_ROUGH, [i.name for i in bpy.data.images if "Brushed002" in i.name][:10]
BRUSHED_COL.colorspace_settings.name = "sRGB"; BRUSHED_ROUGH.colorspace_settings.name = "Non-Color"
def material_brushed(fam, uv):
    """client 'MetalStainlessSteelBrushed002_2K' group: UV scale 0.5, rotation 90°, colour + roughness maps (the 16-bit normal map is
    near-flat and would not survive 8-bit export; the brushing reads from the colour/roughness streaks)."""
    if fam in web_mats: return web_mats[fam]
    m, nt, b = new_web_material(fam); b.inputs["Metallic"].default_value = 1.0
    t = tex_node(nt, BRUSHED_COL, uv, (0.5, 90)); nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    t2 = tex_node(nt, BRUSHED_ROUGH, uv, (0.5, 90)); nt.links.new(t2.outputs["Color"], b.inputs["Roughness"])
    web_mats[fam] = m; report["materials"][fam] = {"textures": {"baseColor": BRUSHED_COL.name, "roughness": BRUSHED_ROUGH.name}, "uv_transform": [0.5, 90], "metallic": 1.0}; return m

def real_uvs(me): return [l for l in me.uv_layers if not l.name.startswith(".")]  # skip Blender's internal .vs/.es/.pn layers
def remove_uv(me, name):
    # uv_layers.remove() trips over the imported meshes' stale ".vs/.es" selection sub-layers; remove them (and the map) as attributes
    for sub in (".vs." + name, ".es." + name, ".pn." + name):
        if sub in me.attributes: me.attributes.remove(me.attributes[sub])
    me.attributes.remove(me.attributes[name])
def keep_only_uv(o, name):
    me = o.data
    for nm in [l.name for l in real_uvs(me)]:
        if nm != name: remove_uv(me, nm)
    if name and name in me.uv_layers:
        me.uv_layers[name].name = "UVMap"; me.uv_layers["UVMap"].active_render = True; me.uv_layers.active = me.uv_layers["UVMap"]
def unify_material(o, mat):
    o.data.materials.clear(); o.data.materials.append(mat)
    for p in o.data.polygons: p.material_index = 0
def strip_uv(o):
    for nm in [l.name for l in real_uvs(o.data)]: remove_uv(o.data, nm)

# head materials
unify_material(parts["Case"][0], material_constant("Case_Polished", (0.8, 0.8, 0.8), 1.0, 0.05)); strip_uv(parts["Case"][0])
unify_material(parts["Crown"][0], material_constant("Crown_Polished", (0.8, 0.8, 0.8), 1.0, 0.05)); strip_uv(parts["Crown"][0])
unify_material(parts["Indices"][0], material_constant("Indices", (0.8, 0.8, 0.8), 1.0, 0.05)); strip_uv(parts["Indices"][0])
if "Hands_Post" in parts: unify_material(parts["Hands_Post"][0], web_mats["Indices"]); strip_uv(parts["Hands_Post"][0])
for name in ("Hour", "Minute", "Second"): parts[name][0].data.materials.clear(); parts[name][0].data.materials.append(material_constant("Hands", (0.8, 0.8, 0.8), 1.0, 0.05)); strip_uv(parts[name][0])
parts["Rehaut"][0].data.materials[0] = material_constant("Rehaut_White", (0.806, 0.806, 0.806), 0.0, 0.136); strip_uv(parts["Rehaut"][0])
parts["Rehaut_Black"][0].data.materials[0] = material_constant("Rehaut_Black", (0.002, 0.002, 0.002), 0.0, 0.136); strip_uv(parts["Rehaut_Black"][0])
cr = parts["Crystal"][0]; cr.data.materials[0] = material_constant("Crystal", (1, 1, 1), 0.0, 0.0, glass=True); cr.data.materials[1] = material_constant("Crystal_Edge", (1, 1, 1), 0.0, 0.2, glass=True); strip_uv(cr)
# brushed parts keep the client's implicit UV (the mesh's render-active layer, as the client material reads it)
for name in ("Caseback_Ring", "Crown_Tip"):
    o = parts[name][0]; uv = o.data.uv_layers.active_render_name if hasattr(o.data.uv_layers, "active_render_name") else [l.name for l in real_uvs(o.data) if l.active_render][0]
    keep_only_uv(o, uv); unify_material(o, material_brushed("Case_Brushed", "UVMap"))
# dial / caseback: planar bake UV, Cycles bakes, then a plain textured material
for name, fam, size, chans in (("Dial", "Dial_White", 2048, ["color", "rough", "metal", "normal"]), ("Dial_Black", "Dial_Black", 2048, ["color", "rough", "normal"]), ("Caseback", "Caseback", 1024, ["color", "rough", "normal"])):
    o = parts[name][0]; uv = planar_uv(o)
    imgs = bake(o, uv, size, name, chans); keep_only_uv(o, uv)
    o.data.materials[0] = material_baked(fam, imgs, "UVMap", metallic=(0.0 if name == "Dial_Black" else 1.0))
    if name == "Caseback": report["materials"][fam]["note"] = "metallic 1.0 constant: both client branches are metals (radial steel 1.0 / engraved text 0.359); the text reads through baked colour + roughness"

# ------------------------------------------------------------------ 7. hierarchy + transform (head)
case_dia_src = base_dims.x  # widest extent of the case body without lugs (slot 0 x-extent: ±0.6524); lugs run along Y
case_body = lbox(parts["Case"][0]); case_dia_src = case_body[1].x - case_body[0].x
lug_span_src = case_body[1].y - case_body[0].y
SCALE = SCALE_OVERRIDE or (CASE_MM / SITE_MM_PER_UNIT) / case_dia_src
centre_local = Vector((0.0, 0.0, (zmin_local + zmax_local) / 2))
Rfix = Matrix.Rotation(math.radians(90), 4, "X")  # local Z (dial normal) → Blender −Y → glTF +Z; local Y (12 o'clock) → glTF +Y; crown stays +X
ROOT_M = Rfix @ Matrix.Scale(SCALE, 4) @ Matrix.Translation(-centre_local)
report["scale"] = {"source_case_body_diameter": round(case_dia_src, 4), "source_lug_to_lug": round(lug_span_src, 4), "source_thickness": round(zmax_local - zmin_local, 4), "source_crystal_diameter": round(lbox(parts["Crystal"][0])[1].x - lbox(parts["Crystal"][0])[0].x, 4),
                   "scale": round(SCALE, 4), "site_mm_per_unit": SITE_MM_PER_UNIT, "case_mm": CASE_MM, "legacy_scale_for_reference": 1.3442,
                   "final_units": {"case_body_diameter": round(case_dia_src * SCALE, 4), "lug_to_lug": round(lug_span_src * SCALE, 4), "thickness": round((zmax_local - zmin_local) * SCALE, 4)},
                   "final_mm_at_site_scale": {"case_body_diameter": round(case_dia_src * SCALE * SITE_MM_PER_UNIT, 2), "lug_to_lug": round(lug_span_src * SCALE * SITE_MM_PER_UNIT, 2), "thickness": round((zmax_local - zmin_local) * SCALE * SITE_MM_PER_UNIT, 2)}}

root = bpy.data.objects.new("HeritageWatch", None); scene.collection.objects.link(root); root.matrix_world = ROOT_M
hands = bpy.data.objects.new("Hands", None); scene.collection.objects.link(hands); hands.parent = root
pivot = bpy.data.objects.new("SecondsPivot", None); scene.collection.objects.link(pivot); pivot.parent = hands
def place(o, parent, local):
    o.parent = parent; o.matrix_parent_inverse.identity(); o.matrix_basis = local
rel = {n: BASE_inv @ p[0].matrix_world for n, p in parts.items()}  # base-local frames (captured before re-parenting)
for name in ("Case", "Crown", "Crown_Tip", "Caseback", "Caseback_Ring", "Dial", "Dial_Black", "Rehaut", "Rehaut_Black", "Crystal", "Indices", "Hands_Post"):
    if name in parts: place(parts[name][0], root, rel[name])
# hands: pivots at the authored axis, rotation reset so 0 = 12 o'clock (all hand meshes extend along their local +Y)
def z_only(M):
    loc = M.to_translation(); return Matrix.Translation(loc)
for name in ("Hour", "Minute"):
    M = rel[name]; place(parts[name][0], hands, z_only(M)); report["parts"][name] = {"pivot": [round(v, 4) for v in M.to_translation()], "authored_rotation_z_deg": round(math.degrees(M.to_euler().z), 2), "exported_rotation_z_deg": 0.0}
piv_rel = BASE_inv @ SEC_PARENT.matrix_world; sec_rel = piv_rel.inverted() @ rel["Second"]
place(pivot, hands, z_only(piv_rel)); place(parts["Second"][0], pivot, z_only(sec_rel))
report["parts"]["SecondsPivot"] = {"pivot": [round(v, 4) for v in piv_rel.to_translation()], "authored_rotation_z_deg_frame1": round(math.degrees(piv_rel.to_euler().z), 2)}
report["parts"]["Second"] = {"authored_local_rotation_z_deg": round(math.degrees(sec_rel.to_euler().z), 2), "exported_rotation_z_deg": 0.0}
note("hands exported at rotation 0 = 12 o'clock (the client pose was a fixed presentation time); the site drives hour/minute from the clock and the seconds pivot plays HeritageSeconds")
if "Hands_Post" in parts: place(parts["Hands_Post"][0], hands, rel["Hands_Post"])
bpy.data.objects.remove(SEC_PARENT, do_unlink=True)
for o in (HEAD_ROOT, STAGE_ROOT, LEATHER_ROOT, BAND_ROOT, BLACK_BASE):
    try: bpy.data.objects.remove(o, do_unlink=True)
    except ReferenceError: pass

# ------------------------------------------------------------------ 8. the seconds clip: one clockwise turn in 60 s, linear
scene.render.fps = 30; scene.frame_start = 1; scene.frame_end = 1801
pivot.rotation_mode = "XYZ"; pivot.rotation_euler = (0, 0, 0)
pivot.keyframe_insert("rotation_euler", index=2, frame=1)
pivot.rotation_euler.z = -2 * math.pi; pivot.keyframe_insert("rotation_euler", index=2, frame=1801)
pivot.rotation_euler.z = 0
act = pivot.animation_data.action; act.name = "HeritageSeconds"
for fc in act.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = "LINEAR"
report["animations"]["HeritageSeconds"] = {"node": "SecondsPivot", "frames": [1, 1801], "seconds": 60.0, "rotation": "0 → −360° about the dial normal (clockwise seen from the front), LINEAR", "source": "1. second hand parent.001Action (frames 1–1801, LINEAR, −6.2832 rad)"}
for a in list(bpy.data.actions):
    if a is not act: bpy.data.actions.remove(a)

# ------------------------------------------------------------------ 9. straps
# 9a. black leather, silver buckle
strap_root = bpy.data.objects.new("HeritageStrap_LeatherBlack", None); scene.collection.objects.link(strap_root); strap_root.matrix_world = ROOT_M
halves = [o for o in leather_objs if o.type == "MESH" and o.name.startswith("leather strap")]
lock = [o for o in leather_objs if o.type == "MESH" and o.name.startswith("metal lock")][0]
longest = max(halves, key=lambda h: len(h.data.polygons))
def strap_name(o): return "Strap_Long" if o is longest else "Strap_Short"  # the straps are modelled as a worn wrist loop under the head; halves differ by length
for o in halves + [lock]:
    M = leather_rel[o.name]; o.name = strap_name(o) if o in halves else "Buckle"; place(o, strap_root, M)
    report["straps"].setdefault("leather_parts", {})[o.name] = {"centre_head_frame": [round(v, 4) for v in (M @ lcentre(o))], "tris": tris_of(o)}
# leather halves: separate by material, bake the textured slots, join back with one material per slot
# stitching: the client's FabricRope group reads the render UV, which is degenerate on the stitch faces (one texel) → a constant is faithful
# lining: procedural felt + logo masks on their own UV maps → baked onto a smart-projected layout
LEATHER_FAM = {"Leather_texture": ("Leather", 2048, ["rough", "normal"], False), "FabricRope": ("Leather_Stitch", None, None, False), "Metal_hartley_leatherbuckle": ("Bracelet_Keeper", None, None, False), "felt_basic": ("Leather_Lining", 512, ["color", "normal"], True)}
for h in halves:
    hname = h.name; ps = separate(h, "MATERIAL"); keepers = []
    for p in ps:
        m = single_material(p)[0]; fam = None
        for k, v in LEATHER_FAM.items():
            if m.name.startswith(k): fam = v
        assert fam, m.name
        famname, size, chans, fresh = fam; uv = smart_uv(p) if fresh else [l.name for l in real_uvs(p.data) if l.active_render][0]
        if chans:
            imgs = bake(p, uv, size, f"{hname}_{famname}", chans); keep_only_uv(p, uv)
            base = {"Leather": (0.01, 0.01, 0.01), "Leather_Lining": None}[famname]
            p.data.materials[0] = material_baked(f"{famname}_{hname}", imgs, "UVMap", base=base, metallic=0.0, rough=0.677)
        elif famname == "Leather_Stitch":
            p.data.materials[0] = material_constant("Leather_Stitch", (0.007, 0.005, 0.003), 0.0, 0.6); strip_uv(p)
        else:
            p.data.materials[0] = material_constant("Bracelet_Keeper", (0.8, 0.8, 0.8), 1.0, 0.2); strip_uv(p)
        keepers.append(p)
    h2 = join(keepers[0], keepers[1:]); h2.name = hname
report["straps"]["leather_note"] = "Bevel + Subdivision (level 1) + Curve modifiers applied at the frame-1 pose; buckle keepers use a constant polished material (the client's engraved detail is sub-pixel at web size)"
# buckle (metal lock): silver variant material, engraved HARTLEY via baked roughness/normal on its 'hartley text' UV
uv = smart_uv(lock)  # the buckle's logo shader addresses its 'hartley text' map explicitly; its render UV covers only the logo faces
imgs = bake(lock, uv, 1024, "Buckle", ["rough", "normal"]); keep_only_uv(lock, uv)
lock.data.materials.clear(); lock.data.materials.append(material_baked("Bracelet_Buckle", imgs, "UVMap", base=(0.668, 0.668, 0.668), metallic=1.0))

# 9b. silver mesh band
band_root = bpy.data.objects.new("HeritageStrap_MeshSilver", None); scene.collection.objects.link(band_root); band_root.matrix_world = ROOT_M
band_names = {}
for o in band_meshes:
    M = band_rel[o.name]; src = o.data.materials[0].name if o.data.materials else ""
    n = len(o.data.polygons); dims = lbox(o)[1] - lbox(o)[0]
    if "hartley_mesh" in src: name = "Mesh_Clasp_Plate"
    elif tris_of(o) >= 100_000: name = "Mesh_Links"
    elif "Brushed002_2K" in src: name = "Mesh_Clasp_Insert"
    elif max(dims) < 0.05: name = "Mesh_Clasp_Pin"
    else: name = None
    band_names[o.name] = (name, M, src, dims)
rest = [k for k, v in band_names.items() if v[0] is None]
for k in rest:  # end pieces at the lugs (small |z| in the head frame), named by side; bars (square section) vs end links
    name, M, src, dims = band_names[k]; c = M @ lcentre(O[k]); side = "12" if c.y > 0 else "6"
    kind = "Bar" if abs(dims.y - dims.z) < 0.02 else "EndLink"
    nm = f"Mesh_{kind}_{side}"; 
    if any(v[0] == nm for v in band_names.values()): nm += "_B"
    band_names[k] = (nm, M, src, dims)
for k, v in list(band_names.items()):
    if v[0] == "Mesh_Clasp_Pin":
        c = v[1] @ lcentre(O[k]); band_names[k] = (f"Mesh_Pin_{'12' if c.y > 0 else '6'}", v[1], v[2], v[3])
for o in band_meshes:
    name, M, src, dims = band_names[o.name]; o.name = name; place(o, band_root, M)
    report["straps"].setdefault("band_parts", {})[name] = {"source": src, "tris": tris_of(o), "size": [round(v, 4) for v in dims], "centre_head_frame": [round(v, 4) for v in (M @ lcentre(o))]}
    if name == "Mesh_Clasp_Plate":
        uv = "map1"; imgs = bake(o, uv, 1024, "Mesh_Clasp_Plate", ["color", "rough", "normal"]); keep_only_uv(o, uv)
        o.data.materials.clear(); o.data.materials.append(material_baked("Bracelet_Clasp", imgs, "UVMap", metallic=1.0))
    elif name == "Mesh_Clasp_Insert":
        uv = [l.name for l in real_uvs(o.data) if l.active_render][0]; keep_only_uv(o, uv)
        o.data.materials.clear(); o.data.materials.append(material_brushed("Bracelet_Brushed", "UVMap"))
    else:
        o.data.materials.clear(); o.data.materials.append(material_constant("Bracelet_Polished", (0.9, 0.9, 0.9), 1.0, 0.05)); strip_uv(o)

# ------------------------------------------------------------------ 9c. node convention: dial normal = local +Z in every node (as the Legacy asset)
# The rotation that turns the client's base-local frame (dial along +Z_blender) into the export frame (dial along −Y_blender,
# i.e. glTF +Z) is folded into every child transform and every mesh, so the roots carry only scale + centring and each
# node's own frame has the dial normal on its local Z. The runtime relies on that for explode offsets and hand pivots.
Rfix3 = Rfix.to_3x3(); Rfix_inv = Rfix.inverted()
ROOT_M = Matrix.Scale(SCALE, 4) @ Matrix.Translation(-(Rfix3 @ centre_local))
done_meshes = set()
for top in (root, strap_root, band_root):
    top.matrix_world = ROOT_M
    for o in descend(top):
        if o is top: continue
        o.matrix_basis = Rfix @ o.matrix_basis @ Rfix_inv
        if o.type == "MESH" and o.data.name not in done_meshes:
            o.data.transform(Rfix); done_meshes.add(o.data.name)
vl.update()
# the seconds turn: the dial normal is now the pivot's local −Y (Blender), so the same physical rotation keys rotation_euler.y = +2π
for fc in list(act.fcurves): act.fcurves.remove(fc)
pivot.rotation_euler = (0, 0, 0); pivot.keyframe_insert("rotation_euler", index=1, frame=1)
pivot.rotation_euler.y = 2 * math.pi; pivot.keyframe_insert("rotation_euler", index=1, frame=1801)
pivot.rotation_euler = (0, 0, 0)
for fc in act.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = "LINEAR"
report["animations"]["HeritageSeconds"]["rotation"] = "0 → −360° about the dial normal (glTF local +Z of SecondsPivot; clockwise seen from the front), LINEAR"
report["scale"]["node_convention"] = "roots: scale + centring only (rotation identity); every node's local frame has the dial normal on +Z, crown +X, 12 o'clock +Y (same convention as the Legacy asset)"

# ------------------------------------------------------------------ 10. export
for o in bpy.data.objects:
    if o.name not in scene.collection.objects: scene.collection.objects.link(o)
    o.hide_set(False); o.hide_viewport = False; o.hide_render = False
    if o.type == "MESH": o.data.name = o.name  # three.js names multi-primitive children after the mesh data
vl.update()
def export(objs, path):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs: o.select_set(True)
    vl.objects.active = objs[0]
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=False, export_animations=True, export_animation_mode="ACTIONS", export_nla_strips=False, export_frame_range=False, export_force_sampling=True, export_frame_step=10, export_anim_slide_to_zero=True, export_morph=False, export_cameras=False, export_lights=False, export_yup=True, export_image_format="AUTO", export_jpeg_quality=90, export_draco_mesh_compression_enable=False, export_texcoords=True, export_normals=True, export_tangents=False, export_skins=False, export_extras=False, export_optimize_animation_size=False)
    print("EXPORTED", path, os.path.getsize(path), flush=True)
export(list(descend(root)), OUT + "/heritage-head.glb")
export(list(descend(strap_root)), OUT + "/straps/leather-black.glb")
export(list(descend(band_root)), OUT + "/straps/mesh-silver.glb")

def tree(o, d=0):
    lines = ["  " * d + o.name + (f"  [{', '.join(m.name for m in o.data.materials)}] {tris_of(o)} tris" if o.type == "MESH" else "")]
    for c in sorted(o.children, key=lambda c: c.name): lines += tree(c, d + 1)
    return lines
report["hierarchy"] = {"head": tree(root), "leather": tree(strap_root), "band": tree(band_root)}
report["totals"] = {"head_tris": sum(tris_of(o) for o in descend(root) if o.type == "MESH"), "leather_tris": sum(tris_of(o) for o in descend(strap_root) if o.type == "MESH"), "band_tris": sum(tris_of(o) for o in descend(band_root) if o.type == "MESH")}
if WORK: bpy.ops.wm.save_as_mainfile(filepath=WORK, copy=True)
json.dump(report, open(REPORT, "w"), indent=1)
print("EXPORT DONE", json.dumps(report["totals"]), json.dumps(report["scale"]), flush=True)
