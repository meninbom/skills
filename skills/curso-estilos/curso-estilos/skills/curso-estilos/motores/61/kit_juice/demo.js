// Demos do kit (3 s cada): demo.html?d=<nome>. Palco neutro: noite azul, herói (cápsula laranja com espada) e gosma roxa.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as J from './juice.js';
import { E, q, clamp, lerp, hash, COR } from './tokens.js';

const Q = new URLSearchParams(location.search);
const D = Q.get('d') || 'hitstop';
const W = 1080, H = 1920, SS = Number(Q.get('ss') || 1), ESC = Number(Q.get('esc') || 0.5);
const RW = Math.round(W * ESC), RH = Math.round(H * ESC);
const glc = document.createElement('canvas'); glc.width = RW * SS; glc.height = RH * SS;
const out = document.getElementById('c'); out.width = RW; out.height = RH; const ctx = out.getContext('2d');
const F = 'Titan, sans-serif';
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(RW * SS, RH * SS, false); renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
{ const c = document.createElement('canvas'); c.width = 2; c.height = 512; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#0b1030'); gr.addColorStop(0.45, '#1d2a66'); gr.addColorStop(0.6, '#24357a'); gr.addColorStop(1, '#080b22'); g.fillStyle = gr; g.fillRect(0, 0, 2, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t; }
scene.add(new THREE.HemisphereLight('#9fb4ff', '#2a1d40', 1.4));
const sol = new THREE.DirectionalLight('#ffe2c0', 2.2); sol.position.set(-2, 4, 3); scene.add(sol);
// chão: disco com grade
const chao = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.ShaderMaterial({
  vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `varying vec2 vP; void main(){ vec2 g = abs(fract(vP*2.5)-0.5); float l = 1.0-smoothstep(0.0,0.04,min(g.x,g.y)); float r = length(vP);
    vec3 c = mix(vec3(0.05,0.07,0.2), vec3(0.18,0.32,0.75), l*0.7) * (1.0 - smoothstep(1.6,2.6,r)); gl_FragColor = vec4(c, 1.0); }`,
}));
chao.rotation.x = -Math.PI / 2; scene.add(chao);
// herói
const heroi = new THREE.Group(); heroi.position.set(-0.75, 0, 0); scene.add(heroi);
const corpoH = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.42, 8, 20), new THREE.MeshStandardMaterial({ color: '#ff8a2a', roughness: 0.4 })); corpoH.position.y = 0.44; heroi.add(corpoH);
for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: '#1a1010' })); o.position.set(0.09, 0.6, s * 0.08 + 0.12); o.position.set(0.18, 0.58, s * 0.07); heroi.add(o); }
const ombro = new THREE.Group(); ombro.position.set(0.12, 0.5, 0.22); heroi.add(ombro);
const espada = new THREE.Group(); ombro.add(espada);
const lam = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.015), new THREE.MeshStandardMaterial({ color: '#e8f0ff', metalness: 0.3, roughness: 0.25, emissive: new THREE.Color('#33405a') })); lam.position.y = 0.42; espada.add(lam);
const cabo = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.05), new THREE.MeshStandardMaterial({ color: '#c99a3a' })); cabo.position.y = 0.1; espada.add(cabo);
// gosma
const gosma = new THREE.Group(); gosma.position.set(0.75, 0, 0); scene.add(gosma);
const gMat = new THREE.MeshStandardMaterial({ color: '#8a5cff', roughness: 0.3, emissive: new THREE.Color('#000') });
const gCorpo = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 20), gMat); gCorpo.scale.set(1, 0.8, 1); gCorpo.position.y = 0.26; gosma.add(gCorpo);
for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: '#140c20' })); o.position.set(-0.24, 0.34, s * 0.09); gosma.add(o); }
const smear = J.criarSmear('#bfe6ff'); scene.add(smear);

const cam = new THREE.PerspectiveCamera(35, W / H, 0.1, 100);
const composer = new EffectComposer(renderer); composer.setSize(RW * SS, RH * SS);
composer.addPass(new RenderPass(scene, cam)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(RW, RH), 0.6, 0.5, 0.8)); composer.addPass(new OutputPass());
const proj = (v) => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };

