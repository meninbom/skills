// Gente 4: boneco gerado (Pixal3D) com esqueleto completo de 22 juntas (nomes SMPL) e pele calculada no Blender (malha/rig_blender.py).
// Toca movimento capturado/gerado (HY-Motion, 100STYLE) por RETARGET RELATIVO AO NEUTRO:
//   rotação da junta no boneco = rotação da fonte agora × inverso da rotação da fonte parada e relaxada (N).
// O repouso do nosso boneco já é "parado e relaxado", então ele só recebe a DIFERENÇA para o neutro: mantém a postura e a proporção dele,
// e a torção (antebraço, coxa, pé) vem junto, o que a cópia só da direção do osso perdia.
// Depois: pés presos por IK na posição da fonte (escalada pela perna), sola achatada perto do chão, bacia desce se a perna não alcança.
import { THREE, cl, lerp } from './kit3d.js';
import { carregaGLBRig } from './glb.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), Q = () => new THREE.Quaternion(), ss = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const NOMES = ['Pelvis', 'Spine1', 'Spine2', 'Spine3', 'Neck', 'Head', 'L_Hip', 'L_Knee', 'L_Ankle', 'L_Foot', 'R_Hip', 'R_Knee', 'R_Ankle', 'R_Foot', 'L_Collar', 'L_Shoulder', 'L_Elbow', 'L_Wrist', 'R_Collar', 'R_Shoulder', 'R_Elbow', 'R_Wrist'];
const IX = Object.fromEntries(NOMES.map((n, i) => [n, i])), NB = NOMES.length;
const pronto = {};
export async function prepara(k) { if (pronto[k]) return pronto[k];
  const cfg = await (await fetch(`malha/${k}_juntas.json`)).json(), rig = await (await fetch(cfg.arq + '_rig.json')).json(), { g, si, sw, juntas } = await carregaGLBRig(cfg.arq + '_rig.glb');
  const mapa = juntas.map(n => IX[n]); for (let i = 0; i < si.length; i++) si[i] = mapa[si[i]] ?? 0;
  // vértice que ficou sem peso (o Blender não alcançou): gruda na junta mais próxima, senão ele some para a origem
  { const p = g.attributes.position, js = NOMES.map(n => rig.juntas[n]); let sem = 0; for (let i = 0; i < p.count; i++) { if (sw[i * 4] + sw[i * 4 + 1] + sw[i * 4 + 2] + sw[i * 4 + 3] > 1e-4) continue; sem++; let m = 1e9, mi = 0; for (let j = 0; j < NB; j++) { const d = (p.getX(i) - js[j][0]) ** 2 + (p.getY(i) - js[j][1]) ** 2 + (p.getZ(i) - js[j][2]) ** 2; if (d < m) { m = d; mi = j; } } si[i * 4] = mi; sw[i * 4] = 1; } if (sem) console.log(k, 'sem peso:', sem); }
  g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); g.computeBoundingBox();
  const ld = async (n, srgb) => { const t = await new THREE.TextureLoader().loadAsync(`${cfg.arq}_${n}.png`); t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t; };
  const [map, normalMap, roughnessMap, aoMap] = await Promise.all([ld(164, true), ld(226), ld(208), ld(235)]);
  return pronto[k] = { cfg, rig, g, mat: new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, aoMap, aoMapIntensity: 0.6, metalness: 0, roughness: 1, envMapIntensity: 0.6 }) }; }
const q0 = new URLSearchParams(location.search), QUEM = q0.get('p') || 'ze'; if (q0.get('o') !== 'zumbi') await prepara(QUEM);   // ?p=ze2 escolhe o boneco (malha/<p>_juntas.json) if ((q0.get('o') === 'zumbi' || !q0.has('o')) && q0.get('m') !== 'gente4ze') { try { await prepara('zumbi'); } catch (e) { console.log('zumbi sem rig novo'); } }

