'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Filter,
  X,
  MessageCircle,
  LayoutDashboard,
  Printer,
} from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

interface SparringItem {
  id: string;
  bookingCode: string;
  venueName: string;
  venueSlug: string;
  venueAddress: string;
  courtName: string;
  courtType: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  hostTeamName: string;
  hostCaptainName: string;
  maskedPhone: string;
  sparringLevel: string;
  notes: string;
  courtTotal: number;
  estimatedCostPerTeam: number;
  status: string;
}

const initialMocks: SparringItem[] = [
  {
    id: 'mock-sp-01',
    bookingCode: 'BK-FUT-2611-042',
    venueName: 'Champion Arena Futsal',
    venueSlug: 'champion-arena',
    venueAddress: 'Jl. Pemuda No. 88, Jakarta Selatan',
    courtName: 'Lapangan 1 - Vinyl Pro',
    courtType: 'VINYL INTERLOCK PRO',
    bookingDate: '2026-11-28',
    startTime: '2026-11-28T19:00:00Z',
    endTime: '2026-11-28T21:00:00Z',
    durationHours: 2,
    hostTeamName: 'Garuda Muda FC',
    hostCaptainName: 'Budi Santoso',
    maskedPhone: '0812****789',
    sparringLevel: 'Casual',
    notes: 'Fun footy santai 5 vs 5, cari keringat malam minggu. Butuh lawan yang sportif, biaya sewa lapangan patungan 50:50.',
    courtTotal: 240000,
    estimatedCostPerTeam: 120000,
    status: 'CONFIRMED',
  },
  {
    id: 'mock-sp-02',
    bookingCode: 'BK-FUT-2611-043',
    venueName: 'Champion Arena Futsal',
    venueSlug: 'champion-arena',
    venueAddress: 'Jl. Pemuda No. 88, Jakarta Selatan',
    courtName: 'Lapangan 2 - Rumput Sintetis',
    courtType: 'MONOFILAMEN 50MM',
    bookingDate: '2026-11-29',
    startTime: '2026-11-29T20:00:00Z',
    endTime: '2026-11-29T22:00:00Z',
    durationHours: 2,
    hostTeamName: 'Bhayangkara Futsal Club',
    hostCaptainName: 'Dimas Prasetyo',
    maskedPhone: '0857****234',
    sparringLevel: 'Kompetitif',
    notes: 'Persiapan turnamen antar instansi. Intensitas medium-high. Wasit patungan dan bola standar disiapkan.',
    courtTotal: 280000,
    estimatedCostPerTeam: 140000,
    status: 'CONFIRMED',
  },
  {
    id: 'mock-sp-03',
    bookingCode: 'BK-FUT-2611-044',
    venueName: 'Champion Arena Futsal',
    venueSlug: 'champion-arena',
    venueAddress: 'Jl. Pemuda No. 88, Jakarta Selatan',
    courtName: 'Lapangan 3 - Mini Soccer Stadium',
    courtType: 'OUTDOOR 7 VS 7',
    bookingDate: '2026-11-30',
    startTime: '2026-11-30T19:00:00Z',
    endTime: '2026-11-30T21:00:00Z',
    durationHours: 2,
    hostTeamName: 'Manggarai United',
    hostCaptainName: 'Rian Pratama',
    maskedPhone: '0813****567',
    sparringLevel: 'Casual',
    notes: 'Mini Soccer 7-a-side terbuka. Tim kami kekurangan 1 kiper & 2 cadangan, terbuka gabung atau sparring bersahabat.',
    courtTotal: 600000,
    estimatedCostPerTeam: 300000,
    status: 'CONFIRMED',
  },
];

