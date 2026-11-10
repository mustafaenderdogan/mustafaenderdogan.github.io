/* Büro: süre motoru (demo)
   Kurallar TASLAK'tır; canlıdan önce avukat doğrulaması şarttır.
   Tatil listesi demoda örnektir; canlıda resmi listeden yüklenir. */
(function (G) {
  "use strict";

  // İşlem kuralları. unit: "gun" | "hafta". adliTatil: süre adli tatile denk gelirse uzar mı?
  var RULES = [
    { id: "cevap", ad: "Cevap dilekçesi", sure: 2, unit: "hafta", adliTatil: true, kaynak: "HMK m.127", not: "Uzatma talep edilebilir." },
    { id: "cevaba-cevap", ad: "Cevaba cevap dilekçesi", sure: 2, unit: "hafta", adliTatil: true, kaynak: "HMK m.136" },
    { id: "istinaf", ad: "İstinaf başvurusu", sure: 2, unit: "hafta", adliTatil: true, kaynak: "HMK m.345" },
    { id: "temyiz", ad: "Temyiz başvurusu", sure: 2, unit: "hafta", adliTatil: true, kaynak: "HMK m.361" },
    { id: "bilirkisi-itiraz", ad: "Bilirkişi raporuna itiraz", sure: 2, unit: "hafta", adliTatil: true, kaynak: "HMK m.281" },
    { id: "odeme-emri", ad: "Ödeme emrine itiraz (genel haciz)", sure: 7, unit: "gun", adliTatil: false, kaynak: "İİK m.62", not: "İcra işlerinde adli tatil uzaması uygulanmaz; tatil kuralları ayrıca tanımlanır." },
    { id: "kambiyo", ad: "Kambiyo takibinde borca itiraz", sure: 5, unit: "gun", adliTatil: false, kaynak: "İİK m.168", not: "İcra işlerinde adli tatil uzaması uygulanmaz." },
    { id: "icra-istinaf", ad: "İcra mahkemesi kararına istinaf", sure: 10, unit: "gun", adliTatil: false, kaynak: "İİK m.363" },
    { id: "idari-dava", ad: "İdari dava açma", sure: 60, unit: "gun", adliTatil: true, kaynak: "İYUK m.7" },
    { id: "vergi-dava", ad: "Vergi mahkemesinde dava açma", sure: 30, unit: "gun", adliTatil: true, kaynak: "İYUK m.7" }
  ];

  // Örnek resmi tatiller (tam gün). Arife yarım günleri demoda tam iş günü sayılır.
  var HOLIDAYS = {
    "2026-01-01": "Yılbaşı", "2026-03-20": "Ramazan Bayramı", "2026-03-21": "Ramazan Bayramı", "2026-03-22": "Ramazan Bayramı",
    "2026-04-23": "Ulusal Egemenlik ve Çocuk Bayramı", "2026-05-01": "Emek ve Dayanışma Günü", "2026-05-19": "Atatürk'ü Anma, Gençlik ve Spor Bayramı",
    "2026-05-27": "Kurban Bayramı", "2026-05-28": "Kurban Bayramı", "2026-05-29": "Kurban Bayramı", "2026-05-30": "Kurban Bayramı",
    "2026-07-15": "Demokrasi ve Milli Birlik Günü", "2026-08-30": "Zafer Bayramı", "2026-10-29": "Cumhuriyet Bayramı",
    "2027-01-01": "Yılbaşı", "2027-03-09": "Ramazan Bayramı", "2027-03-10": "Ramazan Bayramı", "2027-03-11": "Ramazan Bayramı",
    "2027-04-23": "Ulusal Egemenlik ve Çocuk Bayramı", "2027-05-01": "Emek ve Dayanışma Günü", "2027-05-16": "Kurban Bayramı",
    "2027-05-17": "Kurban Bayramı", "2027-05-18": "Kurban Bayramı", "2027-05-19": "Kurban Bayramı / Gençlik ve Spor Bayramı",
    "2027-07-15": "Demokrasi ve Milli Birlik Günü", "2027-08-30": "Zafer Bayramı", "2027-10-29": "Cumhuriyet Bayramı"
  };

  function d(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function iso(dt) { return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0"); }
  function add(dt, n) { var x = new Date(dt); x.setDate(x.getDate() + n); return x; }
  var GUN = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  var AY = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  function uzun(dt) { return dt.getDate() + " " + AY[dt.getMonth()] + " " + dt.getFullYear() + " " + GUN[dt.getDay()]; }
  function tatilMi(dt) {
    var w = dt.getDay();
    if (w === 0 || w === 6) return w === 0 ? "Pazar" : "Cumartesi";
    return HOLIDAYS[iso(dt)] || null;
  }
  function adliTatilde(dt) {
    var y = dt.getFullYear();
    return dt >= new Date(y, 6, 20) && dt <= new Date(y, 7, 31);
  }

  // Son günü hesapla; adım adım gerekçe döndür.
  function hesapla(ruleId, tebligIso) {
    var r = RULES.filter(function (x) { return x.id === ruleId; })[0];
    if (!r || !tebligIso) return null;
    var t = d(tebligIso), adim = [];
    adim.push("Tebliğ: " + uzun(t) + ". Tebliğ günü süreye dahil edilmez.");
    var son = r.unit === "hafta" ? add(t, r.sure * 7) : add(t, r.sure);
    adim.push(r.sure + " " + (r.unit === "hafta" ? "hafta" : "gün") + " eklenir → " + uzun(son) + ".");
    if (r.adliTatil && adliTatilde(son)) {
      var y = son.getFullYear(), bitis = new Date(y, 7, 31);
      son = add(bitis, 7);
      adim.push("Son gün adli tatile (20 Temmuz–31 Ağustos) denk geliyor → tatil bitiminden itibaren 1 hafta uzar: " + uzun(son) + ".");
    }
    var kayma = 0, neden;
    while ((neden = tatilMi(son))) {
      adim.push(uzun(son) + " iş günü değil (" + neden + ") → ertesi güne geçilir.");
      son = add(son, 1); kayma++;
      if (kayma > 14) break;
    }
    adim.push("Son gün: " + uzun(son) + ".");
    return { kural: r, son: iso(son), sonUzun: uzun(son), adimlar: adim };
  }

  G.BuroRules = { RULES: RULES, HOLIDAYS: HOLIDAYS, hesapla: hesapla, iso: iso, d: d, add: add, uzun: uzun, tatilMi: tatilMi, AY: AY, GUN: GUN };
})(window);
