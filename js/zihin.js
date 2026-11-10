/* Mustafa Ender Doğan — İş Analizi Portfolyosu · zihin.js
   "Bir analistin zihni": açılışın arka planında video gibi döngüde oynayan soluk canvas animasyonu.
   Belirsizlik → soru → bağlantı → yapı → akış, ~16 sn döngü. Harici kütüphane yok.
   Açık zemine göre koyu mavi tonlarda, sütun başlıkları olmadan çizilir; açılışın ortasında, yazının arkasında oynar.
   Ekran dışındayken ve sekme gizliyken durur; "hareketi azalt" tercihinde düzenli kareyi sabit gösterir.
   Telefonda (760 pikselden dar) çizilmez; site.css tuvali gizler. */
(function () {
  "use strict";
  var cv = document.getElementById("zihinCanvas");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var COLS = ["Problem", "Paydaş", "Kural", "Gereksinim", "Karar"];
  var ITEMS = [
    [0, "Neden?"], [0, "Asıl sorun ne?"], [0, "Kimin derdi?"],
    [1, "Ürün sahibi"], [1, "Operasyon"], [1, "Sigorta şirketi"], [1, "Hasar uzmanı"],
    [2, "BR-03 · tek poliçe"], [2, "T-1"], [2, "8,33 SDR/kg"], [2, "Tolerans 0"],
    [3, "US-03"], [3, "Given / When / Then"], [3, "Kabul kriteri"],
    [4, "Kapsam dışı"], [4, "v1.1"], [4, "Risk"], [4, "KPI"]
  ];
  var NOISE = ["?", "?", "?", "belki", "ya şöyle olursa?", "kim onaylar?", "istisna?", "varsayım", "?", "hangi veri?"];
  var DUR = 16000;
  var INK = "24,33,45", BLUE = "29,79,145", GREY = "104,115,132";

  var seed = 11;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

  var nodes = ITEMS.map(function (it) {
    return { col: it[0], t: it[1], ax: rnd(), ay: rnd(), ph: rnd() * 6.28, sp: 0.4 + rnd() * 0.6, x: 0, y: 0, ox: 0, oy: 0, w: 0 };
  });
  var noise = NOISE.map(function (t) { return { t: t, ax: rnd(), ay: rnd(), ph: rnd() * 6.28, sp: 0.3 + rnd() * 0.5 }; });
  var dots = []; for (var i = 0; i < 80; i++) dots.push({ x: rnd(), y: rnd(), r: 0.6 + rnd() * 1.3, ph: rnd() * 6.28 });
  // ardışık sütunlar arasında sabit bağlantılar
  var edges = [];
  nodes.forEach(function (a, i) {
    nodes.forEach(function (b, j) { if (b.col === a.col + 1 && rnd() < 0.42) edges.push([i, j, rnd()]); });
  });

  // W, H: tuval; X0..X0+XW ve Y0..Y0+YH: animasyonun oynadığı, yatayda ortalanmış alan
  var W = 0, H = 0, dpr = 1, on = false, X0 = 0, XW = 0, Y0 = 0, YH = 0, FS = 13, NH = 28;
  function font(s, w) { return w + " " + s + "px Figtree, system-ui, sans-serif"; }
  function layout() {
    var cr = cv.getBoundingClientRect();
    W = cr.width; H = cr.height;
    // animasyon alanı yatayda ortalı; çok geniş ekranda 1180 pikselle sınırlı
    XW = Math.min(W * 0.9, 1180); X0 = (W - XW) / 2;
    on = W >= 760 && H > 0;
    if (!on) { if (cv.width) ctx.clearRect(0, 0, cv.width, cv.height); return; }
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Y0 = H * 0.10; YH = H * 0.80;
    FS = XW < 800 ? 12.5 : 13.5; NH = FS < 13 ? 26 : 28;
    ctx.font = font(FS, 500);
    nodes.forEach(function (n) { n.w = ctx.measureText(n.t).width + 20; });
    // düzenli hâlde her sütunun düğümleri alanın yüksekliğine eşit aralıkla dizilir (başlık yok)
    var colW = XW / COLS.length;
    COLS.forEach(function (c, ci) {
      var cx = X0 + colW * ci + colW / 2;
      var list = nodes.filter(function (n) { return n.col === ci; });
      var gap = YH / Math.max(list.length, 1);
      list.forEach(function (n, k) { n.ox = cx; n.oy = Y0 + gap * k + gap / 2; });
    });
  }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function seg(p, a, b) { return clamp((p - a) / (b - a)); }
  function rgba(c, a) { return "rgba(" + c + "," + Math.max(0, a).toFixed(3) + ")"; }

  function pill(x, y, w, h, fill, stroke) {
    var r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + r, y - h / 2);
    ctx.arcTo(x + w / 2, y - h / 2, x + w / 2, y + h / 2, r);
    ctx.arcTo(x + w / 2, y + h / 2, x - w / 2, y + h / 2, r);
    ctx.arcTo(x - w / 2, y + h / 2, x - w / 2, y - h / 2, r);
    ctx.arcTo(x - w / 2, y - h / 2, x + w / 2, y - h / 2, r);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }

  function draw(ms) {
    if (!on) return;
    var p = reduce ? 0.62 : (ms % DUR) / DUR;
    var tt = reduce ? 0 : ms / 1000;
    ctx.clearRect(0, 0, W, H);

    // sinaps alanı
    dots.forEach(function (d) {
      var a = 0.08 + 0.14 * (0.5 + 0.5 * Math.sin(tt * 0.8 + d.ph));
      ctx.fillStyle = rgba(BLUE, a);
      ctx.beginPath(); ctx.arc(X0 + d.x * XW, Y0 + d.y * YH, d.r, 0, 6.283); ctx.fill();
    });

    var org = ease(seg(p, 0.40, 0.56)) * (1 - ease(seg(p, 0.90, 1)));  // düzen miktarı
    var link = seg(p, 0.30, 0.42) * (1 - seg(p, 0.92, 1));             // bağlantı görünürlüğü
    var clear = seg(p, 0.14, 0.24);                                     // parçaların netleşmesi
    var noiseA = (1 - seg(p, 0.30, 0.46)) * (0.35 + 0.65 * seg(p, 0, 0.08)) + seg(p, 0.93, 1) * 0.6;

    // kafa karışıklığı: uçuşan sorular
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    noise.forEach(function (n) {
      var x = X0 + (n.ax * 0.9 + 0.05) * XW + Math.sin(tt * n.sp + n.ph) * 26;
      var y = Y0 + (n.ay * 0.82 + 0.06) * YH + Math.cos(tt * n.sp * 0.8 + n.ph) * 18;
      var f = 0.5 + 0.5 * Math.sin(tt * 2 + n.ph);
      ctx.font = font(n.t.length < 3 ? 28 : 14, 400);
      ctx.fillStyle = rgba(GREY, noiseA * (0.3 + 0.5 * f));
      ctx.fillText(n.t, x, y);
    });

    // düğüm konumları: dağınıkken alanda süzülür, düzenlenince sütunlara yerleşir
    nodes.forEach(function (n) {
      var cx = X0 + (n.ax * 0.86 + 0.07) * XW + Math.sin(tt * n.sp + n.ph) * 22;
      var cy = Y0 + (n.ay * 0.80 + 0.10) * YH + Math.cos(tt * n.sp * 0.9 + n.ph) * 16;
      n.x = cx + (n.ox - cx) * org; n.y = cy + (n.oy - cy) * org;
    });

    // bağlantılar ve akış nabzı
    var pulse = seg(p, 0.66, 0.90);
    edges.forEach(function (e) {
      var a = nodes[e[0]], b = nodes[e[1]];
      var shown = clamp(link * 1.6 - e[2] * 0.6);
      if (shown <= 0) return;
      var x1 = a.x + a.w / 2, y1 = a.y, x2 = b.x - b.w / 2, y2 = b.y;
      ctx.strokeStyle = rgba(BLUE, 0.12 + 0.25 * shown);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, y1);
      if (org > 0.5) { var mx = (x1 + x2) / 2; ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2); }
      else ctx.lineTo(x1 + (x2 - x1) * shown, y1 + (y2 - y1) * shown);
      ctx.stroke();
      // nabız: soldan sağa sütun sütun ilerler
      if (pulse > 0 && org > 0.9) {
        var local = clamp(pulse * COLS.length - a.col);
        if (local > 0 && local < 1) {
          var u = local, iu = 1 - u, mx2 = (x1 + x2) / 2;
          var px = iu * iu * iu * x1 + 3 * iu * iu * u * mx2 + 3 * iu * u * u * mx2 + u * u * u * x2;
          var py = iu * iu * iu * y1 + 3 * iu * iu * u * y1 + 3 * iu * u * u * y2 + u * u * u * y2;
          var g = ctx.createRadialGradient(px, py, 0, px, py, 9);
          g.addColorStop(0, rgba(BLUE, 0.6)); g.addColorStop(1, rgba(BLUE, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 9, 0, 6.283); ctx.fill();
        }
      }
    });

    // düğümler
    nodes.forEach(function (n, i) {
      var vis = clamp(clear * 1.4 - (i % 5) * 0.08);
      if (vis <= 0) return;
      var lit = pulse > 0 && org > 0.9 ? clamp(1 - Math.abs(pulse * COLS.length - n.col - 0.5) * 1.6) : 0;
      var fill = lit > 0.05 ? rgba("234,240,248", (0.85 + 0.15 * lit) * vis) : rgba("255,255,255", 0.85 * vis);
      pill(n.x, n.y, n.w, NH, fill, rgba(BLUE, (0.22 + 0.35 * org + 0.4 * lit) * vis));
      ctx.font = font(FS, 500);
      ctx.fillStyle = rgba(INK, (0.5 + 0.45 * org) * vis);
      ctx.fillText(n.t, n.x, n.y + 1);
    });

  }

  var running = false, visible = false, raf = 0, t0 = performance.now();
  function loop(now) { draw(now - t0); if (running) raf = requestAnimationFrame(loop); }
  function play() { if (running || reduce || !on) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function init() {
    layout(); draw(0);
    if (reduce) return;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && !document.hidden) play(); else stop();
      }, { threshold: 0.05 }).observe(cv);
    } else { visible = true; play(); }
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else if (visible) play(); });
  }
  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      layout();
      if (!on) { stop(); return; }
      if (!running) { draw(0); if (visible && !reduce) play(); }
    }, 120);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else init();
})();
