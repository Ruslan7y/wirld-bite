// All 3D props of the kitchen, built from code.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../lib/RoundedBoxGeometry.js';
import * as TX from './textures.js';

const V2 = (x, y) => new THREE.Vector2(x, y);
export function mesh(g, m, { cast = true, recv = true } = {}) {
  const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = recv; return o;
}

// ---------- materials ----------
export const MAT = {};
export function makeMaterials() {
  MAT.ceramic = new THREE.MeshPhysicalMaterial({ color: 0xf6f3ee, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide });
  MAT.ceramicSage = new THREE.MeshPhysicalMaterial({ color: 0x7f9f8a, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15, side: THREE.DoubleSide });
  MAT.ceramicTerra = new THREE.MeshPhysicalMaterial({ color: 0xd8835e, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2, side: THREE.DoubleSide });
  MAT.steel = new THREE.MeshStandardMaterial({ color: 0xdedede, metalness: 1, roughness: 0.22 });
  MAT.brushed = new THREE.MeshStandardMaterial({ color: 0xc9c9c9, metalness: 1, roughness: 0.38, side: THREE.DoubleSide });
  MAT.blackSteel = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.35 });
  MAT.plasticWhite = new THREE.MeshPhysicalMaterial({ color: 0xf2f0ec, roughness: 0.35, clearcoat: 0.5 });
  MAT.accent = new THREE.MeshPhysicalMaterial({ color: 0xe8664a, roughness: 0.35, clearcoat: 0.6 });
  MAT.glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.22, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false });
  MAT.ovenGlass = new THREE.MeshPhysicalMaterial({ color: 0x2a2018, roughness: 0.05, transparent: true, opacity: 0.28, envMapIntensity: 1.2, depthWrite: false });
  MAT.milk = new THREE.MeshPhysicalMaterial({ color: 0xfbfaf5, roughness: 0.2, clearcoat: 0.5 });
  MAT.oil = new THREE.MeshPhysicalMaterial({ color: 0xe8c040, roughness: 0.05, transparent: true, opacity: 0.85, clearcoat: 1 });
  MAT.eggShell = new THREE.MeshPhysicalMaterial({ color: 0xe9cfae, roughness: 0.55, sheen: 0.3, side: THREE.DoubleSide });
  MAT.yolk = new THREE.MeshPhysicalMaterial({ color: 0xff9a14, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
  MAT.white = new THREE.MeshPhysicalMaterial({ color: 0xfffbea, roughness: 0.04, transparent: true, opacity: 0.55, clearcoat: 1 });
  MAT.sugar = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, bumpMap: TX.bumpNoise(60), bumpScale: 2 });
  MAT.flour = new THREE.MeshStandardMaterial({ color: 0xfbf8f1, roughness: 0.95, bumpMap: TX.bumpNoise(20), bumpScale: 1.2 });
  MAT.wood = new THREE.MeshStandardMaterial({ map: TX.wood(), roughness: 0.6 });
  MAT.silicone = new THREE.MeshPhysicalMaterial({ color: 0xd94a3a, roughness: 0.45, sheen: 0.4 });
  MAT.cream = new THREE.MeshPhysicalMaterial({ color: 0xfffcf4, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color(0xffffff) });
  MAT.strawberry = new THREE.MeshPhysicalMaterial({ map: TX.strawberry(), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 });
  MAT.leaf = new THREE.MeshStandardMaterial({ color: 0x3f8f3a, roughness: 0.5, side: THREE.DoubleSide });
  MAT.mint = new THREE.MeshPhysicalMaterial({ color: 0x4fb04a, roughness: 0.4, clearcoat: 0.4, side: THREE.DoubleSide });
  MAT.crumb = new THREE.MeshStandardMaterial({ map: TX.crumb(true), roughness: 0.9, side: THREE.DoubleSide });
  MAT.sugarDust = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0, alphaMap: TX.bumpNoise(9), depthWrite: false });
  MAT.element = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0xff3a00, emissiveIntensity: 0, metalness: 0.5, roughness: 0.5 });
  MAT.ovenInside = new THREE.MeshStandardMaterial({ color: 0x2b2826, metalness: 0.3, roughness: 0.6, side: THREE.DoubleSide });
  MAT.knob = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, metalness: 0.4, roughness: 0.3 });
  MAT.jarContents = [0xc7832f, 0x7a4d2a, 0xf1e6c8].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
  MAT.basil = new THREE.MeshStandardMaterial({ color: 0x4c9a3c, roughness: 0.6, side: THREE.DoubleSide });
  MAT.pot = new THREE.MeshStandardMaterial({ color: 0xb8643f, roughness: 0.8, side: THREE.DoubleSide });
  MAT.linen = new THREE.MeshStandardMaterial({ color: 0xe8dcc6, roughness: 1, bumpMap: TX.bumpNoise(120), bumpScale: 1 });
  MAT.batter = makeBakeMaterial();
  return MAT;
}

