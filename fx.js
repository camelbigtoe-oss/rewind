// Visual effects: the animated arcade/comic background for each theme, a diagonal "slash" wipe between
// screens, and confetti. Backgrounds draw on #fx; the wipe draws on #static over everything.
const FX = (() => {
  "use strict";
  const cv = document.getElementById("fx"), x = cv.getContext("2d");
  const st = document.getElementById("static"), sx = st.getContext("2d");
  let W = 0, H = 0, dpr = 1, theme = "saturday", items = [], sky = [], t0 = performance.now(), flash = 0, nextBolt = 2, bolt = null, dots = null;
  const PAL = {
    saturday: { bg: ["#061033", "#1f3f9a"], ray: "#2a5ad0", c: ["#e8202a", "#ffd21f", "#2fd8ff", "#ffffff"], city: true, bolts: 9 },
    grunge: { bg: ["#05070c", "#26303f"], ray: null, c: ["#c9d4e0"], city: true, rain: true, bolts: 4 },
    rave: { bg: ["#07001a", "#1a0040"], ray: null, c: ["#ff1f8f", "#00f0ff", "#e6ff00", "#8a00ff"], lasers: true },
    pastel: { bg: ["#2a1030", "#ff6a4a"], ray: null, c: ["#ffd26a", "#ffffff"], city: true, sun: true },
    arcade: { bg: ["#0b0020", "#2a0050"], ray: null, c: ["#ff2fd0", "#2fe5ff", "#ffb23f"], grid: true, sun: true },
    hyper: { bg: ["#100020", "#002030"], ray: "#ffffff", c: ["#ff3f8e", "#ffe14d", "#2fd8ff", "#1ee3a1", "#7b3cff"], hyper: true },
    gold: { bg: ["#1a1005", "#4a3008"], ray: "#d9a520", c: ["#ffd23f", "#fff6c8", "#d9a520"], sparks: true },
  };
  const R = (a, b) => a + Math.random() * (b - a);
  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    for (const c of [cv, st]) { c.width = W * dpr; c.height = H * dpr; c.style.width = W + "px"; c.style.height = H + "px"; }
    x.setTransform(dpr, 0, 0, dpr, 0, 0); sx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // halftone dot tile
    const d = document.createElement("canvas"); d.width = d.height = 8; const dc = d.getContext("2d");
    dc.fillStyle = "rgba(0,0,0,.35)"; dc.beginPath(); dc.arc(4, 4, 1.4, 0, 6.3); dc.fill();
    dots = x.createPattern(d, "repeat");
    seed();
  }
  function seed() {
    const p = PAL[theme];
    // skyline: random building blocks with lit windows
    sky = []; let bx = -10;
    while (bx < W + 20) { const w = R(28, 70), h = R(H * 0.05, H * 0.17); const wins = []; for (let yy = 8; yy < h - 8; yy += 12) for (let xx = 6; xx < w - 6; xx += 10) if (Math.random() < 0.35) wins.push([xx, yy, Math.random()]); sky.push({ x: bx, w, h, wins, ant: Math.random() < 0.2 }); bx += w + R(-6, 4); }
    const n = p.rain ? 140 : p.sparks ? 60 : 36;
    items = Array.from({ length: n }, () => ({ x: R(0, W), y: R(0, H), s: R(2, 5), vx: p.rain ? R(-60, -30) : R(-10, 10), vy: p.rain ? R(500, 800) : R(-30, -8), c: p.c[Math.floor(Math.random() * p.c.length)], ph: R(0, 6.3) }));
  }
  function makeBolt() {
    const pts = []; let px = R(W * 0.1, W * 0.9), py = 0;
    while (py < H * R(0.45, 0.8)) { pts.push([px, py]); px += R(-50, 50); py += R(30, 70); }
    pts.push([px, py]); return pts;
  }
  function rays(t, col, alpha) {
    const cx = W / 2, cy = H * 0.38, n = 28, rot = t * 0.04, r = Math.hypot(W, H);
    x.save(); x.globalAlpha = alpha; x.fillStyle = col;
    for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2, b = a + Math.PI / n * 0.9; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); x.lineTo(cx + Math.cos(b) * r, cy + Math.sin(b) * r); x.fill(); }
    x.restore();
  }
  function grid(t, col, horizon) {
    const hz = H * horizon;
    x.strokeStyle = col; x.lineWidth = 1.5; x.globalAlpha = 0.7;
    for (let k = 0; k < 14; k++) { const f = (k + (t * 0.6) % 1) / 14; const y = hz + (H - hz) * f * f; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
    for (let k = -12; k <= 12; k++) { x.beginPath(); x.moveTo(W / 2 + k * 8, hz); x.lineTo(W / 2 + k * W * 0.18, H); x.stroke(); }
    x.globalAlpha = 1;
  }
  function city(t, lit) {
    const base = H;
    for (const b of sky) {
      x.fillStyle = "#04040c"; x.fillRect(b.x, base - b.h, b.w, b.h);
      if (b.ant) { x.fillRect(b.x + b.w / 2 - 1, base - b.h - 18, 2, 18); x.fillStyle = Math.sin(t * 3 + b.x) > 0 ? "#ff3030" : "#400"; x.fillRect(b.x + b.w / 2 - 2, base - b.h - 20, 4, 4); }
      for (const [wx, wy, ph] of b.wins) { x.fillStyle = lit && Math.sin(t * 0.5 + ph * 40) > -0.9 ? "#ffd86a" : "#1a1a30"; x.fillRect(b.x + wx, base - b.h + wy, 4, 5); }
    }
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const t = (now - t0) / 1000, dt = Math.min(0.05, (now - (frame.last || now)) / 1000); frame.last = now;
    if (!Core.set.motion && frame.drawn) return;
    frame.drawn = true;
    const p = PAL[theme];
    const g = x.createLinearGradient(0, 0, 0, H);
    if (p.hyper) { const h = (t * 25) % 360; g.addColorStop(0, `hsl(${h},80%,18%)`); g.addColorStop(1, `hsl(${(h + 140) % 360},80%,26%)`); }
    else { g.addColorStop(0, p.bg[0]); g.addColorStop(1, p.bg[1]); }
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    if (p.ray) rays(t, p.ray, p.hyper ? 0.08 : 0.22);
    if (p.sun) {
      const hz = H * (p.grid ? 0.55 : 0.72), r = Math.min(170, W * 0.34), sg = x.createLinearGradient(0, hz - r, 0, hz);
      sg.addColorStop(0, "#ffe14d"); sg.addColorStop(1, p.grid ? "#ff2fd0" : "#ff5a3a");
      x.fillStyle = sg; x.beginPath(); x.arc(W / 2, hz, r, Math.PI, 0); x.fill();
      x.fillStyle = p.bg[0]; for (let k = 0; k < 6; k++) x.fillRect(0, hz - 10 - k * 16, W, 3 + k * 0.6);
      if (p.grid) { x.fillStyle = "#0b0020"; x.fillRect(0, hz, W, H - hz); grid(t, "#ff2fd0", 0.55); }
    }
    if (p.lasers) {
      for (let k = 0; k < 6; k++) { const a = Math.sin(t * 0.7 + k) * 0.9; x.save(); x.translate(W * (k / 5), 0); x.rotate(a); x.globalAlpha = 0.28; x.fillStyle = p.c[k % p.c.length]; x.beginPath(); x.moveTo(0, 0); x.lineTo(-30, H * 1.4); x.lineTo(30, H * 1.4); x.fill(); x.restore(); }
      x.globalAlpha = 1; grid(t, "#00f0ff", 0.78);
    }
    if (p.hyper) for (let k = 0; k < 5; k++) { const bx = W * (0.5 + 0.4 * Math.sin(t * 0.3 + k * 1.7)), by = H * (0.5 + 0.4 * Math.cos(t * 0.25 + k * 2.1)); const rg = x.createRadialGradient(bx, by, 0, bx, by, W * 0.5); rg.addColorStop(0, p.c[k] + "55"); rg.addColorStop(1, p.c[k] + "00"); x.fillStyle = rg; x.fillRect(0, 0, W, H); }
    // lightning
    if (p.bolts) {
      nextBolt -= dt;
      if (nextBolt <= 0) { bolt = makeBolt(); flash = 1; nextBolt = R(p.bolts * 0.5, p.bolts * 1.4); }
      if (flash > 0) {
        x.fillStyle = `rgba(200,220,255,${flash * 0.25})`; x.fillRect(0, 0, W, H);
        if (bolt && flash > 0.4) { x.strokeStyle = `rgba(255,255,255,${flash})`; x.lineWidth = 4; x.shadowColor = "#9fd8ff"; x.shadowBlur = 20; x.beginPath(); bolt.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke(); x.shadowBlur = 0; }
        flash -= dt * 2.2;
      }
    }
    // particles: rain, sparks or drifting stars
    for (const i of items) {
      i.x += i.vx * dt; i.y += i.vy * dt;
      if (i.y < -20) { i.y = H + 10; i.x = R(0, W); } if (i.y > H + 20) { i.y = -10; i.x = R(0, W); }
      if (i.x < -20) i.x = W + 10; if (i.x > W + 20) i.x = -10;
      if (p.rain) { x.strokeStyle = "rgba(200,215,230,.3)"; x.lineWidth = 1.2; x.beginPath(); x.moveTo(i.x, i.y); x.lineTo(i.x + i.vx * 0.03, i.y + i.vy * 0.03); x.stroke(); continue; }
      const k = 0.5 + Math.sin(t * 3 + i.ph) * 0.5;
      x.globalAlpha = p.sparks ? k : 0.35 + k * 0.5; x.fillStyle = i.c;
      if (p.sparks) { x.save(); x.translate(i.x, i.y); x.rotate(t + i.ph); x.fillRect(-i.s, -0.8, i.s * 2, 1.6); x.fillRect(-0.8, -i.s, 1.6, i.s * 2); x.restore(); }
      else x.fillRect(i.x, i.y, 2, 2);
      x.globalAlpha = 1;
    }
    if (p.city) city(t, true);
    // halftone print texture over everything
    x.fillStyle = dots; x.globalAlpha = 0.5; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
  }
  function setTheme(id) { theme = PAL[id] ? id : "saturday"; document.body.dataset.theme = theme; seed(); frame.drawn = false; }

  // ---------- screen wipe: two diagonal slashes cross the screen, then a white flash ----------
  let wipeStart = 0, wipeLen = 0, wipeRaf = 0;
  function wipeFrame() {
    const f = (performance.now() - wipeStart) / wipeLen;
    sx.clearRect(0, 0, W, H);
    if (f >= 1) { st.style.opacity = 0; wipeRaf = 0; return; }
    st.style.opacity = 1;
    const cs = getComputedStyle(document.body), c1 = cs.getPropertyValue("--c1").trim() || "#e8202a", c3 = cs.getPropertyValue("--c3").trim() || "#ffd21f";
    const sweep = (off, col, dir) => {
      const e = Math.min(1, Math.max(0, (f - off) * 2.2)), pos = (dir > 0 ? -1.2 : 2.2) * W + dir * e * 3.4 * W;
      sx.fillStyle = col; sx.beginPath(); sx.moveTo(pos, 0); sx.lineTo(pos + W * 0.7, 0); sx.lineTo(pos + W * 0.7 - H * 0.5, H); sx.lineTo(pos - H * 0.5, H); sx.fill();
    };
    sweep(0, c1, 1); sweep(0.08, "#0b0b14", 1); sweep(0.16, c3, -1);
    if (f > 0.35 && f < 0.6) { sx.fillStyle = `rgba(255,255,255,${0.6 - Math.abs(f - 0.47) * 4})`; sx.fillRect(0, 0, W, H); }
    wipeRaf = requestAnimationFrame(wipeFrame);
  }
  function burst(ms = 420) {
    if (!Core.set.motion) ms = Math.min(ms, 140);
    wipeStart = performance.now(); wipeLen = ms; Sound.play("whoosh");
    if (!wipeRaf) wipeRaf = requestAnimationFrame(wipeFrame);
    return Core.sleep(ms * 0.55);
  }

  // ---------- confetti ----------
  function confetti(n = 40, el = document.body) {
    if (!Core.set.motion) return;
    const box = document.createElement("div"); box.className = "confetti"; el.appendChild(box);
    const cols = ["#e8202a", "#ffd21f", "#1f5fe0", "#ffffff", "#2fd8ff"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.style.cssText = `left:${R(5, 95)}%;background:${cols[i % cols.length]};--dx:${R(-120, 120)}px;--r:${R(-720, 720)}deg;animation-delay:${R(0, 0.25)}s;animation-duration:${R(1.1, 1.9)}s;${i % 3 ? "" : "border-radius:50%;"}`;
      box.appendChild(p);
    }
    setTimeout(() => box.remove(), 2300);
  }

  addEventListener("resize", size);
  size(); requestAnimationFrame(frame);
  return { setTheme, burst, confetti, get theme() { return theme; } };
})();
