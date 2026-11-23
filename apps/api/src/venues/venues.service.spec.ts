import { Test, TestingModule } from '@nestjs/testing';
import { VenuesService } from './venues.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('VenuesService (Unit Tests)', () => {
  let service: VenuesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      venue: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((promises) => Promise.all(promises)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [VenuesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<VenuesService>(VenuesService);
  });

  describe('create', () => {
    it('harus membuat venue baru jika slug unik dalam tenant', async () => {
      prisma.venue.findUnique.mockResolvedValue(null);
      prisma.venue.create.mockResolvedValue({
        id: 'v1',
        tenantId: 't1',
        name: 'Arena Futsal',
        slug: 'arena-futsal',
      });

      const result = await service.create('t1', {
        name: 'Arena Futsal',
        slug: 'arena-futsal',
        phone: '08123456789',
        address: 'Jl. Sudirman No. 1',
        city: 'Jakarta',
      });

      expect(result.id).toBe('v1');
      expect(prisma.venue.create).toHaveBeenCalled();
    });

    it('harus melempar ConflictException jika slug sudah dipakai di tenant yang sama', async () => {
      prisma.venue.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create('t1', {
          name: 'Arena Futsal',
          slug: 'arena-futsal',
          phone: '08123456789',
          address: 'Jl. Sudirman No. 1',
          city: 'Jakarta',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('harus mengembalikan daftar venue dengan paginasi dan filter tenant', async () => {
      prisma.venue.findMany.mockResolvedValue([{ id: 'v1', name: 'Venue 1' }]);
      prisma.venue.count.mockResolvedValue(1);

      const result = await service.findAll('t1', 1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('findOne', () => {
    it('harus mengembalikan venue jika ditemukan', async () => {
      prisma.venue.findFirst.mockResolvedValue({
        id: 'v1',
        name: 'Venue 1',
        courts: [],
      });

      const result = await service.findOne('t1', 'v1');
      expect(result.id).toBe('v1');
    });

    it('harus melempar NotFoundException jika venue tidak ada', async () => {
      prisma.venue.findFirst.mockResolvedValue(null);
      await expect(service.findOne('t1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('harus memperbarui venue jika ada', async () => {
      prisma.venue.findFirst.mockResolvedValue({ id: 'v1' });
      prisma.venue.update.mockResolvedValue({ id: 'v1', name: 'Updated' });

      const result = await service.update('t1', 'v1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('harus melempar ConflictException jika slug bentrok dengan venue lain', async () => {
      prisma.venue.findFirst
        .mockResolvedValueOnce({ id: 'v1' }) // assertVenueExists
        .mockResolvedValueOnce({ id: 'v2' }); // conflict check

      await expect(
        service.update('t1', 'v1', { slug: 'already-used-slug' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove (soft delete)', () => {
    it('harus mengisi deletedAt pada venue yang dihapus', async () => {
      prisma.venue.findFirst.mockResolvedValue({ id: 'v1' });
      prisma.venue.update.mockResolvedValue({
        id: 'v1',
        deletedAt: new Date(),
      });

      const result = await service.remove('t1', 'v1');
      expect(result.id).toBe('v1');
      expect(prisma.venue.update).toHaveBeenCalled();
    });
  });
});
