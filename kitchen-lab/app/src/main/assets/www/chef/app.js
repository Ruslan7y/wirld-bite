import * as THREE from 'three';
import { RoomEnvironment } from '../lib/RoomEnvironment.js';
import * as M from '../js/models.js';
import { Particles, Stream } from '../js/fx.js';
import * as TX from '../js/textures.js';
import { tween, updateTweens, ease, lerp, clamp, rand } from '../js/util.js';
import { sfx, setLoop, unlock, setMuted, stopAllLoops, audio } from '../js/audio.js';
import { buildKitchen } from './kitchen.js';
import { makeCharacter, CHEF_INFO } from './character.js';
import * as F from './food.js';
import { RECIPES } from './recipes.js';

const $ = id => document.getElementById(id);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const QS = new URLSearchParams(location.search);
const AUTO = QS.has('auto');                 // test: advance automatically
const FF = +(QS.get('ff') || 1);             // test: timer speed multiplier
const A = window.Android || null;
const vib = ms => { try { A ? A.vibrate(ms) : navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };

// ---------------- renderer ----------------
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' });
const weak = (navigator.hardwareConcurrency || 4) <= 4;
renderer.setPixelRatio(Math.min(devicePixelRatio, weak ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.autoClear = false;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2119);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.42;

const key = new THREE.DirectionalLight(0xffe2c4, 2.6); key.position.set(-1.4, 2.4, 2.2);
key.castShadow = true; key.shadow.mapSize.set(weak ? 1024 : 2048, weak ? 1024 : 2048);
Object.assign(key.shadow.camera, { left: -1.2, right: 1.2, top: 1.3, bottom: -0.8, near: 0.5, far: 6 });
key.shadow.bias = -0.0003; key.shadow.normalBias = 0.008; key.shadow.radius = 4; scene.add(key);
const win = new THREE.DirectionalLight(0xdfeaff, 1.1); win.position.set(-1.5, 1.4, -2); scene.add(win);
scene.add(new THREE.HemisphereLight(0xfff3e4, 0x4a3426, 0.35));
const fillL = new THREE.PointLight(0xffd2a8, 0.6, 3, 1.5); fillL.position.set(0.8, 0.8, 1.2); scene.add(fillL);

M.makeMaterials();
const K = buildKitchen(scene);

// ---------------- chef ----------------
const chefId = ['leyla', 'zeynep', 'aylin'].includes(QS.get('chef')) ? QS.get('chef') : 'zeynep';
const ch = makeCharacter(chefId);
ch.root.position.set(0, 0, -0.56);
scene.add(ch.root);
const CHEF = CHEF_INFO[chefId];

// ---------------- props for the recipe ----------------
const R = RECIPES[QS.get('r') || 'etsote'];
const pan = F.makeSautePan(); pan.position.set(K.cook.position.x, 0.044, K.cook.position.z); pan.rotation.y = 0.85; scene.add(pan);
const lid = F.makeLid(); scene.add(lid);
const onion = F.wholeOnion(), pepper = F.wholePepper(), tomato = F.wholeTomato(), garlic = F.wholeGarlic(), parsley = F.parsleyBunch();
const oil = F.oilBottle(), paste = F.pasteJar(), salt = F.spiceBowl(0xffffff), black = F.spiceBowl(0x2a2420), water = F.waterGlass();
const spoon = F.woodenSpoon(), plate = F.servingPlate();
[onion, pepper, tomato, garlic, parsley, oil, paste, salt, black, water, spoon, plate].forEach(o => scene.add(o));

// piece sets: on the board (chopped), in the bowl (raw meat), in the pan, on the plate, in flight
const P = {};
const boardRegion = { onion: [-0.11, 0.06], pepper: [0.0, 0.06], tomato: [0.1, 0.05], garlic: [0.1, -0.06], parsley: [-0.12, -0.07] };
const COUNTS = { meat: 26, onion: 40, pepper: 22, garlic: 14, tomato: 22, parsley: 70 };
for (const [t, n] of Object.entries(COUNTS)) {
  P[t] = { board: new F.Pieces(t, n, K.board), pan: new F.Pieces(t, n, pan), plate: new F.Pieces(t, n, plate), fly: new F.Pieces(t, n, scene) };
}
P.meat.bowl = new F.Pieces('meat', COUNTS.meat, K.meatBowl);

const spr = TX.sprite(), sprHard = TX.sprite(1), smoke = TX.smokeSprite();
const spitP = new Particles(scene, { max: 300, map: sprHard, color: 0xfff1c0, gravity: -2.5, drag: 0.5 });
const steamP = new Particles(scene, { max: 220, map: smoke, color: 0xffffff, gravity: 0.06, drag: 0.7, opacity: 0.32 });
const saltP = new Particles(scene, { max: 300, map: sprHard, color: 0xffffff, gravity: -2.2, drag: 0.3 });
const pepP = new Particles(scene, { max: 300, map: sprHard, color: 0x201810, gravity: -2.2, drag: 0.3 });
const bubbleP = new Particles(scene, { max: 200, map: sprHard, color: 0xffe6c8, gravity: 0, drag: 2, opacity: 0.7 });
const allP = [spitP, steamP, saltP, pepP, bubbleP];
const panFloor = (x, z) => { const d = Math.hypot(x - pan.position.x, z - pan.position.z); return d < F.PAN.rb ? pan.position.y + 0.012 + panLevel : null; };
[spitP, saltP, pepP].forEach(p => p.floor = (x, z) => panFloor(x, z) ?? 0.0);
let panLevel = 0;
const oilStream = new Stream(scene, M.MAT.oil, 0.003);
const waterStream = new Stream(scene, new THREE.MeshPhysicalMaterial({ color: 0xe6f2ff, transparent: true, opacity: 0.55, roughness: 0 }), 0.005);

// home transforms so a step can be replayed from a clean state
const HOME = new Map();
function home(o, pos, rot = [0, 0, 0]) { HOME.set(o, { p: V(...pos), r: new THREE.Euler(...rot) }); }
home(onion, [-0.6, 0.012, -0.2]); home(pepper, [-0.66, 0.012, -0.12], [0, 0.5, 0]); home(tomato, [-0.53, 0.012, -0.12]); home(garlic, [-0.62, 0.012, -0.28]);
home(parsley, [-0.5, 0.012, -0.3], [0, 0.4, 0]);
home(oil, [0.66, 0, -0.34]); home(paste, [0.12, 0, -0.33]); home(salt, [0.02, 0, -0.33]); home(black, [-0.06, 0, -0.33]); home(water, [0.62, 0, 0.0]);
home(spoon, [0.12, 0.01, -0.02], [0, 0.6, 0]); home(lid, [0.66, 0.072, -0.02], [0.08, 0, 0.1]); home(K.knife, [0.06, K.boardTop + 0.002, 0.06], [-Math.PI / 2, 0, 0.3]);
home(K.board, [-0.05, 0, -0.1]); home(K.meatBowl, [-0.42, 0, 0.06]); home(plate, [-0.02, 0, 0.1]);
K.vegPlate.position.set(-0.58, 0, -0.2);
function resetScene() {
  FOLLOW.clear();
  for (const [o, h] of HOME) { scene.attach(o); o.position.copy(h.p); o.rotation.copy(h.r); o.visible = true; o.scale.setScalar(1); }
  [onion, pepper, tomato, garlic].forEach(o => o.scale.set(1, 1, 1));
  water.userData.water.scale.y = 1; water.userData.water.position.y = 0.045;
  plate.visible = false; lid.visible = true;
  for (const t in P) for (const k in P[t]) { const ps = P[t][k]; ps.count = 0; ps.done = 0; ps.sauce = 0; ps.shrink = 0; }
  P.meat.bowl.count = COUNTS.meat; P.meat.bowl.scatter(0.055, 0.012, 0.03);
  for (const t in P) { P[t].pan.scatter(F.PAN.rb - 0.02, 0.012, 0.006); P[t].plate.scatter(0.07, 0.012, 0.012); const [bx, bz] = boardRegion[t] || [0, 0]; P[t].board.items.forEach(it => { it.p.set(bx + rand(-0.035, 0.035), K.boardTop + 0.004, bz + rand(-0.03, 0.03)); }); }
  P.parsley.pan.scatter(F.PAN.rb - 0.02, 0.03, 0.01); P.parsley.plate.scatter(0.075, 0.04, 0.012);
  K.setFire(0); K.knobs.forEach(k => k.rotation.z = 0);
  pan.userData.oil.material.opacity = 0; pan.userData.setLiquid(0, 0xc0502a, 0); panLevel = 0;
  oilStream.hide(); waterStream.hide();
  ['sizzle', 'boil', 'steam'].forEach(l => setLoop(l, 0));
  ch.root.rotation.y = 0; ch.rest(100); ch.look(null); ch.mood = 'happy'; ch.arms.R.roll = ch.arms.L.roll = 0;
  ST.stir = 0; ST.heat = 0; ST.boil = 0; ST.steam = 0;
}
const ST = { stir: 0, heat: 0, boil: 0, steam: 0, stirA: 0 };

// ---------------- cameras ----------------
const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 30);
const pipCam = new THREE.PerspectiveCamera(30, 0.8, 0.01, 30);
const cam = { p: V(0, 0.55, 1.6), t: V(0, 0.25, -0.3), h: 60 };
const SHOT = {
  front: { p: [0.0, 0.5, 1.05], t: [0.05, 0.31, -0.45], h: 42 },
  face: { p: [0.0, 0.6, 0.8], t: [0, 0.48, -0.56], h: 34 },
  board: { p: [-0.05, 0.66, 0.42], t: [-0.05, 0.03, -0.1], h: 52 },
  pan: { p: [K.cook.position.x, 0.78, K.cook.position.z + 0.16], t: [K.cook.position.x, 0.06, K.cook.position.z - 0.005], h: 40 },
  stove: { p: [0.42, 0.42, 0.62], t: [0.3, 0.06, -0.16], h: 50 },
  plate: { p: [0.0, 0.55, 0.62], t: [-0.02, 0.03, 0.08], h: 40 },
};
let view = 'front';
function shot(name, dur = 1.2) {
  const s = SHOT[name]; view = name;
  const p0 = cam.p.clone(), t0 = cam.t.clone(), h0 = cam.h, p1 = V(...s.p), t1 = V(...s.t);
  $('pip').classList.toggle('hide', !['board', 'pan', 'stove', 'plate'].includes(name));
  return T(dur, k => { cam.p.lerpVectors(p0, p1, k); cam.t.lerpVectors(t0, t1, k); cam.h = lerp(h0, s.h, k); });
}
function setShot(name) { const s = SHOT[name]; view = name; cam.p.set(...s.p); cam.t.set(...s.t); cam.h = s.h; }
const camDir = V(), look = V();
function applyCamera(time) {
  const aspect = innerWidth / innerHeight;
  const hRad = THREE.MathUtils.degToRad(cam.h);
  let vf = 2 * Math.atan(Math.tan(hRad / 2) / aspect), k = 1;
  const vMax = THREE.MathUtils.degToRad(view === 'front' ? 58 : 50);
  if (vf > vMax) { vf = vMax; const h2 = 2 * Math.atan(Math.tan(vf / 2) * aspect); k = Math.tan(hRad / 2) / Math.tan(h2 / 2); }
  camera.fov = THREE.MathUtils.radToDeg(vf); camera.aspect = aspect; camera.updateProjectionMatrix();
  camDir.subVectors(cam.p, cam.t).multiplyScalar(k);
  const a = 0.0025, sx = Math.sin(time * 0.7) * a, sy = Math.sin(time * 0.53 + 1) * a * 0.7;
  camera.position.set(cam.t.x + camDir.x + sx * k, cam.t.y + camDir.y + sy * k, cam.t.z + camDir.z);
  look.set(cam.t.x + sx * 0.3, cam.t.y + sy * 0.3, cam.t.z); camera.lookAt(look);
  // picture-in-picture: the chef's face
  ch.head.getWorldPosition(look);
  pipCam.position.set(look.x + 0.05, look.y + 0.03, look.z + 0.95); pipCam.lookAt(look.x, look.y - 0.06, look.z);
}

// ---------------- generation-safe animation helpers ----------------
let GEN = 0; const ABORT = new Error('abort');
function T(d, fn, e) { const g = GEN; return tween(d, (k, r) => { if (g === GEN) fn(k, r); }, e).then(() => { if (g !== GEN) throw ABORT; }); }
const W = s => T(s, () => { });
const hooks = new Set();
function H(fn) { const g = GEN; const h = (dt, t) => { if (g !== GEN) { hooks.delete(h); return; } fn(dt, t); }; hooks.add(h); return () => hooks.delete(h); }
const both = (...p) => Promise.all(p);
function moveTo(o, to, d = 0.8, e = ease.inOut, arc = 0) { const p0 = o.position.clone(); return T(d, k => { o.position.lerpVectors(p0, to, k); if (arc) o.position.y += Math.sin(k * Math.PI) * arc; }, e); }

// attach a prop to a hand grip with a local offset
// a held prop keeps its own (world) orientation and follows the hand; gp = grip point in the prop's model space
const FOLLOW = new Map();
function hold(o, side, gp = [0, 0, 0], rot = [0, 0, 0]) {
  scene.attach(o); o.rotation.set(...rot);
  FOLLOW.set(o, { side, gp: V(...gp) });
}
function drop(o) { FOLLOW.delete(o); const h = HOME.get(o); scene.attach(o); if (h) { o.position.copy(h.p); o.rotation.copy(h.r); } }
const _g = V(), _q = new THREE.Quaternion();
function followFrame() {
  for (const [o, f] of FOLLOW) {
    ch.arms[f.side].grip.getWorldPosition(_g);
    _q.setFromEuler(o.rotation);
    o.position.copy(_g).sub(f.gp.clone().applyQuaternion(_q));
  }
}
const isHeld = (o, side) => FOLLOW.has(o) && (!side || FOLLOW.get(o).side === side);
async function reachTo(side, world, d = 0.6) { ch.reach(side, world, 7); await W(d); }
function wp(o, x = 0, y = 0, z = 0) { return o.localToWorld(V(x, y, z)); }
async function grab(o, side, pos, rot, d = 0.55) {
  const w = o.getWorldPosition(V()); w.y += 0.05; await reachTo(side, w, d);
  hold(o, side, pos, rot); sfx.tap();
}

// ---------------- speech: Android TTS, Web Speech, or timed fallback ----------------
let speakSeq = 0, speakDone = null;
window.LAB_TTS_DONE = id => { if (+id === speakSeq && speakDone) { const f = speakDone; speakDone = null; f(); } };
function fill(s) {
  const hey = { leyla: 'Kuzum', zeynep: 'Canım', aylin: 'Arkadaşlar' }[chefId];
  return s.replace(/\{hey\}/g, hey).replace(/\{name\}/g, CHEF.name);
}
function caption(text, note = '') { $('subName').textContent = CHEF.name; $('subText').textContent = text; $('subNote').textContent = note; }
function say(raw, note = '') {
  const text = fill(raw); const g = GEN;
  caption(text, note);
  const id = ++speakSeq;
  ch.speaking = true;
  return new Promise((res, rej) => {
    let finished = false;
    const done = () => { if (finished) return; finished = true; ch.speaking = false; if (g !== GEN) rej(ABORT); else setTimeout(res, 250); };
    speakDone = done;
    const est = 900 + text.length * 62;
    if (!audio.muted && A && A.speak) { try { A.speak(text, CHEF.voice.pitch, CHEF.voice.rate, String(id)); setTimeout(done, est * 2.2 + 3000); return; } catch (e) { } }
    if (!audio.muted && window.speechSynthesis && !AUTO) {
      try {
        const u = new SpeechSynthesisUtterance(text); u.lang = 'tr-TR'; u.pitch = CHEF.voice.pitch; u.rate = CHEF.voice.rate;
        const v = speechSynthesis.getVoices().find(v => /tr/i.test(v.lang)); if (v) u.voice = v;
        u.onend = done; u.onerror = done; speechSynthesis.cancel(); speechSynthesis.speak(u);
        setTimeout(done, est * 2 + 2000); return;
      } catch (e) { }
    }
    setTimeout(done, AUTO ? Math.min(est, 1800) : est);
  });
}
function stopSpeech() { speakDone = null; ch.speaking = false; try { A && A.stopSpeak && A.stopSpeak(); } catch (e) { } try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { } }

// ---------------- voice commands ----------------
let micOn = false;
const CMD = [[/sonraki|ileri|devam|geç|next|növbəti/i, () => next()], [/geri|önceki|back|əvvəl/i, () => prev()], [/tekrar|yinele|bir daha|repeat|təkrar/i, () => repeat()], [/alarm|durdur|kapat|tamam|sus|stop/i, () => stopAlarm()]];
window.LAB_VOICE = text => {
  const t = String(text || '');
  for (const [re, fn] of CMD) if (re.test(t)) { toast('🎙️ ' + t); fn(); return; }
};
window.LAB_VOICE_END = () => { if (micOn) setTimeout(listen, 400); };
function listen() { if (!micOn) return; if (ch.speaking) { setTimeout(listen, 600); return; } try { A ? A.listen('tr-TR') : webListen(); } catch (e) { } }
let webRec = null;
function webListen() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
  webRec = new SR(); webRec.lang = 'tr-TR'; webRec.onresult = e => window.LAB_VOICE(e.results[0][0].transcript); webRec.onend = window.LAB_VOICE_END; webRec.start();
}
$('bMic').onclick = () => {
  micOn = !micOn; $('bMic').classList.toggle('on', micOn); $('micHint').classList.toggle('hide', !micOn);
  if (micOn) listen(); else { try { A ? A.stopListen() : webRec && webRec.stop(); } catch (e) { } }
};

