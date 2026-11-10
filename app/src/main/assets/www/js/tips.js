/* Consistency / doneness cues for a recipe step ("kıvam, püf noktası").
   Specific cues are chosen by what the step does AND what it is done to (onion vs. meat vs. rice…);
   a phrase already in the step ("…pembeleşene kadar") is kept as the main cue.
   Recipe text is TR (also shown for AZ) or EN (also shown for RU), so cues are TR / EN. */
const Tips = (() => {
  const low = s => String(s || '').toLocaleLowerCase('tr');
  // [action regex (or null = any), subject regex, tr, en]
  const T = [
    [/kavur|kızart|sotele|fry|sauté|saute|soften/, /soğan|onion|shallot/,
      'Soğan orta ateşte şeffaflaşıp kenarları hafif pembeleşene kadar (5-7 dk) kavrulmalı; yanarsa yemeğe acılık verir.',
      'Cook the onion over medium heat until translucent with lightly golden edges (5-7 min); burnt onion turns the dish bitter.'],
    [/kavur|kızart|sotele|ekle|fry|sauté|add/, /sarımsa|garlic/,
      'Sarımsak çok çabuk yanar: kokusu çıkar çıkmaz (30-60 sn) diğer malzemeyi ekleyin.',
      'Garlic burns fast: as soon as it smells fragrant (30-60 sec) add the next ingredient.'],
    [/kavur|kızart|fry|brown|cook/, /kıyma|mince|ground (beef|meat|lamb)/,
      'Kıymayı kaşıkla ezerek kavurun ki topaklanmasın; önce suyunu salar, suyunu tamamen çekip tane tane olunca hazırdır.',
      'Break the mince up with a spoon so it doesn\'t clump; it releases liquid first — it\'s ready when that liquid is gone and it\'s crumbly and browned.'],
    [/mühürle|kızart|kavur|sear|brown|fry/, /\bet\b|eti\b|kuşbaşı|dana|kuzu|biftek|beef|lamb|steak|meat/,
      'Tavayı iyice kızdırın ve eti kalabalık etmeden koyun; önce suyunu salar, suyunu çekip dibi kızarınca çevirin. Erken karıştırırsanız haşlanır.',
      'Get the pan really hot and don\'t crowd it; the meat lets out juice first — turn it only once that is gone and the underside has browned, or it will stew.'],
    [/./, /tavu[kğ]|piliç|chicken/,
      'Tavuğun içi pembe kalmamalı: en kalın yerini kestiğinizde suyu berrak akmalı (iç ısı 74°C).',
      'No pink should remain: cut into the thickest part — the juices must run clear (74°C inside).'],
    [/./, /balı[kğ]|levrek|somon|fish|salmon|cod/,
      'Balığı az çevirin; eti şeffaflıktan beyaza döndüğünde ve çatalla kolayca lif lif ayrıldığında pişmiştir.',
      'Turn the fish as little as possible; it\'s done when the flesh turns from translucent to opaque and flakes easily with a fork.'],
    [/./, /karides|shrimp|prawn/,
      'Karides pembeleşip "C" şeklini alınca hazır; "O" şekline gelirse fazla pişmiştir ve lastikleşir.',
      'Prawns are done when pink and curled into a "C"; a tight "O" means overcooked and rubbery.'],
    [/yıka|ıslat|rinse|soak|wash/, /pirin|rice|bulgur/,
      'Taneleri suyu berraklaşana kadar 3-4 kez yıkayın; nişastası gidince pilav lapa olmaz.',
      'Rinse 3-4 times until the water runs clear; washing off the starch keeps the grains separate.'],
    [/./, /pirin|rice|pilav/,
      'Su çekilince yüzeyde küçük delikler oluşur. Ocağı kapatıp kapağın altına kâğıt havlu koyarak 10 dk demlendirin; bu sırada karıştırmayın.',
      'When the water is absorbed, small holes appear on the surface. Turn off the heat and let it steam 10 min with a towel under the lid — don\'t stir.'],
    [/./, /bulgur/,
      'Bulgur suyunu tamamen çekmeli, taneler dağılmadan yumuşamalı; kapağı kapalı 10 dk demlendirin.',
      'The bulgur should absorb all the water and turn tender without going mushy; let it rest covered for 10 min.'],
    [/./, /makarna|erişte|spagetti|pasta|noodle|spaghetti/,
      'Bol ve tuzlu kaynar suda pişirin; ısırınca ortası hafif dirençli (al dente) olmalı. Süzmeden önce bir bardak haşlama suyunu ayırın.',
      'Cook in plenty of well-salted boiling water; it should be al dente, with a slight bite. Save a cup of the cooking water before draining.'],
    [/./, /mercime[kğ]|lentil/,
      'Mercimek tamamen dağılıp çorba kaşığı kaplayacak kıvama gelince hazırdır; çok koyulaşırsa sıcak su ekleyin.',
      'The lentils are ready when they have fallen apart and the soup coats a spoon; thin with hot water if it gets too thick.'],
    [/./, /fasulye|nohut|barbunya|bean|chickpea/,
      'Bir taneyi parmaklarınız arasında bastırın: kolayca ezilmeli. Tuzu pişmenin sonunda ekleyin, yoksa taneler sertleşir.',
      'Press one between your fingers: it should crush easily. Add salt at the end, or the beans stay hard.'],
    [/çırp|whisk|beat/, /yumurta akı|krema|whipping|egg white|cream/,
      'Sert tepe vermeli: kaseyi ters çevirdiğinizde akmamalı. Fazla çırparsanız krema tereyağına döner.',
      'Whip to stiff peaks: the bowl can be turned upside down without it sliding. Over-whipped cream turns to butter.'],
    [/çırp|whisk|beat/, /yumurta|egg/,
      'Sarısı ve akı tamamen birleşip hafif köpürene kadar çırpın; içinde akı ipliği kalmamalı.',
      'Beat until yolks and whites are fully combined and slightly frothy, with no streaks of white left.'],
    [/yoğur|knead/, /./,
      'Hamur ele yapışmamalı, pürüzsüz ve esnek olmalı (kulak memesi yumuşaklığında); parmakla bastırınca iz yavaşça geri dolmalı.',
      'The dough should be smooth, elastic and no longer sticky; a finger dent should slowly spring back.'],
    [/mayala|kabar|rise|prove|proof/, /./,
      'Ilık ve cereyansız bir yerde, üstü örtülü bekletin; hacmi iki katına çıkınca hazırdır.',
      'Leave covered in a warm, draught-free place until doubled in size.'],
    [/kavur|kızart|yağda|sotele|fry|sauté|saute/, /salça|tomato paste/,
      'Salçayı yağda 1-2 dk kavurun: çiğ kokusu gidip rengi koyulaşmalı, ama yanmamalı.',
      'Fry the paste in the oil for 1-2 min until it darkens and loses its raw smell — don\'t let it burn.'],
    [/kavur|roast|cook/, /\bun\b|unu|flour|roux/,
      'Unu sürekli karıştırarak kokusu çıkana ve rengi hafif dönene kadar kavurun; topak kalmamalı.',
      'Stir the flour constantly until it smells toasty and colours slightly, with no lumps.'],
    [/./, /muhallebi|sütlaç|puding|pudding|custard|krem/,
      'Sürekli karıştırın; kaşığın arkasını kaplayıp ilk kabarcıklar çıkınca 2-3 dk daha pişirin.',
      'Stir constantly; once it coats the back of a spoon and the first bubbles appear, cook 2-3 more minutes.'],
    [/şerbet|syrup/, /./,
      'Şerbetle tatlıdan biri sıcak, diğeri soğuk olmalı; ikisi de sıcaksa tatlı hamurlaşır.',
      'One of syrup and pastry must be hot, the other cool; if both are hot the pastry goes soggy.'],
    [/karamel|caramel/, /./,
      'Şekeri karıştırmadan eritin, tavayı hafifçe çevirin; amber rengini alınca hemen ocaktan alın.',
      'Melt the sugar without stirring, just swirl the pan; take it off the heat as soon as it turns amber.'],
    [/bol yağ|kızgın yağ|derin|deep|kızart/, /patates|köfte|falafel|potato|fritter|chips/,
      'Yağ 170-180°C olmalı: içine attığınız ekmek parçası 30 sn\'de kızarıyorsa hazırdır. Az az kızartın ki yağın ısısı düşmesin.',
      'The oil should be 170-180°C: a cube of bread browns in 30 sec. Fry in small batches so the oil stays hot.'],
    [/kızart|fry/, /patlıcan|eggplant|aubergine/,
      'Patlıcanın içi yumuşayıp kabuğu kahverengileşmeli; fazla yağını kâğıt havlu üzerinde süzdürün.',
      'The flesh should be soft and the skin browned; drain the excess oil on paper towels.'],
    [/./, /ıspanak|pazı|spinach|chard/,
      'Yapraklar birkaç dakikada söner; rengi canlı yeşil kalmalı, fazla pişirmeyin.',
      'The leaves wilt within minutes; keep them bright green — don\'t overcook.'],
    [/./, /çorba|soup/,
      'Çorba kaşığın arkasını hafifçe kaplayacak kıvamda olmalı; çok koyulaşırsa sıcak su ya da et suyu ekleyin.',
      'The soup should lightly coat the back of a spoon; thin with hot water or stock if too thick.'],
    [/fırın|bake|oven/, /kek|pasta\b|cake|muffin|brownie|kurabiye|cookie/,
      'Ortasına batırdığınız kürdan temiz çıkmalı. İlk 20 dakika fırın kapağını açmayın, yoksa söner.',
      'A toothpick in the centre should come out clean. Don\'t open the oven for the first 20 minutes or it will sink.'],
    [/fırın|bake|oven/, /ekme[kğ]|pide|bread|loaf/,
      'Üstü altın rengi olmalı; altına vurduğunuzda tok bir ses gelmeli.',
      'It should be golden on top and sound hollow when tapped underneath.'],
    [/marine|marinat/, /./,
      'Buzdolabında, üstü kapalı bekletin; ne kadar uzun beklerse o kadar yumuşak ve lezzetli olur.',
      'Keep covered in the fridge; the longer it marinates the more tender and flavourful it gets.'],
    [/sos|dressing|sosla/, /salata|salad|yeşillik|marul|lettuce/,
      'Sosu servisten hemen önce ekleyin ki yeşillikler pörsümesin.',
      'Dress the salad just before serving so the leaves stay crisp.'],
  ];
  // general cue per action (Kitchen.detect ids)
  const GEN = {
    tr: {
      chop: 'Parçalar eşit boyutta olmalı ki hepsi aynı sürede pişsin.', mix: 'Topak kalmayana ve malzemeler eşit dağılana kadar karıştırın.',
      whisk: 'Hafif, köpüklü ve tamamen homojen olmalı.', knead: 'Ele yapışmayan, esnek ve pürüzsüz bir hamur.', roll: 'Her yerde eşit kalınlıkta, yırtmadan açın.',
      fry: 'Yağ önce iyice ısınmalı: malzeme koyunca cızırdamalı. Kenarlar altın rengi olunca çevirin.', boil: 'Kaynamaya başlayınca ocağı kısın; yüzeyde hafif ama sürekli kabarcıklar olmalı.',
      bake: 'Fırın önceden ısıtılmış olmalı; üstü altın rengi alınca hazır.', grill: 'Izgara iyice kızgın olmalı; belirgin izler oluşmalı, içi sulu kalmalı.',
      steam: 'Kapak kapalı kalmalı, buhar kesilmemeli.', wrap: 'Harcı taşırmadan, eşit miktarda doldurun; sarılacaksa sıkı sarın ki pişerken açılmasın.', layer: 'Katlar eşit ve düz olmalı, kenarlara kadar yayın.',
      rest: 'Üstü örtülü bekletin; tatlar birbirine geçer, doku oturur.', garnish: 'Az ama dengeli; renk kontrastı oluşturun.', serve: 'Sıcak yemekleri ısıtılmış tabakta, hemen servis edin.',
    },
    en: {
      chop: 'Cut everything to the same size so it cooks evenly.', mix: 'Mix until there are no lumps and everything is evenly combined.',
      whisk: 'It should be light, frothy and completely smooth.', knead: 'A smooth, elastic dough that no longer sticks to your hands.', roll: 'Roll to an even thickness all over without tearing.',
      fry: 'Heat the oil first — it should sizzle when the food goes in. Turn once the edges are golden.', boil: 'Once it boils, lower the heat: gentle but steady bubbles on the surface.',
      bake: 'Always preheat the oven; it\'s ready when golden on top.', grill: 'The grill must be very hot: clear grill marks, still juicy inside.',
      steam: 'Keep the lid on and the steam going.', wrap: 'Fill evenly without overfilling; if rolling, roll tightly so it doesn\'t open while cooking.', layer: 'Keep the layers even and flat, right to the edges.',
      rest: 'Leave it covered; the flavours blend and the texture sets.', garnish: 'A little, but balanced; add some colour contrast.', serve: 'Serve hot dishes right away on warmed plates.',
    },
  };
  const CUE = /kadar|olunca|kıvam|gibi|rengi|pürüzsüz|çıtır|homojen|esnek|köpük|şeffaf|yumuşa|koyulaş|kabar|yüzeye|çekene|eriy|parlak|kalmalı|kalsın|until|golden|smooth|crisp|tender|thick|fluffy|bubbl|translucent|soft|opaque/;
  function forStep(text, rl) {
    const l = rl === 'tr' ? 'tr' : 'en', s = low(text);
    const K = typeof Kitchen !== 'undefined' ? Kitchen : null;
    const act = K ? K.detect(text).id : 'mix';
    const parts = String(text).split(/[,;]| ve (?=\p{L})| and (?=\p{L})/u).map(x => x.trim()).filter(Boolean);
    const said = parts.find(x => CUE.test(low(x)));
    const hit = T.find(([a, sub]) => (!a || a.test(s)) && sub.test(s));
    const tip = hit ? (l === 'tr' ? hit[2] : hit[3]) : GEN[l][act] || GEN[l].mix;
    return { act, cue: said ? said.charAt(0).toLocaleUpperCase(l) + said.slice(1) : '', tip, dur: K ? K.duration(text) : 0 };
  }
  return { forStep };
})();
