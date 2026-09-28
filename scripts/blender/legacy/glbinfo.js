const fs = require("fs");
const path = process.argv[2];
const buf = fs.readFileSync(path);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString());
const bv = json.bufferViews || [];
const size = (i) => (bv[i] ? bv[i].byteLength : 0);
const images = (json.images || []).map((im, i) => ({ i, name: im.name, mime: im.mimeType, bytes: size(im.bufferView) }));
const imgBytes = images.reduce((a, b) => a + b.bytes, 0);
let animBytes = 0;
for (const a of json.animations || []) for (const s of a.samplers) { animBytes += size(json.accessors[s.input].bufferView) + size(json.accessors[s.output].bufferView); }
let dracoBytes = 0, tri = 0;
for (const m of json.meshes || []) for (const p of m.primitives) { if (p.extensions && p.extensions.KHR_draco_mesh_compression) dracoBytes += size(p.extensions.KHR_draco_mesh_compression.bufferView); const acc = json.accessors[p.indices]; tri += acc ? acc.count / 3 : 0; }
console.log(path.split("/").pop(), "| total", (buf.length / 1e6).toFixed(1), "MB | images", (imgBytes / 1e6).toFixed(1), "MB (" + images.length + ") | draco geometry", (dracoBytes / 1e6).toFixed(1), "MB | animation", (animBytes / 1e6).toFixed(2), "MB | triangles", Math.round(tri), "| meshes", (json.meshes || []).length, "| nodes", json.nodes.length, "| materials", (json.materials || []).length, "| textures", (json.textures || []).length);
console.log("animations:", (json.animations || []).map((a) => a.name + " (" + a.channels.length + "ch, " + a.samplers.length + " samplers, max t=" + Math.max(...a.samplers.map((s) => json.accessors[s.input].max[0])).toFixed(1) + "s)").join("; "));
console.log("images:", images.sort((a, b) => b.bytes - a.bytes).map((im) => `${im.name}:${im.mime.split("/")[1]}:${(im.bytes / 1e6).toFixed(1)}MB`).join("  "));
console.log("materials:", (json.materials || []).map((m) => m.name).join(", "));
// hierarchy
const childrenOf = (n) => (json.nodes[n].children || []);
const roots = json.scenes[0].nodes;
const dump = (n, d, out) => { const node = json.nodes[n]; if (d <= 2) out.push("  ".repeat(d) + node.name + (node.mesh !== undefined ? " *" : "") + (d === 2 && childrenOf(n).length ? ` (+${childrenOf(n).length})` : "")); if (d < 2) for (const c of childrenOf(n)) dump(c, d + 1, out); };
const out = []; for (const r of roots) dump(r, 0, out); console.log("hierarchy (depth ≤2):\n" + out.join("\n"));
const perMesh = (json.meshes || []).map((m) => [m.name, m.primitives.reduce((a, p) => a + (json.accessors[p.indices] ? json.accessors[p.indices].count / 3 : 0), 0)]).sort((a, b) => b[1] - a[1]);
console.log("heaviest meshes:", perMesh.slice(0, 14).map(([n, t]) => n + "=" + Math.round(t / 1000) + "k").join("  "));
