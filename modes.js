// Game modes. Each runs inside #app using Rounds for the questions and hands the rewards to UI.after().
//   Modes.episode(players, cohost)   PRIME TIME: 5 shows of different round styles + Buzzer Blitz finale
//   Modes.war(vjId)                  RATINGS WAR: tug-of-war against a rival VJ, beat them to recruit them
//   Modes.daily()                    DAILY BROADCAST: the same 10 questions for everyone today
//   Modes.marathon()                 MARATHON: endless, three tapes (lives)
//   Modes.surf(cat, type)            CHANNEL SURF: practice one channel or one round style
const Modes = (() => {
  "use strict";
  const { $, esc, shuffle, sleep, pick } = Core;
  const app = () => $("#app");
  let quitFlag = false;
  const ADS = [
    "ZAPPO POPS: the cereal that zaps back!", "MEGA-GEL: hair so stiff it stops bullets.", "Call 0800-NOT-REAL now. Operators are standing by.",
    "TUBE SOCKS: now in 3 lengths of tube.", "Can't sleep? Watch more TV.", "SLAMMERZ caps: collect 'em, slam 'em, lose 'em to your cousin.",
    "FIZZ-WHIZ: it's like soda, but louder.", "BEEP-BEEP pagers: be reachable. Sort of.", "This ad break is brought to you by your parents' credit card.",
    "Don't forget: be kind, rewind.", "VIDEO EZY-ish: late fees are a lifestyle.", "TAMA-NOT-CHI: the pet that can't die. Mostly.",
  ];

  // ---------- shared bits ----------
  function frame(players, active, extra = "") {
    app().innerHTML = `<div class="game">
      <div class="hud">${players.map((p, i) => `<div class="hp ${i === active ? "on" : ""}" data-i="${i}">${Avatar.svg(p.av, { anim: false, cls: "tiny", bg: true })}<div><b>${esc(p.name)}</b><span class="sc" id="sc${i}">${p.score ?? 0}</span></div><i class="stk" id="stk${i}"></i></div>`).join("")}
        <button class="quit" id="quit" aria-label="Quit">✕</button></div>
      ${extra}
      <div class="stage" id="stage"></div></div>`;
    $("#quit").onclick = () => { if (confirm("Quit this game? Progress in this game is lost.")) { quitFlag = true; UI.home(); } };
  }
  function score(i, v, diff) {
    const el = $("#sc" + i); if (!el) return;
    el.textContent = v;
    if (diff > 0) { const f = document.createElement("em"); f.className = "plus"; f.textContent = "+" + diff; el.parentElement.appendChild(f); setTimeout(() => f.remove(), 1100); }
  }
  function streakBadge(i, s) { const el = $("#stk" + i); if (el) { el.textContent = s >= 3 ? `🔥${s}` : ""; el.className = "stk" + (s >= 5 ? " hot" : ""); } }
  const multFor = (s) => (s >= 5 ? 2 : s >= 3 ? 1.5 : 1);
  const stage = () => $("#stage");
  function checkQuit() { if (quitFlag) { quitFlag = false; throw new Error("quit"); } }
  function guard(fn) { return async (...a) => { quitFlag = false; try { return await fn(...a); } catch (e) { if (e.message !== "quit") { console.error(e); UI.toast("Something glitched. Back to the guide."); UI.home(); } } }; }

  // a full question with the shared bookkeeping; returns the result
  async function one(pl, i, q, o = {}) {
    checkQuit();
    const p = pl.prof;
    const r = await Rounds.ask(stage(), q, { stats: p.stats, mult: multFor(pl.streak), ...o });
    checkQuit();
    if (r.skip) return r;
    pl.asked++; if (r.ok) pl.right++;
    pl.xp += RPG.answer(p, q, r.ok, r.ms);
    if (r.ok) pl.streak++; else pl.streak = 0;
    pl.bestRun = Math.max(pl.bestRun || 0, pl.streak);
    const before = pl.score; pl.score += r.pts; score(i, pl.score, r.pts); streakBadge(i, pl.streak);
    if (q.type === "year" && r.partial === 0 && r.guess != null) RPG.bump(p, "exact");
    if (q.type === "order" && r.ok) RPG.bump(p, "orders");
    if (r.perk) RPG.bump(p, "perks");
    return r;
  }

  // ---------- PRIME TIME ----------
  const episode = guard(async (profiles, cohost) => {
    const party = profiles.length > 1;
    const players = profiles.map((p) => ({ prof: p, name: p.name, av: p.av, score: 0, streak: 0, asked: 0, right: 0, xp: 0, perfect: 0 }));
    const perk = !party && cohost ? { id: Cast.VJ[cohost].perk, left: RPG.perkUses(profiles[0], cohost) } : null;
    const shows = shuffle(Rounds.SHOWS.slice()).slice(0, 5);
    const avoid = new Set();
    Sound.want("game");
    frame(players, 0);
    for (let s = 0; s < shows.length; s++) {
      const type = shows[s];
      await FX.burst(); checkQuit();
      await Rounds.ident(stage(), type, `<div class="showno">SHOW ${s + 1} OF 6</div>${perk ? `<div class="cohost">${Avatar.svg(Cast.VJ[cohost].spec, { anim: false, cls: "tiny" })} Co-host: <b>${esc(Cast.VJ[cohost].name)}</b> · ${Cast.PERKS[perk.id].icon} ${Cast.PERKS[perk.id].name} ×${perk.left}</div>` : ""}`);
      checkQuit();
      const per = party ? 2 * players.length : 5;
      const rightAtStart = players.map((pl) => pl.right);
      for (let n = 0; n < per; n++) {
        const i = party ? n % players.length : 0;
        if (party) { await passTo(players, i); }
        markActive(i);
        let q = Rounds.make(type, { avoid });
        let r = await one(players[i], i, q, { perk, label: `CH ${String(Rounds.TYPES[type].ch).padStart(2, "0")} · ${n + 1}/${per}`, onPerk: () => perk.left-- });
        while (r.skip) { q = Rounds.make(type, { avoid }); r = await one(players[i], i, q, { perk, label: `CH ${String(Rounds.TYPES[type].ch).padStart(2, "0")} · ${n + 1}/${per}`, onPerk: () => perk.left-- }); }
      }
      players.forEach((pl, i) => { if (pl.right - rightAtStart[i] === per / (party ? players.length : 1)) { pl.perfect++; } });
      await adBreak(players, s + 1);
    }
    // finale
    await FX.burst(); checkQuit();
    await Rounds.ident(stage(), "blitz", `<div class="showno">THE FINALE</div>${party ? "<p>Each player gets 30 seconds.</p>" : ""}`);
    for (let i = 0; i < players.length; i++) {
      if (party) await passTo(players, i);
      markActive(i);
      const got = await blitz(players[i], i, party ? 30 : 45, avoid);
      RPG.best(players[i].prof, "blitzBest", got);
    }
    // wrap up
    const results = players.map((pl) => {
      const p = pl.prof, frac = pl.asked ? pl.right / pl.asked : 0, st = RPG.stars(frac);
      RPG.bump(p, "episodes"); if (st === 5) RPG.bump(p, "fiveStars"); if (pl.perfect) RPG.bump(p, "perfectShows", pl.perfect); if (party) RPG.bump(p, "party");
      const xp = pl.xp + 40 + st * 20;
      const packs = 1 + (st >= 4 ? 1 : 0);
      p.packs += packs;
      RPG.best(p, "bestEpisode", pl.score);
      if (cohost && !party) RPG.coXP(p, cohost, 10 + st * 5);
      return { pl, st, xp, packs, frac };
    });
    Core.save();
    await showRatings(results, party);
    UI.after(results.map((r) => ({ p: r.pl.prof, xp: r.xp, packs: r.packs })));
  });
  function markActive(i) { document.querySelectorAll(".hp").forEach((el) => el.classList.toggle("on", +el.dataset.i === i)); }
  async function passTo(players, i) {
    if (players.length < 2) return;
    const pl = players[i];
    return new Promise((res) => {
      stage().innerHTML = `<div class="pass">${Avatar.svg(pl.av, { expr: "happy" })}<h2>Pass to <b>${esc(pl.name)}</b></h2><button class="go big" id="ready">I'M READY</button></div>`;
      $("#ready").onclick = () => { Sound.play("click"); res(); };
    });
  }
  async function adBreak(players, n) {
    const sorted = players.slice().sort((a, b) => b.score - a.score);
    return new Promise((res) => {
      stage().innerHTML = `<div class="adbreak"><div class="adtitle">COMMERCIAL BREAK</div><div class="ad">${esc(pick(ADS))}</div>
        <div class="board">${sorted.map((pl, k) => `<div class="row"><span class="pos">${k + 1}</span>${Avatar.svg(pl.av, { anim: false, cls: "tiny" })}<b>${esc(pl.name)}</b><span>${pl.right}/${pl.asked}</span><em>${pl.score}</em></div>`).join("")}</div>
        <button class="go big" id="cont">${n < 5 ? "▶ BACK TO THE SHOW" : "▶ THE FINALE"}</button></div>`;
      $("#cont").onclick = () => { Sound.play("click"); res(); };
    });
  }
  async function blitz(pl, i, secs, avoid) {
    const deadline = performance.now() + secs * 1000;
    let got = 0;
    while (performance.now() < deadline - 300) {
      checkQuit();
      const q = Math.random() < 0.3 ? Rounds.make("tf", { avoid }) : Rounds.make("blitz", { avoid });
      if (q.type === "tf") q.blitz = true;
      const r = await one(pl, i, q, { deadline, span: secs * 1000, quick: true, noPerks: true, label: `⚡ BLITZ · ${got} right` });
      if (r.ok) got++;
      if (!r.ok && r.guess == null) break; // clock ran out
    }
    stage().innerHTML = `<div class="ident"><h2 class="iname" data-text="TIME!">TIME!</h2><p><b>${esc(pl.name)}</b> got <b>${got}</b> in the Blitz.</p></div>`;
    Sound.play("buzz"); await sleep(1400);
    return got;
  }
  async function showRatings(results, party) {
    Sound.want("menu");
    const best = results.slice().sort((a, b) => b.pl.score - a.pl.score);
    await FX.burst(400);
    return new Promise((res) => {
      app().innerHTML = `<div class="screen ratings"><h1 class="logo small">THE RATINGS ARE IN</h1>
        ${best.map((r, k) => `<div class="rcard ${k === 0 && party ? "win" : ""}">${Avatar.svg(r.pl.av, { expr: r.st >= 3 ? "happy" : "sad" })}
          <div class="rinfo"><b>${esc(r.pl.name)}</b><div class="stars">${"★".repeat(r.st)}<span>${"★".repeat(5 - r.st)}</span></div>
          <div class="share">${(r.frac * 100).toFixed(0)}% right · share <b>${(4 + r.frac * 24).toFixed(1)}</b></div><div class="bignum">${r.pl.score.toLocaleString()} pts</div>
          <div class="earn">+${r.xp} XP · +${r.packs} cap pack${r.packs > 1 ? "s" : ""}</div></div></div>`).join("")}
        <button class="go big" id="cont">▶ CONTINUE</button></div>`;
      if (results.some((r) => r.st >= 4)) FX.confetti(60);
      Sound.play(results[0].st >= 3 ? "fanfare" : "lose");
      $("#cont").onclick = () => { Sound.play("click"); res(); };
    });
  }

  // ---------- RATINGS WAR ----------
  const war = guard(async (vjId, cohost) => {
    const vj = Cast.VJ[vjId], p = Core.me();
    const pl = { prof: p, name: p.name, av: p.av, score: 0, streak: 0, asked: 0, right: 0, xp: 0 };
    const perk = cohost && cohost !== vjId ? { id: Cast.VJ[cohost].perk, left: RPG.perkUses(p, cohost) } : null;
    Sound.want("war");
    await FX.burst(400);
    await new Promise((res) => {
      app().innerHTML = `<div class="screen vs"><div class="vsrow"><div class="vsl">${Avatar.svg(p.av)}<b>${esc(p.name)}</b><small>LV ${p.lv}</small></div><div class="vsx">VS</div><div class="vsr">${Avatar.svg(vj.spec)}<b>${esc(vj.name)}</b><small>LV ${vj.lv}</small></div></div>
        <div class="bubble">“${esc(pick(vj.lines.intro))}”</div>
        <div class="howto"><b>TUG OF RATINGS.</b> You both answer every question. Right and faster pulls the ratings your way. Drag them all the way to your side to steal ${esc(vj.name)}'s timeslot.</div>
        <button class="go big" id="go">▶ GO LIVE</button></div>`;
      $("#go").onclick = () => { Sound.play("click"); res(); };
    });
    const MAX = 3; let m = 0, n = 0;
    const types = ["mc", "tf", "quote", "pic", "odd", "year"];
    const avoid = new Set();
    frame([pl, { name: vj.name, av: vj.spec, score: "LV " + vj.lv }], 0, `<div class="tug" id="tug">${Array.from({ length: MAX * 2 + 1 }, (_, k) => `<i data-k="${k - MAX}"></i>`).join("")}<span class="knob" id="knob">📺</span></div><div class="vjline" id="vjl"></div>`);
    const tug = () => { $("#knob").style.left = `${((m + MAX) / (MAX * 2)) * 100}%`; document.querySelectorAll("#tug i").forEach((el) => el.classList.toggle("lit", (m > 0 && +el.dataset.k > 0 && +el.dataset.k <= m) || (m < 0 && +el.dataset.k < 0 && +el.dataset.k >= m))); };
    tug();
    const say = (k) => { const el = $("#vjl"); if (el) { el.innerHTML = `${Avatar.svg(vj.spec, { anim: false, cls: "tiny", expr: k === "right" ? "happy" : k === "wrong" ? "sad" : "talk" })}<span>“${esc(pick(vj.lines[k]))}”</span>`; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); } };
    while (Math.abs(m) < MAX) {
      checkQuit(); n++;
      const type = n % 7 === 0 ? "year" : pick(types);
      let q = Rounds.make(type, { avoid });
      const sim = () => {
        const stat = vj.stats[q.c] || 50, T = Rounds.TYPES[q.type].time * 1000;
        const ok = Math.random() < Math.max(0.25, Math.min(0.95, vj.acc + (stat - 60) / 250));
        const at = Math.min(T - 600, vj.speed * (0.55 + Math.random() * 0.8));
        let pickV;
        if (q.type === "year") pickV = ok ? q.y + pick([0, 0, 1, -1]) : q.y + pick([-1, 1]) * (3 + Math.floor(Math.random() * 4));
        else pickV = ok ? q.ans : pick(q.opts.map((_, i) => i).filter((i) => i !== q.ans));
        if (q.type === "year") pickV = Math.max(1980, Math.min(2000, pickV));
        return { name: vj.name, spec: vj.spec, at, ok: q.type === "year" ? Math.abs(pickV - q.y) <= 2 : ok, pick: pickV };
      };
      let v = sim();
      let r = await one(pl, 0, q, { perk, vj: v, label: `ROUND ${n}`, onPerk: () => perk.left-- });
      while (r.skip) { q = Rounds.make(type, { avoid }); v = sim(); r = await one(pl, 0, q, { perk, vj: v, label: `ROUND ${n}`, onPerk: () => perk.left-- }); }
      let d = 0;
      if (q.type === "year") {
        const me = r.guess == null ? 99 : Math.abs(r.guess - q.y), them = Math.abs(v.pick - q.y);
        if (me < them || (me === them && me <= 2 && r.ms < v.at)) d = 1; else if (them < me || (me === them && them <= 2)) d = -1;
      } else {
        if (r.ok && (!v.ok || r.ms < v.at)) d = 1; else if (v.ok && (!r.ok || v.at <= r.ms)) d = -1;
      }
      m += d; tug();
      say(d > 0 ? "wrong" : d < 0 ? "right" : pick(["right", "wrong"]));
      if (d) { Sound.play(d > 0 ? "coin" : "buzz"); $("#tug").classList.add(d > 0 ? "pullme" : "pullthem"); setTimeout(() => $("#tug")?.classList.remove("pullme", "pullthem"), 500); }
      if (n >= 25 && m !== 0) break;
      await sleep(500);
    }
    const won = m > 0;
    const c = p.career; (c.wars ||= {}); const w = (c.wars[vjId] ||= { w: 0, l: 0 }); won ? w.w++ : w.l++;
    let xp = pl.xp + (won ? 60 + vj.lv * 4 : 15), newCrew = false;
    if (won) { RPG.bump(p, "warWins"); p.packs += 1; if (!p.crew.includes(vjId)) { p.crew.push(vjId); newCrew = true; } }
    if (perk) RPG.coXP(p, cohost, won ? 20 : 8);
    Core.save();
    Sound.want("menu");
    await FX.burst(400);
    await new Promise((res) => {
      app().innerHTML = `<div class="screen vs end ${won ? "won" : "lost"}"><h1 class="logo small">${won ? "TIMESLOT STOLEN!" : "CANCELLED!"}</h1>
        <div class="vsrow"><div class="vsl">${Avatar.svg(p.av, { expr: won ? "happy" : "sad" })}</div><div class="vsr">${Avatar.svg(vj.spec, { expr: won ? "sad" : "happy" })}</div></div>
        <div class="bubble">“${esc(pick(won ? vj.lines.lose : vj.lines.win))}”</div>
        ${newCrew ? `<div class="unlock">🎉 <b>${esc(Cast.PRIZE[vjId])}</b>${vjId !== "spinz" && vjId !== "exec" ? `<br><small>Perk: ${Cast.PERKS[vj.perk].icon} ${Cast.PERKS[vj.perk].name} — ${esc(Cast.PERKS[vj.perk].desc)}</small>` : ""}</div>` : ""}
        <div class="earn">+${xp} XP${won ? " · +1 cap pack" : ""}</div>
        <div class="row2"><button class="go" id="again">↻ REMATCH</button><button class="go big" id="cont">▶ CONTINUE</button></div></div>`;
      if (won) { FX.confetti(70); Sound.play("fanfare"); } else Sound.play("lose");
      $("#cont").onclick = () => { Sound.play("click"); res(false); };
      $("#again").onclick = () => { Sound.play("click"); res(true); };
    }).then((again) => { UI.after([{ p, xp, packs: 0 }], again ? () => war(vjId, cohost) : null); });
  });

  // ---------- DAILY BROADCAST ----------
  const DAILY = ["mc", "tf", "pic", "quote", "year", "odd", "mc", "type", "order", "tf"];
  const daily = guard(async () => {
    const p = Core.me(), day = Core.today(), num = Core.dayNum(day) - Core.dayNum("2026-11-01") + 1;
    if (p.daily.hist[day]) return UI.dailyDone();
    const rnd = Core.rng(Core.hash("rewind" + day)), avoid = new Set();
    const qs = DAILY.map((t) => Rounds.make(t, { rnd, avoid, fresh: false }));
    const pl = { prof: p, name: p.name, av: p.av, score: 0, streak: 0, asked: 0, right: 0, xp: 0 };
    Sound.want("game");
    await FX.burst();
    frame([pl], 0);
    const marks = [];
    for (let i = 0; i < qs.length; i++) {
      const r = await one(pl, 0, qs[i], { label: `DAILY #${num} · ${i + 1}/10` });
      marks.push(r.ok ? (qs[i].type === "year" && r.partial > 0 ? "🟨" : "🟩") : (qs[i].type === "year" && r.partial <= 3) || (qs[i].type === "order" && r.partial >= 2) ? "🟨" : "🟥");
    }
    const yest = Core.today(new Date(Date.now() - 864e5));
    p.daily.streak = p.daily.last === yest ? p.daily.streak + 1 : 1;
    p.daily.bestStreak = Math.max(p.daily.bestStreak, p.daily.streak);
    p.daily.last = day; p.daily.hist[day] = { score: pl.score, marks: marks.join(""), num, right: pl.right };
    RPG.bump(p, "dailyPlays"); p.packs += 1;
    Core.save();
    UI.after([{ p, xp: pl.xp + 30, packs: 1 }], () => UI.dailyDone());
  });

  // ---------- MARATHON ----------
  const marathon = guard(async () => {
    const p = Core.me(), pl = { prof: p, name: p.name, av: p.av, score: 0, streak: 0, asked: 0, right: 0, xp: 0 };
    let lives = 3, n = 0;
    const avoid = new Set(), types = ["mc", "mc", "tf", "pic", "quote", "odd", "year"];
    Sound.want("game"); await FX.burst();
    frame([pl], 0, `<div class="lives" id="lives"></div>`);
    const drawLives = () => { $("#lives").innerHTML = Array.from({ length: 3 }, (_, i) => `<span class="${i < lives ? "" : "gone"}">📼</span>`).join("") + `<b>${pl.right}</b>`; };
    drawLives();
    while (lives > 0) {
      checkQuit(); n++;
      const t = pick(types), q = Rounds.make(t, { avoid });
      const speed = Math.max(0.45, 1 - n * 0.015);
      const r = await one(pl, 0, q, { time: Math.round(Rounds.TYPES[t].time * speed), noPerks: true, label: `MARATHON · Q${n}` });
      if (!r.ok) { lives--; $("#lives").classList.add("hit"); setTimeout(() => $("#lives")?.classList.remove("hit"), 500); }
      drawLives();
    }
    const best = p.career.marathon || 0, isBest = pl.right > best;
    RPG.best(p, "marathon", pl.right);
    if (pl.right >= 10) p.packs += 1;
    Core.save();
    Sound.want("menu");
    await FX.burst(400);
    await new Promise((res) => {
      app().innerHTML = `<div class="screen ratings"><h1 class="logo small">TAPE'S RUN OUT</h1><div class="rcard">${Avatar.svg(p.av, { expr: isBest ? "happy" : "sad" })}<div class="rinfo"><b>${esc(p.name)}</b><div class="bignum">${pl.right} right</div><div class="share">${isBest ? "🏆 NEW PERSONAL BEST!" : `Best: ${best}`}</div><div class="earn">+${pl.xp} XP${pl.right >= 10 ? " · +1 cap pack" : ""}</div></div></div><button class="go big" id="cont">▶ CONTINUE</button></div>`;
      if (isBest) FX.confetti(50);
      $("#cont").onclick = () => res();
    });
    UI.after([{ p, xp: pl.xp, packs: 0 }]);
  });

  // ---------- CHANNEL SURF ----------
  const surf = guard(async (cat, type) => {
    const p = Core.me(), pl = { prof: p, name: p.name, av: p.av, score: 0, streak: 0, asked: 0, right: 0, xp: 0 };
    const avoid = new Set();
    Sound.want("game"); await FX.burst();
    frame([pl], 0);
    for (let i = 0; i < 10; i++) {
      const t = type === "mix" ? pick(Rounds.SHOWS) : type;
      const q = Rounds.make(t, { cat: cat === "all" ? null : cat, avoid });
      await one(pl, 0, q, { label: `SURF · ${i + 1}/10`, noPerks: true });
    }
    Core.save();
    Sound.want("menu");
    await new Promise((res) => {
      app().innerHTML = `<div class="screen ratings"><h1 class="logo small">END OF TRANSMISSION</h1><div class="rcard">${Avatar.svg(p.av, { expr: pl.right >= 7 ? "happy" : "talk" })}<div class="rinfo"><b>${esc(p.name)}</b><div class="bignum">${pl.right}/10</div><div class="share">${pl.score} pts</div><div class="earn">+${Math.round(pl.xp / 2)} XP (practice)</div></div></div><button class="go big" id="cont">▶ CONTINUE</button></div>`;
      $("#cont").onclick = () => res();
    });
    UI.after([{ p, xp: Math.round(pl.xp / 2), packs: 0 }]);
  });

  return { episode, war, daily, marathon, surf, DAILY };
})();
