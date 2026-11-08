/* Diet tags (vegetarian, vegan, gluten-free, halal-friendly, lactose-free) and portion scaling. */
const _L = '(?<!\\p{L})';
const DIET_RE = {
  meat: new RegExp(_L + '(et|eti|etler|kıyma|tavuk|kuzu|koyun|dana|sığır|biftek|bonfile|fileto|antrikot|kaburga|incik|döş|sucuk|sosis|salam|pastırma|jambon|domuz|hindi|ördek|ciğer|keçi|at eti|chorizo|chouriço|linguiça|morcilla|bacon|pancetta|guanciale|slanina|kemik|but|et suyu|tavuk suyu|beef|chicken|pork|lamb|mutton|meat|ham|sausage|turkey|duck|говяд|кур|свин|баран|фарш|мяс|ветчин|колбас)', 'iu'),
  fish: new RegExp('(balık|ton balığı|' + _L + 'ton' + '(?!\\p{L})|somon|hamsi|karides|kalamar|midye|morina|uskumru|levrek|sazan|ançüez|istakoz|yengeç|ahtapot|balık sosu|dashi|kerevit|conch|fish|shrimp|prawn|tuna|salmon|anchov|crab|lobster|squid|рыб|кревет|лосос|тунец)', 'iu'),
  dairy: new RegExp('(süt|peynir|yoğurt|tereyağ|krema|kaymak|' + _L + 'lor' + '(?!\\p{L})|ricotta|mozzarella|parmesan|pecorino|kaşar|ghee|kefir|ayran|jameed|kurut|labne|skyr|smetana|sulguni|quesillo|cheddar|gruy|emmental|hellim|halloumi|queso|niter kibbeh|cheese|milk|butter|cream|yogurt|молок|сыр|сливк|сметан|творог|кефир)', 'iu'),
  egg: /(yumurta|egg|яйц)/iu,
  honey: new RegExp('(' + _L + 'bal' + '(?!\\p{L})|honey|мёд|мед)', 'iu'),
  gluten: new RegExp('(' + _L + 'un(u|la|lar)?(?!\\p{L})|buğday|bulgur|irmik|makarna|erişte|şehriye|ekmek|lavaş|lavash|yufka|filo|milföy|pide|naan|chapati|bara\\b|galeta|bisküvi|çavdar|arpa|kuskus|couscous|bira|soya sosu|hoisin|seitan|gofret|kruvasan|wheat|flour|bread|pasta|noodle|barley|rye|semolina|мук|хлеб|макарон|лапш|пшен)', 'iu'),
  pork: /(domuz|jambon|bacon|pancetta|guanciale|prosciutto|slanina|chorizo|chouriço|linguiça|morcilla|lard|pork|ham\b|свин|бекон)/iu,
  alcohol: /(şarap|bira|rakı|votka|konyak|likör|mirin|wine|beer|vodka|brandy|liqueur|sake|\brum\b|вино|пиво|водк|коньяк)/iu
};
// gluten-free flours / dairy-free "milks" are removed before testing
const GF_SAFE = /(mısır unu|pirinç unu|nohut unu|teff unu|teff|darı unu|sorgum unu|manyok|masa harina|masarepa|arpa şehriye\b(?!)|mısır tortilla|tortilla \(mısır|karabuğday|buckwheat|corn flour|rice flour|chickpea flour)/giu;
const NONDAIRY = /(hindistan cevizi (sütü|kreması)|coconut (milk|cream)|soya sütü|badem sütü|кокосов)/giu;
const DIETS = ['veg', 'vegan', 'gf', 'halal', 'lf'];
const DIET_ICON = { veg: '🌱', vegan: '🌿', gf: '🌾', halal: '☪️', lf: '🥛' };
const _dietCache = {};
function dietTags(lines, key) {
  if (key && _dietCache[key]) return _dietCache[key];
  let all = '', strict = '';
  for (const l of lines || []) {
    const clean = l.replace(/^(servis|serve)[^:]*:/i, '');
    all += ' ' + clean;
    strict += ' ' + clean.replace(/\([^)]*\)/g, ' '); // "(geleneksel: domuz; dana da olur)" = alternative, not required
  }
  const a = all.toLocaleLowerCase('tr'), s = strict.toLocaleLowerCase('tr');
  const meat = DIET_RE.meat.test(s), fish = DIET_RE.fish.test(s);
  const dairy = DIET_RE.dairy.test(s.replace(NONDAIRY, ' '));
  const egg = DIET_RE.egg.test(s), honey = DIET_RE.honey.test(s);
  const gluten = DIET_RE.gluten.test(s.replace(GF_SAFE, ' '));
  const pork = DIET_RE.pork.test(s), alcohol = DIET_RE.alcohol.test(s);
  const veg = !meat && !fish;
  const res = { veg, vegan: veg && !dairy && !egg && !honey, gf: !gluten, halal: !pork && !alcohol, lf: !dairy, flags: { meat, fish, dairy, egg, gluten, pork, alcohol }, porkAlt: !pork && DIET_RE.pork.test(a) };
  if (key) _dietCache[key] = res;
  return res;
}

/* ---------- portion scaling: "1,5 kg kuzu" × 2 → "3 kg kuzu" ---------- */
const FRAC_V = { '½': .5, '¼': .25, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3 };
function fmtQty(v) {
  if (v >= 50) return String(Math.round(v / 5) * 5);
  if (v >= 10) return String(Math.round(v));
  const whole = Math.floor(v + 1e-9), rest = v - whole;
  const opts = [[0, ''], [.25, '¼'], [1 / 3, '⅓'], [.5, '½'], [2 / 3, '⅔'], [.75, '¾'], [1, '']];
  let best = opts[0]; for (const o of opts) if (Math.abs(rest - o[0]) < Math.abs(rest - best[0])) best = o;
  const w = whole + (best[0] === 1 ? 1 : 0);
  if (!best[1]) return String(w || (v > 0 ? '¼' : '0'));
  return (w ? w : '') + best[1];
}
function scaleLine(line, f) {
  if (!f || Math.abs(f - 1) < 1e-6) return line;
  return line.replace(/(^|[^\d%°.,\p{L}])(\d+(?:[.,]\d+)?|[½¼¾⅓⅔])(\s*[½¼¾⅓⅔])?(?:(\s*[-–]\s*)(\d+(?:[.,]\d+)?))?(?![\d°%])/gu, (m, pre, a, frac, dash, b) => {
    if (/^0\d/.test(a)) return m; // e.g. "00" flour type
    const num = x => FRAC_V[x] != null ? FRAC_V[x] : parseFloat(String(x).replace(',', '.'));
    let v = num(a) + (frac ? FRAC_V[frac.trim()] : 0);
    let out = pre + fmtQty(v * f);
    if (b) out += dash + fmtQty(num(b) * f);
    return out;
  });
}
