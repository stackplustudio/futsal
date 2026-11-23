import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';

const COURT_SELECT = {
  id: true,
  venueId: true,
  name: true,
  type: true,
  lengthMeters: true,
  widthMeters: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CourtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async create(venueId: string, dto: CreateCourtDto) {
    // Pastikan venue ada dan aktif
    await this.assertVenueExists(venueId);

    return this.prisma.court.create({
      data: {
        venueId,
        name: dto.name,
        type: dto.type,
        lengthMeters: dto.lengthMeters,
        widthMeters: dto.widthMeters,
        description: dto.description,
      },
      select: COURT_SELECT,
    });
  }

  async findAll(venueId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.court.findMany({
        where: { venueId, deletedAt: null },
        select: COURT_SELECT,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.court.count({ where: { venueId, deletedAt: null } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(venueId: string, id: string) {
    const court = await this.prisma.court.findFirst({
      where: { id, venueId, deletedAt: null },
      select: {
        ...COURT_SELECT,
        pricingRules: {
          select: {
            id: true,
            dayType: true,
            startHour: true,
            endHour: true,
            hourlyRate: true,
          },
          orderBy: [{ dayType: 'asc' }, { startHour: 'asc' }],
        },
      },
    });
    if (!court) throw new NotFoundException('Lapangan tidak ditemukan.');

    // Serialisasi BigInt agar bisa dikirim sebagai JSON
    return {
      ...court,
      pricingRules: court.pricingRules.map((r) => ({
        ...r,
        hourlyRate: Number(r.hourlyRate),
      })),
    };
  }

  async update(venueId: string, id: string, dto: UpdateCourtDto) {
    await this.assertCourtExists(venueId, id);

    return this.prisma.court.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.lengthMeters !== undefined && {
          lengthMeters: dto.lengthMeters,
        }),
        ...(dto.widthMeters !== undefined && { widthMeters: dto.widthMeters }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: COURT_SELECT,
    });
  }

  /** Soft delete lapangan */
  async remove(venueId: string, id: string) {
    await this.assertCourtExists(venueId, id);
    return this.prisma.court.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, name: true, deletedAt: true },
    });
  }

  // ── Aturan Tarif Dinamis ───────────────────────────────────────────────────

  async addPricingRule(
    venueId: string,
    courtId: string,
    dto: CreatePricingRuleDto,
  ) {
    await this.assertCourtExists(venueId, courtId);

    if (dto.startHour >= dto.endHour) {
      throw new BadRequestException(
        'startHour harus lebih kecil dari endHour.',
      );
    }

    // Cek tumpang tindih rule di dayType yang sama
    const overlapping = await this.prisma.courtPricingRule.findFirst({
      where: {
        courtId,
        dayType: dto.dayType,
        OR: [
          {
            startHour: { lt: dto.endHour },
            endHour: { gt: dto.startHour },
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictException(
        `Aturan tarif ${dto.dayType} ${dto.startHour}:00–${dto.endHour}:00 ` +
          `bertumpang tindih dengan rule yang sudah ada (${overlapping.startHour}:00–${overlapping.endHour}:00).`,
      );
    }

    const rule = await this.prisma.courtPricingRule.create({
      data: {
        courtId,
        dayType: dto.dayType,
        startHour: dto.startHour,
        endHour: dto.endHour,
        hourlyRate: BigInt(dto.hourlyRate),
      },
    });

    return { ...rule, hourlyRate: Number(rule.hourlyRate) };
  }

  async removePricingRule(venueId: string, courtId: string, ruleId: string) {
    await this.assertCourtExists(venueId, courtId);

    const rule = await this.prisma.courtPricingRule.findFirst({
      where: { id: ruleId, courtId },
    });
    if (!rule) throw new NotFoundException('Aturan tarif tidak ditemukan.');

    await this.prisma.courtPricingRule.delete({ where: { id: ruleId } });
    return { message: 'Aturan tarif berhasil dihapus.', id: ruleId };
  }

  /**
   * Preview kalkulasi tarif sewa (FR-001 Skenario 1):
   * Hitung total biaya sewa dari startHour hingga endHour pada tanggal tertentu.
   */
  async previewPricing(
    venueId: string,
    courtId: string,
    startHour: number,
    endHour: number,
    bookingDate: string,
  ) {
    await this.assertCourtExists(venueId, courtId);

    const rules = await this.prisma.courtPricingRule.findMany({
      where: { courtId },
    });

    const pricingRules = rules.map((r) => ({
      dayType: r.dayType,
      startHour: r.startHour,
      endHour: r.endHour,
      hourlyRate: r.hourlyRate,
    }));

    const date = new Date(bookingDate);
    const result = this.pricingService.calculate(
      startHour,
      endHour,
      date,
      pricingRules,
    );

    return {
      startHour,
      endHour,
      bookingDate,
      dayType: this.pricingService.resolveDayType(date),
      courtTotal: Number(result.courtTotal),
      breakdown: result.breakdown.map((b) => ({
        ...b,
        rate: Number(b.rate),
      })),
    };
  }

  private async assertVenueExists(venueId: string) {
    const venue = await this.prisma.venue.findFirst({
      where: { id: venueId, deletedAt: null },
      select: { id: true },
    });
    if (!venue) throw new NotFoundException('Venue tidak ditemukan.');
  }

  private async assertCourtExists(venueId: string, courtId: string) {
    const court = await this.prisma.court.findFirst({
      where: { id: courtId, venueId, deletedAt: null },
      select: { id: true },
    });
    if (!court) throw new NotFoundException('Lapangan tidak ditemukan.');
  }
}
