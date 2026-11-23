// Gente 3: modelo gerado da arte de conceito pelo Pixal3D (forma + textura PBR; imagem -> malha 3D rodando no ComfyUI), com esqueleto e pesos calculados aqui.
// Mesma pose() do gente.js/gente2.js (sem piscar/boca: o rosto vem da textura). Olha para +z; +x é a esquerda dele.
// criaGente() = Zé; criaGente({ zumbi: true }) = zumbi. Medidas tiradas com malha/mede.py na altura "mh"; tudo é reescalado para "alt".
// 18 ossos: bacia, peito, pescoço, cabeça, (coxa, canela, pé, ponta do pé) x2, (braço, antebraço, mão) x2.
import { THREE, foot, ik, cl, lerp } from './kit3d.js';
import { carregaGLB, normaliza } from './glb.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), ss = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const DEF = {
  ze: { arq: 'malha/ze_p3d', ry: -19.5, mh: 1.8, alt: 1.8, hip: 0.56, hipX: 0.14, zc: -0.065, th: 0.18, sh: 0.18, pesc: [1.17, 1.26], neck: [0, 1.22, -0.06], cint: [0.62, 0.86], dedo: [0.05, 0.12],
    sho: [0.35, 1.03, -0.08], elb: [0.4, 0.8, -0.06], wri: [0.38, 0.545, -0.04], armIn: 0.265, armBand: 0.05, armTop: 0.64, armLow: 0.31, ilha: true, emblema: 1.615, ombro: [0.98, 1.12], passo: 0.6,
    andar: { giro: 0.13, tomba: 0.045, braco: 0.55, bracoBase: 0, cabRola: 0, lean: 0.05, quica: 0.016 } },
  zumbi: { arq: 'malha/zumbi_p3d', ry: 6, mh: 2.25, alt: 2.1, hip: 0.98, hipX: 0.14, zc: -0.27, th: 0.37, sh: 0.41, pesc: [1.55, 1.66], neck: [0, 1.62, -0.24], cint: [1.04, 1.3], dedo: [-0.14, -0.06],
    sho: [0.3, 1.44, -0.28], elb: [0.39, 1.12, -0.26], wri: [0.44, 0.86, -0.17], armIn: 0.225, armBand: 0.07, armTop: 1.3, armLow: 0.3, ilha: true, ombro: [1.38, 1.5], passo: 0.8,
    andar: { giro: 0.1, tomba: 0.1, braco: 0.22, bracoBase: 0.28, cabRola: 0.1, lean: 0.1, quica: 0.01 } } };
const ESC = ['hip', 'hipX', 'zc', 'th', 'sh', 'armIn', 'armBand', 'armTop', 'armLow'], ESCV = ['pesc', 'neck', 'sho', 'elb', 'wri', 'ombro', 'cint', 'dedo'];
const pronto = {}, NB = 18;
async function prepara(k) { if (pronto[k]) return pronto[k]; const D = { ...DEF[k] }, f = D.alt / D.mh; ESC.forEach(n => { if (D[n]) D[n] *= f; }); ESCV.forEach(n => D[n] = D[n].map(v => v * f)); D.ank = D.hip - D.th - D.sh;
  const g = (await carregaGLB(D.arq + '.glb'))[0]; g.deleteAttribute('tangent'); g.rotateY(D.ry * Math.PI / 180); normaliza(g, D.alt); pesos(g, D);
  const ld = async (n, srgb) => { const t = await new THREE.TextureLoader().loadAsync(`${D.arq}_${n}.png`); t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t; };
  const [map, normalMap, roughnessMap, aoMap] = await Promise.all([ld(164, true), ld(226), ld(208), ld(235)]);
  return pronto[k] = { D, g, mat: new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, aoMap, aoMapIntensity: 0.6, metalness: 0, roughness: 1, envMapIntensity: 0.6 }) }; }
const q0 = new URLSearchParams(location.search); if (q0.get('o') !== 'zumbi') await prepara('ze'); if (q0.get('o') === 'zumbi' || !q0.has('o')) await prepara('zumbi');

