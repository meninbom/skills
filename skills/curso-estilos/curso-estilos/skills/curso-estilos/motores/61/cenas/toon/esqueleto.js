// Esqueleto da Ina (19 juntas, mesmo contrato do motor de nosso teste) + construtor de pose estática por IK.
// Na produção, anim.js gera o mesmo objeto P quadro a quadro (pegadas, molas); aqui serve aos quadros-chave.
import * as THREE from 'three';

export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const D2R = Math.PI / 180;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// medidas de criança de 9 anos (~1,30 m com gorro), cabeça grande
export const DIM = {
  hipW: 0.07, hipDown: 0.04, thigh: 0.27, shin: 0.25, ankleH: 0.065, heel: 0.05, toe: 0.13,
  spine1: 0.11, chest: 0.17, neck: 0.035, headC: 0.135, shW: 0.15, shUp: 0.135, upper: 0.18, fore: 0.165,
};

export const DIM_INA = DIM;
// pé em coordenadas de mundo: {pos: V3 (chão sob o tornozelo), yaw (rad), pitch (rad), pivo, alt (m, altura do tornozelo extra)}
export function pePoseMundo(f, DIM) {
  const qy = qYaw(f.yaw), q = qy.clone().multiply(qX(f.pitch || 0));
  const pl = f.pivo === 'ponta' ? V3(0, 0, DIM.toe) : V3(0, 0, -DIM.heel);
  const pw = f.pos.clone().add(pl.clone().applyQuaternion(qy));
  const tornozelo = pw.clone().add(V3(0, DIM.ankleH, 0).sub(pl).applyQuaternion(q)); tornozelo.y += f.alt || 0;
  return { tornozelo, q, yaw: f.yaw };
}
export const qYaw = (a) => new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), a);
export const qX = (a) => new THREE.Quaternion().setFromAxisAngle(V3(1, 0, 0), a);
export const qZ = (a) => new THREE.Quaternion().setFromAxisAngle(V3(0, 0, 1), a);

export function ik2(raiz, alvo, l1, l2, polo) {
  const d = alvo.clone().sub(raiz); const L = d.length();
  const Lc = clamp(L, Math.abs(l1 - l2) + 1e-4, l1 + l2 - 1e-5);
  const dir = d.divideScalar(L || 1);
  const a = (l1 * l1 + Lc * Lc - l2 * l2) / (2 * Lc);
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
  const p = polo.clone().sub(dir.clone().multiplyScalar(polo.dot(dir)));
  if (p.lengthSq() < 1e-8) p.set(0, 0, 1); p.normalize();
  return { meio: raiz.clone().add(dir.clone().multiplyScalar(a)).add(p.multiplyScalar(h)), fim: raiz.clone().add(dir.clone().multiplyScalar(Lc)), erro: L - Lc };
}

// pé: f = {x, z (local ao corpo: +z frente, +x esquerda dela), yaw (graus), pitch (graus, + = ponta para baixo), pivo: 'calc'|'ponta', y}
function pePose(base, yawCorpo, f, DIM) {
  const yaw = yawCorpo + (f.yaw || 0) * D2R;
  const qy = qYaw(yaw), q = qy.clone().multiply(qX((f.pitch || 0) * D2R));
  const chao = base.clone().add(V3(f.x, f.y || 0, f.z).applyQuaternion(qYaw(yawCorpo)));
  const pl = f.pivo === 'ponta' ? V3(0, 0, DIM.toe) : V3(0, 0, -DIM.heel);
  const pw = chao.clone().add(pl.clone().applyQuaternion(qy));
  const tornozelo = pw.clone().add(V3(0, DIM.ankleH, 0).sub(pl).applyQuaternion(q));
  return { tornozelo, q, yaw };
}

