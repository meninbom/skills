// Toon look (método HOUNDKEEPER): 3 tons duros, contorno por casco invertido, rim duro, grão de papel.
import * as THREE from 'three';

export const U = {
  uRimDir: { value: new THREE.Vector3(0, 0, -1) },   // direção da luz de recorte, espaço de vista
  uRimCol: { value: new THREE.Color('#ffd9a0') },
  uT: { value: 0 },
  uRes: { value: new THREE.Vector2(1080, 1920) },
  uPx: { value: 1 },                                  // px de saída por px de render (SS)
  uSolDir: { value: new THREE.Vector3(-0.6, 0.4, -0.6).normalize() }, // mundo, aponta p/ o sol
};

function rampa(passos) {
  // passos: [[dotNL_limite, valor], ...] em ordem crescente; borda suavizada de ~0.03 para não serrilhar
  const N = 256, d = new Uint8Array(N * 4);
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * 2 - 1; // dotNL
    let v = passos[0][1];
    for (let k = 1; k < passos.length; k++) {
      const [lim, val] = passos[k];
      const s = Math.min(1, Math.max(0, (x - lim) / 0.035 + 0.5));
      const ss = s * s * (3 - 2 * s);
      v = v + (val - v) * ss;
    }
    const b = Math.round(v * 255);
    d[i * 4] = b; d[i * 4 + 1] = b; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(d, N, 1, THREE.RGBAFormat);
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}
export const RAMPA = rampa([[-1, 0.0], [0.02, 0.5], [0.42, 1.0]]);
export const RAMPA_MOLE = rampa([[-1, 0.0], [-0.1, 0.55], [0.5, 1.0]]);

const GRAO = `
float h3(vec3 p){ p = fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
`;

export function toon(cor, o = {}) {
  const m = new THREE.MeshToonMaterial({
    color: new THREE.Color(cor), gradientMap: o.mole ? RAMPA_MOLE : RAMPA, dithering: true,
    vertexColors: !!o.vc, side: o.side || THREE.FrontSide,
    transparent: !!o.transp, opacity: o.opacity ?? 1, depthWrite: o.transp ? false : true,
  });
  if (o.emis) { m.emissive = new THREE.Color(o.emisCor || cor); m.emissiveIntensity = o.emis; }
  if (o.map) m.map = o.map;
  const rim = o.rim ?? 0.55, grao = o.grao ?? 0.06, rimW = o.rimW ?? 0.58;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uRimDir = U.uRimDir; sh.uniforms.uRimCol = U.uRimCol; sh.uniforms.uT = U.uT;
    if (o.vento) {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uT;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          #ifdef USE_INSTANCING
            vec3 ip = instanceMatrix[3].xyz;
          #else
            vec3 ip = vec3(0.0);
          #endif
          float hh = max(position.y, 0.0);
          float sw = sin(uT*0.9 + ip.x*0.35 + ip.z*0.25) + 0.35*sin(uT*1.6 + ip.z*0.9 + ip.x*0.2);
          transformed.x += sw * ${(o.vento).toFixed(3)} * hh * hh * 6.0;
          transformed.z += 0.5 * sw * ${(o.vento).toFixed(3)} * hh * hh * 6.0;`);
    }
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        #ifdef USE_INSTANCING
          vWP = (modelMatrix * instanceMatrix * vec4(transformed,1.0)).xyz;
        #else
          vWP = (modelMatrix * vec4(transformed,1.0)).xyz;
        #endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uRimDir; uniform vec3 uRimCol; uniform float uT; varying vec3 vWP;
        ${GRAO}`)
      .replace('#include <normal_fragment_begin>', o.normalCima ? `#include <normal_fragment_begin>
        normal = normalize(vNormal);` : (o.flat ? `#include <normal_fragment_begin>
        normal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));` : '#include <normal_fragment_begin>'))
      .replace('#include <opaque_fragment>', `
        {
          vec3 vd = normalize(vViewPosition);
          float fr = 1.0 - clamp(dot(normal, vd), 0.0, 1.0);
          float rl = dot(normal, uRimDir);
          float rim = smoothstep(${rimW.toFixed(3)}, ${(rimW + 0.05).toFixed(3)}, fr) * smoothstep(0.0, 0.18, rl);
          outgoingLight += uRimCol * diffuseColor.rgb * rim * ${rim.toFixed(3)};
          float g = n3(vWP*9.0)*0.6 + n3(vWP*31.0)*0.4;
          outgoingLight *= 1.0 + (g - 0.5) * ${grao.toFixed(3)} * 2.0;
        }
        #include <opaque_fragment>`);
    if (o.fragCor) sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + o.fragCor);
  };
  m.customProgramCacheKey = () => `toon-${rim}-${grao}-${rimW}-${o.vento || 0}-${!!o.mole}-${!!o.normalCima}-${!!o.flat}-${o.fragCor ? o.fragCor.length : 0}-${o.chave || ''}`;
  return m;
}