// Movimento capturado/gerado (JSON do malha/fbx2mov.py, esqueleto SMPL-H): posições e rotações em mundo por quadro.
export async function carregaMov(url) { const M = await (await fetch(url)).json(), n = M.quadros.length, mid = f => { const q = M.quadros[f]; return [(q.L_Hip[0] + q.R_Hip[0]) / 2, (q.L_Hip[1] + q.R_Hip[1]) / 2, (q.L_Hip[2] + q.R_Hip[2]) / 2]; };
  M.n = n; M.dur = (n - 1) / M.fps; M.raiz = Array.from({ length: n }, (_, f) => mid(f)); const R = Math.round(M.fps * 0.6);
  M.media = M.raiz.map((_, f) => { let x = 0, z = 0, k = 0; for (let j = Math.max(0, f - R); j <= Math.min(n - 1, f + R); j++) { x += M.raiz[j][0]; z += M.raiz[j][2]; k++; } return [x / k, z / k]; });  // trajetória alisada (para tocar "no lugar")
  const r = M.repouso, len = (a, b) => Math.hypot(r[a][0] - r[b][0], r[a][1] - r[b][1], r[a][2] - r[b][2]); M.perna = len('L_Hip', 'L_Knee') + len('L_Knee', 'L_Ankle');
  M.chao = Math.min(...M.quadros.map(q => Math.min(q.L_Ankle[1], q.R_Ankle[1]))); return M; }

// tempo em vai-e-vem dentro de [a, b] do movimento (para segurar um gesto além da duração dele sem pulo)
export const vaivem = (M, t, a = 0, b = M.dur) => { const d = b - a, k = ((t % (2 * d)) + 2 * d) % (2 * d); return a + (k < d ? k : 2 * d - k); };
// ossos: 0 bacia, 1 peito, 2 pescoço, 3 cabeça | perna L 4 coxa, 5 canela, 6 pé, 7 ponta | perna R 8..11 | braço L 12 braço, 13 antebraço, 14 mão | braço R 15..17
function pesos(g, D) { const p = g.attributes.position, n = p.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), w = new Float32Array(NB);
  const kn = D.hip - D.th, an = kn - D.sh;
  // ilha: abaixo de armTop o braço pendurado não encosta no corpo, então "braço" = a ilha da malha (pedaço ligado) que contém o pulso.
  // Solda por posição antes (o mapa UV duplica vértices nas costuras) e junta por triângulo com union-find.
  let ilha = null; if (D.ilha) { const id = new Int32Array(n), mp = new Map(), Q = 4000; for (let i = 0; i < n; i++) { const k = Math.round(p.getX(i) * Q) + ',' + Math.round(p.getY(i) * Q) + ',' + Math.round(p.getZ(i) * Q); let v = mp.get(k); if (v === undefined) { v = i; mp.set(k, i); } id[i] = v; }
    const pai = new Int32Array(n).map((_, i) => i), acha = i => { while (pai[i] !== i) { pai[i] = pai[pai[i]]; i = pai[i]; } return i; }, une = (a, b) => { a = acha(a); b = acha(b); if (a !== b) pai[a] = b; };
    const ix = g.index.array; for (let t = 0; t < ix.length; t += 3) { const a = id[ix[t]], b = id[ix[t + 1]], c = id[ix[t + 2]]; if (p.getY(a) < D.armTop && p.getY(b) < D.armTop && p.getY(c) < D.armTop) { une(a, b); une(b, c); } }
    const raiz = new Set(); for (let i = 0; i < n; i++) { const dx = Math.abs(p.getX(i)) - D.wri[0], dy = p.getY(i) - D.wri[1], dz = p.getZ(i) - D.wri[2]; if (dx * dx + dy * dy + dz * dz < 0.004) raiz.add(acha(id[i])); }
    ilha = new Uint8Array(n); for (let i = 0; i < n; i++) ilha[i] = raiz.has(acha(id[i])) ? 1 : 0; }
  for (let i = 0; i < n; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ax = Math.abs(x), L = x > 0; w.fill(0);
    // braço: tudo que está para fora da linha interna do braço, abaixo do ombro
    let wArm = ss(D.armIn - D.armBand * 0.3, D.armIn + D.armBand, ax) * (1 - ss(D.ombro[0], D.ombro[1], y));
    if (ilha) { if (y < D.armTop) wArm = ilha[i]; } else { if (y < D.armTop && ax > D.armIn) wArm = 1; if (y < D.armLow) wArm = 0; }
    const wLeg = (1 - wArm) * (1 - ss(D.hip - 0.06, D.hip + 0.05, y)), tr = Math.max(0, 1 - wArm - wLeg), h = ss(D.pesc[0], D.pesc[1], y), resto = tr * (1 - h) * (1 - h), pe = ss(D.cint[0], D.cint[1], y);
    w[0] = resto * (1 - pe); w[1] = resto * pe; w[2] = tr * 2 * h * (1 - h); w[3] = tr * h * h;
    const a = L ? 4 : 8, sShin = 1 - ss(kn - 0.04, kn + 0.04, y), sFoot = 1 - ss(an - 0.03, an + 0.03, y), sToe = ss(D.dedo[0], D.dedo[1], z);
    w[a] = wLeg * (1 - sShin); w[a + 1] = wLeg * sShin * (1 - sFoot); w[a + 2] = wLeg * sShin * sFoot * (1 - sToe); w[a + 3] = wLeg * sShin * sFoot * sToe;
    const b = L ? 12 : 15, sLo = 1 - ss(D.elb[1] - 0.05, D.elb[1] + 0.05, y), sHa = 1 - ss(D.wri[1] - 0.03, D.wri[1] + 0.02, y);
    w[b] = wArm * (1 - sLo); w[b + 1] = wArm * sLo * (1 - sHa); w[b + 2] = wArm * sLo * sHa;
    let tot = 0; for (let k = 0; k < 4; k++) { let m = -1, mi = 0; for (let j = 0; j < NB; j++) if (w[j] > m) { m = w[j]; mi = j; } si[i * 4 + k] = mi; sw[i * 4 + k] = m; tot += m; w[mi] = -1; }
    for (let k = 0; k < 4; k++) sw[i * 4 + k] /= tot || 1; }
  g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); }

