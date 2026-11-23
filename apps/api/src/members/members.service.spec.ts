import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MembersService } from './members.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MembersService', () => {
  let service: MembersService;
  let prisma: {
    venue: { findFirst: jest.Mock };
    court: { findFirst: jest.Mock };
    customer: { findFirst: jest.Mock; create: jest.Mock };
    recurringSlot: {
      findFirst: jest.Mock;
      create: jest.Mock;
      deleteMany: jest.Mock;
    };
    booking: { findFirst: jest.Mock };
    memberContract: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const mockVenue = {
    id: 'venue-1',
    tenantId: 'tenant-1',
    name: 'Champion Arena',
    slug: 'champion-arena',
    courts: [
      { id: 'court-1', name: 'Lapangan 1 - Vinyl Pro', type: 'FUTSAL_VINYL' },
    ],
  };

  const mockCourt = {
    id: 'court-1',
    name: 'Lapangan 1 - Vinyl Pro',
    venueId: 'venue-1',
  };

  const mockCustomer = {
    id: 'cust-1',
    fullName: 'Kapten Budi',
    phone: '08123456789',
    teamName: 'Komunitas Anak Futsal FC',
  };

  beforeEach(async () => {
    prisma = {
      venue: { findFirst: jest.fn() },
      court: { findFirst: jest.fn() },
      customer: { findFirst: jest.fn(), create: jest.fn() },
      recurringSlot: {
        findFirst: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      booking: { findFirst: jest.fn() },
      memberContract: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MembersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createContract', () => {
    const validDto = {
      venueSlug: 'champion-arena',
      courtId: 'court-1',
      customerName: 'Kapten Budi',
      customerPhone: '08123456789',
      teamName: 'Komunitas Anak Futsal FC',
      dayOfWeek: 4, // Kamis
      startHour: 20,
      durationHours: 2,
      startDate: '2026-12-01',
      monthsDuration: 1,
      monthlyFee: 1200000,
    };

    it('should create member contract and recurring slots', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenue);
      prisma.court.findFirst.mockResolvedValue(mockCourt);
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      prisma.recurringSlot.findFirst.mockResolvedValue(null);
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.memberContract.create.mockResolvedValue({ id: 'contract-1' });
      prisma.recurringSlot.create.mockResolvedValue({ id: 'rs-1' });

      const res = await service.createContract(validDto);
      expect(res.contractId).toBe('contract-1');
      expect(res.teamName).toBe('Komunitas Anak Futsal FC');
      expect(res.totalSlotsLocked).toBeGreaterThan(0);
      expect(prisma.recurringSlot.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if venue not found', async () => {
      prisma.venue.findFirst.mockResolvedValue(null);
      await expect(service.createContract(validDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if recurring slot already occupied', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenue);
      prisma.court.findFirst.mockResolvedValue(mockCourt);
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      prisma.recurringSlot.findFirst.mockResolvedValue({ id: 'existing-rs' });

      await expect(service.createContract(validDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if public booking conflicts', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenue);
      prisma.court.findFirst.mockResolvedValue(mockCourt);
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      prisma.recurringSlot.findFirst.mockResolvedValue(null);
      prisma.booking.findFirst.mockResolvedValue({
        id: 'b-1',
        bookingCode: 'BK-001',
      });

      await expect(service.createContract(validDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('listContracts', () => {
    it('should return mapped contracts', async () => {
      prisma.venue.findFirst.mockResolvedValue(mockVenue);
      prisma.memberContract.findMany.mockResolvedValue([
        {
          id: 'c-1',
          courtId: 'court-1',
          dayOfWeek: 4,
          startHour: 20,
          durationHours: 2,
          startDate: new Date('2026-12-01'),
          endDate: new Date('2027-01-01'),
          monthlyFee: BigInt(1200000),
          isActive: true,
          customer: mockCustomer,
          slots: [{ id: 's1' }, { id: 's2' }],
        },
      ]);

      const res = await service.listContracts('champion-arena');
      expect(res.length).toBe(1);
      expect(res[0].dayName).toBe('Kamis');
      expect(res[0].totalSlots).toBe(2);
      expect(res[0].monthlyFee).toBe(1200000);
    });
  });

  describe('cancelContract', () => {
    it('should delete recurring slots and soft delete contract', async () => {
      prisma.memberContract.findUnique.mockResolvedValue({ id: 'c-1' });

      const res = await service.cancelContract('c-1');
      expect(res.success).toBe(true);
      expect(prisma.recurringSlot.deleteMany).toHaveBeenCalledWith({
        where: { contractId: 'c-1' },
      });
      expect(prisma.memberContract.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'c-1' },
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });

    it('should throw NotFoundException if contract not found', async () => {
      prisma.memberContract.findUnique.mockResolvedValue(null);
      await expect(service.cancelContract('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
