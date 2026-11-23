// Timeline of the bridge short: shots timed to the the voice words (~/bridge-short/voice/words.json),
// story physics (column position, march phase, deck bounce, collapse) and the camera grammar measured in the
// reference study: continuous slow push-ins; symmetric ease-in-out moves ~23 f (10 in / 10 out), peak ~15 px/f at 720p;
// big reframes are cuts; impacts are 7-frame kicks that flip sign every frame; no hand-held float.
export const FPS = 30;
export const TOTAL = 825; // balao: 27.5 s (voice 27.1 s)
export const D0 = 6.0; // bank top + deck height (m)
export const HALF = 27; // towers at z = +-27, span 54 m
export const FILES = [-1.65, -0.55, 0.55, 1.65];
export const ROW_GAP = 1.3;
export const COUNT = 74;
export const PARK: V3 = [70, D0, -75]; // swing pivot base (x, ground y, z)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
const lin = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
};

// ---------------- story physics (tau = story time in seconds) ----------------
export const front = (tau: number) => 26 - 1.6 * (tau - 4.4); // z of the front row, marching toward -z
export const marchPhase = (tau: number) => ((tau % 1) + 1) % 1; // 1 Hz cycle = 2 steps/s, footfalls at 0 and 0.5
export const SNAP = 34.62, DROP0 = 36.35, DROP1 = 36.95;
export const amp = (tau: number) =>
  lin([[14.85, 0], [17.8, 0.07], [21.4, 0.13], [27.4, 0.26], [33.0, 0.46], [SNAP, 0.55], [SNAP + 0.35, 0.0]], tau);
export const stomp = (tau: number) => lin([[21.4, 1.0], [27.4, 1.35], [33, 1.5]], tau); // "a little harder every step"
export const shapeZ = (z: number) => (Math.abs(z) < HALF ? Math.cos((Math.PI * z) / (2 * HALF)) : 0);
export const dropW = (z: number) => smooth((20 - z) / 26); // 1 on the near half, 0 at the far tower
export const dropU = (tau: number) => (tau < DROP0 ? 0 : Math.min(1, ((tau - DROP0) / (DROP1 - DROP0)) ** 2));
export const DROP_H = 6.6;

export type BridgeState = { bounce: number; drop: number; snap: number; collapsed: boolean };
export const deckY = (z: number, b: BridgeState) => D0 + b.bounce * shapeZ(z) - b.drop * DROP_H * dropW(z);

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Crowd = "march" | "fall" | "water" | "bank" | "tourists" | "none";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };
// balao ("Os primeiros passageiros"): word onsets from balao/voice/words.json (s)
// 0.00 Os primeiros | 2.68 ovelha | 3.58 pato | 4.28 galo | 4.90 É 1783 | 7.44 Versalhes | 8.46 rei | 10.48 lá em cima
// 11.42 Os irmãos | 11.94 acendem palha | 14.18 o ar quente | 15.08 enche | 15.82 e os três | 16.32 sobem | 17.48 corte
// 18.68 Oito minutos | 20.06 pousam | 20.60 bosque | 21.40 Vivos | 22.20 O único | 23.50 galo | 23.92 Pelo visto | 25.78 ovelha | 26.16 pisou
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 147, light: "day", crowd: "none", tau: (t) => t },
  { id: 2, a: 147, b: 343, light: "day", crowd: "none", tau: (t) => t },
  { id: 3, a: 343, b: 475, light: "day", crowd: "none", tau: (t) => t },
  { id: 4, a: 475, b: 561, light: "day", crowd: "none", tau: (t) => t },
  { id: 5, a: 561, b: 666, light: "day", crowd: "none", tau: (t) => t },
  { id: 6, a: 666, b: TOTAL, light: "day", crowd: "none", tau: (t) => t },
];
export const XFADE: Record<number, number> = { 5: 8 };
export const FLASH_AT = 147;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** the town bridge just stands there in this short */
export const bridgeState = (_id: number, _t: number): BridgeState => ({ bounce: 0, drop: 0, snap: 0, collapsed: false });

