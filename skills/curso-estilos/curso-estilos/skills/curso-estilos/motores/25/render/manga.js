// manga_mapa: cena OSM + relevo -> traco + retícula (sem IA de imagem).
// Pipeline: sombra (mapa de profundidade da luz) -> G-buffer (normal+profundidade | luz, albedo, id, material)
// -> composicao (linhas por descontinuidade + 5 niveis: branco, 3 retículas, beta) -> reducao 2x (AA).
import * as THREE from 'three';
import { personagem } from './personagem.js';
import { masp, figuras, horda, fita, MASP_ID } from './zumbi.js';

const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || 1080), H = +(Q.get('h') || 1920), SS = +(Q.get('ss') || 2);
const NOME = Q.get('cena') || 'paulista';
const EIXO = Q.get('eixo') || '';
const OUT = +(Q.get('out') || W / 1080);                       // escala de traço/retícula pela largura de saída
const SUN = { az: +(Q.get('az') || 320), el: +(Q.get('el') || 38) };  // graus; az a partir do norte

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
document.body.appendChild(renderer.domElement);

const cena = await (await fetch(`../cena/${NOME}.json`)).json();
const R = cena.R, T = cena.terrain;
function hAt(x, z) {
  const fi = Math.min(Math.max((x + R) / T.step, 0), T.n - 1.001), fj = Math.min(Math.max((z + R) / T.step, 0), T.n - 1.001);
  const i = fi | 0, j = fj | 0, u = fi - i, v = fj - j, h = T.h, n = T.n;
  return h[j * n + i] * (1 - u) * (1 - v) + h[j * n + i + 1] * u * (1 - v) + h[(j + 1) * n + i] * (1 - u) * v + h[(j + 1) * n + i + 1] * u * v;
}

// ---------- shaders ----------
const GV = /* glsl */`
in vec3 position; in vec3 normal; in vec4 aInfo; in vec3 aWall;
#ifdef INST
in mat4 instanceMatrix;
#endif
uniform mat4 modelMatrix, viewMatrix, projectionMatrix; uniform mat4 lightMatrix;
out vec3 vN; out vec3 vWN; out float vDepth; out vec4 vInfo; out vec3 vWall; out vec4 vLight; out vec3 vWorld; flat out int vInst;
void main(){
  mat4 M = modelMatrix;
#ifdef INST
  M = modelMatrix * instanceMatrix; vInst = gl_InstanceID;
#else
  vInst = 0;
#endif
  vec4 wp = M * vec4(position,1.0);
  vWorld = wp.xyz;
  vec4 vp = viewMatrix * wp;
  vWN = normalize(mat3(M) * normal);
  vN = normalize(mat3(viewMatrix) * vWN);
  vDepth = -vp.z; vInfo = aInfo; vWall = aWall;
  vLight = lightMatrix * (wp + vec4(vWN * 0.3, 0.0));
  gl_Position = projectionMatrix * vp;
}`;

// g0 = normal de view + profundidade | g1 = brilho (0 preto..1 branco), tipo, id (hash), material
const GF = /* glsl */`
precision highp float; precision highp sampler2D;
in vec3 vN; in vec3 vWN; in float vDepth; in vec4 vInfo; in vec3 vWall; in vec4 vLight; in vec3 vWorld; flat in int vInst;
uniform vec3 sunWorld; uniform sampler2D shadowMap; uniform float shadowRes; uniform sampler2D areas; uniform float R, amb;
layout(location=0) out vec4 g0; layout(location=1) out vec4 g1;
float shadow(){
  vec3 p = vLight.xyz / vLight.w * 0.5 + 0.5;
  if (p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0) return 1.0;
  float s = 0.0, b = 0.0002;
  for (int i=-1;i<=1;i++) for (int j=-1;j<=1;j++){
    float d = textureLod(shadowMap, p.xy + vec2(i,j)/shadowRes, 0.0).r;
    s += (p.z - b > d) ? 0.0 : 1.0;
  }
  return s/9.0;
}
float h3(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
float vnoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x), f.y), f.z); }
void main(){
  vec3 n = normalize(vN), wn = normalize(vWN);
  float oid = vInfo.x, alb = vInfo.y, kind = vInfo.z, style = vInfo.w, flag = 0.0;
#ifdef INST
  oid += float(vInst);
#endif
  float sh = shadow();
  float lit = max(dot(wn, sunWorld), 0.0) * sh;
  float hb = fract(oid * 0.37);                       // sorteio por predio
  if (kind > 1.5 && kind < 2.5) {                     // parede: janelas (somem quando ficam pequenas na tela)
    float u = vWall.x, v = vWall.y, top = vWall.z;
    vec2 fw = fwidth(vWall.xy); float pxm = 1.0 / max(max(fw.x, fw.y), 1e-4);
    if (style > 0.5 && style < 1.5 && pxm * 3.1 > 10.0) {
      float bay = 3.1, fl = 3.2, fx = fract(u / bay), fy = fract(v / fl);
      bool ground = v < fl;
      bool win = ground ? (fx > 0.06 && fx < 0.94 && fy > 0.05 && fy < 0.82)
                        : (fx > 0.20 && fx < 0.80 && fy > 0.30 && fy < 0.80);
      if (win && v < top - 1.2 && v > 0.3) { alb = hb < 0.6 ? 0.10 : 0.97; flag = 0.25; }
    } else if (style > 1.5) {                         // torre de vidro: montantes + andares (shironuki)
      if (pxm * 1.6 > 7.0) {
        float fx = fract(u / 1.6), fy = fract(v / 3.6);
        alb = 0.14; flag = 0.25;
        if (fx < 0.08 || fy < 0.07) { alb = 0.95; flag = 0.0; }
      } else alb = 0.32;
    }
  } else if (kind < 0.5) {                            // chao: verde / mata / agua da mascara
    vec4 a = texture(areas, (vWorld.xz + R) / (2.0*R));
    if (a.b > 0.5) { alb = 0.5; flag = 0.75; }
    else if (a.g > 0.5) { alb = 0.55; flag = 0.5; }
    else if (a.r > 0.5) { alb = 0.68; flag = 0.5; }
  } else if (kind > 0.5 && kind < 1.5) {              // rua: faixas tracejadas
    float lanes = style, w = vWall.z, v = vWall.y + 0.5*w;
    if (lanes >= 2.0) {
      float lw = w / lanes, k = abs(fract(v / lw + 0.5) - 0.5) * lw;
      if (k < 0.09 && v > 0.5*lw && v < w - 0.5*lw && fract(vWall.x / 9.0) < 0.42) alb = 0.05;
    }
  } else if (kind > 4.5 && kind < 5.5) {              // faixa de pedestre
    if (fract(vWall.x / 1.0) < 0.5) alb = 0.25;
  } else if (kind > 6.5 && kind < 7.5) {              // cabelo: anel de brilho em zigue-zague (branco dentro da beta)
    float hy = vWall.x, az = vWall.y;
    float c = 0.064 + 0.005 * sin(az * 9.0);
    float dh = abs(hy - c) / 0.010;                                // brilho = pente de tracos verticais pontudos
    float st = abs(fract(az * 15.0) - 0.5) * 2.0;
    if (dh < 1.0 && st < 0.55 * (1.0 - dh) && n.z > 0.2) alb = 1.0;
  } else if (kind > 7.5 && kind < 8.5 && vWall.z > 0.5) {   // rosto desenhado no shader (u = azimute, v = altura)
    float u = vWall.x, v = vWall.y, au = abs(u), su = sign(u);
    float v0 = 0.015 + 0.10 * (au - 0.34);                       // olho levemente puxado pra cima no canto de fora
    vec2 e = vec2((au - 0.34) / 0.20, (v - v0) / 0.135);
    float lid = 0.42 - 0.30 * e.x * e.x + 0.12 * e.x;            // curva da palpebra de cima
    if (length(e) < 1.0 && e.y < 0.95) {
      alb = 1.0; flag = 0.25;
      vec2 ir = vec2((au - 0.325) / 0.095, (v - v0 + 0.01) / 0.165);   // iris alta, cortada pela palpebra
      if (length(ir) < 1.0) {
        alb = 0.03;
        vec2 hl = vec2((u - su * 0.325 + 0.035) / 0.032, (v - v0 - 0.05) / 0.036);
        vec2 h2 = vec2((u - su * 0.325 - 0.03) / 0.016, (v - v0 + 0.06) / 0.018);
        if (length(hl) < 1.0 || length(h2) < 1.0) alb = 1.0;
      }
    }
    if (e.y > lid && e.y < lid + 0.42 && e.x > -0.98 && e.x < 1.12) { alb = 0.02; flag = 0.25; }   // palpebra grossa
    if (e.y < -0.86 && e.y > -1.08 && abs(e.x - 0.15) < 0.55) alb = 0.25;                         // risco de baixo
    if (abs(v + 0.50 - 0.25 * u * u) < 0.009 && au < 0.07) alb = 0.12;   // boca
    if (abs(u + 0.02) < 0.010 && v > -0.27 && v < -0.19) alb = 0.55;    // nariz (um risco)
  }
  float br = alb * (amb + 0.75 * smoothstep(0.0, 0.32, lit));   // sol baixo: luz/sombra quase binária (no sol = branco)
  if (kind > 7.5 && kind < 8.5 && alb > 0.9) br = 0.74 + 0.35 * lit;   // pele: sombra vira tom leve, nunca preto
  if (kind > 3.5 && kind < 4.5 && alb > 0.5) {        // copa: topo branco, lado em tom, baixo em beta (+ ruido em tufos)
    float nz = vnoise(vWorld * 0.9) * 0.6 + vnoise(vWorld * 2.3) * 0.4;
    br = 0.20 + 0.45 * max(dot(wn, sunWorld), 0.0) * (0.35 + 0.65*sh) + 0.34 * wn.y + 0.55 * (nz - 0.5);
    flag = 1.0;
  }
  g0 = vec4(n, vDepth);
  uint hh = uint(oid + 0.5) * 2654435761u; hh ^= hh >> 15; hh *= 2246822519u; hh ^= hh >> 13;
  g1 = vec4(clamp(br, 0.0, 1.0), kind, float(hh >> 8) / 16777216.0, flag);
}`;

