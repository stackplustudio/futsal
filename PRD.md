# 📋 Product Requirements Document (PRD) — StackPlus Futsal & Mini Soccer SaaS

> **Status Dokumen**: Active Master Blueprint · **Versi**: v1.0 · **Terakhir Diperbarui**: 22 November 2026
> **Referensi Standar**: `docs/prd-template.md`, `docs/ui.md` (UI System V3), `docs/database-standards.md`, `docs/security-rules.md`, `docs/coding-standards.md`
> **Konteks**: Blueprint pengembangan dari nol untuk produk SaaS manajemen venue, reservasi lapangan, kasir kantin (POS), sistem langganan member, dan komunitas sparring pada industri olahraga futsal & mini soccer di Indonesia.

---

# PRD — StackPlus Futsal: Smart Court Booking, Venue POS & Matchmaking SaaS

| Parameter                    | Data Proyek                                                    |
| ---------------------------- | -------------------------------------------------------------- |
| **Produk**             | StackPlus Futsal (SaaS Multi-Venue & Court Management)         |
| **Pemilik Produk**     | StackPlus Studio (Product Studio Initiative)                   |
| **Versi PRD**          | v1.0                                                           |
| **Status**             | Disetujui untuk Pengerjaan (Approved)                          |
| **Lead Architect**     | Budi Cahyono (Senior Architect & Founder)                      |
| **Engineering Team**   | Core Engine Fullstack Team                                     |
| **Target Demo Publik** | `futsal.stackplustudio.com` (Showroom Portofolio & B2B SaaS) |

---

## 1. Value & Tujuan Bisnis (Why & Value)

### 1.1 Problem Statement

1. **Inefisiensi Booking Manual & Tabrakan Jam Sewa (Double Booking):** Mayoritas pengelola lapangan futsal & mini soccer masih mengandalkan chat WhatsApp dan buku catatan fisik. Di jam sibuk (*prime-time* malam hari), sering terjadi bentrok dua tim mengklaim lapangan yang sama, memicu keributan dan kerugian reputasi.
2. **Kerugian Finansial Akibat Tim *Ghosting* / No-Show:** Tarif sewa lapangan futsal berkisar Rp 150.000–Rp 400.000/jam, dan mini soccer berkisar Rp 600.000–Rp 1.500.000/jam. Jika tim yang memesan via WhatsApp membatalkan sepihak di hari-H tanpa uang muka (*down payment*), pengelola kehilangan potensi pendapatan penuh pada jam emas tersebut.
3. **Pengelolaan Member Rutin (Seasonal/Monthly Slots) yang Rumit:** Komunitas sering menyewa jadwal rutin mingguan (misal: setiap Kamis jam 20:00–22:00 selama sebulan). Tanpa pengingat jatuh tempo perpanjangan (*renewal lock*), slot member sering terambil oleh penanya umum di WhatsApp.
4. **Pemisahan Billing Sewa Lapangan dan Kantin/Sewa Alat:** Venue olahraga selalu memiliki kantin (air mineral botol, minuman isotonik, mie instan) dan persewaan peralatan (sewa rompi tim, sepatu, sarung tangan kiper). Kasir kerepotan menggabungkan tagihan sewa lapangan dengan pesanan minuman pemain.
5. **Kesulitan Komunitas Mencari Lawan Sparring:** Tim futsal yang sudah memesan lapangan seringkali kesulitan mencari lawan tanding sepadan (*sparring partner*) atau kekurangan pemain cadangan.

### 1.2 Solusi Produk

StackPlus Futsal menghadirkan ekosistem **All-in-One Cloud Management & Booking** berbasis web yang menggabungkan:

