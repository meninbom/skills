// Gera as imagens-placeholder do demo em public/ (PNG puro em Node, sem dependencia): um "personagem" (silhueta na luz de janela),
// o recorte dele (matte), uma mesa, um "documento" e 12 quadros de grao. Nada aqui e midia de terceiros.
// uso: node tools/placeholders.mjs   (o demo chama sozinho)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

const PUB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (tipo, dados) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(dados.length);
  const td = Buffer.concat([Buffer.from(tipo), dados]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const b8 = (v) => Math.max(0, Math.min(255, Math.round(v)));
// px(x, y) -> [cinza] | [r, g, b] | [r, g, b, a] (0-255); canais = 1, 3 ou 4
export const png = (arq, w, h, canais, px) => {
  const linha = w * canais + 1;
  const raw = Buffer.alloc(linha * h);
  for (let y = 0; y < h; y++) {
    const o = y * linha;
    raw[o] = 0;                                           // filtro 0 (nenhum)
    for (let x = 0; x < w; x++) {
      const v = px(x, y);
      for (let k = 0; k < canais; k++) raw[o + 1 + x * canais + k] = b8(v[k]);
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = {1: 0, 3: 2, 4: 6}[canais];
  fs.mkdirSync(path.dirname(arq), {recursive: true});
  fs.writeFileSync(arq, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, {level: 6})), chunk('IEND', Buffer.alloc(0))]));
};
// ruido com semente (o demo sai igual em toda maquina)
const rnd = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const mix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
const sm = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

export const gerar = () => {
  const W = 540, H = 960;   // metade do quadro: o demo renderiza em 540x960
  // personagem: cabeca + pescoco + ombros; d < 0 = dentro
  const corpo = (x, y) => {
    const cab = Math.hypot((x - 270) / 118, (y - 470) / 150) - 1;
    const pesc = Math.max(Math.abs(x - 270) / 52, Math.abs(y - 640) / 60) - 1;
    const omb = Math.hypot((x - 270) / 250, (y - 900) / 230) - 1;
    return Math.min(cab, pesc, omb);
  };
  const r1 = rnd(7);
  png(path.join(PUB, 'stills', 'demo_heroi.png'), W, H, 3, (x, y) => {
    const luz = 1.15 - 0.55 * (x / W) - 0.15 * (y / H);                         // janela sempre a esquerda
    let c = mix([58, 74, 94], [28, 36, 48], sm(0, 1, x / W)).map((v) => v * (0.8 + 0.4 * luz));
    const d = corpo(x, y);
    if (d < 0.02) {
      const pele = y < 610 ? [222, 205, 190] : y < 700 ? [205, 186, 170] : [70, 86, 104];   // rosto, pescoco, tricot ardosia
      const sombra = sm(250, 330, x) * 0.55;                                    // lado direito na sombra
      const p = pele.map((v) => v * (1.05 - sombra) * (0.9 + 0.2 * luz));
      c = mix(p, c, sm(-0.02, 0.02, d));
      if (y < 610 && Math.hypot((x - 222) / 20, (y - 455) / 9) < 1) c = [40, 44, 52];        // olhos
      if (y < 610 && Math.hypot((x - 318) / 20, (y - 455) / 9) < 1) c = [30, 33, 40];
    }
    const n = (r1() - 0.5) * 6;
    return c.map((v) => v + n);
  });
  png(path.join(PUB, 'stills', 'demo_heroi_matte.png'), W, H, 4, (x, y) => [255, 255, 255, 255 * (1 - sm(-0.02, 0.02, corpo(x, y)))]);
  const r2 = rnd(11);
  png(path.join(PUB, 'stills', 'demo_mesa.png'), W, H, 3, (x, y) => {
    const veio = Math.sin(y * 0.09 + Math.sin(x * 0.012) * 3) * 7 + Math.sin(y * 0.31 + x * 0.004) * 4;
    const luz = 1.2 - 0.6 * (x / W) - 0.1 * (y / H);
    const tabua = (Math.floor(y / 240) % 2) * 6;
    const n = (r2() - 0.5) * 7;
    return [92 + veio + tabua, 68 + veio * 0.8 + tabua, 50 + veio * 0.6].map((v) => v * (0.55 + 0.5 * luz) + n);
  });
  const r3 = rnd(23);
  png(path.join(PUB, 'docs', 'demo_doc.png'), 400, 500, 3, (x, y) => {
    let c = [232, 226, 210];
    if (x > 40 && x < 360 && y > 40 && y < 230) {                               // "foto" do documento
      c = mix([150, 146, 138], [84, 82, 80], (y - 40) / 190);
      if (Math.hypot((x - 200) / 46, (y - 120) / 56) < 1 || Math.hypot((x - 200) / 100, (y - 240) / 70) < 1) c = [52, 50, 50];
    }
    const lin = Math.floor((y - 262) / 26), dentro = y > 262 && y < 470 && (y - 262) % 26 < 9;
    if (dentro && x > 40 && x < 360 - ((lin * 53) % 120)) c = [70, 66, 62];     // "linhas de texto"
    const n = (r3() - 0.5) * 8;
    return c.map((v) => v + n);
  });
  for (let k = 0; k < 12; k++) {
    const r = rnd(100 + k);
    png(path.join(PUB, 'grao', `g${String(k).padStart(2, '0')}.png`), 270, 480, 1, () => [128 + (r() + r() + r() - 1.5) * 46]);
  }
  return PUB;
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log('placeholders em', gerar());
