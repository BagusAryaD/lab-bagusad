/* widgets/regresi-campuran.js: Figur 3, satu garis menaik untuk tiap negara */
(() => {
  const { warna, kanvas } = Kit, $ = s => document.querySelector(s);

  function gambar() {
    const cv = $('#cv-regresi-campuran');
    if (!cv || !window.MIXED) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();
    const M = window.MIXED;

    c.clearRect(0, 0, w, h);
    const T = M.bingkai(c, w, h, C);
    M.titik(c, T, C);

    /* satu garis per negara, hanya pada rentang jam belajar negara itu */
    c.lineWidth = 2.4;
    for (const k of M.KUNCI) {
      const g = M.DATA[k].garis;
      c.strokeStyle = C[M.WARNA[k]];
      c.beginPath();
      c.moveTo(T.X(g.x0), T.Y(g.a + g.b * g.x0));
      c.lineTo(T.X(g.x1), T.Y(g.a + g.b * g.x1));
      c.stroke();
    }
    c.textBaseline = 'alphabetic';
  }

  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(gambar);
  gambar();
})();