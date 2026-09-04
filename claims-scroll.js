/* Пункты главы 06 раскрываются плавно: высота анимируется, первый открыт сразу,
   следующие открываются по мере прокрутки. */
(function claimsScroll() {
  var items = [].slice.call(document.querySelectorAll(".claim-list details"));
  if (!items.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // содержимое переносим в обёртку с анимируемой высотой
  items.forEach(function (d, i) {
    var summary = d.querySelector("summary");
    var body = document.createElement("div");
    body.className = "claim-body";
    var inner = document.createElement("div");
    inner.className = "claim-inner";
    while (summary && summary.nextSibling) inner.appendChild(summary.nextSibling);
    body.appendChild(inner);
    d.appendChild(body);
    d.open = true;                       // нативное раскрытие больше не используем
    d.classList.toggle("is-shown", i === 0 || reduce);

    if (summary) {
      summary.addEventListener("click", function (e) {
        e.preventDefault();
        d.classList.toggle("is-shown");
        d.dataset.manual = "1";
      });
    }
  });

  if (reduce) return;

  function check() {
    var line = window.innerHeight * 0.62;
    items.forEach(function (d, i) {
      if (i === 0 || d.dataset.manual === "1" || d.classList.contains("is-shown")) return;
      if (d.getBoundingClientRect().top < line) d.classList.add("is-shown");
    });
  }

  check();
  window.addEventListener("scroll", check, { passive: true });
  window.addEventListener("resize", check, { passive: true });
})();
