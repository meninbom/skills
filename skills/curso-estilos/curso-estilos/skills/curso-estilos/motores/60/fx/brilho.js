// cintilada: estrelinhas de 4 pontas que acendem e apagam em sequência (moeda, pena, logo, carta)
import { R, h, estrela, fit, clamp } from "./base.mjs";
export const meta = { name: "brilho", duration: 1.2, loop: false, options: { palette: R.ouro, n: 3, raio: 8, braco: 3, seed: 1 } };
export function draw(p, t, o) {
  const C = fit(o.palette, 5), s = o.seed * 71;
  for (let i = 0; i < o.n; i++) {
    const d0 = i * 0.11 + 0.05 * h(s + i * 2 + 1), u = clamp((t - d0) / 0.36); if (u <= 0 || u >= 1) continue;
    const a = h(s + i * 3) * Math.PI * 2, r = i === 0 ? 0 : o.raio * (0.4 + 0.6 * h(s + i * 5));
    estrela(p, Math.cos(a) * r, Math.sin(a) * r, Math.round(Math.sin(u * Math.PI) * (i === 0 ? o.braco + 1 : o.braco)), C);
  }
}
