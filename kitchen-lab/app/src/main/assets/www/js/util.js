// Small helpers: math, noise, tweens.
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => t * t * (3 - 2 * t);
export const ease = {
  linear: t => t,
  inOut: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  outBack: t => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
};
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const rand = (a, b) => a + Math.random() * (b - a);

// Seeded value noise (2D) + fbm
let seed = 1337;
const perm = new Uint8Array(512);
(function () {
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { seed = (seed * 16807) % 2147483647; const j = seed % (i + 1);[p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
})();
const grad = (h, x, y) => { const u = h & 1 ? x : -x, v = h & 2 ? y : -y; return u + v; };
export function noise2(x, y) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
  x -= Math.floor(x); y -= Math.floor(y);
  const u = x * x * x * (x * (x * 6 - 15) + 10), v = y * y * y * (y * (y * 6 - 15) + 10);
  const a = perm[X] + Y, b = perm[X + 1] + Y;
  return lerp(lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u),
    lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u), v) * 0.7;
}
export function fbm(x, y, oct = 5) {
  let s = 0, a = .5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * noise2(x * f, y * f); f *= 2; a *= .5; }
  return s;
}

// Tween manager driven by the render loop
const tweens = new Set();
export function tween(dur, fn, e = ease.inOut) {
  return new Promise(res => {
    const tw = { t: 0, dur: Math.max(dur, 0.001), fn, e, res };
    tweens.add(tw);
    fn(0, 0);
  });
}
export function updateTweens(dt) {
  for (const tw of [...tweens]) {
    tw.t = Math.min(tw.dur, tw.t + dt);
    const k = tw.t / tw.dur;
    tw.fn(tw.e(k), k);
    if (k >= 1) { tweens.delete(tw); tw.res(); }
  }
}
// Wait for a duration measured in animation time (pauses with the loop)
export const wait = s => tween(s, () => { });
