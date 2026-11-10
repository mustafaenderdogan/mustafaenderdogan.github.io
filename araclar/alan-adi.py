# -*- coding: utf-8 -*-
"""Sitenin alan adını tek yerden yönetir.

Alan adı yalnızca araclar/alan-adi.json içinde yazılır. Bu betik onu canonical, og:url,
og:image, twitter:image, hreflang, JSON-LD, sitemap.xml ve robots.txt'ye uygular.

Kullanım (depo kökünden):
  python araclar/alan-adi.py                       # alan-adi.json'daki adresi uygular, sonra denetler
  python araclar/alan-adi.py https://ornek.com     # önce alan-adi.json'u günceller, sonra uygular
  python araclar/alan-adi.py --denetle             # yalnızca denetler, dosya değiştirmez

Yalnız Python 3 standart kütüphanesi kullanılır.
"""
import json
import pathlib
import re
import sys

KOK = pathlib.Path(__file__).resolve().parent.parent
AYAR = KOK / "araclar" / "alan-adi.json"
UZANTILAR = {".html", ".xml", ".txt"}
ATLA = {".git", "isyonetim"}  # İYP demosunun derlenmiş dosyaları alan adı içermez; index.html ayrıca ele alınır
ADRES = re.compile(r'(?:<link rel="canonical" href="|<meta (?:property="og:url"|property="og:image"|name="twitter:image") content="|hreflang="[^"]+" href="|"(?:url|@id|item|image)": "|<loc>|Sitemap: )(https?://[^/"<\s]+)')


def dosyalar():
    for p in KOK.rglob("*"):
        if p.suffix in UZANTILAR and p.is_file() and not (set(p.relative_to(KOK).parts) & ATLA):
            yield p
    yield KOK / "isyonetim" / "index.html"


def mevcut_alan():
    s = (KOK / "index.html").read_text(encoding="utf-8")
    m = re.search(r'<link rel="canonical" href="(https?://[^/"]+)/"', s)
    if not m:
        sys.exit("index.html içinde canonical bulunamadı.")
    return m.group(1)


def denetle(beklenen):
    farkli = {}
    for p in dosyalar():
        for alan in ADRES.findall(p.read_text(encoding="utf-8")):
            if alan != beklenen:
                farkli.setdefault(alan, set()).add(p.relative_to(KOK).as_posix())
    if farkli:
        for alan, ds in farkli.items():
            print(f"UYUMSUZ: {alan} → {len(ds)} dosya (ör. {sorted(ds)[0]})")
        return False
    print(f"Tamam: tüm adresler {beklenen}")
    return True


def main():
    args = sys.argv[1:]
    ayar = json.loads(AYAR.read_text(encoding="utf-8"))
    if args and args[0] == "--denetle":
        sys.exit(0 if denetle(ayar["alan_adi"].rstrip("/")) else 1)
    if args:
        ayar["alan_adi"] = args[0].rstrip("/")
        AYAR.write_text(json.dumps(ayar, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    yeni = ayar["alan_adi"].rstrip("/")
    if not re.fullmatch(r"https?://[^/\s]+", yeni):
        sys.exit("alan_adi yalnızca şema ve alan adı olmalı, ör. https://ornek.com")
    eski = mevcut_alan()
    if eski == yeni:
        print(f"Alan adı zaten {yeni}")
    else:
        n = 0
        for p in dosyalar():
            s = p.read_text(encoding="utf-8")
            if eski in s:
                p.write_bytes(s.replace(eski, yeni).encode("utf-8"))
                n += 1
        print(f"{eski} → {yeni}: {n} dosya güncellendi")
        if not yeni.endswith(".github.io"):
            print("Not: özel alan adı için GitHub'da Settings › Pages › Custom domain alanını doldurun (CNAME dosyasını GitHub oluşturur) ve DNS kaydını ekleyin.")
    sys.exit(0 if denetle(yeni) else 1)


if __name__ == "__main__":
    main()
