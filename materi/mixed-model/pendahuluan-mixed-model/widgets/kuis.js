/* widgets/kuis.js: lima figur kuis varian model, satu figur per soal.
   Tiap figur punya kanvas dan tombol jawaban sendiri; umpan balik beranimasi
   muncul setelah menjawab, skor total tampil setelah semua soal terjawab.
   Skor tidak disimpan. Grafik tiap soal: empat garis, tanpa titik data,
   tanpa garis rata-rata. */
(() => {
  const { warna, kanvas } = Kit;
  const FONT = '"IBM Plex Sans", sans-serif';
  const WARNA = ['a1', 'a2', 'emas', 'hijau'];
  const LABEL = { ri: 'random intercept', rs: 'random slope', both: 'random intercept dan random slope' };

  const SOAL = [
    {
      x: 'Jam belajar', y: 'Skor asesmen',
      garis: [[20, 3.5], [32, 3.5], [45, 3.5], [58, 3.5]],
      jawab: 'ri',
      jelas: 'Keempat garis sejajar, sehingga slope sama untuk seluruh cluster (fixed). Intercept berbeda antar cluster. Varian yang sesuai adalah random intercept.',
    },
    {
      x: 'Jam belajar', y: 'Skor asesmen',
      garis: [[20, 3], [35, 5.5], [65, 0.5], [50, 2]],
      jawab: 'both',
      jelas: 'Garis tidak sejajar dan tidak bertemu di satu titik pada x = 0: intercept dan slope keduanya berbeda antar cluster. Varian yang sesuai adalah random intercept dan random slope.',
    },
    {
      x: 'Jumlah latihan soal', y: 'Skor tes',
      garis: [[30, 1], [30, 2.5], [30, 4], [30, 5.5]],
      jawab: 'rs',
      jelas: 'Keempat garis bertemu di satu titik pada x = 0, sehingga intercept sama untuk seluruh cluster (fixed), sedangkan slope berbeda antar cluster. Varian yang sesuai adalah random slope.',
    },
    {
      x: 'Jumlah absensi', y: 'Skor ujian',
      garis: [[40, -3], [55, -3], [70, -3], [88, -3]],
      jawab: 'ri',
      jelas: 'Keempat garis sejajar dan menurun, sehingga slope sama dan hanya intercept yang berbeda. Arah hubungan tidak menentukan varian model; yang menentukan adalah apakah slope sama antar cluster. Varian yang sesuai adalah random intercept.',
    },
    {
      x: 'x', y: 'y',
      garis: [[80, -4], [30, 2], [55, 0], [15, 4.5]],
      jawab: 'both',
      jelas: 'Garis memiliki intercept yang berbeda pada x = 0 dan slope yang berbeda, termasuk yang berlawanan arah. Varian yang sesuai adalah random intercept dan random slope.',
    },
  ];

  const XMAX = 10, YMAX = 100;
  const N = SOAL.length;
  const terjawab = new Array(N).fill(false);
  let skor = 0;

  function bingkai(c, w, h, C, s) {
    const kecil = w < 430;
    const L = kecil ? 36 : 44, R = 14, Atas = 26, Bawah = 44;
    const pw = Math.max(1, w - L - R), ph = Math.max(1, h - Atas - Bawah);
    const X = v => L + (v / XMAX) * pw;
    const Y = v => Atas + (1 - v / YMAX) * ph;

    c.font = `10px ${FONT}`;
    c.textBaseline = 'middle';

    c.strokeStyle = C.garis; c.lineWidth = 1;
    c.fillStyle = C.redup; c.textAlign = 'right';
    for (let v = 0; v <= YMAX; v += 20) {
      c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(L + pw, Y(v)); c.stroke();
      c.fillText(String(v), L - 7, Y(v));
    }
    c.textAlign = 'center';
    for (let v = 0; v <= XMAX; v += 2) c.fillText(String(v), X(v), Atas + ph + 14);
    c.fillText(s.x, L + pw / 2, Atas + ph + 34);
    c.save();
    c.translate(11, Atas + ph / 2); c.rotate(-Math.PI / 2);
    c.fillText(s.y, 0, 0);
    c.restore();

    /* garis x = 0 lebih tegas supaya titik temu terbaca */
    c.strokeStyle = C.garis; c.lineWidth = 2;
    c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(0), Y(YMAX)); c.stroke();

    return { X, Y };
  }

  function gambarSoal(i) {
    const cv = document.getElementById('cv-kuis-' + (i + 1));
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();

    c.clearRect(0, 0, w, h);
    const T = bingkai(c, w, h, C, SOAL[i]);

    c.lineWidth = 2.4;
    SOAL[i].garis.forEach(([a, b], j) => {
      c.strokeStyle = C[WARNA[j]];
      c.beginPath();
      c.moveTo(T.X(0), T.Y(a));
      c.lineTo(T.X(XMAX), T.Y(a + b * XMAX));
      c.stroke();
    });
    c.textBaseline = 'alphabetic';
  }

  const gambarSemua = () => { for (let i = 0; i < N; i++) gambarSoal(i); };

  function tandaiJawaban(i, tombolPilih) {
    const s = SOAL[i];
    const benar = tombolPilih.dataset.jawab === s.jawab;
    if (benar) skor++;
    terjawab[i] = true;

    tombolPilih.closest('.ctl').querySelectorAll('.btn').forEach(b => {
      b.disabled = true;
      if (b !== tombolPilih && b.dataset.jawab === s.jawab) b.classList.add('kunci');
    });
    tombolPilih.classList.add(benar ? 'benar' : 'salah');

    const fig = document.getElementById('fig-kuis-' + (i + 1));
    const umpan = fig ? fig.querySelector('.k-umpan') : null;
    if (umpan) {
      umpan.textContent = (benar ? 'Benar. ' : 'Salah. Jawaban yang benar: ' + LABEL[s.jawab] + '. ') + s.jelas;
      requestAnimationFrame(() => umpan.classList.add('tampil'));
    }

    if (terjawab.every(Boolean)) {
      const angka = document.getElementById('k-skor-angka');
      const baris = document.getElementById('k-skor');
      if (angka) angka.textContent = String(skor);
      if (baris) requestAnimationFrame(() => {
        baris.hidden = false;
        requestAnimationFrame(() => baris.classList.add('tampil'));
      });
    }
  }

  document.querySelectorAll('.fig-kuis .btn[data-jawab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.soal) - 1;
      if (!(i >= 0 && i < N) || terjawab[i]) return;
      tandaiJawaban(i, btn);
    });
  });

  document.getElementById('k-ulang')?.addEventListener('click', () => {
    terjawab.fill(false);
    skor = 0;
    document.querySelectorAll('.fig-kuis .btn[data-jawab]').forEach(b => {
      b.disabled = false;
      b.classList.remove('benar', 'salah', 'kunci');
    });
    document.querySelectorAll('.k-umpan').forEach(u => { u.classList.remove('tampil'); u.textContent = ''; });
    const baris = document.getElementById('k-skor');
    if (baris) { baris.classList.remove('tampil'); baris.hidden = true; }

    /* kembali ke soal pertama; tanpa animasi bila pengguna mengurangi gerak */
    const fig1 = document.getElementById('fig-kuis-1');
    if (fig1) {
      fig1.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      });
      /* rapikan sisa selisih beberapa px (pembulatan zoom / transisi reveal) */
      addEventListener('scrollend', () => {
        const sisa = fig1.getBoundingClientRect().top;
        if (Math.abs(sisa) > 1) scrollBy(0, sisa);
      }, { once: true });
    }
  });

  addEventListener('resize', gambarSemua);
  document.addEventListener('tema', gambarSemua);
  document.fonts?.ready.then(gambarSemua);
  gambarSemua();
})();
