// Apocalipse zumbi na Paulista: MASP modelado (pórticos + volume suspenso + escada de corda) e horda 3D.
import * as THREE from 'three';

export const MASP_ID = 1370081491;

// caixa orientada pelos pontos (PCA): centro, eixo longo u, eixo curto v, meias-medidas
export function obb(pts) {
  const n = pts.length, cx = pts.reduce((s, p) => s + p[0], 0) / n, cz = pts.reduce((s, p) => s + p[1], 0) / n;
  let a = 0, b = 0, c = 0; for (const p of pts) { const dx = p[0] - cx, dz = p[1] - cz; a += dx * dx; b += dx * dz; c += dz * dz; }
  const ang = 0.5 * Math.atan2(2 * b, a - c), u = [Math.cos(ang), Math.sin(ang)], v = [-u[1], u[0]];
  let mu = [1e9, -1e9], mv = [1e9, -1e9];
  for (const p of pts) { const du = (p[0] - cx) * u[0] + (p[1] - cz) * u[1], dv = (p[0] - cx) * v[0] + (p[1] - cz) * v[1];
    mu = [Math.min(mu[0], du), Math.max(mu[1], du)]; mv = [Math.min(mv[0], dv), Math.max(mv[1], dv)]; }
  const oc = [cx + u[0] * (mu[0] + mu[1]) / 2 + v[0] * (mv[0] + mv[1]) / 2, cz + u[1] * (mu[0] + mu[1]) / 2 + v[1] * (mv[0] + mv[1]) / 2];
  return { c: oc, u, v, lu: (mu[1] - mu[0]) / 2, lv: (mv[1] - mv[0]) / 2 };
}
export const fita = (b) => b.cor === 'red' && obb(b.pts).lv < 2.5;      // pórtico do MASP vindo do OSM como "parede"

// caixa orientada (u,v no chão) de y0 a y1, com normais por face
function caixa(B, V, c, u, v, su, sv, y0, y1, info) {
  const P = (a, b, y) => V(c[0] + u[0] * a + v[0] * b, y, c[1] + u[1] * a + v[1] * b);
  const hu = su / 2, hv = sv / 2, Z = [0, 0, 0];
  const q = (p0, p1, p2, p3, n) => { B.tri(p0, p1, p2, info, Z, Z, Z, n); B.tri(p0, p2, p3, info, Z, Z, Z, n); };
  const nu = V(u[0], 0, u[1]), nv = V(v[0], 0, v[1]);
  q(P(-hu, -hv, y1), P(hu, -hv, y1), P(hu, hv, y1), P(-hu, hv, y1), V(0, 1, 0));
  q(P(-hu, -hv, y0), P(-hu, hv, y0), P(hu, hv, y0), P(hu, -hv, y0), V(0, -1, 0));
  q(P(hu, -hv, y0), P(hu, hv, y0), P(hu, hv, y1), P(hu, -hv, y1), nu);
  q(P(-hu, -hv, y0), P(-hu, -hv, y1), P(-hu, hv, y1), P(-hu, hv, y0), nu.clone().negate());
  q(P(-hu, hv, y0), P(hu, hv, y0), P(hu, hv, y1), P(-hu, hv, y1), nv);
  q(P(-hu, -hv, y0), P(-hu, -hv, y1), P(hu, -hv, y1), P(hu, -hv, y0), nv.clone().negate());
}

