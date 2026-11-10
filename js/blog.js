/* ===================================================================
   Mustafa Ender Doğan — İş Analizi Portfolyosu · blog.js
   Blog sayfaları için bağımsız JS: hamburger menü + footer yılı.
   (Dil değişimi blog'da JS değil, ayrı URL bağlantısıyla yapılır.)
   =================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("nav");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  /* Scroll'da nav arka planı */
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    onScroll();
  }

  /* Mobil hamburger */
  if (hamburger && navLinks) {
    const setMenu = (open) => {
      navLinks.classList.toggle("open", open);
      hamburger.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
      hamburger.setAttribute("aria-expanded", open ? "true" : "false");
    };
    hamburger.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setMenu(false))
    );
    document.addEventListener("click", (e) => {
      if (!navLinks.classList.contains("open")) return;
      if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) setMenu(false);
    });
  }

  /* Footer yılı */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
