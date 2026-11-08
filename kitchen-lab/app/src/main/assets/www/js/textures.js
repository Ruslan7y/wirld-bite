// Procedural canvas textures (no image files needed, works offline).
import * as THREE from 'three';
import { fbm, noise2, clamp, rand } from './util.js';

function canvas(w, h = w) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function tex(c, color = true, rep = 1) {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.anisotropy = 4;
  return t;
}
function pixels(w, h, fn) {
  const [c, g] = canvas(w, h);
  const img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, gg, b] = fn(x, y), i = (y * w + x) * 4;
    d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function marble() {
  const S = 512;
  const col = pixels(S, S, (x, y) => {
    const u = x / S, v = y / S;
    // tileable-ish by using periodic coords
    const n = fbm(u * 4, v * 4, 6);
    const vein = Math.abs(Math.sin((u * 3 + v * 1.4 + n * 2.2) * Math.PI * 2));
    const fine = Math.abs(Math.sin((u * 9 - v * 5 + fbm(u * 9 + 3, v * 9, 4) * 3) * Math.PI));
    let k = 236 + n * 14;
    k -= Math.pow(1 - vein, 14) * 70 + Math.pow(1 - fine, 30) * 30;
    return [k + 3, k, k - 4];
  });
  return tex(col, true, 2);
}

export function tiles() {
  const W = 512, H = 512, cols = 4, rows = 8;
  const [c, g] = canvas(W, H), [b, gb] = canvas(W, H);
  g.fillStyle = '#8f8676'; g.fillRect(0, 0, W, H);
  gb.fillStyle = '#000'; gb.fillRect(0, 0, W, H);
  const tw = W / cols, th = H / rows, gap = 5;
  for (let r = 0; r < rows; r++) for (let i = -1; i < cols + 1; i++) {
    const x = i * tw + (r % 2 ? tw / 2 : 0), y = r * th;
    const shade = 214 + rand(-8, 8);
    const grd = g.createLinearGradient(x, y, x, y + th);
    grd.addColorStop(0, `rgb(${shade - 4},${shade + 6},${shade - 6})`);
    grd.addColorStop(1, `rgb(${shade - 22},${shade - 12},${shade - 26})`);
    g.fillStyle = grd;
    roundRect(g, x + gap / 2, y + gap / 2, tw - gap, th - gap, 6); g.fill();
    const gr2 = gb.createRadialGradient(x + tw / 2, y + th / 2, 2, x + tw / 2, y + th / 2, tw / 1.6);
    gr2.addColorStop(0, '#fff'); gr2.addColorStop(1, '#ccc');
    gb.fillStyle = gr2; roundRect(gb, x + gap / 2, y + gap / 2, tw - gap, th - gap, 8); gb.fill();
  }
  const m = tex(c, true), bb = tex(b, false); m.repeat.set(6.6, 2.7); bb.repeat.set(6.6, 2.7);
  return { map: m, bump: bb };
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

export function wood() {
  const S = 256;
  const c = pixels(S, S, (x, y) => {
    const u = x / S, v = y / S;
    const n = fbm(u * 2, v * 8, 5);
    const ring = (Math.sin((u * 18 + n * 4) * Math.PI) + 1) / 2;
    const k = 0.75 + ring * 0.25 + noise2(u * 80, v * 4) * 0.08;
    return [150 * k, 102 * k, 62 * k];
  });
  return tex(c, true, 1);
}

// Sponge crumb for cut faces. layer = cream filling band in the middle
export function crumb(layer = true) {
  const W = 512, H = 256;
  const [c, g] = canvas(W, H);
  const img = g.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x / 40, y / 40, 4), f = noise2(x / 6, y / 6);
    let r = 246 + n * 18, gg = 214 + n * 20, b = 140 + n * 20;
    const hole = f < -0.25 ? (f + 0.25) * 140 : 0;
    r += hole; gg += hole; b += hole * 0.8;
    const i = (y * W + x) * 4; d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // golden crust edges top & bottom
  let gr = g.createLinearGradient(0, 0, 0, 18); gr.addColorStop(0, 'rgba(150,80,25,1)'); gr.addColorStop(1, 'rgba(150,80,25,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, 18);
  gr = g.createLinearGradient(0, H, 0, H - 14); gr.addColorStop(0, 'rgba(160,90,30,1)'); gr.addColorStop(1, 'rgba(160,90,30,0)');
  g.fillStyle = gr; g.fillRect(0, H - 14, W, 14);
  if (layer) {
    const y0 = H * 0.47, hh = H * 0.1;
    for (let x = 0; x < W; x += 2) {
      const wob = noise2(x / 30, 2) * 4;
      g.fillStyle = 'rgba(255,250,240,0.97)'; g.fillRect(x, y0 + wob, 2, hh + noise2(x / 20, 9) * 3);
      g.fillStyle = 'rgba(200,30,50,0.85)'; g.fillRect(x, y0 + wob + hh * 0.4, 2, hh * 0.22 + noise2(x / 9, 4) * 2);
    }
  }
  return tex(c, true, 1);
}

// Golden-brown crust: mottled, fine pores, no streaks
export function crust() {
  const S = 512;
  const c = pixels(S, S, (x, y) => {
    const u = x / S, v = y / S;
    const big = fbm(u * 5, v * 5, 4), mid = fbm(u * 18 + 7, v * 18, 3), pore = noise2(u * 140, v * 140);
    let k = 0.9 + big * 0.28 + mid * 0.12;
    if (pore < -0.32) k *= 0.82;
    const gold = clamp(0.55 + big * 0.9, 0, 1);
    return [lerp3(150, 214, gold) * k, lerp3(78, 140, gold) * k, lerp3(28, 62, gold) * k];
  });
  return tex(c, true, 1);
}
const lerp3 = (a, b, t) => a + (b - a) * t;

export function bumpNoise(scale = 12, S = 256) {
  const c = pixels(S, S, (x, y) => {
    const n = (fbm(x / S * scale, y / S * scale, 4) + 1) * 127;
    return [n, n, n];
  });
  return tex(c, false, 1);
}

export function sprite(hard = 0) {
  const [c, g] = canvas(64);
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(hard ? 0.5 : 0.25, 'rgba(255,255,255,' + (hard ? 1 : .6) + ')');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); return t;
}