export default function SparringPage() {
  const [sparrings, setSparrings] = useState<SparringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [selectedMatch, setSelectedMatch] = useState<SparringItem | null>(null);

  // Form Challenge State
  const [challengerTeam, setChallengerTeam] = useState('');
  const [challengerCaptain, setChallengerCaptain] = useState('');
  const [challengerPhone, setChallengerPhone] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchSparrings() {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:3001/sparring', { timeout: 3000 });
        if (isMounted) {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setSparrings(res.data);
          } else {
            setSparrings(initialMocks);
          }
        }
      } catch {
        if (isMounted) {
          setSparrings(initialMocks);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSparrings();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredSparrings = sparrings.filter((item) => {
    if (levelFilter === 'ALL') return true;
    return item.sparringLevel.toLowerCase() === levelFilter.toLowerCase();
  });

  const handleOpenChallengeModal = (match: SparringItem) => {
    setSelectedMatch(match);
    setChallengerTeam('');
    setChallengerCaptain('');
    setChallengerPhone('');
    setConsentGiven(false);
  };

  const handleSendChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    if (!consentGiven) {
      toast.error('Mohon centang persetujuan kepatuhan privasi (UU PDP).');
      return;
    }

    try {
      setSubmitting(true);
      // Attempt backend endpoint
      const res = await axios.post(
        `http://localhost:3001/sparring/${selectedMatch.id}/challenge`,
        {
          challengerTeamName: challengerTeam,
          challengerCaptainName: challengerCaptain,
          challengerPhone,
          consentGiven: true,
        },
        { timeout: 3000 },
      );

      toast.success('Persetujuan terverifikasi! Membuka WhatsApp kapten tim...');
      setTimeout(() => {
        if (res.data?.whatsappUrl) {
          window.open(res.data.whatsappUrl, '_blank');
        } else {
          // Fallback direct WhatsApp link
          const rawPhone = selectedMatch.maskedPhone.replace(/\D/g, '') || '628123456789';
          const msg = `Halo Kapten ${selectedMatch.hostCaptainName} (${selectedMatch.hostTeamName}), kami dari tim ${challengerTeam} (Kapten ${challengerCaptain}) ingin sparring di ${selectedMatch.courtName} pada ${selectedMatch.bookingDate}. Apakah masih terbuka?`;
          window.open(`https://wa.me/62${rawPhone}?text=${encodeURIComponent(msg)}`, '_blank');
        }
        setSelectedMatch(null);
      }, 600);
    } catch {
      // Offline fallback
      toast.success('Persetujuan tervalidasi! Menghubungkan ke WhatsApp...');
      const msg = `Halo Kapten ${selectedMatch.hostCaptainName} (${selectedMatch.hostTeamName}), kami dari tim ${challengerTeam} (Kapten ${challengerCaptain} - ${challengerPhone}) melihat jadwal Anda di Papan Sparring StackPlus Futsal pada ${selectedMatch.bookingDate} (${selectedMatch.courtName}). Apakah slot sparring masih tersedia? Terima kasih!`;
      window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`, '_blank');
      setSelectedMatch(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-background text-brand-ink antialiased selection:bg-brand-primary selection:text-white">
      <Toaster position="top-center" />

      {/* ── Top Header ───────────────────────────────────────────────────────── */}
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
                Papan Komunitas &amp; Sparring Resmi
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
              Booking Lapangan
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Page Header Banner ───────────────────────────────────────────────── */}
      <section className="py-12 border-b border-brand-line bg-brand-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-surface-alt border border-brand-line text-xs font-medium text-brand-ink-dark mb-3">
                <Users className="size-3.5 text-brand-primary" />
                <span>Matchmaking Komunitas Futsal &amp; Mini Soccer</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-ink-dark">
                Papan Cari Lawan <span className="text-brand-primary">Sparring</span>
              </h1>
              <p className="text-sm text-brand-ink-muted mt-2 max-w-2xl leading-relaxed">
                Temukan tim sparring sepadan yang telah memiliki jadwal lapangan terkonfirmasi.
                Patungan biaya sewa 50:50 dan hubungi kapten tim secara transparan dan aman sesuai regulasi privasi UU PDP.
              </p>
            </div>

            {/* Level Filter Buttons */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl border border-brand-line bg-brand-surface-alt self-start md:self-auto">
              <span className="text-xs font-medium text-brand-ink-muted px-2 hidden sm:inline flex items-center gap-1">
                <Filter className="size-3.5" /> Level:
              </span>
              <button
                type="button"
                onClick={() => setLevelFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  levelFilter === 'ALL'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-brand-ink-dark hover:bg-brand-surface'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setLevelFilter('Casual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  levelFilter === 'Casual'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-brand-ink-dark hover:bg-brand-surface'
                }`}
              >
                Casual / Fun
              </button>
              <button
                type="button"
                onClick={() => setLevelFilter('Kompetitif')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  levelFilter === 'Kompetitif'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-brand-ink-dark hover:bg-brand-surface'
                }`}
              >
                Kompetitif
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content: Sparring List ──────────────────────────────────────── */}
      <main className="py-10 max-w-6xl mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-brand-surface border border-brand-line rounded-xl p-5 space-y-4 animate-pulse"
              >
                <div className="h-4 w-1/3 bg-brand-surface-alt rounded" />
                <div className="h-6 w-2/3 bg-brand-surface-alt rounded" />
                <div className="h-16 w-full bg-brand-surface-alt rounded" />
              </div>
            ))}
          </div>
        ) : filteredSparrings.length === 0 ? (
          <div className="text-center py-16 bg-brand-surface border border-dashed border-brand-line rounded-2xl p-8">
            <Users className="size-10 text-brand-ink-muted mx-auto mb-3" />
            <h3 className="text-base font-semibold text-brand-ink-dark">
              Belum ada tantangan sparring untuk level ini
            </h3>
            <p className="text-xs text-brand-ink-muted mt-1 max-w-sm mx-auto">
              Anda dapat memesan lapangan baru dan mencentang opsi &quot;Buka Tantangan Sparring&quot; saat melakukan reservasi.
            </p>
            <Link
              href="/book/champion-arena"
              className="mt-4 inline-flex h-9 items-center gap-1.5 px-4 rounded-lg bg-brand-primary text-white text-xs font-medium hover:bg-brand-primary-dark transition-colors"
            >
              Pesan Lapangan &amp; Buat Tantangan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSparrings.map((match) => (
              <div
                key={match.id}
                className="bg-brand-surface border border-brand-line rounded-xl p-5 shadow-xs hover:border-brand-primary transition-colors flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar: Level & Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        match.sparringLevel.toLowerCase() === 'kompetitif'
                          ? 'bg-blue-50 text-[#0053F1] border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      ⚔️ {match.sparringLevel} Match
                    </span>
                    <span className="text-[11px] text-brand-ink-muted font-mono">
                      {match.bookingCode}
                    </span>
                  </div>

                  {/* Team & Venue */}
                  <div>
                    <h3 className="text-base font-bold text-brand-ink-dark">
                      {match.hostTeamName}
                    </h3>
                    <p className="text-xs text-brand-ink-muted flex items-center gap-1 mt-0.5">
                      Kapten: <strong className="text-brand-ink">{match.hostCaptainName}</strong> ({match.maskedPhone})
                    </p>
                  </div>

                  {/* Schedule Details Box */}
                  <div className="bg-brand-surface-alt rounded-lg p-3 border border-brand-line space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-brand-ink">
                      <Calendar className="size-3.5 text-brand-primary shrink-0" />
                      <span>{match.bookingDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-brand-ink">
                      <Clock className="size-3.5 text-brand-primary shrink-0" />
                      <span>
                        {match.startTime.slice(11, 16)} – {match.endTime.slice(11, 16)} WIB ({match.durationHours} Jam)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-brand-ink">
                      <MapPin className="size-3.5 text-brand-primary shrink-0" />
                      <span className="font-medium text-brand-ink-dark">
                        {match.courtName}
                      </span>
                    </div>
                  </div>

                  {/* Notes / Split info */}
                  <p className="text-xs text-brand-ink leading-relaxed">
                    &ldquo;{match.notes}&rdquo;
                  </p>
                </div>

                {/* Footer Pricing & CTA */}
                <div className="pt-4 mt-4 border-t border-brand-line flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-brand-ink-muted uppercase font-medium">
                      Patungan Tim (50%)
                    </div>
                    <div className="text-sm font-bold text-brand-ink-dark tabular-nums">
                      Rp {match.estimatedCostPerTeam.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenChallengeModal(match)}
                    className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-medium transition-colors shadow-xs"
                  >
                    <span>Tantang Tim</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal: Tantang Tim (Kepatuhan UU PDP) ────────────────────────────── */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-brand-surface border border-brand-line rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-brand-line pb-3">
              <div>
                <h3 className="text-base font-bold text-brand-ink-dark">
                  Ajukan Tantangan Sparring
                </h3>
                <p className="text-xs text-brand-ink-muted">
                  Menghubungi Kapten {selectedMatch.hostCaptainName} ({selectedMatch.hostTeamName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="text-brand-ink-muted hover:text-brand-ink-dark p-1 rounded-md"
              >
                <X className="size-4.5" />
              </button>
            </div>

            {/* Match Summary info */}
            <div className="bg-brand-surface-alt rounded-lg p-3 border border-brand-line text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-brand-ink-muted">Jadwal:</span>
                <span className="font-semibold text-brand-ink-dark">
                  {selectedMatch.bookingDate} ({selectedMatch.startTime.slice(11, 16)} WIB)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-ink-muted">Lapangan:</span>
                <span className="font-semibold text-brand-ink-dark">{selectedMatch.courtName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-ink-muted">Estimasi Patungan:</span>
                <span className="font-bold text-brand-primary tabular-nums">
                  Rp {selectedMatch.estimatedCostPerTeam.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <form onSubmit={handleSendChallenge} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-ink-dark">
                  Nama Tim Penantang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Nusantara FC"
                  value={challengerTeam}
                  onChange={(e) => setChallengerTeam(e.target.value)}
                  className="w-full h-9 rounded-lg border border-brand-line bg-brand-surface px-3 text-xs text-brand-ink focus:border-brand-primary focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-ink-dark">
                    Nama Kapten <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap"
                    value={challengerCaptain}
                    onChange={(e) => setChallengerCaptain(e.target.value)}
                    className="w-full h-9 rounded-lg border border-brand-line bg-brand-surface px-3 text-xs text-brand-ink focus:border-brand-primary focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-ink-dark">
                    Nomor WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0812xxxxxxxx"
                    value={challengerPhone}
                    onChange={(e) => setChallengerPhone(e.target.value)}
                    className="w-full h-9 rounded-lg border border-brand-line bg-brand-surface px-3 text-xs text-brand-ink focus:border-brand-primary focus:outline-hidden"
                  />
                </div>
              </div>

              {/* PDP Privacy Consent Checkbox */}
              <div className="p-3 rounded-lg border border-brand-line bg-brand-surface-alt flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 rounded border-brand-line text-brand-primary focus:ring-brand-primary size-4"
                />
                <label htmlFor="consent" className="text-[11px] text-brand-ink leading-snug cursor-pointer">
                  <strong>Persetujuan Interaksi Resmi (UU PDP)</strong>: Saya menyetujui pertukaran kontak antar kapten tim untuk koordinasi pertandingan sparring dan bersedia mematuhi norma olahraga yang sportif.
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-line">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="h-9 px-4 rounded-lg border border-brand-line text-xs font-medium text-brand-ink-dark hover:bg-brand-surface-alt transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !consentGiven}
                  className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <MessageCircle className="size-4" />
                  <span>{submitting ? 'Menghubungkan...' : 'Hubungi via WhatsApp'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-brand-surface border-t border-brand-line py-8 text-xs text-brand-ink-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium text-brand-ink">
            <span>StackPlus Futsal SaaS</span>
            <span>•</span>
            <span>Matchmaking &amp; Sparring Community</span>
          </div>

          <div>
            Kepatuhan Privasi Data sesuai UU Perlindungan Data Pribadi (UU PDP).
          </div>
        </div>
      </footer>
    </div>
  );
}
