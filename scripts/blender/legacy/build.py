"""Legacy_Animation_export.blend → web-ready GLBs (Blender 4.2 headless). Never writes to the original.

Usage: blender -b --python scripts/blender/legacy/build.py   (then scripts/blender/legacy/pipeline.sh)
Geometry comes from the gold tree (on stage at frame 1, carries the animations); materials come from the
client's silver variant, matched per part by mesh signature, and are split into separated web families.
Meshes are triangulated at export so MikkTSpace tangents can be written for the anisotropic families;
two-key (uniform rotation) actions are set to linear before baking.
"""
import bpy, json, os, re, math
from mathutils import Vector

REPO = os.environ.get("VELORIS_REPO", os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../..")))
ORIG = os.environ.get("LEGACY_BLEND", os.path.join(REPO, "Legacy_Animation_export.blend"))  # never written to
WORK = os.environ.get("LEGACY_WORK", "/tmp/legacy_work.blend")  # derived working copy (≈300 MB)
OUT = os.path.join(REPO, "public/models/legacy")
REPORT = os.path.join(REPO, "docs/legacy-glb/build_report.json")
os.makedirs(OUT + "/straps", exist_ok=True)
report = {"needsClientConfirmation": ["Hand_Minute / Hand_Hour: assigned by length (Object019.014 longer than Object019.017); confirm", "Hands_Cap (Object019.016) and Dial_Detail_Cylinder_049: small parts in front of the dial, function unknown", "Dial_Plate colour: source 'Material' is a mix graph; exported as near-black satin"], "unclassified": [], "mapping": {}, "materials": {}, "images": {}, "animations": {}, "removed_animations": [], "notes": []}

bpy.ops.wm.open_mainfile(filepath=ORIG, load_ui=False)
bpy.ops.wm.save_as_mainfile(filepath=WORK, copy=False)  # all edits happen in this copy
scene = bpy.context.scene
scene.frame_set(1)  # frame 1: the gold watch is on set (frame 0 parks it)

HIDDEN = {o.name for o in bpy.data.objects if o.hide_render or o.hide_viewport}

# The exported geometry comes from the gold tree (it is on stage at frame 1 and carries the animations), but
# its materials are taken from the client's SILVER variant: each gold part is matched to its silver twin by
# base-mesh signature (vertex/face counts + local extents) and the twin's material slots are used.
def _sig(o):
    me = o.data
    if not me.vertices: return (0, 0)
    xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]; zs = [v.co.z for v in me.vertices]
    return (len(me.vertices), len(me.polygons), round(max(xs) - min(xs), 3), round(max(ys) - min(ys), 3), round(max(zs) - min(zs), 3))
def _descend(o):
    yield o
    for c in o.children: yield from _descend(c)
_silver_by_sig = {}
for _o in _descend(bpy.data.objects["2. silver"]):
    if _o.type == "MESH": _silver_by_sig.setdefault(_sig(_o), []).append(_o)
SILVER_SLOTS = {}   # gold object name -> [silver material names per slot]
for _o in _descend(bpy.data.objects["1. gold"]):
    if _o.type != "MESH": continue
    cands = _silver_by_sig.get(_sig(_o), [])
    slots = [[m.name if m else None for m in c.data.materials] for c in cands]
    if cands and all(sl == slots[0] for sl in slots):
        SILVER_SLOTS[_o.name] = (cands[0].name, slots[0])
report["silver_match"] = {"matched": len(SILVER_SLOTS), "unmatched": [o.name for o in _descend(bpy.data.objects["1. gold"]) if o.type == "MESH" and o.name not in SILVER_SLOTS]}
# objects whose collections are excluded from the view layer or hidden (e.g. the client's "cutter" collection of boolean helpers)
hidden_cols = set()
def _walk(lc, excluded, hidden):
    excluded = excluded or lc.exclude; hidden = hidden or lc.hide_viewport or lc.collection.hide_viewport or lc.collection.hide_render
    if excluded or hidden: hidden_cols.add(lc.collection.name)
    for c in lc.children: _walk(c, excluded, hidden)
_walk(bpy.context.view_layer.layer_collection, False, False)
for o in bpy.data.objects:
    if o.users_collection and all(c.name in hidden_cols for c in o.users_collection): HIDDEN.add(o.name)

