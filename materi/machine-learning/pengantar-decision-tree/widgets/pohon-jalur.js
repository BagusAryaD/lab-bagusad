/* widgets/pohon-jalur.js: Figur 1, jalur prediksi pada decision tree kedalaman 2.
   Struktur pohon statis dari Lampiran A.1, tidak dihitung ulang di peramban.

   Dua tata letak: "lebar" (viewBox 640 x 400, kartu 140 x 84) dan "sempit"
   (viewBox 348 x 300, kartu 82 x 62). Tata letak sempit dipakai saat kanvas
   lebih sempit dari 520 px supaya teks tidak turun di bawah 10 px tampil.
   Di tata letak sempit awalan "Prediksi:" pada pita daun dilepas karena tidak
   muat; warna pita sudah menyatakan kelasnya.

   Catatan aksesibilitas: kartu digambar di canvas sehingga tidak dapat difokus.
   Informasi tiap kartu (n dan komposisi) terbaca lewat tooltip saat kursor di
   atasnya, sedangkan panel hasil #pohon-hasil memuat n dan komposisi daun
   tujuan sehingga pembaca papan tombol tetap mendapat angka yang sama. */
(() => {
  const { warna, kanvas } = Kit;
  const $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';
  const MONO = '"IBM Plex Mono", monospace';
  const fmt = (v, d = 0) => v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const baca = p => getComputedStyle(document.body).getPropertyValue(p).trim();

  const NODE = {
    0: { jenis: 'dalam', tanya: 'Laki-laki?', aturan: 'perempuan ≤ 0,5', n: 714, tidak: 424, selamat: 290 },
    1: { jenis: 'dalam', tanya: 'Usia ≤ 6,5?', aturan: 'usia ≤ 6,5', n: 453, tidak: 360, selamat: 93 },
    2: { jenis: 'dalam', tanya: 'Kelas 1 atau 2?', aturan: 'kelas ≤ 2,5', n: 261, tidak: 64, selamat: 197 },
    3: { jenis: 'daun', kelas: 'selamat', n: 24, tidak: 8, selamat: 16 },
    4: { jenis: 'daun', kelas: 'tidak selamat', n: 429, tidak: 352, selamat: 77 },
    5: { jenis: 'daun', kelas: 'selamat', n: 159, tidak: 9, selamat: 150 },
    6: { jenis: 'daun', kelas: 'tidak selamat', n: 102, tidak: 55, selamat: 47 },
  };
  const URUT = [0, 1, 2, 3, 4, 5, 6];
  const EDGE = [[0, 1, 'Ya'], [0, 2, 'Tidak'], [1, 3, 'Ya'], [1, 4, 'Tidak'], [2, 5, 'Ya'], [2, 6, 'Tidak']];
  const DAUN = {
    3: { kelas: 'selamat', ket: 'laki-laki, usia ≤ 6,5 tahun' },
    4: { kelas: 'tidak selamat', ket: 'laki-laki, usia > 6,5 tahun' },
    5: { kelas: 'selamat', ket: 'perempuan, kelas 1 atau 2' },
    6: { kelas: 'tidak selamat', ket: 'perempuan, kelas 3' },
  };

  const TATA = {
    lebar: {
      vb: { w: 640, h: 400 }, kartu: { w: 140, h: 84 }, bar: 8,
      pos: { 0: [320, 56], 1: [160, 196], 2: [480, 196], 3: [80, 336], 4: [240, 336], 5: [400, 336], 6: [560, 336] },
      f: { tanya: 14, aturan: 10, n: 10.5, kecil: 10.5, daun: 10, persen: 10.5, label: 11 },
      awalan: 'Prediksi: ',
      ringkas: false,
      kapital: false,
    },
    sempit: {
      vb: { w: 352, h: 296 }, kartu: { w: 80, h: 62 }, bar: 6,
      pos: { 0: [176, 32], 1: [88, 132], 2: [264, 132], 3: [42, 240], 4: [130, 240], 5: [222, 240], 6: [310, 240] },
      f: { tanya: 11, aturan: 9, n: 9.5, kecil: 8.5, daun: 9.5, persen: 9.5, label: 10 },
      awalan: '',
      ringkas: true,
      kapital: true,
    },
  };

  let gender = 'P';
  let kelas = 1;
  let usia = 30;
  let jalur = [0, 2, 5];
  let tampil = 2;
  let penanda = null;
  let L = TATA.lebar;
  let skala = 1, geserX = 0, geserY = 0;
  let anim = 0;

  const reduksi = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const tengah = id => ({ x: L.pos[id][0], y: L.pos[id][1] });

  function bulat(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
  }

  function pasFont(c, teks, maks, ukuran, gaya, keluarga = FONT) {
    let u = ukuran;
    for (;;) {
      c.font = `${gaya} ${u}px ${keluarga}`;
      if (c.measureText(teks).width <= maks || u <= 7) return u;
      u -= 0.5;
    }
  }

  function batang(c, x, y, w, h, nd, C) {
    const total = nd.tidak + nd.selamat;
    const wt = w * nd.tidak / total;
    c.save();
    bulat(c, x, y, w, h, h / 2);
    c.clip();
    c.fillStyle = C.a2; c.fillRect(x, y, wt, h);
    c.fillStyle = C.a1; c.fillRect(x + wt, y, w - wt, h);
    c.restore();
  }

  function kartu(c, id, aktif, C, kertas) {
    const nd = NODE[id], f = L.f, kh = L.kartu.h, kw = L.kartu.w;
    const cx = L.pos[id][0], cy = L.pos[id][1];
    const x = cx - kw / 2, y = cy - kh / 2;
    const dalam = nd.jenis === 'dalam';

    c.save();
    bulat(c, x, y, kw, kh, 8);
    c.fillStyle = kertas; c.fill();
    if (!dalam) {
      const pita = kh * 0.26;
      c.clip();
      c.fillStyle = nd.kelas === 'selamat' ? C.a1 : C.a2;
      c.fillRect(x, y, kw, pita);
    }
    c.restore();

    c.strokeStyle = aktif ? C.a1 : C.garis;
    c.lineWidth = aktif ? 2.5 : 1;
    bulat(c, x + 0.5, y + 0.5, kw - 1, kh - 1, 8);
    c.stroke();

    c.textAlign = 'center';
    c.textBaseline = 'middle';

    /* teks dipotong ke dalam kartu supaya tidak pernah meluber ke tepi */
    c.save();
    bulat(c, x + 1, y + 1, kw - 2, kh - 2, 7);
    c.clip();

    const tulis = (s, yy, maks, ukuran, gaya, warnaL, keluarga = FONT) => {
      pasFont(c, s, maks, ukuran, gaya, keluarga);
      c.fillStyle = warnaL;
      c.fillText(s, cx, yy);
    };

    if (dalam) {
      tulis(nd.tanya, y + kh * 0.22, kw - 10, f.tanya, '600', C.tinta);
      tulis(nd.aturan, y + kh * 0.39, kw - 10, f.aturan, '400', C.redup, MONO);
      tulis('n = ' + nd.n, y + kh * 0.56, kw - 12, f.n, '600', C.tinta2, MONO);
      batang(c, x + 8, y + kh * 0.66, kw - 16, L.bar, nd, C);
      const jumlah = L.ringkas ? `${nd.tidak} · ${nd.selamat}` : `${nd.tidak} tidak · ${nd.selamat} selamat`;
      tulis(jumlah, y + kh * 0.88, kw - 10, f.kecil, '400', C.redup);
    } else {
      const pita = kh * 0.26;
      const label = L.kapital ? nd.kelas.charAt(0).toUpperCase() + nd.kelas.slice(1) : L.awalan + nd.kelas;
      tulis(label, y + pita / 2, kw - 8, f.daun, '600', kertas);
      tulis('n = ' + nd.n, y + kh * 0.45, kw - 12, f.n, '600', C.tinta2, MONO);
      batang(c, x + 8, y + kh * 0.55, kw - 16, L.bar, nd, C);
      tulis(`${fmt(100 * nd.selamat / nd.n, 1)}% selamat`, y + kh * 0.81, kw - 8, f.persen, '600', C.tinta);
    }
    c.restore();
  }

  function posPenanda(p) {
    const i = Math.max(0, Math.min(Math.floor(p), jalur.length - 2));
    const f = Math.min(1, Math.max(0, p - i));
    const a = tengah(jalur[i]), b = tengah(jalur[i + 1]);
    const setengah = L.kartu.h / 2;
    const y1 = a.y + setengah, y2 = b.y - setengah, my = (y1 + y2) / 2;
    const pts = [[a.x, y1], [a.x, my], [b.x, my], [b.x, y2]];
    const seg = [];
    let total = 0;
    for (let k = 1; k < pts.length; k++) {
      const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      seg.push(d); total += d;
    }
    let sisa = ease(f) * total;
    for (let k = 0; k < seg.length; k++) {
      if (sisa <= seg[k] || k === seg.length - 1) {
        const u = seg[k] > 0 ? Math.min(1, sisa / seg[k]) : 0;
        return {
          x: pts[k][0] + (pts[k + 1][0] - pts[k][0]) * u,
          y: pts[k][1] + (pts[k + 1][1] - pts[k][1]) * u,
        };
      }
      sisa -= seg[k];
    }
    return { x: b.x, y: y2 };
  }

  function gambar() {
    const cv = $('#cv-pohon');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const r = devicePixelRatio || 1;
    const C = warna();
    const kertas = baca('--kertas') || '#F9F8F5';

    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);
    c.restore();

    L = w < 460 ? TATA.sempit : TATA.lebar;
    skala = Math.min(w / L.vb.w, h / L.vb.h);    geserX = (w - L.vb.w * skala) / 2;
    geserY = (h - L.vb.h * skala) / 2;
    c.setTransform(r * skala, 0, 0, r * skala, r * geserX, r * geserY);

    if (!penanda) {
      const ujung = tengah(jalur[jalur.length - 1]);
      penanda = { x: ujung.x, y: ujung.y - L.kartu.h / 2 };
    }

    const padaJalur = new Set(jalur.slice(0, tampil + 1));
    const tepiJalur = new Set(jalur.slice(0, tampil).map((id, i) => id + '-' + jalur[i + 1]));
    const setengah = L.kartu.h / 2;

    EDGE.forEach(([a, b]) => {
      const na = tengah(a), nb = tengah(b);
      const y1 = na.y + setengah, y2 = nb.y - setengah, my = (y1 + y2) / 2;
      const aktif = tepiJalur.has(a + '-' + b);
      c.strokeStyle = aktif ? C.a1 : C.garis;
      c.lineWidth = aktif ? 3 : 1.5;
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(na.x, y1);
      c.lineTo(na.x, my);
      c.lineTo(nb.x, my);
      c.lineTo(nb.x, y2);
      c.stroke();
    });

    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `600 ${L.f.label}px ${FONT}`;
    EDGE.forEach(([a, b, label]) => {
      const na = tengah(a), nb = tengah(b);
      const my = (na.y + setengah + nb.y - setengah) / 2;
      c.fillStyle = tepiJalur.has(a + '-' + b) ? C.a1 : C.redup;
      c.fillText(label, (na.x + nb.x) / 2, my - L.f.label * 0.8);
    });

    URUT.forEach(id => {
      const aktif = padaJalur.has(id);
      c.globalAlpha = aktif ? 1 : 0.55;
      kartu(c, id, aktif, C, kertas);
      c.globalAlpha = 1;
    });

    c.beginPath();
    c.arc(penanda.x, penanda.y, 6, 0, Math.PI * 2);
    c.fillStyle = C.a1; c.fill();
    c.strokeStyle = kertas; c.lineWidth = 2; c.stroke();
  }

  function hitungJalur() {
    if (gender === 'L') return usia <= 6.5 ? [0, 1, 3] : [0, 1, 4];
    return kelas <= 2 ? [0, 2, 5] : [0, 2, 6];
  }

  function tulisHasil() {
    const el = $('#pohon-hasil');
    if (!el) return;
    const id = jalur[jalur.length - 1];
    const d = DAUN[id], nd = NODE[id];
    const persen = fmt(100 * nd.selamat / nd.n, 1);
    el.innerHTML = `Prediksi: <strong>${d.kelas}</strong>. Kelompok akhir: ${d.ket}, ${nd.n} penumpang, ${nd.selamat} di antaranya selamat (${persen}%).`;
  }

  function mulaiAnimasi() {
    cancelAnimationFrame(anim);
    const cabang = jalur.length - 1;
    const akhir = tengah(jalur[cabang]);
    const ujung = { x: akhir.x, y: akhir.y - L.kartu.h / 2 };
    if (reduksi() || cabang < 1) {
      tampil = cabang;
      penanda = ujung;
      gambar();
      return;
    }
    tampil = 0;
    penanda = posPenanda(0);
    const durasi = 450;
    const mulai = performance.now();
    const langkah = now => {
      /* timestamp rAF bisa sedikit lebih awal dari performance.now(), jadi dijepit */
      const t = Math.max(0, Math.min(1, (now - mulai) / (durasi * cabang)));
      const p = t * cabang;
      tampil = Math.min(cabang, Math.floor(p + 1e-9));
      penanda = posPenanda(p);
      gambar();
      if (t < 1) {
        anim = requestAnimationFrame(langkah);
      } else {
        tampil = cabang;
        penanda = ujung;
        gambar();
      }
    };
    anim = requestAnimationFrame(langkah);
  }

  function ubah() {
    const baru = hitungJalur();
    const sama = baru.join() === jalur.join();
    jalur = baru;
    tulisHasil();
    if (sama) { gambar(); return; }
    mulaiAnimasi();
  }

  function cariNode(lx, ly) {
    const setengahW = L.kartu.w / 2, setengahH = L.kartu.h / 2;
    for (const id of URUT) {
      const [cx, cy] = L.pos[id];
      if (Math.abs(lx - cx) <= setengahW && Math.abs(ly - cy) <= setengahH) return id;
    }
    return null;
  }

  /* ---------- kontrol ---------- */
  const btnP = $('#pohon-perempuan'), btnL = $('#pohon-laki');

  function setGender(g) {
    gender = g;
    [[btnP, 'P'], [btnL, 'L']].forEach(([b, v]) => {
      if (!b) return;
      b.classList.toggle('p', v === g);
      b.setAttribute('aria-pressed', String(v === g));
    });
    ubah();
  }

  function setKelas(k) {
    kelas = k;
    [1, 2, 3].forEach(i => {
      const b = $('#pohon-k' + i);
      if (!b) return;
      b.classList.toggle('p', i === k);
      b.setAttribute('aria-pressed', String(i === k));
    });
    ubah();
  }

  const sl = $('#pohon-usia');

  function setUsia(v, dariSlider = false) {
    usia = Math.min(80, Math.max(0, Math.round(v * 2) / 2));
    if (!dariSlider && sl) sl.value = String(usia);
    const teks = fmt(usia, usia % 1 ? 1 : 0);
    const n = $('#pohon-usia-nilai');
    if (n) n.textContent = teks;
    if (sl) sl.setAttribute('aria-valuetext', teks + ' tahun');
    ubah();
  }

  btnP?.addEventListener('click', () => setGender('P'));
  btnL?.addEventListener('click', () => setGender('L'));
  [1, 2, 3].forEach(k => $('#pohon-k' + k)?.addEventListener('click', () => setKelas(k)));
  sl?.addEventListener('input', () => setUsia(Number(sl.value), true));
  $('#pohon-minus')?.addEventListener('click', () => setUsia(usia - 0.5));
  $('#pohon-plus')?.addEventListener('click', () => setUsia(usia + 0.5));
  $('#pohon-contoh1')?.addEventListener('click', () => { setGender('P'); setKelas(1); setUsia(30); });
  $('#pohon-contoh2')?.addEventListener('click', () => { setGender('L'); setKelas(3); setUsia(22); });

  /* ---------- keterangan komposisi kartu ---------- */
  /* Kanvas tidak bisa difokus, jadi komposisi kartu ditulis di baris tetap di
     bawah kanvas, bukan sebagai tooltip melayang yang menutupi angka kartu. */
  const cv = $('#cv-pohon'), tip = $('#pohon-tip');
  const TIP_AWAL = 'Arahkan kursor ke kartu untuk melihat komposisinya.';
  if (cv && tip) {
    cv.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect();
      const lx = (e.clientX - r.left - geserX) / skala;
      const ly = (e.clientY - r.top - geserY) / skala;
      const id = cariNode(lx, ly);
      if (id == null) {
        if (tip.dataset.node) { tip.textContent = TIP_AWAL; delete tip.dataset.node; }
        return;
      }
      if (tip.dataset.node === String(id)) return;
      tip.dataset.node = String(id);
      const nd = NODE[id];
      const nama = nd.jenis === 'dalam' ? nd.tanya : 'Prediksi: ' + nd.kelas;
      tip.innerHTML = `<b>${nama}</b> ${nd.n} penumpang: ${nd.tidak} tidak selamat, ${nd.selamat} selamat.`;
    });
    cv.addEventListener('pointerleave', () => { tip.textContent = TIP_AWAL; delete tip.dataset.node; });
  }

  /* ---------- awal ---------- */
  jalur = hitungJalur();
  tampil = jalur.length - 1;
  tulisHasil();
  gambar();

  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(gambar);
})();
