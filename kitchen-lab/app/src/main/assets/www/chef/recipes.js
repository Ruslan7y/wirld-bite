// Recipes as steps: what the chef says, the animation (play) and the end state (apply)
// so any step can be replayed with ⏮ / ↻ from a clean scene.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const BOARD_AT = [-0.05, 0, -0.1];

// ---------- reusable actions ----------
async function turn(c, a, d = 0.6) { const a0 = c.ch.root.rotation.y; await c.T(d, k => c.ch.root.rotation.y = c.lerp(a0, a, k), c.ease.inOut); }
const KNIFE = [[-0.05, 0.02, 0], [0, -Math.PI / 2 + 0.95, 0.1]];
const SPOON = [[0, 0, -0.15], [Math.PI / 2 - 0.35, 0.3, 0]];

async function chop(c, whole, type, dur, line) {
  const { ch, K, P } = c;
  const b = K.board;
  if (line) c.say(line).catch(() => { });
  await c.station('board');
  const th = ch.root.rotation.y, Y = V(0, 1, 0);
  const AX = V(1, 0, 0).applyAxisAngle(Y, th), FW = V(0, 0, 1).applyAxisAngle(Y, th); // AX = chef's left, FW = forward
  const at = (base, a, y, f) => base.clone().addScaledVector(AX, a).add(V(0, y, 0)).addScaledVector(FW, f);
  // the vegetable goes to the middle of the board, right in front of the chef
  const spot = b.getWorldPosition(V()); spot.y = K.boardTop; spot.addScaledVector(FW, -0.02);
  ch.reach('L', whole.getWorldPosition(V()).add(V(0, 0.06, 0)), 7);
  await c.W(0.4);
  await c.both(c.moveTo(whole, spot, 0.7, c.ease.inOut, 0.08), (async () => { for (let i = 0; i < 14; i++) { ch.reach('L', whole.getWorldPosition(V()).add(V(0, 0.06, 0)), 14); await c.W(0.05); } })());
  // knife in the right hand: blade forward, edge down, fingers around the handle
  const KN = [[-0.05, 0.016, 0], [0, th - Math.PI / 2, 0]];
  if (!c.isHeld(K.knife)) await c.grab(K.knife, 'R', ...KN); else K.knife.rotation.set(...KN[1]);
  if (ch.handPose) {
    ch.handPose('R', FW.clone().add(V(0, -0.35, 0)), AX.clone());            // palm faces the middle, knuckles up
    ch.handPose('L', FW.clone().multiplyScalar(0.75).add(V(0, -0.65, 0)).addScaledVector(AX, -0.25), FW.clone().multiplyScalar(-0.65).add(V(0, -0.75, 0))); // claw on top of the vegetable
  }
  const ps = P[type].board, n = ps.max;
  const cuts = Math.max(6, Math.round(dur / 0.3));
  const BLADE = 0.11; // grip → middle of the blade
  const w0 = spot.clone();
  b.updateMatrixWorld(true);
  let shown = 0;
  for (let i = 0; i < cuts; i++) {
    const k = (i + 1) / cuts;
    const xc = -0.04 + k * 0.06;                        // cut line moves from the right end toward the holding hand
    const cut = at(w0, xc, 0, 0);
    ch.reach('L', at(w0, xc + 0.045, 0.055, 0.0), 10);    // other hand holds the rest, just left of the knife
    ch.reach('R', cut.clone().addScaledVector(FW, -BLADE).add(V(0, 0.085, 0)), 16);
    c.T(0.12, q => K.knife.rotation.z = 0.12 * q);
    await c.W(0.14);
    ch.reach('R', cut.clone().addScaledVector(FW, -BLADE).add(V(0, 0.022, 0)), 24);
    c.T(0.1, q => K.knife.rotation.z = 0.12 - 0.17 * q);
    await c.W(0.12);
    c.sfx.chop(); c.vib(6);
    const want = Math.round(k * n);
    for (; shown < want; shown++) {
      const it = ps.items[shown];
      const wpnt = at(w0, xc - 0.012 - Math.random() * 0.02, 0, c.rand(-0.03, 0.03));
      it.p.copy(b.worldToLocal(wpnt)); it.p.y = K.boardTop + 0.004;
    }
    ps.count = want;
    whole.scale.set(Math.max(0.05, 1 - k * 0.95), 1, 1);
    whole.position.copy(at(w0, k * 0.025, 0, 0));
  }
  whole.visible = false;
}
function chopApply(c, whole, type) { whole.visible = false; c.P[type].board.count = c.P[type].board.max; }

