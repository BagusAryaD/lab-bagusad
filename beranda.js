/* beranda.js v2 - simulasi π di hero + kartu materi dari data/materi.json */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, teks) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (teks != null) n.textContent = teks;
    return n;
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* ── simulasi hit-or-miss di hero ──
     Di ponsel figur disembunyikan lewat CSS (.hero-figur di situs.css), dan
     kanvas yang display:none berukuran 0x0. Jadi simulasi baru dipasang saat
     layarnya cukup lebar. Titik henti ini harus sama dengan media query di
     situs.css. */
  const kanvas = document.getElementById('sim-pi');
  const sempit = matchMedia('(max-width: 640px)');
  let simSiap = false;

  const pasangSim = () => {
    if (simSiap || !kanvas || !window.Kit || sempit.matches) return;
    simSiap = true;
    const elJumlah = document.getElementById('sim-n');
    const elNilai = document.getElementById('sim-pi-nilai');
    const PI = Math.PI;
    const TAU = PI * 2;
    const BATAS = 20000;
    const acak = Kit.rng(19112026);
    const titik = [];
    let hit = 0;
    let ctx, W, H, sisi, pad, r, w;
    let raf = 0, jalan = false, bingkai = 0, siap = false;

    const ukur = () => {
      const k = Kit.kanvas(kanvas);
      ctx = k.c; W = k.w; H = k.h;
      w = Kit.warna();
      pad = Math.round(Math.min(W, H) * .055);
      sisi = Math.min(W, H) - pad * 2;
      r = Math.max(.85, sisi / 400);
    };

    const dasar = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = w.garis;
      ctx.lineWidth = 1;
      ctx.strokeRect(pad + .5, pad + .5, sisi - 1, sisi - 1);
      ctx.beginPath();
      ctx.arc(pad, pad + sisi, sisi, -PI / 2, 0);
      ctx.strokeStyle = w.emas;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pad, pad + sisi);
      ctx.lineTo(pad + sisi, pad + sisi);
      ctx.moveTo(pad, pad + sisi);
      ctx.lineTo(pad, pad);
      ctx.strokeStyle = w.garis;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const gambarTitik = (t) => {
      ctx.beginPath();
      ctx.arc(pad + t.x * sisi, pad + (1 - t.y) * sisi, r, 0, TAU);
      ctx.fillStyle = t.hit ? w.a2 : w.a1;
      ctx.globalAlpha = t.hit ? .78 : .34;
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const tambah = () => {
      const x = acak(), y = acak();
      const h = x * x + y * y <= 1;
      const t = { x, y, hit: h };
      titik.push(t);
      if (h) hit++;
      return t;
    };

    const baca = (paksa) => {
      if (!paksa && bingkai++ % 10) return;
      const n = titik.length;
      const est = n ? 4 * hit / n : 0;
      elJumlah.textContent = 'n: ' + n.toLocaleString('id-ID');
      elNilai.textContent = n ? est.toLocaleString('id-ID', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '-';
    };

    const gambarUlang = () => {
      if (!siap) return;
      ukur();
      dasar();
      for (const t of titik) gambarTitik(t);
      baca(true);
    };

    const langkah = () => {
      for (let i = 0; i < 18 && titik.length < BATAS; i++) gambarTitik(tambah());
      baca(false);
      if (titik.length >= BATAS) { henti(); baca(true); return; }
      raf = requestAnimationFrame(langkah);
    };

    const mulai = () => {
      if (jalan || reduce.matches || titik.length >= BATAS) return;
      jalan = true;
      raf = requestAnimationFrame(langkah);
    };
    const henti = () => { jalan = false; cancelAnimationFrame(raf); };

    ukur();
    dasar();
    const awal = reduce.matches ? 4200 : 1400;
    for (let i = 0; i < awal; i++) gambarTitik(tambah());
    baca(true);
    siap = true;

    document.addEventListener('tema', gambarUlang);
    reduce.addEventListener?.('change', () => { reduce.matches ? henti() : mulai(); });

    let tResize;
    addEventListener('resize', () => { clearTimeout(tResize); tResize = setTimeout(gambarUlang, 140); });
    document.addEventListener('visibilitychange', () => document.hidden ? henti() : mulai());
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => es.forEach(e => e.isIntersecting ? mulai() : henti()), { threshold: .15 }).observe(kanvas);
    } else {
      mulai();
    }
  };

  pasangSim();
  // dari sempit ke lebar: pasang saat figurnya tampil lagi (mis. ponsel diputar)
  sempit.addEventListener?.('change', () => { if (!sempit.matches) requestAnimationFrame(pasangSim); });

  /* ── kartu materi ── */
  const wadah = document.getElementById('daftar-materi');
  if (!wadah) return;

  const alat = document.getElementById('alat-arsip');
  const inputCari = document.getElementById('cari-materi');
  const tombolBersih = document.getElementById('cari-bersih');
  const pilihTopik = document.getElementById('filter-topik');

  const tanggal = (s) => {
    if (!s) return '';
    const [y, m, d] = String(s).split('-').map(Number);
    if (!y || !m || !d) return '';
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // kunci pencarian: huruf kecil, tanpa aksen dan tanda baca,
  // supaya "Monte-Carlo" dan "monte carlo" dianggap sama
  const normal = (s) => String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  // sampul punya versi terang dan gelap; versi yang tampil dipilih lewat CSS,
  // bukan JS, supaya tidak pernah salah gambar saat tema berganti
  const buatKartu = (m, t) => {
    const artikel = el('article', 'kartu');
    // indeks teks untuk pencarian, dihitung sekali saat kartu dibuat
    artikel.dataset.cari = normal([
      m.judul, m.subjudul, m.ringkas, m.bagian ? 'bagian ' + m.bagian : '', t.nama, t.ringkas
    ].filter(Boolean).join(' '));
    const a = el('a', 'kartu-taut');
    a.href = m.berkas;

    const media = el('div', 'kartu-media');
    if (m.sampul) {
      const alt = m.sampul_alt || ('Pratinjau halaman materi ' + m.judul);
      const img = document.createElement('img');
      img.src = m.sampul;
      img.alt = alt;
      img.width = 1200;
      img.height = 750;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.className = 'sampul-terang';
      media.append(img);

      if (m.sampul_gelap) {
        const gelap = document.createElement('img');
        gelap.src = m.sampul_gelap;
        gelap.alt = alt;
        gelap.width = 1200;
        gelap.height = 750;
        gelap.loading = 'lazy';
        gelap.decoding = 'async';
        gelap.className = 'sampul-gelap';
        gelap.setAttribute('aria-hidden', 'true');
        media.append(gelap);
      }
    }
    a.append(media);

    const meta = el('p', 'kartu-meta');
    meta.append(el('span', null, m.bagian ? 'Bagian ' + m.bagian : 'Materi'));
    const tgl = tanggal(m.tanggal);
    if (tgl) meta.append(el('span', null, tgl));
    a.append(meta);

    a.append(el('h3', 'kartu-judul', m.judul));
    if (m.subjudul) a.append(el('p', 'kartu-sub', m.subjudul));
    if (m.ringkas) a.append(el('p', 'kartu-ringkas', m.ringkas));

    const buka = el('span', 'kartu-buka');
    buka.append(document.createTextNode('Baca materi'));
    const panah = el('span', 'panah', '→');
    panah.setAttribute('aria-hidden', 'true');
    buka.append(panah);
    a.append(buka);

    artikel.append(a);
    return artikel;
  };

  (async () => {
    let data;
    try {
      const res = await fetch('data/materi.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      data = await res.json();
    } catch (e) {
      wadah.replaceChildren(el('p', 'pesan-galat',
        'Daftar materi gagal dimuat. Jika halaman ini dibuka langsung dari disk, jalankan server lokal (misalnya ekstensi Live Server) lalu muat ulang.'));
      return;
    }

    const topik = Array.isArray(data.topik) ? data.topik : [];
    const materi = (Array.isArray(data.materi) ? data.materi : []).filter(m => m && m.status !== 'draft');

    // urutkan topik berdasarkan tanggal materi terbarunya, terbaru di atas.
    // tanggal berformat ISO (YYYY-MM-DD), jadi cukup dibandingkan sebagai string
    const terbaru = (slug) => materi
      .filter(m => m.topik === slug && m.tanggal)
      .reduce((maks, m) => m.tanggal > maks ? m.tanggal : maks, '');
    topik.sort((a, b) => terbaru(b.slug).localeCompare(terbaru(a.slug)));
    wadah.replaceChildren();

    // kelompokkan sekali di awal; filter sesudahnya hanya menyembunyikan kartu,
    // jadi gambar tidak dimuat ulang dan fokus input tidak hilang
    const blokTopik = [];
    topik.forEach(t => {
      const isi = materi
        .filter(m => m.topik === t.slug)
        .sort((a, b) => (a.bagian || 0) - (b.bagian || 0));
      if (!isi.length) return;

      const blok = el('section', 'topik');
      const kepala = el('div', 'topik-kepala');
      const teks = el('div', 'topik-teks');
      const nama = el('h3', 'topik-nama', t.nama);
      nama.append(el('span', 'topik-hitung', '\u00B7 ' + isi.length + ' materi'));
      nama.id = 'topik-' + t.slug;
      blok.setAttribute('aria-labelledby', nama.id);
      teks.append(nama);
      if (t.ringkas) teks.append(el('p', 'topik-ringkas', t.ringkas));
      kepala.append(teks);
      blok.append(kepala);

      const daftar = el('div', 'daftar-kartu');
      const kartu = isi.map(m => {
        const k = buatKartu(m, t);
        daftar.append(k);
        return { el: k, cari: k.dataset.cari };
      });
      blok.append(daftar);
      wadah.append(blok);

      blokTopik.push({ el: blok, slug: t.slug, nama: t.nama, kartu });
    });

    if (!blokTopik.length) {
      wadah.append(el('p', 'pesan-galat', 'Belum ada materi yang siap dibaca.'));
      return;
    }

    const hitung = $('#arsip-hitung');

    const kosong = el('div', 'arsip-kosong');
    kosong.hidden = true;
    kosong.append(
      el('p', 'arsip-kosong-judul', 'Tidak ada materi yang cocok'),
      el('p', 'arsip-kosong-ket', 'Coba kata kunci lain atau kembali ke semua topik.')
    );
    const reset = el('button', 'tombol-garis', 'Hapus filter');
    reset.type = 'button';
    kosong.append(reset);
    wadah.append(kosong);

    let topikAktif = '';

    // daftar topik diambil dari data, jadi topik baru otomatis ikut
    pilihTopik.append(new Option('Semua topik', ''));
    blokTopik.forEach(b => pilihTopik.append(new Option(b.nama, b.slug)));

    const terapkan = () => {
      const kata = normal(inputCari.value).split(' ').filter(Boolean);
      const menyaring = kata.length > 0 || topikAktif !== '';
      let jumlah = 0;

      blokTopik.forEach(b => {
        const topikCocok = !topikAktif || b.slug === topikAktif;
        let tampil = 0;
        b.kartu.forEach(k => {
          const cocok = topikCocok && kata.every(w => k.cari.includes(w));
          k.el.hidden = !cocok;
          if (!cocok) return;
          // kartu yang baru muncul karena filter tidak boleh tertahan transparan
          if (menyaring) k.el.classList.add('tampil');
          tampil++;
        });
        b.el.hidden = !tampil;
        jumlah += tampil;
      });

      kosong.hidden = jumlah > 0;
      tombolBersih.hidden = !inputCari.value;
      // #arsip-hitung juga live region, jadi perubahan jumlah ikut dibacakan
      if (hitung) hitung.textContent = jumlah + ' materi';
    };

    const bersihkan = () => {
      inputCari.value = '';
      topikAktif = '';
      pilihTopik.value = '';
      terapkan();
      inputCari.focus();
    };

    inputCari.addEventListener('input', terapkan);
    inputCari.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && inputCari.value) {
        e.preventDefault();
        inputCari.value = '';
        terapkan();
      }
    });
    pilihTopik.addEventListener('change', () => {
      topikAktif = pilihTopik.value;
      terapkan();
    });
    tombolBersih.addEventListener('click', bersihkan);
    reset.addEventListener('click', bersihkan);

    terapkan();
    alat.hidden = false;

    const semua = blokTopik.flatMap(b => b.kartu.map(k => k.el));
    if (!reduce.matches && 'IntersectionObserver' in window) {
      // kelas disiapkan lebih dulu supaya kartu tidak sempat berkedip
      wadah.classList.add('arsip-siap');
      const io = new IntersectionObserver((es, o) => es.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('tampil');
        o.unobserve(e.target);
      }), { threshold: .12, rootMargin: '0px 0px -40px' });
      semua.forEach(k => io.observe(k));
      setTimeout(() => semua.forEach(k => k.classList.add('tampil')), 2400);
    } else {
      semua.forEach(k => k.classList.add('tampil'));
    }
  })();
})();
