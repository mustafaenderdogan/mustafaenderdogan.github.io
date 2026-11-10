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

  var y = d.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
