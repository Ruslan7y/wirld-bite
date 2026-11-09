import * as THREE from 'three';
import { RoomEnvironment } from '../lib/RoomEnvironment.js';
import * as M from './models.js';
import * as TX from './textures.js';
import { Particles, Stream } from './fx.js';
import { tween, updateTweens, wait, ease, lerp, clamp, rand } from './util.js';
import { sfx, setLoop, unlock, startMusic, setMusic, setMuted, stopAllLoops, audio } from './audio.js';

const $ = id => document.getElementById(id);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const vib = ms => { try { window.Android ? Android.vibrate(ms) : navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };

// ---------------- renderer / scene ----------------
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const lowEnd = /Android/.test(navigator.userAgent) && (navigator.hardwareConcurrency || 4) <= 4;
renderer.setPixelRatio(Math.min(devicePixelRatio, lowEnd ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x17110d);
scene.fog = new THREE.Fog(0x17110d, 3.5, 9);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.38;

const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 20);

// lights: warm window key + soft fill + cool rim
const key = new THREE.DirectionalLight(0xffd9b0, 3.0);
key.position.set(-1.3, 2.1, 1.2);
key.castShadow = true;
key.shadow.mapSize.set(lowEnd ? 1024 : 2048, lowEnd ? 1024 : 2048);
Object.assign(key.shadow.camera, { left: -0.9, right: 1.4, top: 0.9, bottom: -0.9, near: 0.5, far: 5 });
key.shadow.bias = -0.0003; key.shadow.normalBias = 0.006; key.shadow.radius = 5;
scene.add(key);
scene.add(new THREE.HemisphereLight(0xfff1e0, 0x3b2a1f, 0.25));
const rim = new THREE.DirectionalLight(0xbcd4ff, 0.7); rim.position.set(1.5, 1.2, -1.5); scene.add(rim);
const bounce = new THREE.PointLight(0xffb070, 0.25, 2.5); bounce.position.set(0, 0.25, 0.8); scene.add(bounce);

// ---------------- world ----------------
const loading = $('loading');
M.makeMaterials();
const counter = M.mesh(new THREE.BoxGeometry(5, 0.06, 1.7), new THREE.MeshPhysicalMaterial({ map: TX.planks(), roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4 }), { cast: false });
counter.position.set(0, -0.03, -0.05); scene.add(counter);
const T = TX.tiles();
const wall = M.mesh(new THREE.PlaneGeometry(4, 1.6), new THREE.MeshPhysicalMaterial({ map: T.map, bumpMap: T.bump, bumpScale: 0.8, roughness: 0.25, clearcoat: 0.5 }), { cast: false });
wall.position.set(0, 0.8, -0.82); scene.add(wall);
scene.add(M.makeDecor());

// mixing bowl
const bowl = new THREE.Group(); const bowlMesh = M.makeBowl(); bowl.add(bowlMesh); scene.add(bowl);
const liquid = M.makeLiquid(); liquid.visible = false; bowl.add(liquid);
const LQ = { level: M.BOWL.bottom, vortex: 0, swirl: 0, swirlSpeed: 0, spin: 0, ripples: [], t: 0 };
const sugarMound = M.mesh(new THREE.SphereGeometry(1, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.MAT.sugar, { cast: false });
sugarMound.scale.set(0.0001, 0.0001, 0.0001); bowl.add(sugarMound);
const flourMound = M.mesh(new THREE.SphereGeometry(1, 36, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.MAT.flour, { cast: false });
flourMound.scale.set(0.0001, 0.0001, 0.0001); bowl.add(flourMound);
const yolks = [];

// eggs on a plate
const eggPlate = M.makePlate(0.07); eggPlate.position.set(-0.3, 0, 0.13); scene.add(eggPlate);
const eggs = [0, 1, 2].map(i => {
  const e = M.makeEgg(); e.rotation.set(0, i * 0.7 - 0.6, -Math.PI / 2, 'YXZ');
  e.position.set(-0.3 + (i - 1) * 0.04, 0.026, 0.13 + (i % 2) * 0.02 - 0.01); scene.add(e); return e;
});
// sugar bowl
const sugarRig = new THREE.Group(); const sugarBowl = M.makeSugarBowl(); sugarRig.add(sugarBowl); scene.add(sugarRig);
// jug
const jugRig = new THREE.Group(); const jug = M.makeJug(); jugRig.add(jug); scene.add(jugRig);
// sifter
const sifter = M.makeSifter(); scene.add(sifter);
// tools that come from off-screen
const mixer = M.makeMixer(); mixer.visible = false; scene.add(mixer);
const spatula = M.makeSpatula(); spatula.visible = false; scene.add(spatula);
// pan with the cake inside
const panG = new THREE.Group(); panG.add(M.makePan()); scene.add(panG);
const cake = M.makeCake(); cake.position.y = 0.003; cake.scale.set(1, 0.001, 1); cake.visible = false; panG.add(cake);
// oven
const oven = M.makeOven(); oven.position.set(0.98, 0, -0.26); oven.rotation.y = -0.42; scene.add(oven);
const OV = oven.userData;
const coolRack = M.makeCoolingRack(); coolRack.visible = false; scene.add(coolRack);
const stand = M.makeCakeStand(); stand.visible = false; scene.add(stand);
const plate = M.makePlate(0.08); plate.visible = false; scene.add(plate);
const fork = M.makeFork(); fork.visible = false; scene.add(fork);
const knife = M.makeKnife(); knife.visible = false; scene.add(knife);
const pick = M.makeToothpick(); pick.visible = false; scene.add(pick);

function resetLayout() {
  sugarRig.position.set(-0.27, 0, -0.13);
  jugRig.position.set(0.25, 0, -0.2);
  sifter.position.set(-0.47, 0.0, -0.08); sifter.rotation.set(0, 0.4, 0);
  panG.position.set(0.33, 0, 0.13);
}
resetLayout();

// particles
const spr = TX.sprite(), sprHard = TX.sprite(1), smoke = TX.smokeSprite();
const flourP = new Particles(scene, { max: 900, map: spr, color: 0xfffaf0, gravity: -0.5, drag: 2.2, opacity: 0.9 });
const sugarP = new Particles(scene, { max: 700, map: sprHard, color: 0xffffff, gravity: -2.2, drag: 0.4 });
const dropP = new Particles(scene, { max: 300, map: sprHard, color: 0xfff5dc, gravity: -2.4, drag: 0.6 });
const steamP = new Particles(scene, { max: 160, map: smoke, color: 0xffffff, gravity: 0.05, drag: 0.6, opacity: 0.35 });
const allP = [flourP, sugarP, dropP, steamP];
const streamMilk = new Stream(scene, M.MAT.milk, 0.0045);
const streamBatter = new Stream(scene, M.MAT.batter, 0.009);

// floor for falling particles: liquid surface inside the bowl, else stand / counter
const bowlWorld = new THREE.Vector3();
function floorAt(x, z) {
  bowl.getWorldPosition(bowlWorld);
  const dx = x - bowlWorld.x, dz = z - bowlWorld.z, d = Math.hypot(dx, dz);
  if (bowl.visible && d < M.bowlR(LQ.level)) return bowlWorld.y + LQ.level + (moundTop(d));
  if (stand.visible && Math.hypot(x - stand.position.x, z - stand.position.z) < 0.14) return cake.visible && cake.parent === scene ? cakeTopAt(x, z) : M.STAND_TOP;
  return 0.001;
}
function moundTop(d) {
  const f = flourMound.scale.x > 0.001 ? Math.max(0, flourMound.scale.y * (1 - (d / flourMound.scale.x) ** 2)) : 0;
  const s = sugarMound.scale.x > 0.001 ? Math.max(0, sugarMound.scale.y * (1 - (d / sugarMound.scale.x) ** 2)) : 0;
  return Math.max(f, s);
}
function cakeTopAt(x, z) {
  const d = Math.hypot(x - cake.position.x, z - cake.position.z) / M.CAKE.r;
  if (d > 1) return M.STAND_TOP;
  return cake.position.y + (M.CAKE.h + M.CAKE.dome * (1 - d * d)) * cake.scale.y;
}
[flourP, sugarP, dropP].forEach(p => p.floor = floorAt);
let landSugar = 0, landFlour = 0, landDust = 0;
sugarP.onLand = () => { landSugar++; };
flourP.onLand = (x, y, z) => { if (stand.visible) landDust++; else landFlour++; };

// ---------------- camera rig ----------------
const cam = { p: V(1.1, 0.8, 1.6), t: V(0.1, 0.05, -0.1), h: 55, sway: 1 };
function shotVec(s) { return { p: V(...s.p), t: V(...s.t), h: s.h }; }
function ovenPt(x, y, z) { return oven.localToWorld(V(x, y, z)); }
const SHOTS = {
  wide: { p: [0.95, 0.75, 1.55], t: [0.1, -0.22, -0.1], h: 50 },
  intro: { p: [-0.25, 0.5, 0.95], t: [0.02, 0.04, -0.05], h: 50 },
  bowl: { p: [0.0, 0.4, 0.42], t: [0, 0.055, 0], h: 40 },
  eggs: { p: [-0.12, 0.3, 0.42], t: [-0.05, 0.1, 0], h: 44 },
  top: { p: [0.02, 0.5, 0.24], t: [0, 0.035, 0], h: 36 },
  whisk: { p: [0.12, 0.3, 0.46], t: [0.0, 0.07, 0], h: 40 },
  fold: { p: [-0.1, 0.32, 0.44], t: [0.0, 0.06, 0], h: 38 },
  pourL: { p: [-0.05, 0.36, 0.44], t: [-0.03, 0.09, 0], h: 44 },
  pourR: { p: [0.12, 0.36, 0.5], t: [0.05, 0.12, 0], h: 48 },
  pan: { p: [0.42, 0.36, 0.8], t: [0.22, 0.12, 0.07], h: 52 },
  rack: { p: [0.36, 0.36, 0.58], t: [0.33, 0.06, 0.13], h: 40 },
  cake: { p: [0.0, 0.33, 0.48], t: [0, 0.12, 0], h: 40 },
  cakeTop: { p: [0.0, 0.47, 0.27], t: [0, 0.13, 0], h: 36 },
  slice: { p: [0.2, 0.24, 0.56], t: [0.07, 0.08, 0.14], h: 40 },
};
function ovenShot(close = false) {
  const { cx } = OV;
  return close ? { p: ovenPt(cx + 0.04, 0.24, 0.62), t: ovenPt(cx + 0.02, 0.14, 0), h: 46 }
    : { p: ovenPt(cx - 0.05, 0.36, 0.95), t: ovenPt(cx + 0.03, 0.15, 0), h: 46 };
}
function shot(s, dur = 1.6, e = ease.inOut) {
  const to = s.p instanceof THREE.Vector3 ? s : shotVec(s);
  const p0 = cam.p.clone(), t0 = cam.t.clone(), h0 = cam.h;
  return tween(dur, k => { cam.p.lerpVectors(p0, to.p, k); cam.t.lerpVectors(t0, to.t, k); cam.h = lerp(h0, to.h, k); }, e);
}
function setShot(s) { const v = s.p instanceof THREE.Vector3 ? s : shotVec(s); cam.p.copy(v.p); cam.t.copy(v.t); cam.h = v.h; }
let orbit = null; // free orbit around target at the end
const camLook = new THREE.Vector3(), camDir = new THREE.Vector3();
function applyCamera(time) {
  const aspect = innerWidth / innerHeight;
  // cam.h = wanted horizontal field of view. On tall screens keep a calm vertical fov
  // and dolly back instead, which gives the compressed, telephoto look of food videos.
  const hRad = THREE.MathUtils.degToRad(cam.h);
  let vf = 2 * Math.atan(Math.tan(hRad / 2) / aspect);
  const vMax = THREE.MathUtils.degToRad(48);
  let k = 1;
  if (vf > vMax) { vf = vMax; const h2 = 2 * Math.atan(Math.tan(vf / 2) * aspect); k = Math.tan(hRad / 2) / Math.tan(h2 / 2); }
  camera.fov = THREE.MathUtils.radToDeg(vf); camera.far = 30;
  camera.aspect = aspect; camera.updateProjectionMatrix();
  camDir.subVectors(cam.p, cam.t).multiplyScalar(k);
  // handheld feel
  const a = 0.0035 * cam.sway;
  const sx = Math.sin(time * 0.71) * a + Math.sin(time * 1.93) * a * 0.4;
  const sy = Math.sin(time * 0.53 + 1) * a * 0.8 + Math.sin(time * 2.3) * a * 0.3;
  camera.position.set(cam.t.x + camDir.x + sx * k, cam.t.y + camDir.y + sy * k, cam.t.z + camDir.z);
  camLook.set(cam.t.x + sx * 0.3, cam.t.y + sy * 0.3, cam.t.z);
  camera.lookAt(camLook);
}

// ---------------- UI ----------------
const STEPS = ['Fırını ısıt', 'Yumurtalar', 'Şeker', 'Çırpma', 'Süt ve yağ', 'Un, kabartma tozu, vanilin', 'Spatulayla karıştır', 'Kalıba dök', 'Fırına koy', 'Pişirme', 'Kürdan testi', 'Soğutma', 'Süsleme', 'Servis'];
const ING = [['🥚', '3 yumurta'], ['🍚', '1 su bardağı toz şeker (200 g)'], ['🥛', '1 su bardağı süt (200 ml)'], ['🫒', '½ su bardağı sıvı yağ (100 ml)'], ['🌾', '2,5 su bardağı un (300 g)'], ['🧂', '1 paket kabartma tozu (10 g)'], ['🍦', '1 paket vanilin'], ['❄️', 'Süs: pudra şekeri'], ['🍶', 'Süs: krem şanti'], ['🍓', 'Süs: 8 çilek, taze nane']];
const ING_STEP = [1, 2, 4, 4, 5, 5, 5, 12, 12, 12];
let stepIdx = -1;
function setStep(i) {
  stepIdx = i;
  $('stepN').textContent = `${i + 1} / ${STEPS.length}`;
  $('stepT').textContent = STEPS[i];
  $('progBar').style.width = ((i + 1) / STEPS.length * 100) + '%';
  sfx.step();
  renderIng();
}
function renderIng() {
  $('ingList').innerHTML = ING.map(([e, t], k) => `<li class="${ING_STEP[k] < stepIdx + 1 ? 'done' : ''}"><span>${e}</span>${t}</li>`).join('');
}
$('chips').innerHTML = ING.slice(0, 7).map(([e, t]) => `<span>${e} ${t.split(' (')[0]}</span>`).join('');
let capTimer;
function caption(txt, sub = '') {
  const c = $('caption');
  c.classList.remove('on');
  clearTimeout(capTimer);
  capTimer = setTimeout(() => { c.innerHTML = txt + (sub ? `<small>${sub}</small>` : ''); if (txt) c.classList.add('on'); }, 250);
}
let badgeTimer;
function badge(txt, info = false, ms = 2600) {
  const b = $('badge'); b.textContent = txt; b.classList.toggle('info', info); b.classList.add('on');
  clearTimeout(badgeTimer); badgeTimer = setTimeout(() => b.classList.remove('on'), ms);
}
function hint(type, txt) {
  if (!type || WATCH) { $('hint').classList.add('hide'); return; }
  $('gest').className = 'gest ' + type; $('hintT').textContent = txt;
  $('hint').classList.remove('hide');
}
const setHoldP = p => $('gest').style.setProperty('--p', p.toFixed(3));

// ---------------- input ----------------
const inp = { down: false, x: 0, y: 0, sx: 0, sy: 0, tapped: false, moveX: 0 };
const touch = $('touch');
touch.addEventListener('pointerdown', e => {
  unlock(); inp.down = true; inp.x = inp.sx = e.clientX; inp.y = inp.sy = e.clientY; inp.t0 = performance.now();
  touch.setPointerCapture(e.pointerId);
});
touch.addEventListener('pointermove', e => {
  if (!inp.down) return;
  inp.moveX += e.clientX - inp.x; inp.dxLast = e.clientX - inp.x;
  inp.x = e.clientX; inp.y = e.clientY;
  if (orbit) { orbit.vel += (e.movementX || inp.dxLast) * 0.004; }
});
const endPtr = () => {
  if (inp.down && performance.now() - inp.t0 < 350 && Math.hypot(inp.x - inp.sx, inp.y - inp.sy) < 18) inp.tapped = true;
  inp.down = false;
};
touch.addEventListener('pointerup', endPtr); touch.addEventListener('pointercancel', endPtr);

let WATCH = false, skipFlag = false, aborted = false;
$('bSkip').onclick = () => { skipFlag = true; sfx.tap(); };
const frameWait = () => new Promise(r => requestAnimationFrame(() => r()));
const abortCheck = () => { if (aborted) throw new Error('abort'); };

// Gesture waits. Each returns when done; in watch mode they play automatically.
async function waitTap(type, txt, autoDelay = 1.0) {
  hint('tap', txt); inp.tapped = false; skipFlag = false;
  let t = 0;
  while (true) {
    abortCheck();
    const dt = await frameDt();
    t += dt;
    if (inp.tapped || skipFlag || (WATCH && t > autoDelay)) break;
  }
  inp.tapped = false; hint(null); sfx.tap();
}
async function holdProgress(txt, seconds, onP, autoRate = 1) {
  hint('hold', txt); skipFlag = false;
  let p = 0;
  while (p < 1) {
    abortCheck();
    const dt = await frameDt();
    const holding = WATCH || inp.down;
    if (skipFlag) { p = 1; }
    if (holding) p = Math.min(1, p + dt / seconds * (WATCH ? autoRate : 1));
    onP(p, holding, dt); setHoldP(p);
  }
  onP(1, false, 0); hint(null); setHoldP(0);
}
// drag down to tilt: k = tilt 0..1; progress accumulates when tilt is high enough
async function dragPour(txt, onTilt, rate = 0.22) {
  hint('down', txt); skipFlag = false;
  let tilt = 0, prog = 0, at = 0;
  while (prog < 1) {
    abortCheck();
    const dt = await frameDt();
    let target;
    if (WATCH) { at += dt; target = at < 0.6 ? 0 : 1; }
    else target = inp.down ? clamp((inp.y - inp.sy) / (innerHeight * 0.22)) : 0;
    if (skipFlag) { target = 1; prog = Math.max(prog, 0.999); }
    tilt += (target - tilt) * Math.min(1, dt * 6);
    const flow = clamp((tilt - 0.55) / 0.45);
    prog = Math.min(1, prog + flow * rate * dt * (skipFlag ? 6 : 1));
    onTilt(tilt, flow, prog, dt);
  }
  hint(null);
  // return to rest smoothly
  await tween(0.7, k => onTilt(tilt * (1 - k), 0, 1, 0.016));
}
async function shakeGesture(txt, need, onShake, onFrame) {
  hint('shake', txt); skipFlag = false;
  let count = 0, dir = 0, acc = 0, t = 0, pos = 0;
  while (count < need) {
    abortCheck();
    const dt = await frameDt(); t += dt;
    let mv = 0;
    if (WATCH) mv = Math.cos(t * 9) * 900 * dt; else { mv = inp.moveX; inp.moveX = 0; }
    if (skipFlag) { count++; onShake(count / need); continue; }
    pos = clamp(pos + mv / (innerWidth * 0.25), -1, 1);
    if (!WATCH && !inp.down) pos *= Math.exp(-dt * 6);
    const d = Math.sign(mv);
    if (Math.abs(mv) > 0.5) {
      acc += Math.abs(mv);
      if (d !== dir && acc > innerWidth * 0.06) { dir = d; acc = 0; count++; onShake(count / need); }
    }
    onFrame(pos, dt);
  }
  hint(null); inp.moveX = 0;
}
async function circleGesture(txt, turns, onAngle) {
  hint('circle', txt); skipFlag = false;
  let total = 0, last = null;
  const cx = innerWidth / 2, cy = innerHeight * 0.55;
  while (total < turns * Math.PI * 2) {
    abortCheck();
    const dt = await frameDt();
    let d = 0;
    if (WATCH) d = dt * 4.5;
    else if (inp.down) {
      const a = Math.atan2(inp.y - cy, inp.x - cx);
      if (last !== null) { d = a - last; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; d = Math.abs(d); }
      last = a;
    } else last = null;
    if (skipFlag) d = turns * Math.PI * 2;
    total += Math.min(d, 0.5);
    onAngle(total, Math.min(1, total / (turns * Math.PI * 2)), d, dt);
  }
  hint(null);
}
let frameResolvers = [];
const frameDt = () => new Promise(r => frameResolvers.push(r));

// ---------------- liquid simulation ----------------
const LQM = liquid.material; // starts as egg white
function updateLiquid(dt, time) {
  const L = LQ; L.t += dt;
  const r = M.bowlR(L.level) - 0.0012;
  liquid.scale.set(r, 1, r); liquid.position.y = L.level;
  const pos = liquid.geometry.attributes.position, base = liquid.userData.base;
  L.spin += L.swirlSpeed * dt;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3], z = base[i * 3 + 2], rr = Math.min(1, Math.hypot(x, z)), th = Math.atan2(x, z);
    let y = -L.vortex * 0.016 * Math.pow(1 - rr * rr, 2);
    y += L.swirl * 0.0022 * Math.sin(5 * th + rr * 14 - L.spin * 2.2) * rr * (1 - rr) * 4;
    for (const rp of L.ripples) {
      const d = Math.hypot(x - rp.x, z - rp.z);
      y += rp.a * Math.sin(d * 34 - rp.t * 14) * Math.exp(-d * 3) * Math.exp(-rp.t * 2.2) * Math.max(0, 1 - Math.abs(d - rp.t * 0.5) * 2);
    }
    pos.setY(i, y * (1 - Math.pow(rr, 10)));
  }
  pos.needsUpdate = true; liquid.geometry.computeVertexNormals();
  L.ripples = L.ripples.filter(rp => (rp.t += dt) < 2.4);
  if (LQM.bumpMap) LQM.bumpMap.rotation = -L.spin * 0.6;
  // mounds sit on the surface
  sugarMound.position.y = flourMound.position.y = L.level - 0.001;
}
function ripple(x = 0, z = 0, a = 0.0025) { LQ.ripples.push({ x, z, a, t: 0 }); if (LQ.ripples.length > 5) LQ.ripples.shift(); }
function splash(at, color = 0xfff5dc, n = 14, power = 0.35) {
  dropP.mat.uniforms.color.value.set(color);
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), s = rand(0.3, 1) * power;
    dropP.emit(at, V(Math.cos(a) * s * 0.35, rand(0.4, 1) * power * 1.6, Math.sin(a) * s * 0.35), { life: 0.6, size: rand(0.0025, 0.005) });
  }
}
const colA = new THREE.Color(), colB = new THREE.Color();
function liquidLook(hex, opacity, rough, dur = 1) {
  colA.copy(LQM.color); colB.set(hex); const o0 = LQM.opacity, r0 = LQM.roughness;
  LQM.transparent = true;
  return tween(dur, k => { LQM.color.lerpColors(colA, colB, k); LQM.opacity = lerp(o0, opacity, k); LQM.roughness = lerp(r0, rough, k); if (k === 1 && opacity >= 0.99) { LQM.transparent = false; LQM.needsUpdate = true; } });
}
function levelTo(y, dur = 0.8) { const y0 = LQ.level; return tween(dur, k => LQ.level = lerp(y0, y, k), ease.out); }

