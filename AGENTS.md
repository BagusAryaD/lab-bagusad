# AGENTS.md

Situs statis "Bagus's Lab": catatan kuliah statistika + figur interaktif.
HTML/CSS/JS murni. Tidak ada build step dan tidak ada `package.json`. Repo git
dengan remote `origin` ke `github.com/BagusAryaD/lab-bagusad`. Satu-satunya
dependensi: Node dan Chrome/Edge untuk alat bantu.

Dokumentasi isi dan struktur ada di `README.md`. Berkas ini hanya memuat hal
yang mudah salah kalau tidak tahu.

## Perintah

```
python -m http.server 8765        # server lokal; beranda butuh HTTP, bukan file://
node alat/periksa.mjs             # validasi data/materi.json + keberadaan berkas
node alat/tangkap.mjs             # buat ulang sampul kartu (Chrome headless)
node alat/pratinjau.mjs 1280 index.html terang        # tangkapan layar QA
node alat/pratinjau.mjs 420 profil.html gelap
node alat/pratinjau.mjs 1280 index.html gelap 30000   # arg ke-4: jeda ms
```

Tidak ada test suite atau linter. Verifikasi = `alat/periksa.mjs` + tangkapan
layar dari `alat/pratinjau.mjs`.

## Jebakan

- **Jalankan `pratinjau.mjs` satu per satu.** Port debug-nya tetap (9344); dua
  proses bersamaan akan saling menimpa dan menghasilkan gambar halaman yang
  salah tanpa pesan galat. `tangkap.mjs` memakai port 9333.
- `pratinjau.mjs` butuh server lokal di `LAB_URL` (default
  `http://127.0.0.1:8765/`), karena beranda mengambil `data/materi.json`.
  `tangkap.mjs` justru memakai `file://`, jadi tidak butuh server.
- **Sampul kartu adalah hasil generate, jangan digambar tangan.** `tangkap.mjs`
  bergantung pada kanvas `#cv-pi`, `#cv-terima`, dan `#cv-dimensi` serta widget
  yang menggambar ulang saat menerima CustomEvent `tema`. Ubah figur, jalankan
  ulang alat itu. Filter opsional: `node alat/tangkap.mjs struktur-data`.
  Untuk kanvas yang punya catatan teks di dalam gambar, target bisa memakai
  field `siap` (JS yang dijalankan sebelum tangkapan) supaya catatan itu
  disembunyikan di sampul.
- `periksa.mjs` gagal bila ada `materi/**/index.html` yang belum terdaftar di
  `data/materi.json`, atau masih ada `meta.json` lama. Daftarkan dulu, baru periksa.
- Tema dipilih lewat CSS, bukan JS: dua `<img>` (`.sampul-terang` /
  `.sampul-gelap`) dan `[data-tema="gelap"]` yang menyembunyikan salah satunya.
  Jangan pindahkan logika ini ke JavaScript.
- **Tampilan padat memakai `zoom`, bukan `transform`.** `kit/situs.css` memasang
  `html{zoom:.8}` untuk layar laptop (`min-width:900px`, `max-height:1080px`,
  `pointer:fine`) supaya hero dan figur tidak terpotong di layar pendek.
  `transform:scale()` sengaja dihindari karena merusak header `sticky` dan
  `#progres` yang `fixed`. Dua hal yang mudah salah:
  - `100vh` **tidak** ikut diskalakan `zoom`, jadi `body.profil` perlu
    `min-height:125vh` agar kaki tetap menempel di bawah. Jangan kembalikan ke
    `100vh`.
  - Tangkapan layar QA di lebar 1280 kini menampilkan tata letak seperti 1600px,
    dan `alat/tangkap.mjs` mengunci `zoom` ke `1` sendiri agar sampul tidak
    digambar kecil lalu diperbesar.
- Tidak ada templating. Favicon data-URI, script anti-flash tema di `<head>`, dan
  header/footer disalin manual di setiap halaman. Setiap halaman (termasuk
  materi) wajib menyalin script anti-flash itu; tanpa itu header akan berkedip
  terang sebelum `kit.js` sempat membaca `localStorage`.
- Teks di dalam kanvas memakai string font hardcoded, misalnya
  `10px "IBM Plex Sans", sans-serif`, di `widgets/*.js`. Token CSS tidak berlaku
  di canvas; situs memakai IBM Plex Sans/Mono.

## Arsitektur

- `kit/kit.css`: token desain (warna, font, radius) + gaya artikel. Dimuat semua halaman.
- `kit/situs.css`: cangkang situs (header, footer, tombol), beranda, profil, dan
  halaman materi. Dimuat **setelah** `kit.css` oleh semua halaman.
  Header situs ada di semua halaman; di materi, tab **Lab** ditandai
  `aria-current="true"`.
- `kit/daftar-isi.js`: navigasi dalam halaman materi, dibangun otomatis dari
  `.label-bagian` tiap section; materi baru otomatis mendapat daftar isi.
- `kit/kit.js`: mengelola `data-tema` di `<html>` (localStorage key `tema`),
  progress bar, reveal `.muncul`, count-up `[data-target]`, tombol salin otomatis
  untuk `.kode`, dan KaTeX (`$$...$$` serta `\(...\)`). Mengekspos `window.Kit`:
  `warna()`, `rng(seed)`, `gauss(r)`, `kanvas(cv)`, `lihat(el, fn)`.
- `data/materi.json` adalah satu-satunya sumber daftar materi. `beranda.js`
  merendernya jadi kartu; urutan dalam topik mengikuti field `bagian`. Pencarian
  dan filter topik di beranda hanya menyembunyikan kartu yang sudah dirender,
  bukan merender ulang, dan daftar topik di dropdown filter dibuat dari
  `data.topik`.
- Widget materi ada di `materi/<topik>/<slug>/widgets/*.js`, dimuat setelah
  `kit.js`, dan wajib menggambar ulang pada `resize` dan event `tema`.

## Konvensi

- Bahasa isi materi: Indonesia. Label navigasi: **Lab** / **Profile**.
  Halaman `profil.html` sengaja berbahasa Inggris dan sangat singkat (lead +
  EDUCATION + tombol "Full profile" ke bagusad.web.id). Jangan menambah bagian
  pengalaman/publikasi di sana.
- Tema gelap harus hitam netral (`#0A0A0B` / `#141416`), **bukan ungu atau cyan**.
- Jangan pakai em dash atau en dash di teks yang dilihat pengguna. Rentang
  tanggal ditulis `2023 - present`.
- Simulasi π di hero berhenti di 20.000 titik; jangan naikkan tanpa alasan.
- Logo/ikon merek adalah outline kurva normal (stroke, tanpa fill), dipakai di
  `.merek-tanda` dan favicon.
