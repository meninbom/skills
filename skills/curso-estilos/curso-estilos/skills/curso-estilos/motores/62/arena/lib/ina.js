// INA, 9 anos. Silhueta de sino (parka mostarda até o joelho), gorro vermelho de rabo comprido com pompom,
// luvas descasadas (esquerda vermelha dela, direita verde e grande do avô, com remendo), galochas.
// Formas facetadas (flat shading) como no HOUNDKEEPER; contorno de casco + linhas internas (camada 2).
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { toon, comContorno, comLinha } from './toon.js';
import { DIM, V3 } from './esqueleto.js';

export const C = {
  parka: '#d99a2b', parkaEsc: '#b0731c', forro: '#5a3b2a', pelo: '#efe0c2', gorro: '#c9362c', pompom: '#dc4636',
  luvaL: '#c23a2f', luvaR: '#4d7a3c', remendo: '#cfa66a', calca: '#2c3557', bota: '#23252e', solaFaixa: '#e3b23a',
  pele: '#f2b48c', bochecha: '#ff6f61', nariz: '#f39a84', cabelo: '#3b2119', iris: '#26170f', esclera: '#f8f3e8',
  boca: '#6b1f1f', dente: '#fbf6ea', sobr: '#3b2119', toggle: '#8a5530', cinto: '#4a2f22',
};
const OL = 10.0, OLF = 3.5;

function limpa(g) {
  g.deleteAttribute('uv'); g.deleteAttribute('normal');
  const m = mergeVertices(g, 1e-4); m.computeVertexNormals(); return m;
}
function malha(g, cor, o = {}) {
  const m = new THREE.Mesh(g, toon(cor, Object.assign({ flat: o.flat ?? false }, o.mat || {})));
  m.castShadow = o.sombra ?? true; m.receiveShadow = true;
  if (o.ol !== 0) comContorno(m, o.ol ?? OL);
  if (o.linha !== false) comLinha(m);
  return m;
}
// lathe com dobras: amp(y) * sin(N*theta + fase) no raio
function lathe(perfil, segs, o = {}) {
  let g = new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(Math.max(r, 1e-4), y)), segs);
  g = limpa(g);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const th = Math.atan2(x, z);
    let s = 1;
    if (o.N) s += (o.amp ? o.amp(y) : 0.03) * Math.sin(o.N * th + (o.fase || 0)) + (o.amp2 ? o.amp2(y) * Math.sin(o.N2 * th + 1.3) : 0);
    p.setXYZ(i, x * s, y, z * s * (o.escZ || 1));
  }
  g.computeVertexNormals();
  return g;
}
const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function esfera(r, ws, hs, esc = [1, 1, 1]) { let g = new THREE.SphereGeometry(r, ws, hs); g = limpa(g); g.scale(...esc); g.computeVertexNormals(); return g; }
function capsula(r, len, cs = 6, rs = 10) { let g = new THREE.CapsuleGeometry(r, len, cs, rs); g = limpa(g); return g; }
function ruido(g, amp, seed = 1) {
  const p = g.attributes.position; let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647 - 0.5; };
  const cache = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
    if (!cache.has(k)) cache.set(k, 1 + amp * rnd() * 2);
    const f = cache.get(k); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f);
  }
  g.computeVertexNormals(); return g;
}
const naCab = (az, el, r) => V3(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r);

export function criarLampiao() {
  const g = new THREE.Group(); g.name = 'lampiao';
  const lata = '#7d838d';
  const base = malha(lathe([[0, 0], [0.045, 0], [0.048, 0.012], [0.042, 0.02], [0, 0.02]], 8), lata, { ol: 2.2 }); g.add(base);
  const vidro = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.038, 0.075, 8), toon('#ffd08a', { emis: 1.5, emisCor: '#ffb453', rim: 0, grao: 0 }));
  vidro.position.y = 0.058; g.add(vidro); comContorno(vidro, 1.6);
  for (let i = 0; i < 4; i++) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.08, 0.008), toon(lata)); const a = i * Math.PI / 2 + Math.PI / 4; h.position.set(Math.sin(a) * 0.039, 0.058, Math.cos(a) * 0.039); g.add(h); comContorno(h, 1.2); }
  const topo = malha(lathe([[0, 0.1], [0.048, 0.1], [0.05, 0.104], [0.03, 0.13], [0.012, 0.14], [0, 0.142]], 8), lata, { ol: 2.2 }); g.add(topo);
  const alca = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 16, Math.PI), toon('#3a3d44')); alca.position.y = 0.14; g.add(alca); comContorno(alca, 1.2);
  const luz = new THREE.PointLight('#ffb35a', 0.22, 3.5, 2); luz.position.y = 0.06; luz.castShadow = false; g.add(luz);
  g.userData.luz = luz;
  return g;
}

