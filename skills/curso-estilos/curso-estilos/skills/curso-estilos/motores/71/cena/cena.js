// 71: "A encomenda do cânion". Mensageira de blocos (Blockbench via MCP -> GLB) no cânion ao entardecer.
// Anda até a beira, baixa os óculos, salta, a mochila vira asa, plana pelo cânion, passa sob o arco e solta a encomenda de paraquedas numa casinha.
// Cada quadro é função pura de t (window.seek(t)). Parâmetros da URL: esc (0.5 = 540×960; 1 = 1080×1920) ou w e h (tamanho livre do quadro, ex.: w=960&h=540).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const Q = new URLSearchParams(location.search), ESC = Number(Q.get('esc') || 1);
const OW = Number(Q.get('w')) || Math.round(1080 * ESC), OH = Number(Q.get('h')) || Math.round(1920 * ESC), DUR = 28.5;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const sine = x => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x));
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(7101);

// ------------------------------------------------------------ ruído
const PERM = new Uint8Array(512); { const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) PERM[i] = p[i & 255]; }
const hsh = (i, j) => PERM[(PERM[i & 255] + j) & 255] / 255;
function vnoise(x, y) { const i = Math.floor(x), j = Math.floor(y); let fx = x - i, fy = y - j; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hsh(i, j), hsh(i + 1, j), fx), lerp(hsh(i, j + 1), hsh(i + 1, j + 1), fx), fy); }
const fbm = (x, y, o = 4) => { let s = 0, a = 0.5, f = 1; for (let k = 0; k < o; k++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; };

// ------------------------------------------------------------ terreno: platô a 40 m, cânion que começa na beira (z = 0) e corre para -z
const H = 40, Z0 = -22;
const cx = z => 10 * Math.sin((z - Z0) * 0.012) + 6 * Math.sin((z - Z0) * 0.031);
const hw = z => 22 + 9 * sstep(-30, -140, z) + 5 * Math.sin(z * 0.021 + 1.3) * sstep(-20, -80, z);
function canyonDepth(x, z) {
  const zz = Math.max(z, -1e9); let dist;
  if (zz > Z0) dist = Math.hypot(x - cx(Z0), zz - Z0); else dist = Math.abs(x - cx(zz));
  const w = hw(Math.min(zz, Z0)) + 1.8 * (fbm(x * 0.08, z * 0.08) - 0.5) * 2;
  const p = clamp((w - dist) / (w * 0.55));
  return 0.74 * sstep(0, 0.32, p) + 0.26 * sstep(0.32, 1, p);
}
function height(x, z) {
  const nearPath = 1 - sstep(4, 12, Math.abs(x)) * 1; // o caminho dela no platô fica plano
  const pathZone = sstep(-1, 2, z) * (1 - sstep(16, 24, z));
  let base = H + 1.4 * (fbm(x * 0.04, z * 0.04) - 0.5) * 2 * (1 - nearPath * pathZone) + 0.25 * (fbm(x * 0.4, z * 0.4) - 0.5);
  // mesas e torres ao longe no platô
  const d = canyonDepth(x, z);
  base += 14 * sstep(0.62, 0.7, fbm(x * 0.012 + 3, z * 0.012 + 7)) * sstep(60, 110, Math.hypot(x, z - 10)) * (1 - sstep(0, 0.05, d));
  let h = base - 38.5 * d;
  if (d > 0.02 && d < 0.97) { const s = 4.2, q = h / s, f = q - Math.floor(q); const ht = (Math.floor(q) + sstep(0.55, 1, f)) * s; h = lerp(h, ht, 0.85 * sstep(0.02, 0.12, d)); }
  return h;
}

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(OW, OH);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.domElement.id = 'c'; document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const FOG = new THREE.Color('#c99272');
scene.fog = new THREE.FogExp2(FOG, 0.0048);
const camera = new THREE.PerspectiveCamera(40, OW / OH, 0.05, 1200);

const SUN = V(0.22, 0.13, -1).normalize();
// ------------------------------------------------------------ céu: horizonte quente -> teal, disco e halo do sol
{
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uSun: { value: SUN } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform vec3 uSun; varying vec3 vP;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=.5; } return s; }
      void main(){ vec3 d = normalize(vP); float y = clamp(d.y, -0.1, 1.);
        vec3 hor = vec3(1.0,.66,.40), mid = vec3(.62,.62,.66), top = vec3(.20,.40,.52);
        vec3 c = mix(hor, mid, smoothstep(0., .22, y)); c = mix(c, top, smoothstep(.18, .75, y));
        float s = max(dot(d, uSun), 0.);
        c += vec3(1.,.55,.25) * pow(s, 10.) * .14 + vec3(1.,.75,.45) * pow(s, 220.) * .45;
        c = mix(c, vec3(1.25,1.0,.75) * 2.2, smoothstep(.99965, .9998, s));
        vec2 uv = d.xz / (d.y + .18) * 1.3; float cl = smoothstep(.5, .85, fbm(uv * 1.4 + vec2(5.,2.)));
        vec3 cc = mix(vec3(.95,.55,.40), vec3(1.,.82,.6), pow(s, 3.)); c = mix(c, cc, cl * .6 * smoothstep(.03, .25, y));
        gl_FragColor = vec4(c, 1.); }` });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), m));
}

// ------------------------------------------------------------ luz
const hemi = new THREE.HemisphereLight('#9cc0d6', '#8a4a2c', 0.95); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffc48c', 3.2); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
scene.add(sun, sun.target);
function aimSun(focus, half) { sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(SUN, 150);
  Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 400 }); sun.shadow.camera.updateProjectionMatrix(); }

// ------------------------------------------------------------ malha do terreno (flat shading, cor por triângulo: estratos de arenito)
const STRATA = ['#b4532f', '#c96d3d', '#dc9a5e', '#a5432a', '#e2b27c', '#c4673b', '#93402a', '#d78a52'].map(c => new THREE.Color(c));
{
  const X0 = -200, X1 = 200, ZA = -460, ZB = 60, STEP = 1.25;
  const nx = Math.round((X1 - X0) / STEP), nz = Math.round((ZB - ZA) / STEP);
  const hs = new Float32Array((nx + 1) * (nz + 1));
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) hs[j * (nx + 1) + i] = height(X0 + i * STEP, ZA + j * STEP);
  const tris = nx * nz * 2; const pos = new Float32Array(tris * 9), col = new Float32Array(tris * 9);
  let k = 0; const c = new THREE.Color(), top = new THREE.Color('#c98d58'), topG = new THREE.Color('#a48a4c'), floorC = new THREE.Color('#b98257'), green = new THREE.Color('#6f7a3c');
  const a = V(0, 0, 0), b = V(0, 0, 0), d = V(0, 0, 0), e1 = V(0, 0, 0), e2 = V(0, 0, 0), nrm = V(0, 0, 0);
  function tri(p, q, r) {
    e1.subVectors(q, p); e2.subVectors(r, p); nrm.crossVectors(e1, e2).normalize(); if (nrm.y < 0) nrm.negate();
    const my = (p.y + q.y + r.y) / 3, mx = (p.x + q.x + r.x) / 3, mz = (p.z + q.z + r.z) / 3;
    const slope = 1 - nrm.y;
    const band = Math.floor((my + 2.2 * (fbm(mx * 0.05, mz * 0.05) - 0.5)) / 2.6); c.copy(STRATA[((band % 8) + 8) % 8]);
    if (my > H - 2.5 && slope < 0.25) { c.copy(top).lerp(topG, sstep(0.45, 0.7, fbm(mx * 0.15, mz * 0.15))); }
    else if (my < 5 && slope < 0.3) { c.copy(floorC); const rv = Math.abs(mx - cx(mz)); c.lerp(green, 0.75 * (1 - sstep(3, 9, rv)) * sstep(0.4, 0.6, fbm(mx * 0.2, mz * 0.2) + 0.2)); }
    else if (slope < 0.18) c.lerp(top, 0.45);
    const jit = 0.94 + 0.12 * hsh(Math.floor(mx * 3.1) & 255, Math.floor(mz * 2.7) & 255); c.multiplyScalar(jit);
    for (const v of [p, q, r]) { pos[k] = v.x; pos[k + 1] = v.y; pos[k + 2] = v.z; col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b; k += 3; }
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = X0 + i * STEP, z = ZA + j * STEP, w = nx + 1;
    a.set(x, hs[j * w + i], z); b.set(x + STEP, hs[j * w + i + 1], z); d.set(x, hs[(j + 1) * w + i], z + STEP); const e = V(x + STEP, hs[(j + 1) * w + i + 1], z + STEP);
    tri(a, d, b); tri(b, d, e);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const terr = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, flatShading: true }));
  terr.castShadow = terr.receiveShadow = true; scene.add(terr);
}
// rio no fundo
{
  const pts = []; for (let z = -460; z <= -10; z += 3) pts.push(V(cx(z), 0, z));
  const n = pts.length; const pos = new Float32Array(n * 2 * 3), idx = [];
  pts.forEach((p, i) => { const w = 2.6 + 1.2 * Math.sin(p.z * 0.05); const y = Math.max(1.2, height(p.x, p.z) + 0.25);
    pos.set([p.x - w, y, p.z, p.x + w, y, p.z], i * 6); if (i < n - 1) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const river = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#2f6f78', roughness: 0.12, metalness: 0.1 })); river.receiveShadow = true; scene.add(river);
}

// ------------------------------------------------------------ arco de pedra atravessando o cânion
const ARCH_Z = -135;
{
  const c0 = cx(ARCH_Z), w = hw(ARCH_Z) * 0.86;
  const curve = new THREE.CatmullRomCurve3([V(c0 - w, 27, ARCH_Z + 3), V(c0 - w * 0.55, 33.5, ARCH_Z + 1), V(c0, 35.5, ARCH_Z), V(c0 + w * 0.55, 33.8, ARCH_Z - 1), V(c0 + w, 28, ARCH_Z - 2)]);
  const g = new THREE.TubeGeometry(curve, 28, 3.2, 7, false).toNonIndexed();
  const p = g.attributes.position, col = new Float32Array(p.count * 3); const cc = new THREE.Color();
  for (let i = 0; i < p.count; i += 3) { const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3; cc.copy(STRATA[(Math.floor(y / 1.6) % 8 + 8) % 8]).multiplyScalar(0.92 + 0.12 * R());
    for (let k = 0; k < 3; k++) col.set([cc.r, cc.g, cc.b], (i + k) * 3); }
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, x + 0.7 * (vnoise(y * 0.7, z * 0.7) - 0.5), y + 0.5 * (vnoise(x * 0.6, z) - 0.5), z); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const arch = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true })); arch.castShadow = arch.receiveShadow = true; scene.add(arch);
}

// ------------------------------------------------------------ props: arbustos e pedras (platô e fundo)
{
  const bush = new THREE.IcosahedronGeometry(1, 0), rock = new THREE.DodecahedronGeometry(1, 0);
  const bm = new THREE.MeshStandardMaterial({ color: '#6f6a36', roughness: 0.95, flatShading: true }), bm2 = new THREE.MeshStandardMaterial({ color: '#8a7a3e', roughness: 0.95, flatShading: true });
  const rm = new THREE.MeshStandardMaterial({ color: '#b46a40', roughness: 0.9, flatShading: true });
  const add = (geo, mat, x, z, s, sy) => { const y = height(x, z); if (canyonDepth(x, z) > 0.01 && y > 6) return; const m = new THREE.Mesh(geo, mat); m.position.set(x, y + s * sy * 0.35, z); m.scale.set(s, s * sy, s * (0.8 + 0.4 * R())); m.rotation.y = R() * 6; m.castShadow = m.receiveShadow = true; scene.add(m); };
  for (let i = 0; i < 260; i++) { const x = (R() - 0.5) * 90, z = -2 + R() * 50; if (Math.abs(x) < 2.2 && z < 14) continue; add(R() < 0.7 ? bush : rock, R() < 0.7 ? (R() < 0.5 ? bm : bm2) : rm, x, z, 0.25 + R() * 0.55, R() < 0.7 ? 0.7 : 0.6); }
  for (let i = 0; i < 160; i++) { const z = -60 - R() * 300, x = cx(z) + (R() - 0.5) * 16; if (Math.abs(x - cx(z)) < 3.5) continue; add(bush, R() < 0.5 ? bm : bm2, x, z, 0.4 + R() * 0.7, 0.75); }
}

// ------------------------------------------------------------ casinha de adobe no fundo do cânion (destino da encomenda)
const HOUSE = (() => { const z = -172, x = cx(z) + 5.2; return V(x, height(x, z), z); })();
const winMat = new THREE.MeshStandardMaterial({ color: '#2a1d16', emissive: '#ffb45e', emissiveIntensity: 0 });
const lampMat = new THREE.MeshStandardMaterial({ color: '#3a2a20', emissive: '#ffcf8a', emissiveIntensity: 0 });
let porchLight; const HOUSE_DOOR = {};
{
  const g = new THREE.Group(); g.position.copy(HOUSE); g.rotation.y = 0.15; scene.add(g);
  const adobe = new THREE.MeshStandardMaterial({ color: '#e0bf93', roughness: 0.95 }), roof = new THREE.MeshStandardMaterial({ color: '#7d4a2e', roughness: 0.8 }), wood = new THREE.MeshStandardMaterial({ color: '#5a3622', roughness: 0.8 });
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  box(5, 3, 4, adobe, 0, 1.3, 0); box(5.6, 0.35, 4.6, roof, 0, 2.95, 0);
  for (const x of [-2.2, -0.8, 0.6, 2.0]) box(0.18, 0.18, 0.7, wood, x, 2.65, 2.25);
  { const hinge = new THREE.Group(); hinge.position.set(-1.6, 0, 2.02); g.add(hinge); const dr = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, 0.12), wood); dr.position.set(0.5, 0.95, 0); dr.castShadow = true; hinge.add(dr); HOUSE_DOOR.hinge = hinge;
    const inside = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 1.88), new THREE.MeshBasicMaterial({ color: '#ffb866' })); inside.position.set(-1.1, 0.95, 2.012); g.add(inside); HOUSE_DOOR.inside = inside; }
  const win = box(1.0, 0.9, 0.1, winMat, 1.2, 1.6, 2.02); box(1.2, 0.12, 0.25, wood, 1.2, 1.08, 2.08);
  box(0.25, 0.25, 0.25, lampMat, -1.1, 2.15, 2.15);
  porchLight = new THREE.PointLight('#ffbe78', 0, 9, 1.6); porchLight.position.set(-1.1, 2.0, 2.6); g.add(porchLight);
  // caixa d'água em palafita
  for (const [x, z] of [[3.6, -1.3], [4.6, -1.3], [3.6, -0.3], [4.6, -0.3]]) box(0.15, 3, 0.15, wood, x, 1.5, z);
  box(1.4, 1.2, 1.4, new THREE.MeshStandardMaterial({ color: '#8c8a80', roughness: 0.5, metalness: 0.3 }), 4.1, 3.6, -0.8);
  g.updateMatrixWorld(true);
  HOUSE.door = V(-1.1, 0, 3.0).applyMatrix4(g.matrixWorld); HOUSE.front = V(0, 0, 1).applyQuaternion(g.quaternion);
}

// ------------------------------------------------------------ pássaros
const birds = [];
{
  const m = new THREE.MeshBasicMaterial({ color: '#2a1a14', side: THREE.DoubleSide, fog: true });
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Group(); const wl = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.16), m), wr = wl.clone();
    wl.position.x = -0.27; wr.position.x = 0.27; const pl = new THREE.Group(), pr = new THREE.Group(); pl.add(wl); pr.add(wr); b.add(pl, pr);
    b.userData = { pl, pr, c: V(cx(-80) + (R() - 0.5) * 20, 26 + R() * 10, -80 - R() * 50), r: 6 + R() * 8, w: 0.35 + R() * 0.25, ph: R() * 6.28 };
    scene.add(b); birds.push(b);
  }
}

// ------------------------------------------------------------ poeira na luz (perto da beira)
let dust;
{
  const n = 700, g = new THREE.BufferGeometry(); const p0 = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { p0[i * 3] = (R() - 0.5) * 14; p0[i * 3 + 1] = H + R() * 5; p0[i * 3 + 2] = -6 + R() * 18; }
  g.setAttribute('position', new THREE.BufferAttribute(p0.slice(), 3));
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
  const m = new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: 0.05, color: '#ffd6a0', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  dust = new THREE.Points(g, m); dust.frustumCulled = false; dust.userData.p0 = p0; scene.add(dust);
}

// ------------------------------------------------------------ a mensageira (Blockbench -> GLB)
const gltf = await new GLTFLoader().loadAsync('mensageira.glb');
const kid = gltf.scene; const KS = 1.65 / (33.4 / 16); kid.scale.setScalar(KS);
const CENTER = 1.05; // giro do corpo no voo em torno do peito
const kidRoot = new THREE.Group(); kidRoot.add(kid); kid.position.y = -CENTER; scene.add(kidRoot);
kid.traverse(o => { if (!o.isMesh) return; o.castShadow = o.receiveShadow = true; o.frustumCulled = false;
  const map = o.material.map; if (map) { map.magFilter = THREE.NearestFilter; map.minFilter = THREE.LinearMipmapLinearFilter; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; map.needsUpdate = true; }
  o.material = new THREE.MeshStandardMaterial({ map, roughness: 0.78, metalness: 0 }); });
const mixer = new THREE.AnimationMixer(kid);
const clip = n => gltf.animations.find(a => a.name.includes(n));
const A = {}; for (const n of ['andar', 'olhar_oculos', 'salto', 'abrir_asas', 'planar']) { A[n] = mixer.clipAction(clip(n)); A[n].play(); A[n].setLoop(n === 'andar' || n === 'planar' ? THREE.LoopRepeat : THREE.LoopOnce); A[n].clampWhenFinished = true; }
const pacoteNode = kid.getObjectByName('pacote');

// encomenda que cai (cópia do cubo do Blockbench) + paraquedas de gomos
const parcel = new THREE.Group(); scene.add(parcel); parcel.visible = false;
{ let src; pacoteNode.traverse(o => { if (o.isMesh && !src) src = o; });
  const m = src.clone(); m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); src.geometry.computeBoundingBox(); const bb = src.geometry.boundingBox, ctr = bb.getCenter(V(0, 0, 0));
  m.geometry = src.geometry.clone(); m.geometry.translate(-ctr.x, -ctr.y, -ctr.z); m.scale.setScalar(KS * 1.0); parcel.add(m);
  const chute = new THREE.Group(); parcel.add(chute); parcel.userData.chute = chute;
  const cg = new THREE.ConeGeometry(0.85, 0.5, 8, 1, true).toNonIndexed(); const col = new Float32Array(cg.attributes.position.count * 3);
  for (let i = 0; i < cg.attributes.position.count; i++) { const seg = Math.floor(i / 3) % 8; const c = new THREE.Color(seg % 2 ? '#efe2c4' : '#c4542f'); col.set([c.r, c.g, c.b], i * 3); }
  cg.setAttribute('color', new THREE.BufferAttribute(col, 3)); cg.computeVertexNormals();
  const canopy = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide, flatShading: true })); canopy.position.y = 1.5; canopy.castShadow = true; chute.add(canopy);
  const lm = new THREE.LineBasicMaterial({ color: '#3a2a20' }); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 8; const lg = new THREE.BufferGeometry().setFromPoints([V(0, 0.1, 0), V(Math.cos(a) * 0.8, 1.27, Math.sin(a) * 0.8)]); chute.add(new THREE.Line(lg, lm)); }
}

// ------------------------------------------------------------ trajetória
const T_WALK1 = 6.0, T_LOOK = 6.0, T_JUMP = 9.2, T_TAKEOFF = 9.75, T_OPEN = 10.4, T_GLIDE = 11.2, T_DROP = 22.3;
const ZSTAND = 1.2;
function walkZ(t) { if (t <= 5.4) return 8.5 - 1.3 * t; const u = clamp((t - 5.4) / 0.6); return 1.48 - 0.28 * (2 * u - u * u); }
// voo: integra velocidade numericamente (tabela a 240 Hz)
const FT = []; {
  let z = ZSTAND, y = 0; const y0 = height(0, ZSTAND); const dt = 1 / 240;
  let yb = y0, vy = 3.4; const SINK = 1.65;
  for (let t = T_TAKEOFF; t <= DUR + 0.5; t += dt) {
    const sp = lerp(3.8, 14, sstep(T_TAKEOFF, 12.2, t));
    z -= sp * dt;
    vy -= 9.8 * dt * (1 - sstep(T_OPEN + 0.1, T_OPEN + 0.9, t)); // a asa segura a queda
    const vyg = lerp(-SINK - 0.6 * sstep(20.5, 22, t), 1.1, sstep(22.3, 23.6, t)); // solta o peso e sobe
    vy = lerp(vy, vyg, sstep(T_OPEN + 0.2, T_GLIDE + 0.6, t) * 0.08 + 0.0);
    yb += vy * dt;
    FT.push([t, cx(z) * sstep(T_TAKEOFF + 0.5, 13.5, t) + 0.0, yb, z]);
  }
}
function flyPos(t) { const i = clamp(Math.floor((t - T_TAKEOFF) * 240), 0, FT.length - 2); const a = FT[i], b = FT[i + 1]; const u = clamp((t - a[0]) * 240); return V(lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)); }

const qStand = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0));
function glideQuat(t) {
  const p0 = flyPos(t - 0.05), p1 = flyPos(t + 0.05); const d = p1.clone().sub(p0).normalize();
  const pa = flyPos(t - 0.3), pb = flyPos(t + 0.3); const lat = (pb.x - 2 * flyPos(t).x + pa.x) / 0.09; // aceleração lateral
  const yAx = d.clone(); const zAx = V(0, -1, 0).addScaledVector(yAx, -V(0, -1, 0).dot(yAx)).normalize(); const xAx = V(0, 0, 0).crossVectors(yAx, zAx);
  const m = new THREE.Matrix4().makeBasis(xAx, yAx, zAx); const q = new THREE.Quaternion().setFromRotationMatrix(m);
  const roll = clamp(-lat * 0.09, -0.55, 0.55); return q.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), roll));
}
function kidState(t) {
  if (t < T_TAKEOFF) { const z = t < T_WALK1 ? walkZ(t) : ZSTAND; const y = height(0, z); return { p: V(0, y + CENTER, z), q: qStand.clone() }; }
  const p = flyPos(t).add(V(0, CENTER, 0));
  const w = sstep(T_TAKEOFF + 0.2, T_GLIDE + 0.5, t); const q = qStand.clone().slerp(glideQuat(Math.max(t, T_TAKEOFF + 0.06)), w);
  return { p, q };
}

// pose de soltura do pacote (pré-calculada)
let DROP0, DROPV;
function weights(t) {
  const W = { andar: 0, olhar_oculos: 0, salto: 0, abrir_asas: 0, planar: 0 }, T = {};
  W.andar = t < T_WALK1 ? 1 : 1 - sstep(T_WALK1 - 0.1, T_WALK1 + 0.25, t); T.andar = t % 1;
  W.olhar_oculos = sstep(T_LOOK - 0.2, T_LOOK + 0.2, t) * (1 - sstep(T_JUMP - 0.05, T_JUMP + 0.15, t)); T.olhar_oculos = clamp(t - T_LOOK, 0, 2.8);
  W.salto = sstep(T_JUMP - 0.1, T_JUMP + 0.1, t) * (1 - sstep(T_GLIDE - 0.2, T_GLIDE + 0.5, t)); T.salto = clamp(t - T_JUMP, 0, 1.2);
  W.abrir_asas = sstep(T_OPEN - 0.02, T_OPEN + 0.02, t) * (1 - sstep(T_GLIDE + 0.6, T_GLIDE + 0.9, t)); T.abrir_asas = clamp(t - T_OPEN, 0, 1);
  W.planar = sstep(T_GLIDE, T_GLIDE + 0.6, t); T.planar = (t - T_GLIDE) % 2;
  return { W, T };
}
function pose(t) {
  const k = kidState(t); kidRoot.position.copy(k.p); kidRoot.quaternion.copy(k.q);
  const { W, T } = weights(t);
  for (const n in A) { A[n].enabled = W[n] > 0.001; A[n].weight = W[n]; A[n].time = T[n]; }
  mixer.update(0); kidRoot.updateMatrixWorld(true);
  return k;
}
pose(T_DROP); DROP0 = pacoteNode.getWorldPosition(V(0, 0, 0)); DROPV = flyPos(T_DROP + 0.05).sub(flyPos(T_DROP - 0.05)).multiplyScalar(10);
const LAND = HOUSE.door.clone();
function parcelState(t) {
  const u = t - T_DROP; if (u < 0) return null;
  // horizontal: velocidade do voo freando pelo paraquedas, corrigida para cair na porta
  const tau = 0.9, Tl = 3.9; const f = 1 - Math.exp(-u / tau), fL = 1 - Math.exp(-Tl / tau);
  const free = DROP0.clone().addScaledVector(DROPV.clone().setY(0), tau * f);
  const freeL = DROP0.clone().addScaledVector(DROPV.clone().setY(0), tau * fL);
  const corr = LAND.clone().sub(freeL).setY(0).multiplyScalar(sstep(0, Tl, u));
  const yTop = DROP0.y, yEnd = LAND.y + 0.15; const yy = u < 0.35 ? yTop - 4.9 * u * u : lerp(yTop - 0.6, yEnd, sstep(0.35, Tl, u) * 0.35 + clamp((u - 0.35) / (Tl - 0.35)) * 0.65);
  const landed = u >= Tl;
  const p = landed ? V(LAND.x, yEnd, LAND.z) : free.add(corr).setY(Math.max(yy, yEnd));
  const open = sstep(0.25, 0.65, u) * (1 + 0.12 * Math.sin(clamp((u - 0.4) / 0.6) * Math.PI)) * (1 - sstep(Tl, Tl + 0.6, u));
  const sway = 0.18 * Math.sin(u * 2.4) * (1 - sstep(Tl - 0.8, Tl, u));
  return { p, open, sway, landed: sstep(Tl, Tl + 0.4, u) };
}

// ------------------------------------------------------------ pós: bloom + grade teal/laranja + vinheta + grão
const composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(OW, OH);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(OW, OH), 0.3, 0.5, 0.97); composer.addPass(bloom);
composer.addPass(new OutputPass());
const fin = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uT: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uT; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uT * 7.13) * 43758.5453); }
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(.299,.587,.114));
      c = mix(c, c * vec3(.86,1.0,1.08) + vec3(0.,.012,.03), 1. - smoothstep(.05, .45, l));   // sombra puxa pro teal
      c = mix(c, c * vec3(1.05,.99,.9), smoothstep(.5, 1., l));                                // luz quente
      vec2 d = vUv - .5; d.x *= .7; c *= 1. - .5 * dot(d, d) * 1.6;
      c += (h(vUv * 1000.) - .5) * .022; gl_FragColor = vec4(c, 1.); }` });