// pieces fly from one set to another (world-space arcs)
async function fly(c, src, dst, n, dur = 0.9, spread = 0.5) {
  n = Math.min(n, src.count); if (!n) return;
  const type = src.type, fl = c.P[type].fly;
  const sp = src.mesh.parent, dp = dst.mesh.parent; sp.updateMatrixWorld(); dp.updateMatrixWorld();
  const A = [], B = [];
  for (let k = 0; k < n; k++) { A.push(sp.localToWorld(src.items[src.count - 1 - k].p.clone())); B.push(dp.localToWorld(dst.items[dst.count + k].p.clone())); }
  src.count -= n; fl.count = n; fl.done = src.done; fl.sauce = src.sauce; fl.shrink = src.shrink;
  const del = A.map(() => Math.random() * spread);
  await c.T(dur + spread, (_, r) => {
    const t = r * (dur + spread);
    for (let k = 0; k < n; k++) {
      const u = c.clamp((t - del[k]) / dur), it = fl.items[k];
      it.p.lerpVectors(A[k], B[k], u); it.p.y += Math.sin(u * Math.PI) * 0.05;
      it.r.x += 0.15; it.r.z += 0.1;
    }
  }, c.ease.linear);
  fl.count = 0; dst.count += n; dst.done = src.done; dst.sauce = src.sauce;
}

// lift the board over the pan, tip the chopped pieces in, bring it back
async function boardToPan(c, types, line) {
  const { K, ch, pan } = c, b = K.board;
  if (line) c.say(line).catch(() => { });
  if (c.isHeld(c.K.knife)) c.drop(c.K.knife);
  const h = c.H(() => { ch.reach('L', b.localToWorld(V(0.19, 0.03, 0)), 20); ch.reach('R', b.localToWorld(V(-0.19, 0.03, 0)), 20); });
  if (c.REAL) { await c.station('board', 0.8); }
  await c.W(0.4);
  const r0 = b.rotation.y;
  await c.both(c.REAL ? c.station('stove', 0.9) : turn(c, 0.42, 0.8), c.moveTo(b, pan.localToWorld(V(-0.05, 0.14, 0.0)).add(V(-0.17, 0, 0.03)), 0.9, c.ease.inOut, 0.05), c.T(0.9, k => b.rotation.y = c.lerp(r0, 0, k)));
  if (c.REAL) await turn(c, 0.42, 0.5);
  await c.T(0.5, k => b.rotation.z = -k * 0.55);
  c.sfx.sizzleBurst();
  await Promise.all(types.map(t => fly(c, c.P[t].board, c.P[t].pan, c.P[t].board.count, 0.6, 0.6)));
  await c.T(0.4, k => b.rotation.z = -(1 - k) * 0.55);
  const home = c.boardHome();
  if (c.REAL) { h(); ch.rest(); await c.both(c.moveTo(b, home.p.clone(), 0.9, c.ease.inOut, 0.05), c.T(0.9, k => b.rotation.y = c.lerp(0, home.r.y, k)), turn(c, 0, 0.8)); }
  else { await c.both(turn(c, 0, 0.8), c.moveTo(b, home.p.clone(), 0.9, c.ease.inOut, 0.05)); h(); ch.rest(); }
}
function boardToPanApply(c, types) { for (const t of types) { const P = c.P[t]; P.pan.count = P.board.count || P.board.max; P.board.count = 0; } }

