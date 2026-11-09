import * as THREE from 'three';
import { GLTFLoader } from '../lib/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../lib/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from '../lib/RoomEnvironment.js';
import * as M from '../js/models.js';
import * as F from '../chef/food.js';
import { setupHuman } from './human.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const QS = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xdcd6cc);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.6;
scene.add(new THREE.HemisphereLight(0xfff6ec, 0x8a7a68, 0.6));
const key = new THREE.DirectionalLight(0xfff0dc, 2.2); key.position.set(-2.5, 3.2, 2.5); key.target.position.set(1, 0.9, 1.3);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -1, near: 0.5, far: 8 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; scene.add(key, key.target);
const hoodL = new THREE.SpotLight(0xfff1d6, 6, 2, 0.9, 0.6, 1.5); hoodL.position.set(1.32, 1.5, 1.35); hoodL.target.position.set(1.25, 0.9, 1.35); scene.add(hoodL, hoodL.target);
const faceL = new THREE.PointLight(0xffe6cc, 1.2, 3, 1.5); faceL.position.set(1.4, 1.5, 1.0); scene.add(faceL);

M.makeMaterials();
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const tl = new THREE.TextureLoader();
const load = u => new Promise((res, rej) => loader.load(u, res, undefined, rej));
const ltex = (u, srgb) => new Promise(res => tl.load(u, t => { t.flipY = false; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; res(t); }));

const camera = new THREE.PerspectiveCamera(55, 1, 0.02, 40);
const VIEWS = {
  front: { p: [1.62, 1.5, 1.05], t: [0.8, 1.3, 1.36], fov: 74 },
  pan: { p: [1.52, 1.4, 1.36], t: [1.16, 0.93, 1.36], fov: 50 },
  wide: { p: [-0.9, 1.65, 3.1], t: [1.0, 1.0, 1.25], fov: 55 },
};
let view = QS.get('view') || 'front';
document.getElementById('views').onclick = e => { const v = e.target.dataset.v; if (!v) return; view = v; document.querySelectorAll('#views button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); };

let H, pan, spoon;
const P = {};
(async () => {
  const [kit, carla, dif, norm] = await Promise.all([load('models/kitchen.glb'), load('models/carla.glb'), ltex('models/carla_dif.jpg', true), ltex('models/carla_norm.jpg')]);
  const k = kit.scene; k.scale.setScalar(0.1);
  // in the face-on view, cut away the wall cabinets + hood between camera and chef
  const clip = [new THREE.Plane(V(0, -1, 0), 1.42), new THREE.Plane(V(-1, 0, 0), 1.02)];
  k.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => { m.clippingPlanes = clip; m.clipIntersection = true; m.clipShadows = false; }); } });
  window.CLIP = clip;
  scene.add(k);
  H = setupHuman(carla, { dif, norm });
  H.root.position.set(0.8, 0, 1.36); H.root.rotation.y = Math.PI / 2;
  H.jawSign = +(QS.get('jaw') || 1); H.lidSign = +(QS.get('lid') || 1);
  scene.add(H.root);
  // pan with et sote on the front-middle burner
  pan = F.makeSautePan(); pan.position.set(1.2, 0.925, 1.36); pan.rotation.y = Math.PI - 0.5; scene.add(pan);
  pan.userData.setLiquid(0.008, 0x8a2c14, 0.85);
  const counts = { meat: 26, onion: 30, pepper: 18, tomato: 14 };
  for (const [t, n] of Object.entries(counts)) { P[t] = new F.Pieces(t, n, pan); P[t].scatter(F.PAN.rb - 0.02, 0.012, 0.008); P[t].count = n; P[t].sauce = 0.9; P[t].done = 0.9; P[t].sync(); }
  spoon = F.woodenSpoon(); scene.add(spoon);
  document.getElementById('ld').style.opacity = 0; setTimeout(() => document.getElementById('ld').remove(), 700);
  window.ready = true;
})();

let a = 0, last = performance.now(), time = 0;
const look = V();
function frame() {
  requestAnimationFrame(frame);
  const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
  if (H) {
    // stir: right hand circles in the pan, left hand holds the handle
    a += dt * 2.4;
    const c = pan.position;
    H.targets.r = V(c.x - 0.03 + Math.cos(a) * 0.05, c.y + 0.24, c.z + Math.sin(a) * 0.05);
    H.targets.l = pan.localToWorld(V(F.PAN.r + 0.16, 0.06, 0));
    H.grip.r = 0.9; H.grip.l = 0.9;
    H.speaking = (time % 6) < 3.5;
    H.look = H.speaking ? camera.position.clone() : c.clone();
    H.update(dt, time);
    // spoon follows the right hand, pointing down into the pan
    const hp = H.B.hand_r.getWorldPosition(V());
    spoon.rotation.set(Math.PI / 2, 0, 0); spoon.rotateX(-0.25);
    spoon.position.copy(hp).add(V(0.03, -0.05, 0)).add(V(0, -0.08, 0));
    for (const t in P) { const ps = P[t]; for (let i = 0; i < ps.count; i++) { const it = ps.items[i]; it.a += dt * (1.4 - it.rad * 6); it.p.x = Math.cos(it.a) * it.rad; it.p.z = Math.sin(it.a) * it.rad; } ps.sync(); }
  }
  const v = VIEWS[view];
  const aspect = innerWidth / innerHeight;
  camera.aspect = aspect; camera.fov = v.fov; camera.position.set(...v.p);
  camera.lookAt(look.set(...v.t)); camera.updateProjectionMatrix();
  renderer.localClippingEnabled = view === 'front';
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.render(scene, camera);
}
frame();
window.setView = v => view = v;
