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

  const tanggal = (s) => {
    if (!s) return '';
    const [y, m, d] = String(s).split('-').map(Number);
    if (!y || !m || !d) return '';
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // sampul punya versi terang dan gelap; versi yang tampil dipilih lewat CSS,
  // bukan JS, supaya tidak pernah salah gambar saat tema berganti
  const buatKartu = (m) => {
    const artikel = el('article', 'kartu');
    const a = el('a', 'kartu-taut');
    a.href = m.berkas;

    const media = el('div', 'kartu-media');
    if (m.sampul) {
      const alt = m.sampul_alt || ('Pratinjau halaman materi ' + m.judul);
      const img = document.createElement('img');
      img.src = m.sampul;
      img.alt = alt;
      img.width = 1200;
      img.height = 900;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.className = 'sampul-terang';
      media.append(img);

      if (m.sampul_gelap) {
        const gelap = document.createElement('img');
        gelap.src = m.sampul_gelap;
        gelap.alt = alt;
        gelap.width = 1200;
        gelap.height = 900;
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
    wadah.replaceChildren();

    const hitung = $('#arsip-hitung');
    if (hitung) {
      hitung.textContent = materi.length + ' materi' + (topik.length > 1 ? ' · ' + topik.length + ' topik' : '');
    }

    let ada = 0;
    topik.forEach(t => {
      const isi = materi
        .filter(m => m.topik === t.slug)
        .sort((a, b) => (a.bagian || 0) - (b.bagian || 0));
      if (!isi.length) return;
      ada++;

      const blok = el('section', 'topik');
      const kepala = el('div', 'topik-kepala');
      const nama = el('h3', 'topik-nama', t.nama);
      nama.id = 'topik-' + t.slug;
      blok.setAttribute('aria-labelledby', nama.id);
      kepala.append(nama);
      if (t.ringkas) kepala.append(el('p', 'topik-ringkas', t.ringkas));
      blok.append(kepala);

      const daftar = el('div', 'daftar-kartu');
      isi.forEach(m => daftar.append(buatKartu(m)));
      blok.append(daftar);
      wadah.append(blok);
    });

    if (!ada) {
      wadah.append(el('p', 'pesan-galat', 'Belum ada materi yang siap dibaca.'));
      return;
    }

    const semua = [...wadah.querySelectorAll('.kartu')];
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
