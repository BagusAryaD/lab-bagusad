/* widgets/kedalaman.js: Figur 6, galat latih dan galat uji terhadap kedalaman maksimum.
   Pohon dibangun di peramban dengan algoritma Lampiran C (kriteria Gini) dari data latih.
   Seed 42 memakai kolom uji dari DATA_TITANIC; seed lain membagi ulang dengan mulberry32. */
(() => {
  const { warna, kanvas } = Kit;
  const $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';
  const fmt = (v, d) => v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const KEDALAMAN = 15, UJI_SELAMAT = 87, UJI_TIDAK = 128;

  const SEMUA = (window.DATA_TITANIC || []).map(r => ({ x: [r[0], r[1], r[2]], y: r[3], uji: r[4] === 1 }));

  function impurity(c0, c1) {
    const n = c0 + c1;
    if (n === 0) return 0;
    const p0 = c0 / n, p1 = c1 / n;
    return 1 - p0 * p0 - p1 * p1;
  }

  /* split terbaik pada satu node, urutan seri sama dengan Lampiran C */
  function splitTerbaik(rows) {
    let t0 = 0, t1 = 0;
    for (const r of rows) r.y ? t1++ : t0++;
    const n = rows.length, induk = impurity(t0, t1);
    let terbaik = null;
    for (let j = 0; j < 3; j++) {
      const urut = rows.slice().sort((a, b) => a.x[j] - b.x[j]);
      let l0 = 0, l1 = 0;
      for (let i = 0; i < n - 1; i++) {
        urut[i].y ? l1++ : l0++;
        const a = urut[i].x[j], b = urut[i + 1].x[j];
        if (a === b) continue;
        const r0 = t0 - l0, r1 = t1 - l1;
        const Q = ((l0 + l1) / n) * impurity(l0, l1) + ((r0 + r1) / n) * impurity(r0, r1);
        const turun = induk - Q;
        if (terbaik === null || turun > terbaik.turun + 1e-12) terbaik = { j, titik: (a + b) / 2, turun };
      }
    }
    return terbaik;
  }

  function bangun(rows, maks, d = 0) {
    let c0 = 0, c1 = 0;
    for (const r of rows) r.y ? c1++ : c0++;
    const node = { n: rows.length, kelas: c1 > c0 ? 1 : 0, kedalaman: d, leaf: true };
    if (c0 === 0 || c1 === 0 || rows.length < 2 || d >= maks) return node;
    const s = splitTerbaik(rows);
    if (s === null) return node;
    return {
      ...node, leaf: false, j: s.j, titik: s.titik,
      kiri: bangun(rows.filter(r => r.x[s.j] <= s.titik), maks, d + 1),
      kanan: bangun(rows.filter(r => r.x[s.j] > s.titik), maks, d + 1),
    };
  }

  function prediksi(node, x) {
    while (!node.leaf) node = x[node.j] <= node.titik ? node.kiri : node.kanan;
    return node.kelas;
  }

  function galat(pohon, rows) {
    let salah = 0;
    for (const r of rows) if (prediksi(pohon, r.x) !== r.y) salah++;
    return salah / rows.length;
  }

  function daun(node, hasil = []) {
    if (node.leaf) hasil.push(node);
    else { daun(node.kiri, hasil); daun(node.kanan, hasil); }
    return hasil;
  }

  /* pembagian: bawaan dari kolom uji, atau seed baru dengan Fisher-Yates per kelas */
  function pembagian(seed) {
    let uji;
    if (seed === null) {
      uji = new Set(SEMUA.filter(r => r.uji));
    } else {
      const acak = Kit.rng(seed);
      const kocok = a => {
        const b = a.slice();
        for (let i = b.length - 1; i > 0; i--) {
          const j = Math.floor(acak() * (i + 1));
          [b[i], b[j]] = [b[j], b[i]];
        }
        return b;
      };
      const u1 = kocok(SEMUA.filter(r => r.y === 1)), u0 = kocok(SEMUA.filter(r => r.y === 0));
      uji = new Set([...u1.slice(0, UJI_SELAMAT), ...u0.slice(0, UJI_TIDAK)]);
    }
    return { latih: SEMUA.filter(r => !uji.has(r)), uji: SEMUA.filter(r => uji.has(r)) };
  }

  /* hitung ulang 15 pohon dan statistiknya untuk satu pembagian */
  function hitung(sp) {
    return Array.from({ length: KEDALAMAN }, (_, i) => {
      const d = i + 1, pohon = bangun(sp.latih, d);
      const leaf = daun(pohon);
      return {
        d, leaf: leaf.length,
        terkecil: Math.min(...leaf.map(l => l.n)),
        latih: galat(pohon, sp.latih),
        uji: galat(pohon, sp.uji),
      };
    });
  }

  let seedAktif = null, sp = pembagian(null), tabel = hitung(sp);
  let kedalaman = 3;

  function minimum() {
    let idx = 0;
    tabel.forEach((t, i) => { if (t.uji < tabel[idx].uji - 1e-12) idx = i; });
    return idx;
  }

  const M = { kiri: 56, kanan: 16, atas: 16, bawah: 44 };
  const kertas = () => getComputedStyle(document.body).getPropertyValue('--kertas-2').trim() || '#F0EDE7';

  function bintang(c, x, y, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r * 0.45 : r, a = -Math.PI / 2 + i * Math.PI / 5;
      c.lineTo(x + rad * Math.cos(a), y + rad * Math.sin(a));
    }
    c.closePath();
  }

  function gambarGrafik() {
    const cv = $('#cv-kedalaman');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();
    c.clearRect(0, 0, w, h);
    const px = M.kiri, py = M.atas;
    const pw = Math.max(1, w - M.kiri - M.kanan), ph = Math.max(1, h - M.atas - M.bawah);
    const X = d => px + ((d - 1) / (KEDALAMAN - 1)) * pw;
    const Y = v => py + (1 - v / 0.3) * ph;

    c.font = `9px ${FONT}`;
    c.strokeStyle = C.garis; c.lineWidth = 1; c.fillStyle = C.redup;
    c.textAlign = 'center'; c.textBaseline = 'top';
    for (let d = 1; d <= KEDALAMAN; d++) c.fillText(String(d), X(d), py + ph + 6);
    c.textAlign = 'right'; c.textBaseline = 'middle';
    for (let i = 0; i <= 6; i++) {
      const v = i * 0.05;
      c.beginPath(); c.moveTo(px, Y(v)); c.lineTo(px + pw, Y(v)); c.stroke();
      c.fillText(fmt(v, 2), px - 7, Y(v));
    }
    c.fillStyle = C.redup; c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText('Kedalaman maksimum', px + pw / 2, py + ph + 24);
    c.save(); c.translate(12, py + ph / 2); c.rotate(-Math.PI / 2);
    c.textBaseline = 'middle'; c.fillText('Galat klasifikasi', 0, 0); c.restore();

    const seri = (kunci, gaya, warnaL) => {
      c.strokeStyle = warnaL; c.lineWidth = 2.5; c.setLineDash(gaya);
      c.beginPath();
      tabel.forEach((t, i) => { i ? c.lineTo(X(t.d), Y(t[kunci])) : c.moveTo(X(t.d), Y(t[kunci])); });
      c.stroke(); c.setLineDash([]);
      tabel.forEach(t => {
        c.beginPath(); c.arc(X(t.d), Y(t[kunci]), 3.5, 0, Math.PI * 2);
        c.fillStyle = warnaL; c.fill();
      });
    };
    seri('latih', [], C.a1);
    seri('uji', [6, 4], C.a2);

    const t = tabel[kedalaman - 1];
    c.strokeStyle = C.redup; c.lineWidth = 1; c.globalAlpha = 0.7;
    c.beginPath(); c.moveTo(X(t.d), Y(0)); c.lineTo(X(t.d), Y(0.3)); c.stroke();
    c.globalAlpha = 1;
    [[t.latih, C.a1], [t.uji, C.a2]].forEach(([v, warnaL]) => {
      c.beginPath(); c.arc(X(t.d), Y(v), 6, 0, Math.PI * 2);
      c.fillStyle = warnaL; c.fill();
      c.strokeStyle = kertas(); c.lineWidth = 2; c.stroke();
    });

    const m = tabel[minimum()];
    c.fillStyle = C.emas; bintang(c, X(m.d), Y(m.uji) - 16, 6); c.fill();
    c.font = `600 9px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const teksMin = 'galat uji minimum', lebarMin = c.measureText(teksMin).width + 8, yMin = Y(0.035);
    c.fillStyle = kertas(); c.globalAlpha = 0.92; c.fillRect(X(m.d) - lebarMin / 2, yMin - 8, lebarMin, 16); c.globalAlpha = 1;
    c.fillStyle = C.tinta2; c.fillText(teksMin, X(m.d), yMin);

    const baris = [['Galat latih', [], C.a1], ['Galat uji', [6, 4], C.a2]];
    const lebarTeks = Math.max(...baris.map(b => c.measureText(b[0]).width));
    const lebar = 26 + 8 + lebarTeks + 10, tinggi = baris.length * 15 + 8;
    const lx = px + pw - lebar - 4, ly = py + 4;
    c.fillStyle = kertas(); c.globalAlpha = 0.92; c.fillRect(lx, ly, lebar, tinggi); c.globalAlpha = 1;
    c.strokeStyle = C.garis; c.lineWidth = 1; c.strokeRect(lx + 0.5, ly + 0.5, lebar - 1, tinggi - 1);
    baris.forEach(([teks, gaya, warnaL], i) => {
      const y = ly + 8 + i * 15;
      c.strokeStyle = warnaL; c.lineWidth = 2.5; c.setLineDash(gaya);
      c.beginPath(); c.moveTo(lx + 8, y); c.lineTo(lx + 26, y); c.stroke(); c.setLineDash([]);
      c.fillStyle = C.tinta2; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(teks, lx + 32, y);
    });
  }

  function ringkas() {
    const t = tabel[kedalaman - 1], m = tabel[minimum()];
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('#ked-kedalaman', String(kedalaman));
    set('#ked-leaf', String(t.leaf));
    set('#ked-terkecil', String(t.terkecil));
    set('#ked-latih', fmt(t.latih, 4));
    set('#ked-uji', fmt(t.uji, 4));
    const sl = $('#ked-slider');
    if (sl) sl.setAttribute('aria-valuetext', String(kedalaman));
    let kal = `Pada kedalaman ${kedalaman}: ${t.leaf} leaf node, leaf terkecil memuat ${t.terkecil} penumpang. Galat latih ${fmt(t.latih, 4)}, galat uji ${fmt(t.uji, 4)}.`;
    if (kedalaman >= 4 && t.terkecil === 1) kal += ' Ada leaf node yang hanya memuat satu penumpang.';
    if (t.uji > m.uji + 1e-12) kal += ` Galat uji lebih besar daripada nilai minimumnya (${fmt(m.uji, 4)} pada kedalaman ${m.d}).`;
    const ket = $('#ked-ket');
    if (ket) ket.textContent = `${kal} Pembagian data: seed ${seedAktif ?? 42}, ${sp.latih.length} latih, ${sp.uji.length} uji.`;
  }

  function gambar() { gambarGrafik(); ringkas(); }

  function terapkan(seed) {
    seedAktif = seed;
    sp = pembagian(seed);
    tabel = hitung(sp);
    gambar();
  }

  const sl = $('#ked-slider');
  sl?.addEventListener('input', () => { kedalaman = Number(sl.value); gambar(); });
  const btnBaru = $('#ked-seed');
  btnBaru?.addEventListener('click', () => {
    btnBaru.disabled = true;
    requestAnimationFrame(() => {
      try { terapkan(Math.floor(Math.random() * 9999) + 1); }
      finally { btnBaru.disabled = false; }
    });
  });
  $('#ked-seed-awal')?.addEventListener('click', () => terapkan(null));

  if (sl) kedalaman = Number(sl.value);
  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(gambar);
  gambar();
})();
