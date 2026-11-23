import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberContractDto } from './dto/create-member-contract.dto';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Membuat kontrak member rutin bulanan dan mengunci slot kalender otomatis (FR-003).
   */
  async createContract(dto: CreateMemberContractDto) {
    const venue = await this.prisma.venue.findFirst({
      where: { slug: dto.venueSlug, isActive: true },
    });

    if (!venue) {
      throw new NotFoundException(`Venue ${dto.venueSlug} tidak ditemukan`);
    }

    const court = await this.prisma.court.findFirst({
      where: { id: dto.courtId, venueId: venue.id, isActive: true },
    });

    if (!court) {
      throw new NotFoundException(
        `Lapangan ID ${dto.courtId} tidak ditemukan di venue ini`,
      );
    }

    // 1. Cari atau buat customer
    let customer = await this.prisma.customer.findFirst({
      where: { tenantId: venue.tenantId, phone: dto.customerPhone },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          tenantId: venue.tenantId,
          fullName: dto.customerName,
          phone: dto.customerPhone,
          teamName: dto.teamName,
        },
      });
    }

    // 2. Tentukan rentang tanggal kontrak (startDate s.d. startDate + monthsDuration bulan)
    const [startYear, startMonth, startDay] = dto.startDate
      .split('-')
      .map(Number);
    const startContractDate = new Date(
      Date.UTC(startYear, startMonth - 1, startDay),
    );

    const endContractDate = new Date(
      Date.UTC(startYear, startMonth - 1 + dto.monthsDuration, startDay),
    );

    // 3. Generate semua tanggal yang harinya cocok dengan dayOfWeek
    const targetDates: Date[] = [];
    const cur = new Date(startContractDate.getTime());

    while (cur < endContractDate) {
      if (cur.getUTCDay() === dto.dayOfWeek) {
        targetDates.push(new Date(cur.getTime()));
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    if (targetDates.length === 0) {
      throw new BadRequestException(
        'Tidak ada jadwal yang sesuai dalam rentang durasi kontrak tersebut.',
      );
    }

    const endHour = dto.startHour + dto.durationHours;

    // 4. Periksa bentrok dengan RecurringSlot atau Booking lain
    for (const targetDate of targetDates) {
      const existingSlot = await this.prisma.recurringSlot.findFirst({
        where: {
          courtId: court.id,
          date: targetDate,
          startHour: { lt: endHour },
          endHour: { gt: dto.startHour },
        },
      });

      if (existingSlot) {
        const dateStr = targetDate.toISOString().split('T')[0];
        throw new ConflictException(
          `Slot pada ${dateStr} jam ${dto.startHour}:00-${endHour}:00 sudah terisi oleh member lain.`,
        );
      }

      // Cek bentrok dengan booking umum
      const conflictBooking = await this.prisma.booking.findFirst({
        where: {
          courtId: court.id,
          bookingDate: targetDate,
          status: { in: ['CONFIRMED', 'PLAYING', 'PENDING_PAYMENT'] },
          startTime: {
            lt: new Date(
              Date.UTC(
                targetDate.getUTCFullYear(),
                targetDate.getUTCMonth(),
                targetDate.getUTCDate(),
                endHour,
              ),
            ),
          },
          endTime: {
            gt: new Date(
              Date.UTC(
                targetDate.getUTCFullYear(),
                targetDate.getUTCMonth(),
                targetDate.getUTCDate(),
                dto.startHour,
              ),
            ),
          },
        },
      });

      if (conflictBooking) {
        const dateStr = targetDate.toISOString().split('T')[0];
        throw new ConflictException(
          `Slot pada ${dateStr} jam ${dto.startHour}:00-${endHour}:00 sudah dibooking oleh umum (${conflictBooking.bookingCode}).`,
        );
      }
    }

    // 5. Simpan kontrak dan kunci semua RecurringSlot secara transaksional
    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.memberContract.create({
        data: {
          customerId: customer.id,
          courtId: court.id,
          dayOfWeek: dto.dayOfWeek,
          startHour: dto.startHour,
          durationHours: dto.durationHours,
          startDate: startContractDate,
          endDate: endContractDate,
          monthlyFee: BigInt(dto.monthlyFee),
          isActive: true,
        },
      });

      for (const targetDate of targetDates) {
        await tx.recurringSlot.create({
          data: {
            contractId: contract.id,
            courtId: court.id,
            date: targetDate,
            startHour: dto.startHour,
            endHour,
          },
        });
      }

      return {
        contractId: contract.id,
        teamName: dto.teamName,
        courtName: court.name,
        dayOfWeek: dto.dayOfWeek,
        time: `${String(dto.startHour).padStart(2, '0')}:00 – ${String(endHour).padStart(2, '0')}:00 WIB`,
        startDate: dto.startDate,
        endDate: endContractDate.toISOString().split('T')[0],
        totalSlotsLocked: targetDates.length,
        monthlyFee: dto.monthlyFee,
      };
    });
  }

  /**
   * Menampilkan daftar kontrak member aktif di suatu venue.
   */
  async listContracts(venueSlug: string) {
    const venue = await this.prisma.venue.findFirst({
      where: { slug: venueSlug, isActive: true },
      include: { courts: true },
    });

    if (!venue) {
      throw new NotFoundException(`Venue ${venueSlug} tidak ditemukan`);
    }

    const courtIds = venue.courts.map((c) => c.id);

    const contracts = await this.prisma.memberContract.findMany({
      where: {
        courtId: { in: courtIds },
        deletedAt: null,
      },
      include: {
        customer: true,
        slots: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const dayNames = [
      'Minggu',
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
    ];

    return contracts.map((c) => {
      const court = venue.courts.find(
        (courtItem) => courtItem.id === c.courtId,
      );
      const endHour = c.startHour + c.durationHours;
      return {
        id: c.id,
        customerName: c.customer.fullName,
        customerPhone: c.customer.phone,
        teamName: c.customer.teamName || 'Tim Member',
        courtName: court?.name || 'Lapangan',
        courtType: court?.type || 'FUTSAL',
        dayName: dayNames[c.dayOfWeek],
        time: `${String(c.startHour).padStart(2, '0')}:00 – ${String(endHour).padStart(2, '0')}:00 WIB`,
        startDate: c.startDate.toISOString().split('T')[0],
        endDate: c.endDate.toISOString().split('T')[0],
        monthlyFee: Number(c.monthlyFee),
        totalSlots: c.slots.length,
        isActive: c.isActive,
      };
    });
  }

  /**
   * Membatalkan kontrak member dan membuka kembali slot kalender ke publik.
   */
  async cancelContract(id: string) {
    const contract = await this.prisma.memberContract.findUnique({
      where: { id },
    });

    if (!contract) {
      throw new NotFoundException(`Kontrak ID ${id} tidak ditemukan`);
    }

    await this.prisma.$transaction(async (tx) => {
      // Hapus slot berulang agar kalender publik terbuka kembali
      await tx.recurringSlot.deleteMany({
        where: { contractId: contract.id },
      });

      await tx.memberContract.update({
        where: { id: contract.id },
        data: { isActive: false, deletedAt: new Date() },
      });
    });

    return {
      success: true,
      message: 'Kontrak member dibatalkan dan slot dirilis kembali ke publik.',
    };
  }
}
