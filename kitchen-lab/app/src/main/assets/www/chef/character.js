// Three stylized 3D chefs: Leyla nənə, Zeynep teyze, Şef Aylin.
// Built from primitives, with 2-bone arm IK, blinking, lip movement and gestures.
import * as THREE from 'three';
import { mesh } from '../js/models.js';
import { tween, ease, lerp, clamp } from '../js/util.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const V2 = (x, y) => new THREE.Vector2(x, y);
const std = (c, r = 0.6, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
const skinMat = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.6, sheen: 0.25, sheenColor: new THREE.Color(0xff9a80), sheenRoughness: 0.7 });

const LOOK = {
  leyla: { name: 'Leyla nənə', skin: 0xf2c9a6, hair: 0xc9ccd3, top: 0x7c4a3a, apron: 0xf4ebdd, eye: 0x4a3326, voice: { pitch: 0.85, rate: 0.88 } },
  zeynep: { name: 'Zeynep teyze', skin: 0xeec09a, hair: 0x3a2418, top: 0x2f6f62, apron: 0xfce7c8, eye: 0x3b2516, scarf: 0xb83a5e, voice: { pitch: 1.0, rate: 0.95 } },
  aylin: { name: 'Şef Aylin', skin: 0xebbd96, hair: 0x4a2c20, top: 0xfbfaf6, apron: 0xfbfaf6, eye: 0x3d2416, scarf: 0xe0482f, voice: { pitch: 1.15, rate: 1.03 } },
};
export const CHEF_INFO = LOOK;

function dotsTex(base, dot) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 256, 256); g.fillStyle = dot;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.beginPath(); g.arc(x * 32 + (y % 2) * 16 + 8, y * 32 + 12, 5, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); return t;
}

// capsule between two points helper (geometry along +Y from 0..len)
function limb(r, len, mat) {
  const g = new THREE.CapsuleGeometry(r, len, 6, 14); g.translate(0, len / 2, 0);
  return mesh(g, mat);
}
const UP = V(0, 1, 0);
function orient(obj, from, to) {
  obj.position.copy(from);
  const d = V().subVectors(to, from); const L = d.length();
  obj.quaternion.setFromUnitVectors(UP, d.normalize());
  return L;
}

