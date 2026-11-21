/* widgets/kandidat.js: Figur 4, pengurangan impurity untuk 90 kandidat split pada root node.
   Kandidat dihitung di peramban dari DATA_TITANIC dengan kandidatSplit (Lampiran C),
   tidak dibaca dari JSON acuan. Tiga panel memakai sumbu y bersama. Pada layar sempit
   ketiga panel ditumpuk vertikal dan sumbu y diulang di tiap panel. */
(() => {
  const { warna, kanvas } = Kit;
  const $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';
  const fmt = (v, d = 0) => v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const USIA_MAKS = 80;

  const baris = (window.DATA_TITANIC || []).map(r => ({ x: [r[0], r[1], r[2]], y: r[3] }));

  function impurity(c0, c1, kriteria) {
    const n = c0 + c1;
    if (n === 0) return 0;
    const p0 = c0 / n, p1 = c1 / n;
    if (kriteria === 'entropi') {
      return -(p0 > 0 ? p0 * Math.log2(p0) : 0) - (p1 > 0 ? p1 * Math.log2(p1) : 0);
    }
    return 1 - p0 * p0 - p1 * p1;
  }

  function kandidatSplit(rows, j, kriteria) {
    const n = rows.length;
    let t0 = 0, t1 = 0;
    for (const r of rows) r.y ? t1++ : t0++;
    const induk = impurity(t0, t1, kriteria);
    const urut = rows.slice().sort((a, b) => a.x[j] - b.x[j]);
    const hasil = [];
    let l0 = 0, l1 = 0;
    for (let i = 0; i < n - 1; i++) {
      urut[i].y ? l1++ : l0++;
      const a = urut[i].x[j], b = urut[i + 1].x[j];
      if (a === b) continue;
      const r0 = t0 - l0, r1 = t1 - l1, nL = l0 + l1, nR = r0 + r1;
      const Q = (nL / n) * impurity(l0, l1, kriteria) + (nR / n) * impurity(r0, r1, kriteria);
      hasil.push({ j, titik: (a + b) / 2, kiri: [l0, l1], kanan: [r0, r1], nL, nR, Q, turun: induk - Q });
    }
    return hasil;
  }

  /* 90 kandidat: panel 0 jenis kelamin (1), panel 1 kelas tiket (2), panel 2 usia (87) */
  const KAND = [];
  for (let j = 0; j < 3; j++) {
    const g = kandidatSplit(baris, j, 'gini');
    const e = kandidatSplit(baris, j, 'entropi');
    g.forEach((k, i) => {
      KAND.push({
        panel: j, j, titik: k.titik, kiri: k.kiri, kanan: k.kanan, nL: k.nL, nR: k.nR,
        dG: k.turun, dE: e[i].turun, QG: k.Q, QE: e[i].Q,
      });
    });
  }
  const indeksTerbaik = kunci => KAND.reduce((a, k, i) => (k[kunci] > KAND[a][kunci] + 1e-12 ? i : a), 0);
  const TERBAIK = { G: indeksTerbaik('dG'), E: indeksTerbaik('dE') };
  const PANEL = [0, 1, 2].map(p => KAND.map((k, i) => (k.panel === p ? i : -1)).filter(i => i >= 0));
  const JUDUL = ['Jenis kelamin', 'Kelas tiket', 'Usia'];

  const TATA = {
    lebar: {
      vb: { w: 720, h: 340 },
      atas: 36, bawah: 296,
      panel: [{ x0: 56, x1: 136 }, { x0: 152, x1: 272 }, { x0: 288, x1: 712 }],
    },
    sempit: {
      vb: { w: 360, h: 512 },
      panel: [0, 1, 2].map(i => ({ x0: 52, x1: 348, atas: i * 170 + 30, bawah: i * 170 + 140, top: i * 170 })),
    },
  };

  let mode = 'G';
  let sel = TERBAIK.G;
  let L = TATA.lebar;
  let anim = 0;

  const skala = () => ({ maks: mode === 'G' ? 0.15 : 0.25, langkah: 0.05 });
  const nilai = k => (mode === 'G' ? k.dG : k.dE);
  const DURASI = 400;
  let dariNilai = null, mulai = 0;
  let sisi = { s: 1, gx: 0, gy: 0 };
  function nilaiTampil(i) {
    const ke = nilai(KAND[i]);
    if (!dariNilai) return ke;
    const t = Math.min(1, Math.max(0, (performance.now() - mulai) / DURASI));
    const e = 1 - Math.pow(1 - t, 3);
    return dariNilai[i] + (ke - dariNilai[i]) * e;
  }
  const warnaMode = C => (mode === 'G' ? C.a1 : C.a2);

  function geom(p) {
    if (L === TATA.lebar) {
      const q = L.panel[p];
      return { x0: q.x0, x1: q.x1, atas: L.atas, bawah: L.bawah, sumbuY: p === 0 };
    }
    const q = L.panel[p];
    return { x0: q.x0, x1: q.x1, atas: q.atas, bawah: q.bawah, sumbuY: true };
  }

  /* posisi horizontal kandidat i di dalam panelnya */
  function xKandidat(i, g) {
    const k = KAND[i];
    if (k.panel === 2) return g.x0 + 8 + (k.titik / USIA_MAKS) * (g.x1 - g.x0 - 16);
    const idx = PANEL[k.panel].indexOf(i);
    return g.x0 + ((idx + 0.5) / PANEL[k.panel].length) * (g.x1 - g.x0);
  }

  function bintang(c, x, y, r, warnaIsi) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r * 0.45 : r;
      const sudut = -Math.PI / 2 + (i * Math.PI) / 5;
      c.lineTo(x + rad * Math.cos(sudut), y + rad * Math.sin(sudut));
    }
    c.closePath();
    c.fillStyle = warnaIsi; c.fill();
  }

  function gambar() {
    const cv = $('#cv-kandidat');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();
    const r = devicePixelRatio || 1;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    c.restore();
    const s = Math.min(w / L.vb.w, h / L.vb.h);
    const gx = (w - L.vb.w * s) / 2, gy = (h - L.vb.h * s) / 2;
    sisi = { s, gx, gy };
    c.setTransform(r * s, 0, 0, r * s, r * gx, r * gy);
    const sk = skala();
    const Y = (g, v) => g.bawah - (v / sk.maks) * (g.bawah - g.atas);
    const warnaBatang = warnaMode(C);

    for (let p = 0; p < 3; p++) {
      const g = geom(p);

      /* kisi nilai Δ */
      c.font = `9px ${FONT}`;
      c.strokeStyle = C.garis; c.lineWidth = 1; c.fillStyle = C.redup;
      for (let v = 0; v <= sk.maks + 1e-9; v += sk.langkah) {
        const y = Y(g, v);
        c.beginPath(); c.moveTo(g.x0, y); c.lineTo(g.x1, y); c.stroke();
        if (g.sumbuY) { c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText(fmt(v, 2), g.x0 - 6, y); }
      }

      if (p === 0 && L === TATA.lebar) {
        c.save(); c.translate(14, (g.atas + g.bawah) / 2); c.rotate(-Math.PI / 2);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = C.tinta2; c.font = `600 9px ${FONT}`;
        c.fillText('Pengurangan impurity (Δ)', 0, 0);
        c.restore();
      }

      /* judul panel */
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.fillStyle = C.tinta2; c.font = `600 9px ${FONT}`;
      c.fillText(JUDUL[p], g.x0, g.atas - 18);

      /* batang dan stem */
      PANEL[p].forEach(i => {
        const k = KAND[i];
        const v = nilaiTampil(i);
        const x = xKandidat(i, g);
        const y = Y(g, v);
        const terpilih = i === sel;
        if (p === 2) {
          c.strokeStyle = terpilih ? C.tinta : warnaBatang;
          c.lineWidth = terpilih ? 2 : 1.2;
          c.beginPath(); c.moveTo(x, g.bawah); c.lineTo(x, y); c.stroke();
          c.beginPath(); c.arc(x, y, terpilih ? 4.5 : 3, 0, Math.PI * 2);
          c.fillStyle = terpilih ? C.tinta : warnaBatang; c.fill();
        } else {
          const lebar = 26;
          c.globalAlpha = terpilih ? 1 : 0.55;
          c.fillStyle = warnaBatang;
          c.fillRect(x - lebar / 2, y, lebar, g.bawah - y);
          c.globalAlpha = 1;
          if (terpilih) {
            c.strokeStyle = C.tinta; c.lineWidth = 2;
            c.strokeRect(x - lebar / 2 - 1, y - 1, lebar + 2, g.bawah - y + 2);
          }
          c.fillStyle = C.tinta2; c.font = `9px ${FONT}`; c.textAlign = 'center';
          c.textBaseline = 'alphabetic';
          c.fillText(fmt(v, 4), x, y - 5);
        }
        if (i === TERBAIK[mode]) {
          c.textAlign = 'center'; c.textBaseline = 'alphabetic';
          bintang(c, x, y - 22, 5, C.emas);
          c.fillStyle = C.tinta; c.font = `600 9px ${FONT}`;
          c.fillText('terbaik', x, y - 32);
        }
      });

      /* sumbu dasar dan label kategori */
      c.strokeStyle = C.redup; c.lineWidth = 1;
      c.beginPath(); c.moveTo(g.x0, g.bawah); c.lineTo(g.x1, g.bawah); c.stroke();
      c.fillStyle = C.tinta2; c.font = `9px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      if (p === 0) {
        c.fillText('perempuan ≤ 0,5', (g.x0 + g.x1) / 2, g.bawah + 14);
      } else if (p === 1) {
        PANEL[1].forEach(i => {
          c.fillText(KAND[i].titik === 1.5 ? 'kelas ≤ 1,5' : 'kelas ≤ 2,5', xKandidat(i, g), g.bawah + 14);
        });
      } else {
        for (let t = 0; t <= USIA_MAKS; t += 10) {
          const x = g.x0 + 8 + (t / USIA_MAKS) * (g.x1 - g.x0 - 16);
          c.fillText(String(t), x, g.bawah + 14);
        }
        c.fillText('Titik split (tahun)', (g.x0 + g.x1) / 2, g.bawah + 30);
      }
    }
  }

  const txt = v => v.toLocaleString('id-ID', { maximumFractionDigits: 3 });
  const G_INDUK = impurity(424, 290, 'gini');
  const H_INDUK = impurity(424, 290, 'entropi');
  const reduksi = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pilih(i) {
    sel = i;
    rincian();
    gambar();
  }

  function rincian() {
    const el = $('#kandidat-rincian');
    if (!el) return;
    const k = KAND[sel];
    const [a0, a1] = k.kiri, [b0, b1] = k.kanan;
    const n = k.nL + k.nR;
    const aturan = k.j === 0 ? 'perempuan ≤ 0,5 (laki-laki ke kiri)'
      : k.j === 1 ? `kelas ≤ ${txt(k.titik)}` : `usia ≤ ${txt(k.titik)}`;
    const ukuran = mode === 'G' ? 'G' : 'H';
    const hitung = (c0, c1) => fmt(mode === 'G' ? impurity(c0, c1, 'gini') : impurity(c0, c1, 'entropi'), 4);
    const bar = (t, s, lebar) => `<div style="display:flex;height:9px;width:${lebar}%;border-radius:2px;overflow:hidden;margin-top:4px"><i style="flex:${t};background:var(--aksen-2)"></i><i style="flex:${s};background:var(--aksen-1)"></i></div>`;
    const q = mode === 'G'
      ? `Q = ${fmt(k.QG, 4)}; G induk = ${fmt(G_INDUK, 4)}; Δ = ${fmt(k.dG, 4)}`
      : `Q = ${fmt(k.QE, 4)}; H induk = ${fmt(H_INDUK, 4)}; information gain = ${fmt(k.dE, 4)}`;
    el.innerHTML = `<b>${aturan}</b><br>`
      + `Ya (≤ ${txt(k.titik)}): ${k.nL} (${a0} tidak selamat, ${a1} selamat), ${ukuran} = ${hitung(a0, a1)}<br>`
      + `Tidak (&gt; ${txt(k.titik)}): ${k.nR} (${b0} tidak selamat, ${b1} selamat), ${ukuran} = ${hitung(b0, b1)}<br>`
      + `${q}`
      + bar(424, 290, 100) + bar(a0, a1, (100 * k.nL) / n) + bar(b0, b1, (100 * k.nR) / n)
      + `<div style="font-size:.74rem;margin-top:6px">Batang: biru = selamat, merah = tidak selamat. Baris pertama induk, lalu kiri dan kanan dengan lebar sesuai jumlah penumpang.</div>`;
  }

  /* titik sasaran dalam satuan viewBox; 12 px layar sebagai batas minimum */
  function ketitik(ev) {
    const cv = $('#cv-kandidat');
    const r = cv.getBoundingClientRect();
    return {
      vx: (ev.clientX - r.left - sisi.gx) / sisi.s,
      vy: (ev.clientY - r.top - sisi.gy) / sisi.s,
      batas: 12 / sisi.s,
    };
  }

  function terdekat(vx, vy, batas) {
    let terpilih = -1, jarak = batas;
    for (let p = 0; p < 3; p++) {
      const g = geom(p);
      const atasP = L === TATA.lebar ? 0 : p * 170;
      const bawahP = L === TATA.lebar ? L.vb.h : atasP + 170;
      if (vy < atasP || vy > bawahP) continue;
      if (vx < g.x0 - 6 || vx > g.x1 + 6) continue;
      PANEL[p].forEach(i => {
        const d = Math.abs(xKandidat(i, g) - vx);
        if (d <= jarak) { jarak = d; terpilih = i; }
      });
    }
    return terpilih;
  }

  function geserPanel(arah) {
    const daftar = PANEL[KAND[sel].panel];
    const idx = daftar.indexOf(sel);
    pilih(daftar[Math.min(daftar.length - 1, Math.max(0, idx + arah))]);
  }

  function animasi() {
    cancelAnimationFrame(anim);
    const tick = () => {
      gambar();
      if (performance.now() - mulai < DURASI) anim = requestAnimationFrame(tick);
      else { dariNilai = null; gambar(); }
    };
    anim = requestAnimationFrame(tick);
  }

  function ganti(modeBaru) {
    if (modeBaru === mode) return;
    const sekarang = KAND.map((_, i) => nilaiTampil(i));
    mode = modeBaru;
    dariNilai = reduksi() ? null : sekarang;
    mulai = performance.now();
    $('#kandidat-gini')?.setAttribute('aria-pressed', String(mode === 'G'));
    $('#kandidat-entropi')?.setAttribute('aria-pressed', String(mode === 'E'));
    $('#kandidat-gini')?.classList.toggle('p', mode === 'G');
    $('#kandidat-entropi')?.classList.toggle('p', mode === 'E');
    rincian();
    if (dariNilai) animasi(); else gambar();
  }

  function atur() {
    const cv = $('#cv-kandidat');
    if (!cv) return;
    const sempit = cv.clientWidth < 600;
    L = sempit ? TATA.sempit : TATA.lebar;
    cv.style.setProperty('aspect-ratio', `${L.vb.w} / ${L.vb.h}`, 'important');
  }

  function redraw() { atur(); gambar(); }

  addEventListener('resize', redraw);
  document.addEventListener('tema', redraw);
  document.fonts?.ready.then(redraw);
  redraw();
  const cv = $('#cv-kandidat');
  if (cv) {
    cv.addEventListener('pointerdown', ev => {
      const { vx, vy, batas } = ketitik(ev);
      const i = terdekat(vx, vy, batas);
      if (i >= 0) pilih(i);
      cv.focus();
    });
    cv.addEventListener('pointermove', ev => {
      if (ev.pointerType !== 'mouse') return;
      const { vx, vy, batas } = ketitik(ev);
      const i = terdekat(vx, vy, batas);
      if (i >= 0 && KAND[i].panel === 2 && i !== sel) pilih(i);
    });
    cv.addEventListener('keydown', ev => {
      if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
      ev.preventDefault();
      geserPanel(ev.key === 'ArrowRight' ? 1 : -1);
    });
  }
  $('#kandidat-gini')?.addEventListener('click', () => ganti('G'));
  $('#kandidat-entropi')?.addEventListener('click', () => ganti('E'));
  $('#kandidat-terbaik')?.addEventListener('click', () => pilih(TERBAIK[mode]));
  rincian();
  window.__kandidat = { KAND, PANEL, TERBAIK, mode: () => mode, sel: () => sel };
})();
