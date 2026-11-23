// Demo mínimo do impact frame: dois volumes, um golpe, hit-stop e o impactFrame2 plugado. 3 s, mudo.
// Tudo é função pura do tempo: window.seek(t) desenha o quadro t. Parâmetros da URL: esc (0.5 = 540×960), cor (hex sem #), w e h (tamanho livre do quadro, ex.: w=960&h=540).
import * as THREE from 'three';
import { criarImpactFrame } from './impactFrame2.js';

const Q = new URLSearchParams(location.search);
const ESC = Number(Q.get('esc') || 0.5), PW = Number(Q.get('w')) || Math.round(1080 * ESC), PH = Number(Q.get('h')) || Math.round(1920 * ESC);
const COR = '#' + (Q.get('cor') || 'ffd04a');
const out = document.getElementById('c'); out.width = PW; out.height = PH; const X = out.getContext('2d');
const gl = document.createElement('canvas'); gl.width = PW; gl.height = PH;
const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(PW, PH, false); renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ---------- cena: entardecer, sol baixo, névoa ----------
const scene = new THREE.Scene(); scene.background = new THREE.Color('#5a3a5e'); scene.fog = new THREE.Fog('#5a3a5e', 12, 30);
scene.add(new THREE.HemisphereLight('#aab4ff', '#5a3a4a', 2.4));
const sol = new THREE.DirectionalLight('#ffb070', 3.0); sol.position.set(-4, 3.2, 5); sol.castShadow = true; sol.shadow.mapSize.set(1024, 1024);
Object.assign(sol.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 20 }); scene.add(sol);
const chao = new THREE.Mesh(new THREE.CircleGeometry(14, 48), new THREE.MeshStandardMaterial({ color: '#7a5a70', roughness: 1 })); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; scene.add(chao);
// pedras de fundo (dão escala e profundidade; ficam FORA da máscara do golpe)
const fundo = new THREE.Group(); scene.add(fundo);
for (let i = 0; i < 7; i++) { const h = 1.2 + (i * 37 % 5) * 0.5, m = new THREE.Mesh(new THREE.BoxGeometry(0.9, h, 0.9), new THREE.MeshStandardMaterial({ color: '#4a3558', roughness: 1 }));
  m.position.set(-6 + i * 2 + (i % 2) * 0.4, h / 2, -5 - (i * 53 % 4)); m.rotation.y = i * 0.7; m.castShadow = true; fundo.add(m); }

// volume 1: quem bate (bloco laranja com capuz e um braço-martelo)
const heroi = new THREE.Group(); scene.add(heroi);
const mLar = new THREE.MeshStandardMaterial({ color: '#ff8a3a', roughness: 0.6 }), mEsc = new THREE.MeshStandardMaterial({ color: '#3b2a4a', roughness: 0.8 });
const tronco = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.5), mLar); tronco.position.y = 0.9; heroi.add(tronco);
const capuz = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.7, 4), mEsc); capuz.position.y = 1.72; capuz.rotation.y = Math.PI / 4; heroi.add(capuz);
for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.45, 0.3), mEsc); p.position.set(s * 0.2, 0.22, 0); heroi.add(p); }
const ombro = new THREE.Group(); ombro.position.set(0, 1.25, 0.3); heroi.add(ombro);
const braco = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.2), mLar); braco.position.y = 0.45; ombro.add(braco);
const marreta = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: '#e8e2d6', roughness: 0.4 })); marreta.position.y = 1.0; ombro.add(marreta);
// volume 2: quem apanha (monólito roxo com um olho)
const alvo = new THREE.Group(); scene.add(alvo);
const mono = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.2, 0.9), new THREE.MeshStandardMaterial({ color: '#7a5cff', roughness: 0.5 })); mono.position.y = 1.1; alvo.add(mono);
const olho = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.5), new THREE.MeshBasicMaterial({ color: '#ffe9a8' })); olho.position.set(-0.5, 1.6, 0); alvo.add(olho);
heroi.traverse((o) => { if (o.isMesh) o.castShadow = true; }); alvo.traverse((o) => { if (o.isMesh) o.castShadow = true; });

const cam = new THREE.PerspectiveCamera(40, PW / PH, 0.1, 100);
const IF = criarImpactFrame({ THREE, scene, cam, renderer, gl, out, cor: COR });

