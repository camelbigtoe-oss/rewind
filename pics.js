// Hand-drawn 90s objects for the PICTURE THIS round. Each is an SVG in a 120x120 box,
// drawn in the same thick-outline cartoon style as the avatars.
const Pics = (() => {
  "use strict";
  const S = 'stroke="#111" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  const s3 = 'stroke="#111" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  const ART = {
    cassette: `<rect x="10" y="28" width="100" height="64" rx="8" fill="#ff4fa3" ${S}/>
      <rect x="22" y="38" width="76" height="26" rx="4" fill="#fff6d8" ${s3}/>
      <circle cx="42" cy="51" r="8" fill="#fff" ${s3}/><circle cx="78" cy="51" r="8" fill="#fff" ${s3}/>
      <rect x="50" y="46" width="20" height="10" fill="#3a2a2a" ${s3}/>
      <path d="M30 92 L36 76 H84 L90 92" fill="#c43a7e" ${S}/>
      <text x="60" y="35" font-family="Russo One" font-size="7" text-anchor="middle" fill="#111">MIXTAPE</text>`,
    vhs: `<rect x="8" y="30" width="104" height="60" rx="5" fill="#2b2b33" ${S}/>
      <rect x="20" y="40" width="80" height="22" rx="3" fill="#15151a" ${s3}/>
      <circle cx="40" cy="51" r="7" fill="#eee" ${s3}/><circle cx="80" cy="51" r="7" fill="#eee" ${s3}/>
      <rect x="26" y="68" width="68" height="14" fill="#fff" ${s3}/>
      <text x="60" y="79" font-family="Bangers" font-size="9" text-anchor="middle" fill="#d02">BE KIND REWIND</text>`,
    walkman: `<path d="M24 22 Q60 -6 96 22" fill="none" stroke="#111" stroke-width="5"/>
      <rect x="14" y="18" width="16" height="24" rx="7" fill="#ff8a1a" ${S}/><rect x="90" y="18" width="16" height="24" rx="7" fill="#ff8a1a" ${S}/>
      <path d="M22 42 Q20 60 40 66" fill="none" stroke="#111" stroke-width="3"/>
      <rect x="34" y="56" width="62" height="54" rx="6" fill="#2f6fd6" ${S}/>
      <rect x="42" y="64" width="46" height="26" rx="3" fill="#bfe3ff" ${s3}/>
      <circle cx="54" cy="77" r="6" fill="#fff" ${s3}/><circle cx="76" cy="77" r="6" fill="#fff" ${s3}/>
      <rect x="42" y="96" width="10" height="7" fill="#ffd23f" ${s3}/><rect x="56" y="96" width="10" height="7" fill="#ffd23f" ${s3}/><rect x="70" y="96" width="10" height="7" fill="#ffd23f" ${s3}/>`,
    handheld: `<rect x="28" y="8" width="64" height="104" rx="8" fill="#cfcfc6" ${S}/>
      <rect x="36" y="16" width="48" height="40" rx="3" fill="#6b6b74" ${s3}/>
      <rect x="42" y="22" width="36" height="28" fill="#9bbc0f" ${s3}/>
      <path d="M48 42 h6 v-6 h6 v6 h6" fill="none" stroke="#306230" stroke-width="3"/>
      <path d="M38 72 h8 v-8 h6 v8 h8 v6 h-8 v8 h-6 v-8 h-8z" fill="#222" ${s3}/>
      <circle cx="74" cy="78" r="5" fill="#a3123f" ${s3}/><circle cx="84" cy="70" r="5" fill="#a3123f" ${s3}/>
      <rect x="48" y="94" width="10" height="4" rx="2" fill="#777"/><rect x="62" y="94" width="10" height="4" rx="2" fill="#777"/>`,
    eggpet: `<path d="M60 10 C92 10 104 52 102 74 C100 100 82 112 60 112 C38 112 20 100 18 74 C16 52 28 10 60 10Z" fill="#a46bff" ${S}/>
      <circle cx="42" cy="28" r="5" fill="#ffe14d"/><circle cx="82" cy="40" r="4" fill="#ffe14d"/><circle cx="30" cy="86" r="4" fill="#ffe14d"/>
      <rect x="38" y="40" width="44" height="38" rx="5" fill="#d6f5c9" ${s3}/>
      <path d="M52 62 q8 -14 16 0 q-8 8 -16 0z" fill="#333"/><circle cx="56" cy="58" r="1.6" fill="#fff"/><circle cx="64" cy="58" r="1.6" fill="#fff"/>
      <circle cx="46" cy="92" r="6" fill="#ffe14d" ${s3}/><circle cx="60" cy="96" r="6" fill="#ffe14d" ${s3}/><circle cx="74" cy="92" r="6" fill="#ffe14d" ${s3}/>
      <rect x="56" y="4" width="8" height="10" rx="3" fill="#ccc" ${s3}/>`,
    pager: `<rect x="16" y="34" width="88" height="52" rx="10" fill="#1d1d26" ${S}/>
      <rect x="26" y="44" width="58" height="22" rx="3" fill="#a8d86e" ${s3}/>
      <text x="55" y="60" font-family="VT323" font-size="15" text-anchor="middle" fill="#213">07734</text>
      <rect x="88" y="44" width="10" height="10" rx="2" fill="#ff4fa3" ${s3}/><rect x="88" y="60" width="10" height="10" rx="2" fill="#2fd8ff" ${s3}/>
      <rect x="30" y="72" width="16" height="6" rx="3" fill="#555"/><rect x="52" y="72" width="16" height="6" rx="3" fill="#555"/>`,
    floppy: `<path d="M14 12 H94 L108 26 V108 H14Z" fill="#2c4fd6" ${S}/>
      <rect x="34" y="12" width="50" height="32" fill="#c9ced8" ${s3}/><rect x="66" y="18" width="10" height="20" fill="#2c4fd6"/>
      <rect x="26" y="60" width="70" height="46" fill="#f3f0e6" ${s3}/>
      <path d="M34 72 H88 M34 82 H88 M34 92 H74" stroke="#9aa" stroke-width="2"/>
      <text x="60" y="70" font-family="Bangers" font-size="9" text-anchor="middle" fill="#c22">GAMES!!</text>`,
    boombox: `<rect x="40" y="10" width="40" height="10" rx="4" fill="none" stroke="#111" stroke-width="5"/>
      <rect x="6" y="20" width="108" height="72" rx="8" fill="#c4c6cc" ${S}/>
      <circle cx="32" cy="58" r="20" fill="#333" ${S}/><circle cx="32" cy="58" r="8" fill="#777"/>
      <circle cx="88" cy="58" r="20" fill="#333" ${S}/><circle cx="88" cy="58" r="8" fill="#777"/>
      <rect x="50" y="34" width="20" height="14" fill="#1b1b22" ${s3}/><rect x="50" y="52" width="20" height="10" fill="#ff4fa3" ${s3}/>
      <rect x="12" y="26" width="30" height="4" fill="#ffe14d"/><rect x="78" y="26" width="30" height="4" fill="#2fd8ff"/>`,
    slap: `<path d="M18 74 C18 30 102 30 102 74" fill="none" stroke="#111" stroke-width="22" stroke-linecap="round"/>
      <path d="M18 74 C18 30 102 30 102 74" fill="none" stroke="#1ee3a1" stroke-width="15" stroke-linecap="round"/>
      <path d="M18 74 C18 30 102 30 102 74" fill="none" stroke="#ff4fa3" stroke-width="15" stroke-dasharray="6 10" stroke-linecap="butt"/>
      <path d="M10 92 L110 92" stroke="#111" stroke-width="18" stroke-linecap="round"/>
      <path d="M10 92 L110 92" stroke="#ffe14d" stroke-width="11" stroke-linecap="round"/>
      <path d="M14 92 L106 92" stroke="#7b3cff" stroke-width="11" stroke-dasharray="4 8"/>`,
    yoyo: `<path d="M60 4 V36" stroke="#111" stroke-width="3"/><circle cx="60" cy="4" r="4" fill="#ff4fa3" ${s3}/>
      <circle cx="60" cy="72" r="40" fill="#ff3b3b" ${S}/><circle cx="60" cy="72" r="26" fill="#ffe14d" ${s3}/>
      <circle cx="60" cy="72" r="10" fill="#111"/><path d="M38 52 Q48 44 58 44" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/>`,
    skate: `<path d="M22 20 H62 Q70 20 72 30 L78 60 Q100 62 104 76 V86 H18 V30 Q18 20 22 20Z" fill="#2fd8ff" ${S}/>
      <path d="M30 34 H64 M30 46 H68 M30 58 H72" stroke="#111" stroke-width="3"/>
      <rect x="16" y="86" width="92" height="8" rx="3" fill="#333" ${s3}/>
      <circle cx="26" cy="104" r="9" fill="#ffe14d" ${s3}/><circle cx="50" cy="104" r="9" fill="#ffe14d" ${s3}/><circle cx="74" cy="104" r="9" fill="#ffe14d" ${s3}/><circle cx="98" cy="104" r="9" fill="#ffe14d" ${s3}/>`,
    lava: `<path d="M44 14 H76 L92 86 H28Z" fill="#7b3cff" ${S}/>
      <path d="M48 22 H72 L86 82 H34Z" fill="#ffb23f" opacity=".95"/>
      <ellipse cx="58" cy="38" rx="8" ry="10" fill="#ff3b6b"/><ellipse cx="66" cy="62" rx="11" ry="9" fill="#ff3b6b"/><ellipse cx="50" cy="76" rx="12" ry="5" fill="#ff3b6b"/>
      <path d="M28 86 H92 L100 112 H20Z" fill="#c4c6cc" ${S}/><path d="M40 6 H80 L76 14 H44Z" fill="#c4c6cc" ${S}/>`,
    pogs: `<ellipse cx="62" cy="96" rx="44" ry="12" fill="#888" ${S}/>
      <ellipse cx="62" cy="88" rx="44" ry="12" fill="#ffe14d" ${S}/><ellipse cx="62" cy="80" rx="44" ry="12" fill="#2fd8ff" ${S}/>
      <ellipse cx="62" cy="72" rx="44" ry="12" fill="#ff4fa3" ${S}/>
      <path d="M44 72 L62 64 L80 72 L62 80Z" fill="#fff" ${s3}/>
      <circle cx="40" cy="30" r="22" fill="#222" ${S}/><circle cx="40" cy="30" r="13" fill="#d4d4d4" ${s3}/>
      <path d="M33 25 L47 35 M47 25 L33 35" stroke="#111" stroke-width="4"/>`,
    brick: `<rect x="40" y="2" width="8" height="26" rx="3" fill="#333" ${s3}/>
      <rect x="32" y="22" width="48" height="94" rx="8" fill="#3b3b42" ${S}/>
      <rect x="40" y="32" width="32" height="18" rx="2" fill="#9fdc6e" ${s3}/>
      ${[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => `<rect x="${40 + c * 12}" y="${58 + r * 12}" width="8" height="7" rx="2" fill="#ddd"/>`).join("")).join("")}`,
    cd: `<circle cx="60" cy="60" r="50" fill="#e8ecf4" ${S}/>
      <path d="M60 10 A50 50 0 0 1 110 60 L84 60 A24 24 0 0 0 60 36Z" fill="#ff9be0" opacity=".7"/>
      <path d="M10 60 A50 50 0 0 0 60 110 L60 84 A24 24 0 0 1 36 60Z" fill="#8be9ff" opacity=".7"/>
      <path d="M60 110 A50 50 0 0 0 110 60 L84 60 A24 24 0 0 1 60 84Z" fill="#fff59b" opacity=".7"/>
      <circle cx="60" cy="60" r="14" fill="#fff" ${s3}/><circle cx="60" cy="60" r="6" fill="#1a0b2e" ${s3}/>`,
    scrunchie: `<circle cx="60" cy="60" r="38" fill="none" stroke="#111" stroke-width="30"/>
      <circle cx="60" cy="60" r="38" fill="none" stroke="#ff4fa3" stroke-width="24"/>
      ${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<path d="M${60 + Math.cos(a) * 26} ${60 + Math.sin(a) * 26} L${60 + Math.cos(a) * 50} ${60 + Math.sin(a) * 50}" stroke="#b5246b" stroke-width="3"/>`; }).join("")}
      <circle cx="60" cy="60" r="38" fill="none" stroke="#ffd0e8" stroke-width="5" stroke-dasharray="3 9"/>`,
    tv: `<path d="M40 22 L28 2 M80 22 L92 2" stroke="#111" stroke-width="4"/>
      <rect x="8" y="22" width="104" height="80" rx="12" fill="#8a5a33" ${S}/>
      <rect x="18" y="32" width="68" height="60" rx="14" fill="#3c4b5c" ${s3}/>
      <path d="M26 44 h52 M26 56 h52 M26 68 h52 M26 80 h52" stroke="#5f7a92" stroke-width="3"/>
      <circle cx="99" cy="44" r="6" fill="#ddd" ${s3}/><circle cx="99" cy="62" r="6" fill="#ddd" ${s3}/>
      <rect x="20" y="102" width="12" height="8" fill="#333"/><rect x="88" y="102" width="12" height="8" fill="#333"/>`,
    butterfly: `<path d="M60 60 C40 20 8 28 16 52 C22 70 48 66 60 60Z" fill="#7be0ff" ${S}/>
      <path d="M60 60 C80 20 112 28 104 52 C98 70 72 66 60 60Z" fill="#7be0ff" ${S}/>
      <path d="M60 62 C44 74 26 96 42 100 C54 102 58 80 60 62Z" fill="#ff8be0" ${S}/>
      <path d="M60 62 C76 74 94 96 78 100 C66 102 62 80 60 62Z" fill="#ff8be0" ${S}/>
      <rect x="56" y="40" width="8" height="64" rx="4" fill="#fff" ${s3}/>
      <circle cx="34" cy="48" r="4" fill="#fff" opacity=".8"/><circle cx="86" cy="48" r="4" fill="#fff" opacity=".8"/>`,
    gamepad: `<path d="M20 44 H100 Q114 44 114 60 Q114 92 96 92 Q86 92 78 78 H42 Q34 92 24 92 Q6 92 6 60 Q6 44 20 44Z" fill="#c9c9d6" ${S}/>
      <path d="M22 60 h8 v-8 h6 v8 h8 v6 h-8 v8 h-6 v-8 h-8z" fill="#333"/>
      <circle cx="84" cy="56" r="5" fill="#2f6fd6" ${s3}/><circle cx="94" cy="64" r="5" fill="#d33" ${s3}/><circle cx="74" cy="64" r="5" fill="#ffe14d" ${s3}/><circle cx="84" cy="72" r="5" fill="#2bb04a" ${s3}/>
      <rect x="50" y="60" width="8" height="4" rx="2" fill="#555"/><rect x="62" y="60" width="8" height="4" rx="2" fill="#555"/>`,
  };
  // the round's questions about the drawings
  const LIST = [
    { k: "cassette", a: "Cassette tape", w: ["VHS tape", "MiniDisc", "8-track"], fact: "Mixtapes were how you told someone you liked them." },
    { k: "vhs", a: "VHS tape", w: ["Laserdisc", "Cassette tape", "MiniDisc"], fact: "Video shops fined you if you didn't rewind." },
    { k: "walkman", a: "Personal cassette player", w: ["Discman", "Pager", "Boombox"], fact: "Sony's Walkman made music portable from 1979." },
    { k: "handheld", a: "Game Boy", w: ["Game Gear", "Atari Lynx", "Tamagotchi"], fact: "The Game Boy sold over 100 million units with its Color sibling." },
    { k: "eggpet", a: "Tamagotchi", w: ["Furby", "Pager", "Digital watch"], fact: "Tamagotchis were banned at loads of schools." },
    { k: "pager", a: "Pager", w: ["Calculator", "Game Boy", "Walkie-talkie"], fact: "Type 07734 on a calculator and flip it over. That's hELLO." },
    { k: "floppy", a: "Floppy disk", w: ["CD-ROM", "Zip disk", "MiniDisc"], fact: "A 3.5-inch floppy held 1.44 MB. About one photo today." },
    { k: "boombox", a: "Boombox", w: ["Jukebox", "Amplifier", "Car stereo"], fact: "Big enough to need its own handle." },
    { k: "slap", a: "Slap bracelet", w: ["Scrunchie", "Friendship band", "Sweatband"], fact: "Snap it on your wrist. Some schools banned them." },
    { k: "yoyo", a: "Yo-yo", w: ["Spinning top", "Pog", "Frisbee"], fact: "Walk the dog, around the world, rock the baby." },
    { k: "skate", a: "Inline skates", w: ["Roller skates", "Moon Shoes", "Heelys"], fact: "Everyone called them Rollerblades, after the brand." },
    { k: "lava", a: "Lava lamp", w: ["Plasma ball", "Glow stick", "Night light"], fact: "Invented in the 60s, back in every bedroom in the 90s." },
    { k: "pogs", a: "Pogs", w: ["Tiddlywinks", "Poker chips", "Coasters"], fact: "Throw the slammer, keep whatever lands face up." },
    { k: "brick", a: "Brick mobile phone", w: ["Walkie-talkie", "Cordless phone", "TV remote"], fact: "Zack Morris had one before anyone else." },
    { k: "cd", a: "Compact disc", w: ["Laserdisc", "Floppy disk", "Vinyl single"], fact: "CDs outsold cassettes for the first time in the early 90s." },
    { k: "scrunchie", a: "Scrunchie", w: ["Slap bracelet", "Sweatband", "Hair clip"], fact: "A fabric-covered hair tie, in every colour going." },
    { k: "tv", a: "TV with rabbit-ear aerial", w: ["Microwave", "Radio", "Fish tank"], fact: "Wiggle the aerial to fix the picture." },
    { k: "butterfly", a: "Butterfly clip", w: ["Hair scrunchie", "Brooch", "Bobby pin"], fact: "Ten of them in your hair at once was normal." },
    { k: "gamepad", a: "Super Nintendo controller", w: ["Mega Drive controller", "PlayStation controller", "N64 controller"], fact: "It had four coloured face buttons and two shoulder buttons." },
  ];
  const svg = (k, cls = "") => `<svg class="pic ${cls}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">${ART[k] || ""}</svg>`;
  Bank.art(LIST.map((d) => ({ ...d, c: "toys" })));
  return { svg, ART, LIST };
})();