// Material that goes from raw batter to baked crust (uBake 0..1)
function makeBakeMaterial() {
  const m = new THREE.MeshPhysicalMaterial({ map: TX.crust(), roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3, side: THREE.DoubleSide });
  m.userData.uBake = { value: 0 };
  m.userData.uRaw = { value: new THREE.Color(0xfbe3a2) };
  m.onBeforeCompile = sh => {
    sh.uniforms.uBake = m.userData.uBake; sh.uniforms.uRaw = m.userData.uRaw;
    sh.fragmentShader = 'uniform float uBake; uniform vec3 uRaw;\n' + sh.fragmentShader.replace('#include <map_fragment>',
      `vec4 texelColor = texture2D( map, vMapUv );
       diffuseColor.rgb *= mix(uRaw, texelColor.rgb, smoothstep(0.0,1.0,uBake));`)
      .replace('#include <clearcoat_normal_fragment_begin>', '#include <clearcoat_normal_fragment_begin>\n')
  };
  return m;
}

// ---------- geometry helpers ----------
// Parametric surface: fn(u,v) -> [x,y,z]; vRange(u) -> [v0,v1]
function param(uSeg, vSeg, fn, vRange = () => [0, 1], uRange = [0, 1], uvFn = null) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= uSeg; i++) {
    const u = uRange[0] + (uRange[1] - uRange[0]) * i / uSeg;
    const [v0, v1] = vRange(u);
    for (let j = 0; j <= vSeg; j++) {
      const v = v0 + (v1 - v0) * j / vSeg;
      const pt = fn(u, v); pos.push(...pt); if (uvFn) uv.push(...uvFn(pt, i / uSeg, v)); else uv.push(i / uSeg, v);
    }
  }
  for (let i = 0; i < uSeg; i++) for (let j = 0; j < vSeg; j++) {
    const a = i * (vSeg + 1) + j, b = a + vSeg + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------- mixing bowl ----------
export const BOWL = { bottom: 0.014, top: 0.118, rb: 0.058, rt: 0.152 };
export const bowlR = y => {
  const k = Math.max(0, Math.min(1, (y - BOWL.bottom) / (BOWL.top - BOWL.bottom)));
  return BOWL.rb + (BOWL.rt - BOWL.rb) * Math.pow(k, 0.55);
};
export function makeBowl(mat = MAT.ceramicSage, inner = MAT.ceramic) {
  const out = [V2(0, 0), V2(0.05, 0), V2(0.054, 0.004), V2(0.056, 0.008)];
  for (let i = 0; i <= 16; i++) { const y = BOWL.bottom - 0.004 + (BOWL.top - BOWL.bottom + 0.004) * i / 16; out.push(V2(bowlR(y) + 0.008, y)); }
  out.push(V2(BOWL.rt + 0.009, BOWL.top + 0.004), V2(BOWL.rt + 0.004, BOWL.top + 0.006));
  const inn = [V2(BOWL.rt + 0.002, BOWL.top + 0.005)];
  for (let i = 16; i >= 0; i--) { const y = BOWL.bottom + (BOWL.top - BOWL.bottom) * i / 16; inn.push(V2(bowlR(y), y)); }
  inn.push(V2(0, BOWL.bottom));
  const g = new THREE.Group();
  g.add(mesh(new THREE.LatheGeometry(out, 72), mat));
  g.add(mesh(new THREE.LatheGeometry(inn.reverse(), 72), inner, { cast: false }));
  return g;
}

// Liquid surface (disc with rings for displacement)
export function makeLiquid() {
  const geo = new THREE.RingGeometry(0.0001, 1, 72, 22);
  geo.rotateX(-Math.PI / 2);
  const base = geo.attributes.position.array.slice();
  const m = mesh(geo, MAT.white.clone(), { cast: false });
  m.userData.base = base;
  return m;
}

// ---------- eggs ----------
const EGG_H = 0.029, EGG_R = 0.0215;
function eggPt(u, v) {
  const y = -1 + 2 * v, th = u * Math.PI * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y)) * (1 - 0.13 * y) * EGG_R;
  return [Math.sin(th) * r, y * EGG_H, Math.cos(th) * r];
}
const cutV = u => 0.56 + 0.045 * (Math.abs(((u * 11) % 1) * 2 - 1) - 0.5) + 0.01 * Math.sin(u * 40);
export function makeEgg() {
  const g = new THREE.Group();
  const bottom = mesh(param(48, 18, eggPt, u => [0, cutV(u)]), MAT.eggShell);
  const top = mesh(param(48, 12, eggPt, u => [cutV(u), 1]), MAT.eggShell);
  g.add(bottom, top);
  g.userData = { bottom, top };
  return g;
}
export function makeYolk() {
  const y = mesh(new THREE.SphereGeometry(0.0135, 32, 20), MAT.yolk);
  y.scale.y = 0.72; return y;
}
export function makeWhite() {
  const w = mesh(new THREE.SphereGeometry(0.03, 32, 16), MAT.white.clone(), { cast: false });
  w.scale.set(1, 0.18, 1); return w;
}

