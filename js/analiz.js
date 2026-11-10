/* Mustafa Ender Doğan — İş Analizi Portfolyosu · analiz.js
   Vaka sayfaları, "Nasıl çalışırım", gizlilik, 404 ve İngilizce özet için mobil menü,
   kaydırınca belirme, içindekiler vurgusu ve telefonda tablo etiketleri. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  function setMenu(open) {
    if (!burger || !menu) return;
    menu.hidden = !open;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    var en = document.documentElement.lang === "en";
    burger.setAttribute("aria-label", open ? (en ? "Close menu" : "Menüyü kapat") : (en ? "Open menu" : "Menüyü aç"));
    document.body.classList.toggle("menu-open", open);
  }
  if (burger) burger.addEventListener("click", function () { setMenu(menu.hidden); });
  if (menu) menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu && !menu.hidden) setMenu(false); });

  /* Telefon düzeni (analiz.css): tablo satırları alt alta dizilir. Hücrelere sütun adını etiket olarak yaz;
     görünüm değişse de ekran okuyucu tablo olarak görsün diye rolleri açıkça ver. */
  document.querySelectorAll(".az-t").forEach(function (t) {
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

  var toc = {};
  document.querySelectorAll(".az-toc a").forEach(function (a) { toc[a.getAttribute("href").slice(1)] = a; });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".rv").forEach(function (el) { io.observe(el); });

    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || !toc[e.target.id]) return;
        Object.keys(toc).forEach(function (k) { toc[k].classList.toggle("on", k === e.target.id); });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    document.querySelectorAll(".az-sec[id]").forEach(function (s) { so.observe(s); });
  } else {
    document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); });
  }

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
