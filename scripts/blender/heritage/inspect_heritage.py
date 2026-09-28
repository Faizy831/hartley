import bpy, math, json, re, sys
from mathutils import Vector
P = lambda *a: print(*a, flush=True)
bpy.ops.wm.open_mainfile(filepath="/Users/faizan/Desktop/Projects/veloris/Heritage_Animation_export.blend", load_ui=False)
S = bpy.context.scene; vl = bpy.context.view_layer
def r(v, n=3):
    try: return [round(float(x), n) for x in v]
    except TypeError: return round(float(v), n)
# ---------------- 1. scene / world
P("## SCENE")
P("blender_version_saved", bpy.data.version, "running", bpy.app.version_string, "scenes", [s.name for s in bpy.data.scenes], "active", S.name)
P("engine", S.render.engine, "cycles_samples", getattr(S.cycles, "samples", None), "device", getattr(S.cycles, "device", None), "res", S.render.resolution_x, S.render.resolution_y, S.render.resolution_percentage, "fps", S.render.fps, "frames", S.frame_start, S.frame_end, "current", S.frame_current)
vs = S.view_settings; ds = S.display_settings
P("color", "display", ds.display_device, "view", vs.view_transform, "look", vs.look, "exposure", round(vs.exposure, 3), "gamma", round(vs.gamma, 3), "curve", vs.use_curve_mapping, "film_transparent", S.render.film_transparent)
W = S.world
P("world", W.name if W else None, "use_nodes", W.use_nodes if W else None, "color", r(W.color) if W else None)
if W and W.use_nodes:
    for n in W.node_tree.nodes:
        ins = []
        for i in n.inputs:
            if not hasattr(i, "default_value"): continue
            v = i.default_value
            try: v = [round(float(x), 3) for x in v]
            except TypeError: v = round(float(v), 3)
            ins.append(f"{i.name}{'*' if i.is_linked else ''}={v}")
        extra = ""
        if n.type == "TEX_ENVIRONMENT" and n.image: extra = f" image={n.image.name} size={list(n.image.size)} packed={bool(n.image.packed_file)} path={n.image.filepath} cs={n.image.colorspace_settings.name}"
        if n.type == "TEX_IMAGE" and n.image: extra = f" image={n.image.name} size={list(n.image.size)}"
        if n.type == "MIX_RGB": extra += f" blend={n.blend_type}"
        if n.type == "MATH": extra += f" op={n.operation}"
        if n.type == "VALUE": extra += f" value={round(n.outputs[0].default_value,3)}"
        if n.type == "RGB": extra += f" color={r(n.outputs[0].default_value)}"
        if n.type == "MAPPING": pass
        P("  WNODE", n.name, n.type, extra, "{" + ", ".join(ins) + "}")
    for l in W.node_tree.links: P("  WLINK", f"{l.from_node.name}.{l.from_socket.name} -> {l.to_node.name}.{l.to_socket.name}")
# collections
P("## COLLECTIONS")
def walk_lc(lc, depth=0, exc=False, hid=False):
    exc = exc or lc.exclude; hid = hid or lc.hide_viewport or lc.collection.hide_viewport or lc.collection.hide_render
    c = lc.collection
    P("  " * depth + f"- {c.name} objects={len(c.objects)} all={len(c.all_objects)} exclude={lc.exclude} hide_vp={lc.hide_viewport} coll_hide_vp={c.hide_viewport} coll_hide_render={c.hide_render}" + ("  [EFFECTIVELY HIDDEN]" if exc or hid else ""))
    for ch in lc.children: walk_lc(ch, depth + 1, exc, hid)
walk_lc(vl.layer_collection)
# lights & cameras
P("## LIGHTS")
for o in bpy.data.objects:
    if o.type != "LIGHT": continue
    L = o.data; loc = o.matrix_world.translation; d = -(o.matrix_world.to_3x3() @ Vector((0, 0, 1))).normalized()
    extra = ""
    if L.type == "AREA": extra = f"shape={L.shape} size={L.size:.2f}x{L.size_y:.2f} spread={math.degrees(L.spread):.0f}"
    if L.type == "SPOT": extra = f"spot={math.degrees(L.spot_size):.0f} blend={L.spot_blend:.2f} radius={L.shadow_soft_size:.2f}"
    if L.type == "POINT": extra = f"radius={L.shadow_soft_size:.2f}"
    if L.type == "SUN": extra = f"angle={math.degrees(L.angle):.1f}"
    P(f"  {o.name:28s} {L.type:5s} W={L.energy:<9.1f} color={r(L.color)} {extra} pos={r(loc,2)} dir={r(d,2)} in_layer={o.name in vl.objects} hide_render={o.hide_render} cols={[c.name for c in o.users_collection]} anim={bool(o.animation_data and o.animation_data.action)} constraints={[c.type for c in o.constraints]}")