// ---------- small bowls / containers ----------
export function smallBowl(r = 0.06, h = 0.045, mat = MAT.ceramicTerra) {
  const pts = [V2(0, 0), V2(r * 0.55, 0), V2(r * 0.6, 0.004)];
  for (let i = 0; i <= 10; i++) { const k = i / 10; pts.push(V2(r * (0.6 + 0.4 * Math.sin(k * Math.PI / 2)), 0.004 + h * k)); }
  pts.push(V2(r - 0.004, h + 0.002));
  for (let i = 10; i >= 0; i--) { const k = i / 10; pts.push(V2((r - 0.005) * (0.6 + 0.4 * Math.sin(k * Math.PI / 2)), 0.008 + (h - 0.006) * k)); }
  pts.push(V2(0, 0.008));
  return mesh(new THREE.LatheGeometry(pts, 48), mat);
}

export function makeSugarBowl() {
  const g = new THREE.Group();
  g.add(smallBowl(0.058, 0.042, MAT.ceramic));
  const mound = mesh(new THREE.SphereGeometry(0.052, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2), MAT.sugar, { cast: false });
  mound.scale.y = 0.35; mound.position.y = 0.03;
  g.add(mound); g.userData.mound = mound;
  return g;
}

// Measuring jug with milk and an oil layer on top
export function makeJug() {
  const g = new THREE.Group(), R = 0.042, H = 0.12;
  const pts = [V2(0, 0.002), V2(R - 0.004, 0.002), V2(R, 0.006), V2(R + 0.004, H), V2(R + 0.006, H + 0.003)];
  g.add(mesh(new THREE.LatheGeometry(pts, 48), MAT.glass, { cast: false }));
  const milk = mesh(new THREE.CylinderGeometry(R - 0.001, R - 0.003, 1, 40), MAT.milk, { cast: false });
  const oil = mesh(new THREE.CylinderGeometry(R + 0.001, R, 1, 40), MAT.oil, { cast: false });
  g.add(milk, oil);
  // handle
  const handle = mesh(new THREE.TorusGeometry(0.03, 0.006, 10, 24, Math.PI), MAT.glass, { cast: false });
  handle.rotation.z = Math.PI / 2; handle.position.set(-R - 0.004, H * 0.55, 0); g.add(handle);
  // measuring marks
  for (let i = 1; i <= 4; i++) {
    const mk = mesh(new THREE.BoxGeometry(0.012, 0.0015, 0.001), new THREE.MeshBasicMaterial({ color: 0x8a1e1e }), { cast: false });
    mk.position.set(0, i * 0.024, R + 0.003); g.add(mk);
  }
  g.userData = { milk, oil, H, R, level: 1 };
  g.userData.setLevel = k => {
    const lm = 0.002 + (H * 0.62) * k, lo = (H * 0.2) * k;
    milk.scale.y = Math.max(0.0001, lm); milk.position.y = 0.003 + lm / 2;
    oil.scale.y = Math.max(0.0001, lo); oil.position.y = 0.003 + lm + lo / 2;
    milk.visible = oil.visible = k > 0.01;
  };
  g.userData.setLevel(1);
  return g;
}

