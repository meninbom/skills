// Snow cabin at blue hour. Hybrid renderer: baked voxel path-traced GI (bake.mjs) + per-pixel moon PCSS shadows,
// analytic window beams, raymarched volumetrics, aurora sky, particles, DOF, bloom, AgX grade.
import * as THREE from 'three';
import { L } from './lighting.mjs';
import { CAM, CABIN, NX, NY, NZ, GROUND } from './world.mjs';
import { makeParticles, makeLantern, makeIcicles, makeFox, makeProps } from './particles.js';

const P = new URLSearchParams(location.search);
const W = 720, H = 1280, SS = +(P.get('ss') || 1), RW = W * SS, RH = H * SS;
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
const OW = 1080, OH = 1920;
renderer.setPixelRatio(1); renderer.setSize(RW, RH, false); // game: draw at the internal size, CSS fits it to the window
renderer.autoClear = false;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // we encode ourselves in the final pass
document.body.appendChild(renderer.domElement);

const v3 = a => new THREE.Vector3(a[0], a[1], a[2]);
const f3 = a => `vec3(${a.map(x => (+x).toFixed(5)).join(',')})`;

// ---------------------------------------------------------------- tunables (art direction knobs)
export const K = {
  exposure: +(P.get('exp') || 5.2),
  sky: 1.0, moon: 1.25, warmBake: 1.0, beam: 1.0, lant: 1.0,
  fogDensity: 0.0045, farD: 0.011, fogHeight: 14.0,
  volMoon: 0.22, volWarm: 2.0,
  focus: 46.0, aperture: +(P.get('ap') || 0.85),
  bloom: 0.10,
};

for (const k of Object.keys(K)) if (P.has(k)) K[k] = +P.get(k);

// ---------------------------------------------------------------- data
const ld = async (f, T) => new T(await (await fetch((P.get('data') || 'data') + '/' + f)).arrayBuffer());
const [pos, info, bake, idx] = await Promise.all([ld('pos.bin', Float32Array), ld('info.bin', Uint8Array), ld('bake.bin', Float32Array), ld('idx.bin', Uint32Array)]);
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('aInfo', new THREE.BufferAttribute(info, 4));
const ib = new THREE.InterleavedBuffer(bake, 10);
geo.setAttribute('aSky', new THREE.InterleavedBufferAttribute(ib, 3, 0));
geo.setAttribute('aMoon', new THREE.InterleavedBufferAttribute(ib, 3, 3));
geo.setAttribute('aWarm', new THREE.InterleavedBufferAttribute(ib, 3, 6));
geo.setAttribute('aLv', new THREE.InterleavedBufferAttribute(ib, 1, 9));
geo.setIndex(new THREE.BufferAttribute(idx, 1));
geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(NX / 2, NY / 2, NZ / 2), 400);

// ---------------------------------------------------------------- camera
const camera = new THREE.PerspectiveCamera(CAM.fov, CAM.aspect, 0.3, 2000);
const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
function setCam(t) {
  const u = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t / 10))); // sine ease, no hard start/stop
  const p = v3(CAM.p0).lerp(v3(CAM.p1), u), tg = v3(CAM.t0).lerp(v3(CAM.t1), u);
  p.y += 0.04 * Math.sin(t * 0.7); // breathing
  camera.position.copy(p); camera.lookAt(tg); camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
}
setCam(0);

