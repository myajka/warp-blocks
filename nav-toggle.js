/* Мобильное меню: бургер открывает/закрывает выпадающий список навигации. */
(function navToggle() {
  var topbar = document.querySelector(".topbar");
  var burger = document.getElementById("burger");
  if (!topbar || !burger) return;

  function closeNav() {
    topbar.classList.remove("nav-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }
  function openNav() {
    topbar.classList.add("nav-open");
    burger.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
  }
  function toggleNav() {
    if (topbar.classList.contains("nav-open")) closeNav();
    else openNav();
  }

  burger.addEventListener("click", toggleNav);
  [].slice.call(topbar.querySelectorAll("nav a")).forEach(function (a) {
    a.addEventListener("click", closeNav);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) closeNav();
  });
})();
