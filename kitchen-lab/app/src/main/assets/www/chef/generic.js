// Generic recipe player: reads ingredient lines + step sentences (TR/EN/RU/AZ),
// works out what happens in every step and turns it into chef actions.
// Every step stores the scene state it ends with, so ⏮ / ↻ work for any recipe.
import * as THREE from 'three';
import { chop, fly, boardToPan, startStir, stopStir, pinch, turn } from './recipes.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const low = s => String(s || '').toLocaleLowerCase('tr-TR');

// ---------- ingredient classification ----------
const SOLID = [
  ['mince', /kıyma|köfte|ground (beef|meat|lamb)|minced|фарш|qiymə/],
  ['chicken', /tavu[kğ]|piliç|hindi|chicken|turkey|курин|курица|индейк|toyuq/],
  ['shrimp', /karides|shrimp|prawn|кревет/],
  ['fish', /balık|somon|levrek|hamsi|uskumru|ton balığı|morina|fish|salmon|cod|tuna|рыб|лосос|balıq/],
  ['meat', /\bet\b|eti\b|kuzu|dana|sığır|kuşbaşı|biftek|bonfile|pirzola|incik|but\b|kaburga|beef|lamb|mutton|veal|pork|steak|говяд|баран|свинин|мяс|ət\b|quzu/],
  ['onion', /soğan|onion|shallot|лук\b|луковиц|soğan/],
  ['garlic', /sarımsak|garlic|чеснок|sarımsaq/],
  ['tomato', /domates|tomato|помидор|томат(?! паст)|pomidor/],
  ['potato', /patates|potato|картоф|kartof/],
  ['carrot', /havuç|carrot|морков|yerkökü/],
  ['eggplant', /patlıcan|eggplant|aubergine|баклаж|badımcan/],
  ['zucchini', /kaba[kğ]|zucchini|courgette|squash|pumpkin|кабач|тыкв|balqabaq/],
  ['mushroom', /mantar|mushroom|гриб|göbələk/],
  ['cucumber', /salatalık|hıyar|cucumber|огур|xiyar/],
  ['corn', /mısır|corn|кукуруз|qarğıdalı/],
  ['legume', /fasulye|nohut|mercime[kğ]|bezelye|börülce|\bbakla\b|bean|chickpea|lentil|pea\b|peas|фасол|нут|чечевиц|горох|lobya|noxud|mərci/],
  ['rice', /pirinç|bulgur|rice|kuskus|couscous|kinoa|quinoa|рис|булгур|düyü/],
  ['pasta', /makarna|erişte|noodle|pasta|spagetti|spaghetti|şehriye|vermicelli|лапш|макарон|вермиш|əriştə/],
  ['cheese', /peynir|kaşar|lor|feta|mozzarella|parmesan|cheese|сыр|brynza|pendir/],
  ['egg', /yumurta|egg|яйц|yumurta/],
  ['pepper', /biber|pepper|chili|chilli|jalapeno|перец|bibər/],
  ['bread', /ekme[kğ]|lavaş|yufka|pide|bazlama|galeta|bread|tortilla|pita|хлеб|лаваш|lavaş|çörək/],
  ['greens', /ıspanak|lahana|marul|roka|pazı|yaprak|asma|spinach|cabbage|lettuce|kale|chard|leaves|шпинат|капуст|салат|kələm|ispanaq/],
  ['parsley', /maydanoz|dereotu|nane|kişniş|fesleğen|tere|parsley|dill|mint|coriander|cilantro|basil|зелен|петруш|укроп|мят|кинз|базилик|şüyüd|keşniş|reyhan|cəfəri/],
  ['lemon', /limon(?! suyu)|lime(?! juice)|лимон(?!ный сок)/],
  ['fruit', /elma|armut|muz|çilek|üzüm|kayısı|erik|ayva|nar\b|vişne|kiraz|şeftali|ananas|mango|hurma|apple|pear|banana|strawberr|grape|apricot|plum|cherr|peach|pineapple|date|яблок|груш|банан|клубник|виноград|абрикос|слив|вишн|alma|armud/],
  ['nuts', /ceviz|fındık|badem|fıstık|kaju|susam|walnut|hazelnut|almond|pistachio|peanut|cashew|sesame|орех|миндал|фисташ|кунжут|qoz|fındıq|badam/],
  ['dough', /hamur|dough|тесто|xəmir/],
];
const LIQUID = [
  ['paste', /salça|domates püresi|tomato paste|ketçap|ketchup|томатн(ая|ой) паст|pomidor pastası/, 0xa8261a],
  ['broth', /et suyu|tavuk suyu|sebze suyu|broth|stock|бульон|bulyon/, 0xc89a5a],
  ['milk', /süt\b|sütü|milk|молок|süd/, 0xfbfaf5],
  ['cream', /krema|kaymak|cream|сливк|qaymaq/, 0xfff8ea],
  ['yogurt', /yoğurt|yogurt|ayran|kefir|йогурт|кефир|qatıq/, 0xfcfbf7],
  ['wine', /şarap|wine|вино|şərab/, 0x8a1e2a],
  ['juice', /limon suyu|portakal suyu|sirke|lemon juice|lime juice|vinegar|juice|уксус|сок/, 0xf5e6a0],
  ['soy', /soya sosu|soy sauce|соев/, 0x4a2410],
  ['oil', /zeytinyağ|sıvı yağ|ayçiçek|tereyağ|margarin|yağ\b|yağı\b|olive oil|\boil\b|butter|ghee|масл|yağ/, 0xe0b23a],
  ['honey', /bal\b|pekmez|şurup|honey|syrup|molasses|мёд|мед\b|сироп|bal\b/, 0xd99a2a],
  ['water', /\bsu\b|suyu\b|suyunu|sıcak su|soğuk su|water|вод|\bsu\b/, 0xdcecff],
];
const POWDER = [
  ['salt', /tuz|salt|соль|duz/], ['spice', /karabiber|pul biber|kırmızı biber|kimyon|kekik|baharat|tarçın|zerdeçal|sumak|yenibahar|karanfil|safran|vanilya|köri|paprika|pepper(?!s)|cumin|oregano|thyme|cinnamon|turmeric|spice|curry|saffron|vanilla|перец молот|специ|корица|зира|ədviyyat|darçın/],
  ['flour', /\bun\b|unu\b|nişasta|irmik|galeta unu|flour|starch|semolina|мук|крахмал|манк|un\b/], ['sugar', /şeker|pudra şekeri|sugar|сахар|şəkər/], ['yeast', /maya|kabartma tozu|karbonat|yeast|baking powder|baking soda|дрожж|разрыхл/],
];
const CHOPPABLE = new Set(['onion', 'garlic', 'tomato', 'pepper', 'potato', 'carrot', 'eggplant', 'zucchini', 'mushroom', 'greens', 'cucumber', 'parsley', 'lemon', 'fruit', 'cheese', 'meat', 'chicken', 'fish', 'bread']);
const ICON = { meat: '🥩', mince: '🥩', chicken: '🍗', fish: '🐟', shrimp: '🦐', onion: '🧅', garlic: '🧄', tomato: '🍅', pepper: '🌶️', potato: '🥔', carrot: '🥕', eggplant: '🍆', zucchini: '🥒', mushroom: '🍄', greens: '🥬', cucumber: '🥒', corn: '🌽', legume: '🫘', rice: '🍚', pasta: '🍝', cheese: '🧀', egg: '🥚', parsley: '🌿', lemon: '🍋', fruit: '🍎', nuts: '🥜', bread: '🍞', dough: '🫓', water: '💧', milk: '🥛', cream: '🥛', yogurt: '🥛', oil: '🫒', broth: '🍲', paste: '🥫', wine: '🍷', juice: '🍋', soy: '🥢', honey: '🍯', salt: '🧂', spice: '🌶️', flour: '🌾', sugar: '🍬', yeast: '🧁' };

