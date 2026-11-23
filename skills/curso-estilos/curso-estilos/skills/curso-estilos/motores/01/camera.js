// Câmera POV dentro do elevador: chaves (t, x, y, z, yaw°, pitch°) + tremida de mão medida da ref do Escorregador.
// yaw 0 = olhando a porta (-z); yaw negativo = vira à direita (painel em x+).
import * as THREE from 'three';
export const END = 15.0;
const K = [
  [0.0, 0.05, 1.62, 0.32, -50, -10],
  [1.5, 0.06, 1.62, 0.3, -46, -7],
  // olha pro display em cima da porta: 9, 10, 11, 12... 13
  [2.15, 0.05, 1.62, 0.3, -12, 14],
  [3.6, 0.04, 1.62, 0.3, -2, 17],
  [4.15, 0.04, 1.62, 0.28, 0, 4],
  // porta abre: o corredor
  [6.4, 0.03, 1.61, 0.12, 0, 0],
  [8.6, 0.02, 1.6, -0.12, 2, -1],
  [10.9, 0.02, 1.6, -0.22, 0, 0],
  [11.1, 0.03, 1.6, -0.18, -4, 0],
  // viradão pro painel: soca o T
  [11.42, 0.1, 1.6, 0.02, -60, -9],
  [12.9, 0.12, 1.6, 0.04, -55, -11],
  // volta pra porta fechando... e a mão
  [13.15, 0.06, 1.61, 0.2, -6, -1],
  [14.2, 0.05, 1.6, 0.34, 0, -3],
  [15.0, 0.05, 1.6, 0.36, 0, -3],
];
const TR = await (await fetch('tremida_ref.json')).json();
function trem(t) { const n = TR.yaw.length, f = ((t * TR.fps) % n + n) % n, i = Math.floor(f), j = (i + 1) % n, u = f - i; return ['yaw', 'pitch', 'roll'].map(k => TR[k][i] * (1 - u) + TR[k][j] * u); }
function cr(p0, p1, p2, p3, u) { const u2 = u * u, u3 = u2 * u; return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3); }
function interp(t) { let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const a = K[Math.max(0, i - 1)], b = K[i], c = K[i + 1], d = K[Math.min(K.length - 1, i + 2)];
  const u = Math.min(1, Math.max(0, (t - b[0]) / (c[0] - b[0]))); return [1, 2, 3, 4, 5].map(j => cr(a[j], b[j], c[j], d[j], u)); }
export function camAt(t) {
  const [x, y, z, yaw, pitch] = interp(t); const [ty, tp, tr] = trem(t + 20);
  // respiração mais curta quando a coisa aparece
  const medo = t > 9.5 ? 1.5 : 1;
  return { pos: new THREE.Vector3(x, y + Math.sin(t * 2.2) * 0.006 * medo, z), yaw: THREE.MathUtils.degToRad(yaw + ty * 0.8 * medo), pitch: THREE.MathUtils.degToRad(pitch + tp * 0.8 * medo), roll: THREE.MathUtils.degToRad(tr * 0.8) };
}
