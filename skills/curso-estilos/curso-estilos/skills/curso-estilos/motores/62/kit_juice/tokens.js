// TOKENS do kit de juice: cores, easing e tempo. Tudo num arquivo só (método harness).
// Tempo: o vídeo é 60 qps; os beats são escritos em QUADROS (q). q(n) converte para segundos.
export const FPS = 60;
export const q = (n) => n / FPS;

export const COR = {
  branco: '#ffffff', tinta: '#141a1a',          // contorno de número / texto
  dano: '#ffffff', fogo: '#ff9a2a', gelo: '#9fe8ff', cura: '#5fe36a', crit: '#ffcf33', veneno: '#b06bff',
  vida: ['#e23447', '#ff7480'], vidaOk: ['#4ccf52', '#9cf58f'], vidaMeio: ['#f0bb25', '#ffe57a'],
  pedaco: '#ffffff', trilho: '#0f2b2a',
  ouro: '#ffc83d', ouroClaro: '#fff2a8', xp: '#7fd8ff', raioX: '#58e6ff', replay: '#ff3b4a',
  hudFundo: 'rgba(12,16,34,0.82)', hudBorda: '#ffd36b',
};

const cl = (x) => Math.min(1, Math.max(0, x));
export const E = {
  lin: (u) => cl(u),
  in2: (u) => cl(u) ** 2, in3: (u) => cl(u) ** 3,
  out2: (u) => 1 - (1 - cl(u)) ** 2, out3: (u) => 1 - (1 - cl(u)) ** 3, out5: (u) => 1 - (1 - cl(u)) ** 5,
  io3: (u) => { u = cl(u); return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2; },
  suave: (u) => { u = cl(u); return u * u * (3 - 2 * u); },
  // passa do alvo e volta (pop)
  outBack: (u, s = 1.9) => { u = cl(u); const c3 = s + 1; return 1 + c3 * (u - 1) ** 3 + s * (u - 1) ** 2; },
  // mola amortecida: 0 → 1 com overshoot (f = oscilações/s, z = amortecimento)
  mola: (t, f = 3, z = 0.35) => (t <= 0 ? 0 : 1 - Math.exp(-z * 2 * Math.PI * f * t) * Math.cos(2 * Math.PI * f * Math.sqrt(1 - z * z) * t)),
  // impulso que decai oscilando (punch/shake): 0 em t=0, pico e volta a 0
  tremor: (t, f = 14, d = 9) => (t <= 0 ? 0 : Math.sin(2 * Math.PI * f * t) * Math.exp(-d * t)),
};
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
// hash determinístico (nada de Math.random)
export const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
