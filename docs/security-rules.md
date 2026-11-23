# 🛡️ Security Rules — Stack Plus Studio

> **Status Dokumen**: Mandatory Security Standard · **Terakhir Diperbarui**: 16 November 2026  
> **Konsep untuk Junior Developer**: Setiap baris kode yang kamu buat di Core Engine WAJIB mematuhi aturan keamanan berlapis di bawah ini. Dokumen ini fokus langsung pada **implementasi nyata di kode** (code-level value), bukan teori panjang.

---

## 1. Lapisan Keamanan Nyata (Real Implementation in Code)

Sistem Core Engine Stack Plus Studio mengimplementasikan 7 lapisan pertahanan (*Defense-in-Depth*):

| Lapisan | Implementasi di Kode | Lokasi File | Fungsi Perlindungan |
|---|---|---|---|
| **1. HTTP Security Headers** | `app.use(helmet())` | `apps/api/src/main.ts` | Mencegah XSS, Clickjacking, MIME-sniffing, dan memaksakan HSTS. |
| **2. Rate Limiting** | `ThrottlerGuard` & `@Throttle` | `app.module.ts` & `auth.controller.ts` | Global: 100 req/min. Login endpoint: **5 req/min** (mencegah Brute-Force). |
| **3. Mass-Assignment Guard** | `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` | `apps/api/src/main.ts` | Menolak otomatis request dengan parameter asing / tak dikenal (HTTP 400). |
| **4. Dual Token & Password Hash** | Bcrypt (10 rounds) + JWT + HttpOnly Cookie | `auth.service.ts` & `auth.controller.ts` | Access token untuk Authorization header; Refresh token di HttpOnly cookie aman. |
| **5. RBAC & IDOR Defense** | `RolesGuard` + `assertSelfOrAdmin` | `auth/guards/roles.guard.ts` & `users.service.ts` | Membatasi aksi Admin vs User. Mencegah manipulasi ID user lain. |
| **6. SQL Injection Defense** | Prisma ORM Parameterized Queries | `packages/database` | Query SQL selalu di-bind otomatis, tidak pernah string concatenation. |
| **7. Test DB Safety Guard** | `assertSafeTestDatabase()` | `apps/api/test/test-safety.guard.ts` | Membatalkan eksekusi test seketika jika DATABASE_URL mengarah ke Cloud DB. |

---

## 2. Checklist Wajib Saat Membuat Endpoint Backend Baru

Ketika kamu menambahkan Controller atau Service baru, pastikan 5 hal ini:

### 1. Pasang Guard di Controller
Semua route backend **terkunci secara default**. Endpoint publik harus merupakan pengecualian yang disengaja.
```typescript
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard) // WAJIB ada di level controller
export class OrdersController {
  // Hanya ADMIN yang bisa menghapus
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) { ... }
}
```

### 2. Cegah IDOR (Insecure Direct Object Reference)
Pengguna biasa (`USER`) **hanya boleh membaca/mengubah data miliknya sendiri**. Admin boleh mengakses semua.
Gunakan pola `assertSelfOrAdmin`:
```typescript
// Di Service:
assertSelfOrAdmin(currentUser: AuthUser, targetUserId: string) {
  if (currentUser.role === 'ADMIN') return;
  if (currentUser.userId !== targetUserId) {
    throw new ForbiddenException('Akses ditolak: Anda tidak memiliki izin untuk akun ini');
  }
}
```

### 3. Validasi Request Payload dengan DTO Ketat
Jangan pernah menerima request body mentah tanpa DTO yang tervalidasi `class-validator`:
```typescript
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;
}
```

### 4. Jangan Bocorkan Password Hash atau Data Sensitif
Di Prisma query, selalu gunakan `select` atau hapus password sebelum me-return respon:
```typescript
const user = await this.prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, name: true, role: true, createdAt: true }, // TANPA password
});
```

### 5. Jangan Pernah Percayai Role dari Request Body
Role akun default selalu `USER`. Perubahan role menjadi `ADMIN` hanya bisa dilakukan oleh sesama `ADMIN` melalui endpoint khusus.

---

## 3. Checklist Wajib untuk Frontend (`apps/web`)

1. **Gunakan Axios Client Terpusat**: Selalu impor `api` dari `@/lib/axios`. Client ini otomatis menyematkan header `Authorization: Bearer <token>` dari cookie.
2. **Umpan Balik Aman (Toast)**: Gunakan `toast.error()` atau `toast.success()` dari `react-hot-toast`. **DILARANG** menggunakan `alert()` browser.
3. **Pesan Error Generik**: Jangan pernah menampilkan error mentah database (`P2002`, `PrismaClientKnownRequestError`) ke layar pengguna. Tampilkan pesan ramah: `"Gagal menyimpan data. Silakan coba kembali."`.
4. **Proteksi Route Client**: Navigasi dashboard dilindungi oleh `src/proxy.ts` yang memeriksa keberadaan cookie token sesi. Jika tidak ada, pengguna langsung dialihkan ke halaman utama.

---

## 4. Secret & Konfigurasi Lingkungan (`.env`)

* Seluruh secret sensitif (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`) wajib divalidasi saat startup melalui `ConfigModule.forRoot({ validate: validateConfig })`.
* Jika ada variabel yang belum diset, backend akan **berhenti otomatis (fail-fast)** dengan log kesalahan yang jelas.
* Jangan pernah melakukan commit file `.env` ke Git repository. Selalu gunakan `.env.example` sebagai referensi.
