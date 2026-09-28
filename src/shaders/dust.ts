export const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  attribute float aScale;
  attribute float aSpeed;
  attribute float aPhase;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float t = uTime * aSpeed;
    p.x += sin(t * 0.7 + aPhase) * 0.25;
    p.y += sin(t * 0.45 + aPhase * 1.7) * 0.2 + fract(t * 0.02 + aPhase) * 0.0;
    p.z += cos(t * 0.5 + aPhase * 0.9) * 0.2;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = uSize * aScale * uPixelRatio * (6.0 / depth);
    // fade with distance & twinkle
    vAlpha = smoothstep(14.0, 3.0, depth) * (0.55 + 0.45 * sin(t * 1.3 + aPhase * 3.1));
  }
`;

export const dustFragment = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;

  // Each mote is a crisp disc drawn analytically from the point's own coordinates: the edge is one
  // pixel of anti-aliasing wide at any pixel ratio (fwidth measures the point-coord step per pixel),
  // so the particles never soften with resolution or distance. The disc uses the inner part of the
  // point so the motes read at the same size as the sprite they replace.
  const float DISC = 0.62;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0 / DISC;
    float aa = fwidth(d);
    float disc = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, d);
    if (disc <= 0.0) discard;
    gl_FragColor = vec4(vec3(1.0, 0.97, 0.92), disc * vAlpha * uOpacity);
  }
`;
