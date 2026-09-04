/* На мобильном кнопка меню показывает текущую главу: «02 / mechanism».
   Список глав получает номера, текущая подсвечена. */
(function mobileToc() {
  var label = document.getElementById("burgerLabel");
  var links = [].slice.call(document.querySelectorAll(".topbar nav a"));
  if (!label || !links.length) return;

  // короткие имена для оглавления
  var SHORT = { introduction: "intro" };

  var chapters = links.map(function (a) {
    var id = a.getAttribute("href").slice(1);
    var sec = document.getElementById(id);
    var idx = sec ? sec.querySelector(".section-index") : null;
    var num = idx ? (idx.textContent.split("/")[0] || "").trim() : "";
    var name = SHORT[a.textContent.trim()] || a.textContent.trim();
    a.dataset.num = num;
    a.textContent = name;
    return { a: a, sec: sec, num: num, name: name };
  });

  function current() {
    var line = window.scrollY + window.innerHeight * 0.3;
    var found = null;
    chapters.forEach(function (c) {
      if (c.sec && c.sec.offsetTop <= line) found = c;
    });
    return found;
  }

  function sync() {
    var c = current();
    label.textContent = c ? c.num + " / " + c.name : chapters[0].num + " / " + chapters[0].name;
    chapters.forEach(function (x) { x.a.classList.toggle("is-current", x === c); });
  }

  sync();
  window.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync, { passive: true });
})();
