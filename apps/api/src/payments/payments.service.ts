import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../notifications/whatsapp.service';
import { CreateSnapTokenDto } from './dto/create-snap-token.dto';
import { MidtransWebhookDto } from './dto/midtrans-webhook.dto';
import { BookingStatus, PaymentMethod } from '@prisma/client';

export interface SnapTokenResponse {
  token: string;
  redirectUrl: string;
  bookingCode: string;
  depositAmount: number;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  /**
   * Membuat Midtrans Snap Token untuk pembayaran DP reservasi lapangan.
   */
  async createSnapToken(dto: CreateSnapTokenDto): Promise<SnapTokenResponse> {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode: dto.bookingCode },
      include: {
        court: { include: { venue: true } },
        customer: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(
        `Booking dengan kode ${dto.bookingCode} tidak ditemukan`,
      );
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        `Status booking (${booking.status}) tidak valid untuk pembayaran DP`,
      );
    }

    const holdMinutes = parseInt(
      this.config.get<string>('DEFAULT_DP_HOLD_MINUTES') || '15',
      10,
    );
    const expiresAt = new Date(
      booking.createdAt.getTime() + holdMinutes * 60 * 1000,
    );

    if (expiresAt < new Date()) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.EXPIRED },
      });
      throw new BadRequestException(
        'Batas waktu pembayaran DP telah habis (kedaluwarsa). Silakan buat reservasi baru.',
      );
    }

    const serverKey = this.config.get<string>('MIDTRANS_SERVER_KEY') || '';
    const isProd = this.config.get<string>('MIDTRANS_IS_PRODUCTION') === 'true';
    const snapUrl = isProd
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    // Mock response untuk environment testing atau placeholder key
    if (
      process.env.NODE_ENV === 'test' ||
      !serverKey ||
      serverKey.includes('placeholder')
    ) {
      this.logger.log(
        `[Midtrans Mock Snap] Token diterbitkan untuk ${booking.bookingCode}`,
      );
      return {
        token: `mock-snap-token-${booking.bookingCode}`,
        redirectUrl: `https://app.sandbox.midtrans.com/snap/v2/vtweb/mock-${booking.bookingCode}`,
        bookingCode: booking.bookingCode,
        depositAmount: Number(booking.depositAmount),
      };
    }

    try {
      const authHeader =
        'Basic ' + Buffer.from(serverKey + ':').toString('base64');
      const response = await fetch(snapUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: booking.bookingCode,
            gross_amount: Number(booking.depositAmount),
          },
          customer_details: {
            first_name: booking.customer.fullName,
            phone: booking.customer.phone,
          },
          item_details: [
            {
              id: booking.courtId,
              price: Number(booking.depositAmount),
              quantity: 1,
              name: `DP Sewa ${booking.court.name}`,
            },
          ],
        }),
      });

      const data = (await response.json()) as {
        token?: string;
        redirect_url?: string;
        error_messages?: string[];
      };

      if (!response.ok) {
        const errorMsg =
          data.error_messages?.join(', ') ||
          'Gagal menghubungi Midtrans Snap Gateway';
        this.logger.error(`Midtrans API Error: ${errorMsg}`);
        throw new BadRequestException(errorMsg);
      }

      return {
        token: data.token || '',
        redirectUrl: data.redirect_url || '',
        bookingCode: booking.bookingCode,
        depositAmount: Number(booking.depositAmount),
      };
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error pembuatan Midtrans Snap Token: ${msg}`);
      throw new BadRequestException(`Gagal memproses pembayaran: ${msg}`);
    }
  }

  /**
   * Menangani Webhook Notifikasi HTTP dari Midtrans (Auto-Settlement & Auto-Expire).
   */
  async handleWebhook(dto: MidtransWebhookDto) {
    const serverKey = this.config.get<string>('MIDTRANS_SERVER_KEY') || '';

    // Verifikasi Signature SHA512 (order_id + status_code + gross_amount + ServerKey)
    const expectedSignature = this.calculateSignature(
      dto.order_id,
      dto.status_code,
      dto.gross_amount,
      serverKey,
    );

    const isTestOrPlaceholder =
      process.env.NODE_ENV === 'test' ||
      !serverKey ||
      serverKey.includes('placeholder');

    if (!isTestOrPlaceholder && dto.signature_key !== expectedSignature) {
      this.logger.warn(`Signature mismatch untuk order_id: ${dto.order_id}`);
      throw new BadRequestException('Signature Midtrans tidak valid');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode: dto.order_id },
      include: {
        court: { include: { venue: true } },
        customer: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(
        `Booking dengan kode ${dto.order_id} tidak ditemukan`,
      );
    }

    const status = dto.transaction_status;
    const fraud = dto.fraud_status;

    if (
      status === 'settlement' ||
      (status === 'capture' && fraud === 'accept')
    ) {
      if (booking.status === BookingStatus.CONFIRMED) {
        return {
          status: 'success',
          message: 'Booking sudah terkonfirmasi sebelumnya.',
        };
      }

      // Tentukan payment method dari payment_type
      const paymentMethod = this.mapPaymentMethod(dto.payment_type);

      await this.prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CONFIRMED,
            paidAt: new Date(),
            paymentMethod,
          },
        });

        await tx.customer.update({
          where: { id: booking.customerId },
          data: { totalBookings: { increment: 1 } },
        });
      });

      // Kirim Notifikasi WhatsApp Bukti Booking Lunas DP
      const startHour = booking.startTime.getUTCHours();
      const endHour = booking.endTime.getUTCHours();
      const bookingDateStr = booking.bookingDate.toISOString().split('T')[0];

      await this.whatsAppService.sendBookingConfirmation({
        bookingCode: booking.bookingCode,
        venueName: booking.court.venue.name,
        venueSlug: booking.court.venue.slug,
        courtName: booking.court.name,
        bookingDate: bookingDateStr,
        startHour,
        endHour,
        customerName: booking.customer.fullName,
        customerPhone: booking.customer.phone,
        courtTotal: Number(booking.courtTotal),
        depositAmount: Number(booking.depositAmount),
        remainingDue: Number(booking.remainingDue),
        paymentMethod,
        isOpenSparring: booking.isOpenSparring,
        sparringLevel: booking.sparringLevel,
      });

      this.logger.log(
        `Booking ${booking.bookingCode} sukses terkonfirmasi via Midtrans Webhook (${paymentMethod})`,
      );

      return {
        status: 'success',
        message: 'Pembayaran DP berhasil dikonfirmasi.',
      };
    }

    if (status === 'expire') {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.EXPIRED },
      });
      return {
        status: 'success',
        message: 'Booking ditandai kedaluwarsa.',
      };
    }

    if (status === 'cancel' || status === 'deny') {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CANCELLED },
      });
      return {
        status: 'success',
        message: 'Booking berhasil dibatalkan.',
      };
    }

    return {
      status: 'success',
      message: `Status transaksi tercatat: ${status}`,
    };
  }

  /**
   * Cek status pembayaran booking saat ini.
   */
  async getPaymentStatus(bookingCode: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode },
      select: {
        bookingCode: true,
        status: true,
        paidAt: true,
        paymentMethod: true,
        courtTotal: true,
        depositAmount: true,
        remainingDue: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingCode} tidak ditemukan`);
    }

    return {
      bookingCode: booking.bookingCode,
      status: booking.status,
      paidAt: booking.paidAt,
      paymentMethod: booking.paymentMethod,
      courtTotal: Number(booking.courtTotal),
      depositAmount: Number(booking.depositAmount),
      remainingDue: Number(booking.remainingDue),
    };
  }

  /**
   * Memicu reminder WhatsApp H-4 jam untuk booking tertentu.
   */
  async triggerH4Reminder(bookingCode: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        court: { include: { venue: true } },
        customer: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingCode} tidak ditemukan`);
    }

    const startHour = booking.startTime.getUTCHours();
    const endHour = booking.endTime.getUTCHours();
    const bookingDateStr = booking.bookingDate.toISOString().split('T')[0];

    const sent = await this.whatsAppService.sendH4Reminder({
      bookingCode: booking.bookingCode,
      venueName: booking.court.venue.name,
      courtName: booking.court.name,
      bookingDate: bookingDateStr,
      startHour,
      endHour,
      customerName: booking.customer.fullName,
      customerPhone: booking.customer.phone,
      courtTotal: Number(booking.courtTotal),
      depositAmount: Number(booking.depositAmount),
      remainingDue: Number(booking.remainingDue),
    });

    return { success: sent, bookingCode: booking.bookingCode };
  }

  /**
   * Menghitung hash signature SHA-512 Midtrans.
   */
  calculateSignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    serverKey: string,
  ): string {
    const payload = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    return crypto.createHash('sha512').update(payload).digest('hex');
  }

  /**
   * Memetakan tipe pembayaran Midtrans ke enum PaymentMethod internal.
   */
  mapPaymentMethod(paymentType?: string): PaymentMethod {
    if (!paymentType) return PaymentMethod.MIDTRANS_QRIS;
    const lower = paymentType.toLowerCase();
    if (
      lower.includes('va') ||
      lower.includes('transfer') ||
      lower.includes('echannel')
    ) {
      return PaymentMethod.MIDTRANS_VA;
    }
    return PaymentMethod.MIDTRANS_QRIS;
  }
}
