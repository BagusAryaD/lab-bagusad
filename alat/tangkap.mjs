// alat/tangkap.mjs - membuat sampul kartu beranda dari figur interaktif materi.
// Jalankan: node alat/tangkap.mjs
//
// Cara kerja: buka halaman materi di Chrome headless, biarkan figur kanvas berjalan,
// lalu komposisi ulang kanvas figur itu ke bingkai 1200×750 dengan warna kertas situs.
// Hasilnya pratinjau bersih tanpa tombol dan teks kendali, seragam untuk semua kartu.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const akar = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = 9333;
const profil = join(tmpdir(), 'lab-tangkap-' + Date.now());

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find(p => existsSync(p));

if (!CHROME) {
  console.error('✗ Chrome atau Edge tidak ditemukan. Pasang salah satunya lalu jalankan ulang.');
  process.exit(1);
}

// halaman + kanvas sumber + lama tunggu (ms) supaya figur terisi
const sasaran = [
  {
    halaman: 'materi/metode-simulasi-statistika/pengantar-simulasi-monte-carlo/index.html',
    kanvas: '#cv-pi',
    tunggu: 2600,
    keluar: 'aset/sampul-monte-carlo-1.jpg',
  },
  {
    halaman: 'materi/metode-simulasi-statistika/membangkitkan-data-berdistribusi/index.html',
    kanvas: '#cv-terima',
    tunggu: 6500,
    keluar: 'aset/sampul-monte-carlo-2.jpg',
  },
];

const jeda = (ms) => new Promise(r => setTimeout(r, ms));

