'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import Image from 'next/image';
import { api } from '@/lib/axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  Copy,
  Sparkles,
  X,
  Maximize2,
  Ruler,
  Zap,
  ChevronRight,
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

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (error: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

// ── Mock Court Details (gambar dan info statis per tipe lapangan) ─────────────
const COURT_MOCK_DATA: Record<
  string,
  {
    images: string[];
    description: string;
    features: string[];
    dimensions?: string;
    surface: string;
    capacity: string;
  }
> = {
  FUTSAL_VINYL: {
    images: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80',
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
    ],
    description:
      'Lapangan futsal premium dengan lantai vinyl interlock anti-slip yang lembut di kaki. Cocok untuk pertandingan kompetitif maupun latihan rutin.',
    features: [
      'Lantai Vinyl Interlock Anti-Slip',
      'Lampu LED 500W Full Bright',
      'Net Gawang Standar Internasional',
      'AC Sirkulasi Udara',
      'CCTV 24 Jam',
    ],
    dimensions: '26m × 16m',
    surface: 'Vinyl Interlock',
    capacity: '5 vs 5',
  },
  FUTSAL_SYNTHETIC: {
    images: [
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80',
    ],
    description:
      'Rumput sintetis monofilamen tebal dengan infill pasir silika dan rubber granule. Sensasi bermain menyerupai lapangan rumput alami dengan perawatan minimal.',
    features: [
      'Rumput Sintetis Monofilamen 50mm',
      'Infill Pasir Silika + Rubber Granule',
      'Lampu LED 1000W Stadium',
      'Tribun Mini Penonton',
      'Ruang Ganti Lengkap',
    ],
    dimensions: '28m × 18m',
    surface: 'Rumput Sintetis',
    capacity: '5 vs 5',
  },
  FUTSAL_INTERLOCK: {
    images: [
      'https://images.unsplash.com/photo-1543357486-54d4a8f0a50d?w=800&q=80',
    ],
    description: 'Lapangan futsal dengan lantai interlock modular yang kokoh.',
    features: ['Lantai Interlock Modular', 'Lampu LED', 'Gawang Standar'],
    dimensions: '25m × 16m',
    surface: 'Interlock',
    capacity: '5 vs 5',
  },
  MINI_SOCCER_OUTDOOR: {
    images: [
      'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80',
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
    ],
    description:
      'Lapangan mini soccer outdoor berukuran besar dengan pencahayaan lampu LED stadium 1000W. Ideal untuk turnamen 7 vs 7 dan komunitas sepak bola.',
    features: [
      'Rumput Sintetis Outdoor Weatherproof',
      'Lampu LED Stadium 1000W × 4 Tiang',
      'Gawang Full Size Mini Soccer',
      'Tribun Penonton Kapasitas 50 Org',
      'Parkir Luas',
      'Toilet & Musholla',
    ],
    dimensions: '50m × 30m',
    surface: 'Rumput Sintetis Outdoor',
    capacity: '7 vs 7',
  },
  MINI_SOCCER_INDOOR: {
    images: [
      'https://images.unsplash.com/photo-1540747913346-19212a4efe8e?w=800&q=80',
    ],
    description: 'Lapangan mini soccer indoor ber-AC dengan pencahayaan optimal.',
    features: ['Indoor Ber-AC', 'Lampu LED', 'Rumput Sintetis', 'Tribun Mini'],
    dimensions: '45m × 28m',
    surface: 'Rumput Sintetis Indoor',
    capacity: '7 vs 7',
  },
};

function getCourtMock(courtType: string) {
  const key = courtType.replace('FUTSAL_', 'FUTSAL_').replace('MINI_SOCCER_', 'MINI_SOCCER_');
  return COURT_MOCK_DATA[key] || COURT_MOCK_DATA['FUTSAL_VINYL'];
}

function formatCourtType(type: string): string {
  return type
    .replace('FUTSAL_', '')
    .replace('MINI_SOCCER_', 'MINI SOCCER ')
    .replace('_', ' ');
}

