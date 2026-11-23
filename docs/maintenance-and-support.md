# 🛠️ Maintenance & Support Guide — StackPlus Studio

> **Status**: Lean Support Guide · **Terakhir Diperbarui**: 16 November 2026  
> **Sasaran**: Panduan pemeliharaan rutin pasca-rilis untuk pengembang StackPlus Studio.

---

## 1. Garansi Bug Pasca-Peluncuran

* **Masa Garansi Standar**: 30 hari kalender setelah serah-terima final.
* **Cakupan Garansi**: Seluruh error/kegagalan fungsi yang menyimpang dari kriteria penerimaan di `PRD.md`.
* **Di Luar Garansi**:
  * Penambahan fitur baru di luar PRD (ditangani via `docs/change-request.md`).
  * Perubahan kredensial sepihak oleh klien pada layanan pihak ketiga.

---

## 2. Checklist Pemeliharaan Berkala (Bulanan)

1. **Audit Ketergantungan Paket (Dependencies)**:
   ```bash
   pnpm audit --prod --audit-level=high
   ```
   Perbarui paket yang memiliki celah keamanan kritis/tinggi.
2. **Pembersihan Log & Penyimpanan Database**:
   * Periksa penggunaan kapasitas storage di dashboard Neon/Supabase.
   * Pastikan auto-backup harian aktif.
3. **Pemeriksaan Health API**:
   * Pantau waktu respons endpoint `GET /health` agar tetap di bawah 200 ms.
