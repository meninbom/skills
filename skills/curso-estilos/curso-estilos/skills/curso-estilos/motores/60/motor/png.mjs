// PNG RGBA 8 bits em node:zlib (sem pacotes).
import { deflateSync } from "node:zlib";
const T = new Int32Array(256);
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; T[n] = c; }
const crc = (b) => { let c = -1; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const bloco = (tipo, d) => { const L = Buffer.alloc(4), corpo = Buffer.concat([Buffer.from(tipo), d]), C = Buffer.alloc(4); L.writeUInt32BE(d.length); C.writeUInt32BE(crc(corpo)); return Buffer.concat([L, corpo, C]); };
export function encodePNG(w, h, rgba) {
  const st = w * 4, raw = Buffer.alloc((st + 1) * h), src = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength);
  for (let y = 0; y < h; y++) { raw[y * (st + 1)] = 0; src.copy(raw, y * (st + 1) + 1, y * st, y * st + st); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloco("IHDR", ih), bloco("IDAT", deflateSync(raw, { level: 6 })), bloco("IEND", Buffer.alloc(0))]);
}
