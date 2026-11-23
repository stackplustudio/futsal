# 🚀 Alur Rilis (Release Process) — StackPlus Studio

> **Status**: Lean Release Guide · **Terakhir Diperbarui**: 16 November 2026  
> **Sasaran**: Alur penerbitan kode dari komputer lokal hingga live di server produksi.

---

## 1. Alur Rilis Standar (Continuous Deployment)

Alur rilis di StackPlus Studio dirancang semi-otomatis menggunakan integrasi GitHub Actions + Vercel + Railway:

```text
Lokal (Testing & Lint) → Push PR → CI Quality Gate → Merge ke Main → Auto Deploy (Vercel & Railway) → DB Migrate
```

---

## 2. Checklist Rilis Langkah-demi-Langkah

### Tahap 1: Validasi di Komputer Developer
Jalankan perintah ini di root folder sebelum membuka Pull Request:
```bash
pnpm typecheck
pnpm lint
pnpm test:cov
pnpm build
```
Pastikan seluruh task selesai dengan status hijau (exit code 0).

### Tahap 2: Buka Pull Request ke `main`
* Berikan judul PR yang jelas (contoh: `feat: implementasi katalog kursus`).
* GitHub Actions otomatis menjalankan file `.github/workflows/ci.yml`. Tunggu hingga seluruh check lulus.

### Tahap 3: Merge & Penerapan Migrasi Database
1. Lakukan **Squash and Merge** ke branch `main`.
2. Vercel otomatis men-deploy frontend, dan Railway otomatis men-deploy backend.
3. Jika ada perubahan skema Prisma, jalankan migrasi database produksi:
   ```bash
   pnpm --filter @cahyodev/database exec prisma migrate deploy
   ```
4. Buka URL frontend dan backend `/health` untuk memastikan aplikasi live tanpa kendala.
