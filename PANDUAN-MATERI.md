# Panduan menambah materi

Berkas ini untuk agent yang menyusun halaman materi baru dari draft di
`draft_materi/`. Tujuannya satu: cukup baca berkas ini plus draft, tanpa perlu
menelusuri seluruh repo lebih dulu.

`AGENTS.md` memuat aturan umum situs. Berkas ini memuat prosedur khusus materi.

## Batas konteks

Baca:

- draft di `draft_materi/<nama>/` (berkas `.md` dan JSON acuan bila ada)
- berkas ini
- `data/materi.json`
- satu halaman materi yang sudah jadi sebagai contoh, pilih yang paling dekat
  strukturnya (lihat bagian Contoh acuan)

Jangan baca penuh `kit/kit.css`, `kit/situs.css`, `kit/kit.js`, dan
`kit/daftar-isi.js`. Yang perlu diketahui dari berkas itu sudah diringkas di
sini. Baca potongan tertentu hanya kalau ada yang benar-benar tidak jelas.

Jangan ubah `kit/*`, `beranda.js`, `index.html`, `profil.html`, atau
`alat/*.mjs`, kecuali menambah satu entri di array `sasaran`
`alat/tangkap.mjs` (bagian Sampul).

## Alur

1. Baca draft dan tentukan topik, slug, judul, bagian, dan daftar figur.
2. Buat folder `materi/<topik>/<slug>/` dan `widgets/`.
3. Tulis `index.html` memakai kerangka di bagian Kerangka halaman.
4. Tulis widget satu per satu, uji dengan `node --check`.
5. Tambah entri di array `sasaran` `alat/tangkap.mjs`.
6. Jalankan `node alat/tangkap.mjs <slug>` untuk membuat sampul.
7. Daftarkan di `data/materi.json` dengan `status: "draft"`.
8. Jalankan `node alat/periksa.mjs`.
9. QA tangkapan layar, lalu ubah `status` menjadi `"selesai"` bila sudah layak.

Sampul digenerate sebelum mendaftar karena `periksa.mjs` menolak entri yang
mencantumkan `sampul` atau `sampul_gelap` padahal berkasnya belum ada. Halaman
materi tetap bisa dibuka `tangkap.mjs` lewat `file://` meski belum terdaftar,
jadi urutan ini aman.

## Membaca draft

Draft ditulis dengan konvensi khusus. Perlakukan begini:

- **Blok kutipan (`>`)** adalah catatan untuk penyusun, bukan isi halaman.
  Jangan pernah tampilkan.
- **Bagian "Rencana halaman"** berisi metadata: topik, slug, judul, ringkas,
  tujuan, status awal. Pindahkan ke `data/materi.json`, bukan ke HTML.
- **Bagian "Daftar figur"** adalah ringkasan figur. Sumber kebenarannya ada di
  Lampiran A, bukan tabel ini.
- **Lampiran A (spesifikasi figur)** adalah instruksi teknis untuk menulis
  widget. Tata letak, kontrol, perilaku, dan angka acuan di sini mengikat.
- **Lampiran B (data)** disematkan langsung di berkas widget, bukan berkas
  terpisah dan bukan `fetch`.
- **Lampiran C (algoritma acuan)** adalah acuan implementasi JavaScript.
- **Lampiran D (aturan umum figur)** berlaku untuk semua widget.
- **Angka acuan** harus sama persis dengan keluaran widget. Kalau JSON acuan
  ada di folder draft, pakai itu untuk memeriksa, jangan hitung ulang dengan
  pembulatan sendiri.
- **Kalau draft menyebut berkas data yang tidak ada** di foldernya (misalnya
  CSV), jangan mengarang isinya dan jangan mengunduhnya diam-diam. Cek dulu
  apakah angka yang dibutuhkan sudah ada di JSON acuan. Kalau tidak ada,
  tanyakan ke pemilik repo.
- **`draft_materi/` bukan bagian situs.** Jangan menautkannya dari halaman,
  jangan memuatnya lewat `fetch`, dan jangan memindahkan berkas draft ke
  `materi/` atau `aset/`.
- **Matematika draft memakai `$...$`.** Situs hanya merender `$$...$$` dan
  `\(...\)`. Setiap `$x$` wajib diubah menjadi `\(x\)`. Jangan biarkan satu pun
  `$` tunggal lolos, karena akan tampil mentah.

