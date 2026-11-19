/* widgets/sim.js: dua figur interaktif materi Pengantar Simulasi Monte Carlo */
(() => {
  const { warna, rng, kanvas, lihat } = Kit, $ = s => document.querySelector(s);
  const f = (v, d) => v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const TAU = 6.283185307179586, NMAX = 20000;
  const hit = (x, y) => x * x + y * y <= 1;   // persegi sisi 1; seperempat lingkaran jari-jari 1 berpusat di (0,0)

  // ---------- Figur 1: titik acak di dalam persegi ----------
  const S = { rnd: null, seed: 3, pts: [], nh: 0, run: false, mulai: false };
  const piAdd = k => { for (let i = 0; i < k && S.pts.length < NMAX; i++) { const x = S.rnd(), y = S.rnd(), t = hit(x, y); S.pts.push([x, y, t]); if (t) S.nh++; } };
  function piTampil() {
    const { c, w, h } = kanvas($('#cv-pi')); if (!w) return; const C = warna();
    const m = 26, k = Math.min(w, h) - 2 * m, ox = (w - k) / 2, oy = (h - k) / 2, X = x => ox + x * k, Y = y => oy + (1 - y) * k;
    c.clearRect(0, 0, w, h);
    c.fillStyle = C.a2 + '1f'; c.beginPath(); c.moveTo(X(0), Y(0)); c.arc(X(0), Y(0), k, -Math.PI / 2, 0); c.closePath(); c.fill();
    c.lineWidth = 1.5; c.strokeStyle = C.tinta2; c.strokeRect(X(0), Y(1), k, k);
    c.lineWidth = 2.5; c.strokeStyle = C.a2; c.beginPath(); c.arc(X(0), Y(0), k, -Math.PI / 2, 0); c.stroke();
    c.font = '11px Inter, sans-serif'; c.fillStyle = C.redup; c.textAlign = 'center'; c.fillText('0', X(0), Y(0) + 16); c.fillText('1', X(1), Y(0) + 16); c.fillText('x', X(.5), Y(0) + 17);
    c.textAlign = 'right'; c.fillText('0', X(0) - 6, Y(0) + 4); c.fillText('1', X(0) - 6, Y(1) + 4); c.textAlign = 'center'; c.fillText('y', X(0) - 20, Y(.5) + 4);
    const n = S.pts.length, r = 1.5;
    const titik = (jenis, warnaTitik) => { c.fillStyle = warnaTitik; c.beginPath();
      for (const p of S.pts) if (p[2] === jenis) { const px = X(p[0]), py = Y(p[1]); c.rect(px - r, py - r, 2 * r, 2 * r); }
      c.fill(); };
    c.globalAlpha = .8; titik(true, C.a2); titik(false, C.a1); c.globalAlpha = 1;
    if (n) { const p = S.pts[n - 1]; c.strokeStyle = C.emas; c.lineWidth = 2; c.beginPath(); c.arc(X(p[0]), Y(p[1]), 7, 0, TAU); c.stroke(); }
    const v = (id, x) => $(id).textContent = x;
    v('#p-n', f(n, 0)); v('#p-h', f(S.nh, 0)); v('#p-m', f(n - S.nh, 0)); v('#p-e', n ? f(4 * S.nh / n, 4) : '-');
  }
  const setPlay = () => $('#p-play').textContent = S.run ? 'Jeda' : 'Putar';
  function loop() { if (!S.run) return; piAdd(Math.max(1, Math.ceil(S.pts.length / 30))); piTampil(); if (S.pts.length >= NMAX) { S.run = false; setPlay(); } else requestAnimationFrame(loop); }
  const piReset = () => { S.rnd = rng(S.seed); S.pts = []; S.nh = 0; S.run = false; setPlay(); piTampil(); };
  $('#p-play').onclick = () => { S.run = !S.run; setPlay(); loop(); };
  $('#p-1').onclick = () => { piAdd(1); piTampil(); }; $('#p-100').onclick = () => { piAdd(100); piTampil(); };
  $('#p-reset').onclick = piReset; $('#p-seed').onclick = () => { S.seed += 17; piReset(); };
  lihat($('#fig-pi'), v => { if (v && !S.mulai) { S.mulai = true; S.run = true; setPlay(); loop(); } if (!v && S.run) { S.run = false; setPlay(); } });

  // ---------- Figur 2: estimasi π mendekati nilai sebenarnya ----------
  const K = { off: 0, runs: [], raf: 0, shown: 1, mulai: false }, NK = 20000;
  const kData = () => { K.runs = [11, 29, 47].map(s => { const r = rng(s + K.off), a = new Float32Array(NK); let nh = 0;
    for (let i = 0; i < NK; i++) { const x = r(), y = r(); if (hit(x, y)) nh++; a[i] = 4 * nh / (i + 1); } return a; }); };
  function kGambar() {
    const { c, w, h } = kanvas($('#cv-k')); if (!w) return; const C = warna(), L = 40, B = 30, T = 12, R = 16, y1 = 4.2, lg = Math.log10(NK);
    const X = n => L + Math.log10(n) / lg * (w - L - R), Y = v => T + (1 - v / y1) * (h - T - B);
    c.clearRect(0, 0, w, h); c.font = '11px Inter, sans-serif'; c.lineWidth = 1; c.strokeStyle = C.garis; c.fillStyle = C.redup; c.textAlign = 'right';
    for (let v = 0; v <= 4; v++) { c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(w - R, Y(v)); c.stroke(); c.fillText(v, L - 6, Y(v) + 4); }
    c.textAlign = 'center'; ['1', '10', '100', '1.000', '10.000'].forEach((t, i) => c.fillText(t, X(10 ** i), h - 9)); c.fillText('jumlah titik (n)', (L + w - R) / 2 + 60, h - 9);
    c.setLineDash([6, 4]); c.strokeStyle = C.hijau; c.lineWidth = 2; c.beginPath(); c.moveTo(L, Y(Math.PI)); c.lineTo(w - R, Y(Math.PI)); c.stroke(); c.setLineDash([]);
    c.fillStyle = C.hijau; c.textAlign = 'left'; c.font = '600 12px Inter, sans-serif'; c.fillText('π', L + 6, Y(Math.PI) - 6);
    c.save(); c.beginPath(); c.rect(L, T - 4, w - L - R, h - T - B + 8); c.clip();
    K.runs.forEach((a, j) => { c.strokeStyle = [C.a1, C.a2, C.emas][j]; c.lineWidth = 1.7; c.beginPath(); let on = false;
      for (let n = 1; n <= K.shown; n++) { const v = a[n - 1]; if (!isFinite(v)) { on = false; continue; } c[on ? 'lineTo' : 'moveTo'](X(n), Y(v)); on = true; } c.stroke(); });
    c.restore();
  }
  function kGo() { cancelAnimationFrame(K.raf); kData(); const t0 = performance.now();
    const tick = t => { const q = Math.min(1, (t - t0) / 4000); K.shown = Math.max(1, Math.round(10 ** (Math.log10(NK) * (1 - (1 - q) ** 2)))); kGambar(); if (q < 1) K.raf = requestAnimationFrame(tick); };
    K.raf = requestAnimationFrame(tick); }
  $('#k-go').onclick = () => { K.off += 100; kGo(); };
  lihat($('#fig-konv'), v => { if (v && !K.mulai) { K.mulai = true; kGo(); } });

  // ---------- Figur 3: animasi kode R hit or miss ----------
  const A = { rnd: null, pts: [], cur: null, nh: 0, fase: 0, run: false, last: 0, raf: 0 }, NA = 300;
  const BA = [...document.querySelectorAll('#fig-alg .baris')];
  const aSorot = ns => BA.forEach(b => b.classList.toggle('aktif', ns.includes(+b.dataset.b)));
  const aSetPlay = () => $('#a-play').textContent = A.run ? 'Jeda' : 'Putar';
  function aNext() {
    if (A.fase === 0 && A.pts.length >= NA) { A.run = false; aSetPlay(); aSorot([]); aTampil(); return; }
    if (A.fase === 0) { A.cur = [A.rnd(), A.rnd()]; aSorot([2, 3]); }
    else if (A.fase === 1) { const t = hit(A.cur[0], A.cur[1]); A.pts.push([A.cur[0], A.cur[1], t]); if (t) A.nh++; aSorot([4]); }
    else aSorot([5]);
    A.fase = (A.fase + 1) % 3; aTampil();
  }
  function aLoop(t) { if (!A.run) return; if (t - A.last >= 60) { A.last = t; aNext(); } if (A.run) A.raf = requestAnimationFrame(aLoop); }
  function aTampil() {
    const { c, w, h } = kanvas($('#cv-alg')); if (!w) return; const C = warna();
    const m = 12, k = Math.min(w, h) - 2 * m, ox = (w - k) / 2, oy = (h - k) / 2, X = x => ox + x * k, Y = y => oy + (1 - y) * k;
    c.clearRect(0, 0, w, h);
    c.fillStyle = C.a2 + '1f'; c.beginPath(); c.moveTo(X(0), Y(0)); c.arc(X(0), Y(0), k, -Math.PI / 2, 0); c.closePath(); c.fill();
    c.lineWidth = 1.5; c.strokeStyle = C.tinta2; c.strokeRect(X(0), Y(1), k, k);
    c.lineWidth = 2.5; c.strokeStyle = C.a2; c.beginPath(); c.arc(X(0), Y(0), k, -Math.PI / 2, 0); c.stroke();
    const r = 1.5; c.globalAlpha = .8;
    [[true, C.a2], [false, C.a1]].forEach(([jenis, col]) => { c.fillStyle = col; c.beginPath();
      for (const p of A.pts) if (p[2] === jenis) c.rect(X(p[0]) - r, Y(p[1]) - r, 2 * r, 2 * r);
      c.fill(); });
    c.globalAlpha = 1;
    const n = A.pts.length;
    if (n) { const p = A.pts[n - 1]; c.strokeStyle = C.emas; c.lineWidth = 2; c.beginPath(); c.arc(X(p[0]), Y(p[1]), 7, 0, TAU); c.stroke(); }
    const v = (id, x) => $(id).textContent = x;
    v('#a-n', f(n, 0)); v('#a-h', f(A.nh, 0)); v('#a-e', n ? f(4 * A.nh / n, 4) : '-');
  }
  function aReset() { cancelAnimationFrame(A.raf); A.rnd = rng(5); A.pts = []; A.cur = null; A.nh = 0; A.fase = 0; A.run = false; aSetPlay(); aSorot([]); aTampil(); }
  $('#a-play').onclick = () => { A.run = !A.run; aSetPlay(); cancelAnimationFrame(A.raf); A.last = 0; if (A.run) A.raf = requestAnimationFrame(aLoop); };
  $('#a-1').onclick = () => { A.run = false; aSetPlay(); cancelAnimationFrame(A.raf); do aNext(); while (A.fase); };
  $('#a-reset').onclick = aReset;

  // ---------- penyambung ----------
  const semua = () => { piTampil(); kGambar(); aTampil(); };
  addEventListener('resize', semua); document.addEventListener('tema', semua);
  piReset(); kData(); aReset(); semua();
})();