ROOT = bpy.data.objects["1. gold"]
def descend(o):
    yield o
    for c in o.children: yield from descend(c)
keep = set(descend(ROOT))
BAND_ROOT = bpy.data.objects["1.  metal band parent"]
band_set = set(descend(BAND_ROOT))

# ------------------------------------------------------------------ 4. geometry: apply modifiers (except shape-keyed hairspring), decimate the heavy ones
deps = bpy.context.evaluated_depsgraph_get()
DECIMATE = {"watch base.003": 0.28, "watch band left.011": 0.45, "top plate_2.019": 0.6, "BARREL & RACHET WHEEL.002": 0.6, "hartley front.001": 0.5, "Circle.016": 0.6}
for o in list(keep):
    if o.type != "MESH": continue
    if o.data.shape_keys:
        for m in list(o.modifiers):
            if m.type == "NODES": o.modifiers.remove(m)  # auto-smooth: cannot apply with shape keys
        report["notes"].append(f"{o.name}: shape keys kept, Solidify left unapplied (flat hairspring ribbon)")
        continue
    for m in o.modifiers:
        if m.type == "SUBSURF": m.levels = min(m.levels, 1); m.render_levels = m.levels
    if o.name in DECIMATE:
        d = o.modifiers.new("web_decimate", "DECIMATE"); d.ratio = DECIMATE[o.name]
    # tangents: Blender's glTF exporter can only compute MikkTSpace tangents on triangulated meshes
    tri = o.modifiers.new("web_triangulate", "TRIANGULATE"); tri.keep_custom_normals = True; tri.quad_method = "BEAUTY"; tri.ngon_method = "BEAUTY"
    deps = bpy.context.evaluated_depsgraph_get()
    ev = o.evaluated_get(deps)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=deps)
    me.name = o.data.name + "_web"
    old = o.data
    o.modifiers.clear()
    o.data = me
    if old.users == 0: bpy.data.meshes.remove(old)

# ------------------------------------------------------------------ 1. clean scene
for o in list(bpy.data.objects):
    if o not in keep:
        bpy.data.objects.remove(o, do_unlink=True)
for coll in list(bpy.data.collections):
    if not any(o in keep for o in coll.all_objects) and len(coll.children) == 0:
        try: bpy.data.collections.remove(coll)
        except Exception: pass

# ------------------------------------------------------------------ 2. animation hygiene
KEEP_ACTIONS = {}
for o in keep:
    ad = o.animation_data
    if not ad or not ad.action: continue
    a = ad.action
    changing = [f for f in a.fcurves if len({round(p.co[1], 4) for p in f.keyframe_points}) > 1]
    is_parking = o.type == "EMPTY"  # root turn, master/band parking
    if is_parking or not changing:
        report["removed_animations"].append({"object": o.name, "action": a.name, "reason": "staging/parking/beauty-turn" if is_parking else "static"})
        o.animation_data_clear()
    else:
        KEEP_ACTIONS[o.name] = a
