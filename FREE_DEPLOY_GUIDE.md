# BankSoal Pro - Jalur Deploy Gratis

Tujuan: app bisa online dulu tanpa biaya bulanan. Beberapa layanan punya batas free tier dan bisa berubah sewaktu-waktu, jadi cek lagi sebelum launch.

## Rekomendasi Gratis

1. Hosting web: Render Free Web Service
   - Cocok untuk MVP.
   - Bisa sleep saat tidak aktif.
   - Gunakan `render.yaml` yang sudah disiapkan.

2. Database PostgreSQL: Neon Free atau Supabase Free
   - Neon Free: cocok untuk PostgreSQL serverless kecil.
   - Supabase Free: cocok kalau ingin dashboard database yang mudah.
   - Pilih salah satu saja, lalu isi `DATABASE_URL`.

3. Email token: Resend Free atau fallback outbox
   - Untuk production, pakai Resend agar email benar-benar terkirim.
   - Kalau belum punya domain/email sender, app tetap bisa berjalan, tapi token hanya tercatat di outbox lokal saat development.

4. AI generator: opsional
   - Kalau `OPENAI_API_KEY` kosong, app tetap jalan memakai generator template.
   - Kalau mau soal AI sungguhan, isi `OPENAI_API_KEY`.

5. Pembayaran
   - Gratis sepenuhnya: mode manual transfer DANA/GoPay, tetapi tidak bisa auto-detect pembayaran.
   - Agar tetap bisa dipakai tanpa gateway, gunakan admin panel `/admin.html` untuk menandai order lunas setelah kamu cek transfer.
   - Otomatis: pakai Midtrans/Xendit QRIS/GoPay webhook. Biasanya tanpa biaya bulanan, tetapi ada fee transaksi.

## Langkah Deploy Gratis di Render + Neon

1. Upload folder project ini ke GitHub.
2. Buat database gratis di Neon.
3. Salin connection string Neon ke `DATABASE_URL`.
4. Buat akun Render.
5. New Web Service dari repo GitHub.
6. Render akan membaca `render.yaml`.
7. Isi environment:
   - `DATABASE_URL`
   - `APP_URL`, contoh `https://banksoal-pro.onrender.com`
   - `ADMIN_SECRET`, isi secret panjang yang hanya kamu tahu
   - `EMAIL_FROM` jika sudah punya email sender
   - `RESEND_API_KEY` jika ingin email otomatis
8. Deploy.
9. Buka URL Render.

## Untuk Pembayaran Otomatis Nanti

Mode gratis manual tetap bisa jualan, tetapi admin harus cek transfer sendiri.

Untuk mode manual:

1. Pembeli buat order premium.
2. Pembeli transfer ke DANA/GoPay.
3. Kamu cek mutasi pembayaran.
4. Buka `https://domainmu.com/admin.html`.
5. Masukkan `ADMIN_SECRET` dan Order ID.
6. Klik `Tandai lunas`.
7. Sistem membuat token dan mengaktifkan premium.

Kalau ingin token otomatis setelah bayar:

1. Daftar Midtrans/Xendit.
2. Aktifkan QRIS/GoPay.
3. Isi environment payment gateway.
4. Pasang webhook ke:
   `https://domainmu.com/api/payment-webhook`
5. Tes sandbox lebih dulu.

## Batasan Free Tier

- Render free bisa sleep, sehingga website mungkin butuh beberapa detik untuk bangun.
- Neon/Supabase free punya batas storage dan compute.
- Email free punya batas pengiriman.
- Payment gateway punya fee transaksi.
- OpenAI API berbayar berdasarkan penggunaan; app tetap punya fallback gratis jika API key kosong.