## Peta draft ke HTML

| Di draft | Di halaman |
|---|---|
| `# Judul` | `<title>`, `<h1>`, dan `judul` di JSON |
| Baris subjudul setelah judul | `subjudul` di JSON dan `<p class="sub">` |
| `## Rencana halaman` | metadata `data/materi.json` |
| `## Daftar figur` | daftar widget, tidak tampil di halaman |
| `## 01 · Gagasan dasar` | `<section class="muncul">` dengan `<div class="label-bagian">01 · Gagasan dasar</div>` |
| `###` pertama sesudah label bagian | `<h2>` |
| `###` yang diikuti kutipan `Spesifikasi implementasi` | `<div class="fig">` dengan `<h3 class="fig-judul">` |
| Blok `>` | tidak ditampilkan |
| `**Tebak dulu: ...**` lalu paragraf | `<details class="temuan"><summary>...</summary><p>...</p></details>` |
| `**tebal**`, `*miring*` | `<strong>`, `<i>` |
| `$x$` | `\(x\)` |
| `$$...$$` | tetap `$$...$$`, atau `<div class="math">$$...$$</div>` |
| ` ```python ` | `<div class="kode" data-bahasa="Python">` |
| ` ```text ` (keluaran) | `<div class="kode" data-salin="tidak">` |
| `## Referensi` | section berlabel nomor terakhir dengan `<ul class="sumber">` |
| `---` | tidak ditampilkan |
| Lampiran A, B, C, D | bahan widget, tidak tampil |

## Kerangka halaman

Ganti bagian bertanda `[...]`. Semua path relatif memakai `../../../` karena
halaman berada tiga tingkat di bawah akar.

```html
<!doctype html>
<html lang="id" data-tema="terang">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>[Judul] · [Nama Topik]</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%231A5276'/><path d='M4 25c3.6 0 5-1.2 6.1-6.7C11 13 12.8 8.5 15.9 8.5s4.9 4.5 5.8 9.8C22.8 23.8 24.2 25 27.8 25' fill='none' stroke='%23F9F8F5' stroke-width='2.4' stroke-linecap='round'/></svg>">
<script>
  try {
    var t = localStorage.getItem('tema');
    if (t ? t === 'gelap' : matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.dataset.tema = 'gelap';
    }
  } catch (e) {}
</script>
<link rel="stylesheet" href="../../../kit/vendor/katex/katex.min.css">
<link rel="stylesheet" href="../../../kit/kit.css">
<link rel="stylesheet" href="../../../kit/situs.css">
<style>
  /* gaya tabel: tidak ada di kit.css, wajib disalin di tiap halaman materi */
  .tabel-gulir{overflow-x:auto;margin:1.5em 0;border:1px solid var(--garis);border-radius:var(--radius);background:var(--kertas-2)}
  table.tabel{width:100%;border-collapse:collapse;font:.84rem/1.55 var(--sans);color:var(--tinta-2);min-width:660px}
  table.tabel.lebar{min-width:660px}
  table.tabel th,table.tabel td{padding:9px 11px;border-bottom:1px solid var(--garis);text-align:left;vertical-align:middle}
  table.tabel th{font-weight:600;color:var(--tinta-redup);font-size:.7rem;letter-spacing:.03em;line-height:1.4;vertical-align:bottom}
  table.tabel td:first-child{color:var(--tinta)}
  table.tabel td.n{font-family:var(--mono);font-size:.8rem;text-align:center;white-space:nowrap;color:var(--tinta)}
  table.tabel tbody tr:hover{background:color-mix(in srgb,var(--tinta) 3%,transparent)}
  table.tabel tbody tr.jeda td{color:var(--tinta-redup);letter-spacing:.2em;padding-top:2px;padding-bottom:2px;border-bottom:0}
  table.tabel tr:last-child td{border-bottom:0}
  .ctl[hidden]{display:none}
  /* override khusus halaman ini saja, misalnya aspect-ratio kanvas di mobile */
</style>
</head>
<body class="materi" data-mk="[topik]">
<a class="lewati" href="#utama">Lewati ke konten</a>
<div id="progres"></div>

<header class="situs">
  <div class="situs-isi">
    <a class="merek" href="../../../index.html" aria-label="Bagus's Lab, beranda">
      <span class="merek-tanda" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 26c4 0 5.6-1.3 6.8-7.4C11 13.2 12.9 8 16 8s5 5.2 6.2 10.6C23.4 24.7 25 26 29 26"/></svg>
      </span>
      <span class="merek-teks">Bagus's Lab</span>
    </a>
    <nav class="situs-nav" aria-label="Navigasi utama">
      <a href="../../../index.html#arsip" aria-current="true">Lab</a>
      <a href="../../../profil.html">Profile</a>
    </nav>
    <button id="tema" aria-label="Aktifkan tema gelap" title="Ganti tema">
      <svg class="ikon-matahari" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/></svg>
      <svg class="ikon-bulan" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7z"/></svg>
    </button>
  </div>
</header>

<header class="hero">
  <div class="label-bagian">[Nama Topik]</div>
  <h1>[Judul]</h1>
  <p class="sub">[Subjudul]</p>
  <p class="identitas">Bagus Arya Dwipangga · Statistika · UNJ</p>
</header>

<main class="artikel" id="utama">

<section class="muncul">
  <div class="label-bagian">01 · [Nama Bagian]</div>
  <h2>[Judul bagian]</h2>
  <p>[Isi]</p>
</section>

<nav class="nav-bawah" aria-label="Navigasi materi">
  <a class="kartu-nav" href="../../../index.html#arsip">
    <span>Arsip</span>
    <b>Kembali ke daftar materi</b>
  </a>
  <span></span>
</nav>

</main>
<script src="../../../kit/vendor/katex/katex.min.js"></script>
<script src="../../../kit/vendor/katex/auto-render.min.js"></script>
<script src="../../../kit/kit.js"></script>
<script src="../../../kit/daftar-isi.js"></script>
<script src="widgets/[nama].js"></script>
</body>
</html>
```

