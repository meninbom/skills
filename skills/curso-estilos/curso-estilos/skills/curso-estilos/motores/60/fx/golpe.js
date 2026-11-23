// impacto de golpe: estrela branca no contato (2 quadros), traços que correm pra fora, faíscas que caem.
// forca: 0 = raspão (cinza), 1 = golpe, 2 = crítico (anel + mais faíscas)
import { R, h, estrela, fit, at, clamp, ease } from "./base.mjs";
export const meta = { name: "golpe", duration: 0.6, loop: false, options: { palette: R.golpe, forca: 1, chao: 30, dir: 1, seed: 1 } };
export function draw(p, t, o) {
  const C = fit(o.palette, 5), F = o.forca, A = F === 0 ? 3 : F === 1 ? 5 : 7, s = o.seed * 977;
  // 1) clarão: estrela cheia nos 2 primeiros quadros, depois encolhe
  if (t < 0.07) { estrela(p, 0, 0, A + 1, C, { diag: Math.round(A * 0.5) }); for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) p.px(i, j, C[4]); }
  else if (t < 0.16) estrela(p, 0, 0, Math.round(A * (1 - (t - 0.07) / 0.09)), C);
  // 2) traços radiais: cada um corre pra fora e encurta
  const nT = F === 0 ? 5 : F === 1 ? 7 : 10;
  for (let i = 0; i < nT; i++) {
    const a = (i / nT) * Math.PI * 2 + h(s + i) * 0.5, d0 = 0.02 * h(s + i * 3), u = clamp((t - d0) / (0.22 + 0.08 * h(s + i * 5)));
    if (u <= 0 || u >= 1) continue;
    const r = A * 0.7 + A * (1.2 + h(s + i * 7)) * ease.outCubic(u), L = Math.max(1, Math.round((1 - u) * (F === 2 ? 4 : 3)));
    const c = at([C[4], C[3], C[2], C[1]], u);
    for (let k = 0; k < L; k++) p.px(Math.round(Math.cos(a) * (r - k)), Math.round(Math.sin(a) * (r - k) * 0.85), c);
  }
  // 3) anel do crítico
  if (F === 2 && t > 0.03 && t < 0.24) {
    const u = (t - 0.03) / 0.21, r = A * 0.8 + A * 0.9 * ease.outQuart(u), n = Math.round(r * 8);
    for (let k = 0; k < n; k++) { if (u > 0.6 && k % 2) continue; const a = (k / n) * Math.PI * 2; p.px(Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r * 0.85), at([C[4], C[3], C[2]], u)); }
  }
  // 4) faíscas: saem pro lado do golpe, caem com gravidade, quicam no chão
  const nF = F === 0 ? 2 : F === 1 ? 5 : 9;
  for (let i = 0; i < nF; i++) {
    const vida = 0.3 + 0.25 * h(s + i * 11), q = t - 0.02; if (q < 0 || q > vida) continue;
    const ang = -Math.PI / 2 + o.dir * (0.35 + 1.0 * h(s + i * 13)) - 0.25, v = (70 + 90 * h(s + i * 17)) * (F === 2 ? 1.3 : 1);
    const pos = (tt) => { const k = 6, e = (1 - Math.exp(-k * tt)) / k; const x = Math.cos(ang) * v * e; let y = Math.sin(ang) * v * e + 0.5 * 420 * tt * tt; if (y > o.chao) y = o.chao - (y - o.chao) * 0.3; return [x, y]; };
    const [x, y] = pos(q), [x1, y1] = pos(Math.max(0, q - 0.02)), u = q / vida;
    p.px(Math.round(x), Math.round(y), at([C[4], C[3], C[2], C[1]], u));
    if (u < 0.6) p.px(Math.round((x + x1) / 2), Math.round((y + y1) / 2), at([C[3], C[2], C[1]], u));
  }
}
