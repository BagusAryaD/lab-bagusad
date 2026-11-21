/* widgets/panel.js: panel seimbang dan tak seimbang berdampingan */
(() => {
  const { warna, kanvas } = Kit, $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';
  const DATA = [
    { nama: 'Menteng', warna: 'a1', y: [1148, 1228, 1295] },
    { nama: 'Kelapa Gading', warna: 'a2', y: [1890, 1985, 2070], pendek: 'K. Gading' },
    { nama: 'Bekasi', warna: 'emas', y: [810, 855, 890] },
    { nama: 'Tangerang', warna: 'hijau', y: [1410, 1490, 1560] },
  ];
  const YMIN = 750, YMAX = 2150;
  const fmt = (v, d = 0) => v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const kertas = () => getComputedStyle(document.body).getPropertyValue('--kertas-2').trim() || '#F0EDE7';

  function sub(c, C, x0, y0, ww, hh, judul, takSeimbang, labelY) {
    const Lp = 62, Rp = 10, Tp = 26, Bp = 30;
    const px = x0 + Lp, py = y0 + Tp;
    const pw = Math.max(1, ww - Lp - Rp), ph = Math.max(1, hh - Tp - Bp);
    const X = t => px + (t - .5) / 3.2 * pw;
    const Y = v => py + (1 - (v - YMIN) / (YMAX - YMIN)) * ph;

    c.font = `600 9px ${FONT}`; c.fillStyle = C.tinta2;
    c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText(judul, x0 + 2, y0 + 2);

    /* kisi */
    c.strokeStyle = C.garis; c.lineWidth = 1;
    c.fillStyle = C.redup; c.textAlign = 'right'; c.textBaseline = 'middle';
    [1000, 1500, 2000].forEach(v => {
      c.beginPath(); c.moveTo(px, Y(v)); c.lineTo(px + pw, Y(v)); c.stroke();
      c.fillText(fmt(v, 0), px - 7, Y(v));
    });
    c.textAlign = 'center'; c.textBaseline = 'top';
    [1, 2, 3].forEach(t => {
      c.beginPath(); c.moveTo(X(t), py); c.lineTo(X(t), py + ph); c.stroke();
      c.fillText(String(t), X(t), py + ph + 5);
    });
    c.fillStyle = C.redup; c.fillText('kuartal', px + pw / 2, py + ph + 19);
    if (labelY) {
      c.save(); c.translate(x0 + 13, py + ph / 2); c.rotate(-Math.PI / 2);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('omzet (Rp juta)', 0, 0);
      c.restore();
    }

    /* garis dan titik */
    DATA.forEach(d => {
      const akhir = takSeimbang && d.nama === 'Bekasi' ? 2 : 3;
      c.strokeStyle = C[d.warna]; c.lineWidth = 2; c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath();
      for (let t = 1; t <= akhir; t++) {
        if (t > 1) c.lineTo(X(t), Y(d.y[t - 1])); else c.moveTo(X(t), Y(d.y[t - 1]));
      }
      c.stroke();

      c.fillStyle = C[d.warna];
      for (let t = 1; t <= akhir; t++) {
        c.beginPath(); c.arc(X(t), Y(d.y[t - 1]), 3.6, 0, Math.PI * 2); c.fill();
        c.fillStyle = kertas();
        c.beginPath(); c.arc(X(t), Y(d.y[t - 1]), 1.4, 0, Math.PI * 2); c.fill();
        c.fillStyle = C[d.warna];
      }

      /* sel yang tidak teramati pada panel tak seimbang */
      if (takSeimbang && d.nama === 'Bekasi') {
        const mx = X(3), my = Y(d.y[2]);
        c.strokeStyle = C.redup; c.lineWidth = 1.3; c.globalAlpha = .8;
        c.setLineDash([3, 3]);
        c.beginPath(); c.arc(mx, my, 6, 0, Math.PI * 2); c.stroke();
        c.setLineDash([]); c.globalAlpha = 1;
        c.fillStyle = C.redup; c.font = `9px ${FONT}`;
        c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.fillText('tidak diamati', mx, my - 9);
      }

      /* label di ujung garis */
      c.fillStyle = C[d.warna]; c.font = `600 9px ${FONT}`;
      c.textAlign = 'left'; c.textBaseline = 'middle';
      const nama = d.pendek || d.nama;
      c.fillText(nama, X(akhir) + 7, Y(d.y[akhir - 1]));
    });
  }

  function gambar() {
    const cv = $('#cv-panel');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();
    const dua = w >= 560;
    const gap = dua ? 24 : 16;
    const xAwal = 6, xAkhir = w - 6, yAwal = 4, yAkhir = h - 6;
    const lebarTotal = xAkhir - xAwal - (dua ? gap : 0);
    const tinggiTotal = yAkhir - yAwal - (dua ? 0 : gap);
    const wSub = lebarTotal / (dua ? 2 : 1);
    const hSub = tinggiTotal / (dua ? 1 : 2);

    c.clearRect(0, 0, w, h);
    c.font = `10px ${FONT}`;

    sub(c, C, xAwal, yAwal, wSub, hSub, 'Panel seimbang, 12 pengamatan', false, true);
    const x2 = dua ? xAwal + wSub + gap : xAwal;
    const y2 = dua ? yAwal : yAwal + hSub + gap;
    sub(c, C, x2, y2, wSub, hSub, 'Panel tak seimbang, 11 pengamatan', true, dua ? false : true);
  }

  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(gambar);
  gambar();
})();
