/* Шкалы расхождения дедлайнов запускаются, когда блок появляется на экране. */
(function race() {
  // код в главе 07 набирается, когда блок появляется
  var rules = document.querySelector(".rules-grid");
  if (rules) {
    // текст кода в отдельной обёртке — фон плашки не анимируем
    [].slice.call(rules.querySelectorAll("code")).forEach(function (c) {
      if (c.querySelector(".code-txt")) return;
      var s = document.createElement("span");
      s.className = "code-txt";
      while (c.firstChild) s.appendChild(c.firstChild);
      c.appendChild(s);
    });
    var typed = false;
    var onRules = function () {
      if (typed) return;
      var r = rules.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.8 && r.bottom > 0) { rules.classList.add("is-typed"); typed = true; }
    };
    onRules();
    window.addEventListener("scroll", onRules, { passive: true });
  }

  // график 04 прочерчивается слева направо, когда попадает в экран
  var chart = document.getElementById("securityChart");
  if (chart) {
    var host = chart.closest(".chart-card") || chart;
    var drawn = false;
    var onScroll = function () {
      if (drawn) return;
      var r = host.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.8 && r.bottom > 0) { host.classList.add("is-drawn"); drawn = true; }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  var box = document.querySelector(".clock-consequence");
  if (!box) return;
  function check() {
    var r = box.getBoundingClientRect();
    var seen = r.top < window.innerHeight * 0.85 && r.bottom > 0;
    box.classList.toggle("is-racing", seen);
  }
  check();
  window.addEventListener("scroll", check, { passive: true });
  window.addEventListener("resize", check, { passive: true });
})();
