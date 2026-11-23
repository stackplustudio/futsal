# 🚨 Incident Response Runbook — StackPlus Studio

> **Status**: Practical Incident Runbook · **Terakhir Diperbarui**: 16 November 2026  
> **Sasaran**: Panduan darurat cepat ketika backend atau frontend down di lingkungan produksi.

---

## 1. Klasifikasi Masalah

* **P0 (Layanan Lumpuh)**: Web tidak bisa dibuka sama sekali, API returning HTTP 500 di semua endpoint, atau database crash.
* **P1 (Fitur Kritis Rusak)**: Login gagal untuk semua user, transaksi tidak bisa disimpan, atau CORS memblokir frontend.
* **P2 (Isu Minor)**: Tampilan visual glitch, salah teks, atau error pada fitur non-esensial.

---

## 2. Alur Penanganan Cepat 4 Langkah

```text
1. Cek Status (/health) → 2. Periksa Runtime Logs → 3. Rollback / Mitigasi → 4. Post-Mortem Ringkas
```

### Langkah 1: Cek Health Probe
Buka di browser: `https://<api-kamu>.railway.app/health`
* Jika **HTTP 200 OK**: API hidup; periksa apakah masalah ada di DNS Vercel atau CORS.
* Jika **Timeout / 502 / 500**: Masalah ada di container API atau koneksi Database.

### Langkah 2: Periksa Runtime Logs
* **Backend (Railway)**: Buka dashboard Railway → Klik service `api` → Buka tab **Deployments** → **View Logs**. Cari pesan error yang diawali `Error: [AppModule]` atau `PrismaClientInitializationError`.
* **Frontend (Vercel)**: Buka dashboard Vercel → Tab **Logs** → Filter berdasarkan status `500`.

### Langkah 3: Rollback Instan (Golden Rule)
Jangan mencoba debugging rumit langsung di server produksi jika sistem sedang down total:
1. Buka dashboard Vercel / Railway.
2. Temukan deployment stabil sebelumnya (yang berwarna hijau).
3. Klik **Redeploy / Rollback**. Layanan kembali normal dalam < 1 menit.
4. Lakukan investigasi dan perbaikan bug di komputer lokal pada branch terpisah.

---

## 3. Penyebab Umum & Solusi Cepat

| Gejala Error | Kemungkinan Penyebab | Tindakan Cepat |
|---|---|---|
| `P1001: Can't reach database server` | Neon / Supabase suspend atau connection limit habis. | Cek status dashboard database; pastikan URL menggunakan pooler (`DATABASE_URL`). |
| `Missing required environment variables` | Env var baru belum ditambahkan di Railway dashboard. | Masukkan variabel yang hilang di tab *Variables* Railway lalu trigger redeploy. |
| `CORS Error: No Access-Control-Allow-Origin` | `FRONTEND_URL` di backend belum mencantumkan domain frontend baru. | Sesuaikan `FRONTEND_URL` di Railway dengan domain Vercel klien (tanpa trailing slash `/`). |