// Hand sieve full of flour
export function makeSifter() {
  const g = new THREE.Group(), R = 0.07;
  const ring = mesh(new THREE.CylinderGeometry(R, R * 0.92, 0.04, 48, 1, true), MAT.steel);
  ring.material = MAT.steel; ring.position.y = 0.02; g.add(ring);
  const rim = mesh(new THREE.TorusGeometry(R, 0.003, 8, 48), MAT.steel); rim.rotation.x = Math.PI / 2; rim.position.y = 0.04; g.add(rim);
  const meshMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 1, roughness: 0.4, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  const net = mesh(new THREE.SphereGeometry(R * 0.92, 32, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), meshMat, { cast: false });
  net.scale.y = 0.35; g.add(net);
  const handle = mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.11, 12), MAT.wood);
  handle.rotation.z = Math.PI / 2; handle.position.set(R + 0.055, 0.03, 0); g.add(handle);
  const flour = mesh(new THREE.SphereGeometry(R * 0.85, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2), MAT.flour);
  flour.scale.y = 0.5; flour.position.y = 0.0; g.add(flour);
  g.userData = { flour };
  return g;
}

// Hand mixer with two balloon whisks
export function makeMixer() {
  const g = new THREE.Group();
  const body = mesh(new RoundedBoxGeometry(0.17, 0.075, 0.07, 4, 0.03), MAT.plasticWhite);
  body.position.y = 0.2; g.add(body);
  const stripe = mesh(new RoundedBoxGeometry(0.172, 0.018, 0.072, 2, 0.008), MAT.accent);
  stripe.position.y = 0.19; g.add(stripe);
  const handle = mesh(new THREE.TorusGeometry(0.055, 0.014, 14, 32, Math.PI), MAT.plasticWhite);
  handle.position.set(0.02, 0.235, 0); handle.scale.set(1.1, 0.75, 1); g.add(handle);
  const btn = mesh(new THREE.SphereGeometry(0.01, 16, 10), MAT.accent); btn.position.set(0.075, 0.25, 0); g.add(btn);
  const beaters = [];
  for (const s of [-1, 1]) {
    const bt = new THREE.Group(); bt.position.set(s * 0.022 - 0.02, 0.165, 0);
    const shaft = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.1, 8), MAT.steel); shaft.position.y = -0.05; bt.add(shaft);
    for (let k = 0; k < 4; k++) {
      const curve = new THREE.EllipseCurve(0, 0, 0.018, 0.034, 0, Math.PI * 2);
      const pts = curve.getPoints(40).map(p => new THREE.Vector3(p.x, p.y, 0));
      const loopG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 48, 0.0013, 6, true);
      const lp = mesh(loopG, MAT.steel); lp.rotation.y = k * Math.PI / 4; lp.position.y = -0.112; bt.add(lp);
    }
    g.add(bt); beaters.push(bt);
  }
  g.userData = { beaters };
  return g;
}

export function makeSpatula() {
  const g = new THREE.Group();
  const handle = mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.2, 14), MAT.wood); handle.position.y = 0.16; g.add(handle);
  const head = mesh(new RoundedBoxGeometry(0.055, 0.075, 0.008, 4, 0.004), MAT.silicone); head.position.y = 0.035; g.add(head);
  return g;
}

