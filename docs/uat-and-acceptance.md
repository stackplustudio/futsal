# 🧪 Protokol UAT & Penerimaan — StackPlus Studio

> **Status**: Lean UAT Guide · **Terakhir Diperbarui**: 16 November 2026  
> **Sasaran**: Panduan pengujian langsung oleh klien sebelum peluncuran resmi.

---

## 1. Prinsip UAT

* **Dasar Pengujian**: UAT berpatokan mutlak pada **Acceptance Criteria** di `PRD.md`.
* **Lingkungan Pengujian**: Klien melakukan uji coba pada URL Staging / Preview (bukan database lokal).
* **Fokus UAT**: Alur bisnis nyata (bisa login, bisa input data, data tersimpan dengan benar, feedback toast muncul).

---

## 2. Formulir Checklist Pengujian Klien

Klien atau QA dapat mengisi tabel sederhana berikut selama sesi UAT:

| ID Fitur | Skenario yang Diuji | Hasil yang Diharapkan | Status | Catatan Temuan |
|---|---|---|:--:|---|
| **FR-001** | Login dengan akun valid | Berhasil masuk ke dashboard | [x] Lolos | - |
| **FR-001** | Login dengan password salah 5x | Muncul proteksi rate-limit | [x] Lolos | - |
| **FR-002** | Tambah data baru via form | Data tersimpan & toast sukses muncul | [x] Lolos | - |
| **FR-003** | User biasa coba ubah akun lain | Ditolak dengan pesan 403 Forbidden | [x] Lolos | - |

---

## 3. Penutupan UAT & Tanda Terima

Setelah semua skenario bernilai `[x] Lolos`, klien memberikan konfirmasi persetujuan penerimaan secara tertulis (cukup melalui pesan email atau konfirmasi chat resmi tim).
