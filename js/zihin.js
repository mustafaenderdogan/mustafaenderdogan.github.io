/* Mustafa Ender Doğan — İş Analizi Portfolyosu · zihin.js
   "Bir analistin zihni": video gibi döngüde oynayan canvas animasyonu.
   Belirsizlik → soru → bağlantı → yapı → akış, ~16 sn döngü. Harici kütüphane yok.
   Ekran dışındayken durur; "hareketi azalt" tercihinde düzenli son kareyi gösterir. */
(function () {
  "use strict";
  var cv = document.getElementById("zihinCanvas");
  if (!cv) return;
  var ctx = cv.getContext("2d");
  var cap = document.getElementById("zihinCap");
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
  var PHASES = [
    [0.00, "Belirsizlik"], [0.20, "Soru"], [0.36, "Bağlantı"], [0.52, "Yapı"], [0.70, "Akış"], [0.90, "Yeniden"]
  ];
  var DUR = 16000;

  var seed = 11;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

  var nodes = ITEMS.map(function (it) {
    return { col: it[0], t: it[1], ax: rnd(), ay: rnd(), ph: rnd() * 6.28, sp: 0.4 + rnd() * 0.6, x: 0, y: 0, ox: 0, oy: 0, w: 0 };
  });
  var noise = NOISE.map(function (t) { return { t: t, ax: rnd(), ay: rnd(), ph: rnd() * 6.28, sp: 0.3 + rnd() * 0.5 }; });
  var dots = []; for (var i = 0; i < 90; i++) dots.push({ x: rnd(), y: rnd(), r: 0.6 + rnd() * 1.4, ph: rnd() * 6.28 });
  // ardışık sütunlar arasında sabit bağlantılar
  var edges = [];
  nodes.forEach(function (a, i) {
    nodes.forEach(function (b, j) { if (b.col === a.col + 1 && rnd() < 0.42) edges.push([i, j, rnd()]); });
  });

  var W = 0, H = 0, dpr = 1, narrow = false, heads = [];
  function layout() {
    var r = cv.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    narrow = W < 760;
    ctx.font = font(narrow ? 12 : 14, 500);
    nodes.forEach(function (n) { n.w = ctx.measureText(n.t).width + (narrow ? 18 : 24); });
    heads = [];
    var top = H * (narrow ? 0.08 : 0.16), bottom = H * (narrow ? 0.66 : 0.70);
    if (!narrow) {
      var colW = (W * 0.86) / COLS.length, x0 = W * 0.07;
      COLS.forEach(function (c, ci) {
        var cx = x0 + colW * ci + colW / 2;
        heads.push({ t: c, x: cx, y: top });
        var list = nodes.filter(function (n) { return n.col === ci; });
        var gap = (bottom - top - 40) / Math.max(list.length, 1);
        list.forEach(function (n, k) { n.ox = cx; n.oy = top + 46 + gap * k + gap / 2 - 10; });
      });
    } else {
      // dar ekran: her sütun bir blok; başlık üstte, düğümler satır kaydırarak dizilir
      var y = top, LH = 32, PADX = 18;
      COLS.forEach(function (c, ci) {
        heads.push({ t: c, x: PADX, y: y, left: true });
        y += 26;
        var list = nodes.filter(function (n) { return n.col === ci; });
        var x = PADX;
        list.forEach(function (n) {
          if (x + n.w > W - PADX) { x = PADX; y += LH; }
          n.ox = x + n.w / 2; n.oy = y; x += n.w + 8;
        });
        y += LH + 12;
      });
    }
  }
  function font(s, w) { return w + " " + s + "px Figtree, system-ui, sans-serif"; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function seg(p, a, b) { return clamp((p - a) / (b - a)); }

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

  var lastPhase = -1;
  function draw(ms) {
    var p = reduce ? 0.62 : (ms % DUR) / DUR;
    var tt = ms / 1000;
    ctx.clearRect(0, 0, W, H);

    // sinaps alanı
    dots.forEach(function (d) {
      var a = 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(tt * 0.8 + d.ph));
      ctx.fillStyle = "rgba(214,220,228," + a.toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(d.x * W, d.y * H * 0.8, d.r, 0, 6.283); ctx.fill();
    });

    var org = ease(seg(p, 0.40, 0.56)) * (1 - ease(seg(p, 0.90, 1)));  // düzen miktarı
    var link = seg(p, 0.30, 0.42) * (1 - seg(p, 0.92, 1));             // bağlantı görünürlüğü
    var clear = seg(p, 0.14, 0.24);                                     // parçaların netleşmesi
    var noiseA = (1 - seg(p, 0.30, 0.46)) * (0.35 + 0.65 * seg(p, 0, 0.08)) + seg(p, 0.93, 1) * 0.6;

    // kafa karışıklığı: uçuşan sorular
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    noise.forEach(function (n) {
      var x = (n.ax * 0.9 + 0.05) * W + Math.sin(tt * n.sp + n.ph) * 30;
      var y = (n.ay * 0.62 + 0.06) * H + Math.cos(tt * n.sp * 0.8 + n.ph) * 22;
      var f = 0.5 + 0.5 * Math.sin(tt * 2 + n.ph);
      ctx.font = font(n.t.length < 3 ? (narrow ? 22 : 30) : (narrow ? 12 : 15), 400);
      ctx.fillStyle = "rgba(168,175,184," + (noiseA * (0.25 + 0.45 * f)).toFixed(3) + ")";
      ctx.fillText(n.t, x, y);
    });

    // düğüm konumları
    nodes.forEach(function (n) {
      var cx = (n.ax * 0.84 + 0.08) * W + Math.sin(tt * n.sp + n.ph) * 26;
      var cy = (n.ay * 0.58 + 0.08) * H + Math.cos(tt * n.sp * 0.9 + n.ph) * 18;
      n.x = cx + (n.ox - cx) * org; n.y = cy + (n.oy - cy) * org;
    });

    // sütun başlıkları
    var headA = org;
    if (headA > 0.01) {
      heads.forEach(function (h) {
        ctx.font = font(narrow ? 11 : 13, 600);
        ctx.textAlign = h.left ? "left" : "center";
        ctx.fillStyle = "rgba(214,220,228," + (headA * 0.95).toFixed(3) + ")";
        ctx.fillText(h.t.toLocaleUpperCase("tr-TR"), h.x, h.y);
      });
      ctx.textAlign = "center";
    }

    // bağlantılar ve akış nabzı
    var pulse = seg(p, 0.66, 0.90);
    edges.forEach(function (e) {
      var a = nodes[e[0]], b = nodes[e[1]];
      var shown = clamp(link * 1.6 - e[2] * 0.6);
      if (shown <= 0) return;
      var x1 = a.x + (narrow ? 0 : a.w / 2), y1 = a.y, x2 = b.x - (narrow ? 0 : b.w / 2), y2 = b.y;
      if (narrow) { y1 += 12; y2 -= 12; x1 = a.x; x2 = b.x; }
      ctx.strokeStyle = "rgba(214,220,228," + (0.10 + 0.22 * shown).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, y1);
      if (!narrow && org > 0.5) { var mx = (x1 + x2) / 2; ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2); }
      else ctx.lineTo(x1 + (x2 - x1) * shown, y1 + (y2 - y1) * shown);
      ctx.stroke();
      // nabız: soldan sağa sütun sütun ilerler
      if (pulse > 0 && org > 0.9) {
        var local = clamp(pulse * COLS.length - a.col);
        if (local > 0 && local < 1) {
          var px, py;
          if (!narrow) { var u = local, mx2 = (x1 + x2) / 2; var iu = 1 - u;
            px = iu*iu*iu*x1 + 3*iu*iu*u*mx2 + 3*iu*u*u*mx2 + u*u*u*x2;
            py = iu*iu*iu*y1 + 3*iu*iu*u*y1 + 3*iu*u*u*y2 + u*u*u*y2; }
          else { px = x1 + (x2 - x1) * local; py = y1 + (y2 - y1) * local; }
          var g = ctx.createRadialGradient(px, py, 0, px, py, 10);
          g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 10, 0, 6.283); ctx.fill();
        }
      }
    });

    // düğümler
    var nh = narrow ? 26 : 32;
    nodes.forEach(function (n, i) {
      var vis = clamp(clear * 1.4 - (i % 5) * 0.08);
      if (vis <= 0) return;
      var lit = pulse > 0 && org > 0.9 ? clamp(1 - Math.abs(pulse * COLS.length - n.col - 0.5) * 1.6) : 0;
      var fa = 0.05 + 0.08 * org + 0.25 * lit;
      pill(n.x, n.y, n.w, nh, "rgba(255,255,255," + (fa * vis).toFixed(3) + ")", "rgba(214,220,228," + ((0.18 + 0.4 * org + 0.4 * lit) * vis).toFixed(3) + ")");
      ctx.font = font(narrow ? 12 : 14, 500);
      ctx.fillStyle = "rgba(243,244,246," + ((0.55 + 0.45 * org) * vis).toFixed(3) + ")";
      ctx.fillText(n.t, n.x, n.y + 1);
    });

    // altyazı
    var ph = 0; for (var k = 0; k < PHASES.length; k++) if (p >= PHASES[k][0]) ph = k;
    if (ph !== lastPhase && cap) {
      lastPhase = ph;
      cap.classList.remove("on"); void cap.offsetWidth;
      cap.textContent = PHASES[ph][1]; cap.classList.add("on");
    }
  }

  var running = false, raf = 0, t0 = performance.now();
  function loop(now) { draw(now - t0); if (running) raf = requestAnimationFrame(loop); }
  function play() { if (running || reduce) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function init() {
    layout(); draw(0);
    if (reduce) return;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { es[0].isIntersecting ? play() : stop(); }, { threshold: 0.05 }).observe(cv);
    } else play();
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); });
  }
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { layout(); if (!running) draw(0); }, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else init();
})();