export function criaGente(o = {}) {
  const { D, g, mat } = pronto[o.zumbi ? 'zumbi' : 'ze'], A = D.andar, root = new THREE.Group(), HIP = D.hip, kn = HIP - D.th, an = kn - D.sh;
  const cy = (D.cint[0] + D.cint[1]) / 2, dz = (D.dedo[0] + D.dedo[1]) / 2, m = v => [-v[0], v[1], v[2]];
  // posição de repouso de cada osso (o pivô da junta)
  const rest = [[0, HIP, D.zc], [0, cy, D.zc], [0, D.pesc[0], D.neck[2]], D.neck,
    [D.hipX, HIP, D.zc], [D.hipX, kn, D.zc], [D.hipX, an, D.zc], [D.hipX, 0.045 * D.alt / 1.8, dz], [-D.hipX, HIP, D.zc], [-D.hipX, kn, D.zc], [-D.hipX, an, D.zc], [-D.hipX, 0.045 * D.alt / 1.8, dz],
    D.sho, D.elb, D.wri, m(D.sho), m(D.elb), m(D.wri)].map(a => V(...a));
  const bones = rest.map(r => { const b = new THREE.Bone(); b.position.copy(r); root.add(b); return b; });
  const mesh = new THREE.SkinnedMesh(g, mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; root.add(mesh); root.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones, rest.map(r => new THREE.Matrix4().makeTranslation(-r.x, -r.y, -r.z))), new THREE.Matrix4());
  const DN = V(0, -1, 0), vUp = [1, -1].map(s => V(s * (D.elb[0] - D.sho[0]), D.elb[1] - D.sho[1], D.elb[2] - D.sho[2])), vLo = [1, -1].map(s => V(s * (D.wri[0] - D.elb[0]), D.wri[1] - D.elb[1], D.wri[2] - D.elb[2]));
  const dUp = vUp.map(v => v.clone().normalize()), dLo = vLo.map(v => v.clone().normalize());
  const gira = (v, a, out) => out.set(v.x, v.y * Math.cos(a) + v.z * Math.sin(a), v.z * Math.cos(a) - v.y * Math.sin(a));  // balança no plano y-z (a > 0 = para a frente)
  // objetos de apoio com a mesma cara do gente2 (mão para prender coisas, cabeça, corpo)
  // emblema do boné: a textura gerada perdeu o "Zé"; decalque pequeno preso à cabeça, achado por raio na frente do boné
  if (D.emblema) { const rc = new THREE.Raycaster(V(-0.008, D.emblema * D.alt / D.mh, 2), V(0, 0, -1)), tmp = new THREE.Mesh(g), hit = rc.intersectObject(tmp)[0];
    if (hit) { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const x = cv.getContext('2d'); x.fillStyle = '#6f7d58'; x.font = '600 96px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Zé', 128, 70);
      const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; const s = D.alt / 1.8, dc = new THREE.Mesh(new THREE.PlaneGeometry(0.15 * s, 0.075 * s), new THREE.MeshStandardMaterial({ map: tx, transparent: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4 }));
      const nn = hit.face.normal.clone().normalize(); dc.position.copy(hit.point).addScaledVector(nn, 0.004).sub(rest[3]); dc.lookAt(dc.position.clone().add(nn)); bones[3].add(dc); } }
  const arms = { L: { sx: 1, hand: new THREE.Object3D() }, R: { sx: -1, hand: new THREE.Object3D() } }; bones[14].add(arms.L.hand); bones[17].add(arms.R.hand); arms.L.hand.position.copy(vLo[0]).multiplyScalar(0.3); arms.R.hand.position.copy(vLo[1]).multiplyScalar(0.3);
  const head = bones[3], body = bones[1], q = { k: V(), f: V() }, hip = V(), a = V(), b = V(), c = V(), d = V(), e = new THREE.Euler();
  const pq = new THREE.Quaternion(), cq = new THREE.Quaternion(), hq = new THREE.Quaternion(), nq = new THREE.Quaternion(), fq = new THREE.Quaternion(), tq = new THREE.Quaternion(), X = V(1, 0, 0);
  const preso = (v, i, qq, pos) => v.sub(rest[i]).applyQuaternion(qq).add(pos);  // ponto preso ao osso i -> onde ele está agora
  function pose(p = {}) {
    const t = p.t ?? 0, w = p.walk == null ? 0 : (p.w ?? 1), ph = p.walk ?? 0, tw = ph * 2 * Math.PI, bob = -Math.cos(tw * 2) * A.quica * w, hipY = (p.hipY ?? HIP) + bob, hz = p.hz ?? 0, sw = Math.sin(tw + 0.5) * w, stride = (p.stride ?? 0.62) * D.passo;
    const resp = Math.sin(t * 1.9), parado = 1 - w, lean = (p.lean ?? 0) + A.lean * w, twist = p.twist ?? 0, roll = p.roll ?? 0;
    // bacia: gira com o passo (o quadril da perna da frente avança), tomba para o lado da perna no ar e desloca o peso para a perna de apoio
    const giro = -Math.cos(tw) * A.giro * w, tomba = Math.sin(tw) * A.tomba * w;
    bones[0].position.set(Math.sin(tw) * 0.022 * w + Math.sin(t * 0.8) * 0.006 * parado, hipY, hz + D.zc); pq.setFromEuler(e.set(lean * 0.4, giro + twist * 0.3, tomba + roll * 0.4)); bones[0].quaternion.copy(pq);
    // peito: contra-gira e contra-tomba (ombros opostos ao quadril), respira
    bones[1].position.copy(preso(a.copy(rest[1]), 0, pq, bones[0].position)); cq.setFromEuler(e.set(lean + resp * 0.012, -giro * 0.8 + twist, -tomba * 0.7 + roll)); bones[1].quaternion.copy(cq);
    // cabeça: segue a intenção (lean/twist/head), não o balanço do passo; o pescoço fica no meio do caminho
    const hd = p.head ?? [0, 0, 0]; hq.setFromEuler(e.set(lean + hd[0] + Math.sin(tw * 2 + 0.7) * 0.025 * w - resp * 0.006, twist + hd[1], roll + (hd[2] ?? 0) + Math.sin(tw + 0.4) * A.cabRola * w));
    nq.copy(cq).slerp(hq, 0.5); bones[2].position.copy(preso(a.copy(rest[2]), 1, cq, bones[1].position)); bones[2].quaternion.copy(nq);
    bones[3].position.copy(preso(a.copy(rest[3]), 2, nq, bones[2].position)); bones[3].quaternion.copy(hq);
    // pernas: o quadril sai da bacia já girada
    [1, -1].forEach((sx, i) => { const f = foot((ph + (i ? 0.5 : 0)) % 1, stride), ov = i ? p.footR : p.footL; f.z = lerp(0, f.z, w); f.y *= w; f.a *= w; if (ov) { f.y = ov[0]; f.z = ov[1]; f.a = ov[2] ?? 0; }
      const o = 4 + i * 4; preso(hip.copy(rest[o]), 0, pq, bones[0].position); const fx = sx * D.hipX; a.set(fx, D.ank + f.y, f.z + D.zc); ik(hip, a, D.th, D.sh, q); q.k.x = lerp(hip.x, fx, 0.5); q.f.x = fx;
      bones[o].position.copy(hip); bones[o].quaternion.setFromUnitVectors(DN, d.subVectors(q.k, hip).normalize());
      bones[o + 1].position.copy(q.k); bones[o + 1].quaternion.setFromUnitVectors(DN, d.subVectors(q.f, q.k).normalize());
      fq.setFromEuler(e.set(f.a, 0, 0)); bones[o + 2].position.copy(q.f); bones[o + 2].quaternion.copy(fq);
      // ponta do pé: fica no chão quando o calcanhar sobe
      bones[o + 3].position.copy(preso(a.copy(rest[o + 3]), o + 2, fq, q.f)); bones[o + 3].quaternion.copy(fq).multiply(tq.setFromAxisAngle(X, -Math.max(f.a, 0) * 0.85)); });
    // braços: saem do peito; cotovelo dobra mais indo para a frente; o punho atrasa (solto)
    [['L', 1, 12], ['R', -1, 15]].forEach(([k, sx, o], i) => { const s0 = preso(V().copy(rest[o]), 1, cq, bones[1].position), ov = k === 'L' ? p.armL : p.armR, lado = sx > 0 ? -1 : 1; let flex = (k === 'L' ? p.handL : p.handR) ?? 0;
      if (ov) { d.set(ov[0], ov[1], ov[2]).normalize(); b.copy(s0).addScaledVector(d, vUp[i].length()); d.set(ov[3] - ov[0], ov[4] - ov[1], ov[5] - ov[2]).normalize(); c.copy(b).addScaledVector(d, vLo[i].length()); }  // só a direção: o comprimento é o do nosso braço
      else { const a1 = lado * sw * A.braco + A.bracoBase * w + resp * 0.01, a2 = a1 + (0.12 + Math.max(a1, 0) * 0.7 + A.bracoBase * 0.6) * w + 0.04; b.copy(s0).add(gira(vUp[i], a1, d).applyQuaternion(cq)); c.copy(b).add(gira(vLo[i], a2, d).applyQuaternion(cq)); flex += lado * Math.cos(tw + 0.2) * 0.3 * w; }
      bones[o].position.copy(s0); bones[o].quaternion.setFromUnitVectors(dUp[i], d.subVectors(b, s0).normalize());
      bones[o + 1].position.copy(b); bones[o + 1].quaternion.setFromUnitVectors(dLo[i], d.subVectors(c, b).normalize());
      bones[o + 2].position.copy(c); bones[o + 2].quaternion.copy(bones[o + 1].quaternion).multiply(tq.setFromAxisAngle(X, flex)); });
    root.updateMatrixWorld(true);
  }
  // Toca um movimento capturado no nosso esqueleto. Tronco, cabeça e pés copiam a rotação em mundo; braços e pernas copiam a DIREÇÃO de cada osso
  // (o repouso do movimento é em T e o nosso é de braço caído), e as posições saem das NOSSAS medidas, então a proporção do boneco é preservada.
  // o: { local: true = sem sair do lugar, x0/z0 = origem, head = [x, y, z] gira a cabeça por cima do movimento, dy = sobe/desce a bacia (sentado numa cadeira mais alta), abre = afasta o braço do corpo (rad) }
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), va = V(), vb = V(), MAPA = [['L_Hip', 'L_Knee', 'L_Ankle', 'L_Foot'], ['R_Hip', 'R_Knee', 'R_Ankle', 'R_Foot']], BR = [['L_Shoulder', 'L_Elbow', 'L_Wrist', 'L_Middle1'], ['R_Shoulder', 'R_Elbow', 'R_Wrist', 'R_Middle1']];
  function poseMov(M, ts, o = {}) { const ff = cl(ts * M.fps, 0, M.n - 1.001), f0 = Math.floor(ff), u = ff - f0, A0 = M.quadros[f0], A1 = M.quadros[f0 + 1], s = (D.th + D.sh) / M.perna, abre = o.abre ?? D.abre ?? 0.04;
    const P = (n, out) => out.set(lerp(A0[n][0], A1[n][0], u), lerp(A0[n][1], A1[n][1], u), lerp(A0[n][2], A1[n][2], u)), R = (n, out) => { qa.set(A0[n][3], A0[n][4], A0[n][5], A0[n][6]); qb.set(A1[n][3], A1[n][4], A1[n][5], A1[n][6]); return out.copy(qa).slerp(qb, u); };
    const rx = lerp(M.raiz[f0][0], M.raiz[f0 + 1][0], u), ry = lerp(M.raiz[f0][1], M.raiz[f0 + 1][1], u), rz = lerp(M.raiz[f0][2], M.raiz[f0 + 1][2], u), mx = lerp(M.media[f0][0], M.media[f0 + 1][0], u), mz = lerp(M.media[f0][1], M.media[f0 + 1][1], u);
    const bx = o.local ? rx - mx : rx - M.raiz[0][0], bz = o.local ? rz - mz : rz - M.raiz[0][2];
    bones[0].position.set((o.x0 ?? 0) + bx * s, D.ank + (ry - M.chao) * s + (o.dy ?? 0), (o.z0 ?? 0) + bz * s + D.zc); R('Pelvis', pq); bones[0].quaternion.copy(pq);
    bones[1].position.copy(preso(a.copy(rest[1]), 0, pq, bones[0].position)); R('Spine3', cq); bones[1].quaternion.copy(cq);
    bones[2].position.copy(preso(a.copy(rest[2]), 1, cq, bones[1].position)); R('Neck', nq); bones[2].quaternion.copy(nq);
    bones[3].position.copy(preso(a.copy(rest[3]), 2, nq, bones[2].position)); R('Head', hq); if (o.head) hq.multiply(tq.setFromEuler(e.set(o.head[0], o.head[1], o.head[2] ?? 0))); bones[3].quaternion.copy(hq);
    MAPA.forEach((N, i) => { const o4 = 4 + i * 4; preso(hip.copy(rest[o4]), 0, pq, bones[0].position);
      d.subVectors(P(N[1], va), P(N[0], vb)).normalize(); bones[o4].position.copy(hip); bones[o4].quaternion.setFromUnitVectors(DN, d); b.copy(hip).addScaledVector(d, D.th);
      d.subVectors(P(N[2], va), P(N[1], vb)).normalize(); bones[o4 + 1].position.copy(b); bones[o4 + 1].quaternion.setFromUnitVectors(DN, d); c.copy(b).addScaledVector(d, D.sh);
      R(N[2], fq); bones[o4 + 2].position.copy(c); bones[o4 + 2].quaternion.copy(fq); R(N[3], tq); bones[o4 + 3].position.copy(preso(a.copy(rest[o4 + 3]), o4 + 2, fq, c)); bones[o4 + 3].quaternion.copy(tq); });
    BR.forEach((N, i) => { const o3 = 12 + i * 3, sx = i ? -1 : 1, s0 = preso(V().copy(rest[o3]), 1, cq, bones[1].position), fora = dd => { dd.x += sx * abre * Math.max(0, -dd.y); return dd.normalize(); };
      fora(d.subVectors(P(N[1], va), P(N[0], vb)).normalize()); bones[o3].position.copy(s0); bones[o3].quaternion.setFromUnitVectors(dUp[i], d); b.copy(s0).addScaledVector(d, vUp[i].length());
      fora(d.subVectors(P(N[2], va), P(N[1], vb)).normalize()); bones[o3 + 1].position.copy(b); bones[o3 + 1].quaternion.setFromUnitVectors(dLo[i], d); c.copy(b).addScaledVector(d, vLo[i].length());
      d.subVectors(P(N[3], va), P(N[2], vb)).normalize(); bones[o3 + 2].position.copy(c); bones[o3 + 2].quaternion.setFromUnitVectors(dLo[i], d); });
    root.updateMatrixWorld(true); }
  pose({});
  return { root, pose, poseMov, head, body, arms, eyes: [], mesh, bones };
}
