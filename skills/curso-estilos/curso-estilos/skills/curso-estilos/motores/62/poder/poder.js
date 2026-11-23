// PODER DE GELO (~8,7 s): Ina descobre um poder. Kit de juice + receita de gelo, em 3D. Beats em B{} (quadros a 60).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { U, toon, comContorno } from '../arena/lib/toon.js';
import { criarIna, aplicarPose } from '../arena/lib/ina.js';
import { poseEstatica, V3 } from '../arena/lib/esqueleto.js';
import * as J from '../kit_juice/juice.js';
import { PODERES } from '../kit_juice/poderes.js';
import { E, q, clamp, lerp, hash, COR } from '../kit_juice/tokens.js';

const Q = new URLSearchParams(location.search);
const W = 1080, H = 1920, SS = Number(Q.get('ss') || 2), ESC = Number(Q.get('esc') || 1);
const RW = Math.round(W * ESC), RH = Math.round(H * ESC), IW = RW * SS, IH = RH * SS;
const F = 'Titan, sans-serif';
const glc = document.createElement('canvas'); glc.width = IW; glc.height = IH;
const out = document.getElementById('c'); out.width = RW; out.height = RH; const ctx = out.getContext('2d');
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(IW, IH, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
U.uRes.value.set(IW, IH); U.uPx.value = SS * ESC; U.uRimCol.value.set('#ffcf9a');

const scene = new THREE.Scene();
// LUZ (fim de tarde, método HOUNDKEEPER): sol baixo de lado e quente, sombra lilás saturada, recorte rosado por trás,
// névoa quente que clareia com a distância (3 planos de profundidade), brilho do sol no céu.
const SOL_TELA = [0.8, 0.5]; // onde fica o brilho do sol no fundo (fração da tela)
{
  const c = document.createElement('canvas'); c.width = 270; c.height = 480; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 480);
  [[0, '#2e2160'], [0.18, '#5b3487'], [0.33, '#b4568e'], [0.44, '#f2876e'], [0.52, '#ffbf7a'], [0.57, '#ffe2a4'], [0.62, '#f6b08c'], [1, '#e79a86']].forEach(([s, k]) => gr.addColorStop(s, k));
  g.fillStyle = gr; g.fillRect(0, 0, 270, 480);
  const sx = 270 * SOL_TELA[0], sy = 480 * SOL_TELA[1];
  const rg = g.createRadialGradient(sx, sy, 0, sx, sy, 230); rg.addColorStop(0, 'rgba(255,240,200,0.95)'); rg.addColorStop(0.08, 'rgba(255,226,170,0.85)'); rg.addColorStop(0.35, 'rgba(255,170,110,0.35)'); rg.addColorStop(1, 'rgba(255,140,110,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 270, 480);
  g.fillStyle = '#fff7e2'; g.beginPath(); g.arc(sx, sy, 13, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,190,170,0.35)';
  for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(30 + i * 40 + hash(i) * 20, 150 + hash(i + 2) * 70, 50 + 30 * hash(i + 4), 6 + 4 * hash(i + 5), 0, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
}
scene.fog = new THREE.Fog('#f6b892', 13, 42);
const hemi = new THREE.HemisphereLight('#c9b8ff', '#5e3f86', 1.05); scene.add(hemi);
const sol = new THREE.DirectionalLight('#ffc48a', 3.3); sol.position.set(4.5, 2.6, 4.2); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20 }); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02; scene.add(sol);
const contra = new THREE.DirectionalLight('#ff9fc4', 1.4); contra.position.set(-4.5, 3, -5); scene.add(contra);
const SOLDIR = new THREE.Vector3(-4, 2.2, -4).normalize(); // direção do recorte (rim) dos materiais toon
U.uRimCol.value.set('#ffd7b8');

