process.env.ROCKET = '0';
const { buildWorld, NX } = await import('./world.mjs');
const W = buildWorld(); const gh = (x, z) => W.H[Math.floor(x) + NX * Math.floor(z)] + 1;
const clear = (p, T) => { const d = Math.hypot(T[0] - p[0], T[1] - p[1], T[2] - p[2]); for (let s = 0.3; s < d - 0.3; s += 0.08) { const q = p.map((v, i) => v + (T[i] - v) * s / d); if (W.get(Math.floor(q[0]), Math.floor(q[1]), Math.floor(q[2]))) return false; } return true; };
// EP02A: from near the porch, see him whole (feet and head) at STAND
const LAMP2 = [81.2, 46.2], ICE0 = [84.3, 42.8]; const dv = [ICE0[0] - LAMP2[0], ICE0[1] - LAMP2[1]], dl = Math.hypot(...dv);
const ST = [LAMP2[0] + dv[0] / dl * 0.75, 0, LAMP2[1] + dv[1] / dl * 0.75]; ST[1] = gh(ST[0], ST[2]);
const res = [];
for (let x = 90; x <= 96; x += 0.5) for (let z = 44; z <= 50; z += 0.5) for (const dy of [2.5, 3.5, 4.5, 5.5]) {
  const p = [x, gh(x, z) + dy, z]; if (W.get(Math.floor(p[0]), Math.floor(p[1]), Math.floor(p[2]))) continue;
  if (clear(p, [ST[0], ST[1] + 0.1, ST[2]]) && clear(p, [ST[0], ST[1] + 1.5, ST[2]])) res.push({ p: p.map(v => +v.toFixed(2)), dPorch: +Math.hypot(x - 96, z - 49.5).toFixed(2) });
}
res.sort((a, b) => a.dPorch - b.dPorch); console.log('STAND', ST.map(v => +v.toFixed(2)), 'POV ok:', res.slice(0, 6).map(r => JSON.stringify(r)).join(' '));
// EP01: from the new stop T1 on the trail, over his shoulder to her lantern
const T1 = [87.4, 0, 38.7]; T1[1] = gh(T1[0], T1[2]);
for (const dy of [1.7, 1.9, 2.2, 2.6]) console.log('T1 dy', dy, clear([T1[0], T1[1] + dy, T1[2]], [81.2, gh(81.2, 46.2) + 0.15, 46.2]) ? 'vê a lanterna' : 'bloqueado');
