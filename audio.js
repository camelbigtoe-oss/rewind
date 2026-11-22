// Sound: all synthesised with WebAudio (no audio files). Music is a small synthwave rig: detuned saw pads,
// a delayed arpeggio, an octave-pumping bass and gated drums, all through a generated reverb.
// Sound effects are synth stabs, sweeps and arcade hits.
const Sound = (() => {
  "use strict";
  let ctx = null, master, musicBus, sfxBus, noiseBuf, verb, verbIn, delayIn;
  function impulse(sec, decay) {
    const len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = 0.75; master.connect(comp);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.3; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
    // shared reverb and ping-pong-ish delay
    verb = ctx.createConvolver(); verb.buffer = impulse(2.6, 2.4);
    verbIn = ctx.createGain(); verbIn.gain.value = 0.5; verbIn.connect(verb); verb.connect(master);
    delayIn = ctx.createGain(); const dl = ctx.createDelay(1), fb = ctx.createGain(), dlf = ctx.createBiquadFilter();
    dl.delayTime.value = 0.375; fb.gain.value = 0.38; dlf.type = "lowpass"; dlf.frequency.value = 2600;
    delayIn.connect(dl); dl.connect(dlf); dlf.connect(fb); fb.connect(dl); dlf.connect(master); dlf.connect(verbIn);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  const on = () => Core.set.sound && init();
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // a voice: oscillators (detuned) -> filter -> amp envelope -> bus (+ optional reverb / delay sends)
  function voice(f, t, dur, o = {}) {
    const { type = "sawtooth", vol = 0.2, detune = 0, n = 1, cut = 4000, cutTo = null, q = 1, a = 0.005, r = 0.1, bus = sfxBus, rev = 0, del = 0, to = null } = o;
    const fl = ctx.createBiquadFilter(), g = ctx.createGain();
    fl.type = "lowpass"; fl.frequency.setValueAtTime(cut, t); if (cutTo) fl.frequency.exponentialRampToValueAtTime(cutTo, t + dur); fl.Q.value = q;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setValueAtTime(vol, t + Math.max(a, dur - r)); g.gain.exponentialRampToValueAtTime(0.0008, t + dur + r);
    for (let i = 0; i < n; i++) {
      const os = ctx.createOscillator(); os.type = type; os.frequency.setValueAtTime(f, t); if (to) os.frequency.exponentialRampToValueAtTime(to, t + dur);
      os.detune.value = n > 1 ? (i - (n - 1) / 2) * detune : 0; os.connect(fl); os.start(t); os.stop(t + dur + r + 0.05);
    }
    fl.connect(g); g.connect(bus);
    if (rev) { const s = ctx.createGain(); s.gain.value = rev; g.connect(s); s.connect(verbIn); }
    if (del) { const s = ctx.createGain(); s.gain.value = del; g.connect(s); s.connect(delayIn); }
  }
  function noise(t, dur, { vol = 0.2, f = 2000, q = 0.8, type = "bandpass", bus = sfxBus, to = null, rev = 0 } = {}) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; fl.type = type; fl.frequency.setValueAtTime(f, t); if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur); fl.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(fl); fl.connect(g); g.connect(bus); s.start(t); s.stop(t + dur + 0.05);
    if (rev) { const sd = ctx.createGain(); sd.gain.value = rev; g.connect(sd); sd.connect(verbIn); }
  }
  const kick = (t, bus, v = 0.7) => voice(150, t, 0.28, { type: "sine", vol: v, to: 38, cut: 800, bus, r: 0.05 });

  const FX = {
    click() { const t = ctx.currentTime; voice(N(84), t, 0.04, { type: "square", vol: 0.06, cut: 3000, r: 0.03 }); },
    right() { const t = ctx.currentTime; [72, 76, 79, 84, 88].forEach((n, i) => voice(N(n), t + i * 0.055, 0.12, { type: "sawtooth", n: 2, detune: 12, vol: 0.09, cut: 5000, cutTo: 1500, del: 0.35, rev: 0.2 })); },
    wrong() { const t = ctx.currentTime; voice(N(45), t, 0.5, { type: "sawtooth", n: 3, detune: 30, vol: 0.18, to: N(33), cut: 1400, cutTo: 200, q: 6, rev: 0.2 }); },
    tick() { const t = ctx.currentTime; voice(N(96), t, 0.03, { type: "triangle", vol: 0.06, r: 0.02 }); },
    buzz() { const t = ctx.currentTime; voice(N(40), t, 0.3, { type: "square", n: 2, detune: 20, vol: 0.16, cut: 900 }); },
    static() { const t = ctx.currentTime; noise(t, 0.3, { vol: 0.12, f: 600, to: 6000, q: 1 }); },
    whoosh() { const t = ctx.currentTime; noise(t, 0.45, { vol: 0.16, f: 300, to: 5000, q: 2, rev: 0.3 }); },
    rewind() { const t = ctx.currentTime; voice(N(48), t, 0.6, { type: "sawtooth", vol: 0.08, to: N(84), cut: 3000, rev: 0.3 }); noise(t, 0.6, { vol: 0.08, f: 400, to: 5000, q: 3 }); },
    level() { const t = ctx.currentTime; [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => voice(N(n), t + i * 0.07, 0.2, { type: "sawtooth", n: 2, detune: 10, vol: 0.08, cut: 4500, del: 0.4, rev: 0.3 })); },
    fanfare() { const t = ctx.currentTime; [[57, 64, 69, 72], [60, 67, 72, 76], [64, 71, 76, 79]].forEach((ch, i) => ch.forEach((n) => voice(N(n), t + i * 0.22, i === 2 ? 1.1 : 0.2, { type: "sawtooth", n: 3, detune: 14, vol: 0.05, cut: 2800, a: 0.02, rev: 0.45 }))); kick(t + 0.44, sfxBus, 0.5); noise(t + 0.44, 0.9, { vol: 0.1, f: 7000, type: "highpass", rev: 0.4 }); },
    slam() { const t = ctx.currentTime; kick(t, sfxBus, 0.8); noise(t, 0.15, { vol: 0.3, f: 900, rev: 0.3 }); },
    flip() { const t = ctx.currentTime; voice(R(1200, 2000), t, 0.05, { type: "triangle", vol: 0.06, to: 3000 }); },
    coin() { const t = ctx.currentTime; voice(N(83), t, 0.07, { type: "square", vol: 0.08, cut: 6000 }); voice(N(88), t + 0.07, 0.25, { type: "square", vol: 0.08, cut: 6000, del: 0.3 }); },
    lose() { const t = ctx.currentTime; [69, 67, 65, 64].forEach((n, i) => voice(N(n), t + i * 0.25, i === 3 ? 0.9 : 0.22, { type: "sawtooth", n: 2, detune: 15, vol: 0.08, cut: 1800, rev: 0.4 })); },
    vj() { const t = ctx.currentTime; voice(N(76), t, 0.06, { type: "square", vol: 0.07 }); voice(N(71), t + 0.07, 0.1, { type: "square", vol: 0.07 }); },
    hit() { const t = ctx.currentTime; kick(t, sfxBus, 0.6); noise(t, 0.18, { vol: 0.35, f: 1500, q: 0.7, rev: 0.25 }); voice(N(76), t, 0.1, { type: "square", vol: 0.06 }); },
    hurt() { const t = ctx.currentTime; noise(t, 0.25, { vol: 0.3, f: 500, q: 0.7 }); voice(N(40), t, 0.25, { type: "sawtooth", vol: 0.14, to: N(28), cut: 900 }); },
    announce() { const t = ctx.currentTime; voice(N(36), t, 0.5, { type: "sawtooth", n: 3, detune: 25, vol: 0.12, cut: 300, cutTo: 1600, q: 8, rev: 0.5 }); kick(t, sfxBus, 0.5); },
    fight() { const t = ctx.currentTime; kick(t, sfxBus, 0.9); noise(t, 0.8, { vol: 0.25, f: 2500, q: 0.4, rev: 0.6 }); [45, 52, 57, 64].forEach((n) => voice(N(n), t, 0.6, { type: "sawtooth", n: 2, detune: 20, vol: 0.06, cut: 3000, cutTo: 600, rev: 0.5 })); },
  };
  const R = (a, b) => a + Math.random() * (b - a);
  function play(name, ...a) { if (!on() || !FX[name]) return; try { FX[name](...a); } catch {} }

  // ---------- music ----------
  // each track: tempo, chord progression (one chord per bar), drum patterns over 16 steps, arp pattern
  const TRACKS = {
    menu: { bpm: 96, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], bass: [45, 41, 36, 43], k: "x.......x.......", s: "....x.......x...", h: "..x...x...x...x.", arp: [0, 1, 2, 1, 0, 2, 1, 2], arpOct: 12 },
    game: { bpm: 112, chords: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 48, 52]], bass: [38, 34, 36, 33], k: "x...x...x...x...", s: "....x.......x...", h: "x.x.x.x.x.x.x.x.", arp: [0, 1, 2, 3, 2, 1, 0, 2], arpOct: 12 },
    war: { bpm: 128, chords: [[52, 55, 59], [48, 52, 55], [50, 54, 57], [47, 51, 54]], bass: [40, 36, 38, 35], k: "x...x...x...x.x.", s: "....x.......x...", h: "xxxxxxxxxxxxxxxx", arp: [0, 2, 1, 3, 0, 2, 1, 3], arpOct: 24 },
  };
  let cur = null, step = 0, nextT = 0, timer = null, bar = 0;
  function sched() {
    const tr = TRACKS[cur]; if (!tr) return;
    const spb = 60 / tr.bpm / 4;
    while (nextT < ctx.currentTime + 0.15) {
      const i = step % 16, t = nextT, ch = tr.chords[bar % 4], b = tr.bass[bar % 4];
      if (tr.k[i] === "x") kick(t, musicBus);
      if (tr.s[i] === "x") { noise(t, 0.22, { vol: 0.32, f: 1800, q: 0.5, bus: musicBus, rev: 0.6 }); voice(200, t, 0.06, { type: "triangle", vol: 0.12, bus: musicBus }); }
      if (tr.h[i] === "x") noise(t, 0.035, { vol: i % 4 === 2 ? 0.1 : 0.05, f: 9000, type: "highpass", bus: musicBus });
      // pumping octave bass on 8ths
      if (i % 2 === 0) voice(N(b + (i % 4 === 2 ? 12 : 0)), t, spb * 1.6, { type: "sawtooth", n: 2, detune: 8, vol: 0.14, cut: 600, cutTo: 260, q: 4, bus: musicBus, r: 0.05 });
      // pad: one long chord per bar
      if (i === 0) ch.forEach((n) => voice(N(n + 12), t, spb * 15, { type: "sawtooth", n: 3, detune: 16, vol: 0.022, cut: 1400, a: spb * 4, r: spb * 3, bus: musicBus, rev: 0.6 }));
      // arpeggio with delay
      const notes = [...ch, ch[0] + 12];
      const an = notes[tr.arp[i % 8] % notes.length] + tr.arpOct;
      if (i % 2 === 0 || tr.bpm > 120) voice(N(an), t, spb * 0.8, { type: "square", vol: 0.03, cut: 2600, cutTo: 900, bus: musicBus, del: 0.45, r: 0.04 });
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
  let wanted = null;
  function want(name) { wanted = name; if (Core.set.music) music(name); }
  function refresh() { if (Core.set.music) { const w = wanted; cur = null; music(w); } else stopMusic(); }
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopMusic(); else if (Core.set.music && wanted) music(wanted); });

  return { play, want, refresh, init };
})();
