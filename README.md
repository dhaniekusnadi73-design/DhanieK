# BankSoal Pro

BankSoal Pro adalah web app generator soal SD, SMP, dan SMA dengan:

- pilihan jenjang, kelas, mata pelajaran, kurikulum, dan tingkat kesulitan
- soal pilihan ganda sampai 100 butir
- export Word
- akun login/register
- limit gratis 1x per tahun di server
- premium via order pembayaran
- token premium via email
- webhook payment gateway
- fallback generator gratis tanpa API AI
- siap deploy ke Netlify/Vercel/Render/Railway/VPS

## Jalur Gratis yang Direkomendasikan

- Hosting: Netlify Free
- Database: Neon Free atau Supabase Free
- Email: Resend Free, opsional
- AI: kosongkan `OPENAI_API_KEY` agar memakai generator template gratis
- Pembayaran: manual DANA/GoPay gratis, atau Midtrans/Xendit untuk auto webhook dengan fee transaksi

## Deploy Vercel

1. Login Vercel dengan GitHub.
2. Add New Project.
3. Pilih repo `DhanieK`.
4. Framework preset: Other.
5. Build command: kosongkan atau isi `npm install`.
6. Output directory: kosongkan.
7. Isi environment minimal:

```text
NODE_ENV=production
DATABASE_URL=postgresql://...
APP_URL=https://nama-project.vercel.app
ADMIN_SECRET=secret_panjang
PAYMENT_PROVIDER=manual
PAYMENT_RECEIVER_NAME=Dhanie Kusnadi
PAYMENT_RECEIVER_NUMBER=085271550657
```

## Jalankan Lokal

```bash
npm install
npm start
```

Buka:

```text
http://127.0.0.1:4173
```

Tanpa `DATABASE_URL`, app memakai file lokal di `payment-data/`.

## Deploy Netlify Free Tanpa Kartu

1. Upload project ke GitHub.
2. Buat database gratis di Neon atau Supabase.
3. Salin connection string PostgreSQL.
4. Login Netlify dengan GitHub.
5. Add new site -> Import an existing project.
6. Pilih repo `DhanieK`.
7. Netlify akan membaca `netlify.toml`.
8. Isi environment minimal:

```text
NODE_ENV=production
DATABASE_URL=postgresql://...
APP_URL=https://nama-site.netlify.app
ADMIN_SECRET=secret_panjang
PAYMENT_PROVIDER=manual
PAYMENT_RECEIVER_NAME=Dhanie Kusnadi
PAYMENT_RECEIVER_NUMBER=085271550657
```

## Deploy Render Free

1. Upload project ke GitHub.
2. Buat database gratis di Neon atau Supabase.
3. Salin connection string PostgreSQL.
4. Buat Web Service di Render dari repo GitHub.
5. Render akan membaca `render.yaml`.
6. Isi environment minimal:

```text
NODE_ENV=production
DATABASE_URL=postgresql://...
APP_URL=https://nama-app.onrender.com
PAYMENT_PROVIDER=manual
PAYMENT_RECEIVER_NAME=Dhanie Kusnadi
PAYMENT_RECEIVER_NUMBER=085271550657
```

Opsional untuk email otomatis:

```text
RESEND_API_KEY=...
EMAIL_FROM=BankSoal Pro <noreply@domainmu.com>
```

Opsional untuk AI sungguhan:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.4-mini
```

## Payment Webhook

Endpoint production:

```text
POST /api/payment-webhook
```

Untuk Midtrans/Xendit, arahkan webhook ke:

```text
https://domainmu.com/api/payment-webhook
```

## Catatan

Mode production otomatis mematikan endpoint simulasi pembayaran.

## Admin Manual Payment

Kalau belum memakai payment gateway, gunakan halaman admin:

```text
/admin.html
```

Isi `ADMIN_SECRET` di environment production. Setelah pembeli transfer DANA/GoPay, buka halaman admin, masukkan secret dan Order ID, lalu klik `Tandai lunas`. Sistem akan membuat token dan mengaktifkan premium untuk order tersebut.
