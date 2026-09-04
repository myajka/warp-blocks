/* Подсветка квадратной сетки под курсором: слой .grid-glow виден только
   через маску-пятно, координаты которой мягко догоняют мышь. */
(function gridGlow() {
  // шаг сетки — ровно четверть расстояния между разметочными линиями (20%)
  function measure() {
    var w = document.documentElement.clientWidth;
    var r = document.documentElement.style;
    r.setProperty("--vwx", w + "px");
    r.setProperty("--cell", (w * 0.05).toFixed(2) + "px");
  }
  measure();
  window.addEventListener("resize", measure, { passive: true });

  var el = document.querySelector(".grid-glow");
  if (!el || !window.matchMedia("(hover: hover)").matches) return;

  var soft = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tx = 0, ty = 0, cx = 0, cy = 0, live = false, queued = false;

  function paint() {
    queued = false;
    if (soft) { cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16; }
    else { cx = tx; cy = ty; }
    el.style.setProperty("--mx", cx.toFixed(1) + "px");
    el.style.setProperty("--my", cy.toFixed(1) + "px");
    if (live && (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5)) request();
  }
  function request() { if (!queued) { queued = true; requestAnimationFrame(paint); } }

  window.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    tx = e.clientX; ty = e.clientY;
    if (!live) { live = true; cx = tx; cy = ty; el.classList.add("is-on"); }
    request();
  }, { passive: true });

  document.addEventListener("mouseleave", function () {
    live = false; el.classList.remove("is-on");
  });
  window.addEventListener("blur", function () {
    live = false; el.classList.remove("is-on");
  });
})();
