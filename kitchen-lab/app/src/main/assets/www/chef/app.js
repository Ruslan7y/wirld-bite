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
import { GLTFLoader } from '../lib/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../lib/jsm/libs/meshopt_decoder.module.js';
import { makeCarla } from '../real/carla.js';
import { buildGeneric, buildMenu, GRAIN } from './generic.js';
import { applySnap, playStep, bgResume } from './genericPlay.js';

const $ = id => document.getElementById(id);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const QS = new URLSearchParams(location.search);
const AUTO = QS.has('auto');
const GHOST = QS.has('ghost');               // ghost edition                 // test: advance automatically
const FF = +(QS.get('ff') || 1);
const SPD = +(QS.get('spd') || 1);          // test: animation speed             // test: timer speed multiplier
const A = window.LabAndroid || window.Android || null;
const IN_WB = QS.has('wb');
function goHome() { stopSpeech(); try { if (IN_WB && window.parent !== window && window.parent.WB_LAB_CLOSE) { window.parent.WB_LAB_CLOSE(); return; } } catch (e) { } location.href = 'index.html' + (GHOST ? '?ghost=1' : ''); }
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
const REAL = QS.get('chef') === 'carla';
const K = buildKitchen(scene, { real: REAL });
// realistic kitchen (user's model) placed so that its hob/counter match the recipe space
let realGLTF = null, carlaGLTF = null, carlaTex = null, kitchenClip = null, TABLE = null, ruslanGLTF = null, ruslanTex = null;
if (REAL) {
  const gl = new GLTFLoader(); gl.setMeshoptDecoder(MeshoptDecoder);
  const tl = new THREE.TextureLoader();
  const load = u => new Promise((res, rej) => gl.load(u, res, undefined, rej));
  const ltex = (u, srgb) => new Promise(res => tl.load(u, t => { t.flipY = false; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; res(t); }));
  const [kit, carla, dif, norm, tab, rus, rdif, rnorm] = await Promise.all([load('models/kitchen.glb'), load('models/carla.glb'), ltex('models/carla_dif.jpg', true), ltex('models/carla_norm.jpg'), load('models/table.glb'), load('models/ruslan.glb'), ltex('models/ruslan_dif.jpg', true), ltex('models/ruslan_norm.jpg')]);
  ruslanGLTF = rus; ruslanTex = { dif: rdif, norm: rnorm };
  const g = new THREE.Group(); g.rotation.y = -Math.PI / 2; g.position.set(1.69, -0.895, -1.28);
  kit.scene.scale.setScalar(0.1); g.add(kit.scene); scene.add(g);
  // dining table (user's model) in the open part of the room, for serving
  tab.scene.scale.setScalar(0.1); tab.scene.position.set(3.5, 0, 4.5); g.add(tab.scene);
  tab.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.updateMatrixWorld(true);
  const tb = new THREE.Box3().setFromObject(tab.scene), tc = tb.getCenter(new THREE.Vector3());
  const rc = new THREE.Raycaster(); let spot = null;
  for (const [dx, dz] of [[0, 0], [0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3], [0.6, 0], [-0.6, 0]]) {
    rc.set(new THREE.Vector3(tc.x + dx, 2, tc.z + dz), new THREE.Vector3(0, -1, 0));
    const h = rc.intersectObject(tab.scene, true)[0]; if (h && h.point.y > -0.3) { spot = h.point.clone(); break; }
  }
  TABLE = { spot: spot || new THREE.Vector3(tc.x, tb.max.y, tc.z), obj: tab.scene };
  { // table edge toward -x: the guest sits there
    const sp = TABLE.spot; let edge = 0;
    for (let d = 0; d < 1.4; d += 0.03) { rc.set(new THREE.Vector3(sp.x - d, 2, sp.z), new THREE.Vector3(0, -1, 0)); const h = rc.intersectObject(tab.scene, true)[0]; if (!h || Math.abs(h.point.y - sp.y) > 0.03) break; edge = d; }
    // dining part of the table lies toward +z of the spot (0.9 m wide); guest sits on its +x side facing -x
    TABLE.seat = new THREE.Vector3(sp.x + 0.56, 0, sp.z + 1.0);
    TABLE.guestPlate = new THREE.Vector3(sp.x + 0.0, sp.y, sp.z + 1.0);
    TABLE.carla = new THREE.Vector3(sp.x + 0.5, 0, sp.z + 0.42);
  }
  const pend = new THREE.PointLight(0xffe3b8, 1.6, 3, 1.4); pend.position.copy(TABLE.spot).add(new THREE.Vector3(0, 0.9, 0)); scene.add(pend);
  // face-on shots: cut away wall cabinets + hood between the camera and the chef
  kitchenClip = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.52), new THREE.Plane(new THREE.Vector3(0, 0, -1), -0.25)];
  kit.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.clippingPlanes = kitchenClip; m.clipIntersection = true; }); } });
  carlaGLTF = carla; carlaTex = { dif, norm };
  scene.background = new THREE.Color(0xd9d2c6);
  key.position.set(-0.6, 3.0, -2.2); key.intensity = 2.0;
  Object.assign(key.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.2 }); key.shadow.camera.updateProjectionMatrix();
  win.position.set(1.5, 1.2, -1.5); win.intensity = 0.6;
  const hood = new THREE.SpotLight(0xfff1d6, 5, 1.6, 0.9, 0.6, 1.5); hood.position.set(0.33, 0.6, -0.05); hood.target.position.set(0.33, 0, -0.1); scene.add(hood, hood.target);
  const under = new THREE.PointLight(0xffe8d0, 1.4, 2.5, 1.5); under.position.set(0.1, 0.5, 0.2); scene.add(under);
  scene.environmentIntensity = 0.65;
}

