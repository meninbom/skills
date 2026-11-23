// EP01 "SÓ TEM GELO — 1 de vida" (~55,5 s). Exemplo de episódio narrado: os tempos do objeto R são amarrados à narração.
// Tudo de artista (KayKit, CC0). Código = luz, VFX, juice, câmera, HUD. Tempos em SEGUNDOS REAIS no objeto R (retemporizar pela voz depois).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { U, comContorno } from './toon/toon.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as J from '../kit_juice/juice.js';
import { E, q, clamp, lerp, hash, COR } from '../kit_juice/tokens.js';

const Q = new URLSearchParams(location.search);
const W = 1080, H = 1920, SS = Number(Q.get('ss') || 2), ESC = Number(Q.get('esc') || 1);
const RW = Math.round(W * ESC), RH = Math.round(H * ESC), IW = RW * SS, IH = RH * SS;
const F = 'Titan, sans-serif';
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const glc = document.createElement('canvas'); glc.width = IW; glc.height = IH;
const out = document.getElementById('c'); out.width = RW; out.height = RH; const ctx = out.getContext('2d');
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(IW, IH, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.localClippingEnabled = true;
U.uRes.value.set(IW, IH); U.uPx.value = SS * ESC;

// ================= TEMPO =================
// R = beats em segundos reais. HOLD = raio-X (cena congela, câmera continua). GOLPES = hit-stop.
const R = { levanta: 1.5, roleta: 3.55, spin: 1.1, encolhe: 5.2, acorda: 7.2, recua: 7.9, anda: 8.8, raise1: 9.6, tiro1: 10.4, bate1: 10.75, xray0: 13.15, xray1: 16.15,
  chao: 16.3, olho: 18.35, raise2: 18.9, tiro2: 19.55, nasce: 19.85, trava: 20.4, medidor: 21.2, mont0: 23.65, msplit: 1.1, mont1: 26.0, racha: 28.4,
  xp: 29.0, cheer: 29.3, vira: 30.9, rei: 32.3, flutua: 34.6, gota: 35.8, escolha: 36.9, fim: 43.2 };
const GOLPES = [{ t: R.racha, stop: 8, forca: 1.4 }];
const HOLD = R.xray1 - R.xray0;
function tCena(t) { const th = J.hitStop(t, GOLPES); return th - clamp(th - R.xray0, 0, HOLD); }
const Fq = (r) => tCena(r) * 60; // segundo real → quadro de cena
const DUR = R.fim;

const scene = new THREE.Scene();
const FUNDO_MASM = new THREE.Color('#0b0816'), FOG_MASM = new THREE.Fog('#0e0a1c', 5.5, 13);
scene.background = FUNDO_MASM; scene.fog = FOG_MASM;
const hemi = new THREE.HemisphereLight('#8a8cff', '#2a1838', 0.9); scene.add(hemi);
const chave = new THREE.DirectionalLight('#ffb070', 1.6); chave.position.set(3.5, 5, 4); chave.castShadow = true; chave.shadow.mapSize.set(2048, 2048);
Object.assign(chave.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 20 }); chave.shadow.bias = -0.0005; chave.shadow.normalBias = 0.03; scene.add(chave); scene.add(chave.target);
const lua = new THREE.DirectionalLight('#7f8cff', 1.1); lua.position.set(-2, 4, -6); scene.add(lua);
const HEMI0 = hemi.intensity, CHAVE0 = chave.intensity;

// ================= KAYKIT =================
const ldr = new GLTFLoader(); const cache = {};
async function glb(url) { if (!cache[url]) cache[url] = ldr.loadAsync(url); return cache[url]; }
async function pecaD(n) { try { return await glb(`../personagem/kaykit/dungeon/${n}.gltf.glb`); } catch (e) { return glb(`../personagem/kaykit/dungeon/${n}.glb`); } }
const gH = await glb('../personagem/kaykit/Mage.glb');
gH.scene.updateMatrixWorld(true); const hNat = new THREE.Box3().setFromObject(gH.scene).getSize(V3(0, 0, 0)).y;
const S = 1.15 / hNat, T = 4 * S;
function sombras(o) { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; } }); return o; }
async function poe(n, x, z, ry = 0, y = 0, k = 1) { const g = await pecaD(n); const o = g.scene.clone(); o.scale.setScalar(S * k); o.position.set(x, y, z); o.rotation.y = ry; scene.add(sombras(o)); return o; }

// ---------- masmorra ----------
const ZF = -3.5 * T;
{
  const ps = [];
  for (let i = -2; i <= 2; i++) for (let j = -3; j <= 3; j++) ps.push(poe(hash(i * 7 + j) > 0.75 ? 'floor_tile_large_rocks' : 'floor_tile_large', i * T, j * T, Math.floor(hash(i + j * 3) * 4) * Math.PI / 2));
  for (let i = -2; i <= 2; i++) ps.push(poe(i === 0 ? 'wall_archedwindow_gated' : (i === -1 ? 'wall_cracked' : 'wall'), i * T, ZF));
  for (let i = -2; i <= 2; i++) ps.push(poe(i === 1 ? 'wall_doorway_sides' : 'wall', i * T, 3.5 * T, Math.PI));
  for (const sx of [-1, 1]) for (let j = -3; j <= 3; j++) ps.push(poe(j === -1 && sx < 0 ? 'wall_doorway_sides' : (hash(j + sx) > 0.6 ? 'wall_cracked' : 'wall'), sx * 2.5 * T, j * T, Math.PI / 2));
  for (const sx of [-1, 1]) for (const j of [-2.5, -0.5]) ps.push(poe('pillar', sx * 1.55 * T, j * T, 0));
  ps.push(poe('banner_patternA_red', -1 * T, ZF + 0.5 * S, 0), poe('banner_patternA_red', 1 * T, ZF + 0.5 * S, 0));
  ps.push(poe('barrel_large', -2.05 * T, -2.9 * T, 0.4), poe('barrel_small_stack', -1.9 * T, -2.3 * T, 1.2), poe('box_stacked', 2.0 * T, -2.9 * T, -0.3));
  ps.push(poe('chest_gold', 1.85 * T, -1.9 * T, -Math.PI / 2 + 0.3), poe('rubble_half', 1.95 * T, 0.3 * T, -Math.PI / 2), poe('candle_triple', -2.15 * T, -1.25 * T, 0.5));
  ps.push(poe('candle_lit', 1.95 * T, -2.35 * T, 0), poe('sword_shield_broken', -1.4 * T, 0.2 * T, 0.9), poe('coin_stack_small', 1.7 * T, -1.6 * T, 0));
  ps.push(poe('floor_foundation_allsides', 0, -2.9 * T, 0, -0.5 * T * 0.12, 0.6));
  await Promise.all(ps);
}
const TOCHAS = [];
const texFogo = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,250,220,1)'); r.addColorStop(0.25, 'rgba(255,200,90,0.9)'); r.addColorStop(0.6, 'rgba(255,110,30,0.35)'); r.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
async function tocha(x, z, ry) {
  await poe('torch_mounted', x, z, ry, 2.3 * S);
  const d = V3(Math.sin(ry), 0, Math.cos(ry)); const p = V3(x, 2.3 * S + 0.72 * S, z).addScaledVector(d, 0.42 * S);
  const sp = []; for (let k = 0; k < 3; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFogo, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.position.copy(p); scene.add(s); sp.push(s); }
  const L = new THREE.PointLight('#ff9a48', 3.2, 0, 2); L.position.copy(p).addScaledVector(d, 0.15); scene.add(L);
  TOCHAS.push({ p, sp, L, sem: TOCHAS.length * 1.7 });
}
await Promise.all([tocha(-2.5 * T + 0.5 * S, -2 * T, Math.PI / 2), tocha(-2.5 * T + 0.5 * S, 0, Math.PI / 2), tocha(2.5 * T - 0.5 * S, -2 * T, -Math.PI / 2), tocha(2.5 * T - 0.5 * S, 0, -Math.PI / 2),
  tocha(-0.5 * T, ZF + 0.5 * S, 0), tocha(0.5 * T, ZF + 0.5 * S, 0), tocha(-0.5 * T, 3.5 * T - 0.5 * S, Math.PI), tocha(1.5 * T, 3.5 * T - 0.5 * S, Math.PI), tocha(-2.5 * T + 0.5 * S, 2 * T, Math.PI / 2), tocha(2.5 * T - 0.5 * S, 2 * T, -Math.PI / 2)]);

