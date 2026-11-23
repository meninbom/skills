// 62 · PODERES E JUICE (peça original do curso). Ina × Sentinela da ruína, ao entardecer. Mudo, 1080×1920.
// 4 poderes do kit (raio, cura, fogo, gelo) num embate com começo e fim. Beats em QUADROS de mundo a 60 qps (W{}).
// Tudo é função do tempo (seek(t)), hash em vez de Math.random. Motor: lib/ (cópia do kit_juice + a personagem Ina).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { U, toon, comContorno } from './lib/toon.js';
import { criarIna, aplicarPose } from './lib/ina.js';
import { poseEstatica, V3 } from './lib/esqueleto.js';
import * as J from './lib/juice.js';
import { raio as fxRaio, fogo as fxFogo, cura as fxCura } from './lib/poderes.js';
import { E, q, clamp, lerp, hash, COR } from './lib/tokens.js';

const Q = new URLSearchParams(location.search);
const W = 1080, H = 1920, SS = Number(Q.get('ss') || 1), IW = W * SS, IH = H * SS;
const F = 'Titan, sans-serif';
const glc = document.createElement('canvas'); glc.width = IW; glc.height = IH;
const out = document.getElementById('c'); out.width = W; out.height = H; const ctx = out.getContext('2d');
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(IW, IH, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
U.uRes.value.set(IW, IH); U.uPx.value = SS;
const scene = new THREE.Scene();
const Tq = (n) => n / 60;

// ======================================================================================
// BEATS (quadros de MUNDO a 60). O tempo real = mundo + hit-stops já passados.
// ======================================================================================
const WB = {
  acorda: 24, levanta: 110, hud: 70,
  raio: { carga0: 150, solta: 214, impacto: 236 },
  soco: { ergue: 318, desce: 366, chao: 374, ina: 382 },
  cura: { carga0: 470, solta: 528, impacto: 556 },
  fogo: { carga0: 640, puxa: 690, solta: 712, impacto: 738 },
  ergue2: 820,
  gelo: { carga0: 830, puxa: 892, estende: 920, solta: 960, onda1: 986, impacto: 990, quebra: 1118 },
  respira: 1180, fim: 1560,
};
// hit-stops (em quadros reais): crítico com impact frame segura 13 q
const STOPS = [[WB.raio.impacto, 13, 'raio'], [WB.soco.ina, 7, 'soco'], [WB.cura.impacto, 3, 'cura'], [WB.fogo.impacto, 7, 'fogo'], [WB.gelo.impacto, 14, 'gelo'], [WB.gelo.quebra + 6, 5, 'quebra']];
const GOLPES = []; { let acc = 0; for (const [w, s, k] of STOPS) { GOLPES.push({ t: Tq(w) + acc, stop: s, k, w }); acc += Tq(s); } }
const G_ = Object.fromEntries(GOLPES.map((g) => [g.k, g]));
const DUR = Tq(WB.fim) + GOLPES.reduce((a, g) => a + Tq(g.stop), 0);

// ======================================================================================
// LUZ: entardecer. Sol baixo atrás-direita do Sentinela, névoa vinho, céu em domo (gira com a câmera).
// ======================================================================================
const SUN = V3(0.62, 0.15, -0.77).normalize();
const skyU = { uSun: { value: SUN }, uDim: { value: 0 }, uTop: { value: new THREE.Color('#0d1030') }, uMid: { value: new THREE.Color('#4a2350') }, uHor: { value: new THREE.Color('#ff8a4c') }, uLow: { value: new THREE.Color('#3a1e2c') }, uSol: { value: new THREE.Color('#ffb070') } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(80, 48, 24), new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vD; void main(){ vD = position; vec4 p = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*p; }`,
  fragmentShader: `uniform vec3 uSun, uTop, uMid, uHor, uLow, uSol; uniform float uDim; varying vec3 vD;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9,78.2)))*43758.5); }
    float n2(vec2 x){ vec2 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
    void main(){ vec3 d = normalize(vD); float y = d.y; float s = max(dot(d, uSun), 0.0);
      vec3 hor = mix(uHor*0.55, uHor, pow(s, 1.5));
      vec3 c = y > 0.0 ? mix(hor, uMid, smoothstep(0.0, 0.22, y)) : mix(hor, uLow, smoothstep(0.0, -0.08, y));
      c = mix(c, uTop, smoothstep(0.18, 0.7, y));
      float az = atan(d.z, d.x); float nb = n2(vec2(az*6.0, y*28.0)) * smoothstep(0.02, 0.1, y) * smoothstep(0.3, 0.12, y);
      c = mix(c, uMid*0.6 + uHor*0.25*pow(s,2.0), nb*0.55);
      c += uSol * pow(s, 10.0) * 0.8 + vec3(1.0,0.9,0.7) * pow(s, 400.0) * 3.0;
      c *= mix(1.0, 0.32, uDim);
      gl_FragColor = vec4(c, 1.0); }` }));
sky.frustumCulled = false; scene.add(sky);
scene.fog = new THREE.Fog('#5a3048', 7, 34);
const FOG0 = new THREE.Color('#5a3048');
const hemi = new THREE.HemisphereLight('#6d6fb0', '#2a1820', 0.95); scene.add(hemi);
const sol = new THREE.DirectionalLight('#ff9a5a', 3.4); sol.position.copy(SUN).multiplyScalar(14); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 }); sol.shadow.bias = -0.0005; sol.shadow.normalBias = 0.03; scene.add(sol); scene.add(sol.target);
const fill = new THREE.DirectionalLight('#6f8fff', 0.55); fill.position.set(-5, 3, 5); scene.add(fill);
const SOL0 = sol.intensity, HEMI0 = hemi.intensity, FILL0 = fill.intensity;
U.uRimCol.value.set('#ffb27a');

function ctoon(geo, cor, o = {}) { const m = new THREE.Mesh(geo, toon(cor, o)); m.castShadow = o.sombra ?? true; m.receiveShadow = true; if (o.ol !== 0) comContorno(m, o.ol ?? 4, o.olCor || '#1a0f18'); return m; }
// pedra cinzelada: caixa com vértices empurrados (hash pela posição → continua fechada), lida em faces chapadas
function pedraGeo(w, h, d, seed = 0, amp = 0.12, taper = 1) {
  const g = new THREE.BoxGeometry(w, h, d, 2, 2, 2); const p = g.attributes.position; const m = Math.min(w, h, d);
  for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = Math.round(x * 997) * 1.31 + Math.round(y * 991) * 7.7 + Math.round(z * 983) * 3.3 + seed * 17.1;
    const tp = lerp(taper, 1, (y + h / 2) / h); x *= tp; z *= lerp(1, tp, 0.5);
    p.setXYZ(i, x + (hash(k) - 0.5) * amp * m, y + (hash(k + 1) - 0.5) * amp * m, z + (hash(k + 2) - 0.5) * amp * m); }
  g.computeVertexNormals(); return g;
}
function rochaGeo(r, seed = 0, amp = 0.22) { const g = new THREE.DodecahedronGeometry(r, 1); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = V3(p.getX(i), p.getY(i), p.getZ(i)); const k = Math.round(v.x * 991) * 1.3 + Math.round(v.y * 997) * 7.1 + Math.round(v.z * 983) * 3.9 + seed * 11; v.multiplyScalar(1 + (hash(k) - 0.5) * amp); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g; }

// ======================================================================================
// ARENA: piso de lajes em círculo, colunas quebradas, arco ao fundo, tambores caídos, morros e torres na névoa
// ======================================================================================
const C0 = V3(0.2, 0, -0.1);
{ const S = 2048, M = 18, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  const u = (x) => S / 2 + (x - C0.x) / M * S, v = (z) => S / 2 + (z - C0.z) / M * S, px = S / M;
  g.fillStyle = '#3b2e2c'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2200; i++) { const x = hash(i) * S, y = hash(i + 1e3) * S, r = 6 + hash(i + 2e3) * 30; g.fillStyle = ['#463630', '#34402c', '#2f3a28', '#4a3b34'][i % 4]; g.globalAlpha = 0.5; g.beginPath(); g.ellipse(x, y, r * 1.5, r, hash(i + 5) * 3, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  // lajes: anéis concêntricos de pedras irregulares
  const R = 4.6; g.save(); g.translate(u(C0.x), v(C0.z));
  for (let ring = 0; ring < 9; ring++) { const r0 = ring * 0.52, r1 = r0 + 0.5; const n = Math.max(1, Math.round((ring + 0.5) * 6.4));
    for (let k = 0; k < n; k++) { const a0 = k / n * Math.PI * 2 + ring * 0.37, a1 = (k + 1) / n * Math.PI * 2 + ring * 0.37 - 0.03; const sd = ring * 100 + k;
      if (ring >= 7 && hash(sd + 9) < 0.35 + (ring - 7) * 0.25) continue; // borda quebrada
      const cor = ['#6e6372', '#786c7a', '#655a69', '#7d7280', '#5f5563'][Math.floor(hash(sd) * 5)];
      g.fillStyle = cor; g.strokeStyle = '#231b24'; g.lineWidth = 5; g.beginPath();
      const ri = r0 * px + 3, ro = r1 * px - 3; g.arc(0, 0, ro, a0, a1); g.arc(0, 0, Math.max(0, ri), a1, a0, true); g.closePath(); g.fill(); g.stroke();
      if (hash(sd + 3) < 0.3) { g.strokeStyle = 'rgba(25,18,26,0.7)'; g.lineWidth = 2.5; const am = (a0 + a1) / 2, rm = (ri + ro) / 2; g.beginPath(); g.moveTo(Math.cos(am) * rm, Math.sin(am) * rm); g.lineTo(Math.cos(am + 0.08) * (rm + 18), Math.sin(am + 0.08) * (rm + 18)); g.lineTo(Math.cos(am - 0.02) * (rm + 34), Math.sin(am - 0.02) * (rm + 34)); g.stroke(); }
      if (hash(sd + 4) < 0.25 && ring > 3) { g.fillStyle = 'rgba(70,98,50,0.55)'; g.beginPath(); g.ellipse(Math.cos(a1) * ro, Math.sin(a1) * ro, 26, 12, a1, 0, 7); g.fill(); } } }
  // círculo de runas gravado no centro
  g.strokeStyle = 'rgba(30,20,32,0.8)'; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, 2.05 * px, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 1.85 * px, 0, 7); g.stroke();
  for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; g.save(); g.rotate(a); g.translate(1.95 * px, 0); g.lineWidth = 4; g.beginPath(); g.moveTo(-8, -10); g.lineTo(8, 0); g.lineTo(-8, 10); if (k % 2) { g.moveTo(0, -10); g.lineTo(0, 10); } g.stroke(); g.restore(); }
  g.restore();
  for (let i = 0; i < 240; i++) { g.fillStyle = 'rgba(20,14,20,0.35)'; g.beginPath(); g.arc(hash(i + 50) * S, hash(i + 80) * S, 2 + hash(i) * 5, 0, 7); g.fill(); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(M, M), new THREE.MeshLambertMaterial({ map: tx })); chao.rotation.x = -Math.PI / 2; chao.position.copy(C0); chao.receiveShadow = true; scene.add(chao);
  const longe = new THREE.Mesh(new THREE.CircleGeometry(70, 48), new THREE.MeshLambertMaterial({ color: '#2a2224' })); longe.rotation.x = -Math.PI / 2; longe.position.y = -0.01; scene.add(longe);
}
const PEDRA = '#a69aa6', PEDRA2 = '#857a88';
function coluna(x, z, h, quebrada, sd) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = hash(sd) * 3;
  const base = ctoon(pedraGeo(0.78, 0.22, 0.78, sd, 0.06), PEDRA2, { flat: true }); base.position.y = 0.11; g.add(base);
  let y = 0.22; const nd = Math.ceil(h / 0.55);
  for (let i = 0; i < nd; i++) { const dh = Math.min(0.55, h - (y - 0.22)); if (dh < 0.12) break; const geo = new THREE.CylinderGeometry(0.27, 0.29, dh, 12, 2);
    if (quebrada && i === nd - 1) { const p = geo.attributes.position; for (let k = 0; k < p.count; k++) if (p.getY(k) > 0) p.setY(k, p.getY(k) - hash(k + sd) * dh * 0.7); geo.computeVertexNormals(); }
    const d = ctoon(geo, i % 2 ? PEDRA : '#9a8e9c', { flat: true }); d.position.set((hash(sd + i) - 0.5) * 0.04, y + dh / 2, (hash(sd + i + 7) - 0.5) * 0.04); d.rotation.y = hash(i + sd) * 2; g.add(d); y += dh; }
  if (!quebrada) { const cap = ctoon(pedraGeo(0.74, 0.2, 0.74, sd + 3, 0.06), PEDRA2, { flat: true }); cap.position.y = y + 0.1; g.add(cap); }
  scene.add(g); return g;
}
const COLS = [[-5.9, -4.9, 3.4, 0], [5.8, 2.2, 1.4, 1], [6.0, -2.0, 3.6, 0], [-1.6, -6.0, 2.2, 1], [2.4, -6.2, 3.8, 0], [-7.4, 2.8, 1.0, 1], [-5.0, 5.2, 2.8, 1], [3.4, 5.6, 2.1, 1], [-0.6, 6.4, 3.6, 0]];
COLS.forEach(([x, z, h, qb], i) => coluna(x, z, h, !!qb, i * 13 + 2));
window.OBST = COLS.map(([x, z, h], i) => [x, z, 0.45, h + 0.4, 'col' + i]);
{ // arco ao fundo, atrás do Sentinela
  const ax = 6.4, az = -4.6; const g = new THREE.Group(); g.position.set(ax, 0, az); g.rotation.y = -0.9;
  for (const s of [-1, 1]) { const p = ctoon(pedraGeo(0.6, 3.4, 0.6, s + 40, 0.05), PEDRA2, { flat: true }); p.position.set(s * 1.1, 1.7, 0); g.add(p); }
  const l = ctoon(pedraGeo(3.0, 0.5, 0.7, 44, 0.08), PEDRA, { flat: true }); l.position.set(-0.2, 3.62, 0); l.rotation.z = -0.06; g.add(l);
  scene.add(g);
}
for (let i = 0; i < 6; i++) { if (i === 2) continue; // tambores caídos e entulho
  const a = 1.1 + i * 1.07, r = 4.8 + hash(i + 3) * 0.9; const d = ctoon(new THREE.CylinderGeometry(0.26, 0.27, 0.5, 12), PEDRA, { flat: true });
  d.position.set(C0.x + Math.cos(a) * r, 0.26, C0.z + Math.sin(a) * r); d.rotation.set(Math.PI / 2, 0, hash(i) * 3); scene.add(d); window.OBST.push([d.position.x, d.position.z, 0.3, 0.55, 'tambor' + i]); }
for (let i = 0; i < 26; i++) { const a = hash(i + 60) * 6.28, r = 2.6 + hash(i + 61) * 2.4; const s = 0.08 + hash(i + 62) * 0.2;
  const b = ctoon(pedraGeo(s * 1.4, s, s * 1.2, i + 70, 0.25), i % 3 ? PEDRA2 : PEDRA, { flat: true, ol: 3 }); b.position.set(C0.x + Math.cos(a) * r, s * 0.4, C0.z + Math.sin(a) * r); b.rotation.set(hash(i) * 0.4, hash(i + 1) * 6, hash(i + 2) * 0.4); scene.add(b); }
function arvore(x, z, h, cor, ol) { const g = new THREE.Group(); g.position.set(x, 0, z);
  for (let k = 0; k < 3; k++) { const r = (0.85 - k * 0.2) * h / 3.2, hh = h * (0.5 - k * 0.08); const c = ctoon(new THREE.ConeGeometry(r, hh, 8), cor, { ol, flat: true }); c.position.y = 0.45 + h * (0.22 + k * 0.2); g.add(c); }
  const tk = ctoon(new THREE.CylinderGeometry(0.07, 0.11, 0.6, 6), '#3a2420', { ol: Math.min(ol, 3) }); tk.position.y = 0.3; g.add(tk); scene.add(g); }
for (let i = 0; i < 22; i++) { const a = i / 22 * 6.28 + hash(i) * 0.2, r = 11 + hash(i + 3) * 3; arvore(C0.x + Math.cos(a) * r, C0.z + Math.sin(a) * r, 2.6 + hash(i + 7) * 2.2, ['#2b3c3c', '#25363a', '#30403a'][i % 3], 4); }
for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28 + 0.3, r = 17 + hash(i) * 6; const t = ctoon(pedraGeo(1.4, 5 + hash(i + 1) * 5, 1.4, i + 90, 0.2, 0.8), '#5a4660', { flat: true, ol: 0 }); t.position.set(C0.x + Math.cos(a) * r, 2.5, C0.z + Math.sin(a) * r); scene.add(t); }
for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28, r = 32 + hash(i + 5) * 6; const m = ctoon(new THREE.ConeGeometry(7 + hash(i) * 5, 5 + hash(i + 1) * 5, 7), '#4a3050', { ol: 0, flat: true }); m.position.set(Math.cos(a) * r, 1.5, Math.sin(a) * r); scene.add(m); }
{ // tufos de capim balançando nas frestas (fora do miolo da luta)
  const geo = new THREE.ConeGeometry(0.025, 0.16, 4).translate(0, 0.08, 0); const m = new THREE.InstancedMesh(geo, toon('#5d7a3c', { rim: 0.4, vento: 0.06 }), 260); const o = new THREE.Object3D();
  for (let i = 0; i < 260; i++) { const a = hash(i + 300) * 6.28, r = 2.3 + hash(i + 400) * 3.2; o.position.set(C0.x + Math.cos(a) * r, 0, C0.z + Math.sin(a) * r);
    o.rotation.set((hash(i) - 0.5) * 0.5, hash(i + 1) * 3, (hash(i + 2) - 0.5) * 0.5); o.scale.setScalar(0.7 + hash(i + 3) * 0.9); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }
  m.receiveShadow = true; scene.add(m);
}
// estandarte rasgado num mastro (pano vivo o tempo todo)
const MASTRO = V3(4.4, 0, -3.6); window.OBST.push([4.4, -3.6, 0.1, 3.5, 'mastro']);
{ const m = ctoon(new THREE.CylinderGeometry(0.03, 0.035, 3.2, 6), '#3a2620', { ol: 2.5 }); m.position.copy(MASTRO).setY(1.6); scene.add(m); }
const panoGeo = new THREE.PlaneGeometry(0.62, 1.5, 8, 14); panoGeo.translate(0.31, -0.75, 0); const panoP0 = panoGeo.attributes.position.array.slice();
const pano = new THREE.Mesh(panoGeo, toon('#7c2232', { side: THREE.DoubleSide, flat: false })); pano.position.copy(MASTRO).setY(3.1); pano.rotation.y = 0.6; pano.castShadow = true; scene.add(pano);
function panoAnim(tw) { const p = panoGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = panoP0[i * 3], y = panoP0[i * 3 + 1]; const k = x / 0.62;
    let z = Math.sin(tw * 3.1 - x * 7 + y * 1.5) * 0.09 * k + Math.sin(tw * 5.3 - x * 11) * 0.03 * k; let yy = y; if (y < -1.2 && hash(Math.floor(x * 20)) < 0.5) yy = -1.2 - (y + 1.2) * 0.3; // franja rasgada
    p.setXYZ(i, x, yy + Math.sin(tw * 2 - x * 4) * 0.02 * k, z); } p.needsUpdate = true; panoGeo.computeVertexNormals(); }

// ======================================================================================
// INA (gorro = cabeça coberta) e SENTINELA (golem de pedra cinzelada, olho em fenda)
// ======================================================================================
const A0 = V3(-0.9, 0, 0.3), GP = V3(1.3, 0, -0.45);
const DIR = GP.clone().sub(A0).setY(0).normalize(), PERP = V3(-DIR.z, 0, DIR.x); // PERP = lado direito da câmera atrás da Ina
const A1 = A0.clone().addScaledVector(DIR, -0.5);
const ina = criarIna(); scene.add(ina);
const inaMats = []; ina.traverse((o) => { if (o.material && o.material.isMeshToonMaterial && !inaMats.includes(o.material)) inaMats.push(o.material); });
const OLHO = '#ff3d6a';
const golem = (() => {
  const root = new THREE.Group(); root.position.copy(GP); root.rotation.y = Math.atan2(-DIR.x, -DIR.z); scene.add(root);
  const mP = toon('#8f8496', { flat: true }), mE = toon('#62576b', { flat: true }), mM = toon('#4d7438', { flat: true });
  const parts = [];
  const peca = (pai, geo, mat, pos, rot) => { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); if (rot) m.rotation.set(...rot); m.castShadow = m.receiveShadow = true; comContorno(m, 4.5, '#140c14'); pai.add(m); parts.push(m); return m; };
  const j = (pai, pos) => { const g = new THREE.Group(); g.position.set(...pos); pai.add(g); return g; };
  const corpo = j(root, [0, 0, 0]);
  const quadril = j(corpo, [0, 0.66, 0]);
  peca(quadril, pedraGeo(0.72, 0.26, 0.48, 1), mE, [0, 0.02, 0]);
  const pernas = {}; for (const s of [-1, 1]) { const hp = j(quadril, [s * 0.27, -0.04, 0]); peca(hp, pedraGeo(0.32, 0.34, 0.34, 2 + s), mP, [0, -0.17, 0]); peca(hp, pedraGeo(0.38, 0.3, 0.5, 4 + s, 0.1), mE, [0, -0.47, 0.05]); pernas[s] = hp; }
  const tronco = j(quadril, [0, 0.1, 0]);
  peca(tronco, pedraGeo(0.66, 0.3, 0.46, 6), mE, [0, 0.12, 0]);
  const peito = j(tronco, [0, 0.28, 0]);
  peca(peito, pedraGeo(1.1, 0.74, 0.7, 7, 0.1, 0.72), mP, [0, 0.38, 0]);
  peca(peito, rochaGeo(0.2, 8), mE, [0.18, 0.62, -0.32]); peca(peito, rochaGeo(0.16, 9), mP, [-0.25, 0.5, -0.33]);
  const runaMat = new THREE.MeshBasicMaterial({ color: OLHO, fog: false });
  const runas = [[0, 0.42, 0.012, 0.32, 0], [-0.1, 0.5, 0.012, 0.16, 0.8], [0.1, 0.5, 0.012, 0.16, -0.8], [0, 0.22, 0.012, 0.1, 1.57]];
  const runaGrp = j(peito, [0, 0, 0.352]); runas.forEach(([x, y, w, h, r]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w * 2.2, h, 0.01), runaMat); m.position.set(x, y, 0); m.rotation.z = r; runaGrp.add(m); });
  const cab = j(peito, [0, 0.72, 0.12]);
  peca(cab, pedraGeo(0.38, 0.32, 0.38, 11, 0.12), mP, [0, 0.14, 0]);
  peca(cab, pedraGeo(0.44, 0.08, 0.2, 12, 0.15), mE, [0, 0.22, 0.12]); // sobrancelha de pedra
  peca(cab, rochaGeo(0.17, 13), mM, [0.02, 0.3, -0.04]).scale.set(1.2, 0.35, 1.1);
  const olho = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: OLHO, fog: false })); olho.position.set(0, 0.13, 0.195); cab.add(olho);
  const luzOlho = new THREE.PointLight(OLHO, 0, 2.6, 2); luzOlho.position.set(0, 0.13, 0.4); cab.add(luzOlho);
  const bracos = {};
  for (const s of [-1, 1]) {
    const om = j(peito, [s * 0.66, 0.6, 0]);
    peca(om, rochaGeo(0.3, 20 + s), mP, [s * 0.06, 0.1, 0]); peca(om, rochaGeo(0.2, 22 + s), mM, [s * 0.06, 0.3, 0]).scale.set(1.2, 0.35, 1.2);
    peca(om, pedraGeo(0.26, 0.44, 0.26, 24 + s), mE, [0, -0.25, 0]);
    const cot = j(om, [0, -0.5, 0]); peca(cot, pedraGeo(0.3, 0.42, 0.3, 26 + s), mP, [0, -0.2, 0]);
    const pu = j(cot, [0, -0.44, 0]); peca(pu, pedraGeo(0.44, 0.38, 0.44, 28 + s, 0.16), mE, [0, -0.15, 0.02]);
    bracos[s] = { om, cot, pu };
  }
  return { root, corpo, quadril, tronco, peito, cab, bracos, pernas, parts, mats: [mP, mE, mM], olho, luzOlho, runaMat, runaGrp };
})();
const GMATS0 = golem.mats.map((m) => m.color.clone());

// ======================================================================================
// PODERES (biblioteca do kit) com beats próprios
// ======================================================================================
const FX = { raio: fxRaio(scene), fogo: fxFogo(scene), cura: fxCura(scene) };
const B = { raio: WB.raio, fogo: WB.fogo, cura: WB.cura };

// ---------- GELO (reescrito: núcleo claro, borda saturada, contorno escuro; cena escura em volta) ----------
const gUni = { uT: { value: 0 }, uBrilho: { value: 1 }, uDeep: { value: new THREE.Color('#031040') }, uSat: { value: new THREE.Color('#0a6dff') }, uCore: { value: new THREE.Color('#e8fbff') }, uEdge: { value: new THREE.Color('#38d6ff') } };
function matGelo() { return new THREE.ShaderMaterial({ uniforms: gUni,
  vertexShader: `varying vec3 vV; varying vec3 vW; varying vec3 vL;
void main(){ vec4 p = vec4(position, 1.0); vL = position;
#ifdef USE_INSTANCING
  p = instanceMatrix * p;
#endif
  vec4 w = modelMatrix * p; vW = w.xyz; vec4 mv = viewMatrix * w; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform vec3 uDeep, uSat, uCore, uEdge; uniform float uBrilho, uT; varying vec3 vV; varying vec3 vW; varying vec3 vL;
    void main(){ vec3 n = normalize(cross(dFdx(vV), dFdy(vV))); vec3 v = normalize(vV);
      float face = abs(dot(n, v)); float f = clamp(0.5 + 0.55*n.x + 0.5*n.y, 0.0, 1.0);
      vec3 c = mix(uDeep, uSat, smoothstep(0.05, 0.6, f));                 // faceta: azul fundo → azul saturado
      float eixo = 1.0 - clamp(length(vL.xz) / 0.12, 0.0, 1.0);             // perto do eixo do cristal = núcleo
      float core = pow(face, 2.2) * (0.35 + 0.65*eixo) * smoothstep(0.0, 0.5, vL.y + 0.1);
      c = mix(c, uCore, clamp(core, 0.0, 1.0) * 0.9);                       // núcleo claro visto por dentro
      c += uEdge * pow(1.0 - face, 2.5) * 1.1;                              // borda saturada acesa
      c = mix(c, uCore, smoothstep(0.86, 0.97, f) * 0.75);                  // faceta que pega luz
      float br = smoothstep(0.93, 1.0, sin(vW.y * 8.0 - uT * 5.0 + vW.x * 3.0)); c += uCore * br * 0.3 * face;
      gl_FragColor = vec4(c * uBrilho, 1.0);
      #include <colorspace_fragment>
    }` }); }
const MGELO = matGelo();
const geoCristal = new THREE.OctahedronGeometry(1, 0); geoCristal.scale(0.12, 0.55, 0.12); geoCristal.translate(0, 0.42, 0);
const CR = [];
const GX0 = A1.clone().addScaledVector(DIR, 0.45), GX1 = GP.clone().addScaledVector(DIR, -0.62);
{ const NC = 14; for (let i = 0; i < NC; i++) { const u = i / (NC - 1), p = GX0.clone().lerp(GX1, u), tam = 0.4 + 0.9 * u ** 1.3, t0 = WB.gelo.solta + 3 + u * (WB.gelo.onda1 - WB.gelo.solta - 3);
    CR.push({ p: p.clone().addScaledVector(PERP, (hash(i) - 0.5) * 0.1), s: tam, inc: [(hash(i + 1) - 0.5) * 0.4, hash(i + 2) * 6, 0], t0, u });
    for (const l of [-1, 1]) CR.push({ p: p.clone().addScaledVector(PERP, l * (0.16 + 0.1 * u)), s: tam * (0.45 + 0.2 * hash(i + l)), inc: [0, hash(i + 3) * 6, l * 0.5], t0: t0 + 2, u }); }
  for (let k = 0; k < 11; k++) { const a = k / 11 * Math.PI * 2, r = 0.62 + 0.12 * hash(k + 4); const p = GP.clone().add(V3(Math.cos(a) * r, 0, Math.sin(a) * r)); const out = V3(Math.cos(a), 0, Math.sin(a));
    CR.push({ p, s: 1.7 + 0.8 * hash(k + 70), inc: null, out, t0: WB.gelo.impacto + (k % 3), u: 1, fin: true }); } }
const imCr = new THREE.InstancedMesh(geoCristal, MGELO, CR.length); imCr.frustumCulled = false; scene.add(imCr); comContorno(imCr, 3.5, '#06103a');
const NCACO = 300; const imCaco = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.06, 0), MGELO, NCACO); imCaco.frustumCulled = false; scene.add(imCaco);
const imGeada = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 18).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#cdeeff', transparent: true, opacity: 0.5, depthWrite: false }), CR.length); imGeada.frustumCulled = false; scene.add(imGeada);
// partículas aditivas (carga, faíscas, neve, poeira)
const NP = 420; const imP = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.012, 1), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), NP); imP.frustumCulled = false; scene.add(imP);
imP.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NP * 3), 3);
// poeira pesada (não aditiva): nuvens de pó do soco e da queda
const NPO = 40; const imPo = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshLambertMaterial({ color: '#8a7470', transparent: true, opacity: 0.5, depthWrite: false }), NPO); imPo.frustumCulled = false; scene.add(imPo);
// onda de terra do soco: pontas de pedra rompendo o chão até a Ina
const SOCO_P = V3(); // ponto do soco no chão (calculado da pose)
const ES = []; for (let i = 0; i < 12; i++) ES.push({ u: i / 11, s: 0.75 - 0.35 * (i / 11), lado: (i % 2 ? 1 : -1) * (0.05 + 0.1 * hash(i)), inc: [(hash(i) - 0.5) * 0.6, hash(i + 1) * 6, (hash(i + 2) - 0.5) * 0.6] });
const imEs = new THREE.InstancedMesh(geoCristal, toon('#7d7180', { flat: true }), ES.length); imEs.frustumCulled = false; imEs.castShadow = true; scene.add(imEs); comContorno(imEs, 3.5, '#140c14');
const NENT = 50; const imEnt = new THREE.InstancedMesh(pedraGeo(0.1, 0.08, 0.09, 3, 0.3), toon('#7a6e7d', { flat: true }), NENT); imEnt.frustumCulled = false; scene.add(imEnt);
const anelMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const anel = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 8, 64), anelMat); scene.add(anel);
const anelChao = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.42, 64), anelMat.clone()); anelChao.rotation.x = -Math.PI / 2; scene.add(anelChao);
const luzMao = new THREE.PointLight('#bfe8ff', 0, 1.8, 2); scene.add(luzMao);
const luzImp = new THREE.PointLight('#8fe0ff', 0, 6, 1.4); scene.add(luzImp);
const smearG = J.criarSmear('#ffd9b0', 14); scene.add(smearG);
const smearI = J.criarSmear('#ffffff', 12); scene.add(smearI);

// ======================================================================================
// POSES DA INA (keys em quadros de mundo). Corpo antecipa → golpeia → segue; braços e cabeça chegam atrasados.
// ======================================================================================
const PES0 = { L: { x: 0.1, z: 0.12, yaw: 10, pitch: 0 }, R: { x: -0.1, z: -0.12, yaw: -15, pitch: 0 } };
const PESL = { L: { x: 0.13, z: 0.2, yaw: 10, pitch: 0 }, R: { x: -0.13, z: -0.2, yaw: -18, pitch: 18, pivo: 'ponta' } };
const RO = (o) => ({ olho: 1, olharX: 0, olharY: 0, sobr: -0.01, sobrInc: -0.15, boca: 'sorriso', bocaAbre: 0.2, ...o });
const P_ = (o) => ({ yaw: 104, pelve: { y: 0.5, pitch: 4, roll: 0, yaw: 0, dz: 0 }, tronco: { pitch: 6, yaw: -6, roll: 0 }, cab: { pitch: -2, yaw: 6, roll: 0 }, pes: PES0,
  maos: { L: [0.1, -0.2, 0.12], R: [-0.08, -0.2, 0.14] }, polos: { L: [0.5, -0.3, -1], R: [-0.5, -0.3, -1] }, rosto: RO({ sobr: -0.02, sobrInc: -0.25, boca: 'O', bocaAbre: 0.05 }), ...o });
const S = {
  pronta: P_({}),
  respPronta: P_({ pelve: { y: 0.49, pitch: 6, roll: 2, yaw: 0, dz: 0 }, maos: { L: [0.12, -0.22, 0.1], R: [-0.06, -0.18, 0.16] } }),
  raioPuxa: P_({ pelve: { y: 0.44, pitch: 10, roll: -3, yaw: 18, dz: -0.04 }, tronco: { pitch: 14, yaw: 26, roll: -4 }, cab: { pitch: 16, yaw: -14, roll: 0 }, pes: PESL,
    maos: { L: [0.12, -0.24, 0.12], R: [-0.06, -0.3, -0.12] }, polos: { L: [0.5, -0.3, -1], R: [-0.6, -0.4, 0.4] }, rosto: RO({ olho: 0.55, sobr: -0.03, sobrInc: -0.35, boca: 'O', bocaAbre: 0.1 }) }),
  raioErgue: P_({ pelve: { y: 0.54, pitch: -6, roll: 3, yaw: -4, dz: 0.02 }, tronco: { pitch: -14, yaw: -6, roll: 6 }, cab: { pitch: -28, yaw: 4, roll: 0 }, pes: PESL,
    maos: { L: [0.1, -0.12, 0.22], R: [0.0, 0.34, 0.06] }, polos: { L: [0.6, -0.4, -0.6], R: [-1, 0.2, -0.2] }, rosto: RO({ olho: 0.85, olharY: 0.9, sobr: -0.02, sobrInc: -0.3, boca: 'O', bocaAbre: 0.35 }) }),
  raioAponta: P_({ pelve: { y: 0.46, pitch: 12, roll: 2, yaw: -10, dz: 0.08 }, tronco: { pitch: 16, yaw: -24, roll: 3 }, cab: { pitch: 0, yaw: 12, roll: 0 }, pes: { L: { x: 0.13, z: 0.24, yaw: 8, pitch: 0 }, R: { x: -0.13, z: -0.24, yaw: -18, pitch: 24, pivo: 'ponta' } },
    maos: { L: [0.18, -0.2, -0.14], R: [-0.02, 0.04, 0.35] }, polos: { L: [0.5, -0.2, -1], R: [-0.5, -0.6, -0.4] }, rosto: RO({ olho: 0.6, sobr: -0.03, sobrInc: -0.38, boca: 'O', bocaAbre: 0.4 }) }),
  recuo: P_({ pelve: { y: 0.5, pitch: -6, roll: 0, yaw: 4, dz: -0.06 }, tronco: { pitch: -10, yaw: -8, roll: 0 }, cab: { pitch: -6, yaw: 16, roll: 0 }, pes: PESL,
    maos: { L: [0.18, -0.16, -0.1], R: [-0.04, 0.0, 0.3] }, rosto: RO({ olho: 1.1, sobr: 0.01, sobrInc: 0.1, boca: 'O', bocaAbre: 0.35 }) }),
  guarda: P_({ pelve: { y: 0.46, pitch: 10, roll: 0, yaw: 0, dz: -0.02 }, tronco: { pitch: 14, yaw: 0, roll: 0 }, cab: { pitch: 10, yaw: 0, roll: 0 }, pes: PESL,
    maos: { L: [-0.08, 0.08, 0.2], R: [0.08, 0.1, 0.19] }, polos: { L: [1, -0.6, 0], R: [-1, -0.6, 0] }, rosto: RO({ olho: 0.4, sobr: -0.02, sobrInc: 0.2, boca: 'O', bocaAbre: 0.25 }) }),
  hit: P_({ pelve: { y: 0.52, pitch: -18, roll: 6, yaw: 8, dz: -0.1 }, tronco: { pitch: -26, yaw: 12, roll: 8 }, cab: { pitch: -24, yaw: -10, roll: 12 }, pes: { L: { x: 0.14, z: 0.18, yaw: 10, pitch: -20 }, R: { x: -0.12, z: -0.22, yaw: -18, pitch: 26, pivo: 'ponta' } },
    maos: { L: [0.22, 0.12, 0.1], R: [-0.24, 0.16, 0.06] }, polos: { L: [1, 0, -0.4], R: [-1, 0, -0.4] }, rosto: RO({ olho: 0.15, sobr: 0.02, sobrInc: 0.3, boca: 'O', bocaAbre: 0.6 }) }),
  caida: P_({ pelve: { y: 0.34, pitch: 22, roll: -4, yaw: 0, dz: 0.02 }, tronco: { pitch: 34, yaw: 6, roll: -4 }, cab: { pitch: 10, yaw: 6, roll: 6 }, pes: { L: { x: 0.14, z: 0.24, yaw: 14, pitch: 0 }, R: { x: -0.14, z: -0.16, yaw: -10, pitch: 30, pivo: 'ponta' } },
    maos: { L: [0.04, -0.3, 0.16], R: [-0.06, -0.14, 0.2] }, polos: { L: [0.6, -0.2, -0.6], R: [-0.6, -0.6, -0.2] }, rosto: RO({ olho: 0.55, sobr: 0.015, sobrInc: 0.25, boca: 'O', bocaAbre: 0.3 }) }),
  curaIni: P_({ pelve: { y: 0.38, pitch: 18, roll: 0, yaw: 0, dz: 0 }, tronco: { pitch: 22, yaw: 0, roll: 0 }, cab: { pitch: 18, yaw: 0, roll: 0 }, pes: { L: { x: 0.14, z: 0.2, yaw: 14, pitch: 0 }, R: { x: -0.14, z: -0.14, yaw: -10, pitch: 24, pivo: 'ponta' } },
    maos: { L: [-0.1, -0.06, 0.17], R: [0.1, -0.06, 0.17] }, polos: { L: [1, -0.6, 0], R: [-1, -0.6, 0] }, rosto: RO({ olho: 0.1, sobr: 0.0, sobrInc: 0.1, boca: 'O', bocaAbre: 0.05 }) }),
  cura: P_({ pelve: { y: 0.53, pitch: -4, roll: 0, yaw: 0, dz: 0 }, tronco: { pitch: -10, yaw: 0, roll: 0 }, cab: { pitch: -22, yaw: 0, roll: 0 }, pes: PES0,
    maos: { L: [0.22, 0.2, 0.12], R: [-0.22, 0.2, 0.12] }, polos: { L: [1, -0.4, 0], R: [-1, -0.4, 0] }, rosto: RO({ olho: 0.6, olharY: 1, sobr: 0.012, sobrInc: 0.12, boca: 'sorriso', bocaAbre: 0.25 }) }),
  fogoCarga: P_({ pelve: { y: 0.47, pitch: 8, roll: 0, yaw: 22, dz: 0 }, tronco: { pitch: 10, yaw: 26, roll: 0 }, cab: { pitch: 6, yaw: -30, roll: 0 }, pes: PESL,
    maos: { L: [-0.1, -0.16, 0.16], R: [0.0, -0.2, 0.1] }, polos: { L: [0.8, -0.6, 0], R: [-0.6, -0.6, -0.4] }, rosto: RO({ olho: 0.7, sobr: -0.03, sobrInc: -0.35, boca: 'O', bocaAbre: 0.1 }) }),
  fogoPuxa: P_({ pelve: { y: 0.46, pitch: 2, roll: -4, yaw: 26, dz: -0.06 }, tronco: { pitch: -4, yaw: 46, roll: -8 }, cab: { pitch: 0, yaw: -44, roll: 0 }, pes: PESL,
    maos: { L: [0.04, -0.02, 0.32], R: [-0.12, 0.08, -0.27] }, polos: { L: [0.5, -0.4, -1], R: [-0.4, -0.8, 0.2] }, rosto: RO({ olho: 0.6, sobr: -0.03, sobrInc: -0.4, boca: 'O', bocaAbre: 0.15 }) }),
  fogoSolta: P_({ pelve: { y: 0.45, pitch: 14, roll: 4, yaw: -16, dz: 0.09 }, tronco: { pitch: 16, yaw: -36, roll: 6 }, cab: { pitch: 2, yaw: 24, roll: 0 }, pes: { L: { x: 0.13, z: 0.26, yaw: 8, pitch: 0 }, R: { x: -0.13, z: -0.24, yaw: -18, pitch: 28, pivo: 'ponta' } },
    maos: { L: [0.18, -0.22, -0.14], R: [0.02, 0.04, 0.35] }, polos: { L: [0.5, -0.2, -1], R: [-0.5, -0.6, -0.4] }, rosto: RO({ olho: 0.5, sobr: -0.03, sobrInc: -0.4, boca: 'O', bocaAbre: 0.55 }) }),
  fogoSegue: P_({ pelve: { y: 0.45, pitch: 18, roll: 4, yaw: -24, dz: 0.1 }, tronco: { pitch: 24, yaw: -50, roll: 8 }, cab: { pitch: -2, yaw: 34, roll: 0 }, pes: { L: { x: 0.13, z: 0.26, yaw: 8, pitch: 0 }, R: { x: -0.13, z: -0.24, yaw: -18, pitch: 30, pivo: 'ponta' } },
    maos: { L: [0.2, -0.24, -0.16], R: [0.22, -0.22, 0.18] }, polos: { L: [0.5, -0.2, -1], R: [-0.3, -0.9, 0.2] }, rosto: RO({ olho: 0.8, sobr: -0.02, sobrInc: -0.3, boca: 'O', bocaAbre: 0.3 }) }),
  geloJunta: P_({ pelve: { y: 0.45, pitch: 10, roll: 0, yaw: 0, dz: -0.02 }, tronco: { pitch: 12, yaw: 4, roll: 0 }, cab: { pitch: 16, yaw: 0, roll: 0 }, pes: { L: { x: 0.16, z: 0.16, yaw: 14, pitch: 0 }, R: { x: -0.16, z: -0.16, yaw: -16, pitch: 0 } },
    maos: { L: [-0.09, -0.08, 0.17], R: [0.09, -0.08, 0.17] }, polos: { L: [1, -0.5, 0], R: [-1, -0.5, 0] }, rosto: RO({ olho: 0.08, sobr: -0.03, sobrInc: -0.3, boca: 'O', bocaAbre: 0.02 }) }),
  geloPuxa: P_({ pelve: { y: 0.43, pitch: 2, roll: -3, yaw: 16, dz: -0.08 }, tronco: { pitch: -6, yaw: 30, roll: -4 }, cab: { pitch: 2, yaw: -22, roll: 0 }, pes: { L: { x: 0.15, z: 0.22, yaw: 12, pitch: 0 }, R: { x: -0.15, z: -0.22, yaw: -22, pitch: 0 } },
    maos: { L: [0.12, -0.04, -0.12], R: [-0.14, -0.06, -0.14] }, polos: { L: [0.6, -0.6, 0.4], R: [-0.6, -0.6, 0.4] }, rosto: RO({ olho: 0.7, sobr: -0.03, sobrInc: -0.4, boca: 'O', bocaAbre: 0.1 }) }),
  geloSolta: P_({ pelve: { y: 0.42, pitch: 16, roll: 0, yaw: -6, dz: 0.1 }, tronco: { pitch: 22, yaw: -10, roll: 0 }, cab: { pitch: 2, yaw: 6, roll: 0 }, pes: { L: { x: 0.15, z: 0.26, yaw: 10, pitch: 0 }, R: { x: -0.15, z: -0.26, yaw: -20, pitch: 26, pivo: 'ponta' } },
    maos: { L: [-0.05, -0.04, 0.34], R: [0.05, -0.04, 0.34] }, polos: { L: [0.8, -0.6, -0.2], R: [-0.8, -0.6, -0.2] }, rosto: RO({ olho: 0.55, sobr: -0.035, sobrInc: -0.45, boca: 'O', bocaAbre: 0.6 }) }),
  geloSegura: P_({ pelve: { y: 0.43, pitch: 14, roll: 2, yaw: -4, dz: 0.09 }, tronco: { pitch: 18, yaw: -8, roll: 2 }, cab: { pitch: 6, yaw: 6, roll: -3 }, pes: { L: { x: 0.15, z: 0.26, yaw: 10, pitch: 0 }, R: { x: -0.15, z: -0.26, yaw: -20, pitch: 26, pivo: 'ponta' } },
    maos: { L: [-0.04, -0.08, 0.32], R: [0.04, -0.06, 0.33] }, polos: { L: [0.8, -0.6, -0.2], R: [-0.8, -0.6, -0.2] }, rosto: RO({ olho: 0.45, sobr: -0.035, sobrInc: -0.42, boca: 'O', bocaAbre: 0.15 }) }),
  respira: P_({ pelve: { y: 0.45, pitch: 18, roll: 0, yaw: 0, dz: 0 }, tronco: { pitch: 34, yaw: 0, roll: 0 }, cab: { pitch: -18, yaw: 0, roll: 0 }, pes: { L: { x: 0.14, z: 0.1, yaw: 12, pitch: 0 }, R: { x: -0.14, z: -0.1, yaw: -12, pitch: 0 } },
    maos: { L: [0.02, -0.3, 0.16], R: [-0.02, -0.3, 0.16] }, polos: { L: [0.5, -0.4, -0.8], R: [-0.5, -0.4, -0.8] }, rosto: RO({ olho: 0.7, olharY: 0.4, sobr: 0.01, sobrInc: 0.15, boca: 'O', bocaAbre: 0.4 }) }),
  fim: P_({ yaw: 96, pelve: { y: 0.53, pitch: 0, roll: 2, yaw: 0, dz: 0 }, tronco: { pitch: 2, yaw: 8, roll: 0 }, cab: { pitch: 6, yaw: 10, roll: -4 }, pes: { L: { x: 0.1, z: 0.06, yaw: 8, pitch: 0 }, R: { x: -0.1, z: -0.06, yaw: -8, pitch: 0 } },
    maos: { L: [0.1, -0.3, 0.02], R: [-0.08, -0.29, 0.04] }, polos: { L: [0.4, -0.2, -1], R: [-0.4, -0.2, -1] }, rosto: RO({ olho: 1.0, sobr: 0.0, sobrInc: 0.0, boca: 'sorriso', bocaAbre: 0.1 }) }),
};
const g_ = WB.gelo, r_ = WB.raio, f_ = WB.fogo, c_ = WB.cura, s_ = WB.soco;
const KEYS = [[0, S.pronta], [70, S.respPronta, E.io3], [r_.carga0 - 6, S.pronta, E.io3], [r_.carga0 + 20, S.raioPuxa, E.out3], [r_.solta - 8, S.raioErgue, E.outBack], [r_.solta, S.raioErgue], [r_.solta + 5, S.raioAponta, E.out3],
  [r_.impacto + 4, S.raioAponta], [r_.impacto + 12, S.recuo, E.out3], [r_.impacto + 50, S.pronta, E.io3], [s_.ergue + 10, S.pronta], [s_.desce - 4, S.guarda, E.out3], [s_.ina, S.guarda],
  [s_.ina + 6, S.hit, E.out5], [s_.ina + 30, S.caida, E.out3], [c_.carga0, S.caida, E.io3], [c_.carga0 + 26, S.curaIni, E.io3], [c_.solta, S.curaIni], [c_.impacto - 4, S.cura, E.outBack], [c_.impacto + 40, S.cura],
  [f_.carga0 - 20, S.pronta, E.io3], [f_.carga0 + 12, S.fogoCarga, E.out3], [f_.puxa, S.fogoCarga], [f_.solta - 4, S.fogoPuxa, E.out3], [f_.solta + 2, S.fogoSolta, E.out5], [f_.solta + 14, S.fogoSegue, E.out3],
  [f_.impacto + 30, S.fogoSegue], [f_.impacto + 70, S.pronta, E.io3], [g_.carga0, S.pronta], [g_.carga0 + 30, S.geloJunta, E.io3], [g_.puxa, S.geloJunta], [g_.estende + 10, S.geloPuxa, E.out3], [g_.solta, S.geloPuxa],
  [g_.solta + 5, S.geloSolta, E.out5], [g_.impacto, S.geloSegura, E.out3], [g_.quebra, S.geloSegura], [g_.quebra + 40, S.respira, E.io3], [WB.respira + 160, S.respira], [WB.respira + 260, S.fim, E.io3], [WB.fim, S.fim]];
function mix(a, b, k) {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, k);
  if (Array.isArray(a)) return a.map((x, i) => mix(x, b[i], k));
  if (a && typeof a === 'object') { const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) o[key] = key in a && key in b ? mix(a[key], b[key], k) : (k < 0.5 ? (a[key] ?? b[key]) : (b[key] ?? a[key])); return o; }
  return k < 0.5 ? a : b;
}
function S_em(qf) { let i = 0; while (i + 1 < KEYS.length && KEYS[i + 1][0] <= qf) i++; if (i + 1 >= KEYS.length) return KEYS[i][1];
  const [q0, A] = KEYS[i], [q1, Bk, ease] = KEYS[i + 1]; return mix(A, Bk, (ease || E.io3)((qf - q0) / (q1 - q0))); }
const cargaDe = (b, qf) => clamp((qf - b.carga0) / (b.solta - b.carga0));
function baseIna(qf) { // empurrão do soco: desliza para trás com atrito
  const u = (qf - s_.ina) / 22; const k = u <= 0 ? 0 : E.out3(u); return A0.clone().lerp(A1, k);
}
function poseIna(tw) {
  const qf = tw * 60; let Sx = S_em(qf); const Sb = S_em(qf - 3), Sc = S_em(qf - 5); // braços chegam 3 q depois; cabeça 5 q
  Sx = { ...Sx, maos: Sb.maos, polos: Sb.polos, cab: mix(Sx.cab, Sc.cab, 0.6) };
  const resp = 1 + 2.5 * clamp((qf - g_.quebra - 30) / 40) * (1 - clamp((qf - WB.respira - 200) / 80)) + 1.4 * clamp((qf - s_.ina - 20) / 20) * (1 - clamp((qf - c_.carga0 - 20) / 30));
  const fr = 2.4 + 1.6 * (resp > 1.5 ? 1 : 0);
  // tremor de força segurando cada poder
  let treme = 0; for (const b of [r_, f_, g_]) { const c = cargaDe(b, qf); if (qf > b.carga0 && qf < b.solta) treme += (0.008 * Math.sin(tw * 71) + 0.005 * Math.sin(tw * 113)) * c * c * (b === g_ ? 1.6 : 1); }
  const base = baseIna(qf).add(V3(treme, 0, treme * 0.5));
  const P = poseEstatica({ ...Sx, base, pelve: { ...Sx.pelve, y: Sx.pelve.y + Math.sin(tw * fr) * 0.006 * resp }, tronco: { ...Sx.tronco, pitch: Sx.tronco.pitch + Math.sin(tw * fr + 0.6) * 1.6 * resp } });
  // vento do poder no rabo do gorro: puxa para trás na carga, chicoteia na soltura; o soco joga para frente
  let forca = 0, vs = 0; for (const b of [r_, f_, g_, c_]) { const c = cargaDe(b, qf); forca = Math.max(forca, c * (qf < b.solta ? 1 : Math.exp(-(qf - b.solta) / 22))); if (qf > b.solta && qf < b.solta + 50) vs += E.tremor((qf - b.solta) / 60, 3, 4); }
  const empurra = qf > s_.ina ? E.tremor((qf - s_.ina) / 60, 2.2, 3) : 0;
  P.gorro = { vento: [-0.34 * forca - 0.22 * vs + 0.03 * Math.sin(tw * 21) * forca - 0.03 + 0.02 * Math.sin(tw * 1.7), 0.12 * forca + 0.25 * empurra, 0.1 * forca - 0.05 + 0.3 * empurra] };
  return P;
}
const maoPos = (P, s = 'R') => P['punho' + s].clone().add(P['punho' + s].clone().sub(P['cotovelo' + s]).normalize().multiplyScalar(0.07));

// ======================================================================================
// POSES DO SENTINELA (ângulos em rad). Acorda → idle pesado → toma raio → soco no chão → toma fogo → ergue tudo → CONGELA → estilhaça
// ======================================================================================
const GS = (o) => ({ y: 0, lean: 0.08, twist: 0, roll: 0, hp: -0.05, hy: 0, shR: [0.06, -0.14], shL: [0.06, 0.14], elR: -0.35, elL: -0.35, olho: 1, ...o });
const GK = {
  dorme: GS({ y: -0.1, lean: 0.5, hp: 0.55, shR: [-0.3, -0.05], shL: [-0.3, 0.05], elR: -0.25, elL: -0.25, olho: 0 }),
  idle: GS({}),
  idle2: GS({ lean: 0.12, twist: 0.06, hy: -0.08, shR: [0.0, -0.18], shL: [0.1, 0.12], elR: -0.45, elL: -0.3 }),
  stagger: GS({ y: 0.02, lean: -0.32, roll: 0.12, twist: 0.2, hp: -0.45, hy: 0.25, shR: [0.5, -0.6], shL: [0.4, 0.55], elR: -0.2, elL: -0.15, olho: 0.4 }),
  wind: GS({ y: -0.06, lean: -0.24, twist: 0.36, roll: -0.06, hp: -0.12, shR: [-2.9, -0.22], shL: [-0.7, 0.25], elR: -0.7, elL: -0.4, olho: 1.4 }),
  slam: GS({ y: -0.16, lean: 0.62, twist: -0.18, roll: 0.05, hp: 0.25, shR: [-0.95, -0.05], shL: [0.3, 0.4], elR: -0.05, elL: -0.5, olho: 1.6 }),
  recolhe: GS({ y: -0.08, lean: 0.4, twist: -0.1, hp: 0.15, shR: [-0.7, -0.1], shL: [0.2, 0.3], elR: -0.25, elL: -0.45, olho: 1 }),
  queima: GS({ y: -0.02, lean: -0.28, roll: -0.1, twist: -0.22, hp: -0.35, hy: -0.3, shR: [0.4, -0.5], shL: [-0.6, 0.3], elR: -0.3, elL: -1.2, olho: 0.6 }),
  ergue2: GS({ y: 0.04, lean: -0.2, hp: -0.3, shR: [-2.75, -0.35], shL: [-2.75, 0.35], elR: -0.5, elL: -0.5, olho: 1.8 }),
};
const GKEYS = [[0, GK.dorme], [WB.acorda, GK.dorme], [WB.levanta, GK.idle, E.io3], [190, GK.idle2, E.io3], [r_.impacto, GK.idle2], [r_.impacto + 8, GK.stagger, E.out5], [r_.impacto + 60, GK.idle, (u) => E.mola(u * 0.8, 1.6, 0.4)],
  [s_.ergue, GK.idle], [s_.desce - 4, GK.wind, E.io3], [s_.chao, GK.slam, E.in3], [s_.chao + 30, GK.slam], [s_.chao + 70, GK.recolhe, E.io3], [c_.impacto, GK.idle, E.io3], [f_.impacto, GK.idle2, E.io3],
  [f_.impacto + 8, GK.queima, E.out5], [f_.impacto + 60, GK.idle, (u) => E.mola(u * 0.8, 1.6, 0.4)], [WB.ergue2, GK.idle], [g_.impacto - 6, GK.ergue2, E.io3], [g_.impacto + 2, { ...GK.ergue2, lean: -0.26, hp: -0.4 }, E.out3]];
function G_em(qf) { qf = Math.min(qf, g_.impacto + 2); let i = 0; while (i + 1 < GKEYS.length && GKEYS[i + 1][0] <= qf) i++; if (i + 1 >= GKEYS.length) return GKEYS[i][1];
  const [q0, A] = GKEYS[i], [q1, Bk, ease] = GKEYS[i + 1]; return mix(A, Bk, (ease || E.io3)((qf - q0) / (q1 - q0))); }
function poseGolem(tw) {
  const qf = tw * 60, g = G_em(qf), vivo = qf < g_.impacto; const br = vivo ? Math.sin(tw * 1.9) : 0;
  const acordou = clamp((qf - WB.acorda) / 50);
  golem.corpo.position.y = g.y + br * 0.012 * acordou; golem.corpo.rotation.set(0, 0, 0);
  golem.quadril.rotation.set(g.lean * 0.25, g.twist * 0.3, g.roll * 0.4);
  golem.tronco.rotation.set(g.lean * 0.45 + br * 0.02 * acordou, g.twist * 0.4, g.roll * 0.3);
  golem.peito.rotation.set(g.lean * 0.3, g.twist * 0.3, g.roll * 0.3);
  golem.cab.rotation.set(g.hp, g.hy + (vivo ? 0.06 * Math.sin(tw * 0.7) * acordou : 0), 0);
  for (const s of [-1, 1]) { const b = golem.bracos[s], sh = s < 0 ? g.shR : g.shL, el = s < 0 ? g.elR : g.elL; // s=-1 = braço direito dele
    b.om.rotation.set(sh[0] + br * 0.03 * acordou, 0, sh[1]); b.cot.rotation.set(el + (vivo ? 0.04 * Math.sin(tw * 2.3 + s) * acordou : 0), 0, 0); b.pu.rotation.set(-0.1, 0, 0); }
  for (const s of [-1, 1]) golem.pernas[s].rotation.set(-g.lean * 0.25 + (s * 0.02), 0, 0);
  return g;
}
const punhoMundo = (tw) => { poseGolem(tw); golem.root.updateMatrixWorld(true); return { base: golem.bracos[-1].cot.getWorldPosition(V3()), ponta: golem.bracos[-1].pu.localToWorld(V3(0, -0.32, 0)) }; };
{ const p = punhoMundo(Tq(s_.chao)).ponta; SOCO_P.set(p.x, 0, p.z); }

// ======================================================================================
// CÂMERA: spline Catmull-Rom por keys (nunca para), lente longa, baixa; tremida direcional no golpe
// ======================================================================================
// câmera por ÓRBITA: [quadro, sujeito (fração Ina→Sentinela), altura do olhar, azimute (0 = atrás da Ina olhando o Sentinela; + = lado PERP), distância, altura da câmera, fov]
const CK = [
  [0, 0.5, 1.0, -18, 7.5, 0.5, 32],
  [130, 0.5, 1.0, -12, 6.5, 0.6, 32],
  [r_.carga0 + 30, 0, 0.95, -120, 2.6, 0.4, 34],
  [r_.solta - 2, 0, 1.15, -138, 2.4, 0.3, 36],
  [r_.impacto - 2, 0.55, 1.35, -30, 6.0, 0.45, 36],
  [r_.impacto + 30, 0.6, 1.3, -22, 6.6, 0.6, 34],
  [s_.ergue + 4, 0.6, 1.2, -16, 6.0, 0.9, 34],
  [s_.desce - 6, 0.35, 0.7, 150, 5.0, 2.4, 34],
  [s_.ina + 8, 0.3, 0.6, 140, 5.2, 2.2, 36],
  [c_.carga0 + 10, 0, 0.7, 110, 2.8, 0.5, 32],
  [c_.impacto + 6, 0, 0.85, 70, 3.0, 0.6, 34],
  [f_.carga0 + 10, 0.25, 0.8, 35, 3.6, 1.0, 34],
  [f_.solta, 0.4, 0.85, 20, 5.6, 0.95, 34],
  [f_.impacto + 24, 0.6, 1.05, 24, 6.6, 1.2, 34],
  [g_.carga0 + 20, 0, 0.8, -110, 2.7, 0.4, 34],
  [g_.puxa + 30, 0, 0.8, -80, 2.6, 0.38, 34],
  [g_.solta + 2, 0.3, 0.75, -26, 4.8, 0.5, 38],
  [g_.impacto + 6, 0.6, 1.1, -20, 6.2, 0.8, 36],
  [g_.quebra - 10, 1.0, 1.1, -40, 4.5, 1.0, 34],
  [WB.respira + 20, 0.4, 0.7, -16, 5.6, 1.1, 34],
  [WB.fim, 0.4, 0.5, -20, 8.0, 2.6, 32],
];
function cr(p0, p1, p2, p3, u) { const u2 = u * u, u3 = u2 * u; return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3); }
function crV(a, b, c, d, u) { return V3(cr(a.x, b.x, c.x, d.x, u), cr(a.y, b.y, c.y, d.y, u), cr(a.z, b.z, c.z, d.z, u)); }
const SHAKES = [{ k: 'raio', f: 0.9, dir: [0, 1] }, { k: 'soco', f: 1.2, dir: [-1, 0.3] }, { k: 'fogo', f: 0.8, dir: [1, -0.2] }, { k: 'gelo', f: 1.1, dir: [1, 0.1] }, { k: 'quebra', f: 0.9, dir: [0, 1] }];
function camEm(tw, t) {
  const qf = tw * 60; let i = 0; while (i + 1 < CK.length && CK[i + 1][0] <= qf) i++; const j = Math.min(i + 1, CK.length - 1);
  const u = j === i ? 0 : E.suave(clamp((qf - CK[i][0]) / (CK[j][0] - CK[i][0]))) * 0.35 + clamp((qf - CK[i][0]) / (CK[j][0] - CK[i][0])) * 0.65;
  const k = (n) => CK[clamp(n, 0, CK.length - 1)];
  const sc = (n) => cr(k(i - 1)[n], k(i)[n], k(j)[n], k(j + 1)[n], u);
  const fr = sc(1), az = sc(3) * Math.PI / 180, di = sc(4); let fov = sc(6);
  const ina0 = baseIna(qf), sub = ina0.clone().lerp(GP, fr).setY(sc(2));
  const pos = sub.clone().addScaledVector(DIR, -Math.cos(az) * di).addScaledVector(PERP, Math.sin(az) * di).setY(sc(5)), alvo = sub;
  pos.x += Math.sin(tw * 0.63) * 0.03; pos.y += Math.sin(tw * 0.81) * 0.02; alvo.y += Math.sin(tw * 0.5) * 0.015;
  // tremida direcional: impulso na direção do golpe que volta com mola, + um pouco de ruído
  let sx = 0, sy = 0, rot = 0; for (const s of SHAKES) { const g = G_[s.k]; const uu = t - g.t; if (uu < 0 || uu > 0.6) continue; const a = s.f * E.tremor(uu, 7, 7); sx += s.dir[0] * a; sy += s.dir[1] * a; rot += a * 0.03 * (s.dir[0] >= 0 ? 1 : -1);
    const nz = s.f * Math.exp(-uu * 10); sx += (hash(Math.floor(t * 60)) - 0.5) * nz * 0.5; sy += (hash(Math.floor(t * 60) + 7) - 0.5) * nz * 0.5; }
  // zoom-in na carga + soco de lente no impacto
  for (const b of [r_, f_, g_]) { const c = cargaDe(b, qf); if (qf > b.carga0 && qf < b.solta + 4) fov -= 3 * E.in2(c); }
  for (const kk of ['raio', 'fogo', 'gelo']) { const g = G_[kk]; if (t > g.t) fov -= 4 * Math.exp(-(t - g.t - Tq(g.stop)) * 6) * (t - g.t < Tq(g.stop) ? 1 : 1); }
  return { pos, alvo, sx: sx * 0.07, sy: sy * 0.07, rot, fov };
}

// ======================================================================================
// PÓS: bloom baixo + gradação (sombra azul-petróleo, luz laranja, contraste) + vinheta
// ======================================================================================
const cam = new THREE.PerspectiveCamera(34, W / H, 0.05, 300); cam.layers.enable(1);
const composer = new EffectComposer(renderer); composer.setSize(IW, IH);
composer.addPass(new RenderPass(scene, cam)); const bloom = new UnrealBloomPass(new THREE.Vector2(IW / 2, IH / 2), 0.4, 0.5, 0.82); composer.addPass(bloom); composer.addPass(new OutputPass());
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uDim: { value: 0 } }, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uDim; varying vec2 vUv;
    void main(){ vec3 x = texture2D(tDiffuse, vUv).rgb; float l = dot(x, vec3(0.299, 0.587, 0.114));
      x = mix(x, x * vec3(0.86, 1.0, 1.08) + vec3(0.0, 0.025, 0.04), smoothstep(0.55, 0.0, l) * 0.8);   // sombra petróleo
      x = mix(x, x * vec3(1.08, 1.0, 0.88), smoothstep(0.35, 0.9, l) * 0.7);                            // luz laranja
      x = (x - 0.45) * 1.1 + 0.45;
      float d = distance(vUv * vec2(1.0, 1.25), vec2(0.5, 0.62)); x *= 1.0 - smoothstep(0.32, 0.95, d) * (0.5 + 0.2 * uDim);
      gl_FragColor = vec4(clamp(x, 0.0, 1.0), 1.0); }` });