# constraints in the client rig (Child Of / pivots) would otherwise be lost or doubled by re-parenting
report["constraints"] = {o.name: [(c.type, getattr(c, "target", None) and c.target.name) for c in o.constraints] for o in keep if o.constraints}
ACTION_BY_OBJECT = {"BezierCircle.003": "Balance", "escape wheel and pinion.001": "EscapeWheel", "pallet fork.001": "PalletFork", "Cylinder.047": "HandSeconds", "Cylinder.058": "ThirdWheel", "Cylinder.059": "FourthWheel"}
def bake_world(o, f0, f1):
    """Sample the evaluated world matrix (parents + constraints + action) every frame and re-key it on a free object."""
    # two-key actions (the 60 s wheel / seconds-hand rotations) are Bezier-eased in the client file; the intent is a
    # uniform rotation between the same two keys, so they are set to LINEAR before sampling (timing and end poses unchanged)
    a = o.animation_data.action
    if a and all(len(fc.keyframe_points) <= 2 for fc in a.fcurves):
        for fc in a.fcurves:
            for kp in fc.keyframe_points: kp.interpolation = "LINEAR"
        report.setdefault("linearised", []).append(f"{o.name}: {a.name} ({int(round(a.frame_range[0]))}–{int(round(a.frame_range[1]))})")
    mats = {}
    for f in range(f0, f1 + 1):
        scene.frame_set(f); mats[f] = o.matrix_world.copy()
    # move the mesh origin onto the motion's fixed axis (least-squares fixed point of the sampled matrices), so the node rotates in place
    if o.type == "MESH":
        import numpy as np
        fr = sorted(mats); step = max(1, len(fr) // 16); M0 = mats[fr[0]]
        A, b = [], []
        for f in fr[step::step]:
            M = mats[f]
            for i in range(3): A.append([M[i][j] - M0[i][j] for j in range(3)]); b.append(M0[i][3] - M[i][3])
        A = np.array(A); b = np.array(b)
        cen = sum((v.co for v in o.data.vertices), Vector()) / max(1, len(o.data.vertices))
        d, *_ = np.linalg.lstsq(A, b - A @ np.array(cen), rcond=None)
        q = Vector(cen) + Vector(d.tolist()); resid = float(np.linalg.norm(A @ np.array(q) - b)) / max(1, len(b))
        if resid < 1e-3:
            from mathutils import Matrix as _M
            o.data.transform(_M.Translation(-q))
            mats = {f: m @ _M.Translation(q) for f, m in mats.items()}
            report.setdefault("pivots", {})[o.name] = {"axis_point_local": [round(v, 4) for v in q], "residual": resid, "recentred": True}
        else:
            report.setdefault("pivots", {})[o.name] = {"residual": resid, "recentred": False, "note": "motion is not a pure rotation about a fixed axis; baked location keys kept"}
    o.animation_data_clear(); o.constraints.clear(); o.parent = None; o.rotation_mode = "QUATERNION"
    for f, m in mats.items():
        o.matrix_world = m
        o.keyframe_insert("location", frame=f); o.keyframe_insert("rotation_quaternion", frame=f); o.keyframe_insert("scale", frame=f)
    for fc in o.animation_data.action.fcurves:
        for kp in fc.keyframe_points: kp.interpolation = "LINEAR"
    o.animation_data.action.name = ACTION_BY_OBJECT.get(o.name, "Anim_" + re.sub(r"[^A-Za-z0-9]+", "_", o.name))
    scene.frame_set(1)
for name, a in list(KEEP_ACTIONS.items()):
    o = bpy.data.objects[name]; f0, f1 = int(round(a.frame_range[0])), int(round(a.frame_range[1]))
    bake_world(o, f0, f1)
# everything else: freeze the frame-1 evaluated world transform on a parent-free, constraint-free object
snapshot = {o.name: o.matrix_world.copy() for o in keep if o.name not in KEEP_ACTIONS}
for o in keep:
    if o.type == "EMPTY": o.animation_data_clear()
for o in keep:
    if o.name in snapshot:
        o.constraints.clear(); o.parent = None; o.matrix_world = snapshot[o.name]
bpy.context.view_layer.update()

# ------------------------------------------------------------------ 3. materials: client silver-variant slots → separated web families
def canonical(img):
    n = re.sub(r"\.\d{3}$", "", img.name)
    n = re.sub(r"\.(jpg|png|tif|tiff|exr)$", "", n, flags=re.I)
    return n
def find_image(*needles):
    """Smallest image ≥ 2K whose canonical name contains every needle."""
    cands = [i for i in bpy.data.images if all(nd in canonical(i) for nd in needles) and i.size[0] >= 2048]
    cands.sort(key=lambda i: i.size[0])
    return cands[0] if cands else None
image_cache = {}
def web_image(img, colorspace):
    key = canonical(img)
    if key in image_cache: return image_cache[key]
    if img.size[0] > 2048 or img.size[1] > 2048:
        s_ = 2048 / max(img.size); img.scale(int(img.size[0] * s_), int(img.size[1] * s_))
    img.colorspace_settings.name = colorspace
    image_cache[key] = img
    report["images"][key] = {"source": img.name, "size": list(img.size)}
    return img

# texture sets as the client's material groups use them (COL sRGB, ROUGHNESS + NRM non-colour)
TEXSETS = {
    "Brushed002_2K": ("MetalStainlessSteelBrushed002_COL_2K", "MetalStainlessSteelBrushed002_ROUGHNESS_2K", "MetalStainlessSteelBrushed002_NRM16_2K"),
    "Brushed002_4K": ("MetalStainlessSteelBrushed002_COL_4K", "MetalStainlessSteelBrushed002_ROUGHNESS_4K", "MetalStainlessSteelBrushed002_NRM16_2K"),  # the client has no 4K normal; 2K is the same surface
    "Worn001_4K": ("MetalStainlessSteelBrushedWorn001_COL_4K", "MetalStainlessSteelBrushedWorn001_ROUGHNESS_4K", "MetalStainlessSteelBrushedWorn001_NRM16_4K"),
    "Radial002_2K": ("MetalStainlessSteelRadial002_COL_2K", "MetalStainlessSteelRadial002_ROUGHNESS_2K", "MetalStainlessSteelRadial002_NRM16_2K"),
}
# family → Principled setup. Values are the client's (silver variant); textured families carry the client's
# UV scale / rotation from the texture group so brushing runs the same way. `follows` = which finish rule the
# site applies (case / bracelet / accent / none).
FAMILIES = {
    "Case_Polished":     dict(base=(0.8, 0.8, 0.8), metallic=1.0, rough=0.05, follows="case"),
    "Case_Brushed":      dict(tex="Brushed002_4K", uv=(0.5, 0.0), metallic=1.0, follows="case"),
    "Case_Satin":        dict(base=(0.9, 0.9, 0.9), metallic=1.0, rough=0.389, follows="case"),  # client: "metalstainlesssteel dull" (case flanks)
    "Bracelet_Polished": dict(base=(0.8, 0.8, 0.8), metallic=1.0, rough=0.05, follows="bracelet"),
    "Bracelet_Brushed":  dict(tex="Brushed002_4K", uv=(0.5, 0.0), metallic=1.0, follows="bracelet"),
    "Crown_Knurl":       dict(tex="Brushed002_4K", uv=(1.0, 0.0), metallic=1.0, rough_mul=1.0, follows="case"),
    "Indices":           dict(base=(0.8, 0.8, 0.8), metallic=1.0, rough=0.06, follows="case"),
    "Hands":             dict(base=(0.8, 0.8, 0.8), metallic=1.0, rough=0.12, follows="case"),      # client slot: Material.001 (0.8 grey); photos show case-coloured metal hands
    "Accent":            dict(base=(0.8, 0.8, 0.8), metallic=1.0, rough=0.05, follows="accent"),    # client silver tree uses the gold constant here (balance cock, balance, hairspring, hand slot, bridge, crown emblem); product photos show silver
    "Movement_Brushed":  dict(tex="Brushed002_2K", uv=(0.5, 90.0), metallic=1.0, follows="none"),
    "Movement_Polished": dict(tex="Brushed002_2K", uv=(0.5, 0.0), metallic=1.0, aniso=1.0, rough_mul=0.5, follows="none"),
    "Movement_Dark":     dict(tex="Brushed002_2K", uv=(0.5, 90.0), metallic=1.0, base_mul=0.33, follows="none"),
    "Movement_Worn":     dict(tex="Worn001_4K", uv=(1.0, 0.0), metallic=1.0, follows="none"),
    "Movement_Radial":   dict(tex="Radial002_2K", uv=(1.0, 0.0), metallic=1.0, follows="none"),
    "Rotor":             dict(tex="Brushed002_4K", uv=(1.0, 0.0), metallic=1.0, normal_override="fly wheel normal map", rough=0.2, follows="none"),
    "Jewel":             dict(base=(0.8, 0.039, 0.556), metallic=0.377, rough=0.05, follows="none"),
    "Dial_Plate":        dict(base=(0.011, 0.011, 0.011), metallic=0.0, rough=0.232, follows="none"),
    "Crystal":           dict(glass=True, rough=0.0, follows="none"),
    "Caseback_Glass":    dict(glass=True, rough=0.35, follows="none"),   # client: "x Glass: rough"
    "Rubber":            dict(base=(0.05, 0.05, 0.05), metallic=0.0, rough=0.7, follows="none"),
    "Leather":           dict(base=(0.08, 0.06, 0.05), metallic=0.0, rough=0.6, follows="none"),
}
def family_for(mat_name, obj):
    n = mat_name or ""
    in_band = obj in band_set
    is_dial_furniture = obj.name.startswith(("Watch face numbers", "hartley front"))
    if n == "metalstainlesssteel shiny_silver":
        return "Indices" if is_dial_furniture else ("Bracelet_Polished" if in_band else "Case_Polished")
    if "shiny_gold" in n or "shiny_rosegold" in n or "shiny_black" in n or "_4K_shiny_silver" in n or n.endswith("_4K_shiny"):
        return "Indices" if is_dial_furniture else ("Bracelet_Polished" if in_band else "Accent")
    if "corogate" in n: return "Crown_Knurl"
    if re.search(r"_4k_(gold|silver|black|rosegold)|black/grey|_4K_gold$", n): return "Bracelet_Brushed" if in_band else "Case_Brushed"
    if "shiny_with text" in n: return "Rotor"
    if "shiny_anisotropic" in n: return "Movement_Polished"
    if n == "MetalStainlessSteelBrushed002_2K": return "Bracelet_Brushed" if in_band else "Movement_Brushed"
    if n == "metalstainlesssteel dull": return "Case_Satin"
    if "_2K_dark" in n: return "Movement_Dark"
    if "BrushedWorn001" in n: return "Movement_Worn"
    if "Radial002" in n: return "Movement_Radial"
    if n == "purple": return "Jewel"
    if n == "Material.001": return "Hands"
    if n == "Material": return "Dial_Plate"
    if n == "x Glass: Clear": return "Crystal"
    if n == "x Glass: rough": return "Caseback_Glass"
    if "rubber" in n.lower(): return "Rubber"
    if "leat" in n.lower(): return "Leather"
    report["notes"].append(f"material {n} on {obj.name} had no family; exported as Case_Polished")
    return "Case_Polished"

web_mats = {}
def web_material(fam):
    if fam in web_mats: return web_mats[fam]
    d = FAMILIES[fam]
    m = bpy.data.materials.new("web_" + fam); m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    used = {}
    bsdf.inputs["Metallic"].default_value = d.get("metallic", 1.0)
    if d.get("glass"):
        bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1); bsdf.inputs["Metallic"].default_value = 0
        bsdf.inputs["Roughness"].default_value = d["rough"]; bsdf.inputs["Transmission Weight"].default_value = 1.0; bsdf.inputs["IOR"].default_value = 1.5
    elif "tex" in d:
        col, rgh, nrm = TEXSETS[d["tex"]]
        base_mul = d.get("base_mul", 1.0)
        bsdf.inputs["Base Color"].default_value = (base_mul, base_mul, base_mul, 1)
        mapping = nt.nodes.new("ShaderNodeMapping"); uvn = nt.nodes.new("ShaderNodeTexCoord")
        sc, rot = d.get("uv", (1.0, 0.0)); mapping.inputs["Scale"].default_value = (sc, sc, 1.0); mapping.inputs["Rotation"].default_value = (0, 0, math.radians(rot))
        nt.links.new(uvn.outputs["UV"], mapping.inputs["Vector"])
        def tex(needle, cs):
            img = find_image(needle)
            if not img: return None
            t = nt.nodes.new("ShaderNodeTexImage"); t.image = web_image(img, cs); nt.links.new(mapping.outputs["Vector"], t.inputs["Vector"]); return t
        t = tex(col, "sRGB")
        if t:
            if base_mul != 1.0:
                mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"; mix.inputs["Factor"].default_value = 1.0
                nt.links.new(t.outputs["Color"], mix.inputs[6]); mix.inputs[7].default_value = (base_mul, base_mul, base_mul, 1); nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
            else: nt.links.new(t.outputs["Color"], bsdf.inputs["Base Color"])
            used["baseColor"] = t.image.name
        if "rough" in d: bsdf.inputs["Roughness"].default_value = d["rough"]
        else:
            t = tex(rgh, "Non-Color")
            if t:
                if d.get("rough_mul", 1.0) != 1.0:
                    mth = nt.nodes.new("ShaderNodeMath"); mth.operation = "MULTIPLY"; mth.inputs[1].default_value = d["rough_mul"]
                    nt.links.new(t.outputs["Color"], mth.inputs[0]); nt.links.new(mth.outputs[0], bsdf.inputs["Roughness"])
                else: nt.links.new(t.outputs["Color"], bsdf.inputs["Roughness"])
                used["roughness"] = t.image.name
        nimg = find_image(d["normal_override"]) if d.get("normal_override") else find_image(nrm)
        if nimg:
            t = nt.nodes.new("ShaderNodeTexImage"); t.image = web_image(nimg, "Non-Color"); nt.links.new(mapping.outputs["Vector"], t.inputs["Vector"])
            nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 1.0
            nt.links.new(t.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"]); used["normal"] = t.image.name
        if d.get("aniso"):
            bsdf.inputs["Anisotropic"].default_value = d["aniso"]; used["anisotropy"] = d["aniso"]
    else:
        bsdf.inputs["Base Color"].default_value = (*d["base"], 1); bsdf.inputs["Roughness"].default_value = d["rough"]
        if d.get("aniso"): bsdf.inputs["Anisotropic"].default_value = d["aniso"]; used["anisotropy"] = d["aniso"]
    web_mats[fam] = m
    report["materials"][fam] = {"textures": used, "follows": d["follows"], "sources": []}
    return m

converted = set()
for o in list(keep):
    if o.type == "MESH" and o.name in HIDDEN:
        report["notes"].append(f"{o.name} is hidden in the client file (object flag or excluded/hidden collection) — boolean helper, modifiers already applied; excluded from export")
        keep.discard(o); band_set.discard(o); bpy.data.objects.remove(o, do_unlink=True); continue
for o in list(keep):
    if o.type != "MESH": continue
    if len(o.data.materials) == 0 or all(m is None for m in o.data.materials):
        report["notes"].append(f"{o.name} had no material (helper / boolean cutter, modifiers already applied) — excluded from export")
        keep.discard(o); band_set.discard(o); bpy.data.objects.remove(o, do_unlink=True); continue
    if o.data.name in converted: continue
    converted.add(o.data.name)
    silver = SILVER_SLOTS.get(o.name)
    for i, m in enumerate(o.data.materials):
        if m is None or m.name.startswith("web_"): continue
        src_name = silver[1][i] if silver and i < len(silver[1]) and silver[1][i] else m.name
        fam = family_for(src_name, o)
        o.data.materials[i] = web_material(fam)
        report["materials"][fam]["sources"].append(f"{o.name}[{i}]:{src_name}" + ("" if silver else " (gold-tree material, no silver twin)"))

# ------------------------------------------------------------------ 5. semantic hierarchy
case = bpy.data.objects["step to obj"]
def wbbox(o):
    bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb))); mx = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
    return mn, mx
