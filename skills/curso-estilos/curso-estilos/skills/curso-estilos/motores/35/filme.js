// "A guarda do passo": a guardiã sobe a estrada da serra ao entardecer; uma pedra solta, um matacão desce rolando; ela parte a pedra ao meio com a marreta.
// Motor 3D em código (three.js): modelo PBR montado a partir da arte de conceito (conceito/), cena com sol baixo, névoa, DOF em 3 camadas, grade, grão.
// seek(t) determinístico. Motor do estilo 35 (herói 3D PBR a partir de arte de conceito).
import * as THREE from 'three';
import { criaHeroi, IMG, paint, RIM, metalEnv } from './heroi.js';

const W = 1080, H = 1920;
const out = document.getElementById('c'), X = out.getContext('2d');
const gl = document.createElement('canvas'); gl.width = W; gl.height = H;
const R3 = new THREE.WebGLRenderer({ canvas: gl, antialias: true, alpha: true, preserveDrawingBuffer: true });
R3.setSize(W, H, false); R3.setClearColor(0x000000, 0); R3.shadowMap.enabled = true; R3.shadowMap.type = THREE.PCFSoftShadowMap;
R3.outputColorSpace = THREE.SRGBColorSpace; R3.toneMapping = THREE.ACESFilmicToneMapping; R3.toneMappingExposure = 1.0;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xb08a88, 16, 190);
const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 600);
function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k, ss = k => { k = cl(k); return k * k * (3 - 2 * k); }, L3 = (p, q, k) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k), lerp(p[2], q[2], k)];
const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const texOf = (c, rx = 1, ry = 1, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.repeat.set(rx, ry); return t; };
const img = (key, tint, a, crop = 0.03, alt = 'stone') => cv(1024, 1024, (g, w, h) => { g.fillStyle = tint; g.fillRect(0, 0, w, h); if (!paint(g, w, h, key, tint, a, crop)) paint(g, w, h, alt, tint, a, crop); });
// ---------- ruído de valor 2D/3D (determinístico)
const hash = (x, y, z = 0) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const sm = k => k * k * (3 - 2 * k);
function n2(x, y) { const xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi); return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), fx), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), fx), fy); }
function n3(x, y, z) { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), fx = sm(x - xi), fy = sm(y - yi), fz = sm(z - zi), h = (a, b, c) => hash(xi + a, yi + b, zi + c);
  return lerp(lerp(lerp(h(0, 0, 0), h(1, 0, 0), fx), lerp(h(0, 1, 0), h(1, 1, 0), fx), fy), lerp(lerp(h(0, 0, 1), h(1, 0, 1), fx), lerp(h(0, 1, 1), h(1, 1, 1), fx), fy), fz); }
const fbm2 = (x, y, o = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * n2(x * f, y * f); a *= 0.5; f *= 2.03; } return s; };

// ---------- texturas (pintadas no Z-Image em tex_novo/, com reserva nas antigas)
const C_ROCK = img('rock', '#8a8078', 0.35), C_ROAD = img('road', '#a08466', 0.4, 0.03, 'ground'), C_GRASS = img('drygrass', '#9a8a4a', 0.5, 0.03, 'grass');
const add = (m, sh = true) => { m.castShadow = sh; m.receiveShadow = true; scene.add(m); return m; };

// ---------- céu de fim de tarde, sol baixo, ambiente
const skyC = cv(64, 1024, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); [[0, '#1d3348'], [0.28, '#3e5a72'], [0.4, '#8a7a84'], [0.46, '#e0946a'], [0.5, '#ffc27a'], [0.53, '#ffb06a'], [1, '#c87a5a']].forEach(([p, c]) => gr.addColorStop(p, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const skyT = new THREE.CanvasTexture(skyC); skyT.colorSpace = THREE.SRGBColorSpace;
const pm = new THREE.PMREMGenerator(R3); { const t = new THREE.CanvasTexture(skyC); t.colorSpace = THREE.SRGBColorSpace; t.mapping = THREE.EquirectangularReflectionMapping; scene.environment = pm.fromEquirectangular(t).texture; }
const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 16), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false })); scene.add(sky);
const cloudT = texOf(cv(512, 256, (g, w, h) => { const r = rng(9); for (let i = 0; i < 30; i++) { const x = 40 + r() * 430, y = 120 + r() * 50, q = 24 + r() * 60, gr = g.createRadialGradient(x, y, 0, x, y, q); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } }));
const clouds = []; { const r = rng(4); for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cloudT, transparent: true, depthWrite: false, fog: false, color: 0xffa070, opacity: 0.55 })); const a = (r() - 0.5) * 3.4 + (i % 3 === 0 ? Math.PI : 0), d = 300 + r() * 120; m.position.set(Math.sin(a) * d, 50 + r() * 70, -Math.cos(a) * d); m.scale.set(140 + r() * 140, 30 + r() * 26, 1); m.lookAt(0, 30, 0); scene.add(m); clouds.push(m); } }
const SUN = new THREE.Vector3(70, 15, -80);   // sol baixo, lateral e um pouco à frente (subida)
const sun = new THREE.DirectionalLight(0xffb878, 4.2); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 260 }); scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0x7a96c0, 0x4a3a30, 0.95); scene.add(hemi);

