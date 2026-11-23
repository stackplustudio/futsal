# 👁️ Observability & Monitoring — StackPlus Studio

> **Status**: Practical Observability Guide · **Terakhir Diperbarui**: 16 November 2026  
> **Sasaran**: Panduan pemantauan kesehatan aplikasi, logging, dan deteksi error secara nyata.

---

## 1. Alat Pemantauan yang Tersedia Saat Ini

Pada skala tim kecil dan arsitektur Core saat ini, pemantauan bertumpu pada 3 instrumen bawaan tanpa overhead infrastruktur tambahan:

| Instrumen | Fungsi | Cara Akses |
|---|---|---|
| **Health Check Probe** | Menguji status hidup backend & koneksi database | `GET /health` di `apps/api/src/health/health.controller.ts` |
| **Railway Logs (API)** | Menangkap log NestJS, stack trace error 500, dan SQL exception | Buka dashboard Railway → Tab *Deployments* → *View Logs* |
| **Vercel Runtime Logs (Web)** | Memantau request frontend, client redirect, dan Next.js build errors | Buka dashboard Vercel → Tab *Logs* |

---

## 2. Struktur Endpoint `/health`

Endpoint `GET /health` menyediakan status kesiapan server (readiness probe):
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```
Jika status database `"down"`, endpoint akan mengembalikan HTTP 503 Service Unavailable, sehingga sistem load balancer / Docker auto-restart dapat mendeteksi kegagalan secara langsung.

---

## 3. Rekomendasi Saat Proyek Naik Skala (Production Scale-Up)

Jika proyek klien mencapai > 1.000 pengguna aktif harian:
1. **Uptime Monitoring**: Pasang monitor gratis (seperti BetterStack atau UptimeRobot) yang mengarah ke `https://<api>/health` setiap 5 menit dengan notifikasi ke Telegram/WhatsApp.
2. **Error Tracking**: Tambahkan Sentry SDK (`@sentry/nextjs` dan `@sentry/nestjs`) untuk menangkap error runtime di browser pengguna secara real-time.