// ---------------------------------------------------------------- shared GLSL
const COMMON = /* glsl */`
#define PI 3.14159265
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float h13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h12(i), h12(i+vec2(1,0)), f.x), mix(h12(i+vec2(0,1)), h12(i+vec2(1,1)), f.x), f.y); }
float fbm2(vec2 p){ float s = 0., a = .5; for(int i=0;i<5;i++){ s += a*vn2(p); p = p*2.03 + 17.1; a *= .5; } return s; }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  float a=h13(i),b=h13(i+vec3(1,0,0)),c=h13(i+vec3(0,1,0)),d=h13(i+vec3(1,1,0)),e=h13(i+vec3(0,0,1)),g=h13(i+vec3(1,0,1)),hh=h13(i+vec3(0,1,1)),k=h13(i+vec3(1,1,1));
  return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),mix(mix(e,g,f.x),mix(hh,k,f.x),f.y),f.z); }
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
uniform vec3 MOON_DIR, MOON_COL, SKY_ZEN, SKY_HOR;      // key light (moon or sun) + sky, driven per shot
uniform float uAurK, uStarK, uFlash, uSnowPile, uBurn, uSunVis, uMoonVis, uTrail, uStarSpin;
uniform vec3 uSunDir, uMoonDirS, uBurnC, uSkyTint, uKeyTint, uPortalC, uPortalCol;
uniform vec4 uFire; uniform float uPortal, uCloud, uLampRate; uniform vec4 uCrack;
const vec3 INTERIOR = ${f3(L.interior)};
const vec3 BEAM_I = ${f3(L.beamI)};
const vec3 PANE_LE = ${f3(L.paneLe)};
const vec3 LANT_P = ${f3(L.lantern)};
const vec3 LANT_C = ${f3(L.lantCol)};
const float INTERIOR_R = ${L.interiorR.toFixed(3)};
// windows: axis(0=x plane,2=z plane), plane, a0, a1, y0, y1
const int NWIN = ${L.windows.length};
const float WINS[${L.windows.length * 6}] = float[](${L.windows.map(w => [w.axis, w.plane, w.a0, w.a1, w.y0, w.y1].map(x => x.toFixed(1)).join(',')).join(',')});
uniform float uTime, uWinFlick, uLantFlick;
const vec3 POST0 = ${f3(L.posts[0])}; const vec3 POST1 = ${f3(L.posts[1])};
vec3 postLight(vec3 p, vec3 n, bool useN){
  vec3 a = POST0 - p, b = POST1 - p; float da = dot(a, a), db = dot(b, b);
  float ca = useN ? max(0., dot(n, a * inversesqrt(da))) : 1., cb = useN ? max(0., dot(n, b * inversesqrt(db))) : 1.;
  return LANT_C * 0.36 * (ca / (da + 0.12) * (0.97 + 0.05 * sin(uTime * 4.3 + 1.)) + cb / (db + 0.12) * (0.97 + 0.05 * sin(uTime * 5.1 + 2.)));
}
vec3 beamAt(vec3 p, vec3 n, bool useN){
  vec3 Lp = INTERIOR;
  for(int i=0;i<NWIN;i++){
    float ax = WINS[i*6], pl = WINS[i*6+1], a0 = WINS[i*6+2], a1 = WINS[i*6+3], y0 = WINS[i*6+4], y1 = WINS[i*6+5];
    float pa = ax > 1. ? p.z : p.x, La = ax > 1. ? Lp.z : Lp.x;
    if(!(pa < pl - 0.002 && La > pl)) continue;
    float s = (pl - pa) / (La - pa);
    vec3 q = p + s * (Lp - p);
    float qa = ax > 1. ? q.x : q.z;
    float dl = length(Lp - p);
    float pen = clamp(INTERIOR_R * s / (1. - s), 0.02, 1.5);
    float fr = 0.1, bw = 0.06;
    float inside = clamp((qa-a0-fr)/pen+.5,0.,1.)*clamp((a1-fr-qa)/pen+.5,0.,1.)*clamp((q.y-y0-fr)/pen+.5,0.,1.)*clamp((y1-fr-q.y)/pen+.5,0.,1.);
    if(inside <= 0.) continue;
    float ma = (a0+a1)*.5, my = (y0+y1)*.5;
    float T = inside * clamp((abs(qa-ma)-bw)/pen+.5,0.,1.) * clamp((abs(q.y-my)-bw)/pen+.5,0.,1.);
    float c = useN ? max(0., dot((Lp-p)/dl, n)) : 1.;
    return BEAM_I * (T * c / (dl*dl)) * uWinFlick;
  }
  return vec3(0);
}
// aurora curtains (planar-slice trick): sheets hanging along a wavy line in the sky
// aurora in sky angles: curtains with a crisp lower edge, folds, vertical rays, green body and violet tops
vec3 aurora(vec3 d){
  if(d.y < 0.0) return vec3(0);
  float az = atan(d.x, d.z), el = asin(clamp(d.y, -1., 1.));
  float t = uTime;
  vec3 acc = vec3(0);
  for(int k = 0; k < 3; k++){
    float fk = float(k);
    float a = az * (1.0 + 0.2 * fk) + fk * 1.9;
    float base = 0.275 + 0.06 * fk - 0.035 * (az - 0.5);
    float fold = 0.035 * sin(a * 3.3 + t * 0.07 + fk) + 0.030 * sin(a * 7.9 - t * 0.12 + fk * 2.) + 0.012 * sin(a * 17.0 + t * 0.31);
    float x = el - (base + fold);
    if(x < -0.03) continue;
    float onset = smoothstep(-0.004, 0.010, x);
    float hgt = 0.11 + 0.07 * vn2(vec2(a * 1.3, fk * 5.));
    float body = exp(-max(x, 0.) / (hgt * 0.42));
    float rays = 0.25 + 1.5 * pow(vn2(vec2(a * 34. + t * 0.12, fk * 3.)), 2.4);
    rays *= 0.65 + 0.5 * vn2(vec2(a * 95. - t * 0.2, fk * 9.));
    float patchy = smoothstep(0.2, 0.75, vn2(vec2(a * 1.1 - t * 0.025, fk * 7.)));
    vec3 c = mix(vec3(0.10, 1.0, 0.40), vec3(0.62, 0.12, 0.85), smoothstep(0.015, hgt * 1.3, x));
    c = mix(c, vec3(0.75, 1.0, 0.7), 0.25 * (1. - smoothstep(0., 0.02, x))); // whitish-green hot lower edge
    acc += c * onset * body * rays * patchy * (k == 0 ? 1.0 : (k == 1 ? 0.55 : 0.35));
    // soft halo
    acc += vec3(0.05, 0.35, 0.18) * exp(-abs(x - 0.03) * 18.) * patchy * 0.12;
  }
  float horizonFade = smoothstep(0.02, 0.15, d.y);
  float breathe = 0.9 + 0.06 * sin(t * 0.45);
  return acc * 0.13 * horizonFade * breathe * uAurK;
}
vec2 discUV(vec3 d, vec3 c){ vec3 up = abs(c.y) < 0.99 ? vec3(0,1,0) : vec3(1,0,0); vec3 t = normalize(cross(up, c)); vec3 b = cross(c, t); return vec2(dot(d, t), dot(d, b)); }
vec3 skyBase(vec3 d){
  float y = max(d.y, 0.);
  vec3 c = mix(SKY_HOR, SKY_ZEN, pow(y, 0.5));
  c += vec3(0.020, 0.012, 0.020) * exp(-y*7.) * smoothstep(-0.4, 0.6, -d.x) * (1. - uSunVis);
  // square sun and square moon (blocky, of course)
  if(uSunVis > 0.001 && dot(d, uSunDir) > 0.){ vec2 q = discUV(d, uSunDir); float m = step(max(abs(q.x), abs(q.y)), 0.032);
    c += (m * vec3(26., 21., 14.) + vec3(1.2, 0.7, 0.35) * pow(max(dot(d, uSunDir), 0.), 18.) * 0.35) * uSunVis; }
  if(uMoonVis > 0.001 && dot(d, uMoonDirS) > 0.){ vec2 q = discUV(d, uMoonDirS); float m = step(max(abs(q.x), abs(q.y)), 0.026);
    float cr = 0.82 + 0.18 * h12(floor(q * 160.)); c += (m * vec3(1.5, 1.6, 1.8) * cr + vec3(0.06, 0.08, 0.12) * pow(max(dot(d, uMoonDirS), 0.), 40.)) * uMoonVis; }
  if(uCloud > 0.){ // low storm deck, lit from inside by lightning
    vec2 cp = d.xz / (max(d.y, 0.) + 0.09) * 0.9 + vec2(uTime * 0.06, uTime * 0.025);
    float cl = smoothstep(0.32, 0.72, fbm2(cp)) ;
    vec3 cc = vec3(0.010, 0.012, 0.018) * (0.7 + 0.6 * fbm2(cp * 2.3 + 5.)) + vec3(0.5, 0.55, 0.75) * uFlash * 0.35 * fbm2(cp * 1.7);
    c = mix(c, cc, clamp(cl * 1.2, 0., 1.) * uCloud);
  }
  c += vec3(0.8, 0.85, 1.0) * uFlash * 0.25 * (0.4 + y);
  return c;
}
// star trails around a celestial pole: rings of stars, each drawing an arc of length uTrail (radians) ending at its current angle
vec3 starTrails(vec3 d){
  const vec3 pole = normalize(vec3(0.42, 0.62, 0.66));
  float rho = acos(clamp(dot(d, pole), -1., 1.));
  vec2 q = discUV(d, pole); float phi = atan(q.y, q.x);
  const float dr = 0.0042; float ring = floor(rho / dr);
  vec3 acc = vec3(0);
  for(int rr = -1; rr <= 1; rr++){
    float ri = ring + float(rr);
    float rS = (ri + 0.5 + (h12(vec2(ri, 3.)) - 0.5) * 0.5) * dr;
    float w = abs(rho - rS) / (dr * 0.16);
    if(w > 2.5) continue;
    float prof = exp(-w * w);
    float cw = 0.045; float rel = phi - uStarSpin;
    float c0 = floor(rel / cw);
    for(int k = 0; k < 28; k++){
      float cell = c0 - float(k);
      float hh = h12(vec2(cell, ri * 1.37));
      if(hh < 0.86) continue;
      float head = (cell + h12(vec2(cell, ri + 9.))) * cw;
      float back = head - rel; // how far behind the head this pixel is (radians)
      if(back < -0.004 || back > uTrail) continue;
      float tail = 1. - back / max(uTrail, 1e-3);
      float mag = 0.08 + 0.9 * pow(h12(vec2(cell, ri + 21.)), 5.);
      vec3 tint = mix(vec3(0.65, 0.78, 1.0), vec3(1.0, 0.85, 0.65), h12(vec2(cell, ri + 33.)));
      acc += tint * mag * prof * (0.25 + 0.75 * tail) * (back < 0.004 ? 2.0 : 1.0);
    }
  }
  return acc * 0.55 * smoothstep(0.05, 0.25, d.y);
}
`;

// ---------------------------------------------------------------- moon shadow map
const SHADOW_RES = 4096;
const shadowRT = new THREE.WebGLRenderTarget(SHADOW_RES, SHADOW_RES, { depthBuffer: true });
shadowRT.depthTexture = new THREE.DepthTexture(SHADOW_RES, SHADOW_RES, THREE.FloatType);
const sCam = new THREE.OrthographicCamera();
function fitShadow(md) {
  const center = new THREE.Vector3(NX / 2, 20, 120);
  sCam.position.copy(center).addScaledVector(md, 250); sCam.up.set(0, 1, 0); if (Math.abs(md.y) > 0.98) sCam.up.set(1, 0, 0); sCam.lookAt(center); sCam.updateMatrixWorld(true);
  // fit the grid box in light space
  const inv = sCam.matrixWorldInverse; let mn = new THREE.Vector3(1e9, 1e9, 1e9), mx = mn.clone().multiplyScalar(-1);
  for (const x of [0, NX]) for (const y of [0, NY]) for (const z of [0, NZ]) { const p = new THREE.Vector3(x, y, z).applyMatrix4(inv); mn.min(p); mx.max(p); }
  sCam.left = mn.x; sCam.right = mx.x; sCam.bottom = mn.y; sCam.top = mx.y; sCam.near = -mx.z - 5; sCam.far = -mn.z + 5;
  sCam.updateProjectionMatrix();
  shadowMat.multiplyMatrices(sCam.projectionMatrix, sCam.matrixWorldInverse);
  shadowWorldSize.set(sCam.right - sCam.left, sCam.top - sCam.bottom, sCam.far - sCam.near);
}
const shadowMat = new THREE.Matrix4(), shadowWorldSize = new THREE.Vector3();
fitShadow(v3(L.moonDir));