Catatan kerangka:

- Script anti-flash tema di `<head>` wajib disalin persis. Tanpa itu header
  berkedip terang sebelum `kit.js` sempat membaca `localStorage`.
- Urutan script tidak boleh diubah: KaTeX, `kit.js`, `daftar-isi.js`, baru
  widget.
- `class="materi"` dan `data-mk` diwarisi dari halaman lama dan tidak dipakai
  CSS. Pertahankan saja agar konsisten, jangan cari aturannya.
- Tidak ada footer di halaman materi. `nav-bawah` yang menutup halaman.
- `.label-bagian` harus **anak langsung** `<section>`, karena `daftar-isi.js`
  membaca `:scope > .label-bagian` untuk membangun navigasi.

## Penomoran bagian

`daftar-isi.js` membaca pola `01 · Nama`. Kalau label tidak memakai pola itu,
nomor diambil dari urutan section dan namanya memakai seluruh teks label. Jadi
format yang benar:

```html
<div class="label-bagian">03 · Kriteria split</div>
```

Pakai nomor dua digit, titik tengah `·`, lalu nama bagian. Referensi tetap
diberi nomor seperti bagian lain.

## Aturan teks

- Bahasa isi materi: Indonesia.
- Tanpa em dash dan en dash. Rentang ditulis dengan tanda hubung biasa,
  misalnya `2023 - present`. Untuk rentang angka dalam prosa, tulis `sampai`.
- Desimal memakai koma. Di HTML tulis `0,4824`. Di JavaScript pakai
  `toLocaleString('id-ID')`.
- Istilah asing dimiringkan dengan `<i>`, misalnya `<i>decision tree</i>`,
  `<i>overfitting</i>`. Jangan pakai `<em>` untuk istilah.
- Angka ribuan memakai titik: `1.148,0`.
- Judul tabel dua baris memakai `<br>` sebelum kurung, misalnya
  `Omzet penjualan<br>(\(Y_i\), Rp juta)`, bukan
  `Omzet penjualan<br>(\(Y_i\)<br>Rp juta)`.
- Caption figur yang memakai data buatan wajib memuat "Data ilustrasi".
- Setiap `<canvas>` wajib punya `role="img"` dan `aria-label` yang menjelaskan
  isi gambar, karena pembaca layar tidak bisa membaca kanvas.

## Tabel

Bungkus dengan `.tabel-gulir` supaya bisa digeser di layar sempit. Jangan pakai
`overflow-x` sendiri.

