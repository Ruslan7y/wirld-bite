/* World Bite chefs: Leyla nənə, Şef Aylin, Zeynep teyze (original characters).
   chefSVG(id, mood) → inline SVG (viewBox 0 0 200 240). mood: 'happy' | 'wow' | 'wink'. */
const CHEFS = {
  leyla: { id: 'leyla', name: { tr: 'Leyla nənə', az: 'Leyla nənə', en: 'Grandma Leyla', ru: 'Бабушка Лейла' }, tag: { tr: 'Sevimli büyükanne', az: 'Mehriban nənə', en: 'Lovely grandma', ru: 'Добрая бабушка' }, color: '#7C4A3A' },
  aylin: { id: 'aylin', name: { tr: 'Şef Aylin', az: 'Şef Aylin', en: 'Chef Aylin', ru: 'Шеф Айлин' }, tag: { tr: 'Genç ve neşeli şef', az: 'Gənc və şən aşpaz', en: 'Young, cheerful chef', ru: 'Молодой весёлый шеф' }, color: '#E0482F' },
  zeynep: { id: 'zeynep', name: { tr: 'Zeynep teyze', az: 'Zeynəb xala', en: 'Auntie Zeynep', ru: 'Тётя Зейнеп' }, tag: { tr: 'Sıcak, misafirperver teyze', az: 'Qonaqpərvər xala', en: 'Warm, welcoming auntie', ru: 'Радушная тётя' }, color: '#2F6F62' }
};
function chefMouth(mood) {
  return mood === 'wow' ? '<ellipse cx="100" cy="166" rx="9" ry="11" fill="#8A3B2E"/>'
    : '<path d="M84 160 Q100 178 116 160" fill="none" stroke="#8A3B2E" stroke-width="4" stroke-linecap="round"/>';
}
function chefEyes(mood, y, dx) {
  const l = 100 - dx, r = 100 + dx;
  if (mood === 'wink') return `<ellipse cx="${l}" cy="${y}" rx="5" ry="6.5" fill="#2B1D14"/><path d="M${r - 7} ${y} Q${r} ${y - 6} ${r + 7} ${y}" fill="none" stroke="#2B1D14" stroke-width="3.5" stroke-linecap="round"/>`;
  return `<ellipse cx="${l}" cy="${y}" rx="5" ry="6.5" fill="#2B1D14"/><ellipse cx="${r}" cy="${y}" rx="5" ry="6.5" fill="#2B1D14"/><circle cx="${l + 2}" cy="${y - 3}" r="1.6" fill="#fff"/><circle cx="${r + 2}" cy="${y - 3}" r="1.6" fill="#fff"/>`;
}
function chefSVG(id, mood = 'happy') {
  const body = {
    leyla: `<path d="M30 240 Q30 205 100 200 Q170 205 170 240 Z" fill="#7C4A3A"/><path d="M58 240 L62 222 Q100 236 138 222 L142 240 Z" fill="#F4EBDD"/>
      <rect x="88" y="182" width="24" height="22" rx="6" fill="#F2C7A5"/>
      <circle cx="100" cy="135" r="52" fill="#F5CFAE"/>
      <path d="M50 130 Q48 78 100 76 Q152 78 150 130 Q140 100 100 100 Q60 100 50 130 Z" fill="#C9CCD3"/><circle cx="100" cy="72" r="20" fill="#C9CCD3"/>
      ${chefEyes(mood, 136, 20)}
      <circle cx="80" cy="135" r="13" fill="none" stroke="#5B4636" stroke-width="3"/><circle cx="120" cy="135" r="13" fill="none" stroke="#5B4636" stroke-width="3"/><line x1="93" y1="135" x2="107" y2="135" stroke="#5B4636" stroke-width="3"/>
      <circle cx="68" cy="158" r="8" fill="#F2A7A0"/><circle cx="132" cy="158" r="8" fill="#F2A7A0"/>`,
    aylin: `<path d="M30 240 Q30 205 100 200 Q170 205 170 240 Z" fill="#FFFFFF" stroke="#D9D4CB" stroke-width="2"/><path d="M78 204 L100 230 L122 204 Z" fill="#E0482F"/>
      <rect x="88" y="182" width="24" height="22" rx="6" fill="#E6B48E"/>
      <path d="M150 120 Q178 150 160 200 Q150 170 140 150 Z" fill="#4A2C20"/>
      <circle cx="100" cy="135" r="50" fill="#EDC09A"/>
      <path d="M52 128 Q54 92 100 90 Q146 92 148 128 Q128 108 100 112 Q72 108 52 128 Z" fill="#4A2C20"/>
      <path d="M52 92 Q48 52 76 50 Q84 26 100 34 Q116 26 124 50 Q152 52 148 92 Z" fill="#FFFFFF" stroke="#D9D4CB" stroke-width="2"/><rect x="54" y="84" width="92" height="14" rx="4" fill="#FFFFFF" stroke="#D9D4CB" stroke-width="2"/>
      ${chefEyes(mood, 136, 18)}
      <circle cx="70" cy="156" r="8" fill="#F2A08F"/><circle cx="130" cy="156" r="8" fill="#F2A08F"/>`,
    zeynep: `<path d="M30 240 Q30 205 100 200 Q170 205 170 240 Z" fill="#2F6F62"/><path d="M58 240 L62 222 Q100 236 138 222 L142 240 Z" fill="#FCE7C8"/>
      <path d="M44 140 Q40 70 100 64 Q160 70 156 140 Q160 196 120 206 L80 206 Q40 196 44 140 Z" fill="#B83A5E"/>
      <circle cx="70" cy="100" r="5" fill="#F7C3D3"/><circle cx="128" cy="96" r="5" fill="#F7C3D3"/><circle cx="100" cy="80" r="5" fill="#F7C3D3"/><circle cx="58" cy="150" r="5" fill="#F7C3D3"/><circle cx="142" cy="150" r="5" fill="#F7C3D3"/>
      <ellipse cx="100" cy="140" rx="40" ry="46" fill="#EFC29C"/>
      ${mood === 'happy' ? '<path d="M76 136 Q82 129 88 136" fill="none" stroke="#2B1D14" stroke-width="3.5" stroke-linecap="round"/><path d="M112 136 Q118 129 124 136" fill="none" stroke="#2B1D14" stroke-width="3.5" stroke-linecap="round"/>' : chefEyes(mood, 136, 18)}
      <circle cx="74" cy="156" r="7" fill="#F2A08F"/><circle cx="126" cy="156" r="7" fill="#F2A08F"/>`
  }[id] || '';
  return `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" class="chef chef-${id}">${body}${chefMouth(mood)}</svg>`;
}
/* Which chef cooks with the user: by age (default), by dish region, random, or fixed. */
const DISH_REGION_CHEF = { europe: 'aylin', americas: 'aylin', oceania: 'aylin', asia: 'leyla', africa: 'zeynep' };
const LEYLA_LANDS = ['AZ', 'TR', 'GE', 'AM', 'IR', 'UZ', 'KZ', 'KG', 'TJ', 'TM', 'RU', 'UA', 'BY'];
const ZEYNEP_LANDS = ['LB', 'SY', 'JO', 'PS', 'IQ', 'EG', 'MA', 'DZ', 'TN', 'LY', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'GR', 'CY', 'AL', 'BA', 'MK'];
function chefFor(mode, age, countryCode, cont, seed) {
  if (CHEFS[mode]) return mode;
  if (mode === 'random') return ['leyla', 'aylin', 'zeynep'][Math.abs(seed || Date.now()) % 3];
  if (mode === 'dish' && countryCode) {
    if (LEYLA_LANDS.includes(countryCode)) return 'leyla';
    if (ZEYNEP_LANDS.includes(countryCode)) return 'zeynep';
    return DISH_REGION_CHEF[cont] || 'aylin';
  }
  const a = +age || 30;
  return a < 30 ? 'aylin' : a < 55 ? 'zeynep' : 'leyla';
}

