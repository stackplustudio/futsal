import { Test, TestingModule } from '@nestjs/testing';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Reflector } from '@nestjs/core';

describe('VenuesController (Unit Tests)', () => {
  let controller: VenuesController;
  let service: jest.Mocked<VenuesService>;

  const mockUser: AuthUser = {
    id: 'u1',
    email: 'owner@futsal.com',
    role: 'VENUE_OWNER',
    tenantId: 'tenant-123',
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VenuesController],
      providers: [{ provide: VenuesService, useValue: mockService }, Reflector],
    }).compile();

    controller = module.get<VenuesController>(VenuesController);
    service = module.get(VenuesService);
  });

  it('create harus memanggil service.create dengan tenantId dari user', async () => {
    const dto = {
      name: 'Arena 1',
      slug: 'arena-1',
      phone: '08123456789',
      address: 'Jl. Melati',
      city: 'Bandung',
    };
    service.create.mockResolvedValue({ id: 'v1', ...dto } as any);

    const result = await controller.create(dto, mockUser);
    expect(result.id).toBe('v1');
    expect(service.create).toHaveBeenCalledWith('tenant-123', dto);
  });

  it('findAll harus memanggil service.findAll dengan paginasi', async () => {
    service.findAll.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    const result = await controller.findAll(mockUser, '1', '20');
    expect(result.data).toEqual([]);
    expect(service.findAll).toHaveBeenCalledWith('tenant-123', 1, 20);
  });

  it('findOne harus memanggil service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'v1', name: 'Arena 1' } as any);
    const result = await controller.findOne('v1', mockUser);
    expect(result.id).toBe('v1');
    expect(service.findOne).toHaveBeenCalledWith('tenant-123', 'v1');
  });

  it('update harus memanggil service.update', async () => {
    service.update.mockResolvedValue({ id: 'v1', name: 'Arena Baru' } as any);
    const result = await controller.update(
      'v1',
      { name: 'Arena Baru' },
      mockUser,
    );
    expect(result.name).toBe('Arena Baru');
    expect(service.update).toHaveBeenCalledWith('tenant-123', 'v1', {
      name: 'Arena Baru',
    });
  });

  it('remove harus memanggil service.remove', async () => {
    service.remove.mockResolvedValue({
      id: 'v1',
      name: 'Arena 1',
      deletedAt: new Date(),
    } as any);
    const result = await controller.remove('v1', mockUser);
    expect(result.id).toBe('v1');
    expect(service.remove).toHaveBeenCalledWith('tenant-123', 'v1');
  });

  it('harus melempar error jika user tidak memiliki tenantId', () => {
    const userWithoutTenant: AuthUser = {
      id: 'u2',
      email: 'no-tenant@futsal.com',
      role: 'PLAYER',
    };

    expect(() => controller.findAll(userWithoutTenant, '1', '20')).toThrow(
      'User tidak memiliki tenantId',
    );
  });
});
