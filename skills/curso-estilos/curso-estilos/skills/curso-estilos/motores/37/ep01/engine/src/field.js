// field.js - sets FIELD + WHITE (ours). FIELD: the other world. Flat meadow around the origin (Taku wakes at 0,0,0),
// ridge at z -30 (the Slime King rises behind it), far hills, white castle on a hill at (-75, ., -200), floating
// islands, two pale moons in the day sky, cumulus; a cloud ring over the origin parts for the sky piano.
// Painted ground + painted grass cards; cel flowers that can pop open (st.plan.bloom = {c:[x,z], r, w}).
import * as THREE from 'three';
import { heightMesh, groundMaterial, mulb, fbm, puffs, cumulusList, cloudMaterial, taperTube, mergeGeos, rockGeo2 } from './lib.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export function groundH(x, z) {
  const d = Math.hypot(x, z);
  let h = (fbm(x * 0.05, z * 0.05, 3) - 0.5) * 1.2 * Math.min(1, d / 10);
  h += 4.2 * Math.exp(-(((z + 31) / 6.5) ** 2)) * (1 - 0.3 * Math.exp(-((x / 40) ** 2)) * 0);
  if (d > 50) h += (fbm(x * 0.012 + 3, z * 0.012, 4) - 0.35) * 40 * Math.min(1, (d - 50) / 120);
  h += 34 * Math.exp(-(((x + 75) ** 2 + (z + 205) ** 2) / (45 * 45)));
  return h;
}

