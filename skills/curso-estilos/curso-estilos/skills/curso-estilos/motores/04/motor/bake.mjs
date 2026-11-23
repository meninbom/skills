// Offline GI bake: a small CPU path tracer over the voxel grid (Amanatides-Woo DDA), run on all cores.
// Pass 1: direct light at every exposed face centre (sky, moon, warm windows/beams/lantern) -> radiance cache.
// Pass 2: per mesh vertex, cosine-hemisphere rays; escaped rays read sky radiance, hit rays read the cache (1 bounce),
//         plus next-event estimation toward the glowing window panes and a soft lantern visibility.
// Output: mesh buffers + per-vertex baked lighting split into channels the shader can rescale/flicker.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import fs from 'node:fs';
import os from 'node:os';
import { NX, NY, NZ, M, ALBEDO, buildWorld } from './world.mjs';
const DATA = process.env.DATA || 'data';
import { L as LIGHT, skyRad, beamAt } from './lighting.mjs';

const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const NVOX = NX * NY * NZ;
const solid = m => m !== 0;

// ---------------------------------------------------------------- DDA
let hitV = -1, hitF = -1, hitT = 0;
function trace(vox, ox, oy, oz, dx, dy, dz, maxT) {
  let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
  const tdx = dx !== 0 ? Math.abs(1 / dx) : 1e30, tdy = dy !== 0 ? Math.abs(1 / dy) : 1e30, tdz = dz !== 0 ? Math.abs(1 / dz) : 1e30;
  let tmx = dx !== 0 ? ((sx > 0 ? x + 1 - ox : ox - x) * tdx) : 1e30;
  let tmy = dy !== 0 ? ((sy > 0 ? y + 1 - oy : oy - y) * tdy) : 1e30;
  let tmz = dz !== 0 ? ((sz > 0 ? z + 1 - oz : oz - z) * tdz) : 1e30;
  let t = 0, face = -1;
  for (let it = 0; it < 600; it++) {
    if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; face = sx > 0 ? 1 : 0; }
    else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; face = sy > 0 ? 3 : 2; }
    else { z += sz; t = tmz; tmz += tdz; face = sz > 0 ? 5 : 4; }
    if (t > maxT) return 0; // reached target / max distance unobstructed
    if (y >= NY) return -1;
    if (y < 0) return -2;
    if (x < 0 || x >= NX || z < 0 || z >= NZ) return -1;
    const v = x + NX * (y + NY * z);
    if (vox[v] !== 0) { hitV = v; hitF = face; hitT = t; return 1; }
  }
  return -1;
}

function basis(d) { // tangent frame for axis normal index d
  const n = DIRS[d];
  const t = Math.abs(n[1]) > 0.5 ? [1, 0, 0] : [0, 1, 0];
  const b = [n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]];
  const t2 = [b[1] * n[2] - b[2] * n[1], b[2] * n[0] - b[0] * n[2], b[0] * n[1] - b[1] * n[0]];
  return [t2, b, n];
}
const BASES = DIRS.map((_, i) => basis(i));
function hashf(a, b) { let h = Math.imul(a | 0, 2654435761) ^ Math.imul(b | 0, 2246822519); h = Math.imul(h ^ (h >>> 15), 2246822519); h ^= h >>> 13; return (h >>> 0) / 4294967296; }

