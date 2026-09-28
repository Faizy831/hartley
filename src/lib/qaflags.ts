/**
 * Read-once QA switches for profiling the real assets in production builds.
 * `?glbqa=crystal:thin,caseback:off,anim:off,post:off,tr:0.5`
 *   crystal / caseback : transmission (refractive) | thin (transparent, no transmission pass) | off (hidden); default = the model's `glass` setting
 *   anim:off           : freeze the mixer and hand updates
 *   post:off           : disable the post-processing composer
 *   tr:<scale>         : renderer.transmissionResolutionScale
 *   jewels:transmission: keep the export's refractive jewel material (pre-validation behaviour)
 */
export interface QAFlags {
  crystal: "transmission" | "thin" | "off" | null;
  caseback: "transmission" | "thin" | "off" | null;
  anim: boolean;
  post: boolean;
  transmissionScale: number | null;
  /** keep the export's refractive jewels (pre-validation behaviour) */
  jewelsTransmission: boolean;
}
const DEFAULTS: QAFlags = { crystal: null, caseback: null, anim: true, post: true, transmissionScale: null, jewelsTransmission: false };

export const QA: QAFlags = (() => {
  if (typeof window === "undefined") return DEFAULTS;
  const raw = new URLSearchParams(window.location.search).get("glbqa");
  if (!raw) return DEFAULTS;
  const f = { ...DEFAULTS };
  for (const item of raw.split(",")) {
    const [k, v] = item.split(":");
    if ((k === "crystal" || k === "caseback") && (v === "transmission" || v === "thin" || v === "off")) f[k] = v;
    if (k === "anim") f.anim = v !== "off";
    if (k === "post") f.post = v !== "off";
    if (k === "tr" && v && !Number.isNaN(+v)) f.transmissionScale = +v;
    if (k === "jewels") f.jewelsTransmission = v === "transmission";
  }
  return f;
})();