// ---------- terreno: estrada subindo para -z entre encostas de pedra
const SL = 0.13, roadX = z => z < -8 ? 3.2 * Math.sin((z + 8) * 0.045) : 0, yRoad = z => -SL * z;
function hgt(x, z) { const ax = Math.abs(x - roadX(z)), side = Math.max(0, ax - 2.1), k = Math.min(1, side * 0.45);
  return yRoad(z) + Math.pow(side, 1.4) * 0.5 + (fbm2(x * 0.09, z * 0.09) - 0.5) * 7 * k + (n2(x * 0.7, z * 0.7) - 0.5) * 0.25 * k + (n2(x * 2.3, z * 2.3) - 0.5) * 0.04; }
{ const g = new THREE.PlaneGeometry(130, 260, 260, 520); g.rotateX(-Math.PI / 2); g.translate(0, 0, -70); const p = g.attributes.position, col = new Float32Array(p.count * 3), uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = hgt(x, z); p.setY(i, y); uv.setXY(i, x / 5, z / 5);
    const ax = Math.abs(x - roadX(z)), road = 1 - ss((ax - 1.5) / 0.9), gr = ss((n2(x * 0.18, z * 0.18) - 0.35) / 0.3) * (1 - road) * (1 - ss((ax - 4) / 6) * 0.6), v = 0.85 + n2(x * 0.5, z * 0.5) * 0.3;
    const c = [lerp(lerp(0.62, 0.78, gr), 0.86, road) * v, lerp(lerp(0.57, 0.68, gr), 0.72, road) * v, lerp(lerp(0.54, 0.38, gr), 0.56, road) * v]; col.set(c, i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const ground = add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: texOf(C_ROCK, 1, 1), vertexColors: true, roughness: 0.95, bumpMap: texOf(C_ROCK, 1, 1, false), bumpScale: 1.5 })), false); ground.receiveShadow = true; }
// faixa da estrada com textura própria, colada no relevo
{ const g = new THREE.PlaneGeometry(3.6, 200, 12, 400); g.rotateX(-Math.PI / 2); g.translate(0, 0, -60); const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), xx = x + roadX(z); p.setX(i, xx); p.setY(i, hgt(xx, z) + 0.015); uv.setXY(i, x / 3.6, z / 3.6); }
  g.computeVertexNormals(); const m = new THREE.MeshStandardMaterial({ map: texOf(C_ROAD, 1, 1), roughness: 1, transparent: true, alphaMap: texOf(cv(64, 8, (q, w, h) => { const gr = q.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.18, '#fff'); gr.addColorStop(0.82, '#fff'); gr.addColorStop(1, '#000'); q.fillStyle = gr; q.fillRect(0, 0, w, h); }), 1, 1, false), bumpMap: texOf(C_ROAD, 1, 1, false), bumpScale: 1.2 });
  m.alphaMap.wrapS = m.alphaMap.wrapT = THREE.ClampToEdgeWrapping; m.alphaMap.repeat.set(1, 1); const road = new THREE.Mesh(g, m); road.receiveShadow = true; scene.add(road); }
// pedras: esfera deformada por ruído (tem UV), material PBR com relevo da textura pintada
const rockMat = (tint = 0xffffff) => new THREE.MeshStandardMaterial({ color: tint, map: texOf(C_ROCK, 1, 1), roughness: 0.92, bumpMap: texOf(C_ROCK, 1, 1, false), bumpScale: 2.5 });
const RM = [rockMat(0xffffff), rockMat(0xd8c8b8), rockMat(0xb8b0a8)];
function rockGeo(seed, sq = 1, sharp = 0.25) { const g = new THREE.SphereGeometry(1, 40, 28), p = g.attributes.position, o = seed * 13.7;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), d = 1 + 0.32 * (n3(x * 1.3 + o, y * 1.3, z * 1.3) - 0.5) + sharp * (n3(x * 3.1, y * 3.1 + o, z * 3.1) - 0.5) + 0.05 * (n3(x * 9, y * 9, z * 9 + o) - 0.5);
    const yy = y < -0.3 ? -0.3 + (y + 0.3) * 0.3 : y; p.setXYZ(i, x * d, yy * d * sq, z * d); }
  g.computeVertexNormals(); return g; }
const ROCKS = []; { const r = rng(31);
  for (let i = 0; i < 90; i++) { const z = 30 - r() * 170, side = r() < 0.5 ? -1 : 1, s0 = 0.4 + Math.pow(r(), 2.2) * 7, near = z > -14 && z < 16, s = near ? Math.min(s0, 1.6) : s0, x = roadX(z) + side * (3.2 + s * 0.9 + (near ? 2.5 : 0) + Math.pow(r(), 1.6) * 20);
    const m = add(new THREE.Mesh(rockGeo(i, 0.55 + r() * 0.8), RM[i % 3])); m.position.set(x, hgt(x, z) - s * 0.15, z); m.scale.set(s * (0.8 + r() * 0.6), s, s * (0.8 + r() * 0.6)); m.rotation.y = r() * 6; ROCKS.push(m); }
  // pedregulhos miúdos na beira da estrada
  for (let i = 0; i < 160; i++) { const z = 14 - r() * 70, side = r() < 0.5 ? -1 : 1, x = roadX(z) + side * (1.5 + r() * 2.2), s = 0.05 + Math.pow(r(), 2) * 0.22;
    const m = add(new THREE.Mesh(rockGeo(i + 100, 0.7, 0.4), RM[i % 3])); m.position.set(x, hgt(x, z) - s * 0.2, z); m.scale.setScalar(s); m.rotation.set(r(), r() * 6, r()); } }
// tufos de capim seco (cartões cruzados)
{ const tuftT = texOf(cv(256, 256, (g, w, h) => { const r = rng(12); for (let i = 0; i < 70; i++) { const x = w / 2 + (r() - 0.5) * 150, top = 30 + r() * 120, lean = (r() - 0.5) * 90; g.strokeStyle = `hsl(${38 + r() * 14},${40 + r() * 20}%,${40 + r() * 25}%)`; g.lineWidth = 2 + r() * 3; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + lean * 0.3, (h + top) / 2, x + lean, top); g.stroke(); } }));
  tuftT.wrapS = tuftT.wrapT = THREE.ClampToEdgeWrapping; tuftT.repeat.set(1, 1);
  const tm = new THREE.MeshStandardMaterial({ map: tuftT, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1 }), r = rng(77), geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, 0.5, 0);
  for (let i = 0; i < 420; i++) { const z = 18 - r() * 90, side = r() < 0.5 ? -1 : 1, x = roadX(z) + side * (1.7 + Math.pow(r(), 1.5) * 9), s = 0.25 + r() * 0.45;
    for (const a of [0, Math.PI / 2]) { const m = new THREE.Mesh(geo, tm); m.position.set(x, hgt(x, z) - 0.03, z); m.rotation.y = a + i; m.scale.set(s * 1.3, s, 1); m.receiveShadow = true; scene.add(m); } } }
