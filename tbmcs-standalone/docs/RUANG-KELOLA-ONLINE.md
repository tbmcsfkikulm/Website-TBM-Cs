# Ruang Kelola dan website — pembaruan untuk ditinjau

Basis: repository `tbmcsfkikulm/Website-TBM-Cs`, tree main `5f93f0e58e66d02fa8a6a86cc39f06a43b6dda25`. Branch lokal: `feat/editor-rich-content`.

Paket ini mencakup dashboard online versi sebelumnya dan pembaruan editor. Belum dipasang ke website publik. Integrasi GitHub menolak pembuatan branch dengan HTTP 403 `Resource not accessible by integration`, sehingga belum ada PR remote dari paket ini.

## Perubahan website

- Favicon ICO dan PNG dibuat dari logo TBM-Cs yang sudah ada. Website, editor lokal, Decap, dan Ruang Kelola memuat favicon tersebut.
- Aturan beranda yang memaksa kontainer menjadi 100% dihapus. Jarak tepi kontainer menjadi 20–56 px sesuai lebar viewport, dengan batas konten 1.180 px. Artikel dibatasi 820 px agar nyaman dibaca.
- Artikel mendukung format teks, tautan, gambar di tengah tulisan, caption, dan grid 2–3 kolom. Grid menjadi satu kolom pada layar di bawah 540 px.
- Artikel dan URL lama tetap dipertahankan; isi `content/site.json` tidak disertakan atau diganti oleh paket.

## Memakai editor baru

Setelah paket dipasang dan deployment berhasil, buka **`https://tbmcs.web.id/ruang-kelola/`**. Decap tetap berada di `/admin/`; editor offline lama tetap `/admin.html`.

1. Masuk dengan GitHub yang memiliki izin menulis pada repository organisasi.
2. Buka Artikel → Artikel baru, atau Edit pada artikel yang sudah ada. Isi judul, slug, tanggal, kategori, ringkasan, dan status.
3. **Mode sederhana:** ketik seperti editor dokumen. Seleksi teks untuk Bold, Italic, Garis bawah, Tautan, atau Font. Menu Format menyediakan paragraf, judul bagian, subjudul, dan kutipan. Ada daftar poin serta Undo/Redo.
4. **Font:** Sans serif, Editorial serif, atau Monospace. Pilihan dibatasi agar tampilan website konsisten, tanpa mengunduh font eksternal.
5. **Foto di tengah tulisan:** letakkan kursor, pilih Foto / grid foto, pilih berkas, susunan, deskripsi gambar, dan caption, lalu Masukkan foto. Maksimal enam foto per sisipan; pilihan susunan satu per baris, grid dua kolom, atau grid tiga kolom. Caption dapat diedit langsung. Gunakan Mode HTML jika membutuhkan deskripsi berbeda pada masing-masing gambar.
6. **Impor HTML:** pilih berkas `.html` atau `.htm` maksimal 900 KB. Impor mengganti isi artikel setelah konfirmasi; judul formulir, slug, dan status tetap. Bila dokumen memiliki `<article>` atau `<main>`, bagian itu digunakan. Impor bukan konversi lengkap desain halaman: script, iframe, form, SVG, event handler, dan CSS bebas dibuang. Gambar HTTPS, `/uploads/`, atau data gambar raster didukung; gambar lokal relatif perlu diunggah ulang.
7. **Mode HTML:** sunting HTML artikel secara langsung. Kembali ke Mode sederhana untuk melihat hasilnya. Hanya tag/atribut yang didukung yang dipertahankan saat berpindah mode atau menyimpan. Jangan memasukkan kode aplikasi/kuis ke editor artikel ini.
8. Tekan **Terapkan perubahan**. Ini memperbarui workspace dalam tab, belum mengirim ke GitHub.
9. Tekan **Simpan ke GitHub**. Penyimpanan membuat/memperbarui branch `content/ruang-kelola-…`, bukan main.
10. Tekan **Ajukan publikasi** untuk membuat PR. Tinjau, setujui, lalu merge ketika siap. Cloudflare membangun ulang website. Pesan “tersimpan” berarti commit berhasil, bukan deployment selesai.

Untuk mencoba tanpa login atau mengubah website, buka `preview-editor.html` dari paket pada browser komputer. Halaman ini memakai kode editor dan kompresi yang sama, serta menampilkan hasil artikel dan data JSON. Tidak tersambung ke GitHub dan tidak menyimpan perubahan setelah ditutup. Pemeriksaan otomatis kecil berjalan saat halaman dibuka; hasil itu belum dijalankan di lingkungan pembuat paket.

## Gambar dan batas ukuran

Unggahan PNG/JPEG/WebP maksimal 10 MB dan 40 megapiksel diperkecil di browser menjadi WebP, sisi terpanjang maksimal 1.280 px dan ukuran maksimal 180 KB per gambar. Jika target tidak tercapai, file ditolak dengan pesan. GIF unggahan belum didukung.

Gambar unggahan tertanam di JSON. Total konten dibatasi 900 KB untuk kompatibilitas Contents API GitHub. Karena base64 menambah ukuran, enam foto berukuran maksimum tidak selalu muat. Saat batas terlewati, formulir tetap terbuka; kurangi foto atau gunakan gambar HTTPS dalam Mode HTML. Galeri besar sebaiknya memakai file `/uploads/` atau layanan penyimpanan media. Menu Media saat ini menampilkan cover artikel, belum seluruh gambar di dalam tulisan.

## Kompatibilitas dan keamanan

