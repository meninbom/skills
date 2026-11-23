// Falling snow (self-bokeh), chimney smoke, embers, and the hanging lantern.
// Every particle position is a pure function of uTime (seeded attributes, wrap/fract lifetimes).
import * as THREE from 'three';
import { L } from './lighting.mjs';
import { CAM, CABIN, mulberry32 } from './world.mjs';

export function makeParticles({ COMMON, SHADOW_GLSL, DEPTH_GLSL, U, camU, depthTex, RW, RH, K }) {
  const group = new THREE.Scene();
  const F2 = (RH / 2) / Math.tan(CAM.fov * Math.PI / 360); // focal length in render pixels
  const PU = { ...U, ...camU, tDepth: { value: depthTex }, uRes: { value: new THREE.Vector2(RW, RH) }, uF: { value: F2 },
    uFocus: { value: K.focus }, uAperture: { value: K.aperture } };
  const rnd = mulberry32(777);

  // ---------------- snow
  {
    const N = 4600;
    const base = new Float32Array(N * 3), prm = new Float32Array(N * 4);
    const cp = new THREE.Vector3(...CAM.p0), tg = new THREE.Vector3(...CAM.t0);
    const fw = tg.clone().sub(cp).normalize(), rt = new THREE.Vector3().crossVectors(fw, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(rt, fw);
    const th = Math.tan(CAM.fov * Math.PI / 360), tw = th * CAM.aspect;
    for (let i = 0; i < N; i++) {
      // depth distribution: denser near (bokeh) and spread to 75 units
      const u = rnd(); const d = u < 0.05 ? 4.0 + 8 * rnd() : 12 + 63 * Math.pow(rnd(), 0.9);
      const sx = (rnd() * 2 - 1) * 1.25, sy = (rnd() * 2 - 1) * 1.15;
      const p = cp.clone().addScaledVector(fw, d).addScaledVector(rt, sx * tw * d).addScaledVector(up, sy * th * d);
      base.set([sx * tw * d, sy * th * d, d], i * 3); // camera-local: (right, up, depth)
      const span = 2.3 * th * d + 2.0;              // vertical wrap span covers the frame at that depth
      prm.set([0.55 + 0.6 * rnd(), rnd() * 100, 0.6 + 0.8 * rnd(), span], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(base, 3));
    g.setAttribute('aPrm', new THREE.BufferAttribute(prm, 4));
    const m = new THREE.ShaderMaterial({
      uniforms: PU, transparent: true, depthTest: false, depthWrite: false, blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      vertexShader: /* glsl */`
${COMMON}
${SHADOW_GLSL}
uniform float uF, uFocus, uAperture, uSnowK; uniform vec3 uCamR, uCamU, uCamF;
attribute vec4 aPrm;
varying vec3 vCol; varying float vA; varying float vDepth; varying float vSize;
void main(){
  float speed = aPrm.x, ph = aPrm.y, sz = aPrm.z, span = aPrm.w;
  vec3 p = cameraPosition + uCamR * position.x + uCamU * position.y + uCamF * position.z;
  float y0 = p.y - span * 0.5;
  p.y = y0 + mod(p.y - y0 - speed * uTime, span);
  // gentle sway + slow wind toward screen-left
  p.x += 0.25 * sin(uTime * 0.9 + ph) + 0.18 * uTime;
  p.z += 0.20 * sin(uTime * 0.7 + ph * 1.7);
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float d = -mv.z;
  gl_Position = projectionMatrix * mv;
  float coc = (1./max(d, 0.3) - 1./uFocus) * uAperture * uFocus * 6.0;
  coc = coc < 0. ? -coc * 0.25 : coc;
  float core = 0.021 * sz * uF / d;
  float s = max(core, 1.3) + min(coc, 34.);
  gl_PointSize = s;
  vSize = s;
  // energy conservation for the defocused disc
  vA = clamp((max(core, 1.3) * max(core, 1.3)) / (s * s), 0., 1.) * (core < 1.3 ? core / 1.3 : 1.) * (s > 8. ? 0.55 : 1.0) * (s > 24. ? 0.6 : 1.0);
  // lighting: sky + moon (shadowed) + warm windows / lantern (flakes glow as they cross the beams)
  float sh = moonShadowHard(p);
  vec3 c = SKY_HOR * 2.2 + MOON_COL * (0.7 + 0.8 * sh) * 1.6;
  c += beamAt(p, vec3(0), false) * 0.9 + postLight(p, vec3(0), false) * 0.8;
  vec3 lv = LANT_P - p; c += LANT_C * uLantFlick * 0.9 / (dot(lv, lv) + 0.2);
  vec3 wc = vec3(97., 13., ${CABIN.z0.toFixed(1)}) - p; c += PANE_LE * uWinFlick * 0.6 / (dot(wc, wc) + 2.0);
  vCol = c * 0.95;
  vDepth = d;
  if(d < 0.6) vA = 0.;
  if(fract(ph * 0.61803) > uSnowK) vA = 0.;
}`,
      fragmentShader: /* glsl */`
${DEPTH_GLSL}
uniform sampler2D tDepth; uniform vec2 uRes;
varying vec3 vCol; varying float vA; varying float vDepth; varying float vSize;
void main(){
  vec2 q = gl_PointCoord * 2. - 1.;
  float r = length(q);
  float soft = clamp(1.5 / max(vSize, 1.), 0.05, 0.9);
  float disc = 1. - smoothstep(1. - soft, 1., r);
  // bokeh discs get a faint brighter rim
  disc *= 1.0 + 0.35 * smoothstep(0.6, 0.95, r) * step(6., vSize);
  float sd = viewZ(texture(tDepth, gl_FragCoord.xy / uRes).r);
  float occl = clamp((sd - vDepth) / 0.6 + 0.5, 0., 1.);
  float a = disc * vA * occl;
  float fog = exp(-vDepth * 0.006);
  gl_FragColor = vec4(vCol * a * fog, a * 0.9);
}`,
    });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; group.add(pts);
  }

  // ---------------- smoke
  const CH = L.chimneyTop || [CABIN.x1 + 2.0, CABIN.wallTop + 10, 56.0];
  {
    const N = 64;
    const a = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) a.set([i / N, rnd() * 100, 0.7 + 0.6 * rnd(), rnd()], i * 4);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('aPrm', new THREE.BufferAttribute(a, 4));
    const m = new THREE.ShaderMaterial({
      uniforms: { ...PU, uChim: { value: new THREE.Vector3(...CH) } }, transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      vertexShader: /* glsl */`
${COMMON}
${SHADOW_GLSL}
uniform float uF; uniform vec3 uChim;
attribute vec4 aPrm;
varying float vAge; varying float vSeed; varying vec3 vLight; varying float vDepth; varying float vA; varying vec3 vLv;
const float LIFE = 9.0;
void main(){
  float age = fract(uTime / LIFE + aPrm.x);
  float s = aPrm.y;
  vec3 p = uChim + vec3(0., 0.2, 0.);
  float rise = 11.0 * (1. - exp(-age * 2.2));
  p.y += rise;
  // wind bends the plume toward +x (screen-left) and slightly back; curl from layered noise
  float w = age * age * 5.5 + age * 1.2;
  p.x -= w * 0.8; p.x += 0.9 * age * (vn2(vec2(s, uTime * 0.15 + age * 3.)) - 0.5) * 2.;
  p.z += 0.8 * age * (vn2(vec2(s + 7., uTime * 0.12 + age * 2.5)) - 0.5) * 2. + age * 1.2;
  float rad = 0.45 + 2.6 * pow(age, 0.8) * aPrm.z;
  vec4 mv = viewMatrix * vec4(p, 1.);
  float d = -mv.z;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = 2. * rad * uF / d;
  vAge = age; vSeed = s; vDepth = d;
  vA = smoothstep(0.0, 0.07, age) * pow(1. - age, 1.7) * 0.42;
  float sh = moonShadowHard(p + vec3(0., 1., 0.));
  vLight = (SKY_HOR * 1.2 + MOON_COL * 0.9 * (0.3 + 0.7 * sh)) * 0.8;
  // view-space light direction for the puff's pseudo-normal
  vLv = normalize((viewMatrix * vec4(MOON_DIR, 0.)).xyz);
}`,
      fragmentShader: /* glsl */`
${COMMON}
${DEPTH_GLSL}
uniform sampler2D tDepth; uniform vec2 uRes;
varying float vAge; varying float vSeed; varying vec3 vLight; varying float vDepth; varying float vA; varying vec3 vLv;
void main(){
  vec2 q = gl_PointCoord * 2. - 1.; q.y = -q.y;
  float r = length(q);
  if(r > 1.) discard;
  float n = fbm2(q * 1.6 + vec2(vSeed, vSeed * 1.3) + vec2(0., -uTime * 0.25));
  float dens = smoothstep(0.3, 0.95, n * 1.35 - r * 0.95 + 0.22);
  vec3 nrm = normalize(vec3(q * 0.9, sqrt(max(0., 1. - r * r))));
  float lit = clamp(dot(nrm, vLv) * 0.6 + 0.5, 0., 1.);
  vec3 col = vLight * (0.35 + 0.9 * lit) * 0.9;
  // fire glow from below while the smoke is young
  col += vec3(1.6, 0.55, 0.15) * 0.08 * exp(-vAge * 14.) * (1. - q.y) ;
  float sd = viewZ(texture(tDepth, gl_FragCoord.xy / uRes).r);
  float occl = clamp((sd - vDepth) / 1.5 + 0.5, 0., 1.);
  float a = dens * vA * occl;
  gl_FragColor = vec4(col * a, a);
}`,
    });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; group.add(pts);
  }

  // ---------------- embers
  {
    const N = 22;
    const a = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) a.set([rnd(), rnd() * 100, 0.6 + 0.8 * rnd(), rnd()], i * 4);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('aPrm', new THREE.BufferAttribute(a, 4));
    const m = new THREE.ShaderMaterial({
      uniforms: { ...PU, uChim: { value: new THREE.Vector3(...CH) } }, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
${COMMON}
uniform float uF; uniform vec3 uChim;
attribute vec4 aPrm;
varying float vB; varying float vDepth;
void main(){
  float life = 2.2 + aPrm.z * 1.5;
  float age = fract(uTime / life + aPrm.x);
  float s = aPrm.y;
  vec3 p = uChim + vec3((aPrm.w - 0.5) * 0.6, 0.3, (h12(vec2(s, 1.)) - 0.5) * 0.6);
  p.y += age * (3.5 + 2.5 * aPrm.z);
  p.x -= age * age * 1.8; p.x += 0.35 * sin(age * 9. + s);
  p.z += 0.3 * sin(age * 7. + s * 2.);
  vec4 mv = viewMatrix * vec4(p, 1.);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = 3.0;
  float flick = 0.6 + 0.4 * sin(uTime * 23. + s * 10.);
  vB = (1. - age) * smoothstep(0., 0.1, age) * flick;
}`,
      fragmentShader: /* glsl */`
${DEPTH_GLSL}
uniform sampler2D tDepth; uniform vec2 uRes;
varying float vB; varying float vDepth;
void main(){
  vec2 q = gl_PointCoord * 2. - 1.; float r = length(q);
  float sd = viewZ(texture(tDepth, gl_FragCoord.xy / uRes).r);
  if(sd < vDepth) discard;
  float a = exp(-r * r * 3.);
  gl_FragColor = vec4(vec3(4.0, 1.5, 0.35) * vB * a * 1.4, 1.);
}`,
    });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; group.add(pts);
  }
  return group;
}

// lantern: iron frame + glowing glass, hung from the porch awning. Part of the opaque pass (writes depth).
export function makeLantern(U) {
  const g = new THREE.Group();
  const P = new THREE.Vector3(...L.lantern);
  const iron = new THREE.ShaderMaterial({ uniforms: U, vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vW = (modelMatrix * vec4(position,1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`,
    fragmentShader: `uniform float uLantFlick; varying vec3 vN; varying vec3 vW; const vec3 LP = vec3(${L.lantern.join(',')});
    void main(){ vec3 l = LP - vW; float d = length(l); float lit = max(0., dot(vN, l / d)) * 0.25 / (d*d + 0.02);
      gl_FragColor = vec4(vec3(0.03, 0.028, 0.03) * (0.4 + 0.6*max(vN.y, 0.)) + vec3(1.5, 0.7, 0.2) * uLantFlick * lit * 0.08, 1.); }` });
  const glass = new THREE.ShaderMaterial({ uniforms: U, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform float uLantFlick; varying vec2 vUv; void main(){ vec2 q = abs(vUv - 0.5); float core = 1. - smoothstep(0.1, 0.5, max(q.x, q.y));
      gl_FragColor = vec4(vec3(5.5, 2.4, 0.7) * uLantFlick * (0.55 + 0.9 * core), 1.); }` });
  const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(P.x + x, P.y + y, P.z + z); g.add(b); return b; };
  box(0.2, 0.26, 0.2, glass, 0, 0, 0);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.035, 0.30, 0.035, iron, x * 0.105, 0, z * 0.105);
  box(0.27, 0.04, 0.27, iron, 0, -0.15, 0);
  box(0.25, 0.05, 0.25, iron, 0, 0.16, 0);
  box(0.13, 0.06, 0.13, iron, 0, 0.21, 0);
  box(0.02, 0.62, 0.02, iron, 0, 0.55, 0); // chain up to the awning
  g.traverse(o => { o.frustumCulled = false; });
  return g;
}

// icicles along the front eave and the porch awning (thin cones, translucent ice lit by the warm windows)
export function makeIcicles(U) {
  const rnd = mulberry32(4242);
  const geos = [];
  const add = (x0, x1, y, z, maxLen) => {
    for (let x = x0; x < x1; x += 0.16 + rnd() * 0.22) {
      if (rnd() < 0.25) continue;
      const len = 0.08 + Math.pow(rnd(), 2.2) * maxLen;
      const g = new THREE.ConeGeometry(0.025 + len * 0.06, len, 5, 1);
      g.rotateX(Math.PI); g.translate(x, y - len / 2, z + (rnd() - 0.5) * 0.08);
      geos.push(g);
    }
  };
  add(CABIN.x0 - 2, CABIN.x1 + 3, CABIN.wallTop + 1, CABIN.z0 - 1.85, 0.9);
  add(95, 100, CABIN.y0 + 3, CABIN.z0 - 0.85, 0.45);
  // merge
  const gis = geos.map(g => g.toNonIndexed()); let n = 0; for (const g of gis) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3); let o = 0; const idx = [];
  for (const gi of gis) { pos.set(gi.attributes.position.array, o * 3); nrm.set(gi.attributes.normal.array, o * 3); for (let i = 0; i < gi.attributes.position.count; i++) idx.push(o + i); o += gi.attributes.position.count; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, o * 3), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm.subarray(0, o * 3), 3));
  const mat = new THREE.ShaderMaterial({ uniforms: U,
    vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN = normal; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform float uLantFlick, uWinFlick; varying vec3 vN; varying vec3 vW;
      const vec3 LP = vec3(${L.lantern.join(',')}); const vec3 LC = vec3(${L.lantCol.join(',')}); const vec3 PL = vec3(${L.paneLe.join(',')});
      void main(){ vec3 V = normalize(cameraPosition - vW); vec3 n = normalize(vN);
        float fr = pow(1. - abs(dot(n, V)), 3.);
        vec3 l = LP - vW; float d2 = dot(l, l);
        vec3 c = vec3(0.020, 0.032, 0.055) * (0.6 + 1.2 * fr);
        c += LC * uLantFlick * (0.25 + 1.5 * fr) / (d2 + 0.4);
        vec3 w1 = vec3(94., 13., ${CABIN.z0}.) - vW, w2 = vec3(100., 13., ${CABIN.z0}.) - vW;
        c += PL * uWinFlick * 0.06 * (1. / (dot(w1, w1) + 1.) + 1. / (dot(w2, w2) + 1.)) * (0.5 + 2. * fr);
        gl_FragColor = vec4(c, 1.); }` });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false;
  return m;
}

// a small voxel fox sitting on the path, looking at the cabin (tail sways, ears flick)
export function makeFox({ U, COMMON, SHADOW_GLSL }, at, yaw) {
  const u = 1 / 12;
  const OR = [0.56, 0.21, 0.055], CR = [0.78, 0.70, 0.60], DK = [0.07, 0.045, 0.035], WH = [0.86, 0.86, 0.84];
  const boxes = [
    // [x0,x1, y0,y1, z0,z1, colour, part]
    [-2.5, 2.5, 0, 4.2, -4.2, 1, OR, 0],
    [-2.1, 2.1, 2, 7.2, -0.2, 3, OR, 0],
    [-1.7, 1.7, 2.6, 6.6, 2.9, 3.2, CR, 0],
    [-2.5, 2.5, 6.6, 10.6, 0.8, 5, OR, 10],
    [-2.5, 2.5, 6.6, 7.6, 3.4, 5.1, CR, 10],          // cheeks
    [-1.2, 1.2, 6.9, 8.6, 5, 7.4, CR, 10],
    [-0.6, 0.6, 7.9, 8.7, 7.4, 7.9, DK, 10],
    [-0.9, 0.9, 6.9, 7.3, 5, 7.0, WH, 10],
    [-2.4, -1.0, 10.6, 12.4, 1.8, 3.0, OR, 8], [-2.4, -1.0, 12.4, 13.4, 1.8, 3.0, DK, 8],
    [1.0, 2.4, 10.6, 12.4, 1.8, 3.0, OR, 9], [1.0, 2.4, 12.4, 13.4, 1.8, 3.0, DK, 9],
    [-1.9, -0.8, 0, 3.0, 1.6, 2.7, DK, 0], [0.8, 1.9, 0, 3.0, 1.6, 2.7, DK, 0],
    [-2.0, -0.6, 0, 0.8, 2.4, 3.6, DK, 0], [0.6, 2.0, 0, 0.8, 2.4, 3.6, DK, 0],
    [-2.6, -1.2, 9.0, 9.8, 4.9, 5.05, DK, 10], [1.2, 2.6, 9.0, 9.8, 4.9, 5.05, DK, 10], // eyes
  ];
  // tail: curls from the back around the right side, resting on the snow
  for (let i = 0; i < 8; i++) {
    const th = -Math.PI * 0.95 + i * 0.27, r = 4.6 + i * 0.1;
    const cx = Math.sin(th) * r * -1, cz = Math.cos(th) * r - 1.2, s = 1.35 - Math.abs(i - 3) * 0.08;
    boxes.push([cx - s, cx + s, 0.1, 0.1 + 2 * s * 0.85, cz - s, cz + s, i >= 6 ? WH : OR, 1 + i]);
  }
  const pos = [], nrm = [], col = [], part = [];
  for (const [x0, x1, y0, y1, z0, z1, c, p] of boxes) {
    const g = new THREE.BoxGeometry((x1 - x0) * u, (y1 - y0) * u, (z1 - z0) * u).toNonIndexed();
    g.translate((x0 + x1) / 2 * u, (y0 + y1) / 2 * u, (z0 + z1) / 2 * u);
    const P = g.attributes.position.array, N = g.attributes.normal.array;
    for (let i = 0; i < P.length / 3; i++) { pos.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); nrm.push(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]); col.push(...c); part.push(p); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexColors: true,
    vertexShader: /* glsl */`
uniform float uTime, uFoxHead, uFoxEar; attribute float aPart; varying vec3 vN; varying vec3 vW; varying vec3 vC; varying vec3 vL;
void main(){
  vec3 p = position; vec3 n = normal;
  if(aPart >= 1. && aPart < 8.5 && aPart != 8.){ // tail sway, growing toward the tip
    float k = (aPart - 1.) / 7.; float a = sin(uTime * 1.25 + k * 1.6) * 0.22 * k;
    vec3 root = vec3(0., 0., -0.35);
    vec3 q = p - root; float c = cos(a), s = sin(a); q = vec3(c*q.x + s*q.z, q.y, -s*q.x + c*q.z); p = q + root;
    n = vec3(c*n.x + s*n.z, n.y, -s*n.x + c*n.z);
  }
  if(aPart > 7.5 && aPart < 9.5){ // ear flicks at t = 3.2 s and 7.8 s
    float f = uFoxEar;
    float side = aPart > 8.5 ? 1. : -1.;
    vec3 piv = vec3(side * 0.14, 0.88, 0.2); vec3 q = p - piv; float a = f * 0.5 * side;
    float c = cos(a), s = sin(a); q = vec3(c*q.x - s*q.y, s*q.x + c*q.y, q.z); p = q + piv;
  }
  if(aPart > 7.5){ // head turn toward the camera (3.6-4.6 s), holds, turns back (7.0-8.2 s); ears ride along
    float a = uFoxHead + 0.05 * sin(uTime * 0.8);
    vec3 piv = vec3(0., 7.0 / 12., 1.6 / 12.); vec3 q = p - piv; float c = cos(a), s = sin(a);
    q = vec3(c*q.x + s*q.z, q.y, -s*q.x + c*q.z); p = q + piv; n = vec3(c*n.x + s*n.z, n.y, -s*n.x + c*n.z);
  }
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * n); vC = color;
  vL = vec3(position.x * 12., position.y * 12., position.z * 12.);
  gl_Position = projectionMatrix * viewMatrix * w;
}`,
    fragmentShader: /* glsl */`
${COMMON}
${SHADOW_GLSL}
varying vec3 vN; varying vec3 vW; varying vec3 vC; varying vec3 vL;
void main(){
  vec3 n = normalize(vN);
  float fur = 0.85 + 0.3 * h13(floor(vL * 2.) + 0.5);
  vec3 alb = vC * fur;
  float sh = moonShadow(vW, n, ign(gl_FragCoord.xy) * 6.28, 0.022);
  vec3 lit = (SKY_HOR * 0.9 + SKY_ZEN * 2.) * (0.55 + 0.45 * n.y) * 1.3;
  lit += MOON_COL * max(0., dot(n, MOON_DIR)) * sh * 1.25;
  lit += beamAt(vW + n * 0.01, n, true);
  lit += postLight(vW + n * 0.02, n, true);
  vec3 pp = POST1 - vW; float backP = max(0., dot(-normalize(cameraPosition - vW), normalize(pp)));
  vec3 lp = LANT_P - vW; float ld = length(lp); lit += LANT_C * uLantFlick * max(0., dot(n, lp / ld)) / (ld * ld + 0.15);
  vec3 wc = vec3(97., 13., ${CABIN.z0.toFixed(1)}) - vW; lit += PANE_LE * uWinFlick * 0.5 * max(0., dot(n, normalize(wc)) * 0.7 + 0.3) / (dot(wc, wc) + 4.);
  // rim from the warm windows (fur catches the light)
  vec3 V = normalize(cameraPosition - vW);
  float rim = pow(1. - max(0., dot(n, V)), 3.);
  float back = max(0., dot(-V, normalize(wc))) ;
  vec3 col = alb * lit + rim * vec3(1.0, 0.42, 0.10) * (0.05 + 0.3 * back + 0.5 * backP) * uWinFlick + alb * PANE_LE * 0.025 * back * uWinFlick;
  gl_FragColor = vec4(col, 1.);
}` });
  const m = new THREE.Mesh(geo, mat); m.name = 'fox';
  m.position.set(at[0], at[1], at[2]); m.rotation.y = yaw; m.scale.setScalar(1.45); m.frustumCulled = false;
  return m;
}

