// Rigged realistic human (Renderpeople) driven by code: 2-bone arm IK, finger grip, jaw talk, blinking, head look.
import * as THREE from 'three';
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function setupHuman(gltf, tex) {
  const root = gltf.scene;
  let skinned = null; const B = {};
  root.traverse(o => { if (o.isSkinnedMesh) skinned = o; if (o.isBone) B[o.name] = o; });
  const mat = new THREE.MeshStandardMaterial({ map: tex.dif, normalMap: tex.norm, roughness: 0.62, metalness: 0 });
  mat.normalScale.set(1, 1);
  skinned.material = mat; skinned.castShadow = true; skinned.receiveShadow = true; skinned.frustumCulled = false;
  // rest pose copies
  const rest = {}; for (const k in B) rest[k] = B[k].quaternion.clone();
  const H = { root, B, rest, speaking: false, t: 0, blink: 2, look: null, targets: { l: null, r: null }, grip: { l: 0, r: 0 } };

  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), va = V(), vb = V(), vc = V();
  // rotate bone so that the direction bone→child points along dirWorld
  function aim(bone, child, dirWorld) {
    bone.updateWorldMatrix(true, false);
    const bp = bone.getWorldPosition(V()), cp = child.getWorldPosition(V());
    const cur = cp.sub(bp).normalize();
    qa.setFromUnitVectors(cur, dirWorld.clone().normalize());
    const wq = bone.getWorldQuaternion(new THREE.Quaternion());
    const nw = qa.multiply(wq);
    const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    bone.quaternion.copy(pq.multiply(nw));
    bone.updateWorldMatrix(false, true);
  }
  function solveArm(side, target, pole) {
    const up = B['upperarm_' + side], lo = B['lowerarm_' + side], hand = B['hand_' + side];
    const S = up.getWorldPosition(V()), Ep = lo.getWorldPosition(V()), Hp = hand.getWorldPosition(V());
    const l1 = S.distanceTo(Ep), l2 = Ep.distanceTo(Hp);
    const d = vb.subVectors(target, S); let D = Math.min(d.length(), l1 + l2 - 0.001); d.normalize();
    const cosA = THREE.MathUtils.clamp((l1 * l1 + D * D - l2 * l2) / (2 * l1 * D), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
    const n = vc.copy(pole).addScaledVector(d, -pole.dot(d)).normalize();
    const E = V().copy(S).addScaledVector(d, l1 * cosA).addScaledVector(n, l1 * sinA);
    aim(up, lo, E.clone().sub(S));
    const T = V().copy(S).addScaledVector(d, D);
    aim(lo, hand, T.clone().sub(lo.getWorldPosition(V())));
  }
  const FINGERS = ['index', 'middle', 'ring', 'pinky'];
  H.update = (dt, time) => {
    H.t += dt;
    for (const k in B) B[k].quaternion.copy(rest[k]);
    // breathing + slight sway
    const sp = B.spine_02; if (sp) sp.rotateX(Math.sin(time * 1.5) * 0.012);
    const sp3 = B.spine_03; if (sp3) sp3.rotateX(0.06);
    root.updateMatrixWorld(true);
    // arms
    for (const s of ['l', 'r']) {
      const tg = H.targets[s];
      if (tg) {
        const pole = V(0, -1, 0).add(H.root.localToWorld(V(s === 'l' ? 1 : -1, 0, -0.6)).sub(H.root.getWorldPosition(V())).normalize());
        solveArm(s, tg, pole.normalize());
      } else {
        // relaxed: arms down from A-pose
        const S = B['upperarm_' + s].getWorldPosition(V());
        const side = H.root.localToWorld(V(s === 'l' ? 0.18 : -0.18, 0.78, 0.1));
        solveArm(s, side, H.root.localToWorld(V(s === 'l' ? 1 : -1, 0, -1)).sub(H.root.getWorldPosition(V())).normalize());
      }
      // fingers curl
      const g = H.grip[s];
      for (const f of FINGERS) for (const j of [1, 2, 3]) { const b = B[`${f}_0${j}_${s}`]; if (b) b.rotateZ((s === 'l' ? 1 : -1) * g * (j === 1 ? 0.9 : 1.1)); }
    }
    // head look
    const head = B.head, neck = B.neck;
    if (H.look && head) {
      head.updateWorldMatrix(true, false);
      const hp = head.getWorldPosition(V());
      const dir = H.look.clone().sub(hp).normalize();
      const fwd = H.root.localToWorld(V(0, 0, 1)).sub(H.root.getWorldPosition(V())).normalize();
      const yaw = THREE.MathUtils.clamp(Math.atan2(dir.x * fwd.z - dir.z * fwd.x, dir.x * fwd.x + dir.z * fwd.z), -0.7, 0.7);
      const pitch = THREE.MathUtils.clamp(-Math.asin(dir.y), -0.4, 0.6);
      neck && neck.rotateX(pitch * 0.4);
      head.rotateX(pitch * 0.5);
      head.rotateY ? 0 : 0;
      head.parent.updateWorldMatrix(true, false);
      // yaw around world up, applied on the head
      const pq = head.parent.getWorldQuaternion(new THREE.Quaternion());
      const yq = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -yaw * 0.8);
      const wq = head.getWorldQuaternion(new THREE.Quaternion());
      head.quaternion.copy(pq.invert().multiply(yq.multiply(wq)));
    }
    // talking: jaw
    const jaw = B.jaw;
    if (jaw) { const o = H.speaking ? Math.max(0, Math.sin(time * 14) * Math.sin(time * 5.3 + 1)) * 0.22 + 0.03 : 0; jaw.rotateX(o * H.jawSign); }
    // blink
    H.blink -= dt;
    let k = 0; if (H.blink < 0.14) k = Math.sin(Math.min(1, 1 - H.blink / 0.14) * Math.PI); if (H.blink < 0) H.blink = 2 + Math.random() * 3;
    for (const s of ['l', 'r']) { const e = B['eyelid_' + s]; if (e) e.rotateX(k * 0.5 * H.lidSign); }
  };
  H.jawSign = 1; H.lidSign = 1;
  return H;
}
