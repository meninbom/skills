// Motor pixel: um buffer de pixels na CPU (Uint32Array), tudo em pixel inteiro. O episódio escolhe o tamanho nativo
// (o "Só mais um baú" usa 135x240) e o FFmpeg amplia no final, sempre por um número inteiro e com vizinho mais próximo.
// Cores = inteiros 32 bits no layout da pixelfx (R no byte baixo), então composite() da pixelfx escreve direto aqui.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { encodePNG } from "./png.mjs";
import { FONTE } from "./fonte.mjs";

// pixelfx (MIT) só é carregada quando um efeito é pedido: await usarPixelfx()
export let PFX = null;
export async function usarPixelfx() { if (!PFX) PFX = await import("../vendor/pixelfx/src/core/index.js"); return PFX; }
export const NW = 180, NH = 320, ESC = 6;
export function hex(h) { let s = h.replace("#", ""); if (s.length === 3) s = [...s].map((c) => c + c).join(""); const v = parseInt(s, 16); return ((255 << 24) | ((v & 255) << 16) | (v & 0xff00) | ((v >> 16) & 255)) >>> 0; }

export class Tela {
  constructor(w = NW, h = NH) {
    this.w = w; this.h = h; this.C = new Uint32Array(w * h);
    this.clip = [0, 0, w, h];
  }
  limpar(c) { this.C.fill(c); }
  px(x, y, c) {
    x |= 0; y |= 0;
    const [cx, cy, cw, ch] = this.clip;
    if (x < cx || y < cy || x >= cx + cw || y >= cy + ch || !c) return;
    this.C[y * this.w + x] = c;
  }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.C[y * this.w + x]; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
  hline(x0, x1, y, c) { for (let x = x0; x <= x1; x++) this.px(x, y, c); }
  vline(x, y0, y1, c) { for (let y = y0; y <= y1; y++) this.px(x, y, c); }
  borda(x, y, w, h, c) { this.hline(x, x + w - 1, y, c); this.hline(x, x + w - 1, y + h - 1, c); this.vline(x, y, y + h - 1, c); this.vline(x + w - 1, y, y + h - 1, c); }
  // dither ordenado 2x2: n = 0..4 pixels de c2 em cada bloco
  dither(x, y, w, h, c1, c2, n) {
    const M = [0, 2, 3, 1];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = x + i, Y = y + j, k = M[(Y & 1) * 2 + (X & 1)];
      this.px(X, Y, k < n ? c2 : c1);
    }
  }
  comClip(x, y, w, h, fn) {
    // interseção com o clip atual
    const o = this.clip, x0 = Math.max(x, o[0]), y0 = Math.max(y, o[1]), x1 = Math.min(x + w, o[0] + o[2]), y1 = Math.min(y + h, o[1] + o[3]);
    this.clip = [x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0)]; try { return fn(); } finally { this.clip = o; }
  }

  /** sprite em strings; pal: letra -> cor. flip espelha. contorno: cor do contorno automático (1 px por fora). */
  sprite(rows, pal, x, y, { flip = false, contorno = 0, troca = null } = {}) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const cel = (i, j) => (j >= 0 && j < h && i >= 0 && i < w && rows[j][i] && rows[j][i] !== "." ? rows[j][i] : null);
    const X = (i) => (flip ? x + w - 1 - i : x + i);
    if (contorno) {
      for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
        if (cel(i, j)) continue;
        if (cel(i - 1, j) || cel(i + 1, j) || cel(i, j - 1) || cel(i, j + 1)) this.px(X(i), y + j, contorno);
      }
    }
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const ch = cel(i, j); if (!ch) continue;
      let c = pal[ch]; if (troca) c = troca(c, ch);
      if (c === undefined) throw new Error("cor sem paleta: " + ch);
      this.px(X(i), y + j, c);
    }
    return { w, h };
  }

  /** texto na fonte da casa. Retorna largura. */
  texto(str, x, y, c, { sombra = 0 } = {}) {
    let cx = x;
    for (const ch of str) {
      const g = FONTE[ch] ?? FONTE["?"];
      if (sombra) desenhaGlifo(this, g, cx + 1, y + 1, sombra);
      desenhaGlifo(this, g, cx, y, c);
      cx += g.w + 1;
    }
    return cx - x - 1;
  }
  larguraTexto(str) { let w = 0; for (const ch of str) w += (FONTE[ch] ?? FONTE["?"]).w + 1; return w - 1; }

  /** efeito da pixelfx no tempo t (simulado em passos de 1/60 desde 0), composto sobre a tela. */
  efeito(mod, opts, t, { camada = null, dt = 1 / 60 } = {}) {
    const fx = PFX.createFx(mod, opts);
    let tt = 0;
    while (tt + 1e-9 < t) { const d = Math.min(dt, t - tt); fx.update(d); tt += d; }
    const f = PFX.createFrame(this.w, this.h, 0, 0);
    if (camada) fx.draw(f, camada); else { fx.draw(f, "back"); fx.draw(f, "front"); }
    this.compor(f);
    return fx;
  }
  compor(f, luz = 1) {
    const out = new Uint8ClampedArray(this.C.buffer);
    const [cx, cy, cw, ch] = this.clip;
    if (cx || cy || cw !== this.w || ch !== this.h) {
      // fora do clip: apaga o que o efeito pintou
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++)
        if (x < cx || y < cy || x >= cx + cw || y >= cy + ch) { f.color[y * this.w + x] = 0; f.light[y * this.w + x] = 0; }
    }
    PFX.composite(f, out, this.C, luz);
    for (let i = 0; i < this.C.length; i++) this.C[i] = (this.C[i] | 0xff000000) >>> 0;
  }
}

