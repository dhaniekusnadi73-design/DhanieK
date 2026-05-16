# BankSoal Pro - Production Checklist

Status saat ini: siap dijadikan web app Node production. Sudah ada UI, register/login, session cookie, storage adapter PostgreSQL/file JSON, API order, webhook pembayaran, token premium, outbox email lokal, integrasi Resend, endpoint generate server-side, Dockerfile, Procfile, dan `package.json`.

## Yang Harus Disiapkan

1. Hosting
   - Pilihan mudah: Railway, Render, Fly.io, VPS, atau Vercel/Netlify plus backend terpisah.
   - Butuh domain dan HTTPS.
   - Build command: `npm install`
   - Start command: `npm start`

2. Database
   - Gunakan PostgreSQL via Supabase, Neon, Railway, atau VPS.
   - Isi `DATABASE_URL`.
   - Saat server start, `schema.sql` dijalankan otomatis untuk membuat tabel jika belum ada.
   - Jika `DATABASE_URL` kosong, server memakai `payment-data/*.json` untuk development lokal.

3. Payment Gateway
   - Gunakan Midtrans atau Xendit agar QRIS/GoPay bisa auto-update lewat webhook.
   - Endpoint yang sudah disiapkan: `POST /api/payment-webhook`.
   - Jangan memakai tombol simulasi di production; server sudah memblokir `/api/dev/mark-paid` saat `NODE_ENV=production`.
   - Midtrans: arahkan payment notification URL ke `https://domainmu.com/api/payment-webhook`.
   - Xendit: arahkan webhook invoice/QRIS ke `https://domainmu.com/api/payment-webhook` dan isi `XENDIT_CALLBACK_TOKEN`.
   - Jalur gratis tanpa gateway: gunakan `/admin.html` dan `ADMIN_SECRET` untuk konfirmasi manual setelah cek transfer.
   - Jalur otomatis Midtrans: isi `PAYMENT_PROVIDER=midtrans`, `PAYMENT_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`, dan `APP_URL`.

4. Email Otomatis
   - Gunakan Resend, SMTP, Mailgun, atau SendGrid.
   - Resend sudah didukung melalui `RESEND_API_KEY` dan `EMAIL_FROM`.
   - Tanpa `RESEND_API_KEY`, email dicatat sebagai outbox lokal untuk development.

5. Login Pengguna
   - Register/login dasar sudah tersedia.
   - Untuk production lanjut, tambahkan reset password dan verifikasi email.
   - Limit gratis/premium harus berdasarkan user ID di server, bukan `localStorage`.

6. Limit Pemakaian Server
   - Sudah dicatat di tabel/file `generations`.
   - Gratis: maksimal 1 generate per user/anon per tahun.
   - Premium: unlimited.

7. Generator Soal AI
   - Endpoint `/api/generate` sudah mendukung OpenAI Responses API dengan Structured Outputs.
   - Isi `OPENAI_API_KEY` dan `OPENAI_MODEL`.
   - Simpan kurikulum, CP, KD, topik, dan rubrik soal sebagai data referensi.
   - Validasi jumlah soal, opsi A-D, kunci, pembahasan, dan tingkat kesulitan sebelum export Word.

8. Deploy Production
   - Isi `.env` dari `.env.example`.
   - Set `NODE_ENV=production`.
   - Jalankan migrasi database.
   - Pasang webhook payment gateway ke `https://domainmu.com/api/payment-webhook`.
   - Tes sandbox payment, email, login, limit, dan export Word.

## Rekomendasi Provider

- Payment Indonesia: Midtrans atau Xendit karena mendukung QRIS/GoPay dan webhook.
- Database: Supabase atau Neon PostgreSQL.
- Email: Resend untuk setup cepat, SMTP/Mailgun untuk alternatif.
- Hosting: Railway/Render untuk backend Node sederhana, VPS jika ingin kontrol penuh.

## Jalur Gratis

Lihat [FREE_DEPLOY_GUIDE.md](FREE_DEPLOY_GUIDE.md) untuk jalur Render Free + Neon/Supabase Free. Jalur ini cukup untuk demo publik dan early access, tetapi payment gateway otomatis tetap bisa memiliki fee transaksi.

## Deploy Cepat Railway

1. Push folder ini ke GitHub.
2. Buat project baru di Railway dari repo GitHub.
3. Tambahkan PostgreSQL plugin.
4. Isi environment dari `.env.example`.
5. Set `NODE_ENV=production`.
6. Deploy.
7. Buka domain Railway, lalu pasang custom domain jika ada.
8. Masukkan URL webhook payment gateway: `https://domainmu.com/api/payment-webhook`.

## Deploy Cepat Render

1. Push folder ini ke GitHub.
2. Buat Web Service baru dari repo.
3. Runtime: Node.
4. Build command: `npm install`.
5. Start command: `npm start`.
6. Buat PostgreSQL di Render atau Neon/Supabase.
7. Isi environment dari `.env.example`.
8. Deploy dan pasang webhook payment gateway.

## Catatan Keamanan

- Jangan menyimpan token premium hanya di frontend.
- Jangan aktifkan endpoint simulasi pembayaran di production.
- Verifikasi signature webhook dari payment gateway.
- Buat token premium sekali pakai atau kaitkan langsung ke user.
- Jangan commit file `.env` ke publik.
