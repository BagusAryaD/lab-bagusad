/* widgets/data-ilustrasi.js: data ilustrasi 96 siswa (32 per negara) untuk Figur 2 dan 3,
   beserta alat gambar bersama: sumbu, legenda, dan penyebaran titik.
   Bentuk awan titiknya mengikuti gambar acuan: cukup menyebar, tidak terlalu linear.
   Di dalam tiap negara korelasinya sedang (sekitar 0,65 sampai 0,73) dan garisnya menaik;
   garis gabungan seluruh siswa menurun (sekitar -1,5). Angka persamaan tidak dicantumkan
   di halaman, yang dipakai hanya orientasi arahnya.

   Garis tiap negara pada Figur 3 adalah garis regresi dalam negara yang sudah
   ditarik mendekati garis gabungan (shrinkage), sehingga ketiganya berdekatan
   dan tetap menaik, bukan tiga regresi yang diestimasi terpisah. */
(() => {
  const DATA = {
    A: {
      jam: [4.6, 3, 3.9, 4.9, 4.8, 4.9, 4.4, 5.4, 5.4, 5.3, 4.8, 1.8, 4.3, 3.7, 3.4, 1.5, 5.7, 4, 4.5, 4.1, 2.8, 5.1, 1.9, 2.9, 2.9, 4.2, 2.1, 4.8, 3.7, 5, 4.9, 3.1],
      skor: [77.9, 60.8, 73.1, 83, 80.1, 84.5, 87.1, 84, 88.4, 76.1, 84.8, 67.2, 76.4, 75, 71.6, 71.3, 81.9, 70, 78.2, 78.3, 72.3, 75.5, 79.9, 76.3, 71, 81.7, 75, 79.6, 76.2, 90.1, 87.6, 70],
      garis: { a: 67.2, b: 2.73, x0: 1.5, x1: 5.7 },
    },
    B: {
      jam: [9.2, 8.4, 9.2, 8.8, 8.1, 10, 10.5, 8.5, 9.2, 8.6, 8.9, 11.1, 9.7, 8, 8.3, 9.4, 10.5, 9, 9.5, 9.2, 8.7, 10.4, 9.3, 9.9, 10.3, 8, 9.5, 11.1, 9.8, 10.6, 7.9, 10.6],
      skor: [79.7, 84.7, 79.4, 74, 74.1, 77.2, 79.9, 76.2, 78, 74, 78.6, 83.5, 80.9, 74.2, 75.5, 83.2, 79.5, 75.1, 75.2, 78.6, 74, 80.3, 74.2, 78.6, 85.6, 73.8, 80.6, 86.7, 81.3, 87.7, 77, 77.7],
      garis: { a: 59.0, b: 1.94, x0: 7.9, x1: 11.1 },
    },
    I: {
      jam: [14.9, 13.1, 14.3, 13, 12.9, 15.4, 13.1, 15.1, 14.1, 14.7, 15.4, 14.8, 15.9, 13.5, 15.6, 13.3, 16.7, 14.3, 15.7, 16.8, 15.7, 12.7, 16.7, 13.7, 14.9, 13.8, 13.3, 14.7, 14.9, 15.8, 14.7, 15.1],
      skor: [55.1, 55.6, 55.3, 54.6, 43.8, 61.7, 51.7, 61.6, 56.1, 59, 60.7, 59.3, 61.8, 49.2, 57.9, 47, 60, 58.4, 69.5, 70.1, 55.1, 54.8, 66, 54.8, 57.1, 56.8, 60.6, 64, 60.9, 65.9, 56, 55.2],
      garis: { a: 21.4, b: 2.57, x0: 12.7, x1: 16.8 },
    },
  };
  const KUNCI = ['A', 'B', 'I'];
  const WARNA = { A: 'a1', B: 'a2', I: 'emas' };
  const GABUNGAN = { a: 85.78, b: -1.534 };
  const FONT = '"IBM Plex Sans", sans-serif';
  const XMIN = 0, XMAX = 18, YMIN = 40, YMAX = 95;

  /* sumbu, kisi, dan legenda; mengembalikan pemetaan koordinat */
  function bingkai(c, w, h, C) {
    const kecil = w < 430;
    const L = kecil ? 36 : 44, R = 14, Atas = 76, Bawah = 44;
    const pw = Math.max(1, w - L - R), ph = Math.max(1, h - Atas - Bawah);
    const X = v => L + ((v - XMIN) / (XMAX - XMIN)) * pw;
    const Y = v => Atas + (1 - (v - YMIN) / (YMAX - YMIN)) * ph;

    c.font = `10px ${FONT}`;
    c.textBaseline = 'middle';

    /* kisi + angka sumbu y */
    c.strokeStyle = C.garis; c.lineWidth = 1;
    c.fillStyle = C.redup; c.textAlign = 'right';
    for (let v = YMIN; v <= YMAX; v += 10) {
      c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(L + pw, Y(v)); c.stroke();
      c.fillText(String(v), L - 7, Y(v));
    }
    /* angka sumbu x */
    c.textAlign = 'center';
    for (let v = XMIN; v <= XMAX; v += 3) c.fillText(String(v), X(v), Atas + ph + 14);
    c.fillStyle = C.redup;
    c.fillText('Jam belajar per minggu', L + pw / 2, Atas + ph + 34);
    c.save();
    c.translate(11, Atas + ph / 2); c.rotate(-Math.PI / 2);
    c.fillText('Skor asesmen', 0, 0);
    c.restore();

    /* legenda negara di atas plot */
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.font = `600 ${kecil ? 9 : 10}px ${FONT}`;
    let lx = L;
    for (const k of KUNCI) {
      c.fillStyle = C[WARNA[k]];
      c.beginPath(); c.arc(lx + 4, 14, 4.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = C.tinta2;
      c.fillText('Negara ' + k, lx + 13, 14);
      lx += 13 + c.measureText('Negara ' + k).width + 16;
    }

    return { X, Y, L, R, Atas, Bawah, pw, ph };
  }

  /* seluruh titik, warna menurut negara */
  function titik(c, T, C) {
    for (const k of KUNCI) {
      const d = DATA[k];
      c.fillStyle = C[WARNA[k]];
      c.globalAlpha = .78;
      for (let i = 0; i < d.jam.length; i++) {
        c.beginPath();
        c.arc(T.X(d.jam[i]), T.Y(d.skor[i]), 3.4, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
    }
  }

  window.MIXED = { DATA, KUNCI, WARNA, GABUNGAN, bingkai, titik };
})();