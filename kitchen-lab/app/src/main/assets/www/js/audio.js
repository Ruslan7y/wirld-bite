// Synthesized kitchen sound design (WebAudio, no audio files).
let ctx, master, sfxBus, musicBus, noiseBuf, reverb;
const loops = {};
export const audio = { muted: false, music: true };

function init() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
  master.connect(comp).connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.connect(master);
  musicBus = ctx.createGain(); musicBus.gain.value = 0.16; musicBus.connect(master);
  // white noise buffer
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  // small room reverb
  reverb = ctx.createConvolver();
  const len = ctx.sampleRate * 1.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const x = ir.getChannelData(ch); for (let i = 0; i < len; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  reverb.buffer = ir;
  const rg = ctx.createGain(); rg.gain.value = 0.18; reverb.connect(rg).connect(master);
}
export function unlock() { init(); if (ctx.state === 'suspended') ctx.resume(); }
export function setMuted(m) { audio.muted = m; if (master) master.gain.value = m ? 0 : 0.9; }
const now = () => ctx.currentTime;

function noise(dur, { type = 'bandpass', freq = 1000, q = 1, gain = 0.5, attack = 0.005, rel = null, when = 0, rev = 0.3 } = {}) {
  const t = now() + when;
  const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (rel ?? dur));
  src.connect(f).connect(g); g.connect(sfxBus); if (rev) { const s = ctx.createGain(); s.gain.value = rev; g.connect(s).connect(reverb); }
  src.start(t, Math.random()); src.stop(t + (rel ?? dur) + 0.05);
  return { f, g };
}
function tone(freq, dur, { type = 'sine', gain = 0.3, attack = 0.005, when = 0, slide = null, rev = 0.3 } = {}) {
  const t = now() + when;
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(sfxBus); if (rev) { const s = ctx.createGain(); s.gain.value = rev; g.connect(s).connect(reverb); }
  o.start(t); o.stop(t + dur + 0.05);
}

export const sfx = {
  tap() { if (!ctx) return; noise(0.05, { freq: 3000, q: 2, gain: 0.25 }); },
  crack() {
    if (!ctx) return;
    noise(0.04, { type: 'highpass', freq: 2500, gain: 0.9, rev: 0.2 });
    noise(0.09, { freq: 1600, q: 3, gain: 0.6, when: 0.015 });
    noise(0.06, { freq: 4200, q: 4, gain: 0.4, when: 0.05 });
    tone(320, 0.05, { type: 'triangle', gain: 0.25, slide: 120 });
  },
  shell() { if (!ctx) return; noise(0.12, { freq: 2200, q: 1.5, gain: 0.25, when: 0.02 }); },
  plop(big = 1) {
    if (!ctx) return;
    tone(420 / big, 0.18, { gain: 0.35, slide: 140 / big, rev: 0.4 });
    noise(0.15, { type: 'lowpass', freq: 900, gain: 0.25, when: 0.01 });
  },
  pop() { if (!ctx) return; tone(500, 0.12, { gain: 0.3, slide: 900 }); noise(0.05, { freq: 2500, gain: 0.15 }); },
  thunk() { if (!ctx) return; tone(90, 0.25, { gain: 0.6, slide: 50 }); noise(0.12, { type: 'lowpass', freq: 600, gain: 0.5 }); },
  clank() {
    if (!ctx) return;
    [523, 1310, 2093, 2960].forEach((f, i) => tone(f, 0.5 - i * 0.08, { type: 'sine', gain: 0.12, rev: 0.5 }));
    noise(0.05, { type: 'highpass', freq: 3000, gain: 0.3 });
  },
  door() { if (!ctx) return; noise(0.45, { type: 'bandpass', freq: 500, q: 0.7, gain: 0.25, attack: 0.1 }); tone(140, 0.35, { type: 'triangle', gain: 0.15, slide: 90 }); },
  knob() { if (!ctx) return; for (let i = 0; i < 6; i++) noise(0.02, { freq: 3500, q: 6, gain: 0.25, when: i * 0.05 }); },
  whoosh() { if (!ctx) return; const n = noise(0.6, { freq: 400, q: 0.8, gain: 0.25, attack: 0.25 }); n.f.frequency.exponentialRampToValueAtTime(1800, now() + 0.5); },
  ding() {
    if (!ctx) return;
    [1568, 3136, 4700].forEach((f, i) => tone(f, 1.8 - i * 0.4, { gain: 0.22 / (i + 1), rev: 0.6 }));
    [1568, 3136].forEach((f, i) => tone(f, 1.6, { gain: 0.16 / (i + 1), when: 0.35, rev: 0.6 }));
  },
  step() {
    if (!ctx) return;
    tone(880, 0.25, { type: 'triangle', gain: 0.08, rev: 0.5 }); tone(1320, 0.35, { type: 'triangle', gain: 0.07, when: 0.08, rev: 0.5 });
  },
  sparkle() { if (!ctx) return; [2093, 2637, 3136, 4186].forEach((f, i) => tone(f, 0.4, { gain: 0.06, when: i * 0.06, rev: 0.6 })); },
  success() {
    if (!ctx) return;
    [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(f, 0.9, { type: 'triangle', gain: 0.12, when: i * 0.11, rev: 0.6 }); });
  },
  squelch() { if (!ctx) return; const n = noise(0.3, { type: 'lowpass', freq: 300, q: 4, gain: 0.35, attack: 0.05 }); n.f.frequency.exponentialRampToValueAtTime(900, now() + 0.25); },
  sift() { if (!ctx) return; noise(0.18, { type: 'highpass', freq: 5000, gain: 0.18, attack: 0.03 }); noise(0.08, { freq: 900, q: 2, gain: 0.1 }); },
  cut() { if (!ctx) return; noise(0.5, { type: 'lowpass', freq: 700, q: 2, gain: 0.25, attack: 0.15 }); },
  chop() { if (!ctx) return; tone(140, 0.08, { type: 'triangle', gain: 0.4, slide: 70, rev: 0.1 }); noise(0.05, { freq: 1800, q: 1.5, gain: 0.35, rev: 0.1 }); },
  pour() { if (!ctx) return; noise(0.4, { type: 'lowpass', freq: 600, q: 3, gain: 0.25, attack: 0.05 }); },
  sizzleBurst() { if (!ctx) return; noise(1.2, { type: 'highpass', freq: 3000, q: 0.6, gain: 0.5, attack: 0.01 }); noise(0.8, { freq: 1200, q: 0.5, gain: 0.25 }); },
  lid() { if (!ctx) return; [1200, 2600, 3900].forEach((f, i) => tone(f, 0.35, { gain: 0.08 / (i + 1), rev: 0.4 })); noise(0.04, { type: 'highpass', freq: 2500, gain: 0.25 }); },
  tick() { if (!ctx) return; noise(0.015, { freq: 4000, q: 8, gain: 0.18, rev: 0 }); },
};

