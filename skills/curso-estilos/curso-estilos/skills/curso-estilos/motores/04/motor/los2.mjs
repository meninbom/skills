// line of sight checks for planned shots (camera -> targets), plus nearest trees, offline
process.env.ROCKET = '0';
const { buildWorld, NX } = await import('./world.mjs');
const W = buildWorld(); const gh = (x, z) => W.H[Math.floor(x) + NX * Math.floor(z)] + 1;
const clear = (p, T) => { const d = Math.hypot(T[0] - p[0], T[1] - p[1], T[2] - p[2]);
  for (let s = 0.3; s < d - 0.4; s += 0.1) { const q = p.map((v, i) => v + (T[i] - v) * s / d); if (W.get(Math.floor(q[0]), Math.floor(q[1]), Math.floor(q[2]))) return `bloqueado a ${s.toFixed(1)} de ${d.toFixed(1)} em ${q.map(v => v.toFixed(1))}`; }
  return `livre (${d.toFixed(1)})`; };
const checks = {
  'S1 cam->porta': [[84.3, 17.0, 33.0], [97.5, 12.5, 52]], 'S1 cam->ele': [[84.3, 17.0, 33.0], [91.0, 12.0, 43.5]],
  'S6 trilha->lanterna no gelo': [[87.0, gh(87, 37.6) + 1.6, 37.6], [81.0, 10.3, 46.0]],
  'S6b trilha2->gelo': [[86.2, gh(86.2, 36.4) + 1.7, 36.4], [81.0, 10.3, 46.0]],
  'porch POV->gelo': [[93.5, 14.8, 49.0], [81.0, 10.9, 46.0]],
  'S2 varanda->porta': [[96.2, 12.6, 49.6], [97.5, 12.1, 51.95]],
};
for (const [k, [p, t]] of Object.entries(checks)) console.log(k, p.map(v => +v.toFixed(2)), '->', clear(p, t));
console.log('gh: trilha(87,37.6)', gh(87, 37.6), ' margem(84,42.5)', gh(84, 42.5), ' gelo(81,46)', gh(81, 46), ' varanda(97.5,50.5)', gh(97.5, 50.5), '(97.5,51.0)', gh(97.5, 51.0));
const tr = W.trees.map(t => ({ ...t, d: Math.hypot(t.x - 87, t.z - 38) })).sort((a, b) => a.d - b.d).slice(0, 8);
console.log('árvores perto da trilha (87,38):', tr.map(t => `(${t.x},${t.z}) h${t.h} d${t.d.toFixed(1)}`).join(' '));
