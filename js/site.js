/* Mustafa Ender Doğan — İş Analizi Portfolyosu · site.js
   Tüm sayfalar için: telefon menüsü, telefonda tablo etiketleri,
   içindekiler vurgusu ve yıl. Harici kütüphane, çerez ve izleme yok. */
(function () {
  "use strict";
  var d = document;
  var en = d.documentElement.lang === "en";
  d.documentElement.classList.add("js");

  /* ---------- Telefon menüsü ---------- */
  var burger = d.getElementById("burger");
  var menu = d.getElementById("menu");
  function setMenu(open) {
    if (!burger || !menu) return;
    menu.hidden = !open;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? (en ? "Close menu" : "Menüyü kapat") : (en ? "Open menu" : "Menüyü aç"));
    d.body.classList.toggle("menu-open", open);
  }
  if (burger && menu) {
    burger.addEventListener("click", function () { setMenu(menu.hidden); });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    d.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { setMenu(false); burger.focus(); }
    });
    var wide = window.matchMedia("(min-width: 881px)");
    var close = function (m) { if (m.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener("change", close); else if (wide.addListener) wide.addListener(close);
  }

  /* ---------- Telefonda tablo satırları alt alta dizilir (site.css).
     Hücrelere sütun adını etiket olarak yaz; görünüm değişse de ekran okuyucu tablo olarak görsün. ---------- */
  d.querySelectorAll(".az-t").forEach(function (t) {
    var heads = [].map.call(t.querySelectorAll("thead th"), function (th) { return th.textContent.trim(); });
    t.setAttribute("role", "table");
    t.querySelectorAll("thead, tbody").forEach(function (g) { g.setAttribute("role", "rowgroup"); });
    t.querySelectorAll("th").forEach(function (h) { h.setAttribute("role", "columnheader"); });
    t.querySelectorAll("tr").forEach(function (tr) {
      tr.setAttribute("role", "row");
      var idFirst = tr.cells[0] && tr.cells[0].classList.contains("az-id");
      [].forEach.call(tr.cells, function (c, i) {
        if (c.tagName !== "TD") return;
        c.setAttribute("role", "cell");
        /* ilk hücre başlıktır; kimlikli tablolarda ikinci hücre ana metindir, etiket istemez */
        if (i > 0 && heads[i] && !(idFirst && i === 1)) c.setAttribute("data-l", heads[i]);
      });
    });
  });

  /* ---------- İçindekiler: okunan bölümü işaretle ---------- */
  var toc = {};
  d.querySelectorAll(".az-toc a").forEach(function (a) { toc[a.getAttribute("href").slice(1)] = a; });
  if (Object.keys(toc).length && "IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || !toc[e.target.id]) return;
        Object.keys(toc).forEach(function (k) { toc[k].classList.toggle("on", k === e.target.id); });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    d.querySelectorAll(".az-sec[id]").forEach(function (s) { so.observe(s); });
  }

  /* ---------- Açılış arka planı: ışık akışı ----------
     Stüdyo sitesindeki efektin açık zemine uyarlanmış hâli: mavi tonlarında, yavaş ve soluk.
     Açılış görünmüyorsa durur; hareket azaltma tercihinde site.css çizgileri sabit bırakır. */
  var plane = d.getElementById("flowPlane");
  if (plane) {
    var seed = 11;
    var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    var n = window.innerWidth < 640 ? 30 : 56, html = "";
    for (var i = 0; i < n; i++) {
      var x = (i / n * 100 + rnd() * 2).toFixed(2), w = rnd() < 0.3 ? 3 : 2, h = Math.round(60 + rnd() * 180);
      var c = rnd() < 0.4 ? "29,79,145" : "111,147,198";
      var o = (0.4 + rnd() * 0.5).toFixed(2), du = (5 + rnd() * 5).toFixed(2), dl = (rnd() * 8).toFixed(2);
      html += '<span class="fl" style="left:' + x + '%;width:' + w + 'px;opacity:' + o + ';animation-duration:' + du + 's;animation-delay:-' + dl + 's">' +
        '<i style="height:' + h + 'px;background:linear-gradient(180deg,rgba(' + c + ',0) 0%,rgba(' + c + ',.9) 75%,rgba(' + c + ',1) 100%)"></i></span>';
    }
    plane.innerHTML = html;
    var flow = d.getElementById("flow");
    if (flow && "IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { flow.classList.toggle("off", !e.isIntersecting); });
      }).observe(flow);
    }
  }

  var y = d.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
