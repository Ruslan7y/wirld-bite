/* World Bite — nutrition estimator
   Estimates energy (kcal), protein, carbohydrate and fat per serving from free-text ingredient lines.
   Values per 100 g: [kcal, protein, carbs, fat]. Order matters: more specific patterns first.
   g = typical grams for "1 piece", cup = grams in 1 su bardağı (200 ml), tbsp = grams in 1 yemek kaşığı. */
const NUTRI_DB = [
  [/kemiği|kemikleri|kemik\b|bones/i, 40, 4, 0, 2, 0, 0, 0, '🦴'],
  [/karabiber|pul biber|toz biber|kırmızı toz biber|tatlı kırmızı biber|kırmızı biber(i)? \(toz|paprika|gochugaru|kekik|kimyon/i, 0, 0, 0, 0, 0, 0, 0, '🧂'],
  // [regex, kcal, P, C, F, piece g, cup g, tbsp g, emoji]
  [/yumurta sar|sarısı/i, 322, 16, 3.6, 27, 17, 0, 0, '🥚'],
  [/yumurta akı|akı\b/i, 52, 11, 0.7, 0.2, 33, 0, 0, '🥚'],
  [/yumurta|egg/i, 143, 13, 1, 10, 50, 0, 0, '🥚'],
  [/fıstık ezmesi|peanut butter/i, 588, 25, 20, 50, 0, 250, 16, '🥜'],
  [/hindistan cevizi krem/i, 330, 3.6, 6.7, 34.7, 0, 220, 15, '🥥'],
  [/hindistan cevizi süt|coconut milk/i, 230, 2.3, 6, 24, 0, 220, 15, '🥥'],
  [/hindistan cevizi|coconut/i, 354, 3.3, 15, 33, 0, 80, 5, '🥥'],
  [/ekşi krema|smetana|sour cream/i, 193, 2.4, 4.6, 19, 0, 230, 15, '🥛'],
  [/kaymak/i, 400, 3, 3, 42, 0, 230, 15, '🥛'],
  [/krema|cream/i, 340, 2, 3, 36, 0, 230, 15, '🥛'],
  [/süzme yoğurt|skyr|jameed|kurut/i, 97, 9, 4, 5, 0, 230, 15, '🥣'],
  [/yoğurt|kefir|ayran|yogurt/i, 61, 3.5, 4.7, 3.3, 0, 230, 15, '🥣'],
  [/süt|milk/i, 61, 3.2, 4.8, 3.3, 0, 200, 15, '🥛'],
  [/tereyağ|ghee|butter|niter/i, 717, 1, 0, 81, 0, 220, 14, '🧈'],
  [/parmesan|kefalotiri/i, 431, 38, 4, 29, 0, 100, 5, '🧀'],
  [/mozzarella|sulguni|quesillo|kaşar|cheddar|gruy|emmental|vacherin|appenzeller|sura kees/i, 330, 25, 2, 25, 25, 110, 7, '🧀'],
  [/lor|ricotta|twaróg|bryndza|taze peynir|curd/i, 174, 11, 3, 13, 0, 240, 15, '🧀'],
  [/hellim|halloumi|beyaz peynir|sirene|peynir|cheese|queso/i, 300, 18, 2, 24, 30, 140, 10, '🧀'],
  [/çikolata|chocolate|kakao/i, 546, 4.9, 61, 31, 0, 170, 10, '🍫'],
  [/nutella|fındık-çikolata/i, 539, 6, 58, 31, 0, 0, 20, '🍫'],
  [/\bbal\b|honey|dibs|hurma şurub|şurup|syrup/i, 304, 0.3, 82, 0, 0, 340, 21, '🍯'],
  [/pudra şeker|toz şeker|esmer şeker|hurma şeker|inci şeker|şeker|sugar/i, 387, 0, 100, 0, 0, 200, 12, '🍬'],
  [/mısır nişasta|nişasta|almidón|sagu|tapyoka|tapioca|starch/i, 381, 0.3, 91, 0.1, 0, 130, 8, '🌾'],
  [/mısır unu|masa harina|masarepa|polenta|mealie|darı unu|sorgum unu|teff|arpa unu|çavdar unu|kama unu|pirinç unu|nohut unu/i, 365, 8, 77, 3, 0, 130, 8, '🌾'],
  [/\bun\b|un \(|unu\b|flour|atta/i, 364, 10, 76, 1, 0, 120, 8, '🌾'],
  [/maya|yeast|kabartma|karbonat|baking/i, 0, 0, 0, 0, 0, 0, 0, '🧪'],
  [/galeta|ekmek|lepinja|somun|pide|lavaş|lavash|tortilla|chapati|naan|şrak|taboon|bazlama|fatir|çörek|bara|bun\b/i, 265, 9, 49, 3.2, 40, 0, 0, '🍞'],
  [/yufka|filo|milföy|gofret|waffle yaprağı/i, 300, 7, 52, 7, 25, 0, 0, '🥟'],
  [/bisküvi/i, 450, 6, 70, 16, 10, 0, 0, '🍪'],
  [/makarna|erişte|noodle|pasta|şehriye/i, 360, 12, 74, 1.5, 0, 100, 0, '🍝'],
  [/bulgur/i, 342, 12, 76, 1.3, 0, 170, 10, '🌾'],
  [/kuskus|couscous|attiéké|harees buğday|buğday/i, 360, 12, 74, 1, 0, 180, 11, '🌾'],
  [/pişmiş pirinç|pirinç pilavı|sıcak pirinç|pişmiş beyaz|pilav\b|cooked rice/i, 130, 2.7, 28, 0.3, 0, 160, 10, '🍚'],
  [/pirinç|rice|basmati|baldo/i, 360, 7, 79, 0.6, 0, 185, 12, '🍚'],
  [/haşlanmış nohut|nohut \(haşlan/i, 164, 8.9, 27, 2.6, 0, 165, 10, '🫘'],
  [/nohut|chickpea|channa/i, 364, 19, 61, 6, 0, 190, 12, '🫘'],
  [/mercimek|lentil/i, 352, 25, 63, 1, 0, 190, 12, '🫘'],
  [/haşlanmış.*fasulye|fasulye \(haşlan|ezilmiş.*fasulye|refried/i, 127, 8.7, 23, 0.5, 0, 180, 11, '🫘'],
  [/taze fasulye|green bean/i, 31, 1.8, 7, 0.2, 0, 110, 0, '🫛'],
  [/bakla|ful\b|fasulye|barbunya|börülce|beans|bezelye yarma|sarı bezelye/i, 333, 22, 60, 1, 0, 190, 12, '🫘'],
  [/bezelye|pea/i, 81, 5.4, 14, 0.4, 0, 145, 9, '🫛'],
  [/yer fıstığı|fıstık|peanut|egusi|kavun çekirdeği/i, 567, 26, 16, 49, 0, 145, 9, '🥜'],
  [/antep fıstığı|pistachio/i, 560, 20, 28, 45, 0, 125, 8, '🌰'],
  [/ceviz|walnut/i, 654, 15, 14, 65, 4, 100, 7, '🌰'],
  [/badem|almond/i, 579, 21, 22, 50, 1.2, 140, 9, '🌰'],
  [/fındık|hazelnut|çam fıstığı|kabak çekirdeği|susam|sesame|tohum/i, 600, 18, 15, 55, 0, 135, 9, '🌰'],
  [/kuru üzüm|raisin/i, 299, 3, 79, 0.5, 0, 145, 9, '🍇'],
  [/hurma|date|kuru erik|prune/i, 282, 2.5, 75, 0.4, 8, 150, 9, '🌴'],
  [/reçel|jam|chutney|amba|marmelat/i, 250, 0.4, 62, 0.1, 0, 300, 20, '🍓'],
  [/zeytinyağ|olive oil/i, 884, 0, 0, 100, 0, 200, 13, '🫒'],
  [/zeytin\b|olive/i, 115, 0.8, 6, 11, 4, 135, 0, '🫒'],
  [/palmiye yağ|dendê|ayçiçek|sıvı yağ|\byağ\b|yağı|oil|domuz yağı|kuyruk yağı/i, 884, 0, 0, 100, 0, 200, 13, '🫗'],
  [/pastırma|bacon|slanina|pancetta/i, 541, 37, 1.4, 42, 15, 0, 0, '🥓'],
  [/sucuk|chorizo|chouriço|linguiça|bratwurst|sosis|salam|morcilla/i, 400, 22, 2, 34, 60, 0, 0, '🌭'],
  [/jambon|ham\b/i, 145, 21, 1.5, 6, 25, 0, 0, '🍖'],
  [/corned beef|konserve sığır/i, 250, 27, 0.5, 15, 0, 0, 0, '🥫'],
  [/ciğer|liver/i, 165, 26, 4, 4.5, 0, 0, 0, '🥩'],
  [/kıyma|mince/i, 250, 26, 0, 17, 0, 0, 0, '🥩'],
  [/ördek|duck/i, 337, 19, 0, 28, 2000, 0, 0, '🦆'],
  [/hindi|turkey/i, 190, 29, 0, 7, 3000, 0, 0, '🦃'],
  [/tavuk but|but \(kemiksiz|baget|göğüs|kanat|thigh|breast/i, 190, 25, 0, 10, 150, 0, 0, '🍗'],
  [/tavuk|chicken|piliç/i, 190, 25, 0, 10, 1200, 0, 0, '🍗'],
  [/kuzu|koyun|lamb|keçi|goat|at eti/i, 282, 25, 0, 20, 0, 0, 0, '🍖'],
  [/domuz|pork/i, 250, 26, 0, 16, 0, 0, 0, '🥩'],
  [/dana|sığır|beef|biftek|bonfile|fileto|antrikot|vacío|kaburga|incik|döş|\bbut\b|\bet\b|\beti\b|\betler|meat/i, 250, 26, 0, 16, 0, 0, 0, '🥩'],
  [/karides|shrimp|prawn|kerevit/i, 99, 24, 0.2, 0.3, 15, 0, 0, '🦐'],
  [/yengeç|crab|conch|salyangoz/i, 97, 19, 0, 1.5, 300, 0, 0, '🦀'],
  [/somon|salmon/i, 208, 20, 0, 13, 0, 0, 0, '🐟'],
  [/ton\b|ton balığı|tuna|orkinos|albacore/i, 144, 23, 0, 5, 0, 0, 0, '🐟'],
  [/ançüez|hamsi|anchov/i, 210, 29, 0, 10, 0, 50, 0, '🐟'],
  [/morina|cod|tuzlu balık|saltfish/i, 290, 63, 0, 2.4, 0, 0, 0, '🐟'],
  [/balık|fish|levrek|sazan|mezgit|uskumru|yayın|orfoz|jackfish|chambo|kapenta/i, 120, 21, 0, 4, 600, 0, 0, '🐟'],
  [/manyok yaprağı|taro yaprağı|ndolé|cassava leaves|yaprak|ıspanak|pazı|roka|callaloo|karalahana|sukuma|bok choy|moroho|muriwo|anamamy|spinach/i, 23, 2.9, 3.6, 0.4, 20, 30, 0, '🥬'],
  [/tatlı patates|kumara|kaukau|sweet potato/i, 86, 1.6, 20, 0.1, 150, 0, 0, '🍠'],
  [/patates|potato/i, 77, 2, 17, 0.1, 170, 0, 0, '🥔'],
  [/yam\b|ñame|pulaka|taro\b|taro kökü|dasheen|pomtajer/i, 118, 1.5, 28, 0.2, 300, 0, 0, '🍠'],
  [/manyok|cassava/i, 160, 1.4, 38, 0.3, 400, 0, 0, '🍠'],
  [/plantain|yeşil muz|muz\b|banana/i, 122, 1.3, 32, 0.4, 180, 0, 0, '🍌'],
  [/ekmek ağacı|breadfruit/i, 103, 1, 27, 0.2, 1500, 0, 0, '🍈'],
  [/ackee/i, 151, 2.9, 0.8, 15, 0, 0, 0, '🍈'],
  [/domates püresi|domates sosu|ezilmiş domates|san marzano/i, 32, 1.6, 7, 0.2, 0, 245, 15, '🍅'],
  [/salça|tomato paste/i, 82, 4.3, 19, 0.5, 0, 260, 18, '🍅'],
  [/domates|tomato|tomatillo/i, 18, 0.9, 3.9, 0.2, 120, 180, 0, '🍅'],
  [/patlıcan|eggplant|aubergine/i, 25, 1, 6, 0.2, 300, 0, 0, '🍆'],
  [/kabak|zucchini|chayote/i, 17, 1.2, 3, 0.3, 200, 0, 0, '🥒'],
  [/balkabağı|pumpkin|joumou/i, 26, 1, 6.5, 0.1, 500, 0, 0, '🎃'],
  [/salatalık|cucumber/i, 15, 0.7, 3.6, 0.1, 200, 0, 0, '🥒'],
  [/havuç|carrot/i, 41, 0.9, 10, 0.2, 70, 110, 0, '🥕'],
  [/lahana|cabbage/i, 25, 1.3, 6, 0.1, 900, 70, 0, '🥬'],
  [/marul|lettuce/i, 15, 1.4, 2.9, 0.2, 300, 0, 0, '🥬'],
  [/bamya|okra/i, 33, 1.9, 7, 0.2, 12, 100, 0, '🫛'],
  [/mantar|mushroom/i, 22, 3.1, 3.3, 0.3, 20, 70, 0, '🍄'],
  [/fasulye filiz|filiz/i, 30, 3, 6, 0.2, 0, 100, 0, '🌱'],
  [/mısır|corn|hominy/i, 86, 3.2, 19, 1.2, 150, 160, 0, '🌽'],
  [/sarımsak|garlic/i, 149, 6.4, 33, 0.5, 4, 0, 8, '🧄'],
  [/arpacık|soğan|onion|shallot/i, 40, 1.1, 9, 0.1, 110, 160, 0, '🧅'],
  [/kırmızı biber|dolma biber|biber|pepper|jalapeño|chili|chile|ancho|guajillo|pasilla|mulato|chipotle|scotch|ají/i, 25, 1, 5, 0.3, 50, 0, 0, '🌶️'],
  [/kereviz|celery|pırasa|leek/i, 31, 1.2, 7, 0.3, 200, 0, 0, '🥬'],
  [/pancar|beet/i, 43, 1.6, 10, 0.2, 150, 0, 0, '🫜'],
  [/turp|radish/i, 16, 0.7, 3.4, 0.1, 100, 0, 0, '🥕'],
  [/armut|pear|elma|apple/i, 55, 0.4, 14, 0.2, 180, 0, 0, '🍐'],
  [/ananas|pineapple|mango|papaya|pandanus/i, 55, 0.6, 14, 0.2, 80, 0, 0, '🍍'],
  [/çilek|kivi|çarkıfelek|yaban mersini|kızılcık|zirinc|barberr|meyve|berry/i, 50, 0.8, 12, 0.3, 0, 150, 0, '🫐'],
  [/portakal|orange/i, 47, 0.9, 12, 0.1, 150, 0, 0, '🍊'],
  [/limon|lime|lemon/i, 29, 1.1, 9, 0.3, 30, 0, 15, '🍋'],
  [/şarap|wine/i, 85, 0, 2.6, 0, 0, 200, 15, '🍷'],
  [/bira|beer/i, 43, 0.5, 3.6, 0, 0, 200, 15, '🍺'],
  [/mayonez|remoulade/i, 680, 1, 1, 75, 0, 220, 14, '🥫'],
  [/ketçap|hoisin|sos\b|sauce|ajvar|zhug|harissa|sambal|achar|salsa/i, 100, 1.5, 20, 1.5, 0, 240, 16, '🥫'],
  [/soya sos|soy/i, 53, 8, 5, 0.6, 0, 0, 16, '🥫'],
  [/sirke|vinegar|mirin|demirhindi|tamarind/i, 40, 0, 10, 0, 0, 200, 15, '🍶'],
  [/maydanoz|dereotu|nane|kişniş|fesleğen|frenk|taze soğan|culantro|\bot\b|\botlar|herb|çemen|mitsuba/i, 36, 3, 6, 0.8, 5, 30, 0, '🌿'],
  [/jelatin/i, 335, 85, 0, 0, 0, 0, 7, '🧪'],
  [/\bsu\b|water|et suyu|tavuk suyu|dashi|stock|broth/i, 5, 0.5, 0.3, 0.2, 0, 200, 15, '💧'],
  [/\btuz|salt|karabiber|baharat|kimyon|tarçın|vanil|kakule|karanfil|defne|zerdeçal|safran|kekik|toz biber|pul biber|gochugaru|masala|ras el|berbere|hawaij|beş baharat|yenibahar|muskat|anason|ardıç|zencefil|galangal|limon otu|köri|curry|mercanköşk|paprika|kırmızı toz|bzar|pandan|kroeung|achiote|gül suyu|mahlep|sumak|hardal|wasabi|kafir|loomi|kuru limon|epis/i, 0, 0, 0, 0, 0, 0, 0, '🧂'],
];
// Unicode-aware word boundaries (JS \b does not understand ğ, ı, ş, ç, ö, ü)
const _B = '(?:(?<!\\p{L})(?=\\p{L})|(?<=\\p{L})(?!\\p{L}))';
NUTRI_DB.forEach(r => { r[0] = new RegExp(r[0].source.replace(/\\b/g, _B), 'iu'); });
const U = re => new RegExp(re.source.replace(/\\b/g, _B), 'iu');
const RE_KG = U(/\d\s*kg\b/), RE_G = U(/\d\s*(g|gr|gram)\b/), RE_ML = U(/\d\s*ml\b/), RE_L = U(/\d\s*(litre|lt|l)\b/);
const NUM_WORDS = { 'yarım': 0.5, 'bir': 1, 'iki': 2, 'üç': 3, 'dört': 4 };
const FRAC = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.33, '⅔': 0.67 };

function nutriMatch(text) {
  for (const row of NUTRI_DB) if (row[0].test(text)) return row;
  return null;
}
function ingEmoji(text) { const r = nutriMatch(text); return r ? r[8] : '🥄'; }

/* parse "2 yemek kaşığı un" → grams; returns null if the line is only spices/servings */
function parsePart(part) {
  let s = part.trim().replace(/^(sos|dolgu|hamur|kaplama|üstü|şerbet|şurup|pino|iç|dış|fungee|pepperpot|cou-cou|bara|channa|tohum|turşu|ezme|baharat|alternatif dolgu|yumurtalı tereyağı)\s*(\([^)]*\))?\s*:\s*/i, '');
  if (!s) return null;
  const row = nutriMatch(s);
  if (!row) return { g: 0, row: null, text: s };
  let qty = null;
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*(?:[-–]\s*(\d+(?:[.,]\d+)?))?\s*([½¼¾⅓⅔])?/);
  if (m) {
    const a = parseFloat(m[1].replace(',', '.')), b = m[2] ? parseFloat(m[2].replace(',', '.')) : null;
    qty = b ? (a + b) / 2 : a; if (m[3]) qty += FRAC[m[3]];
  } else {
    const f = s.match(/[½¼¾⅓⅔]/); if (f) qty = FRAC[f[0]];
    const w = s.match(/^(yarım|bir|iki|üç|dört)\b/i); if (w) qty = NUM_WORDS[w[1].toLowerCase()];
  }
  const low = s.toLowerCase();
  const rest = m ? s.slice(m.index + m[0].length).trim().toLowerCase() : low;
  const at = re => U(new RegExp('^(?:' + re + ')\\b')).test(rest);
  const [, , , , , piece, cup, tbsp] = row;
  let g;
  if (qty == null) {
    // no amount → small default for flavouring, moderate for others
    g = row[1] === 0 ? 0 : (/servis|isteğe|süslemek|bir avuç|avuç/.test(low) ? 20 : (piece >= 20 ? piece * (piece > 300 ? 0.25 : 1) : 30));
    if (piece === 0 && cup === 0) g = 15;
  } else if (at('kg')) g = qty * 1000;
  else if (at('g|gr|gram')) g = qty;
  else if (at('ml')) g = qty;
  else if (at('litre|lt|l')) g = qty * 1000;
  else if (at('su bardağı|bardak|cup|kase')) g = qty * (cup || 200);
  else if (at('yemek kaşığı|tbsp')) g = qty * (tbsp || 15);
  else if (at('tatlı kaşığı')) g = qty * (tbsp ? tbsp / 2 : 7);
  else if (at('çay kaşığı|tsp')) g = qty * (tbsp ? tbsp / 3 : 4);
  else if (at('paket')) g = qty * (/maya|vanil|kabartma/.test(low) ? 10 : 500);
  else if (at('demet')) g = qty * 50;
  else if (at('diş')) g = qty * 4;
  else if (at('baş')) g = qty * 40;
  else if (at('dilim')) g = qty * 30;
  else if (at('kutu')) g = qty * 400;
  else if (at('avuç')) g = qty * 30;
  else if (at('tutam|damla|tel')) g = 0;
  else g = qty * (piece || 100);
  return { g, row, text: s };
}

const _nutriCache = {};
function estimateNutrition(ingLines, servings, key) {
  if (key && _nutriCache[key]) return _nutriCache[key];
  let k = 0, p = 0, c = 0, f = 0, grams = 0;
  for (const line of ingLines) {
    if (/^servis/i.test(line.trim())) continue; // side dishes are not part of the recipe itself
    const parts = line.split(/,(?!\d)|;|\+| ve (?=\d)/).filter(x => x.trim());
    for (const part of parts) {
      const r = parsePart(part); if (!r || !r.row || !r.g) continue;
      let g = r.g;
      if (/kızartmak için|kızartma için|frying/i.test(part)) g = 30; // only part of frying oil is absorbed
      const m = g / 100; grams += g;
      k += r.row[1] * m; p += r.row[2] * m; c += r.row[3] * m; f += r.row[4] * m;
    }
  }
  const s = Math.max(1, servings || 1);
  const res = { kcal: Math.round(k / s / 5) * 5, protein: Math.round(p / s), carbs: Math.round(c / s), fat: Math.round(f / s), grams: Math.round(grams / s) };
  if (key) _nutriCache[key] = res;
  return res;
}
