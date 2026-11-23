import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToggleSparringDto } from './dto/toggle-sparring.dto';
import { ChallengeSparringDto } from './dto/challenge-sparring.dto';

@Injectable()
export class SparringService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Menyamarkan nomor telepon untuk kepatuhan privasi (UU PDP).
   * Contoh: 081234567890 -> 0812****7890
   */
  private maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 8) return '08**********';
    const clean = phone.replace(/\D/g, '');
    const prefix = clean.slice(0, 4);
    const suffix = clean.slice(-3);
    return `${prefix}****${suffix}`;
  }

  /**
   * Mengambil seluruh jadwal booking yang membuka tantangan sparring (publik).
   */
  async getOpenSparrings(venueSlug?: string, level?: string) {
    const whereClause: Record<string, any> = {
      isOpenSparring: true,
      status: { in: ['CONFIRMED', 'PLAYING'] },
      deletedAt: null,
    };

    if (venueSlug) {
      whereClause.court = {
        venue: {
          slug: venueSlug,
        },
      };
    }

    if (level && level !== 'ALL') {
      whereClause.sparringLevel = level;
    }

    const bookings = await this.prisma.booking.findMany({
      where: whereClause,
      include: {
        court: {
          include: {
            venue: true,
          },
        },
        customer: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return bookings.map((b) => {
      const courtTotalNum = Number(b.courtTotal);
      const estimatedCostPerTeam = Math.round(courtTotalNum / 2);

      return {
        id: b.id,
        bookingCode: b.bookingCode,
        venueName: b.court.venue.name,
        venueSlug: b.court.venue.slug,
        venueAddress: b.court.venue.address,
        courtName: b.court.name,
        courtType: b.court.type,
        bookingDate: b.bookingDate.toISOString().split('T')[0],
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        durationHours: b.durationHours,
        hostTeamName: b.customer.teamName || b.customer.fullName,
        hostCaptainName: b.customer.fullName,
        maskedPhone: this.maskPhoneNumber(b.customer.phone),
        sparringLevel: b.sparringLevel || 'Casual',
        notes:
          b.notes ||
          'Terbuka untuk sparring santai / fun match. Patungan sewa 50:50.',
        courtTotal: courtTotalNum,
        estimatedCostPerTeam,
        status: b.status,
      };
    });
  }

  /**
   * Mengaktifkan atau menonaktifkan status sparring pada booking.
   */
  async toggleSparring(bookingId: string, dto: ToggleSparringDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, court: true },
    });

    if (!booking) {
      throw new NotFoundException(
        `Booking dengan ID ${bookingId} tidak ditemukan.`,
      );
    }

    if (!['CONFIRMED', 'PLAYING'].includes(booking.status)) {
      throw new BadRequestException(
        `Sparring hanya dapat dibuka untuk booking yang sudah lunas DP / terkonfirmasi. Status saat ini: ${booking.status}.`,
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        isOpenSparring: dto.isOpenSparring,
        sparringLevel: dto.isOpenSparring
          ? dto.sparringLevel || 'Casual'
          : null,
        notes: dto.notes ?? booking.notes,
      },
      include: {
        court: { include: { venue: true } },
        customer: true,
      },
    });

    return {
      message: dto.isOpenSparring
        ? 'Tantangan sparring berhasil diaktifkan di papan publik.'
        : 'Tantangan sparring berhasil ditutup.',
      bookingId: updated.id,
      isOpenSparring: updated.isOpenSparring,
      sparringLevel: updated.sparringLevel,
      notes: updated.notes,
    };
  }

  /**
   * Memproses tantangan sparring dari kapten lawan (dengan persetujuan UU PDP)
   * dan menyusun tautan komunikasi WhatsApp langsung ke kapten tim tuan rumah.
   */
  async challengeSparring(bookingId: string, dto: ChallengeSparringDto) {
    if (!dto.consentGiven) {
      throw new BadRequestException(
        'Persetujuan interaksi resmi (kepatuhan UU PDP) wajib disetujui sebelum menghubungkan kontak tim.',
      );
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: { include: { venue: true } },
        customer: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(
        `Jadwal sparring dengan ID ${bookingId} tidak ditemukan.`,
      );
    }

    if (!booking.isOpenSparring) {
      throw new BadRequestException(
        'Jadwal pertandingan ini sudah tidak menerima tantangan sparring baru.',
      );
    }

    // Format target phone (08xx -> 628xx)
    let rawPhone = booking.customer.phone.replace(/\D/g, '');
    if (rawPhone.startsWith('0')) {
      rawPhone = '62' + rawPhone.slice(1);
    }

    const dateStr = booking.bookingDate.toISOString().split('T')[0];
    const startHourStr = booking.startTime
      .getUTCHours()
      .toString()
      .padStart(2, '0');
    const endHourStr = booking.endTime
      .getUTCHours()
      .toString()
      .padStart(2, '0');

    const message =
      `Halo Kapten *${booking.customer.fullName}* (*${booking.customer.teamName || 'Tim Tuan Rumah'}*),\n\n` +
      `Kami dari *${dto.challengerTeamName}* (Kapten *${dto.challengerCaptainName}* - ${dto.challengerPhone}) melihat jadwal Anda di *Papan Sparring StackPlus Futsal*:\n\n` +
      `📍 *Venue*: ${booking.court.venue.name} (${booking.court.name})\n` +
      `📅 *Jadwal*: ${dateStr} jam ${startHourStr}:00 - ${endHourStr}:00 WIB\n` +
      `⚔️ *Level*: ${booking.sparringLevel || 'Casual'}\n\n` +
      `Apakah slot sparring ini masih terbuka untuk tanding bersama? Terima kasih!`;

    const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;

    return {
      success: true,
      bookingId: booking.id,
      hostTeam: booking.customer.teamName || booking.customer.fullName,
      hostCaptain: booking.customer.fullName,
      challengerTeam: dto.challengerTeamName,
      whatsappUrl,
      messageTemplate: message,
    };
  }
}
