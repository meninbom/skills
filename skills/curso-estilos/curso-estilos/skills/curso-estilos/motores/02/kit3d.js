// Kit do boneco 3D chapado: material, primitivas, passo e IK (vem do battle mage): formas simples (cilindros afilados, caixas, esferas) com cor quase lisa em 2 tons
// e um fio de luz laranja nas bordas viradas para o sol. Modelo olhando para +z; +x é a esquerda dele.
import * as THREE from 'three';
export const TX = 1;
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const KEYS = ['wood','navy','leather','gold','steel','crimson','roof','plank','brick','zskin','grass','dirt','redbarn','siding','canvas','fur','bark'];
export const IMG = Object.fromEntries(await Promise.all(KEYS.map(async k => [k, await loadImg('tex/' + k + '.jpg')])));
// pinta a imagem (miolo, sem a moldura) e puxa a cor para a paleta da peça
export function paint(g, w, h, key, tint, a = 0.55, crop = 0.16, rot = false) { const im = IMG[key]; if (!im) return false; const c = im.width * crop, sz = im.width - 2 * c;
  if (rot) { g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI / 2); g.drawImage(im, c, c, sz, sz, -h / 2, -w / 2, h, w); g.restore(); } else g.drawImage(im, c, c, sz, sz, 0, 0, w, h);
  if (tint) { g.save(); g.globalCompositeOperation = 'color'; g.globalAlpha = a; g.fillStyle = tint; g.fillRect(0, 0, w, h); g.restore(); } return true; }
export const AUTO = new Map();

export const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k, ss = k => { k = cl(k); return k * k * (3 - 2 * k); };
const U = { shadeDir: { value: new THREE.Vector3(0.45, 0.55, 0.7).normalize() }, rimDir: { value: new THREE.Vector3(-0.9, 0.25, -0.35).normalize() }, rimCol: { value: new THREE.Color(0xff8a34) }, tint: { value: new THREE.Vector3(0.8, 0.74, 0.72) } };
export const TINT = U.tint.value;
export const PBR = new URLSearchParams(location.search).has('pbr');
// material físico (o do filme do Adonis): reage ao sol, às luzes e ao reflexo do céu; o fio de luz da borda continua
function matP(hex, o) {
  if ((o.keep ?? 0) >= 1) return new THREE.MeshBasicMaterial({ color: hex, map: o.map ?? null, side: o.side ?? THREE.FrontSide });
  const metal = o.metal ?? 0, m = new THREE.MeshStandardMaterial({ color: hex, map: o.map ?? null, side: o.side ?? THREE.FrontSide, metalness: metal * 0.8, roughness: o.rough ?? (metal ? 0.36 : Math.max(0.42, 0.92 - (o.spec ?? 0) * 0.9)), envMapIntensity: metal ? 1.3 : 0.55,
    bumpMap: o.bump === 0 ? null : (o.map ?? null), bumpScale: o.map ? (o.bump ?? (metal ? 1.0 : 2.2)) : 0 });
  if ((o.keep ?? 0) > 0) { m.emissive = new THREE.Color(hex).multiplyScalar(0.06 * o.keep); m.emissiveMap = o.map ?? null; }
  const rimK = o.rim ?? 1;
  m.onBeforeCompile = sh => { sh.uniforms.rimDirW = U.rimDir; sh.uniforms.rimColP = U.rimCol; sh.uniforms.rimK = { value: rimK };
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 rimDirW; uniform vec3 rimColP; uniform float rimK;')
      .replace('#include <opaque_fragment>', 'vec3 rdv = normalize((viewMatrix * vec4(rimDirW, 0.0)).xyz); float rimF = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), 2.4) * smoothstep(0.05, 0.65, dot(normalize(normal), rdv)); outgoingLight += rimColP * rimK * rimF * 0.7;\n#include <opaque_fragment>'); };
  return m; }
