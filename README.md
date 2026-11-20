# Bagus's Lab

Catatan kuliah statistika yang bisa diakses lewat https://lab.bagusad.web.id/. Ada simulasi interaktif dan contoh kode R. Dibikin iseng, awalnya buat bahan belajar mahasiswa Statistika di prodi saya, sekaligus arsip pribadi. Materi lain nyusul, baik untuk mata kuliah lain maupun materi statistika di luar kuliah.

Kalau ada masukan atau saran materi, contact aja.

## Apa yang ada di sini

- **index.html** — Beranda. Ada simulasi estimasi pi dengan metode hit or miss di bagian hero, lalu daftar materi (arsip).
- **profil.html** — Profil singkat (pendidikan) dan tombol "Full profile" ke bagusad.web.id.
- **data/materi.json** — Satu-satunya daftar materi. Setiap kartu di beranda diambil dari sini.
- **kit/** — Kode desain dan utilitas yang dipakai semua halaman: kit.css (token warna, font, gaya artikel), situs.css (header, footer, tombol, tata letak), kit.js (tema, progres baca, animasi kode, KaTeX).
- **materi/<topik>/<slug>/** — Halaman materi masing-masing, boleh ada folder widgets/ untuk figur interaktif.
- **alat/** — Script bantu: periksa.mjs (validasi data), tangkap.mjs (buat sampul kartu), pratinjau.mjs (tangkapan layar).
- **aset/** — Sampul kartu materi, hasil generate dari alat/tangkap.mjs.

## Materi saat ini

Sekarang cuma satu topik: **Metode Simulasi Statistika**, dengan dua bagian:

1. Simulasi Monte Carlo, Bagian 1 — Pengantar Hit or Miss. Estimasi pi dengan titik acak di persegi.
2. Simulasi Monte Carlo, Bagian 2 — Membangkitkan Data Berdistribusi Tertentu. Metode acceptance-rejection untuk Beta(2,4) dan normal, dengan kode R dan simulasi interaktif.

## Menambah materi

1. Buat folder `materi/<topik>/<slug>/` berisi `index.html` dan `widgets/` kalau perlu. Copas pola dari materi yang sudah ada.
2. Daftarkan di `data/materi.json`, di array `materi`. Contoh:

```json
{
  "slug": "slug-materi",
  "topik": "metode-simulasi-statistika",
  "judul": "Judul Materi",
  "bagian": 3,
  "subjudul": "Subjudul singkat",
  "ringkas": "Satu kalimat untuk kartu di beranda.",
  "berkas": "materi/metode-simulasi-statistika/slug-materi/index.html",
  "sampul": "aset/sampul-slug-materi.jpg",
  "sampul_gelap": "aset/sampul-slug-materi-gelap.jpg",
  "sampul_alt": "Deskripsi isi gambar sampul untuk pembaca layar",
  "tujuan": ["..."],
  "sumber": ["..."],
  "kit": "0.4",
  "status": "selesai",
  "tanggal": "2026-11-19"
}
```

Topik baru ditambah di array `topik`. Materi dengan `status: "draft"` tidak muncul di beranda.

3. Jalankan pemeriksa:

```
node alat/periksa.mjs
```

Pemeriksa memastikan berkas ada, slug tidak ganda, topik dikenal, dan semua materi terdaftar.

## Sampul kartu

Sampul tiap kartu di beranda adalah pratinjau figur interaktifnya. Jangan digambar tangan, hasil generate otomatis:

```
node alat/tangkap.mjs
```

Alat membuka materi di Chrome/Edge headless, menunggu kanvas figurnya berjalan, lalu menyusun bingkai 1200×900. Hasilnya satu versi terang dan satu versi gelap di folder `aset/`. Kalau figur atau ukurannya berubah, jalankan ulang.

Pemeriksa akan menolak entri yang `sampul` atau `sampul_gelap`-nya tidak ada, atau yang punya `sampul` tanpa `sampul_alt`.

## Menjalankan secara lokal

Beranda membaca `data/materi.json` lewat `fetch`, jadi tidak bisa dibuka langsung dengan `file://`. Jalankan server statis:

```
python -m http.server 8765
```

lalu buka `http://127.0.0.1:8765/`. Di VS Code cukup pakai ekstensi Live Server.

Untuk cek tampilan tanpa browser:

```
node alat/pratinjau.mjs 1280 index.html terang
node alat/pratinjau.mjs 420 index.html gelap
node alat/pratinjau.mjs 1280 index.html gelap 30000
```

Argumen: lebar viewport, halaman, tema, dan jeda opsional dalam milidetik sebelum tangkapan diambil. Jalankan satu per satu, jangan bersamaan, karena alat ini memakai port debug yang sama.
