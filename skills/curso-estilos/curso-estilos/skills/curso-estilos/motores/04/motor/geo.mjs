// Offline geometry: trail points, ground heights and trees near them (pick shots without rendering).
process.env.ROCKET = '0';
const { buildWorld, NX, curves, POND, CABIN } = await import('./world.mjs');
const W = buildWorld(); const gh = (x, z) => W.H[Math.floor(x) + NX * Math.floor(z)] + 1;
const P = curves().path;
console.log('path pts', P.length, 'first', P[0].map(v => v.toFixed(1)), 'last', P[P.length - 1].map(v => v.toFixed(1)));
const near = P.filter(([x, z]) => x > 60 && x < 120 && z > 20 && z < 52);
console.log('path near cabin (every 6th):', near.filter((_, i) => i % 6 === 0).map(([x, z]) => `(${x.toFixed(1)},${z.toFixed(1)} h${gh(x, z)})`).join(' '));
console.log('trees total', W.trees.length, 'sample', JSON.stringify(W.trees[0]));
const tr = W.trees.filter(t => { const x = t.x ?? t[0], z = t.z ?? t[2] ?? t[1]; return x > 60 && x < 110 && z > 20 && z < 50; });
console.log('trees near', tr.length, tr.slice(0, 25).map(t => JSON.stringify(t)).join(' '));
console.log('pond', POND, 'cabin', CABIN, 'gh pond center', gh(POND.x, POND.z), 'gh porch', gh(97, 50.5));
