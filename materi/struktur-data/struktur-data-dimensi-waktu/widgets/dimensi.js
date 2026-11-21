/* widgets/dimensi.js: kisi unit dan waktu untuk empat struktur data */
(() => {
  const { warna, kanvas } = Kit, $ = s => document.querySelector(s);
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FONT = '"IBM Plex Sans", sans-serif';
  const N = 6, T = 8, TMAX = 9;             // sumbu waktu 0..9, sel panel t=1..8
  const LONG = [                             // waktu audit tiap cabang
    [0, 1.5, 4, 8.5],
    [0, 3, 7.5],
    [0, 3],
    [0, 1, 3.5, 6, 9],
    [0, 2.5, 5.5, 8],
    [0, 4.5, 7],
  ];
  const HILANG = new Set(['5,7', '5,8', '6,6', '6,7', '6,8']); // panel tak seimbang
  const WARNA_UNIT = ['a1', 'a2', 'emas', 'hijau', 'a1', 'a2'];
  const CATATAN = {
    cs: 'banyak unit diamati pada 1 titik waktu',
    ts: '1 unit diamati pada banyak titik waktu tetap',
    long: 'subjek sama diamati berulang, jarak waktu bisa bervariasi',
    panel: 'kasus khusus longitudinal, unit sama pada periode tetap',
  };

  const D = {
    mode: 'panel',
    balanced: true,
    anim: 1,
    ub: 0,
    raf: 0,
    rafUb: 0,
  };

  const teks = (id, isi) => { const el = $(id); if (el) el.textContent = isi; };

  function kotak(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r);
    else c.rect(x, y, w, h);
  }

  function panah(c, x1, y1, x2, y2, kepala = 5) {
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - kepala * Math.cos(a - .42), y2 - kepala * Math.sin(a - .42));
    c.moveTo(x2, y2);
    c.lineTo(x2 - kepala * Math.cos(a + .42), y2 - kepala * Math.sin(a + .42));
    c.stroke();
  }

  function bungkus(c, isi, x, y, lebar, lh) {
    const kata = isi.split(' ');
    let baris = '', yy = y;
    for (const k of kata) {
      const coba = baris ? baris + ' ' + k : k;
      if (baris && c.measureText(coba).width > lebar) {
        c.fillText(baris, x, yy);
        baris = k; yy += lh;
      } else baris = coba;
    }
    if (baris) c.fillText(baris, x, yy);
  }

  function gambar() {
    const cv = $('#cv-dimensi');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();
    const L = w < 430 ? 40 : 44, R = 14, Atas = 46, Bawah = 34;
    const pw = Math.max(1, w - L - R), ph = Math.max(1, h - Atas - Bawah);
    const X = t => L + (t / TMAX) * pw;
    const Y = i => Atas + (N - i + .5) * (ph / N);
    const rowH = ph / N;
    const cw = (pw / TMAX) * .78;
    const ch = rowH * .68;
    const alphaDasar = .13;

    c.clearRect(0, 0, w, h);
    c.font = `10px ${FONT}`;
    c.textBaseline = 'middle';

    /* catatan kiri atas, berganti sesuai mode */
    if (!window.__tanpaCatatan) {
      c.font = `600 ${w < 430 ? 9 : 10}px ${FONT}`;
      c.fillStyle = C.emas; c.textAlign = 'left'; c.textBaseline = 'top';
      bungkus(c, CATATAN[D.mode], L + 2, 6, pw - 2, 12);
    }

    /* sumbu dan kisi */
    c.font = `10px ${FONT}`;
    c.strokeStyle = C.garis; c.lineWidth = 1;
    for (let t = 0; t <= TMAX; t++) {
      c.beginPath(); c.moveTo(X(t), Atas); c.lineTo(X(t), Atas + ph); c.stroke();
      c.fillStyle = C.redup; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(t), X(t), h - 12);
    }
    for (let i = 1; i <= N; i++) {
      c.beginPath(); c.moveTo(L, Y(i)); c.lineTo(L + pw, Y(i)); c.stroke();
      c.fillStyle = C.redup; c.textAlign = 'right'; c.textBaseline = 'middle';
      c.fillText('i=' + i, L - 7, Y(i));
    }
    c.fillStyle = C.redup; c.textAlign = 'center';
    c.fillText('waktu (t)', L + pw / 2, h - 27);
    c.save();
    c.translate(9, Atas + ph / 2); c.rotate(-Math.PI / 2);
    c.fillStyle = C.redup; c.fillText('unit (i)', 0, 0);
    c.restore();

    /* sel yang selalu tampak samar */
    const sel = (i, t, alfa, warna) => {
      c.globalAlpha = alfa;
      c.fillStyle = warna;
      kotak(c, X(t) - cw / 2, Y(i) - ch / 2, cw, ch, 3);
      c.fill();
      c.globalAlpha = 1;
    };

    if (D.mode === 'cs') {
      for (let i = 1; i <= N; i++) for (let t = 1; t <= T; t++) sel(i, t, alphaDasar, C.a1);
      const a = REDUCE ? 1 : D.anim;
      for (let i = 1; i <= N; i++) sel(i, 6, .82 * a, C.a1);
      c.strokeStyle = C.emas; c.lineWidth = 1.6; c.globalAlpha = .9 * a;
      const bx = X(6) + cw / 2 + 4;
      c.beginPath(); c.moveTo(bx, Y(1)); c.lineTo(bx, Y(N)); c.stroke();
      penandaArah(c, bx, Y(1), 0, 5);
      penandaArah(c, bx, Y(N), 0, -5);
      c.globalAlpha = 1;
      teks('#d-mode', 'Cross-Section'); teks('#d-sel', '6'); teks('#d-n', '6'); teks('#d-t', '1');
      teks('#d-ket', 'Cross-section: satu kolom penuh. Semua cabang diamati pada bulan yang sama.');
    } else if (D.mode === 'ts') {
      for (let i = 1; i <= N; i++) for (let t = 1; t <= T; t++) sel(i, t, alphaDasar, C.a1);
      const a = REDUCE ? 1 : D.anim;
      const n = Math.max(1, Math.round(a * T));
      for (let t = 1; t <= n; t++) sel(1, t, .86, C.a1);
      c.strokeStyle = C.emas; c.lineWidth = 1.7;
      for (let t = 1; t < n; t++) {
        panah(c, X(t) + cw / 2 + 1, Y(1), X(t + 1) - cw / 2 - 1, Y(1), 4);
      }
      teks('#d-mode', 'Time Series'); teks('#d-sel', String(n)); teks('#d-n', '1'); teks('#d-t', '8');
      teks('#d-ket', 'Time series: satu baris penuh. Urutan waktu tidak dapat dipertukarkan.');
    } else if (D.mode === 'long') {
      const a = REDUCE ? 1 : D.anim;
      c.strokeStyle = C.garis; c.lineWidth = 1;
      for (let i = 1; i <= N; i++) {
        c.beginPath(); c.moveTo(L, Y(i)); c.lineTo(L + pw, Y(i)); c.stroke();
      }
      let total = 0;
      LONG.forEach((arr, i) => {
        const y = Y(i + 1), col = C[WARNA_UNIT[i]];
        c.strokeStyle = col; c.lineWidth = 2; c.globalAlpha = .75;
        c.beginPath();
        arr.forEach((t, j) => { const px = X(t); if (j) c.lineTo(px, y); else c.moveTo(px, y); });
        c.stroke(); c.globalAlpha = 1;
        arr.forEach((t, j) => {
          const batas = Math.min(1, Math.max(0, (a - (i * .04 + j * .07)) / .35));
          if (batas <= 0) return;
          c.globalAlpha = batas; c.fillStyle = col;
          c.beginPath(); c.arc(X(t), y, 4, 0, Math.PI * 2); c.fill();
          c.globalAlpha = 1;
          total++;
        });
      });
      // attrition CB-03
      const xa = X(3.35), ya = Y(3);
      c.strokeStyle = C.a2; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(xa - 6, ya - 6); c.lineTo(xa + 6, ya + 6);
      c.moveTo(xa + 6, ya - 6); c.lineTo(xa - 6, ya + 6); c.stroke();
      c.fillStyle = C.a2; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.font = `600 9px ${FONT}`;
      c.fillText('attrition', xa + 9, ya - 2);
      teks('#d-mode', 'Longitudinal'); teks('#d-sel', String(total)); teks('#d-n', '6'); teks('#d-t', 'bervariasi');
      teks('#d-ket', 'Longitudinal: titik pengamatan tidak sejajar antarcabang. Cabang Bekasi berhenti di bulan ke-3.');
    } else {
      for (let i = 1; i <= N; i++) for (let t = 1; t <= T; t++) {
        const kunci = i + ',' + t;
        const alfa = .78 * (REDUCE ? 1 : D.anim);
        if (HILANG.has(kunci)) {
          sel(i, t, alfa * (1 - D.ub), C[WARNA_UNIT[i - 1]]);
          if (D.ub > .01) {
            c.globalAlpha = .28 * D.ub;
            c.strokeStyle = C.redup; c.lineWidth = 1; c.setLineDash([3, 3]);
            kotak(c, X(t) - cw / 2, Y(i) - ch / 2, cw, ch, 3); c.stroke();
            c.setLineDash([]); c.globalAlpha = 1;
          }
        } else {
          sel(i, t, alfa, C[WARNA_UNIT[i - 1]]);
        }
      }
      const jumlah = D.balanced ? 48 : 43;
      teks('#d-mode', 'Panel'); teks('#d-sel', String(jumlah)); teks('#d-n', '6'); teks('#d-t', '8');
      teks('#d-ket', D.balanced
        ? 'Panel seimbang: setiap cabang diamati pada seluruh periode.'
        : 'Panel tak seimbang: beberapa sel di sudut kanan atas tidak teramati.');
    }

    c.textBaseline = 'alphabetic';
  }

  function penandaArah(c, x, y, dx, dy) {
    c.beginPath();
    c.moveTo(x - 4, y - dy);
    c.lineTo(x, y);
    c.lineTo(x + 4, y - dy);
    c.stroke();
  }

  function animMode() {
    cancelAnimationFrame(D.raf);
    if (REDUCE) { D.anim = 1; gambar(); return; }
    const t0 = performance.now();
    D.anim = 0;
    const tick = now => {
      const k = Math.min(1, (now - t0) / 430);
      D.anim = 1 - Math.pow(1 - k, 3);
      gambar();
      if (k < 1) D.raf = requestAnimationFrame(tick);
    };
    D.raf = requestAnimationFrame(tick);
  }

  function animUb(target) {
    cancelAnimationFrame(D.rafUb);
    if (REDUCE) { D.ub = target; gambar(); return; }
    const dari = D.ub, t0 = performance.now();
    const tick = now => {
      const k = Math.min(1, (now - t0) / 380);
      D.ub = dari + (target - dari) * (1 - Math.pow(1 - k, 3));
      gambar();
      if (k < 1) D.rafUb = requestAnimationFrame(tick);
    };
    D.rafUb = requestAnimationFrame(tick);
  }

  function pilihMode(mode) {
    D.mode = mode;
    ['cs', 'ts', 'long', 'panel'].forEach(m => {
      const b = $('#d-' + m);
      const aktif = m === mode;
      b?.classList.toggle('p', aktif);
      b?.setAttribute('aria-pressed', String(aktif));
    });
    // sakelar kelengkapan hanya relevan untuk panel
    const kelengkapan = $('#d-kelengkapan');
    if (kelengkapan) kelengkapan.hidden = mode !== 'panel';
    animMode();
  }

  $('#d-cs')?.addEventListener('click', () => pilihMode('cs'));
  $('#d-ts')?.addEventListener('click', () => pilihMode('ts'));
  $('#d-long')?.addEventListener('click', () => pilihMode('long'));
  $('#d-panel')?.addEventListener('click', () => pilihMode('panel'));

  const setBalanced = (bal) => {
    D.balanced = bal;
    $('#d-bal')?.classList.toggle('p', bal);
    $('#d-unbal')?.classList.toggle('p', !bal);
    $('#d-bal')?.setAttribute('aria-pressed', String(bal));
    $('#d-unbal')?.setAttribute('aria-pressed', String(!bal));
    animUb(bal ? 0 : 1);
  };
  $('#d-bal')?.addEventListener('click', () => setBalanced(true));
  $('#d-unbal')?.addEventListener('click', () => setBalanced(false));

  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(gambar);
  gambar();
})();