// direct warm light at a point (panes NEE + beams + lantern); returns [warmRGB(3), lanternVis]
function warmDirect(vox, px, py, pz, d, seed, nPane, withBeam = true) {
  const n = DIRS[d];
  let wr = 0, wg = 0, wb = 0;
  const dc = Math.hypot(px - 97, pz - 56);
  if (dc < 40) {
    // window panes as area emitters
    for (let wi = 0; wi < LIGHT.windows.length; wi++) {
      const w = LIGHT.windows[wi];
      const A = (w.a1 - w.a0) * (w.y1 - w.y0);
      for (let s = 0; s < nPane; s++) {
        const u = (s + hashf(seed, s * 7 + wi)) / nPane, v = hashf(seed + 11, s * 13 + wi);
        const qa = w.a0 + 0.08 + u * (w.a1 - w.a0 - 0.16), qy = w.y0 + 0.08 + v * (w.y1 - w.y0 - 0.16);
        const qx = w.axis === 2 ? qa : w.plane - 0.001, qz = w.axis === 2 ? w.plane - 0.001 : qa;
        let lx = qx - px, ly = qy - py, lz = qz - pz;
        const dist = Math.hypot(lx, ly, lz); lx /= dist; ly /= dist; lz /= dist;
        const cp = lx * n[0] + ly * n[1] + lz * n[2]; if (cp <= 0) continue;
        const cq = w.axis === 2 ? lz : lx; // pane normal is -axis, so -l . (-axis) = l.axis
        if (cq <= 0) continue;
        if (trace(vox, px, py, pz, lx, ly, lz, dist - 0.02) !== 0) continue;
        const g = cp * cq * A / (Math.PI * dist * dist + 0.3) / nPane;
        wr += LIGHT.paneLe[0] * g; wg += LIGHT.paneLe[1] * g; wb += LIGHT.paneLe[2] * g;
      }
    }
    // light beams through the windows (same analytic function the shader uses), with occlusion
    const bm = withBeam ? beamAt(px, py, pz, n) : [0, 0, 0, 0];
    if (bm[0] + bm[1] + bm[2] > 1e-5) {
      const L = LIGHT.interior; let lx = L[0] - px, ly = L[1] - py, lz = L[2] - pz;
      const dist = Math.hypot(lx, ly, lz);
      // occlusion only up to the wall plane (beam enters the window voxel at the end)
      const ok = trace(vox, px, py, pz, lx / dist, ly / dist, lz / dist, bm[3] - 0.05) === 0;
      if (ok) { wr += bm[0]; wg += bm[1]; wb += bm[2]; }
    }
  }
  // lantern: soft visibility
  let lv = 0;
  const La = LIGHT.lantern;
  const dl = Math.hypot(La[0] - px, La[1] - py, La[2] - pz);
  if (dl < 16) {
    const NS = 8;
    for (let s = 0; s < NS; s++) {
      const tx = La[0] + (hashf(seed, s * 3 + 1) - 0.5) * 0.35, ty = La[1] + (hashf(seed, s * 3 + 2) - 0.5) * 0.35, tz = La[2] + (hashf(seed, s * 3 + 3) - 0.5) * 0.35;
      let lx = tx - px, ly = ty - py, lz = tz - pz; const dist = Math.hypot(lx, ly, lz);
      if (lx * n[0] + ly * n[1] + lz * n[2] <= 0) continue;
      if (trace(vox, px, py, pz, lx / dist, ly / dist, lz / dist, dist) === 0) lv += 1 / NS;
    }
  }
  return [wr, wg, wb, lv];
}