// Round cake pan
export const PAN = { r: 0.1, h: 0.055 };
export function makePan() {
  const r = PAN.r, h = PAN.h, t = 0.003;
  const pts = [V2(0, 0), V2(r, 0), V2(r + t, 0.003), V2(r + t, h), V2(r + t + 0.005, h + 0.002), V2(r + t + 0.005, h + 0.004), V2(r, h + 0.004), V2(r - 0.0005, t), V2(0, t)];
  return mesh(new THREE.LatheGeometry(pts, 72), MAT.brushed);
}

// ---------- cake (main body or a wedge) ----------
// theta measured with x = r sin(th), z = r cos(th)
export const CAKE = { r: 0.098, h: 0.062, dome: 0.012 };
export function makeCakePiece(th0, thLen, withCuts) {
  const { r, h, dome } = CAKE;
  const g = new THREE.Group();
  const topY = rho => h + dome * (1 - rho * rho);
  // side
  const side = mesh(param(64, 6, (u, v) => {
    const th = th0 + thLen * u; return [Math.sin(th) * r, v * h, Math.cos(th) * r];
  }, undefined, undefined, (p, u, v) => [u * thLen / (Math.PI * 2) * 6, v * 0.6]), MAT.batter);
  const planar = p => [p[0] / r * 0.5 + 0.5, p[2] / r * 0.5 + 0.5];
  // top dome
  const top = mesh(param(64, 10, (u, v) => {
    const th = th0 + thLen * u, rho = 1 - v; return [Math.sin(th) * r * rho, topY(rho), Math.cos(th) * r * rho];
  }, undefined, undefined, planar), MAT.batter);
  // bottom
  const bot = mesh(param(32, 2, (u, v) => { const th = th0 + thLen * u; return [Math.sin(th) * r * v, 0.0005, Math.cos(th) * r * v]; }), MAT.batter);
  g.add(side, top, bot);
  if (withCuts) {
    for (const th of [th0, th0 + thLen]) {
      const face = mesh(param(16, 8, (u, v) => {
        const rho = u; return [Math.sin(th) * r * rho, v * topY(rho), Math.cos(th) * r * rho];
      }), MAT.crumb, { cast: true, recv: true });
      // remap uv so the texture runs horizontally along radius
      const uv = face.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.5 + (th === th0 ? 0 : 0.5), uv.getY(i));
      g.add(face);
    }
  }
  // powdered sugar layer
  const dust = mesh(param(64, 10, (u, v) => {
    const th = th0 + thLen * u, rho = 1 - v; return [Math.sin(th) * r * rho, topY(rho) + 0.0012, Math.cos(th) * r * rho];
  }, undefined, undefined, planar), MAT.sugarDust, { cast: false });
  dust.renderOrder = 2; g.add(dust);
  return g;
}
export function makeCake() {
  const W = Math.PI / 4; // wedge size 45°
  const g = new THREE.Group();
  const body = makeCakePiece(W, Math.PI * 2 - W, true);
  const wedge = new THREE.Group(); wedge.add(makeCakePiece(0, W, true));
  g.add(body, wedge);
  g.userData = { body, wedge, W, wedgeMid: W / 2 };
  return g;
}

// ---------- garnish ----------
export function makeDollop() {
  const R = 0.017, H = 0.03;
  const geo = param(64, 14, (u, v) => {
    const th = u * Math.PI * 2;
    const prof = Math.pow(1 - v, 0.75) * (v < 0.08 ? 0.8 + v * 2.5 : 1);
    const ridge = 1 + 0.18 * Math.cos(8 * th + v * 7);
    const r = R * prof * ridge;
    return [Math.sin(th) * r, v * H, Math.cos(th) * r];
  });
  return mesh(geo, MAT.cream);
}
export function makeStrawberry() {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const k = i / 16; // 0 = tip(bottom), 1 = top
    const r = 0.011 * Math.sin(Math.pow(k, 0.7) * Math.PI * 0.62) * (k > 0.92 ? 1 - (k - 0.92) * 6 : 1);
    pts.push(V2(Math.max(0.0002, r), k * 0.026));
  }
  const body = mesh(new THREE.LatheGeometry(pts, 32), MAT.strawberry);
  body.geometry.attributes.uv.array.forEach((_, i, a) => { if (i % 2) a[i] = 1 - a[i]; });
  g.add(body);
  for (let i = 0; i < 6; i++) {
    const lf = mesh(new THREE.ConeGeometry(0.003, 0.012, 4), MAT.leaf, { cast: false });
    lf.position.set(Math.sin(i) * 0.004, 0.026, Math.cos(i) * 0.004);
    lf.rotation.set(Math.PI / 2 - 0.4, i * Math.PI / 3, 0, 'YXZ'); g.add(lf);
  }
  return g;
}
export function makeMint() {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.009, 0.009, 0, 0.022); s.quadraticCurveTo(-0.009, 0.009, 0, 0);
  const geo = new THREE.ShapeGeometry(s, 8);
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.pow(p.getX(i) * 60, 2) * 0.002);
  geo.computeVertexNormals();
  return mesh(geo, MAT.mint, { cast: false });
}

