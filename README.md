<p align="center"><img src="icon-512.png" width="140" alt="World Bite"></p>
<h1 align="center">World Bite</h1>
<p align="center"><b>Travel, taste & discover</b> — dünyanın mutfağı tek uygulamada.</p>

## 📱 APK'yı indir

**[Releases](../../releases/latest)** sayfasından en son `WorldBite.apk` dosyasını indir, telefonda aç ve yükle
(gerekirse "bilinmeyen kaynaklardan yüklemeye izin ver"). Repoya her push'ta GitHub Actions yeni bir APK derler.

## Özellikler

| Ekran | İçerik |
|---|---|
| Açılış | 3 saniyelik animasyon: küre döner, uçak ters yönde döner, **WORLD BITE** harf harf belirir |
| Tanıtım | 4 adımlı tanıtım (kaydırılabilir) |
| Giriş | Giriş yap / Hesap oluştur · Gmail · Facebook · e-posta (demo: bilgiler cihazda saklanır) |
| Keşfet | Liste / Harita seçici, ülke-şehir-yemek-malzeme araması, sıralama (A-Z, kıta, popüler, kalori, süre), günlük/haftalık popüler, 196 ülke |
| Dünya haritası | İnternetsiz; ülke seçilince kırmızıya döner, kamera ülkeye uçar, şehirler belirir; şehre dokununca meşhur yemekleri (37 ülke, 138 şehir, 232 yemek) |
| Şef karakterleri | Leyla nənə, Şef Aylin, Zeynep teyze — yaşa, yemeğe göre ya da rastgele |
| Ülke sayfası | İmza yemek, fotoğraf, güçlü olduğu alan (kahvaltı / ana yemek / ara sıcak / tatlı), hikaye, açıklama |
| Seyahat | Önce konum izni; yakındaki restoranlar uygulama içinde liste + vektör harita (MapLibre/OpenFreeMap). Gemini anahtarı varsa Google Haritalar puan ve yorumlarıyla. Tüm aramalar telefonda saklanır |
| Pişirme oyunu | Şef karakterli oyun modu: malzemeleri sürükle-bırak, yumurtayı zamanında kır, daire çizerek çırp, ritimle doğra, yoğur/aç, ateşi yeşil bölgede tut, fırın kadranını ayarla, süsle; adım başına 1-3 yıldız, rütbeler (Çırak → Büyük Şef), ses efektleri |
| Akşam menüsü | Ana yemek + salata/tatlı; bekleme sürelerine göre birleşik zaman çizelgesi (fırın çakışması kontrolü), eşzamanlı sayaçlarla birlikte pişirme |
| İçecek eşleştirme | Damak tadı soruları + yemeğe göre 30 içecek; alkollü öneriler sadece 18+ ve helal tercihi kapalıyken |
| Buzdolabı fotoğrafı | Kamera ya da galeriden foto → Gemini malzemeleri tanır → Elimdekiler'e eklenir |
| Pasaport & kostümler | Pişirilen ülkelere damga, haritada yeşil; kıta/ülke sayısına göre şef aksesuarları; günün görevi ve seri |
| Sesli asistan | Adımları sesli okur; "sonraki / geri / tekrar / zamanlayıcı / dur" komutları (TR, AZ, EN, RU) |
| Mutfak animasyonu | Her tarif için: malzemeler kaba uçar ve listeden çıkar, yumurta kırma, çırpma, doğrama, kızartma, kaynatma, fırın; kıvam bilgisi, süre ve zamanlayıcı, atla, servis sunumu, kamerada "masada gör" |
| Elimdekiler | Görselli malzeme seçici (160 ürün, 7 kategori, 4 dil, yazınca öneri), eşleşen tarifler (% eşleşme, eksikler) + Gemini ile özel tarif |
| Porsiyon & alışveriş | Kişi sayısına göre miktarlar yeniden hesaplanır; eksikler tek dokunuşla Listem → Alışveriş'e, kategorilere göre |
| Beslenme filtreleri | Vejetaryen, vegan, glütensiz, helal uyumlu, laktozsuz — malzemelerden otomatik etiket, uyarılar |
| Besin değerleri | Tüm yemeklerde porsiyon başına kcal, protein, karbonhidrat, yağ (malzemelerden tahmini) |
| Listem | Kaydedilen tarifler/yemekler ve restoranlar ayrı ayrı |
| Ayarlar | Tema rengi (8 hazır + özel renk), koyu mod, dil (TR / AZ / EN / RU), çıkış |

## Kendi fotoğraflarını eklemek

Fotoğrafları `app/src/main/assets/www/photos/` klasörüne koy ve `photos/photos.js` içinde eşleştir:

```js
const LOCAL_PHOTOS = { "AZ": "photos/AZ.jpg", "az-dessert": "photos/pakhlava.webp" };
```

Anahtar ülke kodu (`AZ`, `TR`…) ya da tarif kimliğidir (`az-main`, `tr-dessert`…). `.gif`/`.webp` animasyonları da çalışır.
Eşleşme yoksa uygulama Wikipedia'daki serbest lisanslı fotoğrafı gösterir.

## Proje yapısı

```
app/src/main/assets/www/   → uygulamanın arayüzü (HTML/CSS/JS)
  js/data.js               → 196 ülke: imza yemek, kategori, hikaye
  js/recipes.js            → adım adım tarifler (yeni tarif buraya)
  js/i18n.js               → dil metinleri
app/src/main/java/...      → Android WebView kabuğu
.github/workflows/         → APK derleme
```

## Gemini (isteğe bağlı)

Uygulamada **Ayarlar → Gemini** bölümüne [Google AI Studio](https://aistudio.google.com/apikey) anahtarını gir. Anahtar yalnızca telefonda saklanır; APK'nın içine gömülmez.

## Veri kaynakları

Fotoğraf ve açıklamalar: Wikipedia (CC BY-SA) · Restoranlar: OpenStreetMap katkıcıları (Overpass, Nominatim) · Harita: CARTO

## Notlar (demo)

- Hesaplar yalnızca cihazda tutulur; gerçek Gmail/Facebook girişi için Firebase Auth gerekir.
- Popüler liste topluluk beğenilerini simüle eder; gerçek sıralama için sunucu gerekir.
- Restoran puanları için Google Places API anahtarı eklenmelidir.
- `app/demo-keystore.jks` yalnızca demo içindir; Google Play'e çıkmadan önce gizli bir anahtar kullanın.
