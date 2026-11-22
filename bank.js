// Question bank. Data files call these with one question per line ("#" lines are comments):
//   Bank.add(cat, text)    question | answer | wrong1; wrong2; wrong3 | also accept | flags   (flags: m = options only)
//   Bank.tf(text)          statement | T or F | the fact shown after | cat
//   Bank.years(text)       thing that happened | year | cat
//   Bank.quotes(text)      catchphrase | show or character | wrong1; wrong2; wrong3 | cat
//   Bank.odd(text)         prompt | the odd one | three that belong | cat | why
//   Bank.pics(text)        emoji clue | answer | wrong1; wrong2; wrong3 | cat
// cat is one of Core.CATS: tv, toons, music, movies, toys, oz.
const Bank = (() => {
  "use strict";
  const { shuffle, hash } = Core;
  const NAMES = { tv: "TV Land", toons: "Toon Town", music: "Music Videos", movies: "Movie Night", toys: "Toys & Games", oz: "Down Under" };
  const SHORT = { tv: "TV", toons: "TOON", music: "MUS", movies: "MOV", toys: "TOY", oz: "OZNZ" };
  const ICON = { tv: "📺", toons: "🦆", music: "🎤", movies: "🍿", toys: "🕹️", oz: "🥝" };
  const pools = { mc: [], tf: [], year: [], quote: [], odd: [], pic: [] };
  const split = (s) => (s || "").split(";").map((x) => x.trim()).filter(Boolean);
  const lines = (text) => text.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((l) => l.split("|").map((p) => p.trim()));
  const id = (t, s) => t + "-" + hash(s).toString(36);
  const okCat = (c, line) => { if (Core.CATS.includes(c)) return true; console.warn("bad cat", line); return false; };

  function add(cat, text) {
    for (const [q, a, w, x, f = ""] of lines(text)) {
      const wrong = split(w);
      if (!q || !a || wrong.length < 3) { console.warn("bad question", q); continue; }
      pools.mc.push({ id: id(cat, q), t: "mc", c: cat, q, a, w: wrong, x: split(x), m: f.includes("m") });
    }
  }
  function tf(text) {
    for (const [q, v, fact, c] of lines(text)) { if (!okCat(c, q)) continue; pools.tf.push({ id: id("tf", q), t: "tf", c, q, a: /^t/i.test(v) ? "TOTALLY" : "NOT!", truth: /^t/i.test(v), fact }); }
  }
  function years(text) {
    for (const [q, y, c] of lines(text)) { if (!okCat(c, q) || !+y) continue; pools.year.push({ id: id("yr", q), t: "year", c, q, y: +y, a: y }); }
  }
  function quotes(text) {
    for (const [q, a, w, c] of lines(text)) { if (!okCat(c, q)) continue; pools.quote.push({ id: id("qt", q), t: "quote", c, q, a, w: split(w) }); }
  }
  function odd(text) {
    for (const [q, a, ins, c, why] of lines(text)) { if (!okCat(c, q)) continue; pools.odd.push({ id: id("od", q + a), t: "odd", c, q, a, w: split(ins), why }); }
  }
  function pics(text) {
    for (const [e, a, w, c] of lines(text)) { if (!okCat(c, e)) continue; pools.pic.push({ id: id("pc", e + a), t: "pic", c, emoji: e, a, w: split(w) }); }
  }
  // drawn pictures from pics.js
  function art(list) { for (const d of list) pools.pic.push({ id: "art-" + d.k, t: "pic", c: d.c || "toys", art: d.k, a: d.a, w: d.w, fact: d.fact }); }

  // ---------- picking ----------
  function seenSet() { const p = Core.me(); return new Set(p ? p.seen : []); }
  function markSeen(q) {
    const p = Core.me(); if (!p) return;
    p.seen.push(q.id); if (p.seen.length > 2400) p.seen.splice(0, p.seen.length - 2400);
  }
  // one item from a pool; filter is optional; avoids what this profile has seen until the pool runs low
  function draw(pool, { cat, filter, avoid, rnd = Math.random, fresh = true } = {}) {
    let list = pools[pool].filter((q) => (!cat || q.c === cat) && (!filter || filter(q)) && !(avoid && avoid.has(q.id)));
    if (!list.length) list = pools[pool].filter((q) => !filter || filter(q));
    if (fresh) {
      const s = seenSet(); const unseen = list.filter((q) => !s.has(q.id));
      if (unseen.length >= 3) list = unseen;
    }
    const q = list[Math.floor(rnd() * list.length)];
    if (avoid) avoid.add(q.id);
    if (fresh) markSeen(q);
    return q;
  }
  // options for anything with a/w: answer plus n-1 wrongs, shuffled
  function opts(item, n = 4, rnd = Math.random) {
    const o = shuffle([item.a, ...shuffle(item.w.slice(), rnd).slice(0, n - 1)], rnd);
    return { opts: o, ans: o.indexOf(item.a) };
  }
  // typed round: short answers that make sense without options
  const typable = (q) => !q.m && q.a.length <= 26 && !/^\d+$/.test(q.a);

  // four year items with different years, at least two apart where possible
  function orderSet(rnd = Math.random, cat) {
    for (let tries = 0; tries < 60; tries++) {
      const pool = shuffle(pools.year.filter((q) => !cat || q.c === cat).slice(), rnd);
      const out = [];
      for (const q of pool) { if (out.every((o) => Math.abs(o.y - q.y) >= 2)) out.push(q); if (out.length === 4) break; }
      if (out.length === 4) { out.forEach(markSeen); return out; }
      cat = null;
    }
    return shuffle(pools.year.slice(), rnd).slice(0, 4);
  }

  // ---------- typed answer checking ----------
  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " and ").replace(/[^a-z0-9 ]/g, " ").replace(/\b(the|a|an)\b/g, " ").replace(/\s+/g, " ").trim();
  }
  // edit distance; swapping two neighbouring letters counts as one slip
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    const d = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[m][n];
  }
  function typoOK(g, ok, tol) {
    if (lev(g, ok) > tol) return false;
    const a = g.split(" "), b = ok.split(" ");
    if (a.length === b.length) for (let i = 0; i < a.length; i++) if (Math.min(a[i].length, b[i].length) <= 3 && a[i] !== b[i]) return false;
    return true;
  }
  const NOT_PERSON = /\b(street|bay|city|show|club|world|park|land|house|high|power|rangers|kids|family|boys|girls|story|wars|time|street)\b/i;
  function isPerson(a) {
    const w = a.trim().split(/\s+/);
    return w.length >= 2 && w.length <= 3 && !/^the\b/i.test(a) && w.every((x) => /^[A-Z]/.test(x)) && !NOT_PERSON.test(a) && !/\d/.test(a);
  }
  function matches(input, item) {
    const g = norm(input); if (!g) return false;
    const accepted = [item.a, ...(item.x || [])].map(norm);
    if (accepted.includes(g)) return true;
    const wrongs = (item.w || []).map(norm).filter((w) => !accepted.includes(w));
    if (wrongs.includes(g)) return false;
    const nearestWrong = wrongs.length ? Math.min(...wrongs.map((w) => lev(g, w))) : Infinity;
    for (const ok of accepted) {
      if (/\d/.test(ok)) continue;
      const tol = ok.length >= 9 ? 2 : ok.length >= 5 ? 1 : 0;
      if (tol && typoOK(g, ok, tol) && lev(g, ok) < nearestWrong) return true;
      if (isPerson(item.a) && g.length >= 4) { const parts = ok.split(" "); if (lev(g, parts[parts.length - 1]) <= (g.length >= 7 ? 1 : 0)) return true; }
    }
    return false;
  }

  const count = () => Object.fromEntries(Object.entries(pools).map(([k, v]) => [k, v.length]));
  return { add, tf, years, quotes, odd, pics, art, draw, opts, typable, orderSet, matches, norm, pools, count, NAMES, SHORT, ICON };
})();