* **Halaman Reservasi Publik 90-Detik (Mobile-First):** Pemain dapat mengecek jadwal lapangan kosong secara *real-time*, memilih jenis rumput/lapangan, dan melakukan booking instan tanpa perlu menunggu balasan chat admin.
* **Smart Dynamic Pricing Engine:** Pengaturan tarif otomatis berdasarkan hari (Weekday vs Weekend) dan blok jam operasional (Siang hemat, Sore normal, Malam *Prime-Time*).
* **Anti No-Show Payment Gateway (Midtrans QRIS / Virtual Account):** Wajib DP (misal 50% atau Rp 100.000) untuk mengunci jadwal pemesanan, dengan batas bayar *countdown* 15 menit.
* **Manajemen Member & Langganan Komunitas (Recurring Slot Management):** Mengunci jadwal rutin mingguan untuk tim langganan dengan tagihan bulanan otomatis dan perlindungan slot prioritas.
* **Kasir Futsal Terintegrasi (Court & Canteen POS):** Kasir resepsionis dapat menambahkan minuman botol, sewa rompi, dan pelunasan sewa lapangan dalam satu invoice struk thermal.
* **Papan Cari Lawan Sparring (Matchmaking & Open Player Board):** Fitur komunitas terintegrasi tempat tim yang sudah booking dapat membuka status *"Mencari Lawan Sparring"* atau *"Cari 2 Pemain Tambahan"*.

### 1.3 Business Metric (Target Keberhasilan Produk)

* **Kecepatan Reservasi Lapangan:** Pemain dapat menyelesaikan booking dan pembayaran DP dalam waktu < 2 menit.
* **Pencegahan No-Show:** Menurunkan tingkat no-show hingga < 5% melalui sistem DP instan dan reminder WhatsApp.
* **Efisiensi Pendapatan Venue (Occupancy Rate):** Meningkatkan utilisasi lapangan di jam sepi (pagi-siang) sebesar $\ge 25\%$ melalui promo jam hemat.
* **Kecepatan Kasir:** Penggabungan pelunasan lapangan dan 5 pesanan minuman kantin selesai di kasir dalam < 30 detik.
* **Target Adopsi SaaS:** 25 Venue Futsal/Mini Soccer aktif (total $\ge 75$ lapangan) dalam 6 bulan pertama peluncuran komersial.

---

## 2. Karakter Produk & Parameter UI (Sesuai `docs/ui.md`)

*Sesuai panduan UI System V3, StackPlus Futsal menggabungkan dua karakteristik UI: **Booking Publik (Mobile-First, Sporty, Clean)** dan **Resepsionis / Kasir POS (Comfortable, Grid Visual Lapangan, Cepat Dipindai)**.*

| Parameter UI                  | Portal Publik Pemain (Customer)                                                                             | Resepsionis & Dashboard Venue (Admin)                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Karakter UI**         | Sporty, energik, kontras tinggi, visual lapangan jelas                                                      | Terstruktur, matriks visual jadwal lapangan, task-oriented         |
| **Target Perangkat**    | **Mobile-First** (Ponsel pemain 375px–430px)                                                         | **Tablet & Desktop** (iPad Kasir Resepsionis & Laptop Owner) |
| **Kepadatan (Density)** | *Comfortable* (Kartu jam besar, mudah disentuh jari)                                                      | *Compact* (Matriks jadwal per jam 36–40px, tombol aksi cepat)   |
| **Lebar Kontainer**     | Narrow (640px) pada alur booking ponsel                                                                     | Wide (1280px) & Extra-Wide (1440px / Fluid pada matriks jadwal)    |
| **Touch Target**        | **Minimal 44×44px** untuk tombol blok jam                                                            | Minimal 40px pada tombol kasir POS                                 |
| **Palet Warna Utama**   | `#0053F1` (Aksen Brand), `#15803D` (Indikator Lapangan Tersedia), `#DC2626` (Terisi)                  |                                                                    |
| **Desain Token Wajib**  | Font Inter, Surface `#FDFBF7`, border `brand-line`, feedback `react-hot-toast`. Dilarang `alert()`. |                                                                    |

---

## 3. Matriks Pengguna & Hak Akses (RBAC)

*Pemisahan peran berjenjang terlindungi ketat melalui `RolesGuard` NestJS dan pembatasan isolasi `tenantId` serta `venueId`.*

| Peran (Role)            | Deskripsi                      | Akses Route Frontend                         | Hak Akses Data Backend                                                                            |
| ----------------------- | ------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **SUPER_ADMIN**   | Tim Platform StackPlus         | `/superadmin/*`                            | Manajemen lisensi SaaS, monitoring transaksi global, health check server.                         |
| **VENUE_OWNER**   | Pemilik Bisnis Venue Futsal    | `/dashboard/*` (Semua Venue)               | Akses penuh: kelola cabang venue, tambah lapangan, atur skema tarif dinamis, laporan laba rugi.   |
| **VENUE_MANAGER** | Manajer Operasional Lapangan   | `/dashboard/venue/*` (Venue Tertentu)      | Pengaturan jadwal operasional, persetujuan member rutin, kelola stok kantin, audit kasir harian.  |
| **CASHIER**       | Kasir Resepsionis / Staff Jaga | `/pos/*`, `/schedule/*`                  | Input booking manual walk-in, operasionalkan kasir kantin & sewa alat, check-in tim, cetak struk. |
| **PLAYER**        | Pemain / Kapten Tim Publik     | `/book/:venueSlug`, `/portal/my-matches` | Booking online, bayar DP/lunas, ajukan sparring, lihat riwayat jadwal tanding.                    |

