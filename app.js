"use strict";

const P = 2016 * 600;
const FUTURE = 7200;
const BIP54_INTERVAL = 596.7211;
const COLORS = {
  ink: "#11120f", grid: "rgba(17,18,15,.12)", muted: "#777870",
  orange: "#D9660F", blue: "#29b6d1", yellow: "#d9ad20", red: "#f05252",
  white: "#fffdf7", darkGrid: "rgba(255,255,255,.12)"
};

const ids = ["participation", "interval", "hashrate", "propagation", "fill", "txWeight", "elasticity", "bip54"];
const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
const defaults = { participation: 95, interval: 300, hashrate: 100, propagation: 50, fill: 90, txWeight: 900, elasticity: 100, bip54: false };

const text = (id, value) => { document.getElementById(id).textContent = value; };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pct = v => `${(v * 100).toFixed(v < .01 ? 2 : 1)}%`;

function state() {
  return {
    p: +el.participation.value / 100,
    interval: +el.interval.value,
    hashrate: +el.hashrate.value / 100,
    propagation: +el.propagation.value / 10,
    fill: +el.fill.value / 100,
    txWeight: +el.txWeight.value,
    elasticity: +el.elasticity.value / 100,
    bip54: el.bip54.checked
  };
}

function formatGeistval(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function formatClock(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

const popcount = new Uint8Array(2048);
for (let i = 1; i < popcount.length; i++) popcount[i] = popcount[i >> 1] + (i & 1);

function cleanEpochExact(p) {
  if (p >= 1) return 1;
  if (p <= 0) return 0;
  const q = 1 - p;
  let current = new Float64Array(1024);
  let next = new Float64Array(1024);
  for (let m = 0; m < 1024; m++) {
    const k = popcount[m];
    current[m] = q ** k * p ** (10 - k);
  }
  for (let n = 10; n < 2016; n++) {
    next.fill(0);
    for (let m = 0; m < 1024; m++) {
      const v = current[m];
      if (!v) continue;
      const zero = m << 1;
      if (popcount[zero] < 6) next[zero & 1023] += v * p;
      const one = zero | 1;
      if (popcount[one] < 6) next[one & 1023] += v * q;
    }
    [current, next] = [next, current];
  }
  let result = 0;
  for (const v of current) result += v;
  return result;
}

const cliffData = [
  [.50, 0], [.75, 0], [.80, .003], [.85, .152671], [.87, .393223],
  [.88, .535441], [.89, .669848], [.90, .783181], [.91, .869160],
  [.92, .928095], [.93, .964546], [.94, .984701], [.95, .994460],
  [.97, .99987], [.99, .99999953], [1, 1]
];

function canvasContext(canvas, dark = false) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  return { ctx, w: rect.width, h: rect.height, grid: dark ? COLORS.darkGrid : COLORS.grid };
}

function grid(ctx, w, h, pad, gridColor, xLines = 6, yLines = 5) {
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= xLines; i++) {
    const x = pad.l + (w - pad.l - pad.r) * i / xLines;
    ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, h - pad.b); ctx.stroke();
  }
  for (let i = 0; i <= yLines; i++) {
    const y = pad.t + (h - pad.t - pad.b) * i / yLines;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
  }
}

function label(ctx, value, x, y, align = "left", color = COLORS.muted, size = 16) {
  ctx.fillStyle = color;
  ctx.font = size + "px Geist";
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}

function path(ctx, data, xScale, yScale, color, width = 2, dash = []) {
  if (!data.length) return;
  ctx.beginPath();
  data.forEach((d, i) => (i ? ctx.lineTo(xScale(d[0]), yScale(d[1])) : ctx.moveTo(xScale(d[0]), yScale(d[1]))));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawHero(s) {
  const canvas = document.getElementById("heroClock");
  const { ctx, w, h } = canvasContext(canvas, true);
  ctx.clearRect(0, 0, w, h);
  const pad = { l: 35, r: 35, t: 70, b: 42 };
  const speed = s.bip54 ? 600 / BIP54_INTERVAL : 600 / s.interval;
  const x = v => pad.l + v * (w - pad.l - pad.r);
  const y = v => h - pad.b - v / Math.max(2.1, speed + .15) * (h - pad.t - pad.b);
  for (let i = 0; i < 16; i++) {
    const xx = x(i / 15);
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.beginPath(); ctx.moveTo(xx, pad.t); ctx.lineTo(xx, h - pad.b); ctx.stroke();
  }
  path(ctx, [[0,0],[1,1]], x, y, "#777a73", 1.5, [5,6]);
  path(ctx, [[0,0],[1,speed]], x, y, COLORS.orange, 4);
  ctx.fillStyle = COLORS.orange;
  ctx.beginPath(); ctx.arc(x(1), y(speed), 6, 0, Math.PI * 2); ctx.fill();
  label(ctx, "WALL TIME  1.00×", x(.98), y(1) - 10, "right", "#a1a39d");
  label(ctx, `HEIGHT  ${speed.toFixed(2)}×`, x(.98), y(speed) - 12, "right", COLORS.orange);
}

function drawParticipation(s, selectedClean) {
  const canvas = document.getElementById("participationChart");
  const { ctx, w, h, grid: gridColor } = canvasContext(canvas);
  ctx.clearRect(0, 0, w, h);
  const pad = { l: 58, r: 22, t: 24, b: 40 };
  grid(ctx, w, h, pad, gridColor, 5, 4);
  const x = v => pad.l + (v - .5) / .5 * (w - pad.l - pad.r);
  const y = v => h - pad.b - v * (h - pad.t - pad.b);
  path(ctx, cliffData, x, y, COLORS.orange, 2.5);
  const sx = x(s.p), sy = y(selectedClean);
  ctx.strokeStyle = "rgba(217, 102, 15,.28)"; ctx.setLineDash([3,4]);
  ctx.beginPath(); ctx.moveTo(sx, pad.t); ctx.lineTo(sx, h-pad.b); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = COLORS.orange; ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI*2); ctx.fill();
  label(ctx, pct(selectedClean), sx + (s.p > .88 ? -8 : 8), sy - 10, s.p > .88 ? "right" : "left", COLORS.orange);
  for (let i = 0; i <= 5; i++) label(ctx, `${50+i*10}%`, x(.5+i*.1), h-13, i ? (i===5?"right":"center") : "left");
  label(ctx, "100%", pad.l - 8, pad.t + 3, "right");
  label(ctx, "0%", pad.l - 8, h - pad.b + 3, "right");
}

