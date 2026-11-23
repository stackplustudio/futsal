# 🤝 Protokol Serah-Terima (Handover) — StackPlus Studio

> **Status**: Lean Handover Guide · **Terakhir Diperbarui**: 16 November 2026  
> **Target**: Panduan cepat bagi Junior Developer saat menerima atau melanjutkan pengerjaan proyek dari Senior/Lead Developer. Ringkas, fokus aksi, tanpa birokrasi berbelit.

---

## 1. Langkah 5 Menit Onboarding Kode (Quick Onboarding)

1. **Baca PRD**: Buka `PRD.md` di root repo untuk memahami fitur apa yang dibangun dan batasan hak aksesnya.
2. **Setup Lingkungan Lokal**:
   ```bash
   pnpm install
   cp .env.example .env
   pnpm db:generate
   pnpm --filter database exec prisma migrate dev
   pnpm --filter database prisma db seed
   ```
3. **Verifikasi Server Berjalan**:
   ```bash
   pnpm dev
   ```
   Akses `http://localhost:3000` (Frontend) dan `http://localhost:3001/health` (Backend API).
4. **Verifikasi Test Suite**:
   ```bash
   pnpm test:cov
   pnpm --filter api test:e2e
   ```
   Pastikan seluruh test lokal berstatus hijau (pass) sebelum kamu mulai menulis kode baru.

---

## 2. Aturan Kerja Harian (Rules of Engagement)

* **Branching**: Jangan pernah commit langsung ke `main`. Buat branch baru dari `main`:
  * `feat/<nama-fitur>` untuk fitur baru (contoh: `feat/course-catalog`).
  * `fix/<nama-bug>` untuk perbaikan bug (contoh: `fix/token-expired-toast`).
* **Sebelum Buka Pull Request (PR)**, jalankan 3 quality gate lokal:
  1. `pnpm typecheck` (0 error)
  2. `pnpm lint` (0 error)
  3. `pnpm test:cov` (cakupan kode > 70%)
* **Bila Menemui Kendala (Blocker)**: Hubungi Senior Lead (Budi Cahyono) dengan menyertakan:
  1. Apa yang sedang dicoba lakukan.
  2. Pesan error lengkap / screenshot terminal.
  3. Langkah yang sudah kamu coba untuk memperbaikinya.
