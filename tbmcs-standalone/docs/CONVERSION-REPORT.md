# Catatan konversi dan pengujian — 6 November 2026

## Sumber dan perubahan

Sumber: `HTML WEBSITE BLOGSPOT TBM-Cs.xml` yang dilampirkan pengguna. Template dibaca sebagai XML; elemen Blogger dinamis dipisahkan dari elemen tampilan. File sumber asli tidak diubah.

Dipertahankan: identitas hijau/marun, foto dan logo tertanam, beranda, enam bidang, liputan eksternal, 13 alat sewa, satuan/tarif, kontak dan QR SOP, halaman kolaborasi, unduhan PNG logo, mode gelap, menu responsif, dialog pencarian, dan informasi donasi.

Diganti: tag `b:`, `data:`, `expr:`, widget posting/label/arsip, tautan halaman Blogger, pencarian/feed Blogger, dan navigasi dinamis Blogger. Data konten sekarang JSON; navigasi lokal menggunakan hash URL; artikel terkait berasal dari konten lokal. Tidak ada JavaScript eksternal atau request ke Google yang dibutuhkan HTML publik bawaan. Tautan YouTube tetap dipertahankan sebagai tautan sosial opsional.

Ditambahkan: editor lokal HTML, ekspor JSON, ekspor website HTML, filter pencarian, status draft/published, validasi konten, skema Decap, build Python, serta CI pemeriksaan tanpa deployment.

## Hasil pengujian

| Pemeriksaan | Hasil |
| --- | --- |
| Build Python tanpa dependency | Lulus |
| 9 tes Python: skema, draft, escaping, slug ganda, URL berbahaya, path upload, tarif negatif, dependency Blogger, rute | Lulus |
| Handler ekspor HTML diuji di Node: dokumen valid, hanya konten publik, escaping, placeholder | Lulus |
| Sintaks JavaScript website, editor, dan pintu CMS | Lulus |
| Desktop sekitar 1363 px, mobile iframe 390 px, tablet iframe 768 px | Diperiksa visual; tidak ada overflow horizontal pada dokumen mobile/tablet |
| Menu mobile dan navigasi kolaborasi | Lulus |
| Pencarian kata kunci dan filter bidang | Lulus dengan fixture lokal satu artikel publik dan satu draft |
| Halaman artikel dan subjudul | Lulus; fixture tidak masuk paket |
| Dashboard: buat/simpan/hapus draft lokal | Lulus; data uji dibersihkan |
| Tombol unduh HTML | Browser menampilkan permintaan unduhan; penangkapan event file oleh browser pengujian timeout. Isi hasil ekspor diverifikasi lewat tes handler Node. |
| Form sewa | 13 opsi alat, satuan Mitela 3 pcs, dan minimum tanggal WITA diperiksa; pesan tidak dikirim ke WhatsApp |
| Unduhan logo | PNG transparan berhasil disiapkan, tautan blob tersedia |
| Donasi kedaluwarsa | Status selesai muncul; laporan belum ditautkan |
| Login/publikasi CMS online | Belum diuji; repository/OAuth organisasi belum dikonfigurasi |
| Deployment/domain | Belum dilakukan |

## Keterbatasan yang diketahui

- Tema tidak mengandung isi postingan dan halaman lama. Konten kosong tidak diganti dengan tulisan fiktif.
- Editor lokal tidak menyinkron antarperangkat atau menulis langsung ke server. Gunakan ekspor atau aktifkan CMS setelah konfigurasi siap.
- Halaman buku/pedoman/struktur/kegiatan menunggu konten dan dokumen organisasi.
- Katalog, formulir pilihan alat, dan contoh tarif beranda menggunakan sumber JSON yang sama.
- Tautan media dan QR dipertahankan dari sumber; tujuan eksternalnya belum diverifikasi ulang.
- Ukuran HTML sengaja mencakup aset gambar agar dapat dipindahkan sebagai satu file. Belum dilakukan pengukuran Core Web Vitals lapangan atau Lighthouse produksi.
- URL artikel menggunakan hash untuk portabilitas; metadata SEO unik per URL HTML memerlukan tahap lanjutan.
- Konten draft tidak disertakan dalam HTML publik maupun seed editor yang dihasilkan, tetapi tetap ada pada sumber JSON. Repository publik bukan penyimpanan draft rahasia.
