// Ingredients, pieces and cookware for the chef scenes.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../lib/RoundedBoxGeometry.js';
import * as TX from '../js/textures.js';
import { MAT, mesh, smallBowl } from '../js/models.js';
import { rand } from '../js/util.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const V2 = (x, y) => new THREE.Vector2(x, y);
const phys = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.35, ...o });

// ---------- piece types (geometry + material that changes with doneness) ----------
const meatTex = TX.bumpNoise(10);
export const PIECE = {
  meat: { geo: () => new RoundedBoxGeometry(0.028, 0.022, 0.026, 2, 0.006), mat: () => phys(0xc24850, { roughness: 0.45, bumpMap: meatTex, bumpScale: 1.5, clearcoat: 0.3 }),
    colors: [[0, 0xc24850], [0.5, 0x8a4a2e], [1, 0x6a3a20]], sauce: 0x6b2814 },
  onion: { geo: () => new THREE.TorusGeometry(0.014, 0.0028, 5, 10, 2.2), mat: () => phys(0xf3ece0, { roughness: 0.25, transparent: true, opacity: 0.92, clearcoat: 0.6 }),
    colors: [[0, 0xf3ece0], [0.5, 0xeedfae], [1, 0xc98a3c]], sauce: 0xa8492a },
  pepper: { geo: () => new THREE.TorusGeometry(0.009, 0.0032, 6, 12), mat: () => phys(0x5fa83a, { roughness: 0.2, clearcoat: 1 }),
    colors: [[0, 0x5fa83a], [1, 0x4e7f2a]], sauce: 0x5a5a22 },
  garlic: { geo: () => new RoundedBoxGeometry(0.007, 0.004, 0.006, 1, 0.0015), mat: () => phys(0xf2ead2, { roughness: 0.4 }),
    colors: [[0, 0xf2ead2], [1, 0xd9b26a]], sauce: 0xb06030 },
  tomato: { geo: () => new RoundedBoxGeometry(0.018, 0.014, 0.017, 2, 0.004), mat: () => phys(0xd8322a, { roughness: 0.2, clearcoat: 1 }),
    colors: [[0, 0xd8322a], [1, 0xa8261c]], sauce: 0x9a2a18 },
  parsley: { geo: () => new THREE.PlaneGeometry(0.008, 0.006), mat: () => new THREE.MeshStandardMaterial({ color: 0x3f9a34, roughness: 0.5, side: THREE.DoubleSide }),
    colors: [[0, 0x3f9a34]], sauce: 0x3f9a34 },
  // ---- generic types for any recipe ----
  mince: { geo: () => new THREE.IcosahedronGeometry(0.007, 0), mat: () => phys(0xc04a50, { roughness: 0.6, bumpMap: meatTex, bumpScale: 1 }), colors: [[0, 0xc04a50], [1, 0x6e4126]], sauce: 0x6b2814 },
  chicken: { geo: () => new RoundedBoxGeometry(0.026, 0.02, 0.024, 2, 0.006), mat: () => phys(0xf0c2b0, { roughness: 0.45, bumpMap: meatTex, bumpScale: 1 }), colors: [[0, 0xf0c2b0], [0.6, 0xe8c69a], [1, 0xc98f4e]], sauce: 0xb5552c },
  fish: { geo: () => new RoundedBoxGeometry(0.03, 0.014, 0.022, 2, 0.005), mat: () => phys(0xf3e3da, { roughness: 0.35 }), colors: [[0, 0xf3e3da], [1, 0xd8a76a]], sauce: 0xc0703a },
  shrimp: { geo: () => new THREE.TorusGeometry(0.009, 0.005, 6, 12, 4.2), mat: () => phys(0xd9c7c0, { roughness: 0.3, clearcoat: 0.6 }), colors: [[0, 0xd9c7c0], [1, 0xf08a5e]], sauce: 0xd06a3a },
  potato: { geo: () => new RoundedBoxGeometry(0.018, 0.018, 0.018, 2, 0.004), mat: () => phys(0xf1dfa6, { roughness: 0.5 }), colors: [[0, 0xf1dfa6], [1, 0xd9a24e]], sauce: 0xc0703a },
  carrot: { geo: () => new THREE.CylinderGeometry(0.009, 0.009, 0.005, 14), mat: () => phys(0xf07a22, { roughness: 0.35, clearcoat: 0.4 }), colors: [[0, 0xf07a22], [1, 0xd8661a]], sauce: 0xc0501a },
  eggplant: { geo: () => new RoundedBoxGeometry(0.018, 0.016, 0.018, 2, 0.004), mat: () => phys(0xe6dcb8, { roughness: 0.5 }), colors: [[0, 0xe6dcb8], [1, 0xa87a4a]], sauce: 0x8a3a20 },
  zucchini: { geo: () => new THREE.CylinderGeometry(0.012, 0.012, 0.005, 16), mat: () => phys(0xcfe6a2, { roughness: 0.4 }), colors: [[0, 0xcfe6a2], [1, 0xb8b06a]], sauce: 0x9a6a30 },
  mushroom: { geo: () => new THREE.SphereGeometry(0.01, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat: () => phys(0xd8c3a2, { roughness: 0.6 }), colors: [[0, 0xd8c3a2], [1, 0x8a6440]], sauce: 0x6a3a20 },
  greens: { geo: () => new THREE.PlaneGeometry(0.018, 0.012), mat: () => new THREE.MeshStandardMaterial({ color: 0x4f9a3a, roughness: 0.5, side: THREE.DoubleSide }), colors: [[0, 0x4f9a3a], [1, 0x3f6a2a]], sauce: 0x4a5a22 },
  cucumber: { geo: () => new THREE.CylinderGeometry(0.011, 0.011, 0.004, 16), mat: () => phys(0xd6ebb0, { roughness: 0.3 }), colors: [[0, 0xd6ebb0]], sauce: 0xd6ebb0 },
  corn: { geo: () => new THREE.SphereGeometry(0.004, 6, 4), mat: () => phys(0xf2c430, { roughness: 0.3 }), colors: [[0, 0xf2c430], [1, 0xe0a828]], sauce: 0xd09020 },
  legume: { geo: () => new THREE.SphereGeometry(0.0055, 8, 6), mat: () => phys(0xd9b98a, { roughness: 0.5 }), colors: [[0, 0xd9b98a], [1, 0xb8925e]], sauce: 0x9a4a24 },
  rice: { geo: () => new THREE.CapsuleGeometry(0.0013, 0.0042, 1, 5), mat: () => phys(0xf5f1e6, { roughness: 0.5 }), colors: [[0, 0xf2ead2], [1, 0xfbf8f0]], sauce: 0xd9a060 },
  pasta: { geo: () => new THREE.CylinderGeometry(0.004, 0.004, 0.022, 8, 1, true), mat: () => phys(0xf0d58a, { roughness: 0.4, side: THREE.DoubleSide }), colors: [[0, 0xf0d58a], [1, 0xf4e2a8]], sauce: 0xc0502a },
  cheese: { geo: () => new RoundedBoxGeometry(0.014, 0.012, 0.014, 2, 0.003), mat: () => phys(0xfbf6ea, { roughness: 0.6 }), colors: [[0, 0xfbf6ea], [1, 0xf3d79a]], sauce: 0xf0c070 },
  egg: { geo: () => new THREE.IcosahedronGeometry(0.009, 1), mat: () => phys(0xfbe27a, { roughness: 0.5 }), colors: [[0, 0xfbe9a0], [1, 0xf6d24e]], sauce: 0xe0a040 },
  lemon: { geo: () => new THREE.CylinderGeometry(0.014, 0.014, 0.004, 18), mat: () => phys(0xf6e05a, { roughness: 0.3, clearcoat: 0.5 }), colors: [[0, 0xf6e05a]], sauce: 0xf6e05a },
  fruit: { geo: () => new RoundedBoxGeometry(0.016, 0.014, 0.016, 2, 0.004), mat: () => phys(0xe2504a, { roughness: 0.3, clearcoat: 0.6 }), colors: [[0, 0xe2504a], [1, 0xb8402a]], sauce: 0xa8301a },
  nuts: { geo: () => new THREE.IcosahedronGeometry(0.006, 0), mat: () => phys(0xa8763e, { roughness: 0.6 }), colors: [[0, 0xa8763e], [1, 0x7a4e24]], sauce: 0x7a4e24 },
  bread: { geo: () => new RoundedBoxGeometry(0.022, 0.016, 0.022, 2, 0.005), mat: () => phys(0xe9c98a, { roughness: 0.7 }), colors: [[0, 0xe9c98a], [1, 0xc58a3e]], sauce: 0xb06a30 },
  veg: { geo: () => new RoundedBoxGeometry(0.016, 0.012, 0.016, 2, 0.004), mat: () => phys(0x6fae4a, { roughness: 0.35 }), colors: [[0, 0x6fae4a], [1, 0x5a8a3a]], sauce: 0x7a6a2a },
  // ---- more vegetables, meats, fish & seafood, grains, fruit ----
  sausage: { geo: () => new THREE.CylinderGeometry(0.011, 0.011, 0.005, 14), mat: () => phys(0xa2322a, { roughness: 0.4, bumpMap: meatTex, bumpScale: 0.6 }), colors: [[0, 0xa2322a], [1, 0x6e2418]], sauce: 0x6b2814 },
  liver: { geo: () => new RoundedBoxGeometry(0.024, 0.012, 0.02, 2, 0.005), mat: () => phys(0x6a1a1e, { roughness: 0.25, clearcoat: 0.6 }), colors: [[0, 0x6a1a1e], [1, 0x4a2a1e]], sauce: 0x4a2014 },
  duck: { geo: () => new RoundedBoxGeometry(0.026, 0.018, 0.024, 2, 0.006), mat: () => phys(0xb04a48, { roughness: 0.45, bumpMap: meatTex, bumpScale: 1 }), colors: [[0, 0xb04a48], [1, 0x7a3e22]], sauce: 0x6b2814 },
  squid: { geo: () => new THREE.TorusGeometry(0.01, 0.0035, 6, 14), mat: () => phys(0xf6efe8, { roughness: 0.3, clearcoat: 0.5 }), colors: [[0, 0xf6efe8], [1, 0xf1dcc0]], sauce: 0xd88a4a },
  mussel: { geo: () => { const g = new THREE.SphereGeometry(0.012, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1.5, 0.45, 0.8); return g; }, mat: () => phys(0x1e2230, { roughness: 0.2, clearcoat: 1, side: THREE.DoubleSide }), colors: [[0, 0x1e2230]], sauce: 0x1e2230 },
  crab: { geo: () => new RoundedBoxGeometry(0.022, 0.012, 0.016, 2, 0.004), mat: () => phys(0xd8c8c0, { roughness: 0.35 }), colors: [[0, 0xd8c8c0], [1, 0xe8603a]], sauce: 0xd06a3a },
  salmon: { geo: () => new RoundedBoxGeometry(0.028, 0.016, 0.022, 2, 0.005), mat: () => phys(0xf08a5a, { roughness: 0.3, clearcoat: 0.3, bumpMap: meatTex, bumpScale: 0.6 }), colors: [[0, 0xf08a5a], [1, 0xf3b48a]], sauce: 0xd0703a },
  tuna: { geo: () => new RoundedBoxGeometry(0.026, 0.016, 0.022, 2, 0.004), mat: () => phys(0xb02a3a, { roughness: 0.3, clearcoat: 0.3 }), colors: [[0, 0xb02a3a], [1, 0xb89a80]], sauce: 0x8a5a3a },
  leek: { geo: () => new THREE.TorusGeometry(0.011, 0.0025, 5, 14), mat: () => phys(0xe2edc0, { roughness: 0.3 }), colors: [[0, 0xe2edc0], [1, 0xd6c98a]], sauce: 0xa8902a },
  tuber: { geo: () => new RoundedBoxGeometry(0.02, 0.018, 0.02, 2, 0.004), mat: () => phys(0xf3e8cc, { roughness: 0.55 }), colors: [[0, 0xf3e8cc], [1, 0xe8c27a]], sauce: 0xc0803a },
  banana: { geo: () => new THREE.CylinderGeometry(0.012, 0.012, 0.006, 16), mat: () => phys(0xf2e2a0, { roughness: 0.4 }), colors: [[0, 0xf2e2a0], [1, 0xd99a3a]], sauce: 0xc0803a },
  beet: { geo: () => new RoundedBoxGeometry(0.017, 0.015, 0.017, 2, 0.003), mat: () => phys(0x7a1240, { roughness: 0.25, clearcoat: 0.6 }), colors: [[0, 0x7a1240], [1, 0x6a1036]], sauce: 0x8a1a40 },
  radish: { geo: () => new THREE.CylinderGeometry(0.011, 0.011, 0.004, 16), mat: () => phys(0xfbf6f2, { roughness: 0.3 }), colors: [[0, 0xfbf6f2], [1, 0xefe0b8]], sauce: 0xd8b070 },
  celery: { geo: () => new THREE.CylinderGeometry(0.008, 0.008, 0.008, 10, 1, false, 0, Math.PI), mat: () => phys(0xb8d890, { roughness: 0.3, side: THREE.DoubleSide }), colors: [[0, 0xb8d890], [1, 0x9ab06a]], sauce: 0x8a8a3a },
  okra: { geo: () => new THREE.CylinderGeometry(0.009, 0.009, 0.007, 5), mat: () => phys(0x6a9e3a, { roughness: 0.35 }), colors: [[0, 0x6a9e3a], [1, 0x557a2e]], sauce: 0x6a6a2a },
  broccoli: { geo: () => new THREE.IcosahedronGeometry(0.011, 1), mat: () => phys(0x3f7f2c, { roughness: 0.7, bumpMap: TX.bumpNoise(30), bumpScale: 2 }), colors: [[0, 0x3f7f2c], [1, 0x4f8a34]], sauce: 0x4a5a22 },
  cauliflower: { geo: () => new THREE.IcosahedronGeometry(0.012, 1), mat: () => phys(0xf6f0dc, { roughness: 0.7, bumpMap: TX.bumpNoise(30), bumpScale: 2 }), colors: [[0, 0xf6f0dc], [1, 0xe8c88a]], sauce: 0xd8a050 },
  greenbean: { geo: () => new THREE.CapsuleGeometry(0.003, 0.02, 3, 6), mat: () => phys(0x4f9a34, { roughness: 0.3, clearcoat: 0.4 }), colors: [[0, 0x4f9a34], [1, 0x5a7f2a]], sauce: 0x6a5a22 },
  peas: { geo: () => new THREE.SphereGeometry(0.0045, 8, 6), mat: () => phys(0x6ab83a, { roughness: 0.3, clearcoat: 0.5 }), colors: [[0, 0x6ab83a], [1, 0x5a9a30]], sauce: 0x5a8a2a },
  avocado: { geo: () => new RoundedBoxGeometry(0.016, 0.013, 0.016, 2, 0.004), mat: () => phys(0xc8dc7a, { roughness: 0.3 }), colors: [[0, 0xc8dc7a]], sauce: 0xc8dc7a },
  olive: { geo: () => { const g = new THREE.SphereGeometry(0.006, 10, 8); g.scale(1, 1, 1.4); return g; }, mat: () => phys(0x2a2420, { roughness: 0.15, clearcoat: 1 }), colors: [[0, 0x2a2420]], sauce: 0x2a2420 },
  ginger: { geo: () => new RoundedBoxGeometry(0.018, 0.003, 0.004, 1, 0.001), mat: () => phys(0xf0dca0, { roughness: 0.4 }), colors: [[0, 0xf0dca0], [1, 0xd8b060]], sauce: 0xc09040 },
  pickle: { geo: () => new THREE.CylinderGeometry(0.009, 0.009, 0.005, 14), mat: () => phys(0xa8b84a, { roughness: 0.2, clearcoat: 0.8 }), colors: [[0, 0xa8b84a]], sauce: 0xa8b84a },
  lentil: { geo: () => { const g = new THREE.SphereGeometry(0.0026, 7, 4); g.scale(1, 0.4, 1); return g; }, mat: () => phys(0xe0703a, { roughness: 0.5 }), colors: [[0, 0xe0703a], [1, 0xe8a050]], sauce: 0xd8903a },
  bulgur: { geo: () => new THREE.IcosahedronGeometry(0.0019, 0), mat: () => phys(0xd8a85a, { roughness: 0.6 }), colors: [[0, 0xd8a85a], [1, 0xc8904a]], sauce: 0xb05a2a },
  couscous: { geo: () => new THREE.IcosahedronGeometry(0.0013, 0), mat: () => phys(0xf2d88a, { roughness: 0.6 }), colors: [[0, 0xf2d88a], [1, 0xf6e2a8]], sauce: 0xd8a050 },
  oats: { geo: () => { const g = new THREE.CircleGeometry(0.004, 7); g.rotateX(-Math.PI / 2); return g; }, mat: () => phys(0xe8d8b0, { roughness: 0.7, side: THREE.DoubleSide }), colors: [[0, 0xe8d8b0], [1, 0xd8c090]], sauce: 0xc8a070 },
  citrus: { geo: () => new THREE.CylinderGeometry(0.015, 0.015, 0.004, 18), mat: () => phys(0xf39a2a, { roughness: 0.3, clearcoat: 0.5 }), colors: [[0, 0xf39a2a]], sauce: 0xf39a2a },
  berry: { geo: () => new THREE.SphereGeometry(0.005, 10, 8), mat: () => phys(0x3a3a8a, { roughness: 0.25, clearcoat: 0.6 }), colors: [[0, 0x3a3a8a]], sauce: 0x5a2a6a },
  raisin: { geo: () => new THREE.IcosahedronGeometry(0.0045, 1), mat: () => phys(0x4a2418, { roughness: 0.6, bumpMap: TX.bumpNoise(30), bumpScale: 2 }), colors: [[0, 0x4a2418]], sauce: 0x4a2418 },
  kiwi: { geo: () => new THREE.CylinderGeometry(0.013, 0.013, 0.004, 18), mat: () => phys(0x8ab83a, { roughness: 0.3, clearcoat: 0.5 }), colors: [[0, 0x8ab83a]], sauce: 0x8ab83a },
  chocolate: { geo: () => new RoundedBoxGeometry(0.012, 0.006, 0.012, 1, 0.002), mat: () => phys(0x3e2014, { roughness: 0.3, clearcoat: 0.4 }), colors: [[0, 0x3e2014]], sauce: 0x3e2014 },
  biscuit: { geo: () => new RoundedBoxGeometry(0.022, 0.005, 0.014, 1, 0.002), mat: () => phys(0xd4a058, { roughness: 0.8 }), colors: [[0, 0xd4a058]], sauce: 0xb07a3a },
  bayleaf: { geo: () => { const g = new THREE.CircleGeometry(0.012, 8); g.scale(0.45, 1, 1); return g; }, mat: () => new THREE.MeshStandardMaterial({ color: 0x5a7a3a, roughness: 0.6, side: THREE.DoubleSide }), colors: [[0, 0x5a7a3a], [1, 0x4a6a30]], sauce: 0x5a7a3a },
  dough: { geo: () => new THREE.SphereGeometry(0.016, 12, 8), mat: () => phys(0xf2e2bd, { roughness: 0.7 }), colors: [[0, 0xf2e2bd], [1, 0xd9a35a]], sauce: 0xd9a35a },
};
const cA = new THREE.Color(), cB = new THREE.Color();
function doneColor(type, done, sauce, out) {
  const cs = PIECE[type].colors;
  let i = 0; while (i < cs.length - 1 && done > cs[i + 1][0]) i++;
  const [k0, c0] = cs[i], [k1, c1] = cs[Math.min(i + 1, cs.length - 1)];
  const k = k1 > k0 ? (done - k0) / (k1 - k0) : 0;
  out.copy(cA.set(c0)).lerp(cB.set(c1), Math.min(1, Math.max(0, k)));
  if (sauce > 0) out.lerp(cB.set(PIECE[type].sauce), sauce * 0.7);
  return out;
}

// A set of pieces of one type, rendered as one InstancedMesh inside a parent.
export class Pieces {
  constructor(type, max, parent) {
    this.type = type; this.max = max;
    this.mat = PIECE[type].mat();
    this.mesh = new THREE.InstancedMesh(PIECE[type].geo(), this.mat, max);
    this.mesh.castShadow = true; this.mesh.receiveShadow = true; this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.items = []; this.count = 0; this.done = 0; this.sauce = 0; this.shrink = 0; this.grow = 0;
    const col = new THREE.Color();
    for (let i = 0; i < max; i++) {
      this.items.push({ p: V(), r: new THREE.Euler(rand(0, 6), rand(0, 6), rand(0, 6)), s: rand(0.8, 1.15), a: rand(0, 6.28), rad: 0, y: 0 });
      this.mesh.setColorAt(i, col.setScalar(rand(0.85, 1.1)));
    }
    this.mesh.count = 0; parent.add(this.mesh);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = V();
  }
  setParent(p) { p.add(this.mesh); }
  scatter(radius, y0, yJit = 0.01, from = 0) {
    for (let i = from; i < this.max; i++) {
      const it = this.items[i]; it.rad = Math.sqrt(Math.random()) * radius; it.a = rand(0, 6.28);
      it.y = y0 + Math.random() * yJit; it.p.set(Math.cos(it.a) * it.rad, it.y, Math.sin(it.a) * it.rad);
    }
  }
  sync() {
    this.mesh.count = this.count;
    const k = (1 - this.shrink * 0.65) * (1 + this.grow * 0.4);
    for (let i = 0; i < this.count; i++) {
      const it = this.items[i];
      this._q.setFromEuler(it.r); this._s.setScalar(it.s * k);
      if (this.type === 'parsley') this._s.setScalar(it.s);
      this._m.compose(it.p, this._q, this._s); this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    doneColor(this.type, this.done, this.sauce, this.mat.color);
    if (this.type === 'onion') this.mat.opacity = 0.92 - this.done * 0.25;
  }
}

// ---------- whole ingredients ----------
export function wholeOnion() {
  const g = new THREE.Group();
  const b = mesh(new THREE.SphereGeometry(0.042, 32, 24), phys(0xd9a35a, { roughness: 0.5, sheen: 0.5 })); b.scale.set(1, 0.88, 1); b.position.y = 0.037; g.add(b);
  const tip = mesh(new THREE.ConeGeometry(0.008, 0.02, 10), phys(0xb48040)); tip.position.y = 0.082; g.add(tip);
  return g;
}
export function wholePepper() {
  const g = new THREE.Group();
  const pts = []; for (let i = 0; i <= 14; i++) { const k = i / 14; pts.push(V2(0.012 * Math.sin(Math.min(1, k * 1.4) * Math.PI / 2) * (1 - Math.pow(k, 6) * 0.2), k * 0.14)); }
  const body = mesh(new THREE.LatheGeometry(pts, 20), phys(0x5fae3c, { roughness: 0.15, clearcoat: 1 }));
  body.rotation.z = Math.PI / 2; body.position.set(0.07, 0.012, 0); g.add(body);
  const stem = mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.025, 8), phys(0x6a8a3a)); stem.rotation.z = Math.PI / 2 + 0.3; stem.position.set(0.078, 0.016, 0); g.add(stem);
  return g;
}
export function wholeTomato() {
  const g = new THREE.Group();
  const b = mesh(new THREE.SphereGeometry(0.036, 32, 24), phys(0xd8322a, { roughness: 0.15, clearcoat: 1 })); b.scale.set(1, 0.85, 1); b.position.y = 0.031; g.add(b);
  for (let i = 0; i < 5; i++) { const l = mesh(new THREE.ConeGeometry(0.004, 0.022, 4), MAT.leaf, { cast: false }); l.position.set(Math.sin(i * 1.26) * 0.008, 0.061, Math.cos(i * 1.26) * 0.008); l.rotation.set(Math.cos(i * 1.26) * 1.3, 0, -Math.sin(i * 1.26) * 1.3); g.add(l); }
  return g;
}
export function wholeGarlic() {
  const g = new THREE.Group();
  for (let i = 0; i < 2; i++) { const c = mesh(new THREE.SphereGeometry(0.011, 16, 12), phys(0xf4ecd8, { roughness: 0.5 })); c.scale.set(1, 0.8, 1.6); c.position.set(i * 0.025, 0.009, i * 0.01); c.rotation.y = i; g.add(c); }
  return g;
}
export function parsleyBunch() {
  const g = new THREE.Group();
  const leaf = new THREE.MeshStandardMaterial({ color: 0x3f9a34, roughness: 0.55 });
  for (let i = 0; i < 18; i++) {
    const l = mesh(new THREE.SphereGeometry(0.012, 8, 6), leaf); l.scale.set(1, 0.4, 1);
    l.position.set(0.06 + Math.sin(i * 2.3) * 0.02, 0.012 + (i % 3) * 0.006, Math.cos(i * 2.3) * 0.02); g.add(l);
  }
  for (let i = 0; i < 4; i++) { const s = mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.08, 5), leaf); s.rotation.z = Math.PI / 2; s.position.set(0.02, 0.006, (i - 1.5) * 0.006); g.add(s); }
  return g;
}
export function oilBottle() {
  const g = new THREE.Group();
  const glass = mesh(new THREE.LatheGeometry([V2(0, 0), V2(0.032, 0), V2(0.034, 0.005), V2(0.034, 0.15), V2(0.014, 0.19), V2(0.012, 0.22)], 28), MAT.glass, { cast: false }); g.add(glass);
  const oil = mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.13, 24), MAT.oil, { cast: false }); oil.position.y = 0.07; g.add(oil);
  const cork = mesh(new THREE.CylinderGeometry(0.011, 0.01, 0.025, 12), MAT.wood); cork.position.y = 0.23; g.add(cork);
  return g;
}
export function pasteJar() {
  const g = new THREE.Group();
  const glass = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 24, 1, true), MAT.glass, { cast: false }); glass.position.y = 0.035; g.add(glass);
  const fill = mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.055, 24), phys(0xa82418, { roughness: 0.3, clearcoat: 0.5 })); fill.position.y = 0.0285; g.add(fill);
  return g;
}
export function spiceBowl(color) {
  const g = new THREE.Group(); g.add(smallBowl(0.035, 0.025, MAT.ceramic));
  const s = mesh(new THREE.SphereGeometry(0.03, 20, 8, 0, 6.3, 0, 1.2), new THREE.MeshStandardMaterial({ color, roughness: 0.9, bumpMap: TX.bumpNoise(40), bumpScale: 2 })); s.scale.y = 0.3; s.position.y = 0.012; g.add(s);
  return g;
}
export function waterGlass() {
  const g = new THREE.Group();
  const glass = mesh(new THREE.CylinderGeometry(0.036, 0.03, 0.11, 24, 1, true), MAT.glass, { cast: false }); glass.position.y = 0.055; g.add(glass);
  const w = mesh(new THREE.CylinderGeometry(0.034, 0.029, 0.085, 24), new THREE.MeshPhysicalMaterial({ color: 0xdfefff, transparent: true, opacity: 0.35, roughness: 0, depthWrite: false }), { cast: false });
  w.position.y = 0.045; g.add(w); g.userData.water = w;
  return g;
}
export function woodenSpoon() {
  const g = new THREE.Group();
  const h = mesh(new THREE.CylinderGeometry(0.006, 0.007, 0.24, 10), MAT.wood); h.rotation.x = Math.PI / 2; h.position.z = -0.08; g.add(h);
  const b = mesh(new THREE.SphereGeometry(0.024, 16, 10), MAT.wood); b.scale.set(0.8, 0.25, 1.3); b.position.z = 0.055; g.add(b);
  return g;
}

