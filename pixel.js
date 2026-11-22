// 90s anime pixel portraits, in the style of an arcade fighter's character-select screen.
// The shapes (hair, clothes, hats...) come from avatar.js's vector layers, rasterised onto an 80x96
// grid with hard edges, then cel-shaded (shadow on the right, highlight on the left) and inked with a
// 1px outline. Faces (eyes, brows, nose, mouth) are hand-placed pixel patterns. Results are cached PNGs.
const Pixel = (() => {
  "use strict";
  // the portrait crops the 200x240 vector box to x 24-176, y 8-190 so the head fills the frame
  const W = 80, H = 96, OX = 24, OY = 8, SX = W / 152, SY = H / 182, INK = [16, 8, 28];
  const cache = new Map();
  const mk = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; return [c, c.getContext("2d", { willReadFrequently: true })]; };
  const [main, g] = mk(), [lay, lg] = mk();
  const parser = new DOMParser();

  const rgb = (h) => { h = String(h).trim(); if (h[0] !== "#") return [0, 0, 0]; if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; const n = parseInt(h.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const sh = (c, a) => c.map((v) => Math.max(0, Math.min(255, Math.round(a < 0 ? v * (1 + a) : v + (255 - v) * a))));
  const css = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

  // ---------- vector snippet -> layer ----------
  function draw(markup) {
    if (!markup) return;
    const root = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, "image/svg+xml").documentElement;
    const urlCol = {};
    root.querySelectorAll("pattern, linearGradient, radialGradient").forEach((el) => {
      urlCol[el.id] = el.querySelector("rect[fill]")?.getAttribute("fill") || el.querySelector("stop")?.getAttribute("stop-color") || "#888";
    });
    lg.save(); lg.setTransform(SX, 0, 0, SY, -OX * SX, -OY * SY); walk(root, urlCol); lg.restore();
  }
  const col = (v, u) => { if (!v || v === "none") return null; const m = v.match(/url\(#(.+?)\)/); return m ? u[m[1]] || null : v; };
  function transform(tr) {
    for (const [, fn, args] of tr.matchAll(/(\w+)\(([^)]*)\)/g)) {
      const a = args.split(/[ ,]+/).filter(Boolean).map(Number);
      if (fn === "translate") lg.translate(a[0], a[1] || 0);
      else if (fn === "scale") lg.scale(a[0], a[1] ?? a[0]);
      else if (fn === "rotate") { if (a.length === 3) { lg.translate(a[1], a[2]); lg.rotate((a[0] * Math.PI) / 180); lg.translate(-a[1], -a[2]); } else lg.rotate((a[0] * Math.PI) / 180); }
    }
  }
  function walk(el, u) {
    for (const c of el.children) {
      const tag = c.tagName.toLowerCase();
      if (["defs", "pattern", "lineargradient", "radialgradient", "clippath", "filter", "text", "title"].includes(tag)) continue;
      if (parseFloat(c.getAttribute("opacity") ?? "1") < 0.3) continue; // faint vector highlights don't survive at this size
      lg.save();
      const tr = c.getAttribute("transform"); if (tr) transform(tr);
      if (tag === "g") { walk(c, u); lg.restore(); continue; }
      const p = new Path2D(), n = (k) => parseFloat(c.getAttribute(k) || 0);
      if (tag === "path") p.addPath(new Path2D(c.getAttribute("d")));
      else if (tag === "circle") p.arc(n("cx"), n("cy"), n("r"), 0, Math.PI * 2);
      else if (tag === "ellipse") p.ellipse(n("cx"), n("cy"), n("rx"), n("ry"), 0, 0, Math.PI * 2);
      else if (tag === "rect") p.rect(n("x"), n("y"), n("width"), n("height"));
      else { lg.restore(); continue; }
      const fill = col(c.getAttribute("fill") ?? "#000", u);
      if (fill && parseFloat(c.getAttribute("fill-opacity") ?? "1") > 0.4) { lg.fillStyle = fill; lg.fill(p); }
      const st = col(c.getAttribute("stroke"), u);
      if (st) {
        lg.lineWidth = Math.max(parseFloat(c.getAttribute("stroke-width") || "1"), 2.6); lg.strokeStyle = st; lg.lineJoin = "round"; lg.lineCap = "round";
        const da = c.getAttribute("stroke-dasharray"); lg.setLineDash(da ? da.split(/[ ,]+/).map(Number) : []);
        lg.stroke(p);
      }
      lg.restore();
    }
  }

  // ---------- layer processing ----------
  // hard edges, cel shading, ink outline; returns the layer's alpha mask
  function bake({ shade = true, outline = true, hi = true } = {}) {
    const im = lg.getImageData(0, 0, W, H), d = im.data, m = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) { if (d[i * 4 + 3] > 110) { d[i * 4 + 3] = 255; m[i] = 1; } else d[i * 4 + 3] = 0; }
    const dark = (i) => d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2] < 140;
    if (shade) for (let y = 0; y < H; y++) {
      let l = -1, r = -1;
      for (let x = 0; x < W; x++) if (m[y * W + x]) { if (l < 0) l = x; r = x; }
      if (l < 0 || r - l < 4) continue;
      const cut = l + (r - l) * 0.74, deep = l + (r - l) * 0.92;
      for (let x = l; x <= r; x++) {
        const i = y * W + x; if (!m[i] || dark(i)) continue;
        let a = 0;
        if (x > deep) a = -0.34; else if (x > cut) a = -0.2; else if (hi && x <= l + 1) a = 0.2;
        if (a) { const c = sh([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]], a); d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; }
      }
    }
    if (outline) {
      const out = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x; if (m[i]) continue;
        if ((x > 0 && m[i - 1]) || (x < W - 1 && m[i + 1]) || (y > 0 && m[i - W]) || (y < H - 1 && m[i + W])) out.push(i);
      }
      for (const i of out) { d[i * 4] = INK[0]; d[i * 4 + 1] = INK[1]; d[i * 4 + 2] = INK[2]; d[i * 4 + 3] = 255; m[i] = 2; }
    }
    lg.putImageData(im, 0, 0);
    g.drawImage(lay, 0, 0);
    lg.clearRect(0, 0, W, H);
    return m;
  }
  function layer(markup, o) { draw(markup); return bake(o); }

  // ---------- hand-placed pixel features ----------
  function stamp(rows, x0, y0, pal, mirror = false) {
    const im = g.getImageData(0, 0, W, H), d = im.data, w = Math.max(...rows.map((r) => r.length));
    rows.forEach((row, dy) => [...row].forEach((ch, dx) => {
      const c = pal[ch]; if (!c) return;
      const x = mirror ? x0 + (w - 1 - dx) : x0 + dx, y = y0 + dy; if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = (y * W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }));
    g.putImageData(im, 0, 0);
  }
  // anime features in the style of THE RUNDOWN's portraits: big glinting eyes, thin brows, small mouths.
  // Eye patterns are the screen-left eye (outer corner on the left); the other eye is mirrored.
  const EYES = {
    big: ["..KKKKKKKK.", ".KKKKKKKKKK", "K.wwwiiiiw.", "..wwwIhhIw.", "..wwwIhIIw.", "..wwwIIIIw.", "...wwLLLL..", "....ssss..."],
    dots: ["KKKKKKKKKK.", ".KKKKKKKKKK", "..wwwiiiiw.", "..wwwIhIIw.", "...wwLLLL..", "....ssss..."],
    sleepy: ["...........", "...........", "..ssssssss.", ".KKKKKKKKKK", "..wwwIhIIw.", "...wwLLLL..", "....ssss..."],
    lashes: ["K.KKKKKKKK.", "KKKKKKKKKKK", "K.wwwiiiiw.", "..wwwIhhIw.", "..wwwIhIIw.", "..wwwIIIIw.", "...wwLLLL..", "....ssss..."],
    sparkle: ["..KKKKKKKK.", ".KKKKKKKKKK", "..wiiiiiiw.", "..wIhhIIIw.", "..wIhhIIhw.", "..wIIIIIIw.", "...LLLLLL..", "....ssss..."],
    laser: ["..KKKKKKKK.", ".KKKKKKKKKK", "..cccccccc.", "..cccccccc.", "..cccccccc.", "...cccccc..", "....ssss..."],
    happy: ["...........", "...........", "...KKKKK...", "..K.....K..", ".K.......K."],
    shock: ["..KKKKKKKK.", ".K........K", "..wwwwwwww.", "..wwwiiwww.", "..wwwiiwww.", "...wwwwww..", "....ssss..."],
  };
  const BROWS = {
    normal: ["...BBBBBB.", ".BB......."], thick: [".BBBBBBBBB", "BBBBBBBBB."], thin: ["..BBBBBBB."],
    angry: ["BB........", "..BBBB....", "......BBBB"], raised: ["....BBB...", "..BB...B..", ".B........"], uni: ["...BBBBBBB", ".BB......."],
  };
  const MOUTHS = {
    smile: ["m....m", ".mmmm."], grin: ["mmmmmm", "mwwwwm", ".mrrm."], smirk: ["....m", "mmmm."],
    laugh: ["mmmmmmm", "mwwwwwm", "mrrrrrm", ".mrrrm."], braces: ["mmmmmm", "mwgwgm", ".mmmm."], gold: ["mmmmmm", "mwwywm", ".mmmm."],
    snarl: ["mmmmmmm", "mwmwmwm", "mmmmmmm"], tongue: ["mmmmmm", "..rr.."], flat: ["mmmm"], frown: [".mmmm.", "m....m"],
    o: [".mm.", "mrrm", ".mm."], talk: ["mmmm", "mrrm", ".mm."],
  };
  const NOSES = { button: ["s", "s"], pointy: ["s.", "ss", "s."], big: [".s.", "sss"], line: ["s", "s", "s"], wide: ["s..s", ".ss."] };

  // ---------- backgrounds ----------
  function bg(s, rnd) {
    const c = rgb(s.bgC), band = (top, bot, step = 6) => { for (let y = 0; y < H; y += step) { const f = y / H; g.fillStyle = css(top.map((v, k) => Math.round(v + (bot[k] - v) * f))); g.fillRect(0, y, W, step); } };
    const sky = (n) => { for (let i = 0; i < n; i++) { g.fillStyle = rnd() < 0.2 ? "#ffd86a" : "#ffffff"; g.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H * 0.5), 1, 1); } };
    const city = () => { let x = -2; while (x < W) { const w = 6 + Math.floor(rnd() * 10), h = 10 + Math.floor(rnd() * 22); g.fillStyle = "#0a0a1c"; g.fillRect(x, H - h, w, h); g.fillStyle = "#ffd86a"; for (let yy = H - h + 3; yy < H - 2; yy += 4) for (let xx = x + 1; xx < x + w - 1; xx += 3) if (rnd() < 0.3) g.fillRect(xx, yy, 1, 2); x += w + 1; } };
    switch (s.bg) {
      case "checker": band([255, 196, 90], [120, 40, 110]); g.fillStyle = "#ffe28a"; g.beginPath(); g.arc(W / 2, H * 0.62, 16, Math.PI, 0); g.fill(); g.fillStyle = "#c8507a"; for (let k = 0; k < 4; k++) g.fillRect(W / 2 - 16, H * 0.62 - 3 - k * 4, 32, 1); city(); break;
      case "zigzag": band([12, 16, 40], sh(c, -0.5)); g.fillStyle = "#fff"; { let x = 54, y = 0; while (y < H * 0.7) { const nx = x + Math.floor(rnd() * 9) - 4; g.fillRect(Math.min(x, nx), y, Math.abs(nx - x) + 2, 6); x = nx; y += 6; } } break;
      case "stars": band([8, 10, 36], sh(c, -0.3)); sky(40); g.fillStyle = "#fff6d0"; g.fillRect(56, 10, 8, 8); city(); break;
      case "speed": g.fillStyle = css(c); g.fillRect(0, 0, W, H); g.fillStyle = css(sh(c, 0.35)); for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.beginPath(); g.moveTo(W / 2, H * 0.4); g.lineTo(W / 2 + Math.cos(a) * 120, H * 0.4 + Math.sin(a) * 120); g.lineTo(W / 2 + Math.cos(a + 0.12) * 120, H * 0.4 + Math.sin(a + 0.12) * 120); g.fill(); } break;
      case "grid": band([10, 4, 32], sh(c, -0.2)); g.fillStyle = css(sh(c, 0.4)); for (let k = 0; k < 7; k++) g.fillRect(0, Math.round(H * 0.55 + k * k * 1.2), W, 1); for (let k = -5; k <= 5; k++) { g.beginPath(); g.moveTo(W / 2, H * 0.55); g.lineTo(W / 2 + k * 18, H); g.lineTo(W / 2 + k * 18 + 1, H); g.closePath(); g.strokeStyle = css(sh(c, 0.4)); g.stroke(); } break;
      case "flames": band([40, 6, 6], [255, 120, 30], 4); g.fillStyle = "#ffd23f"; for (let x = 0; x < W; x += 4) { const h = 14 + Math.floor(rnd() * 26); g.fillRect(x, H - h, 3, h); } break;
      case "bars": ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"].forEach((cc, i) => { g.fillStyle = cc; g.fillRect(Math.floor((i * W) / 7), 0, Math.ceil(W / 7), H); }); g.fillStyle = "#111"; g.fillRect(0, H * 0.75, W, H); break;
      case "static": for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = 60 + Math.floor(rnd() * 150); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 1, 1); } break;
      case "gold": band([255, 226, 120], [110, 70, 10]); g.fillStyle = "rgba(255,255,255,.35)"; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(W / 2, H * 0.4); g.lineTo(W / 2 + Math.cos(a) * 120, H * 0.4 + Math.sin(a) * 120); g.lineTo(W / 2 + Math.cos(a + 0.18) * 120, H * 0.4 + Math.sin(a + 0.18) * 120); g.fill(); } break;
      default: band(sh(c, 0.25), sh(c, -0.55)); // arcade select-screen blue
    }
  }

  function render(spec, opts = {}) {
    const P = Avatar.parts(spec), s = P.s, expr = opts.expr || "";
    const key = JSON.stringify(s) + "|" + expr + "|" + (opts.bg === false ? 0 : 1);
    if (cache.has(key)) return cache.get(key);
    let seed = 7; for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
    g.clearRect(0, 0, W, H);
    if (opts.bg !== false) bg(s, rnd);
    const sk = rgb(s.skin), skS = sh(sk, -0.3), hairC = rgb(s.hairC);

    layer(P.hairBack);
    layer(P.body);
    layer(`${P.ears}<path d="${P.head}" fill="${s.skin}"/>`, { hi: true });
    if (P.earwear) layer(P.earwear, { shade: false });
    // under-chin shadow on the neck
    g.fillStyle = css(skS); g.fillRect(31, 73, 18, 3);
    // cheek details
    if (s.blush) stamp(["p.p.p", ".p.p."], 21, 55, { p: [255, 130, 150] }), stamp(["p.p.p", ".p.p."], 54, 55, { p: [255, 130, 150] });
    if (s.freckles) stamp(["f.f", ".f.", "f.."], 24, 53, { f: sh(sk, -0.4) }), stamp(["f.f", ".f.", "..f"], 53, 53, { f: sh(sk, -0.4) });
    if (s.paint) { const pc = rgb(s.hatC); stamp(["PPPPP", ".....", "PPPP."], 21, 52, { P: pc }); stamp(["PPPPP", ".....", "PPPP."], 54, 52, { P: pc }, true); }
    if (s.scar) stamp(["S..", ".S.", "SSS", ".S.", "..S", ".SS", "..S"], 50, 40, { S: [150, 50, 60] });
    if (P.beard) layer(P.beard, { hi: false });

    // eyes, brows, nose, mouth
    let e = s.eyes; if (expr === "happy") e = "happy"; if (expr === "shock") e = "shock";
    const er = EYES[e] || EYES.big, ec = rgb(s.eyeC || "#2a1a10");
    const epal = { K: INK, w: [255, 255, 255], I: ec, i: sh(ec, -0.55), L: sh(ec, 0.45), h: [255, 255, 255], s: skS, c: [216, 255, 255] };
    stamp(er, 24, 42, epal); stamp(er, 45, 42, epal, true);
    const br = BROWS[s.brows] || BROWS.normal, bpal = { B: sh(hairC, -0.45) };
    stamp(br, 24, 37, bpal); stamp(br, 46, 37, bpal, true);
    if (s.brows === "uni") stamp(["BBBBBB"], 34, 37, bpal);
    stamp(NOSES[s.nose] || NOSES.button, 41, 52, { s: skS, K: sh(sk, -0.5) });
    let m = s.mouth; if (expr === "happy") m = m === "braces" || m === "gold" ? m : "grin"; if (expr === "sad") m = "frown"; if (expr === "shock") m = "o"; if (expr === "talk") m = "talk";
    const mr = MOUTHS[m] || MOUTHS.smile, mw = Math.max(...mr.map((r) => r.length));
    stamp(mr, 40 - Math.floor(mw / 2), 58, { m: [122, 42, 53], w: [255, 255, 255], r: [220, 90, 110], g: [160, 170, 185], y: [255, 210, 60], s: skS });

    // front hair, with a cast shadow on the forehead and an anime shine band
    if (s.hair !== "bald") {
      draw(P.hairFront);
      const hm = bake({ hi: true });
      const im = g.getImageData(0, 0, W, H), d = im.data;
      for (let x = 12; x < 68; x++) {
        let bottom = -1; for (let y = 0; y < 56; y++) if (hm[y * W + x] === 1) bottom = y;
        for (let k = 2; k <= 3 && bottom > 0; k++) { const i = ((bottom + k) * W + x) * 4; if (hm[(bottom + k) * W + x]) continue; const c = sh([d[i], d[i + 1], d[i + 2]], -0.22); d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; }
      }
      // shine: a short light band across the top-left of the hair mass
      const hl = sh(hairC, s.tips ? 0.75 : 0.45);
      for (let x = 16; x < 44; x++) { let top = -1; for (let y = 0; y < 50; y++) if (hm[y * W + x] === 1) { top = y; break; } if (top < 0) continue; const y = top + 3 + Math.round(Math.abs(x - 28) / 4); if (hm[y * W + x] === 1) { const i = (y * W + x) * 4; d[i] = hl[0]; d[i + 1] = hl[1]; d[i + 2] = hl[2]; } }
      g.putImageData(im, 0, 0);
    }
    if (P.extras) layer(P.extras, { hi: false });

    const url = main.toDataURL();
    if (cache.size > 600) cache.delete(cache.keys().next().value);
    cache.set(key, url);
    return url;
  }
  return { render, W, H };
})();