// ---------------- render loop ----------------
let last = performance.now(), time = 0, running = true;
const QS = new URLSearchParams(location.search);
let SPEED = +(QS.get('speed') || 1);
const FROM = +(QS.get('from') || 0);
const grainC = $('grain'), grainG = grainC.getContext('2d'), grainImg = grainG.createImageData(160, 160);
let grainTick = 0;
function frame() {
  requestAnimationFrame(frame);
  const now = performance.now(); let dt = Math.min(0.05, (now - last) / 1000) * SPEED; last = now;
  if (!running) return;
  time += dt;
  updateTweens(dt);
  const rs = frameResolvers; frameResolvers = []; rs.forEach(r => r(dt));
  if (liquid.visible) updateLiquid(dt, time);
  allP.forEach(p => { p.update(dt); });
  if (orbit) {
    orbit.a += orbit.vel * dt + dt * 0.18; orbit.vel *= Math.exp(-dt * 2.5);
    cam.p.set(orbit.c.x + Math.sin(orbit.a) * orbit.r, orbit.c.y + orbit.y, orbit.c.z + Math.cos(orbit.a) * orbit.r);
    cam.t.copy(orbit.c);
  }
  hooks.forEach(h => h(dt, time));
  applyCamera(time);
  renderer.render(scene, camera);
  if ((grainTick++ & 1) === 0) {
    const d = grainImg.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    grainG.putImageData(grainImg, 0, 0);
  }
}
const hooks = new Set();
function hook(fn) { hooks.add(fn); return () => hooks.delete(fn); }
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  allP.forEach(p => p.setScale(innerHeight * renderer.getPixelRatio()));
}
addEventListener('resize', resize); resize();