composer.addPass(grade);
const proj = (v) => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H, p.z]; };

// ---------- 2D pré-feitos: grão, primeiro plano desfocado ----------
const GRAOS = []; for (let k = 0; k < 4; k++) { const c = document.createElement('canvas'); c.width = 540; c.height = 960; const g = c.getContext('2d'); const id = g.createImageData(540, 960);
  for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (hash(i * 0.37 + k * 911) - 0.5) * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); GRAOS.push(c); }
const FG = (() => { const c = document.createElement('canvas'); c.width = 1400; c.height = 700; const g = c.getContext('2d'); g.filter = 'blur(18px)';
  g.fillStyle = '#120a12'; g.beginPath(); g.moveTo(0, 700); g.lineTo(0, 380); g.lineTo(120, 300); g.lineTo(260, 340); g.lineTo(330, 250); g.lineTo(470, 300); g.lineTo(560, 420); g.lineTo(700, 520); g.lineTo(900, 600); g.lineTo(1100, 560); g.lineTo(1250, 620); g.lineTo(1400, 560); g.lineTo(1400, 700); g.fill();
  g.fillStyle = '#1c121a'; for (let i = 0; i < 26; i++) { const x = hash(i) * 1400, h = 60 + hash(i + 1) * 160; g.beginPath(); g.moveTo(x - 10, 700); g.lineTo(x + (hash(i + 2) - 0.5) * 60, 700 - h - 260 * (x < 600 ? 1 : 0.2)); g.lineTo(x + 12, 700); g.fill(); }
  return c; })();
