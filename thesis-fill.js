/* Цитата в блоке THESIS заливается пословно по мере прокрутки секции. */
(function thesisFill() {
  var targets = [].slice.call(document.querySelectorAll(".fill-scroll"));
  if (!targets.length) return;
  targets.forEach(setup);
  function setup(q) {

  // разбиваем текст на слова, сохраняя вложенные em
  (function wrap(node) {
    [].slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement("span");
          s.className = "w";
          s.textContent = part;
          frag.appendChild(s);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1) { wrap(n); }
    });
  })(q);

  var words = q.querySelectorAll(".w");
  if (!words.length) return;
  var n = words.length;

  function paint() {
    var r = q.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = (vh * 0.82 - r.top) / (r.height + vh * 0.32);
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    var edge = p * (n + 6) - 3;
    for (var i = 0; i < n; i++) {
      var k = edge - i;
      k = k < 0 ? 0 : k > 1 ? 1 : k;
      words[i].style.setProperty("--w", k.toFixed(3));
    }
  }
  function request() { paint(); }

  paint();
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request, { passive: true });
  }
})();
