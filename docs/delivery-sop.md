# 📦 SOP Serah-Terima Proyek (Delivery) — StackPlus Studio

> **Status**: Lean Delivery SOP · **Terakhir Diperbarui**: 16 November 2026  
> **Sasaran**: Panduan ringkas saat proyek klien dinyatakan selesai dan siap diserahkan.

---

## 1. Checklist Kesiapan Teknis (Pre-Delivery Gate)

Sebelum link aplikasi diberikan kepada klien, pastikan semua poin berikut tercentang hijau di lokal:

- [ ] `pnpm typecheck` lolos tanpa error (0 error).
- [ ] `pnpm lint` bersih.
- [ ] `pnpm test:cov` mencapai cakupan > 70%.
- [ ] `pnpm build` sukses untuk web maupun api.
- [ ] Seluruh migrasi database diterapkan ke DB produksi (`pnpm --filter @cahyodev/database exec prisma migrate deploy`).
- [ ] Akun dummy / data uji coba yang tidak relevan sudah dibersihkan dari database produksi.

---

## 2. Kredensial & Akses yang Diserahkan ke Klien

Simpan dalam catatan aman (misal 1Password / Bitwarden / dokumen terenkripsi) dan serahkan ke perwakilan klien:

1. **Akun Super Admin**:
   * Email Admin: `admin@[domain-klien].com`
   * Password sementara (wajib diubah pada login pertama).
2. **Dashboard Deployment**:
   * Akses Vercel (Frontend domain management).
   * Akses Railway (Backend service & server metrics).
   * Akses Database (Neon / Supabase console).
3. **Dokumen PRD & Manual Penggunaan Ringkas**:
   * Tautkan file `PRD.md` versi final yang disepakati bersama.
