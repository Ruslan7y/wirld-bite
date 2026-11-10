/* Hands-free voice assistant: the chef reads steps aloud and listens for
   "next / back / repeat / timer / stop" (TR, AZ, EN, RU).
   On Android it uses the phone's own TextToSpeech + SpeechRecognizer through the app bridge;
   in a browser it falls back to the Web Speech API when available. */
window.WB = window.WB || {};
const Voice = (() => {
  const TAG = { tr: 'tr-TR', az: 'az-AZ', en: 'en-US', ru: 'ru-RU' };
  const CMD = {
    next: /(sonraki|ileri|devam|geç|tamam|next|continue|okay|дальше|далее|следующ|готово|növbəti|irəli|davam)/,
    prev: /(geri|önceki|back|previous|назад|предыдущ|əvvəlki)/,
    repeat: /(tekrar|bir daha|repeat|again|повтор|ещё раз|təkrar)/,
    timer: /(zamanlayıcı|süreyi başlat|saat kur|timer|таймер|taymer)/,
    stop: /(dur(dur)?|kapat|sus|stop|quiet|стоп|хватит|замолчи|dayan|bağla)/
  };
  let on = false, lang = 'tr', handler = null, afterSpeak = null, rec = null, speaking = false;
  const native = () => !!(window.Android && Android.speak);
  const nativeListen = () => !!(window.Android && Android.listen && (!Android.hasRecognizer || Android.hasRecognizer()));

  function speak(text, cb) {
    stopListen(); speaking = true; afterSpeak = cb || null;
    if (native()) { try { Android.speak(String(text), TAG[lang]); return; } catch (e) {} }
    if (window.speechSynthesis) {
      try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(text)); u.lang = TAG[lang]; u.rate = 1; u.onend = u.onerror = () => WB.onSpeakDone(); speechSynthesis.speak(u); return; } catch (e) {}
    }
    WB.onSpeakDone();
  }
  WB.onSpeakDone = () => { speaking = false; const c = afterSpeak; afterSpeak = null; c && c(); if (on) setTimeout(listen, 250); };

  function listen() {
    if (!on || speaking) return;
    if (nativeListen()) { try { Android.listen(TAG[lang]); return; } catch (e) {} }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
    try {
      rec = new SR(); rec.lang = TAG[lang]; rec.interimResults = false; rec.maxAlternatives = 3;
      rec.onresult = e => WB.onVoice([...e.results[0]].map(r => r.transcript));
      rec.onend = () => { rec = null; if (on && !speaking) setTimeout(listen, 500); };
      rec.start();
    } catch (e) {}
  }
  function stopListen() { try { window.Android && Android.stopListen && Android.stopListen(); } catch (e) {} try { rec && rec.abort(); } catch (e) {} rec = null; }
  WB.onVoice = list => {
    const txt = (list || []).join(' ').toLocaleLowerCase(lang);
    let cmd = null; for (const k of ['stop', 'prev', 'repeat', 'timer', 'next']) if (CMD[k].test(txt)) { cmd = k; break; }
    if (cmd && handler) handler(cmd, txt);
    if (on && !speaking) setTimeout(listen, 400);
  };
  WB.onVoiceEnd = (e) => { if (on && !speaking) setTimeout(listen, 700); };

  return {
    available: () => native() || !!window.speechSynthesis,
    canListen: () => nativeListen() || !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    start(l, h) { lang = l; handler = h; on = true; },
    stop() { on = false; handler = null; stopListen(); try { window.Android && Android.stopSpeak && Android.stopSpeak(); } catch (e) {} try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {} speaking = false; },
    speak, get on() { return on; }
  };
})();