---

## 4. Ruang Lingkup Produk (Scope Boundary)

### In-Scope (Fitur Unggulan v1.0)

1. **Multi-Venue & Multi-Lapangan (Multi-Court Management):**
   - 1 Akun Tenant dapat memiliki beberapa lokasi venue dan banyak jenis lapangan (Vinyl, Rumput Sintetis, Interlock, Mini Soccer Outdoor).
   - Profil lapangan: dimensi ukuran, foto, jenis rumput/lantai, fasilitas (tribun, kamar bilas air panas, musholla, parkir bus).
2. **Dynamic Pricing & Time-Slot Matrix Engine:**
   - Pembagian slot sewa lapangan per 60 menit dengan jeda pergantian tim (*transition buffer* 0–5 menit).
   - Pengaturan tarif dinamis fleksibel:
     - *Siang (07:00–15:00)*: Rp 150.000/jam
     - *Sore (15:00–18:00)*: Rp 200.000/jam
     - *Prime-Time Malam (18:00–24:00)*: Rp 300.000/jam
     - Pembedaan tarif Hari Kerja (*Weekdays*) vs Akhir Pekan (*Weekends / Tanggal Merah*).
3. **Pemesanan Lapangan Publik & Otomasi DP (Anti No-Show):**
   - Halaman booking publik instan via link / QR code (tanpa wajib install aplikasi).
   - Pembayaran uang muka (DP minimal 50% atau flat) via Midtrans (QRIS, GoPay, ShopeePay, Virtual Account BCA/Mandiri/BRI).
   - Fitur *Slot Hold Lock* selama 15 menit saat proses bayar untuk mencegah rebutan jam sewa antar pengguna.
   - Otomasi pengingat jadwal H-4 jam via WhatsApp Gateway.
4. **Manajemen Member & Komunitas Rutin (Recurring Booking):**
   - Penguncian slot mingguan otomatis selama 1 s.d. 6 bulan (misal: Komunitas Futsal ABC setiap Selasa jam 20:00–22:00).
   - Tagihan invoice member bulanan dengan pengingat jatuh tempo H-3 sebelum slot dirilis kembali ke publik.
5. **Kasir Terintegrasi & Kantin Futsal (Court & Futsal POS):**
   - Penjualan minuman dingin, makanan ringan, sewa rompi tim, dan sewa bola.
   - Pelunasan sisa biaya sewa lapangan di meja kasir (Tunai, QRIS statis/dinamis, EDC Debit).
   - Cetak struk kasir thermal Bluetooth/USB (ukuran 58mm/80mm) dan kirim struk digital WhatsApp.
6. **Papan Komunitas & Cari Lawan Sparring (Matchmaking Board):**
   - Tim yang telah booking dapat mengaktifkan opsi *"Buka Lowongan Sparring"*, mencantumkan level tim (Casual / Fun / Semi-Pro), nomor WA kapten, dan pembagian biaya sewa (patungan 50:50).
7. **Laporan & Analisis Bisnis Venue:**
   - Laporan okupansi lapangan (% jam terisi vs jam kosong).
   - Laporan omzet gabungan sewa lapangan vs penjualan kantin/sewa alat.
   - Rekap penutupan kasir harian (*Shift Closing*).

### Out-of-Scope (Fase Berikutnya / v2.0)

* Kontrol relay hardware otomatis untuk saklar lampu lapangan via mikrokontroler IoT (arsitektur disiapkan via webhook, namun integrasi hardware fisik masuk fase 2).
* Turnamen & Manajemen Bagan Liga (*Bracket Tournament Builder*).
* Siaran langsung streaming kamera lapangan (*AI Automated Court Camera Recording*).

---

