# mustafaenderdogan.github.io

Mustafa Ender Doğan — İş Analizi Portfolyosu. Statik site: HTML, CSS ve JavaScript; derleme adımı, çerez ve analitik yok. GitHub Pages'te yayınlanmak üzere hazırlandı.

## İçerik

- `index.html`: kısa tanıtım, dört analiz çalışması, demolar, Lab, Hakkımda (deneyim, eğitim, uzmanlık) ve iletişim.
- `css/site.css` ve `js/site.js`: tüm sayfaların (demolar hariç) tek stil ve betik dosyası.
- `analiz/`: vaka sayfaları. Bankasürans vakası temsilidir; kurum adları ve veriler kurgusaldır.
- `surec-ve-yontem.html`: Scrum çalışma biçimi; örnekler temsilidir.
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

## Lisanslar

Analiz kartlarındaki fotoğraflar Unsplash ve Pexels lisanslıdır. Lab görselleri greendigitalstudio.com'daki uygulama sayfalarından alındı; Ritim oyunu görseli oyunun kendi ekranıdır. Demo görselleri demoların ekran görüntüleridir. Yazı tipleri (Figtree, IBM Plex Mono, Archivo) SIL Open Font License 1.1 ile yerel olarak sunulur.
