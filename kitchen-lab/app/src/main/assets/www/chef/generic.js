// Generic recipe player: reads ingredient lines + step sentences (TR/EN/RU/AZ),
// works out what happens in every step and turns it into chef actions.
// Every step stores the scene state it ends with, so ⏮ / ↻ work for any recipe.
import * as THREE from 'three';
import { chop, fly, boardToPan, startStir, stopStir, pinch, turn } from './recipes.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const low = s => String(s || '').toLocaleLowerCase('tr-TR');

// ---------- ingredient classification ----------
// decided first: spices that contain "biber", flours, sauces, wraps that are not food
const PRE = [
  ['skip', 'skip', /folyo|şiş çubu|kürdan|ıslak bez|muz yaprağı|yaprağı veya (alüminyum )?folyo|^\s*(pilav|salata|sebze|naan|injera|turşu|salsa|chips|cips)\s*$|servis için|baobab|muz gövdesi|farofa/],
  ['spice', 'powder', /karabiber|pul ?biber|toz ?biber|isot|paprika|gochugaru|kaşığı[^,]*kırmızı biber|tatlı (macar )?kırmızı biber|biberli .*baharat|masala|ras el hanout|kakule|muskat|anason|toz zencefil|öğütülmüş zencefil|kurkuma|zerdeçal|achiote|mercanköşk|ardıç|vanilin|vanilya|vanilla|kerevit tozu|çemen tohumu|hulba|tane karabiber|kimyon|tarçın|sumak|yenibahar|karanfil|safran|köri|kekik|baharat|zaatar|za'atar|cajun|curry|cumin|cinnamon|oregano|thyme|turmeric|cardamom|nutmeg/],
  ['flour', 'powder', /mısır unu|mısır nişasta|masa harina|nohut unu|pirinç unu|galeta unu|irmik|darı unu|sorgum unu|masarepa|mealie meal|nişasta|\bun\b|unu\b|flour|starch|semolina|мук|крахмал/],
  ['nutbutter', 'liquid', /fıstık ezmesi|fındık ezmesi|badem ezmesi|peanut butter/, 0x9a6a3a],
  ['chocsauce', 'liquid', /çikolata sosu|sıcak çikolata|kakao sosu|chocolate sauce|nutella/, 0x4a2414],
  ['sauce', 'liquid', /balık sosu|hoisin|tamarind|chutney|harissa|ajvar|tahin|humus|mayonez|hardal|ketçap|remoulade|worcestershire|lizano|wasabi|zhug|\bsos\b|sosu\b|doubanjiang|pesto|sriracha|cassareep|browning|acı sos|salsa\b|mustard|mayo|sauce/, 0xc8873a],
];
const SOLID = [
  ['sausage', /sucuk|chorizo|chouriço|linguiça|morcilla|salam|sosis|jambon|pastırma|bacon|slanina|chicharrón|füme domuz|domuz pastırma|sausage|ham\b|колбас|бекон|ветчин/],
  ['liver', /ciğer|böbrek|işkembe|paça|ayak veya kuyruk|dalak|yürek|liver|kidney|tripe|печен/],
  ['duck', /ördek|\bkaz\b|duck|goose|утк/],
  ['mince', /kıyma|köfte|ground (beef|meat|lamb)|minced|фарш|qiymə/],
  ['chicken', /tavu[kğ]|piliç|hindi|chicken|turkey|курин|курица|индейк|toyuq/],
  ['squid', /kalamar|mürekkep balığı|ahtapot|squid|calamari|octopus|кальмар|осьмин/],
  ['mussel', /midye|istiridye|deniz tarağı|clam|mussel|oyster|scallop|мидии|устриц/],
  ['crab', /yengeç|ıstakoz|kerevit|lobster|crab|crayfish|краб|омар/],
  ['shrimp', /karides|shrimp|prawn|кревет/],
  ['salmon', /somon|alabalık|salmon|trout|лосос|форел/],
  ['tuna', /ton balığı|\bton\b|orkinos|tuna|тунец/],
  ['fish', /balı[kğ]|levrek|hamsi|ançüez|uskumru|morina|mezgit|sazan|ringa|sardalya|çipura|lüfer|palamut|kalkan|jackfish|chambo|\bfish|cod\b|рыб|balıq/],
  ['meat', /\bet\b|eti\b|kuzu|dana|sığır|kuşbaşı|biftek|bonfile|antrikot|vacío|pirzola|incik|\bbut\b|kaburga|döş\b|döşü|keçi|koyun|kemik|beef|lamb|mutton|veal|pork|steak|говяд|баран|свинин|мяс|ət\b|quzu/],
  ['leek', /pırasa|leek|порей|pırasa/],
  ['onion', /soğan|onion|shallot|лук\b|луковиц/],
  ['garlic', /sarımsak|garlic|чеснок|sarımsaq/],
  ['tomato', /domates|tomatillo|tomato|помидор|томат|pomidor/],
  ['greens', /ıspanak|lahana|marul|roka|pazı|yaprağı|yaprakları|yaprak|yeşillik|bok choy|\basma|callaloo|kale|spinach|cabbage|lettuce|chard|leaves|шпинат|капуст|салат|kələm|ispanaq/],
  ['tuber', /tatlı patates|manyok|taro|\byam\b|ñame|pomtajer|pulaka|cassava|kassava|chayote|ekmek ağacı|tapyoka|sweet potato|батат/],
  ['banana', /plantain|pişirme muzu|yeşil muz|\bmuz\b|banana|банан/],
  ['potato', /patates|potato|картоф|kartof/],
  ['carrot', /havuç|carrot|морков|yerkökü/],
  ['beet', /pancar|beet|свекл|çuğundur/],
  ['radish', /turp|şalgam|radish|turnip|daikon|редис|репа/],
  ['celery', /kereviz|celery|сельдер/],
  ['okra', /bamya|okra|бамия/],
  ['broccoli', /brokoli|broccoli|брокколи/],
  ['cauliflower', /karnabahar|cauliflower|цветная капуст/],
  ['greenbean', /taze fasulye|yeşil fasulye|çalı fasulye|green bean|стручков/],
  ['peas', /bezelye|\bpeas?\b|горошек/],
  ['eggplant', /patlıcan|eggplant|aubergine|баклаж|badımcan/],
  ['zucchini', /kaba[kğ]|zucchini|courgette|squash|pumpkin|кабач|тыкв|balqabaq/],
  ['mushroom', /mantar|mushroom|гриб|göbələk/],
  ['pickle', /turşu|pickle|kornişon|gherkin|солен|маринован/],
  ['cucumber', /salatalık|hıyar|cucumber|огур|xiyar/],
  ['avocado', /avokado|avocado|авокадо/],
  ['olive', /zeytin(?!yağ)|olive(?! oil)|олив|маслин/],
  ['ginger', /zencefil|galangal|ginger|имбир/],
  ['corn', /mısır|corn|hominy|кукуруз|qarğıdalı/],
  ['lentil', /mercime[kğ]|lentil|dal\b|чечевиц|mərci/],
  ['legume', /fasulye|nohut|börülce|\bbakla\b|barbunya|maş|bean|chickpea|ful\b|фасол|нут|горох|lobya|noxud/],
  ['pasta', /makarna|erişte|noodle|pasta|spagetti|spaghetti|şehriye|vermicelli|лапш|макарон|вермиш|əriştə/],
  ['rice', /pirin[cç]|rice|düyü|рис|pilavlık/],
  ['bulgur', /bulgur|firik|buğday|harees|arpa|darı|frikeh|wheat|barley|millet|булгур|перлов|пшен/],
  ['couscous', /kuskus|couscous|kinoa|quinoa|кускус|киноа/],
  ['oats', /yulaf|oat|овсян/],
  ['cheese', /peynir|kaşar|\blor\b|feta|mozzarella|parmesan|ricotta|gruy[eè]re|emmental|cheddar|vacherin|hellim|halloumi|paneer|labne|cheese|сыр|brynza|pendir/],
  ['egg', /yumurta|\beggs?\b|яйц/],
  ['pepper', /biber|pepper|chili|chilli|jalape[nñ]o|chipotle|ancho|pasilla|mulato|guajillo|scotch bonnet|ají|перец|bibər/],
  ['chocolate', /çikolata|chocolate|kakao|шоколад/],
  ['biscuit', /bisküvi|gofret|kraker|cracker|waffle yaprağı|kedidili|бисквит|печенье/],
  ['bread', /ekme[kğ]|lavaş|yufka|pide|bazlama|galeta|simit|pampuşka|tortilla|chapati|injera|naan|pita|bread|хлеб|лаваш|çörək/],
  ['bayleaf', /defne|bay leaf|pandan|лавров/],
  ['parsley', /maydanoz|dereotu|nane|kişniş|fesleğen|tere\b|biberiye|çemen otu|taze soğan|yeşil soğan|frenk soğanı|parsley|dill|mint|coriander|cilantro|basil|rosemary|chive|зелен|петруш|укроп|мят|кинз|базилик|şüyüd|keşniş|reyhan|cəfəri/],
  ['lemon', /limon(?!(un)? suyu)|lime(?! juice)|misket limonu|лимон(?!ный сок)/],
  ['citrus', /portakal(?! suyu)|mandalina|greyfurt|orange(?! juice)|grapefruit|апельсин|мандарин/],
  ['berry', /yaban mersini|kızılcık|ahududu|böğürtlen|çilek|vişne|kiraz|berr|frenk üzümü|черник|клюкв|малин|клубник/],
  ['raisin', /kuru üzüm|kuru erik|kuru kayısı|hurma(?! şurub)|kuru incir|kuru meyve|raisin|prune|dried|изюм|курага|финик/],
  ['kiwi', /kivi|kiwi|çarkıfelek|passion|киви/],
  ['fruit', /elma|armut|üzüm|kayısı|erik|ayva|\bnar\b|şeftali|ananas|mango|incir|kavun|karpuz|pandanus|ackee|apple|pear|grape|apricot|plum|peach|pineapple|melon|fig\b|яблок|груш|виноград|абрикос|слив|персик|ананас|alma|armud/],
  ['nuts', /ceviz|fındık|badem|fıstık|kaju|susam|fıstı|çam fıstığı|hindistan cevizi rendesi|walnut|hazelnut|almond|pistachio|peanut|cashew|sesame|орех|миндал|фисташ|кунжут|qoz|fındıq|badam/],
  ['dough', /hamur|krep|knedl|pancake|dough|тесто|xəmir/],
];
const LIQUID = [
  ['paste', /salça|domates püresi|tomato paste|томатн(ая|ой) паст|pomidor pastası/, 0xa8261a],
  ['broth', /et suyu|tavuk suyu|sebze suyu|kemik suyu|dashi|broth|stock|бульон|bulyon/, 0xc89a5a],
  ['coconut', /hindistan cevizi (sütü|kreması)|coconut (milk|cream)|кокосов/, 0xfaf6ee],
  ['milk', /süt\b|sütü|milk|молок|süd/, 0xfbfaf5],
  ['cream', /krema|kaymak|cream|сливк|qaymaq|smetana|ekşi krema/, 0xfff8ea],
  ['yogurt', /yoğurt|yogurt|ayran|kefir|йогурт|кефир|qatıq/, 0xfcfbf7],
  ['wine', /şarap|wine|вино|şərab|rom\b|rum\b|brendi|konyak/, 0x8a1e2a],
  ['juice', /limon suyu|limonun suyu|nar ekşisi|ekşisi|portakal suyu|sirke|mirin|sake|lemon juice|lime juice|orange juice|vinegar|juice|уксус|сок/, 0xf5e6a0],
  ['soy', /soya sosu|soy sauce|соев/, 0x4a2410],
  ['oil', /zeytinyağ|sıvı yağ|ayçiçek|tereyağ|margarin|ghee|sade yağ|yağ\b|yağı\b|olive oil|\boil\b|butter|масл|yağ/, 0xe0b23a],
  ['honey', /\bbal\b|pekmez|şurup|şurubu|reçel|dibs|honey|syrup|molasses|jam\b|мёд|мед\b|сироп|варень/, 0xd99a2a],
  ['water', /\bsu\b|suyu\b|suyunu|suyla|\bsuda\b|\bsuya\b|sıcak su|soğuk su|kaynar su|water|вод/, 0xdcecff],
];
const POWDER = [
  ['salt', /tuz|salt|соль|duz/],
  ['spice', /baharat|pepper(?!s)|spice|специ|ədviyyat|darçın/],
  ['flour', /\bun\b|unu\b|flour|мук/], ['sugar', /şeker|sugar|сахар|şəkər/], ['yeast', /maya|kabartma tozu|karbonat|yeast|baking powder|baking soda|дрожж|разрыхл/],
];
// JS \b is ASCII-only ("balık" would match \bbal\b) → make every table Unicode-aware
const WBND = '(?:(?<!\\p{L})(?=\\p{L})|(?<=\\p{L})(?!\\p{L}))';
const U = re => new RegExp(re.source.split('\\b').join(WBND), 'u');
for (const tb of [PRE, SOLID, LIQUID, POWDER]) for (const row of tb) { const i = row.findIndex(x => x instanceof RegExp); row[i] = U(row[i]); }
export const GRAIN = new Set(['rice', 'bulgur', 'couscous', 'oats', 'lentil']);
const CHOPPABLE = new Set(['onion', 'leek', 'garlic', 'tomato', 'pepper', 'potato', 'tuber', 'banana', 'carrot', 'beet', 'radish', 'celery', 'okra', 'broccoli', 'cauliflower', 'greenbean', 'eggplant', 'zucchini', 'mushroom', 'greens', 'cucumber', 'pickle', 'avocado', 'ginger', 'parsley', 'lemon', 'citrus', 'kiwi', 'fruit', 'cheese', 'meat', 'chicken', 'duck', 'liver', 'sausage', 'fish', 'salmon', 'tuna', 'squid', 'bread', 'chocolate']);
const ICON = { meat: '🥩', mince: '🥩', chicken: '🍗', duck: '🦆', liver: '🥩', sausage: '🌭', fish: '🐟', salmon: '🐟', tuna: '🐟', shrimp: '🦐', squid: '🦑', mussel: '🦪', crab: '🦀', onion: '🧅', leek: '🧅', garlic: '🧄', tomato: '🍅', pepper: '🌶️', potato: '🥔', tuber: '🍠', banana: '🍌', carrot: '🥕', beet: '🟣', radish: '⚪', celery: '🥬', okra: '🫛', broccoli: '🥦', cauliflower: '🥦', greenbean: '🫛', peas: '🫛', eggplant: '🍆', zucchini: '🥒', mushroom: '🍄', greens: '🥬', cucumber: '🥒', pickle: '🥒', avocado: '🥑', olive: '🫒', ginger: '🫚', corn: '🌽', legume: '🫘', lentil: '🫘', rice: '🍚', bulgur: '🌾', couscous: '🌾', oats: '🌾', pasta: '🍝', cheese: '🧀', egg: '🥚', parsley: '🌿', bayleaf: '🍃', lemon: '🍋', citrus: '🍊', berry: '🫐', raisin: '🍇', kiwi: '🥝', fruit: '🍎', nuts: '🥜', chocolate: '🍫', biscuit: '🍪', bread: '🍞', dough: '🫓', water: '💧', milk: '🥛', coconut: '🥥', cream: '🥛', yogurt: '🥛', oil: '🫒', broth: '🍲', paste: '🥫', sauce: '🥣', nutbutter: '🥜', chocsauce: '🍫', wine: '🍷', juice: '🍋', soy: '🥢', honey: '🍯', salt: '🧂', spice: '🌶️', flour: '🌾', sugar: '🍬', yeast: '🧁' };

function classify(line) {
  const l = low(line);
  for (const [k, kind, re, col] of PRE) if (re.test(l)) {
    // "1 kg mısır unu" is flour, but "zeytin ezmesi" style sauces lose to an obvious solid only for 'sauce'
    if (kind === 'skip') return { kind: 'skip', type: 'skip' };
    return kind === 'liquid' ? { kind, type: k, color: col } : { kind, type: k };
  }
  // a liquid is decided first when the line is clearly one ("2 yemek kaşığı zeytinyağı")
  for (const [k, re, col] of LIQUID) if (re.test(l)) {
    // "tavuk suyu" is broth, but "1 tavuk" is solid; liquids only if no stronger solid word is first
    const solidFirst = SOLID.find(([t, r]) => r.test(l) && !['meat', 'chicken'].includes(t));
    if (!solidFirst || ['broth', 'paste', 'juice', 'oil', 'coconut', 'honey'].includes(k)) return { kind: 'liquid', type: k, color: col };
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
  bake: /fırında|fırına|fırını|fırının|önceden ısıtılmış|°c|\bbake|oven|roast|духов|запек|soba/,
  mix: /karıştır|çırp|yoğur|harmanla|birleştir|\bmix|whisk|knead|combine|\bstir|\bbeat|toss|смеш|взбей|замес|перемеш|qarışdır/,
  add: /ekle|koy|ilave|at(ın|ıp)|dök|\badd|pour|\bput\b|place|добав|влей|положи|əlavə/,
  rest: /dinlendir|beklet|soğu|mayala|marine|\brest|chill|\bcool|marinat|let .* stand|оставь|охлад|мариню|saxla/,
  cover: /kapa(ğ|k)ını kapat|kapağı kapa|kapağını|örtün|\bcover|накрой|qapağ/,
  wash: /yıka|ıslat|suda beklet|durula|rinse|soak|wash|промой|замочи|yuyu/,
  drain: /süz(ün|üp|ül|er)|drain|откин|слей/,
  serve: /servis|sunun|ile yiyin|ile yenir|\bserve|plate|подав|təqdim/,
  garnish: /süsle|serp|garnish|sprinkle|укрась|посып|bəzə/,
  shape: /şekil ver|top|yuvarla|sar(ın|ıp|arak)|doldur|aç(ın|ıp)|\broll|shape|wrap|stuff|\bfill|\bform|лепи|сверн|начин|скатай|bük/,
};
for (const k in ACT) ACT[k] = U(ACT[k]);
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
      if (it.kind === 'skip') continue;
      const table = it.kind === 'solid' ? SOLID : it.kind === 'liquid' ? [...LIQUID, ...PRE.filter(p => p[1] === 'liquid').map(p => [p[0], p[2]])] : [...POWDER, ...PRE.filter(p => p[1] === 'powder').map(p => [p[0], p[2]])];
      const hit = it.stems.some(st => st.length >= 3 && t.includes(st)) || !!table.find(([k]) => k === it.type)?.[1].test(t);
      if (hit && !out.find(o => o.type === it.type && o.kind === it.kind)) out.push(it);
    }
    return out;
  };
  const S = { board: {}, pan: {}, bowl: {}, done: {}, sauce: 0, liq: { level: 0, color: 0xc0502a, op: 0 }, grow: {}, washed: {}, mound: { level: 0, color: 0xf2e2bd }, oil: 0, fire: 0, lid: false, chopped: {}, active: null, baked: false };
  const snap = () => JSON.parse(JSON.stringify(S));
  const types = new Set();
  const steps = [];
  const stTexts = src.st.slice();
  if (!stTexts.some(x => ACT.serve.test(low(x)))) stTexts.push('__serve__');
  stTexts.forEach((text, si) => {
    const isServe = text === '__serve__' || (si === stTexts.length - 1 && ACT.serve.test(low(text)));
    const t = low(text), A = {}; for (const k in ACT) A[k] = ACT[k].test(t);
    if (A.bake && /(veya|ya da|or) (fırında|in the oven)/.test(t) && (A.fry || A.boil || A.cook)) A.bake = false;   // "kızartın (veya fırında közleyin)"
    const found = text === '__serve__' ? [] : findIn(text);
    const solids = found.filter(f => f.kind === 'solid'), liquids = found.filter(f => f.kind === 'liquid'), powders = found.filter(f => f.kind === 'powder');
    const ops = [];
    const dur = duration(text);
    // which vessel?
    const heat = A.fry || A.boil || A.cook;
    let vessel = S.active;
    if (heat || A.bake) vessel = 'pan';
    else if ((A.mix || A.rest || A.shape) && !(S.active === 'pan' && S.fire > 0)) vessel = S.active || 'bowl';
    else if (A.add || liquids.length || solids.length) vessel = S.active || (solids.some(s => ['meat', 'chicken', 'duck', 'liver', 'sausage', 'fish', 'salmon', 'tuna', 'squid', 'mussel', 'crab', 'shrimp', 'mince', 'pasta', 'legume', ...GRAIN].includes(s.type)) && !A.mix ? 'pan' : 'bowl');
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
    // washing / soaking grains: they sit in the bowl until a later step adds them
    const washG = A.wash ? solids.filter(it => GRAIN.has(it.type) && !S.pan[it.type] && !S.washed[it.type]) : [];
    if (washG.length) {
      ops.push({ op: 'wash', types: washG.map(it => it.type), dur: dur && dur <= 8 * 3600 ? dur : 0 });
      washG.forEach(it => { S.washed[it.type] = 1; S.bowl[it.type] = 1; types.add(it.type); });
      // a wash-only step ends here; "yıkanmış pirinci ekleyin" carries on and the grains go in now
      if (!heat && !A.add && !A.mix && !A.bake) { for (let k = solids.length - 1; k >= 0; k--) if (washG.includes(solids[k])) solids.splice(k, 1); vessel = null; }
    }
    if (vessel) S.active = vessel;
    // heat on
    if (vessel === 'pan' && heat && !A.bake) { const h = heatOf(t); if (Math.abs(h - S.fire) > 0.05) { ops.push({ op: 'fire', level: h }); S.fire = h; } }
    // oil first when frying
    const oil = liquids.find(l => l.type === 'oil');
    if (vessel === 'pan' && oil && (A.fry || A.add || heat)) { ops.push({ op: 'oil' }); S.oil = 1; }
    // "haşlayın" with no liquid in the pot yet: water goes in first (and boils) before anything is added
    if (vessel === 'pan' && A.boil && !A.bake && !liquids.some(l => l.type !== 'oil') && S.liq.level < 0.004) {
      ops.push({ op: 'pour', vessel, kind: 'water', color: 0xdcecff });
      S.liq.level = 0.016; S.liq.op = 0.8; S.liq.color = 0xdcecff;
    }
    // solids into the vessel
    if (vessel) {
      const add = solids.filter(it => !S[vessel][it.type] && (A.add || heat || A.mix || A.bake || A.chop === false || true));
      const fromBoard = add.filter(it => S.board[it.type]).map(it => it.type);
      // "doğradıklarınızı / hepsini ekleyin": everything waiting on the board goes in
      if (/doğradı|doğranmış|hepsini|tümünü|bütün malzeme|everything|all the/.test(t)) for (const k in S.board) if (!fromBoard.includes(k)) fromBoard.push(k);
      const fromWash = add.filter(it => S.washed[it.type] && S.bowl[it.type] && vessel !== 'bowl').map(it => it.type);
      const fromStage = add.filter(it => !S.board[it.type] && !fromWash.includes(it.type)).map(it => it.type);
      if (fromWash.length) { ops.push({ op: 'washedIn', vessel, types: fromWash }); fromWash.forEach(k => { delete S.bowl[k]; S[vessel][k] = 1; }); }
      if (fromBoard.length) { ops.push({ op: 'board', vessel, types: fromBoard }); fromBoard.forEach(k => { delete S.board[k]; S[vessel][k] = 1; }); }
      for (const k of fromStage) { ops.push({ op: 'stage', vessel, type: k }); S[vessel][k] = 1; types.add(k); }
      add.forEach(it => types.add(it.type));
    }
    // liquids & powders
    // dressing: olive oil goes straight into a salad / mixing bowl
    if (vessel === 'bowl' && oil) ops.push({ op: 'pour', vessel, kind: 'oil', color: 0xd8b03a });
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
      const cop = { op: 'cook', mode: A.fry ? 'fry' : A.boil ? 'boil' : 'cook', dur };
      const grains = Object.keys(S.pan).filter(k => GRAIN.has(k) || k === 'pasta');
      if (grains.length && S.liq.level > 0.001 && (A.boil || A.cook)) {
        // grains drink the water and swell; the last bit when the step says so (or it is a long simmer)
        const full = /çek|demle|absorb|kısık|ağır ateş|tane tane|yumuşa|piş(ene|inceye)|until tender/.test(t) || dur >= 600;
        cop.absorb = true;
        grains.forEach(k => S.grow[k] = Math.max(S.grow[k] || 0, full ? 1 : 0.55));
        if (full) { S.liq.level = 0; S.liq.op = 0; } else S.liq.level *= 0.5;
      }
      if (grains.length && (A.drain || A.wash) && S.liq.level > 0) { S.liq.level = 0; S.liq.op = 0; cop.drain = true; }   // "süzün"
      ops.push(cop);
    } else if (vessel === 'bowl' && A.rest && !A.mix && dur) {
      // soaking in the bowl (bulgur in hot water...): grains drink it up
      Object.keys(S.bowl).filter(k => GRAIN.has(k)).forEach(k => { S.grow[k] = 1; S.mound.level = 0; });
      ops.push({ op: 'rest', dur });
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

// ---------- a menu: main dish (A) + side salad / meze (B) cooked together ----------
// One cook, like in a real kitchen: while the main dish simmers / bakes / rests on its own timer,
// the chef makes the side; when the timer is up she goes back to the main dish. Both are served together.
const LONG = 360; // a wait of 6+ minutes is worth using for the side dish
export function buildMenu(srcA, srcB, H) {
  const planA = planRecipe(srcA), planB = planRecipe(srcB);
  const nameA = srcA.name || 'Ana yemek', nameB = srcB.name || 'Salata';
  planA.title = nameA; planB.title = nameB; planA.sideTitle = nameB;
  // the side's own serve step is dropped: everything is served together at the end
  const bSteps = planB.steps.filter(st => !st.ops.some(o => o.op === 'serve') || st.text);
  bSteps.forEach(st => { st.ops = st.ops.filter(o => o.op !== 'serve'); });
  if (!bSteps.length || !bSteps[bSteps.length - 1].ops.length && !bSteps[bSteps.length - 1].text) bSteps.pop();
  const estB = st => 1.5 + st.ops.length * 0.8 + (st.ops.find(o => o.dur)?.dur || 0) / 60; // minutes of work
  const merged = [];
  let j = 0;
  const pushB = budget => {
    let used = 0;
    while (j < bSteps.length && (budget == null || used === 0 || used + estB(bSteps[j]) <= budget)) { used += estB(bSteps[j]); merged.push({ dish: 'B', st: bSteps[j], idx: j }); j++; }
  };
  const aSteps = planA.steps;
  aSteps.forEach((st, i) => {
    const isServe = st.ops.some(o => o.op === 'serve');
    if (isServe) { pushB(null); merged.push({ dish: 'A', st, idx: i }); return; }
    const entry = { dish: 'A', st, idx: i };
    merged.push(entry);
    const long = [...st.ops].reverse().find(o => ['cook', 'bake', 'rest'].includes(o.op) && o.dur >= LONG);
    if (long && j < bSteps.length && i < aSteps.length - 1) {
      long.bg = true; entry.bg = long;
      const at = merged.length - 1;
      pushB(long.dur / 60);
      // the next main-dish step first waits for this timer
      const nxt = aSteps[i + 1]; nxt.waitFor = { m: at + 1, op: long.op };
    }
  });
  if (j < bSteps.length) { const s = merged.findIndex(x => x.dish === 'A' && x.st.ops.some(o => o.op === 'serve')); merged.splice(s < 0 ? merged.length : s, 0, ...bSteps.slice(j).map((st, k) => ({ dish: 'B', st, idx: j + k }))); }
  merged.forEach((m, k) => { if (m.bg) { const n = merged.findIndex((x, q) => q > k && x.dish === 'A'); m.bg.until = n < 0 ? 1e9 : n + 1; } });
  const nB = bSteps.length;
  const stepTitle = (st) => {
    if (!st.text) return 'Servis';
    const o = st.ops.map(x => x.op);
    if (o.includes('bake')) return 'Fırında pişir'; if (o.includes('serve')) return 'Servis';
    if (o.includes('wash')) return 'Yıka / ıslat';
    if (o.includes('chop') && o.length <= 2) return 'Doğra';
    if (o.includes('cook')) { const m = st.ops.find(x => x.op === 'cook').mode; return m === 'fry' ? 'Kavur / kızart' : m === 'boil' ? 'Kaynat / haşla' : 'Pişir'; }
    if (o.includes('mixBowl')) return 'Karıştır'; if (o.includes('rest')) return 'Dinlendir';
    return st.text.split(/[,.;]/)[0].slice(0, 28);
  };
  const steps = [{
    title: 'Merhaba!', apply() { },
    async play(c) {
      c.shot('front', 0.01); c.ch.look(V(0, 0.5, 2)); c.ch.wave();
      await c.say(`Merhaba {hey}! Ben {name}. Bugün ${nameA} ve yanında ${nameB} yapacağız.`);
      await c.say(`İkisini birlikte hazırlayacağız: ${nameA} pişerken boş durmayıp ${nameB} yapacağız. Hazırsan başlayalım!`, 'Sonraki için ⏭ düğmesine bas ya da “sonraki” de.');
    },
  }];
  merged.forEach((m, k) => {
    const plan = m.dish === 'A' ? planA : planB;
    const label = m.dish === 'A' ? `${nameA} · adım ${m.idx + 1} / ${planA.steps.length}` : `🥗 ${nameB} · adım ${m.idx + 1} / ${nB}`;
    steps.push({
      title: (m.dish === 'B' ? '🥗 ' : '🍲 ') + stepTitle(m.st),
      dish: m.dish,
      apply(c) { const cc = m.dish === 'B' ? c.side() : c; H.applySnap(cc, m.st.snap); if (m.bg) H.bgResume(c, m.st, m.idx, planA, m.bg, k + 1); },
      async play(c) {
        const cc = m.dish === 'B' ? c.side() : c;
        await H.playStep(cc, m.st, m.idx, plan, plan.title, { label, mi: k + 1, menu: true, bg: m.bg });
        H.applySnap(cc, m.st.snap);
        if (m.bg) H.bgResume(c, m.st, m.idx, planA, m.bg, k + 1);
      },
    });
  });
  const ing = [...planA.items.map(it => `${ICON[it.type] || '•'} ${it.line}`).slice(0, 10), ...planB.items.filter(it => it.kind !== 'skip').map(it => `🥗 ${it.line}`).slice(0, 8)];
  const typesB = [...new Set(planB.types)];
  return { id: 'wb-menu-' + (srcA.key || nameA) + '+' + (srcB.key || nameB), title: `${nameA} + ${nameB}`, time: srcA.time ? `~${Math.max(srcA.time, srcB.time || 0) + 10} dk` : '', ing, steps, types: planA.types, typesB, plan: planA, planB, menu: true };
}
