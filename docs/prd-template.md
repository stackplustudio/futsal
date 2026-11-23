# 📋 Template PRD — Stack Plus Studio

> **Status Template**: Active Master Blueprint · **Terakhir Diperbarui**: 22 November 2026  
> **Panduan Developer**: Duplikasi file ini menjadi `PRD.md` di root folder proyek baru. Isi tabel dan poin bernilai (*value-focused*), hindari paragraf panjang yang tidak teruji. Format di bawah sudah menyertakan contoh isian nyata (Modul LMS / Client Portal) agar kamu tinggal menyesuaikan.

---

# PRD — [Nama Proyek, Contoh: LMS Client Portal]

| Parameter | Data Proyek |
|---|---|
| **Klien / Partner** | PT Solusi Digital Indonesia |
| **Versi PRD** | v1.0 |
| **Status** | Disetujui (Approved) |
| **Lead Developer** | Budi Cahyono (Senior Architect) |
| **Junior / Implementer** | [Nama Developer] |
| **Target Tanggal Rilis** | 30 Desember 2026 |

---

## 1. Value & Tujuan Bisnis (Why & Value)

*Fokus pada nilai yang dihasilkan untuk klien, bukan penjelasan teknis rumit.*

* **Problem Statement**: Klien kesulitan mengelola pendaftaran kursus dan materi pelatihan secara manual melalui spreadsheet, yang memicu human-error dan kebocoran data.
* **Solusi**: Membangun portal web tersentralisasi dengan manajemen peran (Admin vs Siswa), verifikasi akses materi berbasis JWT, dan audit log pendaftaran.
* **Business Metric (Target Keberhasilan)**:
  * Waktu inisiasi pendaftaran berkurang dari 15 menit menjadi < 1 menit.
  * 100% data akun terlindungi dengan enkripsi kata sandi dan Role-Based Access Control.

---

## 2. Karakter Produk & Parameter UI (Sesuai `docs/ui.md`)

*Menetapkan bahasa desain dan parameter tampilan antarmuka sebelum slicing kode.*

| Parameter UI | Pilihan Proyek | Catatan / Alasan |
|---|---|---|
| **Karakter Produk** | LMS (Learning Management System) | Fokus pada kemudahan pemantauan progres belajar dan navigasi modul. |
| **Kepadatan Tampilan (Density)** | *Comfortable* (Default) | Pilihan: *Compact* (tabel ERP/POS), *Comfortable* (dashboard), *Spacious* (marketing/artikel). |
| **Lebar Kontainer Utama** | Wide (1280px) | Pilihan: Narrow (640px), Reading (768px), Standard (1024px), Wide (1280px), Fluid (100%). |
| **Target Perangkat Utama** | Desktop & Tablet | Prioritas alur kerja; tetap responsif hingga layar mobile (`sm: 640px`). |
| **Dukungan Dark Mode** | Tidak (Hanya Light Mode) | Default StackPlus adalah Light mode (`#FCFBF6`). Dark mode aktif hanya bila ada kesepakatan tertulis. |
| **Desain Token Wajib** | Font Inter, Spacing kelipatan 4px, Sizing kontrol 40px (Default), Radius 12px (Button), Toast via `react-hot-toast`. |

---

## 3. Matriks Pengguna & Hak Akses (RBAC)

*Matriks ini langsung menjadi acuan pembuatan `@Roles('ADMIN')`, guards backend, dan route groups frontend.*

| Peran (Role) | Deskripsi | Akses Route Frontend | Hak Akses Data Backend |
|---|---|---|---|
| **ADMIN** | Super user / Manajemen Klien | `/dashboard/*`, `/dashboard/users/*`, `/dashboard/courses/*` | Full CRUD seluruh entitas |
| **USER** | Siswa / Pengguna Reguler | `/dashboard`, `/dashboard/my-courses` | Read katalog publik & Update data profil milik sendiri (`assertSelfOrAdmin`) |
| **GUEST** | Pengunjung publik belum login | `/`, `/login` | Read-only landing page, POST login |

---

## 4. Ruang Lingkup (Scope Boundary)

### In-Scope (Wajib Dikerjakan)
1. **Autentikasi & Sesi**: Login email + password, dual token (Access Token JWT + Refresh Token HttpOnly).
2. **Manajemen Akun (CRUD User)**: Tambah, lihat, ubah, dan nonaktifkan user oleh Admin.
3. **Modul Utama [Contoh: Courses]**:
   - Admin: Buat modul materi, publish status, upload thumbnail.
   - User: Menjelajah daftar kursus, klaim kursus, lihat progres.
4. **Proteksi & Keamanan**: Enkripsi password bcrypt, Helmet HTTP headers, rate limit login 5 req/menit.