// ---------------- chef ----------------
const chefId = REAL ? 'carla' : ['leyla', 'zeynep', 'aylin'].includes(QS.get('chef')) ? QS.get('chef') : 'zeynep';
const ch = REAL ? makeCarla(carlaGLTF, carlaTex, () => camera) : makeCharacter(chefId);
const STATION = REAL ? { stove: { p: V(0.2, 0, -0.5), r: 0 }, board: { p: V(0.02, 0, -0.43), r: -Math.PI / 2 }, bowl: { p: V(0.12, 0, -0.5), r: -0.45 }, oven: { p: V(0.02, 0, -0.84), r: -Math.PI / 2 }, table: { p: TABLE.carla.clone(), r: -0.7 } } : { stove: { p: V(0, 0, -0.56), r: 0 }, board: { p: V(0, 0, -0.56), r: 0 }, bowl: { p: V(-0.2, 0, -0.56), r: -0.3 }, oven: { p: V(0.3, 0, -0.56), r: 0.5 } };
ch.root.position.copy(STATION.stove.p);
scene.add(ch.root);
const CHEF = REAL ? { name: 'Carla', voice: { pitch: 1.05, rate: 0.97 } } : CHEF_INFO[chefId];
// guest at the dining table (Ruslan), sitting on a chair
let guest = null, chair = null;
if (REAL && ruslanGLTF) {
  guest = makeCarla(ruslanGLTF, ruslanTex, () => camera, { id: 'ruslan', name: 'Ruslan', apron: false, seated: true, height: 1.64, tableY: TABLE.spot.y });
  guest.voice = { pitch: 0.82, rate: 0.95 }; guest.lidSign = 0;
  const faceFill = new THREE.PointLight(0xfff0e0, 1.3, 3, 1.3);
  faceFill.position.set(TABLE.spot.x - 0.8, TABLE.spot.y + 0.75, TABLE.spot.z + 1.1); scene.add(faceFill);
  guest.root.position.copy(TABLE.seat); guest.root.rotation.y = -Math.PI / 2; scene.add(guest.root);
  // simple modern chair
  chair = new THREE.Group(); const wood = M.MAT.wood, metal = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, metalness: 0.7, roughness: 0.35 });
  const SEAT = -0.895 + 0.45;
  const seatM = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.03, 0.44), wood); seatM.position.y = SEAT; chair.add(seatM);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.4, 0.42), wood); back.position.set(-0.21, SEAT + 0.24, 0); back.rotation.z = -0.08; chair.add(back);
  for (const [x, z] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 8), metal); l.position.set(x, SEAT - 0.225, z); chair.add(l); }
  chair.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
  chair.position.set(TABLE.seat.x + 0.06, 0, TABLE.seat.z); chair.rotation.y = Math.PI; scene.add(chair);
}

// ---------------- props for the recipe ----------------
// World Bite recipes come from the parent app (iframe) or, for testing, straight from its data files
const loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
let SRC = null;
if (QS.has('wbtest')) {
  await loadScript('../js/recipes.js'); await loadScript('../js/sigrecipes.js');
  const code = QS.get('wbtest'), G = (0, eval);
  if (code.includes('-')) { const r = G('RECIPES').find(x => x.id === code); SRC = { name: r.name.tr, ing: r.ing.tr, st: r.st.tr, s: r.s, time: r.t, key: code }; }
  else { const g = G('SIG')[code]; SRC = { name: QS.get('name') || code, ing: g.ing, st: g.st, s: g.s, time: g.t, key: code }; }
  if (QS.has('side')) {   // test a menu: ?wbtest=tr-main&side=sd-coban
    await loadScript('../js/salads.js').catch(() => { });
    const sc = QS.get('side'), r = (G('typeof SALADS !== "undefined" ? SALADS : []')).concat(G('RECIPES')).find(x => x.id === sc), g = G('SIG')[sc];
    SRC.side = r ? { name: r.name.tr, ing: r.ing.tr, st: r.st.tr, s: r.s, time: r.t, key: sc } : { name: sc, ing: g.ing, st: g.st, s: g.s, time: g.t, key: sc };
  }
} else if (QS.has('wb')) {
  try { SRC = (window.parent !== window && window.parent.WB_LAB_RECIPE) || null; } catch (e) { }
  if (SRC) { try { localStorage.setItem('lab_wb_recipe', JSON.stringify(SRC)); } catch (e) { } }
  else { try { SRC = JSON.parse(localStorage.getItem('lab_wb_recipe') || 'null'); } catch (e) { } }
}
const GEN_MODE = !!SRC;
const R = GEN_MODE ? (SRC.side ? buildMenu(SRC, SRC.side, { applySnap, playStep, bgResume }) : buildGeneric(SRC, { applySnap, playStep })) : RECIPES[QS.get('r') || 'etsote'];
const MENU = !!R.menu;
if (REAL) K.burner.position.y = -0.03;
const pan = F.makeSautePan(); pan.position.set(K.cook.position.x, REAL ? 0.032 : 0.044, K.cook.position.z); pan.rotation.y = 0.85; scene.add(pan);
const lid = F.makeLid(); scene.add(lid);
const onion = F.wholeOnion(), pepper = F.wholePepper(), tomato = F.wholeTomato(), garlic = F.wholeGarlic(), parsley = F.parsleyBunch();
const oil = F.oilBottle(), paste = F.pasteJar(), salt = F.spiceBowl(0xffffff), black = F.spiceBowl(0x2a2420), water = F.waterGlass();
const spoon = F.woodenSpoon(), plate = F.servingPlate();
[onion, pepper, tomato, garlic, parsley, oil, paste, salt, black, water, spoon, plate].forEach(o => scene.add(o));

// piece sets: on the board (chopped), in the bowl (raw meat), in the pan, on the plate, in flight
const P = {};
const boardRegion = { onion: [-0.11, 0.06], pepper: [0.0, 0.06], tomato: [0.1, 0.05], garlic: [0.1, -0.06], parsley: [-0.12, -0.07] };
const NUM = { meat: 26, mince: 40, chicken: 22, fish: 10, shrimp: 20, onion: 40, pepper: 22, garlic: 14, tomato: 22, parsley: 70, potato: 24, carrot: 26, eggplant: 22, zucchini: 22, mushroom: 22, greens: 40, cucumber: 22, corn: 50, legume: 90, pasta: 50, cheese: 24, egg: 24, lemon: 8, fruit: 24, nuts: 30, bread: 16, veg: 24, dough: 6,
  sausage: 26, liver: 20, duck: 20, squid: 24, mussel: 18, crab: 14, salmon: 12, tuna: 12, leek: 34, tuber: 24, banana: 24, beet: 24, radish: 22, celery: 26, okra: 30, broccoli: 22, cauliflower: 22, greenbean: 30, peas: 80, avocado: 20, olive: 20, ginger: 20, pickle: 18, citrus: 10, berry: 40, raisin: 40, kiwi: 10, chocolate: 24, biscuit: 12, bayleaf: 4,
  // grains: hundreds of real grains, not a handful
  rice: 650, bulgur: 750, couscous: 900, oats: 320, lentil: 420 };
const COUNTS = {};
(GEN_MODE ? R.types : ['meat', 'onion', 'pepper', 'garlic', 'tomato', 'parsley']).forEach(t => { if (F.PIECE[t]) COUNTS[t] = NUM[t] || 20; });
// mixing bowl (generic recipes) with a mound for batters / doughs / liquids
const bowl = new THREE.Group(); bowl.add(M.makeBowl()); bowl.scale.setScalar(0.85);
const mound = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xf2e2bd, roughness: 0.6, clearcoat: 0.3 }));
mound.position.y = 0.02; mound.scale.y = 0.4; mound.visible = false; bowl.add(mound); bowl.userData.mound = mound;
bowl.visible = GEN_MODE; scene.add(bowl);
for (const [t, n] of Object.entries(COUNTS)) {
  P[t] = { board: new F.Pieces(t, n, K.board), pan: new F.Pieces(t, n, pan), plate: new F.Pieces(t, n, plate), fly: new F.Pieces(t, n, scene), bowl: new F.Pieces(t, n, bowl), stage: new F.Pieces(t, n, K.meatBowl) };
}
if (P.meat) P.meat.bowl0 = P.meat.stage;
// oven for recipes that bake
let oven = null;
if (GEN_MODE && R.plan.steps.some(st => st.ops.some(o => o.op === 'bake'))) { oven = M.makeOven(); oven.scale.setScalar(REAL ? 0.8 : 1); scene.add(oven); }

