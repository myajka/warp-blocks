/* Приглашение потрогать модель: контур панели управления вспыхивает,
   рядом всплывает подсказка. Гаснет от первого касания или сама. */
(function modelCue() {
  var panel = document.querySelector("#model .controls");
  if (!panel) return;
  if (sessionStorage.getItem("wb-model-cue") === "seen") return;

  var tip = document.createElement("div");
  tip.className = "model-tip";
  tip.innerHTML = "<b>Drag the sliders</b><span>The whole model recalculates as you move them.</span>";
  panel.appendChild(tip);

  var timer = 0;
  function stop() {
    panel.classList.remove("is-cued");
    tip.classList.remove("is-on");
    clearTimeout(timer);
    try { sessionStorage.setItem("wb-model-cue", "seen"); } catch (e) {}
    panel.removeEventListener("pointerdown", stop);
    panel.removeEventListener("input", stop);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      panel.classList.add("is-cued");
      tip.classList.add("is-on");
      timer = setTimeout(stop, 7000);
    });
  }, { threshold: 0.45 });
  io.observe(panel);

  panel.addEventListener("pointerdown", stop);
  panel.addEventListener("input", stop);
})();