const SV = /* glsl */`
in vec3 position;
#ifdef INST
in mat4 instanceMatrix;
#endif
uniform mat4 modelMatrix, viewMatrix, projectionMatrix;
void main(){
  mat4 M = modelMatrix;
#ifdef INST
  M = modelMatrix * instanceMatrix;
#endif
  gl_Position = projectionMatrix * viewMatrix * M * vec4(position,1.0);
}`;
const SF = `precision highp float; out vec4 o; void main(){ o = vec4(1.0); }`;

const QV = `in vec3 position; out vec2 uv; void main(){ uv = position.xy*0.5+0.5; gl_Position = vec4(position.xy,0.0,1.0); }`;
const CF = /* glsl */`
precision highp float; precision highp sampler2D;
in vec2 uv; out vec4 o;
uniform sampler2D g0, g1; uniform vec2 res; uniform float lw, cell, fadeA, fadeB, toneScale, bgLift, focusD, skyK, skyY;
vec4 A(vec2 p){ return textureLod(g0, p, 0.0); } vec4 B(vec2 p){ return textureLod(g1, p, 0.0); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float dots(vec2 fc, float cov){             // retícula de pontos a 45 graus
  if (cov <= 0.0) return 0.0;
  vec2 p = mat2(0.7071,-0.7071,0.7071,0.7071) * fc / cell;
  vec2 f = fract(p) - 0.5;
  if (cov > 0.5) { float r = sqrt((1.0-cov)/3.14159)*cell; return smoothstep(r-0.8, r+0.8, length(f)*cell); }
  float r = sqrt(cov/3.14159)*cell; return 1.0 - smoothstep(r-0.8, r+0.8, length(f)*cell);
}
float stipple(vec2 fc, float cov){          // areia/grama: pontos aleatorios
  vec2 c = floor(fc / (cell*0.55)); return hash(c) < cov*0.9 ? 1.0 : 0.0;
}
float hlines(vec2 fc, float cov){ return fract(fc.y / (cell*1.2)) < cov ? 1.0 : 0.0; }
void main(){
  vec2 px = 1.0 / res;
  vec4 a = A(uv), b = B(uv);
  bool sky = a.w <= 0.0;
  float d = sky ? 1e6 : a.w;
  float far = smoothstep(fadeA, fadeB, d);
  float r = lw * mix(1.0, 0.45, smoothstep(60.0, 500.0, d));
  bool chr = b.y > 6.5 && b.y < 9.5;
  if (chr) r *= 1.6;
  // ---- linhas
  float edge = 0.0, outline = 0.0;
  vec2 dirs[4] = vec2[](vec2(1,0), vec2(0,1), vec2(0.7071,0.7071), vec2(0.7071,-0.7071));
  for (int k=0;k<4;k++){
    vec2 o1 = dirs[k]*r*px;
    vec4 a1 = A(uv+o1), a2 = A(uv-o1), b1 = B(uv+o1), b2 = B(uv-o1);
    float d1 = a1.w<=0.0 ? 1e6 : a1.w, d2 = a2.w<=0.0 ? 1e6 : a2.w;
    if (!sky) {
      bool same1 = abs(b.z-b1.z) < 0.0007, same2 = abs(b.z-b2.z) < 0.0007;
      bool tree = b.w > 0.9 || (b.y > 6.5 && b.y < 7.5 && b1.y > 6.5 && b1.y < 7.5 && b2.y > 6.5 && b2.y < 7.5);
      if (!same1 || !same2) { if (!tree || min(d1,d2) < d*0.995 || !same1 && b1.w < 0.9 && b.w > 0.9 || !same2 && b2.w < 0.9 && b.w > 0.9) edge = 1.0; }
      if (!tree) {
        float iz = 1.0/d, dd = abs(1.0/d1 + 1.0/d2 - 2.0*iz) / iz;   // 2a derivada de 1/z: plano inclinado nao vira linha
        if (dd > 0.04) edge = 1.0;
        if (dot(a.xyz, a1.xyz) < 0.82 || dot(a.xyz, a2.xyz) < 0.82) edge = 1.0;
        if (abs(b.w-b1.w) > 0.1 || abs(b.w-b2.w) > 0.1) edge = 1.0;
      }
    }
    vec2 o2 = dirs[k]*r*1.9*px;
    float e1 = A(uv+o2).w, e2 = A(uv-o2).w;
    e1 = e1<=0.0 ? 1e6 : e1; e2 = e2<=0.0 ? 1e6 : e2;
    if (min(e1,e2) < d*0.80 && !sky) outline = 1.0;      // borda contra algo bem mais longe? -> o mais perto desenha
    if (sky && min(e1,e2) < 1e5) outline = 1.0;           // contorno contra o ceu
  }
  if (!chr) for (int k=0;k<4;k++){                       // contorno grosso em volta do personagem
    vec2 o3 = dirs[k]*lw*2.9*px;
    vec4 c1 = A(uv+o3), c2 = A(uv-o3), f1 = B(uv+o3), f2 = B(uv-o3);
    if (f1.y > 6.5 && f1.y < 9.5 && c1.w > 0.0 && c1.w < d*0.9) outline = 1.0;
    if (f2.y > 6.5 && f2.y < 9.5 && c2.w > 0.0 && c2.w < d*0.9) outline = 1.0;
  }
  edge = max(edge, outline);
  edge *= 1.0 - smoothstep(0.55, 1.0, far);
  // ---- tom
  float flag = b.w;
  float br = sky ? 1.0 - skyK * smoothstep(skyY, 1.0, uv.y) : b.x;   // céu: degradê de retícula no alto do quadro
  if (!sky) br = mix(br, 1.0, far*0.85);
  float bgk = chr ? 0.0 : bgLift * smoothstep(focusD * 1.4, focusD * 3.0, d);
  br = mix(br, 1.0, bgk);
  br = 1.0 - (1.0 - br) * toneScale;
  vec2 fc = gl_FragCoord.xy;
  float ink;
  bool beta = false;
  if (br > 0.80) ink = 0.0;
  else {
    float cov = br > 0.60 ? 0.13 : (br > 0.40 ? 0.30 : (br > 0.22 ? 0.58 : 1.0));
    if (cov >= 1.0) { ink = 1.0; beta = true; }
    else if (abs(flag-0.5) < 0.1) ink = stipple(fc, cov*1.4);
    else if (abs(flag-0.75) < 0.1) ink = hlines(fc, cov);
    else ink = dots(fc, cov);
  }
  if (sky) ink = dots(fc, clamp(1.0 - br, 0.0, 0.95));          // céu: retícula contínua, sem degrau
  float c = 1.0 - ink;
  if (edge > 0.5) c = beta ? 1.0 : 0.0;     // shironuki: linha branca dentro da beta
  o = vec4(vec3(c), 1.0);
}`;
const DF = `precision highp float; in vec2 uv; out vec4 o; uniform sampler2D src; uniform int ss;
void main(){ ivec2 b = ivec2(gl_FragCoord.xy) * ss; float c = 0.0;            // média de caixa SSxSS (antisserrilhado real)
  for (int j=0;j<ss;j++) for (int i=0;i<ss;i++) c += texelFetch(src, b + ivec2(i,j), 0).r;
  o = vec4(vec3(c / float(ss*ss)), 1.0); }`;