// serras ao longe (somem na névoa)
{ const r = rng(55); for (let i = 0; i < 14; i++) { const a = -1.3 + r() * 2.6, d = 170 + r() * 160, s = 40 + r() * 70; const g = rockGeo(i + 300, 1, 0.5);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x8a7c84, roughness: 1 })); m.position.set(Math.sin(a) * d, -10 + s * 0.2 + yRoad(-Math.cos(a) * d) * 0.5, -Math.cos(a) * d); m.scale.set(s * (1.2 + r()), s * (0.7 + r() * 0.6), s); scene.add(m); } }

// cenário pintado ao fundo (Z-Image: tex_novo/serra.jpg) num arco de cilindro distante, sem névoa
{ const im = IMG.serra; if (im) { const c = cv(2048, 900, (g, w, h) => { g.drawImage(im, 300, 0, im.width - 300, im.height, 0, 0, w, h * 0.853); const gr = g.createLinearGradient(0, h * 0.7, 0, h); gr.addColorStop(0, 'rgba(70,58,72,0)'); gr.addColorStop(0.3, 'rgba(70,58,72,1)'); g.fillStyle = gr; g.fillRect(0, h * 0.7, w, h * 0.3); });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const R0 = 420, g = new THREE.CylinderGeometry(R0, R0, 260, 64, 1, true, Math.PI * 0.5 + 0.35, Math.PI * 0.95); g.scale(-1, 1, 1);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, fog: false, transparent: true, opacity: 1, depthWrite: false })); m.position.set(0, 60, -40); m.renderOrder = -1; scene.add(m); } }
// ---------- matacão em duas metades (corte no plano x = 0, que contém o eixo de giro)
const BR = 1.15, bDisp = (x, y, z) => 1 + 0.16 * (n3(x * 1.4 + 5, y * 1.4, z * 1.4) - 0.5) + 0.07 * (n3(x * 4, y * 4 + 2, z * 4) - 0.5) + 0.025 * (n3(x * 11, y * 11, z * 11 + 7) - 0.5);
const C_CUT = cv(512, 512, (g, w, h) => { g.fillStyle = '#c9b49a'; g.fillRect(0, 0, w, h); paint(g, w, h, 'rock', '#d8c0a0', 0.6, 0.1); g.fillStyle = 'rgba(200,190,180,0.3)'; g.fillRect(0, 0, w, h); });
function halfBoulder(sgn) { const grp = new THREE.Group();
  const g = new THREE.SphereGeometry(BR, 56, 40, sgn > 0 ? 0 : Math.PI, Math.PI); g.rotateY(Math.PI / 2); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), d = bDisp(x / BR, y / BR, z / BR); p.setXYZ(i, Math.abs(x) < 1e-4 ? 0 : x * d, y * d, z * d); }
  g.computeVertexNormals(); { const n = g.attributes.normal, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)), x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (ax >= ay && ax >= az) uv.setXY(i, z * 0.45 + 0.5, y * 0.45 + 0.5); else if (ay >= az) uv.setXY(i, x * 0.45 + 0.3, z * 0.45 + 0.5); else uv.setXY(i, x * 0.45 + 0.7, y * 0.45 + 0.2); } }
  const shell = new THREE.Mesh(g, RM[1]); grp.add(shell);
  // tampa: leque a partir do centro até a borda (pontos do mesmo deslocamento no plano x = 0)
  const N = 120, pos = [0, 0, 0], idx = [], uvs = [0.5, 0.5];
  for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, y = Math.cos(a) * BR, z = Math.sin(a) * BR, d = bDisp(0, y / BR, z / BR) * (1 - 0.004); pos.push(0, y * d, z * d); uvs.push(0.5 + Math.sin(a) * 0.5, 0.5 + Math.cos(a) * 0.5); if (i) idx.push(0, i, i + 1); }
  // relevo da fratura: anel interno irregular
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); cg.setIndex(sgn > 0 ? idx.map((v, k) => idx[k - k % 3 + (2 - k % 3)]) : idx); cg.computeVertexNormals();
  const cap = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ map: texOf(C_CUT, 1, 1), roughness: 0.85, bumpMap: texOf(C_CUT, 1, 1, false), bumpScale: 4, side: THREE.DoubleSide })); grp.add(cap);
  grp.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(grp); return grp; }
const BH = [halfBoulder(1), halfBoulder(-1)];
// estilhaços e pedrinhas
const CHIPS = []; { const r = rng(91); for (let i = 0; i < 46; i++) { const m = add(new THREE.Mesh(rockGeo(i + 500, 0.8, 0.6), RM[i % 3])); const s = 0.05 + Math.pow(r(), 2.4) * 0.28; m.scale.setScalar(s);
  CHIPS.push({ m, s, vx: (r() - 0.5) * 9, vy: 2 + r() * 7, vz: -1 + r() * 9, rx: r() * 20, ry: r() * 20 }); } }
