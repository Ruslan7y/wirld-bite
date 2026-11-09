// Turns the planned operations of a generic recipe into animations, and restores step end-states.
import * as THREE from 'three';
import { chop, fly, boardToPan, startStir, stopStir, pinch, turn } from './recipes.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LABEL = { fry: 'Kavruluyor', boil: 'Kaynıyor', cook: 'Pişiyor', bake: 'Fırında', rest: 'Dinleniyor', mix: 'Karışıyor' };

export function applySnap(c, s) {
  for (const t in c.P) {
    const P = c.P[t];
    P.board.count = s.board[t] ? P.board.max : 0;
    P.pan.count = s.pan[t] ? P.pan.max : 0;
    if (P.bowl) P.bowl.count = s.bowl[t] ? P.bowl.max : 0;
    if (P.stage) P.stage.count = 0;
    P.plate.count = 0; P.fly.count = 0;
    P.pan.done = s.done[t] || 0; P.pan.sauce = s.sauce || 0;
    if (P.bowl) { P.bowl.done = 0; P.bowl.sauce = 0; }
    const w = c.wholes[t]; if (w) w.visible = !s.chopped[t];
  }
  c.pan.userData.setLiquid(s.liq.level, s.liq.color, s.liq.op); c.setPanLevel(s.liq.level * 0.7);
  c.pan.userData.oil.material.opacity = s.oil ? 0.3 : 0;
  c.K.setFire(s.fire); c.K.knobs[0].rotation.z = -1.6 * s.fire / 0.8;
  if (s.lid) { c.lid.position.copy(c.pan.localToWorld(V(0, 0.06, 0))); c.lid.rotation.set(0, 0, 0); } else c.drop(c.lid);
  const m = c.bowl.userData.mound; m.visible = s.mound.level > 0.002; m.material.color.set(s.mound.color); m.scale.y = Math.max(0.01, s.mound.level / 0.06);
  c.ST.heat = 0; c.ST.boil = 0; c.ST.steam = 0;
}

async function knob(c, level) {
  const { ch, K } = c;
  c.shot('stove', 0.8);
  await c.station('stove', 0.8);
  await c.reachTo('L', K.knobs[0].getWorldPosition(V()).add(V(0, 0.03, 0.02)), 0.6);
  const f0 = K.fire, r0 = K.knobs[0].rotation.z; c.sfx.knob();
  await c.T(0.5, k => { K.knobs[0].rotation.z = c.lerp(r0, -1.6 * level / 0.8, k); K.setFire(c.lerp(f0, level, k)); });
  ch.rest();
}
async function pourFrom(c, obj, gp, target, tilt, color, ms = 1.4, onK) {
  const { ch } = c;
  await c.grab(obj, 'L', gp, [0, 0, 0]);
  await c.reachTo('L', target.clone().add(V(0.06, 0.2, 0)), 0.7);
  const tip = V(), stream = c.waterStream;
  stream.mat.color.set(color);
  const h = c.H(() => { obj.localToWorld(tip.set(0, gp[1] + 0.06, 0)); stream.set(tip.clone(), target.clone(), 1, 0.002); });
  await c.T(0.45, k => obj.rotation.z = k * tilt);
  c.sfx.pour();
  await c.T(ms, k => onK && onK(k));
  h(); stream.hide();
  await c.T(0.4, k => obj.rotation.z = (1 - k) * tilt);
  c.drop(obj); ch.rest();
}
function vesselObj(c, v) { return v === 'bowl' ? c.bowl : c.pan; }
async function goVessel(c, v) {
  if (v === 'bowl') { c.shot('bowl', 0.9); await c.station('bowl', 0.9); }
  else { await c.station('stove', 0.9); c.shot('pan', 0.9); }
}