// ---------- materiais ----------
const sunDir = new THREE.Vector3(
  Math.sin(SUN.az * Math.PI / 180) * Math.cos(SUN.el * Math.PI / 180),
  Math.sin(SUN.el * Math.PI / 180),
  -Math.cos(SUN.az * Math.PI / 180) * Math.cos(SUN.el * Math.PI / 180)).normalize();
const SHRES = 8192;
const shadowRT = new THREE.WebGLRenderTarget(SHRES, SHRES, { depthTexture: new THREE.DepthTexture(SHRES, SHRES, THREE.FloatType) });
const lightCam = new THREE.OrthographicCamera(-R * 1.15, R * 1.15, R * 1.15, -R * 1.15, 700, 2300);
lightCam.position.copy(sunDir).multiplyScalar(1500); lightCam.lookAt(0, 0, 0); lightCam.updateMatrixWorld();
const lightMatrix = new THREE.Matrix4().multiplyMatrices(lightCam.projectionMatrix, lightCam.matrixWorldInverse);

// mascara de areas (verde, mata, agua) desenhada num canvas 2D
const AC = document.createElement('canvas'); AC.width = AC.height = 2048;
{ const g = AC.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 2048, 2048);
  const k = 2048 / (2 * R);
  for (const kind of ['grass', 'wood', 'water']) for (const a of cena.areas.filter(a => a.kind === kind)) {
    g.fillStyle = kind === 'water' ? '#00f' : kind === 'wood' ? '#0f0' : '#f00';
    g.beginPath(); a.pts.forEach(([x, z], i) => i ? g.lineTo((x + R) * k, (z + R) * k) : g.moveTo((x + R) * k, (z + R) * k)); g.fill();
  } }
const areasTex = new THREE.CanvasTexture(AC); areasTex.flipY = false; areasTex.minFilter = THREE.LinearFilter;

const U = { sunWorld: { value: sunDir }, amb: { value: 0.52 }, shadowMap: { value: shadowRT.depthTexture }, shadowRes: { value: SHRES },
  lightMatrix: { value: lightMatrix }, areas: { value: areasTex }, R: { value: R } };
function mats(inst) {
  const defines = inst ? { INST: 1 } : {};
  return {
    g: new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: GV, fragmentShader: GF, uniforms: U, defines, side: THREE.DoubleSide }),
    s: new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: SV, fragmentShader: SF, defines, side: THREE.DoubleSide }),
  };
}
const M0 = mats(false), M1 = mats(true);
const MR = mats(false); MR.g.polygonOffset = true; MR.g.polygonOffsetFactor = -2; MR.g.polygonOffsetUnits = -4;