function drawBip(s) {
  const canvas = document.getElementById("bipChart");
  const { ctx, w, h } = canvasContext(canvas);
  ctx.clearRect(0, 0, w, h);
  const requested = 600 / s.interval;
  const residual = 600 / BIP54_INTERVAL;
  const max = Math.max(2.1, requested * 1.12);
  const narrow = w < 620;
  const x0 = narrow ? 84 : 152, x1 = w - (narrow ? 54 : 96);
  const x = v => x0 + v / max * (x1 - x0);
  const rows = [["CURRENT RULES", requested, COLORS.orange], ["BIP-54", residual, COLORS.blue]];
  rows.forEach((row, i) => {
    const y = 62 + i * 84;
    if (narrow && row[0].indexOf(" ") > 0) {
      const parts = row[0].split(" ");
      label(ctx, parts[0], 0, y + 6, "left", COLORS.muted, 11);
      label(ctx, parts.slice(1).join(" "), 0, y + 19, "left", COLORS.muted, 11);
    } else {
      label(ctx, row[0], 0, y + 12, "left", COLORS.muted, 11);
    }
    ctx.fillStyle = "#e9e6dd"; ctx.fillRect(x0, y, x1-x0, 20);
    ctx.fillStyle = row[2]; ctx.fillRect(x0, y, Math.max(2,x(row[1])-x0), 20);
    label(ctx, `${row[1].toFixed(row[1] < 1.1 ? 3 : 2)}×`, x1 + 12, y + 15, "left", row[2]);
  });
  const steps = narrow ? 2 : 4;
  for (let i = 0; i <= steps; i++) label(ctx, `${(max*i/steps).toFixed(1)}×`, x(max*i/steps), h-14, i ? (i===steps?"right":"center") : "left", COLORS.muted, narrow ? 12 : 16);
}

function drawSecurity(s) {
  const canvas = document.getElementById("securityChart");
  const { ctx, w, h, grid: gridColor } = canvasContext(canvas, true);
  ctx.clearRect(0, 0, w, h);
  const narrow = w < 620;
  const pad = { l: narrow ? 26 : 52, r: narrow ? 16 : 56, t: 34, b: 44 };
  grid(ctx, w, h, pad, gridColor, 7, 4);
  const data = Array.from({length: 71}, (_,i) => { const speed=1+i/10; return [speed,speed,1/speed]; });
  const x = v => pad.l + (v-1)/7 * (w-pad.l-pad.r);
  const yCapacity = v => h-pad.b - (v/8)*(h-pad.t-pad.b);
  const yWork = v => h-pad.b - v*(h-pad.t-pad.b);
  path(ctx, data.map(d=>[d[0],d[1]]), x, yCapacity, COLORS.orange, 3);
  path(ctx, data.map(d=>[d[0],d[2]]), x, yWork, COLORS.blue, 3);
  const selected = s.bip54 ? 600/BIP54_INTERVAL : 600/s.interval;
  ctx.strokeStyle="rgba(255,255,255,.35)";ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x(selected),pad.t);ctx.lineTo(x(selected),h-pad.b);ctx.stroke();ctx.setLineDash([]);
  for(let i=0;i<=7;i++) label(ctx,`${i+1}×`,x(i+1),h-15,i?(i===7?"right":"center"):"left","#858780");
  label(ctx,"CAPACITY",pad.l,pad.t-12,"left",COLORS.orange);
  label(ctx,"WORK / BLOCK",w-pad.r,pad.t-12,"right",COLORS.blue);
  label(ctx,`${selected.toFixed(2)}×`,x(selected),pad.t+16,"center",COLORS.white);
}

