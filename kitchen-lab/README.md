# World Bite · Kitchen Lab

Pişirme animasyonu için ayrı test uygulaması. Burada istediğimiz sonucu aldıktan sonra World Bite'a entegre edilecek.

- Gerçek zamanlı 3D sahne (three.js r170): PBR ışık, gölgeler, sinematik kamera (telefoto çerçeveleme, el kamerası salınımı, film greni, vinyet)
- Her şey koddan üretiliyor: modeller, dokular, sesler (WebAudio). İnternet gerekmez.
- İlk tarif: Çilekli vanilyalı kek, 14 adım
- İki mod: **Film gibi izle** (otomatik) ve **Kendin yap** (dokun, kaydırarak dök, basılı tutarak çırp, eleği salla, daire çizerek karıştır)

APK, `kitchen-lab/` değiştiğinde GitHub Actions'ta ayrı derlenir (`lab-v0.*` sürümleri, paket adı `com.worldbite.kitchenlab`), World Bite'ın üzerine yazmaz.

Test için tarayıcıda: `?speed=3` (hızlı) ve `?from=9` (önceki adımları hızlı geç).
