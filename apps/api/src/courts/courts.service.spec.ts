import { Test, TestingModule } from '@nestjs/testing';
import { CourtsService } from './courts.service';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CourtType } from './dto/create-court.dto';
import { DayType } from './dto/create-pricing-rule.dto';

describe('CourtsService (Unit Tests)', () => {
  let service: CourtsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      venue: { findFirst: jest.fn() },
      court: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      courtPricingRule: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((promises) => Promise.all(promises)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourtsService,
        PricingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CourtsService>(CourtsService);
  });

  describe('create', () => {
    it('harus membuat court baru jika venue ditemukan', async () => {
      prisma.venue.findFirst.mockResolvedValue({ id: 'v1' });
      prisma.court.create.mockResolvedValue({
        id: 'c1',
        venueId: 'v1',
        name: 'Lapangan 1',
        type: CourtType.FUTSAL_VINYL,
      });

      const result = await service.create('v1', {
        name: 'Lapangan 1',
        type: CourtType.FUTSAL_VINYL,
      });

      expect(result.id).toBe('c1');
    });

    it('harus melempar NotFoundException jika venue tidak ada', async () => {
      prisma.venue.findFirst.mockResolvedValue(null);
      await expect(
        service.create('v1', {
          name: 'Lapangan 1',
          type: CourtType.FUTSAL_VINYL,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('harus mengembalikan daftar lapangan per venue dengan paginasi', async () => {
      prisma.court.findMany.mockResolvedValue([{ id: 'c1', name: 'Lap 1' }]);
      prisma.court.count.mockResolvedValue(1);

      const result = await service.findAll('v1', 1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('harus mengembalikan lapangan beserta aturan tarif yang telah diserialisasi', async () => {
      prisma.court.findFirst.mockResolvedValue({
        id: 'c1',
        name: 'Lap 1',
        pricingRules: [
          {
            id: 'r1',
            dayType: 'WEEKDAY',
            startHour: 18,
            endHour: 24,
            hourlyRate: BigInt(300_000),
          },
        ],
      });

      const result = await service.findOne('v1', 'c1');
      expect(result.id).toBe('c1');
      expect(result.pricingRules[0].hourlyRate).toBe(300000);
    });

    it('harus melempar NotFoundException jika court tidak ditemukan', async () => {
      prisma.court.findFirst.mockResolvedValue(null);
      await expect(service.findOne('v1', 'c99')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addPricingRule', () => {
    it('harus menambahkan rule baru jika tidak ada tumpang tindih', async () => {
      prisma.court.findFirst.mockResolvedValue({ id: 'c1' });
      prisma.courtPricingRule.findFirst.mockResolvedValue(null);
      prisma.courtPricingRule.create.mockResolvedValue({
        id: 'r1',
        courtId: 'c1',
        dayType: 'WEEKDAY',
        startHour: 18,
        endHour: 24,
        hourlyRate: BigInt(300_000),
      });

      const result = await service.addPricingRule('v1', 'c1', {
        dayType: DayType.WEEKDAY,
        startHour: 18,
        endHour: 24,
        hourlyRate: 300_000,
      });

      expect(result.hourlyRate).toBe(300000);
    });

    it('harus melempar BadRequestException jika startHour >= endHour', async () => {
      prisma.court.findFirst.mockResolvedValue({ id: 'c1' });

      await expect(
        service.addPricingRule('v1', 'c1', {
          dayType: DayType.WEEKDAY,
          startHour: 20,
          endHour: 18,
          hourlyRate: 200_000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('harus melempar ConflictException jika jam sewa tumpang tindih', async () => {
      prisma.court.findFirst.mockResolvedValue({ id: 'c1' });
      prisma.courtPricingRule.findFirst.mockResolvedValue({
        startHour: 17,
        endHour: 20,
      });

      await expect(
        service.addPricingRule('v1', 'c1', {
          dayType: DayType.WEEKDAY,
          startHour: 18,
          endHour: 22,
          hourlyRate: 250_000,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('previewPricing', () => {
    it('harus menghitung total sewa dan rincian jam secara proporsional', async () => {
      prisma.court.findFirst.mockResolvedValue({ id: 'c1' });
      prisma.courtPricingRule.findMany.mockResolvedValue([
        {
          dayType: 'WEEKDAY',
          startHour: 15,
          endHour: 18,
          hourlyRate: BigInt(200_000),
        },
        {
          dayType: 'WEEKDAY',
          startHour: 18,
          endHour: 24,
          hourlyRate: BigInt(300_000),
        },
      ]);

      const result = await service.previewPricing(
        'v1',
        'c1',
        17,
        19,
        '2026-11-23T00:00:00Z',
      );

      expect(result.courtTotal).toBe(500000);
      expect(result.breakdown).toHaveLength(2);
    });
  });

  describe('removePricingRule', () => {
    it('harus menghapus rule jika ditemukan', async () => {
      prisma.court.findFirst.mockResolvedValue({ id: 'c1' });
      prisma.courtPricingRule.findFirst.mockResolvedValue({ id: 'r1' });
      prisma.courtPricingRule.delete.mockResolvedValue({ id: 'r1' });

      const result = await service.removePricingRule('v1', 'c1', 'r1');
      expect(result.id).toBe('r1');
    });

    it('harus melempar NotFoundException jika rule tidak ditemukan', async () => {
      prisma.court.findFirst.mockResolvedValue({ id: 'c1' });
      prisma.courtPricingRule.findFirst.mockResolvedValue(null);

      await expect(
        service.removePricingRule('v1', 'c1', 'r99'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