export function criarIna() {
  const raiz = new THREE.Group(); raiz.name = 'ina';
  const J = {};
  const junta = (n) => { const g = new THREE.Group(); g.name = n; raiz.add(g); J[n] = g; return g; };

  // ---------- PELVE: saia do sino da parka (até acima do joelho), forro escuro por dentro, bolsos ----------
  const pel = junta('pelve');
  const ampSaia = (y) => 0.05 * sst(0.0, -0.3, y);
  const perfSaia = [[0.158, 0.10], [0.162, 0.03], [0.172, -0.06], [0.19, -0.15], [0.21, -0.24], [0.222, -0.295], [0.214, -0.31]];
  const saia = malha(lathe(perfSaia, 15, { N: 7, amp: ampSaia, escZ: 0.86, fase: 0.4 }), C.parka); pel.add(saia);
  const forro = new THREE.Mesh(lathe(perfSaia.map(([r, y]) => [r * 0.96, y]), 15, { N: 7, amp: ampSaia, escZ: 0.86, fase: 0.4 }), toon(C.forro, { flat: true, side: THREE.BackSide })); pel.add(forro);
  // barra (faixa mais escura)
  const barra = malha(lathe([[0.214, -0.255], [0.226, -0.27], [0.228, -0.30], [0.217, -0.313]], 15, { N: 7, amp: ampSaia, escZ: 0.86, fase: 0.4 }), C.parkaEsc, { ol: 0 }); pel.add(barra);
  for (const s of [1, -1]) {
    const bolso = malha(new THREE.BoxGeometry(0.085, 0.022, 0.03), C.parkaEsc, { ol: 2.0 });
    bolso.position.set(s * 0.105, -0.11, 0.145); bolso.rotation.set(-0.25, s * 0.5, s * -0.08); pel.add(bolso);
  }
  // ---------- S1: cintura + cinto de couro com fivela ----------
  const s1 = junta('s1');
  s1.add(malha(lathe([[0.156, -0.03], [0.16, 0.04], [0.162, 0.14]], 14, { escZ: 0.84 }), C.parka, { ol: OL }));
  const cinto = malha(lathe([[0.166, 0.0], [0.17, 0.012], [0.17, 0.038], [0.166, 0.05]], 16, { escZ: 0.84 }), C.cinto, { ol: 2.2 }); s1.add(cinto);
  const fivela = malha(new THREE.TorusGeometry(0.018, 0.005, 5, 4), '#c8b07a', { ol: 1.4 }); fivela.position.set(0.05, 0.025, 0.142); fivela.rotation.z = Math.PI / 4; fivela.rotation.y = 0.3; s1.add(fivela);
  // ---------- PEITO: parka de cima, capuz de pelo caído, botões de madeira ----------
  const pe1 = junta('peito');
  pe1.add(malha(lathe([[0.152, -0.13], [0.165, -0.05], [0.172, 0.04], [0.172, 0.1], [0.155, 0.15], [0.11, 0.18], [0.06, 0.195], [0.0, 0.2]], 14, { N: 5, amp: (y) => 0.012, escZ: 0.8 }), C.parka));
  // costura vertical (zíper coberto) + 3 botões de madeira com alça
  const costura = malha(new THREE.BoxGeometry(0.012, 0.3, 0.012), C.parkaEsc, { ol: 0, linha: false }); costura.position.set(0, 0.02, 0.137); costura.rotation.x = -0.05; pe1.add(costura);
  for (const [y, z] of [[-0.05, 0.138], [0.02, 0.14], [0.09, 0.132]]) {
    const b = malha(capsula(0.008, 0.034, 3, 6), C.toggle, { ol: 1.6 }); b.rotation.z = Math.PI / 2; b.position.set(0, y, z + 0.006); pe1.add(b);
  }
  // capuz caído nas costas + gola de pelo
  const capuz = malha(ruido(esfera(0.115, 10, 8, [1.05, 0.72, 0.62]), 0.03, 7), C.parka); capuz.position.set(0, 0.13, -0.135); capuz.rotation.x = 0.35; pe1.add(capuz);
  const golaG = ruido(limpa(new THREE.TorusGeometry(0.098, 0.04, 6, 14)), 0.06, 3);
  const gola = malha(golaG, C.pelo, { ol: 4.0 }); gola.rotation.x = Math.PI / 2 + 0.25; gola.position.set(0, 0.185, -0.02); gola.scale.set(1.05, 0.92, 1); pe1.add(gola);
  // ---------- PESCOÇO ----------
  const pesc = junta('pescoco'); pesc.add(malha(capsula(0.04, 0.04, 2, 8), C.pele, { ol: 0, linha: false }));

  // ---------- CABEÇA ----------
  const cab = junta('cabeca');
  const H = new THREE.Group(); H.position.y = DIM.headC; cab.add(H);
  const R = 0.14;
  const cabG = esfera(R, 18, 14, [1.06, 0.98, 0.97]);
  { // bochechas cheias e queixo pequeno
    const p = cabG.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const lo = sst(0.02, -0.09, y);
      x *= 1 + 0.07 * lo * sst(-0.13, -0.06, y);
      if (y < -0.08) { const k = sst(-0.08, -0.14, y); x *= 1 - 0.18 * k; z *= 1 - 0.06 * k; }
      p.setXYZ(i, x, y, z);
    }
    cabG.computeVertexNormals();
  }
  H.add(malha(cabG, C.pele, { flat: false }));
  // olhos: esclera + íris + brilho + linha de cílio
  const olhos = [];
  for (const s of [1, -1]) {
    const pos = naCab(s * 0.34, 0.0, R * 0.965);
    const o = new THREE.Group(); o.position.copy(pos); o.quaternion.setFromUnitVectors(V3(0, 0, 1), pos.clone().normalize()); H.add(o);
    const scl = malha(esfera(0.031, 14, 10, [0.82, 1.12, 0.42]), C.esclera, { ol: 1.8, flat: false, mat: { rim: 0.2, grao: 0.02 }, sombra: false }); o.add(scl);
    const iris = new THREE.Group(); o.add(iris);
    const ir = malha(esfera(0.021, 12, 10, [0.92, 1.08, 0.45]), C.iris, { ol: 0, flat: false, sombra: false, mat: { rim: 0, grao: 0 } }); ir.position.z = 0.0105; iris.add(ir);
    const br = new THREE.Mesh(new THREE.CircleGeometry(0.0065, 10), new THREE.MeshBasicMaterial({ color: '#ffffff' })); br.position.set(0.006, 0.008, 0.0215); iris.add(br);
    const br2 = new THREE.Mesh(new THREE.CircleGeometry(0.003, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' })); br2.position.set(-0.006, -0.008, 0.0212); iris.add(br2);
    const cil = malha(capsula(0.0045, 0.042, 2, 6), '#2a1712', { ol: 0, linha: false, sombra: false }); cil.rotation.z = Math.PI / 2 + s * 0.12; cil.position.set(s * 0.003, 0.03, 0.007); o.add(cil);
    olhos.push({ g: o, scl, iris, cil, s });
  }
  // sobrancelhas grossas
  const sobr = [];
  for (const s of [1, -1]) {
    const sb = malha(capsula(0.0105, 0.04, 2, 6), C.sobr, { ol: 0, linha: false, sombra: false });
    const base = naCab(s * 0.35, 0.235, R * 1.0); sb.position.copy(base);
    sb.userData = { base: base.clone(), s }; H.add(sb); sobr.push(sb);
  }
  // nariz, sardas, bochechas
  const nariz = malha(esfera(0.019, 8, 6, [1.1, 0.85, 0.85]), C.nariz, { ol: 2.0 }); nariz.position.copy(naCab(0, -0.1, R * 0.975)); H.add(nariz);
  const matSarda = new THREE.MeshBasicMaterial({ color: '#b36a4c', transparent: true, opacity: 0.8 });
  for (const [az, el] of [[0.17, -0.06], [0.22, -0.11], [0.13, -0.13], [-0.17, -0.06], [-0.22, -0.11], [-0.13, -0.13]]) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.0042, 6), matSarda); const p = naCab(az, el, R * 0.992); d.position.copy(p); d.quaternion.setFromUnitVectors(V3(0, 0, 1), p.clone().normalize()); H.add(d);
  }
  const matBoch = new THREE.MeshBasicMaterial({ color: C.bochecha, transparent: true, opacity: 0.5, depthWrite: false });
  for (const s of [1, -1]) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.03, 14), matBoch); const p = naCab(s * 0.55, -0.15, R * 1.004); b.position.copy(p); b.quaternion.setFromUnitVectors(V3(0, 0, 1), p.clone().normalize()); b.scale.set(1.25, 0.8, 1); H.add(b); }
  // boca: 3 formas (sorriso fechado, riso aberto com a janelinha do dente, "O")
  const bocaG = new THREE.Group(); const pB = naCab(0, -0.3, R * 0.985); bocaG.position.copy(pB); bocaG.quaternion.setFromUnitVectors(V3(0, 0, 1), pB.clone().normalize()); H.add(bocaG);
  const matBoca = new THREE.MeshBasicMaterial({ color: C.boca }), matDente = new THREE.MeshBasicMaterial({ color: C.dente }), matLin = new THREE.MeshBasicMaterial({ color: '#2a1010' });
  const forma = (pts) => { const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) sh.lineTo(x, y); return sh; };
  const arco = (n, f) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
  const sorriso = new THREE.Mesh(new THREE.ShapeGeometry(forma([...arco(12, (u) => [-0.03 + 0.06 * u, -0.012 * Math.sin(Math.PI * u) + 0.004 * Math.cos(Math.PI * u) ** 2]), ...arco(12, (u) => [0.03 - 0.06 * u, -0.012 * Math.sin(Math.PI * u) - 0.0045 + 0.004 * Math.cos(Math.PI * u) ** 2 + 0.0045 * Math.cos(Math.PI * u) ** 2])])), matLin);
  const riso = new THREE.Group();
  const risoForma = forma([[-0.034, 0.006], ...arco(16, (u) => [-0.034 + 0.068 * u, 0.006 - 0.036 * Math.sin(Math.PI * u) ** 0.85]), [0.034, 0.006], [0.0, 0.01]]);
  riso.add(new THREE.Mesh(new THREE.ShapeGeometry(risoForma), matBoca));
  const lingua = new THREE.Mesh(new THREE.CircleGeometry(0.016, 12), new THREE.MeshBasicMaterial({ color: '#d2524a' })); lingua.position.set(0.004, -0.024, 0.0004); lingua.scale.set(1.2, 0.55, 1); riso.add(lingua);
  for (const [x0, x1] of [[-0.026, -0.0055], [0.0055, 0.026]]) { // dentes de cima com a janelinha no meio
    const d = new THREE.Mesh(new THREE.ShapeGeometry(forma([[x0, 0.0055], [x1, 0.0055], [x1 - 0.001, -0.004], [x0 + 0.002, -0.0035]])), matDente); d.position.z = 0.0006; riso.add(d);
  }
  const bocaO = new THREE.Mesh(new THREE.CircleGeometry(0.014, 14), matBoca); bocaO.scale.set(0.85, 1.2, 1);
  for (const b of [sorriso, riso, bocaO]) { b.position.z = 0.003; bocaG.add(b); b.visible = false; }
  // cabelo: franja que escapa do gorro + 2 tranças curtas
  const matCab = { mat: { rim: 0.9, rimW: 0.5 } };
  for (const [az, comp, inc] of [[-0.42, 0.07, 0.3], [-0.16, 0.06, 0.1], [0.12, 0.065, -0.1], [0.4, 0.075, -0.3]]) {
    const g = new THREE.ConeGeometry(0.03, comp, 4); g.translate(0, -comp / 2, 0); g.scale(1, 1, 0.45);
    const m = malha(g, C.cabelo, Object.assign({ ol: 2.6 }, matCab)); const p = naCab(az, 0.43, R * 1.02); m.position.copy(p);
    m.rotation.set(-0.35, az, inc); H.add(m);
  }
  const trancas = [];
  for (const s of [1, -1]) {
    const tr = new THREE.Group(); tr.position.copy(naCab(s * 1.42, -0.12, R * 0.98)); H.add(tr);
    for (let i = 0; i < 4; i++) { const b = malha(esfera(0.027 - i * 0.002, 7, 5, [1, 1.25, 0.9]), C.cabelo, Object.assign({ ol: 2.4 }, matCab)); b.position.set(s * 0.004 * i, -0.033 * i, -0.006 * i); b.rotation.z = (i % 2 ? 0.4 : -0.4); tr.add(b); }
    const laco = malha(esfera(0.016, 6, 4, [1.4, 0.8, 1]), C.gorro, { ol: 2.0 }); laco.position.set(s * 0.016, -0.135, -0.024); tr.add(laco);
    const ponta = malha(new THREE.ConeGeometry(0.018, 0.04, 5), C.cabelo, Object.assign({ ol: 2.0 }, matCab)); ponta.rotation.x = Math.PI; ponta.position.set(s * 0.016, -0.16, -0.024); tr.add(ponta);
    trancas.push(tr);
  }
  // gorro de tricô: cúpula canelada + barra dobrada, inclinado para trás
  const gorro = new THREE.Group(); gorro.position.set(0, 0.035, -0.012); gorro.rotation.x = -0.42; H.add(gorro);
  const cup = malha(lathe([[0.15, 0.0], [0.153, 0.04], [0.145, 0.09], [0.12, 0.135], [0.08, 0.165], [0.035, 0.18], [0.0, 0.183]], 22, { N: 11, amp: (y) => 0.025 * (1 - y / 0.19) }), C.gorro); gorro.add(cup);
  const aba = malha(lathe([[0.152, -0.015], [0.162, -0.005], [0.164, 0.035], [0.156, 0.05]], 24, { N: 24, amp: () => 0.028 }), '#b02e25', { ol: 4 }); gorro.add(aba);
  const apice = new THREE.Object3D(); apice.position.set(0, 0.175, -0.01); gorro.add(apice);
  // rabo do gorro (tubo refeito a cada quadro em espaço de mundo) + pompom
  const matRabo = toon(C.gorro, { flat: true });
  const rabo = new THREE.Mesh(new THREE.BufferGeometry(), matRabo); rabo.castShadow = true; raiz.add(rabo); comLinha(rabo);
  const raboOL = comContorno(rabo, 4.0);
  const pompom = malha(ruido(new THREE.IcosahedronGeometry(0.07, 1), 0.12, 11), C.pompom, { ol: 4.5 }); raiz.add(pompom);

  // ---------- BRAÇOS (mangas gomadas), LUVAS DESCASADAS ----------
  const seg = (n, partes) => { const g = junta(n); for (const p of partes) g.add(p); return g; };
  const luvas = {};
  for (const s of ['L', 'R']) {
    const U = DIM.upper, F = DIM.fore;
    const manga = malha(lathe([[0.06, -0.035], [0.072, 0.0], [0.077, 0.045], [0.066, 0.09], [0.072, 0.13], [0.066, U + 0.01], [0.058, U + 0.03]], 11, { N: 4, amp: (y) => 0.015 }), C.parka);
    const ombro = malha(esfera(0.076, 10, 8), C.parka, { ol: OL }); ombro.position.y = 0.005;
    seg('braco' + s, [manga, ombro]);
    const ante = malha(lathe([[0.06, -0.02], [0.065, 0.03], [0.058, 0.07], [0.062, 0.11], [0.056, F - 0.02], [0.05, F]], 11, { N: 4, amp: () => 0.012 }), C.parka);
    const punho = malha(lathe([[0.05, F - 0.03], [0.054, F - 0.025], [0.054, F + 0.005], [0.047, F + 0.01]], 12, { N: 12, amp: () => 0.05 }), C.parkaEsc, { ol: 2.4 });
    seg('antebraco' + s, [ante, punho]);
    // luva: dedos juntos + polegar; a direita é a do avô (maior, verde, remendada)
    const vo = s === 'R', k = vo ? 1.32 : 1.0, cor = vo ? C.luvaR : C.luvaL;
    const mao = new THREE.Group();
    const corpo = malha(esfera(0.047 * k, 10, 8, [0.92, 1.28, 0.66]), cor, { ol: 4.2 }); corpo.position.y = 0.06 * k; mao.add(corpo);
    const pol = malha(capsula(0.017 * k, 0.03 * k, 3, 7), cor, { ol: 3.2 }); pol.position.set(0, 0.045 * k, 0.03 * k); pol.rotation.x = 0.75; mao.add(pol);
    const pulso = malha(lathe([[0.045 * k, -0.005], [0.049 * k, 0.0], [0.049 * k, 0.028 * k], [0.044 * k, 0.034 * k]], 12, { N: 12, amp: () => 0.06 }), vo ? '#3e6631' : '#a53026', { ol: 2.4 }); mao.add(pulso);
    if (vo) { const rem = malha(new THREE.BoxGeometry(0.03, 0.028, 0.012), C.remendo, { ol: 1.6 }); rem.position.set(0.0, 0.075 * k, 0.03 * k); rem.rotation.set(-0.2, 0, 0.2); mao.add(rem);
      for (const dx of [-0.008, 0.008]) { const p = malha(new THREE.BoxGeometry(0.002, 0.012, 0.002), '#5b3a22', { ol: 0, linha: false }); p.position.set(dx, 0.075 * k, 0.037 * k); p.rotation.z = 0.7; mao.add(p); } }
    seg('mao' + s, [mao]); luvas[s] = mao;

    // ---------- PERNAS: calça de neve + galochas ----------
    seg('coxa' + s, [malha(lathe([[0.066, -0.01], [0.068, 0.12], [0.06, DIM.thigh + 0.01]], 10), C.calca, { ol: 4 })]);
    const canela = malha(lathe([[0.058, -0.01], [0.055, 0.1], [0.052, 0.13]], 10), C.calca, { ol: 4 });
    const cano = malha(lathe([[0.071, 0.095], [0.074, 0.105], [0.064, 0.13], [0.058, 0.2], [0.056, DIM.shin + 0.01]], 11), C.bota, { ol: OL, mat: { rim: 0.8 } });
    seg('canela' + s, [canela, cano]);
    const pgG = capsula(0.05, 0.12, 4, 10); pgG.rotateX(Math.PI / 2); pgG.scale(1.0, 0.86, 1.0); pgG.translate(0, 0.044, 0.04); pgG.computeVertexNormals();
    const peM = malha(pgG, C.bota, { ol: OL, mat: { rim: 0.8 } });
    const sola = malha(new THREE.BoxGeometry(0.104, 0.016, 0.225), '#14151a', { ol: 0, linha: false }); sola.position.set(0, 0.008, 0.04);
    const faixa = malha(new THREE.BoxGeometry(0.106, 0.008, 0.227), C.solaFaixa, { ol: 0, linha: false }); faixa.position.set(0, 0.02, 0.04);
    seg('pe' + s, [peM, sola, faixa]);
  }
  raiz.userData = { J, olhos, sobr, bocas: { sorriso, riso, O: bocaO }, rabo, raboOL, pompom, apice, trancas, luvas, H };
  return raiz;
}

