/* Drink pairing. Each drink: names (4 langs), emoji, alcoholic, temperature, sweetness (0-2), body (0 light-2 rich),
   fizzy, tags it goes well with, home countries (bonus when the dish comes from there). */
const DRINKS = [
  ['ayran', '🥛', 0, 'cold', 0, 1, 0, 'red,rice,grill,pastry', 'TR,AZ,KZ,KG,UZ,IR,AF,AM', 'Ayran', 'Ayran', 'Ayran', 'Айран'],
  ['salgam', '🍷', 0, 'cold', 0, 1, 0, 'red,grill,spicy', 'TR', 'Şalgam', 'Şalğam', 'Shalgam (fermented carrot)', 'Шалгам'],
  ['tea', '🍵', 0, 'hot', 0, 1, 0, 'breakfast,dessert,pastry,rice,red', 'AZ,TR,IR,GB,RU,UZ,KZ,IN,CN,MA', 'Demli çay', 'Dəmli çay', 'Black tea', 'Чёрный чай'],
  ['greentea', '🍵', 0, 'hot', 0, 0, 0, 'fish,rice,light,vegetarian', 'JP,CN,KR,VN', 'Yeşil çay', 'Yaşıl çay', 'Green tea', 'Зелёный чай'],
  ['mintlemon', '🫖', 0, 'hot', 1, 0, 0, 'fried,rich,dessert', 'MA,EG,DZ,TN', 'Naneli çay', 'Nanəli çay', 'Mint tea', 'Мятный чай'],
  ['coffee', '☕', 0, 'hot', 0, 2, 0, 'dessert,breakfast', 'TR,ET,IT,BR,CO', 'Kahve', 'Qəhvə', 'Coffee', 'Кофе'],
  ['lemonade', '🍋', 0, 'cold', 1, 0, 0, 'fried,grill,spicy,light,chicken', '', 'Ev yapımı limonata', 'Ev limonadı', 'Homemade lemonade', 'Домашний лимонад'],
  ['sherbet', '🌹', 0, 'cold', 2, 1, 0, 'rice,red,rich,spicy', 'AZ,TR,IR', 'Gül şerbeti', 'Qızılgül şərbəti', 'Rose sherbet', 'Розовый шербет'],
  ['compote', '🍑', 0, 'cold', 1, 0, 0, 'red,rice,rich,pastry', 'AZ,RU,UA,PL,TR', 'Kompot', 'Kompot', 'Fruit compote', 'Компот'],
  ['sparkling', '🫧', 0, 'cold', 0, 0, 1, 'fried,rich,cheese,fish,any', '', 'Limonlu maden suyu', 'Limonlu mineral su', 'Sparkling water with lemon', 'Минералка с лимоном'],
  ['pomegranate', '🍹', 0, 'cold', 1, 1, 0, 'red,grill,rice', 'AZ,IR,TR', 'Nar suyu', 'Nar şirəsi', 'Pomegranate juice', 'Гранатовый сок'],
  ['orange', '🍊', 0, 'cold', 1, 0, 0, 'breakfast,light,chicken', '', 'Taze portakal suyu', 'Təzə portağal şirəsi', 'Fresh orange juice', 'Свежий апельсиновый сок'],
  ['lassi', '🥭', 0, 'cold', 2, 2, 0, 'spicy,curry,rice', 'IN,PK,BD', 'Mango lassi', 'Manqo lassi', 'Mango lassi', 'Манго-ласси'],
  ['horchata', '🥛', 0, 'cold', 2, 1, 0, 'spicy,tortilla,fried', 'MX,ES,SV,GT', 'Horchata', 'Orçata', 'Horchata', 'Орчата'],
  ['jamaica', '🌺', 0, 'cold', 1, 0, 0, 'spicy,tortilla,grill', 'MX,SN,EG,NG', 'Hibiskus şerbeti', 'Hibiskus şərbəti', 'Hibiscus cooler', 'Каркаде со льдом'],
  ['kvass', '🍺', 0, 'cold', 1, 1, 1, 'red,soup,pastry', 'RU,UA,BY,LT,LV', 'Kvas', 'Kvas', 'Kvass', 'Квас'],
  ['icedtea', '🧊', 0, 'cold', 1, 0, 0, 'fried,spicy,chicken,light', 'US,TH,VN', 'Buzlu çay', 'Buzlu çay', 'Iced tea', 'Холодный чай'],
  ['coconut', '🥥', 0, 'cold', 1, 0, 0, 'spicy,curry,fish,rice', 'TH,ID,MY,PH,LK,BR', 'Hindistan cevizi suyu', 'Kokos suyu', 'Coconut water', 'Кокосовая вода'],
  ['gingerbeer', '🫚', 0, 'cold', 1, 0, 1, 'spicy,fried,grill', 'JM,TT,GB', 'Zencefilli gazoz', 'Zəncəfilli qazlı içki', 'Ginger beer (non-alcoholic)', 'Имбирный лимонад'],
  ['hotchoc', '🍫', 0, 'hot', 2, 2, 0, 'dessert,pastry,breakfast', 'MX,ES,FR', 'Sıcak çikolata', 'İsti şokolad', 'Hot chocolate', 'Горячий шоколад'],
  ['redwine', '🍷', 1, 'room', 0, 2, 0, 'red,grill,cheese,rich,tomato', 'FR,IT,ES,AR,GE,PT,CL,AU', 'Kırmızı şarap', 'Qırmızı şərab', 'Red wine', 'Красное вино'],
  ['whitewine', '🥂', 1, 'cold', 0, 0, 0, 'fish,chicken,light,cheese,creamy', 'FR,IT,DE,GR,NZ,GE', 'Beyaz şarap', 'Ağ şərab', 'White wine', 'Белое вино'],
  ['rose', '🌸', 1, 'cold', 1, 0, 0, 'light,spicy,fish,vegetarian', 'FR,ES', 'Roze şarap', 'Roze şərab', 'Rosé wine', 'Розовое вино'],
  ['sparklingwine', '🍾', 1, 'cold', 0, 0, 1, 'fried,fish,dessert,light', 'IT,FR,ES', 'Köpüklü şarap', 'Köpüklü şərab', 'Sparkling wine', 'Игристое вино'],
  ['raki', '🥃', 1, 'cold', 0, 1, 0, 'fish,meze,grill', 'TR,GR,LB', 'Rakı', 'Rakı', 'Rakı / ouzo / arak', 'Раки'],
  ['lager', '🍺', 1, 'cold', 0, 1, 1, 'fried,spicy,grill,red,pastry', 'DE,CZ,MX,BE,US,PL', 'Bira', 'Pivə', 'Lager beer', 'Пиво'],
  ['wheatbeer', '🍺', 1, 'cold', 1, 1, 1, 'chicken,light,pastry', 'DE,BE', 'Buğday birası', 'Buğda pivəsi', 'Wheat beer', 'Пшеничное пиво'],
  ['sake', '🍶', 1, 'cold', 0, 0, 0, 'fish,rice,light', 'JP', 'Sake', 'Sake', 'Sake', 'Саке'],
  ['dessertwine', '🍷', 1, 'room', 2, 2, 0, 'dessert,cheese', 'PT,HU,ZA', 'Tatlı şarap', 'Desert şərabı', 'Dessert wine', 'Десертное вино'],
  ['cider', '🍏', 1, 'cold', 1, 0, 1, 'pastry,cheese,light', 'GB,FR,ES', 'Elma şarabı (cider)', 'Sidr', 'Cider', 'Сидр']
].map(([id, emoji, alc, temp, sweet, body, fizzy, tags, home, tr, az, en, ru]) => ({ id, emoji, alc: !!alc, temp, sweet, body, fizzy: !!fizzy, tags: tags.split(','), home: home ? home.split(',') : [], name: { tr, az, en, ru } }));

