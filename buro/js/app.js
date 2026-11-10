/* Büro demo uygulaması: tek sayfa, hash yönlendirme, veri tarayıcıda.
   UX ilkesi: her sık iş giriş ekranından en fazla 3 adımda biter.
   - Bugün ekranında satır içi eylemler (Tamamlandı, Bitti, Onayla, Avans iste)
   - Her yerden hızlı arama ("/" ya da Ctrl+K): dosya, müvekkil, esas no, ekran; sonuç satırında dosya eylemleri
   - "+ Yeni": tebligat, masraf, görev, dilekçe taslağı, müvekkil (dosya sayfasındaysanız o dosyaya)
   - "Seçim = kaydet" modalları + onay diyaloğu yerine "Geri al" toast'u
   Genişletme noktaları (veri olarak): NAV, VIEWS, GUARD, TABS, FILE_ACTIONS, NEW_ITEMS. */
(function () {
  "use strict";
  var R = window.BuroRules, D = window.BuroData;
  var KEY = "buro-demo-v1", UKEY = "buro-demo-user";
  var app = document.getElementById("app");

  /* ---------- durum ---------- */
  function todayIso() { return R.iso(new Date()); }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.today === todayIso()) return s;
    } catch (e) {}
    return D.build(todayIso());
  }
  var S = load();
  function ensure() { if (!S.muvekkilTalep) S.muvekkilTalep = []; } // UX eki: ortak onayı bekleyen müvekkil kayıtları
  ensure();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var me = null;
  try { var uid = localStorage.getItem(UKEY); me = S.users.filter(function (u) { return u.id === uid; })[0] || null; } catch (e) {}

  document.getElementById("resetDemo").addEventListener("click", function () {
    try { localStorage.removeItem(KEY); localStorage.removeItem(UKEY); } catch (e) {}
    S = D.build(todayIso()); ensure(); me = null; location.hash = ""; render(); toast("Demo baştaki hâline döndü.");
  });

  /* ---------- yardımcılar ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function user(id) { return S.users.filter(function (u) { return u.id === id; })[0] || { ad: "—", kisa: "?", rol: "" }; }
  function client(id) { return S.muvekkiller.filter(function (c) { return c.id === id; })[0] || { ad: "—" }; }
  function dosya(id) { return S.dosyalar.filter(function (f) { return f.id === id; })[0]; }
  function rule(id) { return R.RULES.filter(function (r) { return r.id === id; })[0] || { ad: id }; }
  function tl(n) { return (n < 0 ? "−" : "") + Math.abs(Math.round(n)).toLocaleString("tr-TR") + " ₺"; }
  function kisaTarih(s) { var x = R.d(s); return x.getDate() + " " + R.AY[x.getMonth()].slice(0, 3) + " " + x.getFullYear(); }
  function gunFarki(s) { return Math.round((R.d(s) - R.d(S.today)) / 86400000); }
  function urg(s, durum) {
    if (durum === "tamam") return { c: "u-tamam", t: "Tamamlandı" };
    var g = gunFarki(s);
    if (g < 0) return { c: "u-gecti", t: Math.abs(g) + " gün geçti" };
    if (g === 0) return { c: "u-bugun", t: "Bugün son gün" };
    if (g <= 3) return { c: "u-yakin", t: g + " gün kaldı" };
    if (g <= 7) return { c: "u-hafta", t: g + " gün kaldı" };
    return { c: "u-ileri", t: g + " gün kaldı" };
  }
  function chip(s, durum) { var u = urg(s, durum); return '<span class="chip ' + u.c + '">' + u.t + "</span>"; }
  function turAd(t) { return { dava: "Dava", icra: "İcra", arabuluculuk: "Arabuluculuk", danismanlik: "Danışmanlık" }[t]; }
  function tag(t) { return '<span class="tag ' + t + '">' + turAd(t) + "</span>"; }
  function harcanan(f) { return f.masraflar.reduce(function (a, m) { return a + m.tutar; }, 0); }
  function bakiye(f) { return f.avansAlinan - harcanan(f); }
  function log(metin, fid) { S.log.unshift({ ts: new Date().toISOString(), user: me ? me.id : "", metin: metin, dosyaId: fid || null }); S.log = S.log.slice(0, 200); }
  function nid(p) { return p + Math.random().toString(36).slice(2, 8); }
  function trNorm(s) { return String(s || "").toLocaleLowerCase("tr").replace(/[.,;:()"'·]/g, " ").replace(/\s+/g, " ").trim(); }

  /* Toast; undo verilirse "Geri al" düğmesi çıkar (onay diyaloğu yerine). */
  function toast(t, undo) {
    document.querySelectorAll(".toast").forEach(function (x) { x.remove(); });
    var el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite");
    var sp = document.createElement("span"); sp.textContent = t; el.appendChild(sp);
    if (undo) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = "Geri al"; b.className = "undo";
      b.onclick = function () { el.remove(); undo(); toast("Geri alındı."); };
      el.appendChild(b);
    }
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, undo ? 7000 : 2800);
  }
  /* Değişikliği uygula, kaydet, yeniden çiz; geri alınabilir toast göster. */
  function act(mutate, msg) {
    var snap = JSON.stringify(S);
    mutate(); save(); render();
    toast(msg, function () { S = JSON.parse(snap); ensure(); save(); render(); });
  }

  /* ---------- simgeler (satır içi SVG) ---------- */
  var IC = {
    bugun: '<path d="M4 6h16v14H4z"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="M8 14h3v3H8z"/>',
    dosyalar: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    takvim: '<path d="M4 6h16v14H4zM4 10h16M9 3v4M15 3v4"/>',
    sure: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
    muvekkiller: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.7 3.1 2.5 3.5 5.2"/>',
    onay: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 15l2 2 4-4"/>',
    finans: '<path d="M3 7h18v12H3z"/><path d="M3 11h18M7 15h4"/>',
    rapor: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    ara: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    yeni: '<path d="M12 5v14M5 12h14"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    kilit: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    emsal: '<path d="M5 4h10l4 4v12H5z"/><circle cx="11" cy="13" r="3"/><path d="m13.5 15.5 2.5 2.5"/>'
  };
  function ico(k) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (IC[k] || IC.dosyalar) + "</svg>"; }

  /* ---------- yetki: tek matris ----------
     Her yetki tek anahtardır; ekranlar, sekmeler, düğmeler ve tutarlar yalnız bu matrise bakar.
     Yetkisiz bir ekrana adresle girme denemesi erişim kaydına yazılır. */
  var YETKI = [
    ["Dosya", "tumDosya", "Büronun tüm dosyalarını görür (yoksa yalnız atandıkları)"],
    ["Dosya", "dosyaIcerik", "Dosya içeriği: zaman çizelgesi, süre, görev"],
    ["Dosya", "takvim", "Takvim"],
    ["Süre", "teblig", "Tebligat kaydeder, süre başlatır"],
    ["Süre", "sureKapat", "Süreyi kapatır (yalnız sorumlu olduğu dosyada)"],
    ["Süre", "gorev", "Görev ekler ve kapatır"],
    ["Dilekçe", "dilekceGor", "Dilekçeleri görür"],
    ["Dilekçe", "dilekceYaz", "Şablondan taslak yazar, onaya gönderir"],
    ["Dilekçe", "dilekceOnay", "Dilekçeyi onaylar ya da iade eder"],
    ["Dilekçe", "dilekceGonder", "UYAP'a gönderildi olarak işaretler"],
    ["Bilgi", "not", "Büro içi notu görür ve yazar"],
    ["Bilgi", "emsal", "Emsal karar arar"],
    ["Bilgi", "kayit", "Dosyanın erişim kaydını görür"],
    ["Müvekkil", "muvekkilKayit", "Müvekkil kaydı açar (çatışma kontrolüyle)"],
    ["Müvekkil", "muvekkilOnay", "Çatışmalı kaydı gerekçeyle onaylar"],
    ["Para", "tutar", "Tutarları görür: dosya değeri, avans, bakiye"],
    ["Para", "masraf", "Masraf girer"],
    ["Para", "avans", "Müvekkilden avans ister"],
    ["Para", "ucret", "Ücret sözleşmesi ve taksitler"],
    ["Para", "finans", "Masraf ve tahsilat ekranı"],
    ["Yönetim", "rapor", "Raporlar"]
  ];
  var ROLLER = ["ortak", "avukat", "stajyer", "sekreter", "muhasebe"];
  var ROL_AD = { ortak: "Ortak", avukat: "Avukat", stajyer: "Stajyer", sekreter: "Sekreter", muhasebe: "Muhasebe", muvekkil: "Müvekkil" };
  function izin(roller) { var o = {}; roller.split(" ").forEach(function (k) { o[k] = true; }); return o; }
  var CAN = {
    ortak: izin("tumDosya dosyaIcerik takvim teblig sureKapat gorev dilekceGor dilekceYaz dilekceOnay dilekceGonder not emsal kayit muvekkilKayit muvekkilOnay tutar masraf avans ucret finans rapor"),
    avukat: izin("dosyaIcerik takvim teblig sureKapat gorev dilekceGor dilekceYaz dilekceGonder not emsal kayit muvekkilKayit tutar masraf avans ucret"),
    stajyer: izin("dosyaIcerik takvim teblig gorev dilekceGor dilekceYaz emsal"),
    sekreter: izin("tumDosya dosyaIcerik takvim teblig gorev muvekkilKayit masraf"),
    muhasebe: izin("tumDosya tutar masraf avans ucret finans sadeceFinans")
  };
  function can(k) { return !!(me && CAN[me.rol] && CAN[me.rol][k]); }
  function sf() { return can("sadeceFinans"); }
  function kimde(k) { return ROLLER.filter(function (r) { return CAN[r][k]; }).map(function (r) { return ROL_AD[r]; }).join(", ") || "kimse"; }
  var yetkiDenemesi = {};
  function yetkisiz(neyi, fid) { var key = me.id + neyi + (fid || ""); if (yetkiDenemesi[key]) return; yetkiDenemesi[key] = 1; log("Yetkisiz erişim denemesi: " + neyi, fid); save(); }
  function rolPill(u) { return '<span class="rolpill r-' + u.rol + '">' + ROL_AD[u.rol] + "</span>"; }
  function benimDosyalarim() {
    if (!me) return [];
    if (can("tumDosya")) return S.dosyalar;
    return S.dosyalar.filter(function (f) { return f.sorumlu === me.id || f.ekip.indexOf(me.id) >= 0; });
  }
  function erisir(f) { return f && benimDosyalarim().indexOf(f) >= 0; }
  function acikSureler(list) {
    var out = [];
    list.forEach(function (f) { f.sureler.forEach(function (s) { if (s.durum === "acik") out.push({ f: f, s: s }); }); });
    return out.sort(function (a, b) { return a.s.son < b.s.son ? -1 : 1; });
  }
  function durusmalar(list) {
    var out = [];
    list.forEach(function (f) { f.durusmalar.forEach(function (d) { out.push({ f: f, d: d }); }); });
    return out.sort(function (a, b) { return (a.d.tarih + a.d.saat) < (b.d.tarih + b.d.saat) ? -1 : 1; });
  }
  function onaydakiler() {
    var out = [];
    benimDosyalarim().forEach(function (f) { f.dilekceler.forEach(function (d) { out.push({ f: f, d: d }); }); });
    return out;
  }
  function gorevlerim() {
    var out = [];
    benimDosyalarim().forEach(function (f) { f.gorevler.forEach(function (g) { if (g.durum !== "tamam" && g.atanan === me.id) out.push({ f: f, g: g }); }); });
    return out.sort(function (a, b) { return a.g.son < b.g.son ? -1 : 1; });
  }
  function sureTamamlayabilir(f) { return can("sureKapat") && (me.rol === "ortak" || (f && f.sorumlu === me.id)); }

  /* ---------- gezinme (veri) ----------
     Yeni ekran eklemek için: NAV'a öğe, VIEWS'a görünüm, gerekirse GUARD'a yetki anahtarı.
     Örn. emsal: NAV.splice(4, 0, { id: "emsal", ad: "Emsal arama", ikon: "emsal", show: function () { return !sf(); } }); VIEWS.emsal = vEmsal; */
  var NAV = [
    { id: "bugun", ad: "Bugün", ikon: "bugun", mobil: true, show: function () { return !sf(); }, say: function () { return acikSureler(benimDosyalarim()).filter(function (x) { return gunFarki(x.s.son) <= 3; }).length; } },
    { id: "dosyalar", ad: "Dosyalar", ikon: "dosyalar", mobil: true, show: function () { return true; } },
    { id: "takvim", ad: "Takvim", ikon: "takvim", mobil: true, show: function () { return can("takvim"); } },
    { id: "sure", ad: "Süre hesaplayıcı", ikon: "sure", show: function () { return !sf(); } },
    { id: "muvekkiller", ad: "Müvekkiller", ikon: "muvekkiller", show: function () { return can("muvekkilKayit"); } },
    { id: "onay", ad: "Dilekçe onayı", ikon: "onay", show: function () { return can("dilekceGor"); }, say: function () { return can("dilekceOnay") ? onaydakiler().filter(function (x) { return x.d.durum === "onayda"; }).length : 0; } },
    { id: "finans", ad: "Masraf ve tahsilat", ikon: "finans", mobil: true, show: function () { return can("finans"); }, sfOnce: true },
    { id: "rapor", ad: "Raporlar", ikon: "rapor", show: function () { return can("rapor"); } },
    { id: "yetki", ad: "Yetkiler", ikon: "kilit", show: function () { return true; } }
  ];
  function navItems() {
    var l = NAV.filter(function (n) { return n.show(); });
    if (sf()) l.sort(function (a, b) { return (b.sfOnce ? 1 : 0) - (a.sfOnce ? 1 : 0); });
    return l;
  }
  var VIEWS = {}; // aşağıda dolduruluyor
  var GUARD = { finans: "finans", rapor: "rapor", muvekkiller: "muvekkilKayit", muvekkil: "muvekkilKayit", takvim: "takvim", onay: "dilekceGor" };
  var SF_PAGES = ["finans", "dosya", "dosyalar", "yetki"];

  /* ---------- yönlendirme ---------- */
  window.addEventListener("hashchange", render);
  function route() { var h = location.hash.replace(/^#\/?/, "").split("/"); return { p: h[0] || "", a: h[1] || "", t: h[2] || "" }; }
  var lastRoute = null;
  function render() {
    document.querySelectorAll(".modal.sheet").forEach(function (m) { if (m.close) m.close(); });
    if (!me) { lastRoute = null; return renderLogin(); }
    if (me.rol === "muvekkil") return renderPortal();
    var r = route(), p = r.p;
    var sfKapali = sf() && p && SF_PAGES.indexOf(p) < 0 && VIEWS[p];
    if (sf() && SF_PAGES.indexOf(p) < 0 && !sfKapali) p = "finans";
    if (!p) p = "bugun";
    var v = VIEWS[p] || vBugun;
    if (sfKapali || (GUARD[p] && !can(GUARD[p]))) { var gp = p; yetkisiz((NAV.filter(function (n) { return n.id === gp; })[0] || { ad: gp }).ad + " ekranı"); v = function () { return vYetkiYok(gp); }; }
    shell(p, v(r.a));
    var key = p + "/" + r.a;
    if (key !== lastRoute) { window.scrollTo(0, 0); lastRoute = key; } // satır içi eylemden sonra sayfa zıplamasın
  }

  function shell(active, html) {
    var nav = navItems();
    var a = active === "dosya" ? "dosyalar" : active === "muvekkil" ? "muvekkiller" : active;
    function link(n, cls) {
      var c = n.say ? n.say() : 0, on = a === n.id;
      return '<a href="#/' + n.id + '" class="' + (cls || "") + (on ? " on" : "") + '"' + (on ? ' aria-current="page"' : "") + ">" + ico(n.ikon) + '<span class="lbl">' + n.ad + "</span>" + (c ? '<span class="cnt" aria-label="' + c + ' acil">' + c + "</span>" : "") + "</a>";
    }
    var mob = nav.filter(function (n) { return n.mobil; }).slice(0, 3);
    app.innerHTML =
      '<a class="skip" href="#main" id="skipLink">İçeriğe geç</a>' +
      '<div class="shell"><aside class="side"><a class="brand" href="#/' + (sf() ? "finans" : "bugun") + '"><span class="brand-mark" aria-hidden="true">§</span><span class="brand-name">Büro</span></a>' +
      '<nav aria-label="Ana menü">' + nav.map(function (n) { return link(n); }).join("") + "</nav>" +
      '<div class="me"><div>' + rolPill(me) + "<b>" + esc(me.ad) + "</b><span>" + esc(me.rolAd) + '</span></div><button type="button" class="logout">Rol değiştir</button></div></aside>' +
      '<div class="col"><header class="topbar">' +
      '<a class="brand mbrand" href="#/' + (sf() ? "finans" : "bugun") + '" aria-label="Büro ana sayfa"><span class="brand-mark" aria-hidden="true">§</span></a>' +
      '<button type="button" class="qsearch" id="qsearch" aria-label="Hızlı arama: dosya, müvekkil, esas no (kısayol / ya da Ctrl+K)">' + ico("ara") + '<span class="ph-t">Dosya, müvekkil, esas no ara…</span><kbd>/</kbd></button>' +
      (yeniItems(null).length ? '<button type="button" class="btn pri newbtn" id="newBtn" aria-haspopup="dialog">' + ico("yeni") + '<span class="lbl">Yeni</span></button>' : "") +
      '<a class="rolbadge r-' + me.rol + '" href="#/yetki" title="Yetkilerimi gör">' + ico("kilit") + "<span>" + ROL_AD[me.rol] + "</span></a>" +
      "</header>" +
      '<main class="main" id="main" tabindex="-1">' + html + "</main></div></div>" +
      '<nav class="tabbar" aria-label="Alt menü">' + mob.map(function (n) { return link(n, "tb"); }).join("") +
      '<button type="button" class="tb" id="moreBtn" aria-haspopup="dialog">' + ico("menu") + '<span class="lbl">Menü</span></button></nav>';
    document.querySelectorAll(".logout").forEach(function (b) { b.onclick = logout; });
    document.getElementById("qsearch").onclick = function () { palette(); };
    var nb = document.getElementById("newBtn"); if (nb) nb.onclick = function () { yeniMenu(); };
    document.getElementById("moreBtn").onclick = moreMenu;
    document.getElementById("skipLink").onclick = function (e) { e.preventDefault(); document.getElementById("main").focus(); };
    bind();
  }
  function logout() { me = null; try { localStorage.removeItem(UKEY); } catch (e) {} location.hash = ""; render(); }
  var binders = [];
  function onBind(fn) { binders.push(fn); }
  function bind() { var b = binders; binders = []; b.forEach(function (fn) { fn(); }); bindActions(); }

  function moreMenu() {
    var nav = navItems(), r = route().p || "bugun";
    modal('<div class="sheet-h"><h3 id="mt">Menü</h3><button type="button" class="x" data-close aria-label="Kapat">✕</button></div><nav class="sheet-nav" aria-labelledby="mt">' +
      nav.map(function (n) { var c = n.say ? n.say() : 0; return '<a href="#/' + n.id + '" class="' + (r === n.id ? "on" : "") + '">' + ico(n.ikon) + "<span>" + n.ad + "</span>" + (c ? '<span class="cnt">' + c + "</span>" : "") + "</a>"; }).join("") +
      '</nav><div class="sheet-me"><div>' + rolPill(me) + "<b>" + esc(me.ad) + "</b><span>" + esc(me.rolAd) + '</span></div><button type="button" class="btn" id="mLogout">Rol değiştir</button></div>',
      function (m) { m.querySelector("#mLogout").onclick = function () { m.close(); logout(); }; m.querySelectorAll("nav a").forEach(function (a) { a.addEventListener("click", function () { m.close(); }); }); },
      { cls: "sheet", labelledby: "mt" });
  }

  /* ---------- giriş ---------- */
  function renderLogin() {
    var ozet = {
      ortak: [["Tüm dosyalar ve finans", "Dilekçe ve müvekkil onayı"], []],
      avukat: [["Kendi dosyaları, süre kapatma", "Emsal, ücret, avans"], ["Dilekçe onayı", "Raporlar"]],
      stajyer: [["Atandığı dosyalar", "Taslak yazar, onaya gönderir"], ["Tutarlar ve ücret", "Süre kapatma, notlar"]],
      sekreter: [["Tebligat, takvim, müvekkil kaydı", "Masraf girişi"], ["Dilekçe içeriği", "Notlar ve tutarlar"]],
      muhasebe: [["Masraf, avans, tahsilat"], ["Dosya içeriği", "Dilekçe ve notlar"]],
      muvekkil: [["Kendi dosyaları ve bakiyesi", "Avukatına mesaj, belge"], ["Büro içi her şey"]]
    };
    app.innerHTML = '<main class="login" id="main"><div class="login-in"><span class="brand"><span class="brand-mark" aria-hidden="true">§</span><span class="brand-name">Büro</span></span>' +
      '<p class="eyebrow">Hukuk büroları için yönetim platformu · demo</p><h1>Hiçbir süre kaçmasın, <span class="hl">her dosya tek ekranda.</span></h1>' +
      '<p class="lead">Bir rol seçin; şifre gerekmez. Her rol yalnız kendi yetkisindeki ekranları, sekmeleri ve tutarları görür.</p>' +
      '<div class="who">' + S.users.map(function (u) {
        var o = ozet[u.rol];
        return '<button type="button" data-u="' + u.id + '" class="role-card r-' + u.rol + '"><span class="rc-top">' + rolPill(u) + '<span class="rc-go" aria-hidden="true">→</span></span><b>' + esc(u.ad) + "</b><span class=\"rc-sub\">" + esc(u.rolAd) + '</span><ul class="rc-list">' +
          o[0].map(function (x) { return '<li class="ok">' + esc(x) + "</li>"; }).join("") + o[1].map(function (x) { return '<li class="no">' + esc(x) + "</li>"; }).join("") + "</ul></button>";
      }).join("") + "</div>" +
      '<p class="fine">Bu bir tanıtım demosudur. Kişi ve kurum adları, dosyalar ve tutarlar uydurmadır. Süre kuralları ve tatil listesi taslaktır; gerçek kullanımdan önce bir avukat tarafından doğrulanmalıdır.</p></div></main>';
    app.querySelectorAll("[data-u]").forEach(function (b) {
      b.onclick = function () { me = user(b.getAttribute("data-u")); try { localStorage.setItem(UKEY, me.id); } catch (e) {} location.hash = me.rol === "muhasebe" ? "#/finans" : (me.rol === "muvekkil" ? "#/portal" : "#/bugun"); render(); };
    });
  }

  function vYetkiYok(p) {
    var k = GUARD[p] || "dosyaIcerik", n = (NAV.filter(function (x) { return x.id === p; })[0] || { ad: "Bu ekran" }).ad;
    return '<div class="lockpage"><span class="lock-ico">' + ico("kilit") + '</span><p class="eyebrow">Yetki yok</p><h1>' + esc(n) + " " + esc(ROL_AD[me.rol].toLocaleLowerCase("tr")) + ' rolüne kapalı</h1><p>Bu ekranı görebilenler: <b>' + esc(kimde(k)) + '</b>. Deneme erişim kaydına yazıldı.</p><div class="row-acts"><a class="btn pri go" href="#/' + (sf() ? "finans" : "bugun") + '">Ana ekrana dön</a><a class="btn" href="#/yetki">Yetkilerimi gör</a></div></div>';
  }
  function vYetki() {
    var gruplar = [];
    YETKI.forEach(function (y) { if (gruplar.indexOf(y[0]) < 0) gruplar.push(y[0]); });
    var benim = YETKI.filter(function (y) { return CAN[me.rol][y[1]]; }).length;
    var h = '<div class="ph"><div><p class="eyebrow">Rol: ' + ROL_AD[me.rol] + '</p><h1>Yetkiler</h1><p>' + YETKI.length + " yetkiden " + benim + " tanesi sizde. Matris büro sahibi tarafından yönetilir; demoda salt okunur.</p></div></div>";
    h += '<div class="card flush"><div class="tbl-wrap"><table class="tbl matris"><thead><tr><th>Yetki</th>' + ROLLER.map(function (r) { return '<th class="c' + (r === me.rol ? " ben" : "") + '">' + ROL_AD[r] + (r === me.rol ? ' <span class="sr-only">(siz)</span>' : "") + "</th>"; }).join("") + "</tr></thead><tbody>";
    gruplar.forEach(function (g) {
      h += '<tr class="grp"><td colspan="' + (ROLLER.length + 1) + '">' + g + "</td></tr>";
      YETKI.filter(function (y) { return y[0] === g; }).forEach(function (y) {
        h += "<tr><td>" + esc(y[2]) + "</td>" + ROLLER.map(function (r) { var v = !!CAN[r][y[1]]; return '<td class="c' + (r === me.rol ? " ben" : "") + '">' + (v ? '<span class="yv var" aria-label="var">✓</span>' : '<span class="yv yok" aria-label="yok">–</span>') + "</td>"; }).join("") + "</tr>";
      });
    });
    h += '</tbody></table></div></div>';
    var var_ = YETKI.filter(function (y) { return CAN[me.rol][y[1]]; }), yok = YETKI.filter(function (y) { return !CAN[me.rol][y[1]]; });
    h += '<div class="ymob"><section class="card flush"><div class="sec-h"><h2>Sizde olan (' + var_.length + ')</h2></div><ul class="list">' + var_.map(function (y) { return '<li><span class="yv var" aria-hidden="true">✓</span><div class="grow">' + esc(y[2]) + "</div></li>"; }).join("") + "</ul></section>" +
      '<section class="card flush mt12"><div class="sec-h"><h2>Sizde olmayan (' + yok.length + ')</h2></div><ul class="list">' + yok.map(function (y) { return '<li><span class="yv yok" aria-hidden="true">–</span><div class="grow">' + esc(y[2]) + '<div class="s">Kimde: ' + esc(kimde(y[1])) + "</div></div></li>"; }).join("") + "</ul></section></div>";
    h += '<p class="faint sm mt12">Müvekkil portalı ayrı bir alandır: müvekkil yalnız kendi dosyalarının aşamasını, duruşmasını ve avans bakiyesini görür.</p>';
    return h;
  }

  /* ---------- ortak satır parçaları ---------- */
  function sec(id, baslik, sayi, govde, ek) {
    return '<section class="card flush" id="sec-' + id + '" aria-labelledby="h-' + id + '"><div class="sec-h"><h2 id="h-' + id + '">' + baslik + (sayi != null ? ' <span class="faint">(' + sayi + ")</span>" : "") + "</h2>" + (ek || "") + '</div><ul class="list">' + govde + "</ul></section>";
  }
  function bos(metin, eylem) { return '<li class="empty"><span>' + metin + "</span>" + (eylem || "") + "</li>"; }
  function sureRow(x, inline) {
    return '<li><div class="grow"><a class="t" href="#/dosya/' + x.f.id + '/sure">' + esc(rule(x.s.kuralId).ad) + '</a><div class="s">' + esc(client(x.f.muvekkilId).ad) + " · " + esc(x.f.mahkeme) + ' · <span class="mono">' + esc(x.f.esas) + '</span></div><div class="s">Son gün ' + kisaTarih(x.s.son) + " · " + esc(user(x.s.gorevli).ad) + '</div></div><div class="acts">' + chip(x.s.son) +
      (inline && sureTamamlayabilir(x.f) ? '<button class="btn sm" type="button" data-act="sure-tamam" data-f="' + x.f.id + '" data-id="' + x.s.id + '" aria-label="' + esc(rule(x.s.kuralId).ad) + ', ' + esc(client(x.f.muvekkilId).ad) + ': tamamlandı işaretle">Tamamlandı</button>' : "") + "</div></li>";
  }
  function gorevRow(f, g, dosyaGoster) {
    var bitti = g.durum === "tamam";
    return '<li><div class="grow"><b class="' + (bitti ? "gdone" : "") + '">' + esc(g.baslik) + '</b><div class="s">' + (dosyaGoster ? '<a href="#/dosya/' + f.id + '/gorev">' + esc(client(f.muvekkilId).ad) + " · " + esc(f.konu) + "</a> · " : "") + esc(user(g.atanan).ad) + " · son tarih " + kisaTarih(g.son) + '</div></div><div class="acts">' +
      (bitti ? chip(g.son, "tamam") : chip(g.son) + '<button class="btn sm" type="button" data-act="gorev-bitti" data-f="' + f.id + '" data-id="' + g.id + '" aria-label="' + esc(g.baslik) + ': bitti işaretle">Bitti</button>') + "</div></li>";
  }

  /* ---------- Bugün ---------- */
  var bugunTum = false, gorevTum = false;
  function vBugun() {
    var list = benimDosyalarim(), sur = acikSureler(list);
    var gecti = sur.filter(function (x) { return gunFarki(x.s.son) < 0; }).length, bugun = sur.filter(function (x) { return gunFarki(x.s.son) === 0; }).length;
    var hafta = sur.filter(function (x) { var g = gunFarki(x.s.son); return g >= 0 && g <= 7; }).length;
    var dur = durusmalar(list).filter(function (x) { var g = gunFarki(x.d.tarih); return g >= 0 && g <= 7; });
    var durBugun = dur.filter(function (x) { return gunFarki(x.d.tarih) === 0; }).length;
    var onay = onaydakiler().filter(function (x) { return x.d.durum === "onayda"; });
    var eksi = list.filter(function (f) { return bakiye(f) < 0; });
    var gor = gorevlerim();
    var saat = new Date().getHours(), selam = saat < 12 ? "Günaydın" : saat < 18 ? "İyi günler" : "İyi akşamlar";
    var h = '<div class="ph"><div><h1>' + selam + ", " + esc(me.ad.replace(/^(Av\.|Stj\. Av\.) /, "").split(" ")[0]) + '</h1><p>' + R.uzun(R.d(S.today)) + " · " + (can("tumDosya") ? "Büronun tamamı" : "Sorumlu olduğunuz " + list.length + " dosya") + "</p></div>" +
      '<a class="btn" href="#/sure">' + ico("sure") + "Süre hesapla</a></div>";
    function kpi(n, t, cls, hedef) { return '<button type="button" class="card kpi ' + cls + '" data-jump="' + hedef + '"><b>' + n + "</b><span>" + t + "</span></button>"; }
    h += '<div class="grid g4 kpis">' + kpi(gecti, "süresi geçmiş iş", gecti ? "red" : "", "sure") + kpi(bugun, "bugün son gün", bugun ? "red" : "", "sure") +
      kpi(hafta, "7 gün içinde biten süre", "amber", "sure") + kpi(dur.length, "7 gün içinde duruşma / toplantı" + (durBugun ? " · " + durBugun + " bugün" : ""), "", "durusma") + "</div>";
    if (gecti) h += '<div class="danger" role="alert"><b>' + gecti + " süre geçmiş görünüyor.</b> Gerçek kullanımda süre tamamlandı işaretlenmeden kapanmaz; ortak ve sorumlu avukata her sabah bildirim gider.</div>";
    h += '<div class="grid g2">';
    var sGoster = bugunTum ? sur : sur.slice(0, 8);
    h += sec("sure", "Süreler", sur.length, sGoster.map(function (x) { return sureRow(x, true); }).join("") || bos("Açık süre yok.", can("teblig") ? '<button class="btn sm" type="button" data-new="teblig">Tebligat kaydet</button>' : ""),
      sur.length > 8 ? '<button type="button" class="linkbtn" id="sureTum">' + (bugunTum ? "Daha az" : "Tümü (" + sur.length + ")") + "</button>" : "");
    h += sec("durusma", "Önümüzdeki 7 gün: duruşmalar", dur.length, dur.slice(0, 8).map(function (x) {
      var g = gunFarki(x.d.tarih);
      return '<li class="' + (g === 0 ? "today" : "") + '"><div class="when mono num">' + (g === 0 ? "<b>Bugün</b>" : g === 1 ? "Yarın" : kisaTarih(x.d.tarih).replace(/ \d{4}$/, "")) + '<br><span class="faint">' + x.d.saat + '</span></div><div class="grow"><a class="t" href="#/dosya/' + x.f.id + '/sure">' + esc(x.d.tur) + '</a><div class="s">' + esc(x.d.yer) + " · " + esc(client(x.f.muvekkilId).ad) + "</div></div></li>";
    }).join("") || bos("Bu hafta duruşma yok.", can("takvim") ? '<a class="btn sm" href="#/takvim">Takvimi aç</a>' : ""));
    if (can("gorev")) {
      h += sec("gorev", "Görevlerim", gor.length, (gorevTum ? gor : gor.slice(0, 8)).map(function (x) { return gorevRow(x.f, x.g, true); }).join("") || bos("Size atanmış açık görev yok.", faShow("gorev") ? '<button class="btn sm" type="button" data-new="gorev">Görev ekle</button>' : ""),
        gor.length > 8 ? '<button type="button" class="linkbtn" id="gorevTum">' + (gorevTum ? "Daha az" : "Tümü (" + gor.length + ")") + "</button>" : "");
    }
    if (can("dilekceGor")) {
      var dl = can("dilekceOnay") ? onay : onaydakiler().filter(function (x) { return x.d.yazan === me.id && x.d.durum !== "gonderildi"; });
      h += sec("dilekce", can("dilekceOnay") ? "Onayınızı bekleyen dilekçeler" : "Dilekçelerim", dl.length, dl.slice(0, 6).map(function (x) { return dilekceRow(x.f, x.d); }).join("") || bos("Bekleyen dilekçe yok.", can("dilekceOnay") ? "" : '<button class="btn sm" type="button" data-new="dilekce">Taslak oluştur</button>'));
    }
    if (can("muvekkilOnay") && S.muvekkilTalep.length) {
      h += sec("muvtalep", "Onayınızı bekleyen müvekkil kayıtları", S.muvekkilTalep.length, S.muvekkilTalep.map(function (t) {
        return '<li><div class="grow"><b>' + esc(t.ad) + '</b><div class="s">' + t.catisma + " olası çatışma · isteyen " + esc(user(t.isteyen).ad) + " · " + kisaTarih(t.tarih) + '</div></div><div class="acts"><button class="btn sm ok" type="button" data-act="muv-onay" data-id="' + t.id + '">Onayla</button><button class="btn sm" type="button" data-act="muv-red" data-id="' + t.id + '">Reddet</button></div></li>';
      }).join(""));
    }
    if (can("avans") && can("tutar")) {
      h += sec("eksi", "Avansı eksiye düşen dosyalar", eksi.length, eksi.map(function (f) {
        return '<li><div class="grow"><a class="t" href="#/dosya/' + f.id + '/masraf">' + esc(client(f.muvekkilId).ad) + '</a><div class="s">' + esc(f.konu) + " · " + f.no + '</div></div><div class="acts"><span class="neg num">' + tl(bakiye(f)) + '</span><button class="btn sm" type="button" data-act="avans" data-f="' + f.id + '" aria-label="' + esc(client(f.muvekkilId).ad) + ': avans iste">Avans iste</button></div></li>';
      }).join("") || bos("Tüm avanslar yeterli."));
    }
    onBind(function () {
      document.querySelectorAll("[data-jump]").forEach(function (b) { b.onclick = function () { var el = document.getElementById("sec-" + b.getAttribute("data-jump")); if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); var t = el.querySelector("h2"); if (t) { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); } } }; });
      var st = document.getElementById("sureTum"); if (st) st.onclick = function () { bugunTum = !bugunTum; render(); };
      var gt = document.getElementById("gorevTum"); if (gt) gt.onclick = function () { gorevTum = !gorevTum; render(); };
    });
    return h + "</div>";
  }
  function durumChip(d) {
    var m = { taslak: ["u-ileri", "Taslak"], onayda: ["u-yakin", "Onay bekliyor"], onaylandi: ["u-hafta", "Onaylandı"], gonderildi: ["u-tamam", "UYAP'a gönderildi"], iade: ["u-bugun", "Düzeltme istendi"] }[d];
    return '<span class="chip ' + m[0] + '">' + m[1] + "</span>";
  }

  /* ---------- Dosyalar ---------- */
  var filt = { q: "", tur: "", sorumlu: "" };
  function dosyaFiltre() {
    var toks = trNorm(filt.q).split(" ").filter(Boolean);
    return benimDosyalarim().filter(function (f) {
      if ((filt.tur && f.tur !== filt.tur) || (filt.sorumlu && f.sorumlu !== filt.sorumlu)) return false;
      var hay = trNorm(client(f.muvekkilId).ad + " " + f.karsi + " " + f.esas + " " + f.no + " " + f.konu + " " + f.mahkeme);
      return toks.every(function (t) { return hay.indexOf(t) >= 0; });
    });
  }
  function dosyaSatirlari(list) {
    return list.map(function (f) {
      var s = f.sureler.filter(function (x) { return x.durum === "acik"; })[0];
      return '<tr class="click" data-f="' + f.id + '"><td>' + tag(f.tur) + '<div class="mt4"><a class="rowlink" href="#/dosya/' + f.id + (sf() ? "/masraf" : "") + '"><b>' + esc(f.konu) + '</b></a></div><div class="faint mono">' + f.no + '</div></td><td data-l="Müvekkil">' + esc(client(f.muvekkilId).ad) + '<div class="faint">' + esc(f.sifat) + (f.karsi !== "—" ? " · karşı: " + esc(f.karsi) : "") + '</div></td><td data-l="Mahkeme">' + esc(f.mahkeme) + '<div class="mono faint">' + esc(f.esas) + '</div></td><td data-l="Sorumlu">' + esc(user(f.sorumlu).ad) + '</td>' + (can("dosyaIcerik") ? '<td data-l="Sıradaki süre">' + (s ? chip(s.son) + '<div class="faint sm">' + esc(rule(s.kuralId).ad) + "</div>" : '<span class="faint">—</span>') + "</td>" : '<td class="r num ' + (bakiye(f) < 0 ? "neg" : "") + '" data-l="Avans bakiyesi">' + tl(bakiye(f)) + "</td>") + "</tr>";
    }).join("") || '<tr><td colspan="5" class="empty">Eşleşen dosya yok. <button type="button" class="linkbtn" id="filtTemizle">Filtreleri temizle</button></td></tr>';
  }
  function vDosyalar() {
    var list = dosyaFiltre();
    var h = '<div class="ph"><div><h1>Dosyalar</h1><p id="dsay">' + list.length + " dosya" + (can("tumDosya") ? "" : " · yalnızca sorumlu olduğunuz ya da ekibinde olduğunuz dosyalar") + "</p></div></div>";
    h += '<div class="filters" role="search"><label class="sr-only" for="fq">Dosyalarda ara</label><input id="fq" type="search" placeholder="Müvekkil, karşı taraf, esas no…" value="' + esc(filt.q) + '" class="grow1">' +
      '<label class="sr-only" for="ft">Tür</label><select id="ft"><option value="">Tüm türler</option>' + ["dava", "icra", "arabuluculuk", "danismanlik"].map(function (t) { return '<option value="' + t + '"' + (filt.tur === t ? " selected" : "") + ">" + turAd(t) + "</option>"; }).join("") + "</select>" +
      (can("tumDosya") ? '<label class="sr-only" for="fs">Sorumlu</label><select id="fs"><option value="">Tüm avukatlar</option>' + ["u1", "u2", "u3"].map(function (u) { return '<option value="' + u + '"' + (filt.sorumlu === u ? " selected" : "") + ">" + esc(user(u).ad) + "</option>"; }).join("") + "</select>" : "") + "</div>";
    h += '<div class="card flush"><div class="tbl-wrap"><table class="tbl cards"><thead><tr><th>Dosya</th><th>Müvekkil / karşı taraf</th><th>Mahkeme · esas</th><th>Sorumlu</th>' + (can("dosyaIcerik") ? "<th>Sıradaki süre</th>" : '<th class="r">Avans bakiyesi</th>') + '</tr></thead><tbody id="dbody">' + dosyaSatirlari(list) + "</tbody></table></div></div>";
    onBind(function () {
      function yenile() { // sayfayı değil yalnızca tabloyu yenile: odak ve kaydırma korunur
        var l = dosyaFiltre(); document.getElementById("dbody").innerHTML = dosyaSatirlari(l);
        document.getElementById("dsay").textContent = l.length + " dosya" + (can("tumDosya") ? "" : " · yalnızca sorumlu olduğunuz ya da ekibinde olduğunuz dosyalar");
        bindRows();
      }
      function bindRows() {
        document.querySelectorAll("tr[data-f]").forEach(function (tr) { tr.onclick = function (e) { if (e.target.closest("a,button")) return; location.hash = "#/dosya/" + tr.getAttribute("data-f") + (sf() ? "/masraf" : ""); }; });
        var ft = document.getElementById("filtTemizle"); if (ft) ft.onclick = function () { filt = { q: "", tur: "", sorumlu: "" }; render(); };
      }
      var q = document.getElementById("fq");
      q.oninput = function () { filt.q = q.value; yenile(); };
      document.getElementById("ft").onchange = function (e) { filt.tur = e.target.value; yenile(); };
      var fs = document.getElementById("fs"); if (fs) fs.onchange = function (e) { filt.sorumlu = e.target.value; yenile(); };
      bindRows();
    });
    return h;
  }

  /* ---------- Dosya kartı ----------
     Sekmeler veri olarak: yeni sekme için TABS'a { id, ad, show(f), body(f), bind(f) } eklenir.
     Örn. emsal: TABS.splice(4, 0, { id: "emsal", ad: "Emsal kararlar", show: function () { return !sf(); }, body: emsalTab, bind: bindEmsal }); */
  var TABS = [
    { id: "ozet", ad: "Zaman çizelgesi", show: function () { return can("dosyaIcerik"); } },
    { id: "sure", ad: "Süreler ve duruşmalar", show: function () { return can("dosyaIcerik"); } },
    { id: "gorev", ad: "Görevler", show: function () { return can("dosyaIcerik"); } },
    { id: "dilekce", ad: "Dilekçeler", show: function () { return can("dilekceGor"); } },
    { id: "masraf", ad: "Masraf ve avans", show: function () { return can("masraf") || can("finans"); } },
    { id: "ucret", ad: "Ücret", show: function () { return can("ucret"); } },
    { id: "not", ad: "Büro içi not", show: function () { return can("not"); } },
    { id: "kayit", ad: "Erişim kaydı", show: function () { return can("kayit"); } }
  ];
  /* Dosya üzerinde hızlı eylemler: dosya başlığında, hızlı aramada ve "+ Yeni" menüsünde kullanılır. */
  var FILE_ACTIONS = [
    { id: "teblig", ad: "Tebligat kaydet", kisa: "Tebligat", show: function () { return can("teblig"); }, run: function (f) { tebligModal(f); } },
    { id: "masraf", ad: "Masraf ekle", kisa: "Masraf", show: function () { return can("masraf"); }, run: function (f) { masrafModal(f); } },
    { id: "gorev", ad: "Görev ekle", kisa: "Görev", show: function () { return can("gorev"); }, run: function (f) { gorevModal(f); } },
    { id: "dilekce", ad: "Dilekçe taslağı", kisa: "Dilekçe", show: function () { return can("dilekceYaz"); }, run: function (f) { dilekceTaslak(f); }, aramada: false }
  ];
  function faShow(id) { var a = FILE_ACTIONS.filter(function (x) { return x.id === id; })[0]; return !!(a && a.show()); }
  function fileActions(yer) { return FILE_ACTIONS.filter(function (a) { return a.show() && !(yer === "arama" && a.aramada === false); }); }
  var tab = "ozet", sonGoruntulenen = null;
  function vDosya(id) {
    var parts = location.hash.split("/"); if (parts[3]) tab = parts[3];
    var f = dosya(id);
    if (!erisir(f)) return '<div class="ph"><div><h1>Dosya bulunamadı</h1><p>Bu dosya size atanmamış olabilir.</p></div></div><button type="button" class="btn pri" id="nfAra">' + ico("ara") + "Dosya ara</button>" + (function () { onBind(function () { document.getElementById("nfAra").onclick = function () { palette(); }; }); return ""; })();
    var c = client(f.muvekkilId);
    var tabs = TABS.filter(function (t) { return t.show(f); }), kapali = null;
    if (!tabs.some(function (t) { return t.id === tab; })) { var ist = TABS.filter(function (t) { return t.id === tab; })[0]; if (ist && parts[3] === tab) { kapali = ist.ad; yetkisiz(ist.ad + " sekmesi", f.id); } tab = tabs[0].id; }
    var acts = fileActions("dosya");
    var h = '<a href="#/dosyalar" class="back">← Dosyalar</a><div class="fhead"><div>' + tag(f.tur) + ' <span class="tag">' + esc(f.durum) + "</span><h1>" + esc(c.ad) + " · " + esc(f.konu) + '</h1><div class="muted"><span class="mono">' + f.no + "</span> · " + esc(f.mahkeme) + (f.esas !== "—" ? ' · <span class="mono">' + esc(f.esas) + "</span>" : "") + "</div></div>" +
      '<div class="facts-acts" role="group" aria-label="Dosya eylemleri">' + acts.map(function (a, i) { return '<button class="btn' + (i === 0 ? " pri" : "") + '" type="button" data-fa="' + a.id + '">' + a.ad + "</button>"; }).join("") + "</div></div>";
    h += (kapali ? '<div class="lockline">' + ico("kilit") + '<span><b>' + esc(kapali) + "</b> sekmesi " + esc(ROL_AD[me.rol].toLocaleLowerCase("tr")) + " rolüne kapalı; deneme erişim kaydına yazıldı.</span></div>" : "") + '<div class="facts"><div><span>Müvekkil</span><b>' + (can("muvekkilKayit") ? '<a href="#/muvekkil/' + c.id + '">' + esc(c.ad) + "</a>" : esc(c.ad)) + '</b> <span class="faint">(' + esc(f.sifat) + ")</span></div><div><span>Karşı taraf</span><b>" + esc(f.karsi) + "</b></div><div><span>Sorumlu</span><b>" + esc(user(f.sorumlu).ad) + "</b>" + (f.ekip.length ? '<div class="faint">Ekip: ' + f.ekip.map(function (u) { return esc(user(u).ad); }).join(", ") + "</div>" : "") + '</div>' + (can("tutar") ? '<div><span>Dosya değeri</span><b class="num">' + (f.deger ? tl(f.deger) : "—") + "</b></div>" : "") + "<div><span>Açılış</span><b>" + kisaTarih(f.acilis) + "</b></div></div>";
    h += '<div class="tabs" role="tablist" aria-label="Dosya bölümleri">' + tabs.map(function (t) { var on = tab === t.id; return '<button type="button" role="tab" id="tab-' + t.id + '" aria-controls="tabBody" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" class="' + (on ? "on" : "") + '" data-tab="' + t.id + '">' + t.ad + "</button>"; }).join("") + "</div>";
    h += '<div id="tabBody" role="tabpanel" aria-labelledby="tab-' + tab + '" tabindex="0">' + tabBody(f) + "</div>";
    onBind(function () {
      var tbs = Array.prototype.slice.call(document.querySelectorAll("[data-tab]"));
      tbs.forEach(function (b, i) {
        b.onclick = function () { tab = b.getAttribute("data-tab"); history.replaceState(null, "", "#/dosya/" + f.id + "/" + tab); render(); var n = document.getElementById("tab-" + tab); if (n) n.focus(); };
        b.onkeydown = function (e) { var j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? tbs.length - 1 : null; if (j == null) return; e.preventDefault(); tbs[(j + tbs.length) % tbs.length].click(); };
      });
      document.querySelectorAll("[data-fa]").forEach(function (b) { b.onclick = function () { runFileAction(b.getAttribute("data-fa"), f); }; });
      bindTab(f);
    });
    if (sonGoruntulenen !== f.id + me.id) { log("Dosyayı görüntüledi", f.id); sonGoruntulenen = f.id + me.id; } // her yeniden çizimde değil, açılışta kaydet
    return h;
  }
  function runFileAction(id, f) { var a = FILE_ACTIONS.filter(function (x) { return x.id === id; })[0]; if (a && a.show() && erisir(f)) a.run(f); }

  function tabBody(f) {
    var t = TABS.filter(function (x) { return x.id === tab; })[0];
    if (t && t.body) return t.body(f);
    if (tab === "ozet") {
      return '<ul class="timeline">' + f.olaylar.slice().sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; }).map(function (o) { return '<li class="' + o.tur + '"><div class="d">' + kisaTarih(o.tarih) + "</div>" + esc(o.metin) + "</li>"; }).join("") + "</ul>";
    }
    if (tab === "sure") {
      var h = '<div class="grid g2"><section class="card flush"><div class="sec-h"><h2>Süreler</h2>' + (can("teblig") ? '<button class="btn sm" type="button" data-fa="teblig">+ Tebligat</button>' : "") + '</div><ul class="list">' +
        (f.sureler.map(function (s) {
          return '<li><div class="grow"><b>' + esc(rule(s.kuralId).ad) + '</b><div class="s">Tebliğ ' + kisaTarih(s.teblig) + " → son gün <b>" + kisaTarih(s.son) + "</b> · " + esc(rule(s.kuralId).kaynak) + '</div><div class="s">Sorumlu: ' + esc(user(s.gorevli).ad) + '</div></div><div class="acts col">' + chip(s.son, s.durum) + (s.durum === "acik" && sureTamamlayabilir(f) ? '<button class="btn sm" type="button" data-act="sure-tamam" data-f="' + f.id + '" data-id="' + s.id + '">Tamamlandı</button>' : "") + "</div></li>";
        }).join("") || bos("Bu dosyada süre yok.", can("teblig") ? '<button class="btn sm" type="button" data-fa="teblig">Tebligat kaydet</button>' : "")) + "</ul></section>";
      h += '<section class="card flush"><div class="sec-h"><h2>Duruşma ve toplantılar</h2></div><ul class="list">' +
        (f.durusmalar.map(function (d) { return '<li><div class="when mono num">' + kisaTarih(d.tarih) + '<br><span class="faint">' + d.saat + '</span></div><div class="grow"><b>' + esc(d.tur) + '</b><div class="s">' + esc(d.yer) + "</div></div></li>"; }).join("") || bos("Planlanmış duruşma yok.")) + "</ul></section></div>";
      return h;
    }
    if (tab === "gorev") {
      return '<div class="card flush"><div class="sec-h"><h2>Görevler</h2>' + (faShow("gorev") ? '<button class="btn sm" type="button" data-fa="gorev">+ Görev</button>' : "") + '</div><ul class="list">' + (f.gorevler.map(function (g) { return gorevRow(f, g, false); }).join("") || bos("Görev yok.", faShow("gorev") ? '<button class="btn sm" type="button" data-fa="gorev">Görev ekle</button>' : "")) + "</ul></div>";
    }
    if (tab === "dilekce") {
      var yaz = faShow("dilekce");
      return '<div class="card flush"><div class="sec-h"><h2>Dilekçeler</h2>' + (yaz && f.dilekceler.length ? '<button class="btn sm" type="button" data-fa="dilekce">+ Şablondan taslak</button>' : "") + '</div><ul class="list">' + (f.dilekceler.map(function (d) { return dilekceRow(f, d); }).join("") || bos("Bu dosyada dilekçe yok.", yaz ? '<button class="btn sm pri" type="button" data-fa="dilekce">Şablondan taslak oluştur</button>' : "")) + "</ul></div>";
    }
    if (tab === "masraf") {
      var hr = harcanan(f), b = bakiye(f), h3 = "";
      if (can("tutar")) h3 += '<div class="grid g4 kpis"><div class="card kpi static"><b class="num">' + tl(f.avansAlinan) + '</b><span>alınan avans</span></div><div class="card kpi static"><b class="num">' + tl(hr) + '</b><span>harcanan</span></div><div class="card kpi static ' + (b < 0 ? "red" : "") + '"><b class="num">' + tl(b) + "</b><span>avans bakiyesi</span></div></div>";
      else h3 += '<div class="lockline">' + ico("kilit") + "<span>Avans ve bakiye tutarları " + esc(ROL_AD[me.rol].toLocaleLowerCase("tr")) + " rolüne kapalı; masraf girebilirsiniz.</span></div>";
      if (b < 0 && can("avans") && can("tutar")) h3 += '<div class="danger row">Avans bakiyesi eksiye düştü. <button class="btn sm" type="button" data-act="avans" data-f="' + f.id + '">Müvekkilden avans iste</button></div>';
      h3 += '<section class="card" aria-labelledby="mfh"><h2 id="mfh">Masraf ekle</h2>' + masrafForm(f, "t") + "</section>";
      h3 += '<div class="card flush mt14"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tarih</th><th>Masraf</th><th class="r">Tutar</th></tr></thead><tbody>' + f.masraflar.slice().sort(function (a, b) { return a.tarih < b.tarih ? 1 : -1; }).map(function (m) { return "<tr><td>" + kisaTarih(m.tarih) + "</td><td>" + esc(m.tur) + '</td><td class="r num">' + tl(m.tutar) + "</td></tr>"; }).join("") + "</tbody></table></div></div>";
      return h3;
    }
    if (tab === "ucret") {
      var u = f.ucret;
      return '<div class="card"><h2>Ücret sözleşmesi: ' + esc(u.tip) + "</h2>" + (u.toplam ? '<p>Toplam: <b class="num">' + tl(u.toplam) + "</b></p>" : '<p>Saatlik ücret: <b class="num">' + tl(u.saatlik) + "</b></p>") +
        (u.taksitler.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Vade</th><th class="r">Tutar</th><th>Durum</th></tr></thead><tbody>' + u.taksitler.map(function (t) { return "<tr><td>" + kisaTarih(t.vade) + '</td><td class="r num">' + tl(t.tutar) + "</td><td>" + (t.odendi ? '<span class="chip u-tamam">Ödendi</span>' : chip(t.vade)) + "</td></tr>"; }).join("") + "</tbody></table></div>" : "") +
        (f.zaman.length ? '<h2 class="mt16">Zaman kaydı</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tarih</th><th>Kişi</th><th>İş</th><th class="r">Saat</th></tr></thead><tbody>' + f.zaman.map(function (z) { return "<tr><td>" + kisaTarih(z.tarih) + "</td><td>" + esc(user(z.kisi).ad) + "</td><td>" + esc(z.aciklama) + '</td><td class="r num">' + z.saat.toLocaleString("tr-TR") + "</td></tr>"; }).join("") + '</tbody></table></div><p class="muted">Bu dönem: <b class="num">' + f.zaman.reduce(function (a, z) { return a + z.saat; }, 0).toLocaleString("tr-TR") + " saat · " + tl(f.zaman.reduce(function (a, z) { return a + z.saat; }, 0) * (u.saatlik || 3500)) + "</b></p>" : "") +
        '<p class="faint sm">Makbuz sistemde kesilmez; tahsilatlar muhasebe programına ya da e-SMM sağlayıcısına aktarılır.</p></div>';
    }
    if (tab === "not") {
      return '<div class="card"><label for="notArea" class="faint sm block">Büro içi not. Sekreter, muhasebe ve müvekkil portalı bu alanı görmez. Yazdıkça kaydedilir.</label><textarea id="notArea" class="notarea">' + esc(f.notlar) + '</textarea><p class="faint sm" id="notDurum" aria-live="polite">Kaydedildi.</p></div>';
    }
    if (tab === "kayit") {
      var l = S.log.filter(function (x) { return x.dosyaId === f.id; }).slice(0, 15);
      return '<div class="card flush"><ul class="list">' + l.map(function (x) { return '<li><div class="grow"><b>' + esc(user(x.user).ad) + "</b> · " + esc(x.metin) + '<div class="s">' + new Date(x.ts).toLocaleString("tr-TR") + "</div></div></li>"; }).join("") + '</ul><p class="faint sm pad">Gerçek sürümde kayıtlar değiştirilemez; kim, ne zaman, neyi gördü ya da değiştirdi.</p></div>';
    }
    return "";
  }
  function dilekceRow(f, d) {
    var btns = "";
    if ((d.durum === "taslak" || d.durum === "iade") && can("dilekceYaz") && (d.yazan === me.id || me.rol === "ortak")) btns += '<button class="btn sm pri" type="button" data-dil="gonder" data-id="' + d.id + '" data-f="' + f.id + '">Onaya gönder</button>';
    if (d.durum === "onayda" && can("dilekceOnay")) btns += '<button class="btn sm ok" type="button" data-dil="onay" data-id="' + d.id + '" data-f="' + f.id + '">Onayla</button><button class="btn sm" type="button" data-dil="iade" data-id="' + d.id + '" data-f="' + f.id + '">Düzeltme iste</button>';
    if (d.durum === "onaylandi" && can("dilekceGonder")) btns += '<button class="btn sm" type="button" data-dil="uyap" data-id="' + d.id + '" data-f="' + f.id + '">UYAP\'a gönderildi</button>';
    return '<li><div class="grow"><b>' + esc(d.baslik) + '</b><div class="s"><a href="#/dosya/' + f.id + '/dilekce">' + esc(client(f.muvekkilId).ad) + " · " + esc(f.konu) + "</a> · hazırlayan " + esc(user(d.yazan).ad) + " · " + kisaTarih(d.tarih) + '</div></div><div class="acts">' + durumChip(d.durum) + btns + "</div></li>";
  }
  function bindDilekce() {
    document.querySelectorAll("[data-dil]").forEach(function (b) {
      b.onclick = function () {
        var f = dosya(b.getAttribute("data-f")), id = b.getAttribute("data-id"), a = b.getAttribute("data-dil");
        var gerek = { gonder: "dilekceYaz", onay: "dilekceOnay", iade: "dilekceOnay", uyap: "dilekceGonder" }[a];
        if (!can(gerek) || !erisir(f)) { yetkisiz("dilekçe işlemi", f && f.id); toast("Bu işlem rolünüze kapalı."); return; }
        var yeni = { gonder: "onayda", onay: "onaylandi", iade: "iade", uyap: "gonderildi" }[a];
        var metin = { gonder: "onaya gönderildi", onay: "onaylandı", iade: "için düzeltme istendi", uyap: "UYAP'tan gönderildi olarak işaretlendi" }[a];
        var baslik = f.dilekceler.filter(function (x) { return x.id === id; })[0].baslik;
        act(function () {
          var f2 = dosya(f.id), d = f2.dilekceler.filter(function (x) { return x.id === id; })[0];
          d.durum = yeni;
          f2.olaylar.push({ tarih: S.today, tur: "evrak", metin: d.baslik + " " + metin + " (" + me.ad + ")." });
          log(d.baslik + " " + metin, f2.id);
        }, baslik + " " + metin + ".");
      };
    });
  }
  /* Sayfadan bağımsız eylem düğmeleri (data-act, data-new, data-fa). Her çizimden sonra bağlanır. */
  function bindActions() {
    bindDilekce();
    document.querySelectorAll("[data-act]").forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        var a = b.getAttribute("data-act"), fid = b.getAttribute("data-f"), id = b.getAttribute("data-id");
        if (a === "sure-tamam") {
          if (!sureTamamlayabilir(dosya(fid))) { yetkisiz("süre kapatma", fid); return; }
          act(function () { var f = dosya(fid), s = f.sureler.filter(function (x) { return x.id === id; })[0]; s.durum = "tamam"; f.olaylar.push({ tarih: S.today, tur: "evrak", metin: rule(s.kuralId).ad + " yerine getirildi (" + me.ad + ")." }); log(rule(s.kuralId).ad + " tamamlandı", f.id); }, "Süre tamamlandı olarak işaretlendi.");
        } else if (a === "gorev-bitti") {
          if (!can("gorev")) { yetkisiz("görev kapatma", fid); return; }
          act(function () { var f = dosya(fid), g = f.gorevler.filter(function (x) { return x.id === id; })[0]; g.durum = "tamam"; log("Görev tamamlandı: " + g.baslik, f.id); }, "Görev tamamlandı.");
        } else if (a === "avans") {
          var f = dosya(fid); if (erisir(f) && can("avans")) avansModal(f); else yetkisiz("avans talebi", fid);
        } else if (a === "muv-onay" || a === "muv-red") {
          if (!can("muvekkilOnay")) { yetkisiz("müvekkil onayı"); return; }
          var t = S.muvekkilTalep.filter(function (x) { return x.id === id; })[0]; if (!t) return;
          act(function () {
            S.muvekkilTalep = S.muvekkilTalep.filter(function (x) { return x.id !== id; });
            if (a === "muv-onay") { S.muvekkiller.push({ id: nid("c"), ad: t.ad, tip: t.tip, yetkili: "", sehir: t.sehir }); log("Müvekkil kaydı ortak onayıyla açıldı: " + t.ad); }
            else log("Müvekkil kaydı reddedildi: " + t.ad);
          }, a === "muv-onay" ? t.ad + " müvekkil olarak kaydedildi." : t.ad + " kaydı reddedildi.");
        }
      };
    });
    document.querySelectorAll("[data-new]").forEach(function (b) { b.onclick = function () { yeniBaslat(b.getAttribute("data-new")); }; });
    document.querySelectorAll("#main [data-fa]").forEach(function (b) { if (!b.onclick) b.onclick = function () { var r = route(); runFileAction(b.getAttribute("data-fa"), dosya(r.a)); }; });
  }
  function bindTab(f) {
    var t = TABS.filter(function (x) { return x.id === tab; })[0];
    if (t && t.bind) t.bind(f);
    if (tab === "masraf") bindMasrafForm(document.getElementById("tabBody"), f, "t", null);
    var na = document.getElementById("notArea");
    if (na) { var tmr; na.oninput = function () { document.getElementById("notDurum").textContent = "Kaydediliyor…"; clearTimeout(tmr); tmr = setTimeout(function () { f.notlar = na.value; log("Büro içi not güncellendi", f.id); save(); document.getElementById("notDurum").textContent = "Kaydedildi."; }, 600); }; }
  }

  /* ---------- modal: odak tuzağı, Esc, odağı geri verme ---------- */
  function modal(html, after, o) {
    o = o || {};
    document.querySelectorAll(".modal").forEach(function (x) { if (x.close) x.close(true); else x.remove(); });
    var prev = document.activeElement;
    var m = document.createElement("div"); m.className = "modal " + (o.cls || "");
    m.innerHTML = '<div class="box" role="dialog" aria-modal="true"' + (o.labelledby ? ' aria-labelledby="' + o.labelledby + '"' : ' aria-label="' + esc(o.label || "İletişim kutusu") + '"') + ">" + html + "</div>";
    function k(e) {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      var fs = Array.prototype.filter.call(m.querySelectorAll("a[href],button:not([disabled]),input,select,textarea,summary,[tabindex]:not([tabindex='-1'])"), function (x) { return x.offsetParent !== null; });
      if (!fs.length) return;
      if (e.shiftKey && document.activeElement === fs[0]) { e.preventDefault(); fs[fs.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === fs[fs.length - 1]) { e.preventDefault(); fs[0].focus(); }
    }
    function close(sessiz) { if (!m.parentNode) return; m.remove(); document.removeEventListener("keydown", k, true); if (!sessiz && prev && prev.focus && document.contains(prev)) prev.focus(); }
    m.close = close;
    m.addEventListener("click", function (e) { if (e.target === m || (e.target.closest && e.target.closest("[data-close]"))) close(); });
    document.addEventListener("keydown", k, true);
    document.body.appendChild(m);
    if (after) after(m);
    var f = m.querySelector("[autofocus]") || m.querySelector("input,select,textarea,button"); if (f) f.focus();
    return m;
  }
  function mHead(id, baslik, alt) { return '<div class="mh"><div><h3 id="' + id + '">' + baslik + "</h3>" + (alt ? '<p class="muted">' + alt + "</p>" : "") + '</div><button type="button" class="x" data-close aria-label="Kapat">✕</button></div>'; }

  /* ---------- Tebligat: tarih + "seçim = kaydet" ---------- */
  function tebligKurallari(f) { return R.RULES.filter(function (r) { return f.tur === "icra" ? /icra|odeme|kambiyo/.test(r.id) : !/odeme|kambiyo|icra/.test(r.id); }); }
  function oneriKural(f) { // dosya türü ve durumuna göre en olası işlem
    if (f.tur === "icra") return f.durum === "İcra mahkemesi kararı" ? "icra-istinaf" : (/Kambiyo|Çek/.test(f.konu) ? "kambiyo" : "odeme-emri");
    if (/İmar/.test(f.konu)) return "idari-dava";
    if (/Vergi ziyaı/.test(f.konu)) return "vergi-dava";
    var m = { "Karar": "istinaf", "İstinafta": "temyiz", "Bilirkişide": "bilirkisi-itiraz" }[f.durum];
    if (m) return m;
    return f.sifat === "Davalı" ? "cevap" : "cevaba-cevap";
  }
  function tebligModal(f, hazir) {
    var opts = tebligKurallari(f), on = (hazir && hazir.k) || oneriKural(f);
    if (!opts.some(function (r) { return r.id === on; })) on = opts[0].id;
    var atanan = f.ekip[0] || f.sorumlu;
    modal(mHead("tmh", "Tebligat / evrak kaydet", esc(client(f.muvekkilId).ad) + " · " + esc(f.konu)) +
      '<div class="trow"><label class="field">Tebliğ tarihi<input type="date" id="tt" value="' + ((hazir && hazir.t) || S.today) + '" max="' + S.today + '"></label><div class="quick" role="group" aria-label="Hızlı tarih"><button type="button" class="btn sm" data-gun="0">Bugün</button><button type="button" class="btn sm" data-gun="-1">Dün</button></div></div>' +
      '<p class="lbl-s">Önerilen işlem <span class="faint">(dosya durumu: ' + esc(f.durum) + ")</span></p>" +
      '<button type="button" class="choice pri" id="tsave" data-k="' + on + '"></button>' +
      '<details class="why"><summary>Hesabın gerekçesi</summary><div id="tp" class="calc"></div></details>' +
      '<p class="lbl-s">Başka bir işlem seçin; seçtiğiniz anda kaydedilir</p><div class="choices" id="tdiger">' +
      opts.filter(function (r) { return r.id !== on; }).map(function (r) { return '<button type="button" class="choice" data-k="' + r.id + '"></button>'; }).join("") + "</div>" +
      '<p class="faint sm">Kayıt; süreyi, ' + esc(user(atanan).ad) + " adına hazırlık görevini ve zaman çizelgesi olayını birlikte oluşturur. Yanlışsa toast'taki <b>Geri al</b> ile geri alınır.</p>",
      function (m) {
        var tt = m.querySelector("#tt");
        function upd() {
          m.querySelectorAll(".choice").forEach(function (b) {
            var h = R.hesapla(b.getAttribute("data-k"), tt.value);
            b.innerHTML = h ? "<b>" + (b.id === "tsave" ? "Kaydet: " : "") + esc(rule(b.getAttribute("data-k")).ad) + '</b><span>son gün ' + kisaTarih(h.son) + " · " + esc(urg(h.son).t) + "</span>" : "<b>" + esc(rule(b.getAttribute("data-k")).ad) + "</b><span>Tarih seçin</span>";
            b.disabled = !h;
          });
          var h0 = R.hesapla(on, tt.value);
          m.querySelector("#tp").innerHTML = h0 ? "<ol>" + h0.adimlar.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ol>" : "";
        }
        tt.oninput = upd; tt.onchange = upd; upd();
        m.querySelectorAll("[data-gun]").forEach(function (b) { b.onclick = function () { tt.value = R.iso(R.add(R.d(S.today), +b.getAttribute("data-gun"))); upd(); }; });
        m.querySelectorAll(".choice").forEach(function (b) {
          b.onclick = function () {
            var k = b.getAttribute("data-k"), t = tt.value, h = R.hesapla(k, t); if (!h) return;
            m.close(true);
            sureKaydet(f, k, t);
          };
        });
      }, { labelledby: "tmh" });
  }

  /* Tebligattan doğan süre: süre + hazırlık görevi + zaman çizelgesi olayı, geri alınabilir. */
  function sureKaydet(f, k, t) {
    var h = R.hesapla(k, t); if (!h || !can("teblig") || !erisir(f)) return;
    var atanan = f.ekip[0] || f.sorumlu;
    act(function () {
      var f2 = dosya(f.id);
      f2.sureler.unshift({ id: nid("s"), kuralId: k, teblig: t, son: h.son, durum: "acik", gorevli: f2.sorumlu });
      f2.gorevler.unshift({ id: nid("g"), baslik: rule(k).ad + " hazırlığı", atanan: atanan, son: h.son, durum: "acik" });
      f2.olaylar.push({ tarih: t, tur: "teblig", metin: rule(k).ad + " süresini başlatan evrak tebliğ alındı (kaydeden " + me.ad + ")." });
      log("Tebligat kaydedildi, son gün " + h.son, f2.id);
      if (route().p === "dosya" && route().a === f.id) { tab = "sure"; history.replaceState(null, "", "#/dosya/" + f.id + "/sure"); }
    }, "Süre eklendi: " + rule(k).ad + ", son gün " + h.sonUzun + ". Görev " + user(atanan).ad + " adına açıldı.");
  }

  /* ---------- Masraf: tutar + "tür seç = kaydet" ---------- */
  function masrafTurleri(f) {
    var l = f.tur === "icra" ? ["Takip harcı", "Tebligat gideri", "Haciz yolluğu", "Muhafaza gideri"] : ["Tebligat gideri", "Bilirkişi ücreti", "Başvuru harcı", "Keşif gideri", "Tanık gideri"];
    var say = {}; f.masraflar.forEach(function (m) { say[m.tur] = (say[m.tur] || 0) + 1; });
    return l.slice().sort(function (a, b) { return (say[b] || 0) - (say[a] || 0); }); // en sık kullanılan öne
  }
  function masrafForm(f, p) {
    var tr = masrafTurleri(f);
    return '<div class="mform"><label class="field">Tutar (₺)<input id="' + p + 'Tut" type="number" min="1" step="1" inputmode="numeric" placeholder="Örn. 750" required aria-describedby="' + p + 'Err"></label><p class="err" id="' + p + 'Err" aria-live="polite"></p>' +
      '<p class="lbl-s">Türü seçin; seçtiğiniz anda kaydedilir</p><div class="choices row">' + tr.map(function (t, i) { return '<button type="button" class="btn' + (i === 0 ? " pri" : "") + '" data-mtur="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") + "</div></div>";
  }
  function bindMasrafForm(root, f, p, after) {
    var inp = root.querySelector("#" + p + "Tut"), err = root.querySelector("#" + p + "Err");
    function kaydet(tur) {
      var t = +inp.value;
      if (!(t > 0)) { err.textContent = "Önce tutarı yazın."; inp.setAttribute("aria-invalid", "true"); inp.focus(); return; }
      if (after) after();
      act(function () { var f2 = dosya(f.id); f2.masraflar.push({ tarih: S.today, tur: tur, tutar: Math.round(t) }); log("Masraf eklendi: " + tur + " " + tl(t), f2.id); }, tur + " " + tl(t) + " eklendi" + (can("tutar") ? "; avans bakiyesi " + tl(bakiye(f) - Math.round(t)) : "") + ".");
    }
    root.querySelectorAll("[data-mtur]").forEach(function (b) { b.onclick = function () { kaydet(b.getAttribute("data-mtur")); }; });
    inp.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); kaydet(root.querySelector("[data-mtur]").getAttribute("data-mtur")); } };
    inp.oninput = function () { err.textContent = ""; inp.removeAttribute("aria-invalid"); };
  }
  function masrafModal(f) {
    modal(mHead("mmh", "Masraf ekle", esc(client(f.muvekkilId).ad) + " · " + esc(f.konu) + (can("tutar") ? " · bakiye " + tl(bakiye(f)) : "")) + masrafForm(f, "m"), function (m) {
      bindMasrafForm(m, f, "m", function () { m.close(true); });
      m.querySelector("#mTut").setAttribute("autofocus", "");
    }, { labelledby: "mmh" });
  }

  /* ---------- Görev ---------- */
  function gorevModal(f) {
    var kisiler = [f.sorumlu].concat(f.ekip).concat(["u5"]).filter(function (x, i, a) { return a.indexOf(x) === i; });
    var vars = f.ekip[0] || f.sorumlu, son = R.iso(R.add(R.d(S.today), 7));
    modal(mHead("gmh", "Görev ekle", esc(client(f.muvekkilId).ad) + " · " + esc(f.konu)) +
      '<form id="gf" class="form one"><label class="field">Görev<input id="gB" required placeholder="Örn. Müvekkilden vekaletname aslını iste" autocomplete="off"></label>' +
      '<div class="quick" role="group" aria-label="Hazır görevler">' + ["Müvekkili bilgilendir", "Duruşmaya hazırlan", "Evrak aslını iste"].map(function (t) { return '<button type="button" class="btn sm" data-gs="' + t + '">' + t + "</button>"; }).join("") + "</div>" +
      '<div class="form two"><label class="field">Atanan<select id="gA">' + kisiler.map(function (u) { return '<option value="' + u + '"' + (u === vars ? " selected" : "") + ">" + esc(user(u).ad) + "</option>"; }).join("") + '</select></label><label class="field">Son tarih<input id="gS" type="date" value="' + son + '"></label></div>' +
      '<button class="btn pri wide go" type="submit">Görevi ekle</button></form>', function (m) {
      m.querySelectorAll("[data-gs]").forEach(function (b) { b.onclick = function () { m.querySelector("#gB").value = b.getAttribute("data-gs"); m.querySelector("#gf").requestSubmit(); }; });
      m.querySelector("#gf").onsubmit = function (e) {
        e.preventDefault(); var b = m.querySelector("#gB").value.trim(); if (!b) { m.querySelector("#gB").focus(); return; }
        var a = m.querySelector("#gA").value, s = m.querySelector("#gS").value || son; m.close(true);
        act(function () { var f2 = dosya(f.id); f2.gorevler.unshift({ id: nid("g"), baslik: b, atanan: a, son: s, durum: "acik" }); log("Görev eklendi: " + b, f2.id); }, "Görev eklendi: " + b + " (" + user(a).ad + ", " + kisaTarih(s) + ").");
      };
    }, { labelledby: "gmh" });
  }
  function dilekceTaslak(f) {
    act(function () { var f2 = dosya(f.id); f2.dilekceler.unshift({ id: nid("d"), baslik: "Beyan dilekçesi (şablondan)", yazan: me.id, durum: "taslak", tarih: S.today }); log("Şablondan dilekçe taslağı oluşturuldu", f2.id); }, "Taslak oluşturuldu: taraf, mahkeme ve esas no şablona yerleşti.");
  }

  function avansModal(f) {
    var c = client(f.muvekkilId), b = bakiye(f), ist = Math.ceil((-b + 5000) / 1000) * 1000;
    var txt = "Sayın " + (c.yetkili || c.ad) + ",\n\n" + f.konu + " dosyanızda (" + f.mahkeme + (f.esas !== "—" ? ", " + f.esas : "") + ") yapılan masraflar alınan avansı aşmıştır. Güncel bakiye " + tl(b) + ".\n\nDosyanın sürmesi için " + tl(ist) + " tutarında masraf avansının hesabımıza gönderilmesini rica ederiz. Masraf dökümü ektedir.\n\nSaygılarımızla,\n" + user(f.sorumlu).ad;
    modal(mHead("amh", "Avans talebi", esc(c.ad) + " · " + esc(f.konu)) + '<label class="sr-only" for="avTxt">Avans talebi metni</label><textarea id="avTxt">' + esc(txt) + '</textarea><p class="faint sm">Metin hazır; isterseniz düzenleyin. Gerçek sürümde e-posta ya da portal mesajı olarak gider.</p><button class="btn pri wide go" type="button" id="avGonder">Portala mesaj olarak gönder</button>', function (m) {
      m.querySelector("#avGonder").setAttribute("autofocus", "");
      m.querySelector("#avGonder").onclick = function () {
        m.close(true);
        act(function () { if (f.muvekkilId === "c1") S.portalMesaj.unshift({ tarih: S.today, kimden: user(f.sorumlu).ad, metin: "Masraf avansı talebi: " + tl(ist) + " (" + f.konu + ")" }); log("Avans talebi gönderildi", f.id); }, "Avans talebi (" + tl(ist) + ") müvekkilin portalına gönderildi.");
      };
    }, { labelledby: "amh" });
  }

  /* ---------- Hızlı arama (komut paleti) ---------- */
  function sonAcilanlar() {
    var seen = {}, out = [];
    S.log.forEach(function (x) { if (x.user === me.id && x.dosyaId && !seen[x.dosyaId]) { seen[x.dosyaId] = 1; var f = dosya(x.dosyaId); if (erisir(f)) out.push(f); } });
    return out.slice(0, 5);
  }
  function palette(o) {
    o = o || {};
    var pick = o.action ? (FILE_ACTIONS.filter(function (a) { return a.id === o.action; })[0] || (o.custom ? { ad: o.custom.ad, run: o.custom.run } : null)) : null;
    if (o.custom) pick = o.custom;
    modal('<div class="pal-in">' + ico("ara") + '<label class="sr-only" for="palq">' + (pick ? esc(pick.ad) + " için dosya ara" : "Dosya, müvekkil, esas no ya da ekran ara") + '</label><input id="palq" type="search" autocomplete="off" placeholder="' + (pick ? "Dosya seçin: müvekkil, esas no…" : "Dosya, müvekkil, esas no, ekran…") + '" aria-describedby="palsay"><button type="button" class="x" data-close aria-label="Kapat">Esc</button></div>' +
      (pick ? '<p class="pal-mode">' + esc(pick.ad) + ": dosyayı seçin</p>" : "") +
      '<p class="sr-only" id="palsay" aria-live="polite"></p><div class="pal-res" id="palres"></div><p class="pal-hint" aria-hidden="true">↑ ↓ gez · Enter aç · Esc kapat</p>',
      function (m) {
        var q = m.querySelector("#palq"), res = m.querySelector("#palres");
        function ciz() {
          var toks = trNorm(q.value).split(" ").filter(Boolean), h = "", n = 0;
          var fs;
          if (!toks.length) { fs = sonAcilanlar(); var baslik = "Son açtıklarınız"; if (!fs.length) { fs = acikSureler(benimDosyalarim()).map(function (x) { return x.f; }).filter(function (f, i, a) { return a.indexOf(f) === i; }).slice(0, 6); baslik = "Süresi yaklaşan dosyalar"; } h += '<h4>' + baslik + "</h4>"; }
          else {
            fs = benimDosyalarim().map(function (f) {
              var c = client(f.muvekkilId), hay = trNorm(c.ad + " " + (c.yetkili || "") + " " + f.karsi + " " + f.esas + " " + f.no + " " + f.konu + " " + f.mahkeme);
              if (!toks.every(function (t) { return hay.indexOf(t) >= 0; })) return null;
              var sk = (trNorm(c.ad).indexOf(toks[0]) === 0 ? 3 : 0) + (trNorm(f.esas + " " + f.no).indexOf(toks[0]) >= 0 ? 2 : 0);
              return { f: f, sk: sk };
            }).filter(Boolean).sort(function (a, b) { return b.sk - a.sk; }).slice(0, 8).map(function (x) { return x.f; });
            if (fs.length) h += "<h4>Dosyalar</h4>";
          }
          var acts = pick ? [] : fileActions("arama");
          h += '<ul class="pal-list">' + fs.map(function (f) {
            n++; var s = can("dosyaIcerik") ? f.sureler.filter(function (x) { return x.durum === "acik"; })[0] : null;
            return '<li><button type="button" class="pal-main" data-pf="' + f.id + '">' + tag(f.tur) + '<span class="pm-t"><b>' + esc(client(f.muvekkilId).ad) + "</b> · " + esc(f.konu) + '<small class="mono">' + f.no + (f.esas !== "—" ? " · " + esc(f.esas) : "") + " · " + esc(f.mahkeme) + "</small></span>" + (s ? chip(s.son) : "") + "</button>" +
              (acts.length ? '<div class="pal-acts">' + acts.map(function (a) { return '<button type="button" class="btn sm" data-pa="' + a.id + '" data-pf="' + f.id + '" aria-label="' + esc(a.ad) + ": " + esc(client(f.muvekkilId).ad) + " · " + esc(f.konu) + '">' + esc(a.kisa) + "</button>"; }).join("") + "</div>" : "") + "</li>";
          }).join("") + "</ul>";
          if (toks.length && !pick) {
            var cs = can("muvekkilKayit") ? S.muvekkiller.filter(function (c) { var hay = trNorm(c.ad + " " + (c.yetkili || "")); return toks.every(function (t) { return hay.indexOf(t) >= 0; }); }).slice(0, 4) : [];
            if (cs.length) { h += '<h4>Müvekkiller</h4><ul class="pal-list">' + cs.map(function (c) { n++; return '<li><button type="button" class="pal-main" data-pc="' + c.id + '"><span class="pm-t"><b>' + esc(c.ad) + "</b><small>" + (c.tip === "tuzel" ? "Tüzel kişi" : "Gerçek kişi") + " · " + esc(c.sehir) + "</small></span></button></li>"; }).join("") + "</ul>"; }
            var ek = navItems().filter(function (nv) { var a = trNorm(nv.ad); return toks.every(function (t) { return a.indexOf(t) >= 0; }); });
            if (ek.length) { h += '<h4>Ekranlar</h4><ul class="pal-list">' + ek.map(function (nv) { n++; return '<li><button type="button" class="pal-main" data-pn="' + nv.id + '">' + ico(nv.ikon) + '<span class="pm-t"><b>' + nv.ad + "</b></span></button></li>"; }).join("") + "</ul>"; }
          }
          if (!n) h += '<p class="empty">Sonuç yok. Müvekkil adı, esas no (ör. 2025/123) ya da dosya no (B-2025-001) deneyin.</p>';
          res.innerHTML = h;
          m.querySelector("#palsay").textContent = n + " sonuç";
          res.querySelectorAll(".pal-main").forEach(function (b) {
            b.onclick = function () {
              var fid = b.getAttribute("data-pf"), cid = b.getAttribute("data-pc"), nv = b.getAttribute("data-pn");
              m.close(true);
              if (fid && pick) pick.run(dosya(fid));
              else if (fid) location.hash = "#/dosya/" + fid + (sf() ? "/masraf" : "");
              else if (cid) location.hash = "#/muvekkil/" + cid;
              else if (nv) location.hash = "#/" + nv;
            };
          });
          res.querySelectorAll("[data-pa]").forEach(function (b) { b.onclick = function () { m.close(true); runFileAction(b.getAttribute("data-pa"), dosya(b.getAttribute("data-pf"))); }; });
        }
        q.oninput = ciz; ciz();
        q.onkeydown = function (e) {
          if (e.key === "Enter") { e.preventDefault(); var f = res.querySelector(".pal-main"); if (f) f.click(); }
          if (e.key === "ArrowDown") { e.preventDefault(); var g = res.querySelector(".pal-main"); if (g) g.focus(); }
        };
        res.onkeydown = function (e) {
          if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
          var l = Array.prototype.slice.call(res.querySelectorAll(".pal-main")), i = l.indexOf(document.activeElement.closest(".pal-main") || document.activeElement);
          e.preventDefault();
          if (e.key === "ArrowUp" && i <= 0) { q.focus(); return; }
          var n2 = l[Math.min(l.length - 1, i + (e.key === "ArrowDown" ? 1 : -1))]; if (n2) n2.focus();
        };
      }, { cls: "pal", label: pick ? pick.ad + ": dosya seçin" : "Hızlı arama" });
  }
  document.addEventListener("keydown", function (e) {
    if (!me || me.rol === "muvekkil" || document.querySelector(".modal")) return;
    var t = e.target, yaziyor = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); palette(); }
    else if (e.key === "/" && !yaziyor) { e.preventDefault(); palette(); }
  });

  /* ---------- "+ Yeni" ---------- */
  var NEW_ITEMS = [
    { id: "teblig", ad: "Tebligat / evrak", alt: "Süre ve hazırlık görevi oluşturur", dosyali: true },
    { id: "masraf", ad: "Masraf", alt: "Avans bakiyesinden düşer", dosyali: true },
    { id: "gorev", ad: "Görev", alt: "Dosyaya bağlı iş", dosyali: true },
    { id: "dilekce", ad: "Dilekçe taslağı", alt: "Şablondan, onaya hazır", dosyali: true },
    { id: "muvekkil", ad: "Müvekkil", alt: "Çatışma kontrolü yazarken yapılır", show: function () { return can("muvekkilKayit"); }, run: function () { muvekkilModal(); } }
  ];
  function yeniItems(f) {
    return NEW_ITEMS.filter(function (n) {
      if (n.dosyali) { var a = FILE_ACTIONS.filter(function (x) { return x.id === n.id; })[0]; return a && a.show(); }
      return n.show ? n.show() : true;
    });
  }
  function aktifDosya() { var r = route(); if (r.p === "dosya") { var f = dosya(r.a); if (erisir(f)) return f; } return null; }
  function yeniBaslat(id) {
    var n = NEW_ITEMS.filter(function (x) { return x.id === id; })[0]; if (!n) return;
    if (!n.dosyali) return n.run();
    var f = aktifDosya();
    if (f) runFileAction(id, f); else palette({ action: id });
  }
  function yeniMenu() {
    var f = aktifDosya(), items = yeniItems(f);
    modal(mHead("ymh", "Yeni", f ? "Dosyaya bağlı kayıtlar <b>" + esc(client(f.muvekkilId).ad) + " · " + esc(f.konu) + "</b> dosyasına eklenir." : "Dosyaya bağlı kayıtlarda bir sonraki adımda dosyayı seçersiniz.") +
      '<div class="newgrid">' + items.map(function (n) { return '<button type="button" class="choice" data-ny="' + n.id + '"><b>' + n.ad + "</b><span>" + n.alt + "</span></button>"; }).join("") + "</div>", function (m) {
      m.querySelectorAll("[data-ny]").forEach(function (b) { b.onclick = function () { m.close(true); yeniBaslat(b.getAttribute("data-ny")); }; });
    }, { cls: "sheet", labelledby: "ymh" });
  }

  /* ---------- Takvim ---------- */
  var calAy = null, calSec = null;
  function vTakvim() {
    var T = R.d(S.today); if (!calAy) calAy = new Date(T.getFullYear(), T.getMonth(), 1); if (!calSec) calSec = S.today;
    var list = benimDosyalarim(), ev = {};
    durusmalar(list).forEach(function (x) { (ev[x.d.tarih] = ev[x.d.tarih] || []).push({ k: "d", t: x.d.saat + " " + x.d.tur, f: x.f, x: x.d }); });
    acikSureler(list).forEach(function (x) { (ev[x.s.son] = ev[x.s.son] || []).push({ k: "s", t: "Son gün: " + rule(x.s.kuralId).ad, f: x.f, x: x.s }); });
    var y = calAy.getFullYear(), m = calAy.getMonth(), first = new Date(y, m, 1), start = R.add(first, -((first.getDay() + 6) % 7));
    var buAy = y === T.getFullYear() && m === T.getMonth();
    var h = '<div class="ph"><div><h1>Takvim</h1><p>Duruşmalar mor, süre son günleri kırmızı. Resmi tatiller sarımsı.</p></div><div class="calnav"><button class="btn sm" type="button" id="calPrev" aria-label="Önceki ay">←</button><b aria-live="polite">' + R.AY[m] + " " + y + '</b><button class="btn sm" type="button" id="calNext" aria-label="Sonraki ay">→</button>' + (buAy && calSec === S.today ? "" : '<button class="btn sm" type="button" id="calBugun">Bugün</button>') + "</div></div>";
    h += '<div class="cal">' + ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(function (g) { return '<div class="h" aria-hidden="true">' + g + "</div>"; }).join("");
    for (var i = 0; i < 42; i++) {
      var dd = R.add(start, i), k = R.iso(dd), e = ev[k] || [], hol = R.HOLIDAYS[k];
      h += '<button type="button" data-day="' + k + '" class="' + (dd.getMonth() !== m ? "out " : "") + (k === S.today ? "today " : "") + (k === calSec ? "sel " : "") + (hol ? "hol" : "") + '" aria-pressed="' + (k === calSec) + '" aria-label="' + R.uzun(dd) + ", " + e.length + ' kayıt"><span class="n">' + dd.getDate() + "</span>" + e.slice(0, 3).map(function (x) { return '<span class="ev ' + x.k + '">' + esc(x.t) + "</span>"; }).join("") + (e.length > 3 ? '<span class="faint more">+' + (e.length - 3) + "</span>" : "") + "</button>";
    }
    h += "</div>";
    var se = ev[calSec] || [];
    h += '<section class="card flush mt14" aria-live="polite"><div class="sec-h"><h2>' + R.uzun(R.d(calSec)) + (R.HOLIDAYS[calSec] ? " · " + R.HOLIDAYS[calSec] : "") + '</h2></div><ul class="list">' + (se.map(function (x) { return '<li><div class="grow"><a class="t" href="#/dosya/' + x.f.id + '/sure">' + esc(x.t) + '</a><div class="s">' + esc(client(x.f.muvekkilId).ad) + " · " + esc(x.f.mahkeme) + '</div></div><div class="acts">' + (x.k === "s" ? chip(x.x.son) + (sureTamamlayabilir(x.f) ? '<button class="btn sm" type="button" data-act="sure-tamam" data-f="' + x.f.id + '" data-id="' + x.x.id + '">Tamamlandı</button>' : "") : "") + "</div></li>"; }).join("") || bos("Bu gün için kayıt yok.")) + "</ul></section>";
    onBind(function () {
      document.getElementById("calPrev").onclick = function () { calAy = new Date(y, m - 1, 1); render(); document.getElementById("calPrev").focus(); };
      document.getElementById("calNext").onclick = function () { calAy = new Date(y, m + 1, 1); render(); document.getElementById("calNext").focus(); };
      var cb = document.getElementById("calBugun"); if (cb) cb.onclick = function () { calAy = new Date(T.getFullYear(), T.getMonth(), 1); calSec = S.today; render(); };
      document.querySelectorAll("[data-day]").forEach(function (b) { b.onclick = function () { calSec = b.getAttribute("data-day"); render(); var n = document.querySelector('[data-day="' + calSec + '"]'); if (n) n.focus(); }; });
    });
    return h;
  }

  /* ---------- Süre hesaplayıcı ---------- */
  var calc = { k: "istinaf", t: null };
  function vSure() {
    if (!calc.t) calc.t = R.iso(R.add(R.d(S.today), -2));
    var h = '<div class="ph"><div><h1>Süre hesaplayıcı</h1><p>Tebliğ tarihini ve işlemi seçin; son gün gerekçesiyle hesaplanır.</p></div></div>';
    h += '<div class="warn">Kural tablosu ve tatil listesi demoda <b>taslaktır</b>. Gerçek kullanımda kurallar düzenlenebilir tabloda tutulur, her kuralın kaynağı ve son doğrulayan avukat kayıtlıdır.</div>';
    h += '<div class="grid g2"><div class="card"><div class="form two"><label class="field">İşlem<select id="ck">' + R.RULES.map(function (r) { return '<option value="' + r.id + '"' + (calc.k === r.id ? " selected" : "") + ">" + r.ad + "</option>"; }).join("") + '</select></label><label class="field">Tebliğ tarihi<input id="ct" type="date" value="' + calc.t + '"></label></div><div class="calc mt14" id="cres" aria-live="polite"></div>' +
      (can("teblig") ? '<button class="btn pri mt14" type="button" id="cKaydet">Bu süreyi bir dosyaya kaydet</button><p class="faint sm">Dosyayı seçtiğiniz anda süre ve hazırlık görevi oluşur; toast\'tan geri alınabilir.</p>' : "") +
      '<p class="faint sm">Örnek: istinaf için tebliğ tarihini 10 Temmuz 2026 yapın; son gün adli tatile denk geldiği için 7 Eylül\'e uzar.</p></div>';
    h += '<div class="card flush"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>İşlem</th><th>Süre</th><th>Adli tatil</th><th>Kaynak</th></tr></thead><tbody>' + R.RULES.map(function (r) { return "<tr><td>" + r.ad + '</td><td class="num">' + r.sure + " " + (r.unit === "hafta" ? "hafta" : "gün") + "</td><td>" + (r.adliTatil ? "Uzar" : "Uzamaz") + '</td><td class="mono">' + r.kaynak + "</td></tr>"; }).join("") + "</tbody></table></div></div></div>";
    onBind(function () {
      function upd() { calc.k = document.getElementById("ck").value; calc.t = document.getElementById("ct").value; var x = R.hesapla(calc.k, calc.t); document.getElementById("cres").innerHTML = x ? "<b>" + esc(x.kural.ad) + "</b> · " + esc(x.kural.kaynak) + "<ol>" + x.adimlar.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + '</ol><div class="res">Son gün: ' + x.sonUzun + "</div>" + (x.kural.not ? '<p class="faint sm">' + esc(x.kural.not) + "</p>" : "") : "Tarih seçin."; }
      document.getElementById("ck").onchange = upd; document.getElementById("ct").oninput = upd; upd();
      var ck = document.getElementById("cKaydet");
      if (ck) ck.onclick = function () { palette({ custom: { ad: rule(calc.k).ad + " süresini kaydet", run: function (f) { sureKaydet(f, calc.k, calc.t); } } }); };
    });
    return h;
  }

  /* ---------- Müvekkiller ---------- */
  function norm(s) { return s.toLocaleLowerCase("tr").replace(/\b(a\.?ş\.?|ltd\.?|şti\.?|san\.?|tic\.?|koop\.?)\b/g, "").replace(/[^a-zçğıöşü0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }
  function catisma(ad) {
    var n = norm(ad); if (n.length < 3) return [];
    var out = [];
    S.dosyalar.forEach(function (f) { if (f.karsi !== "—" && (norm(f.karsi).indexOf(n) >= 0 || n.indexOf(norm(f.karsi)) >= 0)) out.push({ tip: "karsi", f: f }); });
    S.muvekkiller.forEach(function (c) { if (norm(c.ad).indexOf(n) >= 0 || n.indexOf(norm(c.ad)) >= 0) out.push({ tip: "muv", c: c }); });
    return out;
  }
  function muvekkilForm(p) {
    return '<form id="' + p + 'F" class="mvform" novalidate><div class="form"><label class="field">Ad / unvan<input id="' + p + 'Ad" autocomplete="off" placeholder="Örn. Bora Yapı A.Ş." required></label><label class="field">Şehir<input id="' + p + 'Sh" autocomplete="off" value="İzmir"></label><label class="field">TCKN / VKN <span class="faint">(isteğe bağlı)</span><input id="' + p + 'No" inputmode="numeric"></label></div>' +
      '<div id="' + p + 'Cat" class="mt12" aria-live="polite"></div><div id="' + p + 'Ger" class="mt12" hidden><label class="field">Çatışmaya rağmen kayıt gerekçesi (zorunlu)<textarea id="' + p + 'GerT" rows="2"></textarea></label></div>' +
      '<button class="btn pri mt12 go" type="submit" id="' + p + 'Btn">Müvekkili kaydet</button></form>';
  }
  function bindMuvekkilForm(root, p, sonra) {
    var inp = root.querySelector("#" + p + "Ad"), el = root.querySelector("#" + p + "Cat"), btn = root.querySelector("#" + p + "Btn"), ger = root.querySelector("#" + p + "Ger"), gerT = root.querySelector("#" + p + "GerT");
    function chk() {
      var v = inp.value.trim(), r = catisma(v);
      ger.hidden = !(r.length && can("muvekkilOnay"));
      if (!v) { el.innerHTML = ""; btn.textContent = "Müvekkili kaydet"; return r; }
      el.innerHTML = r.length ? '<div class="danger"><b>Olası çatışma: ' + r.length + " kayıt.</b> Ortak onayı olmadan müvekkil kaydı açılamaz." + '<ul class="catl">' + r.map(function (x) { return x.tip === "karsi" ? "<li><b>" + esc(x.f.karsi) + "</b> şu dosyada <b>karşı taraf</b>: " + (erisir(x.f) ? '<a href="#/dosya/' + x.f.id + '">' + esc(client(x.f.muvekkilId).ad) + " · " + esc(x.f.konu) + "</a>" : esc(x.f.konu)) + " (" + esc(x.f.mahkeme) + ")</li>" : "<li><b>" + esc(x.c.ad) + "</b> zaten müvekkil kaydında.</li>"; }).join("") + "</ul></div>" : '<div class="okbox">Çatışma bulunmadı. Kaydedebilirsiniz.</div>';
      btn.textContent = r.length ? (can("muvekkilOnay") ? "Gerekçeyle onayla ve kaydet" : "Ortak onayına gönder") : "Müvekkili kaydet";
      return r;
    }
    inp.oninput = chk;
    root.querySelector("#" + p + "F").onsubmit = function (e) {
      e.preventDefault();
      var ad = inp.value.trim(); if (ad.length < 2) { inp.setAttribute("aria-invalid", "true"); inp.focus(); return; }
      var r = chk(), sehir = root.querySelector("#" + p + "Sh").value.trim() || "—", tip = /\b(a\.?ş|ltd|şti|koop|vakf|derne)/i.test(ad.toLocaleLowerCase("tr")) ? "tuzel" : "gercek";
      if (r.length && can("muvekkilOnay") && !gerT.value.trim()) { gerT.setAttribute("aria-invalid", "true"); gerT.focus(); return; }
      if (sonra) sonra();
      if (r.length && !can("muvekkilOnay")) {
        act(function () { S.muvekkilTalep.push({ id: nid("t"), ad: ad, tip: tip, sehir: sehir, isteyen: me.id, tarih: S.today, catisma: r.length }); log("Müvekkil kaydı ortak onayına gönderildi: " + ad); }, ad + " ortak onayına gönderildi.");
      } else {
        act(function () { S.muvekkiller.push({ id: nid("c"), ad: ad, tip: tip, yetkili: "", sehir: sehir }); log("Müvekkil kaydedildi: " + ad + (r.length ? " (çatışma gerekçesi: " + gerT.value.trim() + ")" : "")); }, ad + " müvekkil olarak kaydedildi.");
      }
    };
    return { chk: chk, inp: inp };
  }
  function muvekkilModal() {
    modal(mHead("mvh", "Yeni müvekkil", "Adı yazdıkça müvekkil ve karşı taraf kayıtları taranır.") + muvekkilForm("y"), function (m) { bindMuvekkilForm(m, "y", function () { m.close(true); }); }, { labelledby: "mvh" });
  }
  function vMuvekkiller() {
    var h = '<div class="ph"><div><h1>Müvekkiller</h1><p>' + S.muvekkiller.length + " müvekkil" + (S.muvekkilTalep.length ? " · " + S.muvekkilTalep.length + " kayıt ortak onayında" : "") + "</p></div></div>";
    h += '<section class="card mb16" aria-labelledby="ymh2"><h2 id="ymh2">Yeni müvekkil</h2><p class="muted m0">Adı yazdıkça çatışma kontrolü yapılır. Deneyin: <button class="btn sm" type="button" id="ornek">Bora Yapı</button></p>' + muvekkilForm("p") + "</section>";
    h += '<div class="card flush"><div class="tbl-wrap"><table class="tbl cards"><thead><tr><th>Müvekkil</th><th>Tür</th><th>Şehir</th><th class="r">Dosya</th>' + (can("tutar") ? '<th class="r">Avans bakiyesi</th>' : "") + '</tr></thead><tbody>' + S.muvekkiller.map(function (c) {
      var fs = S.dosyalar.filter(function (f) { return f.muvekkilId === c.id; }), b = fs.reduce(function (a, f) { return a + bakiye(f); }, 0);
      return '<tr class="click" data-c="' + c.id + '"><td><a class="rowlink" href="#/muvekkil/' + c.id + '"><b>' + esc(c.ad) + "</b></a>" + (c.yetkili ? '<div class="faint">Yetkili: ' + esc(c.yetkili) + "</div>" : "") + '</td><td data-l="Tür">' + (c.tip === "tuzel" ? "Tüzel kişi" : "Gerçek kişi") + '</td><td data-l="Şehir">' + esc(c.sehir) + '</td><td class="r num" data-l="Dosya">' + fs.length + '</td>' + (can("tutar") ? '<td class="r num ' + (b < 0 ? "neg" : "") + '" data-l="Bakiye">' + tl(b) + "</td>" : "") + "</tr>";
    }).join("") + "</tbody></table></div></div>";
    onBind(function () {
      var fm = bindMuvekkilForm(document.getElementById("main"), "p", null);
      document.getElementById("ornek").onclick = function () { fm.inp.value = "Bora Yapı"; fm.chk(); fm.inp.focus(); };
      document.querySelectorAll("tr[data-c]").forEach(function (tr) { tr.onclick = function (e) { if (e.target.closest("a")) return; location.hash = "#/muvekkil/" + tr.getAttribute("data-c"); }; });
    });
    return h;
  }
  function vMuvekkil(id) {
    var c = client(id), fs = S.dosyalar.filter(function (f) { return f.muvekkilId === id && benimDosyalarim().indexOf(f) >= 0; });
    var h = '<a href="#/muvekkiller" class="back">← Müvekkiller</a><div class="ph"><div><h1>' + esc(c.ad) + "</h1><p>" + (c.tip === "tuzel" ? "Tüzel kişi" : "Gerçek kişi") + " · " + esc(c.sehir) + (c.yetkili ? " · yetkili " + esc(c.yetkili) : "") + "</p></div></div>";
    h += '<div class="card mb14"><h2>Vekaletname</h2><p class="m0">Genel dava vekaletnamesi · ' + esc(c.sehir) + ' noterliği · yevmiye no <span class="mono">' + (10000 + c.id.length * 731 + (parseInt(c.id.slice(1), 10) || 0) * 97) + '</span></p><p class="muted m0 mt4">Yetkiler: ahzu kabz ✓ · sulh ✓ · feragat ✓ · kabul ✓ · haciz ✓</p></div>';
    h += '<div class="card flush"><div class="sec-h"><h2>Dosyalar</h2></div><ul class="list">' + (fs.map(function (f) { var s = f.sureler.filter(function (x) { return x.durum === "acik"; })[0]; return '<li><div class="grow">' + tag(f.tur) + ' <a class="t" href="#/dosya/' + f.id + '">' + esc(f.konu) + '</a><div class="s">' + esc(f.mahkeme) + " · " + esc(f.durum) + "</div></div>" + (s ? chip(s.son) : "") + "</li>"; }).join("") || bos("Bu müvekkilin size açık dosyası yok.")) + "</ul></div>";
    return h;
  }

  /* ---------- Onay ---------- */
  function vOnay() {
    var l = onaydakiler(); if (!can("dilekceOnay")) l = l.filter(function (x) { return x.d.yazan === me.id || x.f.sorumlu === me.id; });
    var grp = [["onayda", "Onay bekleyen"], ["iade", "Düzeltme istenen"], ["taslak", "Taslak"], ["onaylandi", "Onaylandı, UYAP'a gönderilecek"], ["gonderildi", "Gönderildi"]];
    var h = '<div class="ph"><div><h1>Dilekçe onayı</h1><p>Taslak → onay → UYAP\'a gönderildi. ' + (can("dilekceOnay") ? "Onay sizde." : "Onayı büro ortağı verir.") + "</p></div></div>";
    grp.forEach(function (g) {
      var x = l.filter(function (y) { return y.d.durum === g[0]; }); if (!x.length) return;
      h += '<section class="card flush mb14"><div class="sec-h"><h2>' + g[1] + ' <span class="faint">(' + x.length + ")</span></h2></div><ul class=\"list\">" + x.map(function (y) { return dilekceRow(y.f, y.d); }).join("") + "</ul></section>";
    });
    if (!l.length) h += '<div class="card empty">Dilekçe yok. ' + (faShow("dilekce") ? '<button class="btn sm" type="button" data-new="dilekce">Taslak oluştur</button>' : "") + "</div>";
    return h;
  }

  /* ---------- Finans ---------- */
  var finTum = false;
  function vFinans() {
    var fs = S.dosyalar.slice().sort(function (a, b) { return bakiye(a) - bakiye(b); });
    var tops = fs.reduce(function (a, f) { a.al += f.avansAlinan; a.hr += harcanan(f); return a; }, { al: 0, hr: 0 });
    var taks = []; S.dosyalar.forEach(function (f) { f.ucret.taksitler.forEach(function (t) { if (!t.odendi) taks.push({ f: f, t: t }); }); });
    taks.sort(function (a, b) { return a.t.vade < b.t.vade ? -1 : 1; });
    var geciken = taks.filter(function (x) { return gunFarki(x.t.vade) < 0; });
    var eksiN = fs.filter(function (f) { return bakiye(f) < 0; }).length;
    var rows = fs.filter(function (f) { return f.tur !== "danismanlik"; });
    var h = '<div class="ph"><div><h1>Masraf ve tahsilat</h1><p>Avans bakiyeleri (en düşük üstte), bekleyen vekalet ücreti taksitleri.</p></div></div>';
    h += '<div class="grid g4 kpis"><div class="card kpi static"><b class="num">' + tl(tops.al) + '</b><span>alınan toplam avans</span></div><div class="card kpi static"><b class="num">' + tl(tops.hr) + '</b><span>yapılan masraf</span></div><div class="card kpi static red"><b class="num">' + eksiN + '</b><span>avansı eksiye düşen dosya</span></div><div class="card kpi static amber"><b class="num">' + tl(geciken.reduce(function (a, x) { return a + x.t.tutar; }, 0)) + "</b><span>vadesi geçmiş taksit</span></div></div>";
    h += '<div class="grid g2"><section class="card flush" aria-labelledby="abh"><div class="sec-h"><h2 id="abh">Avans bakiyeleri</h2></div><div class="tbl-wrap"><table class="tbl cards"><thead><tr><th>Müvekkil · dosya</th><th class="r">Alınan</th><th class="r">Harcanan</th><th class="r">Bakiye</th><th><span class="sr-only">Eylem</span></th></tr></thead><tbody>' + (finTum ? rows : rows.slice(0, 14)).map(function (f) { var b = bakiye(f); return '<tr class="click" data-f="' + f.id + '"><td><a class="rowlink" href="#/dosya/' + f.id + '/masraf">' + esc(client(f.muvekkilId).ad) + '</a><div class="faint">' + esc(f.konu) + '</div></td><td class="r num" data-l="Alınan">' + tl(f.avansAlinan) + '</td><td class="r num" data-l="Harcanan">' + tl(harcanan(f)) + '</td><td class="r num ' + (b < 0 ? "neg" : "") + '" data-l="Bakiye">' + tl(b) + '</td><td class="r">' + (b < 0 ? '<button class="btn sm" type="button" data-act="avans" data-f="' + f.id + '">Avans iste</button>' : '<button class="btn sm ghost" type="button" data-fa2="masraf" data-f="' + f.id + '" aria-label="' + esc(client(f.muvekkilId).ad) + ': masraf ekle">+ Masraf</button>') + "</td></tr>"; }).join("") + "</tbody></table></div>" + (rows.length > 14 ? '<div class="pad"><button type="button" class="linkbtn" id="finTum">' + (finTum ? "Daha az göster" : "Tüm dosyalar (" + rows.length + ")") + "</button></div>" : "") + "</section>";
    h += '<section class="card flush"><div class="sec-h"><h2>Bekleyen vekalet ücreti taksitleri</h2></div><ul class="list">' + taks.slice(0, 12).map(function (x) { return '<li><div class="grow"><a class="t" href="#/dosya/' + x.f.id + '/ucret">' + esc(client(x.f.muvekkilId).ad) + '</a><div class="s">' + esc(x.f.konu) + " · vade " + kisaTarih(x.t.vade) + '</div></div><div class="acts col"><b class="num">' + tl(x.t.tutar) + "</b>" + chip(x.t.vade) + "</div></li>"; }).join("") + '</ul><div class="pad"><button class="btn" type="button" id="disaAktar">Muhasebeye aktar (CSV)</button></div></section></div>';
    onBind(function () {
      document.querySelectorAll("tr[data-f]").forEach(function (tr) { tr.onclick = function (e) { if (e.target.closest("a,button")) return; location.hash = "#/dosya/" + tr.getAttribute("data-f") + "/masraf"; }; });
      document.querySelectorAll("[data-fa2]").forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); runFileAction("masraf", dosya(b.getAttribute("data-f"))); }; });
      var ft = document.getElementById("finTum"); if (ft) ft.onclick = function () { finTum = !finTum; render(); };
      document.getElementById("disaAktar").onclick = function () { toast("Demo: gerçek sürümde tahsilatlar CSV / e-SMM sağlayıcısına aktarılır."); };
    });
    return h;
  }

  /* ---------- Raporlar ---------- */
  function vRapor() {
    var avk = ["u1", "u2", "u3"];
    var data = avk.map(function (u) {
      var fs = S.dosyalar.filter(function (f) { return f.sorumlu === u; });
      return { u: u, dosya: fs.length, sure: acikSureler(fs).filter(function (x) { return gunFarki(x.s.son) <= 7; }).length, dur: durusmalar(fs).filter(function (x) { var g = gunFarki(x.d.tarih); return g >= 0 && g <= 14; }).length };
    });
    function bars(key, max, red) { return '<div class="bars">' + data.map(function (d) { return '<div class="bar-row"><span>' + esc(user(d.u).ad.replace("Av. ", "")) + '</span><div class="bar ' + (red ? "red" : "") + '" role="img" aria-label="' + d[key] + '"><i style="width:' + (max ? Math.round(d[key] / max * 100) : 0) + '%"></i></div><b class="num">' + d[key] + "</b></div>"; }).join("") + "</div>"; }
    var mx = function (k) { return Math.max.apply(null, data.map(function (d) { return d[k]; })); };
    var tur = ["dava", "icra", "arabuluculuk", "danismanlik"].map(function (t) { return [t, S.dosyalar.filter(function (f) { return f.tur === t; }).length]; });
    var h = '<div class="ph"><div><h1>Raporlar</h1><p>İş yükü dağılımı ve dosya portföyü.</p></div></div><div class="grid g2">';
    h += '<section class="card"><h2>Avukat başına açık dosya</h2>' + bars("dosya", mx("dosya")) + "</section>";
    h += '<section class="card"><h2>7 gün içinde biten süre</h2>' + bars("sure", mx("sure"), true) + "</section>";
    h += '<section class="card"><h2>14 gün içinde duruşma</h2>' + bars("dur", mx("dur")) + "</section>";
    h += '<section class="card"><h2>Dosya türleri</h2><div class="bars">' + tur.map(function (t) { return '<div class="bar-row"><span>' + turAd(t[0]) + '</span><div class="bar" role="img" aria-label="' + t[1] + '"><i style="width:' + Math.round(t[1] / S.dosyalar.length * 100) + '%"></i></div><b class="num">' + t[1] + "</b></div>"; }).join("") + "</div></section></div>";
    return h;
  }

  VIEWS.bugun = vBugun; VIEWS.dosyalar = vDosyalar; VIEWS.dosya = vDosya; VIEWS.takvim = vTakvim; VIEWS.sure = vSure;
  VIEWS.muvekkiller = vMuvekkiller; VIEWS.muvekkil = vMuvekkil; VIEWS.onay = vOnay; VIEWS.finans = vFinans; VIEWS.rapor = vRapor; VIEWS.yetki = vYetki;

  /* ---------- Müvekkil portalı ---------- */
  function renderPortal() {
    var c = client(me.muvekkilId), fs = S.dosyalar.filter(function (f) { return f.muvekkilId === c.id; });
    var adimlar = { dava: ["Dosya açıldı", "Dilekçeler", "Duruşmalar", "Karar", "Kesinleşme"], icra: ["Takip başladı", "Ödeme emri", "Haciz", "Tahsilat"], arabuluculuk: ["Başvuru", "Toplantı", "Sonuç"], danismanlik: ["Talep", "Çalışma", "Teslim"] };
    function asama(f) { var a = adimlar[f.tur]; var i = { "Açık": 2, "Bilirkişide": 2, "Karar": 3, "İstinafta": 3, "Takipte": 1, "Haciz aşaması": 2, "İtiraz edildi": 1, "Toplantı bekleniyor": 1, "Devam ediyor": 1, "Taslak teslim edildi": 2 }[f.durum]; return { a: a, i: i == null ? 1 : i }; }
    var top = fs.reduce(function (a, f) { return a + bakiye(f); }, 0);
    var h = '<header class="portal-top"><span class="brand"><span class="brand-mark" aria-hidden="true">§</span><span class="brand-name">Büro</span><span class="faint ptag">Müvekkil portalı</span></span><div class="ptop-r">' + rolPill(me) + '<span class="muted pname">' + esc(me.ad) + '</span><button class="btn sm" type="button" id="logout">Rol değiştir</button></div></header><main class="portal-main" id="main">';
    h += '<div class="ph"><div><h1>Merhaba ' + esc(me.ad.split(" ")[0]) + "</h1><p>" + esc(c.ad) + " adına " + fs.length + " dosyanız var. Büro içi notlar ve diğer müvekkillerin bilgileri burada görünmez.</p></div></div>";
    h += '<div class="grid g2 mb14"><section class="card" aria-labelledby="pmh"><h2 id="pmh">Avukatınıza yazın</h2><form id="pm" class="pmform"><label class="sr-only" for="pmt">Mesajınız</label><textarea id="pmt" rows="2" placeholder="Sorunuzu ya da bilginizi yazın"></textarea><button class="btn pri" type="submit">Gönder</button></form><ul class="list flushx">' + S.portalMesaj.slice(0, 4).map(function (m) { return '<li><div class="grow"><b>' + esc(m.kimden) + '</b> <span class="faint">· ' + kisaTarih(m.tarih) + "</span><div>" + esc(m.metin) + "</div></div></li>"; }).join("") + "</ul></section>";
    h += '<section class="card" aria-labelledby="pbh"><h2 id="pbh">Belge gönder</h2><p class="muted m0">Fatura, sözleşme, tebligat fotoğrafı gibi belgeleri buradan iletebilirsiniz. Demoda dosya yalnızca adıyla listelenir, hiçbir yere yüklenmez.</p><label class="filebtn mt12"><input type="file" id="pf" multiple>+ Belge seç ve gönder</label><ul class="list flushx">' + (S.portalBelge.map(function (b) { return '<li><div class="grow">' + esc(b.ad) + '<div class="s">' + kisaTarih(b.tarih) + " · büroya iletildi</div></div></li>"; }).join("") || '<li class="empty">Henüz belge göndermediniz.</li>') + "</ul></section></div>";
    h += '<h2 class="sec">Dosyalarınız</h2><div class="grid g2">' + fs.map(function (f) {
      var a = asama(f), d = f.durusmalar.filter(function (x) { return gunFarki(x.tarih) >= 0; })[0];
      return '<section class="card">' + tag(f.tur) + '<h3 class="mt8">' + esc(f.konu) + '</h3><div class="muted sm14">' + esc(f.mahkeme) + (f.esas !== "—" ? ' · <span class="mono">' + esc(f.esas) + "</span>" : "") + '</div><ol class="steps" aria-label="Dosya aşaması">' + a.a.map(function (s, i) { return '<li class="' + (i < a.i ? "done" : i === a.i ? "now" : "") + '"' + (i === a.i ? ' aria-current="step"' : "") + ">" + s + "</li>"; }).join("") + "</ol>" +
        '<p class="mt10">' + (d ? "Sıradaki: <b>" + esc(d.tur) + "</b>, " + R.uzun(R.d(d.tarih)) + " saat " + d.saat + "." : "Yakın tarihte duruşma yok; gelişme olduğunda bildirim alırsınız.") + '</p><p class="muted m0 sm14">Avukatınız: ' + esc(user(f.sorumlu).ad) + ' · Avans bakiyesi: <b class="' + (bakiye(f) < 0 ? "neg" : "") + '">' + tl(bakiye(f)) + "</b></p></section>";
    }).join("") + "</div>";
    h += '<p class="faint sm mt16">Toplam avans bakiyeniz: <b class="num">' + tl(top) + "</b>. Ödemeler ve makbuzlar için büromuzla iletişime geçebilirsiniz.</p></main>";
    app.innerHTML = h;
    document.getElementById("logout").onclick = logout;
    document.getElementById("pm").onsubmit = function (e) { e.preventDefault(); var v = document.getElementById("pmt").value.trim(); if (!v) { document.getElementById("pmt").focus(); return; } S.portalMesaj.unshift({ tarih: S.today, kimden: me.ad, metin: v }); save(); renderPortal(); toast("Mesajınız avukatınıza iletildi."); };
    document.getElementById("pmt").onkeydown = function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) document.getElementById("pm").requestSubmit(); };
    document.getElementById("pf").onchange = function (e) { Array.prototype.forEach.call(e.target.files, function (f) { S.portalBelge.unshift({ ad: f.name, tarih: S.today }); }); save(); renderPortal(); toast("Belge büroya iletildi (demo)."); };
  }

  // Birleştirme kolaylığı: diğer modüller (ör. emsal.js) genişletme noktalarına buradan erişebilir.
  window.BuroApp = { kimde: kimde, yetkisiz: yetkisiz, ROL_AD: ROL_AD, state: function () { return S; }, me: function () { return me; }, sf: sf, log: log, save: save, user: user, kisaTarih: kisaTarih, ico: ico, erisir: erisir, benimDosyalarim: benimDosyalarim, NAV: NAV, VIEWS: VIEWS, GUARD: GUARD, TABS: TABS, FILE_ACTIONS: FILE_ACTIONS, NEW_ITEMS: NEW_ITEMS, render: render, modal: modal, toast: toast, act: act, can: can, esc: esc, dosya: dosya, client: client, palette: palette };

  render();
})();