cmn, cmx = wbbox(case); centre = (cmn + cmx) / 2; case_dia = max(cmx.x - cmn.x, cmx.z - cmn.z)
plate = bpy.data.objects["watch base_numbers backplate"]; pmn, pmx = wbbox(plate); dial_y = (pmn.y + pmx.y) / 2  # dial plate centre plane (front = -Y)

EXPLICIT = {
    "step to obj": "Case/Case_Lugs", "watch base.003": "Case/Case_Middle",
    "step to obj.003": "Bezel/Bezel", "step to obj.001": "Crystal/Crystal", "watch base.008": "Caseback/Caseback_Glass",
    "watch base_numbers backplate": "Dial/Dial_Plate", "hartley front.001": "Dial/Logo",
    "step to obj.004": "Crown/Crown_Head",
    "OSCILLATING WEIGHT.001": "Movement/Rotor/Rotor", "OSCILLATING WEIGHT SCREW.001": "Movement/Rotor/Rotor_Screw",
    "BezierCircle.002": "Movement/Hairspring/Hairspring", "BezierCircle.003": "Movement/Balance/Balance_Wheel",
    "escape wheel and pinion.001": "Movement/Escapement/Escape_Wheel", "pallet fork.001": "Movement/Escapement/Pallet_Fork",
    "Cylinder.047": "Hands/Hand_Seconds", "Object019.014": "Hands/Hand_Minute", "Object019.017": "Hands/Hand_Hour", "Object019.016": "Hands/Hands_Cap", "Cylinder.049": "Dial/Dial_Detail_Cylinder_049", "Cylinder.059": "Movement/GearTrain/Fourth_Wheel", "Cylinder.058": "Movement/GearTrain/Third_Wheel",
    "Sphere.001": "Movement/Balance/Balance_Jewel", "Empty.008": "Movement/Balance/Balance_Pivot",
}
def classify(o):
    n = o.name
    if n in EXPLICIT: return EXPLICIT[n], "explicit"
    if o in band_set: return "Strap/" + re.sub(r"[^A-Za-z0-9]+", "_", n).strip("_"), "band-tree"
    base = re.sub(r"\.\d{3}$", "", n)
    if o.type != "MESH": return "Movement/Other/" + re.sub(r"[^A-Za-z0-9]+", "_", n), "empty"
    mn, mx = wbbox(o); c = (mn + mx) / 2; dims = mx - mn
    rel = c - centre
    if base.startswith("Watch face numbers"): return "Dial/Indices/Index_" + n[-3:], "name"
    if base.startswith("watch band left"): return "Case/Springbar_" + n[-3:], "name (strap end piece in the head tree)"
    if base.startswith("Screw_Large") or base.startswith("screw_small"): return "Movement/Screws/" + re.sub(r"[^A-Za-z0-9]+", "_", n), "name"
    if base.startswith("top plate"): return "Movement/Bridges/" + re.sub(r"[^A-Za-z0-9]+", "_", n), "name"
    if base.startswith("BARREL"): return "Movement/Barrel/" + re.sub(r"[^A-Za-z0-9]+", "_", n), "name"
    if base.startswith("BALANCE COCK"): return "Movement/Balance/" + re.sub(r"[^A-Za-z0-9]+", "_", n), "name"
    if base.startswith("setting wheel"): return "Crown/Keyless_" + n[-3:], "name"
    if rel.x > 0.25 * case_dia and abs(rel.z) < 0.12 * case_dia: return "Crown/Crown_Part_" + re.sub(r"[^A-Za-z0-9]+", "_", n), "geometry:+X of case"
    near_axis = math.hypot(rel.x, rel.z) < 0.5 * case_dia
    if c.y < dial_y - 0.004 and near_axis and max(dims.x, dims.z) > 0.15 * case_dia: return "Hands/Hand_" + re.sub(r"[^A-Za-z0-9]+", "_", n), "geometry:in front of dial, elongated"
    if c.y < dial_y - 0.004 and near_axis: return "Hands/Hand_Cap_" + re.sub(r"[^A-Za-z0-9]+", "_", n), "geometry:in front of dial, small"
    if base in ("Cylinder", "Circle", "BezierCurve", "Cube", "Object019", "Object017"):
        if o.name in KEEP_ACTIONS: return "Movement/GearTrain/" + re.sub(r"[^A-Za-z0-9]+", "_", n), "animated wheel"
        return "Movement/Other/" + re.sub(r"[^A-Za-z0-9]+", "_", n), "unidentified (documented)"
    return "Movement/Other/" + re.sub(r"[^A-Za-z0-9]+", "_", n), "unidentified (documented)"