// ---------- geometria ----------
class Buf { constructor() { this.p = []; this.n = []; this.i = []; this.w = []; }
  tri(a, b, c, info, wa, wb, wc, nrm) {
    const n = nrm || new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    for (const [v, w] of [[a, wa], [b, wb], [c, wc]]) { this.p.push(v.x, v.y, v.z); this.n.push(n.x, n.y, n.z); this.i.push(...info); this.w.push(...w); }
  }
  geo() { const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aInfo', new THREE.Float32BufferAttribute(this.i, 4)); g.setAttribute('aWall', new THREE.Float32BufferAttribute(this.w, 3)); return g; } }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const scene = new THREE.Scene();
const meshes = [];
function add(geo, m) { const me = new THREE.Mesh(geo, m.g); me.userData.m = m; me.frustumCulled = false; scene.add(me); meshes.push(me); return me; }

// terreno
{ const n = T.n, g = new THREE.BufferGeometry(), p = [], idx = [], inf = [], wl = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { p.push(-R + i * T.step, T.h[j * n + i], -R + j * T.step); inf.push(1, 0.82, 0, 0); wl.push(0, 0, 0); }
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) { const a = j * n + i; idx.push(a, a + n, a + 1, a + 1, a + n, a + n + 1); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aInfo', new THREE.Float32BufferAttribute(inf, 4));
  g.setAttribute('aWall', new THREE.Float32BufferAttribute(wl, 3)); g.setIndex(idx); g.computeVertexNormals(); add(g, M0); }

// predios
{ const B = new Buf(); let k = 0;
  for (const b of cena.buildings) {
    if (fita(b)) { k++; continue; }                               // pórtico do MASP: modelado à parte (zumbi.js)
    if (b.id === MASP_ID && !b._ok) {                             // volume suspenso acima do nível da avenida
      const hs = b.pts.map(([x, z]) => hAt(x, z)); b._fundo = Math.min(...hs); b.base = Math.max(...hs) - 0.6;
      b.minh = 8.4; b.h = 15.0; b.style = 2; b.alb = 0.85; b._ok = 1; }
    const oid = 10 + (k++), pts = b.pts, y0 = b.base + (b.minh || 0), y1 = b.base + b.h, top = b.h;
    let area = 0; for (let i = 0; i < pts.length; i++) { const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % pts.length]; area += x1 * z2 - x2 * z1; }
    const sgn = area > 0 ? 1 : -1; let u = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % pts.length], L = Math.hypot(x2 - x1, z2 - z1);
      if (L < 0.01) continue;
      const nrm = V(sgn * (z2 - z1) / L, 0, -sgn * (x2 - x1) / L), inf = [oid, b.alb, 2, b.style];
      const a = V(x1, y0, z1), bb = V(x2, y0, z2), c = V(x2, y1, z2), d = V(x1, y1, z1), v0 = y0 - b.base - 0.6, v1 = top - 0.6;
      B.tri(a, bb, c, inf, [u, v0, top], [u + L, v0, top], [u + L, v1, top], nrm);
      B.tri(a, c, d, inf, [u, v0, top], [u + L, v1, top], [u, v1, top], nrm);
      u += L;
    }
    const contour = pts.map(([x, z]) => new THREE.Vector2(x, z));
    const tris = THREE.ShapeUtils.triangulateShape(contour, []);
    const infR = [oid, Math.min(1, b.alb + 0.08), 3, 0];
    for (const [i, j, l] of tris) {
      B.tri(V(pts[i][0], y1, pts[i][1]), V(pts[j][0], y1, pts[j][1]), V(pts[l][0], y1, pts[l][1]), infR, [0, 0, 0], [0, 0, 0], [0, 0, 0], V(0, 1, 0));
      if (b.minh > 0.5) B.tri(V(pts[i][0], y0, pts[i][1]), V(pts[j][0], y0, pts[j][1]), V(pts[l][0], y0, pts[l][1]), infR, [0, 0, 0], [0, 0, 0], [0, 0, 0], V(0, -1, 0));
    }
    // casa de maquinas no telhado
    if (Math.abs(area / 2) > 300 && b.h > 15) {
      let cx = 0, cz = 0; pts.forEach(([x, z]) => { cx += x; cz += z; }); cx /= pts.length; cz /= pts.length;
      const s = 2.5 + (b.id % 3), hh = 2.8, ob = oid + 50000;
      const box = [[-s, -s * 0.7], [s, -s * 0.7], [s, s * 0.7], [-s, s * 0.7]].map(([x, z]) => [cx + x, cz + z]);
      for (let i = 0; i < 4; i++) { const [x1, z1] = box[i], [x2, z2] = box[(i + 1) % 4];
        const L = Math.hypot(x2 - x1, z2 - z1), nrm = V((z2 - z1) / L, 0, -(x2 - x1) / L).multiplyScalar(-1);
        B.tri(V(x1, y1, z1), V(x2, y1, z2), V(x2, y1 + hh, z2), [ob, 0.9, 6, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], nrm);
        B.tri(V(x1, y1, z1), V(x2, y1 + hh, z2), V(x1, y1 + hh, z1), [ob, 0.9, 6, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], nrm); }
      B.tri(V(box[0][0], y1 + hh, box[0][1]), V(box[1][0], y1 + hh, box[1][1]), V(box[2][0], y1 + hh, box[2][1]), [ob, 0.95, 6, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], V(0, 1, 0));
      B.tri(V(box[0][0], y1 + hh, box[0][1]), V(box[2][0], y1 + hh, box[2][1]), V(box[3][0], y1 + hh, box[3][1]), [ob, 0.95, 6, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], V(0, 1, 0));
    }
  }
  add(B.geo(), M0); }