const MASK = document.createElement('canvas'); MASK.width = W; MASK.height = H; const TMP = document.createElement('canvas'); TMP.width = W; TMP.height = H; const GRAB = document.createElement('canvas'); GRAB.width = W; GRAB.height = H;
const WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });

// ---------- impact frame de anime (silhueta chapada, pincel na direção da força, respingo, 1 cor de acento; desenhos de 4 q) ----------
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function maskRender(keep) {
  const vis = scene.children.map((o) => o.visible); scene.children.forEach((o) => { if (!o.isLight) o.visible = keep.includes(o) && o.visible; });
  scene.overrideMaterial = WHITE; renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, cam); scene.overrideMaterial = null; scene.children.forEach((o, i) => (o.visible = vis[i]));
  const m = MASK.getContext('2d'); m.globalCompositeOperation = 'copy'; m.drawImage(glc, 0, 0, W, H); m.globalCompositeOperation = 'source-over';
}
function tinted(col, dx = 0, dy = 0, sc = 1, px = W / 2, py = H / 2) { const g = TMP.getContext('2d'); g.globalCompositeOperation = 'copy'; g.setTransform(sc, 0, 0, sc, px - px * sc + dx, py - py * sc + dy); g.drawImage(MASK, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; return TMP; }
function brush(c, x0, y0, x1, y1, wd, seed, col) { const r = rng(seed), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, n = Math.max(5, wd / 5 | 0); c.fillStyle = col;
  for (let i = 0; i < n; i++) { const o = (i / (n - 1) - 0.5) * wd * (0.8 + r() * 0.3), a = r() * 0.16, b = 1 - r() * 0.22, w = (wd / n) * (0.7 + r() * 1.3) * (1 - Math.abs(i / (n - 1) - 0.5) * 0.8);
    const ax = x0 + dx * a + nx * o, ay = y0 + dy * a + ny * o, bx = x0 + dx * b + nx * o, by = y0 + dy * b + ny * o, mx = (ax + bx) / 2 + nx * (r() - 0.5) * 6, my = (ay + by) / 2 + ny * (r() - 0.5) * 6;
    c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx + nx * w, my + ny * w, bx, by); c.quadraticCurveTo(mx - nx * w, my - ny * w, ax, ay); c.fill(); } }