## 5. Spesifikasi Fitur & Acceptance Criteria (BDD)

### FR-001: Mesin Pemesanan Slot & Dynamic Pricing

* **Prioritas**: Must Have (P0)
* **Kriteria Pengujian (Acceptance Criteria)**:
  * **Skenario 1 (Kalkulasi Tarif Sesuai Jam Sewa Dinamis)**:
    * *Given* Lapangan 1 memiliki aturan tarif: Sore (15:00–18:00) Rp 200.000/jam dan Malam (18:00–24:00) Rp 300.000/jam.
    * *When* tim menyewa 2 jam berturut-turut dari jam 17:00 hingga 19:00 pada hari kerja.
    * *Then* sistem menghitung total sewa secara proporsional: 1 jam sore (Rp 200.000) + 1 jam malam (Rp 300.000) = Rp 500.000.
  * **Skenario 2 (Pencegahan Double-Booking Slot Secara Atomik)**:
    * *Given* Lapangan 1 jam 20:00–21:00 berstatus kosong.
    * *When* Pemesan A dan Pemesan B menekan tombol bayar DP pada detik yang sama.
    * *Then* database menerapkan *atomic row locking*; Pemesan A berhasil mengunci slot (status `PENDING_PAYMENT` selama 15 menit), sedangkan Pemesan B ditolak dengan pesan: `"Maaf, slot waktu ini sedang diproses oleh pemesan lain."`

### FR-002: Alur Pembayaran Uang Muka (DP) & Validasi Webhook

* **Prioritas**: Must Have (P0)
* **Kriteria Pengujian**:
  * *Given* pelanggan membuat reservasi senilai Rp 300.000 dengan ketentuan wajib DP 50% (Rp 150.000).
  * *When* pelanggan memindai QRIS Midtrans dan berhasil melakukan transfer.
  * *Then* backend menerima webhook Midtrans (`settlement`), mengubah status booking menjadi `CONFIRMED`, menerbitkan kode booking unik (misal `FUT-2611-042`), dan mengirimkan bukti booking via WhatsApp.
  * *When* pembayaran tidak diselesaikan dalam 15 menit.
  * *Then* cron job membatalkan transaksi (`EXPIRED`) dan membuka kembali slot jam tersebut untuk publik.

### FR-003: Manajemen Jadwal Member Rutin (Recurring Booking)

* **Prioritas**: Must Have (P0)
* **Kriteria Pengujian**:
  * *Given* Komunitas "Anak Futsal FC" mendaftar sebagai member rutin slot Kamis 20:00–22:00 selama 1 bulan (4 pertemuan).
  * *When* manajer venue menyetujui kontrak member.
  * *Then* sistem otomatis mengunci slot Kamis malam tersebut pada 4 tanggal kalender berturut-turut agar tidak bisa dibooking oleh umum di web publik.
  * *And* sistem membuat tagihan invoice total member dan mengirimkan pengingat perpanjangan H-7 sebelum bulan berikutnya berakhir.

### FR-004: Kasir Pelunasan & Penjualan Kantin Futsal (Integrated POS)

* **Prioritas**: Must Have (P0)
* **Kriteria Pengujian**:
  * *Given* Tim Garuda tiba di lapangan dengan status sewa sudah bayar DP Rp 150.000 (sisa bayar sewa Rp 150.000).
  * *And* tim mengambil 4 botol air mineral dingin (Rp 5.000/botol) dan menyewa 1 set rompi tim (Rp 20.000).
  * *When* kasir memproses pelunasan di meja resepsionis.
  * *Then* sistem menjumlahkan sisa sewa (Rp 150.000) + kantin (Rp 20.000) + sewa rompi (Rp 20.000) = Total Rp 190.000.
  * *And* setelah dibayar via QRIS/Tunai, stok air mineral di gudang kantin berkurang 4 botol dan struk pembayaran tercetak.

### FR-005: Papan Komunitas & Pencarian Lawan Sparring

* **Prioritas**: Should Have (P1)
* **Kriteria Pengujian**:
  * *Given* tim "Bhayangkara FC" telah memiliki booking terkonfirmasi pada hari Sabtu jam 19:00 di Lapangan 2.
  * *When* kapten tim mencentang opsi *"Buka Tantangan Sparring"* dan memilih level *"Fun Footy / Santai"*.
  * *Then* jadwal tersebut muncul di halaman publik `/sparring` venue dengan tombol *"Tantang Tim Ini"* yang langsung menghubungkan kapten penantang ke WhatsApp kapten tim pemesan.

