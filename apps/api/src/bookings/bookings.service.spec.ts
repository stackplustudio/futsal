import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('BookingsService (Unit Tests)', () => {
  let service: BookingsService;
  let prisma: any;

  const mockVenue = {
    id: 'venue-1',
    tenantId: 'tenant-1',
    name: 'Champion Arena',
    slug: 'champion-arena',
    address: 'Jl. Sudirman',
    city: 'Jakarta Selatan',
    openHour: 7,
    closeHour: 24,
    defaultDpPercent: 50,
    timezone: 'Asia/Jakarta',
    courts: [
      {
        id: 'court-1',
        name: 'Lapangan 1 Vinyl',
        type: 'FUTSAL_VINYL',
        pricingRules: [
          {
            dayType: 'WEEKDAY',
            startHour: 7,
            endHour: 15,
            hourlyRate: BigInt(150_000),
          },
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
        ],
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      venue: { findFirst: jest.fn() },
      court: { findFirst: jest.fn() },
      booking: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      recurringSlot: { findMany: jest.fn(), findFirst: jest.fn() },
      customer: { upsert: jest.fn() },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        PricingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  describe('getVenueSchedule', () => {
    it('harus menghasilkan matriks jadwal harian lengkap dengan status AVAILABLE', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenue);
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.recurringSlot.findMany.mockResolvedValue([]);

      const result = await service.getVenueSchedule(
        'champion-arena',
        '2026-11-23',
      );

      expect(result.venue.slug).toBe('champion-arena');
      expect(result.courts).toHaveLength(1);
      // Jam operasional 7 s.d. 24 = 17 jam
      expect(result.courts[0].slots).toHaveLength(17);
      expect(result.courts[0].slots[0].status).toBe('AVAILABLE');
      expect(result.courts[0].slots[0].rate).toBe(150000);
    });

    it('harus menandai status BOOKED untuk jam yang sudah dikonfirmasi', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenue);
      prisma.booking.findMany.mockResolvedValue([
        {
          id: 'b1',
          courtId: 'court-1',
          startTime: new Date('2026-11-23T19:00:00Z'),
          endTime: new Date('2026-11-23T21:00:00Z'),
          status: 'CONFIRMED',
          createdAt: new Date(),
          bookingCode: 'BK-1',
        },
      ]);
      prisma.recurringSlot.findMany.mockResolvedValue([]);

      const result = await service.getVenueSchedule(
        'champion-arena',
        '2026-11-23',
      );

      const slot19 = result.courts[0].slots.find((s) => s.hour === 19);
      const slot20 = result.courts[0].slots.find((s) => s.hour === 20);
      const slot21 = result.courts[0].slots.find((s) => s.hour === 21);

      expect(slot19?.status).toBe('BOOKED');
      expect(slot20?.status).toBe('BOOKED');
      expect(slot21?.status).toBe('AVAILABLE');
    });

    it('harus melempar NotFoundException jika venue tidak ada', async () => {
      prisma.venue.findFirst.mockResolvedValue(null);
      await expect(
        service.getVenueSchedule('nonexistent', '2026-11-23'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPublicBooking — FR-001 Skenario 2 (Pencegahan Double Booking)', () => {
    const validDto = {
      venueSlug: 'champion-arena',
      courtId: 'court-1',
      bookingDate: '2026-11-23',
      startHour: 20,
      durationHours: 1, // 20:00 - 21:00
      customerName: 'Budi Santoso',
      customerPhone: '081234567890',
    };

    it('Pemesan A: berhasil mengunci slot saat kosong (status PENDING_PAYMENT)', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenue);
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.recurringSlot.findFirst.mockResolvedValue(null);
      prisma.customer.upsert.mockResolvedValue({ id: 'cust-1' });
      prisma.booking.create.mockImplementation((args: any) =>
        Promise.resolve({
          id: 'booking-1',
          ...args.data,
          createdAt: new Date(),
          court: { id: 'court-1', name: 'Lapangan 1', type: 'FUTSAL_VINYL' },
          customer: { fullName: 'Budi Santoso', phone: '081234567890' },
        }),
      );

      const result = await service.createPublicBooking(validDto);

      expect(result.bookingId).toBe('booking-1');
      expect(result.status).toBe('PENDING_PAYMENT');
      expect(result.courtTotal).toBe(300000);
      expect(result.depositAmount).toBe(150000); // DP 50%
      expect(result.remainingDue).toBe(150000);
      expect(result.expiresAt).toBeDefined();
    });

    it('Pemesan B: ditolak dengan pesan tepat saat slot sedang diproses pemesan lain (< 15 menit)', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenue);
      // Pemesan A sedang dalam proses pembayaran 5 menit yang lalu
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      prisma.booking.findMany.mockResolvedValue([
        {
          id: 'booking-a',
          courtId: 'court-1',
          status: 'PENDING_PAYMENT',
          createdAt: fiveMinutesAgo,
        },
      ]);

      await expect(service.createPublicBooking(validDto)).rejects.toThrow(
        new ConflictException(
          'Maaf, slot waktu ini sedang diproses oleh pemesan lain.',
        ),
      );
    });

    it('harus menolak jika slot sudah dipesan oleh pemesan yang sudah CONFIRMED', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenue);
      prisma.booking.findMany.mockResolvedValue([
        {
          id: 'booking-confirmed',
          courtId: 'court-1',
          status: 'CONFIRMED',
          createdAt: new Date(),
        },
      ]);

      await expect(service.createPublicBooking(validDto)).rejects.toThrow(
        /sudah dipesan oleh tim lain/,
      );
    });

    it('harus menolak jika jam sewa di luar jam operasional venue', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenue);

      await expect(
        service.createPublicBooking({
          ...validDto,
          startHour: 5, // Buka jam 7
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('harus menolak jika slot bentrok dengan member rutin', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenue);
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.recurringSlot.findFirst.mockResolvedValue({ id: 'rec-1' });

      await expect(service.createPublicBooking(validDto)).rejects.toThrow(
        /member rutin/,
      );
    });
  });

  describe('getBookingByCode', () => {
    it('harus mengembalikan detail booking berdasarkan kode', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'b1',
        bookingCode: 'BK-FUT-2611-001',
        status: 'CONFIRMED',
        createdAt: new Date(),
        bookingDate: new Date('2026-11-23T00:00:00Z'),
        startTime: new Date('2026-11-23T20:00:00Z'),
        endTime: new Date('2026-11-23T22:00:00Z'),
        durationHours: 2,
        courtTotal: BigInt(600_000),
        depositAmount: BigInt(300_000),
        remainingDue: BigInt(300_000),
        isOpenSparring: false,
        court: {
          name: 'Lapangan 1',
          type: 'FUTSAL_VINYL',
          venue: { name: 'Champion', address: 'Jl. Sudirman', city: 'Jakarta' },
        },
        customer: { fullName: 'Budi' },
      });

      const result = await service.getBookingByCode('BK-FUT-2611-001');
      expect(result.bookingCode).toBe('BK-FUT-2611-001');
      expect(result.courtTotal).toBe(600000);
    });

    it('harus mengubah status menjadi EXPIRED jika pending payment > 15 menit', async () => {
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
      prisma.booking.findUnique.mockResolvedValue({
        id: 'b-expired',
        bookingCode: 'BK-EXPIRED',
        status: 'PENDING_PAYMENT',
        createdAt: twentyMinutesAgo,
        bookingDate: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        durationHours: 1,
        courtTotal: BigInt(200_000),
        depositAmount: BigInt(100_000),
        remainingDue: BigInt(100_000),
        court: { name: 'Lap 1', venue: {} },
        customer: { fullName: 'Budi' },
      });
      prisma.booking.update.mockResolvedValue({ status: 'EXPIRED' });

      const result = await service.getBookingByCode('BK-EXPIRED');
      expect(result.status).toBe('EXPIRED');
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'EXPIRED' } }),
      );
    });

    it('harus melempar NotFoundException jika booking tidak ditemukan', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.getBookingByCode('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('expireStaleBookings', () => {
    it('harus menjalankan updateMany untuk booking yang kedaluwarsa', async () => {
      prisma.booking.updateMany.mockResolvedValue({ count: 3 });
      const result = await service.expireStaleBookings();
      expect(result.expiredCount).toBe(3);
    });
  });
});