const tmpM = new THREE.Matrix4();
function orientar(g, a, b, ref) {
  const y = b.clone().sub(a).normalize();
  let z = ref.clone().sub(y.clone().multiplyScalar(ref.dot(y)));
  if (z.lengthSq() < 1e-6) z = V3(0, 0, 1).sub(y.clone().multiplyScalar(y.z));
  z.normalize();
  const x = y.clone().cross(z);
  tmpM.makeBasis(x, y, z); g.quaternion.setFromRotationMatrix(tmpM); g.position.copy(a);
}

function tuboAfinado(pts, r0, r1, rad = 7) {
  const curva = new THREE.CatmullRomCurve3(pts);
  const g = new THREE.TubeGeometry(curva, 24, 1, rad, false);
  const p = g.attributes.position, n = g.attributes.normal;
  // raio variável: reconstrói a partir do centro da curva
  const segs = 24;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs, c = curva.getPointAt(u), r = r0 + (r1 - r0) * u;
    const nos = 0.12 * Math.sin(u * 40); // tricô caroçudo
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      const nx = n.getX(k), ny = n.getY(k), nz = n.getZ(k);
      p.setXYZ(k, c.x + nx * r * (1 + nos), c.y + ny * r * (1 + nos), c.z + nz * r * (1 + nos));
    }
  }
  g.computeVertexNormals();
  return g;
}