// ---- menu: the side dish gets its own (wooden) salad bowl, a small pan on the back burner, its own pieces ----
const PB = {}, wholesB = {};
let bowl2 = null, pan2 = null, lid2 = null, flame2 = null;
const KB = Object.create(K); KB.fire = 0; KB.setFire = v => { KB.fire = v; }; KB.knobs = [K.knobs[1] || K.knobs[0]];
if (MENU) {
  const wm = M.MAT.wood.clone(); wm.side = THREE.DoubleSide; wm.color = new THREE.Color(0xb07a48);
  bowl2 = new THREE.Group(); bowl2.add(M.makeBowl(wm, wm)); bowl2.scale.setScalar(REAL ? 0.62 : 0.7);
  const m2 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xf2e2bd, roughness: 0.6, clearcoat: 0.3 }));
  m2.position.y = 0.02; m2.scale.y = 0.4; m2.visible = false; bowl2.add(m2); bowl2.userData.mound = m2; scene.add(bowl2);
  const needPan = R.planB.steps.some(st => st.ops.some(o => o.op === 'fire' || o.op === 'oil' || (o.op === 'cook') || o.vessel === 'pan'));
  pan2 = F.makeSautePan(); pan2.scale.setScalar(0.66); pan2.visible = needPan; scene.add(pan2);
  lid2 = F.makeLid(); lid2.scale.setScalar(0.66); lid2.visible = needPan; scene.add(lid2);
  for (const t of R.typesB) if (F.PIECE[t]) { const n = Math.round((NUM[t] || 20) * (GRAIN.has(t) ? 0.6 : 1)); PB[t] = { board: new F.Pieces(t, n, K.board), pan: new F.Pieces(t, n, pan2), plate: new F.Pieces(t, n, bowl2), fly: new F.Pieces(t, n, scene), bowl: new F.Pieces(t, n, bowl2), stage: new F.Pieces(t, n, K.meatBowl) }; }
  flame2 = new THREE.Group(); pan2.add(flame2);
  const fm = new THREE.MeshBasicMaterial({ color: 0x5a8cff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, f = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.03, 6), fm); f.position.set(Math.cos(a) * 0.085, -0.03, Math.sin(a) * 0.085); f.userData.a = a; flame2.add(f); }
  flame2.visible = false;
}
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
if (REAL) {
  const R2 = { onion: [-0.34, 0.012, -0.8], pepper: [-0.44, 0.012, -0.7, 0.5], tomato: [-0.27, 0.012, -0.72], garlic: [-0.42, 0.012, -0.88], parsley: [-0.3, 0.012, -0.92, 0.4],
    oil: [-0.52, 0, -0.08], paste: [-0.44, 0, -0.2], salt: [-0.52, 0, -0.3], black: [-0.6, 0, -0.24], water: [-0.62, 0, -0.08], spoon: [-0.24, 0.01, -0.16, 0.6], lid: [0.62, 0.075, 0.02, 0.08],
    board: [-0.33, 0, -0.42, -Math.PI / 2], meatBowl: [-0.09, 0, -0.1], plate: [-0.34, 0, -0.45] };
  const objs = { onion, pepper, tomato, garlic, parsley, oil, paste, salt, black, water, spoon, lid, board: K.board, meatBowl: K.meatBowl, plate };
  for (const [k, v] of Object.entries(R2)) { const o = objs[k]; const h = HOME.get(o); h.p.set(v[0], v[1], v[2]); if (v[3] !== undefined) h.r.set(k === 'lid' ? v[3] : 0, k === 'lid' ? 0 : v[3], 0); }
  HOME.get(K.knife).p.set(-0.3, K.boardTop + 0.002, -0.32); HOME.get(K.knife).r.set(-Math.PI / 2, 0, -Math.PI / 2 + 0.3);
  K.vegPlate.position.set(-0.35, 0, -0.8);
}
// ---- generic recipe layout: whole ingredients, bowl, oven ----
const wholes = {};
if (GEN_MODE) {
  const named = { onion, pepper, tomato, garlic, parsley };
  for (const [k, o] of Object.entries(named)) if (!COUNTS[k]) { HOME.delete(o); o.visible = false; }
  const chopTypes = R.plan.steps.flatMap(st => st.ops.filter(o => o.op === 'chop').map(o => o.type));
  if (COUNTS.parsley && !chopTypes.includes('parsley')) chopTypes.push('parsley');
  const spots = REAL ? (oven ? [[-0.58, -0.62], [-0.58, -0.5], [-0.58, -0.74], [-0.5, -0.58], [-0.5, -0.7]] : [[-0.36, -0.82], [-0.46, -0.9], [-0.28, -0.92], [-0.48, -0.76], [-0.38, -1.0], [-0.56, -0.86]])
                     : [[-0.68, -0.28], [-0.78, -0.2], [-0.6, -0.18], [-0.82, -0.34], [-0.7, -0.4], [-0.9, -0.24]];
  [...new Set(chopTypes)].forEach((t, i) => {
    const o = named[t] || F.wholeGeneric(t); if (!named[t]) scene.add(o);
    wholes[t] = o; const [x, z] = spots[i % spots.length]; home(o, [x, 0.012, z], [0, i * 0.7, 0]); o.visible = true;
  });
  K.vegPlate.visible = !REAL || !oven; if (REAL && oven) K.vegPlate.position.set(9, 9, 9);
  if (!REAL) K.vegPlate.position.set(-0.74, 0, -0.3);
  home(bowl, REAL ? [-0.12, 0, -0.1] : [-0.58, 0, 0.12]);
  if (REAL) { HOME.get(K.meatBowl).p.set(-0.32, 0, -0.03); HOME.get(oil).p.set(-0.21, 0, -0.04); HOME.get(water).p.set(-0.62, 0, -0.1); }
  else { HOME.get(K.meatBowl).p.set(0.02, 0, 0.2); }
  if (oven) { if (REAL) { oven.position.set(-0.47, 0, -0.86); oven.rotation.y = Math.PI / 2; } else { oven.position.set(0.98, 0, -0.18); oven.rotation.y = -0.6; } }
}
if (MENU) {
  home(bowl2, REAL ? [-0.15, 0, -0.88] : [-0.36, 0, 0.16]);
  home(pan2, REAL ? [0.58, 0.032, -0.13] : [0.62, 0.044, -0.18], [0, 0.85, 0]);
  home(lid2, REAL ? [0.74, 0.05, 0.18, 0] : [0.85, 0.05, 0.05], [0.08, 0, 0.1]);
  if (REAL) HOME.get(lid).p.set(0.66, 0.075, 0.2);
  const used = new Set(Object.keys(wholes));
  const chopB = [...new Set(R.planB.steps.flatMap(st => st.ops.filter(o => o.op === 'chop').map(o => o.type)))];
  const spotsB = REAL ? [[-0.2, -1.1], [-0.1, -1.12], [-0.16, -1.22], [-0.08, -1.24], [-0.22, -1.32]] : [[-0.5, 0.3], [-0.6, 0.26], [-0.42, 0.34], [-0.66, 0.36]];
  chopB.forEach((t, i) => { const o = F.wholeGeneric(t); scene.add(o); wholesB[t] = o; const [x, z] = spotsB[i % spotsB.length]; home(o, [x, 0.012, z], [0, i * 0.9, 0]); });
  STATION.bowl2 = REAL ? { p: V(0.15, 0, -0.92), r: -1.57 } : { p: V(-0.3, 0, -0.3), r: -0.4 };
  STATION.stove2 = REAL ? { p: V(0.46, 0, -0.52), r: 0.15 } : { p: V(0.4, 0, -0.56), r: 0.3 };
}
const plateSpot = () => REAL ? V(-0.14, 0, -0.16) : V(-0.04, 0, -0.08);
function resetScene() {
  FOLLOW.clear();
  for (const [o, h] of HOME) { scene.attach(o); o.position.copy(h.p); o.rotation.copy(h.r); o.visible = true; o.scale.setScalar(1); }
  [onion, pepper, tomato, garlic].forEach(o => o.scale.set(1, 1, 1));
  water.userData.water.scale.y = 1; water.userData.water.position.y = 0.045;
  plate.visible = false; lid.visible = true;
  for (const t in P) for (const k in P[t]) { const ps = P[t][k]; ps.count = 0; ps.done = 0; ps.sauce = 0; ps.shrink = 0; ps.grow = 0; }
  if (!GEN_MODE && P.meat) { P.meat.stage.count = COUNTS.meat; }
  for (const t in P) P[t].stage.scatter(0.055, 0.012, 0.03);
  for (const t in P) P[t].bowl.scatter(0.1, 0.03, 0.02);
  for (const t in P) { P[t].pan.scatter(F.PAN.rb - 0.02, 0.012, 0.006); P[t].plate.scatter(0.07, 0.012, 0.012); const [bx, bz] = boardRegion[t] || [0, 0]; P[t].board.items.forEach(it => { it.p.set(bx + rand(-0.035, 0.035), K.boardTop + 0.004, bz + rand(-0.03, 0.03)); }); }
  // grains lie as a real layer / mound, not as a few loose pieces
  for (const t in P) if (GRAIN.has(t)) {
    const G = P[t];
    G.stage.scatter(0.05, 0.012, 0.035); G.bowl.scatter(0.085, 0.022, 0.03); G.pan.scatter(F.PAN.rb - 0.008, 0.009, 0.016);
    G.plate.items.forEach(it => { it.rad = Math.sqrt(Math.random()) * 0.075; it.a = rand(0, 6.28); it.p.set(Math.cos(it.a) * it.rad, 0.01 + (1 - it.rad / 0.075) * 0.032 * Math.random() + 0.004, Math.sin(it.a) * it.rad); });
  }
  if (P.parsley) { P.parsley.pan.scatter(F.PAN.rb - 0.02, 0.03, 0.01); P.parsley.plate.scatter(0.075, 0.04, 0.012); }
  for (const t in PB) for (const k in PB[t]) { const ps = PB[t][k]; ps.count = 0; ps.done = 0; ps.sauce = 0; ps.shrink = 0; ps.grow = 0; }
  for (const t in PB) { const G = PB[t]; G.stage.scatter(0.055, 0.012, 0.03); G.bowl.scatter(0.1, 0.03, 0.02); G.plate.scatter(0.1, 0.03, 0.02); G.pan.scatter(F.PAN.rb - 0.02, 0.012, 0.006); const [bx, bz] = boardRegion[t] || [0, 0]; G.board.items.forEach(it => it.p.set(bx + rand(-0.035, 0.035), K.boardTop + 0.004, bz + rand(-0.03, 0.03))); }
  if (bowl2) { bowl2.userData.mound.visible = false; pan2.userData.setLiquid(0, 0xc0502a, 0); pan2.userData.oil.material.opacity = 0; }
  KB.fire = 0; PIPT = null;
  K.setFire(0); K.knobs.forEach(k => k.rotation.z = 0);
  pan.userData.oil.material.opacity = 0; pan.userData.setLiquid(0, 0xc0502a, 0); panLevel = 0;
  oilStream.hide(); waterStream.hide();
  ['sizzle', 'boil', 'steam'].forEach(l => setLoop(l, 0));
  ch.root.rotation.y = STATION.stove.r; ch.root.position.copy(STATION.stove.p); ch.rest(100);
  if (guest) { guest.rest(100); guest.look(null); guest.mood = 'happy'; guest.speaking = false; }
  if (FORK) FORK.visible = false; ch.look(null); ch.mood = 'happy'; ch.arms.R.roll = ch.arms.L.roll = 0;
  ST.stir = 0; ST.heat = 0; ST.boil = 0; ST.steam = 0; ST.lastHeat = 0; ST.quiet = false;
}
const ST = { stir: 0, heat: 0, boil: 0, steam: 0, stirA: 0, boostAt: -99, lastHeat: 0, quiet: false };

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
if (REAL) Object.assign(SHOT, {
  front: { p: [0.64, 0.66, 0.3], t: [0.22, 0.38, -0.5], h: 70 },
  face: { p: [0.4, 0.7, 0.15], t: [0.2, 0.62, -0.5], h: 40 },
  board: { p: [-0.85, 0.8, -0.38], t: [-0.2, 0.2, -0.44], h: 62 },
  pan: { p: [0.33, 0.52, 0.22], t: [0.33, 0.035, -0.12], h: 54 },
  stove: { p: [0.7, 0.56, 0.3], t: [0.24, 0.16, -0.26], h: 62 },
  plate: { p: [-0.75, 0.62, -0.4], t: [-0.3, 0.03, -0.45], h: 52 },
  wide: { p: [-1.45, 0.76, -2.2], t: [0.35, 0.1, -0.3], h: 52 },
  serve: { p: [0.2, 0.78, 0.3], t: [0.08, 0.02, -0.16], h: 62 },
  bowl: { p: [0.22, 0.72, 0.22], t: [-0.12, 0.05, -0.12], h: 58 },
  oven: { p: [-0.05, 0.6, -0.35], t: [-0.42, 0.12, -0.86], h: 58 },
  table: TABLE ? { p: [TABLE.spot.x - 1.05, TABLE.spot.y + 0.62, TABLE.spot.z + 1.45], t: [TABLE.seat.x - 0.12, TABLE.spot.y + 0.3, TABLE.seat.z - 0.2], h: 60 } : { p: [0, 0.5, 1], t: [0, 0, 0], h: 50 },
});
if (!REAL) Object.assign(SHOT, { wide: { p: [0.0, 0.95, 2.0], t: [0, 0.2, -0.4], h: 62 }, serve: { p: [0.1, 0.6, 0.55], t: [0.1, 0.03, -0.1], h: 54 }, bowl: { p: [-0.58, 0.62, 0.55], t: [-0.58, 0.03, 0.1], h: 46 }, oven: { p: [0.75, 0.45, 0.6], t: [0.98, 0.15, -0.18], h: 50 } });
if (MENU) Object.assign(SHOT, REAL ? {
  bowl2: { p: [-0.18, 0.72, -0.42], t: [-0.14, 0.04, -0.9], h: 56 },
  pan2: { p: [0.58, 0.5, 0.16], t: [0.58, 0.03, -0.14], h: 50 },
  stove2: { p: [0.85, 0.56, 0.32], t: [0.5, 0.16, -0.26], h: 60 },
} : { bowl2: { p: [-0.36, 0.6, 0.6], t: [-0.36, 0.03, 0.16], h: 46 }, pan2: { p: [0.62, 0.6, 0.3], t: [0.62, 0.04, -0.18], h: 42 }, stove2: { p: [0.62, 0.42, 0.62], t: [0.55, 0.06, -0.16], h: 50 } });
let view = 'front', shotAge = 0;
// corner window: normally the chef's face; during the side dish it watches the main dish cooking on its timer
let PIPT = null;
function shot(name, dur = 1.2) {
  const s = SHOT[name]; view = name; shotAge = 0;
  const p0 = cam.p.clone(), t0 = cam.t.clone(), h0 = cam.h, p1 = V(...s.p), t1 = V(...s.t);
  $('pip').classList.toggle('hide', !PIPT && !['board', 'pan', 'stove', 'plate', 'wide', 'serve', 'bowl', 'oven', 'bowl2', 'pan2', 'stove2'].includes(name));
  return T(dur, k => { cam.p.lerpVectors(p0, p1, k); cam.t.lerpVectors(t0, t1, k); cam.h = lerp(h0, s.h, k); });
}
function setShot(name) { const s = SHOT[name]; view = name; cam.p.set(...s.p); cam.t.set(...s.t); cam.h = s.h; }
const camDir = V(), look = V();
function applyCamera(time) {
  const aspect = innerWidth / innerHeight;
  if (REAL) {
    // fixed real room: no dolly (walls!), cam.h is the vertical field of view
    camera.fov = cam.h * (aspect > 1 ? 0.7 : 1); camera.aspect = aspect; camera.updateProjectionMatrix();
    const a = 0.002, sx = Math.sin(time * 0.7) * a, sy = Math.sin(time * 0.53 + 1) * a * 0.7;
    shotAge += 1 / 60; const push = Math.min(0.07, shotAge * 0.006);
    camera.position.set(cam.p.x + (cam.t.x - cam.p.x) * push + sx, cam.p.y + (cam.t.y - cam.p.y) * push + sy, cam.p.z + (cam.t.z - cam.p.z) * push); look.set(cam.t.x, cam.t.y, cam.t.z); camera.lookAt(look);
    renderer.localClippingEnabled = view !== 'wide';
    ch.head.getWorldPosition(look);
    const f = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ch.root.rotation.y);
    pipCam.position.copy(look).addScaledVector(f, 0.75).add(new THREE.Vector3(0, 0.02, 0)); pipCam.lookAt(look.x, look.y - 0.08, look.z);
    pipWatchFrame();
    return;
  }
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
  pipWatchFrame();
}
function pipWatchFrame() {
  if (!PIPT) { if ($('pipName').dataset.w) { $('pipName').dataset.w = ''; $('pipName').textContent = CHEF.name; } return; }
  PIPT.obj.getWorldPosition(look);
  pipCam.position.set(look.x + 0.02, look.y + 0.42, look.z + 0.3); pipCam.lookAt(look.x, look.y + 0.02, look.z);
  const left = PIPT.t ? Math.max(0, timeLeft(PIPT.t)) : 0;
  $('pipName').dataset.w = '1'; $('pipName').textContent = `${PIPT.label} · ${PIPT.t && !PIPT.t.fired ? fmt(left) : 'hazır ✓'}`;
  $('pip').classList.remove('hide');
}