// ---------------- balloon ----------------
/** launch pad in the park (the "Versailles" garden) and the landing clearing in the woods */
export const PAD: V3 = [70, D0, -75];
export const LAND: V3 = [-160, D0, -160];
export const T_LIFT = 15.9, T_TOUCH = 20.42, T_VIVOS = 21.4, T_PISOU = 26.16;
export type BalloonState = { at: V3; lift: number; inflate: number; tilt: number; fire: number };
export const balloonAt = (id: number, t: number): BalloonState => {
  if (id === 1) return { at: PAD, lift: 38 + 0.6 * t, inflate: 1, tilt: 0.02 * Math.sin(t * 1.3), fire: 0 };
  if (id === 2) return { at: PAD, lift: 0, inflate: 0, tilt: 0, fire: 0 };
  if (id === 3) return { at: PAD, lift: 0, inflate: smooth((t - 14.1) / 1.5), tilt: 0, fire: clamp01((t - 12.0) / 0.4) };
  if (id === 4) { const u = Math.max(0, t - T_LIFT); return { at: PAD, lift: 2.6 * u * u, inflate: 1, tilt: 0.03 * Math.sin(t * 2), fire: clamp01(1 - u) }; }
  // landing: eases down onto the clearing, touches on "pousam", then the empty envelope sags over
  const down = 9 * (1 - smooth((t - 18.6) / (T_TOUCH - 18.6)));
  const sag = smooth((t - T_TOUCH - 0.1) / 1.3);
  if (id === 5) return { at: LAND, lift: Math.max(0, down), inflate: 1 - 0.62 * sag, tilt: 0.5 * sag, fire: 0 };
  return { at: LAND, lift: 0, inflate: 0.38, tilt: 0.5, fire: 0 };
};
/** top of the basket floor (where the passengers stand) */
export const basketFloor = (b: BalloonState): V3 => [b.at[0], b.at[1] + b.lift + 0.12, b.at[2]];

// ---------------- camera ----------------
// Grammar (motion.md): every move is a symmetric smootherstep glide of 18-40 f (peak speed = 1.875 x distance / dur,
// so dur >= 0.075 x the move in 720p px keeps the peak near the reference 14-25 px/f); a reframe bigger than about
// half a frame width or 40 % zoom is a hard cut on its key frame. Glides are centred on the old key frame (the
// whoosh in the sound mix peaks there), so a glide key starts dur/2 earlier. Holds push in (dolly toward the look
// point or a fov zoom near walls/towers): 0.15-0.35 %/f, ~0.6 %/f for ~35 f on the punch words. Rolls of 4-8 deg
// over >= 18 f on emphasis beats, held tilt <= 0.07 rad.
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
/** reference camera ease: symmetric smootherstep (attack = release, ~10 f each on a 23 f move) */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;
/** push-in factor since f0: the subject grows ~rate per frame; `punch` raises it (with 8 f soft edges) for the first n frames */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** dolly push: camera slides toward the look point by factor k */
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** zoom push (camera stays put, for lenses next to towers / houses): tan(fov/2) shrinks by k */
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
/** a roll-only move on top of an existing framing */
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

// near-left anchorage where the bolt lives, and the free end of the snapped backstay
export const ANCHOR: V3 = [-2.7, D0 + 0.62, -37];
export const snapEnd = (snap: number): V3 => {
  const u = easeOut(snap);
  return [ANCHOR[0] - 0.6 * u, ANCHOR[1] + 5.5 * u - 2.0 * u * u, ANCHOR[2] + 4.5 * u];
};

