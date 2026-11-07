# TBM-Cs — website HTML mandiri

Konversi template organisasi yang diberikan Faisal, 6 November 2026. Ini proyek terpisah dari website personal abanggfaisal.my.id. Belum diunggah ke GitHub atau dideploy.

## Cara paling cepat

1. Buka `dist/index.html` di browser untuk melihat website.
2. Buka `dist/admin.html` untuk mengelola artikel, halaman, katalog sewa, dan pengaturan. File HTML ini dapat dibuka langsung tanpa server.
3. Impor `content/site.json` untuk memuat seluruh sumber konten, termasuk draft.
4. Setelah mengedit, pilih **Unduh site.json** untuk menyimpan sumber. Simpan hasilnya menggantikan `content/site.json` setelah membuat cadangan.
5. Pilih **Unduh website HTML** untuk memperoleh `index.html` siap diunggah. Gambar yang diunggah melalui editor akan tertanam di HTML.

Editor ini menyimpan perubahan di browser dan mengekspor file; tidak langsung menulis ke server. Login dan publikasi CMS online tersedia melalui konfigurasi Decap di `admin/`, tetapi belum aktif sampai repository organisasi dan layanan OAuth dipasang.

## Build dari sumber

Diperlukan Python 3.10+; tidak perlu menginstal dependency Python.

```bash
python3 build.py
python3 -m unittest -v test_build.py
```

Pengujian ekspor tambahan menggunakan Node.js:

```bash
node test_export.cjs
```

Output ada di `dist/`. Build menyaring draft dan menanamkan CSS, JavaScript, serta gambar bawaan ke dalam HTML publik. Cover pada `/uploads/` diambil dari `public/uploads/` dan disematkan saat build; cover HTTPS tetap mengambil gambar dari penyedianya. Editor offline meminta build Python untuk cover `/uploads/` karena browser tidak memiliki akses otomatis ke filesystem.

## Isi proyek

| File / direktori | Fungsi |
| --- | --- |
| `dist/index.html` | Website siap pakai, HTML biasa dengan CSS/JS/gambar bawaan tertanam |
| `dist/admin.html` | Editor lokal yang bisa digunakan tanpa server |
| `dist/admin/index.html` | Pintu masuk CMS online dengan penjelasan status konfigurasi |
| `admin/config.yml` | Skema Decap dan placeholder repository/OAuth |
| `content/site.json` | Sumber artikel, halaman, pengaturan, dan 13 alat sewa |
| `src/` | Tampilan hasil konversi, CSS, navigasi dan interaksi |
| `public/uploads/` | Media yang nantinya diunggah lewat Decap |
| `build.py` | Validasi dan build tanpa dependency tambahan |
| `test_build.py`, `test_export.cjs` | Pengujian build, draft, validasi, dan ekspor |
| `.github/workflows/check.yml` | Pemeriksaan otomatis; tidak melakukan deployment |
| `docs/SETUP.md` | Pemasangan GitHub, hosting, dan CMS |
| `docs/CONVERSION-REPORT.md` | Cakupan konversi, hasil uji, dan keterbatasan |

## Konten yang belum tersedia

File tema Blogger tidak menyertakan postingan dan isi halaman yang tersimpan di layanan Blogger. Artikel, struktur pengurus, kegiatan, buku profil, buku pedoman, serta karya ilmiah belum dimigrasikan. Halaman yang belum memiliki isi menampilkan keterangan yang jelas. Tidak ada artikel contoh di paket publik.

Untuk migrasi lengkap, sediakan ekspor **konten** Blogger dan file dokumennya. QR SOP, liputan media, kontak, foto, serta data donasi berasal dari tema yang diberikan. Tautan eksternal tetap bergantung pada pemilik situs tersebut. Donasi lama berakhir 29 Oktober 2026 dan ditampilkan sebagai selesai; tidak dibuat laporan penyaluran fiktif.

## Batas keamanan dan publikasi

Tidak ada password atau token di frontend. Admin lokal tidak membutuhkan login karena hanya mengubah data dalam browser pengguna. Hal ini bukan autentikasi server. CMS online harus menggunakan GitHub OAuth yang dikonfigurasi secara terpisah untuk organisasi.

Status draft mencegah konten masuk ke HTML publik, tetapi **draft di repository publik tetap dapat dibaca melalui GitHub**. Jangan menyimpan data rahasia, password, token, atau informasi internal sensitif di repository atau file HTML. Unduh cadangan sebelum membersihkan penyimpanan browser.

Hak atas teks, foto, logo, dan materi sumber mengikuti pemiliknya. Konversi ini menghapus ketergantungan teknis Blogger; tidak mengubah hak penggunaan materi pihak ketiga.
