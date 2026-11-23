
// ================= linha do tempo
const TI = 19.0, HS = 0.36;                         // golpe e hit-stop
const ttOf = t => t < TI ? t : t < TI + HS ? TI : t - HS;
const WS = 0.56, ZSTOP = 5.2 - WS * 9.35, ZH = ZSTOP - 2.55, V = 8.4, BT0 = 12.3;               // centro do matacão no golpe, velocidade, quando aparece
// caminhada: z da heroína e distância percorrida
function walkAt(tt) { let z, s, w;
  if (tt < 9.0) { z = 5.2 - WS * tt; s = WS * tt; w = 1; }
  else if (tt < 9.7) { const u = (tt - 9.0) / 0.7, d = WS * 0.7 * (u - u * u / 2); z = 5.2 - WS * 9.0 - d; s = WS * 9.0 + d; w = 1 - ss(u); }
  else { z = 5.2 - WS * 9.0 - WS * 0.35; s = WS * 9.35; w = 0; }
  const z0 = z;
  if (tt > 26.6) { const u = tt - 26.6, d = u < 0.8 ? WS * u * u / 1.6 : WS * (u - 0.4); z = z0 - d; s += d; w = ss(u / 0.6); }
  return { z, ph: s / 0.56, w }; }
// poses: chaves [tempo, nome]; entre chaves, mistura suave (o golpe acelera)
const PK = [[0, 'carry'], [11.5, 'carry'], [12.4, 'ready'], [16.9, 'ready'], [18.25, 'wind'], [18.72, 'wind'], [19.0, 'strike'], [19.45, 'follow'], [20.6, 'follow'], [22.3, 'rest'], [26.2, 'rest'], [27.2, 'carry']];
function poseAt(tt) { const P = { carry: 0, ready: 0, wind: 0, strike: 0, follow: 0, rest: 0 };
  let i = PK.findIndex(k => k[0] > tt); if (i < 0) { P[PK[PK.length - 1][1]] = 1; return P; } if (i === 0) { P[PK[0][1]] = 1; return P; }
  const a = PK[i - 1], b = PK[i]; let u = (tt - a[0]) / (b[0] - a[0]); u = b[1] === 'strike' ? Math.pow(u, 2.2) : ss(u); P[a[1]] += 1 - u; P[b[1]] += u; return P; }
// matacão antes do golpe
function boulderAt(tt) { const zc = ZH - V * (TI - tt), dist = V * (tt - BT0), bounceP = 0.62, bA = 0.55 * Math.exp(-(tt - BT0) * 0.12);
  const b = Math.abs(Math.sin(Math.PI * (tt - BT0) / bounceP)) * bA * (tt > TI - 1.2 ? ss((TI - tt) / 1.2) * 0.6 + 0.4 : 1);
  const x = roadX(zc); return { x, y: hgt(x, zc) + BR * 0.92 + b, z: zc, rot: (zc + 60) / BR }; }

const SHOTS = [
  // 1. abre: a estrada da serra contra o sol baixo; ela pequena, subindo
  { a: 0, b: 4.6, f: (t, u, Wk) => ({ cam: [L3([-2.8, -0.75, 15.5], [-2.1, -0.2, 12.8], ss(u)), [0.6, 1.8, -10]], fov: 34, d: 9, dof: [1.5, 6], fg: 1 }) },
  // 2. acompanha de lado, contra a luz (borda laranja)
  { a: 4.6, b: 8.8, f: (t, u, Wk) => { const y = yRoad(Wk.z); return { cam: [[-2.4 + 0.3 * u, y + 0.75 + 0.15 * u, Wk.z - 1.9 - 0.3 * u], [0.1, y + 1.05, Wk.z - 0.2]], fov: 30, d: 3.4, dof: [5, 5] }; } },
  // 3. botas: pedrinhas descem quicando, ela para
  { a: 8.8, b: 11.0, f: (t, u, Wk) => { const y = yRoad(Wk.z); return { cam: [L3([0.9, y + 0.2, Wk.z - 1.9], [0.7, y + 0.22, Wk.z - 1.6], ss(u)), [0.05, y + 0.28, Wk.z]], fov: 30, d: 1.7, dof: [6, 6] }; } },
  // 4. contra-plongée no elmo: ela olha para cima e firma a marreta
  { a: 11.0, b: 13.3, f: (t, u) => ({ cam: [L3([1.2, 0.5, ZSTOP - 1.6], [1.0, 0.58, ZSTOP - 1.38], ss(u)), [0, 1.55, ZSTOP]], fov: 30, d: 1.9, dof: [6, 5] }) },
  // 5. por cima do ombro: o matacão desce a estrada (lente longa)
  { a: 13.3, b: 16.5, f: (t, u) => ({ cam: [L3([0.3, 1.98, ZSTOP + 2.4], [0.26, 1.92, ZSTOP + 2.15], ss(u)), [-0.3, 2.4, -40]], fov: 28, mid: [3.6, 600], dof: [0, 7], d: 30 }) },
  // 6. atrás dela, baixo, contra a subida: ela ergue a marreta, a pedra cresce vindo na direção da câmera
  { a: 16.5, b: TI + 0.2, f: (t, u) => ({ cam: [L3([0.95, 0.38, ZSTOP + 2.7], [0.72, 0.45, ZSTOP + 2.25], ss(u)), [-0.15, 1.45, ZSTOP - 4]], fov: 32, d: 2.6, dof: [3, 5] }) },
  // 7. depois do golpe, pela frente dela (de cima da estrada): as metades descem pelos dois lados, poeira
  { a: TI + 0.2, b: 23.2, f: (t, u) => ({ cam: [L3([-1.5, 1.25, ZSTOP + 5.8], [-1.25, 1.1, ZSTOP + 5.0], ss(u)), [0.25, 1.0, ZSTOP - 1.2]], fov: 32, d: 5.6, dof: [3, 5], shake: t >= TI + 0.2 ? 0.14 * Math.exp(-(t - TI - 0.2) * 2.6) : 0 }) },
  // 8. giro lento em volta dela; marreta volta ao ombro
  { a: 23.2, b: 26.9, f: (t, u) => { const a = lerp(-0.75, 0.15, ss(u)), r = lerp(2.9, 2.5, u); return { cam: [[Math.sin(a) * r, 1.05, ZSTOP - Math.cos(a) * r], [0, 1.3, ZSTOP]], fov: 30, d: r, dof: [5, 5] }; } },
  // 9. ela segue subindo; a metade da pedra em primeiro plano
  { a: 26.9, b: 31, f: (t, u, Wk) => ({ cam: [L3([0.15, 0.55, ZSTOP + 7.6], [0.08, 0.8, ZSTOP + 6.6], ss(u)), [0, 1.7, Wk.z - 9]], fov: 30, d: 7 + (ZSTOP - Wk.z), mid: [5.2, 60], dof: [2, 6] }) },
];
window.END = 30.5;
function shotAt(t) { const tt = ttOf(t), Wk = walkAt(tt), i = Math.max(0, SHOTS.findIndex(s => t >= s.a && t < s.b)), S = SHOTS[i], u = cl((t - S.a) / (Math.min(S.b, window.END) - S.a));
  const K = { fov: 30, d: 6, dof: [2, 4], seed: i + 1, tt, Wk, ...S.f(t, u, Wk) }, c = K.cam[0]; c[1] = Math.max(c[1], hgt(c[0], c[2]) + 0.18); return K; }
