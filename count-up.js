/* Числа набегают до своего значения, когда блок появляется на экране. */
(function countUp() {
  var nodes = [].slice.call(document.querySelectorAll("[data-count]"));
  if (!nodes.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fmt = function (n, sep) {
    var s = String(n);
    return sep ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : s;
  };

  function run(el) {
    var target = parseInt(el.dataset.count, 10) || 0;
    var sep = el.dataset.sep === "1";
    if (reduce) { el.textContent = fmt(target, sep); return; }

    var dur = 1100, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * e), sep);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target, sep);
    }
    requestAnimationFrame(step);
    // страховка на случай, когда кадры не идут
    setTimeout(function () { if (el.textContent === "0") el.textContent = fmt(target, sep); }, 1600);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  nodes.forEach(function (n) { io.observe(n); });
})();