// Continuous sounds with a live intensity 0..1
function loop(name, build) {
  if (!ctx) return null;
  if (!loops[name]) loops[name] = build();
  return loops[name];
}
export function setLoop(name, level) {
  if (!ctx) return;
  const L = loop(name, BUILDERS[name]);
  if (!L) return;
  L.set(Math.max(0, level));
}
export function stopAllLoops() { for (const k in loops) loops[k].set(0); }

const BUILDERS = {
  mixer() {
    const out = ctx.createGain(); out.gain.value = 0; out.connect(sfxBus);
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 95;
    const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 190;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 7; const lg = ctx.createGain(); lg.gain.value = 4;
    lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 2;
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    o1.connect(f); o2.connect(g2).connect(f); f.connect(out);
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1400; nf.Q.value = 0.8;
    const ng = ctx.createGain(); ng.gain.value = 0.5; n.connect(nf).connect(ng).connect(out);
    [o1, o2, lfo, n].forEach(s => s.start());
    return {
      set(v) {
        const t = now();
        out.gain.setTargetAtTime(v * 0.22, t, 0.08);
        o1.frequency.setTargetAtTime(70 + v * 60, t, 0.15); o2.frequency.setTargetAtTime(140 + v * 120, t, 0.15);
        f.frequency.setTargetAtTime(500 + v * 900, t, 0.1);
      }
    };
  },
  pourSugar() { return noiseLoop({ type: 'highpass', freq: 3500, q: 0.7, mod: 18, gain: 0.25 }); },
  pourLiquid() { return noiseLoop({ type: 'lowpass', freq: 700, q: 6, mod: 9, gain: 0.35, wobble: true }); },
  pourBatter() { return noiseLoop({ type: 'lowpass', freq: 380, q: 5, mod: 4, gain: 0.4, wobble: true }); },
  oven() {
    const out = ctx.createGain(); out.gain.value = 0; out.connect(sfxBus);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 100;
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 250;
    const ng = ctx.createGain(); ng.gain.value = 0.8;
    const og = ctx.createGain(); og.gain.value = 0.15;
    o.connect(og).connect(out); n.connect(nf).connect(ng).connect(out); o.start(); n.start();
    return { set(v) { out.gain.setTargetAtTime(v * 0.2, now(), 0.3); } };
  },
  sizzle() {
    const out = ctx.createGain(); out.gain.value = 0; out.connect(sfxBus);
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500;
    const f2 = ctx.createBiquadFilter(); f2.type = 'peaking'; f2.frequency.value = 6000; f2.gain.value = 6;
    const am = ctx.createGain(); am.gain.value = 0.5;
    n.connect(f).connect(f2).connect(am).connect(out); n.start();
    // random crackle
    const crack = setInterval(() => { if (out.gain.value > 0.01) { const t = now(); am.gain.setValueAtTime(0.5 + Math.random() * 0.9, t); am.gain.setTargetAtTime(0.45, t + 0.01, 0.03); } }, 45);
    return { set(v) { out.gain.setTargetAtTime(v * 0.32, now(), 0.15); } };
  },
  boil() {
    const out = ctx.createGain(); out.gain.value = 0; out.connect(sfxBus);
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; f.Q.value = 1;
    n.connect(f).connect(out); n.start();
    let lvl = 0;
    setInterval(() => { if (lvl > 0.02 && Math.random() < 0.7) tone(200 + Math.random() * 500, 0.06, { gain: 0.06 * lvl, slide: 600 + Math.random() * 400, rev: 0.2 }); }, 70);
    return { set(v) { lvl = v; out.gain.setTargetAtTime(v * 0.12, now(), 0.2); } };
  },
  alarm() {
    const out = ctx.createGain(); out.gain.value = 0; out.connect(master);
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 1760;
    const gate = ctx.createGain(); gate.gain.value = 0;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 3500;
    o.connect(f).connect(gate).connect(out); o.start();
    let on = false;
    setInterval(() => {
      if (!on) return; const t = now();
      for (let i = 0; i < 4; i++) { gate.gain.setValueAtTime(1, t + i * 0.12); gate.gain.setValueAtTime(0, t + i * 0.12 + 0.07); }
    }, 1000);
    return { set(v) { on = v > 0; out.gain.setTargetAtTime(v * 0.18, now(), 0.02); if (!on) gate.gain.setValueAtTime(0, now()); } };
  },
  steam() { return noiseLoop({ type: 'highpass', freq: 6000, q: 0.5, mod: 0.6, gain: 0.08 }); },
  room() { return noiseLoop({ type: 'lowpass', freq: 180, q: 0.5, mod: 0.2, gain: 0.12 }); },
};
function noiseLoop({ type, freq, q, mod, gain, wobble }) {
  const out = ctx.createGain(); out.gain.value = 0; out.connect(sfxBus);
  const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const am = ctx.createGain(); am.gain.value = 0.6;
  const lfo = ctx.createOscillator(); lfo.type = 'sawtooth'; lfo.frequency.value = mod;
  const lg = ctx.createGain(); lg.gain.value = 0.4; lfo.connect(lg).connect(am.gain);
  n.connect(f).connect(am).connect(out);
  if (wobble) { const w = ctx.createOscillator(); w.frequency.value = 3.3; const wg = ctx.createGain(); wg.gain.value = freq * 0.4; w.connect(wg).connect(f.frequency); w.start(); }
  n.start(); lfo.start();
  return { set(v) { out.gain.setTargetAtTime(v * gain, now(), 0.06); } };
}

