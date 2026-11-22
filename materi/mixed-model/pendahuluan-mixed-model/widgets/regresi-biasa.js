/* widgets/regresi-biasa.js: Figur 2, satu garis regresi untuk seluruh siswa */
(() => {
  const { warna, kanvas } = Kit, $ = s => document.querySelector(s);

  function gambar() {
    const cv = $('#cv-regresi-biasa');
    if (!cv || !window.MIXED) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();
    const M = window.MIXED;
    const G = M.GABUNGAN;

    c.clearRect(0, 0, w, h);
    const T = M.bingkai(c, w, h, C);
    M.titik(c, T, C);

    /* satu garis gabungan, menurun */
    c.strokeStyle = C.tinta;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(T.X(0), T.Y(G.a + G.b * 0));
    c.lineTo(T.X(18), T.Y(G.a + G.b * 18));
    c.stroke();
    c.textBaseline = 'alphabetic';
  }

  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(gambar);
  gambar();
})();