// Estúdio neutro: 3 vistas (frente, 3/4, costas) no mesmo enquadramento da folha de conceito escolhida.
// seek(0) = pose do conceito (marreta de cabeça para baixo) · seek(1) = no ombro · seek(2) = erguida · seek(3) = golpe
import * as THREE from 'three';
const q = new URLSearchParams(location.search), { criaHeroi, RIM } = await import('./heroi.js');
const gl = document.getElementById('c'), W = gl.width, H = gl.height;
const R3 = new THREE.WebGLRenderer({ canvas: gl, antialias: true, preserveDrawingBuffer: true });
R3.setSize(W, H, false); R3.outputColorSpace = THREE.SRGBColorSpace; R3.toneMapping = THREE.ACESFilmicToneMapping; R3.toneMappingExposure = 1.05; R3.shadowMap.enabled = true; R3.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xdcdcde);
const envC = document.createElement('canvas'); envC.width = 1024; envC.height = 512; { const g = envC.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512); [[0, '#ffffff'], [0.38, '#dcdad6'], [0.5, '#a6a6aa'], [0.62, '#9a958e'], [1, '#b8b0a8']].forEach(([p, c]) => gr.addColorStop(p, c)); g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  const box = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); g.fillRect(x - 1024, y, w, h); g.fillRect(x + 1024, y, w, h); };
  box(140, 60, 240, 170, '#ffffff'); box(620, 40, 180, 130, '#fffaf0'); box(860, 150, 120, 150, '#2a2a30'); box(420, 170, 110, 140, '#303036'); box(0, 190, 90, 110, '#f0e8dc'); }
const et = new THREE.CanvasTexture(envC); et.colorSpace = THREE.SRGBColorSpace; et.mapping = THREE.EquirectangularReflectionMapping; scene.environment = new THREE.PMREMGenerator(R3).fromEquirectangular(et).texture;
const key = new THREE.DirectionalLight(0xfff0dc, 3.0); key.position.set(-3, 6, 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2.6, bottom: -0.6, near: 1, far: 20 }); scene.add(key, key.target); key.target.position.set(0, 0.9, 0);
const rim = new THREE.DirectionalLight(0xffc890, 1.6); rim.position.set(4, 3, -4); scene.add(rim);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb0a090, 1.1));
const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0xdcdcde, roughness: 1 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
RIM.col.value.set(0x000000);
const A = criaHeroi(); scene.add(A.root);
const yc = +(q.get('yc') || 0.93), dd = +(q.get('d') || 6.2), fov = +(q.get('fov') || 20);
const cam = new THREE.PerspectiveCamera(fov, (W / 3) / H, 0.1, 50);
const VIEWS = (q.get('v') || '0.0,-0.6,3.1416').split(',').map(Number);
window.seek = async t => { const m = Math.floor(t + 0.001), P = [{ rest: 1, carry: 0 }, { carry: 1 }, { wind: 1, carry: 0, brace: 1 }, { strike: 1, carry: 0, brace: 1 }][m] || { rest: 1, carry: 0 };
  cam.position.set(0, yc + +(q.get("cy") || 0.2), dd); cam.lookAt(0, yc, 0);
  R3.setScissorTest(true);
  VIEWS.forEach((ry, i) => { A.root.rotation.y = ry; A.update(0, P); A.root.updateMatrixWorld(true);
    R3.setViewport(i * W / 3, 0, W / 3, H); R3.setScissor(i * W / 3, 0, W / 3, H); R3.render(scene, cam); });
};
await window.seek(0); window.READY = true;
