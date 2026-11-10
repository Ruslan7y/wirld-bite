// Turns the planned operations of a generic recipe into animations, and restores step end-states.
import * as THREE from 'three';
import { chop, fly, boardToPan, startStir, stopStir, pinch, turn } from './recipes.js';
import { GRAIN } from './generic.js';

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
    P.pan.done = s.done[t] || 0; P.pan.sauce = s.sauce || 0; P.pan.grow = (s.grow || {})[t] || 0; P.plate.grow = P.pan.grow; if (P.bowl) P.bowl.grow = P.pan.grow;
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

// grains are poured as a running stream of hundreds of grains, batch after batch
async function pourGrains(c, src, dst, batches = 9) {
  const n = src.count; if (!n) return;
  const per = Math.ceil(n / batches);
  for (let b = 0; b < batches && src.count; b++) { if (b % 2 === 0) c.sfx.sift(); await fly(c, src, dst, per, 0.32, 0.16); }
}
const NAME = { rice: 'pirinci', bulgur: 'bulguru', couscous: 'kuskusu', oats: 'yulafı', lentil: 'mercimeği' };
function vesselObj(c, v) { return v === 'bowl' ? c.bowl : c.pan; }
async function goVessel(c, v) {
  if (v === 'bowl') { c.shot('bowl', 0.9); await c.station('bowl', 0.9); }
  else { await c.station('stove', 0.9); c.shot('pan', 0.9); }
}