// tubo de 6 lados entre dois pontos (corda)
function tubo(B, V, a, b, r, info) {
  const d = new THREE.Vector3().subVectors(b, a); if (d.length() < 1e-4) return;
  d.normalize(); const t1 = Math.abs(d.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const n1 = new THREE.Vector3().crossVectors(d, t1).normalize(), n2 = new THREE.Vector3().crossVectors(d, n1).normalize();
  const Z = [0, 0, 0], N = 6, ring = (c) => Array.from({ length: N }, (_, k) => {
    const an = k / N * Math.PI * 2, n = n1.clone().multiplyScalar(Math.cos(an)).addScaledVector(n2, Math.sin(an));
    return [c.clone().addScaledVector(n, r), n]; });
  const A = ring(a), Bq = ring(b);
  for (let k = 0; k < N; k++) { const j = (k + 1) % N;
    B.tri(A[k][0], Bq[k][0], Bq[j][0], info, Z, Z, Z, A[k][1].clone().add(A[j][1]).normalize());
    B.tri(A[k][0], Bq[j][0], A[j][0], info, Z, Z, Z, A[k][1].clone().add(A[j][1]).normalize()); }
}

// MASP: volume suspenso 8,4–15 m (o prédio em si sai do laço de prédios com essas alturas), pórticos vermelhos e escada
export function masp(cena, Buf, V, avenida) {
  const vol = cena.buildings.find(b => b.id === MASP_ID); if (!vol) return null;
  const o = obb(vol.pts), g0 = vol.base + 0.6, B = new Buf();
  // lado da avenida: v aponta pra avenida
  const toAv = [avenida[0] - o.c[0], avenida[1] - o.c[1]];
  if (o.v[0] * toAv[0] + o.v[1] * toAv[1] < 0) { o.v = [-o.v[0], -o.v[1]]; }
  // esplanada/belvedere: bloco do terreno baixo até o nível da avenida (o que fica embaixo do vão)
  caixa(B, V, o.c, o.u, o.v, o.lu * 2 + 6, o.lv * 2 + 4, (vol._fundo ?? g0 - 10) - 1, g0 - 0.05, [705000, 0.92, 6, 0]);
  let k = 0; const pernas = [];
  for (const s of cena.buildings.filter(fita)) {
    const f0 = obb(s.pts);
    for (const e of [-1, 1]) pernas.push({ x: f0.c[0] + f0.u[0] * e * (f0.lu - 3.4), z: f0.c[1] + f0.u[1] * e * (f0.lu - 3.4),
      v: (f0.c[0] - o.c[0]) * o.v[0] + (f0.c[1] - o.c[1]) * o.v[1] });
    const f = obb(s.pts), info = [700000 + (k++), 0.40, 6, 0];
    for (const e of [-1, 1]) caixa(B, V, [f.c[0] + f.u[0] * e * (f.lu - 1.7), f.c[1] + f.u[1] * e * (f.lu - 1.7)], f.u, f.v, 3.4, f.lv * 2 + 0.6, g0 - 1, g0 + 16.8, info);
    caixa(B, V, f.c, f.u, f.v, f.lu * 2, f.lv * 2 + 0.6, g0 + 14.6, g0 + 16.8, info);           // viga de cima
    caixa(B, V, f.c, f.u, f.v, f.lu * 2, f.lv * 2 + 0.4, g0 + 7.0, g0 + 8.5, info);             // viga de baixo
  }
  // escada de corda pendurada no lado da avenida
  const lad = [o.c[0] + o.u[0] * 6 + o.v[0] * (o.lv + 0.12), o.c[1] + o.u[1] * 6 + o.v[1] * (o.lv + 0.12)];   // rente à fachada, por fora
  // corda de verdade: as laterais torcem e balançam, os degraus entortam, a ponta de baixo abre e enrola no chão
  const inf = [710000, 0.30, 6, 0], infD = [711000, 0.55, 6, 0], BL = new Buf();
  const yTop = g0 + 12.6, L = 12.35;              // presa logo abaixo do beiral (teto = g0 + 14,4), até o chão
  let sd = 11; const rr = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  const ponto = (d, lado) => {                       // d = metros abaixo do topo; lado = -1 / +1
    const k = d / L, th = 1.1 * Math.sin(d * 0.30) * k, larg = 0.30 + 0.12 * k * k;
    const swU = 1.6 * k * k + 0.25 * Math.sin(d * 0.9) * k, swV = 0.04 + 1.3 * k * k;   // afasta da fachada e balança embaixo          // balança: a ponta de baixo sai da vertical
    const wob = 0.045 * Math.sin(d * 4.2 + lado * 2.1);                                // corda não é reta
    const lu = Math.cos(th) * larg * lado + swU + wob, lv = Math.sin(th) * larg * lado + swV;
    return V(lad[0] + o.u[0] * lu + o.v[0] * lv, yTop - d, lad[1] + o.u[1] * lu + o.v[1] * lv);
  };
  for (const lado of [-1, 1]) for (let d = 0; d < L; d += 0.2) tubo(BL, V, ponto(d, lado), ponto(Math.min(L, d + 0.2), lado), 0.026, inf);
  for (let d = 0.35; d < L - 0.3; d += 0.46) {
    const a = ponto(d + (rr() - 0.5) * 0.22, -1), b = ponto(d + (rr() - 0.5) * 0.22, 1);
    tubo(BL, V, a, b, 0.028, infD);
    for (const pnt of [a, b]) tubo(BL, V, pnt.clone().add(V(0, 0.05, 0)), pnt.clone().add(V(0, -0.05, 0)), 0.05, inf);   // nó
  }
  tubo(BL, V, ponto(0, -1).add(V(0, 0.05, 0)), ponto(0, 1).add(V(0, 0.05, 0)), 0.05, inf);   // travessa de cima
  for (const lado of [-1, 1]) {                                                              // amarração até o beiral
    const p0 = ponto(0, lado), p1 = p0.clone().add(V(-o.v[0] * 0.08, 1.3, -o.v[1] * 0.08));
    tubo(BL, V, p0, p1, 0.03, inf); }
  // sobra de corda enrolada no chão
  const base = ponto(L, 0);
  for (let t = 0; t < 2.2 * Math.PI; t += 0.25) {
    const r1 = 0.35 + 0.05 * t, r2 = 0.35 + 0.05 * (t + 0.25);
    tubo(BL, V, V(base.x + Math.cos(t) * r1, g0 + 0.04, base.z + Math.sin(t) * r1), V(base.x + Math.cos(t + 0.25) * r2, g0 + 0.04, base.z + Math.sin(t + 0.25) * r2), 0.035, inf);
  }
  const frente = pernas.filter(p => p.v === Math.max(...pernas.map(q => q.v)));
  return { geo: B.geo(), geoLad: BL.geo(), pernas: frente, c: o.c, u: o.u, v: o.v, lu: o.lu, lv: o.lv, g0, yBot: g0 + 8.4, yTop: g0 + 15, lad };
}

// modelos de figura (local: olhando +z). zumbi = braços pra frente; sobrevivente = braços pra baixo
export function figuras() {
  const cap = (a, b, r) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length();
    const g = new THREE.CapsuleGeometry(r, Math.max(0.01, L), 3, 8);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
    g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); return g; };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const zumbi = (passo, lean, braco, roupa) => [
    [cap(V(-0.1, 0.9, 0), V(-0.12, 0.1, 0.12 * passo), 0.075), roupa], [cap(V(0.1, 0.9, 0), V(0.12, 0.1, -0.12 * passo), 0.075), roupa],
    [cap(V(0, 0.95, 0), V(0, 1.42, 0.08 * lean), 0.17).scale(1, 1, 0.75), roupa],
    [new THREE.SphereGeometry(0.11, 10, 8).translate(0.02, 1.62, 0.12 * lean + 0.05), 0.30],
    [cap(V(-0.21, 1.40, 0.05), V(-0.17, 1.30 + braco, 0.62), 0.05), 0.30], [cap(V(0.21, 1.40, 0.05), V(0.2, 1.34 + braco * 0.6, 0.6), 0.05), 0.30]];
  const vivo = [
    [cap(V(-0.1, 0.9, 0), V(-0.1, 0.1, 0), 0.075), 0.3], [cap(V(0.1, 0.9, 0), V(0.1, 0.1, 0), 0.075), 0.3],
    [cap(V(0, 0.95, 0), V(0, 1.42, 0), 0.17).scale(1, 1, 0.75), 0.25],
    [new THREE.SphereGeometry(0.11, 10, 8).translate(0, 1.62, 0), 0.9],
    [cap(V(-0.22, 1.40, 0), V(-0.25, 0.9, 0.02), 0.05), 0.25], [cap(V(0.22, 1.40, 0), V(0.25, 0.9, 0.02), 0.05), 0.25]];
  return { zumbis: [zumbi(1, 1, 0.05, 0.16), zumbi(-0.8, 1.5, -0.12, 0.10), zumbi(0.5, 0.6, 0.15, 0.22), zumbi(-1, 1.2, 0.0, 0.13)], vivo };   // silhueta: beta com contorno branco
}

