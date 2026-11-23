// Folha de conferência do Zé: frente, 3/4, lado e costas, em luz neutra.
import { THREE, TINT, U } from './kit3d.js';
import { criaGente } from './gente.js';
const W = 1080, H = 1920, c = document.getElementById('c');
const R3 = new THREE.WebGLRenderer({ canvas: c, antialias: true, preserveDrawingBuffer: true }); R3.setSize(W, H, false); R3.setClearColor(0x2c241c); R3.shadowMap.enabled = true;
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 50);
const sun = new THREE.DirectionalLight(0xffd2a0, 3.2); sun.position.set(-3, 4, 4); sun.castShadow = true; scene.add(sun, new THREE.HemisphereLight(0x8090b0, 0x403020, 0.9));
U.shadeDir.value.set(-3, 4, 4).normalize(); U.rimDir.value.set(3, 1.5, -2).normalize(); TINT.set(1, 0.95, 0.9);
const g = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshLambertMaterial({ color: 0x5a4030 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
const Z = [0, 0.75, Math.PI / 2, Math.PI].map((ry, i) => { const z = criaGente(); z.root.position.set((i % 2) * 1.3 - 0.65, 0, 0); z.root.rotation.y = ry; scene.add(z.root); return z; });
window.END = 2;
window.seek = async t => {
  const close = t >= 1;
  Z.forEach((z, i) => { z.root.visible = close ? i < 2 : true; z.root.position.set(close ? (i ? 0.3 : -0.3) : (i - 1.5) * 0.72, 0, 0); z.root.rotation.y = close ? (i ? 0.7 : 0) : [0, 0.75, Math.PI / 2, Math.PI][i]; z.pose({ t: 0.5, blink: 0 }); });
  if (close) { cam.position.set(0, 1.72, 3.6); cam.lookAt(0, 1.62, 0); } else { cam.position.set(0, 1.5, 9.4); cam.lookAt(0, 1.0, 0); }
  R3.render(scene, cam);
};
window.seek(0); window.READY = true;