function desenhaGlifo(t, g, x, y, c) {
  for (let j = 0; j < g.rows.length; j++) {
    const r = g.rows[j];
    for (let i = 0; i < r.length; i++) if (r[i] === "#") t.px(x + i, y + j + g.dy, c);
  }
}

/** quantiza a região para a paleta (por distância RGB). Usado na direção A depois da pixelfx. */
export function quantizar(t, pal, x = 0, y = 0, w = t.w, h = t.h) {
  const P = pal.map((c) => [c & 255, (c >>> 8) & 255, (c >>> 16) & 255, c]);
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    const c = t.C[j * t.w + i], r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    let best = P[0], bd = 1e9;
    for (const p of P) {
      const lp = 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
      const d = (l - lp) ** 2 * 3 + ((r - p[0]) ** 2 + (g - p[1]) ** 2 + (b - p[2]) ** 2) * 0.15;
      if (d < bd) { bd = d; best = p; }
    }
    t.C[j * t.w + i] = best[3] >>> 0;
  }
}

/** amplia 6x nearest para RGBA bytes 1080x1920. lcd: lista de retângulos nativos com efeito de matriz de pontos. */
export function ampliar(t, { lcd = [] } = {}) {
  const W = t.w * ESC, H = t.h * ESC, out = new Uint8ClampedArray(W * H * 4);
  const ehLcd = new Uint8Array(t.w * t.h);
  for (const [x, y, w, h] of lcd) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) ehLcd[j * t.w + i] = 1;
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) {
    const c = t.C[y * t.w + x], r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255, L = ehLcd[y * t.w + x];
    for (let j = 0; j < ESC; j++) for (let i = 0; i < ESC; i++) {
      const k = ((y * ESC + j) * W + x * ESC + i) * 4;
      // LCD: fresta de 1 px mais escura na borda direita/baixo de cada pixel (tela simulada, não o sprite)
      const f = L && (i === ESC - 1 || j === ESC - 1) ? 0.9 : 1;
      out[k] = r * f; out[k + 1] = g * f; out[k + 2] = b * f; out[k + 3] = 255;
    }
  }
  return { W, H, out };
}

export function salvarPNG(arq, t, op) {
  const { W, H, out } = ampliar(t, op);
  mkdirSync(dirname(arq), { recursive: true });
  writeFileSync(arq, encodePNG(W, H, out));
}
export function salvarNativo(arq, t, k = 1) {
  const W = t.w * k, H = t.h * k, out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = t.C[((y / k) | 0) * t.w + ((x / k) | 0)], o = (y * W + x) * 4;
    out[o] = c & 255; out[o + 1] = (c >>> 8) & 255; out[o + 2] = (c >>> 16) & 255; out[o + 3] = 255;
  }
  mkdirSync(dirname(arq), { recursive: true });
  writeFileSync(arq, encodePNG(W, H, out));
}

// PRNG determinístico
export function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = (n + (n << 3)) | 0; n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; }