/* What the chef says during the game. Several options per key → picked at random. */
const CHEF_LINES = {
  tr: {
    drag: ['Gerekli malzemeleri kaba sürükle!', 'Hadi, malzemeleri tek tek kaba at!'], wrong: ['Bu bu adımda lazım değil 🙂', 'Hımm, o sonra gelecek!'],
    crack: ['Yumurtayı tam zamanında kır! Yeşilde dokun.'], whisk: ['Parmağınla hızlı hızlı daire çiz!', 'Çırp, çırp, çırp!'], mix: ['Yavaşça daire çizerek karıştır.'],
    chop: ['Aşağı kaydır ya da dokun: doğra! Ritmini koru.'], knead: ['Sağa sola sürükleyerek yoğur!'], roll: ['Oklavayı sağa sola gezdir!'],
    heat: ['Ateşi yeşil bölgede tut! Yukarı-aşağı kaydır.'], tooHot: ['Ateş çok yüksek, yanıyor!', 'Aman, kısık ateş!'], tooLow: ['Biraz daha ısıt!'],
    flip: ['Şimdi yukarı kaydır, çevir!'], oven: ['Fırını {c}°C\'ye ayarla, kadranı çevir!'], rest: ['Sabır… Saate dokun, zamanı hızlandıralım.'],
    layer: ['Her dokunuşta bir kat ekle!'], wrap: ['Dokun, sar ve kapat!'], garnish: ['Tabağa dokunarak süsle!'],
    great: ['Harika!', 'Mükemmel kıvam!', 'Usta işi!'], good: ['Güzel oldu!', 'Aferin!'], ok: ['Olsun, devam!', 'Bir dahakine daha iyi!'], done: ['Ellerine sağlık! Afiyet olsun!']
  },
  az: {
    drag: ['Lazım olan ərzaqları qaba sürüşdür!'], wrong: ['Bu bu addımda lazım deyil 🙂'], crack: ['Yumurtanı vaxtında sındır! Yaşılda toxun.'],
    whisk: ['Barmağınla tez-tez dairə çək!'], mix: ['Yavaş-yavaş dairə çəkərək qarışdır.'], chop: ['Aşağı sürüşdür və ya toxun: doğra!'], knead: ['Sağa-sola sürüşdürərək yoğur!'],
    roll: ['Oxlovu sağa-sola gəzdir!'], heat: ['Odu yaşıl zonada saxla!'], tooHot: ['Od çox yüksəkdir, yanır!'], tooLow: ['Bir az da qızdır!'], flip: ['İndi yuxarı sürüşdür, çevir!'],
    oven: ['Sobanı {c}°C-yə qur!'], rest: ['Səbr… Saata toxun, vaxtı sürətləndirək.'], layer: ['Hər toxunuşda bir qat əlavə et!'], wrap: ['Toxun, bük və bağla!'], garnish: ['Boşqaba toxunaraq bəzə!'],
    great: ['Əla!', 'Mükəmməl qıvam!'], good: ['Gözəl oldu!', 'Afərin!'], ok: ['Olsun, davam!'], done: ['Əllərinə sağlıq! Nuş olsun!']
  },
  en: {
    drag: ['Drag the right ingredients into the bowl!', 'Pop the ingredients in one by one!'], wrong: ["That's not needed in this step 🙂", 'Hmm, that comes later!'],
    crack: ['Crack the egg right on time — tap in the green!'], whisk: ['Draw fast circles with your finger!', 'Whisk, whisk, whisk!'], mix: ['Stir gently in circles.'],
    chop: ['Swipe down or tap to chop — keep a steady rhythm!'], knead: ['Drag left and right to knead!'], roll: ['Roll the pin back and forth!'],
    heat: ['Keep the heat in the green zone — slide up and down.'], tooHot: ["Too hot, it's burning!", 'Careful, lower the heat!'], tooLow: ['A little more heat!'],
    flip: ['Now swipe up to flip!'], oven: ['Set the oven to {c}°C — turn the dial!'], rest: ['Patience… tap the clock to speed up time.'],
    layer: ['Tap to add a layer!'], wrap: ['Tap to wrap and seal!'], garnish: ['Tap the plate to garnish!'],
    great: ['Amazing!', 'Perfect texture!', 'Chef level!'], good: ['Nice one!', 'Well done!'], ok: ['No worries, keep going!'], done: ['Bravo! Enjoy your meal!']
  },
  ru: {
    drag: ['Перетащите нужные продукты в миску!'], wrong: ['Это сейчас не нужно 🙂'], crack: ['Разбейте яйцо вовремя — нажмите в зелёной зоне!'],
    whisk: ['Быстро рисуйте круги пальцем!'], mix: ['Мешайте плавными кругами.'], chop: ['Проведите вниз или нажмите — режем в ритме!'], knead: ['Двигайте влево-вправо, месите!'],
    roll: ['Катайте скалку туда-сюда!'], heat: ['Держите огонь в зелёной зоне!'], tooHot: ['Слишком сильно, горит!'], tooLow: ['Чуть сильнее огонь!'], flip: ['Теперь проведите вверх — переверните!'],
    oven: ['Поставьте духовку на {c}°C!'], rest: ['Терпение… нажмите на часы, ускорим время.'], layer: ['Каждое нажатие — новый слой!'], wrap: ['Нажмите — заверните!'], garnish: ['Нажимайте на тарелку — украшайте!'],
    great: ['Отлично!', 'Идеальная консистенция!'], good: ['Хорошо!', 'Молодец!'], ok: ['Ничего, продолжаем!'], done: ['Браво! Приятного аппетита!']
  }
};
function chefLine(key, lang, vars) {
  const set = (CHEF_LINES[lang] || CHEF_LINES.tr)[key] || CHEF_LINES.tr[key] || [''];
  let s = set[Math.floor(Math.random() * set.length)];
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
  return s;
}
const CHEF_RANKS = [[0, 'r1'], [12, 'r2'], [40, 'r3'], [90, 'r4'], [180, 'r5']];
const CHEF_TOOL = { crack: '🥚', whisk: '🥄', mix: '🥄', chop: '🔪', knead: '👐', roll: '🪵', fry: '🍳', boil: '🥄', bake: '🧤', grill: '🍢', steam: '🥢', wrap: '🌯', layer: '🥧', rest: '⏳', garnish: '🌿', serve: '🍽️' };

/* Costume accessories unlocked through the food passport; drawn on top of the chef. */
const ACC_DEF = { scarf: { e: '🧣', slot: 'neck' }, fan: { e: '🪭', slot: 'hand' }, bow: { e: '🎀', slot: 'head' }, shades: { e: '🕶️', slot: 'eyes' }, flower: { e: '🌺', slot: 'head' }, tophat: { e: '🎩', slot: 'top' }, sunhat: { e: '👒', slot: 'top' }, crown: { e: '👑', slot: 'top' } };
function chefHTML(id, mood) {
  let acc = ''; try { acc = JSON.parse(localStorage.getItem('wb_acc') || '""'); } catch (e) {}
  const a = ACC_DEF[acc];
  return `<div class="chef-wrap c-${id}">${chefSVG(id, mood)}${a ? `<span class="acc-on slot-${a.slot}">${a.e}</span>` : ''}</div>`;
}
