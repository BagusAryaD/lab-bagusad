/* widgets/pemilihan.js: Figur 2, pemilihan pertanyaan terbaik pada sampel 20.
   View tunggal 700 x 400 berisi dua wilayah scene: area kerja di kiri (kotak
   kelompok aktif, daftar split di kanan, hasil pembagian di bawah) dan pohon di
   kanan. Kamera (cx, cy, zoom) berpindah antar wilayah tiap langkah, jadi 14
   langkah (0-13) hanya mengubah isi scene, bukan ukuran kanvas. Kartu kandidat
   DOM dihapus: semua angka ada di canvas, teks `KETERANGAN` menjadi padanan
   untuk pembaca layar bicara. */
(() => {
  const { warna, kanvas } = Kit;
  const $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';
  const kertas = () => getComputedStyle(document.body).getPropertyValue('--kertas').trim() || '#F7F4EF';
  const kertas2 = () => getComputedStyle(document.body).getPropertyValue('--kertas-2').trim() || '#F0EDE7';
  const clamp01 = x => x < 0 ? 0 : (x > 1 ? 1 : x);

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
    'Kelompok yang sedang diproses: 20 penumpang, 9 selamat dan 11 tidak selamat. Tanpa pertanyaan pun, memprediksi semuanya tidak selamat sudah membuat 9 penumpang salah. Tiga split yang mungkin dicoba satu per satu: apakah laki-laki, apakah kelas 1 atau 2, dan apakah usia kurang dari atau sama dengan 35,5 tahun.',
    'Split 1, apakah laki-laki? Ya: 10 penumpang (9 tidak selamat, 1 selamat), salah 1. Tidak: 10 penumpang (2 tidak selamat, 8 selamat), salah 2. Jika setiap kelompok diprediksi dengan kelas yang lebih banyak, 1 + 2 = 3 penumpang salah.',
    'Split 1 disimpan ke daftar di kanan: apakah laki-laki memberi 3 penumpang salah. Split 2, apakah kelas 1 atau 2? Ya: 14 penumpang (5 tidak selamat, 9 selamat), salah 5. Tidak: 6 penumpang (semuanya tidak selamat), salah 0. Total 5 + 0 = 5.',
    'Split 2 disimpan: apakah kelas 1 atau 2 memberi 5 penumpang salah. Split 3, apakah usia kurang dari atau sama dengan 35,5 tahun? Ya: 16 penumpang (10 tidak selamat, 6 selamat), salah 6. Tidak: 4 penumpang (1 tidak selamat, 3 selamat), salah 1. Total 6 + 1 = 7. Untuk setiap ciri, hanya nilai batas terbaik yang ditampilkan.',
    'Split 3 disimpan: 7 penumpang salah. Dari tiga split, paling sedikit adalah 3 pada pertanyaan apakah laki-laki, sehingga pertanyaan itu dipilih, kelompok dibagi menjadi dua, dan pohon mulai terbentuk. Ukuran yang dipakai algoritma sebenarnya dijelaskan pada bagian 03.',
    'Kamera masuk ke cabang laki-laki. Kelompok laki-laki: 10 penumpang (9 tidak selamat, 1 selamat), tanpa pertanyaan lanjutan 1 penumpang salah. Split yang mungkin: apakah kelas 1 atau 2 dan apakah usia kurang dari atau sama dengan 9,3 tahun. Jenis kelamin tidak dapat membagi kelompok ini karena semuanya laki-laki.',
    'Split 1, apakah kelas 1 atau 2? Ya: 6 penumpang (5 tidak selamat, 1 selamat), salah 1. Tidak: 4 penumpang (semuanya tidak selamat), salah 0. Total 1 + 0 = 1, tidak ada perbaikan dibanding tanpa pertanyaan.',
    'Split 1 disimpan: 1 penumpang salah. Split 2, apakah usia kurang dari atau sama dengan 9,3 tahun? Ya: 1 penumpang (selamat), salah 0. Tidak: 9 penumpang (semuanya tidak selamat), salah 0. Total 0 + 0 = 0. Nilai 9,335 adalah titik tengah antara usia 0,67 dan 18.',
    'Split 2 dipilih karena salah prediksinya 0, lebih baik dari split 1 yang memberi 1. Pertanyaan usia terpasang di pohon, kedua kelompok hasilnya hanya berisi satu kelas, sehingga pembagian berhenti dan kedua simpul menjadi leaf node.',
    'Kamera masuk ke cabang perempuan. Kelompok perempuan: 10 penumpang (2 tidak selamat, 8 selamat), tanpa pertanyaan lanjutan 2 penumpang salah. Split yang mungkin: apakah kelas 1 atau 2 dan apakah usia kurang dari atau sama dengan 26,5 tahun. Jenis kelamin tidak dapat membagi kelompok ini karena semuanya perempuan.',
    'Split 1, apakah kelas 1 atau 2? Ya: 8 penumpang (semuanya selamat), salah 0. Tidak: 2 penumpang (semuanya tidak selamat), salah 0. Total 0 + 0 = 0.',
    'Split 1 disimpan: 0 penumpang salah. Split 2, apakah usia kurang dari atau sama dengan 26,5 tahun? Ya: 6 penumpang (2 tidak selamat, 4 selamat), salah 2. Tidak: 4 penumpang (semuanya selamat), salah 0. Total 2 + 0 = 2.',
    'Split 1, apakah kelas 1 atau 2, dipilih karena salah prediksinya 0. Pertanyaan terpasang di pohon dan semua kelompok akhir hanya berisi satu kelas.',
    'Pohon lengkap: akar memilih apakah laki-laki, cabang laki-laki memilih apakah usia kurang dari atau sama dengan 9,3 tahun, cabang perempuan memilih apakah kelas 1 atau 2. Semua 20 dari 20 penumpang diprediksi benar. Pada 714 penumpang, kelompok akhir pada kedalaman yang wajar masih berisi dua kelas (Figur 5).',
  ];

  /* ---- metadata langkah 0-13 ---- */
  const MAKS = 13;
  function meta(s) {
    if (s <= 4) return { ronde: 0, awal: s === 0,
      uji: s >= 1 && s <= 3 ? s - 1 : null,
      arsip: s >= 2 && s <= 4 ? s - 2 : null,
      pilih: s === 4, akhir: false };
    if (s <= 8) return { ronde: 1, awal: s === 5,
      uji: s >= 6 && s <= 7 ? s - 6 : null,
      arsip: s >= 7 && s <= 8 ? s - 7 : null,
      pilih: s === 8, akhir: false };
    return { ronde: 2, awal: s === 9,
      uji: s >= 10 && s <= 11 ? s - 10 : null,
      arsip: s >= 11 && s <= 12 ? s - 11 : null,
      pilih: s === 12, akhir: s === 13 };
  }

  function daftarBaris(m) {
    const out = [];
    if (m.ronde > 0) out.push({ id: 'gender', mustahil: true });
    RONDE[m.ronde].kandidat.forEach(id => out.push({ id, mustahil: false }));
    return out;
  }

  function statusBaris(j, m) {
    const b = daftarBaris(m)[j];
    if (!b) return 'belum';
    if (b.mustahil) return 'mustahil';
    const r = RONDE[m.ronde];
    const idx = r.kandidat.indexOf(b.id);
    if (m.pilih || m.akhir) return idx === r.pemenang ? 'dipilih' : 'terarsip';
    if (m.uji === idx) return 'diuji';
    if (m.arsip !== null && idx <= m.arsip) return 'terarsip';
    return 'belum';
  }

  function idsPohon(s) {
    if (s < 4) return [];
    if (s < 8) return ['root', 'laki', 'perem'];
    if (s < 12) return ['root', 'laki', 'perem', 'lakiYa', 'lakiTidak'];
    return ['root', 'laki', 'perem', 'lakiYa', 'lakiTidak', 'peremYa', 'peremTidak'];
  }

  function isiPohon(id, s) {
    if (id === 'root') return { baris: ['apakah', 'laki-laki?'], n: 20, status: 'dipilih' };
    if (id === 'laki') return s >= 8
      ? { baris: ['apakah usia', '≤ 9,3?'], n: 10, status: 'dipilih' }
      : { baris: ['Laki-laki'], n: 10, status: 'menunggu' };
    if (id === 'perem') return s >= 12
      ? { baris: ['apakah kelas', '1 atau 2?'], n: 10, status: 'dipilih' }
      : { baris: ['Perempuan'], n: 10, status: 'menunggu' };
    if (id === 'lakiYa') return { baris: ['Prediksi:', 'selamat'], n: 1, status: 'daun', pred: 'selamat' };
    if (id === 'lakiTidak') return { baris: ['Prediksi:', 'tidak selamat'], n: 9, status: 'daun', pred: 'tidak selamat' };
    if (id === 'peremYa') return { baris: ['Prediksi:', 'selamat'], n: 8, status: 'daun', pred: 'selamat' };
    return { baris: ['Prediksi:', 'tidak selamat'], n: 2, status: 'daun', pred: 'tidak selamat' };
  }

  /* ---- geometri scene ---- */
  const VW = 700, VH = 400;
  const DT = 18, JARAK = 26, KOLOM = 5, KOLOM_HASIL = 6;
  const BOX = { x: 0, y: 16, w: 240 };
  const DAFTAR = { x: 264, w: 190, y0: 16, h: 48, sela: 6 };
  const HASIL = { w: 172, gap: 24, cx: 120 };
  const TX = 570, TY = 60;           // asal pohon di scene
  const BW = 92, BH = 48;

  function tinggiIsi(n, kolom) {
    const baris = Math.max(1, Math.ceil(n / kolom));
    return (baris - 1) * JARAK + DT;
  }

  function grid(orang, cx, atas, kolom) {
    return orang.map((p, i) => {
      const col = i % kolom, row = (i / kolom) | 0;
      return { p,
        x: cx + (col - (kolom - 1) / 2) * JARAK,
        y: atas + row * JARAK + DT / 2 };
    });
  }

  function kotakAktif(r) {
    const orang = GRUP[RONDE[r].grup]();
    const isi = tinggiIsi(orang.length, KOLOM);
    return { orang, isi, x: BOX.x, y: BOX.y, w: BOX.w, h: 28 + isi + 10 + 7 + 12 + 8 };
  }

  function hasilRect(r, id) {
    const box = kotakAktif(r);
    const b = bagi(GRUP[RONDE[r].grup](), KAND[id].uji);
    const top = box.y + box.h + 30;
    const buat = (orang, x) => {
      const isi = tinggiIsi(orang.length, KOLOM_HASIL);
      return { x, y: top, w: HASIL.w, h: isi + 44, isi };
    };
    return { b,
      kiri: buat(b.ya, HASIL.cx - HASIL.w - HASIL.gap / 2),
      kanan: buat(b.tidak, HASIL.cx + HASIL.gap / 2) };
  }

  function maxTinggiHasil(r) {
    let mx = 0;
    RONDE[r].kandidat.forEach(id => {
      const h = hasilRect(r, id);
      mx = Math.max(mx, h.kiri.h, h.kanan.h);
    });
    return mx;
  }

  function fit(x0, y0, x1, y1) {
    const pad = 16;
    const w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2;
    const z = Math.min(VW / w, VH / h, 2.6);
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, z };
  }

  function kfKerja(r, adaHasil) {
    const box = kotakAktif(r);
    const y1 = adaHasil ? box.y + box.h + 30 + maxTinggiHasil(r) : box.y + box.h + 20;
    return fit(-64, -8, DAFTAR.x + DAFTAR.w, y1);
  }

  function kfPohon(ids, banner) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    ids.forEach(id => {
      const s = SIMPUL[id];
      x0 = Math.min(x0, s.x - BW / 2); x1 = Math.max(x1, s.x + BW / 2);
      y0 = Math.min(y0, s.y - BH / 2); y1 = Math.max(y1, s.y + BH / 2);
    });
    x0 += TX; x1 += TX; y0 += TY; y1 += TY;
    x0 = Math.min(x0, TX);                 // judul wilayah mulai di TX
    y0 = Math.min(y0, 42);                 // judul wilayah pohon
    if (banner) y0 = Math.min(y0, 4);      // banner langkah akhir
    return fit(x0, y0, x1, y1);
  }

  function kfFokus(r) {
    return r === 1 ? fit(570, 110, 766, 196) : fit(766, 110, 962, 196);
  }

  function kameraAkhir(s) {
    const m = meta(s);
    if (s === 0) return kfKerja(0, false);
    if (m.awal) return kfKerja(m.ronde, false);
    if (m.pilih) return kfPohon(idsPohon(s), false);
    if (m.akhir) return kfPohon(idsPohon(s), true);
    return kfKerja(m.ronde, true);
  }

  /* ---- state ---- */
  const MAKS_LANGKAH = MAKS;
  let langkah = 0, putar = false, sibuk = false, fase = 0;
  let rondeAktif = 0;
  let kamera = { cx: 0, cy: 0, z: 1 };
  let orangAktif = [];                 // titik kelompok aktif, posisi tetap
  let pratinjau = [];                  // salinan titik untuk hasil pembagian
  let alphaHasil = 0, alphaDaftar = 1, alphaKerja = 1, alphaPemenang = 0, bannerAlpha = 0;
  let hasilId = null;                  // kandidat yang hasilnya sedang di panggung
  let barisAlpha = [1, 1, 1];
  let alphaPohon = {}, alphaGaris = {};
  let fokusId = null, alphaFokus = 0;
  let generasi = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let selesaikanSekarang = null;

  const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const tunda = ms => new Promise(r => setTimeout(r, ms));

  /* Animasi sekali jalan. `selesaikanSekarang` melompat ke akhir sekaligus
     menghentikan loop rAF, jadi tidak ada animasi bayangan yang jalan terus
     setelah pengguna menekan tombol. */
  function animasi(dur, langkahFn) {
    if (reduce) { langkahFn(1); return Promise.resolve(); }
    return new Promise(res => {
      let selesai = false;
      const akhiri = () => {
        if (selesai) return;
        selesai = true;
        selesaikanSekarang = null;
        langkahFn(1);
        res();
      };
      selesaikanSekarang = akhiri;
      const t0 = performance.now();
      const tick = now => {
        if (selesai) return;
        const t = Math.min(1, (now - t0) / dur);
        langkahFn(ease(t));
        if (t < 1) requestAnimationFrame(tick);
        else akhiri();
      };
      requestAnimationFrame(tick);
    });
  }

  /* Animasi umum dengan pemanggil gambar. */
  const pudar = (dur, fn) => animasi(dur, e => { fn(e); gambar(); });

  /* Kamera terbang ke target, tick dipanggil tiap frame (untuk memudar
     titik atau menumbuhkan pohon bersamaan dengan terbang). */
  function terbang(target, dur, tick) {
    const a = { ...kamera };
    if (reduce) {
      kamera = { ...target }; tick?.(1); gambar();
      return Promise.resolve();
    }
    return animasi(dur, e => {
      kamera.cx = a.cx + (target.cx - a.cx) * e;
      kamera.cy = a.cy + (target.cy - a.cy) * e;
      kamera.z = a.z + (target.z - a.z) * e;
      tick?.(e);
      gambar();
    });
  }

  /* Titik meluncur ke target tx/ty/ts dengan jeda berurutan. */
  function luncur(arr, dur, jeda, tick) {
    const asal = arr.map(t => ({ x: t.x, y: t.y, s: t.s }));
    const total = dur + jeda * Math.max(0, arr.length - 1);
    const t0 = performance.now();
    return animasi(total, () => {
      const el = reduce ? total : performance.now() - t0;
      arr.forEach((t, i) => {
        const q = ease(clamp01((el - i * jeda) / dur));
        t.x = asal[i].x + (t.tx - asal[i].x) * q;
        t.y = asal[i].y + (t.ty - asal[i].y) * q;
        t.s = asal[i].s + (t.ts - asal[i].s) * q;
      });
      tick?.(el);
      gambar();
    });
  }

  /* Titik tumbuh dari skala 0 dengan jeda berurutan. */
  function tumbuh(arr, dur, jeda) {
    const total = dur + jeda * Math.max(0, arr.length - 1);
    const t0 = performance.now();
    return animasi(total, () => {
      const el = reduce ? total : performance.now() - t0;
      arr.forEach((t, i) => { t.s = ease(clamp01((el - i * jeda) / dur)); });
      gambar();
    });
  }

  /* ---- penyusunan state ---- */
  function susunAktif(r) {
    const box = kotakAktif(r);
    const tks = grid(box.orang, BOX.w / 2, box.y + 28, KOLOM);
    orangAktif = box.orang.map((p, i) => ({ p, x: tks[i].x, y: tks[i].y, s: 1 }));
    rondeAktif = r;
  }

  function siapkanPratinjau(r, id) {
    const box = kotakAktif(r);
    const tks = grid(box.orang, BOX.w / 2, box.y + 28, KOLOM);
    pratinjau = box.orang.map((p, i) => ({ p, x: tks[i].x, y: tks[i].y, s: 1,
      tx: tks[i].x, ty: tks[i].y, ts: 1 }));
    const h = hasilRect(r, id);
    const peta = new Map();
    const isiPeta = (orang, rect) => {
      const cx = rect.x + rect.w / 2;
      orang.forEach((p, i) => {
        const col = i % KOLOM_HASIL, row = (i / KOLOM_HASIL) | 0;
        peta.set(p.asal, {
          x: cx + (col - (KOLOM_HASIL - 1) / 2) * JARAK,
          y: rect.y + 22 + row * JARAK + DT / 2,
        });
      });
    };
    isiPeta(h.b.ya, h.kiri);
    isiPeta(h.b.tidak, h.kanan);
    pratinjau.forEach(t => {
      const g = peta.get(t.p.asal);
      if (g) { t.tx = g.x; t.ty = g.y; t.ts = 1; }
    });
    hasilId = id;
  }

  function rectBaris(j) {
    return { x: DAFTAR.x, y: DAFTAR.y0 + j * (DAFTAR.h + DAFTAR.sela), w: DAFTAR.w, h: DAFTAR.h };
  }

  function normalisasi(m) {
    const r = m.ronde;
    /* langkah pembuka ronde tidak menukar titik dulu: titik ronde lama harus
       masih ada untuk dimatikan saat kamera terbang ke simpul pohon. */
    if (!m.awal && rondeAktif !== r) { susunAktif(r); pratinjau = []; alphaHasil = 0; hasilId = null; }
    if (!m.awal) orangAktif.forEach(t => t.s = 1);
    alphaDaftar = 1;
    alphaKerja = 1;
    alphaPemenang = 0;
    barisAlpha = [1, 1, 1];
    if (m.arsip !== null) barisAlpha[(r > 0 ? 1 : 0) + m.arsip] = 0;
    fokusId = r === 1 ? 'laki' : (r === 2 ? 'perem' : null);
    alphaFokus = 0;
    if (m.awal) { pratinjau = []; alphaHasil = 0; hasilId = null; }
  }

  function terapkanAkhir(s) {
    const m = meta(s);
    const ids = idsPohon(s);
    if (rondeAktif !== m.ronde || !orangAktif.length) susunAktif(m.ronde);
    orangAktif.forEach(t => t.s = 1);
    alphaDaftar = 1;
    alphaKerja = 1;
    barisAlpha = [1, 1, 1];
    alphaPemenang = (m.pilih || m.akhir) ? 1 : 0;
    if (m.uji !== null) {
      siapkanPratinjau(m.ronde, RONDE[m.ronde].kandidat[m.uji]);
      pratinjau.forEach(t => { t.x = t.tx; t.y = t.ty; t.s = t.ts; });
      alphaHasil = 1;
    } else {
      pratinjau = [];
      alphaHasil = 0;
      hasilId = null;
    }
    alphaPohon = {}; alphaGaris = {};
    ids.forEach(id => { alphaPohon[id] = 1; });
    Object.keys(ANAK).forEach(dari => {
      if (!ids.includes(dari)) return;
      ANAK[dari].forEach(([ke]) => { if (ids.includes(ke)) alphaGaris[ke] = 1; });
    });
    bannerAlpha = m.akhir ? 1 : 0;
    fokusId = null; alphaFokus = 0;
    kamera = kameraAkhir(s);
    fase = 4;
  }

  /* Tandai simpul dan garis yang belum ada, lalu kembalikan daftarnya. */
  function tumbuhPohon(ids) {
    const node = ids.filter(id => !(alphaPohon[id] >= 1));
    const garis = [];
    ids.forEach(dari => {
      if (!ANAK[dari]) return;
      ANAK[dari].forEach(([ke]) => {
        if (ids.includes(ke) && !(alphaGaris[ke] >= 1) && !garis.includes(ke)) garis.push(ke);
      });
    });
    node.forEach(id => { alphaPohon[id] = 0; });
    garis.forEach(ke => { alphaGaris[ke] = 0; });
    return { node, garis };
  }

  /* ---- arsip: hasil terbang ke daftar di kanan ---- */
  async function arsipkan(m, g) {
    const j = (m.ronde > 0 ? 1 : 0) + m.arsip;
    barisAlpha[j] = 0;
    const rect = rectBaris(j);
    const tx = rect.x + rect.w * 0.4, ty = rect.y + rect.h * 0.6;
    pratinjau.forEach(t => { t.tx = tx; t.ty = ty; t.ts = 0; });
    await luncur(pratinjau, 460, 10, el => { alphaHasil = 1 - clamp01(el / 240); });
    pratinjau = [];
    alphaHasil = 0;
    if (g !== generasi) return false;
    await pudar(240, e => { barisAlpha[j] = e; });
    return g === generasi;
  }

  async function jalankanLangkah(s, dariAwal, g) {
    const m = meta(s);
    langkah = s;

    if (reduce || dariAwal) {
      terapkanAkhir(s);
      perbarui(); gambar();
      return;
    }

    normalisasi(m);
    fase = 1;
    perbarui(); gambar();

    if (s === 0) { terapkanAkhir(0); perbarui(); gambar(); return; }

    /* --- langkah pembuka ronde: zoom ke simpul, lalu masuk area kerja --- */
    if (m.awal) {
      alphaFokus = 0;
      await terbang(kfFokus(m.ronde), 560, e => {
        orangAktif.forEach(t => t.s = 1 - e);
        alphaDaftar = 1 - e;
        alphaKerja = 1 - e;
        alphaFokus = e;
      });
      if (g !== generasi) return;
      await tunda(300);
      if (g !== generasi) return;

      susunAktif(m.ronde);
      orangAktif.forEach(t => t.s = 0);
      pratinjau = []; alphaHasil = 0; hasilId = null;
      alphaPemenang = 0; barisAlpha = [1, 1, 1];
      alphaKerja = 0; alphaDaftar = 0;
      await terbang(kfKerja(m.ronde, false), 620, e => { alphaKerja = clamp01(e * 1.8); });
      if (g !== generasi) return;

      await Promise.all([
        tumbuh(orangAktif, 280, 12),
        pudar(460, e => { alphaDaftar = e; }),
      ]);
      if (g !== generasi) return;
      alphaKerja = 1;
      alphaFokus = 0;
      fase = 4; perbarui(); gambar();
      return;
    }

    /* --- langkah uji: arsipkan split sebelumnya, lalu tampilkan hasil baru --- */
    if (m.uji !== null) {
      if (m.arsip !== null) {
        const ok = await arsipkan(m, g);
        if (!ok || g !== generasi) return;
      }
      siapkanPratinjau(m.ronde, RONDE[m.ronde].kandidat[m.uji]);
      alphaHasil = 0;
      /* kotak hasil memudar masuk bersama titik yang meluncur */
      await luncur(pratinjau, 520, 14, el => { alphaHasil = clamp01(el / 260); });
      if (g !== generasi) return;
      alphaHasil = 1;
      fase = 4; perbarui(); gambar();
      return;
    }

    /* --- langkah pilih: arsip, tandai pemenang, jeda, pohon tumbuh --- */
    if (m.pilih) {
      if (m.arsip !== null) {
        const ok = await arsipkan(m, g);
        if (!ok || g !== generasi) return;
      }
      alphaPemenang = 0;
      perbarui(); gambar();
      await pudar(240, e => { alphaPemenang = e; });
      if (g !== generasi) return;
      await tunda(800);                 // beat: pemenang ditahan sebelum pohon
      if (g !== generasi) return;

      const ids = idsPohon(s);
      const baru = tumbuhPohon(ids);
      /* area kerja ikut memudar selama kamera terbang, supaya baris dan
         kotak yang tinggal tidak terlihat menumpuk di tepi frame pohon. */
      await terbang(kfPohon(ids, false), 680, e => {
        alphaKerja = 1 - e;
        alphaDaftar = 1 - e;
        baru.node.forEach((id, i) => { alphaPohon[id] = clamp01((e - i * 0.14) / 0.5); });
        baru.garis.forEach((ke, i) => { alphaGaris[ke] = clamp01((e - 0.06 - i * 0.14) / 0.5); });
      });
      if (g !== generasi) return;
      baru.node.forEach(id => { alphaPohon[id] = 1; });
      baru.garis.forEach(ke => { alphaGaris[ke] = 1; });
      fase = 4; perbarui(); gambar();
      return;
    }

    /* --- langkah akhir: tarik kamera keluar sambil banner muncul --- */
    if (m.akhir) {
      const ids = idsPohon(s);
      await terbang(kfPohon(ids, true), 560, e => { bannerAlpha = e; });
      if (g !== generasi) return;
      bannerAlpha = 1;
      fase = 4; perbarui(); gambar();
      return;
    }

    fase = 4; perbarui(); gambar();
  }

  async function keLangkah(s, dariAwal = false) {
    generasi++;
    const g = generasi;
    if (selesaikanSekarang) selesaikanSekarang();
    sibuk = true;
    perbarui();
    try {
      await jalankanLangkah(s, dariAwal, g);
    } finally {
      if (g === generasi) { sibuk = false; perbarui(); }
    }
  }

  async function mainkan() {
    if (putar) {
      putar = false;
      generasi++;
      if (selesaikanSekarang) selesaikanSekarang();
      sibuk = false;
      perbarui();
      return;
    }
    putar = true;
    perbarui();
    if (langkah >= MAKS_LANGKAH) await keLangkah(0, true);
    while (putar && langkah < MAKS_LANGKAH) {
      const t0 = performance.now();
      await keLangkah(langkah + 1);
      if (!putar) break;
      await tunda(Math.max(0, 1800 - (performance.now() - t0)));
    }
    putar = false;
    perbarui();
  }

  const btnPutar = $('#pemilihan-putar'), btnMaju = $('#pemilihan-maju');
  const btnMundur = $('#pemilihan-mundur'), btnUlang = $('#pemilihan-ulang');
  const lblLangkah = $('#pemilihan-langkah'), iProgres = $('#pemilihan-progres-i');
  function perbarui() {
    const ket = $('#pemilihan-ket');
    if (ket) ket.textContent = KETERANGAN[langkah] || '';
    if (lblLangkah) lblLangkah.textContent = `Langkah ${langkah} dari ${MAKS_LANGKAH}`;
    if (iProgres) iProgres.style.width = `${langkah / MAKS_LANGKAH * 100}%`;
    if (btnMundur) btnMundur.disabled = langkah === 0 || sibuk;
    if (btnMaju) btnMaju.disabled = langkah === MAKS_LANGKAH || sibuk;
    if (btnUlang) btnUlang.disabled = sibuk;
    if (btnPutar) {
      btnPutar.textContent = putar ? 'Jeda' : (langkah >= MAKS_LANGKAH ? 'Putar ulang' : 'Putar');
    }
  }

  btnPutar?.addEventListener('click', () => mainkan());
  btnMaju?.addEventListener('click', () => {
    if (sibuk) { if (selesaikanSekarang) selesaikanSekarang(); return; }
    if (langkah >= MAKS_LANGKAH) return;
    putar = false;
    keLangkah(langkah + 1);
  });
  btnMundur?.addEventListener('click', () => {
    if (langkah <= 0) return;
    putar = false;
    generasi++;
    if (selesaikanSekarang) selesaikanSekarang();
    keLangkah(langkah - 1, true);
  });
  btnUlang?.addEventListener('click', () => {
    putar = false;
    generasi++;
    if (selesaikanSekarang) selesaikanSekarang();
    keLangkah(0, true);
  });

  /* ---- menggambar ---- */
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
    if (r <= 0.2) return;
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

  function gambarBatang(c, C, tidak, selamat, x, y, lebar, tinggi, teks) {
    const n = tidak + selamat || 1;
    const wTidak = lebar * (tidak / n);
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

  function judulAktif(r) {
    const g = RONDE[r].grup;
    return g === 'semua' ? 'Semua penumpang' : (g === 'laki' ? 'Laki-laki' : 'Perempuan');
  }

  function gambarKerja(c, C) {
    const m = meta(langkah), r = m.ronde;
    const box = kotakAktif(r);
    const g = box.orang;
    const selamat = g.filter(p => p.y).length;
    const tidak = g.length - selamat;

    /* judul wilayah */
    c.save();
    c.font = '600 10px ' + FONT;
    c.fillStyle = C.tinta2;
    c.textAlign = 'left'; c.textBaseline = 'bottom';
    c.globalAlpha = alphaDaftar;
    c.fillText('KELOMPOK YANG SEDANG DIPROSES', BOX.x, 6);
    c.restore();

    /* daftar split + arsip */
    gambarDaftar(c, C, m);

    /* kotak kelompok aktif */
    c.save();
    c.globalAlpha = alphaKerja;
    c.fillStyle = kertas();
    c.strokeStyle = C.a1;
    c.lineWidth = 1.8;
    bulat(c, box.x, box.y, box.w, box.h, 10);
    c.fill(); c.stroke();
    c.font = '600 12px ' + FONT;
    c.fillStyle = C.tinta;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(judulAktif(r) + ' (' + g.length + ' penumpang)', box.x + box.w / 2, box.y + 14);
    c.fillStyle = C.tinta2;
    c.font = '10px ' + FONT;
    c.fillText('tanpa pertanyaan: salah ' + Math.min(tidak, selamat), box.x + box.w / 2, box.y + box.h + 16);
    c.restore();

    /* titik kelompok aktif */
    c.save();
    c.globalAlpha = alphaKerja;
    orangAktif.forEach(t => { c.fillStyle = t.p.y ? C.a1 : C.a2; gambarTitik(c, t); });
    c.restore();

    /* batang komposisi */
    const barW = (KOLOM - 1) * JARAK + DT;
    c.save();
    c.globalAlpha = alphaKerja;
    gambarBatang(c, C, tidak, selamat, box.x + box.w / 2 - barW / 2,
      box.y + 28 + box.isi + 10, barW, 7,
      `${tidak} tidak selamat · ${selamat} selamat`);
    c.restore();

    /* hasil pembagian */
    if (alphaHasil > 0 && hasilId) gambarHasil(c, C, r, hasilId);
  }

  function gambarDaftar(c, C, m) {
    const daftar = daftarBaris(m);
    c.save();
    c.globalAlpha = alphaDaftar;
    c.font = '600 10px ' + FONT;
    c.fillStyle = C.tinta2;
    c.textAlign = 'left'; c.textBaseline = 'bottom';
    c.fillText('SPLIT YANG MUNGKIN', DAFTAR.x, 6);
    c.restore();

    daftar.forEach((b, j) => {
      const st = statusBaris(j, m);
      const rect = rectBaris(j);
      const aktif = st === 'diuji' || st === 'dipilih';
      const redup = st === 'belum' || st === 'mustahil';
      const k = KAND[b.id];
      const stat = bagi(GRUP[RONDE[m.ronde].grup](), k.uji);

      c.save();
      c.globalAlpha = alphaDaftar * (redup ? 0.5 : 1);
      c.fillStyle = kertas();
      c.strokeStyle = aktif ? C.a1 : C.garis;
      c.lineWidth = aktif ? 1.8 : 1.2;
      bulat(c, rect.x, rect.y, rect.w, rect.h, 8);
      c.fill(); c.stroke();

      c.font = '600 11px ' + FONT;
      c.fillStyle = redup ? C.tinta2 : C.tinta;
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(k.t, rect.x + 10, rect.y + 14);

      if (st === 'dipilih') {
        c.font = '600 10px ' + FONT;
        c.fillStyle = C.a1;
        c.textAlign = 'right';
        c.fillText('✓ dipilih', rect.x + rect.w - 10, rect.y + 14);
      }

      if (st === 'mustahil') {
        c.font = '9.5px ' + FONT;
        c.fillStyle = C.tinta2;
        c.textAlign = 'left';
        c.fillText('semuanya ' + (RONDE[m.ronde].grup === 'laki' ? 'laki-laki' : 'perempuan'),
          rect.x + 10, rect.y + 33);
      } else if ((st === 'terarsip' || st === 'dipilih') && barisAlpha[j] > 0) {
        const a = barisAlpha[j];
        const bx = rect.x + 10, by = rect.y + 27, bw = 70;
        const n = stat.ay.n + stat.at.n || 1;
        c.globalAlpha = alphaDaftar * a;
        c.fillStyle = kertas2();
        bulat(c, bx, by, bw, 5, 2.5); c.fill();
        c.save();
        bulat(c, bx, by, bw, 5, 2.5); c.clip();
        c.fillStyle = C.a2; c.fillRect(bx, by, bw * stat.ay.t / n, 5);
        c.fillStyle = C.a1; c.fillRect(bx + bw * stat.ay.t / n, by, bw * stat.ay.s / n, 5);
        c.restore();
        c.font = '600 10px ' + FONT;
        c.fillStyle = C.tinta;
        c.textAlign = 'left';
        c.fillText('salah ' + stat.salah, rect.x + 88, rect.y + 29.5);
      }
      c.restore();
    });
  }

  function gambarHasil(c, C, r, id) {
    const h = hasilRect(r, id);
    const k = KAND[id];
    const paket = [
      { rect: h.kiri, judul: 'Ya: ' + k.yaT, b: h.b.ay, salah: Math.min(h.b.ay.t, h.b.ay.s) },
      { rect: h.kanan, judul: 'Tidak: ' + k.tiT, b: h.b.at, salah: Math.min(h.b.at.t, h.b.at.s) },
    ];
    c.save();
    c.globalAlpha = alphaHasil;
    paket.forEach(o => {
      c.fillStyle = kertas();
      c.strokeStyle = C.garis;
      c.lineWidth = 1.25;
      bulat(c, o.rect.x, o.rect.y, o.rect.w, o.rect.h, 9);
      c.fill(); c.stroke();
      c.font = '600 10.5px ' + FONT;
      c.fillStyle = C.tinta;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(o.judul, o.rect.x + o.rect.w / 2, o.rect.y + 13);
      c.font = '9.5px ' + FONT;
      c.fillStyle = C.tinta2;
      c.textBaseline = 'bottom';
      c.fillText(`${o.b.n} penumpang · salah ${o.salah}`, o.rect.x + o.rect.w / 2, o.rect.y + o.rect.h - 5);
    });
    c.restore();
  }

  /* ---- pohon ---- */
  const SIMPUL = {
    root: { x: 196, y: 34 },
    laki: { x: 96, y: 112 },
    perem: { x: 296, y: 112 },
    lakiYa: { x: 46, y: 196 },
    lakiTidak: { x: 146, y: 196 },
    peremYa: { x: 246, y: 196 },
    peremTidak: { x: 346, y: 196 },
  };
  const ANAK = {
    root: [['laki', 'Ya'], ['perem', 'Tidak']],
    laki: [['lakiYa', 'Ya'], ['lakiTidak', 'Tidak']],
    perem: [['peremYa', 'Ya'], ['peremTidak', 'Tidak']],
  };

  function gambarPohon(c, C) {
    const ids = idsPohon(langkah);
    if (!ids.length) return;
    const set = new Set(ids);

    c.save();
    c.font = '600 10px ' + FONT;
    c.fillStyle = C.tinta2;
    c.textAlign = 'left'; c.textBaseline = 'bottom';
    c.fillText('POHON YANG SEDANG DIBANGUN', TX, TY - 8);
    c.restore();

    Object.keys(ANAK).forEach(dari => {
      if (!set.has(dari)) return;
      ANAK[dari].forEach(([ke, label]) => {
        if (!set.has(ke)) return;
        const al = alphaGaris[ke] ?? 0;
        if (al <= 0.01) return;
        const a = SIMPUL[dari], b = SIMPUL[ke];
        const my = (a.y + BH / 2 + b.y - BH / 2) / 2;
        c.save();
        c.globalAlpha = al;
        c.strokeStyle = C.garis;
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(TX + a.x, TY + a.y + BH / 2);
        c.lineTo(TX + a.x, TY + my);
        c.lineTo(TX + b.x, TY + my);
        c.lineTo(TX + b.x, TY + b.y - BH / 2);
        c.stroke();
        c.font = '9px ' + FONT;
        c.fillStyle = C.tinta2;
        c.textAlign = 'right'; c.textBaseline = 'middle';
        c.fillText(label, TX + b.x - 6, TY + my - 7);
        c.restore();
      });
    });

    ids.forEach(id => {
      const al = alphaPohon[id] ?? 0;
      if (al <= 0.01) return;
      const s = SIMPUL[id];
      const isi = isiPohon(id, langkah);
      const daun = isi.status === 'daun';
      const x = TX + s.x - BW / 2, y = TY + s.y - BH / 2;

      c.save();
      c.globalAlpha = al;
      c.fillStyle = kertas();
      c.strokeStyle = daun ? (isi.pred === 'selamat' ? C.a1 : C.a2)
        : (isi.status === 'dipilih' ? C.a1 : C.garis);
      c.lineWidth = (daun || isi.status === 'dipilih') ? 1.8 : 1.2;
      bulat(c, x, y, BW, BH, 7);
      c.fill(); c.stroke();

      if (fokusId === id && alphaFokus > 0.01) {
        c.globalAlpha = al * alphaFokus;
        c.strokeStyle = C.a1;
        c.lineWidth = 2.4;
        bulat(c, x - 4, y - 4, BW + 8, BH + 8, 10);
        c.stroke();
        c.globalAlpha = al;
      }

      const teks = isi.baris.concat(['n = ' + isi.n]);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      teks.forEach((t, i) => {
        const ty = TY + s.y + (i - (teks.length - 1) / 2) * 11;
        if (i === teks.length - 1) { c.font = '9px ' + FONT; c.fillStyle = C.tinta2; }
        else if (daun) {
          if (i === 0) { c.font = '9px ' + FONT; c.fillStyle = C.tinta2; }
          else { c.font = '600 9.5px ' + FONT; c.fillStyle = isi.pred === 'selamat' ? C.a1 : C.a2; }
        } else { c.font = '600 9.5px ' + FONT; c.fillStyle = C.tinta; }
        c.fillText(t, TX + s.x, ty);
      });
      c.restore();
    });
  }

  function gambarBanner(c, C) {
    if (bannerAlpha <= 0.01) return;
    const bw = 340, bh = 28, bx = TX + 196 - bw / 2, by = 4;
    c.save();
    c.globalAlpha = bannerAlpha;
    c.fillStyle = kertas2();
    c.strokeStyle = C.a1;
    c.lineWidth = 2;
    bulat(c, bx, by, bw, bh, 14);
    c.fill(); c.stroke();
    c.fillStyle = C.tinta;
    c.font = '600 12px ' + FONT;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('20 dari 20 penumpang diprediksi benar.', bx + bw / 2, by + bh / 2);
    c.restore();
  }

  function gambar() {
    const cv = $('#cv-panggung');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const dpr = devicePixelRatio || 1;
    const C = warna();
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w + 1, h + 1);
    const sk = w / VW;
    c.setTransform(sk * dpr, 0, 0, sk * dpr, 0, 0);
    c.translate(VW / 2, VH / 2);
    c.scale(kamera.z, kamera.z);
    c.translate(-kamera.cx, -kamera.cy);
    c.setLineDash([]);

    gambarKerja(c, C);
    gambarPohon(c, C);
    gambarBanner(c, C);
  }

  /* ---- inisialisasi ---- */
  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);

  const cvPanggung = $('#cv-panggung');
  if (cvPanggung) cvPanggung.style.aspectRatio = `${VW}/${VH}`;

  susunAktif(0);
  kamera = kameraAkhir(0);
  fase = 4;
  perbarui();
  gambar();
  document.fonts?.ready.then(() => { perbarui(); gambar(); });

})();