---

## 6. Kebijakan & Rancangan Database (`docs/database-standards.md`)

### 6.1 Keputusan Arsitektur Data

* **Isolasi Multi-Tenant & Multi-Venue:** Setiap entitas memiliki `tenantId` dan relasi `venueId`. Manajer venue hanya berhak mengelola data venue tempatnya bertugas.
* **Presisi Waktu UTC & Kalender Lapangan:** Booking disimpan dengan `startTime DateTime` dan `endTime DateTime` dalam UTC; visualisasi kalender diubah ke zona waktu venue (WIB/WITA/WIT).
* **Nilai Uang Tanpa Pecahan:** Tarif per jam, nilai DP, harga kantin, dan biaya sewa alat disimpan sebagai integer Rupiah bulat (`BigInt`/`Int`). Dilarang keras tipe `Float`.
* **Kebijakan Soft Delete:** Model master (`Venue`, `Court`, `CanteenProduct`, `MemberContract`) menerapkan `deletedAt DateTime?` demi keutuhan audit historis keuangan.

### 6.2 Prisma Schema Preview (Entitas Inti StackPlus Futsal)

```prisma
// Akun Bisnis Pemilik Venue (Multi-Tenant)
model Tenant {
  id              String         @id @default(cuid())
  businessName    String         // Contoh: "Champion Futsal Group"
  subdomain       String         @unique // "championfutsal"
  ownerName       String
  ownerPhone      String
  subscriptionPlan SubscriptionPlan @default(STARTER)
  subscriptionEnd DateTime?
  isActive        Boolean        @default(true)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  users           User[]
  venues          Venue[]
  customers       Customer[]

  @@index([subdomain])
}

enum SubscriptionPlan {
  TRIAL
  STARTER // 1 Venue, maks 2 lapangan
  PRO     // s.d. 3 Venue, maks 8 lapangan
  ENTERPRISE // Multi-venue tak terbatas
}

// Lokasi Venue Olahraga
model Venue {
  id              String         @id @default(cuid())
  tenantId        String
  name            String         // "Champion Futsal & Mini Soccer Arena"
  slug            String         // "champion-arena"
  phone           String
  address         String
  city            String         // "Jakarta Selatan"
  latitude        Float?
  longitude       Float?
  timezone        String         @default("Asia/Jakarta")
  openHour        Int            @default(7)  // Buka 07:00
  closeHour       Int            @default(24) // Tutup 24:00
  defaultDpPercent Int           @default(50) // Wajib DP 50%
  isActive        Boolean        @default(true)
  deletedAt       DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  courts          Court[]
  canteenProducts CanteenProduct[]
  cashierShifts   CashierShift[]

  @@unique([tenantId, slug])
  @@index([tenantId])
}

// Lapangan Olahraga
model Court {
  id              String         @id @default(cuid())
  venueId         String
  name            String         // "Lapangan 1 - Vinyl Pro"
  type            CourtType      // FUTSAL_VINYL, FUTSAL_SYNTHETIC, MINI_SOCCER
  lengthMeters    Int?           // misal 26m
  widthMeters     Int?           // misal 16m
  description     String?
  isActive        Boolean        @default(true)
  deletedAt       DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  venue           Venue          @relation(fields: [venueId], references: [id], onDelete: Cascade)
  pricingRules    CourtPricingRule[]
  bookings        Booking[]
  recurringSlots  RecurringSlot[]

  @@index([venueId])
}

enum CourtType {
  FUTSAL_VINYL
  FUTSAL_SYNTHETIC
  FUTSAL_INTERLOCK
  MINI_SOCCER_OUTDOOR
  MINI_SOCCER_INDOOR
}

// Aturan Tarif Dinamis Lapangan
model CourtPricingRule {
  id              String         @id @default(cuid())
  courtId         String
  dayType         DayType        @default(WEEKDAY)
  startHour       Int            // 7 s.d. 23
  endHour         Int            // 8 s.d. 24
  hourlyRate      BigInt         // Tarif sewa per jam (Rupiah bulat)

  court           Court          @relation(fields: [courtId], references: [id], onDelete: Cascade)

  @@index([courtId, dayType])
}

enum DayType {
  WEEKDAY // Senin - Jumat
  WEEKEND // Sabtu, Minggu, Libur Nasional
}

// Profil Pelanggan & Kapten Tim
model Customer {
  id              String         @id @default(cuid())
  tenantId        String
  fullName        String
  phone           String         // Kunci utama (WhatsApp)
  email           String?
  teamName        String?        // Nama Tim Futsal
  totalBookings   Int            @default(0)
  createdAt       DateTime       @default(now())

  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  bookings        Booking[]
  memberContracts MemberContract[]

  @@unique([tenantId, phone])
  @@index([tenantId, phone])
}

// Transaksi Reservasi Lapangan
model Booking {
  id              String         @id @default(cuid())
  courtId         String
  customerId      String
  bookingCode     String         // "BK-FUT-2611-001"
  bookingType     BookingType    @default(ONLINE_PUBLIC)
  status          BookingStatus  @default(PENDING_PAYMENT)
  bookingDate     DateTime       @db.Date
  startTime       DateTime       // UTC Timestamp
  endTime         DateTime       // UTC Timestamp
  durationHours   Int            // 1, 2, 3 jam
  courtTotal      BigInt         // Total sewa lapangan
  canteenTotal    BigInt         @default(0) // Total pesanan kantin
  grandTotal      BigInt         // Total keseluruhan
  depositAmount   BigInt         @default(0) // DP yang sudah dibayar
  remainingDue    BigInt         // Sisa tagihan pelunasan
  paymentMethod   PaymentMethod?
  paidAt          DateTime?
  isOpenSparring  Boolean        @default(false)
  sparringLevel   String?        // "Casual", "Kompetitif"
  notes           String?
  deletedAt       DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  court           Court          @relation(fields: [courtId], references: [id], onDelete: Cascade)
  customer        Customer       @relation(fields: [customerId], references: [id])
  canteenOrders   CanteenOrder[]

  @@index([courtId, bookingDate])
  @@index([courtId, startTime, endTime])
  @@index([bookingCode])
}

enum BookingType {
  ONLINE_PUBLIC
  WALK_IN
  MEMBER_ROUTINE
}

enum BookingStatus {
  PENDING_PAYMENT // Menunggu bayar DP (Lock 15 menit)
  CONFIRMED       // Sudah bayar DP / Lunas
  PLAYING         // Sedang bermain di lapangan
  COMPLETED       // Selesai & Lunas kasir
  CANCELLED       // Dibatalkan
  NO_SHOW         // Tim tidak hadir (DP hangus)
  EXPIRED         // Gagal bayar dalam batas waktu
}

enum PaymentMethod {
  MIDTRANS_QRIS
  MIDTRANS_VA
  CASH_AT_COUNTER
  EDC_DEBIT
}

// Produk Kantin & Persewaan Alat
model CanteenProduct {
  id              String         @id @default(cuid())
  venueId         String
  sku             String
  name            String         // "Pocari Sweat 500ml", "Sewa Rompi (1 Set)"
  category        CanteenCategory
  price           BigInt         // Harga jual
  costPrice       BigInt         // Modal kulakan
  stock           Int            @default(0)
  createdAt       DateTime       @default(now())

  venue           Venue          @relation(fields: [venueId], references: [id], onDelete: Cascade)
  orderItems      CanteenOrder[]

  @@index([venueId, category])
}

enum CanteenCategory {
  BEVERAGE
  SNACK
  EQUIPMENT_RENTAL // Rompi, bola, sepatu
}

model CanteenOrder {
  id              String         @id @default(cuid())
  bookingId       String
  productId       String
  qty             Int
  price           BigInt
  subtotal        BigInt

  booking         Booking        @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  product         CanteenProduct @relation(fields: [productId], references: [id])

  @@index([bookingId])
}

// Kontrak Member Rutin Komunitas
model MemberContract {
  id              String         @id @default(cuid())
  customerId      String
  courtId         String
  dayOfWeek       Int            // 1 = Senin, 4 = Kamis
  startHour       Int            // misal 20 (jam 20:00)
  durationHours   Int            @default(2)
  startDate       DateTime       @db.Date
  endDate         DateTime       @db.Date
  monthlyFee      BigInt
  isActive        Boolean        @default(true)
  deletedAt       DateTime?
  createdAt       DateTime       @default(now())

  customer        Customer       @relation(fields: [customerId], references: [id])
  slots           RecurringSlot[]

  @@index([customerId])
}

model RecurringSlot {
  id              String         @id @default(cuid())
  contractId      String
  courtId         String
  date            DateTime       @db.Date
  startHour       Int
  endHour         Int

  contract        MemberContract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  court           Court          @relation(fields: [courtId], references: [id], onDelete: Cascade)

  @@unique([courtId, date, startHour])
}

// Sesi Tutup Kasir Resepsionis
model CashierShift {
  id              String         @id @default(cuid())
  venueId         String
  openedById      String
  closedById      String?
  openedAt        DateTime       @default(now())
  closedAt        DateTime?
  startingCash    BigInt         // Kas awal laci kasir
  actualCashEnding BigInt?       // Uang fisik saat tutup
  systemCashTotal BigInt?        // Hitungan transaksi tunai sistem
  notes           String?

  venue           Venue          @relation(fields: [venueId], references: [id], onDelete: Cascade)

  @@index([venueId, openedAt])
}
```