// distribui a horda: debaixo do MASP e nas ruas em volta, todos andando pro vão
export function horda(cena, M, n = 2400, seed = 7) {
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const out = [], c = M.c;
  const ruas = cena.roads.filter(r => r.car || r.kind === 'pedestrian');
  const near = []; for (const r of ruas) for (let i = 0; i < r.pts.length - 1; i++) {
    const [x1, z1] = r.pts[i], [x2, z2] = r.pts[i + 1], mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
    if (Math.hypot(mx - c[0], mz - c[1]) < 190) near.push([x1, z1, x2, z2, r.w]); }
  for (let i = 0; i < n; i++) {
    let x, z;
    if (i < n * 0.28) {                                       // massa debaixo do vão
      const a = (rnd() * 2 - 1) * (M.lu - 3), b = -(M.lv - 2) + rnd() * (2 * M.lv + 14);   // embaixo do vão e transbordando pra calçada da avenida
      x = c[0] + M.u[0] * a + M.v[0] * b; z = c[1] + M.u[1] * a + M.v[1] * b;
    } else {
      const sg = near[Math.floor(rnd() * near.length)], t = rnd(), w = sg[4];
      const dx = sg[2] - sg[0], dz = sg[3] - sg[1], L = Math.hypot(dx, dz) || 1, off = (rnd() - 0.5) * (w + 4);
      x = sg[0] + dx * t - dz / L * off; z = sg[1] + dz * t + dx / L * off;
    }
    const d = Math.hypot(x - c[0], z - c[1]);
    out.push({ x, z, var: Math.floor(rnd() * 4), fase: rnd() * 6.28, vel: 0.6 + rnd() * 0.8, para: i < n * 0.28 ? d - rnd() * 2.5 : 18 + rnd() * 40, d0: d, sc: 0.92 + rnd() * 0.16 });
  }
  return out;
}
