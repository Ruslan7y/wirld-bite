/* Ingredient catalog for the visual picker.
   id | emoji | category | TR | AZ | EN | RU | Wikipedia (en) title for the photo | extra TR words used to match recipes
   categories: veg, fruit, meat, dairy, grain, spice, other */
const ING_RAW = `
tomato|🍅|veg|domates|pomidor|tomato|помидор|Tomato|domates
cucumber|🥒|veg|salatalık|xiyar|cucumber|огурец|Cucumber|salatalık
onion|🧅|veg|soğan|soğan|onion|лук|Onion|soğan,arpacık
garlic|🧄|veg|sarımsak|sarımsaq|garlic|чеснок|Garlic|sarımsak
potato|🥔|veg|patates|kartof|potato|картофель|Potato|patates
carrot|🥕|veg|havuç|yerkökü|carrot|морковь|Carrot|havuç
eggplant|🍆|veg|patlıcan|badımcan|eggplant|баклажан|Eggplant|patlıcan
pepper|🫑|veg|biber|bibər|bell pepper|перец|Bell pepper|sivri biber,dolma biber,yeşil biber,kırmızı biber,biber
chili|🌶️|veg|acı biber|acı bibər|chili pepper|острый перец|Chili pepper|acı biber,jalapeño,scotch,ají
zucchini|🥒|veg|kabak|balqabaq|zucchini|кабачок|Zucchini|kabak
pumpkin|🎃|veg|balkabağı|boranı|pumpkin|тыква|Pumpkin|balkabağı
spinach|🥬|veg|ıspanak|ispanaq|spinach|шпинат|Spinach|ıspanak,pazı
cabbage|🥬|veg|lahana|kələm|cabbage|капуста|Cabbage|lahana
lettuce|🥬|veg|marul|kahı|lettuce|салат|Lettuce|marul
broccoli|🥦|veg|brokoli|brokkoli|broccoli|брокколи|Broccoli|brokoli
cauliflower|🥦|veg|karnabahar|gül kələm|cauliflower|цветная капуста|Cauliflower|karnabahar
mushroom|🍄|veg|mantar|göbələk|mushroom|грибы|Edible mushroom|mantar
corn|🌽|veg|mısır|qarğıdalı|corn|кукуруза|Maize|mısır
peas|🫛|veg|bezelye|noxud (yaşıl)|peas|горошек|Pea|bezelye
greenbean|🫛|veg|taze fasulye|yaşıl lobya|green beans|стручковая фасоль|Green bean|taze fasulye
okra|🫛|veg|bamya|bamya|okra|бамия|Okra|bamya
leek|🥬|veg|pırasa|pırasa|leek|лук-порей|Leek|pırasa
celery|🥬|veg|kereviz|kərəviz|celery|сельдерей|Celery|kereviz
beet|🍠|veg|pancar|çuğundur|beetroot|свёкла|Beetroot|pancar
radish|🥕|veg|turp|turp|radish|редис|Radish|turp
sweetpotato|🍠|veg|tatlı patates|şirin kartof|sweet potato|батат|Sweet potato|tatlı patates
parsley|🌿|veg|maydanoz|cəfəri|parsley|петрушка|Parsley|maydanoz
dill|🌿|veg|dereotu|şüyüd|dill|укроп|Dill|dereotu
mint|🌿|veg|nane|nanə|mint|мята|Mentha|nane
coriander|🌿|veg|kişniş|keşniş|coriander|кинза|Coriander|kişniş
basil|🌿|veg|fesleğen|reyhan|basil|базилик|Basil|fesleğen
scallion|🧅|veg|taze soğan|yaşıl soğan|spring onion|зелёный лук|Scallion|taze soğan,yeşil soğan
rocket|🥬|veg|roka|roka|arugula|руккола|Eruca vesicaria|roka
artichoke|🌿|veg|enginar|ənginar|artichoke|артишок|Artichoke|enginar
avocado|🥑|veg|avokado|avokado|avocado|авокадо|Avocado|avokado
olive|🫒|veg|zeytin|zeytun|olives|оливки|Olive|zeytin
cassava|🍠|veg|manyok|manyok|cassava|маниок|Cassava|manyok
vineleaf|🍃|veg|asma yaprağı|üzüm yarpağı|vine leaves|виноградные листья|Grape leaves|asma yaprağı,yaprak
ginger|🫚|veg|zencefil|zəncəfil|ginger|имбирь|Ginger|zencefil
apple|🍎|fruit|elma|alma|apple|яблоко|Apple|elma
pear|🍐|fruit|armut|armud|pear|груша|Pear|armut
banana|🍌|fruit|muz|banan|banana|банан|Banana|muz,plantain
orange|🍊|fruit|portakal|portağal|orange|апельсин|Orange (fruit)|portakal
mandarin|🍊|fruit|mandalina|naringi|mandarin|мандарин|Mandarin orange|mandalina
lemon|🍋|fruit|limon|limon|lemon|лимон|Lemon|limon
lime|🍋|fruit|misket limonu|laym|lime|лайм|Lime (fruit)|misket limonu,lime
strawberry|🍓|fruit|çilek|çiyələk|strawberry|клубника|Strawberry|çilek
grape|🍇|fruit|üzüm|üzüm|grapes|виноград|Grape|üzüm
watermelon|🍉|fruit|karpuz|qarpız|watermelon|арбуз|Watermelon|karpuz
melon|🍈|fruit|kavun|yemiş|melon|дыня|Melon|kavun
peach|🍑|fruit|şeftali|şaftalı|peach|персик|Peach|şeftali
apricot|🍑|fruit|kayısı|ərik|apricot|абрикос|Apricot|kayısı
cherry|🍒|fruit|kiraz|gilas|cherries|черешня|Cherry|kiraz,vişne
pineapple|🍍|fruit|ananas|ananas|pineapple|ананас|Pineapple|ananas
mango|🥭|fruit|mango|manqo|mango|манго|Mango|mango
kiwi|🥝|fruit|kivi|kivi|kiwi|киви|Kiwifruit|kivi
coconut|🥥|fruit|hindistan cevizi|kokos|coconut|кокос|Coconut|hindistan cevizi
pomegranate|🍎|fruit|nar|nar|pomegranate|гранат|Pomegranate|nar
blueberry|🫐|fruit|yaban mersini|qaragilə|blueberries|черника|Blueberry|yaban mersini
date|🌴|fruit|hurma|xurma|dates|финики|Date palm|hurma
fig|🍐|fruit|incir|əncir|figs|инжир|Common fig|incir
raisin|🍇|fruit|kuru üzüm|kişmiş|raisins|изюм|Raisin|kuru üzüm
chicken|🍗|meat|tavuk|toyuq|chicken|курица|Chicken as food|tavuk
chickenbreast|🍗|meat|tavuk göğsü|toyuq döşü|chicken breast|куриная грудка|Chicken as food|tavuk göğsü,tavuk
mince|🥩|meat|kıyma|qiymə|minced meat|фарш|Ground meat|kıyma
beef|🥩|meat|dana eti|mal əti|beef|говядина|Beef|dana,sığır,biftek,bonfile
lamb|🍖|meat|kuzu eti|quzu əti|lamb|баранина|Lamb and mutton|kuzu,koyun
sujuk|🌭|meat|sucuk|sucuq|sujuk|суджук|Sujuk|sucuk
sausage|🌭|meat|sosis|sosiska|sausage|сосиски|Sausage|sosis,sucuk
pastirma|🥓|meat|pastırma|basdırma|pastirma|бастурма|Pastirma|pastırma
ham|🥓|meat|jambon|vetçina|ham|ветчина|Ham|jambon
pork|🥓|meat|domuz eti|donuz əti|pork|свинина|Pork|domuz
turkey|🦃|meat|hindi|hind quşu|turkey|индейка|Turkey as food|hindi
liver|🥩|meat|ciğer|qaraciyər|liver|печень|Liver (food)|ciğer
fish|🐟|meat|balık|balıq|fish|рыба|Fish as food|balık,levrek,çipura
salmon|🐟|meat|somon|qızılbalıq|salmon|лосось|Salmon as food|somon
tuna|🐟|meat|ton balığı|tunes|tuna|тунец|Tuna|ton
anchovy|🐟|meat|hamsi|hamsi|anchovies|анчоусы|European anchovy|hamsi
shrimp|🦐|meat|karides|krevet|shrimp|креветки|Shrimp|karides
squid|🦑|meat|kalamar|kalmar|squid|кальмар|Squid as food|kalamar
mussel|🦪|meat|midye|midiya|mussels|мидии|Mussel|midye
egg|🥚|dairy|yumurta|yumurta|eggs|яйца|Egg as food|yumurta
milk|🥛|dairy|süt|süd|milk|молоко|Milk|süt
yogurt|🥣|dairy|yoğurt|qatıq|yogurt|йогурт|Yogurt|yoğurt,qatıq
strainedyogurt|🥣|dairy|süzme yoğurt|süzmə|strained yogurt|греческий йогурт|Strained yogurt|süzme yoğurt
ayran|🥛|dairy|ayran|ayran|ayran|айран|Ayran|ayran,kefir
whitecheese|🧀|dairy|beyaz peynir|ağ pendir|white cheese|брынза|Beyaz peynir|beyaz peynir,peynir
kashar|🧀|dairy|kaşar|qaşqaval|kashkaval|кашкавал|Kashkaval|kaşar,peynir
mozzarella|🧀|dairy|mozzarella|motsarella|mozzarella|моцарелла|Mozzarella|mozzarella,peynir
parmesan|🧀|dairy|parmesan|parmezan|parmesan|пармезан|Parmigiano Reggiano|parmesan,peynir
curd|🧀|dairy|lor peyniri|şor|cottage cheese|творог|Cottage cheese|lor,ricotta,peynir
creamcheese|🧀|dairy|krem peynir|krem pendir|cream cheese|сливочный сыр|Cream cheese|krem peynir
butter|🧈|dairy|tereyağı|kərə yağı|butter|сливочное масло|Butter|tereyağı
cream|🥛|dairy|krema|qaymaq (krem)|cream|сливки|Cream|krema
kaymak|🥛|dairy|kaymak|qaymaq|clotted cream|каймак|Kaymak|kaymak
sourcream|🥛|dairy|ekşi krema|xama|sour cream|сметана|Sour cream|ekşi krema
flour|🌾|grain|un|un|flour|мука|Flour|un
rice|🍚|grain|pirinç|düyü|rice|рис|Rice|pirinç
bulgur|🌾|grain|bulgur|bulqur|bulgur|булгур|Bulgur|bulgur
pasta|🍝|grain|makarna|makaron|pasta|макароны|Pasta|makarna
noodle|🍜|grain|erişte|əriştə|noodles|лапша|Noodle|erişte
vermicelli|🍜|grain|şehriye|vermişel|vermicelli|вермишель|Vermicelli|şehriye
bread|🍞|grain|ekmek|çörək|bread|хлеб|Bread|ekmek
lavash|🫓|grain|lavaş|lavaş|lavash|лаваш|Lavash|lavaş
tortilla|🫓|grain|tortilla|tortilya|tortillas|тортилья|Tortilla|tortilla
yufka|🫓|grain|yufka|yuxa|filo pastry|тесто фило|Filo|yufka,milföy
semolina|🌾|grain|irmik|manna yarması|semolina|манка|Semolina|irmik
oats|🌾|grain|yulaf|yulaf|oats|овсянка|Oat|yulaf
cornmeal|🌽|grain|mısır unu|qarğıdalı unu|cornmeal|кукурузная мука|Cornmeal|mısır unu
starch|🌾|grain|nişasta|nişasta|corn starch|крахмал|Corn starch|nişasta
couscous|🌾|grain|kuskus|kuskus|couscous|кускус|Couscous|kuskus
chickpea|🫘|grain|nohut|noxud|chickpeas|нут|Chickpea|nohut
lentil|🫘|grain|mercimek|mərci|lentils|чечевица|Lentil|mercimek
beans|🫘|grain|kuru fasulye|lobya|beans|фасоль|Common bean|fasulye,barbunya
breadcrumbs|🍞|grain|galeta unu|qalet unu|breadcrumbs|панировочные сухари|Bread crumbs|galeta
yeast|🧪|grain|maya|maya|yeast|дрожжи|Yeast|maya
bakingpowder|🧪|grain|kabartma tozu|qabartma tozu|baking powder|разрыхлитель|Baking powder|kabartma
salt|🧂|spice|tuz|duz|salt|соль|Salt|tuz
blackpepper|🧂|spice|karabiber|qara istiot|black pepper|чёрный перец|Black pepper|karabiber
pulbiber|🌶️|spice|pul biber|pul bibər|chili flakes|хлопья чили|Aleppo pepper|pul biber
paprika|🌶️|spice|toz kırmızı biber|qırmızı istiot|paprika|паприка|Paprika|toz biber,kırmızı biber
cumin|🧂|spice|kimyon|zirə|cumin|зира|Cumin|kimyon
thyme|🌿|spice|kekik|kəklikotu|thyme|тимьян|Thyme|kekik
cinnamon|🪵|spice|tarçın|darçın|cinnamon|корица|Cinnamon|tarçın
turmeric|🧂|spice|zerdeçal|zerdəçal|turmeric|куркума|Turmeric|zerdeçal
curry|🍛|spice|köri|kari|curry powder|карри|Curry powder|köri
sumac|🧂|spice|sumak|sumaq|sumac|сумах|Sumac|sumak
saffron|🌼|spice|safran|zəfəran|saffron|шафран|Saffron|safran
vanilla|🌼|spice|vanilya|vanil|vanilla|ваниль|Vanilla|vanil
bayleaf|🍃|spice|defne yaprağı|dəfnə yarpağı|bay leaf|лавровый лист|Bay leaf|defne
tomatopaste|🥫|spice|domates salçası|tomat pastası|tomato paste|томатная паста|Tomato paste|salça
pepperpaste|🥫|spice|biber salçası|bibər pastası|pepper paste|перечная паста|Biber salçası|biber salçası,salça
ketchup|🥫|spice|ketçap|ketçup|ketchup|кетчуп|Ketchup|ketçap
mayonnaise|🥫|spice|mayonez|mayonez|mayonnaise|майонез|Mayonnaise|mayonez
mustard|🥫|spice|hardal|xardal|mustard|горчица|Mustard (condiment)|hardal
soysauce|🥫|spice|soya sosu|soya sousu|soy sauce|соевый соус|Soy sauce|soya
vinegar|🍶|spice|sirke|sirkə|vinegar|уксус|Vinegar|sirke
pomegranatemolasses|🍶|spice|nar ekşisi|narşərab|pomegranate molasses|гранатовый соус|Pomegranate molasses|nar ekşisi
oliveoil|🫒|other|zeytinyağı|zeytun yağı|olive oil|оливковое масло|Olive oil|zeytinyağı,yağ
oil|🫗|other|sıvı yağ|bitki yağı|vegetable oil|растительное масло|Sunflower oil|ayçiçek,sıvı yağ,yağ
sugar|🍬|other|şeker|şəkər|sugar|сахар|Sugar|şeker
honey|🍯|other|bal|bal|honey|мёд|Honey|bal
molasses|🍯|other|pekmez|doşab|grape molasses|виноградная патока|Pekmez|pekmez
chocolate|🍫|other|çikolata|şokolad|chocolate|шоколад|Chocolate|çikolata
cocoa|🍫|other|kakao|kakao|cocoa|какао|Cocoa solids|kakao
walnut|🌰|other|ceviz|qoz|walnuts|грецкие орехи|Walnut|ceviz
hazelnut|🌰|other|fındık|fındıq|hazelnuts|фундук|Hazelnut|fındık
almond|🌰|other|badem|badam|almonds|миндаль|Almond|badem
pistachio|🌰|other|antep fıstığı|püstə|pistachios|фисташки|Pistachio|antep fıstığı,fıstık
peanut|🥜|other|yer fıstığı|yer fındığı|peanuts|арахис|Peanut|yer fıstığı,fıstık
peanutbutter|🥜|other|fıstık ezmesi|fıstıq yağı|peanut butter|арахисовая паста|Peanut butter|fıstık ezmesi
sesame|🌰|other|susam|küncüt|sesame|кунжут|Sesame|susam
tahini|🥫|other|tahin|tahin|tahini|тахини|Tahini|tahin
jam|🍓|other|reçel|mürəbbə|jam|варенье|Fruit preserves|reçel
coconutmilk|🥥|other|hindistan cevizi sütü|kokos südü|coconut milk|кокосовое молоко|Coconut milk|hindistan cevizi sütü
broth|🍲|other|et suyu|ət suyu|broth|бульон|Broth|et suyu,tavuk suyu
water|💧|other|su|su|water|вода|Water|su
coffee|☕|other|kahve|qəhvə|coffee|кофе|Coffee|kahve
tea|🍵|other|çay|çay|tea|чай|Tea|çay
tofu|⬜|other|tofu|tofu|tofu|тофу|Tofu|tofu
`;
const ING_CATS = ['veg', 'fruit', 'meat', 'dairy', 'grain', 'spice', 'other'];
const ING_CAT_ICON = { veg: '🥬', fruit: '🍎', meat: '🥩', dairy: '🧀', grain: '🌾', spice: '🧂', other: '🥫' };
const INGREDIENTS = ING_RAW.trim().split('\n').map(l => {
  const [id, emoji, cat, tr, az, en, ru, wiki, words] = l.split('|');
  return { id, emoji, cat, name: { tr, az, en, ru }, wiki, words: words.split(',').map(w => w.trim()).filter(Boolean) };
});
const ING_BY_ID = Object.fromEntries(INGREDIENTS.map(i => [i.id, i]));