// ---------- cenário toon: clareira, rio, ponte, árvores em 3 planos ----------
function ctoon(geo, cor, o = {}) { const m = new THREE.Mesh(geo, toon(cor, o)); m.castShadow = o.sombra ?? true; m.receiveShadow = true; if (o.ol !== 0) comContorno(m, o.ol ?? 6); return m; }
{ // chão: grama com manchas, trilha de terra até a ponte, florzinhas
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
  g.fillStyle = '#7fc25a'; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 900; i++) { const x = hash(i) * 1024, y = hash(i + 1e3) * 1024, r = 8 + hash(i + 2e3) * 40; g.fillStyle = ['#6fb04e', '#8fcc5e', '#76b552', '#9ad468'][i % 4]; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(x, y, r * 1.6, r, 0, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1; const u = (x) => 512 + x / 28 * 1024, v = (z) => 512 + z / 28 * 1024;
  g.fillStyle = '#c9b071'; g.beginPath(); g.ellipse(u(0), v(0.1), 1.6 / 28 * 1024, 0.8 / 28 * 1024, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#d9b27a'; g.lineCap = 'round'; g.lineWidth = 1.0 / 28 * 1024; g.beginPath(); g.moveTo(u(0.3), v(-0.6)); g.quadraticCurveTo(u(1.0), v(-1.8), u(1.4), v(-2.7)); g.stroke();
  g.fillStyle = '#c99f68'; for (let i = 0; i < 60; i++) { g.beginPath(); g.arc(u((hash(i + 7) - 0.5) * 4), v((hash(i + 9) - 0.5) * 2.4), 2 + hash(i) * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 160; i++) { g.fillStyle = ['#fff1d6', '#ffd36b', '#ff9fc4'][i % 3]; g.beginPath(); g.arc(hash(i + 50) * 1024, hash(i + 80) * 1024, 2.5, 0, Math.PI * 2); g.fill(); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
  const chao = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshLambertMaterial({ map: tx, color: '#e8ffd8' })); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; scene.add(chao);
}
{ // rio com brilhos do pôr do sol
  const c = document.createElement('canvas'); c.width = 512; c.height = 64; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#6fb9e0'); gr.addColorStop(1, '#a4dbef'); g.fillStyle = gr; g.fillRect(0, 0, 512, 64);
  for (let i = 0; i < 70; i++) { g.fillStyle = i % 3 ? 'rgba(255,230,190,0.8)' : 'rgba(255,255,255,0.9)'; g.fillRect(hash(i) * 512, hash(i + 3) * 64, 10 + hash(i + 5) * 40, 2); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  const rio = new THREE.Mesh(new THREE.PlaneGeometry(40, 2.2), new THREE.MeshBasicMaterial({ map: tx })); rio.rotation.x = -Math.PI / 2; rio.position.set(0, 0.01, -3.6); scene.add(rio);
}
for (let i = 0; i < 9; i++) { const t = ctoon(new THREE.BoxGeometry(0.42, 0.08, 1.9), i % 2 ? '#b77a42' : '#a86d3a', { ol: 4 }); t.position.set(1.4 + (i - 4) * 0.45, 0.22, -3.6); scene.add(t); }
for (const z of [-2.65, -4.55]) { const c = ctoon(new THREE.BoxGeometry(4.2, 0.07, 0.07), '#7a4c28', { ol: 3 }); c.position.set(1.4, 0.62, z); scene.add(c); for (let i = 0; i < 6; i++) { const p = ctoon(new THREE.BoxGeometry(0.08, 0.5, 0.08), '#7a4c28', { ol: 3 }); p.position.set(1.4 + (i - 2.5) * 0.8, 0.4, z); scene.add(p); } }
// árvores: plano 1 (perto, saturadas, balançam), plano 2 (meio), plano 3 (morros longe, somem na névoa)
function arvore(x, z, h, cor, ol) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  for (let k = 0; k < 3; k++) { const r = (0.85 - k * 0.2) * h / 3.2, hh = h * (0.5 - k * 0.08); const c = ctoon(new THREE.ConeGeometry(r, hh, 8), cor, { ol, flat: true }); c.position.y = 0.45 + h * (0.22 + k * 0.2); g.add(c); }
  const tk = ctoon(new THREE.CylinderGeometry(0.07, 0.11, 0.6, 6), '#5e3a28', { ol: Math.min(ol, 3) }); tk.position.y = 0.3; g.add(tk); scene.add(g);
}
for (let i = 0; i < 13; i++) arvore(-7 + i * 1.15 + hash(i) * 0.5, -6.3 - hash(i + 3) * 1.8, 2.6 + hash(i + 7) * 1.6, ['#2f6b52', '#3a7a58', '#2a5f4f'][i % 3], 5);
for (let i = 0; i < 16; i++) arvore(-11 + i * 1.5 + hash(i + 40) * 0.8, -11 - hash(i + 43) * 3, 3.5 + hash(i + 47) * 2, '#4c6f6a', 3);
for (let i = 0; i < 6; i++) { const m = ctoon(new THREE.ConeGeometry(5 + hash(i) * 3, 4 + hash(i + 1) * 3, 6), '#8a6aa8', { ol: 0, flat: true }); m.position.set(-22 + i * 9, 1.5, -26 - hash(i + 2) * 4); scene.add(m); }
for (let i = 0; i < 7; i++) { const r = ctoon(new THREE.DodecahedronGeometry(0.12 + hash(i + 20) * 0.14, 0), '#a49ab8', { ol: 4, flat: true }); r.position.set(-2.2 + hash(i + 30) * 4.4, 0.06, -1.6 + hash(i + 40) * 1.2 - (i % 2) * 0.5); r.rotation.set(i, i * 2, 0); scene.add(r); }
{ // tufos de grama em volta (fora da área dos personagens)
  const geo = new THREE.ConeGeometry(0.03, 0.12, 4); const m = new THREE.InstancedMesh(geo, toon('#7fa844', { rim: 0.3 }), 160); const o = new THREE.Object3D();
  for (let i = 0; i < 160; i++) {
    const x = (hash(i + 300) - 0.5) * 7, z = -2.4 + hash(i + 400) * 1.6;
    if (Math.abs(x) < 1.6 && Math.abs(z) < 0.9) o.position.set(9, -5, 0); else o.position.set(x, 0.1, z);
    o.rotation.set((hash(i) - 0.5) * 0.5, hash(i + 1) * 3, (hash(i + 2) - 0.5) * 0.5); o.scale.setScalar(0.7 + hash(i + 3) * 0.8); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
  }
  m.receiveShadow = true; scene.add(m);
}


// =====================================================================================================
// PODER DE GELO: "ice spikes" (inspirado em estudos de game feel) em 3D de verdade + luz dinâmica do próprio poder.
// =====================================================================================================
const Tq = (n) => n / 60;
const B = { carga0: 60, puxa: 80, estende: 100, solta: 150, onda1: 177, impacto: 180, finish1: 188, segura1: 232, quebra1: 268, olha: 300, escolha: 430, fim: 520 };
const DUR = B.fim / 60;
const STOP = 6;
const GOLPES = [{ t: Tq(B.impacto), stop: STOP, forca: 1.4 }];

// ---------- personagens ----------
const BASE = V3(-0.62, 0, 0.3);
const ina = criarIna(); scene.add(ina);
const GX = 0.62, GZ = -0.3;
const gosma = new THREE.Group(); gosma.position.set(GX, 0, GZ); gosma.rotation.y = 0.35; scene.add(gosma);
const prof = []; for (let i = 0; i <= 20; i++) { const u = i / 20, a = u * Math.PI / 2; prof.push(new THREE.Vector2(Math.max(1e-3, 0.38 * Math.cos(a) * (1 + 0.08 * Math.sin(u * 3))), 0.5 * Math.sin(a) ** 0.8)); }
const gMat = toon('#5fcf9a'); const gCorpo = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), gMat); gCorpo.castShadow = true; comContorno(gCorpo, 7); gosma.add(gCorpo);
const olhoM = new THREE.MeshBasicMaterial({ color: '#16241e' });
for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), olhoM); o.scale.set(0.8, 1.3, 0.5); o.position.set(-0.3, 0.27, s * 0.1); gCorpo.add(o); }
const coroa = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.1, 5, 1, true), toon('#ffcf3d', { side: THREE.DoubleSide })); coroa.position.set(0.02, 0.52, 0); coroa.rotation.z = 0.25; comContorno(coroa, 4); gCorpo.add(coroa);
const COR_GELO = new THREE.Color('#9fe6ff');

