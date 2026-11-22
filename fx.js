// Visual effects: the animated background for each channel theme, TV static between screens,
// and confetti. Backgrounds draw on #fx; static draws on #static over everything.
const FX = (() => {
  "use strict";
  const cv = document.getElementById("fx"), x = cv.getContext("2d");
  const st = document.getElementById("static"), sx = st.getContext("2d");
  let W = 0, H = 0, dpr = 1, theme = "saturday", items = [], t0 = performance.now(), raf = 0;
  const PAL = {
    saturday: { bg: ["#2a0f5c", "#4a1a8c"], c: ["#ff3f8e", "#ffe14d", "#2fd8ff", "#1ee3a1", "#ff7a1a"] },
    grunge: { bg: ["#1b1d1a", "#2e2a22"], c: ["#7a8a3a", "#8e3b1f", "#c9b27a", "#5a6a7a"] },
    rave: { bg: ["#07001a", "#1a0040"], c: ["#ff00e5", "#00f0ff", "#b6ff00", "#ffe600"] },
    pastel: { bg: ["#ffd6ec", "#c9e7ff"], c: ["#ff8fc8", "#8fd3ff", "#c7a6ff", "#fff08f", "#8fffd0"] },
    arcade: { bg: ["#0b0020", "#2a0050"], c: ["#ff2fd0", "#2fe5ff", "#ffb23f"] },
    hyper: { bg: ["#3a005a", "#00505a"], c: ["#ff3f8e", "#ffe14d", "#2fd8ff", "#1ee3a1", "#7b3cff"] },
    gold: { bg: ["#1a1028", "#3a2410"], c: ["#ffd23f", "#f4ecd0", "#d9a520", "#fff6c8"] },
  };
  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    for (const c of [cv, st]) { c.width = W * dpr; c.height = H * dpr; c.style.width = W + "px"; c.style.height = H + "px"; }
    x.setTransform(dpr, 0, 0, dpr, 0, 0); sx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }
  const R = (a, b) => a + Math.random() * (b - a);
  function seed() {
    const p = PAL[theme], n = Math.round((W * H) / 26000) + 8, kinds = ["squig", "tri", "ring", "zig", "dot", "bar", "half"];
    items = Array.from({ length: n }, () => ({
      k: kinds[Math.floor(Math.random() * kinds.length)], x: R(0, W), y: R(0, H), s: R(14, 38), r: R(0, 6.3), vr: R(-0.4, 0.4),
      vx: R(-8, 8), vy: R(-14, -4), c: p.c[Math.floor(Math.random() * p.c.length)], ph: R(0, 6.3),
    }));
    if (theme === "grunge") items.forEach((i) => { i.vy = R(260, 420); i.vx = R(-30, -10); });
    if (theme === "gold") items.forEach((i) => { i.vy = R(20, 60); i.k = Math.random() < 0.5 ? "conf" : "spark"; });
    if (theme === "pastel") items.forEach((i) => { i.k = ["heart", "spark", "dot", "ring"][Math.floor(Math.random() * 4)]; });
  }
  function shape(i, t) {
    x.save(); x.translate(i.x, i.y); x.rotate(i.r); x.strokeStyle = i.c; x.fillStyle = i.c; x.lineWidth = 4; x.lineCap = "round"; x.lineJoin = "round";
    const s = i.s;
    switch (i.k) {
      case "squig": x.beginPath(); x.moveTo(-s, 0); for (let k = 1; k <= 4; k++) { const px = -s + k * (s / 2); x.quadraticCurveTo(px - s / 4, (k % 2 ? -1 : 1) * s / 3, px, 0); } x.stroke(); break;
      case "tri": x.beginPath(); x.moveTo(0, -s / 2); x.lineTo(s / 2, s / 2); x.lineTo(-s / 2, s / 2); x.closePath(); x.globalAlpha = 0.85; x.fill(); x.globalAlpha = 1; x.strokeStyle = "#111"; x.lineWidth = 2.5; x.stroke(); break;
      case "ring": x.beginPath(); x.arc(0, 0, s / 2, 0, 6.3); x.stroke(); break;
      case "zig": x.beginPath(); for (let k = 0; k < 6; k++) x.lineTo(-s + k * (s / 2.5), k % 2 ? -s / 4 : s / 4); x.stroke(); break;
      case "dot": for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { x.beginPath(); x.arc(a * 9 - 9, b * 9 - 9, 2.4, 0, 6.3); x.fill(); } break;
      case "bar": x.fillRect(-s / 2, -4, s, 8); x.strokeStyle = "#111"; x.lineWidth = 2; x.strokeRect(-s / 2, -4, s, 8); break;
      case "half": x.beginPath(); x.arc(0, 0, s / 2, 0, Math.PI); x.closePath(); x.fill(); break;
      case "heart": x.scale(s / 30, s / 30); x.beginPath(); x.moveTo(0, 10); x.bezierCurveTo(-18, -2, -10, -16, 0, -6); x.bezierCurveTo(10, -16, 18, -2, 0, 10); x.globalAlpha = 0.8; x.fill(); break;
      case "spark": { const k = 0.6 + Math.sin(t * 3 + i.ph) * 0.4; x.scale(k, k); x.beginPath(); for (let a = 0; a < 8; a++) { const r = a % 2 ? s / 8 : s / 2; x.lineTo(Math.cos((a / 8) * 6.283) * r, Math.sin((a / 8) * 6.283) * r); } x.closePath(); x.fill(); break; }
      case "conf": x.fillRect(-s / 6, -s / 3, s / 3, s / 1.5); break;
    }
    x.restore();
  }
  function grid(t, col, horizon) {
    const hz = H * horizon;
    x.strokeStyle = col; x.lineWidth = 1.5; x.globalAlpha = 0.7;
    for (let k = 0; k < 14; k++) { const f = ((k + (t * 0.6) % 1) / 14); const y = hz + (H - hz) * f * f; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
    for (let k = -12; k <= 12; k++) { x.beginPath(); x.moveTo(W / 2 + k * 8, hz); x.lineTo(W / 2 + k * W * 0.18, H); x.stroke(); }
    x.globalAlpha = 1;
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = (now - t0) / 1000, dt = Math.min(0.05, (now - (frame.last || now)) / 1000); frame.last = now;
    if (!Core.set.motion && frame.drawn) return;
    frame.drawn = true;
    const p = PAL[theme];
    let g = x.createLinearGradient(0, 0, 0, H);
    if (theme === "hyper") { const h = (t * 20) % 360; g.addColorStop(0, `hsl(${h},80%,22%)`); g.addColorStop(1, `hsl(${(h + 120) % 360},80%,25%)`); }
    else { g.addColorStop(0, p.bg[0]); g.addColorStop(1, p.bg[1]); }
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    if (theme === "arcade") {
      const hz = H * 0.55, sun = x.createLinearGradient(0, hz - 160, 0, hz);
      sun.addColorStop(0, "#ffe14d"); sun.addColorStop(1, "#ff2fd0");
      x.fillStyle = sun; x.beginPath(); x.arc(W / 2, hz, Math.min(160, W * 0.32), Math.PI, 0); x.fill();
      x.fillStyle = p.bg[0]; for (let k = 0; k < 6; k++) x.fillRect(0, hz - 12 - k * 16, W, 3 + k * 0.6);
      x.fillStyle = "#0b0020"; x.fillRect(0, hz, W, H - hz); grid(t, "#ff2fd0", 0.55);
    }
    if (theme === "rave") {
      for (let k = 0; k < 6; k++) {
        const a = Math.sin(t * 0.7 + k) * 0.9, c = p.c[k % p.c.length];
        x.save(); x.translate(W * (k / 5), 0); x.rotate(a); x.globalAlpha = 0.28; x.fillStyle = c; x.beginPath(); x.moveTo(0, 0); x.lineTo(-30, H * 1.4); x.lineTo(30, H * 1.4); x.fill(); x.restore();
      }
      x.globalAlpha = 1; grid(t, "#00f0ff", 0.78);
    }
    if (theme === "hyper") {
      for (let k = 0; k < 5; k++) { const bx = W * (0.5 + 0.4 * Math.sin(t * 0.3 + k * 1.7)), by = H * (0.5 + 0.4 * Math.cos(t * 0.25 + k * 2.1)); const rg = x.createRadialGradient(bx, by, 0, bx, by, W * 0.5); rg.addColorStop(0, p.c[k] + "66"); rg.addColorStop(1, p.c[k] + "00"); x.fillStyle = rg; x.fillRect(0, 0, W, H); }
    }
    for (const i of items) {
      i.x += i.vx * dt; i.y += i.vy * dt; i.r += i.vr * dt;
      if (i.y < -60) { i.y = H + 40; i.x = R(0, W); } if (i.y > H + 60) { i.y = -40; i.x = R(0, W); }
      if (i.x < -60) i.x = W + 40; if (i.x > W + 60) i.x = -40;
      if (theme === "grunge") { x.strokeStyle = "rgba(200,210,220,.25)"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(i.x, i.y); x.lineTo(i.x + i.vx * 0.04, i.y + i.vy * 0.04); x.stroke(); continue; }
      x.globalAlpha = theme === "pastel" ? 0.7 : 0.9; shape(i, t); x.globalAlpha = 1;
    }
    // slow rolling VHS band
    const by = ((t * 40) % (H + 200)) - 100;
    const bg = x.createLinearGradient(0, by - 40, 0, by + 40); bg.addColorStop(0, "rgba(255,255,255,0)"); bg.addColorStop(0.5, "rgba(255,255,255,.05)"); bg.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = bg; x.fillRect(0, by - 40, W, 80);
  }
  function setTheme(id) { theme = PAL[id] ? id : "saturday"; document.body.dataset.theme = theme; seed(); frame.drawn = false; }

  // ---------- TV static burst ----------
  let staticEnd = 0, staticRaf = 0;
  function noiseFrame() {
    const left = staticEnd - performance.now();
    if (left <= 0) { sx.clearRect(0, 0, W, H); st.style.opacity = 0; staticRaf = 0; return; }
    st.style.opacity = Math.min(1, left / 120);
    const img = sx.createImageData(Math.ceil(W / 3), Math.ceil(H / 3)), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    const tmp = noiseFrame.c ||= document.createElement("canvas"); tmp.width = img.width; tmp.height = img.height; tmp.getContext("2d").putImageData(img, 0, 0);
    sx.imageSmoothingEnabled = false; sx.drawImage(tmp, 0, 0, W, H);
    sx.fillStyle = "rgba(0,0,0,.35)"; const bar = (performance.now() / 3) % H; sx.fillRect(0, bar, W, 40);
    staticRaf = requestAnimationFrame(noiseFrame);
  }
  function burst(ms = 320) {
    if (!Core.set.motion) ms = Math.min(ms, 120);
    staticEnd = performance.now() + ms; st.style.opacity = 1; Sound.play("static", ms / 1000);
    if (!staticRaf) staticRaf = requestAnimationFrame(noiseFrame);
    return Core.sleep(ms * 0.6);
  }

  // ---------- confetti ----------
  function confetti(n = 40, el = document.body) {
    if (!Core.set.motion) return;
    const box = document.createElement("div"); box.className = "confetti"; el.appendChild(box);
    const cols = PAL[theme].c;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.style.cssText = `left:${R(5, 95)}%;background:${cols[i % cols.length]};--dx:${R(-120, 120)}px;--r:${R(-720, 720)}deg;animation-delay:${R(0, 0.25)}s;animation-duration:${R(1.1, 1.9)}s;${i % 3 ? "" : "border-radius:50%;"}`;
      box.appendChild(p);
    }
    setTimeout(() => box.remove(), 2300);
  }

  addEventListener("resize", size);
  size(); raf = requestAnimationFrame(frame);
  return { setTheme, burst, confetti, get theme() { return theme; } };
})();
