// Painted-style night backdrop, matching the "fighter select" mockup: an indigo-to-violet sky,
// a huge orange moon with a glow, layered city and pagoda silhouettes, drifting purple clouds,
// cherry-blossom petals and a few embers. Fights switch to a fiery red sky. Also: a diagonal
// slash wipe between screens, a screen flash, and confetti.
const FX = (() => {
  "use strict";
  const cv = document.getElementById("fx"), g = cv.getContext("2d");
  const st = document.getElementById("static"), sx = st.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, dpr = 1, theme = "saturday", mood = "city", scene = null, petals = [], flash = null, last = 0;
  const t0 = performance.now();
  // sky top, sky mid, horizon glow, moon, far city, near city, petal colour
  const SKIES = {
    saturday: ["#120a3a", "#3a1a7a", "#c04a9a", "#ff9a3a", "#2a1658", "#120a2e", "#ff8fc8"],
    grunge: ["#05070f", "#16203a", "#3a4a70", "#dfe6f5", "#121a30", "#070a14", "#c8d8ff"],
    rave: ["#0a0028", "#2a0a6a", "#ff2fb0", "#40f0ff", "#1a0a48", "#0a0220", "#ff7ae0"],
    pastel: ["#2a1250", "#7a2a7a", "#ff8a5a", "#ffd166", "#3a1a50", "#1a0a28", "#ffc0d8"],
    arcade: ["#0b0020", "#3a0a6a", "#ff2fd0", "#ffb23f", "#22084a", "#0b0020", "#ff9ae0"],
    hyper: ["#00203a", "#2a1a7a", "#ff3f8e", "#ffe14d", "#1a1a50", "#0a0a20", "#9ff8ff"],
    gold: ["#1a0e04", "#4a2a08", "#e0a030", "#fff1a8", "#2a1806", "#120a02", "#ffe39a"],
    war: ["#1a0206", "#6a0a14", "#ff5a1a", "#ffd23f", "#3a0610", "#1a0206", "#ffb04a"],
  };
  function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296); }
  function size() {
    dpr = 1 / 3; W = innerWidth; H = innerHeight; // drawn at a third of the size and shown with hard pixels
    for (const c of [cv, st]) { c.width = W * dpr; c.height = H * dpr; c.style.width = W + "px"; c.style.height = H + "px"; }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); sx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene = null;
    const r = rng(5);
    petals = Array.from({ length: Math.round((W * H) / 14000) + 14 }, () => ({ x: r() * W, y: r() * H, s: 2 + r() * 4, vx: 10 + r() * 22, vy: 14 + r() * 26, ph: r() * 6.3, ember: r() < 0.25 }));
  }
  addEventListener("resize", size);
  size();

  // skyline silhouette with pagoda roofs and towers
  function skyline(x, base, h, col, r, pagodas) {
    x.fillStyle = col; x.beginPath(); x.moveTo(0, H);
    let px = -10;
    while (px < W + 20) {
      const w = 18 + r() * 46, bh = h * (0.35 + r() * 0.65);
      if (pagodas && r() < 0.18) {
        // tiered pagoda
        const cx = px + w / 2;
        x.lineTo(px, base - bh * 0.3);
        for (let k = 0; k < 4; k++) { const yy = base - bh * (0.3 + k * 0.18), ww = w * (0.75 - k * 0.12); x.lineTo(cx - ww, yy); x.lineTo(cx - ww * 0.6, yy - 6); }
        x.lineTo(cx, base - bh * 1.15);
        for (let k = 3; k >= 0; k--) { const yy = base - bh * (0.3 + k * 0.18), ww = w * (0.75 - k * 0.12); x.lineTo(cx + ww * 0.6, yy - 6); x.lineTo(cx + ww, yy); }
        x.lineTo(px + w, base - bh * 0.3);
      } else {
        x.lineTo(px, base - bh); if (r() < 0.3) { x.lineTo(px + w * 0.45, base - bh); x.lineTo(px + w * 0.5, base - bh - 14); x.lineTo(px + w * 0.55, base - bh); }
        x.lineTo(px + w, base - bh);
      }
      px += w;
    }
    x.lineTo(W + 20, H); x.closePath(); x.fill();
  }
  function build(P) {
    const c = document.createElement("canvas"); c.width = W * dpr; c.height = H * dpr;
    const x = c.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = rng(9);
    const sky = x.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, P[0]); sky.addColorStop(0.45, P[1]); sky.addColorStop(0.78, P[2]); sky.addColorStop(1, P[5]);
    x.fillStyle = sky; x.fillRect(0, 0, W, H);
    // stars
    for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.6})`; x.fillRect(r() * W, r() * H * 0.45, 1.5, 1.5); }
    // moon with a big soft glow
    const mx = W * 0.62, my = H * 0.24, mr = Math.min(W, H) * 0.17;
    const glow = x.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 3.2);
    glow.addColorStop(0, P[3] + "88"); glow.addColorStop(1, P[3] + "00");
    x.fillStyle = glow; x.fillRect(0, 0, W, H);
    const mg = x.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
    mg.addColorStop(0, "#fff6d0"); mg.addColorStop(0.5, P[3]); mg.addColorStop(1, P[2]);
    x.fillStyle = mg; x.beginPath(); x.arc(mx, my, mr, 0, Math.PI * 2); x.fill();
    x.fillStyle = "rgba(120,40,60,.18)"; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(mx + (r() - 0.5) * mr, my + (r() - 0.5) * mr, mr * (0.08 + r() * 0.12), 0, 6.3); x.fill(); }
    // painterly cloud streaks across the moon
    for (let i = 0; i < 7; i++) {
      const cy = H * (0.12 + r() * 0.4), cw = W * (0.4 + r() * 0.6), cx = r() * W - cw / 3;
      const cg = x.createLinearGradient(cx, cy, cx + cw, cy);
      cg.addColorStop(0, "rgba(60,20,110,0)"); cg.addColorStop(0.5, `rgba(${80 + r() * 60},${30 + r() * 30},${130 + r() * 60},.55)`); cg.addColorStop(1, "rgba(60,20,110,0)");
      x.fillStyle = cg; x.beginPath(); x.ellipse(cx + cw / 2, cy, cw / 2, 6 + r() * 14, -0.05, 0, 6.3); x.fill();
    }
    // far skyline with pagodas, lit windows, then the near skyline
    skyline(x, H * 0.86, H * 0.32, P[4], r, true);
    for (let i = 0; i < 160; i++) { x.fillStyle = r() < 0.5 ? "rgba(255,200,120,.55)" : "rgba(150,200,255,.45)"; x.fillRect(r() * W, H * (0.6 + r() * 0.3), 2, 3); }
    // mist band
    const mist = x.createLinearGradient(0, H * 0.78, 0, H);
    mist.addColorStop(0, "rgba(200,90,200,0)"); mist.addColorStop(0.5, "rgba(200,90,200,.25)"); mist.addColorStop(1, "rgba(20,8,40,.8)");
    x.fillStyle = mist; x.fillRect(0, H * 0.78, W, H * 0.22);
    skyline(x, H * 1.02, H * 0.2, P[5], r, false);
    // cherry-blossom branches in the top-left corner
    x.strokeStyle = "#1a0820"; x.lineCap = "round";
    const branch = (bx, by, a, len, w) => { if (len < 8) return; const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len; x.lineWidth = w; x.beginPath(); x.moveTo(bx, by); x.lineTo(ex, ey); x.stroke(); for (let k = 0; k < 6; k++) { x.fillStyle = k % 2 ? P[6] : "#ffd6ec"; x.globalAlpha = 0.85; x.beginPath(); x.arc(ex + (r() - 0.5) * 22, ey + (r() - 0.5) * 18, 3 + r() * 5, 0, 6.3); x.fill(); } x.globalAlpha = 1; branch(ex, ey, a + (r() - 0.3) * 0.8, len * 0.72, w * 0.7); if (r() < 0.6) branch(ex, ey, a - 0.6 - r() * 0.5, len * 0.6, w * 0.6); };
    branch(-10, H * 0.08, 0.25, Math.min(W, 520) * 0.22, 7);
    branch(W + 10, H * 0.55, Math.PI + 0.35, Math.min(W, 520) * 0.18, 6);
    // vignette
    const vg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.8);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(5,0,20,.65)");
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
    // 16-bit look: limited palette with ordered dithering
    const cx = c.getContext("2d"), im = cx.getImageData(0, 0, c.width, c.height), d = im.data, BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], step = 255 / 7;
    for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) { const i = (y * c.width + xx) * 4, t = BAY[(y & 3) * 4 + (xx & 3)] / 16 - 0.5; for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, Math.round(d[i + k] / step + t * 0.9) * step)); }
    cx.putImageData(im, 0, 0);
    return { c, P };
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 33) return; last = now;
    const t = (now - t0) / 1000;
    const P = SKIES[mood === "war" ? "war" : theme] || SKIES.saturday;
    if (!scene || scene.P !== P) scene = build(P);
    g.drawImage(scene.c, 0, 0, W, H);
    if (theme === "hyper" && mood !== "war") { g.fillStyle = `hsla(${(t * 30) % 360},90%,55%,.15)`; g.fillRect(0, 0, W, H); }
    // falling petals (or embers in a fight)
    for (const p of petals) {
      if (!reduce) { p.x += p.vx / 30; p.y += p.vy / 30; if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; } if (p.x > W + 10) p.x = -10; }
      const ember = mood === "war" || p.ember;
      g.save(); g.translate(p.x, p.y); g.rotate(t * 2 + p.ph);
      g.fillStyle = ember ? `rgba(255,${150 + Math.sin(t * 5 + p.ph) * 80},60,.85)` : P[6];
      g.globalAlpha = ember ? 0.9 : 0.75;
      g.beginPath(); g.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 6.3); g.fill(); g.restore();
    }
    g.globalAlpha = 1;
    if (flash && now < flash.until) { g.fillStyle = `rgba(${flash.rgb},${(((flash.until - now) / 300) * 0.4).toFixed(2)})`; g.fillRect(0, 0, W, H); }
  }
  requestAnimationFrame(frame);

  function setTheme(id) { theme = SKIES[id] ? id : "saturday"; document.body.dataset.theme = theme; }
  function setMood(m) { mood = m === "war" ? "war" : "city"; }

  // ---------- slash wipe: a gold then indigo diagonal swipe ----------
  let wipeStart = 0, wipeLen = 0, wipeRaf = 0;
  function wipeFrame() {
    const f = (performance.now() - wipeStart) / wipeLen;
    sx.clearRect(0, 0, W, H);
    if (f >= 1) { st.style.opacity = 0; wipeRaf = 0; return; }
    st.style.opacity = 1;
    const band = (off, col) => { const e = Math.min(1, Math.max(0, (f - off) * 2.2)), pos = -1.3 * W + e * 3.6 * W; sx.fillStyle = col; sx.beginPath(); sx.moveTo(pos, 0); sx.lineTo(pos + W * 0.8, 0); sx.lineTo(pos + W * 0.8 - H * 0.4, H); sx.lineTo(pos - H * 0.4, H); sx.fill(); };
    band(0, "#2830a8"); band(0.06, "#ffd21f"); band(0.12, "#0a0830");
    wipeRaf = requestAnimationFrame(wipeFrame);
  }
  function burst(ms = 420) {
    if (!Core.set.motion || reduce) ms = Math.min(ms, 140);
    wipeStart = performance.now(); wipeLen = ms; Sound.play("whoosh");
    if (!wipeRaf) wipeRaf = requestAnimationFrame(wipeFrame);
    return Core.sleep(ms * 0.55);
  }
  const cheer = () => { flash = { until: performance.now() + 300, rgb: "255,230,160" }; };
  const gasp = () => { flash = { until: performance.now() + 300, rgb: "255,60,80" }; };
  function confetti(n = 40, el = document.body) {
    if (!Core.set.motion) return;
    const box = document.createElement("div"); box.className = "confetti"; el.appendChild(box);
    const cols = ["#ffc21f", "#ff4a8a", "#5ad8ff", "#ffffff", "#b06aff"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.style.cssText = `left:${Math.random() * 90 + 5}%;background:${cols[i % cols.length]};--dx:${Math.random() * 240 - 120}px;--r:${Math.random() * 1440 - 720}deg;animation-delay:${Math.random() * 0.25}s;animation-duration:${1.1 + Math.random() * 0.8}s;`;
      box.appendChild(p);
    }
    setTimeout(() => box.remove(), 2300);
  }
  return { setTheme, setMood, burst, confetti, cheer, gasp, get theme() { return theme; } };
})();