### Out-of-Scope (Fase Berikutnya / Tidak Dikerjakan Sekarang)
* Integrasi payment gateway otomatis (masih menggunakan verifikasi transfer manual).
* Fitur live streaming video interaktif.
* Aplikasi mobile native (iOS / Android).

---

## 5. Spesifikasi Fitur & Acceptance Criteria (BDD)

*Setiap fitur WAJIB memiliki kriteria penerimaan terukur dengan format **Given - When - Then**.*

### FR-001: Autentikasi Pengguna
* **Prioritas**: Must Have (P0)
* **Kriteria Pengujian (Acceptance Criteria)**:
  * **Skenario 1 (Sukses)**:
    * *Given* user memasukkan email `admin@stackplus.studio` dan password yang benar.
    * *When* tombol "Login" ditekan.
    * *Then* backend mengembalikan HTTP 200, menyetel cookie `refresh_token` (HttpOnly, Secure), mengembalikan `access_token`, dan frontend mengarahkan ke `/dashboard`.
  * **Skenario 2 (Gagal - Proteksi Brute Force)**:
    * *Given* IP penyerang mengirimkan request login salah > 5 kali dalam 1 menit.
    * *When* request ke-6 dikirimkan.
    * *Then* backend menolak dengan HTTP 429 Too Many Requests (`ThrottlerGuard`).

### FR-002: Manajemen User (CRUD)
* **Prioritas**: Must Have (P0)
* **Kriteria Pengujian**:
  * *Given* user login dengan role `USER`.
  * *When* mencoba mengakses endpoint `GET /users` atau `POST /users`.
  * *Then* sistem menolak dengan HTTP 403 Forbidden (`RolesGuard`).
  * *Given* user login dengan role `USER` dengan ID `usr_123`.
  * *When* mencoba mengubah data ID `usr_999` (`PATCH /users/usr_999`).
  * *Then* sistem menolak dengan HTTP 403 Forbidden (IDOR Prevention `assertSelfOrAdmin`).

### FR-003: [Nama Fitur Bisnis Baru, Contoh: Modul Kursus]
* **Prioritas**: Should Have (P1)
* **Kriteria Pengujian**:
  * *Given* Admin mengisi form nama kursus dan deskripsi.
  * *When* menekan simpan.
  * *Then* API menyimpan entitas di PostgreSQL via Prisma, menampilkan feedback toast hijau `"Kursus berhasil dibuat"`, dan data muncul di tabel frontend.

---

## 6. Kebijakan & Rancangan Database (`docs/database-standards.md`)

### 6.1 Keputusan Arsitektur Data
* **Konvensi Penamaan Tabel/Kolom**: Gunakan default Prisma (`PascalCase` model, `camelCase` field) **ATAU** `@map`/`@@map` ke `snake_case` jamak. *(Pilih salah satu, jangan campur)*.
* **Kebijakan Penghapusan (Deletion Policy)**:
  * Soft Delete (`deletedAt DateTime?`): Data transaksi, akun pengguna, invoice, data berelasi hukum.
  * Hard Delete: Token sementara, cache, draft sementara yang belum dipublish.
* **Isolasi Multi-Tenant**: *Single-Tenant* (satu database satu klien) ATAU *Multi-Tenant* (setiap tabel memiliki `tenantId` dengan filter ketat di setiap query).
* **Standar Nilai Uang & Waktu**: Nilai uang disimpan sebagai integer Rupiah bulat (`Int`/`BigInt`), bukan `Float`. Waktu disimpan sebagai `DateTime` UTC.

### 6.2 Prisma Schema Preview

*Rancangan model yang akan ditambahkan ke `packages/database/prisma/schema.prisma`.*

```prisma
// Contoh penambahan model untuk fitur baru
model Course {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String?
  price       Int      @default(0) // Rupiah bulat, dilarang Float
  isPublished Boolean  @default(false)
  authorId    String
  deletedAt   DateTime? // Soft delete bila diperlukan riwayat
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([authorId])
  @@index([slug])
}
```

---

## 7. Integrasi Pihak Ketiga & Environment Variables (`docs/env-and-secrets.md`)

*Daftar integrasi eksternal baru dan variabel environment tambahan yang dibutuhkan proyek.*

### 7.1 Layanan Pihak Ketiga (Third-Party Services)
| Layanan | Provider / Tools | Fungsi | Kredensial Disediakan Oleh |
|---|---|---|---|
| **File Storage** | Supabase Storage / Cloudinary | Menyimpan thumbnail modul kursus & avatar user | Akun Studio / Klien |
| **Email Transaksional** | Resend / SMTP | Notifikasi pendaftaran akun & reset password | Akun Klien |

