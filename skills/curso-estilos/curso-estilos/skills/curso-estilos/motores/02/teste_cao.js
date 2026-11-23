import { THREE, TINT, U } from './kit3d.js';
import { criaCao } from './cao.js';
const W = 1080, H = 1920, c = document.getElementById('c'); const R3 = new THREE.WebGLRenderer({ canvas: c, antialias: true, preserveDrawingBuffer: true }); R3.setSize(W, H, false); R3.setClearColor(0x2a2018); R3.shadowMap.enabled = true;
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 50); cam.position.set(2.6, 1.5, 4.6); cam.lookAt(0.1, 0.1, 0);
const sun = new THREE.DirectionalLight(0xffc890, 3.5); sun.position.set(-3, 4, 3); sun.castShadow = true; scene.add(sun, new THREE.HemisphereLight(0x8090b0, 0x403020, 0.9)); U.shadeDir.value.set(-3, 4, 3).normalize(); TINT.set(1, 0.95, 0.9);
const g = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshLambertMaterial({ color: 0x6a4a30 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
const D = ['pe', 'senta', 'late', 'dorme'].map((m, i) => { const d = criaCao(); d.root.position.set(0, i * 0 , 0); scene.add(d.root); return { d, m, i }; });
window.END = 1; window.seek = async t => { D.forEach(({ d, m, i }) => { d.root.position.set((i % 2) * 1.15 - 0.55, 0, i < 2 ? -0.9 : 0.9); d.root.rotation.y = 0.75; d.pose({ modo: m, t: 0.2, alerta: m === 'late', wag: 1 }); }); R3.render(scene, cam); };
window.seek(0); window.READY = true;