// ---------- oven ----------
export const OVEN = { w: 0.5, h: 0.32, d: 0.38, cw: 0.36 };
export function makeOven() {
  const { w, h, d, cw } = OVEN, t = 0.015;
  const g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0x2e2c2a, metalness: 0.7, roughness: 0.32 });
  const add = (geo, mat, x, y, z) => { const m = mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(new RoundedBoxGeometry(w, t, d, 2, 0.006), shell, 0, h - t / 2, 0); // top
  add(new THREE.BoxGeometry(w, t, d), shell, 0, t / 2 + 0.012, 0); // bottom
  add(new THREE.BoxGeometry(t, h, d), shell, -w / 2 + t / 2, h / 2, 0); // left
  add(new THREE.BoxGeometry(w - cw - t, h, d), shell, w / 2 - (w - cw - t) / 2, h / 2, 0); // control block
  add(new THREE.BoxGeometry(w, h, t), shell, 0, h / 2, -d / 2 + t / 2); // back
  // feet
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.CylinderGeometry(0.008, 0.01, 0.012, 10), MAT.knob, sx * (w / 2 - 0.03), 0.006, sz * (d / 2 - 0.04));
  // cavity lining
  const cx = -w / 2 + t + cw / 2;
  const hidden = new THREE.MeshBasicMaterial({ visible: false });
  const cav = mesh(new THREE.BoxGeometry(cw - 0.004, h - 2 * t - 0.012, d - t - 0.01), [MAT.ovenInside, MAT.ovenInside, MAT.ovenInside, MAT.ovenInside, hidden, MAT.ovenInside], { cast: false });
  cav.position.set(cx, h / 2 + 0.006, 0.0); g.add(cav);
  // heating elements
  const elems = [];
  for (const y of [t + 0.03, h - t - 0.02]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cx - cw / 2 + 0.03, y, d / 2 - 0.05), new THREE.Vector3(cx - cw / 2 + 0.03, y, -d / 2 + 0.06),
      new THREE.Vector3(cx, y, -d / 2 + 0.04), new THREE.Vector3(cx + cw / 2 - 0.03, y, -d / 2 + 0.06), new THREE.Vector3(cx + cw / 2 - 0.03, y, d / 2 - 0.05)]);
    const el = mesh(new THREE.TubeGeometry(curve, 40, 0.004, 8), MAT.element, { cast: false }); g.add(el); elems.push(el);
  }
  // rack
  const rack = new THREE.Group(); rack.position.set(cx, 0.1, 0);
  for (let i = -6; i <= 6; i++) { const b = mesh(new THREE.CylinderGeometry(0.0015, 0.0015, d - 0.06, 6), MAT.steel, { cast: false }); b.rotation.x = Math.PI / 2; b.position.x = i * 0.025; rack.add(b); }
  for (const z of [-1, 1]) { const b = mesh(new THREE.CylinderGeometry(0.002, 0.002, cw - 0.03, 6), MAT.steel, { cast: false }); b.rotation.z = Math.PI / 2; b.position.z = z * (d / 2 - 0.04); rack.add(b); }
  g.add(rack);
  // interior light
  const light = new THREE.PointLight(0xff8a3a, 0, 0.42, 1.2); light.position.set(cx, h - 0.06, 0.02); g.add(light);
  // door (pivot at bottom front edge)
  const door = new THREE.Group(); door.position.set(cx, 0.014, d / 2 + 0.008);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1c1b1a, metalness: 0.6, roughness: 0.3 });
  const dh = h - 0.024, dw = cw + 0.012;
  const fr = (gw, gh, x, y) => { const m = mesh(new THREE.BoxGeometry(gw, gh, 0.016), frameMat); m.position.set(x, y, 0); door.add(m); };
  fr(dw, 0.04, 0, 0.02); fr(dw, 0.035, 0, dh - 0.0175); fr(0.03, dh, -dw / 2 + 0.015, dh / 2); fr(0.03, dh, dw / 2 - 0.015, dh / 2);
  const glass = mesh(new THREE.PlaneGeometry(dw - 0.06, dh - 0.075), MAT.ovenGlass, { cast: false });
  glass.position.set(0, 0.04 + (dh - 0.075) / 2, 0.002); door.add(glass);
  const handle = mesh(new THREE.CylinderGeometry(0.006, 0.006, dw - 0.06, 12), MAT.steel); handle.rotation.z = Math.PI / 2; handle.position.set(0, dh - 0.03, 0.03); door.add(handle);
  for (const s of [-1, 1]) { const p = mesh(new THREE.BoxGeometry(0.008, 0.01, 0.025), MAT.steel); p.position.set(s * (dw / 2 - 0.05), dh - 0.03, 0.017); door.add(p); }
  g.add(door);
  // control panel
  const px = w / 2 - (w - cw - t) / 2;
  const lcdTex = TX.lcd();
  const lcd = mesh(new THREE.PlaneGeometry(0.09, 0.034), new THREE.MeshBasicMaterial({ map: lcdTex, toneMapped: false }), { cast: false });
  lcd.position.set(px, h - 0.06, d / 2 + 0.001); g.add(lcd);
  const knobs = [];
  for (const y of [h * 0.5, h * 0.25]) {
    const k = new THREE.Group(); k.position.set(px, y, d / 2 + 0.002);
    const kb = mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.02, 32), MAT.knob); kb.rotation.x = Math.PI / 2; kb.position.z = 0.01; k.add(kb);
    const mark = mesh(new THREE.BoxGeometry(0.003, 0.016, 0.003), new THREE.MeshBasicMaterial({ color: 0xff8a3a }), { cast: false }); mark.position.set(0, 0.01, 0.021); k.add(mark);
    g.add(k); knobs.push(k);
  }
  g.userData = { door, light, elems, lcdTex, knobs, rack, cx };
  return g;
}

