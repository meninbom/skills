// balao: the 1783 hot-air balloon (our own prop). Envelope = lathe teardrop with a painted gore texture (royal blue,
// gold bands and fleurs, dark seams painted in like the town textures), wicker basket open at the top (passenger
// cards stand inside it), four ropes to the neck ring, a launch mast with a crossbar. Lit by the two-tone lam() like
// everything else so the world ink pass outlines it.
import * as THREE from "three";
import { lam, V } from "./build";
import { ctex } from "./paint";
import type { BalloonState } from "./story";

const ENV_H = 13.0, ENV_R = 4.6, NECK_R = 1.25, NECK_Y = 3.1; // metres above the basket bottom
const envTex = () => ctex("balloonEnv", 1024, 1024, (g) => {
  const W = 1024, H = 1024;
  g.fillStyle = "#2f5aa6"; g.fillRect(0, 0, W, H);
  // v = 0 at the neck (bottom) .. 1 at the crown: bands near the equator and the skirt
  const band = (v0: number, v1: number, col: string) => { g.fillStyle = col; g.fillRect(0, H * (1 - v1), W, H * (v1 - v0)); };
  band(0.0, 0.16, "#e8c45a"); band(0.16, 0.2, "#b33a3a");
  band(0.5, 0.56, "#e8c45a"); band(0.62, 0.66, "#e8c45a");
  band(0.9, 1.0, "#e8c45a");
  // gold fleurs / suns between the bands, one per gore
  const gores = 12;
  for (let i = 0; i < gores; i++) {
    const cx = ((i + 0.5) / gores) * W;
    for (const [v, r] of [[0.36, 26], [0.78, 20]] as const) {
      const cy = H * (1 - v);
      g.fillStyle = "#e8c45a"; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#e8c45a"; g.lineWidth = 6;
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 1.2); g.lineTo(cx + Math.cos(a) * r * 1.9, cy + Math.sin(a) * r * 1.9); g.stroke(); }
    }
    // swag scallops on the skirt band
    g.fillStyle = "#f3e3b0";
    for (let k = 0; k < 2; k++) { const x0 = cx - W / gores / 2 + (k * W) / gores / 2; g.beginPath(); g.arc(x0 + W / gores / 4, H * (1 - 0.16), W / gores / 4, 0, Math.PI); g.fill(); }
  }
  // gore seams painted as dark tints (no geometry lines on the cloth)
  g.strokeStyle = "rgba(20,20,45,0.55)"; g.lineWidth = 5;
  for (let i = 0; i <= gores; i++) { const x = (i / gores) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  // soft painterly mottling
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${0.03 + 0.03 * Math.random()})`; g.fillRect(Math.random() * W, Math.random() * H, 3 + Math.random() * 14, 2 + Math.random() * 6); }
});
const wickerTex = () => ctex("wicker2", 256, 256, (g) => {
  // woven basket: vertical stakes, rounded horizontal weavers passing over/under, warm straw
  g.fillStyle = "#8a6236"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 21) for (let x = 0; x < 256; x += 32) {
    const o = (y / 21) % 2 ? 16 : 0;
    const gr = g.createLinearGradient(0, y, 0, y + 19); gr.addColorStop(0, "#e2b56e"); gr.addColorStop(0.5, "#d4a35c"); gr.addColorStop(1, "#a97b43");
    g.fillStyle = gr; g.beginPath(); g.ellipse(x + o + 14, y + 10, 17, 9, 0, 0, Math.PI * 2); g.fill();
  }
});
export class Balloon {
  root = new THREE.Group();
  private env: THREE.Mesh; private hang = new THREE.Group(); private top = new THREE.Group(); private ring: THREE.Mesh; private ropes: THREE.Mesh[] = []; private mast = new THREE.Group();
  constructor(parent: THREE.Object3D, wood: THREE.Material) {
    // envelope profile (lathe around y): neck -> widest at ~62 % height -> round crown
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, y = NECK_Y + u * ENV_H;
      const r = u < 0.62 ? NECK_R + (ENV_R - NECK_R) * Math.sin((u / 0.62) * Math.PI / 2) ** 1.3 : ENV_R * Math.sqrt(Math.max(0, 1 - ((u - 0.62) / 0.38) ** 2));
      pts.push(new THREE.Vector2(Math.max(0.001, r), y));
    }
    const eg = new THREE.LatheGeometry(pts, 48);
    // v along the profile = 0 at the neck .. 1 at the crown (LatheGeometry already does this); u wraps 12 gores
    const em = lam("balloonEnv", () => ({ map: envTex(), side: THREE.DoubleSide }));
    if (em.map) { em.map.anisotropy = 8; em.map.needsUpdate = true; }
    this.env = new THREE.Mesh(eg, em); this.env.castShadow = true; this.env.receiveShadow = true;
    // neck ring
    const ring = this.ring = new THREE.Mesh(new THREE.TorusGeometry(NECK_R, 0.07, 6, 32).rotateX(Math.PI / 2).translate(0, NECK_Y, 0), wood);
    // basket: open box (floor + 4 walls), 1.4 x 0.8 x 1.4, rim rail
    const wm = lam("wickerM2", () => ({ map: wickerTex(), side: THREE.DoubleSide }));
    const S = 0.7, Hh = 0.62;
    const wall = (w: number, x: number, z: number, ry: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, Hh), wm); m.position.set(x, Hh / 2, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; return m;
    };
    const basket = new THREE.Group();
    basket.add(wall(2 * S, 0, S, 0), wall(2 * S, 0, -S, Math.PI), wall(2 * S, S, 0, Math.PI / 2), wall(2 * S, -S, 0, -Math.PI / 2));
    const floor = new THREE.Mesh(new THREE.BoxGeometry(2 * S, 0.1, 2 * S).translate(0, 0.05, 0), wm); basket.add(floor);
    const rimG = new THREE.TorusGeometry(1, 0.05, 6, 4).rotateX(Math.PI / 2).rotateY(Math.PI / 4).scale(S * Math.SQRT2, 1, S * Math.SQRT2).translate(0, Hh, 0);
    basket.add(new THREE.Mesh(rimG, wood));
    basket.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    // ropes: basket corners -> neck ring (unit cylinders stretched per frame)
    const rm = lam("rope", () => ({ color: "#d8c49a" }));
    for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 5).translate(0, 0.5, 0), rm); r.castShadow = true; this.ropes.push(r); this.hang.add(r); }
    this.top.position.set(0, NECK_Y, 0); this.env.position.y = -NECK_Y; ring.position.y = -NECK_Y;
    this.top.add(this.env, ring);
    this.hang.add(this.top, basket);
    this.root.add(this.hang);
    // launch mast: two poles and a crossbar the limp envelope hangs from (shots 2-3)
    for (const x of [-5.6, 5.6]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.28, 16.8, 0.28).translate(x, 8.4, 0), wood); p.castShadow = true; this.mast.add(p); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.3, 0.3).translate(0, 16.6, 0), wood); bar.castShadow = true; this.mast.add(bar);
    this.root.add(this.mast);
    parent.add(this.root);
  }
  pose(b: BalloonState, t: number) {
    this.root.position.set(b.at[0], b.at[1], b.at[2]);
    this.mast.visible = b.at[0] > 0; // only on the launch pad
    this.hang.position.set(0, b.lift, 0);
    this.hang.rotation.set(0, Math.PI / 4, 0);
    this.top.rotation.set(b.tilt * 0.3, 0, b.tilt);
    // inflate 0 = limp sack hanging from the crossbar (tall and thin, creased), 1 = full
    const k = b.inflate, wob = 0.02 * Math.sin(t * 9) * k * (1 - k) * 4;
    const sx = 0.42 + 0.58 * k + wob, sy = 1.0 - 0.0 * k;
    this.env.scale.set(sx, sy, sx * (0.9 + 0.1 * k));
    this.env.position.set(0, -NECK_Y + (1 - k) * 1.2, 0);
    this.ring.scale.set(sx, 1, sx); this.ring.position.y = -NECK_Y + (1 - k) * 1.2;
    // ropes from the basket corners (rim) to the neck ring
    const S = 0.66;
    this.top.updateMatrix();
    [[S, S], [-S, S], [S, -S], [-S, -S]].forEach(([x, z], i) => {
      const a = V(x, 0.62, z), q = 1.25 / Math.SQRT2 * sx;
      const e = V(Math.sign(x) * q, (1 - k) * 1.2, Math.sign(z) * q).applyMatrix4(this.top.matrix);
      const d = e.clone().sub(a), r = this.ropes[i];
      r.position.copy(a); r.scale.set(1, d.length(), 1);
      r.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    });
  }
}