const PEB = []; { const r = rng(17); for (let i = 0; i < 6; i++) { const m = add(new THREE.Mesh(rockGeo(i + 700, 0.8, 0.5), RM[i % 3])); const s = 0.04 + r() * 0.06; m.scale.setScalar(s); PEB.push({ m, s, x: (r() - 0.5) * 1.6, t0: 9.1 + i * 0.16 + r() * 0.1, v: 3 + r() * 1.5 }); } }
// poeira: sprites macios
const puffT = texOf(cv(128, 128, (g, w) => { const r = rng(3); for (let i = 0; i < 14; i++) { const x = 64 + (r() - 0.5) * 50, y = 64 + (r() - 0.5) * 50, q = 22 + r() * 30, gr = g.createRadialGradient(x, y, 0, x, y, q); gr.addColorStop(0, 'rgba(255,255,255,0.32)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); } }));
puffT.wrapS = puffT.wrapT = THREE.ClampToEdgeWrapping; puffT.repeat.set(1, 1);
const DUST = Array.from({ length: 150 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffT, color: 0xa88a78, transparent: true, depthWrite: false, opacity: 0 })); scene.add(s); return s; });

// ---------- heroína
const hero = criaHeroi(); scene.add(hero.root);
const GRAB = document.createElement('canvas'); GRAB.width = W; GRAB.height = H;

// ================= linha do tempo
const TI = 19.0, HS = 0.36;                         // golpe e hit-stop
const ttOf = t => t < TI ? t : t < TI + HS ? TI : t - HS;
const WS = 0.56, ZSTOP = 5.2 - WS * 9.35, ZH = ZSTOP - 2.55, V = 8.4, BT0 = 12.3;               // centro do matacão no golpe, velocidade, quando aparece
// caminhada: z da heroína e distância percorrida
function walkAt(tt) { let z, s, w;
  if (tt < 9.0) { z = 5.2 - WS * tt; s = WS * tt; w = 1; }
  else if (tt < 9.7) { const u = (tt - 9.0) / 0.7, d = WS * 0.7 * (u - u * u / 2); z = 5.2 - WS * 9.0 - d; s = WS * 9.0 + d; w = 1 - ss(u); }
  else { z = 5.2 - WS * 9.0 - WS * 0.35; s = WS * 9.35; w = 0; }
  const z0 = z;
  if (tt > 26.6) { const u = tt - 26.6, d = u < 0.8 ? WS * u * u / 1.6 : WS * (u - 0.4); z = z0 - d; s += d; w = ss(u / 0.6); }
  return { z, ph: s / 0.56, w }; }
// poses: chaves [tempo, nome]; entre chaves, mistura suave (o golpe acelera)
const PK = [[0, 'carry'], [11.5, 'carry'], [12.4, 'ready'], [16.9, 'ready'], [18.25, 'wind'], [18.72, 'wind'], [19.0, 'strike'], [19.45, 'follow'], [20.6, 'follow'], [22.3, 'rest'], [26.2, 'rest'], [27.2, 'carry']];
function poseAt(tt) { const P = { carry: 0, ready: 0, wind: 0, strike: 0, follow: 0, rest: 0 };
  let i = PK.findIndex(k => k[0] > tt); if (i < 0) { P[PK[PK.length - 1][1]] = 1; return P; } if (i === 0) { P[PK[0][1]] = 1; return P; }
  const a = PK[i - 1], b = PK[i]; let u = (tt - a[0]) / (b[0] - a[0]); u = b[1] === 'strike' ? Math.pow(u, 2.2) : ss(u); P[a[1]] += 1 - u; P[b[1]] += u; return P; }
// matacão antes do golpe
function boulderAt(tt) { const zc = ZH - V * (TI - tt), dist = V * (tt - BT0), bounceP = 0.62, bA = 0.55 * Math.exp(-(tt - BT0) * 0.12);
  const b = Math.abs(Math.sin(Math.PI * (tt - BT0) / bounceP)) * bA * (tt > TI - 1.2 ? ss((TI - tt) / 1.2) * 0.6 + 0.4 : 1);
  const x = roadX(zc); return { x, y: hgt(x, zc) + BR * 0.92 + b, z: zc, rot: (zc + 60) / BR }; }

const SHOTS = [
  // 1. abre: a estrada da serra contra o sol baixo; ela pequena, subindo
  { a: 0, b: 4.6, f: (t, u, Wk) => ({ cam: [L3([-2.8, -0.75, 15.5], [-2.1, -0.2, 12.8], ss(u)), [0.6, 1.8, -10]], fov: 34, d: 9, dof: [1.5, 6], fg: 1 }) },
  // 2. acompanha de lado, contra a luz (borda laranja)
  { a: 4.6, b: 8.8, f: (t, u, Wk) => { const y = yRoad(Wk.z); return { cam: [[-2.4 + 0.3 * u, y + 0.75 + 0.15 * u, Wk.z - 1.9 - 0.3 * u], [0.1, y + 1.05, Wk.z - 0.2]], fov: 30, d: 3.4, dof: [5, 5] }; } },
  // 3. botas: pedrinhas descem quicando, ela para
  { a: 8.8, b: 11.0, f: (t, u, Wk) => { const y = yRoad(Wk.z); return { cam: [L3([0.9, y + 0.2, Wk.z - 1.9], [0.7, y + 0.22, Wk.z - 1.6], ss(u)), [0.05, y + 0.28, Wk.z]], fov: 30, d: 1.7, dof: [6, 6] }; } },
  // 4. contra-plongée no elmo: ela olha para cima e firma a marreta
  { a: 11.0, b: 13.3, f: (t, u) => ({ cam: [L3([1.2, 0.5, ZSTOP - 1.6], [1.0, 0.58, ZSTOP - 1.38], ss(u)), [0, 1.55, ZSTOP]], fov: 30, d: 1.9, dof: [6, 5] }) },
  // 5. por cima do ombro: o matacão desce a estrada (lente longa)
  { a: 13.3, b: 16.5, f: (t, u) => ({ cam: [L3([0.3, 1.98, ZSTOP + 2.4], [0.26, 1.92, ZSTOP + 2.15], ss(u)), [-0.3, 2.4, -40]], fov: 28, mid: [3.6, 600], dof: [0, 7], d: 30 }) },
  // 6. atrás dela, baixo, contra a subida: ela ergue a marreta, a pedra cresce vindo na direção da câmera
  { a: 16.5, b: TI + 0.2, f: (t, u) => ({ cam: [L3([0.95, 0.38, ZSTOP + 2.7], [0.72, 0.45, ZSTOP + 2.25], ss(u)), [-0.15, 1.45, ZSTOP - 4]], fov: 32, d: 2.6, dof: [3, 5] }) },
  // 7. depois do golpe, pela frente dela (de cima da estrada): as metades descem pelos dois lados, poeira
  { a: TI + 0.2, b: 23.2, f: (t, u) => ({ cam: [L3([-1.5, 1.25, ZSTOP + 5.8], [-1.25, 1.1, ZSTOP + 5.0], ss(u)), [0.25, 1.0, ZSTOP - 1.2]], fov: 32, d: 5.6, dof: [3, 5], shake: t >= TI + 0.2 ? 0.14 * Math.exp(-(t - TI - 0.2) * 2.6) : 0 }) },
  // 8. giro lento em volta dela; marreta volta ao ombro
  { a: 23.2, b: 26.9, f: (t, u) => { const a = lerp(-0.75, 0.15, ss(u)), r = lerp(2.9, 2.5, u); return { cam: [[Math.sin(a) * r, 1.05, ZSTOP - Math.cos(a) * r], [0, 1.3, ZSTOP]], fov: 30, d: r, dof: [5, 5] }; } },
  // 9. ela segue subindo; a metade da pedra em primeiro plano
  { a: 26.9, b: 31, f: (t, u, Wk) => ({ cam: [L3([0.15, 0.55, ZSTOP + 7.6], [0.08, 0.8, ZSTOP + 6.6], ss(u)), [0, 1.7, Wk.z - 9]], fov: 30, d: 7 + (ZSTOP - Wk.z), mid: [5.2, 60], dof: [2, 6] }) },
];
window.END = 30.5;
function shotAt(t) { const tt = ttOf(t), Wk = walkAt(tt), i = Math.max(0, SHOTS.findIndex(s => t >= s.a && t < s.b)), S = SHOTS[i], u = cl((t - S.a) / (Math.min(S.b, window.END) - S.a));
  const K = { fov: 30, d: 6, dof: [2, 4], seed: i + 1, tt, Wk, ...S.f(t, u, Wk) }, c = K.cam[0]; c[1] = Math.max(c[1], hgt(c[0], c[2]) + 0.18); return K; }
// ================= impact frame no estilo de anime: silhueta chapada em 2 valores, pincelada na direção do golpe,
// respingo de tinta e UMA cor de destaque; cada desenho fica 4 quadros (como animação "em dois"). Nada de estrela pontuda.
const MASK = document.createElement('canvas'); MASK.width = W; MASK.height = H; const TMP = document.createElement('canvas'); TMP.width = W; TMP.height = H;
const WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
function maskRender(keep) { const vis = scene.children.map(o => o.visible); scene.children.forEach(o => { if (!o.isLight) o.visible = keep.includes(o) && o.visible; });
  const env = scene.environment; scene.overrideMaterial = WHITE; R3.clear(); R3.render(scene, cam); scene.overrideMaterial = null; scene.environment = env; scene.children.forEach((o, i) => o.visible = vis[i]);
  const m = MASK.getContext('2d'); m.globalCompositeOperation = 'copy'; m.filter = 'blur(1.5px)'; m.drawImage(gl, 0, 0); m.filter = 'none'; m.globalCompositeOperation = 'source-over'; }
function tinted(col, dx = 0, dy = 0, sc = 1, px = W / 2, py = H / 2) { const q = TMP.getContext('2d'); q.globalCompositeOperation = 'copy'; q.setTransform(sc, 0, 0, sc, px - px * sc + dx, py - py * sc + dy); q.drawImage(MASK, 0, 0); q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-in'; q.fillStyle = col; q.fillRect(0, 0, W, H); q.globalCompositeOperation = 'source-over'; return TMP; }
// pincelada seca: várias cerdas paralelas, afiladas nas pontas, com falhas
function brush(c, x0, y0, x1, y1, wd, seed, col) { const r = rng(seed), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, n = Math.max(5, wd / 5 | 0); c.fillStyle = col;
  for (let i = 0; i < n; i++) { const o = (i / (n - 1) - 0.5) * wd * (0.8 + r() * 0.3), a = r() * 0.16, b = 1 - r() * 0.22, w = (wd / n) * (0.7 + r() * 1.3) * (1 - Math.abs(i / (n - 1) - 0.5) * 0.8);
    const ax = x0 + dx * a + nx * o, ay = y0 + dy * a + ny * o, bx = x0 + dx * b + nx * o, by = y0 + dy * b + ny * o, mx = (ax + bx) / 2 + nx * (r() - 0.5) * 6, my = (ay + by) / 2 + ny * (r() - 0.5) * 6;
    c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx + nx * w, my + ny * w, bx, by); c.quadraticCurveTo(mx - nx * w, my - ny * w, ax, ay); c.fill(); } }
// arco de corte: pincelada grossa em curva
function arcBrush(c, cx, cy, R, a0, a1, wd, seed, col) { const r = rng(seed), n = 9; c.strokeStyle = col; c.lineCap = 'round';
  for (let i = 0; i < n; i++) { const k = i / (n - 1) - 0.5, rr = R + k * wd, s0 = a0 + r() * 0.25, s1 = a1 - r() * 0.3; c.lineWidth = (wd / n) * (1.2 + r() * 1.4) * (1 - Math.abs(k) * 1.1); c.beginPath(); c.arc(cx, cy, rr, s0, s1); c.stroke(); } }
// respingo: gotas num leque na direção da força, poucas grandes e muitas pequenas
function splat(c, x, y, ux, uy, n, seed, col, reach = 900) { const r = rng(seed); c.fillStyle = col;
  for (let i = 0; i < n; i++) { const d = Math.pow(r(), 1.6) * reach + 60, sp = (r() - 0.5) * 1.5, ca = Math.cos(sp), sa = Math.sin(sp), vx = ux * ca - uy * sa, vy = ux * sa + uy * ca, sz = Math.max(3, Math.pow(r(), 3.2) * 60 * (1 - d / (reach * 1.4)));
    c.save(); c.translate(x + vx * d, y + vy * d); c.rotate(Math.atan2(vy, vx)); c.beginPath(); c.ellipse(0, 0, sz * (1 + r() * 1.6), sz * 0.6, 0, 0, 7); c.fill(); c.restore(); } }
function impactFrame2(c, k, x, y, ux, uy) {
  const g = GRAB.getContext('2d'); g.filter = 'none'; g.globalCompositeOperation = 'copy'; g.drawImage(out, 0, 0); g.globalCompositeOperation = 'source-over';
  const step = k < 2 ? 0 : k < 6 ? 1 : k < 10 ? 2 : 3, px = -uy, py = ux, GOLD = '#ffd04a';
  c.save(); c.filter = 'none'; c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  if (step === 0) { // clarão: branco quase puro, só as silhuetas em cinza claro
    c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.drawImage(tinted('#d9d4cc'), 0, 0); }
  else if (step === 1) { // desenho 1: preto, silhuetas brancas com sombra deslocada, corte dourado
    c.fillStyle = '#07070a'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) { const o = (i - 7.5) * 120 + Math.sin(i * 7.7) * 40, l = 500 + (i * 131 % 900); brush(c, x + px * o - ux * 300, y + py * o - uy * 300, x + px * o + ux * l, y + py * o + uy * l, 16 + (i * 37 % 34), 40 + i, 'rgba(255,255,255,0.16)'); }
    c.globalAlpha = 0.35; c.drawImage(tinted('#fff', -ux * 46, -uy * 46), 0, 0); c.globalAlpha = 1; c.drawImage(tinted('#fff'), 0, 0);
    arcBrush(c, x - ux * 120, y - uy * 120, 470, Math.atan2(uy, ux) - 1.25, Math.atan2(uy, ux) + 1.25, 150, 5, GOLD);
    splat(c, x, y, ux, uy, 70, 11, '#fff', 900); splat(c, x, y, ux, uy, 14, 13, GOLD, 700); }
  else if (step === 2) { // desenho 2: invertido, papel claro, silhuetas pretas, tinta espirrando, mesma cor de destaque
    c.fillStyle = '#f3ece0'; c.fillRect(0, 0, W, H);
    const gr = c.createRadialGradient(x, y, 0, x, y, 900); gr.addColorStop(0, 'rgba(255,208,74,0.95)'); gr.addColorStop(0.45, 'rgba(255,208,74,0.25)'); gr.addColorStop(1, 'rgba(255,208,74,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 12; i++) { const o = (i - 5.5) * 150 + Math.sin(i * 5.3) * 50, l = 700 + (i * 173 % 800); brush(c, x + px * o + ux * 80, y + py * o + uy * 80, x + px * o + ux * l, y + py * o + uy * l, 22 + (i * 29 % 40), 70 + i, 'rgba(12,10,12,0.9)'); }
    c.drawImage(tinted('#0b0a0d', ux * 18, uy * 18, 1.03, x, y), 0, 0);
    arcBrush(c, x - ux * 60, y - uy * 60, 560, Math.atan2(uy, ux) - 1.1, Math.atan2(uy, ux) + 1.1, 110, 6, '#0b0a0d'); arcBrush(c, x - ux * 60, y - uy * 60, 500, Math.atan2(uy, ux) - 0.9, Math.atan2(uy, ux) + 0.9, 46, 7, '#fff');
    splat(c, x, y, ux, uy, 110, 21, '#0b0a0d', 1100); splat(c, x, y, -ux, -uy, 26, 23, '#0b0a0d', 420); }
  else { // volta para a cena: zoom leve e separação de cor
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H); const z = 1.08 - 0.03 * (k - 10); c.translate(x, y); c.scale(z, z); c.translate(-x, -y);
    c.filter = 'contrast(1.35) saturate(1.3) brightness(1.1)'; c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 1; c.drawImage(GRAB, 0, 0); c.filter = 'none'; c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 0.28; c.globalCompositeOperation = 'screen'; c.drawImage(GRAB, ux * 22, uy * 22); c.drawImage(GRAB, -ux * 22, -uy * 22); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.drawImage(tinted('rgba(255,255,255,0.25)'), 0, 0); }
  c.restore();
  // grão de papel por cima dos desenhos
  if (step === 1 || step === 2) { c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.22; c.fillStyle = GRAIN || '#888'; c.fillRect(0, 0, W, H); c.restore(); }
}

// ================= quadro
const lay = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; });
const BLOOM = document.createElement('canvas'); BLOOM.width = W / 4; BLOOM.height = H / 4; let GRAIN = null; const GR = document.createElement('canvas'); GR.width = W; GR.height = H;
const _t = new THREE.Vector3(), _h = new THREE.Vector3(), prj = (x, y, z) => { _t.set(x, y, z).project(cam); return [(_t.x * 0.5 + 0.5) * W, (-_t.y * 0.5 + 0.5) * H, _t.z]; };
function puff(i, x, y, z, s, a) { const d = DUST[i]; if (!d) return; d.position.set(x, y, z); d.scale.set(s, s, 1); d.material.opacity = a; d.material.rotation = i * 1.7; }
function stage(t, K) {
  const tt = K.tt, Wk = K.Wk, P = poseAt(tt);
  // heroína
  const look = ss((tt - 11.0) / 0.9) * (1 - ss((tt - 14.6) / 1.2) * 0.75) * (1 - ss((tt - 18.2) / 0.4));
  hero.root.position.set(0, yRoad(Wk.z), Wk.z); hero.root.rotation.y = Math.PI;
  hero.update(tt, { ph: Wk.ph, w: Wk.w, look, ...P, brace: ss((tt - 16.9) / 1.2) * (1 - ss((tt - 22) / 1.5)) });
  hero.root.updateMatrixWorld(true);
  // matacão
  const tau = tt - TI;
  BH.forEach((h, k) => { const sg = k ? -1 : 1; h.visible = tt > BT0;
    if (tau < 0) { const b = boulderAt(tt); h.position.set(b.x, b.y, b.z); h.rotation.set(b.rot, 0, 0); }
    else { const e = 1 - Math.exp(-tau * 0.9), z = ZH + 4.8 * e, x = sg * (0.06 + 1.25 * (1 - Math.exp(-tau * 4)) + 0.3 * e), fall = Math.min(1.25, tau * 2.4), bo = Math.abs(Math.sin(tau * 5.5)) * 0.5 * Math.exp(-tau * 1.6);
      h.position.set(x, hgt(x, z) + BR * lerp(0.92, 0.7, fall / 1.25) + bo, z); h.rotation.set(ZH / BR + 60 / BR + 4.8 * e / BR * 0.7, 0, -sg * fall); } });
  // estilhaços
  hero.root.userData.hammerHead.getWorldPosition(_h);
  CHIPS.forEach((c, i) => { c.m.visible = tau > 0 && tau < 6; if (!c.m.visible) return; const T = Math.min(tau, 1.6), x = _h.x + c.vx * T * 0.9, z = _h.z - 0.2 + c.vz * T * 0.9; let y = _h.y + c.vy * T - 4.9 * T * T; const g = hgt(x, z) + c.s * 0.4; if (y < g) y = g;
    c.m.position.set(x, y, z); c.m.rotation.set(c.rx * T, c.ry * T, 0); });
  // pedrinhas que avisam
  PEB.forEach(p => { const u = tt - p.t0; p.m.visible = u > 0 && u < 3; if (!p.m.visible) return; const z = Wk.z - 5 + p.v * u, x = p.x + 0.15 * Math.sin(u * 3 + p.x * 9); p.m.position.set(x, hgt(x, z) + p.s * 0.6 + Math.abs(Math.sin(u * 7 + p.x * 5)) * 0.12 * Math.exp(-u * 0.6), z); p.m.rotation.set(u * 14, 0, u * 3); });
  // poeira
  let di = 0;
  for (let i = 0; i < 70; i++) { const ts = BT0 + i * 0.095; if (ts > TI) break; const age = tt - ts; if (age < 0 || age > 2.6) { di++; continue; } const b = boulderAt(ts), k = age / 2.6;
    puff(di++, b.x + Math.sin(i * 7.1) * 0.8 * k, hgt(b.x, b.z) + 0.3 + age * 0.45, b.z - 0.5, 0.9 + age * 1.6, 0.42 * Math.sin(Math.PI * Math.pow(k, 0.5)) * (tau > 0.4 ? Math.exp(-(tau - 0.4)) : 1)); }
  for (let i = 0; i < 60; i++) { const r = rng(400 + i), a = r() * 6.283, up = r(), sp = 2 + r() * 6, ag = tau; if (ag < 0 || ag > 7.5) { di++; continue; } const dr = (1 - Math.exp(-ag * 1.4)) * sp;
    const x = _h.x + Math.cos(a) * dr * 1.1, z = ZH + Math.sin(a) * dr * 0.8 + ag * 0.8 * (r() + 0.3), y = hgt(x, z) + 0.2 + up * 1.6 * (1 - Math.exp(-ag * 2)) + ag * 0.18;
    puff(di++, x, y, z, 0.8 + dr * 0.4 + ag * 0.35, 0.2 * Math.min(1, ag * 8) * Math.pow(1 - ag / 7.5, 1.5)); }
  for (let i = 0; i < 12; i++) { const r = rng(900 + i), ag = tt - 9.15 - i * 0.12; if (ag < 0 || ag > 2.2) { di++; continue; } const x = (r() - 0.5) * 1.4, z = Wk.z - 2.5 + ag * 2.4; puff(di++, x, hgt(x, z) + 0.05 + ag * 0.06, z, 0.12 + ag * 0.25, 0.3 * (1 - ag / 2.2)); }
  for (; di < DUST.length; di++) DUST[di].material.opacity = 0;
}
function draw(t) {
  const K = shotAt(t);
  stage(t, K);
  cam.fov = K.fov; cam.position.set(...K.cam[0]); cam.lookAt(_t.set(...K.cam[1])); if (K.shake) { cam.translateX(Math.sin(t * 83) * K.shake); cam.translateY(Math.sin(t * 97 + 1) * K.shake); } cam.updateMatrixWorld(true);
  // sol acompanha a ação (sombra nítida perto da câmera)
  const cx = cam.position.x * 0.5, cz = (cam.position.z + K.cam[1][2]) * 0.5; sun.target.position.set(cx, yRoad(cz), cz); sun.position.set(cx + SUN.x * 0.6, yRoad(cz) + SUN.y * 0.6, cz + SUN.z * 0.6);
  sun.shadow.camera.updateProjectionMatrix();
  RIM.dir.value.copy(sun.position).sub(sun.target.position).normalize().transformDirection(cam.matrixWorldInverse); RIM.col.value.set(0xff9a50).multiplyScalar(0.75); metalEnv(0.6, 0.6);
  cam.updateProjectionMatrix(); const d = K.d, mid = K.mid || [Math.max(0.1, d * 0.6), d * 1.7 + 1.5], cuts = [[mid[1] - 0.3, 600, K.dof[0]], [mid[0], mid[1], 0], [0.1, mid[0] + 0.15, K.dof[1]]];
  if (!K.dof[0]) { cuts[1][1] = 600; cuts.shift(); }
  lay.forEach(l => l.getContext('2d').clearRect(0, 0, W, H));
  cuts.forEach(([n, f], i) => { cam.near = n; cam.far = f; cam.updateProjectionMatrix(); R3.clear(); R3.render(scene, cam); lay[i].getContext('2d').drawImage(gl, 0, 0); });
  X.filter = 'none'; X.globalCompositeOperation = 'source-over'; X.globalAlpha = 1; X.fillStyle = '#000'; X.fillRect(0, 0, W, H);
  cuts.forEach(([, , b], i) => { X.filter = b ? `blur(${b}px)` : 'none'; X.drawImage(lay[i], 0, 0); }); X.filter = 'none';
  { const bc = BLOOM.getContext('2d'); bc.globalCompositeOperation = 'copy'; bc.drawImage(out, 0, 0, W / 4, H / 4); X.save(); X.globalCompositeOperation = 'screen';
    X.globalAlpha = 0.36; X.filter = 'brightness(0.72) contrast(2.4) blur(10px)'; X.drawImage(BLOOM, 0, 0, W, H);
    X.globalAlpha = 0.28; X.filter = 'brightness(0.72) contrast(2.4) blur(34px)'; X.drawImage(BLOOM, 0, 0, W, H); X.restore(); X.filter = 'none'; }
  cam.near = 0.1; cam.far = 600; cam.updateProjectionMatrix();
  if (t >= TI && t < TI + 0.2) { cam.fov = 30; cam.position.set(-2.2, 6.6, ZSTOP + 4.2); cam.lookAt(0, 0.9, ZSTOP - 1.5); cam.updateMatrixWorld(true); cam.updateProjectionMatrix(); maskRender([hero.root, BH[0], BH[1]]); hero.root.userData.hammerHead.getWorldPosition(_h); const [ix, iy] = prj(_h.x, _h.y, _h.z), [jx, jy] = prj(_h.x, _h.y - 0.4, _h.z - 1), dl = Math.hypot(jx - ix, jy - iy) || 1;
    impactFrame2(X, Math.min(11, Math.floor((t - TI) * 60 + 0.001)), ix, iy, (jx - ix) / dl, (jy - iy) / dl); return; }
  // sol na tela: clarão + raios + poeira no ar
  { const sp = _t.copy(sun.position).sub(sun.target.position).normalize().multiplyScalar(300).add(cam.position); const [sx, sy, sz] = prj(sp.x, sp.y, sp.z); const on = sz < 1 && sx > -300 && sx < W + 300, x = on ? sx : (sx < W / 2 ? -260 : W + 260), y = on ? Math.min(sy, H * 0.55) : H * 0.32;
    X.globalCompositeOperation = 'lighter'; let g = X.createRadialGradient(x, y, 0, x, y, 1500); g.addColorStop(0, `rgba(255,150,70,${on ? 0.5 : 0.36})`); g.addColorStop(0.35, 'rgba(255,120,60,0.13)'); g.addColorStop(1, 'rgba(0,0,0,0)'); X.fillStyle = g; X.fillRect(0, 0, W, H);
    X.save(); X.filter = 'blur(22px)'; const r = rng(K.seed * 7); for (let i = 0; i < 9; i++) { const a = Math.atan2(H * 0.6 - y, W / 2 - x) + (r() - 0.5) * 1.3, w = 0.02 + r() * 0.05; X.fillStyle = `rgba(255,160,90,${0.04 + r() * 0.06})`; X.beginPath(); X.moveTo(x, y); X.lineTo(x + Math.cos(a - w) * 2600, y + Math.sin(a - w) * 2600); X.lineTo(x + Math.cos(a + w) * 2600, y + Math.sin(a + w) * 2600); X.fill(); } X.restore();
    const r2 = rng(3 + K.seed); for (let i = 0; i < 80; i++) { const px = (r2() * W + t * (8 + r2() * 20)) % W, py = H * (0.12 + r2() * 0.75) + Math.sin(t * 0.7 + i) * 12; X.fillStyle = `rgba(255,190,130,${0.08 + r2() * 0.3})`; X.beginPath(); X.arc(px, py, 1 + r2() * 2.4, 0, 7); X.fill(); }
    X.globalCompositeOperation = 'source-over'; }
  // grade: sombra azul-petróleo, luz laranja, contraste
  { const gc = GR.getContext('2d'); gc.globalCompositeOperation = 'copy'; gc.filter = 'contrast(1.14) saturate(0.95) brightness(1.12)'; gc.drawImage(out, 0, 0); gc.filter = 'none'; X.drawImage(GR, 0, 0);
    X.globalCompositeOperation = 'soft-light'; let g = X.createLinearGradient(W, 0, 0, H); g.addColorStop(0, 'rgba(255,150,70,0.5)'); g.addColorStop(1, 'rgba(20,70,90,0.5)'); X.fillStyle = g; X.fillRect(0, 0, W, H);
    X.globalCompositeOperation = 'multiply'; X.fillStyle = 'rgba(250,236,236,1)'; X.fillRect(0, 0, W, H); X.globalCompositeOperation = 'source-over'; }
  let g = X.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(6,8,14,0.5)'); g.addColorStop(0.15, 'rgba(6,8,14,0)'); g.addColorStop(0.82, 'rgba(6,8,10,0)'); g.addColorStop(1, 'rgba(6,8,10,0.6)'); X.fillStyle = g; X.fillRect(0, 0, W, H);
  // capim desfocado em primeiro plano, embaixo
  X.save(); X.filter = 'blur(9px)'; { const r = rng(21 + K.seed); for (let i = 0; i < 22; i++) { const x = r() * W, hh = 90 + r() * 240, lean = (r() - 0.5) * 140 + Math.sin(t * 1.3 + i) * 10; X.fillStyle = 'rgba(30,22,16,0.9)'; X.beginPath(); X.moveTo(x - 14, H + 10); X.quadraticCurveTo(x + lean * 0.4, H - hh * 0.6, x + lean, H - hh); X.quadraticCurveTo(x + lean * 0.5 + 12, H - hh * 0.5, x + 16, H + 10); X.fill(); } } X.restore();
  g = X.createRadialGradient(W / 2, H * 0.5, 440, W / 2, H * 0.5, 1200); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)'); X.fillStyle = g; X.fillRect(0, 0, W, H);
  if (!GRAIN) { const p = document.createElement('canvas'); p.width = p.height = 256; const q = p.getContext('2d'), im = q.createImageData(256, 256), r = rng(99); for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 120; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } q.putImageData(im, 0, 0); GRAIN = X.createPattern(p, 'repeat'); }
  X.save(); X.translate((t * 997) % 256, (t * 613) % 256); X.globalCompositeOperation = 'overlay'; X.globalAlpha = 0.12; X.fillStyle = GRAIN; X.fillRect(-256, -256, W + 512, H + 512); X.restore();
  // abre e fecha no preto
  const fade = Math.max(1 - ss(t / 0.6), ss((t - (window.END - 0.7)) / 0.7)); if (fade > 0) { X.fillStyle = `rgba(0,0,0,${fade})`; X.fillRect(0, 0, W, H); }
}
window.seek = async t => draw(t); window.dbg = t => { const K = shotAt(t); draw(t); return { cam: K.cam, hero: hero.root.position.toArray(), camp: cam.position.toArray(), hid: hero.root.visible, ZSTOP }; };
draw(0); draw(0); window.READY = true;