// stir loop: right hand with the wooden spoon circles in the pan
function startStir(c, amp = 1) {
  const { ch, pan, spoon } = c;
  if (!c.isHeld(spoon)) c.hold(spoon, 'R', ...SPOON);
  if (ch.handPose) {
    const th = ch.root.rotation.y, Y = V(0, 1, 0);
    const AX = V(1, 0, 0).applyAxisAngle(Y, th), FW = V(0, 0, 1).applyAxisAngle(Y, th);
    ch.handPose('R', FW.clone().multiplyScalar(0.4).add(V(0, -1, 0)), AX.clone());
    ch.handPose('L', FW.clone().add(AX.clone().multiplyScalar(0.6)).add(V(0, -0.3, 0)), V(0, -1, 0));
  }
  let a = 0;
  return c.H((dt) => {
    a += dt * 2.6 * amp;
    const p = pan.localToWorld(V(Math.cos(a) * 0.055, 0.1, Math.sin(a) * 0.055));
    ch.reach('R', p, 12); ch.reach('L', pan.localToWorld(V(0.24, 0.07, 0)), 8);
    c.ST.stir = amp;
  });
}
function stopStir(c, stopH) { stopH(); c.ST.stir = 0; c.drop(c.spoon); c.ch.rest(); }

async function pinch(c, bowl, P, n = 60) {
  const { ch, pan } = c;
  await c.reachTo('R', bowl.getWorldPosition(V()).add(V(0, 0.04, 0)), 0.5);
  const over = pan.localToWorld(V(-0.02, 0.2, 0.02));
  await c.reachTo('R', over, 0.6);
  for (let i = 0; i < 3; i++) {
    for (let k = 0; k < n / 3; k++) P.emit(over.clone().add(V(c.rand(-0.01, 0.01), -0.03, c.rand(-0.01, 0.01))), V(c.rand(-0.04, 0.04), c.rand(-0.1, 0), c.rand(-0.04, 0.04)), { life: 1, size: c.rand(0.002, 0.0035) });
    ch.reach('R', over.clone().add(V(0.02 * (i % 2 ? 1 : -1), 0, 0)), 10); c.sfx.sift(); await c.W(0.3);
  }
}

// ---------- ET SOTE ----------
const ING = ['🥩 500 g dana kuşbaşı', '🧅 1 soğan', '🌶️ 2 sivri biber', '🍅 1 domates', '🧄 2 diş sarımsak', '🥫 1 yk salça', '🫒 2 yk yağ', '🧂 tuz, karabiber', '💧 1 su bardağı sıcak su', '🌿 maydanoz'];