composer.addPass(fin);

// ------------------------------------------------------------ direção (câmera sempre andando, com destino)
function shot(t, k) {
  const P = k.p;
  if (t < 4.2) { // A: à frente, baixa, recuando com ela; luz baixa no rosto
    const u = sine(t / 4.2); const g = height(0.9, P.z - 2.6);
    return { cp: V(lerp(1.1, 0.8, u), Math.max(g, P.y - CENTER) + lerp(0.6, 0.95, u), P.z - lerp(3.6, 2.9, u)), ct: P.clone().add(V(0, lerp(0.05, 0.3, u), 0)), fov: 38, half: 12 };
  }
  if (t < 7.5) { // B: por trás, sobe por cima do ombro e revela o cânion
    const u = sine((t - 4.2) / 3.3);
    const cp = P.clone().add(V(lerp(1.1, 0.55, u), lerp(-0.1, 0.9, u), lerp(3.6, 2.9, u)));
    const ct = P.clone().add(V(0, 0.45, -2)).lerp(V(-0.2, 22, -70), 0.5 * sstep(0.15, 0.95, u));
    return { cp, ct, fov: lerp(40, 50, u), half: 40 };
  }
  if (t < T_JUMP) { // C: flutuando sobre o abismo, de frente: óculos descem
    const u = sine((t - 7.5) / (T_JUMP - 7.5));
    return { cp: P.clone().add(V(lerp(1.15, 0.8, u), lerp(0.75, 0.55, u), -lerp(2.9, 2.4, u))), ct: P.clone().add(V(0, 0.5, 0)), fov: 36, half: 10 };
  }
  if (t < 13.2) { // D: na beira, ao lado; ela salta, cai e a asa abre; a câmera mergulha atrás
    const u = sine((t - T_JUMP) / (13.2 - T_JUMP));
    const edge = V(3.4, height(3.4, 5.2) + 2.0, 5.2);
    const cp = edge.clone().lerp(P.clone().add(V(3.2, 2.2, 9)), sstep(0.35, 1, u));
    return { cp, ct: P.clone().add(V(0, 0, lerp(0, -4, u))), fov: lerp(42, 48, u), half: 30 };
  }
  if (t < 21.6) { // E: perseguição pelo cânion; passa por baixo do arco
    const u = (t - 13.2) / (21.6 - 13.2);
    const back = lerp(9, 5.5, sine(u * 1.4)), side = lerp(3.2, -2.6, sstep(0.25, 0.6, u)) * (1 - 0.6 * sstep(0.7, 0.95, u)), up = lerp(2.2, -1.2, sstep(0.45, 0.8, u));
    const cp = P.clone().add(V(side, up, back));
    const ct = P.clone().add(V(-0.3 * side, 0.2 + 1.2 * sstep(0.55, 0.8, u) * (1 - sstep(0.85, 1, u)), -lerp(3, 4, u)));
    return { cp, ct, fov: lerp(46, 52, u), half: 30 };
  }
  { // F: câmera desce o rio em direção à casinha (contra o sol): ela passa por cima, a encomenda desce na porta, a janela acende
    const u = (t - 21.6) / (DUR - 21.6), e = sine(u);
    const door = HOUSE.door;
    const cp = door.clone().add(V(lerp(3.5, 1.6, e), lerp(3.2, 1.9, e), lerp(30, 10, e)));
    const ps = parcelState(t); const pp = ps ? ps.p : P;
    const ct = P.clone().lerp(pp, sstep(0.1, 0.4, u)).lerp(door.clone().add(V(0.6, 2.0, -3)), sstep(0.6, 0.92, u));
    return { cp, ct, fov: lerp(50, 40, e), half: 30 };
  }
}

