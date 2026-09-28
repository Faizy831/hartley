// Structural report for the processed Heritage GLBs: size, triangles, primitives (≈ draw calls), materials, textures,
// animations, extensions, plus the Khronos validator verdict. Usage: QA_MODULES=<dir with node_modules> node glbinfo.mjs a.glb b.glb
import fs from "node:fs"; import { createRequire } from "node:module";
const require = createRequire(process.env.QA_MODULES ? process.env.QA_MODULES + "/" : import.meta.url);
const { NodeIO } = require("@gltf-transform/core"); const { ALL_EXTENSIONS } = require("@gltf-transform/extensions"); const draco3d = require("draco3dgltf"); const validator = require("gltf-validator");
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "draco3d.decoder": await draco3d.createDecoderModule() });
for (const f of process.argv.slice(2)) {
  const bytes = fs.readFileSync(f); const doc = await io.readBinary(new Uint8Array(bytes)); const root = doc.getRoot();
  let tris = 0, prims = 0; const meshes = root.listMeshes();
  for (const m of meshes) for (const p of m.listPrimitives()) { prims++; const idx = p.getIndices(); tris += (idx ? idx.getCount() : p.getAttribute("POSITION").getCount()) / 3; }
  const anims = root.listAnimations().map((a) => { const s = a.listSamplers()[0]; const t = s.getInput().getArray(); return { name: a.getName(), channels: a.listChannels().length, targets: [...new Set(a.listChannels().map((c) => c.getTargetNode().getName()))], keys: t.length, duration: +(t[t.length - 1] - t[0]).toFixed(3), interpolation: s.getInterpolation() }; });
  const textures = root.listTextures().map((t) => { const s = t.getSize(); return `${t.getName() || t.getURI()} ${s ? s.join("x") : "?"} ${t.getMimeType()} ${(t.getImage().byteLength / 1024).toFixed(0)}KB`; });
  const mats = root.listMaterials().map((m) => `${m.getName()}${m.getExtension("KHR_materials_transmission") ? " [transmission]" : ""}${m.getBaseColorTexture() ? " col" : ""}${m.getMetallicRoughnessTexture() ? " mr" : ""}${m.getNormalTexture() ? " nrm" : ""}`);
  const nodes = root.listNodes().map((n) => n.getName()); const unnamed = nodes.filter((n) => !n).length;
  const v = await validator.validateBytes(new Uint8Array(bytes), { maxIssues: 20 });
  console.log(JSON.stringify({ file: f, sizeMB: +(bytes.length / 1048576).toFixed(2), triangles: tris, meshes: meshes.length, primitives: prims, nodes: nodes.length, unnamedNodes: unnamed, materials: mats, textures, animations: anims, cameras: root.listCameras().length, lights: root.listExtensionsUsed().some((e) => e.extensionName === "KHR_lights_punctual"), extensions: root.listExtensionsUsed().map((e) => e.extensionName), validator: { errors: v.issues.numErrors, warnings: v.issues.numWarnings, infos: v.issues.numInfos, messages: v.issues.messages.slice(0, 12).map((m) => `${m.severity}:${m.code} ${m.message} @${m.pointer}`) } }, null, 1));
}