// Gentle generative background music (soft electric piano chords)
let musicTimer = null;
export function startMusic() {
  if (!ctx || musicTimer) return;
  const chords = [[261.6, 329.6, 392, 493.9], [220, 261.6, 329.6, 392], [174.6, 220, 261.6, 329.6], [196, 246.9, 293.7, 349.2]];
  let i = 0;
  const play = () => {
    if (!audio.music || audio.muted) return;
    const t = now(), ch = chords[i++ % 4];
    ch.forEach((f, k) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.01;
      const g = ctx.createGain(), g2 = ctx.createGain(); g2.gain.value = 0.15;
      g.gain.setValueAtTime(0, t + k * 0.03); g.gain.linearRampToValueAtTime(0.25, t + k * 0.03 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 3.6);
      o.connect(g); o2.connect(g2).connect(g); g.connect(musicBus); const s = ctx.createGain(); s.gain.value = 0.4; g.connect(s).connect(reverb);
      o.start(t + k * 0.03); o2.start(t + k * 0.03); o.stop(t + 3.8); o2.stop(t + 3.8);
    });
    // little melody pluck
    const mel = ch[Math.floor(Math.random() * 4)] * 2;
    [0, 0.9, 1.8].forEach((d, j) => { if (Math.random() < 0.7) tone(mel * (j === 1 ? 1.125 : 1), 0.8, { type: 'triangle', gain: 0.025, when: d + 0.4, rev: 0.7 }); });
  };
  play(); musicTimer = setInterval(play, 3600);
}
export function setMusic(on) { audio.music = on; if (musicBus) musicBus.gain.value = on ? 0.16 : 0; }