// ---------------- timers & alarm ----------------
const TKEY = 'lab_timers';
let timers = []; try { timers = JSON.parse(localStorage.getItem(TKEY) || '[]').filter(t => t.end > Date.now() - 3600e3); } catch (e) { }
const saveTimers = () => { try { localStorage.setItem(TKEY, JSON.stringify(timers)); } catch (e) { } };
let simNow = Date.now(); // advances FF times faster in tests
function now() { return simNow; }
function startTimer(stepIdx, min, label) {
  let t = timers.find(t => t.step === stepIdx && t.r === R.id && !t.fired);
  if (t) return t;
  t = { id: (Date.now() % 1e8) + stepIdx, step: stepIdx, r: R.id, label, total: min * 60e3, end: now() + min * 60e3, fired: false };
  timers.push(t); saveTimers();
  if (A && A.scheduleAlarm) try { A.scheduleAlarm(t.id, t.end, '⏰ ' + R.title + ': süre doldu', label + ' hazır! Sonraki adıma geçebilirsin.'); } catch (e) { }
  drawTimers();
  return t;
}
const timerFrac = t => t ? clamp(1 - (t.end - now()) / t.total) : 1;
function fastTimer(id) { const t = timers.find(t => t.id === id); if (!t) return; const left = t.end - now(); t.end = now() + Math.min(left, 8000); saveTimers(); if (A && A.scheduleAlarm) try { A.cancelAlarm(t.id); A.scheduleAlarm(t.id, t.end, '⏰ ' + R.title, t.label + ' hazır!'); } catch (e) { } sfx.whoosh(); }
function fmt(ms) { ms = Math.max(0, ms); const s = Math.ceil(ms / 1000), m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; }
function drawTimers() {
  $('timers').innerHTML = timers.filter(t => !t.dismissed).map(t => `<div class="tchip ${t.fired ? 'done' : ''}" data-id="${t.id}"><div class="ring" style="--p:${timerFrac(t).toFixed(3)}"></div><span>${t.label}</span><b>${t.fired ? '⏰' : fmt(t.end - now())}</b>${t.fired ? '<button data-x="1">✕</button>' : '<button data-ff="1">⏩</button>'}</div>`).join('');
}
$('timers').onclick = e => {
  const c = e.target.closest('.tchip'); if (!c) return; const id = +c.dataset.id;
  if (e.target.dataset.ff) fastTimer(id);
  if (e.target.dataset.x) { const t = timers.find(t => t.id === id); if (t) t.dismissed = true; saveTimers(); stopAlarm(); }
};
let alarmOn = null, vibT = null;
function fireTimer(t, silent) {
  t.fired = true; saveTimers();
  if (A && A.cancelAlarm) try { A.cancelAlarm(t.id); } catch (e) { }
  drawTimers();
  if (silent) return;
  alarmOn = t; setLoop('alarm', 1);
  $('alarmTxt').textContent = t.label + ' hazır. Sonraki adıma geçebilirsin.';
  $('alarm').classList.remove('hide');
  vib(600); clearInterval(vibT); vibT = setInterval(() => vib(600), 1500);
  if (AUTO) setTimeout(stopAlarm, 1500);
}
function stopAlarm() {
  if (!alarmOn) return;
  alarmOn.dismissed = true; saveTimers(); alarmOn = null;
  setLoop('alarm', 0); clearInterval(vibT); $('alarm').classList.add('hide'); drawTimers();
  if (stepState.waitingTimer) { say('Süre doldu! Hazırsan sonraki adıma geçelim.').catch(() => { }); }
}
$('bAlarmStop').onclick = stopAlarm;
let lastTimerDraw = 0;
function tickTimers(dt) {
  simNow += dt * 1000 * FF - dt * 1000; // extra sim time in test mode
  simNow = Math.max(simNow, Date.now());
  for (const t of timers) if (!t.fired && now() >= t.end) fireTimer(t, document.hidden);
  if (performance.now() - lastTimerDraw > 250) { lastTimerDraw = performance.now(); drawTimers(); }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) { simNow = Date.now(); for (const t of timers) if (!t.fired && now() >= t.end) fireTimer(t, true); } });