// ---------- movimento: JSON do npz2mov.py / bvh2mov.py + referência neutra da MESMA fonte (parado relaxado, de frente para +z)
const refs = {};
async function neutro(url) { if (refs[url]) return refs[url]; const R = await (await fetch(url)).json(), n = R.quadros.length, N = {}, P = {};
  for (const nm of NOMES) { let x = 0, y = 0, z = 0, w = 0, px = 0, py = 0, pz = 0; const a0 = R.quadros[0][nm];
    for (const q of R.quadros) { const a = q[nm], s = a[3] * a0[3] + a[4] * a0[4] + a[5] * a0[5] + a[6] * a0[6] < 0 ? -1 : 1; x += a[3] * s; y += a[4] * s; z += a[5] * s; w += a[6] * s; px += a[0]; py += a[1]; pz += a[2]; }
    N[nm] = new THREE.Quaternion(x, y, z, w).normalize().invert(); P[nm] = V(px / n, py / n, pz / n); }   // N já invertido
  const chao = Math.min(P.L_Ankle.y, P.R_Ankle.y), perna = P.L_Hip.distanceTo(P.L_Knee) + P.L_Knee.distanceTo(P.L_Ankle);
  return refs[url] = { N, P, chao, perna, braco: P.L_Shoulder.distanceTo(P.L_Elbow) + P.L_Elbow.distanceTo(P.L_Wrist), bacia: P.Pelvis.y - chao }; }
export async function carregaMov(url, ref) { const M = await (await fetch(url)).json(); ref = ref || (/_100s/.test(url) ? 'mov2/neutro_100s.json' : 'mov2/neutro_hy.json'); M.ref = await neutro(ref);
  const n = M.quadros.length; M.n = n; M.dur = (n - 1) / M.fps; const R = Math.round(M.fps * 0.6);
  M.media = M.quadros.map((_, f) => { let x = 0, z = 0, k = 0; for (let j = Math.max(0, f - R); j <= Math.min(n - 1, f + R); j++) { x += M.quadros[j].Pelvis[0]; z += M.quadros[j].Pelvis[2]; k++; } return [x / k, z / k]; });
  M.chao = Math.min(...M.quadros.map(q => Math.min(q.L_Ankle[1], q.R_Ankle[1]))); M.mao = /_100s/.test(url) ? 0 : 1; return M; }   // locomoção não tem contato de mão: braço segue a fonte
// gramática de anime de um clipe: por desenho (12/s), qual instante da fonte mostrar (map), peso da antecipação (ant, negativo) rumo a `para`, e onde esticar (sm).
// Energia = velocidade da junta mais rápida em relação à bacia (m/s). Abaixo de LO o corpo "assentou".
export function gramatica(M, LO = 0.12, HI = 1.6) { if (M.gram) return M.gram; const n = M.n, E = new Float32Array(n), nm = NOMES;
  for (let f = 0; f < n - 1; f++) { const A = M.quadros[f], B = M.quadros[f + 1]; let m = 0; for (const k of nm) m = Math.max(m, Math.hypot((B[k][0] - B.Pelvis[0]) - (A[k][0] - A.Pelvis[0]), (B[k][1] - A[k][1]), (B[k][2] - B.Pelvis[2]) - (A[k][2] - A.Pelvis[2]))); E[f] = m * M.fps; } E[n - 1] = E[n - 2];
  const e = t => { const f = cl(Math.round(t * M.fps), 0, n - 1); let s = 0, c = 0; for (let j = Math.max(0, f - 2); j <= Math.min(n - 1, f + 2); j++) { s += E[j]; c++; } return s / c; };
  const K = Math.floor(M.dur * 12) + 1, map = new Float32Array(K), ant = new Float32Array(K), para = new Float32Array(K), sm = new Uint8Array(K); let hold = 0;
  for (let k = 1; k < K; k++) { const t = k / 12, v = e(t); if (hold > 0) { if ((hold >= 6 && v >= LO) || hold >= 12) { map[k] = t; hold = v < LO ? 1 : 0; } else { map[k] = map[k - 1]; hold++; } } else { map[k] = t; if (v < LO) hold = 1; } }
  for (let k = 3; k < K - 1; k++) if (map[k] !== map[k - 1] && map[k - 1] === map[k - 2] && map[k - 2] === map[k - 3]) { let mx = 0; for (let j = k; j < Math.min(K, k + 4); j++) mx = Math.max(mx, e(j / 12)); if (mx > LO * 2.5) { const p = Math.min(M.dur, (k + 3) / 12); ant[k - 1] = -0.22; ant[k - 2] = -0.1; para[k - 1] = para[k - 2] = p; } }
  for (let k = 1; k < K - 1; k++) { const v = e(k / 12); if (v > HI && v >= e((k - 1) / 12) && v > e((k + 1) / 12)) sm[k] = 1; }
  return M.gram = { map, ant, para, sm, E }; }
