/* kit.js v0.3: tema, progres, muncul halus, count-up, utilitas figur, salin kode */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement; root.classList.add('siap');
  try { const t = localStorage.getItem('tema'); if (t) root.dataset.tema = t; } catch {}
  const btnTema = $('#tema');
  const labelTema = () => btnTema?.setAttribute('aria-label', root.dataset.tema === 'gelap' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap');
  labelTema();
  btnTema?.addEventListener('click', () => { const t = root.dataset.tema === 'gelap' ? 'terang' : 'gelap';
    root.dataset.tema = t; try { localStorage.setItem('tema', t); } catch {} labelTema(); document.dispatchEvent(new CustomEvent('tema')); });
  const bar = $('#progres'), h = root;
  const prog = () => { bar.style.width = (100 * h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) + '%'; };
  addEventListener('scroll', prog, { passive: true }); prog();
  const mu = new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('tampil'); o.unobserve(e.target); } }), { threshold: .1 });
  $$('.muncul').forEach(e => mu.observe(e));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (v, d) => v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const co = new IntersectionObserver((es, o) => es.forEach(e => { if (!e.isIntersecting) return; o.unobserve(e.target);
    const el = e.target, T = +el.dataset.target, d = +(el.dataset.dec || 0), t0 = performance.now();
    const tick = t => { const k = Math.min(1, (t - t0) / 1800), z = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; el.textContent = fmt(T * z, d); if (k < 1) requestAnimationFrame(tick); };
    reduce ? el.textContent = fmt(T, d) : requestAnimationFrame(tick); }), { threshold: .5 });
  $$('[data-target]').forEach(e => co.observe(e));

  /* tombol salin untuk setiap blok kode; matikan dengan data-salin="tidak" */
  $$('.kode').forEach(kode => {
    const pre = $('pre', kode);
    if (!pre || kode.dataset.salin === 'tidak' || $('.kode-kepala', kode)) return;
    const kepala = document.createElement('div');
    kepala.className = 'kode-kepala';
    const label = document.createElement('span');
    label.className = 'kode-bahasa';
    label.textContent = kode.dataset.bahasa || 'R';
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'kode-salin'; btn.textContent = 'Salin';
    const isi = () => {
      const baris = $$('.baris', pre);
      const t = baris.length ? baris.map(b => b.textContent).join('\n') : pre.textContent;
      return t.replace(/\s+$/, '');
    };
    const cadangan = t => {
      const ta = document.createElement('textarea');
      ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch {}
      document.body.removeChild(ta); return ok;
    };
    btn.addEventListener('click', async () => {
      const t = isi(); let ok = false;
      try { await navigator.clipboard.writeText(t); ok = true; } catch { ok = cadangan(t); }
      btn.textContent = ok ? 'Tersalin' : 'Gagal';
      btn.classList.toggle('ok', ok);
      clearTimeout(btn._t);
      btn._t = setTimeout(() => { btn.textContent = 'Salin'; btn.classList.remove('ok'); }, 1600);
    });
    kepala.append(label, btn);
    kode.insertBefore(kepala, pre);
  });

  window.Kit = {
    warna() { const s = getComputedStyle(document.body), g = n => s.getPropertyValue(n).trim();
      return { tinta: g('--tinta'), tinta2: g('--tinta-2'), redup: g('--tinta-redup'), a1: g('--aksen-1'), a2: g('--aksen-2'), emas: g('--emas'), hijau: g('--hijau'), garis: g('--garis') }; },
    rng: a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; },
    gauss: r => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); },
    kanvas(cv) { const r = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== Math.round(w * r) || cv.height !== Math.round(h * r)) { cv.width = Math.round(w * r); cv.height = Math.round(h * r); }
      const c = cv.getContext('2d'); c.setTransform(r, 0, 0, r, 0, 0); return { c, w, h }; },
    lihat(el, fn) { new IntersectionObserver(es => es.forEach(e => fn(e.isIntersecting)), { threshold: .45 }).observe(el); }
  };
  window.renderMathInElement?.(document.body, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false });
})();