function arcBrush(c, cx, cy, R, a0, a1, wd, seed, col) { const r = rng(seed), n = 9; c.strokeStyle = col; c.lineCap = 'round';
  for (let i = 0; i < n; i++) { const k = i / (n - 1) - 0.5, rr = R + k * wd, s0 = a0 + r() * 0.25, s1 = a1 - r() * 0.3; c.lineWidth = (wd / n) * (1.2 + r() * 1.4) * (1 - Math.abs(k) * 1.1); c.beginPath(); c.arc(cx, cy, Math.max(1, rr), s0, s1); c.stroke(); } }
function splat(c, x, y, ux, uy, n, seed, col, reach = 900) { const r = rng(seed); c.fillStyle = col;
  for (let i = 0; i < n; i++) { const d = Math.pow(r(), 1.6) * reach + 60, sp = (r() - 0.5) * 1.5, ca = Math.cos(sp), sa = Math.sin(sp), vx = ux * ca - uy * sa, vy = ux * sa + uy * ca, sz = Math.max(3, Math.pow(r(), 3.2) * 60 * (1 - d / (reach * 1.4)));
    c.save(); c.translate(x + vx * d, y + vy * d); c.rotate(Math.atan2(vy, vx)); c.beginPath(); c.ellipse(0, 0, sz * (1 + r() * 1.6), sz * 0.6, 0, 0, 7); c.fill(); c.restore(); } }