export function smokeSprite() {
  const S = 128;
  const [c, g] = canvas(S);
  const img = g.createImageData(S, S), d = img.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (x - S / 2) / (S / 2), dy = (y - S / 2) / (S / 2), r = Math.sqrt(dx * dx + dy * dy);
    const n = (fbm(x / 22, y / 22, 4) + 1) / 2;
    const a = clamp(1 - r, 0, 1) ** 2 * n * 1.6;
    const i = (y * S + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = clamp(a, 0, 1) * 255;
  }
  g.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(c);
}

export function strawberry() {
  const [c, g] = canvas(256);
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#f4f0d0'); gr.addColorStop(0.12, '#e8343c'); gr.addColorStop(1, '#b0101e');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) {
    const x = (i * 37) % 256, y = 30 + ((i * 53) % 220);
    g.fillStyle = 'rgba(255,220,90,0.9)';
    g.beginPath(); g.ellipse(x, y, 2, 3, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(120,0,10,0.5)';
    g.beginPath(); g.ellipse(x + 1, y + 3, 3, 2, 0, 0, 7); g.fill();
  }
  return tex(c, true, 1);
}

// Oven LCD display, redrawn on demand
export function lcd() {
  const [c, g] = canvas(256, 96);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.draw = (text, sub = '', on = true) => {
    g.fillStyle = '#050505'; g.fillRect(0, 0, 256, 96);
    if (on) {
      g.shadowColor = '#ff7a1a'; g.shadowBlur = 12;
      g.fillStyle = '#ff9a3c'; g.font = 'bold 52px monospace'; g.textAlign = 'center';
      g.fillText(text, 128, 60);
      g.shadowBlur = 0; g.font = '18px monospace'; g.fillStyle = '#d0702a'; g.fillText(sub, 128, 86);
    }
    t.needsUpdate = true;
  };
  t.draw('', '', false);
  return t;
}

// Butcher-block / plank worktop
export function planks() {
  const W = 1024, H = 1024, rows = 7;
  const c = pixels(W, H, (x, y) => {
    const row = Math.floor(y / (H / rows)), ry = (y % (H / rows)) / (H / rows);
    const off = row * 137.5, tone = [1, 0.9, 1.06, 0.95, 1.02, 0.88, 0.97][row];
    const u = (x + off) / W, v = y / H;
    const n = fbm(u * 3 + row, v * 30, 4);
    const grain = Math.sin((v * 160 + n * 7 + Math.sin(u * 9 + row) * 1.5) * Math.PI) * 0.5 + 0.5;
    let k = (0.78 + grain * 0.14 + noise2(u * 200, v * 6) * 0.05) * tone;
    if (ry < 0.012 || ry > 0.988) k *= 0.55;
    return [178 * k, 122 * k, 78 * k];
  });
  const t = tex(c, true); t.repeat.set(2.2, 0.75); return t;
}