// ---------- cookware ----------
export const PAN = { r: 0.14, rb: 0.125, h: 0.058 };
export function makeSautePan() {
  const g = new THREE.Group();
  const nonstick = new THREE.MeshPhysicalMaterial({ color: 0x2a2a2c, roughness: 0.35, metalness: 0.4, clearcoat: 0.4, side: THREE.DoubleSide });
  const outer = new THREE.MeshStandardMaterial({ color: 0xb9bcc0, metalness: 1, roughness: 0.3, side: THREE.DoubleSide });
  const { r, rb, h } = PAN;
  g.add(mesh(new THREE.LatheGeometry([V2(0, 0), V2(rb, 0), V2(r, 0.012), V2(r + 0.003, h), V2(r + 0.008, h + 0.003)], 64), outer));
  const inside = mesh(new THREE.LatheGeometry([V2(r - 0.001, h), V2(r - 0.004, 0.013), V2(rb - 0.004, 0.004), V2(0, 0.004)], 64), nonstick, { cast: false }); g.add(inside);
  const handle = mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.2, 14), new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.45 }));
  handle.rotation.z = Math.PI / 2 - 0.12; handle.position.set(r + 0.11, h - 0.005, 0); g.add(handle);
  const rivet = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 10), outer); rivet.rotation.z = Math.PI / 2; rivet.position.set(r + 0.012, h - 0.012, 0); g.add(rivet);
  g.userData.handle = V(r + 0.17, h + 0.002, 0);
  // oil layer, liquid layer
  const oil = mesh(new THREE.CircleGeometry(rb - 0.006, 48), new THREE.MeshPhysicalMaterial({ color: 0xc89a2a, transparent: true, opacity: 0, roughness: 0.0, metalness: 0.2, clearcoat: 1, bumpMap: TX.bumpNoise(16), bumpScale: 0.25, depthWrite: false }), { cast: false });
  oil.rotation.x = -Math.PI / 2; oil.position.y = 0.0055; g.add(oil);
  const liquid = mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshPhysicalMaterial({ color: 0xc0502a, transparent: true, opacity: 0, roughness: 0.12, clearcoat: 1, bumpMap: TX.bumpNoise(10), bumpScale: 0.6 }), { cast: false });
  liquid.rotation.x = -Math.PI / 2; liquid.position.y = 0.006; g.add(liquid);
  g.userData.oil = oil; g.userData.liquid = liquid;
  g.userData.setLiquid = (level, color, opacity) => {
    const rr = PAN.rb - 0.004 + (PAN.r - PAN.rb) * Math.min(1, level / 0.012);
    liquid.scale.set(rr, rr, 1); liquid.position.y = 0.005 + level;
    if (color !== undefined) liquid.material.color.set(color);
    liquid.material.opacity = opacity; liquid.visible = opacity > 0.01;
  };
  return g;
}
export function makeLid() {
  const g = new THREE.Group();
  const glass = mesh(new THREE.SphereGeometry(0.2, 48, 12, 0, Math.PI * 2, 0, 0.78), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, roughness: 0.05, envMapIntensity: 1.5, side: THREE.DoubleSide, depthWrite: false }), { cast: false });
  glass.position.y = -0.14; g.add(glass);
  const rim = mesh(new THREE.TorusGeometry(0.143, 0.005, 8, 64), new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 1, roughness: 0.25 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.001; g.add(rim);
  const knob = mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.022, 16), new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.4 })); knob.position.y = 0.072; g.add(knob);
  return g;
}
export function servingPlate() {
  const pts = [V2(0, 0), V2(0.07, 0), V2(0.075, 0.004), V2(0.1, 0.006), V2(0.15, 0.022), V2(0.153, 0.025), V2(0.148, 0.025), V2(0.1, 0.011), V2(0, 0.009)];
  return mesh(new THREE.LatheGeometry(pts, 64), MAT.ceramic);
}