function impactFrame(c, k, x, y, ux, uy, ACC, seed) {
  const g = GRAB.getContext('2d'); g.globalCompositeOperation = 'copy'; g.drawImage(out, 0, 0); g.globalCompositeOperation = 'source-over';
  const step = k < 2 ? 0 : k < 6 ? 1 : k < 10 ? 2 : 3, px = -uy, py = ux, ang = Math.atan2(uy, ux);
  c.save();
  if (step === 0) { c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.drawImage(tinted('#d6d2dc'), 0, 0); }
  else if (step === 1) { c.fillStyle = '#07070b'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) { const o = (i - 7.5) * 120 + Math.sin(i * 7.7 + seed) * 40, l = 500 + (i * 131 % 900); brush(c, x + px * o - ux * 300, y + py * o - uy * 300, x + px * o + ux * l, y + py * o + uy * l, 16 + (i * 37 % 34), seed + 40 + i, 'rgba(255,255,255,0.16)'); }
    c.globalAlpha = 0.35; c.drawImage(tinted('#fff', -ux * 46, -uy * 46), 0, 0); c.globalAlpha = 1; c.drawImage(tinted('#fff'), 0, 0);
    arcBrush(c, x - ux * 120, y - uy * 120, 470, ang - 1.25, ang + 1.25, 150, seed + 5, ACC);
    splat(c, x, y, ux, uy, 70, seed + 11, '#fff', 900); splat(c, x, y, ux, uy, 14, seed + 13, ACC, 700); }
  else if (step === 2) { c.fillStyle = '#efeae2'; c.fillRect(0, 0, W, H);
    const gr = c.createRadialGradient(x, y, 0, x, y, 900); gr.addColorStop(0, ACC); gr.addColorStop(0.45, ACC + '40'); gr.addColorStop(1, ACC + '00'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 12; i++) { const o = (i - 5.5) * 150 + Math.sin(i * 5.3 + seed) * 50, l = 700 + (i * 173 % 800); brush(c, x + px * o + ux * 80, y + py * o + uy * 80, x + px * o + ux * l, y + py * o + uy * l, 22 + (i * 29 % 40), seed + 70 + i, 'rgba(12,10,14,0.9)'); }
    c.drawImage(tinted('#0b0a0f', ux * 18, uy * 18, 1.03, x, y), 0, 0);
    arcBrush(c, x - ux * 60, y - uy * 60, 560, ang - 1.1, ang + 1.1, 110, seed + 6, '#0b0a0f'); arcBrush(c, x - ux * 60, y - uy * 60, 500, ang - 0.9, ang + 0.9, 46, seed + 7, '#fff');
    splat(c, x, y, ux, uy, 110, seed + 21, '#0b0a0f', 1100); splat(c, x, y, -ux, -uy, 26, seed + 23, '#0b0a0f', 420); }
  else { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); const z = 1.08 - 0.03 * (k - 10); c.translate(x, y); c.scale(z, z); c.translate(-x, -y);
    c.filter = 'contrast(1.3) saturate(1.3) brightness(1.1)'; c.drawImage(GRAB, 0, 0); c.filter = 'none';
    c.globalAlpha = 0.28; c.globalCompositeOperation = 'screen'; c.drawImage(GRAB, ux * 22, uy * 22); c.drawImage(GRAB, -ux * 22, -uy * 22); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
  c.restore();
  if (step === 1 || step === 2) { c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.25; c.drawImage(GRAOS[Math.floor(k) % 4], 0, 0, W, H); c.restore(); }
}

