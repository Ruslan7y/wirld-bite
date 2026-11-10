/* World Bite — step-by-step cooking flow ("yapılış akışı").
   One clear card per step: what to do, which ingredients, the consistency / doneness cue,
   a timer when the step needs one. The full flow of steps is listed underneath.
   A menu (main dish + side) is interleaved: the side is made while the main dish waits.
   Timers are real alarms (in-app ring + Android alarm notification when the app is closed),
   the chef can read every step aloud and listens for "next / back / repeat",
   and leaving the app keeps the place: it resumes where you left off. */
const CookFlow = (() => {
  'use strict';
  const L = {
    tr: { step: 'Adım', of: '/', next: 'Sonraki', prev: 'Geri', finish: 'Bitir', ings: 'Bu adımda', cue: 'Kıvam', tip: 'Püf noktası', flow: 'Yapılış akışı', timer: 'zamanlayıcıyı başlat', video: 'Videolu tarifi izle', videoQ: 'tarifi', main: 'Ana yemek', side: 'Yanında', bon: 'Afiyet olsun!', bonP: 'Yemeğin hazır. Ellerine sağlık!', done: 'hazır', stop: 'Durdur', pause: 'Duraklat', resume: 'Devam', plus: '+1 dk', cancel: 'İptal', ready: 'Süre doldu', alarmsOff: 'Alarmlar kapalı', alarmsOn: 'Alarmlar açık', wait: 'Sonraki adıma geçmeden önce bu sürenin dolmasını bekle.', whileWait: 'beklerken bunu yap', cont: 'kaldığın yerden devam et', voiceOn: 'Sesli asistan açık: "sonraki", "geri", "tekrar" diyebilirsin', timerStarted: 'Zamanlayıcı başladı', min: 'dk' },
    az: { step: 'Addım', of: '/', next: 'Növbəti', prev: 'Geri', finish: 'Bitir', ings: 'Bu addımda', cue: 'Qıvam', tip: 'Məsləhət', flow: 'Hazırlanma axını', timer: 'taymeri başlat', video: 'Videolu resepti izlə', videoQ: 'resepti', main: 'Əsas yemək', side: 'Yanında', bon: 'Nuş olsun!', bonP: 'Yemək hazırdır. Əllərinə sağlıq!', done: 'hazır', stop: 'Dayandır', pause: 'Fasilə', resume: 'Davam', plus: '+1 dəq', cancel: 'Ləğv et', ready: 'Vaxt bitdi', alarmsOff: 'Siqnallar bağlıdır', alarmsOn: 'Siqnallar açıqdır', wait: 'Növbəti addıma keçməzdən əvvəl bu vaxtın bitməsini gözlə.', whileWait: 'gözləyərkən bunu et', cont: 'qaldığın yerdən davam et', voiceOn: 'Səsli köməkçi açıqdır: "növbəti", "geri", "təkrar" deyə bilərsən', timerStarted: 'Taymer başladı', min: 'dəq' },
    en: { step: 'Step', of: '/', next: 'Next', prev: 'Back', finish: 'Finish', ings: 'In this step', cue: 'Consistency', tip: 'Tip', flow: 'Method', timer: 'start timer', video: 'Watch a video recipe', videoQ: 'recipe', main: 'Main', side: 'Side', bon: 'Enjoy your meal!', bonP: 'Your food is ready. Well done!', done: 'ready', stop: 'Stop', pause: 'Pause', resume: 'Resume', plus: '+1 min', cancel: 'Cancel', ready: 'Time\'s up', alarmsOff: 'Alarms off', alarmsOn: 'Alarms on', wait: 'Wait for this timer before the next step.', whileWait: 'do this while you wait', cont: 'continue where you left off', voiceOn: 'Voice assistant on: say "next", "back", "repeat"', timerStarted: 'Timer started', min: 'min' },
    ru: { step: 'Шаг', of: '/', next: 'Далее', prev: 'Назад', finish: 'Готово', ings: 'В этом шаге', cue: 'Консистенция', tip: 'Совет', flow: 'Ход приготовления', timer: 'запустить таймер', video: 'Смотреть видео-рецепт', videoQ: 'рецепт', main: 'Основное', side: 'Гарнир', bon: 'Приятного аппетита!', bonP: 'Блюдо готово. Отлично!', done: 'готово', stop: 'Стоп', pause: 'Пауза', resume: 'Продолжить', plus: '+1 мин', cancel: 'Отмена', ready: 'Время вышло', alarmsOff: 'Будильники выкл.', alarmsOn: 'Будильники вкл.', wait: 'Дождитесь окончания таймера перед следующим шагом.', whileWait: 'сделайте это, пока ждёте', cont: 'продолжить с места остановки', voiceOn: 'Голосовой помощник: скажите «далее», «назад», «повтори»', timerStarted: 'Таймер запущен', min: 'мин' },
  };
  const ACT_ICON = { layer: '🥧', crack: '🥚', whisk: '🥣', mix: '🥄', chop: '🔪', knead: '👐', roll: '🪵', fry: '🍳', boil: '♨️', bake: '🔥', grill: '🔥', steam: '💨', wrap: '🌯', rest: '⏳', garnish: '🌿', serve: '🍽️' };
  const KEY = 'cf_state';
  const A = () => window.LabAndroid || null;
  let S = null, el = null, tick = null, ringT = null;
  let H = {};   // helpers from the app (set by CookFlow.init)
  const lx = () => L[H.lang] || L.en;
  const rl = () => H.cl();                       // recipe text language (tr / en)
  const fmt = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  const save = () => { try { if (S) localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
  const lowr = s => String(s).toLocaleLowerCase('tr');

  /* ---------- building the flow ---------- */
  function stepIngs(text, ing) {
    const s = lowr(text);
    return ing.filter(line => {
      const name = lowr(H.shortIng(line)).replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(w => w.length >= 3);
      return name.some(w => s.includes(w.length > 5 ? w.slice(0, w.length - 2) : w.slice(0, Math.max(3, w.length - 1))));
    }).slice(0, 8);
  }
  function mkSteps(d, dish) {
    return d.st.map((text, i) => {
      const tp = Tips.forStep(text, rl());
      return { dish, i, text, act: tp.act, cue: tp.cue, tip: tp.tip, dur: tp.dur, ings: stepIngs(text, d.ing) };
    });
  }
  function build(dish, side) {
    let steps;
    if (side) {
      // interleave with the dinner planner: the side's steps fill the main dish's waiting time
      const res = scheduleDual(planSteps(dish.st), planSteps(side.st));
      const a = mkSteps(dish, 'A'), b = mkSteps(side, 'B');
      steps = res.timeline.map(x => Object.assign({}, (x.dish === 'A' ? a : b)[x.i], { passive: x.passive || 0 }));
    } else steps = mkSteps(dish, 'A').map(s => Object.assign(s, { passive: 0 }));
    return { v: 1, key: dish.key + (side ? '+' + side.key : ''), dish, side: side || null, steps, k: 0, timers: [], alarms: true, at: Date.now(), fin: false };
  }

  /* ---------- timers ---------- */
  let nid = 0;
  const left = x => x.pausedLeft != null ? x.pausedLeft : (x.end - Date.now()) / 1000;
  function nativeSet(x) { try { if (S.alarms && A() && A().scheduleAlarm && x.pausedLeft == null) A().scheduleAlarm(x.id, x.end, '⏰ ' + x.label, lx().ready); } catch (e) { } }
  function nativeCancel(x) { try { A() && A().cancelAlarm && A().cancelAlarm(x.id); } catch (e) { } }
  function addTimer(secs, label, step) {
    if (S.timers.some(x => x.step === step && !x.rang)) return;
    const x = { id: 7000 + ((Date.now() / 1000 | 0) % 100000) * 10 + (nid++ % 10), label, total: secs, end: Date.now() + secs * 1000, pausedLeft: null, step, dish: (S.steps[step] || {}).dish || 'A', rang: false };
    S.timers.push(x); nativeSet(x); save(); drawTimers(); SFX.play('pop'); H.toast('⏱ ' + lx().timerStarted + ' · ' + fmt(secs));
  }
  function timerAct(id, a) {
    const x = S.timers.find(t => t.id === id); if (!x) return;
    if (a === 'pause') { x.pausedLeft = Math.max(0, left(x)); nativeCancel(x); }
    else if (a === 'resume') { x.end = Date.now() + x.pausedLeft * 1000; x.pausedLeft = null; nativeSet(x); }
    else if (a === 'plus') { if (x.rang) { x.rang = false; x.end = Date.now() + 60000; x.pausedLeft = null; } else if (x.pausedLeft != null) x.pausedLeft += 60; else x.end += 60000; x.total += 60; nativeCancel(x); nativeSet(x); stopRing(); }
    else if (a === 'stop' || a === 'cancel') { nativeCancel(x); S.timers = S.timers.filter(t => t !== x); stopRing(); }
    save(); drawTimers();
  }
  function ring() {
    if (ringT || !S.alarms) return;
    const go = () => { SFX.play('ding'); SFX.vibrate([400, 200, 400]); };
    go(); ringT = setInterval(go, 1800);
  }
  function stopRing() { if (ringT) { clearInterval(ringT); ringT = null; } }
  function setAlarms(on) {
    S.alarms = on; stopRing();
    S.timers.forEach(x => on ? nativeSet(x) : nativeCancel(x));
    save(); H.toast((on ? '🔔 ' : '🔕 ') + (on ? lx().alarmsOn : lx().alarmsOff)); drawHead();
  }
  function onTick() {
    if (!S || !el) return;
    let any = false;
    S.timers.forEach(x => {
      if (!x.rang && x.pausedLeft == null && left(x) <= 0) {
        x.rang = true; save();
        if (Voice.on) Voice.speak(`${x.label}: ${lx().ready}`);
        H.toast(`⏰ ${x.label}: ${lx().ready}`);
      }
      if (x.rang) any = true;
    });
    if (any) ring(); else stopRing();
    drawTimers();
  }
  function drawTimers() {
    const box = el && el.querySelector('#cfTimers'); if (!box) return;
    const ids = S.timers.map(x => x.id).join(',');
    if (box.dataset.ids !== ids) {   // rebuild only when the set changes (buttons stay tappable)
      box.dataset.ids = ids;
      box.innerHTML = S.timers.map(x => `<div class="cf-timer" data-id="${x.id}"><div class="cf-tl"><b class="cf-tn"></b><span class="cf-tv"></span></div><i class="cf-tbar"><i></i></i>
        <div class="cf-tb"><button data-a="pp"></button><button data-a="plus">${lx().plus}</button><button data-a="stop">✕</button></div></div>`).join('');
    }
    S.timers.forEach(x => {
      const row = box.querySelector(`[data-id="${x.id}"]`); if (!row) return;
      const lf = Math.max(0, left(x));
      row.classList.toggle('ring', x.rang); row.classList.toggle('paused', x.pausedLeft != null);
      row.querySelector('.cf-tn').textContent = (x.rang ? '⏰ ' : x.pausedLeft != null ? '⏸ ' : '⏳ ') + x.label;
      row.querySelector('.cf-tv').textContent = x.rang ? lx().ready : fmt(lf);
      row.querySelector('.cf-tbar i').style.width = Math.min(100, (1 - lf / x.total) * 100) + '%';
      const pp = row.querySelector('[data-a="pp"]');
      pp.textContent = x.rang ? lx().stop : x.pausedLeft != null ? '▶ ' + lx().resume : '⏸ ' + lx().pause;
      pp.dataset.v = x.rang ? 'stop' : x.pausedLeft != null ? 'resume' : 'pause';
    });
  }

  /* ---------- screen ---------- */
  const nameOf = d => d === 'B' ? S.side.name : S.dish.name;
  const videoUrl = d => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(`${d.name} ${lx().videoQ}`);
  function drawHead() {
    const b = el.querySelector('#cfBell'); if (b) { b.textContent = S.alarms ? '🔔' : '🔕'; b.classList.toggle('off', !S.alarms); }
    const v = el.querySelector('#cfVoice'); if (v) v.classList.toggle('on', Voice.on);
  }
  function draw() {
    const st = S.steps[S.k], n = S.steps.length, X = lx();
    el.querySelector('#cfBars').innerHTML = S.steps.map((s, i) => `<i class="${s.dish} ${i < S.k ? 'done' : i === S.k ? 'cur' : ''}"></i>`).join('');
    const card = el.querySelector('#cfCard');
    if (!st) {
      card.innerHTML = `<div class="cf-fin"><div class="big">🍽️</div><h2>${X.bon}</h2><p>${X.bonP}</p><button class="btn primary block" id="cfDone">${X.finish} ✓</button></div>`;
      card.querySelector('#cfDone').onclick = () => close(true);
      if (!S.fin) { S.fin = true; save(); SFX.play('success'); H.onCooked(S.dish.country, S.dish.name, 0, S.dish.key); if (S.side) H.onCooked(S.side.country, S.side.name, 0, S.side.key); if (Voice.on) Voice.speak(X.bon); }
    } else {
      const lane = S.side ? `<span class="cf-lane ${st.dish}">${st.dish === 'A' ? '🍲 ' + X.main : '🥗 ' + X.side} · ${H.esc(nameOf(st.dish))}</span>` : '';
      const waitFor = S.side && st.dish === 'A' && S.timers.find(x => !x.rang && x.dish === 'A' && x.step < S.k);
      const mine = S.timers.find(x => x.step === S.k);
      card.innerHTML = `${lane}
        <div class="cf-sn">${X.step} ${S.k + 1} ${X.of} ${n}${S.side ? ` · ${H.esc(nameOf(st.dish))} ${st.i + 1}/${(st.dish === 'A' ? S.dish : S.side).st.length}` : ''}</div>
        <div class="cf-main"><div class="cf-ic">${ACT_ICON[st.act] || '🥄'}</div><p class="cf-text">${H.esc(st.text)}</p></div>
        ${st.ings.length ? `<div class="cf-ings"><small>${X.ings}</small>${st.ings.map(x => `<span>${H.esc(scaleLine(x, (S.f || 1)))}</span>`).join('')}</div>` : ''}
        ${st.cue ? `<div class="cf-cue"><b>🎯 ${X.cue}</b><span>${H.esc(st.cue)}</span></div>` : ''}
        <div class="cf-tip"><b>💡 ${X.tip}</b><span>${H.esc(st.tip)}</span></div>
        ${st.dur >= 30 && !mine ? `<button class="btn line block cf-tbtn" id="cfT">⏱ ${fmt(st.dur)} · ${X.timer}</button>` : ''}
        ${waitFor ? `<p class="cf-wait warn">⏳ ${H.esc(waitFor.label)}: ${fmt(left(waitFor))} · ${X.wait}</p>` : ''}
        ${st.passive && S.side && st.dish === 'A' ? `<p class="cf-wait">⏳ ${st.passive} ${X.min} · ${X.whileWait} ↓</p>` : ''}`;
      const tb = card.querySelector('#cfT'); if (tb) tb.onclick = () => { addTimer(st.dur, nameOf(st.dish), S.k); draw(); };
    }
    el.querySelector('#cfFlow').innerHTML = S.steps.map((s, i) => `<li class="${s.dish} ${i < S.k ? 'done' : i === S.k ? 'cur' : ''}" data-i="${i}"><span class="cf-dot">${i < S.k ? '✓' : i + 1}</span><span>${S.side ? `<em>${s.dish === 'A' ? '🍲' : '🥗'}</em> ` : ''}${H.esc(s.text)}</span></li>`).join('');
    el.querySelectorAll('#cfFlow li').forEach(li => li.onclick = () => go(+li.dataset.i));
    el.querySelector('#cfPrev').disabled = S.k === 0;
    el.querySelector('#cfNext').textContent = S.k >= n - 1 ? (S.k >= n ? X.finish : X.finish + ' ✓') : X.next + ' →';
    el.querySelector('#cfNext').style.display = S.k >= n ? 'none' : '';
    el.querySelector('#cfVid').dataset.d = st ? st.dish : 'A';
    const cur = el.querySelector('#cfFlow li.cur'); if (cur) cur.scrollIntoView({ block: 'nearest' });
    drawTimers(); drawHead();
  }
  function read() {
    const st = S.steps[S.k]; if (!st) return;
    Voice.speak(`${S.side ? nameOf(st.dish) + '. ' : ''}${st.text}. ${st.tip}`);
  }
  function go(k) {
    const prev = S.steps[S.k];
    // a waiting step (menu) starts its timer when you move on
    if (k > S.k && prev && prev.passive && S.side) addTimer(prev.passive * 60, nameOf(prev.dish), S.k);
    S.k = Math.max(0, Math.min(S.steps.length, k)); S.at = Date.now(); save();
    SFX.play('pop'); draw(); el.querySelector('.cf-body').scrollTop = 0;
    if (Voice.on) read();
  }
  function close(finished) {
    stopRing(); clearInterval(tick); tick = null; Voice.stop(); H.keepAwake(false);
    if (finished) { S.timers.forEach(nativeCancel); try { localStorage.removeItem(KEY); } catch (e) { } }
    else save();
    const e = el; el = null; if (e && H.stack().includes(e)) H.back();
  }
  function mount(state) {
    S = state;
    const X = lx();
    const title = S.side ? `${S.dish.name} + ${S.side.name}` : S.dish.name;
    el = H.pushPage(`<div class="cf">
      <div class="cf-top"><button class="round" id="cfX">✕</button><div class="cf-title"><b>${H.esc(title)}</b></div>
        <button class="round" id="cfBell" aria-label="alarm">🔔</button><button class="round" id="cfVoice" aria-label="voice">🎙️</button></div>
      <div class="cf-bars" id="cfBars"></div>
      <div class="cf-timers" id="cfTimers"></div>
      <div class="cf-body">
        <div class="cf-card" id="cfCard"></div>
        <button class="btn ghost block cf-vid" id="cfVid">📺 ${X.video}</button>
        <h4 class="cf-fh">${X.flow}</h4><ol class="cf-flow" id="cfFlow"></ol>
      </div>
      <div class="cf-nav"><button class="btn line" id="cfPrev">← ${X.prev}</button><button class="btn primary" id="cfNext"></button></div>
    </div>`, null, 'cfpage');
    if (!el) return;
    el._onClose = () => { if (el) { const e = el; el = null; stopRing(); clearInterval(tick); tick = null; Voice.stop(); H.keepAwake(false); save(); } };
    H.keepAwake(true);
    el.querySelector('#cfX').onclick = () => close(false);
    el.querySelector('#cfPrev').onclick = () => go(S.k - 1);
    el.querySelector('#cfNext').onclick = () => go(S.k + 1);
    el.querySelector('#cfBell').onclick = () => setAlarms(!S.alarms);
    el.querySelector('#cfVid').onclick = e => { const d = e.currentTarget.dataset.d === 'B' ? S.side : S.dish; location.href = videoUrl(d); };
    el.querySelector('#cfTimers').onclick = e => {
      const b = e.target.closest('button'), row = e.target.closest('.cf-timer'); if (!b || !row) return;
      timerAct(+row.dataset.id, b.dataset.a === 'pp' ? b.dataset.v : b.dataset.a);
    };
    el.querySelector('#cfVoice').onclick = () => {
      if (Voice.on) { Voice.stop(); drawHead(); return; }
      Voice.start(H.lang, cmd => {
        if (!el) return;
        if (cmd === 'next') go(S.k + 1); else if (cmd === 'prev') go(S.k - 1); else if (cmd === 'repeat') read();
        else if (cmd === 'timer') { const st = S.steps[S.k]; if (st && st.dur) { addTimer(st.dur, nameOf(st.dish), S.k); draw(); } }
        else if (cmd === 'stop') { const r = S.timers.find(x => x.rang); if (r) timerAct(r.id, 'stop'); }
      });
      H.toast('🎙️ ' + X.voiceOn); drawHead(); read();
    };
    // timers that ran out while the app was closed
    S.timers.forEach(x => { if (x.pausedLeft == null && left(x) <= 0 && !x.rang) x.rang = true; });
    draw();
    tick = setInterval(onTick, 1000); onTick();
  }
  // native alarm fired while the app is open
  window.LAB_ALARM_FIRED = id => { if (S && el) { const x = S.timers.find(t => t.id === +id); if (x) { x.rang = true; onTick(); } } };
  window.LAB_PAUSE = () => save();

  return {
    init(h) { H = h; },
    open(dish, side) {
      if (S && S.timers) S.timers.forEach(nativeCancel);
      stopRing();
      const st = build(dish, side); st.f = dish.f || 1; mount(st);
    },
    pending() {
      try { const p = JSON.parse(localStorage.getItem(KEY) || 'null'); if (p && p.v === 1 && !p.fin && (p.k > 0 || p.timers.length) && Date.now() - p.at < 12 * 3600e3) return p; } catch (e) { }
      return null;
    },
    resume(p) { stopRing(); mount(p); },
    contLabel: () => lx().cont,
    label: k => lx()[k],
    videoUrl,
    get open_() { return !!el; },
  };
})();