// ---------------- generation-safe animation helpers ----------------
let GEN = 0; const ABORT = new Error('abort');
addEventListener('unhandledrejection', e => { if (e.reason === ABORT) e.preventDefault(); });
function T(d, fn, e) { const g = GEN; return tween(d, (k, r) => { if (g === GEN) fn(k, r); }, e).then(() => { if (g !== GEN) throw ABORT; }); }
const W = s => T(s, () => { });
const hooks = new Set();
function H(fn) { const g = GEN; const h = (dt, t) => { if (g !== GEN) { hooks.delete(h); return; } fn(dt, t); }; hooks.add(h); return () => hooks.delete(h); }
const both = (...p) => Promise.all(p);
function moveTo(o, to, d = 0.8, e = ease.inOut, arc = 0) { const p0 = o.position.clone(); return T(d, k => { o.position.lerpVectors(p0, to, k); if (arc) o.position.y += Math.sin(k * Math.PI) * arc; }, e); }

async function station(name, d = 1.0) {
  const st = STATION[name]; const p0 = ch.root.position.clone(), r0 = ch.root.rotation.y;
  if (p0.distanceTo(st.p) < 0.01 && Math.abs(r0 - st.r) < 0.01) return;
  await T(d, k => { ch.root.position.lerpVectors(p0, st.p, k); ch.root.rotation.y = lerp(r0, st.r, k); }, ease.inOut);
}
// attach a prop to a hand grip with a local offset
// a held prop keeps its own (world) orientation and follows the hand; gp = grip point in the prop's model space
const FOLLOW = new Map();
let FORK = null;
function hold(o, side, gp = [0, 0, 0], rot = [0, 0, 0]) {
  scene.attach(o); o.rotation.set(...rot);
  FOLLOW.set(o, { side, gp: V(...gp) }); ch.setGrip && ch.setGrip(side, 0.95);
}
function drop(o) { const f = FOLLOW.get(o); if (f && ch.setGrip) ch.setGrip(f.side, 0.25); FOLLOW.delete(o); const h = HOME.get(o); scene.attach(o); if (h) { o.position.copy(h.p); o.rotation.copy(h.r); } }
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
  const hey = { leyla: 'Kuzum', zeynep: 'Canım', aylin: 'Arkadaşlar', carla: 'Arkadaşlar' }[chefId];
  return s.replace(/\{hey\}/g, hey).replace(/\{name\}/g, CHEF.name);
}
function caption(text, note = '') { $('subName').textContent = CHEF.name; $('subText').textContent = text; $('subNote').textContent = note; }
function say(raw, note = '', who = null) {
  const text = fill(raw); const g = GEN; const sp = who || ch, voice = who ? who.voice : CHEF.voice;
  caption(text, note); if (who) $('subName').textContent = who.name;
  const id = ++speakSeq;
  sp.speaking = true;
  return new Promise((res, rej) => {
    let finished = false;
    const done = () => { if (finished) return; finished = true; sp.speaking = false; if (g !== GEN) rej(ABORT); else setTimeout(() => g === GEN ? res() : rej(ABORT), 250); };
    speakDone = done;
    const est = 900 + text.length * 62;
    if (!audio.muted && A && A.speak) { try { A.speak(text, voice.pitch, voice.rate, String(id)); setTimeout(done, est * 1.35 + 1500); return; } catch (e) { } }
    if (!audio.muted && window.speechSynthesis && !AUTO) {
      try {
        const u = new SpeechSynthesisUtterance(text); u.lang = 'tr-TR'; u.pitch = voice.pitch; u.rate = voice.rate;
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
  let t = timers.find(t => t.step === stepIdx && t.r === R.id && !t.dismissed);
  if (t) return t;
  t = { id: (Date.now() % 1e8) + stepIdx, step: stepIdx, r: R.id, label, total: min * 60e3, end: now() + min * 60e3, fired: false };
  timers.push(t); saveTimers();
  schedule(t);
  drawTimers();
  return t;
}
const timerFrac = t => t ? clamp(1 - timeLeft(t) / t.total) : 1;
const timeLeft = t => t.paused != null ? t.paused : t.end - now();
let alarmsOff = false; try { alarmsOff = localStorage.getItem('lab_alarmsOff') === '1'; } catch (e) { }
function schedule(t) {
  if (!A || !A.scheduleAlarm) return;
  try { A.cancelAlarm(t.id); } catch (e) { }
  if (alarmsOff || t.paused != null || t.fired || t.dismissed) return;
  try { A.scheduleAlarm(t.id, t.end, '⏰ ' + R.title + ': süre doldu', t.label + ' hazır! Sonraki adıma geçebilirsin.'); } catch (e) { }
}
function timerAction(id, act) {
  const t = timers.find(t => t.id === id); if (!t) return;
  if (act === 'pause') { if (t.paused == null) t.paused = Math.max(0, t.end - now()); else { t.end = now() + t.paused; t.paused = null; } }
  if (act === 'ff') { if (t.paused != null) t.paused = Math.max(0, t.paused - 60e3); else t.end -= 60e3; }
  if (act === 'end') { t.paused = null; t.end = now(); }
  if (act === 'cancel') { t.dismissed = true; t.fired = true; if (alarmOn === t) stopAlarm(); }
  if (act === 'stop') { stopAlarm(); t.dismissed = true; }
  saveTimers(); schedule(t); drawTimers(true); sfx.tap();
}
function fmt(ms) { ms = Math.max(0, ms); const s = Math.ceil(ms / 1000), m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; }
// chips are created once and only their text/ring is updated (no flicker, buttons stay clickable)
function drawTimers(rebuild) {
  const box = $('timers');
  const list = timers.filter(t => !t.dismissed);
  const key = list.map(t => t.id + (t.fired ? 'f' : '') + (t.paused != null ? 'p' : '')).join(',');
  if (rebuild || box.dataset.key !== key) {
    box.dataset.key = key;
    box.innerHTML = list.map(t => t.fired
      ? `<div class="tchip done" data-id="${t.id}"><span>⏰ ${t.label}</span><button data-a="stop" class="big">Durdur</button></div>`
      : `<div class="tchip" data-id="${t.id}"><div class="ring"></div><span>${t.label}</span><b></b>
          <button data-a="pause" title="Duraklat">${t.paused != null ? '▶' : '⏸'}</button><button data-a="ff" title="1 dk ileri">+1dk</button><button data-a="end" title="Hemen bitir">⏭</button><button data-a="cancel" title="İptal">✕</button></div>`).join('');
  }
  for (const el of box.children) {
    const t = timers.find(x => x.id === +el.dataset.id); if (!t || t.fired) continue;
    el.querySelector('b').textContent = fmt(timeLeft(t)) + (t.paused != null ? ' ⏸' : '');
    el.querySelector('.ring').style.setProperty('--p', timerFrac(t).toFixed(3));
  }
}
$('timers').addEventListener('click', e => {
  const b = e.target.closest('button'); const c = e.target.closest('.tchip'); if (!b || !c) return;
  e.stopPropagation(); timerAction(+c.dataset.id, b.dataset.a);
});
let alarmOn = null, vibT = null;
function fireTimer(t, silent) {
  t.fired = true; saveTimers();
  if (A && A.cancelAlarm) try { A.cancelAlarm(t.id); } catch (e) { }
  drawTimers(true);
  if (silent || alarmsOff) { if (alarmsOff && !silent) toast('⏱ ' + t.label + ' hazır'); return; }
  alarmOn = t; setLoop('alarm', 1);
  $('alarmTxt').textContent = t.label + ' hazır. Sonraki adıma geçebilirsin.';
  $('alarm').classList.remove('hide');
  vib(600); clearInterval(vibT); vibT = setInterval(() => vib(600), 1500);
  if (AUTO) setTimeout(stopAlarm, 1500);
}
function stopAlarm() {
  setLoop('alarm', 0); clearInterval(vibT); $('alarm').classList.add('hide');
  if (!alarmOn) return;
  alarmOn.dismissed = true; saveTimers(); alarmOn = null; drawTimers(true);
  if (stepState.waitingTimer) { say('Süre doldu! Hazırsan sonraki adıma geçelim.').catch(() => { }); }
}
function setAlarmsOff(v) {
  alarmsOff = v; try { localStorage.setItem('lab_alarmsOff', v ? '1' : '0'); } catch (e) { }
  $('bBell').textContent = v ? '🔕' : '🔔'; timers.forEach(schedule);
  if (v) stopAlarm(); toast(v ? '🔕 Alarmlar kapalı (sayaçlar çalışır)' : '🔔 Alarmlar açık');
}
$('bAlarmStop').onclick = stopAlarm;
$('bAlarmOff').onclick = () => { setAlarmsOff(true); };
$('bBell').onclick = () => setAlarmsOff(!alarmsOff);
$('bBell').textContent = alarmsOff ? '🔕' : '🔔';
let lastTimerDraw = 0;
function tickTimers(dt) {
  simNow += dt * 1000 * FF - dt * 1000; // extra sim time in test mode
  simNow = Math.max(simNow, Date.now());
  for (const t of timers) if (!t.fired && t.paused == null && now() >= t.end) fireTimer(t, document.hidden);
  if (performance.now() - lastTimerDraw > 250) { lastTimerDraw = performance.now(); drawTimers(); }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) { simNow = Date.now(); for (const t of timers) if (!t.fired && t.paused == null && now() >= t.end) fireTimer(t, true); } });
window.LAB_ALARM_FIRED = () => { };

// ---------------- UI ----------------
let toastT;
function toast(s) { const t = $('toast'); t.textContent = s; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1600); }
$('bSound').onclick = () => { setMuted(!audio.muted); $('bSound').textContent = audio.muted ? '🔇' : '🔊'; if (audio.muted) stopSpeech(); };
$('bExit').onclick = () => goHome();
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
    i, say, W, T, H, shot, guest, scene, GHOST, ghostFinale, bowl, oven, wholes, plateSpot, quiet: v => { ST.quiet = v; }, fork: () => FORK || (FORK = (() => { const f = M.makeFork(); scene.add(f); return f; })()), moveTo, both, hold, drop, grab, isHeld, release: o => { const f = FOLLOW.get(o); if (f && ch.setGrip) ch.setGrip(f.side, 0.25); FOLLOW.delete(o); }, TABLE, reachTo, wp, ch, K, P, pan, lid, plate, spoon, oil, paste, salt, black, water, onion, pepper, tomato, garlic, parsley,
    ST, sfx, setLoop, vib, REAL, station, MENU, HOMEOF: o => HOME.get(o), curStep: () => cur, timerOf: j => timers.find(t => t.step === j && t.r === R.id), pipWatch: (obj, label, t) => { PIPT = obj ? { obj, label, t } : null; }, timerFracOf: t => timerFrac(t),
    side() { return sideCtx(this); }, boardHome: () => HOME.get(K.board), startTimer: (min, label) => startTimer(i, min, label), timerFrac, stepState, oilStream, waterStream,
    saltP, pepP, steamP, spitP, setPanLevel: v => panLevel = v, F, M, V, rand, ease, lerp, clamp, chefId,
    waitTimer: async (t, onP, lines = []) => {
      stepState.waitingTimer = true; let said = 0, dirT = 0, dirI = 0;
      while (true) {
        if (REAL && (dirT += 0.1) > 7 && !ch.speaking) { dirT = 0; shot(['wide', 'front', 'pan'][dirI++ % 3], 1.4).catch(() => { }); }
        const k = timerFrac(t); onP(k);
        if (said < lines.length && k >= lines[said][0]) { const l = lines[said++][1]; say(l).catch(() => { }); }
        if (t.fired || k >= 1) break;
        await W(0.1);
      }
      onP(1); stepState.waitingTimer = false;
    },
  };
}
// the side dish runs on its own bowl / pan / pieces / burner, everything else is shared
const BMAP = { bowl: 'bowl2', pan: 'pan2', stove: 'stove2' };
function sideCtx(c) {
  const b = Object.create(c);
  return Object.assign(b, {
    P: PB, pan: pan2, bowl: bowl2, lid: lid2, wholes: wholesB, K: KB, plate: bowl2, ST: { stir: 0 }, setPanLevel: () => { }, isSide: true,
    shot: (n, d) => shot(BMAP[n] || n, d), station: (n, d) => station(BMAP[n] || n, d),
  });
}
async function go(i, replay = false) {
  i = clamp(i, 0, R.steps.length - 1);
  GEN++; const g = GEN; stopSpeech(); cur = i; setUI(i); stepState.waitingTimer = false;
  resetScene();
  saveProgress(i);
  if (GHOST && !ghostSaid && i === Math.floor(R.steps.length / 2)) { ghostSaid = true; setTimeout(() => { if (cur === i) ghostFinale(); }, AUTO ? 3000 : 9000); }
  for (let j = 0; j < i; j++) R.steps[j].apply(ctx(j));
  P_sync();
  try {
    await R.steps[i].play(ctx(i));
    if (g === GEN) { $('bNext').classList.add('pulse'); if (AUTO) setTimeout(() => g === GEN && next(), 600); }
  } catch (e) { if (e !== ABORT) { console.error(e); toast('⚠️ ' + (e.message || e)); } }
}
function next() {
  sfx.tap();
  if (cur >= R.steps.length - 1) { if (AUTO) return; clearProgress(); goHome(); return; }
  go(cur + 1);
}
function prev() { sfx.tap(); if (cur > 0) go(cur - 1); }
function repeat() { sfx.tap(); go(cur); }
function P_sync() { for (const t in P) for (const k in P[t]) P[t][k].sync(); for (const t in PB) for (const k in PB[t]) PB[t][k].sync(); }

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
  if (ST.heat > ST.lastHeat + 0.15) ST.boostAt = time;
  ST.lastHeat = ST.heat;
  const boost = 0.18 + 0.82 * clamp(1 - (time - ST.boostAt) / 3);
  const mute = ST.quiet ? 0 : 1;
  setLoop('sizzle', ST.heat * boost * mute); setLoop('boil', ST.boil * 0.5 * mute); setLoop('steam', ST.steam * 0.4 * mute);
  // oil shimmer
  const om = pan.userData.oil.material; if (om.bumpMap) om.bumpMap.offset.set(Math.sin(time * 0.7) * 0.05, time * 0.03);
  const lm = pan.userData.liquid.material; if (lm.bumpMap) { lm.bumpMap.rotation = time * 0.2 * (ST.boil + ST.stir); lm.bumpMap.offset.y = time * 0.05 * ST.boil; }
}

