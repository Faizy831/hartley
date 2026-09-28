const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto("http://localhost:3000/watch/legacy-silver-with-steel-bracelet?quality=high", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector(".nav--ready"), null, { timeout: 90000 }); await page.waitForTimeout(1000);
  await page.evaluate(() => { const v = window.__veloris; Object.assign(v.target, { yaw: 0.5, pitch: 0.12, roll: 0, fit: 0.62, fov: 30, ax: 0.15, ay: 0.02, explode: 0, light: 0, sweep: 0, flat: 0, exposure: 1 }); v.rig.drift = 0; v.snap(); });
  await page.waitForTimeout(600);
  const res = await page.evaluate(() => {
    const v = window.__veloris; const { gl, scene, camera: cam, THREE, glbHead: h, glbStrap: st } = v;
    const W = 480, H = 300;
    const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, format: THREE.RGBAFormat, depthBuffer: true });
    const buf = new Float32Array(W * H * 4);
    const scan = () => { const prev = gl.getRenderTarget(); const tm = gl.toneMapping; gl.toneMapping = THREE.NoToneMapping; gl.setRenderTarget(rt); gl.clear(); gl.render(scene, cam); gl.readRenderTargetPixels(rt, 0, 0, W, H, buf); gl.setRenderTarget(prev); gl.toneMapping = tm; let nan = 0, inf = 0, huge = 0, max = 0; for (let i = 0; i < buf.length; i += 4) { for (let k = 0; k < 3; k++) { const x = buf[i + k]; if (Number.isNaN(x)) { nan++; break; } if (!Number.isFinite(x)) { inf++; break; } if (x > 65504) huge++; if (x > max) max = x; } } return { nan, inf, huge, max: +max.toFixed(1) }; };
    const out = { all: scan() };
    const dial = h.scene.getObjectByName("Dial_Plate"); dial.visible = false; out.dialHidden = scan();
    const fams = {}; h.scene.traverse((o) => { if (!o.isMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) (fams[m.name] = fams[m.name] || []).push(o); });
    for (const [name, meshes] of Object.entries(fams)) { for (const m of meshes) m.visible = false; out["dialHidden_hide_" + name] = scan().nan; for (const m of meshes) m.visible = true; }
    dial.visible = true;
    if (st) { const sf = {}; st.scene.traverse((o) => { if (!o.isMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) (sf[m.name] = sf[m.name] || []).push(o); }); for (const [name, meshes] of Object.entries(sf)) { for (const m of meshes) m.visible = false; out["strap_hide_" + name] = scan().nan; for (const m of meshes) m.visible = true; } }
    // uv presence per aniso family
    out.anisoNoUV = []; h.scene.traverse((o) => { if (!o.isMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) if (m.anisotropy > 0 && !o.geometry.attributes.uv) out.anisoNoUV.push(o.name + ":" + m.name); });
    return out;
  });
  console.log(JSON.stringify(res, null, 0));
  await browser.close();
})();
