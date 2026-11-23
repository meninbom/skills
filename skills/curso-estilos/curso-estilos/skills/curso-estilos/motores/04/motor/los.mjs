// find a clear line of sight from near the cabin door to him on the ice (EP03 S4 POV)
process.env.ROCKET = '0';
const { buildWorld, NX } = await import('./world.mjs');
const W = buildWorld(); const gh = (x, z) => W.H[Math.floor(x) + NX * Math.floor(z)] + 1;
const G1 = [80.8, gh(80.8, 46.4), 46.4]; const T = [G1[0], G1[1] + 0.9, G1[2]];
console.log('G1.y', G1[1], 'door ground', gh(97, 51.6), gh(96.5, 48.2));
const out = [];
for (let x = 86; x <= 100; x += 0.5) for (let z = 42; z <= 52; z += 0.5) for (const dy of [1.6, 2.2, 2.8, 3.4]) {
  const p = [x, gh(x, z) + dy, z]; if (W.get(Math.floor(p[0]), Math.floor(p[1]), Math.floor(p[2]))) continue;
  const d = Math.hypot(T[0] - p[0], T[1] - p[1], T[2] - p[2]); let ok = true;
  for (let s = 0.2; s < d - 0.6; s += 0.1) { const q = p.map((v, i) => v + (T[i] - v) * s / d); if (W.get(Math.floor(q[0]), Math.floor(q[1]), Math.floor(q[2]))) { ok = false; break; } }
  if (ok) out.push({ p: p.map(v => +v.toFixed(2)), dy, dDoor: +Math.hypot(x - 97, z - 51.6).toFixed(2), dist: +d.toFixed(1) });
}
out.sort((a, b) => a.dDoor - b.dDoor); console.log(out.slice(0, 15).map(o => JSON.stringify(o)).join('\n'));