// ---------------- helpers for moving things ----------------
function moveTo(obj, to, dur = 1, e = ease.inOut, arc = 0) {
  const p0 = obj.position.clone();
  return tween(dur, k => { obj.position.lerpVectors(p0, to, k); if (arc) obj.position.y += Math.sin(k * Math.PI) * arc; }, e);
}
function rotTo(obj, to, dur = 1, e = ease.inOut) {
  const r0 = obj.rotation.clone();
  return tween(dur, k => obj.rotation.set(lerp(r0.x, to.x ?? r0.x, k), lerp(r0.y, to.y ?? r0.y, k), lerp(r0.z, to.z ?? r0.z, k)), e);
}
const both = (...p) => Promise.all(p);

// A pour rig: holder at the spout; object hangs from it so tilting pivots at the spout.
function makePourRig(rig, obj, spoutX, spoutY) {
  const wp = rig.position.clone();
  rig.position.set(wp.x + spoutX, spoutY, wp.z);
  obj.position.set(-spoutX, -spoutY, 0);
  return rig;
}
const aimY = (from, to) => Math.atan2(-(to.z - from.z), to.x - from.x);

// ---------------- steps ----------------
async function stepPreheat() {
  setStep(0);
  caption('Önce fırını 175°C’ye ayarlıyoruz', 'Kek içine girdiğinde fırın tam sıcak olmalı');
  await shot(ovenShot(false), 2.2);
  await waitTap('tap', 'Düğmeyi çevir · 175°C', 0.8);
  sfx.knob(); vib(15);
  const kb = OV.knobs[0];
  await tween(0.6, k => kb.rotation.z = -k * 2.2);
  OV.lcdTex.draw('175°', 'ISINIYOR'); sfx.clank();
  tween(2, k => { OV.light.intensity = k * 0.25; M.MAT.element.emissiveIntensity = k * 0.8; });
  setLoop('oven', 0.4);
  badge('🔥 Fırın ısınıyor · 175°C', true);
  await wait(1.1);
}

