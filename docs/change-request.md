# 🔄 Change Request (CR) Protocol — StackPlus Studio

> **Status**: Lean Protocol · **Terakhir Diperbarui**: 16 November 2026  
> **Tujuan**: Mencegah scope creep pada proyek klien kecil/menengah tanpa birokrasi berlebih.

---

## 1. Kapan Menggunakan CR?

| Kategori | Definisi | Penanganan |
|---|---|---|
| **Bug** | Kode tidak bekerja sesuai kriteria penerimaan di `PRD.md`. | Langsung perbaiki tanpa biaya tambahan (Garansi). |
| **Klarifikasi** | Desain atau teks kurang jelas, tapi fungsionalitas sama. | Diselaraskan dalam hitungan jam kerja. |
| **Change Request (CR)** | Menambah fitur baru, mengubah alur bisnis, atau menambah entitas database di luar `PRD.md`. | **Wajib dicatat & disetujui tertulis** sebelum dikerjakan. |

---

## 2. Alur Praktis 3 Langkah

1. **Catat Permintaan Klien**: Tulis ringkasan fitur baru dan alasan bisnisnya.
2. **Hitung Dampak (Estimasi Lead Developer)**:
   - Dampak schema database (perlu migrasi atau tidak).
   - Dampak waktu pengerjaan (+ berapa hari).
   - Tambahan biaya (jika ada).
3. **Persetujuan Tertulis**: Klien setujui via email / WhatsApp resmi. Setelah disetujui, update `PRD.md` dan mulai coding di branch `feat/cr-[nama]`.

---

## 3. Format Catatan CR Cepat (Salin ke PRD.md)

```markdown
### CR-[Nomor]: [Judul Singkat]
* **Tanggal**: [dd-mm-yyyy]
* **Kebutuhan**: [Penjelasan 1-2 kalimat]
* **Dampak**: Tambah 1 tabel database, estimasi +2 hari kerja.
* **Status**: Disetujui Klien (WhatsApp tanggal xx) / Ditolak.
```