// ---------- montanha (corte do fato real), longe da masmorra ----------
const MX = 80; const montanha = new THREE.Group(); scene.add(montanha);
const ceuMont = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 512; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 512);
  [[0, '#2b3a7a'], [0.45, '#6b7fc4'], [0.7, '#e7a6b8'], [1, '#ffd7b0']].forEach(([s, k]) => gr.addColorStop(s, k)); g.fillStyle = gr; g.fillRect(0, 0, 64, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const FOG_MONT = new THREE.Fog('#c9b5d8', 6, 26);
const ROCHA = { halves: [], planes: [], n: V3(1, 0.22, 0).normalize() };
{
  const chao = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ color: '#eef4ff', roughness: 0.9 })); chao.rotation.x = -Math.PI / 2; chao.position.set(MX, 0, 0); chao.receiveShadow = true; montanha.add(chao);
  const fl = async (n) => (await glb(`../personagem/kaykit/forest/${n}.gltf`)).scene;
  const base = await fl('Rock_1_K_Color1');
  for (const s of [1, -1]) { // duas metades da mesma rocha, cortadas por um plano inclinado
    const pl = new THREE.Plane(ROCHA.n.clone().multiplyScalar(s), 0); ROCHA.planes.push(pl);
    const o = base.clone(true); o.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.clippingPlanes = [pl]; m.material.side = THREE.DoubleSide; m.castShadow = m.receiveShadow = true; } });
    o.scale.setScalar(0.62); o.position.set(MX, 0, 0); montanha.add(o); ROCHA.halves.push(o);
  }
  const extras = [['Rock_2_E_Color1', -4.5, -6, 0.8], ['Rock_1_N_Color1', 5, -8, 1.1], ['Rock_2_G_Color1', 3.5, -3.5, 0.5], ['Rock_1_G_Color1', -2.6, -1.6, 0.5], ['Rock_2_C_Color1', 2.2, 0.8, 0.45]];
  for (const [n, x, z, k] of extras) { const o = (await fl(n)).clone(true); o.scale.setScalar(k); o.position.set(MX + x, 0, z); o.rotation.y = x; sombras(o); montanha.add(o); }
  for (let i = 0; i < 9; i++) { const o = (await fl(['Tree_1_A_Color1', 'Tree_2_B_Color1', 'Tree_3_A_Color1'][i % 3])).clone(true); o.scale.setScalar(0.55 + 0.3 * hash(i)); o.position.set(MX - 9 + i * 2.3 + hash(i + 3), 0, -9 - hash(i + 5) * 5); sombras(o); montanha.add(o); }
}
const GELO_FENDA = []; for (let i = 0; i < 16; i++) GELO_FENDA.push({ y: 0.15 + i * 0.12, s: 0.35 + 0.25 * hash(i + 300), inc: [(hash(i) - 0.5) * 0.6, hash(i + 1) * 6, (hash(i + 2) - 0.5) * 0.6], t0: R.mont0 + 0.15 + i * 0.035 });

// ================= PERSONAGENS =================
const UNICO = new Set(['Spellcast_Raise', 'Spellcast_Shoot', 'Cheer', 'Skeletons_Awaken_Floor', 'Skeletons_Awaken_Floor_Long', 'Death_C_Skeletons', 'Hit_A', 'Hit_B', 'Block', 'Lie_StandUp']);
function montar(gltf, esconder = []) {
  const o = gltf.scene; sombras(o); o.scale.setScalar(S); scene.add(o);
  o.traverse((m) => { if (m.isMesh && esconder.some((n) => m.name.startsWith(n))) m.visible = false; });
  const mixer = new THREE.AnimationMixer(o); const ACT = {};
  for (const c of gltf.animations) { const a = mixer.clipAction(c); a.play(); a.setEffectiveWeight(0); ACT[c.name] = a; }
  let mao = null, maoE = null, cab = null; o.traverse((b) => { const nn = b.name.replace('.', ''); if (nn === 'handslotr') mao = b; if (nn === 'handslotl') maoE = b; if (nn === 'head') cab = b; });
  return { o, mixer, ACT, mao, maoE, cab, dur: (n) => ACT[n].getClip().duration };
}
function tempoClipe(P, n, q0, qf, cap) { const t = Math.max(0, (Math.min(qf, cap ?? 1e9) - q0) / 60); return UNICO.has(n) ? Math.min(t, P.dur(n) - 1e-3) : t % P.dur(n); }
function animar(P, SEQ, qf) {
  let i = 0; while (i + 1 < SEQ.length && SEQ[i + 1][0] <= qf) i++;
  for (const a of Object.values(P.ACT)) a.setEffectiveWeight(0);
  const [q0, n0, c0] = SEQ[i]; const w = i > 0 ? clamp((qf - q0) / (SEQ[i][3] || 10)) : 1;
  P.ACT[n0].time = tempoClipe(P, n0, q0, qf, c0); P.ACT[n0].setEffectiveWeight(w);
  if (w < 1) { const [qp, np, cp] = SEQ[i - 1]; P.ACT[np].time = tempoClipe(P, np, qp, qf, cp); P.ACT[np].setEffectiveWeight(1 - w); }
  P.mixer.update(0);
}
// Lia (maga)
const HERO = montar(gH, ['Spellbook', '2H_Staff']);
const BASE = V3(-0.3, 0, 1.45);
const stD = HERO.dur('Lie_StandUp') * 60;
const SEQ_H = [[0, 'Lie_Idle'], [Fq(R.levanta), 'Lie_StandUp', null, 6], [Fq(R.levanta) + stD - 8, 'Idle', null, 12], [Fq(R.recua), 'Walking_Backwards'], [Fq(R.recua) + 45, 'Idle'],
  [Fq(R.raise1), 'Spellcast_Raise'], [Fq(R.tiro1) - 6, 'Spellcast_Shoot', null, 6], [Fq(R.tiro1) + 50, 'Idle', null, 14],
  [Fq(R.raise2), 'Spellcast_Raise'], [Fq(R.raise2) + 40, 'Spellcasting'], [Fq(R.tiro2) - 6, 'Spellcast_Shoot', null, 6], [Fq(R.tiro2) + 60, 'Idle', null, 14],
  [Fq(R.cheer), 'Cheer'], [Fq(R.cheer) + HERO.dur('Cheer') * 60 - 6, 'Idle', null, 14], [Fq(R.rei) + 40, 'Blocking', null, 14]];
// esqueletos
const [gW, gM, gR, gC, armas] = await Promise.all(['Skeleton_Warrior', 'Skeleton_Minion', 'Skeleton_Rogue', 'Skeleton_Mage'].map((n) => glb(`../personagem/kaykit/skel/${n}.glb`)).concat([
  Promise.all(['Skeleton_Blade', 'Skeleton_Axe', 'Skeleton_Shield_Small_A', 'Skeleton_Staff'].map((n) => glb(`../personagem/kaykit/skel/${n}.gltf`)))]));
const NOMES_ARMA = ['Skeleton_Blade', 'Skeleton_Axe', 'Skeleton_Shield_Small_A', 'Skeleton_Staff'];
const VEL = 0.14; // m/s de cena
const SK = [[gW, V3(-0.95, 0, -2.25), 0, 'Skeleton_Blade', 'Skeleton_Shield_Small_A'], [gM, V3(0.15, 0, -2.7), 1, 'Skeleton_Axe'], [gR, V3(1.1, 0, -2.2), 2, 'Skeleton_Blade']].map(([g, p, i, a1, a2]) => {
  const P = montar(g); P.p0 = p; P.i = i; P.cong = Fq(R.trava) + i * 6; P.queb = Fq(R.racha) + 2 + i * 7;
  if (a1) P.mao.add(sombras(armas[NOMES_ARMA.indexOf(a1)].scene.clone())); if (a2) P.maoE.add(sombras(armas[NOMES_ARMA.indexOf(a2)].scene.clone()));
  const aw = Fq(R.acorda) + i * 12, awD = P.dur('Skeletons_Awaken_Floor') * 60; P.anda = Math.max(Fq(R.anda) + i * 10, aw + awD + 4);
  P.SEQ = [[0, 'Skeletons_Inactive_Floor_Pose'], [aw, 'Skeletons_Awaken_Floor', null, 4], [aw + awD - 8, 'Idle_Combat'], [P.anda, 'Walking_D_Skeletons', P.cong, 14], [P.queb, 'Death_C_Skeletons', null, 4]];
  return P;
});
function posSK(P, qf) { const d = V3(BASE.x - P.p0.x, 0, BASE.z - P.p0.z).normalize(); const k = Math.max(0, Math.min(qf, P.cong) - P.anda) / 60; return P.p0.clone().addScaledVector(d, k * VEL); }
const CHEFE = montar(gC); CHEFE.p0 = V3(0.15, 0, -2.9 * T);
{ CHEFE.mao.add(sombras(armas[3].scene.clone())); const aw = Fq(R.rei), awD = CHEFE.dur('Skeletons_Awaken_Floor_Long') * 60;
  CHEFE.SEQ = [[0, 'Skeletons_Inactive_Floor_Pose'], [aw, 'Skeletons_Awaken_Floor_Long', null, 4], [aw + awD - 10, 'Spellcasting', null, 16]]; }
