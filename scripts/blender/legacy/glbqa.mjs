import { chromium } from "playwright"; import fs from "node:fs";
const PORT = 3131; const browser = await chromium.launch({ channel: "chrome" }); const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("console:", m.text().slice(0, 300)); });
const html = fs.readFileSync(new URL("./glbqa.html", import.meta.url), "utf8");
await page.route(`http://localhost:${PORT}/glbqa.html*`, (r) => r.fulfill({ body: html, contentType: "text/html" }));
const shots = process.env.SHOTS ? JSON.parse(process.env.SHOTS) : [["front", "?view=front"], ["back", "?view=back"], ["three", "?view=three&t=0.7"], ["movement", "?view=movement&t=0.3&zoom=1.6"], ["exploded", "?view=three&explode=1&t=0.2"], ["dial-closeup", "?view=front&zoom=2.4&t=12"]];
let first = null;
for (const [name, qs] of shots) {
  await page.goto(`http://localhost:${PORT}/glbqa.html${qs}`); await page.waitForFunction(() => window.__report && window.__report.done, null, { timeout: 120000 });
  const rep = await page.evaluate(() => window.__report); if (!first) first = rep; if (rep.errors.length) console.log(name, "ERRORS", rep.errors);
  await page.screenshot({ path: `shot-${name}.png` });
}
fs.writeFileSync("glbqa-report.json", JSON.stringify(first, null, 2));
const f = first.files; for (const [n, i] of Object.entries(f)) { const { hierarchy, ...rest } = i; console.log(n, JSON.stringify(rest)); console.log(hierarchy.join("\n")); }
console.log("render:", { drawCalls: first.drawCalls, tris: first.renderTriangles, programs: first.programs, errors: first.errors });
await browser.close();
