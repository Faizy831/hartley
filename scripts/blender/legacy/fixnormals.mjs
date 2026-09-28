// Amplify subtle 16-bit normal maps (R,G deviation from 0.5) before 8-bit quantisation; compensate via normalTexture.scale = 1/k.
import fs from "node:fs"; import sharp from "sharp"; import { PNG } from "pngjs";
import { NodeIO } from "@gltf-transform/core"; import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
const [srcBlender, inGlb, outGlb] = process.argv.slice(2);
const buf = fs.readFileSync(srcBlender); const jl = buf.readUInt32LE(12); const json = JSON.parse(buf.subarray(20, 20 + jl).toString()); const bin = buf.subarray(20 + jl + 8);
const originals = {}; for (const img of json.images) { const bv = json.bufferViews[img.bufferView]; originals[img.name] = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength); }
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS); const doc = await io.read(inGlb);
const log = [];
for (const tex of doc.getRoot().listTextures()) {
  const name = tex.getName(); if (!/NRM16/.test(name) || !originals[name]) continue;
  const p = PNG.sync.read(originals[name], { skipRescale: true }); const px = p.data; const c = px.length / (p.width * p.height);
  const f = Math.max(1, Math.round(p.width / 2048)); const W = p.width / f, H = p.height / f;   // box downsample to 2K
  const dev = new Float32Array(W * H * 2); let maxDev = 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0; for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) { const i = (((y * f + dy) * p.width) + (x * f + dx)) * c; r += px[i] - 32768; g += px[i + 1] - 32768; }
    r /= f * f; g /= f * f; const o = (y * W + x) * 2; dev[o] = r; dev[o + 1] = g; maxDev = Math.max(maxDev, Math.abs(r), Math.abs(g));
  }
  const k = Math.max(1, Math.min(32, Math.floor((127 * 257) / maxDev)));
  const out = Buffer.alloc(W * H * 3);
  for (let i = 0, o = 0; i < dev.length; i += 2, o += 3) {
    out[o] = Math.max(0, Math.min(255, Math.round((32768 + dev[i] * k) / 257)));
    out[o + 1] = Math.max(0, Math.min(255, Math.round((32768 + dev[i + 1] * k) / 257)));
    out[o + 2] = 255;
  }
  const webp = await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 92, smartSubsample: false }).toBuffer();
  tex.setImage(webp).setMimeType("image/webp");
  let uses = 0; for (const mat of doc.getRoot().listMaterials()) if (mat.getNormalTexture() === tex) { mat.setNormalScale(1 / k); uses++; }
  log.push(`${name}: ${p.width}px→${W}px max|dev16|=${maxDev.toFixed(0)} k=${k} normalScale=${(1 / k).toFixed(4)} materials=${uses} ${(webp.length / 1024).toFixed(0)}KB`);
}
await io.write(outGlb, doc); console.log(log.join("\n"));
