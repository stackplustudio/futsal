import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BookingNotificationData {
  bookingCode: string;
  venueName: string;
  venueSlug?: string;
  courtName: string;
  bookingDate: string; // YYYY-MM-DD
  startHour: number;
  endHour: number;
  customerName: string;
  customerPhone: string;
  courtTotal: number;
  depositAmount: number;
  remainingDue: number;
  paymentMethod?: string;
  isOpenSparring?: boolean;
  sparringLevel?: string | null;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly endpointUrl: string;
  private readonly apiToken: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.endpointUrl =
      this.config.get<string>('WHATSAPP_ENDPOINT_URL') ||
      'https://api.fonnte.com/send';
    this.apiToken = this.config.get<string>('WHATSAPP_API_TOKEN') || '';
    this.frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Mengirim notifikasi WhatsApp bukti reservasi & lunas DP.
   */
  async sendBookingConfirmation(
    data: BookingNotificationData,
  ): Promise<boolean> {
    const formattedDate = this.formatDateIndo(data.bookingDate);
    const startHourStr = String(data.startHour).padStart(2, '0');
    const endHourStr = String(data.endHour).padStart(2, '0');
    const depositStr = data.depositAmount.toLocaleString('id-ID');
    const remainingStr = data.remainingDue.toLocaleString('id-ID');
    const totalStr = data.courtTotal.toLocaleString('id-ID');

    const sparringSection = data.isOpenSparring
      ? `\n🤝 *Status Matchmaking:* Cari Lawan Sparring (${data.sparringLevel || 'Casual'})\n`
      : '';

    const trackingUrl = data.venueSlug
      ? `${this.frontendUrl}/book/${data.venueSlug}?bookingCode=${data.bookingCode}`
      : `${this.frontendUrl}/book?bookingCode=${data.bookingCode}`;

    const message =
      `⚽ *BUKTI RESERVASI LAPANGAN FUTSAL* ⚽\n` +
      `------------------------------------\n` +
      `Status: *LUNAS DP (TERKONFIRMASI)*\n` +
      `Kode Booking: *${data.bookingCode}*\n` +
      `Venue: *${data.venueName}*\n` +
      `Lapangan: *${data.courtName}*\n` +
      `Jadwal: *${formattedDate}*, *${startHourStr}:00 – ${endHourStr}:00 WIB*\n` +
      `Pemesan: *${data.customerName}*\n` +
      sparringSection +
      `\n*Rincian Pembayaran:*\n` +
      `• Total Sewa: Rp ${totalStr}\n` +
      `• DP Dibayar: *Rp ${depositStr}* (${data.paymentMethod || 'Midtrans'})\n` +
      `• Sisa Pelunasan di Kasir: *Rp ${remainingStr}*\n` +
      `\n*Petunjuk Penting:*\n` +
      `1. Harap tiba di venue 15 menit sebelum kick-off.\n` +
      `2. Tunjukkan bukti ini atau kode booking ke kasir untuk pelunasan.\n` +
      `3. Cek tiket online: ${trackingUrl}\n` +
      `\nSelamat bertanding! 🏆`;

    return this.sendRawMessage(data.customerPhone, message);
  }

  /**
   * Mengirim pengingat jadwal kick-off H-4 jam ke pemesan.
   */
  async sendH4Reminder(data: BookingNotificationData): Promise<boolean> {
    const startHourStr = String(data.startHour).padStart(2, '0');
    const endHourStr = String(data.endHour).padStart(2, '0');
    const remainingStr = data.remainingDue.toLocaleString('id-ID');

    const message =
      `⏰ *PENGINGAT PERTANDINGAN (H-4 JAM)* ⚽\n` +
      `------------------------------------\n` +
      `Halo *${data.customerName}*,\n` +
      `Pertandingan Anda di *${data.venueName}* (*${data.courtName}*) akan dimulai dalam 4 jam lagi!\n\n` +
      `• Waktu: *Hari Ini, ${startHourStr}:00 – ${endHourStr}:00 WIB*\n` +
      `• Kode Booking: *${data.bookingCode}*\n` +
      `• Sisa Pelunasan Kasir: *Rp ${remainingStr}*\n\n` +
      `Pastikan tim Anda sudah bersiap dan membawa perlengkapan bermain.\n` +
      `Sampai jumpa di lapangan! 🔥`;

    return this.sendRawMessage(data.customerPhone, message);
  }

  /**
   * Mengirim pesan teks mentah ke target nomor via WhatsApp Gateway API.
   */
  async sendRawMessage(phone: string, message: string): Promise<boolean> {
    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) {
      this.logger.warn(`Nomor HP tidak valid: ${phone}`);
      return false;
    }

    // Bypass pemanggilan API eksternal pada mode testing atau placeholder token
    if (
      process.env.NODE_ENV === 'test' ||
      !this.apiToken ||
      this.apiToken.includes('placeholder')
    ) {
      this.logger.log(
        `[WhatsApp Mock] Terkirim ke ${normalizedPhone}:\n${message}`,
      );
      return true;
    }

    try {
      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: {
          Authorization: this.apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: normalizedPhone,
          message: message,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Gagal mengirim WhatsApp ke ${normalizedPhone}: ${response.status} - ${errorText}`,
        );
        return false;
      }

      this.logger.log(`WhatsApp berhasil terkirim ke ${normalizedPhone}`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Error pengiriman WhatsApp ke ${normalizedPhone}: ${msg}`,
      );
      return false;
    }
  }

  /**
   * Menormalisasi format nomor HP Indonesia (08xxx -> 628xxx).
   */
  normalizePhone(phone: string): string {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.slice(1);
    }
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return cleaned;
  }

  private formatDateIndo(dateStr: string): string {
    try {
      const [year, month, day] = dateStr.split('-');
      const months = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
      ];
      const monthIdx = parseInt(month, 10) - 1;
      return `${parseInt(day, 10)} ${months[monthIdx]} ${year}`;
    } catch {
      return dateStr;
    }
  }
}