const OPS = {
  async chop(c, op) { c.shot('board', 0.9); await chop(c, c.wholes[op.type] || c.wholes.veg, op.type, 2.6); c.drop(c.K.knife); c.ch.rest(); },
  async fire(c, op) { await knob(c, op.level); },
  async oil(c) {
    await c.station('stove', 0.6); c.shot('pan', 0.8);
    const pc = c.pan.localToWorld(V(0, 0.01, 0));
    await pourFrom(c, c.oil, [0, 0.1, 0], pc, 2.0, 0xe0b23a, 1.2, k => c.pan.userData.oil.material.opacity = Math.max(c.pan.userData.oil.material.opacity, 0.3 * k));
  },
  async board(c, op) {
    if (op.vessel === 'pan') { c.shot('pan', 0.9); await boardToPan(c, op.types); c.sfx.sizzleBurst(); }
    else {
      await c.station('bowl', 0.8); c.shot('bowl', 0.8);
      const b = c.K.board, home = c.boardHome();
      await c.moveTo(b, c.bowl.localToWorld(V(-0.05, 0.16, 0)).add(V(0, 0, 0)), 0.8, c.ease.inOut, 0.05);
      await c.T(0.4, k => b.rotation.z = -k * 0.55);
      await Promise.all(op.types.map(t => fly(c, c.P[t].board, c.P[t].bowl, c.P[t].board.count, 0.5, 0.5)));
      await c.T(0.3, k => b.rotation.z = -(1 - k) * 0.55);
      await c.moveTo(b, home.p.clone(), 0.8, c.ease.inOut, 0.05); b.rotation.copy(home.r);
    }
  },
  async stage(c, op) {
    const P = c.P[op.type], bowl = c.K.meatBowl, tgt = vesselObj(c, op.vessel);
    P.stage.count = P.stage.max;
    await goVessel(c, op.vessel);
    await c.grab(bowl, 'R', [0.0, 0.055, -0.085], [0, 0, 0]);
    await c.reachTo('R', tgt.localToWorld(V(-0.04, 0.22, 0.05)), 0.8);
    await c.T(0.45, k => bowl.rotation.z = -k * 1.5);
    if (op.vessel === 'pan' && c.K.fire > 0.1) { c.sfx.sizzleBurst(); c.ST.heat = 1; } else c.sfx.pour();
    await fly(c, P.stage, P[op.vessel === 'bowl' ? 'bowl' : 'pan'], P.stage.count, 0.5, 0.7);
    await c.T(0.4, k => bowl.rotation.z = -(1 - k) * 1.5);
    c.drop(bowl); c.ch.rest();
  },
  async pour(c, op) {
    const tgt = vesselObj(c, op.vessel), pc = tgt.localToWorld(V(0, op.vessel === 'bowl' ? 0.05 : 0.01, 0));
    await goVessel(c, op.vessel);
    if (op.kind === 'paste') {
      c.hold(c.spoon, 'R', [0, 0, -0.15], [Math.PI / 2 - 0.35, 0.3, 0]);
      await c.reachTo('R', c.paste.getWorldPosition(V()).add(V(0, 0.12, 0.02)), 0.6);
      await c.reachTo('R', pc.clone().add(V(0, 0.1, 0)), 0.6); c.sfx.squelch();
      c.drop(c.spoon); c.ch.rest(); return;
    }
    const W = c.water.userData.water; W.material.color.set(op.color); W.material.opacity = op.kind === 'water' ? 0.35 : 0.9;
    const s0 = c.pan.userData.liquid.material.opacity;
    await pourFrom(c, c.water, [0, 0.06, 0], pc, 1.9, op.color, 1.6, k => {
      W.scale.y = 1 - k * 0.95; W.position.y = 0.045 * (1 - k * 0.95);
      if (op.vessel === 'pan') { c.pan.userData.setLiquid(0.004 + 0.012 * k, op.color, Math.max(s0, 0.8 * k)); c.ST.steam = c.K.fire > 0.1 ? 0.8 : 0; }
      else { const m = c.bowl.userData.mound; m.visible = true; m.material.color.set(op.color); m.scale.y = Math.max(m.scale.y, 0.3 * k); }
    });
    W.scale.y = 1; W.position.y = 0.045; W.material.color.set(0xdfefff); W.material.opacity = 0.35;
  },
  async powder(c, op) {
    await goVessel(c, op.vessel);
    const src = op.kind === 'salt' || op.kind === 'flour' || op.kind === 'sugar' || op.kind === 'yeast' ? c.salt : c.black;
    const P = src === c.salt ? c.saltP : c.pepP;
    const tgt = vesselObj(c, op.vessel);
    await c.reachTo('R', src.getWorldPosition(V()).add(V(0, 0.04, 0)), 0.5);
    const over = tgt.localToWorld(V(0, 0.2, 0));
    await c.reachTo('R', over, 0.6);
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < 22; k++) P.emit(over.clone().add(V(c.rand(-0.012, 0.012), -0.03, c.rand(-0.012, 0.012))), V(c.rand(-0.04, 0.04), c.rand(-0.1, 0), c.rand(-0.04, 0.04)), { life: 1, size: c.rand(0.002, 0.0035) });
      c.sfx.sift(); await c.W(0.3);
    }
    c.ch.rest();
  },
  async shape(c) {
    await goVessel(c, 'bowl'); const b = c.bowl;
    for (let i = 0; i < 6; i++) {
      c.ch.reach('R', b.localToWorld(V(-0.03, 0.07 + (i % 2) * 0.02, 0)), 10); c.ch.reach('L', b.localToWorld(V(0.03, 0.07 + ((i + 1) % 2) * 0.02, 0)), 10);
      c.sfx.squelch(); await c.W(0.4);
    }
    c.ch.rest();
  },
  async lid(c) {
    await c.station('stove', 0.6); c.shot('stove', 0.8);
    await c.grab(c.lid, 'L', [0, 0.075, 0], [0, 0, 0]);
    await c.reachTo('L', c.pan.localToWorld(V(0, 0.2, 0)), 0.6);
    c.drop(c.lid); c.lid.rotation.set(0, 0, 0); c.lid.position.copy(c.pan.localToWorld(V(0, 0.2, 0)));
    await c.moveTo(c.lid, c.pan.localToWorld(V(0, 0.06, 0)), 0.4, c.ease.in); c.sfx.lid(); c.ch.rest();
  },
  async bowlToPan(c) {
    await goVessel(c, 'bowl');
    await c.say('Kasedekileri tavaya alıyoruz.').catch(() => { });
    const b = c.bowl; const types = Object.keys(c.P).filter(t => c.P[t].bowl.count);
    const hr = c.H(() => { c.ch.reach('R', b.localToWorld(V(-0.16, 0.1, 0)), 14); c.ch.reach('L', b.localToWorld(V(0.16, 0.1, 0)), 14); });
    const home = b.position.clone();
    await c.both(c.station('stove', 1.0), c.moveTo(b, c.pan.localToWorld(V(-0.1, 0.22, 0)), 1.0, c.ease.inOut, 0.06));
    c.shot('pan', 0.6);
    await c.T(0.5, k => b.rotation.z = -k * 1.2);
    await Promise.all(types.map(t => fly(c, c.P[t].bowl, c.P[t].pan, c.P[t].bowl.count, 0.5, 0.6)));
    c.bowl.userData.mound.visible = false;
    await c.T(0.4, k => b.rotation.z = -(1 - k) * 1.2);
    hr(); c.ch.rest();
    await c.moveTo(b, home, 0.8, c.ease.inOut, 0.05);
  },
  async cook(c, op, st, i, plan) {
    const prev = i > 0 ? plan.steps[i - 1].snap : null, cur = st.snap;
    await c.station('stove', 0.8); c.shot('pan', 0.9); c.ch.look(c.pan.getWorldPosition(V()));
    const fry = op.mode === 'fry', boil = op.mode === 'boil' || cur.liq.op > 0.3;
    const lidOn = cur.lid;
    const stir = lidOn ? null : startStir(c, fry ? 1 : 0.6);
    const setK = k => {
      for (const t in c.P) { const P = c.P[t].pan; if (!P.count) continue; P.done = c.lerp(prev ? prev.done[t] || 0 : 0, cur.done[t] || 0, k); P.sauce = c.lerp(prev ? prev.sauce : 0, cur.sauce, k); }
      c.ST.heat = fry ? 0.9 : boil ? 0.15 : 0.45; c.ST.boil = boil ? 0.8 : 0; c.ST.steam = boil ? 0.6 : fry ? 0.15 : 0.3;
    };
    if (op.dur >= 60) {
      const t = c.startTimer(Math.round(op.dur / 60), (LABEL[op.mode] || 'Pişiyor'));
      c.say(op.dur >= 600 ? 'Şimdi süre dolana kadar pişmeye bırakıyoruz. Alarm çalınca sana haber vereceğim.' : 'Biraz pişsin, ara ara karıştırıyoruz.', `⏱ ${Math.round(op.dur / 60)} dk · ⏩ ile hızlandırabilirsin`).catch(() => { });
      await c.waitTimer(t, setK, [[0.5, fry ? 'Rengi güzelce dönüyor!' : 'Yarısı geçti, kokusu harika.']]);
    } else { await c.T(Math.max(3, Math.min(6, op.dur || 4)), k => setK(k)); }
    if (stir) stopStir(c, stir);
  },
  async bake(c, op, st) {
    const { oven, pan, K } = c;
    if (!oven) return;
    c.shot('oven', 0.9); await c.station('oven', 0.9);
    const OV = oven.userData;
    c.sfx.door(); await c.T(0.8, k => OV.door.rotation.x = k * 1.45, c.ease.out);
    const front = oven.localToWorld(V(OV.cx, 0.14, 0.4)), inside = oven.localToWorld(V(OV.cx, 0.1, 0));
    K.setFire(0); c.ST.heat = 0; c.ST.boil = 0;
    const home = pan.position.clone(), r0 = pan.rotation.y;
    await c.moveTo(pan, front, 1.0, c.ease.inOut, 0.1); await c.moveTo(pan, inside, 0.8);
    c.sfx.clank(); c.sfx.door(); await c.T(0.6, k => OV.door.rotation.x = (1 - k) * 1.45, c.ease.in);
    OV.light.intensity = 0.3; c.M.MAT.element.emissiveIntensity = 1.1; c.setLoop('oven', 0.5);
    const dur = op.dur || 1800;
    const t = c.startTimer(Math.max(1, Math.round(dur / 60)), 'Fırında');
    c.say('Fırına verdik. Süre dolunca alarm çalacak.', `⏱ ${Math.round(dur / 60)} dk`).catch(() => { });
    await c.waitTimer(t, k => { for (const ty in c.P) { const P = c.P[ty].pan; if (P.count) P.done = Math.max(P.done, k); } OV.lcdTex.draw(`${Math.ceil((1 - k) * dur / 60)}′`, 'FIRIN'); });
    c.setLoop('oven', 0); OV.light.intensity = 0; c.M.MAT.element.emissiveIntensity = 0;
    c.sfx.door(); await c.T(0.7, k => OV.door.rotation.x = k * 1.45, c.ease.out);
    await c.moveTo(pan, front, 0.7); await c.moveTo(pan, home, 1.0, c.ease.inOut, 0.1); pan.rotation.y = r0;
    c.sfx.door(); await c.T(0.6, k => OV.door.rotation.x = (1 - k) * 1.45, c.ease.in);
    await c.station('stove', 0.8);
  },
  async mixBowl(c, op) {
    await goVessel(c, 'bowl');
    c.hold(c.spoon, 'R', [0, 0, -0.15], [Math.PI / 2 - 0.35, 0.3, 0]);
    let a = 0; const b = c.bowl;
    const h = c.H(dt => {
      a += dt * 3; c.ch.reach('R', b.localToWorld(V(Math.cos(a) * 0.06, 0.13, Math.sin(a) * 0.06)), 12); c.ch.reach('L', b.localToWorld(V(0.17, 0.08, 0)), 8);
      for (const t in c.P) { const P = c.P[t].bowl; if (!P) continue; for (let i = 0; i < P.count; i++) { const it = P.items[i]; it.a += dt * (1.3 - it.rad * 5); it.p.x = Math.cos(it.a) * it.rad; it.p.z = Math.sin(it.a) * it.rad; } }
    });
    c.sfx.squelch();
    if (op.dur >= 60) { const t = c.startTimer(Math.round(op.dur / 60), 'Karışıyor'); await c.waitTimer(t, () => { }); }
    else await c.W(3);
    h(); c.drop(c.spoon); c.ch.rest();
  },
  async rest(c, op) {
    c.shot('wide', 1.2); c.ch.look(V(0, 0.5, 2));
    if (op.dur >= 60) {
      const t = c.startTimer(Math.round(op.dur / 60), 'Dinleniyor');
      c.say('Şimdi dinlenmeye bırakıyoruz. Süre dolunca alarm çalacak.', `⏱ ${Math.round(op.dur / 60)} dk`).catch(() => { });
      await c.waitTimer(t, () => { });
    } else await c.W(2.5);
  },
  async serve(c, op, st, i, plan) { await serveGeneric(c, plan); },
};

