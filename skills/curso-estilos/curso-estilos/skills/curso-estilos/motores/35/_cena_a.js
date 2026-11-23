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