/* Tags of a dish from its ingredients/steps/category. */
function dishProfile(ing, st, cat, code) {
  const s = (ing.join(' ') + ' ' + (st || []).join(' ')).toLocaleLowerCase('tr');
  const tags = new Set();
  if (/(dana|sığır|kuzu|koyun|kıyma|biftek|keçi|at eti|beef|lamb)/.test(s)) tags.add('red');
  if (/(tavuk|hindi|ördek|chicken)/.test(s)) tags.add('chicken');
  if (/(balık|somon|ton|karides|kalamar|midye|hamsi|fish|shrimp)/.test(s)) tags.add('fish');
  if (/(acı biber|pul biber|chili|jalapeño|harissa|berbere|gochu|sambal|scotch|köri|curry|masala|guajillo|ancho|rocoto|ají)/.test(s)) tags.add('spicy');
  if (/(köri|curry|masala)/.test(s)) tags.add('curry');
  if (/(kızart|fry|fried)/.test(s)) tags.add('fried');
  if (/(ızgara|köz|grill|şiş|mangal)/.test(s)) tags.add('grill');
  if (/(pirinç|pilav|rice)/.test(s)) tags.add('rice');
  if (/(peynir|cheese)/.test(s)) tags.add('cheese');
  if (/(krema|yoğurt|tereyağ|cream)/.test(s)) tags.add('creamy');
  if (/(domates|tomato)/.test(s)) tags.add('tomato');
  if (/(tortilla|masa harina)/.test(s)) tags.add('tortilla');
  if (/(hamur|yufka|un\b|unu|börek|ekmek|pastry)/.test(s)) tags.add('pastry');
  if (/(çorba|soup)/.test(s)) tags.add('soup');
  if (cat === 't') tags.add('dessert');
  if (cat === 'k') tags.add('breakfast');
  if (cat === 's') tags.add('meze');
  if (!tags.has('red') && !tags.has('chicken') && !tags.has('fish')) tags.add('vegetarian');
  if (!tags.has('red') && !tags.has('fried') && !tags.has('creamy')) tags.add('light'); else tags.add('rich');
  return { tags, code };
}
/* taste: {sweet:0-2, body:0-2, temp:'cold'|'hot'|'any', fizzy:bool|null, alcohol:bool} */
function pairDrinks(profile, taste, allowAlcohol) {
  const scored = DRINKS.filter(d => allowAlcohol || !d.alc).map(d => {
    let sc = 0; const why = [];
    d.tags.forEach(tg => { if (profile.tags.has(tg)) { sc += 2; why.push(tg); } });
    if (d.tags.includes('any')) sc += 1;
    if (profile.code && d.home.includes(profile.code)) { sc += 3; why.unshift('home'); }
    if (taste) {
      sc -= Math.abs((taste.sweet ?? 1) - d.sweet) * .8;
      sc -= Math.abs((taste.body ?? 1) - d.body) * .6;
      if (taste.temp === 'hot' && d.temp === 'hot') sc += 1.2; if (taste.temp === 'cold' && d.temp !== 'hot') sc += .8; if (taste.temp === 'cold' && d.temp === 'hot') sc -= 1;
      if (taste.fizzy === true && d.fizzy) sc += .8; if (taste.fizzy === false && d.fizzy) sc -= .8;
    }
    if (profile.tags.has('dessert') && d.tags.includes('dessert')) sc += 1.5;
    return { d, sc, why };
  }).sort((a, b) => b.sc - a.sc);
  const soft = scored.filter(x => !x.d.alc).slice(0, 2), alc = scored.filter(x => x.d.alc).slice(0, allowAlcohol ? 1 : 0);
  return soft.concat(alc);
}