// ---------- golpe de espada (beats em quadros a partir de t0) ----------
// 0–14 q antecipação (espada para trás e para cima, corpo recua e agacha) | 14–17 q whip (3 q) | 17 q contato | follow-through 17–30 | volta 30–60
function anguloEspada(t, t0) {
  const u = (t - t0) * 60;
  if (u < 0) return { a: 0.35, rec: 0 };
  if (u < 14) { const k = E.out3(u / 14); return { a: lerp(0.35, 2.3, k), rec: k }; }
  if (u < 17) { const k = E.in2((u - 14) / 3); return { a: lerp(2.3, -1.2, k), rec: 1 - k * 1.6 }; }
  if (u < 30) { const k = E.out3((u - 17) / 13); return { a: lerp(-1.2, -1.75, k), rec: lerp(-0.6, -0.3, k) }; }
  const k = E.io3((u - 30) / 30); return { a: lerp(-1.75, 0.35, k), rec: lerp(-0.3, 0, k) };
}
function poseHeroi(t, t0) {
  const s = anguloEspada(t, t0);
  espada.rotation.set(0, 0, -s.a);
  heroi.position.x = -0.75 - 0.08 * s.rec; heroi.rotation.z = 0.12 * s.rec;
  const sq = s.rec > 0 ? { x: 1 + 0.06 * s.rec, y: 1 - 0.1 * s.rec } : { x: 1 + 0.04 * s.rec, y: 1 - 0.08 * s.rec };
  corpoH.scale.set(sq.x, sq.y, sq.x);
}
function pontaEspada(tt, t0) { // para o smear
  const s = anguloEspada(tt, t0); const o = new THREE.Object3D(); heroi.updateMatrixWorld(true);
  const m = new THREE.Matrix4().makeRotationZ(-s.a); const base = new THREE.Vector3(0, 0.5, 0).applyMatrix4(m), ponta = new THREE.Vector3(0, 0.74, 0).applyMatrix4(m);
  const off = new THREE.Vector3(-0.75 - 0.08 * s.rec + 0.12, 0.5, 0.22);
  return { base: base.add(off), ponta: ponta.add(off) };
}
function reagirGosma(t, tc, kFlash) {
  const sq = J.squash(t - tc, 0.55);
  const kb = t > tc ? 0.18 * E.out3((t - tc) / q(10)) * Math.exp(-Math.max(0, t - tc - q(10)) * 3) : 0;
  gosma.position.x = 0.75 + kb; gosma.scale.set(sq.x, sq.y, sq.z);
  J.pintarClarao(gMat, kFlash);
}

const DEMOS = {};
const T_CONT = 1.2; // contato padrão (t0 do golpe = T_CONT - 17 q)
const T0 = T_CONT - q(17);
const camPadrao = (t, sh) => { cam.position.set(0 + (sh?.x || 0), 1.15 + (sh?.y || 0), 6.4); cam.lookAt(0 + (sh?.x || 0) * 0.5, 0.55, 0); cam.rotateZ(sh?.rot || 0); };

DEMOS.hitstop = (t) => { const golpes = [{ t: T_CONT, stop: 6 }]; const tw = J.hitStop(t, golpes); poseHeroi(tw, T0); reagirGosma(tw, T_CONT, J.clarao(t, T_CONT, 4, 2)); camPadrao(t, J.trauma(tw, [{ t: T_CONT }]));
  return { rot: 'HIT-STOP 6q + CLARÃO 4q', post: (c) => { if (t >= T_CONT && t < T_CONT + q(6)) { c.font = `40px ${F}`; c.fillStyle = '#ff3b4a'; c.textAlign = 'center'; c.fillText('◼ STOP', 540, 1300); } } }; };
DEMOS.squash = (t) => { // gosma pula e cai: estica subindo, achata no chão
  const ciclo = 1.0, u = t % ciclo, alt = 4 * u * (ciclo - u) / ciclo ** 2; const vy = Math.abs(1 - 2 * u / ciclo);
  const st = alt > 0.05 ? J.stretch(vy * 0.9) : J.squash(u < 0.5 ? u : u - ciclo + 0.02, 1.2);
  const land = J.squash((t % ciclo) - 0.0, 1.1); const s = u < q(10) ? land : st;
  gosma.position.set(0.25, alt * 0.9, 0); gosma.scale.set(s.x, s.y, s.z); heroi.visible = false; camPadrao(t); return { rot: 'SQUASH & STRETCH (volume constante)' }; };
