// level up: anel no chão abre, raios de 1 px sobem do pé, estrelinhas sobem e piscam. Dourado, sem névoa.
import { R, h, estrela, fit, at, clamp, ease } from "./base.mjs";
export const meta = { name: "levelup", duration: 1.8, loop: false, options: { palette: R.ouro, seed: 1 } };
function anel(p, t, C, atras) {
  const u = clamp(t / 0.35); if (u >= 1 || t < 0) return;
  const rx = 4 + 16 * ease.outQuart(u), ry = rx * 0.28, n = Math.round(rx * 7);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2; if (Math.sin(a) < 0 !== atras) continue; if (u > 0.6 && k % 2) continue;
    p.px(Math.round(Math.cos(a) * rx), Math.round(Math.sin(a) * ry), at([C[4], C[3], C[2]], u));
  }
}
export function drawBack(p, t, o) { anel(p, t, fit(o.palette, 5), true); }
export function draw(p, t, o) {
  const C = fit(o.palette, 5), s = o.seed * 53;
  anel(p, t, C, false);
  // raios: cabeça branca sobe rápido; o rabo vem atrás e some de baixo pra cima
  [-9, -5, -1, 3, 7, 11].forEach((x0, i) => {
    const d0 = 0.04 + 0.05 * h(s + i), alt = 30 + 22 * h(s + i * 3), q = t - d0; if (q < 0) return;
    const cab = alt * ease.outCubic(clamp(q / 0.45)), rabo = alt * ease.inQuad(clamp((q - 0.15) / 0.55)); if (rabo >= alt - 0.5) return;
    for (let y = Math.round(rabo); y <= Math.round(cab); y++) { const v = (y - rabo) / Math.max(1, cab - rabo); p.px(x0, -y, v > 0.88 ? C[4] : v > 0.35 ? C[3] : C[2]); }
  });
  // estrelinhas que sobem
  for (let i = 0; i < 7; i++) {
    const d0 = 0.25 + i * 0.12, u = clamp((t - d0) / 0.7); if (u <= 0 || u >= 1) continue;
    const x = (h(s + i * 7) - 0.5) * 30, y = -10 - 26 * h(s + i * 9) - 14 * u;
    if (u > 0.6 && Math.floor(t * 20) % 2) continue;
    estrela(p, x, y, Math.round(Math.sin(u * Math.PI) * 2), C);
  }
}