const etsote = {
  id: 'etsote', title: 'Et sote', time: '~1 saat', ing: ING,
  steps: [
    {
      title: 'Merhaba!',
      apply() { },
      async play(c) {
        c.shot('front', 0.01);
        c.ch.look(V(0, 0.5, 2));
        c.ch.wave();
        await c.say('Merhaba {hey}! Ben {name}. Bugün birlikte nefis bir et sote yapacağız.');
        await c.say('Malzemelerimiz hazır: kuşbaşı et, soğan, biber, domates ve sarımsak. Hazırsan sonraki adıma geçelim.', 'Sonraki için ⏭ düğmesine bas ya da “sonraki” de.');
      },
    },
    {
      title: 'Soğanı doğra',
      apply(c) { chopApply(c, c.onion, 'onion'); },
      async play(c) {
        c.shot('front', 0.8); c.ch.look(V(0, 0.5, 2));
        await c.say('Önce soğanı küçük küpler halinde doğrayalım. Parmak uçlarını içe kıvır, bıçak eline değmesin.', '≈ 2 dakika');
        c.shot('board', 1.0); c.ch.look(c.K.board.localToWorld(V(0, 0.02, 0)));
        await chop(c, c.onion, 'onion', 4.5);
        c.drop(c.K.knife); c.ch.rest();
        await c.say('İşte bu kadar. Doğranmış soğanı kenara alıyoruz.');
      },
    },
    {
      title: 'Biber, domates, sarımsak',
      apply(c) { chopApply(c, c.pepper, 'pepper'); chopApply(c, c.tomato, 'tomato'); chopApply(c, c.garlic, 'garlic'); },
      async play(c) {
        c.shot('board', 0.9); c.ch.look(c.K.board.localToWorld(V(0, 0.02, 0)));
        await chop(c, c.pepper, 'pepper', 3, 'Sivri biberleri halka halka doğruyoruz.');
        await chop(c, c.tomato, 'tomato', 3, 'Domatesi küp küp doğrayalım.');
        await chop(c, c.garlic, 'garlic', 2.2, 'Sarımsağı da ince ince kıyıyoruz.');
        c.drop(c.K.knife); c.ch.rest();
        await c.say('Bütün sebzelerimiz hazır. Şimdi ocağa geçiyoruz!');
      },
    },
    {
      title: 'Tavayı ısıt, yağı ekle',
      apply(c) { c.K.setFire(0.8); c.K.knobs[0].rotation.z = -1.6; c.pan.userData.oil.material.opacity = 0.3; },
      async play(c) {
        const { ch, K, pan, oil } = c;
        c.shot('stove', 1.0); ch.look(pan.getWorldPosition(V()));
        c.say('Ocağı orta-yüksek ateşe açıyoruz.').catch(() => { });
        await c.reachTo('L', K.knobs[0].getWorldPosition(V()).add(V(0, 0.03, 0.02)), 0.7);
        c.sfx.knob(); await c.T(0.6, k => { K.knobs[0].rotation.z = -1.6 * k; K.setFire(0.8 * k); });
        ch.rest();
        await c.say('Tavaya iki yemek kaşığı yağ ekleyelim.');
        await turn(c, 0.4);
        await c.grab(oil, 'L', [0, 0.1, 0.0], [0, 0, 0]);
        const over = pan.localToWorld(V(0.05, 0.22, 0.0));
        await c.reachTo('L', over, 0.8);
        c.shot('pan', 0.8);
        const neck = V();
        const h = c.H(() => { oil.localToWorld(neck.set(0, 0.225, 0)); c.oilStream.set(neck.clone(), pan.localToWorld(V(0, 0.01, 0)), 0.8, 0.001); });
        await c.T(0.6, k => { oil.rotation.z = k * 2.0; });
        c.sfx.pour();
        await c.T(1.6, k => { pan.userData.oil.material.opacity = 0.3 * k; });
        h(); c.oilStream.hide();
        await c.T(0.5, k => { oil.rotation.z = (1 - k) * 2.0; });
        c.drop(oil); ch.rest(); await turn(c, 0);
        const t = c.startTimer(1, 'Yağ ısınıyor');
        await c.say('Yağ bir dakika ısınsın. Yüzeyi hafifçe dalgalanınca hazır demektir.', '⏱ 1 dk · Süre dolunca alarm çalar, istersen beklemeden geç.');
        c.ST.heat = 0.15;
        await c.waitTimer(t, k => { c.ST.heat = 0.1 + k * 0.15; });
      },
    },
    {
      title: 'Etleri sotele',
      apply(c) { c.P.meat.bowl.count = 0; c.P.meat.pan.count = c.P.meat.pan.max; c.P.meat.pan.done = 0.85; },
      async play(c) {
        const { ch, K, pan, P } = c;
        c.shot('stove', 0.9); ch.look(pan.getWorldPosition(V()));
        await c.say('Etleri tavaya alıyoruz. Dikkat et, yağ sıçrayabilir!');
        await c.grab(K.meatBowl, 'R', [0.0, 0.055, -0.085], [0, 0, 0]);
        await turn(c, 0.45);
        await c.reachTo('R', pan.localToWorld(V(-0.04, 0.2, 0.06)), 0.8);
        c.shot('pan', 0.7);
        await c.T(0.5, k => K.meatBowl.rotation.z = -k * 1.5);
        c.sfx.sizzleBurst(); c.vib(30); c.ST.heat = 1;
        await fly(c, P.meat.bowl, P.meat.pan, P.meat.bowl.count, 0.55, 0.8);
        await c.T(0.4, k => K.meatBowl.rotation.z = -(1 - k) * 1.5);
        c.drop(K.meatBowl); ch.rest();
        const t = c.startTimer(10, 'Etler sotelenıyor');
        c.say('Duyuyor musun bu cızırtıyı? Etler önce suyunu salacak, sonra o suyu çekip kızaracak.', '⏱ 10 dk · ara ara karıştır').catch(() => { });
        const st = startStir(c, 0.7);
        await c.waitTimer(t, k => {
          P.meat.pan.done = k * 0.85;
          const juice = k < 0.25 ? k / 0.25 : k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25;
          c.pan.userData.setLiquid(0.004 * juice, 0x9a5a48, 0.5 * juice); c.setPanLevel(0.003 * juice);
          c.ST.heat = 1 - juice * 0.55; c.ST.steam = juice * 0.6;
        }, [[0.35, 'Etler suyunu saldı. Sabırla suyunu çekmesini bekliyoruz.'], [0.85, 'Bak, renkleri güzelce döndü!']]);
        stopStir(c, st); c.ST.steam = 0;
      },
    },
    {
      title: 'Soğanı kavur',
      apply(c) { boardToPanApply(c, ['onion']); c.P.onion.pan.done = 0.8; c.P.meat.pan.done = 0.9; c.ST.heat = 0.8; },
      async play(c) {
        const { ch, P } = c;
        c.ST.heat = 0.8; c.shot('front', 0.8); ch.look(V(0, 0.5, 2));
        await c.say('Şimdi soğanları ekleyip pembeleşene kadar kavuruyoruz.', '⏱ 5 dk');
        c.shot('pan', 0.9); ch.look(c.pan.getWorldPosition(V()));
        await boardToPan(c, ['onion']);
        const t = c.startTimer(5, 'Soğan kavruluyor');
        const st = startStir(c, 1);
        await c.waitTimer(t, k => { P.onion.pan.done = k * 0.8; P.meat.pan.done = 0.85 + k * 0.05; c.ST.heat = 0.8; }, [[0.5, 'Soğanların rengi dönmeye başladı, ne güzel kokuyor!']]);
        stopStir(c, st);
      },
    },
    {
      title: 'Sarımsak ve biber',
      apply(c) { boardToPanApply(c, ['garlic', 'pepper']); c.P.pepper.pan.done = 0.6; c.P.garlic.pan.done = 0.7; },
      async play(c) {
        const { ch, P } = c;
        c.ST.heat = 0.8; c.shot('pan', 0.8); ch.look(c.pan.getWorldPosition(V()));
        await boardToPan(c, ['garlic', 'pepper'], 'Sarımsağı ve biberleri ekliyoruz. Sarımsak çabuk yanar, o yüzden karıştırmayı bırakmıyoruz.');
        const t = c.startTimer(3, 'Biberler pişiyor');
        const st = startStir(c, 1);
        await c.waitTimer(t, k => { P.pepper.pan.done = k * 0.6; P.garlic.pan.done = k * 0.7; c.ST.heat = 0.8; }, [[0.6, 'Biberler hafifçe yumuşadı.']]);
        stopStir(c, st);
      },
    },
    {
      title: 'Salçayı kavur',
      apply(c) { for (const t in c.P) c.P[t].pan.sauce = 0.5; },
      async play(c) {
        const { ch, P, pan, paste } = c;
        c.ST.heat = 0.8; c.shot('stove', 0.8); ch.look(pan.getWorldPosition(V()));
        await c.say('Bir yemek kaşığı salça ekleyip bir dakika kavuralım ki çiğ kokusu gitsin.', '⏱ 1 dk');
        c.hold(c.spoon, 'R', ...SPOON);
        await c.reachTo('R', paste.getWorldPosition(V()).add(V(0, 0.12, 0.02)), 0.6);
        await c.W(0.3);
        await turn(c, 0.4);
        c.shot('pan', 0.7);
        await c.reachTo('R', pan.localToWorld(V(0, 0.1, 0)), 0.7);
        c.sfx.squelch();
        const t = c.startTimer(1, 'Salça kavruluyor');
        const st = startStir(c, 1);
        await c.waitTimer(t, k => { for (const ty in P) P[ty].pan.sauce = k * 0.5; c.ST.heat = 0.8; });
        stopStir(c, st); await turn(c, 0);
      },
    },
    {
      title: 'Domates ve baharat',
      apply(c) { boardToPanApply(c, ['tomato']); c.P.tomato.pan.sauce = 0.5; },
      async play(c) {
        const { ch, P } = c;
        c.ST.heat = 0.8; c.shot('pan', 0.8); ch.look(c.pan.getWorldPosition(V()));
        await boardToPan(c, ['tomato'], 'Domatesleri ekliyoruz.');
        P.tomato.pan.sauce = 0.3;
        c.say('Tuzunu ve karabiberini ekleyelim. Tuzu azar azar at, sonradan da ekleyebilirsin.').catch(() => { });
        await turn(c, 0.3);
        await pinch(c, c.salt, c.saltP);
        await pinch(c, c.black, c.pepP);
        ch.rest();
        const st = startStir(c, 1);
        await c.W(2.5); P.tomato.pan.sauce = 0.5;
        stopStir(c, st); await turn(c, 0);
        await c.say('Güzelce karıştırdık.');
      },
    },
    {
      title: 'Kısık ateşte pişir',
      apply(c) {
        c.K.setFire(0.35); c.K.knobs[0].rotation.z = -0.7;
        for (const t in c.P) { c.P[t].pan.sauce = 1; c.P[t].pan.done = Math.max(c.P[t].pan.done, 0.9); }
        c.P.meat.pan.done = 1; c.P.tomato.pan.shrink = 0.8; c.P.onion.pan.shrink = 0.4;
        c.pan.userData.setLiquid(0.008, 0x8a2c14, 0.85); c.setPanLevel(0.006);
        c.lid.position.copy(c.pan.localToWorld(V(0, 0.06, 0))); c.lid.rotation.set(0, 0, 0);
        c.water.userData.water.scale.y = 0.05;
      },
      async play(c) {
        const { ch, P, pan, lid, water, K } = c;
        c.ST.heat = 0.8; c.shot('stove', 0.8); ch.look(pan.getWorldPosition(V()));
        await c.say('Bir su bardağı sıcak su ekliyoruz.');
        await turn(c, 0.4);
        await c.grab(water, 'L', [0, 0.06, 0], [0, 0, 0]);
        await c.reachTo('L', pan.localToWorld(V(0.06, 0.2, 0)), 0.7);
        c.shot('pan', 0.6);
        const rim = V();
        const h = c.H(() => { water.localToWorld(rim.set(0, 0.11, 0.0)); c.waterStream.set(rim.clone(), pan.localToWorld(V(0, 0.02, 0)), 1, 0.002); });
        await c.T(0.5, k => water.rotation.z = k * 1.9);
        c.sfx.pour(); c.ST.heat = 0.2; c.ST.steam = 1;
        await c.T(1.8, k => { water.userData.water.scale.y = 1 - k * 0.95; water.userData.water.position.y = 0.045 * (1 - k * 0.95); pan.userData.setLiquid(0.016 * k, 0xa8401e, 0.8 * k); c.setPanLevel(0.012 * k); for (const t in P) P[t].pan.sauce = 0.5 + k * 0.3; });
        h(); c.waterStream.hide();
        await c.T(0.4, k => water.rotation.z = (1 - k) * 1.9);
        c.drop(water); water.userData.water.scale.y = 0.05;
        await c.say('Kapağını kapatıp ocağı kısıyoruz. 35 dakika ağır ateşte pişsin, etler lokum gibi olacak.', '⏱ 35 dk');
        await c.grab(lid, 'L', [0, 0.075, 0], [0, 0, 0]);
        await c.reachTo('L', pan.localToWorld(V(0, 0.2, 0)), 0.7);
        c.drop(lid); lid.rotation.set(0, 0, 0); lid.position.copy(pan.localToWorld(V(0, 0.2, 0)));
        await c.moveTo(lid, pan.localToWorld(V(0, 0.06, 0)), 0.4, c.ease.in); c.sfx.lid();
        ch.rest(); await turn(c, 0);
        await c.reachTo('L', K.knobs[0].getWorldPosition(V()).add(V(0, 0.03, 0.02)), 0.6);
        c.sfx.knob(); await c.T(0.5, k => { K.knobs[0].rotation.z = -1.6 + 0.9 * k; K.setFire(0.8 - 0.45 * k); });
        ch.rest(); c.ST.heat = 0; c.ST.boil = 0.8; c.ST.steam = 0.5;
        const t = c.startTimer(35, 'Et pişiyor');
        c.shot('front', 1.2); ch.look(V(0, 0.5, 2));
        await c.say('Süre dolunca alarm çalacak. Uygulamadan çıksan bile telefonuna alarmlı bildirim gelir, sen rahatına bak!', '⏱ 35 dk · ⏩ ile hızlı izleyebilirsin');
        c.shot('pan', 1.2);
        await c.waitTimer(t, k => {
          P.meat.pan.done = 0.9 + k * 0.1; for (const ty in P) P[ty].pan.sauce = 0.8 + k * 0.2;
          P.tomato.pan.shrink = k * 0.8; P.onion.pan.shrink = k * 0.4;
          pan.userData.setLiquid(0.016 - 0.008 * k, 0x8a2c14, 0.85); c.setPanLevel(0.012 - 0.006 * k);
          c.ST.boil = 0.8; c.ST.steam = 0.5;
        }, [[0.5, 'Yarısı geçti. Kokusu mutfağı sardı bile!'], [0.95, 'Neredeyse hazır…']]);
      },
    },
    {
      title: 'Servis',
      apply(c) { },
      async play(c) {
        const { ch, P, pan, lid, plate, K } = c;
        c.shot('stove', 0.8); ch.look(pan.getWorldPosition(V()));
        await c.say('Ocağı kapatıyoruz.');
        await c.reachTo('L', K.knobs[0].getWorldPosition(V()).add(V(0, 0.03, 0.02)), 0.6);
        c.sfx.knob(); await c.T(0.5, k => { K.knobs[0].rotation.z = -0.7 * (1 - k); K.setFire(0.35 * (1 - k)); });
        c.ST.boil = 0; c.ST.steam = 0.6;
        await turn(c, 0.4);
        await c.grab(lid, 'L', [0, 0.075, 0], [0, 0, 0]);
        await c.reachTo('L', V(0.66, 0.2, -0.02), 0.7); c.drop(lid);
        ch.rest(); await turn(c, 0);
        // board aside, plate in its place
        await c.say('Tabağımızı hazırlayalım.');
        await c.moveTo(K.board, c.REAL ? V(-0.62, 0, -0.62) : V(-0.55, 0, 0.12), 0.6);
        if (c.REAL) plate.position.copy(c.boardHome().p); else plate.position.set(-0.04, 0, -0.08); plate.visible = true; plate.scale.setScalar(0.01);
        await c.T(0.4, k => plate.scale.setScalar(Math.max(0.01, k)), c.ease.outBack);
        c.shot('plate', 0.9);
        c.hold(c.spoon, 'R', ...SPOON);
        for (let s = 0; s < 3; s++) {
          await turn(c, 0.35, 0.4);
          await c.reachTo('R', pan.localToWorld(V(0, 0.08, 0)), 0.5);
          await turn(c, 0, 0.4);
          await c.reachTo('R', plate.localToWorld(V(0, 0.1, 0)), 0.5);
          await Promise.all(Object.keys(P).filter(t => t !== 'parsley').map(t => fly(c, P[t].pan, P[t].plate, Math.ceil(P[t].pan.count / (3 - s)), 0.4, 0.3)));
          c.sfx.squelch();
        }
        c.drop(c.spoon); ch.rest();
        c.pan.userData.setLiquid(0, 0x8a2c14, 0); c.setPanLevel(0); c.ST.steam = 0;
        await c.say('Üzerine taze maydanoz serpiyoruz.');
        P.parsley.board.count = P.parsley.board.max;
        c.parsley.visible = false;
        await c.reachTo('R', plate.localToWorld(V(0, 0.2, 0)), 0.5);
        await fly(c, P.parsley.board, P.parsley.plate, P.parsley.max, 0.7, 0.9);
        c.sfx.sparkle();
        ch.rest();
        c.shot('front', 1.2); ch.look(V(0, 0.5, 2));
        ch.cheer(); c.sfx.success(); c.vib(40);
        await c.say('İşte et sotemiz hazır! Ellerine sağlık, afiyet olsun {hey}!', 'Yanına pilav ya da közlenmiş biber çok yakışır.');
      },
    },
  ],
};

export const RECIPES = { etsote };