const ALT_TABLADO = 0.07 * T * 0.6;
function olhos(P, cor) { const ms = []; P.o.traverse((m) => { if (m.isMesh && m.name.endsWith('_Eyes')) { m.material = new THREE.MeshBasicMaterial({ color: '#000' }); ms.push(m.material); } }); P.olhos = ms; P.corOlho = new THREE.Color(cor); }
SK.forEach((P) => olhos(P, '#6ff7ff')); olhos(CHEFE, '#d36bff');
for (const P of SK) { P.mats = []; P.o.traverse((m) => { if (m.isMesh && !m.name.endsWith('_Eyes')) { m.material = m.material.clone(); P.mats.push(m.material); } }); P.cor0 = P.mats.map((m) => m.color.clone()); }
const luzChefe = new THREE.PointLight('#c75bff', 0, 0, 2); scene.add(luzChefe);

// ================= POÇAS =================
// em volta de onde cada esqueleto vai parar + algumas soltas; brilham com as tochas, viram gelo no beat 8
const POCAS = [];
for (const P of SK) { const f = posSK(P, P.cong); for (let k = 0; k < 3; k++) POCAS.push({ x: f.x + (hash(k + P.i * 9) - 0.5) * 0.35, z: f.z + (hash(k + P.i * 9 + 4) - 0.5) * 0.3, r: 0.22 + 0.12 * hash(k + P.i * 5), P }); }
for (let k = 0; k < 7; k++) POCAS.push({ x: -1.3 + hash(k + 60) * 2.8, z: -1.6 + hash(k + 61) * 2.0, r: 0.1 + 0.12 * hash(k + 62), P: null });
const geoPoca = (() => { const g = new THREE.CircleGeometry(1, 28); { const uv = g.attributes.uv; } const p = g.attributes.position; for (let i = 1; i < p.count; i++) { const a = Math.atan2(p.getY(i), p.getX(i)); const r = 1 + 0.18 * Math.sin(a * 3 + 1) + 0.1 * Math.sin(a * 5 + 2); p.setXY(i, p.getX(i) * r, p.getY(i) * r); } g.rotateX(-Math.PI / 2); return g; })();
const texPoca = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const r = g.createRadialGradient(128, 128, 20, 128, 128, 128);
  r.addColorStop(0, 'rgba(18,40,90,0.95)'); r.addColorStop(0.75, 'rgba(40,90,160,0.9)'); r.addColorStop(0.9, 'rgba(150,215,255,0.95)'); r.addColorStop(1, 'rgba(150,215,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(255,190,120,0.55)'; g.lineWidth = 5; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(70 + i * 22, 95 + i * 18); g.lineTo(120 + i * 22, 90 + i * 18); g.stroke(); }
  g.strokeStyle = 'rgba(190,235,255,0.6)'; g.lineWidth = 3; g.beginPath(); g.ellipse(150, 150, 40, 26, 0, 0, 6.28); g.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const matPoca = new THREE.MeshBasicMaterial({ map: texPoca, color: '#ffffff', transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
const ORIG_POCA = POCAS.map((p) => { const m = new THREE.Mesh(geoPoca, matPoca); m.position.set(p.x, 0.024, p.z); m.scale.set(p.r * 1.3, 1, p.r); m.rotation.y = hash(p.x * 9) * 6; m.receiveShadow = true; scene.add(m); return m; });
const COR_POCA0 = new THREE.Color('#16233f'), COR_POCA_GELO = new THREE.Color('#bfe6ff');

// ================= GELO =================
const gUni = { uT: { value: 0 }, uBrilho: { value: 1 } };
function matGelo(base, clip) {
  return new THREE.ShaderMaterial({ uniforms: { ...gUni, uBase: { value: new THREE.Color(base) } },
    vertexShader: `varying vec3 vV; varying vec3 vW; void main(){ vec4 p = vec4(position,1.0);
#ifdef USE_INSTANCING
  p = instanceMatrix * p;
#endif
  vec4 w = modelMatrix * p; vW = w.xyz; vec4 mv = viewMatrix * w; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uBase; uniform float uBrilho, uT; varying vec3 vV; varying vec3 vW;
      void main(){ vec3 n = normalize(cross(dFdx(vV), dFdy(vV))); vec3 v = normalize(vV);
        float fr = pow(1.0 - abs(dot(n, v)), 4.0); float f = clamp(0.5 + 0.55 * n.x + 0.45 * n.y, 0.0, 1.0);
        vec3 fundo = vec3(0.015, 0.09, 0.36), claro = vec3(0.7, 0.93, 1.0);
        vec3 c = mix(fundo, uBase, smoothstep(0.1, 0.7, f)); c = mix(c, claro, smoothstep(0.78, 0.95, f) * 0.85);
        c += claro * smoothstep(0.45, 1.3, vW.y) * 0.22; c += vec3(0.75, 0.95, 1.0) * fr * 1.1;
        c += vec3(0.8, 0.95, 1.0) * smoothstep(0.92, 1.0, sin(vW.y * 9.0 - uT * 6.0 + vW.x * 4.0)) * 0.25;
        gl_FragColor = vec4(c * uBrilho, 1.0);
        #include <colorspace_fragment>
      }` });
}
const MGELO = matGelo('#1c63e0'), MGELO2 = matGelo('#2f7cf0');
const geoCristal = new THREE.OctahedronGeometry(1, 0); geoCristal.scale(0.11, 0.55, 0.11); geoCristal.translate(0, 0.42, 0);
// cristais do chão (beat 8): coroa em volta dos pés + nas poças
const CR = [];
for (const P of SK) { const f = posSK(P, P.cong);
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + P.i; CR.push({ x: f.x + Math.cos(a) * 0.2, z: f.z + Math.sin(a) * 0.2, s: 0.5 + 0.25 * hash(k + 70 + P.i), inc: [Math.sin(a) * 0.4, a, -Math.cos(a) * 0.4], t0: Fq(R.trava) + P.i * 6 + (k % 4) * 2, P }); } }
POCAS.forEach((p, j) => { const n = p.P ? 3 : 2; for (let k = 0; k < n; k++) { const a = hash(j * 3 + k) * 6.28; CR.push({ x: p.x + Math.cos(a) * p.r * 0.6, z: p.z + Math.sin(a) * p.r * 0.5, s: 0.22 + 0.2 * hash(j + k + 40), inc: [(hash(j + k) - 0.5) * 0.7, a, (hash(j + k + 1) - 0.5) * 0.7], t0: Fq(R.nasce) + 4 + hash(j + 90) * 18, P: p.P }); } });
const quebraDe = (c) => (c.P ? c.P.queb - 3 : Fq(R.racha) + 6 + (c.t0 % 7));
const imCr = new THREE.InstancedMesh(geoCristal, MGELO, CR.length); imCr.frustumCulled = false; scene.add(imCr); comContorno(imCr, 3.5, '#0a1640');
const imFenda = new THREE.InstancedMesh(geoCristal, MGELO, GELO_FENDA.length); imFenda.frustumCulled = false; scene.add(imFenda);
// projéteis do 1º tiro (falha)
const projeteis = SK.map(() => { const g = new THREE.OctahedronGeometry(1, 0); g.scale(0.05, 0.05, 0.2); const m = new THREE.Mesh(g, MGELO); m.visible = false; scene.add(m); return m; });
const NCACO = 320; const imCaco = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.05, 0), MGELO2, NCACO); imCaco.frustumCulled = false; scene.add(imCaco);
const NP = 460; const imP = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.011, 1), new THREE.MeshBasicMaterial({ color: '#e6fbff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), NP); imP.frustumCulled = false; scene.add(imP);
const NPO = 90; const imPo = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.008, 0), new THREE.MeshBasicMaterial({ color: '#ffc98a', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }), NPO); imPo.frustumCulled = false; scene.add(imPo);
const NPR = 80; const imPr = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.014, 1), new THREE.MeshBasicMaterial({ color: '#d47bff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), NPR); imPr.frustumCulled = false; scene.add(imPr);
const anelMat = new THREE.MeshBasicMaterial({ color: '#bff3ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const anel = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 8, 64), anelMat); scene.add(anel);
const anelChefe = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.46, 64), new THREE.MeshBasicMaterial({ color: '#c46bff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); anelChefe.rotation.x = -Math.PI / 2; scene.add(anelChefe);
const gota = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), new THREE.MeshStandardMaterial({ color: '#9fd8ff', roughness: 0.05, metalness: 0.2, emissive: '#2a5fa0' })); gota.scale.set(1, 1.5, 1); scene.add(gota);
const anelGota = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.04, 40), new THREE.MeshBasicMaterial({ color: '#cfeaff', transparent: true, depthWrite: false, side: THREE.DoubleSide })); anelGota.rotation.x = -Math.PI / 2; scene.add(anelGota);
// rachaduras de luz no chão: da Lia até cada poça grande (beat 8)
const rachMat = new THREE.ShaderMaterial({ uniforms: { uP: { value: 0 }, uA: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform float uP, uA; varying vec2 vU; float h(float x){ return fract(sin(x*127.1)*43758.5); }
    void main(){ float x = vU.x; if (x > uP) discard; float zig = (h(floor(x*40.0)) - 0.5) * 0.5 * (1.0 - abs(fract(x*40.0)-0.5)*2.0) + (h(floor(x*13.0)+3.0)-0.5)*0.35;
      float d = abs(vU.y - 0.5 - zig*0.5); float a = smoothstep(0.07, 0.0, d) + smoothstep(0.25, 0.0, d) * 0.35; float ponta = smoothstep(uP - 0.06, uP, x) * 1.5 + 1.0;
      gl_FragColor = vec4(vec3(0.55, 0.9, 1.0) * a * ponta * uA, 1.0); }` });
const RACHAS = SK.map((P) => { const f = posSK(P, P.cong); const o = V3(BASE.x + 0.05, 0, BASE.z + 0.3 - 0.3); const len = Math.hypot(f.x - o.x, f.z - o.z);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.3), rachMat); m.rotation.x = -Math.PI / 2; m.position.set((o.x + f.x) / 2, 0.026, (o.z + f.z) / 2); m.rotation.z = Math.atan2(o.z - f.z, f.x - o.x); scene.add(m); return m; });
const luzMao = new THREE.PointLight('#bfe8ff', 0, 0, 2); scene.add(luzMao);
const luzImp = new THREE.PointLight('#8fe0ff', 0, 0, 2); scene.add(luzImp);
const COR_GELO = new THREE.Color('#a9dcff'), EMI_GELO = new THREE.Color('#1b4fa8');

// ================= CÂMERA =================
const cam = new THREE.PerspectiveCamera(46, W / H, 0.05, 200);
const composer = new EffectComposer(renderer); composer.setSize(IW, IH);
composer.addPass(new RenderPass(scene, cam)); const bloom = new UnrealBloomPass(new THREE.Vector2(IW / 2, IH / 2), 0.4, 0.5, 0.85); composer.addPass(bloom); composer.addPass(new OutputPass());
const proj = (v) => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };
const HP_REC = V3(0.05 * 0.35, 0, 0.35); const HPF = BASE.clone().add(HP_REC); // onde a Lia fica depois de recuar
// chaves: [segundo real, pos, alvo, fov]. Interpolação suave entre chaves (câmera nunca para).
const CAM = [
  [0.0, V3(0.5, 0.75, 0.55), V3(-0.3, 0.15, 1.5), 40],
  [R.levanta + 0.6, V3(0.65, 1.05, 0.0), V3(-0.3, 0.55, 1.55), 42],
  [R.encolhe - 0.1, V3(0.9, 1.25, -0.6), V3(-0.3, 0.75, 1.6), 44],
  [R.acorda - 0.2, V3(0.8, 1.6, 4.0), V3(-0.1, 0.4, -1.2), 46],
  [R.acorda + 1.6, V3(0.6, 1.15, 3.4), V3(0.1, 0.45, -1.8), 46],
  [R.raise1 - 0.1, V3(0.55, 1.2, 3.6), V3(0.0, 0.55, -1.0), 44],
  [R.bate1 + 0.4, V3(0.75, 1.1, 3.0), V3(0.1, 0.55, -1.2), 42],
  [R.xray0 - 0.3, V3(1.6, 1.25, 1.6), V3(0.0, 0.6, -0.9), 44],
  [R.xray0 + 1.0, V3(1.5, 1.15, 0.5), V3(0.15, 0.6, -1.6), 42],
  [R.xray1, V3(1.35, 1.1, 0.3), V3(0.15, 0.6, -1.6), 42],
  [R.chao + 0.6, V3(1.1, 0.65, 0.4), V3(0.15, 0.05, -1.25), 44],
  [R.olho - 0.5, V3(0.95, 0.6, 0.5), V3(0.05, 0.05, -1.2), 44],
  [R.olho + 0.2, V3(0.1, 0.85, 0.15), V3(-0.28, 0.82, 1.8), 36],
  [R.raise2 + 0.25, V3(0.05, 0.85, 0.1), V3(-0.28, 0.8, 1.8), 36],
  [R.tiro2 + 0.3, V3(2.5, 1.4, 1.5), V3(0.0, 0.35, -0.8), 46],
  [R.mont0, V3(2.2, 1.25, 0.9), V3(0.05, 0.4, -0.9), 44],
  [R.mont1, V3(1.6, 0.6, 0.9), V3(0.1, 0.5, -1.0), 44],
  [R.racha - 0.2, V3(1.05, 0.7, 0.2), V3(0.1, 0.5, -1.0), 38],
  [R.racha + 0.5, V3(2.3, 1.35, 1.3), V3(0.0, 0.5, -0.8), 46],
  [R.cheer + 0.7, V3(1.15, 1.1, -0.4), V3(HPF.x, 0.8, HPF.z), 46],
  [R.rei - 0.05, V3(1.05, 1.05, -0.3), V3(HPF.x, 0.8, HPF.z), 44],
  [R.rei + 0.12, V3(0.45, 1.05, -1.0), V3(0.15, 0.8, CHEFE.p0.z), 42],
  [R.rei + 1.2, V3(0.35, 1.0, -1.4), V3(0.15, 0.75, CHEFE.p0.z), 40],
  [R.flutua + 0.2, V3(0.3, 0.8, -1.9), V3(0.15, 0.65, CHEFE.p0.z), 40],
  [R.gota + 0.6, V3(0.4, 0.65, -2.1), V3(0.15, 0.4, CHEFE.p0.z), 40],
  [R.escolha + 0.4, V3(0.45, 0.95, -1.6), V3(0.15, 0.75, CHEFE.p0.z), 40],
  [R.fim, V3(0.35, 0.9, -2.2), V3(0.15, 0.8, CHEFE.p0.z), 38]];
// montanha (corte seco)
const CAM_M = [[R.mont0, V3(MX + 1.2, 1.6, 4.6), V3(MX, 1.1, 0.4), 44], [R.mont1, V3(MX + 0.8, 1.4, 3.8), V3(MX, 1.0, 0.4), 42]];
function interp(L, t) {
  let i = 0; while (i + 1 < L.length && L[i + 1][0] <= t) i++; if (i + 1 >= L.length) return { pos: L[i][1].clone(), alvo: L[i][2].clone(), fov: L[i][3] };
  const [t0, p0, a0, f0] = L[i], [t1, p1, a1, f1] = L[i + 1]; const k = E.io3((t - t0) / (t1 - t0));
  return { pos: p0.clone().lerp(p1, k), alvo: a0.clone().lerp(a1, k), fov: lerp(f0, f1, k) };
}
const naMontanha = (t) => t >= R.mont0 && t < R.mont1;
function camEm(t, tw) {
  const C = interp(naMontanha(t) ? CAM_M : CAM, t);
  C.pos.x += Math.sin(t * 0.6) * 0.03; C.pos.y += Math.sin(t * 0.8) * 0.015;
  const tr = J.trauma(t, [...GOLPES, { t: R.tiro1, forca: 0.35 }, { t: R.tiro2, forca: 0.5 }, { t: R.mont0 + R.msplit, forca: 0.9 }, { t: R.rei + 1.2, forca: 0.45 }, { t: R.racha - 1.6, forca: 0.22 }, { t: R.racha - 1.0, forca: 0.3 }, { t: R.racha - 0.45, forca: 0.38 }]);
  const zoom = (t >= R.racha ? 5 * Math.exp(-(t - R.racha) * 6) : 0);
  C.pos.add(V3(tr.x * 0.6, tr.y * 0.6, 0)); C.roll = tr.rot; C.fov -= zoom; return C;
}

// ================= HUD =================
function txt(s, x, y, tam, cor = '#fff', al = 'center', borda = 12) { ctx.font = `${tam}px ${F}`; ctx.textAlign = al; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = borda; ctx.strokeStyle = COR.tinta; ctx.strokeText(s, x, y); ctx.fillStyle = cor; ctx.fillText(s, x, y); }
function coracao(x, y, r, cor) { ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.moveTo(0, r * 0.35); ctx.bezierCurveTo(-r * 1.1, -r * 0.4, -r * 0.5, -r * 1.1, 0, -r * 0.45); ctx.bezierCurveTo(r * 0.5, -r * 1.1, r * 1.1, -r * 0.4, 0, r * 0.35); ctx.closePath(); ctx.fillStyle = cor; ctx.fill(); ctx.lineWidth = r * 0.18; ctx.strokeStyle = COR.tinta; ctx.stroke(); ctx.restore(); }
function iconeMagia(tipo, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  if (tipo === 'gelo') { ctx.strokeStyle = '#bff0ff'; ctx.lineWidth = r * 0.16; ctx.lineCap = 'round'; for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, -r * 0.7); ctx.lineTo(0, r * 0.7); ctx.stroke(); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, s * r * 0.4); ctx.lineTo(r * 0.22, s * r * 0.6); ctx.moveTo(0, s * r * 0.4); ctx.lineTo(-r * 0.22, s * r * 0.6); ctx.stroke(); } } }
  else if (tipo === 'fogo') { ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(0, -r * 0.8); ctx.quadraticCurveTo(r * 0.8, 0, r * 0.4, r * 0.6); ctx.quadraticCurveTo(0, r * 0.85, -r * 0.4, r * 0.6); ctx.quadraticCurveTo(-r * 0.8, 0, 0, -r * 0.8); ctx.fill(); ctx.fillStyle = '#ffe07a'; ctx.beginPath(); ctx.arc(0, r * 0.3, r * 0.28, 0, 6.28); ctx.fill(); }
  else if (tipo === 'raio') { ctx.fillStyle = '#ffe14a'; ctx.beginPath(); ctx.moveTo(r * 0.15, -r * 0.8); ctx.lineTo(-r * 0.4, r * 0.1); ctx.lineTo(0, r * 0.1); ctx.lineTo(-r * 0.15, r * 0.8); ctx.lineTo(r * 0.4, -r * 0.1); ctx.lineTo(0, -r * 0.1); ctx.closePath(); ctx.fill(); }
  else if (tipo === 'cura') { ctx.fillStyle = '#5fe36a'; ctx.fillRect(-r * 0.2, -r * 0.65, r * 0.4, r * 1.3); ctx.fillRect(-r * 0.65, -r * 0.2, r * 1.3, r * 0.4); }
  else if (tipo === 'cadeado') { ctx.strokeStyle = '#8a8fa8'; ctx.lineWidth = r * 0.15; ctx.beginPath(); ctx.arc(0, -r * 0.15, r * 0.3, Math.PI, 0); ctx.stroke(); ctx.fillStyle = '#8a8fa8'; ctx.beginPath(); ctx.roundRect(-r * 0.45, -r * 0.15, r * 0.9, r * 0.7, r * 0.12); ctx.fill(); }
  ctx.restore();
}
// HUD da Lia: vida 1/1 (pisca vermelho) + 4 slots (roleta → GELO). Grande no começo, encolhe pro canto.
function hudLia(t) {
  if (t < 0.6 || t > R.escolha) return;
  const ent = E.outBack((t - 0.6) / q(14)), enc = E.io3((t - R.encolhe) / 0.7); const sai = 1 - clamp((t - (R.escolha - 0.3)) / 0.3);
  ctx.save(); ctx.globalAlpha = sai;
  // vida
  { const x = lerp(540, 200, enc), y = lerp(300, 125, enc), k = lerp(1.25, 0.7, enc) * ent; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = COR.hudFundo; ctx.strokeStyle = '#ff5a6e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(-190, -54, 380, 108, 28); ctx.fill(); ctx.stroke();
    const pis = 0.5 + 0.5 * Math.sin(t * 9); coracao(-120, 4, 46, `rgb(${226},${52 + 60 * pis},${71 + 50 * pis})`);
    txt('1 / 1', 40, 4, 66, '#ff8090', 'center', 12); ctx.restore(); }
  // slots
  if (t > R.roleta) { const u = t - R.roleta; const x0 = lerp(540, 240, enc), y0 = lerp(560, 235, enc), k = lerp(1.0, 0.55, enc) * E.outBack(u / q(12));
    ctx.save(); ctx.translate(x0, y0); ctx.scale(k, k);
    const TIPOS = ['fogo', 'raio', 'cura', 'gelo'];
    for (let s = 0; s < 4; s++) { const x = (s - 1.5) * 150 + (enc > 0.5 ? (s - 1.5) * 0 : 0); const pop = s === 0 && u > R.spin ? 1 + 0.25 * Math.exp(-(u - R.spin) * 8) : 1;
      ctx.save(); ctx.translate(x, 0); ctx.scale(pop, pop); ctx.fillStyle = s === 0 ? 'rgba(20,40,80,0.9)' : 'rgba(18,18,30,0.85)'; ctx.strokeStyle = s === 0 && u > R.spin ? '#9fe8ff' : '#4a4f66'; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(-62, -62, 124, 124, 22); ctx.fill(); ctx.stroke();
      if (s === 0) { if (u < R.spin) { const vel = 14 * (1 - E.out3(u / R.spin)) + 1; const idx = Math.floor(u * vel * 2.2) % 4; iconeMagia(TIPOS[idx], 0, 0, 52); } else iconeMagia('gelo', 0, 0, 52); }
      else iconeMagia('cadeado', 0, 0, 52);
      ctx.restore(); }
    if (u > R.spin) { const a = E.out3((u - R.spin) / 0.3); ctx.globalAlpha = sai * a; txt('GELO', -225, 112, 54, '#9fe8ff', 'center', 10); }
    ctx.restore(); }
  ctx.restore();
}
function raioX(t) { // congela a cena: azul escuro + linhas + anotação "0% ÁGUA" no esqueleto do meio
  const u = t - R.xray0; if (u < 0 || t > R.xray1 + 0.25) return; const k = E.out3(u / q(10)) * (1 - clamp((t - R.xray1) / 0.25));
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(80,170,200,${0.6 * k})`; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(0,20,40,${0.22 * k})`; for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, 3);
  const P = SK[1]; const [x, y] = proj(P.cab ? P.cab.getWorldPosition(V3(0, 0, 0)).add(V3(0, -0.15, 0)) : posSK(P, Fq(R.xray0)).add(V3(0, 0.62, 0)));
  const p = E.out3((u - 0.3) / q(18)); ctx.strokeStyle = COR.raioX; ctx.lineWidth = 7; ctx.shadowColor = COR.raioX; ctx.shadowBlur = 14; ctx.globalAlpha = k;
  ctx.beginPath(); ctx.ellipse(x, y, 170, 250, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); ctx.stroke(); ctx.shadowBlur = 0;
  if (u > 0.9) { const a = E.outBack((u - 0.9) / q(12)); ctx.save(); ctx.translate(x, y - 330); ctx.scale(a, a); ctx.fillStyle = COR.hudFundo; ctx.strokeStyle = COR.raioX; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(-210, -60, 420, 120, 24); ctx.fill(); ctx.stroke(); txt('0% ÁGUA', 0, 4, 70, '#9fe8ff', 'center', 10); ctx.restore(); }
  if (u > 1.8) { ctx.globalAlpha = k * E.out3((u - 1.8) / 0.3); txt('OSSO SECO', x, y + 360, 50, '#fff', 'center', 10); }
  ctx.restore();
}
function medidor(t) { // ÁGUA → GELO +9%
  const u = t - R.medidor; if (u < 0 || t > R.mont0) return; const sai = 1 - clamp((t - (R.mont0 - 0.25)) / 0.25), ent = E.outBack(u / q(14));
  ctx.save(); ctx.translate(540, 360); ctx.scale(ent, ent); ctx.globalAlpha = sai;
  ctx.fillStyle = COR.hudFundo; ctx.strokeStyle = '#9fe8ff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(-400, -150, 800, 300, 34); ctx.fill(); ctx.stroke();
  const cresce = E.out3(clamp((u - 0.6) / 1.2)); const lA = 150, lG = lA * (1 + 0.09 * 3 * cresce); // exagero visual de 3× pra ler no celular
  ctx.fillStyle = '#3b8fe0'; ctx.fillRect(-250 - lA / 2, 60 - lA, lA, lA); ctx.strokeStyle = '#bff0ff'; ctx.lineWidth = 4; ctx.strokeRect(-250 - lA / 2, 60 - lA, lA, lA);
  ctx.fillStyle = '#d8f4ff'; ctx.fillRect(160 - lG / 2, 60 - lG, lG, lG); ctx.strokeStyle = '#ffffff'; ctx.strokeRect(160 - lG / 2, 60 - lG, lG, lG);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-130, -15); ctx.lineTo(40, -15); ctx.lineTo(18, -37); ctx.moveTo(40, -15); ctx.lineTo(18, 7); ctx.stroke();
  txt('ÁGUA', -250, 110, 40, '#fff', 'center', 8); txt('GELO', 160, 110, 40, '#fff', 'center', 8);
  if (u > 1.0) { const a = E.outBack((u - 1.0) / q(10), 2.6); ctx.save(); ctx.translate(310, -105); ctx.scale(a, a); ctx.rotate(-0.08); txt('+9%', 0, 0, 84, '#ffd36b', 'center', 14); ctx.restore(); }
  ctx.restore();
}
function zero(t, t0, x, y) { const u = t - t0; if (u < 0 || u > 1.7) return; const a = (u < q(5) ? E.outBack(u / q(5)) : 1); ctx.save(); ctx.globalAlpha = 1 - clamp((u - 1.4) / 0.3); ctx.translate(x, y - 70 * E.out3(u)); ctx.scale(a, a); txt('0', 0, 0, 92, '#9aa0b4', 'center', 14); ctx.restore(); }

// ================= QUADRO =================
const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler(), vv = new THREE.Vector3(), ss = new THREE.Vector3();
const esconde = () => m4.compose(vv.set(0, -50, 0), qq.identity(), ss.set(0.001, 0.001, 0.001));
function quadro(t) {
  const tw = tCena(t), qf = tw * 60; U.uT.value = tw; gUni.uT.value = tw; const M = naMontanha(t);
  scene.background = M ? ceuMont : FUNDO_MASM; scene.fog = M ? FOG_MONT : FOG_MASM;
  // Lia
  const rec = 0.35 * E.io3((qf - Fq(R.recua)) / 45);
  HERO.o.position.copy(BASE).add(V3(0.05 * rec, 0, rec)); const hp = HERO.o.position;
  const yG = Math.atan2(0.1 - hp.x, -1.6 - hp.z), yC = Math.atan2(CHEFE.p0.x - hp.x, CHEFE.p0.z - hp.z);
  const yChao = 0.0; // mira no chão: o próprio Spellcast já abaixa o braço o suficiente
  HERO.o.rotation.y = lerp(yG + yChao, yC, E.io3((qf - Fq(R.vira)) / 50)) + (qf > Fq(R.cheer) && qf < Fq(R.vira) + 30 ? 0.5 * E.io3((qf - Fq(R.cheer)) / 20) * (1 - E.io3((qf - Fq(R.vira)) / 30)) : 0);
  animar(HERO, SEQ_H, qf); HERO.o.updateMatrixWorld(true);
  const mao = HERO.mao.getWorldPosition(V3(0, 0, 0));
  // esqueletos
  for (const P of SK) {
    const p = posSK(P, qf); P.o.position.copy(p); P.o.rotation.y = Math.atan2(hp.x - p.x, hp.z - p.z);
    animar(P, P.SEQ, qf);
    const aw = clamp((qf - Fq(R.acorda) - P.i * 12 - 25) / 20); P.olhos.forEach((m) => m.color.copy(P.corOlho).multiplyScalar(aw * (1 - clamp((qf - P.queb - 10) / 20)) * (qf > P.cong && qf < P.queb ? 0.12 : 1)));
    const c = qf > P.cong ? clamp((qf - P.cong) / 10) * (1 - clamp((qf - P.queb) / 30)) : 0; const fl = qf > P.cong && qf < P.cong + 4;
    const fl1 = Math.abs(t - (R.bate1 + P.i * 0.08)) < q(2); // clarão do 1º tiro (sem efeito)
    P.mats.forEach((m, k) => { m.color.copy(P.cor0[k]).lerp(COR_GELO, c * 0.6); m.emissive.copy(EMI_GELO).multiplyScalar(c * 0.28); if ((fl && qf < P.cong + 2) || fl1) m.emissive.setRGB(0.6, 0.6, 0.6); });
  }
  // rei
  const awR = Fq(R.rei), voa = E.io3((qf - Fq(R.flutua)) / 50);
  CHEFE.o.position.copy(CHEFE.p0).add(V3(0, ALT_TABLADO + voa * (0.32 + 0.03 * Math.sin(tw * 2.2)), 0)); CHEFE.o.rotation.y = Math.atan2(hp.x - CHEFE.p0.x, hp.z - CHEFE.p0.z); animar(CHEFE, CHEFE.SEQ, qf);
  const ac = clamp((qf - awR - 30) / 25); CHEFE.olhos.forEach((m) => m.color.copy(CHEFE.corOlho).multiplyScalar(ac * (1 + 0.4 * Math.sin(tw * 9))));
  luzChefe.position.copy(CHEFE.p0).add(V3(0, 0.9 + voa * 0.3, 0.5)); luzChefe.intensity = ac * (2.5 + 0.6 * Math.sin(tw * 7));
  scene.updateMatrixWorld(true);
  // luz: tochas; cena escurece nas cargas e no gelo
  const carga2 = clamp((t - R.raise2) / (R.tiro2 - R.raise2)), carga1 = clamp((t - R.raise1) / (R.tiro1 - R.raise1)) * (t < R.tiro1 + 0.5 ? 1 : 0);
  const dim = Math.max(0.4 * carga1, E.io3(carga2) * (1 - E.io3((t - R.racha) / 1.3)));
  for (const tc of TOCHAS) { const f = 0.85 + 0.1 * Math.sin(tw * 13 + tc.sem) + 0.07 * Math.sin(tw * 23.7 + tc.sem * 2) + 0.05 * Math.sin(tw * 41 + tc.sem);
    tc.L.intensity = 3.2 * f * (1 - 0.5 * dim); tc.sp.forEach((s, k) => { const a = tw * (9 + k * 3) + tc.sem; s.position.copy(tc.p).add(V3(0.01 * Math.sin(a), 0.03 * k + 0.012 * Math.sin(a * 1.3), 0)); s.scale.setScalar((0.2 - k * 0.05) * f * (1 + 0.15 * Math.sin(a * 1.7))); }); }
  hemi.intensity = M ? 1.6 : lerp(HEMI0, HEMI0 * 0.6, dim); chave.intensity = M ? 2.4 : lerp(CHAVE0, CHAVE0 * 0.35, dim);
  if (M) { chave.position.set(MX + 4, 6, 5); chave.target.position.set(MX, 0, 0); } else { chave.position.set(3.5, 5, 4); chave.target.position.set(0, 0, 0); }
  const cargaAtual = t < R.tiro1 + 1 ? carga1 : carga2, tiroAt = t < R.tiro1 + 1 ? R.tiro1 : R.tiro2;
  luzMao.position.copy(mao); luzMao.intensity = t < tiroAt ? 0.7 * E.in2(cargaAtual) * (t > tiroAt - 1.2 ? 1 : 0) : 1.5 * Math.exp(-(t - tiroAt) * 6);
  luzImp.position.set(0.1, 0.6, -0.9); luzImp.intensity = t < R.trava ? 0 : t < R.racha ? 2.2 + 0.4 * Math.sin(tw * 5) : 6 * Math.exp(-(t - R.racha) * 3) * (t < R.racha + 2 ? 1 : 0);
  // poças: escuras e brilhantes → viram gelo
  const pg = E.out3((t - R.nasce) / 0.6); matPoca.color.setRGB(1, 1, 1).lerp(new THREE.Color(3.2, 3.6, 4.0), pg); texPoca.offset.set(0.01 * Math.sin(tw * 1.3), 0.01 * Math.cos(tw * 1.1));
  ORIG_POCA.forEach((m) => { m.visible = !(t > R.racha + 0.1 && false); });
  // rachaduras de luz até as poças
  rachMat.uniforms.uP.value = clamp((t - R.tiro2) / 0.35); rachMat.uniforms.uA.value = (t > R.tiro2 ? 1 : 0) * (1 - clamp((t - R.racha) / 1.0));
  // cristais do chão: crescem; "incham" até a racha (+9%), depois quebram
  let n = 0; const incha = 1 + 0.09 * E.io3((t - R.trava) / 4);
  for (const c of CR) { const uq = qf - c.t0; let s = uq > 0 ? E.outBack(uq / 8, 2.2) : 0; const tq = quebraDe(c); if (qf > tq) s *= 1 - E.in2((qf - tq) / 6);
    s = Math.max(1e-4, s * c.s * incha); ee.set(...c.inc); qq.setFromEuler(ee); m4.compose(vv.set(c.x, -0.02, c.z), qq, ss.set(s, s * (0.9 + 0.2 * hash(n)), s)); imCr.setMatrixAt(n++, m4); }
  imCr.instanceMatrix.needsUpdate = true; imCr.visible = t > R.nasce - 0.1 && !M;
  gUni.uBrilho.value = 1 + (t > R.racha ? 0.3 * Math.exp(-(t - R.racha) * 6) : 0);
  // projéteis do 1º tiro: mão → peito, batem e somem
  SK.forEach((P, i) => { const m = projeteis[i]; const t0 = R.tiro1 + 0.02 + i * 0.05, t1 = R.bate1 + i * 0.08; m.visible = t > t0 && t < t1 && !M; if (!m.visible) return;
    const alvo = posSK(P, Fq(t1)).add(V3(0, 0.62, 0)); const k = (t - t0) / (t1 - t0); m.position.copy(mao).lerp(alvo, k); m.position.y += Math.sin(Math.PI * k) * 0.12; m.lookAt(alvo); });
  // cacos: 0–89 = o tiro que "escorrega" no osso; 90+ = gelo quebrando (racha)
  for (let i = 0; i < NCACO; i++) { const h1 = hash(i * 1.3), h2 = hash(i * 2.1 + 5), h3 = hash(i * 3.7 + 9); let p = null, k = 0;
    if (i < 90) { const P = SK[i % 3]; const t0 = R.bate1 + (i % 3) * 0.08, u = (t - t0) / 0.9; if (u >= 0 && u <= 1) { const c0 = posSK(P, Fq(t0)).add(V3(0, 0.62, 0)); const a = h1 * 6.28, sp = 0.6 + 0.9 * h2;
        p = V3(c0.x + Math.cos(a) * sp * u * 0.5, Math.max(0.02, c0.y + (0.6 + h3) * u - 3.5 * u * u), c0.z + Math.sin(a) * sp * u * 0.5 + 0.2 * u); k = 0.5 * (1 - clamp((u - 0.6) / 0.4)); } }
    else { const c = CR[(i * 7) % CR.length]; const u = (qf - quebraDe(c)) / 60; if (u >= 0 && u <= 1.1) { const a = h1 * Math.PI * 2, sp = (1.0 + 1.6 * h2);
        p = V3(c.x + Math.cos(a) * sp * u * 0.5, Math.max(0.02, 0.15 + 0.5 * h3 * c.s + (1.6 + 2 * h2) * u - 4.9 * u * u), c.z + Math.sin(a) * sp * u * 0.5); k = (0.6 + 1.2 * h3) * (1 - clamp((u - 0.7) / 0.4)); } }
    if (p && !M) { ee.set(t * 12 * h1, t * 9 * h2, t * 7); qq.setFromEuler(ee); m4.compose(p, qq, ss.set(k, k * 1.6, k)); } else esconde(); imCaco.setMatrixAt(i, m4); }
  imCaco.instanceMatrix.needsUpdate = true;
  // partículas
  for (let i = 0; i < NP; i++) { const h1 = hash(i + 0.3), h2 = hash(i + 7.7), h3 = hash(i + 3.1); let p = null, k = 0;
    if (i < 120) { const [ra, ti] = i < 50 ? [R.raise1, R.tiro1] : [R.raise2, R.tiro2]; const nasce = ra + h1 * (ti - ra - 0.2), u = (t - nasce) / 0.37;
      if (u >= 0 && u <= 1 && t < ti + 0.03) { const r = 0.5 * (1 - E.in2(u)), a = h2 * 6.28 + u * 5; p = mao.clone().add(V3(Math.cos(a) * r, Math.sin(a) * r * 0.8, Math.sin(a * 0.7) * r * 0.6)); k = 0.6 + 1.4 * u; } }
    else if (i < 260) { const P = SK[i % 3]; const u = (t - (R.trava + P.i * 0.1)) / 0.7; if (u >= 0 && u <= 1) { const c0 = posSK(P, P.cong); const a = h1 * 6.28, el = h2 * 1.4, sp = 1.2 + 1.5 * h3; p = V3(c0.x + Math.cos(a) * Math.cos(el) * sp * u * 0.5, 0.15 + Math.sin(el) * sp * u * 0.5 - 1.5 * u * u, c0.z + Math.sin(a) * Math.cos(el) * sp * u * 0.5); k = 1.3 * (1 - u); } }
    else { const u = (t - R.racha + 0.2 - h1 * 1.2) / 3.2; if (u >= 0 && u <= 1) { p = V3(-2 + h2 * 4.2 + Math.sin(u * 6 + i) * 0.12, 2.3 - u * 2.4, -2.6 + h3 * 3.4); k = Math.sin(Math.PI * u); } }
    if (p && !M) m4.compose(p, qq.identity(), ss.set(k, k, k)); else esconde(); imP.setMatrixAt(i, m4); }
  imP.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < NPO; i++) { const h1 = hash(i + 900), h2 = hash(i + 901), h3 = hash(i + 902); const u = (tw * 0.05 + h1) % 1;
    if (M) esconde(); else m4.compose(vv.set(-2.2 + 4.4 * h2 + 0.15 * Math.sin(tw * 0.7 + i), 0.2 + 2.2 * u, -4 + 6 * h3 + 0.1 * Math.cos(tw * 0.5 + i)), qq.identity(), ss.setScalar(Math.sin(Math.PI * u))); imPo.setMatrixAt(i, m4); }
  imPo.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < NPR; i++) { const h1 = hash(i + 500), h2 = hash(i + 501); const u = ((qf - awR - 20) / 70 + h1) % 1; const on = qf > awR + 20 + h1 * 30;
    if (!on || M) { esconde(); imPr.setMatrixAt(i, m4); continue; } const a = h2 * 6.28 + u * 2; const r = 0.25 + 0.2 * u;
    m4.compose(vv.set(CHEFE.p0.x + Math.cos(a) * r, 0.1 + 1.3 * u + voa * 0.3, CHEFE.p0.z + Math.sin(a) * r), qq.identity(), ss.setScalar(1.3 * Math.sin(Math.PI * u) * ac + 1e-3)); imPr.setMatrixAt(i, m4); }
  imPr.instanceMatrix.needsUpdate = true;
  const urc = (qf - awR - 40) / 40; anelChefe.visible = urc > 0 && urc < 1; anelChefe.position.set(CHEFE.p0.x, 0.12, CHEFE.p0.z); if (anelChefe.visible) { anelChefe.scale.setScalar(1 + 4 * E.out3(urc)); anelChefe.material.opacity = 1 - urc; }
  // gota que cai do pé do rei e não congela nada
  { const ug = (t - R.gota) / 0.4; const y0 = ALT_TABLADO + 0.32; gota.visible = ug >= 0 && ug < 1; if (gota.visible) gota.position.set(CHEFE.p0.x + 0.05, y0 - (y0 - ALT_TABLADO) * ug * ug, CHEFE.p0.z + 0.08);
    const ua2 = (t - R.gota - 0.4) / 0.8; anelGota.visible = ua2 >= 0 && ua2 < 1; if (anelGota.visible) { anelGota.position.set(CHEFE.p0.x + 0.05, ALT_TABLADO + 0.01, CHEFE.p0.z + 0.08); anelGota.scale.setScalar(1 + 5 * E.out3(ua2)); anelGota.material.opacity = 0.8 * (1 - ua2); } }
  // montanha: gelo nasce na fenda, incha, a rocha abre em duas
  { const ab = E.out3((t - (R.mont0 + R.msplit)) / 0.5) * 0.32 + (t > R.mont0 + R.msplit - 0.2 && t < R.mont0 + R.msplit ? 0.01 * Math.sin(t * 90) : 0);
    ROCHA.halves.forEach((o, s) => { const sg = s ? -1 : 1; o.position.set(MX, 0, 0).addScaledVector(ROCHA.n, sg * ab); o.rotation.z = -sg * ab * 0.25; ROCHA.planes[s].constant = -(ROCHA.n.x * MX) * sg + 0.004; ROCHA.planes[s].constant = sg * (-ROCHA.n.x * MX) ; });
    // plano por (MX,0,0): n·p - n·(MX,0,0) >= 0 mantém o lado +n; o lado da metade s acompanha o deslocamento
    ROCHA.halves.forEach((o, s) => { const sg = s ? -1 : 1; const pt = V3(MX, 0, 0).addScaledVector(ROCHA.n, sg * ab); ROCHA.planes[s].normal.copy(ROCHA.n).multiplyScalar(sg); ROCHA.planes[s].constant = -ROCHA.planes[s].normal.dot(pt); });
    let j = 0; for (const c of GELO_FENDA) { const uq = (t - c.t0) * 60; let s = uq > 0 ? E.outBack(uq / 8, 2) * c.s * (1 + 0.6 * E.io3((t - c.t0 - 0.3) / 1.0)) : 0;
      ee.set(...c.inc); qq.setFromEuler(ee); m4.compose(vv.set(MX - c.y * ROCHA.n.y / ROCHA.n.x, c.y - 0.3, 0.55 + 0.35 * hash(j)), qq, ss.setScalar(Math.max(1e-4, s * 1.4))); imFenda.setMatrixAt(j++, m4); }
    imFenda.instanceMatrix.needsUpdate = true; imFenda.visible = M; montanha.visible = M; }
  // câmera
  const C = camEm(t, tw); cam.fov = C.fov; cam.updateProjectionMatrix(); cam.position.copy(C.pos); cam.lookAt(C.alvo); cam.rotateZ(C.roll); cam.updateMatrixWorld(true);
  const ua = (t - tiroAt) / q(14); anel.visible = ua >= 0 && ua <= 1 && !M; if (anel.visible) { anel.position.copy(mao); anel.lookAt(cam.position); anel.scale.setScalar(0.3 + 1.3 * E.out3(ua)); anelMat.opacity = 0.7 * (1 - ua); }
  bloom.strength = M ? 0.25 : 0.4 + 0.2 * dim;
  composer.render();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(glc, 0, 0, RW, RH); ctx.setTransform(ESC, 0, 0, ESC, 0, 0);
  if (!M) { ctx.save(); ctx.globalCompositeOperation = 'screen';
    const brilho = (pt, r, a, rgb) => { const [x, y] = proj(pt); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); };
    for (const tc of TOCHAS) brilho(tc.p, 150, 0.16, '255,150,70');
    if (cargaAtual > 0 && t < tiroAt + 0.3) brilho(mao, 60 + 70 * cargaAtual, 0.14 * cargaAtual * (t < tiroAt ? 1 : Math.exp(-(t - tiroAt) * 10)), '150,225,255');
    if (t > R.trava && t < R.racha + 0.8) brilho(V3(0.1, 0.3, -1.0), 380, 0.06 + (t > R.racha ? 0.12 * Math.exp(-(t - R.racha) * 3) : 0), '150,225,255');
    if (ac > 0) brilho(CHEFE.p0.clone().add(V3(0, 0.7 + voa * 0.3, 0)), 300, 0.18 * ac, '200,100,255');
    // brilho no olho da Lia (ideia!)
    const uo = (t - R.olho) / 0.5; if (uo > 0 && uo < 1 && HERO.cab) { const ry = HERO.o.rotation.y, fw = V3(Math.sin(ry), 0, Math.cos(ry)), rt = V3(Math.cos(ry), 0, -Math.sin(ry)); const [x, y] = proj(HERO.cab.getWorldPosition(V3(0, 0, 0)).addScaledVector(fw, 0.2).addScaledVector(rt, -0.07).add(V3(0, 0.155, 0))); const a = Math.sin(Math.PI * uo);
      ctx.globalCompositeOperation = 'lighter'; J.estrela ? null : null; const g = ctx.createRadialGradient(x, y, 0, x, y, 70); g.addColorStop(0, `rgba(220,250,255,${0.9 * a})`); g.addColorStop(1, 'rgba(160,230,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - 70, y - 70, 140, 140);
      ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 46 * a, y); ctx.lineTo(x + 46 * a, y); ctx.moveTo(x, y - 46 * a); ctx.lineTo(x, y + 46 * a); ctx.stroke(); }
    ctx.restore(); }
  { const vg = ctx.createRadialGradient(540, 960, 480, 540, 960, 1300); vg.addColorStop(0, 'rgba(8,5,20,0)'); vg.addColorStop(1, `rgba(8,5,20,${M ? 0.25 : 0.6 + 0.2 * dim})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
  if (!M) { const fg = ctx.createLinearGradient(0, 1250, 0, 1920); fg.addColorStop(0, 'rgba(10,6,25,0)'); fg.addColorStop(1, 'rgba(10,6,25,0.55)'); ctx.fillStyle = fg; ctx.fillRect(0, 1250, W, 670); }
  // abertura: olho abrindo (preto que abre de cima e de baixo)
  if (t < 1.2) { const a = E.io3(t / 1.2); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H * 0.5 * (1 - a)); ctx.fillRect(0, H - H * 0.5 * (1 - a), W, H * 0.5 * (1 - a)); }
  for (const [t0, a] of [[R.tiro1, 0.12], [R.tiro2, 0.18], [R.racha, 0.3], [R.mont0 + R.msplit, 0.2]]) if (t >= t0 && t < t0 + q(4)) { ctx.fillStyle = `rgba(225,248,255,${t < t0 + q(1) ? a : a * 0.35})`; ctx.fillRect(0, 0, W, H); }
  // HUD
  hudLia(t);
  if (!M) for (const P of SK) { const [x, y] = proj(posSK(P, Fq(R.bate1)).add(V3(0, 1.05, 0))); zero(t, R.bate1 + P.i * 0.08, x, y); }
  raioX(t); medidor(t);
  if (!M) { const DANO = [[98, 'dano', -1], [124, 'crit', 0], [102, 'dano', 1]];
    for (const P of SK) { const [x, y] = proj(posSK(P, P.cong).add(V3(0, 1.05, 0))); J.numeroDano(ctx, t, { t0: R.racha + P.i * 0.12, valor: DANO[P.i][0], tipo: DANO[P.i][1], lado: DANO[P.i][2] }, x, y - 40, P.i === 1 ? 0.8 : 1); } }
  J.lootToast(ctx, t, R.xp, '+30 XP', 'estrela', 1450);
  if (t > R.rei + 1.6 && t < R.escolha) { const k = E.outBack(clamp((t - R.rei - 1.6) / 0.27)); ctx.save(); ctx.translate(540, 300); ctx.scale(k, k); J.barraVida(ctx, -260, -30, 520, 52, { fill: 999, pedaco: null, mostrado: 999 }, 999, 'REI ESQUELETO', F); ctx.restore(); }
  if (t >= R.escolha) J.escolha(ctx, t, R.escolha, 'O QUE A LIA FAZ?', 'CORRE PRA SAÍDA', 'ENCARA O REI');
}

window.DUR = DUR;
window.seek = async (t) => { quadro(t); };
new FontFace('Titan', 'url(../fontes/TitanOne.woff2)').load().then((f) => { document.fonts.add(f); quadro(0); window.READY = true; });