/* S = {
  base: V3 (chão sob a pelve), yaw (graus, rumo do corpo), pelve: {y, dx, dz, pitch, roll, yaw},
  tronco: {pitch, roll, yaw}, cab: {yaw, pitch, roll} (relativo ao tronco),
  pes: {L: f, R: f}, maos: {L: [x,y,z], R: [x,y,z]} (relativo ao ombro, no referencial do peito; x+ = esquerda dela),
  polos: {L: [x,y,z], R: [x,y,z]}, rosto: {...}
} */
export function poseEstatica(S, DIM = DIM_INA) {
  const P = {};
  const yawC = (S.yaw || 0) * D2R;
  const pv = S.pelve || {};
  const qP = qYaw(yawC + (pv.yaw || 0) * D2R).multiply(qZ((pv.roll || 0) * D2R)).multiply(qX((pv.pitch || 0) * D2R));
  const pelv = S.base.clone().add(V3(pv.dx || 0, pv.y ?? 0.56, pv.dz || 0).applyQuaternion(qYaw(yawC)));
  P.pelve = pelv; P.qPelve = qP;
  const tr = S.tronco || {};
  const qRel = qYaw((tr.yaw || 0) * 0.5 * D2R).multiply(qZ((tr.roll || 0) * 0.5 * D2R)).multiply(qX((tr.pitch || 0) * 0.5 * D2R));
  const qS1 = qP.clone().multiply(qRel), qC = qS1.clone().multiply(qRel);
  const s1 = pelv.clone().add(V3(0, 0.02, 0).applyQuaternion(qP));
  const peito = s1.clone().add(V3(0, DIM.spine1, 0).applyQuaternion(qS1));
  const pescoco = peito.clone().add(V3(0, DIM.chest, 0).applyQuaternion(qC));
  Object.assign(P, { s1, qS1, peito, qPeito: qC, pescoco });
  const cb = S.cab || {};
  const qH = qC.clone().multiply(qYaw((cb.yaw || 0) * D2R)).multiply(qX((cb.pitch || 0) * D2R)).multiply(qZ((cb.roll || 0) * D2R));
  const qN = qC.clone().slerp(qH, 0.5);
  P.qPescoco = qN; P.cabPivo = pescoco.clone().add(V3(0, DIM.neck, 0).applyQuaternion(qN)); P.qCab = qH;
  P.cabCentro = P.cabPivo.clone().add(V3(0, DIM.headC, 0).applyQuaternion(qH));
  for (const s of ['L', 'R']) {
    const pp = S.pesMundo ? pePoseMundo(S.pesMundo[s], DIM) : pePose(S.base, yawC, S.pes[s], DIM);
    const quadril = pelv.clone().add(V3(s === 'L' ? DIM.hipW : -DIM.hipW, -DIM.hipDown, 0).applyQuaternion(qP));
    const fwd = V3(0, 0, 1).applyQuaternion(qYaw(pp.yaw));
    const polo = fwd.add(V3(s === 'L' ? 0.1 : -0.1, 0.12, 0));
    const r = ik2(quadril, pp.tornozelo, DIM.thigh, DIM.shin, polo);
    P['quadril' + s] = quadril; P['joelho' + s] = r.meio; P['tornozelo' + s] = r.fim; P['qPe' + s] = pp.q; P['erroPerna' + s] = r.erro;
  }
  for (const s of ['L', 'R']) {
    const ombro = peito.clone().add(V3(s === 'L' ? DIM.shW : -DIM.shW, DIM.shUp, 0).applyQuaternion(qC));
    const alvo = ombro.clone().add(V3(...S.maos[s]).applyQuaternion(qC));
    const pol = V3(...((S.polos && S.polos[s]) || [s === 'L' ? 0.4 : -0.4, -0.2, -1])).normalize().applyQuaternion(qC);
    const r = ik2(ombro, alvo, DIM.upper, DIM.fore, pol);
    P['ombro' + s] = ombro; P['cotovelo' + s] = r.meio; P['punho' + s] = r.fim;
    P['maoRot' + s] = S.maoRot ? S.maoRot[s] : null;
  }
  P.rosto = Object.assign({ olho: 1, olharX: 0, olharY: 0, sobr: 0, sobrInc: 0, boca: 'sorriso', bocaAbre: 0.2 }, S.rosto || {});
  P.gorro = S.gorro || null;
  return P;
}