const OPS = {
  async chop(c, op) {
    c.shot('board', 0.9);
    const w = c.wholes[op.type] || c.wholes.veg || Object.values(c.wholes)[0];
    const n = c.P[op.type] ? c.P[op.type].board.max : 20;
    await chop(c, w, op.type, Math.min(5.5, Math.max(2.8, 1.6 + n * 0.07))); c.drop(c.K.knife); c.ch.rest();
  },
  async fire(c, op) { await knob(c, op.level); },
  // rinse / soak grains in the bowl: pour them in, add water, rub them with the fingers, drain
  async wash(c, op) {
    const b = c.bowl, m = b.userData.mound, bowlK = c.K.meatBowl;
    await goVessel(c, 'bowl');
    for (const t of op.types) {
      const P = c.P[t]; P.stage.count = P.stage.max;
      await c.grab(bowlK, 'R', [0.0, 0.055, -0.085], [0, 0, 0]);
      await c.reachTo('R', b.localToWorld(V(-0.04, 0.24, 0.05)), 0.8);
      await c.T(0.45, k => bowlK.rotation.z = -k * 1.6);
      await pourGrains(c, P.stage, P.bowl);
      await c.T(0.4, k => bowlK.rotation.z = -(1 - k) * 1.6);
      c.drop(bowlK); c.ch.rest();
    }
    // water in
    const W = c.water.userData.water; W.material.color.set(0xdcecff);
    await pourFrom(c, c.water, [0, 0.06, 0], b.localToWorld(V(0, 0.06, 0)), 1.9, 0xdcecff, 1.5, k => {
      W.scale.y = 1 - k * 0.9; W.position.y = 0.045 * (1 - k * 0.9);
      m.visible = true; m.material.color.set(0xd6e6f2); m.scale.y = Math.max(0.01, 0.32 * k);
    });
    W.scale.y = 1; W.position.y = 0.045;
    c.say(op.dur >= 600 ? 'Suyun içinde bekletiyoruz, tanelerin nişastası çıksın.' : 'Elimle ovuşturarak, suyu berraklaşana kadar yıkıyoruz.').catch(() => { });
    // fingers rub the grains: they swirl in the water, the water gets cloudy
    let a = 0;
    const h = c.H(dt => {
      a += dt * 4; c.ch.reach('R', b.localToWorld(V(Math.cos(a) * 0.05, 0.08, Math.sin(a) * 0.05)), 12); c.ch.reach('L', b.localToWorld(V(0.17, 0.08, 0)), 8);
      for (const t of op.types) { const P = c.P[t].bowl; for (let i = 0; i < P.count; i++) { const it = P.items[i]; it.a += dt * (2.2 - it.rad * 12); it.p.x = Math.cos(it.a) * it.rad; it.p.z = Math.sin(it.a) * it.rad; it.r.x += dt * 2; } }
    });
    for (let r = 0; r < 3; r++) { c.sfx.pour(); await c.T(1.6, k => m.material.color.lerpColors(new THREE.Color(0xd6e6f2), new THREE.Color(0xf4f1e8), k * (0.8 - r * 0.25))); }
    h(); c.ch.rest();
    if (op.dur >= 60) {
      const t = c.startTimer(Math.round(op.dur / 60), 'Islanıyor');
      await c.waitTimer(t, () => { });
    }
    // drain: tip the bowl over the sink side, the water runs out, grains stay
    const home = b.position.clone();
    const hr = c.H(() => { c.ch.reach('R', b.localToWorld(V(-0.16, 0.1, 0)), 14); c.ch.reach('L', b.localToWorld(V(0.16, 0.1, 0)), 14); });
    await c.moveTo(b, home.clone().add(V(0, 0.08, 0)), 0.5);
    c.sfx.pour();
    await c.T(1.2, k => { b.rotation.z = Math.sin(k * Math.PI) * 0.45; m.scale.y = Math.max(0.01, 0.32 * (1 - k)); });
    m.visible = false; b.rotation.z = 0;
    await c.moveTo(b, home, 0.4); hr(); c.ch.rest();
  },
  // washed grains from the bowl into the pan
  async washedIn(c, op) {
    const b = c.bowl, tgt = vesselObj(c, op.vessel);
    await goVessel(c, 'bowl');
    const hr = c.H(() => { c.ch.reach('R', b.localToWorld(V(-0.16, 0.1, 0)), 14); c.ch.reach('L', b.localToWorld(V(0.16, 0.1, 0)), 14); });
    const home = b.position.clone();
    await c.both(c.station(op.vessel === 'pan' ? 'stove' : 'bowl', 1.0), c.moveTo(b, tgt.localToWorld(V(-0.1, 0.22, 0)), 1.0, c.ease.inOut, 0.06));
    if (op.vessel === 'pan') c.shot('pan', 0.6);
    await c.T(0.5, k => b.rotation.z = -k * 1.25);
    if (op.vessel === 'pan' && c.K.fire > 0.1) { c.sfx.sizzleBurst(); c.ST.heat = 0.8; }
    for (const t of op.types) await pourGrains(c, c.P[t].bowl, c.P[t][op.vessel === 'bowl' ? 'bowl' : 'pan'], 7);
    await c.T(0.4, k => b.rotation.z = -(1 - k) * 1.25);
    hr(); c.ch.rest();
    await c.moveTo(b, home, 0.8, c.ease.inOut, 0.05);
  },

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
    if (GRAIN.has(op.type)) await pourGrains(c, P.stage, P[op.vessel === 'bowl' ? 'bowl' : 'pan']);
    else await fly(c, P.stage, P[op.vessel === 'bowl' ? 'bowl' : 'pan'], P.stage.count, 0.5, 0.7);
    await c.T(0.4, k => bowl.rotation.z = -(1 - k) * 1.5);
    c.drop(bowl); c.ch.rest();
  },
  async pour(c, op) {
    const tgt = vesselObj(c, op.vessel), pc = tgt.localToWorld(V(0, op.vessel === 'bowl' ? 0.05 : 0.01, 0));
    await goVessel(c, op.vessel);
    if (['paste', 'sauce', 'nutbutter', 'honey'].includes(op.kind)) {
      c.hold(c.spoon, 'R', [0, 0, -0.15], [Math.PI / 2 - 0.35, 0.3, 0]);
      await c.reachTo('R', c.paste.getWorldPosition(V()).add(V(0, 0.12, 0.02)), 0.6);
      await c.reachTo('R', pc.clone().add(V(0, 0.1, 0)), 0.6); c.sfx.squelch();
      await c.reachTo('R', pc.clone().add(V(0.02, 0.06, 0.02)), 0.4);
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
    if (op.bg) return bgStart(c, op, st, i, plan);
    await c.station('stove', 0.8); c.shot('pan', 0.9); c.ch.look(c.pan.getWorldPosition(V()));
    const fry = op.mode === 'fry', boil = op.mode === 'boil' || cur.liq.op > 0.3;
    const lidOn = cur.lid;
    const stir = lidOn ? null : startStir(c, fry ? 1 : 0.6);
    const setK = k => {
      for (const t in c.P) { const P = c.P[t].pan; if (!P.count) continue; P.done = c.lerp(prev ? prev.done[t] || 0 : 0, cur.done[t] || 0, k); P.sauce = c.lerp(prev ? prev.sauce : 0, cur.sauce, k); }
      c.ST.heat = fry ? 0.9 : boil ? 0.15 : 0.45; c.ST.boil = boil ? 0.8 : 0; c.ST.steam = boil ? 0.6 : fry ? 0.15 : 0.3;
      if (op.absorb || op.drain) {
        const l0 = prev ? prev.liq.level : 0, o0 = prev ? prev.liq.op : 0, kk = op.drain ? Math.min(1, k * 3) : k;
        const lv = c.lerp(l0, cur.liq.level, kk), oo = cur.liq.op > 0 ? o0 : c.lerp(o0, 0, Math.max(0, (kk - 0.6) / 0.4));
        c.pan.userData.setLiquid(lv, undefined, oo); c.setPanLevel(lv * 0.7);
        for (const t in c.P) { const P = c.P[t].pan; if (P.count && GRAIN.has(t) || t === 'pasta') P.grow = c.lerp(prev && prev.grow ? prev.grow[t] || 0 : 0, (cur.grow || {})[t] || 0, k); }
        c.ST.boil = boil ? 0.8 * (1 - kk * 0.7) : 0; c.ST.steam = 0.6;
      }
    };
    if (op.dur >= 60) {
      const t = c.startTimer(Math.round(op.dur / 60), (LABEL[op.mode] || 'Pişiyor'));
      c.say(op.dur >= 600 ? 'Şimdi süre dolana kadar pişmeye bırakıyoruz. Alarm çalınca sana haber vereceğim.' : 'Biraz pişsin, ara ara karıştırıyoruz.', `⏱ ${Math.round(op.dur / 60)} dk · ⏩ ile hızlandırabilirsin`).catch(() => { });
      const gr = Object.keys(c.P).find(t => GRAIN.has(t) && c.P[t].pan.count);
      await c.waitTimer(t, setK, gr && op.absorb ? [[0.35, 'Taneler suyu çekiyor, kapağı açıp karıştırmıyoruz.'], [0.75, 'Yüzeyde küçük delikler oluştu, suyunu neredeyse çekti.']] : [[0.5, fry ? 'Rengi güzelce dönüyor!' : 'Yarısı geçti, kokusu harika.']]);
    } else {
      const gr = Object.keys(c.P).find(t => GRAIN.has(t) && c.P[t].pan.count);
      if (gr && fry && !op.absorb) c.say(`${NAME[gr] ? NAME[gr][0].toUpperCase() + NAME[gr].slice(1) : 'Taneleri'} yağda şeffaflaşana kadar çeviriyoruz.`).catch(() => { });
      await c.T(Math.max(3, Math.min(gr ? 8 : 6, op.dur || (gr ? 7 : 4))), k => setK(k));
    }
    if (stir) stopStir(c, stir);
  },
  async bake(c, op, st, i, plan) {
    const { oven, pan, K } = c;
    if (!oven) return;
    if (op.bg) { await ovenIn(c); return bgStart(c, op, st, i, plan); }
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
  async rest(c, op, st, i, plan) {
    if (op.bg) return bgStart(c, op, st, i, plan);
    c.shot('wide', 1.2); c.ch.look(V(0, 0.5, 2));
    if (op.dur >= 60) {
      const t = c.startTimer(Math.round(op.dur / 60), 'Dinleniyor');
      c.say('Şimdi dinlenmeye bırakıyoruz. Süre dolunca alarm çalacak.', `⏱ ${Math.round(op.dur / 60)} dk`).catch(() => { });
      await c.waitTimer(t, () => { });
    } else await c.W(2.5);
  },
  async serve(c, op, st, i, plan) { await serveGeneric(c, plan); },
};


// ---- oven helpers (used by the menu, where baking runs in the background) ----
async function ovenIn(c) {
  const { oven, pan, K } = c, OV = oven.userData;
  c.shot('oven', 0.9); await c.station('oven', 0.9);
  c.sfx.door(); await c.T(0.8, k => OV.door.rotation.x = k * 1.45, c.ease.out);
  K.setFire(0); c.ST.heat = 0; c.ST.boil = 0;
  await c.moveTo(pan, oven.localToWorld(V(OV.cx, 0.14, 0.4)), 1.0, c.ease.inOut, 0.1); await c.moveTo(pan, oven.localToWorld(V(OV.cx, 0.1, 0)), 0.8);
  c.sfx.clank(); c.sfx.door(); await c.T(0.6, k => OV.door.rotation.x = (1 - k) * 1.45, c.ease.in);
  OV.light.intensity = 0.3; c.M.MAT.element.emissiveIntensity = 1.1; c.setLoop('oven', 0.5);
}
async function ovenOut(c) {
  const { oven, pan } = c, OV = oven.userData, h = c.HOMEOF(pan);
  c.shot('oven', 0.9); await c.station('oven', 0.9);
  c.setLoop('oven', 0); OV.light.intensity = 0; c.M.MAT.element.emissiveIntensity = 0;
  c.sfx.door(); await c.T(0.7, k => OV.door.rotation.x = k * 1.45, c.ease.out);
  await c.moveTo(pan, oven.localToWorld(V(OV.cx, 0.14, 0.4)), 0.7); await c.moveTo(pan, h.p.clone(), 1.0, c.ease.inOut, 0.1); pan.rotation.copy(h.r);
  c.sfx.door(); await c.T(0.6, k => OV.door.rotation.x = (1 - k) * 1.45, c.ease.in);
}
// start a long cook / bake / rest of the main dish and leave it running (the chef goes to the side dish)
async function bgStart(c, op, st, i, plan) {
  const min = Math.max(1, Math.round(op.dur / 60));
  const lab = op.op === 'bake' ? 'Fırında' : op.op === 'rest' ? 'Dinleniyor' : (LABEL[op.mode] || 'Pişiyor');
  const t = c.startTimer(min, `${plan.title}: ${lab}`);
  if (op.op === 'cook') {
    await c.station('stove', 0.8); c.shot('pan', 0.9);
    const stir = st.snap.lid ? null : startStir(c, 0.6);
    await c.W(3);
    if (stir) stopStir(c, stir);
  }
  c.ch.look(V(0, 0.5, 2));
  await c.say(`${plan.title} ${min} dakika ${op.op === 'bake' ? 'fırında pişecek' : op.op === 'rest' ? 'dinlenecek' : 'pişecek'}. Bu arada boş durmayalım, ${plan.sideTitle || 'salatayı'} hazırlayalım!`, `⏱ ${min} dk · sağ üstte takip edebilirsin`);
  return t;
}
// keeps the main dish cooking on screen while its timer runs (also after ⏭ / ⏮)
export function bgResume(c, st, idx, plan, op, mi) {
  const t = c.timerOf(mi);
  if (!t || t.dismissed || t.fired || c.timerFracOf(t) >= 1) return;
  if (op.until && c.curStep() >= op.until) return;   // the main dish has been picked up again
  const prev = idx > 0 ? plan.steps[idx - 1].snap : null, cur = st.snap;
  const inOven = op.op === 'bake' && c.oven;
  if (inOven) {
    const OV = c.oven.userData; c.pan.position.copy(c.oven.localToWorld(V(OV.cx, 0.1, 0))); OV.light.intensity = 0.3; c.M.MAT.element.emissiveIntensity = 1.1; c.setLoop('oven', 0.4);
  }
  const tgt = inOven ? c.oven : (op.op === 'rest' && Object.keys(cur.bowl).length && !Object.keys(cur.pan).length) ? c.bowl : c.pan;
  c.pipWatch(tgt, `${inOven ? '🔥' : op.op === 'rest' ? '⏳' : '🍲'} ${plan.title}`, t);
  const fry = op.mode === 'fry', boil = op.mode === 'boil' || cur.liq.op > 0.3;
  c.H(() => {
    const k = c.timerFracOf(t);
    for (const ty in c.P) {
      const P = c.P[ty].pan; if (!P.count) continue;
      P.done = c.lerp(prev ? prev.done[ty] || 0 : 0, cur.done[ty] || 0, k); P.sauce = c.lerp(prev ? prev.sauce : 0, cur.sauce, k);
      if (GRAIN.has(ty) || ty === 'pasta') P.grow = c.lerp(prev && prev.grow ? prev.grow[ty] || 0 : 0, (cur.grow || {})[ty] || 0, k);
    }
    if (op.op === 'cook') {
      if (op.absorb) { const l0 = prev ? prev.liq.level : 0, o0 = prev ? prev.liq.op : 0; c.pan.userData.setLiquid(c.lerp(l0, cur.liq.level, k), undefined, cur.liq.op > 0 ? o0 : c.lerp(o0, 0, Math.max(0, (k - 0.6) / 0.4))); }
      c.ST.heat = fry ? 0.7 : boil ? 0.15 : 0.4; c.ST.boil = boil ? 0.7 * (op.absorb ? 1 - k * 0.7 : 1) : 0; c.ST.steam = boil ? 0.5 : 0.3;
    }
    if (k >= 1) c.pipWatch(tgt, `✅ ${plan.title}`, t);
  });
}
// a main-dish step that follows a background timer: wait for it (the side dish is done by now), take it out of the oven
async function waitMain(c, st, plan) {
  const w = st.waitFor; if (!w) return;
  const t = c.timerOf(w.m);
  const busy = t && !t.dismissed && !t.fired && c.timerFracOf(t) < 1;
  if (busy) {
    c.shot(w.op === 'bake' ? 'oven' : 'pan', 0.9);
    c.say(`${plan.title} biraz daha ${w.op === 'bake' ? 'fırında kalacak' : 'pişecek'}. Süre dolana kadar bekliyoruz.`, '⏩ ile hızlandırabilirsin').catch(() => { });
    await c.waitTimer(t, () => { });
  }
  c.pipWatch(null);
  if (w.op === 'bake' && c.oven && c.pan.position.distanceTo(c.HOMEOF(c.pan).p) > 0.05) await ovenOut(c);
}

export async function playStep(c, st, i, plan, title, opt = {}) {
  if (st.waitFor) await waitMain(c, st, plan);
  if (c.isSide) { c.shot('front', 0.6); } else c.shot('front', 0.6);
  c.ch.look(V(0, 0.5, 2));
  // the chef reads the step while she already starts doing it (lines inside actions wait for the reading)
  const reading = st.text ? c.say(st.text, opt.label || (i === plan.steps.length - 1 ? '' : `Tarif adımı ${i + 1} / ${plan.steps.length}`)) : Promise.resolve();
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
  const gr = vessel === 'pan' && Object.keys(P).find(t => GRAIN.has(t) && P[t].pan.count);
  if (gr) {
    // fluff the grains before plating
    c.shot('pan', 0.7); c.say(`${NAME[gr] ? NAME[gr][0].toUpperCase() + NAME[gr].slice(1) : 'Taneleri'} kaşıkla nazikçe havalandırıyoruz, tane tane oldu.`).catch(() => { });
    const st = startStir(c, 0.7); await c.W(3.2); stopStir(c, st);
  }
  K.meatBowl.visible = false;
  plate.position.copy(c.plateSpot()); plate.visible = true; plate.scale.setScalar(0.01);
  await c.T(0.4, k => plate.scale.setScalar(Math.max(0.01, k)), c.ease.outBack);
  c.shot(c.REAL ? 'serve' : 'plate', 0.9);
  c.hold(c.spoon, 'R', [0, 0, -0.15], [Math.PI / 2 - 0.35, 0.3, 0]);
  const src = vessel === 'bowl' ? c.bowl : pan;
  const NS = gr ? 5 : 3;
  for (let s = 0; s < NS; s++) {
    await c.reachTo('R', src.localToWorld(V(0, 0.09, 0)), 0.5);
    await c.reachTo('R', plate.localToWorld(V(0, 0.1, 0)), 0.5);
    await Promise.all(Object.keys(P).filter(t => t !== 'parsley').map(t => P[t][vessel] && fly(c, P[t][vessel], P[t].plate, Math.ceil(P[t][vessel].count / (NS - s)), 0.4, 0.3)));
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
    if (c.MENU) await serveSide(c, dest, plan.sideTitle);
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
      await c.say(plan.sideTitle ? `Mmm, ${plan.title} de ${plan.sideTitle} da çok lezzetli olmuş, ellerine sağlık!` : `Mmm, ${plan.title || 'bu yemek'} çok lezzetli olmuş, ellerine sağlık!`, '', G);
    }
  } else { c.shot('front', 1.2); }
  ch.look(V(0, 0.5, 2)); ch.cheer(); c.sfx.success(); c.vib(40);
  await c.say('Yemeğimiz hazır. Afiyet olsun {hey}!');
}