```html
<div class="tabel-gulir">
  <table class="tabel">
    <thead>
      <tr><th>Indeks<br>(\(i\))</th><th>Cabang</th></tr>
    </thead>
    <tbody>
      <tr><td class="n">1</td><td>Cabang Menteng</td></tr>
    </tbody>
  </table>
</div>
```

- `class="n"` pada `<td>` untuk kolom angka: rata tengah, font mono.
- `class="lebar"` pada `<table>` bila kolomnya banyak (perbandingan), supaya
  `min-width` tetap berlaku.
- Baris elipsis untuk data yang dipotong memakai `<tr class="jeda">` berisi `⋮`.
- **Gaya tabel tidak ada di `kit.css`.** Blok CSS tabel disalin di `<style>`
  halaman, dan sudah disertakan pada kerangka di atas. Tanpa itu tabel tampil
  polos tanpa garis dan tanpa gulir horizontal. Jangan menambah aturan tabel
  lain di luar blok itu kecuali benar-benar perlu.
- `min-width:660px` membuat tabel lebar digeser horizontal di layar sempit.
  Itu disengaja. Jangan mengecilkan `min-width` hanya agar tabel muat tanpa
  geser, karena kolomnya akan berdesakan.
- Halaman lama `membangkitkan-data-berdistribusi` memakai varian sendiri
  (`table.banding`). Untuk materi baru, pakai `table.tabel` seperti di
  kerangka. Jangan menyalin `table.banding`.

## Kode

```html
<div class="kode" data-bahasa="Python"><pre><span class="baris" data-b="1">import pandas as pd</span><span class="baris" data-b="2">print(data.shape)</span></pre></div>
```

- Tombol salin ditambahkan otomatis oleh `kit.js`. Label bahasa diambil dari
  `data-bahasa`, bawaannya `R`.
- `data-salin="tidak"` untuk blok keluaran yang tidak perlu disalin.
- `class="baris"` dengan `data-b="n"` membuat baris bisa disorot dari widget
  lewat `.aktif`. Pola yang dipakai widget:

  ```js
  const baris = [...document.querySelectorAll('#fig-alg .baris')];
  const sorot = ns => baris.forEach(b => b.classList.toggle('aktif', ns.includes(+b.dataset.b)));
  ```

- Keluaran program ditulis di blok terpisah dengan `data-salin="tidak"`.
  Jangan mengarang keluaran. Kalau draft sudah memuat keluaran nyata, salin
  apa adanya, termasuk angka desimalnya.

## Matematika

- Inline: `\(x_i\)`.
- Display: `<div class="math">$$\bar{x} = \frac{1}{n}\sum x_i$$</div>`.
- KaTeX hanya merender `$$...$$` dan `\(...\)`. Tidak ada `$...$` dan tidak ada
  `\[...\]`.
- `\text{}` di dalam rumus aman dipakai untuk satuan, misalnya
  `\(\text{m}^2\)`.

## Figur dan widget

Satu figur satu berkas di `widgets/`, satu kanvas `#cv-<nama>`. Pola widget
selalu sama:

```js
(() => {
  const { warna, kanvas } = Kit, $ = s => document.querySelector(s);
  const FONT = '"IBM Plex Sans", sans-serif';

  function gambar() {
    const cv = $('#cv-nama');
    if (!cv) return;
    const { c, w, h } = kanvas(cv);
    if (!w) return;
    const C = warna();
    /* ... */
  }

  addEventListener('resize', gambar);
  document.addEventListener('tema', gambar);
  document.fonts?.ready.then(gambar);
  gambar();
})();
```

Aturan yang mudah salah:

- **Wajib menggambar ulang pada `resize` dan event `tema`.** Tanpa itu figur
  tetap berwarna terang saat tema diganti, atau gepeng setelah jendela diubah.
- **`Kit.warna()` tidak punya kunci `kertas`.** Kuncinya hanya `tinta`,
  `tinta2`, `redup`, `a1`, `a2`, `emas`, `hijau`, `garis`. Warna latar kanvas
  diambil manual:
  `getComputedStyle(document.body).getPropertyValue('--kertas-2').trim()`.
  Kalau lupa, `fillStyle` diam-diam memakai warna sebelumnya dan hasilnya
  salah tanpa pesan galat.
- **Token CSS tidak berlaku di kanvas.** Font ditulis sebagai string, misalnya
  `10px "IBM Plex Sans", sans-serif`.
- **`kanvas()` sudah menangani devicePixelRatio.** Koordinat yang dipakai adalah
  ukuran CSS (`w`, `h`), bukan `cv.width`.
