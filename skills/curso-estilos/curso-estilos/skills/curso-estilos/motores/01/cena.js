// POV: o elevador parou no 13 — peça original, 100% código.
// Pipeline por quadro: cubemap de cor (toon próprio) + cubemap de normal/distância → passe final com olho de peixe,
// contorno detectado em pixels de SAÍDA (largura igual em tudo), céu em degradê, vinheta. Texto 2D por cima.
import * as THREE from 'three';
import * as TX from './texturas.js';
import { montar } from './elevador.js';
import { camAt, END } from './camera.js';
THREE.ColorManagement.enabled = false;
console.log('ini'); await document.fonts.load('800 40px Rubik'); console.log('fonte ok');
const Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') || 1.5), CUBE = +(Q.get('cube') || 2048);
const W = 1080, H = 1920;
const glc = document.createElement('canvas'); glc.width = W * SS; glc.height = H * SS;
const R = new THREE.WebGLRenderer({ canvas: glc, antialias: false, preserveDrawingBuffer: true });
R.outputColorSpace = THREE.LinearSRGBColorSpace; R.setPixelRatio(1); R.setSize(W * SS, H * SS, false);
const out = document.getElementById('c'), g2 = out.getContext('2d');

// ---------- luz / sombras compartilhadas ----------
export const SUN = new THREE.Vector3(0.05, 0.95, 0.3).normalize();
const MAXS = 160, MAXG = 40;
const U = {
  uSun: { value: SUN }, uRef: { value: new THREE.Vector3(0, 0.85, 0) }, uFall: { value: new THREE.Vector3(0.25, 2.4, 0.34) }, uLuzP: { value: new THREE.Vector3() }, uLuzI: { value: 0 }, uLuzC: { value: new THREE.Vector3(1, 0.85, 0.4) }, uSph: { value: Array.from({ length: MAXS }, () => new THREE.Vector4(0, -99, 0, 0)) }, uNs: { value: 0 },
  uFogC: { value: new THREE.Vector3(0.04, 0.04, 0.035) }, uFog: { value: new THREE.Vector3(5, 40, 0.92) },
  uSeg: { value: Array.from({ length: MAXG * 2 }, () => new THREE.Vector4(0, -99, 0, 0)) }, uNg: { value: 0 },
};
const VS = `varying vec3 vP; varying vec3 vN; varying vec2 vUv;
void main(){ vec4 w = modelMatrix*vec4(position,1.); vP = w.xyz; vN = normalize(mat3(modelMatrix)*normal); vUv = uv; gl_Position = projectionMatrix*viewMatrix*w; }`;
const FS = `uniform sampler2D uTex; uniform float uScale; uniform vec3 uCol; uniform int uMode; uniform float uId; uniform float uTube; uniform float uEmis;
uniform vec3 uFogC; uniform vec3 uFog; uniform vec3 uSun; uniform vec3 uRef; uniform vec3 uFall; uniform vec3 uLuzP; uniform float uLuzI; uniform vec3 uLuzC; uniform float uRec; uniform vec4 uSph[${MAXS}]; uniform int uNs; uniform vec4 uSeg[${MAXG * 2}]; uniform int uNg;
varying vec3 vP; varying vec3 vN; varying vec2 vUv;
float sphShadow(vec3 P){ float s=0.; for(int i=0;i<${MAXS};i++){ if(i>=uNs) break; vec3 c=uSph[i].xyz-P; float t=dot(c,uSun); if(t<=0.) continue;
  float d=length(c-uSun*t); float r=uSph[i].w; s=max(s, 1.-smoothstep(r*0.78, r*1.05, d)); } return s; }
float segShadow(vec3 P){ float s=0.; for(int i=0;i<${MAXG};i++){ if(i>=uNg) break; vec3 a=uSeg[2*i].xyz, b=uSeg[2*i+1].xyz; float r=uSeg[2*i].w;
  // distância entre o raio P+uSun*t e o segmento ab
  vec3 u=uSun, v=b-a, w0=P-a; float A=dot(u,u),B=dot(u,v),C=dot(v,v),D=dot(u,w0),E=dot(v,w0); float den=A*C-B*B; if(den<1e-6) continue;
  float sc=(B*E-C*D)/den, tc=clamp((A*E-B*D)/den,0.,1.); if(sc<=0.02) continue; sc=max(sc,0.); vec3 d=(w0+sc*u)-tc*v; float dist=length(d);
  s=max(s, 1.-smoothstep(r*0.7, r*1.25, dist)); } return s; }
void main(){
  vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n;
  vec3 base;
  if(uMode==0){ vec3 w = pow(abs(n), vec3(4.)); w/= (w.x+w.y+w.z);
    base = texture2D(uTex, vP.zy*uScale).rgb*w.x + texture2D(uTex, vP.xz*uScale).rgb*w.y + texture2D(uTex, vP.xy*uScale).rgb*w.z; }
  else if(uMode==1){ vec4 tx = texture2D(uTex, vUv); if(uRec>0.5 && tx.a<0.5) discard; base = tx.rgb; } else base = vec3(1.);
  base *= uCol;
  float lam = dot(n, uSun);
  float lit = smoothstep(-0.55, 0.3, lam);
  float sh = max(sphShadow(vP + n*0.02), segShadow(vP + n*0.02));
  lit *= (1. - 0.72*sh);
  vec3 shadowCol = base*vec3(0.6,0.5,0.74);
  vec3 litCol = base*vec3(1.16,1.0,0.76);
  vec3 col = mix(shadowCol, litCol, lit) + base*0.06*max(n.y,0.);
  float dist = length(vP - cameraPosition);
  if(uTube>0.5 && !gl_FrontFacing){ col *= mix(1.0, uFall.z, smoothstep(uFall.x, uFall.y, length(vP - uRef))) * mix(0.52, 1.0, smoothstep(-0.7, 0.6, n.y)); }
  col = mix(col, base, uEmis);
  if(uLuzI>0.){ vec3 dl = vP-uLuzP; col += base*uLuzC*uLuzI/(1.+dot(dl,dl)*0.35); }
  col = mix(col, uFogC, smoothstep(uFog.x, uFog.y, dist)*uFog.z);
  gl_FragColor = vec4(col, uId/255.);
}`;
let NEXT_ID = 1;
export function toon(tex, scale = 1, col = 0xffffff, opt = {}) {
  const c = new THREE.Color(col);
  const m = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, side: opt.side ?? THREE.FrontSide,
    uniforms: { ...U, uTex: { value: tex || TX.texPlano('#ffffff') }, uScale: { value: scale }, uCol: { value: new THREE.Vector3(c.r, c.g, c.b) },
      uMode: { value: opt.mode ?? (tex ? 0 : 2) }, uId: { value: 0 }, uTube: { value: opt.tube ? 1 : 0 }, uEmis: { value: opt.emis ?? 0 }, uRec: { value: opt.recorte ? 1 : 0 } } });
  return m;
}
// id por malha (para o contorno entre objetos que se tocam)
export function marcaId(obj) {
  obj.traverse(o => { if (!o.isMesh) return; const id = (NEXT_ID++ * 37) % 251 + 2; o.userData.id = id;
    o.onBeforeRender = (r, s, c, geo, mat) => { if (mat.uniforms && mat.uniforms.uId) { mat.uniforms.uId.value = id; mat.uniformsNeedUpdate = true; } }; });
}
export function addSombraEsfera(p, r) { if (U.uNs.value >= MAXS) return; const i = U.uNs.value++; U.uSph.value[i].set(p.x, p.y, p.z, r); }
export function addSombraSeg(a, b, r) { if (U.uNg.value >= MAXG) return; const i = U.uNg.value++; U.uSeg.value[2 * i].set(a.x, a.y, a.z, r); U.uSeg.value[2 * i + 1].set(b.x, b.y, b.z, r); }