// ruas (fitas sobre o relevo)
function ribbon(B, pts3, w, info, step = 3) {
  const P = [];
  for (let i = 0; i < pts3.length - 1; i++) {
    const [x1, z1, y1] = pts3[i], [x2, z2, y2] = pts3[i + 1], L = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.ceil(L / step));
    for (let s = 0; s < n; s++) { const t = s / n; P.push([x1 + (x2 - x1) * t, z1 + (z2 - z1) * t, y1 + (y2 - y1) * t, (y1 > hAt(x1, z1) + 1 || y2 > hAt(x2, z2) + 1)]); }
  }
  const l = pts3[pts3.length - 1]; P.push([l[0], l[1], l[2], false]);
  let u = 0; const L2 = [], R2 = [], UU = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1]; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
    const nx = -dz, nz = dx, hw = w / 2;
    if (i) u += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    const yl = P[i][3] ? P[i][2] : hAt(P[i][0] + nx * hw, P[i][1] + nz * hw), yr = P[i][3] ? P[i][2] : hAt(P[i][0] - nx * hw, P[i][1] - nz * hw);
    L2.push(V(P[i][0] + nx * hw, yl + 0.22, P[i][1] + nz * hw)); R2.push(V(P[i][0] - nx * hw, yr + 0.22, P[i][1] - nz * hw)); UU.push(u);
  }
  for (let i = 0; i < P.length - 1; i++) {
    const up = V(0, 1, 0);
    B.tri(L2[i], R2[i], R2[i + 1], info, [UU[i], -w / 2, w], [UU[i], w / 2, w], [UU[i + 1], w / 2, w], up);
    B.tri(L2[i], R2[i + 1], L2[i + 1], info, [UU[i], -w / 2, w], [UU[i + 1], w / 2, w], [UU[i + 1], -w / 2, w], up);
  }
}
{ const B = new Buf(), C = new Buf();
  const order = cena.roads.filter(r => r.car).sort((a, b) => a.w - b.w);
  for (const r of order) ribbon(B, r.pts, r.w, [2, 0.97, 1, r.lanes >= 2 ? r.lanes : 0]);
  for (const c of cena.crossings) if (c.length === 2) ribbon(C, c, 3.2, [2, 0.97, 5, 0], 1.5);   // só faixas retas
  add(B.geo(), MR);
  const mc = mats(false); mc.g.polygonOffset = true; mc.g.polygonOffsetFactor = -4; mc.g.polygonOffsetUnits = -8; add(C.geo(), mc); }

// arvores: 6 modelos procedurais instanciados (copa = bolhas com ruido, tronco = cilindro)
function noise3(x, y, z) { return Math.sin(x * 1.7 + Math.sin(z * 2.3)) * Math.cos(y * 1.9 + Math.sin(x * 1.3)) * Math.sin(z * 1.1 + y * 0.7); }
function treeGeo(seed) {
  const rnd = (() => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); })();
  const parts = [], th = 3.2 + rnd() * 2.0;
  const trunk = new THREE.CylinderGeometry(0.18, 0.28, th + 1, 7, 1, true).toNonIndexed(); trunk.translate(0, (th + 1) / 2 - 0.5, 0);
  parts.push([trunk, 0.35]);
  const nb = 9 + (rnd() * 6 | 0), cr = 2.4 + rnd() * 1.8, cy = th + cr * 0.75;
  for (let i = 0; i < nb; i++) {
    const r = cr * (0.34 + rnd() * 0.26), a = rnd() * 6.28, d = cr * 0.75 * Math.sqrt(rnd());
    const s = new THREE.IcosahedronGeometry(r, 2);
    const pos = s.attributes.position, nor = s.attributes.normal, ox = Math.cos(a) * d, oz = Math.sin(a) * d, oy = cy + (rnd() - 0.45) * cr * 0.9;
    for (let k = 0; k < pos.count; k++) {
      const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k), f = 1 + 0.3 * noise3(x * 2.2 + seed + i, y * 2.2, z * 2.2);
      pos.setXYZ(k, x * f + ox, y * f * 0.85 + oy, z * f + oz);
      const l = Math.hypot(x, y, z); nor.setXYZ(k, x / l, y / l, z / l);   // normal lisa de esfera
    }
    parts.push([s.index ? s.toNonIndexed() : s, 0.78]);
  }
  const B = new Buf();
  for (const [g, alb] of parts) {
    const p = g.attributes.position, n = g.attributes.normal;
    for (let k = 0; k < p.count; k++) { B.p.push(p.getX(k), p.getY(k), p.getZ(k)); B.n.push(n.getX(k), n.getY(k), n.getZ(k)); B.i.push(0, alb, 4, 0); B.w.push(0, 0, 0); }
  }
  return B.geo();
}
{ const NT = 6, groups = Array.from({ length: NT }, () => []);
  cena.trees.forEach((t, i) => groups[Math.floor(t[3] * NT) % NT].push(t));
  groups.forEach((g, ti) => {
    if (!g.length) return;
    const geo = treeGeo(ti + 1), im = new THREE.InstancedMesh(geo, M1.g, g.length);
    const geoInfo = geo.attributes.aInfo; for (let k = 0; k < geoInfo.count; k++) geoInfo.setX(k, 200000 + ti * 20000);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    g.forEach((t, k) => { const s = 0.8 + (t[3] * 7.3 % 1) * 0.5;
      q.setFromAxisAngle(V(0, 1, 0), t[3] * 40); m.compose(V(t[0], hAt(t[0], t[1]) - 0.3, t[1]), q, V(s, s * (0.9 + (t[3] * 3.1 % 1) * 0.3), s)); im.setMatrixAt(k, m); });
    im.userData.m = M1; im.userData.list = g; im.frustumCulled = false; scene.add(im); meshes.push(im);
  });
}

// carros (3 tons) e postes, instanciados
function partsGeo(list) { const B = new Buf();
  for (const [g0, alb] of list) { const g = g0.index ? g0.toNonIndexed() : g0, p = g.attributes.position, n = g.attributes.normal;
    for (let k = 0; k < p.count; k++) { B.p.push(p.getX(k), p.getY(k), p.getZ(k)); B.n.push(n.getX(k), n.getY(k), n.getZ(k)); B.i.push(0, alb, 6, 0); B.w.push(0, 0, 0); } }
  return B.geo(); }
const box = (w, h, l, x, y, z) => new THREE.BoxGeometry(w, h, l).translate(x, y + h / 2, z);
function instance(geo, list, base, place) {
  if (!list.length) return;
  const im = new THREE.InstancedMesh(geo, M1.g, list.length), inf = geo.attributes.aInfo;
  for (let k = 0; k < inf.count; k++) inf.setX(k, base);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  list.forEach((t, k) => { place(t, m, q); im.setMatrixAt(k, m); });
  im.userData.list = list; im.userData.m = M1; im.frustumCulled = false; scene.add(im); meshes.push(im);
}
[0.96, 0.62, 0.22].forEach((alb, ci) => {
  const g = partsGeo([[box(1.8, 0.75, 4.3, 0, 0.32, 0), alb], [box(1.55, 0.55, 2.2, 0, 1.07, -0.25), Math.min(1, alb + 0.1)],
                      [box(0.2, 0.6, 0.6, 0.8, 0, 1.3), 0.15], [box(0.2, 0.6, 0.6, -0.8, 0, 1.3), 0.15], [box(0.2, 0.6, 0.6, 0.8, 0, -1.3), 0.15], [box(0.2, 0.6, 0.6, -0.8, 0, -1.3), 0.15]]);
  instance(g, (cena.cars || []).filter(c => Math.floor(c[4] * 3) === ci), 300000 + ci * 5000, (t, m, q) => {
    q.setFromAxisAngle(V(0, 1, 0), t[3]); m.compose(V(t[0], t[2] + 0.1, t[1]), q, V(1, 1, 1)); });
});
instance(partsGeo([[new THREE.CylinderGeometry(0.09, 0.12, 8.5, 6).translate(0, 4.25, 0), 0.85], [box(0.12, 0.12, 2.6, 0, 8.2, -1.2), 0.85]]),
  cena.poles || [], 330000, (t, m, q) => { q.setFromAxisAngle(V(0, 1, 0), t[3]); m.compose(V(t[0], t[2], t[1]), q, V(1, 1, 1)); });