window.LAB_ALARM_FIRED = () => { };

// ---------------- UI ----------------
let toastT;
function toast(s) { const t = $('toast'); t.textContent = s; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1600); }
$('bSound').onclick = () => { setMuted(!audio.muted); $('bSound').textContent = audio.muted ? '🔇' : '🔊'; if (audio.muted) stopSpeech(); };
$('bExit').onclick = () => { stopSpeech(); location.href = 'index.html'; };
$('bNext').onclick = () => next();
$('bPrev').onclick = () => prev();
$('bRep').onclick = () => repeat();
function setUI(i) {
  const s = R.steps[i];
  $('stepN').textContent = `${CHEF.name} · Adım ${i + 1} / ${R.steps.length}`;
  $('stepT').textContent = s.title;
  $('progBar').style.width = ((i + 1) / R.steps.length * 100) + '%';
  $('bPrev').disabled = i === 0;
  $('bNext').innerHTML = i === R.steps.length - 1 ? '🍽️<small>Bitir</small>' : '⏭<small>Sonraki</small>';
}

// ---------------- step engine ----------------
let cur = -1;
const stepState = { waitingTimer: false };
function ctx(i) {
  return {
    i, say, W, T, H, shot, moveTo, both, hold, drop, grab, isHeld, reachTo, wp, ch, K, P, pan, lid, plate, spoon, oil, paste, salt, black, water, onion, pepper, tomato, garlic, parsley,
    ST, sfx, setLoop, vib, startTimer: (min, label) => startTimer(i, min, label), timerFrac, stepState, oilStream, waterStream,
    saltP, pepP, steamP, spitP, setPanLevel: v => panLevel = v, F, M, V, rand, ease, lerp, clamp, chefId,
    waitTimer: async (t, onP, lines = []) => {
      stepState.waitingTimer = true; let said = 0;
      while (true) {
        const k = timerFrac(t); onP(k);
        if (said < lines.length && k >= lines[said][0]) { const l = lines[said++][1]; say(l).catch(() => { }); }
        if (t.fired || k >= 1) break;
        await W(0.1);
      }
      onP(1); stepState.waitingTimer = false;
    },
  };
}
async function go(i, replay = false) {
  i = clamp(i, 0, R.steps.length - 1);
  GEN++; const g = GEN; stopSpeech(); cur = i; setUI(i); stepState.waitingTimer = false;
  resetScene();
  for (let j = 0; j < i; j++) R.steps[j].apply(ctx(j));
  P_sync();
  try {
    await R.steps[i].play(ctx(i));
    if (g === GEN) { $('bNext').classList.add('pulse'); if (AUTO) setTimeout(() => g === GEN && next(), 600); }
  } catch (e) { if (e !== ABORT) console.error(e); }
}
function next() {
  sfx.tap();
  if (cur >= R.steps.length - 1) { stopSpeech(); location.href = 'index.html'; return; }
  go(cur + 1);
}
function prev() { sfx.tap(); if (cur > 0) go(cur - 1); }
function repeat() { sfx.tap(); go(cur); }
function P_sync() { for (const t in P) for (const k in P[t]) P[t][k].sync(); }

