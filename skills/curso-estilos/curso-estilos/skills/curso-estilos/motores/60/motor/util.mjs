// utilitários de cor e texto usados pelas cenas
/** mistura duas cores (inteiros 32 bits, R no byte baixo): k = 0 devolve a, k = 1 devolve b */
export function mistura(a, b, k) {
  const r = (a & 255) * (1 - k) + (b & 255) * k, g = ((a >>> 8) & 255) * (1 - k) + ((b >>> 8) & 255) * k, bb = ((a >>> 16) & 255) * (1 - k) + ((b >>> 16) & 255) * k;
  return ((255 << 24) | ((bb | 0) << 16) | ((g | 0) << 8) | (r | 0)) >>> 0;
}
/** texto na fonte bitmap com contorno de 1 px nas 8 direções */
export function textoBorda(t, s, x, y, cor, borda) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) t.texto(s, x + dx, y + dy, borda);
  t.texto(s, x, y, cor);
}
