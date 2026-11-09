// Carla (Renderpeople rigged) wrapped in the same interface as the stylized chefs,
// so the recipe engine can drive her: reach/rest/look/speaking/wave/cheer/grip.
import * as THREE from 'three';
import { tween } from '../js/util.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = THREE.MathUtils.clamp;
export const FLOOR = -0.895; // real floor in recipe space (counter top = 0)

export function makeCarla(gltf, tex, getCamera, opts = {}) {
  const root = new THREE.Group();
  const body = gltf.scene; body.position.y = FLOOR; root.add(body);
  let skinned = null; const B = {};
  body.traverse(o => { if (o.isSkinnedMesh) skinned = o; if (o.isBone) B[o.name.includes('_walking_') ? o.name.split('_walking_')[1] : o.name] = o; });
  // normalise size: head bone ≈ 1.62 m above the ankles, feet on the floor
  root.updateMatrixWorld(true);
  { const hy = B.head.getWorldPosition(V()).y, fy = B.foot_l.getWorldPosition(V()).y, h = hy - fy;
    if (Math.abs(h - 1.55) > 0.2) body.scale.multiplyScalar((opts.height || 1.62) / h);
    root.updateMatrixWorld(true);
    body.position.y += FLOOR + 0.085 - B.foot_l.getWorldPosition(V()).y; root.updateMatrixWorld(true); }
  const seated = !!opts.seated;
  if (seated) { const hipY = B.hip.getWorldPosition(V()).y; body.position.y -= hipY - (FLOOR + (opts.seatH || 0.47) + 0.09); root.updateMatrixWorld(true); }
  skinned.material = new THREE.MeshStandardMaterial({ map: tex.dif, normalMap: tex.norm, roughness: 0.62 });
  skinned.castShadow = true; skinned.receiveShadow = true; skinned.frustumCulled = false;
  const rest = {}; for (const k in B) rest[k] = B[k].quaternion.clone();

  // ---- apron (follows the spine) ----
  body.updateMatrixWorld(true);
  if (opts.apron !== false) {
  const apronMat = new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.85, side: THREE.DoubleSide });
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.225, 0.52, 32, 4, true, -1.1, 2.2), apronMat);
  skirt.scale.z = 0.85; skirt.position.set(0, 0.8, 0.03); skirt.castShadow = true;
  const bib = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.3, 28, 2, true, -0.62, 1.24), apronMat);
  bib.scale.z = 0.95; bib.position.set(0, 1.17, 0.035); bib.castShadow = true;
  const strapG = new THREE.CylinderGeometry(0.008, 0.008, 0.24, 6);
  const straps = [-1, 1].map(s => { const m = new THREE.Mesh(strapG, apronMat); m.position.set(s * 0.07, 1.39, 0.06); m.rotation.z = s * 0.35; return m; });
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.168, 0.012, 6, 40), apronMat); tie.scale.z = 0.85; tie.rotation.x = Math.PI / 2; tie.scale.x = 1.17; tie.position.set(0, 1.05, 0.02);
  body.add(skirt, bib, ...straps, tie);
  B.spine_01.attach(skirt); B.spine_01.attach(tie); B.spine_03.attach(bib); straps.forEach(s => B.spine_03.attach(s));
  }

  // grip points (palm centres) as plain objects in the scene
  const arms = {};
  for (const [S, s] of [['R', 'r'], ['L', 'l']]) {
    const grip = new THREE.Object3D();
    arms[S] = { s, grip, target: V(), cur: V(), speed: 8, roll: 0, gripK: 0.25, gripT: 0.25, pose: null, fd: V(0, -1, 0), pn: V(0, -1, 0) };
  }
  const ch = {
    id: opts.id || 'carla', name: opts.name || 'Carla', root, head: B.head, arms, speaking: false, mood: 'happy', t: 0,
    blink: 2, lookTarget: null, lookCam: false, gesture: null, _lean: 0, _yaw: 0,
  };
  const local = (x, y, z) => root.localToWorld(V(x, y, z));
  ch.reach = (side, world, speed = 10) => { arms[side].target.copy(world); arms[side].speed = speed; arms[side].free = false; };
  ch.reachLocal = (side, l, speed = 10) => ch.reach(side, local(l.x, l.y + 0.12, l.z), speed);
  ch.rest = (speed = 6) => { for (const S of ['R', 'L']) { arms[S].free = true; arms[S].speed = speed; arms[S].pose = null; } };
  // desired hand orientation: fingers direction + palm normal (world); null = automatic
  ch.handPose = (side, fdir, pnorm) => { arms[side].pose = fdir ? { f: fdir.clone().normalize(), n: pnorm.clone().normalize() } : null; };
  ch.look = w => { ch.lookCam = !!(w && w.z > 1.5); ch.lookTarget = w && !ch.lookCam ? w.clone() : null; };
  ch.setGrip = (side, v) => { arms[side].gripT = v; };
  ch.handWorld = side => arms[side].grip.getWorldPosition(V());

  const qa = new THREE.Quaternion();
  function aim(bone, child, dirWorld) {
    const bp = bone.getWorldPosition(V()), cp = child.getWorldPosition(V());
    qa.setFromUnitVectors(cp.sub(bp).normalize(), dirWorld.clone().normalize());
    const nw = qa.multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
    bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(nw));
    bone.updateWorldMatrix(false, true);
  }
  function solveArm(s, target, pole) {
    const up = B['upperarm_' + s], lo = B['lowerarm_' + s], hand = B['hand_' + s];
    const S = up.getWorldPosition(V()), Ep = lo.getWorldPosition(V()), Hp = hand.getWorldPosition(V());
    const l1 = S.distanceTo(Ep), l2 = Ep.distanceTo(Hp);
    const d = V().subVectors(target, S); const D = Math.min(d.length(), l1 + l2 - 0.002); d.normalize();
    const cosA = clamp((l1 * l1 + D * D - l2 * l2) / (2 * l1 * D), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
    const n = pole.clone().addScaledVector(d, -pole.dot(d)).normalize();
    const E = S.clone().addScaledVector(d, l1 * cosA).addScaledVector(n, l1 * sinA);
    aim(up, lo, E.clone().sub(S));
    aim(lo, hand, S.clone().addScaledVector(d, D).sub(lo.getWorldPosition(V())));
    return D / (l1 + l2);
  }
  const FINGERS = ['index', 'middle', 'ring', 'pinky'];
  // rotate the hand so fingers point along f and the palm faces n (world vectors)
  function orientHand(s, f, n) {
    const hand = B['hand_' + s]; hand.updateWorldMatrix(true, true);
    const hp = hand.getWorldPosition(V()), mp = B['middle_01_' + s].getWorldPosition(V());
    const ip = B['index_01_' + s].getWorldPosition(V()), pp = B['pinky_01_' + s].getWorldPosition(V());
    const fd = mp.clone().sub(hp).normalize(), across = ip.clone().sub(pp).normalize();
    const pn = V().crossVectors(fd, across).normalize().multiplyScalar((s === 'r' ? 1 : -1) * ch.palmSign);
    const q1 = new THREE.Quaternion().setFromUnitVectors(fd, f);
    const pn1 = pn.applyQuaternion(q1);
    const a1 = pn1.addScaledVector(f, -pn1.dot(f)).normalize(), a2 = n.clone().addScaledVector(f, -n.dot(f)).normalize();
    let ang = Math.acos(THREE.MathUtils.clamp(a1.dot(a2), -1, 1)); if (V().crossVectors(a1, a2).dot(f) < 0) ang = -ang;
    const q = new THREE.Quaternion().setFromAxisAngle(f, ang).multiply(q1).multiply(hand.getWorldQuaternion(new THREE.Quaternion()));
    hand.quaternion.copy(hand.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));
    hand.updateWorldMatrix(false, true);
  }
  const fwd = V(), rgt = V(), tmp = V();

  ch.update = (dt, time) => {
    ch.t += dt;
    for (const k in B) B[k].quaternion.copy(rest[k]);
    root.updateMatrixWorld(true);
    fwd.set(0, 0, 1).transformDirection(root.matrixWorld); rgt.set(1, 0, 0).transformDirection(root.matrixWorld);
    // follow targets
    for (const S of ['R', 'L']) {
      const a = arms[S];
      const goal = a.free ? (seated ? local(S === 'R' ? -0.17 : 0.17, (opts.tableY ?? -0.1) + 0.03, 0.33) : local(S === 'R' ? -0.2 : 0.2, -0.13, 0.1)) : a.target;
      if (!a.init) { a.cur.copy(goal); a.init = true; }
      a.cur.lerp(goal, 1 - Math.exp(-a.speed * dt));
      a.gripK += (a.gripT - a.gripK) * Math.min(1, dt * 8);
    }
    // lean + twist the spine toward the work so the hands can reach the counter
    const mid = V().addVectors(arms.R.cur, arms.L.cur).multiplyScalar(0.5);
    const rel = root.worldToLocal(mid.clone());
    const busy = !(arms.R.free && arms.L.free) && !seated;
    const leanT = busy ? clamp((rel.z - 0.05) * 0.9 + (0.35 - rel.y) * 0.35, 0, 0.42) : 0.02;
    const yawT = busy ? clamp(Math.atan2(rel.x, Math.max(0.15, rel.z)) * 0.55, -0.5, 0.5) : 0;
    ch._lean += (leanT - ch._lean) * Math.min(1, dt * 4); ch._yaw += (yawT - ch._yaw) * Math.min(1, dt * 4);
    B.spine_01.rotateX(ch._lean * 0.45 * ch.leanSign); B.spine_02.rotateX(ch._lean * 0.35 * ch.leanSign + Math.sin(time * 1.5) * 0.01);
    B.spine_01.rotateY(ch._yaw * 0.5); B.spine_02.rotateY(ch._yaw * 0.5);
    root.updateMatrixWorld(true);
    if (seated) {
      // sitting: thighs forward, shins down, slight lean toward the table
      B.spine_02.rotateX(0.08 * ch.leanSign + (ch.eatLean || 0));
      for (const s of ['l', 'r']) {
        const ul = B['upperleg_' + s], ll = B['lowerleg_' + s], ft = B['foot_' + s];
        const hip = ul.getWorldPosition(V());
        const side = rgt.clone().multiplyScalar((s === 'l' ? 1 : -1) * 0.04);
        const knee = hip.clone().addScaledVector(fwd, 0.44).add(V(0, -0.02, 0)).add(side);
        aim(ul, ll, knee.clone().sub(hip));
        const kp = ll.getWorldPosition(V());
        aim(ll, ft, kp.clone().add(V(0, -0.42, 0)).addScaledVector(fwd, 0.06).add(side).sub(kp));
        ft.rotateX(-0.25);
      }
      root.updateMatrixWorld(true);
    }
    // arms: the target is the palm centre; aim the wrist slightly behind it
    for (const S of ['R', 'L']) {
      const a = arms[S], s = a.s;
      const elbowOut = V().copy(rgt).multiplyScalar(S === 'R' ? -0.9 : 0.9).add(V(0, -1.1, 0)).addScaledVector(fwd, -0.4).normalize();
      const wrist = a.cur.clone().add(V(0, 0.05, 0)).addScaledVector(fwd, -0.04);
      solveArm(s, wrist, elbowOut);
      // hand orientation
      const hand = B['hand_' + s];
      let wantF, wantN;
      if (a.pose) { wantF = a.pose.f; wantN = a.pose.n; }
      else if (a.free) { wantF = V(0, -1, 0).addScaledVector(fwd, 0.15).normalize(); wantN = rgt.clone().multiplyScalar(S === 'R' ? 1 : -1); }
      else { const fa = hand.getWorldPosition(V()).sub(B['lowerarm_' + s].getWorldPosition(V())).normalize(); wantF = fa.add(V(0, -0.35, 0)).normalize(); wantN = V(0, -1, 0); }
      a.fd.lerp(wantF, Math.min(1, dt * 10)).normalize(); a.pn.lerp(wantN, Math.min(1, dt * 10)).normalize();
      orientHand(s, a.fd, a.pn);
      // fingers curl toward the palm
      const g = a.gripK, cs = ch.curlSign * (s === 'l' ? 1 : -1);
      for (const f of FINGERS) for (const j of [1, 2, 3]) { const b = B[`${f}_0${j}_${s}`]; if (b) b.rotateZ(cs * (0.12 + g * (j === 1 ? 0.95 : 1.15))); }
      for (const [j, w] of [[1, 0.45], [2, 0.6], [3, 0.6]]) {
        const tb = B[`thumb_0${j}_${s}`]; if (!tb) continue;
        tb.rotateZ((0.1 + g) * w); // same sign on both hands: thumb wraps into the palm
      }
      body.updateMatrixWorld(true);
      const hp = B['hand_' + s].getWorldPosition(V()), mp = B['middle_01_' + s].getWorldPosition(V());
      a.grip.position.copy(hp).lerp(mp, 0.85).add(V(0, -0.012, 0));
    }
    // head: look at the camera while talking, otherwise at the work
    const head = B.head, neck = B.neck;
    let lt = ch.lookCam ? getCamera().position : ch.lookTarget;
    if (!lt && busy) lt = mid;
    if (lt) {
      const hp = head.getWorldPosition(V());
      const d = lt.clone().sub(hp); const lx = d.dot(rgt), lz = d.dot(fwd);
      const yaw = clamp(Math.atan2(lx, lz) - ch._yaw, -0.9, 0.9);
      const pitch = clamp(Math.atan2(-d.y, Math.hypot(lx, lz)) - ch._lean * 0.6, -0.5, 0.7);
      ch._hy = (ch._hy || 0) + (yaw - (ch._hy || 0)) * Math.min(1, dt * 5);
      ch._hp = (ch._hp || 0) + (pitch - (ch._hp || 0)) * Math.min(1, dt * 5);
      const up = V(0, 1, 0);
      for (const [bn, w] of [[neck, 0.4], [head, 0.6]]) {
        if (!bn) continue;
        bn.updateWorldMatrix(true, false);
        const wq = bn.getWorldQuaternion(new THREE.Quaternion());
        const q = new THREE.Quaternion().setFromAxisAngle(up, ch._hy * w).multiply(new THREE.Quaternion().setFromAxisAngle(rgt, ch._hp * w)).multiply(wq);
        bn.quaternion.copy(bn.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));
      }
    }
    if (ch.speaking) { head.rotateX(Math.sin(time * 6.1) * 0.02); head.rotateZ(Math.sin(time * 2.3) * 0.02); }
    // jaw (talking) + blink
    const open = ch.speaking ? Math.max(0, Math.sin(time * 13) * Math.sin(time * 4.7 + 1)) * 0.16 + 0.02 : ch.mood === 'chew' ? Math.max(0, Math.sin(time * 9)) * 0.07 : (ch.mood === 'wow' ? 0.12 : 0);
    ch._jaw = (ch._jaw || 0) + (open - (ch._jaw || 0)) * Math.min(1, dt * 20);
    B.jaw && B.jaw.rotateX(ch._jaw * ch.jawSign);
    ch.blink -= dt; let k = 0;
    if (ch.blink < 0.14) k = Math.sin(clamp(1 - ch.blink / 0.14, 0, 1) * Math.PI);
    if (ch.blink < 0) ch.blink = 2 + Math.random() * 3;
    for (const s of ['l', 'r']) { const e = B['eyelid_' + s]; if (e) e.rotateX(k * 0.45 * ch.lidSign); }
  };
  ch.jawSign = 1; ch.lidSign = 1; ch.leanSign = 1; ch.palmSign = -1; ch.curlSign = 1; ch.thumbVar = 0;

  ch.wave = async () => {
    ch.mood = 'happy';
    const t0 = performance.now();
    await tween(1.8, k => { ch.reach('R', local(-0.28 + Math.sin(k * Math.PI * 6) * 0.05, 0.62, 0.12), 9); });
    ch.rest(5);
  };
  ch.cheer = async () => {
    ch.mood = 'wow';
    await tween(1.4, k => { const b = Math.sin(k * Math.PI * 5) * 0.04; ch.reach('R', local(-0.24, 0.7 + b, 0.1), 8); ch.reach('L', local(0.24, 0.7 - b, 0.1), 8); });
    ch.mood = 'happy'; ch.rest(5);
  };
  ch.thumbsUp = async () => { ch.reach('L', local(0.2, 0.42, 0.3), 8); await tween(1.1, () => { }); ch.rest(5); };
  ch.rest(100);
  return ch;
}