async function crackEgg(egg, i) {
  const rimPt = V(-0.13, 0.135, 0.02), center = V(0, 0.2, 0);
  // pick up
  await both(moveTo(egg, V(-0.2, 0.2, 0.05), 0.75, ease.inOut, 0.05), rotTo(egg, { x: 0, y: 0, z: -Math.PI / 2 }, 0.75));
  // two taps on the rim
  for (let t = 0; t < 2; t++) {
    await moveTo(egg, V(rimPt.x - 0.02, rimPt.y + 0.012, rimPt.z), 0.16, ease.in);
    if (t === 0) { sfx.tap(); vib(8); } else { sfx.crack(); vib(25); }
    await moveTo(egg, V(rimPt.x - 0.04, rimPt.y + 0.06, rimPt.z), 0.22, ease.out);
  }
  await moveTo(egg, center, 0.4);
  // open the shell
  const { top, bottom } = egg.userData;
  sfx.shell();
  const yolk = M.makeYolk(), white = M.makeWhite();
  yolk.position.copy(center); white.position.copy(center); white.scale.set(0.35, 0.35, 0.35);
  scene.add(yolk, white);
  const fall = (async () => {
    await wait(0.12);
    const y0 = center.y, target = LQ.level + 0.004;
    const land = V(rand(-0.035, 0.035), 0, rand(-0.03, 0.03));
    await tween(0.42, k => {
      yolk.position.set(lerp(center.x, land.x, k), lerp(y0, target, k * k), lerp(center.z, land.z, k));
      white.position.set(yolk.position.x, yolk.position.y + 0.008 * (1 - k), yolk.position.z);
      white.scale.set(0.35 + k * 0.3, 0.35 + k * 0.9, 0.35 + k * 0.3);
    }, ease.linear);
    sfx.plop(); vib(12);
    splash(V(land.x, target, land.z), 0xfffbea, 10, 0.25);
    liquid.visible = true;
    ripple(land.x / 0.08, land.z / 0.08, 0.003);
    scene.remove(white);
    // yolk joins the bowl
    bowl.attach(yolk); yolks.push(yolk);
    await levelTo(M.BOWL.bottom + 0.008 + i * 0.006, 0.7);
  })();
  await tween(0.5, k => {
    top.position.y = k * 0.012; top.rotation.z = k * 1.1;
    bottom.position.y = -k * 0.012; bottom.rotation.z = -k * 1.1;
  }, ease.out);
  await wait(0.35);
  // shells away
  moveTo(egg, V(-0.3 + i * 0.03, 0.03, 0.13), 0.7, ease.inOut, 0.04).then(() => { egg.visible = false; });
  await fall;
}

async function stepEggs() {
  setStep(1);
  caption('Yumurtaları kasenin kenarında kırıyoruz');
  await shot(SHOTS.eggs, 1.8);
  for (let i = 0; i < 3; i++) {
    await waitTap('tap', `Yumurtayı kır (${i + 1}/3)`, i ? 0.25 : 0.7);
    await crackEgg(eggs[i], i);
  }
  badge('✓ 3 yumurta', false, 1500);
}