export function mat(hex, o = {}) {
  { const am = !o.map && AUTO.get(hex); if (am) { o = { ...o, map: am }; hex = 0xffffff; } }
  if (PBR) return matP(hex, o);
  return new THREE.ShaderMaterial({ side: o.side ?? THREE.FrontSide,
    uniforms: { ...U, col: { value: new THREE.Color(hex) }, shade: { value: o.shade ?? 0.74 }, rim: { value: o.rim ?? 1 }, warm: { value: o.warm ?? 0 }, keep: { value: o.keep ?? 0 }, grain: { value: o.grain ?? 0.34 }, spec: { value: o.spec ?? 0 }, metal: { value: o.metal ?? 0 }, bump: { value: (TX & 2) ? (o.bump ?? 1) : 0 }, map: { value: o.map ?? null }, useMap: { value: o.map ? 1 : 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vP; varying vec3 vW; void main(){ vUv = uv; vW = (modelMatrix * vec4(position,1.0)).xyz; vP = position * vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz)); vec4 wp = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform vec3 col; uniform vec3 shadeDir; uniform vec3 rimDir; uniform vec3 rimCol; uniform float shade; uniform float rim; uniform float warm; uniform float keep; uniform vec3 tint; uniform sampler2D map; uniform float useMap; uniform float grain; uniform float spec; uniform float metal; uniform float bump; varying vec3 vW; varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vP;
      float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y), mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n;
                vec3 base = col; if (useMap > 0.5) base *= texture2D(map, vUv).rgb;
        float nz = vn(vP * 22.0) * 0.5 + vn(vP * vec3(70.0, 26.0, 70.0)) * 0.3 + vn(vP * 190.0) * 0.2;
        float fold = vn(vP * vec3(26.0, 3.5, 26.0));                    // dobras compridas de pano
        base *= 1.0 + (nz - 0.5) * grain * 2.6 + (fold - 0.5) * grain * 1.6;
        if (bump > 0.0) { float hgt = useMap > 0.5 ? dot(texture2D(map, vUv).rgb, vec3(0.45)) : vn(vP * 22.0) * 0.5 + fold * 0.5;
          vec3 dpx = dFdx(vW), dpy = dFdy(vW); float dhx = dFdx(hgt), dhy = dFdy(hgt); vec3 r1 = cross(dpy, n), r2 = cross(n, dpx); float det = dot(dpx, r1);
          n = normalize(abs(det) * n - bump * 0.01 * sign(det) * (dhx * r1 + dhy * r2)); }
        float l = smoothstep(-0.06, 0.06, dot(n, shadeDir));
        float nd = dot(n, shadeDir);
        vec3 c = base * mix(shade, 1.0, l);
        c *= mix(0.84, 1.08, smoothstep(-1.0, 1.0, nd));            // degradê suave por cima dos 2 tons
        c *= mix(0.74, 1.0, smoothstep(-0.95, 0.25, n.y));           // escurece o que olha para baixo
        c += base * spec * pow(max(dot(n, normalize(shadeDir + vV)), 0.0), 18.0);
        if (metal > 0.0) { vec3 rf = reflect(-vV, n); vec3 env = mix(vec3(0.30, 0.2, 0.15), vec3(0.5, 0.58, 0.7), smoothstep(-0.35, 0.55, rf.y)); env += vec3(1.0, 0.75, 0.5) * pow(max(dot(rf, -rimDir), 0.0), 6.0) * 0.5;
          c = mix(c, base * env * 1.35, metal * 0.6); c += vec3(1.0, 0.95, 0.9) * metal * pow(max(dot(n, normalize(shadeDir + vV)), 0.0), 60.0) * 0.6; }
        c = mix(c, c * vec3(1.25, 0.95, 0.7), warm * l);
        float r = smoothstep(0.35, 0.5, dot(n, rimDir)) * smoothstep(0.5, 0.78, 1.0 - max(dot(n, vV), 0.0));
        c *= mix(tint, vec3(1.0, 0.95, 0.9), keep);   // integra na cena (sombra da mata nos planos A/B, clarão laranja no C)
        c = mix(c, rimCol, r * rim * 0.9);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }` });
}
const C = { cloth: 0x4b3a36, clothD: 0x3b2e2c, back: 0x30252a, hood: 0x5e463d, hoodIn: 0x271c1c, skin: 0xee7d30, hair: 0x1a1413, belt: 0x8f5f36, gold: 0xd8ad62,
  boot: 0x6e3519, bootH: 0x7e3f1c, sole: 0x4a2414, strap: 0xc046c4, strapD: 0x4a2030, feather: 0xc860d8, featherD: 0x9538a8, glove: 0x221a1c, steel: 0xcdbfae, sheath: 0xa05a2c };
const Y = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), dir = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1);
export function between(m, a, b) { _d.subVectors(b, a); const l = _d.length(); m.position.copy(a).addScaledVector(_d, 0.5); m.quaternion.setFromUnitVectors(Y, _d.normalize()); m.scale.set(1, l, 1); }
export const cyl = (rTop, rBot, hex, o) => new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, 1, 16, 1), mat(hex, o));   // topo = ponta b
export const ball = (r, hex, o) => new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat(hex, o));
export const box = (x, y, z, hex, o) => new THREE.Mesh(new THREE.BoxGeometry(x, y, z), mat(hex, o));

export function foot(ph, s) { // ciclo do pé ao longo do eixo de avanço
  if (ph < 0.58) { const u = ph / 0.58; return { z: lerp(s * 0.52, -s * 0.48, u), y: 0, a: u < 0.14 ? lerp(-0.32, 0, u / 0.14) : u > 0.72 ? lerp(0, 0.5, (u - 0.72) / 0.28) : 0 }; }
  const u = (ph - 0.58) / 0.42, e = ss(u);
  return { z: lerp(-s * 0.48, s * 0.52, e), y: Math.sin(Math.PI * Math.pow(u, 0.8)) * 0.15 + 0.05 * (1 - u) * (1 - u), a: lerp(0.5, -0.32, Math.pow(u, 0.7)) + Math.sin(Math.PI * u) * 0.3 };
}
export function ik(h, f, l1, l2, out) { // joelho dobra para a frente (+z), no plano y-z
  let dz = f.z - h.z, dy = f.y - h.y, d = Math.hypot(dz, dy); const m = l1 + l2 - 0.003; if (d > m) { dz *= m / d; dy *= m / d; d = m; }
  const a = Math.atan2(dy, dz), b = Math.acos(cl((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), ka = a + b;
  out.k.set(h.x, h.y + Math.sin(ka) * l1, h.z + Math.cos(ka) * l1); out.f.set(h.x, h.y + dy, h.z + dz);
}


export const rnd = s0 => { let s = s0; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
export const mkTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
// textura lisa pintada: imagem + cor da peça
export const plain = (key, tint, a = 0.5, crop = 0.05, dk = 0, sz = 512) => mkTex(sz, sz, (g, w, h) => { g.fillStyle = tint; g.fillRect(0, 0, w, h); paint(g, w, h, key, tint, a, crop); if (dk) { g.fillStyle = `rgba(0,0,0,${dk})`; g.fillRect(0, 0, w, h); } });
export const mesh = (geo, hex, o) => new THREE.Mesh(geo, mat(hex, o));
export { THREE, Y, U };