// ---------------- per-frame cooking visuals ----------------
function cookFrame(dt, time) {
  K.updateFire(time);
  // stirring moves the pieces in the pan around
  if (ST.stir > 0.01) {
    ST.stirA += dt * 3.2 * ST.stir;
    for (const t in P) {
      const ps = P[t].pan;
      for (let i = 0; i < ps.count; i++) {
        const it = ps.items[i]; it.a += dt * ST.stir * (1.4 - it.rad * 6) * 1.2;
        it.rad = clamp(it.rad + Math.sin(time * 2 + i) * dt * 0.01, 0.01, F.PAN.rb - 0.02);
        it.p.x = Math.cos(it.a) * it.rad; it.p.z = Math.sin(it.a) * it.rad;
        it.r.y += dt * ST.stir * 2; if (t !== 'parsley') it.r.x += dt * ST.stir * 1.3;
      }
    }
  }
  // lift pieces with the liquid level
  for (const t in P) { const ps = P[t].pan; if (ps.count) { for (let i = 0; i < ps.count; i++) { const it = ps.items[i]; const base = (t === 'parsley' ? 0.028 : 0.012) + (i % 3) * 0.004 + Math.max(0, panLevel * 0.6); it.p.y += (base - it.p.y) * Math.min(1, dt * 4); } } }
  // sizzle spits
  const pc = pan.position;
  if (ST.heat > 0.05 && Math.random() < dt * 40 * ST.heat) {
    const a = rand(0, 6.28), r = rand(0, 0.1);
    spitP.emit(V(pc.x + Math.cos(a) * r, pc.y + 0.02 + panLevel, pc.z + Math.sin(a) * r), V(rand(-0.15, 0.15), rand(0.2, 0.55) * ST.heat, rand(-0.15, 0.15)), { life: 0.5, size: rand(0.002, 0.004) });
  }
  if (ST.boil > 0.05 && Math.random() < dt * 30 * ST.boil) {
    const a = rand(0, 6.28), r = rand(0, 0.11);
    bubbleP.emit(V(pc.x + Math.cos(a) * r, pc.y + 0.008 + panLevel, pc.z + Math.sin(a) * r), V(0, 0.002, 0), { life: rand(0.3, 0.8), size: rand(0.004, 0.012), size1: 0.016 });
  }
  if (ST.steam > 0.05 && Math.random() < dt * 14 * ST.steam) {
    const a = rand(0, 6.28), r = rand(0, 0.1);
    steamP.emit(V(pc.x + Math.cos(a) * r, pc.y + 0.06 + panLevel, pc.z + Math.sin(a) * r), V(rand(-0.01, 0.01), rand(0.05, 0.09), rand(-0.01, 0.01)), { life: 2.4, size: 0.04, size1: 0.14, alpha: 0.5 });
  }
  setLoop('sizzle', ST.heat); setLoop('boil', ST.boil); setLoop('steam', ST.steam * 0.6);
  // oil shimmer
  const om = pan.userData.oil.material; if (om.bumpMap) om.bumpMap.offset.set(Math.sin(time * 0.7) * 0.05, time * 0.03);
  const lm = pan.userData.liquid.material; if (lm.bumpMap) { lm.bumpMap.rotation = time * 0.2 * (ST.boil + ST.stir); lm.bumpMap.offset.y = time * 0.05 * ST.boil; }
}