- Skema tetap versi 1. `body` tetap teks; field opsional `body_html` menyimpan format kaya. Editor menyinkronkan keduanya.
- Renderer dan editor menyaring HTML sebelum menampilkannya. Daftar tag dibatasi pada paragraf, judul, format teks, daftar, tautan, kutipan, gambar, caption, grid, dan kode.
- Bila editor lama mengubah `body` tetapi meninggalkan HTML lama, website memakai teks baru agar perubahan tidak tertutup markup yang usang. Pengeditan teks melalui Decap/offline dapat menghilangkan format kaya pada tampilan; gunakan Ruang Kelola untuk mempertahankannya. Decap mendapat field opsional untuk mempertahankan `body_html`; konfigurasi backend/OAuth tidak diubah.
- Worker OAuth yang sudah bekerja tidak diubah. Token hanya berada di memori tab. Branch/base SHA/nomor PR dapat disimpan di sessionStorage, tanpa token atau isi artikel.
- Konflik SHA tidak ditimpa otomatis. Unduh salinan JSON sebelum menyelesaikan konflik di GitHub.
- Draft disaring dari HTML publik; repository publik tetap dapat memperlihatkan data draft melalui GitHub.
- Perubahan yang belum disimpan hilang saat tab ditutup. Belum ada autosave, penjadwalan, drag-and-drop untuk mengurutkan galeri, atau auto-merge.
- Fitur format sederhana menggunakan editing browser (`execCommand`); kompatibilitas browser perlu diuji. Mode HTML tersedia sebagai alternatif.
- Impor HTML bukan sandbox untuk menjalankan JavaScript. Konten interaktif perlu halaman terpisah.

## Pengujian paket

Sudah lulus di lingkungan ini:

- `python3 build.py`: 0 artikel sumber dan 13 alat tetap sama.
- `python3 -m unittest test_build.py`: 11 tes, termasuk draft, validasi, serialisasi HTML agar tidak memecah script, dan file favicon.
- `node --test test_online.mjs`: 8 tes; API/SHA/branch, OAuth dengan simulasi, kegagalan jaringan, tidak menulis ke main, kompatibilitas field HTML, batas ukuran, dan penolakan file gambar tidak didukung.
- `node test_export.cjs`: ekspor editor lama valid dan tetap menyaring draft.
- Pemeriksaan sintaks modul editor dan aplikasi.

**Belum lulus uji browser aktual pada versi ini.** Chromium lokal gagal dimulai karena izin socket ditolak (`Operation not permitted`), dan eksekusi dengan izin tambahan ditolak kebijakan lingkungan. Browser cloud juga menolak membuka protokol berkas lokal. Oleh karena itu, jangan menganggap toolbar, unggah gambar, sanitasi DOM, margin/responsivitas, atau OAuth nyata sudah teruji menyeluruh pada versi ini.

Disertakan skrip regresi browser (memerlukan Playwright dan Chromium):

```sh
python3 build.py
TEST_CHROMIUM_PATH=/path/to/chromium node test_rich.cjs
TEST_CHROMIUM_PATH=/path/to/chromium node test_online_browser.cjs
```

`test_rich.cjs` memeriksa sanitasi, mode sederhana/HTML, bold, impor HTML, galeri/kompresi, favicon, dan gutter pada 390/768/1440 px. `test_online_browser.cjs` memeriksa UI dan alur GitHub memakai API/OAuth simulasi. Kedua skrip tidak memublikasikan ke GitHub.

Sebelum merge: jalankan tes browser, coba keyboard/mobile, impor contoh artikel dengan foto, lalu verifikasi hasil artikel. Sesudah pemasangan disetujui: uji login Worker nyata, simpan satu draft di branch, dan buat PR. Worker mengizinkan domain utama dan Pages utama; hostname preview branch bukan origin login yang diizinkan.

## Memasang lewat GitHub web

1. Ekstrak ZIP. Folder `unggah/tbmcs-standalone` berisi perubahan kumulatif dari main yang diperiksa.
2. Buka halaman utama repository. Buat branch **`feat/editor-rich-content`** dari main.
3. Pada branch baru, pilih Add file → Upload files. Seret folder `tbmcs-standalone` dari dalam `unggah`. Jangan unggah ZIP atau membuat folder bersarang dua kali.
4. Pastikan jalur antara lain `tbmcs-standalone/build.py`, `tbmcs-standalone/src/rich-content.js`, dan `tbmcs-standalone/admin/online/rich-editor.mjs`.
5. Paket tidak memuat `content/site.json` atau Worker. `admin/config.yml` hanya menambahkan field HTML/hint; bandingkan diff dan pastikan backend OAuth tidak berubah. Jika upstream sudah berbeda, gabungkan perubahan secara manual.
6. Commit ke branch baru, lalu buat PR ke main. **Jangan merge sebelum meninjau perubahan dan pengujian.**
7. Pengaturan Pages tetap: root `tbmcs-standalone`, build `python3 build.py`, output `dist`. Tidak perlu mengganti DNS atau membuat proyek baru.
8. Setelah merge yang disetujui, tunggu deployment sukses. Buka website, `/favicon.ico`, dan `/ruang-kelola/`. Favicon lama kadang tersimpan di cache browser; periksa tab baru bila belum berubah.

Alternatif git: gunakan `git apply --check website-editor.patch` pada branch pengembangan yang berasal dari main yang sama, lalu `git apply website-editor.patch`. Patch kumulatif tidak untuk diterapkan dua kali. Jika versi Ruang Kelola sebelumnya sudah dipasang, gunakan `editor-v2-incremental.patch` setelah pemeriksaan diff.

## Rujukan

- GitHub Contents API: https://docs.github.com/en/rest/repos/contents
- GitHub CORS: https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests
