/* На мобильном панель управления моделью липнет к низу экрана:
   свёрнутая полоса показывает главный результат, тап разворачивает её.
   Живёт только пока глава 03 на экране. */
(function stickyControls() {
  var mq = window.matchMedia("(max-width: 900px)");
  var panel = document.querySelector("#model .controls");
  var section = document.getElementById("model");
  var capacity = document.getElementById("capacityMetric");
  if (!panel || !section) return;

  var head = panel.querySelector(".controls-head");
  var bar = null;

  function build() {
    if (bar) return;
    bar = document.createElement("button");
    bar.type = "button";
    bar.className = "controls-bar";
    bar.innerHTML = '<span class="cb-label"><i class="cb-ico" aria-hidden="true"></i>model</span>' +
                    '<b class="cb-value"></b>' +
                    '<i class="cb-chev" aria-hidden="true"></i>';
    panel.insertBefore(bar, panel.firstChild);
    bar.addEventListener("click", function () {
      panel.classList.toggle("is-open");
      bar.setAttribute("aria-expanded", panel.classList.contains("is-open") ? "true" : "false");
    });
    sync();
  }

  function sync() {
    if (!bar || !capacity) return;
    bar.querySelector(".cb-value").textContent = capacity.textContent + " capacity";
  }

  document.addEventListener("input", sync, true);

  var shown = false;
  function updateHeader() {
    var r = section.getBoundingClientRect();
    var line = 74;                    // высота шапки
    document.body.classList.toggle("over-light", r.top <= line && r.bottom > line);
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("resize", updateHeader, { passive: true });
  updateHeader();

  function update() {
    var r = section.getBoundingClientRect();
    var vh = window.innerHeight;
    var covered = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    // панель живёт, только пока низ главы ещё ниже края экрана
    var reached = covered > vh * 0.5;
    var bottomBelow = r.bottom > vh * 0.98;
    shown = reached && bottomBelow;
    document.body.classList.toggle('model-in-view', shown && mq.matches);
    if (shown && bar && !bar.dataset.pulsed) {
      bar.dataset.pulsed = '1';
      bar.classList.add('is-calling');
      panel.classList.add('is-peek');
      setTimeout(function () { panel.classList.remove('is-peek'); }, 2200);
      setTimeout(function () { bar.classList.remove('is-calling'); }, 5200);
    }
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });

  function apply() {
    if (mq.matches) { build(); if (head) head.hidden = false; }
    else { document.body.classList.remove("model-in-view"); panel.classList.remove("is-open"); }
  }
  apply();
  update();
  mq.addEventListener ? mq.addEventListener("change", apply) : mq.addListener(apply);
})();
