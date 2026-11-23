import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrisma = {
    venue: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
    },
    recurringSlot: {
      findMany: jest.fn(),
    },
    cashierShift: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const sampleVenue = {
    id: 'venue-01',
    name: 'Champion Arena',
    courts: [
      {
        id: 'court-01',
        name: 'Lapangan 1 - Vinyl Pro',
        type: 'VINYL',
        isActive: true,
        deletedAt: null,
      },
      {
        id: 'court-02',
        name: 'Lapangan 2 - Rumput Sintetis',
        type: 'SINTETIS',
        isActive: true,
        deletedAt: null,
      },
    ],
  };

  const sampleBooking = {
    id: 'bk-01',
    courtId: 'court-01',
    durationHours: 2,
    startTime: new Date('2026-11-24T12:00:00Z'), // UTC 12 = 19:00 WIB (prime time)
    courtTotal: BigInt(250000),
    grandTotal: BigInt(290000),
    paymentMethod: 'CASH_AT_COUNTER',
    canteenOrders: [
      {
        subtotal: BigInt(20000),
        product: { category: 'BEVERAGE' },
      },
      {
        subtotal: BigInt(20000),
        product: { category: 'EQUIPMENT_RENTAL' },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOccupancyReport', () => {
    it('should throw NotFoundException if venue not found', async () => {
      mockPrisma.venue.findFirst.mockResolvedValue(null);
      await expect(service.getOccupancyReport('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should calculate occupancy rate properly for today/7days/30days', async () => {
      mockPrisma.venue.findFirst.mockResolvedValue(sampleVenue);
      mockPrisma.booking.findMany.mockResolvedValue([sampleBooking]);
      mockPrisma.recurringSlot.findMany.mockResolvedValue([
        {
          courtId: 'court-02',
          startHour: 19,
          endHour: 21,
        },
      ]);

      const res = await service.getOccupancyReport('venue-01', 'today');

      expect(res.venueName).toBe('Champion Arena');
      expect(res.summary.totalBookedHours).toBe(4); // 2 + 2
      expect(res.summary.primeTimeHours).toBe(4);
      expect(res.courtBreakdown).toHaveLength(2);
      expect(res.summary.overallOccupancyRate).toBeGreaterThan(0);
    });
  });

  describe('getRevenueReport', () => {
    it('should throw NotFoundException if venue not found', async () => {
      mockPrisma.venue.findFirst.mockResolvedValue(null);
      await expect(service.getRevenueReport('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should calculate breakdown of court, canteen, rental, and payment methods', async () => {
      mockPrisma.venue.findFirst.mockResolvedValue(sampleVenue);
      mockPrisma.booking.findMany.mockResolvedValue([sampleBooking]);

      const res = await service.getRevenueReport('venue-01', '7days');

      expect(res.summary.totalCourtRevenue).toBe(250000);
      expect(res.summary.totalCanteenRevenue).toBe(20000);
      expect(res.summary.totalRentalRevenue).toBe(20000);
      expect(res.summary.grandTotalRevenue).toBe(290000);
      expect(res.paymentMethodsBreakdown.CASH_AT_COUNTER).toBe(290000);
    });
  });

  describe('getCashierShifts', () => {
    it('should return mapped cashier shift history with calculated variance', async () => {
      mockPrisma.cashierShift.findMany.mockResolvedValue([
        {
          id: 'shift-01',
          venue: { name: 'Champion Arena' },
          openedAt: new Date('2026-11-24T00:00:00Z'),
          closedAt: new Date('2026-11-24T08:00:00Z'),
          startingCash: BigInt(200000),
          actualCashEnding: BigInt(500000),
          systemCashTotal: BigInt(300000),
          notes: 'Shift Pagi',
        },
      ]);

      const res = await service.getCashierShifts('venue-01');

      expect(res).toHaveLength(1);
      expect(res[0].startingCash).toBe(200000);
      expect(res[0].actualCashEnding).toBe(500000);
      expect(res[0].variance).toBe(0); // 500000 - (200000 + 300000)
    });
  });

  describe('closeShift', () => {
    const closeDto = {
      venueId: 'venue-01',
      openedById: 'user-01',
      startingCash: 200000,
      actualCashEnding: 490000, // Deficit 10.000
      notes: 'Ada selisih uang receh',
    };

    it('should throw NotFoundException if venue not found', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(null);
      await expect(service.closeShift(closeDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should close shift and calculate DEFICIT correctly', async () => {
      mockPrisma.venue.findUnique.mockResolvedValue(sampleVenue);
      mockPrisma.booking.findMany.mockResolvedValue([
        {
          grandTotal: BigInt(300000),
        },
      ]);
      mockPrisma.cashierShift.create.mockResolvedValue({
        id: 'shift-02',
        venue: { name: 'Champion Arena' },
        startingCash: BigInt(200000),
        actualCashEnding: BigInt(490000),
        systemCashTotal: BigInt(300000),
      });

      const res = await service.closeShift(closeDto);

      expect(res.expectedCash).toBe(500000);
      expect(res.actualCashEnding).toBe(490000);
      expect(res.variance).toBe(-10000);
      expect(res.status).toBe('DEFICIT');
    });
  });
});
