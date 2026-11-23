// base dos efeitos próprios (formato da pixelfx): cores tiradas do cavaleiro/cenário, rampa dura, sem brilho suave
import { fit, at, clamp, ease } from "../vendor/pixelfx/src/core/index.js";
export { fit, at, clamp, ease };
// contorno do sprite #1a0e13; aço #3a3836 #868273 #c7c7b0; ferrugem #833c22; couro #9f803f
export const R = {
  golpe: ["#1a0e13", "#833c22", "#d08a3a", "#f0d898", "#ffffff"],
  fraco: ["#1a0e13", "#3a3836", "#868273", "#c7c7b0", "#ffffff"],
  ouro: ["#1a0e13", "#833c22", "#c8781e", "#f2c443", "#fff6c8"],
  terra: ["#2a1622", "#412134", "#6a4955", "#9d7053", "#c4a07a"],
};
// pseudo-aleatório determinístico
export function h(n) { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; }
// estrela de 4 pontas em pixel: miolo branco, braços na cor, pontas escuras
export function estrela(p, x, y, braco, C, { diag = 0 } = {}) {
  x = Math.round(x); y = Math.round(y); braco = Math.round(braco);
  if (braco <= 0) return;
  const n = C.length;
  for (let i = 1; i <= braco; i++) {
    const c = i === braco && braco > 1 ? C[n - 3] : i > braco * 0.5 ? C[n - 2] : C[n - 1];
    p.px(x + i, y, c); p.px(x - i, y, c); p.px(x, y + i, c); p.px(x, y - i, c);
  }
  for (let i = 1; i <= diag; i++) { const c = C[n - 2]; p.px(x + i, y + i, c); p.px(x - i, y - i, c); p.px(x + i, y - i, c); p.px(x - i, y + i, c); }
  p.px(x, y, C[n - 1]);
}
