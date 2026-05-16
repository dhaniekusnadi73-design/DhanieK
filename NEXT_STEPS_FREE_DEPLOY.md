# Langkah Berikutnya: Deploy Gratis

Project ini sudah menjadi Git repo lokal dan sudah punya commit pertama.

## 1. Upload ke GitHub Gratis

Cara paling mudah tanpa GitHub CLI:

1. Buka https://github.com/new
2. Nama repo: `banksoal-pro`
3. Pilih `Private` dulu.
4. Klik `Create repository`.
5. Di halaman repo baru, pilih upload existing files atau ikuti perintah GitHub.

Jika memakai terminal Git, jalankan dari folder project:

```bash
git remote add origin https://github.com/USERNAME/banksoal-pro.git
git branch -M main
git push -u origin main
```

Ganti `USERNAME` dengan username GitHub kamu.

## 2. Buat Database Gratis di Neon

1. Buka https://neon.com
2. Sign up gratis.
3. Buat project PostgreSQL baru.
4. Copy connection string.
5. Simpan untuk environment `DATABASE_URL`.

## 3. Deploy Gratis di Render

1. Buka https://render.com
2. Sign up gratis.
3. New Web Service.
4. Connect repo `banksoal-pro`.
5. Render akan membaca `render.yaml`.
6. Isi environment:

```text
DATABASE_URL=connection_string_dari_neon
APP_URL=https://nama-app.onrender.com
PAYMENT_PROVIDER=manual
ADMIN_SECRET=buat_secret_panjang_yang_sulit_ditebak
PAYMENT_RECEIVER_NAME=Dhanie Kusnadi
PAYMENT_RECEIVER_NUMBER=085271550657
```

Opsional:

```text
RESEND_API_KEY=isi_jika_pakai_email_otomatis
EMAIL_FROM=BankSoal Pro <noreply@domainmu.com>
OPENAI_API_KEY=isi_jika_mau_AI_sungguhan
```

## 4. Setelah Online

1. Tes register akun.
2. Tes generate soal gratis.
3. Tes order premium manual.
4. Buka `/admin.html` untuk konfirmasi order manual.
5. Cek database Neon apakah tabel otomatis dibuat.
6. Share link Render ke media sosial sebagai demo/early access.

## Catatan

- Tanpa payment gateway, pembayaran DANA/GoPay manual tidak bisa auto-detect.
- Tanpa `OPENAI_API_KEY`, generator tetap jalan memakai template gratis.
- Tanpa `RESEND_API_KEY`, email production belum benar-benar terkirim.
