// Cartoon avatars. A spec (skin, hair, clothes...) is drawn as a thick-outline SVG bust in a
// 200x240 box. The same renderer draws the player, party guests and the rival VJs.
// CATALOG lists every option; an option with lv / ach / vj / caps is locked until earned (see RPG.unlocked).
const Avatar = (() => {
  "use strict";
  let uid = 0;
  const O = 'stroke="#111" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  const O3 = 'stroke="#111" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
    return "#" + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
  }
  // wobbly circle, for afros, curls and pom-poms
  function bumpy(cx, cy, r, n, b) {
    let d = "";
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (!i) { d += `M${x.toFixed(1)} ${y.toFixed(1)}`; continue; }
      const m = ((i - 0.5) / n) * Math.PI * 2;
      d += ` Q${(cx + Math.cos(m) * (r + b)).toFixed(1)} ${(cy + Math.sin(m) * (r + b)).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + "Z";
  }

  // ---------- the catalog ----------
  const SKIN = ["#fde0c8", "#f6cfae", "#eab58f", "#d9a074", "#c68a5c", "#a96d45", "#8a5432", "#6b3d22", "#4e2a16", "#ffd6e7"];
  const HAIRC = [
    { c: "#1b1410", name: "Black" }, { c: "#3b2416", name: "Dark brown" }, { c: "#6b4226", name: "Brown" }, { c: "#8e3b1f", name: "Auburn" },
    { c: "#d0612a", name: "Ginger" }, { c: "#e9c46a", name: "Blonde" }, { c: "#f4ecd0", name: "Platinum" }, { c: "#9a9aa2", name: "Grey" },
    { c: "#ff3fa4", name: "Hot pink", lv: 4 }, { c: "#2fb7ff", name: "Electric blue", lv: 7 }, { c: "#8a4dff", name: "Grape", lv: 11 },
    { c: "#29d36b", name: "Slime green", lv: 16 }, { c: "#ff7b1a", name: "Neon orange", lv: 22 },
  ];
  const COLORS = ["#ff3f8e", "#ffe14d", "#2fd8ff", "#7b3cff", "#1ee3a1", "#ff7a1a", "#e8473a", "#2f4fd6", "#1d1d26", "#f4f1ea", "#7a8a3a", "#8a5a33", "#c4c6cc", "#ff9be0", "#0f8a8a", "#5a2a7a"];
  const CATALOG = {
    head: [{ id: "round", name: "Round" }, { id: "oval", name: "Oval" }, { id: "square", name: "Square" }, { id: "heart", name: "Pointy" }, { id: "wide", name: "Wide jaw" }],
    hair: [
      { id: "bald", name: "Bald" }, { id: "buzz", name: "Buzz cut" }, { id: "curtains", name: "Curtains" }, { id: "spikes", name: "Gelled spikes" },
      { id: "hightop", name: "High-top fade" }, { id: "mullet", name: "Mullet" }, { id: "bowl", name: "Bowl cut" }, { id: "grunge", name: "Grunge" },
      { id: "rachel", name: "The Layers" }, { id: "pony", name: "Scrunchie pony" }, { id: "buns", name: "Space buns" }, { id: "afro", name: "Afro" },
      { id: "bob", name: "Bob" }, { id: "pigtails", name: "Pigtails" }, { id: "braids", name: "Box braids" }, { id: "slick", name: "Slicked back", lv: 3 },
      { id: "mohawk", name: "Mohawk", lv: 9 }, { id: "perm", name: "Big perm", lv: 13 }, { id: "flattop", name: "Flat top", lv: 18 },
    ],
    brows: [{ id: "normal", name: "Normal" }, { id: "thick", name: "Thick" }, { id: "thin", name: "Thin" }, { id: "angry", name: "Fierce" }, { id: "raised", name: "Raised" }, { id: "uni", name: "Unibrow", lv: 5 }],
    eyes: [{ id: "dots", name: "Dots" }, { id: "big", name: "Big" }, { id: "sleepy", name: "Sleepy" }, { id: "lashes", name: "Lashes" }, { id: "happy", name: "Happy" }, { id: "sparkle", name: "Sparkle", lv: 8 }, { id: "laser", name: "Laser", ach: "perfect" }],
    eyeC: ["#2a1a10", "#3d6bd6", "#2f8a4a", "#7a4a1f", "#6d6d7a", "#9b3bd6"],
    nose: [{ id: "button", name: "Button" }, { id: "pointy", name: "Pointy" }, { id: "big", name: "Big" }, { id: "line", name: "Line" }, { id: "wide", name: "Wide" }],
    mouth: [{ id: "smile", name: "Smile" }, { id: "grin", name: "Grin" }, { id: "smirk", name: "Smirk" }, { id: "laugh", name: "Laugh" }, { id: "braces", name: "Braces" }, { id: "tongue", name: "Tongue out" }, { id: "flat", name: "Unimpressed" }, { id: "gold", name: "Gold tooth", lv: 12 }],
    beard: [{ id: "none", name: "None" }, { id: "stubble", name: "Stubble" }, { id: "goatee", name: "Goatee" }, { id: "soul", name: "Soul patch" }, { id: "tache", name: "Moustache" }, { id: "full", name: "Full beard" }, { id: "chin", name: "Chinstrap" }, { id: "chops", name: "Mutton chops", lv: 10 }],
    glasses: [{ id: "none", name: "None" }, { id: "round", name: "Round wire" }, { id: "tiny", name: "Tiny shades" }, { id: "nerd", name: "Big frames" }, { id: "wrap", name: "Wraparounds", lv: 2 }, { id: "3d", name: "3D specs", lv: 6 }, { id: "heart", name: "Heart shades", lv: 14 }, { id: "star", name: "Star shades", ach: "diamond" }],
    hat: [{ id: "none", name: "None" }, { id: "backcap", name: "Backwards cap" }, { id: "cap", name: "Cap" }, { id: "bucket", name: "Bucket hat" }, { id: "beanie", name: "Beanie" }, { id: "bandana", name: "Bandana" }, { id: "sweatband", name: "Sweatband" }, { id: "propeller", name: "Propeller cap", lv: 15 }, { id: "crown", name: "Ratings crown", ach: "champion" }],
    top: [
      { id: "tee", name: "Baggy tee" }, { id: "flannel", name: "Flannel" }, { id: "windbreaker", name: "Windbreaker" }, { id: "overalls", name: "Overalls" },
      { id: "hoodie", name: "Hoodie" }, { id: "tank", name: "Tank top" }, { id: "turtle", name: "Turtleneck" }, { id: "denim", name: "Denim jacket" },
      { id: "tiedye", name: "Tie-dye", lv: 3 }, { id: "varsity", name: "Varsity jacket", lv: 5 }, { id: "hawaii", name: "Hawaiian shirt", lv: 7 },
      { id: "jersey", name: "B-ball jersey", lv: 10 }, { id: "puffer", name: "Puffer jacket", lv: 13 }, { id: "leather", name: "Leather jacket", lv: 17 },
      { id: "sequin", name: "Sequin jacket", ach: "rave" }, { id: "tux", name: "Awards tux", vj: "exec" },
    ],
    graphic: [{ id: "none", name: "Plain" }, { id: "smiley", name: "Smiley" }, { id: "bolt", name: "Lightning" }, { id: "yinyang", name: "Yin-yang" }, { id: "alien", name: "Alien" }, { id: "star", name: "Star" }, { id: "rad", name: "RAD" }, { id: "tape", name: "Tape", lv: 4 }, { id: "rewind", name: "REWIND", ach: "first" }],
    neck: [{ id: "none", name: "None" }, { id: "choker", name: "Choker" }, { id: "chain", name: "Gold chain" }, { id: "puka", name: "Puka shells" }, { id: "kerchief", name: "Neck bandana", lv: 6 }],
    ears: [{ id: "none", name: "None" }, { id: "stud", name: "Studs" }, { id: "hoops", name: "Hoops" }, { id: "cross", name: "Dangly cross", lv: 8 }],
    phones: [{ id: "none", name: "None" }, { id: "foam", name: "Foam headphones", lv: 2 }, { id: "big", name: "DJ cans", vj: "spinz" }],
    bg: [
      { id: "memphis", name: "Memphis" }, { id: "checker", name: "Checkerboard" }, { id: "zigzag", name: "Zigzag" }, { id: "stars", name: "Starfield", lv: 3 },
      { id: "grid", name: "Laser grid", lv: 6 }, { id: "bars", name: "Colour bars", lv: 9 }, { id: "static", name: "Static", lv: 12 }, { id: "gold", name: "Gold record", ach: "platinum" },
    ],
  };
  const DEFAULT = {
    skin: "#eab58f", head: "round", hair: "curtains", hairC: "#3b2416", tips: false, brows: "normal", eyes: "big", eyeC: "#2a1a10",
    nose: "button", mouth: "grin", beard: "none", glasses: "none", hat: "none", hatC: "#ff3f8e", top: "flannel", topC: "#e8473a", top2: "#1d1d26",
    graphic: "smiley", neck: "none", ears: "none", phones: "none", freckles: false, blush: false, bg: "memphis", bgC: "#2fd8ff",
  };

  // ---------- drawing ----------
  const HEADS = {
    round: `M100 40 C134 40 148 64 148 92 C148 124 128 142 100 142 C72 142 52 124 52 92 C52 64 66 40 100 40Z`,
    oval: `M100 40 C128 40 142 62 142 92 C142 124 124 144 100 144 C76 144 58 124 58 92 C58 62 72 40 100 40Z`,
    square: `M76 40 H124 Q146 40 146 64 V118 Q146 142 120 142 H80 Q54 142 54 118 V64 Q54 40 76 40Z`,
    heart: `M100 40 C140 40 150 70 146 100 C142 126 118 146 100 146 C82 146 58 126 54 100 C50 70 60 40 100 40Z`,
    wide: `M100 40 C140 40 148 68 150 96 C152 128 130 142 100 142 C70 142 48 128 50 96 C52 68 60 40 100 40Z`,
  };

  function hairBack(s, hc, hs) {
    switch (s.hair) {
      case "mullet": return `<path d="M50 80 C48 40 70 30 100 30 C130 30 152 40 150 80 L158 166 L134 172 L128 134 H72 L66 172 L42 166Z" fill="${hc}" ${O}/>`;
      case "grunge": return `<path d="M48 80 C46 34 70 26 100 26 C130 26 154 34 152 80 L162 196 H38Z" fill="${hc}" ${O}/><path d="M60 150 V194 M80 140 V196 M120 140 V196 M140 150 V194" stroke="${hs}" stroke-width="3"/>`;
      case "rachel": return `<path d="M48 80 C46 36 70 28 100 28 C130 28 154 36 152 80 L156 146 Q150 162 136 152 L132 140 H68 L64 152 Q50 162 44 146Z" fill="${hc}" ${O}/>`;
      case "pony": return `<path d="M126 44 C170 30 186 80 164 128 C162 104 152 80 132 66Z" fill="${hc}" ${O}/><ellipse cx="134" cy="48" rx="12" ry="9" fill="${s.hatC}" ${O3} transform="rotate(-30 134 48)"/>`;
      case "buns": return `<path d="${bumpy(64, 40, 18, 9, 4)}" fill="${hc}" ${O}/><path d="${bumpy(136, 40, 18, 9, 4)}" fill="${hc}" ${O}/>`;
      case "afro": return `<path d="${bumpy(100, 78, 66, 18, 9)}" fill="${hc}" ${O}/>`;
      case "perm": return `<path d="${bumpy(100, 96, 64, 16, 10)}" fill="${hc}" ${O}/>`;
      case "bob": return `<path d="M44 82 C42 34 70 26 100 26 C130 26 158 34 156 82 L158 140 Q100 150 42 140Z" fill="${hc}" ${O}/>`;
      case "pigtails": return `<path d="M44 96 C14 100 12 150 30 170 C34 150 40 128 56 112Z" fill="${hc}" ${O}/><path d="M156 96 C186 100 188 150 170 170 C166 150 160 128 144 112Z" fill="${hc}" ${O}/><circle cx="46" cy="102" r="7" fill="${s.hatC}" ${O3}/><circle cx="154" cy="102" r="7" fill="${s.hatC}" ${O3}/>`;
      case "braids": return `<path d="M46 80 C44 34 70 26 100 26 C130 26 156 34 154 80 L160 206 H40Z" fill="${hc}" ${O}/>${[54, 66, 78, 122, 134, 146].map((x) => `<path d="M${x} 120 V204" stroke="${hs}" stroke-width="5" stroke-dasharray="6 3"/>`).join("")}`;
      default: return "";
    }
  }
  function hairFront(s, hc, hs, hl) {
    const tip = s.tips ? "#fff3a0" : hl;
    switch (s.hair) {
      case "buzz": return `<path d="M54 86 C50 50 72 38 100 38 C128 38 150 50 146 86 C140 66 124 56 100 56 C76 56 60 66 54 86Z" fill="${hc}" ${O3} opacity=".95"/>`;
      case "curtains": return `<path d="M52 94 C44 44 72 30 100 32 C128 30 156 44 148 94 C144 74 132 62 112 60 C108 70 104 76 100 78 C96 76 92 70 88 60 C68 62 56 74 52 94Z" fill="${hc}" ${O}/><path d="M96 40 C92 50 90 56 88 60 M104 40 C108 50 110 56 112 60" stroke="${hs}" stroke-width="3" fill="none"/>`;
      case "spikes": return `<path d="M52 86 L48 56 L60 52 L54 30 L74 40 L76 16 L90 34 L100 10 L110 34 L124 16 L126 40 L146 30 L140 52 L152 56 L148 86 C140 66 120 58 100 58 C80 58 60 66 52 86Z" fill="${hc}" ${O}/><path d="M54 30 L62 37 L58 40Z M76 16 L82 26 L77 29Z M100 10 L104 22 L97 22Z M124 16 L123 29 L118 26Z M146 30 L142 40 L138 37Z" fill="${tip}" ${O3}/>`;
      case "hightop": return `<path d="M56 84 L54 46 Q54 4 64 2 H136 Q146 4 146 46 L144 84 C136 64 120 58 100 58 C80 58 64 64 56 84Z" fill="${hc}" ${O}/><path d="M62 14 H138" stroke="${hl}" stroke-width="3"/>`;
      case "flattop": return `<path d="M54 84 L52 30 H148 L146 84 C138 64 120 58 100 58 C80 58 62 64 54 84Z" fill="${hc}" ${O}/><path d="M56 40 H144" stroke="${hl}" stroke-width="3"/>`;
      case "mullet": return `<path d="M52 84 C48 44 72 34 100 34 C128 34 152 44 148 84 C140 66 124 60 112 64 L106 56 L100 66 L94 56 L88 64 C76 60 60 66 52 84Z" fill="${hc}" ${O}/>`;
      case "bowl": return `<path d="M48 84 C46 36 72 26 100 26 C128 26 154 36 152 84Z" fill="${hc}" ${O}/><path d="M60 84 V70 M74 84 V66 M88 84 V64 M112 84 V64 M126 84 V66 M140 84 V70" stroke="${hs}" stroke-width="2"/>`;
      case "grunge": return `<path d="M52 116 C42 50 70 30 100 32 C130 30 158 50 148 116 C146 82 132 58 106 54 L100 64 L94 54 C68 58 54 82 52 116Z" fill="${hc}" ${O}/>`;
      case "rachel": return `<path d="M52 106 C44 46 72 30 104 32 C134 34 156 52 148 106 C144 82 136 68 122 62 C102 72 80 68 66 60 C58 72 54 86 52 106Z" fill="${hc}" ${O}/><path d="M70 50 Q96 60 124 52" stroke="${hl}" stroke-width="3" fill="none"/>`;
      case "pony": case "buns": case "slick": case "pigtails": case "braids":
        return `<path d="M52 88 C48 44 72 34 100 34 C128 34 152 44 148 88 C142 64 124 54 100 54 C76 54 58 64 52 88Z" fill="${hc}" ${O}/><path d="M100 36 V52" stroke="${hs}" stroke-width="3"/>${s.hair === "slick" ? `<path d="M70 44 Q100 36 130 44 M66 52 Q100 44 134 52" stroke="${hl}" stroke-width="3" fill="none"/>` : ""}`;
      case "afro": return `<path d="M54 84 C52 60 70 50 100 50 C130 50 148 60 146 84 C138 70 120 64 100 64 C80 64 62 70 54 84Z" fill="${hc}" ${O3}/>`;
      case "perm": return `<path d="${bumpy(76, 52, 16, 7, 5)}" fill="${hc}" ${O3}/><path d="${bumpy(100, 44, 17, 7, 5)}" fill="${hc}" ${O3}/><path d="${bumpy(124, 52, 16, 7, 5)}" fill="${hc}" ${O3}/>`;
      case "bob": return `<path d="M48 100 C42 40 70 30 100 30 C130 30 158 40 152 100 C150 86 148 78 146 72 H54 C52 78 50 86 48 100Z" fill="${hc}" ${O}/>`;
      case "mohawk": return `<path d="M54 86 C50 50 72 38 100 38 C128 38 150 50 146 86 C140 66 124 56 100 56 C76 56 60 66 54 86Z" fill="${hs}" opacity=".55"/><path d="M88 62 L82 6 L92 16 L96 -2 L104 14 L110 -2 L112 16 L120 6 L112 62Z" fill="${hc}" ${O}/>`;
      default: return `<path d="M76 54 Q84 48 92 50" stroke="#fff" stroke-width="4" opacity=".5" fill="none"/>`; // bald shine
    }
  }
  function brows(s, hc) {
    const c = shade(hc, -0.2), w = s.brows === "thick" ? 7 : s.brows === "thin" ? 3 : 5;
    switch (s.brows) {
      case "angry": return `<path d="M68 80 L92 88 M132 80 L108 88" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`;
      case "raised": return `<path d="M68 78 Q80 68 92 76 M108 76 Q120 68 132 78" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      case "uni": return `<path d="M66 82 Q80 74 100 82 Q120 74 134 82" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      default: return `<path d="M68 82 Q80 76 92 82 M108 82 Q120 76 132 82" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
    }
  }
  function eyes(s, expr) {
    const ec = s.eyeC || "#2a1a10";
    if (expr === "happy" || s.eyes === "happy") return `<path d="M72 98 Q80 88 88 98 M112 98 Q120 88 128 98" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    if (expr === "shock") return `<g><circle cx="80" cy="96" r="11" fill="#fff" ${O3}/><circle cx="120" cy="96" r="11" fill="#fff" ${O3}/><circle cx="80" cy="96" r="3" fill="#111"/><circle cx="120" cy="96" r="3" fill="#111"/></g>`;
    switch (s.eyes) {
      case "dots": return `<ellipse cx="80" cy="96" rx="4.5" ry="6" fill="#111"/><ellipse cx="120" cy="96" rx="4.5" ry="6" fill="#111"/>`;
      case "sleepy": return `<ellipse cx="80" cy="97" rx="9" ry="7" fill="#fff" ${O3}/><ellipse cx="120" cy="97" rx="9" ry="7" fill="#fff" ${O3}/><circle cx="80" cy="99" r="4" fill="${ec}"/><circle cx="120" cy="99" r="4" fill="${ec}"/><path d="M70 96 H90 M110 96 H130" stroke="#111" stroke-width="4"/><path d="M71 93 Q80 88 89 93Z M111 93 Q120 88 129 93Z" fill="${shade(s.skin, -0.15)}"/>`;
      case "lashes": return `<ellipse cx="80" cy="96" rx="9" ry="10" fill="#fff" ${O3}/><ellipse cx="120" cy="96" rx="9" ry="10" fill="#fff" ${O3}/><circle cx="81" cy="98" r="5" fill="${ec}"/><circle cx="121" cy="98" r="5" fill="${ec}"/><circle cx="83" cy="96" r="1.8" fill="#fff"/><circle cx="123" cy="96" r="1.8" fill="#fff"/><path d="M70 88 L66 84 M74 86 L72 81 M130 88 L134 84 M126 86 L128 81" stroke="#111" stroke-width="3" stroke-linecap="round"/>`;
      case "sparkle": return `<ellipse cx="80" cy="96" rx="10" ry="11" fill="${ec}" ${O3}/><ellipse cx="120" cy="96" rx="10" ry="11" fill="${ec}" ${O3}/><circle cx="84" cy="92" r="3.5" fill="#fff"/><circle cx="124" cy="92" r="3.5" fill="#fff"/><circle cx="77" cy="100" r="2" fill="#fff"/><circle cx="117" cy="100" r="2" fill="#fff"/>`;
      case "laser": return `<ellipse cx="80" cy="96" rx="10" ry="8" fill="#ff2e2e" ${O3}/><ellipse cx="120" cy="96" rx="10" ry="8" fill="#ff2e2e" ${O3}/><circle cx="80" cy="96" r="3" fill="#fff"/><circle cx="120" cy="96" r="3" fill="#fff"/><path d="M90 96 L200 70 M130 96 L200 110" stroke="#ff2e2e" stroke-width="2.5" opacity=".7" class="laser"/>`;
      default: return `<ellipse cx="80" cy="96" rx="8" ry="10" fill="#fff" ${O3}/><ellipse cx="120" cy="96" rx="8" ry="10" fill="#fff" ${O3}/><circle cx="81" cy="98" r="4.5" fill="${ec}"/><circle cx="121" cy="98" r="4.5" fill="${ec}"/><circle cx="82.5" cy="96" r="1.6" fill="#fff"/><circle cx="122.5" cy="96" r="1.6" fill="#fff"/>`;
    }
  }
  function nose(s, sk) {
    const d = shade(sk, -0.22);
    switch (s.nose) {
      case "pointy": return `<path d="M100 98 L110 116 L98 118" fill="none" stroke="${d}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      case "big": return `<ellipse cx="100" cy="112" rx="11" ry="9" fill="${shade(sk, -0.06)}" ${O3}/>`;
      case "line": return `<path d="M98 102 Q96 112 102 114" fill="none" stroke="${d}" stroke-width="3" stroke-linecap="round"/>`;
      case "wide": return `<path d="M90 112 Q94 118 100 116 Q106 118 110 112" fill="none" stroke="${d}" stroke-width="3.5" stroke-linecap="round"/><path d="M96 100 Q94 108 92 110" stroke="${d}" stroke-width="2.5" fill="none"/>`;
      default: return `<ellipse cx="100" cy="111" rx="6" ry="5" fill="${d}"/>`;
    }
  }
  function mouth(s, expr) {
    let m = s.mouth;
    if (expr === "happy") m = m === "braces" || m === "gold" ? m : "laugh";
    if (expr === "sad") m = "frown";
    if (expr === "shock") m = "o";
    if (expr === "talk") m = "talk";
    switch (m) {
      case "grin": return `<path d="M82 124 Q100 140 118 124 Z" fill="#fff" ${O3}/><path d="M86 126 H114" stroke="#111" stroke-width="1.5"/>`;
      case "smirk": return `<path d="M86 128 Q104 134 118 122" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round"/>`;
      case "laugh": return `<path d="M80 122 Q100 148 120 122 Z" fill="#6b1a2a" ${O3}/><path d="M88 138 Q100 132 112 138 Q100 146 88 138Z" fill="#ff7a8a"/><path d="M82 124 H118" stroke="#fff" stroke-width="4"/>`;
      case "braces": return `<path d="M80 122 Q100 144 120 122 Z" fill="#fff" ${O3}/><path d="M84 128 H116" stroke="#9aa4b0" stroke-width="3"/>${[88, 96, 104, 112].map((x) => `<rect x="${x - 2}" y="126" width="4" height="4" fill="#c7d0dc" stroke="#555" stroke-width="1"/>`).join("")}`;
      case "gold": return `<path d="M82 124 Q100 140 118 124 Z" fill="#fff" ${O3}/><rect x="103" y="125" width="6" height="6" fill="#ffd23f" stroke="#111" stroke-width="1.2"/>`;
      case "tongue": return `<path d="M84 124 Q100 136 116 124" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round"/><path d="M98 128 Q98 142 106 142 Q114 142 112 128" fill="#ff6f8a" ${O3}/>`;
      case "flat": return `<path d="M88 128 H112" stroke="#111" stroke-width="4" stroke-linecap="round"/>`;
      case "frown": return `<path d="M86 132 Q100 120 114 132" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round"/>`;
      case "o": return `<ellipse cx="100" cy="130" rx="8" ry="10" fill="#6b1a2a" ${O3}/>`;
      case "talk": return `<ellipse cx="100" cy="128" rx="12" ry="7" fill="#6b1a2a" ${O3}/><path d="M92 126 H108" stroke="#fff" stroke-width="3"/>`;
      default: return `<path d="M84 124 Q100 138 116 124" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round"/>`;
    }
  }
  function beard(s, hc, hs) {
    switch (s.beard) {
      case "stubble": return `<path d="M60 112 C64 136 82 146 100 146 C118 146 136 136 140 112 C130 128 116 132 100 132 C84 132 70 128 60 112Z" fill="${hc}" opacity=".35"/>`;
      case "goatee": return `<path d="M86 134 Q100 160 114 134 Q100 142 86 134Z" fill="${hc}" ${O3}/><path d="M84 120 Q100 112 116 120" stroke="${hc}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      case "soul": return `<path d="M95 136 L100 146 L105 136Z" fill="${hc}" ${O3}/>`;
      case "tache": return `<path d="M80 122 Q90 112 100 118 Q110 112 120 122 Q110 120 100 124 Q90 120 80 122Z" fill="${hc}" ${O3}/>`;
      case "full": return `<path d="M54 100 C54 140 76 160 100 160 C124 160 146 140 146 100 L140 104 C136 122 124 132 100 132 C76 132 64 122 60 104Z" fill="${hc}" ${O}/><path d="M80 122 Q90 114 100 118 Q110 114 120 122" stroke="${hc}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M84 124 Q100 134 116 124" fill="#6b1a2a"/>`;
      case "chin": return `<path d="M54 98 C56 136 78 150 100 150 C122 150 144 136 146 98 L142 98 C140 128 120 142 100 142 C80 142 60 128 58 98Z" fill="${hc}" ${O3}/>`;
      case "chops": return `<path d="M54 90 L64 90 L68 126 Q60 130 54 120Z M146 90 L136 90 L132 126 Q140 130 146 120Z" fill="${hc}" ${O3}/>`;
      default: return "";
    }
  }
  function glasses(s) {
    switch (s.glasses) {
      case "round": return `<circle cx="80" cy="96" r="14" fill="#cfe8ff" fill-opacity=".25" stroke="#c9a227" stroke-width="3"/><circle cx="120" cy="96" r="14" fill="#cfe8ff" fill-opacity=".25" stroke="#c9a227" stroke-width="3"/><path d="M94 94 Q100 90 106 94 M66 94 L54 90 M134 94 L146 90" stroke="#c9a227" stroke-width="3" fill="none"/>`;
      case "tiny": return `<ellipse cx="80" cy="96" rx="13" ry="6" fill="#111"/><ellipse cx="120" cy="96" rx="13" ry="6" fill="#111"/><path d="M93 95 H107 M67 95 L54 92 M133 95 L146 92" stroke="#111" stroke-width="2.5"/><path d="M72 94 L78 94" stroke="#fff" stroke-width="2"/>`;
      case "nerd": return `<rect x="64" y="84" width="32" height="24" rx="6" fill="#cfe8ff" fill-opacity=".3" ${O}/><rect x="104" y="84" width="32" height="24" rx="6" fill="#cfe8ff" fill-opacity=".3" ${O}/><path d="M96 94 H104 M64 92 L54 90 M136 92 L146 90" stroke="#111" stroke-width="4"/>`;
      case "wrap": return `<path d="M56 90 Q100 78 144 90 L140 104 Q120 112 100 104 Q80 112 60 104Z" fill="${s.hatC}" ${O3}/><path d="M64 92 Q100 82 136 92" stroke="#fff" stroke-width="3" opacity=".6" fill="none"/>`;
      case "3d": return `<rect x="62" y="84" width="76" height="24" rx="3" fill="#f4f4f4" ${O3}/><rect x="68" y="88" width="26" height="16" fill="#ff2e4e" opacity=".85"/><rect x="106" y="88" width="26" height="16" fill="#2ec9ff" opacity=".85"/>`;
      case "heart": return [80, 120].map((x) => `<path d="M${x} 108 L${x - 14} 94 Q${x - 16} 82 ${x - 6} 84 Q${x} 86 ${x} 90 Q${x} 86 ${x + 6} 84 Q${x + 16} 82 ${x + 14} 94Z" fill="#ff3f8e" ${O3}/>`).join("") + `<path d="M93 92 H107" stroke="#111" stroke-width="3"/>`;
      case "star": return [80, 120].map((x) => `<path d="M${x} 80 L${x + 5} 91 L${x + 16} 92 L${x + 8} 100 L${x + 10} 111 L${x} 105 L${x - 10} 111 L${x - 8} 100 L${x - 16} 92 L${x - 5} 91Z" fill="#ffe14d" ${O3}/>`).join("") + `<path d="M94 94 H106" stroke="#111" stroke-width="3"/>`;
      default: return "";
    }
  }
  function hat(s, hc) {
    const c = s.hatC, d = shade(c, -0.25);
    switch (s.hat) {
      case "backcap": return `<path d="M50 78 C48 30 72 18 100 18 C128 18 152 30 150 78 Z" fill="${c}" ${O}/><path d="M50 78 H150" stroke="#111" stroke-width="4"/><path d="M84 78 Q100 58 116 78Z" fill="${hc}" ${O3}/><path d="M86 70 H114" stroke="${d}" stroke-width="3"/><circle cx="100" cy="20" r="4" fill="${d}" ${O3}/>`;
      case "cap": return `<path d="M52 74 C50 30 72 18 100 18 C128 18 150 30 148 74 Z" fill="${c}" ${O}/><path d="M42 78 Q100 60 158 78 Q160 92 100 90 Q40 92 42 78Z" fill="${d}" ${O}/><circle cx="100" cy="20" r="4" fill="${d}" ${O3}/><path d="M100 22 V72" stroke="${d}" stroke-width="2"/>`;
      case "bucket": return `<path d="M58 66 C58 28 78 18 100 18 C122 18 142 28 142 66Z" fill="${c}" ${O}/><path d="M32 82 Q100 52 168 82 Q100 70 32 82Z" fill="${d}" ${O}/><path d="M60 60 H140" stroke="${d}" stroke-width="3"/>`;
      case "beanie": return `<path d="M50 78 C48 26 72 14 100 14 C128 14 152 26 150 78Z" fill="${c}" ${O}/><rect x="48" y="62" width="104" height="18" rx="6" fill="${d}" ${O}/>${[60, 72, 84, 96, 108, 120, 132, 144].map((x) => `<path d="M${x} 64 V78" stroke="${shade(c, -0.4)}" stroke-width="2"/>`).join("")}<path d="${bumpy(100, 12, 10, 8, 3)}" fill="#fff" ${O3}/>`;
      case "bandana": return `<path d="M50 74 C50 34 72 24 100 24 C128 24 150 34 150 74 C130 66 70 66 50 74Z" fill="${c}" ${O}/>${[[66, 46], [86, 36], [110, 38], [132, 48], [76, 60], [122, 60], [100, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff"/>`).join("")}<path d="M150 66 L170 58 L164 80Z M150 70 L168 86 L154 90Z" fill="${c}" ${O3}/>`;
      case "sweatband": return `<path d="M52 66 Q100 54 148 66 L148 80 Q100 68 52 80Z" fill="${c}" ${O3}/><path d="M54 72 Q100 61 146 72" stroke="#fff" stroke-width="3" fill="none"/>`;
      case "propeller": return `<path d="M52 72 C50 30 72 20 100 20 C128 20 150 30 148 72Z" fill="#ff3f3f" ${O}/><path d="M100 20 C80 22 72 40 72 72 H100Z" fill="#ffe14d"/><path d="M100 20 C120 22 128 40 128 72 H100Z" fill="#2f6fd6"/><path d="M52 72 C50 30 72 20 100 20 C128 20 150 30 148 72Z" fill="none" ${O}/><path d="M100 20 V8" stroke="#111" stroke-width="4"/><g class="prop"><path d="M70 6 Q100 -2 130 6 Q100 14 70 6Z" fill="#1ee3a1" ${O3}/></g>`;
      case "crown": return `<path d="M58 66 L54 24 L76 44 L100 14 L124 44 L146 24 L142 66Z" fill="#ffd23f" ${O}/><circle cx="100" cy="40" r="6" fill="#ff3f8e" ${O3}/><circle cx="74" cy="54" r="4" fill="#2fd8ff" ${O3}/><circle cx="126" cy="54" r="4" fill="#1ee3a1" ${O3}/>`;
      default: return "";
    }
  }
  function graphic(s, x, y) {
    const g = s.graphic, k = s.top2;
    switch (g) {
      case "smiley": return `<circle cx="${x}" cy="${y}" r="16" fill="#ffe14d" ${O3}/><circle cx="${x - 5}" cy="${y - 4}" r="2.4" fill="#111"/><circle cx="${x + 5}" cy="${y - 4}" r="2.4" fill="#111"/><path d="M${x - 8} ${y + 3} Q${x} ${y + 11} ${x + 8} ${y + 3}" stroke="#111" stroke-width="2.5" fill="none"/>`;
      case "bolt": return `<path d="M${x + 4} ${y - 20} L${x - 10} ${y + 2} H${x} L${x - 4} ${y + 20} L${x + 12} ${y - 4} H${x + 2}Z" fill="#ffe14d" ${O3}/>`;
      case "yinyang": return `<circle cx="${x}" cy="${y}" r="16" fill="#fff" ${O3}/><path d="M${x} ${y - 16} A16 16 0 0 1 ${x} ${y + 16} A8 8 0 0 1 ${x} ${y} A8 8 0 0 0 ${x} ${y - 16}Z" fill="#111"/><circle cx="${x}" cy="${y - 8}" r="2.5" fill="#fff"/><circle cx="${x}" cy="${y + 8}" r="2.5" fill="#111"/>`;
      case "alien": return `<path d="M${x} ${y - 18} C${x + 18} ${y - 18} ${x + 18} ${y + 4} ${x} ${y + 18} C${x - 18} ${y + 4} ${x - 18} ${y - 18} ${x} ${y - 18}Z" fill="#7dff6b" ${O3}/><path d="M${x - 11} ${y - 4} L${x - 3} ${y + 2} L${x - 3} ${y - 2}Z M${x + 11} ${y - 4} L${x + 3} ${y + 2} L${x + 3} ${y - 2}Z" fill="#111"/>`;
      case "star": return `<path d="M${x} ${y - 18} L${x + 5} ${y - 6} L${x + 18} ${y - 5} L${x + 8} ${y + 4} L${x + 11} ${y + 17} L${x} ${y + 10} L${x - 11} ${y + 17} L${x - 8} ${y + 4} L${x - 18} ${y - 5} L${x - 5} ${y - 6}Z" fill="#ffe14d" ${O3}/>`;
      case "rad": return `<text x="${x}" y="${y + 8}" font-family="Bungee" font-size="20" text-anchor="middle" fill="${k}" stroke="#111" stroke-width="1.5">RAD</text>`;
      case "tape": return `<rect x="${x - 20}" y="${y - 12}" width="40" height="24" rx="3" fill="${k}" ${O3}/><circle cx="${x - 8}" cy="${y - 2}" r="4" fill="#fff" stroke="#111" stroke-width="2"/><circle cx="${x + 8}" cy="${y - 2}" r="4" fill="#fff" stroke="#111" stroke-width="2"/>`;
      case "rewind": return `<text x="${x}" y="${y + 6}" font-family="Bungee" font-size="13" text-anchor="middle" fill="#ffe14d" stroke="#111" stroke-width="1.2">◀◀REWIND</text>`;
      default: return "";
    }
  }
  function top(s, sk, id) {
    const c = s.topC, c2 = s.top2, d = shade(c, -0.25), body = `M24 240 C24 190 44 164 80 156 L120 156 C156 164 176 190 176 240Z`;
    const neckV = `<path d="M84 156 L100 180 L116 156Z" fill="${sk}" ${O3}/>`;
    switch (s.top) {
      case "flannel": return `<defs><pattern id="pl${id}" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="${c}"/><rect width="18" height="6" y="6" fill="${d}" opacity=".7"/><rect width="6" height="18" x="6" fill="${d}" opacity=".7"/><rect width="18" height="1.5" y="14" fill="${c2}" opacity=".6"/><rect width="1.5" height="18" x="14" fill="${c2}" opacity=".6"/></pattern></defs>
        <path d="${body}" fill="url(#pl${id})" ${O}/><path d="M80 156 L100 240 L120 156Z" fill="#f4f1ea" ${O3}/>${graphicIf(s, 100, 200, true)}<path d="M80 156 L94 196 L74 176Z M120 156 L106 196 L126 176Z" fill="url(#pl${id})" ${O3}/>`;
      case "windbreaker": return `<clipPath id="cb${id}"><path d="${body}"/></clipPath><path d="${body}" fill="${c}"/><g clip-path="url(#cb${id})"><path d="M0 196 L200 176 V214 L0 232Z" fill="${c2}"/><path d="M0 232 L200 214 V240 H0Z" fill="${shade(c2, 0.5)}"/></g><path d="${body}" fill="none" ${O}/><path d="M100 160 V240" stroke="#111" stroke-width="3"/><path d="M80 156 Q100 170 120 156 L124 150 Q100 162 76 150Z" fill="${d}" ${O3}/>`;
      case "overalls": return `<path d="${body}" fill="${c2}" ${O}/>${neckV}<path d="M66 240 V196 Q66 188 74 188 H126 Q134 188 134 196 V240Z" fill="#4a6fb5" ${O}/><path d="M74 188 L64 160 M126 188 L136 160" stroke="#4a6fb5" stroke-width="10"/><path d="M74 188 L64 160 M126 188 L136 160" stroke="#111" stroke-width="2" opacity=".5"/><circle cx="76" cy="194" r="4" fill="#ffd23f" ${O3}/><circle cx="124" cy="194" r="4" fill="#ffd23f" ${O3}/><rect x="88" y="200" width="24" height="16" rx="2" fill="#3c5c9a" ${O3}/>`;
      case "hoodie": return `<path d="M62 160 Q100 124 138 160 Q100 150 62 160Z" fill="${d}" ${O}/><path d="${body}" fill="${c}" ${O}/><path d="M80 158 Q100 182 120 158" fill="${d}" ${O3}/><path d="M92 170 V200 M108 170 V200" stroke="#f4f1ea" stroke-width="3"/><path d="M66 240 V220 H134 V240" fill="${d}" ${O3}/>${graphicIf(s, 100, 202)}`;
      case "tank": return `<path d="M44 240 C44 200 56 178 70 168 L78 156 L90 158 Q100 176 110 158 L122 156 L130 168 C144 178 156 200 156 240Z" fill="${c}" ${O}/><path d="M24 240 C26 200 40 176 70 166 L64 240Z M176 240 C174 200 160 176 130 166 L136 240Z" fill="${sk}" ${O}/>${graphicIf(s, 100, 206)}`;
      case "turtle": return `<path d="${body}" fill="${c}" ${O}/><rect x="80" y="140" width="40" height="26" rx="6" fill="${d}" ${O}/><path d="M84 148 H116 M84 156 H116" stroke="${shade(c, -0.45)}" stroke-width="2"/>`;
      case "denim": case "leather": {
        const j = s.top === "denim" ? "#4f79c4" : "#1d1d22", jd = shade(j, -0.3);
        return `<path d="${body}" fill="${j}" ${O}/><path d="M80 156 L100 240 L120 156Z" fill="${c}" ${O3}/>${graphicIf(s, 100, 204, true)}<path d="M80 156 L94 200 L70 180 L66 160Z M120 156 L106 200 L130 180 L134 160Z" fill="${jd}" ${O3}/>${s.top === "denim" ? `<path d="M40 200 H72 M128 200 H160" stroke="#f2c46a" stroke-width="2" stroke-dasharray="4 3"/>` : `<path d="M112 210 L128 236" stroke="#c4c6cc" stroke-width="3"/>`}`;
      }
      case "tiedye": return `<defs><radialGradient id="td${id}" cx="40%" cy="40%" r="80%"><stop offset="0" stop-color="#ff3f8e"/><stop offset=".25" stop-color="#ffe14d"/><stop offset=".45" stop-color="#1ee3a1"/><stop offset=".65" stop-color="#2fd8ff"/><stop offset=".85" stop-color="#7b3cff"/><stop offset="1" stop-color="#ff3f8e"/></radialGradient></defs><path d="${body}" fill="url(#td${id})" ${O}/><path d="M60 200 Q100 170 140 210 M50 224 Q100 190 150 230" stroke="#fff" stroke-width="3" opacity=".4" fill="none"/><path d="M80 156 Q100 172 120 156" fill="none" ${O3}/>`;
      case "varsity": return `<path d="${body}" fill="${c}" ${O}/><path d="M24 240 C24 196 40 172 62 162 L68 240Z M176 240 C176 196 160 172 138 162 L132 240Z" fill="#f4f1ea" ${O}/><path d="M80 156 L100 176 L120 156" fill="none" stroke="${c2}" stroke-width="8"/><path d="M100 176 V240" stroke="#111" stroke-width="2"/>${[188, 204, 220].map((y) => `<circle cx="100" cy="${y}" r="3" fill="#f4f1ea" stroke="#111" stroke-width="1.5"/>`).join("")}<text x="82" y="214" font-family="Bungee" font-size="24" text-anchor="middle" fill="${c2}" stroke="#111" stroke-width="1.5">R</text>`;
      case "hawaii": return `<path d="${body}" fill="${c}" ${O}/>${[[58, 196], [84, 226], [128, 192], [150, 222], [110, 230], [66, 228], [140, 176]].map(([x, y]) => `<g transform="translate(${x} ${y})"><circle r="7" fill="${c2}"/><circle r="2.5" fill="#ffe14d"/><path d="M-12 6 Q-4 0 -2 10Z" fill="#1ee3a1"/></g>`).join("")}<path d="M80 156 L100 186 L120 156 L128 168 L100 196 L72 168Z" fill="${d}" ${O3}/><path d="${body}" fill="none" ${O}/>`;
      case "jersey": return `<path d="M44 240 C44 200 56 178 70 168 L78 156 L90 158 Q100 180 110 158 L122 156 L130 168 C144 178 156 200 156 240Z" fill="${c}" ${O}/><path d="M24 240 C26 200 40 176 70 166 L64 240Z M176 240 C174 200 160 176 130 166 L136 240Z" fill="${sk}" ${O}/><path d="M78 158 Q100 186 122 158" fill="none" stroke="${c2}" stroke-width="5"/><text x="100" y="226" font-family="Bungee" font-size="34" text-anchor="middle" fill="${c2}" stroke="#111" stroke-width="2">23</text>`;
      case "puffer": return `<path d="M20 240 C20 186 42 158 80 150 L120 150 C158 158 180 186 180 240Z" fill="${c}" ${O}/>${[178, 200, 222].map((y) => `<path d="M26 ${y} Q100 ${y + 8} 174 ${y}" stroke="${d}" stroke-width="3" fill="none"/>`).join("")}<path d="M76 150 Q100 132 124 150 L126 162 Q100 150 74 162Z" fill="${d}" ${O3}/><path d="M100 160 V240" stroke="#111" stroke-width="3"/><path d="M50 184 Q60 176 72 182" stroke="#fff" stroke-width="4" opacity=".5" fill="none"/>`;
      case "sequin": return `<defs><pattern id="sq${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${c}"/><circle cx="5" cy="5" r="3.2" fill="${shade(c, 0.45)}"/><circle cx="4" cy="4" r="1" fill="#fff"/></pattern></defs><path d="${body}" fill="url(#sq${id})" ${O}/><path d="M80 156 L100 240 L120 156Z" fill="#1d1d26" ${O3}/><path d="M80 156 L94 200 L70 180Z M120 156 L106 200 L130 180Z" fill="${d}" ${O3}/>`;
      case "tux": return `<path d="${body}" fill="#1d1d26" ${O}/><path d="M80 156 L100 240 L120 156Z" fill="#f4f1ea" ${O3}/><path d="M88 166 L100 172 L112 166 L112 178 L100 172 L88 178Z" fill="${c}" ${O3}/><path d="M80 156 L96 210 L66 182Z M120 156 L104 210 L134 182Z" fill="#2c2c3a" ${O3}/>${[194, 210, 226].map((y) => `<circle cx="100" cy="${y}" r="2.5" fill="#111"/>`).join("")}`;
      default: return `<path d="M18 240 C18 186 42 162 80 156 L120 156 C158 162 182 186 182 240Z" fill="${c}" ${O}/><path d="M80 156 Q100 176 120 156" fill="${d}" ${O3}/>${graphicIf(s, 100, 206)}`;
    }
  }
  const graphicIf = (s, x, y, small) => (s.graphic && s.graphic !== "none" ? (small ? `<g transform="translate(${x} ${y}) scale(.6) translate(${-x} ${-y})">${graphic(s, x, y)}</g>` : graphic(s, x, y)) : "");
  function neckwear(s) {
    switch (s.neck) {
      case "choker": return `<path d="M84 146 Q100 154 116 146" stroke="#111" stroke-width="6" fill="none"/><circle cx="100" cy="152" r="3" fill="${s.hatC}"/>`;
      case "chain": return `<path d="M82 156 Q100 192 118 156" stroke="#d9a520" stroke-width="5" fill="none" stroke-dasharray="5 2"/><circle cx="100" cy="178" r="6" fill="#ffd23f" ${O3}/>`;
      case "puka": return `<path d="M84 150 Q100 164 116 150" stroke="#111" stroke-width="1" fill="none"/>${[86, 92, 100, 108, 114].map((x, i) => `<ellipse cx="${x}" cy="${152 + [1, 5, 7, 5, 1][i]}" rx="3.2" ry="2.4" fill="#f7efe0" stroke="#111" stroke-width="1.2"/>`).join("")}`;
      case "kerchief": return `<path d="M78 152 L122 152 L100 182Z" fill="${s.hatC}" ${O3}/>${[[94, 160], [106, 160], [100, 170]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#fff"/>`).join("")}`;
      default: return "";
    }
  }
  function earwear(s) {
    switch (s.ears) {
      case "stud": return `<circle cx="52" cy="110" r="3" fill="#ffd23f" stroke="#111" stroke-width="1.5"/><circle cx="148" cy="110" r="3" fill="#ffd23f" stroke="#111" stroke-width="1.5"/>`;
      case "hoops": return `<circle cx="52" cy="118" r="8" fill="none" stroke="#ffd23f" stroke-width="3.5"/><circle cx="148" cy="118" r="8" fill="none" stroke="#ffd23f" stroke-width="3.5"/>`;
      case "cross": return `<path d="M52 110 V128 M47 116 H57 M148 110 V128 M143 116 H153" stroke="#c4c6cc" stroke-width="3"/>`;
      default: return "";
    }
  }
  function phones(s) {
    if (s.phones === "foam") return `<path d="M52 92 C48 40 152 40 148 92" stroke="#c4c6cc" stroke-width="5" fill="none"/><circle cx="50" cy="98" r="13" fill="#ff8a1a" ${O3}/><circle cx="150" cy="98" r="13" fill="#ff8a1a" ${O3}/>`;
    if (s.phones === "big") return `<path d="M48 96 C42 22 158 22 152 96" stroke="#1d1d26" stroke-width="9" fill="none"/><rect x="34" y="80" width="22" height="36" rx="9" fill="#1d1d26" ${O3}/><rect x="144" y="80" width="22" height="36" rx="9" fill="#1d1d26" ${O3}/><circle cx="45" cy="98" r="6" fill="${s.hatC}"/><circle cx="155" cy="98" r="6" fill="${s.hatC}"/>`;
    return "";
  }
  function background(s, id) {
    const c = s.bgC, l = shade(c, 0.35), d = shade(c, -0.3);
    switch (s.bg) {
      case "checker": return `<defs><pattern id="ck${id}" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(12)"><rect width="40" height="40" fill="${c}"/><rect width="20" height="20" fill="${d}"/><rect x="20" y="20" width="20" height="20" fill="${d}"/></pattern></defs><rect width="200" height="240" fill="url(#ck${id})"/>`;
      case "zigzag": return `<rect width="200" height="240" fill="${c}"/>${[30, 80, 130, 180, 230].map((y) => `<path d="M-10 ${y} ${Array.from({ length: 12 }, (_, i) => `L${i * 20} ${y + (i % 2 ? -12 : 0)}`).join(" ")}" stroke="${d}" stroke-width="6" fill="none"/>`).join("")}`;
      case "stars": return `<rect width="200" height="240" fill="#1a0b2e"/>${Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 73) % 200}" cy="${(i * 47) % 240}" r="${1 + (i % 3)}" fill="${i % 4 ? "#fff" : c}" class="tw" style="animation-delay:${(i % 7) * 0.3}s"/>`).join("")}`;
      case "grid": return `<rect width="200" height="240" fill="#14002e"/><rect width="200" height="110" fill="url(#gs${id})"/><defs><linearGradient id="gs${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14002e"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><circle cx="100" cy="110" r="44" fill="#ffb23f"/>${[96, 100, 104].map((y) => `<rect x="40" y="${y}" width="120" height="2" fill="#14002e"/>`).join("")}<g stroke="${c}" stroke-width="2">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M0 ${110 + i * i * 3.2} H200"/>`).join("")}${[-6, -4, -2, 0, 2, 4, 6].map((i) => `<path d="M100 110 L${100 + i * 40} 240"/>`).join("")}</g>`;
      case "bars": return ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"].map((col, i) => `<rect x="${i * 200 / 7}" y="0" width="${200 / 7 + 1}" height="240" fill="${col}"/>`).join("") + `<rect y="180" width="200" height="60" fill="#111"/>`;
      case "static": return `<defs><filter id="ns${id}"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="${id}"/><feColorMatrix values="0 0 0 0 .8  0 0 0 0 .8  0 0 0 0 .8  0 0 0 1.6 -.4"/></filter></defs><rect width="200" height="240" fill="#555"/><rect width="200" height="240" filter="url(#ns${id})" class="noise"/>`;
      case "gold": return `<rect width="200" height="240" fill="#2a1a40"/><circle cx="100" cy="120" r="96" fill="#d9a520" stroke="#111" stroke-width="4"/>${[80, 64, 48].map((r) => `<circle cx="100" cy="120" r="${r}" fill="none" stroke="#b5861a" stroke-width="2"/>`).join("")}<circle cx="100" cy="120" r="22" fill="#ffe9a8"/><path d="M40 60 Q60 40 90 36" stroke="#fff6c8" stroke-width="6" opacity=".6" fill="none"/>`;
      default: { // memphis
        return `<rect width="200" height="240" fill="${c}"/>
          <path d="M14 30 Q24 18 34 30 T54 30 T74 30" stroke="#111" stroke-width="4" fill="none"/>
          <path d="M150 20 L176 20 L163 42Z" fill="${shade(c, 0.6)}" stroke="#111" stroke-width="3"/>
          <circle cx="172" cy="196" r="12" fill="none" stroke="#111" stroke-width="4"/>
          <rect x="10" y="176" width="22" height="22" fill="${d}" stroke="#111" stroke-width="3" transform="rotate(20 21 187)"/>
          ${[[30, 70], [40, 90], [168, 80], [178, 100], [20, 130], [184, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#111"/>`).join("")}
          <path d="M150 120 L190 112" stroke="${l}" stroke-width="6" stroke-linecap="round"/>`;
      }
    }
  }

  // full avatar. opts: { expr: happy|sad|shock|talk, bg: false to skip the background, cls, anim }
  function svg(spec, opts = {}) {
    const s = { ...DEFAULT, ...spec }, id = ++uid;
    const sk = s.skin, skd = shade(sk, -0.14), hc = s.hairC, hs = shade(hc, -0.3), hl = shade(hc, 0.3);
    const head = HEADS[s.head] || HEADS.round;
    const bg = opts.bg === false ? "" : `<clipPath id="cp${id}"><rect width="200" height="240" rx="18"/></clipPath><g clip-path="url(#cp${id})">${background(s, id)}</g>`;
    return `<svg class="av ${opts.cls || ""} ${opts.anim === false ? "" : "bob"}" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="avatar">${bg}
      <g class="body">
        ${hairBack(s, hc, hs)}
        <rect x="84" y="126" width="32" height="40" fill="${skd}" ${O}/>
        ${top(s, sk, id)}
        ${neckwear(s)}
      </g>
      <g class="headg">
        <ellipse cx="52" cy="98" rx="9" ry="12" fill="${sk}" ${O}/><ellipse cx="148" cy="98" rx="9" ry="12" fill="${sk}" ${O}/>
        ${earwear(s)}
        <path d="${head}" fill="${sk}" ${O}/>
        ${s.blush ? `<ellipse cx="70" cy="116" rx="9" ry="5" fill="#ff7a9a" opacity=".45"/><ellipse cx="130" cy="116" rx="9" ry="5" fill="#ff7a9a" opacity=".45"/>` : ""}
        ${s.freckles ? [[68, 108], [74, 112], [64, 114], [126, 108], [132, 112], [136, 106]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${shade(sk, -0.4)}"/>`).join("") : ""}
        ${beard(s, hc, hs)}
        <g class="eyes">${eyes(s, opts.expr)}</g>
        ${nose(s, sk)}
        <g class="mouth">${mouth(s, opts.expr)}</g>
        ${hairFront(s, hc, hs, hl)}
        ${brows(s, hc)}
        ${glasses(s)}
        ${hat(s, hc)}
        ${phones(s)}
      </g>
    </svg>`;
  }

  function random(rnd = Math.random, ok = () => true) {
    const p = (a) => { const l = a.filter((o) => typeof o === "string" || ok(o)); const v = l[Math.floor(rnd() * l.length)]; return typeof v === "string" ? v : v.id ?? v.c; };
    const ids = (k) => p(CATALOG[k]);
    return {
      skin: p(SKIN.slice(0, 9)), head: ids("head"), hair: ids("hair"), hairC: p(HAIRC), tips: rnd() < 0.2, brows: ids("brows"), eyes: ids("eyes"), eyeC: p(CATALOG.eyeC),
      nose: ids("nose"), mouth: ids("mouth"), beard: rnd() < 0.6 ? "none" : ids("beard"), glasses: rnd() < 0.55 ? "none" : ids("glasses"), hat: rnd() < 0.5 ? "none" : ids("hat"),
      hatC: p(COLORS), top: ids("top"), topC: p(COLORS), top2: p(COLORS), graphic: ids("graphic"), neck: rnd() < 0.6 ? "none" : ids("neck"), ears: rnd() < 0.6 ? "none" : ids("ears"),
      phones: "none", freckles: rnd() < 0.2, blush: rnd() < 0.25, bg: ids("bg"), bgC: p(COLORS),
    };
  }

  return { svg, random, CATALOG, SKIN, HAIRC, COLORS, DEFAULT, shade };
})();
