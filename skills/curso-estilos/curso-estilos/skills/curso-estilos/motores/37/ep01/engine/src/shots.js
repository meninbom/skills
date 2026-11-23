// shots.js - PIANO (ours) shot table + evalFrame (same contract as the RYUMON engine's shots.js, MIT engine).
import * as THREE from 'three';
import { LOOK_PRESETS, mergeLook } from './look.js';

export const FILM = 'PATINETE';
export const FPS = 30;
export const DURATION = 38;
export const FRAMES = DURATION * FPS;
export const W = 1080, H = 1920;
export const SETS = ['STREET', 'FIELD', 'WHITE'];
export const DEPTS = ['direction/main', 'city', 'field', 'hero_vrm', 'scooter', 'slime', 'fxd', 'direction/late'];
// RYO (ep01): chestnut hair, mustard hoodie, olive cargo trousers, no tie
export const CHAR = { hair: ['#2a160e', '#8a5232'], hairShade: '#9a7a8a', hairHi: '#d8a070', tops: ['#a8701e', '#f6c84e'], topsShade: '#c9a0a0',
  bottoms: ['#1e2418', '#5f6e44'], bottomsShade: '#8c8fa8', iris: ['#10201a', '#3f9a6a'], skin: '#fbe3d2', tie: null };

const S = (id, name, t0, t1, set) => ({ id, name, t0, t1, set, under: false, dur: t1 - t0 });
export const SHOTS = [
  S('s01', 'rua', 0.0, 3.0, 'STREET'),
  S('s02', 'tedio', 3.0, 5.0, 'STREET'),
  S('s03', 'patinete', 5.0, 6.8, 'STREET'),
  S('s04', 'olhar', 6.8, 8.2, 'STREET'),
  S('s05', 'impacto', 8.2, 8.4, 'STREET'),
  S('s06', 'atropelado', 8.4, 11.4, 'STREET'),
  S('s07', 'cartela', 11.4, 15.4, 'WHITE'),
  S('s08', 'acorda', 15.4, 18.0, 'FIELD'),
  S('s09', 'mundo', 18.0, 21.0, 'FIELD'),
  S('s10', 'corrida', 21.0, 24.5, 'FIELD'),
  S('s11', 'bateria', 24.5, 27.0, 'FIELD'),
  S('s12', 'tremor', 27.0, 29.0, 'FIELD'),
  S('s13', 'rei', 29.0, 30.3, 'FIELD'),
  S('s14', 'fuga', 30.3, 31.8, 'FIELD'),
  S('s15', 'morto', 31.8, 33.0, 'FIELD'),
  S('s16', 'capitulo2', 33.0, 38.0, 'FIELD'),
];
SHOTS.forEach((s, i) => { s.index = i; s.f0 = Math.round(s.t0 * FPS); s.f1 = Math.round(s.t1 * FPS); });
export const SHOT = Object.fromEntries(SHOTS.map((s) => [s.id, s]));

export const CUES = {
  look: 7.0, hit: 8.2, white: 11.4, wake: 16.4, rise: 18.4, zoom: 21.0, low: 25.6, slimeup: 27.3, roar: 29.4, dead: 31.4, flop: 32.1, card2: 33.6,
};

export const PLACEHOLDER_CAMS = {
  STREET: { pos: [-2, 1.5, 8], look: [-4.6, 1.2, 0], fov: 45, near: 0.05 },
  FIELD: { pos: [0, 1.6, 8], look: [0, 1, 0], fov: 45, near: 0.05 },
  WHITE: { pos: [0, 1.6, 8], look: [0, 1, 0], fov: 45, near: 0.05 },
};
export const CAM_DEFAULTS = { near: 0.05, far: 6000 };

export const DIRECTION = { CAMS: {}, LOOKS: {}, ACT: {} };
export function registerDirection(mod = {}) {
  for (const k of ['CAMS', 'LOOKS', 'ACT']) if (mod[k]) Object.assign(DIRECTION[k], mod[k]);
  return DIRECTION;
}
DIRECTION.errors = [];
const _seen = new Set();
function safe(tag, fn, fallback) {
  try { return fn(); } catch (e) {
    const k = tag + ':' + e?.message;
    if (!_seen.has(k)) { _seen.add(k); DIRECTION.errors.push(k); console.error(`[${tag}]`, e); }
    return fallback;
  }
}
export function shotAt(t) {
  if (t <= 0) return SHOTS[0];
  for (const s of SHOTS) if (t < s.t1) return s;
  return SHOTS[SHOTS.length - 1];
}
const v3 = (v) => (v && v.isVector3 ? v.clone() : new THREE.Vector3(...(v ?? [0, 0, 0])));
const num = (q, k, d) => (q.has(k) && q.get(k) !== '' ? parseFloat(q.get(k)) : d);
const vec = (q, k) => (q.has(k) ? q.get(k).split(',').map(Number) : null);
export function normCam(c, set) {
  const p = PLACEHOLDER_CAMS[set] ?? PLACEHOLDER_CAMS[SETS[0]];
  c = c ?? p;
  return { ...c, pos: v3(c.pos ?? p.pos), look: v3(c.look ?? c.at ?? p.look), fov: c.fov ?? p.fov ?? 40, roll: c.roll ?? 0,
    near: c.near ?? p.near ?? CAM_DEFAULTS.near, far: c.far ?? p.far ?? CAM_DEFAULTS.far };
}
export function parseSet(s) { return { set: s, under: false }; }

// ?test=1&t=12.3 renders film time t with the film's own direction; &cam=..&at=..&fov= overrides the camera
export function evalFrame(frame, q = new URLSearchParams()) {
  const test = q.has('test');
  let t = frame / FPS;
  if (test && q.has('t')) t = num(q, 't', 0);
  frame = Math.round(t * FPS);
  const shot = shotAt(t);
  const lt = t - shot.t0, dur = shot.dur;
  const set = shot.set, under = false, act = true;
  const st = { frame, t, sid: shot.id, shot, set, under, lt, dur, d: dur, u: lt / dur, cues: CUES, q, test, act, since: (c) => t - CUES[c] };
  let look = mergeLook({ t, frame, inkSeed: Math.floor(t * 12 + 1e-6) }, LOOK_PRESETS[set] ?? {});
  st.look = look;
  const L = DIRECTION.LOOKS[shot.id];
  if (L) st.look = mergeLook(look, safe('LOOKS ' + shot.id, () => (typeof L === 'function' ? L(lt, dur, t, st) : L), {}));
  const C = DIRECTION.CAMS[shot.id];
  let cam = C ? safe('CAMS ' + shot.id, () => (typeof C === 'function' ? C(lt, dur, t, st) : C), null) : null;
  if (!cam || !cam.pos) cam = PLACEHOLDER_CAMS[set];
  if (test && q.has('cam')) cam = { pos: vec(q, 'cam'), look: vec(q, 'at') ?? PLACEHOLDER_CAMS[set]?.look, fov: num(q, 'fov', 40), roll: 0 };
  st.cam = normCam(cam, set);
  return st;
}
export function evalTime(t, q) { return evalFrame(Math.round(t * FPS), q); }
