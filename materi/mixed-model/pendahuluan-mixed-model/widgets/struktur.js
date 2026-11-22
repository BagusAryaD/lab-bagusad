/* widgets/struktur.js: pohon level pengamatan untuk data berklaster,
   pengukuran berulang, dan gabungan keduanya (waktu tersarang dalam siswa,
   siswa tersarang dalam negara). Di layar lebar semua pengamatan disusun
   ke samping di bawah induknya; di layar sempit mode dua level kembali ke
   kolom ke bawah. Node muncul bertahap saat mode diganti, dan kotak induk
   bisa diarahkan atau diklik untuk menyorot cluster-nya. Animasi dilewati
   bila pengguna lebih menyukai gerak minimal. */
(() => {
  const { warna, kanvas } = Kit, $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';
  const TENANG = matchMedia('(prefers-reduced-motion: reduce)');
  const TOMBOL = ['klaster', 'ulang', 'tersarang'];

  const MODE = {
    klaster: {
      akar: ['Negara A', 'Negara B', 'Negara I'].map((n, i) => ({
        label: n,
        anak: [1, 2, 3].map(j => ({ label: 'Siswa ' + (i * 3 + j) })),
      })),
      ket: 'Tiap negara (kotak, level 2) memuat beberapa siswa (elips, level 1). Siswa dari negara yang sama berbagi sumber yang sama, sehingga skornya cenderung berkorelasi.',
    },
    ulang: {
      akar: ['Siswa 1', 'Siswa 2', 'Siswa 3'].map(n => ({
        label: n,
        anak: [1, 2, 3].map(j => ({ label: 'Waktu ' + j })),
      })),
      ket: 'Tiap siswa (kotak, level 2) diamati pada tiga waktu (elips, level 1). Skor yang berasal dari siswa yang sama cenderung berkorelasi.',
    },
    tersarang: {
      akar: ['Negara A', 'Negara B'].map((n, i) => ({
        label: n,
        anak: [1, 2].map(k => ({
          label: 'Siswa ' + (i * 2 + k),
          anak: [1, 2, 3].map(j => ({ label: 'Waktu ' + j })),
        })),
      })),
      ket: 'Waktu (level 1) tersarang dalam siswa (level 2), dan siswa tersarang dalam negara (level 3): gabungan data berklaster dan pengukuran berulang.',
    },
  };

  let mode = 'klaster';
  let mulai = -Infinity;   // waktu mulai animasi; -Infinity berarti langsung penuh
  let hover = null, pin = null;
  let kotakAkar = [];      // rect induk untuk hit-test pointer
  let antre = false;

  function kotakPath(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r);
    else c.rect(x, y, w, h);
  }

  function kepalaPanah(c, x, y, a, ukuran) {
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - ukuran * Math.cos(a - .42), y - ukuran * Math.sin(a - .42));
    c.moveTo(x, y);
    c.lineTo(x - ukuran * Math.cos(a + .42), y - ukuran * Math.sin(a + .42));
    c.stroke();
  }

  /* pilih akar yang digambar: di layar sempit, mode tersarang disederhanakan */
  function susun(kecil) {
    const akar = MODE[mode].akar;
    return kecil && mode === 'tersarang' ? akar.slice(0, 1) : akar;
  }

  /* ukuran node, jarak antarbaris, dan tinggi total kanvas */
  function tata(akar, w, kecil) {
    const depth = akar[0].anak[0].anak ? 3 : 2;
    const vertikal = kecil && depth === 2;
    const Lm = kecil ? 44 : 54, Rm = 12, Atas = 14, Bawah = 12;
    const boxH = kecil ? 40 : depth === 3 ? 44 : 48;
    const midH = depth === 3 ? (kecil ? 26 : 28) : 0;
    const daunH = depth === 3 ? (kecil ? 20 : 22) : kecil ? 26 : 30;
    const jarak = depth === 3 ? (kecil ? 34 : 46) : kecil ? 18 : 64;
    const tinggi = Atas + boxH + jarak +
      (depth === 3 ? midH + jarak : 0) +
      (vertikal ? 3 * daunH + 2 * 12 : daunH) + Bawah;
    return { depth, vertikal, Lm, Rm, W: w - Lm - Rm, Atas, boxH, midH, daunH, jarak, tinggi };
  }

  /* posisi tiap node: daun diberi slot berurutan, induk mengerang di tengah anak-anaknya */
  function bangun(akar, T) {
    const { depth, vertikal, Lm, W, Atas, boxH, midH, daunH, jarak } = T;
    const yKotak = Atas + boxH / 2;
    const yMid = Atas + boxH + jarak + midH / 2;
    const yDaun = Atas + boxH + jarak + (depth === 3 ? midH + jarak : 0) + daunH / 2;

    const tag = (n, x, y, wd, ht, lvl, akarIdx) => {
      n._x = x; n._y = y; n._w = wd; n._h = ht;
      n._lvl = lvl; n._akar = akarIdx;
    };

    if (vertikal) {
      const kolom = W / akar.length;
      akar.forEach((a, i) => {
        const cx = Lm + kolom * (i + .5);
        tag(a, cx, yKotak, Math.min(150, kolom * .74), boxH, depth, i);
        a.anak.forEach((b, j) =>
          tag(b, cx, yDaun + j * (daunH + 12), Math.min(110, kolom * .68), daunH, 1, i));
      });
    } else {
      const daun = [];
      akar.forEach(a => {
        a._i = akar.indexOf(a);
        if (a.anak[0].anak) a.anak.forEach(m => m.anak.forEach(d => daun.push({ d, a, m })));
        else a.anak.forEach(d => daun.push({ d, a }));
      });
      const n = daun.length, slot = W / n;
      const elW = Math.min(depth === 3 ? 62 : 84, slot * .86);
      daun.forEach((o, k) => tag(o.d, Lm + slot * (k + .5), yDaun, elW, daunH, 1, o.a._i));
      if (depth === 3) {
        akar.forEach(a => a.anak.forEach(m => {
          const xs = m.anak.map(d => d._x);
          const kiri = Math.min(...xs), kanan = Math.max(...xs);
          tag(m, (kiri + kanan) / 2, yMid,
            Math.min(120, Math.max(76, (kanan - kiri) * .62 + 18)), midH, 2, a._i);
        }));
      }
      akar.forEach(a => {
        const xs = a.anak.map(m => m._x);
        const kiri = Math.min(...xs), kanan = Math.max(...xs);
        tag(a, (kiri + kanan) / 2, yKotak,
          Math.min(depth === 3 ? 160 : 150, Math.max(80, (kanan - kiri) * .5 + 24)), boxH, depth, a._i);
      });
    }

    /* urutan kemunculan animasi: dari level atas ke bawah */
    const lapisan = l => akar.flatMap(a => {
      let lapis = [a];
      for (let k = 1; k < l; k++) lapis = lapis.flatMap(n => n.anak);
      return lapis;
    });
    let u = 0;
    for (let l = depth; l >= 1; l--) lapisan(l).forEach(n => n._urut = u++);

    /* posisi penanda level di kiri */
    const yLvl1 = vertikal ? yDaun + (2 * (daunH + 12)) / 2 : yDaun;
    T.baris = [[yKotak, depth]];
    if (depth === 3) T.baris.push([yMid, 2]);
    T.baris.push([yLvl1, 1]);
  }

  function gambar() {
    const cv = $('#cv-struktur');
    if (!cv) return;
    const lebar = cv.clientWidth;
    if (!lebar) return;
    const kecil = lebar < 430;
    const akar = susun(kecil);
    const T = tata(akar, lebar, kecil);
    cv.style.aspectRatio = lebar + ' / ' + T.tinggi;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna(), M = MODE[mode];
    bangun(akar, T);

    kotakAkar = akar.map(a => ({
      x: a._x - a._w / 2 - 4, y: a._y - a._h / 2 - 4, w: a._w + 8, h: a._h + 8,
    }));

    const ket = $('#s-ket');
    const teks = M.ket + (kecil && mode === 'tersarang' ? ' Satu negara ditampilkan agar muat di layar kecil.' : '');
    if (ket && ket.textContent !== teks) ket.textContent = teks;

    c.clearRect(0, 0, w, h);
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    const sorot = pin ?? hover;
    const kini = performance.now();
    const kemajuan = n => {
      if (mulai === -Infinity || TENANG.matches) return 1;
      const p = (kini - mulai - n._urut * 55) / 340;
      return p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.pow(1 - p, 3);
    };
    const redup = n => sorot != null && n._akar !== sorot ? .22 : 1;
    let berjalan = false;

    /* panah digambar dulu supaya ujungnya tersembunyi di balik node */
    const gambarPanah = (dari, ke) => {
      const p = kemajuan(ke);
      if (p < 1) berjalan = true;
      if (p <= 0) return;
      const alfa = p * redup(ke);
      if (alfa <= .01) return;
      const x1 = dari._x, y1 = dari._y + dari._h / 2 + 2;
      const x2 = ke._x, y2 = ke._y - ke._h / 2 - 3;
      const aktif = sorot === ke._akar;
      c.globalAlpha = alfa * (aktif ? 1 : .5);
      c.strokeStyle = aktif ? C.a1 : C.tinta;
      c.lineWidth = 1.2;
      const xe = x1 + (x2 - x1) * p, ye = y1 + (y2 - y1) * p;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(xe, ye); c.stroke();
      if (p >= 1) kepalaPanah(c, x2, y2, Math.atan2(y2 - y1, x2 - x1), 4.5);
      c.globalAlpha = 1;
    };

    akar.forEach(a => a.anak.forEach(m => {
      gambarPanah(a, m);
      if (m.anak) m.anak.forEach(d => gambarPanah(m, d));
    }));

    const gambarNode = n => {
      const p = kemajuan(n);
      if (p < 1) berjalan = true;
      if (p <= 0) return;
      const alfa = p * redup(n);
      if (alfa <= .01) return;
      c.globalAlpha = alfa;
      const dy = (1 - p) * -10;
      if (n.anak) {
        const aktif = sorot === n._akar;
        c.fillStyle = C.a1 + (aktif ? '33' : '1a');
        c.strokeStyle = C.a1;
        c.lineWidth = aktif ? 2 : 1.6;
        kotakPath(c, n._x - n._w / 2, n._y - n._h / 2 + dy, n._w, n._h, 8);
        c.fill(); c.stroke();
        c.fillStyle = C.tinta;
        c.font = `600 ${kecil ? 10 : 11.5}px ${FONT}`;
      } else {
        const warnaE = T.depth === 3 && n._lvl === 1 ? C.hijau : C.emas;
        c.fillStyle = warnaE + '22';
        c.strokeStyle = warnaE;
        c.lineWidth = 1.3;
        c.beginPath();
        if (c.ellipse) c.ellipse(n._x, n._y + dy, n._w / 2, n._h / 2, 0, 0, Math.PI * 2);
        else c.rect(n._x - n._w / 2, n._y + dy - n._h / 2, n._w, n._h);
        c.fill(); c.stroke();
        c.fillStyle = C.tinta;
        c.font = `${kecil ? 8.5 : T.depth === 3 ? 9 : 10}px ${FONT}`;
      }
      c.fillText(n.label, n._x, n._y + dy);
      c.globalAlpha = 1;
    };

    akar.forEach(a => {
      gambarNode(a);
      a.anak.forEach(m => {
        gambarNode(m);
        if (m.anak) m.anak.forEach(gambarNode);
      });
    });

    /* penanda level di sisi kiri tiap baris */
    c.fillStyle = C.redup;
    c.font = `600 ${kecil ? 8.5 : 9.5}px ${FONT}`;
    c.textAlign = 'right';
    T.baris.forEach(([y, lvl]) => c.fillText('level ' + lvl, T.Lm - 10, y));
    c.textAlign = 'center';

    if (berjalan && !antre) {
      antre = true;
      requestAnimationFrame(() => { antre = false; gambar(); });
    }
  }

  const cv = $('#cv-struktur');
  const kena = e => {
    /* offsetX dilaporkan dalam piksel visual; ruang gambar memakai piksel layout */
    const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    const x = e.offsetX / z, y = e.offsetY / z;
    const i = kotakAkar.findIndex(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    return i >= 0 ? i : null;
  };
  cv?.addEventListener('pointermove', e => {
    const i = kena(e);
    cv.style.cursor = i != null ? 'pointer' : 'default';
    if (i !== hover) { hover = i; gambar(); }
  });
  cv?.addEventListener('pointerleave', () => {
    if (hover != null) { hover = null; gambar(); }
  });
  cv?.addEventListener('click', e => {
    const i = kena(e);
    pin = i == null || pin === i ? null : i;
    gambar();
  });

  function pilih(m) {
    mode = m;
    TOMBOL.forEach(k => {
      const b = $('#s-' + k);
      b?.classList.toggle('p', k === m);
      b?.setAttribute('aria-pressed', String(k === m));
    });
    hover = null;
    pin = null;
    mulai = TENANG.matches ? -Infinity : performance.now();
    gambar();
  }
  TOMBOL.forEach(k => $('#s-' + k)?.addEventListener('click', () => pilih(k)));

  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(gambar);
  gambar();
})();