let exactTimer = 0;
let cleanValue = .99446038;

function update(exact = false) {
  const s = state();
  const actualGeistval = s.bip54 ? BIP54_INTERVAL : s.interval;
  const speed = 600 / actualGeistval;
  const capacity = speed;
  const lagSec = s.bip54 ? 0 : Math.max(0, P * (1 - 1 / speed) - FUTURE);
  const weightHour = 3600 / actualGeistval * 4_000_000 * s.fill;
  const tps = 4_000_000 * s.fill / s.txWeight / actualGeistval;
  const overlap = 1 - Math.exp(-s.propagation / actualGeistval);
  const feeRatio = speed ** (1 - 1 / s.elasticity);
  const epochRealDays = 2016 * actualGeistval / 86400;

  text("participationOut", `${Math.round(s.p * 100)}%`);
  text("intervalOut", formatGeistval(s.interval));
  text("hashrateOut", `${s.hashrate.toFixed(2)}×`);
  text("difficultyHint", `Requires difficulty ${(s.hashrate / speed).toFixed(2)}× baseline`);
  text("propagationOut", `${s.propagation.toFixed(1)}s`);
  text("fillOut", `${Math.round(s.fill * 100)}%`);
  text("txWeightOut", `${Math.round(s.txWeight)} WU`);
  text("elasticityOut", s.elasticity.toFixed(2));
  text("heroCadence", formatClock(actualGeistval));
  text("capacityMetric", `${capacity.toFixed(2)}×`);
  text("weightMetric", `${(weightHour / 1e6).toFixed(1)} MWU / hour`);
  text("cleanMetric", pct(cleanValue));
  text("lagMetric", s.bip54 ? "<2h" : `${(lagSec / 86400).toFixed(2)}d`);
  text("tpsMetric", `${tps.toFixed(1)} TPS`);
  text("tradeCapacity", `${capacity >= 1 ? "+" : ""}${((capacity - 1) * 100).toFixed(0)}%`);
  text("tradeWork", `${(1 / speed - 1) * 100 >= 0 ? "+" : "−"}${Math.abs((1 / speed - 1) * 100).toFixed(0)}%`);
  text("tradeOverlap", pct(overlap));
  text("tradeFees", `${feeRatio.toFixed(2)}×`);
  text("epochRealValue", `${epochRealDays.toFixed(2)} days`);
  text("epochHeightValue", "14.00 days");
  text("epochTimestampValue", "14.00 days");
  // масштаб вместо ширины: ширина пересчитывает раскладку на каждом кадре
  document.getElementById("epochRealBar").style.setProperty("--fill", clamp(epochRealDays / 14, .01, 1).toFixed(4));
  text("epochIntro", s.bip54
    ? "With BIP-54 applied, 2,016 blocks again take almost 14 real days. All three readings stay close together."
    : `At ${formatGeistval(actualGeistval).toLowerCase()} blocks, miners finish 2,016 blocks in ${epochRealDays.toFixed(2)} real days. Bitcoin's height schedule advances by a full 14-day period.`);
  text("epochLagValue", s.bip54
    ? "BIP-54 limits the boundary reset to two hours"
    : `Reset the next epoch ≈ ${(lagSec / 86400).toFixed(2)} days behind`);
  text("clockCaption", s.bip54
    ? "Without a multi-day reset, the retarget cannot be held at a materially faster cadence."
    : "The missing real-world days are supplied through the timestamp jump and reset at the period boundary.");

  drawHero(s); drawParticipation(s, cleanValue); drawBip(s); drawSecurity(s);

  if (!exact) {
    clearTimeout(exactTimer);
    exactTimer = setTimeout(() => {
      cleanValue = cleanEpochExact(state().p);
      text("cleanMetric", pct(cleanValue));
      drawParticipation(state(), cleanValue);
    }, 100);
  }
}

for (const input of Object.values(el)) input.addEventListener("input", () => update());
document.getElementById("resetControls").addEventListener("click", () => {
  for (const [key, value] of Object.entries(defaults)) {
    if (key === "bip54") el[key].checked = value;
    else el[key].value = value;
  }
  cleanValue = .99446038;
  update();
});

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => update(true), 120);
});

update();


/* Поведение шапки при прокрутке перенесено в motion.js — один владелец. */

/* --- подсветка активного пункта меню по положению читателя --- */
(function activeNavItem() {
  const links = [...document.querySelectorAll(".topbar nav a[href^='#']")];
  if (!links.length) return;

  const targets = links
    .map(a => ({ a, el: document.querySelector(a.getAttribute("href")) }))
    .filter(x => x.el);

  const update = () => {
    const line = window.scrollY + window.innerHeight * 0.3;
    let current = null;
    for (const x of targets) if (x.el.offsetTop <= line) current = x.a;
    links.forEach(a => a.classList.toggle("is-active", a === current));
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
