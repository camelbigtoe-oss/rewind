// 16-bit arcade portraits. The drawn character (Avatar.vsvg) is rendered to a small canvas,
// reduced to a limited palette with ordered dithering (like a 90s fighting-game select screen),
// then shown scaled up with hard pixels. Rendering is async, so Pixel.img() returns an <img> at once
// and fills in its picture when ready. Results are cached.
const Pixel = (() => {
  "use strict";
  const W = 96, H = 115, LEVELS = 6;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const cache = new Map(), pending = new Map();
  const blank = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d", { willReadFrequently: true });
  let chain = Promise.resolve(), n = 0;

  function crunch() {
    const im = g.getImageData(0, 0, W, H), d = im.data, step = 255 / (LEVELS - 1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (d[i + 3] < 128) { d[i + 3] = 0; continue; }
      d[i + 3] = 255;
      const t = BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5;
      for (let c = 0; c < 3; c++) d[i + c] = Math.max(0, Math.min(255, Math.round(d[i + c] / step + t * 0.85) * step));
    }
    g.putImageData(im, 0, 0);
  }
  function render(svg) {
    return new Promise((res) => {
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      const im = new Image();
      im.onload = () => {
        g.clearRect(0, 0, W, H); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
        g.drawImage(im, 0, 0, W, H); URL.revokeObjectURL(url); crunch();
        res(cv.toDataURL());
      };
      im.onerror = () => { URL.revokeObjectURL(url); res(blank); };
      im.src = url;
    });
  }
  // an <img> for this character; its picture arrives when rendered
  function img(spec, opts = {}) {
    const svg = Avatar.vsvg(spec, { ...opts, anim: false });
    const key = svg.replace(/(id="[a-z]+)\d+"/g, '$1"').replace(/(url\(#[a-z]+)\d+\)/g, "$1)");
    const cls = `av px ${opts.cls || ""} ${opts.anim === false ? "" : "bob"}`;
    if (cache.has(key)) return `<img class="${cls}" src="${cache.get(key)}" alt="" draggable="false">`;
    if (!pending.has(key)) {
      const k = "p" + ++n;
      pending.set(key, k);
      chain = chain.then(() => render(svg)).then((url) => {
        if (cache.size > 500) cache.delete(cache.keys().next().value);
        cache.set(key, url); pending.delete(key);
        document.querySelectorAll(`img[data-px="${k}"]`).forEach((el) => { el.src = url; el.removeAttribute("data-px"); });
      });
    }
    return `<img class="${cls}" data-px="${pending.get(key)}" src="${blank}" alt="" draggable="false">`;
  }
  return { img, W, H };
})();
