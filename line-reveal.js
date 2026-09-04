/* Появление заголовков и вводных абзацев построчно: каждая строка
   выезжает снизу из-под маски. Строки собираются по фактической вёрстке. */
(function lineReveal() {
  var SEL = ".chapter-heading h2, .chapter-heading > p:not(.section-index), .interpretation h2, .bip-explainer h2";
  var targets = [].slice.call(document.querySelectorAll(SEL));
  if (!targets.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function split(el) {
    if (!el.dataset.rvHtml) el.dataset.rvHtml = el.innerHTML;
    el.innerHTML = el.dataset.rvHtml;

    // оборачиваем каждое слово, чтобы узнать, где проходят строки
    var walk = function (node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement("span");
            s.className = "rv-w";
            s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") { walk(n); }
      });
    };
    walk(el);

    // группируем слова в строки по вертикальной позиции
    var words = [].slice.call(el.querySelectorAll(".rv-w"));
    if (!words.length) return;
    var lines = [], cur = [], top = null;
    words.forEach(function (w) {
      var t = Math.round(w.offsetTop);
      if (top === null || Math.abs(t - top) < 4) { cur.push(w); top = top === null ? t : top; }
      else { lines.push(cur); cur = [w]; top = t; }
    });
    if (cur.length) lines.push(cur);

    // каждую строку кладём в маску
    var out = document.createDocumentFragment();
    lines.forEach(function (line, i) {
      var mask = document.createElement("span");
      mask.className = "rv-line";
      var inner = document.createElement("span");
      inner.style.transitionDelay = (i * 90) + "ms";
      line.forEach(function (w, j) {
        if (j) inner.appendChild(document.createTextNode(" "));
        inner.appendChild(document.createTextNode(w.textContent));
      });
      mask.appendChild(inner);
      out.appendChild(mask);
    });
    el.innerHTML = "";
    el.appendChild(out);
    el.classList.add("rv-ready");
  }

  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function(){ targets.forEach(split); }); }
  else { targets.forEach(split); }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-revealed"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
  targets.forEach(function (el) { io.observe(el); });

  var timer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      targets.forEach(function (el) {
        var was = el.classList.contains("is-revealed");
        split(el);
        if (was) el.classList.add("is-revealed");
      });
    }, 220);
  }, { passive: true });
})();