// generic whole item for the board (colour + rough shape by type)
const WHOLE = {
  potato: [0xc89a5c, 'egg'], carrot: [0xf07a22, 'long'], eggplant: [0x4a2a5a, 'long'], zucchini: [0x4f8a32, 'long'], cucumber: [0x3f7a2a, 'long'],
  mushroom: [0xd8c3a2, 'cap'], greens: [0x4f9a3a, 'bunch'], lemon: [0xf6e05a, 'egg'], fruit: [0xd8322a, 'ball'], cheese: [0xfbf6ea, 'block'],
  tomato: [0xd8322a, 'ball'], onion: [0xd9a35a, 'ball'], garlic: [0xf4ecd8, 'egg'], pepper: [0x5fae3c, 'long'], parsley: [0x3f9a34, 'bunch'],
  sausage: [0x9a2a22, 'long'], liver: [0x5a141a, 'fillet'], duck: [0xe8c0a8, 'block'], salmon: [0xf08a5a, 'fillet'], tuna: [0xa82434, 'block'], squid: [0xf3ece4, 'long'],
  leek: [0xd8e8b0, 'long'], tuber: [0x8a5a3a, 'egg'], banana: [0xe8d040, 'long'], beet: [0x6a1236, 'ball'], radish: [0xe8e0dc, 'ball'], celery: [0xa8d080, 'long'],
  okra: [0x5f9a34, 'long'], broccoli: [0x3f7f2c, 'bunch'], cauliflower: [0xf3ecd6, 'ball'], greenbean: [0x4f9a34, 'long'], avocado: [0x3a5a24, 'egg'], ginger: [0xc8a060, 'egg'],
  pickle: [0x8a9a3a, 'long'], citrus: [0xf39a2a, 'ball'], kiwi: [0x7a5a34, 'egg'], chocolate: [0x3e2014, 'block'],
  meat: [0xb8323a, 'block'], chicken: [0xf0c2b0, 'block'], fish: [0xf3e3da, 'fillet'], bread: [0xd9a35a, 'block'], veg: [0x6fae4a, 'ball'], nuts: [0xa8763e, 'ball'], corn: [0xf2c430, 'long'],
};
export function wholeGeneric(type) {
  const [col, shape] = WHOLE[type] || [0x8ab05a, 'ball'];
  const g = new THREE.Group(); const m = phys(col, { roughness: 0.35, clearcoat: 0.4 });
  let o;
  if (shape === 'long') { o = mesh(new THREE.CapsuleGeometry(0.016, 0.1, 6, 14), m); o.rotation.z = Math.PI / 2; o.position.y = 0.016; }
  else if (shape === 'egg') { o = mesh(new THREE.SphereGeometry(0.03, 20, 14), m); o.scale.set(1.25, 0.8, 1); o.position.y = 0.024; }
  else if (shape === 'block') { o = mesh(new RoundedBoxGeometry(0.1, 0.03, 0.07, 3, 0.012), m); o.position.y = 0.015; }
  else if (shape === 'fillet') { o = mesh(new RoundedBoxGeometry(0.12, 0.018, 0.06, 3, 0.009), m); o.position.y = 0.009; }
  else if (shape === 'cap') { o = mesh(new THREE.SphereGeometry(0.025, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), m); o.scale.y = 0.7; }
  else if (shape === 'bunch') { o = new THREE.Group(); for (let i = 0; i < 12; i++) { const l = mesh(new THREE.SphereGeometry(0.014, 8, 6), m); l.scale.set(1, 0.4, 1); l.position.set(Math.sin(i * 2.3) * 0.025, 0.01 + (i % 3) * 0.005, Math.cos(i * 2.3) * 0.025); o.add(l); } }
  else { o = mesh(new THREE.SphereGeometry(0.033, 20, 14), m); o.position.y = 0.03; }
  g.add(o); return g;
}
