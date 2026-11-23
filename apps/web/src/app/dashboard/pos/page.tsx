'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  ArrowLeft,
  Calendar,
  Send,
  Trophy,
} from 'lucide-react';

interface CanteenProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface CartItem {
  product: CanteenProduct;
  qty: number;
}

interface BookingDetails {
  bookingCode: string;
  status: string;
  courtName: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  courtTotal: number;
  depositPaid: number;
  remainingDue: number;
}

interface ReceiptData {
  receiptNo: string;
  venueName: string;
  venuePhone?: string;
  venueAddress: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  courtName: string;
  bookingDate: string;
  scheduleTime: string;
  courtTotal: number;
  depositPaid: number;
  canteenItems: Array<{
    name: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;
  canteenTotal: number;
  grandTotal: number;
  finalSettlementPaid: number;
  paymentMethod: string;
  cashReceived?: number;
  cashChange?: number;
  settledAt: string;
}

const PRODUCT_MOCK_IMAGES: Record<string, string> = {
  'Pocari Sweat 500ml':
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80',
  'Le Minerale 600ml':
    'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&q=80',
  'Hydro Coco 330ml':
    'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&q=80',
  'Sewa Rompi Tim (1 Set 10 Pcs)':
    'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=500&q=80',
  'Sewa Bola Match FIFA Quality':
    'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=500&q=80',
};

export default function PosCashierPage() {
  const [products, setProducts] = useState<CanteenProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchBookingCode, setSearchBookingCode] = useState('');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    'CASH_AT_COUNTER' | 'MIDTRANS_QRIS' | 'EDC_DEBIT'
  >('CASH_AT_COUNTER');
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [receiptModal, setReceiptModal] = useState<ReceiptData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Muat produk kantin saat inisialisasi
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get<{ products: CanteenProduct[] }>(
          '/public/pos/products?venueSlug=champion-arena',
        );
        setProducts(res.data.products);
      } catch {
        toast.error('Gagal memuat produk kantin.');
      }
    };
    loadProducts();
  }, []);

  // Cari data booking berdasarkan kode
  const handleSearchBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchBookingCode.trim()) return;

    setIsLoadingBooking(true);
    try {
      const res = await api.get<{
        bookingCode: string;
        status: string;
        court: { name: string };
        customer: { fullName: string; phone: string };
        date: string;
        startHour: number;
        endHour: number;
        courtTotal: number;
        depositAmount: number;
        remainingDue: number;
      }>(`/public/bookings/${searchBookingCode.trim().toUpperCase()}`);

      const b = res.data;
      setBooking({
        bookingCode: b.bookingCode,
        status: b.status,
        courtName: b.court.name,
        customerName: b.customer.fullName,
        customerPhone: b.customer.phone,
        date: b.date,
        time: `${String(b.startHour).padStart(2, '0')}:00 – ${String(b.endHour).padStart(2, '0')}:00 WIB`,
        courtTotal: b.courtTotal,
        depositPaid: b.depositAmount,
        remainingDue: b.remainingDue,
      });
      toast.success(`Booking ${b.bookingCode} ditemukan!`);
    } catch {
      toast.error('Kode booking tidak ditemukan.');
      setBooking(null);
    } finally {
      setIsLoadingBooking(false);
    }
  };

  // Tambah produk ke keranjang kasir
  const addToCart = (product: CanteenProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error(`Stok maksimal ${product.name} adalah ${product.stock}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item,
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, qty: item.qty - 1 } : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

  const canteenSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0,
  );
  const remainingSewa = booking ? booking.remainingDue : 0;
  const totalTagihan = remainingSewa + canteenSubtotal;

  const cashChange =
    paymentMethod === 'CASH_AT_COUNTER' && typeof cashReceived === 'number'
      ? Math.max(0, cashReceived - totalTagihan)
      : 0;

  // Proses Pelunasan di Kasir (FR-004)
  const handleProcessSettlement = async () => {
    if (totalTagihan <= 0) {
      toast.error('Tidak ada tagihan yang harus dibayar.');
      return;
    }

    if (
      paymentMethod === 'CASH_AT_COUNTER' &&
      (typeof cashReceived !== 'number' || cashReceived < totalTagihan)
    ) {
      toast.error('Uang tunai yang diterima kurang dari total tagihan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const additionalItems = cart.map((i) => ({
        productId: i.product.id,
        qty: i.qty,
      }));

      // Jika terhubung ke booking, lakukan settlement resmi
      if (booking) {
        const res = await api.post<ReceiptData>('/public/pos/settlement', {
          bookingCode: booking.bookingCode,
          paymentMethod,
          cashReceived:
            paymentMethod === 'CASH_AT_COUNTER' ? Number(cashReceived) : undefined,
          additionalItems,
        });

        setReceiptModal(res.data);
        toast.success('Pelunasan kasir berhasil! Struk telah diterbitkan.');
        // Reset state
        setBooking(null);
        setCart([]);
        setSearchBookingCode('');
        setCashReceived('');
      } else {
        // Walk-in order kantin tanpa booking sewa
        await api.post('/public/pos/orders', {
          venueSlug: 'champion-arena',
          items: additionalItems,
        });
        toast.success('Transaksi penjualan kantin berhasil dicatat.');
        setCart([]);
        setCashReceived('');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Gagal memproses transaksi kasir.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] antialiased">
      <Toaster position="top-center" />

      {/* ── Top Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#1E293B] text-white px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300 flex items-center gap-1">
                <Trophy className="size-3" /> Kasir POS Resepsionis
              </span>
              <h1 className="text-base font-extrabold leading-tight">
                Champion Arena · Court & Canteen POS
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/members"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Calendar className="size-3.5 text-blue-400" />
              <span>Member Rutin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Grid ────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Produk Kantin & Sewa Alat (7 Kolom) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card Pencarian Booking */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              1. Cari Booking Pelanggan (Pelunasan Sewa)
            </label>
            <form onSubmit={handleSearchBooking} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchBookingCode}
                  onChange={(e) => setSearchBookingCode(e.target.value)}
                  placeholder="Masukkan Kode Booking (misal: BK-FUT-2611-042)"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0053F1]"
                />
              </div>
              <button
                type="submit"
                disabled={isLoadingBooking}
                className="px-4 py-2 bg-[#0053F1] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                {isLoadingBooking ? 'Mencari...' : 'Cek Tiket'}
              </button>
            </form>

            {/* Informasi Booking yang Ditemukan */}
            {booking && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1.5 animate-in fade-in duration-200">
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span className="flex items-center gap-1 text-[#0053F1]">
                    <CheckCircle2 className="size-3.5" /> {booking.bookingCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                    {booking.status}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pemesan:</span>
                  <span className="font-semibold text-slate-900">
                    {booking.customerName} ({booking.customerPhone})
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Lapangan & Waktu:</span>
                  <span className="font-semibold text-slate-900">
                    {booking.courtName} · {booking.time}
                  </span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-1 text-slate-700 font-bold">
                  <span>Sisa Pelunasan Sewa:</span>
                  <span className="text-amber-700 text-sm">
                    Rp {booking.remainingDue.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Katalog Produk Kantin & Sewa Alat */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShoppingBag className="size-4 text-[#0053F1]" /> 2. Tambah Pesanan
                Kantin & Sewa Alat
              </label>
              <span className="text-xs text-slate-400">
                {products.length} produk siap jual
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map((p) => {
                const img =
                  PRODUCT_MOCK_IMAGES[p.name] ||
                  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80';
                const cartQty =
                  cart.find((i) => i.product.id === p.id)?.qty || 0;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200 p-3 flex gap-3 items-center hover:shadow-md transition-all shadow-xs"
                  >
                    <div className="relative size-16 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                      <Image
                        src={img}
                        alt={p.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {p.name}
                      </div>
                      <div className="text-[11px] font-extrabold text-[#0053F1]">
                        Rp {p.price.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Stok: {p.stock} pcs
                      </div>
                    </div>

                    {/* Tombol Counter */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                      {cartQty > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => removeFromCart(p.id)}
                            className="size-7 rounded-lg bg-white shadow-xs text-slate-700 flex items-center justify-center hover:bg-slate-200"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-slate-800">
                            {cartQty}
                          </span>
                        </>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => addToCart(p)}
                        className="size-7 rounded-lg bg-[#0053F1] text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Tagihan & Pelunasan (5 Kolom) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md sticky top-20 space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Printer className="size-4 text-[#0053F1]" /> Rincian Transaksi
              Kasir
            </h2>

            {/* List Item Keranjang */}
            <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
              {booking && (
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-800">
                      Sisa Sewa Lapangan
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {booking.courtName}
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">
                    Rp {booking.remainingDue.toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex justify-between py-1 border-b border-dashed border-slate-100"
                >
                  <div>
                    <span className="font-medium text-slate-800">
                      {item.product.name}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {item.qty} × Rp{' '}
                      {item.product.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">
                    Rp {(item.product.price * item.qty).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}

              {!booking && cart.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Belum ada item sewa atau pesanan kantin.
                </div>
              )}
            </div>

            {/* Total Summary */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Total Kantin:</span>
                <span>Rp {canteenSubtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sisa Sewa Lapangan:</span>
                <span>Rp {remainingSewa.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-extrabold text-slate-900">
                <span>Total Tagihan Kasir:</span>
                <span className="text-[#0053F1]">
                  Rp {totalTagihan.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Pilihan Metode Bayar */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CASH_AT_COUNTER', label: 'Tunai', icon: Banknote },
                  { id: 'MIDTRANS_QRIS', label: 'QRIS', icon: QrCode },
                  { id: 'EDC_DEBIT', label: 'EDC Debit', icon: CreditCard },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id as typeof paymentMethod)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === id
                        ? 'bg-[#0053F1] text-white border-[#0053F1] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Tunai & Kembalian */}
            {paymentMethod === 'CASH_AT_COUNTER' && (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">
                    Uang Tunai Diterima:
                  </span>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) =>
                      setCashReceived(
                        e.target.value === '' ? '' : Number(e.target.value),
                      )
                    }
                    placeholder={`Rp ${totalTagihan.toLocaleString('id-ID')}`}
                    className="w-36 text-right px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0053F1]"
                  />
                </div>

                {/* Quick Presets Tunai */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {[totalTagihan, 50000, 100000, 200000, 500000]
                    .filter((v) => v >= totalTagihan && v > 0)
                    .map((val, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashReceived(val)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold shrink-0"
                      >
                        {val === totalTagihan ? 'Uang Pas' : `Rp ${val / 1000}k`}
                      </button>
                    ))}
                </div>

                <div className="flex justify-between items-center text-xs p-2 bg-emerald-50 rounded-lg border border-emerald-200 font-bold text-emerald-800">
                  <span>Kembalian:</span>
                  <span>Rp {cashChange.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            {/* Tombol Eksekusi Pelunasan */}
            <button
              type="button"
              disabled={isSubmitting || totalTagihan <= 0}
              onClick={handleProcessSettlement}
              className="w-full min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all touch-manipulation flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Memproses Transaksi...'
              ) : (
                <>
                  <Printer className="size-4" />
                  <span>
                    Selesaikan Pelunasan (Rp{' '}
                    {totalTagihan.toLocaleString('id-ID')})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* ── Modal Cetak Struk Kasir Thermal (58mm/80mm) ───────────────────────── */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 font-mono text-xs text-slate-900">
            {/* Header Struk */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
              <h3 className="font-extrabold text-sm uppercase">
                {receiptModal.venueName}
              </h3>
              <p className="text-[10px] text-slate-500">
                {receiptModal.venueAddress}
              </p>
              {receiptModal.venuePhone && (
                <p className="text-[10px] text-slate-500">
                  Telp: {receiptModal.venuePhone}
                </p>
              )}
              <div className="text-[10px] text-slate-400 mt-1">
                No: {receiptModal.receiptNo} ·{' '}
                {new Date(receiptModal.settledAt).toLocaleTimeString('id-ID')}
              </div>
            </div>

            {/* Rincian Struk */}
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3 text-[11px]">
              <div className="flex justify-between">
                <span>Pemesan:</span>
                <span className="font-bold">{receiptModal.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Lapangan:</span>
                <span>{receiptModal.courtName}</span>
              </div>
              <div className="flex justify-between">
                <span>Jadwal:</span>
                <span>
                  {receiptModal.bookingDate}, {receiptModal.scheduleTime}
                </span>
              </div>
            </div>

            {/* Rincian Biaya */}
            <div className="space-y-1 border-b border-dashed border-slate-300 pb-3 mb-3 text-[11px]">
              <div className="flex justify-between">
                <span>Sewa Lapangan</span>
                <span>Rp {receiptModal.courtTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>• DP Awal Lunas</span>
                <span>
                  -Rp {receiptModal.depositPaid.toLocaleString('id-ID')}
                </span>
              </div>

              {receiptModal.canteenItems.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {item.name} ({item.qty}x)
                  </span>
                  <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            {/* Total Pelunasan */}
            <div className="space-y-1 text-xs mb-4">
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL LUNAS:</span>
                <span>
                  Rp {receiptModal.finalSettlementPaid.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Metode:</span>
                <span>{receiptModal.paymentMethod}</span>
              </div>
              {receiptModal.cashReceived && (
                <>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Tunai:</span>
                    <span>
                      Rp {receiptModal.cashReceived.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Kembali:</span>
                    <span>
                      Rp {(receiptModal.cashChange || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Info WhatsApp Digital */}
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] flex items-center gap-2 mb-4">
              <Send className="size-3.5 shrink-0 text-emerald-600" />
              <span>
                Struk digital resmi otomatis terkirim ke WhatsApp pelanggan.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 font-sans">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  toast.success('Mencetak struk thermal...');
                }}
                className="w-full min-h-[42px] bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer className="size-4" />
                <span>Cetak Struk Thermal (58mm/80mm)</span>
              </button>

              <button
                type="button"
                onClick={() => setReceiptModal(null)}
                className="w-full min-h-[42px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center"
              >
                Tutup & Kembali ke Kasir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