// ---------------------------------------------------------------- worker
if (!isMainThread) {
  const { voxBuf, faceIdxBuf, cacheBuf, faceListBuf, vertBuf, outBuf } = workerData;
  const vox = new Uint8Array(voxBuf), faceIdx = new Int32Array(faceIdxBuf), cache = new Float32Array(cacheBuf);
  const faceList = new Int32Array(faceListBuf), verts = new Int32Array(vertBuf), out = new Float32Array(outBuf);
  const ML = LIGHT.moonDir, MC = LIGHT.moonCol;
  parentPort.on('message', ({ phase, a, b }) => {
    if (phase === 1) {
      // faceList entries: voxel*6+dir; cache: 9 floats per face: skyOut, moonOut, warmOut
      for (let f = a; f < b; f++) {
        const key = faceList[f], v = (key / 6) | 0, d = key % 6;
        const m = vox[v];
        const x = v % NX, y = ((v / NX) | 0) % NY, z = (v / (NX * NY)) | 0;
        const n = DIRS[d], [T, B] = BASES[d];
        const px = x + 0.5 + n[0] * 0.51, py = y + 0.5 + n[1] * 0.51, pz = z + 0.5 + n[2] * 0.51;
        let sr = 0, sg = 0, sb = 0; const NS = 24;
        for (let s = 0; s < NS; s++) {
          const u1 = (s + hashf(f, s)) / NS, u2 = (s * 0.618034 + hashf(f + 7, s)) % 1;
          const r = Math.sqrt(u1), ph = 6.2831853 * u2, lz = Math.sqrt(1 - u1);
          const dx = T[0] * r * Math.cos(ph) + B[0] * r * Math.sin(ph) + n[0] * lz;
          const dy = T[1] * r * Math.cos(ph) + B[1] * r * Math.sin(ph) + n[1] * lz;
          const dz = T[2] * r * Math.cos(ph) + B[2] * r * Math.sin(ph) + n[2] * lz;
          const h = trace(vox, px, py, pz, dx, dy, dz, 90);
          if (h <= 0) { const c = skyRad(dx, dy, dz); sr += c[0]; sg += c[1]; sb += c[2]; }
          else { sr += 0.04 * 0.1; sg += 0.05 * 0.1; sb += 0.07 * 0.1; } // crude multi-bounce floor
        }
        sr /= NS; sg /= NS; sb /= NS;
        let mv = 0; const cm = ML[0] * n[0] + ML[1] * n[1] + ML[2] * n[2];
        if (cm > 0) for (let s = 0; s < 4; s++) {
          const jx = (hashf(f, 50 + s) - 0.5) * 0.04, jy = (hashf(f, 60 + s) - 0.5) * 0.04;
          if (trace(vox, px, py, pz, ML[0] + jx, ML[1] + jy, ML[2], 120) <= 0) mv += cm / 4;
        }
        const wd = warmDirect(vox, px, py, pz, d, f * 31 + 5, 2);
        const La = LIGHT.lantern; let ll = 0;
        if (wd[3] > 0) {
          let lx = La[0] - px, ly = La[1] - py, lz2 = La[2] - pz; const dl = Math.hypot(lx, ly, lz2);
          ll = wd[3] * Math.max(0, (lx * n[0] + ly * n[1] + lz2 * n[2]) / dl) / (dl * dl + 0.2);
        }
        const al = ALBEDO[m] || [0.3, 0.3, 0.3];
        const o = f * 9;
        cache[o] = al[0] * sr; cache[o + 1] = al[1] * sg; cache[o + 2] = al[2] * sb;
        cache[o + 3] = al[0] * MC[0] * mv; cache[o + 4] = al[1] * MC[1] * mv; cache[o + 5] = al[2] * MC[2] * mv;
        const isWin = m === M.WINDOW;
        cache[o + 6] = isWin ? 0 : al[0] * (wd[0] + LIGHT.lantCol[0] * ll);
        cache[o + 7] = isWin ? 0 : al[1] * (wd[1] + LIGHT.lantCol[1] * ll);
        cache[o + 8] = isWin ? 0 : al[2] * (wd[2] + LIGHT.lantCol[2] * ll);
      }
      parentPort.postMessage('done');
    } else {
      // verts entries: 4 ints per unique vertex: x, y, z (corner, integer), dir, plus face-centre offset sign handled via dir
      for (let i = a; i < b; i++) {
        const cx = verts[i * 5], cy = verts[i * 5 + 1], cz = verts[i * 5 + 2], d = verts[i * 5 + 3], fcK = verts[i * 5 + 4];
        const n = DIRS[d], [T, B] = BASES[d];
        // face-centre direction encoded in fcK bits: towards centre along T and B
        const st = (fcK & 1) ? 1 : -1, sbb = (fcK & 2) ? 1 : -1;
        // nudge origin off the corner toward the face centre & off the surface
        const px = cx + n[0] * 0.03 + (T[0] * st + B[0] * sbb) * 0.06;
        const py = cy + n[1] * 0.03 + (T[1] * st + B[1] * sbb) * 0.06;
        const pz = cz + n[2] * 0.03 + (T[2] * st + B[2] * sbb) * 0.06;
        const far = pz > 120 ? 1 : 0;
        const NS = far ? 48 : 128;
        let s0 = 0, s1 = 0, s2 = 0, m0 = 0, m1 = 0, m2 = 0, w0 = 0, w1 = 0, w2 = 0;
        for (let s = 0; s < NS; s++) {
          const u1 = (s + hashf(i, s)) / NS, u2 = (s * 0.618034 + hashf(i + 3, s)) % 1;
          const r = Math.sqrt(u1), ph = 6.2831853 * u2, lz = Math.sqrt(1 - u1);
          const dx = T[0] * r * Math.cos(ph) + B[0] * r * Math.sin(ph) + n[0] * lz;
          const dy = T[1] * r * Math.cos(ph) + B[1] * r * Math.sin(ph) + n[1] * lz;
          const dz = T[2] * r * Math.cos(ph) + B[2] * r * Math.sin(ph) + n[2] * lz;
          const h = trace(vox, px, py, pz, dx, dy, dz, 90);
          if (h <= 0) { if (h === 0 || h === -1) { const c = skyRad(dx, dy, dz); s0 += c[0]; s1 += c[1]; s2 += c[2]; } }
          else {
            const fi = faceIdx[hitV * 6 + hitF];
            if (fi >= 0) { const o = fi * 9; s0 += cache[o]; s1 += cache[o + 1]; s2 += cache[o + 2]; m0 += cache[o + 3]; m1 += cache[o + 4]; m2 += cache[o + 5]; w0 += cache[o + 6]; w1 += cache[o + 7]; w2 += cache[o + 8]; }
          }
        }
        const wd = warmDirect(vox, px, py, pz, d, i * 17 + 3, 6, false);
        const o = i * 10;
        out[o] = s0 / NS; out[o + 1] = s1 / NS; out[o + 2] = s2 / NS;
        out[o + 3] = m0 / NS; out[o + 4] = m1 / NS; out[o + 5] = m2 / NS;
        // warm: pane NEE (direct, soft) + bounce of all warm light. Beams + lantern direct are per-pixel in the shader.
        out[o + 6] = w0 / NS + wd[0]; out[o + 7] = w1 / NS + wd[1]; out[o + 8] = w2 / NS + wd[2];
        out[o + 9] = wd[3];
      }
      parentPort.postMessage('done');
    }
  });
} else {
  // ---------------------------------------------------------------- main
  const t0 = Date.now();
  const W = buildWorld();
  console.log(`world built ${((Date.now() - t0) / 1000).toFixed(1)}s, trees ${W.trees.length}`);
  const voxBuf = new SharedArrayBuffer(NVOX); const vox = new Uint8Array(voxBuf); vox.set(W.vox);
  const isOpaqueNeighbour = (x, y, z) => { // out of grid counts as solid (no faces at the borders/bottom)
    if (x < 0 || x >= NX || z < 0 || z >= NZ || y < 0) return true;
    if (y >= NY) return false;
    return vox[x + NX * (y + NY * z)] !== 0;
  };
  // exposed faces
  const faces = [];
  for (let z = 0; z < NZ; z++) for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
    const v = x + NX * (y + NY * z); if (!vox[v]) continue;
    for (let d = 0; d < 6; d++) { const n = DIRS[d]; if (!isOpaqueNeighbour(x + n[0], y + n[1], z + n[2])) faces.push(v * 6 + d); }
  }
  console.log('faces', faces.length);
  const faceIdxBuf = new SharedArrayBuffer(NVOX * 6 * 4); const faceIdx = new Int32Array(faceIdxBuf); faceIdx.fill(-1);
  const faceListBuf = new SharedArrayBuffer(faces.length * 4); const faceList = new Int32Array(faceListBuf);
  faces.forEach((k, i) => { faceList[i] = k; faceIdx[k] = i; });
  const cacheBuf = new SharedArrayBuffer(faces.length * 9 * 4);

  // corners per face (CCW seen from outside): returns 4 integer corners
  function corners(x, y, z, d) {
    const X = x, Y = y, Z = z;
    switch (d) {
      case 0: return [[X + 1, Y, Z], [X + 1, Y + 1, Z], [X + 1, Y + 1, Z + 1], [X + 1, Y, Z + 1]];
      case 1: return [[X, Y, Z + 1], [X, Y + 1, Z + 1], [X, Y + 1, Z], [X, Y, Z]];
      case 2: return [[X, Y + 1, Z + 1], [X + 1, Y + 1, Z + 1], [X + 1, Y + 1, Z], [X, Y + 1, Z]];
      case 3: return [[X, Y, Z], [X + 1, Y, Z], [X + 1, Y, Z + 1], [X, Y, Z + 1]];
      case 4: return [[X + 1, Y, Z + 1], [X + 1, Y + 1, Z + 1], [X, Y + 1, Z + 1], [X, Y, Z + 1]];
      case 5: return [[X, Y, Z], [X, Y + 1, Z], [X + 1, Y + 1, Z], [X + 1, Y, Z]];
    }
  }
  // unique vertices keyed by (corner, dir). Corner shared by several faces of one plane -> same lighting (smooth).
  const vmap = new Map();
  const uverts = []; // x,y,z,d,fcK
  const faceVerts = new Int32Array(faces.length * 4);
  for (let f = 0; f < faces.length; f++) {
    const k = faces[f], v = (k / 6) | 0, d = k % 6;
    const x = v % NX, y = ((v / NX) | 0) % NY, z = (v / (NX * NY)) | 0;
    const cs = corners(x, y, z, d);
    const [T, B] = BASES[d];
    const cxm = x + 0.5 + DIRS[d][0] * 0.5, cym = y + 0.5 + DIRS[d][1] * 0.5, czm = z + 0.5 + DIRS[d][2] * 0.5;
    for (let c = 0; c < 4; c++) {
      const [px, py, pz] = cs[c];
      const key = ((px * (NY + 1) + py) * (NZ + 1) + pz) * 6 + d;
      let id = vmap.get(key);
      if (id === undefined) {
        id = uverts.length / 5;
        // which way is "inward" for this corner: pick the face centre side (any face sharing it works for the nudge)
        const ox = cxm - px, oy = cym - py, oz = czm - pz;
        const st = (ox * T[0] + oy * T[1] + oz * T[2]) > 0 ? 1 : 0, sb = (ox * B[0] + oy * B[1] + oz * B[2]) > 0 ? 2 : 0;
        uverts.push(px, py, pz, d, st | sb);
        vmap.set(key, id);
      }
      faceVerts[f * 4 + c] = id;
    }
  }
  const NV = uverts.length / 5;
  console.log('unique verts', NV);
  const vertBuf = new SharedArrayBuffer(NV * 5 * 4); new Int32Array(vertBuf).set(uverts);
  const outBuf = new SharedArrayBuffer(NV * 10 * 4);

  const NW = Math.max(1, os.cpus().length - 2);
  const workers = Array.from({ length: NW }, () => new Worker(new URL(import.meta.url), { workerData: { voxBuf, faceIdxBuf, cacheBuf, faceListBuf, vertBuf, outBuf } }));
  async function runPhase(phase, total) {
    const CH = 4096; let next = 0, done = 0;
    await new Promise(res => {
      const feed = w => { if (next >= total) { if (done === total) res(); return; } const a = next, b = Math.min(total, next + CH); next = b; w.once('message', () => { done += b - a; if (done >= total) res(); else feed(w); }); w.postMessage({ phase, a, b }); };
      workers.forEach(feed);
    });
  }
  let t1 = Date.now();
  await runPhase(1, faces.length);
  console.log(`pass1 ${((Date.now() - t1) / 1000).toFixed(1)}s`);
  t1 = Date.now();
  await runPhase(2, NV);
  console.log(`pass2 ${((Date.now() - t1) / 1000).toFixed(1)}s`);
  workers.forEach(w => w.terminate());

  // build render mesh (non-indexed corners per face so each face can carry its own material/dir)
  const out = new Float32Array(outBuf);
  const nF = faces.length;
  const pos = new Float32Array(nF * 4 * 3), info = new Uint8Array(nF * 4 * 4), bake = new Float32Array(nF * 4 * 10);
  const idx = new Uint32Array(nF * 6);
  for (let f = 0; f < nF; f++) {
    const k = faces[f], v = (k / 6) | 0, d = k % 6, m = vox[v];
    const x = v % NX, y = ((v / NX) | 0) % NY, z = (v / (NX * NY)) | 0;
    const cs = corners(x, y, z, d);
    const lum = [];
    for (let c = 0; c < 4; c++) {
      const vi = f * 4 + c, id = faceVerts[f * 4 + c];
      pos.set(cs[c], vi * 3);
      info[vi * 4] = d; info[vi * 4 + 1] = m; info[vi * 4 + 2] = c; info[vi * 4 + 3] = 0;
      for (let j = 0; j < 10; j++) bake[vi * 10 + j] = out[id * 10 + j];
      lum.push(out[id * 10] + out[id * 10 + 1] + out[id * 10 + 2] + out[id * 10 + 3] + out[id * 10 + 4]);
    }
    const b0 = f * 4;
    // flip the quad diagonal along the brighter pair (avoids the classic AO anisotropy artefact)
    if (lum[0] + lum[2] > lum[1] + lum[3]) idx.set([b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3], f * 6);
    else idx.set([b0 + 1, b0 + 2, b0 + 3, b0 + 1, b0 + 3, b0], f * 6);
  }
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync(DATA + '/pos.bin', Buffer.from(pos.buffer));
  fs.writeFileSync(DATA + '/info.bin', Buffer.from(info.buffer));
  fs.writeFileSync(DATA + '/bake.bin', Buffer.from(bake.buffer));
  fs.writeFileSync(DATA + '/idx.bin', Buffer.from(idx.buffer));
  // heightmap for particles/fox placement
  fs.writeFileSync(DATA + '/height.bin', Buffer.from(new Int16Array(W.H).buffer));
  fs.writeFileSync(DATA + '/meta.json', JSON.stringify({ NX, NY, NZ, faces: nF, verts: nF * 4, lights: W.lights, trees: W.trees.length }));
  console.log(`total ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