root = bpy.data.objects.new("LegacyWatch", None); scene.collection.objects.link(root)
groups = {}
def group(path):
    if path in groups: return groups[path]
    parent = root if "/" not in path else group(path.rsplit("/", 1)[0])
    g = bpy.data.objects.new(path.rsplit("/", 1)[-1], None); scene.collection.objects.link(g)
    g.parent = parent  # identity local transform: groups are pure containers
    groups[path] = g; return g
placed = set()
for o in sorted(keep, key=lambda x: x.name):
    if o is ROOT or (o.type == "EMPTY" and o.name not in EXPLICIT): continue
    path, rule = classify(o)
    if "/Other/" in path: report["unclassified"].append({"object": o.name, "placed": path, "rule": rule})
    report["mapping"][o.name] = {"path": path, "rule": rule}
    gpath, leaf = path.rsplit("/", 1)
    g = group(gpath)
    mw = o.matrix_world.copy()
    o.parent = g; o.matrix_parent_inverse.identity(); o.matrix_world = mw
    o.name = leaf; placed.add(o)
# remove the original rig empties (their children are re-parented)
for o in list(keep):
    if o.type == "EMPTY" and o not in placed and o is not root and o not in groups.values():
        bpy.data.objects.remove(o, do_unlink=True)
# centre the watch at the origin and scale to site units (43 mm case = 2.098 units)
from mathutils import Matrix
SCALE = 2.098 / case_dia
T = Matrix.Scale(SCALE, 4) @ Matrix.Translation(-Vector(centre))
root.matrix_world = T
report["notes"].append(f"root node LegacyWatch carries scale {SCALE:.4f} and the centring offset so the case measures {case_dia*SCALE:.3f} units (site convention 1 unit = 20.5 mm); children keep client world-space transforms (baked keyframes stay valid)")