- `aspect-ratio` diatur lewat inline style pada `<canvas>`, misalnya
  `style="aspect-ratio:2.1/1"`. Override untuk layar sempit ditaruh di
  `<style>` halaman dengan `!important`, bukan di `kit/*`.
- Kalau figur punya catatan teks di dalam kanvas yang tidak cocok untuk sampul,
  sediakan jalan untuk menyembunyikannya. Lihat bagian Sampul.
- Hormati `prefers-reduced-motion`. Animasi hanya boleh berjalan kalau
  pengguna tidak memintanya dikurangi.
- Kontrol memakai kelas yang sudah ada: `.ctl` sebagai wadah, `.btn` untuk
  tombol, `.btn.p` untuk tombol aktif, `.grid` untuk baris angka, `.lbl` untuk
  label kontrol. Jangan membuat kelas tombol baru.
- `.ctl` di `kit.css` memakai `display:flex`, jadi atribut `hidden` diabaikan.
  Kalau perlu menyembunyikan kontrol, tambahkan `.ctl[hidden]{display:none}`
  di `<style>` halaman.
- Angka di `.grid` diberi `id` dan diperbarui lewat `textContent`.
- Widget tidak boleh memakai pustaka eksternal. Tidak ada `package.json`.
- Data disematkan sebagai konstanta di berkas widget. Jangan `fetch` berkas
  CSV atau JSON dari `draft_materi/`, karena folder itu tidak ikut terbit.
- Semua angka tampilan memakai `toLocaleString('id-ID')`.

### Tata letak beberapa kanvas

Kalau satu figur berisi dua kanvas berdampingan, definisikan pembungkusnya
secara lokal di `<style>` halaman, jangan di `kit/*`:

```css
.kisi2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.kisi2 .panel{min-width:0}
.kisi2 canvas{display:block;width:100%}
@media(max-width:700px){.kisi2{grid-template-columns:1fr}}
```

Nama kelas bebas asal tidak bentrok dengan `kit.css`. Yang sudah dipakai:
`kisi2`, `panel`, `panel-kepala`, `panel-ket`, `tag`.

## Metadata materi

Tambahkan satu entri di array `materi` pada `data/materi.json`:

```json
{
  "slug": "slug-materi",
  "topik": "machine-learning",
  "judul": "Judul Materi",
  "bagian": 1,
  "subjudul": "Subjudul singkat",
  "ringkas": "Satu kalimat untuk kartu di beranda.",
  "berkas": "materi/machine-learning/slug-materi/index.html",
  "sampul": "aset/sampul-slug-materi.jpg",
  "sampul_gelap": "aset/sampul-slug-materi-gelap.jpg",
  "sampul_alt": "Deskripsi isi gambar sampul untuk pembaca layar",
  "tujuan": ["..."],
  "sumber": ["..."],
  "kit": "0.4",
  "status": "draft",
  "tanggal": "2026-11-21"
}
```

- `topik` harus sudah ada di array `topik`. Kalau topiknya baru, tambahkan
  `{ "slug": "...", "nama": "...", "ringkas": "..." }` lebih dulu.
- `bagian` hanya untuk materi yang berseri. Kalau materi berdiri sendiri,
  hilangkan field ini, maka kartu menampilkan "Materi" dan bukan "Bagian 1".
- `slug` folder dan `slug` di JSON harus sama.
- `status: "draft"` menyembunyikan kartu dari beranda. Jangan gunakan nilai
  lain sebelum materinya layak dibaca.
- `tanggal` format `YYYY-MM-DD`, diisi tanggal materi selesai.
- `sumber` berisi buku saja, mengikuti daftar Referensi di halaman. Dokumentasi
  pustaka dan sumber data tidak dicantumkan.
- `sampul_alt` wajib bila `sampul` ada.

## Sampul

Sampul adalah hasil generate dari kanvas figur, bukan gambar buatan tangan.

1. Tambah entri di array `sasaran` pada `alat/tangkap.mjs`:

```js
{
  halaman: 'materi/machine-learning/pengantar-decision-tree/index.html',
  kanvas: '#cv-pohon',
  tunggu: 2500,
  keluar: 'aset/sampul-pengantar-decision-tree.jpg',
},
```

