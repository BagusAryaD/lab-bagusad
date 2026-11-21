/* widgets/pemilihan.js: Figur 2, pemilihan pertanyaan terbaik pada sampel 20.
   Data SAMPEL_20, urutan titik: tidak selamat dahulu lalu selamat, masing-masing
   urut baris_asal. 11 keadaan (0-10), dua canvas, kartu kandidat DOM. */
(() => {
  const { warna, kanvas } = Kit;
  const $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';
  const fmt = (v, d) => v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const kertas = () => getComputedStyle(document.body).getPropertyValue('--kertas-2').trim() || '#F0EDE7';

  const SEMUA = (window.SAMPEL_20 || [])
    .map(r => ({ asal: r[0], f: r[1], kelas: r[2], usia: r[3], y: r[4] }))
    .sort((a, b) => a.asal - b.asal);

  const GRUP = {
    semua: () => SEMUA,
    laki: () => SEMUA.filter(p => p.f === 0),
    perem: () => SEMUA.filter(p => p.f === 1),
  };

  const URUT = (orang) => [...orang].sort((a, b) => {
    if (a.y !== b.y) return b.y - a.y;
    return a.asal - b.asal;
  });

  const KAND = {
    gender: { t: 'apakah laki-laki?', uji: p => p.f === 0, yaT: 'laki-laki', tiT: 'perempuan' },
    kelas:  { t: 'apakah kelas 1 atau 2?', uji: p => p.kelas <= 2.5, yaT: 'kelas 1 atau 2', tiT: 'kelas 3' },
    usia35: { t: 'apakah usia ≤ 35,5 tahun?', uji: p => p.usia <= 35.5, yaT: 'usia ≤ 35,5', tiT: 'usia > 35,5' },
    usia9:  { t: 'apakah usia ≤ 9,3 tahun?', uji: p => p.usia <= 9.335, yaT: 'usia ≤ 9,3', tiT: 'usia > 9,3' },
    usia26: { t: 'apakah usia ≤ 26,5 tahun?', uji: p => p.usia <= 26.5, yaT: 'usia ≤ 26,5', tiT: 'usia > 26,5' },
  };

  const RONDE = [
    { grup: 'semua', kandidat: ['gender', 'kelas', 'usia35'], pemenang: 0 },
    { grup: 'laki',  kandidat: ['kelas', 'usia9'], pemenang: 1 },
    { grup: 'perem', kandidat: ['kelas', 'usia26'], pemenang: 0 },
  ];

  const bagi = (orang, uji) => {
    const ya = [], tidak = [];
    for (const p of orang) (uji(p) ? ya : tidak).push(p);
    const hitung = g => {
      let s = 0;
      for (const p of g) s += p.y;
      return { n: g.length, s, t: g.length - s };
    };
    const ay = hitung(ya), at = hitung(tidak);
    return { ya: URUT(ya), tidak: URUT(tidak), ay, at, salah: ay.t + at.s };
  };

  const KETERANGAN = [
    'Kelompok awal: 20 penumpang, 9 selamat dan 11 tidak selamat. Jika semua penumpang diprediksi tidak selamat, 9 penumpang salah.',
    'Pertanyaan 1: apakah laki-laki? Ya: 10 penumpang (9 tidak selamat, 1 selamat). Tidak: 10 penumpang (2 tidak selamat, 8 selamat). Jika setiap kelompok diprediksi dengan kelas yang lebih banyak, 1 + 2 = 3 penumpang salah.',
    'Pertanyaan 2: apakah kelas 1 atau 2? Ya: 14 penumpang (5 tidak selamat, 9 selamat). Tidak: 6 penumpang (semuanya tidak selamat). Salah prediksi: 5 + 0 = 5.',
    'Pertanyaan 3: apakah usia ≤ 35,5 tahun? Ya: 16 penumpang (10 tidak selamat, 6 selamat). Tidak: 4 penumpang (1 tidak selamat, 3 selamat). Salah prediksi: 6 + 1 = 7. Untuk setiap ciri, hanya nilai batas terbaik yang ditampilkan.',
    'Salah prediksi paling sedikit, yaitu 3, dimiliki pertanyaan "apakah laki-laki?". Pertanyaan ini dipilih dan kelompok dibagi menjadi dua. Ukuran yang dipakai algoritma sebenarnya dijelaskan pada bagian 03.',
    'Kelompok laki-laki: 10 penumpang (9 tidak selamat, 1 selamat). Tanpa pertanyaan lanjutan, 1 penumpang salah. Pertanyaan: apakah kelas 1 atau 2? Ya: 6 penumpang (5 tidak selamat, 1 selamat). Tidak: 4 penumpang (semuanya tidak selamat). Salah prediksi: 1 + 0 = 1, tidak ada perbaikan.',
    'Pertanyaan: apakah usia ≤ 9,3 tahun? (9,335 adalah titik tengah antara usia 0,67 dan 18.) Ya: 1 penumpang (selamat). Tidak: 9 penumpang (semuanya tidak selamat). Salah prediksi: 0 + 0 = 0.',
    'Pertanyaan usia dipilih karena salah prediksinya 0. Kedua kelompok hasilnya hanya berisi satu kelas, sehingga pembagian berhenti. Kelompok tersebut menjadi leaf node.',
    'Kelompok perempuan: 10 penumpang (2 tidak selamat, 8 selamat). Tanpa pertanyaan lanjutan, 2 penumpang salah. Pertanyaan: apakah kelas 1 atau 2? Ya: 8 penumpang (semuanya selamat). Tidak: 2 penumpang (semuanya tidak selamat). Salah prediksi: 0 + 0 = 0.',
    'Pertanyaan: apakah usia ≤ 26,5 tahun? Ya: 6 penumpang (2 tidak selamat, 4 selamat). Tidak: 4 penumpang (semuanya selamat). Salah prediksi: 2 + 0 = 2.',
    'Pertanyaan kelas dipilih karena salah prediksinya 0. Semua kelompok akhir hanya berisi satu kelas, sehingga 20 dari 20 penumpang diprediksi benar. Pada 714 penumpang, kelompok akhir masih berisi dua kelas (Figur 5).',
  ];

  /* ---- layout kotak pada panggung ---- */
  const KP = 5; const DT = 18; const JARAK = 26;
  const KOLOM = 5;

  function tataKotak(judul, orang, cx, y, skala, redup) {
    const baris = Math.max(1, Math.ceil(orang.length / KOLOM));
    const gw = (KOLOM - 1) * JARAK + DT;
    const gh = (baris - 1) * JARAK + DT;
    const w = (gw + 28) * skala;
    const h = (30 + gh + 30) * skala;
    const x = cx - w / 2;
    const titik = orang.map((p, i) => {
      const col = i % KOLOM, row = (i / KOLOM) | 0;
      return {
        p,
        x: x + (w - gw * skala) / 2 + col * JARAK * skala + DT / 2 * skala,
        y: y + 30 * skala + row * JARAK * skala + DT / 2 * skala,
      };
    });
    const barisText = orang.filter(p => p.y).length;
    const tidakSelesai = orang.length - barisText;
    return { judul, orang, x, y, w, h, skala, redup, titik, barisText, tidakSelesai };
  }

  function kotak(s) {
    if (s === 0) {
      return [tataKotak('Semua penumpang (20)', SEMUA, 280, 52, 1, false)];
    }
    if (s <= 3) {
      const k = RONDE[0].kandidat[s - 1];
      const b = bagi(SEMUA, KAND[k].uji);
      const yaJudul = s === 1 ? 'Ya: laki-laki (10)' : `Ya: ${KAND[k].yaT} (${b.ay.n})`;
      const tiJudul = s === 1 ? 'Tidak: perempuan (10)' : `Tidak: ${KAND[k].tiT} (${b.at.n})`;
      return [
        tataKotak(yaJudul, b.ya, 165, s === 2 ? 54 : 50, 1, false),
        tataKotak(tiJudul, b.tidak, 415, s === 2 ? 54 : 50, 1, false),
      ];
    }
    const dim = (cx, y, orang) => tataKotak(orang.length === 10 ? 'Laki-laki (10)' : 'Perempuan (10)', orang, cx, y, 0.6, true);
    if (s === 4) {
      return [tataKotak('Laki-laki (10)', GRUP.laki(), 165, 46, 1.08, false), dim(280, 228, GRUP.perem())];
    }
    if (s === 5 || s === 6) {
      const k = KAND[s === 5 ? 'kelas' : 'usia9'];
      const b = bagi(GRUP.laki(), k.uji);
      return [
        tataKotak(`Ya: ${k.yaT} (${b.ay.n})`, b.ya, 165, 48, 1, false),
        tataKotak(`Tidak: ${k.tiT} (${b.at.n})`, b.tidak, 395, 48, 1, false),
        dim(280, 230, GRUP.perem()),
      ];
    }
    if (s === 7) {
      const usia = GRUP.laki().filter(p => p.usia <= 9.335);
      const lebih = GRUP.laki().filter(p => p.usia > 9.335);
      return [
        tataKotak('Perempuan (10)', GRUP.perem(), 280, 46, 1.08, false),
        tataKotak('Selamat (1)', usia, 140, 228, 0.6, true),
        tataKotak('Tidak selamat (9)', lebih, 420, 228, 0.6, true),
      ];
    }
    if (s === 8 || s === 9) {
      const k = KAND[s === 8 ? 'kelas' : 'usia26'];
      const b = bagi(GRUP.perem(), k.uji);
      return [
        tataKotak(`Ya: ${k.yaT} (${b.ay.n})`, b.ya, 165, 48, 1, false),
        tataKotak(`Tidak: ${k.tiT} (${b.at.n})`, b.tidak, 395, 48, 1, false),
        tataKotak('Selamat (1)', GRUP.laki().filter(p => p.usia <= 9.335), 140, 230, 0.6, true),
        tataKotak('Tidak selamat (9)', GRUP.laki().filter(p => p.usia > 9.335), 420, 230, 0.6, true),
      ];
    }
    const satu = GRUP.laki().filter(p => p.usia <= 9.335);
    const dua = GRUP.laki().filter(p => p.usia > 9.335);
    const tiga = GRUP.perem().filter(p => p.kelas <= 2.5);
    const empat = GRUP.perem().filter(p => p.kelas > 2.5);
    return [
      tataKotak('Selamat (1)', satu, 150, 36, 0.8, false),
      tataKotak('Tidak selamat (9)', dua, 410, 36, 0.8, false),
      tataKotak('Selamat (8)', tiga, 150, 166, 0.8, false),
      tataKotak('Tidak selamat (2)', empat, 410, 166, 0.8, false),
    ];
  }

  /* ---- state ---- */
  let langkah = 0, putar = false, sibuk = false;
  let titik = SEMUA.map(p => ({ p, x: 0, y: 0, tx: 0, ty: 0 }));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const tunda = ms => new Promise(r => setTimeout(r, ms));

  function posisiTarget(s) {
    const map = new Map();
    kotak(s).forEach(b => b.titik.forEach(t => map.set(t.p.asal, { x: t.x, y: t.y })));
    titik.forEach(t => { const g = map.get(t.p.asal); t.tx = g.x; t.ty = g.y; });
  }

  async function animasiTitik(dur = 700, jeda = 15) {
    if (reduce) { titik.forEach(t => { t.x = t.tx; t.y = t.ty; }); gambar(); return; }
    const awal = titik.map(t => ({ x: t.x, y: t.y }));
    const total = dur + jeda * (titik.length - 1);
    await new Promise(res => {
      const t0 = performance.now();
      const step = now => {
        const el = now - t0;
        titik.forEach((t, i) => {
          const k = Math.min(1, Math.max(0, (el - i * jeda) / dur));
          const e = ease(k);
          t.x = awal[i].x + (t.tx - awal[i].x) * e;
          t.y = awal[i].y + (t.ty - awal[i].y) * e;
        });
        gambar();
        if (el < total) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }

  async function keLangkah(s) {
    sibuk = true;
    try {
      langkah = s;
      posisiTarget(s);
      perbarui();
      await animasiTitik();
    } finally { sibuk = false; }
    perbarui();
  }

  async function mainkan() {
    if (putar) { putar = false; perbarui(); return; }
    putar = true; perbarui();
    if (langkah >= 10) { await keLangkah(0); }
    btnPutar.textContent = 'Jeda';
    while (putar && langkah < 10) {
      const t0 = performance.now();
      await keLangkah(langkah + 1);
      const sisa = 2200 - (performance.now() - t0);
      await tunda(Math.max(0, sisa));
    }
    putar = false; perbarui();
  }

  const btnPutar = $('#pemilihan-putar'), btnMaju = $('#pemilihan-maju'), btnMundur = $('#pemilihan-mundur'), btnUlang = $('#pemilihan-ulang');
  const lblLangkah = $('#pemilihan-langkah'), iProgres = $('#pemilihan-progres-i');



  function renderKandidat() {
    const m = metaLangkah();
    const r = RONDE[m.ronde];
    const orang = GRUP[r.grup]();
    const wadah = $('#pemilihan-kandidat');
    let html = '';
    if (m.ronde > 0) {
      html += `<p class="catatan-kecil">Jenis kelamin tidak dapat membagi: semua penumpang di kelompok ini ${r.grup === 'laki' ? 'laki-laki' : 'perempuan'}.</p>`;
    }
    r.kandidat.forEach((id, i) => {
      const k = KAND[id];
      const b = bagi(orang, KAND[id].uji);
      let status = 'belum';
      if (m.uji !== null) {
        if (i < m.uji) status = 'teruji';
        else if (i === m.uji) status = 'diuji';
        else status = 'redup';
      } else if (m.selesai) {
        status = i === r.pemenang ? 'dipilih' : 'redup';
      }
      const cls = status === 'belum' ? 'belum' : (status === 'diuji' ? 'diuji' : (status === 'dipilih' ? 'dipilih' : 'redup'));
      let isi = `<b>${k.t}</b>`;
      if (status !== 'belum') {
        isi += `<span>Ya: ${b.ay.n} (${b.ay.t} tidak selamat, ${b.ay.s} selamat)</span>`;
        isi += `<span>Tidak: ${b.at.n} (${b.at.t} tidak selamat, ${b.at.s} selamat)</span>`;
        isi += `<span>Salah prediksi: ${b.ay.t} + ${b.at.t} = <b>${b.salah}</b></span>`;
      }
      if (status === 'dipilih') isi += '<span class="tanda">✓ dipilih</span>';
      html += `<div class="kartu ${cls}">${isi}</div>`;
    });
    wadah.innerHTML = html;
  }

  function metaLangkah() {
    if (langkah <= 4) return { ronde: 0, uji: langkah >= 1 && langkah <= 3 ? langkah - 1 : null, selesai: langkah === 4 };
    if (langkah <= 7) return { ronde: 1, uji: langkah >= 5 && langkah <= 6 ? langkah - 5 : null, selesai: langkah === 7 };
    return { ronde: 2, uji: langkah >= 8 && langkah <= 9 ? langkah - 8 : null, selesai: langkah === 10 };
  }

  function perbarui() {
    const m = metaLangkah();
    $('#pemilihan-ket').textContent = KETERANGAN[langkah];
    lblLangkah.textContent = `Langkah ${langkah} dari 10`;
    if (iProgres) iProgres.style.width = `${langkah / 10 * 100}%`;
    btnMundur.disabled = langkah === 0 || sibuk;
    btnMaju.disabled = langkah === 10 || sibuk;
    btnUlang.disabled = sibuk;
    btnPutar.textContent = putar ? 'Jeda' : (langkah >= 10 ? 'Putar ulang' : 'Putar');
    renderKandidat();
  }

  btnPutar?.addEventListener('click', () => { if (!sibuk) mainkan(); });
  btnMaju?.addEventListener('click', () => { if (!sibuk) { putar = false; keLangkah(langkah + 1); } });
  btnMundur?.addEventListener('click', () => { if (!sibuk && langkah > 0) { putar = false; keLangkah(langkah - 1); } });
  btnUlang?.addEventListener('click', () => { if (!sibuk) { putar = false; keLangkah(0); } });

  /* ---- gambar ---- */
  function drawTitik(c, t, skala) {
    const r = DT / 2 * skala;
    c.beginPath();
    if (t.p.y) {
      c.arc(t.x, t.y, r, 0, Math.PI * 2);
      c.fill();
    } else {
      c.moveTo(t.x, t.y - r); c.lineTo(t.x + r, t.y); c.lineTo(t.x, t.y + r); c.lineTo(t.x - r, t.y);
      c.fill();
    }
  }

  function drawKotak(c, b) {
    const sk = b.skala;
    const r = 10 * sk;
    const w = b.w, h = b.h;
    c.save();
    c.translate(b.x, b.y);
    c.fillStyle = kertas();
    c.strokeStyle = warna().garis; c.lineWidth = b.redup ? 1 : 1.5;
    c.globalAlpha = b.redup ? 0.45 : 1;
    c.beginPath(); c.moveTo(r, 0); c.lineTo(w - r, 0); c.arcTo(w, 0, w, r, r); c.lineTo(w, h - r); c.arcTo(w, h, w - r, h, r); c.lineTo(r, h); c.arcTo(0, h, 0, h - r, r); c.lineTo(0, r); c.arcTo(0, 0, r, 0, r); c.fill(); c.stroke();
    c.restore();
    c.font = `600 ${Math.min(13, 13 * sk)}px ${FONT}`;
    const jum = c.measureText(b.judul).width;
    const ukur = jum > b.w - 10 ? 11 : Math.min(13, 13 * sk);
    c.font = `600 ${ukur}px ${FONT}`;
    c.fillStyle = warna().tinta;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(b.judul, b.x + b.w / 2, b.y + 17 * sk);
    const by = b.y + (30 * sk + (Math.ceil(b.orang.length / KOLOM) - 1) * JARAK * sk + DT * sk + 12 * sk);
    const bw = ((KOLOM - 1) * JARAK + DT) * sk;
    c.fillStyle = warna().a2; c.fillRect(b.x + b.w / 2 - bw / 2, by, bw * (b.tidakSelesai / b.orang.length || 0), 6 * sk);
    c.fillStyle = warna().a1; c.fillRect(b.x + b.w / 2 - bw / 2 + bw * (b.tidakSelesai / b.orang.length || 0), by, bw * (b.barisText / b.orang.length || 0), 6 * sk);
    c.fillStyle = warna().tinta2; c.font = `10px ${FONT}`; c.textBaseline = 'middle';
    c.fillText(`${b.tidakSelesai} tidak selamat · ${b.barisText} selamat`, b.x + b.w / 2, by + 16 * sk);
    b.titik.forEach(t => {
      c.save(); c.globalAlpha = b.redup ? 0.45 : 1;
      c.fillStyle = t.p.y ? warna().a1 : warna().a2;
      drawTitik(c, t, sk);
      c.restore();
    });
  }

  const NODES = [
    { id: 'root', cx: 180, cy: 30, teks: ['apakah', 'laki-laki?'], n: 20, anak: ['laki', 'perem'] },
    { id: 'laki', cx: 90, cy: 110, teks: ['usia ≤ 9,3'], n: 10, anak: ['lakiYa', 'lakiTidak'] },
    { id: 'perem', cx: 270, cy: 110, teks: ['kelas ≤ 2,5'], n: 10, anak: ['peremYa', 'peremTidak'] },
    { id: 'lakiYa', cx: 45, cy: 190, pred: 'selamat', n: 1 },
    { id: 'lakiTidak', cx: 135, cy: 190, pred: 'tidak selamat', n: 9 },
    { id: 'peremYa', cx: 225, cy: 190, pred: 'selamat', n: 8 },
    { id: 'peremTidak', cx: 315, cy: 190, pred: 'tidak selamat', n: 2 },
  ];

  const SHOW = { 0: [], 1: [], 2: [], 3: [], 4: ['root', 'laki', 'perem'], 5: ['root', 'laki', 'perem'], 6: ['root', 'laki', 'perem'], 7: ['root', 'laki', 'perem', 'lakiYa', 'lakiTidak'], 8: ['root', 'laki', 'perem', 'lakiYa', 'lakiTidak'], 9: ['root', 'laki', 'perem', 'lakiYa', 'lakiTidak'], 10: ['root', 'laki', 'perem', 'lakiYa', 'lakiTidak', 'peremYa', 'peremTidak'] };

  function drawMini(cv) {
    const { c, w } = kanvas(cv);
    const sk = w / 360;
    c.save(); c.scale(sk, sk);
    c.fillStyle = kertas();
    c.fillRect(0, 0, 360, 220);
    c.strokeStyle = warna().garis; c.lineWidth = 1.5;
    const nodeById = {};
    NODES.forEach(n => nodeById[n.id] = n);
    const aktif = SHOW[langkah] || [];
    const drawBox = (id) => {
      const n = nodeById[id];
      if (!aktif.includes(id)) return;
      const x = n.cx - 39, y = n.cy - 22;
      c.fillStyle = kertas(); c.fillRect(x, y, 78, 44);
      c.strokeStyle = n.pred ? warna()[n.pred === 'selamat' ? 'a1' : 'a2'] : warna().garis; c.lineWidth = n.pred ? 2 : 1; c.strokeRect(x, y, 78, 44);
      const lines = n.pred ? [`Prediksi: ${n.pred}`, `n = ${n.n}`] : [...n.teks, `n = ${n.n}`];
      c.fillStyle = warna().tinta; c.font = `9px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      lines.forEach((t, i) => c.fillText(t, n.cx, n.cy + (i - (lines.length - 1) / 2) * 11));
    };
    const edges = [['root', 'laki'], ['root', 'perem'], ['laki', 'lakiYa'], ['laki', 'lakiTidak'], ['perem', 'peremYa'], ['perem', 'peremTidak']];
    edges.forEach(([a, b]) => {
      if (!aktif.includes(a) || !aktif.includes(b)) return;
      const na = nodeById[a], nb = nodeById[b];
      c.beginPath(); c.moveTo(na.cx, na.cy + 22); c.lineTo(nb.cx, nb.cy - 22); c.stroke();
    });
    aktif.forEach(drawBox);
    c.restore();
  }

  function gambar() {
    const cv = $('#cv-panggung');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    c.clearRect(0, 0, w, h);
    const sk = w / 560;
    c.setTransform(sk * window.devicePixelRatio, 0, 0, sk * window.devicePixelRatio, 0, 0);
    kotak(langkah).forEach(b => drawKotak(c, b));
    titik.forEach(t => {
      const b = kotak(langkah).find(bb => bb.titik.some(t2 => t2.p.asal === t.p.asal));
      c.save(); c.globalAlpha = b && b.redup ? 0.45 : 1;
      c.fillStyle = t.p.y ? warna().a1 : warna().a2;
      drawTitik(c, t, sk);
      c.restore();
    });
    if (langkah === 10) {
      const bx = 130, by = 274, bw = 300, bh = 30;
      c.fillStyle = kertas(); c.fillRect(bx, by, bw, bh);
      c.strokeStyle = warna().a1; c.lineWidth = 2; c.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
      c.fillStyle = warna().tinta; c.font = `600 12px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('20 dari 20 penumpang diprediksi benar.', bx + bw / 2, by + bh / 2);
    }
    drawMini($('#cv-mini'));
  }

  const cvP = $('#cv-panggung'), cvM = $('#cv-mini');
  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(() => {
    posisiTarget(0);
    titik.forEach(t => { t.x = t.tx; t.y = t.ty; });
    perbarui();
    gambar();
  });
})();