function apply(t) {
  const k = pose(t);
  // pacote: some da mochila na soltura
  pacoteNode.scale.setScalar(t < T_DROP ? 1 : 0.0001);
  const ps = parcelState(t); parcel.visible = !!ps;
  if (ps) { parcel.position.copy(ps.p); parcel.rotation.set(0, 0.6, ps.sway); parcel.userData.chute.scale.setScalar(Math.max(0.0001, ps.open)); }
  // casinha acende depois que a encomenda chega
  const lit = sstep(26.4, 26.9, t); winMat.emissiveIntensity = 2.0 * lit; lampMat.emissiveIntensity = 1.4 * lit * (t > 26.45 && t < 26.6 ? 0.3 : 1); porchLight.intensity = 3 * lit;
  { const op = sstep(27.0, 27.7, t); HOUSE_DOOR.hinge.rotation.y = 1.35 * op * (1 + 0.06 * Math.sin(clamp((op - 0.7) / 0.3) * Math.PI)); HOUSE_DOOR.inside.material.color.set('#ffb866').multiplyScalar(0.4 + 1.3 * op); }
  for (const b of birds) { const d = b.userData, a = d.ph + t * d.w; b.position.set(d.c.x + Math.cos(a) * d.r, d.c.y + Math.sin(a * 1.7) * 0.8, d.c.z + Math.sin(a) * d.r); b.rotation.set(0, -a, 0.25);
    const fl = Math.sin(t * 9 + d.ph * 3) * 0.6; d.pl.rotation.z = fl; d.pr.rotation.z = -fl; }
  { const a = dust.geometry.attributes.position.array, p0 = dust.userData.p0; for (let i = 0; i < a.length; i += 3) { a[i] = p0[i] + Math.sin(t * 0.3 + i) * 0.4 + t * 0.15; a[i + 1] = p0[i + 1] + Math.sin(t * 0.5 + i * 0.7) * 0.3; a[i + 2] = p0[i + 2] + Math.cos(t * 0.25 + i) * 0.4; } dust.geometry.attributes.position.needsUpdate = true; dust.visible = t < 11; }
  const s = shot(t, k);
  s.cp.y = Math.max(s.cp.y, height(s.cp.x, s.cp.z) + 0.9);
  camera.position.copy(s.cp); camera.lookAt(s.ct); camera.fov = s.fov; camera.updateProjectionMatrix();
  aimSun(k.p.clone().lerp(s.ct, 0.3), s.half);
  fin.uniforms.uT.value = t;
}
window.seek = async t => { apply(t); composer.render(); };
window.DUR = DUR;
window.DBG = { fly: t => flyPos(t).toArray().map(v => +v.toFixed(2)), house: HOUSE.toArray(), door: HOUSE.door.toArray(), h: (x, z) => height(x, z), cx, drop: DROP0.toArray(), arch: [cx(ARCH_Z), hw(ARCH_Z)] };
apply(0); composer.render();
window.READY = true;
