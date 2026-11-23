// Estúdio neutro: o modelo em 2 vistas (em cima e embaixo) para comparar com a arte de conceito. Abrir com ?pbr=1&o=trator|ze|zumbi
import { THREE } from './kit3d.js';
const q = new URLSearchParams(location.search), o = q.get('o') || 'trator';
const gl = document.getElementById('c'), W = gl.width, H = gl.height;
const R3 = new THREE.WebGLRenderer({ canvas: gl, antialias: true, preserveDrawingBuffer: true });
R3.setSize(W, H, false); R3.outputColorSpace = THREE.SRGBColorSpace; R3.toneMapping = THREE.ACESFilmicToneMapping; R3.toneMappingExposure = 1.05; R3.shadowMap.enabled = true; R3.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xdcdcde);
const envC = document.createElement('canvas'); envC.width = 1024; envC.height = 512; { const g = envC.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512); [[0, '#ffffff'], [0.38, '#dcdad6'], [0.5, '#a6a6aa'], [0.62, '#9a958e'], [1, '#b8b0a8']].forEach(([p, c]) => gr.addColorStop(p, c)); g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  const box = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }; box(140, 60, 240, 170, '#ffffff'); box(620, 40, 180, 130, '#fffaf0'); box(860, 150, 120, 150, '#2a2a30'); box(420, 170, 110, 140, '#303036'); }
const et = new THREE.CanvasTexture(envC); et.colorSpace = THREE.SRGBColorSpace; et.mapping = THREE.EquirectangularReflectionMapping; scene.environment = new THREE.PMREMGenerator(R3).fromEquirectangular(et).texture;
const key = new THREE.DirectionalLight(0xfff0dc, 3.0); key.position.set(-4, 7, 6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -1, near: 1, far: 30 }); scene.add(key, key.target); key.target.position.set(0, 0.9, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb0a090, 1.1));
const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0xdcdcde, roughness: 1 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
let root, cfg;
if (o === 'malha') { const { carregaGLB, normaliza } = await import('./glb.js'); const gs = await carregaGLB(q.get('f')); root = new THREE.Group();
  const tx = q.get('tex'), ld = async (n, srgb) => { const t = await new THREE.TextureLoader().loadAsync(tx + '_' + n + '.png'); t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t; };
  const TM = tx ? new THREE.MeshStandardMaterial({ map: await ld(164, true), normalMap: q.get('sn') ? null : await ld(226), roughnessMap: await ld(208), aoMap: await ld(235), metalness: 0, roughness: 1, envMapIntensity: 0.6 }) : null;
  gs.forEach(g => { g.rotateY(+(q.get('ry') || 0) * Math.PI / 180); normaliza(g, 1.8); const m = new THREE.Mesh(g, TM || new THREE.MeshStandardMaterial({ color: 0xc9c2b8, roughness: 0.75, vertexColors: !!g.attributes.color })); m.castShadow = m.receiveShadow = true; root.add(m); console.log('verts', g.attributes.position.count, 'bbox', JSON.stringify(g.boundingBox)); });
  const v = (q.get('v') || '0,0.8').split(',').map(Number); cfg = q.get('close') ? { yc: 1.42, d: 3.6, up: 0.1, views: v } : { yc: 0.9, d: 7.4, views: v }; }
else if (o === 'trator') { const { criaTrator } = await import('./trator2.js'); root = criaTrator().root; cfg = { yc: 1.2, d: 13.5, views: [0.85, Math.PI - 0.5] }; }
else { const { criaGente } = await import('./' + (q.get('m') || 'gente2') + '.js'); const g = criaGente(o === 'zumbi' ? { zumbi: true } : {}); root = g.root; window.G = g; g.pose({ t: 0, blink: 0 }); cfg = q.get('close') ? { yc: o === 'zumbi' ? 1.75 : 1.5, d: 3.6, up: 0.1, views: [0.0, 0.6] } : { yc: o === "zumbi" ? 1.1 : 0.9, d: o === "zumbi" ? 9.5 : 7.4, views: [0.35, Math.PI + 0.4] }; }
if (q.get('vistas')) cfg.views = q.get('vistas').split(',').map(Number); if (q.get('d')) cfg.d = +q.get('d');
scene.add(root);
const cam = new THREE.PerspectiveCamera(20, W / (H / 2), 0.1, 80);
window.seek = async t => { cam.position.set(0, cfg.yc + (cfg.up ?? 0.9), cfg.d); cam.lookAt(0, cfg.yc, 0); R3.setScissorTest(true);
  const an = q.get('anda'); if (window.G && an === 'mov') { if (!window.MOV) { const { carregaMov } = await import('./' + (q.get('m') || 'gente3') + '.js'); window.MOV = await carregaMov(q.get('mov') || 'mov/anda_aponta.json'); } window.G.poseMov(window.MOV, t, { local: !q.has('anda_de_verdade'), semIK: q.has('semik'), exag: q.has('exag') ? +q.get('exag') : undefined }); } else if (window.G && an) { window.G.pose(an === 'gesto' ? { t, head: [0.1 * Math.sin(t * 6.28), 0.6 * Math.sin(t * 6.28), 0], lean: 0.15 * Math.sin(t * 6.28), twist: 0.3 * Math.sin(t * 6.28), armR: [-0.12, -0.1, 0.16, -0.2 + 0.1 * Math.sin(t * 12.56), 0.12, 0.3], armL: [0.1, -0.22, 0.02, 0.06, -0.3, 0.2] } : { t, walk: t % 1 }); }
  cfg.views.forEach((ry, i) => { root.rotation.y = ry + (an ? 0 : t); root.updateMatrixWorld(true); R3.setViewport(0, (1 - i) * H / 2, W, H / 2); R3.setScissor(0, (1 - i) * H / 2, W, H / 2); R3.render(scene, cam); }); };
await window.seek(0); window.READY = true;
