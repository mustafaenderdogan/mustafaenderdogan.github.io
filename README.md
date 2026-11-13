# mustafaenderdogan.github.io

Mustafa Ender Doğan — İş Analizi Portfolyosu. Statik site: HTML, CSS ve JavaScript; derleme adımı ve çerez yok. Sayfa görüntülemeleri çerezsiz bir sayaçla (GoatCounter) sayılır. GitHub Pages'te yayınlanmak üzere hazırlandı.

## İçerik

- `index.html`: kısa tanıtım, dört analiz çalışması, demolar, Lab, Hakkımda (deneyim, eğitim, uzmanlık) ve iletişim.
- `css/site.css` ve `js/site.js`: tüm sayfaların (demolar hariç) tek stil ve betik dosyası.
- `analiz/`: vaka sayfaları. Bankasürans vakası temsilidir; kurum adları ve veriler kurgusaldır.
- `surec-ve-yontem.html`: Scrum çalışma biçimi; örnekler temsilidir.
- `yolculuk.html`: kariyerin dört durakta görsel anlatımı (yalnız Türkçe). Sahne `yolculuk/sahne.html` içinde; ekrandaki metinler dosyanın başındaki `ICERIK` bloğunda.
- `hasarai/`, `buro/`, `isyonetim/`: analizleri sınamak için hazırlanmış demoların derlenmiş kopyaları. Kaynak kodları ayrı projelerde; veriler kurgusaldır.
- `blog/`: sigorta, yapay zekâ ve vaka yazıları (TR ve EN).
- `en/`: kısa İngilizce özet.

## Yerelde açmak

```
python -m http.server 8080 --bind 127.0.0.1
```

Ardından http://127.0.0.1:8080/ adresini açın. Sayfalar kök göreli yollar (`/css/...`) kullandığı için klasörü doğrudan dosya olarak açmak yerine yerel sunucu gerekir.

## Alan adı

canonical, og:url, paylaşım görseli, hreflang, JSON-LD, `sitemap.xml` ve `robots.txt` içindeki adres tek yerden yönetilir: `araclar/alan-adi.json`.

```
python araclar/alan-adi.py https://yeni-adres.com   # ayarı günceller ve tüm dosyalara uygular
python araclar/alan-adi.py --denetle                # yalnızca tutarlılığı denetler
```

Özel alan adına geçerken GitHub'da Settings › Pages › Custom domain alanı da doldurulmalıdır.

## Ziyaret sayacı

Sayfa görüntülemeleri GoatCounter ile sayılır; çerez kullanılmaz, betik yerel kopyadan yüklenir. Her sayfada `</body>` etiketinden önce şu satır bulunur:

```
<script data-goatcounter="https://mustafaenderdogan.goatcounter.com/count" async src="/assets/vendor/goatcounter.count.v5.js"></script>
```

Yeni sayfa eklenirken bu satır da eklenir. HasarAI demosunda ve `yolculuk/sahne.html` içinde sayaç yoktur. Bir tarayıcıyı sayım dışı bırakmak için site o tarayıcıda bir kez `#toggle-goatcounter` ekiyle açılır. Sayacın ne kaydettiği `gizlilik.html` içinde yazılıdır.

## Lisanslar

Analiz kartlarındaki fotoğraflar Unsplash ve Pexels lisanslıdır. Lab görselleri greendigitalstudio.com'daki uygulama sayfalarından alındı; Ritim oyunu görseli oyunun kendi ekranıdır. Demo görselleri demoların ekran görüntüleridir. Yazı tipleri (Figtree, IBM Plex Mono, Archivo) SIL Open Font License 1.1 ile yerel olarak sunulur. Yolculuk sahnesi three.js r128 kütüphanesini (Copyright 2010-2021 Three.js Authors, MIT lisansı) yerel kopyadan kullanır: `assets/vendor/three.r128.min.js`. Ziyaret sayacı GoatCounter'ın `count.js` betiğini (5. sürüm, ISC lisansı) yerel kopyadan kullanır: `assets/vendor/goatcounter.count.v5.js`.