// ---------- passes ----------
const gRT = new THREE.WebGLRenderTarget(W * SS, H * SS, { count: 2, type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
const cRT = new THREE.WebGLRenderTarget(W * SS, H * SS, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
const qScene = new THREE.Scene(); qScene.add(quad); const qCam = new THREE.Camera();
const comp = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: QV, fragmentShader: CF, uniforms: {
  g0: { value: gRT.textures[0] }, g1: { value: gRT.textures[1] }, res: { value: new THREE.Vector2(W * SS, H * SS) },
  lw: { value: +(Q.get('lw') || 1.6) * SS * OUT }, cell: { value: +(Q.get('cell') || 4.2) * SS * OUT },
  fadeA: { value: +(Q.get('fa') || 320) }, fadeB: { value: +(Q.get('fb') || 620) }, toneScale: { value: +(Q.get('ts') || 1.0) }, bgLift: { value: 0 }, focusD: { value: 10 }, skyK: { value: +(Q.get('skyk') || 0) }, skyY: { value: +(Q.get('skyy') || 0.5) } } });
const down = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: QV, fragmentShader: DF, uniforms: { src: { value: cRT.texture }, ss: { value: SS } } });

const cam = new THREE.PerspectiveCamera(50, W / H, 0.5, 5000);
function draw() {
  for (const m of meshes) m.material = m.userData.m.s;
  renderer.setRenderTarget(shadowRT); renderer.setClearColor(0xffffff, 1); renderer.clear(); renderer.render(scene, lightCam);
  cam.updateMatrixWorld();
  for (const m of meshes) m.material = m.userData.m.g;
  renderer.setRenderTarget(gRT); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, cam);
  quad.material = comp; renderer.setRenderTarget(cRT); renderer.render(qScene, qCam);
  quad.material = down; renderer.setRenderTarget(null); renderer.render(qScene, qCam);
  return true;
}

// ---------- cameras ----------
// eixo = rua principal (PCA dos pontos da rua com o nome pedido, ou a maior rua de carro perto do centro)
let pts = cena.roads.filter(r => EIXO && r.name === EIXO).flatMap(r => r.pts);
if (pts.length < 2) { const r = cena.roads.filter(r => r.car).sort((a, b) => b.w - a.w)[0]; pts = r.pts; }
const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
let sxx = 0, sxz = 0, szz = 0; for (const p of pts) { const dx = p[0] - cx, dz = p[1] - cz; sxx += dx * dx; sxz += dx * dz; szz += dz * dz; }
const ang = 0.5 * Math.atan2(2 * sxz, sxx - szz);
let dir = V(Math.cos(ang), 0, Math.sin(ang)); if (Q.get('inv')) dir.negate();
const side = V(-dir.z, 0, dir.x);
// ponto do eixo mais perto da origem (o centro pedido)
let best = pts[0]; for (const p of pts) if (p[0] ** 2 + p[1] ** 2 < best[0] ** 2 + best[1] ** 2) best = p;
const C0 = V(best[0], hAt(best[0], best[1]), best[1]);
const at = (along, lat, up) => C0.clone().addScaledVector(dir, along).addScaledVector(side, lat).add(V(0, up, 0));