// Contorno: casco invertido, espessura em pixels com PESO VARIÁVEL (mais grosso no lado da sombra, afina na luz,
// leve tremida de traço feito à mão). Funciona em malha comum, instanciada e com esqueleto (skinning).
const outlineCache = new Map();
export function contornoMat(px = 3.5, cor = '#1d0f12', varia = 1) {
  const k = px + cor + varia;
  if (outlineCache.has(k)) return outlineCache.get(k);
  const m = new THREE.ShaderMaterial({
    uniforms: { uRes: U.uRes, uPx: U.uPx, uW: { value: px }, uCol: { value: new THREE.Color(cor) }, uSol: U.uSolDir, uVar: { value: varia } },
    vertexShader: `
      #include <common>
      #include <skinning_pars_vertex>
      uniform vec2 uRes; uniform float uPx; uniform float uW; uniform vec3 uSol; uniform float uVar;
      float hh(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      float nz(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(hh(i),hh(i+vec3(1,0,0)),f.x),mix(hh(i+vec3(0,1,0)),hh(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(hh(i+vec3(0,0,1)),hh(i+vec3(1,0,1)),f.x),mix(hh(i+vec3(0,1,1)),hh(i+vec3(1,1,1)),f.x),f.y),f.z); }
      void main(){
        #include <skinbase_vertex>
        #include <begin_vertex>
        #include <beginnormal_vertex>
        #include <skinnormal_vertex>
        #include <skinning_vertex>
        #ifdef USE_INSTANCING
          mat4 mm = modelMatrix * instanceMatrix;
        #else
          mat4 mm = modelMatrix;
        #endif
        vec4 wp = mm * vec4(transformed, 1.0);
        vec4 mv = viewMatrix * wp;
        vec3 nw = normalize(mat3(mm) * objectNormal);
        vec3 nv = normalize(mat3(viewMatrix) * nw);
        vec4 clip = projectionMatrix * mv;
        vec2 d = (projectionMatrix * vec4(nv, 0.0)).xy;
        float L = length(d); d = L > 1e-5 ? d / L : vec2(0.0);
        float dist = -mv.z;
        float lado = mix(1.0, mix(0.55, 1.45, smoothstep(0.35, -0.45, dot(nw, uSol))), uVar);
        float mao = mix(1.0, 0.8 + 0.4 * nz(wp.xyz * 14.0), uVar);
        float w = uW * uPx * clamp(4.5 / dist, 0.3, 1.25) * lado * mao;
        clip.xy += d * w * 2.0 / uRes * clip.w;
        clip.z += 0.0004 * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: `uniform vec3 uCol; void main(){ gl_FragColor = vec4(uCol, 1.0);
      #include <colorspace_fragment>
    }`,
    side: THREE.BackSide,
  });
  outlineCache.set(k, m);
  return m;
}

export function comContorno(mesh, px = 3.5, cor, varia = 1) {
  const geo = mesh.geometry;
  let o;
  if (mesh.isInstancedMesh) {
    o = new THREE.InstancedMesh(geo, contornoMat(px, cor, varia), mesh.count);
    o.instanceMatrix = mesh.instanceMatrix;
  } else if (mesh.isSkinnedMesh) {
    o = new THREE.SkinnedMesh(geo, contornoMat(px, cor, varia));
    o.bind(mesh.skeleton, mesh.bindMatrix);
    o.frustumCulled = false;
  } else o = new THREE.Mesh(geo, contornoMat(px, cor, varia));
  o.castShadow = false; o.receiveShadow = false;
  if (!mesh.isSkinnedMesh) o.frustumCulled = mesh.frustumCulled;
  o.layers.set(1);
  mesh.add(o);
  mesh.userData.contorno = o;
  return o;
}

// linhas internas (passe de normal/profundidade): marca a malha para a camada 2
export function comLinha(mesh) { mesh.layers.enable(2); return mesh; }
