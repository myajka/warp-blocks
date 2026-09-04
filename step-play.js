/* Полоски в карточках шагов растут, когда карточка доехала до экрана. */
(function stepPlay() {
  var icons = [].slice.call(document.querySelectorAll(".step-icon"));
  if (!icons.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-playing"); io.unobserve(e.target); }
    });
  }, { threshold: 0.55 });
  icons.forEach(function (i) { io.observe(i); });
})();