export const vaivem = (M, t, a = 0, b = M.dur) => { const d = b - a, k = ((t % (2 * d)) + 2 * d) % (2 * d); return a + (k < d ? k : 2 * d - k); };

export function criaGente(o = {}) {
  const { cfg, rig, g, mat } = pronto[o.quem ?? (o.zumbi ? 'zumbi' : QUEM)], root = new THREE.Group(), rest = NOMES.map(n => V(...rig.juntas[n])), pai = NOMES.map(n => rig.pai[n] ? IX[rig.pai[n]] : -1);
  const bones = rest.map(r => { const b = new THREE.Bone(); b.position.copy(r); root.add(b); return b; });   // ossos "soltos": cada um recebe posição e rotação em mundo (do boneco)
  const mesh = new THREE.SkinnedMesh(g, mat); mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; root.add(mesh); root.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones, rest.map(r => new THREE.Matrix4().makeTranslation(-r.x, -r.y, -r.z))), new THREE.Matrix4());
  const off = rest.map((r, i) => pai[i] < 0 ? V() : r.clone().sub(rest[pai[i]]));   // deslocamento de cada junta em relação ao pai, no repouso
  const perna = rest[IX.L_Hip].distanceTo(rest[IX.L_Knee]) + rest[IX.L_Knee].distanceTo(rest[IX.L_Ankle]);
  const braco = rest[IX.L_Shoulder].distanceTo(rest[IX.L_Elbow]) + rest[IX.L_Elbow].distanceTo(rest[IX.L_Wrist]);
  const hand = { L: new THREE.Object3D(), R: new THREE.Object3D() }; bones[IX.L_Wrist].add(hand.L); bones[IX.R_Wrist].add(hand.R); hand.L.position.set(0, -0.06 * cfg.alt / 1.8, 0); hand.R.position.copy(hand.L.position);
  const qa = Q(), qb = Q(), qt = Q(), qy = Q(), va = V(), vb = V(), vc = V(), vd = V(), ve = V(), UP = V(0, 1, 0), e = new THREE.Euler(), qs = bones.map(() => Q()), ps = bones.map(() => V());
  const yawSo = (q, out) => { va.set(0, 0, 1).applyQuaternion(q); return out.setFromAxisAngle(UP, Math.atan2(va.x, va.z)); };
  // o: local (sem sair do lugar), x0/z0, dy, head [x,y,z] por cima, semIK, semChao
  // em2: pose "em dois" (12 desenhos/s, timing de anime); o deslocamento no chão continua contínuo para a câmera não trepidar.
  // gram: em dois + gramática de anime: PAUSA (assentou = segura a pose ≥6 desenhos), ANTECIPAÇÃO (2 desenhos para o lado contrário antes de sair da pausa),
  //       ESTICADA (1 desenho com o antebraço esticado entre a pose anterior e a nova no pico de velocidade; forma, não blur).
  const snap = () => bones.map(b => [b.position.clone(), b.quaternion.clone()]);
  function poseMov(M, ts, o = {}) { if (o.em2 || o.gram) { const o2 = { ...o, em2: false, gram: false }; let tq = Math.floor(ts * 12 + 1e-6) / 12; for (const L of 'LR') bones[IX[L + '_Wrist']].scale.setScalar(1);
      if (o.gram) { const G = gramatica(M), k = cl(Math.floor(ts * 12 + 1e-6), 0, G.map.length - 1); tq = G.map[k];
        if (G.ant[k]) { poseMov(M, G.para[k], o2); const B = snap(); poseMov(M, tq, o2); const w = G.ant[k]; for (let i = 0; i < NB; i++) { if (i >= IX.L_Hip && i <= IX.R_Foot) continue; const b = bones[i]; b.position.lerp(B[i][0], w * (i === 0 ? 0.5 : 1)); b.quaternion.slerp(B[i][1], w).normalize(); } }
        else if (G.sm[k] && k > 0 && M.mao) { poseMov(M, G.map[k - 1], o2); const A = snap(); poseMov(M, tq, o2); for (const L of 'LR') { const iE = IX[L + '_Elbow'], iW = IX[L + '_Wrist']; if (bones[iW].position.distanceTo(A[iW][0]) > 0.16 * cfg.alt / 1.8) { bones[iE].position.lerp(A[iE][0], 0.6); bones[iW].scale.setScalar(1.3); } } }
        else poseMov(M, tq, o2); }
      else poseMov(M, tq, o2);
      if (!o.local) { const s2 = perna / M.ref.perna, g = t => { const ff = cl(t * M.fps, 0, M.n - 1.001), f0 = Math.floor(ff), u = ff - f0; return [lerp(M.quadros[f0].Pelvis[0], M.quadros[f0 + 1].Pelvis[0], u), lerp(M.quadros[f0].Pelvis[2], M.quadros[f0 + 1].Pelvis[2], u)]; }, p1 = g(ts), p0 = g(tq); for (const b of bones) { b.position.x += (p1[0] - p0[0]) * s2; b.position.z += (p1[1] - p0[1]) * s2; } }
      root.updateMatrixWorld(true); return; }
    const F = M.ref, ff = cl(ts * M.fps, 0, M.n - 1.001), f0 = Math.floor(ff), u = ff - f0, A0 = M.quadros[f0], A1 = M.quadros[f0 + 1], s = perna / F.perna;
    const P = (n, out) => out.set(lerp(A0[n][0], A1[n][0], u), lerp(A0[n][1], A1[n][1], u), lerp(A0[n][2], A1[n][2], u));
    // 1) rotação de cada junta relativa ao neutro da fonte
    for (let i = 0; i < NB; i++) { const n = NOMES[i]; qa.set(A0[n][3], A0[n][4], A0[n][5], A0[n][6]); qb.set(A1[n][3], A1[n][4], A1[n][5], A1[n][6]); qs[i].copy(qa).slerp(qb, u).multiply(F.N[n]); }
    // exagero: personagem de perna curta e cabeça grande "engole" o movimento humano; amplia o ângulo de cada junta em relação ao neutro (menos a bacia, que carrega o rumo)
    const ex = o.exag ?? cfg.exag ?? 1; if (ex !== 1) for (let i = 1; i < NB; i++) { const q = qs[i]; if (q.w < 0) { q.x = -q.x; q.y = -q.y; q.z = -q.z; q.w = -q.w; } const sn = Math.hypot(q.x, q.y, q.z); if (sn < 1e-6) continue; const an = 2 * Math.atan2(sn, q.w), k = (i === IX.Head || i === IX.Neck) ? 1 + (ex - 1) * 0.3 : ex, a2 = Math.min(an * k, 2.9) / 2, f = Math.sin(a2) / sn; q.set(q.x * f, q.y * f, q.z * f, Math.cos(a2)); }
    if (o.head) qs[IX.Head].multiply(qt.setFromEuler(e.set(o.head[0], o.head[1], o.head[2] ?? 0)));
    // 2) bacia: deslocamento escalado pela perna; altura = repouso + (quanto a fonte subiu/desceu em relação ao neutro)
    P('Pelvis', va); const mx = lerp(M.media[f0][0], M.media[f0 + 1][0], u), mz = lerp(M.media[f0][1], M.media[f0 + 1][1], u), bx = o.local ? va.x - mx : va.x - M.quadros[0].Pelvis[0], bz = o.local ? va.z - mz : va.z - M.quadros[0].Pelvis[2];
    const base = ps[0].set((o.x0 ?? 0) + bx * s, rest[0].y + ((va.y - M.chao) - F.bacia) * s + (o.dy ?? 0), (o.z0 ?? 0) + bz * s + rest[0].z); const srcPel = vd.copy(va);
    const fk = () => { for (let i = 1; i < NB; i++) ps[i].copy(off[i]).applyQuaternion(qs[pai[i]]).add(ps[pai[i]]); };
    fk();
    // 3) pés: alvo = onde o tornozelo da fonte está em relação à bacia dela, escalado, mais a diferença de largura de quadril (que gira com a bacia)
    if (!o.semIK) { const alvo = [V(), V()]; yawSo(qs[0], qy); let desce = 0;
      ['L', 'R'].forEach((L, k) => { const iA = IX[L + '_Ankle'], iH = IX[L + '_Hip']; P(L + '_Ankle', va); const nA = F.P[L + '_Ankle'], nP = F.P.Pelvis;
        vb.set(rest[iA].x - rest[0].x - (nA.x - nP.x) * s, 0, rest[iA].z - rest[0].z - (nA.z - nP.z) * s).applyQuaternion(qy);   // diferença de proporção no repouso
        const exp = 1 + (ex - 1) * 0.8; alvo[k].set(base.x + (va.x - srcPel.x - (nA.x - nP.x)) * s * exp + (nA.x - nP.x) * s + vb.x, Math.max(rest[iA].y, rest[iA].y + ((va.y - M.chao) - (nA.y - F.chao)) * s * exp) + (o.dy ?? 0) * (o.sentado ? 1 : 0), base.z + (va.z - srcPel.z - (nA.z - nP.z)) * s * exp + (nA.z - nP.z) * s + vb.z);
        if (o.semChao) alvo[k].y = rest[iA].y + ((va.y - M.chao) - (nA.y - F.chao)) * s + (o.dy ?? 0);
        desce = Math.max(desce, alvo[k].distanceTo(ps[iH]) - perna * 0.998); });
      if (desce > 0) { base.y -= desce; fk(); }   // perna não alcança: a bacia desce (em vez de o pé flutuar)
      ['L', 'R'].forEach((L, k) => { const iH = IX[L + '_Hip'], iK = IX[L + '_Knee'], iA = IX[L + '_Ankle'], iF = IX[L + '_Foot'], h = ps[iH], l1 = off[iK].length(), l2 = off[iA].length();
        const ax = va.subVectors(alvo[k], h), D = cl(ax.length(), 1e-4, (l1 + l2) * 0.9995); ax.normalize();
        const pole = vb.subVectors(ps[iK], h); pole.addScaledVector(ax, -pole.dot(ax)); if (pole.lengthSq() < 1e-8) pole.set(0, 0, 1).applyQuaternion(qs[iH]); pole.normalize();
        const cA = cl((l1 * l1 + D * D - l2 * l2) / (2 * l1 * D), -1, 1), sA = Math.sqrt(1 - cA * cA), k1 = vc.copy(h).addScaledVector(ax, cA * l1).addScaledVector(pole, sA * l1), a1 = ve.copy(h).addScaledVector(ax, D);
        qt.setFromUnitVectors(vd.subVectors(ps[iK], h).normalize(), va.subVectors(k1, h).normalize()); qs[iH].premultiply(qt);
        qt.setFromUnitVectors(vd.subVectors(ps[iA], ps[iK]).normalize(), va.subVectors(a1, k1).normalize()); qs[iK].premultiply(qt);
        ps[iK].copy(k1); ps[iA].copy(a1);
        // sola: perto do chão o pé fica plano (só o giro em torno do eixo de cima); no ar segue a fonte
        const w = 1 - ss(0.0, 0.05 * cfg.alt / 1.8, a1.y - rest[iA].y - (o.sentado ? (o.dy ?? 0) : 0)); if (w > 0 && !o.semChao) { yawSo(qs[iA], qt); qs[iA].slerp(qt, w * 0.85); yawSo(qs[iF], qt); qs[iF].slerp(qt, w * 0.6); }
        ps[iF].copy(off[iF]).applyQuaternion(qs[iA]).add(a1); }); }
    // 4) mãos: perto do corpo (cintura, peito, rosto) a mão vai para onde a fonte encostou, medido em relação às âncoras do corpo, e não para onde a rotação do braço levaria (proporção diferente = mão no ar)
    if (!o.semMao) { const AN = ['Pelvis', 'Spine3', 'Head', 'L_Hip', 'R_Hip'], ka = braco / F.braco;
      ['L', 'R'].forEach(L => { const iS = IX[L + '_Shoulder'], iE = IX[L + '_Elbow'], iW = IX[L + '_Wrist']; P(L + '_Wrist', va); let sw = 0, dm = 1e9; vc.set(0, 0, 0);
        for (const a of AN) { P(a, vb); vb.subVectors(va, vb); const d = vb.length(), w = 1 / (d * d + 0.004); dm = Math.min(dm, d); vc.addScaledVector(ps[IX[a]], w).addScaledVector(vb, w * ka); sw += w; }
        const gk = (1 - ss(0.28, 0.5, dm)) * (o.mao ?? M.mao ?? 1); if (gk < 0.01) return; const T = vc.multiplyScalar(1 / sw).lerp(ps[iW], 1 - gk), h = ps[iS], l1 = off[iE].length(), l2 = off[iW].length();
        const ax = va.subVectors(T, h), D = cl(ax.length(), 1e-4, (l1 + l2) * 0.9995); ax.normalize();
        const pole = vb.subVectors(ps[iE], h); pole.addScaledVector(ax, -pole.dot(ax)); if (pole.lengthSq() < 1e-8) pole.set(0, 0, -1).applyQuaternion(qs[iS]); pole.normalize();
        const cA = cl((l1 * l1 + D * D - l2 * l2) / (2 * l1 * D), -1, 1), sA = Math.sqrt(1 - cA * cA), k1 = ve.copy(h).addScaledVector(ax, cA * l1).addScaledVector(pole, sA * l1), a1 = vd.copy(h).addScaledVector(ax, D);
        qt.setFromUnitVectors(va.subVectors(ps[iE], h).normalize(), vb.subVectors(k1, h).normalize()); qs[iS].premultiply(qt);
        qt.setFromUnitVectors(va.subVectors(ps[iW], ps[iE]).normalize(), vb.subVectors(a1, k1).normalize()); qs[iE].premultiply(qt);
        ps[iE].copy(k1); ps[iW].copy(a1); }); }
    for (let i = 0; i < NB; i++) { bones[i].position.copy(ps[i]); bones[i].quaternion.copy(qs[i]); }
    root.updateMatrixWorld(true); }
  const pose = () => { for (let i = 0; i < NB; i++) { bones[i].position.copy(rest[i]); bones[i].quaternion.identity(); } root.updateMatrixWorld(true); };   // repouso (a pose dirigida à mão ainda mora no gente3)
  return { root, pose, poseMov, hand, arms: { L: { hand: hand.L }, R: { hand: hand.R } }, head: bones[IX.Head], body: bones[IX.Spine3], mesh, bones, eyes: [], IX };
}
