/* widgets/konstruksi.js: Figur 5, konstruksi decision tree per langkah split pada 714 penumpang.
   Pohon dibangun breadth-first dengan algoritma Lampiran C (kriteria Gini) sampai kedalaman maksimum.
   Setiap split berjalan tiga fase: periksa, pilih, bagi. */
(() => {
  const { warna, kanvas } = Kit;
  const $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';
  const fmt = (v, d) => v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const KERTAS = () => getComputedStyle(document.body).getPropertyValue('--kertas-2').trim() || '#F0EDE7';
  const SEMUA = (window.DATA_TITANIC || []).map(r => ({ x: [r[0], r[1], r[2]], y: r[3] }));

  function impurity(c0, c1) {
    const n = c0 + c1;
    if (n === 0) return 0;
    const p0 = c0 / n, p1 = c1 / n;
    return 1 - p0 * p0 - p1 * p1;
  }

  /* split terbaik pada satu node, urutan seri sama dengan Lampiran C */
  function splitTerbaik(rows, c0, c1) {
    const n = rows.length, induk = impurity(c0, c1);
    let terbaik = null;
    for (let j = 0; j < 3; j++) {
      const urut = rows.slice().sort((a, b) => a.x[j] - b.x[j]);
      let l0 = 0, l1 = 0;
      for (let i = 0; i < n - 1; i++) {
        urut[i].y ? l1++ : l0++;
        const a = urut[i].x[j], b = urut[i + 1].x[j];
        if (a === b) continue;
        const r0 = c0 - l0, r1 = c1 - l1;
        const Q = ((l0 + l1) / n) * impurity(l0, l1) + ((r0 + r1) / n) * impurity(r0, r1);
        const turun = induk - Q;
        if (terbaik === null || turun > terbaik.turun + 1e-12) terbaik = { j, titik: (a + b) / 2, turun };
      }
    }
    return terbaik;
  }

  /* bangun pohon breadth-first; id mengikuti urutan antrean, sama dengan Lampiran B.3 */
  function bangunPohon(maks) {
    let cacah = 0;
    const akar = { id: cacah++, d: 0, rows: SEMUA, parent: null };
    const antrean = [akar], semua = [akar];
    while (antrean.length) {
      const node = antrean.shift();
      let c0 = 0, c1 = 0;
      for (const r of node.rows) r.y ? c1++ : c0++;
      Object.assign(node, { n: node.rows.length, c0, c1, kelas: c1 > c0 ? 1 : 0 });
      node.salah = c1 > c0 ? c0 : c1;
      if (c0 === 0 || c1 === 0 || node.rows.length < 2 || node.d >= maks) { node.leaf = true; continue; }
      const s = splitTerbaik(node.rows, c0, c1);
      if (s === null) { node.leaf = true; continue; }
      node.leaf = false; node.j = s.j; node.titik = s.titik; node.turun = s.turun;
      node.kiri = { id: cacah++, d: node.d + 1, rows: node.rows.filter(r => r.x[s.j] <= s.titik), parent: node };
      node.kanan = { id: cacah++, d: node.d + 1, rows: node.rows.filter(r => r.x[s.j] > s.titik), parent: node };
      antrean.push(node.kiri, node.kanan);
      semua.push(node.kiri, node.kanan);
    }
    return { akar, semua };
  }

  const cache = {};
  function pohonUntuk(maks) {
    if (!cache[maks]) cache[maks] = bangunPohon(maks);
    return cache[maks];
  }

  /* keadaan: kedalaman maksimum terpilih dan jumlah split yang sudah dilakukan */
  let maks = 3, langkah = 0;
  let sorot = null, gelembung = '';
  const anim = { id: null, t: 1, kedip: 1, gel: 1 };
  const ease = k => 1 - Math.pow(1 - k, 3);

  /* node yang sedang muncul bergerak dari posisi induknya dan memudar; node lain tidak berubah */
  function keadaanAnim(n) {
    if (anim.id === null || !n.parent || n.parent.id !== anim.id) return { n, e: 1 };
    const e = ease(anim.t), p = n.parent;
    return { n: { ...n, x: p.x + (n.x - p.x) * e }, e };
  }

  /* jalankan frame(k) dari 0 ke 1 selama ms, menggambar ulang tiap frame */
  function animasi(ms, frame) {
    if (reduce) { frame(1); return Promise.resolve(); }
    return new Promise(res => {
      const t0 = performance.now();
      const step = now => {
        const k = Math.min(1, (now - t0) / ms);
        frame(k);
        gambar();
        if (k < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }

  /* split yang sudah dilakukan: n split pertama menurut urutan id (breadth-first) */
  function keadaan() {
    const { semua } = pohonUntuk(maks);
    const urutan = semua.filter(n => !n.leaf).sort((a, b) => a.id - b.id);
    const dibagi = new Set(urutan.slice(0, langkah).map(n => n.id));
    const tampak = semua.filter(n => n.d === 0 || dibagi.has(n.parent?.id));
    const aktif = tampak.filter(n => !dibagi.has(n.id));
    const salah = aktif.reduce((s, n) => s + n.salah, 0);
    const kedalaman = dibagi.size ? Math.max(...[...dibagi].map(id => semua[id].d)) + 1 : 0;
    return { total: urutan.length, dibagi, tampak, aktif, salah, galat: salah / SEMUA.length, kedalaman };
  }

  const W = 760, H = 460, LK = 92, TK = 72;
  const NAMA = ['perempuan', 'kelas', 'usia'];

  /* posisi x: setiap node menempati rentang slot daun pada kedalaman D; x adalah tengah rentangnya,
     sama dengan rata-rata kedua anak, sehingga node tidak berpindah saat anaknya muncul */
  function posisi(pohon) {
    const slot = 2 ** maks;
    const visit = (node, lo, hi) => {
      node.x = ((lo + hi) / 2) * (W / slot);
      if (node.kiri && node.kanan) {
        const mid = (lo + hi) / 2;
        visit(node.kiri, lo, mid);
        visit(node.kanan, mid, hi);
      }
    };
    visit(pohon.akar, 0, slot);
  }

  function gambarPohon() {
    const cv = $('#cv-konstruksi');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();
    c.clearRect(0, 0, w, h);
    const sk = w / W;
    c.setTransform(sk * devicePixelRatio, 0, 0, sk * devicePixelRatio, 0, 0);
    const pohon = pohonUntuk(maks);
    posisi(pohon);
    const k = keadaan();
    const tampak = k.tampak;

    c.strokeStyle = C.garis; c.lineWidth = 1.5;
    tampak.forEach(asli => {
      if (asli.d === 0 || !asli.parent) return;
      const { n, e } = keadaanAnim(asli), p = n.parent;
      const y0 = 40 + 112 * p.d + TK;
      c.globalAlpha = e;
      c.beginPath(); c.moveTo(p.x, y0); c.lineTo(p.x, y0 + 20); c.lineTo(n.x, y0 + 20); c.lineTo(n.x, 40 + 112 * n.d); c.stroke();
      c.font = `11px ${FONT}`; c.fillStyle = C.tinta2; c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText(asli === p.kiri ? 'Ya' : 'Tidak', n.x, y0 + 18);
    });
    c.globalAlpha = 1;

    tampak.forEach(asli => {
      const { n, e } = keadaanAnim(asli);
      c.globalAlpha = e;
      const x = n.x - LK / 2, y = 40 + 112 * n.d;
      const dibagi = k.dibagi.has(n.id);
      c.fillStyle = KERTAS(); c.fillRect(x, y, LK, TK);
      c.strokeStyle = C.garis; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, LK - 1, TK - 1);
      c.fillStyle = C.tinta; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (dibagi) {
        c.font = `600 10px ${FONT}`;
        c.fillText(`${NAMA[n.j]} ≤ ${String(n.titik).replace('.', ',')}`, n.x, y + 16);
      } else {
        const warnaKelas = n.kelas ? C.a1 : C.a2;
        c.fillStyle = warnaKelas; c.fillRect(x, y, LK, 18);
        c.fillStyle = '#fff'; c.font = `600 10px ${FONT}`;
        c.fillText(n.kelas ? 'selamat' : 'tidak selamat', n.x, y + 9);
        c.fillStyle = C.tinta;
      }
      c.font = `10px ${FONT}`; c.fillStyle = C.tinta2;
      c.fillText(`n = ${n.n}`, n.x, y + 36);
      const lebarBatang = 76, bx = n.x - lebarBatang / 2, by = y + 52;
      const f0 = n.n ? n.c0 / n.n : 0;
      c.fillStyle = C.a2; c.fillRect(bx, by, lebarBatang * f0, 6);
      c.fillStyle = C.a1; c.fillRect(bx + lebarBatang * f0, by, lebarBatang * (1 - f0), 6);
    });
    c.globalAlpha = 1;

    if (sorot) {
      const x = sorot.x - LK / 2 - 4, y = 40 + 112 * sorot.d - 4;
      c.globalAlpha = anim.kedip;
      c.strokeStyle = C.a1; c.lineWidth = 2.5;
      c.strokeRect(x, y, LK + 8, TK + 8);
      c.globalAlpha = 1;
    }
    if (gelembung && sorot) {
      c.globalAlpha = anim.gel;
      c.font = `10px ${FONT}`;
      const lebarG = Math.min(W - 8, c.measureText(gelembung).width + 14);
      const gx = Math.min(Math.max(sorot.x - lebarG / 2, 4), W - lebarG - 4), gy = 40 + 112 * sorot.d + TK + 8;
      c.fillStyle = KERTAS(); c.fillRect(gx, gy, lebarG, 18);
      c.strokeStyle = C.garis; c.lineWidth = 1; c.strokeRect(gx + 0.5, gy + 0.5, lebarG - 1, 17);
      c.fillStyle = C.tinta; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(gelembung, gx + lebarG / 2, gy + 9);
      c.globalAlpha = 1;
    }
  }

  function gambar() { gambarPohon(); }

  const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  const btnPutar = $('#kon-putar'), btnMaju = $('#kon-maju'), btnUlang = $('#kon-ulang'), sl = $('#kon-kedalaman-maks');
  let timer = null;

  function ketTeks(k, selesai) {
    const seri = k.aktif.some(n => n.n > 0 && n.c0 === n.c1)
      ? ' Catatan seri: 1 tidak selamat dan 1 selamat, prediksi mengikuti kelas dengan kode lebih kecil (tidak selamat).' : '';
    if (langkah === 0) return `Dibutuhkan ${k.total} split untuk kedalaman ${maks}. Setiap split melewati tiga fase: periksa, pilih, lalu bagi.`;
    if (selesai) return (maks === 3
      ? 'Semua leaf node berhenti karena kedalaman maksimum 3. Hanya satu leaf node yang murni.'
      : `Semua leaf node berhenti karena kedalaman maksimum ${maks}.`) + seri;
    if (langkah === 5 || langkah === 6) return 'Split ini tidak mengubah prediksi, tetapi membuat kelompok lebih homogen.';
    return `Split ${langkah} dari ${k.total} sudah dilakukan.`;
  }

  let galatSebelum = null;
  function perbarui() {
    const k = keadaan(), selesai = langkah >= k.total;
    gambar();
    set('#kon-leaf', String(k.aktif.length));
    set('#kon-kedalaman', String(k.kedalaman));
    set('#kon-galat', fmt(k.galat, 4));
    const selisih = galatSebelum === null || langkah === 0 || (fase !== 0 && fase !== 4) ? '' : `(${k.galat - galatSebelum < 0 ? '' : '+'}${fmt(k.galat - galatSebelum, 4)})`;
    set('#kon-galat-selisih', selisih);
    const butir = $('#konstruksi-langkah')?.children;
    if (butir) [...butir].forEach((li, i) => li.classList.toggle('aktif', i + 1 === fase));
    set('#kon-kedalaman-nilai', String(maks));
    set('#kon-ket', ketTeks(k, selesai));
    sl.setAttribute('aria-valuetext', String(maks));
    btnMaju.disabled = selesai;
  }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tunda = ms => new Promise(r => setTimeout(r, ms));
  const urutanSplit = () => pohonUntuk(maks).semua.filter(n => !n.leaf).sort((a, b) => a.id - b.id);
  const titikTeks = n => String(n.titik).replace('.', ',');
  let sibuk = false, putar = false, fase = 0;

  /* satu split: periksa (600 ms), pilih (800 ms), bagi (700 ms); Ulang dan slider menunggu sampai selesai */
  async function satuSplit() {
    const node = urutanSplit()[langkah];
    if (!node || sibuk) return false;
    sibuk = true;
    galatSebelum = keadaan().galat;
    const pertanyaan = node.d === 0 ? 'apakah laki-laki?' : `${NAMA[node.j]} ≤ ${titikTeks(node)}`;
    const teksPilih = `Terbaik: ${pertanyaan} · Δ = ${fmt(node.turun, 4)}`;
    if (reduce) {
      langkah++; sorot = node; gelembung = teksPilih; fase = 4;
      perbarui(); await tunda(1500);
    } else {
      fase = 2; sorot = node; gelembung = `n = ${node.n}. Belum murni. Kedalaman ${node.d} < ${maks}. Lanjut.`;
      anim.gel = 0; perbarui();
      await animasi(250, k => { anim.gel = k; anim.kedip = 0.5 + 0.5 * Math.sin(k * Math.PI * 2); });
      anim.kedip = 1;
      await tunda(350);

      fase = 3; gelembung = teksPilih; anim.gel = 0; perbarui();
      await animasi(250, k => { anim.gel = k; });
      await tunda(550);

      fase = 4; anim.id = null;
      langkah++; perbarui();
      await animasi(700, k => {
        anim.id = node.id; anim.t = k; anim.gel = 1 - k;
        if (k >= 1) { anim.id = null; anim.t = 1; }
      });
    }
    sorot = null; gelembung = ''; fase = 0; anim.gel = 1; anim.kedip = 1;
    sibuk = false;
    perbarui();
    return true;
  }

  function berhenti() {
    putar = false;
    btnPutar.textContent = 'Putar';
    sl.disabled = false;
  }

  sl?.addEventListener('input', () => {
    if (sibuk || putar) return;
    maks = Number(sl.value); langkah = 0; sorot = null; gelembung = ''; perbarui();
  });
  btnMaju?.addEventListener('click', async () => {
    if (!sibuk) await satuSplit();
  });
  btnUlang?.addEventListener('click', () => {
    if (sibuk) return;
    berhenti(); langkah = 0; sorot = null; gelembung = ''; perbarui();
  });
  btnPutar?.addEventListener('click', async () => {
    if (putar) { berhenti(); return; }
    if (langkah >= urutanSplit().length) langkah = 0;
    putar = true; btnPutar.textContent = 'Jeda'; sl.disabled = true;
    while (putar && langkah < urutanSplit().length) {
      await satuSplit();
      if (putar && langkah < urutanSplit().length) await tunda(400);
    }
    berhenti();
  });

  if (sl) maks = Number(sl.value);
  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(gambar);
  perbarui();
})();
