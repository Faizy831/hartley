import fs from "node:fs"; import sharp from "sharp";
for (const f of process.argv.slice(2)) {
  const buf = fs.readFileSync(f); const len = buf.readUInt32LE(8); const jl = buf.readUInt32LE(12); const json = JSON.parse(buf.subarray(20, 20 + jl).toString());
  const bin = buf.subarray(20 + jl + 8);
  for (const img of json.images) { const bv = json.bufferViews[img.bufferView]; const data = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
    const s = sharp(data); const meta = await s.metadata(); const st = await s.stats();
    console.log(`${img.name.padEnd(56)} ${meta.width}x${meta.height} ${meta.format} ${(bv.byteLength/1024).toFixed(0)}KB  mean=${st.channels.map(c=>c.mean.toFixed(0)).join(",")} sd=${st.channels.map(c=>c.stdev.toFixed(1)).join(",")}`); }
}