async function stepSugar() {
  setStep(2);
  caption('Toz şekeri ekliyoruz', '1 su bardağı · 200 g');
  await shot(SHOTS.pourL, 1.5);
  // move the bowl to pouring position (spout above bowl edge)
  const rig = makePourRig(sugarRig, sugarBowl, 0.056, 0.044);
  const pourPos = V(-0.06, 0.2, 0.0);
  rig.rotation.y = aimY(pourPos, V(0.02, 0, 0));
  await moveTo(rig, pourPos, 0.9, ease.inOut, 0.04);
  const mound = sugarBowl.userData.mound;
  const spoutW = new THREE.Vector3();
  await dragPour('Kaseyi eğmek için aşağı kaydır', (tilt, flow, prog, dt) => {
    rig.rotation.z = -tilt * 1.9;
    mound.scale.set(1 - prog * 0.8, Math.max(0.05, 0.35 * (1 - prog)), 1 - prog * 0.8);
    mound.position.x = tilt * 0.01;
    rig.getWorldPosition(spoutW);
    setLoop('pourSugar', flow);
    const n = Math.floor(flow * 260 * dt + Math.random());
    for (let k = 0; k < n; k++) sugarP.emit(V(spoutW.x + rand(-0.006, 0.006), spoutW.y - 0.004, spoutW.z + rand(-0.008, 0.008)), V(rand(0.05, 0.12), rand(-0.02, 0.02), rand(-0.02, 0.02)), { life: 1.2, size: rand(0.0035, 0.006) });
    // the mound in the big bowl grows
    const s = clamp(prog) * 0.05;
    sugarMound.scale.set(s, s * 0.32, s);
    sugarMound.position.x = 0.01;
    if (flow > 0.2 && Math.random() < dt * 4) ripple(0.1, 0, 0.0006);
  }, 0.32);
  setLoop('pourSugar', 0);
  await moveTo(rig, V(-0.33, 0.044, -0.2), 0.8, ease.inOut, 0.03);
  mound.visible = false;
}

async function stepWhisk() {
  setStep(3);
  caption('Mikserle yüksek devirde çırpıyoruz', 'Gerçekte ~5 dk: rengi açılıp hacmi iki katına çıkana kadar');
  await shot(SHOTS.whisk, 1.6);
  mixer.visible = true; mixer.position.set(0.02, 0.6, 0); mixer.rotation.set(0, 0.25, 0);
  sfx.whoosh();
  await moveTo(mixer, V(0.02, 0.0, 0), 1.0, ease.out);
  let speed = 0, ang = 0, lastStage = -1;
  const stages = [[0.15, 'Köpürmeye başladı…'], [0.45, 'Rengi açılıyor…'], [0.75, 'Hacmi artıyor…'], [0.98, '✓ Kremamsı, iz bırakan kıvam']];
  const y0 = LQ.level;
  LQM.bumpMap = TX.bumpNoise(18); LQM.bumpScale = 0; LQM.needsUpdate = true;
  colA.copy(LQM.color);
  const cMid = new THREE.Color(0xf7b733), cEnd = new THREE.Color(0xfbe7a8);
  await holdProgress('Mikseri çalıştırmak için basılı tut', 6, (p, holding, dt) => {
    speed += ((holding ? 1 : 0) - speed) * Math.min(1, dt * 5);
    mixer.userData.beaters.forEach((b, i) => b.rotation.y += (i ? 1 : -1) * speed * 40 * dt);
    ang += speed * dt * 1.6;
    mixer.position.x = 0.02 + Math.sin(ang) * 0.03 * speed; mixer.position.z = Math.cos(ang) * 0.03 * speed;
    mixer.position.y = Math.sin(time * 40) * 0.0006 * speed;
    LQ.vortex = speed * (0.4 + p * 0.6); LQ.swirl = speed * 1.0; LQ.swirlSpeed = speed * 9;
    setLoop('mixer', speed);
    if (speed > 0.3 && Math.random() < dt * 30) vib(6);
    // look of the mix
    if (p < 0.5) LQM.color.lerpColors(colA, cMid, p * 2); else LQM.color.lerpColors(cMid, cEnd, (p - 0.5) * 2);
    LQM.opacity = lerp(0.6, 1, clamp(p * 2.5)); LQM.transparent = LQM.opacity < 0.99;
    LQM.roughness = lerp(0.05, 0.45, p); LQM.bumpScale = p * 1.2;
    LQ.level = lerp(y0, 0.05, ease.inOut(p));
    // yolks spiral in and dissolve
    yolks.forEach((y, i) => {
      if (!y.visible) return;
      const a = Math.atan2(y.position.x, y.position.z) + speed * dt * 3, r = Math.hypot(y.position.x, y.position.z) * (1 - speed * dt * 0.6);
      y.position.set(Math.sin(a) * r, LQ.level + 0.002, Math.cos(a) * r);
      const s = clamp(1 - p * 3 + i * 0.2); y.scale.set(s, s * 0.72, s); if (s <= 0.02) y.visible = false;
    });
    const sm = clamp(1 - p * 2.5) * 0.05; sugarMound.scale.set(sm, sm * 0.32, sm);
    const st = stages.findIndex(s => p < s[0]);
    const cur = st === -1 ? stages.length - 1 : st - 1;
    if (cur !== lastStage && cur >= 0) { lastStage = cur; badge(stages[cur][1], cur < 3, 2200); if (cur === 3) sfx.sparkle(); }
  });
  await tween(0.6, k => { speed = 1 - k; LQ.vortex = (1 - k) * 0.5; LQ.swirl = 1 - k; setLoop('mixer', 1 - k); mixer.userData.beaters.forEach((b, i) => b.rotation.y += (i ? 1 : -1) * (1 - k) * 0.5); });
  LQ.swirlSpeed = 0; setLoop('mixer', 0);
  sfx.whoosh();
  await moveTo(mixer, V(0.1, 0.7, -0.1), 0.9, ease.in);
  mixer.visible = false;
}

async function stepMilk() {
  setStep(4);
  caption('Sütü ve sıvı yağı yavaşça ekliyoruz', 'Yağ, sütün üstünde ince bir katman olarak duruyor');
  await shot(SHOTS.pourR, 1.5);
  const rig = makePourRig(jugRig, jug, 0.046, 0.123);
  const pourPos = V(0.085, 0.21, 0.0);
  rig.rotation.y = aimY(pourPos, V(-0.02, 0, 0));
  await moveTo(rig, pourPos, 1.0, ease.inOut, 0.05);
  const y0 = LQ.level, spout = new THREE.Vector3(), c0 = LQM.color.clone(), cMilk = new THREE.Color(0xfcefc8);
  let splashT = 0;
  await dragPour('Sürahiyi eğmek için aşağı kaydır', (tilt, flow, prog, dt) => {
    rig.rotation.z = -tilt * 1.75;
    jug.userData.setLevel(1 - prog);
    rig.getWorldPosition(spout);
    const hit = V(spout.x - 0.04, LQ.level, spout.z);
    if (flow > 0.02) streamMilk.set(spout.clone().add(V(0.002, -0.002, 0)), hit, flow); else streamMilk.hide();
    setLoop('pourLiquid', flow);
    LQ.level = lerp(y0, 0.066, prog);
    LQM.color.lerpColors(c0, cMilk, prog * 0.8); LQM.roughness = lerp(0.45, 0.18, prog); LQM.bumpScale = lerp(1.2, 0.2, prog);
    LQ.swirl = flow * 0.4; LQ.swirlSpeed = flow * 2;
    splashT += dt * flow;
    if (splashT > 0.08) { splashT = 0; ripple(hit.x / M.bowlR(LQ.level), hit.z / M.bowlR(LQ.level), 0.002); splash(hit, 0xfffaf0, 3, 0.18); }
  }, 0.26);
  streamMilk.hide(); setLoop('pourLiquid', 0); LQ.swirl = 0;
  await moveTo(rig, V(0.28, 0.123, -0.24), 0.9, ease.inOut, 0.04);
}

