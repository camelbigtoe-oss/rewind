// Shared helpers and the saved profiles. Every module reads and writes through Core.
// Profiles live in localStorage under "rw.profiles"; settings under "rw.set".
const Core = (() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LS = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const SAVE = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (a, rnd = Math.random) => a[Math.floor(rnd() * a.length)];
  function shuffle(a, rnd = Math.random) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // seeded random (mulberry32) for the daily broadcast
  function rng(seed) { let t = seed >>> 0; return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // local calendar day as YYYY-MM-DD
  const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dayNum = (s = today()) => Math.round(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5);

  // ---------- settings ----------
  const set = { sound: true, music: true, motion: true, scan: true, ...LS("rw.set", {}) };
  const saveSet = () => SAVE("rw.set", set);

  // ---------- profiles ----------
  const CATS = ["tv", "toons", "music", "movies", "toys", "oz"];
  function blank(name, av) {
    return {
      id: "p" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      name: name || "You", av, made: Date.now(),
      xp: 0, lv: 1, stats: Object.fromEntries(CATS.map((c) => [c, 10])), prog: {},
      caps: {}, packs: 1, ach: {}, owned: {}, crew: [], cohost: null, co: {}, theme: "saturday",
      best: {}, daily: { last: null, streak: 0, bestStreak: 0, hist: {} },
      career: { answered: 0, right: 0, streak: 0, bestStreak: 0, cats: {}, types: {}, episodes: 0, wars: {}, marathon: 0, played: 0, perks: 0, fast: 0 },
      seen: [],
    };
  }
  let db = LS("rw.profiles", null);
  if (!db || !Array.isArray(db.list)) db = { list: [], active: null };
  const saveDb = () => SAVE("rw.profiles", db);
  const me = () => db.list.find((p) => p.id === db.active) || null;
  function fill(p) { // older saves: add fields added since
    const b = blank(p.name, p.av);
    for (const k of Object.keys(b)) if (p[k] == null) p[k] = b[k];
    for (const c of CATS) if (p.stats[c] == null) p.stats[c] = 10;
    p.career = { ...b.career, ...p.career };
    p.daily = { ...b.daily, ...p.daily };
    return p;
  }
  db.list.forEach(fill);
  function create(name, av) { const p = blank(name, av); db.list.push(p); db.active = p.id; saveDb(); return p; }
  function use(id) { if (db.list.some((p) => p.id === id)) { db.active = id; saveDb(); } }
  function remove(id) { db.list = db.list.filter((p) => p.id !== id); if (db.active === id) db.active = db.list[0]?.id || null; saveDb(); }

  const guest = (name, av) => ({ ...blank(name, av), guest: true });
  return { $, $$, esc, LS, SAVE, clamp, pick, shuffle, rng, hash, sleep, today, dayNum, set, saveSet, CATS, me, create, use, remove, guest, save: saveDb, get profiles() { return db.list; }, byId: (id) => db.list.find((p) => p.id === id) };
})();
