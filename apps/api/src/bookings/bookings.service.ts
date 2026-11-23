import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { CreatePublicBookingDto } from './dto/create-booking.dto';

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'LOCKED' | 'MEMBER_LOCKED';

export interface HourlySlot {
  hour: number;
  timeLabel: string; // e.g. "08:00 - 09:00"
  status: SlotStatus;
  rate: number;
  lockedUntil?: string;
  bookingCode?: string;
}

export interface CourtSchedule {
  courtId: string;
  courtName: string;
  courtType: string;
  slots: HourlySlot[];
}

export interface VenueScheduleResult {
  venue: {
    id: string;
    name: string;
    slug: string;
    phone: string;
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

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * Mengambil matriks ketersediaan jadwal 24 jam untuk seluruh lapangan di venue.
   * Query memanfaatkan index [courtId, bookingDate] sesuai PRD NFR 8.1.
   */
  async getVenueSchedule(
    venueSlug: string,
    dateStr: string,
  ): Promise<VenueScheduleResult> {
    const venue = await this.prisma.venue.findFirst({
      where: { slug: venueSlug, isActive: true, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        phone: true,
        address: true,
        city: true,
        openHour: true,
        closeHour: true,
        defaultDpPercent: true,
        timezone: true,
        courts: {
          where: { isActive: true, deletedAt: null },
          select: {
            id: true,
            name: true,
            type: true,
            pricingRules: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue tidak ditemukan.');
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const bookingDateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const now = new Date();
    const fifteenMinutesMs = 15 * 60 * 1000;

    // Ambil semua booking terkonfirmasi/sedang main/pending pada tanggal tersebut
    const courtIds = venue.courts.map((c) => c.id);
    const [existingBookings, recurringSlots] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          courtId: { in: courtIds },
          bookingDate: bookingDateObj,
          deletedAt: null,
          status: { in: ['CONFIRMED', 'PLAYING', 'PENDING_PAYMENT'] },
        },
        select: {
          id: true,
          courtId: true,
          startTime: true,
          endTime: true,
          status: true,
          createdAt: true,
          bookingCode: true,
        },
      }),
      this.prisma.recurringSlot.findMany({
        where: {
          courtId: { in: courtIds },
          date: bookingDateObj,
        },
      }),
    ]);

    const courtsSchedule: CourtSchedule[] = venue.courts.map((court) => {
      const courtRules = court.pricingRules.map((r) => ({
        dayType: r.dayType,
        startHour: r.startHour,
        endHour: r.endHour,
        hourlyRate: r.hourlyRate,
      }));

      const slots: HourlySlot[] = [];

      for (let hour = venue.openHour; hour < venue.closeHour; hour++) {
        const slotStart = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
        const slotEnd = new Date(
          Date.UTC(year, month - 1, day, hour + 1, 0, 0),
        );

        // Cari tarif per jam
        let rate = 0;
        try {
          const pricing = this.pricingService.calculate(
            hour,
            hour + 1,
            bookingDateObj,
            courtRules,
          );
          rate = Number(pricing.courtTotal);
        } catch {
          rate = 150_000; // Fallback wajar jika rule belum diset
        }

        // Cek apakah slot ini diisi member rutin
        const isMember = recurringSlots.some(
          (rs) =>
            rs.courtId === court.id &&
            rs.startHour <= hour &&
            rs.endHour > hour,
        );

        if (isMember) {
          slots.push({
            hour,
            timeLabel: `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`,
            status: 'MEMBER_LOCKED',
            rate,
          });
          continue;
        }

        // Cek apakah ada booking bentrok
        const conflict = existingBookings.find(
          (b) =>
            b.courtId === court.id &&
            b.startTime < slotEnd &&
            b.endTime > slotStart,
        );

        if (!conflict) {
          slots.push({
            hour,
            timeLabel: `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`,
            status: 'AVAILABLE',
            rate,
          });
        } else if (
          conflict.status === 'CONFIRMED' ||
          conflict.status === 'PLAYING'
        ) {
          slots.push({
            hour,
            timeLabel: `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`,
            status: 'BOOKED',
            rate,
          });
        } else if (conflict.status === 'PENDING_PAYMENT') {
          const isStillLocked =
            now.getTime() - conflict.createdAt.getTime() < fifteenMinutesMs;

          if (isStillLocked) {
            const lockedUntil = new Date(
              conflict.createdAt.getTime() + fifteenMinutesMs,
            ).toISOString();

            slots.push({
              hour,
              timeLabel: `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`,
              status: 'LOCKED',
              rate,
              lockedUntil,
            });
          } else {
            // Sudah lewat 15 menit, slot tersedia kembali
            slots.push({
              hour,
              timeLabel: `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`,
              status: 'AVAILABLE',
              rate,
            });
          }
        }
      }

      return {
        courtId: court.id,
        courtName: court.name,
        courtType: court.type,
        slots,
      };
    });

    return {
      venue: {
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        phone: venue.phone,
        address: venue.address,
        city: venue.city,
        openHour: venue.openHour,
        closeHour: venue.closeHour,
        defaultDpPercent: venue.defaultDpPercent,
        timezone: venue.timezone,
      },
      date: dateStr,
      courts: courtsSchedule,
    };
  }

  /**
   * Membuat reservasi publik baru dengan Atomic Row Locking (FR-001 Skenario 2).
   * Mencegah bentrok ganda (double-booking) saat dua pengguna memesan slot yang sama.
   */
  async createPublicBooking(dto: CreatePublicBookingDto) {
    const venue = await this.prisma.venue.findFirst({
      where: { slug: dto.venueSlug, isActive: true, deletedAt: null },
      include: {
        courts: {
          where: { id: dto.courtId, isActive: true, deletedAt: null },
          include: { pricingRules: true },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue tidak ditemukan.');
    }

    const court = venue.courts[0];
    if (!court) {
      throw new NotFoundException('Lapangan tidak ditemukan di venue ini.');
    }

    const endHour = dto.startHour + dto.durationHours;
    if (dto.startHour < venue.openHour || endHour > venue.closeHour) {
      throw new BadRequestException(
        `Jam sewa (${dto.startHour}:00 - ${endHour}:00) di luar jam operasional venue (${venue.openHour}:00 - ${venue.closeHour}:00).`,
      );
    }

    const [year, month, day] = dto.bookingDate.split('-').map(Number);
    const bookingDateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const startTime = new Date(
      Date.UTC(year, month - 1, day, dto.startHour, 0, 0),
    );
    const endTime = new Date(Date.UTC(year, month - 1, day, endHour, 0, 0));
    const now = new Date();
    const fifteenMinutesMs = 15 * 60 * 1000;

    // Eksekusi atomik dalam transaksi database untuk mencegah double booking
    return this.prisma.$transaction(async (tx) => {
      // 1. Cek bentrok dengan booking yang sudah ada
      const conflictingBookings = await tx.booking.findMany({
        where: {
          courtId: dto.courtId,
          deletedAt: null,
          status: { in: ['CONFIRMED', 'PLAYING', 'PENDING_PAYMENT'] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });

      for (const conflict of conflictingBookings) {
        if (conflict.status === 'CONFIRMED' || conflict.status === 'PLAYING') {
          throw new ConflictException(
            'Maaf, slot waktu ini sudah dipesan oleh tim lain.',
          );
        }

        if (conflict.status === 'PENDING_PAYMENT') {
          const isStillLocked =
            now.getTime() - conflict.createdAt.getTime() < fifteenMinutesMs;

          if (isStillLocked) {
            // Sesuai FR-001 Skenario 2: pesan tepat dari PRD
            throw new ConflictException(
              'Maaf, slot waktu ini sedang diproses oleh pemesan lain.',
            );
          } else {
            // Tandai booking lama sebagai EXPIRED karena melewati 15 menit
            await tx.booking.update({
              where: { id: conflict.id },
              data: { status: 'EXPIRED' },
            });
          }
        }
      }

      // 2. Cek bentrok dengan member rutin (RecurringSlot)
      const memberConflict = await tx.recurringSlot.findFirst({
        where: {
          courtId: dto.courtId,
          date: bookingDateObj,
          startHour: { lt: endHour },
          endHour: { gt: dto.startHour },
        },
      });

      if (memberConflict) {
        throw new ConflictException(
          'Slot ini telah dialokasikan untuk jadwal member rutin komunitas.',
        );
      }

      // 3. Kalkulasi tarif dinamis dan deposit DP
      const rules = court.pricingRules.map((r) => ({
        dayType: r.dayType,
        startHour: r.startHour,
        endHour: r.endHour,
        hourlyRate: r.hourlyRate,
      }));

      const pricing = this.pricingService.calculate(
        dto.startHour,
        endHour,
        bookingDateObj,
        rules,
      );

      const courtTotal = pricing.courtTotal;
      const depositAmount = this.pricingService.calculateDeposit(
        courtTotal,
        venue.defaultDpPercent,
      );
      const remainingDue = courtTotal - depositAmount;

      // 4. Upsert pelanggan (Customer)
      const customer = await tx.customer.upsert({
        where: {
          tenantId_phone: {
            tenantId: venue.tenantId,
            phone: dto.customerPhone,
          },
        },
        create: {
          tenantId: venue.tenantId,
          fullName: dto.customerName,
          phone: dto.customerPhone,
          email: dto.customerEmail,
          teamName: dto.teamName,
          totalBookings: 1,
        },
        update: {
          fullName: dto.customerName,
          ...(dto.customerEmail !== undefined && {
            email: dto.customerEmail,
          }),
          ...(dto.teamName !== undefined && { teamName: dto.teamName }),
          totalBookings: { increment: 1 },
        },
      });

      // 5. Terbitkan kode booking unik (misal: BK-FUT-2611-XYZ)
      const yymm = `${String(year).slice(-2)}${String(month).padStart(2, '0')}`;
      const randomSuffix = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
      const bookingCode = `BK-FUT-${yymm}-${randomSuffix}`;

      // 6. Buat entri Booking dengan status PENDING_PAYMENT
      const booking = await tx.booking.create({
        data: {
          courtId: dto.courtId,
          customerId: customer.id,
          bookingCode,
          bookingType: 'ONLINE_PUBLIC',
          status: 'PENDING_PAYMENT',
          bookingDate: bookingDateObj,
          startTime,
          endTime,
          durationHours: dto.durationHours,
          courtTotal,
          grandTotal: courtTotal,
          depositAmount,
          remainingDue,
          isOpenSparring: dto.isOpenSparring ?? false,
          sparringLevel: dto.sparringLevel,
          notes: dto.notes,
        },
        include: {
          court: { select: { id: true, name: true, type: true } },
          customer: {
            select: { fullName: true, phone: true, teamName: true },
          },
        },
      });

      const expiresAt = new Date(
        booking.createdAt.getTime() + fifteenMinutesMs,
      ).toISOString();

      return {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        status: booking.status,
        expiresAt,
        court: booking.court,
        customer: booking.customer,
        date: dto.bookingDate,
        startHour: dto.startHour,
        endHour,
        courtTotal: Number(booking.courtTotal),
        depositAmount: Number(booking.depositAmount),
        remainingDue: Number(booking.remainingDue),
        isOpenSparring: booking.isOpenSparring,
        pricingBreakdown: pricing.breakdown.map((b) => ({
          ...b,
          rate: Number(b.rate),
        })),
      };
    });
  }

  /**
   * Mengambil status booking publik berdasarkan kode booking.
   */
  async getBookingByCode(bookingCode: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        court: {
          select: {
            name: true,
            type: true,
            venue: {
              select: {
                name: true,
                address: true,
                city: true,
                phone: true,
              },
            },
          },
        },
        customer: {
          select: { fullName: true, phone: true, teamName: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking tidak ditemukan.');
    }

    const now = new Date();
    const fifteenMinutesMs = 15 * 60 * 1000;
    let status = booking.status;

    // Jika pending payment dan sudah lewat 15 menit, perbarui ke EXPIRED
    if (
      status === 'PENDING_PAYMENT' &&
      now.getTime() - booking.createdAt.getTime() >= fifteenMinutesMs
    ) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'EXPIRED' },
      });
      status = 'EXPIRED';
    }

    const expiresAt = new Date(
      booking.createdAt.getTime() + fifteenMinutesMs,
    ).toISOString();

    return {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      status,
      createdAt: booking.createdAt.toISOString(),
      expiresAt,
      court: booking.court,
      customer: booking.customer,
      bookingDate: booking.bookingDate.toISOString().slice(0, 10),
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      durationHours: booking.durationHours,
      courtTotal: Number(booking.courtTotal),
      depositAmount: Number(booking.depositAmount),
      remainingDue: Number(booking.remainingDue),
      isOpenSparring: booking.isOpenSparring,
    };
  }

  /**
   * Helper pembersihan booking pending yang sudah kedaluwarsa.
   */
  async expireStaleBookings() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const result = await this.prisma.booking.updateMany({
      where: {
        status: 'PENDING_PAYMENT',
        createdAt: { lt: fifteenMinutesAgo },
      },
      data: { status: 'EXPIRED' },
    });
    return { expiredCount: result.count };
  }
}
