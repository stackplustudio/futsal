import { Test, TestingModule } from '@nestjs/testing';
import { CourtsController } from './courts.controller';
import { CourtsService } from './courts.service';
import { Reflector } from '@nestjs/core';
import { CourtType } from './dto/create-court.dto';
import { DayType } from './dto/create-pricing-rule.dto';

describe('CourtsController (Unit Tests)', () => {
  let controller: CourtsController;
  let service: jest.Mocked<CourtsService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      addPricingRule: jest.fn(),
      removePricingRule: jest.fn(),
      previewPricing: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourtsController],
      providers: [{ provide: CourtsService, useValue: mockService }, Reflector],
    }).compile();

    controller = module.get<CourtsController>(CourtsController);
    service = module.get(CourtsService);
  });

  it('create harus memanggil service.create', async () => {
    const dto = { name: 'Lap 1', type: CourtType.FUTSAL_VINYL };
    service.create.mockResolvedValue({
      id: 'c1',
      venueId: 'v1',
      ...dto,
    } as any);

    const result = await controller.create('v1', dto);
    expect(result.id).toBe('c1');
    expect(service.create).toHaveBeenCalledWith('v1', dto);
  });

  it('findAll harus memanggil service.findAll', async () => {
    service.findAll.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    const result = await controller.findAll('v1', '1', '20');
    expect(result.data).toEqual([]);
    expect(service.findAll).toHaveBeenCalledWith('v1', 1, 20);
  });

  it('findOne harus memanggil service.findOne', async () => {
    service.findOne.mockResolvedValue({ id: 'c1' } as any);
    const result = await controller.findOne('v1', 'c1');
    expect(result.id).toBe('c1');
    expect(service.findOne).toHaveBeenCalledWith('v1', 'c1');
  });

  it('update harus memanggil service.update', async () => {
    service.update.mockResolvedValue({ id: 'c1', name: 'Updated' } as any);
    const result = await controller.update('v1', 'c1', { name: 'Updated' });
    expect(result.name).toBe('Updated');
  });

  it('remove harus memanggil service.remove', async () => {
    service.remove.mockResolvedValue({
      id: 'c1',
      deletedAt: new Date(),
    } as any);
    const result = await controller.remove('v1', 'c1');
    expect(result.id).toBe('c1');
  });

  it('addPricingRule harus memanggil service.addPricingRule', async () => {
    const ruleDto = {
      dayType: DayType.WEEKDAY,
      startHour: 18,
      endHour: 24,
      hourlyRate: 300_000,
    };
    service.addPricingRule.mockResolvedValue({
      id: 'r1',
      courtId: 'c1',
      ...ruleDto,
    });

    const result = await controller.addPricingRule('v1', 'c1', ruleDto);
    expect(result.id).toBe('r1');
    expect(service.addPricingRule).toHaveBeenCalledWith('v1', 'c1', ruleDto);
  });

  it('previewPricing harus memanggil service.previewPricing', async () => {
    service.previewPricing.mockResolvedValue({ courtTotal: 500000 } as any);
    const result = await controller.previewPricing(
      'v1',
      'c1',
      '17',
      '19',
      '2026-11-23',
    );
    expect(result.courtTotal).toBe(500000);
    expect(service.previewPricing).toHaveBeenCalledWith(
      'v1',
      'c1',
      17,
      19,
      '2026-11-23',
    );
  });
});
