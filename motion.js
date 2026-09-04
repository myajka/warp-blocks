/* ============================================================================
   СИСТЕМА ДВИЖЕНИЯ — оркестровка
   ----------------------------------------------------------------------------
   Здесь только то, что нельзя выразить в CSS: наблюдение за прокруткой,
   раздача индексов каскада, слежение за сменой чисел, свечение под курсором.
   Все длительности и кривые живут в :root, дублировать их в JS запрещено.
   ============================================================================ */
"use strict";

(function motionSystem() {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ── 1. Появление при прокрутке ─────────────────────────────────────────
     Порядок групп сверху вниз; внутри группы — индекс, из него CSS считает
     задержку (--i × --stag). Ни один каскад не превышает 500 мс. */

  const GROUPS = [
    [".thesis-grid > *", ""],
    [".chapter-heading > *", "head"],
    [".section-heading > *", "head"],
    [".clock-definitions article", ""],
    [".explanation-grid > *", ""],
    [".mechanism-steps article", ""],
    [".plain-result > *", ""],
    [".controls", ""],
    [".metric", ""],
    [".epoch-card > *", ""],
    [".chart-split > *", ""],
    [".evidence-grid article", ""],
    [".clock-consequence > *", ""],
    [".trade-card", ""],
    [".security-chart", ""],
    [".claim-list details", ""],
    [".rules-grid > *", ""],
    [".decision-callout > *", ""],
    [".sources-grid > div > *", ""],
    [".sources li", ""],
    ["footer .section-shell > *", ""]
  ];

  for (const [selector, kind] of GROUPS) {
    document.querySelectorAll(selector).forEach((node, index) => {
      if (node.hasAttribute("data-reveal")) return;
      node.setAttribute("data-reveal", kind);
      // индекс каскада перезапускается в каждой группе, потолок — 6 тактов
      node.style.setProperty("--i", Math.min(index, 6));
    });
  }

  // полотна графиков открываются шторкой — помечаем их карточки
  document.querySelectorAll(".chart-card canvas").forEach(canvas => {
    const card = canvas.closest(".chart-card");
    if (card) card.setAttribute("data-chart", "");
  });

  const watched = document.querySelectorAll("[data-reveal], [data-chart]");

  if (!("GeistsectionObserver" in window)) {
    watched.forEach(node => node.classList.add("is-in"));
  } else {
    const io = new GeistsectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (!entry.isGeistsecting) continue;
        const node = entry.target;
        // слой поднимаем в композитор только на время движения
        node.style.willChange = "transform, opacity";
        node.classList.add("is-in");
        node.addEventListener("transitionend", () => { node.style.willChange = ""; }, { once: true });
        observer.unobserve(node);
      }
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    watched.forEach(node => io.observe(node));
  }

  /* ── 2. Шапка ───────────────────────────────────────────────────────────
     Три независимых состояния: подложка (is-stuck), уход вверх (is-hidden),
     полоса прочитанного (--progress). Всё считается в одном кадре rAF. */

  const bar = document.querySelector(".topbar");
  const navLinks = [...document.querySelectorAll(".topbar nav a")];
  const sections = navLinks
    .map(link => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  let lastY = window.scrollY;
  let ticking = false;

  function onFrame() {
    ticking = false;
    const y = window.scrollY;
    const span = document.documentElement.scrollHeight - window.innerHeight;

    if (bar) {
      bar.classList.toggle("is-stuck", y > 24);
      bar.style.setProperty("--progress", span > 0 ? (y / span).toFixed(4) : 0);
      // прячем только при осмысленном движении вниз и не у самого верха
      const delta = y - lastY;
    }

    // подсветка текущего раздела в навигации
    if (sections.length) {
      let current = -1;
      sections.forEach((section, i) => {
        if (section.getBoundingClientRect().top <= window.innerHeight * 0.35) current = i;
      });
      navLinks.forEach((link, i) => link.classList.toggle("is-current", i === current));
    }

    lastY = y;
  }

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onFrame);
  }, { passive: true });
  onFrame();

  /* ── 3. Ползунки ────────────────────────────────────────────────────────
     Дорожка закрашивается до бегунка без сглаживания: пока идёт прямое
     перетаскивание, элемент обязан быть жёстко привязан к курсору. */

  const ranges = [...document.querySelectorAll('input[type="range"]')];

  function paintRange(input) {
    const min = +input.min || 0;
    const max = +input.max || 100;
    const share = max === min ? 0 : (+input.value - min) / (max - min);
    input.style.setProperty("--range-fill", `${(share * 100).toFixed(2)}%`);
  }

  ranges.forEach(input => {
    paintRange(input);
    input.addEventListener("input", () => paintRange(input));
    const row = input.closest(".control-row");
    if (!row) return;
    input.addEventListener("pointerdown", () => row.classList.add("is-active"));
    input.addEventListener("focus", () => row.classList.add("is-active"));
    input.addEventListener("blur", () => row.classList.remove("is-active"));
  });
  window.addEventListener("pointerup", () => {
    document.querySelectorAll(".control-row.is-active").forEach(row => {
      if (!row.contains(document.activeElement)) row.classList.remove("is-active");
    });
  }, { passive: true });

  const resetButton = document.getElementById("resetControls");
  if (resetButton) resetButton.addEventListener("click", () => ranges.forEach(paintRange));

  /* ── 4. Смена числовых значений ─────────────────────────────────────────
     Ползунок тянут — значение просто живёт (is-live), без щелчков на каждом
     кадре. Отсечка играет один раз, когда число устоялось: 180 мс тишины. */

  const numeric = [
    ...document.querySelectorAll(".control-row output"),
    ...document.querySelectorAll(".metric strong"),
    ...document.querySelectorAll(".trade-card strong"),
    ...document.querySelectorAll(".epoch-row output")
  ];

  if ("MutationObserver" in window) {
    numeric.forEach(node => {
      node.setAttribute("data-num", "");
      let settle = 0;
      let previous = node.textContent;

      const mo = new MutationObserver(() => {
        if (node.textContent === previous) return;
        previous = node.textContent;
        node.classList.add("is-live");
        node.classList.remove("is-tick");
        clearTimeout(settle);
        settle = setTimeout(() => {
          node.classList.remove("is-live");
          if (reduced.matches) return;
          // перезапуск keyframe: снять класс, дождаться кадра, вернуть
          node.classList.remove("is-tick");
          void node.offsetWidth;
          node.classList.add("is-tick");
        }, 180);
      });

      mo.observe(node, { childList: true, characterData: true, subtree: true });
      node.addEventListener("animationend", () => node.classList.remove("is-tick"));
    });
  }

  /* ── 5. Карточка первого экрана: тёплое пятно идёт за курсором ──────────
     В покое пятно дрейфует само (CSS-цикл 19 с). Под курсором позиция
     переезжает переходом в 320 мс — отставание читается как густой свет.
     Переменные ставятся на саму карточку: у неё четыре потомка, пересчёт
     стилей ничего не стоит. */

  const card = document.querySelector(".glass-card");
  if (card && !reduced.matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let queued = false;
    let point = null;

    card.addEventListener("pointermove", event => {
      const box = card.getBoundingClientRect();
      point = [event.clientX - box.left, event.clientY - box.top];
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        if (!point) return;
        card.style.setProperty("--px", `${Math.round(point[0])}px`);
        card.style.setProperty("--py", `${Math.round(point[1])}px`);
      });
    }, { passive: true });

    card.addEventListener("pointerleave", () => { point = null; }, { passive: true });
  }

  /* ВРЕМЕННЫЙ ПРОБНИК (снять перед сдачей): ?t=мс&y=скролл — стоп-кадр всех
     анимаций и переходов на указанной миллисекунде, для съёмки фаз. */
  const probe = new URLSearchParams(location.search);
  if (probe.has("t") || probe.has("y")) {
    const at = +(probe.get("t") || 0);
    const y = +(probe.get("y") || 0);
    if (y) {
      root.style.scrollBehavior = "auto";
      const go = () => window.scrollTo(0, y);
      go(); window.addEventListener("load", go); setTimeout(go, 60);
    }
    if (probe.has("t")) setTimeout(() => {
      document.getAnimations().forEach(a => { try { a.pause(); a.currentTime = at; } catch (e) {} });
    }, y ? 260 : 140);
  }
})();