---

## 7. Integrasi Pihak Ketiga & Environment Variables (`docs/env-and-secrets.md`)

### 7.1 Layanan Eksternal (Third-Party Services)

| Layanan                       | Provider Terpilih                | Fungsi Bisnis                                                      | Kredensial & Pengelolaan       |
| ----------------------------- | -------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| **Payment Gateway**     | Midtrans (Snap & QRIS Core API)  | Pembayaran uang muka (DP sewa lapangan) secara otomatis            | Akun Studio StackPlus          |
| **WhatsApp Gateway**    | Fonnte / WhatsApp Cloud API      | Notifikasi bukti booking lapangan, reminder H-4 jam, link sparring | Akun Bisnis Resmi Klien/Studio |
| **Cloud Storage**       | Supabase Storage / Cloudflare R2 | Penyimpanan foto fasilitas venue, foto kondisi lapangan            | Bucket Publik Terkelola        |
| **Email Transaksional** | Resend                           | Pengiriman invoice bulanan member rutin ke penanggung jawab tim    | Akun Domain Resmi StackPlus    |

### 7.2 Daftar Environment Variables Baru

| Variabel                    | Sifat            | Deskripsi                                          | Contoh Nilai Placeholder        |
| --------------------------- | ---------------- | -------------------------------------------------- | ------------------------------- |
| `MIDTRANS_SERVER_KEY`     | **Secret** | Server key otentikasi Midtrans                     | `SB-Mid-server-xxxx...`       |
| `MIDTRANS_CLIENT_KEY`     | **Publik** | Client key untuk Midtrans Snap SDK di browser      | `SB-Mid-client-yyyy...`       |
| `WHATSAPP_API_TOKEN`      | **Secret** | Token otentikasi WhatsApp Gateway                  | `wabot_token_futsal_sec_123`  |
| `WHATSAPP_ENDPOINT_URL`   | Konfigurasi      | URL endpoint penyedia layanan WhatsApp             | `https://api.fonnte.com/send` |
| `DEFAULT_DP_HOLD_MINUTES` | Konfigurasi      | Batas waktu reservasi sementara saat pembayaran DP | `15`                          |

