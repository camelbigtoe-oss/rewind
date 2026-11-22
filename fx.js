// Pixel backdrops in a 90s anime style (the same look as THE RUNDOWN), drawn at low resolution and
// scaled up: a dithered sky, a striped sun on the horizon, a city skyline with flickering windows,
// drifting clouds and a shimmering reflection. Each channel theme is a different sky. FX.mood("war")
// swaps to red speed lines for fights. Also: a quick pixel wipe between screens, and confetti.
const FX = (() => {
  "use strict";
  const cv = document.getElementById("fx"), g = cv.getContext("2d");
  const st = document.getElementById("static"), sx = st.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PX = 3;
  let W = 0, H = 0, theme = "saturday", mood = "city", last = 0, scene = null, flash = null;
  const t0 = performance.now();
  const SKIES = {
    saturday: { name: "dusk", bands: ["#140f33", "#1d1650", "#2b1c6e", "#47238a", "#7a2f96", "#c0418f", "#ff6f8e", "#ffa07a"], sun: ["#fff1a8", "#ffd27a", "#ff9a6a", "#ff5f8a"], city: "#1a1140", ground: "#120c2c", win: ["#ffd27a", "#ff8fb0", "#8fe3ff"], refl: "255,140,150" },
    grunge: { bands: ["#06070f", "#0b0e1c", "#121a2e", "#1a2640", "#24334f", "#30405e", "#3e5070", "#4e6280"], sun: ["#d8e0f0", "#b0c0d8", "#8ea0c0", "#6a7ea0"], city: "#0a0d18", ground: "#05060c", win: ["#ffd27a", "#c8d8ff"], refl: "180,200,230", rain: true, moon: true },
    rave: { bands: ["#08001a", "#140032", "#220050", "#36006a", "#4a0a80", "#6a1a9a", "#9a2ab0", "#d040c0"], sun: ["#fff", "#9ff8ff", "#40e8ff", "#ff40d0"], city: "#10002a", ground: "#06000f", win: ["#40f0ff", "#ff40d0", "#e6ff40"], refl: "64,232,255" },
    pastel: { bands: ["#2a1850", "#4a2470", "#7a3080", "#b8487a", "#e8706a", "#ffa060", "#ffc870", "#ffe39a"], sun: ["#fffbe0", "#fff1a8", "#ffd27a", "#ffb060"], city: "#2a1640", ground: "#1e1236", win: ["#fff1a8", "#ffb0c8", "#a8f0ff"], refl: "255,200,140" },
    arcade: { bands: ["#0b0020", "#150035", "#22004a", "#35005e", "#520a6e", "#7a1478", "#b02a7a", "#ff4a8a"], sun: ["#ffe14d", "#ffb23f", "#ff6a5a", "#ff2fd0"], city: "#0e0026", ground: "#0b0020", win: ["#2fe5ff", "#ff2fd0"], refl: "255,47,208", grid: true },
    hyper: { bands: ["#002a3a", "#004a5a", "#1a6a6a", "#4a8a5a", "#8a9a3a", "#c88a3a", "#e86a5a", "#ff5a8a"], sun: ["#fff", "#ffe14d", "#ff9a3a", "#ff3f8e"], city: "#102030", ground: "#081018", win: ["#ffe14d", "#2fd8ff", "#ff3f8e"], refl: "255,220,120" },
    gold: { bands: ["#1a1005", "#2e1c08", "#4a2e0c", "#6a4410", "#8e5e18", "#b88024", "#e0a830", "#ffd23f"], sun: ["#fffbe0", "#fff1a8", "#ffe070", "#ffc040"], city: "#1a1005", ground: "#120a02", win: ["#fff1a8", "#ffd23f"], refl: "255,220,120" },
  };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296); }
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  function size() {
    W = Math.ceil(innerWidth / PX); H = Math.ceil(innerHeight / PX); cv.width = W; cv.height = H; scene = null;
    st.width = innerWidth; st.height = innerHeight;
  }
  addEventListener("resize", size);
  size();

  // ---------- city at dusk (or whatever this theme's sky is) ----------
  function build(P) {
    const r = rng(11);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"), hz = Math.floor(H * 0.62);
    const img = x.createImageData(W, hz), d = img.data, cols = P.bands.map(hex), n = cols.length - 1;
    for (let y = 0; y < hz; y++) {
      const f = (y / hz) * n;
      for (let i = 0; i < W; i++) {
        const idx = Math.min(n, Math.floor(f) + (f % 1 > BAYER[(y % 4) * 4 + (i % 4)] / 16 ? 1 : 0));
        const o = (y * W + i) * 4, cc = cols[idx]; d[o] = cc[0]; d[o + 1] = cc[1]; d[o + 2] = cc[2]; d[o + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    const sr = Math.max(18, Math.floor(W * 0.2)), sxx = Math.floor(W * 0.5), sy = hz;
    if (P.moon) { const mr = Math.floor(sr * 0.5), mx = Math.floor(W * 0.75), my = Math.floor(hz * 0.25); for (let y = -mr; y <= mr; y++) { const w = Math.floor(Math.sqrt(mr * mr - y * y)); x.fillStyle = "#e8eef8"; x.fillRect(mx - w, my + y, w * 2, 1); } x.fillStyle = "#c0c8d8"; x.fillRect(mx - 3, my - 2, 3, 2); x.fillRect(mx + 2, my + 3, 2, 2); }
    else for (let y = -sr; y < 0; y++) {
      const band = Math.floor(((y + sr) / sr) * P.sun.length);
      if (y > -sr * 0.55 && ((-y) % 5 === 0 || (y > -sr * 0.3 && (-y) % 3 === 0))) continue;
      const w = Math.floor(Math.sqrt(sr * sr - y * y));
      x.fillStyle = P.sun[Math.min(P.sun.length - 1, band)]; x.fillRect(sxx - w, sy + y, w * 2, 1);
    }
    const wins = [];
    for (let i = -4; i < W + 4;) {
      const w = 6 + Math.floor(r() * 10), h = 8 + Math.floor(r() * (H * 0.16)) + (Math.abs(i - sxx) < sr ? 0 : Math.floor(r() * 10));
      x.fillStyle = P.city; x.fillRect(i, hz - h, w, h);
      if (r() < 0.25) x.fillRect(i + Math.floor(w / 2), hz - h - 4, 1, 4);
      for (let wy = hz - h + 3; wy < hz - 2; wy += 3) for (let wx = i + 2; wx < i + w - 1; wx += 3) if (r() < 0.32) wins.push({ x: wx, y: wy, c: P.win[Math.floor(r() * P.win.length)], ph: r() * 40 });
      i += w + (r() < 0.3 ? 1 : 0);
    }
    x.fillStyle = P.ground; x.fillRect(0, hz, W, H - hz);
    if (P.grid) { x.fillStyle = "rgba(255,47,208,.5)"; for (let k = 1; k < 12; k++) x.fillRect(0, hz + Math.floor(k * k * (H - hz) / 140), W, 1); for (let k = -14; k <= 14; k++) for (let y = hz; y < H; y++) { const xx = Math.round(sxx + k * 3 + (k * (y - hz)) / 6); if (xx >= 0 && xx < W) x.fillRect(xx, y, 1, 1); } }
    x.fillStyle = "rgba(255,255,255,.06)"; x.fillRect(0, hz, W, 1);
    const stars = Array.from({ length: Math.floor(W * 0.5) }, () => ({ x: Math.floor(r() * W), y: Math.floor(r() * hz * 0.5), ph: r() * 6.3, b: r() < 0.15 }));
    const clouds = Array.from({ length: 5 }, (_, i) => ({ x: r() * W, y: 18 + i * Math.floor(hz * 0.09) + Math.floor(r() * 6), w: 24 + Math.floor(r() * 40), sp: 0.4 + r() * 0.6 }));
    const rain = P.rain ? Array.from({ length: 120 }, () => ({ x: r() * W, y: r() * H, sp: 60 + r() * 60 })) : [];
    return { c, hz, sx: sxx, sr, wins, stars, clouds, rain, P };
  }
  function city(t) {
    const P = SKIES[theme] || SKIES.saturday;
    if (!scene || scene.P !== P) scene = build(P);
    const S = scene;
    g.drawImage(S.c, 0, 0);
    for (const s of S.stars) {
      const a = reduce ? 0.6 : 0.35 + 0.35 * Math.sin(t * 0.8 + s.ph);
      g.fillStyle = `rgba(255,246,232,${a.toFixed(2)})`; g.fillRect(s.x, s.y, 1, 1);
      if (s.b) { g.fillRect(s.x - 1, s.y, 3, 1); g.fillRect(s.x, s.y - 1, 1, 3); }
    }
    for (const cl of S.clouds) {
      const x = ((cl.x + (reduce ? 0 : t * cl.sp)) % (W + cl.w * 2)) - cl.w;
      g.fillStyle = "rgba(90,50,140,.55)"; g.fillRect(Math.floor(x), cl.y, cl.w, 3); g.fillRect(Math.floor(x + cl.w * 0.2), cl.y - 2, Math.floor(cl.w * 0.5), 2);
      g.fillStyle = "rgba(255,140,170,.45)"; g.fillRect(Math.floor(x + 2), cl.y + 3, cl.w - 4, 1);
    }
    for (const w of S.wins) { if (!reduce && Math.sin(t * 0.3 + w.ph) > 0.92) continue; g.fillStyle = w.c; g.fillRect(w.x, w.y, 1, 1); }
    for (let i = 0, y = S.hz + 2; y < H; y += 3, i++) {
      const w = Math.max(2, Math.floor(S.sr * (1 - i * 0.07) + (reduce ? 0 : Math.sin(t * 1.5 + i) * 3)));
      if (w <= 2) break;
      g.fillStyle = `rgba(${S.P.refl},${Math.max(0.05, 0.4 - i * 0.03).toFixed(2)})`; g.fillRect(S.sx - w, y, w * 2, 1);
    }
    if (S.rain.length) { g.fillStyle = "rgba(190,210,240,.35)"; for (const d of S.rain) { const y = (d.y + t * d.sp) % H, x = (d.x - t * 10 + W) % W; g.fillRect(Math.floor(x), Math.floor(y), 1, 3); } }
    if (theme === "hyper") { g.fillStyle = `hsla(${(t * 30) % 360},90%,60%,.18)`; g.fillRect(0, 0, W, H); }
  }
  // ---------- red speed lines for fights ----------
  function speed(t) {
    g.fillStyle = "#1a0712"; g.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.38, R = Math.hypot(W, H), n = 40, rot = reduce ? 0 : t * 0.05;
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2, w = i % 3 === 0 ? 0.05 : 0.025;
      g.fillStyle = i % 2 ? "rgba(255,77,94,.22)" : "rgba(255,200,210,.08)";
      g.beginPath(); g.moveTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14);
      g.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R); g.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R); g.closePath(); g.fill();
    }
    const grd = g.createRadialGradient(cx, cy, 2, cx, cy, W * 0.5);
    grd.addColorStop(0, "rgba(255,120,130,.25)"); grd.addColorStop(1, "rgba(255,120,130,0)");
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 100) return; // 10 fps keeps it calm and light on battery
    last = now;
    const t = (now - t0) / 1000;
    if (mood === "war") speed(t); else city(t);
    if (flash && now < flash.until) { g.fillStyle = `rgba(${flash.rgb},${(((flash.until - now) / 300) * 0.35).toFixed(2)})`; g.fillRect(0, 0, W, H); }
  }
  requestAnimationFrame(frame);

  function setTheme(id) { theme = SKIES[id] ? id : "saturday"; document.body.dataset.theme = theme; scene = null; }
  function setMood(m) { mood = m === "war" ? "war" : "city"; }

  // ---------- pixel wipe: dark bands close in from both sides, then open ----------
  let wipeStart = 0, wipeLen = 0, wipeRaf = 0;
  function wipeFrame() {
    const f = (performance.now() - wipeStart) / wipeLen;
    sx.clearRect(0, 0, st.width, st.height);
    if (f >= 1) { st.style.opacity = 0; wipeRaf = 0; return; }
    st.style.opacity = 1;
    const k = f < 0.5 ? f * 2 : (1 - f) * 2, rows = 24, rh = Math.ceil(st.height / rows);
    for (let i = 0; i < rows; i++) {
      const w = Math.min(1, k * 1.3 - (i % 2) * 0.12) * st.width / 2; if (w <= 0) continue;
      sx.fillStyle = i % 2 ? "#120c2c" : "#1d1650";
      sx.fillRect(0, i * rh, w, rh); sx.fillRect(st.width - w, i * rh, w, rh);
    }
    wipeRaf = requestAnimationFrame(wipeFrame);
  }
  function burst(ms = 420) {
    if (!Core.set.motion || reduce) ms = Math.min(ms, 140);
    wipeStart = performance.now(); wipeLen = ms; Sound.play("whoosh");
    if (!wipeRaf) wipeRaf = requestAnimationFrame(wipeFrame);
    return Core.sleep(ms * 0.55);
  }
  const cheer = () => { flash = { until: performance.now() + 300, rgb: "255,246,232" }; };
  const gasp = () => { flash = { until: performance.now() + 300, rgb: "255,77,94" }; };

  // ---------- confetti ----------
  function confetti(n = 40, el = document.body) {
    if (!Core.set.motion) return;
    const box = document.createElement("div"); box.className = "confetti"; el.appendChild(box);
    const cols = ["#ff6f8e", "#ffd166", "#6fe3ff", "#6ff0c8", "#fff6e8"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.style.cssText = `left:${Math.random() * 90 + 5}%;background:${cols[i % cols.length]};--dx:${Math.random() * 240 - 120}px;--r:${Math.random() * 1440 - 720}deg;animation-delay:${Math.random() * 0.25}s;animation-duration:${1.1 + Math.random() * 0.8}s;`;
      box.appendChild(p);
    }
    setTimeout(() => box.remove(), 2300);
  }
  return { setTheme, setMood, burst, confetti, cheer, gasp, get theme() { return theme; } };
})();