export function makeCoolingRack() {
  const g = new THREE.Group(), s = 0.13;
  for (let i = -6; i <= 6; i++) {
    const a = mesh(new THREE.CylinderGeometry(0.0013, 0.0013, s * 2, 6), MAT.steel); a.rotation.x = Math.PI / 2; a.position.set(i * s / 6, 0.012, 0); g.add(a);
  }
  for (const z of [-1, 0, 1]) { const b = mesh(new THREE.CylinderGeometry(0.0016, 0.0016, s * 2, 6), MAT.steel); b.rotation.z = Math.PI / 2; b.position.set(0, 0.0105, z * s * 0.9); g.add(b); }
  for (const x of [-1, 1]) for (const z of [-1, 1]) { const f = mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.012, 6), MAT.steel); f.position.set(x * s * 0.95, 0.006, z * s * 0.95); g.add(f); }
  return g;
}

export function makeCakeStand() {
  const pts = [V2(0, 0), V2(0.06, 0), V2(0.062, 0.004), V2(0.02, 0.02), V2(0.016, 0.06), V2(0.02, 0.07), V2(0.14, 0.074), V2(0.142, 0.08), V2(0.135, 0.082), V2(0, 0.078)];
  return mesh(new THREE.LatheGeometry(pts, 72), MAT.ceramic);
}
export const STAND_TOP = 0.078;
export function makePlate(r = 0.075) {
  const pts = [V2(0, 0), V2(r * 0.6, 0), V2(r * 0.62, 0.003), V2(r * 0.7, 0.004), V2(r, 0.012), V2(r + 0.002, 0.014), V2(r - 0.003, 0.014), V2(r * 0.68, 0.007), V2(0, 0.006)];
  return mesh(new THREE.LatheGeometry(pts, 64), MAT.ceramic);
}
export function makeKnife() {
  const g = new THREE.Group();
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.16, 0); s.quadraticCurveTo(0.17, 0.02, 0.15, 0.03); s.lineTo(0, 0.032); s.lineTo(0, 0);
  const blade = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.0015, bevelEnabled: true, bevelThickness: 0.0005, bevelSize: 0.0005, bevelSegments: 1 }), MAT.steel);
  g.add(blade);
  const handle = mesh(new RoundedBoxGeometry(0.1, 0.022, 0.014, 3, 0.006), MAT.blackSteel); handle.position.set(-0.05, 0.018, 0.001); g.add(handle);
  return g;
}
export function makeToothpick() {
  const t = mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.08, 6), MAT.wood);
  t.geometry.translate(0, 0.04, 0); return t;
}
export function makeFork() {
  const g = new THREE.Group();
  const h = mesh(new RoundedBoxGeometry(0.1, 0.004, 0.012, 2, 0.002), MAT.steel); h.position.x = -0.05; g.add(h);
  for (let i = -1.5; i <= 1.5; i++) { const t = mesh(new THREE.BoxGeometry(0.035, 0.002, 0.0018), MAT.steel); t.position.set(0.017, 0, i * 0.0035); g.add(t); }
  return g;
}

