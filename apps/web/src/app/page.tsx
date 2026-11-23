import Link from 'next/link';
import {
  Clock,
  CreditCard,
  Users,
  ShoppingBag,
  BarChart3,
  ArrowRight,
  Sparkles,
  Smartphone,
  CheckCircle2,
  Trophy,
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Clock,
      title: 'Anti Double-Booking & Atomic Lock',
      description:
        'Sistem penguncian slot otomatis selama 15 menit saat pemain memproses pembayaran DP. Menjamin nol risiko tabrakan jadwal antar pemesan.',
      badge: 'Real-Time Concurrency',
    },
    {
      icon: CreditCard,
      title: 'Anti No-Show Payment Gateway',
      description:
        'Wajib uang muka (DP 50% atau flat) via QRIS & Virtual Account Midtrans. Hilangkan kerugian venue akibat tim yang ghosting di jam sibuk.',
      badge: 'Midtrans Ready',
    },
    {
      icon: Sparkles,
      title: 'Smart Dynamic Pricing Engine',
      description:
        'Penetapan harga otomatis berdasarkan jam sewa: Siang hemat, Sore normal, dan Malam Prime-Time, serta pembedaan tarif Weekday vs Weekend.',
      badge: 'Otomatis',
    },
    {
      icon: ShoppingBag,
      title: 'Kasir Kantin & Sewa Alat (Integrated POS)',
      description:
        'Resepsionis dapat menggabungkan pelunasan sewa lapangan dengan pesanan minuman botol dan sewa rompi tim dalam satu invoice struk kasir.',
      badge: 'All-in-One POS',
    },
    {
      icon: Users,
      title: 'Papan Cari Lawan Sparring',
      description:
        'Tim yang sudah booking dapat membuka status tantangan sparring dengan level santai hingga kompetitif untuk memperluas komunitas venue.',
      badge: 'Fitur Komunitas',
    },
    {
      icon: BarChart3,
      title: 'Laporan Okupansi & Tutup Kasir',
      description:
        'Analisis persentase jam terisi per lapangan, rekap omzet sewa vs kantin, dan verifikasi fisik uang laci saat pergantian shift kasir.',
      badge: 'Financial Audit',
    },
  ];

  const highlights = [
    'Pemesanan publik instan 90 detik via mobile (tanpa wajib unduh aplikasi)',
    'Proteksi multi-tenant & hak akses berjenjang (Owner, Manager, Cashier, Player)',
    'Kalkulasi tarif proporsional per jam dengan desimal pembulatan nol',
    'Struk thermal kasir 58mm/80mm & integrasi bukti booking WhatsApp',
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
              href="/dashboard"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Masuk Dashboard
            </Link>
            <Link
              href="/book/champion-arena"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold bg-[#0053F1] hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm transition-all shadow-blue-500/20"
            >
              Coba Booking Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#0053F1] text-xs font-semibold mb-6">
            <Sparkles className="size-3.5" />
            <span>Next-Gen Futsal & Mini Soccer Operating System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
            Tingkatkan Okupansi Venue,{' '}
            <span className="text-[#0053F1] underline decoration-[#0053F1]/30 underline-offset-8">
              Bebas Ghosting & Tabrakan Jadwal
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Platform SaaS all-in-one untuk pemilik venue futsal & mini soccer:
            reservasi online mobile 90-detik, penguncian DP instan anti no-show,
            tarif dinamis malam prime-time, serta kasir POS kantin dalam satu struk.
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
              href="/dashboard"
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Dashboard Pengelola</span>
            </Link>
          </div>

          {/* Social proof chips */}
          <div className="mt-12 pt-8 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div>
              <div className="text-2xl font-extrabold text-slate-900">&lt; 90 Detik</div>
              <div className="text-xs text-slate-500 font-medium">Kecepatan Booking Pemain</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-600">0 Insiden</div>
              <div className="text-xs text-slate-500 font-medium">Bentrok Double-Booking</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#0053F1]">15 Menit</div>
              <div className="text-xs text-slate-500 font-medium">Atomic Slot Lock Window</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900">1 Invoice</div>
              <div className="text-xs text-slate-500 font-medium">Sewa Lapangan + Kantin POS</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Grid Section ─────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-y border-slate-200">
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
                  className="bg-[#FDFBF7] p-6 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="size-11 rounded-xl bg-blue-100/70 text-[#0053F1] flex items-center justify-center">
                        <Icon className="size-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
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

      {/* ── Interactive Demo Preview Callout ─────────────────────────────────── */}
      <section className="py-16 bg-[#FDFBF7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-[#1E293B] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 size-72 bg-[#0053F1]/20 rounded-full blur-2xl" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
                  <Smartphone className="size-3.5" /> Antarmuka Mobile-First
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                  Coba Alur Reservasi Mandiri Pemain Sekarang
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Uji coba matriks ketersediaan slot 24 jam, pilih jam malam prime-time,
                  dan saksikan perhitungan DP 50% serta countdown penguncian 15 menit secara real-time.
                </p>

                <div className="space-y-2.5 mb-8 text-xs text-slate-300">
                  {highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/book/champion-arena"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#0053F1] hover:bg-blue-600 text-white font-bold text-sm shadow-md transition-all gap-2"
                >
                  <span>Buka Demo Booking Pemain</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              {/* Mock visual card */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">Live Slot Matrix</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Champion Arena</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                    <div className="text-slate-400 text-[10px]">17:00 – 18:00 (Sore)</div>
                    <div className="text-white font-bold text-sm">Rp 200.000</div>
                    <div className="text-emerald-400 text-[10px] font-semibold mt-1">● Tersedia</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-600 text-white border border-blue-500 shadow-sm">
                    <div className="text-blue-200 text-[10px]">19:00 – 20:00 (Malam)</div>
                    <div className="font-extrabold text-sm">Rp 300.000</div>
                    <div className="text-blue-100 text-[10px] font-semibold mt-1">✓ Dipilih Anda</div>
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Durasi Sewa:</span>
                    <span className="text-white font-medium">1 Jam (Prime-Time)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Wajib DP (50%):</span>
                    <span className="text-emerald-400 font-bold">Rp 150.000</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Atomic Lock:</span>
                    <span className="text-amber-400 font-semibold">14:59 tersisa</span>
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
