/* widgets/pemilihan.js: Figur 2, pemilihan pertanyaan terbaik pada sampel 20.
   Panggung dua pita: pita atas untuk kelompok yang sedang diproses, pita bawah
   untuk kelompok yang menunggu dan hasil akhir. Setiap langkah (0-10) dianimasikan
   dalam tiga fase: uji (sorot kandidat), pilih (pemenang), bagi (garis lalu titik).
   Kartu kandidat dan pohon ringkas memakai DOM + kanvas terpisah. */
(() => {
  const { warna, kanvas } = Kit;
  const $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';
  const kertas = () => getComputedStyle(document.body).getPropertyValue('--kertas').trim() || '#F7F4EF';
  const kertas2 = () => getComputedStyle(document.body).getPropertyValue('--kertas-2').trim() || '#F0EDE7';

  const SEMUA = (window.SAMPEL_20 || [])
    .map(r => ({ asal: r[0], f: r[1], kelas: r[2], usia: r[3], y: r[4] }))
    .sort((a, b) => a.asal - b.asal);

  const GRUP = {
    semua: () => SEMUA,
    laki: () => SEMUA.filter(p => p.f === 0),
    perem: () => SEMUA.filter(p => p.f === 1),
  };

  const URUT = orang => [...orang].sort((a, b) => {
    if (a.y !== b.y) return b.y - a.y;
    return a.asal - b.asal;
  });

  const KAND = {
    gender: { t: 'apakah laki-laki?', uji: p => p.f === 0, yaT: 'laki-laki', tiT: 'perempuan' },
    kelas: { t: 'apakah kelas 1 atau 2?', uji: p => p.kelas <= 2.5, yaT: 'kelas 1 atau 2', tiT: 'kelas 3' },
    usia35: { t: 'apakah usia ≤ 35,5 tahun?', uji: p => p.usia <= 35.5, yaT: 'usia ≤ 35,5', tiT: 'usia > 35,5' },
    usia9: { t: 'apakah usia ≤ 9,3 tahun?', uji: p => p.usia <= 9.335, yaT: 'usia ≤ 9,3', tiT: 'usia > 9,3' },
    usia26: { t: 'apakah usia ≤ 26,5 tahun?', uji: p => p.usia <= 26.5, yaT: 'usia ≤ 26,5', tiT: 'usia > 26,5' },
  };

  const RONDE = [
    { grup: 'semua', kandidat: ['gender', 'kelas', 'usia35'], pemenang: 0 },
    { grup: 'laki', kandidat: ['kelas', 'usia9'], pemenang: 1 },
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
    return { ya: URUT(ya), tidak: URUT(tidak), ay, at,
      salah: Math.min(ay.t, ay.s) + Math.min(at.t, at.s) };
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

  /* ---- keadaan tiap langkah: kelompok aktif, hasil pembagian, kelompok selesai ---- */
  const hasilBagi = (grup, id) => bagi(GRUP[grup](), KAND[id].uji);
  const daunLaki = () => bagi(GRUP.laki(), KAND.usia9.uji);
  const daunPerem = () => bagi(GRUP.perem(), KAND.kelas.uji);

  function keadaan(s) {
    if (s === 0) {
      return { fase: 'awal', aktif: { grup: 'semua', orang: SEMUA, judul: 'Semua penumpang' },
        split: null, selesai: [], garis: [] };
    }
    if (s <= 3) {
      const id = RONDE[0].kandidat[s - 1];
      const b = hasilBagi('semua', id);
      return { fase: 'uji', aktif: { grup: 'semua', orang: SEMUA, judul: 'Semua penumpang' },
        id, kandidat: RONDE[0].kandidat, indeks: s - 1, split: b, selesai: [], garis: [] };
    }
    if (s === 4) {
      const b = hasilBagi('semua', 'gender');
      return { fase: 'pilih', aktif: { grup: 'semua', orang: SEMUA, judul: 'Semua penumpang' },
        id: 'gender', kandidat: RONDE[0].kandidat, indeks: 0, split: b, selesai: [], garis: ['root'] };
    }
    if (s === 5 || s === 6) {
      const id = RONDE[1].kandidat[s - 5];
      const b = hasilBagi('laki', id);
      return { fase: 'uji', aktif: { grup: 'laki', orang: GRUP.laki(), judul: 'Laki-laki' },
        id, kandidat: RONDE[1].kandidat, indeks: s - 5, split: b,
        selesai: [{ judul: 'Perempuan', orang: GRUP.perem(), catatan: '10 menunggu' }],
        garis: ['root', 'perem'] };
    }
    if (s === 7) {
      const b = hasilBagi('laki', 'usia9');
      return { fase: 'pilih', aktif: { grup: 'laki', orang: GRUP.laki(), judul: 'Laki-laki' },
        id: 'usia9', kandidat: RONDE[1].kandidat, indeks: 1, split: b,
        selesai: [{ judul: 'Perempuan', orang: GRUP.perem(), catatan: '10 menunggu' }],
        garis: ['root', 'perem', 'laki'] };
    }
    if (s === 8 || s === 9) {
      const id = RONDE[2].kandidat[s - 8];
      const b = hasilBagi('perem', id);
      const dl = daunLaki();
      return { fase: 'uji', aktif: { grup: 'perem', orang: GRUP.perem(), judul: 'Perempuan' },
        id, kandidat: RONDE[2].kandidat, indeks: s - 8, split: b,
        selesai: [
          { judul: 'Selamat', orang: dl.ya, catatan: '1 penumpang', akhir: true },
          { judul: 'Tidak selamat', orang: dl.tidak, catatan: '9 penumpang', akhir: true },
        ],
        garis: ['root', 'perem', 'laki'] };
    }
    const dl = daunLaki(), dp = daunPerem();
    return { fase: 'pilih', aktif: { grup: 'perem', orang: GRUP.perem(), judul: 'Perempuan' },
      id: 'kelas', kandidat: RONDE[2].kandidat, indeks: 0, split: dp,
      selesai: [
        { judul: 'Selamat', orang: dl.ya, catatan: '1, selesai' },
        { judul: 'Tidak selamat', orang: dl.tidak, catatan: '9, selesai' },
      ],
      garis: ['root', 'perem', 'laki'],
      akhir: [{ judul: 'Selamat', orang: dp.ya, catatan: '8' }, { judul: 'Tidak selamat', orang: dp.tidak, catatan: '2' }] };
  }

  /* ---- geometri panggung 760 x 490 ---- */
  const PW = 760, PH = 490;
  const DT = 18, JARAK = 26, KOLOM = 5;
  const PITA_ATAS = { y: 44, tinggi: 190 };
  const PITA_BAWAH = { y: 272, tinggi: 200 };
  const KEPALA_PITA = 24;         // ruang label di dalam pita
  const TENGAH = PW / 2;

  /* Titik disusun memusat pada pusatKotak. */
  function grid(orang, pusatKotak, atas, skala) {
    return orang.map((p, i) => {
      const col = i % KOLOM, row = (i / KOLOM) | 0;
      return {
        p,
        x: pusatKotak + (col - (KOLOM - 1) / 2) * JARAK * skala,
        y: atas + row * JARAK * skala + DT / 2 * skala,
        s: skala,
      };
    });
  }

  function tinggiIsi(n, skala) {
    const baris = Math.max(1, Math.ceil(n / KOLOM));
    return ((baris - 1) * JARAK + DT) * skala;
  }

  /* Kotak pita bawah: judul, kisi titik, catatan di dalam kotak.
     Semua kotak rata atas supaya deret terlihat sejajar. */
  function kotakBawah(orang, skala, cx) {
    const isi = tinggiIsi(orang.length, skala);
    const w = Math.max(104, ((KOLOM - 1) * JARAK + DT) * skala + 24);
    const h = 22 + isi + 6 + 13;
    const x = cx - w / 2;
    const y = PITA_BAWAH.y + KEPALA_PITA + 22;
    const titik = grid(orang, cx, y + 22, skala);
    return { orang, x, y, w, h, skala, titik };
  }

  /* Kotak pita atas: judul, kisi titik, batang, angka. */
  function kotakAtas(orang, skala, cx) {
    const isi = tinggiIsi(orang.length, skala);
    const w = Math.max(360, ((KOLOM - 1) * JARAK + DT) * skala + 60);
    const h = 30 + isi + 40;
    const x = cx - w / 2;
    const y = PITA_ATAS.y + KEPALA_PITA + (PITA_ATAS.tinggi - KEPALA_PITA - h) / 2;
    const atasTitik = y + 30;
    const titik = grid(orang, cx, atasTitik, skala);
    const s = orang.filter(p => p.y).length;
    return { orang, x, y, w, h, skala, titik, selamat: s, tidak: orang.length - s,
      barY: atasTitik + isi + 12, barW: Math.min(w - 60, ((KOLOM - 1) * JARAK + DT) * skala) };
  }

  /* Kotak bawah disusun rata: lebar maksimum dibatasi agar deret muat. */
  function deret(kotak, xAwal, xAkhir, sela) {
    if (!kotak.length) return kotak;
    kotak.forEach(b => { b.w = kotakBawah(b.orang, b.skala, 0).w; });
    const total = kotak.reduce((t, b) => t + b.w, 0) + sela * (kotak.length - 1);
    const longgar = xAkhir - xAwal;
    if (total > longgar) {
      const faktor = longgar / total;
      kotak.forEach(b => { b.skala *= faktor; });
      kotak.forEach(b => { b.w = kotakBawah(b.orang, b.skala, 0).w; });
    }
    const lebar = kotak.reduce((t, b) => t + b.w, 0) + sela * (kotak.length - 1);
    let x = xAwal + (longgar - lebar) / 2;
    kotak.forEach(b => {
      Object.assign(b, kotakBawah(b.orang, b.skala, x + b.w / 2));
      x += b.w + sela;
    });
    return kotak;
  }

  /* Tata letak lengkap satu langkah. */
  function tataLetak(s) {
    const k = keadaan(s);
    const tahap = s;
    const atas = kotakAtas(k.aktif.orang, 1, 205);
    const xAwal = 40, xAkhir = PW - 16;

    let bawah = [];
    if (tahap === 10) {
      bawah = [
        { jenis: 'akhir', judul: 'Selamat', orang: daunLaki().ya, catatan: '1 penumpang', skala: 0.8 },
        { jenis: 'akhir', judul: 'Tidak selamat', orang: daunLaki().tidak, catatan: '9 penumpang', skala: 0.8 },
        { jenis: 'akhir', judul: 'Selamat', orang: daunPerem().ya, catatan: '8 penumpang', skala: 0.8 },
        { jenis: 'akhir', judul: 'Tidak selamat', orang: daunPerem().tidak, catatan: '2 penumpang', skala: 0.8 },
      ];
    } else if (k.split) {
      bawah = [
        { jenis: 'hasil', judul: 'Ya: ' + KAND[k.id].yaT, orang: k.split.ya,
          catatan: k.split.ay.n + ' penumpang', skala: 0.92 },
        { jenis: 'hasil', judul: 'Tidak: ' + KAND[k.id].tiT, orang: k.split.tidak,
          catatan: k.split.at.n + ' penumpang', skala: 0.8 },
      ];
      k.selesai.forEach(g => bawah.push({ jenis: g.akhir ? 'akhir' : 'selesai', judul: g.judul,
        orang: g.orang, catatan: g.catatan, skala: 0.72 }));
    }
    bawah = deret(bawah, xAwal, xAkhir, 16);
    return { k, atas, bawah };
  }

  /* ---- state ---- */
  let langkah = 0, putar = false, sibuk = false;
  let fase = 0;                       // 0 diam, 1 uji, 2 pilih, 3 bagi, 4 selesai
  let sorot = -1;                     // indeks kandidat yang sedang disorot
  let progresGaris = 0;               // 0..1 panjang garis penghubung
  const titik = SEMUA.map(p => ({ p, x: 0, y: 0, s: 1, tx: 0, ty: 0, ts: 1 }));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let batal = false;
  let selesaikanSekarang = null;

  const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const tunda = ms => new Promise(r => setTimeout(r, ms));

  /* Kumpulkan posisi target semua titik dari tata letak tujuan. */
  function posisiTarget(tl) {
    const map = new Map();
    tl.atas.titik.forEach(t => map.set(t.p.asal, { x: t.x, y: t.y, s: tl.atas.skala }));
    tl.bawah.forEach(b => b.titik.forEach(t => map.set(t.p.asal, { x: t.x, y: t.y, s: b.skala })));
    for (const t of titik) {
      const g = map.get(t.p.asal);
      if (g) { t.tx = g.x; t.ty = g.y; t.ts = g.s; }
    }
  }

  function loncatKe(tl) {
    posisiTarget(tl);
    for (const t of titik) { t.x = t.tx; t.y = t.ty; t.s = t.ts; }
  }

  /* Animasi umum: panggil langkah(t) dengan t 0..1, bisa dipercepat. */
  function animasi(dur, langkahFn) {
    if (reduce) { langkahFn(1); return Promise.resolve(); }
    return new Promise(res => {
      selesaikanSekarang = () => { selesaikanSekarang = null; langkahFn(1); res(); };
      const t0 = performance.now();
      const tick = now => {
        if (batal) { selesaikanSekarang = null; res(); return; }
        const t = Math.min(1, (now - t0) / dur);
        langkahFn(ease(t));
        if (t < 1) requestAnimationFrame(tick);
        else { selesaikanSekarang = null; res(); }
      };
      requestAnimationFrame(tick);
    });
  }

  /* Titik meluncur ke target dengan jeda berurutan. */
  function geserTitik(dur = 620, jeda = 22) {
    const asal = titik.map(t => ({ x: t.x, y: t.y, s: t.s }));
    const total = dur + jeda * (titik.length - 1);
    const t0 = performance.now();
    return animasi(total, () => {
      const el = (reduce ? total : performance.now() - t0);
      titik.forEach((t, i) => {
        const q = Math.min(1, Math.max(0, (el - i * jeda) / dur));
        const e = ease(q);
        t.x = asal[i].x + (t.tx - asal[i].x) * e;
        t.y = asal[i].y + (t.ty - asal[i].y) * e;
        t.s = asal[i].s + (t.ts - asal[i].s) * e;
      });
      gambar();
    });
  }

  /* ---- urutan animasi satu langkah ---- */
  const JEDA_UJI = 260;

  async function jalankanLangkah(s, dariAwal) {
    batal = false;
    const k = keadaan(s);
    langkah = s;

    if (reduce || dariAwal) {
      fase = 4; sorot = -1; progresGaris = 1;
      loncatKe(tataLetak(s));
      perbarui();
      gambar();
      return;
    }

    /* 1. fase uji: sorot tiap kandidat satu per satu */
    if (k.fase === 'uji') {
      fase = 1;
      progresGaris = 0;
      const tl = tataLetak(s);
      posisiTarget(tl);
      perbarui();
      gambar();
      for (let i = 0; i <= k.indeks; i++) {
        if (batal) break;
        sorot = i;
        perbarui();
        gambar();
        await tunda(JEDA_UJI);
      }
      sorot = k.indeks;
      perbarui();
      gambar();
      await tunda(140);
    }

    /* 2. fase pilih: pemenang ditandai */
    fase = 2;
    sorot = k.fase === 'uji' ? k.indeks : 0;
    perbarui();
    gambar();
    await tunda(k.fase === 'uji' ? 240 : 180);
    if (batal) { fase = 4; sorot = -1; progresGaris = 1; perbarui(); gambar(); return; }

    /* 3. fase bagi: garis tumbuh, lalu titik meluncur */
    fase = 3;
    progresGaris = 0;
    perbarui();
    posisiTarget(tataLetak(s));
    gambar();
    await animasi(260, e => { progresGaris = e; gambar(); });
    if (batal) { fase = 4; sorot = -1; progresGaris = 1; perbarui(); gambar(); return; }
    progresGaris = 1;
    gambar();
    await geserTitik();
    fase = 4; sorot = -1;
    perbarui();
    gambar();
  }

  async function keLangkah(s, dariAwal = false) {
    if (selesaikanSekarang && !dariAwal) { selesaikanSekarang(); }
    sibuk = true;
    perbarui();
    try {
      await jalankanLangkah(s, dariAwal);
    } finally {
      sibuk = false;
      perbarui();
    }
  }

  async function mainkan() {
    if (putar) {
      putar = false;
      batal = true;
      if (selesaikanSekarang) selesaikanSekarang();
      perbarui();
      return;
    }
    putar = true;
    perbarui();
    if (langkah >= 10) await keLangkah(0, true);
    while (putar && langkah < 10) {
      const t0 = performance.now();
      await keLangkah(langkah + 1);
      if (!putar) break;
      await tunda(Math.max(0, 2400 - (performance.now() - t0)));
    }
    putar = false;
    perbarui();
  }

  const btnPutar = $('#pemilihan-putar'), btnMaju = $('#pemilihan-maju');
  const btnMundur = $('#pemilihan-mundur'), btnUlang = $('#pemilihan-ulang');
  const lblLangkah = $('#pemilihan-langkah'), iProgres = $('#pemilihan-progres-i');

  function statusKandidat(i) {
    const m = metaLangkah();
    if (m.uji !== null) {
      if (i === m.uji) return 'diuji';
      if (i < m.uji) return 'teruji';
      return 'belum';
    }
    if (m.selesai) return i === m.pemenang ? 'dipilih' : 'redup';
    return 'belum';
  }

  function metaLangkah() {
    if (langkah <= 4) return { ronde: 0, uji: langkah >= 1 && langkah <= 3 ? langkah - 1 : null, selesai: langkah === 4, pemenang: 0 };
    if (langkah <= 7) return { ronde: 1, uji: langkah >= 5 && langkah <= 6 ? langkah - 5 : null, selesai: langkah === 7, pemenang: 1 };
    return { ronde: 2, uji: langkah >= 8 && langkah <= 9 ? langkah - 8 : null, selesai: langkah === 10, pemenang: 0 };
  }

  function renderKandidat() {
    const m = metaLangkah();
    const r = RONDE[m.ronde];
    const orang = GRUP[r.grup]();
    const wadah = $('#pemilihan-kandidat');
    if (!wadah) return;
    const catatan = wadah.querySelector('.catatan-kecil');
    if (catatan) {
      catatan.textContent = m.ronde === 0 ? ''
        : `Jenis kelamin tidak dapat membagi kelompok ini: semuanya ${r.grup === 'laki' ? 'laki-laki' : 'perempuan'}.`;
      catatan.hidden = m.ronde === 0;
    }
    const kartu = wadah.querySelectorAll('.kartu');
    r.kandidat.forEach((id, i) => {
      const el = kartu[i];
      if (!el) return;
      const k = KAND[id];
      const b = bagi(orang, k.uji);
      const st = statusKandidat(i);
      el.className = 'kartu ' + st;
      el.classList.toggle('menyala', fase === 1 && sorot === i);
      el.querySelector('.k-judul').textContent = k.t;
      const ang = el.querySelector('.k-angka');
      ang.hidden = st === 'belum';
      if (st !== 'belum') {
        ang.querySelector('[data-isi="ya"]').textContent = `Ya ${b.ay.n}`;
        ang.querySelector('[data-isi="tidak"]').textContent = `Tidak ${b.at.n}`;
        ang.querySelector('[data-isi="salah"]').textContent = `salah ${b.salah}`;
      }
      el.querySelector('.k-tanda').hidden = st !== 'dipilih';
    });
    for (let i = r.kandidat.length; i < kartu.length; i++) kartu[i].hidden = true;
    for (let i = 0; i < r.kandidat.length; i++) kartu[i].hidden = false;
  }

  function perbarui() {
    const ket = $('#pemilihan-ket');
    if (ket) ket.textContent = KETERANGAN[langkah];
    if (lblLangkah) lblLangkah.textContent = `Langkah ${langkah} dari 10`;
    if (iProgres) iProgres.style.width = `${langkah / 10 * 100}%`;
    if (btnMundur) btnMundur.disabled = langkah === 0 || sibuk;
    if (btnMaju) btnMaju.disabled = langkah === 10 || sibuk;
    if (btnUlang) btnUlang.disabled = sibuk;
    if (btnPutar) btnPutar.textContent = putar ? 'Jeda' : (langkah >= 10 ? 'Putar ulang' : 'Putar');
    renderKandidat();
  }

  btnPutar?.addEventListener('click', () => mainkan());
  btnMaju?.addEventListener('click', () => {
    if (sibuk) { if (selesaikanSekarang) selesaikanSekarang(); return; }
    if (langkah >= 10) return;
    putar = false;
    keLangkah(langkah + 1);
  });
  btnMundur?.addEventListener('click', () => {
    if (langkah <= 0) return;
    putar = false;
    batal = true;
    if (selesaikanSekarang) selesaikanSekarang();
    keLangkah(langkah - 1, true);
  });
  btnUlang?.addEventListener('click', () => {
    putar = false;
    batal = true;
    if (selesaikanSekarang) selesaikanSekarang();
    keLangkah(0, true);
  });

  /* ---- menggambar panggung ---- */
  function bulat(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r);
    c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r);
    c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r);
    c.closePath();
  }

  function gambarTitik(c, t) {
    const r = DT / 2 * t.s;
    c.beginPath();
    if (t.p.y) {
      c.arc(t.x, t.y, r, 0, Math.PI * 2);
      c.fill();
    } else {
      c.moveTo(t.x, t.y - r); c.lineTo(t.x + r, t.y);
      c.lineTo(t.x, t.y + r); c.lineTo(t.x - r, t.y);
      c.closePath(); c.fill();
    }
  }

  function gambarPita(c, C, pita, judul) {
    c.save();
    c.fillStyle = kertas2();
    c.globalAlpha = 0.8;
    bulat(c, 12, pita.y, PW - 24, pita.tinggi, 12);
    c.fill();
    c.restore();
    c.save();
    c.font = '600 10px ' + FONT;
    c.fillStyle = C.tinta2;
    c.textAlign = 'left'; c.textBaseline = 'bottom';
    c.fillText(judul.toUpperCase(), 16, pita.y + 13);
    c.restore();
  }

  function gambarBatang(c, C, b, x, y, lebar, tinggi, teks) {
    const n = b.tidak + b.selamat || 1;
    const wTidak = lebar * (b.tidak / n);
    c.fillStyle = C.a2;
    c.fillRect(x, y, wTidak, tinggi);
    c.fillStyle = C.a1;
    c.fillRect(x + wTidak, y, lebar - wTidak, tinggi);
    if (teks) {
      c.fillStyle = C.tinta2;
      c.font = `10px ${FONT}`;
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText(teks, x + lebar / 2, y + tinggi + 3);
    }
  }

  function gambarKotakAtas(c, C, tl) {
    const b = tl.atas, k = tl.k;
    const aktif = fase === 1 || fase === 2;
    c.save();
    c.fillStyle = kertas();
    c.strokeStyle = aktif ? C.a1 : C.garis;
    c.lineWidth = aktif ? 2 : 1.25;
    bulat(c, b.x, b.y, b.w, b.h, 10);
    c.fill(); c.stroke();
    c.restore();

    c.save();
    c.font = '600 12px ' + FONT;
    c.fillStyle = C.tinta;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(k.aktif.judul + ' (' + b.orang.length + ' penumpang)', b.x + b.w / 2, b.y + 15);

    b.titik.forEach(t => { c.fillStyle = t.p.y ? C.a1 : C.a2; gambarTitik(c, t); });

    gambarBatang(c, C, b, b.x + (b.w - b.barW) / 2, b.barY, b.barW, 7,
      b.tidak + ' tidak selamat · ' + b.selamat + ' selamat');
    c.restore();
  }

  function gambarKalimat(c, C) {
    const k = tlKini.k;
    if (!k.split) return;
    if (fase !== 1 && fase !== 2) return;
    const pesan = fase === 2
      ? 'dipilih: ' + KAND[k.id].t + ' dengan salah prediksi ' + k.split.salah
      : 'jika dibagi dengan ' + KAND[k.id].t + ': salah prediksi ' +
        Math.min(k.split.ay.t, k.split.ay.s) + ' + ' + Math.min(k.split.at.t, k.split.at.s) + ' = ' + k.split.salah;
    c.save();
    c.font = '600 12px ' + FONT;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText(pesan).width + 20;
    const cx = TENGAH, cy = PITA_ATAS.y + PITA_ATAS.tinggi + 14;
    c.fillStyle = kertas2();
    bulat(c, cx - w / 2, cy - 11, w, 22, 11);
    c.fill();
    c.fillStyle = fase === 2 ? C.a1 : C.tinta;
    c.fillText(pesan, cx, cy);
    c.restore();
  }

  function gambarKotakBawah(c, C, b) {
    const putus = b.jenis === 'selesai';
    const kelas = b.orang.filter(p => p.y).length * 2 >= b.orang.length ? C.a1 : C.a2;
    c.save();
    c.fillStyle = kertas();
    c.strokeStyle = b.jenis === 'akhir' ? kelas : C.garis;
    c.lineWidth = b.jenis === 'akhir' ? 2 : 1.25;
    c.globalAlpha = putus ? 0.9 : 1;
    if (putus) c.setLineDash([4, 3]);
    bulat(c, b.x, b.y, b.w, b.h, 9);
    c.fill(); c.stroke();
    c.restore();

    c.save();
    c.font = '600 10.5px ' + FONT;
    c.fillStyle = putus ? C.redup : C.tinta;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(b.judul, b.x + b.w / 2, b.y + 12);
    b.titik.forEach(t => { c.fillStyle = t.p.y ? C.a1 : C.a2; gambarTitik(c, t); });
    c.font = '9.5px ' + FONT;
    c.fillStyle = putus ? C.tinta2 : (kelas === C.a1 ? C.a1 : C.a2);
    c.textBaseline = 'bottom';
    c.fillText(b.catatan, b.x + b.w / 2, b.y + b.h - 4);
    c.restore();
  }

  /* Garis siku dari kotak atas ke satu kotak bawah. progres 0..1.
     Semua garis keluar dari satu batang di bawah kotak atas, lalu bercabang. */
  function gambarGaris(c, C, dari, ke, label, progres) {
    if (progres <= 0) return;
    const x1 = dari.x + dari.w / 2, y1 = dari.y + dari.h;
    const x2 = ke.x + ke.w / 2, y2 = ke.y;
    const my = y1 + Math.max(14, Math.min(30, (y2 - y1) / 2 - 6));
    c.save();
    c.strokeStyle = C.garis;
    c.lineWidth = 1.6;
    c.setLineDash([]);
    c.beginPath();
    c.moveTo(x1, y1);
    if (progres < 0.34) {
      c.lineTo(x1, y1 + (my - y1) * (progres / 0.34));
    } else if (progres < 0.67) {
      c.lineTo(x1, my);
      c.lineTo(x1 + (x2 - x1) * ((progres - 0.34) / 0.33), my);
    } else {
      c.lineTo(x1, my); c.lineTo(x2, my);
      c.lineTo(x2, my + (y2 - my) * ((progres - 0.67) / 0.33));
    }
    c.stroke();

    if (progres >= 1 && label) {
      c.font = '600 9.5px ' + FONT;
      const tw = c.measureText(label).width;
      const cx = x1 + (x2 - x1) * 0.3;
      c.fillStyle = kertas2();
      bulat(c, cx - tw / 2 - 4, my - 15, tw + 8, 13, 6);
      c.fill();
      c.fillStyle = C.tinta2;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(label, cx, my - 8.5);
    }
    c.restore();
  }

  let tlKini = null;

  function gambar() {
    const cv = $('#cv-panggung');
    if (!cv) return;
    const { c, w } = kanvas(cv);
    if (!w) return;
    const C = warna();
    c.clearRect(0, 0, w, w * PH / PW);
    const sk = w / PW;
    c.setTransform(sk * devicePixelRatio, 0, 0, sk * devicePixelRatio, 0, 0);
    c.setLineDash([]);

    const tl = tataLetak(langkah);
    tlKini = tl;
    const k = tl.k;

    gambarPita(c, C, PITA_ATAS, 'kelompok yang sedang diproses');
    gambarPita(c, C, PITA_BAWAH, langkah === 10 ? 'kelompok akhir' : 'hasil pembagian dan kelompok yang menunggu');

    /* langkah 10 adalah ringkasan: garis penghubung tidak digambar supaya
       kotak atas (kelompok terakhir) tidak terbaca sebagai induk keempat daun. */
    if (langkah !== 10) {
      tl.bawah.forEach((b, i) => {
        const label = i === 0 ? 'Ya' : (i === 1 ? 'Tidak' : '');
        gambarGaris(c, C, tl.atas, b, label, progresGaris);
      });
    }

    tl.bawah.forEach(b => gambarKotakBawah(c, C, b));
    gambarKotakAtas(c, C, tl);
    gambarKalimat(c, C);

    /* titik: yang sudah di kotak atas tidak digambar dua kali */
    const asalAtas = new Set(tl.atas.titik.map(t => t.p.asal));
    titik.forEach(t => {
      if (asalAtas.has(t.p.asal)) return;
      c.save();
      c.fillStyle = t.p.y ? C.a1 : C.a2;
      gambarTitik(c, t);
      c.restore();
    });
    tl.atas.titik.forEach(t => { c.fillStyle = t.p.y ? C.a1 : C.a2; gambarTitik(c, t); });

    if (langkah === 10 && fase === 4) {
      const bw = 322, bh = 28, bx = TENGAH - bw / 2, by = 8;
      c.save();
      c.fillStyle = kertas2();
      c.strokeStyle = C.a1;
      c.lineWidth = 2;
      bulat(c, bx, by, bw, bh, 14);
      c.fill(); c.stroke();
      c.fillStyle = C.tinta;
      c.font = '600 12px ' + FONT;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('20 dari 20 penumpang diprediksi benar.', TENGAH, by + bh / 2);
      c.restore();
    }

    gambarPohon();
  }

  /* ---- pohon ringkas di kartu terpisah, 380 x 250 ---- */
  const TW = 380, TH = 250;
  const SIMPUL = {
    root: { x: 190, y: 34, baris: ['laki-laki?'], n: 20 },
    laki: { x: 100, y: 112, baris: ['usia ≤ 9,3'], n: 10 },
    perem: { x: 280, y: 112, baris: ['kelas ≤ 2,5'], n: 10 },
    lakiYa: { x: 52, y: 196, pred: 'selamat', n: 1 },
    lakiTidak: { x: 148, y: 196, pred: 'tidak selamat', n: 9 },
    peremYa: { x: 232, y: 196, pred: 'selamat', n: 8 },
    peremTidak: { x: 328, y: 196, pred: 'tidak selamat', n: 2 },
  };
  const ANAK = {
    root: [['laki', 'Ya'], ['perem', 'Tidak']],
    laki: [['lakiYa', 'Ya'], ['lakiTidak', 'Tidak']],
    perem: [['peremYa', 'Ya'], ['peremTidak', 'Tidak']],
  };

  /* simpul yang sudah ada pada tiap langkah */
  function simpulTampil() {
    if (langkah < 4) return [];
    if (langkah < 7) return ['root', 'laki', 'perem'];
    if (langkah < 10) return ['root', 'laki', 'perem', 'lakiYa', 'lakiTidak'];
    return Object.keys(SIMPUL);
  }

  function gambarPohon() {
    const cv = $('#cv-pohon-ringkas');
    if (!cv) return;
    const { c, w } = kanvas(cv);
    if (!w) return;
    const C = warna();
    c.clearRect(0, 0, w, w * TH / TW);
    const sk = w / TW;
    c.setTransform(sk * devicePixelRatio, 0, 0, sk * devicePixelRatio, 0, 0);

    const tampil = new Set(simpulTampil());
    const BW = 74, BH = 40;

    /* garis dulu */
    Object.keys(ANAK).forEach(id => {
      if (!tampil.has(id)) return;
      ANAK[id].forEach(([anak, label]) => {
        if (!tampil.has(anak)) return;
        const a = SIMPUL[id], b = SIMPUL[anak];
        c.strokeStyle = C.garis;
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(a.x, a.y + BH / 2);
        c.lineTo(a.x, (a.y + BH / 2 + b.y - BH / 2) / 2);
        c.lineTo(b.x, (a.y + BH / 2 + b.y - BH / 2) / 2);
        c.lineTo(b.x, b.y - BH / 2);
        c.stroke();
        c.fillStyle = C.tinta2;
        c.font = `9px ${FONT}`;
        c.textAlign = 'right'; c.textBaseline = 'middle';
        c.fillText(label, b.x - 6, (a.y + BH / 2 + b.y - BH / 2) / 2 - 6);
      });
    });

    /* kotak simpul */
    Object.keys(SIMPUL).forEach(id => {
      if (!tampil.has(id)) return;
      const s = SIMPUL[id];
      c.fillStyle = kertas();
      c.strokeStyle = s.pred ? (s.pred === 'selamat' ? C.a1 : C.a2) : C.garis;
      c.lineWidth = s.pred ? 1.8 : 1.2;
      bulat(c, s.x - BW / 2, s.y - BH / 2, BW, BH, 7);
      c.fill(); c.stroke();

      const baris = s.pred ? ['Prediksi:', s.pred] : s.baris;
      c.fillStyle = C.tinta;
      c.font = `9.5px ${FONT}`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      baris.forEach((t, i) => c.fillText(t, s.x, s.y - 6 + i * 11));
      c.fillStyle = C.tinta2;
      c.font = `9px ${FONT}`;
      c.fillText(`n = ${s.n}`, s.x, s.y + 12);
    });
  }

  /* ---- inisialisasi ---- */
  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);

  const cvPanggung = $('#cv-panggung');
  if (cvPanggung) {
    cvPanggung.style.aspectRatio = `${PW}/${PH}`;
  }
  loncatKe(tataLetak(0));
  fase = 4;
  perbarui();
  gambar();
  document.fonts?.ready.then(() => { perbarui(); gambar(); });

})();
