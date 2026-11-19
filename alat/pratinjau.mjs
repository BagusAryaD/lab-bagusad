// alat/pratinjau.mjs — tangkapan layar halaman untuk pemeriksaan visual.
// Jalankan: node alat/pratinjau.mjs [lebar]
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const akar = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lebar = Number(process.argv[2]) || 1280;
const port = 9344;
const profil = join(tmpdir(), 'lab-pratinjau-' + Date.now());
const keluar = join(tmpdir(), 'lab-pratinjau');
mkdirSync(keluar, { recursive: true });

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(p => existsSync(p));
if (!CHROME) { console.error('✗ Chrome/Edge tidak ditemukan'); process.exit(1); }

const jeda = (ms) => new Promise(r => setTimeout(r, ms));

const anak = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profil}`,
  '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  `--window-size=${lebar},900`, 'about:blank',
], { stdio: 'ignore' });

let tutup = false;
const bereskan = () => { if (tutup) return; tutup = true; try { anak.kill(); } catch {} try { rmSync(profil, { recursive: true, force: true }); } catch {} };
process.on('exit', bereskan);

async function tunggu(fn, ms = 20000) {
  const t0 = Date.now();
  for (;;) {
    try { return await fn(); } catch (e) {
      if (Date.now() - t0 > ms) throw e;
      await jeda(200);
    }
  }
}

const target = await tunggu(async () => {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const isi = await res.json();
  const h = isi.find(t => t.type === 'page');
  if (!h) throw new Error('belum siap');
  return h;
});

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = () => j(new Error('ws gagal')); });

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
  const n = ++nomor; menunggu.set(n, { res, rej });
  ws.send(JSON.stringify({ id: n, method, params }));
});
const tungguMuat = () => new Promise(res => {
  const f = (m) => { if (m.method !== 'Page.loadEventFired') return; pendengar.delete(f); res(); };
  pendengar.add(f);
});

await kirim('Page.enable');
await kirim('Runtime.enable');
await kirim('Emulation.setDeviceMetricsOverride', { width: lebar, height: 900, deviceScaleFactor: 1, mobile: lebar < 700 });

const halaman = process.argv[3] || 'index.html';
const tema = process.argv[4] || 'terang';
const jedaMuat = Number(process.argv[5]) || 2600;
const dasar = process.env.LAB_URL || 'http://127.0.0.1:8765/';
const selesai = tungguMuat();
await kirim('Page.navigate', { url: dasar + halaman });
await selesai;
await jeda(600);
await kirim('Runtime.evaluate', { expression: `try{localStorage.setItem('tema',${JSON.stringify(tema)})}catch(e){};document.documentElement.dataset.tema=${JSON.stringify(tema)};window.dispatchEvent(new Event('tema'))` });
await jeda(jedaMuat);

const tinggi = await kirim('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true });
const H = Math.min(tinggi.result.value, 4200);

// gulir pelan sampai bawah supaya animasi "muncul" sempat berjalan, lalu kembali ke atas
if (process.env.LAB_GULIR !== '0') {
  await kirim('Runtime.evaluate', {
    expression: `(async () => {
      const jeda = (ms) => new Promise(r => setTimeout(r, ms));
      for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await jeda(90);
      }
      window.scrollTo(0, 0);
      await jeda(200);
    })()`,
    awaitPromise: true,
  });
  await jeda(500);
}

const gambar = await kirim('Page.captureScreenshot', {
  format: 'jpeg', quality: 82, captureBeyondViewport: true,
  clip: { x: 0, y: 0, width: lebar, height: H, scale: 1 },
});
const nama = `${halaman.replace(/[\\/.]/g, '-')}-${lebar}-${tema}.jpg`;
const berkas = join(keluar, nama);
writeFileSync(berkas, Buffer.from(gambar.data, 'base64'));
console.log(berkas);
ws.close();
bereskan();
