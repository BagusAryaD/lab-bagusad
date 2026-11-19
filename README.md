# Bagus's Lab

Catatan kuliah statistika yang bisa dijalankan. Materi ditulis sendiri, dilengkapi
simulasi interaktif dan kode R. Situs ini adalah pelengkap dari
[portofolio](https://bagusad.web.id/).

## Struktur

```
index.html            beranda; simulasi π di hero + kartu materi dari data/materi.json
profil.html           profil singkat (pendidikan) + tombol Full profile ke bagusad.web.id
beranda.js            simulasi hero + pembaca data/materi.json -> kartu materi
data/materi.json      satu-satunya sumber data materi (topik + materi)
kit/kit.css           token desain dan gaya artikel
kit/situs.css         cangkang situs (header, footer, tombol) + beranda, profil, materi
kit/kit.js            tema, progres baca, animasi kode, utilitas kanvas
aset/                 sampul kartu (hasil alat/tangkap.mjs)
alat/periksa.mjs      pemeriksa data sebelum push
alat/tangkap.mjs      membuat sampul kartu dari figur interaktif
alat/pratinjau.mjs    tangkapan layar halaman untuk pemeriksaan visual
materi/<topik>/<slug>/index.html
```

## Menambah materi

1. Buat folder `materi/<slug-topik>/<slug-materi>/` berisi `index.html` dan
   `widgets/` bila perlu. Salin pola dari materi yang sudah ada.
2. Daftarkan di `data/materi.json` pada array `materi`:

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

Topik baru cukup ditambah di array `topik`. Materi dengan `status: "draft"`
tidak ditampilkan di beranda.

3. Jalankan pemeriksa:

```
node alat/periksa.mjs
```

Pemeriksa memastikan setiap `berkas` benar-benar ada, `slug` tidak ganda, topik
dikenal, dan tidak ada materi yang lupa didaftarkan.

## Sampul kartu

Setiap kartu materi menampilkan pratinjau figur interaktifnya. Sampul dibuat
otomatis, jangan digambar tangan:

```
node alat/tangkap.mjs
```

Alat itu membuka setiap materi di Chrome/Edge headless, membiarkan kanvas
figurnya berjalan, lalu menyusun bingkai 1200×900 dari kanvas tersebut. Hasilnya
ditulis ke `aset/`, satu versi terang dan satu versi gelap. Kalau figur atau
ukurannya berubah, jalankan ulang perintah itu.

`alat/periksa.mjs` akan menolak entri yang `sampul` atau `sampul_gelap`-nya
tidak ada, atau yang punya `sampul` tanpa `sampul_alt`.

## Halaman profil

`profil.html` memuat satu paragraf ringkas dan pendidikan penulis, lalu
mengarahkan pembaca ke [bagusad.web.id](https://www.bagusad.web.id/) lewat
tombol **Full profile**. Halaman ini sengaja dibuat sesingkat mungkin; detail
lain cukup tinggal di portofolio. Kalau data di portofolio berubah, perbarui
halaman ini juga.

## Menjalankan secara lokal

Beranda membaca `data/materi.json` lewat `fetch`, jadi tidak bisa dibuka
langsung dengan `file://`. Jalankan server statis:

```
python -m http.server 8765
```

lalu buka `http://127.0.0.1:8765/`. Di VS Code cukup pakai ekstensi Live Server.

Untuk memeriksa tampilan tanpa membuka browser:

```
node alat/pratinjau.mjs 1280 index.html terang
node alat/pratinjau.mjs 420 index.html gelap
node alat/pratinjau.mjs 1280 index.html gelap 30000
```

Argumennya: lebar viewport, halaman, tema, dan jeda opsional dalam milidetik
sebelum tangkapan diambil (berguna untuk menunggu simulasi mencapai batas
20.000 titik). Hasilnya berupa JPEG di folder temporer, dan jalurnya dicetak di
terminal. Jalankan satu per satu, jangan bersamaan, karena alat ini memakai
port debug yang sama.