### 7.2 Variabel Lingkungan Baru (Tambahkan ke `.env.example`)
| Variabel | Sifat | Deskripsi | Contoh Placeholder |
|---|---|---|---|
| `RESEND_API_KEY` | **Secret** | API Key pengiriman email transaksi | `re_123456789...` |
| `STORAGE_BUCKET_NAME` | Konfigurasi | Nama bucket penyimpanan media publik | `course-thumbnails` |
| `NEXT_PUBLIC_STORAGE_URL` | **Publik** | URL publik untuk CDN file gambar | `https://xyz.supabase.co/storage/v1/s/` |

---

## 8. Standar Non-Fungsional (NFR) & Target Infrastruktur

### 8.1 Target Kualitas (NFR)
* **Keamanan**: Bebas kerentanan IDOR, Mass-Assignment (`ValidationPipe` aktif), SQLi terlindungi Prisma, Helmet HTTP headers aktif, dan lolos audit Gitleaks + Trivy.
* **Testing Coverage**: Unit tests wajib mencapai minimal **> 70%** line coverage (`pnpm test:cov`). E2E test wajib lolos untuk skenario otorisasi dan endpoint ber-`:id`.
* **Performa API**: Respon API p95 < 300 ms pada pengujian beban k6 (`pnpm perf:smoke`). Paginasi wajib pada semua query multi-baris (`take: 20`, `max: 100`).
* **UI/UX**: Mengikuti token `docs/ui.md`, font Inter, umpan balik `react-hot-toast` (larangan keras `alert()`), status loading/skeleton, empty state, dan error state tersedia di setiap halaman data.

### 8.2 Target Infrastruktur Deployment (`docs/deployment.md`)
| Lapisan | Target Layanan | Konfigurasi Utama |
|---|---|---|
| **Frontend** | Vercel | Framework preset Next.js App Router, Root Dir `apps/web` |
| **Backend API** | Railway | Dockerfile `apps/api/Dockerfile`, Port via `PORT` |
| **Database** | Neon / Supabase PostgreSQL | `DATABASE_URL` (Pooled/Port 6543) & `DIRECT_URL` (Direct/Port 5432) |

---

## 9. Rencana Rilis & Milestone

*Setiap milestone harus diverifikasi dengan perintah validasi yang tepat sebelum melangkah ke tahap berikutnya.*

| Milestone | Deliverable | Estimasi | Check Validasi |
|---|---|---|---|
| **M1: Inisiasi & DB** | Schema Prisma + SQL migration files + seed data | Hari ke-2 | `pnpm --filter database exec prisma migrate dev --name init && pnpm db:generate` |
| **M2: Backend API** | Modul NestJS, DTO, guard RBAC, unit test | Hari ke-5 | `pnpm test:cov > 70%` & `pnpm --filter api test:e2e` |
| **M3: Frontend UI** | Halaman dashboard, Axios integration, toast, state handling | Hari ke-8 | `pnpm build && pnpm typecheck && pnpm lint` |
| **M4: QA & Staging** | Smoke test Playwright, security check, deploy ke staging | Hari ke-10 | CI GitHub Actions Green ✅ & UAT Sign-off |

---

## 10. Kriteria UAT, Serah-Terima, & Garansi

### 10.1 Kriteria Penerimaan UAT (`docs/uat-and-acceptance.md`)
* Pengujian UAT dijalankan pada **URL Staging / Preview** yang stabil (bukan database lokal).
* Skenario pengujian mengacu 100% pada **Bagian 5 (Acceptance Criteria BDD)** pada dokumen ini.
* Klien menandatangani atau menyetujui Berita Acara Penerimaan (tertulis via email/chat resmi) setelah seluruh acceptance criteria berstatus `[x] Lolos`.

### 10.2 Ketentuan Garansi & Dukungan (`docs/maintenance-and-support.md`)
* **Masa Garansi Bug**: 30 hari kalender terhitung sejak tanggal persetujuan UAT / serah-terima resmi.
* **Cakupan**: Perbaikan bug yang menyimpang dari spesifikasi PRD ini tanpa biaya tambahan.
* **Di Luar Garansi**: Penambahan fitur baru atau perubahan alur bisnis wajib diajukan melalui mekanisme *Change Request*.

---

## 11. Log Perubahan & Change Request (CR) (`docs/change-request.md`)

*Setiap perubahan scope, penambahan entitas, atau modifikasi alur bisnis di luar PRD awal WAJIB dicatat di bawah ini setelah disetujui klien secara tertulis.*

<!--
Format Catatan CR:
### CR-[Nomor]: [Judul Singkat]
* **Tanggal**: [dd-mm-yyyy]
* **Kebutuhan**: [Penjelasan 1-2 kalimat fitur atau perubahan yang diminta]
* **Dampak**: [Dampak skema database, penambahan API/UI, estimasi waktu +X hari kerja, biaya tambahan]
* **Status**: Disetujui Klien (WhatsApp/Email tanggal xx) / Ditolak
-->

*(Belum ada Change Request yang diajukan. Proyek berjalan sesuai scope v1.0)*