---

## 8. Standar Non-Fungsional (NFR) & Target Infrastruktur

### 8.1 Standar Kualitas Teknis (NFR)

* **Pencegahan Double-Booking Mutlak (Atomic Concurrency Lock):** Pengecekan bentrok slot jam dan penguncian sementara menggunakan query serializable:
  ```sql
  SELECT * FROM "Booking" 
  WHERE "courtId" = :courtId 
    AND "status" IN ('CONFIRMED', 'PLAYING', 'PENDING_PAYMENT')
    AND ("startTime" < :newEndTime AND "endTime" > :newStartTime)
  FOR UPDATE;
  ```
* **Kecepatan Query Matriks Kalender:** Query render visual ketersediaan jadwal 24 jam untuk 5 lapangan sekaligus < 250 ms dengan memanfaatkan index gabungan `@@index([courtId, bookingDate])`.
* **Kepatuhan Privasi Data (UU PDP):** Nomor kontak kapten tim pada papan sparring hanya dapat dibuka jika kapten penantang menekan persetujuan interaksi resmi.
* **Testing Coverage:** Unit tests kalkulasi tarif dinamis jam sewa, validasi overlap slot jam, dan formula DP wajib mencapai coverage **> 85%**.

### 8.2 Target Infrastruktur Deployment (`docs/deployment.md`)