// ---------- background decor ----------
export function makeDecor() {
  const g = new THREE.Group();
  // jars
  [[-0.95, -0.55, 0.05, 0.16, 0], [-0.82, -0.58, 0.042, 0.12, 1], [-0.72, -0.56, 0.038, 0.1, 2]].forEach(([x, z, r, h, c]) => {
    const jar = new THREE.Group();
    const glass = mesh(new THREE.CylinderGeometry(r, r, h, 32, 1, true), MAT.glass, { cast: false }); glass.position.y = h / 2; jar.add(glass);
    const fill = mesh(new THREE.CylinderGeometry(r - 0.003, r - 0.003, h * 0.7, 32), MAT.jarContents[c]); fill.position.y = h * 0.35; jar.add(fill);
    const lid = mesh(new THREE.CylinderGeometry(r + 0.003, r + 0.003, 0.02, 32), MAT.wood); lid.position.y = h + 0.01; jar.add(lid);
    jar.position.set(x, 0, z); g.add(jar);
  });
  // utensil crock with wooden spoons
  const crock = smallBowl(0.045, 0.13, MAT.ceramic); crock.position.set(0.55, 0, -0.55); g.add(crock);
  for (let i = 0; i < 3; i++) {
    const sp = new THREE.Group();
    const st = mesh(new THREE.CylinderGeometry(0.005, 0.006, 0.28, 8), MAT.wood); st.position.y = 0.14; sp.add(st);
    const hd = mesh(new THREE.SphereGeometry(0.022, 16, 10), MAT.wood); hd.scale.set(1, 1.4, 0.35); hd.position.y = 0.29; sp.add(hd);
    sp.position.set(0.55 + (i - 1) * 0.015, 0.02, -0.55); sp.rotation.set((i - 1) * 0.15, i, (i - 1) * 0.25); g.add(sp);
  }
  // potted basil
  const pot = smallBowl(0.06, 0.1, MAT.pot); pot.position.set(-0.45, 0, -0.6); g.add(pot);
  for (let i = 0; i < 26; i++) {
    const lf = mesh(new THREE.SphereGeometry(0.025, 10, 6), MAT.basil); lf.scale.set(1, 0.25, 0.6);
    const a = i * 2.4, rr = 0.02 + (i % 5) * 0.012;
    lf.position.set(-0.45 + Math.sin(a) * rr, 0.13 + (i % 7) * 0.018, -0.6 + Math.cos(a) * rr);
    lf.rotation.set(Math.sin(i) * 0.6, a, Math.cos(i) * 0.5); g.add(lf);
  }
  // linen towel
  const towel = mesh(new RoundedBoxGeometry(0.32, 0.01, 0.22, 2, 0.004), MAT.linen); towel.position.set(-0.55, 0.005, 0.18); towel.rotation.y = 0.25; g.add(towel);
  return g;
}