// ---------- HUD ----------
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function selo(t, t0, t1, txt, x, y, cor) { const u = t - t0; if (u < 0 || t > t1) return; const s = E.outBack(clamp(u / q(10)), 2.6); const a = 1 - clamp((t - (t1 - 0.25)) / 0.25);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.06); ctx.font = `44px ${F}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(txt).width + 46; ctx.fillStyle = cor; rr(-w / 2, -34, w, 68, 16); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillText(txt, 0, 3); ctx.restore(); }
function icone(k, x, y, s, cor) { ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100); ctx.fillStyle = cor; ctx.strokeStyle = cor; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (k === 'raio') { ctx.beginPath(); ctx.moveTo(10, -44); ctx.lineTo(-22, 6); ctx.lineTo(0, 6); ctx.lineTo(-10, 44); ctx.lineTo(24, -10); ctx.lineTo(2, -10); ctx.closePath(); ctx.fill(); }
  if (k === 'fogo') { ctx.beginPath(); ctx.moveTo(0, -44); ctx.bezierCurveTo(30, -10, 34, 10, 26, 24); ctx.bezierCurveTo(18, 44, -18, 44, -26, 24); ctx.bezierCurveTo(-32, 8, -18, -6, -12, -20); ctx.bezierCurveTo(-8, -4, 0, -2, 4, -10); ctx.bezierCurveTo(8, -20, 2, -32, 0, -44); ctx.fill(); }
  if (k === 'cura') { ctx.fillRect(-11, -36, 22, 72); ctx.fillRect(-36, -11, 72, 22); }
  if (k === 'gelo') { ctx.lineWidth = 9; for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, -42); ctx.lineTo(0, 42); for (const sy of [-1, 1]) { ctx.moveTo(0, sy * 26); ctx.lineTo(-12, sy * 38); ctx.moveTo(0, sy * 26); ctx.lineTo(12, sy * 38); } ctx.stroke(); ctx.restore(); } }
  ctx.restore(); }
const SKILLS = [['raio', r_, '#ffe36a'], ['cura', c_, '#8dff8a'], ['fogo', f_, '#ff9a3a'], ['gelo', g_, '#7fe2ff']];
function hud(t, tw, alpha) {
  if (alpha <= 0) return; const qf = tw * 60; ctx.save(); ctx.globalAlpha = alpha;
  // chefe no topo: barra que mente
  const gv = J.vidaEm(t, 400, [{ t: G_.raio.t, de: 400, para: 276 }, { t: G_.fogo.t, de: 276, para: 178 }, { t: G_.gelo.t, de: 178, para: 0 }], q(30), q(18));
  const sh = Math.max(0, ...['raio', 'fogo', 'gelo'].map((k) => { const u = t - G_[k].t; return u > 0 && u < 0.4 ? Math.exp(-u * 10) * 14 * Math.sin(u * 70) : 0; }));
  const yb = 226 - 60 * (1 - E.out3(clamp((qf - WB.hud) / 24)));
  J.barraVida(ctx, 160 + sh, yb, 760, 50, gv, 400, 'SENTINELA DA RUÍNA', F);
  // Ina embaixo, com os 4 poderes
  const ih = (() => { const tH = G_.soco.t, tC = G_.cura.t; if (t < tH) return { fill: 100, pedaco: null, mostrado: 100 };
    if (t < tC) return J.vidaEm(t, 100, [{ t: tH, de: 100, para: 36 }], q(30), q(18));
    const k = E.out3(clamp((t - tC) / q(36))); return { fill: lerp(36, 94, k), pedaco: { de: 36, ate: 94 }, mostrado: Math.round(lerp(36, 94, k)), cura: true }; })();
  const xb = 70, yi = 1352 + 60 * (1 - E.out3(clamp((qf - WB.hud - 8) / 24)));
  const p0 = COR.pedaco; if (ih.cura) COR.pedaco = '#c9ffc0'; J.barraVida(ctx, xb, yi, 470, 44, ih, 100, 'INA', F); COR.pedaco = p0;
  SKILLS.forEach(([k, b, cor], i) => { const x = xb + 58 + i * 128, y = yi + 140, sz = 104; const carga = qf > b.carga0 && qf < (b.impacto || b.solta) + 4; const usado = qf >= b.solta;
    const pop = qf >= b.solta && qf < b.solta + 14 ? 1 + 0.28 * E.tremor((qf - b.solta) / 60, 4, 5) : carga ? 1 + 0.05 * Math.sin(tw * 18) : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop);
    ctx.fillStyle = 'rgba(12,10,26,0.82)'; rr(-sz / 2, -sz / 2, sz, sz, 22); ctx.fill(); ctx.lineWidth = carga ? 7 : 4; ctx.strokeStyle = carga ? cor : 'rgba(255,211,107,0.85)'; ctx.stroke();
    if (carga) { ctx.save(); ctx.shadowColor = cor; ctx.shadowBlur = 30; ctx.stroke(); ctx.restore(); }
    icone(k, 0, 0, 62, carga ? '#ffffff' : cor);
    if (usado) { const cd = 1 - clamp((qf - b.solta) / 400); if (cd > 0) { ctx.save(); rr(-sz / 2, -sz / 2, sz, sz, 22); ctx.clip(); ctx.fillStyle = 'rgba(5,5,12,0.62)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, sz, -Math.PI / 2, -Math.PI / 2 + cd * Math.PI * 2); ctx.closePath(); ctx.fill(); ctx.restore(); } }
    ctx.restore(); });
  ctx.restore();
}

// ======================================================================================
// QUADRO
// ======================================================================================
const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler(), vv = new THREE.Vector3(), ss = new THREE.Vector3();
const ESC = (im, i) => { m4.compose(vv.set(0, -9, 0), qq.identity(), ss.set(1e-4, 1e-4, 1e-4)); im.setMatrixAt(i, m4); };
const corP = new THREE.Color();
function quadro(t) {
  const tw = J.hitStop(t, GOLPES), qf = tw * 60; U.uT.value = tw; gUni.uT.value = tw;
  // --- Ina
  const P = poseIna(tw); aplicarPose(ina, P); ina.updateMatrixWorld(true);
  const mao = maoPos(P), maoL = maoPos(P, 'L'), maoG = mao.clone().lerp(maoL, qf > g_.carga0 && qf < g_.quebra ? 0.5 : 0);
  const IA = baseIna(qf);
  // --- Sentinela
  for (const p of golem.parts) { const b = p.userData.b0 || (p.userData.b0 = [p.position.clone(), p.quaternion.clone(), p.scale.clone()]); p.position.copy(b[0]); p.quaternion.copy(b[1]); p.scale.copy(b[2]); }
  const gpose = poseGolem(tw); golem.root.updateMatrixWorld(true);
  const quebrou = qf >= g_.quebra; const uq = (qf - g_.quebra) / 60;
  if (quebrou) { golem.parts.forEach((p, i) => { const W0 = p.matrixWorld.clone(); const c = V3().setFromMatrixPosition(W0); const a = hash(i * 3.1) * 6.28, sp = 0.4 + 1.2 * hash(i + 2);
    const vy = 0.6 + 1.6 * hash(i + 5); let y = c.y + vy * uq - 4.9 * uq * uq; const piso = 0.12 + 0.05 * hash(i); let quica = 0; if (y < piso) { y = piso; quica = 1; }
    const k = Math.min(uq, quica ? (vy + Math.sqrt(vy * vy + 19.6 * Math.max(0, c.y - piso))) / 9.8 : uq);
    const d = V3(Math.cos(a) * sp * k * 0.8 + (c.x - GP.x) * 0.6 * k, y - c.y, Math.sin(a) * sp * k * 0.8 + (c.z - GP.z) * 0.6 * k);
    ee.set(k * 6 * (hash(i + 7) - 0.5), k * 4 * hash(i + 8), k * 6 * (hash(i + 9) - 0.5)); const R = new THREE.Matrix4().makeRotationFromEuler(ee);
    const M = new THREE.Matrix4().makeTranslation(c.x + d.x, c.y + d.y, c.z + d.z).multiply(R).multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z)).multiply(W0);
    const Lm = p.parent.matrixWorld.clone().invert().multiply(M); Lm.decompose(p.position, p.quaternion, p.scale); }); golem.root.updateMatrixWorld(true); }
  golem.runaGrp.visible = !quebrou; golem.olho.visible = !quebrou;
  // olho/runas: acende ao acordar, pisca no golpe, apaga ao congelar
  const acord = E.out3(clamp((qf - WB.acorda) / 30)); const congel = qf > g_.impacto + 4 ? 1 : 0;
  const olhoK = gpose.olho * acord * (congel ? 0.15 : 1) * (0.85 + 0.15 * Math.sin(tw * 9) * Math.sin(tw * 3.3));
  golem.olho.material.color.set(OLHO).multiplyScalar(0.25 + 0.75 * clamp(olhoK)); golem.runaMat.color.set(OLHO).multiplyScalar(0.15 + 0.7 * clamp(olhoK)); golem.luzOlho.intensity = 0.9 * olhoK;
  // clarões/tintas do Sentinela
  let fl = 0; for (const k of ['raio', 'fogo', 'gelo']) fl = Math.max(fl, J.clarao(t, G_[k].t, 5, 2)); if (FX.raio.flash(qf, { B: r_ }) && qf - r_.impacto < 12) fl = Math.max(fl, 0.9);
  const queima = qf > f_.impacto ? 0.75 * (1 - clamp((qf - f_.impacto - 40) / 120)) : 0;
  golem.mats.forEach((m, i) => { m.color.copy(GMATS0[i]); if (queima > 0) m.color.lerp(new THREE.Color('#3a2018'), queima); if (congel) m.color.lerp(new THREE.Color('#8fd6ff'), 0.72); m.userData.cor0 = m.color.clone(); m.userData.em0 = new THREE.Color(0, 0, 0); J.pintarClarao(m, fl); m.userData.cor0 = GMATS0[i].clone(); });
  // Ina leva o soco: pisca branco
  const flI = J.clarao(t, G_.soco.t, 4, 3); inaMats.forEach((m) => J.pintarClarao(m, flI));
  // --- luz geral cai na carga de cada poder (o poder vira a fonte de luz)
  let dim = 0; for (const [b, e] of [[r_, 0.8], [c_, 0.45], [f_, 0.6], [g_, 0.88]]) { const c = cargaDe(b, qf); const fim = b === g_ ? g_.quebra + 20 : b.impacto + 30; dim = Math.max(dim, e * E.io3(c) * (1 - E.io3((qf - fim) / 70))); }
  dim = Math.max(dim, 0.25 * (1 - acord));
  sol.intensity = SOL0 * (1 - dim); hemi.intensity = HEMI0 * (1 - 0.6 * dim); fill.intensity = FILL0 * (1 - 0.5 * dim); skyU.uDim.value = dim; scene.fog.color.copy(FOG0).multiplyScalar(1 - 0.6 * dim); grade.uniforms.uDim.value = dim;
  // luz da mão (cor do poder ativo) e do impacto
  const ativo = [[r_, '#fff2a0', 'raio'], [c_, '#a8ffb0', 'cura'], [f_, '#ffa050', 'fogo'], [g_, '#bfe8ff', 'gelo']].find(([b]) => qf > b.carga0 - 5 && qf < b.impacto + 60) || null;
  if (ativo) { const [b, cor] = ativo; luzMao.color.set(cor); const c = cargaDe(b, qf); luzMao.position.copy(b === g_ ? maoG : mao); luzMao.intensity = (qf < b.solta ? 0.6 * E.in2(c) : 1.1 * Math.exp(-(qf - b.solta) / 10)) * (1 + 0.15 * Math.sin(tw * 40)); } else luzMao.intensity = 0;
  { const imps = [[r_, '#e8ecff', V3(GP.x, 1.8, GP.z), 1], [f_, '#ff8a30', V3(GP.x, 1.0, GP.z), 0.55], [g_, '#7fd8ff', V3(GP.x, 1.0, GP.z), 1.2], [c_, '#9dff9a', V3(IA.x, 0.8, IA.z), 0.5], [{ impacto: s_.chao }, '#ffb080', SOCO_P.clone().setY(0.4), 0.5]];
    let best = null; for (const it of imps) { const ui = qf - it[0].impacto; if (ui >= 0 && ui < 90) best = it; }
    if (best) { const ui = qf - best[0].impacto; luzImp.color.set(best[1]); luzImp.position.copy(best[2]).addScaledVector(DIR, -0.5).setY(best[2].y + 0.3); luzImp.intensity = best[3] * (ui < 60 ? 6 * Math.exp(-ui / 12) + 1.2 * (1 - ui / 60) : 0); } else luzImp.intensity = 0;
    if (qf > g_.impacto && qf < g_.quebra + 30) { luzImp.color.set('#5fc8ff'); luzImp.position.set(GP.x, 1.2, GP.z).addScaledVector(DIR, -0.7); luzImp.intensity = Math.max(luzImp.intensity, 1.6 + 0.2 * Math.sin(tw * 5)); } }
  // --- poderes da biblioteca
  FX.raio.atualizar(qf, { B: r_, mao, alvo: V3(GP.x, 1.75, GP.z), heroi: IA, proj });
  FX.fogo.atualizar(qf, { B: f_, mao, alvo: V3(GP.x, 0.95, GP.z), heroi: IA, proj });
  FX.cura.atualizar(qf, { B: c_, mao, alvo: IA, heroi: IA, proj });
  // --- gelo: cristais crescem com outBack em onda; coroa em volta do Sentinela; quebram em onda
  let n = 0;
  for (const c of CR) { const uq2 = qf - c.t0; let s = uq2 > 0 ? E.outBack(uq2 / (c.fin ? 8 : 6), 2.2) : 0; const tq = g_.quebra + (c.fin ? 0 : -14 + c.u * 12); if (qf > tq) s *= 1 - E.in2((qf - tq) / 6); s *= c.s; if (s < 1e-3) s = 1e-4;
    if (c.fin) { const ax = V3(0, 1, 0).addScaledVector(c.out, 0.42).normalize(); qq.setFromUnitVectors(V3(0, 1, 0), ax); } else { ee.set(c.inc[0], c.inc[1], c.inc[2]); qq.setFromEuler(ee); }
    m4.compose(vv.copy(c.p).setY(-0.03), qq, ss.set(s, s * (0.9 + 0.2 * hash(n)), s)); imCr.setMatrixAt(n++, m4); }
  imCr.instanceMatrix.needsUpdate = true; imCr.visible = qf > g_.solta && qf < g_.quebra + 8;
  gUni.uBrilho.value = 1 + 0.35 * (qf > g_.impacto ? Math.exp(-(qf - g_.impacto) / 10) : 0);
  { let j = 0; for (const c of CR) { const g = qf > c.t0 ? E.out3((qf - c.t0) / 12) : 0; const r = Math.max(1e-4, g * c.s * (c.fin ? 0.4 : 0.28)); m4.compose(vv.copy(c.p).setY(0.012 + j * 0.0002), qq.identity(), ss.set(r * 1.3, 1, r)); imGeada.setMatrixAt(j++, m4); }
    imGeada.instanceMatrix.needsUpdate = true; imGeada.material.opacity = 0.5 * (1 - clamp((qf - WB.respira - 150) / 120)); imGeada.visible = qf > g_.solta; }
  for (let i = 0; i < NCACO; i++) { const c = CR[i % CR.length]; const tq = g_.quebra + (c.fin ? 0 : -14 + c.u * 12); const u = (qf - tq) / 60;
    if (u < 0 || u > 1.3) { ESC(imCaco, i); continue; } const h1 = hash(i * 1.3), h2 = hash(i * 2.1 + 5), h3 = hash(i * 3.7 + 9), a = h1 * 6.28, sp = (1.0 + 1.8 * h2) * (c.fin ? 1.4 : 0.8);
    let y = 0.2 + 0.9 * h3 * c.s + (1.8 + 2 * h2) * u - 4.9 * u * u; if (y < 0.03) y = 0.03; vv.set(c.p.x + Math.cos(a) * sp * u * 0.6, y, c.p.z + Math.sin(a) * sp * u * 0.6);
    ee.set(u * 12 * h1, u * 9 * h2, u * 7); qq.setFromEuler(ee); const k = (0.6 + 1.3 * h3) * (1 - clamp((u - 0.9) / 0.4)) * (c.fin ? 1.6 : 1); m4.compose(vv, qq, ss.set(k, k * 1.7, k)); imCaco.setMatrixAt(i, m4); }
  imCaco.instanceMatrix.needsUpdate = true;
  // --- onda de terra do soco
  for (let i = 0; i < ES.length; i++) { const e = ES[i]; const p = SOCO_P.clone().lerp(IA.clone().setY(0), 0.15 + e.u * 0.7).addScaledVector(PERP, e.lado); const t0 = s_.chao + e.u * (s_.ina - s_.chao); let s = qf > t0 ? E.outBack((qf - t0) / 5, 2) : 0;
    if (qf > t0 + 40) s *= 1 - E.in2((qf - t0 - 40) / 30); s *= e.s; ee.set(e.inc[0], e.inc[1], e.inc[2]); qq.setFromEuler(ee); m4.compose(vv.copy(p).setY(-0.05), qq, ss.set(Math.max(1e-4, s * 1.4), Math.max(1e-4, s), Math.max(1e-4, s * 1.4))); imEs.setMatrixAt(i, m4); }
  imEs.instanceMatrix.needsUpdate = true; imEs.visible = qf > s_.chao && qf < s_.chao + 80;
  for (let i = 0; i < NENT; i++) { // entulho: do soco (0–24) e da queda do Sentinela (25–49)
    const doSoco = i < 25, t0 = doSoco ? s_.chao : g_.quebra, u = (qf - t0) / 60; if (u < 0 || u > 1.4) { ESC(imEnt, i); continue; }
    const o = doSoco ? SOCO_P : GP, h1 = hash(i + 0.7), h2 = hash(i + 3.3), a = h1 * 6.28, sp = 0.8 + 1.6 * h2; let y = 0.1 + (1.4 + 2.2 * hash(i + 9)) * u - 4.9 * u * u; if (y < 0.04) y = 0.04;
    vv.set(o.x + Math.cos(a) * sp * u * 0.7, y, o.z + Math.sin(a) * sp * u * 0.7); ee.set(u * 9 * h1, u * 7, u * 5 * h2); qq.setFromEuler(ee); const k = (0.6 + 1.2 * hash(i + 4)) * (doSoco ? 1 : 1.5); m4.compose(vv, qq, ss.set(k, k, k)); imEnt.setMatrixAt(i, m4); }
  imEnt.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < NPO; i++) { const grp = i < 14 ? 0 : i < 26 ? 1 : 2; const [t0, o, esc] = grp === 0 ? [s_.chao, SOCO_P, 1] : grp === 1 ? [s_.ina + 2, IA, 0.6] : [g_.quebra, GP, 1.5]; const u = (qf - t0 - (i % 5) * 2) / 100;
    if (u < 0 || u > 1) { ESC(imPo, i); continue; } const a = hash(i + 11) * 6.28; vv.set(o.x + Math.cos(a) * (0.2 + 0.9 * E.out3(u)) * esc, 0.12 + 0.5 * u * esc, o.z + Math.sin(a) * (0.2 + 0.9 * E.out3(u)) * esc); m4.compose(vv, qq.identity(), ss.setScalar((0.1 + 0.32 * E.out3(u)) * esc * (0.7 + 0.6 * hash(i)))); imPo.setMatrixAt(i, m4); }
  imPo.instanceMatrix.needsUpdate = true; imPo.material.opacity = 0.45;
  // --- partículas aditivas
  for (let i = 0; i < NP; i++) { const h1 = hash(i + 0.3), h2 = hash(i + 7.7), h3 = hash(i + 3.1); let p = null, k = 0, cor = '#ffffff';
    if (i < 110) { // carga do gelo: espiral entrando nas duas mãos
      const nasce = g_.carga0 + h1 * (g_.solta - g_.carga0 - 10), u = (qf - nasce) / 26; if (u >= 0 && u <= 1 && qf < g_.solta + 2) { const r = 0.7 * (1 - E.in2(u)), a = h2 * 6.28 + u * 5; p = maoG.clone().add(V3(Math.cos(a) * r, Math.sin(a) * r * 0.8 + (h3 - 0.5) * 0.2 * (1 - u), Math.sin(a * 0.7) * r * 0.6)); k = 0.6 + 1.6 * u; cor = '#cdf6ff'; } }
    else if (i < 160) { const u = (qf - g_.impacto) / 40; if (u >= 0 && u <= 1) { const a = h1 * 6.28, el = h2 * 1.4, sp = 1.6 + 2.0 * h3; p = V3(GP.x + Math.cos(a) * Math.cos(el) * sp * u * 0.7, 1.0 + Math.sin(el) * sp * u * 0.7 - 1.5 * u * u, GP.z + Math.sin(a) * Math.cos(el) * sp * u * 0.7); k = 1.8 * (1 - u); cor = '#bff0ff'; } }
    else if (i < 200) { const u = (qf - f_.carga0 - h1 * (f_.solta - f_.carga0)) / 24; if (u >= 0 && u <= 1 && qf < f_.solta) { const r = 0.45 * (1 - E.in2(u)), a = h2 * 6.28 + u * 6; p = mao.clone().add(V3(Math.cos(a) * r, Math.sin(a) * r * 0.7 + 0.1 * u, Math.sin(a * 0.6) * r * 0.5)); k = 0.8 + 1.2 * u; cor = '#ffb060'; } }
    else if (i < 300) { // neve depois da quebra
      const u = (qf - g_.quebra + 10 - h1 * 90) / 230; if (u >= 0 && u <= 1) { const zz = (h3 - 0.5) * 4.5; p = V3(C0.x - 2.2 + h2 * 4.6 + Math.sin(u * 6 + i) * 0.12, 2.6 - u * 2.7, C0.z + zz); k = 1.1 * Math.sin(Math.PI * u); cor = '#e9f8ff'; } }
    else { // poeira dourada no ar o tempo todo (cena viva)
      const per = 9 + 6 * h1, u = ((tw / per) + h2) % 1; p = V3(C0.x + (h3 - 0.5) * 6 + Math.sin(tw * 0.3 + i) * 0.3, 0.1 + u * 2.6, C0.z + (hash(i + 9) - 0.5) * 6 + Math.cos(tw * 0.25 + i) * 0.3); k = (0.5 + 0.6 * hash(i + 4)) * Math.sin(Math.PI * u) * (1 - 0.7 * dim); cor = '#ffc890'; }
    if (p) m4.compose(p, qq.identity(), ss.set(k, k, k)); else m4.compose(vv.set(0, -9, 0), qq.identity(), ss.set(1e-4, 1e-4, 1e-4)); imP.setMatrixAt(i, m4); imP.setColorAt(i, corP.set(cor)); }
  imP.instanceMatrix.needsUpdate = true; imP.instanceColor.needsUpdate = true;
  // --- anéis: soltura (vira para a câmera) e onda no chão
  const sol0 = [[r_, '#fff4b0'], [f_, '#ffc070'], [g_, '#bff3ff'], [c_, '#c8ffb0']].find(([b]) => qf >= b.solta && qf < b.solta + 14);
  anel.visible = !!sol0; if (sol0) { const ua = (qf - sol0[0].solta) / 14; anel.position.copy(sol0[0] === g_ ? maoG : sol0[0] === c_ ? IA.clone().setY(0.8) : mao); anel.lookAt(cam.position); anel.scale.setScalar(0.3 + 2.6 * E.out3(ua)); anelMat.color.set(sol0[1]); anelMat.opacity = 1 - ua; }
  const ch0 = [[f_.impacto, '#ffb070', GP], [g_.impacto, '#bff3ff', GP], [s_.chao, '#ffd0a0', SOCO_P], [g_.quebra, '#dff6ff', GP]].find(([q0]) => qf >= q0 && qf < q0 + 30);
  anelChao.visible = !!ch0; if (ch0) { const ur = (qf - ch0[0]) / 30; anelChao.position.copy(ch0[2]).setY(0.03); anelChao.scale.setScalar(1 + 6 * E.out3(ur)); anelChao.material.color.set(ch0[1]); anelChao.material.opacity = 1 - ur; }
  // --- rastro (smear) do soco e dos arremessos da Ina
  { const op = qf > s_.desce - 4 && qf < s_.chao + 4 ? 1 - clamp((qf - s_.chao) / 4) : 0; if (op > 0) { smearG.userData.amostrar((tt) => punhoMundo(tt), tw, q(7), op); poseGolem(tw); golem.root.updateMatrixWorld(true); } else smearG.visible = false;
    const win = [[f_.solta - 4, f_.solta + 8], [r_.solta - 2, r_.solta + 8]].find(([a, b]) => qf > a && qf < b);
    if (win) { const op2 = 1 - clamp((qf - win[1] + 4) / 4); smearI.userData.amostrar((tt) => { const Pp = poseIna(tt); return { base: Pp.cotoveloR, ponta: maoPos(Pp) }; }, tw, q(5), op2); } else smearI.visible = false; }
  panoAnim(tw);
  // --- câmera
  const C = camEm(tw, t); cam.fov = C.fov; cam.position.copy(C.pos); cam.lookAt(C.alvo); cam.updateProjectionMatrix(); cam.translateX(C.sx); cam.translateY(C.sy); cam.rotateZ(C.rot); cam.updateMatrixWorld(true);
  U.uRimDir.value.copy(SUN).transformDirection(cam.matrixWorldInverse);
  sol.target.position.copy(C0); sol.position.copy(C0).addScaledVector(SUN, 14);
  bloom.strength = 0.36 + 0.3 * dim;
  // --- render 3D
  scene.updateMatrixWorld(true);
  composer.render();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.drawImage(glc, 0, 0, W, H);
  // --- 2D: brilhos de tela (poder = fonte de luz), raios de sol, primeiro plano desfocado
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const brilho = (pt, r, a, rgb) => { const [x, y, z] = proj(pt); if (z > 1) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); };
  { const [sx, sy, sz] = proj(C0.clone().addScaledVector(SUN, 60)); if (sz < 1) brilho(C0.clone().addScaledVector(SUN, 60), 1300, 0.38 * (1 - dim), '255,150,90'); else { const g = ctx.createLinearGradient(W, 0, 0, H * 0.6); g.addColorStop(0, `rgba(255,140,80,${0.22 * (1 - dim)})`); g.addColorStop(1, 'rgba(255,140,80,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); } }
  if (ativo) { const [b, , k] = ativo; const c = cargaDe(b, qf); const rgb = { raio: '255,245,170', cura: '170,255,170', fogo: '255,160,80', gelo: '150,225,255' }[k];
    if (qf > b.carga0 && qf < b.solta + 20) brilho(b === g_ ? maoG : b === c_ ? IA.clone().setY(0.7) : mao, 80 + 160 * c, (b === g_ ? 0.32 : 0.22) * c * (qf < b.solta ? 1 : Math.exp(-(qf - b.solta) / 6)), rgb); }
  if (qf > g_.impacto && qf < g_.quebra + 40) brilho(V3(GP.x, 1.0, GP.z), 520, 0.2 * Math.exp(-(qf - g_.impacto) / 25) + 0.07, '120,210,255');
  if (qf > g_.quebra) for (let i = 0; i < 12; i++) { const u = (qf - g_.quebra - i * 2) / 100; if (u < 0 || u > 1) continue; const p = GP.clone().lerp(GX0, i / 11).setY(0.2 + 0.5 * u); brilho(p, 100 + 180 * u, 0.15 * (1 - u), '200,235,255'); }
  ctx.restore();
  FX.raio.desenhar(ctx, qf, { B: r_, proj, alvo: V3(GP.x, 1.75, GP.z) }); FX.fogo.desenhar(ctx, qf, { B: f_, proj, alvo: V3(GP.x, 0.95, GP.z) }); FX.cura.desenhar(ctx, qf, { B: c_, proj, heroi: IA });
  { // primeiro plano: entulho desfocado que anda com a câmera (paralaxe)
    const yaw = Math.atan2(cam.getWorldDirection(vv).x, cam.getWorldDirection(vv).z); const off = ((yaw * 900) % 1400 + 1400) % 1400;
    ctx.save(); ctx.globalAlpha = 0.92; ctx.drawImage(FG, -off, H - 560, 1400 * 1.25, 700); ctx.drawImage(FG, 1400 * 1.25 - off, H - 560, 1400 * 1.25, 700); ctx.restore(); }
  { const g = ctx.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, 'rgba(8,6,20,0.55)'); g.addColorStop(1, 'rgba(8,6,20,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 420); }
  // flash de tela na soltura e no impacto (1 q cheio + véu curto)
  for (const [w0, a, cor] of [[r_.solta, 0.15, '255,250,210'], [f_.solta, 0.12, '255,220,170'], [g_.solta, 0.2, '225,248,255'], [s_.chao, 0.18, '255,230,210']]) { const u = qf - w0; if (u >= 0 && u < 4) { ctx.fillStyle = `rgba(${cor},${u < 1 ? a : a * 0.35})`; ctx.fillRect(0, 0, W, H); } }
  // --- HUD
  const hudA = clamp((qf - WB.hud) / 20) * (1 - clamp((qf - WB.respira - 230) / 40));
  hud(t, tw, hudA);
  let [hx, hy] = proj(V3(GP.x, 2.05, GP.z)); let [ix, iy] = proj(V3(IA.x, 1.35, IA.z));
  hx = clamp(hx, 260, 760); ix = clamp(ix, 320, 820); hy = clamp(hy, 540, 1150); iy = clamp(iy, 420, 1150); // números sempre dentro da área segura
  J.numeroDano(ctx, t, { t0: G_.raio.t + Tq(G_.raio.stop), valor: 124, tipo: 'crit', lado: 0 }, hx - 40, hy - 60, 1, F);
  J.numeroDano(ctx, t, { t0: G_.soco.t, valor: 64, tipo: 'sofre', lado: -1 }, ix, iy - 40, 1.3, F);
  J.numeroDano(ctx, t, { t0: G_.cura.t, valor: 58, tipo: 'cura', lado: 0 }, ix, iy - 60, 1.1, F);
  J.numeroDano(ctx, t, { t0: G_.fogo.t, valor: 98, tipo: 'fogo', lado: 1 }, hx - 20, hy - 30, 1.15, F);
  J.numeroDano(ctx, t, { t0: G_.gelo.t + Tq(G_.gelo.stop), valor: 178, tipo: 'crit', lado: 0 }, hx - 20, hy - 70, 1.15, F);
  const sx2 = 540, sy2 = 290;
  selo(t, G_.raio.t + Tq(G_.raio.stop + 14), G_.soco.t - 1.4, 'ATORDOADA', sx2, sy2 + 60, '#c89a10');
  selo(t, G_.fogo.t + Tq(16), G_.fogo.t + 2.4, 'QUEIMANDO', sx2, sy2 + 60, '#e2581e');
  selo(t, G_.gelo.t + Tq(G_.gelo.stop + 16), G_.quebra.t, 'CONGELADA', sx2, sy2 + 60, '#2f8fe0');
  // --- impact frames de anime nos críticos
  for (const [k, ACC, seed] of [['raio', '#ffd84a', 100], ['gelo', '#5fd6ff', 300]]) { const g = G_[k]; const kq = (t - g.t) * 60; if (kq >= 0 && kq < 12) {
    maskRender([ina, golem.root, ...(k === 'gelo' ? [imCr] : [])]); const a = k === 'raio' ? proj(V3(GP.x, 1.6, GP.z)) : proj(V3(GP.x, 1.0, GP.z)); const o = k === 'raio' ? [a[0], a[1] - 500] : proj(IA.clone().setY(0.8));
    let ux = a[0] - o[0], uy = a[1] - o[1]; const L = Math.hypot(ux, uy) || 1; impactFrame(ctx, kq, a[0], a[1], ux / L, uy / L, ACC, seed); } }
  // --- grão de filme
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.1; ctx.drawImage(GRAOS[Math.floor(t * 24) % 4], 0, 0, W, H); ctx.restore();
}

window.DUR = DUR;
window.seek = async (t) => { quadro(t); };
window.camInfo = (t) => { const tw = J.hitStop(t, GOLPES); const C = camEm(tw, t); return [C.pos.toArray(), C.alvo.toArray(), C.fov]; };
window.probe = () => {
  const r = { dur: DUR, golpes: GOLPES.map((g) => ({ k: g.k, t: +g.t.toFixed(3), stop: g.stop })), cam_parada_max_q: 0 }; let parada = 0, kAnt;
  for (let i = 0; i < DUR * 60; i++) { const t = i / 60, tw = J.hitStop(t, GOLPES); const C = camEm(tw, t); const k = C.pos.x * 1000 + C.pos.y * 100 + C.pos.z; if (kAnt !== undefined && Math.abs(k - kAnt) < 1e-4) parada++; else parada = 0; kAnt = k; r.cam_parada_max_q = Math.max(r.cam_parada_max_q, parada); }
  r.soco = SOCO_P.toArray().map((v) => +v.toFixed(2)); return r;
};
new FontFace('Titan', 'url(../fontes/TitanOne.woff2)').load().then((f) => { document.fonts.add(f); quadro(0); window.READY = true; });