// ---------------------------------------------------------------- voxel material
const SHADOW_GLSL = /* glsl */`
uniform sampler2D uShadow; uniform mat4 uShadowMat; uniform vec3 uShadowSize;
const vec2 PD[16] = vec2[](vec2(-0.94201624,-0.39906216),vec2(0.94558609,-0.76890725),vec2(-0.094184101,-0.92938870),vec2(0.34495938,0.29387760),
 vec2(-0.91588581,0.45771432),vec2(-0.81544232,-0.87912464),vec2(-0.38277543,0.27676845),vec2(0.97484398,0.75648379),vec2(0.44323325,-0.97511554),
 vec2(0.53742981,-0.47373420),vec2(-0.26496911,-0.41893023),vec2(0.79197514,0.19090188),vec2(-0.24188840,0.99706507),vec2(-0.81409955,0.91437590),
 vec2(0.19984126,0.78641367),vec2(0.14383161,-0.14100790));
float moonShadow(vec3 wp, vec3 n, float rot, float softK){
  vec4 sc = uShadowMat * vec4(wp + n * 0.06 + MOON_DIR * 0.03, 1.0);
  vec3 s = sc.xyz * 0.5 + 0.5;
  if(s.x < 0. || s.y < 0. || s.x > 1. || s.y > 1.) return 1.;
  float ca = cos(rot), sa = sin(rot); mat2 R = mat2(ca, sa, -sa, ca);
  // blocker search (world radius ~0.6)
  vec2 sr = vec2(0.6) / uShadowSize.xy;
  float bsum = 0., bn = 0.;
  for(int i=0;i<16;i++){ float d = texture(uShadow, s.xy + R*PD[i]*sr).r; if(d < s.z - 0.0004){ bsum += d; bn += 1.; } }
  if(bn < 0.5) return 1.;
  float dz = (s.z - bsum / bn) * uShadowSize.z;          // receiver - blocker distance (world units)
  float pen = clamp(dz * softK, 0.03, 0.9);               // contact-hardening penumbra (world units)
  vec2 pr = vec2(pen) / uShadowSize.xy;
  float lit = 0.;
  for(int i=0;i<16;i++){ float d = texture(uShadow, s.xy + R*PD[i]*pr).r; lit += step(s.z - 0.0002 - 0.00002*pen*40., d); }
  return lit / 16.;
}
float moonShadowHard(vec3 wp){ vec4 sc = uShadowMat * vec4(wp, 1.0); vec3 s = sc.xyz*0.5+0.5;
  if(s.x < 0. || s.y < 0. || s.x > 1. || s.y > 1.) return 1.; return step(s.z - 0.0003, texture(uShadow, s.xy).r); }`;

const voxVert = /* glsl */`
attribute vec4 aInfo; attribute vec3 aSky; attribute vec3 aMoon; attribute vec3 aWarm; attribute float aLv;
varying vec3 vW; varying vec3 vSky; varying vec3 vMoonB; varying vec3 vWarm; varying float vLv;
flat varying int vDir; flat varying int vMat;
void main(){
  vW = position; vSky = aSky; vMoonB = aMoon; vWarm = aWarm; vLv = aLv;
  vDir = int(aInfo.x + 0.5); vMat = int(aInfo.y + 0.5);
  gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
}`;

