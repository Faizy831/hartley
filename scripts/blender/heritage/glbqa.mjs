// Standalone validation runner for the Heritage GLBs: serves the repo over http.server, renders the QA page with headless
// Chrome (Mac GPU) for every finish / dial / strap / view, collects the in-page report and writes screenshots + JSON.
// Run from the repo root: node scripts/blender/heritage/glbqa.mjs   (playwright + sharp resolved from scratchpad/qa/node_modules via NODE_PATH)
import { spawn } from "node:child_process"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(process.env.QA_MODULES ? process.env.QA_MODULES + "/" : import.meta.url);
const { chromium } = require("playwright"); const sharp = require("sharp");
const PORT = 3132; const OUT = process.env.QA_OUT || "docs/heritage-glb"; fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync("scripts/blender/heritage/glbqa.html", "glbqa.html");
const server = spawn("python3", ["-m", "http.server", String(PORT)], { stdio: "ignore" }); await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=metal"] });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 900 } })).newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("console:", m.text().slice(0, 200)); });
const shots = [
  ["silver-front", "?finish=silver&dial=white&view=front&t=0"],
  ["silver-three", "?finish=silver&dial=white&view=three&t=15"],
  ["silver-back", "?finish=silver&dial=white&view=back&t=0"],
  ["silver-side", "?finish=silver&dial=white&view=side&zoom=1.4"],
  ["silver-dial-closeup", "?finish=silver&dial=white&view=front&zoom=2.6&t=30"],
  ["gold-three", "?finish=gold&dial=white&view=three&t=45"],
  ["rosegold-black-front", "?finish=rosegold&dial=black&view=front&t=15"],
  ["rosegold-white-three", "?finish=rosegold&dial=white&view=three&t=20"],
  ["black-three", "?finish=black&dial=black&view=three&t=5"],
  ["black-dial-closeup", "?finish=black&dial=black&view=front&zoom=2.6&t=45"],
  ["mesh-silver-three", "?finish=silver&dial=white&view=three&strap=mesh-silver&t=10"],
  ["mesh-silver-strap", "?finish=silver&dial=white&view=strap&strap=mesh-silver&zoom=0.6"],
  ["mesh-links-closeup", "?finish=silver&dial=white&view=three&strap=mesh-silver&zoom=3&target=0.1,-1.5,-0.5"],
  ["mesh-clasp-closeup", "?finish=silver&dial=white&view=back&strap=mesh-silver&zoom=2.4&target=0,-0.5,-2.4"],
  ["caseback-closeup", "?finish=silver&dial=white&view=back&strap=none&zoom=2.4"],
  ["caseback-black-closeup", "?finish=black&dial=black&view=back&strap=none&zoom=2.4"],
  ["mesh-black-back", "?finish=black&dial=black&view=back&strap=mesh-silver&zoom=0.7"],
  ["leather-strap", "?finish=silver&dial=white&view=strap&zoom=0.55"],
  ["leather-buckle-closeup", "?finish=gold&dial=white&view=back&zoom=2.4&target=0,0,-2.85"],
  ["leather-closeup", "?finish=silver&dial=white&view=three&zoom=3&target=0,1.4,-0.6"],
  ["crown-closeup", "?finish=silver&dial=white&view=side&strap=none&zoom=4&target=1,0,0"],
  ["crystal-transmission", "?finish=silver&dial=white&view=three&glass=transmission&strap=none"],
  ["seconds-t0", "?finish=silver&dial=white&view=front&zoom=2.2&t=0&strap=none"],
  ["seconds-t15", "?finish=silver&dial=white&view=front&zoom=2.2&t=15&strap=none"],
];
let first = null; const perShot = {};
for (const [name, qs] of shots) {
  await page.goto(`http://localhost:${PORT}/glbqa.html${qs}`); await page.waitForFunction(() => window.__report && window.__report.done, null, { timeout: 120000 });
  const rep = await page.evaluate(() => window.__report); if (!first) first = rep; if (rep.errors.length) console.log(name, "ERRORS", rep.errors);
  perShot[name] = { drawCalls: rep.drawCalls, triangles: rep.renderTriangles, programs: rep.programs, probe: rep.probe, errors: rep.errors, strapFiles: Object.keys(rep.files) };
  await page.screenshot({ path: path.join(OUT, `qa-${name}.png`) });
  console.log(name.padEnd(24), JSON.stringify(perShot[name]));
}
first.perShot = perShot; fs.writeFileSync(path.join(OUT, "glbqa-report.json"), JSON.stringify(first, null, 2));
for (const [n, i] of Object.entries(first.files)) { const { hierarchy, ...rest } = i; delete rest.parts; console.log("\n==", n, JSON.stringify(rest)); console.log(hierarchy.join("\n")); }
// contact sheets
async function sheet(names, file, cols = 3) {
  const tiles = []; for (const n of names) { const p = path.join(OUT, `qa-${n}.png`); if (fs.existsSync(p)) tiles.push(await sharp(p).resize(600, 450).toBuffer()); }
  const rows = Math.ceil(tiles.length / cols);
  await sharp({ create: { width: 600 * cols, height: 450 * rows, channels: 3, background: "#000" } }).composite(tiles.map((b, i) => ({ input: b, left: (i % cols) * 600, top: Math.floor(i / cols) * 450 }))).png().toFile(path.join(OUT, file));
}
await sheet(["silver-front", "silver-three", "silver-back", "gold-three", "rosegold-black-front", "rosegold-white-three", "black-three", "silver-side", "silver-dial-closeup"], "qa-finishes.png");
await sheet(["leather-strap", "leather-closeup", "leather-buckle-closeup", "mesh-silver-three", "mesh-silver-strap", "mesh-links-closeup", "mesh-clasp-closeup", "mesh-black-back", "crown-closeup"], "qa-straps.png");
await sheet(["seconds-t0", "seconds-t15", "black-dial-closeup", "crystal-transmission", "caseback-closeup", "caseback-black-closeup"], "qa-details.png", 2);
await browser.close(); server.kill(); fs.unlinkSync("glbqa.html");
console.log("\nrender:", JSON.stringify({ drawCalls: first.drawCalls, tris: first.renderTriangles, programs: first.programs, probe: first.probe, errors: first.errors }));
