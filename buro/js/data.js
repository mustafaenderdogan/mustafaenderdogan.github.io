/* Büro: sentetik demo verisi. Gerçek kişi ya da kurum yoktur.
   Tarihler bugüne göre üretilir; demo her gün "taze" görünür. */
(function (G) {
  "use strict";
  var R = G.BuroRules;

  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }

  var USERS = [
    { id: "u1", ad: "Av. Zeynep Arslan", kisa: "ZA", rol: "ortak", rolAd: "Büro sahibi · Ortak" },
    { id: "u2", ad: "Av. Kerem Yılmaz", kisa: "KY", rol: "avukat", rolAd: "Avukat" },
    { id: "u3", ad: "Av. Deniz Aksoy", kisa: "DA", rol: "avukat", rolAd: "Avukat" },
    { id: "u4", ad: "Stj. Av. Ece Tunç", kisa: "ET", rol: "stajyer", rolAd: "Stajyer avukat" },
    { id: "u5", ad: "Merve Kılıç", kisa: "MK", rol: "sekreter", rolAd: "Büro sekreteri" },
    { id: "u6", ad: "Hakan Doğru", kisa: "HD", rol: "muhasebe", rolAd: "Muhasebe" },
    { id: "m1", ad: "Emre Tuna", kisa: "ET", rol: "muvekkil", rolAd: "Müvekkil · Tuna Gıda Ltd. Şti.", muvekkilId: "c1" }
  ];

  var CLIENTS = [
    ["c1", "Tuna Gıda Ltd. Şti.", "tuzel", "Emre Tuna", "İzmir"], ["c2", "Selin Kaya", "gercek", "", "İzmir"],
    ["c3", "Ege Mermer San. A.Ş.", "tuzel", "Ozan Er", "Aydın"], ["c4", "Murat Demirtaş", "gercek", "", "Kuşadası"],
    ["c5", "Kıyı Turizm Otelcilik A.Ş.", "tuzel", "Burcu Gök", "Kuşadası"], ["c6", "Ayşe Polat", "gercek", "", "İzmir"],
    ["c7", "Liman Lojistik Ltd. Şti.", "tuzel", "Can Uysal", "İzmir"], ["c8", "Hasan Çetin", "gercek", "", "Söke"],
    ["c9", "Defne Yazılım A.Ş.", "tuzel", "Ilgaz Er", "İstanbul"], ["c10", "Fatma Şen", "gercek", "", "Aydın"],
    ["c11", "Zeytin Kooperatifi", "tuzel", "Ali Bal", "Aydın"], ["c12", "Okan Bulut", "gercek", "", "İzmir"],
    ["c13", "Rüzgâr Enerji A.Ş.", "tuzel", "Seda Ay", "İzmir"], ["c14", "Gül Erdem", "gercek", "", "Kuşadası"],
    ["c15", "Mavi Tekstil Ltd. Şti.", "tuzel", "Tolga Kurt", "Denizli"], ["c16", "Serkan Avcı", "gercek", "", "İzmir"],
    ["c17", "Pınar Özkan", "gercek", "", "Didim"], ["c18", "Kardelen Sağlık Hizm. Ltd.", "tuzel", "Nil Toprak", "İzmir"],
    ["c19", "Yusuf Kara", "gercek", "", "Aydın"], ["c20", "Badem Yapı Koop.", "tuzel", "Ercan Tan", "Kuşadası"],
    ["c21", "Elif Acar", "gercek", "", "İzmir"], ["c22", "Narin Kozmetik A.Ş.", "tuzel", "Lale Ural", "İstanbul"]
  ].map(function (c) { return { id: c[0], ad: c[1], tip: c[2], yetkili: c[3], sehir: c[4] }; });

  var KARSI = ["Bora Yapı A.Ş.", "Demir Nakliyat Ltd. Şti.", "Kemal Yıldız", "Sahil Emlak Ltd.", "Akdeniz Sigorta A.Ş.", "Nesrin Aydın",
    "Poyraz Gıda Tic. Ltd.", "Ufuk Dağ", "Körfez Belediyesi", "Vergi Dairesi Müdürlüğü", "Sedef İnşaat A.Ş.", "Tarık Er", "Mercan Otelcilik A.Ş.",
    "Rıza Koç", "Ova Tarım Ltd.", "Levent Uçar", "Kumsal Turizm Ltd.", "Gökçe Altın", "Zirve Mobilya A.Ş.", "SGK İl Müdürlüğü"];

  var MAHKEME = {
    dava: ["İzmir 4. Asliye Hukuk Mahkemesi", "İzmir 2. Asliye Ticaret Mahkemesi", "İzmir 7. İş Mahkemesi", "Kuşadası 1. Asliye Hukuk Mahkemesi",
      "Aydın 3. Aile Mahkemesi", "İzmir 1. Tüketici Mahkemesi", "İzmir 2. İdare Mahkemesi", "Aydın Vergi Mahkemesi"],
    icra: ["İzmir 5. İcra Dairesi", "İzmir 12. İcra Dairesi", "Kuşadası İcra Dairesi", "Aydın 2. İcra Dairesi"],
    arabuluculuk: ["İzmir Adliyesi Arabuluculuk Bürosu", "Kuşadası Arabuluculuk Bürosu"],
    danismanlik: ["Büro içi"]
  };

  // Dava konusu → görevli mahkeme (demo eşlemesi)
  var KONU_MAHKEME = {
    "Alacak": ["İzmir 4. Asliye Hukuk Mahkemesi", "İzmir 2. Asliye Ticaret Mahkemesi"],
    "İşçilik alacağı": ["İzmir 7. İş Mahkemesi"],
    "Kira tespiti": ["İzmir 3. Sulh Hukuk Mahkemesi"],
    "Tazminat (trafik kazası)": ["İzmir 4. Asliye Hukuk Mahkemesi", "Kuşadası 1. Asliye Hukuk Mahkemesi"],
    "Boşanma ve velayet": ["Aydın 3. Aile Mahkemesi"],
    "Ayıplı mal": ["İzmir 1. Tüketici Mahkemesi"],
    "İmar para cezasının iptali": ["İzmir 2. İdare Mahkemesi"],
    "Vergi ziyaı cezasının iptali": ["Aydın Vergi Mahkemesi"],
    "İtirazın iptali": ["İzmir 2. Asliye Ticaret Mahkemesi", "İzmir 4. Asliye Hukuk Mahkemesi"],
    "Menfi tespit": ["İzmir 4. Asliye Hukuk Mahkemesi", "Kuşadası 1. Asliye Hukuk Mahkemesi"]
  };

  var KONU = {
    dava: ["Alacak", "İşçilik alacağı", "Kira tespiti", "Tazminat (trafik kazası)", "Boşanma ve velayet", "Ayıplı mal", "İmar para cezasının iptali", "Vergi ziyaı cezasının iptali", "İtirazın iptali", "Menfi tespit"],
    icra: ["Fatura alacağı", "Çek alacağı", "Kira alacağı", "Kambiyo senedi (bono)", "İlamlı icra"],
    arabuluculuk: ["İşe iade", "Ticari alacak", "Kira uyuşmazlığı"],
    danismanlik: ["Bayilik sözleşmesi incelemesi", "KVKK uyum danışmanlığı", "Şirket ana sözleşme değişikliği", "Kira sözleşmesi hazırlığı", "İşyeri yönetmeliği"]
  };

  function build(today) {
    var rnd = rng(20261009), pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
    var T = R.d(today), iso = R.iso, add = R.add;
    var dosyalar = [], seq = 1;
    var plan = [].concat(
      Array(18).fill("dava"), Array(10).fill("icra"), Array(4).fill("arabuluculuk"), Array(6).fill("danismanlik"));
    // Bilinçli olarak dağıtılmış son gün uzaklıkları (bugüne göre)
    var offsets = [-1, 0, 0, 1, 2, 3, 3, 5, 6, 7, 9, 12, 15, 21, 28, 2, 4, 8, 11, 18, 25, 1, 6, 14];
    var oi = 0;
    plan.forEach(function (tur, i) {
      var muv = CLIENTS[i % CLIENTS.length];
      if (i === 0 || i === 7 || i === 19) muv = CLIENTS[0]; // portal müvekkilinin 3 dosyası
      var sorumlu = pick(["u1", "u2", "u2", "u3", "u3"]);
      var konu = pick(KONU[tur]);
      var idari = tur === "dava" && /İmar|Vergi ziyaı/.test(konu); // dava açma süresi işliyor, henüz esas yok
      var mahkeme = pick(tur === "dava" ? (KONU_MAHKEME[konu] || MAHKEME.dava) : MAHKEME[tur]);
      var acilis = add(T, -Math.floor(40 + rnd() * 400));
      var yil = acilis.getFullYear();
      var esas = (tur === "danismanlik" || idari) ? "—" : yil + "/" + Math.floor(100 + rnd() * (tur === "icra" ? 9800 : 900)) + " E.";
      var sifat = idari ? "Davacı" : { dava: pick(["Davacı", "Davacı", "Davalı"]), icra: "Alacaklı", arabuluculuk: pick(["Başvurucu", "Karşı taraf"]), danismanlik: "Danışan" }[tur];
      var karsi = tur === "danismanlik" ? "—" : (i === 3 ? "Bora Yapı A.Ş." : pick(KARSI));
      if (/İmar/.test(konu)) karsi = "Körfez Belediyesi";
      if (/Vergi/.test(konu)) karsi = "Vergi Dairesi Müdürlüğü";
      var durum = { dava: pick(["Açık", "Açık", "Açık", "Bilirkişide", "Karar", "İstinafta"]), icra: pick(["Takipte", "Takipte", "Haciz aşaması", "İtiraz edildi"]), arabuluculuk: pick(["Toplantı bekleniyor", "Açık"]), danismanlik: pick(["Devam ediyor", "Taslak teslim edildi"]) }[tur];
      if (idari) durum = "Dava hazırlığı";
      var deger = tur === "danismanlik" ? 0 : Math.round((20 + rnd() * 900) * 1000);
      var no = "B-" + yil + "-" + String(seq++).padStart(3, "0");
      var f = {
        id: "f" + (i + 1), no: no, tur: tur, mahkeme: mahkeme, esas: esas, konu: konu, muvekkilId: muv.id, karsi: karsi, sifat: sifat,
        sorumlu: sorumlu, ekip: rnd() < 0.6 ? ["u4"] : [], durum: durum, deger: deger, acilis: iso(acilis),
        avansAlinan: Math.round(5000 + rnd() * 20000), masraflar: [], olaylar: [], sureler: [], durusmalar: [], gorevler: [], dilekceler: [],
        ucret: null, notlar: "", zaman: []
      };
      // Masraflar
      var mTur = tur === "icra" ? ["Takip harcı", "Tebligat gideri", "Haciz yolluğu", "Muhafaza gideri"] : ["Başvuru harcı", "Tebligat gideri", "Bilirkişi ücreti", "Keşif gideri", "Tanık gideri"];
      var mN = tur === "danismanlik" ? 0 : 2 + Math.floor(rnd() * 4);
      for (var k = 0; k < mN; k++) f.masraflar.push({ tarih: iso(add(acilis, 3 + k * 20)), tur: pick(mTur), tutar: Math.round(150 + rnd() * (k === 2 ? 9000 : 2500)) });
      if (i === 5 || i === 11 || i === 22) f.masraflar.push({ tarih: iso(add(T, -6)), tur: "Bilirkişi ücreti", tutar: 26000 }); // avansı eksiye düşenler
      // Olaylar (zaman çizelgesi)
      f.olaylar.push({ tarih: iso(acilis), tur: "acilis", metin: tur === "danismanlik" ? "Danışmanlık talebi alındı, dosya açıldı." : "Dosya açıldı, vekaletname bağlandı." });
      if (idari) {
        f.olaylar.push({ tarih: iso(add(acilis, 2)), tur: "evrak", metin: "İdari işlem ve ceza tutanağı müvekkilden alındı." });
      } else if (tur === "dava") {
        f.olaylar.push({ tarih: iso(add(acilis, 6)), tur: "evrak", metin: (sifat === "Davacı" ? "Dava dilekçesi UYAP'tan gönderildi." : "Dava dilekçesi tebliğ alındı.") });
        f.olaylar.push({ tarih: iso(add(acilis, 40)), tur: "evrak", metin: "Cevap dilekçesi " + (sifat === "Davacı" ? "tebliğ alındı." : "UYAP'tan gönderildi.") });
        f.olaylar.push({ tarih: iso(add(acilis, 95)), tur: "durusma", metin: "Ön inceleme duruşması yapıldı; tahkikata geçildi." });
      } else if (tur === "icra") {
        f.olaylar.push({ tarih: iso(add(acilis, 2)), tur: "evrak", metin: "Takip talebi açıldı, ödeme emri gönderildi." });
        f.olaylar.push({ tarih: iso(add(acilis, 18)), tur: "evrak", metin: "Ödeme emri borçluya tebliğ edildi." });
      } else if (tur === "arabuluculuk") {
        f.olaylar.push({ tarih: iso(add(acilis, 4)), tur: "evrak", metin: "Arabuluculuk başvurusu yapıldı." });
      } else {
        f.olaylar.push({ tarih: iso(add(acilis, 10)), tur: "evrak", metin: "İlk taslak müvekkile gönderildi." });
      }
      // Süreler
      if (tur === "dava" || tur === "icra") {
        var ruleId = tur === "icra" ? pick(["odeme-emri", "kambiyo", "icra-istinaf"]) : pick(["cevap", "cevaba-cevap", "istinaf", "bilirkisi-itiraz", "temyiz"]);
        if (tur === "dava" && i % 6 === 1 && !idari) ruleId = "istinaf"; // her zaman örnek istinaf dosyası olsun
        if (/İmar/.test(konu)) ruleId = "idari-dava";
        if (/Vergi ziyaı/.test(konu)) ruleId = "vergi-dava";
        if (ruleId === "temyiz" && /Kira tespiti/.test(konu)) ruleId = "istinaf";
        if (ruleId === "istinaf") durum = f.durum = "Karar";
        if (ruleId === "temyiz") durum = f.durum = "İstinafta";
        if (ruleId === "odeme-emri" || ruleId === "kambiyo") durum = f.durum = "Takipte";
        if (ruleId === "icra-istinaf") durum = f.durum = "İcra mahkemesi kararı";
        if (tur === "dava" && !idari) { // taraf sıfatına uygun dilekçe süresi
          if (ruleId === "cevap" && sifat === "Davacı") ruleId = /Kira tespiti/.test(konu) ? "bilirkisi-itiraz" : "cevaba-cevap";
          if (ruleId === "cevaba-cevap" && (sifat === "Davalı" || /Kira tespiti/.test(konu))) ruleId = "cevap";
        }
        if (ruleId === "bilirkisi-itiraz") durum = f.durum = "Bilirkişide";
        if (ruleId === "cevap" || ruleId === "cevaba-cevap") durum = f.durum = "Açık";
        if (ruleId === "cevap" || ruleId === "cevaba-cevap") f.olaylar = f.olaylar.filter(function (o) { return !/Ön inceleme|Cevap dilekçesi/.test(o.metin); });
        var off = offsets[oi++ % offsets.length];
        var rule = R.RULES.filter(function (r) { return r.id === ruleId; })[0];
        var len = rule.unit === "hafta" ? rule.sure * 7 : rule.sure;
        var teb = add(T, off - len);
        var h = R.hesapla(ruleId, iso(teb));
        f.sureler.push({ id: f.id + "-s1", kuralId: ruleId, teblig: iso(teb), son: h.son, durum: "acik", gorevli: sorumlu });
        f.olaylar.push({ tarih: iso(teb), tur: "teblig", metin: rule.ad + " süresini başlatan evrak tebliğ alındı." });
        f.gorevler.push({ id: f.id + "-g1", baslik: rule.ad + " hazırlığı", atanan: f.ekip[0] || sorumlu, son: h.son, durum: "acik" });
      }
      // Duruşmalar
      if (tur === "dava" && !idari && durum !== "Karar" && durum !== "İstinafta") {
        var dg = durum === "Açık" ? 20 + Math.floor(rnd() * 40) : Math.floor(rnd() * 34) - 2;
        var dd = add(T, dg); while (R.tatilMi(dd)) dd = add(dd, 1);
        f.durusmalar.push({ tarih: iso(dd), saat: pick(["09:30", "10:00", "10:40", "11:20", "13:30", "14:10", "15:00"]), tur: durum === "Açık" ? "Ön inceleme duruşması" : pick(["Tahkikat duruşması", "Tahkikat duruşması", "Keşif", "Sözlü yargılama"]), yer: mahkeme });
      }
      if (tur === "arabuluculuk") {
        var ad2 = add(T, Math.floor(rnd() * 15)); while (R.tatilMi(ad2)) ad2 = add(ad2, 1);
        f.durusmalar.push({ tarih: iso(ad2), saat: "11:00", tur: "Arabuluculuk toplantısı", yer: mahkeme });
      }
      // Dilekçeler (onay akışı)
      if (tur === "dava" && rnd() < 0.5) {
        f.dilekceler.push({ id: f.id + "-d1", baslik: pick(["Beyan dilekçesi", "Bilirkişi raporuna itiraz", "Delil listesi", "Islah dilekçesi", "Cevaba cevap dilekçesi"]), yazan: f.ekip[0] || sorumlu, durum: pick(["taslak", "onayda", "onayda", "onaylandi"]), tarih: iso(add(T, -Math.floor(rnd() * 5))) });
      }
      // Ücret
      var top = tur === "danismanlik" ? Math.round(30 + rnd() * 120) * 1000 : Math.round(25 + rnd() * 150) * 1000;
      var tip = tur === "danismanlik" ? pick(["Sabit", "Saatlik"]) : pick(["Sabit", "Taksitli", "Taksitli", "Başarıya bağlı oran + sabit"]);
      var taks = [];
      var n = tip === "Taksitli" ? 4 : (tip === "Saatlik" ? 0 : 2);
      for (var t = 0; t < n; t++) {
        var v = add(acilis, 30 * (t + 1));
        taks.push({ vade: iso(v), tutar: Math.round(top / n), odendi: v < add(T, -75) ? true : (v < add(T, -3) ? rnd() < 0.6 : false) });
      }
      f.ucret = { tip: tip, toplam: tip === "Saatlik" ? 0 : top, saatlik: tip === "Saatlik" ? 3500 : 0, taksitler: taks };
      if (tur === "danismanlik") {
        for (var z = 0; z < 4; z++) f.zaman.push({ tarih: iso(add(T, -z * 3 - 1)), kisi: sorumlu, saat: [1.5, 2, 0.75, 3][z], aciklama: pick(["Sözleşme incelemesi", "Müvekkil görüşmesi", "Taslak revizyonu", "Mevzuat araştırması"]) });
        f.gorevler.push({ id: f.id + "-g2", baslik: "Taslağı müvekkile gönder", atanan: sorumlu, son: iso(add(T, Math.floor(rnd() * 10))), durum: "acik" });
      }
      f.notlar = tur === "danismanlik" ? "Müvekkil hızlı dönüş bekliyor; haftalık özet gönderilecek." : "Karşı tarafın sulh eğilimi var; müvekkil asgari tutarı teyit etti. (Büro içi not)";
      dosyalar.push(f);
    });

    var portalMesaj = [{ tarih: iso(add(T, -2)), kimden: "Av. Zeynep Arslan", metin: "Bilirkişi raporu dosyaya girdi; itiraz dilekçemizi bu hafta sunacağız." }];

    return { today: today, users: USERS, muvekkiller: CLIENTS, karsiTaraflar: KARSI, dosyalar: dosyalar, portalMesaj: portalMesaj, portalBelge: [], log: [] };
  }

  G.BuroData = { build: build, USERS: USERS };
})(window);
