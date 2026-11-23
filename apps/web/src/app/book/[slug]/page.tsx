'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import { api } from '@/lib/axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  Copy,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface HourlySlot {
  hour: number;
  timeLabel: string;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED' | 'MEMBER_LOCKED';
  rate: number;
  lockedUntil?: string;
}

interface CourtSchedule {
  courtId: string;
  courtName: string;
  courtType: string;
  slots: HourlySlot[];
}

interface VenueScheduleData {
  venue: {
    id: string;
    name: string;
    slug: string;
    phone?: string;
    address: string;
    city: string;
    openHour: number;
    closeHour: number;
    defaultDpPercent: number;
    timezone: string;
  };
  date: string;
  courts: CourtSchedule[];
}

interface BookingSuccessData {
  bookingId: string;
  bookingCode: string;
  status: string;
  expiresAt: string;
  courtTotal: number;
  depositAmount: number;
  remainingDue: number;
  court: { name: string; type: string };
  date: string;
  startHour: number;
  endHour: number;
}

export default function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const venueSlug = resolvedParams.slug;

  // ── States ─────────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [scheduleData, setScheduleData] = useState<VenueScheduleData | null>(
    null,
  );
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] =
    useState<BookingSuccessData | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  const [isOpenSparring, setIsOpenSparring] = useState<boolean>(false);
  const [sparringLevel, setSparringLevel] = useState<string>('Casual / Santai');
  const [notes, setNotes] = useState<string>('');

  // ── 7 Hari ke Depan untuk Date Picker ───────────────────────────────────────
  const next7Days = useMemo(() => {
    const dates = [];
    const now = new Date();
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      dates.push({
        iso,
        dayName: i === 0 ? 'Hari Ini' : dayNames[d.getDay()],
        dateNum: d.getDate(),
        month: monthNames[d.getMonth()],
      });
    }
    return dates;
  }, []);

  const reloadSchedule = async (date: string) => {
    try {
      const res = await api.get<VenueScheduleData>(
        `/public/venues/${venueSlug}/schedule?date=${date}`,
      );
      setScheduleData(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await api.get<VenueScheduleData>(
          `/public/venues/${venueSlug}/schedule?date=${selectedDate}`,
        );
        if (isMounted) {
          setScheduleData(res.data);
          if (res.data.courts.length > 0) {
            setSelectedCourtId((prev) => prev || res.data.courts[0].courtId);
          }
        }
      } catch {
        if (isMounted) {
          toast.error('Gagal memuat jadwal venue. Silakan coba lagi.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [venueSlug, selectedDate]);

  // Lapangan aktif yang sedang dipilih
  const currentCourt = useMemo(() => {
    if (!scheduleData || !scheduleData.courts.length) return null;
    return (
      scheduleData.courts.find((c) => c.courtId === selectedCourtId) ||
      scheduleData.courts[0]
    );
  }, [scheduleData, selectedCourtId]);

  // ── Multi-hour Slot Selection ──────────────────────────────────────────────
  const toggleHour = (hour: number, status: string) => {
    if (status !== 'AVAILABLE') return;

    if (selectedHours.includes(hour)) {
      // Hapus pilihan jam
      setSelectedHours(selectedHours.filter((h) => h !== hour));
      return;
    }

    if (selectedHours.length === 0) {
      setSelectedHours([hour]);
      return;
    }

    // Pastikan jam yang dipilih berurutan (consecutive)
    const min = Math.min(...selectedHours);
    const max = Math.max(...selectedHours);

    if (hour === min - 1) {
      setSelectedHours([hour, ...selectedHours].sort((a, b) => a - b));
    } else if (hour === max + 1) {
      setSelectedHours([...selectedHours, hour].sort((a, b) => a - b));
    } else {
      // Reset dan mulai pilih dari jam baru
      setSelectedHours([hour]);
    }
  };

  // ── Kalkulasi Total & DP ───────────────────────────────────────────────────
  const { totalCost, depositCost } = useMemo(() => {
    if (!currentCourt || selectedHours.length === 0)
      return { totalCost: 0, depositCost: 0 };
    let sum = 0;
    for (const h of selectedHours) {
      const slot = currentCourt.slots.find((s) => s.hour === h);
      if (slot) sum += slot.rate;
    }
    const dpPercent = scheduleData?.venue.defaultDpPercent ?? 50;
    const rawDp = Math.ceil((sum * dpPercent) / 100);
    // Bulatkan ke kelipatan 1000
    const remainder = rawDp % 1000;
    const dp = remainder === 0 ? rawDp : rawDp + (1000 - remainder);
    return { totalCost: sum, depositCost: dp };
  }, [currentCourt, selectedHours, scheduleData]);

  // ── Submit Booking ─────────────────────────────────────────────────────────
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Nama dan Nomor WhatsApp wajib diisi!');
      return;
    }
    if (selectedHours.length === 0) {
      toast.error('Pilih minimal 1 jam sewa lapangan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const startHour = Math.min(...selectedHours);
      const durationHours = selectedHours.length;

      const res = await api.post<BookingSuccessData>('/public/bookings', {
        venueSlug,
        courtId: selectedCourtId || currentCourt?.courtId,
        bookingDate: selectedDate,
        startHour,
        durationHours,
        customerName,
        customerPhone,
        teamName: teamName || undefined,
        isOpenSparring,
        sparringLevel: isOpenSparring ? sparringLevel : undefined,
        notes: notes || undefined,
      });

      setBookingSuccess(res.data);
      setShowFormModal(false);
      toast.success('Slot berhasil dikunci! Selesaikan DP dalam 15 menit.');
      reloadSchedule(selectedDate);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Gagal membuat reservasi. Slot mungkin telah dipesan.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Countdown Timer 15 Menit untuk Booking Success Screen ───────────────────
  const [timeLeft, setTimeLeft] = useState<string>('15:00');
  useEffect(() => {
    if (!bookingSuccess?.expiresAt) return;
    const interval = setInterval(() => {
      const diff = new Date(bookingSuccess.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00 (Kedaluwarsa)');
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(
          `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
        );
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [bookingSuccess]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] antialiased">
      <Toaster position="top-center" />

      {/* ── Top Header (Sporty Mobile-First) ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#0053F1] text-white px-4 py-3.5 shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-200 flex items-center gap-1">
              <Sparkles className="size-3" /> StackPlus Futsal SaaS
            </span>
            <h1 className="text-lg font-bold leading-tight">
              {scheduleData?.venue.name || 'Pemesanan Lapangan'}
            </h1>
            <p className="text-xs text-blue-100 flex items-center gap-1 mt-0.5">
              <MapPin className="size-3.5 shrink-0" />
              {scheduleData?.venue.city || 'Indonesia'}
            </p>
          </div>
          {scheduleData?.venue.phone && (
            <a
              href={`https://wa.me/${scheduleData.venue.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-full p-2.5 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Kontak WhatsApp Venue"
            >
              <Phone className="size-5" />
            </a>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 pb-28">
        {/* ── 1. Horizontal Date Picker Chips ───────────────────────────────── */}
        <section className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Calendar className="size-3.5 text-[#0053F1]" /> Pilih Tanggal
            Bermain
          </label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {next7Days.map((d) => {
              const isSelected = selectedDate === d.iso;
              return (
                <button
                  key={d.iso}
                  onClick={() => setSelectedDate(d.iso)}
                  type="button"
                  className={`shrink-0 flex flex-col items-center justify-center w-[72px] h-[76px] rounded-xl border text-center transition-all touch-manipulation ${
                    isSelected
                      ? 'bg-[#0053F1] text-white border-[#0053F1] shadow-md ring-2 ring-[#0053F1]/30 font-semibold'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 active:bg-slate-50'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wide opacity-80">
                    {d.dayName}
                  </span>
                  <span className="text-lg font-bold leading-tight my-0.5">
                    {d.dateNum}
                  </span>
                  <span className="text-[10px] opacity-75">{d.month}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 2. Lapangan (Courts) Tab Pills ─────────────────────────────────── */}
        {scheduleData && scheduleData.courts.length > 0 && (
          <section className="mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              Pilih Lapangan
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {scheduleData.courts.map((court) => {
                const isSelected =
                  (selectedCourtId || currentCourt?.courtId) === court.courtId;
                return (
                  <button
                    key={court.courtId}
                    type="button"
                    onClick={() => {
                      setSelectedCourtId(court.courtId);
                      setSelectedHours([]);
                    }}
                    className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all touch-manipulation flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{court.courtName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {court.courtType.replace('FUTSAL_', '').replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 3. Legend Status ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 mb-4 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="size-3 rounded-full bg-emerald-500" />
            <span>Tersedia</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="size-3 rounded-full bg-[#0053F1]" />
            <span>Dipilih</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="size-3 rounded-full bg-amber-400" />
            <span>Proses Bayar (15m)</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="size-3 rounded-full bg-slate-400" />
            <span>Terisi</span>
          </div>
        </div>

        {/* ── 4. Matriks Jam Sewa (Touch Target Min 44x44px) ─────────────────── */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="size-4 text-[#0053F1]" /> Matriks Jam
              Operasional
            </h2>
            <span className="text-[11px] text-slate-500">
              Sentuh jam untuk memilih
            </span>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
              Memuat ketersediaan slot...
            </div>
          ) : !currentCourt ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
              Tidak ada lapangan aktif di venue ini.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {currentCourt.slots.map((slot) => {
                const isSelected = selectedHours.includes(slot.hour);
                const isAvailable = slot.status === 'AVAILABLE';
                const isLocked = slot.status === 'LOCKED';
                const isBooked = slot.status === 'BOOKED';
                const isMember = slot.status === 'MEMBER_LOCKED';

                return (
                  <button
                    key={slot.hour}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => toggleHour(slot.hour, slot.status)}
                    className={`min-h-[58px] p-2.5 rounded-xl border text-left transition-all touch-manipulation flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#0053F1] text-white border-[#0053F1] shadow-md ring-2 ring-[#0053F1]/40'
                        : isAvailable
                          ? 'bg-white hover:border-emerald-400 active:bg-emerald-50 text-slate-800 border-slate-200'
                          : isLocked
                            ? 'bg-amber-50 border-amber-200 text-amber-800 cursor-not-allowed opacity-80'
                            : isMember
                              ? 'bg-purple-50 border-purple-200 text-purple-800 cursor-not-allowed opacity-80'
                              : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold font-mono">
                        {String(slot.hour).padStart(2, '0')}:00
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="size-4 text-white" />
                      ) : isLocked ? (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1 rounded">
                          Lock
                        </span>
                      ) : isMember ? (
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/80 px-1 rounded">
                          Member
                        </span>
                      ) : isBooked ? (
                        <span className="text-[10px] text-slate-400">Penuh</span>
                      ) : (
                        <span className="size-2 rounded-full bg-emerald-500" />
                      )}
                    </div>

                    <div className="mt-1 flex items-baseline justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-white' : 'text-[#0053F1]'
                        }`}
                      >
                        Rp {(slot.rate / 1000).toLocaleString('id-ID')}rb
                      </span>
                      <span
                        className={`text-[10px] ${
                          isSelected ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        /jam
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ── 5. Bottom Sticky Action Bar ──────────────────────────────────────── */}
      {selectedHours.length > 0 && (
        <aside className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl p-4">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">
                {selectedHours.length} Jam Dipilih (
                {String(Math.min(...selectedHours)).padStart(2, '0')}:00 –{' '}
                {String(Math.max(...selectedHours) + 1).padStart(2, '0')}:00)
              </div>
              <div className="text-base font-extrabold text-[#0053F1]">
                Rp {totalCost.toLocaleString('id-ID')}
                <span className="text-xs font-normal text-slate-500 ml-1.5">
                  (DP: Rp {depositCost.toLocaleString('id-ID')})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFormModal(true)}
              className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#0053F1] hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md transition-all touch-manipulation flex items-center gap-2"
            >
              <span>Lanjut Pesan</span>
              <ChevronRight className="size-4" />
            </button>
          </div>
        </aside>
      )}

      {/* ── 6. Modal Formulir Data Pemesan ─────────────────────────────────────── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Data Pemesan Lapangan
              </h3>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="size-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Rincian Sewa Singkat */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 my-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Lapangan:</span>
                <span className="font-semibold text-slate-800">
                  {currentCourt?.courtName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Jadwal:</span>
                <span className="font-semibold text-slate-800">
                  {selectedDate},{' '}
                  {String(Math.min(...selectedHours)).padStart(2, '0')}:00 –{' '}
                  {String(Math.max(...selectedHours) + 1).padStart(2, '0')}:00 (
                  {selectedHours.length} Jam)
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-blue-200/60 font-bold">
                <span className="text-slate-800">Wajib DP (Kunci 15m):</span>
                <span className="text-[#0053F1]">
                  Rp {depositCost.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitBooking} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Pemesan / Kapten <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Budi Santoso"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0053F1] focus:ring-1 focus:ring-[#0053F1] text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Misal: 081234567890"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0053F1] focus:ring-1 focus:ring-[#0053F1] text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Bukti booking dan reminder akan dikirim ke nomor ini.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Tim (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Garuda Futsal Club"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0053F1] focus:ring-1 focus:ring-[#0053F1] text-sm"
                />
              </div>

              {/* Opsi Komunitas: Cari Lawan Sparring (FR-005) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isOpenSparring}
                    onChange={(e) => setIsOpenSparring(e.target.checked)}
                    className="size-4 text-[#0053F1] rounded border-slate-300 focus:ring-[#0053F1]"
                  />
                  <span>Buka Lowongan Sparring (Cari Lawan Tanding)</span>
                </label>

                {isOpenSparring && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200">
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Level Tim:
                    </label>
                    <select
                      value={sparringLevel}
                      onChange={(e) => setSparringLevel(e.target.value)}
                      className="w-full h-9 px-2 rounded border border-slate-300 text-xs bg-white"
                    >
                      <option value="Casual / Santai">Casual / Santai (Fun Footy)</option>
                      <option value="Menengah / Semi-Pro">Menengah / Semi-Pro</option>
                      <option value="Kompetitif">Kompetitif / Serius</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: butuh sewa rompi tim 1 set"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-[#0053F1] focus:ring-1 focus:ring-[#0053F1] text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[46px] rounded-xl bg-[#0053F1] hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md transition-all touch-manipulation flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Mengunci Slot Waktu...'
                  ) : (
                    <>
                      <span>Kunci Slot & Bayar DP</span>
                      <ChevronRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. Layar Sukses Booking & Countdown Lock (15 Menit) ────────────────── */}
      {bookingSuccess && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="size-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="size-8" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              Slot Berhasil Dikunci!
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Selesaikan pembayaran uang muka (DP) sebelum batas waktu berakhir.
            </p>

            {/* Countdown Box */}
            <div className="my-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                <Clock className="size-4 text-amber-600 animate-pulse" />
                <span>Batas Waktu Bayar:</span>
              </div>
              <span className="font-mono text-base font-extrabold text-amber-700">
                {timeLeft}
              </span>
            </div>

            {/* Booking Details */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left text-xs space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Kode Booking:</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(bookingSuccess.bookingCode);
                    toast.success('Kode booking disalin!');
                  }}
                  className="font-mono font-bold text-[#0053F1] flex items-center gap-1 hover:underline"
                >
                  {bookingSuccess.bookingCode}
                  <Copy className="size-3" />
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lapangan:</span>
                <span className="font-semibold text-slate-800">
                  {bookingSuccess.court.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jadwal:</span>
                <span className="font-semibold text-slate-800">
                  {bookingSuccess.date},{' '}
                  {String(bookingSuccess.startHour).padStart(2, '0')}:00 –{' '}
                  {String(bookingSuccess.endHour).padStart(2, '0')}:00
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                <span className="text-slate-800">Jumlah Wajib DP:</span>
                <span className="text-emerald-600 text-sm">
                  Rp {bookingSuccess.depositAmount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Pelunasan di Kasir:</span>
                <span>
                  Rp {bookingSuccess.remainingDue.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  toast.success(
                    'Simulasi pembayaran DP berhasil diterima sistem.',
                  );
                  setBookingSuccess(null);
                }}
                className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all touch-manipulation"
              >
                Bayar DP Sekarang (QRIS / Midtrans Sandbox)
              </button>

              <button
                type="button"
                onClick={() => setBookingSuccess(null)}
                className="w-full min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all touch-manipulation"
              >
                Tutup & Kembali ke Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
