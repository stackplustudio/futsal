import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloseShiftDto } from './dto/close-shift.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Menghitung rentang tanggal berdasarkan filter range ("today", "7days", "30days")
   */
  private getDateRange(range: string = '7days'): {
    startDate: Date;
    endDate: Date;
    daysCount: number;
  } {
    const now = new Date();
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
    let startDate: Date;
    let daysCount = 7;

    if (range === 'today') {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );
      daysCount = 1;
    } else if (range === '30days') {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 29,
        0,
        0,
        0,
        0,
      );
      daysCount = 30;
    } else {
      // Default 7 days
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 6,
        0,
        0,
        0,
        0,
      );
      daysCount = 7;
    }

    return { startDate, endDate, daysCount };
  }

  /**
   * Menghitung laporan okupansi lapangan (% jam terisi vs kapasitas operasional)
   */
  async getOccupancyReport(venueId?: string, range: string = '7days') {
    const { startDate, endDate, daysCount } = this.getDateRange(range);

    const venueWhere = venueId ? { id: venueId } : {};
    const venue = await this.prisma.venue.findFirst({
      where: venueWhere,
      include: {
        courts: {
          where: { isActive: true, deletedAt: null },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue tidak ditemukan.');
    }

    const courtIds = venue.courts.map((c) => c.id);
    const activeCourtCount = courtIds.length || 1;

    // Jam operasional harian: default 16 jam per hari (07:00 - 23:00 WIB)
    const operatingHoursPerDay = 16;
    const totalCapacityHours =
      activeCourtCount * operatingHoursPerDay * daysCount;

    // Ambil bookings terisi
    const bookings = await this.prisma.booking.findMany({
      where: {
        courtId: { in: courtIds },
        status: { in: ['CONFIRMED', 'PLAYING', 'COMPLETED'] },
        bookingDate: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      include: {
        court: true,
      },
    });

    // Ambil recurring member slots
    const recurringSlots = await this.prisma.recurringSlot.findMany({
      where: {
        courtId: { in: courtIds },
        date: { gte: startDate, lte: endDate },
      },
      include: {
        court: true,
      },
    });

    // Hitung total jam terisi
    let totalBookedHours = 0;
    let primeTimeHours = 0; // 18:00 - 23:00 (5 jam)
    let nonPrimeTimeHours = 0;

    const courtOccupancyMap: Record<
      string,
      { courtName: string; type: string; bookedHours: number }
    > = {};
    for (const court of venue.courts) {
      courtOccupancyMap[court.id] = {
        courtName: court.name,
        type: court.type,
        bookedHours: 0,
      };
    }

    for (const b of bookings) {
      const dur = b.durationHours;
      totalBookedHours += dur;
      if (courtOccupancyMap[b.courtId]) {
        courtOccupancyMap[b.courtId].bookedHours += dur;
      }

      const startH = b.startTime.getUTCHours();
      if (startH >= 11 && startH < 16) {
        // UTC 11:00 = 18:00 WIB, UTC 16:00 = 23:00 WIB
        primeTimeHours += dur;
      } else {
        nonPrimeTimeHours += dur;
      }
    }

    for (const r of recurringSlots) {
      const dur = r.endHour - r.startHour;
      totalBookedHours += dur;
      if (courtOccupancyMap[r.courtId]) {
        courtOccupancyMap[r.courtId].bookedHours += dur;
      }

      if (r.startHour >= 18 && r.startHour < 23) {
        primeTimeHours += dur;
      } else {
        nonPrimeTimeHours += dur;
      }
    }

    const overallOccupancyRate =
      totalCapacityHours > 0
        ? Math.min(
            100,
            Math.round((totalBookedHours / totalCapacityHours) * 100),
          )
        : 0;

    const courtBreakdown = Object.values(courtOccupancyMap).map((c) => {
      const courtCapacity = operatingHoursPerDay * daysCount;
      const rate =
        courtCapacity > 0
          ? Math.min(100, Math.round((c.bookedHours / courtCapacity) * 100))
          : 0;
      return {
        courtName: c.courtName,
        type: c.type,
        bookedHours: c.bookedHours,
        totalCapacityHours: courtCapacity,
        occupancyRate: rate,
      };
    });

    return {
      venueId: venue.id,
      venueName: venue.name,
      range,
      daysCount,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      summary: {
        totalCapacityHours,
        totalBookedHours,
        overallOccupancyRate,
        primeTimeHours,
        nonPrimeTimeHours,
      },
      courtBreakdown,
    };
  }

  /**
   * Menghitung laporan pendapatan/omzet bisnis venue
   */
  async getRevenueReport(venueId?: string, range: string = '7days') {
    const { startDate, endDate, daysCount } = this.getDateRange(range);

    const venueWhere = venueId ? { id: venueId } : {};
    const venue = await this.prisma.venue.findFirst({
      where: venueWhere,
      include: {
        courts: { select: { id: true } },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue tidak ditemukan.');
    }

    const courtIds = venue.courts.map((c) => c.id);

    const bookings = await this.prisma.booking.findMany({
      where: {
        courtId: { in: courtIds },
        status: { in: ['CONFIRMED', 'PLAYING', 'COMPLETED'] },
        bookingDate: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      include: {
        canteenOrders: {
          include: {
            product: true,
          },
        },
      },
    });

    let totalCourtRevenue = 0;
    let totalCanteenRevenue = 0;
    let totalRentalRevenue = 0;

    const paymentMethodsBreakdown: Record<string, number> = {
      CASH_AT_COUNTER: 0,
      MIDTRANS_QRIS: 0,
      MIDTRANS_VA: 0,
      EDC_DEBIT: 0,
    };

    for (const b of bookings) {
      const courtTotal = Number(b.courtTotal);
      totalCourtRevenue += courtTotal;

      const method = b.paymentMethod || 'CASH_AT_COUNTER';
      paymentMethodsBreakdown[method] =
        (paymentMethodsBreakdown[method] || 0) + Number(b.grandTotal);

      for (const order of b.canteenOrders) {
        const subtotal = Number(order.subtotal);
        if (order.product.category === 'EQUIPMENT_RENTAL') {
          totalRentalRevenue += subtotal;
        } else {
          totalCanteenRevenue += subtotal;
        }
      }
    }

    const grandTotalRevenue =
      totalCourtRevenue + totalCanteenRevenue + totalRentalRevenue;

    return {
      venueId: venue.id,
      venueName: venue.name,
      range,
      daysCount,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      summary: {
        grandTotalRevenue,
        totalCourtRevenue,
        totalCanteenRevenue,
        totalRentalRevenue,
        totalTransactions: bookings.length,
      },
      paymentMethodsBreakdown,
    };
  }

  /**
   * Mengambil riwayat tutup shift kasir resepsionis
   */
  async getCashierShifts(venueId?: string) {
    const whereClause = venueId ? { venueId } : {};
    const shifts = await this.prisma.cashierShift.findMany({
      where: whereClause,
      include: { venue: true },
      orderBy: { openedAt: 'desc' },
      take: 20,
    });

    return shifts.map((s) => ({
      id: s.id,
      venueName: s.venue.name,
      openedAt: s.openedAt.toISOString(),
      closedAt: s.closedAt ? s.closedAt.toISOString() : null,
      startingCash: Number(s.startingCash),
      actualCashEnding:
        s.actualCashEnding !== null ? Number(s.actualCashEnding) : null,
      systemCashTotal:
        s.systemCashTotal !== null ? Number(s.systemCashTotal) : null,
      variance:
        s.actualCashEnding !== null && s.systemCashTotal !== null
          ? Number(s.actualCashEnding) -
            (Number(s.startingCash) + Number(s.systemCashTotal))
          : null,
      notes: s.notes,
    }));
  }

  /**
   * Menutup sesi kasir resepsionis (Cashier Shift Close)
   */
  async closeShift(dto: CloseShiftDto) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: dto.venueId },
      include: { courts: { select: { id: true } } },
    });

    if (!venue) {
      throw new NotFoundException(
        `Venue dengan ID ${dto.venueId} tidak ditemukan.`,
      );
    }

    const courtIds = venue.courts.map((c) => c.id);

    // Hitung transaksi tunai kasir hari ini
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const cashBookings = await this.prisma.booking.findMany({
      where: {
        courtId: { in: courtIds },
        status: { in: ['CONFIRMED', 'PLAYING', 'COMPLETED'] },
        paymentMethod: 'CASH_AT_COUNTER',
        paidAt: { gte: todayStart },
      },
    });

    let systemCashTotal = 0;
    for (const b of cashBookings) {
      systemCashTotal += Number(b.grandTotal);
    }

    const expectedCash = dto.startingCash + systemCashTotal;
    const variance = dto.actualCashEnding - expectedCash;

    const shift = await this.prisma.cashierShift.create({
      data: {
        venueId: dto.venueId,
        openedById: dto.openedById,
        closedById: dto.closedById || dto.openedById,
        closedAt: new Date(),
        startingCash: BigInt(dto.startingCash),
        actualCashEnding: BigInt(dto.actualCashEnding),
        systemCashTotal: BigInt(systemCashTotal),
        notes:
          dto.notes ||
          `Shift tutup kasir. Selisih: Rp ${variance.toLocaleString('id-ID')}`,
      },
      include: { venue: true },
    });

    return {
      message: 'Sesi kasir berhasil ditutup dan direkapitulasi.',
      shiftId: shift.id,
      venueName: shift.venue.name,
      startingCash: Number(shift.startingCash),
      systemCashTotal,
      expectedCash,
      actualCashEnding: Number(shift.actualCashEnding),
      variance,
      status:
        variance === 0 ? 'BALANCED' : variance > 0 ? 'SURPLUS' : 'DEFICIT',
    };
  }
}
