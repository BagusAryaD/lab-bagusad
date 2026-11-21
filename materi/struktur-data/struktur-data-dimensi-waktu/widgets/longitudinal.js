/* widgets/longitudinal.js: lintasan tiap cabang pada waktu audit yang berbeda */
(() => {
  const { warna, kanvas } = Kit, $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';
  const DATA = [
    { nama: 'Menteng', warna: 'a1', t: [0, 1.5, 4, 8.5], y: [72, 76.5, 81, 85.5], dx: 6, dy: -11, align: 'left' },
    { nama: 'Kelapa Gading', warna: 'a2', t: [0, 3, 7.5], y: [75, 80.5, 86], dx: -6, dy: -11, align: 'right' },
    { nama: 'Bekasi', warna: 'emas', t: [0, 3], y: [68, 70.5], attrition: true, dx: 6, dy: 15, align: 'left' },
    { nama: 'Tangerang', warna: 'hijau', t: [0, 1, 3.5, 6, 9], y: [70, 73, 77.5, 81, 84.5], dx: 6, dy: 14, align: 'left' },
  ];
  const YMIN = 64, YMAX = 89;
  const fmt = (v, d = 0) => v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const kertas = () => getComputedStyle(document.body).getPropertyValue('--kertas-2').trim() || '#F0EDE7';

  function gambar() {
    const cv = $('#cv-long');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();
    const L = w < 430 ? 44 : 50, R = 18, Atas = 24, Bawah = 40;
    const pw = Math.max(1, w - L - R), ph = Math.max(1, h - Atas - Bawah);
    const X = t => L + t / 10.8 * pw;
    const Y = y => Atas + (1 - (y - YMIN) / (YMAX - YMIN)) * ph;

    c.clearRect(0, 0, w, h);
    c.font = `10px ${FONT}`;

    /* kisi dan sumbu */
    c.strokeStyle = C.garis; c.lineWidth = 1;
    c.fillStyle = C.redup; c.textAlign = 'right'; c.textBaseline = 'middle';
    [65, 70, 75, 80, 85].forEach(v => {
      c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(L + pw, Y(v)); c.stroke();
      c.fillText(fmt(v, 0), L - 7, Y(v));
    });
    c.textAlign = 'center'; c.textBaseline = 'top';
    [0, 3, 6, 9].forEach(v => {
      c.beginPath(); c.moveTo(X(v), Atas); c.lineTo(X(v), Atas + ph); c.stroke();
      c.fillText(String(v), X(v), Atas + ph + 6);
    });
    c.fillStyle = C.redup; c.fillText('waktu audit (bulan)', L + pw / 2, Atas + ph + 21);
    c.save(); c.translate(11, Atas + ph / 2); c.rotate(-Math.PI / 2);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('skor kepuasan', 0, 0);
    c.restore();

    /* garis dan titik per cabang */
    DATA.forEach(d => {
      c.strokeStyle = C[d.warna]; c.lineWidth = 2; c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath();
      d.t.forEach((t, j) => { if (j) c.lineTo(X(t), Y(d.y[j])); else c.moveTo(X(t), Y(d.y[j])); });
      c.stroke();

      c.fillStyle = C[d.warna];
      d.t.forEach((t, j) => {
        c.beginPath(); c.arc(X(t), Y(d.y[j]), 3.8, 0, Math.PI * 2); c.fill();
        c.fillStyle = kertas();
        c.beginPath(); c.arc(X(t), Y(d.y[j]), 1.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = C[d.warna];
      });
    });

    /* penanda attrition Cabang Bekasi */
    const d = DATA[2], tAkhir = d.t[d.t.length - 1];
    const xa = X(tAkhir) + 10, ya = Y(d.y[d.y.length - 1]);
    c.strokeStyle = C.a2; c.lineWidth = 2;
    c.beginPath();
    c.moveTo(xa - 4.5, ya - 4.5); c.lineTo(xa + 4.5, ya + 4.5);
    c.moveTo(xa + 4.5, ya - 4.5); c.lineTo(xa - 4.5, ya + 4.5);
    c.stroke();
    c.fillStyle = C.a2; c.font = `600 9px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('attrition', xa + 7, ya - 1);

    /* label cabang di ujung garis */
    c.font = `600 9px ${FONT}`;
    DATA.forEach(item => {
      const i = item.t.length - 1;
      c.fillStyle = C[item.warna];
      c.textAlign = item.align; c.textBaseline = 'middle';
      c.fillText(item.nama, X(item.t[i]) + item.dx, Y(item.y[i]) + item.dy);
    });
  }

  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(gambar);
  gambar();
})();
