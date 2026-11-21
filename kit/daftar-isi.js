/* daftar-isi.js v1 — rail "di halaman ini" untuk halaman materi.
   Daftar dibangun dari .label-bagian tiap section, jadi label materi dan
   navigasi tidak bisa berbeda. Tidak ada efek apa pun di beranda/profil. */
(() => {
  const main = document.querySelector('main.artikel');
  if (!main) return;
  const sections = [...main.children].filter(el => el.tagName === 'SECTION');
  if (sections.length < 2) return;

  const slug = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  /* 1. baca label tiap bagian: "01 · Pendahuluan" -> nomor 01, nama Pendahuluan */
  const butir = sections.map((sec, i) => {
    const teks = (sec.querySelector(':scope > .label-bagian')?.textContent || '')
      .replace(/\s+/g, ' ').trim();
    const cocok = teks.match(/^(\d{1,2})\s*·\s*(.+)$/);
    const nomor = (cocok ? cocok[1] : String(i + 1)).padStart(2, '0');
    const nama = (cocok ? cocok[2] : teks).trim() || `Bagian ${i + 1}`;
    return { sec, nomor, nama, slug: slug(nama) || `bagian-${i + 1}`, a: null };
  });

  /* 2. id untuk tautan langsung, misalnya #cross-section */
  const dipakai = new Set();
  for (const b of butir) {
    if (b.sec.id) { b.id = b.sec.id; dipakai.add(b.id); continue; }
    let id = b.slug, n = 2;
    while (dipakai.has(id) || document.getElementById(id)) id = `${b.slug}-${n++}`;
    b.sec.id = id; b.id = id; dipakai.add(id);
  }

  /* 3. bangun navigasi: tombol (layar sempit) + panel daftar (rail dan panel) */
  const nav = document.createElement('nav');
  nav.className = 'daftar-isi';
  nav.setAttribute('aria-label', 'Daftar isi materi');

  const tombol = document.createElement('button');
  tombol.type = 'button';
  tombol.className = 'di-tombol';
  tombol.setAttribute('aria-expanded', 'false');
  tombol.setAttribute('aria-controls', 'di-panel');
  tombol.setAttribute('aria-label', 'Daftar isi');
  tombol.innerHTML = '<span class="di-tombol-teks">Daftar isi</span>'
    + '<svg class="di-tombol-panah" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';

  const panel = document.createElement('div');
  panel.className = 'di-panel';
  panel.id = 'di-panel';

  const judul = document.createElement('p');
  judul.className = 'di-judul';
  judul.textContent = 'Daftar isi';

  const daftar = document.createElement('ol');
  daftar.className = 'di-daftar';
  for (const b of butir) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + b.id;
    const nomor = document.createElement('span');
    nomor.className = 'di-nomor';
    nomor.textContent = b.nomor;
    const nama = document.createElement('span');
    nama.className = 'di-nama';
    nama.textContent = b.nama;
    a.append(nomor, nama);
    li.append(a);
    daftar.append(li);
    b.a = a;
  }

  panel.append(judul, daftar);
  nav.append(tombol, panel);
  main.insertBefore(nav, main.firstElementChild);

  /* 4. buka/tutup panel untuk layar sempit */
  const terbuka = () => nav.classList.contains('buka');
  const tutup = kembali => {
    if (!terbuka()) return;
    nav.classList.remove('buka');
    tombol.setAttribute('aria-expanded', 'false');
    if (kembali) tombol.focus();
  };
  tombol.addEventListener('click', () => {
    const buka = !terbuka();
    nav.classList.toggle('buka', buka);
    tombol.setAttribute('aria-expanded', String(buka));
  });
  document.addEventListener('click', e => { if (!nav.contains(e.target)) tutup(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') tutup(true); });
  daftar.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    tutup(false);
    const tujuan = document.getElementById(a.getAttribute('href').slice(1));
    if (!tujuan) return;
    tujuan.setAttribute('tabindex', '-1');
    tujuan.focus({ preventScroll: true });
  });

  /* 5. tandai bagian yang sedang dibaca */
  const header = document.querySelector('header.situs');
  const teksTombol = tombol.querySelector('.di-tombol-teks');
  let aktif = null;

  const aturAktif = b => {
    if (b === aktif) return;
    aktif = b;
    for (const x of butir) {
      if (x === b) x.a.setAttribute('aria-current', 'location');
      else x.a.removeAttribute('aria-current');
    }
    teksTombol.textContent = b ? `${b.nomor} · ${b.nama}` : 'Daftar isi';
    tombol.setAttribute('aria-label', b
      ? `Daftar isi, bagian aktif ${b.nomor} ${b.nama}`
      : 'Daftar isi');
  };

  const akar = document.documentElement;
  let antre = false;
  const ukur = () => {
    antre = false;
    const batas = (header ? header.getBoundingClientRect().bottom : 0) + 24;
    let kini = null;
    for (const b of butir) {
      if (b.sec.getBoundingClientRect().top <= batas) kini = b;
      else break;
    }
    if (akar.scrollTop + akar.clientHeight >= akar.scrollHeight - 2) kini = butir[butir.length - 1];
    aturAktif(kini);
  };
  const jadwal = () => {
    if (antre) return;
    antre = true;
    requestAnimationFrame(ukur);
  };
  addEventListener('scroll', jadwal, { passive: true });
  addEventListener('resize', jadwal);
  ukur();

  /* 6. tautan langsung ke bagian, termasuk saat id baru dibuat oleh skrip ini */
  const lompat = mulus => {
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (!id) return;
    const tujuan = document.getElementById(id);
    if (!tujuan) return;
    tujuan.scrollIntoView({ behavior: mulus ? 'smooth' : 'instant', block: 'start' });
  };
  if (location.hash) {
    lompat(false);
    addEventListener('load', () => lompat(false), { once: true });
  }
  addEventListener('hashchange', () => lompat(true));

  /* 7. kembali ke rail saat layar melebar */
  const sempit = matchMedia('(max-width: 1259px)');
  const sinkron = () => { if (!sempit.matches) tutup(false); };
  sempit.addEventListener?.('change', sinkron);
})();