P("## CAMERAS")
for o in bpy.data.objects:
    if o.type != "CAMERA": continue
    c = o.data; loc = o.matrix_world.translation
    P(f"  {o.name:16s} lens={c.lens:.1f} sensor={c.sensor_width:.0f} dof={c.dof.use_dof} f={c.dof.aperture_fstop:.2f} focus_dist={c.dof.focus_distance:.2f} focus_obj={c.dof.focus_object.name if c.dof.focus_object else None} pos={r(loc,2)} active={o==S.camera} anim={bool(o.animation_data and o.animation_data.action)} constraints={[k.type for k in o.constraints]}")
P("  markers", [(m.frame, m.camera.name if m.camera else None) for m in S.timeline_markers])
# ---------------- 2. hierarchy
P("## ROOTS")
roots = [o for o in bpy.data.objects if o.parent is None]
def count_tree(o):
    n = 1
    for c in o.children: n += count_tree(c)
    return n
for o in sorted(roots, key=lambda x: -count_tree(x)):
    n = count_tree(o)
    if n > 1 or o.type in ("MESH", "EMPTY"): P(f"  {o.name:36s} {o.type:6s} subtree={n} cols={[c.name for c in o.users_collection][:2]} loc={r(o.matrix_world.translation,2)} anim={bool(o.animation_data and o.animation_data.action)}")
P("## TREES (roots with subtree > 5, depth<=3)")
def tree(o, depth=0, maxd=3):
    kids = list(o.children)
    mats = [m.name for m in o.data.materials if m] if o.type == "MESH" else []
    geo = f" faces={len(o.data.polygons)} verts={len(o.data.vertices)}" if o.type == "MESH" else ""
    mods = [m.type for m in o.modifiers]
    P("  " * depth + f"- {o.name} [{o.type}]{geo} mods={mods if mods else ''} mats={mats} kids={len(kids)} hide_render={o.hide_render}")
    if depth < maxd:
        for c in sorted(kids, key=lambda x: x.name)[:400]: tree(c, depth + 1, maxd)
for o in sorted(roots, key=lambda x: -count_tree(x)):
    if count_tree(o) > 5: tree(o)
# ---------------- 3/4. materials & variants
P("## MATERIALS")
def describe(node, depth=0, seen=None):
    seen = seen or set()
    if node.name in seen or depth > 3: return f"{node.type}:{node.name}"
    seen.add(node.name); parts = [f"{node.type}:{node.name}"]
    if node.type == "MIX": parts.append(f"blend={node.blend_type}")
    if node.type == "MIX_RGB": parts.append(f"blend={node.blend_type}")
    if node.type == "CURVE_RGB": parts.append("curves=" + str([[(round(p.location[0],2), round(p.location[1],2)) for p in c.points] for c in node.mapping.curves]))
    if node.type == "TEX_IMAGE": parts.append(f"image={node.image.name if node.image else None} cs={node.image.colorspace_settings.name if node.image else None}")
    if node.type == "MAPPING": parts.append(f"loc={r(node.inputs['Location'].default_value,2)} rot={r([math.degrees(x) for x in node.inputs['Rotation'].default_value],1)} scale={r(node.inputs['Scale'].default_value,2)}")
    if node.type == "GROUP" and node.node_tree:
        gi = {i.name: (round(float(i.default_value),3) if isinstance(i.default_value, float) else None) for i in node.inputs if hasattr(i, "default_value") and isinstance(i.default_value, float) and i.name in ("Scale","Global Rotation","Roughness Adj.","Normal Strength","Aspect Ratio")}
        parts.append(f"group={node.node_tree.name} {gi}")
    ins = []
    for i in node.inputs:
        if not i.enabled: continue
        if i.is_linked: ins.append(f"{i.name}<-({describe(i.links[0].from_node, depth+1, seen)})")
        elif hasattr(i, "default_value") and node.type not in ("GROUP",):
            v = i.default_value
            try: v = [round(float(x),3) for x in v[:4]]
            except TypeError: v = round(float(v),3)
            if i.name in ("Factor","Fac","A","B","Color1","Color2","Value","Color","Strength","Hue","Saturation","Fac"): ins.append(f"{i.name}={v}")
    parts.append("{" + ", ".join(ins) + "}")
    return " ".join(parts)
usage = {}
for o in bpy.data.objects:
    if o.type != "MESH": continue
    root = o
    while root.parent: root = root.parent
    for i, m in enumerate(o.data.materials):
        if m: usage.setdefault(m.name, {}).setdefault(root.name, []).append(f"{o.name}[{i}]")