2. Jalankan `node alat/tangkap.mjs <slug>`. Hasilnya dua berkas 1200x900,
   versi terang dan `-gelap`.
3. Bila kanvas memuat catatan teks yang tidak pantas muncul di sampul,
   tambahkan field `siap` berisi JavaScript yang dijalankan sebelum tangkapan:

```js
siap: 'window.__tanpaCatatan = true; window.dispatchEvent(new Event("resize"));',
```

   lalu di widget, lewati penggambaran catatan itu bila
   `window.__tanpaCatatan` bernilai benar.

Pilih kanvas yang paling menjelaskan isi materi dalam satu gambar diam.
Kanvas yang butuh interaksi untuk terlihat bermakna bukan kandidat yang baik.
`tunggu` adalah jeda milidetik sebelum tangkapan; naikkan bila figurnya
beranimasi atau memuat data besar.

## Verifikasi

```
node alat/tangkap.mjs <slug>
node alat/periksa.mjs
node alat/pratinjau.mjs 1280 materi/<topik>/<slug>/index.html terang
node alat/pratinjau.mjs 420 materi/<topik>/<slug>/index.html gelap
```

Cek sintaks widget. PowerShell tidak mengembangkan wildcard untuk `node`, jadi
sebut berkasnya satu per satu atau pakai loop:

```powershell
Get-ChildItem materi/<topik>/<slug>/widgets/*.js | ForEach-Object { node --check $_.FullName }
```

- `pratinjau.mjs` butuh server lokal di `http://127.0.0.1:8765/`
  (`python -m http.server 8765`).
- Jalankan `pratinjau.mjs` **satu per satu**. Port debug-nya tetap (9344), dua
  proses bersamaan menghasilkan gambar halaman yang salah tanpa pesan galat.
- `periksa.mjs` gagal bila ada `materi/**/index.html` yang belum terdaftar di
  `data/materi.json`, atau bila `sampul` yang dicantumkan belum ada berkasnya.
  Karena itu sampul digenerate lebih dulu, baru didaftarkan.

Yang harus dilihat di tangkapan layar:

- hero tidak terpotong dan judul tidak terlalu raksasa
- setiap figur tergambar, tidak kosong, tidak gepeng
- label sumbu tidak bertumpuk dengan angka atau garis
- tabel tidak meluber, header dua baris rapi, dan tetap bisa digeser di 420
- tema gelap benar-benar hitam netral, bukan ungu atau cyan
- tidak ada `$` mentah yang lolos
- tidak ada em dash atau en dash
- konsol bersih dari galat

## Definition of done

- [ ] `index.html` memakai kerangka lengkap, termasuk script anti-flash tema
- [ ] semua section berlabel `NN · Nama`, tanpa nomor yang melompat
- [ ] semua `$...$` dari draft sudah menjadi `\(...\)`
- [ ] setiap figur punya widget, `role="img"`, dan `aria-label`
- [ ] setiap widget menggambar ulang pada `resize` dan `tema`
- [ ] angka di halaman dan di widget sama dengan acuan draft
- [ ] entri `data/materi.json` lengkap dan `periksa.mjs` lolos
- [ ] sampul terang dan gelap sudah digenerate, 1200x900
- [ ] QA 1280 terang dan 420 gelap sudah diperiksa
- [ ] tidak ada em dash, en dash, atau `$` mentah
- [ ] `kit/*`, `beranda.js`, dan `alat/*.mjs` tidak berubah selain entri `sasaran`

## Contoh acuan

| Materi | Untuk melihat |
|---|---|
| `materi/struktur-data/struktur-data-dimensi-waktu/` | Tabel dengan jeda baris, empat figur statis, satu grid interaktif dengan kontrol mode, sakelar yang disembunyikan di sebagian mode |
| `materi/metode-simulasi-statistika/pengantar-simulasi-monte-carlo/` | Simulasi beranimasi, blok kode dengan sorot baris, `details.temuan` untuk "Tebak dulu" |
| `materi/metode-simulasi-statistika/membangkitkan-data-berdistribusi/` | Dua kanvas berdampingan, rumus display, kode R panjang |

Kalau materi baru butuh pola yang belum ada di ketiganya, tambahkan pola itu
secara lokal di halaman materi, jangan di `kit/*`. Kalau ternyata polanya akan
dipakai lagi, baru pertimbangkan memindahkannya ke `kit/` dan catat di
`AGENTS.md`.
