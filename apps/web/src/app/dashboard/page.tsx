'use client';

import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  CalendarDays,
  Users,
  Clock,
  Printer,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function Dashboard() {

  const stats = [
    {
      label: 'Omzet Hari Ini',
      value: 'Rp 2.450.000',
      change: '+18% vs kemarin',
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Okupansi Lapangan',
      value: '82%',
      change: '18 dari 22 jam terisi',
      icon: Clock,
      color: 'text-[#0053F1] bg-blue-50 border-blue-200',
    },
    {
      label: 'Member Komunitas',
      value: '3 Tim',
      change: '12 jam terkunci otomatis',
      icon: Users,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      label: 'Booking Terkonfirmasi',
      value: '8 Reservasi',
      change: 'Nol insiden bentrok',
      icon: CheckCircle2,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
  ];

  const modules = [
    {
      title: 'Kasir POS & Pelunasan Kantin',
      code: 'FR-004',
      badge: 'Integrated POS',
      description:
        'Pelunasan sisa tagihan sewa lapangan di meja resepsionis, penjualan minuman botol dingin, sewa rompi tim, dan cetak struk thermal 58mm/80mm.',
      icon: Printer,
      link: '/dashboard/pos',
      btnText: 'Buka Layar Kasir',
      color: 'border-emerald-200 bg-emerald-50/40 text-emerald-700',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      title: 'Kontrak Member Rutin Komunitas',
      code: 'FR-003',
      badge: 'Recurring Slots',
      description:
        'Pendaftaran jadwal mingguan komunitas futsal (1 s.d. 6 bulan). Mengunci otomatis seluruh slot kalender publik agar tidak bisa dipesan umum.',
      icon: CalendarDays,
      link: '/dashboard/members',
      btnText: 'Kelola Member',
      color: 'border-blue-200 bg-blue-50/40 text-[#0053F1]',
      btnColor: 'bg-[#0053F1] hover:bg-blue-700 text-white',
    },
    {
      title: 'Kalender Booking Publik (Pemain)',
      code: 'FR-001 & FR-002',
      badge: 'Atomic Lock',
      description:
        'Antarmuka mobile pemain: matriks ketersediaan slot 24 jam real-time, penguncian DP 15 menit otomatis, dan integrasi Midtrans QRIS.',
      icon: Calendar,
      link: '/book/champion-arena',
      btnText: 'Buka Jadwal Publik',
      color: 'border-amber-200 bg-amber-50/40 text-amber-700',
      btnColor: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    {
      title: 'Manajemen Staf & Hak Akses',
      code: 'Security Guard',
      badge: 'RBAC',
      description:
        'Kelola akun pengguna, staf kasir, manajer operasional, dan akun pemilik venue (Venue Owner & Super Admin).',
      icon: Users,
      link: '/dashboard/users',
      btnText: 'Kelola Pengguna',
      color: 'border-slate-200 bg-slate-50 text-slate-700',
      btnColor: 'bg-slate-800 hover:bg-slate-900 text-white',
    },
  ];

  const recentBookings = [
    {
      code: 'BK-FUT-2611-042',
      court: 'Lapangan 1 - Vinyl Pro',
      team: 'Komunitas Anak Futsal FC',
      time: '19:00 – 21:00 WIB',
      status: 'CONFIRMED',
      dp: 'Rp 150.000 (Lunas DP)',
      remaining: 'Rp 150.000',
    },
    {
      code: 'BK-FUT-2611-043',
      court: 'Lapangan 2 - Rumput Sintetis',
      team: 'Bhayangkara FC',
      time: '17:00 – 19:00 WIB',
      status: 'PLAYING',
      dp: 'Rp 175.000 (Lunas DP)',
      remaining: 'Rp 175.000',
    },
    {
      code: 'BK-FUT-2611-044',
      court: 'Mini Soccer Stadium',
      team: 'Garuda Muda FC',
      time: '20:00 – 22:00 WIB',
      status: 'COMPLETED',
      dp: 'Rp 300.000 (Lunas Kasir)',
      remaining: 'Rp 0',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] antialiased">
      <Toaster position="top-center" />

      {/* ── Top Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#1E293B] text-white px-4 sm:px-6 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-black shadow-xs transition-colors"
            >
              <Trophy className="size-5 text-amber-400" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold leading-tight">
                  Champion Arena Futsal & Mini Soccer
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline">
                  🟢 Shift Kasir Aktif
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="size-3 text-slate-400" />
                <span>Jl. Prof. Soedarto No. 12, Semarang</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300">Akun: Super Admin</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
            >
              Lihat Web Publik
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Body ──────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-500 font-semibold">
                    {s.label}
                  </span>
                  <div className={`p-2 rounded-xl border ${s.color}`}>
                    <Icon className="size-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {s.value}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {s.change}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Core Modules Grid (Card UI System V3) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Modul Operasional Venue (M1 s.d. M4)
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Semua modul terintegrasi secara atomik
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                          <Icon className="size-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 font-mono">
                          {m.code}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${m.color}`}
                      >
                        {m.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {m.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      href={m.link}
                      className={`w-full min-h-[42px] px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${m.btnColor}`}
                    >
                      <span>{m.btnText}</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Operational Monitoring / Recent Bookings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Aktivitas Reservasi Hari Ini
              </h3>
              <p className="text-xs text-slate-400">
                Pembaruan jadwal terkini di kasir dan kalender
              </p>
            </div>
            <Link
              href="/dashboard/pos"
              className="text-xs font-bold text-[#0053F1] hover:underline"
            >
              Buka di Kasir POS →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentBookings.map((b, idx) => (
              <div
                key={idx}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#0053F1]">
                      {b.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === 'CONFIRMED'
                          ? 'bg-blue-100 text-blue-800'
                          : b.status === 'PLAYING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5">
                    {b.team} · {b.court}
                  </div>
                  <div className="text-[11px] text-slate-400">{b.time}</div>
                </div>

                <div className="text-left sm:text-right text-xs">
                  <div className="font-semibold text-slate-800">{b.dp}</div>
                  <div className="text-[11px] text-slate-500">
                    Sisa Kasir: <strong className="text-amber-700">{b.remaining}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