const voxFrag = /* glsl */`
${COMMON}
${SHADOW_GLSL}
uniform float uSkyK, uMoonK, uWarmK, uBeamK, uLantK;
varying vec3 vW; varying vec3 vSky; varying vec3 vMoonB; varying vec3 vWarm; varying float vLv;
flat varying int vDir; flat varying int vMat;
const vec3 DIRS[6] = vec3[](vec3(1,0,0),vec3(-1,0,0),vec3(0,1,0),vec3(0,-1,0),vec3(0,0,1),vec3(0,0,-1));

// ---- procedural 16x16 voxel textures
float T(vec3 vox, vec2 tx, float s){ return h13(vec3(vox.x*16.+tx.x + vox.y*5.13, vox.z*16.+tx.y + vox.y*11.7, s + float(vDir)*7.31)); }
vec3 snowAlb(vec3 vox, vec2 tx){
  float n = T(vox, tx, 1.), b = T(vox, floor(tx/4.), 2.);
  vec3 c = vec3(0.80, 0.84, 0.90) * (0.94 + 0.07*n) * (0.97 + 0.05*b);
  c = mix(c, vec3(0.70, 0.78, 0.92), step(0.93, T(vox, tx, 3.)) * 0.6); // icy blue grains
  return c;
}
vec3 needleAlb(vec3 vox, vec2 tx){
  float n = T(vox, tx, 11.), m = T(vox, floor(tx/2.), 12.);
  vec3 c = mix(vec3(0.020, 0.050, 0.034), vec3(0.055, 0.105, 0.060), n);
  c *= 0.7 + 0.6*m;
  c = mix(c, vec3(0.008, 0.016, 0.014), step(0.80, T(vox, tx, 13.)));   // holes / depth
  c = mix(c, vec3(0.09, 0.15, 0.08), step(0.94, T(vox, tx, 14.)));       // lit needle tips
  return c;
}
// log: across = coordinate across the log (0..15), along = along the log axis
// log side: course = which log (one per voxel row), alongW = texel coordinate along the log in WORLD space,
// so one log reads as one continuous piece of timber across voxels instead of bricks
vec3 logSide(float course, float across, float alongW, vec3 base){
  float tint = 0.82 + 0.3 * h12(vec2(course, 3.7));
  vec3 c = base * tint;
  // long grain streaks
  float g1 = h12(vec2(floor(alongW / 7.), across + course * 16.));
  float g2 = h12(vec2(floor(alongW / 3.), across * 1.7 + course * 31.));
  c *= 0.84 + 0.2 * g1 + 0.08 * g2;
  // knots
  float kn = h12(vec2(floor(alongW / 9.), course));
  if(kn > 0.82 && abs(mod(alongW, 9.) - 4.5) < 1.2 && abs(across - 7.5 + (kn - 0.9) * 20.) < 1.2) c *= 0.5;
  // round profile: lit belly, dark seams top and bottom
  float r = abs(across - 7.5) / 7.5;
  c *= 1.05 - 0.55 * r * r * r;
  if(across < 0.5) c = vec3(0.30, 0.29, 0.27) * (0.85 + 0.25 * h12(vec2(alongW, course))); // chinking
  if(across > 14.5) c *= 0.55;
  return c;
}
vec3 logEnd(vec3 vox, vec2 tx){
  float r = length(tx - 7.5);
  vec3 c = vec3(0.52, 0.36, 0.20);
  float ring = step(0.5, fract(r * 0.42 + T(vox, vec2(0.), 31.)));
  c *= 0.86 + 0.18*ring;
  c *= 0.9 + 0.15*T(vox, tx, 32.);
  if(r > 6.2) c = vec3(0.17, 0.10, 0.055) * (0.8 + 0.4*T(vox, tx, 33.));
  if(r < 1.2) c *= 0.75;
  return c;
}
vec3 cobble(vec3 vox, vec2 tx){
  // voronoi stones on a 4x4 texel cell grid
  vec2 p = tx / 4.; vec2 ip = floor(p); float d1 = 9., d2 = 9.; float id = 0.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ vec2 g = ip + vec2(i,j); vec2 o = vec2(h13(vec3(g + vox.xz*4.1, vox.y + 1.)), h13(vec3(g + vox.zy*3.3, vox.x + 2.)));
    float d = length(g + o - p); if(d < d1){ d2 = d1; d1 = d; id = h13(vec3(g, vox.x+vox.y*3.+vox.z*7.)); } else if(d < d2) d2 = d; }
  vec3 c = vec3(0.30, 0.30, 0.31) * (0.65 + 0.6*id) * (0.9 + 0.2*T(vox, tx, 41.));
  c = mix(c, vec3(0.32, 0.30, 0.26), step(0.8, id)*0.5);
  if(d2 - d1 < 0.22) c = vec3(0.07, 0.07, 0.075);
  return c;
}
vec3 planks(vec3 vox, vec2 tx, vec3 base, float rows){
  float row = floor(tx.y / rows);
  float off = floor(T(vox, vec2(row, 0.), 51.) * 16.);
  float seamX = mod(tx.x + off, 16.);
  vec3 c = base * (0.82 + 0.3*T(vox, vec2(row, 1.), 52.));
  c *= 0.9 + 0.18*T(vox, vec2(floor(tx.x/4.), tx.y), 53.);
  if(mod(tx.y, rows) < 0.5) c *= 0.45;
  if(seamX < 0.5) c *= 0.55;
  return c;
}

void surface(vec3 vox, vec2 tx, vec3 n, out vec3 alb, out vec3 emis, out float glint, out float gloss){
  emis = vec3(0); glint = 0.; gloss = 0.;
  int m = vMat;
  bool top = n.y > 0.5, bottom = n.y < -0.5;
  if(m == 1){ alb = snowAlb(vox, tx) * (0.965 + 0.06 * h13(vox * 1.37 + 0.5)); glint = step(0.983, T(vox, tx, 4.)); }
  else if(m == 2){ // trampled path snow
    float n1 = T(vox, tx, 5.), n2 = T(vox, floor(tx/3.), 6.);
    alb = vec3(0.60, 0.64, 0.72) * (0.86 + 0.16*n1) * (0.9 + 0.16*n2);
    // boot prints: two dented ovals per voxel
    vec2 c1 = vec2(4.5 + 3.*T(vox, vec2(0), 7.), 4.5 + 2.*T(vox, vec2(1), 7.)), c2 = vec2(10.5 + 2.*T(vox, vec2(2), 7.), 11. + 2.*T(vox, vec2(3), 7.));
    float e1 = length((tx - c1) / vec2(1.6, 2.6)), e2 = length((tx - c2) / vec2(1.6, 2.6));
    alb *= 1.0 - 0.32*step(e1, 1.0) - 0.32*step(e2, 1.0);
    alb *= 1.0 + 0.12*(step(e1, 1.35) - step(e1, 1.0)) + 0.12*(step(e2, 1.35) - step(e2, 1.0)); // compressed rims
    alb = mix(alb, vec3(0.80,0.84,0.90), step(0.9, T(vox, tx, 8.)));
    glint = step(0.993, T(vox, tx, 4.));
  }
  else if(m == 3){ alb = vec3(0.20, 0.13, 0.08) * (0.65 + 0.6*T(vox, tx, 9.)); }
  else if(m == 4 || m == 18){ alb = vec3(0.30, 0.30, 0.32) * (0.7 + 0.45*T(vox, floor(tx/2.), 10.)) * (0.9+0.15*T(vox, tx, 10.5)); }
  else if(m == 5 || m == 6 || m == 7){
    int ax = m == 5 ? 0 : (m == 6 ? 2 : 1);
    vec3 base = vec3(0.36, 0.215, 0.115);
    bool endFace = (ax == 0 && abs(n.x) > .5) || (ax == 1 && abs(n.y) > .5) || (ax == 2 && abs(n.z) > .5);
    if(endFace) alb = logEnd(vox, tx);
    else {
      float along, across;
      if(ax == 1){ along = tx.y; across = tx.x; }
      else if(top || bottom){ along = ax == 0 ? tx.x : tx.y; across = ax == 0 ? tx.y : tx.x; }
      else { along = tx.x; across = tx.y; }
      float alongW = ax == 0 ? floor(vW.x * 16.) : (ax == 2 ? floor(vW.z * 16.) : floor(vW.y * 16.));
      float course = ax == 1 ? vox.x * 7. + vox.z * 13. : vox.y + (ax == 0 ? vox.z : vox.x) * 0.37;
      alb = logSide(course, across, alongW, m == 7 ? base * 0.8 : base);
    }
  }
  else if(m == 16){ // pine bark
    float col = T(vox, vec2(tx.x, floor(tx.y/6.)), 61.);
    alb = vec3(0.15, 0.10, 0.065) * (0.6 + 0.7*col) * (0.85 + 0.25*T(vox, tx, 62.));
    if(abs(n.y) > .5) alb = logEnd(vox, tx) * 0.8;
  }
  else if(m == 8){ alb = planks(vox, top || bottom ? tx.yx : tx, vec3(0.40, 0.25, 0.13), 4.); }
  else if(m == 9 && !top && !bottom){ float aw = abs(n.x) > .5 ? vW.z : vW.x; alb = vec3(0.19, 0.11, 0.065) * (0.8 + 0.3 * h12(vec2(floor(aw * 16. / 11.), tx.y))) * (tx.y < 0.5 || tx.y > 14.5 ? 0.45 : 1.0); } // continuous fascia board on eave edges
  else if(m == 9){ // dark shingles
    vec2 t2 = tx; float row = floor(t2.y / 4.);
    float off = mod(row, 2.) * 3.;
    float sx = mod(t2.x + off, 6.);
    alb = vec3(0.22, 0.115, 0.075) * (0.78 + 0.4*T(vox, vec2(floor((t2.x+off)/6.), row), 71.));
    if(sx < 0.5) alb *= 0.5;
    if(mod(t2.y, 4.) < 0.5) alb *= 0.45;
    alb *= 0.9 + 0.15*T(vox, tx, 72.);
  }
  else if(m == 19){ // snow layer on shingles: white cap, ragged fringe with drips on the sides, shingles below
    if(top){ alb = snowAlb(vox, tx); glint = step(0.985, T(vox, tx, 4.)); }
    else if(bottom){ alb = vec3(0.20, 0.115, 0.07); }
    else {
      float col = tx.x;
      float depth = 3. + floor(T(vox, vec2(col, 0.), 101.) * 3.) + floor(T(vox, vec2(floor(col / 4.), 0.), 102.) * 4.) + floor(uSnowPile * 7.);
      if(T(vox, vec2(col, 1.), 103.) > 0.86) depth += 4. + floor(T(vox, vec2(col, 2.), 104.) * 5.); // drips
      float th = 15.5 - depth;
      if(tx.y >= th){ alb = snowAlb(vox, tx) * (0.92 + 0.08 * (tx.y - th) / max(depth, 1.)); }
      else {
        float row = floor(tx.y / 4.); float off = mod(row, 2.) * 3.; float sx = mod(tx.x + off, 6.);
        alb = vec3(0.22, 0.115, 0.075) * (0.78 + 0.4 * T(vox, vec2(floor((tx.x + off) / 6.), row), 71.));
        if(sx < 0.5) alb *= 0.5; if(mod(tx.y, 4.) < 0.5) alb *= 0.45;
        if(tx.y >= th - 1.) alb *= 0.55; // contact shadow under the snow lip
      }
    }
  }
  else if(m == 10){ alb = needleAlb(vox, tx); }
  else if(m == 11){
    if(top){ alb = snowAlb(vox, tx); alb = mix(alb, needleAlb(vox, tx), step(0.93, T(vox, tx, 15.))); glint = step(0.988, T(vox, tx, 4.)); }
    else if(bottom){ alb = needleAlb(vox, tx); }
    else {
      float th = 10. - floor(T(vox, vec2(tx.x, 0.), 16.) * 5.) - floor(T(vox, vec2(floor(tx.x/3.), 0.), 17.)*3.);
      alb = tx.y >= th ? snowAlb(vox, tx) : needleAlb(vox, tx);
      if(tx.y < th && T(vox, tx, 18.) > 0.9) alb = snowAlb(vox, tx) * 0.85;   // snow clumps caught in the needles
    }
  }
  else if(m == 12){ // window glass, lit from inside
    float e = min(min(tx.x, 15.-tx.x), min(tx.y, 15.-tx.y));
    if(e < 1.0){ alb = vec3(0.16, 0.095, 0.05); }
    else {
      alb = vec3(0.05);
      float g = 0.75 + 0.35*(1.0 - tx.y/15.) * 1.0;
      vec3 glow = PANE_LE * g * (0.85 + 0.25*T(vox, floor(tx/3.), 81.));
      // frost creeping in from the frame
      float fr = (e - 1.0) + 2.6*T(vox, tx, 82.) + 1.5*T(vox, floor(tx/2.), 83.);
      float frost = 1.0 - smoothstep(1.2, 3.2, fr);
      glow = mix(glow, vec3(1.9, 1.35, 0.95), frost * 0.75);
      emis = glow * uWinFlick;
    }
  }
  else if(m == 13){ // plank door with Z brace + hinges, warm light leaking at the gaps
    alb = planks(vox, tx.yx, vec3(0.24, 0.13, 0.07), 4.);
    if(abs(tx.y - 3.5) < 1. || abs(tx.y - 12.5) < 1.) alb = vec3(0.30, 0.17, 0.09) * (0.85+0.2*T(vox, tx, 91.));
    if((abs(tx.y - 3.5) < 1. || abs(tx.y - 12.5) < 1.) && tx.x < 4.) alb = vec3(0.04, 0.04, 0.045);
    if(tx.x < 0.5 || tx.x > 14.5) emis = PANE_LE * 0.35 * uWinFlick;
    // a pine wreath with red berries on the upper half of the door
    if(vox.y > 11.5){
      vec2 q = tx - vec2(7.5, 7.0); float rr = length(q);
      if(rr > 3.2 && rr < 5.6){ alb = mix(vec3(0.03, 0.09, 0.04), vec3(0.06, 0.16, 0.06), T(vox, tx, 92.)); if(T(vox, tx, 93.) > 0.84) alb = vec3(0.55, 0.04, 0.03); }
      if(abs(q.x) < 1.6 && q.y < -3.6 && q.y > -6.5) alb = vec3(0.50, 0.05, 0.04); // bow
    }
  }
  else if(m == 14){ // river ice
    vec2 wp = floor(vW.xz * 16.) / 16.;
    float n1 = fbm2(wp * 0.7);
    alb = mix(vec3(0.06, 0.13, 0.22), vec3(0.32, 0.46, 0.60), smoothstep(0.35, 0.7, n1));
    // cracks: voronoi edges
    vec2 p = wp * 0.8; vec2 ip = floor(p); float d1 = 9., d2 = 9.;
    for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ vec2 g = ip + vec2(i,j); vec2 o = vec2(h12(g), h12(g+19.)); float d = length(g+o-p); if(d<d1){d2=d1;d1=d;} else if(d<d2) d2=d; }
    alb = mix(alb, vec3(0.70, 0.80, 0.90), 0.5 * (1.0 - smoothstep(0.02, 0.06, d2 - d1))); // plate seams half-strength: the crack has to be the brightest line on the ice
    alb = mix(alb, vec3(0.75,0.82,0.92), step(0.75, fbm2(wp*2.3+5.))*0.7); // wind-blown snow on the ice
    if(uCrack.w > 0.){ // spreading crack around a point (thin ice): radial spokes + one broken ring
      vec2 d = wp - uCrack.xy; float r = length(d), ang = atan(d.y, d.x);
      float R = uCrack.z * uCrack.w;
      float s = abs(sin((ang + 0.35 * fbm2(d * 1.1 + 3.)) * 3.5)) * r;
      float spoke = (1. - smoothstep(0.035, 0.095, s)) * (1. - smoothstep(R * 0.75, R, r + 0.3 * fbm2(vec2(ang * 3., 1.))));
      float ring = (1. - smoothstep(0.02, 0.06, abs(r - R * 0.55 - 0.18 * fbm2(vec2(ang * 2.2, 7.))))) * step(0.35, fbm2(vec2(ang * 1.7, 3.)));
      float c = max(spoke, ring * step(r, R));
      float halo = (1. - smoothstep(0.05, 0.16, s)) * (1. - smoothstep(R * 0.8, R * 1.05, r));
      alb *= 1. - 0.75 * halo * (1. - c);                       // dark fracture shadow either side of the line
      alb = mix(alb, vec3(0.92, 0.96, 1.0), c);
      emis += vec3(0.024, 0.036, 0.05) * c * uCrack.w;      // brighter so the lines read in the low and face shots
    }
    gloss = 1.0;
  }
  else if(m == 20 || m == 21){ // painted rocket skin: panel seams, rivets, soot streaks rising from the base
    vec3 base = m == 20 ? vec3(0.70, 0.70, 0.68) : vec3(0.045, 0.045, 0.05);
    alb = base * (0.88 + 0.14 * T(vox, floor(tx / 4.), 121.)) * (0.94 + 0.08 * T(vox, tx, 122.));
    if(!top && !bottom){
      if(mod(vox.y, 3.) < 0.5 && tx.y > 14.5) alb *= 0.45;                    // horizontal panel seam every 3 m
      if(abs(tx.x - 1.5) < 0.6 && mod(tx.y, 4.) < 0.6) alb *= m == 20 ? 0.6 : 1.8; // rivet column
      float soot = (1. - smoothstep(12., 22., vox.y)) * smoothstep(0.55, 0.9, T(vox, vec2(tx.x, 0.), 123.));
      alb *= 1. - 0.35 * soot;
    }
  }
  else if(m == 22){ // launch pad concrete: slabs, scorch toward the centre
    alb = vec3(0.30, 0.30, 0.31) * (0.72 + 0.4 * T(vox, floor(tx / 2.), 124.)) * (0.92 + 0.12 * T(vox, tx, 125.));
    if(top && (mod(vox.x, 4.) < 0.5 && tx.x < 0.6 || mod(vox.z, 4.) < 0.5 && tx.y < 0.6)) alb *= 0.45; // expansion joints
    float rc = length(vox.xz + 0.5 - vec2(83.5, 68.5)); alb *= 0.55 + 0.45 * smoothstep(2.5, 7., rc + 1.5 * T(vox, floor(tx / 3.), 126.));
  }
  else if(m == 23){ // red warning lamp, slow blink
    alb = vec3(0.12, 0.02, 0.02); float on = 0.25 + 0.75 * step(0., sin(uTime * uLampRate + vox.y * 0.7));
    float e = min(min(tx.x, 15. - tx.x), min(tx.y, 15. - tx.y)); emis = vec3(3.2, 0.25, 0.11) * on * (e > 4. ? 1. : 0.12);
  }
  else if(m == 24){ // service-tower steel: dark grey, bolts, rust specks
    alb = vec3(0.20, 0.21, 0.23) * (0.8 + 0.3 * T(vox, floor(tx / 4.), 127.));
    if(T(vox, tx, 128.) > 0.93) alb = vec3(0.22, 0.10, 0.05);
    float e = min(min(tx.x, 15. - tx.x), min(tx.y, 15. - tx.y)); if(e < 1.) alb *= 0.6;
  }
  else if(m == 15){ alb = cobble(vox, tx); }
  else alb = vec3(0.3);
}

void main(){
  vec3 n = DIRS[vDir];
  vec3 vox = floor(vW - n * 0.5);
  vec2 uv = abs(n.x) > .5 ? vW.zy : (abs(n.y) > .5 ? vW.xz : vW.xy);
  if(n.x < -0.5) uv.x = -uv.x; if(n.z > 0.5) uv.x = -uv.x;   // keep textures un-mirrored per face
  vec2 tx = floor(fract(uv) * 16.);
  vec3 alb, emis; float glint, gloss;
  surface(vox, tx, n, alb, emis, glint, gloss);
  if(uBurn > 0. && (vMat == 10 || vMat == 11 || vMat == 16 || vMat == 1)){
    vec3 bq = (vW - uBurnC) / vec3(5.2, 15., 5.2); float bk = uBurn * (1. - smoothstep(0.75, 1.0, length(bq)));
    alb = mix(alb, vec3(0.028, 0.024, 0.022) * (0.6 + 0.9 * T(vox, tx, 111.)), bk); glint *= 1. - bk;
    emis += vec3(2.0, 0.5, 0.08) * bk * uFire.w * step(0.975, T(vox, tx, 112. + floor(uTime * 6.))) * 0.6; // glowing embers in the char
  }
  if(uSnowPile > 0. && vMat == 9 && n.y > 0.5 && uSnowPile > 0.15 + 0.7 * T(vox, vec2(0.), 105.)) { alb = snowAlb(vox, tx); }

  vec3 V = normalize(cameraPosition - vW);
  float rot = ign(gl_FragCoord.xy) * 6.2831;
  // ---- moon (direct, PCSS shadows), with snow wrap-lighting as cheap subsurface
  bool snowy = vMat == 1 || vMat == 2 || vMat == 11 || (vMat == 19 && n.y > 0.5);
  float cm = dot(n, MOON_DIR);
  float wrap = snowy ? 0.22 : 0.0;
  float dm = max(0., (cm + wrap) / (1. + wrap));
  float sh = dm > 0. ? moonShadow(vW, n, rot, 0.022) : 0.;
  vec3 moon = MOON_COL * dm * sh * uMoonK + vMoonB * uKeyTint * uMoonK;
  vec3 sky = vSky * uSkyTint;
  // ---- warm: baked (window panes + bounce), crisp beams through windows, lantern direct
  vec3 warm = vWarm * uWarmK * uWinFlick;
  warm += beamAt(vW + n*0.01, n, true) * uBeamK;
  vec3 lp = LANT_P - vW; float ldist = length(lp);
  warm += LANT_C * uLantFlick * uLantK * vLv * max(0., dot(n, lp/ldist)) / (ldist*ldist + 0.15);
  warm += postLight(vW + n * 0.02, n, true);
  if(uFire.w > 0.){ vec3 fl = uFire.xyz - vW; float fd = dot(fl, fl); warm += vec3(2.4, 0.95, 0.25) * uFire.w * (max(0., dot(n, fl * inversesqrt(fd))) * 0.8 + 0.2) * 7. / (fd + 2.); }
  if(uPortal > 0.){ vec3 pl = uPortalC - vW; float pd = dot(pl, pl); warm += uPortalCol * uPortal * (max(0., dot(n, pl * inversesqrt(pd))) * 0.85 + 0.15) * 2.6 / (pd + 1.5); }
  // subsurface tint: light diffusing in snow comes back slightly bluer / warmer-saturated
  vec3 lightSum = sky + moon + warm;
  vec3 col = alb * lightSum;
  if(snowy) col += alb * warm * vec3(0.10, 0.03, -0.02);
  if(snowy || vMat == 19){ float sv = clamp(dot(vSky, vec3(1.)) / 0.06, 0., 1.4); col += alb * vec3(0.002, 0.012, 0.008) * max(n.y, 0.) * smoothstep(0.6, 1.3, sv) * 1.4 * (0.8 + 0.6 * exp(-pow((uTime - 6.0) / 1.3, 2.))); }
  // ---- edge bevel highlight (MagicaVoxel-style definition), modulated by received light
  vec2 fu = fract(uv);
  float edge = 1.0 - smoothstep(0.0, 0.045, min(min(fu.x, 1.-fu.x), min(fu.y, 1.-fu.y)));
  col *= 1.0 + edge * 0.12;
  // ---- glints: sparkling snow catching moon + warm light
  if(glint > 0.){
    vec3 Hm = normalize(MOON_DIR + V);
    float gm = pow(max(0., dot(n, Hm)), 6.) * sh;
    vec3 Lw = normalize(LANT_P - vW); float gw = pow(max(0., dot(n, normalize(Lw + V))), 6.);
    col += glint * (MOON_COL * gm * 7. * uMoonK + LANT_C * gw * vLv * 1.2 / (ldist*ldist + 1.) + beamAt(vW + n*0.01, n, true) * uBeamK * 2.0);
  }
  // ---- ice: glossy reflection of sky / aurora / warm lights
  if(gloss > 0.){
    vec3 R = reflect(-V, n);
    float fres = 0.04 + 0.96 * pow(1. - max(0., dot(n, V)), 5.);
    vec3 refl = skyBase(R) * 1.4 + aurora(R) * 2.2;
    vec3 lw = LANT_P - vW; float lr = pow(max(0., dot(R, normalize(lw))), 400.) * 40. / (dot(lw,lw) + 1.);
    vec3 wc = INTERIOR - vW; float wr = pow(max(0., dot(R, normalize(wc))), 60.) * 10. / (dot(wc,wc)*0.02 + 1.);
    col = mix(col, refl * 2.2, min(1., fres * 1.1 + 0.15)) + LANT_C * lr * uLantFlick + PANE_LE * wr * 0.05 * fres * uWinFlick;
  }
  // lightning flash fills everything that sees the sky
  col += alb * vec3(0.9, 0.95, 1.25) * uFlash * (0.15 + 0.85 * clamp(dot(vSky, vec3(1.)) / 0.06, 0., 1.4));
  col += emis;
  gl_FragColor = vec4(col, 1.0);
}`;