const scene = new THREE.Scene();
console.log('montando'); const EL = montar(scene, { toon, marcaId });
const PAPEIS = []; scene.traverse(o => { if (o.isMesh && o.material.uniforms && o.material.uniforms.uRec && o.material.uniforms.uRec.value > 0.5) PAPEIS.push(o); });

// ---------- passes de cubo ----------
const rtCol = new THREE.WebGLCubeRenderTarget(CUBE, { type: THREE.UnsignedByteType, generateMipmaps: false, minFilter: THREE.LinearFilter });
const rtNrm = new THREE.WebGLCubeRenderTarget(CUBE, { type: THREE.HalfFloatType, generateMipmaps: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const camCol = new THREE.CubeCamera(0.03, 400, rtCol), camNrm = new THREE.CubeCamera(0.03, 400, rtNrm);
scene.add(camCol, camNrm);
const nrmMat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: VS,
  fragmentShader: `varying vec3 vP; varying vec3 vN; void main(){ vec3 n=normalize(vN); if(!gl_FrontFacing) n=-n; gl_FragColor=vec4(n, length(vP-cameraPosition)); }` });

// ---------- passe final ----------
const fin = new THREE.ShaderMaterial({ uniforms: {
  tCol: { value: rtCol.texture }, tNrm: { value: rtNrm.texture }, uB: { value: new THREE.Matrix3() }, uRes: { value: new THREE.Vector2(W * SS, H * SS) },
  uTan: { value: Math.tan(THREE.MathUtils.degToRad(+(Q.get('fov') || 46))) }, uK: { value: +(Q.get('k') || 0.7) }, uLine: { value: 1.25 * SS }, uT: { value: 0 }, uDark: { value: 0 }, uGrade: { value: new THREE.Vector3(1, 1, 1) }, uGlow: { value: 0 }, uFlash: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform samplerCube tCol; uniform samplerCube tNrm; uniform mat3 uB; uniform vec2 uRes; uniform float uTan; uniform float uK; uniform float uLine; uniform float uT; uniform float uDark; uniform vec3 uGrade; uniform float uGlow; uniform float uFlash;
  varying vec2 vUv;
  vec3 dirAt(vec2 px){ vec2 ndc = px/uRes*2.-1.; vec2 p = vec2(ndc.x*uRes.x/uRes.y, ndc.y); float r2=dot(p,p); float s=uTan*(1.+uK*r2); return uB*normalize(vec3(p*s,-1.)); }
  vec4 N(vec2 px){ vec4 v = textureCube(tNrm, dirAt(px)); if(v.w<=0.) v=vec4(0.,0.,0.,1e4); return v; }
  float ID(vec2 px){ return textureCube(tCol, dirAt(px)).a; }
  vec3 sky(vec3 d){ float e = clamp(d.y,-0.1,1.); float az = dot(normalize(vec3(d.x,0.,d.z)), normalize(vec3(0.7,0.,0.55)))*0.5+0.5;
    vec3 top=vec3(0.16,0.15,0.42), mid=vec3(0.36,0.26,0.54), hor=mix(vec3(0.56,0.38,0.58), vec3(0.9,0.55,0.45), pow(az,2.));
    vec3 c = mix(hor, mid, smoothstep(0.0,0.25,e)); c = mix(c, top, smoothstep(0.22,0.85,e)); return c; }
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
  void main(){
    vec2 px = vUv*uRes; vec3 d = dirAt(px);
    vec4 c0 = textureCube(tCol, d); vec4 n0 = N(px);
    vec3 col = n0.w>9e3 ? sky(d) : c0.rgb;
    float o = uLine; float e = 0.;
    vec2 offs[8]; offs[0]=vec2(o,0.); offs[1]=vec2(-o,0.); offs[2]=vec2(0.,o); offs[3]=vec2(0.,-o);
    offs[4]=vec2(o,o)*0.72; offs[5]=vec2(-o,-o)*0.72; offs[6]=vec2(o,-o)*0.72; offs[7]=vec2(-o,o)*0.72;
    float i0 = 1./n0.w;
    for(int k=0;k<8;k+=2){
      vec4 a = N(px+offs[k]), b = N(px+offs[k+1]);
      float ia=1./a.w, ib=1./b.w;
      float lap = abs(ia+ib-2.*i0)/max(i0,1e-4);
      e = max(e, smoothstep(0.035, 0.09, lap));
      // salto grande de profundidade (silhueta)
      e = max(e, smoothstep(0.10, 0.22, abs(a.w-n0.w)/min(a.w,n0.w)) * (n0.w>9e3||a.w>9e3 ? 1. : 1.));
      e = max(e, smoothstep(0.10, 0.22, abs(b.w-n0.w)/min(b.w,n0.w)));
      if(n0.w<9e3 && a.w<9e3) e = max(e, smoothstep(0.20, 0.40, 1.-dot(n0.xyz,a.xyz)));
      if(n0.w<9e3 && b.w<9e3) e = max(e, smoothstep(0.20, 0.40, 1.-dot(n0.xyz,b.xyz)));
      if(n0.w<9e3 && a.w<9e3 && abs(ID(px+offs[k])-c0.a)>0.002) e = max(e, 1.);
    }
    // traço some longe (como no desenho: casas lá atrás ainda têm traço, mas mais fino)
    col = mix(col, vec3(0.13,0.08,0.06), e*0.92);
    // vinheta + grão leve
    vec2 q = vUv-0.5; col *= 1. - 0.28*smoothstep(0.35, 0.85, length(q*vec2(1.1,0.75)));
    col += (hash(px+uT)-0.5)*0.018;
    col *= uGrade;
    float rg = length((vUv-vec2(0.5,0.6))*vec2(1.,1.6)); col += vec3(1.,0.88,0.5)*uGlow*exp(-rg*rg*9.);
    col *= 1.-uDark; col = mix(col, vec3(0.97,0.94,0.70), uFlash);
    gl_FragColor = vec4(col,1.);
  }` , depthTest: false, depthWrite: false });
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fin); const qs = new THREE.Scene(); qs.add(quad); const qc = new THREE.Camera();
const rig = new THREE.Object3D();

// ---------- texto ----------
const SUBS = [[4.05, 5.5, 'Meu prédio só tem 12 andares.'], [5.6, 7.2, 'Esse andar não existe.'], [7.35, 8.9, 'E todas as portas são 13...'],
  [9.6, 10.9, 'Tem alguém ali.'], [11.45, 12.9, 'Fecha! Fecha! Fecha!']];
function contorno(txt, x, y, size, fill) {
  g2.font = `800 ${size}px Rubik`; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.lineJoin = 'round';
  g2.fillStyle = 'rgba(0,0,0,0.45)'; g2.fillText(txt, x + 2, y + 4);
  g2.strokeStyle = '#141018'; g2.lineWidth = size * 0.16; g2.strokeText(txt, x, y);
  g2.fillStyle = fill; g2.fillText(txt, x, y);
}
function pill(cx, cy, w, h, txt) {
  g2.fillStyle = '#c9282e'; g2.strokeStyle = '#5a0f12'; g2.lineWidth = 3; g2.beginPath(); g2.roundRect(cx - w / 2, cy - h / 2, w, h, 12); g2.fill(); g2.stroke();
  g2.fillStyle = '#fff'; g2.font = '800 25px Rubik'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
  g2.letterSpacing = '2px'; g2.fillText(txt, cx + 1, cy + 1); g2.letterSpacing = '0px';
}
function texto(t) {
  const a = Math.min(1, t / 0.3) * (t < 3.6 ? 1 : Math.max(0, 1 - (t - 3.6) / 0.12));
  if (a > 0) { g2.globalAlpha = a; pill(540, 70, 214, 46, 'EPISÓDIO 1');
    contorno('POV: o elevador passou do', 540, 138, 50, '#ffffff'); contorno('último andar...', 540, 195, 50, '#ffffff'); contorno('e parou no 13', 540, 252, 50, '#f6dc3c'); g2.globalAlpha = 1; }
  for (const [a0, a1, s] of SUBS) if (t >= a0 && t < a1) contorno(s, 540, 1362, 42, '#ffffff');
  // cartela final
  const e = Math.min(1, Math.max(0, (t - 14.25) / 0.2));
  if (e > 0) { g2.globalAlpha = e; contorno('Você abre a porta', 540, 860, 62, '#ffffff'); contorno('ou aperta o T?', 540, 940, 62, '#f6dc3c');
    contorno('Comenta. O mais votado é o EP 2.', 540, 1060, 38, '#ffffff'); g2.globalAlpha = 1; }
}
// ---------- quadro ----------
window.END = END;
// velocidade angular (graus/s) p/ o desfoque de movimento do render.mjs nos viradões
window.velAng = t => { const a = camAt(t), b = camAt(t + 1 / 60); return Math.hypot(b.yaw - a.yaw, b.pitch - a.pitch) * 180 / Math.PI * 60; };
window.seek = async t => {
  const c = camAt(t);
  const ss = k => { k = Math.min(1, Math.max(0, k)); return k * k * (3 - 2 * k); };
  rig.position.copy(c.pos); rig.rotation.set(c.pitch, c.yaw, c.roll, 'YXZ'); rig.updateMatrixWorld(true);
  EL.update(t, rig, U);
  // piscadas: "ding" no 13 (3,75), a cabine falhando quando a mão cinza entra (13,2+) e o corte pro preto (14,25)
  const quedas = [[3.75, 3.92], [13.25, 13.45], [13.8, 13.95]]; const pisca = quedas.some(([a0, a1]) => t > a0 && t < a1) ? 0.5 : 0;
  fin.uniforms.uDark.value = Math.max(pisca, ss((t - 14.1) / 0.15));
  fin.uniforms.uGlow.value = 0; fin.uniforms.uFlash.value = 0;
  fin.uniforms.uGrade.value.set(1, 1, 1);
  scene.updateMatrixWorld(true);
  camCol.position.copy(c.pos); camNrm.position.copy(c.pos);
  R.setRenderTarget(null);
  R.setClearColor(0x000000, 0); scene.overrideMaterial = null; camCol.update(R, scene);
  for (const p of PAPEIS) p.visible = false;
  scene.overrideMaterial = nrmMat; camNrm.update(R, scene); scene.overrideMaterial = null;
  for (const p of PAPEIS) p.visible = true;
  fin.uniforms.uB.value.setFromMatrix4(rig.matrixWorld); fin.uniforms.uT.value = t;
  R.setRenderTarget(null); R.render(qs, qc);
  g2.imageSmoothingEnabled = true; g2.imageSmoothingQuality = 'high'; g2.drawImage(glc, 0, 0, W, H);
  texto(t);
};
console.log('mundo ok'); let _t0=performance.now(); await window.seek(0.5); console.log('seek ms', performance.now()-_t0);
window.READY = true;