for m in sorted(bpy.data.materials, key=lambda m: m.name):
    if not m.use_nodes:
        P(f"MAT {m.name} (no nodes) diffuse={r(m.diffuse_color)} users={ {k: len(v) for k, v in usage.get(m.name, {}).items()} }"); continue
    out = next((n for n in m.node_tree.nodes if n.type == "OUTPUT_MATERIAL" and n.is_active_output), None)
    bsdf = out.inputs["Surface"].links[0].from_node if out and out.inputs["Surface"].is_linked else None
    P(f"MAT {m.name}  users={ {k: len(v) for k, v in usage.get(m.name, {}).items()} } examples={[v[:3] for v in usage.get(m.name, {}).values()][:2]}")
    if not bsdf: P("   no surface shader"); continue
    if bsdf.type != "BSDF_PRINCIPLED": P(f"   shader={bsdf.type} -> " + describe(bsdf)); continue
    vals = {}
    for k in ["Base Color", "Metallic", "Roughness", "IOR", "Alpha", "Normal", "Anisotropic", "Anisotropic Rotation", "Coat Weight", "Coat Roughness", "Transmission Weight", "Emission Color", "Emission Strength", "Specular IOR Level", "Sheen Weight"]:
        i = bsdf.inputs.get(k)
        if i is None: continue
        if i.is_linked: vals[k] = "<-" + describe(i.links[0].from_node)
        elif hasattr(i, "default_value"):
            v = i.default_value
            try: vals[k] = [round(float(x),3) for x in v[:3]]
            except TypeError: vals[k] = round(float(v),3)
    for k, v in vals.items():
        if k in ("Emission Color",) and v == [0.0,0.0,0.0]: continue
        if k == "Emission Strength" and vals.get("Emission Color") == [0.0,0.0,0.0]: continue
        P(f"   {k}: {v}")
    imgs = set()
    def walk(t, d=0):
        if d > 3: return
        for n in t.nodes:
            if n.type == "TEX_IMAGE" and n.image: imgs.add(f"{n.image.name}({n.image.size[0]}x{n.image.size[1]})")
            elif n.type == "GROUP" and n.node_tree: walk(n.node_tree, d+1)
    walk(m.node_tree); P("   images:", sorted(imgs))
# ---------------- 5. animations
P("## ACTIONS", len(bpy.data.actions))
users = {}
for o in bpy.data.objects:
    if o.animation_data and o.animation_data.action: users.setdefault(o.animation_data.action.name, []).append(o.name + f"[{o.type}]")
    if o.type == "MESH" and o.data.shape_keys and o.data.shape_keys.animation_data and o.data.shape_keys.animation_data.action: users.setdefault(o.data.shape_keys.animation_data.action.name, []).append(o.name + "[SHAPEKEY]")
    if o.animation_data and o.animation_data.nla_tracks: P("  NLA on", o.name, [t.name for t in o.animation_data.nla_tracks])
    if o.animation_data and o.animation_data.drivers: P("  DRIVERS on", o.name, len(o.animation_data.drivers))
for a in sorted(bpy.data.actions, key=lambda a: a.name):
    fcs = []
    for fc in a.fcurves:
        vals = [round(p.co[1], 3) for p in fc.keyframe_points]
        interp = sorted({p.interpolation for p in fc.keyframe_points})
        fcs.append(f"{fc.data_path}[{fc.array_index}] keys={len(fc.keyframe_points)} interp={interp} range=({min(vals) if vals else None},{max(vals) if vals else None})")
    changing = sum(1 for fc in a.fcurves if len({round(p.co[1],4) for p in fc.keyframe_points}) > 1)
    P(f"  ACTION {a.name} frames={r(a.frame_range,0)} sec={round((a.frame_range[1]-a.frame_range[0])/S.render.fps,2)} fcurves={len(a.fcurves)} changing={changing} users={users.get(a.name, [])}")
    for f in fcs[:6]: P("     ", f)
# ---------------- 6. geometry / images
P("## GEOMETRY")
dg = bpy.context.evaluated_depsgraph_get()
tot = {"objects": len(bpy.data.objects), "meshes": 0, "base_faces": 0, "base_verts": 0, "eval_faces": 0, "eval_tris": 0}
per_root = {}
heavy = []
for o in bpy.data.objects:
    if o.type != "MESH": continue
    tot["meshes"] += 1; tot["base_faces"] += len(o.data.polygons); tot["base_verts"] += len(o.data.vertices)
    try:
        ev = o.evaluated_get(dg); me = ev.to_mesh(); f = len(me.polygons); t = sum(len(p.vertices) - 2 for p in me.polygons); ev.to_mesh_clear()
    except Exception: f = len(o.data.polygons); t = f
    tot["eval_faces"] += f; tot["eval_tris"] += t
    root = o
    while root.parent: root = root.parent
    pr = per_root.setdefault(root.name, {"meshes": 0, "eval_tris": 0, "hidden_render": 0}); pr["meshes"] += 1; pr["eval_tris"] += t
    if o.hide_render: pr["hidden_render"] += 1
    heavy.append((t, o.name, root.name, [m.type for m in o.modifiers]))
P("totals", tot)
for k, v in sorted(per_root.items(), key=lambda kv: -kv[1]["eval_tris"])[:25]: P("  root", k, v)
P("heaviest objects (evaluated tris):")
for t, n, root, mods in sorted(heavy, reverse=True)[:25]: P(f"  {t:9d} {n:40s} root={root} mods={mods}")
P("## IMAGES", len(bpy.data.images))
for img in sorted(bpy.data.images, key=lambda i: -(i.size[0] * i.size[1])):
    if img.size[0] == 0: continue
    P(f"  {img.name:60s} {img.size[0]}x{img.size[1]} fmt={img.file_format} depth={img.depth} packed={bool(img.packed_file)} bytes={img.packed_file.size if img.packed_file else 0} cs={img.colorspace_settings.name} users={img.users}")
P("## DONE")
