// Progression: XP and levels, channel stats (1-99), co-host levels, Gold Records, caps and unlocks.
// Everything is stored on the profile object from Core; call Core.save() after changes (done here).
const RPG = (() => {
  "use strict";
  const MAXLV = 50;
  const need = (lv) => 80 + lv * 30; // XP from this level to the next
  const TITLES = [[1, "Couch Potato"], [3, "Remote Hog"], [5, "Channel Surfer"], [8, "Mixtape Maker"], [11, "VJ in Training"], [15, "Prime Time Player"], [20, "Cable Legend"], [28, "Ratings Royalty"], [36, "Network Icon"], [45, "Hall of Fame"]];
  const title = (lv) => TITLES.filter(([l]) => lv >= l).pop()[1];

  function addXP(p, n) {
    const ups = [];
    p.xp += Math.round(n);
    while (p.lv < MAXLV && p.xp >= need(p.lv)) { p.xp -= need(p.lv); p.lv++; ups.push(p.lv); }
    if (p.lv >= MAXLV) p.xp = Math.min(p.xp, need(p.lv));
    Core.save();
    return ups;
  }

  // one answered question. returns XP earned (added by the caller at the end of a game)
  function answer(p, q, ok, ms = 9999) {
    const c = p.career, cat = q.c, t = q.type || q.t;
    c.answered++;
    const cs = (c.cats[cat] ||= { r: 0, t: 0 }); cs.t++;
    const ts = (c.types[t] ||= { r: 0, t: 0 }); ts.t++;
    if (ok) {
      c.right++; cs.r++; ts.r++; c.streak++; c.bestStreak = Math.max(c.bestStreak, c.streak);
      if (ms < 2000) c.fast = (c.fast || 0) + 1;
      // stats grow one point every 3 right answers in that channel
      p.prog[cat] = (p.prog[cat] || 0) + 1;
      if (p.prog[cat] >= 3) { p.prog[cat] = 0; if (p.stats[cat] < 99) p.stats[cat]++; }
    } else c.streak = 0;
    return ok ? 10 + (ms < 3000 ? 4 : ms < 6000 ? 2 : 0) : 1;
  }
  const bump = (p, k, n = 1) => { p.career[k] = (p.career[k] || 0) + n; };
  const best = (p, k, v) => { if (v > (p.career[k] || 0)) p.career[k] = v; };

  // ---------- co-hosts ----------
  const co = (p, id) => (p.co[id] ||= { lv: 1, xp: 0 });
  function coXP(p, id, n) { const r = co(p, id); r.xp += n; let up = false; while (r.lv < 20 && r.xp >= 40 + r.lv * 20) { r.xp -= 40 + r.lv * 20; r.lv++; up = true; } return up; }
  const perkUses = (p, id) => Math.min(3, 1 + Math.floor(co(p, id).lv / 5));

  // ---------- unlocks ----------
  function unlocked(p, o) {
    if (!o || typeof o !== "object") return true;
    if (o.lv && p.lv < o.lv) return false;
    if (o.ach && !p.ach[o.ach]) return false;
    if (o.vj && !p.crew.includes(o.vj)) return false;
    return true;
  }
  function why(o) {
    if (o.lv) return `Reach level ${o.lv}`;
    if (o.ach) { const a = Cast.ACH.find((x) => x.id === o.ach); return `Gold Record: ${a ? a.name : o.ach}`; }
    if (o.vj) return `Beat ${Cast.VJ[o.vj].name} in Ratings War`;
    return "";
  }

  // ---------- Gold Records ----------
  function check(p) {
    const c = p.career, got = [];
    const give = (id, cond) => { if (cond && !p.ach[id]) { p.ach[id] = Date.now(); got.push(Cast.ACH.find((a) => a.id === id)); } };
    const typeR = (t) => (c.types[t] ? c.types[t].r : 0);
    give("first", c.episodes >= 1);
    give("perfect", c.perfectShows >= 1);
    give("streak10", c.bestStreak >= 10);
    give("streak25", c.bestStreak >= 25);
    give("diamond", c.fiveStars >= 1);
    give("war1", (c.warWins || 0) >= 1);
    give("rave", (c.warWins || 0) >= 5);
    give("champion", p.crew.includes("exec"));
    give("crew", Cast.ORDER.every((id) => p.crew.includes(id)));
    give("platinum", p.lv >= 20);
    give("lv10", p.lv >= 10);
    give("daily1", (c.dailyPlays || 0) >= 1);
    give("daily7", p.daily.streak >= 7);
    give("marathon20", (c.marathon || 0) >= 20);
    give("marathon50", (c.marathon || 0) >= 50);
    give("blitz12", (c.blitzBest || 0) >= 12);
    give("exact5", (c.exact || 0) >= 5);
    give("order5", (c.orders || 0) >= 5);
    give("speller", typeR("type") >= 25);
    give("pics", typeR("pic") >= 25);
    give("r100", c.right >= 100);
    give("r1000", c.right >= 1000);
    give("fast", (c.fast || 0) >= 25);
    give("allcats", Core.CATS.every((k) => (c.cats[k]?.r || 0) >= 40));
    give("oz50", (c.cats.oz?.r || 0) >= 50);
    const capsOwned = Object.keys(p.caps).length;
    give("caps25", capsOwned >= 25);
    give("caps48", capsOwned >= Cast.CAPS.length);
    give("holo", Cast.CAPS.some((k) => k.rare === "holo" && p.caps[k.id]));
    give("party", (c.party || 0) >= 1);
    give("perks10", (c.perks || 0) >= 10);
    if (got.length) Core.save();
    return got;
  }

  // ---------- caps ----------
  // a pack is a stack of 6; the slam flips some face up and you keep those (at least 2)
  function rollCap(rnd = Math.random) {
    const r = rnd(), tier = r < 0.06 ? "holo" : r < 0.3 ? "rare" : "common";
    const pool = Cast.CAPS.filter((c) => c.rare === tier);
    return pool[Math.floor(rnd() * pool.length)];
  }
  function packStack(p) { return Array.from({ length: 6 }, () => rollCap()); }
  function keepCaps(p, caps) {
    const fresh = [];
    for (const c of caps) { if (!p.caps[c.id]) fresh.push(c.id); p.caps[c.id] = (p.caps[c.id] || 0) + 1; }
    Core.save(); return fresh;
  }
  const dupes = (p) => Object.values(p.caps).reduce((a, n) => a + Math.max(0, n - 1), 0);
  function tradeDupes(p) {
    // swap 4 doubles for a pack: take from the most-duplicated caps first
    let left = 4;
    const ids = Object.keys(p.caps).sort((a, b) => p.caps[b] - p.caps[a]);
    for (const id of ids) { while (left && p.caps[id] > 1) { p.caps[id]--; left--; } }
    if (left) return false;
    p.packs++; Core.save(); return true;
  }

  const stars = (frac) => (frac >= 0.9 ? 5 : frac >= 0.75 ? 4 : frac >= 0.55 ? 3 : frac >= 0.35 ? 2 : 1);

  return { need, title, addXP, answer, bump, best, co, coXP, perkUses, unlocked, why, check, packStack, keepCaps, dupes, tradeDupes, stars, MAXLV };
})();
