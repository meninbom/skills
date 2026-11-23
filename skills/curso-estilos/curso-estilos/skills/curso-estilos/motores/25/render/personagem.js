// Personagem de mangá em código: corpo 3D de primitivas lisas (sem imagem, sem modelo baixado).
// Passa pelo mesmo shader de traço/retícula da cidade. Tipos: 7 cabelo, 8 pele (rosto desenhado no shader), 9 roupa.
// Coordenadas locais: metros, y pra cima, personagem olhando para +z. Altura ~1,70 m.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

export function personagem(Buf, { pose = 'parado', oid = 400000 } = {}) {
  const B = new Buf();
  const ID = { pele: oid, cabelo: oid + 1, jaqueta: oid + 2, calca: oid + 3, sapato: oid + 4, botao: oid + 5, gola: oid + 6 };
  const HEAD = V(0, 1.585, 0.01), HR = 0.112;

  function add(geo, mat, alb, kind, id, wall) {
    let g = geo;
    if (g.index) g = g.toNonIndexed();
    const p = g.attributes.position, n = g.attributes.normal, w = g.attributes.aW;
    const nm = new THREE.Matrix3().getNormalMatrix(mat), v = new THREE.Vector3(), nn = new THREE.Vector3();
    for (let k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k).applyMatrix4(mat); nn.fromBufferAttribute(n, k).applyMatrix3(nm).normalize();
      B.p.push(v.x, v.y, v.z); B.n.push(nn.x, nn.y, nn.z); B.i.push(id, alb, kind, 0);
      if (w) B.w.push(w.getX(k), w.getY(k), w.getZ(k));
      else if (wall) B.w.push(...wall(v)); else B.w.push(0, 0, 0);
    }
  }
  // capsula entre dois pontos (membro)
  function limb(a, b, r, alb, kind, id, sx = 1, sz = 1) {
    const d = V(0, 0, 0).subVectors(b, a), len = d.length();
    const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len), 6, 16);
    const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
    add(g, new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, V(sx, 1, sz)), alb, kind, id);
  }
  const M = (pos, s = V(1, 1, 1), q = new THREE.Quaternion()) => new THREE.Matrix4().compose(pos, q, s);

  // ---- cabeça: uma esfera deformada (cranio redondo, queixo fino e pra frente) -> sem vinco no rosto
  { const g = new THREE.SphereGeometry(1, 48, 36), p = g.attributes.position, aw = [];
    for (let k = 0; k < p.count; k++) {
      let x = p.getX(k), y = p.getY(k), z = p.getZ(k);
      aw.push(Math.atan2(x, z), y, 1);                     // u = azimute a partir da frente, v = altura na esfera
      if (y < 0) { const t = -y; x *= 0.80 * (1 - 0.40 * Math.pow(t, 1.4)); z *= 1 - 0.18 * t; z += 0.10 * t * t; y *= 1.16; }
      else { y *= 1.04; x *= 0.80; }
      p.setXYZ(k, x * HR, y * HR, z * HR * 1.02);
    }
    g.computeVertexNormals(); g.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 3));
    add(g, M(HEAD), 0.97, 8, ID.pele); }
  // orelhas (atrás do cabelo, so aparecem de lado)
  for (const s of [-1, 1]) { const g = new THREE.SphereGeometry(0.026, 12, 10); add(g, M(V(s * 0.088, 1.575, -0.005), V(0.45, 1, 0.8)), 0.97, 8, ID.pele); }
  // pescoço
  limb(V(0, 1.40, -0.01), V(0, 1.50, 0.0), 0.043, 0.97, 8, ID.pele);

  // ---- cabelo: calota + mechas pontudas (cones) + franja; brilho em anel desenhado no shader
  const hairWall = (v) => [v.y - HEAD.y, Math.atan2(v.x - HEAD.x, v.z - HEAD.z), 0];
  { // calota inclinada pra trás: borda da frente na testa, borda de trás na nuca
    const g = new THREE.SphereGeometry(HR * 1.09, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.56);
    const q = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -0.50);
    add(g, M(V(0, HEAD.y + 0.006, HEAD.z - 0.006), V(0.86, 1.0, 1.05), q), 0.06, 7, ID.cabelo, hairWall); }
  const rnd = (() => { let s = 12345; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const spike = (base, tipDir, len, r) => {
    const g = new THREE.ConeGeometry(r, len, 7, 1); g.translate(0, len / 2, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(UP, tipDir.clone().normalize());
    add(g, M(base, V(1, 1, 1), q), 0.06, 7, ID.cabelo, hairWall);
  };
  // mechas em volta: topo, lados e trás, sempre caindo um pouco
  for (let i = 0; i < 26; i++) {
    const az = (i / 26) * Math.PI * 2 + rnd() * 0.2;            // 0 = frente
    if (Math.cos(az) > 0.55) continue;                          // frente fica pra franja
    const el = 0.15 + rnd() * 0.75;                             // altura na cabeça
    const d = V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const base = HEAD.clone().add(V(d.x * 0.84, d.y, d.z).multiplyScalar(HR * 0.95));
    const tip = d.clone().add(V(0, -0.85 - rnd() * 0.3, 0)).add(V(Math.sin(az) * 0.2, 0, -0.25));
    spike(base, tip, 0.10 + rnd() * 0.07, 0.042 + rnd() * 0.012);
  }
  // topo arrepiado
  for (let i = 0; i < 6; i++) {
    const az = rnd() * Math.PI * 2, d = V(Math.sin(az) * 0.5, 1, Math.cos(az) * 0.5 - 0.2).normalize();
    spike(HEAD.clone().addScaledVector(d, HR * 0.9), d.clone().add(V(0, 0, -0.6)), 0.08 + rnd() * 0.05, 0.04);
  }
  // franja: mechas caindo na testa, terminando acima dos olhos
  for (let i = -4; i <= 4; i++) {
    const x = i * 0.019, ai = Math.abs(i);
    const base = V(x, HEAD.y + 0.104 - ai * 0.004, HEAD.z + 0.082 - ai * ai * 0.0022);
    spike(base, V(x * 2.4 + (i % 2 ? 0.07 : -0.04), -1, 0.42), 0.088 + (i % 2 ? 0.026 : 0) - ai * 0.004, 0.025);
  }
  // costeletas
  for (const s of [-1, 1]) spike(V(s * 0.084, HEAD.y + 0.035, HEAD.z + 0.012), V(s * 0.1, -1, 0.1), 0.09, 0.024);

  // ---- tronco: gakuran (jaqueta preta de gola alta) por torno
  const PROF = [[0.001, 0.845], [0.160, 0.85], [0.161, 0.90], [0.157, 0.98], [0.148, 1.07], [0.152, 1.17], [0.172, 1.27], [0.192, 1.345], [0.17, 1.395], [0.085, 1.43], [0.05, 1.44]];
  const profR = (y) => { for (let i = 0; i < PROF.length - 1; i++) { const [r1, y1] = PROF[i], [r2, y2] = PROF[i + 1];
    if (y >= y1 && y <= y2) return r1 + (r2 - r1) * (y - y1) / (y2 - y1); } return 0.15; };
  { const g = new THREE.LatheGeometry(PROF.map(([r, y]) => new THREE.Vector2(r, y)), 40); add(g, M(V(0, 0, 0), V(1, 1, 0.62)), 0.12, 9, ID.jaqueta); }
  { const g = new THREE.CylinderGeometry(0.058, 0.066, 0.06, 24, 1, true); add(g, M(V(0, 1.43, -0.004), V(1, 1, 0.9)), 0.12, 9, ID.gola); }
  for (let i = 0; i < 5; i++) { const y = 1.33 - i * 0.075, g = new THREE.SphereGeometry(0.0095, 10, 8);
    add(g, M(V(0, y, 0.62 * profR(y) + 0.003)), 1.0, 9, ID.botao); }
  // quadril
  { const g = new THREE.SphereGeometry(0.14, 24, 16); add(g, M(V(0, 0.90, 0), V(0.95, 0.45, 0.6)), 0.12, 9, ID.calca); }

  // ---- pernas (peso na direita, esquerda solta) e sapatos
  const legs = pose === 'parado'
    ? [[V(0.085, 0.92, 0), V(0.092, 0.50, 0.012), V(0.096, 0.095, 0)], [V(-0.085, 0.92, 0), V(-0.07, 0.51, 0.065), V(-0.105, 0.10, -0.015)]]
    : [[V(0.085, 0.92, 0), V(0.09, 0.50, 0.012), V(0.096, 0.095, 0)], [V(-0.085, 0.92, 0), V(-0.08, 0.50, 0.012), V(-0.096, 0.095, 0)]];
  for (const [hip, knee, ank] of legs) {
    limb(hip, knee, 0.072, 0.12, 9, ID.calca); limb(knee, ank, 0.058, 0.12, 9, ID.calca);
    limb(ank.clone().add(V(0, -0.045, -0.035)), ank.clone().add(V(0.004, -0.05, 0.15)), 0.048, 0.08, 9, ID.sapato, 1.05, 1);
  }
  // ---- braços: direito solto, esquerdo com a mão no bolso
  const sh = [V(0.185, 1.36, -0.005), V(-0.185, 1.36, -0.005)];
  // as duas mãos no bolso (cotovelo pra fora, punho entra no quadril)
  const arms = [[sh[0], V(0.24, 1.095, -0.065), V(0.162, 0.935, 0.05)], [sh[1], V(-0.235, 1.09, -0.06), V(-0.165, 0.93, 0.05)]];
  arms.forEach(([s, e, w]) => { limb(s, e, 0.052, 0.12, 9, ID.jaqueta); limb(e, w, 0.045, 0.12, 9, ID.jaqueta); });
  return { geo: B.geo(), head: HEAD.clone() };
}
