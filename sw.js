// Offline cache for REWIND TV. Bump VERSION after changing any file.
const VERSION = "rewind-v7";
const CORE = [
  "./", "index.html", "style.css", "core.js", "bank.js", "q-tv.js", "q-toons.js", "q-music.js", "q-movies.js", "q-toys.js", "q-oz.js", "q-special.js",
  "pics.js", "avatar.js", "pixel.js", "cast.js", "rpg.js", "audio.js", "fx.js", "rounds.js", "modes.js", "ui.js",
  "manifest.json", "icon-64.png", "icon-192.png", "icon-512.png", "apple-touch-icon.png",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("rewind-") && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // fonts: cache-first
  if (url.hostname.includes("fonts.g")) {
    e.respondWith(caches.open(VERSION).then(async (c) => { const hit = await c.match(e.request); if (hit) return hit; const res = await fetch(e.request); if (res.ok) c.put(e.request, res.clone()); return res; }));
    return;
  }
  if (url.origin !== location.origin) return;
  // app files: network-first so updates land, cache when offline
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))));
});