const anak = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profil}`,
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--window-size=1280,900',
  'about:blank',
], { stdio: 'ignore' });

let keluar = false;
const bereskan = () => {
  if (keluar) return;
  keluar = true;
  try { anak.kill(); } catch {}
  try { rmSync(profil, { recursive: true, force: true }); } catch {}
};
process.on('exit', bereskan);
process.on('SIGINT', () => { bereskan(); process.exit(130); });

async function tunggu(fn, ms = 20000) {
  const t0 = Date.now();
  for (;;) {
    try { return await fn(); } catch (e) {
      if (Date.now() - t0 > ms) throw e;
      await jeda(200);
    }
  }
}

const daftar = await tunggu(async () => {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const isi = await res.json();
  const halaman = isi.find(t => t.type === 'page');
  if (!halaman) throw new Error('target belum siap');
  return halaman;
});

const ws = new WebSocket(daftar.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('gagal menyambung ke Chrome')); });

let nomor = 0;
const menunggu = new Map();
const pendengar = new Set();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && menunggu.has(m.id)) {
    const { res, rej } = menunggu.get(m.id);
    menunggu.delete(m.id);
    m.error ? rej(new Error(m.error.message)) : res(m.result);
    return;
  }
  for (const f of pendengar) f(m);
};
const kirim = (method, params = {}) => new Promise((res, rej) => {
  const n = ++nomor;
  menunggu.set(n, { res, rej });
  ws.send(JSON.stringify({ id: n, method, params }));
});
const tungguMuat = () => new Promise(res => {
  const f = (m) => {
    if (m.method !== 'Page.loadEventFired') return;
    pendengar.delete(f);
    res();
  };
  pendengar.add(f);
});

await kirim('Page.enable');
await kirim('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 2, mobile: false });
await kirim('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

mkdirSync(join(akar, 'aset'), { recursive: true });

const komposisi = (sel, lebar, tinggi, tepi) => `(() => {
  const src = document.querySelector(${JSON.stringify(sel)});
  if (!src) return null;
  const cs = getComputedStyle(document.body);
  const kertas = cs.getPropertyValue('--kertas-2').trim() || '#F0EDE7';

  // cari kotak isi kanvas: batas kiri-atas-kanan-bawah dari gambar sebenarnya.
  // Tujuannya membuang margin kosong bawaan kanvas supaya gambar mengisi bingkai.
  const s = src.width / src.clientWidth;
  const g = src.getContext('2d');
  const d = g.getImageData(0, 0, src.width, src.height).data;
  const latar = [d[0], d[1], d[2]];
  const beda = (i) => Math.abs(d[i] - latar[0]) + Math.abs(d[i + 1] - latar[1]) + Math.abs(d[i + 2] - latar[2]) > 26;
  let kiri = src.width, kanan = 0, atas = src.height, bawah = 0;
  for (let y = 0; y < src.height; y += 2) {
    for (let x = 0; x < src.width; x += 2) {
      const i = (y * src.width + x) * 4;
      if (!beda(i)) continue;
      if (x < kiri) kiri = x;
      if (x > kanan) kanan = x;
      if (y < atas) atas = y;
      if (y > bawah) bawah = y;
    }
  }
  const cw = Math.max(1, kanan - kiri), ch = Math.max(1, bawah - atas);

  const out = document.createElement('canvas');
  out.width = ${lebar};
  out.height = ${tinggi};
  const c = out.getContext('2d');
  c.fillStyle = kertas;
  c.fillRect(0, 0, ${lebar}, ${tinggi});

  const kotakW = ${lebar} - ${tepi} * 2;
  const kotakH = ${tinggi} - ${tepi} * 2;
  const k = Math.min(kotakW / cw, kotakH / ch);
  const dw = cw * k, dh = ch * k;
  const dx = (${lebar} - dw) / 2, dy = (${tinggi} - dh) / 2;
  c.imageSmoothingQuality = 'high';
  c.drawImage(src, kiri, atas, cw, ch, dx, dy, dw, dh);

  return { data: out.toDataURL('image/jpeg', .9) };
})()`;

for (const t of sasaran) {
  for (const tema of ['terang', 'gelap']) {
    const selesai = tungguMuat();
    await kirim('Page.navigate', { url: pathToFileURL(join(akar, t.halaman)).href });
    await selesai;
    await jeda(400);

    // pasang tema sebelum figur digambar, supaya warna kanvas langsung sesuai.
    // zoom dikunci ke 1 karena jendela 1280x900 termasuk "layar laptop" dan akan
    // kena mode padat di situs.css; tanpa ini figur digambar lebih kecil lalu
    // diperbesar lagi saat komposisi sehingga titiknya terlihat kasar.
    await kirim('Runtime.evaluate', {
      expression: `(() => {
        try { localStorage.setItem('tema', ${JSON.stringify(tema)}); } catch (e) {}
        document.documentElement.style.zoom = '1';
        document.documentElement.dataset.tema = ${JSON.stringify(tema)};
        document.dispatchEvent(new CustomEvent('tema'));
        window.dispatchEvent(new Event('resize'));
        const el = document.querySelector(${JSON.stringify(t.kanvas)});
        if (el) el.closest('.fig')?.scrollIntoView({ block: 'center', behavior: 'instant' });
        return !!el;
      })()`,
      returnByValue: true,
    });
    await jeda(t.tunggu ?? 2500);

    const hasil = await kirim('Runtime.evaluate', {
      expression: komposisi(t.kanvas, 1200, 900, 28),
      returnByValue: true,
    });
    const nilai = hasil.result.value;
    if (!nilai?.data) {
      console.error('✗ kanvas tidak ditemukan: ' + t.kanvas + ' di ' + t.halaman);
      break;
    }

    const berkas = tema === 'gelap'
      ? t.keluar.replace(/\.jpg$/, '-gelap.jpg')
      : t.keluar;
    const isi = Buffer.from(nilai.data.split(',')[1], 'base64');
    writeFileSync(join(akar, berkas), isi);
    console.log('✓ ' + berkas + ' (' + Math.round(isi.length / 1024) + ' KB, 1200×900)');
  }
}

ws.close();
bereskan();
console.log('Selesai.');