export function aplicarPose(ina, P) {
  const { J, olhos, sobr, bocas, rabo, raboOL, pompom, apice, luvas } = ina.userData;
  J.pelve.position.copy(P.pelve); J.pelve.quaternion.copy(P.qPelve);
  J.s1.position.copy(P.s1); J.s1.quaternion.copy(P.qS1);
  J.peito.position.copy(P.peito); J.peito.quaternion.copy(P.qPeito);
  J.pescoco.position.copy(P.pescoco); J.pescoco.quaternion.copy(P.qPescoco);
  J.cabeca.position.copy(P.cabPivo); J.cabeca.quaternion.copy(P.qCab);
  const fwdC = V3(0, 0, 1).applyQuaternion(P.qPeito);
  for (const s of ['L', 'R']) {
    orientar(J['braco' + s], P['ombro' + s], P['cotovelo' + s], fwdC.clone().negate());
    orientar(J['antebraco' + s], P['cotovelo' + s], P['punho' + s], fwdC.clone().negate());
    const dir = P['punho' + s].clone().sub(P['cotovelo' + s]).normalize();
    orientar(J['mao' + s], P['punho' + s], P['punho' + s].clone().add(dir), fwdC);
    if (P['maoRot' + s]) J['mao' + s].rotateY(P['maoRot' + s]);
    const fwdP = V3(0, 0, 1).applyQuaternion(P['qPe' + s]);
    orientar(J['coxa' + s], P['quadril' + s], P['joelho' + s], fwdP);
    orientar(J['canela' + s], P['joelho' + s], P['tornozelo' + s], fwdP);
    J['pe' + s].quaternion.copy(P['qPe' + s]);
    J['pe' + s].position.copy(P['tornozelo' + s]).sub(V3(0, DIM.ankleH, 0).applyQuaternion(P['qPe' + s]));
  }
  // rosto
  const r = P.rosto;
  for (const o of olhos) {
    const sy = Math.max(0.08, r.olho);
    o.scl.scale.set(1, sy, 1); o.iris.scale.set(1, sy, 1);
    o.iris.position.set(r.olharX * 0.008 * -1, r.olharY * 0.009, 0);
    o.cil.position.y = 0.03 * sy + 0.002;
  }
  for (const sb of sobr) {
    const s = sb.userData.s;
    sb.position.copy(sb.userData.base).add(V3(0, r.sobr, 0));
    sb.rotation.set(0, s * 0.36, Math.PI / 2 + s * (r.sobrInc + 0.08));
  }
  for (const k of Object.keys(bocas)) bocas[k].visible = false;
  const b = bocas[r.boca] || bocas.sorriso; b.visible = true;
  if (r.boca === 'riso') b.scale.set(1, 0.6 + r.bocaAbre, 1);
  // rabo do gorro: pendurado pela gravidade, empurrado por "vento"/inércia (P.gorro.vento em m)
  ina.updateMatrixWorld(true);
  const a0 = apice.getWorldPosition(V3());
  const tras = V3(0, 0, -1).applyQuaternion(J.cabeca.getWorldQuaternion(new THREE.Quaternion()));
  const w = (P.gorro && P.gorro.vento) ? V3(...P.gorro.vento) : V3();
  const a1 = a0.clone().add(tras.clone().multiplyScalar(0.07)).add(V3(0, 0.035, 0)).add(w.clone().multiplyScalar(0.15));
  const a2 = a1.clone().add(tras.clone().multiplyScalar(0.07)).add(V3(0, -0.09, 0)).add(w.clone().multiplyScalar(0.45));
  const a3 = a2.clone().add(tras.clone().multiplyScalar(0.02)).add(V3(0, -0.13, 0)).add(w.clone().multiplyScalar(0.8));
  const a4 = a3.clone().add(V3(0, -0.08, 0)).add(w);
  rabo.geometry.dispose(); rabo.geometry = tuboAfinado([a0, a1, a2, a3, a4], 0.042, 0.016);
  raboOL.geometry = rabo.geometry;
  pompom.position.copy(a4).add(V3(0, -0.04, 0)).add(w.clone().multiplyScalar(0.2));
  pompom.rotation.set(0.3, 0.8, 0.1);
}