# ------------------------------------------------------------------ 6. rename actions for the web
ACTION_NAMES = {"BezierCircle.001Action.001": "Balance", "Key.001Action.001": "Hairspring", "Circle.010Action.002": "EscapeWheel", "Plane.003Action.001": "PalletFork", "Cylinder.046Action.001": "HandSeconds", "Cylinder.058Action": "ThirdWheel", "Cylinder.044Action.001": "FourthWheel"}
for o in descend(root):
    ad = o.animation_data
    if ad and ad.action:
        nm = ad.action.name if ad.action.name in ACTION_BY_OBJECT.values() else ACTION_NAMES.get(ad.action.name, "Anim_" + re.sub(r"[^A-Za-z0-9]+", "_", o.name)); ad.action.name = nm
        report["animations"][nm] = {"object": o.name, "frames": [int(ad.action.frame_range[0]), int(ad.action.frame_range[1])], "seconds": round((ad.action.frame_range[1] - ad.action.frame_range[0]) / scene.render.fps, 2)}
    if o.type == "MESH" and o.data.shape_keys and o.data.shape_keys.animation_data and o.data.shape_keys.animation_data.action:
        a = o.data.shape_keys.animation_data.action; nm = ACTION_NAMES.get(a.name, "Hairspring"); a.name = nm
        report["animations"][nm] = {"object": o.name, "frames": [int(a.frame_range[0]), int(a.frame_range[1])], "seconds": round((a.frame_range[1] - a.frame_range[0]) / scene.render.fps, 2), "type": "shape-key"}