async function stepFlour() {
  setStep(5);
  caption('Unu, kabartma tozu ve vanilinle birlikte eliyoruz', 'Elemek havalandırır, kek daha kabarık olur');
  await shot(SHOTS.bowl, 1.4);
  sifter.rotation.set(0, 0, 0);
  await moveTo(sifter, V(0, 0.2, 0), 1.0, ease.inOut, 0.06);
  const fl = sifter.userData.flour, wp = new THREE.Vector3();
  let prog = 0;
  await shakeGesture('Eleği sağa sola salla', 10, k => {
    prog = k; sfx.sift(); vib(6);
    sifter.getWorldPosition(wp);
    for (let n = 0; n < 90; n++) {
      const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 0.05;
      flourP.emit(V(wp.x + Math.cos(a) * r, wp.y - 0.022, wp.z + Math.sin(a) * r), V(rand(-0.02, 0.02), rand(-0.12, -0.05), rand(-0.02, 0.02)), { life: 1.6, size: rand(0.008, 0.014), size1: 0.02, alpha: 0.85 });
    }
  }, (pos, dt) => {
    sifter.position.x = pos * 0.03;
    sifter.rotation.z = -pos * 0.08;
    const s = 1 - prog * 0.92; fl.scale.set(Math.max(0.05, s), 0.5 * Math.max(0.05, s), Math.max(0.05, s));
    const fm = clamp(landFlour / 500) * 0.085;
    flourMound.scale.set(fm, fm * 0.42, fm);
  });
  badge('✓ Un elendi', false, 1300);
  await wait(0.6);
  await moveTo(sifter, V(-0.47, 0, -0.08), 0.9, ease.inOut, 0.05);
}

async function stepFold() {
  setStep(6);
  caption('Spatulayla alttan üste, nazikçe karıştırıyoruz', 'Fazla karıştırırsak kek sertleşir; un kaybolunca dur');
  await shot(SHOTS.fold, 1.2);
  spatula.visible = true; spatula.position.set(0, 0.6, 0.04); spatula.rotation.set(0.3, 0, 0);
  await moveTo(spatula, V(0.04, 0.03, 0), 0.8, ease.out);
  const fm0 = flourMound.scale.x, y0 = LQ.level, c0 = LQM.color.clone(), cFin = new THREE.Color(0xf6dc9c);
  let lastSq = 0;
  await circleGesture('Kasede daire çiz', 3, (total, p, d) => {
    const a = total;
    spatula.position.set(Math.sin(a) * 0.055, 0.025 + Math.abs(Math.sin(a * 2)) * 0.01, Math.cos(a) * 0.055);
    spatula.rotation.set(0.35, a + Math.PI / 2, Math.sin(a * 2) * 0.3);
    const s = fm0 * (1 - p);
    flourMound.scale.set(s, s * 0.42 * (1 - p * 0.5), s);
    flourMound.position.x = Math.sin(a) * 0.01 * (1 - p);
    LQ.level = lerp(y0, 0.078, p);
    LQM.color.lerpColors(c0, cFin, p); LQM.roughness = lerp(0.18, 0.32, p); LQM.bumpScale = 0.5;
    LQ.swirl = clamp(d * 20) * 0.8; LQ.spin = a * 2;
    if (total - lastSq > 2.2) { lastSq = total; sfx.squelch(); vib(8); }
  });
  flourMound.scale.set(0.0001, 0.0001, 0.0001); LQ.swirl = 0;
  badge('✓ Pürüzsüz, akışkan hamur', false, 1600);
  await moveTo(spatula, V(0.05, 0.65, -0.05), 0.8, ease.in);
  spatula.visible = false;
}

async function stepPan() {
  setStep(7);
  caption('Hamuru yağlanmış kalıba döküyoruz');
  await shot(SHOTS.pan, 1.6);
  cake.visible = true; cake.scale.y = 0.001;
  // bowl becomes a pour rig (spout on the rim, toward +x)
  const rimX = M.BOWL.rt + 0.009, rimY = M.BOWL.top;
  const rig = new THREE.Group(); scene.add(rig);
  rig.position.set(rimX, rimY, 0); bowl.position.set(-rimX, -rimY, 0); rig.add(bowl);
  const pourPos = V(panG.position.x - 0.03, 0.22, panG.position.z);
  rig.rotation.y = 0;
  await moveTo(rig, pourPos, 1.2, ease.inOut, 0.06);
  const spout = new THREE.Vector3(), y0 = LQ.level;
  await dragPour('Kaseyi eğerek dök', (tilt, flow, prog, dt) => {
    rig.rotation.z = -tilt * 1.6;
    rig.getWorldPosition(spout);
    const sh = cake.scale.y * (M.CAKE.h + M.CAKE.dome);
    const hit = V(panG.position.x + 0.012, 0.004 + sh, panG.position.z);
    if (flow > 0.02) streamBatter.set(spout.clone().add(V(0.004, -0.003, 0)), hit, flow, 0.001); else streamBatter.hide();
    setLoop('pourBatter', flow);
    LQ.level = lerp(y0, M.BOWL.bottom + 0.003, prog);
    if (prog > 0.97) liquid.visible = false;
    cake.scale.y = Math.max(0.001, prog * 0.45);
  }, 0.24);
  streamBatter.hide(); setLoop('pourBatter', 0);
  // put the bowl away (to the sink, off-screen)
  moveTo(rig, V(-1.3, 0.3, -0.2), 1.2, ease.in).then(() => { rig.visible = false; });
  caption('Tezgaha iki kez vurup havayı alıyoruz');
  for (let i = 0; i < 2; i++) {
    await moveTo(panG, V(panG.position.x, 0.03, panG.position.z), 0.18, ease.out);
    await moveTo(panG, V(panG.position.x, 0, panG.position.z), 0.1, ease.in);
    sfx.thunk(); vib(30);
    await wait(0.25);
  }
}

async function stepOvenIn() {
  setStep(8);
  caption('Kalıbı fırının orta rafına yerleştiriyoruz');
  stand.position.set(0, 0, 0); stand.visible = true; // ready for later, off-camera
  await shot(ovenShot(false), 1.8);
  await waitTap('tap', 'Fırın kapağını aç', 0.6);
  sfx.door(); vib(15);
  await tween(0.9, k => OV.door.rotation.x = k * 1.45, ease.out);
  const { cx } = OV;
  const front = ovenPt(cx, 0.14, 0.42), inside = ovenPt(cx, 0.1 + 0.0015, 0.0);
  await both(moveTo(panG, front, 1.1, ease.inOut, 0.1), rotTo(panG, { y: oven.rotation.y }, 1.1));
  await moveTo(panG, inside, 0.9, ease.inOut);
  sfx.clank();
  await wait(0.2);
  sfx.door();
  await tween(0.7, k => OV.door.rotation.x = (1 - k) * 1.45, ease.in);
  sfx.thunk(); vib(25);
}