// foreground props: two lantern posts along the path, bridge railings with snow caps, snow cap + axe on the stump
import { curves, distStream } from './world.mjs';
export function makeProps({ U, COMMON, SHADOW_GLSL }) {
  const WOOD = [0.30, 0.18, 0.10], DWOOD = [0.17, 0.10, 0.06], SNOWC = [0.82, 0.86, 0.92], IRON = [0.035, 0.032, 0.035], GLASS = [5.5, 2.4, 0.7];
  const pos = [], nrm = [], col = [], emi = [];
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), T = new THREE.Vector3();
  const box = (cx, cy, cz, sx, sy, sz, c, e = 0, ry = 0, rz = 0, rx = 0) => {
    const g = new THREE.BoxGeometry(sx, sy, sz).toNonIndexed();
    M4.compose(T.set(cx, cy, cz), Q.setFromEuler(E.set(rx, ry, rz, 'YXZ')), S.set(1, 1, 1)); g.applyMatrix4(M4);
    const P = g.attributes.position.array, N = g.attributes.normal.array;
    for (let i = 0; i < P.length / 3; i++) { pos.push(P[3 * i], P[3 * i + 1], P[3 * i + 2]); nrm.push(N[3 * i], N[3 * i + 1], N[3 * i + 2]); col.push(...c); emi.push(e); }
  };
  // lantern posts: post with snow cap, arm, hanging lantern (glass emissive)
  for (const [lx, ly, lz] of L.posts) {
    const base = ly - 1.45, px = lx - 0.32;
    box(px, base + 0.9, lz, 0.16, 1.8, 0.16, WOOD);
    box(px, base + 1.83, lz, 0.2, 0.07, 0.2, SNOWC);
    box(px + 0.18, base + 1.68, lz, 0.5, 0.07, 0.08, DWOOD);
    box(px + 0.38, base + 1.74, lz, 0.5, 0.04, 0.12, SNOWC);
    box(lx, ly + 0.2, lz, 0.02, 0.12, 0.02, IRON);
    box(lx, ly, lz, 0.17, 0.22, 0.17, GLASS, 1);
    for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(lx + ox * 0.09, ly, lz + oz * 0.09, 0.03, 0.26, 0.03, IRON);
    box(lx, ly + 0.14, lz, 0.22, 0.05, 0.22, IRON); box(lx, ly - 0.13, lz, 0.22, 0.04, 0.22, IRON);
  }
  // bridge railings along the stretch of path that crosses the ice
  const path = curves().path;
  const over = path.map(p => distStream(p[0], p[1]) < 3.4);
  const i0 = over.indexOf(true), i1 = over.lastIndexOf(true);
  if (i0 >= 0) {
    const a = path[Math.max(0, i0 - 1)], b = path[Math.min(path.length - 1, i1 + 1)];
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
    const ry = Math.atan2(ux, uz);
    for (const side of [-1, 1]) {
      const ox = -uz * 1.55 * side, oz = ux * 1.55 * side;
      const nP = Math.max(2, Math.round(len / 1.6));
      for (let k = 0; k <= nP; k++) {
        const t = k / nP, x = a[0] + dx * t + ox, z = a[1] + dz * t + oz;
        box(x, 11.5, z, 0.14, 1.0, 0.14, DWOOD, 0, ry);
        box(x, 12.04, z, 0.18, 0.08, 0.18, SNOWC, 0, ry);
      }
      const mx = (a[0] + b[0]) / 2 + ox, mz = (a[1] + b[1]) / 2 + oz;
      box(mx, 11.88, mz, 0.09, 0.09, len, WOOD, 0, ry);
      box(mx, 11.95, mz, 0.12, 0.05, len * 0.97, SNOWC, 0, ry);
      box(mx, 11.45, mz, 0.07, 0.07, len, WOOD, 0, ry);
    }
  }
  // stump: snow cap + an axe buried in it
  const [sx, sy, sz] = L.stump;
  box(sx, sy + 0.06, sz, 0.86, 0.12, 0.86, SNOWC);
  box(sx + 0.05, sy + 0.42, sz - 0.05, 0.05, 0.8, 0.05, [0.38, 0.25, 0.13], 0, 0.7, 0.42);
  box(sx - 0.1, sy + 0.08, sz + 0.05, 0.08, 0.2, 0.26, [0.20, 0.21, 0.23], 0, 0.7, 0.42);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute('aEmi', new THREE.Float32BufferAttribute(emi, 1));
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexColors: true,
    vertexShader: `attribute float aEmi; varying vec3 vN; varying vec3 vW; varying vec3 vC; varying float vE;
      void main(){ vN = normal; vW = position; vC = color; vE = aEmi; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
${COMMON}
${SHADOW_GLSL}
varying vec3 vN; varying vec3 vW; varying vec3 vC; varying float vE;
void main(){
  if(vE > 0.5){ gl_FragColor = vec4(vC * (0.97 + 0.05 * sin(uTime * 4.3 + vW.x)), 1.); return; }
  vec3 n = normalize(vN);
  float sh = moonShadow(vW, n, ign(gl_FragCoord.xy) * 6.28, 0.022);
  vec3 lit = (SKY_HOR * 0.9 + SKY_ZEN * 2.) * (0.55 + 0.45 * n.y) * 1.2;
  lit += MOON_COL * max(0., dot(n, MOON_DIR)) * sh * 1.25;
  lit += beamAt(vW + n * 0.01, n, true) + postLight(vW + n * 0.03, n, true);
  vec3 lp = LANT_P - vW; float ld = length(lp); lit += LANT_C * uLantFlick * max(0., dot(n, lp / ld)) / (ld * ld + 0.15);
  float grain = 0.88 + 0.24 * h13(floor(vW * 24.));
  gl_FragColor = vec4(vC * grain * lit, 1.);
}` });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false;
  return m;
}