export async function playStep(c, st, i, plan, title) {
  c.shot('front', 0.6); c.ch.look(V(0, 0.5, 2));
  // the chef reads the step while she already starts doing it (lines inside actions wait for the reading)
  const reading = st.text ? c.say(st.text, i === plan.steps.length - 1 ? '' : `Tarif adımı ${i + 1} / ${plan.steps.length}`) : Promise.resolve();
  const cc = Object.create(c);
  cc.say = (...a) => reading.catch(() => { }).then(() => c.say(...a));
  await c.W(st.ops.length ? 1.2 : 0.2);
  for (const op of st.ops) { if (OPS[op.op]) await OPS[op.op](cc, op, st, i, plan); }
  await reading;
  c.ch.rest(); c.ch.look(V(0, 0.5, 2));
}

// serving for any recipe: plate it, garnish, carry to the table, Ruslan tastes it
async function serveGeneric(c, plan) {
  const { ch, P, pan, lid, plate, K } = c;
  const last = plan.steps[plan.steps.length - 1].snap;
  const vessel = Object.keys(last.pan).length ? 'pan' : 'bowl';
  c.ST.heat = 0; c.ST.boil = 0; c.ST.steam = 0.3; c.quiet(true);
  if (K.fire > 0.05) await knob(c, 0);
  if (lid.position.distanceTo(pan.localToWorld(V(0, 0.06, 0))) < 0.05) { await c.grab(lid, 'L', [0, 0.075, 0], [0, 0, 0]); c.drop(lid); }
  K.meatBowl.visible = false;
  plate.position.copy(c.plateSpot()); plate.visible = true; plate.scale.setScalar(0.01);
  await c.T(0.4, k => plate.scale.setScalar(Math.max(0.01, k)), c.ease.outBack);
  c.shot(c.REAL ? 'serve' : 'plate', 0.9);
  c.hold(c.spoon, 'R', [0, 0, -0.15], [Math.PI / 2 - 0.35, 0.3, 0]);
  const src = vessel === 'bowl' ? c.bowl : pan;
  for (let s = 0; s < 3; s++) {
    await c.reachTo('R', src.localToWorld(V(0, 0.09, 0)), 0.5);
    await c.reachTo('R', plate.localToWorld(V(0, 0.1, 0)), 0.5);
    await Promise.all(Object.keys(P).filter(t => t !== 'parsley').map(t => P[t][vessel] && fly(c, P[t][vessel], P[t].plate, Math.ceil(P[t][vessel].count / (3 - s)), 0.4, 0.3)));
    c.sfx.squelch();
  }
  c.drop(c.spoon); ch.rest();
  if (vessel === 'pan') { pan.userData.setLiquid(0, 0, 0); c.setPanLevel(0); } else c.bowl.userData.mound.visible = false;
  if (P.parsley) { P.parsley.board.count = P.parsley.board.max; if (c.wholes.parsley) c.wholes.parsley.visible = false; await c.say('Üzerine biraz yeşillik serpiyoruz.'); await fly(c, P.parsley.board, P.parsley.plate, P.parsley.max, 0.6, 0.8); c.sfx.sparkle(); }
  if (c.REAL && c.TABLE) {
    await c.say('Haydi, yemeğimizi masaya götürelim.');
    c.hold(plate, 'R', [-0.12, 0.012, 0], [0, 0, 0]);
    const hl = c.H(() => ch.reach('L', plate.localToWorld(V(0.13, 0.015, 0)), 14));
    await c.W(0.5);
    c.shot('table', 0.01); await c.station('table', 0.01);
    const dest = (c.TABLE.guestPlate || c.TABLE.spot).clone().add(V(0, 0.003, 0));
    await c.reachTo('R', dest.clone().add(V(0.2, 0.06, -0.25)), 0.8);
    c.release(plate); hl(); await c.moveTo(plate, dest, 0.5, c.ease.out); c.sfx.thunk(); ch.rest();
    const G = c.guest;
    if (G) {
      await c.say('Buyur Ruslan, afiyetle ye!');
      const fork = c.fork(); fork.visible = true;
      const fh = c.H(() => { fork.position.copy(G.arms.R.grip.getWorldPosition(V())); fork.rotation.set(0, -Math.PI / 2 + 0.3, -0.5); fork.translateX(0.03); });
      for (let b = 0; b < 2; b++) {
        G.look(dest); G.reach('R', dest.clone().add(V(0.02, 0.06, -0.03 * b)), 6); await c.W(0.9);
        G.reach('R', dest.clone().add(V(0.02, 0.025, -0.03 * b)), 10); await c.W(0.35);
        G.reach('R', G.head.getWorldPosition(V()).add(V(0, -0.1, 0)).addScaledVector(V(0, 0, 1).applyAxisAngle(V(0, 1, 0), G.root.rotation.y), 0.13), 5); await c.W(1.0);
        G.mood = 'chew'; G.look(V(0, 0.5, 2)); await c.W(1.3); G.mood = 'happy';
      }
      G.rest(); G.look(V(0, 0.5, 2));
      await c.say(`Mmm, ${plan.title || 'bu yemek'} çok lezzetli olmuş, ellerine sağlık!`, '', G);
    }
  } else { c.shot('front', 1.2); }
  ch.look(V(0, 0.5, 2)); ch.cheer(); c.sfx.success(); c.vib(40);
  await c.say('Yemeğimiz hazır. Afiyet olsun {hey}!');
}