# drop every other action so nothing stray is exported
used = {o.animation_data.action for o in descend(root) if o.animation_data and o.animation_data.action} | {o.data.shape_keys.animation_data.action for o in descend(root) if o.type == "MESH" and o.data.shape_keys and o.data.shape_keys.animation_data and o.data.shape_keys.animation_data.action}
for a in list(bpy.data.actions):
    if a not in used: bpy.data.actions.remove(a)
scene.frame_start = 1; scene.frame_end = 1800

# ------------------------------------------------------------------ 7. export
# every exported object must be selectable: link all into the scene root collection and enable hidden ones
def ensure_visible(objs):
    for o in objs:
        if o.name not in scene.collection.objects:
            scene.collection.objects.link(o)
        o.hide_set(False); o.hide_viewport = False; o.hide_render = False
for coll in bpy.data.collections:
    coll.hide_viewport = False; coll.hide_render = False
for lc in bpy.context.view_layer.layer_collection.children:
    lc.exclude = False
def export(objs, path):
    ensure_visible(objs)
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=False, export_animations=True, export_animation_mode="ACTIONS", export_nla_strips=False, export_frame_range=False, export_force_sampling=True, export_morph=True, export_morph_normal=False, export_cameras=False, export_lights=False, export_yup=True, export_image_format="AUTO", export_jpeg_quality=88, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6, export_texcoords=True, export_normals=True, export_tangents=True, export_skins=False, export_extras=False)
strap_root = groups.get("Strap")
head = [o for o in descend(root) if strap_root is None or o not in set(descend(strap_root))]
export(head, OUT + "/legacy-head.glb")
if strap_root:
    strap_root.parent = None; strap_root.matrix_world = T; strap_root.name = "LegacyStrap_SteelBracelet"
    export(list(descend(strap_root)), OUT + "/straps/steel-bracelet.glb")
bpy.ops.wm.save_mainfile(filepath=WORK)
json.dump(report, open(REPORT, "w"), indent=1)
print("EXPORT DONE")