const U = {
  uTime: { value: 0 }, uWinFlick: { value: 1 }, uLantFlick: { value: 1 },
  uShadow: { value: shadowRT.depthTexture }, uShadowMat: { value: shadowMat }, uShadowSize: { value: shadowWorldSize },
  uSkyK: { value: K.sky }, uMoonK: { value: K.moon },
  MOON_DIR: { value: v3(L.moonDir) }, MOON_COL: { value: v3(L.moonCol) }, SKY_ZEN: { value: v3(L.skyZen) }, SKY_HOR: { value: v3(L.skyHor) },
  uAurK: { value: 1 }, uStarK: { value: 1 }, uFlash: { value: 0 }, uSnowPile: { value: 0 }, uBurn: { value: 0 }, uSunVis: { value: 0 }, uMoonVis: { value: 0 },
  uTrail: { value: 0 }, uStarSpin: { value: 0 }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uMoonDirS: { value: new THREE.Vector3(0, 1, 0) },
  uBurnC: { value: new THREE.Vector3() }, uSkyTint: { value: new THREE.Vector3(1, 1, 1) }, uKeyTint: { value: new THREE.Vector3(1, 1, 1) },
  uFire: { value: new THREE.Vector4(0, 0, 0, 0) }, uCrack: { value: new THREE.Vector4(0, 0, 0, 0) }, uLampRate: { value: 2.6 }, uPortal: { value: 0 }, uCloud: { value: 0 }, uPortalC: { value: new THREE.Vector3() }, uPortalCol: { value: new THREE.Vector3(1.2, 0.4, 2.0) },
  uSnowK: { value: 1 }, uCamR: { value: new THREE.Vector3() }, uCamU: { value: new THREE.Vector3() }, uCamF: { value: new THREE.Vector3() },
  uFoxHead: { value: 0 }, uFoxEar: { value: 0 }, uWarmK: { value: K.warmBake }, uBeamK: { value: K.beam }, uLantK: { value: K.lant },
};
const voxMat = new THREE.ShaderMaterial({ vertexShader: voxVert, fragmentShader: voxFrag, uniforms: U });
const world = new THREE.Mesh(geo, voxMat); world.frustumCulled = false;
const scene = new THREE.Scene(); scene.add(world); scene.add(makeLantern(U)); scene.add(makeIcicles(U));