// ── Court Detail Modal ────────────────────────────────────────────────────────
function CourtDetailModal({
  court,
  isSelected,
  onSelect,
  onClose,
}: {
  court: CourtSchedule;
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  const mock = getCourtMock(court.courtType);
  const [activeImg, setActiveImg] = useState(0);

  const availableCount = court.slots.filter((s) => s.status === 'AVAILABLE').length;
  const minRate = court.slots.reduce((min, s) => (s.rate < min ? s.rate : min), Infinity);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90dvh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-52">
          <Image
            src={mock.images[activeImg]}
            alt={court.courtName}
            fill
            className="object-cover rounded-t-3xl sm:rounded-t-2xl"
          />
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 size-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="size-4" />
          </button>
          {/* Image Thumbnails */}
          {mock.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {mock.images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImg(idx)}
                  className={`size-2 rounded-full transition-all ${
                    idx === activeImg ? 'bg-white scale-125' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
          {/* Type Badge */}
          <span className="absolute top-3 left-3 bg-[#0053F1] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
            {formatCourtType(court.courtType)}
          </span>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{court.courtName}</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mock.description}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Ruler, label: 'Ukuran', value: mock.dimensions || '-' },
              { icon: Zap, label: 'Kapasitas', value: mock.capacity },
              { icon: Clock, label: 'Tersedia', value: `${availableCount} Slot` },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100"
              >
                <Icon className="size-4 text-[#0053F1] mx-auto mb-1" />
                <div className="text-[11px] text-slate-500">{label}</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{value}</div>
              </div>
            ))}
          </div>

          {/* Surface & Min Rate */}
          <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3 border border-blue-100">
            <div>
              <div className="text-[11px] text-blue-600 font-semibold">Permukaan Lapangan</div>
              <div className="text-sm font-bold text-blue-900">{mock.surface}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-blue-600 font-semibold">Mulai Dari</div>
              <div className="text-sm font-bold text-blue-900">
                Rp {minRate === Infinity ? '-' : minRate.toLocaleString('id-ID')}/jam
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Fasilitas & Keunggulan
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {mock.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="size-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                    ✓
                  </span>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Thumbnail Strip (kalau lebih dari 1 gambar) */}
          {mock.images.length > 1 && (
            <div className="flex gap-2">
              {mock.images.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImg(idx)}
                  className={`flex-1 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    idx === activeImg
                      ? 'border-[#0053F1] opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image src={src} alt="" fill className="object-cover" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={() => {
              onSelect();
              onClose();
            }}
            className={`w-full min-h-[50px] rounded-xl font-bold text-sm shadow-md transition-all touch-manipulation ${
              isSelected
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#0053F1] hover:bg-blue-700 text-white'
            }`}
          >
            {isSelected ? '✓ Lapangan Ini Sudah Dipilih' : 'Pilih Lapangan Ini & Lihat Jadwal'}
          </button>
        </div>
      </div>
    </div>
  );
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
  // Court detail modal state
  const [detailCourt, setDetailCourt] = useState<CourtSchedule | null>(null);

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
  const [isPaying, setIsPaying] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

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

  // ── Midtrans Snap Payment Handler ──────────────────────────────────────────
  const handlePayDeposit = async () => {
    if (!bookingSuccess) return;
    setIsPaying(true);
    try {
      const res = await api.post<{
        token: string;
        redirectUrl: string;
        bookingCode: string;
      }>('/public/payments/snap-token', {
        bookingCode: bookingSuccess.bookingCode,
      });

      const { token, redirectUrl } = res.data;

      if (typeof window !== 'undefined' && window.snap?.pay) {
        window.snap.pay(token, {
          onSuccess: async () => {
            setIsPaymentConfirmed(true);
            toast.success('Pembayaran DP berhasil dikonfirmasi!');
            reloadSchedule(selectedDate);
          },
          onPending: () => {
            toast('Menunggu penyelesaian pembayaran...');
          },
          onError: () => {
            toast.error('Pembayaran gagal atau kedaluwarsa.');
          },
          onClose: () => {
            toast('Jendela pembayaran ditutup.');
          },
        });
      } else if (redirectUrl && !redirectUrl.includes('mock-')) {
        window.open(redirectUrl, '_blank');
      } else {
        // Fallback testing/mock otomatis: trigger simulasi webhook lunas
        await handleSimulateWebhook();
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Gagal membuat token pembayaran DP.';
      toast.error(errorMsg);
    } finally {
      setIsPaying(false);
    }
  };

  const handleSimulateWebhook = async () => {
    if (!bookingSuccess) return;
    setIsPaying(true);
    try {
      await api.post('/public/payments/midtrans-webhook', {
        order_id: bookingSuccess.bookingCode,
        status_code: '200',
        gross_amount: String(bookingSuccess.depositAmount),
        signature_key: 'dev-simulation-signature',
        transaction_status: 'settlement',
        payment_type: 'qris',
      });
      setIsPaymentConfirmed(true);
      toast.success(
        'Pembayaran DP lunas! Bukti reservasi terkirim ke WhatsApp.',
      );
      reloadSchedule(selectedDate);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Gagal memproses webhook simulasi.';
      toast.error(msg);
    } finally {
      setIsPaying(false);
    }
  };

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

        {/* ── 2. Court Cards – Pilih Lapangan ──────────────────────────────── */}
        {scheduleData && scheduleData.courts.length > 0 && (
          <section className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                Pilih Lapangan
              </label>
              <span className="text-[11px] text-slate-400">
                {scheduleData.courts.length} lapangan tersedia
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {scheduleData.courts.map((court) => {
                const isSelected =
                  (selectedCourtId || currentCourt?.courtId) === court.courtId;
                const mock = getCourtMock(court.courtType);
                const availableSlots = court.slots.filter(
                  (s) => s.status === 'AVAILABLE',
                ).length;
                const minRate = court.slots.reduce(
                  (min, s) => (s.rate > 0 && s.rate < min ? s.rate : min),
                  Infinity,
                );

                return (
                  <div
                    key={court.courtId}
                    className={`rounded-2xl border-2 overflow-hidden transition-all shadow-sm ${
                      isSelected
                        ? 'border-[#0053F1] shadow-blue-100 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Court Image */}
                    <div className="relative h-32 overflow-hidden">
                      <Image
                        src={mock.images[0]}
                        alt={court.courtName}
                        fill
                        className="object-cover"
                      />
                      {/* Type badge */}
                      <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {formatCourtType(court.courtType)}
                      </span>
                      {/* Slot counter */}
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          availableSlots > 5
                            ? 'bg-emerald-500 text-white'
                            : availableSlots > 0
                              ? 'bg-amber-400 text-amber-900'
                              : 'bg-red-500 text-white'
                        }`}
                      >
                        {availableSlots > 0 ? `${availableSlots} slot` : 'Full'}
                      </span>
                      {/* Detail button overlay */}
                      <button
                        type="button"
                        onClick={() => setDetailCourt(court)}
                        className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-slate-700 text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow transition-all"
                      >
                        <Maximize2 className="size-3" />
                        Detail
                      </button>
                    </div>

                    {/* Court Info Row */}
                    <div
                      className={`flex items-center justify-between px-3 py-2.5 ${
                        isSelected ? 'bg-blue-50' : 'bg-white'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {court.courtName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {mock.surface} · {mock.capacity} ·{' '}
                          {minRate === Infinity
                            ? '-'
                            : `Rp ${minRate.toLocaleString('id-ID')}/jam`}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCourtId(court.courtId);
                          setSelectedHours([]);
                        }}
                        className={`ml-3 shrink-0 min-h-[36px] px-4 rounded-xl text-xs font-bold transition-all touch-manipulation ${
                          isSelected
                            ? 'bg-[#0053F1] text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ Dipilih' : 'Pilih'}
                      </button>
                    </div>
                  </div>
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

            {/* State 1: Pembayaran DP Lunas / Confirmed */}
            {isPaymentConfirmed ? (
              <div className="space-y-4 py-2">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold mb-2">
                    <CheckCircle2 className="size-3.5" /> DP TERKONFIRMASI
                  </div>
                  <p className="text-xs text-emerald-800 font-medium">
                    Pembayaran DP Anda telah diverifikasi oleh gateway pembayaran
                    Midtrans.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left text-xs space-y-2">
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
                    <span className="text-slate-800">Sisa di Kasir:</span>
                    <span className="text-amber-600 text-sm">
                      Rp {bookingSuccess.remainingDue.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 text-left">
                  💬 <strong>Notifikasi WhatsApp:</strong> Bukti pemesanan dan
                  link tiket online telah dikirim ke nomor kontak Anda. Harap hadir 15
                  menit sebelum waktu pertandingan.
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBookingSuccess(null);
                    setIsPaymentConfirmed(false);
                  }}
                  className="w-full min-h-[44px] rounded-xl bg-[#0053F1] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all touch-manipulation"
                >
                  Selesai & Kembali ke Jadwal
                </button>
              </div>
            ) : (
              <>
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
                        navigator.clipboard.writeText(
                          bookingSuccess.bookingCode,
                        );
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
                    disabled={isPaying}
                    onClick={handlePayDeposit}
                    className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all touch-manipulation flex items-center justify-center gap-2"
                  >
                    {isPaying ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Memproses Midtrans Snap...
                      </span>
                    ) : (
                      'Bayar DP Sekarang (Midtrans Snap / QRIS)'
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isPaying}
                    onClick={handleSimulateWebhook}
                    className="w-full min-h-[38px] rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] border border-blue-200 transition-all touch-manipulation"
                  >
                    ⚡ Simulasi Webhook Lunas (Dev Sandbox)
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingSuccess(null)}
                    className="w-full min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all touch-manipulation"
                  >
                    Tutup & Kembali ke Jadwal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Court Detail Modal ────────────────────────────────────────────── */}
      {detailCourt && (
        <CourtDetailModal
          court={detailCourt}
          isSelected={
            (selectedCourtId || currentCourt?.courtId) === detailCourt.courtId
          }
          onSelect={() => {
            setSelectedCourtId(detailCourt.courtId);
            setSelectedHours([]);
          }}
          onClose={() => setDetailCourt(null)}
        />
      )}
    </div>
  );
}
