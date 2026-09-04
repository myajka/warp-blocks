/* --- первый экран: вращающиеся пиксельные часы ------------------------------
   Двусторонний циферблат: лицевая сторона идёт по реальному времени,
   обратная — по времени блоков, вчетверо быстрее. Корпус можно крутить
   мышью или пальцем; после паузы возвращается автовращение.
--------------------------------------------------------------------------- */
(function pixelClock3D() {
  const canvas = document.getElementById("heroFx");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const CELL = 8, GAP = 2, STEP = CELL + GAP;
  const TONES = [
    [255, 168, 92],    // 0 — светлый оранжевый
    [217, 102, 15],    // 1 — основной оранжевый
    [176, 80, 14],    // 2 — тень
    [86, 40, 8]      // 3 — глубокая тень
  ];

  let W = 0, H = 0, cols = 0, rows = 0, t = 0, grid = null, tone = null, depth = null;

  function resize() {
    W = Math.max(1, canvas.clientWidth || window.innerWidth);
    H = Math.max(1, canvas.clientHeight || window.innerHeight);
    canvas.width = W; canvas.height = H;
    cols = Math.ceil(W / STEP); rows = Math.ceil(H / STEP);
    grid = new Float32Array(cols * rows);
    tone = new Uint8Array(cols * rows);
    depth = new Float32Array(cols * rows);
  }


  // запись клетки с проверкой глубины — ближнее перекрывает дальнее
  function put(x, y, z, v, tn) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    const i = y * cols + x;
    if (grid[i] === 0 || z > depth[i]) { grid[i] = v; tone[i] = tn; depth[i] = z; }
  }

  const rot = (p, ax, ay) => {
    let [x, y, z] = p;
    let c = Math.cos(ay), s = Math.sin(ay);
    [x, z] = [x * c - z * s, x * s + z * c];
    c = Math.cos(ax); s = Math.sin(ax);
    [y, z] = [y * c - z * s, y * s + z * c];
    return [x, y, z];
  };

  let gap = null;
  function measureGap() {
    gap = null;
    if (W >= 900) return;
    const lede = document.querySelector('.hero-lede');
    const cta = document.querySelector('.hero-cta');
    const box = canvas.getBoundingClientRect();
    if (!lede || !cta) return;
    const top = (lede.getBoundingClientRect().bottom - box.top + 20) / STEP;
    const bottom = (cta.getBoundingClientRect().top - box.top - 20) / STEP;
    if (bottom - top < 8) return;
    gap = { cy: (top + bottom) / 2, r: Math.min((bottom - top) / 2, cols * 0.34) };
  }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function frame() {
    if (!reduce) t += 1;
    grid.fill(0); tone.fill(0); depth.fill(-9);

    const narrow = W < 900;
    const cx = cols * (narrow ? 0.5 : 0.72);
    const cy = narrow && gap ? gap.cy : rows * (narrow ? 0.52 : 0.5);
    const R = narrow && gap ? gap.r : Math.min(cols, rows) * (narrow ? 0.31 : 0.27);

    const ax = 0.30 + Math.sin(t * 0.013) * 0.20;      // покачивание
    const ay = t * 0.034;                               // вращение корпуса
    const DEPTH = 0.14;                                // толщина корпуса

    const project = (p) => {
      const [x, y, z] = rot(p, ax, ay);
      const k = 4.2 / (4.2 - z);
      return [cx + x * R * k, cy + y * R * k, z];
    };

    // 1. корпус: заливка диска точками по спирали + боковина
    for (let face = 0; face < 2; face++) {
      const zf = face === 0 ? DEPTH : -DEPTH;
      const rings = Math.ceil(R * 2.2);
      for (let ri = 0; ri <= rings; ri++) {
        const rr = ri / rings;
        const steps = Math.max(12, Math.ceil(rr * R * 16));
        for (let si = 0; si < steps; si++) {
          const a = si / steps * Math.PI * 2;
          const [px, py, pz] = project([Math.cos(a) * rr, Math.sin(a) * rr, zf]);
          if (face === 0) {
            const shade = 0.46 + (1 - rr) * 0.20;            // лицевая сторона
            put(px, py, pz, shade, rr > 0.93 ? 1 : 2);
          } else {
            const shade = 0.42 + (1 - rr) * 0.18;            // обратная сторона
            put(px, py, pz, shade, rr > 0.93 ? 1 : 2);
          }
        }
      }
    }

    // 2. боковой ободок — придаёт объём
    const sideSteps = Math.ceil(R * 16);
    for (let i = 0; i < sideSteps; i++) {
      const a = i / sideSteps * Math.PI * 2;
      for (let d = -DEPTH; d <= DEPTH; d += DEPTH / 8) {
        const [px, py, pz] = project([Math.cos(a), Math.sin(a), d]);
        put(px, py, pz, 0.78 + Math.max(0, Math.cos(a - 0.6)) * 0.22, 1);
      }
    }

    // 3. деления — на обеих сторонах корпуса
    for (const side of [1, -1]) {
      for (let m = 0; m < 12; m++) {
        const a = m / 12 * Math.PI * 2 - Math.PI / 2;
        const big = true;
        const r0 = 0.72, r1 = 0.92;
        const steps = Math.ceil((r1 - r0) * R * 4);
        for (let s = 0; s <= steps; s++) {
          const rr = r0 + (r1 - r0) * (s / steps);
          const [px, py, pz] = project([Math.cos(a) * rr * side, Math.sin(a) * rr, side * (DEPTH + 0.02)]);
          put(px, py, pz, 0.9, 1);
        }
      }
    }

    // 4. стрелки — в плоскости циферблата, вращаются вместе с корпусом
    const hand = (angle, len, width, v, tn, side) => {
      const steps = Math.ceil(len * R * 4);
      for (let s = 0; s <= steps; s++) {
        const rr = len * (s / steps);
        for (let w = -width; w <= width; w++) {
          const off = w * 0.012;
          const hx = (Math.cos(angle) * rr - Math.sin(angle) * off) * side;
          const hy = Math.sin(angle) * rr + Math.cos(angle) * off;
          const [px, py, pz] = project([hx, hy, side * (DEPTH + 0.05)]);
          put(px, py, pz, v, tn);
        }
      }
    };

    // лицевая сторона — реальное время, медленно
    hand(t * 0.018 - Math.PI / 2, 0.62, 1, 1.0, 0, 1);
    hand(t * 0.0036 - Math.PI / 2, 0.42, 1, 0.85, 1, 1);

    // обратная сторона — время блоков, вчетверо быстрее
    hand(t * 0.072 - Math.PI / 2, 0.62, 1, 1.0, 0, -1);
    hand(t * 0.0144 - Math.PI / 2, 0.42, 1, 0.85, 1, -1);

    // ось
    for (const side of [1, -1]) {
      for (let r = 0; r < 0.05; r += 0.02) {
        for (let a = 0; a < Math.PI * 2; a += 0.5) {
          const [px, py, pz] = project([Math.cos(a) * r, Math.sin(a) * r, side * (DEPTH + 0.07)]);
          put(px, py, pz, 1, 1);
        }
      }
    }

    // вывод — только блоки, никаких градиентов
    ctx.clearRect(0, 0, W, H);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const v = grid[i];
        if (v < 0.05) continue;
        const c = TONES[tone[i]];
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${v.toFixed(3)})`;
        ctx.fillRect(x * STEP, y * STEP, CELL, CELL);
      }
    }

    if (!reduce) requestAnimationFrame(() => setTimeout(frame, 40));
  }

  resize();
  window.addEventListener('resize', function () { resize(); measureGap(); });

  function start() { resize(); measureGap(); frame(); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  else start();
})();
