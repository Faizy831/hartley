import * as THREE from "three";
import type { DialSpec } from "@/data/finishes";

/**
 * All textures are generated on a <canvas> at runtime: no external image
 * assets, fully deterministic and instantly re-tintable.
 */

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  return c;
}

function serifFamily() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim();
  return v ? `${v}, "Instrument Serif", Georgia, serif` : '"Instrument Serif", Georgia, serif';
}
function sansFamily() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-ui").trim();
  return v ? `${v}, Manrope, system-ui, sans-serif` : "Manrope, system-ui, sans-serif";
}

export interface DialTextOptions {
  brand: string;
  subline?: string;
  footline?: string;
  footline2?: string;
  /** Minute track density. */
  track: "full" | "fine" | "none";
  /** Radius (0..1 of the dial) below which nothing is printed (skeleton opening). */
  innerClear?: number;
}

/** Dial face: sunburst / matte lacquer with printed track and brand marks. */
export function makeDialTexture(variant: DialSpec, text: DialTextOptions, size = 1024): THREE.CanvasTexture {
  const c = canvas(size);
  const ctx = c.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2;

  ctx.fillStyle = variant.color;
  ctx.fillRect(0, 0, size, size);
  const isDark = luminance(variant.color) < 0.4;

  if (variant.sunburst > 0) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineWidth = 1;
    const strokes = 1400;
    for (let i = 0; i < strokes; i++) {
      const a = (i / strokes) * Math.PI * 2 + (Math.random() - 0.5) * 0.002;
      const alpha = (0.02 + Math.random() * 0.09) * variant.sunburst;
      const light = Math.random() > 0.5;
      ctx.strokeStyle = light ? `rgba(255,255,255,${alpha * (isDark ? 1 : 0.5)})` : `rgba(0,0,0,${alpha * (isDark ? 1.2 : 0.55)})`;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * R * 0.04, Math.sin(a) * R * 0.04);
      ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
      ctx.stroke();
    }
    ctx.restore();
    const sheen = ctx.createConicGradient(-Math.PI / 3, cx, cy);
    const s = variant.sunburst * (isDark ? 0.22 : 0.1);
    sheen.addColorStop(0, `rgba(255,255,255,0)`);
    sheen.addColorStop(0.12, `rgba(255,255,255,${s})`);
    sheen.addColorStop(0.25, `rgba(255,255,255,0)`);
    sheen.addColorStop(0.5, `rgba(0,0,0,${s * 0.6})`);
    sheen.addColorStop(0.62, `rgba(255,255,255,${s * 0.8})`);
    sheen.addColorStop(0.75, `rgba(255,255,255,0)`);
    sheen.addColorStop(1, `rgba(255,255,255,0)`);
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, size, size);
  } else {
    // matte / satin: a whisper of grain so it is not a flat fill
    const img = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * (isDark ? 5 : 4);
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }

  const vig = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.14)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, size, size);

  // --- printed minute track ---
  if (text.track !== "none") {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = variant.ink;
    ctx.strokeStyle = variant.ink;
    const fine = text.track === "fine";
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const major = i % 5 === 0;
      if (fine && !major) continue;
      ctx.save();
      ctx.rotate(a);
      ctx.globalAlpha = major ? 0.85 : 0.5;
      ctx.fillRect(-1, -R * 0.965, major ? 2.5 : 1.5, major ? R * (fine ? 0.035 : 0.05) : R * 0.028);
      ctx.restore();
    }
    ctx.globalAlpha = fine ? 0.22 : 0.35;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.965, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // --- brand marks ---
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = variant.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const brandY = text.innerClear ? -R * (text.innerClear + 0.16) : -R * 0.4;
  ctx.globalAlpha = 0.95;
  ctx.font = `400 ${size * (text.innerClear ? 0.046 : 0.056)}px ${serifFamily()}`;
  drawTracked(ctx, text.brand, 0, brandY, size * 0.014);
  if (text.subline) {
    ctx.globalAlpha = 0.55;
    ctx.font = `500 ${size * 0.018}px ${sansFamily()}`;
    drawTracked(ctx, text.subline, 0, brandY + R * 0.075, size * 0.006);
  }
  if (text.footline) {
    const footY = text.innerClear ? R * (text.innerClear + 0.15) : R * 0.47;
    ctx.globalAlpha = 0.7;
    ctx.font = `500 ${size * 0.02}px ${sansFamily()}`;
    drawTracked(ctx, text.footline, 0, footY, size * 0.007);
    if (text.footline2) {
      ctx.globalAlpha = 0.45;
      ctx.font = `500 ${size * 0.0155}px ${sansFamily()}`;
      drawTracked(ctx, text.footline2, 0, footY + R * 0.06, size * 0.005);
    }
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function drawTracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number) {
  const chars = text.split("");
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  let cursor = x - total / 2;
  const align = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((ch, i) => {
    ctx.fillText(ch, cursor, y);
    cursor += widths[i] + tracking;
  });
  ctx.textAlign = align;
}

