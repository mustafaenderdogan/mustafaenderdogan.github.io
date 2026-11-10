/* ===================================================================
   Mustafa Ender Doğan — İş Analizi Portfolyosu · v2.js (ana sayfa)
   Üst bar, mobil menü, kaydırınca belirme, kelime kelime aydınlanan
   paragraf, sayaçlar ve ışık akışı. Harici kütüphane ve izleme yok.
   =================================================================== */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Üst bar ---------- */
  var hd = document.getElementById("hd");
  function onScrollHd() { if (hd) hd.classList.toggle("scrolled", window.scrollY > 40); }

  /* ---------- Mobil menü ---------- */
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  function setMenu(open) {
    if (!burger || !menu) return;
    menu.hidden = !open;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
    document.body.classList.toggle("menu-open", open);
    if (hd) hd.classList.toggle("scrolled", open || window.scrollY > 40);
  }
  if (burger) burger.addEventListener("click", function () { setMenu(menu.hidden); });
  if (menu) menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu && !menu.hidden) setMenu(false); });

  /* ---------- Kelime kelime aydınlanan paragraf ----------
     Metin HTML'de durur; <b> içindeki sözcükler vurgulanır. Betik çalışmazsa paragraf olduğu gibi okunur. */
  var intro = document.getElementById("introText");
  function buildIntro() {
    if (!intro) return;
    var words = [];
    intro.childNodes.forEach(function (n) {
      var hl = n.nodeType === 1 && n.tagName === "B";
      (n.textContent || "").split(/\s+/).forEach(function (w) { if (w) words.push({ w: w, hl: hl }); });
    });
    intro.textContent = "";
    words.forEach(function (x) {
      var s = document.createElement("span");
      s.className = "w" + (x.hl ? " hl" : "");
      s.textContent = x.w + " ";
      intro.appendChild(s);
    });
  }
  function updateIntro() {
    if (!intro) return;
    var words = intro.querySelectorAll(".w");
    var r = intro.getBoundingClientRect(), vh = window.innerHeight;
    var prog = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
    prog = Math.max(0, Math.min(1, prog));
    if (reduce) prog = 1;
    var lit = Math.round(prog * words.length);
    for (var i = 0; i < words.length; i++) words[i].classList.toggle("on", i < lit);
  }

  /* ---------- Kaydırınca belirme + sayaç ---------- */
  function count(el) {
    var to = +el.getAttribute("data-count"), t0 = null;
    if (reduce) { el.textContent = to; return; }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / 1600, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(step); else el.textContent = to;
    }
    el.textContent = "0";
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        if (e.target.classList.contains("stats")) e.target.querySelectorAll(".num").forEach(count);
        io.unobserve(e.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".rv, .stats").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".rv, .stats").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Rakamlar bandındaki ışık akışı ---------- */
  function buildFlow() {
    var plane = document.getElementById("flowPlane");
    if (!plane) return;
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var n = window.innerWidth < 640 ? 24 : 36, html = "";
    for (var i = 0; i < n; i++) {
      var x = (i / n * 100 + rnd() * 2.5).toFixed(2), w = rnd() < 0.25 ? 3 : 2, h = Math.round(90 + rnd() * 220);
      var c = rnd() < 0.3 ? "#FFFFFF" : "#D6DCE4", o = (0.35 + rnd() * 0.6).toFixed(2), d = (1.6 + rnd() * 2.6).toFixed(2), dl = (rnd() * 4).toFixed(2);
      html += '<span class="fl" style="left:' + x + '%;width:' + w + 'px;opacity:' + o + ';animation-duration:' + d + 's;animation-delay:-' + dl + 's"><i style="height:' + h + 'px;background:linear-gradient(180deg,rgba(214,220,228,0) 0%,' + c + ' 70%,#FFFFFF 100%)"></i></span>';
    }
    plane.innerHTML = html;
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { onScrollHd(); updateIntro(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", updateIntro);

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  buildIntro();
  updateIntro();
  buildFlow();
  onScrollHd();
})();
