/* widgets/impurity.js: Figur 3, Gini, entropi, dan galat klasifikasi terhadap proporsi kelas.
   p adalah proporsi penumpang selamat. Bila sakelar skala aktif, kurva entropi digambar
   sebagai H/2, tetapi panel nilai selalu menampilkan entropi asli dalam bit. */
(() => {
  const { warna, kanvas } = Kit;
  const $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';
  const fmt = (v, d) => v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const kertas = () => getComputedStyle(document.body).getPropertyValue('--kertas-2').trim() || '#F0EDE7';

  const gini = t => 2 * t * (1 - t);
  const entropi = t => (t <= 0 || t >= 1 ? 0 : -(t * Math.log2(t) + (1 - t) * Math.log2(1 - t)));
  const galat = t => Math.min(t, 1 - t);

  const AKAR = 290 / 714;
  const M = { kiri: 52, kanan: 14, atas: 18, bawah: 40 };
  let p = 0.41;
  let skalaEntropi = false;

  /* kanvas kurva: tiga ukuran, sumbu 0 sampai 1, penanda pada p aktif */
  function gambarKurva() {
    const cv = $('#cv-impurity');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();
    const px = M.kiri, py = M.atas;
    const pw = Math.max(1, w - M.kiri - M.kanan);
    const ph = Math.max(1, h - M.atas - M.bawah);
    const X = t => px + t * pw;
    const Y = v => py + (1 - v) * ph;

    c.clearRect(0, 0, w, h);

    /* kisi dan tanda sumbu */
    c.font = `9px ${FONT}`;
    c.strokeStyle = C.garis; c.lineWidth = 1;
    c.fillStyle = C.redup;
    c.textAlign = 'center'; c.textBaseline = 'top';
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      c.beginPath(); c.moveTo(X(t), py); c.lineTo(X(t), py + ph); c.stroke();
      c.fillText(i === 0 || i === 10 ? String(i) : fmt(t, 1), X(t), py + ph + 6);
    }
    c.textAlign = 'right'; c.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const v = i / 5;
      c.beginPath(); c.moveTo(px, Y(v)); c.lineTo(px + pw, Y(v)); c.stroke();
      c.fillText(i === 0 || i === 5 ? String(v) : fmt(v, 1), px - 7, Y(v));
    }

    /* judul sumbu */
    c.fillStyle = C.redup; c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText('Proporsi penumpang selamat, p', px + pw / 2, py + ph + 24);
    c.save(); c.translate(12, py + ph / 2); c.rotate(-Math.PI / 2);
    c.textBaseline = 'middle'; c.fillText('Nilai ukuran', 0, 0); c.restore();

    /* tiga kurva, 201 titik */
    const kurva = (f, gaya, warnaL, bagi) => {
      c.strokeStyle = warnaL; c.lineWidth = 2.5; c.lineJoin = 'round'; c.lineCap = 'round';
      c.setLineDash(gaya);
      c.beginPath();
      for (let i = 0; i <= 200; i++) {
        const t = i / 200, x = X(t), y = Y(f(t) / bagi);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke(); c.setLineDash([]);
    };
    kurva(gini, [], C.a1, 1);
    kurva(entropi, [6, 4], C.a2, skalaEntropi ? 2 : 1);
    kurva(galat, [2, 3], C.emas, 1);

    /* garis vertikal pada p dan tiga penanda */
    const e = entropi(p) / (skalaEntropi ? 2 : 1);
    const tertinggi = Math.max(gini(p), e, galat(p));
    c.strokeStyle = C.redup; c.lineWidth = 1; c.globalAlpha = 0.7;
    c.beginPath(); c.moveTo(X(p), Y(0)); c.lineTo(X(p), Y(tertinggi)); c.stroke();
    c.globalAlpha = 1;
    [[gini(p), C.a1], [e, C.a2], [galat(p), C.emas]].forEach(([v, warnaL]) => {
      c.beginPath(); c.arc(X(p), Y(v), 5, 0, Math.PI * 2);
      c.fillStyle = warnaL; c.fill();
      c.strokeStyle = kertas(); c.lineWidth = 2; c.stroke();
    });

    /* legenda di dalam grafik, pojok kanan atas */
    const baris = [
      ['Gini', [], C.a1],
      [skalaEntropi ? 'Entropi ÷ 2' : 'Entropi', [6, 4], C.a2],
      ['Galat klasifikasi', [2, 3], C.emas],
    ];
    c.font = `9px ${FONT}`;
    const lebarTeks = Math.max(...baris.map(b => c.measureText(b[0]).width));
    const lebar = 26 + 8 + lebarTeks + 10;
    const tinggi = baris.length * 15 + 8;
    const lx = px + pw - lebar - 4, ly = py + 4;
    c.fillStyle = kertas(); c.globalAlpha = 0.92;
    c.beginPath(); c.rect(lx, ly, lebar, tinggi); c.fill();
    c.globalAlpha = 1;
    c.strokeStyle = C.garis; c.lineWidth = 1; c.strokeRect(lx + 0.5, ly + 0.5, lebar - 1, tinggi - 1);
    baris.forEach(([teks, gaya, warnaL], i) => {
      const y = ly + 8 + i * 15;
      c.strokeStyle = warnaL; c.lineWidth = 2.5; c.setLineDash(gaya);
      c.beginPath(); c.moveTo(lx + 8, y); c.lineTo(lx + 26, y); c.stroke(); c.setLineDash([]);
      c.fillStyle = C.tinta2; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(teks, lx + 32, y);
    });
  }

  /* kanvas kisi: 100 penumpang, selamat digambar lebih dahulu baris demi baris */
  function gambarKisi() {
    const cv = $('#cv-kisi');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();
    c.clearRect(0, 0, w, h);

    c.font = `600 9px ${FONT}`;
    c.fillStyle = C.tinta2; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText('Node berisi 100 penumpang', 2, 2);

    const atas = 18, sisi = Math.min(w - 4, h - atas - 4);
    const x0 = (w - sisi) / 2, y0 = atas + (h - atas - 4 - sisi) / 2;
    const sel = sisi / 10;
    const nSelamat = Math.round(100 * p);

    for (let i = 0; i < 100; i++) {
      const r = Math.floor(i / 10), k = i % 10;
      const x = x0 + (k + 0.5) * sel, y = y0 + (r + 0.5) * sel;
      if (i < nSelamat) {
        c.fillStyle = C.a1;
        c.beginPath(); c.arc(x, y, sel * 0.3, 0, Math.PI * 2); c.fill();
      } else {
        c.fillStyle = C.a2;
        const d = sel * 0.32;
        c.beginPath();
        c.moveTo(x, y - d); c.lineTo(x + d, y); c.lineTo(x, y + d); c.lineTo(x - d, y);
        c.closePath(); c.fill();
      }
    }
  }

  function nilai() {
    const g = $('#imp-gini'), e = $('#imp-entropi'), a = $('#imp-galat');
    const pn = $('#imp-p-nilai'), sl = $('#imp-p');
    if (g) g.textContent = fmt(gini(p), 4);
    if (e) e.textContent = fmt(entropi(p), 4) + ' bit';
    if (a) a.textContent = fmt(galat(p), 4);
    if (pn) pn.textContent = fmt(p, 2);
    if (sl) sl.setAttribute('aria-valuetext', fmt(p, 2));
  }

  function gambar() { gambarKurva(); gambarKisi(); nilai(); }

  function setP(v, sinkron = true) {
    p = Math.min(1, Math.max(0, v));
    if (sinkron) {
      const sl = $('#imp-p');
      if (sl) sl.value = String(Math.round(p * 100) / 100);
    }
    gambar();
  }

  /* klik dan seret pada grafik menetapkan p, dibulatkan ke 0,01 */
  const cv = $('#cv-impurity');
  if (cv) {
    let seret = false;
    const dari = ev => {
      const r = cv.getBoundingClientRect();
      const v = (ev.clientX - r.left - M.kiri) / Math.max(1, r.width - M.kiri - M.kanan);
      setP(Math.round(Math.min(1, Math.max(0, v)) * 100) / 100);
    };
    cv.addEventListener('pointerdown', ev => {
      seret = true;
      try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
      dari(ev); cv.focus();
    });
    cv.addEventListener('pointermove', ev => { if (seret) dari(ev); });
    const lepas = ev => {
      seret = false;
      try { cv.releasePointerCapture(ev.pointerId); } catch (e) {}
    };
    cv.addEventListener('pointerup', lepas);
    cv.addEventListener('pointercancel', () => { seret = false; });
    cv.addEventListener('keydown', ev => {
      if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
      ev.preventDefault();
      const satuan = ev.shiftKey ? 10 : 1;
      const dasar = Math.round(p * 100) + (ev.key === 'ArrowRight' ? satuan : -satuan);
      setP(Math.min(100, Math.max(0, dasar)) / 100);
    });
  }

  const sl = $('#imp-p');
  sl?.addEventListener('input', () => setP(Number(sl.value), false));

  $('#imp-p0')?.addEventListener('click', () => setP(0));
  $('#imp-p-root')?.addEventListener('click', () => setP(AKAR));
  $('#imp-p05')?.addEventListener('click', () => setP(0.5));

  const skala = $('#imp-skala');
  skala?.addEventListener('click', () => {
    skalaEntropi = !skalaEntropi;
    skala.setAttribute('aria-pressed', String(skalaEntropi));
    skala.classList.toggle('p', skalaEntropi);
    const catatan = $('#imp-catatan');
    if (catatan) catatan.hidden = !skalaEntropi;
    gambar();
  });

  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(gambar);
  gambar();
})();
