'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  CalendarDays,
  Plus,
  ArrowLeft,
  Users,
  Clock,
  X,
  Trophy,
} from 'lucide-react';

interface MemberContractItem {
  id: string;
  customerName: string;
  customerPhone: string;
  teamName: string;
  courtName: string;
  courtType: string;
  dayName: string;
  time: string;
  startDate: string;
  endDate: string;
  monthlyFee: number;
  totalSlots: number;
  isActive: boolean;
}

interface CourtOption {
  courtId: string;
  courtName: string;
  courtType: string;
}

export default function MembersDashboardPage() {
  const [contracts, setContracts] = useState<MemberContractItem[]>([]);
  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form input states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [teamName, setTeamName] = useState('');
  const [courtId, setCourtId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(4); // Default: Kamis
  const [startHour, setStartHour] = useState<number>(20); // Default: 20:00
  const [durationHours, setDurationHours] = useState<number>(2); // Default: 2 Jam
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [monthsDuration, setMonthsDuration] = useState<number>(1);
  const [monthlyFee, setMonthlyFee] = useState<number>(1200000);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchContracts = async () => {
      try {
        const [contractsRes, scheduleRes] = await Promise.all([
          api.get<MemberContractItem[]>(
            '/public/members/contracts?venueSlug=champion-arena',
          ),
          api.get<{ courts: CourtOption[] }>(
            '/public/venues/champion-arena/schedule',
          ),
        ]);
        if (isMounted) {
          setContracts(contractsRes.data);
          setCourts(scheduleRes.data.courts || []);
          if (scheduleRes.data.courts?.length > 0 && !courtId) {
            setCourtId(scheduleRes.data.courts[0].courtId);
          }
        }
      } catch {
        if (isMounted) {
          toast.error('Gagal memuat data member rutin.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchContracts();
    return () => {
      isMounted = false;
    };
  }, [courtId, refreshKey]);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !teamName || !courtId) {
      toast.error('Lengkapi semua data formulir member.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/public/members/contracts', {
        venueSlug: 'champion-arena',
        courtId,
        customerName,
        customerPhone,
        teamName,
        dayOfWeek,
        startHour,
        durationHours,
        startDate,
        monthsDuration,
        monthlyFee,
      });

      toast.success(
        `Kontrak member "${teamName}" berhasil dibuat & slot terkunci otomatis!`,
      );
      setShowAddModal(false);
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setTeamName('');
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Gagal membuat kontrak member.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelContract = async (id: string, name: string) => {
    if (
      !confirm(
        `Batalkan kontrak untuk "${name}"? Seluruh slot kalender akan dirilis kembali ke publik.`,
      )
    ) {
      return;
    }

    try {
      await api.delete(`/public/members/contracts/${id}`);
      toast.success('Kontrak member dibatalkan dan slot berhasil dirilis.');
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error('Gagal membatalkan kontrak.');
    }
  };

  const dayNames = [
    { val: 1, label: 'Senin' },
    { val: 2, label: 'Selasa' },
    { val: 3, label: 'Rabu' },
    { val: 4, label: 'Kamis' },
    { val: 5, label: 'Jumat' },
    { val: 6, label: 'Sabtu' },
    { val: 0, label: 'Minggu' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] antialiased">
      <Toaster position="top-center" />

      {/* ── Top Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#1E293B] text-white px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300 flex items-center gap-1">
                <Trophy className="size-3" /> Manajemen Jadwal Komunitas
              </span>
              <h1 className="text-base font-extrabold leading-tight">
                Kontrak Member Rutin (FR-003)
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-[#0053F1] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
          >
            <Plus className="size-4" />
            <span>Tambah Member Baru</span>
          </button>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
          <CalendarDays className="size-5 text-[#0053F1] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">
              Sistem Penguncian Otomatis (Recurring Slot Engine)
            </span>
            <p className="text-slate-600 leading-relaxed">
              Jadwal komunitas yang disetujui akan mengunci slot secara otomatis
              pada kalender publik (status <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800">MEMBER_LOCKED</code>) selama 1 s.d. 6 bulan, mencegah bentrok dengan pemesanan umum.
            </p>
          </div>
        </div>

        {/* List Member Contracts */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Daftar Komunitas Member Aktif ({contracts.length})
            </h2>
            <Link
              href="/book/champion-arena"
              className="text-xs text-[#0053F1] hover:underline font-bold"
            >
              Cek Kalender Booking Publik →
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
              Memuat data member...
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-3">
              <Users className="size-8 mx-auto text-slate-300" />
              <p>Belum ada kontrak member rutin aktif.</p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-[#0053F1] text-white text-xs font-bold rounded-xl"
              >
                Daftarkan Member Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contracts.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-100 text-[#0053F1] uppercase">
                        {c.courtName}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {c.totalSlots} Slot Terkunci
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      {c.teamName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      PIC: {c.customerName} ({c.customerPhone})
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Clock className="size-3.5 text-[#0053F1]" />
                        <span>
                          Setiap {c.dayName}, {c.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <CalendarDays className="size-3.5 text-slate-400" />
                        <span>
                          {c.startDate} s.d. {c.endDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">
                        Iuran Bulanan
                      </div>
                      <div className="text-xs font-extrabold text-slate-900">
                        Rp {c.monthlyFee.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCancelContract(c.id, c.teamName)}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Batal Kontrak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Modal Tambah Kontrak Member Rutin ──────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CalendarDays className="size-5 text-[#0053F1]" />
                Pendaftaran Kontrak Member Rutin
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="size-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  Nama Komunitas / Tim
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Contoh: Komunitas Anak Futsal FC"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0053F1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    Nama Kapten / PIC
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Budi Santoso"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0053F1]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    No. WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0053F1]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  Pilih Lapangan
                </label>
                <select
                  value={courtId}
                  onChange={(e) => setCourtId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0053F1]"
                >
                  {courts.map((court) => (
                    <option key={court.courtId} value={court.courtId}>
                      {court.courtName} ({court.courtType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    Hari Rutin
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0053F1]"
                  >
                    {dayNames.map((d) => (
                      <option key={d.val} value={d.val}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    Jam Mulai
                  </label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0053F1]"
                  >
                    {[7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map(
                      (h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')}:00 WIB
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    Durasi
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0053F1]"
                  >
                    <option value={1}>1 Jam</option>
                    <option value={2}>2 Jam</option>
                    <option value={3}>3 Jam</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0053F1]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">
                    Lama Kontrak
                  </label>
                  <select
                    value={monthsDuration}
                    onChange={(e) => setMonthsDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0053F1]"
                  >
                    <option value={1}>1 Bulan</option>
                    <option value={2}>2 Bulan</option>
                    <option value={3}>3 Bulan</option>
                    <option value={6}>6 Bulan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">
                  Tarif Iuran Bulanan (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Number(e.target.value))}
                  placeholder="1200000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0053F1]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[46px] rounded-xl bg-[#0053F1] hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Mengunci Slot Kalender...'
                    : 'Konfirmasi Kontrak & Kunci Slot Kalender'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
