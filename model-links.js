/* Связи «ползунок → что меняется» и пояснения к неочевидным параметрам. */
(function modelLinks() {
  var rows = [].slice.call(document.querySelectorAll("[data-affects]"));
  var wide = window.matchMedia("(min-width: 901px)");

  // 1. подсветка связанных мест — только на десктопе
  function targets(row) {
    return [].slice.call(document.querySelectorAll(row.dataset.affects)).map(function (e) {
      return e.closest(".metric, .chart-card, .epoch-rows, .trade-card, .clock-consequence > div") || e;
    });
  }
  var clearTimer = 0;
  function flash(row, hold) {
    if (!wide.matches) return;
    document.querySelectorAll(".is-linked").forEach(function (e) { e.classList.remove("is-linked"); });
    targets(row).forEach(function (e) { e.classList.add("is-linked"); });
    clearTimeout(clearTimer);
    if (!hold) clearTimer = setTimeout(clear, 1400);
  }
  function clear() {
    document.querySelectorAll(".is-linked").forEach(function (e) { e.classList.remove("is-linked"); });
  }

  rows.forEach(function (row) {
    row.addEventListener("mouseenter", function () { flash(row, true); });
    row.addEventListener("mouseleave", clear);
    row.addEventListener("input", function () { flash(row, false); });
  });

  // 2. пояснения: на десктопе всплывают, на мобильном разворачиваются строкой
  [].slice.call(document.querySelectorAll(".hint-btn")).forEach(function (btn) {
    var text = btn.dataset.hint || "";
    var box = document.createElement("span");
    box.className = "hint-box";
    box.textContent = text;
    var host = btn.closest(".control-row, .toggle-row") || btn.parentElement;
    host.appendChild(box);

    function open() { host.classList.add("hint-open"); }
    function close() { host.classList.remove("hint-open"); }

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (host.classList.contains("hint-open")) close();
      else {
        document.querySelectorAll(".hint-open").forEach(function (h) { h.classList.remove("hint-open"); });
        open();
      }
    });
    btn.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); btn.click(); } });
    btn.addEventListener("mouseenter", function () { if (wide.matches) open(); });
    host.addEventListener("mouseleave", function () { if (wide.matches) close(); });
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".hint-btn, .hint-box")) {
      document.querySelectorAll(".hint-open").forEach(function (h) { h.classList.remove("hint-open"); });
    }
  });
})();