// ---------------- render loop ----------------
let last = performance.now(), time = 0;
function frame() {
  requestAnimationFrame(frame);
  const tnow = performance.now(); const dt = Math.min(0.05, (tnow - last) / 1000); last = tnow; time += dt;
  updateTweens(dt);
  hooks.forEach(h => h(dt, time));
  cookFrame(dt, time);
  ch.update(dt, time);
  followFrame();
  P_sync();
  allP.forEach(p => p.update(dt));
  tickTimers(dt);
  applyCamera(time);
  const w = innerWidth, h = innerHeight;
  renderer.setViewport(0, 0, w, h); renderer.setScissorTest(false); renderer.clear();
  renderer.render(scene, camera);
  if (!$('pip').classList.contains('hide')) {
    const pw = Math.round(w * 0.32), ph = Math.round(pw * 1.2), px = w - pw - 12, py = h - ph - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pipTop')) || 118);
    const pe = $('pip'); pe.style.left = px - 3 + 'px'; pe.style.top = (h - py - ph) - 3 + 'px'; pe.style.width = pw + 6 + 'px'; pe.style.height = ph + 6 + 'px';
    pipCam.aspect = pw / ph; pipCam.fov = 30; pipCam.updateProjectionMatrix();
    renderer.setScissorTest(true); renderer.setScissor(px, py, pw, ph); renderer.setViewport(px, py, pw, ph);
    renderer.clearDepth(); renderer.render(scene, pipCam); renderer.setScissorTest(false);
  }
}
function resize() { renderer.setSize(innerWidth, innerHeight, false); allP.forEach(p => p.setScale(innerHeight * renderer.getPixelRatio())); }
addEventListener('resize', resize); resize();