export function makeCharacter(id) {
  const L = LOOK[id] || LOOK.zeynep;
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const skin = skinMat(L.skin);
  const top = new THREE.MeshPhysicalMaterial({ color: L.top, roughness: 0.8, sheen: 0.25, sheenColor: new THREE.Color(L.top).lerp(new THREE.Color(0xffffff), 0.3), sheenRoughness: 0.8 });
  const apronM = std(L.apron, 0.85);
  const hairM = std(L.hair, 0.7);

  // ---- torso ----
  const tp = [V2(0, -0.45), V2(0.165, -0.45), V2(0.175, -0.25), V2(0.168, -0.05), V2(0.18, 0.1), V2(0.19, 0.2), V2(0.175, 0.27), V2(0.13, 0.32), V2(0.06, 0.345), V2(0, 0.35)];
  const torso = mesh(new THREE.LatheGeometry(tp, 40), top); torso.scale.z = 0.72; body.add(torso);
  // apron (bib + skirt) following the front curve
  const apron = new THREE.Group(); body.add(apron);
  const skirt = mesh(new THREE.CylinderGeometry(0.182, 0.182, 0.42, 30, 1, true, -0.95, 1.9), apronM); skirt.scale.z = 0.76; skirt.position.y = -0.22; apron.add(skirt);
  if (id !== 'aylin') {
    const bib = mesh(new THREE.CylinderGeometry(0.196, 0.186, 0.2, 30, 1, true, -0.55, 1.1), apronM); bib.scale.z = 0.76; bib.position.y = 0.09; apron.add(bib);
    const pocket = mesh(new THREE.CylinderGeometry(0.184, 0.184, 0.07, 20, 1, true, -0.3, 0.6), std(0xe6d7bf, 0.85)); pocket.scale.z = 0.77; pocket.position.y = -0.2; apron.add(pocket);
    const tie = mesh(new THREE.TorusGeometry(0.183, 0.008, 6, 40), apronM); tie.scale.z = 0.73; tie.rotation.x = Math.PI / 2; tie.position.y = -0.01; apron.add(tie);
  } else {
    // chef jacket: double row of buttons + collar
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const b = mesh(new THREE.SphereGeometry(0.008, 10, 8), std(0xd9d2c4, 0.3)); b.position.set(s * 0.05, 0.18 - i * 0.075, 0.137 - i * 0.002); body.add(b);
    }
    const scarf = mesh(new THREE.ConeGeometry(0.05, 0.09, 3), std(L.scarf, 0.6)); scarf.rotation.set(Math.PI, 0, 0); scarf.scale.z = 0.4; scarf.position.set(0, 0.29, 0.1); body.add(scarf);
  }
  const collar = mesh(new THREE.TorusGeometry(0.06, 0.018, 10, 24), id === 'aylin' ? std(0xffffff, 0.6) : top); collar.rotation.x = Math.PI / 2; collar.position.y = 0.345; body.add(collar);
  // neck
  const neck = mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.09, 16), skin); neck.position.y = 0.38; body.add(neck);

  // ---- head ----
  const head = new THREE.Group(); head.position.set(0, 0.535, 0.01); root.add(head);
  const skull = mesh(new THREE.SphereGeometry(0.135, 40, 30), skin); skull.scale.set(1, 1.04, 0.96); head.add(skull);
  const jaw = mesh(new THREE.SphereGeometry(0.105, 32, 20), skin); jaw.position.set(0, -0.04, 0.004); jaw.scale.set(1, 0.85, 0.95); head.add(jaw);
  // ears
  for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.026, 14, 10), skin); e.scale.set(0.5, 1, 0.8); e.position.set(s * 0.132, -0.005, -0.005); head.add(e); }
  // eyes
  const eyes = [];
  const white = std(0xffffff, 0.15), iris = new THREE.MeshPhysicalMaterial({ color: L.eye, roughness: 0.1, clearcoat: 1 }), pupil = std(0x0d0806, 0.1), glint = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const s of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(s * 0.05, 0.012, 0.112); head.add(eg);
    const ball = mesh(new THREE.SphereGeometry(0.026, 24, 16), white, { cast: false }); ball.scale.set(1, 1.1, 0.7); eg.add(ball);
    const ir = mesh(new THREE.SphereGeometry(0.0165, 20, 14), iris, { cast: false }); ir.scale.z = 0.45; ir.position.z = 0.015; eg.add(ir);
    const pu = mesh(new THREE.SphereGeometry(0.008, 14, 10), pupil, { cast: false }); pu.scale.z = 0.4; pu.position.z = 0.021; eg.add(pu);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.0042, 8, 6), glint); gl.position.set(0.006, 0.007, 0.024); eg.add(gl);
    // eyelid (skin shell that drops when blinking)
    const lid = mesh(new THREE.SphereGeometry(0.0285, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), skin, { cast: false }); lid.scale.set(1, 1.1, 0.78); lid.rotation.x = -1.35; eg.add(lid);
    eg.userData = { lid, ir, pu };
    eyes.push(eg);
  }
  // brows
  const brows = [];
  for (const s of [-1, 1]) {
    const b = mesh(new THREE.CapsuleGeometry(0.0055, 0.03, 4, 8), std(id === 'leyla' ? 0x9a9ca3 : L.hair, 0.7), { cast: false });
    b.rotation.z = Math.PI / 2 + s * 0.12; b.position.set(s * 0.05, 0.058, 0.122); head.add(b); brows.push(b);
  }
  // nose, cheeks
  const nose = mesh(new THREE.SphereGeometry(0.019, 16, 12), skinMat(new THREE.Color(L.skin).multiplyScalar(0.95))); nose.position.set(0, -0.016, 0.134); nose.scale.set(1, 0.85, 0.9); head.add(nose);
  const blush = new THREE.MeshBasicMaterial({ color: 0xf28e86, transparent: true, opacity: 0.35, depthWrite: false });
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CircleGeometry(0.022, 20), blush); c.position.set(s * 0.078, -0.03, 0.112); c.rotation.y = s * 0.6; head.add(c); }
  // mouth: smile arc + inner (opens while talking)
  const lips = std(0x9a4234, 0.4);
  const smile = mesh(new THREE.TorusGeometry(0.026, 0.0055, 8, 20, Math.PI), lips, { cast: false });
  smile.rotation.z = Math.PI; smile.position.set(0, -0.052, 0.124); smile.rotation.x = -0.25; head.add(smile);
  const inner = mesh(new THREE.SphereGeometry(0.024, 20, 12), std(0x4a1410, 0.6), { cast: false });
  inner.position.set(0, -0.066, 0.118); inner.scale.set(1, 0.05, 0.4); head.add(inner);
  const teeth = mesh(new THREE.BoxGeometry(0.03, 0.006, 0.004), std(0xffffff, 0.3), { cast: false }); teeth.position.set(0, -0.06, 0.127); teeth.visible = false; head.add(teeth);

  // ---- hair & headwear ----
  const accessory = new THREE.Group(); head.add(accessory);
  if (id === 'leyla') {
    const cap = mesh(new THREE.SphereGeometry(0.145, 36, 20, 0, Math.PI * 2, 0, 1.45), hairM); cap.position.set(0, 0.012, -0.012); cap.rotation.x = -0.25; head.add(cap);
    const bun = mesh(new THREE.SphereGeometry(0.055, 20, 14), hairM); bun.position.set(0, 0.13, -0.07); head.add(bun);
    for (const s of [-1, 1]) { const side = mesh(new THREE.SphereGeometry(0.05, 16, 12), hairM); side.position.set(s * 0.115, 0.03, 0.02); side.scale.set(0.5, 1, 0.9); head.add(side); }
    const gm = std(0x5b4636, 0.35, { metalness: 0.4 });
    for (const s of [-1, 1]) {
      const rim = mesh(new THREE.TorusGeometry(0.032, 0.0035, 8, 28), gm, { cast: false }); rim.position.set(s * 0.05, 0.012, 0.142); head.add(rim);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.031, 24), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0, depthWrite: false })); lens.position.copy(rim.position); head.add(lens);
      const arm = mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.13, 6), gm, { cast: false }); arm.rotation.x = Math.PI / 2; arm.position.set(s * 0.12, 0.02, 0.07); arm.rotation.y = s * 0.15; head.add(arm);
    }
    const bridge = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.03, 6), gm, { cast: false }); bridge.rotation.z = Math.PI / 2; bridge.position.set(0, 0.018, 0.145); head.add(bridge);
  } else if (id === 'aylin') {
    const cap = mesh(new THREE.SphereGeometry(0.143, 36, 20, 0, Math.PI * 2, 0, 1.5), hairM); cap.position.set(0, 0.01, -0.016); cap.rotation.x = -0.2; head.add(cap);
    const fringe = mesh(new THREE.SphereGeometry(0.06, 16, 10), hairM); fringe.scale.set(1.6, 0.45, 0.6); fringe.position.set(0.035, 0.085, 0.095); fringe.rotation.z = -0.3; head.add(fringe);
    const tail = limb(0.032, 0.13, hairM); tail.position.set(0.04, 0.02, -0.13); tail.rotation.set(2.6, 0, -0.35); head.add(tail);
    const hatM = std(0xffffff, 0.75);
    const band = mesh(new THREE.CylinderGeometry(0.137, 0.135, 0.07, 36), hatM); band.position.y = 0.1; head.add(band);
    const puff = new THREE.Group(); puff.position.y = 0.19; head.add(puff);
    [[0, 0.03, 0, 0.1], [0.06, 0, 0.03, 0.075], [-0.06, 0, 0.03, 0.075], [0.04, 0, -0.06, 0.075], [-0.04, 0, -0.06, 0.075], [0, 0.0, 0.07, 0.07]].forEach(([x, y, z, r]) => { const s = mesh(new THREE.SphereGeometry(r, 20, 14), hatM); s.position.set(x, y, z); puff.add(s); });
  } else {
    const scarfM = new THREE.MeshPhysicalMaterial({ map: dotsTex('#a82e52', '#f7c3d3'), roughness: 0.75, sheen: 0.3, sheenColor: new THREE.Color(0xd06080), side: THREE.DoubleSide });
    const shell = mesh(new THREE.SphereGeometry(0.155, 40, 24, Math.PI / 2 + 1.05, Math.PI * 2 - 2.1, 0, 2.35), scarfM); shell.position.set(0, 0.005, -0.005); head.add(shell);
    const crown = mesh(new THREE.SphereGeometry(0.157, 40, 12, 0, Math.PI * 2, 0, 0.95), scarfM); crown.rotation.x = 0.22; crown.position.z = 0.0; head.add(crown);
    const brim = mesh(new THREE.TorusGeometry(0.12, 0.018, 10, 40, 2.4), scarfM); brim.position.set(0, 0.0, 0.07); brim.rotation.set(0, 0, Math.PI / 2 - 1.2 + 0.0); brim.rotation.z = -0.35 + Math.PI * 0.5 - 1.2 + 1.2 - 0.0; head.add(brim);
    brim.rotation.set(0, 0, 0); brim.rotation.z = Math.PI / 2 - 1.2 + Math.PI; brim.scale.set(1, 1.1, 0.6); brim.position.set(0, 0.0, 0.085);
    // drape over shoulders (attached to the body)
    const drape = mesh(new THREE.LatheGeometry([V2(0.11, 0.48), V2(0.14, 0.42), V2(0.2, 0.33), V2(0.215, 0.28)], 40), scarfM); drape.scale.z = 0.8; body.add(drape);
  }

  // ---- arms ----
  const sleeve = top;
  const arms = {};
  for (const [side, s] of [['R', -1], ['L', 1]]) {
    const shoulder = V(s * 0.2, 0.285, 0);
    const ball = mesh(new THREE.SphereGeometry(0.058, 20, 14), sleeve); ball.position.copy(shoulder); body.add(ball);
    const upper = limb(0.043, 0.2, sleeve);
    const fore = limb(0.035, 0.2, sleeve);
    const cuff = mesh(new THREE.TorusGeometry(0.034, 0.009, 8, 20), id === 'aylin' ? std(0xffffff, 0.6) : apronM);
    const hand = new THREE.Group();
    const palm = mesh(new THREE.SphereGeometry(0.032, 18, 14), skin); palm.scale.set(1, 0.6, 1.15); hand.add(palm);
    const fingers = limb(0.017, 0.026, skin); fingers.rotation.x = Math.PI / 2 - 0.35; fingers.position.set(0, -0.004, 0.024); fingers.scale.set(1.5, 1, 0.75); hand.add(fingers);
    const thumb = limb(0.011, 0.022, skin); thumb.position.set(-s * 0.027, 0.005, 0.0); thumb.rotation.set(Math.PI / 2 - 0.4, 0, -s * 0.9); hand.add(thumb);
    const grip = new THREE.Group(); grip.position.set(0, 0, 0.03); hand.add(grip);
    root.add(upper, fore, cuff, hand);
    arms[side] = { s, shoulder, upper, fore, cuff, hand, grip, target: V(s * 0.2, 0.0, 0.25), cur: V(s * 0.2, 0.0, 0.25), roll: 0, speed: 10, pole: V(s * 0.9, -1, -0.6) };
  }

  const ch = {
    id, name: L.name, voice: L.voice, root, head, eyes, arms, accessory,
    speaking: false, mouth: 0, mood: 'happy', lookTarget: null, _lookQ: new THREE.Quaternion(),
    blinkT: 2, t: 0, gesture: null,
  };
  const tmp = V(), tmp2 = V(), tmpE = V(), wpos = V();

  // set a hand target in world space (smoothly followed)
  ch.reach = (side, world, speed = 10) => { const a = arms[side]; a.target.copy(root.worldToLocal(world.clone())); a.speed = speed; };
  ch.reachLocal = (side, local, speed = 10) => { arms[side].target.copy(local); arms[side].speed = speed; };
  ch.rest = (speed = 6) => { ch.reachLocal('R', V(-0.18, 0.02, 0.33), speed); ch.reachLocal('L', V(0.18, 0.02, 0.33), speed); };
  ch.look = world => { ch.lookTarget = world ? world.clone() : null; };
  ch.handWorld = side => arms[side].hand.getWorldPosition(V());

  function solveArm(a) {
    const S = a.shoulder, T = a.cur;
    const l1 = 0.29, l2 = 0.28;
    const d = tmp.subVectors(T, S); let D = d.length();
    D = clamp(D, 0.08, l1 + l2 - 0.002); d.normalize();
    const cosA = clamp((l1 * l1 + D * D - l2 * l2) / (2 * l1 * D), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
    const n = tmp2.copy(a.pole).addScaledVector(d, -a.pole.dot(d)).normalize();
    const E = tmpE.copy(S).addScaledVector(d, l1 * cosA).addScaledVector(n, l1 * sinA);
    const Tc = V().copy(S).addScaledVector(d, D);
    orient(a.upper, S, E); a.upper.scale.y = 1;
    const fl = orient(a.fore, E, Tc);
    a.fore.scale.y = 1;
    // hand: fingers along forearm direction, palm facing down
    const dir = V().subVectors(Tc, E).normalize();
    a.hand.position.copy(Tc).addScaledVector(dir, 0.03);
    const m = new THREE.Matrix4();
    const zAx = dir.clone(), xAx = V(0, 1, 0).cross(zAx).normalize();
    if (xAx.lengthSq() < 0.01) xAx.set(1, 0, 0);
    const yAx = V().crossVectors(zAx, xAx).normalize();
    m.makeBasis(xAx, yAx, zAx);
    a.hand.quaternion.setFromRotationMatrix(m);
    if (a.roll) a.hand.rotateZ(a.roll);
    a.cuff.position.copy(Tc).addScaledVector(dir, -0.01);
    a.cuff.quaternion.setFromUnitVectors(V(0, 0, 1), dir);
  }

  ch.update = (dt, time) => {
    ch.t += dt;
    // breathing
    body.scale.set(1 + Math.sin(time * 1.6) * 0.006, 1 + Math.sin(time * 1.6) * 0.01, 1);
    // hands follow targets
    for (const k of ['R', 'L']) {
      const a = arms[k];
      a.cur.lerp(a.target, 1 - Math.exp(-a.speed * dt));
      solveArm(a);
    }
    // head: look at target or camera-ish, plus talking nods
    let yaw = Math.sin(time * 0.5) * 0.05, pitch = Math.sin(time * 0.37) * 0.03;
    if (ch.lookTarget) {
      head.getWorldPosition(wpos);
      const d = tmp.subVectors(ch.lookTarget, wpos);
      const inv = root.getWorldQuaternion(new THREE.Quaternion()).invert(); d.applyQuaternion(inv);
      yaw = clamp(Math.atan2(d.x, d.z), -0.8, 0.8); pitch = clamp(-Math.atan2(d.y, Math.hypot(d.x, d.z)), -0.5, 0.6);
    }
    if (ch.speaking) { pitch += Math.sin(time * 7.3) * 0.025; yaw += Math.sin(time * 3.1) * 0.03; }
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, Math.sin(time * 0.8) * 0.03 + (ch.gesture === 'tilt' ? 0.15 : 0), 'YXZ'));
    head.quaternion.slerp(q, 1 - Math.exp(-6 * dt));
    // mouth
    const target = ch.speaking ? clamp(0.35 + 0.65 * Math.abs(Math.sin(time * 13) * Math.sin(time * 5.7 + 1))) : (ch.mood === 'wow' ? 0.7 : 0);
    ch.mouth += (target - ch.mouth) * Math.min(1, dt * 18);
    inner.scale.y = 0.05 + ch.mouth * 0.75;
    teeth.visible = ch.mouth > 0.3;
    smile.scale.set(1 + ch.mouth * 0.15, 1 - ch.mouth * 0.4, 1);
    smile.position.y = -0.052 + ch.mouth * 0.004;
    // brows lift when speaking
    brows.forEach((b, i) => { b.position.y = 0.058 + (ch.speaking ? Math.abs(Math.sin(time * 2.1)) * 0.006 : 0) + (ch.mood === 'wow' ? 0.01 : 0); });
    // blink
    ch.blinkT -= dt;
    let lidK = 0;
    if (ch.blinkT < 0.15) lidK = Math.sin(clamp(1 - ch.blinkT / 0.15) * Math.PI);
    if (ch.blinkT < 0) ch.blinkT = 2 + Math.random() * 3.5;
    eyes.forEach(e => { e.userData.lid.rotation.x = lerp(-1.35, 0.25, lidK) + (ch.mood === 'happy' ? 0.15 : 0); });
    // eyes follow look target slightly
    if (ch.lookTarget) eyes.forEach(e => { e.userData.ir.position.x = clamp(yaw * 0.006, -0.004, 0.004); e.userData.pu.position.x = e.userData.ir.position.x; });
  };

  // gestures
  ch.wave = async () => {
    ch.gesture = 'tilt'; ch.mood = 'happy';
    const a = arms.R;
    ch.reachLocal('R', V(-0.3, 0.55, 0.15), 8);
    await tween(1.6, k => { a.target.x = -0.3 + Math.sin(k * Math.PI * 6) * 0.06; });
    ch.gesture = null; ch.rest(5);
  };
  ch.cheer = async () => {
    ch.mood = 'wow';
    ch.reachLocal('R', V(-0.26, 0.62, 0.12), 7); ch.reachLocal('L', V(0.26, 0.62, 0.12), 7);
    await tween(1.4, k => { const b = Math.sin(k * Math.PI * 5) * 0.04; arms.R.target.y = 0.6 + b; arms.L.target.y = 0.6 - b; });
    ch.mood = 'happy'; ch.rest(5);
  };
  ch.thumbsUp = async () => {
    ch.reachLocal('L', V(0.2, 0.32, 0.3), 8); arms.L.roll = -1.4;
    await tween(1.1, () => { });
    arms.L.roll = 0; ch.rest(5);
  };
  ch.rest(100);
  // faces don't receive shadows (avoids acne on curved, overlapping parts)
  head.traverse(o => { if (o.isMesh) o.receiveShadow = false; });
  return ch;
}