function classify(line) {
  const l = low(line);
  // a liquid/powder is decided first when the line is clearly one ("2 yemek kaşığı zeytinyağı")
  for (const [k, re, col] of LIQUID) if (re.test(l)) {
    // "tavuk suyu" is broth, but "1 tavuk" is solid; liquids only if no stronger solid word is first
    const solidFirst = SOLID.find(([t, r]) => r.test(l) && !['meat', 'chicken'].includes(t));
    if (!solidFirst || k === 'broth' || k === 'paste' || k === 'juice' || k === 'oil') return { kind: 'liquid', type: k, color: col };
  }
  for (const [k, re] of SOLID) if (re.test(l)) return { kind: 'solid', type: k };
  for (const [k, re] of POWDER) if (re.test(l)) return { kind: 'powder', type: k };
  return { kind: 'solid', type: 'veg' };
}
function stems(line) {
  return low(line).replace(/\([^)]*\)/g, ' ').replace(/[\d½¼¾⅓.,/-]+/g, ' ')
    .split(/[^a-zçğıöşüəа-яё]+/i).filter(w => w.length >= 3 && !/^(adet|tane|yemek|kaşığı|kaşık|tatlı|çay|su|bardağı|bardak|gram|paket|demet|dal|diş|orta|büyük|küçük|boy|için|ile|veya|kadar|biraz|isteğe|göre|tbsp|tsp|cup|cups|large|small|medium|for|and|the|of|или|для|ст|ч\.л|шт)$/.test(w)).map(w => w.length >= 5 ? w.slice(0, 4) : w);
}
const ACT = {
  chop: /doğra|kıy(ın|ıp|ar|ılmış)|dilimle|rendele|küp|halka|ince ince|julyen|soy(un|up|ulmuş)|ayıkla|parçala|chop|dice|slice|mince|grate|\bcut\b|peel|нарез|наруб|натр|почист|kəs|doğrayın/,
  fry: /kızart|kavur|sotele|yağda|pembeleş|mühürle|\bfry|saut|brown|sear|обжар|поджар|qızart|qovur/,
  boil: /haşla|kaynat|kaynayan|boil|simmer|blanch|вари|кипя|отвар|qaynat/,
  cook: /pişir|kısık ateş|ağır ateş|demle|\bcook|stew|туш|готов|bişir/,
  bake: /fırın|°c|\bbake|oven|roast|духов|запек|soba/,
  mix: /karıştır|çırp|yoğur|harmanla|birleştir|\bmix|whisk|knead|combine|\bstir|\bbeat|toss|смеш|взбей|замес|перемеш|qarışdır/,
  add: /ekle|koy|ilave|at(ın|ıp)|dök|\badd|pour|\bput\b|place|добав|влей|положи|əlavə/,
  rest: /dinlendir|beklet|soğu|mayala|marine|\brest|chill|\bcool|marinat|let .* stand|оставь|охлад|мариню|saxla/,
  cover: /kapa(ğ|k)ını kapat|kapağı kapa|kapağını|örtün|\bcover|накрой|qapağ/,
  serve: /servis|sunun|ile yiyin|ile yenir|\bserve|plate|подав|təqdim/,
  garnish: /süsle|serp|garnish|sprinkle|укрась|посып|bəzə/,
  shape: /şekil ver|top|yuvarla|sar(ın|ıp|arak)|doldur|aç(ın|ıp)|\broll|shape|wrap|stuff|\bfill|\bform|лепи|сверн|начин|скатай|bük/,
};
function duration(step) {
  const s = low(step);
  if (/bir gece|overnight|на ночь/.test(s)) return 8 * 3600;
  const m = s.match(/(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?\s*(dk|dakika|sn|saniye|saat|gün|minutes|minute|mins|min|hours|hour|hrs|seconds|sec|мин|час|сек|dəq)/);
  if (!m) return 0;
  const v = parseFloat((m[2] || m[1]).replace(',', '.')), u = m[3];
  return Math.round(v * (/^(saat|hour|hr|час)/.test(u) ? 3600 : u === 'gün' ? 86400 : /^(sn|saniye|sec|сек)/.test(u) ? 1 : 60));
}
const heatOf = s => /kısık|düşük|ağır ateş|low heat|медленн|слаб/.test(s) ? 0.3 : /yüksek|harlı|high heat|сильн/.test(s) ? 0.9 : /orta|medium/.test(s) ? 0.6 : 0.65;

// ---------- planning ----------
export function planRecipe(src) {
  // split lines like "Sos: 500 g yoğurt, 3 yumurta" into separate items
  const lines = [];
  for (const raw of src.ing) { const body = raw.includes(':') ? raw.split(':').slice(1).join(':') : raw; body.split(/,(?!\d)/).forEach(p => p.trim() && lines.push({ raw, part: p.trim() })); }
  const items = lines.map(({ raw, part }, i) => ({ i, raw, line: part, ...classify(part), stems: stems(part) }));
  const findIn = (text) => {
    const t = low(text), out = [];
    for (const it of items) {
      const table = it.kind === 'solid' ? SOLID : it.kind === 'liquid' ? LIQUID : POWDER;
      const hit = it.stems.some(st => st.length >= 3 && t.includes(st)) || !!table.find(([k]) => k === it.type)?.[1].test(t);
      if (hit && !out.find(o => o.type === it.type && o.kind === it.kind)) out.push(it);
    }
    return out;
  };
  const S = { board: {}, pan: {}, bowl: {}, done: {}, sauce: 0, liq: { level: 0, color: 0xc0502a, op: 0 }, mound: { level: 0, color: 0xf2e2bd }, oil: 0, fire: 0, lid: false, chopped: {}, active: null, baked: false };
  const snap = () => JSON.parse(JSON.stringify(S));
  const types = new Set();
  const steps = [];
  const stTexts = src.st.slice();
  if (!stTexts.some(x => ACT.serve.test(low(x)))) stTexts.push('__serve__');
  stTexts.forEach((text, si) => {
    const isServe = text === '__serve__' || (si === stTexts.length - 1 && ACT.serve.test(low(text)));
    const t = low(text), A = {}; for (const k in ACT) A[k] = ACT[k].test(t);
    const found = text === '__serve__' ? [] : findIn(text);
    const solids = found.filter(f => f.kind === 'solid'), liquids = found.filter(f => f.kind === 'liquid'), powders = found.filter(f => f.kind === 'powder');
    const ops = [];
    const dur = duration(text);
    // which vessel?
    const heat = A.fry || A.boil || A.cook;
    let vessel = S.active;
    if (heat || A.bake) vessel = 'pan';
    else if ((A.mix || A.rest || A.shape) && !(S.active === 'pan' && S.fire > 0)) vessel = S.active || 'bowl';
    else if (A.add || liquids.length || solids.length) vessel = S.active || (solids.some(s => ['meat', 'chicken', 'fish', 'mince', 'rice', 'pasta', 'legume'].includes(s.type)) && !A.mix ? 'pan' : 'bowl');
    if (A.chop && !A.add && !heat && !A.mix) vessel = null;            // only chopping in this step
    // chopping
    for (const it of solids) {
      if (CHOPPABLE.has(it.type) && !S.chopped[it.type] && (A.chop || (vessel && heat))) {
        ops.push({ op: 'chop', type: it.type }); S.chopped[it.type] = true; S.board[it.type] = 1; types.add(it.type);
      }
    }
    if (vessel && vessel !== S.active && S.active === 'bowl' && vessel === 'pan' && Object.keys(S.bowl).length) {
      ops.push({ op: 'bowlToPan' }); for (const k in S.bowl) { S.pan[k] = 1; } S.bowl = {}; S.mound.level = 0;
    }
    if (vessel) S.active = vessel;
    // heat on
    if (vessel === 'pan' && heat && !A.bake) { const h = heatOf(t); if (Math.abs(h - S.fire) > 0.05) { ops.push({ op: 'fire', level: h }); S.fire = h; } }
    // oil first when frying
    const oil = liquids.find(l => l.type === 'oil');
    if (vessel === 'pan' && oil && (A.fry || A.add || heat)) { ops.push({ op: 'oil' }); S.oil = 1; }
    // solids into the vessel
    if (vessel) {
      const add = solids.filter(it => !S[vessel][it.type] && (A.add || heat || A.mix || A.bake || A.chop === false || true));
      const fromBoard = add.filter(it => S.board[it.type]).map(it => it.type);
      const fromStage = add.filter(it => !S.board[it.type]).map(it => it.type);
      if (fromBoard.length) { ops.push({ op: 'board', vessel, types: fromBoard }); fromBoard.forEach(k => { delete S.board[k]; S[vessel][k] = 1; }); }
      for (const k of fromStage) { ops.push({ op: 'stage', vessel, type: k }); S[vessel][k] = 1; types.add(k); }
      add.forEach(it => types.add(it.type));
    }
    // liquids & powders
    for (const l of liquids) if (l.type !== 'oil' && vessel) {
      ops.push({ op: 'pour', vessel, kind: l.type, color: l.color });
      if (vessel === 'pan') { S.liq.level = Math.min(0.02, S.liq.level + (l.type === 'paste' ? 0.002 : 0.008)); S.liq.op = 0.85; S.liq.color = l.type === 'paste' ? 0x9a2a18 : (S.liq.op > 0.5 && S.sauce > 0.3 ? S.liq.color : l.color); if (l.type === 'paste') S.sauce = Math.min(1, S.sauce + 0.5); }
      else { S.mound.level = Math.min(0.06, S.mound.level + 0.015); S.mound.color = l.color; }
    }
    for (const p of powders) if (vessel || p.type === 'salt' || p.type === 'spice') {
      ops.push({ op: 'powder', vessel: vessel || 'pan', kind: p.type });
      if (vessel === 'bowl' && (p.type === 'flour' || p.type === 'sugar')) { S.mound.level = Math.min(0.06, S.mound.level + 0.015); if (p.type === 'flour') S.mound.color = 0xf6eedb; }
    }
    if (A.shape && vessel === 'bowl') { ops.push({ op: 'shape' }); }
    if (A.cover && vessel === 'pan') { ops.push({ op: 'lid', on: true }); S.lid = true; }
    // cooking / mixing / resting time
    if (A.bake) {
      for (const ty in S.pan) S.done[ty] = 1; S.baked = true; S.fire = 0;
      ops.push({ op: 'bake', dur: dur || 1800 });
    } else if (A.rest && dur >= 3600) {
      ops.push({ op: 'rest', dur });
    } else if (vessel === 'pan' && (heat || A.mix || A.add)) {
      const k = A.fry ? 0.45 : A.boil ? 0.35 : 0.3;
      for (const ty in S.pan) S.done[ty] = Math.min(1, (S.done[ty] || 0) + k * (dur ? Math.min(1, 0.4 + dur / 1200) : 0.6));
      if (S.liq.op > 0 && (A.boil || A.cook)) S.sauce = Math.min(1, S.sauce + 0.25);
      ops.push({ op: 'cook', mode: A.fry ? 'fry' : A.boil ? 'boil' : 'cook', dur });
    } else if (vessel === 'bowl' && (A.mix || A.add || A.shape)) {
      if (dur > 900) { ops.push({ op: 'mixBowl', dur: 0 }); ops.push({ op: 'rest', dur }); } else ops.push({ op: 'mixBowl', dur });
    } else if (A.rest) {
      ops.push({ op: 'rest', dur });
    }
    if (A.rest && dur && !ops.find(o => o.op === 'rest' || o.dur)) ops.push({ op: 'rest', dur });
    if (!ops.length && !isServe && S.active) ops.push(S.active === 'pan' ? { op: 'cook', mode: 'cook', dur: 0 } : { op: 'mixBowl', dur: 0 });
    if (isServe) { ops.push({ op: 'serve' }); S.fire = 0; S.lid = false; }
    steps.push({ text: text === '__serve__' ? null : text, ops, snap: snap(), garnish: A.garnish });
  });
  types.add('parsley');
  return { items, steps, types: [...types] };
}

// ---------- recipe object for the engine ----------
export function buildGeneric(src, H) {
  const plan = planRecipe(src);
  const title = src.name || 'Tarif'; plan.title = title;
  const ing = plan.items.map(it => `${ICON[it.type] || '•'} ${it.line}`).slice(0, 14);
  const stepTitle = (st, i) => {
    if (!st.text) return 'Servis';
    const o = st.ops.map(x => x.op);
    if (o.includes('bake')) return 'Fırında pişir'; if (o.includes('serve')) return 'Servis';
    if (o.includes('chop') && o.length <= 2) return 'Doğra';
    if (o.includes('cook')) { const m = st.ops.find(x => x.op === 'cook').mode; return m === 'fry' ? 'Kavur / kızart' : m === 'boil' ? 'Kaynat / haşla' : 'Pişir'; }
    if (o.includes('mixBowl')) return 'Karıştır'; if (o.includes('rest')) return 'Dinlendir';
    return st.text.split(/[,.;]/)[0].slice(0, 28);
  };
  const steps = [{
    title: 'Merhaba!', apply() { },
    async play(c) {
      c.shot('front', 0.01); c.ch.look(V(0, 0.5, 2)); c.ch.wave();
      await c.say(`Merhaba {hey}! Ben {name}. Bugün birlikte ${title} yapacağız.`);
      await c.say(`Malzemelerimiz hazır. ${plan.steps.length} adımda bitireceğiz. Hazırsan başlayalım!`, 'Sonraki için ⏭ düğmesine bas ya da “sonraki” de.');
    },
  }];
  plan.steps.forEach((st, i) => {
    steps.push({
      title: stepTitle(st, i),
      apply(c) { H.applySnap(c, st.snap); },
      async play(c) { await H.playStep(c, st, i, plan, title); H.applySnap(c, st.snap); },
    });
  });
  return { id: 'wb-' + (src.key || title), title, time: src.time ? `~${src.time} dk` : '', ing, steps, types: plan.types, plan };
}