window.LAB = {
  back() { if (alarmOn) { stopAlarm(); return true; } stopSpeech(); location.href = 'index.html'; return true; },
  pause() { stopSpeech(); ['sizzle', 'boil', 'steam'].forEach(l => setLoop(l, 0)); },
  state: () => ({ step: cur, view, timers: timers.map(t => [t.label, Math.round((t.end - now()) / 1000), t.fired]) }),
  go, next, shot: setShot,
};

// ---------------- start ----------------
$('pipName').textContent = CHEF.name;
$('stTitle').textContent = R.title;
$('stInfo').textContent = `${CHEF.name} ile · ${R.steps.length} adım · ${R.time}`;
$('stIng').innerHTML = R.ing.map(s => `<li>${s}</li>`).join('');
resetScene(); P_sync(); setShot('front');
caption(fill('Merhaba! Hazır olduğunda “Başlayalım”a dokun.'));
ch.look(V(0, 0.5, 2));
frame();
requestAnimationFrame(() => { $('loading').style.opacity = 0; setTimeout(() => $('loading').remove(), 800); });
const begin = () => { unlock(); $('startOv').classList.add('hide'); go(+(QS.get('step') || 0)); };
$('bStart').onclick = begin;
if (AUTO) setTimeout(begin, 1500);