function luminance(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* Shared textures are generated once per session and never disposed:
   they are small, and keeping them lets a family return without rebuilding. */
const shared: Record<string, THREE.CanvasTexture> = {};
export function sharedTexture(key: "geneva" | "perlage" | "croc" | "mesh", make: () => THREE.CanvasTexture) {
  return (shared[key] ??= make());
}
const casebackCache = new Map<string, THREE.CanvasTexture>();
export function casebackTextureFor(text: string) {
  let t = casebackCache.get(text);
  if (!t) {
    t = makeCasebackTexture(text);
    casebackCache.set(text, t);
  }
  return t;
}

/** Côtes de Genève: diagonal stripes with a soft sawtooth ramp. */
export function makeGenevaTexture(size = 512): THREE.CanvasTexture {
  const c = canvas(size);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#b9bcc2";
  ctx.fillRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(-Math.PI / 5);
  const band = size / 7;
  for (let i = -12; i < 12; i++) {
    const x = i * band;
    const grad = ctx.createLinearGradient(x, 0, x + band, 0);
    grad.addColorStop(0, "rgba(255,255,255,0.28)");
    grad.addColorStop(0.55, "rgba(255,255,255,0.0)");
    grad.addColorStop(0.92, "rgba(0,0,0,0.22)");
    grad.addColorStop(1, "rgba(0,0,0,0.05)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, -size, band, size * 2);
  }
  ctx.restore();
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Perlage: overlapping circular graining on the mainplate. */
export function makePerlageTexture(size = 512): THREE.CanvasTexture {
  const c = canvas(size);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#a9adb4";
  ctx.fillRect(0, 0, size, size);
  const step = size / 22;
  for (let y = 0; y < size + step; y += step * 0.8) {
    for (let x = 0; x < size + step; x += step) {
      const ox = ((y / (step * 0.8)) % 2) * step * 0.5;
      const g = ctx.createRadialGradient(x + ox, y, 0, x + ox, y, step * 0.62);
      g.addColorStop(0, "rgba(255,255,255,0.1)");
      g.addColorStop(0.75, "rgba(255,255,255,0.01)");
      g.addColorStop(0.95, "rgba(0,0,0,0.12)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x + ox, y, step * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Engraved caseback ring: text around the circumference (planar UV). */
export function makeCasebackTexture(text: string, size = 1024): THREE.CanvasTexture {
  const c = canvas(size);
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const R = size / 2;
  ctx.fillStyle = "rgba(20,20,22,0.9)";
  ctx.font = `500 ${size * 0.03}px ${sansFamily()}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.save();
  ctx.translate(cx, cx);
  const radius = R * 0.86;
  const chars = text.split("");
  const total = chars.reduce((a, ch) => a + ctx.measureText(ch).width + size * 0.008, 0);
  const circ = Math.PI * 2 * radius;
  const scale = circ / total;
  let a = -Math.PI / 2;
  for (const ch of chars) {
    const w = (ctx.measureText(ch).width + size * 0.008) * scale;
    const da = w / radius;
    ctx.save();
    ctx.rotate(a + da / 2);
    ctx.translate(0, -radius);
    ctx.scale(scale, scale);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    a += da;
  }
  ctx.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ------------------------------------------------------------------
   Height → normal conversion for procedural surface textures
   ------------------------------------------------------------------ */
function heightToNormal(src: HTMLCanvasElement, strength: number): THREE.CanvasTexture {
  const size = src.width;
  const sctx = src.getContext("2d")!;
  const h = sctx.getImageData(0, 0, size, size).data;
  const out = canvas(size);
  const octx = out.getContext("2d")!;
  const img = octx.createImageData(size, size);
  const at = (x: number, y: number) => h[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / len) * 0.5 * 255 + 127;
      img.data[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Crocodile embossing: irregular rounded scales in staggered rows. */
export function makeCrocNormal(size = 256): THREE.CanvasTexture {
  const c = canvas(size);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#606060";
  ctx.fillRect(0, 0, size, size);
  const cols = 5;
  const rows = 7;
  const cw = size / cols;
  const rh = size / rows;
  for (let j = -1; j <= rows; j++) {
    for (let i = -1; i <= cols; i++) {
      const ox = (j % 2) * cw * 0.5;
      const x = i * cw + ox + (Math.random() - 0.5) * cw * 0.12;
      const y = j * rh + (Math.random() - 0.5) * rh * 0.12;
      const w = cw * (0.78 + Math.random() * 0.12);
      const hh = rh * (0.72 + Math.random() * 0.14);
      const g = ctx.createRadialGradient(x + w / 2, y + hh / 2, 0, x + w / 2, y + hh / 2, Math.max(w, hh) * 0.62);
      g.addColorStop(0, "#c8c8c8");
      g.addColorStop(0.7, "#9a9a9a");
      g.addColorStop(1, "#404040");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, y, w, hh, Math.min(w, hh) * 0.35);
      ctx.fill();
    }
  }
  return heightToNormal(c, 2.2);
}

/** Milanese mesh: interlocking rows of small links. */
export function makeMeshNormal(size = 256): THREE.CanvasTexture {
  const c = canvas(size);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#303030";
  ctx.fillRect(0, 0, size, size);
  const n = 12;
  const cell = size / n;
  for (let j = -1; j <= n; j++) {
    for (let i = -1; i <= n; i++) {
      const ox = (j % 2) * cell * 0.5;
      const x = i * cell + ox + cell / 2;
      const y = j * cell + cell / 2;
      const g = ctx.createRadialGradient(x, y, 0, x, y, cell * 0.55);
      g.addColorStop(0, "#e0e0e0");
      g.addColorStop(0.55, "#8a8a8a");
      g.addColorStop(1, "#202020");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, cell * 0.52, cell * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return heightToNormal(c, 3.0);
}