// ---------------- ghost (separate edition) ----------------
let ghost = null, ghostBusy = false, ghostNext = 18, ghostSaid = false;
if (GHOST) {
  const tex = new THREE.TextureLoader().load('models/ghost.png'); tex.colorSpace = THREE.SRGBColorSpace;
  ghost = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
  ghost.renderOrder = 50; ghost.visible = false; scene.add(ghost);
  const bub = document.createElement('div'); bub.id = 'ghostBub';
  bub.style.cssText = 'position:fixed;z-index:20;pointer-events:none;background:#fff;color:#222;font:800 17px system-ui;padding:8px 14px;border-radius:18px;box-shadow:0 6px 24px rgba(120,160,255,.6);opacity:0;transition:opacity .25s;transform:translate(-50%,-100%);white-space:nowrap';
  document.body.appendChild(bub);
}
const _gv = new THREE.Vector3();
function ghostAt(x, y, d, s, op, wob = 0) {
  // position in front of the active camera (camera space → world)
  _gv.set(x, y, -d).applyMatrix4(camera.matrixWorld); ghost.position.copy(_gv);
  ghost.scale.set(s * 0.78, s, 1); ghost.material.opacity = op; ghost.material.rotation = wob; ghost.visible = op > 0.01;
}
function ghostBubble(text, on) {
  const b = document.getElementById('ghostBub'); if (!b) return;
  if (text) b.textContent = text; b.style.opacity = on ? 1 : 0;
  if (on) { const p = ghost.position.clone().project(camera); b.style.left = ((p.x + 1) / 2 * innerWidth) + 'px'; b.style.top = ((1 - p.y) / 2 * innerHeight - innerHeight * 0.13) + 'px'; }
}
async function ghostFly() {
  if (!ghost || ghostBusy) return; ghostBusy = true;
  const dir = Math.random() < 0.5 ? 1 : -1, y0 = rand(-0.05, 0.12), d = rand(1.0, 1.4);
  let laughed = false;
  await tween(5.0, (k) => {
    const hw = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect * d + 0.12;
    const x = dir * (-1 + k * 2) * hw, y = y0 + Math.sin(k * Math.PI * 3) * 0.06;
    const op = Math.min(1, k * 6, (1 - k) * 6) * 0.92;
    ghostAt(x, y, d, 0.42 * d * 0.7, op, Math.sin(k * 12) * 0.12 * dir);
    if (k > 0.3 && !laughed) { laughed = true; sfx.laugh(); vib(40); }
    ghostBubble('Hahahahaha! 👻', k > 0.3 && k < 0.8);
  }, ease.linear);
  ghost.visible = false; ghostBubble('', false);
  ghostBusy = false; ghostNext = rand(25, 50);
}
async function ghostFinale() {
  if (!ghost) return;
  while (ghostBusy) await new Promise(r => setTimeout(r, 200));
  ghostBusy = true;
  await tween(1.4, k => ghostAt(-1.0 + k * 1.0, 0.05 + Math.sin(k * 6) * 0.03, 1.05, 0.33, Math.min(1, k * 3) * 0.92), ease.out);
  sfx.laugh();
  const hold = setInterval(() => { ghostAt(Math.sin(performance.now() / 500) * 0.03, 0.05 + Math.sin(performance.now() / 300) * 0.02, 1.05, 0.33, 0.92); ghostBubble('Nuş olsun, kele! 😄', true); }, 16);
  await new Promise(res => {
    const text = 'Nuş olsun, kele!';
    if (!audio.muted && A && A.speak) { window.LAB_TTS_DONE = ((prev) => id => { if (id === 'ghost') { window.LAB_TTS_DONE = prev; res(); } else prev(id); })(window.LAB_TTS_DONE); try { A.speak(text, 0.75, 1.0, 'ghost'); } catch (e) { res(); } setTimeout(res, 4000); }
    else if (!audio.muted && window.speechSynthesis && !AUTO) { const u = new SpeechSynthesisUtterance(text); u.lang = 'tr-TR'; u.pitch = 0.7; u.onend = res; speechSynthesis.speak(u); setTimeout(res, 4000); }
    else setTimeout(res, 2200);
  });
  await new Promise(r => setTimeout(r, 900));
  clearInterval(hold); ghostBubble('', false);
  await tween(1.2, k => ghostAt(k * 1.3, 0.05 + k * 0.3, 1.05 + k * 0.4, 0.33, (1 - k) * 0.92), ease.in);
  ghost.visible = false; ghostBusy = false; ghostNext = rand(25, 45);
}