// ---------- material de gelo (facetado, fresnel brilhante, núcleo azul) ----------
const gUni = { uT: { value: 0 }, uBrilho: { value: 1 } };
function matGelo(base = '#3b8fe0') {
  return new THREE.ShaderMaterial({
    uniforms: { ...gUni, uBase: { value: new THREE.Color(base) } },
    vertexShader: `varying vec3 vV; varying vec3 vW;
void main(){
  vec4 p = vec4(position, 1.0);
#ifdef USE_INSTANCING
  p = instanceMatrix * p;
#endif
  vec4 w = modelMatrix * p; vW = w.xyz; vec4 mv = viewMatrix * w; vV = -mv.xyz; gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: `uniform vec3 uBase; uniform float uBrilho, uT; varying vec3 vV; varying vec3 vW;
      void main(){
        vec3 n = normalize(cross(dFdx(vV), dFdy(vV)));
        vec3 v = normalize(vV);
        float fr = pow(1.0 - abs(dot(n, v)), 4.0);
        float f = clamp(0.5 + 0.55 * n.x + 0.45 * n.y, 0.0, 1.0);   // tom da faceta (luz de cima-direita)
        vec3 fundo = vec3(0.015, 0.09, 0.36), meio = uBase, claro = vec3(0.7, 0.93, 1.0);
        vec3 c = mix(fundo, meio, smoothstep(0.1, 0.7, f));
        c = mix(c, claro, smoothstep(0.78, 0.95, f) * 0.85);          // faceta que pega luz: quase branca
        c += claro * smoothstep(0.45, 1.3, vW.y) * 0.22;              // ponta mais clara
        c += vec3(0.75, 0.95, 1.0) * fr * 1.1;                       // borda fina acesa (vai pro bloom)
        float brilho = smoothstep(0.92, 1.0, sin(vW.y * 9.0 - uT * 6.0 + vW.x * 4.0)); // reflexo correndo
        c += vec3(0.8, 0.95, 1.0) * brilho * 0.25;
        gl_FragColor = vec4(c * uBrilho, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}
const MGELO = matGelo('#1c63e0'), MGELO2 = matGelo('#2f7cf0');
// cristal = octaedro esticado com a base no chão
const geoCristal = new THREE.OctahedronGeometry(1, 0); geoCristal.scale(0.11, 0.55, 0.11); geoCristal.translate(0, 0.42, 0);
const geoCaco = new THREE.TetrahedronGeometry(0.05, 0);

// onda: cristais ao longo do caminho mão → gosma, crescendo de tamanho; laterais menores ("fan out")
const CR = [];
const X0 = -0.3, X1 = GX - 0.22, NC = 13;
for (let i = 0; i < NC; i++) {
  const u = i / (NC - 1), x = lerp(X0, X1, u);
  const tam = 0.35 + 0.9 * u ** 1.4;
  const zc = lerp(0.22, GZ + 0.05, u); CR.push({ x, z: zc + (hash(i) - 0.5) * 0.08, s: tam, inc: [(hash(i + 1) - 0.5) * 0.5, hash(i + 2) * 6, -0.25 - 0.25 * u], t0: Tq(B.solta + 3) + u * Tq(B.onda1 - B.solta - 3), lado: 0, u });
  for (const lado of [-1, 1]) CR.push({ x: x + (hash(i + 7 * lado) - 0.5) * 0.08, z: zc + lado * (0.14 + 0.06 * u), s: tam * (0.45 + 0.2 * hash(i + lado)), inc: [lado * 0.55, hash(i + 3) * 6, -0.2], t0: Tq(B.solta + 3) + u * Tq(B.onda1 - B.solta - 3) + Tq(2), lado, u });
}
// big finish: 9 cristais grandes em coroa em volta da gosma
for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; CR.push({ x: GX + Math.cos(a) * 0.32, z: GZ + Math.sin(a) * 0.32, s: 1.35 + 0.5 * hash(k + 70), inc: [Math.sin(a) * 0.5, a, -Math.cos(a) * 0.5], t0: Tq(B.impacto) + Tq(k % 3), lado: 2, u: 1, fin: true }); }
const geoGeada = new THREE.CircleGeometry(1, 18); geoGeada.rotateX(-Math.PI / 2);
const imGeada = new THREE.InstancedMesh(geoGeada, new THREE.MeshBasicMaterial({ color: '#dff4ff', transparent: true, opacity: 0.4, depthWrite: false }), CR.length); imGeada.frustumCulled = false; scene.add(imGeada);
const imCr = new THREE.InstancedMesh(geoCristal, MGELO, CR.length); imCr.frustumCulled = false; scene.add(imCr); comContorno(imCr, 3.5, '#0a1640');
const NCACO = 260; const imCaco = new THREE.InstancedMesh(geoCaco, MGELO2, NCACO); imCaco.frustumCulled = false; scene.add(imCaco);
// partículas de luz (carga, faíscas, neve): esferinhas aditivas
const NP = 330; const imP = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.011, 1), new THREE.MeshBasicMaterial({ color: '#e6fbff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), NP); imP.frustumCulled = false; scene.add(imP);
// anel do disparo e anel no chão do impacto
const anelMat = new THREE.MeshBasicMaterial({ color: '#bff3ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const anel = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 8, 64), anelMat); scene.add(anel);
const anelChao = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.36, 64), anelMat.clone()); anelChao.rotation.x = -Math.PI / 2; anelChao.position.set(GX, 0.02, GZ); scene.add(anelChao);
// rachadura brilhante no chão (faixa com borda serrilhada, cresce junto da onda)
const rachMat = new THREE.ShaderMaterial({ uniforms: { uP: { value: 0 }, uA: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform float uP, uA; varying vec2 vU;
    float h(float x){ return fract(sin(x*127.1)*43758.5); }
    void main(){ float x = vU.x; if (x > uP) discard;
      float zig = (h(floor(x*40.0)) - 0.5) * 0.5 * (1.0 - abs(fract(x*40.0)-0.5)*2.0) + (h(floor(x*13.0)+3.0)-0.5)*0.35;
      float d = abs(vU.y - 0.5 - zig*0.5);
      float a = smoothstep(0.07, 0.0, d) + smoothstep(0.25, 0.0, d) * 0.35;
      float ponta = smoothstep(uP - 0.06, uP, x) * 1.5 + 1.0;
      gl_FragColor = vec4(vec3(0.55, 0.9, 1.0) * a * ponta * uA, 1.0); }` });
const rach = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0 + 0.3, 0.35), rachMat); rach.rotation.x = -Math.PI / 2; rach.position.set((X0 + X1) / 2 + 0.1, 0.015, (0.22 + GZ) / 2); rach.rotation.z = Math.atan2(0.22 - GZ, X1 - X0); scene.add(rach);
// luzes do poder
const luzMao = new THREE.PointLight('#bfe8ff', 0, 1.6, 2); scene.add(luzMao);
const luzImp = new THREE.PointLight('#8fe0ff', 0, 5, 1.5); luzImp.position.set(GX, 0.7, GZ + 0.4); scene.add(luzImp);
const SOL0 = sol.intensity, HEMI0 = hemi.intensity, CONTRA0 = contra.intensity;
// ---------- qual poder (?p=gelo|fogo|raio|cura) ----------
const PODER = Q.get('p') || 'gelo';
const FX = PODER !== 'gelo' ? PODERES[PODER](scene) : null;
const PC = FX ? FX.cor : { particula: '#e6fbff', luzMao: '#bfe8ff', luzImp: '#8fe0ff', anel: '#bff3ff', numero: 'crit', selo: ['CONGELADA', '#2f8fe0'], dano: 124, escurece: 0.65 };
const GELO = PODER === 'gelo';
imP.material.color.set(PC.particula); luzMao.color.set(PC.luzMao); luzImp.color.set(PC.luzImp); anelMat.color.set(PC.anel); anelChao.material.color.set(PC.anel);
const GLOW = { gelo: '150,225,255', fogo: '255,170,90', raio: '235,235,255', cura: '170,255,170' }[PODER];
const IMP = PC.alvoEhHeroi ? V3(BASE.x, 0.55, BASE.z) : V3(GX, 0.5, GZ);
if (!GELO) { imCr.visible = imCaco.visible = imGeada.visible = rach.visible = false; }

// ---------- câmera e pós ----------
const cam = new THREE.PerspectiveCamera(36, W / H, 0.05, 200); cam.layers.enable(1);
const composer = new EffectComposer(renderer); composer.setSize(IW, IH);
composer.addPass(new RenderPass(scene, cam)); const bloom = new UnrealBloomPass(new THREE.Vector2(IW / 2, IH / 2), 0.35, 0.45, 0.9); composer.addPass(bloom); composer.addPass(new OutputPass());
const proj = (v) => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };

// ---------- poses (keys em quadros) ----------
const S_PRONTA = { yaw: 100, pelve: { y: 0.52, pitch: 4, roll: 0, yaw: 0, dz: 0 }, tronco: { pitch: 4, yaw: -8, roll: 0 }, cab: { pitch: -2, yaw: 6, roll: 0 },
  pes: { L: { x: 0.1, z: 0.12, yaw: 10, pitch: 0 }, R: { x: -0.1, z: -0.12, yaw: -15, pitch: 0 } },
  maos: { L: [0.08, -0.26, 0.06], R: [-0.07, -0.25, 0.08] }, polos: { L: [0.4, -0.2, -1], R: [-0.4, -0.2, -1] },
  rosto: { olho: 1, olharX: 0, olharY: 0, sobr: -0.01, sobrInc: -0.15, boca: 'sorriso', bocaAbre: 0.2 } };
const S_SENTE = { ...S_PRONTA, cab: { pitch: 18, yaw: 30, roll: 0 }, maos: { L: [0.08, -0.26, 0.06], R: [-0.02, -0.06, 0.24] }, rosto: { olho: 1.12, olharX: 0, olharY: -0.6, sobr: 0.014, sobrInc: 0.12, boca: 'O', bocaAbre: 0.2 } };
const S_PUXA = { yaw: 106, pelve: { y: 0.47, pitch: 0, roll: -3, yaw: 14, dz: -0.06 }, tronco: { pitch: -4, yaw: 32, roll: -4 }, cab: { pitch: 0, yaw: -22, roll: 0 },
  pes: { L: { x: 0.13, z: 0.18, yaw: 12, pitch: 0 }, R: { x: -0.13, z: -0.18, yaw: -22, pitch: 0 } },
  maos: { L: [0.16, -0.08, 0.26], R: [-0.12, -0.22, -0.1] }, polos: { L: [0.6, -0.3, -1], R: [-0.7, -0.4, -0.6] },
  rosto: { olho: 0.78, olharX: 0, olharY: 0, sobr: -0.022, sobrInc: -0.3, boca: 'O', bocaAbre: 0.15 } };
const S_ESTENDE = { yaw: 108, pelve: { y: 0.49, pitch: 8, roll: 2, yaw: -8, dz: 0.06 }, tronco: { pitch: 10, yaw: -22, roll: 3 }, cab: { pitch: -4, yaw: 12, roll: 0 },
  pes: { L: { x: 0.12, z: 0.2, yaw: 8, pitch: 0 }, R: { x: -0.12, z: -0.2, yaw: -16, pitch: 18, pivo: 'ponta' } },
  maos: { L: [0.14, -0.24, -0.12], R: [-0.02, 0.06, 0.36] }, polos: { L: [0.5, -0.2, -1], R: [-0.5, -0.6, -0.4] },
  rosto: { olho: 0.7, olharX: 0, olharY: 0, sobr: -0.026, sobrInc: -0.32, boca: 'O', bocaAbre: 0.25 } };
const S_SEGURA = { ...S_ESTENDE, pelve: { y: 0.45, pitch: 12, roll: 2, yaw: -10, dz: 0.08 }, tronco: { pitch: 15, yaw: -26, roll: 4 }, cab: { pitch: 8, yaw: 10, roll: -4 },
  pes: { L: { x: 0.14, z: 0.24, yaw: 10, pitch: 0 }, R: { x: -0.13, z: -0.24, yaw: -18, pitch: 22, pivo: 'ponta' } },
  maos: { L: [-0.03, -0.0, 0.25], R: [-0.02, 0.05, 0.37] }, polos: { L: [0.9, -0.6, -0.1], R: [-0.5, -0.6, -0.4] },
  rosto: { olho: 0.5, olharX: 0, olharY: 0.2, sobr: -0.03, sobrInc: -0.38, boca: 'O', bocaAbre: 0.1 } };
const S_RECUO = { ...S_ESTENDE, pelve: { y: 0.5, pitch: -6, roll: 0, yaw: 4, dz: -0.08 }, tronco: { pitch: -10, yaw: -8, roll: 0 }, maos: { L: [0.16, -0.18, -0.16], R: [-0.02, 0.14, 0.32] },
  rosto: { olho: 1.15, olharX: 0, olharY: 0.1, sobr: 0.01, sobrInc: 0.1, boca: 'O', bocaAbre: 0.4 } };
const S_OLHA = { yaw: 60, pelve: { y: 0.52, pitch: 2, roll: 0, yaw: 0, dz: 0 }, tronco: { pitch: 6, yaw: 10, roll: 0 }, cab: { pitch: 16, yaw: 18, roll: -6 },
  pes: { L: { x: 0.1, z: 0.08, yaw: 6, pitch: 0 }, R: { x: -0.1, z: -0.08, yaw: -8, pitch: 0 } },
  maos: { L: [0.08, -0.26, 0.04], R: [0.08, -0.04, 0.27] }, polos: { L: [0.4, -0.2, -1], R: [-0.6, -0.6, -0.2] },
  rosto: { olho: 1.2, olharX: 0.2, olharY: -0.4, sobr: 0.018, sobrInc: 0.16, boca: 'O', bocaAbre: 0.3 } };
if (PODER === 'raio') { S_ESTENDE.maos = { L: [0.16, -0.22, -0.1], R: [-0.04, 0.36, 0.14] }; S_SEGURA.maos = { L: [0.16, -0.24, -0.12], R: [-0.02, 0.37, 0.12] }; S_SEGURA.cab = { pitch: -18, yaw: 10, roll: 0 }; S_SEGURA.rosto = { ...S_SEGURA.rosto, olharY: 1 }; }
if (PODER === 'cura') { for (const S of [S_ESTENDE, S_SEGURA, S_RECUO]) { S.yaw = 40; S.maos = { L: [0.2, 0.2, 0.14], R: [-0.2, 0.2, 0.14] }; S.polos = { L: [1, -0.4, 0], R: [-1, -0.4, 0] }; S.tronco = { pitch: -6, yaw: 0, roll: 0 }; S.cab = { pitch: -16, yaw: 0, roll: 0 }; S.rosto = { olho: 0.6, olharX: 0, olharY: 1, sobr: 0.01, sobrInc: 0.1, boca: 'sorriso', bocaAbre: 0.2 }; } S_SEGURA.pelve = { ...S_SEGURA.pelve, y: 0.52 }; }
const KEYS = [[0, S_PRONTA], [30, S_PRONTA], [58, S_SENTE, E.io3], [B.puxa, S_PUXA, E.out3], [B.estende, S_ESTENDE, E.outBack], [B.estende + 14, S_SEGURA, E.out3], [B.solta, S_SEGURA],
  [B.solta + 6, S_RECUO, E.out3], [B.segura1, S_RECUO, E.io3], [B.olha, S_OLHA, E.io3], [B.fim, S_OLHA]];
function mix(a, b, k) {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, k);
  if (Array.isArray(a)) return a.map((x, i) => mix(x, b[i], k));
  if (a && typeof a === 'object') { const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) o[key] = key in a && key in b ? mix(a[key], b[key], k) : (k < 0.5 ? (a[key] ?? b[key]) : (b[key] ?? a[key])); return o; }
  return k < 0.5 ? a : b;
}
function S_em(qf) {
  let i = 0; while (i + 1 < KEYS.length && KEYS[i + 1][0] <= qf) i++;
  if (i + 1 >= KEYS.length) return KEYS[i][1];
  const [q0, A] = KEYS[i], [q1, Bk, ease] = KEYS[i + 1]; return mix(A, Bk, (ease || E.io3)((qf - q0) / (q1 - q0)));
}
function poseIna(tw) {
  const qf = tw * 60; const S = S_em(qf);
  const carga = clamp((qf - B.carga0) / (B.solta - B.carga0));
  const treme = qf > B.estende && qf < B.solta ? (0.012 * Math.sin(tw * 70) + 0.006 * Math.sin(tw * 113)) * carga * carga : 0; // tremor de força segurando o poder
  const P = poseEstatica({ ...S, base: BASE.clone().add(V3(treme, 0, 0)), pelve: { ...S.pelve, y: S.pelve.y + Math.sin(tw * 2.6) * 0.005 } });
  // vento do poder no gorro: puxa para trás durante a carga, chicoteia no disparo
  const vs = qf > B.solta && qf < B.solta + 40 ? E.tremor((qf - B.solta) / 60, 3, 4) : 0;
  const forca = carga * (qf < B.solta ? 1 : Math.exp(-(qf - B.solta) / 25));
  P.gorro = { vento: [-0.34 * forca - 0.2 * vs + 0.02 * Math.sin(tw * 21) * forca, 0.1 * forca, 0.12 * forca - 0.06] };
  return P;
}
const maoPos = (P) => P.punhoR.clone().add(P.punhoR.clone().sub(P.cotoveloR).normalize().multiplyScalar(0.07));

// ---------- HUD / textos ----------
function legenda(t) {
  const L1 = { gelo: 'A MÃO DA INA\nCOMEÇOU A *GELAR.*', fogo: 'A MÃO DA INA\nCOMEÇOU A *QUEIMAR.*', raio: 'O CÉU FICOU\n*ESCURO* DE REPENTE.', cura: 'A INA TAVA\nQUASE *SEM VIDA.*' }[PODER];
  const L = [[0.2, 2.3, L1], [Tq(B.olha) + 0.1, Tq(B.escolha), 'E ELA NÃO FAZ IDEIA\nDE *ONDE* ISSO VEIO.']].find((l) => t >= l[0] && t < l[1]); if (!L) return;
  const linhas = L[2].split('\n'); const s = 64; ctx.font = `${s}px ${F}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  const nW = L[2].replace(/\*/g, '').split(/\s+/).length; let wi = 0;
  linhas.forEach((ln, li) => {
    const ws = ln.split(' '); const sp = ctx.measureText(' ').width * 1.4; const lw = ws.map((w) => ctx.measureText(w.replace(/\*/g, '')).width); const tot = lw.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
    let x = 540 - tot / 2; const y = 1440 + li * s * 1.15;
    ws.forEach((w, i) => { const tw = L[0] + Math.min(1.0, (L[1] - L[0]) * 0.45) * (wi / Math.max(1, nW - 1)); wi++;
      if (t >= tw) { const u = t - tw, sc = u < q(6) ? E.outBack(u / q(6)) : 1; const key = w.includes('*'); const txt = w.replace(/\*/g, '');
        ctx.save(); ctx.globalAlpha = 1 - clamp((t - (L[1] - 0.2)) / 0.2); ctx.translate(x + lw[i] / 2, y - s * 0.35); ctx.scale(sc, sc); ctx.lineWidth = 14; ctx.strokeStyle = '#141030'; ctx.strokeText(txt, -lw[i] / 2, s * 0.35); ctx.fillStyle = key ? '#8fe6ff' : '#fff'; ctx.fillText(txt, -lw[i] / 2, s * 0.35); ctx.restore(); }
      x += lw[i] + sp; });
  });
}
function selo(t, t0, txt, x, y, cor) { // etiqueta de status que pula
  const u = t - t0; if (u < 0) return; const s = E.outBack(u / q(10), 2.6);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.06); ctx.font = `46px ${F}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(txt).width + 50; ctx.fillStyle = cor; ctx.beginPath(); ctx.roundRect(-w / 2, -36, w, 72, 16); ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillText(txt, 0, 3); ctx.restore();
}

// ---------- câmera ----------
function camEm(tw, t) {
  const qf = tw * 60;
  // 1 plano médio dos dois → 2 desce e gira para perto da Ina na carga (contra-plongée) → 3 acompanha a onda (atrasada) → 4 aberto no impacto → 5 volta para a Ina
  const k1 = E.io3((qf - 40) / (B.solta - 40)), k2 = E.io3((qf - B.solta) / 40), k3 = E.io3((qf - B.segura1) / 60), k4 = E.io3((qf - B.olha + 20) / 60);
  let pos = V3(0.05, 1.15, 6.0).lerp(V3(0.35, 0.66, 3.9), k1).lerp(V3(0.2, 1.1, 7.3), k2).lerp(V3(0.2, 1.2, 7.0), k3).lerp(V3(-0.45, 0.95, 3.6), k4);
  let alvo = V3(0.05, 0.75, 0).lerp(V3(-0.3, 0.85, 0), k1).lerp(V3(0.05, 0.72, 0), k2).lerp(V3(0.02, 0.8, 0), k3).lerp(V3(-0.7, 0.85, 0), k4);
  pos.x += Math.sin(tw * 0.6) * 0.04; pos.y += Math.sin(tw * 0.8) * 0.02;
  const tr = J.trauma(tw, [...GOLPES, { t: Tq(B.solta), forca: 0.5 }, { t: Tq(B.quebra1 + 6), forca: 0.6 }]);
  const zoom = (t >= Tq(B.impacto) ? 5 * Math.exp(-(t - Tq(B.impacto)) * 6) : 0) + (qf > B.carga0 && qf < B.solta ? 3 * E.in2((qf - B.carga0) / (B.solta - B.carga0)) : 0);
  return { pos: pos.add(V3(tr.x * 0.6, tr.y * 0.6, 0)), alvo, roll: tr.rot, fov: 36 - zoom };
}

// ---------- quadro ----------
const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler(), vv = new THREE.Vector3(), ss = new THREE.Vector3();
function quadro(t) {
  const tw = J.hitStop(t, GOLPES), qf = tw * 60; U.uT.value = tw; gUni.uT.value = tw;
  const P = poseIna(tw); aplicarPose(ina, P); ina.updateMatrixWorld(true);
  const mao = maoPos(P);
  const carga = clamp((qf - B.carga0) / (B.solta - B.carga0));
  const ctx3 = { B, mao, alvo: V3(GX, 0, GZ), heroi: V3(BASE.x, 0, BASE.z), proj };
  // luz geral escurece durante o poder (o gelo vira a fonte de luz) e volta depois
  const dim = E.io3(carga) * (1 - E.io3((qf - B.quebra1) / 80));
  sol.intensity = lerp(SOL0, SOL0 * (1 - (PC.escurece ?? 0.65)), dim); hemi.intensity = lerp(HEMI0, HEMI0 * 0.55, dim); contra.intensity = lerp(CONTRA0, CONTRA0 * 0.5, dim);
  // luz da mão
  luzMao.position.copy(mao); luzMao.intensity = (qf < B.solta ? 0.55 * E.in2(carga) : 1.0 * Math.exp(-(qf - B.solta) / 10)) * (1 + 0.15 * Math.sin(tw * 40));
  // luz do impacto
  const ui = qf - B.impacto; luzImp.position.copy(IMP).add(V3(0, 0.2, 0.4)); luzImp.intensity = (PC.alvoEhHeroi ? 0.3 : 1) * ( FX && FX.flash ? (FX.flash(qf, ctx3) ? 6 : (ui > 0 && ui < 60 ? 2 : 0)) : ui < 0 ? 0 : ui < 50 ? 6 * Math.exp(-ui / 14) + 2 : 2 * (1 - clamp((qf - B.quebra1) / 30)));
  // cristais: crescem com outBack; seguram; quebram do lado da Ina até a gosma
  let n = 0;
  for (const c of CR) {
    const uq = (tw - c.t0) * 60; let s = 0;
    if (uq > 0) s = E.outBack(uq / (c.fin ? 8 : 6), 2.2);
    const tq = B.quebra1 + (c.fin ? 22 : c.u * 20); // quebra em onda
    if (qf > tq) s *= 1 - E.in2((qf - tq) / 6);
    s *= c.s; if (s < 0.001) s = 0.0001;
    ee.set(c.inc[0], c.inc[1], c.inc[2]); qq.setFromEuler(ee);
    m4.compose(vv.set(c.x, -0.02, c.z), qq, ss.set(s, s * (0.9 + 0.2 * hash(n)), s)); imCr.setMatrixAt(n++, m4);
  }
  imCr.instanceMatrix.needsUpdate = true; imCr.visible = GELO && qf > B.solta;
  if (FX) FX.atualizar(qf, ctx3);
  { let j = 0; for (const c of CR) { const tq = B.quebra1 + (c.fin ? 22 : c.u * 20); const g = qf > tq ? E.out3((qf - tq) / 20) : (qf > c.t0 * 60 ? 0.35 * E.out3((qf - c.t0 * 60) / 10) : 0);
      const r = Math.max(0.0001, g * c.s * (c.fin ? 0.32 : 0.24) * (0.8 + 0.4 * hash(j + 90)));
      m4.compose(vv.set(c.x, 0.012 + j * 0.0002, c.z), qq.identity(), ss.set(r * 1.3, 1, r)); imGeada.setMatrixAt(j++, m4); }
    imGeada.instanceMatrix.needsUpdate = true; imGeada.material.opacity = 0.4 * (1 - clamp((qf - B.escolha) / 40)); }
  gUni.uBrilho.value = 1 + 0.25 * Math.exp(-Math.max(0, qf - B.impacto) / 10) * (qf > B.impacto ? 1 : 0);
  // cacos: saem de cada cristal quando ele quebra (balística + giro)
  for (let i = 0; i < NCACO; i++) {
    const c = CR[i % CR.length]; const tq = B.quebra1 + (c.fin ? 22 : c.u * 20); const u = (qf - tq) / 60;
    if (u < 0 || u > 1.1) { m4.compose(vv.set(0, -5, 0), qq.identity(), ss.set(0.001, 0.001, 0.001)); imCaco.setMatrixAt(i, m4); continue; }
    const h1 = hash(i * 1.3), h2 = hash(i * 2.1 + 5), h3 = hash(i * 3.7 + 9), a = h1 * Math.PI * 2, sp = (1.0 + 1.6 * h2) * (c.fin ? 1.4 : 0.8);
    let y = 0.2 + 0.6 * h3 * c.s + (1.6 + 2 * h2) * u - 4.9 * u * u; const quica = y < 0.02; if (quica) y = 0.02;
    vv.set(c.x + Math.cos(a) * sp * u * 0.6, y, c.z + Math.sin(a) * sp * u * 0.6 + 0.3 * u);
    ee.set(u * 12 * h1, u * 9 * h2, u * 7); qq.setFromEuler(ee); const k = (0.6 + 1.2 * h3) * (1 - clamp((u - 0.7) / 0.4)) * (c.fin ? 1.5 : 1);
    m4.compose(vv, qq, ss.set(k, k * 1.6, k)); imCaco.setMatrixAt(i, m4);
  }
  imCaco.instanceMatrix.needsUpdate = true;
  // partículas: espiral entrando na mão (carga) → faíscas do impacto → neve/geada caindo
  for (let i = 0; i < NP; i++) {
    const h1 = hash(i + 0.3), h2 = hash(i + 7.7), h3 = hash(i + 3.1); let p = null, k = 0;
    if (i < 90) { // carga: cada uma nasce num momento, vem de longe girando e some na mão
      const nasce = B.carga0 + h1 * (B.solta - B.carga0 - 12), u = (qf - nasce) / 22;
      if (u >= 0 && u <= 1 && qf < B.solta + 2) { const r = 0.55 * (1 - E.in2(u)), a = h2 * 6.28 + u * 5; p = mao.clone().add(V3(Math.cos(a) * r, Math.sin(a) * r * 0.8 + (h3 - 0.5) * 0.2 * (1 - u), Math.sin(a * 0.7) * r * 0.6)); k = 0.6 + 1.4 * u; }
    } else if (i < 150) { // faíscas do impacto
      const u = (qf - B.impacto) / 40; if (u >= 0 && u <= 1) { const a = h1 * 6.28, el = h2 * 1.4, sp = 1.4 + 1.8 * h3; p = V3(IMP.x + Math.cos(a) * Math.cos(el) * sp * u * 0.7, IMP.y + Math.sin(el) * sp * u * 0.7 - 1.5 * u * u, IMP.z + Math.sin(a) * Math.cos(el) * sp * u * 0.7); k = 1.6 * (1 - u); }
    } else if (GELO) { // neve caindo depois da quebra (em camadas: longe, meio, perto da câmera)
      const u = (qf - B.quebra1 + 10 - h1 * 70) / 190; if (u >= 0 && u <= 1) { const zz = -1.2 + h3 * 4.2; p = V3(-2.2 + h2 * 4.6 + Math.sin(u * 6 + i) * 0.12, 2.4 - u * 2.5, zz); k = (0.9 + 0.3 * clamp((zz - 1) / 2)) * Math.sin(Math.PI * u); }
    }
    if (p) m4.compose(p, qq.identity(), ss.set(k, k, k)); else m4.compose(vv.set(0, -5, 0), qq.identity(), ss.set(0.001, 0.001, 0.001));
    imP.setMatrixAt(i, m4);
  }
  imP.instanceMatrix.needsUpdate = true;
  // anel do disparo (3 q, abre perpendicular ao braço) e anel no chão do impacto
  const ua = (qf - B.solta) / 14; anel.visible = ua >= 0 && ua <= 1;
  if (anel.visible) { anel.position.copy(mao); anel.lookAt(cam.position); anel.scale.setScalar(0.3 + 2.4 * E.out3(ua)); anelMat.opacity = 1 - ua; }
  const ur = (qf - B.impacto) / 30; anelChao.visible = ur >= 0 && ur <= 1 && !PC.alvoEhHeroi; anelChao.position.set(GX, 0.02, GZ); if (anelChao.visible) { anelChao.scale.setScalar(1 + 5 * E.out3(ur)); anelChao.material.opacity = 1 - ur; }
  rachMat.uniforms.uP.value = clamp((qf - B.solta - 2) / (B.onda1 - B.solta - 2)); rachMat.uniforms.uA.value = 1 - clamp((qf - B.quebra1) / 60);
  // gosma: respira → clarão branco no impacto → congelada (azul, parada) → treme ao quebrar → zonza
  const fl = J.clarao(t, Tq(B.impacto), 5, 2);
  const congel = qf > B.impacto + 7 ? 1 - 0.6 * clamp((qf - B.quebra1 - 40) / 60) : 0;
  const flR = FX && FX.flash ? FX.flash(qf, ctx3) : 0;
  if (PC.alvoEhHeroi) J.pintarClarao(gMat, 0);
  else { J.pintarClarao(gMat, Math.max(fl, flR), '#ffffff');
    if (fl <= 0 && !flR) { if (GELO) gMat.color.copy(gMat.userData.cor0).lerp(COR_GELO, congel * 0.75); else gMat.color.copy(gMat.userData.cor0).lerp(new THREE.Color(PC.tinta), (qf > B.impacto ? 0.8 : 0) * (1 - clamp((qf - B.impacto - 60) / 120))); } }
  let sq = qf < B.impacto ? { x: 1 + 0.03 * Math.sin(tw * 3.4), y: 1 - 0.04 * Math.sin(tw * 3.4), z: 1 + 0.03 * Math.sin(tw * 3.4) } : J.squash(tw - Tq(B.impacto), 0.7);
  if (GELO && qf > B.impacto + 12 && qf < B.quebra1) sq = { x: 0.96, y: 1.05, z: 0.96 }; // parada, congelada
  if (PC.alvoEhHeroi) sq = { x: 1 + 0.03 * Math.sin(tw * 3.4), y: 1 - 0.04 * Math.sin(tw * 3.4), z: 1 + 0.03 * Math.sin(tw * 3.4) };
  if (PODER === 'raio' && qf > B.impacto && qf < B.impacto + 130) gosma.position.y = 0; 
  if (qf >= B.quebra1) { const s2 = J.squash(tw - Tq(B.quebra1 + 22), 0.8); sq = s2; gosma.rotation.z = 0.12 * Math.sin(tw * 5) * clamp((qf - B.quebra1 - 30) / 30); }
  gosma.scale.set(sq.x, sq.y, sq.z); gosma.position.x = GX + (qf > B.impacto ? 0.05 * E.out3((qf - B.impacto) / 8) : 0); gosma.position.z = GZ; if (PODER === 'raio' && qf > B.impacto && qf < B.impacto + 130) gosma.position.x += (hash(Math.floor(qf / 2)) - 0.5) * 0.04 * (1 - (qf - B.impacto) / 130);
  // câmera
  const C = camEm(tw, t); cam.fov = C.fov; cam.updateProjectionMatrix(); cam.position.copy(C.pos); cam.lookAt(C.alvo); cam.rotateZ(C.roll); cam.updateMatrixWorld(true);
  U.uRimDir.value.copy(SOLDIR).transformDirection(cam.matrixWorldInverse);
  bloom.strength = 0.32 + 0.2 * dim;
  scene.updateMatrixWorld(true); composer.render();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(glc, 0, 0, RW, RH);
  ctx.setTransform(ESC, 0, 0, ESC, 0, 0);
  // atmosfera: véu do sol some com o poder; vinheta azul escura cresce com o poder
  { ctx.save(); ctx.globalCompositeOperation = 'screen'; const sx = W * SOL_TELA[0], sy = H * SOL_TELA[1];
    const lg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 1100); lg.addColorStop(0, `rgba(255,190,120,${0.32 * (1 - dim)})`); lg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    // brilho azul em volta da mão e do impacto (glow de tela)
    const brilho = (pt, r, a) => { const [x, y] = proj(pt); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${GLOW},${a})`); g.addColorStop(1, `rgba(${GLOW},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); };
    if (qf > B.carga0 && qf < B.solta + 20) brilho(mao, 70 + 110 * carga, 0.2 * carga * (qf < B.solta ? 1 : Math.exp(-(qf - B.solta) / 6)));
    if (qf > B.impacto && qf < B.quebra1 + 40) brilho(IMP, 380, 0.22 * Math.exp(-(qf - B.impacto) / 20) + 0.06);
    // névoa gelada da quebra
    if (GELO && qf > B.quebra1) for (let i = 0; i < 12; i++) { const u = (qf - B.quebra1 - i * 2) / 90; if (u < 0 || u > 1) continue; const [x, y] = proj(V3(lerp(X0, GX, i / 11), 0.2 + 0.4 * u, lerp(0.22, GZ, i / 11))); const r = 90 + 160 * u; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(200,235,255,${0.16 * (1 - u)})`); g.addColorStop(1, 'rgba(220,245,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    ctx.restore(); }
  if (GELO && qf > B.quebra1) for (let i = 0; i < 16; i++) { const u = ((qf - B.quebra1) / 150 + hash(i + 700)) % 1, a = clamp((qf - B.quebra1) / 30) * Math.sin(Math.PI * u);
    const x = hash(i + 701) * W + Math.sin(u * 5 + i) * 40, y = -100 + u * 2100, r = 14 + 30 * hash(i + 702);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(235,248,255,${0.55 * a})`); g.addColorStop(0.6, `rgba(235,248,255,${0.25 * a})`); g.addColorStop(1, 'rgba(235,248,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
  { const vg = ctx.createRadialGradient(540, 980, 520, 540, 980, 1350); vg.addColorStop(0, 'rgba(20,20,70,0)'); vg.addColorStop(1, `rgba(20,20,70,${0.45 + 0.3 * dim})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
  { const fg = ctx.createLinearGradient(0, 1250, 0, 1920); fg.addColorStop(0, 'rgba(30,25,80,0)'); fg.addColorStop(1, 'rgba(30,25,80,0.5)'); ctx.fillStyle = fg; ctx.fillRect(0, 1250, W, 670); }
  if (FX) FX.desenhar(ctx, qf, ctx3);
  // flash de tela no disparo e no impacto (1 q forte + véu curto)
  for (const [qq0, a] of [[B.solta, 0.18], [B.impacto, 0.28]]) if (t * 60 >= qq0 && t * 60 < qq0 + 4) { ctx.fillStyle = `rgba(225,248,255,${t * 60 < qq0 + 1 ? a : a * 0.35})`; ctx.fillRect(0, 0, W, H); }
  // HUD: vida da gosma, dano de gelo, status
  const [gx, gy] = proj(V3(GX, 0.5, GZ));
  const [ix, iy] = proj(IMP);
  if (t < Tq(B.olha)) { ctx.globalAlpha = 1 - clamp((t - Tq(B.olha - 20)) / q(20));
    if (PC.alvoEhHeroi) { const k = E.out3((t - Tq(B.impacto)) / 0.7); const st = { fill: t < Tq(B.impacto) ? 22 : lerp(22, 100, k), pedaco: null, mostrado: Math.round(t < Tq(B.impacto) ? 22 : lerp(22, 100, k)) }; J.barraVida(ctx, ix - 190, iy - 520, 380, 46, st, 100, 'INA', F); }
    else { const st = J.vidaEm(t, 200, [{ t: Tq(B.impacto), de: 200, para: 200 - PC.dano }], q(30), q(18)); J.barraVida(ctx, gx - 190, gy - 470, 380, 46, st, 200, 'GOSMA REAL', F); }
    ctx.globalAlpha = 1; }
  J.numeroDano(ctx, t, { t0: Tq(B.impacto), valor: PC.dano, tipo: PC.numero, lado: 0 }, ix - 30, iy - 190);
  if (t > Tq(B.impacto + 16) && t < Tq(B.olha + 40)) { ctx.globalAlpha = 1 - clamp((t - Tq(B.olha + 20)) / q(20)); selo(t, Tq(B.impacto + 16), PC.selo[0], ix + 10, iy + 170, PC.selo[1]); ctx.globalAlpha = 1; }
  if (t < Tq(B.escolha)) legenda(t);
  if (t >= Tq(B.escolha)) J.escolha(ctx, t, Tq(B.escolha), 'O QUE A INA FAZ COM ISSO?', 'TREINAR ESCONDIDO', 'CONTAR PRO VÔ');
}

window.DUR = DUR;
window.seek = async (t) => { quadro(t); };
window.probe = () => {
  const r = { stop_q: 0, clarao_q: 0, cam_parada_max_q: 0 }; let ant = null, parada = 0, kAnt;
  for (let i = 0; i < DUR * 60; i++) {
    const t = i / 60, tw = J.hitStop(t, GOLPES); if (ant !== null && Math.abs(tw - ant) < 1e-9) r.stop_q++; ant = tw;
    if (J.clarao(t, Tq(B.impacto), 5, 2) >= 1) r.clarao_q++;
    const C = camEm(tw, t); const k = C.pos.x * 1000 + C.pos.y * 100 + C.pos.z; if (kAnt !== undefined && Math.abs(k - kAnt) < 1e-4) parada++; else parada = 0; kAnt = k; r.cam_parada_max_q = Math.max(r.cam_parada_max_q, parada);
  }
  return r;
};
new FontFace('Titan', 'url(../fontes/TitanOne.woff2)').load().then((f) => { document.fonts.add(f); quadro(0); window.READY = true; });
