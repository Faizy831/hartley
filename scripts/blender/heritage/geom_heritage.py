import bpy, bmesh
from collections import Counter
P = lambda *a: print(*a, flush=True)
bpy.ops.wm.open_mainfile(filepath="/Users/faizan/Desktop/Projects/veloris/Heritage_Animation_export.blend", load_ui=False)
S = bpy.context.scene
dg = bpy.context.evaluated_depsgraph_get()
P("## LEGACY-STYLE GEOMETRY DETAIL (read-only)")
P("unit_system", S.unit_settings.system, "scale_length", S.unit_settings.scale_length, "length_unit", S.unit_settings.length_unit)
ROOTS = ["1. Black Base with  black face", "2. rose gold base with black face", "3. gold base with black face", "4. Silver Base with white face", "5. rose gold with white face.001",
         "leather black with black", "leather white with silver", "leather pink with rose gold", "leather beige with rose gold",
         "1. black mesh band parent.003", "1. mesh band parent_silver.001", "1. mesh band parent_gold.001", "1. mesh band parent.rose gold.002", "cam 10 parent", "Hiding Boxes"]
def walk(o):
    yield o
    for c in o.children: yield from walk(c)
for rn in ROOTS:
    root = bpy.data.objects.get(rn)
    if not root: P("ROOT MISSING", rn); continue
    P(f"## ROOT {rn} type={root.type} loc={[round(x,3) for x in root.location]} rot={[round(x,3) for x in root.rotation_euler]} scale={[round(x,3) for x in root.scale]} parent={root.parent.name if root.parent else None}")
    tot = 0
    for o in walk(root):
        if o.type == "CAMERA":
            P(f"  CAM {o.name} lens={o.data.lens} clip={o.data.clip_start},{o.data.clip_end} world_loc={[round(x,3) for x in o.matrix_world.translation]}")
            continue
        if o.type != "MESH": 
            P(f"  {o.type} {o.name} loc={[round(x,3) for x in o.location]} rot={[round(x,3) for x in o.rotation_euler]}"); continue
        me = o.data
        ng = sum(1 for p in me.polygons if len(p.vertices) > 4)
        quads = sum(1 for p in me.polygons if len(p.vertices) == 4)
        eo = o.evaluated_get(dg); em = eo.to_mesh()
        tris = sum(len(p.vertices) - 2 for p in em.polygons)
        tot += tris
        slots = Counter(p.material_index for p in me.polygons)
        slotinfo = {f"{i}:{(o.material_slots[i].material.name if i < len(o.material_slots) and o.material_slots[i].material else None)}": n for i, n in sorted(slots.items())}
        d = [round(x, 3) for x in eo.dimensions]
        wl = [round(x, 3) for x in o.matrix_world.translation]
        P(f"  MESH {o.name} verts={len(me.vertices)} faces={len(me.polygons)} quads={quads} ngons={ng} eval_tris={tris} uv={[u.name for u in me.uv_layers]} custom_normals={me.has_custom_normals} mods={[m.type for m in o.modifiers]} dims={d} world_loc={wl} scale={[round(x,3) for x in o.scale]} parent={o.parent.name if o.parent else None} parent_type={o.parent_type}")
        P(f"       slots_faces={slotinfo}")
        eo.to_mesh_clear()
    P(f"  ROOT_TOTAL_TRIS {rn} = {tot}")
# bounding boxes of the base at frame 360 (all bases keyed there)
P("## DONE2")