// ---------------- render loop ----------------
let last = performance.now(), time = 0;
function frame() {
  requestAnimationFrame(frame);
  const tnow = performance.now(); const dt = Math.min(0.05, (tnow - last) / 1000); last = tnow; time += dt;
  updateTweens(dt * SPD);
  hooks.forEach(h => h(dt, time));
  cookFrame(dt, time);
  if (flame2) { flame2.visible = KB.fire > 0.02; if (flame2.visible) flame2.children.forEach(f => { const q = KB.fire * (0.8 + 0.3 * Math.sin(time * 23 + f.userData.a * 5)); f.scale.set(1, q * 1.4, 1); }); }
  ch.update(dt, time);
  if (guest) guest.update(dt, time);
  followFrame();
  P_sync();
  allP.forEach(p => p.update(dt));
  tickTimers(dt);
  applyCamera(time);
  if (ghost && !ghostBusy && cur >= 0 && !alarmOn && (ghostNext -= dt) <= 0) ghostFly();
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
  back() { if (alarmOn) { stopAlarm(); return true; } goHome(); return true; },
  pause() { stopSpeech(); ['sizzle', 'boil', 'steam'].forEach(l => setLoop(l, 0)); },
  state: () => ({ step: cur, view, timers: timers.map(t => [t.label, Math.round((t.end - now()) / 1000), t.fired]) }),
  plan: () => R.plan, camPos: () => camera.position.toArray().map(v => +v.toFixed(2)),
  go, next, shot: setShot, ch, V, TABLE: () => TABLE, ghostFly, ghostFinale, gstate: () => ghost ? [ghostBusy, ghost.visible, +ghost.material.opacity.toFixed(2), ghost.position.clone().project(camera).toArray().map(v => +v.toFixed(2)), ghost.material.map.image ? ghost.material.map.image.width : 'noimg', ghost.scale.toArray()] : 'none', cam: (p, t, h) => { SHOT.dbg = { p, t, h }; setShot('dbg'); },
};

