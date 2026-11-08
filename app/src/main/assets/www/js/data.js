/* World Bite — country data
   Format: ISO2 | city for restaurant search | strength | signature dish | Wikipedia (en) title | dish category | emoji | OSM cuisine tag | story (TR)
   strength / category: k = kahvaltı, a = ana yemek, s = ara sıcak & sokak lezzeti, t = tatlı                       */
const RAW = {
europe: `
AL|Tirana|a|Tavë kosi|Tavë kosi|a|🍲|albanian|Elbasan şehrinden doğan ulusal yemek: kuzu eti, pirinç ve yoğurt fırında buluşur. Adı "ekşi tava" anlamına gelir.
AD|Andorra la Vella|a|Trinxat|Trinxat|a|🥔|catalan|Lahana, patates ve domuz pastırmasıyla yapılan Pireneler yemeği; dağ köylülerinin kış artıklarını değerlendirme yolundan doğdu.
AT|Vienna|t|Sachertorte|Sachertorte|t|🍫|austrian|1832'de 16 yaşındaki çırak Franz Sacher, Prens Metternich'in misafirleri için bu çikolatalı pastayı icat etti. Bugün tarifi Viyana'daki Hotel Sacher'de sır gibi saklanıyor.
BY|Minsk|a|Draniki|Draniki|a|🥔|belarusian|Rendelenmiş patatesten yapılan kızarmış krepler; patates 19. yüzyılda yayılınca Belarus mutfağının sembolü oldu.
BE|Brussels|t|Belçika waffle'ı|Belgian waffle|t|🧇|belgian|Brüksel waffle'ı hafif ve dikdörtgendir; Liège waffle'ı ise içindeki şeker incileri sayesinde karamelize olur ve sokakta yenir.
BA|Sarajevo|s|Ćevapi|Ćevapi|s|🥙|bosnian|Osmanlı kebap geleneğinden gelen küçük ızgara köfteler; somun ekmeği, kaymak ve çiğ soğanla Saraybosna'nın Başçarşı'sında yenir.
BG|Sofia|s|Şopska salatası|Shopska salad|s|🥗|bulgarian|1950-60'larda turizm için tasarlandığı anlatılır; beyaz peynir, domates ve salatalığıyla Bulgar bayrağının renklerini taşır.
HR|Zagreb|a|Štrukli|Štrukli|s|🥟|croatian|Zagreb ve Zagorje bölgesinin taze peynirli hamur işi; haşlanarak ya da kremayla fırınlanarak yapılır.
CY|Nicosia|s|Hellim|Halloumi|s|🧀|cypriot|Yüzyıllardır adada yapılan keçi-koyun peyniri; yüksek erime noktası sayesinde ızgarada erimeden kızarır.
CZ|Prague|a|Svíčková|Svíčková|a|🥩|czech|Kremalı kök sebze sosunda dana fileto; knedlík (ekmek köftesi), kızılcık ve krema ile servis edilen bayram yemeği.
DK|Copenhagen|s|Smørrebrød|Smørrebrød|s|🥪|danish|Çavdar ekmeği üzerine açık sandviç; 19. yüzyılda işçilerin öğle yemeğiyken Kopenhag'da gurme bir sanata dönüştü.
EE|Tallinn|k|Kama|Kama (food)|k|🥣|estonian|Kavrulmuş arpa, çavdar, yulaf ve bezelye unu karışımı; kefir ya da yoğurtla karıştırılarak yenen, Estonya'ya özgü bir lezzet.
FI|Helsinki|k|Karelya turtası|Karelian pasty|k|🥧|finnish|Karelya bölgesinden gelen, pirinç lapası dolgulu ince çavdar turtası; üzerine yumurtalı tereyağı sürülür.
FR|Paris|t|Kruvasan|Croissant|k|🥐|french|Viyana'nın hilal şeklindeki kipferl çöreğinden esinlendi; 19. yüzyılda Paris'te katmerli tereyağlı hamurla bugünkü halini aldı.
DE|Berlin|a|Sauerbraten|Sauerbraten|a|🥩|german|Günlerce sirke, şarap ve baharatla marine edilen dana rosto; Almanya'nın en eski ulusal yemeklerinden biri.
GR|Athens|a|Musakka|Moussaka|a|🍆|greek|Bugünkü beşamelli Yunan musakkası 1920'lerde şef Nikolaos Tselementes'in yemek kitabıyla yaygınlaştı.
HU|Budapest|a|Gulaş|Goulash|a|🍲|hungarian|Macar sığır çobanlarının (gulyás) açık ateşte kazanda pişirdiği et yemeği; kırmızı toz biber sonradan eklenerek ona rengini verdi.
IS|Reykjavik|k|Skyr|Skyr|k|🥣|icelandic|Vikinglerle İzlanda'ya gelen, bin yılı aşkın geçmişi olan yoğun ve proteinli süt ürünü.
IE|Dublin|a|İrlanda yahnisi|Irish stew|a|🍲|irish|Kuzu, patates ve soğanla yapılan sade köylü yahnisi; az malzemeyle doyurucu bir sofra kurmanın simgesi.
IT|Rome|a|Pizza Margherita|Pizza Margherita|a|🍕|italian|Rivayete göre 1889'da Napoli'de pizzacı Raffaele Esposito, Kraliçe Margherita onuruna İtalyan bayrağının renklerinde bu pizzayı yaptı.
XK|Pristina|a|Flia|Flija|a|🥞|albanian|Kat kat hamur ve kremanın saatlerce saç kapağı altında közle pişirildiği, sabır isteyen geleneksel yemek.
LV|Riga|t|Sklandrausis|Sklandrausis|t|🥧|latvian|Havuç ve patates dolgulu tatlı çavdar tartı; Avrupa Birliği'nin "geleneksel özellikli ürün" listesinde korunuyor.
LI|Vaduz|a|Käsknöpfle|Käsknöpfle|a|🧀|swiss|Peynirli küçük hamur köftecikleri, üzerine kızarmış soğan ve yanında elma püresiyle.
LT|Vilnius|a|Cepelinai|Cepelinai|a|🥟|lithuanian|Patates hamurundan, etli ya da lorlu dolgulu köfteler; şekilleri Zeppelin hava gemilerine benzediği için bu adı aldı.
LU|Luxembourg|a|Judd mat Gaardebounen|Judd mat Gaardebounen|a|🥓|luxembourgish|Füme domuz boynu ve bakla; Lüksemburg'un ulusal yemeği kabul edilir.
MT|Valletta|s|Pastizzi|Pastizzi|s|🥐|maltese|Ricotta ya da bezelye dolgulu, çıtır katmerli Malta atıştırmalığı; adada her köşede ve çok ucuza bulunur.
MD|Chișinău|a|Mămăligă|Mămăligă|a|🌽|moldovan|Mısır unu lapası; peynir, ekşi krema ve sarmalarla birlikte yenir, köy sofralarının temelidir.
MC|Monaco|s|Barbagiuan|Barbagiuan|s|🥟|french|Pazı ve ricotta dolgulu kızarmış börekler; Monako Ulusal Günü'nün vazgeçilmezi.
ME|Podgorica|a|Kačamak|Kačamak|a|🥣|montenegrin|Mısır unu, patates ve kaymakla yapılan doyurucu dağ yemeği; çobanların güç kaynağıydı.
NL|Amsterdam|t|Stroopwafel|Stroopwafel|t|🧇|dutch|18-19. yüzyılda Gouda'da fırıncıların artık kırıntılardan yaptığı anlatılır; iki ince waffle arasında karamel şurup vardır.
MK|Skopje|a|Tavče gravče|Tavče gravče|a|🫘|macedonian|Toprak tavada fırınlanan fasulye; Kuzey Makedonya'nın ulusal yemeği.
NO|Oslo|a|Fårikål|Fårikål|a|🥬|norwegian|Koyun eti ve lahananın tane karabiberle pişirildiği yemek; 1970'lerde bir radyo oylamasıyla ulusal yemek seçildi.
PL|Warsaw|s|Pierogi|Pierogi|s|🥟|polish|Peynir-patates, et ya da lahana dolgulu hamur bohçaları; Noel arifesi sofrasının vazgeçilmezi.
PT|Lisbon|t|Pastel de nata|Pastel de nata|t|🥧|portuguese|Lizbon Belém'deki Jerónimos Manastırı rahiplerinin tarifi; manastır kapanınca 1837'de bir fırında satılmaya başlandı ve tarif hâlâ gizli.
RO|Bucharest|a|Sarmale|Sarmale|a|🥬|romanian|Osmanlı sarmasından gelen, turşu lahanaya sarılı etli dolma; Noel ve düğünlerin klasiği.
RU|Moscow|a|Pelmeni|Pelmeni|a|🥟|russian|Sibirya kökenli etli mantı; kışın dışarıda dondurulup aylarca saklanır, uzun yolculuklara götürülürdü.
SM|San Marino|t|Torta Tre Monti|Torta Tre Monti|t|🍰|italian|San Marino'nun üç kulesini simgeleyen, ince waffle katmanları ve fındık-çikolata kremasıyla yapılan pasta.
RS|Belgrade|a|Pljeskavica|Pljeskavica|a|🍔|serbian|Leskovac şehriyle ünlenen dev ızgara köfte; her yıl şehirde "Roštiljijada" ızgara festivali yapılır.
SK|Bratislava|a|Bryndzové halušky|Bryndzové halušky|a|🧀|slovak|Patates hamurundan küçük köftelerin koyun peyniri (bryndza) ve kızarmış pastırmayla buluştuğu ulusal yemek.
SI|Ljubljana|t|Potica|Potica|t|🍞|slovenian|Cevizli, ballı rulo pasta; Paskalya ve Noel'in simgesi, Slovenya'nın korumalı lezzeti.
ES|Madrid|s|Paella|Paella|a|🥘|spanish|Valensiya'nın pirinç tarlalarında çalışan köylülerin açık ateşte, geniş tavada pişirdiği yemekten doğdu.
SE|Stockholm|a|İsveç köftesi|Swedish meatballs|a|🧆|swedish|Rivayete göre Kral XII. Karl 18. yüzyılda Osmanlı'dan dönerken köfte tarifini de getirdi; bugün yaban mersini reçeliyle yenir.
CH|Bern|a|Fondü|Fondue|a|🫕|swiss|Alp köylülerinin kışın kalan peyniri ve bayat ekmeği değerlendirme yolu; 1930'larda ulusal yemek olarak tanıtıldı.
UA|Kyiv|a|Borş|Borscht|a|🍲|ukrainian|Pancarlı ve sebzeli çorba; Ukrayna borş pişirme kültürü 2022'de UNESCO Somut Olmayan Kültürel Miras listesine alındı.
GB|London|a|Fish and chips|Fish and chips|a|🐟|british|1860'larda ilk dükkânlar Londra ve Kuzey İngiltere'de açıldı; işçi sınıfının ucuz ve doyurucu öğünü ulusal sembole dönüştü.
`,
asia: `
AF|Kabul|a|Kabuli pulao|Kabuli palaw|a|🍚|afghan|Havuç, kuru üzüm ve kuzu etiyle yapılan ulusal pilav; misafire saygının göstergesidir.
AM|Yerevan|s|Lavaş|Lavash|s|🫓|armenian|Tandırda pişen ince ekmek; Ermeni lavaş yapım geleneği 2014'te UNESCO listesine girdi.
AZ|Baku|a|Dolma|Dolma|a|🫑|azerbaijani|Asma yaprağı, lahana ya da sebzeye sarılan etli iç; Azerbaycan'ın dolma pişirme geleneği 2017'de UNESCO listesine alındı.
BH|Manama|a|Muhammar|Muhammar|a|🍚|arab|Hurma şurubu ya da şekerle tatlandırılan pirinç; genellikle kızarmış balıkla birlikte yenir.
BD|Dhaka|a|Kacchi biryani|Kacchi biryani|a|🍛|bangladeshi|Babür mirası; çiğ marine edilmiş et ve pirinç, kapağı hamurla kapatılan kazanda "dum" usulü birlikte pişer.
BT|Thimphu|a|Ema datshi|Ema datshi|a|🌶️|bhutanese|Acı biber ve peynirden yapılan ulusal yemek; Butan'da biber baharat değil sebze gibi kullanılır.
BN|Bandar Seri Begawan|a|Ambuyat|Ambuyat|a|🥣|malaysian|Sagu nişastasından yapılan yapışkan yemek; çatal benzeri bambu çubuklarla sarılıp ekşi sosa batırılır.
KH|Phnom Penh|a|Balık amok|Fish amok|a|🐟|cambodian|Hindistan cevizi sütü ve kroeung baharat ezmesiyle muz yaprağında buğulanan balık; Khmer mutfağının yıldızı.
CN|Beijing|a|Pekin ördeği|Peking duck|a|🦆|chinese|İmparatorluk mutfağında yüzyıllardır hazırlanır; çıtır derisi masada ince ince dilimlenip krep, soğan ve sosla sarılır.
GE|Tbilisi|s|Haçapuri|Khachapuri|s|🧀|georgian|Peynirli Gürcü ekmeği; Acara tipi tekne şeklindedir ve ortasına yumurta ile tereyağı konup karıştırılarak yenir.
IN|New Delhi|a|Biryani|Biryani|a|🍛|indian|Babür sarayı mutfağıyla yaygınlaşan baharatlı pilav; Haydarabad'dan Kalküta'ya her bölgenin kendi versiyonu var.
ID|Jakarta|a|Rendang|Rendang|a|🍛|indonesian|Minangkabau halkının saatlerce hindistan cevizi sütü ve baharatla pişirdiği et; uzun yolculuklara dayanacak kadar kurur.
IR|Tehran|a|Gormeh sebzi|Ghormeh sabzi|a|🍲|persian|Bol yeşillik, barbunya ve kuru limonla ağır ateşte pişen, İran'ın en sevilen yahnisi.
IQ|Baghdad|a|Masgouf|Masgouf|a|🐟|iraqi|Ortadan açılan sazan balığı Dicle kıyısında açık ateş karşısında saatlerce pişirilir; Mezopotamya'dan kalma bir gelenek.
IL|Tel Aviv|s|Sabich|Sabich|s|🥙|israeli|Iraklı Yahudilerin Şabat sabahı yediği kızarmış patlıcan ve haşlanmış yumurtadan doğan pide sandviçi.
PS|Ramallah|a|Musakhan|Musakhan|a|🍗|palestinian|Sumaklı soğan ve tavuğun taboon ekmeğinde pişirildiği zeytin hasadı yemeği; taze zeytinyağının kutlamasıdır.
JP|Tokyo|a|Suşi|Sushi|a|🍣|japanese|Balığın fermente pirinçte saklanmasından doğdu; Edo döneminde (1800'ler) Tokyo sokaklarında bugünkü hızlı nigiri haline geldi.
JO|Amman|a|Mansaf|Mansaf|a|🍖|jordanian|Kurutulmuş yoğurt (jameed) sosunda kuzu ve pilav; misafirperverliğin simgesi, 2022'de UNESCO listesine girdi.
KZ|Astana|a|Beşbarmak|Beshbarmak|a|🍖|kazakh|Adı "beş parmak" demektir, çünkü göçebeler bu et ve hamur yemeğini elle yerdi.
KW|Kuwait City|a|Machboos|Machboos|a|🍛|arab|Baharatlı pirinç ve tavuk, kuzu ya da balık; Kuveyt'in ulusal yemeği, Körfez sofralarının ortak lezzeti.
KG|Bishkek|a|Kuurdak|Kuurdak|a|🥩|kyrgyz|Kızartılmış et ve soğan; göçebe sofrasının en eski ve en pratik yemeklerinden biri.
LA|Vientiane|s|Larb|Larb|s|🥗|laotian|Kıyılmış et, taze nane ve kavrulmuş pirinç tozuyla yapılan salata; Laos'un ulusal yemeği sayılır.
LB|Beirut|s|Tabule|Tabbouleh|s|🥗|lebanese|Bol maydanozlu, az bulgurlu limonlu salata; Lübnan meze sofrasının yıldızı, her yıl Temmuz'da Tabule Günü kutlanır.
MY|Kuala Lumpur|k|Nasi lemak|Nasi lemak|k|🍚|malaysian|Hindistan cevizi sütüyle pişen pilav, acı sambal, hamsi ve yumurtayla; muz yaprağına sarılı geleneksel kahvaltı.
MV|Malé|a|Garudhiya|Garudhiya|a|🐟|maldivian|Ton balığı suyu çorbası; pirinç, limon ve acı biberle yenir, Maldiv mutfağının temelidir.
MN|Ulaanbaatar|s|Buuz|Buuz|s|🥟|mongolian|Buharda pişen etli mantı; Ay Yeni Yılı Tsagaan Sar'da aileler binlercesini birlikte hazırlar.
MM|Yangon|k|Mohinga|Mohinga|k|🍜|burmese|Balık çorbalı pirinç eriştesi; Myanmar'ın gayriresmî ulusal kahvaltısı, sabah sokak tezgâhlarında satılır.
NP|Kathmandu|s|Momo|Momo (food)|s|🥟|nepalese|Tibet'ten gelen buharda pişen mantı; bugün Nepal'in en sevilen sokak lezzeti.
KP|Pyongyang|a|Naengmyeon|Naengmyeon|a|🍜|korean|Buz gibi et suyunda karabuğday eriştesi; Pyongyang usulü yüzyıllardır ünlüdür.
OM|Muscat|a|Shuwa|Shuwa|a|🍖|omani|Baharatlı kuzu, hurma ya da muz yaprağına sarılıp toprak çukurda 1-2 gün pişirilir; bayram yemeğidir.
PK|Lahore|a|Nihari|Nihari|a|🍲|pakistani|Babür döneminden kalma; bütün gece pişen ve sabah namazından sonra yenen baharatlı et yahnisi.
PH|Manila|a|Adobo|Philippine adobo|a|🍗|filipino|Sirke, soya sosu ve sarımsakta pişen et; sirke tropik iklimde yemeği koruma yöntemiydi.
QA|Doha|a|Harees|Harees|a|🥣|arab|Buğday ve etin saatlerce pişirilip dövüldüğü yemek; Ramazan ve bayram sofralarının klasiği.
SA|Riyadh|a|Kabsa|Kabsa|a|🍛|saudi|Baharatlı pirinç ve et; büyük tepsilerde paylaşılan, Arap yarımadasının ortak sofrası.
SG|Singapore|s|Hainan tavuklu pilav|Hainanese chicken rice|a|🍗|singaporean|Çin'in Hainan adasından gelen göçmenlerin getirdiği haşlanmış tavuk ve tavuk sulu pilav; Singapur'un gayriresmî ulusal yemeği.
KR|Seoul|s|Kimçi|Kimchi|s|🥬|korean|Kış için sebze saklama geleneği; ailelerin birlikte kimçi yaptığı "kimjang" 2013'te UNESCO listesine girdi.
LK|Colombo|k|Hoppers|Appam|k|🥞|sri_lankan|Hindistan cevizi sütlü pirinç hamurundan çanak şeklinde krep; ortasına yumurta kırılarak kahvaltıda yenir.
SY|Damascus|s|İçli köfte (kibbeh)|Kibbeh|s|🧆|syrian|Bulgur ve kıymadan yapılan içli köftenin yüzlerce çeşidi var; Halep bu konuda dünyaca ünlü.
TW|Taipei|s|Biftekli erişte çorbası|Beef noodle soup|a|🍜|taiwanese|1949 sonrası anakaradan gelen askerlerle yaygınlaştı; Taipei'de her yıl bu çorbaya özel festival yapılır.
TJ|Dushanbe|a|Kurutob|Qurutob|a|🥗|tajik|Kurut (kurutulmuş yoğurt) suyuna batırılmış katmerli ekmek, taze sebzelerle ortak tabaktan elle yenir; ulusal yemek.
TH|Bangkok|s|Pad thai|Pad thai|a|🍜|thai|1930-40'larda hükümetin ulusal kimliği ve pirinç eriştesini teşvik kampanyasıyla yaygınlaşan sokak klasiği.
TL|Dili|a|Batar daan|Batar daan|a|🌽|asian|Mısır, balkabağı ve fasulyeyle yapılan geleneksel Doğu Timor yemeği.
TR|Istanbul|k|Baklava|Baklava|t|🥮|turkish|Osmanlı sarayında Ramazan'ın 15. günü yeniçerilere tepsilerle baklava dağıtılırdı; bu törene "Baklava Alayı" denirdi.
TM|Ashgabat|a|Dograma|Dograma|a|🍲|turkmen|Ekmek, et ve soğanın elle parçalanıp et suyuyla karıştırıldığı bayram yemeği; adı "doğramak" fiilinden gelir.
AE|Dubai|t|Luqaimat|Luqaimat|t|🍩|arab|Dışı çıtır, içi yumuşak hamur lokmaları; hurma şurubuyla yenir, Ramazan'ın vazgeçilmezi.
UZ|Tashkent|a|Plov|Plov|a|🍚|uzbek|Özbek plov kültürü 2016'da UNESCO listesine girdi; düğünlerde dev kazanlarda yüzlerce kişilik pişirilir.
VN|Hanoi|a|Phở|Pho|a|🍜|vietnamese|20. yüzyıl başında Kuzey Vietnam'da doğan erişte çorbası; Fransız pot-au-feu etkisi hâlâ tartışılır.
YE|Sanaa|a|Saltah|Saltah|a|🍲|yemeni|Çemen köpüğüyle taş kapta fokurdayarak gelen yahni; Yemen'in ulusal yemeği.
`,
africa: `
DZ|Algiers|a|Kuskus|Couscous|a|🍲|algerian|Mağrip'in ortak mirası; 2020'de Cezayir, Fas, Moritanya ve Tunus'un ortak başvurusuyla UNESCO listesine girdi.
AO|Luanda|a|Moamba de galinha|Moamba de galinha|a|🍗|angolan|Palmiye yağı soslu tavuk yahnisi; manyok lapası funge ile servis edilir.
BJ|Cotonou|a|Dövülmüş yam|Pounded yam|a|🍠|african|Haşlanıp havanda dövülen yam yumrusu; çorbalarla birlikte elle yenir.
BW|Gaborone|a|Seswaa|Seswaa|a|🥩|african|Saatlerce pişirilip tahta kaşıkla dövülen et; düğün ve bayramların ulusal yemeği.
BF|Ouagadougou|a|Tô|Tô (food)|a|🥣|african|Darı ya da mısır unundan katı lapa; bamya ve baobab yaprağı soslarıyla yenir.
BI|Bujumbura|a|Ibiharage|Burundian cuisine|a|🫘|african|Palmiye yağı ve soğanla pişen fasulye; Burundi sofralarının temelidir.
CV|Praia|a|Cachupa|Cachupa|a|🍲|cape_verdean|Mısır, fasulye ve etle saatlerce pişen ulusal yahni; ertesi sabah kızartılıp yumurtayla kahvaltıda yenir.
CM|Douala|a|Ndolé|Ndolé|a|🥬|african|Acı ndolé yaprakları, fıstık ezmesi ve et ya da karidesle yapılan ulusal yemek.
CF|Bangui|a|Fufu|Fufu|a|🍠|african|Manyok ya da yamdan yapılan yumuşak hamur; çorba ve soslarla elle yenir.
TD|N'Djamena|a|Daraba|Chadian cuisine|a|🥬|african|Bamya, domates ve fıstık ezmesiyle pişen sebze yahnisi.
KM|Moroni|a|Mataba|Comorian cuisine|a|🥬|african|Manyok yaprağının hindistan cevizi sütünde pişirildiği yemek.
CG|Brazzaville|a|Saka-saka|Saka-saka|a|🥬|african|Dövülmüş manyok yaprakları, palmiye yağı ve balıkla pişer.
CD|Kinshasa|a|Moambe tavuğu|Moambe|a|🍗|african|Palmiye meyvesi soslu tavuk; Kongo'nun ulusal yemeği sayılır.
DJ|Djibouti|a|Skoudehkaris|Djiboutian cuisine|a|🍛|african|Kuzu, domates ve baharatlı pilav; Cibuti'nin ulusal yemeği.
EG|Cairo|s|Koşari|Koshary|a|🍝|egyptian|Pirinç, mercimek ve makarnanın domates sosu ve çıtır soğanla buluştuğu sokak yemeği; 19. yüzyılda Kahire'de yayıldı.
GQ|Malabo|a|Biberli çorba|Pepper soup|a|🍲|african|Bol acılı, et ya da balıklı berrak çorba; Batı Afrika'nın şifa çorbası.
ER|Asmara|a|Zigni|Zigni|a|🍲|ethiopian|Berbere baharatıyla pişen et yahnisi; injera ekmeğiyle ortak tabaktan yenir.
SZ|Mbabane|a|Sishwala|Swazi cuisine|a|🥣|african|Mısır unu lapası; et ve sebze yahnileriyle yenir.
ET|Addis Ababa|a|İnjera|Injera|a|🫓|ethiopian|Teff tahılından yapılan ekşi mayalı süngerimsi ekmek; hem tabak hem çatal görevi görür.
GA|Libreville|a|Nyembwe tavuğu|Poulet nyembwe|a|🍗|african|Palmiye cevizi soslu tavuk; Gabon'un ulusal yemeği.
GM|Banjul|a|Domoda|Domoda|a|🥜|african|Fıstık ezmeli et yahnisi pilavla yenir; Gambiya'nın ulusal yemeği.
GH|Accra|a|Jollof pilavı|Jollof rice|a|🍛|african|Domatesli baharatlı pilav; Gana ile Nijerya arasında "kimin jollof'u daha iyi" diye tatlı bir rekabet var.
GN|Conakry|a|Fıstık yahnisi|Groundnut stew|a|🥜|african|Fıstık ezmesiyle koyulaşan et yahnisi; Batı Afrika'nın klasiği.
GW|Bissau|a|Caldo de mancarra|Bissau-Guinean cuisine|a|🥜|african|Fıstık soslu tavuk ya da balık; pilavla servis edilir.
CI|Abidjan|a|Attiéké|Attiéké|a|🍚|african|Fermente manyoktan kuskus; ızgara balık ve soğan-domates salatasıyla yenir.
KE|Nairobi|a|Ugali|Ugali|a|🌽|african|Mısır unu lapası; nyama choma (ızgara et) ve sukuma wiki (karalahana) ile.
LS|Maseru|a|Papa|Pap (food)|a|🌽|african|Mısır lapası; Lesoto'da neredeyse her öğünde bulunur.
LR|Monrovia|a|Palava sos|Palava sauce|a|🥬|african|Yeşil yapraklar, palmiye yağı ve etle yapılan sos; pilavla yenir.
LY|Tripoli|a|Bazeen|Bazeen|a|🥣|libyan|Arpa unu hamuru kubbe şeklinde ortaya konur, etrafına et ve domates sosu dökülür; elle yenir.
MG|Antananarivo|a|Romazava|Romazava|a|🍲|african|Yeşil yapraklar ve etle yapılan ulusal yahni; pilavla yenir.
MW|Lilongwe|a|Nsima|Nsima|a|🌽|african|Mısır lapası; Malavi'de "nsima yemediysen yemek yememişsindir" denir.
ML|Bamako|a|Mafe|Maafe|a|🥜|african|Mali'nin Mandinka ve Bambara halklarından yayılan fıstık ezmeli et yahnisi.
MR|Nouakchott|a|Méchoui|Méchoui|a|🍖|african|Bütün kuzunun ateşte çevrilerek pişirildiği bayram ziyafeti.
MU|Port Louis|s|Dholl puri|Dholl puri|s|🫓|indian|Hint göçmenlerinin mirası; sarı bezelye dolgulu ince ekmek, köri ve turşuyla.
MA|Marrakesh|a|Tajin|Tajine|a|🍲|moroccan|Konik toprak kapta ağır ağır pişen et ve sebze; yemek adını kabından alır.
MZ|Maputo|a|Matapa|Matapa|a|🥬|african|Manyok yaprağı, fıstık ve hindistan cevizi sütüyle pişen yemek.
NA|Windhoek|s|Kapana|Namibian cuisine|s|🥩|african|Pazarlarda sıcak ızgarada pişirilip baharatla yenen et parçaları.
NE|Niamey|s|Kilishi|Kilishi|s|🥩|african|Baharatlı ve fıstıklı kurutulmuş et; Sahel'in yol azığı.
NG|Lagos|a|Egusi çorbası|Egusi|a|🍲|african|Kavun çekirdeği unuyla koyulaşan çorba; dövülmüş yam ile yenir.
RW|Kigali|a|Isombe|Isombe|a|🥬|african|Dövülmüş manyok yaprakları, patlıcan ve fıstık ezmesiyle pişer.
ST|São Tomé|a|Calulu|Calulu|a|🐟|african|Füme balık ve yeşilliklerle pişen palmiye yağlı yahni.
SN|Dakar|a|Thieboudienne|Thieboudienne|a|🐟|african|Balık ve domatesli pilav; ceebu jën 2021'de UNESCO listesine girdi.
SC|Victoria|t|Ladob|Seychellois cuisine|t|🍌|african|Hindistan cevizi sütünde pişen muz ve tatlı patates; tatlı ya da tuzlu yapılır.
SL|Freetown|a|Manyok yaprağı|Cassava leaves|a|🥬|african|Manyok yaprakları, palmiye yağı ve etle pişen yahni; pilavla yenir.
SO|Mogadishu|k|Canjeero|Canjeero|k|🥞|somali|Mayalı ince krep; şeker ve çayla ya da etle kahvaltıda yenir.
ZA|Cape Town|a|Bobotie|Bobotie|a|🥧|south_african|Cape Malay mutfağından gelen baharatlı kıyma; üzeri yumurtalı krema ile fırınlanır.
SS|Juba|a|Kisra|Kisra|a|🫓|african|Darıdan yapılan ince ekşi mayalı ekmek; yahnilerle yenir.
SD|Khartoum|k|Ful medames|Ful medames|k|🫘|sudanese|Yavaş pişen bakla ezmesi; zeytinyağı ve kimyonla kahvaltıda yenir.
TZ|Dar es Salaam|s|Mishkaki|Mishkaki|s|🍢|african|Marine edilip kömürde pişirilen et şişleri; akşam sokak tezgâhlarının yıldızı.
TG|Lomé|a|Fufu|Fufu|a|🍠|african|Manyok ve yamdan dövülen yumuşak hamur; Togo'da fıstık ya da palmiye çorbasıyla yenir.
TN|Tunis|k|Şakşuka|Shakshouka|k|🍳|tunisian|Domates-biber sosunda pişen yumurta; Tunus kökenli olduğu kabul edilir ve tüm Akdeniz'e yayıldı.
UG|Kampala|k|Rolex|Rolex (food)|k|🌯|african|Adı "rolled eggs" (sarılı yumurta) ifadesinden gelir; çapatiye sarılmış omlet.
ZM|Lusaka|a|Nshima|Nshima|a|🌽|african|Mısır lapası; Zambiya sofrasının kalbi.
ZW|Harare|a|Sadza|Sadza|a|🌽|african|Mısır lapası; et ve yeşil yapraklı sebzelerle elle yenir.
`,
americas: `
AG|St. John's|a|Fungee ve pepperpot|Fungee|a|🌽|caribbean|Mısır unundan fungee ve sebzeli et yahnisi pepperpot; ulusal yemek.
AR|Buenos Aires|a|Asado|Asado|a|🥩|argentinian|Gauçoların açık ateşte et pişirme geleneği; pazar günleri ailenin bir araya geldiği ritüel.
BS|Nassau|s|Conch fritter|Conch fritter|s|🐚|caribbean|Deniz salyangozu (conch) eti ile yapılan kızarmış lokmalar.
BB|Bridgetown|a|Cou-cou ve uçan balık|Cou-cou|a|🐟|caribbean|Mısır unu ve bamya lapası ile uçan balık; Barbados'un ulusal yemeği.
BZ|Belize City|a|Pilav ve fasulye|Rice and beans|a|🍚|caribbean|Hindistan cevizi sütüyle pişen pilav ve fasulye, yanında tavuk yahnisi.
BO|La Paz|s|Salteña|Salteña|s|🥟|bolivian|Sulu dolgulu fırın böreği; adını Arjantin'in Salta şehrinden alır, sabahları yenir.
BR|São Paulo|a|Feijoada|Feijoada|a|🫘|brazilian|Siyah fasulye ve çeşitli domuz etleriyle pişen ulusal yemek; geleneksel olarak cumartesi yenir.
CA|Montreal|s|Poutine|Poutine|s|🍟|canadian|1950'lerde Quebec'te doğdu: patates kızartması, peynir parçaları ve sıcak sos.
CL|Santiago|s|Empanada de pino|Empanada|s|🥟|chilean|Kıyma, soğan, yumurta ve zeytin dolgulu fırın böreği; 18 Eylül bayramının yıldızı.
CO|Bogotá|k|Arepa|Arepa|k|🫓|colombian|Kolomb öncesi yerli halklardan kalma mısır ekmeği; kahvaltıda peynir ya da yumurtayla yenir.
CR|San José|k|Gallo pinto|Gallo pinto|k|🍚|latin_american|Pirinç ve siyah fasulye; ulusal kahvaltı, Nikaragua ile kökeni hakkında tatlı bir tartışma var.
CU|Havana|a|Ropa vieja|Ropa vieja|a|🥩|cuban|Adı "eski giysiler" demek; didiklenmiş et lif lif kumaş gibi görünür. Kanarya Adaları'ndan geldi.
DM|Roseau|a|Callaloo|Callaloo|a|🥬|caribbean|Yeşil yapraklı sebze ve hindistan cevizi sütüyle yapılan çorba-yahni.
DO|Santo Domingo|k|Mangú|Mangú|k|🍌|dominican|Haşlanıp ezilmiş yeşil muz; kızarmış peynir, salam ve yumurtayla birlikte "los tres golpes" adıyla yenir.
EC|Quito|a|Encebollado|Encebollado|a|🐟|ecuadorian|Ton balığı, manyok ve turşu soğanla yapılan çorba; Ekvador'da sabahların favorisi.
SV|San Salvador|s|Pupusa|Pupusa|s|🫓|salvadoran|Peynir, fasulye ya da chicharrón dolgulu mısır pidesi; Kasım'ın ikinci pazarı Ulusal Pupusa Günü.
GD|St. George's|a|Oil down|Oil down|a|🍲|caribbean|Ekmek ağacı meyvesi, tuzlu et ve hindistan cevizi sütüyle tek kapta pişen ulusal yemek.
GT|Guatemala City|a|Pepián|Pepián|a|🍲|guatemalan|Maya ve İspanyol mutfaklarının buluştuğu, kavrulmuş tohum ve biberli yahni.
GY|Georgetown|a|Pepperpot|Pepperpot|a|🍲|caribbean|Manyok özüyle (cassareep) pişen et yahnisi; Noel sabahının geleneği.
HT|Port-au-Prince|a|Soup joumou|Soup joumou|a|🎃|caribbean|1804'te bağımsızlığı kutlamak için her 1 Ocak'ta içilen kabak çorbası; 2021'de UNESCO listesine girdi.
HN|Tegucigalpa|s|Baleada|Baleada|s|🌯|honduran|Un tortillası içinde ezilmiş fasulye, peynir ve krema; Honduras'ın en sevilen sokak lezzeti.
JM|Kingston|k|Ackee ve tuzlu balık|Ackee and saltfish|k|🐟|jamaican|Ulusal yemek; ackee meyvesi 18. yüzyılda Batı Afrika'dan adaya geldi.
MX|Mexico City|a|Mole poblano|Mole poblano|a|🍫|mexican|Rivayete göre Puebla'daki Santa Clara manastırında rahibeler, bir başpiskopos ziyareti için çikolatalı ve biberli bu sosu yarattı.
NI|Managua|a|Nacatamal|Nacatamal|a|🫔|latin_american|Muz yaprağına sarılıp buharda pişirilen etli mısır hamuru; pazar sabahlarının geleneği.
PA|Panama City|a|Sancocho|Sancocho|a|🍲|latin_american|Tavuk, yam ve kişnişle pişen çorba; Panama'nın ulusal yemeği.
PY|Asunción|s|Chipa|Chipa|s|🥯|paraguayan|Manyok nişastası ve peynirle yapılan çörek; Guaraní mirası.
PE|Lima|a|Ceviche|Ceviche|s|🐟|peruvian|Limon suyuyla "pişirilen" çiğ balık; Peru seviçesi 2023'te UNESCO listesine girdi.
KN|Basseterre|a|Goat water|Goat water|a|🍲|caribbean|Keçi etinden yapılan baharatlı yahni; ulusal yemek.
LC|Castries|a|Yeşil muz ve tuzlu balık|Saint Lucian cuisine|a|🍌|caribbean|Haşlanmış yeşil muz ve tuzlu morina; Saint Lucia'nın ulusal yemeği.
VC|Kingstown|a|Közlenmiş ekmek ağacı meyvesi|Breadfruit|a|🍈|caribbean|Ateşte közlenen ekmek ağacı meyvesi ve kızarmış balık; ulusal yemek.
SR|Paramaribo|a|Pom|Pom (dish)|a|🥧|surinamese|Taro kökü ve tavukla fırınlanan bayram yemeği; Yahudi ve Kreol mutfaklarının buluşması.
TT|Port of Spain|k|Doubles|Doubles (food)|k|🫓|caribbean|Hint göçmenlerinin mirası; iki kızarmış ekmek arasında nohut körisi, kahvaltıda sokakta yenir.
US|New York|a|Hamburger|Hamburger|a|🍔|american|Alman göçmenlerin Hamburg bifteğinden gelişti; 20. yüzyılda Amerikan yaşam tarzının sembolü oldu.
UY|Montevideo|a|Chivito|Chivito (sandwich)|a|🥪|uruguayan|1940'larda Punta del Este'de bir müşterinin keçi eti istemesi üzerine biftekle uydurulduğu anlatılır.
VE|Caracas|a|Pabellón criollo|Pabellón criollo|a|🍛|venezuelan|Didiklenmiş et, siyah fasulye, pilav ve kızarmış muz; Venezuela'nın ulusal yemeği.
`,
oceania: `
AU|Sydney|t|Pavlova|Pavlova (food)|t|🍰|australian|1920'lerde Rus balerin Anna Pavlova'nın turnesi onuruna yapıldı; Yeni Zelanda ile kökeni hâlâ tartışılıyor.
FJ|Suva|a|Kokoda|Kokoda (food)|s|🐟|pacific|Limonla marine edilmiş çiğ balık, hindistan cevizi sütü ve sebzelerle.
KI|Tarawa|a|Hindistan cevizi yengeci|Coconut crab|a|🦀|pacific|Adaların dev hindistan cevizi yengeci özel günlerde pişirilir.
MH|Majuro|t|Pandanus|Pandanus|t|🍍|pacific|Pandanus meyvesi tatlı ve ezme olarak yenir; ada kültürünün temeli.
FM|Pohnpei|a|Taro|Taro|a|🥔|pacific|Taro kökü haşlanır ya da fırınlanır; Mikronezya sofralarının temeli.
NR|Yaren|a|Hindistan cevizli balık|Nauruan cuisine|a|🐟|pacific|Taze balık hindistan cevizi sütüyle pişirilir.
NZ|Auckland|a|Hāngī|Hāngī|a|🍖|maori|Maori'lerin toprak altında sıcak taşlarla saatlerce pişirdiği et ve sebze ziyafeti.
PW|Koror|a|Tapyoka|Palauan cuisine|a|🥥|pacific|Manyok ve taro, balık ve hindistan cevizi ile.
PG|Port Moresby|a|Mumu|Mumu (food)|a|🍠|pacific|Toprak fırında sıcak taşlarla pişen domuz eti, tatlı patates ve sebzeler.
WS|Apia|a|Palusami|Palusami|a|🥬|pacific|Hindistan cevizi kremasıyla doldurulup taro yaprağına sarılan, toprak fırında pişen yemek.
SB|Honiara|a|Manyok pudingi|Solomon Islands cuisine|t|🍠|pacific|Manyok ve hindistan cevizi sütüyle pişen yoğun puding.
TO|Nukuʻalofa|a|Lu pulu|Lu pulu|a|🥬|pacific|Konserve sığır eti ve hindistan cevizi kremasının taro yaprağına sarılıp fırınlanması.
TV|Funafuti|a|Pulaka|Cyrtosperma merkusii|a|🍠|pacific|Dev bataklık tarosu; Tuvalu'nun ana besin kaynağı.
VU|Port Vila|a|Laplap|Laplap|a|🥧|pacific|Rendelenmiş yam ya da manyok hamuru, hindistan cevizi kremasıyla yaprağa sarılıp toprak fırında pişer.
`};

const CONTINENTS = ['europe','asia','africa','americas','oceania'];
const COUNTRIES = [];
for (const cont of CONTINENTS) {
  RAW[cont].trim().split('\n').forEach(line => {
    const [code, city, strength, dish, wiki, cat, emoji, cuisine, story] = line.split('|');
    COUNTRIES.push({ code, city, strength, dish, wiki, cat, emoji, cuisine, story, cont });
  });
}
