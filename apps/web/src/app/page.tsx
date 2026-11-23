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
} from 'lucide-react';

export default function Home() {
  const courtsShowcase = [
    {
      id: 'court-vinyl',
      name: 'Lapangan 1 - Vinyl Pro',
      type: 'VINYL INTERLOCK',
      image:
        'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80',
      tag: 'Favorit Turnamen',
      dimensions: '26m × 16m',
      capacity: '5 vs 5',
      rate: 'Rp 120.000 / jam',
      surface: 'Lantai Vinyl Interlock Anti-Slip',
      description:
        'Bantalan empuk berstandar internasional dengan pencahayaan LED 500W. Sangat nyaman untuk sprint cepat dan minim risiko lecet.',
    },
    {
      id: 'court-synthetic',
      name: 'Lapangan 2 - Rumput Sintetis',
      type: 'MONOFILAMEN 50MM',
      image:
        'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
      tag: 'Best Seller Komunitas',
      dimensions: '28m × 18m',
      capacity: '5 vs 5',
      rate: 'Rp 140.000 / jam',
      surface: 'Rumput Sintetis + Silika Infill',
      description:
        'Sensasi bermain menyerupai rumput stadion alami. Dilengkapi pasir silika & rubber granule lembut, tribun penonton mini, dan gawang kokoh.',
    },
    {
      id: 'court-minisoccer',
      name: 'Lapangan 3 - Mini Soccer Stadium',
      type: 'OUTDOOR 7 VS 7',
      image:
        'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80',
      tag: 'Stadion Outdoor',
      dimensions: '50m × 30m',
      capacity: '7 vs 7',
      rate: 'Rp 300.000 / jam',
      surface: 'Rumput Sintetis Weatherproof',
      description:
        'Ukuran besar untuk pertandingan 7-a-side terbuka dengan sistem drainase cepat dan pencahayaan lampu tembak stadion 1000W × 4 tiang.',
    },
  ];

  const features = [
    {
      icon: Clock,
      title: 'Anti Double-Booking & Atomic Lock',
      description:
        'Sistem penguncian slot otomatis 15 menit saat pemain memproses pembayaran DP. Menjamin nol risiko bentrok jadwal antar pemesan.',
      badge: 'Real-Time Concurrency',
    },
    {
      icon: CreditCard,
      title: 'Anti No-Show Payment Gateway',
      description:
        'Wajib uang muka (DP minimal 50% atau flat) via Midtrans QRIS & Virtual Account. Hilangkan kerugian akibat tim ghosting.',
      badge: 'Midtrans Ready',
    },
    {
      icon: Sparkles,
      title: 'Smart Dynamic Pricing Engine',
      description:
        'Penetapan harga otomatis proporsional: Siang hemat, Sore normal, dan Malam Prime-Time, serta pembedaan tarif Weekday vs Weekend.',
      badge: 'Otomatis',
    },
    {
      icon: ShoppingBag,
      title: 'Kasir Kantin & Sewa Alat (Integrated POS)',
      description:
        'Resepsionis menggabungkan pelunasan sewa lapangan dengan pesanan minuman dingin dan sewa rompi tim dalam satu struk thermal kasir.',
      badge: 'All-in-One POS',
    },
    {
      icon: CalendarDays,
      title: 'Manajemen Member Rutin Komunitas',
      description:
        'Penguncian jadwal otomatis mingguan 1 s.d. 6 bulan untuk komunitas langganan. Slot otomatis terkunci di halaman publik.',
      badge: 'Recurring Slots',
    },
    {
      icon: Users,
      title: 'Papan Cari Lawan Sparring',
      description:
        'Tim yang sudah booking dapat membuka status tantangan sparring dengan level santai hingga kompetitif untuk memperluas komunitas venue.',
      badge: 'Fitur Komunitas',
    },
  ];

  const highlights = [
    'Pemesanan publik instan 90 detik via mobile (tanpa wajib unduh aplikasi)',
    'Proteksi multi-tenant & hak akses berjenjang (Owner, Manager, Cashier, Player)',
    'Kalkulasi tarif proporsional per jam dengan desimal pembulatan nol',
    'Cetak struk thermal 58mm/80mm & integrasi bukti booking WhatsApp',
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] antialiased selection:bg-[#0053F1] selection:text-white">
      {/* ── Top Navigation ───────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[#0053F1] text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
              <Trophy className="size-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
                StackPlus <span className="text-[#0053F1]">Futsal</span>
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                Venue & Court Management SaaS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/pos"
              className="hidden sm:inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors gap-1.5"
            >
              <ShoppingBag className="size-3.5 text-[#0053F1]" />
              <span>Kasir POS</span>
            </Link>
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/book/champion-arena"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold bg-[#0053F1] hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm transition-all shadow-blue-500/20"
            >
              Booking Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#0053F1] text-xs font-semibold mb-6">
            <Sparkles className="size-3.5" />
            <span>SaaS Operasional Futsal & Mini Soccer #1 di Indonesia</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
            Tingkatkan Okupansi Venue,{' '}
            <span className="text-[#0053F1] underline decoration-[#0053F1]/30 underline-offset-8">
              Bebas Ghosting & Tabrakan Jadwal
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Platform SaaS all-in-one untuk pengelola venue futsal & mini soccer:
            reservasi online mobile 90-detik, pembayaran DP otomatis Midtrans Snap,
            kasir pelunasan POS + kantin, dan jadwal member rutin bulanan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <Link
              href="/book/champion-arena"
              className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-xl bg-[#0053F1] hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Demo Booking Pemain (Live)</span>
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/dashboard/pos"
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Printer className="size-4 text-emerald-600" />
              <span>Kasir POS & Kantin</span>
            </Link>
          </div>

          {/* Social Proof Metric Chips */}
          <div className="mt-12 pt-8 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="bg-white/60 p-3 rounded-xl border border-slate-200/60">
              <div className="text-2xl font-extrabold text-slate-900">&lt; 90 Detik</div>
              <div className="text-xs text-slate-500 font-medium">Kecepatan Booking Pemain</div>
            </div>
            <div className="bg-white/60 p-3 rounded-xl border border-slate-200/60">
              <div className="text-2xl font-extrabold text-emerald-600">0 Insiden</div>
              <div className="text-xs text-slate-500 font-medium">Bentrok Double-Booking</div>
            </div>
            <div className="bg-white/60 p-3 rounded-xl border border-slate-200/60">
              <div className="text-2xl font-extrabold text-[#0053F1]">15 Menit</div>
              <div className="text-xs text-slate-500 font-medium">Atomic Slot Lock Window</div>
            </div>
            <div className="bg-white/60 p-3 rounded-xl border border-slate-200/60">
              <div className="text-2xl font-extrabold text-slate-900">1 Invoice</div>
              <div className="text-xs text-slate-500 font-medium">Sewa Lapangan + Kantin POS</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Court Cards Showcase Section (New Sporty Visuals) ──────────────── */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="size-3.5" /> Standar Fasilitas Lapangan
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Pilihan Lapangan Unggulan Venue
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-xl">
                Setiap jenis lapangan dilengkapi spesifikasi resmi, foto visual beresolusi tinggi,
                dan perhitungan tarif dinamis siang vs malam prime-time.
              </p>
            </div>

            <Link
              href="/book/champion-arena"
              className="mt-4 sm:mt-0 text-xs font-bold text-[#0053F1] hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
            >
              Lihat Kalender Booking Lengkap
              <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courtsShowcase.map((court) => (
              <div
                key={court.id}
                className="bg-[#FDFBF7] rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Header */}
                  <div className="relative h-52 w-full overflow-hidden">
                    <Image
                      src={court.image}
                      alt={court.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    <span className="absolute top-3 left-3 bg-[#0053F1] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                      {court.type}
                    </span>

                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                      {court.tag}
                    </span>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="text-lg font-extrabold leading-tight">{court.name}</div>
                      <div className="text-xs text-slate-200 flex items-center gap-2 mt-0.5">
                        <span>{court.surface}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Specs */}
                  <div className="p-5 space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {court.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded-xl p-2.5 border border-slate-200 text-center">
                        <Ruler className="size-3.5 text-[#0053F1] mx-auto mb-0.5" />
                        <div className="text-[10px] text-slate-400">Ukuran</div>
                        <div className="font-bold text-slate-800">{court.dimensions}</div>
                      </div>

                      <div className="bg-white rounded-xl p-2.5 border border-slate-200 text-center">
                        <Zap className="size-3.5 text-amber-500 mx-auto mb-0.5" />
                        <div className="text-[10px] text-slate-400">Kapasitas</div>
                        <div className="font-bold text-slate-800">{court.capacity}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer CTA & Price */}
                <div className="p-5 pt-0 border-t border-slate-200/60 mt-2 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Tarif Sewa</div>
                    <div className="text-sm font-extrabold text-slate-900">{court.rate}</div>
                  </div>

                  <Link
                    href="/book/champion-arena"
                    className="min-h-[40px] px-4 rounded-xl bg-[#0053F1] hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
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

      {/* ── Feature Grid Section ─────────────────────────────────────────────── */}
      <section className="py-16 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0053F1] block mb-2">
              Fitur Lengkap Sesuai PRD v1.0
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Dirancang Khusus untuk Kebiasaan Industri Futsal Indonesia
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="size-11 rounded-xl bg-blue-100/70 text-[#0053F1] flex items-center justify-center">
                        <Icon className="size-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Interactive POS & Member Callout Section ─────────────────────────── */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-[#1E293B] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 size-72 bg-[#0053F1]/20 rounded-full blur-2xl" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
                  <Smartphone className="size-3.5" /> Antarmuka Terpadu (FR-004 & FR-003)
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                  Kasir Resepsionis & Manajemen Member Rutin
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Pelunasan sisa tagihan sewa lapangan, input pesanan minuman dingin kantin,
                  sewa rompi pertandingan, hingga cetak struk thermal 58mm/80mm dalam satu layar terpadu.
                </p>

                <div className="space-y-2.5 mb-8 text-xs text-slate-300">
                  {highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/dashboard/pos"
                    className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all gap-2"
                  >
                    <Printer className="size-4" />
                    <span>Layar Kasir & Kantin POS</span>
                  </Link>

                  <Link
                    href="/book/champion-arena"
                    className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#0053F1] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all gap-2"
                  >
                    <span>Coba Reservasi Live</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>

              {/* POS Receipt Preview Mockup */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">Struk Kasir Thermal (58mm)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">BK-FUT-2611-042</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Sewa Lapangan 1 (2 Jam)</span>
                    <span className="font-semibold text-white">Rp 300.000</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>• DP Lunas via Midtrans QRIS</span>
                    <span className="text-emerald-400">-Rp 150.000</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>4x Pocari Sweat 500ml</span>
                    <span className="font-semibold text-white">Rp 40.000</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>1x Sewa Rompi Tim (1 Set)</span>
                    <span className="font-semibold text-white">Rp 25.000</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-white text-sm">
                    <span>Total Pelunasan Kasir:</span>
                    <span className="text-amber-400">Rp 215.000</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700">
                    <span>Metode Bayar:</span>
                    <span className="text-white">QRIS Dinamis / Tunai</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">StackPlus Futsal SaaS</span>
            <span>•</span>
            <span>Product Studio Initiative</span>
          </div>

          <div>
            Built with Next.js 16, NestJS 11, Prisma & Tailwind CSS v4.
          </div>
        </div>
      </footer>
    </div>
  );
}
