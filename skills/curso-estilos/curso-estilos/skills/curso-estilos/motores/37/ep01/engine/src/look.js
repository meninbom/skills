// look.js - PIANO colour script (ours): one preset per set; direction LOOKS merge on top (see shots.js).
import * as THREE from 'three';
import { AU, setKey } from './anime/post.js';

const isPlain = (v) => v && typeof v === 'object' && !Array.isArray(v) && !v.isVector3 && !v.isColor && !v.isVector2;
export function mergeLook(a = {}, b = {}) {
  const o = { ...a };
  for (const [k, v] of Object.entries(b ?? {})) o[k] = isPlain(v) && isPlain(a[k]) ? { ...a[k], ...v } : v;
  return o;
}

export const LOOK_PRESETS = {
  // ordinary city street, clear late-morning: bright blue sky, warm sun, cool lavender shade
  STREET: {
    sky: { stops: [[-0.04, '#e6f0ff'], [0.06, '#cfe4ff'], [0.3, '#8fbdf2'], [0.8, '#4f86dc']],
      disk: { dir: [0.5, 0.75, 0.4], radius: 0.05, color: '#fffbea', halo: 0.35, haloColor: '#fff2cc', bloom: 0.7 }, brush: 1 },
    sun: { dir: [0.5, 0.8, 0.45], color: '#fff2dc' }, ambient: '#a4a8d4',
    key: { dir: [0.45, 0.6, 0.65], color: '#fff4e4', tint: 0.12 }, shade: { tint: '#c4c4ff', mix: 0.32 }, rim: { dir: [-0.6, 0.4, -0.7], amt: 1 },
    fog: '#d8e4f6', fogDensity: 0.006, fogNear: 12, fogMax: 0.65, celFog: 0.2,
    mirror: { on: false },
    bloom: 0.8, exposure: 1.02, sat: 1.08, contrast: 0.1, lift: '#24264a', gain: '#fffaf2', vignette: 0.12,
    inkWidth: 2.4, inkColor: '#2a1c22',
  },
  // other world: saturated meadow, cream horizon, deep blue zenith, two pale moons in daylight
  FIELD: {
    sky: { stops: [[-0.04, '#fff3d6'], [0.07, '#ffe6c4'], [0.3, '#86c0ff'], [0.8, '#3f78e0']],
      disk: { dir: [-0.55, 0.45, -0.7], radius: 0.06, color: '#fffbe8', halo: 0.45, haloColor: '#ffe8b8', bloom: 0.8 }, brush: 1 },
    sun: { dir: [-0.45, 0.75, 0.5], color: '#fff0d4' }, ambient: '#9aa6d8',
    key: { dir: [-0.35, 0.6, 0.7], color: '#fff2dc', tint: 0.12 }, shade: { tint: '#c2c8ff', mix: 0.3 }, rim: { dir: [0.6, 0.4, -0.7], amt: 1.1 },
    fog: '#e6ecff', fogDensity: 0.0035, fogNear: 20, fogMax: 0.7, celFog: 0.15,
    mirror: { on: false },
    bloom: 0.9, exposure: 1.03, sat: 1.1, contrast: 0.1, lift: '#20284a', gain: '#fffaf0', vignette: 0.12,
    inkWidth: 2.4, inkColor: '#22202e',
  },
  // rebirth: blinding warm white
  WHITE: {
    sky: { stops: [[-0.5, '#fff8ec'], [0.0, '#ffffff'], [0.3, '#fffaf0'], [0.9, '#fff3e0']], brush: 1 },
    sun: { dir: [0, 1, 0.3], color: '#ffffff' }, ambient: '#ffffff', key: { dir: [0, 0.6, 0.8], color: '#ffffff', tint: 0 },
    shade: { tint: '#ffe8f0', mix: 0.3 }, rim: { dir: [0, 0.5, -1], amt: 1 },
    fog: '#ffffff', fogDensity: 0.0, fogNear: 10, fogMax: 0.0, celFog: 0.0, mirror: { on: false },
    bloom: 1.0, exposure: 1.0, sat: 1.0, contrast: 0.05, lift: '#e8e0f0', gain: '#ffffff', vignette: 0.06,
  },
};

const arr3 = (v) => (v.isVector3 ? v : new THREE.Vector3(...v));
export function applyLights(look) {
  if (look.sun) { if (look.sun.dir) AU.uSunDir.value.copy(arr3(look.sun.dir)).normalize(); if (look.sun.color) AU.uSunColor.value.set(look.sun.color); }
  if (look.ambient) AU.uAmbient.value.set(look.ambient);
  if (look.key) setKey({ dir: look.key.dir ? arr3(look.key.dir).clone().normalize() : undefined, pos: look.key.pos ? arr3(look.key.pos) : undefined, color: look.key.color, tint: look.key.tint });
  if (look.shade) { if (look.shade.tint) AU.uShadeTint.value.set(look.shade.tint); if (look.shade.mix !== undefined) AU.uShadeMix.value = look.shade.mix; }
  if (look.rim) { if (look.rim.dir) AU.uRimDir.value.copy(arr3(look.rim.dir)).normalize(); if (look.rim.amt !== undefined) AU.uRimAmt.value = look.rim.amt; }
  if (look.wind) { AU.uWind.value.x = look.wind[0]; AU.uWind.value.y = look.wind[1]; }
}
