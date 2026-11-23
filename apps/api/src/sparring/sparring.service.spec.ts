import { Test, TestingModule } from '@nestjs/testing';
import { SparringService } from './sparring.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SparringService', () => {
  let service: SparringService;

  const mockPrisma = {
    booking: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const sampleBooking = {
    id: 'bk-01',
    bookingCode: 'BK-FUT-2611-001',
    status: 'CONFIRMED',
    bookingDate: new Date('2026-11-28'),
    startTime: new Date('2026-11-28T12:00:00Z'),
    endTime: new Date('2026-11-28T14:00:00Z'),
    durationHours: 2,
    courtTotal: BigInt(300000),
    isOpenSparring: true,
    sparringLevel: 'Casual',
    notes: 'Sparring santai 5vs5',
    court: {
      id: 'court-01',
      name: 'Lapangan 1 - Vinyl Pro',
      type: 'VINYL',
      venue: {
        id: 'venue-01',
        name: 'Champion Arena',
        slug: 'champion-arena',
        address: 'Jl. Olahraga No. 10',
      },
    },
    customer: {
      id: 'cust-01',
      fullName: 'Budi Santoso',
      teamName: 'Garuda Muda FC',
      phone: '081234567890',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SparringService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SparringService>(SparringService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOpenSparrings', () => {
    it('should return mapped sparring list with masked phone and estimated 50% cost', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([sampleBooking]);

      const res = await service.getOpenSparrings('champion-arena', 'Casual');

      expect(res).toHaveLength(1);
      expect(res[0].bookingCode).toBe('BK-FUT-2611-001');
      expect(res[0].maskedPhone).toBe('0812****890');
      expect(res[0].courtTotal).toBe(300000);
      expect(res[0].estimatedCostPerTeam).toBe(150000);
      expect(res[0].hostTeamName).toBe('Garuda Muda FC');
    });

    it('should handle short or empty phone gracefully', async () => {
      const shortPhoneBooking = {
        ...sampleBooking,
        customer: { ...sampleBooking.customer, phone: '123' },
      };
      mockPrisma.booking.findMany.mockResolvedValue([shortPhoneBooking]);

      const res = await service.getOpenSparrings();
      expect(res[0].maskedPhone).toBe('08**********');
    });
  });

  describe('toggleSparring', () => {
    it('should throw NotFoundException if booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleSparring('non-existent', { isOpenSparring: true }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if booking status is not CONFIRMED or PLAYING', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...sampleBooking,
        status: 'PENDING_PAYMENT',
      });

      await expect(
        service.toggleSparring('bk-01', { isOpenSparring: true }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enable sparring on valid booking', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(sampleBooking);
      mockPrisma.booking.update.mockResolvedValue({
        ...sampleBooking,
        isOpenSparring: true,
        sparringLevel: 'Kompetitif',
      });

      const res = await service.toggleSparring('bk-01', {
        isOpenSparring: true,
        sparringLevel: 'Kompetitif',
        notes: 'Butuh lawan tangguh',
      });

      expect(res.isOpenSparring).toBe(true);
      expect(res.sparringLevel).toBe('Kompetitif');
      expect(res.message).toContain('berhasil diaktifkan');
    });

    it('should disable sparring and reset level', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(sampleBooking);
      mockPrisma.booking.update.mockResolvedValue({
        ...sampleBooking,
        isOpenSparring: false,
        sparringLevel: null,
      });

      const res = await service.toggleSparring('bk-01', {
        isOpenSparring: false,
      });

      expect(res.isOpenSparring).toBe(false);
      expect(res.message).toContain('berhasil ditutup');
    });
  });

  describe('challengeSparring', () => {
    const challengeDto = {
      challengerTeamName: 'Bhayangkara FC',
      challengerCaptainName: 'Agus Wijaya',
      challengerPhone: '085711223344',
      consentGiven: true,
    };

    it('should throw BadRequestException if consentGiven is false (UU PDP check)', async () => {
      await expect(
        service.challengeSparring('bk-01', {
          ...challengeDto,
          consentGiven: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.challengeSparring('non-existent', challengeDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if isOpenSparring is false', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...sampleBooking,
        isOpenSparring: false,
      });

      await expect(
        service.challengeSparring('bk-01', challengeDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return valid WhatsApp link with pre-composed invitation message', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(sampleBooking);

      const res = await service.challengeSparring('bk-01', challengeDto);

      expect(res.success).toBe(true);
      expect(res.whatsappUrl).toContain('https://wa.me/6281234567890');
      expect(res.whatsappUrl).toContain(encodeURIComponent('Bhayangkara FC'));
      expect(res.hostTeam).toBe('Garuda Muda FC');
    });
  });
});