async function stepBake() {
  setStep(9);
  caption('35 dakika pişiriyoruz', 'İlk 20 dakika kapağı açmayın, yoksa kek söner');
  await shot(ovenShot(true), 2);
  setLoop('oven', 1);
  const total = 35 * 60;
  let left = total, fast = WATCH, done = false;
  $('timer').classList.remove('hide');
  $('tmFast').classList.toggle('hide', WATCH);
  $('tmFast').onclick = () => { fast = true; $('tmFast').classList.add('hide'); sfx.whoosh(); };
  skipFlag = false;
  const arc = $('tmArc');
  const mat = M.MAT.batter.userData.uBake;
  let tickAcc = 0;
  hint(null);
  while (!done) {
    abortCheck();
    const dt = await frameDt();
    const rate = (fast || skipFlag) ? total / 11 : 1;
    left = Math.max(0, left - dt * rate);
    const p = 1 - left / total;
    const m = Math.floor(left / 60), s = Math.floor(left % 60);
    $('tmTxt').textContent = `${m}:${String(s).padStart(2, '0')}`;
    arc.style.strokeDashoffset = (339.3 * p).toFixed(1);
    OV.lcdTex.draw(`${m}:${String(s).padStart(2, '0')}`, '175°C');
    // cake rises and browns
    cake.scale.y = lerp(0.45, 1, ease.inOut(clamp(p * 1.4)));
    mat.value = clamp((p - 0.25) / 0.75);
    OV.light.intensity = 0.35 + Math.sin(time * 3) * 0.02;
    M.MAT.element.emissiveIntensity = 1.2 + Math.sin(time * 0.8) * 0.3;
    tickAcc += dt; if (tickAcc > (fast ? 0.12 : 1)) { tickAcc = 0; sfx.tick(); }
    if (p > 0.4 && p < 0.45) badge('Kabarıyor…', true, 1500);
    if (left <= 0) done = true;
  }
  sfx.ding(); vib(60); badge('⏰ Süre doldu!', true, 1800);
  OV.lcdTex.draw('0:00', 'HAZIR');
  $('timer').classList.add('hide');
  await wait(0.8);
}

async function stepToothpick() {
  setStep(10);
  caption('Kürdan testi: ortasına batırıp çıkarıyoruz');
  sfx.door();
  await tween(0.9, k => OV.door.rotation.x = k * 1.45, ease.out);
  setLoop('oven', 0.3);
  const { cx } = OV;
  const top = ovenPt(cx, 0.1 + 0.075, 0.0);
  await shot({ p: ovenPt(cx + 0.06, 0.3, 0.5), t: ovenPt(cx, 0.15, 0.02), h: 40 }, 1.4);
  await waitTap('tap', 'Kürdanı batır', 0.5);
  const outside = ovenPt(cx, 0.1 + 0.11, 0.45);
  pick.visible = true; pick.position.copy(outside); pick.rotation.set(0, 0, 0.12);
  await moveTo(pick, V(top.x, top.y + 0.035, top.z), 0.7, ease.out);
  await moveTo(pick, V(top.x, top.y - 0.03, top.z), 0.4, ease.inOut);
  await wait(0.3);
  await moveTo(pick, V(top.x, top.y + 0.035, top.z), 0.5, ease.inOut);
  badge('✓ Kürdan temiz çıktı, kek pişti', false, 2000); sfx.sparkle();
  await wait(0.6);
  await moveTo(pick, outside, 0.6, ease.in);
  pick.visible = false;
}

async function stepCool() {
  setStep(11);
  caption('Fırından alıp tel ızgarada 10 dakika dinlendiriyoruz', 'Sıcakken kalıptan çıkarırsak dağılabilir');
  coolRack.position.set(0.33, 0, 0.13); coolRack.visible = true;
  const { cx } = OV;
  await moveTo(panG, ovenPt(cx, 0.14, 0.4), 1.0, ease.inOut);
  shot(SHOTS.rack, 1.8);
  await both(moveTo(panG, V(0.33, 0.012, 0.13), 1.3, ease.inOut, 0.08), rotTo(panG, { y: 0 }, 1.3));
  sfx.clank();
  sfx.door(); tween(0.7, k => OV.door.rotation.x = (1 - k) * 1.45, ease.in);
  setLoop('oven', 0); setLoop('steam', 1);
  tween(1.5, k => { OV.light.intensity = (1 - k) * 0.35; M.MAT.element.emissiveIntensity = (1 - k) * 1.2; });
  OV.lcdTex.draw('', '', false);
  // steam
  const unhook = hook((dt) => {
    if (Math.random() < dt * 22) {
      const a = rand(0, 6.28), r = rand(0, 0.07);
      steamP.emit(V(0.33 + Math.cos(a) * r, 0.012 + 0.074, 0.13 + Math.sin(a) * r), V(rand(-0.01, 0.01), rand(0.04, 0.08), rand(-0.01, 0.01)), { life: 2.6, size: 0.03, size1: 0.11, alpha: 0.55 });
    }
  });
  await waitTap('tap', 'Soğumayı hızlandır ⏩', 2.4);
  badge('10 dakika sonra…', true, 1500);
  await wait(1.0);
  // lift cake out of the pan onto the stand
  caption('Kalıptan çıkarıp servis tabağına alıyoruz');
  scene.attach(cake);
  await shot(SHOTS.cake, 1.6);
  await moveTo(cake, V(cake.position.x, cake.position.y + 0.12, cake.position.z), 0.7, ease.out);
  moveTo(panG, V(1.4, 0, 0.6), 1.2, ease.in).then(() => { panG.visible = false; coolRack.visible = false; });
  await moveTo(cake, V(0, M.STAND_TOP + 0.12, 0), 1.0, ease.inOut);
  await moveTo(cake, V(0, M.STAND_TOP, 0), 0.5, ease.out);
  sfx.thunk(); vib(15);
  unhook(); setLoop('steam', 0.4);
  setTimeout(() => setLoop('steam', 0), 3000);
}

