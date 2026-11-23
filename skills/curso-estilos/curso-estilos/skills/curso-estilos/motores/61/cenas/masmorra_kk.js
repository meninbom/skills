// MASMORRA (full KayKit, ~12 s): maga numa masmorra, 3 esqueletos acordam, ela congela os três, o chefe acorda no fundo → escolha.
// Tudo de artista (KayKit Adventurers + Skeletons + Dungeon Remastered, CC0). Código = luz, VFX, juice, câmera, HUD.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { U, comContorno } from './toon/toon.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as J from '../kit_juice/juice.js';
import { E, q, clamp, lerp, hash } from '../kit_juice/tokens.js';

const Q = new URLSearchParams(location.search);
const W = 1080, H = 1920, SS = Number(Q.get('ss') || 2), ESC = Number(Q.get('esc') || 1);
const RW = Math.round(W * ESC), RH = Math.round(H * ESC), IW = RW * SS, IH = RH * SS;
const F = 'Titan, sans-serif';
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const glc = document.createElement('canvas'); glc.width = IW; glc.height = IH;
const out = document.getElementById('c'); out.width = RW; out.height = RH; const ctx = out.getContext('2d');
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(IW, IH, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
U.uRes.value.set(IW, IH); U.uPx.value = SS * ESC;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0816');
scene.fog = new THREE.Fog('#0e0a1c', 5.5, 13);
const hemi = new THREE.HemisphereLight('#8a8cff', '#2a1838', 0.9); scene.add(hemi);
const chave = new THREE.DirectionalLight('#ffb070', 1.6); chave.position.set(3.5, 5, 4); chave.castShadow = true; chave.shadow.mapSize.set(2048, 2048);
Object.assign(chave.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 20 }); chave.shadow.bias = -0.0005; chave.shadow.normalBias = 0.03; scene.add(chave);
const lua = new THREE.DirectionalLight('#7f8cff', 1.1); lua.position.set(-2, 4, -6); scene.add(lua); // recorte frio por trás (janela do fundo)
const HEMI0 = hemi.intensity, CHAVE0 = chave.intensity;

// ---------- carregar KayKit ----------
const ldr = new GLTFLoader(); const cache = {};
async function glb(url) { if (!cache[url]) cache[url] = ldr.loadAsync(url); return cache[url]; }
async function pecaD(n) { try { return await glb(`../personagem/kaykit/dungeon/${n}.gltf.glb`); } catch (e) { return glb(`../personagem/kaykit/dungeon/${n}.glb`); } }

const gH = await glb('../personagem/kaykit/Mage.glb');
gH.scene.updateMatrixWorld(true); const hNat = new THREE.Box3().setFromObject(gH.scene).getSize(V3(0, 0, 0)).y;
const S = 1.15 / hNat; // tudo KayKit nessa escala (herói = 1,15)
const T = 4 * S; // ladrilho grande
console.log('altura nativa', hNat.toFixed(2), 'escala', S.toFixed(3));

function sombras(o) { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; } }); return o; }
async function poe(n, x, z, ry = 0, y = 0, k = 1) { const g = await pecaD(n); const o = g.scene.clone(); o.scale.setScalar(S * k); o.position.set(x, y, z); o.rotation.y = ry; scene.add(sombras(o)); return o; }

// ---------- cenário: sala 5 x 5 ladrilhos ----------
const ZF = -3.5 * T; // parede do fundo
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
  // tablado do chefe no fundo
  ps.push(poe('floor_foundation_allsides', 0, -2.9 * T, 0, -0.5 * T * 0.12, 0.6));
  await Promise.all(ps);
}
// tochas na parede: base + chama em sprites + luz que tremula
const TOCHAS = [];
const texFogo = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,250,220,1)'); r.addColorStop(0.25, 'rgba(255,200,90,0.9)'); r.addColorStop(0.6, 'rgba(255,110,30,0.35)'); r.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
async function tocha(x, z, ry) {
  const o = await poe('torch_mounted', x, z, ry, 2.3 * S);
  const d = V3(Math.sin(ry), 0, Math.cos(ry)); const p = V3(x, 2.3 * S + 0.72 * S, z).addScaledVector(d, 0.42 * S);
  const sp = []; for (let k = 0; k < 3; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFogo, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.position.copy(p); scene.add(s); sp.push(s); }
  const L = new THREE.PointLight('#ff9a48', 3.2, 0, 2); L.position.copy(p).addScaledVector(d, 0.15); scene.add(L);
  TOCHAS.push({ p, sp, L, sem: TOCHAS.length * 1.7 });
}
await Promise.all([tocha(-2.5 * T + 0.5 * S, -2 * T, Math.PI / 2), tocha(-2.5 * T + 0.5 * S, 0, Math.PI / 2), tocha(2.5 * T - 0.5 * S, -2 * T, -Math.PI / 2), tocha(2.5 * T - 0.5 * S, 0, -Math.PI / 2),
  tocha(-0.5 * T, ZF + 0.5 * S, 0), tocha(0.5 * T, ZF + 0.5 * S, 0), tocha(-0.5 * T, 3.5 * T - 0.5 * S, Math.PI), tocha(1.5 * T, 3.5 * T - 0.5 * S, Math.PI), tocha(-2.5 * T + 0.5 * S, 2 * T, Math.PI / 2), tocha(2.5 * T - 0.5 * S, 2 * T, -Math.PI / 2)]);

