import Link from 'next/link';
import Image from 'next/image';
import {
  Clock,
  CreditCard,
  Users,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Trophy,
  Ruler,
  Zap,
  Printer,
  CalendarDays,
  ShieldCheck,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';

export default function Home() {
  const courtsShowcase = [
    {
      id: 'court-vinyl',
      name: 'Lapangan 1 - Vinyl Pro',
      type: 'Vinyl Interlock',
      image:
        'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80',
      badge: 'Favorit Turnamen',
      dimensions: '26m × 16m',
      capacity: '5 vs 5',
      rate: 'Rp 120.000 / jam',
      surface: 'Lantai Vinyl Interlock Anti-Slip',
      description:
        'Lantai vinyl standar internasional dengan bantalan empuk anti-cedera, pencahayaan LED sorot 500W, dan jaring gawang tebal.',
    },
    {
      id: 'court-synthetic',
      name: 'Lapangan 2 - Rumput Sintetis',
      type: 'Monofilamen 50mm',
      image:
        'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
      badge: 'Best Seller Komunitas',
      dimensions: '28m × 18m',
      capacity: '5 vs 5',
      rate: 'Rp 140.000 / jam',
      surface: 'Rumput Sintetis + Silika Infill',
      description:
        'Sensasi bermain menyerupai rumput alami dengan taburan rubber granule empuk. Dilengkapi tribun penonton mini yang nyaman.',
    },
    {
      id: 'court-minisoccer',
      name: 'Lapangan 3 - Mini Soccer Stadium',
      type: 'Outdoor 7 vs 7',
      image:
        'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80',
      badge: 'Stadion Terbuka',
      dimensions: '50m × 30m',
      capacity: '7 vs 7',
      rate: 'Rp 300.000 / jam',
      surface: 'Rumput Sintetis Weatherproof',
      description:
        'Ukuran besar 7-a-side terbuka dengan sistem drainase cepat, jaring keliling 6 meter, dan lampu tembak stadion 1000W × 4 tiang.',
    },
  ];

  const features = [
    {
      icon: Clock,
      title: 'Anti Double-Booking & Atomic Lock',
      description:
        'Sistem penguncian slot otomatis 15 menit saat pemain memproses DP. Menjamin nol risiko tabrakan jam sewa antar pemesan.',
      badge: 'Atomic Lock',
    },
    {
      icon: CreditCard,
      title: 'Anti No-Show Payment Gateway',
      description:
        'Wajib uang muka (DP 50% atau flat) via Midtrans QRIS & Virtual Account. Menghilangkan kerugian venue akibat tim ghosting.',
      badge: 'Midtrans Snap',
    },
    {
      icon: Sparkles,
      title: 'Smart Dynamic Pricing Engine',
      description:
        'Penetapan harga otomatis proporsional: Siang hemat, Sore normal, dan Malam Prime-Time, serta pembedaan tarif Weekday vs Weekend.',
      badge: 'Dynamic Rates',
    },
    {
      icon: ShoppingBag,
      title: 'Kasir Kantin & Sewa Alat (POS)',
      description:
        'Resepsionis menggabungkan pelunasan sewa lapangan dengan pesanan minuman dingin dan sewa rompi tim dalam satu struk thermal kasir.',
      badge: 'Kasir POS',
    },
    {
      icon: CalendarDays,
      title: 'Manajemen Member Rutin Komunitas',
      description:
        'Pendaftaran jadwal mingguan komunitas futsal (1 s.d. 6 bulan). Mengunci otomatis seluruh slot kalender publik agar tidak bisa dipesan umum.',
      badge: 'Recurring Slots',
    },
    {
      icon: Users,
      title: 'Papan Cari Lawan Sparring',
      description:
        'Tim yang sudah reservasi dapat membuka status tantangan sparring dengan level santai hingga kompetitif untuk memperluas komunitas.',
      badge: 'Komunitas',
    },
  ];

  const highlights = [
    'Pemesanan publik mobile 90 detik tanpa perlu unduh aplikasi',
    'Penguncian slot 15 menit dengan status pending real-time',
    'Integrasi Midtrans QRIS dinamis & verifikasi otomatis webhook',
    'Cetak struk kasir thermal 58mm/80mm & rincian pembayaran lengkap',
  ];

  const stats = [
    { value: '< 90 Detik', label: 'Kecepatan Booking Pemain' },
    { value: '0 Insiden', label: 'Bentrok Double-Booking' },
    { value: '15 Menit', label: 'Atomic Slot Lock Window' },
    { value: '1 Invoice', label: 'Sewa Lapangan + Kantin POS' },
  ];

  return (
    <div className="min-h-screen bg-brand-background text-brand-ink antialiased selection:bg-brand-primary selection:text-white">
      {/* ── Top Navigation Bar ────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-brand-surface/90 backdrop-blur-md border-b border-brand-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-9 rounded-lg bg-brand-primary text-white flex items-center justify-center font-bold shadow-xs transition-colors group-hover:bg-brand-primary-dark">
              <Trophy className="size-4.5" />
            </div>
            <div>
              <span className="font-bold text-base text-brand-ink-dark block leading-tight">
                StackPlus <span className="text-brand-primary">Futsal</span>
              </span>
              <span className="text-[11px] text-brand-ink-muted block">
                Venue &amp; Court Management SaaS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/pos"
              className="inline-flex h-9 items-center gap-1.5 px-3 rounded-lg border border-brand-line bg-brand-surface text-xs font-medium text-brand-ink-dark hover:bg-brand-surface-alt transition-colors duration-150"
            >
              <Printer className="size-3.5 text-brand-ink-muted" />
              <span className="hidden sm:inline">Kasir POS</span>
            </Link>

            <Link
              href="/dashboard/members"
              className="hidden md:inline-flex h-9 items-center gap-1.5 px-3 rounded-lg border border-brand-line bg-brand-surface text-xs font-medium text-brand-ink-dark hover:bg-brand-surface-alt transition-colors duration-150"
            >
              <CalendarDays className="size-3.5 text-brand-ink-muted" />
              <span>Member Rutin</span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg border border-brand-line bg-brand-surface text-xs font-medium text-brand-ink-dark hover:bg-brand-surface-alt transition-colors duration-150"
            >
              <LayoutDashboard className="size-3.5 text-brand-ink-muted" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/book/champion-arena"
              className="inline-flex h-9 items-center justify-center px-4 rounded-lg bg-brand-primary text-xs font-medium text-white hover:bg-brand-primary-dark transition-colors duration-150 shadow-xs"
            >
              Booking Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section (Spacious & Clean Marketing UI) ─────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-brand-line">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-surface-alt border border-brand-line text-xs font-medium text-brand-ink-dark mb-6">
            <ShieldCheck className="size-3.5 text-brand-primary" />
            <span>SaaS Operasional Futsal &amp; Mini Soccer Terpadu</span>
          </div>

          {/* Clean Two-Color Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-brand-ink-dark leading-[1.15] mb-6">
            Tingkatkan Okupansi Venue,{' '}
            <span className="text-brand-primary">
              Bebas Ghosting &amp; Tabrakan Jadwal
            </span>
          </h1>

          <p className="text-base sm:text-lg text-brand-ink max-w-2xl mx-auto mb-10 leading-relaxed">
            Platform all-in-one untuk pengelola venue futsal &amp; mini soccer: reservasi online mobile 90-detik, pembayaran DP otomatis via Midtrans Snap, kasir pelunasan POS + kantin, dan jadwal member rutin bulanan.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
            <Link
              href="/book/champion-arena"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-primary px-6 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-primary-dark shadow-xs"
            >
              <span>Demo Booking Pemain</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/dashboard/pos"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-brand-line bg-brand-surface px-5 text-sm font-medium text-brand-ink-dark transition-colors duration-150 hover:bg-brand-surface-alt shadow-xs"
            >
              <Printer className="size-4 text-brand-ink-muted" />
              <span>Kasir POS &amp; Kantin</span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-brand-line bg-brand-surface px-5 text-sm font-medium text-brand-ink-dark transition-colors duration-150 hover:bg-brand-surface-alt shadow-xs"
            >
              <LayoutDashboard className="size-4 text-brand-ink-muted" />
              <span>Dashboard Pengelola</span>
            </Link>
          </div>

          {/* 4 Clean Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            {stats.map((s, idx) => (
              <div
                key={idx}
                className="bg-brand-surface border border-brand-line rounded-xl p-5 shadow-xs"
              >
                <div className="text-2xl font-bold text-brand-ink-dark tracking-tight tabular-nums">
                  {s.value}
                </div>
                <div className="text-xs text-brand-ink-muted mt-1 font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Court Showcase Cards ────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-brand-line bg-brand-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary block mb-1">
                Katalog Lapangan
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink-dark tracking-tight">
                Pilihan Lapangan Unggulan Venue
              </h2>
              <p className="text-sm text-brand-ink-muted mt-1 max-w-xl">
                Setiap lapangan dilengkapi spesifikasi ukuran standar, jenis permukaan lantai, kapasitas pemain, dan tarif dinamis siang vs malam prime-time.
              </p>
            </div>

            <Link
              href="/book/champion-arena"
              className="mt-4 sm:mt-0 text-xs font-medium text-brand-primary hover:text-brand-primary-dark flex items-center gap-1 self-start sm:self-auto"
            >
              Lihat Kalender Booking Lengkap
              <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courtsShowcase.map((court) => (
              <div
                key={court.id}
                className="bg-brand-surface border border-brand-line rounded-xl overflow-hidden shadow-xs hover:border-brand-primary transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Photo Header */}
                  <div className="relative h-52 w-full overflow-hidden bg-brand-surface-alt">
                    <Image
                      src={court.image}
                      alt={court.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <span className="absolute top-3 left-3 bg-brand-surface/90 backdrop-blur-xs text-brand-ink-dark text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-brand-line">
                      {court.type}
                    </span>

                    <span className="absolute top-3 right-3 bg-brand-primary text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                      {court.badge}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-brand-ink-dark">
                        {court.name}
                      </h3>
                      <p className="text-xs text-brand-ink-muted mt-0.5">
                        {court.surface}
                      </p>
                    </div>

                    <p className="text-xs text-brand-ink leading-relaxed">
                      {court.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-brand-surface-alt rounded-lg p-2.5 border border-brand-line text-center">
                        <Ruler className="size-3.5 text-brand-primary mx-auto mb-1" />
                        <div className="text-[10px] text-brand-ink-muted uppercase font-medium">Ukuran</div>
                        <div className="font-semibold text-brand-ink-dark mt-0.5">{court.dimensions}</div>
                      </div>

                      <div className="bg-brand-surface-alt rounded-lg p-2.5 border border-brand-line text-center">
                        <Zap className="size-3.5 text-brand-primary mx-auto mb-1" />
                        <div className="text-[10px] text-brand-ink-muted uppercase font-medium">Kapasitas</div>
                        <div className="font-semibold text-brand-ink-dark mt-0.5">{court.capacity}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-5 pt-0 border-t border-brand-line mt-2 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-brand-ink-muted uppercase font-medium">Tarif Mulai</div>
                    <div className="text-sm font-bold text-brand-ink-dark tabular-nums">{court.rate}</div>
                  </div>

                  <Link
                    href="/book/champion-arena"
                    className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-medium transition-colors shadow-xs"
                  >
                    <span>Pesan Slot</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Grid ────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-brand-line bg-brand-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-primary block mb-1">
              Fitur Sistem
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink-dark tracking-tight">
              Dirancang untuk Pengelolaan Venue yang Efisien
            </h2>
            <p className="text-sm text-brand-ink-muted mt-2">
              Mengatasi kendala utama pemilik lapangan: bentrok slot ganda, pembatalan sepihak tanpa DP, dan pencatatan kasir kantin yang terpisah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-brand-surface p-6 rounded-xl border border-brand-line shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="size-10 rounded-lg bg-brand-surface-alt text-brand-primary flex items-center justify-center border border-brand-line">
                        <Icon className="size-5" />
                      </div>
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-brand-surface-alt text-brand-ink-muted border border-brand-line">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-brand-ink-dark mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-brand-ink leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── POS & Member Routine Callout ────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-brand-line bg-brand-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-brand-surface-alt rounded-2xl p-8 sm:p-12 border border-brand-line shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary uppercase tracking-wider mb-2">
                  <Smartphone className="size-3.5" /> Antarmuka Resepsionis Terpadu
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-ink-dark mb-3">
                  Kasir Resepsionis &amp; Manajemen Member Rutin
                </h3>
                <p className="text-sm text-brand-ink leading-relaxed mb-6">
                  Pelunasan sisa tagihan sewa lapangan, pemesanan minuman dingin kantin,
                  sewa rompi tim, hingga cetak struk thermal kasir 58mm/80mm dalam satu layar operasional yang cepat dan akurat.
                </p>

                <div className="space-y-2 mb-8 text-xs text-brand-ink">
                  {highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/dashboard/pos"
                    className="inline-flex h-10 items-center justify-center px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors gap-2"
                  >
                    <Printer className="size-4" />
                    <span>Buka Layar Kasir POS</span>
                  </Link>

                  <Link
                    href="/dashboard/members"
                    className="inline-flex h-10 items-center justify-center px-4 rounded-lg border border-brand-line bg-brand-surface hover:bg-brand-surface-alt text-brand-ink-dark font-medium text-xs shadow-xs transition-colors gap-2"
                  >
                    <CalendarDays className="size-4 text-brand-primary" />
                    <span>Kelola Member Rutin</span>
                  </Link>
                </div>
              </div>

              {/* POS Receipt Preview Mockup */}
              <div className="lg:col-span-5">
                <div className="bg-brand-surface border border-brand-line rounded-xl p-5 shadow-xs space-y-3 font-sans text-xs">
                  <div className="flex items-center justify-between border-b border-brand-line pb-3">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-600" />
                      <span className="text-xs font-semibold text-brand-ink-dark">Struk Kasir Thermal (58mm)</span>
                    </div>
                    <span className="text-[11px] text-brand-ink-muted font-mono">BK-FUT-2611-042</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-brand-ink">
                    <div className="flex justify-between">
                      <span>Sewa Lapangan 1 (2 Jam)</span>
                      <span className="font-semibold text-brand-ink-dark tabular-nums">Rp 300.000</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 text-[11px]">
                      <span>• DP Lunas via Midtrans QRIS</span>
                      <span className="tabular-nums">-Rp 150.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>4x Pocari Sweat 500ml</span>
                      <span className="font-semibold text-brand-ink-dark tabular-nums">Rp 40.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1x Sewa Rompi Tim (1 Set)</span>
                      <span className="font-semibold text-brand-ink-dark tabular-nums">Rp 25.000</span>
                    </div>
                  </div>

                  <div className="bg-brand-surface-alt rounded-lg p-3 border border-brand-line space-y-1">
                    <div className="flex justify-between font-bold text-brand-ink-dark text-sm">
                      <span>Total Pelunasan Kasir:</span>
                      <span className="text-brand-primary tabular-nums">Rp 215.000</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-brand-ink-muted pt-1 border-t border-brand-line">
                      <span>Metode Pembayaran:</span>
                      <span className="text-brand-ink-dark font-medium">QRIS Dinamis / Tunai</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-brand-surface border-t border-brand-line py-8 text-xs text-brand-ink-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium text-brand-ink">
            <span>StackPlus Futsal SaaS</span>
            <span>•</span>
            <span>Product Studio Initiative</span>
          </div>

          <div>
            Built with Next.js 16, NestJS 11, Prisma &amp; Tailwind CSS v4.
          </div>
        </div>
      </footer>
    </div>
  );
}
