// The kitchen set: island with cooktop, back wall with window, shelves, lamps.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../lib/RoundedBoxGeometry.js';
import * as TX from '../js/textures.js';
import { MAT, mesh, smallBowl, makePlate, makeKnife } from '../js/models.js';

const V2 = (x, y) => new THREE.Vector2(x, y);

function cabinetTex() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#6f8f7d'; g.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 4; i++) {
    const x = i * 256;
    g.strokeStyle = 'rgba(20,35,28,.55)'; g.lineWidth = 6; g.strokeRect(x + 8, 10, 240, 236);
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 3; g.strokeRect(x + 30, 32, 196, 192);
    g.strokeStyle = 'rgba(20,35,28,.35)'; g.lineWidth = 3; g.strokeRect(x + 34, 36, 188, 184);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function skyTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#bfe0ff'); gr.addColorStop(0.6, '#fff4dc'); gr.addColorStop(1, '#a9c79a');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(90,140,80,.8)';
  for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(i * 34, 225 - (i % 3) * 12, 40, 30 + (i % 2) * 14, 0, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildKitchen(scene) {
  const K = {};
  const brass = new THREE.MeshStandardMaterial({ color: 0xc8a05a, metalness: 1, roughness: 0.3 });
  const copper = new THREE.MeshStandardMaterial({ color: 0xc8744a, metalness: 1, roughness: 0.28 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1d1c1b, metalness: 0.5, roughness: 0.35 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.6 });

  // ---- island ----
  const top = mesh(new RoundedBoxGeometry(2.6, 0.05, 0.84, 3, 0.012), new THREE.MeshPhysicalMaterial({ map: TX.marble(), roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.15 }), { cast: false });
  top.position.set(0, -0.025, -0.06); scene.add(top);
  const cabMat = new THREE.MeshStandardMaterial({ map: cabinetTex(), roughness: 0.55 });
  cabMat.map.repeat.set(2.5, 1); cabMat.map.wrapS = THREE.RepeatWrapping;
  const cab = mesh(new THREE.BoxGeometry(2.5, 0.86, 0.04), cabMat, { cast: false });
  cab.position.set(0, -0.48, 0.32); scene.add(cab);
  for (let i = -4; i <= 4; i++) {
    const h = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 10), brass);
    h.rotation.z = Math.PI / 2; h.position.set(i * 0.25 + 0.125 * Math.sign(i || 1) * 0, -0.12, 0.35); h.position.x = i * 0.25; scene.add(h);
  }

  // ---- cooktop with a gas burner ----
  const cook = new THREE.Group(); cook.position.set(0.33, 0, -0.08); scene.add(cook);
  const plateTop = mesh(new RoundedBoxGeometry(0.62, 0.01, 0.46, 2, 0.004), new THREE.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.08, clearcoat: 1, metalness: 0.2 }), { cast: false });
  plateTop.position.y = 0.004; cook.add(plateTop);
  const burner = new THREE.Group(); cook.add(burner);
  const cap = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.016, 32), dark); cap.position.y = 0.017; burner.add(cap);
  const ring = mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.012, 40), new THREE.MeshStandardMaterial({ color: 0x8a8a8a, metalness: 1, roughness: 0.4 })); ring.position.y = 0.012; burner.add(ring);
  // cast iron grate
  const grate = new THREE.Group(); burner.add(grate);
  const gr = mesh(new THREE.TorusGeometry(0.15, 0.006, 8, 48), dark); gr.rotation.x = Math.PI / 2; gr.position.y = 0.035; grate.add(gr);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, b = mesh(new THREE.BoxGeometry(0.012, 0.012, 0.11), dark);
    b.position.set(Math.sin(a) * 0.1, 0.038, Math.cos(a) * 0.1); b.rotation.y = a; grate.add(b);
  }
  // flames: ring of soft cones
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x4f8bff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const flameTip = new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const flames = [];
  for (let i = 0; i < 28; i++) {
    const a = i / 28 * Math.PI * 2;
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.03, 6), i % 4 ? flameMat : flameTip);
    f.position.set(Math.sin(a) * 0.052, 0.03, Math.cos(a) * 0.052);
    f.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
    f.userData.a = a; burner.add(f); flames.push(f);
  }
  const flameLight = new THREE.PointLight(0x6a8cff, 0, 0.5, 1.5); flameLight.position.y = 0.05; burner.add(flameLight);
  // knobs on the island front
  const knobs = [];
  for (let i = 0; i < 2; i++) {
    const k = new THREE.Group(); k.position.set(0.22 + i * 0.16, -0.06, 0.345);
    const kb = mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.025, 24), new THREE.MeshStandardMaterial({ color: 0xd9d4cc, metalness: 1, roughness: 0.25 })); kb.rotation.x = Math.PI / 2; kb.position.z = 0.012; k.add(kb);
    const m = mesh(new THREE.BoxGeometry(0.004, 0.018, 0.004), dark); m.position.set(0, 0.008, 0.026); k.add(m);
    scene.add(k); knobs.push(k);
  }
  K.cook = cook; K.burner = burner; K.flames = flames; K.flameLight = flameLight; K.knobs = knobs; K.fire = 0;
  K.setFire = v => { K.fire = v; };
  K.updateFire = (t) => {
    const v = K.fire;
    flames.forEach((f, i) => {
      f.visible = v > 0.02;
      const fl = 0.75 + Math.sin(t * 23 + i * 1.7) * 0.15 + Math.sin(t * 37 + i) * 0.1;
      f.scale.set(1, (0.4 + v * 0.9) * fl, 1);
      f.position.y = 0.025 + f.scale.y * 0.012;
    });
    flameLight.intensity = v * (0.25 + Math.sin(t * 30) * 0.03);
  };

  // ---- cutting board ----
  const board = new THREE.Group(); board.position.set(-0.32, 0, -0.02); scene.add(board);
  const bm = mesh(new RoundedBoxGeometry(0.4, 0.022, 0.26, 3, 0.008), new THREE.MeshStandardMaterial({ map: TX.wood(), roughness: 0.55 }));
  bm.position.y = 0.011; board.add(bm);
  K.board = board; K.boardTop = 0.022;

  // ---- back wall, window, shelves ----
  const T = TX.tiles();
  const wall = mesh(new THREE.PlaneGeometry(5, 2.4), new THREE.MeshPhysicalMaterial({ map: T.map, bumpMap: T.bump, bumpScale: 0.8, roughness: 0.25, clearcoat: 0.5 }), { cast: false });
  T.map.repeat.set(8.2, 4); T.bump.repeat.set(8.2, 4);
  wall.position.set(0, 0.5, -1.45); scene.add(wall);
  // back counter
  const bc = mesh(new THREE.BoxGeometry(5, 0.9, 0.6), new THREE.MeshStandardMaterial({ color: 0x6f8f7d, roughness: 0.6 }), { cast: false });
  bc.position.set(0, -0.45, -1.15); scene.add(bc);
  const bct = mesh(new THREE.BoxGeometry(5, 0.04, 0.64), new THREE.MeshStandardMaterial({ map: TX.wood(), roughness: 0.5 }), { cast: false });
  bct.position.set(0, 0.02, -1.13); scene.add(bct);
  // window
  const win = new THREE.Group(); win.position.set(-0.85, 0.62, -1.44); scene.add(win);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.75), new THREE.MeshBasicMaterial({ map: skyTex(), toneMapped: false, color: 0xfff6ea }));
  win.add(sky);
  const frameM = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.5 });
  [[0, 0.39, 0.86, 0.04], [0, -0.39, 0.86, 0.04], [-0.41, 0, 0.04, 0.82], [0.41, 0, 0.04, 0.82], [0, 0, 0.025, 0.78], [0, 0.05, 0.8, 0.025]].forEach(([x, y, w, h]) => {
    const f = mesh(new THREE.BoxGeometry(w, h, 0.05), frameM); f.position.set(x, y, 0.02); win.add(f);
  });
  const sill = mesh(new THREE.BoxGeometry(0.95, 0.03, 0.14), frameM); sill.position.set(0, -0.41, 0.07); win.add(sill);
  // potted herbs on sill
  for (let i = 0; i < 3; i++) {
    const p = smallBowl(0.04, 0.07, MAT.pot); p.position.set(-0.28 + i * 0.28, -0.395, 0.07); win.add(p);
    for (let k = 0; k < 14; k++) {
      const lf = mesh(new THREE.SphereGeometry(0.018, 8, 6), MAT.basil); lf.scale.set(1, 0.3, 0.6);
      const a = k * 2.4, r = 0.012 + (k % 4) * 0.008;
      lf.position.set(-0.28 + i * 0.28 + Math.sin(a) * r, -0.3 + (k % 5) * 0.015, 0.07 + Math.cos(a) * r);
      lf.rotation.set(Math.sin(k) * 0.6, a, Math.cos(k) * 0.5); win.add(lf);
    }
  }
  // open shelves (right side)
  const wood = MAT.wood;
  for (const y of [0.55, 0.86]) {
    const sh = mesh(new THREE.BoxGeometry(1.1, 0.03, 0.22), wood); sh.position.set(0.75, y, -1.33); scene.add(sh);
  }
  // jars & plates on shelves
  const jarCols = [0xc7832f, 0x7a4d2a, 0xf1e6c8, 0xb5402a, 0x8a9a3a];
  for (let i = 0; i < 6; i++) {
    const r = 0.035 + (i % 3) * 0.006, h = 0.1 + (i % 2) * 0.04;
    const jar = new THREE.Group(); jar.position.set(0.32 + i * 0.13, 0.57, -1.33);
    const gl = mesh(new THREE.CylinderGeometry(r, r, h, 24, 1, true), MAT.glass, { cast: false }); gl.position.y = h / 2; jar.add(gl);
    const fill = mesh(new THREE.CylinderGeometry(r - 0.003, r - 0.003, h * 0.75, 24), new THREE.MeshStandardMaterial({ color: jarCols[i % 5], roughness: 0.9 })); fill.position.y = h * 0.375; jar.add(fill);
    const lid = mesh(new THREE.CylinderGeometry(r + 0.003, r + 0.003, 0.018, 24), i % 2 ? wood : brass); lid.position.y = h + 0.009; jar.add(lid);
    scene.add(jar);
  }
  for (let i = 0; i < 5; i++) {
    const p = makePlate(0.09); p.rotation.x = Math.PI / 2 - 0.15; p.position.set(0.35 + i * 0.05, 0.96, -1.38); scene.add(p);
  }
  const vase = smallBowl(0.05, 0.16, MAT.ceramicSage); vase.position.set(1.15, 0.875, -1.33); scene.add(vase);
  // hanging rail with copper pans (left of shelves)
  const rail = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.9, 10), brass); rail.rotation.z = Math.PI / 2; rail.position.set(-0.05, 1.02, -1.38); scene.add(rail);
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(); g.position.set(-0.35 + i * 0.28, 1.0, -1.37);
    const r = 0.08 + i * 0.015;
    const pot = mesh(new THREE.LatheGeometry([V2(0, 0), V2(r, 0), V2(r + 0.004, 0.05), V2(r + 0.006, 0.052)], 32), copper);
    pot.rotation.x = Math.PI / 2; pot.position.set(0, -0.2 - r, 0.02); g.add(pot);
    const hd = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 8), copper); hd.position.y = -0.1; g.add(hd);
    scene.add(g);
  }
  // pendant lamps
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x1f2a24, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide });
  for (const x of [-0.45, 0.45]) {
    const g = new THREE.Group(); g.position.set(x, 1.15, -0.25); scene.add(g);
    const cord = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.6, 6), dark); cord.position.y = 0.3; g.add(cord);
    const shade = mesh(new THREE.LatheGeometry([V2(0.02, 0.06), V2(0.04, 0.05), V2(0.13, -0.06), V2(0.135, -0.07)], 40), lampMat, { cast: false }); g.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffe2a8, toneMapped: false })); bulb.position.y = -0.04; g.add(bulb);
    const l = new THREE.PointLight(0xffc98a, 1.2, 2.2, 1.6); l.position.y = -0.08; g.add(l);
  }

  // ---- ingredients staging: veg plate, meat bowl, oil, spices, jug ----
  K.vegPlate = makePlate(0.11); K.vegPlate.position.set(-0.72, 0, 0.0); scene.add(K.vegPlate);
  K.meatBowl = new THREE.Group(); K.meatBowl.add(smallBowl(0.09, 0.055, MAT.ceramic)); K.meatBowl.position.set(-0.05, 0, 0.17); scene.add(K.meatBowl);
  K.knife = makeKnife(); K.knife.scale.setScalar(0.9);
  K.knife.position.set(-0.3, K.boardTop + 0.002, 0.09); K.knife.rotation.set(-Math.PI / 2, 0, 0.05); scene.add(K.knife);
  return K;
}