function setCam({ pos, look, fov = 50, shift = 0, near = 0.5, far = 5000, bg = 0 }) {
  comp.uniforms.bgLift.value = bg; comp.uniforms.focusD.value = pos.distanceTo(look);
  cam.near = near; cam.far = far; cam.fov = fov; cam.aspect = W / H; cam.position.copy(pos); cam.lookAt(look); cam.clearViewOffset();
  if (shift) cam.setViewOffset(W, H, 0, -shift * H, W, H);     // 2 pontos: camera nivelada + deslocamento de lente
  cam.updateProjectionMatrix();
}
const CAMS = {
  overview: () => ({ pos: at(-260, 140, 170), look: at(60, 0, 0), fov: 45 }),
  alto: () => ({ pos: at(-90, 4, 26), look: at(80, 0, 6), fov: 60 }),
  rua: () => { const p = at(-40, +(Q.get('rl') || 0), 0); p.y = hAt(p.x, p.z) + 1.6; return { pos: p, look: p.clone().addScaledVector(dir, 50).add(V(0, 0, 0)), fov: 62, shift: 0.18 }; },
  aerea: () => ({ pos: V(0, 900, 1), look: V(0, 0, 0), fov: 55 }),
  // fundos para personagem por cima (camera na altura do olho / de baixo)
  bg_costas: () => { const p = at(+(Q.get('ba') || -70), +(Q.get('bl') || 0), 0); p.y = hAt(p.x, p.z) + 1.7;
    return { pos: p, look: p.clone().addScaledVector(dir, 60), fov: 66, shift: 0.22, near: 0.3 }; },
  bg_aori: () => { const p = at(+(Q.get('ba') || -70), +(Q.get('bl') || 0), 0); p.y = hAt(p.x, p.z) + 0.5;
    return { pos: p, look: p.clone().addScaledVector(dir, 30).add(V(0, 22, 0)), fov: 72, near: 0.3 }; },
  bg_chao: () => { const p = at(+(Q.get('ba') || -70), +(Q.get('bl') || 0), 0); p.y = hAt(p.x, p.z) + 0.45;
    return { pos: p, look: p.clone().addScaledVector(dir, 40).add(V(0, 4, 0)), fov: 78, near: 0.1 }; },
  bg_lado: () => { const p = at(+(Q.get('ba') || -70), +(Q.get('bl') || 0), 0); p.y = hAt(p.x, p.z) + 1.5;
    return { pos: p, look: p.clone().addScaledVector(side, +(Q.get('bs') || 25) > 0 ? 40 : -40).addScaledVector(dir, 6), fov: 70, shift: 0.18, near: 0.3 }; },
  bg_ceu: () => { const p = at(+(Q.get('ba') || -70), +(Q.get('bl') || 0), 0); p.y = hAt(p.x, p.z) + 1.6;
    return { pos: p, look: p.clone().addScaledVector(dir, 14).addScaledVector(side, +(Q.get('bs') || 25)).add(V(0, 40, 0)), fov: 50, near: 0.3 }; },
};
// personagem (opcional): ?char=1 -> parado na avenida, olhando 3/4 pra camera
let CH = null;
if (Q.get('char')) {
  const lat = +(Q.get('cl') || 0), along = +(Q.get('ca') || -30);
  const base = at(along, lat, 0); base.y = hAt(base.x, base.z) + 0.24;
  const yaw = Math.atan2(-dir.x, -dir.z) + (+(Q.get('cy') || 0.5));        // de frente pra quem vem pelo eixo, girado
  const { geo, head } = personagem(Buf, { pose: Q.get('pose') || 'parado' });
  const me = add(geo, M0); me.position.copy(base); me.rotation.y = yaw; me.updateMatrixWorld();
  // tira carro/arvore/poste que encostam nele
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (const m of meshes) if (m.isInstancedMesh && m.userData.list) m.userData.list.forEach((t, k) => {
    if (Math.hypot(t[0] - base.x, t[1] - base.z) < 9) m.setMatrixAt(k, zero); });
  for (const m of meshes) if (m.isInstancedMesh) m.instanceMatrix.needsUpdate = true;
  const fwd = V(Math.sin(yaw), 0, Math.cos(yaw)), rgt = V(Math.cos(yaw), 0, -Math.sin(yaw));
  const P = (f, r, y) => base.clone().addScaledVector(fwd, f).addScaledVector(rgt, r).add(V(0, y, 0));
  const H0 = base.clone().add(head.clone().applyAxisAngle(V(0, 1, 0), yaw));
  CH = { base, yaw, P, H0 };
  Object.assign(CAMS, {
    corpo: () => ({ pos: P(2.0, 0.55, 0.32), look: P(0, 0.0, 1.02), fov: 58, near: 0.2, far: 2500, bg: 0.45 }),     // aori: de baixo, cidade atras
    meio: () => ({ pos: P(1.3, 0.38, 1.42), look: P(0, 0, 1.36), fov: 44, near: 0.2, far: 2500, bg: 0.5 }),
    rosto: () => ({ pos: H0.clone().addScaledVector(fwd, 0.85).addScaledVector(rgt, 0.22).add(V(0, -0.02, 0)), look: H0.clone().add(V(0, -0.04, 0)), fov: 30, near: 0.1, far: 2500, bg: 0.55 }),
  });
}
// apocalipse zumbi (?zumbi=1): MASP + horda andando pro vão + sobreviventes no teto
let Z = null;
if (Q.get('zumbi')) {
  const M = masp(cena, Buf, V, [C0.x, C0.z]);
  add(M.geo, M0); const escada = add(M.geoLad, M0);
  const F = figuras(), lista = horda(cena, M, +(Q.get('nz') || 3600));
  const grupos = [0, 1, 2, 3].map(vv => lista.filter(z => z.var === vv));
  const ims = grupos.map((g, vi) => {
    const geo = partsGeo(F.zumbis[vi]), im = new THREE.InstancedMesh(geo, M1.g, Math.max(1, g.length)), inf = geo.attributes.aInfo;
    for (let i = 0; i < inf.count; i++) inf.setX(i, 400000 + vi * 4000);
    im.userData.m = M1; im.frustumCulled = false; scene.add(im); meshes.push(im); return im; });
  // sobreviventes: no teto do MASP e um na escada
  const vivos = [];
  let sd = 3; const rr = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 12; i++) { const a = (rr() * 2 - 1) * (M.lu - 6), b = (rr() * 0.8 + 0.1) * (M.lv - 3);
    vivos.push([M.c[0] + M.u[0] * a + M.v[0] * b, M.yTop + 0.05, M.c[1] + M.u[1] * a + M.v[1] * b, rr() * 6.28]); }
  instance(partsGeo(F.vivo), vivos, 430000, (t, m, q) => { q.setFromAxisAngle(V(0, 1, 0), t[3]); m.compose(V(t[0], t[1], t[2]), q, V(1, 1, 1)); });
  // tira carro/árvore/poste de dentro do vão e de cima da escada
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (const m of meshes) if (m.isInstancedMesh && m.userData.list) { m.userData.list.forEach((t, k) => {
    const du = (t[0] - M.c[0]) * M.u[0] + (t[1] - M.c[1]) * M.u[1], dv = (t[0] - M.c[0]) * M.v[0] + (t[1] - M.c[1]) * M.v[1];
    if (Math.abs(du) < M.lu + 12 && dv > -(M.lv + 4) && dv < M.lv + 38 && t.length >= 4 && m.userData.list !== vivos) m.setMatrixAt(k, zero); });
    m.instanceMatrix.needsUpdate = true; }
  const mm = new THREE.Matrix4(), qq = new THREE.Quaternion();
  let ZMIN = +(Q.get('zmin') || 30); const camP = V(0, -1e6, 0);
  function tempo(T) {                                      // horda anda pro vão; para numa distância sorteada
    grupos.forEach((g, vi) => { g.forEach((z, i) => {
      const dx = M.c[0] - z.x, dz = M.c[1] - z.z, L = Math.hypot(dx, dz) || 1;
      const andou = Math.min(z.vel * T, Math.max(0, L - z.para));
      const x = z.x + dx / L * andou, zz = z.z + dz / L * andou;
      const passo = Math.abs(Math.sin(T * 3.2 * z.vel + z.fase)) * 0.06;
      qq.setFromAxisAngle(V(0, 1, 0), Math.atan2(dx, dz) + 0.25 * Math.sin(T * 1.7 + z.fase));
      const perto = Math.hypot(x - camP.x, zz - camP.z, hAt(x, zz) - camP.y) < ZMIN;      // zumbi 3D de perto vira manequim: some
      mm.compose(V(x, hAt(x, zz) + 0.2 + passo, zz), qq, perto ? V(0, 0, 0) : V(z.sc, z.sc, z.sc)); ims[vi].setMatrixAt(i, mm); });
      ims[vi].instanceMatrix.needsUpdate = true; });
  }
  tempo(0);
  const av = (a, b, up) => V(M.c[0] + M.u[0] * a + M.v[0] * b, M.g0 + up, M.c[1] + M.u[1] * a + M.v[1] * b);
  const L = V(M.lad[0], M.g0, M.lad[1]);
  const base = { near: 0.3, far: 2500 };
  const baixo = { pos: L.clone().add(V(M.v[0] * 17 - M.u[0] * 3, 1.5, M.v[1] * 17 - M.u[1] * 3)), look: L.clone().add(V(M.u[0] * 4.5, 8.5, M.u[1] * 4.5)), fov: 74 };
  const aberto = { pos: av(+(Q.get('ra') || -30), +(Q.get('rb') || 85), +(Q.get('rh') || 20)), look: av(0, 0, +(Q.get('rl') || 8)), fov: +(Q.get('rf') || 55) };
  const fachada = { pos: av(-6, M.lv + 26, 13), look: av(0, 0, 11.5), fov: 58 };
  const ceu = { pos: av(-55, 110, 62), look: av(0, -5, 2), fov: 52 };      // grua: do alto (mar de zumbis) ao olho da rua
  Object.assign(CAMS, {
    m_baixo: () => ({ ...baixo, ...base }),
    m_aberto: () => ({ ...aberto, ...base }),
    m_fachada: () => ({ ...fachada, ...base }),
    m_vao: () => ({ pos: av(-75, M.lv + 35, 18), look: av(5, 0, 5), fov: 58, zmin: 30, limpa: 34, ...base }),
    m_pov: () => ({ pos: av(-8, M.lv + 1.5, 15.6), look: av(10, M.lv + 14, 0), fov: 75, zmin: 16, ...base }),   // da beira do teto: a horda lá embaixo
    m_drone: () => ({ pos: av(-170, 230, 175), look: av(10, 0, 0), fov: 50, ...base }),
    m_rua: () => { const p = av(70, 30, 0); p.y = hAt(p.x, p.z) + 1.7; return { pos: p, look: av(0, 10, 9), fov: 62, ...base }; },
    m_topo: () => ({ pos: av(-4, M.lv - 7, 15 + 1.8), look: av(-10, 220, 4), fov: 66, ...base }),
  });
  const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  // árvore/carro/poste colado na câmera vira mancha (copa sem tronco lê como pedra): some só naquele plano
  const orig = meshes.filter(m => m.isInstancedMesh && m.userData.list && m.userData.list !== vivos).map(m => [m, m.instanceMatrix.array.slice()]);
  const limpa = (pos, r) => { for (const [m, a0] of orig) { m.instanceMatrix.array.set(a0);
      if (r > 0) m.userData.list.forEach((t, k) => { if (Math.hypot(t[0] - pos.x, t[1] - pos.z) < r) m.setMatrixAt(k, zero); });
      m.instanceMatrix.needsUpdate = true; } };
  const medida = () => {                                   // pés internos dos 2 pilares da frente, na tela (px)
    const out = []; for (const p of M.pernas) for (const y of [M.g0 + 0.2, M.g0 + 7.0]) {
      const v = V(p.x, y, p.z).project(cam); out.push([(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, v.z]); }
    return out; };
  Z = { M, tempo, camP, medida, limpa, av, setZmin: (v) => { ZMIN = v; }, escada: (v) => { escada.visible = !!v; }, reveal: (t) => { const e = ease(Math.min(1, Math.max(0, t)));
    // mergulho: posição desce em arco (cai rápido, assenta), o alvo desliza do chão pro vão
    const ep = 1 - Math.pow(1 - e, 1.3), pos = ceu.pos.clone().lerp(aberto.pos, ep);
    return { pos, look: ceu.look.clone().lerp(aberto.look, e), fov: ceu.fov + (aberto.fov - ceu.fov) * e, ...base }; } };
}
// giro em volta do personagem (t 0..1)
function giro(t) {
  const a = (t - 0.5) * 1.6, r = 2.2;
  const off = V(Math.sin(CH.yaw + a), 0, Math.cos(CH.yaw + a)).multiplyScalar(r);
  return { pos: CH.base.clone().add(off).add(V(0, 0.75, 0)), look: CH.base.clone().add(V(0, 1.15, 0)), fov: 55, near: 0.2, far: 2500, bg: 0.45 };
}
// limpa arvores/carros/postes perto do ponto de camera de rua (?limpa=raio)
if (Q.get('limpa')) {
  const c = at(+(Q.get('ba') || -70), +(Q.get('bl') || 0), 0), R2 = +Q.get('limpa'), zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (const m of meshes) if (m.isInstancedMesh && m.userData.list) {
    m.userData.list.forEach((t, k) => { const dx = t[0] - c.x, dz = t[1] - c.z, f = dx * dir.x + dz * dir.z, l = Math.abs(-dx * dir.z + dz * dir.x);
      if (Math.hypot(dx, dz) < R2 || (f > 0 && f < R2 * 3 && l < 7)) m.setMatrixAt(k, zero); });
    m.instanceMatrix.needsUpdate = true;
  }
}
// voo: de cima descendo pela avenida (t 0..1)
function voo(t) {
  const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const along = -320 + 360 * e, alt = 235 - 221 * e, lat = 30 * (1 - e) + 2;
  const pos = at(along, lat, alt); pos.y = Math.max(pos.y, hAt(pos.x, pos.z) + 3);
  const look = at(along + 120, 0, alt * 0.12);
  return { pos, look, fov: 55 + 8 * e };
}
window.MANGA = { draw, setCam, CAMS, voo, medida: (name) => { const c = CAMS[name](); setCam(c); cam.updateMatrixWorld(); return Z ? Z.medida() : null; }, info: { n: cena.buildings.length, dir: [dir.x, dir.z], C0: [C0.x, C0.y, C0.z] },
  shot(name, t, T, esc) { if (Z) Z.escada(esc === undefined ? 1 : esc);
    const c = name === 'voo' ? voo(t) : name === 'giro' ? giro(t) : name === 'reveal' ? Z.reveal(t) : CAMS[name]();
    if (Z) { Z.camP.copy(c.pos); Z.setZmin(c.zmin ?? 30); Z.tempo(T === undefined ? 0 : T); Z.limpa(c.pos, c.limpa ?? 0); }
    setCam(c); return draw(); } };
