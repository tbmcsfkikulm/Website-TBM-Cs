# Pemasangan dan pengelolaan

## Upload ke hosting biasa

Unggah `dist/index.html` sebagai `index.html` pada direktori publik hosting. Gambar bawaan, CSS, dan JavaScript sudah tertanam. Navigasi menggunakan fragmen seperti `#rental`, `#articles`, dan `#page/about`, sehingga tidak memerlukan rewrite server. Menyalin HTML harus sebagai dokumen lengkap, bukan menempelkannya ke editor rich text yang menghapus script.

`admin.html` adalah editor lokal. Anda boleh menyimpannya di laptop; tidak wajib diunggah ke hosting. HTML saja tidak dapat membuat login server atau menyimpan perubahan ke repository tanpa backend/API.

## Repository organisasi dan Cloudflare Pages

1. Buat repository organisasi, misalnya `NAMA-ORGANISASI/tbmcs-website`. Pilih private apabila draft dan sumber tidak boleh terlihat publik.
2. Unggah isi folder proyek ke root repository. Jangan mengunggah file ekspor lama yang berisi kredensial.
3. Hubungkan **proyek Cloudflare Pages baru** ke repository tersebut ketika deployment sudah disetujui. Tidak perlu mengubah proyek website personal.
4. Pengaturan: framework **None**, root directory kosong (root repository), build command `python3 build.py`, output directory `dist`.
5. Tinjau alamat preview/pages.dev terlebih dahulu. Pasang domain organisasi hanya setelah alamat dan perubahan DNS disetujui.

GitHub Actions dalam paket hanya memeriksa build dan tes; tidak melakukan deploy. Koneksi Git Cloudflare Pages, bila kemudian diaktifkan, akan membangun ulang saat branch produksi berubah.

## CMS online

File `admin/config.yml` sudah cocok dengan `content/site.json` dan `build.py`. Ganti tiga placeholder setelah repository diketahui:

```yaml
backend:
  name: github
  repo: NAMA-ORGANISASI/NAMA-REPOSITORY
  branch: main
  base_url: https://ALAMAT-OAUTH-ORGANISASI
  auth_endpoint: auth
```

Layanan OAuth **belum dipasang** dalam paket ini. Siapkan layanan GitHub OAuth yang kompatibel dengan Decap, misalnya Cloudflare Worker khusus organisasi. Batasi origin callback/postMessage pada domain admin, validasi state OAuth, simpan client secret sebagai secret server, dan gunakan anggota GitHub dengan izin repository yang sesuai. Jangan menyalin secret ke HTML/YAML atau menggunakan Worker website personal tanpa pengaturan yang disetujui.

Setelah konfigurasi terpasang dan build dideploy, buka `/admin/`, lalu uji login, penyimpanan artikel draft, publikasi artikel, dan upload cover dengan satu konten uji. Tombol login sengaja belum ditampilkan selama placeholder belum diisi. Mengisi placeholder saja belum membuktikan koneksi OAuth berhasil.

Alur CMS: editor login GitHub → konten disimpan ke JSON pada repository → build Cloudflare Pages → HTML baru tampil. Pada konfigurasi awal ini, penyimpanan CMS melakukan commit ke branch `main`; gunakan branch staging bila publikasi harus ditinjau dahulu.

## Menggunakan editor lokal

- Impor sumber terbaru `content/site.json` setiap mulai bekerja pada perangkat lain. Data tersimpan lokal tidak tersinkron otomatis.
- **Artikel**: judul, slug unik, kategori, tanggal, ringkasan, cover, deskripsi cover, isi, dan status.
- **Halaman**: judul, slug, isi, dan status. Pertahankan slug bawaan agar tautan navigasi tetap sesuai. Halaman baru dapat diakses dengan `#page/slug`; penambahannya ke menu memerlukan edit `src/shell.html`.
- **Penyewaan**: nama alat, kategori, harga, satuan, dan ketersediaan. Alat belum tersedia tetap muncul pada katalog tetapi tidak masuk pilihan formulir sewa.
- **Pengaturan**: nama website, deskripsi, judul/pengantar beranda, kontak logistik.
- Isi menggunakan teks paragraf dan subjudul `##`/`###`. HTML ditampilkan sebagai teks, bukan dieksekusi. Ini belum editor rich text penuh.
- Mengubah status menjadi published menampilkan item pada ekspor/build berikutnya; tidak langsung mengunggahnya.
- Untuk logo utama, foto beranda, struktur menu, kampanye donasi, atau blok liputan media, edit sumber di `src/`. Bagian tersebut belum menjadi field CMS.

## Hal yang perlu dilanjutkan setelah repository siap

1. Upload sumber dan buat branch pengembangan organisasi.
2. Impor konten Blogger terpisah dan cocokkan URL artikel lama bila migrasi publik dilakukan.
3. Tentukan domain organisasi, lalu pasang Pages dan OAuth organisasi.
4. Uji publikasi CMS end-to-end dan tinjau preview sebelum produksi.

Versi satu file memprioritaskan portabilitas. Untuk SEO artikel yang lebih kuat dan metadata berbagi khusus per artikel, tahap berikutnya dapat menghasilkan URL HTML terpisah per artikel, sitemap, dan canonical berdasarkan domain organisasi yang sudah dipilih.
