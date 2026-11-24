// Saturday-morning cartoon backdrop: a flat cartoon sky, a sun with turning rays, puffy outlined
// clouds drifting by, rolling outlined hills, and a few bouncing doodles (stars, squiggles, dots).
// Each channel theme is a different sky. Fights turn it into an orange "showdown" sky.
// Between screens: a burst of TV static. Also confetti.
const FX = (() => {
  "use strict";
  const cv = document.getElementById("fx"), g = cv.getContext("2d");
  const st = document.getElementById("static"), sx = st.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, dpr = 1, theme = "saturday", mood = "city", clouds = [], doodles = [], last = 0;
  const t0 = performance.now();
  // sky top, sky bottom, sun, far hills, near hills, doodle colours, night?
  const SKIES = {
    saturday: ["#2ab0ff", "#a8e4ff", "#ffd21f", "#6ad84a", "#3ab83a", ["#ff4a3a", "#ffd21f", "#ff5ab0", "#ffffff"]],
    grunge: ["#6a7a8a", "#b8c4cc", "#e8e8d8", "#5a8a5a", "#3a6a3a", ["#ffffff", "#c8d8e8"]],
    rave: ["#1a1060", "#5a3ab0", "#f4f1ea", "#3a2a80", "#2a1a60", ["#ffd21f", "#ff5ab0", "#2ab0ff"], true],
    pastel: ["#ff8ab8", "#ffd8a8", "#fff3a0", "#ff9a6a", "#e86a5a", ["#ffffff", "#ffd21f", "#b05aff"]],
    arcade: ["#0a0a3a", "#3a1a7a", "#ff8ad8", "#2a2a6a", "#1a1a4a", ["#ffd21f", "#2ab0ff", "#ff5ab0", "#4ad04a"], true],
    hyper: ["#ff5ab0", "#ffd21f", "#ffffff", "#4ad04a", "#2ab0ff", ["#ff4a3a", "#5a5aff", "#ffffff"]],
    gold: ["#ffb21f", "#fff3a0", "#ffffff", "#e0a030", "#c08020", ["#ffffff", "#ff8a1a"]],
    war: ["#ff6a1a", "#ffd21f", "#fff3a0", "#e8402a", "#b82a1a", ["#ffffff", "#2a2a3a"]],
  };
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    st.width = Math.ceil(W / 3); st.height = Math.ceil(H / 3);
    clouds = Array.from({ length: 5 }, (_, i) => ({ x: Math.random() * W, y: H * (0.06 + i * 0.1), s: (0.5 + Math.random() * 0.5) * Math.min(1, W / 600 + 0.4), sp: 8 + Math.random() * 14 }));
    doodles = Array.from({ length: 9 }, (_, i) => ({ x: Math.random() * W, y: H * (0.1 + Math.random() * 0.55), k: i % 3, ph: Math.random() * 6.3, r: 8 + Math.random() * 8, c: i }));
  }
  addEventListener("resize", size);
  size();

  const OUT = "#111";
  // a puffy cloud: outline every puff first, then fill them all white, so only the outer edge shows
  const PUFFS = [[0, 0, 24], [28, -18, 30], [62, -12, 26], [84, 4, 18], [40, 6, 26]];
  function cloud(x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = OUT; for (const [px, py, r] of PUFFS) { g.beginPath(); g.arc(px, py, r + 4 / s, 0, 6.3); g.fill(); }
    g.fillStyle = "#fff"; for (const [px, py, r] of PUFFS) { g.beginPath(); g.arc(px, py, r, 0, 6.3); g.fill(); }
    g.restore();
  }
  function hills(yBase, amp, col, phase) {
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W + 20; x += 20) g.lineTo(x, yBase - Math.sin(x / 140 + phase) * amp - Math.sin(x / 61 + phase * 2) * amp * 0.3);
    g.lineTo(W, H); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
  }
  function doodle(d, t, cols) {
    const y = d.y + Math.sin(t * 2 + d.ph) * 8, x = d.x, c = cols[d.c % cols.length];
    g.save(); g.translate(x, y); g.rotate(Math.sin(t + d.ph) * 0.3); g.lineWidth = 4; g.strokeStyle = OUT; g.fillStyle = c;
    if (d.k === 0) { g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? d.r * 0.45 : d.r, a = -Math.PI / 2 + (i * Math.PI) / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); }
    else if (d.k === 1) { g.strokeStyle = c; g.lineWidth = 5; g.beginPath(); g.moveTo(-d.r * 1.4, 0); for (let i = 1; i <= 4; i++) g.quadraticCurveTo(-d.r * 1.4 + (i - 0.5) * d.r * 0.7, (i % 2 ? -1 : 1) * d.r * 0.6, -d.r * 1.4 + i * d.r * 0.7, 0); g.stroke(); }
    else { g.beginPath(); g.arc(0, 0, d.r * 0.55, 0, 6.3); g.fill(); g.stroke(); }
    g.restore();
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 33) return; last = now;
    const t = (now - t0) / 1000, P = SKIES[mood === "war" ? "war" : theme] || SKIES.saturday, night = P[6];
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, P[0]); sky.addColorStop(0.7, P[1]);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // sun (or moon) with turning rays
    const sx0 = W * 0.8, sy0 = H * 0.14, sr = Math.min(W, H) * 0.09;
    if (!night) {
      g.save(); g.translate(sx0, sy0); g.rotate(reduce ? 0 : t * 0.15);
      g.fillStyle = P[2]; g.globalAlpha = 0.55;
      for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(-sr * 0.25, sr * 1.15); g.lineTo(0, sr * 2.1); g.lineTo(sr * 0.25, sr * 1.15); g.fill(); }
      g.restore(); g.globalAlpha = 1;
    } else for (let i = 0; i < 40; i++) { g.fillStyle = "#fff"; const xx = (i * 97) % W, yy = (i * 53) % (H * 0.55), k = 1 + (Math.sin(t * 2 + i) > 0.6 ? 1 : 0); g.fillRect(xx, yy, 2 * k, 2 * k); }
    g.beginPath(); g.arc(sx0, sy0, sr, 0, 6.3); g.fillStyle = P[2]; g.fill(); g.lineWidth = 4; g.strokeStyle = OUT; g.stroke();
    if (night) { g.beginPath(); g.arc(sx0 + sr * 0.4, sy0 - sr * 0.2, sr * 0.85, 0, 6.3); g.fillStyle = P[0]; g.fill(); }
    // clouds
    for (const c of clouds) { if (!reduce) c.x += c.sp / 30; if (c.x > W + 20) c.x = -140; cloud(c.x, c.y, c.s); }
    for (const d of doodles) doodle(d, reduce ? 0 : t, P[5]);
    // rolling hills
    hills(H * 0.8, 26, P[3], 0.5); hills(H * 0.9, 18, P[4], 2.1);
  }
  requestAnimationFrame(frame);

  function setTheme(id) { theme = SKIES[id] ? id : "saturday"; document.body.dataset.theme = theme; }
  function setMood(m) { mood = m === "war" ? "war" : "city"; }

  // ---------- TV static between screens ----------
  let end = 0, raf = 0;
  function noise() {
    const left = end - performance.now();
    if (left <= 0) { sx.clearRect(0, 0, st.width, st.height); st.style.opacity = 0; raf = 0; return; }
    st.style.opacity = Math.min(1, left / 120);
    const im = sx.createImageData(st.width, st.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    sx.putImageData(im, 0, 0);
    sx.fillStyle = "rgba(0,0,0,.35)"; sx.fillRect(0, (performance.now() / 8) % st.height, st.width, 10);
    raf = requestAnimationFrame(noise);
  }
  function burst(ms = 380) {
    if (!Core.set.motion || reduce) ms = Math.min(ms, 140);
    end = performance.now() + ms; st.style.opacity = 1; Sound.play("static", ms / 1000);
    if (!raf) raf = requestAnimationFrame(noise);
    return Core.sleep(ms * 0.6);
  }
  const cheer = () => {}, gasp = () => {};
  function confetti(n = 40, el = document.body) {
    if (!Core.set.motion) return;
    const box = document.createElement("div"); box.className = "confetti"; el.appendChild(box);
    const cols = ["#ff4a3a", "#ffd21f", "#2ab0ff", "#4ad04a", "#ff5ab0", "#b05aff"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.style.cssText = `left:${Math.random() * 90 + 5}%;background:${cols[i % cols.length]};--dx:${Math.random() * 240 - 120}px;--r:${Math.random() * 1440 - 720}deg;animation-delay:${Math.random() * 0.25}s;animation-duration:${1.1 + Math.random() * 0.8}s;`;
      box.appendChild(p);
    }
    setTimeout(() => box.remove(), 2300);
  }
  return { setTheme, setMood, burst, confetti, cheer, gasp, get theme() { return theme; } };
})();
