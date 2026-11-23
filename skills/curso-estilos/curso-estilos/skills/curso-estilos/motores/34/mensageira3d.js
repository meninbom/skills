// Ivi, a mensageira: personagem NOSSO no mesmo shader chapado do motor (2 tons + fio de luz + trama de tecido).
// Capa de chuva encerada cor de mostarda com capuz de aba dura, cachecol verde-petróleo de ponta solta,
// bolsa de couro a tiracolo, calça escura, galocha verde. Modelo olhando para +z; +x é a esquerda dela.
import * as THREE from 'three';

const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k, ss = k => { k = cl(k); return k * k * (3 - 2 * k); };
export const U = { shadeDir: { value: new THREE.Vector3(-0.4, 0.45, 0.8).normalize() }, rimDir: { value: new THREE.Vector3(-0.42, 0.2, 0.88).normalize() }, rimCol: { value: new THREE.Color(0xff9a44) }, tint: { value: new THREE.Vector3(0.8, 0.74, 0.72) }, lampPos: { value: new THREE.Vector3() }, lampK: { value: 0 } };
export const TINT = U.tint.value;
export function mat(hex, o = {}) {
  return new THREE.ShaderMaterial({ side: o.side ?? THREE.FrontSide,
    uniforms: { ...U, col: { value: new THREE.Color(hex) }, shade: { value: o.shade ?? 0.72 }, rim: { value: o.rim ?? 1 }, warm: { value: o.warm ?? 0 }, keep: { value: o.keep ?? 0 }, grain: { value: o.grain ?? 0.34 }, spec: { value: o.spec ?? 0 }, weave: { value: o.weave ?? 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP; varying vec3 vW; void main(){ vP = position * vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz)); vec4 wp = modelMatrix * vec4(position,1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform vec3 col; uniform vec3 shadeDir; uniform vec3 rimDir; uniform vec3 rimCol; uniform float shade; uniform float rim; uniform float warm; uniform float keep; uniform vec3 tint; uniform float grain; uniform float spec; uniform float weave; uniform vec3 lampPos; uniform float lampK; varying vec3 vN; varying vec3 vV; varying vec3 vP; varying vec3 vW;
      float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y), mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n;
        float l = smoothstep(-0.06, 0.06, dot(n, shadeDir));
        vec3 base = col;
        float nz = vn(vP * 22.0) * 0.5 + vn(vP * vec3(70.0, 26.0, 70.0)) * 0.3 + vn(vP * 190.0) * 0.2;
        float fold = vn(vP * vec3(26.0, 3.5, 26.0));                    // dobras compridas de pano
        base *= 1.0 + (nz - 0.5) * grain * 2.6 + (fold - 0.5) * grain * 1.6;
        // trama de tecido (urdidura x trama) presa no objeto: some de longe, aparece no close
        vec3 q = vP * 260.0; float wv = abs(sin(q.x + q.z) * sin(q.y * 1.15)); base *= 1.0 - weave * 0.16 * smoothstep(0.25, 0.9, wv);
        float nd = dot(n, shadeDir);
        vec3 c = base * mix(shade, 1.0, l);
        c *= mix(0.84, 1.08, smoothstep(-1.0, 1.0, nd));
        c *= mix(0.74, 1.0, smoothstep(-0.95, 0.25, n.y));
        c += base * spec * pow(max(dot(n, normalize(shadeDir + vV)), 0.0), 22.0);
        c = mix(c, c * vec3(1.25, 0.95, 0.7), warm * l);
        float r = smoothstep(0.35, 0.5, dot(n, rimDir)) * smoothstep(0.5, 0.78, 1.0 - max(dot(n, vV), 0.0));
        c *= mix(tint, vec3(1.0, 0.95, 0.9), keep);
        c = mix(c, rimCol, r * rim * 0.9);
        // lanterna: poça de luz quente nas faces viradas para ela
        vec3 ld = lampPos - vW; float dl = length(ld); float lk = lampK * max(dot(n, ld / dl), 0.0) / (1.0 + dl * dl * 9.0);
        c += base * vec3(1.0, 0.62, 0.25) * lk * 2.2;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }` });
}
const C = { coat: 0xc98a2c, coatD: 0xa8701f, coatIn: 0x4a3418, pants: 0x2a2f3c, pantsD: 0x222632, scarf: 0x2e6a68, scarfD: 0x214f4e, skin: 0xd8956c, hair: 0x2a1c18, boot: 0x3d4a2c, bootH: 0x4a5a34, sole: 0x1e2016,
  bag: 0x7a4626, bagD: 0x5a321c, strap: 0x4a2a18, brass: 0xd8ad62, glove: 0x5a3a24 };
const Y = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), dir = new THREE.Vector3();
function between(m, a, b) { _d.subVectors(b, a); const l = _d.length(); m.position.copy(a).addScaledVector(_d, 0.5); m.quaternion.setFromUnitVectors(Y, _d.normalize()); m.scale.set(1, l, 1); }
const cyl = (rTop, rBot, hex, o) => new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, 1, 16, 1), mat(hex, o));
const ball = (r, hex, o) => new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat(hex, o));
const box = (x, y, z, hex, o) => new THREE.Mesh(new THREE.BoxGeometry(x, y, z), mat(hex, o));

function foot(ph, s, lift) {
  if (ph < 0.56) { const u = ph / 0.56; return { z: lerp(s * 0.52, -s * 0.48, u), y: 0, a: u < 0.14 ? lerp(-0.32, 0, u / 0.14) : u > 0.72 ? lerp(0, 0.5, (u - 0.72) / 0.28) : 0 }; }
  const u = (ph - 0.56) / 0.44, e = ss(u);
  return { z: lerp(-s * 0.48, s * 0.52, e), y: Math.sin(Math.PI * Math.pow(u, 0.8)) * lift + 0.05 * (1 - u) * (1 - u), a: lerp(0.5, -0.32, Math.pow(u, 0.7)) + Math.sin(Math.PI * u) * 0.3 };
}
function ik(h, f, l1, l2, out) {
  let dz = f.z - h.z, dy = f.y - h.y, d = Math.hypot(dz, dy); const m = l1 + l2 - 0.003; if (d > m) { dz *= m / d; dy *= m / d; d = m; }
  const a = Math.atan2(dy, dz), b = Math.acos(cl((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), ka = a + b;
  out.k.set(h.x, h.y + Math.sin(ka) * l1, h.z + Math.cos(ka) * l1); out.f.set(h.x, h.y + dy, h.z + dz);
}
function makeBoot() { // galocha: cano largo e liso, bico redondo, solado grosso com friso
  const g = new THREE.Group(), shaft = new THREE.Group(), ft = new THREE.Group(); g.add(shaft, ft);
  const s = cyl(0.118, 0.095, C.boot, { spec: 0.6, grain: 0.18 }); s.scale.y = 0.3; s.position.y = 0.12; shaft.add(s);
  const cuff = cyl(0.122, 0.12, C.bootH, { spec: 0.5 }); cuff.scale.y = 0.035; cuff.position.y = 0.27; shaft.add(cuff);
  const body = ball(1, C.boot, { spec: 0.65, grain: 0.18 }); body.scale.set(0.092, 0.078, 0.165); body.position.set(0, -0.012, 0.085); ft.add(body);
  const toe = ball(1, C.bootH, { spec: 0.7, grain: 0.18 }); toe.scale.set(0.078, 0.055, 0.09); toe.position.set(0, -0.02, 0.175); ft.add(toe);
  const sole = box(0.17, 0.04, 0.34, C.sole); sole.position.set(0, -0.072, 0.075); ft.add(sole);
  const rib = box(0.174, 0.012, 0.344, 0x8a7a52, { rim: 0 }); rib.position.set(0, -0.05, 0.075); ft.add(rib);
  return { g, shaft, ft };
}

export function criaIvi() {
  const root = new THREE.Group(), eyes = [];
  const add = m => { root.add(m); return m; };
  const L = { th: 0.39, sh: 0.39, hipX: 0.08, ank: 0.088 };
  const legs = [1, -1].map(sx => ({ sx, thigh: add(cyl(0.068, 0.09, sx > 0 ? C.pantsD : C.pants, { weave: 1 })), shin: add(cyl(0.056, 0.068, sx > 0 ? C.pantsD : C.pants, { weave: 1 })), knee: add(ball(0.068, sx > 0 ? C.pantsD : C.pants)), boot: makeBoot(), q: { k: new THREE.Vector3(), f: new THREE.Vector3() } }));
  legs.forEach(l => add(l.boot.g));
  const body = new THREE.Group(); add(body);
  const OIL = { spec: 0.42, grain: 0.26, weave: 0.6 };
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.165, 0.54, 28, 1), mat(C.coat, OIL)); chest.scale.z = 0.66; chest.position.y = 0.28; body.add(chest);
  // vista da capa: faixa mais escura com botões de chifre
  const plk = box(0.05, 0.5, 0.02, C.coatD, OIL); plk.position.set(0, 0.27, 0.112); body.add(plk);
  for (let i = 0; i < 4; i++) { const bt = ball(0.014, 0x3a2a1c, { rim: 0 }); bt.scale.z = 0.5; bt.position.set(0, 0.08 + i * 0.12, 0.124); body.add(bt); }
  const hipG = new THREE.Group(); add(hipG);
  const pelvis = ball(1, C.coat, OIL); pelvis.scale.set(0.168, 0.11, 0.114); pelvis.position.y = -0.03; hipG.add(pelvis);
  // aba longa da capa (até o joelho), aberta em baixo: segue as coxas e voa para trás na corrida
  const SK_H = 0.4;
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.166, 0.25, SK_H, 32, 5, true), mat(C.coat, { ...OIL, side: THREE.DoubleSide })); skirt.scale.z = 0.76; skirt.position.y = -0.03 - SK_H / 2; hipG.add(skirt);
  const skP = skirt.geometry.attributes.position, skB = skP.array.slice();
  const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.252, 0.03, 32, 1, true), mat(C.coatD, { ...OIL, side: THREE.DoubleSide })); hem.visible = false;
  const shd = box(0.38, 0.09, 0.18, C.coat, OIL); shd.position.y = 0.5; body.add(shd);
  // pelerine curta por cima dos ombros (capa de chuva de carteiro)
  const cape = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.27, 0.24, 30, 1, true), mat(C.coatD, { ...OIL, side: THREE.DoubleSide })); cape.scale.z = 0.78; cape.position.set(0, 0.45, -0.005); body.add(cape);
  const capeP = cape.geometry.attributes.position, capeB = capeP.array.slice();
  // cachecol: gola grossa + ponta solta que voa
  const coll = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.045, 10, 24), mat(C.scarf, { weave: 1.2, grain: 0.4 })); coll.rotation.x = Math.PI / 2; coll.scale.set(1, 0.85, 1.25); coll.position.set(0, 0.585, 0.0); body.add(coll);
  const tail = []; { let par = body, px = 0.07, py = 0.57, pz = -0.08; for (let i = 0; i < 4; i++) { const g = new THREE.Group(); g.position.set(px, py, pz); par.add(g); const m = box(0.07, 0.11, 0.018, i % 2 ? C.scarfD : C.scarf, { weave: 1.2, grain: 0.4, side: THREE.DoubleSide }); m.position.y = -0.05; g.add(m); tail.push(g); par = g; px = 0; py = -0.1; pz = 0; }
    const fr = box(0.07, 0.03, 0.02, 0xd8c8a0, { rim: 0 }); fr.position.y = -0.11; tail[3].add(fr); }
  // bolsa de couro a tiracolo (alça do ombro direito ao quadril esquerdo)
  const strapF = cyl(0.012, 0.012, C.strap); const strapB = cyl(0.012, 0.012, C.strap); body.add(strapF, strapB);
  between(strapF, new THREE.Vector3(-0.15, 0.52, 0.07), new THREE.Vector3(0.16, -0.02, 0.12)); between(strapB, new THREE.Vector3(-0.15, 0.52, -0.06), new THREE.Vector3(0.17, -0.02, -0.11));
  const bag = new THREE.Group(); bag.position.set(0.205, -0.06, 0.0); body.add(bag);
  { const b = box(0.07, 0.2, 0.26, C.bag, { spec: 0.3 }); bag.add(b); const f = box(0.075, 0.1, 0.27, C.bagD, { spec: 0.3 }); f.position.y = 0.06; f.position.x = 0.004; bag.add(f);
    const k = box(0.08, 0.035, 0.03, C.brass, { rim: 0, spec: 0.8 }); k.position.set(0.004, 0.02, 0.0); bag.add(k);
    const env = box(0.012, 0.07, 0.15, 0xe8dcc0, { rim: 0.5, shade: 0.85 }); env.position.set(-0.03, 0.12, 0.03); env.rotation.x = 0.15; bag.add(env); }
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 28, 1), mat(C.strap, { spec: 0.3 })); belt.scale.z = 0.68; belt.position.y = 0.03; body.add(belt);
  const neck = cyl(0.045, 0.05, 0xa8684a, { shade: 0.7, rim: 0 }); neck.scale.y = 0.1; neck.position.set(0, 0.57, 0.01); body.add(neck);
  // cabeça: rosto redondo com sardas; capuz de aba dura (bico do lado da testa) e ponta para trás
  const head = new THREE.Group(); head.position.set(0, 0.79, 0.025); head.scale.setScalar(1.1); body.add(head);
  const face = ball(0.13, C.skin, { shade: 0.8, keep: 0.45, grain: 0.05 }); face.scale.set(1.02, 1.0, 0.98); face.position.z = 0.012; head.add(face);
  const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.136, 24, 10, -Math.PI * 0.45, Math.PI * 0.9, 0.2, Math.PI * 0.3), mat(C.hair, { rim: 0, grain: 0.1 })); fringe.rotation.x = -0.25; head.add(fringe);
  const hoodG = new THREE.SphereGeometry(0.178, 32, 20, 0, Math.PI * 2, 1.02, Math.PI - 1.02).rotateX(Math.PI / 2);
  const hood = new THREE.Mesh(hoodG, mat(C.coat, { ...OIL, shade: 0.78 })); hood.scale.set(1.0, 1.08, 1.08); hood.position.set(0, 0.018, -0.04); head.add(hood);
  const hoodIn = new THREE.Mesh(hoodG, mat(C.coatIn, { side: THREE.BackSide, rim: 0, shade: 1 })); hoodIn.scale.set(0.97, 1.05, 1.05); hoodIn.position.copy(hood.position); head.add(hoodIn);
  const seam = new THREE.Mesh(new THREE.TorusGeometry(0.183, 0.007, 6, 40, Math.PI * 1.15), mat(C.coatD, { rim: 0.5 })); seam.rotation.set(0, Math.PI / 2, Math.PI * 0.42); seam.position.set(0, 0.018, -0.04); seam.scale.set(1.12, 1.12, 1.1); seam.visible = false; head.add(seam);
  for (const sx of [1, -1]) { const ds = cyl(0.005, 0.005, 0xe8dcc0, { rim: 0 }); ds.scale.y = 0.13; ds.position.set(sx * 0.07, -0.17, 0.1); ds.rotation.z = sx * 0.1; head.add(ds); const tip = ball(0.011, 0x3a2a1c, { rim: 0 }); tip.position.set(sx * 0.076, -0.235, 0.1); head.add(tip); }
  const peak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 14), mat(C.coat, { ...OIL, shade: 0.78 })); peak.rotation.x = -2.2; peak.position.set(0, 0.06, -0.2); head.add(peak);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.215, 0.016, 28, 1, false, -0.85, 1.7), mat(C.coatD, { ...OIL, side: THREE.DoubleSide })); brim.position.set(0, 0.125, 0.03); brim.rotation.x = 0.28; brim.visible = false; head.add(brim);
  for (const sx of [1, -1]) { const e = ball(0.014, C.hair, { rim: 0, shade: 1 }); e.scale.set(1, 1.25, 0.6); e.position.set(sx * 0.044, 0.002, 0.124); head.add(e); eyes.push(e);
    const hl = ball(0.004, 0xffffff, { rim: 0, shade: 1, keep: 1 }); hl.position.set(sx * 0.044 + 0.004, 0.008, 0.132); head.add(hl);
    const b = box(0.045, 0.012, 0.01, C.hair, { rim: 0, shade: 1 }); b.position.set(sx * 0.047, 0.045, 0.124); b.rotation.z = -sx * 0.12; b.rotation.y = sx * 0.3; head.add(b);
    const ck = ball(0.024, 0xd8705a, { rim: 0, shade: 0.9, keep: 0.5 }); ck.scale.set(1, 0.6, 0.3); ck.position.set(sx * 0.072, -0.03, 0.105); head.add(ck);
    for (let k = 0; k < 3; k++) { const fk = ball(0.004, 0x8a4a30, { rim: 0, shade: 1 }); fk.position.set(sx * (0.055 + k * 0.012), -0.012 - (k % 2) * 0.01, 0.122 - k * 0.004); head.add(fk); } }
  const nose = ball(0.016, C.skin, { shade: 0.8, keep: 0.45, grain: 0.05 }); nose.scale.set(1, 0.8, 0.7); nose.position.set(0, -0.022, 0.13); head.add(nose);
  const mouth = box(0.032, 0.008, 0.008, 0x5a2a20, { rim: 0, shade: 1 }); mouth.position.set(0, -0.062, 0.12); head.add(mouth);
  const mouthO = ball(0.013, 0x3a1612, { rim: 0, shade: 1 }); mouthO.scale.set(1, 1.2, 0.4); mouthO.position.set(0, -0.064, 0.121); mouthO.visible = false; head.add(mouthO);
  // braços (mangas da capa) e mãos de luva
  const arm = sx => ({ sx, up: add(cyl(0.046, 0.054, sx > 0 ? C.coatD : C.coat, OIL)), lo: add(cyl(0.04, 0.048, sx > 0 ? C.coatD : C.coat, OIL)), el: add(ball(0.047, sx > 0 ? C.coatD : C.coat, OIL)), cuff: add(cyl(0.05, 0.05, C.coatD, OIL)), hand: add(ball(0.04, C.glove, { grain: 0.2 })) });
  const armL = arm(1), armR = arm(-1);

  const v = (x, y, z) => new THREE.Vector3(x, y, z), hip = v(0, 0, 0), a = v(0, 0, 0), b = v(0, 0, 0), c = v(0, 0, 0), tgt = v(0, 0, 0);
  // UD: run (0..1), lean, headYaw, headPitch, reach (0..1) + reachPt (local da raiz), puff (fôlego), wind
  function update(t, V, T) {
    root.updateMatrixWorld(true);
    const UD = root.userData, run = UD.run ?? 0;
    const ph = (t / T) % 1, s = V * T / 2, tw = ph * 2 * Math.PI, lift = 0.12 + run * 0.1;
    const bob = V > 0.05 ? -Math.cos(tw * 2) * (0.018 + run * 0.03) : Math.sin(t * (2.2 + (UD.puff ?? 0) * 5)) * (0.004 + (UD.puff ?? 0) * 0.012) - 0.012;
    const hipY = 0.83 + bob - run * 0.04, sw = V > 0.05 ? Math.sin(tw + 0.5) : 0.1;
    legs.forEach((l, i) => {
      const f = V > 0.05 ? foot((ph + (i ? 0.5 : 0)) % 1, s, lift) : { z: (UD.stance ?? 0) * (i ? -0.08 : 0.1), y: 0, a: 0 }; hip.set(l.sx * L.hipX, hipY, 0); a.set(l.sx * L.hipX, L.ank + f.y, f.z); ik(hip, a, L.th, L.sh, l.q);
      between(l.thigh, hip, l.q.k); between(l.shin, l.q.k, l.q.f); l.knee.position.copy(l.q.k);
      l.boot.g.position.copy(l.q.f); _d.subVectors(l.q.k, l.q.f).normalize(); l.boot.shaft.quaternion.setFromUnitVectors(Y, _d); l.boot.ft.rotation.x = f.a;
    });
    const wind = UD.wind ?? 0;
    { const zl = legs[0].q.k.z * 0.6, zr = legs[1].q.k.z * 0.6, back = run * 0.09 + wind * 0.05;
      for (let i = 0; i < skP.count; i++) { const by = skB[i * 3 + 1], k = cl(0.5 - by / SK_H), x = skB[i * 3], bz = skB[i * 3 + 2], w = ss(x / 0.48 + 0.5), dz = lerp(zr, zl, w);
        const fl = Math.sin(t * 10 + x * 14 + by * 9) * 0.018 * (run + wind * 0.6) * k;
        skP.setX(i, x * (1 + k * run * 0.1)); skP.setZ(i, bz + k * (dz / 0.76 + Math.sign(bz) * Math.max(0, Math.sign(bz) * dz) * 0.3 - back / 0.76 * (1 + Math.sin(t * 7.3 + x * 6) * 0.25)) + fl);
        skP.setY(i, by + k * k * back * 0.5); }
      skP.needsUpdate = true; skirt.geometry.computeVertexNormals();
      for (let i = 0; i < capeP.count; i++) { const by = capeB[i * 3 + 1]; if (by > 0) continue; const x = capeB[i * 3], bz = capeB[i * 3 + 2];
        capeP.setZ(i, bz - (bz < 0 ? 1 : 0.4) * (run * 0.05 + wind * 0.03) + Math.sin(t * 11 + x * 12) * 0.008 * (run + wind)); capeP.setY(i, by + (bz < 0 ? 1 : 0.3) * run * 0.03); }
      capeP.needsUpdate = true; cape.geometry.computeVertexNormals(); }
    const tw2 = V > 0.05 ? Math.sin(tw) * (0.09 + run * 0.06) : 0;
    hipG.position.set(0, hipY, 0); hipG.rotation.set(0.06 + run * 0.1, tw2 * 0.3, 0);
    body.position.set(0, hipY, 0); body.rotation.set(0.08 + run * 0.18 + (UD.lean ?? 0), tw2, 0); body.updateMatrixWorld(true);
    head.rotation.set((UD.headPitch ?? 0) - run * 0.16, (UD.headYaw ?? 0) - tw2, UD.headRoll ?? 0);
    mouthO.visible = (UD.puff ?? 0) > 0.3 && Math.sin(t * 7) > -0.2; mouth.visible = !mouthO.visible;
    // ponta do cachecol: corrente de 4 elos que pende e voa para trás
    tail.forEach((g, i) => { const fly = run * 1.1 + wind * 0.7; g.rotation.set(lerp(0.08, 1.35, cl(fly)) * (i ? 0.55 : 1) + Math.sin(t * 9 - i * 0.9) * 0.18 * (0.3 + fly), Math.sin(t * 5.3 - i) * 0.12 * fly, 0); });
    bag.rotation.set(0, 0, -0.1 + (V > 0.05 ? Math.sin(tw * 2) * 0.08 * (1 + run) : 0));
    const shY = 0.49;
    // braço esquerdo (+x): balança contra a perna; mais forte na corrida
    { const s0 = body.localToWorld(v(0.195, shY, 0)); root.worldToLocal(s0); const amp = 0.35 + run * 0.6, a1 = -sw * amp - 0.05, a2 = a1 + 0.3 + run * 1.0 + cl(-sw) * 0.3;
      b.set(s0.x + 0.03, s0.y - Math.cos(a1) * 0.27, s0.z + Math.sin(a1) * 0.27); c.set(b.x - 0.01 * run, b.y - Math.cos(a2) * 0.26, b.z + Math.sin(a2) * 0.26);
      if (UD.wipe) { const q = UD.wipe; b.lerp(v(s0.x + 0.04, s0.y - 0.16, s0.z + 0.2), q); c.lerp(v(0.04, s0.y + 0.25, 0.22), q); }
      between(armL.up, b, s0); between(armL.lo, c, b); armL.el.position.copy(b); dir.subVectors(c, b).normalize();
      a.copy(c).addScaledVector(dir, -0.07); between(armL.cuff, a, c); armL.hand.position.copy(c).addScaledVector(dir, 0.025); }
    // braço direito (-x): segura a lanterna à frente do corpo; ou estende até o gancho (reach)
    { const s0 = body.localToWorld(v(-0.195, shY, 0)); root.worldToLocal(s0); const k = V > 0.05 ? Math.sin(tw) * 0.05 * (1 + run) : 0;
      b.set(s0.x - 0.05, s0.y - 0.25, s0.z + 0.06 + k); c.set(s0.x - 0.07, s0.y - 0.31 + run * 0.08, s0.z + 0.3 + k * 1.5);
      const r = ss(UD.reach ?? 0); if (r > 0 && UD.reachPt) { tgt.copy(UD.reachPt); const d = tgt.distanceTo(s0), m = 0.54; if (d > m) tgt.sub(s0).multiplyScalar(m / d).add(s0);
        const mid = v((s0.x + tgt.x) / 2 - 0.08, (s0.y + tgt.y) / 2 - 0.02, (s0.z + tgt.z) / 2 + 0.04); b.lerp(mid, r); c.lerp(tgt, r); }
      between(armR.up, b, s0); between(armR.lo, c, b); armR.el.position.copy(b); dir.subVectors(c, b).normalize();
      a.copy(c).addScaledVector(dir, -0.07); between(armR.cuff, a, c); armR.hand.position.copy(c).addScaledVector(dir, 0.03); }
  }
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  Object.assign(root.userData, { eyes, face, head, handL: armL.hand, handR: armR.hand });
  return { root, update };
}