// ---- framings (f -> camera) ----
const B1 = (f: number) => basketFloor(balloonAt(1, T(f)));
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
// the town lies north-west of the pad: lenses sit south-east of the subject so the town fills the background
const S1a = (f: number) => { const b = B1(f); return dolly(add(b, [9, 2.5, -9.5]), add(b, [0, 5.5, 0]), pushK(f, 0, 0.002), { fov: 46 }); };
const S1b = (f: number) => { const b = B1(f); return dolly(add(b, [3.1, 0.82, -3.3]), add(b, [0, 0.66, 0]), pushK(f, 52, 0.0025), { fov: 40, roll: -0.03 }); };
const S1c = (f: number) => { const b = B1(f); return dolly(add(b, [2.45, 0.8, -2.6]), add(b, [0.05, 0.66, 0]), pushK(f, 118, 0.003), { fov: 38, roll: 0.04 }); };
// shot 2: garden wide over the crowd -> the king (cut on "rei") -> tilt up on "lá em cima"
export const KING: V3 = [66.2, D0, -69.8];
const S2a = (f: number) => zoom([55, D0 + 6.5, -58.5], [70, D0 + 2.5, -75], 46, pushK(f, 147, 0.0018));
const S2b = (f: number) => dolly([KING[0] - 2.2, D0 + 1.75, KING[2] + 3.6], [KING[0] + 0.5, D0 + 1.55, KING[2] - 0.8], pushK(f, 252, 0.0025), { fov: 38, roll: 0.03 });
const S2c = (f: number) => dolly([KING[0] - 2.4, D0 + 1.35, KING[2] + 3.9], [70, D0 + 9.5, -75], pushK(f, 312, 0.002), { fov: 46, roll: -0.02 });
// shot 3: low MS of the brothers at the fire -> low wide up at the envelope filling (cut on "o ar quente")
const S3a = (f: number) => dolly([70.35, D0 + 1.1, -66.4], [70.1, D0 + 0.95, -73], pushK(f, 343, 0.0025, 0.006, 30), { fov: 40 });
const S3b = (f: number) => dolly([63.5, D0 + 1.1, -63], [70, D0 + 7.5, -75], pushK(f, 424, 0.002), { fov: 50, roll: 0.04 });
// shot 4: behind the cheering court, the lens tilts up after the rising basket
const S4a = (f: number): Shot => { const b = balloonAt(4, T(f)); return { pos: [58.5, D0 + 1.7, -63], look: [70, D0 + 3.5 + b.lift * 0.85, -75], fov: 50 - 0.02 * (f - 475), roll: -0.03 }; };
// shot 5: the clearing in the woods, wide -> basket MS on "Vivos"
const S5a = (f: number) => dolly(add(LAND, [8.5, 2.4, 9.5]), add(LAND, [0, 4.2, 0]), pushK(f, 557, 0.002), { fov: 46 });
const S5b = (f: number) => dolly(add(LAND, [1.9, 1.35, 3.7]), add(LAND, [0, 0.85, 0]), pushK(f, 640, 0.003, 0.006, 20), { fov: 38, roll: 0.03 });
// shot 6: on the grass: rooster CU ("galo"), then the sheep two-shot ("Pelo visto ... pisou")
const S6a = (f: number) => dolly(add(LAND, [1.45, 0.72, 4.6]), add(LAND, [1.1, 0.36, 1.45]), pushK(f, 666, 0.002, 0.006, 30), { fov: 36 });
const S6b = (f: number) => dolly(add(LAND, [0.55, 0.95, 5.5]), add(LAND, [0.65, 0.5, 1.35]), pushK(f, 745, 0.0025), { fov: 40, roll: -0.04 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 52, dur: 34, s: S1b }, { f: 118, dur: 24, s: S1c }],
  2: [{ f: 147, s: S2a }, { f: 252, cut: true, s: S2b }, { f: 306, dur: 30, s: S2c }],
  3: [{ f: 343, s: S3a }, { f: 424, cut: true, s: S3b }],
  4: [{ f: 475, s: S4a }],
  5: [{ f: 557, s: S5a }, { f: 640, cut: true, s: S5b }],
  6: [{ f: 666, s: S6a }, { f: 742, dur: 26, s: S6b }],
};
const KICKS: [number, number][] = [[T_TOUCH, 1.2], [T_PISOU, 1.0]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
export const keyEnd = (id: number, f: number) => {
  let e = 0;
  for (const k of CAMS[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 }, // hook wide: balloon + town sharp
  { f: 52, dur: 34, cInf: 13, focus: (f) => add(B1(f), [0, 0.8, 0]) }, // passengers MS
  { f: 147, cInf: 0 }, // garden wide
  { f: 252, cInf: 12, focus: () => [KING[0], D0 + 1.6, KING[2]] }, // the king
  { f: 306, dur: 30, cInf: 0 },
  { f: 343, cInf: 12 }, // fire MS (focus = look)
  { f: 424, cInf: 0 }, // inflating wide, rise
  { f: 640, cInf: 13 }, // basket MS
  { f: 666, cInf: 15, focus: () => add(LAND, [1.0, 0.4, 1.45]) }, // rooster CU
  { f: 742, dur: 26, cInf: 14, focus: () => add(LAND, [0.5, 0.5, 1.3]) },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 343, b: 424, kit: "plant_bushDetailed", pos: [72.4, D0, -69.6], s: 0.9, yaw: 0.4 }, // fire MS: bush bottom-right
  { a: 666, b: TOTAL, kit: "flower_yellowA", pos: [LAND[0] + 1.9, D0, LAND[2] + 3.2], s: 0.45 }, // grass CU: flowers in front
];
