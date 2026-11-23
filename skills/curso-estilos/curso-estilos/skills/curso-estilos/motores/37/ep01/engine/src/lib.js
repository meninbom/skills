// lib.js - re-exports of the RYUMON helper libs (MIT) + small helpers of ours
export { taperTube, bake, boxUV, M4, canvasTex, groundMaterial, rockGeo2, rockColor2, rockMaterial, plasterTex, heightMesh, mistMaterial, addShafts, mulb, fbm, vnoise } from './vale_lib.js';
export { mergeGeos, puffs, cumulusList, cloudMaterial, rangeGeo } from './heights_lib.js';
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const sst = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const twos = (t) => Math.floor(t * 12 + 1e-6) / 12;
export const threes = (t) => Math.floor(t * 8 + 1e-6) / 8;
