/* widgets/varian.js: Figur 4, tiga varian garis regresi antar cluster
   (random intercept, random slope, keduanya). Sumbu x selalu mulai dari 0,
   titik pada x = 0 ditandai untuk tiap garis. */
(() => {
  const { warna, kanvas } = Kit, $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';

  /* garis y = a + b x, ditulis (a; b) */
  const VARIAN = {
    ri: {
      garis: [[16, 5], [23, 5], [30, 5], [36, 5], [45, 5]],
      ket: 'Garis seluruh cluster sejajar. Slope sama untuk semua cluster (fixed), sedangkan intercept berbeda (random).',
    },
    rs: {
      garis: [[25, 2.6], [25, 3.8], [25, 5], [25, 6.2], [25, 7.4]],
      ket: 'Seluruh garis bertemu di satu titik pada x = 0. Intercept sama untuk semua cluster (fixed), sedangkan slope berbeda (random).',
    },
    both: {
      garis: [[40, 3], [18, 7.4], [34, 4.2], [24, 6.6], [44, 5.8]],
      ket: 'Garis berbeda dalam intercept maupun slope, sehingga tidak sejajar dan tidak bertemu di satu titik pada x = 0.',
    },
  };
  const WARNA = ['a1', 'a2', 'emas', 'hijau', 'tinta2'];
  const XMAX = 10, YMAX = 110;
  let mode = 'ri';

  function bingkai(c, w, h, C) {
    const kecil = w < 430;
    const L = kecil ? 34 : 44, R = 14, Atas = 74, Bawah = 40;
    const pw = Math.max(1, w - L - R), ph = Math.max(1, h - Atas - Bawah);
    const X = v => L + (v / XMAX) * pw;
    const Y = v => Atas + (1 - v / YMAX) * ph;

    c.font = `10px ${FONT}`;
    c.textBaseline = 'middle';

    c.strokeStyle = C.garis; c.lineWidth = 1;
    c.fillStyle = C.redup; c.textAlign = 'right';
    for (let v = 0; v <= 100; v += 20) {
      c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(L + pw, Y(v)); c.stroke();
      c.fillText(String(v), L - 7, Y(v));
    }
    c.textAlign = 'center';
    for (let v = 0; v <= XMAX; v += 2) c.fillText(String(v), X(v), Atas + ph + 13);
    c.fillText('x', L + pw / 2, Atas + ph + 31);
    c.save();
    c.translate(11, Atas + ph / 2); c.rotate(-Math.PI / 2);
    c.fillText('y', 0, 0);
    c.restore();

    /* legenda cluster */
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.font = `600 ${kecil ? 9 : 10}px ${FONT}`;
    let lx = L;
    for (let i = 0; i < 5; i++) {
      c.fillStyle = C[WARNA[i]];
      c.beginPath(); c.arc(lx + 4, 13, 4.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = C.tinta2;
      c.fillText('Cluster ' + (i + 1), lx + 13, 13);
      lx += 13 + c.measureText('Cluster ' + (i + 1)).width + 14;
    }

    return { X, Y, L, pw, ph };
  }

  function gambar() {
    const cv = $('#cv-varian');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();
    const kertas = getComputedStyle(document.body).getPropertyValue('--kertas').trim() || '#fff';

    c.clearRect(0, 0, w, h);
    const T = bingkai(c, w, h, C);
    const V = VARIAN[mode];

    /* sumbu x = 0 lebih tegas karena di situ intercept dibaca */
    c.strokeStyle = C.garis; c.lineWidth = 2;
    c.beginPath(); c.moveTo(T.X(0), T.Y(0)); c.lineTo(T.X(0), T.Y(YMAX)); c.stroke();

    c.lineWidth = 2.4;
    V.garis.forEach(([a, b], i) => {
      c.strokeStyle = C[WARNA[i]];
      c.beginPath();
      c.moveTo(T.X(0), T.Y(a));
      c.lineTo(T.X(XMAX), T.Y(a + b * XMAX));
      c.stroke();
      /* titik pada x = 0 */
      c.fillStyle = C[WARNA[i]];
      c.beginPath(); c.arc(T.X(0), T.Y(a), 4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = kertas;
      c.lineWidth = 1.2;
      c.stroke();
    });

    c.textBaseline = 'alphabetic';
  }

  function pilih(m) {
    mode = m;
    ['ri', 'rs', 'both'].forEach(k => {
      const b = $('#v-' + k);
      const aktif = k === m;
      b?.classList.toggle('p', aktif);
      b?.setAttribute('aria-pressed', String(aktif));
    });
    const ket = $('#v-ket');
    if (ket) ket.textContent = VARIAN[m].ket;
    gambar();
  }

  $('#v-ri')?.addEventListener('click', () => pilih('ri'));
  $('#v-rs')?.addEventListener('click', () => pilih('rs'));
  $('#v-both')?.addEventListener('click', () => pilih('both'));

  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(gambar);
  gambar();
})();