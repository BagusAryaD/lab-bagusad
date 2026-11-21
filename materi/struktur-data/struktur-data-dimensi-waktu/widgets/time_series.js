/* widgets/time_series.js: omzet bulanan satu cabang */
(() => {
  const { warna, kanvas } = Kit, $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
  const NILAI = [365, 378, 405, 398, 410, 420];
  const YMIN = 345, YMAX = 435;
  const fmt = (v, d = 0) => v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const kertas = () => getComputedStyle(document.body).getPropertyValue('--kertas-2').trim() || '#F0EDE7';

  function gambar() {
    const cv = $('#cv-ts');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();
    const L = w < 430 ? 46 : 50, R = 16, Atas = 22, Bawah = 40;
    const pw = Math.max(1, w - L - R), ph = Math.max(1, h - Atas - Bawah);
    const X = i => L + (i + .4) / (NILAI.length + .2 - .4) * pw;
    const Y = y => Atas + (1 - (y - YMIN) / (YMAX - YMIN)) * ph;

    c.clearRect(0, 0, w, h);
    c.font = `10px ${FONT}`;

    /* kisi */
    c.strokeStyle = C.garis; c.lineWidth = 1;
    c.fillStyle = C.redup; c.textAlign = 'right'; c.textBaseline = 'middle';
    [350, 375, 400, 425].forEach(v => {
      c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(L + pw, Y(v)); c.stroke();
      c.fillText(fmt(v, 0), L - 7, Y(v));
    });
    c.textAlign = 'center'; c.textBaseline = 'top';
    BULAN.forEach((b, i) => {
      c.beginPath(); c.moveTo(X(i), Atas); c.lineTo(X(i), Atas + ph); c.stroke();
      c.fillText(b, X(i), Atas + ph + 6);
    });
    c.fillStyle = C.redup;
    c.fillText('bulan 2026', L + pw / 2, Atas + ph + 21);
    c.save(); c.translate(11, Atas + ph / 2); c.rotate(-Math.PI / 2);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('omzet (Rp juta)', 0, 0);
    c.restore();

    /* area dan garis */
    c.beginPath();
    NILAI.forEach((v, i) => { if (i) c.lineTo(X(i), Y(v)); else c.moveTo(X(i), Y(v)); });
    c.lineTo(X(NILAI.length - 1), Y(YMIN));
    c.lineTo(X(0), Y(YMIN));
    c.closePath();
    c.globalAlpha = .10; c.fillStyle = C.a1; c.fill();
    c.globalAlpha = 1;

    c.strokeStyle = C.a1; c.lineWidth = 2.2; c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath();
    NILAI.forEach((v, i) => { if (i) c.lineTo(X(i), Y(v)); else c.moveTo(X(i), Y(v)); });
    c.stroke();

    /* titik dan nilai akhir */
    NILAI.forEach((v, i) => {
      c.fillStyle = C.a1;
      c.beginPath(); c.arc(X(i), Y(v), 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = kertas(); c.beginPath(); c.arc(X(i), Y(v), 1.7, 0, Math.PI * 2); c.fill();    });
    c.fillStyle = C.tinta2; c.textAlign = 'right'; c.textBaseline = 'bottom';
    c.font = `600 9px ${FONT}`;
    c.fillText(fmt(NILAI[NILAI.length - 1], 0) + ' juta', X(NILAI.length - 1), Y(NILAI[NILAI.length - 1]) - 9);
  }

  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(gambar);
  gambar();
})();
