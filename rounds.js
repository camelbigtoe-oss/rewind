// Round types. make() builds a question of a type; ask() shows it in a host element and resolves
// with the result once the player answers (or time runs out).
//   result: { ok, pts, ms, skip, perk, guess }
const Rounds = (() => {
  "use strict";
  const { esc, shuffle, sleep } = Core;
  const TYPES = {
    mc: { ch: 4, name: "THE BIG FOUR", blurb: "Four answers, one is right. The faster you lock in, the more you score.", time: 15, icon: "④" },
    tf: { ch: 7, name: "TOTALLY... NOT!", blurb: "Is it true? Hit TOTALLY. Is it rubbish? Hit NOT!", time: 9, icon: "✔✘" },
    year: { ch: 12, name: "WHAT YEAR?", blurb: "Dial in the year it happened. Exact scores big, close still counts.", time: 20, icon: "📅" },
    order: { ch: 19, name: "BE KIND, REWIND", blurb: "Tap the four things from OLDEST to NEWEST.", time: 30, icon: "⏪" },
    pic: { ch: 24, name: "PICTURE THIS", blurb: "The picture slowly comes into focus. Guess early for bonus points.", time: 15, icon: "🖼️" },
    quote: { ch: 33, name: "WHO SAID THAT?", blurb: "A famous line. Who said it, or what's it from?", time: 15, icon: "💬" },
    odd: { ch: 42, name: "ODD ONE OUT", blurb: "Three belong together. Find the one that doesn't.", time: 15, icon: "🙃" },
    type: { ch: 56, name: "SPELL IT OUT", blurb: "No options here. Type the answer. Small typos are forgiven. Buy a letter if you're stuck.", time: 25, icon: "⌨️" },
    blitz: { ch: 99, name: "BUZZER BLITZ", blurb: "45 seconds on the clock. Answer as many as you can. Streaks multiply your score.", time: 45, icon: "⚡" },
  };
  const SHOWS = ["mc", "tf", "year", "order", "pic", "quote", "odd", "type"];

  // ---------- making questions ----------
  function make(type, o = {}) {
    const { rnd = Math.random } = o;
    switch (type) {
      case "tf": { const it = Bank.draw("tf", o); return { ...it, type, opts: ["TOTALLY", "NOT!"], ans: it.truth ? 0 : 1 }; }
      case "year": { const it = Bank.draw("year", o); return { ...it, type }; }
      case "order": { const set = Bank.orderSet(rnd, o.cat); return { id: "ord-" + set.map((s) => s.id).join(""), type, c: set[0].c, items: shuffle(set.slice(), rnd), q: "Oldest to newest" }; }
      case "type": { const it = Bank.draw("mc", { ...o, filter: Bank.typable }); return { ...it, type }; }
      case "quote": case "odd": case "pic": { const it = Bank.draw(type, o); return { ...it, type, ...Bank.opts(it, 4, rnd) }; }
      case "blitz": { const it = Bank.draw("mc", o); return { ...it, type: "mc", blitz: true, ...Bank.opts(it, 3, rnd) }; }
      default: { const it = Bank.draw("mc", o); return { ...it, type: "mc", ...Bank.opts(it, 4, rnd) }; }
    }
  }

  // ---------- scoring ----------
  const yearPts = (d) => [100, 70, 45, 25, 10, 10][d] ?? 0;

  // ---------- asking ----------
  // opts: { time, deadline, quick, perk:{id,left}, onPerk(id), stats, mult, label, vj:{name,spec,at,ok,pick}, noPerks }
  function ask(host, q, opts = {}) {
    return new Promise((resolve) => {
      const T = TYPES[q.blitz ? "blitz" : q.type] || TYPES.mc;
      const total = (opts.time ?? T.time) * 1000;
      const start = performance.now();
      const deadline = opts.deadline || start + total;
      const span = opts.deadline ? (opts.span || total) : total;
      let done = false, frozen = false, frozenLeft = 0, armedRewind = false, spoiled = false, doubled = false, bought = 0, perkUsed = null, raf = 0, lastTick = 99;
      const isOpt = ["mc", "quote", "odd", "pic", "tf"].includes(q.type);
      const cat = Bank.ICON[q.c] + " " + Bank.NAMES[q.c];

      // ----- body for each type -----
      let body = "";
      if (q.type === "pic") {
        const pic = q.art ? Pics.svg(q.art) : `<div class="emoji">${esc(q.emoji)}</div>`;
        body = `<div class="qtext small">${q.art ? "What is this 90s thing?" : "Name the " + ({ movies: "movie", tv: "TV show", toons: "cartoon", music: "song or act", toys: "toy or game", oz: "Kiwi or Aussie classic" }[q.c] || "thing")}</div><div class="picbox"><div class="blur">${pic}</div></div>`;
      } else if (q.type === "quote") body = `<div class="quote"><span>“</span>${esc(q.q)}<span>”</span></div><div class="qtext small">Who said it, or where's it from?</div>`;
      else if (q.type === "tf") body = `<div class="qtext tf">${esc(q.q)}</div>`;
      else if (q.type === "order") body = `<div class="qtext small">Tap from <b>OLDEST</b> to <b>NEWEST</b></div>`;
      else body = `<div class="qtext">${esc(q.q)}</div>`;

      let ctrl = "";
      if (isOpt) {
        if (q.type === "tf") ctrl = `<div class="opts tfopts"><button class="opt tfy" data-i="0">TOTALLY</button><button class="opt tfn" data-i="1">NOT!</button></div>`;
        else ctrl = `<div class="opts n${q.opts.length}">${q.opts.map((o, i) => `<button class="opt" data-i="${i}"><kbd>${"ABCD"[i]}</kbd><span>${esc(o)}</span></button>`).join("")}</div>`;
      } else if (q.type === "year") {
        ctrl = `<div class="dial"><button class="yb" data-d="-10">«</button><button class="yb" data-d="-1">‹</button><div class="ydisp"><b id="yv">1990</b></div><button class="yb" data-d="1">›</button><button class="yb" data-d="10">»</button></div>
          <input type="range" id="yr" min="1980" max="2000" value="1990" aria-label="year"><button class="go big" id="lock">LOCK IN</button>`;
      } else if (q.type === "order") {
        ctrl = `<div class="ordr">${q.items.map((it, i) => `<button class="ocard" data-i="${i}"><em></em><span>${esc(it.q)}</span><small class="oy"></small></button>`).join("")}</div><button class="go big" id="lock" disabled>LOCK IN</button>`;
      } else if (q.type === "type") {
        const hint = q.a.split("").map((ch) => (/[a-z0-9]/i.test(ch) ? "_" : ch === " " ? " " : ch)).join("");
        ctrl = `<div class="hint" id="hint">${esc(hint).replace(/ /g, "&nbsp;&nbsp;")}</div><form class="typeform" id="tform" autocomplete="off"><input id="tin" type="text" placeholder="Type your answer..." autocapitalize="off" spellcheck="false" enterkeyhint="go"><button class="go">GO</button></form><button class="mini" id="buy">BUY A LETTER (−25)</button>`;
      }

      const perk = opts.perk && opts.perk.left > 0 && !opts.noPerks ? Cast.PERKS[opts.perk.id] : null;
      const perkOK = perk && perkApplies(opts.perk.id, q);
      const vj = opts.vj;
      host.innerHTML = `<div class="qcard t-${q.type}${q.blitz ? " t-blitz" : ""}">
        <div class="qhead"><span class="chan">${opts.label || "CH " + String(T.ch).padStart(2, "0")}</span><span class="qcat">${cat}</span>${opts.mult > 1 ? `<span class="mult">×${opts.mult}</span>` : ""}</div>
        <div class="timer"><i></i><b></b></div>
        ${vj ? `<div class="vjbuzz" id="vjb">${Avatar.svg(vj.spec, { anim: false, cls: "tiny" })}<span>${esc(vj.name)} is thinking…</span></div>` : ""}
        <div class="qbody">${body}</div>
        ${ctrl}
        <div class="perkbar">${perk && perkOK && opts.perk.id !== "local" ? `<button class="perk" id="perk">${perk.icon} ${perk.name} <small>×${opts.perk.left}</small></button>` : ""}<div class="note" id="note"></div></div>
        <div class="fact" id="fact"></div>
      </div>`;
      const $ = (s) => host.querySelector(s), $$ = (s) => [...host.querySelectorAll(s)];
      const bar = $(".timer i"), num = $(".timer b"), note = (h) => { $("#note").innerHTML = h; };

      // hunch: a strong channel stat sometimes crosses off a wrong option
      if (isOpt && q.type !== "tf" && opts.stats && Math.random() < (opts.stats[q.c] || 0) / 420) {
        const wrong = q.opts.map((_, i) => i).filter((i) => i !== q.ans);
        const k = wrong[Math.floor(Math.random() * wrong.length)];
        $$(".opt")[k].classList.add("struck"); $$(".opt")[k].disabled = true;
        note(`🧠 Your ${Bank.SHORT[q.c]} sense crossed one off.`);
      }
      // Sheila's local knowledge
      if (opts.perk?.id === "local" && q.c === "oz" && isOpt) { $$(".opt")[q.ans].classList.add("hinted"); note("🥝 Local knowledge! Sheila knows this one."); }

      // ----- timer -----
      function left() { return frozen ? frozenLeft : deadline - performance.now(); }
      const card0 = host.querySelector(".qcard");
      function draw() {
        if (done) return;
        if (!card0.isConnected) { done = true; return; } // game quit: the card was removed
        const l = Math.max(0, left());
        bar.style.transform = `scaleX(${l / span})`;
        const s = Math.ceil(l / 1000); num.textContent = s;
        host.querySelector(".timer").classList.toggle("low", l < 5000);
        if (s <= 5 && s < lastTick && s > 0) { lastTick = s; Sound.play("tick"); }
        if (q.type === "pic") { const f = 1 - l / total; $(".blur").style.filter = `blur(${Math.max(0, 22 - f * 34).toFixed(1)}px)`; }
        if (vj && !vj.shown && performance.now() - start >= vj.at) { vj.shown = true; const b = $("#vjb"); b.classList.add("in"); b.querySelector("span").textContent = `${vj.name} LOCKED IN!`; Sound.play("vj"); }
        if (l <= 0) return finish(null);
        raf = requestAnimationFrame(draw);
      }
      raf = requestAnimationFrame(draw);

      // ----- perks -----
      const pbtn = $("#perk");
      if (pbtn) pbtn.onclick = () => {
        if (done || perkUsed) return;
        perkUsed = opts.perk.id; pbtn.disabled = true; pbtn.classList.add("used"); opts.onPerk && opts.onPerk(perkUsed); Sound.play("coin");
        const id = perkUsed;
        if (id === "fifty") { const wrong = shuffle(q.opts.map((_, i) => i).filter((i) => i !== q.ans && !$$(".opt")[i].disabled)).slice(0, 2); wrong.forEach((i) => { $$(".opt")[i].classList.add("struck"); $$(".opt")[i].disabled = true; }); note("💿 Scratched!"); }
        if (id === "poll") pollBars();
        if (id === "freeze") { frozenLeft = left(); frozen = true; host.querySelector(".timer").classList.add("frozen"); note("⏸️ Clock paused."); }
        if (id === "rewind") { armedRewind = true; note("⏪ Rewind armed: one wrong answer is forgiven."); }
        if (id === "spoiler") { spoiled = true; spoil(); }
        if (id === "double") { doubled = true; note("💰 Double points!"); }
        if (id === "skip") { done = true; cancelAnimationFrame(raf); Sound.play("static", 0.3); resolve({ skip: true, perk: id }); }
      };
      function pollBars() {
        const n = q.opts.length, w = new Array(n).fill(0);
        const right = q.type === "tf" ? 0.62 + Math.random() * 0.25 : 0.42 + Math.random() * 0.36;
        w[q.ans] = right; let rest = 1 - right;
        const others = q.opts.map((_, i) => i).filter((i) => i !== q.ans);
        others.forEach((i, k) => { const v = k === others.length - 1 ? rest : rest * Math.random(); w[i] = v; rest -= v; });
        $$(".opt").forEach((b, i) => { b.style.setProperty("--poll", Math.round(w[i] * 100) + "%"); b.classList.add("polled"); b.dataset.poll = Math.round(w[i] * 100) + "%"; });
        note("📊 The studio audience has voted.");
      }
      function spoil() {
        if (isOpt) $$(".opt")[q.ans].classList.add("hinted");
        if (q.type === "year") note(`🙊 Moxie whispers: "It was ${q.y}, honey."`);
        if (q.type === "type") note(`🙊 Moxie whispers: "${esc(q.a)}"`);
        if (q.type === "order") note(`🙊 Moxie whispers: "${[...q.items].sort((a, b) => a.y - b.y).map((it) => it.y).join(", ")}"`);
        if (isOpt) note("🙊 Moxie spoiled it. Half points.");
      }

      // ----- finishing -----
      function finish(guess) {
        if (done || !card0.isConnected) return;
        const ms = Math.round(performance.now() - start);
        const fr = Math.max(0, Math.min(1, left() / span));
        let ok = false, pts = 0, partial = 0;
        if (isOpt) { ok = guess === q.ans; if (ok) pts = 100 + Math.round((q.type === "pic" ? 80 : 50) * fr); }
        else if (q.type === "year") { const d = guess == null ? 99 : Math.abs(guess - q.y); pts = yearPts(d) + (d === 0 ? Math.round(25 * fr) : 0); ok = d <= 2; partial = d; }
        else if (q.type === "order") { const right = guess ? guess.filter((it, i) => it.y === [...q.items].sort((a, b) => a.y - b.y)[i].y).length : 0; partial = right; ok = right === 4; pts = right * 25 + (ok ? 50 + Math.round(50 * fr) : 0); }
        else if (q.type === "type") { ok = guess != null && Bank.matches(guess, q); if (ok) pts = Math.max(30, 120 + Math.round(60 * fr) - bought * 25); }
        // rewind: one wrong answer is forgiven
        if (!ok && armedRewind && guess != null && left() > 0) {
          armedRewind = false; Sound.play("rewind"); note("⏪ REWIND! Try again.");
          if (isOpt) { const b = $$(".opt")[guess]; b.classList.add("struck"); b.disabled = true; }
          if (q.type === "type") { $("#tin").value = ""; $("#tin").focus(); }
          if (q.type === "order") resetOrder();
          host.querySelector(".qcard").classList.add("rewound"); setTimeout(() => host.querySelector(".qcard")?.classList.remove("rewound"), 600);
          return;
        }
        done = true; cancelAnimationFrame(raf);
        if (spoiled) pts = Math.round(pts / 2);
        if (doubled) pts *= 2;
        if (opts.mult > 1) pts = Math.round(pts * opts.mult);
        reveal(guess, ok, partial);
        Sound.play(ok ? "right" : "wrong");
        const res = { ok, pts, ms, guess, perk: perkUsed, partial };
        sleep(opts.quick ? 520 : q.type === "order" || q.fact || q.why ? 2300 : 1500).then(() => resolve(res));
      }
      function reveal(guess, ok, partial) {
        const card = host.querySelector(".qcard"); card.classList.add(ok ? "is-right" : "is-wrong");
        $$("button").forEach((b) => (b.disabled = true));
        if (isOpt) { $$(".opt")[q.ans].classList.add("right"); if (guess != null && guess !== q.ans) $$(".opt")[guess].classList.add("wrong"); }
        if (q.type === "year") { $("#yv").textContent = q.y; $(".ydisp").classList.add(ok ? "right" : "wrong"); note(guess == null ? `It was ${q.y}.` : partial === 0 ? "EXACT! 🎯" : `You said ${guess}. ${partial === 1 ? "So close!" : partial <= 3 ? "Close-ish." : "Not quite."}`); }
        if (q.type === "order") {
          const sorted = [...q.items].sort((a, b) => a.y - b.y);
          $$(".ocard").forEach((b) => { const it = q.items[+b.dataset.i]; const pos = sorted.indexOf(it); b.querySelector("em").textContent = pos + 1; b.querySelector(".oy").textContent = it.y; b.style.order = pos; b.classList.add(guess && guess[pos] === it ? "right" : "wrong"); });
          note(`${partial}/4 in the right spot.`);
        }
        if (q.type === "type") { $("#hint").innerHTML = esc(q.a); $("#hint").classList.add(ok ? "right" : "wrong"); if (!ok) note(guess ? `You typed "${esc(guess)}".` : "Time's up!"); }
        if (q.type === "pic") $(".blur").style.filter = "none";
        const fact = q.fact || q.why;
        if (fact) $("#fact").innerHTML = `<b>${q.type === "tf" ? (q.truth ? "TOTALLY TRUE." : "NOT TRUE.") : "📼"}</b> ${esc(fact)}`;
        if (vj) {
          const b = $("#vjb"); b.classList.add("in", vj.ok ? "vjr" : "vjw");
          const said = vj.pick == null ? "ran out of time" : q.type === "year" ? `said ${vj.pick}` : `said ${esc(q.opts[vj.pick])}`;
          b.querySelector("span").textContent = `${vj.name} ${said} ${vj.ok ? "✔" : "✘"}${vj.pick != null ? ` (${(vj.at / 1000).toFixed(1)}s)` : ""}`;
        }
        if (ok && !opts.quick) FX.confetti(26, host.querySelector(".qcard"));
      }

      // ----- inputs -----
      if (isOpt) $$(".opt").forEach((b) => (b.onclick = () => { Sound.play("click"); finish(+b.dataset.i); }));
      if (q.type === "year") {
        const yv = $("#yv"), yr = $("#yr");
        const setY = (v) => { v = Math.max(1980, Math.min(2000, v)); yr.value = v; yv.textContent = v; Sound.play("tick"); };
        $$(".yb").forEach((b) => (b.onclick = () => setY(+yr.value + +b.dataset.d)));
        yr.oninput = () => { yv.textContent = yr.value; };
        $("#lock").onclick = () => finish(+yr.value);
      }
      let pickOrder = [];
      function resetOrder() { pickOrder = []; $$(".ocard").forEach((b) => { b.classList.remove("on"); b.querySelector("em").textContent = ""; }); $("#lock").disabled = true; }
      if (q.type === "order") {
        $$(".ocard").forEach((b) => (b.onclick = () => {
          const it = q.items[+b.dataset.i], k = pickOrder.indexOf(it);
          if (k >= 0) pickOrder.splice(k, 1); else pickOrder.push(it);
          $$(".ocard").forEach((c) => { const j = pickOrder.indexOf(q.items[+c.dataset.i]); c.classList.toggle("on", j >= 0); c.querySelector("em").textContent = j >= 0 ? j + 1 : ""; });
          $("#lock").disabled = pickOrder.length < 4; Sound.play("click");
        }));
        $("#lock").onclick = () => finish(pickOrder.slice());
      }
      if (q.type === "type") {
        const tin = $("#tin");
        setTimeout(() => tin.focus(), 50);
        $("#tform").onsubmit = (e) => { e.preventDefault(); if (tin.value.trim()) finish(tin.value.trim()); };
        $("#buy").onclick = () => {
          const letters = q.a.split(""), shown = $("#hint").dataset.shown ? $("#hint").dataset.shown.split(",").map(Number) : [];
          const can = letters.map((ch, i) => i).filter((i) => /[a-z0-9]/i.test(letters[i]) && !shown.includes(i));
          if (can.length <= 1) return;
          const pickI = shown.length === 0 ? can[0] : can[Math.floor(Math.random() * can.length)];
          shown.push(pickI); bought++; $("#hint").dataset.shown = shown.join(",");
          $("#hint").innerHTML = esc(letters.map((ch, i) => (shown.includes(i) ? ch : /[a-z0-9]/i.test(ch) ? "_" : ch)).join("")).replace(/ /g, "&nbsp;&nbsp;");
          Sound.play("coin"); tin.focus();
        };
      }
      const key = (e) => {
        if (done) return document.removeEventListener("keydown", key);
        if (isOpt) { const i = "abcd".indexOf(e.key.toLowerCase()); const j = "1234".indexOf(e.key); const k = i >= 0 ? i : j; if (k >= 0 && k < q.opts.length && !$$(".opt")[k].disabled && document.activeElement?.tagName !== "INPUT") finish(k); }
        if (q.type === "tf") { if (e.key.toLowerCase() === "t") finish(0); if (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "n") finish(1); }
      };
      document.addEventListener("keydown", key);
    });
  }
  function perkApplies(id, q) {
    const opt = ["mc", "quote", "odd", "pic"].includes(q.type);
    switch (id) {
      case "fifty": return opt;
      case "poll": return opt || q.type === "tf";
      case "local": return true;
      default: return true;
    }
  }

  // the ident card shown before each show
  function ident(host, type, extra = "") {
    const T = TYPES[type];
    return new Promise((resolve) => {
      host.innerHTML = `<div class="ident t-${type}"><div class="ich">CH<b>${String(T.ch).padStart(2, "0")}</b></div><div class="iicon">${T.icon}</div><h2 class="iname" data-text="${esc(T.name)}">${esc(T.name)}</h2><p>${esc(T.blurb)}</p>${extra}<button class="go big" id="iplay">▶ PLAY</button></div>`;
      document.getElementById("osd-r").textContent = "CH " + String(T.ch).padStart(2, "0");
      host.querySelector("#iplay").onclick = () => { Sound.play("click"); resolve(); };
    });
  }

  return { TYPES, SHOWS, make, ask, ident, yearPts };
})();