export function create(ctx) {
  const { A } = ctx, G = ctx.sets.FIELD, rng = mulb(606), ID = A.ID;
  const SUN = V3(-0.45, 0.75, 0.5).normalize();
  // ground
  const cA = new THREE.Color('#86c85a'), cB = new THREE.Color('#5aa84e'), cC = new THREE.Color('#b8d86a'), cF = new THREE.Color('#7aa0c8'), tmp = new THREE.Color();
  const col = (x, z, y, n) => {
    const v = fbm(x * 0.08 + 7, z * 0.08, 3);
    tmp.copy(cB).lerp(cA, v).lerp(cC, Math.max(0, fbm(x * 0.03, z * 0.03 + 5, 2) - 0.55) * 1.5);
    const d = Math.hypot(x, z); if (d > 120) tmp.lerp(cF, Math.min(0.45, (d - 120) / 400));
    return tmp.clone();
  };
  const gm = groundMaterial({ shade: '#4a6a8a', dab: 0.55, id: ID.GROUND });
  gm.uniforms.uBlobOn = { value: 1 };
  G.add(new THREE.Mesh(heightMesh(-60, 60, -60, 60, 160, 160, groundH, col), gm));
  // far ground ring (coarser)
  const far = heightMesh(-700, 700, -900, 300, 140, 120, (x, z) => (Math.abs(x) < 58 && Math.abs(z) < 58 ? groundH(x, z) - 0.6 : groundH(x, z)), col);
  G.add(new THREE.Mesh(far, gm));
  // grass cards: dense near, sparse mid
  const grassM = A.cardMaterial({ map: A.grassAtlas({ seed: 61, cells: 4, size: 192, near: true }), cells: 4, ramp: ['#2e5a4a', '#4e8c4a', '#92c45a', '#e6f2a0'], alt: '#fff4a8', altAmt: 0.45, ink: '#1a3424', texW: 0.75, sway: 0.06 });
  const grassFar = A.cardMaterial({ map: A.grassAtlas({ seed: 62, cells: 4, size: 192 }), cells: 4, ramp: ['#3a6a52', '#5a9a52', '#9ccc62', '#e8f4a8'], alt: '#fff4a8', altAmt: 0.4, ink: '#1e3a2a', texW: 0.75, sway: 0.04 });
  const items = [], itemsFar = [];
  for (let i = 0; i < 5200; i++) {
    const r = Math.sqrt(rng()) * 14, a = rng() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
    items.push({ pos: V3(x, groundH(x, z) - 0.02, z), w: 0.42 + rng() * 0.3, h: 0.28 + rng() * 0.25, light: 0.35 + rng() * 0.5, cell: Math.floor(rng() * 4), flip: rng() < 0.5 });
  }
  for (let i = 0; i < 7000; i++) {
    const x = (rng() - 0.5) * 100, z = (rng() - 0.75) * 90; if (Math.hypot(x, z) < 12) continue;
    itemsFar.push({ pos: V3(x, groundH(x, z) - 0.05, z), w: 1.0 + rng() * 0.8, h: 0.5 + rng() * 0.4, light: 0.35 + rng() * 0.5, cell: Math.floor(rng() * 4), flip: rng() < 0.5 });
  }
  const grassNear = A.cardInstances(grassM, items); G.add(grassNear, A.cardInstances(grassFar, itemsFar));
  ctx.api.grassNear = grassNear;
  // flowers: cel petals (white / yellow / pink / blue), instanced, can bloom
  const FN = 900, flowers = [];
  for (let i = 0; i < FN; i++) {
    const r = 0.6 + Math.sqrt(rng()) * 13, a = rng() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
    flowers.push({ x, z, y: groundH(x, z) + 0.2 + rng() * 0.18, s: 0.05 + rng() * 0.04, k: Math.floor(rng() * 4), ry: rng() * 6.28, open: rng() < 0.55 ? 1 : 0 });
  }
  const petalGeo = (() => { const parts = []; for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; parts.push({ geo: new THREE.SphereGeometry(1, 8, 6).scale(0.55, 0.12, 0.32).translate(0.6, 0, 0).rotateY(a) }); } return mergeGeos(parts); })();
  const pCols = ['#fbfaf2', '#ffe060', '#ff9ab8', '#9ac0ff'];
  const petalMs = pCols.map((c, i) => new THREE.InstancedMesh(petalGeo, A.celMaterial({ base: c, id: 60 + i, highlight: 0.1 }), FN));
  const centreM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 8, 6), A.celMaterial({ base: '#ffb43a', shade: '#c0702a', id: 64 }), FN);
  petalMs.forEach((m) => { m.frustumCulled = false; G.add(m); }); centreM.frustumCulled = false; G.add(centreM);
  const stemParts = []; for (const f of flowers) stemParts.push({ geo: new THREE.CylinderGeometry(0.004, 0.006, f.y - groundH(f.x, f.z), 4).translate(f.x, (f.y + groundH(f.x, f.z)) / 2, f.z) });
  G.add(new THREE.Mesh(mergeGeos(stemParts), A.celMaterial({ base: '#4e8c4a', shade: '#2e5a4a', id: 65, flat: true })));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s3 = V3(), p3 = V3(), Z = new THREE.Matrix4().makeScale(0, 0, 0);
  function setFlowers(bloom) {
    const cnt = [0, 0, 0, 0];
    for (const m of petalMs) for (let i = 0; i < FN; i++) m.setMatrixAt(i, Z);
    flowers.forEach((f, i) => {
      let o = f.open;
      if (bloom) { const d = Math.hypot(f.x - bloom.c[0], f.z - bloom.c[1]); const k = Math.min(1, Math.max(0, (bloom.r - d) / (bloom.w ?? 1.5))); o = Math.max(o, k * (0.6 + 0.4 * (i % 3) / 2)); if (bloom.big) o *= 1 + 0.5 * k; }
      const sc = f.s * (0.25 + 0.75 * o) * (o > 0.95 ? 1.15 : 1);
      m4.compose(p3.set(f.x, f.y, f.z), q.setFromEuler(e.set(0, f.ry, 0)), s3.set(sc, sc * (0.4 + 0.6 * o), sc));
      petalMs[f.k].setMatrixAt(cnt[f.k]++, m4);
      centreM.setMatrixAt(i, m4.compose(p3.set(f.x, f.y + 0.01, f.z), q.identity(), s3.setScalar(f.s * (0.5 + 0.5 * o))));
    });
    for (const m of petalMs) m.instanceMatrix.needsUpdate = true; centreM.instanceMatrix.needsUpdate = true;
  }
  setFlowers(null);
  // trees at mid distance: cel trunk + painted leaf cards
  const leafM = A.cardMaterial({ map: A.foliageAtlas({ kind: 'leaf', seed: 71 }), cells: 4, ramp: ['#2a4a66', '#3a7a5a', '#86c05a', '#f0f6a8'], alt: '#fff3a0', altAmt: 0.5, ink: '#18302e', sway: 0.025 });
  const trunk = A.celMaterial({ base: '#8a6250', shade: '#4e3a4a', id: 66 });
  const clumps = [];
  for (const [tx, tz, s] of [[14, -14, 1.2], [19, -8, 0.9], [-16, -18, 1.3], [-22, -6, 1.0], [26, -34, 1.6], [-30, -40, 1.8], [40, -55, 2.0], [-45, -20, 1.4]]) {
    const y0 = groundH(tx, tz);
    G.add(new THREE.Mesh(taperTube([V3(tx, y0 - 0.2, tz), V3(tx + 0.2 * s, y0 + 2 * s, tz), V3(tx - 0.1 * s, y0 + 3.6 * s, tz + 0.2)], 0.3 * s, 0.14 * s, 7, 8), trunk));
    clumps.push({ c: V3(tx, y0 + 4.6 * s, tz), r: V3(2.4 * s, 2.0 * s, 2.4 * s), n: 70 }, { c: V3(tx - 1.4 * s, y0 + 4.0 * s, tz + 0.8 * s), r: V3(1.5 * s, 1.2 * s, 1.5 * s), n: 30 }, { c: V3(tx + 1.2 * s, y0 + 5.4 * s, tz - 0.6 * s), r: V3(1.4 * s, 1.2 * s, 1.4 * s), n: 30 });
  }
  G.add(A.cardInstances(leafM, A.foliageItems(rng, clumps, { sun: SUN, size: 0.85 }), { base: false }));
  // castle (painted, far)
  {
    const cx = -75, cz = -205, cy = groundH(cx, cz);
    const wall = A.paintedMaterial({ color: '#f6f0e6', color2: '#e8e0f0', shade: '#9a9ac8', id: ID.PAINT, varScale: 0.1, varAmt: 0.3, rim: 0.6, rimColor: '#fff8e8' });
    const roof = A.paintedMaterial({ color: '#4a6ad8', color2: '#5a7ae8', shade: '#2a3a8a', id: ID.PAINT + 1, varScale: 0.1, varAmt: 0.3, rim: 0.5, rimColor: '#c8d8ff' });
    const gold = A.celMaterial({ base: '#ffd060', shade: '#b07a2a', id: 67, flat: true });
    const towers = [[0, 0, 4.5, 28], [-12, 6, 3, 18], [12, 6, 3, 20], [-7, -8, 2.6, 22], [8, -9, 2.4, 16], [0, 10, 2.2, 14], [-18, -2, 2, 12], [18, -3, 2.2, 13]];
    for (const [dx, dz, r, h] of towers) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 16), wall); t.position.set(cx + dx, cy + h / 2 - 2, cz + dz); G.add(t);
      const c = new THREE.Mesh(new THREE.ConeGeometry(r * 1.35, h * 0.55, 16), roof); c.position.set(cx + dx, cy + h - 2 + h * 0.27, cz + dz); G.add(c);
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.6, 6), gold); f.position.set(cx + dx, cy + h - 2 + h * 0.55 + 0.6, cz + dz); G.add(f);
    }
    const keep = new THREE.Mesh(new THREE.BoxGeometry(30, 10, 18), wall); keep.position.set(cx, cy + 3, cz); G.add(keep);
    // battlements
    for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.2), wall); b.position.set(cx - 14 + i * 2.15, cy + 8.6, cz + 9); G.add(b); }
  }
  // floating islands
  const rockM = A.paintedMaterial({ color: '#b0a0b8', color2: '#9a8ab0', shade: '#6a5a98', id: ID.PAINT + 2, varScale: 0.2, varAmt: 0.4, rim: 0.4, rimColor: '#fff0e0', bands: true });
  const topM = A.paintedMaterial({ color: '#8ccc5a', color2: '#6ab04e', shade: '#3a6a6a', id: ID.PAINT + 3, varScale: 0.2, varAmt: 0.4, bands: true, rim: 0.5, rimColor: '#f0ffc0' });
  const islandClumps = [];
  for (const [ix, iy, iz, s] of [[70, 62, -230, 14], [-30, 95, -330, 20], [30, 40, -140, 6], [-70, 48, -120, 5]]) {
    const cone = new THREE.ConeGeometry(1, 1.6, 12, 4); { const p = cone.attributes.position, v = V3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + (fbm(v.x * 2 + ix, v.z * 2 + v.y, 2) - 0.5) * 0.5; p.setXYZ(i, v.x * k, v.y, v.z * k); } cone.computeVertexNormals(); }
    const m = new THREE.Mesh(cone, rockM); m.rotation.x = Math.PI; m.scale.set(s, s, s); m.position.set(ix, iy - 0.8 * s, iz); G.add(m);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(s * 1.02, s * 0.98, s * 0.18, 16), topM); top.position.set(ix, iy, iz); G.add(top);
    islandClumps.push({ c: V3(ix - s * 0.3, iy + s * 0.35, iz), r: V3(s * 0.35, s * 0.3, s * 0.35), n: 24 });
  }
  G.add(A.cardInstances(leafM, A.foliageItems(rng, islandClumps, { sun: SUN, size: 0.8 }), { base: false }));
  // two pale moons
  const moonM = A.fxMaterial({ color: '#f2eeff', intensity: 1.0, bloom: 0.1, id: 94 });
  const craterM = A.fxMaterial({ color: '#d8d4f4', intensity: 1.0, bloom: 0, id: 94 });
  for (const [mx, my, mz, r] of [[260, 420, -900, 60], [420, 300, -1000, 26]]) {
    const g = new THREE.Group(); g.position.set(mx, my, mz); g.lookAt(0, 0, 0); G.add(g);
    g.add(new THREE.Mesh(new THREE.CircleGeometry(r, 40), moonM));
    for (let k = 0; k < 5; k++) { const c = new THREE.Mesh(new THREE.CircleGeometry(r * (0.1 + 0.12 * ((k * 7) % 3)), 16), craterM); c.position.set(Math.cos(k * 2.3) * r * 0.5, Math.sin(k * 1.7) * r * 0.45, 0.5); g.add(c); }
  }
  // cumulus + the parting ring over the origin
  const cm = cloudMaterial({ color: '#ffffff', color2: '#fff8f0', shade: '#b8c0ec', rimColor: '#fffdf2' });
  const sph = new THREE.SphereGeometry(1, 16, 12);
  for (const [cx, cy, cz, w] of [[-140, 90, -420, 140], [120, 110, -520, 170], [250, 70, -300, 90], [-260, 60, -260, 90], [40, 150, -700, 220]]) {
    G.add(puffs(sph, cm, cumulusList(mulb(cx * 3 + cz | 0), V3(cx, cy, cz), w, w * 0.45, 14, { bumps: 2 })));
  }
  const ringList = [];
  const rr = mulb(77);
  for (let i = 0; i < 46; i++) { const a = (i / 46) * Math.PI * 2 + rr() * 0.1; const r = 26 + rr() * 14; ringList.push({ a, r, y: 150 + (rr() - 0.5) * 14, s: 12 + rr() * 10 }); }
  const ringMesh = new THREE.InstancedMesh(sph, cloudMaterial({ color: '#ffffff', color2: '#fff8f0', shade: '#b0b8e8', rimColor: '#fffdf2' }), ringList.length); ringMesh.frustumCulled = false; G.add(ringMesh);
  function setRing(part) {
    ringList.forEach((c, i) => { const r = c.r * (0.25 + part * 1.6); ringMesh.setMatrixAt(i, m4.compose(p3.set(Math.cos(c.a) * r, c.y, Math.sin(c.a) * r), q.identity(), s3.set(c.s * 1.2, c.s * 0.8, c.s * 1.2))); });
    ringMesh.instanceMatrix.needsUpdate = true;
  }
  setRing(0);
  // a few rocks for set dressing near the hero
  const stoneM = A.celMaterial({ base: '#b4aec0', shade: '#726c94', id: 68, highlight: 0.12, wobble: 1.5 });
  for (const [x, z, s] of [[-2.6, -1.8, 0.35], [3.2, -3.4, 0.5], [-4, 2.6, 0.3]]) { const m = new THREE.Mesh(rockGeo2(mulb(x * 10 | 0), { rough: 0.25 }), stoneM); m.scale.set(s, s * 0.7, s); m.position.set(x, groundH(x, z) + s * 0.2, z); G.add(m); }

  // WHITE set: nothing but light (sky preset) + soft rays (look.shafts)
  let lastBloom = null, lastPart = 0;
  return {
    update(st) {
      if (st.set !== 'FIELD') return;
      const b = st.plan?.bloom ?? null, key = b ? b.c.join(',') + b.r.toFixed(2) : 'none';
      if (key !== lastBloom) { setFlowers(b); lastBloom = key; }
      const part = st.plan?.part ?? 0; if (part !== lastPart) { setRing(part); lastPart = part; }
    },
  };
}