async function stepDecorate() {
  setStep(12);
  caption('Üzerine pudra şekeri eliyoruz');
  await shot(SHOTS.cake, 1);
  // sifter now holds powdered sugar
  const fl = sifter.userData.flour; fl.scale.set(0.7, 0.35, 0.7);
  await moveTo(sifter, V(0, M.STAND_TOP + M.CAKE.h + 0.16, 0), 1.0, ease.inOut, 0.06);
  const wp = new THREE.Vector3();
  const dust = M.MAT.sugarDust;
  await holdProgress('Pudra şekeri için basılı tut', 3.2, (p, holding, dt) => {
    sifter.position.x = holding ? Math.sin(time * 18) * 0.012 : sifter.position.x * 0.9;
    sifter.getWorldPosition(wp);
    if (holding) {
      if (Math.random() < dt * 10) sfx.sift();
      const n = Math.floor(dt * 220);
      for (let k = 0; k < n; k++) {
        const a = rand(0, 6.28), r = Math.sqrt(Math.random()) * 0.06;
        flourP.emit(V(wp.x + Math.cos(a) * r, wp.y - 0.02, wp.z + Math.sin(a) * r), V(rand(-0.01, 0.01), rand(-0.1, -0.05), rand(-0.01, 0.01)), { life: 2, size: rand(0.004, 0.009), alpha: 0.9 });
      }
    }
    dust.opacity = clamp(landDust / 380);
    const s = 0.7 * (1 - p * 0.8); fl.scale.set(s, s * 0.5, s);
  });
  await moveTo(sifter, V(-0.47, 0, -0.08), 0.9, ease.inOut, 0.05);
  // cream rosettes
  caption('Krem şantiyle 8 gül sıkıyoruz, üstüne çilek koyuyoruz');
  await shot(SHOTS.cakeTop, 1.3);
  const { wedge, body, W } = cake.userData;
  const ringR = 0.072, rho = ringR / M.CAKE.r, yTop = M.CAKE.h + M.CAKE.dome * (1 - rho * rho);
  const dollops = [];
  for (let i = 0; i < 8; i++) {
    const th = W / 2 + i * Math.PI / 4;
    const parent = i === 0 ? wedge : body;
    if (i === 0) await waitTap('tap', 'Krema sıkmak için dokun', 0.5);
    else await waitTap('tap', `Krema (${i + 1}/8)`, 0.18);
    const d = M.makeDollop();
    d.position.set(Math.sin(th) * ringR, yTop, Math.cos(th) * ringR);
    parent.add(d); dollops.push({ d, th, parent });
    sfx.squelch(); vib(10);
    tween(0.45, k => { d.scale.set(0.3 + 0.7 * k, k, 0.3 + 0.7 * k); d.rotation.y = (1 - k) * 2; }, ease.outBack);
  }
  await wait(0.5);
  // strawberries + mint
  for (const [i, o] of dollops.entries()) {
    const s = M.makeStrawberry(); s.scale.setScalar(1.25);
    const target = V(o.d.position.x, yTop + 0.05, o.d.position.z);
    s.position.copy(target).add(V(0, 0.15, 0)); s.rotation.set(Math.PI, i, 0.2);
    o.parent.add(s);
    tween(0.4, k => { s.position.y = target.y + 0.15 * (1 - k); }, ease.in).then(() => { sfx.pop(); vib(6); });
    await wait(0.14);
  }
  await wait(0.4);
  for (let i = 0; i < 3; i++) {
    const m = M.makeMint(); const th = Math.PI / 4 * (2 + i * 2) + W / 2 + 0.3;
    m.position.set(Math.sin(th) * 0.03, M.CAKE.h + M.CAKE.dome + 0.002, Math.cos(th) * 0.03);
    m.rotation.set(-Math.PI / 2 + 0.25, 0, th);
    body.add(m); m.scale.setScalar(0.01); tween(0.4, k => m.scale.setScalar(Math.max(0.01, k)), ease.outBack);
    await wait(0.15);
  }
  sfx.sparkle(); badge('✨ Harika görünüyor!', false, 1600);
  await wait(0.9);
}

async function stepServe() {
  setStep(13);
  caption('Bir dilim kesip servis ediyoruz');
  await shot(SHOTS.cake, 1.2);
  await waitTap('tap', 'Dilim kes', 0.4);
  const { wedge, W } = cake.userData;
  knife.visible = true;
  const top = M.STAND_TOP + M.CAKE.h + M.CAKE.dome + 0.04;
  for (const th of [0, W]) {
    // blade in the plane of the cut line
    knife.rotation.set(0, th - Math.PI / 2, 0);
    knife.position.set(0, top + 0.1, 0);
    await moveTo(knife, V(0, top, 0), 0.35, ease.out);
    sfx.cut(); vib(20);
    await moveTo(knife, V(0, M.STAND_TOP + 0.005, 0), 0.6, ease.inOut);
    await moveTo(knife, V(0, top + 0.12, 0), 0.4, ease.in);
  }
  knife.visible = false;
  plate.position.set(0.12, 0, 0.27); plate.visible = true; plate.scale.setScalar(0.01);
  fork.position.set(0.12 + 0.07, 0.008, 0.27 + 0.02); fork.rotation.y = -0.5;
  tween(0.5, k => plate.scale.setScalar(Math.max(0.01, k)), ease.outBack);
  await shot(SHOTS.slice, 1.4);
  // wedge slides out and onto the plate
  scene.attach(wedge);
  const mid = W / 2, out = V(Math.sin(mid), 0, Math.cos(mid));
  const p0 = wedge.position.clone();
  await moveTo(wedge, p0.clone().add(out.clone().multiplyScalar(0.05)).add(V(0, 0.02, 0)), 0.7, ease.inOut);
  sfx.whoosh();
  const dst = V(0.12 - Math.sin(mid + 0.9) * 0.05, 0.007, 0.27 - Math.cos(mid + 0.9) * 0.05);
  await both(moveTo(wedge, dst, 1.1, ease.inOut, 0.06), rotTo(wedge, { y: 0.9 }, 1.1));
  sfx.thunk(); fork.visible = true;
  sfx.success(); vib(40);
  caption('');
  $('hud').classList.add('hide');
  document.body.classList.remove('cine');
  orbit = { c: V(0.04, 0.1, 0.1), r: 0.6, y: 0.22, a: 0.35, vel: 0 };
  $('endTxt').textContent = 'Vanilyalı çilekli kekin hazır. 14 adımın hepsini tamamladın.';
  $('end').classList.remove('hide');
}

// ---------------- flow ----------------
async function run(watch) {
  WATCH = watch; aborted = false;
  document.body.classList.toggle('cine', watch);
  $('start').classList.add('hide'); $('hud').classList.remove('hide');
  $('bSkip').classList.toggle('hide', watch);
  unlock(); startMusic(); setLoop('room', 1);
  await shot(SHOTS.intro, 2.2);
  try {
    const arr = [stepPreheat, stepEggs, stepSugar, stepWhisk, stepMilk, stepFlour, stepFold, stepPan, stepOvenIn, stepBake, stepToothpick, stepCool, stepDecorate, stepServe];
    for (const s of [stepPreheat, stepEggs, stepSugar, stepWhisk, stepMilk, stepFlour, stepFold, stepPan, stepOvenIn, stepBake, stepToothpick, stepCool, stepDecorate, stepServe]) {
      const i = arr.indexOf(s);
      const base = +(QS.get('speed') || 1);
      SPEED = i < FROM ? 80 : base;
      await s();
    }
  } catch (e) { if (e.message !== 'abort') { console.error(e); } }
}

function intro() {
  setShot(SHOTS.wide);
  orbit = null;
  $('start').classList.remove('hide');
  // gentle idle drift on the start screen
  let a = 0;
  const un = hook(dt => { a += dt * 0.05; cam.p.set(0.95 * Math.cos(a) * 1, 0.75, 1.55 - Math.sin(a) * 0.3); });
  const go = w => { un(); run(w); };
  $('bWatch').onclick = () => go(true);
  $('bPlay').onclick = () => go(false);
}
$('bAgain').onclick = () => location.reload();
$('bFree').onclick = () => { $('end').classList.add('hide'); badge('Parmağınla kaydırarak döndür', true, 2500); };
$('bExit').onclick = () => location.href = 'index.html';
$('bIng').onclick = () => { renderIng(); $('sheet').classList.remove('hide'); };
$('bShClose').onclick = () => $('sheet').classList.add('hide');
$('bSound').onclick = () => { setMuted(!audio.muted); $('bSound').textContent = audio.muted ? '🔇' : '🔊'; };

window.LAB = {
  back() {
    if (!$('sheet').classList.contains('hide')) { $('sheet').classList.add('hide'); return true; }
    if (!$('start').classList.contains('hide')) { location.href = 'index.html'; return true; }
    location.reload(); return true;
  },
  pause() { stopAllLoops(); },
  state: () => ({ step: stepIdx, cam: cam.p.toArray(), level: LQ.level }),
  // test helpers
  _run: run, _setWatch: w => WATCH = w, _skip: () => { skipFlag = true; },
};

frame();
requestAnimationFrame(() => {
  loading.style.opacity = 0; setTimeout(() => loading.remove(), 800);
  intro();
});
