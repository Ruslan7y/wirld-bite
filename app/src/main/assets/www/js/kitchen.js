/* World Bite — animated kitchen
   Turns any recipe (ingredients + steps text) into an animated cooking scene:
   mise en place → ingredients fly into the right vessel and leave the list → action animation
   (crack, whisk, chop, fry, boil, bake…) → consistency hint, duration + in-app timer, skip →
   garnish → plated serving → "see it on my table" with the camera. */
const Kitchen = (() => {
  'use strict';
  const BL = '(?<!\\p{L})', BR = '(?!\\p{L})';
  const low = s => String(s).toLocaleLowerCase('tr');

  /* ---------- actions: detected from the step text (Turkish) ---------- */
  const ACT = [
    { id: 'serve', re: /servis ed|servis yap|ile servis|sunun|sıcak servis|soğuk servis|hemen servis|ile yiyin|elle yiyin|batırarak yiyin|ile yenir|\bserve\b|plate it|подав/, v: 'plate' },
    { id: 'bake', re: /fırın|°c|fırınla|\bbake|oven|духов|запек/, v: 'oven' },
    { id: 'grill', re: /ızgara|köz|şiş|mangal|közle|grill|gril|гриль/, v: 'grill' },
    { id: 'steam', re: /buhar|steam|пару/, v: 'steamer' },
    { id: 'fry', re: /kızart|kavur|sotele|mühürle|karamelize|tavada|wok|tavaya|kızgın yağ|\bfry|fried|sauté|saute|sear|brown the|pan-fry|обжар|жар/, v: 'pan' },
    { id: 'boil', re: /haşla|kaynat|kaynar su|demle|pişir|kısık ateş|tencere|\bboil|simmer|\bcook|вари|кипя/, v: 'pot' },
    { id: 'layer', re: /kat kat|\d+ kat|katları|serin|tepsiye yay|yayın|dizin|yerleştir|layer|arrange/, v: 'tray' },
    { id: 'whisk', re: /çırp|köpürt|mikser|krema kıvam|whisk|\bbeat|взбе/, v: 'bowl' },
    { id: 'knead', re: /yoğur|knead|замес/, v: 'board' },
    { id: 'roll', re: /oklava|ince açın|inceliğinde açın|açıp|yuvarlak açın|oval açın|kare açın|dikdörtgen açın|açın/, v: 'board', need: /hamur|yufka|beze|parça|top|açın/ },
    { id: 'chop', re: /doğra|kıyın|kıyıp|kıyılmış|dilimle|dilimler|rendele|kesin|küp |jülyen|soyun|ayıklayın|\bchop|slice|dice|grate|\bcut|peel|нареж|натр/, v: 'board' },
    { id: 'wrap', re: /sarın|sarıp|sar\b|doldur|kapatın|katlay|bohça|rulo|\bwrap|\bfill|\bfold|stuff|roll up|завер/, v: 'board' },
    { id: 'rest', re: /dinlendir|beklet|mayalan|soğut|bir gece|buzdolab|marine|fermente|\brest|chill|marinat|let it|cool|остуд|дайте/, v: 'bowl' },
    { id: 'garnish', re: /serp|süsle|gezdir|üzerine .* koy|garnish|sprinkle|drizzle|top with|посып|украс/, v: 'plate' },
    { id: 'mix', re: /karıştır|ekle|katın|katıp|birleştir|yedir|ezin|ez\b|blender|macun|\bmix|\bstir|\badd|combine|blend|mash|смеш|добав/, v: 'bowl' }
  ];
  const LABEL = {
    tr: { layer: 'Katlama & dizme', crack: 'Kırma', whisk: 'Çırpma', mix: 'Karıştırma', chop: 'Doğrama', knead: 'Yoğurma', roll: 'Hamur açma', fry: 'Kızartma', boil: 'Kaynatma', bake: 'Fırında pişirme', grill: 'Izgara', steam: 'Buharda pişirme', wrap: 'Sarma & doldurma', rest: 'Dinlendirme', garnish: 'Süsleme', serve: 'Servis' },
    az: { layer: 'Qat-qat düzmə', crack: 'Sındırma', whisk: 'Çalma', mix: 'Qarışdırma', chop: 'Doğrama', knead: 'Yoğurma', roll: 'Xəmir açma', fry: 'Qızartma', boil: 'Qaynatma', bake: 'Sobada bişirmə', grill: 'Manqal', steam: 'Buxarda bişirmə', wrap: 'Bükmə', rest: 'Dincəltmə', garnish: 'Bəzəmə', serve: 'Süfrəyə vermə' },
    en: { layer: 'Layer & arrange', crack: 'Crack', whisk: 'Whisk', mix: 'Mix', chop: 'Chop', knead: 'Knead', roll: 'Roll out', fry: 'Fry', boil: 'Boil', bake: 'Bake', grill: 'Grill', steam: 'Steam', wrap: 'Wrap & fill', rest: 'Rest', garnish: 'Garnish', serve: 'Serve' },
    ru: { layer: 'Выложить слоями', crack: 'Разбить', whisk: 'Взбить', mix: 'Смешать', chop: 'Нарезать', knead: 'Замесить', roll: 'Раскатать', fry: 'Обжарить', boil: 'Варить', bake: 'Запечь', grill: 'Гриль', steam: 'На пару', wrap: 'Завернуть', rest: 'Дать постоять', garnish: 'Украсить', serve: 'Подача' }
  };
  const ICON = { layer: '🥧', crack: '🥚', whisk: '🌀', mix: '🥄', chop: '🔪', knead: '👐', roll: '🪵', fry: '🍳', boil: '♨️', bake: '🔥', grill: '🔥', steam: '💨', wrap: '🌯', rest: '⏳', garnish: '🌿', serve: '🍽️' };
  const HINT = {
    layer: 'Katlar eşit ve düz olmalı; her kat ince ve kenarlara kadar yayılmalı.',
    crack: 'Kabuk parçası kalmamalı; sarısı bütün ya da hafif dağılmış olabilir.',
    whisk: 'Hafif, köpüklü ve tamamen homojen olmalı.',
    mix: 'Topak kalmayana kadar, malzemeler eşit dağılmalı.',
    chop: 'Parçalar eşit boyutta olmalı ki aynı sürede pişsin.',
    knead: 'Ele yapışmayan, esnek ve pürüzsüz bir hamur.',
    roll: 'Her yerde eşit kalınlıkta, yırtılmadan açılmalı.',
    fry: 'Kenarlar altın rengi, yağ cızırdıyor ama yanmıyor.',
    boil: 'Kaynamaya başlayınca ocağı kısıp hafif fokurdatın.',
    bake: 'Üstü altın rengi; kürdan batırınca temiz çıkmalı.',
    grill: 'Belirgin ızgara izleri, içi sulu kalmalı.',
    steam: 'Kapak kapalı; buhar sürekli olmalı.',
    wrap: 'Sıkı sarın ki pişerken açılmasın.',
    rest: 'Hacmi artmalı ya da tatlar birbirine geçmeli.',
    garnish: 'Az ama dengeli; renk kontrastı oluşturun.',
    serve: 'Sıcak tabakta, yanındaki eşlikçilerle sunun.'
  };
  const COLORS = { '🥚': '#F6C945', '🌾': '#F3E9D2', '🥛': '#FBFAF4', '🧈': '#F7E39A', '🍫': '#6B3E26', '🍅': '#E8452C', '🥩': '#B5483B', '🍖': '#A8513F', '🍗': '#E3A66E', '🐟': '#F2C6A0', '🦐': '#F49B7A', '🍚': '#F5F3EA', '🥬': '#6BAF4B', '🧅': '#EBD9B4', '🌶️': '#D63B2A', '🥕': '#F08A24', '🍆': '#6B3FA0', '🥔': '#E9D08A', '🧀': '#F8D66D', '🍯': '#E9A23B', '🍬': '#FFFDF7', '🫘': '#8B4A3C', '🥜': '#C8935A', '🥥': '#F7F3EA', '💧': '#CFE8F7', '🫗': '#F1D36B', '🫒': '#9BAA3A', '🍞': '#D9A86A', '🍝': '#F1D79A', '🌽': '#F5C842', '🍌': '#F3D560', '🥣': '#FAF6EE', '🌰': '#9B6B43', '🍠': '#E59A5B', '🥫': '#C2452D', '🌿': '#4F9A3A' };
  const STOP = new Set(['taze', 'kuru', 'ince', 'iri', 'büyük', 'küçük', 'için', 'veya', 'isteğe', 'bağlı', 'sıcak', 'soğuk', 'ılık', 'yağlı', 'kemikli', 'kemiksiz', 'parça', 'doğranmış', 'rendelenmiş', 'haşlanmış', 'kızartılmış', 'dilim', 'adet', 'tane', 'kaba', 'yemek', 'kaşığı', 'tatlı', 'çay', 'bardağı', 'paket', 'demet', 'diş', 'baş', 'kutu', 'tutam', 'avuç', 'litre', 'gram', 'tercihen', 'yumuşak', 'eritilmiş', 'çekilmiş', 'öğütülmüş', 'ezilmiş', 'kavrulmuş', 'olgun', 'bütün', 'yarım', 'kalın', 'ayrılmış', 'soyulmuş', 'temiz', 'sade', 'beyaz', 'kırmızı', 'yeşil', 'siyah', 'sarı', 'tatlı', 'acı', 'tuzlu', 'şekersiz', 'yerel', 'karışık', 'tavsiye', 'adet', 'kase', 'dal']);

  const fmtT = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };

  function ingKeys(line) {
    const words = low(line).replace(/\(.*?\)/g, ' ').replace(/^[^:]{0,22}:/, ' ').replace(/[\d½¼¾⅓⅔.,;:%+\-–/]/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w) && !/^(g|gr|kg|ml|l|lt|cm)$/.test(w));
    return words.slice(0, 4).map(w => w.length <= 3 ? new RegExp(BL + w + '\\p{L}{0,3}' + BR, 'u') : new RegExp(BL + w.slice(0, Math.max(4, Math.min(6, w.length - 1))), 'u'));
  }
  function shortName(line) {
    let s = line.replace(/^[^:]{0,22}:\s*/, '').replace(/\(.*?\)/g, '').trim();
    s = s.replace(/^[\d½¼¾⅓⅔.,\-–\s]+(kg|g|gr|ml|litre|l|su bardağı|yemek kaşığı|tatlı kaşığı|çay kaşığı|paket|demet|diş|baş|dilim|kutu|tutam|avuç|adet|kase)?(?=\s|$)\s*/i, '');
    return s.length > 26 ? s.slice(0, 24) + '…' : s;
  }
  function detect(step) {
    const s = low(step);
    for (const a of ACT) if (a.re.test(s) && (!a.need || a.need.test(s))) return a;
    return { id: 'mix', v: 'bowl' };
  }
  function duration(step) {
    const s = low(step);
    if (/bir gece|overnight/.test(s)) return 8 * 3600;
    const m = s.match(/(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?\s*(dk|dakika|sn|saniye|saat|gün|minutes|minute|mins|min|hours|hour|hrs|seconds|sec|мин|час|сек)/);
    if (!m) return 0;
    const v = parseFloat((m[2] || m[1]).replace(',', '.')), u = m[3];
    return Math.round(v * (/^(saat|hour|hr|час)/.test(u) ? 3600 : u === 'gün' ? 86400 : /^(sn|saniye|sec|сек)/.test(u) ? 1 : 60));
  }
  function consistency(step, act) {
    const parts = step.split(/[,;]| ve (?=\p{L})/u).map(x => x.trim()).filter(Boolean);
    const p = parts.find(x => /kadar|olunca|kıvam|gibi|rengi|pürüzsüz|çıtır|homojen|esnek|köpük|şeffaf|yumuşa|koyulaş|kabar|yüzeye|çekene|eriy|parlak|kalmalı|kalsın|until|golden|smooth|crisp|tender|thick|fluffy|bubbl|до |пока/.test(low(x)));
    return p ? p.charAt(0).toLocaleUpperCase('tr') + p.slice(1) : HINT[act];
  }

  /* ---------- vessels (SVG, viewBox 0 0 360 240) ---------- */
  const V = {
    bowl: `<ellipse cx="180" cy="212" rx="112" ry="12" fill="rgba(0,0,0,.12)"/>
      <path d="M70 118 Q76 212 180 212 Q284 212 290 118 Z" fill="#EDEFF3"/><path d="M70 118 Q76 212 180 212 Q284 212 290 118" fill="none" stroke="#C9CED8" stroke-width="3"/>
      <ellipse cx="180" cy="118" rx="110" ry="24" fill="#D9DDE5"/><ellipse class="k-content" cx="180" cy="126" rx="94" ry="16"/>`,
    pan: `<ellipse cx="170" cy="200" rx="120" ry="12" fill="rgba(0,0,0,.12)"/>
      <rect x="268" y="132" width="86" height="14" rx="7" fill="#3A3F48"/>
      <ellipse cx="170" cy="150" rx="112" ry="40" fill="#2E333B"/><ellipse cx="170" cy="144" rx="100" ry="32" fill="#454B55"/>
      <ellipse class="k-content" cx="170" cy="146" rx="84" ry="24"/>`,
    pot: `<ellipse cx="180" cy="222" rx="104" ry="11" fill="rgba(0,0,0,.12)"/>
      <rect x="62" y="96" width="22" height="12" rx="6" fill="#6B7280"/><rect x="276" y="96" width="22" height="12" rx="6" fill="#6B7280"/>
      <path d="M80 92 L80 196 Q80 218 110 218 L250 218 Q280 218 280 196 L280 92 Z" fill="#9CA3AF"/>
      <ellipse cx="180" cy="92" rx="100" ry="20" fill="#6B7280"/><ellipse class="k-content" cx="180" cy="98" rx="88" ry="14"/>`,
    oven: `<rect x="60" y="20" width="240" height="205" rx="18" fill="#3A3F48"/><rect x="74" y="36" width="212" height="16" rx="6" fill="#2B2F36"/>
      <circle cx="96" cy="44" r="5" fill="#9CA3AF"/><circle cx="116" cy="44" r="5" fill="#9CA3AF"/><circle cx="264" cy="44" r="5" fill="#9CA3AF"/>
      <rect class="k-window" x="84" y="66" width="192" height="140" rx="12" fill="#1F2329"/>
      <rect x="108" y="160" width="144" height="10" rx="3" fill="#6B7280"/><ellipse class="k-content" cx="180" cy="154" rx="62" ry="12"/>
      <rect x="84" y="66" width="192" height="140" rx="12" fill="url(#kGlass)"/>`,
    board: `<ellipse cx="180" cy="214" rx="140" ry="10" fill="rgba(0,0,0,.12)"/>
      <rect x="40" y="110" width="280" height="96" rx="20" fill="#C98E55"/><rect x="40" y="110" width="280" height="88" rx="20" fill="#DDA86B"/>
      <circle cx="300" cy="134" r="7" fill="#C98E55"/>
      <path d="M70 140 Q160 134 250 142 M80 168 Q170 162 270 170" stroke="#C98E55" stroke-width="2" fill="none" opacity=".6"/>
      <ellipse class="k-content k-dough" cx="170" cy="156" rx="0" ry="0"/>`,
    grill: `<ellipse cx="180" cy="220" rx="130" ry="10" fill="rgba(0,0,0,.12)"/>
      <rect x="50" y="120" width="260" height="92" rx="14" fill="#2B2F36"/><rect x="62" y="132" width="236" height="60" rx="8" fill="#7C2D12" class="k-coals"/>
      <g stroke="#9CA3AF" stroke-width="4">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<line x1="${72 + i * 30}" y1="122" x2="${72 + i * 30}" y2="196"/>`).join('')}</g>
      <ellipse class="k-content" cx="180" cy="156" rx="0" ry="0"/>`,
    steamer: `<ellipse cx="180" cy="220" rx="110" ry="10" fill="rgba(0,0,0,.12)"/>
      <rect x="80" y="110" width="200" height="104" rx="16" fill="#D8B26E"/><rect x="80" y="140" width="200" height="8" fill="#BE9552"/><rect x="80" y="180" width="200" height="8" fill="#BE9552"/>
      <ellipse cx="180" cy="110" rx="100" ry="18" fill="#E6C788"/><ellipse class="k-content" cx="180" cy="112" rx="80" ry="12"/>`,
    tray: `<ellipse cx="180" cy="214" rx="140" ry="10" fill="rgba(0,0,0,.12)"/>
      <path d="M50 120 L310 120 L290 206 L70 206 Z" fill="#9CA3AF"/><path d="M62 128 L298 128 L282 198 L78 198 Z" fill="#6B7280"/>
      <path class="k-content" d="M74 140 L286 140 L274 190 L86 190 Z"/>`,
    plate: `<ellipse cx="180" cy="200" rx="138" ry="16" fill="rgba(0,0,0,.12)"/>
      <ellipse cx="180" cy="160" rx="140" ry="52" fill="#FFFFFF"/><ellipse cx="180" cy="160" rx="140" ry="52" fill="none" stroke="#E5E7EB" stroke-width="3"/>
      <ellipse cx="180" cy="160" rx="100" ry="34" fill="#F7F7F8"/><ellipse class="k-content" cx="180" cy="158" rx="76" ry="24"/>`
  };
  const CONTENT_CENTER = { tray: [180, 162], bowl: [180, 122], pan: [170, 144], pot: [180, 96], oven: [180, 150], board: [170, 152], grill: [180, 156], steamer: [180, 110], plate: [180, 156] };

  /* ---------- effects ---------- */
  function effectHTML(act, vessel) {
    const c = CONTENT_CENTER[vessel] || [180, 130];
    const L = c[0] / 3.6, T = c[1] / 2.4; // percentages
    const flames = `<div class="fx-flames">${[0, 1, 2, 3, 4].map(i => `<i style="left:${30 + i * 10}%;animation-delay:${i * 0.12}s"></i>`).join('')}</div>`;
    const steam = n => `<div class="fx-steam" style="left:${L}%;top:${T - 18}%">${Array.from({ length: n }, (_, i) => `<i style="left:${(i - n / 2) * 18}px;animation-delay:${i * 0.5}s"></i>`).join('')}</div>`;
    const bubbles = (n, area) => `<div class="fx-bubbles" style="left:${L}%;top:${T}%">${Array.from({ length: n }, (_, i) => `<i style="left:${(Math.random() - .5) * area}px;top:${(Math.random() - .5) * 18}px;animation-delay:${(Math.random() * 1.2).toFixed(2)}s;width:${6 + Math.random() * 8}px;height:${6 + Math.random() * 8}px"></i>`).join('')}</div>`;
    switch (act) {
      case 'whisk': return `<div class="fx-swirl" style="left:${L}%;top:${T}%"></div><div class="fx-tool fx-whisk" style="left:${L}%;top:${T - 34}%">${WHISK}</div>`;
      case 'mix': return `<div class="fx-swirl slow" style="left:${L}%;top:${T}%"></div><div class="fx-tool fx-spoon" style="left:${L}%;top:${T - 26}%">🥄</div>`;
      case 'chop': return `<div class="fx-tool fx-knife" style="left:${L + 6}%;top:${T - 30}%">🔪</div><div class="fx-crumbs" style="left:${L - 8}%;top:${T}%"></div>`;
      case 'knead': return `<div class="fx-tool fx-hands" style="left:${L}%;top:${T - 22}%">👐</div>`;
      case 'roll': return `<div class="fx-tool fx-pin" style="left:${L}%;top:${T - 12}%">${PIN}</div>`;
      case 'fry': return flames + bubbles(14, 140) + steam(3);
      case 'boil': return flames + bubbles(18, 150) + steam(4);
      case 'bake': return `<div class="fx-heat"></div>` + steam(3);
      case 'grill': return `<div class="fx-grillfire">${[0, 1, 2, 3, 4, 5].map(i => `<i style="left:${22 + i * 11}%;animation-delay:${i * 0.15}s"></i>`).join('')}</div>` + steam(3);
      case 'steam': return steam(6);
      case 'layer': return `<div class="fx-layers" style="left:${L}%;top:${T}%">${[0, 1, 2, 3].map(i => `<i style="animation-delay:${i * 0.45}s"></i>`).join('')}</div>`;
      case 'wrap': return `<div class="fx-tool fx-wrap" style="left:${L}%;top:${T - 16}%">🌯</div>`;
      case 'rest': return `<div class="fx-tool fx-clock" style="left:${L + 22}%;top:${T - 40}%">⏳</div><div class="fx-zzz" style="left:${L + 10}%;top:${T - 30}%">z<br>&nbsp;z<br>&nbsp;&nbsp;z</div>`;
      case 'garnish': return `<div class="fx-sprinkle" style="left:${L}%;top:${T - 40}%">${Array.from({ length: 16 }, (_, i) => `<i style="left:${(Math.random() - .5) * 160}px;animation-delay:${(Math.random() * 1.6).toFixed(2)}s">${['🌿', '✨', '·', '🌿'][i % 4]}</i>`).join('')}</div>`;
      default: return '';
    }
  }
  const WHISK = `<svg viewBox="0 0 60 120" width="60" height="120"><rect x="26" y="0" width="8" height="46" rx="4" fill="#4B5563"/><g fill="none" stroke="#9CA3AF" stroke-width="3"><path d="M30 46 C8 70 10 112 30 116 C50 112 52 70 30 46Z"/><path d="M30 46 C18 70 20 110 30 116 C40 110 42 70 30 46Z"/><path d="M30 46 L30 116"/></g></svg>`;
  const PIN = `<svg viewBox="0 0 220 40" width="220" height="40"><rect x="0" y="14" width="34" height="12" rx="6" fill="#B07A45"/><rect x="186" y="14" width="34" height="12" rx="6" fill="#B07A45"/><rect x="30" y="4" width="160" height="32" rx="16" fill="#E2B27A"/><rect x="30" y="4" width="160" height="10" rx="5" fill="#EEC895"/></svg>`;

  /* ---------- sound & vibration for the timer ---------- */
  function beep() {
    try { const a = new (window.AudioContext || window.webkitAudioContext)(); [0, .35, .7].forEach(d => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.25, a.currentTime + d); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + d + .3); o.start(a.currentTime + d); o.stop(a.currentTime + d + .3); }); } catch (e) {}
    try { navigator.vibrate && navigator.vibrate([300, 150, 300, 150, 500]); } catch (e) {}
  }

  /* =================== open the kitchen =================== */
  function open(R, ctx) {
    const { t, esc, lang } = ctx;
    const L = LABEL[lang] || LABEL.tr;
    const cook = R.ing.filter(x => !/^servis/i.test(x.trim()));
    const sides = R.ing.filter(x => /^servis/i.test(x.trim())).map(x => x.replace(/^servis[^:]*:\s*/i, ''));
    const items = [];
    cook.forEach(line => {
      const g = (line.match(/^([^:]{2,22}):/) || [])[1];
      const parts = line.replace(/^[^:]{2,22}:\s*/, '').split(/,(?!\d)|;/).map(x => x.trim()).filter(Boolean);
      parts.forEach(part => {
        const keys = ingKeys(part); if (g) keys.push(...ingKeys(g));
        items.push({ i: items.length, line: (g ? g + ': ' : '') + part, name: shortName(part), emoji: ingEmoji(part), keys, used: false });
      });
    });
    const steps = R.st.map(st => { const a = detect(st); return { text: st, act: a.id, vessel: a.v, dur: duration(st), hint: consistency(st, a.id) }; });
    const servingText = (R.st.slice().reverse().find(s => /servis|sunun|yiyin|yenir/i.test(s)) || '').trim();
    let idx = -1, vessel = 'bowl', content = [], timer = null, playing = null;

    const el = ctx.pushPage(`
      <div class="k-top"><button class="round" data-back>✕</button><div class="k-title"><b>${esc(R.name)}</b><small id="kSub">${esc(R.country || '')}</small></div><button class="round" id="kList">🧺</button></div>
      <div class="k-bar"><i id="kBar"></i></div>
      <div class="k-stage" id="kStage">
        <svg class="k-svg" viewBox="0 0 360 240" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="kGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><g id="kVessel"></g></svg>
        <div class="k-items" id="kItems"></div><div class="k-fx" id="kFx"></div><div class="k-fly" id="kFly"></div>
        <div class="k-badge" id="kBadge"></div>
      </div>
      <div class="k-tray" id="kTray"></div>
      <div class="k-card" id="kCard"></div>
      <div class="k-nav" id="kNav"></div>`, () => {}, 'kitchen');
    if (!el) return;
    ctx.keepAwake(true);
    el._onClose = () => { ctx.keepAwake(false); stopTimer(); stopCamera(); };
    const $ = s => el.querySelector(s);

    function drawTray(highlight) {
      const left = items.filter(x => !x.used);
      $('#kTray').innerHTML = left.length ? left.map(x => `<span class="k-chip ${highlight && highlight.includes(x) ? 'hl' : ''}" data-i="${x.i}">${x.emoji}<b>${esc(x.name)}</b></span>`).join('') : `<span class="k-empty">✓ ${t('allUsed')}</span>`;
      $('#kList').dataset.n = left.length;
    }
    function setVessel(v) {
      if (v === vessel && $('#kVessel').innerHTML) return;
      vessel = v;
      const g = $('#kVessel'); g.style.animation = 'none'; g.innerHTML = V[v]; g.style.animation = '';
      g.classList.remove('k-in'); void g.offsetWidth; g.classList.add('k-in');
      paintContent();
      $('#kItems').innerHTML = '';
      if (content.length) content.slice(-6).forEach(e => dropEmoji(e, true));
    }
    function paintContent() {
      const c = $('.k-content', el); if (!c) return;
      const hex = content.length ? mix(content.map(e => COLORS[e] || '#D9B88F')) : null;
      if (vessel === 'board' || vessel === 'grill') {
        const on = content.length > 0; c.setAttribute('rx', on ? 70 : 0); c.setAttribute('ry', on ? 22 : 0);
      }
      c.setAttribute('fill', hex || 'transparent'); c.style.transition = 'fill .6s';
    }
    function mix(list) { let r = 0, g = 0, b = 0; list.forEach(h => { r += parseInt(h.slice(1, 3), 16); g += parseInt(h.slice(3, 5), 16); b += parseInt(h.slice(5, 7), 16); }); const n = list.length; return '#' + [r, g, b].map(x => Math.round(x / n).toString(16).padStart(2, '0')).join(''); }
    function dropEmoji(e, quiet) {
      const c = CONTENT_CENTER[vessel], box = $('#kItems');
      const s = document.createElement('span'); s.textContent = e; s.className = 'k-in-item' + (quiet ? ' quiet' : '');
      s.style.left = (c[0] / 3.6 + (Math.random() - .5) * 26) + '%'; s.style.top = (c[1] / 2.4 + (Math.random() - .5) * 8) + '%';
      box.appendChild(s); if (box.children.length > 7) box.firstChild.remove();
    }
    function fly(item) {
      return new Promise(res => {
        const chip = $(`.k-chip[data-i="${item.i}"]`), stage = $('#kStage').getBoundingClientRect();
        const from = chip ? chip.getBoundingClientRect() : { left: stage.left + 20, top: stage.bottom, width: 30, height: 30 };
        const c = CONTENT_CENTER[vessel];
        const tx = stage.left + stage.width * c[0] / 360, ty = stage.top + stage.height * c[1] / 240;
        const f = document.createElement('div'); f.className = 'k-flyer'; f.innerHTML = item.emoji === '🥚' ? EGG : item.emoji;
        $('#kFly').appendChild(f);
        const x0 = from.left - stage.left + from.width / 2, y0 = from.top - stage.top + from.height / 2, x1 = tx - stage.left, y1 = ty - stage.top;
        if (chip) chip.classList.add('going');
        const egg = item.emoji === '🥚';
        const anim = f.animate([
          { transform: `translate(${x0}px,${y0}px) scale(.8)` },
          { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 70}px) scale(1.25)`, offset: .55 },
          { transform: `translate(${x1}px,${y1 - (egg ? 40 : 0)}px) scale(${egg ? 1.3 : 1})` }
        ], { duration: 750, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' });
        anim.onfinish = () => {
          if (egg) { f.classList.add('crack'); setTimeout(() => { f.remove(); finish(); }, 650); } else { f.remove(); finish(); }
        };
        function finish() { item.used = true; content.push(item.emoji); paintContent(); dropEmoji(item.emoji); drawTray(); res(); }
      });
    }
    const EGG = `<div class="egg"><i class="sh l"></i><i class="sh r"></i><i class="yolk"></i></div>`;

    function stepIngredients(st, i) {
      const s = low(st.text), left = items.filter(x => !x.used);
      if (/tüm malzeme|bütün malzeme|hepsini|malzemeleri karıştır|tüm hamur malzeme/.test(s)) return left;
      let hit = left.filter(x => x.keys.some(k => k.test(s)));
      return hit;
    }

    /* ---------- screens ---------- */
    function intro() {
      idx = -1; setVessel('board'); $('#kFx').innerHTML = ''; $('#kBar').style.width = '0';
      $('#kBadge').innerHTML = '';
      drawTray();
      $$('.k-chip', el).forEach((c, i) => { c.style.animationDelay = (i * 0.07) + 's'; c.classList.add('pop'); });
      $('#kItems').innerHTML = `<div class="k-mise">${items.slice(0, 8).map((x, i) => `<span style="animation-delay:${i * 0.12}s">${x.emoji}</span>`).join('')}</div>`;
      const n = R.nutri;
      $('#kCard').innerHTML = `<div class="k-intro"><h2>${t('miseTitle')}</h2><p>${t('miseText', { n: items.length, s: steps.length })}</p>
        <div class="k-meta"><span>⏱ ${R.time || ''}</span><span>👥 ${R.servings} ${t('servings')}</span>${n ? `<span>🔥 ${n.kcal} kcal</span>` : ''}</div></div>`;
      $('#kNav').innerHTML = `<button class="btn primary block k-go" id="kStart">▶ ${t('startCooking')}</button>`;
      $('#kStart').onclick = () => go(0);
    }
    async function go(i) {
      stopTimer();
      if (i >= steps.length) return serve();
      idx = i; const st = steps[i], token = {}; playing = token;
      $('#kBar').style.width = ((i + 1) / (steps.length + 1) * 100) + '%';
      $('#kSub').textContent = t('stepOf', { i: i + 1, n: steps.length });
      const need = stepIngredients(st, i);
      drawTray(need);
      setVessel(st.vessel);
      $('#kFx').innerHTML = '';
      $('#kBadge').innerHTML = `<span>${ICON[st.act]} ${L[st.act]}</span>`;
      $('#kCard').innerHTML = `<div class="k-step"><div class="k-act">${ICON[st.act]} ${L[st.act]} <small>${i + 1}/${steps.length}</small></div>
        <p>${esc(st.text)}</p>
        <div class="k-tags">${st.dur ? `<button class="k-tag t" id="kTimer">⏱ ${fmtDur(st.dur)} · ${t('startTimer')}</button>` : ''}<span class="k-tag c">💡 <b>${t('consistency')}:</b> ${esc(st.hint)}</span></div></div>`;
      $('#kNav').innerHTML = `<button class="btn line" id="kPrev" ${i === 0 ? 'disabled' : ''}>◀</button><button class="btn ghost" id="kSkip">${t('skip')} ⏭</button><button class="btn primary" id="kNext">${i === steps.length - 1 ? t('toServe') + ' 🍽️' : t('nextStep') + ' ▶'}</button>`;
      $('#kPrev').onclick = () => go(i - 1);
      $('#kSkip').onclick = () => { playing = null; need.forEach(x => { if (!x.used) { x.used = true; content.push(x.emoji); } }); go(i + 1); };
      $('#kNext').onclick = () => go(i + 1);
      if ($('#kTimer')) $('#kTimer').onclick = () => startTimer(st.dur, L[st.act]);
      // play: ingredients fly in one by one, then the action loops
      for (const it of need) { if (playing !== token) return; await fly(it); }
      if (playing !== token) return;
      $('#kFx').innerHTML = effectHTML(st.act, st.vessel);
      $('#kStage').dataset.act = st.act;
    }
    function fmtDur(s) { return s >= 3600 ? (Math.round(s / 360) / 10).toString().replace('.', ',') + ' ' + t('hours2') : s >= 60 ? Math.round(s / 60) + ' ' + t('min') : s + ' sn'; }

    /* ---------- in-app timer ---------- */
    function startTimer(total, label) {
      stopTimer();
      let left = total, paused = false;
      const ov = document.createElement('div'); ov.className = 'k-timer';
      ov.innerHTML = `<div class="k-timer-card"><small>${esc(label)}</small>
        <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg" id="kRing"/></svg>
        <div class="k-time" id="kTime">${fmtT(left)}</div>
        <div class="k-tbtns"><button class="btn line" id="kPause">⏸</button><button class="btn line" id="kPlus">+1 ${t('min')}</button><button class="btn primary" id="kTSkip">${t('skip')} ⏭</button></div></div>`;
      el.appendChild(ov);
      const ring = ov.querySelector('#kRing'), C = 2 * Math.PI * 52; ring.style.strokeDasharray = C;
      const upd = () => { ov.querySelector('#kTime').textContent = fmtT(left); ring.style.strokeDashoffset = C * (1 - left / total); };
      upd();
      timer = { ov, iv: setInterval(() => { if (paused) return; left--; upd(); if (left <= 0) { clearInterval(timer.iv); beep(); ov.querySelector('#kTime').textContent = t('timeUp'); ov.querySelector('#kTSkip').textContent = t('nextStep') + ' ▶'; } }, 1000) };
      ov.querySelector('#kPause').onclick = e => { paused = !paused; e.target.textContent = paused ? '▶' : '⏸'; };
      ov.querySelector('#kPlus').onclick = () => { left += 60; total += 60; upd(); };
      ov.querySelector('#kTSkip').onclick = () => { const done = left <= 0; stopTimer(); if (done) go(idx + 1); };
    }
    function stopTimer() { if (timer) { clearInterval(timer.iv); timer.ov.remove(); timer = null; } }

    /* ---------- serving / plating ---------- */
    function serve() {
      idx = steps.length; playing = null;
      $('#kBar').style.width = '100%'; $('#kSub').textContent = t('serving');
      setVessel('plate'); $('#kItems').innerHTML = ''; $('#kFx').innerHTML = effectHTML('garnish', 'plate');
      $('#kBadge').innerHTML = `<span>🍽️ ${L.serve}</span>`;
      items.forEach(x => x.used = true); drawTray();
      $('#kStage').classList.add('served');
      $('#kItems').innerHTML = plateHTML('k-plated');
      $('#kCard').innerHTML = `<div class="k-step"><div class="k-act">🎉 ${t('bonApp')}</div>
        <p>${esc(servingText || t('serveDefault'))}</p>
        ${sides.length ? `<div class="k-tags"><span class="k-tag c">🍽️ <b>${t('serveWith')}:</b> ${esc(sides.join(', '))}</span></div>` : ''}</div>`;
      $('#kNav').innerHTML = `<button class="btn line" id="kAgain">↺</button><button class="btn ghost" id="kCam">📷 ${t('seeOnTable')}</button><button class="btn primary" id="kDone">${t('finish')} ✓</button>`;
      $('#kAgain').onclick = () => { items.forEach(x => x.used = false); content = []; $('#kStage').classList.remove('served'); intro(); };
      $('#kDone').onclick = () => ctx.back();
      $('#kCam').onclick = camera;
    }
    function plateHTML(cls) {
      const img = R.img ? `<img src="${esc(R.img)}" alt="">` : `<span class="pe">${R.emoji}</span>`;
      const gar = ['🌿', '🍋', '🌿', '🫒', '🌱'];
      return `<div class="k-plate ${cls}"><div class="k-dish">${img}</div>${gar.map((g, i) => `<span class="gar" style="--a:${i * 72 + 20}deg;animation-delay:${0.4 + i * 0.12}s">${g}</span>`).join('')}
        <span class="cut l">🍴</span>${sides.length ? `<span class="side">🥗</span>` : ''}</div>`;
    }

    /* ---------- camera: see the dish on your table ---------- */
    let stream = null;
    async function camera() {
      const ov = document.createElement('div'); ov.className = 'k-cam';
      ov.innerHTML = `<video id="kVid" autoplay playsinline muted></video><div class="k-cam-fallback hide" id="kFb"></div>
        <div class="k-ar" id="kAr">${plateHTML('ar')}</div>
        <div class="k-cam-top"><button class="round" id="kCamX">✕</button><span>${t('arHint')}</span></div>
        <div class="k-cam-bot"><input type="range" min="40" max="160" value="90" id="kSize"><button class="k-shutter" id="kShot"></button></div>`;
      el.appendChild(ov);
      const ar = ov.querySelector('#kAr'), vid = ov.querySelector('#kVid');
      let x = 50, y = 62, sc = .9;
      const place = () => { ar.style.left = x + '%'; ar.style.top = y + '%'; ar.style.transform = `translate(-50%,-50%) scale(${sc}) rotateX(52deg)`; };
      place();
      let drag = null; const pts = new Map(); let pinch0 = null;
      ar.addEventListener('pointerdown', e => { ar.setPointerCapture(e.pointerId); pts.set(e.pointerId, e); drag = { x: e.clientX, y: e.clientY, ox: x, oy: y }; });
      ar.addEventListener('pointermove', e => {
        if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e);
        if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); if (!pinch0) pinch0 = { d, sc }; sc = Math.max(.4, Math.min(1.8, pinch0.sc * d / pinch0.d)); ov.querySelector('#kSize').value = sc * 100; place(); return; }
        if (drag) { x = drag.ox + (e.clientX - drag.x) / ov.clientWidth * 100; y = drag.oy + (e.clientY - drag.y) / ov.clientHeight * 100; place(); }
      });
      const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = null; if (!pts.size) drag = null; };
      ar.addEventListener('pointerup', up); ar.addEventListener('pointercancel', up);
      ov.querySelector('#kSize').oninput = e => { sc = e.target.value / 100; place(); };
      ov.querySelector('#kCamX').onclick = () => { stopCamera(); ov.remove(); };
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
        vid.srcObject = stream;
      } catch (e) { ov.querySelector('#kFb').classList.remove('hide'); vid.classList.add('hide'); ctx.toast(t('camErr')); }
      ov.querySelector('#kShot').onclick = () => snapshot(ov, vid, ar);
    }
    function stopCamera() { if (stream) { stream.getTracks().forEach(tr => tr.stop()); stream = null; } }
    async function snapshot(ov, vid, ar) {
      const W = ov.clientWidth, H = ov.clientHeight, cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2;
      const g = cv.getContext('2d'); g.scale(2, 2);
      if (stream && vid.videoWidth) { const r = Math.max(W / vid.videoWidth, H / vid.videoHeight); const w = vid.videoWidth * r, h = vid.videoHeight * r; g.drawImage(vid, (W - w) / 2, (H - h) / 2, w, h); }
      else { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#8B5E3C'); gr.addColorStop(1, '#5C3B22'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
      const rb = ar.getBoundingClientRect(), ob = ov.getBoundingClientRect();
      const cx = rb.left - ob.left + rb.width / 2, cy = rb.top - ob.top + rb.height / 2, rx = rb.width / 2, ry = rb.height / 2;
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(cx, cy + ry * .18, rx * 1.02, ry * 1.02, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.fill();
      g.strokeStyle = '#E5E7EB'; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, rx * .74, ry * .74, 0, 0, 7); g.stroke();
      const img = ar.querySelector('img');
      g.save(); g.beginPath(); g.ellipse(cx, cy, rx * .66, ry * .66, 0, 0, 7); g.clip();
      if (img && img.complete && img.naturalWidth) { try { g.drawImage(img, cx - rx * .66, cy - ry * .66, rx * 1.32, ry * 1.32); } catch (e) {} }
      else { g.fillStyle = '#F4E3C3'; g.fill(); g.font = `${ry}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(R.emoji, cx, cy); }
      g.restore();
      g.font = '600 15px sans-serif'; g.fillStyle = 'rgba(255,255,255,.9)'; g.fillText(`🍽️ ${R.name} · World Bite`, 16, H - 20);
      let url; try { url = cv.toDataURL('image/jpeg', .9); } catch (e) { ctx.toast(t('camErr')); return; }
      let saved = '';
      try { if (window.Android && Android.saveImage) saved = Android.saveImage(url); } catch (e) {}
      const pv = document.createElement('div'); pv.className = 'k-shot';
      pv.innerHTML = `<img src="${url}"><div class="k-tbtns"><button class="btn line" id="kShotX">✕</button><button class="btn primary" id="kShotShare">${t('share')}</button></div><small>${saved ? t('savedPhoto') : ''}</small>`;
      ov.appendChild(pv);
      pv.querySelector('#kShotX').onclick = () => pv.remove();
      pv.querySelector('#kShotShare').onclick = () => { try { if (window.Android && Android.shareImage) { Android.shareImage(url, R.name); return; } } catch (e) {} ctx.toast(t('savedPhoto')); };
    }
    function $$(s, r) { return [...(r || el).querySelectorAll(s)]; }

    $('#kList').onclick = () => ctx.openSheet(`<h2>🧺 ${t('ingredients')}</h2><p class="sub">${esc(R.name)}</p><ul class="ing">${items.map(x => `<li class="${x.used ? 'done' : ''}"><span class="box">✓</span><span>${x.emoji} ${esc(x.line)}</span></li>`).join('')}${sides.length ? `<li><span class="box"></span><span>🍽️ ${t('serveWith')}: ${esc(sides.join(', '))}</span></li>` : ''}</ul>`);
    intro();
  }
  return { open, detect, duration, consistency };
})();
