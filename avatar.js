// Cartoon channel badges. There are no characters in REWIND TV: every player and rival channel is a
// chunky Saturday-morning sticker (a shape, a colour, a pattern and a big icon) with a thick black
// outline and a drop shadow. BADGE options with lv / ach / vj are locked until earned (see RPG.unlocked).
const Avatar = (() => {
  "use strict";
  let uid = 0;
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
    return "#" + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
  }
  const pts = (n, ro, ri, rot = -Math.PI / 2) => Array.from({ length: n * 2 }, (_, i) => { const r = i % 2 ? ri : ro, a = rot + (i * Math.PI) / n; return `${(100 + Math.cos(a) * r).toFixed(1)},${(100 + Math.sin(a) * r).toFixed(1)}`; }).join(" ");
  function bumpy(r, n, b) {
    let d = "";
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, x = 100 + Math.cos(a) * r, y = 100 + Math.sin(a) * r;
      if (!i) { d += `M${x.toFixed(1)} ${y.toFixed(1)}`; continue; }
      const m = ((i - 0.5) / n) * Math.PI * 2;
      d += ` Q${(100 + Math.cos(m) * (r + b)).toFixed(1)} ${(100 + Math.sin(m) * (r + b)).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + "Z";
  }
  const SHAPES = {
    circle: `<circle cx="100" cy="100" r="82"/>`,
    star: `<polygon points="${pts(5, 92, 46)}"/>`,
    splat: `<path d="${bumpy(70, 11, 22)}"/>`,
    tv: `<rect x="24" y="46" width="152" height="122" rx="26"/>`,
    cloud: `<path d="M50 150 Q14 150 18 116 Q20 88 52 90 Q54 52 92 52 Q124 50 134 78 Q170 70 180 104 Q190 148 150 150Z"/>`,
    burst: `<polygon points="${pts(14, 92, 70)}"/>`,
    heart: `<path d="M100 174 C40 130 14 102 22 70 C30 38 74 32 100 62 C126 32 170 38 178 70 C186 102 160 130 100 174Z"/>`,
    shield: `<path d="M100 14 L172 40 Q174 130 100 186 Q26 130 28 40Z"/>`,
  };
  const CATALOG = {
    badge: [{ id: "circle", name: "Circle" }, { id: "star", name: "Star" }, { id: "splat", name: "Splat" }, { id: "tv", name: "Telly" }, { id: "cloud", name: "Cloud" },
      { id: "burst", name: "Burst", lv: 3 }, { id: "heart", name: "Heart", lv: 6 }, { id: "shield", name: "Shield", lv: 10 }],
    icon: [
      { id: "⭐", name: "Star" }, { id: "🍕", name: "Pizza" }, { id: "🛹", name: "Skateboard" }, { id: "🎮", name: "Controller" }, { id: "📼", name: "Tape" },
      { id: "🎸", name: "Guitar" }, { id: "👾", name: "Space invader" }, { id: "🦖", name: "Dino" }, { id: "🍦", name: "Ice cream" }, { id: "🌈", name: "Rainbow" },
      { id: "🚀", name: "Rocket", lv: 2 }, { id: "⚡", name: "Bolt", lv: 3 }, { id: "🐢", name: "Turtle", lv: 4 }, { id: "🍩", name: "Doughnut", lv: 5 }, { id: "🛸", name: "UFO", lv: 7 },
      { id: "🎧", name: "Headphones", vj: "spinz" }, { id: "🦄", name: "Unicorn", lv: 9 }, { id: "🔥", name: "Fire", lv: 12 }, { id: "🥝", name: "Kiwi", lv: 14 }, { id: "🤘", name: "Rock on", lv: 16 },
      { id: "📺", name: "Telly", ach: "first" }, { id: "🎯", name: "Bullseye", ach: "perfect" }, { id: "💎", name: "Diamond", ach: "diamond" }, { id: "🪩", name: "Disco ball", ach: "rave" },
      { id: "💼", name: "Briefcase", vj: "exec" }, { id: "👑", name: "Crown", ach: "champion" },
    ],
    pat: [{ id: "none", name: "Plain" }, { id: "dots", name: "Dots" }, { id: "stripes", name: "Stripes" }, { id: "zigzag", name: "Zigzag" },
      { id: "checker", name: "Checker", lv: 4 }, { id: "stars", name: "Stars", lv: 8 }, { id: "swirl", name: "Swirl", lv: 11 }, { id: "gold", name: "Gold", ach: "platinum" }],
  };
  const COLORS = ["#ff4a3a", "#ff8a1a", "#ffd21f", "#4ad04a", "#2ab0ff", "#5a5aff", "#b05aff", "#ff5ab0", "#1ad0b0", "#8a5a33", "#f4f1ea", "#2a2a3a"];
  const DEFAULT = { badge: "circle", topC: "#2ab0ff", top2: "#ffd21f", icon: "⭐", pat: "dots" };
  const SKIN = [], HAIRC = [];

  function pattern(s, id) {
    const a = s.top2;
    switch (s.pat) {
      case "dots": return `<pattern id="pt${id}" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="4.5" fill="${a}"/><circle cx="17" cy="17" r="4.5" fill="${a}"/></pattern>`;
      case "stripes": return `<pattern id="pt${id}" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="10" height="24" fill="${a}"/></pattern>`;
      case "zigzag": return `<pattern id="pt${id}" width="30" height="20" patternUnits="userSpaceOnUse"><path d="M0 14 L7.5 6 L15 14 L22.5 6 L30 14" stroke="${a}" stroke-width="5" fill="none"/></pattern>`;
      case "checker": return `<pattern id="pt${id}" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="15" height="15" fill="${a}"/><rect x="15" y="15" width="15" height="15" fill="${a}"/></pattern>`;
      case "stars": return `<pattern id="pt${id}" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M17 5 L20 14 L29 14 L22 19 L25 28 L17 22 L9 28 L12 19 L5 14 L14 14Z" fill="${a}"/></pattern>`;
      case "swirl": return `<pattern id="pt${id}" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M20 20 m-12 0 a12 12 0 1 0 24 0 a8 8 0 1 0 -16 0 a4 4 0 1 0 8 0" stroke="${a}" stroke-width="4" fill="none"/></pattern>`;
      case "gold": return `<pattern id="pt${id}" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#ffd21f"/><path d="M0 20 L20 0" stroke="#fff3a0" stroke-width="5"/></pattern>`;
      default: return "";
    }
  }
  // opts: { cls, anim, expr (ignored), bg (ignored) }
  function svg(spec, opts = {}) {
    const s = { ...DEFAULT, ...spec }, id = ++uid;
    const shape = SHAPES[s.badge] || SHAPES.circle, fill = s.pat === "gold" ? "#ffd21f" : s.topC;
    const tv = s.badge === "tv" ? `<path d="M70 48 L48 16 M130 48 L152 16" stroke="#111" stroke-width="8" stroke-linecap="round"/><circle cx="48" cy="16" r="7" fill="${s.top2}" stroke="#111" stroke-width="5"/><circle cx="152" cy="16" r="7" fill="${s.top2}" stroke="#111" stroke-width="5"/>` : "";
    const mood = opts.expr === "sad" ? "sad" : opts.expr === "happy" ? "happy" : "";
    return `<svg class="av badge ${opts.cls || ""} ${opts.anim === false ? "" : "bob"} ${mood}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="badge">
      <defs><clipPath id="cl${id}">${shape}</clipPath>${pattern(s, id)}</defs>
      ${tv}
      <g transform="translate(7 8)" fill="#111">${shape}</g>
      <g fill="${fill}">${shape}</g>
      ${s.pat !== "none" ? `<g clip-path="url(#cl${id})"><rect width="200" height="200" fill="url(#pt${id})" opacity=".55"/></g>` : ""}
      <g clip-path="url(#cl${id})"><path d="M10 10 H200 V70 Q100 40 10 96Z" fill="#fff" opacity=".22"/></g>
      <g fill="none" stroke="#111" stroke-width="8" stroke-linejoin="round">${shape}</g>
      <circle cx="100" cy="104" r="${s.badge === "tv" ? 40 : 44}" fill="#fff" stroke="#111" stroke-width="6"/>
      <text x="100" y="106" font-size="54" text-anchor="middle" dominant-baseline="central">${s.icon}</text>
      <path d="M44 66 Q56 44 82 36" stroke="#fff" stroke-width="8" stroke-linecap="round" fill="none" opacity=".75"/>
    </svg>`;
  }
  function random(rnd = Math.random, ok = () => true) {
    const p = (k) => { const l = CATALOG[k].filter(ok); return l[Math.floor(rnd() * l.length)].id; };
    const c = () => COLORS[Math.floor(rnd() * COLORS.length)];
    let a = c(), b = c(); while (b === a) b = c();
    return { badge: p("badge"), icon: p("icon"), pat: p("pat"), topC: a, top2: b };
  }
  return { svg, vsvg: svg, random, CATALOG, SKIN, HAIRC, COLORS, DEFAULT, shade };
})();
