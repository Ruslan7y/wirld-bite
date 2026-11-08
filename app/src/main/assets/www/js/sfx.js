/* Tiny synthesized kitchen sounds (no audio files): pop, chop, sizzle, bubble, whisk, crack, ding, success, fail. */
const SFX = (() => {
  let ctx = null;
  const on = () => { try { return JSON.parse(localStorage.getItem('wb_sfx') ?? 'true'); } catch (e) { return true; } };
  const ac = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (ctx.state === 'suspended') ctx.resume(); return ctx; };
  function tone(f, d, type = 'sine', vol = .2, slide) {
    const a = ac(); if (!a) return; const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d);
  }
  function noise(d, vol = .15, freq = 2000, q = 1, type = 'bandpass') {
    const a = ac(); if (!a) return; const n = a.sampleRate * d, buf = a.createBuffer(1, n, a.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.value = vol; s.buffer = buf; s.connect(f); f.connect(g); g.connect(a.destination); s.start();
  }
  const S = {
    pop: () => tone(520, .12, 'sine', .25, 900),
    chop: () => { noise(.06, .35, 3200, 2); tone(180, .05, 'square', .08); },
    crack: () => { noise(.08, .4, 4500, 3); setTimeout(() => noise(.05, .25, 2500, 2), 60); },
    sizzle: () => noise(.5, .07, 6000, .7, 'highpass'),
    bubble: () => tone(300 + Math.random() * 300, .09, 'sine', .12, 700),
    whisk: () => noise(.12, .1, 1800, 4),
    ding: () => { tone(1320, .35, 'triangle', .2); setTimeout(() => tone(1760, .4, 'triangle', .15), 90); },
    success: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, .22, 'triangle', .18), i * 90)),
    fail: () => tone(220, .3, 'sawtooth', .08, 140),
    star: () => tone(1568, .18, 'triangle', .14, 2093)
  };
  return { play(name) { if (!on()) return; try { S[name] && S[name](); } catch (e) {} }, vibrate(p) { if (!on()) return; try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} } };
})();
