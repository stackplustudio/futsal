import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

const VENUE_SELECT = {
  id: true,
  name: true,
  slug: true,
  phone: true,
  address: true,
  city: true,
  latitude: true,
  longitude: true,
  timezone: true,
  openHour: true,
  closeHour: true,
  defaultDpPercent: true,
  isActive: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateVenueDto) {
    // Cek duplikasi slug dalam tenant yang sama
    const existing = await this.prisma.venue.findUnique({
      where: { tenantId_slug: { tenantId, slug: dto.slug } },
    });
    if (existing) {
      throw new ConflictException(
        `Slug "${dto.slug}" sudah digunakan oleh venue lain di tenant ini.`,
      );
    }

    return this.prisma.venue.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        latitude: dto.latitude,
        longitude: dto.longitude,
        timezone: dto.timezone ?? 'Asia/Jakarta',
        openHour: dto.openHour ?? 7,
        closeHour: dto.closeHour ?? 24,
        defaultDpPercent: dto.defaultDpPercent ?? 50,
      },
      select: VENUE_SELECT,
    });
  }

  async findAll(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.venue.findMany({
        where: { tenantId, deletedAt: null },
        select: VENUE_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.venue.count({ where: { tenantId, deletedAt: null } }),
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

  async findOne(tenantId: string, id: string) {
    const venue = await this.prisma.venue.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        ...VENUE_SELECT,
        courts: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!venue) throw new NotFoundException('Venue tidak ditemukan.');
    return venue;
  }

  async update(tenantId: string, id: string, dto: UpdateVenueDto) {
    await this.assertVenueExists(tenantId, id);

    // Jika slug diubah, cek duplikasi
    if (dto.slug) {
      const conflict = await this.prisma.venue.findFirst({
        where: {
          tenantId,
          slug: dto.slug,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (conflict) {
        throw new ConflictException(
          `Slug "${dto.slug}" sudah digunakan oleh venue lain.`,
        );
      }
    }

    return this.prisma.venue.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(dto.openHour !== undefined && { openHour: dto.openHour }),
        ...(dto.closeHour !== undefined && { closeHour: dto.closeHour }),
        ...(dto.defaultDpPercent !== undefined && {
          defaultDpPercent: dto.defaultDpPercent,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: VENUE_SELECT,
    });
  }

  /** Soft delete — hapus logis, data historis tetap terjaga */
  async remove(tenantId: string, id: string) {
    await this.assertVenueExists(tenantId, id);
    return this.prisma.venue.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, name: true, deletedAt: true },
    });
  }

  private async assertVenueExists(tenantId: string, id: string) {
    const venue = await this.prisma.venue.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!venue) throw new NotFoundException('Venue tidak ditemukan.');
  }
}
