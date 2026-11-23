// Leitor mínimo de GLB (malhas sem textura, como as do Hunyuan3D): devolve BufferGeometry com position/normal/index (+ color se houver).
import { THREE } from './kit3d.js';
const TA = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }, NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
export async function carregaGLB(url) {
  const buf = await (await fetch(url)).arrayBuffer(), dv = new DataView(buf);
  const jl = dv.getUint32(12, true), json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl))), bin = buf.slice(20 + jl + 8);
  const acc = i => { const a = json.accessors[i], v = json.bufferViews[a.bufferView], T = TA[a.componentType], n = NC[a.type], off = (v.byteOffset || 0) + (a.byteOffset || 0);
    if (v.byteStride && v.byteStride !== n * T.BYTES_PER_ELEMENT) { const o = new T(a.count * n), d = new DataView(bin); for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) o[k * n + c] = T === Float32Array ? d.getFloat32(off + k * v.byteStride + c * 4, true) : d.getUint8(off + k * v.byteStride + c); return { arr: o, n, norm: a.normalized }; }
    return { arr: new T(bin.slice(off, off + a.count * n * T.BYTES_PER_ELEMENT)), n, norm: a.normalized }; };
  const geos = [];
  for (const m of json.meshes) for (const p of m.primitives) { const g = new THREE.BufferGeometry(), at = p.attributes;
    const P = acc(at.POSITION); g.setAttribute('position', new THREE.BufferAttribute(P.arr, 3));
    if (at.NORMAL != null) g.setAttribute('normal', new THREE.BufferAttribute(acc(at.NORMAL).arr, 3));
    if (at.COLOR_0 != null) { const C = acc(at.COLOR_0); const f = new Float32Array(C.arr.length / C.n * 3), k = C.arr instanceof Float32Array ? 1 : 1 / 255; for (let i = 0, o = 0; i < C.arr.length; i += C.n) for (let c = 0; c < 3; c++) { const v = C.arr[i + c] * k; f[o++] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); } g.setAttribute('color', new THREE.BufferAttribute(f, 3)); }  // sRGB -> linear
    if (at.TEXCOORD_0 != null) g.setAttribute('uv', new THREE.BufferAttribute(acc(at.TEXCOORD_0).arr, 2));
    if (p.indices != null) { const I = acc(p.indices).arr; g.setIndex(new THREE.BufferAttribute(I instanceof Uint32Array ? I : new Uint32Array(I), 1)); }
    if (!g.attributes.normal) g.computeVertexNormals(); geos.push(g); }
  return geos;
}
// Põe a malha de pé no chão, centrada em x/z, com a altura pedida.
export function normaliza(g, alt = 1.8) { g.computeBoundingBox(); const b = g.boundingBox, s = alt / (b.max.y - b.min.y);
  g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); g.scale(s, s, s); g.computeBoundingBox(); return g; }

// GLB com pele exportado pelo malha/rig_blender.py: geometria + skinIndex/skinWeight e os nomes das juntas na ordem dos índices.
export async function carregaGLBRig(url) {
  const buf = await (await fetch(url)).arrayBuffer(), dv = new DataView(buf), jl = dv.getUint32(12, true), json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl))), bin = buf.slice(20 + jl + 8);
  const acc = i => { const a = json.accessors[i], v = json.bufferViews[a.bufferView], T = TA[a.componentType], n = NC[a.type], off = (v.byteOffset || 0) + (a.byteOffset || 0), st = v.byteStride || n * T.BYTES_PER_ELEMENT;
    if (st === n * T.BYTES_PER_ELEMENT) return { arr: new T(bin.slice(off, off + a.count * st)), n, norm: a.normalized, T };
    const o = new T(a.count * n), src = new Uint8Array(bin), dst = new Uint8Array(o.buffer), w = n * T.BYTES_PER_ELEMENT; for (let k = 0; k < a.count; k++) dst.set(src.subarray(off + k * st, off + k * st + w), k * w); return { arr: o, n, norm: a.normalized, T }; };
  const p = json.meshes[0].primitives[0], at = p.attributes, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(acc(at.POSITION).arr, 3)); g.setAttribute('normal', new THREE.BufferAttribute(acc(at.NORMAL).arr, 3)); g.setAttribute('uv', new THREE.BufferAttribute(acc(at.TEXCOORD_0).arr, 2));
  const I = acc(p.indices).arr; g.setIndex(new THREE.BufferAttribute(I instanceof Uint32Array ? I : new Uint32Array(I), 1));
  const J = acc(at.JOINTS_0), Wt = acc(at.WEIGHTS_0), k = Wt.T === Float32Array ? 1 : Wt.T === Uint8Array ? 1 / 255 : 1 / 65535, w = new Float32Array(Wt.arr.length); for (let i = 0; i < w.length; i++) w[i] = Wt.arr[i] * k;
  return { g, si: new Uint16Array(J.arr), sw: w, juntas: json.skins[0].joints.map(i => json.nodes[i].name) };
}