// shadow pass
const depthMat = new THREE.MeshDepthMaterial(); depthMat.side = THREE.DoubleSide;
const shadowScene = new THREE.Scene(); const sMesh = new THREE.Mesh(geo, depthMat); sMesh.frustumCulled = false; shadowScene.add(sMesh);

// ---------------------------------------------------------------- render targets
const hdr = (w, h, depth) => {
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: !!depth, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  if (depth) rt.depthTexture = new THREE.DepthTexture(w, h, THREE.FloatType);
  return rt;
};
const rtScene = hdr(RW, RH, true), rtAtm = hdr(RW, RH), rtDof = hdr(RW, RH);

// ---------------------------------------------------------------- fullscreen passes
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const fsGeo = new THREE.PlaneGeometry(2, 2);
const fsVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
function pass(frag, uniforms) {
  const m = new THREE.ShaderMaterial({ vertexShader: fsVert, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
  const s = new THREE.Scene(); const q = new THREE.Mesh(fsGeo, m); q.frustumCulled = false; s.add(q);
  return { m, run(target) { renderer.setRenderTarget(target); renderer.render(s, fsCam); } };
}
const camU = { uInvProj: { value: new THREE.Matrix4() }, uInvView: { value: new THREE.Matrix4() }, uCamPos: { value: new THREE.Vector3() }, uNear: { value: camera.near }, uFar: { value: camera.far } };
const DEPTH_GLSL = /* glsl */`
uniform mat4 uInvProj, uInvView; uniform vec3 uCamPos; uniform float uNear, uFar;
vec3 worldFromDepth(vec2 uv, float d){ vec4 c = vec4(uv*2.-1., d*2.-1., 1.); vec4 v = uInvProj * c; v /= v.w; return (uInvView * v).xyz; }
float viewZ(float d){ float z = d*2.-1.; return 2.*uNear*uFar / (uFar + uNear - z*(uFar - uNear)); }
`;

// atmosphere: sky (aurora, stars, far ridges) + height fog + raymarched in-scatter (moon shafts, window beams, lantern halo)
const atm = pass(/* glsl */`
${COMMON}
${SHADOW_GLSL}
${DEPTH_GLSL}
uniform sampler2D tScene, tDepth; uniform float uMistK, uFarD, uSkyOnly, uFogD, uFogH, uVolMoon, uVolWarm; uniform vec2 uRes;
varying vec2 vUv;
float fogOD(vec3 ro, vec3 rd, float dist){
  float k = rd.y / uFogH; float base = uFogD * exp(-(ro.y - ${GROUND.toFixed(1)}) / uFogH);
  if(abs(k) < 1e-4) return base * dist;
  return base * (1. - exp(-k * dist)) / k;
}
float ridge(float az, float f, float s){ float q = floor(az * f) / f; return fbm2(vec2(q * 3.0 + s, s)) ; }
vec3 stars(vec3 d){
  vec3 c = vec3(0);
  vec2 sp = vec2(atan(d.x, d.z), asin(d.y)) * 260.;
  vec2 cell = floor(sp); vec2 f = fract(sp) - 0.5;
  float h = h12(cell);
  if(h > 0.965){
    vec2 o = vec2(h12(cell+3.1), h12(cell+7.7)) - 0.5;
    float r = length(f - o*0.6);
    float mag = pow(h12(cell + 11.), 6.);
    float tw = 0.75 + 0.25*sin(uTime*(2. + 3.*h12(cell+5.)) + h*50.);
    vec3 tint = mix(vec3(0.7,0.8,1.0), vec3(1.0,0.85,0.7), h12(cell+9.));
    c += tint * (0.02 + 0.5*mag) * tw * smoothstep(0.32, 0.0, r);
  }
  return c * smoothstep(0.02, 0.25, d.y);
}
void main(){
  float d = texture(tDepth, vUv).r;
  if(uSkyOnly > 0.5) d = 1.0;
  vec3 col = texture(tScene, vUv).rgb;
  vec3 ro = uCamPos;
  vec3 wp = worldFromDepth(vUv, d < 1.0 ? d : 0.9999999);
  vec3 rd = normalize(wp - ro);
  float dist = d < 1.0 ? length(wp - ro) : 900.;
  if(d >= 1.0){
    col = skyBase(rd) + aurora(rd) + stars(rd) * uStarK * (1. - smoothstep(0.05, 0.4, uTrail)) + starTrails(rd) * smoothstep(0.02, 0.3, uTrail);
    // far voxel ridges in layers (beyond the modelled forest)
    float az = atan(rd.x, rd.z), el = rd.y;
    float r1 = 0.075 + 0.07 * ridge(az, 90., 1.3);
    float r2 = 0.045 + 0.06 * ridge(az, 140., 7.1);
    vec3 hz = SKY_HOR * 0.9;
    if(el < r1){ col = mix(col, hz * vec3(0.62, 0.70, 0.86) + aurora(vec3(rd.x, 0.25, rd.z))*0.05, 0.85); dist = 700.; }
    if(el < r2){ col = mix(col, hz * vec3(0.48, 0.58, 0.78), 0.9); dist = 450.; }
  }
  // height fog (analytic) - aerial perspective into the horizon colour
  float od = fogOD(ro, rd, dist);
  vec3 pe = ro + rd * min(dist, 700.);
  od += uFarD * max(0., min(dist, 700.) - 35.) * exp(-max(0., pe.y - 12.) / 30.);
  float Tr = exp(-od);
  vec3 fogCol = mix(SKY_HOR * 0.5, SKY_HOR * 0.95, smoothstep(30., 160., dist)) + aurora(normalize(vec3(rd.x, 0.3, rd.z))) * 0.06;
  col = col * Tr + fogCol * (1. - Tr);
  // raymarched single scattering near the camera
  float maxD = min(dist, 90.);
  const int NS = 48;
  float jit = ign(gl_FragCoord.xy + fract(uTime*7.)*0.);
  vec3 acc = vec3(0); float trans = 1., tm = 1.;
  float cosM = dot(rd, MOON_DIR);
  float g = 0.55; float hg = (1. - g*g) / (4.*PI*pow(1. + g*g - 2.*g*cosM, 1.5));
  for(int i=0;i<NS;i++){
    float t0 = (float(i) + jit) / float(NS);
    float t = t0 * t0 * maxD; float dt = (2.*t0/float(NS)) * maxD;
    vec3 p = ro + rd * t;
    float dens = uFogD * exp(-(p.y - ${GROUND.toFixed(1)}) / uFogH) * (0.65 + 0.7*vn3(p*0.08 + vec3(uTime*0.05, 0., uTime*0.02)));
    float mist = uMistK * 0.05 * exp(-max(0., p.y - 10.6) / 1.3) * smoothstep(22., 55., t) * (0.5 + vn3(p * vec3(0.06, 0.3, 0.06) + vec3(uTime * 0.04, 0., 0.)));
    vec3 Ls = vec3(0);
    float sm = moonShadowHard(p);
    Ls += MOON_COL * PI * hg * sm * uVolMoon * 4.0;
    Ls += beamAt(p, vec3(0), false) * uVolWarm * 0.6;
    vec3 lv = LANT_P - p; Ls += LANT_C * uLantFlick * uVolWarm * 0.25 / (dot(lv, lv) + 0.08);
    Ls += postLight(p, vec3(0), false) * uVolWarm * 0.3;
    if(uFire.w > 0.){ vec3 fv = uFire.xyz - p; Ls += vec3(2.4, 0.95, 0.25) * uFire.w * 2.5 / (dot(fv, fv) + 3.); }
    if(uPortal > 0.){ vec3 pv = uPortalC - p; Ls += uPortalCol * uPortal * 1.0 / (dot(pv, pv) + 2.); }
    Ls += vec3(0.8, 0.85, 1.0) * uFlash * 0.4;
    // glowing panes as soft halos
    vec3 wc1 = vec3(94., 13., ${CABIN.z0.toFixed(1)}) - p, wc2 = vec3(100., 13., ${CABIN.z0.toFixed(1)}) - p, wc3 = vec3(${CABIN.x0.toFixed(1)}, 13., 56.5) - p;
    Ls += PANE_LE * uWinFlick * uVolWarm * 0.07 * (1./(dot(wc1,wc1)+0.5) + 1./(dot(wc2,wc2)+0.5) + 1./(dot(wc3,wc3)+0.5));
    acc += trans * (Ls * dens + (SKY_HOR * 1.1 + MOON_COL * 0.5 * sm) * mist) * dt;
    trans *= exp(-(dens + mist) * dt); tm *= exp(-mist * dt);
  }
  col = col * tm + acc;
  gl_FragColor = vec4(col, 1.);
}`, { ...U, ...camU, tScene: { value: rtScene.texture }, tDepth: { value: rtScene.depthTexture }, uTime: U.uTime, uWinFlick: U.uWinFlick, uLantFlick: U.uLantFlick,
  uShadow: U.uShadow, uShadowMat: U.uShadowMat, uShadowSize: U.uShadowSize, uFogD: { value: K.fogDensity }, uFogH: { value: K.fogHeight }, uVolMoon: { value: K.volMoon }, uVolWarm: { value: K.volWarm }, uSkyOnly: { value: P.get("sky") ? 1 : 0 }, uFarD: { value: K.farD }, uMistK: { value: 1 }, uRes: { value: new THREE.Vector2(RW, RH) } });

// depth of field (single-pass scatter-as-gather bokeh)
const dof = pass(/* glsl */`
${DEPTH_GLSL}
uniform sampler2D tCol, tDepth; uniform vec2 uRes; uniform float uFocus, uAperture;
varying vec2 vUv;
const float MAXB = 26.0;
float coc(float z){ float c = (1./z - 1./uFocus) * uAperture * uFocus * 6.0; return c < 0. ? min(-c * 0.25, 4.0) : min(c, MAXB); }
void main(){
  float zc = viewZ(texture(tDepth, vUv).r);
  float cc = coc(zc);
  vec3 col = texture(tCol, vUv).rgb; float tot = 1.;
  float r = 0.5; float ang = 0.;
  for(int i=0;i<220;i++){
    ang += 2.39996323; r += 0.5 / r;
    if(r > MAXB) break;
    vec2 tc = vUv + vec2(cos(ang), sin(ang)) * r / uRes;
    vec3 sc = texture(tCol, tc).rgb; float zs = viewZ(texture(tDepth, tc).r);
    float ss = coc(zs);
    if(zs > zc) ss = clamp(ss, 0., cc * 2.);
    float m = smoothstep(r - 0.5, r + 0.5, ss);
    col += mix(col / tot, sc, m); tot += 1.;
  }
  gl_FragColor = vec4(col / tot, 1.);
}`, { ...camU, tCol: { value: rtAtm.texture }, tDepth: { value: rtScene.depthTexture }, uRes: { value: new THREE.Vector2(RW, RH) }, uFocus: { value: K.focus }, uAperture: { value: K.aperture } });

// ---------------------------------------------------------------- bloom (mip chain, energy conserving)
const bloomRTs = []; { let w = RW / 2, h = RH / 2; for (let i = 0; i < 7; i++) { bloomRTs.push(hdr(Math.max(2, w | 0), Math.max(2, h | 0))); w /= 2; h /= 2; } }
const down = pass(/* glsl */`uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
void main(){ vec2 t = uTexel; vec3 c = texture(tSrc, vUv).rgb*0.5 + (texture(tSrc, vUv+t*vec2(-1,-1)).rgb + texture(tSrc, vUv+t*vec2(1,-1)).rgb + texture(tSrc, vUv+t*vec2(-1,1)).rgb + texture(tSrc, vUv+t*vec2(1,1)).rgb)*0.125;
  gl_FragColor = vec4(min(c, vec3(16.)), 1.); }`, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
const up = pass(/* glsl */`uniform sampler2D tSrc, tLow; uniform vec2 uTexel; uniform float uW; varying vec2 vUv;
void main(){ vec2 t = uTexel; vec3 l = (texture(tLow, vUv+t*vec2(-1,-1)).rgb + texture(tLow, vUv+t*vec2(1,-1)).rgb + texture(tLow, vUv+t*vec2(-1,1)).rgb + texture(tLow, vUv+t*vec2(1,1)).rgb)*0.25;
  gl_FragColor = vec4(texture(tSrc, vUv).rgb + l * uW, 1.); }`, { tSrc: { value: null }, tLow: { value: null }, uTexel: { value: new THREE.Vector2() }, uW: { value: 1 } });
const bloomUp = []; for (let i = 0; i < bloomRTs.length - 1; i++) bloomUp.push(hdr(bloomRTs[i].width, bloomRTs[i].height));
function bloom(src) {
  let s = src;
  for (let i = 0; i < bloomRTs.length; i++) { down.m.uniforms.tSrc.value = s.texture; down.m.uniforms.uTexel.value.set(1 / s.width, 1 / s.height); down.run(bloomRTs[i]); s = bloomRTs[i]; }
  let low = bloomRTs[bloomRTs.length - 1];
  for (let i = bloomRTs.length - 2; i >= 0; i--) {
    up.m.uniforms.tSrc.value = bloomRTs[i].texture; up.m.uniforms.tLow.value = low.texture; up.m.uniforms.uTexel.value.set(1 / low.width, 1 / low.height); up.m.uniforms.uW.value = 1.0;
    up.run(bloomUp[i]); low = bloomUp[i];
  }
  return low; // half-res, sum of all scales
}

// ---------------------------------------------------------------- final: exposure, AgX, grade, vignette, grain, CA, 2x downsample
const fin = pass(/* glsl */`
uniform sampler2D tCol, tBloom, tOv; uniform float uExp, uBloom, uTime, uFade, uWhite, uSat, uDay; uniform vec2 uRes;
varying vec2 vUv;
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 agxDefault(vec3 x){ vec3 x2 = x*x, x4 = x2*x2; return 15.5*x4*x2 - 40.14*x4*x + 31.96*x4 - 6.868*x2*x + 0.4298*x2 + 0.1191*x - 0.00232; }
vec3 agx(vec3 c){
  const mat3 m = mat3(0.842479062253094, 0.0423282422610123, 0.0423756549057051, 0.0784335999999992, 0.878468636469772, 0.0784336, 0.0792237451477643, 0.0791661274605434, 0.879142973793104);
  const mat3 mi = mat3(1.19687900512017, -0.0528968517574562, -0.0529716355144438, -0.0980208811401368, 1.15190312990417, -0.0980434501171241, -0.0990297440797205, -0.0989611768448433, 1.15107367264116);
  c = m * c; c = clamp(log2(max(c, 1e-10)), -12.47393, 4.026069); c = (c + 12.47393) / 16.49999; c = agxDefault(c);
  // punchy look
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); c = l + 1.18 * (c - l); c = pow(max(c, 0.), vec3(1.06));
  c = mi * c; return c; // returns display-encoded (approx sRGB)
}
void main(){
  vec2 uv = vUv; vec2 cc = uv - 0.5;
  // subtle lateral chromatic aberration toward the corners
  float ca = dot(cc, cc) * 0.0035;
  vec3 col = vec3(texture(tCol, uv - cc*ca).r, texture(tCol, uv).g, texture(tCol, uv + cc*ca).b);
  vec3 bl = texture(tBloom, uv).rgb;
  col = mix(col, bl / 7.0, uBloom);
  col *= uExp;
  col = 0.18 * pow(max(col, 0.) / 0.18, vec3(1.18)); // extra contrast around mid-grey (deeper night)
  // vignette (in linear, before the curve)
  float vig = smoothstep(1.05, 0.25, length(cc * vec2(0.85, 1.0)) * 1.25);
  col *= mix(0.55, 1.0, vig);
  vec3 g = agx(col);
  // grade: cool shadows, warm highlights, gently lifted indigo blacks
  float l = dot(g, vec3(0.2126, 0.7152, 0.0722));
  float nd = 1. - uDay;
  g += vec3(-0.014, 0.010, 0.016) * (1. - smoothstep(0.0, 0.45, l)) * nd;            // night: teal-indigo shadows
  g += vec3(0.020, 0.006, -0.018) * smoothstep(0.45, 1.0, l) * (nd + 1.2 * uDay);    // warm highlights (sun by day)
  g = l + uSat * (g - l);   // saturation (night 1.22)
  g = g * mix(0.975, 1.0, uDay) + vec3(0.008, 0.010, 0.024) * nd;
  { float bl = clamp((g.b - max(g.r, g.g)) * 3., 0., 1.); g.r -= 0.07 * bl * uDay; g.g += 0.025 * bl * uDay; } // undo AgX blue->violet skew by day
  // film grain (luma-weighted, stronger in mids)
  float gr = h12(gl_FragCoord.xy + fract(uTime * 13.17) * 917.) - 0.5;
  g += gr * 0.028 * (0.35 + l * (1. - l) * 2.4);
  g = mix(g, vec3(1.0, 0.97, 0.92), uWhite);
  g *= uFade;
  vec4 ov = texture(tOv, uv);
  g = mix(g, ov.rgb, ov.a);
  gl_FragColor = vec4(clamp(g, 0., 1.), 1.);
}`, { tCol: { value: rtDof.texture }, tBloom: { value: null }, uExp: { value: K.exposure }, uBloom: { value: K.bloom }, uTime: U.uTime, uRes: { value: new THREE.Vector2(OW, OH) }, tOv: { value: null }, uFade: { value: 1 }, uWhite: { value: 0 }, uSat: { value: 1.22 }, uDay: { value: 0 } });

scene.add(makeFox({ U, COMMON, SHADOW_GLSL }, L.fox, 2.0)); scene.add(makeProps({ U, COMMON, SHADOW_GLSL }));
const particles = makeParticles({ COMMON, SHADOW_GLSL, DEPTH_GLSL, U, camU, depthTex: rtScene.depthTexture, RW, RH, K });

// ---------------------------------------------------------------- frame
const { makeShots } = await import('./' + (P.get('shots') || 'game_shots.js'));
const shots = await makeShots({ THREE, scene, camera, U, K, L, COMMON, SHADOW_GLSL, DEPTH_GLSL, camU, rtScene, RW, RH, OW, OH, fin, dof, atm, P });
let shadowDone = false, lastKey = '';
function renderFrame(t) {
  U.uTime.value = t;
  // window flicker: hearth fire behind the glass, slow + fast components (deterministic)
  U.uWinFlick.value = 1.0 + 0.06 * Math.sin(t * 2.1) + 0.04 * Math.sin(t * 5.3 + 1.0) + 0.025 * Math.sin(t * 11.7 + 2.0);
  U.uLantFlick.value = 1.0 + 0.05 * Math.sin(t * 3.7 + 0.5) + 0.04 * Math.sin(t * 9.1) + 0.03 * Math.sin(t * 17.3 + 1.3);
  shots.apply(t);
  const kd = U.MOON_DIR.value, key = kd.toArray().map(v => v.toFixed(4)).join(',');
  if (key !== lastKey) { fitShadow(kd.clone().normalize()); renderer.setRenderTarget(shadowRT); renderer.setClearColor(0xffffff, 1); renderer.clear(); renderer.render(shadowScene, sCam); lastKey = key; }
  U.uCamR.value.setFromMatrixColumn(camera.matrixWorld, 0); U.uCamU.value.setFromMatrixColumn(camera.matrixWorld, 1); U.uCamF.value.setFromMatrixColumn(camera.matrixWorld, 2).negate();
  camU.uInvProj.value.copy(camera.projectionMatrixInverse); camU.uInvView.value.copy(camera.matrixWorld); camU.uCamPos.value.copy(camera.position);
  if (P.get("top")) { // debug: top-down plan of the layout, camera frustum marked by the ground pattern
    const oc = new THREE.OrthographicCamera(-45, 45, 80, -80, 1, 500); oc.position.set(90, 200, 50); oc.up.set(0, 0, 1); oc.lookAt(90, 0, 50); oc.updateMatrixWorld(); oc.updateProjectionMatrix();
    renderer.setRenderTarget(rtScene); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, oc);
    fin.m.uniforms.tCol.value = rtScene.texture; fin.m.uniforms.uBloom.value = 0; fin.m.uniforms.uExp.value = 6; fin.run(null); return;
  }
  renderer.setRenderTarget(rtScene); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  atm.run(rtAtm);
  dof.run(rtDof);
  if (!P.get("nopart")) { renderer.setRenderTarget(rtDof); renderer.render(particles, camera); renderer.render(shots.fxScene, camera); }
  const b = bloom(rtDof);
  fin.m.uniforms.tBloom.value = b.texture;
  fin.run(null);
}
window.renderFrame = renderFrame;
window.grabFrame = t => { renderFrame(t); return renderer.domElement.toDataURL('image/png').split(',')[1]; };
window.K = K; window.U = U; window.DURATION = shots.duration;
window.ready = true;
// test mode (?manual): no loop; window.step(seconds) advances the game at 30 fps by hand
let tMan = 0; window.step = (sec = 1 / 30) => { const n = Math.max(1, Math.round(sec * 30)); for (let i = 0; i < n; i++) { tMan += 1 / 30; renderFrame(tMan); } };
// game loop: the shots module is the game (input, state, HUD); the world renders every display frame at real time
window.FPS = 0; if (!P.has('manual')) { let n = 0, t1 = performance.now();
  renderer.setAnimationLoop(now => { renderFrame(now / 1000); n++; if (now - t1 > 1000) { window.FPS = n * 1000 / (now - t1); n = 0; t1 = now; } }); }