| Lapisan                       | Pilihan Utama                      | Catatan Konfigurasi                                           |
| ----------------------------- | ---------------------------------- | ------------------------------------------------------------- |
| **Frontend Web**        | Vercel (Next.js 16 App Router)     | Subdomain wildcard `*.futsal.stackplustudio.com`            |
| **Backend API Gateway** | Railway (NestJS 11 Container)      | `api-futsal.stackplustudio.com`, Cookie Lax, CORS whitelist |
| **Database PostgreSQL** | Neon PostgreSQL (Pooled Port 6543) | Direct connection Port 5432 untuk Prisma Migrate              |

---

## 9. Rencana Rilis & Milestone

| Milestone                                               | Deliverable Bisnis                                                                           | Estimasi     | Check Validasi                                                                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| **M1: Fondasi Multi-Venue & Lapangan**            | Setup tenant, CRUD venue, lapangan, dan skema aturan tarif dinamis (siang/malam/weekend)     | Minggu ke-2  | `pnpm --filter database exec prisma migrate dev --name init-futsal` & Unit test kalkulasi tarif dinamis |
| **M2: Mesin Kalender Slot & Booking Publik**      | Matriks ketersediaan slot real-time, booking mobile, lock slot 15 menit, anti double-booking | Minggu ke-5  | Playwright E2E booking 2 pengguna bersamaan & verifikasi atomic lock                                      |
| **M3: Integrasi Midtrans DP & WhatsApp Reminder** | Pembayaran DP QRIS otomatis, webhook verifikasi, reminder WhatsApp jadwal tanding            | Minggu ke-7  | Simulasi bayar DP Midtrans Sandbox & webhook settlement test                                              |
| **M4: Kasir Kantin (POS) & Manajemen Member**     | Kasir sewa + kantin, cetak struk thermal 58mm/80mm, kontrak member rutin bulanan             | Minggu ke-9  | Uji coba transaksi kasir campuran & penguncian slot member rutin                                          |
| **M5: Papan Sparring, Laporan, & QA Rilis**       | Fitur cari lawan sparring, dashboard analitik okupansi lapangan, security audit              | Minggu ke-11 | Quality Gate CI/CD Hijau ✅, audit Gitleaks + Trivy bersih, UAT mitra venue                               |

---

## 10. Kriteria UAT, Serah-Terima, & Garansi

### 10.1 Protokol UAT Mitra Venue Futsal (`docs/uat-and-acceptance.md`)

* Pengujian dijalankan pada venue mitra binaan StackPlus Studio (minimal memiliki 3 lapangan aktif) selama 14 hari kalender.
* Kriteria Lulus:
  1. Nol insiden bentrok jadwal antara booking online dan tamu walk-in.
  2. Pembayaran DP via QRIS otomatis membuka reservasi tanpa intervensi manual staf kasir.
  3. Laporan tutup kasir harian mencocokkan total uang tunai dan QRIS secara presisi.

### 10.2 Ketentuan Garansi Pasca-Rilis (`docs/maintenance-and-support.md`)

* **Masa Garansi Bug:** 60 hari kalender pemeliharaan intensif pasca peluncuran komersial.
* **Cakupan:** Perbaikan galat kalkulasi slot kalender, kegagalan webhook QRIS, dan kendala cetak struk thermal kasir.

---

## 11. Log Perubahan & Change Request (CR) (`docs/change-request.md`)

*Seluruh penyesuaian fungsional di luar PRD v1.0 dicatat di tabel berikut:*

| No. CR           | Tanggal     | Fitur yang Diminta                                               | Dampak Estimasi                                        |    Status    |
| ---------------- | ----------- | ---------------------------------------------------------------- | ------------------------------------------------------ | :-----------: |
| **CR-001** | *Pending* | Integrasi Webhook Saklar Lampu Lapangan IoT (Smart Relay Switch) | Pembuatan endpoint event trigger IoT, estimasi +3 hari | Usulan Fase 2 |

---

*Dokumen ini merupakan acuan mutlak implementasi StackPlus Futsal SaaS. Seluruh kode backend dan frontend wajib mematuhi kriteria di atas.*