DEMOS.numeros = (t) => { const hits = [0.5, 0.85, 1.2, 1.9].map((x, i) => ({ t: x, valor: [12, 9, 14, 87][i], tipo: i === 3 ? 'crit' : 'dano', lado: [-1, 1, 0, 0][i] }));
  const last = hits.filter((h) => h.t <= t).pop(); poseHeroi(t, (last ? last.t : 0.5) - q(17));
  reagirGosma(t, last ? last.t : 9, last ? J.clarao(t, last.t) : 0); camPadrao(t, J.trauma(t, hits.map((h) => ({ t: h.t, forca: h.tipo === 'crit' ? 1 : 0.4 }))));
  return { rot: 'NÚMERO: POP • SOBE • SOME • ARCO • CRÍTICO', post: (c) => { const [ax, ay] = proj(new THREE.Vector3(0.75, 0.85, 0)); hits.forEach((h) => J.numeroDano(c, t, { t0: h.t, valor: h.valor, tipo: h.tipo, lado: h.lado }, ax, ay)); } }; };
DEMOS.barra = (t) => { const hits = [{ t: 0.5, de: 100, para: 78 }, { t: 1.4, de: 78, para: 52 }, { t: 2.2, de: 52, para: 21 }];
  const last = hits.filter((h) => h.t <= t).pop(); poseHeroi(t, (last ? (hits[hits.indexOf(last) + 1]?.t ?? 9) : 0.5) - q(17));
  reagirGosma(t, last ? last.t : 9, last ? J.clarao(t, last.t) : 0); camPadrao(t);
  return { rot: 'BARRA QUE MENTE: PEDAÇO SEGURA 30q E ESCOA', post: (c) => { const st = J.vidaEm(t, 100, hits); J.barraVida(c, 230, 560, 620, 60, st, 100, 'GOSMA REAL', F); } }; };
DEMOS.smear = (t) => { poseHeroi(t, T0); reagirGosma(t, T_CONT, J.clarao(t, T_CONT)); camPadrao(t);
  const u = (t - T0) * 60; smear.userData.amostrar((tt) => pontaEspada(tt, T0), t, q(6), u > 13 && u < 26 ? (u < 18 ? 1 : 1 - (u - 18) / 8) : 0);
  return { rot: 'SMEAR: WHIP 3q, CAUDA EM ALPHA 0' }; };
DEMOS.velocidade = (t) => { // herói corre da esquerda para a direita; câmera atrasada; linhas de velocidade
  const px = (tt) => -1.6 + 3.2 * E.io3(tt / 3); const forca = clamp(Math.abs(px(t + 0.02) - px(t - 0.02)) / 0.06);
  heroi.position.x = px(t); heroi.rotation.z = -0.25 * forca; const st = J.stretch(forca * 0.5); corpoH.scale.set(st.y, st.x, st.x); gosma.visible = false;
  const alvo = J.alvoAtrasado((tt) => new THREE.Vector3(px(tt), 0.5, 0), t, q(10));
  cam.fov = 35 + 14 * forca; cam.updateProjectionMatrix(); cam.position.set(alvo.x - 0.5 * forca, 1.0, 5.2); cam.lookAt(alvo.x, 0.5, 0);
  return { rot: 'VELOCIDADE: LINHAS + FOV + CÂMERA ATRASADA', post: (c) => J.linhasVelocidade(c, t, forca) }; };
