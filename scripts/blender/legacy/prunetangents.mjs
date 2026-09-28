// Keep TANGENT only where a material needs it (KHR_materials_anisotropy); report coverage.
import { NodeIO } from "@gltf-transform/core"; import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
const [inGlb, outGlb] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS); const doc = await io.read(inGlb);
let kept = 0, dropped = 0, missing = [];
for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
  const mat = prim.getMaterial(); const aniso = mat && mat.getExtension("KHR_materials_anisotropy");
  const has = !!prim.getAttribute("TANGENT");
  if (aniso) { if (has) kept++; else missing.push(mesh.getName() + ":" + (mat && mat.getName())); }
  else if (has) { prim.setAttribute("TANGENT", null); dropped++; }
}
await io.write(outGlb, doc);
console.log(`tangents kept on anisotropic primitives: ${kept}; dropped elsewhere: ${dropped}; anisotropic primitives WITHOUT tangents: ${missing.length ? missing.join(", ") : "none"}`);
