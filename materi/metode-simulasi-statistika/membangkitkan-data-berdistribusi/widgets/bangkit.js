/* widgets/bangkit.js: lima figur interaktif materi Membangkitkan Data Berdistribusi */
(() => {
  const { warna, rng, kanvas, lihat } = Kit, $ = s => document.querySelector(s);
  const fmt = (v, d) => v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const PI = Math.PI, TAU = PI * 2;

  /* gambar kurva y = fn(x) pada [x0,x1] memakai pemetaan X() dan Y() */
  function plot(c, fn, x0, x1, X, Y, warnaGaris, lw, dash) {
    c.save(); c.setLineDash(dash || []); c.strokeStyle = warnaGaris; c.lineWidth = lw; c.lineJoin = 'round';
    c.beginPath(); let on = false;
    for (let i = 0; i <= 320; i++) {
      const x = x0 + (x1 - x0) * i / 320, v = fn(x);
      if (!isFinite(v)) { on = false; continue; }
      const px = X(x), py = Y(v);
      if (on) c.lineTo(px, py); else { c.moveTo(px, py); on = true; }
    }
    c.stroke(); c.restore();
  }
  const tulis = (id, isi) => { const el = $(id); if (el) el.textContent = isi; };

  /* ================= Figur 1: pengujian kandidat ================= */
  const F1 = x => 20 * x * Math.pow(1 - x, 3);   // Beta(2,4)
  const C1 = 135 / 64, YM1 = 2.5;
  const TURUN = 800, TAHAN = 1050, LUNTUR = 350, UMUR = TURUN + TAHAN + LUNTUR, JEDA = 2400;
  const T = { rnd: null, seed: 7, n: 0, na: 0, nr: 0, d: null, run: false, mulai: false, raf: 0, last: 0 };

  function tBaru() {
    if (T.d && !T.d.catat) tBuku();
    const y = T.rnd(), u = T.rnd();
    T.d = { y: y, u: u, h: u * C1, terima: u <= F1(y) / C1, t0: performance.now(), catat: false };
  }
  function tBuku() {
    const d = T.d; if (!d || d.catat) return;
    d.catat = true; T.n++;
    if (d.terima) T.na++; else T.nr++;
  }

  function tGambar() {
    const { c, w, h } = kanvas($('#cv-terima')); if (!w) return;
    const C = warna(), kini = performance.now();
    const L = 58, R = 16, Tp = 64, Bt = 26;
    const innerW = w - L - R, hA = h - Tp - Bt;
    const X = x => L + x * innerW, Y = v => (h - Bt) - (v / YM1) * hA;

    c.clearRect(0, 0, w, h);
    c.font = '11px Inter, sans-serif';

    /* kisi dan sumbu */
    c.strokeStyle = C.garis; c.lineWidth = 1; c.fillStyle = C.redup; c.textAlign = 'right';
    const langkah = hA < 210 ? 1 : 0.5;
    for (let v = 0; v <= YM1 + 1e-9; v += langkah) {
      const py = Y(v);
      c.beginPath(); c.moveTo(L, py); c.lineTo(w - R, py); c.stroke();
      c.fillText(fmt(v, 1), L - 6, py + 4);
    }
    c.save(); c.translate(11, Tp + hA / 2); c.rotate(-PI / 2);
    c.fillStyle = C.redup; c.font = '10px Inter, sans-serif'; c.textAlign = 'center';
    c.fillText('kepadatan', 0, 0);
    c.restore();

    c.strokeStyle = C.tinta2; c.beginPath(); c.moveTo(L, h - Bt); c.lineTo(w - R, h - Bt); c.stroke();
    c.textAlign = 'center'; c.fillStyle = C.redup;
    c.fillText('0', X(0), h - Bt + 15);
    c.fillText('1', X(1), h - Bt + 15);
    c.fillText('x', X(0.5), h - Bt + 15);

    /* kurva */
    plot(c, () => C1, 0, 1, X, Y, C.emas, 1.6, [6, 4]);
    plot(c, () => 1, 0, 1, X, Y, C.a1, 1.6);
    plot(c, F1, 0, 1, X, Y, C.a2, 2.6);
    c.textAlign = 'left'; c.font = '600 11px Inter, sans-serif';
    c.fillStyle = C.a2; c.fillText('f(x)', X(0.42), Y(F1(0.42)) - 8);
    c.fillStyle = C.a1; c.fillText('g(x)', X(0.72), Y(1) - 7);
    c.fillStyle = C.emas; c.fillText('c g(x)', X(0.72), Y(C1) - 7);

    /* batang uji dan satu kandidat */
    const d = T.d;
    if (d) {
      const umur = kini - d.t0;
      if (umur >= TURUN) tBuku();
      const jatuh = umur < TURUN;
      const e = jatuh ? 1 - Math.pow(1 - Math.max(0, umur) / TURUN, 2) : 1;
      const px = X(d.y), fY = F1(d.y);
      const py = Y(C1 + (d.h - C1) * e);
      const alfa = umur <= TURUN + TAHAN ? 1 : Math.max(0, 1 - (umur - TURUN - TAHAN) / LUNTUR);
      const bw = Math.max(6, Math.min(10, innerW * 0.014)), bx = Math.min(Math.max(px - bw / 2, L), w - R - bw);

      /* hijau: daerah terima di bawah f(Y); merah: daerah tolak di atasnya */
      c.globalAlpha = .26 * alfa;
      c.fillStyle = C.hijau; c.fillRect(bx, Y(fY), bw, (h - Bt) - Y(fY));
      c.fillStyle = C.a2; c.fillRect(bx, Y(C1), bw, Y(fY) - Y(C1));
      c.globalAlpha = .6 * alfa; c.lineWidth = 1;
      c.strokeStyle = C.hijau;
      c.strokeRect(bx + .5, Y(fY) + .5, bw - 1, (h - Bt) - Y(fY) - 1);
      if (Y(fY) - Y(C1) > 2) {
        c.strokeStyle = C.a2;
        c.strokeRect(bx + .5, Y(C1) + .5, bw - 1, Y(fY) - Y(C1) - 1);
      }

      c.globalAlpha = alfa;
      c.fillStyle = jatuh ? C.emas : (d.terima ? C.hijau : C.a2);
      c.beginPath(); c.arc(px, py, 4.6, 0, TAU); c.fill();
      if (!jatuh) {
        c.strokeStyle = c.fillStyle; c.lineWidth = 1.4;
        if (d.terima) { c.beginPath(); c.arc(px, py, 8, 0, TAU); c.stroke(); }
        else {
          const r = 5.4;
          c.beginPath();
          c.moveTo(px - r, py - r); c.lineTo(px + r, py + r);
          c.moveTo(px + r, py - r); c.lineTo(px - r, py + r);
          c.stroke();
        }
      }
      c.globalAlpha = 1;

      /* keterangan angka */
      const selesai = umur >= TURUN;
      c.textAlign = 'left'; c.font = '600 12px Inter, sans-serif'; c.fillStyle = C.tinta2;
      c.fillText('Y = ' + fmt(d.y, 2) + '    U = ' + fmt(d.u, 2) + '    tinggi = ' + fmt(d.h, 2), L, 22);
      c.font = '700 13px Inter, sans-serif';
      c.fillStyle = selesai ? (d.terima ? C.hijau : C.a2) : C.redup;
      c.fillText('Status: ' + (selesai ? (d.terima ? 'DITERIMA' : 'DITOLAK') : 'diuji'), L, 46);
      c.textAlign = 'right'; c.font = '11px Inter, sans-serif'; c.fillStyle = C.redup;
      c.fillText('ambang = ' + fmt(fY / C1, 2), w - R, 46);
    } else {
      c.textAlign = 'left'; c.font = '11px Inter, sans-serif'; c.fillStyle = C.redup;
      c.fillText('Tekan Putar atau +1 kandidat untuk memulai.', L, 30);
    }

    tulis('#t-n', fmt(T.n, 0)); tulis('#t-a', fmt(T.na, 0)); tulis('#t-r', fmt(T.nr, 0));
    tulis('#t-p', T.n ? fmt(100 * T.na / T.n, 1) + '%' : '-');
  }

  const tSetPlay = () => $('#t-play').textContent = T.run ? 'Jeda' : 'Putar';
  function tFrame() {
    const kini = performance.now();
    if (T.run && kini - T.last >= JEDA) { T.last = kini; tBaru(); }
    tGambar();
    if (T.run || (T.d && kini - T.d.t0 < UMUR)) T.raf = requestAnimationFrame(tFrame);
    else T.raf = 0;
  }
  function tHentikan() { cancelAnimationFrame(T.raf); T.raf = 0; }
  function tJalan() { if (!T.raf) { T.last = 0; T.raf = requestAnimationFrame(tFrame); } }
  function tReset() {
    tHentikan();
    T.rnd = rng(T.seed); T.n = 0; T.na = 0; T.nr = 0; T.d = null; T.run = false;
    tSetPlay(); tGambar();
  }
  $('#t-play').onclick = () => { T.run = !T.run; tSetPlay(); tJalan(); };
  $('#t-1').onclick = () => { T.run = false; tSetPlay(); tBaru(); tJalan(); };
  $('#t-reset').onclick = tReset;
  $('#t-seed').onclick = () => { T.seed += 23; tReset(); };
  lihat($('#fig-terima'), on => {
    if (on && !T.mulai) { T.mulai = true; T.run = true; tSetPlay(); tJalan(); }
    if (!on && T.run) { T.run = false; tSetPlay(); }
  });

  /* ================= Figur 1b: dua syarat dalam empat panel ================= */
  const FSY = x => 20 * x * Math.pow(1 - x, 3), YMS = 2.6;

  function arsir(c, xa, xb, atas, bawah, X, Y, warnaIsi) {
    const N = 80;
    c.save(); c.beginPath();
    for (let i = 0; i <= N; i++) {
      const x = xa + (xb - xa) * i / N;
      i ? c.lineTo(X(x), Y(atas(x))) : c.moveTo(X(x), Y(atas(x)));
    }
    for (let i = N; i >= 0; i--) c.lineTo(X(xa + (xb - xa) * i / N), Y(bawah(xa + (xb - xa) * i / N)));
    c.closePath();
    c.fillStyle = warnaIsi; c.globalAlpha = .15; c.fill();
    c.globalAlpha = .55; c.strokeStyle = warnaIsi; c.lineWidth = 1; c.stroke();
    c.restore();
  }

  function gambarSyarat(el, o) {
    const { c, w, h } = kanvas(el); if (!w) return;
    const C = warna();
    const L = 26, R = 14, Tp = 22, B = 24;
    const X = x => L + x * (w - L - R);
    const Y = v => (h - B) - (v / YMS) * (h - B - Tp);

    c.clearRect(0, 0, w, h);

    /* kisi ringan */
    c.strokeStyle = C.garis; c.lineWidth = 1;
    [0.5, 1, 1.5, 2, 2.5].forEach(v => {
      c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(w - R, Y(v)); c.stroke();
    });

    /* daerah yang dilanggar syaratnya */
    if (o.langgar) arsir(c, o.langgar[0], o.langgar[1], o.atas, o.bawah, X, Y, C.a2);

    /* batas atas, proposal, target */
    if (o.cg !== undefined) {
      plot(c, () => o.cg, 0, 1, X, Y, C.emas, 1.5, [5, 4]);
      c.fillStyle = C.emas; c.textAlign = 'right'; c.font = '600 9px Inter, sans-serif';
      c.fillText('c g = ' + fmt(o.cg, 2), w - R - 1, Y(o.cg) - 5);
    }
    plot(c, o.g, 0, 1, X, Y, C.a1, 1.7);
    plot(c, FSY, 0, 1, X, Y, C.a2, 2.4);

    /* penanda titik singgung */
    if (o.titik) {
      c.fillStyle = C.emas; c.beginPath(); c.arc(X(o.titik[0]), Y(o.titik[1]), 3.6, 0, TAU); c.fill();
      c.strokeStyle = C.kertas; c.lineWidth = 1.4; c.stroke();
    }

    /* keterangan di dalam daerah yang diarsir */
    if (o.catat) {
      c.textAlign = 'center'; c.font = '600 9.5px Inter, sans-serif';
      c.fillStyle = o.catatWarna === 'a1' ? C.a1 : C.a2;
      c.fillText(o.catat, X(o.cx), Y(o.cy));
    }

    /* legenda kecil di kiri atas */
    let lx = L;
    const leg = [['f', C.a2, null], ['g', C.a1, null]];
    if (o.cg !== undefined) leg.push(['c g', C.emas, [4, 3]]);
    c.font = '600 9px Inter, sans-serif'; c.textAlign = 'left';
    leg.forEach(it => {
      c.strokeStyle = it[1]; c.lineWidth = 1.8; c.setLineDash(it[2] || []);
      c.beginPath(); c.moveTo(lx, 10); c.lineTo(lx + 13, 10); c.stroke(); c.setLineDash([]);
      c.fillStyle = C.tinta2; c.fillText(it[0], lx + 17, 13);
      lx += it[0] === 'c g' ? 44 : 34;
    });

    /* sumbu */
    c.strokeStyle = C.tinta2; c.lineWidth = 1;
    c.beginPath(); c.moveTo(L, h - B); c.lineTo(w - R, h - B); c.stroke();
    c.fillStyle = C.redup; c.font = '10px Inter, sans-serif'; c.textAlign = 'center';
    c.fillText('0', L, h - B + 14); c.fillText('1', w - R, h - B + 14);
  }

  const SY = [
    ['#cv-s1a', { g: () => 1 }],
    ['#cv-s1b', {
      g: x => x >= 0.4 ? 1 / 0.6 : 0,
      langgar: [0, 0.4], atas: FSY, bawah: () => 0,
      catat: 'g = 0', catatWarna: 'a1', cx: 0.19, cy: 1.12
    }],
    ['#cv-s2a', { g: () => 1, cg: 135 / 64, titik: [0.25, 135 / 64] }],
    ['#cv-s2b', {
      g: () => 1, cg: 1.6,
      langgar: [0.1157, 0.4284], atas: FSY, bawah: () => 1.6,
      catat: 'f > c g', cx: 0.272, cy: 1.86
    }]
  ];
  const syaratSemua = () => SY.forEach(([sel, o]) => gambarSyarat($(sel), o));

  /* ================= Figur 2: penelusuran algoritma ================= */
  const J = { rnd: null, fase: 0, y: 0, u: 0, amb: 0, ok: false, run: false, raf: 0, last: 0, mulai: false };
  const BJ = [...document.querySelectorAll('#fig-jejak .baris')];
  const jSorot = ns => BJ.forEach(b => b.classList.toggle('aktif', ns.includes(+b.dataset.b)));
  const jSetPlay = () => $('#j-play').textContent = J.run ? 'Jeda' : 'Putar';

  function jTick() {
    if (J.fase === 0) {
      J.y = J.rnd(); J.u = J.rnd();
      J.amb = (256 / 27) * J.y * Math.pow(1 - J.y, 3);
      J.ok = J.u <= J.amb;
      jSorot([4, 5, 6]); J.fase = 1;
    } else if (J.fase === 1) {
      jSorot(J.ok ? [7, 8] : [6]); J.fase = 2;
    } else {
      jSorot([]); J.fase = 0;
    }
    jTampil();
  }
  function jFrame(t) {
    if (J.run && t - J.last >= 700) { J.last = t; jTick(); }
    if (J.run) J.raf = requestAnimationFrame(jFrame);
  }
  function jTampil() {
    const { c, w, h } = kanvas($('#cv-jejak')); if (!w) return;
    const C = warna();
    c.clearRect(0, 0, w, h);
    const L = 34, R = 34, cy = h * 0.52, bw = w - L - R, amb = J.amb;
    const pxA = L + bw * amb;

    c.font = '10px Inter, sans-serif'; c.textAlign = 'left'; c.fillStyle = C.redup;
    c.fillText('posisi U pada selang 0 sampai 1', L, 13);

    c.globalAlpha = .16; c.fillStyle = C.hijau;
    c.fillRect(L, cy - 15, bw * amb, 30);
    c.fillStyle = C.a2; c.fillRect(pxA, cy - 15, bw * (1 - amb), 30);
    c.globalAlpha = 1;

    c.strokeStyle = C.garis; c.lineWidth = 1; c.strokeRect(L, cy - 15, bw, 30);
    c.strokeStyle = C.tinta; c.lineWidth = 2;
    c.beginPath(); c.moveTo(pxA, cy - 21); c.lineTo(pxA, cy + 21); c.stroke();

    if (J.y) {
      const px = L + bw * J.u;
      c.fillStyle = C.emas; c.beginPath(); c.arc(px, cy, 7, 0, TAU); c.fill();
      c.strokeStyle = C.kertas; c.lineWidth = 1.5; c.stroke();
      c.textAlign = 'center'; c.font = '600 10px Inter, sans-serif'; c.fillStyle = C.tinta2;
      const pxT = Math.max(L + 30, Math.min(w - R - 30, px));
      c.fillText('U = ' + fmt(J.u, 3), pxT, cy + 32);
    }

    c.font = '11px Inter, sans-serif'; c.textAlign = 'center'; c.fillStyle = C.redup;
    c.fillText('0', L, cy + 48); c.fillText('1', L + bw, cy + 48);

    c.font = '600 10px Inter, sans-serif';
    if (amb > 0.14) { c.fillStyle = C.hijau; c.fillText('diterima', L + bw * amb / 2, cy + 4); }
    if (amb < 0.86) { c.fillStyle = C.a2; c.fillText('ditolak', pxA + bw * (1 - amb) / 2, cy + 4); }

    c.textAlign = 'center'; c.font = '600 10px Inter, sans-serif'; c.fillStyle = C.tinta2;
    const pxL = Math.max(L + 44, Math.min(w - R - 44, pxA));
    c.fillText('ambang ' + fmt(amb, 3), pxL, cy - 27);
    c.strokeStyle = C.tinta2; c.lineWidth = 1; c.beginPath();
    c.moveTo(pxA, cy - 21); c.lineTo(pxL, cy - 24); c.stroke();

    tulis('#j-y', J.y ? fmt(J.y, 4) : '-');
    tulis('#j-u', J.y ? fmt(J.u, 4) : '-');
    tulis('#j-a', J.y ? fmt(amb, 4) : '-');
    const st = $('#j-s');
    st.textContent = J.y ? (J.ok ? 'diterima' : 'ditolak') : '-';
    st.style.color = J.y ? (J.ok ? C.hijau : C.a2) : '';
  }
  function jReset() {
    cancelAnimationFrame(J.raf);
    J.rnd = rng(29); J.fase = 0; J.y = 0; J.u = 0; J.amb = 0; J.ok = false; J.run = false;
    jSetPlay(); jSorot([]); jTampil();
  }
  $('#j-play').onclick = () => { J.run = !J.run; jSetPlay(); cancelAnimationFrame(J.raf); J.last = 0; if (J.run) J.raf = requestAnimationFrame(jFrame); };
  $('#j-1').onclick = () => { J.run = false; jSetPlay(); cancelAnimationFrame(J.raf); do { jTick(); } while (J.fase !== 0); };
  $('#j-reset').onclick = jReset;
  lihat($('#fig-jejak'), on => { if (on && !J.mulai) { J.mulai = true; J.run = true; jSetPlay(); J.last = 0; J.raf = requestAnimationFrame(jFrame); } if (!on && J.run) { J.run = false; jSetPlay(); } });

  /* ================= Figur 3: hasil Beta(2,4) ================= */
  const FB = x => 20 * x * Math.pow(1 - x, 3);
  const B = { rnd: null, vals: [], seed: 5, run: false, raf: 0, last: 0, mulai: false, NMAX: 6000, NB: 36, YM: 2.5 };

  function bSatu() {
    for (;;) {
      const y = B.rnd(), u = B.rnd();
      if (u <= (256 / 27) * y * Math.pow(1 - y, 3)) return y;
    }
  }
  function bTambah(k) {
    for (let i = 0; i < k && B.vals.length < B.NMAX; i++) B.vals.push(bSatu());
  }
  function bGambar() {
    const { c, w, h } = kanvas($('#cv-beta')); if (!w) return;
    const C = warna(), L = 44, R = 16, Tp = 14, Bt = 28;
    const X = x => L + x * (w - L - R), Y = v => (h - Bt) - (v / B.YM) * (h - Bt - Tp);

    c.clearRect(0, 0, w, h);
    c.font = '11px Inter, sans-serif';
    c.strokeStyle = C.garis; c.lineWidth = 1; c.fillStyle = C.redup; c.textAlign = 'right';
    for (let v = 0; v <= 2.5001; v += 0.5) {
      const py = Y(v);
      c.beginPath(); c.moveTo(L, py); c.lineTo(w - R, py); c.stroke();
      c.fillText(fmt(v, 1), L - 6, py + 4);
    }

    const n = B.vals.length, bins = new Float32Array(B.NB);
    for (const v of B.vals) bins[Math.min(B.NB - 1, Math.floor(v * B.NB))]++;
    const bw = (w - L - R) / B.NB;
    if (n) {
      c.fillStyle = C.hijau; c.globalAlpha = .32;
      for (let i = 0; i < B.NB; i++) {
        const d = bins[i] / (n / B.NB); if (d <= 0) continue;
        const py = Y(Math.min(d, B.YM));
        c.fillRect(X(i / B.NB) + 0.7, py, bw - 1.4, (h - Bt) - py);
      }
      c.globalAlpha = 1;
    }
    plot(c, FB, 0, 1, X, Y, C.a2, 2.4);
    c.strokeStyle = C.tinta2; c.lineWidth = 1;
    c.beginPath(); c.moveTo(L, h - Bt); c.lineTo(w - R, h - Bt); c.stroke();
    c.fillStyle = C.redup; c.textAlign = 'center';
    c.fillText('0', X(0), h - Bt + 15); c.fillText('1', X(1), h - Bt + 15); c.fillText('x', X(0.5), h - Bt + 15);

    let s = 0, s2 = 0;
    for (const v of B.vals) { s += v; s2 += v * v; }
    const m = n ? s / n : NaN, sd = n > 1 ? Math.sqrt((s2 - n * m * m) / (n - 1)) : NaN;
    tulis('#b-n', fmt(n, 0));
    tulis('#b-m', n ? fmt(m, 4) : '-');
    tulis('#b-s', n > 1 ? fmt(sd, 4) : '-');
  }
  const bSetPlay = () => $('#b-play').textContent = B.run ? 'Jeda' : 'Putar';
  function bFrame(t) {
    if (B.run && t - B.last >= 40) { B.last = t; bTambah(24); bGambar(); if (B.vals.length >= B.NMAX) { B.run = false; bSetPlay(); } }
    if (B.run) B.raf = requestAnimationFrame(bFrame);
  }
  function bReset() {
    cancelAnimationFrame(B.raf);
    B.rnd = rng(B.seed); B.vals = []; B.run = false; bSetPlay(); bGambar();
  }
  $('#b-play').onclick = () => { B.run = !B.run; bSetPlay(); cancelAnimationFrame(B.raf); B.last = 0; if (B.run) B.raf = requestAnimationFrame(bFrame); };
  $('#b-100').onclick = () => { bTambah(100); bGambar(); };
  $('#b-1000').onclick = () => { bTambah(1000); bGambar(); };
  $('#b-reset').onclick = bReset;
  $('#b-seed').onclick = () => { B.seed += 31; bReset(); };
  lihat($('#fig-beta'), on => { if (on && !B.mulai) { B.mulai = true; B.run = true; bSetPlay(); B.last = 0; B.raf = requestAnimationFrame(bFrame); } if (!on && B.run) { B.run = false; bSetPlay(); } });

  /* ================= Figur 4: setengah-normal dan tanda ================= */
  const NH = { rnd: null, vals: [], seed: 13, run: false, raf: 0, last: 0, mulai: false, tanda: false, NMAX: 6000, NB: 44 };
  const phi = x => Math.exp(-x * x / 2) / Math.sqrt(2 * PI);

  function nSatu() {
    for (;;) {
      const y = -Math.log(1 - NH.rnd());       // eksponensial rataan 1
      const u = NH.rnd();
      if (u <= Math.exp(-((y - 1) * (y - 1)) / 2)) {
        return { v: y, s: NH.rnd() < 0.5 ? -1 : 1 };
      }
    }
  }
  function nTambah(k) {
    for (let i = 0; i < k && NH.vals.length < NH.NMAX; i++) NH.vals.push(nSatu());
  }
  function nGambar() {
    const { c, w, h } = kanvas($('#cv-normal')); if (!w) return;
    const C = warna(), L = 44, R = 16, Tp = 14, Bt = 28;
    const x0 = NH.tanda ? -4 : 0, x1 = 4, YM = NH.tanda ? 0.45 : 0.9;
    const X = x => L + (x - x0) / (x1 - x0) * (w - L - R);
    const Y = v => (h - Bt) - (v / YM) * (h - Bt - Tp);

    c.clearRect(0, 0, w, h);
    c.font = '11px Inter, sans-serif';
    c.strokeStyle = C.garis; c.lineWidth = 1; c.fillStyle = C.redup; c.textAlign = 'right';
    const langkahY = NH.tanda ? 0.1 : 0.2;
    for (let v = 0; v <= YM + 1e-9; v += langkahY) {
      const py = Y(v);
      c.beginPath(); c.moveTo(L, py); c.lineTo(w - R, py); c.stroke();
      c.fillText(fmt(v, 1), L - 6, py + 4);
    }

    const bins = new Float32Array(NH.NB), lebar = (x1 - x0) / NH.NB;
    const nilai = NH.vals.map(o => NH.tanda ? o.v * o.s : o.v);
    for (const v of nilai) {
      const i = Math.floor((v - x0) / lebar);
      if (i >= 0 && i < NH.NB) bins[i]++;
    }
    const n = nilai.length, bw = (w - L - R) / NH.NB;
    if (n) {
      c.fillStyle = C.hijau; c.globalAlpha = .32;
      for (let i = 0; i < NH.NB; i++) {
        const d = bins[i] / (n * lebar); if (d <= 0) continue;
        const py = Y(Math.min(d, YM));
        c.fillRect(X(x0 + i * lebar) + 0.6, py, bw - 1.2, (h - Bt) - py);
      }
      c.globalAlpha = 1;
    }
    plot(c, x => (NH.tanda ? phi(x) : 2 * phi(x)), x0, x1, X, Y, C.a2, 2.4);
    c.strokeStyle = C.tinta2; c.lineWidth = 1;
    c.beginPath(); c.moveTo(L, h - Bt); c.lineTo(w - R, h - Bt); c.stroke();
    c.fillStyle = C.redup; c.textAlign = 'center';
    for (let v = x0; v <= x1; v += 1) c.fillText(String(v).replace('-', '−'), X(v), h - Bt + 15);
    c.fillText('x', X((x0 + x1) / 2), h - Bt + 15);

    let s = 0, s2 = 0;
    for (const v of nilai) { s += v; s2 += v * v; }
    const m = n ? s / n : NaN, sd = n > 1 ? Math.sqrt((s2 - n * m * m) / (n - 1)) : NaN;
    tulis('#n-n', fmt(n, 0));
    tulis('#n-m', n ? fmt(m, 4) : '-');
    tulis('#n-s', n > 1 ? fmt(sd, 4) : '-');
  }
  const nSetPlay = () => $('#n-play').textContent = NH.run ? 'Jeda' : 'Putar';
  function nFrame(t) {
    if (NH.run && t - NH.last >= 40) { NH.last = t; nTambah(24); nGambar(); if (NH.vals.length >= NH.NMAX) { NH.run = false; nSetPlay(); } }
    if (NH.run) NH.raf = requestAnimationFrame(nFrame);
  }
  function nReset() {
    cancelAnimationFrame(NH.raf);
    NH.rnd = rng(NH.seed); NH.vals = []; NH.run = false; nSetPlay(); nGambar();
  }
  $('#n-play').onclick = () => { NH.run = !NH.run; nSetPlay(); cancelAnimationFrame(NH.raf); NH.last = 0; if (NH.run) NH.raf = requestAnimationFrame(nFrame); };
  $('#n-100').onclick = () => { nTambah(100); nGambar(); };
  $('#n-1000').onclick = () => { nTambah(1000); nGambar(); };
  $('#n-sign').onclick = () => { NH.tanda = !NH.tanda; $('#n-sign').classList.toggle('p', NH.tanda); nGambar(); };
  $('#n-reset').onclick = nReset;
  lihat($('#fig-normal'), on => { if (on && !NH.mulai) { NH.mulai = true; NH.run = true; nSetPlay(); NH.last = 0; NH.raf = requestAnimationFrame(nFrame); } if (!on && NH.run) { NH.run = false; nSetPlay(); } });

  /* ================= Figur 5: pengaruh lambda ================= */
  const cLam = l => Math.sqrt(2 / PI) / l * Math.exp(l * l / 2);
  function eGambar() {
    const { c, w, h } = kanvas($('#cv-efisien')); if (!w) return;
    const C = warna(), l = +$('#e-lam').value, cv = cLam(l);
    const L = 44, R = 16, Tp = 14, Bt = 30;
    const tegak = w < 560;                       // layar sempit: dua panel ditumpuk
    let kiri, kanan;
    if (tegak) {
      const mid = Tp + (h - Tp - Bt) * 0.52;
      kiri = { x0: L, x1: w - R, y0: Tp, y1: mid - 16 };
      kanan = { x0: L, x1: w - R, y0: mid + 22, y1: h - Bt };
    } else {
      const wKiri = (w - L - R) * 0.60;
      kiri = { x0: L, x1: L + wKiri - 26, y0: Tp, y1: h - Bt };
      kanan = { x0: L + wKiri + 20, x1: w - R, y0: Tp, y1: h - Bt };
    }

    c.clearRect(0, 0, w, h);
    c.font = '11px Inter, sans-serif';

    /* panel kiri: f, g, dan batas atas */
    const puncak = Math.max(1.05, cv * l * 1.06);
    const langkah = puncak <= 1.5 ? 0.25 : puncak <= 3.5 ? 0.5 : 1;
    const YM = Math.ceil(puncak / langkah) * langkah;
    const X = x => kiri.x0 + (x / 6) * (kiri.x1 - kiri.x0);
    const Y = v => kiri.y1 - (v / YM) * (kiri.y1 - kiri.y0);

    c.strokeStyle = C.garis; c.lineWidth = 1; c.fillStyle = C.redup; c.textAlign = 'right';
    for (let v = 0; v <= YM + 1e-9; v += langkah) {
      const py = Y(v);
      c.beginPath(); c.moveTo(kiri.x0, py); c.lineTo(kiri.x1, py); c.stroke();
      c.fillText(fmt(v, langkah < 1 ? 2 : 1).replace(',00', ',0'), kiri.x0 - 6, py + 4);
    }
    plot(c, x => cv * l * Math.exp(-l * x), 0, 6, X, Y, C.emas, 1.6, [6, 4]);
    plot(c, x => l * Math.exp(-l * x), 0, 6, X, Y, C.a1, 1.6);
    plot(c, x => Math.sqrt(2 / PI) * Math.exp(-x * x / 2), 0, 6, X, Y, C.a2, 2.6);

    c.strokeStyle = C.tinta2; c.lineWidth = 1;
    c.beginPath(); c.moveTo(kiri.x0, kiri.y1); c.lineTo(kiri.x1, kiri.y1); c.stroke();
    c.fillStyle = C.redup; c.textAlign = 'center';
    c.fillText('0', X(0), kiri.y1 + 15); c.fillText('6', X(6), kiri.y1 + 15); c.fillText('x', X(3), kiri.y1 + 15);

    /* legenda di sudut kanan atas panel kiri */
    const lx = kiri.x1 - 72, ly = kiri.y0 + 12;
    [['f(x)', C.a2], ['g(x)', C.a1], ['c g(x)', C.emas]].forEach(([t, col], i) => {
      c.fillStyle = col; c.fillRect(lx, ly + i * 14 - 4, 12, 2.5);
      c.fillStyle = C.tinta2; c.textAlign = 'left'; c.font = '600 10px Inter, sans-serif';
      c.fillText(t, lx + 17, ly + i * 14);
    });

    /* panel kanan: c sebagai fungsi lambda */
    const lmin = 0.4, lmax = 2, cminY = 1, cmaxY = 3.2;
    const RX = v => kanan.x0 + (v - lmin) / (lmax - lmin) * (kanan.x1 - kanan.x0);
    const RY = v => kanan.y1 - (v - cminY) / (cmaxY - cminY) * (kanan.y1 - kanan.y0);

    c.strokeStyle = C.garis; c.fillStyle = C.redup; c.textAlign = 'right'; c.font = '11px Inter, sans-serif';
    for (let v = 1; v <= 3.0001; v += 1) {
      const py = RY(v);
      c.beginPath(); c.moveTo(kanan.x0, py); c.lineTo(kanan.x1, py); c.stroke();
      c.fillText(fmt(v, 0), kanan.x0 - 6, py + 4);
    }
    c.strokeStyle = C.tinta2;
    c.beginPath(); c.moveTo(kanan.x0, kanan.y1); c.lineTo(kanan.x1, kanan.y1); c.stroke();
    c.fillStyle = C.redup; c.textAlign = 'center';
    [0.5, 1, 1.5, 2].forEach(v => c.fillText(fmt(v, 1), RX(v), kanan.y1 + 15));
    c.fillText('λ', (kanan.x0 + kanan.x1) / 2, kanan.y1 + (tegak ? 27 : 27));

    plot(c, cLam, lmin, lmax, RX, RY, C.a1, 2);

    /* penanda lambda saat ini */
    c.strokeStyle = C.emas; c.lineWidth = 1.2; c.setLineDash([4, 3]);
    c.beginPath(); c.moveTo(RX(l), kanan.y0); c.lineTo(RX(l), kanan.y1); c.stroke(); c.setLineDash([]);
    c.fillStyle = C.emas; c.beginPath(); c.arc(RX(l), RY(cv), 4.5, 0, TAU); c.fill();

    tulis('#e-c', fmt(cv, 3));
    tulis('#e-p', fmt(100 / cv, 1) + '%');
  }
  $('#e-lam').addEventListener('input', eGambar);

  /* ================= penyambung ================= */
  const semua = () => { tGambar(); syaratSemua(); jTampil(); bGambar(); nGambar(); eGambar(); };
  addEventListener('resize', semua);
  document.addEventListener('tema', semua);

  tReset(); jReset(); bReset(); nReset(); semua();
})();