// câmera livre (peça do curso): s = {f:'av'|'at'|'w', pos:[..], look:[..], fov, T, zmin, limpa, esc, ground}
const P3 = (f, a) => f === 'av' && Z ? Z.av(...a) : f === 'at' ? at(...a) : V(...a);
window.MANGA.free = (s) => { if (Z) Z.escada(s.esc ?? 1);
  const c = { pos: P3(s.f, s.pos), look: P3(s.f, s.look), fov: s.fov || 50, near: s.near || 0.3, far: 2500, shift: s.shift || 0, bg: s.bg || 0 };
  if (s.ground !== undefined) c.pos.y = Math.max(c.pos.y, hAt(c.pos.x, c.pos.z) + s.ground);
  comp.uniforms.fadeA.value = s.fa ?? +(Q.get('fa') || 320); comp.uniforms.fadeB.value = s.fb ?? +(Q.get('fb') || 620);
  if (Z) { Z.camP.copy(c.pos); Z.setZmin(s.zmin ?? 30); Z.tempo(s.T || 0); Z.limpa(c.pos, s.limpa || 0); }
  setCam(c); return draw(); };
window.MANGA.Z = Z && { lu: Z.M.lu, lv: Z.M.lv, g0: Z.M.g0, yTop: Z.M.yTop, dir: [dir.x, dir.z], u: Z.M.u, v: Z.M.v };
window.MANGA_READY = true;
