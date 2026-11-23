// Utilidades de tempo, molas e homografia (robot, CARNE E NEVE).
export const W = 1080, H = 1920;
export const GIZ = '#E8EBEB', LA = '#15171A', ARD = '#46576A';
export const DUR = 45.4;          // voz termina em 44,6; cauda de 0,8 s nos olhos fechados (loop)
export const DUR_C = 46.0;        // v4 fecho c: voz nova termina em ~45,45; o loop corta no movimento da camera

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeInOut = (x: number) => {
  const u = clamp(x);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
};

// mola amortecida (pouso de papel com micro-quique). t em segundos desde o inicio.
export const mola = (t: number, w0 = 22, z = 0.55) => {
  if (t <= 0) return 0;
  const wd = w0 * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * t));
};

// chaves {t, ...valores}: interpolacao por trechos com ease in-out (corte seco quando 'corte' = true na chave)
export type Chave = {t: number; corte?: boolean; [k: string]: number | boolean | undefined};
export const chave = (ks: Chave[], t: number, p: string, def = 0): number => {
  const val = (k: Chave) => (k[p] === undefined ? undefined : (k[p] as number));
  let prev: Chave | undefined;
  for (const k of ks) {
    if (val(k) === undefined) continue;
    if (t < k.t) {
      if (!prev) return val(k)!;
      if (k.corte) return val(prev)!;
      const u = (t - prev.t) / Math.max(1e-6, k.t - prev.t);
      return lerp(val(prev)!, val(k)!, easeInOut(u));
    }
    prev = k;
  }
  return prev ? val(prev)! : def;
};

// punch-in de criador: 3 quadros sobe para 'amt', segura e assenta devagar (nunca volta seco)
export const punch = (t: number, t0: number, amt: number, sobe = 3 / 24, desce = 0.6) => {
  if (t < t0) return 1;
  if (t < t0 + sobe) return lerp(1, amt, easeOut((t - t0) / sobe));
  return lerp(amt, 1 + (amt - 1) * 0.6, easeInOut((t - t0 - sobe) / desce));
};

// homografia: retangulo w x h -> quadrilatero (TL, TR, BR, BL) como CSS matrix3d (transform-origin 0 0)
export type Pt = [number, number];
export const quadMatrix = (w: number, h: number, q: Pt[]) => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  let g = 0, hh = 0;
  if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den;
    hh = (dx1 * sy - sx * dy1) / den;
  }
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3;
  const d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3;
  const A = a / w, B = b / h, D = d / w, E = e / h, G = g / w, HH = hh / h;
  return `matrix3d(${A},${D},0,${G},${B},${E},0,${HH},0,0,1,0,${x0},${y0},0,1)`;
};

// ruido deterministico (sem Math.random: render e seek tem que dar o mesmo quadro)
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