// ---------- beats (segundos) ----------
const DUR = 3.0, TI = 1.3, HS = 0.36;                       // impacto em 1,3 s; hit-stop de 0,36 s
const ANTE = 0.55, ATAQUE = 1.05;                           // antecipação até 0,55; avanço 0,55-1,05; golpe 1,05-1,30
const cl = (v) => Math.min(1, Math.max(0, v)), lerp = (a, b, k) => a + (b - a) * k;
const out3 = (k) => 1 - (1 - cl(k)) ** 3, in3 = (k) => cl(k) ** 3, io = (k) => { k = cl(k); return k * k * (3 - 2 * k); };
const IMPACTO = [0.55, 1.5, 0];                             // ponto do impacto no mundo

function quadro(t) {
  const hs = t >= TI && t < TI + HS;                        // mundo congelado?
  const tt = t < TI ? t : hs ? TI : t - HS;                 // tempo de mundo
  const imp = hs && t - TI < 0.2 ? Math.min(11, Math.floor((t - TI) * 60 + 0.001)) : null;    // k do impact frame
  const tremida = t >= TI + 0.2 ? 0.3 * Math.exp(-(t - TI - 0.2) * 3.2) : 0;
  // herói: antecipa para trás, avança, desce a marreta (whip de 5 quadros), follow-through
  let hx, ang, agacha = 0;
  if (tt < ANTE) { const k = out3(tt / ANTE); hx = lerp(-1.7, -1.95, k); ang = lerp(-0.3, -2.2, k); agacha = 0.12 * k; }
  else if (tt < ATAQUE) { const k = in3((tt - ANTE) / (ATAQUE - ANTE)); hx = lerp(-1.95, -0.75, k); ang = -2.2; agacha = 0.12; }
  else if (tt < TI) { const k = in3((tt - ATAQUE) / (TI - ATAQUE)); hx = lerp(-0.75, -0.55, k); ang = lerp(-2.2, 1.35, k); agacha = lerp(0.12, 0.2, k); }
  else { const k = out3((tt - TI) / 0.5); hx = lerp(-0.55, -0.4, k); ang = lerp(1.35, 1.6, k); agacha = lerp(0.2, 0.05, io((tt - TI) / 0.9)); }
  heroi.position.set(hx, -agacha, 0); heroi.rotation.y = Math.PI / 2; ombro.rotation.x = ang;
  // alvo: parado; achatado no hit-stop; depois é empurrado, tomba e assenta
  const u = Math.max(0, tt - TI); const sq = hs ? 0.74 : 1 + 0.18 * Math.exp(-u * 7) * Math.sin(u * 26);
  alvo.position.set(1.0 + 0.9 * (1 - Math.exp(-u * 3.2)), 0, 0); alvo.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
  alvo.rotation.z = -0.5 * (1 - Math.exp(-u * 4)) * Math.exp(-u * 0.9);
  mono.material.emissive.setScalar(u > 0 && u < 0.08 ? 0.9 : 0);                                     // clarão curto no alvo depois do hit-stop
  // câmera: órbita lenta com destino + empurrão na direção do golpe + tremida
  const az = lerp(0.55, 0.2, io(tt / (DUR - HS))), dist = lerp(11, 9.6, io(tt / (DUR - HS)));
  const sx = tremida * Math.sin(t * 61), sy = tremida * Math.cos(t * 47) * 0.6;
  cam.position.set(Math.sin(az) * dist * 0.35 + 0.1 + sx, 1.5 + sy, Math.cos(az) * dist); cam.lookAt(0.1 + sx * 0.5, 1.25, 0); cam.updateMatrixWorld();

  renderer.render(scene, cam);
  X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.globalCompositeOperation = 'source-over'; X.filter = 'none'; X.drawImage(gl, 0, 0);
  if (imp != null) {
    IF.mascara([heroi, alvo]);                                                   // silhueta só de quem participa do golpe
    const [ix, iy] = IF.prj(...IMPACTO), [jx, jy] = IF.prj(IMPACTO[0] + 2, IMPACTO[1] - 0.6, IMPACTO[2]);   // ponto + direção da força
    const dl = Math.hypot(jx - ix, jy - iy) || 1;
    IF.desenhar(imp, ix, iy, (jx - ix) / dl, (jy - iy) / dl);
  }
}

window.DUR = DUR;
window.seek = async (t) => { quadro(t); };
window.probe = () => ({ impacto_s: TI, hitstop_s: HS, impact_frame: { quadros_60qps: 12, desenhos: ['clarao 0-1', 'preto 2-5', 'papel 6-9', 'volta 10-11'] }, tremida_a_partir_de_s: TI + 0.2 });
quadro(0); window.READY = true;
if (!navigator.webdriver) { const t0 = performance.now(); const laco = () => { quadro(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(laco); }; laco(); }   // aberto no navegador: toca em laço