// ---------- personagens ----------
const B = { acorda: 100, recua: 150, anda: 175, carga0: 240, solta: 310, impacto: 338, segura: 400, quebra: 432, cheer: 478, ress: 548, escolha: 650, fim: 750 };
const Tq = (n) => n / 60; const DUR = B.fim / 60;
const GOLPES = [{ t: Tq(B.impacto), stop: 6, forca: 1.4 }];
const UNICO = new Set(['Spellcast_Raise', 'Spellcast_Shoot', 'Cheer', 'Skeletons_Awaken_Floor', 'Skeletons_Awaken_Floor_Long', 'Death_C_Skeletons', 'Hit_A', 'Hit_B', 'Block']);

function montar(gltf, esconder = []) {
  const o = gltf.scene; sombras(o); o.scale.setScalar(S); scene.add(o);
  o.traverse((m) => { if (m.isMesh && esconder.some((n) => m.name.startsWith(n))) m.visible = false; });
  const mixer = new THREE.AnimationMixer(o); const ACT = {};
  for (const c of gltf.animations) { const a = mixer.clipAction(c); a.play(); a.setEffectiveWeight(0); ACT[c.name] = a; }
  let mao = null, maoE = null; o.traverse((b) => { const nn = b.name.replace('.', ''); if (nn === 'handslotr') mao = b; if (nn === 'handslotl') maoE = b; });
  return { o, mixer, ACT, mao, maoE, dur: (n) => ACT[n].getClip().duration };
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
// maga
const HERO = montar(gH, ['Spellbook', '2H_Staff']);
const BASE = V3(-0.3, 0, 1.45);
const SEQ_H = [[0, 'Idle'], [B.recua, 'Walking_Backwards'], [B.recua + 45, 'Idle'], [B.carga0, 'Spellcast_Raise'], [B.carga0 + 50, 'Spellcasting'], [B.solta - 8, 'Spellcast_Shoot'],
  [B.segura, 'Idle'], [B.cheer, 'Cheer'], [B.ress + 20, 'Blocking', null, 14]];
// esqueletos
const [gW, gM, gR, gC, armas] = await Promise.all(['Skeleton_Warrior', 'Skeleton_Minion', 'Skeleton_Rogue', 'Skeleton_Mage'].map((n) => glb(`../personagem/kaykit/skel/${n}.glb`)).concat([
  Promise.all(['Skeleton_Blade', 'Skeleton_Axe', 'Skeleton_Shield_Small_A', 'Skeleton_Staff'].map((n) => glb(`../personagem/kaykit/skel/${n}.gltf`)))]));
const SK = [[gW, V3(-0.8, 0, -0.95), 0, 'Skeleton_Blade', 'Skeleton_Shield_Small_A'], [gM, V3(0.18, 0, -1.4), 1, 'Skeleton_Axe'], [gR, V3(0.98, 0, -0.9), 2, 'Skeleton_Blade']].map(([g, p, i, a1, a2]) => {
  const P = montar(g); P.p0 = p; P.i = i; P.cong = B.impacto + i * 3; P.queb = B.quebra + i * 5;
  const nome = ['Skeleton_Blade', 'Skeleton_Axe', 'Skeleton_Shield_Small_A', 'Skeleton_Staff'];
  if (a1) P.mao.add(sombras(armas[nome.indexOf(a1)].scene.clone())); if (a2) P.maoE.add(sombras(armas[nome.indexOf(a2)].scene.clone()));
  const d = i * 10, aw = B.acorda + d, awD = P.dur('Skeletons_Awaken_Floor') * 60;
  P.SEQ = [[0, 'Skeletons_Inactive_Floor_Pose'], [aw, 'Skeletons_Awaken_Floor', null, 4], [aw + awD - 8, 'Idle_Combat'], [Math.max(B.anda + d, aw + awD + 4), 'Walking_D_Skeletons', P.cong, 14], [P.queb, 'Death_C_Skeletons', null, 4]];
  return P;
});
const CHEFE = montar(gC); CHEFE.p0 = V3(0.15, 0.06 * T * 0.6 * 0, -2.9 * T);
{ CHEFE.mao.add(sombras(armas[3].scene.clone())); const aw = B.ress, awD = CHEFE.dur('Skeletons_Awaken_Floor_Long') * 60;
  CHEFE.SEQ = [[0, 'Skeletons_Inactive_Floor_Pose'], [aw, 'Skeletons_Awaken_Floor_Long', null, 4], [aw + awD - 10, 'Spellcast_Summon', null, 12]]; }
// olhos: apagados até acordar, depois brilham (ciano nos lacaios, roxo no chefe)
function olhos(P, cor) { const ms = []; P.o.traverse((m) => { if (m.isMesh && m.name.endsWith('_Eyes')) { m.material = new THREE.MeshBasicMaterial({ color: '#000' }); ms.push(m.material); } }); P.olhos = ms; P.corOlho = new THREE.Color(cor); }
SK.forEach((P) => olhos(P, '#6ff7ff')); olhos(CHEFE, '#d36bff');
// materiais próprios de cada esqueleto (pra congelar um sem pintar os outros)
for (const P of SK) { P.mats = []; P.o.traverse((m) => { if (m.isMesh && !m.name.endsWith('_Eyes')) { m.material = m.material.clone(); P.mats.push(m.material); } }); P.cor0 = P.mats.map((m) => m.color.clone()); }
const luzChefe = new THREE.PointLight('#c75bff', 0, 0, 2); scene.add(luzChefe);

// ---------- gelo ----------
const gUni = { uT: { value: 0 }, uBrilho: { value: 1 } };
function matGelo(base) {
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
const CR = []; const ORIG = V3(BASE.x + 0.05, 0, BASE.z - 0.35);
function alvoSK(P, qf) { const k = clamp((Math.min(qf, P.cong) - B.anda - P.i * 10) / 60) * 0.0 + Math.max(0, Math.min(qf, P.cong) - Math.max(B.anda + P.i * 10, B.acorda + P.i * 10 + 90)) / 60; const d = V3(BASE.x - P.p0.x, 0, BASE.z - P.p0.z).normalize(); return P.p0.clone().addScaledVector(d, Math.min(0.75, k * 0.32)); }
for (const P of SK) {
  const fim = alvoSK(P, P.cong); const NC = 9;
  for (let i = 0; i < NC; i++) { const u = i / (NC - 1); const x = lerp(ORIG.x, fim.x, u * 0.85), z = lerp(ORIG.z, fim.z, u * 0.85); const tam = 0.3 + 0.6 * u ** 1.3;
    const t0 = Tq(B.solta + 3) + u * Tq(P.cong - B.solta - 3);
    CR.push({ x, z, s: tam, inc: [(hash(i + P.i) - 0.5) * 0.5, hash(i + 2) * 6, -0.2], t0, u, P });
    for (const l of [-1, 1]) CR.push({ x: x + l * 0.1 * Math.abs(Math.cos(P.i)), z: z + l * 0.08, s: tam * 0.5, inc: [l * 0.5, hash(i + 3) * 6, -0.2], t0: t0 + Tq(2), u, P }); }
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + P.i; CR.push({ x: fim.x + Math.cos(a) * 0.26, z: fim.z + Math.sin(a) * 0.26, s: 0.8 + 0.3 * hash(k + 70 + P.i), inc: [Math.sin(a) * 0.45, a, -Math.cos(a) * 0.45], t0: Tq(P.cong) + Tq(k % 3), u: 1, fin: true, P }); }
}
const quebraDe = (c) => c.P.queb - 4 + (c.fin ? 0 : -20 + c.u * 18);
const imCr = new THREE.InstancedMesh(geoCristal, MGELO, CR.length); imCr.frustumCulled = false; scene.add(imCr); comContorno(imCr, 3.5, '#0a1640');
const NCACO = 300; const imCaco = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.05, 0), MGELO2, NCACO); imCaco.frustumCulled = false; scene.add(imCaco);
const imGeada = new THREE.InstancedMesh((() => { const g = new THREE.CircleGeometry(1, 18); g.rotateX(-Math.PI / 2); return g; })(), new THREE.MeshBasicMaterial({ color: '#dff4ff', transparent: true, opacity: 0.35, depthWrite: false }), CR.length); imGeada.frustumCulled = false; scene.add(imGeada);
const NP = 420; const imP = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.011, 1), new THREE.MeshBasicMaterial({ color: '#e6fbff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), NP); imP.frustumCulled = false; scene.add(imP);
const NPO = 90; const imPo = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.008, 0), new THREE.MeshBasicMaterial({ color: '#ffc98a', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }), NPO); imPo.frustumCulled = false; scene.add(imPo); // poeira na luz
const NPR = 80; const imPr = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.014, 1), new THREE.MeshBasicMaterial({ color: '#d47bff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), NPR); imPr.frustumCulled = false; scene.add(imPr); // aura do chefe
const anelMat = new THREE.MeshBasicMaterial({ color: '#bff3ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const anel = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 8, 64), anelMat); scene.add(anel);
const anelChefe = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.46, 64), new THREE.MeshBasicMaterial({ color: '#c46bff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); anelChefe.rotation.x = -Math.PI / 2; scene.add(anelChefe);
const luzMao = new THREE.PointLight('#bfe8ff', 0, 0, 2); scene.add(luzMao);
const luzImp = new THREE.PointLight('#8fe0ff', 0, 0, 2); scene.add(luzImp);
const COR_GELO = new THREE.Color('#a9dcff'), EMI_GELO = new THREE.Color('#1b4fa8');

// ---------- câmera e pós ----------
const cam = new THREE.PerspectiveCamera(46, W / H, 0.05, 200);
const composer = new EffectComposer(renderer); composer.setSize(IW, IH);
composer.addPass(new RenderPass(scene, cam)); const bloom = new UnrealBloomPass(new THREE.Vector2(IW / 2, IH / 2), 0.4, 0.5, 0.85); composer.addPass(bloom); composer.addPass(new OutputPass());
const proj = (v) => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };
const CHEFE_P = () => CHEFE.p0;
function camEm(tw, t) {
  const qf = tw * 60; const K = (a, b) => E.io3((qf - a) / (b - a));
  const k1 = K(B.acorda - 30, B.acorda + 60), k2 = K(B.carga0 - 30, B.carga0 + 30), k3 = K(B.solta - 4, B.solta + 26), k4 = K(B.quebra + 4, B.cheer + 6), k5 = K(B.ress - 6, B.ress + 70);
  const pos = V3(0.75, 1.6, 4.1).lerp(V3(0.6, 1.15, 3.4), k1).lerp(V3(-2.0, 1.15, -0.55), k2).lerp(V3(2.5, 1.5, 1.6), k3).lerp(V3(1.15, 1.1, -0.6), k4).lerp(V3(0.4, 1.2, 3.4), k5);
  const alvo = V3(-0.15, 0.45, -0.5).lerp(V3(0.1, 0.45, -1.0), k1).lerp(V3(BASE.x, 0.85, BASE.z + 0.3), k2).lerp(V3(0.0, 0.5, -0.4), k3).lerp(V3(BASE.x, 0.78, BASE.z + 0.3), k4).lerp(V3(0.15, 0.62, -2.9 * T), k5);
  pos.x += Math.sin(tw * 0.6) * 0.04; pos.y += Math.sin(tw * 0.8) * 0.02;
  if (qf > B.escolha) pos.z -= 0.25 * E.io3((qf - B.escolha) / 100);
  const tr = J.trauma(tw, [...GOLPES, { t: Tq(B.solta), forca: 0.5 }, { t: Tq(B.quebra + 6), forca: 0.6 }, { t: Tq(B.ress + 40), forca: 0.45 }]);
  const zoom = (t >= Tq(B.impacto) ? 5 * Math.exp(-(t - Tq(B.impacto)) * 6) : 0) + (qf > B.carga0 && qf < B.solta ? 3 * E.in2((qf - B.carga0) / (B.solta - B.carga0)) : 0);
  return { pos: pos.add(V3(tr.x * 0.6, tr.y * 0.6, 0)), alvo, roll: tr.rot, fov: lerp(46, 34, k5) - zoom };
}

// ---------- HUD ----------
function legenda(t) {
  const LS = [[0.25, Tq(B.acorda) - 0.05, 'A MASMORRA TAVA\n*QUIETA* DEMAIS.'], [Tq(B.acorda) + 0.15, Tq(B.carga0) + 0.2, 'ATÉ OS OSSOS\n*ACORDAREM.*'], [Tq(B.ress) + 0.6, Tq(B.escolha), 'MAS O *CHEFE*\nTAMBÉM ACORDOU.']];
  const L = LS.find((l) => t >= l[0] && t < l[1]); if (!L) return;
  const linhas = L[2].split('\n'); const s = 64; ctx.font = `${s}px ${F}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  const nW = L[2].replace(/\*/g, '').split(/\s+/).length; let wi = 0;
  linhas.forEach((ln, li) => {
    const ws = ln.split(' '); const sp = ctx.measureText(' ').width * 1.4; const lw = ws.map((w) => ctx.measureText(w.replace(/\*/g, '')).width); const tot = lw.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
    let x = 540 - tot / 2; const y = 1440 + li * s * 1.15;
    ws.forEach((w, i) => { const tw = L[0] + Math.min(0.8, (L[1] - L[0]) * 0.45) * (wi / Math.max(1, nW - 1)); wi++;
      if (t >= tw) { const u = t - tw, sc = u < q(6) ? E.outBack(u / q(6)) : 1; const key = w.includes('*'); const txt = w.replace(/\*/g, '');
        ctx.save(); ctx.globalAlpha = 1 - clamp((t - (L[1] - 0.2)) / 0.2); ctx.translate(x + lw[i] / 2, y - s * 0.35); ctx.scale(sc, sc); ctx.lineWidth = 14; ctx.strokeStyle = '#141030'; ctx.strokeText(txt, -lw[i] / 2, s * 0.35); ctx.fillStyle = key ? (L[2].includes('CHEFE') ? '#e7a2ff' : '#8fe6ff') : '#fff'; ctx.fillText(txt, -lw[i] / 2, s * 0.35); ctx.restore(); }
      x += lw[i] + sp; });
  });
}
function selo(t, t0, txt, x, y, cor) {
  const u = t - t0; if (u < 0) return; const s = E.outBack(u / q(10), 2.6);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.06); ctx.font = `46px ${F}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(txt).width + 50; ctx.fillStyle = cor; ctx.beginPath(); ctx.roundRect(-w / 2, -36, w, 72, 16); ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillText(txt, 0, 3); ctx.restore();
}

// ---------- quadro ----------
const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler(), vv = new THREE.Vector3(), ss = new THREE.Vector3();
const esconde = () => m4.compose(vv.set(0, -5, 0), qq.identity(), ss.set(0.001, 0.001, 0.001));
function quadro(t) {
  const tw = J.hitStop(t, GOLPES), qf = tw * 60; U.uT.value = tw; gUni.uT.value = tw;
  // maga: recua 2 passos quando eles acordam, encara o grupo; no fim vira pro chefe
  const rec = 0.32 * E.io3((qf - B.recua) / 45);
  HERO.o.position.copy(BASE).add(V3(0.05 * rec, 0, rec)); const hp = HERO.o.position;
  const yG = Math.atan2(0.1 - hp.x, -1.0 - hp.z), yC = Math.atan2(CHEFE.p0.x - hp.x, CHEFE.p0.z - hp.z);
  HERO.o.rotation.y = lerp(yG, yC, E.io3((qf - B.ress - 10) / 30)) + (qf > B.cheer && qf < B.ress ? 0.5 * E.io3((qf - B.cheer) / 20) * (1 - E.io3((qf - B.ress) / 20)) : 0);
  animar(HERO, SEQ_H, qf); HERO.o.updateMatrixWorld(true);
  const mao = HERO.mao.getWorldPosition(V3(0, 0, 0));
  // esqueletos
  for (const P of SK) {
    const p = alvoSK(P, qf); P.o.position.copy(p); P.o.rotation.y = Math.atan2(hp.x - p.x, hp.z - p.z);
    animar(P, P.SEQ, qf);
    const aw = clamp((qf - B.acorda - P.i * 10 - 25) / 20); P.olhos.forEach((m) => m.color.copy(P.corOlho).multiplyScalar(aw * (1 - clamp((qf - P.queb - 10) / 20)) * (qf > P.cong && qf < P.queb ? 0.25 : 1)));
    // congelar: clarão branco 3 q, depois azul gelo; descongela quando quebra
    const c = qf > P.cong ? clamp((qf - P.cong) / 6) * (1 - clamp((qf - P.queb) / 30)) : 0; const fl = qf > P.cong && qf < P.cong + 4 ? 1 : 0;
    P.mats.forEach((m, k) => { m.color.copy(P.cor0[k]).lerp(COR_GELO, c * 0.8); m.emissive.copy(EMI_GELO).multiplyScalar(c * 0.6); if (fl) m.emissive.setRGB(1, 1, 1); });
  }
  CHEFE.o.position.copy(CHEFE.p0).add(V3(0, 0.07 * T * 0.6, 0)); CHEFE.o.rotation.y = Math.atan2(hp.x - CHEFE.p0.x, hp.z - CHEFE.p0.z); animar(CHEFE, CHEFE.SEQ, qf);
  const ac = clamp((qf - B.ress - 30) / 25); CHEFE.olhos.forEach((m) => m.color.copy(CHEFE.corOlho).multiplyScalar(ac * (1 + 0.4 * Math.sin(tw * 9))));
  luzChefe.position.copy(CHEFE.p0).add(V3(0, 0.9, 0.5)); luzChefe.intensity = ac * (2.5 + 0.6 * Math.sin(tw * 7));
  scene.updateMatrixWorld(true);
  // tochas tremulando (ficam mais fracas enquanto o gelo é a luz da cena)
  const carga = clamp((qf - B.carga0) / (B.solta - B.carga0)); const dim = E.io3(carga) * (1 - E.io3((qf - B.quebra) / 80));
  for (const tc of TOCHAS) { const f = 0.85 + 0.1 * Math.sin(tw * 13 + tc.sem) + 0.07 * Math.sin(tw * 23.7 + tc.sem * 2) + 0.05 * Math.sin(tw * 41 + tc.sem);
    tc.L.intensity = 3.2 * f * (1 - 0.5 * dim); tc.sp.forEach((s, k) => { const a = tw * (9 + k * 3) + tc.sem; s.position.copy(tc.p).add(V3(0.01 * Math.sin(a), 0.03 * k + 0.012 * Math.sin(a * 1.3), 0)); s.scale.setScalar((0.2 - k * 0.05) * f * (1 + 0.15 * Math.sin(a * 1.7))); }); }
  hemi.intensity = lerp(HEMI0, HEMI0 * 0.6, dim); chave.intensity = lerp(CHAVE0, CHAVE0 * 0.35, dim);
  luzMao.position.copy(mao); luzMao.intensity = qf < B.solta ? 0.7 * E.in2(carga) * (qf > B.carga0 ? 1 : 0) : 1.5 * Math.exp(-(qf - B.solta) / 10);
  const ui = qf - B.impacto; luzImp.position.set(0.1, 0.8, -0.4); luzImp.intensity = ui < 0 ? 0 : ui < 50 ? 5 * Math.exp(-ui / 14) + 1.5 : 1.5 * (1 - clamp((qf - B.quebra) / 30));
  // cristais
  let n = 0;
  for (const c of CR) { const uq = (tw - c.t0) * 60; let s = uq > 0 ? E.outBack(uq / (c.fin ? 8 : 6), 2.2) : 0; const tq = quebraDe(c); if (qf > tq) s *= 1 - E.in2((qf - tq) / 6);
    s = Math.max(1e-4, s * c.s); ee.set(...c.inc); qq.setFromEuler(ee); m4.compose(vv.set(c.x, -0.02, c.z), qq, ss.set(s, s * (0.9 + 0.2 * hash(n)), s)); imCr.setMatrixAt(n++, m4); }
  imCr.instanceMatrix.needsUpdate = true; imCr.visible = qf > B.solta;
  { let j = 0; for (const c of CR) { const tq = quebraDe(c); const g = qf > tq ? E.out3((qf - tq) / 20) : (tw > c.t0 ? 0.35 * E.out3((tw - c.t0) * 6) : 0); const r = Math.max(1e-4, g * c.s * (c.fin ? 0.32 : 0.24));
      m4.compose(vv.set(c.x, 0.012 + j * 0.0002, c.z), qq.identity(), ss.set(r * 1.3, 1, r)); imGeada.setMatrixAt(j++, m4); }
    imGeada.instanceMatrix.needsUpdate = true; imGeada.material.opacity = 0.35 * (1 - clamp((qf - B.escolha) / 40)); }
  gUni.uBrilho.value = 1 + (qf > B.impacto ? 0.25 * Math.exp(-(qf - B.impacto) / 10) : 0);
  for (let i = 0; i < NCACO; i++) { const c = CR[(i * 7) % CR.length]; const u = (qf - quebraDe(c)) / 60;
    if (u < 0 || u > 1.1) { esconde(); imCaco.setMatrixAt(i, m4); continue; }
    const h1 = hash(i * 1.3), h2 = hash(i * 2.1 + 5), h3 = hash(i * 3.7 + 9), a = h1 * Math.PI * 2, sp = (1.0 + 1.6 * h2) * (c.fin ? 1.4 : 0.8);
    let y = 0.2 + 0.6 * h3 * c.s + (1.6 + 2 * h2) * u - 4.9 * u * u; if (y < 0.02) y = 0.02;
    vv.set(c.x + Math.cos(a) * sp * u * 0.6, y, c.z + Math.sin(a) * sp * u * 0.6); ee.set(u * 12 * h1, u * 9 * h2, u * 7); qq.setFromEuler(ee); const k = (0.6 + 1.2 * h3) * (1 - clamp((u - 0.7) / 0.4)) * (c.fin ? 1.5 : 1);
    m4.compose(vv, qq, ss.set(k, k * 1.6, k)); imCaco.setMatrixAt(i, m4); }
  imCaco.instanceMatrix.needsUpdate = true;
  // partículas de gelo
  for (let i = 0; i < NP; i++) { const h1 = hash(i + 0.3), h2 = hash(i + 7.7), h3 = hash(i + 3.1); let p = null, k = 0;
    if (i < 90) { const nasce = B.carga0 + h1 * (B.solta - B.carga0 - 12), u = (qf - nasce) / 22; if (u >= 0 && u <= 1 && qf < B.solta + 2) { const r = 0.55 * (1 - E.in2(u)), a = h2 * 6.28 + u * 5; p = mao.clone().add(V3(Math.cos(a) * r, Math.sin(a) * r * 0.8, Math.sin(a * 0.7) * r * 0.6)); k = 0.6 + 1.4 * u; } }
    else if (i < 240) { const P = SK[i % 3]; const u = (qf - P.cong) / 40; if (u >= 0 && u <= 1) { const c0 = alvoSK(P, P.cong); const a = h1 * 6.28, el = h2 * 1.4, sp = 1.4 + 1.8 * h3; p = V3(c0.x + Math.cos(a) * Math.cos(el) * sp * u * 0.6, 0.5 + Math.sin(el) * sp * u * 0.6 - 1.5 * u * u, c0.z + Math.sin(a) * Math.cos(el) * sp * u * 0.6); k = 1.5 * (1 - u); } }
    else { const u = (qf - B.quebra + 10 - h1 * 70) / 190; if (u >= 0 && u <= 1) { p = V3(-2 + h2 * 4.2 + Math.sin(u * 6 + i) * 0.12, 2.3 - u * 2.4, -2.6 + h3 * 3.4); k = Math.sin(Math.PI * u); } }
    if (p) m4.compose(p, qq.identity(), ss.set(k, k, k)); else esconde(); imP.setMatrixAt(i, m4); }
  imP.instanceMatrix.needsUpdate = true;
  // poeira flutuando na luz das tochas (sempre)
  for (let i = 0; i < NPO; i++) { const h1 = hash(i + 900), h2 = hash(i + 901), h3 = hash(i + 902); const u = (tw * 0.05 + h1) % 1;
    m4.compose(vv.set(-2.2 + 4.4 * h2 + 0.15 * Math.sin(tw * 0.7 + i), 0.2 + 2.2 * u, -4 + 6 * h3 + 0.1 * Math.cos(tw * 0.5 + i)), qq.identity(), ss.setScalar(Math.sin(Math.PI * u))); imPo.setMatrixAt(i, m4); }
  imPo.instanceMatrix.needsUpdate = true;
  // aura do chefe: fagulhas roxas subindo
  for (let i = 0; i < NPR; i++) { const h1 = hash(i + 500), h2 = hash(i + 501); const u = ((qf - B.ress - 20) / 70 + h1) % 1; const on = qf > B.ress + 20 + h1 * 30;
    if (!on) { esconde(); imPr.setMatrixAt(i, m4); continue; } const a = h2 * 6.28 + u * 2; const r = 0.25 + 0.2 * u;
    m4.compose(vv.set(CHEFE.p0.x + Math.cos(a) * r, 0.1 + 1.3 * u, CHEFE.p0.z + Math.sin(a) * r), qq.identity(), ss.setScalar(1.3 * Math.sin(Math.PI * u) * ac + 1e-3)); imPr.setMatrixAt(i, m4); }
  imPr.instanceMatrix.needsUpdate = true;
  const urc = (qf - B.ress - 40) / 40; anelChefe.visible = urc > 0 && urc < 1; anelChefe.position.set(CHEFE.p0.x, 0.12, CHEFE.p0.z); if (anelChefe.visible) { anelChefe.scale.setScalar(1 + 4 * E.out3(urc)); anelChefe.material.opacity = 1 - urc; }
  // câmera
  const C = camEm(tw, t); cam.fov = C.fov; cam.updateProjectionMatrix(); cam.position.copy(C.pos); cam.lookAt(C.alvo); cam.rotateZ(C.roll); cam.updateMatrixWorld(true);
  const ua = (qf - B.solta) / 14; anel.visible = ua >= 0 && ua <= 1; if (anel.visible) { anel.position.copy(mao); anel.lookAt(cam.position); anel.scale.setScalar(0.3 + 1.3 * E.out3(ua)); anelMat.opacity = 0.7 * (1 - ua); }
  bloom.strength = 0.4 + 0.2 * dim;
  composer.render();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(glc, 0, 0, RW, RH); ctx.setTransform(ESC, 0, 0, ESC, 0, 0);
  // glow de tela
  { ctx.save(); ctx.globalCompositeOperation = 'screen';
    const brilho = (pt, r, a, rgb) => { const [x, y] = proj(pt); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); };
    for (const tc of TOCHAS) brilho(tc.p, 150, 0.16, '255,150,70');
    if (qf > B.carga0 && qf < B.solta + 20) brilho(mao, 60 + 70 * carga, 0.14 * carga * (qf < B.solta ? 1 : Math.exp(-(qf - B.solta) / 6)), '150,225,255');
    if (qf > B.impacto && qf < B.quebra + 40) brilho(V3(0.1, 0.5, -0.6), 380, 0.12 * Math.exp(-(qf - B.impacto) / 20) + 0.05, '150,225,255');
    if (ac > 0) brilho(CHEFE.p0.clone().add(V3(0, 0.7, 0)), 300, 0.18 * ac, '200,100,255');
    ctx.restore(); }
  { const vg = ctx.createRadialGradient(540, 960, 480, 540, 960, 1300); vg.addColorStop(0, 'rgba(8,5,20,0)'); vg.addColorStop(1, `rgba(8,5,20,${0.6 + 0.2 * dim})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
  { const fg = ctx.createLinearGradient(0, 1250, 0, 1920); fg.addColorStop(0, 'rgba(10,6,25,0)'); fg.addColorStop(1, 'rgba(10,6,25,0.55)'); ctx.fillStyle = fg; ctx.fillRect(0, 1250, W, 670); }
  for (const [qq0, a] of [[B.solta, 0.18], [B.impacto, 0.28]]) if (t * 60 >= qq0 && t * 60 < qq0 + 4) { ctx.fillStyle = `rgba(225,248,255,${t * 60 < qq0 + 1 ? a : a * 0.35})`; ctx.fillRect(0, 0, W, H); }
  // HUD: dano em cada esqueleto + selo
  const DANO = [[38, 'dano', -1], [124, 'crit', 0], [41, 'dano', 1]];
  for (const P of SK) { const [x, y] = proj(alvoSK(P, P.cong).add(V3(0, 1.1, 0))); J.numeroDano(ctx, t, { t0: Tq(P.cong), valor: DANO[P.i][0], tipo: DANO[P.i][1], lado: DANO[P.i][2] }, x, y - 40, P.i === 1 ? 0.8 : 1); }
  if (t > Tq(B.impacto + 18) && t < Tq(B.cheer)) { ctx.globalAlpha = 1 - clamp((t - Tq(B.cheer - 15)) / q(15)); const [x, y] = proj(V3(0.15, 0.2, -0.7)); selo(t, Tq(B.impacto + 18), 'CONGELADOS', x, y + 120, '#2f8fe0'); ctx.globalAlpha = 1; }
  if (qf > B.ress + 45 && qf < B.escolha) { const k = E.outBack(clamp((qf - B.ress - 45) / 16)); ctx.save(); ctx.translate(540, 300); ctx.scale(k, k); J.barraVida(ctx, -260, -30, 520, 52, { fill: 999, pedaco: null, mostrado: 999 }, 999, 'REI ESQUELETO', F); ctx.restore(); }
  if (t < Tq(B.escolha)) legenda(t);
  if (t >= Tq(B.escolha)) J.escolha(ctx, t, Tq(B.escolha), 'O QUE A MAGA FAZ?', 'CORRER PRA SAÍDA', 'ENCARAR O REI');
}

window.DUR = DUR;
window.seek = async (t) => { quadro(t); };
new FontFace('Titan', 'url(../fontes/TitanOne.woff2)').load().then((f) => { document.fonts.add(f); quadro(0); window.READY = true; });
