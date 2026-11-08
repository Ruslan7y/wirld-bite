/* Cities and their famous dishes (phase 1: 37 countries).
   Line: ISO2 | city | region | lat | lon | dishes
   Dish: name ~ Wikipedia (en) title ~ category (k breakfast, a main, s starter/street, t dessert) ~ emoji ~ short description (TR) — dishes separated by ';' */
const CITIES_RAW = `
TR|Gaziantep|Güneydoğu Anadolu|37.07|37.38|Baklava~Baklava~t~🥮~Antep fıstıklı, kat kat ince yufka; Gaziantep baklavası AB'de tescilli.;Beyran~Beyran~a~🍲~Kuzu eti, pirinç ve sarımsakla sabahları içilen acılı çorba.;Ali Nazik~Ali Nazik kebab~a~🍆~Közlenmiş patlıcanlı yoğurt üzerinde tereyağlı et.
TR|Adana|Akdeniz|37.00|35.32|Adana kebabı~Adana kebabı~a~🍢~Zırhla çekilmiş kuzu kıyma, pul biberle şişte közde pişer.;Şalgam~Şalgam~s~🥤~Mor havuç ve bulgurla fermente edilen ekşi-acı içecek.;Bici bici~Bici bici~t~🧊~Nişasta pelte, kar gibi buz ve gül şerbetiyle yaz tatlısı.
TR|İstanbul|Marmara|41.01|28.98|Balık ekmek~Balık ekmek~s~🐟~Eminönü'nde ızgara uskumru ve soğanla ekmek arası.;Simit~Simit~k~🥯~Susamlı halka ekmek; çayla kahvaltının vazgeçilmezi.;Hünkâr beğendi~Hünkâr beğendi~a~🍲~Patlıcan beğendi üzerinde kuzu yahni; Osmanlı saray yemeği.
TR|İzmir|Ege|38.42|27.14|Boyoz~Boyoz~k~🥐~Sefarad mirası, çıtır katmerli çörek; haşlanmış yumurtayla yenir.;Kumru~Kumru (sandwich)~s~🥪~Sucuk, peynir ve domatesli susamlı sandviç.;Zeytinyağlı enginar~Artichoke~s~🫒~Ege'nin zeytinyağlı enginar dolması.
TR|Trabzon|Karadeniz|41.00|39.72|Kuymak~Muhlama~k~🧀~Mısır unu, tereyağı ve uzayan peynirle Karadeniz kahvaltısı.;Hamsili pilav~Hamsili pilav~a~🐟~Hamsiyle sarılıp fırınlanan pilav.;Akçaabat köftesi~Akçaabat köftesi~a~🧆~Sarımsaklı, bayat ekmekli ızgara köfte.
TR|Konya|İç Anadolu|37.87|32.49|Etli ekmek~Etli ekmek~a~🫓~Uzun ince hamur üzerinde ince kıyma; Konya'nın simgesi.;Fırın kebabı~Fırın kebabı~a~🍖~Kuzu, kuyu tandırında saatlerce pişer.
TR|Bursa|Marmara|40.19|29.06|İskender kebap~İskender kebap~a~🥙~Döner, pide, domates sosu, tereyağı ve yoğurt; 1867'de İskender Efendi'nin buluşu.;Kestane şekeri~Candied chestnut~t~🌰~Uludağ kestanesiyle yapılan şekerleme.
TR|Kayseri|İç Anadolu|38.73|35.49|Kayseri mantısı~Manti (food)~a~🥟~Bir kaşığa 40 tane sığacak kadar küçük mantı.;Pastırma~Pastirma~s~🥩~Çemenle kaplanmış kurutulmuş et.
AZ|Bakı|Abşeron|40.41|49.87|Şah plov~Shah pilaf~a~🍚~Lavaş kabuk içinde safranlı pilav, et ve kuru meyve.;Dolma~Dolma~a~🫑~Yarpaq ve kələm dolması; UNESCO listesinde.;Qutab~Qutab~s~🥟~Yarım ay şeklinde göyərti, ət ya da balqabaqlı ince börek.
AZ|Şəki|Şəki-Zaqatala|41.19|47.17|Şəki halvası~Halva~t~🍯~Düyü unu tor üzerinde fındık ve şerbetle kat kat.;Piti~Piti (food)~a~🍲~Kuzu, nohut ve safranla toprak kapta pişen çorba.
AZ|Gəncə|Gəncə-Qazax|40.68|46.36|Bozbaş~Bozbash~a~🍲~Kuzu, nohut ve patatesli köfteli çorba.;Düşbərə~Dushbara~a~🥟~Minik mantılar, et suyunda nane ve sirkeyle.
AZ|Lənkəran|Lənkəran-Astara|38.75|48.85|Ləvəngi~Lavangi~a~🐔~Ceviz, soğan ve alça ile doldurulup fırınlanan tavuk ya da balık.;Lənkəran çayı~Tea in Azerbaijan~s~🍵~Azərbaycan çayının vatanı; armudu stəkanda mürəbbə ile.
GE|Tbilisi|Kartli|41.72|44.79|Hinkali~Khinkali~a~🥟~Suyu içinde etli büyük mantı; kuyruğundan tutularak yenir.;Badrijani nigvzit~Badrijani nigvzit~s~🍆~Cevizli ezme sarılmış patlıcan dilimleri.
GE|Batumi|Acara|41.64|41.64|Acaruli haçapuri~Khachapuri~s~🧀~Tekne şeklinde, ortasında yumurta ve tereyağı.
GE|Kutaisi|İmereti|42.27|42.70|İmeruli haçapuri~Khachapuri~s~🧀~Yuvarlak, içi İmereti peyniriyle dolu.
GE|Telavi|Kaheti|41.92|45.47|Mtsvadi~Mtsvadi~a~🍖~Asma çubuğu ateşinde şiş kebap.;Çurçhela~Churchkhela~t~🍬~Cevizlerin üzüm pestiliyle kaplandığı sucuk şeklinde tatlı.
UZ|Taşkent|Taşkent|41.30|69.24|Taşkent plovu~Plov~a~🍚~Düğün ve bayram kazanlarının pilavı.;Lagman~Lagman (food)~a~🍜~Elde çekilmiş erişte, et ve sebze sosu.
UZ|Semerkant|Zarafşan|39.65|66.96|Semerkant nanı~Non (bread)~s~🫓~Kalın, desenli tandır ekmeği; günlerce taze kalır.;Samsa~Samsa (food)~s~🥟~Tandırda pişen etli üçgen börek.
UZ|Hive|Harezm|41.38|60.36|Şivit oşi~Shivit oshi~a~🍝~Dereotlu yeşil erişte, et sosu ve yoğurtla.
KZ|Almatı|Yedisu|43.24|76.89|Beşbarmak~Beshbarmak~a~🍖~Haşlanmış et ve geniş hamur yaprakları.;Baursak~Baursak~t~🍩~Kızarmış kabarık hamur topları; bayram sofrasında.
KZ|Astana|Akmola|51.17|71.45|Kazı~Kazy~s~🌭~At etinden yapılan geleneksel sucuk.;Kımız~Kumis~s~🥛~Fermente kısrak sütü.
IR|Tahran|Tahran|35.69|51.39|Çelo kebap~Chelow kabab~a~🍢~Safranlı pilav ve kebap; İran'ın ulusal yemeği.;Fesencan~Fesenjan~a~🍗~Ceviz ve nar ekşili tavuk yahnisi.
IR|İsfahan|İsfahan|32.65|51.67|Beryani~Beryani~a~🥩~Kıyılmış kuzu ve ciğerin taze ekmekle yendiği İsfahan yemeği.;Gaz~Gaz (candy)~t~🍬~Fıstıklı geleneksel nuga.
IR|Tebriz|Doğu Azerbaycan|38.08|46.29|Tebriz köftesi~Kufteh Tabrizi~a~🧆~İçine yumurta, ceviz ve kuru meyve konan dev köfte.
IR|Reşt|Gilan|37.28|49.58|Mirza kasımi~Mirza Ghasemi~s~🍆~Közlenmiş patlıcan, sarımsak, domates ve yumurta.
IR|Şiraz|Fars|29.59|52.58|Şirazi salatası~Shirazi salad~s~🥗~Domates, salatalık, soğan ve koruk suyu.
IN|Delhi|Kuzey Hindistan|28.61|77.21|Butter chicken~Butter chicken~a~🍗~1950'lerde Moti Mahal restoranında doğan kremalı tavuk.;Chole bhature~Chole bhature~k~🫓~Nohut körisi ve kabarık kızarmış ekmek.
IN|Mumbai|Maharaştra|19.08|72.88|Vada pav~Vada pav~s~🍔~Baharatlı patates köftesi sandviçi; Mumbai'nin sokak yıldızı.;Pav bhaji~Pav bhaji~s~🍛~Tereyağlı sebze püresi ve yumuşak ekmek.
IN|Haydarabad|Telangana|17.39|78.49|Haydarabad biryanisi~Hyderabadi biryani~a~🍛~Çiğ marine etle dum usulü pişen biryani.
IN|Kalküta|Batı Bengal|22.57|88.36|Rasgulla~Rasgulla~t~⚪~Şerbette pişen süzme peynir topları.
IN|Chennai|Tamil Nadu|13.08|80.27|Masala dosa~Masala dosa~k~🥞~Patatesli ince pirinç krebi; sambar ve chutney ile.;İdli~Idli~k~⚪~Buharda pişen pirinç-mercimek keki.
CN|Pekin|Kuzey Çin|39.90|116.41|Pekin ördeği~Peking duck~a~🦆~Çıtır derili fırın ördeği; krep ve hoisin ile.;Jiaozi~Jiaozi~s~🥟~Ay Yeni Yılı'nın mantısı.
CN|Şanghay|Doğu Çin|31.23|121.47|Xiaolongbao~Xiaolongbao~s~🥟~İçinde çorba olan buharda mantı.
CN|Chengdu|Sichuan|30.57|104.07|Mapo tofu~Mapo tofu~a~🌶️~Sichuan biberli acılı tofu.;Kung Pao tavuk~Kung Pao chicken~a~🍗~Yer fıstıklı acılı tavuk.
CN|Guangzhou|Kanton|23.13|113.26|Dim sum~Dim sum~s~🥟~Çayla yenen küçük porsiyonlar.;Char siu~Char siu~a~🍖~Ballı Kanton usulü rosto.
CN|Xi'an|Shaanxi|34.34|108.94|Roujiamo~Roujiamo~s~🍔~Yahni et ekmek arası; "Çin hamburgeri".;Biangbiang erişte~Biangbiang noodles~a~🍜~Kemer kadar geniş, elde çekilmiş erişte.
JP|Tokyo|Kanto|35.68|139.69|Edomae suşi~Sushi~a~🍣~Tokyo körfezinin balıklarıyla doğan nigiri.;Tempura~Tempura~a~🍤~Hafif hamurlu çıtır kızartma.
JP|Osaka|Kansai|34.69|135.50|Takoyaki~Takoyaki~s~🐙~Ahtapotlu top şeklinde kızartma.;Okonomiyaki~Okonomiyaki~a~🥞~Lahanalı, tavada pişen Japon pankeki.
JP|Kyoto|Kansai|35.01|135.77|Kaiseki~Kaiseki~a~🍱~Mevsimlik, çok tabaklı geleneksel menü.;Yudofu~Yudofu~a~🍲~Kombu suyunda yumuşak tofu.
JP|Sapporo|Hokkaido|43.06|141.35|Miso ramen~Ramen~a~🍜~Miso çorbalı, tereyağı ve mısırlı ramen.
KR|Seul|Sudogwon|37.57|126.98|Tteokbokki~Tteokbokki~s~🌶️~Acı soslu pirinç keki.;Samgyeopsal~Samgyeopsal~a~🥓~Masada ızgara edilen domuz göğsü.
KR|Busan|Gyeongsang|35.18|129.08|Dwaeji gukbap~Dwaeji gukbap~a~🍲~Pilavlı domuz eti çorbası.;Hotteok~Hotteok~t~🥞~Esmer şeker ve tohum dolgulu tatlı krep.
KR|Jeonju|Jeolla|35.82|127.15|Bibimbap~Bibimbap~a~🍚~Pilav üzerinde sebze, et, yumurta ve gochujang.
KR|Chuncheon|Gangwon|37.88|127.73|Dakgalbi~Dak-galbi~a~🍗~Acı soslu tavada tavuk ve sebze.
TH|Bangkok|Orta Tayland|13.76|100.50|Pad thai~Pad thai~a~🍜~Demirhindi soslu kızarmış pirinç eriştesi.;Tom yum~Tom yum~a~🍲~Ekşi-acı karides çorbası.;Mangolu yapışkan pirinç~Mango sticky rice~t~🥭~Hindistan cevizi sütlü yapışkan pirinç ve mango.
TH|Chiang Mai|Kuzey Tayland|18.79|98.98|Khao soi~Khao soi~a~🍜~Köri çorbalı, üstü çıtır erişteli yemek.;Sai ua~Sai ua~s~🌭~Limon otlu baharatlı kuzey sucuğu.
VN|Hanoi|Kuzey Vietnam|21.03|105.85|Phở~Pho~a~🍜~Sığır suyu ve pirinç eriştesi.;Bún chả~Bún chả~a~🍜~Izgara domuz köftesi ve soğuk erişte.
VN|Ho Chi Minh|Güney Vietnam|10.82|106.63|Bánh mì~Bánh mì~s~🥖~Fransız baget içinde Vietnam dolgusu.;Cơm tấm~Cơm tấm~a~🍚~Kırık pirinç ve ızgara pirzola.
VN|Huế|Orta Vietnam|16.46|107.59|Bún bò Huế~Bún bò Huế~a~🍜~Limon otlu acılı sığır erişte çorbası.
VN|Hội An|Orta Vietnam|15.88|108.33|Cao lầu~Cao lầu~a~🍜~Yalnız Hội An'da yapılan kalın erişte.
ID|Padang|Batı Sumatra|-0.95|100.35|Rendang~Rendang~a~🍛~Hindistan cevizi sütünde saatlerce pişen et.
ID|Jakarta|Java|-6.21|106.85|Nasi goreng~Nasi goreng~a~🍳~Tatlı soya soslu kızarmış pilav, üstünde yumurta.
ID|Bali|Bali|-8.65|115.22|Babi guling~Babi guling~a~🐖~Baharatla doldurulmuş bütün domuz çevirme.
ID|Yogyakarta|Java|-7.80|110.36|Gudeg~Gudeg~a~🍛~Hindistan cevizi sütü ve hurma şekerinde genç jackfruit.
MY|Kuala Lumpur|Selangor|3.14|101.69|Nasi lemak~Nasi lemak~k~🍚~Hindistan cevizi sütlü pilav, sambal ve hamsi.
MY|Penang|Penang|5.41|100.33|Char kway teow~Char kway teow~a~🍜~Karidesli yassı pirinç eriştesi.;Penang laksa~Laksa~a~🍲~Demirhindili ekşi balık çorbası ve erişte.
LB|Beyrut|Beyrut|33.89|35.50|Tabule~Tabbouleh~s~🥗~Bol maydanozlu limonlu bulgur salatası.;Humus~Hummus~s~🫘~Nohut, tahin ve limon ezmesi.
LB|Trablus|Kuzey Lübnan|34.44|35.83|Halawet el jibn~Halawet el jibn~t~🧀~Peynirli irmik ruloları, kaymak ve şerbetle.
LB|Zahle|Bekaa|33.85|35.90|Meze sofrası~Meze~s~🫒~Bardouni nehri kıyısında meze sofraları.
IT|Roma|Lazio|41.90|12.50|Carbonara~Carbonara~a~🍝~Yumurta, guanciale ve pecorino; krema yok.;Cacio e pepe~Cacio e pepe~a~🍝~Pecorino peyniri ve karabiberli makarna.
IT|Napoli|Campania|40.85|14.27|Pizza Margherita~Pizza Margherita~a~🍕~Domates, mozzarella ve fesleğen; odun fırınında.;Sfogliatella~Sfogliatella~t~🥐~Kat kat, ricottalı deniz kabuğu şeklinde hamur.
IT|Bologna|Emilia-Romagna|44.49|11.34|Tagliatelle al ragù~Bolognese sauce~a~🍝~Gerçek "bolonez": ağır pişen etli sos.;Lazanya~Lasagna~a~🍝~Kat kat hamur, ragù ve beşamel.
IT|Milano|Lombardiya|45.46|9.19|Risotto alla milanese~Risotto alla milanese~a~🍚~Safranlı altın sarısı risotto.;Ossobuco~Ossobuco~a~🍖~Kemik iliğiyle pişen dana incik.
IT|Palermo|Sicilya|38.12|13.36|Arancini~Arancini~s~🍙~İçi dolu kızarmış pirinç topları.;Cannoli~Cannoli~t~🥐~Ricotta kremalı çıtır rulo.
IT|Floransa|Toskana|43.77|11.26|Bistecca alla fiorentina~Bistecca alla fiorentina~a~🥩~Kalın kesilmiş, közde pişen T-kemik biftek.
FR|Paris|Île-de-France|48.86|2.35|Kruvasan~Croissant~k~🥐~Tereyağlı, kat kat çıtır çörek.;Soğan çorbası~French onion soup~a~🧅~Karamelize soğan ve gratine peynirli çorba.
FR|Lyon|Auvergne-Rhône-Alpes|45.76|4.84|Quenelle~Quenelle~a~🐟~Kremalı sosta pişen hafif balık köftesi.
FR|Marsilya|Provence|43.30|5.37|Bouillabaisse~Bouillabaisse~a~🐟~Safranlı Akdeniz balık çorbası.
FR|Nice|Côte d'Azur|43.70|7.27|Salade niçoise~Salade niçoise~s~🥗~Ton balığı, yumurta, zeytin ve domatesli salata.;Socca~Socca~s~🫓~Nohut unundan ince fırın krep.
FR|Strazburg|Alsas|48.57|7.75|Choucroute garnie~Choucroute garnie~a~🥬~Lahana turşusu, sucuk ve etlerle.;Tarte flambée~Tarte flambée~s~🍕~İnce hamur, krema, soğan ve pastırma.
FR|Rennes|Bretanya|48.11|-1.68|Galette~Galette~a~🥞~Karabuğday unlu tuzlu krep.;Krep~Crêpe~t~🥞~İnce tatlı krep.
ES|Valensiya|Valensiya|39.47|-0.38|Paella~Paella~a~🥘~Tavuk, fasulye ve safranla geniş tavada pilav.
ES|Madrid|Madrid|40.42|-3.70|Cocido madrileño~Cocido madrileño~a~🍲~Nohut, et ve sebzeli kış yahnisi.;Çikolatalı churros~Churro~t~🍫~Koyu sıcak çikolataya batırılan churros.
ES|Sevilla|Endülüs|37.39|-5.98|Gazpacho~Gazpacho~s~🍅~Soğuk domates çorbası.
ES|Barselona|Katalonya|41.39|2.17|Pa amb tomàquet~Pa amb tomàquet~k~🍅~Domates sürülmüş zeytinyağlı ekmek.;Crema catalana~Crema catalana~t~🍮~Üstü karamelize krema.
ES|San Sebastián|Bask Ülkesi|43.32|-1.98|Pintxos~Pincho~s~🍢~Kürdana dizilmiş küçük ekmek üstü lezzetler.
PT|Lizbon|Lizbon|38.72|-9.14|Pastel de nata~Pastel de nata~t~🥧~Belém'in yumurtalı tartı.;Bacalhau à Brás~Bacalhau à Brás~a~🐟~Morina, kibrit patates ve yumurta.
PT|Porto|Kuzey|41.15|-8.61|Francesinha~Francesinha~a~🥪~Etli, peynirli, bira soslu dev sandviç.
PT|Faro|Algarve|37.02|-7.93|Cataplana~Cataplana~a~🦐~Bakır kapta deniz ürünleri yahnisi.
GR|Atina|Attika|37.98|23.73|Suvlaki~Souvlaki~s~🍢~Şişte ızgara et, pide ve tzatziki.;Musakka~Moussaka~a~🍆~Patlıcan, kıyma ve beşamel.
GR|Selanik|Makedonya|40.64|22.94|Bougatsa~Bougatsa~k~🥧~İrmik kremalı çıtır yufka; kahvaltılık.
GR|Kandiye|Girit|35.34|25.13|Dakos~Dakos~s~🍅~Arpa peksimeti, domates ve mizithra peyniri.
DE|Berlin|Berlin|52.52|13.40|Currywurst~Currywurst~s~🌭~Köri soslu sosis; 1949'dan beri Berlin klasiği.;Döner~Doner kebab~s~🥙~Berlin'de Türk göçmenlerin yaygınlaştırdığı sokak lezzeti.
DE|Münih|Bavyera|48.14|11.58|Weißwurst~Weisswurst~k~🌭~Beyaz sosis, tatlı hardal ve brezel.;Brezel~Pretzel~s~🥨~Düğüm şeklinde tuzlu ekmek.
DE|Hamburg|Hamburg|53.55|9.99|Labskaus~Labskaus~a~🥩~Denizcilerin konserve et ve patates püresi.;Franzbrötchen~Franzbrötchen~t~🥐~Tarçınlı tereyağlı çörek.
DE|Nürnberg|Bavyera|49.45|11.08|Nürnberg sosisi~Nürnberger Rostbratwurst~a~🌭~Parmak boyunda ızgara sosis.;Lebkuchen~Lebkuchen~t~🍪~Baharatlı Noel kurabiyesi.
GB|Londra|İngiltere|51.51|-0.13|Fish and chips~Fish and chips~a~🐟~Kızarmış balık ve patates.;Pie and mash~Pie and mash~a~🥧~Etli turta, patates püresi ve maydanoz sosu.
GB|Edinburgh|İskoçya|55.95|-3.19|Haggis~Haggis~a~🍖~Baharatlı sakatat ve yulaf; şalgam ve patatesle.
GB|Cornwall|İngiltere|50.26|-5.05|Cornish pasty~Pasty~s~🥟~Et ve sebzeli yarım ay börek.;Cream tea~Cream tea~t~🍰~Scone, kaymak ve reçel.
GB|Birmingham|İngiltere|52.49|-1.89|Balti~Balti (food)~a~🍛~Çelik kapta hızla pişen köri.
RU|Moskova|Merkez|55.76|37.62|Blini~Blini~k~🥞~Havyar ya da ekşi kremayla ince krep.;Olivier salatası~Olivier salad~s~🥗~Moskova'da şef Lucien Olivier'nin salatası.
RU|St. Petersburg|Kuzeybatı|59.93|30.34|Beef Stroganoff~Beef Stroganoff~a~🥩~Ekşi kremalı soslu ince dilim et.
RU|Kazan|Tataristan|55.80|49.11|Çak-çak~Chak-chak~t~🍯~Ballı hamur kızartması; Tatar düğünlerinin tatlısı.;Eçpoçmak~Echpochmak~s~🥟~Etli, patatesli üçgen börek.
UA|Kiev|Merkez|50.45|30.52|Tavuk Kiev~Chicken Kiev~a~🍗~İçi tereyağlı pane tavuk.;Kiev pastası~Kyiv cake~t~🍰~Bezeli fındıklı pasta.
UA|Lviv|Batı|49.84|24.03|Lviv sırnıkı~Syrniki~t~🍰~Lor peynirli kek.
UA|Odessa|Güney|46.48|30.72|Forşmak~Forshmak~s~🐟~Ringa balığı ezmesi.
PL|Krakov|Küçük Polonya|50.06|19.94|Obwarzanek~Obwarzanek krakowski~s~🥯~Haşlanıp fırınlanan halka ekmek.;Pierogi~Pierogi~a~🥟~Peynirli patatesli hamur bohçaları.
PL|Varşova|Mazovya|52.23|21.01|Zapiekanka~Zapiekanka~s~🥖~Mantarlı peynirli yarım baget.
PL|Gdańsk|Pomeranya|54.35|18.65|Żurek~Żurek~a~🍲~Ekşi mayalı çavdar çorbası.
HU|Budapeşte|Orta Macaristan|47.50|19.04|Gulaş~Goulash~a~🍲~Kırmızı biberli et çorbası.;Lángos~Lángos~s~🫓~Kızarmış hamur, ekşi krema ve peynir.;Dobos pastası~Dobos torte~t~🍰~Karamel kaplı katlı pasta.
HU|Segedin|Güney Ova|46.25|20.15|Halászlé~Halászlé~a~🐟~Bol biberli balıkçı çorbası.
US|New York|Kuzeydoğu|40.71|-74.01|New York pizzası~New York–style pizza~a~🍕~İnce, katlanarak yenen dev dilimler.;Bagel~Bagel~k~🥯~Krem peynir ve füme somonla.;Cheesecake~Cheesecake~t~🍰~Yoğun krem peynirli pasta.
US|New Orleans|Louisiana|29.95|-90.07|Gumbo~Gumbo~a~🍲~Bamyalı Creole yahnisi.;Beignet~Beignet~t~🍩~Pudra şekerli kızarmış hamur.;Jambalaya~Jambalaya~a~🍛~Sosisli, karidesli baharatlı pilav.
US|Chicago|Ortabatı|41.88|-87.63|Deep-dish pizza~Chicago-style pizza~a~🍕~Derin tavada kalın pizza.;Chicago hot dog~Chicago-style hot dog~s~🌭~Turşu, domates ve hardallı sosisli.
US|Austin|Teksas|30.27|-97.74|Brisket~Brisket~a~🍖~Saatlerce tütsülenen sığır döş.;Chili con carne~Chili con carne~a~🌶️~Acılı etli fasulye yahnisi.
US|San Francisco|Kaliforniya|37.77|-122.42|Clam chowder~Clam chowder~a~🥣~Ekşi mayalı ekmek kâsesinde deniz tarağı çorbası.
US|Philadelphia|Pensilvanya|39.95|-75.17|Cheesesteak~Cheesesteak~s~🥪~İnce dilim biftek ve eritilmiş peynir.
CA|Montreal|Quebec|45.50|-73.57|Poutine~Poutine~s~🍟~Patates kızartması, peynir parçaları ve sos.;Montreal bagel~Montreal-style bagel~k~🥯~Ballı suda haşlanıp odun fırınında pişer.
CA|Toronto|Ontario|43.65|-79.38|Peameal bacon sandviçi~Peameal bacon~s~🥓~Mısır unu kaplı domuz filetosu sandviçi.;Butter tart~Butter tart~t~🥧~Tereyağlı şekerli tartolet.
CA|Halifax|Nova Scotia|44.65|-63.57|Donair~Donair~s~🥙~Tatlı soslu döner.;Lobster roll~Lobster roll~s~🦞~Istakozlu sandviç.
MX|Mexico City|Mexico City|19.43|-99.13|Tacos al pastor~Al pastor~s~🌮~Ananaslı, biberli döner taco.
MX|Puebla|Puebla|19.04|-98.21|Mole poblano~Mole poblano~a~🍫~Çikolata ve biberli koyu sos.;Chiles en nogada~Chiles en nogada~a~🌶️~Cevizli kremalı dolma biber; bayrak renklerinde.
MX|Oaxaca|Oaxaca|17.07|-96.73|Tlayuda~Tlayuda~s~🫓~Dev çıtır tortilla, fasulye ve peynir.;Mole negro~Mole (sauce)~a~🍫~Siyah biberli, çikolatalı mole.
MX|Mérida|Yucatán|20.97|-89.62|Cochinita pibil~Cochinita pibil~a~🐖~Achiote ve portakalla toprak altında pişen domuz.
MX|Guadalajara|Jalisco|20.67|-103.35|Birria~Birria~a~🍲~Biberli keçi ya da dana yahnisi.;Torta ahogada~Torta ahogada~s~🥖~Acı sosa "boğulmuş" sandviç.
BR|Rio de Janeiro|Güneydoğu|-22.91|-43.17|Feijoada~Feijoada~a~🫘~Siyah fasulye ve domuz etleri; cumartesi yemeği.
BR|Salvador|Bahia|-12.97|-38.50|Acarajé~Acarajé~s~🧆~Börülce köftesi, karides dolgulu.;Moqueca~Moqueca~a~🐟~Hindistan cevizi sütlü balık yahnisi.
BR|Belo Horizonte|Minas Gerais|-19.92|-43.94|Pão de queijo~Pão de queijo~k~🧀~Manyok nişastalı peynirli çörek.
BR|São Paulo|São Paulo|-23.55|-46.63|Pastel~Pastel (food)~s~🥟~Pazar yerlerinin çıtır kızartma böreği.
AR|Buenos Aires|Buenos Aires|-34.60|-58.38|Asado~Asado~a~🥩~Közde ağır ağır pişen etler.;Milanesa~Milanesa~a~🥩~Pane edilmiş ince et.;Dulce de leche~Dulce de leche~t~🍯~Karamelize süt reçeli.
AR|Salta|Kuzeybatı|-24.78|-65.41|Salteña empanada~Empanada~s~🥟~Sulu etli küçük empanada.;Locro~Locro~a~🍲~Mısır, fasulye ve etle bayram yahnisi.
PE|Lima|Kıyı|-12.05|-77.04|Ceviche~Ceviche~s~🐟~Limonda "pişen" çiğ balık.;Lomo saltado~Lomo saltado~a~🥩~Soya soslu sote et ve patates.
PE|Arequipa|Güney|-16.41|-71.54|Rocoto relleno~Rocoto relleno~a~🌶️~Etli dolma rocoto biberi.
PE|Cusco|And Dağları|-13.53|-71.97|Cuy al horno~Guinea pig as food~a~🍖~And Dağları'nın geleneksel fırın yemeği.
MA|Marakeş|Marakeş-Safi|31.63|-8.00|Tanjia~Tanjia~a~🍲~Testide hamamın küllerinde pişen et.
MA|Fes|Fes-Meknes|34.03|-5.00|Pastilla~Pastilla~a~🥧~Tarçınlı, bademli tatlı-tuzlu börek.
MA|Kazablanka|Kazablanka-Settat|33.57|-7.59|Cuma kuskusu~Couscous~a~🍲~Cuma günleri ailece yenen kuskus.;Harira~Harira~a~🍲~Ramazan iftarının çorbası.
EG|Kahire|Kahire|30.04|31.24|Koşari~Koshary~a~🍝~Pirinç, mercimek, makarna ve domates sosu.;Ümmü Ali~Umm Ali~t~🥧~Sütlü, kuruyemişli hamur tatlısı.
EG|İskenderiye|Akdeniz kıyısı|31.20|29.92|Sayadeya~Sayadieh~a~🐟~Karamelize soğanlı balıklı pilav.
EG|Luksor|Yukarı Mısır|25.69|32.64|Taamiya~Falafel~s~🧆~Bakla ile yapılan Mısır falafeli.
ET|Addis Ababa|Merkez|9.03|38.74|Doro wat~Doro wat~a~🍗~Berbere soslu tavuk ve yumurta; injera ile.;Kitfo~Kitfo~a~🥩~Baharatlı tereyağında kıyılmış çiğ et.
ET|Gondar|Amhara|12.60|37.47|Shiro~Shiro (food)~a~🫘~Nohut unundan baharatlı yahni.
ZA|Cape Town|Batı Cape|-33.92|18.42|Bobotie~Bobotie~a~🥧~Baharatlı kıyma, yumurtalı krema.;Koeksister~Koeksister~t~🥨~Şerbetli örgü hamur kızartması.
ZA|Durban|KwaZulu-Natal|-29.86|31.02|Bunny chow~Bunny chow~a~🍞~Oyulmuş ekmek içinde köri.
ZA|Johannesburg|Gauteng|-26.20|28.05|Boerewors~Boerewors~a~🌭~Mangalda pişen spiral sucuk.;Pap en vleis~Pap (food)~a~🌽~Mısır lapası ve ızgara et.
AU|Sidney|Yeni Güney Galler|-33.87|151.21|Meat pie~Meat pie~s~🥧~Kıymalı tek kişilik turta.;Pavlova~Pavlova (food)~t~🍰~Meyveli beze pasta.
AU|Melbourne|Victoria|-37.81|144.96|Vegemite tost~Vegemite~k~🍞~1922'de Melbourne'de icat edilen maya ezmesi.;Lamington~Lamington~t~🍰~Çikolata ve hindistan cevizi kaplı kek.
AU|Adelaide|Güney Avustralya|-34.93|138.60|Pie floater~Pie floater~s~🥧~Bezelye çorbasında yüzen et turtası.
`;
const CITIES = [];
const CITY_DISHES = [];
CITIES_RAW.trim().split('\n').forEach((line, ci) => {
  const [code, name, region, lat, lon, dishes] = line.split('|');
  const city = { id: 'ct' + ci, code, name, region, lat: +lat, lon: +lon, dishes: [] };
  dishes.split(/;(?=[^;~]+~)/).forEach((d, di) => {
    const [dn, wiki, cat, emoji, desc] = d.split('~');
    const dish = { id: city.id + 'd' + di, name: dn, wiki, cat, emoji, desc, city: city.id, code };
    city.dishes.push(dish); CITY_DISHES.push(dish);
  });
  CITIES.push(city);
});
const CITIES_BY_CODE = {};
CITIES.forEach(c => (CITIES_BY_CODE[c.code] = CITIES_BY_CODE[c.code] || []).push(c));
