// Sound: every effect and the music is synthesised with WebAudio, so there are no audio files.
// Music is a small drum machine + bass + chord stabs with a lookahead scheduler; each "track" is a pattern.
const Sound = (() => {
  "use strict";
  let ctx = null, master, musicBus, sfxBus, noiseBuf;
  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.32; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.6; sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  const on = () => Core.set.sound && init();

  function tone(f, t, dur, { type = "square", vol = 0.2, to = null, bus = sfxBus, attack = 0.005 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, dur, { vol = 0.2, f = 2000, q = 0.8, type = "bandpass", bus = sfxBus, to = null } = {}) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; fl.type = type; fl.frequency.setValueAtTime(f, t); if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur); fl.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(fl); fl.connect(g); g.connect(bus); s.start(t); s.stop(t + dur + 0.05);
  }
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // midi note to Hz

  const FX = {
    click() { const t = ctx.currentTime; tone(1200, t, 0.05, { vol: 0.08, type: "square" }); },
    hover() { const t = ctx.currentTime; tone(1800, t, 0.03, { vol: 0.03, type: "sine" }); },
    right() { const t = ctx.currentTime; [72, 76, 79, 84].forEach((n, i) => tone(N(n), t + i * 0.06, 0.18, { vol: 0.14, type: "square" })); tone(N(96), t + 0.24, 0.3, { vol: 0.06, type: "sine" }); },
    wrong() { const t = ctx.currentTime; tone(220, t, 0.42, { vol: 0.18, type: "sawtooth", to: 90 }); tone(233, t, 0.42, { vol: 0.12, type: "sawtooth", to: 95 }); },
    tick() { const t = ctx.currentTime; tone(1500, t, 0.04, { vol: 0.06, type: "square" }); },
    buzz() { const t = ctx.currentTime; tone(N(50), t, 0.25, { vol: 0.2, type: "square" }); tone(N(62), t, 0.25, { vol: 0.08, type: "square" }); },
    static(d = 0.5) { const t = ctx.currentTime; noise(t, d, { vol: 0.18, f: 3000, q: 0.3, type: "highpass" }); },
    rewind() { const t = ctx.currentTime; noise(t, 0.7, { vol: 0.14, f: 400, to: 5000, q: 3 }); tone(300, t, 0.7, { vol: 0.05, type: "sawtooth", to: 1400 }); },
    whoosh() { const t = ctx.currentTime; noise(t, 0.35, { vol: 0.14, f: 600, to: 3000, q: 1.5 }); },
    level() { const t = ctx.currentTime; [60, 64, 67, 72, 67, 72, 76, 79].forEach((n, i) => tone(N(n), t + i * 0.09, 0.22, { vol: 0.12, type: i % 2 ? "square" : "triangle" })); },
    fanfare() { const t = ctx.currentTime; [[60, 64, 67], [62, 65, 69], [64, 67, 72], [67, 71, 74, 79]].forEach((ch, i) => ch.forEach((n) => tone(N(n), t + i * 0.18, i === 3 ? 0.8 : 0.2, { vol: 0.08, type: "sawtooth" }))); noise(t + 0.54, 0.6, { vol: 0.1, f: 8000, type: "highpass" }); },
    slam() { const t = ctx.currentTime; tone(140, t, 0.25, { vol: 0.35, type: "sine", to: 50 }); noise(t, 0.12, { vol: 0.25, f: 900 }); },
    flip() { const t = ctx.currentTime; tone(900 + Math.random() * 600, t, 0.06, { vol: 0.07, type: "triangle", to: 2000 }); },
    coin() { const t = ctx.currentTime; tone(N(83), t, 0.08, { vol: 0.1 }); tone(N(88), t + 0.08, 0.25, { vol: 0.1 }); },
    lose() { const t = ctx.currentTime; [67, 66, 65, 64].forEach((n, i) => tone(N(n), t + i * 0.22, i === 3 ? 0.7 : 0.2, { vol: 0.12, type: "triangle" })); },
    vj() { const t = ctx.currentTime; tone(N(76), t, 0.07, { vol: 0.08 }); tone(N(71), t + 0.07, 0.1, { vol: 0.08 }); },
  };
  function play(name, ...a) { if (!on() || !FX[name]) return; try { FX[name](...a); } catch {} }

  // ---------- music ----------
  // patterns: 16 steps per bar. k = kick, s = snare, h = hat, b = bass notes (midi, 0 = rest), c = chord stab on step
  const TRACKS = {
    menu: { bpm: 104, k: "x...x...x...x.x.", s: "....x.......x...", h: "x.x.x.x.x.x.x.xx",
      bars: [[45, 45, 57, 45], [41, 41, 53, 41], [43, 43, 55, 43], [40, 40, 52, 47]], chords: [[69, 72, 76], [65, 69, 72], [67, 71, 74], [64, 68, 71]], stab: "..x...x...x..x.." },
    game: { bpm: 122, k: "x..x..x.x..x..x.", s: "....x.......x..x", h: "xxxxxxxxxxxxxxxx",
      bars: [[38, 38, 50, 38], [38, 38, 50, 41], [36, 36, 48, 36], [41, 43, 45, 43]], chords: [[62, 65, 69], [62, 65, 69], [60, 64, 67], [65, 69, 72]], stab: "x.....x.....x..." },
    war: { bpm: 132, k: "x...x...x...x...", s: "....x.......x...", h: ".x.x.x.x.x.x.x.x",
      bars: [[40, 40, 40, 43], [40, 40, 40, 38], [36, 36, 36, 38], [35, 35, 38, 40]], chords: [[64, 67, 71], [64, 67, 71], [60, 64, 67], [59, 62, 66]], stab: "x..x..x..x..x..." },
  };
  let cur = null, step = 0, nextT = 0, timer = null, bar = 0;
  function sched() {
    const tr = TRACKS[cur]; if (!tr) return;
    const spb = 60 / tr.bpm / 4;
    while (nextT < ctx.currentTime + 0.15) {
      const i = step % 16, t = nextT;
      if (tr.k[i] === "x") tone(150, t, 0.2, { type: "sine", vol: 0.5, to: 40, bus: musicBus });
      if (tr.s[i] === "x") { noise(t, 0.16, { vol: 0.3, f: 1800, q: 0.6, bus: musicBus }); tone(190, t, 0.08, { type: "triangle", vol: 0.12, bus: musicBus }); }
      if (tr.h[i] === "x") noise(t, 0.04, { vol: i % 4 === 2 ? 0.12 : 0.06, f: 9000, type: "highpass", bus: musicBus });
      const notes = tr.bars[bar % tr.bars.length];
      if (i % 4 === 0 || i % 4 === 3) { const n = notes[Math.floor(i / 4)]; if (n) tone(N(n), t, spb * 1.6, { type: "sawtooth", vol: 0.13, bus: musicBus }); }
      if (tr.stab[i] === "x") tr.chords[bar % tr.chords.length].forEach((n) => tone(N(n), t, spb * 1.5, { type: "square", vol: 0.035, bus: musicBus }));
      nextT += spb; step++; if (step % 16 === 0) bar++;
    }
  }
  function music(name) {
    if (name === cur) return;
    stopMusic(); cur = name;
    if (!name || !Core.set.music || !init()) return;
    step = 0; bar = 0; nextT = ctx.currentTime + 0.1;
    timer = setInterval(sched, 50);
  }
  function stopMusic() { clearInterval(timer); timer = null; cur = null; }
  // keep the wanted track so turning music back on resumes it
  let wanted = null;
  function want(name) { wanted = name; if (Core.set.music) music(name); }
  function refresh() { if (Core.set.music) { const w = wanted; cur = null; music(w); } else stopMusic(); }
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopMusic(); else if (Core.set.music && wanted) music(wanted); });

  return { play, want, refresh, init };
})();