// the side dish (salad bowl) goes to the table next to the main plate
async function serveSide(c, plateAt, name) {
  const S = c.side(), b = S.bowl, ch = c.ch;
  // a warm side cooked in the small pan goes into the bowl first
  const inPan = Object.keys(S.P).filter(t => S.P[t].pan.count);
  if (inPan.length) {
    await c.station('stove2', 0.01); c.shot('pan2', 0.01);
    S.K.setFire(0);
    await Promise.all(inPan.map(t => fly(S, S.P[t].pan, S.P[t].bowl, S.P[t].pan.count, 0.5, 0.5)));
  }
  c.shot('bowl2', 0.01); await c.station('bowl2', 0.01);
  await c.say(`Yanına da ${name || 'salatamızı'} koyuyoruz.`).catch(() => { });
  c.hold(b, 'R', [-0.12, 0.05, 0], [0, 0, 0]);
  const hl = c.H(() => ch.reach('L', b.localToWorld(V(0.16, 0.08, 0)), 14));
  await c.W(0.4);
  c.shot('table', 0.01); await c.station('table', 0.01);
  const dest = plateAt.clone().add(V(-0.28, 0, -0.12));
  await c.reachTo('R', dest.clone().add(V(0.2, 0.1, -0.2)), 0.8);
  c.release(b); hl(); await c.moveTo(b, dest, 0.5, c.ease.out); c.sfx.thunk(); ch.rest();
}
