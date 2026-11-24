// Screens: title, TV Guide (home), character creator, crew, Ratings War ladder, caps, Gold Records,
// stats, settings, party setup and the rewards sequence after every game.
const UI = (() => {
  "use strict";
  const { $, $$, esc, sleep } = Core;
  const app = () => $("#app");
  const osd = (l, r) => { if (l != null) $("#osd-l").textContent = l; if (r != null) $("#osd-r").textContent = r; };

  function toast(msg, ms = 2400) { const t = $("#toast"); t.innerHTML = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), ms); }
  function modal(html, cls = "") {
    return new Promise((res) => {
      const m = document.createElement("div"); m.className = "modal " + cls;
      m.innerHTML = `<div class="mbox">${html}</div>`; document.body.appendChild(m);
      requestAnimationFrame(() => m.classList.add("on"));
      const close = (v) => { m.classList.remove("on"); setTimeout(() => m.remove(), 220); res(v); };
      m.addEventListener("click", (e) => { const b = e.target.closest("[data-m]"); if (b) { Sound.play("click"); close(b.dataset.m); } else if (e.target === m && !cls.includes("hold")) close(null); });
    });
  }
  const back = (label = "◀ GUIDE") => `<button class="back" data-go="home">${label}</button>`;
  function bindGo(root = app()) { $$("[data-go]", root).forEach((b) => (b.onclick = () => { Sound.play("click"); go(b.dataset.go, b.dataset.v); })); }
  function go(where, v) {
    const map = { home, wardrobe: () => creator(Core.me()), crew, war: warLadder, caps, records, stats, settings, profiles, party: partySetup, surf: surfSetup, prime: primeSetup, daily: () => Modes.daily(), marathon: () => Modes.marathon(), help };
    (map[where] || home)(v);
    window.scrollTo(0, 0);
  }

  // ---------- title ----------
  // the logo as bouncy cartoon letters, each its own colour
  const LETTERS = ["#ff4a3a", "#ff8a1a", "#ffd21f", "#4ad04a", "#2ab0ff", "#b05aff"];
  const bounce = (word, cls = "") => `<span class="toon ${cls}">${[...word].map((ch, i) => `<i style="--c:${LETTERS[i % LETTERS.length]};--d:${(i * 0.08).toFixed(2)}s">${ch}</i>`).join("")}</span>`;

  // ---------- title: a Saturday-morning cartoon title card ----------
  function title() {
    osd("", "");
    app().innerHTML = `<section class="screen intro">
      <div class="ribbon">SATURDAY MORNING</div>
      <h1 class="bigtitle">${bounce("REWIND")}${bounce("TV", "tv")}</h1>
      <div class="intro-tag">90s pop trivia · cartoons · TV · music · movies · toys</div>
      <button class="go huge press" id="play">PRESS PLAY ▶</button>
      <div class="intro-foot">Don't touch that dial!</div>
    </section>`;
    $("#play").onclick = async () => {
      Sound.init(); Sound.play("coin");
      await FX.burst(480);
      Sound.want("menu");
      if (!Core.me()) creator(null); else home();
    };
  }

  // ---------- home: the cartoon channel guide ----------
  function home() {
    const p = Core.me(); if (!p) return creator(null);
    FX.setTheme(p.theme); FX.setMood("city"); osd("", "");
    Sound.want("menu");
    const next = Cast.ORDER.findIndex((id) => !p.crew.includes(id));
    const known = Cast.ORDER.filter((id, i) => p.crew.includes(id) || i === next);
    const hidden = Cast.ORDER.filter((id) => !known.includes(id));
    const today = p.daily.hist[Core.today()];
    const pct = Math.round((p.xp / RPG.need(p.lv)) * 100);
    const plate = (go, label, icon, extra = "") => `<button class="plate" data-go="${go}"><em>${icon}</em><span>${label}</span>${extra}</button>`;
    const tile = (id) => `<button class="rtile ${p.crew.includes(id) ? "won" : "next"}" data-go="${p.crew.includes(id) ? "crew" : "war"}">${Avatar.svg(Cast.VJ[id].spec, { anim: false })}<b>${esc(Cast.VJ[id].name.split(" (")[0])}</b></button>`;
    app().innerHTML = `<section class="screen home">
      <div class="hometop">
        <h1 class="bigtitle small">${bounce("REWIND")}${bounce("TV", "tv")}</h1>
        <button class="mebadge" data-go="wardrobe">${Avatar.svg(p.av)}<b>${esc(p.name)}</b><small>Level ${p.lv} · ${esc(RPG.title(p.lv))}</small><i class="xpbar"><em style="width:${pct}%"></em></i></button>
      </div>
      <nav class="plates">
        ${plate("prime", "Prime Time", "📺")}${plate("war", "Ratings War", "⚔️")}${plate("daily", today ? "Daily done!" : "Daily Broadcast", "📅")}
        ${plate("marathon", "Marathon", "📼")}${plate("surf", "Channel Surf", "🔁")}${plate("party", "House Party", "🎉")}
        ${plate("wardrobe", "My Badge", "🎨")}${plate("crew", "Crew", "🎙️")}${plate("caps", "Caps", "🥏", p.packs ? `<i class="badge">${p.packs}</i>` : "")}
        ${plate("records", "Gold Records", "🏆")}${plate("stats", "Stats", "📊")}${plate("settings", "Options", "⚙️")}
      </nav>
      <section class="panel roster"><h2 class="brush">Rival channels</h2>
        <div class="rgrid">${known.map(tile).join("")}${hidden.map(() => `<div class="htile"><span>?</span></div>`).join("")}</div></section>
      <div class="foot2"><button class="link" data-go="profiles">Switch player</button><button class="link" id="snd">${Core.set.sound ? "Sound on" : "Sound off"}</button></div>
    </section>`;
    bindGo();
    $("#snd").onclick = () => { Core.set.sound = !Core.set.sound; Core.set.music = Core.set.sound; Core.saveSet(); Sound.refresh(); home(); };
  }

  // ---------- character creator ----------
  const TABS = {
    SHAPE: [["badge", "Shape", "thumb"]],
    COLOUR: [["topC", "Main colour", "swatch"], ["top2", "Pattern colour", "swatch"]],
    ICON: [["icon", "Icon", "thumb"]],
    PATTERN: [["pat", "Pattern", "thumb"]],
  };
  function creator(prof) {
    const isNew = !prof;
    const p = prof || { lv: 1, ach: {}, crew: [] };
    let spec = { ...Avatar.DEFAULT, ...(prof ? prof.av : Avatar.random(Math.random, (o) => RPG.unlocked(p, o))) };
    let name = prof ? prof.name : "";
    let tab = "SHAPE", expr = null;
    osd("1P", "CREATE");
    function options(key) {
      const C = Avatar.CATALOG;
      if (key === "skin") return Avatar.SKIN.map((c) => ({ id: c, c }));
      if (key === "hairC") return Avatar.HAIRC.map((h) => ({ ...h, id: h.c }));
      if (key === "eyeC") return C.eyeC.map((c) => ({ id: c, c }));
      if (["topC", "top2", "hatC", "bgC"].includes(key)) return Avatar.COLORS.map((c) => ({ id: c, c }));
      return C[key] || [];
    }
    function render() {
      const sections = TABS[tab].map(([key, label, kind]) => {
        if (kind === "toggle") return `<div class="sec"><h4>${label}</h4><button class="tog ${spec[key] ? "on" : ""}" data-k="${key}">${spec[key] ? "ON" : "OFF"}</button></div>`;
        const opts = options(key);
        return `<div class="sec"><h4>${label}</h4><div class="${kind === "swatch" ? "swatches" : "thumbs"}">${opts.map((o) => {
          const locked = !RPG.unlocked(p, o), sel = spec[key] === o.id;
          if (kind === "swatch") return `<button class="sw ${sel ? "sel" : ""} ${locked ? "locked" : ""}" data-k="${key}" data-v="${o.id}" style="--c:${o.c}" title="${esc(o.name || "")}${locked ? " · " + esc(RPG.why(o)) : ""}">${locked ? "🔒" : ""}</button>`;
          const preview = Avatar.svg({ ...spec, [key]: o.id }, { anim: false, bg: key === "bg", cls: "thumbav" });
          return `<button class="th ${sel ? "sel" : ""} ${locked ? "locked" : ""}" data-k="${key}" data-v="${o.id}">${preview}<span>${esc(o.name)}</span>${locked ? `<em>🔒 ${esc(RPG.why(o))}</em>` : ""}</button>`;
        }).join("")}</div></div>`;
      }).join("");
      app().innerHTML = `<div class="screen creator">
        <div class="ctop">${isNew ? `<h2 class="logo small">Make your channel badge</h2>` : back()}<input id="cname" maxlength="14" placeholder="Your name" value="${esc(name)}" aria-label="Name"></div>
        <div class="preview"><div class="pv" id="pv">${Avatar.svg(spec, { expr })}</div>
          <div class="pvbtns"><button id="rand">🎲 SURPRISE ME</button></div></div>
        <div class="tabs">${Object.keys(TABS).map((t) => `<button class="${t === tab ? "on" : ""}" data-tab="${t}">${t}</button>`).join("")}</div>
        <div class="secs">${sections}</div>
        <div class="csave"><button class="go big" id="save">${isNew ? "▶ GO ON AIR!" : "✔ SAVE BADGE"}</button></div></div>`;
      $("#cname").oninput = (e) => (name = e.target.value);
      $$("[data-tab]").forEach((b) => (b.onclick = () => { tab = b.dataset.tab; Sound.play("click"); render(); }));
      $$("[data-x]").forEach((b) => (b.onclick = () => { expr = b.dataset.x || null; $("#pv").innerHTML = Avatar.svg(spec, { expr }); Sound.play("click"); }));
      $("#rand").onclick = () => { spec = Avatar.random(Math.random, (o) => RPG.unlocked(p, o)); Sound.play("whoosh"); render(); };
      $$(".tog").forEach((b) => (b.onclick = () => { spec[b.dataset.k] = !spec[b.dataset.k]; Sound.play("click"); render(); }));
      $$(".sw, .th").forEach((b) => (b.onclick = () => {
        if (b.classList.contains("locked")) { Sound.play("buzz"); toast("🔒 " + esc(b.title.split(" · ")[1] || b.querySelector("em")?.textContent || "Locked")); return; }
        const k = b.dataset.k; spec[k] = b.dataset.v; Sound.play("click");
        const y = $(".secs").scrollTop; render(); $(".secs").scrollTop = y;
      }));
      $("#save").onclick = () => {
        name = ($("#cname").value || "").trim();
        if (!name) { toast("Give your channel a name first!"); $("#cname").focus(); return; }
        Sound.play("fanfare");
        if (isNew) { Core.create(name, spec); FX.confetti(60); home(); }
        else { prof.name = name; prof.av = spec; Core.save(); toast("Lookin' fresh!"); home(); }
      };
    }
    render();
  }

  // ---------- profiles ----------
  function profiles() {
    osd(null, "PLAYERS");
    app().innerHTML = `<div class="screen list">${back()}<h2 class="logo small">WHO'S WATCHING?</h2>
      <div class="plist">${Core.profiles.map((p) => `<div class="prow ${p.id === Core.me()?.id ? "on" : ""}"><button class="pick" data-id="${p.id}">${Avatar.svg(p.av, { anim: false })}<b>${esc(p.name)}</b><small>LV ${p.lv} · ${esc(RPG.title(p.lv))}</small></button><button class="del" data-del="${p.id}" title="Delete">🗑</button></div>`).join("")}</div>
      <button class="go big" id="newp">＋ NEW PLAYER</button></div>`;
    bindGo();
    $$(".pick").forEach((b) => (b.onclick = () => { Core.use(b.dataset.id); Sound.play("click"); home(); }));
    $$("[data-del]").forEach((b) => (b.onclick = async () => {
      const p = Core.byId(b.dataset.del);
      const ok = await modal(`<h3>Delete ${esc(p.name)}?</h3><p>Their level, caps, crew and records will be erased from this device. This can't be undone.</p><div class="row2"><button class="go" data-m="no">KEEP</button><button class="go danger" data-m="yes">DELETE</button></div>`);
      if (ok === "yes") { Core.remove(p.id); Core.me() ? profiles() : creator(null); }
    }));
    $("#newp").onclick = () => creator(null);
  }

  // ---------- crew ----------
  function crew() {
    const p = Core.me(); osd(null, "CREW");
    app().innerHTML = `<div class="screen list">${back()}<h2 class="logo small">YOUR CREW</h2><p class="sub">Beat a VJ in Ratings War to recruit them. Pick one as your co-host to bring their perk into Prime Time and Ratings War. Co-hosts level up the more you play with them.</p>
      <div class="crew">${Cast.ORDER.map((id) => {
        const v = Cast.VJ[id], has = p.crew.includes(id), c = RPG.co(p, id), pk = Cast.PERKS[v.perk];
        return `<div class="vjcard ${has ? "" : "locked"} ${p.cohost === id ? "co" : ""}">${has ? Avatar.svg(v.spec) : `<div class="sil">${Avatar.svg(v.spec, { anim: false })}</div>`}
          <div class="vji"><b>${has ? esc(v.name) : "???"}</b><small>${has ? esc(v.tag) : `Beat them in Ratings War. Rival LV ${v.lv}.`}</small>
          ${has ? `<div class="perkline">${pk.icon} <b>${pk.name}</b> ×${RPG.perkUses(p, id)} · ${esc(pk.desc)}</div><div class="colv">Co-host LV ${c.lv}</div>
          <div class="bars">${Core.CATS.map((k) => `<div><span>${Bank.SHORT[k]}</span><i style="width:${v.stats[k]}%"></i></div>`).join("")}</div>
          <button class="go small" data-co="${id}">${p.cohost === id ? "✔ CO-HOST" : "MAKE CO-HOST"}</button>` : ""}</div></div>`;
      }).join("")}</div></div>`;
    bindGo();
    $$("[data-co]").forEach((b) => (b.onclick = () => { p.cohost = p.cohost === b.dataset.co ? null : b.dataset.co; Core.save(); Sound.play("coin"); crew(); }));
  }

  // ---------- Ratings War ladder ----------
  // Ratings War: a fighting-game character select. Beat each challenger to unlock the next.
  let selVJ = null;
  function warLadder() {
    const p = Core.me(); osd("1P", "SELECT");
    const next = Cast.ORDER.findIndex((id) => !p.crew.includes(id));
    const open = (id, i) => p.crew.includes(id) || i <= (next < 0 ? 99 : next);
    if (!selVJ || !open(selVJ, Cast.ORDER.indexOf(selVJ))) selVJ = Cast.ORDER[next < 0 ? Cast.ORDER.length - 1 : next];
    const v = Cast.VJ[selVJ], rec = p.career.wars?.[selVJ], beaten = p.crew.includes(selVJ);
    app().innerHTML = `<div class="screen list select">${back()}<h2 class="sel-title">SELECT YOUR OPPONENT</h2>
      <div class="selpreview ${v.boss ? "boss" : ""}">
        <div class="spav">${Avatar.svg(v.spec)}<span class="p1">CPU</span></div>
        <div class="spinfo"><b>${esc(v.name)}</b><em>${esc(v.style)}</em><small>${esc(v.tag)}</small>
          <div class="bars">${Core.CATS.map((k) => `<div><span>${Bank.SHORT[k]}</span><i style="width:${v.stats[k]}%"></i></div>`).join("")}</div>
          <div class="sprec">LV ${v.lv}${rec ? ` · W ${rec.w} L ${rec.l}` : ""}${beaten ? " · DEFEATED" : ""}</div></div>
      </div>
      <div class="selgrid">${Cast.ORDER.map((id, i) => {
        const o = open(id, i);
        return `<button class="tile ${o ? "" : "locked"} ${id === selVJ ? "on" : ""} ${p.crew.includes(id) ? "beaten" : ""} ${Cast.VJ[id].boss ? "boss" : ""}" data-vj="${id}" ${o ? "" : "disabled"}>${o ? Avatar.svg(Cast.VJ[id].spec, { anim: false }) : `<span class="sil">${Avatar.svg(Cast.VJ[id].spec, { anim: false, bg: false })}</span><span class="q">?</span>`}${id === selVJ ? `<span class="cur">P1</span>` : ""}</button>`;
      }).join("")}</div>
      ${coPicker(p)}
      <button class="go huge" id="fight">FIGHT!</button></div>`;
    bindGo(); bindCo(p, warLadder);
    $$(".tile").forEach((b) => (b.onclick = () => { if (b.dataset.vj === selVJ) return; selVJ = b.dataset.vj; Sound.play("click"); warLadder(); }));
    $("#fight").onclick = () => { Sound.play("buzz"); Modes.war(selVJ, p.cohost); };
  }
  function coPicker(p) {
    if (!p.crew.length) return `<div class="copick empty">No crew yet. Win a Ratings War to recruit your first co-host.</div>`;
    return `<div class="copick"><span>CO-HOST:</span><button class="${!p.cohost ? "on" : ""}" data-co2="">Solo</button>${p.crew.map((id) => `<button class="${p.cohost === id ? "on" : ""}" data-co2="${id}">${Avatar.svg(Cast.VJ[id].spec, { anim: false, cls: "tiny" })}<small>${Cast.PERKS[Cast.VJ[id].perk].icon}</small></button>`).join("")}</div>`;
  }
  function bindCo(p, again) { $$("[data-co2]").forEach((b) => (b.onclick = () => { p.cohost = b.dataset.co2 || null; Core.save(); Sound.play("click"); again(); })); }

  // ---------- Prime Time setup ----------
  function primeSetup() {
    const p = Core.me(); osd(null, "PRIME");
    const co = p.cohost ? Cast.VJ[p.cohost] : null;
    app().innerHTML = `<div class="screen list">${back()}<h2 class="logo small">PRIME TIME</h2>
      <p class="sub">Tonight's line-up is 5 random shows, each with its own way to answer, then the Buzzer Blitz. Streaks of 3 and 5 multiply your points.</p>
      <div class="lineup">${Rounds.SHOWS.map((t) => `<div class="lu"><span>CH ${String(Rounds.TYPES[t].ch).padStart(2, "0")}</span><b>${Rounds.TYPES[t].icon}</b><small>${Rounds.TYPES[t].name}</small></div>`).join("")}<div class="lu fin"><span>CH 99</span><b>⚡</b><small>BUZZER BLITZ</small></div></div>
      ${coPicker(p)}
      ${co ? `<div class="cohost big">${Avatar.svg(co.spec, { expr: "happy" })}<div><b>${esc(co.name)}</b><p>${Cast.PERKS[co.perk].icon} ${Cast.PERKS[co.perk].name} ×${RPG.perkUses(p, p.cohost)} — ${esc(Cast.PERKS[co.perk].desc)}</p></div></div>` : ""}
      <button class="go huge" id="start">▶ ROLL TAPE</button></div>`;
    bindGo(); bindCo(p, primeSetup);
    $("#start").onclick = () => { Sound.play("click"); Modes.episode([p], p.cohost); };
  }

  // ---------- Channel Surf ----------
  function surfSetup() {
    let cat = "all", type = "mix"; osd(null, "SURF");
    const draw = () => {
      app().innerHTML = `<div class="screen list">${back()}<h2 class="logo small">CHANNEL SURF</h2><p class="sub">Ten practice questions. Half XP, no pressure.</p>
        <h4>Channel</h4><div class="pickgrid">${[["all", "📺", "Everything"], ...Core.CATS.map((c) => [c, Bank.ICON[c], Bank.NAMES[c]])].map(([id, ic, n]) => `<button class="${cat === id ? "on" : ""}" data-cat="${id}"><i>${ic}</i>${esc(n)}</button>`).join("")}</div>
        <h4>Round style</h4><div class="pickgrid">${[["mix", "🔀", "Mixed"], ...Rounds.SHOWS.map((t) => [t, Rounds.TYPES[t].icon, Rounds.TYPES[t].name])].map(([id, ic, n]) => `<button class="${type === id ? "on" : ""}" data-type="${id}"><i>${ic}</i>${esc(n)}</button>`).join("")}</div>
        <button class="go huge" id="start">▶ START SURFING</button></div>`;
      bindGo();
      $$("[data-cat]").forEach((b) => (b.onclick = () => { cat = b.dataset.cat; Sound.play("click"); draw(); }));
      $$("[data-type]").forEach((b) => (b.onclick = () => { type = b.dataset.type; Sound.play("click"); draw(); }));
      $("#start").onclick = () => Modes.surf(cat, cat !== "all" && ["order", "year"].includes(type) ? type : type);
    };
    draw();
  }

  // ---------- party ----------
  function partySetup() {
    osd(null, "PARTY");
    const sel = new Set([Core.me().id]);
    const guests = [];
    const draw = () => {
      const all = [...Core.profiles, ...guests];
      app().innerHTML = `<div class="screen list">${back()}<h2 class="logo small">HOUSE PARTY</h2><p class="sub">Pick 2 to 4 players. Everyone shares one phone and takes turns. Saved players earn XP and caps. Guests just play.</p>
        <div class="partyl">${all.map((p) => `<button class="pp ${sel.has(p.id) ? "on" : ""}" data-pid="${p.id}">${Avatar.svg(p.av, { anim: false })}<b>${esc(p.name)}</b><small>${p.guest ? "Guest" : "LV " + p.lv}</small></button>`).join("")}
        <button class="pp add" id="addg"><span>＋</span><b>Add guest</b></button></div>
        <button class="go huge" id="start" ${sel.size < 2 ? "disabled" : ""}>▶ START THE PARTY (${sel.size})</button></div>`;
      bindGo();
      $$("[data-pid]").forEach((b) => (b.onclick = () => { const id = b.dataset.pid; if (sel.has(id)) sel.delete(id); else if (sel.size < 4) sel.add(id); else toast("Four players max!"); Sound.play("click"); draw(); }));
      $("#addg").onclick = async () => {
        const n = prompt("Guest name?"); if (!n || !n.trim()) return;
        const g = Core.guest(n.trim().slice(0, 14), Avatar.random(Math.random, (o) => !o.lv && !o.ach && !o.vj)); guests.push(g); if (sel.size < 4) sel.add(g.id); draw();
      };
      $("#start").onclick = () => { const ps = [...Core.profiles, ...guests].filter((p) => sel.has(p.id)); Modes.episode(ps, null); };
    };
    draw();
  }

  // ---------- caps ----------
  function caps() {
    const p = Core.me(); osd(null, "CAPS");
    const owned = Object.keys(p.caps).length, d = RPG.dupes(p);
    app().innerHTML = `<div class="screen list">${back()}<h2 class="logo small">CAP COLLECTION</h2>
      <div class="packbar"><div class="packs"><b>${p.packs}</b> pack${p.packs === 1 ? "" : "s"} to slam</div><button class="go big" id="open" ${p.packs ? "" : "disabled"}>🥏 SLAM A PACK</button></div>
      <p class="sub">${owned}/${Cast.CAPS.length} collected · ${d} double${d === 1 ? "" : "s"} ${d >= 4 ? `<button class="mini" id="trade">Trade 4 doubles for a pack</button>` : ""}<br>Earn packs from episodes, wars, the Daily Broadcast and big Marathon runs.</p>
      <div class="capgrid">${Cast.CAPS.map((c) => `<div class="capw">${Cast.capSvg(c, !!p.caps[c.id])}${p.caps[c.id] > 1 ? `<span class="n">×${p.caps[c.id]}</span>` : ""}</div>`).join("")}</div></div>`;
    bindGo();
    $("#open").onclick = () => slam(p);
    if ($("#trade")) $("#trade").onclick = () => { if (RPG.tradeDupes(p)) { Sound.play("coin"); toast("Traded! +1 pack"); caps(); } };
  }
  // the slam mini-game: stop the power meter in the sweet spot to flip more caps
  function slam(p) {
    const stack = RPG.packStack(p);
    app().innerHTML = `<div class="screen slam"><h2 class="logo small">SLAM IT!</h2><p class="sub">Tap when the meter hits the gold zone. The harder the slam, the more caps flip face up. Every face-up cap is yours.</p>
      <div class="arena"><div class="stack" id="stack">${stack.map((c, i) => `<div class="sc" style="--i:${i}">${Cast.capSvg(c)}</div>`).join("")}</div><div class="slammer" id="slammer"></div></div>
      <div class="meter"><div class="zone"></div><i id="needle"></i></div>
      <button class="go huge" id="hit">🥏 SLAM!</button></div>`;
    let t0 = performance.now(), raf, pos = 0;
    const spin = (now) => { pos = (Math.sin((now - t0) / 260) + 1) / 2; $("#needle").style.left = pos * 100 + "%"; raf = requestAnimationFrame(spin); };
    raf = requestAnimationFrame(spin);
    $("#hit").onclick = async () => {
      cancelAnimationFrame(raf); $("#hit").disabled = true;
      const acc = 1 - Math.min(1, Math.abs(pos - 0.5) / 0.5); // 1 = dead centre
      const flips = Math.max(2, Math.min(6, 2 + Math.round(acc * 4.4)));
      $("#slammer").classList.add("drop"); await sleep(380); Sound.play("slam");
      $(".arena").classList.add("shake");
      const order = Core.shuffle(stack.map((_, i) => i));
      const keep = new Set(order.slice(0, flips));
      $$(".sc").forEach((el, i) => { el.classList.add("fly"); el.style.setProperty("--dx", (Math.random() * 260 - 130) + "px"); el.style.setProperty("--dy", (Math.random() * 120 - 40) + "px"); el.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg"); if (!keep.has(i)) el.classList.add("down"); setTimeout(() => Sound.play("flip"), 100 + i * 70); });
      await sleep(1200);
      const got = stack.filter((_, i) => keep.has(i));
      p.packs--; const fresh = RPG.keepCaps(p, got);
      const ach = RPG.check(p);
      FX.confetti(30);
      await modal(`<h3>${acc > 0.8 ? "PERFECT SLAM!" : acc > 0.5 ? "NICE SLAM!" : "WEAK SLAM..."}</h3><p>${flips} caps flipped face up.</p>
        <div class="capgrid won">${got.map((c) => { const isNew = fresh.includes(c.id); if (isNew) fresh.splice(fresh.indexOf(c.id), 1); return `<div class="capw">${Cast.capSvg(c)}${isNew ? `<span class="newb">NEW</span>` : ""}</div>`; }).join("")}</div>
        <button class="go big" data-m="ok">SWEET</button>`, "hold");
      for (const a of ach) await recordModal(a);
      p.packs ? slamAgain(p) : caps();
    };
  }
  async function slamAgain(p) { const r = await modal(`<h3>${p.packs} more pack${p.packs > 1 ? "s" : ""}</h3><div class="row2"><button class="go" data-m="no">LATER</button><button class="go big" data-m="yes">🥏 SLAM AGAIN</button></div>`, "hold"); r === "yes" ? slam(p) : caps(); }

  // ---------- Gold Records ----------
  function records() {
    const p = Core.me(); osd(null, "RECORDS");
    const n = Object.keys(p.ach).length;
    app().innerHTML = `<div class="screen list">${back()}<h2 class="logo small">GOLD RECORDS</h2><p class="sub">${n}/${Cast.ACH.length} on the wall.</p>
      <div class="recs">${Cast.ACH.map((a) => { const got = p.ach[a.id]; return `<div class="rec ${got ? "got" : ""}"><div class="disc"><i></i></div><div><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>${a.prize ? `<em>🎁 ${esc(a.prize)}</em>` : ""}</div></div>`; }).join("")}</div>
      <h3 class="h3">CHANNEL THEMES</h3><div class="themes">${Cast.THEMES.map((t) => { const ok = RPG.unlocked(p, t); return `<button class="theme th-${t.id} ${p.theme === t.id ? "on" : ""} ${ok ? "" : "locked"}" data-th="${t.id}"><b>${esc(t.name)}</b><small>${ok ? esc(t.desc) : "🔒 " + esc(RPG.why(t))}</small></button>`; }).join("")}</div></div>`;
    bindGo(); bindThemes(p, records);
  }
  function bindThemes(p, again) {
    $$("[data-th]").forEach((b) => (b.onclick = () => {
      const t = Cast.THEMES.find((x) => x.id === b.dataset.th);
      if (!RPG.unlocked(p, t)) { Sound.play("buzz"); toast("🔒 " + RPG.why(t)); return; }
      p.theme = t.id; Core.save(); FX.setTheme(t.id); FX.burst(260); again();
    }));
  }

  // ---------- stats ----------
  function stats() {
    const p = Core.me(), c = p.career; osd(null, "STATS");
    const pc = (o) => (o && o.t ? Math.round((o.r / o.t) * 100) : 0);
    const wars = Object.entries(c.wars || {});
    app().innerHTML = `<div class="screen list">${back()}<h2 class="logo small">CAREER STATS</h2>
      <div class="statgrid">
        ${[["Answered", c.answered], ["Right", c.right], ["Accuracy", (c.answered ? Math.round((c.right / c.answered) * 100) : 0) + "%"], ["Best run", c.bestStreak], ["Episodes", c.episodes || 0], ["War wins", c.warWins || 0], ["Best episode", (c.bestEpisode || 0).toLocaleString()], ["Blitz best", c.blitzBest || 0], ["Marathon best", c.marathon || 0], ["Exact years", c.exact || 0], ["Daily streak", p.daily.streak + " (best " + p.daily.bestStreak + ")"], ["Quick draws", c.fast || 0]].map(([k, v]) => `<div class="st"><b>${v}</b><small>${k}</small></div>`).join("")}
      </div>
      <h3 class="h3">CHANNEL STATS</h3>
      <div class="catstats">${Core.CATS.map((k) => `<div class="cs"><span>${Bank.ICON[k]} ${Bank.NAMES[k]}</span><div class="sbar"><i style="width:${p.stats[k]}%"></i><b>${p.stats[k]}</b></div><small>${pc(c.cats[k])}% right · ${c.cats[k]?.t || 0} asked</small></div>`).join("")}</div>
      <p class="sub">Channel stats rise as you answer right. A high stat can cross off a wrong answer for you (a "hunch").</p>
      <h3 class="h3">ROUND STYLES</h3>
      <div class="catstats">${[...Rounds.SHOWS].map((t) => `<div class="cs"><span>${Rounds.TYPES[t].icon} ${Rounds.TYPES[t].name}</span><div class="sbar"><i style="width:${pc(c.types[t])}%"></i><b>${pc(c.types[t])}%</b></div><small>${c.types[t]?.t || 0} played</small></div>`).join("")}</div>
      ${wars.length ? `<h3 class="h3">RATINGS WARS</h3><div class="catstats">${wars.map(([id, w]) => `<div class="cs"><span>${esc(Cast.VJ[id].name)}</span><small>${w.w} won · ${w.l} lost</small></div>`).join("")}</div>` : ""}
    </div>`;
    bindGo();
  }

  // ---------- settings ----------
  function settings() {
    const p = Core.me(), S = Core.set; osd(null, "SETUP");
    const row = (k, label, desc) => `<div class="setrow"><div><b>${label}</b><small>${desc}</small></div><button class="tog ${S[k] ? "on" : ""}" data-set="${k}">${S[k] ? "ON" : "OFF"}</button></div>`;
    app().innerHTML = `<div class="screen list">${back()}<h2 class="logo small">SETUP</h2>
      ${row("sound", "Sound effects", "Buzzers, blips and slams.")}
      ${row("music", "Music", "The REWIND TV beat.")}
      ${row("scan", "Scanlines", "That CRT glow.")}
      ${row("motion", "Animation", "Turn off to calm the background and effects.")}
      <h3 class="h3">CHANNEL THEME</h3><div class="themes">${Cast.THEMES.map((t) => { const ok = RPG.unlocked(p, t); return `<button class="theme th-${t.id} ${p.theme === t.id ? "on" : ""} ${ok ? "" : "locked"}" data-th="${t.id}"><b>${esc(t.name)}</b><small>${ok ? esc(t.desc) : "🔒 " + esc(RPG.why(t))}</small></button>`; }).join("")}</div>
      <h3 class="h3">MORE</h3>
      <button class="go" data-go="help">❓ HOW TO PLAY</button>
      <button class="go" id="reseen">↺ Reset seen questions</button>
      <p class="sub">${Object.entries(Bank.count()).map(([k, v]) => `${v} ${k}`).join(" · ")} questions on air.</p></div>`;
    bindGo(); bindThemes(p, settings);
    $$("[data-set]").forEach((b) => (b.onclick = () => { const k = b.dataset.set; S[k] = !S[k]; Core.saveSet(); applySet(); if (k === "music") Sound.refresh(); Sound.play("click"); settings(); }));
    $("#reseen").onclick = () => { p.seen = []; Core.save(); toast("Question history cleared."); };
  }
  function applySet() { document.body.classList.toggle("noscan", !Core.set.scan); document.body.classList.toggle("still", !Core.set.motion); }

  function help() {
    osd(null, "HELP");
    app().innerHTML = `<div class="screen list help">${back()}<h2 class="logo small">HOW TO PLAY</h2>
      <div class="hcard"><h4>📺 PRIME TIME</h4><p>An episode is 5 shows picked from the 8 round styles below, then the Buzzer Blitz. Right answers in a row build a streak: 3 in a row is ×1.5, 5 in a row is ×2.</p></div>
      ${Rounds.SHOWS.concat("blitz").map((t) => `<div class="hcard"><h4>${Rounds.TYPES[t].icon} CH ${String(Rounds.TYPES[t].ch).padStart(2, "0")} ${Rounds.TYPES[t].name}</h4><p>${esc(Rounds.TYPES[t].blurb)}</p></div>`).join("")}
      <div class="hcard"><h4>⚔️ RATINGS WAR</h4><p>You and a rival VJ both answer. Right and faster pulls the ratings your way. Get them all the way to your side to win and recruit that VJ to your crew.</p></div>
      <div class="hcard"><h4>🎙️ CO-HOSTS</h4><p>Each crew member brings a perk you can use a few times per game. The more you play with a co-host, the more uses they get.</p></div>
      <div class="hcard"><h4>📈 LEVELS & STATS</h4><p>XP levels you up and unlocks new hair, clothes, eyewear, backdrops and channel themes. Each channel has its own stat that grows as you answer right.</p></div>
      <div class="hcard"><h4>🥏 CAPS</h4><p>Win packs, then slam them. Stop the meter in the gold zone to flip more caps. Collect all 48, including the holo ones.</p></div></div>`;
    bindGo();
  }

  // ---------- daily done ----------
  function dailyDone() {
    const p = Core.me(), d = p.daily.hist[Core.today()]; osd(null, "DAILY");
    if (!d) return home();
    const text = `REWIND TV 📼 Daily #${d.num}\n${d.marks}\n${d.score} pts · ${d.right}/10${p.daily.streak > 1 ? ` · 📅${p.daily.streak}` : ""}`;
    app().innerHTML = `<div class="screen list">${back()}<h2 class="logo small">DAILY BROADCAST #${d.num}</h2>
      <div class="dres"><div class="marks">${d.marks}</div><div class="bignum">${d.score} pts</div><p>${d.right}/10 right · 📅 ${p.daily.streak}-day streak (best ${p.daily.bestStreak})</p></div>
      <button class="go big" id="share">📤 SHARE</button><p class="sub">Next broadcast in <b id="cd"></b></p></div>`;
    bindGo();
    $("#share").onclick = async () => { try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast("Copied! Paste it to your mates."); } } catch {} };
    const cd = () => { const el = $("#cd"); if (!el) return; const n = new Date(); const m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n; el.textContent = `${Math.floor(m / 36e5)}h ${Math.floor((m % 36e5) / 6e4)}m`; };
    cd(); clearInterval(dailyDone.t); dailyDone.t = setInterval(cd, 30000);
  }

  // ---------- after every game: XP, level-ups, unlocks, Gold Records ----------
  function unlocksBetween(from, to) {
    const out = [];
    for (const [k, list] of Object.entries(Avatar.CATALOG)) if (Array.isArray(list)) for (const o of list) if (o.lv > from && o.lv <= to) out.push(o.name);
    for (const h of Avatar.HAIRC) if (h.lv > from && h.lv <= to) out.push(h.name + " hair");
    for (const t of Cast.THEMES) if (t.lv > from && t.lv <= to) out.push(t.name + " theme");
    return out;
  }
  async function recordModal(a) {
    Sound.play("fanfare"); FX.confetti(50);
    await modal(`<div class="goldrec"><div class="disc big"><i></i></div><h3>GOLD RECORD!</h3><b>${esc(a.name)}</b><p>${esc(a.desc)}</p>${a.prize ? `<p class="prize">🎁 Unlocked: ${esc(a.prize)}</p>` : ""}<button class="go big" data-m="ok">AWESOME</button></div>`, "hold");
  }
  async function after(list, next) {
    for (const { p, xp } of list) {
      if (p.guest) continue;
      const from = p.lv, ups = RPG.addXP(p, xp);
      if (ups.length) {
        Sound.play("level"); FX.confetti(70);
        const un = unlocksBetween(from, p.lv);
        await modal(`<div class="lvup">${Avatar.svg(p.av, { expr: "happy" })}<h3>LEVEL UP!</h3><div class="lvnum">LV ${p.lv}</div><b>${esc(p.name)}</b> is now a <b>${esc(RPG.title(p.lv))}</b>${un.length ? `<div class="unl"><small>NEW UNLOCKS</small>${un.map((u) => `<span>🔓 ${esc(u)}</span>`).join("")}</div>` : ""}<button class="go big" data-m="ok">RAD!</button></div>`, "hold");
      }
      for (const a of RPG.check(p)) await recordModal(a);
    }
    Core.save();
    if (next) next(); else home();
  }

  // ---------- boot ----------
  // secret preview link: ?unlock=all opens everything for the current player (a backup is kept),
  // ?unlock=reset puts that player back how they were. The address is tidied afterwards.
  function unlockLink() {
    const u = new URLSearchParams(location.search).get("unlock");
    if (!u) return;
    history.replaceState(null, "", location.pathname);
    let p = Core.me();
    if (u === "all") {
      if (!p) p = Core.create("Preview", Avatar.random());
      if (!p.backup) { const { backup, ...rest } = p; p.backup = JSON.parse(JSON.stringify(rest)); }
      p.lv = RPG.MAXLV; p.xp = 0;
      for (const id of Cast.ORDER) { if (!p.crew.includes(id)) p.crew.push(id); RPG.co(p, id).lv = 20; }
      for (const a of Cast.ACH) p.ach[a.id] ||= Date.now();
      for (const c of Cast.CAPS) p.caps[c.id] ||= 1;
      for (const k of Core.CATS) p.stats[k] = Math.max(p.stats[k], 99);
      p.packs = Math.max(p.packs, 5);
      Core.save();
      setTimeout(() => toast("🔓 EVERYTHING UNLOCKED for " + esc(p.name), 3500), 400);
    } else if (u === "reset" && p && p.backup) {
      const old = p.backup;
      Object.keys(p).forEach((k) => delete p[k]); Object.assign(p, old);
      Core.save();
      setTimeout(() => toast("🔒 Back to normal for " + esc(p.name), 3500), 400);
    }
  }
  function boot() {
    applySet();
    unlockLink();
    const p = Core.me(); if (p) FX.setTheme(p.theme);
    title();
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
    // the first tap anywhere unlocks audio on iOS
    addEventListener("pointerdown", () => Sound.init(), { once: true });
  }
  boot();
  return { home, toast, modal, after, dailyDone, go };
})();
