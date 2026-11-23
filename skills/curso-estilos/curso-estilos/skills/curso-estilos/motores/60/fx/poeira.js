// poeira de chão: bolinhas de terra que saem do pé, sobem um pouco, encolhem. Iluminada de cima, 3 tons.
import { R, h, fit, clamp, ease } from "./base.mjs";
export const meta = { name: "poeira", duration: 1.2, loop: false, options: { palette: R.terra, n: 5, largura: 10, dir: 0, tam: 3, seed: 1 } };
function bola(p, x, y, r, C) {
  x = Math.round(x); y = Math.round(y); r = Math.round(r); if (r <= 0) return;
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    const d = i * i + j * j; if (d > r * r + r * 0.5) continue;
    const luz = -i * 0.4 - j; p.px(x + i, y + j, r === 1 ? C[3] : luz > r * 0.5 ? C[4] : luz > -r * 0.3 ? C[3] : C[2]);
  }
}
export function draw(p, t, o) {
  const C = fit(o.palette, 5), s = o.seed * 131;
  for (let i = 0; i < o.n; i++) {
    const d0 = 0.08 * h(s + i), vida = 0.6 + 0.4 * h(s + i * 3), u = clamp((t - d0) / vida); if (u <= 0 || u >= 1) continue;
    const lado = o.dir || (i % 2 ? 1 : -1), x0 = (h(s + i * 5) - 0.5) * o.largura * 0.5;
    const x = x0 + lado * (4 + o.largura * h(s + i * 7)) * ease.outCubic(u), y = -1 - (3 + 5 * h(s + i * 9)) * ease.outQuad(u);
    const r = o.tam * (0.6 + 0.6 * h(s + i * 11)) * (u < 0.25 ? 0.5 + u * 2 : 1 - (u - 0.25) / 0.75);
    bola(p, x, y, r, C);
  }
}