// ---------------- resume where the user left off ----------------
const PKEY = 'lab_progress';
function saveProgress(i) { try { localStorage.setItem(PKEY, JSON.stringify({ r: R.id, chef: chefId, step: i, ghost: GHOST, at: Date.now() })); } catch (e) { } }
function loadProgress() { try { const p = JSON.parse(localStorage.getItem(PKEY) || 'null'); if (p && p.r === R.id && p.chef === chefId && Date.now() - p.at < 6 * 3600e3 && p.step > 0) return p; } catch (e) { } return null; }
function clearProgress() { try { localStorage.removeItem(PKEY); } catch (e) { } }

// ---------------- start ----------------
$('pipName').textContent = CHEF.name;
if (IN_WB || GEN_MODE) {
  const row = document.createElement('div'); row.className = 'chefrow';
  row.innerHTML = [['carla', '👩🏽‍🍳', 'Carla', 'gerçekçi'], ['leyla', '👵', 'Leyla nənə', ''], ['zeynep', '🧕', 'Zeynep teyze', ''], ['aylin', '👩‍🍳', 'Şef Aylin', '']]
    .map(([id, e, n, sub]) => `<button data-chef="${id}" class="${id === chefId ? 'on' : ''}">${e}<b>${n}</b>${sub ? `<small>${sub}</small>` : ''}</button>`).join('');
  row.onclick = e => { const b = e.target.closest('button'); if (!b || b.dataset.chef === chefId) return; try { localStorage.setItem('labChef', b.dataset.chef); } catch (x) { } const q = new URLSearchParams(location.search); q.set('chef', b.dataset.chef); location.search = q.toString(); };
  $('stIng').after(row);
}
$('stTitle').textContent = R.title;
$('stInfo').textContent = `${CHEF.name} ile · ${R.steps.length} adım · ${R.time}`;
$('stIng').innerHTML = R.ing.map(s => `<li>${s}</li>`).join('');
resetScene(); P_sync(); setShot('front');
caption(fill('Merhaba! Hazır olduğunda “Başlayalım”a dokun.'));
ch.look(V(0, 0.5, 2));
frame();
requestAnimationFrame(() => { $('loading').style.opacity = 0; setTimeout(() => $('loading').remove(), 800); });
const begin = (step) => { unlock(); $('startOv').classList.add('hide'); go(step ?? +(QS.get('step') || 0)); };
const prog = !QS.has('step') && !AUTO ? loadProgress() : null;
if (prog) {
  const live = timers.find(t => t.r === R.id && !t.dismissed);
  const b = document.createElement('button'); b.className = 'primary'; b.id = 'bResume';
  b.innerHTML = `▶ Kaldığın yerden devam et<small style="display:block;font-size:12px;opacity:.85;font-weight:500">Adım ${prog.step + 1}: ${R.steps[prog.step].title}${live ? ' · ⏱ ' + live.label + ' ' + (live.fired ? 'hazır' : fmt(timeLeft(live))) : ''}</small>`;
  $('bStart').before(b); $('bStart').textContent = 'Baştan başla'; $('bStart').className = 'ghostbtn';
  b.onclick = () => begin(prog.step);
  $('bStart').onclick = () => { clearProgress(); begin(0); };
  if (QS.has('resume')) setTimeout(() => begin(prog.step), 300);
}

if (!prog) $('bStart').onclick = () => begin();
if (AUTO) setTimeout(() => begin(), 1500);
