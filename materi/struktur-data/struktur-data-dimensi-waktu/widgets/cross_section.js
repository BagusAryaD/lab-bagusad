/* widgets/cross_section.js: sebaran dua puluh cabang pada satu bulan */
(() => {
  const { warna, kanvas } = Kit, $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';
  const DATA = [
    { nama: 'Menteng', x: 18.0, y: 420 },
    { nama: 'Kelapa Gading', x: 32.0, y: 685 },
    { nama: 'Bekasi', x: 11.5, y: 290 },
    { nama: 'Tangerang', x: 24.0, y: 510 },
    { nama: 'Depok', x: 14.0, y: 355 },
    { nama: 'Kebayoran Baru', x: 21.5, y: 470 },
    { nama: 'Cibubur', x: 16.0, y: 380 },
    { nama: 'Bintaro', x: 26.5, y: 555 },
    { nama: 'Serpong', x: 29.0, y: 610 },
    { nama: 'Cempaka Putih', x: 12.5, y: 315 },
    { nama: 'Pondok Indah', x: 34.0, y: 700 },
    { nama: 'Ciledug', x: 9.5, y: 265 },
    { nama: 'Kalibata', x: 19.5, y: 445 },
    { nama: 'Tebet', x: 23.0, y: 495 },
    { nama: 'Cikarang', x: 27.5, y: 585 },
    { nama: 'Karawaci', x: 15.5, y: 340 },
    { nama: 'Sawangan', x: 20.5, y: 460 },
    { nama: 'Cinere', x: 25.0, y: 530 },
    { nama: 'Cawang', x: 17.5, y: 405 },
    { nama: 'Rawamangun', x: 13.5, y: 330 },
  ];
  const LABEL = ['Menteng', 'Kelapa Gading', 'Bekasi', 'Tangerang', 'Depok'];
  const XMIN = 7, XMAX = 37.5, YMIN = 230, YMAX = 745;
  const fmt = (v, d = 0) => v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const kertas = () => getComputedStyle(document.body).getPropertyValue('--kertas-2').trim() || '#F0EDE7';

  function kotak(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r);
    else c.rect(x, y, w, h);
  }

  function gambar() {
    const cv = $('#cv-cross');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();
    const L = w < 430 ? 48 : 52, R = 16, Atas = 26, Bawah = 40;
    const pw = Math.max(1, w - L - R), ph = Math.max(1, h - Atas - Bawah);
    const X = x => L + (x - XMIN) / (XMAX - XMIN) * pw;
    const Y = y => Atas + (1 - (y - YMIN) / (YMAX - YMIN)) * ph;

    c.clearRect(0, 0, w, h);
    c.font = `10px ${FONT}`;

    /* kisi */
    c.strokeStyle = C.garis; c.lineWidth = 1;
    c.fillStyle = C.redup; c.textAlign = 'right'; c.textBaseline = 'middle';
    [300, 400, 500, 600, 700].forEach(v => {
      c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(L + pw, Y(v)); c.stroke();
      c.fillText(fmt(v, 0), L - 7, Y(v));
    });
    c.textAlign = 'center'; c.textBaseline = 'top';
    [10, 15, 20, 25, 30, 35].forEach(v => {
      c.beginPath(); c.moveTo(X(v), Atas); c.lineTo(X(v), Atas + ph); c.stroke();
      c.fillText(fmt(v, 0), X(v), Atas + ph + 6);
    });
    c.fillStyle = C.redup;
    c.fillText('biaya promosi (Rp juta)', L + pw / 2, Atas + ph + 21);
    c.save(); c.translate(11, Atas + ph / 2); c.rotate(-Math.PI / 2);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('omzet (Rp juta)', 0, 0);
    c.restore();

    /* titik semua cabang */
    DATA.forEach(d => {
      const px = X(d.x), py = Y(d.y);
      c.globalAlpha = .16; c.fillStyle = C.a1;
      c.beginPath(); c.arc(px, py, 7, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1; c.fillStyle = C.a1;
      c.beginPath(); c.arc(px, py, 3.8, 0, Math.PI * 2); c.fill();
    });

    /* label hanya untuk lima cabang di tabel */
    const POSISI = {
      Menteng: [9, -10, 'left'],
      'Kelapa Gading': [-9, -10, 'right'],
      Bekasi: [9, 12, 'left'],
      Tangerang: [9, -11, 'left'],
      Depok: [9, -11, 'left'],
    };
    c.font = `600 9px ${FONT}`;
    LABEL.forEach(nama => {
      const d = DATA.find(v => v.nama === nama);
      const [dx, dy, align] = POSISI[nama];
      const px = X(d.x) + dx, py = Y(d.y) + dy;
      c.textAlign = align; c.textBaseline = 'middle';
      const lebar = c.measureText(nama).width;
      const kiri = align === 'left' ? px - 3 : px - lebar - 3;
      c.globalAlpha = .85; c.fillStyle = kertas();
      kotak(c, kiri, py - 7, lebar + 6, 14, 3); c.fill();
      c.globalAlpha = 1; c.fillStyle = C.tinta2;
      c.fillText(nama, px, py);
    });
  }

  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(gambar);
  gambar();
})();
