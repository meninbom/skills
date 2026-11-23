// Mãos v3: malhas lisas (SDF, v3/maos_sdf.py) em 3 poses: borda, celular, parede. Mão direita; lado -1 espelha.
import * as THREE from 'three';
const J = await (await fetch('maos.json')).json();
const GEO = {};
for (const k in J) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(J[k].p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(J[k].n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(J[k].p.length / 3 * 2), 2));
  g.setIndex(J[k].i); g.computeBoundingSphere(); GEO[k] = g; }
export function maoMesh(pose, lado, mat) { const m = new THREE.Mesh(GEO[pose], mat); if (lado < 0) m.scale.x = -1; return m; }