DEMOS.item = (t) => { poseHeroi(t, T0); reagirGosma(t, T_CONT, J.clarao(t, T_CONT)); camPadrao(t);
  const its = Array.from({ length: 7 }, (_, i) => ({ t0: T_CONT + q(8) + i * q(5), i, dur: q(42) })); const cheg = its.map((i) => i.t0 + i.dur);
  return { rot: 'ITEM VOA ATÉ O CONTADOR (ARCO) + CONTADOR PULA', post: (c) => {
    const [ax, ay] = proj(new THREE.Vector3(0.75, 0.4, 0)); let n = 120 + 5 * cheg.filter((x) => x <= t).length;
    for (const it of its) { const p = J.itemVoa(t, { ...it, de: [ax, ay], para: [880, 250] }); if (p) J.desenharMoeda(c, p.x, p.y, 34 * p.s, p.rot); }
    const s = J.pulo(t, cheg); c.save(); c.translate(860, 250); c.scale(s, s); J.desenharMoeda(c, -80, 0, 40); c.font = `64px ${F}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.lineWidth = 10; c.strokeStyle = COR.tinta; c.strokeText(String(n), -30, 4); c.fillStyle = '#fff'; c.fillText(String(n), -30, 4); c.restore(); } }; };
DEMOS.carta = (t) => { heroi.visible = false; gosma.visible = false; camPadrao(t);
  const verso = (c, w, h) => { const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#3a2a8a'); g.addColorStop(1, '#16123a'); c.fillStyle = g; c.fillRect(-w / 2, -h / 2, w, h); c.strokeStyle = '#8f7bff'; c.lineWidth = 6; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(0, 0, 40 + i * 30, 0, Math.PI * 2); c.stroke(); } };
  const frente = (c, w, h) => { const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#ff8a2a'); c.fillStyle = g; c.fillRect(-w / 2, -h / 2, w, h); J.estrela(c, 0, -60, 120, 0, '#fff'); c.font = `56px ${F}`; c.fillStyle = '#4a1d00'; c.textAlign = 'center'; c.fillText('LENDÁRIA', 0, 170); };
  return { rot: 'REVELAÇÃO: SOBE • VIRA • BOOM • BRILHO', post: (c) => J.revelaCarta(c, t, 0.3, 540, 1000, 440, 640, frente, verso) }; };
DEMOS.particulas = (t) => { heroi.visible = false; reagirGosma(t, 9, 0); gosma.position.x = 0; camPadrao(t);
  return { rot: 'PARTÍCULAS: GELO • FOGO • ESTRELA', post: (c) => { J.particulas(c, t, { t0: 0.3, x: 540, y: 1050, tipo: 'gelo', n: 22 }); J.particulas(c, t, { t0: 1.1, x: 540, y: 1150, tipo: 'fogo', n: 26 }); J.particulas(c, t, { t0: 1.9, x: 540, y: 1050, tipo: 'estrela', n: 9 }); } }; };
DEMOS.raiox = (t) => { const TF = T_CONT + q(2); const congela = t >= TF ? TF : t; poseHeroi(congela, T0); reagirGosma(congela, T_CONT, J.clarao(congela, T_CONT)); camPadrao(t);
  const u = (congela - T0) * 60; smear.userData.amostrar((tt) => pontaEspada(tt, T0), congela, q(6), u > 13 && u < 26 ? 1 : 0);
  return { rot: 'RAIO-X: CONGELA A CENA REAL + REPLAY', post: (c) => { if (t < TF) return; const [gx, gy] = proj(new THREE.Vector3(0.75, 0.3, 0)); const [hx, hy] = proj(new THREE.Vector3(-0.6, 0.9, 0));
    J.raioX(c, t, TF, [{ tipo: 'circulo', x: gx, y: gy, r: 150, achata: 0.8, t: q(8), txt: 'CLARÃO 4 QUADROS', tx: gx, ty: gy + 190 }, { tipo: 'seta', x0: hx - 60, y0: hy - 260, x1: gx - 90, y1: gy - 80, t: q(24), txt: 'GOLPE EM 3 QUADROS', tx: 470, ty: hy - 300 }]); } }; };
DEMOS.hud = (t) => { poseHeroi(t, T0); reagirGosma(t, T_CONT, J.clarao(t, T_CONT)); camPadrao(t);
  return { rot: 'HUD DE RPG: LEVEL UP • LOOT • ESCOLHA 1/2', post: (c) => { J.levelUp(c, t, 0.2, 7); J.lootToast(c, t, 1.0, '+120 OURO'); if (t > 2.1) J.escolha(c, t, 2.1, 'E AGORA?', 'ABRIR O BAÚ', 'SEGUIR A TRILHA'); } }; };

window.DUR = 3.0;
window.seek = async (t) => {
  heroi.visible = true; gosma.visible = true; smear.visible = false; gosma.position.set(0.75, 0, 0); gosma.scale.set(1, 1, 1); cam.fov = 35; cam.updateProjectionMatrix(); heroi.position.set(-0.75, 0, 0); heroi.rotation.set(0, 0, 0); corpoH.scale.set(1, 1, 1);
  const r = DEMOS[D](t); cam.updateMatrixWorld(true);
  composer.render();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(glc, 0, 0, RW, RH);
  ctx.setTransform(ESC, 0, 0, ESC, 0, 0);
  if (r.post) r.post(ctx);
  ctx.font = `44px ${F}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillText(r.rot, 540, 1700);
  ctx.font = `30px ${F}`; ctx.fillStyle = 'rgba(255,214,107,0.9)'; ctx.fillText(`q ${Math.round(t * 60)}`, 540, 1770);
};
new FontFace('Titan', 'url(../fontes/TitanOne.woff2)').load().then((f) => { document.fonts.add(f); window.READY = true; });
