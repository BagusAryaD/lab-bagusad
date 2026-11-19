// alat/periksa.mjs — memeriksa data/materi.json sebelum push.
// Jalankan: node alat/periksa.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const akar = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const berkasData = join(akar, 'data', 'materi.json');

let data;
try {
  data = JSON.parse(readFileSync(berkasData, 'utf8'));
} catch (e) {
  console.error('✗ data/materi.json tidak bisa dibaca:', e.message);
  process.exit(1);
}

const galat = [];
const slugTopik = new Set();
const slugMateri = new Set();
const berkasTerpakai = new Set();

for (const t of data.topik ?? []) {
  if (!t.slug) galat.push('Topik tanpa slug: ' + JSON.stringify(t.nama ?? null));
  else if (slugTopik.has(t.slug)) galat.push('Slug topik ganda: ' + t.slug);
  else slugTopik.add(t.slug);
  if (!t.nama) galat.push('Topik tanpa nama: ' + (t.slug ?? '(tanpa slug)'));
}

for (const m of data.materi ?? []) {
  const nama = m.slug || m.judul || '(tanpa nama)';

  if (!m.slug) galat.push('Materi tanpa slug: ' + nama);
  else if (slugMateri.has(m.slug)) galat.push('Slug materi ganda: ' + m.slug);
  else slugMateri.add(m.slug);

  if (!m.judul) galat.push('Materi tanpa judul: ' + nama);
  if (!m.topik || !slugTopik.has(m.topik)) galat.push('Topik tidak dikenal pada ' + nama + ': ' + m.topik);

  if (!m.berkas) galat.push('Materi tanpa berkas: ' + nama);
  else if (!existsSync(join(akar, m.berkas))) galat.push('Berkas tidak ditemukan: ' + m.berkas);
  else berkasTerpakai.add(resolve(akar, m.berkas));

  if (m.sampul && !existsSync(join(akar, m.sampul))) {
    galat.push('Sampul tidak ditemukan pada ' + nama + ': ' + m.sampul);
  }
  if (m.sampul_gelap && !existsSync(join(akar, m.sampul_gelap))) {
    galat.push('Sampul gelap tidak ditemukan pada ' + nama + ': ' + m.sampul_gelap);
  }
  if (m.sampul && !m.sampul_alt) {
    galat.push('Sampul tanpa sampul_alt pada ' + nama);
  }

  if (m.bagian != null && (!Number.isInteger(m.bagian) || m.bagian < 1)) {
    galat.push('Nilai bagian tidak sah pada ' + nama + ': ' + m.bagian);
  }
}

// Berkas materi yang ada di folder tetapi belum terdaftar, dan sisa meta.json lama.
try {
  const isi = readdirSync(join(akar, 'materi'), { recursive: true, withFileTypes: true });
  for (const ent of isi) {
    if (!ent.isFile()) continue;
    const penuh = resolve(ent.parentPath ?? ent.path, ent.name);
    if (ent.name === 'meta.json') galat.push('meta.json lama masih ada: ' + penuh);
    if (ent.name === 'index.html' && !berkasTerpakai.has(penuh)) {
      galat.push('Materi belum terdaftar di data/materi.json: ' + penuh);
    }
  }
} catch {
  // folder materi belum ada; bukan masalah.
}

if (galat.length) {
  console.error('✗ ' + galat.length + ' masalah ditemukan:');
  for (const g of galat) console.error('  - ' + g);
  process.exit(1);
}

console.log(
  '✓ data/materi.json sah — ' +
  (data.topik?.length ?? 0) + ' topik, ' +
  (data.materi?.length ?? 0) + ' materi, semua berkas ditemukan.'
);
